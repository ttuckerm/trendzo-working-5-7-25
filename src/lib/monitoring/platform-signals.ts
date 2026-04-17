/**
 * Platform Signals (Prompt 34)
 *
 * Pure data collection for the platform monitor. Each function
 * returns a structured signal that the rule-based monitor maps
 * to chairman_alerts. No side effects, no alert writes.
 *
 * SCOPE — what we DO collect in v1:
 *   - Agency staleness (no members logged in 7+ days)
 *   - Brief generation rate, this 7d vs prior 7d, per agency
 *   - Per-niche Spearman this week vs last week
 *   - Renewal risk (billing cycle ends <= 30 days + declining brief rate)
 *   - Platform-wide prediction volume, this 7d vs prior 7d
 *
 * DEFERRED (see scoping decisions with Chairman, 2026-04-10):
 *   - Login frequency per agency
 *     DEFERRED: requires a login_events table + auth instrumentation.
 *     Using staleness (last_sign_in_at) as an honest proxy for v1.
 *   - Feature zero-usage / feature-retention correlation
 *     DEFERRED: requires platform_events instrumentation across the app.
 *   - Per-agency prediction count
 *     DEFERRED: requires agency_id on prediction_runs, or a stable
 *     join through video_files → onboarding_profiles.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { runSpearmanEvaluation } from '../training/spearman-evaluator'

// ── Constants ───────────────────────────────────────────────────────────

export const WEEK_MS = 7 * 24 * 3600 * 1000
export const RENEWAL_WARNING_DAYS = 30
export const STALENESS_THRESHOLD_DAYS = 7

// ── Types ───────────────────────────────────────────────────────────────

export interface AgencyStalenessSignal {
  agency_id: string
  agency_name: string
  tier: string
  total_members: number
  stale_members: number
  most_recent_login: string | null
  days_since_most_recent_login: number | null
}

export interface BriefGenerationRateSignal {
  agency_id: string
  agency_name: string
  tier: string
  current_week_count: number
  prior_week_count: number
  delta: number
  pct_change: number | null
}

export interface NicheSpearmanSignal {
  niche: string
  current_rho: number | null
  current_n: number
  prior_rho: number | null
  prior_n: number
  delta: number | null
}

export interface RenewalRiskSignal {
  agency_id: string
  agency_name: string
  tier: string
  billing_cycle_start: string | null
  estimated_renewal_date: string | null
  days_until_renewal: number | null
  current_week_briefs: number
  prior_week_briefs: number
  pct_change: number | null
}

export interface PlatformPredictionVolumeSignal {
  current_week_count: number
  prior_week_count: number
  delta: number
  pct_change: number | null
}

export interface AllPlatformSignals {
  collected_at: string
  agency_staleness: AgencyStalenessSignal[]
  brief_generation_rates: BriefGenerationRateSignal[]
  niche_spearman: NicheSpearmanSignal[]
  renewal_risk: RenewalRiskSignal[]
  platform_prediction_volume: PlatformPredictionVolumeSignal | null
  errors: Array<{ signal: string; error: string }>
}

// ── DB helper ───────────────────────────────────────────────────────────

function getDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null
  return Math.round(((current - prior) / prior) * 10000) / 100
}

// ── Signal 1: Agency staleness ──────────────────────────────────────────

/**
 * For each active agency, count how many members haven't signed in
 * in the last STALENESS_THRESHOLD_DAYS. Uses Supabase auth.users
 * via an RPC since auth.users isn't readable through the normal
 * PostgREST surface.
 */
export async function getAgencyStaleness(
  db: SupabaseClient,
): Promise<AgencyStalenessSignal[]> {
  const { data: agencies, error: agenciesErr } = await db
    .from('agencies')
    .select('id, name, tier')
    .eq('is_active', true)

  if (agenciesErr || !agencies) return []

  const staleThreshold = new Date(Date.now() - STALENESS_THRESHOLD_DAYS * 24 * 3600 * 1000)

  const results: AgencyStalenessSignal[] = []

  for (const agency of agencies) {
    // Get all active members of this agency
    const { data: members } = await db
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agency.id)
      .eq('is_active', true)

    const memberIds = (members || []).map((m: any) => m.user_id).filter(Boolean)
    if (memberIds.length === 0) {
      results.push({
        agency_id: agency.id,
        agency_name: agency.name,
        tier: agency.tier,
        total_members: 0,
        stale_members: 0,
        most_recent_login: null,
        days_since_most_recent_login: null,
      })
      continue
    }

    // Look up last_sign_in_at per member via the admin auth API
    // (service role can enumerate users). We fetch in one batch.
    let mostRecentLogin: Date | null = null
    let staleCount = 0

    try {
      // Supabase JS v2 admin.listUsers is paginated; for v1 we assume
      // agencies have <= 100 members so a single page suffices.
      const { data: listData } = await (db as any).auth.admin.listUsers({ perPage: 1000 })
      const userMap = new Map<string, any>()
      for (const u of listData?.users || []) userMap.set(u.id, u)

      for (const uid of memberIds) {
        const u = userMap.get(uid)
        const lastSignIn = u?.last_sign_in_at ? new Date(u.last_sign_in_at) : null
        if (!lastSignIn || lastSignIn < staleThreshold) {
          staleCount += 1
        }
        if (lastSignIn && (!mostRecentLogin || lastSignIn > mostRecentLogin)) {
          mostRecentLogin = lastSignIn
        }
      }
    } catch {
      // admin.listUsers may not be available in some SDK versions —
      // fall back to marking all members as "unknown" (treat as stale).
      staleCount = memberIds.length
    }

    results.push({
      agency_id: agency.id,
      agency_name: agency.name,
      tier: agency.tier,
      total_members: memberIds.length,
      stale_members: staleCount,
      most_recent_login: mostRecentLogin?.toISOString() ?? null,
      days_since_most_recent_login: mostRecentLogin
        ? Math.floor((Date.now() - mostRecentLogin.getTime()) / (24 * 3600 * 1000))
        : null,
    })
  }

  return results
}

