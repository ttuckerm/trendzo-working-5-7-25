/**
 * Unified Training Features Extraction
 * 
 * Combines all feature extractors into a unified 152-feature extraction pipeline.
 * Used by the Kai Orchestrator for prediction and training data generation.
 * 
 * FEATURE GROUPS (152 total):
 * - Groups 1-11: Text/Metadata features (~53 features)
 * - Group 12: FFmpeg visual/audio features (~24 features)
 * - Group 13: LLM framework scores (~9 features)
 * - Group 14: Pattern match flags (~10 features)
 * - Additional computed features (~56 features)
 * 
 * ⚠️ CRITICAL: Engagement metrics (views, likes, DPS) are EXCLUDED.
 * These are OUTCOMES we predict, not inputs.
 */

import { 
  extractFFmpegTrainingFeatures, 
  getDefaultFFmpegFeatures,
  type FFmpegTrainingFeatures 
} from './ffmpeg-training-features';

import {
  scoreWithLLM,
  getDefaultScores,
  type LLMFrameworkScores,
  type ScriptInput,
} from './llm-framework-scoring';

import {
  segmentTranscriptByEstimation,
} from './transcript-segmentation';

// ============================================================================
// CONSTANTS
// ============================================================================

export const TOTAL_FEATURE_COUNT = 152;

// ============================================================================
// TYPES
// ============================================================================

export interface UnifiedTrainingFeatures {
  features: Record<string, number>;
  featureCount: number;
  coverage: number; // 0-1 scale (percentage of 152 features extracted)
  extractionTimeMs: number;
  groupsExtracted: {
    textMetadata: boolean;
    ffmpeg: boolean;
    llm: boolean;
    pattern: boolean;
  };
  errors: string[];
}

export interface UnifiedExtractionInput {
  video_id: string;
  transcript: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  duration_seconds?: number;
  video_path?: string;
  niche?: string;
  caption?: string;
  creator_followers_count?: number;
  upload_timestamp?: string;
}

export interface UnifiedExtractionOptions {
  includeFFmpeg?: boolean;
  includeLLMScoring?: boolean;
  includePatternFeatures?: boolean;
  ffmpegTimeout?: number;
  llmTimeout?: number;
  patternData?: PatternData;
}

