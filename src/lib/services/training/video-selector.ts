/**
 * Video Selection Service
 * 
 * Selects videos from scraped_videos that are ready for training data preparation.
 * Handles filtering, pagination, and tracking of processing state.
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface VideoSelectionCriteria {
  minViews?: number;
  minLikes?: number;
  requireTranscript?: boolean;
  requireDPS?: boolean;
  performanceTiers?: string[];
  excludeAlreadyProcessed?: boolean;
  requireCompleteStatus?: boolean;  // NEW: Only include videos with processing_status = 'complete'
  limit?: number;
  offset?: number;
  source?: string;
}

export interface SelectedVideo {
  video_id: string;
  url: string;
  title: string;
  caption: string;
  transcript_text: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  duration_seconds: number;
  creator_followers_count: number;
  dps_score: number;
  dps_percentile: number;
  dps_classification: string;
  hashtags: string[];
  upload_timestamp: string;
  source: string;
  niche: string;
}

export interface VideoSelectionStats {
  total: number;
  withTranscript: number;
  withDPS: number;
  byClassification: Record<string, number>;
  bySource: Record<string, number>;
  alreadyProcessed: number;
  readyForProcessing: number;
  // NEW: Validation gate status counts
  completeVideos: number;      // Videos with processing_status = 'complete'
  incompleteVideos: number;    // Videos with processing_status = 'incomplete'
  validationFailed: number;    // Videos with processing_status = 'validation_failed'
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY!
  );
}

// ============================================================================
// VIDEO SELECTION
// ============================================================================

/**
 * Select videos from scraped_videos that meet the criteria for training
 */
export async function selectVideosForTraining(
  criteria: VideoSelectionCriteria = {}
): Promise<SelectedVideo[]> {
  const supabase = getSupabase();

  // Build base query
  let query = supabase
    .from('scraped_videos')
    .select(`
      video_id,
      url,
      title,
      caption,
      transcript_text,
      views_count,
      likes_count,
      comments_count,
      shares_count,
      saves_count,
      duration_seconds,
      creator_followers_count,
      dps_score,
      dps_percentile,
      dps_classification,
      hashtags,
      upload_timestamp,
      source,
      niche
    `);

  // Apply filters
  if (criteria.requireDPS !== false) {
    query = query.not('dps_score', 'is', null);
  }

  if (criteria.requireTranscript) {
    query = query.not('transcript_text', 'is', null);
  }

  if (criteria.minViews) {
    query = query.gte('views_count', criteria.minViews);
  }

  if (criteria.minLikes) {
    query = query.gte('likes_count', criteria.minLikes);
  }

  if (criteria.performanceTiers && criteria.performanceTiers.length > 0) {
    query = query.in('dps_classification', criteria.performanceTiers);
  }

  if (criteria.source) {
    query = query.eq('source', criteria.source);
  }

  // Order by scraped date
  query = query.order('scraped_at', { ascending: false });

  // Pagination
  if (criteria.limit) {
    const from = criteria.offset || 0;
    const to = from + criteria.limit - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error selecting videos:', error);
    throw error;
  }

  let videos = data || [];

  // Exclude videos already in training_features (Kai's output table)
  // BEFORE: Read from 'training_data' (old, disconnected)
  // AFTER:  Read from 'training_features' (Kai Orchestrator output)
  if (criteria.excludeAlreadyProcessed !== false && videos.length > 0) {
    const { data: existingIds } = await supabase
      .from('training_features')
      .select('video_id');

    if (existingIds && existingIds.length > 0) {
      const processedSet = new Set(existingIds.map(r => r.video_id));
      videos = videos.filter(v => !processedSet.has(v.video_id));
    }
  }

  // NEW: Filter by processing_status = 'complete' when required
  // This ensures only validated videos are used for training
  if (criteria.requireCompleteStatus && videos.length > 0) {
    const videoIds = videos.map(v => v.video_id);
    
    const { data: completeAnalysis } = await supabase
      .from('video_analysis')
      .select('video_id')
      .eq('processing_status', 'complete')
      .in('video_id', videoIds);

    if (completeAnalysis && completeAnalysis.length > 0) {
      const completeSet = new Set(completeAnalysis.map(r => r.video_id));
      videos = videos.filter(v => completeSet.has(v.video_id));
      console.log(`[Video Selector] Filtered to ${videos.length} videos with processing_status='complete'`);
    } else {
      console.warn('[Video Selector] No videos found with processing_status="complete"');
      videos = [];
    }
  }

  return videos;
}

/**
 * Get statistics about available videos for training
 * Now includes validation gate status counts
 */
export async function getVideoSelectionStats(): Promise<VideoSelectionStats> {
  const supabase = getSupabase();

  // Run all counts in parallel
  const [
    totalRes,
    transcriptRes,
    dpsRes,
    videosRes,
    processedRes,
    completeRes,
    incompleteRes,
    validationFailedRes
  ] = await Promise.all([
    // Total count
    supabase.from('scraped_videos').select('*', { count: 'exact', head: true }),
    
    // With transcript
    supabase.from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .not('transcript_text', 'is', null),
    
    // With DPS
    supabase.from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .not('dps_score', 'is', null),
    
    // All videos for classification/source breakdown
    supabase.from('scraped_videos')
      .select('dps_classification, source'),
    
    // Already processed (now reads from training_features - Kai's output)
    supabase.from('training_features').select('*', { count: 'exact', head: true }),
    
    // NEW: Videos with processing_status = 'complete' (passed all validation gates)
    supabase.from('video_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'complete'),
    
    // NEW: Videos with processing_status = 'incomplete' (failed validation gates)
    supabase.from('video_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'incomplete'),
    
    // NEW: Videos with processing_status = 'validation_failed'
    supabase.from('video_analysis')
      .select('*', { count: 'exact', head: true })
      .eq('processing_status', 'validation_failed')
  ]);

  // Count by classification
  const byClassification: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  
  if (videosRes.data) {
    videosRes.data.forEach(row => {
      // By classification
      const tier = row.dps_classification || 'unclassified';
      byClassification[tier] = (byClassification[tier] || 0) + 1;
      
      // By source
      const source = row.source || 'unknown';
      bySource[source] = (bySource[source] || 0) + 1;
    });
  }

  const total = totalRes.count || 0;
  const alreadyProcessed = processedRes.count || 0;

  return {
    total,
    withTranscript: transcriptRes.count || 0,
    withDPS: dpsRes.count || 0,
    byClassification,
    bySource,
    alreadyProcessed,
    readyForProcessing: total - alreadyProcessed,
    // NEW: Validation gate status counts
    completeVideos: completeRes.count || 0,
    incompleteVideos: incompleteRes.count || 0,
    validationFailed: validationFailedRes.count || 0
  };
}

/**
 * Get a single video by ID for processing
 */
export async function getVideoById(videoId: string): Promise<SelectedVideo | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('scraped_videos')
    .select(`
      video_id,
      url,
      title,
      caption,
      transcript_text,
      views_count,
      likes_count,
      comments_count,
      shares_count,
      saves_count,
      duration_seconds,
      creator_followers_count,
      dps_score,
      dps_percentile,
      dps_classification,
      hashtags,
      upload_timestamp,
      source,
      niche
    `)
    .eq('video_id', videoId)
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    return null;
  }

  return data;
}




