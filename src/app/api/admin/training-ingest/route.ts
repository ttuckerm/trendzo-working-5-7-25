/**
 * Phase 82: Training Ingest v1 — POST /api/admin/training-ingest
 *
 * Blind ingest endpoint: accepts a video + metadata, runs the canonical
 * prediction pipeline, and schedules metric collection at 4h/24h/48h/7d.
 *
 * Response intentionally omits prediction internals (DPS, tier, confidence,
 * component details) — only returns run_id, video_id, schedule_count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { TRAINING_INGEST_ENABLED } from '@/lib/training/feature-availability-matrix';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { createMetricSchedules } from '@/lib/training/metric-scheduler';
import type { TrainingIngestResponse } from '@/lib/training/training-ingest-types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

export async function POST(request: NextRequest) {
  // 1. Admin auth gate
  const auth = await verifyAdminAuth(request);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  // 2. Feature flag gate
  if (!TRAINING_INGEST_ENABLED()) {
    return NextResponse.json(
      { error: 'Training ingest is not enabled' },
      { status: 403 }
    );
  }

  try {
    // 3. Parse FormData
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const transcript = formData.get('transcript') as string | null;
    const niche = formData.get('niche') as string;
    const goal = formData.get('goal') as string;
    const accountSize = formData.get('accountSize') as string;
    const platform = (formData.get('platform') as string) || 'tiktok';
    const platformVideoId = formData.get('platformVideoId') as string | null;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'videoFile is required' },
        { status: 400 }
      );
    }

    if (!niche || !goal || !accountSize) {
      return NextResponse.json(
        { error: 'Missing required fields: niche, goal, accountSize' },
        { status: 400 }
      );
    }

    // 4. Save MP4 (same pattern as /api/kai/predict)
    const videoDir = join(process.cwd(), 'data', 'raw_videos');
    if (!existsSync(videoDir)) {
      await mkdir(videoDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `kai_${timestamp}.mp4`;
    const storagePath = join('data', 'raw_videos', filename);
    const videoPath = join(process.cwd(), storagePath);

    const bytes = await videoFile.arrayBuffer();
    await writeFile(videoPath, Buffer.from(bytes));
    console.log(`[TrainingIngest] Saved video: ${storagePath}`);

    // 5. Create video_files row (same pattern as /api/kai/predict)
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        storage_path: storagePath,
        niche,
        goal,
        account_size_band: accountSize,
        platform,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      return NextResponse.json(
        { error: `Failed to save video record: ${insertError?.message}` },
        { status: 500 }
      );
    }

    console.log(`[TrainingIngest] Created video record: ${videoRecord.id}`);

    // 6. Run canonical prediction pipeline (with contamination lock: clean ingest)
    const pipelineResult = await runPredictionPipeline(videoRecord.id, {
      mode: 'standard',
      videoFilePath: videoPath,
      transcript: transcript || undefined,
      niche: niche || undefined,
      goal: goal || undefined,
      accountSize: accountSize || undefined,
      source: 'training_ingest',
      ingestMode: 'clean',
      sourceMeta: {
        platform,
        platformVideoId: platformVideoId || null,
        ingest_timestamp: new Date().toISOString(),
      },
    });

    // 7. Create metric schedules
    let scheduleCount = 0;
    let scheduleError: string | null = null;
    try {
      scheduleCount = await createMetricSchedules(
        pipelineResult.run_id,
        videoRecord.id,
        {
          platform,
          platformVideoId: platformVideoId || undefined,
        }
      );
    } catch (schedErr: any) {
      // Don't fail the whole ingest — the prediction ran successfully.
      // Return partial success with schedule_error so the UI can show it.
      scheduleError = schedErr.message || String(schedErr);
      console.error('[TrainingIngest] Schedule creation failed:', scheduleError);
    }

    // 8. Return response — NO prediction internals (but include contamination proof)
    const response: TrainingIngestResponse = {
      run_id: pipelineResult.run_id,
      video_id: videoRecord.id,
      schedule_count: scheduleCount,
      platform_video_id_attached: !!platformVideoId,
      ...(scheduleError ? { schedule_error: scheduleError } : {}),
      contamination_proof: pipelineResult.contamination_proof ?? null,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    const msg = error.message || String(error) || 'Unknown error';
    console.error('[TrainingIngest] Error:', msg, error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
