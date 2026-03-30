/**
 * FEAT-003: Pattern Database Service
 * 
 * Handles all database operations for pattern extraction system
 * - Query videos for analysis
 * - Save/update patterns
 * - Track jobs and errors
 * - Retrieve pattern statistics
 * 
 * @module pattern-extraction-database-service
 */

import { createClient } from '@supabase/supabase-js';
import type {
  ViralPattern,
  PatternVideoAssociation,
  PatternExtractionJob,
  PatternExtractionError,
  VideoForExtraction,
  ExtractedPattern,
  PatternType,
  PatternJobStatus,
  PatternSummary,
} from './types';

// =====================================================
// Supabase Client
// =====================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// =====================================================
// Video Query Functions
// =====================================================

/**
 * Query videos for pattern extraction based on criteria
 * 
 * @param niche - Content niche
 * @param minDpsScore - Minimum DPS score threshold
 * @param dateRangeDays - Number of days in the past to query
 * @param limit - Maximum number of videos to return
 * @returns Array of videos ready for extraction
 */
export async function queryVideosForExtraction(
  niche: string,
  minDpsScore: number,
  dateRangeDays: number,
  limit: number = 500
): Promise<VideoForExtraction[]> {
  const supabase = getSupabaseClient();

  // Calculate date threshold
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - dateRangeDays);

  // Query scraped_videos table with FFmpeg visual analysis (FEAT-001 Integration)
  // Note: scraped_videos doesn't have a niche column, so we query by DPS + date
  // and filter by niche using hashtags/description keywords
  const { data, error } = await supabase
    .from('scraped_videos')
    .select(`
      video_id,
      title,
      description,
      transcript_text,
      hashtags,
      creator_username,
      views_count,
      likes_count,
      comments_count,
      shares_count,
      dps_score,
      dps_percentile,
      dps_classification,
      platform,
      scraped_at,
      video_visual_analysis!left (
        duration_ms,
        resolution_width,
        resolution_height,
        fps,
        hook_scene_changes,
        quality_score
      )
    `)
    .gte('dps_score', minDpsScore)
    .gte('scraped_at', dateThreshold.toISOString())
    .not('dps_score', 'is', null)
    .not('transcript_text', 'is', null) // Only videos with transcripts
    .order('dps_score', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to query videos: ${error.message}`);
  }

  console.log(`[Pattern DB] Found ${data?.length || 0} videos matching criteria (DPS >= ${minDpsScore}, niche: ${niche})`);

  // Transform to VideoForExtraction format (with FFmpeg visual intelligence)
  return (data || []).map(video => {
    const visualAnalysis = Array.isArray(video.video_visual_analysis)
      ? video.video_visual_analysis[0]
      : video.video_visual_analysis;

    return {
      videoId: video.video_id,
      title: video.title,
      description: video.description || video.transcript?.substring(0, 200), // Use transcript if no description
      hashtags: video.hashtags,
      creatorUsername: video.creator_username,
      viewsCount: video.views_count || 0,
      likesCount: video.likes_count,
      commentsCount: video.comments_count,
      sharesCount: video.shares_count,
      dpsScore: video.dps_score!,
      dpsPercentile: video.dps_percentile!,
      dpsClassification: video.dps_classification!,
      platform: video.platform,
      // Include FFmpeg visual intelligence if available
      visualData: visualAnalysis ? {
        durationMs: visualAnalysis.duration_ms,
        resolution: visualAnalysis.resolution_width && visualAnalysis.resolution_height
          ? `${visualAnalysis.resolution_width}x${visualAnalysis.resolution_height}`
          : undefined,
        fps: visualAnalysis.fps,
        hookSceneChanges: visualAnalysis.hook_scene_changes,
        qualityScore: visualAnalysis.quality_score,
      } : undefined,
    };
  });
}

// =====================================================
// Pattern CRUD Operations
// =====================================================

/**
 * Find existing pattern by niche, type, and description
 */
export async function findExistingPattern(
  niche: string,
  patternType: PatternType,
  description: string
): Promise<ViralPattern | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('viral_patterns')
    .select('*')
    .eq('niche', niche)
    .eq('pattern_type', patternType)
    .eq('pattern_description', description)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw new Error(`Failed to find pattern: ${error.message}`);
  }

  return transformPatternFromDB(data);
}

/**
 * Find similar patterns using database function
 */
export async function findSimilarPatterns(
  niche: string,
  patternType: PatternType,
  description: string,
  threshold: number = 0.7
): Promise<ViralPattern[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('find_similar_patterns', {
    p_niche: niche,
    p_pattern_type: patternType,
    p_description: description,
    p_similarity_threshold: threshold,
  });

  if (error) {
    console.error('Error finding similar patterns:', error);
    return [];
  }

  // Fetch full pattern records
  if (!data || data.length === 0) {
    return [];
  }

  const patternIds = data.map((d: any) => d.pattern_id);
  const { data: patterns, error: patternsError } = await supabase
    .from('viral_patterns')
    .select('*')
    .in('id', patternIds);

  if (patternsError) {
    throw new Error(`Failed to fetch patterns: ${patternsError.message}`);
  }

  return (patterns || []).map(transformPatternFromDB);
}

/**
 * Create new pattern
 */
export async function createPattern(
  niche: string,
  patternType: PatternType,
  description: string,
  details?: Record<string, any>
): Promise<ViralPattern> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('viral_patterns')
    .insert({
      niche,
      pattern_type: patternType,
      pattern_description: description,
      pattern_details: details || {},
      frequency_count: 1,
      total_videos_analyzed: 0,
      viral_videos_count: 0,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create pattern: ${error.message}`);
  }

  return transformPatternFromDB(data);
}

