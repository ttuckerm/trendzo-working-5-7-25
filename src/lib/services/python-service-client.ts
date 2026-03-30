/**
 * Client for the Python Enhancement Service
 * Provides video analysis, sentiment, transcription, and explainability
 * 
 * Integrations:
 * - PySceneDetect: Real scene/cut detection for hook timing and pacing
 * - VADER Sentiment: Social media-optimized sentiment analysis
 * - SHAP: XGBoost model explainability for DPS scores
 * - faster-whisper: Fast local transcription with word timestamps
 */

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || 'http://localhost:8000';

// =====================
// Types
// =====================

export interface SceneResult {
  scene_number: number;
  start_time: number;
  end_time: number;
  start_frame: number;
  end_frame: number;
  duration: number;
}

export interface SceneAnalysisResult {
  success: boolean;
  total_scenes: number;
  scenes: SceneResult[];
  hook_analysis: {
    cuts_in_first_3_seconds: number;
    first_cut_time: number | null;
    hook_has_movement: boolean;
    hook_score: number;
  };
  pacing_metrics: {
    total_cuts: number;
    avg_scene_duration: number;
    pacing_style: 'rapid_fire' | 'fast' | 'moderate' | 'slow';
    rapid_fire_segments: number;
    slow_segments: number;
    pacing_score: number;
  };
}

export interface SentimentOverall {
  positive: number;
  negative: number;
  neutral: number;
  compound: number;
  classification: 'positive' | 'negative' | 'neutral';
}

export interface SentimentResult {
  success: boolean;
  overall: SentimentOverall;
  sentences?: Array<{
    index: number;
    text: string;
    positive: number;
    negative: number;
    neutral: number;
    compound: number;
  }>;
  emotional_journey?: {
    opening_sentiment: number;
    middle_sentiment: number;
    closing_sentiment: number;
    emotional_arc: 'rising' | 'falling' | 'valley' | 'peak' | 'flat';
    volatility: number;
  };
  viral_indicators: {
    has_strong_emotion: boolean;
    emotional_intensity: number;
    positivity_ratio: number;
    sentiment_score_for_xgboost: {
      sentiment_polarity: number;
      sentiment_subjectivity: number;
      positive_negative_ratio: number;
      emotional_volatility: number;
    };
  };
}

export interface SpeechMetrics {
  words_per_second: number;
  words_per_minute: number;
  pause_count: number;
  avg_pause_duration: number;
  speech_density: number;
  speaking_pace: 'slow' | 'moderate' | 'fast' | 'very_fast';
  xgboost_features: {
    words_per_second: number;
    silence_pause_count: number;
    rapid_fire_segments: number;
    slow_segments: number;
  };
}

export interface TranscriptionResult {
  success: boolean;
  text: string;
  language: string;
  language_probability: number;
  duration: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    probability: number;
  }>;
  speech_metrics: SpeechMetrics;
}

export interface ShapFeature {
  name: string;
  value: number;
  shap_value: number;
}

export interface ExplainResult {
  success: boolean;
  prediction: number;
  base_value: number;
  shap_values: Record<string, number>;
  top_positive_features: Array<{
    feature: string;
    impact: number;
    direction: string;
  }>;
  top_negative_features: Array<{
    feature: string;
    impact: number;
    direction: string;
  }>;
  explanation_text: string;
  visualization_data: {
    base_value: number;
    features: ShapFeature[];
  };
}

export interface FullAnalysisResult {
  success: boolean;
  transcription: {
    text: string;
    language: string;
    word_count: number;
    duration: number;
    speech_metrics: SpeechMetrics;
  };
  sentiment: {
    overall: Record<string, number>;
    classification: string;
  };
  scenes: {
    total_scenes: number;
    hook_cuts: number;
    avg_scene_duration: number;
    pacing_style: string;
  };
  xgboost_features: Record<string, number>;
}

export interface ServiceHealth {
  status: string;
  services: {
    scene_detection: string;
    sentiment_analysis: string;
    transcription: string;
    explainability: string;
  };
}

