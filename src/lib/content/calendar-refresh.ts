/**
 * Calendar Refresh — Weekly Cron Module
 *
 * Regenerates content calendars for active creators (those with recent
 * brief activity in the last 30 days). Processes in batches of 5 users
 * with 1-second pauses to respect Gemini rate limits.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getISOWeek } from 'date-fns';
import { resolveCreatorContext } from '@/lib/prediction/creator-context';
import { computeOpportunityScore } from '@/lib/patterns/pattern-metrics';
import {
  generateContentCalendar,
  type PatternWithMetrics,
  type BriefHistoryEntry,
  type PatternPerformanceEntry,
  type NarrativeArc,
} from './content-calendar';

// ============================================================================
// Types
// ============================================================================

export interface CalendarRefreshResult {
  refreshed: number;
  skipped: number;
  errors: number;
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Regenerate calendars for users who have at least one accepted brief
 * in the last 30 days (active creators).
 */
export async function refreshActiveCalendars(): Promise<CalendarRefreshResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('[CalendarRefresh] Missing Supabase credentials');
    return { refreshed: 0, skipped: 0, errors: 0 };
  }

  const supabase = createClient(url, key, {
    db: { schema: 'public' },
    auth: { persistSession: false },
  });

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 3600 * 1000,
  ).toISOString();

  // Find active users: those with brief activity in last 30 days
  const { data: activeUsers, error: usersError } = await supabase
    .from('content_briefs')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo)
    .in('status', [
      'accepted',
      'recorded',
      'analyzed',
      'optimized',
      'published',
      'measured',
    ]);

  if (usersError || !activeUsers) {
    console.error(
      `[CalendarRefresh] Failed to query active users: ${usersError?.message || 'no data'}`,
    );
    return { refreshed: 0, skipped: 0, errors: 0 };
  }

  // Deduplicate user_ids
  const userIds = [...new Set(activeUsers.map((u: any) => u.user_id))];
  console.log(`[CalendarRefresh] Found ${userIds.length} active creators`);

  let refreshed = 0;
  let skipped = 0;
  let errors = 0;
  const batchSize = 5;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(userId =>
        refreshCalendarForUser(supabase, userId),
      ),
    );

    for (const r of results) {
      if (r.status === 'fulfilled') {
        if (r.value === 'refreshed') refreshed++;
        else if (r.value === 'skipped') skipped++;
      } else {
        errors++;
        console.error(
          `[CalendarRefresh] User failed: ${r.reason?.message || r.reason}`,
        );
      }
    }

    // Pause between batches for rate limiting
    if (i + batchSize < userIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `[CalendarRefresh] Complete: ${refreshed} refreshed, ${skipped} skipped, ${errors} errors`,
  );

  return { refreshed, skipped, errors };
}

// ============================================================================
// Per-User Refresh
// ============================================================================

async function refreshCalendarForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<'refreshed' | 'skipped'> {
  // Resolve creator context
  const ctx = await resolveCreatorContext(supabase as any, userId);

  if (!ctx || !ctx.calibrationProfile) {
    // No calibration = hasn't completed onboarding, skip
    return 'skipped';
  }

  const niche =
    ctx.calibrationProfile.selectedNiche ||
    ctx.channelData?.inferredNicheKey ||
    null;

  if (!niche) return 'skipped';

  // Fetch patterns for this niche
  const { data: metrics } = await supabase
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

  if (!metrics || metrics.length === 0) return 'skipped';

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

  // Fetch brief history
  const { data: briefs } = await supabase
    .from('content_briefs')
    .select('pattern_id, status, created_at')
    .eq('user_id', userId);

  const briefHistory: BriefHistoryEntry[] = (briefs || []).map((b: any) => ({
    pattern_id: b.pattern_id,
    status: b.status,
    created_at: b.created_at,
  }));

  // Fetch performance history
  const { data: perf } = await supabase
    .from('creator_pattern_performance')
    .select('pattern_id, delta, creator_stage')
    .eq('user_id', userId);

  const performanceHistory: PatternPerformanceEntry[] = (perf || []).map(
    (p: any) => ({
      pattern_id: p.pattern_id,
      delta: Number(p.delta),
      creator_stage: p.creator_stage,
    }),
  );

  // Generate calendar
  const calendar = await generateContentCalendar({
    creatorContext: ctx,
    patterns,
    briefHistory,
    niche,
    performanceHistory,
  });

  if (calendar.briefs.length === 0) return 'skipped';

  // Upsert into content_calendars
  const weekNumber = getISOWeek(new Date());
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 3600 * 1000,
  ).toISOString();

  const { error: upsertError } = await supabase
    .from('content_calendars')
    .upsert(
      {
        user_id: userId,
        niche_key: niche,
        calendar_data: calendar.briefs as any,
        generated_at: calendar.generated_at,
        expires_at: expiresAt,
        week_number: weekNumber,
      } as any,
      { onConflict: 'user_id,week_number' },
    );

  if (upsertError) {
    throw new Error(`Calendar upsert failed: ${upsertError.message}`);
  }

  return 'refreshed';
}
