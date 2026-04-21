import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Atlas Subsystem 1: Feedback Collector
 *
 * Runs on a cron schedule. Computes VPS prediction accuracy over the last 30 days
 * from labeled prediction_runs (rows where actual_dps IS NOT NULL) and inserts
 * a summary row into atlas_accuracy_summary.
 *
 * Reads: prediction_runs.{id, predicted_dps_7d, actual_dps, prediction_error, source_meta, created_at}
 * Writes: atlas_accuracy_summary
 */

const WINDOW_DAYS = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = ReturnType<typeof createClient<any>>;

function getServiceSupabase(): AnySupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function spearmanCorrelation(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 3) return null;
  const rank = (arr: number[]): number[] => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(n);
    for (let i = 0; i < n; i++) ranks[sorted[i].i] = i + 1;
    return ranks;
  };
  const rx = rank(x);
  const ry = rank(y);
  let d2 = 0;
  for (let i = 0; i < n; i++) d2 += (rx[i] - ry[i]) ** 2;
  return 1 - (6 * d2) / (n * (n * n - 1));
}

interface LabeledRun {
  id: string;
  predicted_dps_7d: number | null;
  actual_dps: number | null;
  prediction_error: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source_meta: any;
  created_at: string;
}

function nicheOf(row: LabeledRun): string | null {
  const meta = row.source_meta;
  if (meta && typeof meta === 'object' && typeof meta.niche === 'string') return meta.niche;
  return null;
}

async function summarize(supabase: AnySupabase) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400 * 1000);

  const { data: runs, error } = await supabase
    .from('prediction_runs')
    .select('id, predicted_dps_7d, actual_dps, prediction_error, source_meta, created_at')
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)
    .gte('created_at', windowStart.toISOString())
    .lte('created_at', now.toISOString())
    .limit(10000);

  if (error) throw error;
  const labeled: LabeledRun[] = (runs ?? []) as LabeledRun[];

  if (labeled.length === 0) {
    return {
      total_predictions: 0,
      period_start: windowStart.toISOString().slice(0, 10),
      period_end: now.toISOString().slice(0, 10),
      message: 'No labeled predictions with both predicted_dps_7d and actual_dps in 30d window',
    };
  }

  const predicted = labeled.map((r) => Number(r.predicted_dps_7d));
  const actual = labeled.map((r) => Number(r.actual_dps));
  const deltas = labeled.map((r) => {
    if (r.prediction_error != null) return Math.abs(Number(r.prediction_error));
    return Math.abs(Number(r.actual_dps) - Number(r.predicted_dps_7d));
  });
  const sortedDeltas = [...deltas].sort((a, b) => a - b);

  const within10 = deltas.filter((d) => d <= 10).length;
  const within25 = deltas.filter((d) => d <= 25).length;
  const over25 = deltas.filter((d) => d > 25).length;
  const avgDelta = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  const medianDelta = sortedDeltas[Math.floor(sortedDeltas.length / 2)];
  const rho = spearmanCorrelation(predicted, actual);

  // Per-niche aggregation from source_meta.niche (may be absent for bulk-download runs).
  const nicheStats: Record<string, { count: number; avgDelta: number }> = {};
  const niches = Array.from(new Set(labeled.map(nicheOf).filter(Boolean))) as string[];
  for (const n of niches) {
    const rows = labeled.filter((r) => nicheOf(r) === n);
    const nicheDeltas = rows.map((r) =>
      r.prediction_error != null
        ? Math.abs(Number(r.prediction_error))
        : Math.abs(Number(r.actual_dps) - Number(r.predicted_dps_7d))
    );
    nicheStats[n] = {
      count: rows.length,
      avgDelta: Math.round(
        (nicheDeltas.reduce((s, d) => s + d, 0) / nicheDeltas.length) * 100
      ) / 100,
    };
  }
  const unresolvedNiche = labeled.filter((r) => nicheOf(r) == null).length;

  const summary = {
    period_start: windowStart.toISOString().slice(0, 10),
    period_end: now.toISOString().slice(0, 10),
    niche: null as string | null,
    total_predictions: labeled.length,
    avg_delta: Math.round(avgDelta * 100) / 100,
    median_delta: Math.round(medianDelta * 100) / 100,
    spearman_correlation: rho != null ? Math.round(rho * 10000) / 10000 : null,
    accuracy_bucket: {
      within_10pct: within10,
      within_25pct: within25,
      over_25pct: over25,
      by_niche: nicheStats,
      niche_unresolved_count: unresolvedNiche,
    },
  };

  const { error: insertError } = await supabase.from('atlas_accuracy_summary').insert(summary);
  if (insertError) {
    console.error('[atlas/feedback-collector] insert error:', insertError);
    throw insertError;
  }

  console.log(
    `[atlas/feedback-collector] summarized ${labeled.length} labeled runs (30d): avg|Δ|=${summary.avg_delta} median|Δ|=${summary.median_delta} ρ=${summary.spearman_correlation}`
  );

  return summary;
}

async function handle(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  try {
    const summary = await summarize(supabase);
    return NextResponse.json({ ok: true, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[atlas/feedback-collector] error:', err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest)  { return handle(req); }
