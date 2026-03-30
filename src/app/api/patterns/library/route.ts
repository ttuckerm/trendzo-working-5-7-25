/**
 * Pattern Library API
 *
 * GET /api/patterns/library?niche=fitness&limit=20
 *
 * Returns pattern archetypes for a given niche, ranked by opportunity score
 * (ascending + low saturation patterns first).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLifecycleStage, computeOpportunityScore } from '@/lib/patterns/pattern-metrics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20), 50);

    if (!niche) {
      return NextResponse.json(
        { success: false, error: 'niche parameter is required' },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { db: { schema: 'public' }, auth: { persistSession: false } },
    );

    // Query metrics joined with archetypes for this niche
    const { data: metrics, error } = await supabase
      .from('archetype_niche_metrics')
      .select(`
        pattern_id,
        instance_count_30d,
        avg_views_30d,
        saturation_pct,
        trend_direction,
        first_seen_in_niche,
        last_computed_at,
        pattern_archetypes (
          id,
          pattern_name,
          narrative_arc,
          psych_trigger,
          hook_structure,
          pacing_rhythm,
          cta_type
        )
      `)
      .eq('niche_key', niche)
      .gt('instance_count_30d', 0);

    if (error) {
      console.error(`[PatternLibrary] Query failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to query pattern library' },
        { status: 500 },
      );
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        niche,
        patterns: [],
        total: 0,
        elapsed_ms: Date.now() - startTime,
      });
    }

    // Shape and rank results
    const patterns = metrics
      .map((m: any) => {
        const archetype = m.pattern_archetypes;
        if (!archetype) return null;

        const opportunityScore = computeOpportunityScore(
          m.saturation_pct,
          m.trend_direction,
        );

        return {
          pattern_id: archetype.id,
          pattern_name: archetype.pattern_name,
          narrative_arc: archetype.narrative_arc,
          psych_trigger: archetype.psych_trigger,
          hook_structure: archetype.hook_structure,
          pacing_rhythm: archetype.pacing_rhythm,
          cta_type: archetype.cta_type,
          instance_count_30d: m.instance_count_30d,
          avg_views_30d: m.avg_views_30d,
          saturation_pct: m.saturation_pct,
          trend_direction: m.trend_direction,
          lifecycle_stage: getLifecycleStage(m.saturation_pct),
          opportunity_score: opportunityScore,
          first_seen_in_niche: m.first_seen_in_niche,
          last_computed_at: m.last_computed_at,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.opportunity_score - a.opportunity_score)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      niche,
      patterns,
      total: patterns.length,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[PatternLibrary] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
