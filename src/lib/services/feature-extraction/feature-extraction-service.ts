/**
 * Feature Extraction Service
 *
 * Main service that orchestrates extraction of 100+ features from video data.
 * Combines all feature extractors (Groups A-L) into a unified pipeline.
 */

import {
  extractBasicTextMetrics,
  extractPunctuationAnalysis,
  extractPronounPerspective,
  extractEmotionalPowerWords,
  extractViralPatternWords,
} from './text-analysis-extractors';

import {
  extractCapitalizationFormatting,
  extractLinguisticComplexity,
  extractDialogueInteraction,
} from './formatting-linguistic-extractors';

import {
  extractContentStructureSignals,
  extractTimestampPacing,
  extractVideoMetadata,
  extractHistoricalPerformance,
} from './content-metadata-extractors';

import type {
  FeatureExtractionInput,
  FeatureExtractionConfig,
  FeatureExtractionResult,
  BatchFeatureExtractionResult,
  VideoFeatureVector,
} from './types';

import { DEFAULT_FEATURE_EXTRACTION_CONFIG } from './types';

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract all features from a single video
 */
export async function extractFeaturesFromVideo(
  input: FeatureExtractionInput,
  config: FeatureExtractionConfig = DEFAULT_FEATURE_EXTRACTION_CONFIG
): Promise<FeatureExtractionResult> {
  const startTime = Date.now();

  try {
    if (!input.transcript || input.transcript.trim().length === 0) {
      return {
        success: false,
        error: 'Transcript is required and cannot be empty',
        processingTimeMs: Date.now() - startTime,
      };
    }

    const features: VideoFeatureVector = {
      videoId: input.videoId,
      extractedAt: new Date().toISOString(),

      // Group A-E: Text Analysis (68 features)
      basicTextMetrics: config.includeBasicTextMetrics
        ? extractBasicTextMetrics(input.transcript)
        : {} as any,

      punctuationAnalysis: config.includePunctuationAnalysis
        ? extractPunctuationAnalysis(input.transcript)
        : {} as any,

      pronounPerspective: config.includePronounPerspective
        ? extractPronounPerspective(input.transcript)
        : {} as any,

      emotionalPowerWords: config.includeEmotionalPowerWords
        ? extractEmotionalPowerWords(input.transcript)
        : {} as any,

      viralPatternWords: config.includeViralPatternWords
        ? extractViralPatternWords(input.transcript)
        : {} as any,

      // Group F-H: Formatting and Linguistic (20 features)
      capitalizationFormatting: config.includeCapitalizationFormatting
        ? extractCapitalizationFormatting(input.transcript)
        : {} as any,

      linguisticComplexity: config.includeLinguisticComplexity
        ? extractLinguisticComplexity(input.transcript)
        : {} as any,

      dialogueInteraction: config.includeDialogueInteraction
        ? extractDialogueInteraction(input.transcript)
        : {} as any,

      // Group I-L: Content and Metadata (35 features)
      contentStructureSignals: config.includeContentStructureSignals
        ? extractContentStructureSignals(input.transcript)
        : {} as any,

      timestampPacing: config.includeTimestampPacing
        ? extractTimestampPacing(input.transcript, input.videoDurationSeconds)
        : {} as any,

      videoMetadata: config.includeVideoMetadata
        ? extractVideoMetadata(input)
        : {} as any,

      historicalPerformance: config.includeHistoricalPerformance
        ? extractHistoricalPerformance(input)
        : {} as any,
    };

    const featureCount = countExtractedFeatures(features, config);
    const processingTimeMs = Date.now() - startTime;

    return {
      success: true,
      features,
      processingTimeMs,
      featureCount,
    };

  } catch (error: any) {
    console.error(`Error extracting features for video ${input.videoId}:`, error.message);
    return {
      success: false,
      error: error.message,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Extract features from multiple videos in batch
 */
export async function extractFeaturesFromVideos(
  inputs: FeatureExtractionInput[],
  config: FeatureExtractionConfig = DEFAULT_FEATURE_EXTRACTION_CONFIG,
  options?: {
    maxConcurrent?: number;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<BatchFeatureExtractionResult> {
  const startTime = Date.now();
  const results: FeatureExtractionResult[] = [];

  const maxConcurrent = options?.maxConcurrent || 10;
  let processed = 0;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 FEATURE EXTRACTION STARTED`);
  console.log(`   Total Videos: ${inputs.length}`);
  console.log(`   Max Concurrent: ${maxConcurrent}`);
  console.log(`${'='.repeat(80)}\n`);

  // Process in batches
  for (let i = 0; i < inputs.length; i += maxConcurrent) {
    const batch = inputs.slice(i, i + maxConcurrent);

    const batchResults = await Promise.all(
      batch.map(input => extractFeaturesFromVideo(input, config))
    );

    results.push(...batchResults);
    processed += batch.length;

    if (options?.onProgress) {
      options.onProgress(processed, inputs.length);
    }

    if (processed % 50 === 0 || processed === inputs.length) {
      console.log(`   Progress: ${processed}/${inputs.length} videos processed`);
    }
  }

  const totalProcessingTimeMs = Date.now() - startTime;
  const successfulExtractions = results.filter(r => r.success).length;
  const failedExtractions = results.filter(r => !r.success).length;
  const averageTimePerVideo = totalProcessingTimeMs / inputs.length;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ FEATURE EXTRACTION COMPLETE`);
  console.log(`   Total Videos: ${inputs.length}`);
  console.log(`   Successful: ${successfulExtractions}`);
  console.log(`   Failed: ${failedExtractions}`);
  console.log(`   Total Time: ${(totalProcessingTimeMs / 1000).toFixed(1)}s`);
  console.log(`   Avg Time Per Video: ${averageTimePerVideo.toFixed(0)}ms`);
  console.log(`${'='.repeat(80)}\n`);

  return {
    success: true,
    results,
    totalVideos: inputs.length,
    successfulExtractions,
    failedExtractions,
    totalProcessingTimeMs,
    averageTimePerVideo,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Count total number of features extracted based on config
 */
function countExtractedFeatures(
  features: VideoFeatureVector,
  config: FeatureExtractionConfig
): number {
  let count = 0;

  if (config.includeBasicTextMetrics) count += 15;
  if (config.includePunctuationAnalysis) count += 10;
  if (config.includePronounPerspective) count += 8;
  if (config.includeEmotionalPowerWords) count += 20;
  if (config.includeViralPatternWords) count += 15;
  if (config.includeCapitalizationFormatting) count += 5;
  if (config.includeLinguisticComplexity) count += 10;
  if (config.includeDialogueInteraction) count += 5;
  if (config.includeContentStructureSignals) count += 8;
  if (config.includeTimestampPacing) count += 4;
  if (config.includeVideoMetadata) count += 7;  // Was 10, removed 3 timing features
  // Historical Performance EXCLUDED from training (they are outcomes, not inputs)

  return count;
}

/**
 * Convert feature vector to flat array (for ML model input)
 */
export function flattenFeatureVector(features: VideoFeatureVector): number[] {
  const flat: number[] = [];

  // Group A: Basic Text Metrics
  if (features.basicTextMetrics) {
    flat.push(
      features.basicTextMetrics.word_count,
      features.basicTextMetrics.char_count,
      features.basicTextMetrics.sentence_count,
      features.basicTextMetrics.avg_word_length,
      features.basicTextMetrics.avg_sentence_length,
      features.basicTextMetrics.unique_word_count,
      features.basicTextMetrics.lexical_diversity,
      features.basicTextMetrics.syllable_count,
      features.basicTextMetrics.flesch_reading_ease,
      features.basicTextMetrics.flesch_kincaid_grade,
      features.basicTextMetrics.smog_index,
      features.basicTextMetrics.automated_readability_index,
      features.basicTextMetrics.coleman_liau_index,
      features.basicTextMetrics.gunning_fog_index,
      features.basicTextMetrics.linsear_write_formula
    );
  }

  // Group B: Punctuation Analysis
  if (features.punctuationAnalysis) {
    flat.push(
      features.punctuationAnalysis.question_mark_count,
      features.punctuationAnalysis.exclamation_count,
      features.punctuationAnalysis.ellipsis_count,
      features.punctuationAnalysis.comma_count,
      features.punctuationAnalysis.period_count,
      features.punctuationAnalysis.semicolon_count,
      features.punctuationAnalysis.colon_count,
      features.punctuationAnalysis.dash_count,
      features.punctuationAnalysis.quotation_count,
      features.punctuationAnalysis.parenthesis_count
    );
  }

  // Group C: Pronoun Perspective
  if (features.pronounPerspective) {
    flat.push(
      features.pronounPerspective.first_person_singular_count,
      features.pronounPerspective.first_person_plural_count,
      features.pronounPerspective.second_person_count,
      features.pronounPerspective.third_person_count,
      features.pronounPerspective.first_person_ratio,
      features.pronounPerspective.second_person_ratio,
      features.pronounPerspective.third_person_ratio,
      features.pronounPerspective.perspective_shift_count
    );
  }

  // Group D: Emotional Power Words
  if (features.emotionalPowerWords) {
    flat.push(
      features.emotionalPowerWords.positive_emotion_count,
      features.emotionalPowerWords.negative_emotion_count,
      features.emotionalPowerWords.power_word_count,
      features.emotionalPowerWords.urgency_word_count,
      features.emotionalPowerWords.curiosity_word_count,
      features.emotionalPowerWords.fear_word_count,
      features.emotionalPowerWords.trust_word_count,
      features.emotionalPowerWords.surprise_word_count,
      features.emotionalPowerWords.anger_word_count,
      features.emotionalPowerWords.sadness_word_count,
      features.emotionalPowerWords.joy_word_count,
      features.emotionalPowerWords.anticipation_word_count,
      features.emotionalPowerWords.disgust_word_count,
      features.emotionalPowerWords.emotional_intensity_score,
      features.emotionalPowerWords.sentiment_polarity,
      features.emotionalPowerWords.sentiment_subjectivity,
      // Skip emotional_arc_pattern (string)
      features.emotionalPowerWords.emotional_volatility,
      features.emotionalPowerWords.positive_negative_ratio,
      features.emotionalPowerWords.net_emotional_impact
    );
  }

  // Group E: Viral Pattern Words
  if (features.viralPatternWords) {
    flat.push(
      features.viralPatternWords.shock_word_count,
      features.viralPatternWords.controversy_word_count,
      features.viralPatternWords.scarcity_word_count,
      features.viralPatternWords.social_proof_word_count,
      features.viralPatternWords.authority_word_count,
      features.viralPatternWords.reciprocity_word_count,
      features.viralPatternWords.commitment_word_count,
      features.viralPatternWords.liking_word_count,
      features.viralPatternWords.consensus_word_count,
      features.viralPatternWords.storytelling_marker_count,
      features.viralPatternWords.conflict_word_count,
      features.viralPatternWords.resolution_word_count,
      features.viralPatternWords.transformation_word_count,
      features.viralPatternWords.revelation_word_count,
      features.viralPatternWords.call_to_action_count
    );
  }

  // Group F: Capitalization Formatting
  if (features.capitalizationFormatting) {
    flat.push(
      features.capitalizationFormatting.all_caps_word_count,
      features.capitalizationFormatting.title_case_ratio,
      features.capitalizationFormatting.sentence_case_ratio,
      features.capitalizationFormatting.mixed_case_ratio,
      features.capitalizationFormatting.caps_lock_abuse_score
    );
  }

  // Group G: Linguistic Complexity
  if (features.linguisticComplexity) {
    flat.push(
      features.linguisticComplexity.polysyllabic_word_count,
      features.linguisticComplexity.complex_word_ratio,
      features.linguisticComplexity.rare_word_count,
      features.linguisticComplexity.jargon_count,
      features.linguisticComplexity.slang_count,
      features.linguisticComplexity.acronym_count,
      features.linguisticComplexity.technical_term_count,
      features.linguisticComplexity.simple_word_ratio,
      features.linguisticComplexity.average_syllables_per_word,
      features.linguisticComplexity.lexical_density
    );
  }

  // Group H: Dialogue Interaction
  if (features.dialogueInteraction) {
    flat.push(
      features.dialogueInteraction.direct_question_count,
      features.dialogueInteraction.rhetorical_question_count,
      features.dialogueInteraction.imperative_sentence_count,
      features.dialogueInteraction.dialogue_marker_count,
      features.dialogueInteraction.conversational_tone_score
    );
  }

  // Group I: Content Structure Signals
  if (features.contentStructureSignals) {
    flat.push(
      features.contentStructureSignals.has_numbered_list ? 1 : 0,
      features.contentStructureSignals.has_bullet_points ? 1 : 0,
      features.contentStructureSignals.list_item_count,
      features.contentStructureSignals.section_count,
      features.contentStructureSignals.transition_word_count,
      features.contentStructureSignals.introduction_length,
      features.contentStructureSignals.conclusion_length,
      features.contentStructureSignals.body_to_intro_ratio
    );
  }

  // Group J: Timestamp Pacing
  if (features.timestampPacing) {
    flat.push(
      features.timestampPacing.words_per_second,
      features.timestampPacing.silence_pause_count,
      features.timestampPacing.rapid_fire_segments,
      features.timestampPacing.slow_segments
    );
  }

  // Group K: Video Metadata (7 features - timing features removed as non-content)
  if (features.videoMetadata) {
    flat.push(
      features.videoMetadata.video_duration_seconds,
      features.videoMetadata.title_length,
      features.videoMetadata.description_length,
      features.videoMetadata.hashtag_count,
      features.videoMetadata.hashtag_total_chars,
      features.videoMetadata.caption_length,
      features.videoMetadata.has_location ? 1 : 0
      // REMOVED: upload_hour, upload_day_of_week, days_since_upload
      // These are timing features, not content features
    );
  }

  // ========================================================================
  // Group L: Historical Performance - REMOVED FROM TRAINING FEATURES
  // ========================================================================
  // 
  // ⚠️ CRITICAL: These metrics are EXCLUDED from the feature vector.
  // They are OUTCOMES we're trying to predict, NOT input features.
  // 
  // At prediction time, a new video has:
  //   - 0 views
  //   - 0 likes
  //   - 0 comments
  //   - 0 shares
  //   - 0 saves
  //
  // If the model trains on these, it learns: "high engagement = high DPS"
  // which is tautological and useless for pre-post prediction.
  //
  // The model MUST learn: "content characteristics → viral potential"
  // These metrics are used to calculate the TARGET LABEL (DPS score),
  // but should NEVER be given to the model as input features.
  //
  // REMOVED:
  // - views_count
  // - likes_count  
  // - comments_count
  // - shares_count
  // - saves_count
  // - engagement_rate
  // - like_rate
  // - comment_rate
  // - share_rate
  // - dps_score (this is the TARGET, not a feature)
  // ========================================================================

  return flat;
}

/**
 * Get feature names in order (matches flattened array)
 * 
 * ⚠️ CRITICAL: Group L (Performance Metrics) has been REMOVED from training features.
 * Performance metrics (views, likes, shares, etc.) are OUTCOMES we predict, not inputs.
 * At prediction time, a new video has zero views - the model must learn from CONTENT only.
 * 
 * Performance metrics are used to calculate the TARGET LABEL (DPS score), not as features.
 */
export function getFeatureNames(): string[] {
  return [
    // Group A: Basic Text Metrics (15)
    'word_count', 'char_count', 'sentence_count', 'avg_word_length', 'avg_sentence_length',
    'unique_word_count', 'lexical_diversity', 'syllable_count', 'flesch_reading_ease',
    'flesch_kincaid_grade', 'smog_index', 'automated_readability_index', 'coleman_liau_index',
    'gunning_fog_index', 'linsear_write_formula',

    // Group B: Punctuation Analysis (10)
    'question_mark_count', 'exclamation_count', 'ellipsis_count', 'comma_count', 'period_count',
    'semicolon_count', 'colon_count', 'dash_count', 'quotation_count', 'parenthesis_count',

    // Group C: Pronoun Perspective (8)
    'first_person_singular_count', 'first_person_plural_count', 'second_person_count', 'third_person_count',
    'first_person_ratio', 'second_person_ratio', 'third_person_ratio', 'perspective_shift_count',

    // Group D: Emotional Power Words (19 - excluding emotional_arc_pattern string)
    'positive_emotion_count', 'negative_emotion_count', 'power_word_count', 'urgency_word_count',
    'curiosity_word_count', 'fear_word_count', 'trust_word_count', 'surprise_word_count',
    'anger_word_count', 'sadness_word_count', 'joy_word_count', 'anticipation_word_count',
    'disgust_word_count', 'emotional_intensity_score', 'sentiment_polarity', 'sentiment_subjectivity',
    'emotional_volatility', 'positive_negative_ratio', 'net_emotional_impact',

    // Group E: Viral Pattern Words (15)
    'shock_word_count', 'controversy_word_count', 'scarcity_word_count', 'social_proof_word_count',
    'authority_word_count', 'reciprocity_word_count', 'commitment_word_count', 'liking_word_count',
    'consensus_word_count', 'storytelling_marker_count', 'conflict_word_count', 'resolution_word_count',
    'transformation_word_count', 'revelation_word_count', 'call_to_action_count',

    // Group F: Capitalization Formatting (5)
    'all_caps_word_count', 'title_case_ratio', 'sentence_case_ratio', 'mixed_case_ratio', 'caps_lock_abuse_score',

    // Group G: Linguistic Complexity (10)
    'polysyllabic_word_count', 'complex_word_ratio', 'rare_word_count', 'jargon_count',
    'slang_count', 'acronym_count', 'technical_term_count', 'simple_word_ratio',
    'average_syllables_per_word', 'lexical_density',

    // Group H: Dialogue Interaction (5)
    'direct_question_count', 'rhetorical_question_count', 'imperative_sentence_count',
    'dialogue_marker_count', 'conversational_tone_score',

    // Group I: Content Structure Signals (8)
    'has_numbered_list', 'has_bullet_points', 'list_item_count', 'section_count',
    'transition_word_count', 'introduction_length', 'conclusion_length', 'body_to_intro_ratio',

    // Group J: Timestamp Pacing (4)
    'words_per_second', 'silence_pause_count', 'rapid_fire_segments', 'slow_segments',

    // Group K: Video Metadata (7 - timing features removed as non-content)
    'video_duration_seconds', 'title_length', 'description_length', 'hashtag_count',
    'hashtag_total_chars', 'caption_length', 'has_location',
    // REMOVED: upload_hour, upload_day_of_week, days_since_upload (timing, not content)

    // ========================================================================
    // Group L: Historical Performance - REMOVED FROM TRAINING FEATURES
    // ========================================================================
    // 
    // ⚠️ THESE METRICS ARE EXCLUDED - they are OUTCOMES, not predictors:
    // 'views_count',       // EXCLUDED - outcome
    // 'likes_count',       // EXCLUDED - outcome  
    // 'comments_count',    // EXCLUDED - outcome
    // 'shares_count',      // EXCLUDED - outcome
    // 'saves_count',       // EXCLUDED - outcome
    // 'engagement_rate',   // EXCLUDED - derived from outcomes
    // 'like_rate',         // EXCLUDED - derived from outcomes
    // 'comment_rate',      // EXCLUDED - derived from outcomes
    // 'share_rate',        // EXCLUDED - derived from outcomes
    //
    // At prediction time, a new video has 0 views, 0 likes, etc.
    // The model must learn: "content characteristics → viral potential"
    // NOT: "high engagement → high DPS" (which is tautological)
    // ========================================================================
  ];
  // Total: 106 features (Groups A-K, clean - no performance metrics, no timing features)
}
