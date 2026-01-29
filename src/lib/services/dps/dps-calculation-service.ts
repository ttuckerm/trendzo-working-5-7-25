/**
 * FEAT-002: DPS Calculation Service
 * 
 * High-level orchestration service that coordinates:
 * - Video input validation
 * - Cohort statistics retrieval
 * - DPS calculation
 * - Result persistence
 * - Error handling and logging
 * 
 * @module dps-calculation-service
 */

import {
  VideoInput,
  DPSResult,
  BatchDPSResult,
  calculateDPS,
  validateVideoInput,
  generateAuditId,
  calculateFFmpegVisualScore,
} from './dps-calculation-engine';

import {
  getCohortStats,
  getPlatformMedian,
  saveDPSCalculation,
  saveBatchCalculations,
  logCalculationError,
} from './dps-database-service';

import {
  emitCalculationCompleted,
  emitCalculationFailed,
  emitBatchCompleted,
} from './dps-event-emitter';

import { timestampPrediction } from './blockchain-timestamp';
import { supabaseClient } from '@/lib/supabase/client';

// =====================================================
// Error Codes
// =====================================================

export const DPS_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_COHORT: 'MISSING_COHORT',
  DB_ERROR: 'DB_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  BATCH_SIZE_EXCEEDED: 'BATCH_SIZE_EXCEEDED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const MAX_BATCH_SIZE = 100;

// =====================================================
// Helper Functions
// =====================================================

/**
 * Fetch FFmpeg visual analysis data from database (V2 Enhanced)
 * 
 * V2 includes comprehensive multimodal features:
 * - Scene changes (cuts per video)
 * - Motion score (activity level)
 * - Face detection and time ratio
 * - Audio analysis (music, volume)
 * - Speech rate
 *
 * @param videoId - Video identifier
 * @returns FFmpeg visual data or null if not available
 */
async function fetchFFmpegVisualData(videoId: string): Promise<{
  // Legacy fields
  resolution_width?: number;
  resolution_height?: number;
  fps?: number;
  bitrate?: number;
  hook_scene_changes?: number;
  quality_score?: number;
  // V2 fields for Virality Indicator
  scene_changes?: number;
  avg_brightness?: number;
  motion_score?: number;
  has_faces?: boolean;
  face_time_ratio?: number;
  has_music?: boolean;
  avg_volume?: number;
  speech_rate_wpm?: number;
  duration_seconds?: number;
} | null> {
  try {
    const { data, error } = await supabaseClient
      .from('video_visual_analysis')
      .select(`
        resolution_width, resolution_height, fps, bitrate, 
        hook_scene_changes, quality_score,
        scene_changes, avg_brightness, motion_score,
        has_faces, face_time_ratio, has_music, avg_volume,
        speech_rate_wpm, duration_seconds
      `)
      .eq('video_id', videoId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      // Legacy fields
      resolution_width: data.resolution_width || undefined,
      resolution_height: data.resolution_height || undefined,
      fps: data.fps || undefined,
      bitrate: data.bitrate || undefined,
      hook_scene_changes: data.hook_scene_changes || data.scene_changes || undefined,
      quality_score: data.quality_score || undefined,
      // V2 fields - scene_changes might be array (timestamps) or integer (count)
      scene_changes: Array.isArray(data.scene_changes) 
        ? data.scene_changes.length 
        : (data.scene_changes || undefined),
      avg_brightness: data.avg_brightness || undefined,
      motion_score: data.motion_score || undefined,
      has_faces: data.has_faces ?? undefined,
      face_time_ratio: data.face_time_ratio || undefined,
      has_music: data.has_music ?? undefined,
      avg_volume: data.avg_volume || undefined,
      speech_rate_wpm: data.speech_rate_wpm || undefined,
      duration_seconds: data.duration_seconds || undefined,
    };
  } catch (error) {
    console.warn(`[FFmpeg] Failed to fetch visual data for ${videoId}:`, error);
    return null;
  }
}

// =====================================================
// Core Service Functions
// =====================================================

/**
 * Calculate DPS for a single video
 * Handles the complete flow: validation → cohort lookup → calculation → persistence
 * 
 * @param videoData - Raw video input data
 * @param options - Optional configuration
 * @returns DPS calculation result
 * @throws Error if calculation fails
 */
