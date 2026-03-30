/**
 * Admin Lab: Predict API
 *
 * POST /api/admin/predict
 *
 * Upload MP4 (or provide transcript) and get frozen prediction (no metrics access)
 * 
 * REFACTORED (Ticket A2): Now uses runPredictionPipeline with mode="admin"
 * instead of direct hybrid-predictor. All DB writes go through canonical pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { PredictionHash } from '@/lib/services/prediction-hash';

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

    // Validate input
    if (!videoFile && !tiktokUrl && !transcript) {
      return NextResponse.json(
        { success: false, error: 'Either videoFile, tiktokUrl, or transcript is required' },
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

    // Step 1: Save MP4 file (if uploaded)
    if (videoFile) {
      const videoDir = join(process.cwd(), 'data', 'raw_videos');

      if (!existsSync(videoDir)) {
        await mkdir(videoDir, { recursive: true });
      }

      const timestamp = Date.now();
      const filename = `admin_lab_${timestamp}.mp4`;
      storagePath = join('data', 'raw_videos', filename);
      const fullPath = join(process.cwd(), storagePath);

      const bytes = await videoFile.arrayBuffer();
      await writeFile(fullPath, Buffer.from(bytes));

      console.log(`✅ Saved video: ${storagePath}`);
    }

    // Step 1.5: Download video from TikTok URL (if no file uploaded)
    if (!storagePath && tiktokUrl) {
      try {
        console.log(`📥 Downloading video from TikTok URL: ${tiktokUrl}`);
        const { TikTokDownloader } = await import('@/lib/services/tiktok-downloader');
        
        const downloadResult = await TikTokDownloader.downloadVideo(tiktokUrl);
        
        if (downloadResult.success && downloadResult.localPath) {
          storagePath = downloadResult.localPath.replace(process.cwd() + '\\', '').replace(process.cwd() + '/', '');
          console.log(`✅ TikTok video downloaded: ${storagePath}`);
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

    console.log(`✅ Created video record: ${videoRecord.id}`);

    // =========================================================================
    // CANONICAL PREDICTION PIPELINE - ADMIN MODE (Ticket A2)
    // Replaces direct hybrid-predictor call
    // =========================================================================
    
    const pipelineResult = await runPredictionPipeline(videoRecord.id, { mode: 'admin' });

    if (!pipelineResult.success) {
      return NextResponse.json(
        { success: false, error: pipelineResult.error || 'Prediction failed', run_id: pipelineResult.run_id },
        { status: 500 }
      );
    }

    // Step 5: Generate cryptographic hash (for blockchain/audit trail)
    const predictionPayload = {
      videoId: videoRecord.id,
      dps: pipelineResult.predicted_dps_7d,
      confidence: pipelineResult.confidence,
      tier: pipelineResult.predicted_tier_7d,
      timestamp: new Date().toISOString()
    };

    let hashResult = { hash: '', timestamp: new Date().toISOString() };
    try {
      hashResult = PredictionHash.generate(predictionPayload);
    } catch (hashError) {
      console.warn('Hash generation failed:', hashError);
      hashResult.hash = `fallback_${Date.now()}`;
    }

    console.log(`✅ Generated hash: ${hashResult.hash.substring(0, 16)}...`);

    const totalProcessingTime = Date.now() - startTime;

    // Return response (maintain backward compatibility)
    return NextResponse.json({
      success: true,
      run_id: pipelineResult.run_id,
      video_id: videoRecord.id,
      prediction_id: pipelineResult.run_id,
      predicted_dps: pipelineResult.predicted_dps_7d,
      predicted_range: pipelineResult.raw_result?.range || [
        Math.max(0, pipelineResult.predicted_dps_7d - 15),
        Math.min(100, pipelineResult.predicted_dps_7d + 15)
      ],
      confidence: pipelineResult.confidence,
      explanation: `Predicted ${pipelineResult.predicted_dps_7d.toFixed(1)} DPS (${pipelineResult.predicted_tier_7d}) using ${pipelineResult.components_used.length} components`,
      prediction_hash: hashResult.hash,
      top_features: pipelineResult.components_used.slice(0, 10).map(c => ({
        feature: c,
        importance: 0.1
      })),
      components_used: pipelineResult.components_used,
      warnings: pipelineResult.warnings,
      blockchain_receipt: {
        tx_hash: null,  // Phase 1: Enable blockchain
        block_number: null,
        timestamp: hashResult.timestamp
      },
      frozen_at: new Date().toISOString(),
      processing_time_ms: totalProcessingTime,
      pipeline_latency_ms: pipelineResult.latency_ms_total,
      llm_cost_usd: 0,
      total_cost_usd: 0
    });

  } catch (error: any) {
    console.error('❌ Admin predict error:', error);
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
    endpoint: 'POST /api/admin/predict',
    version: 'pipeline-v2',
    description: 'Uses canonical runPredictionPipeline with mode="admin" (Ticket A2)',
    phase: 'Phase 0',
    enforcement: 'Code-level separation via pipeline',
    accepts: {
      videoFile: 'File (MP4)',
      tiktokUrl: 'string',
      transcript: 'string',
      niche: 'string (required)',
      goal: 'string (required)',
      accountSize: 'string (required)'
    },
    returns: {
      run_id: 'string (canonical run ID)',
      predicted_dps: 'number',
      predicted_range: '[number, number]',
      confidence: 'number',
      prediction_hash: 'string (SHA-256)',
      frozen_at: 'timestamp'
    }
  });
}
