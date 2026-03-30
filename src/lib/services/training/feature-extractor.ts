/**
 * Feature Extraction Integration for Training Pipeline
 * 
 * Extracts ~140 CONTENT-ONLY features across 14 groups for ML model training.
 * 
 * FEATURE GROUPS:
 * - Groups 1-11: Text/Metadata features (~53 features)
 * - Group 12: FFmpeg visual/audio features (~24 features)
 * - Group 13: LLM framework scores (~9 features)
 * - Group 14: Pattern match flags (~10 features)
 * 
 * ⚠️ CRITICAL: Engagement metrics (views, likes, DPS) are EXCLUDED.
 * These are OUTCOMES we predict, not inputs. At prediction time, new videos have 0 views.
 * The model must learn: "content characteristics → viral potential"
 * NOT: "high engagement → high DPS" (which is tautological)
 */

import { 
  extractFFmpegTrainingFeatures, 
  getDefaultFFmpegFeatures,
  FFmpegTrainingFeatures 
} from './ffmpeg-training-features';

import {
  scoreWithLLM,
  getDefaultScores,
  LLMFrameworkScores,
  ScriptInput,
} from './llm-framework-scoring';

import {
  segmentTranscriptByEstimation,
} from './transcript-segmentation';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedFeatures {
  features: Record<string, number>;
  featureCount: number;
  coverage: number; // Percentage of ~140 features extracted
  extractionTimeMs: number;
  hasTranscriptFeatures: boolean;
  hasAudioFeatures: boolean;
  hasVisualFeatures: boolean;
  hasFFmpegFeatures: boolean;
  hasLLMFeatures: boolean;
  hasPatternFeatures: boolean;
  errors: string[];
}

export interface FeatureExtractionInput {
  video_id: string;
  transcript: string;
  title: string;
  caption: string;
  description: string;
  hashtags: string[];
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  creator_followers_count: number;
  upload_timestamp: string;
  dps_score: number;
  video_path?: string;  // Optional: path to video file for FFmpeg extraction
}

export interface EnhancedExtractionOptions {
  includeFFmpeg?: boolean;         // Extract FFmpeg features (requires video_path)
  includeSceneDetection?: boolean; // Run scene detection (slower)
  ffmpegTimeout?: number;          // FFmpeg timeout in ms
  includeLLMScoring?: boolean;     // Extract LLM framework scores (requires transcript)
  llmTimeout?: number;             // LLM scoring timeout in ms
  includePatternFeatures?: boolean; // Extract pattern match features
  patternData?: PatternExtractionData; // Pre-extracted pattern data (optional)
}

export interface PatternExtractionData {
  lego_count: number;              // Number of Idea Legos present
  has_topic: boolean;
  has_angle: boolean;
  has_hook_structure: boolean;
  has_story_structure: boolean;
  has_visual_format: boolean;
  has_key_visuals: boolean;
  has_audio: boolean;
  style_id?: string;               // Viral style ID if matched
  attribute_scores?: Record<string, number>; // Nine attributes scores
}

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

/**
 * Extract training features from a video
 * 
 * @param video - Video data with transcript, metadata, etc.
 * @param options - Optional extraction options (FFmpeg, scene detection)
 * @returns Extracted features for training
 */