export async function calculateSingleDPS(
  videoData: unknown,
  options?: { enableBlockchainTimestamp?: boolean; predictionMode?: 'reactive' | 'predictive' }
): Promise<DPSResult & { blockchainTx?: string }> {
  const auditId = generateAuditId();
  let video: VideoInput;
  
  try {
    // 1. Validate input
    video = validateVideoInput(videoData);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown validation error';
    await logCalculationError(
      'unknown',
      DPS_ERROR_CODES.INVALID_INPUT,
      errorMsg,
      videoData,
      auditId
    );
    throw new Error(`Invalid video input: ${errorMsg}`);
  }
  
  try {
    // 2. Get cohort statistics
    let cohortStats = await getCohortStats(video.platform, video.followerCount);

    // Fallback to platform-wide median if no cohort found
    if (!cohortStats) {
      console.warn(`No cohort found for ${video.platform} with ${video.followerCount} followers. Using platform median.`);
      cohortStats = await getPlatformMedian(video.platform);

      if (!cohortStats) {
        throw new Error(`No cohort data available for platform: ${video.platform}`);
      }
    }

    // 3. Fetch FFmpeg visual data and calculate score (Enhancement: FEAT-001 Integration)
    let ffmpegScore: number | undefined;
    try {
      const ffmpegData = await fetchFFmpegVisualData(video.videoId);
      if (ffmpegData) {
        ffmpegScore = calculateFFmpegVisualScore(ffmpegData);
        console.log(`[FFmpeg] Visual score for ${video.videoId}: ${ffmpegScore.toFixed(2)}/100`);
      }
    } catch (error) {
      console.warn(`[FFmpeg] Failed to calculate visual score for ${video.videoId}:`, error);
      // Continue without FFmpeg score - it's optional
    }

    // 4. Calculate DPS (with optional FFmpeg visual intelligence)
    const result = calculateDPS(video, cohortStats, ffmpegScore);

    // 5. Optional: Blockchain timestamp (Enhancement)
    let blockchainTx: string | undefined;
    if (options?.enableBlockchainTimestamp) {
      try {
        const timestampResult = await timestampPrediction({
          videoId: result.videoId,
          viralScore: result.viralScore,
          percentileRank: result.percentileRank,
          classification: result.classification,
          calculatedAt: result.calculatedAt,
          auditId: result.auditId,
        });
        blockchainTx = timestampResult.txHash;
      } catch (error) {
        console.error('Blockchain timestamp failed (non-critical):', error);
        // Don't fail the entire calculation if blockchain fails
      }
    }

    // 6. Save to database
    await saveDPSCalculation(result, video, undefined, blockchainTx, options?.predictionMode);

    // 7. Emit success event
    await emitCalculationCompleted(result);
    
    return {
      ...result,
      ...(blockchainTx && { blockchainTx }),
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown calculation error';
    const errorCode = errorMsg.includes('cohort') 
      ? DPS_ERROR_CODES.MISSING_COHORT 
      : DPS_ERROR_CODES.CALCULATION_ERROR;
    
    await logCalculationError(
      video.videoId,
      errorCode,
      errorMsg,
      video,
      auditId,
      undefined,
      error instanceof Error ? error.stack : undefined
    );
    
    // Emit failure event
    await emitCalculationFailed(video.videoId, errorCode, errorMsg, auditId);
    
    throw new Error(`DPS calculation failed: ${errorMsg}`);
  }
}

/**
 * Calculate DPS for multiple videos in batch
 * Processes videos in parallel with error isolation
 * 
 * @param videos - Array of video input data
 * @param batchId - Optional batch identifier
 * @returns Batch calculation result with successes and errors
 */
export async function calculateBatchDPS(
  videos: unknown[],
  batchId?: string
): Promise<BatchDPSResult> {
  const startTime = Date.now();
  const generatedBatchId = batchId || `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const auditId = generateAuditId();
  
  // Validate batch size
  if (videos.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size ${videos.length} exceeds maximum of ${MAX_BATCH_SIZE}`);
  }
  
  const results: DPSResult[] = [];
  const errors: Array<{ videoId: string; error: string }> = [];
  const validatedVideos: VideoInput[] = [];
  
  // Process each video
  for (const videoData of videos) {
    try {
      // Validate input
      const video = validateVideoInput(videoData);
      validatedVideos.push(video);
      
      // Get cohort statistics
      let cohortStats = await getCohortStats(video.platform, video.followerCount);

      if (!cohortStats) {
        cohortStats = await getPlatformMedian(video.platform);
        if (!cohortStats) {
          throw new Error(`No cohort data available for platform: ${video.platform}`);
        }
      }

      // Fetch FFmpeg visual data and calculate score (Enhancement: FEAT-001 Integration)
      let ffmpegScore: number | undefined;
      try {
        const ffmpegData = await fetchFFmpegVisualData(video.videoId);
        if (ffmpegData) {
          ffmpegScore = calculateFFmpegVisualScore(ffmpegData);
        }
      } catch (error) {
        // Silently continue without FFmpeg score - it's optional
      }

      // Calculate DPS (with optional FFmpeg visual intelligence)
      const result = calculateDPS(video, cohortStats, ffmpegScore);
      results.push(result);
      
      // Emit success event
      await emitCalculationCompleted(result, generatedBatchId);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      const videoId = typeof videoData === 'object' && videoData !== null && 'videoId' in videoData
        ? String(videoData.videoId)
        : 'unknown';
      
      errors.push({ videoId, error: errorMsg });
      
      // Log error to database
      await logCalculationError(
        videoId,
        DPS_ERROR_CODES.CALCULATION_ERROR,
        errorMsg,
        videoData,
        auditId,
        generatedBatchId,
        error instanceof Error ? error.stack : undefined
      );
      
      // Emit failure event
      await emitCalculationFailed(videoId, DPS_ERROR_CODES.CALCULATION_ERROR, errorMsg, auditId, generatedBatchId);
    }
  }
  
  // Save successful results to database in batch
  if (results.length > 0) {
    try {
      await saveBatchCalculations(results, validatedVideos, generatedBatchId);
    } catch (error) {
      console.error('Failed to save batch calculations:', error);
      // Don't throw - results are still valid even if save fails
    }
  }
  
  const processingTimeMs = Date.now() - startTime;
  
  const batchResult: BatchDPSResult = {
    batchId: generatedBatchId,
    totalVideos: videos.length,
    successCount: results.length,
    failureCount: errors.length,
    results,
    errors,
    auditId,
    processingTimeMs,
  };
  
  // Emit batch completed event
  await emitBatchCompleted(batchResult);
  
  return batchResult;
}

