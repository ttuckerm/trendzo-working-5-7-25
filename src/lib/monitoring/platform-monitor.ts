/**
 * Platform Monitor (Prompt 34)
 *
 * Rule-based alerting engine. Reads signals from platform-signals.ts,
 * applies severity thresholds, dedups against open chairman_alerts,
 * and writes new alerts. Runs on a 6-hour cron.
 *
 * v1 is purely rule-based. Signals are numeric threshold checks —
 * LLM synthesis is stubbed and will be added when we need cross-signal
 * pattern detection. See `stubLlmEnrichment` below.
 *
 * Dedup policy (per Chairman decision 2026-04-10):
 *   - Skip writing a new alert if an open alert already exists for the
 *     same (alert_type, agency_id) pair.
 *   - If that existing open alert is older than 7 days, bump its
 *     created_at to now so it stays visible in the banner.
 *
 * Confidence/severity threshold:
 *   - Only writes severity >= 'warning' with confidence >= 0.6.
 *   - 'info' alerts are dropped at the writer.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  collectAllPlatformSignals,
  type AllPlatformSignals,
  type AgencyStalenessSignal,
  type BriefGenerationRateSignal,
  type NicheSpearmanSignal,
  type RenewalRiskSignal,
  type PlatformPredictionVolumeSignal,
  RENEWAL_WARNING_DAYS,
  STALENESS_THRESHOLD_DAYS,
} from './platform-signals'

const MIN_SEVERITY: AlertSeverity = 'warning'
const MIN_CONFIDENCE = 0.6
const STALE_ALERT_BUMP_DAYS = 7

// Rule thresholds
const STALENESS_WARNING_PCT = 0.5 // >= 50% of members stale → warning
const STALENESS_CRITICAL_PCT = 1.0 // 100% of members stale → critical

const BRIEF_DROP_WARNING_PCT = -30 // briefs down 30% w/w → warning
const BRIEF_DROP_CRITICAL_PCT = -60 // briefs down 60% w/w → critical
const BRIEF_MIN_PRIOR = 3 // ignore agencies with < 3 briefs prior week (noise floor)

const SPEARMAN_DROP_WARNING = -0.05
const SPEARMAN_DROP_CRITICAL = -0.10
const SPEARMAN_MIN_N = 10 // need at least 10 labeled runs in both windows

const PLATFORM_VOLUME_DROP_WARNING = -40 // platform-wide prediction volume down 40% → warning

const RENEWAL_AT_RISK_DROP_PCT = -30 // brief drop >= 30% + within 30d of renewal → warning

// ── Types ───────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface PendingAlert {
  alert_type: string
  severity: AlertSeverity
  agency_id: string | null
  title: string
  body: string
  payload: Record<string, any>
  action_type: string | null
  action_payload: Record<string, any> | null
  confidence: number
}

export interface MonitorResult {
  collected_at: string
  signal_counts: {
    agency_staleness: number
    brief_generation_rates: number
    niche_spearman: number
    renewal_risk: number
  }
  signal_errors: AllPlatformSignals['errors']
  candidate_alerts: number
  suppressed_low_severity: number
  suppressed_low_confidence: number
  suppressed_duplicate: number
  bumped_existing: number
  written: number
  write_errors: number
  details: Array<{
    alert_type: string
    agency_id: string | null
    outcome: 'written' | 'deduped' | 'bumped' | 'dropped_severity' | 'dropped_confidence' | 'error'
    severity?: AlertSeverity
    confidence?: number
    error?: string
  }>
}

// ── DB helper ───────────────────────────────────────────────────────────

function getDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── Main entry point ───────────────────────────────────────────────────

export async function runPlatformMonitor(
  db?: SupabaseClient,
): Promise<MonitorResult> {
  const client = db || getDb()
  if (!client) {
    return emptyResult({ signal: 'db', error: 'Database not configured' })
  }

  const signals = await collectAllPlatformSignals(client)

  // Map signals → candidate alerts using rule-based logic
  const candidates: PendingAlert[] = []
  candidates.push(...ruleAgencyStaleness(signals.agency_staleness))
  candidates.push(...ruleBriefRateDrop(signals.brief_generation_rates))
  candidates.push(...ruleNicheSpearmanDrop(signals.niche_spearman))
  candidates.push(...ruleRenewalRisk(signals.renewal_risk))
  const platformVolumeAlert = rulePlatformVolumeDrop(signals.platform_prediction_volume)
  if (platformVolumeAlert) candidates.push(platformVolumeAlert)

  // TODO: LLM enrichment layer — adds natural-language summaries and
  // cross-signal pattern detection. Not called in v1 because rule-based
  // thresholds capture all current signals directly. Wire in when we
  // have enough signal diversity that cross-correlation matters (e.g.
  // "brief rate dropped AND renewal approaching AND spearman degraded
  // in the same niche" → synthesized narrative).
  // const enriched = await stubLlmEnrichment(candidates, signals)

  const result: MonitorResult = {
    collected_at: signals.collected_at,
    signal_counts: {
      agency_staleness: signals.agency_staleness.length,
      brief_generation_rates: signals.brief_generation_rates.length,
      niche_spearman: signals.niche_spearman.length,
      renewal_risk: signals.renewal_risk.length,
    },
    signal_errors: signals.errors,
    candidate_alerts: candidates.length,
    suppressed_low_severity: 0,
    suppressed_low_confidence: 0,
    suppressed_duplicate: 0,
    bumped_existing: 0,
    written: 0,
    write_errors: 0,
    details: [],
  }

  for (const alert of candidates) {
    // Threshold gates
    if (severityRank(alert.severity) < severityRank(MIN_SEVERITY)) {
      result.suppressed_low_severity += 1
      result.details.push({
        alert_type: alert.alert_type,
        agency_id: alert.agency_id,
        outcome: 'dropped_severity',
        severity: alert.severity,
      })
      continue
    }
    if (alert.confidence < MIN_CONFIDENCE) {
      result.suppressed_low_confidence += 1
      result.details.push({
        alert_type: alert.alert_type,
        agency_id: alert.agency_id,
        outcome: 'dropped_confidence',
        severity: alert.severity,
        confidence: alert.confidence,
      })
      continue
    }

    // Dedup against existing open alerts for (alert_type, agency_id).
    const existing = await findOpenAlert(client, alert.alert_type, alert.agency_id)
    if (existing) {
      const ageDays = (Date.now() - new Date(existing.created_at).getTime()) / (24 * 3600 * 1000)
      if (ageDays >= STALE_ALERT_BUMP_DAYS) {
        // Bump: keep the same alert visible by moving created_at to now.
        const { error: bumpErr } = await client
          .from('chairman_alerts')
          .update({ created_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (bumpErr) {
          result.write_errors += 1
          result.details.push({
            alert_type: alert.alert_type,
            agency_id: alert.agency_id,
            outcome: 'error',
            error: bumpErr.message,
          })
        } else {
          result.bumped_existing += 1
          result.details.push({
            alert_type: alert.alert_type,
            agency_id: alert.agency_id,
            outcome: 'bumped',
            severity: alert.severity,
          })
        }
      } else {
        result.suppressed_duplicate += 1
        result.details.push({
          alert_type: alert.alert_type,
          agency_id: alert.agency_id,
          outcome: 'deduped',
          severity: alert.severity,
        })
      }
      continue
    }

    // Insert new alert
    const { error: insertErr } = await client.from('chairman_alerts').insert({
      alert_type: alert.alert_type,
      severity: alert.severity,
      agency_id: alert.agency_id,
      title: alert.title,
      body: alert.body,
      payload: { ...alert.payload, confidence: alert.confidence },
      action_type: alert.action_type,
      action_payload: alert.action_payload,
      status: 'open',
    } as any)

    if (insertErr) {
      result.write_errors += 1
      result.details.push({
        alert_type: alert.alert_type,
        agency_id: alert.agency_id,
        outcome: 'error',
        error: insertErr.message,
      })
    } else {
      result.written += 1
      result.details.push({
        alert_type: alert.alert_type,
        agency_id: alert.agency_id,
        outcome: 'written',
        severity: alert.severity,
        confidence: alert.confidence,
      })
    }
  }

  return result
}

// ── Rule implementations ───────────────────────────────────────────────

function ruleAgencyStaleness(signals: AgencyStalenessSignal[]): PendingAlert[] {
  const alerts: PendingAlert[] = []
  for (const s of signals) {
    if (s.total_members === 0) continue // brand-new agency, no team yet — not actionable
    const stalePct = s.stale_members / s.total_members
    if (stalePct < STALENESS_WARNING_PCT) continue

    const severity: AlertSeverity =
      stalePct >= STALENESS_CRITICAL_PCT ? 'critical' : 'warning'

    const confidence = 0.9 // staleness is a direct observation, high confidence

    alerts.push({
      alert_type: 'agency_staleness',
      severity,
      agency_id: s.agency_id,
      title: `${s.agency_name}: ${s.stale_members}/${s.total_members} members inactive ${STALENESS_THRESHOLD_DAYS}d+`,
      body:
        severity === 'critical'
          ? `No members of ${s.agency_name} have signed in for ${STALENESS_THRESHOLD_DAYS}+ days. Most recent login: ${s.most_recent_login ?? 'never'}. Churn risk.`
          : `${s.stale_members} of ${s.total_members} members of ${s.agency_name} have not signed in for ${STALENESS_THRESHOLD_DAYS}+ days. Most recent login: ${s.most_recent_login ?? 'never'}.`,
      payload: {
        total_members: s.total_members,
        stale_members: s.stale_members,
        stale_pct: Math.round(stalePct * 100) / 100,
        most_recent_login: s.most_recent_login,
        days_since_most_recent_login: s.days_since_most_recent_login,
        tier: s.tier,
      },
      action_type: null,
      action_payload: null,
      confidence,
    })
  }
  return alerts
}

function ruleBriefRateDrop(signals: BriefGenerationRateSignal[]): PendingAlert[] {
  const alerts: PendingAlert[] = []
  for (const s of signals) {
    // Noise floor: ignore agencies with < 3 briefs in prior week
    if (s.prior_week_count < BRIEF_MIN_PRIOR) continue
    if (s.pct_change == null) continue
    if (s.pct_change > BRIEF_DROP_WARNING_PCT) continue

    const severity: AlertSeverity =
      s.pct_change <= BRIEF_DROP_CRITICAL_PCT ? 'critical' : 'warning'

    // Confidence scales with sample size — a 60% drop from 3→1 is less
    // reliable than 60% drop from 50→20.
    const confidence = Math.min(0.95, 0.5 + s.prior_week_count / 100)

    alerts.push({
      alert_type: 'brief_rate_drop',
      severity,
      agency_id: s.agency_id,
      title: `${s.agency_name}: brief generation down ${Math.abs(s.pct_change).toFixed(0)}% week-over-week`,
      body: `${s.agency_name} generated ${s.current_week_count} briefs this week vs ${s.prior_week_count} last week (${s.pct_change >= 0 ? '+' : ''}${s.pct_change.toFixed(1)}%). Investigate agency engagement.`,
      payload: {
        current_week_count: s.current_week_count,
        prior_week_count: s.prior_week_count,
        delta: s.delta,
        pct_change: s.pct_change,
        tier: s.tier,
      },
      action_type: null,
      action_payload: null,
      confidence,
    })
  }
  return alerts
}

function ruleNicheSpearmanDrop(signals: NicheSpearmanSignal[]): PendingAlert[] {
  const alerts: PendingAlert[] = []
  for (const s of signals) {
    // Both windows must have enough runs for the comparison to be meaningful
    if (s.current_n < SPEARMAN_MIN_N || s.prior_n < SPEARMAN_MIN_N) continue
    if (s.delta == null) continue
    if (s.delta > SPEARMAN_DROP_WARNING) continue

    const severity: AlertSeverity =
      s.delta <= SPEARMAN_DROP_CRITICAL ? 'critical' : 'warning'

    const confidence = Math.min(0.9, 0.5 + Math.min(s.current_n, s.prior_n) / 60)

    alerts.push({
      alert_type: 'niche_spearman_drop',
      severity,
      agency_id: null, // platform-wide signal
      title: `${s.niche} prediction accuracy dropped ${s.delta.toFixed(4)} week-over-week`,
      body: `Spearman rho for ${s.niche} dropped from ${s.prior_rho?.toFixed(4)} (n=${s.prior_n}) to ${s.current_rho?.toFixed(4)} (n=${s.current_n}). Investigate feature pipeline or data drift for this niche.`,
      payload: {
        niche: s.niche,
        current_rho: s.current_rho,
        current_n: s.current_n,
        prior_rho: s.prior_rho,
        prior_n: s.prior_n,
        delta: s.delta,
      },
      action_type: null,
      action_payload: null,
      confidence,
    })

    // Prompt 40 — Self-Scheduler hook. Critical-severity niche drops
    // schedule an emergency retrain tonight. Fire-and-forget dynamic
    // import so this sync function stays sync and any scheduler error
    // is swallowed inside scheduleActionSafe.
    if (severity === 'critical') {
      // Narrow once, capture into locals — TS can't thread the earlier
      // null-check across the async .then() closure boundary.
      const delta = s.delta
      const niche = s.niche
      const currentRho = s.current_rho
      import('@/lib/scheduler/schedule-action').then(({ scheduleActionSafe, tonightAt3AmUtc }) => {
        void scheduleActionSafe({
          actionType: 'emergency_retrain',
          triggerCondition: `Niche "${niche}" Spearman dropped ${delta.toFixed(4)} (critical threshold)`,
          scheduledFor: tonightAt3AmUtc(),
          sourceSubsystem: 'proactive',
          params: { niche, current_rho: currentRho, delta },
        })
      }).catch(() => { /* non-fatal, by design */ })
    }
  }
  return alerts
}

