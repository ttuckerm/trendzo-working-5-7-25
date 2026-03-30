/**
 * Feature Extraction for Live Prediction (v10)
 *
 * Extracts the 58 features used by XGBoost v10.
 * v10 = v9 (51 features) + 7 new features:
 *   creator_followers_log, post_hour_utc, post_day_of_week,
 *   specificity_score, instructional_density, has_step_structure, hedge_word_density
 *
 * Mirrors the logic in src/lib/training/feature-extractor.ts for the
 * features that remain.
 */

import { analyzeVideo as analyzeVideoCanonical } from '@/lib/services/ffmpeg-canonical-analyzer';
import { analyzeProsody } from '@/lib/services/audio-prosodic-analyzer';
import { VisualSceneDetector } from '@/lib/components/visual-scene-detector';
import { ThumbnailAnalyzer } from '@/lib/components/thumbnail-analyzer';
import { HookScorer } from '@/lib/components/hook-scorer';
import { extractContentStrategyFeatures } from '@/lib/prediction/content-strategy-features';
import { extractSegmentFeatures } from '@/lib/prediction/ffmpeg-segment-features';
import { extractVisionHookFeatures } from '@/lib/prediction/vision-hook-features';
import { GoogleGenAI } from '@google/genai';
import { extractThumbnails } from '@/lib/services/ffmpeg-service';
import fs from 'fs';

// ============================================================================
// CONSTANTS
// ============================================================================

const FFMPEG_TIMEOUT = 60_000;

const NEGATIVE_WORDS = ['hate', 'worst', 'terrible', 'bad', 'awful', 'horrible', 'never', 'ugly', 'disgusting', 'disappointing'];
const CTA_WORDS = ['follow', 'like', 'comment', 'share', 'subscribe', 'save', 'click', 'link'];

const HOOK_TYPE_MAP: Record<string, number> = {
  'weak': 0,
  'question': 1,
  'list_preview': 2,
  'contrarian': 3,
  'myth_bust': 4,
  'statistic': 5,
  'authority': 6,
  'result_preview': 7,
  'personal_story': 8,
  'problem_identification': 9,
  'urgency': 10,
};

// ============================================================================
// TYPES
// ============================================================================

export interface PredictionFeatureInput {
  videoFilePath: string;
  transcript: string | null;
  niche: string | null;
  caption?: string | null;
  /** Creator's follower count (from onboarded profile). Null for anonymous Pulse uploads. */
  creatorFollowerCount?: number | null;
}

export interface PredictionFeatureResult {
  features: Record<string, number | boolean | null>;
  errors: string[];
  extractionTimeMs: number;
}

// ============================================================================
// MAIN EXTRACTION
// ============================================================================

/**
 * Extract 58 features from a local video file + transcript + optional creator data.
 * 51 v9 features + 7 new v10 features (creator_followers_log, post_hour_utc,
 * post_day_of_week, specificity_score, instructional_density, has_step_structure,
 * hedge_word_density).
 */
