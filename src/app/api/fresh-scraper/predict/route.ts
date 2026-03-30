/**
 * Fresh Video Prediction API
 * 
 * POST /api/fresh-scraper/predict - Run Kai prediction on a fresh video
 * 
 * This downloads the video and runs the full Kai Orchestrator prediction,
 * then stores results and feeds to Algorithm IQ.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TikTokDownloader } from '@/lib/services/tiktok-downloader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface PredictRequest {
  freshVideoId: string;
  niche?: string;
  accountSize?: string;
}

/**
 * POST - Run full Kai prediction on a fresh video
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: PredictRequest = await request.json();

    if (!body.freshVideoId) {
      return NextResponse.json(
        { success: false, error: 'freshVideoId is required' },
        { status: 400 }
      );
    }

    // Fetch the fresh video record
    const { data: freshVideo, error: fetchError } = await supabase
      .from('fresh_video_tracking')
      .select('*')
      .eq('id', body.freshVideoId)
      .single();

    if (fetchError || !freshVideo) {
      return NextResponse.json(
        { success: false, error: 'Fresh video not found' },
        { status: 404 }
      );
    }

    console.log(`[Fresh Predict] Running prediction for video ${freshVideo.video_id}`);

    // Step 1: Download the video if not already downloaded
    let localPath = freshVideo.local_path;
    
    if (!localPath) {
      const downloader = new TikTokDownloader();
      const downloadResult = await downloader.download(freshVideo.video_url);
      
      if (!downloadResult.success || !downloadResult.localPath) {
        await supabase
          .from('fresh_video_tracking')
          .update({
            tracking_status: 'failed',
            error_message: downloadResult.error || 'Download failed'
          })
          .eq('id', body.freshVideoId);

        return NextResponse.json(
          { success: false, error: downloadResult.error || 'Failed to download video' },
          { status: 500 }
        );
      }
      
      localPath = downloadResult.localPath;
      
      // Update local path
      await supabase
        .from('fresh_video_tracking')
        .update({ local_path: localPath })
        .eq('id', body.freshVideoId);
    }

    // Step 2: Read the video file and prepare FormData
    const fs = await import('fs');
    const path = await import('path');
    
    const absolutePath = path.resolve(process.cwd(), localPath);
    
    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json(
        { success: false, error: 'Downloaded video file not found' },
        { status: 500 }
      );
    }

    const videoBuffer = fs.readFileSync(absolutePath);
    const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
    
    const formData = new FormData();
    formData.append('video', videoBlob, `${freshVideo.video_id}.mp4`);
    formData.append('niche', body.niche || freshVideo.niche || 'general');
    formData.append('accountSize', body.accountSize || 'medium');
    formData.append('workflow', 'standard');

    // Step 3: Call Kai prediction API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    
    const kaiResponse = await fetch(`${baseUrl}/api/kai/predict`, {
      method: 'POST',
      body: formData
    });

    if (!kaiResponse.ok) {
      const errorText = await kaiResponse.text();
      console.error(`[Fresh Predict] Kai API error: ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Kai prediction failed: ${kaiResponse.status}` },
        { status: 500 }
      );
    }

    const kaiResult = await kaiResponse.json();
    const processingTime = Date.now() - startTime;

    if (!kaiResult.success || !kaiResult.data?.prediction) {
      console.error('[Fresh Predict] Kai returned no prediction');
      return NextResponse.json(
        { success: false, error: 'Kai prediction returned no result' },
        { status: 500 }
      );
    }

    const prediction = kaiResult.data.prediction;

    // Step 4: Update fresh_video_tracking with prediction
    const { error: updateError } = await supabase
      .from('fresh_video_tracking')
      .update({
        predicted_dps: prediction.dps,
        predicted_range_low: prediction.range?.[0] || prediction.dps - 15,
        predicted_range_high: prediction.range?.[1] || prediction.dps + 15,
        prediction_confidence: prediction.confidence,
        prediction_id: kaiResult.data.predictionEvent?.id,
        predicted_at: new Date().toISOString(),
        tracking_status: 'tracking'
      })
      .eq('id', body.freshVideoId);

    if (updateError) {
      console.warn('[Fresh Predict] Failed to update tracking record:', updateError.message);
    }

    console.log(`[Fresh Predict] Completed: ${prediction.dps.toFixed(1)} DPS, ${(prediction.confidence * 100).toFixed(0)}% confidence in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        freshVideoId: body.freshVideoId,
        videoId: freshVideo.video_id,
        prediction: {
          dps: prediction.dps,
          range: prediction.range || [prediction.dps - 15, prediction.dps + 15],
          confidence: prediction.confidence,
          viralPotential: prediction.viralPotential,
          componentScores: prediction.componentScores,
          componentsUsed: prediction.componentsUsed
        },
        processingTimeMs: processingTime,
        trackingStatus: 'tracking',
        message: `Predicted ${prediction.dps.toFixed(1)} DPS with ${(prediction.confidence * 100).toFixed(0)}% confidence`
      }
    });

  } catch (error: any) {
    console.error('[Fresh Predict] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get prediction status for a fresh video
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const freshVideoId = searchParams.get('id');

    if (!freshVideoId) {
      return NextResponse.json(
        { success: false, error: 'id parameter required' },
        { status: 400 }
      );
    }

    const { data: freshVideo, error } = await supabase
      .from('fresh_video_tracking')
      .select('*')
      .eq('id', freshVideoId)
      .single();

    if (error || !freshVideo) {
      return NextResponse.json(
        { success: false, error: 'Fresh video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: freshVideo.id,
        videoId: freshVideo.video_id,
        hasPrediction: freshVideo.predicted_dps !== null,
        prediction: freshVideo.predicted_dps ? {
          dps: freshVideo.predicted_dps,
          range: [freshVideo.predicted_range_low, freshVideo.predicted_range_high],
          confidence: freshVideo.prediction_confidence,
          predictedAt: freshVideo.predicted_at
        } : null,
        trackingStatus: freshVideo.tracking_status,
        hasResult: freshVideo.final_dps !== null,
        result: freshVideo.final_dps ? {
          finalDps: freshVideo.final_dps,
          predictionError: freshVideo.prediction_error,
          isAccurate: freshVideo.prediction_accurate,
          withinRange: freshVideo.within_range
        } : null
      }
    });

  } catch (error: any) {
    console.error('[Fresh Predict] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}









