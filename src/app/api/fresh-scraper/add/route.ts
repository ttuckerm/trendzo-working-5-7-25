/**
 * Manual Fresh Video Addition API
 * 
 * POST /api/fresh-scraper/add - Manually add a fresh video for tracking
 * 
 * Used when you find a fresh video manually and want to track it
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

interface AddFreshVideoRequest {
  videoUrl: string;
  keyword?: string;
  niche?: string;
  runPrediction?: boolean;
}

/**
 * POST - Add a fresh video for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddFreshVideoRequest = await request.json();

    if (!body.videoUrl) {
      return NextResponse.json(
        { success: false, error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractVideoId(body.videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Could not extract video ID from URL' },
        { status: 400 }
      );
    }

    // Fetch current metrics
    const metrics = await fetchVideoMetrics(body.videoUrl);
    if (!metrics) {
      return NextResponse.json(
        { success: false, error: 'Could not fetch video metrics' },
        { status: 400 }
      );
    }

    // Calculate how fresh the video is (estimate based on view count)
    // This is approximate - true age would require TikTok API
    const estimatedAgeMinutes = estimateVideoAge(metrics.views);

    // Insert the fresh video
    const { data: freshVideo, error: insertError } = await supabase
      .from('fresh_video_tracking')
      .insert({
        video_id: videoId,
        platform: 'tiktok',
        video_url: body.videoUrl,
        keyword: body.keyword || 'manual',
        niche: body.niche || 'general',
        author_username: metrics.author,
        video_age_minutes: estimatedAgeMinutes,
        initial_views: metrics.views,
        initial_likes: metrics.likes,
        initial_comments: metrics.comments,
        initial_shares: metrics.shares,
        initial_metrics: metrics,
        tracking_status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Fresh Add] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add video' },
        { status: 500 }
      );
    }

    // Schedule tracking checks
    await scheduleTrackingChecks(freshVideo.id);

    console.log(`[Fresh Add] Added video ${videoId} with ${metrics.views} initial views`);

    // =====================================================
    // IMMEDIATE FFmpeg ANALYSIS (while CDN URL is fresh!)
    // =====================================================
    let ffmpegResult = null;
    try {
      console.log(`[Fresh Add] Running FFmpeg analysis for ${videoId}...`);
      ffmpegResult = await analyzeVideoImmediately(body.videoUrl, videoId);
      if (ffmpegResult.success) {
        console.log(`[Fresh Add] ✅ FFmpeg: ${ffmpegResult.analysis?.height}p, ${ffmpegResult.analysis?.sceneChanges} scenes`);
      } else {
        console.warn(`[Fresh Add] ⚠️ FFmpeg failed: ${ffmpegResult.error}`);
      }
    } catch (ffmpegError: any) {
      console.warn(`[Fresh Add] FFmpeg error: ${ffmpegError.message}`);
      // Continue - FFmpeg failure shouldn't block video tracking
    }

    // Run prediction if requested
    let prediction = null;
    if (body.runPrediction !== false) {
      prediction = await runPrediction(freshVideo.id, body.videoUrl, body.niche || 'general');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: freshVideo.id,
        videoId,
        initialViews: metrics.views,
        estimatedAgeMinutes,
        prediction,
        ffmpegAnalyzed: ffmpegResult?.success || false,
        message: prediction 
          ? `Added and predicted: ${prediction.predictedDps?.toFixed(1)} DPS${ffmpegResult?.success ? ' (FFmpeg ✅)' : ''}`
          : `Added for tracking${ffmpegResult?.success ? ' (FFmpeg ✅)' : ''}`
      }
    });

  } catch (error: any) {
    console.error('[Fresh Add] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract video ID from TikTok URL
 */
function extractVideoId(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /tiktok\.com\/t\/(\w+)/,
    /vm\.tiktok\.com\/(\w+)/,
    /tiktok\.com\/v\/(\d+)/,
    /(?:video|v)\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Fetch video metrics from TikTok
 */
async function fetchVideoMetrics(videoUrl: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
  author?: string;
  description?: string;
} | null> {
  try {
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.code !== 0 || !data.data) return null;

    return {
      views: data.data.play_count || 0,
      likes: data.data.digg_count || 0,
      comments: data.data.comment_count || 0,
      shares: data.data.share_count || 0,
      saves: data.data.collect_count || 0,
      author: data.data.author?.unique_id,
      description: data.data.title
    };

  } catch (error) {
    console.error('[Fresh Add] Metrics fetch failed:', error);
    return null;
  }
}

/**
 * Estimate video age based on view count
 * This is a rough heuristic - videos with <1000 views are likely <30 min old
 */
function estimateVideoAge(views: number): number {
  if (views < 100) return 5;
  if (views < 500) return 10;
  if (views < 1000) return 15;
  if (views < 5000) return 30;
  if (views < 10000) return 60;
  return 120; // 2+ hours
}

/**
 * Schedule tracking checks at intervals
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
 * Run prediction on the fresh video
 */
async function runPrediction(
  freshVideoId: string,
  videoUrl: string,
  niche: string
): Promise<{
  predictedDps: number | null;
  confidence: number | null;
  error?: string;
} | null> {
  try {
    // For now, we'll use a simplified prediction approach
    // In production, this would download the video and call the full Kai pipeline
    
    // Fetch metrics again for DPS calculation
    const metrics = await fetchVideoMetrics(videoUrl);
    if (!metrics) {
      return { predictedDps: null, confidence: null, error: 'Could not fetch metrics' };
    }

    // Simple prediction based on early engagement rate
    // This is a placeholder - real prediction would use Kai Orchestrator
    const engagementRate = (metrics.likes + metrics.comments + metrics.shares) / Math.max(metrics.views, 1);
    
    // Early engagement is typically 2-3x final engagement rate
    const projectedEngagement = engagementRate * 0.5; // Assume it will normalize down
    
    let predictedDps = 50; // baseline
    if (projectedEngagement >= 0.15) predictedDps = 85;
    else if (projectedEngagement >= 0.10) predictedDps = 70;
    else if (projectedEngagement >= 0.05) predictedDps = 55;
    else if (projectedEngagement >= 0.03) predictedDps = 40;
    else predictedDps = 30;

    // Add some variance based on niche
    const nicheModifiers: Record<string, number> = {
      'fitness': 5,
      'personal-finance': 8,
      'business': 3,
      'entertainment': -5,
      'education': 2
    };
    predictedDps += nicheModifiers[niche] || 0;

    const confidence = Math.min(0.75, 0.5 + (metrics.views / 1000) * 0.1);

    // Update the fresh video with prediction
    await supabase
      .from('fresh_video_tracking')
      .update({
        predicted_dps: predictedDps,
        predicted_range_low: predictedDps - 15,
        predicted_range_high: predictedDps + 15,
        prediction_confidence: confidence,
        predicted_at: new Date().toISOString(),
        tracking_status: 'tracking'
      })
      .eq('id', freshVideoId);

    console.log(`[Fresh Add] Predicted ${predictedDps.toFixed(1)} DPS (${(confidence * 100).toFixed(0)}% confidence)`);

    return { predictedDps, confidence };

  } catch (error: any) {
    console.error('[Fresh Add] Prediction failed:', error);
    return { predictedDps: null, confidence: null, error: error.message };
  }
}









