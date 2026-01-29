/**
 * FEAT-002: DPS Database Service
 * 
 * Handles all database operations for DPS calculations:
 * - Storing calculation results
 * - Retrieving cohort statistics
 * - Logging errors
 * - Managing batch operations
 * 
 * @module dps-database-service
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  DPSResult, 
  CohortStats, 
  VideoInput, 
  BatchDPSResult,
  getCohortBounds 
} from './dps-calculation-engine';

// =====================================================
// Type Definitions
// =====================================================

export interface DPSCalculationRow {
  id?: string;
  video_id: string;
  platform: string;
  viral_score: number;
  percentile_rank: number;
  classification: string;
  z_score: number;
  decay_factor: number;
  platform_weight: number;
  cohort_median: number;
  confidence: number;
  view_count: number;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  follower_count: number;
  hours_since_upload: number;
  published_at: string;
  batch_id: string | null;
  calculated_at?: string;
  audit_id: string;
  processing_time_ms: number | null;
  // FEAT-002 Enhancements
  identity_container_score: number | null;
  blockchain_tx: string | null;
  prediction_mode: 'reactive' | 'predictive';
}

export interface DPSErrorRow {
  id?: string;
  video_id: string;
  batch_id: string | null;
  error_code: string;
  error_message: string;
  error_stack: string | null;
  input_data: any;
  failed_at?: string;
  audit_id: string;
  retry_count: number;
}

export interface CohortStatsRow {
  id?: string;
  platform: string;
  follower_min: number;
  follower_max: number;
  cohort_median: number;
  cohort_mean: number;
  cohort_stddev: number;
  sample_size: number;
  last_updated?: string;
  calculation_version?: string;
}

// =====================================================
// Supabase Client Initialization
// =====================================================

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// =====================================================
// Core Database Operations
// =====================================================

/**
 * Save DPS calculation result to database
 */
export async function saveDPSCalculation(
  result: DPSResult,
  video: VideoInput,
  batchId?: string,
  blockchainTx?: string,
  predictionMode: 'reactive' | 'predictive' = 'reactive'
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const row: DPSCalculationRow = {
    video_id: result.videoId,
    platform: video.platform,
    viral_score: result.viralScore,
    percentile_rank: result.percentileRank,
    classification: result.classification,
    z_score: result.zScore,
    decay_factor: result.decayFactor,
    platform_weight: result.platformWeight,
    cohort_median: result.cohortMedian,
    confidence: result.confidence,
    view_count: video.viewCount,
    like_count: video.likeCount ?? null,
    comment_count: video.commentCount ?? null,
    share_count: video.shareCount ?? null,
    follower_count: video.followerCount,
    hours_since_upload: video.hoursSinceUpload,
    published_at: video.publishedAt,
    batch_id: batchId ?? null,
    audit_id: result.auditId,
    processing_time_ms: result.processingTimeMs ?? null,
    // FEAT-002 Enhancements
    identity_container_score: result.identityContainerScore ?? null,
    blockchain_tx: blockchainTx ?? null,
    prediction_mode: predictionMode,
  };
  
  const { error } = await supabase
    .from('dps_calculations')
    .insert(row);
  
  if (error) {
    throw new Error(`Failed to save DPS calculation: ${error.message}`);
  }
}

/**
 * Get cohort statistics for a given platform and follower count
 */
export async function getCohortStats(platform: string, followerCount: number): Promise<CohortStats | null> {
  const supabase = getSupabaseClient();
  
  const [followerMin, followerMax] = getCohortBounds(followerCount);
  
  const { data, error } = await supabase
    .from('dps_cohort_stats')
    .select('cohort_median, cohort_mean, cohort_stddev, sample_size')
    .eq('platform', platform)
    .lte('follower_min', followerMax)
    .gte('follower_max', followerMin)
    .order('sample_size', { ascending: false })
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Failed to get cohort stats: ${error.message}`);
  }
  
  if (!data) {
    return null;
  }
  
  return {
    cohortMedian: data.cohort_median,
    cohortMean: data.cohort_mean,
    cohortStdDev: data.cohort_stddev,
    sampleSize: data.sample_size,
  };
}

/**
 * Get platform-wide median as fallback when no cohort exists
 */
export async function getPlatformMedian(platform: string): Promise<CohortStats | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dps_cohort_stats')
    .select('cohort_median, cohort_mean, cohort_stddev, sample_size')
    .eq('platform', platform)
    .order('sample_size', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return {
    cohortMedian: data.cohort_median,
    cohortMean: data.cohort_mean,
    cohortStdDev: data.cohort_stddev,
    sampleSize: data.sample_size,
  };
}

/**
 * Log calculation error to database
 */
export async function logCalculationError(
  videoId: string,
  errorCode: string,
  errorMessage: string,
  inputData: any,
  auditId: string,
  batchId?: string,
  errorStack?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const row: DPSErrorRow = {
    video_id: videoId,
    batch_id: batchId ?? null,
    error_code: errorCode,
    error_message: errorMessage,
    error_stack: errorStack ?? null,
    input_data: inputData,
    audit_id: auditId,
    retry_count: 0,
  };
  
  const { error } = await supabase
    .from('dps_calculation_errors')
    .insert(row);
  
  if (error) {
    console.error('Failed to log calculation error:', error);
    // Don't throw - error logging is non-critical
  }
}

/**
 * Get recent calculation errors for monitoring
 */
export async function getRecentErrors(limit: number = 100): Promise<DPSErrorRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dps_calculation_errors')
    .select('*')
    .order('failed_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to get recent errors: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get calculation history for a specific video
 */
export async function getVideoCalculationHistory(videoId: string): Promise<DPSCalculationRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .eq('video_id', videoId)
    .order('calculated_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get video calculation history: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get calculations by batch ID
 */
export async function getBatchCalculations(batchId: string): Promise<DPSCalculationRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .eq('batch_id', batchId)
    .order('calculated_at', { ascending: false });
  
  if (error) {
    throw new Error(`Failed to get batch calculations: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Update cohort statistics (admin operation)
 */
export async function updateCohortStats(stats: CohortStatsRow): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('dps_cohort_stats')
    .upsert(stats, {
      onConflict: 'platform,follower_min,follower_max',
    });
  
  if (error) {
    throw new Error(`Failed to update cohort stats: ${error.message}`);
  }
}