/**
 * Update pattern frequency
 */
export async function incrementPatternFrequency(patternId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('viral_patterns')
    .update({
      frequency_count: supabase.rpc('increment', { x: 1 }) as any,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', patternId);

  if (error) {
    throw new Error(`Failed to update pattern frequency: ${error.message}`);
  }
}

/**
 * Update pattern statistics using database function
 */
export async function updatePatternStatistics(patternId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.rpc('update_pattern_statistics', {
    p_pattern_id: patternId,
  });

  if (error) {
    throw new Error(`Failed to update pattern statistics: ${error.message}`);
  }
}

// =====================================================
// Pattern-Video Association Operations
// =====================================================

/**
 * Create association between pattern and video
 */
export async function associatePatternWithVideo(
  patternId: string,
  videoId: string,
  confidenceScore: number,
  batchId: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('pattern_video_associations')
    .insert({
      pattern_id: patternId,
      video_id: videoId,
      confidence_score: confidenceScore,
      extraction_batch_id: batchId,
      extracted_at: new Date().toISOString(),
    });

  if (error) {
    // Ignore unique constraint violations (pattern already associated)
    if (error.code !== '23505') {
      throw new Error(`Failed to associate pattern with video: ${error.message}`);
    }
  }
}

/**
 * Get all patterns for a video
 */
export async function getPatternsForVideo(videoId: string): Promise<ViralPattern[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pattern_video_associations')
    .select('pattern_id, viral_patterns(*)')
    .eq('video_id', videoId);

  if (error) {
    throw new Error(`Failed to get patterns for video: ${error.message}`);
  }

  return (data || [])
    .filter(d => d.viral_patterns)
    .map(d => transformPatternFromDB(d.viral_patterns));
}

// =====================================================
// Job Management Operations
// =====================================================

/**
 * Create pattern extraction job
 */
export async function createExtractionJob(
  batchId: string,
  niche: string,
  minDpsScore: number,
  dateRangeDays: number
): Promise<PatternExtractionJob> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pattern_extraction_jobs')
    .insert({
      batch_id: batchId,
      niche,
      min_dps_score: minDpsScore,
      date_range_days: dateRangeDays,
      status: 'pending',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create extraction job: ${error.message}`);
  }

  return transformJobFromDB(data);
}

/**
 * Update job status
 */
export async function updateJobStatus(
  batchId: string,
  status: PatternJobStatus,
  updates?: Partial<{
    totalVideosQueried: number;
    videosProcessed: number;
    patternsExtracted: number;
    patternsUpdated: number;
    errorsCount: number;
    processingTimeMs: number;
    llmCallsCount: number;
    llmTokensUsed: number;
    llmCostUsd: number;
    errorMessage: string;
    errorStack: string;
  }>
): Promise<void> {
  const supabase = getSupabaseClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'processing' && !updates) {
    updateData.started_at = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (updates) {
    if (updates.totalVideosQueried !== undefined) updateData.total_videos_queried = updates.totalVideosQueried;
    if (updates.videosProcessed !== undefined) updateData.videos_processed = updates.videosProcessed;
    if (updates.patternsExtracted !== undefined) updateData.patterns_extracted = updates.patternsExtracted;
    if (updates.patternsUpdated !== undefined) updateData.patterns_updated = updates.patternsUpdated;
    if (updates.errorsCount !== undefined) updateData.errors_count = updates.errorsCount;
    if (updates.processingTimeMs !== undefined) updateData.processing_time_ms = updates.processingTimeMs;
    if (updates.llmCallsCount !== undefined) updateData.llm_calls_count = updates.llmCallsCount;
    if (updates.llmTokensUsed !== undefined) updateData.llm_tokens_used = updates.llmTokensUsed;
    if (updates.llmCostUsd !== undefined) updateData.llm_cost_usd = updates.llmCostUsd;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates.errorStack !== undefined) updateData.error_stack = updates.errorStack;
  }

  const { error } = await supabase
    .from('pattern_extraction_jobs')
    .update(updateData)
    .eq('batch_id', batchId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }
}

/**
 * Get job by batch ID
 */
export async function getJobByBatchId(batchId: string): Promise<PatternExtractionJob | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pattern_extraction_jobs')
    .select('*')
    .eq('batch_id', batchId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get job: ${error.message}`);
  }

  return transformJobFromDB(data);
}

// =====================================================
// Error Logging Operations
// =====================================================

/**
 * Log pattern extraction error
 */
export async function logExtractionError(
  batchId: string,
  videoId: string,
  errorCode: string,
  errorMessage: string,
  videoData?: Record<string, any>,
  llmResponse?: string,
  errorStack?: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('pattern_extraction_errors')
    .insert({
      batch_id: batchId,
      video_id: videoId,
      error_code: errorCode,
      error_message: errorMessage,
      video_data: videoData || null,
      llm_response: llmResponse || null,
      error_stack: errorStack || null,
      failed_at: new Date().toISOString(),
      retry_count: 0,
    });

  if (error) {
    console.error('Failed to log extraction error:', error);
    // Don't throw - error logging shouldn't break the main flow
  }
}

// =====================================================
// Pattern Retrieval Operations
// =====================================================

/**
 * Get top patterns for a niche
 */
export async function getTopPatternsByNiche(
  niche: string,
  patternType?: PatternType,
  limit: number = 10
): Promise<PatternSummary[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc('get_top_patterns_by_niche', {
    p_niche: niche,
    p_pattern_type: patternType || null,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to get top patterns: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    type: row.pattern_type,
    description: row.pattern_description,
    frequency: row.frequency_count,
    avgDPSScore: parseFloat(row.avg_dps_score),
    successRate: parseFloat(row.success_rate),
    viralVideosCount: row.viral_videos,
    totalVideosAnalyzed: row.total_videos,
    lastSeenAt: row.last_seen_at,
  }));
}