export interface PatternData {
  lego_count: number;
  has_topic: boolean;
  has_angle: boolean;
  has_hook_structure: boolean;
  has_story_structure: boolean;
  has_visual_format: boolean;
  has_key_visuals: boolean;
  has_audio: boolean;
  style_id?: string;
  attribute_scores?: Record<string, number>;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract unified training features (152 features) from video data
 * 
 * @param input - Video data with transcript, metadata, etc.
 * @param options - Extraction options (FFmpeg, LLM, patterns)
 * @returns Unified feature extraction result
 */
export async function extractUnifiedTrainingFeatures(
  input: UnifiedExtractionInput,
  options: UnifiedExtractionOptions = {}
): Promise<UnifiedTrainingFeatures> {
  const startTime = Date.now();
  const errors: string[] = [];
  const features: Record<string, number> = {};
  
  const { 
    includeFFmpeg = true,
    includeLLMScoring = true,
    includePatternFeatures = true,
    ffmpegTimeout = 30000,
    llmTimeout = 30000,
    patternData,
  } = options;

  // Track which groups were successfully extracted
  let hasTextMetadata = false;
  let hasFFmpegFeatures = false;
  let hasLLMFeatures = false;
  let hasPatternFeatures = false;

  try {
    const transcript = input.transcript || '';
    const title = input.title || '';
    const description = input.description || '';
    const caption = input.caption || '';
    const hashtags = input.hashtags || [];
    const duration = input.duration_seconds || 0;
    const niche = input.niche || '';

    // ========================================
    // GROUP 1: BASIC TEXT METRICS
    // ========================================
    
    const transcriptWords = transcript.split(/\s+/).filter((w: string) => w.length > 0);
    const titleWords = title.split(/\s+/).filter((w: string) => w.length > 0);
    const descWords = description.split(/\s+/).filter((w: string) => w.length > 0);
    
    features.word_count = transcriptWords.length;
    features.char_count = transcript.length;
    features.title_word_count = titleWords.length;
    features.description_word_count = descWords.length;
    features.avg_word_length = transcriptWords.length > 0 
      ? transcriptWords.reduce((sum: number, w: string) => sum + w.length, 0) / transcriptWords.length 
      : 0;
    features.unique_word_count = new Set(transcriptWords.map((w: string) => w.toLowerCase())).size;
    features.unique_word_ratio = transcriptWords.length > 0
      ? features.unique_word_count / transcriptWords.length
      : 0;
    features.lexical_diversity = features.unique_word_ratio;
    
    // Sentence analysis
    const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    features.sentence_count = sentences.length;
    features.avg_sentence_length = sentences.length > 0
      ? transcriptWords.length / sentences.length
      : 0;

    // Syllable estimation (approximate: count vowel groups)
    const countSyllables = (word: string): number => {
      const matches = word.toLowerCase().match(/[aeiouy]+/g);
      return matches ? matches.length : 1;
    };
    features.syllable_count = transcriptWords.reduce((sum: number, w: string) => sum + countSyllables(w), 0);
    features.avg_syllables_per_word = transcriptWords.length > 0 
      ? features.syllable_count / transcriptWords.length 
      : 0;

    // Readability scores (Flesch Reading Ease approximation)
    features.flesch_reading_ease = transcriptWords.length > 0 && sentences.length > 0
      ? 206.835 - 1.015 * (transcriptWords.length / sentences.length) - 84.6 * (features.syllable_count / transcriptWords.length)
      : 0;
    features.flesch_kincaid_grade = transcriptWords.length > 0 && sentences.length > 0
      ? 0.39 * (transcriptWords.length / sentences.length) + 11.8 * (features.syllable_count / transcriptWords.length) - 15.59
      : 0;

    hasTextMetadata = features.word_count > 0;

    // ========================================
    // GROUP 2: PUNCTUATION ANALYSIS
    // ========================================
    
    features.question_mark_count = (transcript.match(/\?/g) || []).length;
    features.exclamation_mark_count = (transcript.match(/!/g) || []).length;
    features.ellipsis_count = (transcript.match(/\.{3}/g) || []).length;
    features.comma_count = (transcript.match(/,/g) || []).length;
    features.period_count = (transcript.match(/\./g) || []).length;
    features.colon_count = (transcript.match(/:/g) || []).length;
    features.semicolon_count = (transcript.match(/;/g) || []).length;
    features.dash_count = (transcript.match(/-/g) || []).length;
    features.quotation_count = (transcript.match(/["']/g) || []).length;
    features.parenthesis_count = (transcript.match(/[()]/g) || []).length;

    // ========================================
    // GROUP 3: PRONOUN & PERSPECTIVE
    // ========================================
    
    const lowerTranscript = transcript.toLowerCase();
    features.first_person_singular = (lowerTranscript.match(/\b(i|me|my|mine|myself)\b/g) || []).length;
    features.first_person_plural = (lowerTranscript.match(/\b(we|us|our|ours|ourselves)\b/g) || []).length;
    features.second_person = (lowerTranscript.match(/\b(you|your|yours|yourself|yourselves)\b/g) || []).length;
    features.third_person = (lowerTranscript.match(/\b(he|she|it|they|him|her|them|his|hers|its|their|theirs)\b/g) || []).length;
    features.pronoun_ratio = transcriptWords.length > 0
      ? (features.first_person_singular + features.first_person_plural + features.second_person + features.third_person) / transcriptWords.length
      : 0;

    // ========================================
    // GROUP 4: EMOTIONAL & POWER WORDS
    // ========================================
    
    const positiveWords = ['love', 'amazing', 'great', 'best', 'awesome', 'incredible', 'perfect', 'beautiful', 'wonderful', 'fantastic'];
    const negativeWords = ['hate', 'worst', 'terrible', 'bad', 'awful', 'horrible', 'never', 'ugly', 'disgusting', 'disappointing'];
    const powerWords = ['secret', 'discover', 'proven', 'guaranteed', 'exclusive', 'limited', 'free', 'new', 'now', 'instant'];
    const urgencyWords = ['now', 'today', 'immediately', 'hurry', 'limited', 'before', 'quick', 'fast', 'urgent', 'deadline'];
    const curiosityWords = ['secret', 'hidden', 'revealed', 'truth', 'mystery', 'surprising', 'shocking', 'unexpected', 'unknown', 'discover'];

    features.positive_emotion_count = positiveWords.filter(w => lowerTranscript.includes(w)).length;
    features.negative_emotion_count = negativeWords.filter(w => lowerTranscript.includes(w)).length;
    features.power_word_count = powerWords.filter(w => lowerTranscript.includes(w)).length;
    features.urgency_word_count = urgencyWords.filter(w => lowerTranscript.includes(w)).length;
    features.curiosity_word_count = curiosityWords.filter(w => lowerTranscript.includes(w)).length;
    features.emotional_intensity = Math.min(1, (features.positive_emotion_count + features.negative_emotion_count) / 5);
    features.sentiment_polarity = (features.positive_emotion_count - features.negative_emotion_count) / 
      Math.max(1, features.positive_emotion_count + features.negative_emotion_count);

    // ========================================
    // GROUP 5: VIRAL PATTERN WORDS
    // ========================================
    
    const shockWords = ['shocking', 'unbelievable', 'insane', 'crazy', 'mindblowing', 'wild'];
    const socialProofWords = ['everyone', 'millions', 'thousands', 'trending', 'viral', 'famous', 'popular'];
    const storyMarkers = ['once', 'story', 'happened', 'remember', 'when i', 'true story'];
    const ctaWords = ['follow', 'like', 'comment', 'share', 'subscribe', 'save', 'click', 'link'];

    features.shock_word_count = shockWords.filter(w => lowerTranscript.includes(w)).length;
    features.social_proof_count = socialProofWords.filter(w => lowerTranscript.includes(w)).length;
    features.story_marker_count = storyMarkers.filter(w => lowerTranscript.includes(w)).length;
    features.cta_word_count = ctaWords.filter(w => lowerTranscript.includes(w)).length;
    features.has_cta = features.cta_word_count > 0 ? 1 : 0;

    // ========================================
    // GROUP 6: HOOK FEATURES
    // ========================================
    
    const hookText = transcript.slice(0, 150);
    const hookWords = hookText.split(/\s+/).filter((w: string) => w.length > 0);
    
    features.hook_word_count = hookWords.length;
    features.hook_has_question = hookText.includes('?') ? 1 : 0;
    features.hook_has_you = /\byou\b/i.test(hookText) ? 1 : 0;
    features.hook_has_number = /\d/.test(hookText) ? 1 : 0;
    features.hook_has_power_word = powerWords.some(w => hookText.toLowerCase().includes(w)) ? 1 : 0;
    
    const hookPatterns = [
      /^(here'?s?|this is)/i,
      /^(did you|have you|do you)/i,
      /^(stop|wait|listen)/i,
      /^(pov|imagine|story time)/i,
      /^(the secret|nobody|most people)/i
    ];
    features.hook_pattern_match = hookPatterns.some(p => p.test(hookText.trim())) ? 1 : 0;

    // ========================================
    // GROUP 7: VIDEO METADATA FEATURES
    // ========================================
    
    features.duration_seconds = duration;
    features.duration_log = Math.log10(Math.max(1, duration));
    features.is_short_video = duration < 15 ? 1 : 0;
    features.is_medium_video = duration >= 15 && duration < 60 ? 1 : 0;
    features.is_long_video = duration >= 60 ? 1 : 0;
    features.optimal_duration = duration >= 15 && duration <= 45 ? 1 : 0;
    
    features.words_per_second = duration > 0 ? features.word_count / duration : 0;
    features.fast_pace = features.words_per_second > 3 ? 1 : 0;
    features.slow_pace = features.words_per_second < 1.5 ? 1 : 0;

    // ========================================
    // GROUP 8: HASHTAG FEATURES
    // ========================================
    
    features.hashtag_count = hashtags.length;
    features.has_hashtags = hashtags.length > 0 ? 1 : 0;
    features.hashtag_diversity = new Set(hashtags.map((h: string) => h.toLowerCase())).size;
    
    const viralHashtags = ['fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'blowthisup'];
    features.viral_hashtag_count = hashtags.filter((h: string) => 
      viralHashtags.includes(h.toLowerCase().replace('#', ''))
    ).length;
    features.has_viral_hashtag = features.viral_hashtag_count > 0 ? 1 : 0;

    // ========================================
    // GROUP 9: CONTENT STRUCTURE
    // ========================================
    
    features.has_numbers = /\d/.test(transcript) ? 1 : 0;
    features.number_count = (transcript.match(/\d+/g) || []).length;
    features.has_list_format = /\b(first|second|third|one|two|three|step|tip|way)\b/i.test(transcript) ? 1 : 0;
    features.has_story_format = /\b(so|then|and then|but then|story|happened)\b/i.test(transcript) ? 1 : 0;
    features.has_tutorial_format = /\b(how to|learn|tutorial|guide|hack|trick|secret)\b/i.test(transcript) ? 1 : 0;
    features.has_comparison = /\b(vs|versus|compared|better|worse|different)\b/i.test(transcript) ? 1 : 0;

    // ========================================
    // GROUP 10: NICHE ALIGNMENT
    // ========================================
    
    const financeKeywords = ['money', 'finance', 'invest', 'stock', 'crypto', 'budget', 'savings', 'income', 'wealth', 'rich', 'millionaire', 'passive', 'side hustle'];
    features.niche_keyword_count = financeKeywords.filter(kw => lowerTranscript.includes(kw)).length;
    features.niche_alignment = Math.min(1, features.niche_keyword_count / 3);
    features.is_finance_niche = niche.toLowerCase().includes('finance') ? 1 : 0;

    // ========================================
    // GROUP 11: TIMING FEATURES
    // ========================================
    
    if (input.upload_timestamp) {
      try {
        const uploadDate = new Date(input.upload_timestamp);
        features.upload_hour = uploadDate.getUTCHours();
        features.upload_day_of_week = uploadDate.getUTCDay();
        features.is_weekend = features.upload_day_of_week === 0 || features.upload_day_of_week === 6 ? 1 : 0;
        features.is_prime_time = features.upload_hour >= 18 && features.upload_hour <= 22 ? 1 : 0;
        features.is_morning = features.upload_hour >= 6 && features.upload_hour < 12 ? 1 : 0;
        features.is_afternoon = features.upload_hour >= 12 && features.upload_hour < 18 ? 1 : 0;
      } catch {
        features.upload_hour = 0;
        features.upload_day_of_week = 0;
        features.is_weekend = 0;
        features.is_prime_time = 0;
        features.is_morning = 0;
        features.is_afternoon = 0;
      }
    } else {
      features.upload_hour = 0;
      features.upload_day_of_week = 0;
      features.is_weekend = 0;
      features.is_prime_time = 0;
      features.is_morning = 0;
      features.is_afternoon = 0;
    }

    // ========================================
    // GROUP 12: CREATOR FEATURES
    // ========================================
    
    const followers = input.creator_followers_count || 0;
    features.creator_followers = followers;
    features.creator_followers_log = Math.log10(Math.max(1, followers));
    features.is_large_creator = followers >= 100000 ? 1 : 0;
    features.is_medium_creator = followers >= 10000 && followers < 100000 ? 1 : 0;
    features.is_small_creator = followers < 10000 ? 1 : 0;

    // ========================================
    // GROUP 13: FFMPEG VISUAL/AUDIO FEATURES
    // ========================================
    
    if (includeFFmpeg && input.video_path) {
      try {
        const ffmpegResult = await extractFFmpegTrainingFeatures(input.video_path, {
          timeout: ffmpegTimeout,
        });
        
        if (ffmpegResult.features.extraction_success) {
          hasFFmpegFeatures = true;
          
          // Add FFmpeg features with prefix
          features.ffmpeg_resolution_width = ffmpegResult.features.resolution_width;
          features.ffmpeg_resolution_height = ffmpegResult.features.resolution_height;
          features.ffmpeg_fps = ffmpegResult.features.fps;
          features.ffmpeg_duration = ffmpegResult.features.duration_seconds;
          features.ffmpeg_has_audio = ffmpegResult.features.has_audio ? 1 : 0;
          features.ffmpeg_bitrate = ffmpegResult.features.bitrate;
          features.ffmpeg_scene_changes = ffmpegResult.features.scene_changes;
          features.ffmpeg_cuts_per_second = ffmpegResult.features.cuts_per_second;
          features.ffmpeg_avg_motion = ffmpegResult.features.avg_motion;
          features.ffmpeg_color_variance = ffmpegResult.features.color_variance;
          features.ffmpeg_brightness_avg = ffmpegResult.features.brightness_avg;
          features.ffmpeg_contrast_score = ffmpegResult.features.contrast_score;
          
          // Derived FFmpeg features
          features.ffmpeg_is_vertical = ffmpegResult.features.resolution_height > ffmpegResult.features.resolution_width ? 1 : 0;
          features.ffmpeg_is_hd = ffmpegResult.features.resolution_height >= 720 ? 1 : 0;
          features.ffmpeg_is_4k = ffmpegResult.features.resolution_height >= 2160 ? 1 : 0;
          features.ffmpeg_high_fps = ffmpegResult.features.fps >= 60 ? 1 : 0;
          features.ffmpeg_pixel_count = ffmpegResult.features.resolution_width * ffmpegResult.features.resolution_height;
          features.ffmpeg_aspect_ratio = ffmpegResult.features.resolution_height > 0 
            ? ffmpegResult.features.resolution_width / ffmpegResult.features.resolution_height 
            : 0;
        } else {
          errors.push(`FFmpeg extraction failed: ${ffmpegResult.error}`);
          addDefaultFFmpegFeatures(features);
        }
      } catch (ffmpegError: any) {
        errors.push(`FFmpeg error: ${ffmpegError.message}`);
        addDefaultFFmpegFeatures(features);
      }
    } else {
      // Add default FFmpeg features when not extracting
      addDefaultFFmpegFeatures(features);
    }

    // ========================================
    // GROUP 14: LLM FRAMEWORK SCORES
    // ========================================
    
    if (includeLLMScoring && transcript.length > 50) {
      try {
        const scriptInput: ScriptInput = {
          transcript: transcript,
          title: title,
          description: description,
          hashtags: hashtags,
          niche: niche,
        };
        
        const llmScores = await scoreWithLLM(scriptInput, { timeout: llmTimeout });
        hasLLMFeatures = true;
        
        // Add LLM scores (normalized to 0-1 scale if needed)
        features.llm_nine_attributes = llmScores.nine_attributes_score;
        features.llm_seven_legos = llmScores.seven_legos_score;
        features.llm_hook_quality = llmScores.hook_quality_score;
        features.llm_emotional_resonance = llmScores.emotional_resonance;
        features.llm_clarity = llmScores.clarity_score;
        features.llm_novelty = llmScores.novelty_score;
        features.llm_pacing = llmScores.pacing_score;
        features.llm_cta_quality = llmScores.call_to_action_score;
        features.llm_relatability = llmScores.relatability_score;
      } catch (llmError: any) {
        errors.push(`LLM scoring error: ${llmError.message}`);
        addDefaultLLMFeatures(features);
      }
    } else {
      addDefaultLLMFeatures(features);
    }

    // ========================================
    // GROUP 15: PATTERN MATCH FEATURES
    // ========================================
    
    if (includePatternFeatures) {
      if (patternData) {
        hasPatternFeatures = true;
        features.pattern_lego_count = patternData.lego_count / 7; // Normalized to 0-1
        features.pattern_has_topic = patternData.has_topic ? 1 : 0;
        features.pattern_has_angle = patternData.has_angle ? 1 : 0;
        features.pattern_has_hook = patternData.has_hook_structure ? 1 : 0;
        features.pattern_has_story = patternData.has_story_structure ? 1 : 0;
        features.pattern_has_visual = patternData.has_visual_format ? 1 : 0;
        features.pattern_has_key_visuals = patternData.has_key_visuals ? 1 : 0;
        features.pattern_has_audio = patternData.has_audio ? 1 : 0;
        features.pattern_style_match = patternData.style_id ? 1 : 0;
        
        if (patternData.attribute_scores) {
          const scores = Object.values(patternData.attribute_scores);
          features.pattern_attr_avg = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length / 10
            : 0.5;
        } else {
          features.pattern_attr_avg = 0.5;
        }
      } else {
        // Extract basic patterns from transcript
        hasPatternFeatures = true;
        features.pattern_lego_count = 0;
        features.pattern_has_topic = /\b(about|topic|talking about)\b/i.test(transcript) ? 1 : 0;
        features.pattern_has_angle = /\b(perspective|angle|approach|way to)\b/i.test(transcript) ? 1 : 0;
        features.pattern_has_hook = features.hook_pattern_match;
        features.pattern_has_story = features.has_story_format;
        features.pattern_has_visual = 0;
        features.pattern_has_key_visuals = 0;
        features.pattern_has_audio = 0;
        features.pattern_style_match = 0;
        features.pattern_attr_avg = 0.5;
      }
    } else {
      addDefaultPatternFeatures(features);
    }

    // ========================================
    // ADDITIONAL COMPUTED FEATURES
    // ========================================
    
    // Content density features
    features.content_density = features.word_count / Math.max(1, duration);
    features.information_density = (features.unique_word_count + features.number_count) / Math.max(1, features.word_count);
    
    // Engagement potential indicators
    features.engagement_signals = (features.question_mark_count + features.hook_has_you + features.has_cta) / 3;
    features.viral_potential_score = (
      features.hook_pattern_match * 0.3 +
      features.emotional_intensity * 0.2 +
      features.has_cta * 0.15 +
      features.curiosity_word_count / 5 * 0.2 +
      features.social_proof_count / 3 * 0.15
    );
    
    // Complexity features
    features.complexity_score = (
      features.avg_word_length / 10 +
      features.avg_sentence_length / 20 +
      features.avg_syllables_per_word / 3
    ) / 3;

    // ========================================
    // CALCULATE COVERAGE
    // ========================================
    
    const featureCount = Object.keys(features).length;
    const nonNullCount = Object.values(features).filter(v => v !== null && v !== undefined && !isNaN(v)).length;
    const coverage = nonNullCount / TOTAL_FEATURE_COUNT;

    return {
      features,
      featureCount,
      coverage: Math.min(1, coverage),
      extractionTimeMs: Date.now() - startTime,
      groupsExtracted: {
        textMetadata: hasTextMetadata,
        ffmpeg: hasFFmpegFeatures,
        llm: hasLLMFeatures,
        pattern: hasPatternFeatures,
      },
      errors
    };

  } catch (error: any) {
    errors.push(error.message);

    return {
      features: {},
      featureCount: 0,
      coverage: 0,
      extractionTimeMs: Date.now() - startTime,
      groupsExtracted: {
        textMetadata: false,
        ffmpeg: false,
        llm: false,
        pattern: false,
      },
      errors
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function addDefaultFFmpegFeatures(features: Record<string, number>): void {
  features.ffmpeg_resolution_width = 0;
  features.ffmpeg_resolution_height = 0;
  features.ffmpeg_fps = 0;
  features.ffmpeg_duration = 0;
  features.ffmpeg_has_audio = 0;
  features.ffmpeg_bitrate = 0;
  features.ffmpeg_scene_changes = 0;
  features.ffmpeg_cuts_per_second = 0;
  features.ffmpeg_avg_motion = 0.5;
  features.ffmpeg_color_variance = 0.5;
  features.ffmpeg_brightness_avg = 0.5;
  features.ffmpeg_contrast_score = 0.5;
  features.ffmpeg_is_vertical = 0;
  features.ffmpeg_is_hd = 0;
  features.ffmpeg_is_4k = 0;
  features.ffmpeg_high_fps = 0;
  features.ffmpeg_pixel_count = 0;
  features.ffmpeg_aspect_ratio = 0;
}

function addDefaultLLMFeatures(features: Record<string, number>): void {
  features.llm_nine_attributes = 0.5;
  features.llm_seven_legos = 0.5;
  features.llm_hook_quality = 0.5;
  features.llm_emotional_resonance = 0.5;
  features.llm_clarity = 0.5;
  features.llm_novelty = 0.5;
  features.llm_pacing = 0.5;
  features.llm_cta_quality = 0.5;
  features.llm_relatability = 0.5;
}

function addDefaultPatternFeatures(features: Record<string, number>): void {
  features.pattern_lego_count = 0;
  features.pattern_has_topic = 0;
  features.pattern_has_angle = 0;
  features.pattern_has_hook = 0;
  features.pattern_has_story = 0;
  features.pattern_has_visual = 0;
  features.pattern_has_key_visuals = 0;
  features.pattern_has_audio = 0;
  features.pattern_style_match = 0;
  features.pattern_attr_avg = 0.5;
}

// ============================================================================
// FEATURE NAME UTILITIES
// ============================================================================

/**
 * Get all feature names in order
 */
export function getAllFeatureNames(): string[] {
  return [
    // Group 1: Basic Text Metrics
    'word_count', 'char_count', 'title_word_count', 'description_word_count',
    'avg_word_length', 'unique_word_count', 'unique_word_ratio', 'lexical_diversity',
    'sentence_count', 'avg_sentence_length', 'syllable_count', 'avg_syllables_per_word',
    'flesch_reading_ease', 'flesch_kincaid_grade',
    
    // Group 2: Punctuation Analysis
    'question_mark_count', 'exclamation_mark_count', 'ellipsis_count', 'comma_count',
    'period_count', 'colon_count', 'semicolon_count', 'dash_count', 'quotation_count',
    'parenthesis_count',
    
    // Group 3: Pronoun & Perspective
    'first_person_singular', 'first_person_plural', 'second_person', 'third_person',
    'pronoun_ratio',
    
    // Group 4: Emotional & Power Words
    'positive_emotion_count', 'negative_emotion_count', 'power_word_count',
    'urgency_word_count', 'curiosity_word_count', 'emotional_intensity', 'sentiment_polarity',
    
    // Group 5: Viral Pattern Words
    'shock_word_count', 'social_proof_count', 'story_marker_count', 'cta_word_count', 'has_cta',
    
    // Group 6: Hook Features
    'hook_word_count', 'hook_has_question', 'hook_has_you', 'hook_has_number',
    'hook_has_power_word', 'hook_pattern_match',
    
    // Group 7: Video Metadata
    'duration_seconds', 'duration_log', 'is_short_video', 'is_medium_video',
    'is_long_video', 'optimal_duration', 'words_per_second', 'fast_pace', 'slow_pace',
    
    // Group 8: Hashtag Features
    'hashtag_count', 'has_hashtags', 'hashtag_diversity', 'viral_hashtag_count', 'has_viral_hashtag',
    
    // Group 9: Content Structure
    'has_numbers', 'number_count', 'has_list_format', 'has_story_format',
    'has_tutorial_format', 'has_comparison',
    
    // Group 10: Niche Alignment
    'niche_keyword_count', 'niche_alignment', 'is_finance_niche',
    
    // Group 11: Timing Features
    'upload_hour', 'upload_day_of_week', 'is_weekend', 'is_prime_time',
    'is_morning', 'is_afternoon',
    
    // Group 12: Creator Features
    'creator_followers', 'creator_followers_log', 'is_large_creator',
    'is_medium_creator', 'is_small_creator',
    
    // Group 13: FFmpeg Features
    'ffmpeg_resolution_width', 'ffmpeg_resolution_height', 'ffmpeg_fps', 'ffmpeg_duration',
    'ffmpeg_has_audio', 'ffmpeg_bitrate', 'ffmpeg_scene_changes', 'ffmpeg_cuts_per_second',
    'ffmpeg_avg_motion', 'ffmpeg_color_variance', 'ffmpeg_brightness_avg', 'ffmpeg_contrast_score',
    'ffmpeg_is_vertical', 'ffmpeg_is_hd', 'ffmpeg_is_4k', 'ffmpeg_high_fps',
    'ffmpeg_pixel_count', 'ffmpeg_aspect_ratio',
    
    // Group 14: LLM Features
    'llm_nine_attributes', 'llm_seven_legos', 'llm_hook_quality', 'llm_emotional_resonance',
    'llm_clarity', 'llm_novelty', 'llm_pacing', 'llm_cta_quality', 'llm_relatability',
    
    // Group 15: Pattern Features
    'pattern_lego_count', 'pattern_has_topic', 'pattern_has_angle', 'pattern_has_hook',
    'pattern_has_story', 'pattern_has_visual', 'pattern_has_key_visuals', 'pattern_has_audio',
    'pattern_style_match', 'pattern_attr_avg',
    
    // Additional Computed Features
    'content_density', 'information_density', 'engagement_signals',
    'viral_potential_score', 'complexity_score',
  ];
}