// ── Signal 2: Brief generation rate (this 7d vs prior 7d) ──────────────

/**
 * For each active agency, count briefs created this week vs last week.
 * Briefs link to agencies via content_briefs.user_id →
 * onboarding_profiles.user_id → onboarding_profiles.agency_id.
 *
 * This counts briefs authored by both team members and managed creators,
 * because both flows end up with a row in onboarding_profiles whose
 * agency_id points back to the agency.
 */
export async function getBriefGenerationRates(
  db: SupabaseClient,
): Promise<BriefGenerationRateSignal[]> {
  const now = Date.now()
  const currentStart = new Date(now - WEEK_MS).toISOString()
  const priorStart = new Date(now - 2 * WEEK_MS).toISOString()
  const priorEnd = currentStart

  const { data: agencies } = await db
    .from('agencies')
    .select('id, name, tier')
    .eq('is_active', true)

  if (!agencies) return []

  const results: BriefGenerationRateSignal[] = []

  for (const agency of agencies) {
    // All user_ids that belong to this agency via onboarding_profiles
    const { data: profiles } = await db
      .from('onboarding_profiles')
      .select('user_id')
      .eq('agency_id', agency.id)

    const userIds = (profiles || []).map((p: any) => p.user_id).filter(Boolean)
    if (userIds.length === 0) {
      results.push({
        agency_id: agency.id,
        agency_name: agency.name,
        tier: agency.tier,
        current_week_count: 0,
        prior_week_count: 0,
        delta: 0,
        pct_change: 0,
      })
      continue
    }

    const [{ count: currentCount }, { count: priorCount }] = await Promise.all([
      db
        .from('content_briefs')
        .select('id', { count: 'exact', head: true })
        .in('user_id', userIds)
        .gte('created_at', currentStart),
      db
        .from('content_briefs')
        .select('id', { count: 'exact', head: true })
        .in('user_id', userIds)
        .gte('created_at', priorStart)
        .lt('created_at', priorEnd),
    ])

    const current = currentCount || 0
    const prior = priorCount || 0

    results.push({
      agency_id: agency.id,
      agency_name: agency.name,
      tier: agency.tier,
      current_week_count: current,
      prior_week_count: prior,
      delta: current - prior,
      pct_change: pctChange(current, prior),
    })
  }

  return results
}

// ── Signal 3: Per-niche Spearman, this week vs prior week ──────────────

export async function getNicheSpearmanWeekOverWeek(): Promise<NicheSpearmanSignal[]> {
  const now = Date.now()
  const currentStart = new Date(now - WEEK_MS).toISOString()
  const priorStart = new Date(now - 2 * WEEK_MS).toISOString()
  const priorEnd = currentStart
  const nowIso = new Date(now).toISOString()

  const [current, prior] = await Promise.all([
    runSpearmanEvaluation({ startDate: currentStart, endDate: nowIso, skipPersist: true }).catch(
      () => null,
    ),
    runSpearmanEvaluation({ startDate: priorStart, endDate: priorEnd, skipPersist: true }).catch(
      () => null,
    ),
  ])

  const currentByNiche = new Map<string, { rho: number; n: number }>()
  for (const row of current?.by_niche || []) {
    currentByNiche.set(row.niche, { rho: row.spearman_rho, n: row.n })
  }

  const priorByNiche = new Map<string, { rho: number; n: number }>()
  for (const row of prior?.by_niche || []) {
    priorByNiche.set(row.niche, { rho: row.spearman_rho, n: row.n })
  }

  const niches = new Set([...currentByNiche.keys(), ...priorByNiche.keys()])

  return Array.from(niches)
    .sort()
    .map(niche => {
      const c = currentByNiche.get(niche) || null
      const p = priorByNiche.get(niche) || null
      const delta =
        c != null && p != null
          ? Math.round((c.rho - p.rho) * 10000) / 10000
          : null
      return {
        niche,
        current_rho: c?.rho ?? null,
        current_n: c?.n ?? 0,
        prior_rho: p?.rho ?? null,
        prior_n: p?.n ?? 0,
        delta,
      }
    })
}