// =====================================================
// Transform Functions
// =====================================================

/**
 * Transform database pattern to application format
 */
function transformPatternFromDB(dbPattern: any): ViralPattern {
  return {
    id: dbPattern.id,
    niche: dbPattern.niche,
    patternType: dbPattern.pattern_type,
    patternDescription: dbPattern.pattern_description,
    patternDetails: dbPattern.pattern_details,
    frequencyCount: dbPattern.frequency_count,
    avgDpsScore: dbPattern.avg_dps_score,
    successRate: dbPattern.success_rate,
    totalVideosAnalyzed: dbPattern.total_videos_analyzed,
    viralVideosCount: dbPattern.viral_videos_count,
    firstSeenAt: dbPattern.first_seen_at,
    lastSeenAt: dbPattern.last_seen_at,
    createdAt: dbPattern.created_at,
    updatedAt: dbPattern.updated_at,
    extractionVersion: dbPattern.extraction_version,
  };
}

/**
 * Transform database job to application format
 */
function transformJobFromDB(dbJob: any): PatternExtractionJob {
  return {
    id: dbJob.id,
    batchId: dbJob.batch_id,
    niche: dbJob.niche,
    minDpsScore: parseFloat(dbJob.min_dps_score),
    dateRangeDays: dbJob.date_range_days,
    status: dbJob.status,
    totalVideosQueried: dbJob.total_videos_queried,
    videosProcessed: dbJob.videos_processed,
    patternsExtracted: dbJob.patterns_extracted,
    patternsUpdated: dbJob.patterns_updated,
    errorsCount: dbJob.errors_count,
    processingTimeMs: dbJob.processing_time_ms,
    llmCallsCount: dbJob.llm_calls_count,
    llmTokensUsed: dbJob.llm_tokens_used,
    llmCostUsd: parseFloat(dbJob.llm_cost_usd || 0),
    startedAt: dbJob.started_at,
    completedAt: dbJob.completed_at,
    createdAt: dbJob.created_at,
    updatedAt: dbJob.updated_at,
    errorMessage: dbJob.error_message,
    errorStack: dbJob.error_stack,
  };
}

// =====================================================
// Exports
// =====================================================

export const PatternDatabaseService = {
  queryVideosForExtraction,
  findExistingPattern,
  findSimilarPatterns,
  createPattern,
  incrementPatternFrequency,
  updatePatternStatistics,
  associatePatternWithVideo,
  getPatternsForVideo,
  createExtractionJob,
  updateJobStatus,
  getJobByBatchId,
  logExtractionError,
  getTopPatternsByNiche,
};

export default PatternDatabaseService;