function ruleRenewalRisk(signals: RenewalRiskSignal[]): PendingAlert[] {
  const alerts: PendingAlert[] = []
  for (const s of signals) {
    if (s.days_until_renewal == null || s.days_until_renewal > RENEWAL_WARNING_DAYS) continue
    if (s.pct_change == null || s.pct_change > RENEWAL_AT_RISK_DROP_PCT) continue
    if (s.prior_week_briefs < BRIEF_MIN_PRIOR) continue

    // Renewal risk is always warning — no critical tier (escalation is human)
    const severity: AlertSeverity = 'warning'
    const confidence = 0.75

    alerts.push({
      alert_type: 'renewal_risk',
      severity,
      agency_id: s.agency_id,
      title: `${s.agency_name}: renewal in ${s.days_until_renewal}d, brief usage down ${Math.abs(s.pct_change).toFixed(0)}%`,
      body: `${s.agency_name} (${s.tier}) renews in ${s.days_until_renewal} days. Brief generation dropped from ${s.prior_week_briefs} to ${s.current_week_briefs} week-over-week (${s.pct_change.toFixed(1)}%). Proactive outreach recommended.`,
      payload: {
        days_until_renewal: s.days_until_renewal,
        estimated_renewal_date: s.estimated_renewal_date,
        billing_cycle_start: s.billing_cycle_start,
        current_week_briefs: s.current_week_briefs,
        prior_week_briefs: s.prior_week_briefs,
        pct_change: s.pct_change,
        tier: s.tier,
      },
      action_type: null,
      action_payload: null,
      confidence,
    })
  }
  return alerts
}

