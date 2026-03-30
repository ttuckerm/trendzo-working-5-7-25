/**
 * Training Feature Extractor
 *
 * Processes scraped_videos → flat feature vectors in training_features table.
 * Uses ONLY deterministic/algorithmic analyzers (no LLM calls).
 *
 * Pipeline per video:
 *   1. Download video from TikTok URL
 *   2. Run ffmpeg-canonical-analyzer → visual/audio metrics
 *   3. Run audio-prosodic-analyzer → pitch, volume, silence
 *   4. Run audio-classifier → music/speech detection
 *   5. Build visual-scene-detector result from canonical
 *   6. Build thumbnail-analyzer result from canonical
 *   7. Run hook-scorer on transcript text (deterministic)
 *   8. Extract text features from transcript
 *   9. Estimate speaking rate from word count / duration
 *  10. Write flat row to training_features
 *  11. Clean up downloaded video file
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { analyzeVideo as analyzeVideoCanonical } from '@/lib/services/ffmpeg-canonical-analyzer';
import { analyzeProsody } from '@/lib/services/audio-prosodic-analyzer';
import { classifyAudioContent } from '@/lib/services/audio-classifier';
import { VisualSceneDetector } from '@/lib/components/visual-scene-detector';
import { ThumbnailAnalyzer } from '@/lib/components/thumbnail-analyzer';
import { HookScorer } from '@/lib/components/hook-scorer';
import { TikTokDownloader } from '@/lib/services/tiktok-downloader';
import { extractContentStrategyFeatures } from '@/lib/prediction/content-strategy-features';
import { extractSegmentFeatures } from '@/lib/prediction/ffmpeg-segment-features';
import { extractVisionHookFeatures } from '@/lib/prediction/vision-hook-features';
import fs, { existsSync, unlinkSync } from 'fs';
import { extractThumbnails } from '@/lib/services/ffmpeg-service';
import { emitEvent } from '@/lib/events/emit';

// ============================================================================
// TYPES
// ============================================================================

export interface ScrapedVideo {
  video_id: string;
  url: string;
  caption: string;
  transcript_text: string | null;
  hashtags: string[];
  duration_seconds: number | null;
  creator_followers_count: number;
  upload_timestamp: string | null;
  is_original_sound: boolean | null;
}

export interface TrainingFeatureRow {
  video_id: string;
  extracted_at: string;
  extraction_version: number;
  extraction_duration_ms: number;
  extraction_errors: string[];

  // FFmpeg
  ffmpeg_scene_changes: number | null;
  ffmpeg_cuts_per_second: number | null;
  ffmpeg_avg_motion: number | null;
  ffmpeg_color_variance: number | null;
  ffmpeg_brightness_avg: number | null;
  ffmpeg_contrast_score: number | null;
  ffmpeg_resolution_width: number | null;
  ffmpeg_resolution_height: number | null;
  ffmpeg_duration_seconds: number | null;
  ffmpeg_bitrate: number | null;
  ffmpeg_fps: number | null;
  ffmpeg_has_audio: boolean | null;

  // Audio Prosodic
  audio_pitch_mean_hz: number | null;
  audio_pitch_variance: number | null;
  audio_pitch_range: number | null;
  audio_pitch_std_dev: number | null;
  audio_pitch_contour_slope: number | null;
  audio_loudness_mean_lufs: number | null;
  audio_loudness_range: number | null;
  audio_loudness_variance: number | null;
  audio_silence_ratio: number | null;
  audio_silence_count: number | null;

  // Audio Classifier
  audio_music_ratio: number | null;
  audio_speech_ratio: number | null;
  audio_type_encoded: number | null;
  audio_energy_variance: number | null;

  // Speaking Rate
  speaking_rate_wpm: number | null;
  speaking_rate_wpm_variance: number | null;
  speaking_rate_wpm_acceleration: number | null;
  speaking_rate_wpm_peak_count: number | null;
  speaking_rate_fast_segments: number | null;
  speaking_rate_slow_segments: number | null;

  // Visual Scene
  visual_scene_count: number | null;
  visual_avg_scene_duration: number | null;
  visual_score: number | null;

  // Thumbnail
  thumb_brightness: number | null;
  thumb_contrast: number | null;
  thumb_colorfulness: number | null;
  thumb_overall_score: number | null;
  thumb_confidence: number | null;

  // Hook Scorer
  hook_score: number | null;
  hook_confidence: number | null;
  hook_text_score: number | null;
  hook_audio_score: number | null;
  hook_visual_score: number | null;
  hook_pace_score: number | null;
  hook_tone_score: number | null;
  hook_type_encoded: number | null;

  // Text
  text_word_count: number | null;
  text_sentence_count: number | null;
  text_question_mark_count: number | null;
  text_exclamation_count: number | null;
  text_transcript_length: number | null;
  text_avg_sentence_length: number | null;
  text_unique_word_ratio: number | null;
  text_avg_word_length: number | null;
  text_syllable_count: number | null;
  text_flesch_reading_ease: number | null;
  text_has_cta: boolean | null;
  text_positive_word_count: number | null;
  text_negative_word_count: number | null;
  text_emoji_count: number | null;

  // Metadata
  meta_duration_seconds: number | null;
  meta_hashtag_count: number | null;
  meta_has_viral_hashtag: boolean | null;
  meta_creator_followers: number | null;
  meta_creator_followers_log: number | null;
  meta_words_per_second: number | null;

  // Content Strategy (Phase 1)
  retention_open_loop_count: number | null;
  share_relatability_score: number | null;
  share_utility_score: number | null;
  psych_curiosity_gap_score: number | null;
  psych_power_word_density: number | null;
  psych_direct_address_ratio: number | null;
  psych_social_proof_count: number | null;

  // FFmpeg Segment Features
  hook_motion_ratio: number | null;
  audio_energy_buildup: number | null;
  scene_rate_first_half_vs_second: number | null;
  visual_variety_score: number | null;
  hook_audio_intensity: number | null;

  // Vision Hook Features (Gemini Vision)
  hook_face_present: number | null;
  hook_text_overlay: number | null;
  hook_composition_score: number | null;
  hook_emotion_intensity: number | null;

  // Wave 1: Transcript/Audio Features (side-hustles niche)
  specificity_score: number | null;
  instructional_density: number | null;
  has_step_structure: boolean | null;
  hedge_word_density: number | null;
  vocal_confidence_composite: number | null;

  // Wave 2: Gemini Vision Frame Classifier Features
  visual_proof_ratio: number | null;
  talking_head_ratio: number | null;
  visual_to_verbal_ratio: number | null;
  text_overlay_density: number | null;

  // Creator + Distribution Signals
  creator_followers_count: number | null;
  creator_followers_log: number | null;
  post_hour_utc: number | null;
  post_day_of_week: number | null;
  is_original_sound: number | null;
}

export interface ExtractionProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  currentVideoId: string | null;
}

export interface ExtractionResult {
  totalProcessed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  featuresPerVideo: number;
  errors: Array<{ videoId: string; error: string }>;
  durationMs: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EXTRACTION_VERSION = 1;
const FFMPEG_TIMEOUT = 60_000;
const DOWNLOAD_TIMEOUT = 90_000;

const AUDIO_TYPE_MAP: Record<string, number> = {
  'speech-only': 1,
  'music-only': 2,
  'speech-over-music': 3,
  'mixed': 4,
  'silent': 5,
};

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

const POSITIVE_WORDS = ['love', 'amazing', 'great', 'best', 'awesome', 'incredible', 'perfect', 'beautiful', 'wonderful', 'fantastic'];
const NEGATIVE_WORDS = ['hate', 'worst', 'terrible', 'bad', 'awful', 'horrible', 'never', 'ugly', 'disgusting', 'disappointing'];
const CTA_WORDS = ['follow', 'like', 'comment', 'share', 'subscribe', 'save', 'click', 'link'];
const VIRAL_HASHTAGS = ['fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'blowthisup'];

// ============================================================================
// MAIN EXTRACTION PIPELINE
// ============================================================================

/**
 * Run feature extraction on all scraped_videos that don't have training_features yet.
 */
