/**
 * VPS v2 Prediction API — XGBoost sole score producer
 *
 * POST /api/predict/v2
 *
 * Accepts FormData with video file and/or transcript.
 * Runs extractPredictionFeatures → predictXGBoostV10 directly.
 * No KaiOrchestrator, no multi-path averaging, no LLM consensus gate.
 *
 * Writes a prediction_runs row with score_version: 'vps-v2-xgboost-sole'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { runVpsPipelineV2 } from '@/lib/prediction/run-vps-pipeline-v2';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  },
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Parse FormData ────────────────────────────────────────────────────
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const transcript = formData.get('transcript') as string | null;
    const niche = formData.get('niche') as string | null;
    const caption = formData.get('caption') as string | null;
    const goal = formData.get('goal') as string | null;
    const followerCountStr = formData.get('followerCount') as string | null;
    const accountSize = formData.get('accountSize') as string | null;

    if (!videoFile && !transcript) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile or transcript is required' },
        { status: 400 },
      );
    }

    const followerCount =
      followerCountStr && parseInt(followerCountStr) > 0
        ? parseInt(followerCountStr)
        : undefined;

    // ── Save video to temp location ───────────────────────────────────────
    let videoPath: string | null = null;
    let storagePath: string | null = null;

    if (videoFile) {
      const videoDir = join(process.cwd(), 'data', 'raw_videos');
      if (!existsSync(videoDir)) {
        await mkdir(videoDir, { recursive: true });
      }
      const timestamp = Date.now();
      const filename = `vps2_${timestamp}.mp4`;
      storagePath = join('data', 'raw_videos', filename);
      videoPath = join(process.cwd(), storagePath);

      const bytes = await videoFile.arrayBuffer();
      await writeFile(videoPath, Buffer.from(bytes));
      console.log(`[VPS v2] Saved video: ${storagePath}`);
    }

    // ── Insert video_files row ────────────────────────────────────────────
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        storage_path: storagePath,
        niche: niche || 'side_hustles',
        goal: goal || 'engagement',
        account_size_band: accountSize || 'medium (10K-100K)',
        platform: 'tiktok',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      return NextResponse.json(
        { success: false, error: `Failed to save video record: ${insertError?.message}` },
        { status: 500 },
      );
    }

    // ── Insert prediction_runs row (pending) ──────────────────────────────
    const { data: runRecord, error: runInsertError } = await supabase
      .from('prediction_runs')
      .insert({
        video_id: videoRecord.id,
        status: 'running',
        score_version: 'vps-v2-xgboost-sole',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (runInsertError || !runRecord) {
      return NextResponse.json(
        { success: false, error: `Failed to create prediction run: ${runInsertError?.message}` },
        { status: 500 },
      );
    }

    const runId = runRecord.id;
    console.log(`[VPS v2] Created run ${runId} for video ${videoRecord.id}`);

    // ── Run VPS v2 pipeline ───────────────────────────────────────────────
    const result = await runVpsPipelineV2({
      videoFilePath: videoPath || undefined,
      transcript: transcript || undefined,
      niche: niche || undefined,
      followerCount,
      caption: caption || undefined,
    });

    const totalLatencyMs = Date.now() - startTime;

    // ── Finalize prediction_runs row ──────────────────────────────────────
    const { error: updateError } = await supabase
      .from('prediction_runs')
      .update({
        status: 'completed',
        predicted_dps_7d: result.vps,
        predicted_tier_7d: getVpsTierLabel(result.vps),
        confidence: 0.75,
        components_used: ['xgboost-virality-ml'],
        latency_ms_total: totalLatencyMs,
        score_version: 'vps-v2-xgboost-sole',
        raw_result: {
          vps: result.vps,
          raw_prediction: result.raw_prediction,
          model_version: result.model_version,
          features_provided: result.features_provided,
          features_total: result.features_total,
          missing_features: result.missing_features,
          extraction_errors: result.extraction_errors,
          extraction_time_ms: result.extraction_time_ms,
          inference_time_ms: result.inference_time_ms,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      console.error(`[VPS v2] Failed to finalize run ${runId}:`, updateError);
    }

    console.log(
      `[VPS v2] Done: VPS=${result.vps}, raw=${result.raw_prediction.toFixed(2)}, ` +
      `features=${result.features_provided}/${result.features_total}, ` +
      `latency=${totalLatencyMs}ms`,
    );

    // ── Return response ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      run_id: runId,
      video_id: videoRecord.id,
      vps: result.vps,
      raw_prediction: result.raw_prediction,
      model_version: result.model_version,
      features: {
        provided: result.features_provided,
        total: result.features_total,
        missing: result.missing_features,
        values: result.feature_values,
      },
      extraction_errors: result.extraction_errors,
      latency_ms: totalLatencyMs,
      // Backward-compat fields for existing UI components
      predicted_dps: result.vps,
      predicted_range: [
        Math.max(0, result.vps - 10),
        Math.min(100, result.vps + 10),
      ],
      prediction_id: runId,
      prediction: {
        id: runId,
        dps: result.vps,
        confidence: 0.75,
        range: [
          Math.max(0, result.vps - 10),
          Math.min(100, result.vps + 10),
        ],
        viralPotential: getVpsTierLabel(result.vps),
        tier: getVpsTierLabel(result.vps),
      },
    });
  } catch (err: any) {
    console.error('[VPS v2] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getVpsTierLabel(vps: number): string {
  if (vps >= 80) return 'Viral-Ready';
  if (vps >= 65) return 'High Potential';
  if (vps >= 50) return 'Moderate';
  if (vps >= 35) return 'Needs Work';
  return 'Low Potential';
}