// ── Signal 4: Renewal risk ─────────────────────────────────────────────

/**
 * Agency is "at risk" if:
 *   - estimated_renewal_date (billing_cycle_start + 1 month) is within
 *     the next RENEWAL_WARNING_DAYS, AND
 *   - brief generation rate dropped week-over-week
 *
 * Rule-based monitor applies the severity tier. This function just
 * returns the raw numbers for every agency with a billing_cycle_start.
 * Agencies with NULL billing_cycle_start are skipped (v1 heuristic).
 */
export async function getRenewalRisk(
  db: SupabaseClient,
  briefRates: BriefGenerationRateSignal[],
): Promise<RenewalRiskSignal[]> {
  const { data: agencies } = await db
    .from('agencies')
    .select('id, name, tier, billing_cycle_start')
    .eq('is_active', true)
    .not('billing_cycle_start', 'is', null)

  if (!agencies) return []

  const briefRateMap = new Map(briefRates.map(b => [b.agency_id, b]))
  const now = Date.now()
  const results: RenewalRiskSignal[] = []

  for (const agency of agencies) {
    const cycleStart = agency.billing_cycle_start
      ? new Date(agency.billing_cycle_start)
      : null
    if (!cycleStart || Number.isNaN(cycleStart.getTime())) continue

    // Estimate renewal as cycle_start + 1 month.
    // If that date has already passed, advance by whole months until it's in the future.
    const renewal = new Date(cycleStart)
    renewal.setMonth(renewal.getMonth() + 1)
    while (renewal.getTime() < now) {
      renewal.setMonth(renewal.getMonth() + 1)
    }

    const daysUntil = Math.floor((renewal.getTime() - now) / (24 * 3600 * 1000))
    const brief = briefRateMap.get(agency.id)

    results.push({
      agency_id: agency.id,
      agency_name: agency.name,
      tier: agency.tier,
      billing_cycle_start: cycleStart.toISOString(),
      estimated_renewal_date: renewal.toISOString(),
      days_until_renewal: daysUntil,
      current_week_briefs: brief?.current_week_count ?? 0,
      prior_week_briefs: brief?.prior_week_count ?? 0,
      pct_change: brief?.pct_change ?? null,
    })
  }

  return results
}

// ── Signal 5: Platform-wide prediction volume ──────────────────────────

export async function getPlatformPredictionVolume(
  db: SupabaseClient,
): Promise<PlatformPredictionVolumeSignal> {
  const now = Date.now()
  const currentStart = new Date(now - WEEK_MS).toISOString()
  const priorStart = new Date(now - 2 * WEEK_MS).toISOString()
  const priorEnd = currentStart

  const [{ count: currentCount }, { count: priorCount }] = await Promise.all([
    db
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', currentStart),
    db
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', priorStart)
      .lt('created_at', priorEnd),
  ])

  const current = currentCount || 0
  const prior = priorCount || 0

  return {
    current_week_count: current,
    prior_week_count: prior,
    delta: current - prior,
    pct_change: pctChange(current, prior),
  }
}

// ── Aggregate collector ─────────────────────────────────────────────────

export async function collectAllPlatformSignals(
  db?: SupabaseClient,
): Promise<AllPlatformSignals> {
  const client = db || getDb()
  if (!client) {
    return {
      collected_at: new Date().toISOString(),
      agency_staleness: [],
      brief_generation_rates: [],
      niche_spearman: [],
      renewal_risk: [],
      platform_prediction_volume: null,
      errors: [{ signal: 'db', error: 'Database not configured' }],
    }
  }

  const errors: Array<{ signal: string; error: string }> = []

  const [staleness, briefRates, niche, predictionVol] = await Promise.all([
    getAgencyStaleness(client).catch(err => {
      errors.push({ signal: 'agency_staleness', error: err.message })
      return [] as AgencyStalenessSignal[]
    }),
    getBriefGenerationRates(client).catch(err => {
      errors.push({ signal: 'brief_generation_rates', error: err.message })
      return [] as BriefGenerationRateSignal[]
    }),
    getNicheSpearmanWeekOverWeek().catch(err => {
      errors.push({ signal: 'niche_spearman', error: err.message })
      return [] as NicheSpearmanSignal[]
    }),
    getPlatformPredictionVolume(client).catch(err => {
      errors.push({ signal: 'platform_prediction_volume', error: err.message })
      return null
    }),
  ])

  // Renewal risk depends on brief rates — run after.
  const renewalRisk = await getRenewalRisk(client, briefRates).catch(err => {
    errors.push({ signal: 'renewal_risk', error: err.message })
    return [] as RenewalRiskSignal[]
  })

  return {
    collected_at: new Date().toISOString(),
    agency_staleness: staleness,
    brief_generation_rates: briefRates,
    niche_spearman: niche,
    renewal_risk: renewalRisk,
    platform_prediction_volume: predictionVol,
    errors,
  }
}
