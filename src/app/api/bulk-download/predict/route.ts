/**
 * Bulk Download Prediction API
 *
 * POST /api/bulk-download/predict - Run prediction on a downloaded video
 * GET  /api/bulk-download/predict - Get prediction status for an item
 *
 * Uses VPS v2 pipeline (XGBoost sole score producer).
 * DB writes managed here (pipeline is pure compute).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'fs';
import { runVpsPipelineV2 } from '@/lib/prediction/run-vps-pipeline-v2';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

interface PredictRequest {
  itemId: string;
  niche?: string;
  goal?: string;
  accountSize?: string;
  followerCount?: number;
}

// ============================================================================
// POST - Run prediction on a downloaded video
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: PredictRequest = await request.json();

    if (!body.itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    // Get the download item
    const { data: item, error: itemError } = await supabase
      .from('bulk_download_items')
      .select('*')
      .eq('id', body.itemId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { success: false, error: 'Download item not found' },
        { status: 404 }
      );
    }

    if (item.status !== 'completed' || !item.local_path) {
      return NextResponse.json(
        { success: false, error: 'Video has not been downloaded yet' },
        { status: 400 }
      );
    }

    // Check if video file exists on disk
    if (!existsSync(item.local_path)) {
      return NextResponse.json(
        { success: false, error: 'Video file not found on disk' },
        { status: 404 }
      );
    }

    // Persist follower count to bulk_download_items if provided
    if (body.followerCount && body.followerCount > 0) {
      await supabase
        .from('bulk_download_items')
        .update({ follower_count: body.followerCount })
        .eq('id', body.itemId);
    }

    console.log(`[Bulk Predict] Running VPS v2 pipeline for item ${body.itemId}`);

    // Parse follower count
    const followerCount =
      body.followerCount && body.followerCount > 0
        ? body.followerCount
        : item.follower_count && item.follower_count > 0
          ? item.follower_count
          : undefined;

    // Create prediction_runs row (pending)
    const { data: runRecord, error: runInsertError } = await supabase
      .from('prediction_runs')
      .insert({
        video_id: item.video_id,
        status: 'running',
        score_version: 'vps-v2-xgboost-sole',
        source: 'manual',
        source_meta: { origin: 'bulk-download', job_id: item.job_id, item_id: body.itemId },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (runInsertError || !runRecord) {
      return NextResponse.json({
        success: false,
        error: `Failed to create prediction run: ${runInsertError?.message}`,
      }, { status: 500 });
    }

    const runId = runRecord.id;

    // Run VPS v2 pipeline (pure compute — no DB writes)
    let v2Result;
    try {
      v2Result = await runVpsPipelineV2({
        videoFilePath: item.local_path,
        transcript: item.transcript || undefined,
        niche: body.niche || undefined,
        followerCount,
      });
    } catch (pipelineErr: any) {
      // Mark run as failed
      await supabase
        .from('prediction_runs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('id', runId);

      return NextResponse.json({
        success: false,
        error: pipelineErr.message || 'VPS v2 pipeline failed',
        run_id: runId,
      }, { status: 500 });
    }

    const tierLabel = getVpsTierLabel(v2Result.vps);

    // Finalize prediction_runs row
    const { error: runUpdateError } = await supabase
      .from('prediction_runs')
      .update({
        status: 'completed',
        predicted_dps_7d: v2Result.vps,
        predicted_tier_7d: tierLabel,
        confidence: 0.75,
        components_used: ['xgboost-virality-ml'],
        latency_ms_total: v2Result.extraction_time_ms + v2Result.inference_time_ms,
        score_version: 'vps-v2-xgboost-sole',
        raw_result: {
          vps: v2Result.vps,
          raw_prediction: v2Result.raw_prediction,
          model_version: v2Result.model_version,
          features_provided: v2Result.features_provided,
          features_total: v2Result.features_total,
          missing_features: v2Result.missing_features,
          extraction_errors: v2Result.extraction_errors,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    if (runUpdateError) {
      console.error('[Bulk Predict] Failed to finalize run:', runUpdateError);
    }

    // Derive viral potential for bulk_download_items
    let viralPotential = 'unknown';
    if (v2Result.vps >= 80) viralPotential = 'high';
    else if (v2Result.vps >= 60) viralPotential = 'medium';
    else viralPotential = 'low';

    // Update bulk_download_items with pipeline result
    const { error: updateError } = await supabase
      .from('bulk_download_items')
      .update({
        prediction_id: runId,
        predicted_dps: v2Result.vps,
        predicted_range_low: v2Result.vps * 0.85,
        predicted_range_high: v2Result.vps * 1.15,
        confidence: 0.75,
        viral_potential: viralPotential,
        components_used: ['xgboost-virality-ml'],
        processing_time_ms: v2Result.extraction_time_ms + v2Result.inference_time_ms,
        prediction_data: {
          runId,
          components: 1,
          niche: body.niche,
          followerCount: followerCount ?? null,
          goal: body.goal,
          tier: tierLabel,
        },
      })
      .eq('id', body.itemId);

    if (updateError) {
      console.error('[Bulk Predict] Failed to update item:', updateError);
    }

    const processingTimeMs = v2Result.extraction_time_ms + v2Result.inference_time_ms;
    console.log(`[Bulk Predict] VPS v2 complete: run_id=${runId}, VPS=${v2Result.vps.toFixed(1)}, latency=${processingTimeMs}ms`);

    return NextResponse.json({
      success: true,
      data: {
        itemId: body.itemId,
        videoId: item.video_id,
        runId,
        predictedDps: v2Result.vps,
        confidence: 0.75,
        viralPotential,
        componentsUsed: ['xgboost-virality-ml'],
        processingTimeMs,
      },
    });

  } catch (error: any) {
    console.error('[Bulk Predict] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
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

// ============================================================================
// GET - Get prediction status for an item
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from('bulk_download_items')
      .select('id, video_id, predicted_dps, predicted_range_low, predicted_range_high, confidence, viral_potential, components_used, processing_time_ms, prediction_id, prediction_data, actual_dps, comparison_data')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Also get training features count if available
    let featureCount = 0;
    if (item.prediction_id) {
      const { data: features } = await supabase
        .from('training_features')
        .select('feature_count')
        .eq('analysis_id', item.prediction_id)
        .single();
      if (features) featureCount = features.feature_count;
    }

    return NextResponse.json({
      success: true,
      data: {
        hasPrediction: !!item.predicted_dps,
        hasActualDps: !!item.actual_dps,
        prediction: item.predicted_dps ? {
          predictedDps: item.predicted_dps,
          range: [item.predicted_range_low, item.predicted_range_high],
          confidence: item.confidence,
          viralPotential: item.viral_potential,
          componentsUsed: item.components_used,
          processingTimeMs: item.processing_time_ms,
          predictionId: item.prediction_id,
          trainingFeaturesCount: featureCount
        } : null,
        actual: item.actual_dps ? {
          actualDps: item.actual_dps,
          comparison: item.comparison_data
        } : null
      }
    });

  } catch (error: any) {
    console.error('[Bulk Predict] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
