/**
 * Prediction Calibrator
 *
 * Applies calibration rules based on Pack V visual analysis, transcription status,
 * and creator context to improve prediction accuracy.
 *
 * Rules:
 * 1. Confidence penalty for skipped/no-speech transcriptions
 * 2. VPS cap for silent videos with low visual scores
 * 3. Logging Pack V features for training data
 * 4. Conservative scaling for high VPS (LLM over-prediction correction)
 * 5. Creator context VPS adjustment (D6 integration, +/-5 cap, feature-flagged)
 */

import { VisualRubricResult } from '@/lib/rubric-engine';
import type { CreatorContext } from '@/lib/prediction/creator-context';

export interface CalibrationInput {
  rawVps: number;
  /** @deprecated Use rawVps instead */
  rawDps?: number;
  rawConfidence: number;

  // Transcription info
  transcriptionSource: string;
  transcriptionSkipped: boolean;
  transcriptionSkippedReason?: string;
  resolvedTranscriptLength?: number;
  // Native Whisper no-speech probability (WSP-003). When available, more accurate
  // than inferring "no speech" from transcript length alone.
  noSpeechProbability?: number;

  // Audio info (from FFmpeg)
  audioPresent: boolean;

  // Pack V results
  packV: VisualRubricResult | null;

  // Style/Niche context (for visual-first allowlist)
  detectedStyle?: string;
  niche?: string;

  // Creator context (D6 integration)
  creatorContext?: CreatorContext | null;

  // Context
  videoId: string;
  runId: string;
}

export interface CalibrationResult {
  calibratedVps: number;
  /** @deprecated Use calibratedVps instead */
  calibratedDps?: number;
  calibratedConfidence: number;
  adjustments: CalibrationAdjustment[];
  trainingFeatures: PackVTrainingFeatures;
}

