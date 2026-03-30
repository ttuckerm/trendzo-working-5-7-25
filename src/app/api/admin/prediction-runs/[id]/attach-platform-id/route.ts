/**
 * Phase 82: Training Ingest v1 — POST /api/admin/prediction-runs/[id]/attach-platform-id
 *
 * Attach a platform video ID to a prediction run after the fact.
 * Persists the TikTok URL to:
 *  1. prediction_runs.source_meta.post_url (canonical storage)
 *  2. metric_check_schedule.platform_video_id (all rows for this run)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import type { AttachPlatformIdRequest, AttachPlatformIdResponse } from '@/lib/training/training-ingest-types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Admin auth gate
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body: AttachPlatformIdRequest = await request.json();
    const { platform, platform_video_id } = body;

    if (!platform || !platform_video_id) {
      return NextResponse.json(
        { error: 'platform and platform_video_id are required' },
        { status: 400 }
      );
    }

    // Validate: must be a full TikTok URL containing /video/
    const trimmedUrl = platform_video_id.trim();
    if (!trimmedUrl.startsWith('http') || !trimmedUrl.includes('/video/')) {
      return NextResponse.json(
        { error: 'Paste full TikTok URL (e.g. https://www.tiktok.com/@user/video/1234567890)' },
        { status: 400 }
      );
    }

    const runId = params.id;

    // 1. Persist to prediction_runs.source_meta.post_url (merge into existing JSONB)
    const { data: runData, error: runErr } = await supabase
      .from('prediction_runs')
      .select('source_meta, video_id')
      .eq('id', runId)
      .single();

    if (runErr) {
      console.error('[AttachPlatformId] Failed to fetch run:', runErr);
      return NextResponse.json(
        { error: `Run not found: ${runErr.message}` },
        { status: 404 }
      );
    }

    const existingMeta = (runData as any)?.source_meta || {};
    const updatedMeta = {
      ...existingMeta,
      post_url: platform_video_id,
      platformVideoId: platform_video_id,
    };

    const { error: metaErr } = await supabase
      .from('prediction_runs')
      .update({ source_meta: updatedMeta })
      .eq('id', runId);

    if (metaErr) {
      console.error('[AttachPlatformId] Failed to update source_meta:', metaErr);
      return NextResponse.json(
        { error: `Failed to update source_meta: ${metaErr.message}` },
        { status: 500 }
      );
    }

    console.log(`[AttachPlatformId] Persisted post_url to source_meta for run ${runId}: ${platform_video_id}`);

    // 2. Update ALL metric_check_schedule rows for this run where platform_video_id
    //    is NULL or contains an internal UUID (not a real TikTok URL)
    const { data: schedules, error: schedErr } = await supabase
      .from('metric_check_schedule')
      .select('id, platform_video_id')
      .eq('prediction_run_id', runId);

    if (schedErr) {
      console.error('[AttachPlatformId] Failed to fetch schedules:', schedErr);
      return NextResponse.json(
        { error: `Failed to fetch schedules: ${schedErr.message}` },
        { status: 500 }
      );
    }

    // Filter to rows needing update: NULL or UUID-valued platform_video_id
    const idsToUpdate = (schedules || [])
      .filter((s: any) => !s.platform_video_id || UUID_RE.test(s.platform_video_id))
      .map((s: any) => s.id);

    let updatedCount = 0;
    if (idsToUpdate.length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from('metric_check_schedule')
        .update({
          platform,
          platform_video_id,
        })
        .in('id', idsToUpdate)
        .select('id');

      if (updateErr) {
        console.error('[AttachPlatformId] Failed to update schedules:', updateErr);
        return NextResponse.json(
          { error: `Failed to update schedules: ${updateErr.message}` },
          { status: 500 }
        );
      }
      updatedCount = updated?.length ?? 0;
    }

    // 3. If NO schedule rows exist for this run, create them now
    if (!schedules || schedules.length === 0) {
      const { createMetricSchedules } = await import('@/lib/training/metric-scheduler');
      const videoId: string = (runData as any)?.video_id;
      if (videoId) {
        const created = await createMetricSchedules(runId, videoId, {
          platform,
          platformVideoId: platform_video_id,
        });
        console.log(`[AttachPlatformId] Created ${created} new schedule rows for run ${runId}`);
        updatedCount = created;
      } else {
        console.warn(`[AttachPlatformId] No video_id found for run ${runId} — cannot create schedules`);
      }
    }

    // Count total schedule rows after create/update
    const { count: scheduleCount } = await supabase
      .from('metric_check_schedule')
      .select('id', { count: 'exact', head: true })
      .eq('prediction_run_id', runId);

    const response: AttachPlatformIdResponse = {
      updated_count: updatedCount,
      post_url: platform_video_id,
      schedule_count: scheduleCount ?? 0,
    };

    console.log(`[AttachPlatformId] Updated ${updatedCount} schedule rows for run ${runId}`);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[AttachPlatformId] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
