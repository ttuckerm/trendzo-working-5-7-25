/**
 * POST /api/operations/training/label
 *
 * Manually label a single prediction_run with actual engagement metrics.
 * Computes actual DPS via the canonical DPS v2 module, then writes
 * the result through the single v2 write path.
 *
 * Body: { run_id, views, likes, comments, shares, saves }
 * Returns: { success, run, dps, tier, breakdown }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { run_id, views, likes, comments, shares, saves } = body;

    // Validate
    if (!run_id) {
      return NextResponse.json(
        { success: false, error: 'run_id is required' },
        { status: 400 },
      );
    }
    if (views == null || views < 0) {
      return NextResponse.json(
        { success: false, error: 'views is required and must be >= 0' },
        { status: 400 },
      );
    }

    const numViews = Number(views) || 0;
    const numLikes = Number(likes) || 0;
    const numComments = Number(comments) || 0;
    const numShares = Number(shares) || 0;
    const numSaves = Number(saves) || 0;

    const supabase = getSupabase();

    // 1. Fetch the run to get niche and account_size_band
    const { data: run, error: runErr } = await supabase
      .from('prediction_runs_enriched')
      .select(
        'id, video_id, niche, account_size_band, predicted_dps_7d, prediction_range_low, prediction_range_high, actual_follower_count',
      )
      .eq('id', run_id)
      .single();

    if (runErr || !run) {
      return NextResponse.json(
        { success: false, error: `Run not found: ${runErr?.message || 'unknown'}` },
        { status: 404 },
      );
    }

    const niche = run.niche || 'side_hustles';

    // 2. Fetch cohort from scraped_videos
    const cohortRows: ScrapedVideoRow[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    while (true) {
      const { data: page, error: cohortErr } = await supabase
        .from('scraped_videos')
        .select(
          'creator_followers_count, views_count, likes_count, comments_count, shares_count, saves_count',
        )
        .eq('niche', niche)
        .not('views_count', 'is', null)
        .gt('views_count', 0)
        .range(offset, offset + PAGE_SIZE - 1);

      if (cohortErr) {
        return NextResponse.json(
          { success: false, error: `Cohort fetch failed: ${cohortErr.message}` },
          { status: 500 },
        );
      }
      if (!page || page.length === 0) break;

      for (const r of page) {
        cohortRows.push({
          views: (r as any).views_count ?? 0,
          likes: (r as any).likes_count ?? 0,
          comments: (r as any).comments_count ?? 0,
          shares: (r as any).shares_count ?? 0,
          saves: (r as any).saves_count ?? 0,
          follower_count: (r as any).creator_followers_count ?? 0,
        });
      }
      if (page.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    // 3. Build raw metrics and compute DPS v2
    const followerCount = run.actual_follower_count ?? 0;
    if (!run.actual_follower_count) {
      console.warn(`[label] No follower count for run ${run_id} — view_to_follower_ratio and cohort percentile will be null`);
    }

    const rawMetrics: DpsV2RawMetrics = {
      views: numViews,
      likes: numLikes,
      comments: numComments,
      shares: numShares,
      saves: numSaves,
      follower_count: followerCount,
      hours_since_post: 0,
    };

    const v2Result = computeDpsV2FromRows(rawMetrics, cohortRows);

    // 4. Write via canonical v2 writer
    const writeResult = await labelPredictionRunWithDpsV2(supabase, {
      run_id,
      raw_metrics: rawMetrics,
      breakdown: v2Result.breakdown,
      dps_score: v2Result.score,
      tier: v2Result.tier,
      label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'medium',
      training_weight: v2Result.dps_v2_incomplete ? 0 : 0.6,
      source_tag: 'manual_training_label',
      predicted_dps: run.predicted_dps_7d,
      prediction_range_low: run.prediction_range_low,
      prediction_range_high: run.prediction_range_high,
      dps_v2_incomplete: v2Result.dps_v2_incomplete,
      dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
    });

    if (!writeResult.success) {
      return NextResponse.json(
        { success: false, error: `Update failed: ${writeResult.error}` },
        { status: 500 },
      );
    }

    // 5. Return result
    return NextResponse.json({
      success: true,
      run_id,
      actual_dps: v2Result.score,
      actual_dps_display: v2Result.display_score,
      actual_tier: v2Result.tier,
      breakdown: v2Result.breakdown,
      cohort_size: cohortRows.length,
      dps_v2_incomplete: v2Result.dps_v2_incomplete ?? false,
      dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
    });
  } catch (err: any) {
    console.error('[label] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
