/**
 * Quick Win Context API
 *
 * GET /api/quick-win/context
 *
 * Loads creator context (calibration profile + channel data), ascending
 * patterns for the creator's niche, and historical VPS average for
 * first-win detection. Called once on Quick Win page mount.
 *
 * Returns null creatorContext when not authenticated or no profile exists
 * (graceful fallback — page uses default behavior).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { getLifecycleStage, computeOpportunityScore } from '@/lib/patterns/pattern-metrics';

export const dynamic = 'force-dynamic';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function GET() {
  try {
    // ── Auth (optional — graceful fallback) ──────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, creatorContext: null });
    }

    // ── Resolve creator context ──────────────────────────────────────────
    const ctx = await resolveCreatorContext(serviceClient, user.id);

    if (!ctx) {
      return NextResponse.json({ success: true, creatorContext: null });
    }

    // ── Determine niche ──────────────────────────────────────────────────
    const niche =
      ctx.calibrationProfile?.selectedNiche ||
      ctx.channelData?.inferredNicheKey ||
      null;

    // ── Query ascending patterns (saturation < 60%) ──────────────────────
    let patterns: any[] = [];
    if (niche) {
      const { data: metrics } = await serviceClient
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
        .gt('instance_count_30d', 0)
        .lt('saturation_pct', 60);

      if (metrics && metrics.length > 0) {
        patterns = metrics
          .map((m: any) => {
            const archetype = m.pattern_archetypes;
            if (!archetype) return null;
            return {
              pattern_id: archetype.id,
              pattern_name: archetype.pattern_name,
              hook_structure: archetype.hook_structure,
              pacing_rhythm: archetype.pacing_rhythm,
              saturation_pct: m.saturation_pct,
              trend_direction: m.trend_direction,
              lifecycle_stage: getLifecycleStage(m.saturation_pct),
              opportunity_score: computeOpportunityScore(
                m.saturation_pct,
                m.trend_direction,
              ),
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => b.opportunity_score - a.opportunity_score);
      }
    }

    // ── Historical average VPS (from content_briefs) ─────────────────────
    let historicalAvgVps: number | null = null;
    let firstWinAchieved = false;

    const { data: briefStats } = await serviceClient
      .from('content_briefs')
      .select('predicted_vps, actual_vps, first_win')
      .eq('user_id', user.id);

    if (briefStats && briefStats.length > 0) {
      const vpsValues = briefStats
        .map((b: any) => b.actual_vps ?? b.predicted_vps)
        .filter((v: any) => v != null);
      if (vpsValues.length > 0) {
        historicalAvgVps =
          vpsValues.reduce((sum: number, v: number) => sum + v, 0) /
          vpsValues.length;
      }
      firstWinAchieved = briefStats.some((b: any) => b.first_win === true);
    }

    // ── Build response ───────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      creatorContext: {
        niche,
        creatorStage: ctx.creatorStage,
        hookStylePreference:
          ctx.calibrationProfile?.rawScores?.hookStylePreference || {},
        toneMatch: ctx.calibrationProfile?.rawScores?.toneMatch || {},
        contentFormatPreference:
          ctx.calibrationProfile?.rawScores?.contentFormatPreference || {},
        hasCalibration: !!ctx.calibrationProfile,
        hasChannel: !!ctx.channelData,
        channelUsername: ctx.channelData?.username || null,
        followerCount: ctx.channelData?.followerCount || null,
      },
      patterns,
      historicalAvgVps,
      firstWinAchieved,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[QuickWinContext] Error: ${msg}`);
    // Graceful fallback — page works without personalization
    return NextResponse.json({ success: true, creatorContext: null });
  }
}
