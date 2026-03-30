/**
 * Creator-Facing Prediction API
 *
 * POST /api/creator/predict
 *
 * Personalized prediction route for authenticated creators.
 * Loads creator context (calibration profile + channel data) and passes it
 * to the prediction pipeline for personalized Pack 2 suggestions.
 *
 * ARCHITECTURAL NOTE: This route is SEPARATE from /api/kai/predict.
 * - /api/kai/predict = testing pipeline (upload-test page). Raw, unbiased. No creator context.
 * - /api/creator/predict = creator pipeline. Personalized. creator_context_active = true.
 *
 * The prediction pipeline (runPredictionPipeline) is the same — the only difference
 * is whether creatorContext is passed. When it is, the pipeline:
 * 1. Overrides accountSize with real follower count (more precise calibration)
 * 2. Cross-checks inferred niche vs selected niche (warning only)
 * 3. Passes creator preferences to Pack 2 for personalized coaching suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { createMetricSchedules } from '@/lib/training/metric-scheduler';

// Service key client for DB writes (video_files table)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false },
  }
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Authentication (REQUIRED for creator pipeline) ────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // ── Parse form data ──────────────────────────────────────────────────────
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const tiktokUrl = formData.get('tiktokUrl') as string | null;
    const transcript = formData.get('transcript') as string | null;
    const niche = formData.get('niche') as string;
    const goal = formData.get('goal') as string;
    const accountSize = formData.get('accountSize') as string;

    if (!videoFile && !tiktokUrl) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile or tiktokUrl is required' },
        { status: 400 }
      );
    }

    if (!niche || !goal || !accountSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: niche, goal, accountSize',
        },
        { status: 400 }
      );
    }

    // ── Load creator context ─────────────────────────────────────────────────
    const creatorContext = await resolveCreatorContext(supabase, user.id);
    console.log(
      `[Creator Predict] User ${user.id}: creatorContext=${!!creatorContext}, ` +
        `calibration=${!!creatorContext?.calibrationProfile}, ` +
        `channel=${!!creatorContext?.channelData}, ` +
        `stage=${creatorContext?.creatorStage ?? 'none'}`
    );

    // ── Save video file ──────────────────────────────────────────────────────
    let storagePath: string | null = null;
    let videoPath: string | null = null;

    if (videoFile) {
      const videoDir = join(process.cwd(), 'data', 'raw_videos');
      if (!existsSync(videoDir)) {
        await mkdir(videoDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `creator_${timestamp}.mp4`;
      storagePath = join('data', 'raw_videos', filename);
      videoPath = join(process.cwd(), storagePath);

      const bytes = await videoFile.arrayBuffer();
      await writeFile(videoPath, Buffer.from(bytes));
      console.log(`[Creator Predict] Saved video: ${storagePath}`);
    }

    // ── Download from TikTok URL (if no file) ────────────────────────────────
    if (!videoPath && tiktokUrl) {
      try {
        console.log(`[Creator Predict] Downloading from TikTok: ${tiktokUrl}`);
        const { TikTokDownloader } = await import(
          '@/lib/services/tiktok-downloader'
        );
        const downloadResult = await TikTokDownloader.downloadVideo(tiktokUrl);
        if (downloadResult.success && downloadResult.localPath) {
          videoPath = downloadResult.localPath;
          storagePath = downloadResult.localPath
            .replace(process.cwd() + '\\', '')
            .replace(process.cwd() + '/', '');
          console.log(
            `[Creator Predict] TikTok download OK: ${videoPath}`
          );
        } else {
          console.error(
            `[Creator Predict] TikTok download failed: ${downloadResult.error}`
          );
        }
      } catch (downloadError: any) {
        console.error(
          `[Creator Predict] TikTok download error: ${downloadError.message}`
        );
      }
    }

    // ── Create video_files record ────────────────────────────────────────────
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        tiktok_url: tiktokUrl,
        storage_path: storagePath,
        niche,
        goal,
        account_size_band: accountSize,
        platform: 'tiktok',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save video record: ${insertError?.message}`,
        },
        { status: 500 }
      );
    }

    // ── Run personalized prediction pipeline ─────────────────────────────────
    const pipelineResult = await runPredictionPipeline(videoRecord.id, {
      mode: 'standard',
      videoFilePath: videoPath,
      transcript: transcript || undefined,
      niche: niche || undefined,
      goal: goal || undefined,
      accountSize: accountSize || undefined,
      source: 'api',
      sourceMeta: {
        route: '/api/creator/predict',
        user_id: user.id,
        ...(tiktokUrl ? { post_url: tiktokUrl, platform: 'tiktok' } : {}),
      },
      creatorContext,
    });

    // ── Track 2: Auto-create metric schedules for user videos ───────────────
    let trackingScheduled = false;
    if (tiktokUrl && pipelineResult.success && pipelineResult.run_id) {
      try {
        const schedCount = await createMetricSchedules(
          pipelineResult.run_id,
          videoRecord.id,
          { platformVideoId: tiktokUrl, source: 'creator_predict' },
        );
        trackingScheduled = schedCount > 0;
        if (trackingScheduled) {
          console.log(`[Creator Predict] Track 2: ${schedCount} metric schedules created for run ${pipelineResult.run_id}`);
        }
      } catch (schedErr: any) {
        console.warn(`[Creator Predict] Track 2: schedule creation failed (non-fatal): ${schedErr.message}`);
      }
    }

    const totalLatency = Date.now() - startTime;

    // ── Build response ───────────────────────────────────────────────────────
    const confidence = pipelineResult.confidence || 0.5;
    const vps = pipelineResult.predicted_dps_7d;
    const uncertainty = (1 - confidence) * 15;
    const predictedRange: [number, number] = pipelineResult.raw_result
      ?.range || [
      Math.max(0, vps - uncertainty),
      Math.min(100, vps + uncertainty),
    ];

    return NextResponse.json({
      success: pipelineResult.success,
      run_id: pipelineResult.run_id,

      // Main prediction
      prediction: {
        id: pipelineResult.run_id,
        vps: pipelineResult.predicted_dps_7d,
        confidence: pipelineResult.confidence,
        range: pipelineResult.raw_result?.range || predictedRange,
        viralPotential: pipelineResult.predicted_tier_7d,
        tier: pipelineResult.predicted_tier_7d,
      },

      video_id: videoRecord.id,

      // Components
      components_used: pipelineResult.components_used,

      // Qualitative analysis (Pack 1/2/3/V)
      qualitative_analysis: pipelineResult.qualitative_analysis,

      // Warnings (includes niche mismatch if detected)
      warnings: pipelineResult.warnings,

      // Personalization metadata
      personalization: {
        active: !!creatorContext,
        creatorStage: creatorContext?.creatorStage ?? null,
        hasCalibration: !!creatorContext?.calibrationProfile,
        hasChannel: !!creatorContext?.channelData,
        channelUsername: creatorContext?.channelData?.username ?? null,
      },

      // Metric tracking (Track 2)
      tracking: trackingScheduled
        ? { scheduled: true, checkpoints: ['4h', '24h', '48h', '7d'] }
        : { scheduled: false, reason: tiktokUrl ? 'schedule_failed' : 'no_tiktok_url' },

      // Timing
      latency: totalLatency,
      processingTimeMs: pipelineResult.latency_ms_total,
    });
  } catch (error: any) {
    console.error('[Creator Predict] ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Route info
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'POST /api/creator/predict',
    version: '1.0',
    description:
      'Creator-facing personalized prediction. Requires authentication. Loads calibration profile + channel data for personalized Pack 2 suggestions.',
    accepts: {
      videoFile: 'File (MP4)',
      tiktokUrl: 'string',
      transcript: 'string (optional)',
      niche: 'string (required)',
      goal: 'string (required)',
      accountSize: 'string (required)',
    },
  });
}
