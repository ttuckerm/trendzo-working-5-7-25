/**
 * Prompt 44 — Server-side tier gate for network intelligence.
 *
 * Resolves the calling user's agency tier and returns a pass/fail.
 * The agency is resolved via the same two-path lookup used by the
 * Prompt 42 memory module (agency_members OR onboarding_profiles.agency_id).
 *
 * For Prompt 44 the gate is the simplest possible shape:
 *   enterprise → pass
 *   anything else → fail with { reason, current_tier }
 *
 * No consumption, no credits — this is a read gate only.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface TierGateResult {
  ok: boolean
  agency_id: string | null
  current_tier: string | null
  reason?: 'unauthenticated' | 'no_agency' | 'tier_below_required'
}

/**
 * Tier check for a known agency id. Split out from requireEnterprise
 * so verification scripts can exercise the tier logic without
 * creating a real auth.users row.
 */
export async function checkAgencyTier(
  db: SupabaseClient,
  agencyId: string,
): Promise<TierGateResult> {
  const { data: agency } = await db
    .from('agencies')
    .select('id, tier, status')
    .eq('id', agencyId)
    .maybeSingle()

  if (!agency || agency.status !== 'active') {
    return { ok: false, agency_id: agencyId, current_tier: null, reason: 'no_agency' }
  }
  if (agency.tier !== 'enterprise') {
    return { ok: false, agency_id: agencyId, current_tier: agency.tier, reason: 'tier_below_required' }
  }
  return { ok: true, agency_id: agencyId, current_tier: agency.tier }
}

export async function requireEnterprise(
  db: SupabaseClient,
  userId: string | null,
): Promise<TierGateResult> {
  if (!userId) return { ok: false, agency_id: null, current_tier: null, reason: 'unauthenticated' }

  // Path A: agency_members
  const { data: memberRows } = await db
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
  let agencyId: string | null = memberRows?.[0]?.agency_id ?? null

  // Path B: onboarding_profiles.agency_id
  if (!agencyId) {
    const { data: profileRows } = await db
      .from('onboarding_profiles')
      .select('agency_id')
      .eq('user_id', userId)
      .not('agency_id', 'is', null)
      .limit(1)
    agencyId = profileRows?.[0]?.agency_id ?? null
  }

  if (!agencyId) return { ok: false, agency_id: null, current_tier: null, reason: 'no_agency' }

  return checkAgencyTier(db, agencyId)
}