function rulePlatformVolumeDrop(
  signal: PlatformPredictionVolumeSignal | null,
): PendingAlert | null {
  if (!signal) return null
  if (signal.prior_week_count < 10) return null // noise floor for platform-wide
  if (signal.pct_change == null) return null
  if (signal.pct_change > PLATFORM_VOLUME_DROP_WARNING) return null

  return {
    alert_type: 'platform_volume_drop',
    severity: 'warning',
    agency_id: null,
    title: `Platform prediction volume down ${Math.abs(signal.pct_change).toFixed(0)}% week-over-week`,
    body: `Total predictions dropped from ${signal.prior_week_count} last week to ${signal.current_week_count} this week (${signal.pct_change.toFixed(1)}%). Check pipeline health and agency activity.`,
    payload: {
      current_week_count: signal.current_week_count,
      prior_week_count: signal.prior_week_count,
      delta: signal.delta,
      pct_change: signal.pct_change,
    },
    action_type: null,
    action_payload: null,
    confidence: 0.8,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function severityRank(s: AlertSeverity): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : 1
}

async function findOpenAlert(
  db: SupabaseClient,
  alertType: string,
  agencyId: string | null,
): Promise<{ id: string; created_at: string } | null> {
  // Dedup against any "still-live" alert for this (alert_type, agency_id):
  //   - open: never seen
  //   - acknowledged: seen but condition still exists
  //   - snoozed with snoozed_until still in the future: temporarily hidden
  //
  // Expired snoozes (snoozed_until <= now) do NOT suppress a new alert —
  // the whole point of snooze is "hide for 24h, then let the next one through".
  // Only 'resolved' and 'dismissed' are permanent closures.
  const nowIso = new Date().toISOString()

  let query = db
    .from('chairman_alerts')
    .select('id, created_at, status, snoozed_until')
    .eq('alert_type', alertType)
    .in('status', ['open', 'acknowledged', 'snoozed'])
    .order('created_at', { ascending: false })
    .limit(5) // grab a few in case the most recent is an expired snooze

  if (agencyId === null) {
    query = query.is('agency_id', null)
  } else {
    query = query.eq('agency_id', agencyId)
  }

  const { data } = await query
  if (!data || data.length === 0) return null

  // Filter out snoozed rows whose snooze has already expired.
  const live = data.find((row: any) => {
    if (row.status !== 'snoozed') return true
    if (!row.snoozed_until) return true
    return new Date(row.snoozed_until).toISOString() > nowIso
  })

  return live ? { id: live.id, created_at: live.created_at } : null
}

function emptyResult(err: { signal: string; error: string }): MonitorResult {
  return {
    collected_at: new Date().toISOString(),
    signal_counts: {
      agency_staleness: 0,
      brief_generation_rates: 0,
      niche_spearman: 0,
      renewal_risk: 0,
    },
    signal_errors: [err],
    candidate_alerts: 0,
    suppressed_low_severity: 0,
    suppressed_low_confidence: 0,
    suppressed_duplicate: 0,
    bumped_existing: 0,
    written: 0,
    write_errors: 0,
    details: [],
  }
}

// ── Stub: LLM enrichment layer (deferred to v2) ────────────────────────

/**
 * TODO: LLM enrichment layer — adds natural-language summaries and
 * cross-signal pattern detection. Takes rule-based candidate alerts
 * plus the raw signals, asks Gemini to:
 *   1. Summarize each alert in Chairman-facing language
 *   2. Detect cross-signal patterns (e.g. "brief drop + renewal +
 *      staleness in the same agency → coordinated churn signal")
 *   3. Return a confidence score per alert
 *
 * Wire in when: rule-based thresholds miss important patterns that
 * only show up as combinations of weak individual signals.
 *
 * Match pattern at: src/app/api/agency/batch-briefs/route.ts (Gemini call)
 */
// async function stubLlmEnrichment(
//   candidates: PendingAlert[],
//   signals: AllPlatformSignals,
// ): Promise<PendingAlert[]> {
//   return candidates
// }
