/**
 * Prompt 42 — Agency pattern preload
 *
 * Copies relevant cross_niche_patterns rows into memory_extractions
 * for a specific agency, at tier='warm'. Called from the admin
 * route POST /api/admin/agencies/[id]/preload-patterns.
 *
 * Selection logic:
 *   1. Resolve the agency's niches via resolveAgencyNiches().
 *   2. For each niche, find cross_niche_patterns where:
 *      a) source_niche matches the agency's niche, OR
 *      b) the agency's niche appears in confirmed_in_niches
 *      (rejected patterns are excluded — no point preloading
 *      something already tested and failed in that niche)
 *   3. Sort by observed_delta DESC, cap at `limit` per run (default 20).
 *   4. For each selected pattern, INSERT a memory_extractions row
 *      with fact = JSON-stringified pattern summary, source =
 *      'cross_niche_preload', tier = 'warm', confidence = a
 *      delta-derived score.
 *
 * Idempotency:
 *   Before inserting, we check for an existing memory_extractions row
 *   with the same agency_id + source='cross_niche_preload' + the
 *   pattern's composite key embedded in `fact`. Duplicates are
 *   skipped rather than creating multiple rows for the same pattern.
 *
 * Why not auto-wire to agency creation:
 *   Per scope: admin-only manual preload for now. A follow-up prompt
 *   can call this from the actual onboarding flow once the agency
 *   niche resolution is validated against real data.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveAgencyNiches } from './agency-niches'

export interface PreloadResult {
  ok: boolean
  agency_id: string
  niches_considered: string[]
  patterns_found: number
  patterns_inserted: number
  patterns_skipped_duplicate: number
  error?: string
}

interface CrossNichePatternRow {
  id: string
  feature_name: string
  source_niche: string
  observed_delta: number
  observed_n: number
  confirmed_in_niches: string[]
  rejected_in_niches: string[]
}

export async function preloadAgencyPatterns(
  db: SupabaseClient,
  agencyId: string,
  limit = 20,
): Promise<PreloadResult> {
  const resolution = await resolveAgencyNiches(db, agencyId)
  // cross_niche_patterns.source_niche has a FK to niches.id, so only
  // canonical niche keys can ever appear in patterns. Profiles with
  // raw keys like 'cooking' (not 'cooking-food') are silently excluded
  // here — they cannot match any real pattern row. A future onboarding
  // migration should normalize raw keys to canonical ones.
  if (resolution.niches.length === 0) {
    return {
      ok: true,
      agency_id: agencyId,
      niches_considered: [],
      patterns_found: 0,
      patterns_inserted: 0,
      patterns_skipped_duplicate: 0,
    }
  }

  // Query cross_niche_patterns that touch any of the agency's niches.
  // Supabase's OR filter handles the "source_niche = ANY or
  // confirmed_in_niches && agency niches" case via two queries unioned
  // client-side — the array contains query via PostgREST requires
  // passing the target array as a comma-separated string with cs filter.
  const nichesCSV = `{${resolution.niches.join(',')}}`

  const { data: bySource, error: e1 } = await db
    .from('cross_niche_patterns')
    .select('id, feature_name, source_niche, observed_delta, observed_n, confirmed_in_niches, rejected_in_niches')
    .in('source_niche', resolution.niches)
    .order('observed_delta', { ascending: false })
    .limit(limit * 2) // headroom before dedup

  const { data: byConfirmed, error: e2 } = await db
    .from('cross_niche_patterns')
    .select('id, feature_name, source_niche, observed_delta, observed_n, confirmed_in_niches, rejected_in_niches')
    .filter('confirmed_in_niches', 'cs', nichesCSV)
    .order('observed_delta', { ascending: false })
    .limit(limit * 2)

  if (e1 || e2) {
    return {
      ok: false,
      agency_id: agencyId,
      niches_considered: resolution.niches,
      patterns_found: 0,
      patterns_inserted: 0,
      patterns_skipped_duplicate: 0,
      error: `cross_niche_patterns lookup failed: ${e1?.message || e2?.message}`,
    }
  }

  // Merge + dedup by pattern id, then filter out patterns REJECTED in
  // any of the agency's niches (no point preloading a known failure).
  const byId = new Map<string, CrossNichePatternRow>()
  for (const row of [...(bySource || []), ...(byConfirmed || [])]) {
    const r = row as unknown as CrossNichePatternRow
    if (!byId.has(r.id)) byId.set(r.id, r)
  }
  const merged = Array.from(byId.values())
    .filter((r) => {
      const rejected = r.rejected_in_niches || []
      return !resolution.niches.some((n) => rejected.includes(n))
    })
    .sort((a, b) => b.observed_delta - a.observed_delta)
    .slice(0, limit)

  if (merged.length === 0) {
    return {
      ok: true,
      agency_id: agencyId,
      niches_considered: resolution.niches,
      patterns_found: 0,
      patterns_inserted: 0,
      patterns_skipped_duplicate: 0,
    }
  }

  // Load existing preloaded facts for this agency to dedup on.
  const { data: existingRows } = await db
    .from('memory_extractions')
    .select('fact')
    .eq('agency_id', agencyId)
    .eq('source', 'cross_niche_preload')

  const existingKeys = new Set<string>()
  for (const row of existingRows || []) {
    const fact = (row as any).fact as string
    // The fact string starts with "cross_niche_pattern:<id>|" — we parse
    // the id back out. If parsing fails, just fall through to insert.
    const m = fact?.match(/^cross_niche_pattern:([a-f0-9-]+)\|/i)
    if (m) existingKeys.add(m[1])
  }

  let inserted = 0
  let skippedDup = 0
  for (const p of merged) {
    if (existingKeys.has(p.id)) {
      skippedDup++
      continue
    }
    const fact =
      `cross_niche_pattern:${p.id}|` +
      `feature=${p.feature_name} ` +
      `source_niche=${p.source_niche} ` +
      `observed_delta=${p.observed_delta.toFixed(4)} ` +
      `observed_n=${p.observed_n} ` +
      `confirmed_in=${(p.confirmed_in_niches || []).join(',')}`

    // Confidence: map delta to [0, 1] with a simple cap. Not a
    // probability — just a monotonic score so the memory consolidation
    // pipeline can rank these against other warm-tier facts.
    const confidence = Math.max(0, Math.min(1, p.observed_delta / 0.5))

    const { error: insErr } = await db.from('memory_extractions').insert({
      agency_id: agencyId,
      fact,
      source: 'cross_niche_preload',
      tier: 'warm',
      confidence,
      reference_count: 0,
    })
    if (!insErr) inserted++
  }

  return {
    ok: true,
    agency_id: agencyId,
    niches_considered: resolution.niches,
    patterns_found: merged.length,
    patterns_inserted: inserted,
    patterns_skipped_duplicate: skippedDup,
  }
}
