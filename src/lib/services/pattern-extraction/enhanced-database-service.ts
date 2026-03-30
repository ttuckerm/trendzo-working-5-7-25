/**
 * Enhanced Pattern Database Service (v2)
 * Stores and retrieves detailed per-video patterns
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import type {
  VideoPatternDetailed,
  ExtractedVideoPattern,
  VideoForDetailedExtraction,
} from './types-enhanced';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =====================================================
// Storage Operations
// =====================================================

/**
 * Store detailed pattern for a single video in viral_patterns.pattern_details
 */
export async function storeVideoPattern(
  pattern: ExtractedVideoPattern,
  video: VideoForDetailedExtraction,
  batchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Build pattern_details JSONB structure
    const patternDetails = {
      topic: pattern.topic,
      angle: pattern.angle,
      hook_spoken: pattern.hookSpoken,
      hook_text: pattern.hookText,
      hook_visual: pattern.hookVisual,
      story: pattern.storyStructure,
      visuals: pattern.visualFormat,
      key_elements: pattern.keyVisualElements,
      audio: pattern.audioDescription,
      
      // Metadata
      video_id: pattern.videoId,
      dps_score: video.dpsScore,
      dps_percentile: video.dpsPercentile,
      confidence: pattern.confidence,
      video_title: video.title,
      creator_username: video.creatorUsername,
      views_count: video.viewsCount,
      likes_count: video.likesCount,
      extracted_at: new Date().toISOString(),
      extraction_batch_id: batchId,
    };

    const { error } = await supabase
      .from('viral_patterns')
      .upsert({
        niche: video.niche,
        pattern_type: 'detailed_breakdown',
        pattern_description: `Video ${pattern.videoId}: ${pattern.topic}`,
        pattern_details: patternDetails,
        
        // Stats (single video, so count = 1)
        frequency_count: 1,
        avg_dps_score: video.dpsScore,
        total_videos_analyzed: 1,
        viral_videos_count: video.dpsPercentile >= 95 ? 1 : 0,
        success_rate: video.dpsPercentile >= 95 ? 1.0 : 0.0,
        
        extraction_version: 'v2_enhanced',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'niche,pattern_type,pattern_description',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`[Enhanced Pattern DB] Error storing pattern for video ${pattern.videoId}:`, error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Enhanced Pattern DB] Exception storing pattern:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch store multiple video patterns
 */
export async function storeVideoPatternsBatch(
  patterns: ExtractedVideoPattern[],
  videos: VideoForDetailedExtraction[],
  batchId: string
): Promise<{
  successCount: number;
  errorCount: number;
  errors: Array<{ videoId: string; error: string }>;
}> {
  const videoMap = new Map(videos.map(v => [v.videoId, v]));
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ videoId: string; error: string }> = [];

  console.log(`[Enhanced Pattern DB] Storing ${patterns.length} detailed patterns...`);

  for (const pattern of patterns) {
    const video = videoMap.get(pattern.videoId);
    
    if (!video) {
      console.error(`[Enhanced Pattern DB] No video data found for ${pattern.videoId}`);
      errorCount++;
      errors.push({ videoId: pattern.videoId, error: 'Video data not found' });
      continue;
    }

    const result = await storeVideoPattern(pattern, video, batchId);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      errors.push({ videoId: pattern.videoId, error: result.error || 'Unknown error' });
    }
  }

  console.log(`[Enhanced Pattern DB] Storage complete: ${successCount} success, ${errorCount} errors`);

  return { successCount, errorCount, errors };
}

// =====================================================
// Retrieval Operations
// =====================================================

/**
 * Get detailed patterns for videos with DPS above threshold
 */
export async function getTopVideoPatterns(
  niche: string,
  minDpsScore: number = 70,
  limit: number = 20
): Promise<VideoPatternDetailed[]> {
  try {
    const { data, error } = await supabase
      .from('viral_patterns')
      .select('*')
      .eq('niche', niche)
      .eq('pattern_type', 'detailed_breakdown')
      .gte('avg_dps_score', minDpsScore)
      .order('avg_dps_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Enhanced Pattern DB] Error fetching top patterns:', error);
      return [];
    }

    return (data || [])
      .filter(row => row.pattern_details && typeof row.pattern_details === 'object')
      .map(transformPatternFromDB);
  } catch (error) {
    console.error('[Enhanced Pattern DB] Exception fetching top patterns:', error);
    return [];
  }
}

/**
 * Get pattern for a specific video
 */
export async function getVideoPattern(
  videoId: string
): Promise<VideoPatternDetailed | null> {
  try {
    const { data, error } = await supabase
      .from('video_patterns_detailed')
      .select('*')
      .eq('video_id', videoId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is not an error
        return null;
      }
      console.error('[Enhanced Pattern DB] Error fetching video pattern:', error);
      return null;
    }

    return data ? transformPatternFromDB(data) : null;
  } catch (error) {
    console.error('[Enhanced Pattern DB] Exception fetching video pattern:', error);
    return null;
  }
}

/**
 * Query videos for enhanced extraction
 */