/**
 * Get all cohort statistics for a platform
 */
export async function getAllCohortStats(platform: string): Promise<CohortStatsRow[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('dps_cohort_stats')
    .select('*')
    .eq('platform', platform)
    .order('follower_min', { ascending: true });
  
  if (error) {
    throw new Error(`Failed to get cohort stats: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Get DPS calculation statistics (for monitoring)
 */
export async function getCalculationStats(timeWindow: '24h' | '7d' | '30d' = '24h'): Promise<{
  totalCalculations: number;
  successRate: number;
  avgProcessingTime: number;
  avgConfidence: number;
  viralityDistribution: Record<string, number>;
}> {
  const supabase = getSupabaseClient();
  
  // Calculate time threshold
  const now = new Date();
  const hoursBack = timeWindow === '24h' ? 24 : timeWindow === '7d' ? 168 : 720;
  const threshold = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);
  
  // Get calculations
  const { data: calculations, error: calcError } = await supabase
    .from('dps_calculations')
    .select('processing_time_ms, confidence, classification')
    .gte('calculated_at', threshold.toISOString());
  
  if (calcError) {
    throw new Error(`Failed to get calculation stats: ${calcError.message}`);
  }
  
  // Get errors
  const { data: errors, error: errorError } = await supabase
    .from('dps_calculation_errors')
    .select('id')
    .gte('failed_at', threshold.toISOString());
  
  if (errorError) {
    throw new Error(`Failed to get error stats: ${errorError.message}`);
  }
  
  const totalCalculations = (calculations?.length || 0) + (errors?.length || 0);
  const successRate = totalCalculations > 0 ? (calculations?.length || 0) / totalCalculations : 0;
  
  const avgProcessingTime = calculations?.length 
    ? calculations.reduce((sum, c) => sum + (c.processing_time_ms || 0), 0) / calculations.length
    : 0;
  
  const avgConfidence = calculations?.length
    ? calculations.reduce((sum, c) => sum + c.confidence, 0) / calculations.length
    : 0;
  
  const viralityDistribution: Record<string, number> = {
    normal: 0,
    viral: 0,
    'mega-viral': 0,
  };
  
  calculations?.forEach(c => {
    viralityDistribution[c.classification] = (viralityDistribution[c.classification] || 0) + 1;
  });
  
  return {
    totalCalculations,
    successRate,
    avgProcessingTime,
    avgConfidence,
    viralityDistribution,
  };
}

// =====================================================
// Batch Operations
// =====================================================

/**
 * Save multiple DPS calculations in a batch
 */
export async function saveBatchCalculations(
  results: DPSResult[],
  videos: VideoInput[],
  batchId: string,
  predictionMode: 'reactive' | 'predictive' = 'reactive'
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const rows: DPSCalculationRow[] = results.map((result, index) => {
    const video = videos[index];
    return {
      video_id: result.videoId,
      platform: video.platform,
      viral_score: result.viralScore,
      percentile_rank: result.percentileRank,
      classification: result.classification,
      z_score: result.zScore,
      decay_factor: result.decayFactor,
      platform_weight: result.platformWeight,
      cohort_median: result.cohortMedian,
      confidence: result.confidence,
      view_count: video.viewCount,
      like_count: video.likeCount ?? null,
      comment_count: video.commentCount ?? null,
      share_count: video.shareCount ?? null,
      follower_count: video.followerCount,
      hours_since_upload: video.hoursSinceUpload,
      published_at: video.publishedAt,
      batch_id: batchId,
      audit_id: result.auditId,
      processing_time_ms: result.processingTimeMs ?? null,
      // FEAT-002 Enhancements
      identity_container_score: result.identityContainerScore ?? null,
      blockchain_tx: null, // Batch operations don't include blockchain by default
      prediction_mode: predictionMode,
    };
  });
  
  // Insert in chunks of 100 to avoid payload size limits
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('dps_calculations')
      .insert(chunk);
    
    if (error) {
      throw new Error(`Failed to save batch calculations (chunk ${i / chunkSize + 1}): ${error.message}`);
    }
  }
}

// =====================================================
// Exports
// =====================================================

export const DPSDatabaseService = {
  saveDPSCalculation,
  getCohortStats,
  getPlatformMedian,
  logCalculationError,
  getRecentErrors,
  getVideoCalculationHistory,
  getBatchCalculations,
  updateCohortStats,
  getAllCohortStats,
  getCalculationStats,
  saveBatchCalculations,
};

export default DPSDatabaseService;

