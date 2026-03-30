/**
 * Training Pipeline Status API
 *
 * GET /api/training/pipeline-status
 *
 * Returns automation health data for the training readiness UI:
 * - Last-run timestamps for each cron job
 * - Labeled video counts + growth rate
 * - Projected milestone dates
 * - Pending schedule count
 * - Latest Spearman evaluation
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function GET() {
  noStore();
  const supabase = getSupabase();

  try {
    // 1. Fetch job last-run timestamps
    const trainingJobs = [
      'discovery_scanner',
      'schedule_backfill',
      'metric_collector',
      'auto_labeler',
      'spearman_eval',
    ];
    const { data: jobRuns } = await supabase
      .from('integration_job_runs')
      .select('job, last_run')
      .in('job', trainingJobs);

    const jobs: Record<string, string | null> = {};
    for (const j of trainingJobs) {
      const found = (jobRuns || []).find((r: any) => r.job === j);
      jobs[j] = found ? (found as any).last_run : null;
    }

    // 2. Total labeled count (all labels, any version)
    const { count: totalLabeled } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null);

    // 2b. Trusted v2 labeled count — must explicitly match version LIKE '2%'
    const { count: v2TrustedCount } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .like('dps_formula_version', '2%')
      .neq('dps_label_trust', 'untrusted')
      .gt('dps_training_weight', 0);

    // 2c. Legacy (pre-v2) labeled count — includes both unarchived (NULL) and archived ('legacy_v1')
    const { count: legacyCount } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .or('dps_formula_version.is.null,dps_formula_version.eq.legacy_v1');

    // 3. Labeled in last 7 days
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: labeledLast7d } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .gte('actuals_entered_at', weekAgo);

    // 4. Labeled in last 30 days
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { count: labeledLast30d } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .gte('actuals_entered_at', monthAgo);

    // 5. Auto-labeled count (by labeling_mode)
    const { count: autoLabeledCount } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .eq('labeling_mode', 'auto_cron');

    // 6. Pending schedules
    const { count: pendingSchedules } = await supabase
      .from('metric_check_schedule')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'failed']);

    // 7. Completed schedules awaiting labeling
    const { data: completedScheds } = await supabase
      .from('metric_check_schedule')
      .select('prediction_run_id')
      .eq('status', 'completed');
    const runIdsWithMetrics = [
      ...new Set((completedScheds || []).map((s: any) => s.prediction_run_id)),
    ];
    let awaitingLabel = 0;
    if (runIdsWithMetrics.length > 0) {
      const { count } = await supabase
        .from('prediction_runs')
        .select('id', { count: 'exact', head: true })
        .in('id', runIdsWithMetrics)
        .is('actual_dps', null);
      awaitingLabel = count || 0;
    }

    // 8. Latest Spearman evaluation
    let latestEval: any = null;
    try {
      const { data: evalRows } = await supabase
        .from('vps_evaluation')
        .select('*')
        .order('computed_at', { ascending: false })
        .limit(1);
      if (evalRows && evalRows.length > 0) {
        latestEval = evalRows[0];
      }
    } catch {
      // Table may not exist yet
    }

    // 9. Compute projections
    const current = totalLabeled || 0;
    const weeklyRate = labeledLast7d || 0;
    // Use 30-day weekly average for more stable projection
    const weeklyAvg30d = (labeledLast30d || 0) / 4.3;

    const projectRate = weeklyAvg30d > 0 ? weeklyAvg30d : weeklyRate;

    function projectWeeks(target: number): number | null {
      if (current >= target) return 0;
      if (projectRate <= 0) return null;
      return Math.ceil((target - current) / projectRate);
    }

    function projectDate(weeks: number | null): string | null {
      if (weeks === null || weeks === 0) return weeks === 0 ? 'reached' : null;
      const d = new Date(Date.now() + weeks * 7 * 24 * 3600 * 1000);
      return d.toISOString().slice(0, 10);
    }

    const weeksTo100 = projectWeeks(100);
    const weeksTo300 = projectWeeks(300);
    const weeksTo500 = projectWeeks(500);

    return NextResponse.json({
      success: true,
      pipeline: {
        jobs,
        labeled: {
          total: current,
          v2_trusted: v2TrustedCount || 0,
          legacy: legacyCount || 0,
          auto_cron: autoLabeledCount || 0,
          last_7d: labeledLast7d || 0,
          last_30d: labeledLast30d || 0,
          weekly_rate: Math.round(projectRate * 10) / 10,
        },
        schedules: {
          pending: pendingSchedules || 0,
          awaiting_label: awaitingLabel,
        },
        milestones: {
          target_100: {
            current,
            remaining: Math.max(0, 100 - current),
            est_weeks: weeksTo100,
            est_date: projectDate(weeksTo100),
          },
          target_300: {
            current,
            remaining: Math.max(0, 300 - current),
            est_weeks: weeksTo300,
            est_date: projectDate(weeksTo300),
          },
          target_500: {
            current,
            remaining: Math.max(0, 500 - current),
            est_weeks: weeksTo500,
            est_date: projectDate(weeksTo500),
          },
        },
        latest_evaluation: latestEval,
      },
    });
  } catch (error: any) {
    console.error('[PipelineStatus] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
