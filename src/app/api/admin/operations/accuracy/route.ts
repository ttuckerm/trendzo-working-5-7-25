/**
 * Accuracy Visualization API
 *
 * GET /api/admin/operations/accuracy
 *
 * Returns prediction accuracy data:
 * - Overview metrics (Spearman rho, MAE, within-range %)
 * - Scatter plot data (predicted vs actual VPS)
 * - Per-niche breakdown
 * - Historical evaluation trend
 * - Milestone projections (50/100/300/500 labeled)
 * - Worst predictions (top 10 by absolute error)
 */

import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase-server';
import { unstable_noStore as noStore } from 'next/cache';
import { computeLabelBreakdown, type LabelCategoryBreakdown } from '@/lib/training/training-eligibility';

export const dynamic = 'force-dynamic';

// ─── Types ──────────────────────────────────────────────────────────────────

interface OverviewMetrics {
  spearman_rho: number | null;
  p_value: number | null;
  n: number;
  mae: number | null;
  within_range_pct: number | null;
  computed_at: string | null;
}

interface ScatterPoint {
  run_id: string;
  predicted_vps: number;
  actual_vps: number;
  prediction_error: number;
  within_range: boolean;
  niche: string | null;
  created_at: string;
}

interface NicheAccuracy {
  niche: string;
  n: number;
  spearman_rho: number;
  mae: number;
  within_range_pct: number;
}

interface EvaluationSnapshot {
  computed_at: string;
  n: number;
  spearman_rho: number;
  mae: number;
  within_range_pct: number;
}

interface MilestoneTarget {
  target: number;
  remaining: number;
  est_weeks: number | null;
  est_date: string | null;
  trigger_label: string;
}

interface WorstPrediction {
  run_id: string;
  predicted_vps: number;
  actual_vps: number;
  abs_error: number;
  niche: string | null;
  created_at: string;
}

interface AccuracyResponse {
  overview: OverviewMetrics;
  scatterPoints: ScatterPoint[];
  byNiche: NicheAccuracy[];
  evaluationHistory: EvaluationSnapshot[];
  milestones: {
    current: number;
    weekly_rate: number;
    targets: MilestoneTarget[];
  };
  worstPredictions: WorstPrediction[];
  queriedAt: string;
}

// ─── Milestone definitions (per audit decisions D1-D3) ──────────────────────

const MILESTONE_TARGETS = [
  { target: 50, trigger_label: 'D3: Cohort-aware baselines' },
  { target: 100, trigger_label: 'D1/D2: Retrain XGBoost + Efficacy eval' },
  { target: 300, trigger_label: 'Per-niche modeling' },
  { target: 500, trigger_label: 'Full production confidence' },
];

// ─── Projection helpers (from pipeline-status pattern) ──────────────────────

function projectWeeks(current: number, rate: number, target: number): number | null {
  if (current >= target) return 0;
  if (rate <= 0) return null;
  return Math.ceil((target - current) / rate);
}

