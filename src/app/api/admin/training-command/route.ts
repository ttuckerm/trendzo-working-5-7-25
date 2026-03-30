/**
 * Training Command Center — Main Data API
 *
 * GET /api/admin/training-command
 *
 * Returns full command center state: scan configs, recent runs,
 * schedule breakdown, labeled counts, Spearman eval, and cost data.
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
    // 1. All scan configs
    const { data: configs } = await supabase
      .from('discovery_scan_config')
      .select('*')
      .order('niche_key');

    // 2. Recent scan runs (last 50)
    const { data: recentRuns } = await supabase
      .from('discovery_scan_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50);

    // 3. Schedule breakdown by status
    const { data: scheduleRows } = await supabase
      .from('metric_check_schedule')
      .select('status, source');

    const scheduleBreakdown = {
      pending: 0,
      completed: 0,
      failed: 0,
      by_source: {} as Record<string, { pending: number; completed: number; failed: number }>,
    };
    for (const row of (scheduleRows || []) as any[]) {
      const status = row.status as string;
      const source = row.source || 'manual';
      if (status === 'pending' || status === 'scheduled') scheduleBreakdown.pending++;
      else if (status === 'completed') scheduleBreakdown.completed++;
      else if (status === 'failed') scheduleBreakdown.failed++;

      if (!scheduleBreakdown.by_source[source]) {
        scheduleBreakdown.by_source[source] = { pending: 0, completed: 0, failed: 0 };
      }
      if (status === 'pending' || status === 'scheduled') scheduleBreakdown.by_source[source].pending++;
      else if (status === 'completed') scheduleBreakdown.by_source[source].completed++;
      else if (status === 'failed') scheduleBreakdown.by_source[source].failed++;
    }

    // 4. Labeled counts
    const { count: totalLabeled } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null);

    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { count: labeledLast7d } = await supabase
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .gte('actuals_entered_at', weekAgo);

    // 5. Latest Spearman evaluation
    let latestEval: any = null;
    try {
      const { data: evalRows } = await supabase
        .from('vps_evaluation')
        .select('*')
        .order('computed_at', { ascending: false })
        .limit(1);
      if (evalRows?.length) latestEval = evalRows[0];
    } catch {}

    // 6. Apify cost summary (last 7 days)
    const costSince = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: costRuns } = await supabase
      .from('discovery_scan_runs')
      .select('started_at, apify_calls_made, niche_key')
      .gte('started_at', costSince);

    let totalApifyCalls7d = 0;
    const costByDay: Record<string, number> = {};
    for (const run of (costRuns || []) as any[]) {
      totalApifyCalls7d += run.apify_calls_made || 0;
      const day = (run.started_at || '').slice(0, 10);
      if (day) costByDay[day] = (costByDay[day] || 0) + (run.apify_calls_made || 0);
    }

    // 7. Video tracker — recent prediction runs with checkpoint status
    const { data: trackerRuns } = await supabase
      .from('prediction_runs')
      .select('id, video_id, niche, source, predicted_dps_7d, predicted_tier_7d, confidence, actual_dps, actual_tier, labeling_mode, created_at')
      .in('source', ['discovery_scan', 'creator_predict', 'api'])
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch all schedules for these runs in one query
    const trackerRunIds = (trackerRuns || []).map((r: any) => r.id);
    let trackerSchedules: any[] = [];
    if (trackerRunIds.length > 0) {
      const { data: scheds } = await supabase
        .from('metric_check_schedule')
        .select('prediction_run_id, check_type, status, actual_metrics, scheduled_at, completed_at, platform_video_id')
        .in('prediction_run_id', trackerRunIds);
      trackerSchedules = scheds || [];
    }

    // Build tracker rows with checkpoint progression
    const videoTracker = (trackerRuns || []).map((run: any) => {
      const runScheds = trackerSchedules.filter((s: any) => s.prediction_run_id === run.id);
      const checkpoints: Record<string, any> = {};
      for (const ct of ['4h', '24h', '48h', '7d']) {
        const sched = runScheds.find((s: any) => s.check_type === ct);
        checkpoints[ct] = sched
          ? { status: sched.status, metrics: sched.actual_metrics, completed_at: sched.completed_at }
          : { status: 'not_scheduled', metrics: null, completed_at: null };
      }
      const tiktokUrl = runScheds.find((s: any) => s.platform_video_id)?.platform_video_id || null;
      return { ...run, checkpoints, tiktok_url: tiktokUrl };
    });

    // 8. Job last-run timestamps
    const { data: jobRuns } = await supabase
      .from('integration_job_runs')
      .select('job, last_run')
      .in('job', ['discovery_scanner', 'schedule_backfill', 'metric_collector', 'auto_labeler', 'spearman_eval']);

    const jobs: Record<string, string | null> = {};
    for (const j of (jobRuns || []) as any[]) {
      jobs[j.job] = j.last_run;
    }

    return NextResponse.json({
      success: true,
      configs: configs || [],
      recent_runs: recentRuns || [],
      schedules: scheduleBreakdown,
      labeled: {
        total: totalLabeled || 0,
        last_7d: labeledLast7d || 0,
      },
      latest_evaluation: latestEval,
      cost: {
        total_apify_calls_7d: totalApifyCalls7d,
        by_day: costByDay,
      },
      jobs,
      video_tracker: videoTracker,
    });
  } catch (error: any) {
    console.error('[TrainingCommand] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
