/**
 * Prompt 42 — Agency → niches resolver
 *
 * Resolves the set of niches an agency works in by walking:
 *   agency_members (agency_id, user_id, is_active=true)
 *     → onboarding_profiles (user_id) → niche_key
 *     OR → onboarding_profiles.selected_niche  (fallback)
 *
 * Distinct niche keys are returned. If a niche key is present in
 * onboarding_profiles.niche_key but NOT in the canonical niches
 * table, it's still returned — callers decide whether to filter.
 *
 * Why both niche_key and selected_niche: onboarding_profiles has a
 * redundant pair of columns in live schema. niche_key is the
 * preferred canonical one; selected_niche appears as a fallback
 * for profiles that completed via an older flow.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface AgencyNicheResolution {
  agency_id: string
  niches: string[]
  member_count: number
  /** Niches referenced by members that are NOT in the canonical niches table. */
  unknown_niches: string[]
}

export async function resolveAgencyNiches(
  db: SupabaseClient,
  agencyId: string,
): Promise<AgencyNicheResolution> {
  // 1. Collect profiles via BOTH linking paths (live schema uses both):
  //    a) agency_members.user_id → onboarding_profiles.user_id
  //    b) onboarding_profiles.agency_id directly
  const { data: members } = await db
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', agencyId)
    .eq('is_active', true)

  const memberUserIds = (members || []).map((m: any) => m.user_id as string)

  const [viaMembers, viaAgencyIdLink] = await Promise.all([
    memberUserIds.length > 0
      ? db
          .from('onboarding_profiles')
          .select('user_id, niche_key, selected_niche')
          .in('user_id', memberUserIds)
      : Promise.resolve({ data: [] as any[] }),
    db
      .from('onboarding_profiles')
      .select('user_id, niche_key, selected_niche')
      .eq('agency_id', agencyId),
  ])

  const byUserId = new Map<string, any>()
  for (const row of [...((viaMembers.data as any[]) || []), ...((viaAgencyIdLink.data as any[]) || [])]) {
    byUserId.set(row.user_id, row)
  }
  const profiles = Array.from(byUserId.values())
  const totalProfiles = profiles.length
  if (totalProfiles === 0) {
    return { agency_id: agencyId, niches: [], member_count: memberUserIds.length, unknown_niches: [] }
  }

  const raw = new Set<string>()
  for (const p of profiles || []) {
    const nk = ((p as any).niche_key as string | null) || ((p as any).selected_niche as string | null)
    if (nk && nk.trim()) raw.add(nk.trim())
  }

  if (raw.size === 0) {
    return { agency_id: agencyId, niches: [], member_count: totalProfiles, unknown_niches: [] }
  }

  // 3. Validate against canonical niches table — split into known/unknown.
  const { data: canonical } = await db
    .from('niches')
    .select('id')
    .in('id', Array.from(raw))

  const known = new Set((canonical || []).map((r: any) => r.id as string))
  const knownList: string[] = []
  const unknownList: string[] = []
  for (const n of raw) {
    if (known.has(n)) knownList.push(n)
    else unknownList.push(n)
  }

  return {
    agency_id: agencyId,
    niches: knownList,
    member_count: totalProfiles,
    unknown_niches: unknownList,
  }
}

/**
 * Pick the "thinnest" niche among an agency's niches — the one with
 * the fewest scoreable feedback rows in prediction_runs. Used by the
 * cross-niche transfer handler to decide which niche most needs
 * transferred patterns.
 *
 * Returns null if the agency has zero valid niches.
 */
export async function pickThinnestNiche(
  db: SupabaseClient,
  agencyId: string,
): Promise<{ niche: string; row_count: number } | null> {
  const { niches } = await resolveAgencyNiches(db, agencyId)
  if (niches.length === 0) return null

  // Import here to avoid a circular dep on the miner file.
  const { countFeedbackRowsForNiche } = await import('@/lib/training/cross-niche-miner')

  let best: { niche: string; row_count: number } | null = null
  for (const n of niches) {
    const count = await countFeedbackRowsForNiche(db, n)
    if (!best || count < best.row_count) {
      best = { niche: n, row_count: count }
    }
  }
  return best
}
