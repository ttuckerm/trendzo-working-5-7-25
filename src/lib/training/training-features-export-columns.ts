/**
 * training_features columns included in scraped CSV export (content / pipeline features).
 * Excludes: table keys, extraction bookkeeping, eligibility flags, and creator_followers_count
 * (duplicate of scraped_videos.creator_followers_count — scraped is authoritative).
 */

export const CONTENT_FEATURE_COLUMNS = [
  // FFmpeg canonical
  'ffmpeg_scene_changes',
  'ffmpeg_cuts_per_second',
  'ffmpeg_avg_motion',
  'ffmpeg_color_variance',
  'ffmpeg_brightness_avg',
  'ffmpeg_contrast_score',
  'ffmpeg_resolution_width',
  'ffmpeg_resolution_height',
  'ffmpeg_duration_seconds',
  'ffmpeg_bitrate',
  'ffmpeg_fps',
  'ffmpeg_has_audio',
  // Audio prosodic + classifier
  'audio_pitch_mean_hz',
  'audio_pitch_variance',
  'audio_pitch_range',
  'audio_pitch_std_dev',
  'audio_pitch_contour_slope',
  'audio_loudness_mean_lufs',
  'audio_loudness_range',
  'audio_loudness_variance',
  'audio_silence_ratio',
  'audio_silence_count',
  'audio_music_ratio',
  'audio_speech_ratio',
  'audio_type_encoded',
  'audio_energy_variance',
  // Speaking rate
  'speaking_rate_wpm',
  'speaking_rate_wpm_variance',
  'speaking_rate_wpm_acceleration',
  'speaking_rate_wpm_peak_count',
  'speaking_rate_fast_segments',
  'speaking_rate_slow_segments',
  // Visual scene
  'visual_scene_count',
  'visual_avg_scene_duration',
  'visual_score',
  // Thumbnail
  'thumb_brightness',
  'thumb_contrast',
  'thumb_colorfulness',
  'thumb_overall_score',
  'thumb_confidence',
  // Hook scorer + segment / vision hook
  'hook_score',
  'hook_confidence',
  'hook_text_score',
  'hook_audio_score',
  'hook_visual_score',
  'hook_pace_score',
  'hook_tone_score',
  'hook_type_encoded',
  'hook_motion_ratio',
  'hook_audio_intensity',
  'hook_face_present',
  'hook_text_overlay',
  'hook_composition_score',
  'hook_emotion_intensity',
  // Text + strategy
  'text_word_count',
  'text_sentence_count',
  'text_question_mark_count',
  'text_exclamation_count',
  'text_transcript_length',
  'text_avg_sentence_length',
  'text_unique_word_ratio',
  'text_avg_word_length',
  'text_syllable_count',
  'text_flesch_reading_ease',
  'text_has_cta',
  'text_positive_word_count',
  'text_negative_word_count',
  'text_emoji_count',
  'retention_open_loop_count',
  'share_relatability_score',
  'share_utility_score',
  'psych_curiosity_gap_score',
  'psych_power_word_density',
  'psych_direct_address_ratio',
  'psych_social_proof_count',
  'specificity_score',
  'instructional_density',
  'has_step_structure',
  'hedge_word_density',
  'vocal_confidence_composite',
  // Extracted metadata snapshot (differs from scrape timing; model may use)
  'meta_duration_seconds',
  'meta_hashtag_count',
  'meta_has_viral_hashtag',
  'meta_creator_followers',
  'meta_creator_followers_log',
  'meta_words_per_second',
  // FFmpeg segment aggregates
  'audio_energy_buildup',
  'scene_rate_first_half_vs_second',
  'visual_variety_score',
  // Vision frame classifier
  'visual_proof_ratio',
  'talking_head_ratio',
  'visual_to_verbal_ratio',
  'text_overlay_density',
  // Mirrored distribution signals (namespaced vs scraped timing columns)
  'creator_followers_log',
  'post_hour_utc',
  'post_day_of_week',
  'is_original_sound',
] as const;

export type ContentFeatureColumn = (typeof CONTENT_FEATURE_COLUMNS)[number];

/** Boolean-like columns stored in training_features */
export const CONTENT_BINARY_COLUMNS = new Set<string>([
  'ffmpeg_has_audio',
  'text_has_cta',
  'meta_has_viral_hashtag',
  'has_step_structure',
]);

/** Low-cardinality encodings */
export const CONTENT_CATEGORICAL_COLUMNS = new Set<string>(['audio_type_encoded', 'hook_type_encoded']);

export function contentFeatureGroup(name: string): string {
  const ffmpegSegment = new Set([
    'hook_motion_ratio',
    'audio_energy_buildup',
    'scene_rate_first_half_vs_second',
    'visual_variety_score',
    'hook_audio_intensity',
  ]);
  if (ffmpegSegment.has(name)) return 'ffmpeg';
  if (name.startsWith('ffmpeg_')) return 'ffmpeg';
  if (name.startsWith('speaking_rate_')) return 'audio';
  if (name.startsWith('audio_')) return 'audio';
  if (name.startsWith('hook_')) return 'hook';
  if (name.startsWith('thumb_')) return 'thumbnail';
  if (
    name === 'talking_head_ratio' ||
    name === 'visual_proof_ratio' ||
    name === 'visual_to_verbal_ratio' ||
    name === 'text_overlay_density'
  ) {
    return 'visual';
  }
  if (name.startsWith('visual_')) return 'visual';
  if (name.startsWith('text_')) return 'text';
  if (
    name.startsWith('retention_') ||
    name.startsWith('share_') ||
    name.startsWith('psych_') ||
    name === 'specificity_score' ||
    name === 'instructional_density' ||
    name === 'has_step_structure' ||
    name === 'hedge_word_density' ||
    name === 'vocal_confidence_composite'
  ) {
    return 'text';
  }
  if (name.startsWith('meta_')) return 'meta_extracted';
  if (['creator_followers_log', 'post_hour_utc', 'post_day_of_week', 'is_original_sound'].includes(name)) {
    return 'distribution_tf';
  }
  return 'other';
}

export interface ContentFeatureSanityChecks {
  hook_column: string | null;
  loudness_column: string | null;
  scene_column: string | null;
  readability_column: string | null;
  contrast_column: string | null;
  resolution_column: string | null;
  missing_categories: string[];
}

export function sanityCheckContentColumns(): ContentFeatureSanityChecks {
  const set = new Set(CONTENT_FEATURE_COLUMNS as readonly string[]);
  const pick = (...candidates: string[]) => candidates.find((c) => set.has(c)) ?? null;

  const hook_column = pick('hook_score');
  const loudness_column = pick('audio_loudness_mean_lufs');
  const scene_column = pick('ffmpeg_scene_changes', 'visual_scene_count');
  const readability_column = pick('text_flesch_reading_ease');
  const contrast_column = pick('thumb_contrast');
  const resolution_column = pick('ffmpeg_resolution_height', 'ffmpeg_resolution_width');

  const missing_categories: string[] = [];
  if (!hook_column) missing_categories.push('hook');
  if (!loudness_column) missing_categories.push('loudness_or_lufs');
  if (!scene_column) missing_categories.push('scene');
  if (!readability_column) missing_categories.push('readability_or_flesch');
  if (!contrast_column) missing_categories.push('contrast_or_thumbnail');
  if (!resolution_column) missing_categories.push('resolution_or_height');

  return {
    hook_column,
    loudness_column,
    scene_column,
    readability_column,
    contrast_column,
    resolution_column,
    missing_categories,
  };
}