// =====================
// Client Class
// =====================

class PythonServiceClient {
  private baseUrl: string;
  private isAvailable: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 60000; // 1 minute cache

  constructor(baseUrl: string = PYTHON_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the Python service is available
   */
  async healthCheck(): Promise<boolean> {
    // Cache health check result for 1 minute
    const now = Date.now();
    if (this.isAvailable !== null && now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isAvailable;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      this.isAvailable = response.ok;
      this.lastHealthCheck = now;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Get detailed service health status
   */
  async getServiceHealth(): Promise<ServiceHealth | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) return null;
      return response.json();
    } catch {
      return null;
    }
  }

  /**
   * Analyze video scenes using PySceneDetect
   * Returns scene boundaries, hook analysis, and pacing metrics
   */
  async analyzeScenes(videoFile: File | Blob): Promise<SceneAnalysisResult> {
    const formData = new FormData();
    formData.append('file', videoFile);

    const response = await fetch(`${this.baseUrl}/analyze/scenes`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Scene analysis failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Analyze text sentiment using VADER (optimized for social media)
   * Returns overall sentiment, sentence breakdown, and viral indicators
   */
  async analyzeSentiment(
    text: string,
    analyzeSentences: boolean = true
  ): Promise<SentimentResult> {
    const response = await fetch(`${this.baseUrl}/analyze/sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        analyze_sentences: analyzeSentences,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sentiment analysis failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Transcribe audio/video using faster-whisper
   * Returns transcript with word-level timestamps and speech metrics
   */
  async transcribe(
    audioFile: File | Blob,
    wordTimestamps: boolean = true
  ): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('word_timestamps', String(wordTimestamps));

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Explain XGBoost prediction using SHAP values
   * Shows which features contributed most to the DPS score
   */
  async explainPrediction(
    features: Record<string, number>,
    prediction: number
  ): Promise<ExplainResult> {
    const response = await fetch(`${this.baseUrl}/explain/prediction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, prediction }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Explanation failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Perform full video analysis (transcription + sentiment + scenes)
   * Returns all analysis results plus XGBoost-ready features
   */
  async fullAnalysis(videoFile: File | Blob): Promise<FullAnalysisResult> {
    const formData = new FormData();
    formData.append('file', videoFile);

    const response = await fetch(`${this.baseUrl}/analyze/full`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Full analysis failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Analyze scenes only (lighter weight than full analysis)
   */
  async analyzeHookAndPacing(videoFile: File | Blob): Promise<{
    hookScore: number;
    pacingScore: number;
    totalCuts: number;
    pacingStyle: string;
    cutsInFirst3Seconds: number;
  }> {
    const result = await this.analyzeScenes(videoFile);
    
    return {
      hookScore: result.hook_analysis.hook_score,
      pacingScore: result.pacing_metrics.pacing_score,
      totalCuts: result.pacing_metrics.total_cuts,
      pacingStyle: result.pacing_metrics.pacing_style,
      cutsInFirst3Seconds: result.hook_analysis.cuts_in_first_3_seconds,
    };
  }

  /**
   * Get XGBoost features from text only (no video)
   */
  async getTextFeatures(text: string): Promise<Record<string, number>> {
    const sentiment = await this.analyzeSentiment(text);
    
    return {
      sentiment_polarity: sentiment.viral_indicators.sentiment_score_for_xgboost.sentiment_polarity,
      sentiment_subjectivity: sentiment.viral_indicators.sentiment_score_for_xgboost.sentiment_subjectivity,
      positive_negative_ratio: sentiment.viral_indicators.sentiment_score_for_xgboost.positive_negative_ratio,
      emotional_volatility: sentiment.viral_indicators.sentiment_score_for_xgboost.emotional_volatility,
      emotional_intensity: sentiment.viral_indicators.emotional_intensity,
      has_strong_emotion: sentiment.viral_indicators.has_strong_emotion ? 1 : 0,
    };
  }
}

// Export singleton instance
export const pythonService = new PythonServiceClient();
export default pythonService;


