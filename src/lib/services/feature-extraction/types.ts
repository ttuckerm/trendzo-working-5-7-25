/**
 * Feature Extraction Types and Interfaces
 *
 * Defines 100 features across Groups A-L that can be extracted from
 * existing transcript and metadata without requiring visual/audio analysis
 */

// ============================================================================
// GROUP A: BASIC TEXT METRICS (15 features)
// ============================================================================
export interface BasicTextMetrics {
  word_count: number;
  char_count: number;
  sentence_count: number;
  avg_word_length: number;
  avg_sentence_length: number;
  unique_word_count: number;
  lexical_diversity: number; // unique_words / total_words
  syllable_count: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  smog_index: number;
  automated_readability_index: number;
  coleman_liau_index: number;
  gunning_fog_index: number;
  linsear_write_formula: number;
}

// ============================================================================
// GROUP B: PUNCTUATION ANALYSIS (10 features)
// ============================================================================
export interface PunctuationAnalysis {
  question_mark_count: number;
  exclamation_count: number;
  ellipsis_count: number;
  comma_count: number;
  period_count: number;
  semicolon_count: number;
  colon_count: number;
  dash_count: number;
  quotation_count: number;
  parenthesis_count: number;
}

// ============================================================================
// GROUP C: PRONOUN AND PERSPECTIVE (8 features)
// ============================================================================
export interface PronounPerspective {
  first_person_singular_count: number; // I, me, my
  first_person_plural_count: number; // we, us, our
  second_person_count: number; // you, your
  third_person_count: number; // he, she, they
  first_person_ratio: number;
  second_person_ratio: number;
  third_person_ratio: number;
  perspective_shift_count: number; // Changes between perspectives
}

// ============================================================================
// GROUP D: EMOTIONAL AND POWER WORDS (20 features)
// ============================================================================
export interface EmotionalPowerWords {
  positive_emotion_count: number;
  negative_emotion_count: number;
  power_word_count: number;
  urgency_word_count: number;
  curiosity_word_count: number;
  fear_word_count: number;
  trust_word_count: number;
  surprise_word_count: number;
  anger_word_count: number;
  sadness_word_count: number;
  joy_word_count: number;
  anticipation_word_count: number;
  disgust_word_count: number;
  emotional_intensity_score: number;
  sentiment_polarity: number; // -1 to 1
  sentiment_subjectivity: number; // 0 to 1
  emotional_arc_pattern: string; // e.g., "rise", "fall", "peak-valley"
  emotional_volatility: number;
  positive_negative_ratio: number;
  net_emotional_impact: number;
}

// ============================================================================
// GROUP E: VIRAL PATTERN WORDS (15 features)
// ============================================================================
export interface ViralPatternWords {
  shock_word_count: number;
  controversy_word_count: number;
  scarcity_word_count: number;
  social_proof_word_count: number;
  authority_word_count: number;
  reciprocity_word_count: number;
  commitment_word_count: number;
  liking_word_count: number;
  consensus_word_count: number;
  storytelling_marker_count: number;
  conflict_word_count: number;
  resolution_word_count: number;
  transformation_word_count: number;
  revelation_word_count: number;
  call_to_action_count: number;
}

// ============================================================================
// GROUP F: CAPITALIZATION AND FORMATTING (5 features)
// ============================================================================
export interface CapitalizationFormatting {
  all_caps_word_count: number;
  title_case_ratio: number;
  sentence_case_ratio: number;
  mixed_case_ratio: number;
  caps_lock_abuse_score: number; // Excessive caps usage
}

// ============================================================================
// GROUP G: LINGUISTIC COMPLEXITY (10 features)
// ============================================================================
export interface LinguisticComplexity {
  polysyllabic_word_count: number;
  complex_word_ratio: number;
  rare_word_count: number;
  jargon_count: number;
  slang_count: number;
  acronym_count: number;
  technical_term_count: number;
  simple_word_ratio: number;
  average_syllables_per_word: number;
  lexical_density: number; // Content words / total words
}

// ============================================================================
// GROUP H: DIALOGUE AND INTERACTION (5 features)
// ============================================================================
export interface DialogueInteraction {
  direct_question_count: number;
  rhetorical_question_count: number;
  imperative_sentence_count: number; // Commands
  dialogue_marker_count: number; // "he said", "she asked"
  conversational_tone_score: number;
}

// ============================================================================
// GROUP I: CONTENT STRUCTURE SIGNALS (8 features)
// ============================================================================
export interface ContentStructureSignals {
  has_numbered_list: boolean;
  has_bullet_points: boolean;
  list_item_count: number;
  section_count: number;
  transition_word_count: number;
  introduction_length: number; // Words in first 10%
  conclusion_length: number; // Words in last 10%
  body_to_intro_ratio: number;
}

// ============================================================================
// GROUP J: TIMESTAMP AND PACING (4 features)
// ============================================================================
export interface TimestampPacing {
  words_per_second: number;
  silence_pause_count: number; // Inferred from transcript gaps
  rapid_fire_segments: number; // High word density segments
  slow_segments: number; // Low word density segments
}

