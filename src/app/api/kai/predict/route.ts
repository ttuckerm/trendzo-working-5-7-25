/**
 * Kai Orchestrator Prediction API
 *
 * POST /api/kai/predict
 *
 * Uses canonical prediction pipeline for all predictions.
 * 
 * Uses VPS v2 pipeline — XGBoost sole score producer.
 * DB writes managed here (pipeline is pure compute).
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { runVpsPipelineV2 } from '@/lib/prediction/run-vps-pipeline-v2';

// Use service key for video_files table only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse form data
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const tiktokUrl = formData.get('tiktokUrl') as string | null;
    const transcript = formData.get('transcript') as string | null;
    const niche = formData.get('niche') as string;
    const goal = formData.get('goal') as string;
    const accountSize = formData.get('accountSize') as string;
    const followerCountStr = formData.get('followerCount') as string;
    const mode = (formData.get('mode') as string) || 'standard';
    const excludeLLMs = formData.get('excludeLLMsFromAggregate') === 'true';
    const scrapeMethod = formData.get('scrapeMethod') as string | null; // 'apify' or null

    // Validate input - now only requires video OR tiktokUrl (transcript is optional)
    // If no transcript provided, the pipeline will auto-transcribe via Whisper
    if (!videoFile && !tiktokUrl) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile or tiktokUrl is required' },
        { status: 400 }
      );
    }

    if (!niche || !goal) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: niche, goal' },
        { status: 400 }
      );
    }

    let storagePath: string | null = null;
    let videoPath: string | null = null;
    let apifyTranscript: string | null = null;
    let apifyRawItem: any = null; // Preserved for post-prediction labeling

    // Step 1: Save MP4 file (if uploaded)
    if (videoFile) {
      const videoDir = join(process.cwd(), 'data', 'raw_videos');

      if (!existsSync(videoDir)) {
        await mkdir(videoDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `kai_${timestamp}.mp4`;
      storagePath = join('data', 'raw_videos', filename);
      videoPath = join(process.cwd(), storagePath);

      const bytes = await videoFile.arrayBuffer();
      await writeFile(videoPath, Buffer.from(bytes));

      console.log(`Saved video: ${storagePath}`);
    }

    // Step 1.5: Download video from TikTok URL (if no file uploaded)
    if (!videoPath && tiktokUrl) {
      let apifyFailed = false;

      // === Apify scrape path ===
      if (scrapeMethod === 'apify') {
        try {
          console.log(`[Kai API] Apify scrape: ${tiktokUrl}`);
          const { callApifyScraperSync, normalizeApifyItem, downloadCdnVideo } =
            await import('@/lib/services/apify-tiktok-client');

          const isVideoUrl = /\/video\//i.test(tiktokUrl);
          const apifyInput = isVideoUrl
            ? { postURLs: [tiktokUrl], resultsPerPage: 1, shouldDownloadSubtitles: true, shouldDownloadVideos: false }
            : { startUrls: [{ url: tiktokUrl }], resultsPerPage: 1, shouldDownloadSubtitles: true, shouldDownloadVideos: false };

          const items = await callApifyScraperSync(apifyInput);

          if (items.length > 0) {
            apifyRawItem = items[0]; // Preserve raw item for post-prediction labeling
            const normalized = normalizeApifyItem(items[0]);
            const cdnUrl = normalized.videoUrl || normalized.downloadAddr;

            if (cdnUrl) {
              const videoDir = join(process.cwd(), 'data', 'raw_videos');
              if (!existsSync(videoDir)) await mkdir(videoDir, { recursive: true });
              const filename = `apify_${normalized.id || Date.now()}_${Date.now()}.mp4`;
              const localPath = join(videoDir, filename);

              const dl = await downloadCdnVideo(cdnUrl, localPath);
              if (dl.success) {
                videoPath = dl.path;
                storagePath = dl.path.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
                if (normalized.subtitles) apifyTranscript = normalized.subtitles;
                console.log(`[Kai API] Apify CDN download OK: ${dl.bytes} bytes`);
              } else {
                console.warn(`[Kai API] Apify CDN download failed: ${dl.error}, falling back to TikTokDownloader`);
                apifyFailed = true;
              }
            } else {
              console.warn(`[Kai API] Apify returned no CDN URL, falling back to TikTokDownloader`);
              apifyFailed = true;
            }
          } else {
            console.warn(`[Kai API] Apify returned 0 items, falling back to TikTokDownloader`);
            apifyFailed = true;
          }
        } catch (apifyErr: any) {
          console.error(`[Kai API] Apify scrape error: ${apifyErr.message}, falling back to TikTokDownloader`);
          apifyFailed = true;
        }
      }

      // === TikTokDownloader path (default, or Apify fallback) ===
      if (!videoPath && (scrapeMethod !== 'apify' || apifyFailed)) {
        try {
          if (apifyFailed) console.log(`[Kai API] FALLBACK: Using TikTokDownloader after Apify failure`);
          console.log(`📥 Downloading video from TikTok URL: ${tiktokUrl}`);
          const { TikTokDownloader } = await import('@/lib/services/tiktok-downloader');

          const downloadResult = await TikTokDownloader.downloadVideo(tiktokUrl);

          if (downloadResult.success && downloadResult.localPath) {
            videoPath = downloadResult.localPath;
            storagePath = downloadResult.localPath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');

            console.log(`✅ TikTok video downloaded successfully: ${videoPath}`);
          } else {
            console.error(`❌ TikTok download FAILED: ${downloadResult.error}`);
          }
        } catch (downloadError: any) {
          console.error(`❌ TikTok download ERROR: ${downloadError.message}`);
        }
      }
    }

    // Step 2: Insert into video_files table (keep for reference)
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        tiktok_url: tiktokUrl,
        storage_path: storagePath,
        niche,
        goal,
        account_size_band: accountSize,
        platform: 'tiktok',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      return NextResponse.json(
        { success: false, error: `Failed to save video record: ${insertError?.message}` },
        { status: 500 }
      );
    }

    console.log(`Created video record: ${videoRecord.id}`);

    // =========================================================================
    // VPS V2 PIPELINE — XGBoost sole score producer
    // No KaiOrchestrator, no multi-path averaging, no calibratePrediction.
    // DB writes managed here (pipeline is pure compute).
    // =========================================================================

    // Log input availability
    const inputParts: string[] = [];
    if (transcript || apifyTranscript) inputParts.push(`transcript (${(transcript || apifyTranscript || '').length} chars)`);
    if (videoPath) inputParts.push('video file');
    if (niche) inputParts.push(`niche: ${niche}`);
    console.log(`[Kai API] VPS v2 input: ${inputParts.length > 0 ? inputParts.join(', ') : 'video ID only'}`);

    // Parse follower count
    const followerCount =
      followerCountStr && parseInt(followerCountStr) > 0
        ? parseInt(followerCountStr)
        : undefined;

    // Create prediction_runs row (pending)
    const { data: runRecord, error: runInsertError } = await supabase
      .from('prediction_runs')
      .insert({
        video_id: videoRecord.id,
        status: 'running',
        score_version: 'vps-v2-xgboost-sole',
        source: tiktokUrl ? 'manual' : undefined,
        source_meta: tiktokUrl ? {
          post_url: tiktokUrl,
          platform: 'tiktok',
          ...(scrapeMethod === 'apify' ? { scrape_method: 'apify' } : {}),
        } : undefined,
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
    console.log(`[Kai API] Created VPS v2 run ${runId} for video ${videoRecord.id}`);

    // Run VPS v2 pipeline (pure compute — no DB writes)
    const resolvedTranscript = transcript || apifyTranscript || undefined;
    const v2Result = await runVpsPipelineV2({
      videoFilePath: videoPath || undefined,
      transcript: resolvedTranscript,
      niche: niche || undefined,
      followerCount,
    });

    const totalLatency = Date.now() - startTime;
    const tierLabel = getVpsTierLabel(v2Result.vps);

    // Finalize prediction_runs row
    const { error: updateError } = await supabase
      .from('prediction_runs')
      .update({
        status: 'completed',
        predicted_dps_7d: v2Result.vps,
        predicted_tier_7d: tierLabel,
        confidence: 0.75,
        components_used: ['xgboost-virality-ml'],
        latency_ms_total: totalLatency,
        score_version: 'vps-v2-xgboost-sole',
        raw_result: {
          vps: v2Result.vps,
          raw_prediction: v2Result.raw_prediction,
          model_version: v2Result.model_version,
          features_provided: v2Result.features_provided,
          features_total: v2Result.features_total,
          missing_features: v2Result.missing_features,
          extraction_errors: v2Result.extraction_errors,
          extraction_time_ms: v2Result.extraction_time_ms,
          inference_time_ms: v2Result.inference_time_ms,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (updateError) {
      console.error(`[Kai API] Failed to finalize run ${runId}:`, updateError);
    }

    console.log(
      `[Kai API] VPS v2 done: VPS=${v2Result.vps}, raw=${v2Result.raw_prediction.toFixed(2)}, ` +
      `features=${v2Result.features_provided}/${v2Result.features_total}, latency=${totalLatency}ms`,
    );

    // ─── Post-prediction: label-on-scrape for mature videos ───────────────
    let scrapeLabel: any = null;
    if (apifyRawItem && runId) {
      try {
        const { extractApifyMetrics, extractApifyCreateTime, labelOnScrape } =
          await import('@/lib/training/scrape-label');

        const scrapedMetrics = extractApifyMetrics(apifyRawItem);
        const createTimeMs = extractApifyCreateTime(apifyRawItem);

        if (scrapedMetrics && createTimeMs) {
          const labelResult = await labelOnScrape(
            runId,
            scrapedMetrics,
            createTimeMs,
            niche || 'side_hustles',
          );
          scrapeLabel = labelResult;
        }
      } catch (labelErr: any) {
        console.warn(`[Kai API] Scrape-label error (non-fatal): ${labelErr.message}`);
      }
    }

    // Prediction range (fixed ±10 for v2)
    const predictedRange: [number, number] = [
      Math.max(0, v2Result.vps - 10),
      Math.min(100, v2Result.vps + 10),
    ];

    // Return response (backward-compatible shape for upload-test UI)
    return NextResponse.json({
      success: true,
      run_id: runId,

      // Main prediction output
      prediction: {
        id: runId,
        dps: v2Result.vps,
        confidence: 0.75,
        range: predictedRange,
        viralPotential: tierLabel,
        tier: tierLabel,
      },

      // BACKWARD COMPATIBILITY: These fields are used by upload-test UI
      predicted_dps: v2Result.vps,
      predicted_range: predictedRange,
      video_id: videoRecord.id,
      prediction_id: runId,

      // VPS v2 specific fields
      vps: v2Result.vps,
      raw_prediction: v2Result.raw_prediction,
      model_version: v2Result.model_version,
      features: {
        provided: v2Result.features_provided,
        total: v2Result.features_total,
        missing: v2Result.missing_features,
        values: v2Result.feature_values,
      },
      extraction_errors: v2Result.extraction_errors,

      // Component details (v2 = XGBoost only)
      components_used: ['xgboost-virality-ml'],
      componentCount: 1,

      // Nulled legacy fields (coaching runs separately if needed)
      recommendations: [],
      warnings: [],
      qualitative_analysis: null,
      transcription_status: null,
      qc_flags: [],
      llm_spread: null,
      llm_influence_applied: null,
      score_lane: null,
      coach_lane: null,
      score_version: 'vps-v2-xgboost-sole',
      coach_version: null,
      llm_excluded_reason: null,
      unified_grading: null,
      editing_suggestions: null,
      xgboost_v7: null,
      xgboost_v7_features: null,
      component_diagnostics: null,

      // Debug info
      debug: {
        videoId: videoRecord.id,
        workflow: 'vps-v2-xgboost-sole',
        latencyMs: totalLatency,
        pipelineLatencyMs: v2Result.extraction_time_ms + v2Result.inference_time_ms,
        hasVideo: !!videoPath,
        hasUserTranscript: !!transcript,
        userTranscriptLength: transcript?.length || 0,
        resolvedTranscriptLength: resolvedTranscript?.length || 0,
        resolvedTranscriptPreview: resolvedTranscript?.substring(0, 200) || '',
        transcriptSource: transcript ? 'user' : apifyTranscript ? 'apify-subtitles' : 'none',
        transcriptConfidence: 0,
        executedComponentCount: 1,
        executedComponentIds: ['xgboost-virality-ml'],
        pack1_error: null,
        pack2_error: null,
      },

      // Timing
      latency: totalLatency,
      processingTimeMs: v2Result.extraction_time_ms + v2Result.inference_time_ms,

      // Scrape-label result
      scrape_label: scrapeLabel,
    });

  } catch (error: any) {
    console.error('KAI PREDICT ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
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

/**
 * GET endpoint - Check API status
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'POST /api/kai/predict',
    version: 'vps-v2-xgboost-sole',
    description: 'Uses VPS v2 pipeline — XGBoost sole score producer',
    accepts: {
      videoFile: 'File (MP4)',
      tiktokUrl: 'string',
      transcript: 'string',
      niche: 'string (required)',
      goal: 'string (required)',
      accountSize: 'string (optional)',
    },
  });
}
