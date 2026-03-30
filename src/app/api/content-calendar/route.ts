/**
 * Content Calendar API
 *
 * GET /api/content-calendar
 *
 * Generates or returns a cached 30-day content calendar for the authenticated user.
 * Returns cached calendar if unexpired; otherwise generates a fresh one.
 *
 * Query params:
 *   ?force=true — skip cache and regenerate
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getISOWeek } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { computeOpportunityScore } from '@/lib/patterns/pattern-metrics';
import {
  generateContentCalendar,
  type PatternWithMetrics,
  type BriefHistoryEntry,
  type PatternPerformanceEntry,
  type NarrativeArc,
} from '@/lib/content/content-calendar';

export const dynamic = 'force-dynamic';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authSupabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const force = request.nextUrl.searchParams.get('force') === 'true';

    // ── Check cache (unless forced) ──────────────────────────────────────
    if (!force) {
      const { data: cached } = await serviceClient
        .from('content_calendars')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached) {
        return NextResponse.json({
          success: true,
          calendar: {
            id: cached.id,
            briefs: cached.calendar_data,
            generated_at: cached.generated_at,
            niche: cached.niche_key,
            total_briefs: Array.isArray(cached.calendar_data)
              ? cached.calendar_data.length
              : 0,
          },
          cached: true,
          elapsed_ms: Date.now() - startTime,
        });
      }
    }

    // ── Resolve creator context ──────────────────────────────────────────
    const ctx = await resolveCreatorContext(serviceClient, user.id);

    if (!ctx || !ctx.calibrationProfile) {
      return NextResponse.json({
        success: true,
        calendar: null,
        message: 'Complete onboarding to generate your content calendar',
        elapsed_ms: Date.now() - startTime,
      });
    }

    const niche =
      ctx.calibrationProfile.selectedNiche ||
      ctx.channelData?.inferredNicheKey ||
      null;

    if (!niche) {
      return NextResponse.json({
        success: true,
        calendar: null,
        message: 'Select a niche to generate your content calendar',
        elapsed_ms: Date.now() - startTime,
      });
    }

    // ── Fetch patterns for niche ─────────────────────────────────────────
    const { data: metrics } = await serviceClient
      .from('archetype_niche_metrics')
      .select(
        `
        pattern_id,
        instance_count_30d,
        avg_views_30d,
        saturation_pct,
        trend_direction,
        pattern_archetypes (
          id,
          pattern_name,
          narrative_arc,
          psych_trigger,
          hook_structure,
          pacing_rhythm,
          cta_type
        )
      `,
      )
      .eq('niche_key', niche)
      .gt('instance_count_30d', 0);

    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        success: true,
        calendar: null,
        message:
          'Not enough patterns in your niche yet. Check back after more content is analyzed.',
        elapsed_ms: Date.now() - startTime,
      });
    }

    const patterns: PatternWithMetrics[] = metrics
      .map((m: any) => {
        const a = m.pattern_archetypes;
        if (!a) return null;
        return {
          pattern_id: a.id,
          pattern_name: a.pattern_name,
          narrative_arc: a.narrative_arc as NarrativeArc,
          psych_trigger: a.psych_trigger,
          hook_structure: a.hook_structure,
          pacing_rhythm: a.pacing_rhythm,
          cta_type: a.cta_type,
          saturation_pct: m.saturation_pct,
          trend_direction: m.trend_direction,
          opportunity_score: computeOpportunityScore(
            m.saturation_pct,
            m.trend_direction,
          ),
        };
      })
      .filter(Boolean) as PatternWithMetrics[];

    // ── Fetch brief history ──────────────────────────────────────────────
    const { data: briefs } = await serviceClient
      .from('content_briefs')
      .select('pattern_id, status, created_at')
      .eq('user_id', user.id);

    const briefHistory: BriefHistoryEntry[] = (briefs || []).map((b: any) => ({
      pattern_id: b.pattern_id,
      status: b.status,
      created_at: b.created_at,
    }));

    // ── Fetch performance history ────────────────────────────────────────
    const { data: perf } = await serviceClient
      .from('creator_pattern_performance')
      .select('pattern_id, delta, creator_stage')
      .eq('user_id', user.id);

    const performanceHistory: PatternPerformanceEntry[] = (perf || []).map(
      (p: any) => ({
        pattern_id: p.pattern_id,
        delta: Number(p.delta),
        creator_stage: p.creator_stage,
      }),
    );

    // ── Generate calendar ────────────────────────────────────────────────
    const calendar = await generateContentCalendar({
      creatorContext: ctx,
      patterns,
      briefHistory,
      niche,
      performanceHistory,
    });

    // ── Persist to content_calendars ─────────────────────────────────────
    const weekNumber = getISOWeek(new Date());
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const { data: saved, error: upsertError } = await serviceClient
      .from('content_calendars')
      .upsert(
        {
          user_id: user.id,
          niche_key: niche,
          calendar_data: calendar.briefs,
          generated_at: calendar.generated_at,
          expires_at: expiresAt,
          week_number: weekNumber,
        },
        { onConflict: 'user_id,week_number' },
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error(`[ContentCalendar] Upsert failed: ${upsertError.message}`);
    }

    return NextResponse.json({
      success: true,
      calendar: {
        id: saved?.id || null,
        briefs: calendar.briefs,
        generated_at: calendar.generated_at,
        niche: calendar.niche,
        total_briefs: calendar.total_briefs,
      },
      cached: false,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ContentCalendar] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
