/**
 * Training Command Center — Video Drill-Down API
 *
 * GET /api/admin/training-command/video/[id]
 *
 * Returns prediction run data + all 4 checkpoint schedules for a single video.
 * The [id] is a prediction_run ID.
 */

import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  noStore();
  const supabase = getSupabase();
  const runId = params.id;

  try {
    // Fetch prediction run
    const { data: run, error: runErr } = await supabase
      .from('prediction_runs')
      .select('id, video_id, status, source, source_meta, niche, predicted_dps_7d, predicted_tier_7d, confidence, prediction_range_low, prediction_range_high, actual_dps, actual_tier, labeling_mode, components_used, creator_context_active, creator_stage, discovery_scan_run_id, created_at, completed_at')
      .eq('id', runId)
      .single();

    if (runErr || !run) {
      return NextResponse.json(
        { success: false, error: 'Prediction run not found' },
        { status: 404 },
      );
    }

    // Fetch all checkpoint schedules for this run
    const { data: schedules } = await supabase
      .from('metric_check_schedule')
      .select('id, check_type, scheduled_at, status, actual_metrics, completed_at, source, platform_video_id')
      .eq('prediction_run_id', runId)
      .order('scheduled_at');

    // Build progression view
    const checkpoints = ['4h', '24h', '48h', '7d'];
    const progression = checkpoints.map(ct => {
      const sched = (schedules || []).find((s: any) => s.check_type === ct);
      return {
        check_type: ct,
        scheduled_at: sched?.scheduled_at || null,
        status: sched?.status || 'not_scheduled',
        completed_at: sched?.completed_at || null,
        metrics: sched?.actual_metrics || null,
      };
    });

    return NextResponse.json({
      success: true,
      run,
      schedules: schedules || [],
      progression,
    });
  } catch (error: any) {
    console.error('[TrainingCommand:Video] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