export async function extractPredictionFeatures(
  input: PredictionFeatureInput
): Promise<PredictionFeatureResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Initialize all 55 features as null (48 v8 + 7 content strategy)
  const features: Record<string, number | boolean | null> = {
    // FFmpeg (11 — removed ffmpeg_has_audio)
    ffmpeg_scene_changes: null,
    ffmpeg_cuts_per_second: null,
    ffmpeg_avg_motion: null,
    ffmpeg_color_variance: null,
    ffmpeg_brightness_avg: null,
    ffmpeg_contrast_score: null,
    ffmpeg_resolution_width: null,
    ffmpeg_resolution_height: null,
    ffmpeg_duration_seconds: null,
    ffmpeg_bitrate: null,
    ffmpeg_fps: null,

    // Audio Prosodic (10)
    audio_pitch_mean_hz: null,
    audio_pitch_variance: null,
    audio_pitch_range: null,
    audio_pitch_std_dev: null,
    audio_pitch_contour_slope: null,
    audio_loudness_mean_lufs: null,
    audio_loudness_range: null,
    audio_loudness_variance: null,
    audio_silence_ratio: null,
    audio_silence_count: null,

    // Speaking Rate (1 — removed 5 zero-importance variants)
    speaking_rate_wpm: null,

    // Visual Scene (3)
    visual_scene_count: null,
    visual_avg_scene_duration: null,
    visual_score: null,

    // Thumbnail (4 — removed thumb_confidence)
    thumb_brightness: null,
    thumb_contrast: null,
    thumb_colorfulness: null,
    thumb_overall_score: null,

    // Hook Scorer (4 — hook_score + 3 v9 features)
    hook_score: null,
    hook_confidence: null,
    hook_text_score: null,
    hook_type_encoded: null,

    // Text (12 — removed text_positive_word_count)
    text_word_count: null,
    text_sentence_count: null,
    text_question_mark_count: null,
    text_exclamation_count: null,
    text_transcript_length: null,
    text_avg_sentence_length: null,
    text_unique_word_ratio: null,
    text_avg_word_length: null,
    text_syllable_count: null,
    text_flesch_reading_ease: null,
    text_has_cta: null,
    text_negative_word_count: null,
    text_emoji_count: null,

    // Metadata (2 — removed 4 TikTok metadata features)
    meta_duration_seconds: null,
    meta_words_per_second: null,

    // Content Strategy (7 — Phase 1 text-based features, dead columns — kept for schema compat)
    retention_open_loop_count: null,
    share_relatability_score: null,
    share_utility_score: null,
    psych_curiosity_gap_score: null,
    psych_power_word_density: null,
    psych_direct_address_ratio: null,
    psych_social_proof_count: null,

    // FFmpeg Segment Features (5 — video-level temporal analysis)
    hook_motion_ratio: null,
    audio_energy_buildup: null,
    scene_rate_first_half_vs_second: null,
    visual_variety_score: null,
    hook_audio_intensity: null,

    // Vision Hook Features (4 — Gemini Vision analysis of opening frames)
    hook_face_present: null,
    hook_text_overlay: null,
    hook_composition_score: null,
    hook_emotion_intensity: null,

    // v9 Validated Features (3 — new in v9)
    text_overlay_density: null,
    visual_proof_ratio: null,
    vocal_confidence_composite: null,

    // v10 New Features (7)
    creator_followers_log: null,
    // post_hour_utc and post_day_of_week are training-only context features.
    // At prediction time the video hasn't been posted yet, so these are legitimately
    // unknown. The model will mean-impute them, which is correct behavior.
    post_hour_utc: null,
    post_day_of_week: null,
    specificity_score: null,
    instructional_density: null,
    has_step_structure: null,
    hedge_word_density: null,
  };

  // ── 1. Text features ──
  extractTextFeatures(input.transcript, input.caption || null, features);

  // ── 1b. Content strategy features (text-based) ──
  try {
    const strategy = extractContentStrategyFeatures(input.transcript, input.caption || null);
    features.retention_open_loop_count = strategy.retention_open_loop_count;
    features.share_relatability_score = strategy.share_relatability_score;
    features.share_utility_score = strategy.share_utility_score;
    features.psych_curiosity_gap_score = strategy.psych_curiosity_gap_score;
    features.psych_power_word_density = strategy.psych_power_word_density;
    features.psych_direct_address_ratio = strategy.psych_direct_address_ratio;
    features.psych_social_proof_count = strategy.psych_social_proof_count;
  } catch (err: any) {
    errors.push(`content-strategy: ${err.message}`);
  }

  // ── 2. Hook scorer (deterministic) ──
  try {
    const text = input.transcript || input.caption || '';
    if (text) {
      const hookResult = HookScorer.analyze(text);
      if (hookResult.success) {
        features.hook_score = hookResult.hookScore;
        features.hook_confidence = hookResult.hookConfidence;
        features.hook_text_score = hookResult.channels.text.score;
        const hookType = hookResult.hookType || 'weak';
        features.hook_type_encoded = HOOK_TYPE_MAP[hookType] ?? 0;
      }
    }
  } catch (err: any) {
    errors.push(`hook-scorer: ${err.message}`);
  }

  // ── 3. FFmpeg canonical analysis ──
  try {
    const canonical = await analyzeVideoCanonical(input.videoFilePath, { timeout: FFMPEG_TIMEOUT });

    if (canonical.extraction_success) {
      features.ffmpeg_scene_changes = canonical.scene_changes;
      features.ffmpeg_cuts_per_second = canonical.cuts_per_second;
      features.ffmpeg_avg_motion = canonical.avg_motion;
      features.ffmpeg_color_variance = canonical.color_variance;
      features.ffmpeg_brightness_avg = canonical.brightness_avg;
      features.ffmpeg_contrast_score = canonical.contrast_score;
      features.ffmpeg_resolution_width = canonical.resolution_width;
      features.ffmpeg_resolution_height = canonical.resolution_height;
      features.ffmpeg_duration_seconds = canonical.duration_seconds;
      features.ffmpeg_bitrate = canonical.bitrate;
      features.ffmpeg_fps = canonical.fps;

      // ── 3a. Visual scene detector ──
      try {
        const sceneResult = VisualSceneDetector.buildResult(canonical);
        features.visual_scene_count = sceneResult.sceneChanges;
        features.visual_avg_scene_duration = canonical.duration_seconds > 0 && canonical.scene_changes > 0
          ? canonical.duration_seconds / canonical.scene_changes
          : canonical.duration_seconds;
        features.visual_score = sceneResult.visualScore;
      } catch (err: any) {
        errors.push(`visual-scene: ${err.message}`);
      }

      // ── 3b. Thumbnail analyzer ──
      try {
        const thumbResult = ThumbnailAnalyzer.buildResult(canonical);
        features.thumb_brightness = thumbResult.features?.brightness ?? null;
        features.thumb_contrast = thumbResult.features?.contrast ?? null;
        features.thumb_colorfulness = thumbResult.features?.colorfulness ?? null;
        features.thumb_overall_score = thumbResult.overallScore;
      } catch (err: any) {
        errors.push(`thumbnail: ${err.message}`);
      }

      // Update speaking rate and metadata with actual duration
      if (canonical.duration_seconds > 0) {
        features.meta_duration_seconds = canonical.duration_seconds;
        if (features.text_word_count !== null) {
          features.speaking_rate_wpm = ((features.text_word_count as number) / canonical.duration_seconds) * 60;
          features.meta_words_per_second = (features.text_word_count as number) / canonical.duration_seconds;
        }
      }
    } else {
      errors.push(`ffmpeg: ${canonical.error || 'extraction failed'}`);
    }
  } catch (err: any) {
    errors.push(`ffmpeg: ${err.message}`);
  }

  // ── 4. Audio prosodic analysis ──
  try {
    const prosodic = await analyzeProsody(input.videoFilePath);

    if (prosodic.success) {
      if (prosodic.pitchAnalysis) {
        features.audio_pitch_mean_hz = prosodic.pitchAnalysis.pitchMean;
        features.audio_pitch_variance = prosodic.pitchAnalysis.pitchVariance;
        features.audio_pitch_range = prosodic.pitchAnalysis.pitchRange;
        features.audio_pitch_std_dev = prosodic.pitchAnalysis.pitchStdDev;
        features.audio_pitch_contour_slope = prosodic.pitchAnalysis.pitchContourSlope;
      }

      if (prosodic.volumeDynamics) {
        features.audio_loudness_mean_lufs = prosodic.volumeDynamics.loudnessMean;
        features.audio_loudness_range = prosodic.volumeDynamics.loudnessRange;
        features.audio_loudness_variance = prosodic.volumeDynamics.loudnessVariance;
      }

      if (prosodic.silencePatterns) {
        features.audio_silence_ratio = prosodic.silencePatterns.silenceRatio;
        features.audio_silence_count = prosodic.silencePatterns.silenceCount;
      }
    } else {
      errors.push(`prosodic: ${prosodic.errors.join(', ')}`);
    }
  } catch (err: any) {
    errors.push(`prosodic: ${err.message}`);
  }

  // ── 5. FFmpeg segment-based features (5 temporal features) ──
  try {
    const segmentResult = await extractSegmentFeatures(input.videoFilePath);
    features.hook_motion_ratio = segmentResult.features.hook_motion_ratio;
    features.audio_energy_buildup = segmentResult.features.audio_energy_buildup;
    features.scene_rate_first_half_vs_second = segmentResult.features.scene_rate_first_half_vs_second;
    features.visual_variety_score = segmentResult.features.visual_variety_score;
    features.hook_audio_intensity = segmentResult.features.hook_audio_intensity;
    if (segmentResult.errors.length > 0) {
      errors.push(...segmentResult.errors.map(e => `segment: ${e}`));
    }
  } catch (err: any) {
    errors.push(`segment-features: ${err.message}`);
  }

  // ── 6. Vision hook features (Gemini Vision — requires video file) ──
  try {
    const visionResult = await extractVisionHookFeatures(input.videoFilePath);
    if (visionResult) {
      features.hook_face_present = visionResult.hook_face_present;
      features.hook_text_overlay = visionResult.hook_text_overlay;
      features.hook_composition_score = visionResult.hook_composition_score;
      features.hook_emotion_intensity = visionResult.hook_emotion_intensity;
    }
  } catch (err: any) {
    errors.push(`vision-hook: ${err.message}`);
  }

  // NOTE: Audio classifier removed — all 4 of its features (audio_music_ratio,
  // audio_speech_ratio, audio_type_encoded, audio_energy_variance) had zero
  // importance in v7. Skipping saves ~2s of ffmpeg processing per prediction.

  // ── 7. v9 validated features ──

  // 7a. vocal_confidence_composite — derived from already-extracted audio prosodic features
  computeVocalConfidenceComposite(features);

  // 7b. visual_proof_ratio + text_overlay_density — Gemini Vision frame classifier
  try {
    const duration = (features.ffmpeg_duration_seconds as number) || 30;
    const frameResult = await classifyVideoFrames(input.videoFilePath, duration);
    if (frameResult) {
      features.visual_proof_ratio = frameResult.visual_proof_ratio;
      features.text_overlay_density = frameResult.text_overlay_density;
    }
  } catch (err: any) {
    errors.push(`frame-classifier: ${err.message}`);
  }

  // ── 8. v10 new features ──

  // 8a. creator_followers_log — from onboarded creator profile, null for anonymous
  if (input.creatorFollowerCount != null && input.creatorFollowerCount >= 0) {
    features.creator_followers_log = Math.log10(input.creatorFollowerCount + 1);
  }
  // post_hour_utc and post_day_of_week stay null — training-only context features

  // 8b. Text-analysis features (specificity, instructional density, hedge words)
  // Matches logic in src/lib/training/feature-extractor.ts exactly
  const analysisText = input.transcript || input.caption || '';
  if (analysisText) {
    const durationSeconds = (features.ffmpeg_duration_seconds as number) || (features.meta_duration_seconds as number) || 60;
    extractSpecificityScoreLive(analysisText, durationSeconds, features);
    extractInstructionalDensityLive(analysisText, durationSeconds, features);
    extractHedgeWordDensityLive(analysisText, features);
  }

  return {
    features,
    errors,
    extractionTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractTextFeatures(
  transcript: string | null,
  caption: string | null,
  features: Record<string, number | boolean | null>
): void {
  const text = transcript || caption || '';
  if (!text) return;

  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lower = text.toLowerCase();

  features.text_word_count = words.length;
  features.text_sentence_count = sentences.length;
  features.text_question_mark_count = (text.match(/\?/g) || []).length;
  features.text_exclamation_count = (text.match(/!/g) || []).length;
  features.text_transcript_length = text.length;
  features.text_avg_sentence_length = sentences.length > 0
    ? words.length / sentences.length
    : 0;

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  features.text_unique_word_ratio = words.length > 0
    ? uniqueWords.size / words.length
    : 0;

  features.text_avg_word_length = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;

  const countSyllables = (word: string): number => {
    const matches = word.toLowerCase().match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
  };
  features.text_syllable_count = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (words.length > 0 && sentences.length > 0) {
    features.text_flesch_reading_ease = 206.835
      - 1.015 * (words.length / sentences.length)
      - 84.6 * ((features.text_syllable_count as number) / words.length);
  }

  features.text_has_cta = CTA_WORDS.some(w => lower.includes(w));
  features.text_negative_word_count = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;

  // Emoji count from caption
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g;
  features.text_emoji_count = ((caption || '').match(emojiRegex) || []).length;
}

// ============================================================================
// v9 FEATURE HELPERS
// ============================================================================

// Percentile anchors from 863-video dataset for vocal confidence normalization
const CONFIDENCE_ANCHORS = {
  pitch_variance: { p5: 0.5, p95: 45.0 },
  loudness_variance: { p5: 0.01, p95: 8.0 },
  silence_ratio: { p5: 0.01, p95: 0.45 },
};

function normalizeToUnit(value: number, p5: number, p95: number): number {
  return Math.max(0, Math.min(1, (value - p5) / (p95 - p5)));
}

/**
 * Compute vocal_confidence_composite from already-extracted audio prosodic features.
 * Lower variance in pitch/loudness + lower silence ratio = higher confidence.
 * Matches logic in src/lib/training/feature-extractor.ts.
 */
function computeVocalConfidenceComposite(
  features: Record<string, number | boolean | null>
): void {
  const components: { value: number; weight: number }[] = [];

  if (features.audio_pitch_variance !== null && features.audio_pitch_variance !== undefined) {
    const norm = normalizeToUnit(features.audio_pitch_variance as number, CONFIDENCE_ANCHORS.pitch_variance.p5, CONFIDENCE_ANCHORS.pitch_variance.p95);
    components.push({ value: 1 - norm, weight: 0.35 });
  }
  if (features.audio_loudness_variance !== null && features.audio_loudness_variance !== undefined) {
    const norm = normalizeToUnit(features.audio_loudness_variance as number, CONFIDENCE_ANCHORS.loudness_variance.p5, CONFIDENCE_ANCHORS.loudness_variance.p95);
    components.push({ value: 1 - norm, weight: 0.35 });
  }
  if (features.audio_silence_ratio !== null && features.audio_silence_ratio !== undefined) {
    const norm = normalizeToUnit(features.audio_silence_ratio as number, CONFIDENCE_ANCHORS.silence_ratio.p5, CONFIDENCE_ANCHORS.silence_ratio.p95);
    components.push({ value: 1 - norm, weight: 0.3 });
  }

  if (components.length === 0) return;

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const composite = components.reduce((sum, c) => sum + c.value * (c.weight / totalWeight), 0);
  features.vocal_confidence_composite = Math.max(0, Math.min(1, composite));
}

type FrameClassification =
  | 'talking_head' | 'screen_recording' | 'dashboard_screenshot'
  | 'product_demo' | 'text_card' | 'b_roll' | 'transition' | 'other';

/**
 * Classify 9 frames across the video using Gemini Vision.
 * Returns visual_proof_ratio and text_overlay_density.
 * Graceful fallback: returns null if no API key / no video / Gemini error.
 */
async function classifyVideoFrames(
  videoPath: string,
  durationSeconds: number,
): Promise<{ visual_proof_ratio: number; text_overlay_density: number } | null> {
  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) return null;
  if (!fs.existsSync(videoPath)) return null;

  const duration = durationSeconds > 0 ? durationSeconds : 30;

  // Extract 9 frames at 10%, 20%, ..., 90% of duration
  const timestamps: number[] = [];
  for (let pct = 10; pct <= 90; pct += 10) {
    timestamps.push(Math.round((duration * pct / 100) * 10) / 10);
  }

  let framePaths: string[] = [];
  try {
    const frames = await extractThumbnails(videoPath, {
      timestamps,
      width: 512,
      quality: 3,
      format: 'jpg',
    });
    framePaths = frames.map(f => f.path);

    if (framePaths.length === 0) return null;

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const fp of framePaths) {
      const buf = fs.readFileSync(fp);
      imageParts.push({
        inlineData: { mimeType: 'image/jpeg', data: buf.toString('base64') },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [
            ...imageParts,
            {
              text: `You are analyzing ${framePaths.length} frames extracted from a short-form video about side hustles / making money online.

For each frame, classify it as exactly one of: talking_head, screen_recording, dashboard_screenshot, product_demo, text_card, b_roll, transition, other.

Return ONLY a JSON array of ${framePaths.length} strings in the same order as the frames. Example:
["talking_head", "screen_recording", "dashboard_screenshot", "talking_head", "product_demo", "text_card", "b_roll", "talking_head", "screen_recording"]`,
            },
          ],
        }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Frame classifier timeout')), 45_000)
      ),
    ]);

    const responseText = result.text || '';
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```\n?/g, '');

    const parsed = JSON.parse(cleaned) as string[];
    if (!Array.isArray(parsed)) return null;

    const classifications = parsed.slice(0, framePaths.length) as FrameClassification[];
    const totalFrames = classifications.length;
    const durationMinutes = Math.max(duration / 60, 1);

    const proofTypes: FrameClassification[] = ['screen_recording', 'dashboard_screenshot', 'product_demo'];
    const proofFrames = classifications.filter(c => proofTypes.includes(c)).length;
    const visual_proof_ratio = proofFrames / totalFrames;

    const textCardFrames = classifications.filter(c => c === 'text_card').length;
    const text_overlay_density = textCardFrames / durationMinutes;

    console.log(`[FrameClassifier] visual_proof_ratio=${visual_proof_ratio.toFixed(3)}, text_overlay_density=${text_overlay_density.toFixed(3)}`);
    return { visual_proof_ratio, text_overlay_density };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[FrameClassifier] Failed (graceful fallback): ${msg}`);
    return null;
  } finally {
    for (const p of framePaths) {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch { /* best-effort */ }
    }
  }
}

