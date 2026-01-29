/**
 * Kai Orchestrator Prediction API
 *
 * POST /api/kai/predict
 *
 * Uses canonical prediction pipeline for all predictions.
 * 
 * REFACTORED (Ticket A2): Now uses runPredictionPipeline instead of direct KaiOrchestrator.
 * All DB writes go through the canonical pipeline (prediction_runs, component_results).
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

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

    // Validate input - now only requires video OR tiktokUrl (transcript is optional)
    // If no transcript provided, the pipeline will auto-transcribe via Whisper
    if (!videoFile && !tiktokUrl) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile or tiktokUrl is required' },
        { status: 400 }
      );
    }

    if (!niche || !goal || !accountSize) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: niche, goal, accountSize' },
        { status: 400 }
      );
    }

    let storagePath: string | null = null;
    let videoPath: string | null = null;

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
      try {
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
    // CANONICAL PREDICTION PIPELINE (Ticket A2)
    // All predictions go through runPredictionPipeline which handles DB writes.
    // Now passes transcript/niche/videoPath for proper component execution.
    // =========================================================================
    
    // Log input availability
    const inputParts: string[] = [];
    if (transcript) inputParts.push(`transcript (${transcript.length} chars)`);
    if (videoPath) inputParts.push('video file');
    if (niche) inputParts.push(`niche: ${niche}`);
    console.log(`[Kai API] Input: ${inputParts.length > 0 ? inputParts.join(', ') : 'video ID only'}`);
    
    // Run prediction through canonical pipeline (handles all DB writes)
    const pipelineResult = await runPredictionPipeline(videoRecord.id, { 
      mode: 'standard',
      videoFilePath: videoPath,
      transcript: transcript || undefined,
      niche: niche || undefined,
      goal: goal || undefined,
      accountSize: accountSize || undefined,
    });

    const totalLatency = Date.now() - startTime;
    
    // Calculate prediction range for backward compatibility
    const confidence = pipelineResult.confidence || 0.5;
    const dps = pipelineResult.predicted_dps_7d;
    const uncertainty = (1 - confidence) * 15;
    const predictedRange: [number, number] = pipelineResult.raw_result?.range || [
      Math.max(0, dps - uncertainty),
      Math.min(100, dps + uncertainty)
    ];

    // Return response (maintain backward compatibility with existing UI)
    return NextResponse.json({
      success: pipelineResult.success,
      run_id: pipelineResult.run_id,
      
      // Main prediction output
      prediction: {
        id: pipelineResult.run_id,
        dps: pipelineResult.predicted_dps_7d,
        confidence: pipelineResult.confidence,
        range: pipelineResult.raw_result?.range || predictedRange,
        viralPotential: pipelineResult.predicted_tier_7d,
        tier: pipelineResult.predicted_tier_7d,
      },
      
      // BACKWARD COMPATIBILITY: These fields are used by upload-test UI
      predicted_dps: pipelineResult.predicted_dps_7d,
      predicted_range: pipelineResult.raw_result?.range || predictedRange,
      video_id: videoRecord.id,
      prediction_id: pipelineResult.run_id,
      
      // Component details
      componentsUsed: pipelineResult.components_used,
      componentCount: pipelineResult.components_used.length,
      
      // Recommendations and warnings
      recommendations: pipelineResult.raw_result?.recommendations || [],
      warnings: pipelineResult.warnings,
      
      // Standardized qualitative analysis (Pack 1/2/3)
      qualitative_analysis: pipelineResult.qualitative_analysis,

      // Transcription status for UI step display
      transcription_status: pipelineResult.transcription_status || null,

      // Legacy fields (deprecated, for backward compatibility)
      unified_grading: pipelineResult.unified_grading || null,
      editing_suggestions: pipelineResult.editing_suggestions || null,
      
      // Debug info (includes resolved transcript verification and component execution)
      debug: {
        videoId: videoRecord.id,
        workflow: transcript || videoPath ? 'content-planning' : 'standard',
        latencyMs: totalLatency,
        pipelineLatencyMs: pipelineResult.latency_ms_total,
        hasVideo: !!videoPath,
        hasUserTranscript: !!transcript,
        userTranscriptLength: transcript?.length || 0,
        // Resolved transcript info from pipeline (what Pack 1/2 actually sees)
        resolvedTranscriptLength: pipelineResult.debug?.resolved_transcript_length || 0,
        resolvedTranscriptPreview: pipelineResult.debug?.resolved_transcript_preview || '',
        transcriptSource: pipelineResult.debug?.transcript_source || pipelineResult.transcription_status?.source || 'none',
        transcriptConfidence: pipelineResult.transcription_status?.confidence || 0,
        // Component execution info
        executedComponentCount: pipelineResult.debug?.executed_component_count || 0,
        executedComponentIds: pipelineResult.debug?.executed_component_ids || [],
      },
      
      // Timing
      latency: totalLatency,
      processingTimeMs: pipelineResult.latency_ms_total,
    });

  } catch (error: any) {
    console.error('KAI PREDICT ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint - Check API status
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    endpoint: 'POST /api/kai/predict',
    version: 'pipeline-v2',
    description: 'Uses canonical runPredictionPipeline (Ticket A2)',
    accepts: {
      videoFile: 'File (MP4)',
      tiktokUrl: 'string',
      transcript: 'string',
      niche: 'string (required)',
      goal: 'string (required)',
      accountSize: 'string (required)'
    }
  });
}