export interface CalibrationAdjustment {
  rule: string;
  reason: string;
  vpsBefore: number;
  vpsAfter: number;
  /** @deprecated Use vpsBefore instead */
  dpsBefore?: number;
  /** @deprecated Use vpsAfter instead */
  dpsAfter?: number;
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
const SILENT_VIDEO_VPS_CAP = 55; // Max VPS for silent videos with low visual scores
const SILENT_VIDEO_VPS_CAP_VISUAL_FIRST = 65; // Looser cap for visual-first styles/niches
const SILENT_VIDEO_PACKV_THRESHOLD = 50; // Pack V must be above this to avoid cap
const MIN_TRANSCRIPT_LENGTH = 10; // Minimum chars to count as "has language signal"

// Rule 4: Conservative scaling for high predictions (prevents LLM over-prediction bias)
const HIGH_VPS_THRESHOLD = 60; // Apply scaling above this threshold
const HIGH_VPS_SCALING_FACTOR = 0.85; // Multiply by this (15% reduction)

// Rule 5: Creator context VPS adjustment (D6 integration)
const CREATOR_CONTEXT_MAX_DELTA = 5; // +/-5 VPS cap
const CREATOR_CONTEXT_NICHE_WEIGHT = 0.35;
const CREATOR_CONTEXT_DELIVERY_WEIGHT = 0.30;
const CREATOR_CONTEXT_PREFERENCE_WEIGHT = 0.35;

function CREATOR_CALIBRATION_ENABLED(): boolean {
  return process.env.CREATOR_CALIBRATION_ENABLED !== 'false'; // enabled by default
}

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
    vpsBefore: input.rawVps,
    vpsAfter: input.rawVps, // VPS unchanged by this rule
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
 * Rule 2: Apply VPS cap for silent videos with low visual scores
 *
 * GUARDRAILS:
 * 1. Only applies if NO language signal (no valid transcript)
 * 2. Uses looser cap (65 vs 55) for visual-first styles/niches
 */
function applySilentVideoVpsCap(input: CalibrationInput, currentVps: number): CalibrationAdjustment | null {
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
  const effectiveCap = isVisualFirst ? SILENT_VIDEO_VPS_CAP_VISUAL_FIRST : SILENT_VIDEO_VPS_CAP;

  // Only apply if current VPS exceeds effective cap
  if (currentVps <= effectiveCap) {
    return null;
  }

  // Apply soft cap: blend toward cap based on how far below threshold
  // If packV is 40, that's 10 points below threshold (50), so stronger cap
  const distanceBelowThreshold = SILENT_VIDEO_PACKV_THRESHOLD - packVScore;
  const capStrength = Math.min(1, distanceBelowThreshold / 30); // Full cap at 30 points below

  const newVps = currentVps - (currentVps - effectiveCap) * capStrength;

  const visualFirstNote = isVisualFirst ? ` (visual-first ${matchedOn}, looser cap)` : '';

  return {
    rule: 'silent_video_vps_cap',
    reason: `Silent video (no audio) with low visual score (${packVScore}/100) - applying VPS cap to ${effectiveCap}${visualFirstNote}`,
    vpsBefore: currentVps,
    vpsAfter: Math.round(newVps * 10) / 10,
    confidenceBefore: input.rawConfidence,
    confidenceAfter: input.rawConfidence, // Confidence unchanged by this rule
  };
}

/**
 * Rule 4: Apply conservative scaling for high VPS predictions
 *
 * LLMs tend to over-predict viral potential, especially for high-scoring content.
 * This rule applies a 15% reduction for predictions > 60 VPS to counteract this bias.
 *
 * Evidence: Historical data shows 25+ VPS over-prediction at the high end.
 */
function applyHighVpsScaling(currentVps: number, rawConfidence: number): CalibrationAdjustment | null {
  if (currentVps <= HIGH_VPS_THRESHOLD) {
    return null;
  }

  // Progressive scaling: stronger reduction for higher predictions
  // 60-70 VPS: 15% reduction (0.85x)
  // 70-80 VPS: 20% reduction (0.80x)
  // 80+ VPS: 25% reduction (0.75x)
  let scalingFactor: number;
  let reason: string;

  if (currentVps > 80) {
    scalingFactor = 0.75;
    reason = `Very high prediction (${currentVps.toFixed(1)}) - applying 25% LLM over-prediction correction`;
  } else if (currentVps > 70) {
    scalingFactor = 0.80;
    reason = `High prediction (${currentVps.toFixed(1)}) - applying 20% LLM over-prediction correction`;
  } else {
    scalingFactor = HIGH_VPS_SCALING_FACTOR;
    reason = `Moderately high prediction (${currentVps.toFixed(1)}) - applying 15% LLM over-prediction correction`;
  }

  const newVps = currentVps * scalingFactor;

  return {
    rule: 'high_vps_scaling',
    reason,
    vpsBefore: currentVps,
    vpsAfter: Math.round(newVps * 10) / 10,
    confidenceBefore: rawConfidence,
    confidenceAfter: rawConfidence, // Confidence unchanged by this rule
  };
}

/**
 * Rule 5: Creator context VPS adjustment (D6 undeferred)
 *
 * Uses creator calibration profile, delivery baseline, and niche alignment
 * to apply a bounded VPS adjustment (+/-5). This is the core D6 integration:
 * within-creator prediction context feeds into the VPS pipeline.
 *
 * Dimensions:
 * - Niche alignment: creator's calibrated niche vs video niche (35%)
 * - Delivery baseline: actual speaking quality from channel verification (30%)
 * - Preference strength: overall strength of calibration signals (35%)
 */
function applyCreatorContextAdjustment(
  input: CalibrationInput,
  currentVps: number,
  currentConfidence: number,
): CalibrationAdjustment | null {
  if (!CREATOR_CALIBRATION_ENABLED()) return null;

  const ctx = input.creatorContext;
  if (!ctx?.calibrationProfile) return null;

  const cal = ctx.calibrationProfile;
  let rawDelta = 0;

  // --- Dimension 1: Niche alignment ---
  // If creator's calibrated niche matches the video niche, positive signal.
  // Mismatch = slightly negative (creator stepping outside comfort zone).
  let nicheDelta = 0;
  if (input.niche && cal.selectedNiche) {
    if (cal.selectedNiche === input.niche) {
      nicheDelta = 1.0; // Perfect match
    } else {
      // Check if the video niche appears in the creator's niche affinity scores
      const affinity = cal.rawScores.nicheAffinity;
      const affinityScore = affinity?.[input.niche];
      if (typeof affinityScore === 'number' && affinityScore > 0) {
        nicheDelta = (affinityScore / 100) * 0.6; // Partial match scaled 0-0.6
      } else {
        nicheDelta = -0.5; // No affinity data for this niche
      }
    }
  }

  // --- Dimension 2: Delivery baseline (HARD GATE) ---
  // Delivery is a gate, not a gradient. Below-threshold delivery imposes steep penalties.
  let deliveryDelta = 0;
  if (ctx.channelData?.deliveryBaseline) {
    const db = ctx.channelData.deliveryBaseline;
    const wpmScore = Math.min(100, db.speakingRateWpm);
    const energyScore = db.energyLevel;
    const varianceBonus = Math.min(20, db.speakingRateVariance * 0.3);
    const silencePenalty = db.silenceRatio > 0.4 ? -15 : 0;
    const deliveryScore = (wpmScore * 0.3 + energyScore * 0.4 + varianceBonus + silencePenalty);

    // HARD GATE: step-function penalty for poor delivery
    if (deliveryScore < 30) {
      const newVps = Math.round((currentVps - 8) * 10) / 10;
      return {
        rule: 'creator_context_d6',
        reason: `Delivery hard gate: score=${deliveryScore.toFixed(0)} (<30) → -8 VPS penalty. Delivery coaching needed before content strategy.`,
        vpsBefore: currentVps,
        vpsAfter: Math.max(0, newVps),
        confidenceBefore: currentConfidence,
        confidenceAfter: currentConfidence,
      };
    }
    if (deliveryScore < 50) {
      const newVps = Math.round((currentVps - 4) * 10) / 10;
      return {
        rule: 'creator_context_d6',
        reason: `Delivery moderate gate: score=${deliveryScore.toFixed(0)} (30-50) → -4 VPS penalty. Delivery improvement recommended.`,
        vpsBefore: currentVps,
        vpsAfter: Math.max(0, newVps),
        confidenceBefore: currentConfidence,
        confidenceAfter: currentConfidence,
      };
    }
    // Above 50: proceed with weighted contribution
    deliveryDelta = (deliveryScore - 50) / 50;
  }

  // --- Dimension 3: Preference strength ---
  // Stronger calibration signals = more confident adjustment
  let prefDelta = 0;
  const scores = cal.rawScores;
  const dimensionValues: number[] = [];
  for (const dim of [scores.hookStylePreference, scores.toneMatch, scores.editingStyleFit, scores.contentFormatPreference]) {
    if (dim && typeof dim === 'object') {
      const vals = Object.values(dim).filter((v): v is number => typeof v === 'number');
      if (vals.length > 0) {
        const max = Math.max(...vals);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        // Strong preferences (high max, moderate variance) = positive signal
        dimensionValues.push(max / 100);
      }
    }
  }
  if (dimensionValues.length > 0) {
    const avgStrength = dimensionValues.reduce((a, b) => a + b, 0) / dimensionValues.length;
    prefDelta = (avgStrength - 0.5) * 2; // Normalize to -1..+1
  }

  // Weighted combination
  rawDelta =
    nicheDelta * CREATOR_CONTEXT_NICHE_WEIGHT +
    deliveryDelta * CREATOR_CONTEXT_DELIVERY_WEIGHT +
    prefDelta * CREATOR_CONTEXT_PREFERENCE_WEIGHT;

  // Scale to VPS range and clamp
  const vpsDelta = Math.max(-CREATOR_CONTEXT_MAX_DELTA, Math.min(CREATOR_CONTEXT_MAX_DELTA, rawDelta * CREATOR_CONTEXT_MAX_DELTA));

  // Skip tiny adjustments (noise)
  if (Math.abs(vpsDelta) < 0.3) return null;

  const newVps = Math.round((currentVps + vpsDelta) * 10) / 10;

  return {
    rule: 'creator_context_d6',
    reason: `Creator context: niche=${nicheDelta > 0 ? '+' : ''}${nicheDelta.toFixed(2)}, delivery=${deliveryDelta > 0 ? '+' : ''}${deliveryDelta.toFixed(2)}, prefs=${prefDelta > 0 ? '+' : ''}${prefDelta.toFixed(2)} → ${vpsDelta > 0 ? '+' : ''}${vpsDelta.toFixed(1)} VPS`,
    vpsBefore: currentVps,
    vpsAfter: newVps,
    confidenceBefore: currentConfidence,
    confidenceAfter: currentConfidence,
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
  let currentVps = input.rawVps;
  let currentConfidence = input.rawConfidence;

  console.log('[Calibrator] ═══════════════════════════════════════════════════════════');
  console.log(`[Calibrator] Starting calibration for video ${input.videoId}`);
  console.log(`[Calibrator]   Raw VPS: ${input.rawVps}, Raw Confidence: ${input.rawConfidence}`);
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

  // Rule 2: VPS cap for silent videos
  const vpsCapAdjustment = applySilentVideoVpsCap(input, currentVps);
  if (vpsCapAdjustment) {
    adjustments.push(vpsCapAdjustment);
    currentVps = vpsCapAdjustment.vpsAfter;
    console.log(`[Calibrator]   Rule 2 APPLIED: ${vpsCapAdjustment.reason}`);
    console.log(`[Calibrator]     VPS: ${vpsCapAdjustment.vpsBefore} → ${vpsCapAdjustment.vpsAfter}`);
  } else {
    console.log('[Calibrator]   Rule 2 (silent video VPS cap): Not applicable');
  }

  // Rule 4: DISABLED (Scoring Rescue, 2026-03-11)
  // This rule was labeled "LLM over-prediction correction" but LLMs are now
  // coach-lane-only (weight=0) and consensus-gated. Applying a 15-25% penalty
  // to deterministic/pattern-based scores has no empirical basis and compounds
  // with niche/account factors to over-compress VPS.
  // Kept as dead code for reference; remove after verification period.
  // const highVpsAdjustment = applyHighVpsScaling(currentVps, currentConfidence);
  console.log('[Calibrator]   Rule 4 (high VPS scaling): DISABLED — LLMs already coach-lane-only');

  // Rule 5: Creator context VPS adjustment (D6 integration)
  const creatorAdjustment = applyCreatorContextAdjustment(input, currentVps, currentConfidence);
  if (creatorAdjustment) {
    adjustments.push(creatorAdjustment);
    currentVps = creatorAdjustment.vpsAfter;
    console.log(`[Calibrator]   Rule 5 APPLIED: ${creatorAdjustment.reason}`);
    console.log(`[Calibrator]     VPS: ${creatorAdjustment.vpsBefore} → ${creatorAdjustment.vpsAfter}`);
  } else {
    console.log(`[Calibrator]   Rule 5 (creator context D6): ${input.creatorContext?.calibrationProfile ? 'adjustment too small' : 'no creator context'}`);
  }

  // Extract training features (Rule 3 data collection)
  const trainingFeatures = extractTrainingFeatures(input, adjustments.length > 0);

  console.log(`[Calibrator] Final: VPS ${input.rawVps} → ${currentVps}, Confidence ${input.rawConfidence} → ${currentConfidence}`);
  console.log(`[Calibrator] Training features extracted: ${Object.keys(trainingFeatures).length} fields`);
  console.log('[Calibrator] ═══════════════════════════════════════════════════════════');

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/204e847a-b9ca-4f4d-8fbf-8ff6a93211a9',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'30a7b9'},body:JSON.stringify({sessionId:'30a7b9',location:'prediction-calibrator.ts:FINAL',message:'Calibrator adjustments applied',data:{rawVps:input.rawVps,finalVps:currentVps,rawConfidence:input.rawConfidence,finalConfidence:currentConfidence,adjustmentsApplied:adjustments.map(a=>({rule:a.rule,vpsBefore:a.vpsBefore,vpsAfter:a.vpsAfter})),transcriptionSource:input.transcriptionSource,transcriptionSkipped:input.transcriptionSkipped,resolvedTranscriptLength:input.resolvedTranscriptLength,audioPresent:input.audioPresent,packVScore:input.packV?.overall_visual_score,detectedStyle:input.detectedStyle,hasCreatorContext:!!input.creatorContext},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  return {
    calibratedVps: currentVps,
    calibratedDps: currentVps,
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
