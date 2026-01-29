/**
 * Enhanced Feature Extraction Service
 * 
 * Integrates Python microservice for accurate video/audio analysis:
 * - PySceneDetect for real scene/cut detection
 * - VADER for social media-optimized sentiment
 * - faster-whisper for word-level timestamps and speech metrics
 */

import pythonService from '../python-service-client';

export interface EnhancedFeatures {
  // Speech metrics (from faster-whisper)
  words_per_second: number;
  silence_pause_count: number;
  rapid_fire_segments: number;
  slow_segments: number;
  speech_density: number;
  words_per_minute: number;
  
  // Sentiment metrics (from VADER)
  sentiment_polarity: number;
  sentiment_subjectivity: number;
  positive_negative_ratio: number;
  emotional_volatility: number;
  emotional_intensity: number;
  
  // Scene/pacing metrics (from PySceneDetect)
  total_scene_cuts: number;
  hook_cuts_first_3s: number;
  avg_scene_duration: number;
  pacing_score: number;
  hook_score: number;
  
  // Video metadata
  video_duration_seconds: number;
  
  // Analysis metadata
  _python_service_used: boolean;
  _analysis_method: 'full' | 'partial' | 'fallback';
}

/**
 * Extract enhanced features using Python services when available
 * Falls back to basic features if service is unavailable
 */
export async function extractEnhancedFeatures(
  videoFile: File | Blob | null,
  transcript: string,
  existingFeatures: Record<string, number> = {}
): Promise<EnhancedFeatures> {
  // Start with defaults
  const enhancedFeatures: EnhancedFeatures = {
    words_per_second: existingFeatures.words_per_second || 0,
    silence_pause_count: existingFeatures.silence_pause_count || 0,
    rapid_fire_segments: existingFeatures.rapid_fire_segments || 0,
    slow_segments: existingFeatures.slow_segments || 0,
    speech_density: existingFeatures.speech_density || 0,
    words_per_minute: existingFeatures.words_per_minute || 0,
    sentiment_polarity: existingFeatures.sentiment_polarity || 0,
    sentiment_subjectivity: existingFeatures.sentiment_subjectivity || 0.5,
    positive_negative_ratio: existingFeatures.positive_negative_ratio || 1,
    emotional_volatility: existingFeatures.emotional_volatility || 0,
    emotional_intensity: existingFeatures.emotional_intensity || 50,
    total_scene_cuts: existingFeatures.total_scene_cuts || 0,
    hook_cuts_first_3s: existingFeatures.hook_cuts_first_3s || 0,
    avg_scene_duration: existingFeatures.avg_scene_duration || 0,
    pacing_score: existingFeatures.pacing_score || 50,
    hook_score: existingFeatures.hook_score || 50,
    video_duration_seconds: existingFeatures.video_duration_seconds || 0,
    _python_service_used: false,
    _analysis_method: 'fallback',
  };

  // Check if Python service is available
  const pythonAvailable = await pythonService.healthCheck();

  if (!pythonAvailable) {
    console.warn('[EnhancedFeatures] Python service unavailable, using fallback estimation');
    
    // Estimate features from transcript if available
    if (transcript) {
      const estimatedFeatures = estimateFeaturesFromTranscript(transcript);
      Object.assign(enhancedFeatures, estimatedFeatures);
    }
    
    return enhancedFeatures;
  }

  try {
    // If we have a video file, do full analysis
    if (videoFile) {
      console.log('[EnhancedFeatures] Running full video analysis via Python service...');
      
      const fullAnalysis = await pythonService.fullAnalysis(videoFile);

      if (fullAnalysis.success) {
        // Merge all XGBoost features from Python analysis
        Object.assign(enhancedFeatures, fullAnalysis.xgboost_features);
        
        // Additional speech metrics
        if (fullAnalysis.transcription?.speech_metrics) {
          const speechMetrics = fullAnalysis.transcription.speech_metrics;
          enhancedFeatures.words_per_second = speechMetrics.xgboost_features.words_per_second;
          enhancedFeatures.silence_pause_count = speechMetrics.xgboost_features.silence_pause_count;
          enhancedFeatures.rapid_fire_segments = speechMetrics.xgboost_features.rapid_fire_segments;
          enhancedFeatures.slow_segments = speechMetrics.xgboost_features.slow_segments;
          enhancedFeatures.speech_density = speechMetrics.speech_density;
          enhancedFeatures.words_per_minute = speechMetrics.words_per_minute;
        }
        
        // Scene metrics
        if (fullAnalysis.scenes) {
          enhancedFeatures.total_scene_cuts = fullAnalysis.scenes.total_scenes;
          enhancedFeatures.hook_cuts_first_3s = fullAnalysis.scenes.hook_cuts;
          enhancedFeatures.avg_scene_duration = fullAnalysis.scenes.avg_scene_duration;
        }
        
        // Video duration
        if (fullAnalysis.transcription?.duration) {
          enhancedFeatures.video_duration_seconds = fullAnalysis.transcription.duration;
        }
        
        enhancedFeatures._python_service_used = true;
        enhancedFeatures._analysis_method = 'full';
        
        console.log('[EnhancedFeatures] Full analysis complete');
        return enhancedFeatures;
      }
    }
    
    // Text-only analysis using VADER (when no video file)
    if (transcript) {
      console.log('[EnhancedFeatures] Running text-only analysis via Python service...');
      
      const sentiment = await pythonService.analyzeSentiment(transcript);

      if (sentiment.success) {
        const xgbFeatures = sentiment.viral_indicators.sentiment_score_for_xgboost;
        
        enhancedFeatures.sentiment_polarity = xgbFeatures.sentiment_polarity;
        enhancedFeatures.sentiment_subjectivity = xgbFeatures.sentiment_subjectivity;
        enhancedFeatures.positive_negative_ratio = xgbFeatures.positive_negative_ratio;
        enhancedFeatures.emotional_volatility = xgbFeatures.emotional_volatility;
        enhancedFeatures.emotional_intensity = sentiment.viral_indicators.emotional_intensity;
        
        // Estimate word metrics from transcript
        const wordCount = transcript.split(/\s+/).length;
        const estimatedDuration = wordCount / 2.5; // Assume ~2.5 words per second
        enhancedFeatures.words_per_second = 2.5;
        enhancedFeatures.words_per_minute = 150;
        enhancedFeatures.video_duration_seconds = estimatedDuration;
        
        enhancedFeatures._python_service_used = true;
        enhancedFeatures._analysis_method = 'partial';
        
        console.log('[EnhancedFeatures] Text-only analysis complete');
      }
    }
    
  } catch (error) {
    console.error('[EnhancedFeatures] Python service error:', error);
    
    // Fall back to estimation
    if (transcript) {
      const estimatedFeatures = estimateFeaturesFromTranscript(transcript);
      Object.assign(enhancedFeatures, estimatedFeatures);
    }
  }

  return enhancedFeatures;
}

