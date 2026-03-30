/**
 * Phase 81: Training Pipeline v2 — Feature Availability Matrix
 *
 * TypeScript source of truth for feature contamination prevention.
 * Every feature extracted by feature-extractor.ts is cataloged here
 * with its pre/post availability and category.
 *
 * RULE: Features that are only knowable AFTER a video is published
 * (views, likes, engagement rates, etc.) must NEVER be used in
 * pre-execution prediction models (POP). Using them is data leakage.
 *
 * CLASSIFICATION STRATEGY:
 *  1. Explicit entries in FEATURE_MATRIX take highest precedence.
 *  2. Prefix rules in POST_FEATURE_PREFIXES catch any `actual_*` etc.
 *  3. Prefix rules in PRE_FEATURE_PREFIXES allow `ffmpeg_*`, `gemini_*`,
 *     `llm_*` features that may not yet be explicitly cataloged.
 *  4. If none of the above match, the feature is UNKNOWN.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContaminationReason =
  | 'allowed_explicit'        // In matrix, available_pre = true
  | 'allowed_pre_prefix'      // Matches a known PRE prefix (ffmpeg_, gemini_, llm_)
  | 'blocked_explicit'        // In matrix, available_pre = false
  | 'blocked_post_prefix'     // Matches a known POST prefix (actual_)
  | 'blocked_contaminated'    // In CONTAMINATED_FEATURES list
  | 'unknown_feature';        // Not in matrix, no prefix match

export interface FeatureClassification {
  allowed: boolean;
  reason: ContaminationReason;
  category: string;
}

export interface FeatureAvailability {
  /** Available before video is published (safe for prediction) */
  available_pre: boolean;
  /** Available after video is published (outcome data) */
  available_post: boolean;
  /** Used in Pop (Pre-execution Outcome Prediction) model */
  used_in_pop: boolean;
  /** Feature group category */
  category: string;
}

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

/**
 * Check whether Training Pipeline v2 is enabled.
 * All v2 contamination checks are gated behind this flag.
 */
export function TRAINING_V2_ENABLED(): boolean {
  return process.env.TRAINING_V2_ENABLED === 'true';
}

/**
 * Check whether Training Ingest (Phase 82) is enabled.
 * Gates the /api/admin/training-ingest endpoint and UI section.
 */
export function TRAINING_INGEST_ENABLED(): boolean {
  return process.env.TRAINING_INGEST_ENABLED === 'true';
}

/**
 * Check whether Metric Collector (Phase 83) is enabled.
 * Gates the /api/admin/metric-collector/run endpoint and UI button.
 */
export function METRIC_COLLECTOR_ENABLED(): boolean {
  return process.env.METRIC_COLLECTOR_ENABLED === 'true';
}

// ---------------------------------------------------------------------------
// Prefix-based classification rules
// ---------------------------------------------------------------------------

/**
 * Prefixes for features that are ALWAYS available pre-execution.
 * These are derived from the raw video file, transcript, or LLM analysis
 * at upload time — never from post-publication performance data.
 *
 * If a feature starts with one of these prefixes and is NOT in the
 * explicit matrix, it is automatically classified as PRE (safe).
 */
export const PRE_FEATURE_PREFIXES: { prefix: string; category: string }[] = [
  { prefix: 'ffmpeg_',  category: 'ffmpeg' },
  { prefix: 'gemini_',  category: 'gemini' },
  { prefix: 'llm_',     category: 'llm_framework' },
];

/**
 * Prefixes for features that are NEVER available pre-execution.
 * Any feature starting with these prefixes is automatically blocked,
 * even if not explicitly listed in CONTAMINATED_FEATURES.
 */
export const POST_FEATURE_PREFIXES: { prefix: string; category: string }[] = [
  { prefix: 'actual_', category: 'outcome' },
];

// ---------------------------------------------------------------------------
// Contaminated features (Group 3 — post-execution only)
// ---------------------------------------------------------------------------

/**
 * Explicit list of features that are NEVER available pre-execution.
 * These represent actual outcome metrics or derived engagement stats
 * that would constitute data leakage if used in prediction.
 */
