/**
 * Prompt 42 — Cross-niche feature miner
 *
 * Pure helpers that read from the top_features_per_niche view and
 * the niche_adjacency view (both defined in
 * 20260411_prompt42_cross_niche_patterns.sql). No writes.
 *
 * Design note — why this is empty on real data today:
 *
 * top_features_per_niche only includes training_experiments rows
 * with niche_scope IS NOT NULL. Feature Discovery (Prompt 41)
 * deliberately writes niche_scope=NULL because it evaluates a
 * global pool. Only the legacy runExperiment() niche_specific path
 * contributes to the view. Until that path has run with real data,
 * findTransferCandidates() will return []. That is the honest answer,
 * not a bug — the coordinator task handler surfaces it as a graceful
 * "nothing to transfer" completion with meta.note.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface TopFeatureRow {
  niche: string
  feature_name: string
  total_delta: number
  experiment_count: number
  last_seen: string
  top_experiment_id: string | null
}

export interface TransferCandidate {
  feature_name: string
  source_niche: string
  source_total_delta: number
  source_experiment_count: number
  source_experiment_id: string | null
  shared_category: string
}

/**
 * Fetch the top-N features for a single niche, ordered by summed delta.
 * Returns [] if the niche has no qualifying experiments.
 */
export async function mineTopFeaturesForNiche(
  db: SupabaseClient,
  niche: string,
  limit = 5,
): Promise<TopFeatureRow[]> {
  const { data, error } = await db
    .from('top_features_per_niche')
    .select('niche, feature_name, total_delta, experiment_count, last_seen, top_experiment_id')
    .eq('niche', niche)
    .order('total_delta', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn(`[cross-niche-miner] mineTopFeaturesForNiche failed:`, error.message)
    return []
  }
  return (data || []) as TopFeatureRow[]
}

/**
 * Find candidate features to transfer INTO the given target niche.
 *
 * Algorithm:
 *   1. Look up the target niche's adjacent niches via niche_adjacency.
 *   2. For each adjacent niche, pull its top features (sorted by
 *      total_delta DESC).
 *   3. Dedup by feature_name — if a feature appears in multiple source
 *      niches, keep the one with the highest total_delta.
 *   4. Filter out features already confirmed OR rejected in the target
 *      niche (from cross_niche_patterns), so we don't re-test dead ends.
 *   5. Return top-N by total_delta.
 *
 * Returns [] gracefully on any of: target niche not in niches table,
 * no adjacent niches, no adjacent niche has any top features, all
 * candidates already tested in the target.
 */
export async function findTransferCandidates(
  db: SupabaseClient,
  targetNiche: string,
  topN = 3,
): Promise<TransferCandidate[]> {
  // 1. Adjacent niches.
  const { data: adjRows, error: adjErr } = await db
    .from('niche_adjacency')
    .select('niche_b, shared_category')
    .eq('niche_a', targetNiche)

  if (adjErr) {
    console.warn(`[cross-niche-miner] niche_adjacency lookup failed:`, adjErr.message)
    return []
  }
  const adjacent = (adjRows || []) as Array<{ niche_b: string; shared_category: string }>
  if (adjacent.length === 0) return []

  const categoryByNiche = new Map<string, string>()
  for (const r of adjacent) categoryByNiche.set(r.niche_b, r.shared_category)

  // 2. Top features from each adjacent niche.
  const { data: topRows, error: topErr } = await db
    .from('top_features_per_niche')
    .select('niche, feature_name, total_delta, experiment_count, top_experiment_id')
    .in('niche', adjacent.map((a) => a.niche_b))
    .order('total_delta', { ascending: false })

  if (topErr) {
    console.warn(`[cross-niche-miner] top_features_per_niche lookup failed:`, topErr.message)
    return []
  }
  const topFeatures = (topRows || []) as Array<{
    niche: string
    feature_name: string
    total_delta: number
    experiment_count: number
    top_experiment_id: string | null
  }>
  if (topFeatures.length === 0) return []

  // 3. Dedup by feature_name, keep highest delta.
  const byFeature = new Map<string, TransferCandidate>()
  for (const row of topFeatures) {
    const existing = byFeature.get(row.feature_name)
    if (!existing || row.total_delta > existing.source_total_delta) {
      byFeature.set(row.feature_name, {
        feature_name: row.feature_name,
        source_niche: row.niche,
        source_total_delta: row.total_delta,
        source_experiment_count: row.experiment_count,
        source_experiment_id: row.top_experiment_id,
        shared_category: categoryByNiche.get(row.niche) || '',
      })
    }
  }

  // 4. Filter out features already tested in the target niche.
  //    We hit cross_niche_patterns and exclude anything where the
  //    target niche appears in confirmed_in_niches or rejected_in_niches.
  const candidateNames = Array.from(byFeature.keys())
  if (candidateNames.length === 0) return []

  const { data: alreadyTested, error: atErr } = await db
    .from('cross_niche_patterns')
    .select('feature_name, confirmed_in_niches, rejected_in_niches')
    .in('feature_name', candidateNames)

  if (atErr) {
    console.warn(`[cross-niche-miner] cross_niche_patterns filter lookup failed:`, atErr.message)
    // Non-fatal: fall through and allow retesting. Better to re-run than
    // drop the entire list because the filter query hiccupped.
  } else {
    for (const row of alreadyTested || []) {
      const confirmed: string[] = (row as any).confirmed_in_niches || []
      const rejected: string[] = (row as any).rejected_in_niches || []
      if (confirmed.includes(targetNiche) || rejected.includes(targetNiche)) {
        byFeature.delete((row as any).feature_name)
      }
    }
  }

  // 5. Top-N by source_total_delta.
  return Array.from(byFeature.values())
    .sort((a, b) => b.source_total_delta - a.source_total_delta)
    .slice(0, topN)
}

/**
 * Count scoreable feedback rows (prediction_runs with both prediction
 * and actual DPS) for a single niche. Used to decide if a niche is
 * "thin" (< 100 rows) and should receive transfer candidates.
 *
 * Joins video_files (uuid) for local uploads and scraped_videos (text)
 * for TikTok IDs — same pattern as loadFeedbackData() in trainer-engine.
 */
export async function countFeedbackRowsForNiche(
  db: SupabaseClient,
  niche: string,
): Promise<number> {
  // Step 1: video_ids belonging to this niche.
  const [vfRes, svRes] = await Promise.all([
    db.from('video_files').select('id').eq('niche', niche),
    db.from('scraped_videos').select('video_id').eq('niche', niche),
  ])
  const vfIds = (vfRes.data || []).map((r: any) => r.id as string)
  const svIds = (svRes.data || []).map((r: any) => r.video_id as string)
  const allIds = [...new Set([...vfIds, ...svIds])]
  if (allIds.length === 0) return 0

  // Step 2: count prediction_runs with both dps fields that reference those ids.
  // Batch the .in() in chunks of 200 to stay within Postgres query limits.
  let total = 0
  for (let i = 0; i < allIds.length; i += 200) {
    const batch = allIds.slice(i, i + 200)
    const { count } = await db
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .not('actual_dps', 'is', null)
      .not('predicted_dps_7d', 'is', null)
      .in('video_id', batch)
    total += typeof count === 'number' ? count : 0
  }
  return total
}
