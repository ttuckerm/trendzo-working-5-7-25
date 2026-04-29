/**
 * Feature #3: Metric Schedule API — GET + POST /api/admin/metric-schedule
 *
 * GET: List schedule summaries for the Metric Checks UI panel.
 * POST: Create schedules for a given prediction run on demand.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { METRIC_COLLECTOR_ENABLED } from '@/lib/training/feature-availability-matrix';
import { createMetricSchedules, extractTikTokUrl } from '@/lib/training/metric-scheduler';
import type { MetricScheduleSummary, MetricCheckType } from '@/lib/training/training-ingest-types';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

/**
 * GET /api/admin/metric-schedule?limit=30
 *
 * Returns per-run schedule summaries for the UI panel.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!METRIC_COLLECTOR_ENABLED()) {
    return NextResponse.json(
      { error: 'Metric collector is not enabled' },
      { status: 403 },
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);
    const supabase = getSupabase();

    // Fetch all schedule rows, ordered by most recent runs
    const { data: schedules, error: schedErr } = await supabase
      .from('metric_check_schedule')
      .select('prediction_run_id, video_id, platform_video_id, check_type, status, completed_at, actual_metrics, scheduled_at')
      .order('created_at', { ascending: false })
      .limit(limit * 4); // Up to 4 rows per run

    if (schedErr) {
      return NextResponse.json({ error: schedErr.message }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ summaries: [] });
    }

    // Get unique run IDs (preserve order)
    const runIds: string[] = [];
    const seen = new Set<string>();
    for (const s of schedules) {
      if (!seen.has(s.prediction_run_id)) {
        seen.add(s.prediction_run_id);
        runIds.push(s.prediction_run_id);
      }
    }
    const limitedRunIds = runIds.slice(0, limit);

    // Fetch prediction_runs for these IDs
    const { data: runs } = await supabase
      .from('prediction_runs')
      .select('id, created_at, actuals_entered_at, contamination_lock')
      .in('id', limitedRunIds);

    // Fetch video_files for niche
    const videoIds = [...new Set(schedules.map((s: any) => s.video_id))];
    const { data: videos } = await supabase
      .from('video_files')
      .select('id, niche')
      .in('id', videoIds);

    // Build lookup maps
    const runMap = new Map((runs || []).map((r: any) => [r.id, r]));
    const videoMap = new Map((videos || []).map((v: any) => [v.id, v]));

    // Build per-run summaries
    const summaries: MetricScheduleSummary[] = limitedRunIds.map((runId) => {
      const runSchedules = schedules.filter((s: any) => s.prediction_run_id === runId);
      const run = runMap.get(runId);
      const firstSched = runSchedules[0];
      const video = firstSched ? videoMap.get(firstSched.video_id) : null;

      const checks: MetricScheduleSummary['checks'] = {
        '4h': null,
        '24h': null,
        '48h': null,
        '7d': null,
      };

      for (const s of runSchedules) {
        const ct = s.check_type as MetricCheckType;
        if (checks[ct] !== undefined) {
          const metrics = s.actual_metrics as Record<string, any> | null;
          checks[ct] = {
            status: s.status,
            completed_at: s.completed_at,
            views: metrics?.views ?? null,
          };
        }
      }

      return {
        prediction_run_id: runId,
        video_id: firstSched?.video_id || '',
        platform_video_id: firstSched?.platform_video_id || null,
        niche: video?.niche || null,
        created_at: run?.created_at || '',
        has_actuals: !!run?.actuals_entered_at,
        contamination_lock: run?.contamination_lock ?? null,
        checks,
      };
    });

    return NextResponse.json({ summaries });
  } catch (error: any) {
    console.error('[MetricScheduleAPI] GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/metric-schedule
 * Body: { run_id: string, platform_video_id?: string }
 *
 * Creates metric collection schedules for a given run.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!METRIC_COLLECTOR_ENABLED()) {
    return NextResponse.json(
      { error: 'Metric collector is not enabled' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { run_id, platform_video_id } = body;

    if (!run_id) {
      return NextResponse.json({ error: 'run_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Look up the run to get video_id
    const { data: run, error: runErr } = await supabase
      .from('prediction_runs')
      .select('id, video_id, source_meta')
      .eq('id', run_id)
      .single();

    if (runErr || !run) {
      return NextResponse.json(
        { error: `Run not found: ${runErr?.message || 'unknown'}` },
        { status: 404 },
      );
    }

    // Resolve platform_video_id — prefer caller-provided, then source_meta, then existing schedules
    let resolvedPlatformVideoId = platform_video_id || null;

    if (!resolvedPlatformVideoId) {
      // Try all source_meta keys (post_url, platform_url, platformVideoId, tiktok_url)
      resolvedPlatformVideoId = extractTikTokUrl(run.source_meta as Record<string, any> | null);
    }

    if (!resolvedPlatformVideoId) {
      // Try existing schedule rows
      const { data: existingSched } = await supabase
        .from('metric_check_schedule')
        .select('platform_video_id')
        .eq('prediction_run_id', run_id)
        .not('platform_video_id', 'is', null)
        .limit(1);

      if (existingSched && existingSched.length > 0) {
        resolvedPlatformVideoId = (existingSched[0] as any).platform_video_id;
      }
    }

    // createMetricSchedules will also try source_meta as a last resort
    const scheduleCount = await createMetricSchedules(run_id, (run as any).video_id, {
      platformVideoId: resolvedPlatformVideoId || undefined,
    });

    return NextResponse.json({
      schedule_count: scheduleCount,
      platform_video_id_used: resolvedPlatformVideoId,
    });
  } catch (error: any) {
    console.error('[MetricScheduleAPI] POST error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
