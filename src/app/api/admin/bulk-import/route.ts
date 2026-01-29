/**
 * Bulk Import API for Apify Scrapes
 * 
 * POST /api/admin/bulk-import
 * - Accepts bulk video imports from Apify exports
 * - Calculates real DPS scores using actual engagement metrics
 * - Queues high performers for pattern extraction
 * 
 * GET /api/admin/bulk-import
 * - Returns import statistics by niche and classification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

// Apify TikTok scraper output format (handles multiple field naming conventions)
interface ApifyVideoData {
  id?: string;
  video_id?: string;
  webVideoUrl?: string;
  videoUrl?: string;
  url?: string;
  desc?: string;
  description?: string;
  caption?: string;
  text?: string;
  author?: {
    uniqueId?: string;
    nickname?: string;
    id?: string;
    followerCount?: number;
    followingCount?: number;
  };
  authorMeta?: {
    name?: string;
    nickName?: string;
    id?: string;
    fans?: number;
    following?: number;
    verified?: boolean;
  };
  stats?: {
    playCount?: number;
    diggCount?: number;
    shareCount?: number;
    commentCount?: number;
    collectCount?: number;
  };
  playCount?: number;
  diggCount?: number;
  shareCount?: number;
  commentCount?: number;
  collectCount?: number;
  videoMeta?: {
    duration?: number;
    coverUrl?: string;
  };
  videoDuration?: number;
  duration?: number;
  covers?: {
    default?: string;
    origin?: string;
    dynamic?: string;
  };
  coverUrl?: string;
  createTime?: number;
  createTimeISO?: string;
  hashtags?: Array<{ name?: string; title?: string; id?: string }> | string[];
  mentions?: string[];
  music?: {
    title?: string;
    authorName?: string;
    id?: string;
  };
  musicMeta?: {
    musicName?: string;
    musicAuthor?: string;
    musicId?: string;
    musicOriginal?: boolean;
  };
  subtitles?: Array<{
    lang?: string;
    language?: string;
    text?: string;
  }>;
}

interface BulkImportRequest {
  videos: ApifyVideoData[];
  niche: string;
  source?: string;
  extractPatterns?: boolean;
}

interface DPSResult {
  dps: number;
  classification: string;
  breakdown: {
    likeRate: number;
    commentRate: number;
    shareRate: number;
    saveRate: number;
    viewRatio: number;
    viralMultiplier: number;
    engagementScore: number;
  };
}

/**
 * Calculate DPS (Dynamic Performance Score) from actual metrics
 * 
 * The DPS formula weights engagement types by their viral signal strength:
 * - Likes: 2x weight (basic engagement)
 * - Comments: 4x weight (high intent, drives algorithm)
 * - Shares: 6x weight (distribution/reach expansion)
 * - Saves: 5x weight (high value, rewatch intent)
 * 
 * Viral multiplier based on view-to-follower ratio
 */
function calculateDPS(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  saves: number,
  followerCount: number
): DPSResult {
  // Engagement rates as percentages
  const likeRate = views > 0 ? (likes / views) * 100 : 0;
  const commentRate = views > 0 ? (comments / views) * 100 : 0;
  const shareRate = views > 0 ? (shares / views) * 100 : 0;
  const saveRate = views > 0 ? (saves / views) * 100 : 0;
  
  // View-to-follower ratio (viral indicator)
  const viewRatio = followerCount > 0 ? views / followerCount : 1;
  
  // DPS Formula - weighted engagement score
  const engagementScore = (
    (likeRate * 2) +      // Likes weighted 2x
    (commentRate * 4) +   // Comments weighted 4x (high intent)
    (shareRate * 6) +     // Shares weighted 6x (distribution)
    (saveRate * 5)        // Saves weighted 5x (high value)
  );
  
  // Viral multiplier based on view ratio
  let viralMultiplier = 1.0;
  if (viewRatio > 10) viralMultiplier = 1.5;      // 10x followers = mega viral
  else if (viewRatio > 5) viralMultiplier = 1.3;  // 5x followers = viral
  else if (viewRatio > 2) viralMultiplier = 1.15; // 2x followers = good
  else if (viewRatio > 1) viralMultiplier = 1.0;  // 1x followers = average
  else viralMultiplier = 0.85;                     // Below followers = underperform
  
  // Base DPS calculation
  let dps = engagementScore * viralMultiplier;
  
  // Normalize to 0-100 scale
  // Typical engagement scores range from 0.5 (poor) to 15+ (viral)
  dps = Math.min(100, Math.max(0, dps * 5));
  
  // Classification tiers
  let classification: string;
  if (dps >= 90) classification = 'MEGA_VIRAL';
  else if (dps >= 75) classification = 'VIRAL';
  else if (dps >= 60) classification = 'GOOD';
  else if (dps >= 40) classification = 'AVERAGE';
  else if (dps >= 20) classification = 'BELOW_AVERAGE';
  else classification = 'POOR';
  
  return {
    dps: Math.round(dps * 10) / 10,
    classification,
    breakdown: {
      likeRate: Math.round(likeRate * 100) / 100,
      commentRate: Math.round(commentRate * 100) / 100,
      shareRate: Math.round(shareRate * 100) / 100,
      saveRate: Math.round(saveRate * 100) / 100,
      viewRatio: Math.round(viewRatio * 100) / 100,
      viralMultiplier,
      engagementScore: Math.round(engagementScore * 100) / 100
    }
  };
}