export async function runFeatureExtraction(
  supabase: SupabaseClient,
  options: {
    batchSize?: number;
    limit?: number;
    onProgress?: (progress: ExtractionProgress) => void;
  } = {}
): Promise<ExtractionResult> {
  const startTime = Date.now();
  const { batchSize = 5, limit = 0, onProgress } = options;

  // Get all existing training_features video_ids
  const { data: existingRows } = await supabase
    .from('training_features')
    .select('video_id');

  const existingIds = new Set((existingRows || []).map(r => r.video_id));

  // Get scraped_videos ordered by highest DPS first
  const { data: allVideos, error } = await supabase
    .from('scraped_videos')
    .select('video_id, url, caption, transcript_text, hashtags, duration_seconds, creator_followers_count, upload_timestamp, is_original_sound')
    .order('dps_score', { ascending: false, nullsFirst: false });

  if (error) throw new Error(`Failed to fetch scraped_videos: ${error.message}`);

  // Filter out already-extracted
  let videos = (allVideos || []).filter(v => !existingIds.has(v.video_id));
  if (limit > 0) videos = videos.slice(0, limit);

  if (videos.length === 0) {
    console.log('No videos need feature extraction.');
    return {
      totalProcessed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      featuresPerVideo: 0,
      errors: [],
      durationMs: Date.now() - startTime,
    };
  }

  console.log(`Found ${videos.length} videos needing feature extraction.`);

  const progress: ExtractionProgress = {
    total: videos.length,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    currentVideoId: null,
  };

  const errors: Array<{ videoId: string; error: string }> = [];

  // Process sequentially (video download + FFmpeg is heavy)
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);

    for (const video of batch) {
      progress.currentVideoId = video.video_id;
      if (onProgress) onProgress({ ...progress });

      try {
        const row = await extractFeaturesForVideo(video);

        const { error: insertError } = await supabase
          .from('training_features')
          .upsert(row, { onConflict: 'video_id' });

        if (insertError) {
          throw new Error(`DB insert failed: ${insertError.message}`);
        }

        // Emit platform event (fire-and-forget)
        const featureKeys = Object.keys(row).filter(
          k => !['video_id', 'extracted_at', 'extraction_version', 'extraction_duration_ms', 'extraction_errors'].includes(k)
        );
        const populated = featureKeys.filter(k => (row as any)[k] !== null);
        const failed = featureKeys.filter(k => (row as any)[k] === null);
        emitEvent({
          eventType: 'feature.extracted',
          payload: {
            videoId: video.video_id,
            featuresExtracted: populated.length,
            failedFeatures: failed,
          },
          entityType: 'video',
          entityId: video.video_id,
        }).catch(() => {});

        progress.succeeded++;
      } catch (err: any) {
        progress.failed++;
        errors.push({ videoId: video.video_id, error: err.message });
        console.error(`  ✗ ${video.video_id}: ${err.message}`);
      }

      progress.processed++;
      if (onProgress) onProgress({ ...progress });
    }
  }

  return {
    totalProcessed: progress.processed,
    succeeded: progress.succeeded,
    failed: progress.failed,
    skipped: progress.skipped,
    featuresPerVideo: countFeatureColumns(),
    errors,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================================
// SINGLE VIDEO EXTRACTION
// ============================================================================

/**
 * Extract all features for a single scraped video.
 * Downloads the video, runs all deterministic analyzers, returns flat row.
 */
export async function extractFeaturesForVideo(
  video: ScrapedVideo
): Promise<TrainingFeatureRow> {
  const startTime = Date.now();
  const errors: string[] = [];

  // Initialize with nulls
  const row: TrainingFeatureRow = {
    video_id: video.video_id,
    extracted_at: new Date().toISOString(),
    extraction_version: EXTRACTION_VERSION,
    extraction_duration_ms: 0,
    extraction_errors: [],

    // FFmpeg
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
    ffmpeg_has_audio: null,

    // Audio Prosodic
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

    // Audio Classifier
    audio_music_ratio: null,
    audio_speech_ratio: null,
    audio_type_encoded: null,
    audio_energy_variance: null,

    // Speaking Rate
    speaking_rate_wpm: null,
    speaking_rate_wpm_variance: null,
    speaking_rate_wpm_acceleration: null,
    speaking_rate_wpm_peak_count: null,
    speaking_rate_fast_segments: null,
    speaking_rate_slow_segments: null,

    // Visual Scene
    visual_scene_count: null,
    visual_avg_scene_duration: null,
    visual_score: null,

    // Thumbnail
    thumb_brightness: null,
    thumb_contrast: null,
    thumb_colorfulness: null,
    thumb_overall_score: null,
    thumb_confidence: null,

    // Hook Scorer
    hook_score: null,
    hook_confidence: null,
    hook_text_score: null,
    hook_audio_score: null,
    hook_visual_score: null,
    hook_pace_score: null,
    hook_tone_score: null,
    hook_type_encoded: null,

    // Text
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
    text_positive_word_count: null,
    text_negative_word_count: null,
    text_emoji_count: null,

    // Metadata
    meta_duration_seconds: null,
    meta_hashtag_count: null,
    meta_has_viral_hashtag: null,
    meta_creator_followers: null,
    meta_creator_followers_log: null,
    meta_words_per_second: null,

    // Content Strategy (Phase 1)
    retention_open_loop_count: null,
    share_relatability_score: null,
    share_utility_score: null,
    psych_curiosity_gap_score: null,
    psych_power_word_density: null,
    psych_direct_address_ratio: null,
    psych_social_proof_count: null,

    // FFmpeg Segment Features
    hook_motion_ratio: null,
    audio_energy_buildup: null,
    scene_rate_first_half_vs_second: null,
    visual_variety_score: null,
    hook_audio_intensity: null,

    // Vision Hook Features (Gemini Vision)
    hook_face_present: null,
    hook_text_overlay: null,
    hook_composition_score: null,
    hook_emotion_intensity: null,

    // Wave 1: Transcript/Audio Features
    specificity_score: null,
    instructional_density: null,
    has_step_structure: null,
    hedge_word_density: null,
    vocal_confidence_composite: null,

    // Wave 2: Gemini Vision Frame Classifier Features
    visual_proof_ratio: null,
    talking_head_ratio: null,
    visual_to_verbal_ratio: null,
    text_overlay_density: null,

    // Creator + Distribution Signals
    creator_followers_count: null,
    creator_followers_log: null,
    post_hour_utc: null,
    post_day_of_week: null,
    is_original_sound: null,
  };

  // ── 1. Text features (always available from transcript_text) ──
  extractTextFeatures(video, row);

  // ── 1a. Wave 1 features (transcript + audio, no API calls) ──
  extractSpecificityScore(video, row);
  extractInstructionalDensity(video, row);
  extractHedgeWordDensity(video, row);

  // ── 1b. Content strategy features (text-based) ──
  try {
    const strategy = extractContentStrategyFeatures(video.transcript_text, video.caption);
    row.retention_open_loop_count = strategy.retention_open_loop_count;
    row.share_relatability_score = strategy.share_relatability_score;
    row.share_utility_score = strategy.share_utility_score;
    row.psych_curiosity_gap_score = strategy.psych_curiosity_gap_score;
    row.psych_power_word_density = strategy.psych_power_word_density;
    row.psych_direct_address_ratio = strategy.psych_direct_address_ratio;
    row.psych_social_proof_count = strategy.psych_social_proof_count;
  } catch (err: any) {
    errors.push(`content-strategy: ${err.message}`);
  }

  // ── 2. Metadata features (always available) ──
  extractMetadataFeatures(video, row);

  // ── 2a. Creator + distribution signals (from scraped_videos) ──
  extractCreatorDistributionSignals(video, row);

  // ── 3. Hook scorer (deterministic, text-only when no video) ──
  try {
    extractHookFeatures(video, row);
  } catch (err: any) {
    errors.push(`hook-scorer: ${err.message}`);
  }

  // ── 4. Download video for audio/visual analysis ──
  let videoPath: string | null = null;
  try {
    if (video.url) {
      const result = await TikTokDownloader.downloadVideo(video.url);
      if (result.success && result.localPath) {
        videoPath = result.localPath;
      } else {
        errors.push(`download: ${result.error || 'unknown error'}`);
      }
    } else {
      errors.push('download: no TikTok URL available');
    }
  } catch (err: any) {
    errors.push(`download: ${err.message}`);
  }

  // ── 5. FFmpeg canonical analysis (requires video file) ──
  if (videoPath) {
    try {
      const canonical = await analyzeVideoCanonical(videoPath, { timeout: FFMPEG_TIMEOUT });

      if (canonical.extraction_success) {
        row.ffmpeg_scene_changes = canonical.scene_changes;
        row.ffmpeg_cuts_per_second = canonical.cuts_per_second;
        row.ffmpeg_avg_motion = canonical.avg_motion;
        row.ffmpeg_color_variance = canonical.color_variance;
        row.ffmpeg_brightness_avg = canonical.brightness_avg;
        row.ffmpeg_contrast_score = canonical.contrast_score;
        row.ffmpeg_resolution_width = canonical.resolution_width;
        row.ffmpeg_resolution_height = canonical.resolution_height;
        row.ffmpeg_duration_seconds = canonical.duration_seconds;
        row.ffmpeg_bitrate = canonical.bitrate;
        row.ffmpeg_fps = canonical.fps;
        row.ffmpeg_has_audio = canonical.has_audio;

        // ── 5a. Visual scene detector (from canonical) ──
        try {
          const sceneResult = VisualSceneDetector.buildResult(canonical);
          row.visual_scene_count = sceneResult.sceneChanges;
          row.visual_avg_scene_duration = canonical.duration_seconds > 0 && canonical.scene_changes > 0
            ? canonical.duration_seconds / canonical.scene_changes
            : canonical.duration_seconds;
          row.visual_score = sceneResult.visualScore;
        } catch (err: any) {
          errors.push(`visual-scene: ${err.message}`);
        }

        // ── 5b. Thumbnail analyzer (from canonical) ──
        try {
          const thumbResult = ThumbnailAnalyzer.buildResult(canonical);
          row.thumb_brightness = thumbResult.features?.brightness ?? null;
          row.thumb_contrast = thumbResult.features?.contrast ?? null;
          row.thumb_colorfulness = thumbResult.features?.colorfulness ?? null;
          row.thumb_overall_score = thumbResult.overallScore;
          row.thumb_confidence = thumbResult.confidence;
        } catch (err: any) {
          errors.push(`thumbnail: ${err.message}`);
        }

        // Update speaking rate estimate with actual duration
        if (canonical.duration_seconds > 0 && row.text_word_count !== null) {
          row.speaking_rate_wpm = (row.text_word_count / canonical.duration_seconds) * 60;
          row.meta_words_per_second = row.text_word_count / canonical.duration_seconds;
          row.meta_duration_seconds = canonical.duration_seconds;
        }
      } else {
        errors.push(`ffmpeg: ${canonical.error || 'extraction failed'}`);
      }
    } catch (err: any) {
      errors.push(`ffmpeg: ${err.message}`);
    }

    // ── 6. Audio prosodic analysis (requires video file) ──
    try {
      const prosodic = await analyzeProsody(videoPath);

      if (prosodic.success) {
        if (prosodic.pitchAnalysis) {
          row.audio_pitch_mean_hz = prosodic.pitchAnalysis.pitchMean;
          row.audio_pitch_variance = prosodic.pitchAnalysis.pitchVariance;
          row.audio_pitch_range = prosodic.pitchAnalysis.pitchRange;
          row.audio_pitch_std_dev = prosodic.pitchAnalysis.pitchStdDev;
          row.audio_pitch_contour_slope = prosodic.pitchAnalysis.pitchContourSlope;
        }

        if (prosodic.volumeDynamics) {
          row.audio_loudness_mean_lufs = prosodic.volumeDynamics.loudnessMean;
          row.audio_loudness_range = prosodic.volumeDynamics.loudnessRange;
          row.audio_loudness_variance = prosodic.volumeDynamics.loudnessVariance;
        }

        if (prosodic.silencePatterns) {
          row.audio_silence_ratio = prosodic.silencePatterns.silenceRatio;
          row.audio_silence_count = prosodic.silencePatterns.silenceCount;
        }
      } else {
        errors.push(`prosodic: ${prosodic.errors.join(', ')}`);
      }
    } catch (err: any) {
      errors.push(`prosodic: ${err.message}`);
    }

    // ── 6b. Vocal confidence composite (from prosodic data) ──
    extractVocalConfidenceComposite(row);

    // ── 7. Audio classifier (requires video file) ──
    try {
      const audioClass = await classifyAudioContent(videoPath);

      if (audioClass.success) {
        row.audio_music_ratio = audioClass.musicRatio;
        row.audio_speech_ratio = audioClass.speechRatio;
        row.audio_type_encoded = AUDIO_TYPE_MAP[audioClass.audioType] ?? null;
        row.audio_energy_variance = audioClass.energyVarianceNormalized;
      } else {
        errors.push(`audio-classifier: ${audioClass.error || 'failed'}`);
      }
    } catch (err: any) {
      errors.push(`audio-classifier: ${err.message}`);
    }

    // ── 8. FFmpeg segment features (requires video file) ──
    try {
      const segmentResult = await extractSegmentFeatures(videoPath);
      row.hook_motion_ratio = segmentResult.features.hook_motion_ratio;
      row.audio_energy_buildup = segmentResult.features.audio_energy_buildup;
      row.scene_rate_first_half_vs_second = segmentResult.features.scene_rate_first_half_vs_second;
      row.visual_variety_score = segmentResult.features.visual_variety_score;
      row.hook_audio_intensity = segmentResult.features.hook_audio_intensity;
      if (segmentResult.errors.length > 0) {
        errors.push(...segmentResult.errors.map(e => `segment: ${e}`));
      }
    } catch (err: any) {
      errors.push(`segment-features: ${err.message}`);
    }

    // ── 9. Vision hook features (Gemini Vision — requires video file) ──
    try {
      const visionResult = await extractVisionHookFeatures(videoPath);
      if (visionResult) {
        row.hook_face_present = visionResult.hook_face_present;
        row.hook_text_overlay = visionResult.hook_text_overlay;
        row.hook_composition_score = visionResult.hook_composition_score;
        row.hook_emotion_intensity = visionResult.hook_emotion_intensity;
      }
    } catch (err: any) {
      errors.push(`vision-hook: ${err.message}`);
    }

    // ── 10. Wave 2: Gemini Vision frame classifier features ──
    try {
      const duration = row.ffmpeg_duration_seconds || video.duration_seconds || 0;
      const frameFeatures = await extractFrameFeatures(videoPath, duration);
      if (frameFeatures) {
        row.visual_proof_ratio = frameFeatures.visual_proof_ratio;
        row.talking_head_ratio = frameFeatures.talking_head_ratio;
        row.text_overlay_density = frameFeatures.text_overlay_density;
        row.visual_to_verbal_ratio = frameFeatures.visual_to_verbal_ratio;
      }
    } catch (err: any) {
      errors.push(`frame-classifier: ${err.message}`);
    }

    // Keep downloaded videos for future re-analysis
  }

  row.extraction_errors = errors;
  row.extraction_duration_ms = Date.now() - startTime;

  return row;
}

// ============================================================================
// FEATURE EXTRACTORS
// ============================================================================

function extractTextFeatures(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const transcript = video.transcript_text || '';
  const caption = video.caption || '';

  if (!transcript && !caption) return;

  const text = transcript || caption;
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lower = text.toLowerCase();

  row.text_word_count = words.length;
  row.text_sentence_count = sentences.length;
  row.text_question_mark_count = (text.match(/\?/g) || []).length;
  row.text_exclamation_count = (text.match(/!/g) || []).length;
  row.text_transcript_length = text.length;
  row.text_avg_sentence_length = sentences.length > 0
    ? words.length / sentences.length
    : 0;

  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  row.text_unique_word_ratio = words.length > 0
    ? uniqueWords.size / words.length
    : 0;

  row.text_avg_word_length = words.length > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length
    : 0;

  // Syllable estimation
  const countSyllables = (word: string): number => {
    const matches = word.toLowerCase().match(/[aeiouy]+/g);
    return matches ? matches.length : 1;
  };
  row.text_syllable_count = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Flesch Reading Ease
  if (words.length > 0 && sentences.length > 0) {
    row.text_flesch_reading_ease = 206.835
      - 1.015 * (words.length / sentences.length)
      - 84.6 * (row.text_syllable_count / words.length);
  }

  // CTA detection
  row.text_has_cta = CTA_WORDS.some(w => lower.includes(w));

  // Sentiment
  row.text_positive_word_count = POSITIVE_WORDS.filter(w => lower.includes(w)).length;
  row.text_negative_word_count = NEGATIVE_WORDS.filter(w => lower.includes(w)).length;

  // Emoji count (from caption)
  const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g;
  row.text_emoji_count = (caption.match(emojiRegex) || []).length;
}

function extractMetadataFeatures(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const duration = video.duration_seconds || 0;
  const hashtags = video.hashtags || [];
  const followers = video.creator_followers_count || 0;

  row.meta_duration_seconds = duration;
  row.meta_hashtag_count = hashtags.length;
  row.meta_has_viral_hashtag = hashtags.some(h =>
    VIRAL_HASHTAGS.includes(h.toLowerCase().replace('#', ''))
  );
  row.meta_creator_followers = followers;
  row.meta_creator_followers_log = Math.log10(Math.max(1, followers));

  // Estimated WPM from metadata duration (may be overridden by FFmpeg duration)
  if (duration > 0 && row.text_word_count !== null && row.text_word_count > 0) {
    row.speaking_rate_wpm = (row.text_word_count / duration) * 60;
    row.meta_words_per_second = row.text_word_count / duration;
  }
}

function extractCreatorDistributionSignals(video: ScrapedVideo, row: TrainingFeatureRow): void {
  // Creator followers
  const followers = video.creator_followers_count;
  if (followers != null && followers >= 0) {
    row.creator_followers_count = followers;
    row.creator_followers_log = Math.log10(followers + 1);
  }

  // Post timing from upload_timestamp
  if (video.upload_timestamp) {
    const dt = new Date(video.upload_timestamp);
    if (!isNaN(dt.getTime())) {
      row.post_hour_utc = dt.getUTCHours();
      row.post_day_of_week = (dt.getUTCDay() + 6) % 7; // Convert Sun=0 → Mon=0
    }
  }

  // Original sound flag (boolean → integer 0/1)
  if (video.is_original_sound != null) {
    row.is_original_sound = video.is_original_sound ? 1 : 0;
  }
}

function extractHookFeatures(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const transcript = video.transcript_text || video.caption || '';
  if (!transcript) return;

  const hookResult = HookScorer.analyze(transcript);

  if (hookResult.success) {
    row.hook_score = hookResult.hookScore;
    row.hook_confidence = hookResult.hookConfidence;
    row.hook_text_score = hookResult.channels.text.score;
    row.hook_audio_score = hookResult.channels.audio.score;
    row.hook_visual_score = hookResult.channels.visual.score;
    row.hook_pace_score = hookResult.channels.pace.score;
    row.hook_tone_score = hookResult.channels.tone.score;

    const hookType = hookResult.hookType || 'weak';
    row.hook_type_encoded = HOOK_TYPE_MAP[hookType] ?? 0;
  }
}

// ============================================================================
// WAVE 1: TRANSCRIPT/AUDIO FEATURES (side-hustles niche)
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

// Dollar amount regex: $X, $X.XX, $X,XXX patterns
const DOLLAR_AMOUNT_REGEX = /\$[\d,]+(?:\.\d{1,2})?/g;
// Non-round number pattern (not ending in 000 or 00)
const NON_ROUND_REGEX = /\$[\d,]*[1-9]\d{0,1}(?:\.\d{1,2})?$/;

// Timeframe patterns
const TIMEFRAME_PATTERNS = [
  /first\s+(?:month|week|day)/gi,
  /in\s+\d+\s+(?:days?|weeks?|months?|years?)/gi,
  /per\s+(?:month|week|day|hour|year)/gi,
  /\d+\s+(?:days?|weeks?|months?)\s+(?:ago|later|in)/gi,
  /(?:every|each)\s+(?:month|week|day)/gi,
];

function extractSpecificityScore(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const transcript = video.transcript_text || video.caption || '';
  if (!transcript) return;

  const lower = transcript.toLowerCase();
  const durationMinutes = Math.max((video.duration_seconds || 60) / 60, 1);

  // Count named tools/platforms
  let namedToolsCount = 0;
  for (const tool of SIDE_HUSTLE_TOOLS) {
    const regex = new RegExp(`\\b${tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) namedToolsCount += matches.length;
  }

  // Count dollar amounts with specificity bonus for non-round numbers
  const dollarMatches = transcript.match(DOLLAR_AMOUNT_REGEX) || [];
  let specificAmountsCount = 0;
  for (const match of dollarMatches) {
    specificAmountsCount += NON_ROUND_REGEX.test(match) ? 1.5 : 1;
  }

  // Count timeframes
  let timeframesCount = 0;
  for (const pattern of TIMEFRAME_PATTERNS) {
    const matches = lower.match(pattern);
    if (matches) timeframesCount += matches.length;
  }

  row.specificity_score = (namedToolsCount * 2 + specificAmountsCount * 3 + timeframesCount * 1) / durationMinutes;
}

// Imperative action verbs for instructional density
const ACTION_VERBS = [
  'create', 'open', 'click', 'go', 'set up', 'sign up', 'upload', 'select',
  'type', 'paste', 'copy', 'build', 'start', 'launch', 'add', 'download',
  'install', 'connect', 'link', 'submit', 'publish', 'fill', 'choose',
  'enter', 'write', 'save', 'share', 'post', 'turn on', 'enable',
];

// Sequential markers
const SEQUENTIAL_MARKERS = [
  /\bfirst\b/gi, /\bsecond\b/gi, /\bthird\b/gi,
  /\bstep\s+\d+/gi, /\bnext\b/gi, /\bthen\b/gi,
  /\bfinally\b/gi, /\blastly\b/gi,
  /\bnumber\s+one\b/gi, /\bnumber\s+two\b/gi, /\bnumber\s+three\b/gi,
];

function extractInstructionalDensity(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const transcript = video.transcript_text || video.caption || '';
  if (!transcript) return;

  const lower = transcript.toLowerCase();
  const durationMinutes = Math.max((video.duration_seconds || 60) / 60, 1);

  // Count imperative constructions (verb at/near sentence start)
  let imperativeCount = 0;
  const sentences = transcript.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    for (const verb of ACTION_VERBS) {
      if (trimmed.startsWith(verb) || trimmed.startsWith('so ' + verb) || trimmed.startsWith('and ' + verb) || trimmed.startsWith('now ' + verb)) {
        imperativeCount++;
        break;
      }
    }
  }

  // Count sequential markers
  let sequentialMarkerCount = 0;
  for (const pattern of SEQUENTIAL_MARKERS) {
    const matches = lower.match(pattern);
    if (matches) sequentialMarkerCount += matches.length;
  }

  row.instructional_density = (imperativeCount + sequentialMarkerCount) / durationMinutes;
  row.has_step_structure = sequentialMarkerCount >= 3;
}

// Hedge phrases (case-insensitive)
const HEDGE_PHRASES = [
  'maybe', 'probably', 'i think', 'i guess', 'kind of', 'sort of',
  'might', 'could be', 'not sure', "i don't know", 'possibly', 'perhaps',
  'it depends', 'in my opinion', 'some people say', 'you could try',
  'it might work', "i'm not certain", 'i believe', 'i feel like',
];

function extractHedgeWordDensity(video: ScrapedVideo, row: TrainingFeatureRow): void {
  const transcript = video.transcript_text || video.caption || '';
  if (!transcript) return;

  const lower = transcript.toLowerCase();
  const wordCount = Math.max(transcript.split(/\s+/).filter(w => w.length > 0).length, 1);

  let hedgeCount = 0;
  for (const phrase of HEDGE_PHRASES) {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches) hedgeCount += matches.length;
  }

  row.hedge_word_density = hedgeCount / wordCount;
}

// Percentile anchors from 863-video dataset for vocal confidence normalization
const CONFIDENCE_ANCHORS = {
  pitch_variance: { p5: 0.5, p95: 45.0 },
  loudness_variance: { p5: 0.01, p95: 8.0 },
  silence_ratio: { p5: 0.01, p95: 0.45 },
  wpm_variance: { p5: 100, p95: 8000 },
};

function normalizeToUnit(value: number, p5: number, p95: number): number {
  return Math.max(0, Math.min(1, (value - p5) / (p95 - p5)));
}

function extractVocalConfidenceComposite(row: TrainingFeatureRow): void {
  const components: { value: number; weight: number }[] = [];

  if (row.audio_pitch_variance !== null) {
    const norm = normalizeToUnit(row.audio_pitch_variance, CONFIDENCE_ANCHORS.pitch_variance.p5, CONFIDENCE_ANCHORS.pitch_variance.p95);
    components.push({ value: 1 - norm, weight: 0.3 });
  }
  if (row.audio_loudness_variance !== null) {
    const norm = normalizeToUnit(row.audio_loudness_variance, CONFIDENCE_ANCHORS.loudness_variance.p5, CONFIDENCE_ANCHORS.loudness_variance.p95);
    components.push({ value: 1 - norm, weight: 0.3 });
  }
  if (row.audio_silence_ratio !== null) {
    const norm = normalizeToUnit(row.audio_silence_ratio, CONFIDENCE_ANCHORS.silence_ratio.p5, CONFIDENCE_ANCHORS.silence_ratio.p95);
    components.push({ value: 1 - norm, weight: 0.2 });
  }
  if (row.speaking_rate_wpm_variance !== null) {
    const norm = normalizeToUnit(row.speaking_rate_wpm_variance, CONFIDENCE_ANCHORS.wpm_variance.p5, CONFIDENCE_ANCHORS.wpm_variance.p95);
    components.push({ value: 1 - norm, weight: 0.2 });
  }

  if (components.length === 0) return;

  // Renormalize weights if some components are missing
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const composite = components.reduce((sum, c) => sum + c.value * (c.weight / totalWeight), 0);

  row.vocal_confidence_composite = Math.max(0, Math.min(1, composite));
}

// ============================================================================
// WAVE 2: GEMINI VISION FRAME CLASSIFIER
// ============================================================================

type FrameClassification =
  | 'talking_head'
  | 'screen_recording'
  | 'dashboard_screenshot'
  | 'product_demo'
  | 'text_card'
  | 'b_roll'
  | 'transition'
  | 'other';

interface FrameFeatureResult {
  visual_proof_ratio: number;
  talking_head_ratio: number;
  text_overlay_density: number;
  visual_to_verbal_ratio: number | null;
}

/**
 * Shared frame classifier: extracts 9 frames, classifies them with a single
 * Gemini Vision API call, then computes all Wave 2 features from the result.
 */
async function extractFrameFeatures(
  videoPath: string,
  durationSeconds: number,
): Promise<FrameFeatureResult | null> {
  const { GoogleGenAI } = await import('@google/genai');

  const apiKey =
    process.env.GOOGLE_GEMINI_AI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log('[FrameClassifier] No Gemini API key available, skipping');
    return null;
  }

  if (!existsSync(videoPath)) {
    console.log(`[FrameClassifier] Video file not found: ${videoPath}`);
    return null;
  }

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

    if (framePaths.length === 0) {
      console.log('[FrameClassifier] No frames extracted');
      return null;
    }

    console.log(`[FrameClassifier] Extracted ${framePaths.length} frames for classification`);

    // Build image parts
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (const fp of framePaths) {
      const imageBuffer = fs.readFileSync(fp);
      imageParts.push({
        inlineData: { mimeType: 'image/jpeg', data: imageBuffer.toString('base64') },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          ...imageParts,
          {
            text: `You are analyzing ${framePaths.length} frames extracted from a short-form video about side hustles / making money online.

For each frame, classify it as exactly one of: talking_head, screen_recording, dashboard_screenshot, product_demo, text_card, b_roll, transition, other.

Definitions:
- talking_head: Person speaking directly to camera, face visible
- screen_recording: Computer/phone screen being shown (software UI, website, app)
- dashboard_screenshot: Analytics dashboard, earnings report, revenue numbers on screen
- product_demo: Physical or digital product being demonstrated/shown
- text_card: Frame dominated by on-screen text overlay (title card, key point, URL)
- b_roll: Supplementary footage (lifestyle shots, stock footage, environment)
- transition: Brief transition effect between scenes
- other: Anything that doesn't fit the above categories

Return ONLY a JSON array of ${framePaths.length} strings in the same order as the frames. Example:
["talking_head", "screen_recording", "dashboard_screenshot", "talking_head", "product_demo", "text_card", "b_roll", "talking_head", "screen_recording"]`,
          },
        ],
      }],
    });

    const responseText = result.text || '';
    const classifications = parseFrameClassifications(responseText, framePaths.length);

    if (!classifications) {
      console.error('[FrameClassifier] Failed to parse classifications');
      return null;
    }

    console.log(`[FrameClassifier] Classifications: ${classifications.join(', ')}`);

    // Compute all Wave 2 features from classifications
    const totalFrames = classifications.length;
    const durationMinutes = Math.max(duration / 60, 1);

    // visual_proof_ratio
    const proofTypes: FrameClassification[] = ['screen_recording', 'dashboard_screenshot', 'product_demo'];
    const proofFrames = classifications.filter(c => proofTypes.includes(c)).length;
    const visual_proof_ratio = proofFrames / totalFrames;

    // talking_head_ratio
    const talkingHeadFrames = classifications.filter(c => c === 'talking_head').length;
    const talking_head_ratio = talkingHeadFrames / totalFrames;

    // text_overlay_density
    const textCardFrames = classifications.filter(c => c === 'text_card').length;
    const text_overlay_density = textCardFrames / durationMinutes;

    // visual_to_verbal_ratio — requires Whisper segments (not available in training extractor)
    // For the training pipeline, this is computed in the backfill script where segments may be available.
    // Here we output null since we don't have Whisper segment timestamps in the training pipeline.
    const visual_to_verbal_ratio: number | null = null;

    return {
      visual_proof_ratio,
      talking_head_ratio,
      text_overlay_density,
      visual_to_verbal_ratio,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[FrameClassifier] Failed: ${msg}`);
    return null;
  } finally {
    // Cleanup temp frame files
    for (const p of framePaths) {
      try {
        if (existsSync(p)) unlinkSync(p);
      } catch {
        // best-effort cleanup
      }
    }
  }
}

function parseFrameClassifications(responseText: string, expectedCount: number): FrameClassification[] | null {
  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    const validTypes: FrameClassification[] = [
      'talking_head', 'screen_recording', 'dashboard_screenshot',
      'product_demo', 'text_card', 'b_roll', 'transition', 'other',
    ];

    const result: FrameClassification[] = parsed.map((item: string) => {
      const lower = (item || '').toLowerCase().trim().replace(/\s+/g, '_');
      return validTypes.includes(lower as FrameClassification) ? (lower as FrameClassification) : 'other';
    });

    // Pad or trim to expected count
    while (result.length < expectedCount) result.push('other');
    return result.slice(0, expectedCount);
  } catch {
    return null;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Count the number of feature columns (excluding metadata columns).
 */
function countFeatureColumns(): number {
  // 12 FFmpeg + 10 Audio Prosodic + 4 Audio Classifier + 6 Speaking Rate
  // + 3 Visual + 5 Thumbnail + 8 Hook + 14 Text + 6 Metadata + 7 Content Strategy
  // + 5 Creator/Distribution = 80
  return 80;
}

/**
 * Get summary statistics for a completed extraction run.
 */
export async function getExtractionSummary(
  supabase: SupabaseClient
): Promise<{
  totalRows: number;
  avgFeaturesPopulated: number;
  latestExtraction: string | null;
  versionCounts: Record<number, number>;
}> {
  const { data: rows, error } = await supabase
    .from('training_features')
    .select('*')
    .order('extracted_at', { ascending: false });

  if (error || !rows) {
    return { totalRows: 0, avgFeaturesPopulated: 0, latestExtraction: null, versionCounts: {} };
  }

  const featureColumns = [
    'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
    'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
    'ffmpeg_bitrate', 'ffmpeg_fps', 'ffmpeg_has_audio',
    'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
    'audio_pitch_std_dev', 'audio_pitch_contour_slope',
    'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
    'audio_silence_ratio', 'audio_silence_count',
    'audio_music_ratio', 'audio_speech_ratio', 'audio_type_encoded', 'audio_energy_variance',
    'speaking_rate_wpm', 'speaking_rate_wpm_variance', 'speaking_rate_wpm_acceleration',
    'speaking_rate_wpm_peak_count', 'speaking_rate_fast_segments', 'speaking_rate_slow_segments',
    'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
    'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness',
    'thumb_overall_score', 'thumb_confidence',
    'hook_score', 'hook_confidence', 'hook_text_score', 'hook_audio_score',
    'hook_visual_score', 'hook_pace_score', 'hook_tone_score', 'hook_type_encoded',
    'text_word_count', 'text_sentence_count', 'text_question_mark_count',
    'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
    'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
    'text_flesch_reading_ease', 'text_has_cta',
    'text_positive_word_count', 'text_negative_word_count', 'text_emoji_count',
    'meta_duration_seconds', 'meta_hashtag_count', 'meta_has_viral_hashtag',
    'meta_creator_followers', 'meta_creator_followers_log', 'meta_words_per_second',
    'retention_open_loop_count', 'share_relatability_score', 'share_utility_score',
    'psych_curiosity_gap_score', 'psych_power_word_density', 'psych_direct_address_ratio',
    'psych_social_proof_count',
    'creator_followers_count', 'creator_followers_log', 'post_hour_utc',
    'post_day_of_week', 'is_original_sound',
  ];

  let totalPopulated = 0;
  const versionCounts: Record<number, number> = {};

  for (const row of rows) {
    let populated = 0;
    for (const col of featureColumns) {
      if ((row as any)[col] !== null && (row as any)[col] !== undefined) {
        populated++;
      }
    }
    totalPopulated += populated;
    versionCounts[row.extraction_version] = (versionCounts[row.extraction_version] || 0) + 1;
  }

  return {
    totalRows: rows.length,
    avgFeaturesPopulated: rows.length > 0 ? Math.round(totalPopulated / rows.length) : 0,
    latestExtraction: rows.length > 0 ? rows[0].extracted_at : null,
    versionCounts,
  };
}
