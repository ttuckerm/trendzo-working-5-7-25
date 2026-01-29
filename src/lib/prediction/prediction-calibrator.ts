/**
 * Prediction Calibrator
 *
 * Applies calibration rules based on Pack V visual analysis and transcription status
 * to improve prediction accuracy for edge cases (silent videos, no speech, etc.)
 *
 * Rules:
 * 1. Confidence penalty for skipped/no-speech transcriptions
 * 2. DPS cap for silent videos with low visual scores
 * 3. Logging Pack V features for training data
 */

import { VisualRubricResult } from '@/lib/rubric-engine';

export interface CalibrationInput {
  rawDps: number;
  rawConfidence: number;

  // Transcription info
  transcriptionSource: string;
  transcriptionSkipped: boolean;
  transcriptionSkippedReason?: string;
  resolvedTranscriptLength?: number; // Length of resolved transcript (for language signal check)

  // Audio info (from FFmpeg)
  audioPresent: boolean;

  // Pack V results
  packV: VisualRubricResult | null;

  // Style/Niche context (for visual-first allowlist)
  detectedStyle?: string;
  niche?: string;

  // Context
  videoId: string;
  runId: string;
}

export interface CalibrationResult {
  calibratedDps: number;
  calibratedConfidence: number;
  adjustments: CalibrationAdjustment[];
  trainingFeatures: PackVTrainingFeatures;
}

export interface CalibrationAdjustment {
  rule: string;
  reason: string;
  dpsBefore: number;
  dpsAfter: number;
  confidenceBefore: number;
  confidenceAfter: number;
}

/**
 * Pack V features formatted for training data logging
 */
export interface PackVTrainingFeatures {
  packV_overall: number | null;
  packV_visual_hook: number | null;
  packV_pacing: number | null;
  packV_pattern_interrupts: number | null;
  packV_visual_clarity: number | null;
  packV_style_fit: number | null;
  transcription_skipped: boolean;
  audio_present: boolean;
  calibration_applied: boolean;
}

// ============================================================================
// Calibration Rules & Constants
// ============================================================================

const CONFIDENCE_PENALTY_NO_SPEECH = 0.7; // Multiply confidence by this when no speech
const SILENT_VIDEO_DPS_CAP = 55; // Max DPS for silent videos with low visual scores
const SILENT_VIDEO_DPS_CAP_VISUAL_FIRST = 65; // Looser cap for visual-first styles/niches
const SILENT_VIDEO_PACKV_THRESHOLD = 50; // Pack V must be above this to avoid cap
const MIN_TRANSCRIPT_LENGTH = 10; // Minimum chars to count as "has language signal"

/**
 * Visual-first styles where silent videos are legitimate and should have looser caps.
 * These formats succeed primarily through visuals, not audio/speech.
 * This is the PRIMARY determination for visual-first content.
 */
const VISUAL_FIRST_STYLES: string[] = [
  'meme_edit',
  'satisfying',
  'asmr',
  'cooking_montage',
  'product_demo',
  'timelapse',
  'cinematic',
  'tutorial_silent',
  'art_process',
  'transformation',
];

/**
 * Visual-first niches - FALLBACK ONLY when detected_style is missing.
 * Intentionally small/conservative list to avoid false positives.
 * Broad niches (travel, beauty, fashion) removed - they need style confirmation.
 */
const VISUAL_FIRST_NICHES_FALLBACK: string[] = [
  'asmr',
  'satisfying',
  'cooking',
  'art_process',
  'product_demo',
];

/**
 * Rule 1: Apply confidence penalty for skipped/no-speech transcriptions
 */
function applyConfidencePenalty(input: CalibrationInput): CalibrationAdjustment | null {
  const { transcriptionSkipped, transcriptionSkippedReason, transcriptionSource, rawConfidence } = input;

  // Apply penalty if:
  // - Transcription was skipped
  // - No speech was detected
  // - Source is 'none' or 'skipped'
  const shouldApplyPenalty =
    transcriptionSkipped ||
    transcriptionSkippedReason === 'no_speech_detected' ||
    transcriptionSource === 'none' ||
    transcriptionSource === 'skipped';

  if (!shouldApplyPenalty) {
    return null;
  }

  const newConfidence = rawConfidence * CONFIDENCE_PENALTY_NO_SPEECH;

  return {
    rule: 'confidence_penalty_no_speech',
    reason: `Transcription ${transcriptionSkipped ? 'skipped' : 'has no speech'} - text-dependent predictors weakened`,
    dpsBefore: input.rawDps,
    dpsAfter: input.rawDps, // DPS unchanged by this rule
    confidenceBefore: rawConfidence,
    confidenceAfter: newConfidence,
  };
}

/**
 * Check if video has a valid language signal (transcript exists)
 */
