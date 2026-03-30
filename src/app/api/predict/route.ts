/**
 * Viral Prediction API Endpoint
 *
 * POST /api/predict
 *
 * Predicts viral potential (DPS score) using canonical prediction pipeline.
 * 
 * REFACTORED (Ticket A2): Now uses runPredictionPipeline instead of direct hybrid-predictor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds max

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.video_id && !body.transcript) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either video_id or transcript is required',
        },
        { status: 400 }
      );
    }

    // Use video_id or generate one from transcript hash
    const videoId = body.video_id || `transcript_${Date.now()}`;

    // Call canonical prediction pipeline with all available inputs
    const pipelineResult = await runPredictionPipeline(videoId, {
      mode: 'standard',
      transcript: body.transcript || null,
      niche: body.niche || null,
      goal: body.goal || null,
      title: body.title || null,
      description: body.description || null,
      hashtags: body.hashtags || null,
      videoFilePath: body.video_path || null,
    });

    if (!pipelineResult.success) {
      return NextResponse.json({
        success: false,
        error: pipelineResult.error || 'Prediction failed',
        run_id: pipelineResult.run_id,
      }, { status: 500 });
    }

    // Format response (maintain backward compatibility + Pack 1/2)
    return NextResponse.json({
      success: true,
      run_id: pipelineResult.run_id,
      prediction: {
        final_dps_prediction: pipelineResult.predicted_dps_7d,
        confidence: pipelineResult.confidence,
        prediction_breakdown: {
          tier: pipelineResult.predicted_tier_7d,
          components_used: pipelineResult.components_used.length
        },
        top_features: pipelineResult.components_used.slice(0, 5).map(c => ({
          feature: c,
          importance: 0.1
        })),
        prediction_interval: pipelineResult.raw_result?.range ? {
          lower: pipelineResult.raw_result.range[0],
          upper: pipelineResult.raw_result.range[1]
        } : null,
        qualitative_reasoning: pipelineResult.warnings.join('; ') || 'Prediction completed successfully',
      },
      // Standardized qualitative analysis (Pack 1/2/3 with _meta)
      qualitative_analysis: pipelineResult.qualitative_analysis,
      // Legacy fields (deprecated, for backward compatibility)
      unified_grading: pipelineResult.unified_grading || null,
      editing_suggestions: pipelineResult.editing_suggestions || null,
      metadata: {
        model_used: 'kai-orchestrator',
        feature_count: pipelineResult.components_used.length,
        processing_time_ms: pipelineResult.latency_ms_total,
        llm_cost_usd: 0,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Prediction API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
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
    model_available: true,
    model_metrics: {
      version: 'kai-orchestrator-pipeline',
      description: 'Uses canonical runPredictionPipeline'
    },
    endpoints: {
      predict: 'POST /api/predict',
    },
  });
}