export const CONTAMINATED_FEATURES: string[] = [
  // Raw outcome counts
  'actual_views',
  'actual_likes',
  'actual_comments',
  'actual_shares',
  'actual_saves',
  'actual_dps',
  'actual_tier',
  'actual_engagement_rate',

  // Derived engagement rates (computed from post-publication metrics)
  'engagement_rate',
  'like_rate',
  'comment_rate',
  'share_rate',
  'save_rate',
  'viral_coefficient',

  // Alternate naming of outcome counts
  'views_count',
  'likes_count',
  'comments_count',
  'shares_count',
  'saves_count',

  // DPS (Distribution Performance Score) metrics
  'dps_score',
  'dps_percentile',

  // Binary viral flags (derived from post-publication performance)
  'is_viral',
  'is_mega_viral',

  // Days since upload (changes over time — not a stable pre feature)
  'days_since_upload',
];

// ---------------------------------------------------------------------------
// Full feature matrix
// ---------------------------------------------------------------------------

/** Helper to build a PRE entry */
const PRE = (category: string, pop = true): FeatureAvailability => ({
  available_pre: true, available_post: true, used_in_pop: pop, category,
});

/** Helper to build a POST (contaminated) entry */
const POST = (category: string): FeatureAvailability => ({
  available_pre: false, available_post: true, used_in_pop: false, category,
});

/**
 * Complete catalog of every known feature, organized by extraction group.
 * Source of truth mirrors:
 *   - src/lib/services/training/feature-extractor.ts
 *   - src/lib/services/feature-extraction/types.ts (Groups A–L)
 */