// ============================================================================
// v10 TEXT-ANALYSIS FEATURE HELPERS
// (Ported from src/lib/training/feature-extractor.ts — must match exactly)
// ============================================================================

// Curated list of side-hustle tools/platforms for specificity_score
const SIDE_HUSTLE_TOOLS = [
  'etsy', 'shopify', 'printify', 'canva', 'chatgpt', 'fiverr', 'upwork',
  'amazon', 'ebay', 'gumroad', 'teachable', 'kajabi', 'convertkit',
  'mailchimp', 'stripe', 'paypal', 'tiktok', 'instagram', 'youtube',
  'pinterest', 'dropbox', 'notion', 'airtable', 'zapier', 'midjourney',
  'dall-e', 'dalle', 'stable diffusion', 'clickfunnels', 'kartra',
  'activecampaign', 'redbubble', 'merch by amazon', 'printful', 'teespring',
  'spreadshirt', 'amazon fba', 'amazon kdp', 'kindle', 'udemy', 'skillshare',
  'substack', 'patreon', 'ko-fi', 'buy me a coffee', 'stan store', 'linktree',
  'beacons', 'lemon squeezy', 'lemonsqueezy', 'whop', 'podia', 'thinkific',
  'samcart', 'leadpages', 'systeme', 'systeme.io',
];