export async function queryVideosForDetailedExtraction(
  niche: string,
  minDpsScore: number,
  dateRangeDays: number,
  limit: number
): Promise<VideoForDetailedExtraction[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);

    console.log('\n' + '='.repeat(80));
    console.log('🔍 DEBUG: Query Parameters');
    console.log('='.repeat(80));
    console.log('Table:', 'scraped_videos');
    console.log('Niche (parameter):', JSON.stringify(niche));
    console.log('Min DPS Score:', minDpsScore);
    console.log('Cutoff Date:', cutoffDate.toISOString());
    console.log('Date Range Days:', dateRangeDays);
    console.log('Limit:', limit);
    console.log('='.repeat(80) + '\n');

    // Check total count of high-DPS videos
    const { count: totalCount } = await supabase
      .from('scraped_videos')
      .select('*', { count: 'exact', head: true })
      .gte('dps_score', minDpsScore);
    
    console.log(`Total videos with dps_score >= ${minDpsScore}:`, totalCount);
    console.log('NOTE: scraped_videos table does NOT have a niche column - not filtering by niche');
    console.log('');

    // Query scraped_videos directly (dps metrics stored in same table)
    // NOTE: scraped_videos does NOT have a 'niche' column, so we don't filter by it
    const { data, error, count } = await supabase
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
        platform,
        scraped_at,
        dps_score,
        dps_percentile
      `, { count: 'exact' })
      .gte('scraped_at', cutoffDate.toISOString())
      .gte('dps_score', minDpsScore)
      .not('transcript_text', 'is', null)  // Must have transcript for detailed extraction
      .order('dps_score', { ascending: false })
      .limit(limit);

    console.log('🔍 DEBUG: Query Results');
    console.log('='.repeat(80));
    console.log('Error:', error);
    console.log('Count (exact):', count);
    console.log('Data rows returned:', data?.length || 0);
    console.log('='.repeat(80) + '\n');

    if (error) {
      console.error('[Enhanced Pattern DB] Error querying videos:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('❌ No videos found matching criteria');
      console.log('');
      console.log('Filter breakdown:');
      
      // Check each filter individually
      const { count: dpsCount } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('dps_score', minDpsScore);
      console.log(`  - Videos with dps_score >= ${minDpsScore}: ${dpsCount}`);
      
      const { count: dateCount } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('scraped_at', cutoffDate.toISOString());
      console.log(`  - Videos with scraped_at >= ${cutoffDate.toISOString()}: ${dateCount}`);
      
      const { count: transcriptCount } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .not('transcript_text', 'is', null);
      console.log(`  - Videos with transcript_text: ${transcriptCount}`);
      
      const { count: combinedCount } = await supabase
        .from('scraped_videos')
        .select('*', { count: 'exact', head: true })
        .gte('dps_score', minDpsScore)
        .gte('scraped_at', cutoffDate.toISOString())
        .not('transcript_text', 'is', null);
      console.log(`  - Videos matching ALL criteria: ${combinedCount}`);
      console.log('');
      
      return [];
    }

    // Show sample of what we found
    console.log('✅ Sample video data (first 2):');
    data.slice(0, 2).forEach((v, i) => {
      console.log(`  [${i + 1}] Video ID: ${v.video_id}`);
      console.log(`      DPS: ${v.dps_score}`);
      console.log(`      Percentile: ${v.dps_percentile}`);
      console.log(`      Scraped: ${v.scraped_at}`);
      console.log(`      Has transcript_text: ${!!v.transcript_text} (${v.transcript_text?.length || 0} chars)`);
      console.log('');
    });

    // Transform to VideoForDetailedExtraction
    const videos: VideoForDetailedExtraction[] = data.map(v => ({
      videoId: v.video_id,
      title: v.title,
      description: v.description,
      transcript: v.transcript,
      hashtags: v.hashtags,
      creatorUsername: v.creator_username,
      viewsCount: v.views_count,
      likesCount: v.likes_count,
      dpsScore: v.dps_score || 0,
      dpsPercentile: v.dps_percentile || 0,
      platform: v.platform,
      niche: niche, // Keep niche from parameter, even though scraped_videos doesn't have this column
    }));

    console.log(`✅ [Enhanced Pattern DB] Found ${videos.length} videos for detailed extraction (DPS >= ${minDpsScore}, niche: ${niche})`);
    console.log('');
    
    return videos;
  } catch (error) {
    console.error('[Enhanced Pattern DB] Exception querying videos:', error);
    return [];
  }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Transform database row to TypeScript type (from pattern_details JSONB)
 */
function transformPatternFromDB(row: any): VideoPatternDetailed {
  const details = row.pattern_details || {};
  
  return {
    id: row.id,
    videoId: details.video_id || '',
    niche: row.niche,
    platform: 'tiktok', // Default, could be in details if needed
    
    dpsScore: details.dps_score || row.avg_dps_score || null,
    dpsPercentile: details.dps_percentile || null,
    
    topic: details.topic || '',
    angle: details.angle || '',
    hookSpoken: details.hook_spoken || '',
    hookText: details.hook_text || '',
    hookVisual: details.hook_visual || '',
    storyStructure: details.story || '',
    visualFormat: details.visuals || '',
    keyVisualElements: details.key_elements || [],
    audioDescription: details.audio || '',
    
    extractionConfidence: details.confidence || null,
    extractedAt: details.extracted_at || row.created_at,
    extractionBatchId: details.extraction_batch_id || null,
    extractionVersion: row.extraction_version || 'v2',
    
    videoTitle: details.video_title || null,
    creatorUsername: details.creator_username || null,
    viewsCount: details.views_count || null,
    likesCount: details.likes_count || null,
    
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

