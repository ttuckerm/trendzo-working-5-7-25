import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Atlas Subsystem 1: Feedback Collector
 *
 * Runs on a cron schedule (every 6 hours). Matches VPS predictions
 * to actual content performance, calculates delta, and generates
 * accuracy summaries.
 *
 * Data sources (tried in order):
 * 1. prediction_runs.actual_dps (direct match via prediction_id)
 * 2. creator_video_history (match by content_id / tiktok_video_id)
 * 3. tracking_checkpoints 7day (match by video_id)
 */

const BATCH_SIZE = 100;
const MIN_AGE_DAYS = 7;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = ReturnType<typeof createClient<any>>;

function getServiceSupabase(): AnySupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Try to find actual performance for a prediction from available data sources.
 * Returns a normalized 0-100 score or null if no data found.
 */
async function getActualPerformance(
  supabase: AnySupabase,
  predictionId: string | null,
  contentId: string | null,
): Promise<number | null> {
  // Source 1: prediction_runs.actual_dps (most reliable — manually or auto-labeled)
  if (predictionId) {
    const { data } = await supabase
      .from('prediction_runs')
      .select('actual_dps')
      .eq('id', predictionId)
      .not('actual_dps', 'is', null)
      .maybeSingle();

    if (data?.actual_dps != null) {
      return Number(data.actual_dps);
    }
  }

  // Source 2: creator_video_history (scraped actual metrics)
  if (contentId) {
    const { data } = await supabase
      .from('creator_video_history')
      .select('actual_dps, actual_views, actual_likes, actual_shares, actual_comments')
      .or(`tiktok_video_id.eq.${contentId},video_id.eq.${contentId}`)
      .limit(1)
      .maybeSingle();

    if (data?.actual_dps != null) {
      return Number(data.actual_dps);
    }

    if (data?.actual_views != null && data.actual_views > 0) {
      return calculatePerformanceScore(data);
    }
  }

  // Source 3: tracking_checkpoints at 7day mark
  if (contentId) {
    const { data } = await supabase
      .from('tracking_checkpoints')
      .select('actual_dps, views, likes, shares, comments')
      .eq('video_id', contentId)
      .eq('checkpoint_time', '7day')
      .eq('completed', true)
      .maybeSingle();

    if (data?.actual_dps != null) {
      return Number(data.actual_dps);
    }

    if (data?.views != null && data.views > 0) {
      return calculatePerformanceScore({
        actual_views: data.views,
        actual_likes: data.likes || 0,
        actual_shares: data.shares || 0,
        actual_comments: data.comments || 0,
      });
    }
  }

  return null;
}

/**
 * Engagement-weighted performance score normalized to 0-100.
 * Weights: likes 1x, shares 3x, comments 2x (shares indicate strongest intent).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculatePerformanceScore(data: any): number {
  const views = Number(data.actual_views || data.views || 0);
  const likes = Number(data.actual_likes || data.likes || 0);
  const shares = Number(data.actual_shares || data.shares || 0);
  const comments = Number(data.actual_comments || data.comments || 0);
  if (views === 0) return 0;

  const engagementRate = (likes + shares * 3 + comments * 2) / views;
  // Scale: 10% engagement → 100 VPS (exceptional), typical 2-5% → 20-50
  return Math.min(Math.round(engagementRate * 1000), 100);
}

/**
 * Compute Spearman rank correlation between two arrays.
 */
function spearmanCorrelation(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 3) return null;

  function rankArray(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      ranks[sorted[i].i] = i + 1;
    }
    return ranks;
  }

  const rx = rankArray(x);
  const ry = rankArray(y);
  let d2Sum = 0;
  for (let i = 0; i < n; i++) {
    const d = rx[i] - ry[i];
    d2Sum += d * d;
  }
  return 1 - (6 * d2Sum) / (n * (n * n - 1));
}

/**
 * Generate accuracy summary for the past 30 days and insert into atlas_accuracy_summary.
 */
