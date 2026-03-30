/**
 * Bulk Download Actual DPS Calculation API
 * 
 * POST /api/bulk-download/calculate-dps - Calculate actual DPS from metrics and compare with prediction
 * 
 * Takes actual video metrics (views, likes, comments, shares, saves),
 * calculates actual DPS, compares with predicted DPS, and feeds
 * results to the learning loop.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  computeDpsV2FromRows,
  labelPredictionRunWithDpsV2,
  type DpsV2RawMetrics,
  type ScrapedVideoRow,
} from '@/lib/training/dps-v2';
import { generateDpsInsights } from '@/lib/training/dps-insights';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface CalculateDpsRequest {
  itemId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

// DPS computation now uses the canonical v2 module — no local formula.

async function fetchCohort(niche: string): Promise<ScrapedVideoRow[]> {
  const rows: ScrapedVideoRow[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('scraped_videos')
      .select('views_count, likes_count, comments_count, shares_count, saves_count, creator_followers_count')
      .eq('niche', niche)
      .not('views_count', 'is', null)
      .gt('views_count', 0)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error || !page || page.length === 0) break;
    for (const r of page) {
      rows.push({
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
  return rows;
}

/**
 * POST - Calculate actual DPS and compare with prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body: CalculateDpsRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Validate metrics
    const { views, likes, comments, shares, saves } = body;
    if (views === undefined || likes === undefined || comments === undefined || 
        shares === undefined || saves === undefined) {
      return NextResponse.json(
        { success: false, error: 'All metrics are required: views, likes, comments, shares, saves' },
        { status: 400 }
      );
    }

    // Get the download item with prediction
    const { data: item, error: itemError } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('id', body.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Download item not found' },
        { status: 404 }
      );
    }

    if (!item.predicted_dps) {
      return NextResponse.json(
        { success: false, error: 'No prediction found for this item. Run prediction first.' },
        { status: 400 }
      );
    }

    // Compute DPS via canonical v2 module
    const predictionData = item.prediction_data || {};
    const niche = predictionData.niche || 'general';
    const cohortRows = await fetchCohort(niche);

    const rawMetrics: DpsV2RawMetrics = {
      views, likes, comments, shares, saves,
      follower_count: item.follower_count ?? 0,
      hours_since_post: 0,
    };

    const v2Result = computeDpsV2FromRows(rawMetrics, cohortRows);
    const actualDps = v2Result.score;
    const predictedDps = item.predicted_dps;

    const error = actualDps != null ? predictedDps - actualDps : null;
    const errorPct = actualDps != null && Math.abs(actualDps) > 0 && error != null
      ? (Math.abs(error) / Math.abs(actualDps)) * 100 : 0;
    const withinRange = actualDps != null
      ? actualDps >= (item.predicted_range_low || -Infinity) &&
        actualDps <= (item.predicted_range_high || Infinity)
      : null;

    const engagementRate = views > 0 ? ((likes + comments + shares + saves) / views) * 100 : 0;

    const insights = !v2Result.dps_v2_incomplete ? generateDpsInsights({
      breakdown: v2Result.breakdown as Record<string, any>,
      display_score: v2Result.display_score!,
      tier: v2Result.tier,
    }) : null;

    const comparisonData = {
      predicted: predictedDps,
      actual: actualDps,
      error,
      errorPct,
      withinRange,
      engagementRate,
      metrics: { views, likes, comments, shares, saves },
      calculatedAt: new Date().toISOString(),
      insights,
      dps_v2_breakdown: v2Result.breakdown,
      dps_v2_incomplete: v2Result.dps_v2_incomplete ?? false,
    };

    // Update the download item with actual metrics and comparison
    const { error: updateError } = await supabase
      .from('bulk_download_items')
      .update({
        actual_dps: actualDps,
        actual_views: views,
        actual_likes: likes,
        actual_comments: comments,
        actual_shares: shares,
        actual_saves: saves,
        comparison_data: comparisonData
      })
      .eq('id', body.itemId);

    if (updateError) {
      console.error('[Calculate DPS] Failed to save comparison:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to save comparison results' },
        { status: 500 }
      );
    }

    // Write canonical v2 label to prediction_runs
    if (item.prediction_id) {
      const writeResult = await labelPredictionRunWithDpsV2(supabase, {
        run_id: item.prediction_id,
        raw_metrics: rawMetrics,
        breakdown: v2Result.breakdown,
        dps_score: actualDps,
        tier: v2Result.tier,
        label_trust: v2Result.dps_v2_incomplete ? 'untrusted' : 'low',
        training_weight: v2Result.dps_v2_incomplete ? 0 : 0.3,
        source_tag: 'bulk_download',
        predicted_dps: predictedDps,
        prediction_range_low: item.predicted_range_low,
        prediction_range_high: item.predicted_range_high,
        dps_v2_incomplete: v2Result.dps_v2_incomplete,
        dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
      });

      if (!writeResult.success) {
        console.warn(`[Calculate DPS] Failed to write v2 label (run_id=${item.prediction_id}): ${writeResult.error}`);
      } else {
        console.log(`[Calculate DPS] V2 label written (run_id=${item.prediction_id})`);
      }
    }

    if (actualDps != null) {
      console.log(`[Calculate DPS] ✓ ${item.video_id}: Predicted ${predictedDps.toFixed(1)} vs Actual ${actualDps.toFixed(1)} (${(error ?? 0) > 0 ? '+' : ''}${(error ?? 0).toFixed(1)} DPS)`);
    } else {
      console.log(`[Calculate DPS] ⚠ ${item.video_id}: DPS incomplete — ${v2Result.dps_v2_incomplete_reason}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        itemId: body.itemId,
        videoId: item.video_id,
        predicted: predictedDps,
        actual: actualDps,
        actual_display: v2Result.display_score,
        error,
        errorPct,
        withinRange,
        engagementRate,
        metrics: { views, likes, comments, shares, saves },
        interpretation: actualDps != null ? getInterpretation(error!, actualDps, withinRange!) : null,
        insights,
        dps_v2_incomplete: v2Result.dps_v2_incomplete ?? false,
        dps_v2_incomplete_reason: v2Result.dps_v2_incomplete_reason,
      }
    });

  } catch (error: any) {
    console.error('[Calculate DPS] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable interpretation of the comparison
 */
function getInterpretation(error: number, actualDps: number, withinRange: boolean): {
  type: 'accurate' | 'over' | 'under';
  severity: 'low' | 'medium' | 'high';
  message: string;
} {
  const absError = Math.abs(error);
  
  if (absError <= 10) {
    return {
      type: 'accurate',
      severity: 'low',
      message: `Accurate prediction - within ±10 DPS. The model correctly identified this video's viral potential.`
    };
  }
  
  if (error > 0) {
    // Over-prediction
    const severity = absError > 20 ? 'high' : 'medium';
    return {
      type: 'over',
      severity,
      message: `Over-predicted by ${absError.toFixed(1)} DPS. The model overestimated this video's engagement potential.`
    };
  } else {
    // Under-prediction (actually good - video did better than expected)
    const severity = absError > 20 ? 'high' : 'medium';
    return {
      type: 'under',
      severity,
      message: `Under-predicted by ${absError.toFixed(1)} DPS. The video performed better than expected - the model was conservative.`
    };
  }
}










