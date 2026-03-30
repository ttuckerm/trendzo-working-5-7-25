/**
 * Phase 82: Training Ingest v1 — GET /api/admin/prediction-runs
 *
 * List recent training ingest runs with their metric schedule summaries.
 * No prediction internals (DPS, tier, confidence, components) are returned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { TrainingRunSummary } from '@/lib/training/training-ingest-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

export async function GET(request: NextRequest) {
  // Admin auth gate
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Fetch training ingest runs (no prediction internals)
    const { data: runs, error: runsError } = await supabase
      .from('prediction_runs')
      .select('id, video_id, created_at, source, source_meta, contamination_lock, contamination_proof, ingest_mode')
      .eq('source', 'training_ingest')
      .order('created_at', { ascending: false })
      .limit(50);

    if (runsError) {
      return NextResponse.json(
        { error: `Failed to fetch runs: ${runsError.message}` },
        { status: 500 }
      );
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json([]);
    }

    // Check if detail=true to include full schedule rows
    const includeDetail = request.nextUrl.searchParams.get('detail') === 'true';

    // Fetch all schedules for these runs in one query
    const runIds = runs.map((r) => r.id);
    const scheduleSelect = includeDetail
      ? 'id, prediction_run_id, video_id, platform, platform_video_id, check_type, scheduled_at, status, actual_metrics, completed_at, created_at'
      : 'prediction_run_id, status, platform_video_id';

    const { data: schedules, error: schedError } = await supabase
      .from('metric_check_schedule')
      .select(scheduleSelect)
      .in('prediction_run_id', runIds)
      .order('scheduled_at', { ascending: true }) as { data: any[] | null; error: any };

    if (schedError) {
      console.error('[PredictionRuns] Schedule fetch error:', schedError);
    }

    // Also fetch niche from video_files
    const videoIds = runs.map((r) => r.video_id);
    const { data: videos } = await supabase
      .from('video_files')
      .select('id, niche')
      .in('id', videoIds);

    const nicheMap = new Map(videos?.map((v) => [v.id, v.niche]) ?? []);

    // Build schedule summary + optional detail per run
    const scheduleMap = new Map<string, { total: number; pending: number; completed: number; failed: number; platform_video_id: string | null }>();
    const scheduleDetailMap = new Map<string, any[]>();

    for (const runId of runIds) {
      scheduleMap.set(runId, { total: 0, pending: 0, completed: 0, failed: 0, platform_video_id: null });
      if (includeDetail) scheduleDetailMap.set(runId, []);
    }

    if (schedules) {
      for (const s of schedules) {
        const entry = scheduleMap.get(s.prediction_run_id);
        if (entry) {
          entry.total++;
          if (s.status === 'pending') entry.pending++;
          if (s.status === 'completed') entry.completed++;
          if (s.status === 'failed') entry.failed++;
          if (s.platform_video_id) entry.platform_video_id = s.platform_video_id;
        }
        if (includeDetail) {
          scheduleDetailMap.get(s.prediction_run_id)?.push(s);
        }
      }
    }

    // Resolve platform_video_id with priority: source_meta > schedule rows
    // source_meta is canonical (written by attach-platform-id), schedule rows may lag
    for (const run of runs) {
      const entry = scheduleMap.get(run.id);
      if (!entry) continue;
      const meta = run.source_meta as Record<string, any> | null;
      const metaUrl = meta?.post_url || meta?.platform_url || null;
      if (metaUrl) {
        if (!entry.platform_video_id) {
          console.log(`[PredictionRuns] source_meta fallback for run ${run.id}: ${metaUrl} (0 schedule rows had a URL)`);
        }
        entry.platform_video_id = metaUrl;
      }
      // If source_meta has nothing, schedule row value (if any) remains as-is
    }

    // Assemble response
    const response: TrainingRunSummary[] = runs.map((run) => ({
      run_id: run.id,
      video_id: run.video_id,
      niche: nicheMap.get(run.video_id) ?? null,
      created_at: run.created_at,
      source: run.source,
      source_meta: run.source_meta,
      schedules: scheduleMap.get(run.id) ?? { total: 0, pending: 0, completed: 0, failed: 0, platform_video_id: null },
      ...(includeDetail ? { schedule_rows: scheduleDetailMap.get(run.id) ?? [] } : {}),
      contamination_lock: (run as any).contamination_lock ?? undefined,
      contamination_proof: (run as any).contamination_proof ?? undefined,
      ingest_mode: (run as any).ingest_mode ?? undefined,
    }));

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[PredictionRuns] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