/**
 * Process videos from scraped_videos table
 * Queries unprocessed videos and calculates DPS scores
 * 
 * @param limit - Maximum number of videos to process
 * @returns Batch calculation result
 */
export async function processScrapedVideos(limit: number = 100): Promise<BatchDPSResult> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Fetch unprocessed videos from scraped_videos table
  const { data: scrapedVideos, error } = await supabase
    .from('scraped_videos')
    .select('*')
    .eq('needs_processing', true)
    .order('processing_priority', { ascending: false })
    .order('scraped_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    throw new Error(`Failed to fetch scraped videos: ${error.message}`);
  }
  
  if (!scrapedVideos || scrapedVideos.length === 0) {
    return {
      batchId: `batch_empty_${Date.now()}`,
      totalVideos: 0,
      successCount: 0,
      failureCount: 0,
      results: [],
      errors: [],
      auditId: generateAuditId(),
      processingTimeMs: 0,
    };
  }
  
  // Transform scraped_videos to VideoInput format
  const videoInputs: unknown[] = scrapedVideos.map(video => ({
    videoId: video.video_id,
    platform: video.platform,
    viewCount: video.views_count || 0,
    likeCount: video.likes_count || undefined,
    commentCount: video.comments_count || undefined,
    shareCount: video.shares_count || undefined,
    followerCount: video.creator_followers_count || 0,
    hoursSinceUpload: video.upload_timestamp 
      ? (Date.now() - new Date(video.upload_timestamp).getTime()) / (1000 * 60 * 60)
      : 24, // Default to 24 hours if unknown
    publishedAt: video.upload_timestamp || new Date().toISOString(),
  }));
  
  // Calculate DPS for batch
  const result = await calculateBatchDPS(videoInputs);
  
  // Update scraped_videos table to mark as processed
  const processedVideoIds = result.results.map(r => r.videoId);
  if (processedVideoIds.length > 0) {
    await supabase
      .from('scraped_videos')
      .update({ needs_processing: false })
      .in('video_id', processedVideoIds);
  }
  
  return result;
}

/**
 * Recalculate DPS for a video (e.g., after cohort stats update)
 * 
 * @param videoId - Video identifier
 * @returns Updated DPS result
 */
export async function recalculateDPS(videoId: string): Promise<DPSResult> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  // Fetch original calculation
  const { data: calculation, error } = await supabase
    .from('dps_calculations')
    .select('*')
    .eq('video_id', videoId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !calculation) {
    throw new Error(`Video calculation not found: ${videoId}`);
  }
  
  // Reconstruct video input
  const videoInput: VideoInput = {
    videoId: calculation.video_id,
    platform: calculation.platform as any,
    viewCount: calculation.view_count,
    likeCount: calculation.like_count || undefined,
    commentCount: calculation.comment_count || undefined,
    shareCount: calculation.share_count || undefined,
    followerCount: calculation.follower_count,
    hoursSinceUpload: calculation.hours_since_upload,
    publishedAt: calculation.published_at,
  };
  
  // Recalculate
  return calculateSingleDPS(videoInput);
}

// =====================================================
// Exports
// =====================================================

export const DPSCalculationService = {
  calculateSingleDPS,
  calculateBatchDPS,
  processScrapedVideos,
  recalculateDPS,
};

export default DPSCalculationService;