function projectDate(weeks: number | null): string | null {
  if (weeks === null) return null;
  if (weeks === 0) return 'reached';
  const d = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// ─── GET handler ────────────────────────────────────────────────────────────

export async function GET() {
  noStore();

  try {
    const supabase = getServerSupabase();

    // 1. Fetch all labeled prediction runs with v2 provenance columns
    const { data: labeledRuns, error: runsError } = await supabase
      .from('prediction_runs')
      .select('id, predicted_dps_7d, actual_dps, prediction_error, within_range, created_at, video_id, dps_formula_version, dps_label_trust, dps_training_weight')
      .not('actual_dps', 'is', null)
      .not('predicted_dps_7d', 'is', null)
      .order('created_at', { ascending: false });

    if (runsError) {
      console.error('[accuracy] Failed to fetch labeled runs:', runsError);
      return NextResponse.json({ error: 'Failed to query prediction runs' }, { status: 500 });
    }

    const runs = (labeledRuns || []) as any[];

    // 2. Batch-fetch niche info from video_files
    const videoIds = [...new Set(runs.map(r => r.video_id).filter(Boolean))];
    let nicheMap = new Map<string, string>();
    if (videoIds.length > 0) {
      const { data: videoFiles } = await supabase
        .from('video_files')
        .select('id, niche')
        .in('id', videoIds);
      nicheMap = new Map((videoFiles || []).map((v: any) => [v.id, v.niche || 'Unknown']));
    }

    // 3. Build scatter points
    const scatterPoints: ScatterPoint[] = runs.map(r => ({
      run_id: r.id,
      predicted_vps: Number(r.predicted_dps_7d),
      actual_vps: Number(r.actual_dps),
      prediction_error: Number(r.prediction_error || 0),
      within_range: Boolean(r.within_range),
      niche: nicheMap.get(r.video_id) || null,
      created_at: r.created_at,
    }));

    // 4. Build worst predictions (top 10 by absolute error)
    const worstPredictions: WorstPrediction[] = [...scatterPoints]
      .sort((a, b) => Math.abs(b.prediction_error) - Math.abs(a.prediction_error))
      .slice(0, 10)
      .map(p => ({
        run_id: p.run_id,
        predicted_vps: p.predicted_vps,
        actual_vps: p.actual_vps,
        abs_error: Math.abs(p.prediction_error),
        niche: p.niche,
        created_at: p.created_at,
      }));

    // 5. Fetch all vps_evaluation rows for historical trend
    let evaluationHistory: EvaluationSnapshot[] = [];
    let overview: OverviewMetrics = {
      spearman_rho: null,
      p_value: null,
      n: scatterPoints.length,
      mae: null,
      within_range_pct: null,
      computed_at: null,
    };
    let byNiche: NicheAccuracy[] = [];

    try {
      const { data: evalRows } = await supabase
        .from('vps_evaluation')
        .select('computed_at, n, spearman_rho, p_value, mae, within_range_pct, by_niche')
        .order('computed_at', { ascending: true });

      if (evalRows && evalRows.length > 0) {
        evaluationHistory = evalRows.map((e: any) => ({
          computed_at: e.computed_at,
          n: e.n,
          spearman_rho: e.spearman_rho,
          mae: e.mae,
          within_range_pct: e.within_range_pct,
        }));

        // Latest evaluation provides overview + by_niche
        const latest = evalRows[evalRows.length - 1] as any;
        overview = {
          spearman_rho: latest.spearman_rho,
          p_value: latest.p_value,
          n: scatterPoints.length, // Use live count, not eval's snapshot
          mae: latest.mae,
          within_range_pct: latest.within_range_pct,
          computed_at: latest.computed_at,
        };

        if (Array.isArray(latest.by_niche)) {
          byNiche = latest.by_niche as NicheAccuracy[];
        }
      }
    } catch {
      // vps_evaluation table may not exist yet
    }

    // 6. Milestone projections
    const totalLabeled = scatterPoints.length;

    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: labeledLast7d } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .gte('actuals_entered_at', weekAgo);

    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count: labeledLast30d } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .gte('actuals_entered_at', monthAgo);

    const weeklyAvg30d = (labeledLast30d || 0) / 4.3;
    const weeklyRate = weeklyAvg30d > 0 ? weeklyAvg30d : (labeledLast7d || 0);
    const roundedRate = Math.round(weeklyRate * 10) / 10;

    const targets: MilestoneTarget[] = MILESTONE_TARGETS.map(m => {
      const weeks = projectWeeks(totalLabeled, weeklyRate, m.target);
      return {
        target: m.target,
        remaining: Math.max(0, m.target - totalLabeled),
        est_weeks: weeks,
        est_date: projectDate(weeks),
        trigger_label: m.trigger_label,
      };
    });

    // 7. Compute label category breakdown
    const labelBreakdown: LabelCategoryBreakdown = computeLabelBreakdown(runs);

    // 8. Assemble response
    const response: AccuracyResponse & { labelBreakdown: LabelCategoryBreakdown } = {
      overview,
      scatterPoints,
      byNiche,
      evaluationHistory,
      milestones: {
        current: totalLabeled,
        weekly_rate: roundedRate,
        targets,
      },
      worstPredictions,
      labelBreakdown,
      queriedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[accuracy] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
