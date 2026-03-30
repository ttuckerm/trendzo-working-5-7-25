/**
 * Concept Scoring API
 *
 * POST /api/creator/concept-score — Score a video concept before filming
 * GET  /api/creator/concept-score — Retrieve concept scoring history
 *
 * Auth-required. Uses CreatorContext for personalized scoring.
 * This is part of the CREATOR pipeline (not the testing pipeline).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { scoreConcept } from '@/lib/prediction/concept-scorer';

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

    // ── Parse JSON body ────────────────────────────────────────────────────
    const body = await request.json();
    const conceptText = String(body.concept_text || '').trim();
    const niche = String(body.niche || '').trim();

    if (!conceptText || conceptText.length < 10) {
      return NextResponse.json(
        { success: false, error: 'concept_text must be at least 10 characters' },
        { status: 400 },
      );
    }

    if (conceptText.length > 500) {
      return NextResponse.json(
        { success: false, error: 'concept_text must be 500 characters or fewer' },
        { status: 400 },
      );
    }

    if (!niche) {
      return NextResponse.json(
        { success: false, error: 'niche is required' },
        { status: 400 },
      );
    }

    // ── Load creator context ───────────────────────────────────────────────
    const creatorContext = await resolveCreatorContext(supabase, user.id);

    // ── Score concept ──────────────────────────────────────────────────────
    const result = await scoreConcept(
      { conceptText, niche, creatorContext },
      supabase,
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Concept scoring failed — please try again' },
        { status: 500 },
      );
    }

    // ── Save to concept_scores table ───────────────────────────────────────
    const { data: saved, error: saveError } = await supabase
      .from('concept_scores')
      .insert({
        user_id: user.id,
        concept_text: conceptText,
        niche_key: niche,
        concept_vps: result.conceptVps,
        confidence_low: result.confidenceRange[0],
        confidence_high: result.confidenceRange[1],
        matched_pattern_id: result.matchedPattern?.pattern_id || null,
        pattern_saturation: result.patternSaturation,
        creator_fit: result.creatorFit,
        diagnosis: result.diagnosis,
        adjustments: result.suggestedAdjustments,
        gemini_analysis: result.geminiAnalysis,
      })
      .select('id')
      .single();

    if (saveError) {
      console.error(`[ConceptScoreAPI] Save error: ${saveError.message}`);
      // Still return the result even if save fails
    }

    const latencyMs = Date.now() - startTime;

    // Derive delivery_assessment from delivery baseline score
    const deliveryScore = result.qualityGate.deliveryBaseline;
    let deliveryAssessment: 'strong' | 'adequate' | 'needs-work' | 'unknown' = 'unknown';
    if (deliveryScore > 70) deliveryAssessment = 'strong';
    else if (deliveryScore >= 50) deliveryAssessment = 'adequate';
    else if (deliveryScore >= 30) deliveryAssessment = 'needs-work';

    return NextResponse.json({
      success: true,
      concept_score_id: saved?.id || null,
      concept_vps: result.conceptVps,
      confidence_range: result.confidenceRange,
      diagnosis: result.diagnosis,
      suggested_adjustments: result.suggestedAdjustments,
      matched_pattern: result.matchedPattern,
      pattern_saturation: result.patternSaturation,
      creator_fit: result.creatorFit,
      quality_gate: result.qualityGate,
      gate_classification: result.qualityGate.gateClassification,
      distribution_potential: result.distributionPotential,
      delivery_assessment: deliveryAssessment,
      creator_context_applied: creatorContext != null,
      personalization: {
        active: creatorContext != null,
        creatorStage: creatorContext?.creatorStage || null,
        hasCalibration: creatorContext?.calibrationProfile != null,
        hasChannel: creatorContext?.channelData != null,
      },
      latency_ms: latencyMs,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptScoreAPI] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}

export async function GET() {
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

    // ── Fetch concept history ──────────────────────────────────────────────
    const { data: history, error } = await supabase
      .from('concept_scores')
      .select('id, concept_text, niche_key, concept_vps, confidence_low, confidence_high, matched_pattern_id, expanded_to_script, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error(`[ConceptScoreAPI] History fetch error: ${error.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch concept history' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      history: history || [],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ConceptScoreAPI] GET Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 },
    );
  }
}
