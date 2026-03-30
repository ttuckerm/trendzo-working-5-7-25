import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { runBenchmarkEvaluation } from '@/lib/evaluation/benchmark-runner';

// ─── GET: Return evaluation runs + benchmark set + experiment log ────────────

export async function GET() {
  try {
    const supabase = getServerSupabase();

    const [runsResult, benchmarksResult, experimentsResult] = await Promise.all([
      supabase
        .from('evaluation_runs')
        .select('*')
        .order('run_at', { ascending: false }),
      supabase
        .from('evaluation_benchmarks')
        .select('id, video_id, actual_dps, niche, creator_followers, duration_seconds'),
      supabase
        .from('experiment_log')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (runsResult.error) {
      return NextResponse.json(
        { error: `Failed to load runs: ${runsResult.error.message}` },
        { status: 500 },
      );
    }

    if (benchmarksResult.error) {
      return NextResponse.json(
        { error: `Failed to load benchmarks: ${benchmarksResult.error.message}` },
        { status: 500 },
      );
    }

    // experiment_log may not exist yet (migration not run) — gracefully handle
    const experiments = experimentsResult.error ? [] : (experimentsResult.data || []);

    return NextResponse.json({
      runs: runsResult.data || [],
      benchmarks: benchmarksResult.data || [],
      experiments,
      queriedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[ModelEvaluation GET]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST: Run evaluation or log experiment ──────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = (body.action as string) || 'run_evaluation';

    const supabase = getServerSupabase();

    if (action === 'log_experiment') {
      return await handleLogExperiment(supabase, body);
    }

    // Default: run_evaluation
    const notes = (body.notes as string) || '';
    const result = await runBenchmarkEvaluation(supabase, notes);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('[ModelEvaluation POST]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function handleLogExperiment(
  supabase: ReturnType<typeof getServerSupabase>,
  body: Record<string, unknown>,
) {
  const {
    experiment_name,
    experiment_type,
    description,
    model_version_before,
    model_version_after,
    features_changed,
    verdict,
    created_by,
    metrics_before,
    metrics_after,
  } = body as Record<string, any>;

  if (!experiment_name || !experiment_type) {
    return NextResponse.json(
      { error: 'experiment_name and experiment_type are required' },
      { status: 400 },
    );
  }

  // Auto-populate metrics_before from most recent eval run if not provided
  let finalMetricsBefore = metrics_before || null;
  let finalMetricsAfter = metrics_after || null;

  if (!finalMetricsBefore || !finalMetricsAfter) {
    const { data: recentRuns } = await supabase
      .from('evaluation_runs')
      .select('spearman_rho, mae, within_10_pct, tier_accuracy_pct, run_at')
      .order('run_at', { ascending: false })
      .limit(2);

    if (recentRuns && recentRuns.length >= 1 && !finalMetricsAfter) {
      finalMetricsAfter = {
        spearman_rho: recentRuns[0].spearman_rho,
        mae: recentRuns[0].mae,
        within_10: recentRuns[0].within_10_pct,
        tier_accuracy: recentRuns[0].tier_accuracy_pct,
      };
    }
    if (recentRuns && recentRuns.length >= 2 && !finalMetricsBefore) {
      finalMetricsBefore = {
        spearman_rho: recentRuns[1].spearman_rho,
        mae: recentRuns[1].mae,
        within_10: recentRuns[1].within_10_pct,
        tier_accuracy: recentRuns[1].tier_accuracy_pct,
      };
    }
  }

  // Compute delta
  let deltaObj: Record<string, number> | null = null;
  if (finalMetricsBefore && finalMetricsAfter) {
    deltaObj = {
      spearman_rho: round4(finalMetricsAfter.spearman_rho - finalMetricsBefore.spearman_rho),
      mae: round4(finalMetricsAfter.mae - finalMetricsBefore.mae),
      within_10: round4(finalMetricsAfter.within_10 - finalMetricsBefore.within_10),
      tier_accuracy: round4(finalMetricsAfter.tier_accuracy - finalMetricsBefore.tier_accuracy),
    };
  }

  const { data, error } = await supabase
    .from('experiment_log')
    .insert({
      experiment_name,
      experiment_type,
      description: description || null,
      model_version_before: model_version_before || null,
      model_version_after: model_version_after || null,
      metrics_before: finalMetricsBefore,
      metrics_after: finalMetricsAfter,
      delta: deltaObj,
      verdict: verdict || 'inconclusive',
      features_changed: features_changed || null,
      created_by: created_by || 'human',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: `Failed to save experiment: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, experiment: data });
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
