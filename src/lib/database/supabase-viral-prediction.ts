/**
 * Supabase Database Client for Viral Prediction System
 * 
 * This module provides type-safe database operations for the viral prediction platform.
 * It includes all the necessary types, interfaces, and helper functions.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from '@/lib/env'

// =============================================
// ENVIRONMENT CONFIGURATION
// =============================================

let _supabaseClient: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return _supabaseClient
}

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  }
  return _supabaseAdmin
}

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface Video {
  id: string
  external_id?: string
  title: string
  description?: string
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin'
  platform_video_id?: string
  creator_username?: string
  creator_id?: string
  
  // File information
  file_url?: string
  thumbnail_url?: string
  file_size_bytes?: number
  duration_seconds?: number
  width?: number
  height?: number
  fps?: number
  
  // Content metadata
  upload_date?: string
  posted_date?: string
  language?: string
  content_category?: string
  metadata?: any
  
  // Processing status
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'error'
  source_type: 'upload' | 'scraped' | 'manual'
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface VideoFeatures {
  id: string
  video_id: string
  
  // Feature data (stored as JSONB)
  visual_features?: any
  audio_features?: any
  text_features?: any
  
  // Structural analysis
  hook_duration_seconds?: number
  scene_changes?: number
  face_screen_time_percent?: number
  text_overlay_duration?: number
  
  // Content analysis
  emotional_tone?: any
  complexity_score?: number
  novelty_score?: number
  engagement_triggers?: any
  
  // ML features
  feature_vector?: number[]
  
  // Processing metadata
  extraction_version?: string
  processing_duration_ms?: number
  
  created_at: string
  updated_at: string
}

export interface VideoMetrics {
  id: string
  video_id: string
  
  // Basic metrics
  views_count: number
  likes_count: number
  comments_count: number
  shares_count: number
  saves_count: number
  
  // Calculated metrics
  engagement_rate?: number
  completion_rate?: number
  share_rate?: number
  comment_rate?: number
  
  // Time-based metrics
  views_24h?: number
  views_7d?: number
  views_30d?: number
  peak_views_day?: number
  
  // Advanced metrics
  viral_coefficient?: number
  organic_reach_percent?: number
  algorithm_boost_score?: number
  
  // Temporal data
  metrics_date: string
  is_final: boolean
  
  created_at: string
}

export interface ViralPrediction {
  id: string
  video_id: string
  
  // Prediction results
  viral_probability: number
  confidence_score: number
  predicted_views?: number
  predicted_engagement_rate?: number
  
  // Prediction breakdown
  hook_score?: number
  content_score?: number
  timing_score?: number
  platform_fit_score?: number
  
  // Model information
  model_version: string
  model_confidence?: number
  prediction_factors?: any
  
  // Validation data
  actual_views?: number
  actual_engagement_rate?: number
  accuracy_score?: number
  prediction_error?: number
  is_correct?: boolean
  
  // Metadata
  prediction_date: string
  validation_date?: string
  
  created_at: string
}

export interface ViralTemplate {
  id: string
  name: string
  description?: string
  category: string
  
  // Performance data
  success_rate: number
  avg_views?: number
  avg_engagement_rate?: number
  viral_probability?: number
  
  // Template structure
  structure: {
    hook: string
    build: string
    payoff: string
    cta: string
  }
  viral_elements?: any[]
  optimization_tips?: any[]
  
  // Platform optimization
  platform_optimized: string[]
  duration_range?: string
  hook_timing_seconds?: number
  
  // Status and lifecycle
  status: 'HOT' | 'COOLING' | 'NEW' | 'STABLE' | 'ARCHIVED'
  trend_direction: 'RISING' | 'FALLING' | 'STABLE'
  
  // Usage tracking
  usage_count: number
  last_used_at?: string
  
  created_at: string
  updated_at: string
}

export interface OptimizationSuggestion {
  id: string
  video_id: string
  
  // Suggestion details
  suggestion_type: 'hook' | 'structure' | 'visual' | 'audio' | 'timing' | 'cta'
  title: string
  description: string
  
  // Impact estimation
  current_score?: number
  potential_score?: number
  impact_estimate?: number
  confidence?: number
  
  // Implementation
  difficulty: 'easy' | 'medium' | 'hard'
  implementation_time?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  
  // AI reasoning
  ai_reasoning?: string
  examples?: any
  
  // Status
  status: 'pending' | 'implemented' | 'rejected' | 'expired'
  
  created_at: string
}

export interface ABTestRun {
  id: string
  test_name: string
  hypothesis: string
  test_type: 'hook' | 'thumbnail' | 'structure' | 'cta' | 'timing'
  
  // Test configuration
  target_sample_size: number
  target_significance: number
  target_accuracy: number
  
  // Status and lifecycle
  status: 'draft' | 'running' | 'completed' | 'paused' | 'cancelled'
  start_date?: string
  end_date?: string
  
  // Results
  winner_variant_id?: string
  statistical_significance: boolean
  confidence_interval?: number
  
  created_at: string
  updated_at: string
}

export interface ValidationRun {
  id: string
  run_name: string
  run_type: string
  
  // Configuration
  target_predictions: number
  target_accuracy: number
  target_significance: number
  
  // Status
  status: 'running' | 'completed' | 'paused' | 'failed'
  start_date: string
  end_date?: string
  
  // Results
  completed_predictions: number
  current_accuracy?: number
  confidence_interval?: number
  statistical_significance: boolean
  
  // Insights
  insights?: any
  
  created_at: string
}

export interface SystemMetrics {
  id: string
  
  // Accuracy metrics
  overall_accuracy?: number
  precision_score?: number
  recall_score?: number
  f1_score?: number
  
  // Error metrics
  mean_absolute_error?: number
  root_mean_square_error?: number
  
  // Model performance
  confidence_calibration?: number
  prediction_consistency?: number
  cross_platform_variance?: number
  
  // Volume metrics
  predictions_made?: number
  correct_predictions?: number
  false_positives?: number
  false_negatives?: number
  
  // Time period
  metric_date: string
  metric_period: string
  
  created_at: string
}

// =============================================
// DATABASE OPERATIONS
// =============================================

export class ViralPredictionDB {
  
  // =============================================
  // VIDEO OPERATIONS
  // =============================================
  
  static async createVideo(videoData: Omit<Video, 'id' | 'created_at' | 'updated_at'>): Promise<Video> {
    const { data, error } = await supabaseAdmin
      .from('videos')
      .insert(videoData)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create video: ${error.message}`)
    return data
  }
  
  static async getVideo(id: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get video: ${error.message}`)
    }
    return data
  }
  
  static async updateVideoStatus(id: string, status: Video['processing_status']): Promise<void> {
    const { error } = await supabaseAdmin
      .from('videos')
      .update({ processing_status: status, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) throw new Error(`Failed to update video status: ${error.message}`)
  }
  
  static async getVideosByPlatform(platform: string, limit = 50): Promise<Video[]> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('platform', platform)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw new Error(`Failed to get videos by platform: ${error.message}`)
    return data || []
  }
  
  // =============================================
  // VIRAL PREDICTION OPERATIONS
  // =============================================
  
  static async createPrediction(predictionData: Omit<ViralPrediction, 'id' | 'created_at'>): Promise<ViralPrediction> {
    const { data, error } = await supabaseAdmin
      .from('viral_predictions')
      .insert(predictionData)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create prediction: ${error.message}`)
    return data
  }
  
  static async getPrediction(id: string): Promise<ViralPrediction | null> {
    const { data, error } = await supabase
      .from('viral_predictions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get prediction: ${error.message}`)
    }
    return data
  }
  
  static async getPredictionByVideoId(videoId: string): Promise<ViralPrediction | null> {
    const { data, error } = await supabase
      .from('viral_predictions')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get prediction by video ID: ${error.message}`)
    }
    return data
  }
  
  static async updatePredictionValidation(
    id: string, 
    validationData: Partial<Pick<ViralPrediction, 'actual_views' | 'actual_engagement_rate' | 'accuracy_score' | 'prediction_error' | 'is_correct'>>
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('viral_predictions')
      .update({ 
        ...validationData, 
        validation_date: new Date().toISOString() 
      })
      .eq('id', id)
    
    if (error) throw new Error(`Failed to update prediction validation: ${error.message}`)
  }
  
  static async getRecentPredictions(limit = 100): Promise<ViralPrediction[]> {
    const { data, error } = await supabase
      .from('viral_predictions')
      .select(`
        *,
        videos (
          title,
          platform,
          creator_username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw new Error(`Failed to get recent predictions: ${error.message}`)
    return data || []
  }
  
  // =============================================
  // TEMPLATE OPERATIONS
  // =============================================
  
  static async getTemplates(filters: {
    category?: string
    status?: string
    platform?: string
    limit?: number
  } = {}): Promise<ViralTemplate[]> {
    let query = supabase
      .from('viral_templates')
      .select('*')
    
    if (filters.category) {
      query = query.eq('category', filters.category)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters.platform) {
      query = query.contains('platform_optimized', [filters.platform])
    }
    
    query = query
      .order('success_rate', { ascending: false })
      .limit(filters.limit || 50)
    
    const { data, error } = await query
    
    if (error) throw new Error(`Failed to get templates: ${error.message}`)
    return data || []
  }
  
  static async getTemplate(id: string): Promise<ViralTemplate | null> {
    const { data, error } = await supabase
      .from('viral_templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get template: ${error.message}`)
    }
    return data
  }
  
  static async createTemplate(templateData: Omit<ViralTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>): Promise<ViralTemplate> {
    const { data, error } = await supabaseAdmin
      .from('viral_templates')
      .insert({ ...templateData, usage_count: 0 })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create template: ${error.message}`)
    return data
  }
  
  static async updateTemplateUsage(templateId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('viral_templates')
      .update({ 
        usage_count: supabase.sql`usage_count + 1`,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)
    
    if (error) throw new Error(`Failed to update template usage: ${error.message}`)
  }
  
  // =============================================
  // OPTIMIZATION OPERATIONS
  // =============================================
  
  static async createOptimizationSuggestions(
    videoId: string, 
    suggestions: Omit<OptimizationSuggestion, 'id' | 'video_id' | 'created_at'>[]
  ): Promise<OptimizationSuggestion[]> {
    const suggestionData = suggestions.map(suggestion => ({
      ...suggestion,
      video_id: videoId,
      status: 'pending' as const
    }))
    
    const { data, error } = await supabaseAdmin
      .from('optimization_suggestions')
      .insert(suggestionData)
      .select()
    
    if (error) throw new Error(`Failed to create optimization suggestions: ${error.message}`)
    return data || []
  }
  
  static async getOptimizationSuggestions(videoId: string): Promise<OptimizationSuggestion[]> {
    const { data, error } = await supabase
      .from('optimization_suggestions')
      .select('*')
      .eq('video_id', videoId)
      .eq('status', 'pending')
      .order('priority', { ascending: true })
    
    if (error) throw new Error(`Failed to get optimization suggestions: ${error.message}`)
    return data || []
  }
  
  // =============================================
  // VALIDATION OPERATIONS
  // =============================================
  
  static async createValidationRun(runData: Omit<ValidationRun, 'id' | 'created_at' | 'completed_predictions' | 'statistical_significance'>): Promise<ValidationRun> {
    const { data, error } = await supabaseAdmin
      .from('validation_runs')
      .insert({
        ...runData,
        completed_predictions: 0,
        statistical_significance: false
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create validation run: ${error.message}`)
    return data
  }
  
  static async getValidationRuns(limit = 20): Promise<ValidationRun[]> {
    const { data, error } = await supabase
      .from('validation_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw new Error(`Failed to get validation runs: ${error.message}`)
    return data || []
  }
  
  static async updateValidationRunProgress(
    runId: string, 
    updates: Partial<Pick<ValidationRun, 'completed_predictions' | 'current_accuracy' | 'confidence_interval' | 'statistical_significance' | 'status'>>
  ): Promise<void> {
    const { error } = await supabaseAdmin
      .from('validation_runs')
      .update(updates)
      .eq('id', runId)
    
    if (error) throw new Error(`Failed to update validation run: ${error.message}`)
  }
  
  // =============================================
  // METRICS OPERATIONS
  // =============================================
  
  static async getLatestSystemMetrics(): Promise<SystemMetrics | null> {
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*')
      .eq('metric_period', 'daily')
      .order('metric_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get latest system metrics: ${error.message}`)
    }
    return data
  }
  
  static async createSystemMetrics(metricsData: Omit<SystemMetrics, 'id' | 'created_at'>): Promise<SystemMetrics> {
    const { data, error } = await supabaseAdmin
      .from('system_metrics')
      .insert(metricsData)
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create system metrics: ${error.message}`)
    return data
  }
  
  static async getSystemMetricsHistory(days = 30): Promise<SystemMetrics[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const { data, error } = await supabase
      .from('system_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true })
    
    if (error) throw new Error(`Failed to get system metrics history: ${error.message}`)
    return data || []
  }
  
  // =============================================
  // UTILITY FUNCTIONS
  // =============================================
  
  static async calculateEngagementRate(videoId: string): Promise<number> {
    const { data, error } = await supabase
      .from('video_metrics')
      .select('views_count, likes_count, comments_count, shares_count')
      .eq('video_id', videoId)
      .order('metrics_date', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) return 0
    
    const { views_count, likes_count, comments_count, shares_count } = data
    if (!views_count || views_count === 0) return 0
    
    const totalEngagements = (likes_count || 0) + (comments_count || 0) + (shares_count || 0)
    return Number((totalEngagements / views_count).toFixed(4))
  }
  
  static async getVideoByExternalId(externalId: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('external_id', externalId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching video by external ID:', error)
      throw error
    }

    return data
  }

  static async getVideoByUrl(url: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('file_url', url)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching video by URL:', error)
      throw error
    }

    return data
  }

  static async getSystemHealthCheck(): Promise<{
    database_connected: boolean
    total_videos: number
    total_predictions: number
    recent_accuracy: number | null
    last_prediction: string | null
  }> {
    try {
      // Test database connection and get counts
      const [videosResult, predictionsResult, metricsResult, recentPredictionResult] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact', head: true }),
        supabase.from('viral_predictions').select('id', { count: 'exact', head: true }),
        this.getLatestSystemMetrics(),
        supabase.from('viral_predictions').select('created_at').order('created_at', { ascending: false }).limit(1).single()
      ])
      
      return {
        database_connected: true,
        total_videos: videosResult.count || 0,
        total_predictions: predictionsResult.count || 0,
        recent_accuracy: metricsResult?.overall_accuracy || null,
        last_prediction: recentPredictionResult.data?.created_at || null
      }
    } catch (error) {
      return {
        database_connected: false,
        total_videos: 0,
        total_predictions: 0,
        recent_accuracy: null,
        last_prediction: null
      }
    }
  }
}

// Export default instance
export default ViralPredictionDB