const DOLLAR_AMOUNT_REGEX = /\$[\d,]+(?:\.\d{1,2})?/g;
const NON_ROUND_REGEX = /\$[\d,]*[1-9]\d{0,1}(?:\.\d{1,2})?$/;

const TIMEFRAME_PATTERNS = [
  /first\s+(?:month|week|day)/gi,
  /in\s+\d+\s+(?:days?|weeks?|months?|years?)/gi,
  /per\s+(?:month|week|day|hour|year)/gi,
  /\d+\s+(?:days?|weeks?|months?)\s+(?:ago|later|in)/gi,
  /(?:every|each)\s+(?:month|week|day)/gi,
];

function extractSpecificityScoreLive(
  text: string,
  durationSeconds: number,
  features: Record<string, number | boolean | null>,
): void {
  const lower = text.toLowerCase();
  const durationMinutes = Math.max(durationSeconds / 60, 1);

  let namedToolsCount = 0;
  for (const tool of SIDE_HUSTLE_TOOLS) {
    const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) namedToolsCount += matches.length;
  }

  const dollarMatches = text.match(DOLLAR_AMOUNT_REGEX) || [];
  let specificAmountsCount = 0;
  for (const match of dollarMatches) {
    specificAmountsCount += NON_ROUND_REGEX.test(match) ? 1.5 : 1;
  }

  let timeframesCount = 0;
  for (const pattern of TIMEFRAME_PATTERNS) {
    const matches = lower.match(pattern);
    if (matches) timeframesCount += matches.length;
  }

  features.specificity_score = (namedToolsCount * 2 + specificAmountsCount * 3 + timeframesCount * 1) / durationMinutes;
}

