/**
 * Pattern Metrics Aggregator
 *
 * Queries archetype_instances for the last 30 days, computes per-pattern per-niche:
 * - instance_count_30d, avg_views_30d
 * - saturation_pct (relative to most popular pattern in that niche)
 * - trend_direction (comparing last 15d vs prior 15d)
 *
 * Upserts results into archetype_niche_metrics.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface MetricsResult {
  patternsUpdated: number;
  nichesProcessed: number;
  elapsed_ms: number;
}

interface InstanceRow {
  pattern_id: string;
  niche_key: string;
  views_count: number | null;
  detected_at: string;
}

interface GroupKey {
  pattern_id: string;
  niche_key: string;
}

interface GroupStats {
  count: number;
  total_views: number;
  first_seen: string;
  count_recent: number;  // last 15 days
  count_prior: number;   // prior 15 days (days 16-30)
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Compute and upsert archetype niche metrics for all patterns.
 */
export async function computeArchetypeMetrics(
  supabase: SupabaseClient,
): Promise<MetricsResult> {
  const startTime = Date.now();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 3600 * 1000).toISOString();

  // Fetch all instances from the last 30 days
  const { data: instances, error } = await supabase
    .from('archetype_instances')
    .select('pattern_id, niche_key, views_count, detected_at')
    .gte('detected_at', thirtyDaysAgo)
    .order('detected_at', { ascending: false });

  if (error) {
    console.error(`[PatternMetrics] Failed to fetch instances: ${error.message}`);
    return { patternsUpdated: 0, nichesProcessed: 0, elapsed_ms: Date.now() - startTime };
  }

  if (!instances || instances.length === 0) {
    console.log('[PatternMetrics] No instances in last 30 days, nothing to compute');
    return { patternsUpdated: 0, nichesProcessed: 0, elapsed_ms: Date.now() - startTime };
  }

  // Group by (pattern_id, niche_key)
  const groups = new Map<string, GroupStats>();
  const nicheMaxCounts = new Map<string, number>();

  for (const row of instances as InstanceRow[]) {
    const key = `${row.pattern_id}::${row.niche_key}`;
    const isRecent = row.detected_at >= fifteenDaysAgo;

    if (!groups.has(key)) {
      groups.set(key, {
        count: 0,
        total_views: 0,
        first_seen: row.detected_at,
        count_recent: 0,
        count_prior: 0,
      });
    }

    const g = groups.get(key)!;
    g.count++;
    g.total_views += row.views_count || 0;
    if (row.detected_at < g.first_seen) g.first_seen = row.detected_at;
    if (isRecent) g.count_recent++;
    else g.count_prior++;
  }

  // Compute max count per niche for saturation calculation
  for (const [key, stats] of groups) {
    const nicheKey = key.split('::')[1];
    const current = nicheMaxCounts.get(nicheKey) || 0;
    if (stats.count > current) {
      nicheMaxCounts.set(nicheKey, stats.count);
    }
  }

  // Also fetch first_seen from all-time data (not just 30 days)
  const firstSeenMap = new Map<string, string>();
  const patternNicheKeys = Array.from(groups.keys());

  // Batch query first_seen for each pattern+niche combo
  for (const key of patternNicheKeys) {
    const [patternId, nicheKey] = key.split('::');
    const { data: earliest } = await supabase
      .from('archetype_instances')
      .select('detected_at')
      .eq('pattern_id', patternId)
      .eq('niche_key', nicheKey)
      .order('detected_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (earliest) {
      firstSeenMap.set(key, earliest.detected_at);
    }
  }

  // Build upsert rows
  const upsertRows: any[] = [];
  const niches = new Set<string>();

  for (const [key, stats] of groups) {
    const [patternId, nicheKey] = key.split('::');
    niches.add(nicheKey);

    const maxInNiche = nicheMaxCounts.get(nicheKey) || 1;
    const saturationPct = maxInNiche > 0
      ? Math.round((stats.count / maxInNiche) * 100 * 10) / 10
      : 0;

    // Trend: compare recent 15d count vs prior 15d count
    let trendDirection: 'ascending' | 'stable' | 'declining' = 'stable';
    if (stats.count_prior > 0) {
      const changeRatio = (stats.count_recent - stats.count_prior) / stats.count_prior;
      if (changeRatio > 0.2) trendDirection = 'ascending';
      else if (changeRatio < -0.2) trendDirection = 'declining';
    } else if (stats.count_recent > 0) {
      // Only recent instances, no prior — it's ascending (new pattern)
      trendDirection = 'ascending';
    }

    upsertRows.push({
      pattern_id: patternId,
      niche_key: nicheKey,
      instance_count_30d: stats.count,
      avg_views_30d: stats.count > 0 ? Math.round(stats.total_views / stats.count) : 0,
      saturation_pct: saturationPct,
      trend_direction: trendDirection,
      first_seen_in_niche: firstSeenMap.get(key) || stats.first_seen,
      last_computed_at: new Date().toISOString(),
    });
  }

  // Upsert in batches of 50
  let updated = 0;
  for (let i = 0; i < upsertRows.length; i += 50) {
    const batch = upsertRows.slice(i, i + 50);
    const { error: upsertError } = await supabase
      .from('archetype_niche_metrics')
      .upsert(batch, { onConflict: 'pattern_id,niche_key' });

    if (upsertError) {
      console.error(`[PatternMetrics] Upsert batch failed: ${upsertError.message}`);
    } else {
      updated += batch.length;
    }
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `[PatternMetrics] Updated ${updated} pattern-niche metrics across ${niches.size} niches in ${elapsed}ms`,
  );

  return {
    patternsUpdated: updated,
    nichesProcessed: niches.size,
    elapsed_ms: elapsed,
  };
}

// ============================================================================
// Lifecycle Stage Helper (used by API endpoint)
// ============================================================================

/**
 * Map saturation percentage to lifecycle stage label.
 */
export function getLifecycleStage(saturationPct: number): string {
  if (saturationPct < 15) return 'first-mover';
  if (saturationPct < 60) return 'ascending';
  if (saturationPct < 85) return 'stable';
  return 'declining';
}

/**
 * Compute opportunity score from saturation and trend.
 * Higher = better opportunity. Ascending + low saturation = highest.
 */
export function computeOpportunityScore(
  saturationPct: number,
  trendDirection: string,
): number {
  const trendMultiplier =
    trendDirection === 'ascending' ? 1.5 :
    trendDirection === 'declining' ? 0.5 :
    1.0;

  return Math.round((100 - saturationPct) * trendMultiplier * 100) / 100;
}