export async function extractTrainingFeatures(
  video: any, 
  options: EnhancedExtractionOptions = {}
): Promise<ExtractedFeatures> {
  const startTime = Date.now();
  const errors: string[] = [];
  const features: Record<string, number> = {};
  
  // ⚠️ DEFAULT TO TRUE for rich content features
  const { 
    includeFFmpeg = true,          // CHANGED: default to true
    includeSceneDetection = true, 
    ffmpegTimeout = 30000,
    includeLLMScoring = true,      // CHANGED: default to true
    llmTimeout = 30000,
    includePatternFeatures = true, // CHANGED: default to true
    patternData,
  } = options;

  try {
    const transcript = video.transcript_text || '';
    const caption = video.caption || '';
    const hashtags = video.hashtags || [];
    const duration = video.duration_seconds || 0;

    // ========================================
    // GROUP 1: TEXT FEATURES (from transcript/caption)
    // ========================================
    
    // Word count features
    const transcriptWords = transcript.split(/\s+/).filter((w: string) => w.length > 0);
    const captionWords = caption.split(/\s+/).filter((w: string) => w.length > 0);
    
    features.word_count = transcriptWords.length;
    features.caption_word_count = captionWords.length;
    features.avg_word_length = transcriptWords.length > 0 
      ? transcriptWords.reduce((sum: number, w: string) => sum + w.length, 0) / transcriptWords.length 
      : 0;
    features.unique_word_ratio = transcriptWords.length > 0
      ? new Set(transcriptWords.map((w: string) => w.toLowerCase())).size / transcriptWords.length
      : 0;

    // Sentence features
    const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    features.sentence_count = sentences.length;
    features.avg_sentence_length = sentences.length > 0
      ? transcriptWords.length / sentences.length
      : 0;

    // Question detection
    features.question_count = (transcript.match(/\?/g) || []).length;
    features.has_question = features.question_count > 0 ? 1 : 0;

    // Exclamation/emotion
    features.exclamation_count = (transcript.match(/!/g) || []).length;
    features.emotional_intensity = Math.min(1, features.exclamation_count / 5);

    // ========================================
    // GROUP 2: HOOK FEATURES (first 3 seconds)
    // ========================================
    
    const hookText = transcript.slice(0, 150); // Approximate first few seconds
    const hookWords = hookText.split(/\s+/).filter((w: string) => w.length > 0);
    
    features.hook_word_count = hookWords.length;
    features.hook_has_question = hookText.includes('?') ? 1 : 0;
    features.hook_has_you = /\byou\b/i.test(hookText) ? 1 : 0;
    features.hook_has_number = /\d/.test(hookText) ? 1 : 0;
    
    // Hook patterns
    const hookPatterns = [
      /^(here'?s?|this is)/i,
      /^(did you|have you|do you)/i,
      /^(stop|wait|listen)/i,
      /^(the|one|my|i )/i,
      /^(pov|imagine|story time)/i
    ];
    features.hook_pattern_match = hookPatterns.some(p => p.test(hookText.trim())) ? 1 : 0;

    // ========================================
    // GROUP 3: ENGAGEMENT PREDICTION FEATURES
    // ========================================
    // 
    // ⚠️ EXCLUDED FROM TRAINING FEATURES
    // These are the OUTCOMES we're trying to predict.
    // They are used to calculate the DPS TARGET LABEL, 
    // but should NOT be given to the model as input features.
    //
    // The model must learn to predict virality from CONTENT features only.
    // When a user uploads a new video, these metrics don't exist yet.
    //
    // features.views = video.views_count || 0;          // EXCLUDED
    // features.likes = video.likes_count || 0;          // EXCLUDED
    // features.comments = video.comments_count || 0;    // EXCLUDED
    // features.shares = video.shares_count || 0;        // EXCLUDED
    // features.saves = video.saves_count || 0;          // EXCLUDED
    // features.engagement_rate = ...                    // EXCLUDED
    // features.like_rate = ...                          // EXCLUDED
    // features.comment_rate = ...                       // EXCLUDED
    // features.share_rate = ...                         // EXCLUDED
    // features.save_rate = ...                          // EXCLUDED
    // features.viral_coefficient = ...                  // EXCLUDED

    // ========================================
    // GROUP 4: CREATOR FEATURES
    // ========================================
    
    features.creator_followers = video.creator_followers_count || 0;
    features.creator_followers_log = Math.log10(Math.max(1, features.creator_followers));
    features.is_large_creator = features.creator_followers >= 100000 ? 1 : 0;
    features.is_medium_creator = features.creator_followers >= 10000 && features.creator_followers < 100000 ? 1 : 0;
    features.is_small_creator = features.creator_followers < 10000 ? 1 : 0;

    // ========================================
    // GROUP 5: VIDEO METADATA FEATURES
    // ========================================
    
    features.duration_seconds = duration;
    features.duration_log = Math.log10(Math.max(1, duration));
    features.is_short_video = duration < 15 ? 1 : 0;
    features.is_medium_video = duration >= 15 && duration < 60 ? 1 : 0;
    features.is_long_video = duration >= 60 ? 1 : 0;
    features.optimal_duration = duration >= 15 && duration <= 45 ? 1 : 0;
    
    // Words per second (speaking pace)
    features.words_per_second = duration > 0 ? features.word_count / duration : 0;
    features.fast_pace = features.words_per_second > 3 ? 1 : 0;
    features.slow_pace = features.words_per_second < 1.5 ? 1 : 0;

    // ========================================
    // GROUP 6: HASHTAG FEATURES
    // ========================================
    
    features.hashtag_count = hashtags.length;
    features.has_hashtags = hashtags.length > 0 ? 1 : 0;
    features.hashtag_diversity = new Set(hashtags.map((h: string) => h.toLowerCase())).size;
    
    // Common viral hashtags
    const viralHashtags = ['fyp', 'foryou', 'foryoupage', 'viral', 'trending', 'blowthisup'];
    features.viral_hashtag_count = hashtags.filter((h: string) => 
      viralHashtags.includes(h.toLowerCase())
    ).length;
    features.has_viral_hashtag = features.viral_hashtag_count > 0 ? 1 : 0;

    // ========================================
    // GROUP 7: SENTIMENT & EMOTION FEATURES
    // ========================================
    
    // Simple sentiment indicators
    const positiveWords = ['love', 'amazing', 'great', 'best', 'awesome', 'incredible', 'perfect', 'beautiful'];
    const negativeWords = ['hate', 'worst', 'terrible', 'bad', 'awful', 'horrible', 'never'];
    
    const lowerTranscript = transcript.toLowerCase();
    features.positive_word_count = positiveWords.filter(w => lowerTranscript.includes(w)).length;
    features.negative_word_count = negativeWords.filter(w => lowerTranscript.includes(w)).length;
    features.sentiment_score = (features.positive_word_count - features.negative_word_count) / 
      Math.max(1, features.positive_word_count + features.negative_word_count);
    
    // Emoji detection (from caption) - using simple pattern that works without unicode flag
    const emojiRegex = /[\uD83C-\uDBFF\uDC00-\uDFFF]+|[\u2600-\u27BF]/g;
    const emojis = caption.match(emojiRegex) || [];
    features.emoji_count = emojis.length;
    features.has_emoji = emojis.length > 0 ? 1 : 0;

    // ========================================
    // GROUP 8: CTA (Call-to-Action) FEATURES
    // ========================================
    
    const ctaPhrases = [
      'follow', 'like', 'comment', 'share', 'subscribe', 'save',
      'link in bio', 'check out', 'click', 'tap', 'swipe',
      'turn on notifications', 'part 2', 'part two'
    ];
    
    features.cta_count = ctaPhrases.filter(cta => 
      lowerTranscript.includes(cta) || caption.toLowerCase().includes(cta)
    ).length;
    features.has_cta = features.cta_count > 0 ? 1 : 0;
    features.has_follow_cta = lowerTranscript.includes('follow') || caption.toLowerCase().includes('follow') ? 1 : 0;

    // ========================================
    // GROUP 9: TREND ALIGNMENT FEATURES
    // ========================================
    
    // Niche-specific keywords (finance niche)
    const financeKeywords = [
      'money', 'finance', 'invest', 'stock', 'crypto', 'budget', 'savings',
      'income', 'wealth', 'rich', 'millionaire', 'passive', 'side hustle'
    ];
    features.niche_keyword_count = financeKeywords.filter(kw => 
      lowerTranscript.includes(kw) || caption.toLowerCase().includes(kw)
    ).length;
    features.niche_alignment = Math.min(1, features.niche_keyword_count / 3);

    // ========================================
    // GROUP 10: TIMING FEATURES
    // ========================================
    
    if (video.upload_timestamp) {
      const uploadDate = new Date(video.upload_timestamp);
      features.upload_hour = uploadDate.getUTCHours();
      features.upload_day_of_week = uploadDate.getUTCDay();
      features.is_weekend = features.upload_day_of_week === 0 || features.upload_day_of_week === 6 ? 1 : 0;
      features.is_prime_time = features.upload_hour >= 18 && features.upload_hour <= 22 ? 1 : 0;
    } else {
      features.upload_hour = 0;
      features.upload_day_of_week = 0;
      features.is_weekend = 0;
      features.is_prime_time = 0;
    }

    // ========================================
    // GROUP 11: CONTENT STRUCTURE FEATURES
    // ========================================
    
    // List/number content
    features.has_numbers = /\d/.test(transcript) ? 1 : 0;
    features.number_count = (transcript.match(/\d+/g) || []).length;
    features.has_list_format = /\b(first|second|third|one|two|three|step|tip|way)\b/i.test(transcript) ? 1 : 0;
    
    // Story indicators
    features.has_story_format = /\b(so|then|and then|but then|story|happened)\b/i.test(transcript) ? 1 : 0;
    
    // Tutorial indicators
    features.has_tutorial_format = /\b(how to|learn|tutorial|guide|hack|trick|secret)\b/i.test(transcript) ? 1 : 0;

    // ========================================
    // GROUP 12: FFMPEG VISUAL/AUDIO FEATURES
    // ========================================
    // 
    // These features require the actual video file (video_path).
    // If includeFFmpeg=true and video_path is provided, we extract:
    // - Resolution, aspect ratio, fps, bitrate
    // - Scene changes, editing pace
    // - Audio presence, codec quality
    //
    let hasFFmpegFeatures = false;
    let ffmpegFeatures: FFmpegTrainingFeatures | null = null;
    
    if (includeFFmpeg && video.video_path) {
      try {
        const ffmpegResult = await extractFFmpegTrainingFeatures(video.video_path, {
          includeSceneDetection,
          timeout: ffmpegTimeout,
        });
        
        if (ffmpegResult.features.extraction_success) {
          ffmpegFeatures = ffmpegResult.features;
          hasFFmpegFeatures = true;
          
          // Merge FFmpeg features into main features object
          Object.entries(ffmpegFeatures).forEach(([key, value]) => {
            features[`ffmpeg_${key}`] = value;
          });
        } else {
          errors.push(...ffmpegResult.errors);
        }
      } catch (ffmpegError: any) {
        errors.push(`FFmpeg extraction failed: ${ffmpegError.message}`);
      }
    } else if (includeFFmpeg && !video.video_path) {
      errors.push('FFmpeg extraction requested but no video_path provided');
    }
    
    // If FFmpeg was requested but failed, add default features (zeros)
    if (includeFFmpeg && !hasFFmpegFeatures) {
      const defaultFFmpeg = getDefaultFFmpegFeatures();
      Object.entries(defaultFFmpeg).forEach(([key, value]) => {
        features[`ffmpeg_${key}`] = value;
      });
    }

    // ========================================
    // GROUP 13: LLM FRAMEWORK SCORES
    // ========================================
    //
    // LLM-generated content quality scores (1-10 scale):
    // - hook_strength_score
    // - emotional_arc_score
    // - value_density_score
    // - curiosity_gap_score
    // - shareability_score
    // - pacing_score
    // - authority_score
    // - relatability_score
    // - overall_viral_potential
    //
    let hasLLMFeatures = false;
    let llmScores: LLMFrameworkScores | null = null;
    
    if (includeLLMScoring && transcript.length > 50) {
      try {
        // Segment transcript for LLM analysis
        const segments = segmentTranscriptByEstimation(transcript, duration);
        
        const scriptInput: ScriptInput = {
          hook_text: segments.hookText,
          context_text: segments.contextText,
          value_text: segments.valueText,
          cta_text: segments.ctaText,
          full_transcript: transcript,
          niche: video.niche,
          hashtags: hashtags,
        };
        
        const llmResult = await scoreWithLLM(scriptInput, { timeout: llmTimeout });
        
        if (llmResult.success) {
          llmScores = llmResult.scores;
          hasLLMFeatures = true;
          
          // Add LLM scores to features (normalized to 0-1 scale)
          features.llm_hook_strength = llmScores.hook_strength_score / 10;
          features.llm_emotional_arc = llmScores.emotional_arc_score / 10;
          features.llm_value_density = llmScores.value_density_score / 10;
          features.llm_curiosity_gap = llmScores.curiosity_gap_score / 10;
          features.llm_shareability = llmScores.shareability_score / 10;
          features.llm_pacing = llmScores.pacing_score / 10;
          features.llm_authority = llmScores.authority_score / 10;
          features.llm_relatability = llmScores.relatability_score / 10;
          features.llm_viral_potential = llmScores.overall_viral_potential / 10;
        } else {
          errors.push(`LLM scoring failed: ${llmResult.error}`);
        }
      } catch (llmError: any) {
        errors.push(`LLM scoring error: ${llmError.message}`);
      }
    }
    
    // If LLM scoring was requested but failed, add default scores
    if (includeLLMScoring && !hasLLMFeatures) {
      const defaultLLM = getDefaultScores();
      features.llm_hook_strength = defaultLLM.hook_strength_score / 10;
      features.llm_emotional_arc = defaultLLM.emotional_arc_score / 10;
      features.llm_value_density = defaultLLM.value_density_score / 10;
      features.llm_curiosity_gap = defaultLLM.curiosity_gap_score / 10;
      features.llm_shareability = defaultLLM.shareability_score / 10;
      features.llm_pacing = defaultLLM.pacing_score / 10;
      features.llm_authority = defaultLLM.authority_score / 10;
      features.llm_relatability = defaultLLM.relatability_score / 10;
      features.llm_viral_potential = defaultLLM.overall_viral_potential / 10;
    }

    // ========================================
    // GROUP 14: PATTERN MATCH FEATURES
    // ========================================
    //
    // Pattern features derived from Idea Lego extraction:
    // - lego_count (0-7)
    // - Individual lego presence flags (0/1)
    // - Style ID encoded
    // - Attribute scores (if available)
    //
    let hasPatternFeatures = false;
    
    if (includePatternFeatures) {
      if (patternData) {
        // Use pre-extracted pattern data
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
        
        // Average attribute score if available
        if (patternData.attribute_scores) {
          const scores = Object.values(patternData.attribute_scores);
          features.pattern_attr_avg = scores.length > 0 
            ? scores.reduce((a, b) => a + b, 0) / scores.length / 10
            : 0.5;
        } else {
          features.pattern_attr_avg = 0.5;
        }
      } else {
        // No pattern data - set defaults
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
    }

    // ========================================
    // EXCLUDED: DPS/PERFORMANCE FEATURES
    // ========================================
    //
    // ⚠️ THESE ARE NOT FEATURES - they are OUTCOMES
    // 
    // At prediction time, a new video has:
    //   - 0 views
    //   - 0 likes
    //   - 0 comments
    //   - 0 shares
    //   - 0 saves
    //
    // The model must predict virality from CONTENT characteristics.
    // Performance metrics are used to calculate the TARGET LABEL only.
    //
    // EXCLUDED:
    // - views_count, likes_count, comments_count, shares_count, saves_count
    // - engagement_rate, like_rate, comment_rate, share_rate, save_rate
    // - dps_score, dps_percentile, is_viral, is_mega_viral

    // ========================================
    // CALCULATE COVERAGE
    // ========================================
    
    const featureCount = Object.keys(features).length;
    const nonNullCount = Object.values(features).filter(v => v !== null && v !== undefined).length;
    
    // Target features:
    // - Text/metadata: ~53 features
    // - FFmpeg: ~24 features
    // - LLM scores: ~9 features
    // - Pattern flags: ~10 features
    // Total target: ~96 features (when all enabled)
    const TARGET_TEXT_FEATURES = 53;
    const TARGET_FFMPEG_FEATURES = 24;
    const TARGET_LLM_FEATURES = 9;
    const TARGET_PATTERN_FEATURES = 10;
    
    let targetCount = TARGET_TEXT_FEATURES;
    if (includeFFmpeg) targetCount += TARGET_FFMPEG_FEATURES;
    if (includeLLMScoring) targetCount += TARGET_LLM_FEATURES;
    if (includePatternFeatures) targetCount += TARGET_PATTERN_FEATURES;
    
    const coverage = (nonNullCount / targetCount) * 100;

    // Check feature categories
    const hasTranscriptFeatures = features.word_count > 0;
    const hasAudioFeatures = features.words_per_second > 0;
    const hasVisualFeatures = hasFFmpegFeatures && (ffmpegFeatures?.resolution_width ?? 0) > 0;

    return {
      features,
      featureCount,
      coverage: Math.min(100, coverage),
      extractionTimeMs: Date.now() - startTime,
      hasTranscriptFeatures,
      hasAudioFeatures,
      hasVisualFeatures,
      hasFFmpegFeatures,
      hasLLMFeatures,
      hasPatternFeatures,
      errors
    };

  } catch (error: any) {
    errors.push(error.message);

    return {
      features: {},
      featureCount: 0,
      coverage: 0,
      extractionTimeMs: Date.now() - startTime,
      hasTranscriptFeatures: false,
      hasAudioFeatures: false,
      hasVisualFeatures: false,
      hasFFmpegFeatures: false,
      hasLLMFeatures: false,
      hasPatternFeatures: false,
      errors
    };
  }
}

/**
 * Batch extraction for efficiency
 */
export async function extractTrainingFeaturesBatch(
  videos: any[],
  batchSize: number = 10,
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, ExtractedFeatures>> {
  const results = new Map<string, ExtractedFeatures>();

  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(video => extractTrainingFeatures(video))
    );

    batch.forEach((video, idx) => {
      results.set(video.video_id, batchResults[idx]);
    });

    if (onProgress) {
      onProgress(Math.min(i + batchSize, videos.length), videos.length);
    }
  }

  return results;
}

/**
 * Get feature names and descriptions
 */
export function getFeatureMetadata(): Array<{ name: string; group: string; description: string }> {
  return [
    // Text features
    { name: 'word_count', group: 'text', description: 'Total words in transcript' },
    { name: 'caption_word_count', group: 'text', description: 'Total words in caption' },
    { name: 'avg_word_length', group: 'text', description: 'Average word length' },
    { name: 'unique_word_ratio', group: 'text', description: 'Ratio of unique words' },
    { name: 'sentence_count', group: 'text', description: 'Number of sentences' },
    { name: 'avg_sentence_length', group: 'text', description: 'Average words per sentence' },
    
    // Hook features
    { name: 'hook_word_count', group: 'hook', description: 'Words in first 3 seconds' },
    { name: 'hook_has_question', group: 'hook', description: 'Hook contains question' },
    { name: 'hook_pattern_match', group: 'hook', description: 'Hook matches viral patterns' },
    
    // Engagement features
    { name: 'engagement_rate', group: 'engagement', description: 'Total engagements / views' },
    { name: 'viral_coefficient', group: 'engagement', description: 'Views / follower count' },
    
    // ... add more as needed
  ];
}











