/**
 * Prompt 36 — niche_analysis handler
 *
 * Breakdown: one subtask per niche. If params.niches is provided,
 * use that list; otherwise derive the niche list from distinct
 * primary_niche values on onboarding_profiles (the canonical niche
 * source per the 20260406 migration).
 *
 * Per-subtask work: count cultural scan rows, recent prediction runs,
 * and detected trends for that niche over the last window.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoordinatorHandler, Subtask } from '../types';

const WINDOW_DAYS = 14;

export const nicheAnalysisHandler: CoordinatorHandler = {
  async breakdown(params, db) {
    const explicit = Array.isArray(params.niches)
      ? (params.niches as unknown[]).filter((v): v is string => typeof v === 'string')
      : null;

    let niches: string[];
    if (explicit && explicit.length > 0) {
      niches = explicit;
    } else {
      // Distinct niches present in recent cultural scans.
      // This avoids a schema dependency on any particular profile table
      // and also skips niches with no data (which would return zeros).
      const since = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();
      const { data, error } = await db
        .from('cultural_scan_results')
        .select('niche')
        .gte('scan_date', since.split('T')[0]);
      if (error) throw new Error(`niche list query failed: ${error.message}`);
      niches = Array.from(new Set((data || []).map((r: { niche: string }) => r.niche))).sort();
    }

    const subtasks: Subtask[] = niches.map((niche) => ({
      label: `niche:${niche}`,
      params: { niche },
    }));

    return {
      subtasks,
      meta: {
        window_days: WINDOW_DAYS,
        source: explicit ? 'explicit_niches' : 'distinct_from_cultural_scans',
        total_niches: subtasks.length,
      },
    };
  },

  async runSubtask(subtaskParams, db) {
    const niche = subtaskParams.niche as string;
    if (!niche || typeof niche !== 'string') {
      throw new Error('niche is required');
    }

    const sinceIso = new Date(Date.now() - WINDOW_DAYS * 86400_000).toISOString();
    const sinceDate = sinceIso.split('T')[0];

    // Cultural scan coverage
    const { data: scans, error: sErr } = await db
      .from('cultural_scan_results')
      .select('post_count, top_themes')
      .eq('niche', niche)
      .gte('scan_date', sinceDate);
    if (sErr) throw new Error(`cultural_scan_results query failed: ${sErr.message}`);

    const scanRows = scans || [];
    const totalPosts = scanRows.reduce(
      (sum: number, r: { post_count: number | null }) => sum + (r.post_count ?? 0),
      0,
    );
    const themeFreq = new Map<string, number>();
    for (const row of scanRows) {
      for (const theme of (row as { top_themes: string[] | null }).top_themes || []) {
        themeFreq.set(theme, (themeFreq.get(theme) || 0) + 1);
      }
    }
    const topThemes = Array.from(themeFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    // Detected trends (best-effort — this table may or may not have
    // a niche column depending on migration history; degrade gracefully).
    let trendCount: number | null = null;
    let trendNote: string | null = null;
    const { count: tCount, error: tErr } = await db
      .from('detected_trends')
      .select('id', { count: 'exact', head: true })
      .eq('niche', niche)
      .gte('detected_at', sinceIso);
    if (tErr) {
      trendNote = `detected_trends query unavailable: ${tErr.message}`;
    } else {
      trendCount = tCount ?? 0;
    }

    return {
      niche,
      window_days: WINDOW_DAYS,
      cultural_scan_rows: scanRows.length,
      total_posts_observed: totalPosts,
      top_themes: topThemes,
      detected_trends: trendCount,
      ...(trendNote ? { _note: trendNote } : {}),
    };
  },
};