function hasLanguageSignal(input: CalibrationInput): boolean {
  const { transcriptionSkipped, transcriptionSource, resolvedTranscriptLength } = input;

  // If transcript exists with sufficient length, we have language signal
  if (resolvedTranscriptLength !== undefined && resolvedTranscriptLength >= MIN_TRANSCRIPT_LENGTH) {
    return true;
  }

  // If transcription succeeded (not skipped, valid source), we have language signal
  if (!transcriptionSkipped && transcriptionSource !== 'none' && transcriptionSource !== 'skipped') {
    return true;
  }

  return false;
}

/**
 * Check if style/niche is in the visual-first allowlist.
 *
 * PRIORITY ORDER:
 * 1. detected_style (PRIMARY) - if present, use style allowlist
 * 2. niche (FALLBACK ONLY) - only if detected_style is missing/empty
 *
 * This prevents broad niches from triggering looser caps without style confirmation.
 */
function isVisualFirstContent(input: CalibrationInput): { isVisualFirst: boolean; matchedOn?: string } {
  const { detectedStyle, niche } = input;

  // PRIMARY: Check style allowlist first (case-insensitive, partial match)
  if (detectedStyle && detectedStyle.trim() !== '') {
    const styleLower = detectedStyle.toLowerCase();
    const matchedStyle = VISUAL_FIRST_STYLES.find(s =>
      styleLower.includes(s) || s.includes(styleLower)
    );
    if (matchedStyle) {
      return { isVisualFirst: true, matchedOn: `style:${matchedStyle}` };
    }
    // Style was detected but not in allowlist - do NOT fall back to niche
    // This ensures broad niches (beauty, travel) don't get looser cap
    // unless their detected_style confirms visual-first content
    return { isVisualFirst: false };
  }

  // FALLBACK: Only check niche if detected_style is missing/empty
  // Uses conservative allowlist (asmr, satisfying, cooking, art_process, product_demo)
  if (niche) {
    const nicheLower = niche.toLowerCase();
    const matchedNiche = VISUAL_FIRST_NICHES_FALLBACK.find(n =>
      nicheLower.includes(n) || n.includes(nicheLower)
    );
    if (matchedNiche) {
      return { isVisualFirst: true, matchedOn: `niche_fallback:${matchedNiche}` };
    }
  }

  return { isVisualFirst: false };
}

/**
 * Rule 2: Apply DPS cap for silent videos with low visual scores
 *
 * GUARDRAILS:
 * 1. Only applies if NO language signal (no valid transcript)
 * 2. Uses looser cap (65 vs 55) for visual-first styles/niches
 */
function applySilentVideoDpsCap(input: CalibrationInput, currentDps: number): CalibrationAdjustment | null {
  const { audioPresent, packV } = input;

  // Only apply to silent videos (no audio)
  if (audioPresent) {
    return null;
  }

  // GUARDRAIL 1: Don't cap if we have language signal (transcript exists)
  // This prevents nerfing videos that have text overlays or external captions
  if (hasLanguageSignal(input)) {
    console.log('[Calibrator]   Rule 2 SKIPPED: Language signal present (transcript exists)');
    return null;
  }

  const packVScore = packV?.overall_visual_score ?? 50;

  // Only apply cap if Pack V score is below threshold
  if (packVScore >= SILENT_VIDEO_PACKV_THRESHOLD) {
    return null;
  }

  // GUARDRAIL 2: Use looser cap for visual-first content
  const { isVisualFirst, matchedOn } = isVisualFirstContent(input);
  const effectiveCap = isVisualFirst ? SILENT_VIDEO_DPS_CAP_VISUAL_FIRST : SILENT_VIDEO_DPS_CAP;

  // Only apply if current DPS exceeds effective cap
  if (currentDps <= effectiveCap) {
    return null;
  }

  // Apply soft cap: blend toward cap based on how far below threshold
  // If packV is 40, that's 10 points below threshold (50), so stronger cap
  const distanceBelowThreshold = SILENT_VIDEO_PACKV_THRESHOLD - packVScore;
  const capStrength = Math.min(1, distanceBelowThreshold / 30); // Full cap at 30 points below

  const newDps = currentDps - (currentDps - effectiveCap) * capStrength;

  const visualFirstNote = isVisualFirst ? ` (visual-first ${matchedOn}, looser cap)` : '';

  return {
    rule: 'silent_video_dps_cap',
    reason: `Silent video (no audio) with low visual score (${packVScore}/100) - applying DPS cap to ${effectiveCap}${visualFirstNote}`,
    dpsBefore: currentDps,
    dpsAfter: Math.round(newDps * 10) / 10,
    confidenceBefore: input.rawConfidence,
    confidenceAfter: input.rawConfidence, // Confidence unchanged by this rule
  };
}

/**
 * Extract Pack V features for training data logging
 */