// ============================================================================
// GROUP K: VIDEO METADATA (10 features)
// ============================================================================
export interface VideoMetadata {
  video_duration_seconds: number;
  title_length: number;
  description_length: number;
  hashtag_count: number;
  hashtag_total_chars: number;
  caption_length: number;
  has_location: boolean;
  upload_hour: number;
  upload_day_of_week: number;
  days_since_upload: number;
}

// ============================================================================
// GROUP L: HISTORICAL PERFORMANCE (10 features)
// ============================================================================
export interface HistoricalPerformance {
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  engagement_rate: number; // (likes + comments + shares) / views
  like_rate: number; // likes / views
  comment_rate: number; // comments / views
  share_rate: number; // shares / views
  dps_score: number;
}

// ============================================================================
// COMBINED FEATURE VECTOR (100 features total)
// ============================================================================
export interface VideoFeatureVector {
  videoId: string;
  extractedAt: string;

  // Feature groups
  basicTextMetrics: BasicTextMetrics;
  punctuationAnalysis: PunctuationAnalysis;
  pronounPerspective: PronounPerspective;
  emotionalPowerWords: EmotionalPowerWords;
  viralPatternWords: ViralPatternWords;
  capitalizationFormatting: CapitalizationFormatting;
  linguisticComplexity: LinguisticComplexity;
  dialogueInteraction: DialogueInteraction;
  contentStructureSignals: ContentStructureSignals;
  timestampPacing: TimestampPacing;
  videoMetadata: VideoMetadata;
  historicalPerformance: HistoricalPerformance;
}

// ============================================================================
// INPUT DATA STRUCTURE
// ============================================================================
export interface FeatureExtractionInput {
  videoId: string;
  transcript: string;
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  location?: string;

  // Metadata
  videoDurationSeconds?: number;
  uploadedAt?: string;

  // Performance metrics
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  sharesCount?: number;
  savesCount?: number;
  dpsScore?: number;

  // Creator info (optional)
  creatorUsername?: string;
  creatorFollowerCount?: number;
}

// ============================================================================
// EXTRACTION CONFIGURATION
// ============================================================================
export interface FeatureExtractionConfig {
  includeBasicTextMetrics?: boolean;
  includePunctuationAnalysis?: boolean;
  includePronounPerspective?: boolean;
  includeEmotionalPowerWords?: boolean;
  includeViralPatternWords?: boolean;
  includeCapitalizationFormatting?: boolean;
  includeLinguisticComplexity?: boolean;
  includeDialogueInteraction?: boolean;
  includeContentStructureSignals?: boolean;
  includeTimestampPacing?: boolean;
  includeVideoMetadata?: boolean;
  includeHistoricalPerformance?: boolean;
}

export const DEFAULT_FEATURE_EXTRACTION_CONFIG: FeatureExtractionConfig = {
  includeBasicTextMetrics: true,
  includePunctuationAnalysis: true,
  includePronounPerspective: true,
  includeEmotionalPowerWords: true,
  includeViralPatternWords: true,
  includeCapitalizationFormatting: true,
  includeLinguisticComplexity: true,
  includeDialogueInteraction: true,
  includeContentStructureSignals: true,
  includeTimestampPacing: true,
  includeVideoMetadata: true,
  includeHistoricalPerformance: true,
};

/**
 * TRAINING CONFIG - Content-only features (109 features)
 * 
 * Use this config when preparing training data for XGBoost.
 * Excludes historical performance metrics (views, likes, engagement)
 * because these are the OUTCOMES we're trying to predict, not inputs.
 * 
 * The DPS score is still used as the LABEL/TARGET, but the metrics
 * that compose DPS should not be given as input features.
 */
export const TRAINING_FEATURE_EXTRACTION_CONFIG: FeatureExtractionConfig = {
  includeBasicTextMetrics: true,
  includePunctuationAnalysis: true,
  includePronounPerspective: true,
  includeEmotionalPowerWords: true,
  includeViralPatternWords: true,
  includeCapitalizationFormatting: true,
  includeLinguisticComplexity: true,
  includeDialogueInteraction: true,
  includeContentStructureSignals: true,
  includeTimestampPacing: true,
  includeVideoMetadata: true,
  includeHistoricalPerformance: false,  // EXCLUDED - these are outcomes, not inputs
};

// ============================================================================
// EXTRACTION RESULT
// ============================================================================
export interface FeatureExtractionResult {
  success: boolean;
  features?: VideoFeatureVector;
  error?: string;
  processingTimeMs?: number;
  featureCount?: number;
}

export interface BatchFeatureExtractionResult {
  success: boolean;
  results: FeatureExtractionResult[];
  totalVideos: number;
  successfulExtractions: number;
  failedExtractions: number;
  totalProcessingTimeMs: number;
  averageTimePerVideo: number;
}
