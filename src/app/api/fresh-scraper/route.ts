/**
 * Fresh Video Scraper API
 * 
 * Captures videos 5-15 minutes old with <1000 views for untainted prediction testing.
 * 
 * POST /api/fresh-scraper - Start a fresh scrape job
 * GET /api/fresh-scraper - Get fresh scrape jobs and videos
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeVideoImmediately } from '@/lib/services/immediate-video-analyzer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface FreshScrapeRequest {
  keywords: string[];
  niches?: string[];
  maxVideoAgeMinutes?: number;  // default: 15
  maxInitialViews?: number;     // default: 1000
  autoPredict?: boolean;        // default: true
  autoRefreshMinutes?: number;  // default: 5, 0 = one-time
}

/**
 * POST - Start a fresh video scraping job
 */
export async function POST(request: NextRequest) {
  try {
    const body: FreshScrapeRequest = await request.json();

    if (!body.keywords || body.keywords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one keyword is required' },
        { status: 400 }
      );
    }

    const maxVideoAgeMinutes = body.maxVideoAgeMinutes || 15;
    const maxInitialViews = body.maxInitialViews || 1000;
    const autoPredict = body.autoPredict !== false;
    const autoRefreshMinutes = body.autoRefreshMinutes || 5;

    // Create the scrape job
    const { data: job, error: jobError } = await supabase
      .from('fresh_scrape_jobs')
      .insert({
        keywords: body.keywords,
        niches: body.niches || [],
        max_video_age_minutes: maxVideoAgeMinutes,
        max_initial_views: maxInitialViews,
        auto_predict: autoPredict,
        auto_refresh_minutes: autoRefreshMinutes,
        status: 'running',
        last_refresh_at: new Date().toISOString(),
        next_refresh_at: autoRefreshMinutes > 0 
          ? new Date(Date.now() + autoRefreshMinutes * 60 * 1000).toISOString()
          : null
      })
      .select()
      .single();

    if (jobError || !job) {
      console.error('[Fresh Scraper] Job creation failed:', jobError);
      return NextResponse.json(
        { success: false, error: 'Failed to create scrape job' },
        { status: 500 }
      );
    }

    console.log(`[Fresh Scraper] Started job ${job.id} for keywords: ${body.keywords.join(', ')}`);

    // Start scraping in background
    runFreshScrape(job.id, body.keywords, body.niches || [], maxVideoAgeMinutes, maxInitialViews, autoPredict)
      .catch(err => console.error('[Fresh Scraper] Background error:', err));

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        keywords: body.keywords,
        maxVideoAgeMinutes,
        maxInitialViews,
        autoPredict,
        autoRefreshMinutes,
        message: `Started fresh capture for: ${body.keywords.join(', ')}`
      }
    });

  } catch (error: any) {
    console.error('[Fresh Scraper] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get fresh scrape jobs and tracked videos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (jobId) {
      // Get specific job with its videos
      const { data: job, error: jobError } = await supabase
        .from('fresh_scrape_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !job) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      // Get videos for this job's keywords
      const { data: videos, error: videosError } = await supabase
        .from('fresh_video_tracking')
        .select('*')
        .in('keyword', job.keywords)
        .gte('scraped_at', job.created_at)
        .order('scraped_at', { ascending: false })
        .limit(limit);

      return NextResponse.json({
        success: true,
        data: {
          job,
          videos: videos || [],
          stats: calculateJobStats(videos || [])
        }
      });

    } else {
      // List all jobs
      let query = supabase
        .from('fresh_scrape_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: jobs, error: jobsError } = await query;

      // Get recent videos
      const { data: recentVideos } = await supabase
        .from('fresh_video_tracking')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(limit);

      // Get tracking stats
      const { data: trackingStats } = await supabase
        .from('fresh_video_tracking')
        .select('tracking_status, prediction_accurate')
        .not('predicted_dps', 'is', null);

      return NextResponse.json({
        success: true,
        data: {
          jobs: jobs || [],
          recentVideos: recentVideos || [],
          stats: {
            totalTracked: trackingStats?.length || 0,
            pendingPrediction: trackingStats?.filter(v => !v.prediction_accurate && v.tracking_status === 'pending').length || 0,
            activelyTracking: trackingStats?.filter(v => v.tracking_status === 'tracking').length || 0,
            completed: trackingStats?.filter(v => v.tracking_status === 'complete').length || 0,
            accuratePredictions: trackingStats?.filter(v => v.prediction_accurate).length || 0
          }
        }
      });
    }

  } catch (error: any) {
    console.error('[Fresh Scraper] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate stats for a job's videos
 */
function calculateJobStats(videos: any[]) {
  if (videos.length === 0) {
    return { total: 0, predicted: 0, tracking: 0, complete: 0, avgAge: 0 };
  }

  return {
    total: videos.length,
    predicted: videos.filter(v => v.predicted_dps !== null).length,
    tracking: videos.filter(v => v.tracking_status === 'tracking').length,
    complete: videos.filter(v => v.tracking_status === 'complete').length,
    avgAge: Math.round(videos.reduce((sum, v) => sum + (v.video_age_minutes || 0), 0) / videos.length),
    avgInitialViews: Math.round(videos.reduce((sum, v) => sum + (v.initial_views || 0), 0) / videos.length)
  };
}

/**
 * Run fresh video scraping (simulated for now - would integrate with TikTok API/Apify)
 */
async function runFreshScrape(
  jobId: string,
  keywords: string[],
  niches: string[],
  maxVideoAgeMinutes: number,
  maxInitialViews: number,
  autoPredict: boolean
) {
  console.log(`[Fresh Scraper] Running scrape for job ${jobId}`);

  try {
    // In production, this would call TikTok API or Apify scraper
    // For now, we'll create a simulated implementation that shows the structure
    
    // TODO: Replace with actual TikTok API integration
    // Options:
    // 1. TikTok Research API (if approved)
    // 2. Apify TikTok Scraper
    // 3. RapidAPI TikTok endpoints
    // 4. Custom scraper using Puppeteer
    
    const mockFreshVideos = await simulateFreshVideoDiscovery(keywords, maxVideoAgeMinutes, maxInitialViews);
    
    let videosFound = 0;
    let videosPredicted = 0;

    for (const video of mockFreshVideos) {
      // Insert the fresh video
      const { data: inserted, error: insertError } = await supabase
        .from('fresh_video_tracking')
        .insert({
          video_id: video.videoId,
          platform: 'tiktok',
          video_url: video.url,
          keyword: video.keyword,
          niche: niches[0] || 'general',
          author_username: video.author,
          video_posted_at: video.postedAt,
          video_age_minutes: video.ageMinutes,
          initial_views: video.views,
          initial_likes: video.likes,
          initial_comments: video.comments,
          initial_shares: video.shares,
          initial_metrics: {
            views: video.views,
            likes: video.likes,
            comments: video.comments,
            shares: video.shares,
            engagementRate: ((video.likes + video.comments + video.shares) / Math.max(video.views, 1) * 100).toFixed(2)
          },
          tracking_status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.warn(`[Fresh Scraper] Failed to insert video ${video.videoId}:`, insertError.message);
        continue;
      }

      videosFound++;

      // =====================================================
      // IMMEDIATE FFmpeg ANALYSIS (while CDN URL is fresh!)
      // =====================================================
      if (video.url) {
        try {
          console.log(`[Fresh Scraper] Running FFmpeg for ${video.videoId}...`);
          const ffmpegResult = await analyzeVideoImmediately(video.url, video.videoId, '');
          if (ffmpegResult.success) {
            console.log(`[Fresh Scraper] ✅ FFmpeg ${video.videoId}: ${ffmpegResult.analysis?.sceneChanges} scenes`);
          } else {
            console.warn(`[Fresh Scraper] ⚠️ FFmpeg ${video.videoId}: ${ffmpegResult.error}`);
          }
        } catch (ffmpegError: any) {
          console.warn(`[Fresh Scraper] FFmpeg error ${video.videoId}: ${ffmpegError.message}`);
          // Continue - FFmpeg failure shouldn't block fresh video tracking
        }
      }

      // Schedule tracking checks
      if (inserted) {
        await scheduleTrackingChecks(inserted.id);
      }

      // Auto-predict if enabled
      if (autoPredict && inserted) {
        try {
          // For real implementation, you'd download the video and call Kai
          // For now, we'll mark as needing prediction
          await supabase
            .from('fresh_video_tracking')
            .update({ tracking_status: 'tracking' })
            .eq('id', inserted.id);
          
          // In production: await runPredictionOnFreshVideo(inserted.id);
          videosPredicted++;
        } catch (predError: any) {
          console.warn(`[Fresh Scraper] Prediction failed for ${video.videoId}:`, predError.message);
        }
      }
    }

    // Update job stats
    await supabase
      .from('fresh_scrape_jobs')
      .update({
        videos_found: videosFound,
        videos_predicted: videosPredicted,
        last_refresh_at: new Date().toISOString()
      })
      .eq('id', jobId);

    console.log(`[Fresh Scraper] Job ${jobId} complete: ${videosFound} videos found, ${videosPredicted} predicted`);

  } catch (error: any) {
    console.error(`[Fresh Scraper] Job ${jobId} failed:`, error);
    
    await supabase
      .from('fresh_scrape_jobs')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', jobId);
  }
}

/**
 * Schedule tracking checks at 1hr, 6hr, 24hr, 48hr, 7d
 */
async function scheduleTrackingChecks(freshVideoId: string) {
  const now = Date.now();
  const checks = [
    { type: '1hr', offset: 1 * 60 * 60 * 1000 },
    { type: '6hr', offset: 6 * 60 * 60 * 1000 },
    { type: '24hr', offset: 24 * 60 * 60 * 1000 },
    { type: '48hr', offset: 48 * 60 * 60 * 1000 },
    { type: '7d', offset: 7 * 24 * 60 * 60 * 1000 }
  ];

  const scheduleRecords = checks.map(check => ({
    fresh_video_id: freshVideoId,
    check_type: check.type,
    scheduled_at: new Date(now + check.offset).toISOString(),
    status: 'pending'
  }));

  await supabase
    .from('tracking_check_schedule')
    .insert(scheduleRecords);
}

/**
 * Simulate fresh video discovery (replace with real API in production)
 */
async function simulateFreshVideoDiscovery(
  keywords: string[],
  maxAgeMinutes: number,
  maxViews: number
): Promise<Array<{
  videoId: string;
  url: string;
  keyword: string;
  author: string;
  postedAt: string;
  ageMinutes: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}>> {
  // This is a simulation - in production, connect to:
  // - TikTok API (if approved for research)
  // - Apify TikTok Scraper
  // - RapidAPI TikTok endpoints
  
  // For now, return empty to show the system is ready
  // The user would need to set up actual TikTok API access
  
  console.log(`[Fresh Scraper] Would search for: ${keywords.join(', ')} (max ${maxAgeMinutes} min old, <${maxViews} views)`);
  
  // Return empty array - no mock data, waiting for real API integration
  return [];
}