function extractTrainingFeatures(input: CalibrationInput, calibrationApplied: boolean): PackVTrainingFeatures {
  const { packV, transcriptionSkipped, audioPresent } = input;

  return {
    packV_overall: packV?.overall_visual_score ?? null,
    packV_visual_hook: packV?.visual_hook_score?.score ?? null,
    packV_pacing: packV?.pacing_score?.score ?? null,
    packV_pattern_interrupts: packV?.pattern_interrupts_score?.score ?? null,
    packV_visual_clarity: packV?.visual_clarity_score?.score ?? null,
    packV_style_fit: packV?.style_fit_score?.score ?? null,
    transcription_skipped: transcriptionSkipped,
    audio_present: audioPresent,
    calibration_applied: calibrationApplied,
  };
}

// ============================================================================
// Main Calibrator
// ============================================================================

/**
 * Apply all calibration rules to a prediction
 */
export function calibratePrediction(input: CalibrationInput): CalibrationResult {
  const adjustments: CalibrationAdjustment[] = [];
  let currentDps = input.rawDps;
  let currentConfidence = input.rawConfidence;

  console.log('[Calibrator] ═══════════════════════════════════════════════════════════');
  console.log(`[Calibrator] Starting calibration for video ${input.videoId}`);
  console.log(`[Calibrator]   Raw DPS: ${input.rawDps}, Raw Confidence: ${input.rawConfidence}`);
  console.log(`[Calibrator]   Audio present: ${input.audioPresent}`);
  console.log(`[Calibrator]   Transcription source: ${input.transcriptionSource}, skipped: ${input.transcriptionSkipped}`);
  console.log(`[Calibrator]   Pack V score: ${input.packV?.overall_visual_score ?? 'N/A'}`);

  // Rule 1: Confidence penalty for no speech
  const confidenceAdjustment = applyConfidencePenalty(input);
  if (confidenceAdjustment) {
    adjustments.push(confidenceAdjustment);
    currentConfidence = confidenceAdjustment.confidenceAfter;
    console.log(`[Calibrator]   Rule 1 APPLIED: ${confidenceAdjustment.reason}`);
    console.log(`[Calibrator]     Confidence: ${confidenceAdjustment.confidenceBefore} → ${confidenceAdjustment.confidenceAfter}`);
  } else {
    console.log('[Calibrator]   Rule 1 (confidence penalty): Not applicable');
  }

  // Rule 2: DPS cap for silent videos
  const dpsCapAdjustment = applySilentVideoDpsCap(input, currentDps);
  if (dpsCapAdjustment) {
    adjustments.push(dpsCapAdjustment);
    currentDps = dpsCapAdjustment.dpsAfter;
    console.log(`[Calibrator]   Rule 2 APPLIED: ${dpsCapAdjustment.reason}`);
    console.log(`[Calibrator]     DPS: ${dpsCapAdjustment.dpsBefore} → ${dpsCapAdjustment.dpsAfter}`);
  } else {
    console.log('[Calibrator]   Rule 2 (silent video DPS cap): Not applicable');
  }

  // Extract training features (Rule 3 data collection)
  const trainingFeatures = extractTrainingFeatures(input, adjustments.length > 0);

  console.log(`[Calibrator] Final: DPS ${input.rawDps} → ${currentDps}, Confidence ${input.rawConfidence} → ${currentConfidence}`);
  console.log(`[Calibrator] Training features extracted: ${Object.keys(trainingFeatures).length} fields`);
  console.log('[Calibrator] ═══════════════════════════════════════════════════════════');

  return {
    calibratedDps: currentDps,
    calibratedConfidence: currentConfidence,
    adjustments,
    trainingFeatures,
  };
}

/**
 * Log Pack V training features to database for next model retrain
 * This is Rule 3 implementation
 */
export async function logPackVTrainingFeatures(
  supabase: any,
  videoId: string,
  runId: string,
  features: PackVTrainingFeatures,
  actualDps?: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('training_features_packv')
      .upsert({
        video_id: videoId,
        run_id: runId,
        packv_overall: features.packV_overall,
        packv_visual_hook: features.packV_visual_hook,
        packv_pacing: features.packV_pacing,
        packv_pattern_interrupts: features.packV_pattern_interrupts,
        packv_visual_clarity: features.packV_visual_clarity,
        packv_style_fit: features.packV_style_fit,
        transcription_skipped: features.transcription_skipped,
        audio_present: features.audio_present,
        calibration_applied: features.calibration_applied,
        actual_dps: actualDps ?? null,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'run_id',
      });

    if (error) {
      // Table might not exist yet - log warning but don't fail
      console.warn('[Calibrator] Could not log Pack V training features:', error.message);
    } else {
      console.log(`[Calibrator] Pack V training features logged for run ${runId}`);
    }
  } catch (e: any) {
    console.warn('[Calibrator] Failed to log training features:', e.message);
  }
}
