/**
 * Fresh Video Tracking Check API
 * 
 * POST /api/fresh-scraper/check - Process pending tracking checks
 * GET /api/fresh-scraper/check - Get pending checks
 * 
 * This endpoint is called by a cron job or manually to:
 * 1. Find pending checks that are due
 * 2. Fetch current metrics from TikTok
 * 3. Update the tracking record
 * 4. Calculate prediction accuracy once complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

/**
 * POST - Process pending tracking checks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 10;
    const checkType = body.checkType; // optional filter

    // Find pending checks that are due
    let query = supabase
      .from('tracking_check_schedule')
      .select(`
        *,
        fresh_video_tracking (
          id, video_id, video_url, platform, initial_views, predicted_dps,
          predicted_range_low, predicted_range_high
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (checkType) {
      query = query.eq('check_type', checkType);
    }

    const { data: pendingChecks, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Tracking Check] Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending checks' },
        { status: 500 }
      );
    }

    if (!pendingChecks || pendingChecks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No pending checks found',
          processed: 0
        }
      });
    }

    console.log(`[Tracking Check] Processing ${pendingChecks.length} checks`);

    let processed = 0;
    let failed = 0;

    for (const check of pendingChecks) {
      try {
        const video = check.fresh_video_tracking;
        if (!video) {
          await markCheckFailed(check.id, 'Video record not found');
          failed++;
          continue;
        }

        // Fetch current metrics from TikTok
        const metrics = await fetchVideoMetrics(video.video_url, video.platform);
        
        if (!metrics) {
          await markCheckFailed(check.id, 'Failed to fetch metrics');
          failed++;
          continue;
        }

        // Calculate DPS
        const dps = calculateDPS(metrics.views, metrics.likes, metrics.comments, metrics.shares, metrics.saves || 0);

        // Update the check record
        await supabase
          .from('tracking_check_schedule')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: {
              views: metrics.views,
              likes: metrics.likes,
              comments: metrics.comments,
              shares: metrics.shares,
              saves: metrics.saves,
              dps,
              checkedAt: new Date().toISOString()
            }
          })
          .eq('id', check.id);

        // Update the fresh_video_tracking record with this check's data
        const checkField = `check_${check.check_type.replace('hr', 'hr').replace('d', 'd')}`;
        const updateData: any = {
          [checkField]: {
            checked_at: new Date().toISOString(),
            views: metrics.views,
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            saves: metrics.saves,
            dps
          }
        };

        // If this is the 7d check, mark as complete and calculate final accuracy
        if (check.check_type === '7d') {
          updateData.tracking_status = 'complete';
          updateData.final_views = metrics.views;
          updateData.final_likes = metrics.likes;
          updateData.final_comments = metrics.comments;
          updateData.final_shares = metrics.shares;
          updateData.final_saves = metrics.saves || 0;
          updateData.final_dps = dps;
          updateData.final_checked_at = new Date().toISOString();
          updateData.final_metrics = metrics;

          // Calculate prediction accuracy
          if (video.predicted_dps !== null) {
            const error = dps - video.predicted_dps;
            updateData.prediction_error = error;
            updateData.prediction_accurate = Math.abs(error) <= 10;
            updateData.within_range = dps >= (video.predicted_range_low || 0) && 
                                       dps <= (video.predicted_range_high || 100);

            // Feed to Algorithm IQ
            await feedToAlgorithmIQ(video, dps, error, updateData.prediction_accurate);
          }
        }

        await supabase
          .from('fresh_video_tracking')
          .update(updateData)
          .eq('id', video.id);

        processed++;
        console.log(`[Tracking Check] ✓ ${check.check_type} check for ${video.video_id}: ${metrics.views} views, ${dps.toFixed(1)} DPS`);

      } catch (checkError: any) {
        console.error(`[Tracking Check] Error processing check ${check.id}:`, checkError);
        await markCheckFailed(check.id, checkError.message);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        failed,
        total: pendingChecks.length,
        message: `Processed ${processed} checks, ${failed} failed`
      }
    });

  } catch (error: any) {
    console.error('[Tracking Check] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get pending checks and stats
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get checks
    const { data: checks, error: checksError } = await supabase
      .from('tracking_check_schedule')
      .select(`
        *,
        fresh_video_tracking (id, video_id, video_url, keyword, predicted_dps)
      `)
      .eq('status', status)
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    // Get stats by check type
    const { data: stats } = await supabase
      .from('tracking_check_schedule')
      .select('check_type, status');

    const checkStats = {
      '1hr': { pending: 0, completed: 0, failed: 0 },
      '6hr': { pending: 0, completed: 0, failed: 0 },
      '24hr': { pending: 0, completed: 0, failed: 0 },
      '48hr': { pending: 0, completed: 0, failed: 0 },
      '7d': { pending: 0, completed: 0, failed: 0 }
    };

    stats?.forEach(s => {
      if (checkStats[s.check_type as keyof typeof checkStats]) {
        checkStats[s.check_type as keyof typeof checkStats][s.status as 'pending' | 'completed' | 'failed']++;
      }
    });

    // Get due checks count
    const { count: dueCount } = await supabase
      .from('tracking_check_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    return NextResponse.json({
      success: true,
      data: {
        checks: checks || [],
        stats: checkStats,
        dueNow: dueCount || 0,
        total: checks?.length || 0
      }
    });

  } catch (error: any) {
    console.error('[Tracking Check] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Mark a check as failed
 */