async function generateAccuracySummary(supabase: AnySupabase) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: collected } = await supabase
    .from('prediction_log')
    .select('predicted_vps, actual_performance, niche, delta')
    .eq('feedback_collected', true)
    .gte('actual_measured_at', thirtyDaysAgo.toISOString())
    .limit(1000);

  if (!collected || collected.length === 0) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deltas = collected
    .map((r: { delta: number | null }) => Math.abs(Number(r.delta) || 0))
    .sort((a: number, b: number) => a - b);

  const within10 = deltas.filter((d: number) => d <= 10).length;
  const within25 = deltas.filter((d: number) => d <= 25).length;
  const over25 = deltas.filter((d: number) => d > 25).length;

  const avgDelta = deltas.reduce((s: number, d: number) => s + d, 0) / deltas.length;
  const medianDelta = deltas[Math.floor(deltas.length / 2)];

  // Compute Spearman correlation
  const predicted = collected.map((r: { predicted_vps: number | null }) => Number(r.predicted_vps) || 0);
  const actual = collected.map((r: { actual_performance: number | null }) => Number(r.actual_performance) || 0);
  const rho = spearmanCorrelation(predicted, actual);

  // Per-niche aggregation
  const niches = [...new Set(collected.map((r: { niche: string | null }) => r.niche).filter(Boolean))];
  const nicheStats: Record<string, { count: number; avgDelta: number }> = {};
  for (const niche of niches) {
    const nicheRows = collected.filter((r: { niche: string | null }) => r.niche === niche);
    const nicheDeltas = nicheRows.map((r: { delta: number | null }) => Math.abs(Number(r.delta) || 0));
    nicheStats[niche as string] = {
      count: nicheRows.length,
      avgDelta: nicheDeltas.reduce((s: number, d: number) => s + d, 0) / nicheDeltas.length,
    };
  }

  await supabase.from('atlas_accuracy_summary').insert({
    period_start: thirtyDaysAgo.toISOString().slice(0, 10),
    period_end: now.toISOString().slice(0, 10),
    niche: null,
    total_predictions: collected.length,
    avg_delta: Math.round(avgDelta * 100) / 100,
    median_delta: Math.round(medianDelta * 100) / 100,
    spearman_correlation: rho != null ? Math.round(rho * 10000) / 10000 : null,
    accuracy_bucket: { within_10pct: within10, within_25pct: within25, over_25pct: over25, by_niche: nicheStats },
  });
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - MIN_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Find uncollected predictions older than 7 days
  const { data: predictions, error: queryError } = await supabase
    .from('prediction_log')
    .select('*')
    .eq('feedback_collected', false)
    .lt('predicted_at', cutoff)
    .limit(BATCH_SIZE);

  if (queryError) {
    console.error('[atlas/feedback-collector] Query error:', queryError);
    return NextResponse.json({ error: 'Query failed', detail: queryError.message }, { status: 500 });
  }

  if (!predictions || predictions.length === 0) {
    return NextResponse.json({ collected: 0, total: 0, message: 'No predictions ready for feedback' });
  }

  let collectedCount = 0;
  let skipped = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pred of predictions as any[]) {
    const actual = await getActualPerformance(
      supabase,
      pred.prediction_id,
      pred.content_id,
    );

    if (actual !== null) {
      const delta = actual - (Number(pred.predicted_vps) || 0);
      const { error: updateError } = await supabase
        .from('prediction_log')
        .update({
          actual_performance: actual,
          actual_measured_at: new Date().toISOString(),
          delta: Math.round(delta * 100) / 100,
          feedback_collected: true,
        })
        .eq('id', pred.id);

      if (!updateError) {
        collectedCount++;
      } else {
        console.error(`[atlas/feedback-collector] Update error for ${pred.id}:`, updateError);
      }
    } else {
      skipped++;
    }
  }

  // Generate accuracy summary after collection
  if (collectedCount > 0) {
    try {
      await generateAccuracySummary(supabase);
    } catch (err) {
      console.error('[atlas/feedback-collector] Accuracy summary failed:', err);
    }
  }

  console.log(`[atlas/feedback-collector] Processed ${predictions.length}: collected=${collectedCount}, skipped=${skipped}`);
  console.log(`[atlas/feedback-collector] Feedback Collector: found ${collectedCount} rows with actual_performance data`);

  return NextResponse.json({
    collected: collectedCount,
    skipped,
    total: predictions.length,
  });
}