/**
 * Extract transcript from subtitles array
 */
function extractTranscript(subtitles?: Array<{ lang?: string; language?: string; text?: string }>): string | null {
  if (!subtitles || !Array.isArray(subtitles) || subtitles.length === 0) {
    return null;
  }
  
  // Try to find English subtitles first
  const englishSub = subtitles.find(s => 
    (s.lang === 'en' || s.language === 'en' || s.lang === 'eng' || s.language === 'eng')
  );
  
  if (englishSub?.text) {
    return englishSub.text;
  }
  
  // Fall back to first available subtitle
  return subtitles[0]?.text || null;
}

/**
 * Normalize Apify video data to scraped_videos schema
 */
function normalizeApifyVideo(video: ApifyVideoData, niche: string, source: string): Record<string, unknown> {
  // Extract video ID (handle multiple field names)
  const videoId = video.id || video.video_id || 
    video.webVideoUrl?.split('/video/')[1]?.split('?')[0] ||
    video.url?.split('/video/')[1]?.split('?')[0] ||
    `apify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Extract author info (handle multiple schema versions)
  const authorData = video.author || video.authorMeta || {};
  const creatorUsername = (authorData as { uniqueId?: string; name?: string }).uniqueId || 
                          (authorData as { name?: string }).name || 'unknown';
  const creatorNickname = (authorData as { nickname?: string; nickName?: string }).nickname || 
                          (authorData as { nickName?: string }).nickName || creatorUsername;
  const creatorId = (authorData as { id?: string }).id || null;
  const followerCount = (authorData as { followerCount?: number; fans?: number }).followerCount || 
                        (authorData as { fans?: number }).fans || 0;
  const creatorVerified = (authorData as { verified?: boolean }).verified || false;
  
  // Extract stats (handle root level and nested stats object)
  const stats = video.stats || {};
  const views = stats.playCount || video.playCount || 0;
  const likes = stats.diggCount || video.diggCount || 0;
  const comments = stats.commentCount || video.commentCount || 0;
  const shares = stats.shareCount || video.shareCount || 0;
  const saves = stats.collectCount || video.collectCount || 0;
  
  // Extract metadata
  const duration = video.videoMeta?.duration || video.videoDuration || video.duration || null;
  const thumbnail = video.videoMeta?.coverUrl || video.coverUrl || 
    video.covers?.origin || video.covers?.default || null;
  
  // Extract hashtags (handle array of objects or strings)
  let hashtags: string[] = [];
  if (Array.isArray(video.hashtags)) {
    hashtags = video.hashtags.map(h => {
      if (typeof h === 'string') return h;
      return (h as { name?: string; title?: string }).name || 
             (h as { title?: string }).title || '';
    }).filter(Boolean);
  }
  
  // Extract music
  const musicData = video.music || video.musicMeta || {};
  const musicId = (musicData as { id?: string; musicId?: string }).id || 
                  (musicData as { musicId?: string }).musicId || null;
  const musicName = (musicData as { title?: string; musicName?: string }).title || 
                    (musicData as { musicName?: string }).musicName || null;
  const musicAuthor = (musicData as { authorName?: string; musicAuthor?: string }).authorName || 
                      (musicData as { musicAuthor?: string }).musicAuthor || null;
  const musicOriginal = (musicData as { musicOriginal?: boolean }).musicOriginal || false;
  
  // Build URL
  const url = video.webVideoUrl || video.videoUrl || video.url ||
    `https://www.tiktok.com/@${creatorUsername}/video/${videoId}`;
  
  // Extract caption/description
  const caption = video.desc || video.description || video.caption || video.text || '';
  
  // Calculate DPS
  const { dps, classification, breakdown } = calculateDPS(
    views, likes, comments, shares, saves, followerCount
  );
  
  // Parse creation time
  let createdAtUtc = null;
  let uploadTimestamp = null;
  if (video.createTimeISO) {
    createdAtUtc = video.createTimeISO;
    uploadTimestamp = video.createTimeISO;
  } else if (video.createTime) {
    const date = new Date(video.createTime * 1000);
    createdAtUtc = date.toISOString();
    uploadTimestamp = date.toISOString();
  }
  
  // Extract transcript from subtitles
  const transcriptText = extractTranscript(video.subtitles as Array<{ lang?: string; language?: string; text?: string }>);
  
  return {
    video_id: videoId,
    tiktok_id: videoId,
    url: url,
    platform: 'tiktok',
    title: caption.substring(0, 500) || null,
    description: caption,
    caption: caption,
    
    // Creator info
    creator_id: creatorId,
    creator_username: creatorUsername,
    creator_nickname: creatorNickname,
    creator_followers_count: followerCount,
    creator_followers: followerCount,
    creator_verified: creatorVerified,
    
    // Metrics
    views_count: views,
    likes_count: likes,
    comments_count: comments,
    shares_count: shares,
    saves_count: saves,
    
    // Video details
    duration_seconds: duration,
    video_url: video.videoUrl || video.webVideoUrl || null,
    thumbnail_url: thumbnail,
    
    // Content metadata
    hashtags: hashtags,
    mentions: video.mentions || [],
    
    // Music/Sound
    music_id: musicId,
    music_name: musicName,
    music_author: musicAuthor,
    music_is_original: musicOriginal,
    
    // Timestamps
    upload_timestamp: uploadTimestamp,
    created_at_utc: createdAtUtc,
    
    // Transcript
    subtitles: video.subtitles || null,
    transcript_text: transcriptText,
    
    // DPS scoring
    dps_score: dps,
    dps_classification: classification,
    dps_breakdown: breakdown,
    
    // Categorization
    niche: niche,
    source: source,
    
    // Raw data for debugging
    raw_scraping_data: video,
    
    // Processing flags
    needs_processing: true,
    processing_priority: dps >= 70 ? 5 : dps >= 50 ? 3 : 1,
    pattern_extraction_status: dps >= 70 ? 'pending' : 'not_required',
    
    // Import timestamp
    imported_at: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkImportRequest = await request.json();
    const { videos, niche, source = 'apify', extractPatterns = true } = body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { error: 'No videos provided' },
        { status: 400 }
      );
    }
    
    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }
    
    const results = {
      total: videos.length,
      imported: 0,
      skipped: 0,
      errors: 0,
      byClassification: {
        MEGA_VIRAL: 0,
        VIRAL: 0,
        GOOD: 0,
        AVERAGE: 0,
        BELOW_AVERAGE: 0,
        POOR: 0
      } as Record<string, number>,
      patternExtractionQueued: 0,
      errorDetails: [] as string[]
    };
    
    // Process videos in batches
    const batchSize = 50;
    const normalizedVideos: Record<string, unknown>[] = [];
    
    for (const video of videos) {
      try {
        const normalized = normalizeApifyVideo(video, niche, source);
        normalizedVideos.push(normalized);
        
        const classification = normalized.dps_classification as string;
        if (results.byClassification[classification] !== undefined) {
          results.byClassification[classification]++;
        }
        
        if (normalized.pattern_extraction_status === 'pending') {
          results.patternExtractionQueued++;
        }
      } catch (error: unknown) {
        results.errors++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.errorDetails.push(`Failed to normalize video: ${message}`);
      }
    }
    
    // Insert in batches
    for (let i = 0; i < normalizedVideos.length; i += batchSize) {
      const batch = normalizedVideos.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('scraped_videos')
        .upsert(batch, {
          onConflict: 'video_id',
          ignoreDuplicates: false
        })
        .select('video_id');
      
      if (error) {
        console.error('Batch insert error:', error);
        results.errors += batch.length;
        results.errorDetails.push(`Batch insert failed: ${error.message}`);
      } else {
        results.imported += data?.length || 0;
        results.skipped += batch.length - (data?.length || 0);
      }
    }
    
    // If extractPatterns is true, trigger pattern extraction for high performers
    if (extractPatterns && results.patternExtractionQueued > 0) {
      // Queue pattern extraction (async - don't wait)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${appUrl}/api/admin/extract-genomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          niche,
          minDps: 70,
          limit: 100 
        })
      }).catch(err => console.error('Pattern extraction trigger failed:', err));
    }
    
    return NextResponse.json({
      success: true,
      results,
      message: `Imported ${results.imported} videos, ${results.patternExtractionQueued} queued for pattern extraction`
    });
    
  } catch (error: unknown) {
    console.error('Bulk import error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Bulk import failed', message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check import statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    
    // Build query for stats
    let query = supabase
      .from('scraped_videos')
      .select('dps_classification, pattern_extraction_status, niche, source');
    
    if (niche) {
      query = query.eq('niche', niche);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Aggregate stats
    const stats = {
      total: data?.length || 0,
      byClassification: {} as Record<string, number>,
      byNiche: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      patternExtraction: {
        pending: 0,
        completed: 0,
        failed: 0,
        not_required: 0
      } as Record<string, number>
    };
    
    data?.forEach(row => {
      // By classification
      const classification = row.dps_classification || 'unknown';
      stats.byClassification[classification] = (stats.byClassification[classification] || 0) + 1;
      
      // By niche
      const rowNiche = row.niche || 'unknown';
      stats.byNiche[rowNiche] = (stats.byNiche[rowNiche] || 0) + 1;
      
      // By source
      const rowSource = row.source || 'unknown';
      stats.bySource[rowSource] = (stats.bySource[rowSource] || 0) + 1;
      
      // Pattern extraction status
      const status = row.pattern_extraction_status || 'not_required';
      stats.patternExtraction[status] = (stats.patternExtraction[status] || 0) + 1;
    });
    
    return NextResponse.json({ stats });
    
  } catch (error: unknown) {
    console.error('Stats error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