async function markCheckFailed(checkId: string, errorMessage: string) {
  await supabase
    .from('tracking_check_schedule')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', checkId);
}

/**
 * Fetch current video metrics from TikTok
 * In production, this would use TikTok API or scraping service
 */
async function fetchVideoMetrics(videoUrl: string, platform: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves?: number;
} | null> {
  try {
    // Try TikWM API (same as downloader)
    const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.warn(`[Tracking Check] TikWM API returned ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data) {
      console.warn('[Tracking Check] TikWM API returned no data');
      return null;
    }

    return {
      views: data.data.play_count || 0,
      likes: data.data.digg_count || 0,
      comments: data.data.comment_count || 0,
      shares: data.data.share_count || 0,
      saves: data.data.collect_count || 0
    };

  } catch (error: any) {
    console.error('[Tracking Check] Failed to fetch metrics:', error.message);
    return null;
  }
}

/**
 * Calculate DPS from metrics
 */
function calculateDPS(views: number, likes: number, comments: number, shares: number, saves: number): number {
  if (views === 0) return 0;

  const engagementRate = (likes + comments + shares + saves) / views;

  let baseScore = 0;

  if (engagementRate >= 0.20) {
    baseScore = 80 + (engagementRate - 0.20) * 100;
  } else if (engagementRate >= 0.10) {
    baseScore = 60 + (engagementRate - 0.10) * 200;
  } else if (engagementRate >= 0.05) {
    baseScore = 40 + (engagementRate - 0.05) * 400;
  } else if (engagementRate >= 0.03) {
    baseScore = 30 + (engagementRate - 0.03) * 500;
  } else {
    baseScore = engagementRate * 1000;
  }

  let viewsMultiplier = 1.0;
  if (views >= 1000000) viewsMultiplier = 1.1;
  else if (views >= 100000) viewsMultiplier = 1.05;
  else if (views < 10000) viewsMultiplier = 0.95;

  return Math.max(0, Math.min(100, baseScore * viewsMultiplier));
}

/**
 * Feed completed tracking to Algorithm IQ system
 */
async function feedToAlgorithmIQ(
  video: any,
  actualDps: number,
  error: number,
  isAccurate: boolean
) {
  try {
    // Insert learning insight if notable
    if (Math.abs(error) > 15 || isAccurate) {
      const insightType = isAccurate ? 'learned' : (error > 0 ? 'deficiency' : 'improvement');
      const insightTitle = isAccurate
        ? `Accurate fresh video prediction`
        : `Fresh video ${Math.abs(error).toFixed(1)} DPS ${error > 0 ? 'under' : 'over'}-prediction`;

      await supabase
        .from('algorithm_learning_insights')
        .insert({
          insight_type: insightType,
          title: insightTitle,
          description: `Fresh video tracking complete. Predicted: ${video.predicted_dps?.toFixed(1)} DPS, Actual: ${actualDps.toFixed(1)} DPS after 7 days.`,
          impact_value: Math.abs(error),
          impact_direction: isAccurate ? 'positive' : (error > 0 ? 'negative' : 'neutral'),
          evidence: {
            video_id: video.video_id,
            predicted: video.predicted_dps,
            actual: actualDps,
            delta: error,
            source: 'fresh_video_tracking'
          }
        });

      console.log(`[Algorithm IQ] Generated insight from fresh video tracking: ${insightTitle}`);
    }
  } catch (iqError: any) {
    console.warn('[Algorithm IQ] Failed to feed fresh video result:', iqError.message);
  }
}