export const FEATURE_MATRIX: Record<string, FeatureAvailability> = {
  // -----------------------------------------------------------------------
  // Group 1 / Group A: Basic Text Metrics (25 features)
  // -----------------------------------------------------------------------
  word_count:                   PRE('text'),
  char_count:                   PRE('text'),
  caption_word_count:           PRE('text'),
  title_word_count:             PRE('text'),
  title_has_number:             PRE('text'),
  title_has_question:           PRE('text'),
  avg_word_length:              PRE('text'),
  unique_word_ratio:            PRE('text'),
  unique_word_count:            PRE('text'),
  sentence_count:               PRE('text'),
  avg_sentence_length:          PRE('text'),
  question_count:               PRE('text'),
  has_question:                 PRE('text'),
  exclamation_count:            PRE('text'),
  emotional_intensity:          PRE('text'),
  syllable_count:               PRE('text'),
  lexical_diversity:            PRE('text'),
  lexical_density:              PRE('text'),
  rare_word_count:              PRE('text'),

  // Readability indices (all derived from transcript at upload time)
  flesch_reading_ease:          PRE('text'),
  flesch_kincaid_grade:         PRE('text'),
  smog_index:                   PRE('text'),
  automated_readability_index:  PRE('text'),
  coleman_liau_index:           PRE('text'),
  gunning_fog_index:            PRE('text'),
  linsear_write_formula:        PRE('text'),

  // -----------------------------------------------------------------------
  // Group B: Punctuation Analysis (10 features)
  // -----------------------------------------------------------------------
  question_mark_count:  PRE('punctuation'),
  ellipsis_count:       PRE('punctuation'),
  comma_count:          PRE('punctuation'),
  period_count:         PRE('punctuation'),
  semicolon_count:      PRE('punctuation'),
  colon_count:          PRE('punctuation'),
  dash_count:           PRE('punctuation'),
  quotation_count:      PRE('punctuation'),
  parenthesis_count:    PRE('punctuation'),
  parentheses_count:    PRE('punctuation'), // alternate naming

  // -----------------------------------------------------------------------
  // Group C: Pronoun and Perspective (8 features)
  // -----------------------------------------------------------------------
  first_person_singular_count: PRE('pronoun'),
  first_person_plural_count:   PRE('pronoun'),
  first_person_count:          PRE('pronoun'), // combined alias
  second_person_count:         PRE('pronoun'),
  third_person_count:          PRE('pronoun'),
  first_person_ratio:          PRE('pronoun'),
  second_person_ratio:         PRE('pronoun'),
  third_person_ratio:          PRE('pronoun'),
  perspective_shift_count:     PRE('pronoun'),

  // -----------------------------------------------------------------------
  // Group D: Emotional and Power Words (20 features)
  // -----------------------------------------------------------------------
  positive_emotion_count:    PRE('emotional'),
  negative_emotion_count:    PRE('emotional'),
  power_word_count:          PRE('emotional'),
  urgency_word_count:        PRE('emotional'),
  curiosity_word_count:      PRE('emotional'),
  fear_word_count:           PRE('emotional'),
  trust_word_count:          PRE('emotional'),
  surprise_word_count:       PRE('emotional'),
  anger_word_count:          PRE('emotional'),
  sadness_word_count:        PRE('emotional'),
  joy_word_count:            PRE('emotional'),
  anticipation_word_count:   PRE('emotional'),
  disgust_word_count:        PRE('emotional'),
  emotional_intensity_score: PRE('emotional'),
  sentiment_polarity:        PRE('emotional'),
  sentiment_subjectivity:    PRE('emotional'),
  emotional_arc_pattern:     PRE('emotional'),
  emotional_volatility:      PRE('emotional'),
  positive_negative_ratio:   PRE('emotional'),
  net_emotional_impact:      PRE('emotional'),

  // -----------------------------------------------------------------------
  // Group E: Viral Pattern Words (15 features)
  // -----------------------------------------------------------------------
  shock_word_count:          PRE('viral_pattern'),
  controversy_word_count:    PRE('viral_pattern'),
  scarcity_word_count:       PRE('viral_pattern'),
  social_proof_word_count:   PRE('viral_pattern'),
  authority_word_count:      PRE('viral_pattern'),
  reciprocity_word_count:    PRE('viral_pattern'),
  commitment_word_count:     PRE('viral_pattern'),
  liking_word_count:         PRE('viral_pattern'),
  consensus_word_count:      PRE('viral_pattern'),
  storytelling_marker_count: PRE('viral_pattern'),
  conflict_word_count:       PRE('viral_pattern'),
  resolution_word_count:     PRE('viral_pattern'),
  transformation_word_count: PRE('viral_pattern'),
  revelation_word_count:     PRE('viral_pattern'),
  call_to_action_count:      PRE('viral_pattern'),

  // -----------------------------------------------------------------------
  // Group F: Capitalization and Formatting (5 features)
  // -----------------------------------------------------------------------
  all_caps_word_count:    PRE('formatting'),
  title_case_ratio:       PRE('formatting'),
  sentence_case_ratio:    PRE('formatting'),
  mixed_case_ratio:       PRE('formatting'),
  caps_lock_abuse_score:  PRE('formatting'),

  // -----------------------------------------------------------------------
  // Group G: Linguistic Complexity (10 features)
  // -----------------------------------------------------------------------
  polysyllabic_word_count:    PRE('linguistic'),
  complex_word_ratio:         PRE('linguistic'),
  jargon_count:               PRE('linguistic'),
  slang_count:                PRE('linguistic'),
  acronym_count:              PRE('linguistic'),
  technical_term_count:       PRE('linguistic'),
  simple_word_ratio:          PRE('linguistic'),
  average_syllables_per_word: PRE('linguistic'),

  // -----------------------------------------------------------------------
  // Group H: Dialogue and Interaction (5 features)
  // -----------------------------------------------------------------------
  direct_question_count:       PRE('dialogue'),
  rhetorical_question_count:   PRE('dialogue'),
  imperative_sentence_count:   PRE('dialogue'),
  dialogue_marker_count:       PRE('dialogue'),
  conversational_tone_score:   PRE('dialogue'),

  // -----------------------------------------------------------------------
  // Group I: Content Structure Signals (8 features)
  // -----------------------------------------------------------------------
  has_numbered_list:      PRE('content_structure'),
  has_bullet_points:      PRE('content_structure'),
  list_item_count:        PRE('content_structure'),
  section_count:          PRE('content_structure'),
  transition_word_count:  PRE('content_structure'),
  introduction_length:    PRE('content_structure'),
  conclusion_length:      PRE('content_structure'),
  body_to_intro_ratio:    PRE('content_structure'),
  has_numbers:            PRE('content_structure'),
  number_count:           PRE('content_structure'),
  has_list_format:        PRE('content_structure'),
  has_story_format:       PRE('content_structure'),
  has_tutorial_format:    PRE('content_structure'),

  // -----------------------------------------------------------------------
  // Group J: Timestamp and Pacing (4 features)
  // -----------------------------------------------------------------------
  words_per_second:     PRE('pacing'),
  silence_pause_count:  PRE('pacing'),
  rapid_fire_segments:  PRE('pacing'),
  slow_segments:        PRE('pacing'),

  // -----------------------------------------------------------------------
  // Group K: Video Metadata (10 features)
  // -----------------------------------------------------------------------
  video_duration_seconds: PRE('video_metadata'),
  title_length:           PRE('video_metadata'),
  description_length:     PRE('video_metadata'),
  caption_length:         PRE('video_metadata'),
  hashtag_total_chars:    PRE('video_metadata'),
  has_location:           PRE('video_metadata'),
  duration_seconds:       PRE('video_metadata'),
  duration_log:           PRE('video_metadata'),
  is_short_video:         PRE('video_metadata'),
  is_medium_video:        PRE('video_metadata'),
  is_long_video:          PRE('video_metadata'),
  optimal_duration:       PRE('video_metadata'),
  fast_pace:              PRE('video_metadata'),
  slow_pace:              PRE('video_metadata'),

  // -----------------------------------------------------------------------
  // Group 2: Hook (5 features)
  // -----------------------------------------------------------------------
  hook_word_count:    PRE('hook'),
  hook_has_question:  PRE('hook'),
  hook_has_you:       PRE('hook'),
  hook_has_number:    PRE('hook'),
  hook_pattern_match: PRE('hook'),

  // -----------------------------------------------------------------------
  // Group 3 / Group L: Outcome / Engagement — CONTAMINATED (25 features)
  // -----------------------------------------------------------------------
  actual_views:            POST('outcome'),
  actual_likes:            POST('outcome'),
  actual_comments:         POST('outcome'),
  actual_shares:           POST('outcome'),
  actual_saves:            POST('outcome'),
  actual_dps:              POST('outcome'),
  actual_tier:             POST('outcome'),
  actual_engagement_rate:  POST('outcome'),
  engagement_rate:         POST('outcome'),
  like_rate:               POST('outcome'),
  comment_rate:            POST('outcome'),
  share_rate:              POST('outcome'),
  save_rate:               POST('outcome'),
  viral_coefficient:       POST('outcome'),
  views_count:             POST('outcome'),
  likes_count:             POST('outcome'),
  comments_count:          POST('outcome'),
  shares_count:            POST('outcome'),
  saves_count:             POST('outcome'),
  dps_score:               POST('outcome'),
  dps_percentile:          POST('outcome'),
  is_viral:                POST('outcome'),
  is_mega_viral:           POST('outcome'),
  days_since_upload:       POST('outcome'),

  // -----------------------------------------------------------------------
  // Group 4: Creator (5 features)
  // -----------------------------------------------------------------------
  creator_followers:     PRE('creator'),
  creator_followers_log: PRE('creator'),
  is_large_creator:      PRE('creator'),
  is_medium_creator:     PRE('creator'),
  is_small_creator:      PRE('creator'),

  // -----------------------------------------------------------------------
  // Group 6: Hashtag (5 features)
  // -----------------------------------------------------------------------
  hashtag_count:       PRE('hashtag'),
  has_hashtags:        PRE('hashtag'),
  hashtag_diversity:   PRE('hashtag'),
  viral_hashtag_count: PRE('hashtag'),
  has_viral_hashtag:   PRE('hashtag'),

  // -----------------------------------------------------------------------
  // Group 7: Sentiment (5 features)
  // -----------------------------------------------------------------------
  positive_word_count: PRE('sentiment'),
  negative_word_count: PRE('sentiment'),
  sentiment_score:     PRE('sentiment'),
  emoji_count:         PRE('sentiment'),
  has_emoji:           PRE('sentiment'),

  // -----------------------------------------------------------------------
  // Group 8: CTA (3 features)
  // -----------------------------------------------------------------------
  cta_count:      PRE('cta'),
  has_cta:        PRE('cta'),
  has_follow_cta: PRE('cta'),

  // -----------------------------------------------------------------------
  // Group 9: Trend (2 features)
  // -----------------------------------------------------------------------
  niche_keyword_count: PRE('trend'),
  niche_alignment:     PRE('trend'),

  // -----------------------------------------------------------------------
  // Group 10: Timing (4 features)
  // -----------------------------------------------------------------------
  upload_hour:        PRE('timing'),
  upload_day_of_week: PRE('timing'),
  is_weekend:         PRE('timing'),
  is_prime_time:      PRE('timing'),

  // -----------------------------------------------------------------------
  // Group 12: FFmpeg (16 features — explicit; prefix catches any extras)
  // -----------------------------------------------------------------------
  ffmpeg_extraction_success: PRE('ffmpeg'),
  ffmpeg_resolution_width:   PRE('ffmpeg'),
  ffmpeg_resolution_height:  PRE('ffmpeg'),
  ffmpeg_fps:                PRE('ffmpeg'),
  ffmpeg_duration_seconds:   PRE('ffmpeg'),
  ffmpeg_aspect_ratio:       PRE('ffmpeg'),
  ffmpeg_has_audio:          PRE('ffmpeg'),
  ffmpeg_audio_codec:        PRE('ffmpeg'),
  ffmpeg_video_codec:        PRE('ffmpeg'),
  ffmpeg_bitrate:            PRE('ffmpeg'),
  ffmpeg_scene_changes:      PRE('ffmpeg'),
  ffmpeg_cuts_per_second:    PRE('ffmpeg'),
  ffmpeg_avg_motion:         PRE('ffmpeg'),
  ffmpeg_color_variance:     PRE('ffmpeg'),
  ffmpeg_brightness_avg:     PRE('ffmpeg'),
  ffmpeg_contrast_score:     PRE('ffmpeg'),

  // -----------------------------------------------------------------------
  // Group 13: LLM Framework (9 features — explicit; prefix catches extras)
  // -----------------------------------------------------------------------
  llm_hook_strength:   PRE('llm_framework'),
  llm_emotional_arc:   PRE('llm_framework'),
  llm_value_density:   PRE('llm_framework'),
  llm_curiosity_gap:   PRE('llm_framework'),
  llm_shareability:    PRE('llm_framework'),
  llm_pacing:          PRE('llm_framework'),
  llm_authority:       PRE('llm_framework'),
  llm_relatability:    PRE('llm_framework'),
  llm_viral_potential: PRE('llm_framework'),

  // -----------------------------------------------------------------------
  // Group 14: Pattern (10 features)
  // -----------------------------------------------------------------------
  pattern_lego_count:      PRE('pattern'),
  pattern_has_topic:       PRE('pattern'),
  pattern_has_angle:       PRE('pattern'),
  pattern_has_hook:        PRE('pattern'),
  pattern_has_story:       PRE('pattern'),
  pattern_has_visual:      PRE('pattern'),
  pattern_has_key_visuals: PRE('pattern'),
  pattern_has_audio:       PRE('pattern'),
  pattern_style_match:     PRE('pattern'),
  pattern_attr_avg:        PRE('pattern'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Classify a feature by checking (in order):
 *  1. Explicit CONTAMINATED_FEATURES list
 *  2. POST_FEATURE_PREFIXES (e.g. actual_*)
 *  3. Explicit FEATURE_MATRIX entry
 *  4. PRE_FEATURE_PREFIXES (e.g. ffmpeg_*, gemini_*, llm_*)
 *  5. Unknown
 */
export function classifyFeature(featureName: string): FeatureClassification {
  // 1. Explicit contaminated list — always blocked
  if (CONTAMINATED_FEATURES.includes(featureName)) {
    return { allowed: false, reason: 'blocked_contaminated', category: 'outcome' };
  }

  // 2. POST prefix match (e.g. actual_*)
  for (const rule of POST_FEATURE_PREFIXES) {
    if (featureName.startsWith(rule.prefix)) {
      return { allowed: false, reason: 'blocked_post_prefix', category: rule.category };
    }
  }

  // 3. Explicit matrix entry
  const entry = FEATURE_MATRIX[featureName];
  if (entry) {
    if (entry.available_pre) {
      return { allowed: true, reason: 'allowed_explicit', category: entry.category };
    }
    return { allowed: false, reason: 'blocked_explicit', category: entry.category };
  }

  // 4. PRE prefix match (e.g. ffmpeg_*, gemini_*, llm_*)
  for (const rule of PRE_FEATURE_PREFIXES) {
    if (featureName.startsWith(rule.prefix)) {
      return { allowed: true, reason: 'allowed_pre_prefix', category: rule.category };
    }
  }

  // 5. Unknown feature — blocked by default (closed-world assumption)
  return { allowed: false, reason: 'unknown_feature', category: 'unknown' };
}

/**
 * Check whether a single feature is allowed for use in POP
 * (Pre-execution Outcome Prediction) models.
 *
 * Uses the full classification chain: explicit matrix → prefix rules.
 */
export function isFeatureAllowedForPOP(featureName: string): boolean {
  return classifyFeature(featureName).allowed;
}

/**
 * Given an array of feature keys (e.g. from a training data row),
 * return all keys that are contaminated (post-execution only).
 *
 * Returns an empty array if the input is clean.
 */
export function getContaminatedFromKeys(keys: string[]): string[] {
  return keys.filter((key) => !classifyFeature(key).allowed);
}
