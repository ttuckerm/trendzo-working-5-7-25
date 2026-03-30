/**
 * Content Calendar Performance API
 *
 * GET /api/content-calendar/performance
 *
 * Returns pattern performance data for the authenticated user:
 * aggregate stats and per-pattern breakdown.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } },
);

export async function GET() {
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

    // ── Query performance records joined with pattern archetypes ─────────
    const { data: records, error } = await serviceClient
      .from('creator_pattern_performance')
      .select(
        `
        pattern_id,
        predicted_vps,
        actual_vps,
        delta,
        creator_stage,
        niche_key,
        created_at,
        pattern_archetypes (
          pattern_name,
          narrative_arc
        )
      `,
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`[CalendarPerf] Query failed: ${error.message}`);
      return NextResponse.json(
        { success: false, error: 'Failed to query performance data' },
        { status: 500 },
      );
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        performance: {
          total_measured: 0,
          avg_delta: null,
          patterns_tried: 0,
          overperformed_count: 0,
          underperformed_count: 0,
        },
        patterns: [],
        elapsed_ms: Date.now() - startTime,
      });
    }

    // ── Aggregate per-pattern stats ──────────────────────────────────────
    const patternMap = new Map<
      string,
      {
        pattern_name: string;
        narrative_arc: string;
        count: number;
        total_delta: number;
        best_delta: number;
        worst_delta: number;
        overperformed: number;
        underperformed: number;
      }
    >();

    let totalDelta = 0;
    let overperformedCount = 0;
    let underperformedCount = 0;

    for (const r of records as any[]) {
      const delta = Number(r.delta);
      totalDelta += delta;
      if (delta > 10) overperformedCount++;
      if (delta < -10) underperformedCount++;

      const existing = patternMap.get(r.pattern_id);
      const archetype = r.pattern_archetypes;
      const patternName = archetype?.pattern_name || 'unknown';
      const narrativeArc = archetype?.narrative_arc || 'unknown';

      if (existing) {
        existing.count++;
        existing.total_delta += delta;
        existing.best_delta = Math.max(existing.best_delta, delta);
        existing.worst_delta = Math.min(existing.worst_delta, delta);
        if (delta > 10) existing.overperformed++;
        if (delta < -10) existing.underperformed++;
      } else {
        patternMap.set(r.pattern_id, {
          pattern_name: patternName,
          narrative_arc: narrativeArc,
          count: 1,
          total_delta: delta,
          best_delta: delta,
          worst_delta: delta,
          overperformed: delta > 10 ? 1 : 0,
          underperformed: delta < -10 ? 1 : 0,
        });
      }
    }

    // ── Build response ───────────────────────────────────────────────────
    const patternDetails = Array.from(patternMap.entries()).map(
      ([pattern_id, stats]) => ({
        pattern_id,
        pattern_name: stats.pattern_name,
        narrative_arc: stats.narrative_arc,
        briefs_measured: stats.count,
        avg_delta: Math.round((stats.total_delta / stats.count) * 10) / 10,
        best_delta: stats.best_delta,
        worst_delta: stats.worst_delta,
        overperformed: stats.overperformed,
        underperformed: stats.underperformed,
      }),
    );

    // Sort by avg_delta descending (best performing patterns first)
    patternDetails.sort((a, b) => b.avg_delta - a.avg_delta);

    return NextResponse.json({
      success: true,
      performance: {
        total_measured: records.length,
        avg_delta:
          Math.round((totalDelta / records.length) * 10) / 10,
        patterns_tried: patternMap.size,
        overperformed_count: overperformedCount,
        underperformed_count: underperformedCount,
      },
      patterns: patternDetails,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CalendarPerf] Error: ${msg}`);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
