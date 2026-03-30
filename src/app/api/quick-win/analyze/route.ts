/**
 * Quick Win Analyze API
 *
 * POST /api/quick-win/analyze
 *
 * Script-only prediction with optional creator context.
 * Accepts JSON (no FormData / video file needed), unlike /api/creator/predict.
 *
 * When user is authenticated: resolves creator context → personalized pipeline.
 * When not authenticated: runs pipeline without context (same as /api/predict).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, niche, goal, accountSize } = body;

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'transcript is required' },
        { status: 400 },
      );
    }

    // ── Try to resolve creator context (optional) ────────────────────────
    let creatorContext = null;
    try {
      const authSupabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await authSupabase.auth.getUser();

      if (user) {
        creatorContext = await resolveCreatorContext(serviceClient, user.id);
      }
    } catch {
      // Auth failed — proceed without context (no regression)
    }

    // ── Run prediction pipeline ──────────────────────────────────────────
    const videoId = `quickwin_${Date.now()}`;

    const pipelineResult = await runPredictionPipeline(videoId, {
      mode: 'standard',
      transcript,
      niche: niche || null,
      goal: goal || null,
      accountSize: accountSize || null,
      creatorContext,
    });

    if (!pipelineResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: pipelineResult.error || 'Prediction failed',
          run_id: pipelineResult.run_id,
        },
        { status: 500 },
      );
    }

    // ── Format response (same shape as /api/predict) ─────────────────────
    return NextResponse.json({
      success: true,
      run_id: pipelineResult.run_id,
      prediction: {
        final_dps_prediction: pipelineResult.predicted_dps_7d,
        prediction_breakdown: {
          tier: pipelineResult.predicted_tier_7d,
          confidence: pipelineResult.confidence,
        },
        prediction_interval: pipelineResult.raw_result?.range
          ? { lower: pipelineResult.raw_result.range[0], upper: pipelineResult.raw_result.range[1] }
          : undefined,
      },
      qualitative_analysis: pipelineResult.qualitative_analysis || {},
      creator_context_active: !!creatorContext,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[QuickWinAnalyze] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
