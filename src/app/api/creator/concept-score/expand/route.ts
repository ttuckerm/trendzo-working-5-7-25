/**
 * Concept Score Expand-to-Script API
 *
 * POST /api/creator/concept-score/expand
 *
 * Takes a concept_score_id, generates a full script via the script generation
 * endpoint, then scores the script through the full creator prediction pipeline.
 *
 * Flow:
 * 1. Load concept_score row (verify user owns it)
 * 2. Generate script via internal call to /api/generate/script
 * 3. Create minimal video_files record (no actual video, transcript-only)
 * 4. Run full prediction pipeline with the generated script as transcript
 * 5. Create content_brief with concept_score_id FK
 * 6. Update concept_scores: expanded_to_script=true, expanded_run_id, expanded_brief_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

// Service key client for DB writes
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
    // ── Authentication ─────────────────────────────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const { data: { user } } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await request.json();
    const conceptScoreId = String(body.concept_score_id || '').trim();

    if (!conceptScoreId) {
      return NextResponse.json(
        { success: false, error: 'concept_score_id is required' },
        { status: 400 },
      );
    }

    // ── Load concept score (verify ownership) ──────────────────────────────
    const { data: conceptScore, error: fetchError } = await supabase
      .from('concept_scores')
      .select('*')
      .eq('id', conceptScoreId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !conceptScore) {
      return NextResponse.json(
        { success: false, error: 'Concept score not found or access denied' },
        { status: 404 },
      );
    }

    if (conceptScore.expanded_to_script) {
      return NextResponse.json(
        { success: false, error: 'This concept has already been expanded to a script' },
        { status: 400 },
      );
    }

    // ── Load creator context ───────────────────────────────────────────────
    const creatorContext = await resolveCreatorContext(supabase, user.id);

    // ── Generate script via /api/generate/script ───────────────────────────
    const scriptRequestBody = {
      concept: conceptScore.concept_text,
      platform: 'tiktok' as const,
      length: conceptScore.gemini_analysis?.estimated_length_seconds || 30,
      niche: conceptScore.niche_key,
      hookStylePreference: creatorContext?.calibrationProfile?.rawScores?.hookStylePreference,
      toneMatch: creatorContext?.calibrationProfile?.rawScores?.toneMatch,
      patternSaturation: conceptScore.pattern_saturation
        ? {
            pattern_name: conceptScore.gemini_analysis?.suggested_pattern_name || 'unknown',
            saturation_pct: conceptScore.pattern_saturation.saturation_pct || 0,
            lifecycle_stage: conceptScore.pattern_saturation.lifecycle_stage || 'stable',
          }
        : undefined,
    };

    // Internal fetch to the script generation endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const scriptResponse = await fetch(`${baseUrl}/api/generate/script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scriptRequestBody),
    });

    if (!scriptResponse.ok) {
      const scriptError = await scriptResponse.json().catch(() => ({}));
      console.error('[ConceptExpand] Script generation failed:', scriptError);
      return NextResponse.json(
        { success: false, error: `Script generation failed: ${scriptError.error || 'Unknown error'}` },
        { status: 500 },
      );
    }

    const scriptResult = await scriptResponse.json();
    const fullScript = scriptResult.data?.script?.fullScript;

    if (!fullScript || fullScript.length < 20) {
      return NextResponse.json(
        { success: false, error: 'Script generation returned insufficient content' },
        { status: 500 },
      );
    }

    console.log(`[ConceptExpand] Script generated: ${fullScript.length} chars for concept ${conceptScoreId}`);

    // ── Create minimal video_files record (transcript-only, no video) ──────
    const accountSize = creatorContext?.channelData?.accountSizeBand || 'small (0-10K)';
    const goal = creatorContext?.calibrationProfile?.selectedGoal || 'grow';

    const { data: videoRecord, error: videoError } = await supabase
      .from('video_files')
      .insert({
        storage_path: null,
        tiktok_url: null,
        niche: conceptScore.niche_key,
        goal,
        account_size_band: accountSize,
        platform: 'concept_expansion',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (videoError || !videoRecord) {
      console.error(`[ConceptExpand] Failed to create video record: ${videoError?.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to create prediction record' },
        { status: 500 },
      );
    }

    // ── Run full prediction pipeline with script as transcript ─────────────
    const pipelineResult = await runPredictionPipeline(videoRecord.id, {
      mode: 'standard',
      videoFilePath: null,
      transcript: fullScript,
      niche: conceptScore.niche_key,
      goal,
      accountSize,
      source: 'api',
      sourceMeta: {
        route: '/api/creator/concept-score/expand',
        concept_score_id: conceptScoreId,
        user_id: user.id,
      },
      creatorContext,
    });

    if (!pipelineResult?.success) {
      console.error(`[ConceptExpand] Pipeline failed: ${pipelineResult?.error || 'unknown'}`);
      return NextResponse.json(
        { success: false, error: `Prediction pipeline failed: ${pipelineResult?.error || 'unknown'}` },
        { status: 500 },
      );
    }

    // ── Create content_brief ───────────────────────────────────────────────
    const { data: brief, error: briefError } = await supabase
      .from('content_briefs')
      .insert({
        user_id: user.id,
        source_video_id: videoRecord.id,
        pattern_id: conceptScore.matched_pattern_id,
        brief_content: {
          concept_text: conceptScore.concept_text,
          generated_script: scriptResult.data?.script,
          niche: conceptScore.niche_key,
          concept_vps: conceptScore.concept_vps,
        },
        predicted_vps: pipelineResult.predicted_vps,
        status: 'generated',
        concept_score_id: conceptScoreId,
      })
      .select('id')
      .single();

    if (briefError) {
      console.error(`[ConceptExpand] Brief creation failed: ${briefError.message}`);
      // Non-fatal — pipeline result still valid
    }

    // ── Update concept_scores ──────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('concept_scores')
      .update({
        expanded_to_script: true,
        expanded_run_id: pipelineResult.run_id,
        expanded_brief_id: brief?.id || null,
      })
      .eq('id', conceptScoreId);

    if (updateError) {
      console.error(`[ConceptExpand] Update concept_scores failed: ${updateError.message}`);
    }

    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      concept_score_id: conceptScoreId,
      script: scriptResult.data?.script,
      prediction: {
        run_id: pipelineResult.run_id,
        vps: pipelineResult.predicted_vps,
        confidence: pipelineResult.confidence,
        tier: pipelineResult.predicted_tier_7d,
        components_used: pipelineResult.components_used,
      },
      brief_id: brief?.id || null,
      qualitative_analysis: pipelineResult.qualitative_analysis,
      personalization: {
        active: creatorContext != null,
        creatorStage: creatorContext?.creatorStage || null,
      },
      latency_ms: latencyMs,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptExpand] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}