/**
 * Estimate features from transcript when Python service is unavailable
 */
function estimateFeaturesFromTranscript(transcript: string): Partial<EnhancedFeatures> {
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Estimate duration (average speaking pace is 150 wpm = 2.5 wps)
  const estimatedDuration = wordCount / 2.5;
  
  // Basic sentiment estimation (count positive/negative words)
  const positiveWords = ['great', 'amazing', 'love', 'best', 'awesome', 'incredible', 'fantastic', 'perfect', 'excellent', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'hate', 'worst', 'awful', 'horrible', 'poor', 'wrong', 'fail', 'never'];
  
  const lowerText = transcript.toLowerCase();
  const positiveCount = positiveWords.reduce((count, word) => 
    count + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
  const negativeCount = negativeWords.reduce((count, word) => 
    count + (lowerText.match(new RegExp(`\\b${word}\\b`, 'g'))?.length || 0), 0);
  
  const totalEmotionWords = positiveCount + negativeCount;
  const sentimentPolarity = totalEmotionWords > 0 
    ? (positiveCount - negativeCount) / totalEmotionWords 
    : 0;
  
  return {
    words_per_second: 2.5,
    words_per_minute: 150,
    video_duration_seconds: estimatedDuration,
    sentiment_polarity: sentimentPolarity,
    sentiment_subjectivity: Math.min(1, totalEmotionWords / wordCount * 10),
    positive_negative_ratio: negativeCount > 0 ? positiveCount / negativeCount : positiveCount + 1,
    emotional_intensity: Math.min(100, totalEmotionWords * 10),
    emotional_volatility: sentences.length > 1 ? 0.3 : 0.1, // Rough estimate
    _analysis_method: 'fallback',
  };
}

/**
 * Extract scene-specific features from video
 */
export async function extractSceneFeatures(videoFile: File | Blob): Promise<{
  hookScore: number;
  pacingScore: number;
  totalCuts: number;
  cutsInFirst3Seconds: number;
  avgSceneDuration: number;
  pacingStyle: string;
} | null> {
  const pythonAvailable = await pythonService.healthCheck();
  
  if (!pythonAvailable) {
    console.warn('[SceneFeatures] Python service unavailable');
    return null;
  }
  
  try {
    const result = await pythonService.analyzeScenes(videoFile);
    
    return {
      hookScore: result.hook_analysis.hook_score,
      pacingScore: result.pacing_metrics.pacing_score,
      totalCuts: result.pacing_metrics.total_cuts,
      cutsInFirst3Seconds: result.hook_analysis.cuts_in_first_3_seconds,
      avgSceneDuration: result.pacing_metrics.avg_scene_duration,
      pacingStyle: result.pacing_metrics.pacing_style,
    };
  } catch (error) {
    console.error('[SceneFeatures] Analysis failed:', error);
    return null;
  }
}

/**
 * Transcribe video/audio with word timestamps
 */
export async function transcribeWithTimestamps(audioFile: File | Blob): Promise<{
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
  duration: number;
  speechMetrics: {
    wordsPerSecond: number;
    pauseCount: number;
    speakingPace: string;
  };
} | null> {
  const pythonAvailable = await pythonService.healthCheck();
  
  if (!pythonAvailable) {
    console.warn('[Transcription] Python service unavailable');
    return null;
  }
  
  try {
    const result = await pythonService.transcribe(audioFile, true);
    
    return {
      text: result.text,
      words: result.words || [],
      duration: result.duration,
      speechMetrics: {
        wordsPerSecond: result.speech_metrics.words_per_second,
        pauseCount: result.speech_metrics.pause_count,
        speakingPace: result.speech_metrics.speaking_pace,
      },
    };
  } catch (error) {
    console.error('[Transcription] Failed:', error);
    return null;
  }
}

export default extractEnhancedFeatures;