const ACTION_VERBS = [
  'create', 'open', 'click', 'go', 'set up', 'sign up', 'upload', 'select',
  'type', 'paste', 'copy', 'build', 'start', 'launch', 'add', 'download',
  'install', 'connect', 'link', 'submit', 'publish', 'fill', 'choose',
  'enter', 'write', 'save', 'share', 'post', 'turn on', 'enable',
];

const SEQUENTIAL_MARKERS = [
  /\bfirst\b/gi, /\bsecond\b/gi, /\bthird\b/gi,
  /\bstep\s+\d+/gi, /\bnext\b/gi, /\bthen\b/gi,
  /\bfinally\b/gi, /\blastly\b/gi,
  /\bnumber\s+one\b/gi, /\bnumber\s+two\b/gi, /\bnumber\s+three\b/gi,
];

function extractInstructionalDensityLive(
  text: string,
  durationSeconds: number,
  features: Record<string, number | boolean | null>,
): void {
  const lower = text.toLowerCase();
  const durationMinutes = Math.max(durationSeconds / 60, 1);

  let imperativeCount = 0;
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    for (const verb of ACTION_VERBS) {
      if (trimmed.startsWith(verb) || trimmed.startsWith('so ' + verb) || trimmed.startsWith('and ' + verb) || trimmed.startsWith('now ' + verb)) {
        imperativeCount++;
        break;
      }
    }
  }

  let sequentialMarkerCount = 0;
  for (const pattern of SEQUENTIAL_MARKERS) {
    const matches = lower.match(pattern);
    if (matches) sequentialMarkerCount += matches.length;
  }

  features.instructional_density = (imperativeCount + sequentialMarkerCount) / durationMinutes;
  features.has_step_structure = sequentialMarkerCount >= 3;
}

const HEDGE_PHRASES = [
  'maybe', 'probably', 'i think', 'i guess', 'kind of', 'sort of',
  'might', 'could be', 'not sure', "i don't know", 'possibly', 'perhaps',
  'it depends', 'in my opinion', 'some people say', 'you could try',
  'it might work', "i'm not certain", 'i believe', 'i feel like',
];

function extractHedgeWordDensityLive(
  text: string,
  features: Record<string, number | boolean | null>,
): void {
  const lower = text.toLowerCase();
  const wordCount = Math.max(text.split(/\s+/).filter(w => w.length > 0).length, 1);

  let hedgeCount = 0;
  for (const phrase of HEDGE_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) hedgeCount += matches.length;
  }

  features.hedge_word_density = hedgeCount / wordCount;
}
