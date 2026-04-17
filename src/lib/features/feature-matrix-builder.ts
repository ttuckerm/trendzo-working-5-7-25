/**
 * Feature Matrix Builder — assembles complete feature row for XGBoost training
 *
 * Merges content features (58 from v10) with creator trajectory features (5).
 * Used by the retrain pipeline to build the training data matrix.
 */

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { extractCreatorFeatures, CREATOR_FEATURE_NAMES } from './creator-trajectory'
import { extractCulturalFeatures, CULTURAL_FEATURE_NAMES } from './cultural-momentum'
import { extractAudienceFeatures, AUDIENCE_FEATURE_NAMES } from './audience-quality'
import { extractDistributionFeatures, DISTRIBUTION_FEATURE_NAMES } from './distribution-signals'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any

// Canonical v10 content features (58)
export const V10_FEATURES = [
  'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second', 'ffmpeg_avg_motion',
  'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
  'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_duration_seconds',
  'ffmpeg_bitrate', 'ffmpeg_fps',
  'audio_pitch_mean_hz', 'audio_pitch_variance', 'audio_pitch_range',
  'audio_pitch_std_dev', 'audio_pitch_contour_slope',
  'audio_loudness_mean_lufs', 'audio_loudness_range', 'audio_loudness_variance',
  'audio_silence_ratio', 'audio_silence_count',
  'speaking_rate_wpm',
  'visual_scene_count', 'visual_avg_scene_duration', 'visual_score',
  'thumb_brightness', 'thumb_contrast', 'thumb_colorfulness', 'thumb_overall_score',
  'hook_score', 'hook_confidence', 'hook_text_score', 'hook_type_encoded',
  'text_word_count', 'text_sentence_count', 'text_question_mark_count',
  'text_exclamation_count', 'text_transcript_length', 'text_avg_sentence_length',
  'text_unique_word_ratio', 'text_avg_word_length', 'text_syllable_count',
  'text_flesch_reading_ease', 'text_has_cta', 'text_negative_word_count',
  'text_emoji_count',
  'meta_duration_seconds', 'meta_words_per_second',
  'text_overlay_density', 'visual_proof_ratio', 'vocal_confidence_composite',
  'creator_followers_log', 'post_hour_utc', 'post_day_of_week',
  'specificity_score', 'instructional_density', 'has_step_structure', 'hedge_word_density',
] as const

/** Complete feature list: 58 content + 5 creator + 4 cultural + 5 audience + 6 distribution = 78 */
export const ALL_FEATURES = [...V10_FEATURES, ...CREATOR_FEATURE_NAMES, ...CULTURAL_FEATURE_NAMES, ...AUDIENCE_FEATURE_NAMES, ...DISTRIBUTION_FEATURE_NAMES]

/** Total expected feature count */
export const FEATURE_COUNT = ALL_FEATURES.length // 78

function getServiceClient(): DB {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

/**
 * Build a complete feature row for a prediction_run, combining all feature families.
 *
 * @param contentFeatures - Pre-extracted content features (58 v10 features)
 * @param creatorId - Creator who posted the video
 * @param videoPostDate - When the video was posted (for trajectory window)
 * @param niche - Video's niche classification
 * @param topic - Video's topic/title for cultural event matching
 * @param videoId - Video ID for distribution signal lookup in scraped_videos
 * @param db - Optional Supabase client
 * @returns Combined feature record (78 features)
 */
export async function buildFeatureRow(
  contentFeatures: Record<string, number | null>,
  creatorId: string | null,
  videoPostDate: Date,
  niche: string,
  topic: string,
  videoId?: string,
  db?: DB,
): Promise<Record<string, number | null>> {
  const client = db || getServiceClient()
  const combined: Record<string, number | null> = { ...contentFeatures }

  // Add creator trajectory features
  if (creatorId) {
    const creatorFeatures = await extractCreatorFeatures(creatorId, videoPostDate, client)
    combined.creator_momentum_30d = creatorFeatures.creator_momentum_30d
    combined.creator_avg_vps_90d = creatorFeatures.creator_avg_vps_90d
    combined.creator_viral_recency = creatorFeatures.creator_viral_recency
    combined.creator_consistency_score = creatorFeatures.creator_consistency_score
    combined.creator_trajectory_label = creatorFeatures.creator_trajectory_label
  } else {
    combined.creator_momentum_30d = 0
    combined.creator_avg_vps_90d = 50
    combined.creator_viral_recency = 365
    combined.creator_consistency_score = 50
    combined.creator_trajectory_label = 1
  }

  // Add cultural momentum features
  const culturalFeatures = await extractCulturalFeatures(niche, topic, videoPostDate, client)
  combined.cultural_momentum_score = culturalFeatures.cultural_momentum_score
  combined.trend_phase_encoded = culturalFeatures.trend_phase_encoded
  combined.niche_activation_score = culturalFeatures.niche_activation_score
  combined.cultural_timing_advantage = culturalFeatures.cultural_timing_advantage

  // Add audience quality features
  const audienceFeatures = await extractAudienceFeatures(creatorId || '', client)
  combined.follower_count_log = audienceFeatures.follower_count_log
  combined.engagement_rate_estimate = audienceFeatures.engagement_rate_estimate
  combined.follower_growth_velocity = audienceFeatures.follower_growth_velocity
  combined.audience_size_tier = audienceFeatures.audience_size_tier
  combined.follower_quality_score = audienceFeatures.follower_quality_score

  // Add distribution signal features
  const distFeatures = await extractDistributionFeatures(videoId || '', audienceFeatures.audience_size_tier, client)
  combined.post_hour_score = distFeatures.post_hour_score
  combined.post_day_score = distFeatures.post_day_score
  combined.hashtag_strategy_score = distFeatures.hashtag_strategy_score
  combined.sound_advantage_score = distFeatures.sound_advantage_score
  combined.early_velocity_signal = distFeatures.early_velocity_signal
  combined.distribution_composite = distFeatures.distribution_composite

  return combined
}
