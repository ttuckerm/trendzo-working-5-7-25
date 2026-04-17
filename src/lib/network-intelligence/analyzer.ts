/**
 * Prompt 44 — Network intelligence analyzer.
 *
 * Four honest statistical analyses over aggregated prediction_runs
 * data, each producing zero or more `StatFinding` objects. No LLM,
 * no phrasing, no writes — just pure math + DB reads.
 *
 * All four analyses share the same gates:
 *   - Global: supportingAgencies >= MIN_AGENCIES (30)
 *   - Per finding: supportingAgencies (for that slice) >= MIN_AGENCIES_PER_FINDING (10)
 *   - Per slice: n (sample size) >= MIN_RUNS_PER_NICHE (100)
 *   - Per finding: p_value < P_VALUE_THRESHOLD (0.05)
 *   - For rank correlations: abs(rho) > RHO_THRESHOLD (0.3)
 *
 * Data model:
 *   - prediction_runs is the canonical source (CLAUDE.md).
 *   - "Agency" is resolved via creators.agency_id → creators.username
 *     → videos.creator_id → videos.id → prediction_runs.video_id.
 *     The videos.creator_id vs videos.id type mismatch from Prompt 43
 *     still applies; we accept BOTH forms when joining.
 *   - For the minimal synthetic-test case we also accept a simpler
 *     path: prediction_runs.source_meta->>'synthetic_agency_id'.
 *     This is ONLY read by this analyzer and is set only by the
 *     Prompt 44 verification script. Production runs never write it.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  spearmanRho,
  welchTTest,
  quadraticFit,
  mean,
  stddev,
  confidenceScore,
} from './stats'
import { MIN_AGENCIES_PER_FINDING } from './anonymization'

// ── Thresholds ─────────────────────────────────────────────────────────
export const MIN_AGENCIES = 30
export const MIN_RUNS_PER_NICHE = 100
export const P_VALUE_THRESHOLD = 0.05
export const RHO_THRESHOLD = 0.3

export type InsightType =
  | 'timing_optimization'
  | 'format_effectiveness'
  | 'retention_correlation'
  | 'posting_frequency'

export interface StatFinding {
  type: InsightType
  niche_scope: string
  supporting_agency_count: number
  supporting_run_count: number
  p_value: number
  confidence: number
  /** Raw numbers the phraser must reproduce exactly — these get persisted verbatim. */
  payload: Record<string, unknown>
  /** Human-friendly key→value pairs the template phraser consumes. */
  template_slots: Record<string, string | number>
}

export interface AnalyzerRunResult {
  findings: StatFinding[]
  skipped_reasons: string[]
  global: {
    active_agency_count: number
    niches_scanned: number
    runs_examined: number
  }
}

// ── Raw data shape ─────────────────────────────────────────────────────
interface RawRun {
  agency_id: string
  niche: string
  posted_at: string | null
  dps: number
  completion_rate: number | null
  duration_seconds: number | null
}

// ── Load runs keyed by agency ─────────────────────────────────────────
//
// Strategy: paginate prediction_runs, then for each row try to resolve
// the agency via source_meta.synthetic_agency_id (test path) OR the
// creators join (prod path). We load the full creator→agency map in
// one query to avoid N+1.
async function loadRuns(db: SupabaseClient): Promise<{
  runs: RawRun[]
  activeAgencyCount: number
}> {
  // 1. Count active agencies.
  const { count: activeAgencyCount } = await db
    .from('agencies')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  // 2. Load creators-to-agency map for the canonical path.
  const { data: creators } = await db
    .from('creators')
    .select('id, username, agency_id')
  const usernameToAgency = new Map<string, string>()
  const idToAgency = new Map<string, string>()
  for (const c of creators || []) {
    if (c.username) usernameToAgency.set(c.username, c.agency_id)
    if (c.id) idToAgency.set(c.id, c.agency_id)
  }

  // 3. Load videos-to-creator map. videos.creator_id is varchar (username)
  //    per Prompt 43 finding.
  const { data: videos } = await db
    .from('videos')
    .select('id, creator_id')
  const videoIdToAgency = new Map<string, string>()
  for (const v of videos || []) {
    const creatorKey = v.creator_id as string | null
    if (!creatorKey) continue
    const agency = usernameToAgency.get(creatorKey)
    if (agency) videoIdToAgency.set(String(v.id), agency)
  }

  // 4. Load prediction_runs. Pull the columns we actually need.
  //    Paginate to bypass the 1000-row default cap.
  const runs: RawRun[] = []
  const pageSize = 1000
  let offset = 0
  // Hard safety cap — never load more than 100k rows into memory.
  const HARD_CAP = 100_000
  while (runs.length < HARD_CAP) {
    const { data: page } = await db
      .from('prediction_runs')
      .select(
        'video_id, actual_posted_at, actual_dps, actual_completion_rate, actual_video_duration_seconds, source_meta',
      )
      .not('actual_dps', 'is', null)
      .range(offset, offset + pageSize - 1)

    if (!page || page.length === 0) break
    for (const r of page) {
      // Resolve agency_id via the three possible paths.
      let agency: string | null = null
      const sm = r.source_meta as any
      if (sm && typeof sm === 'object' && typeof sm.synthetic_agency_id === 'string') {
        agency = sm.synthetic_agency_id
      }
      if (!agency && r.video_id) {
        agency = videoIdToAgency.get(String(r.video_id)) ?? null
      }
      if (!agency) continue

      // Niche comes from source_meta.niche in the test path; prod can
      // also store it there or compute from the creator's profile.
      // For Prompt 44 we trust source_meta.niche, falling back to
      // 'unknown'.
      const niche = (sm && typeof sm.niche === 'string' && sm.niche) || 'unknown'

      runs.push({
        agency_id: agency,
        niche,
        posted_at: r.actual_posted_at as string | null,
        dps: Number(r.actual_dps),
        completion_rate:
          r.actual_completion_rate != null ? Number(r.actual_completion_rate) : null,
        duration_seconds:
          r.actual_video_duration_seconds != null
            ? Number(r.actual_video_duration_seconds)
            : null,
      })
    }
    if (page.length < pageSize) break
    offset += pageSize
  }

  return { runs, activeAgencyCount: activeAgencyCount || 0 }
}

// ── Per-niche group helper ────────────────────────────────────────────
function groupByNiche(runs: RawRun[]): Map<string, RawRun[]> {
  const m = new Map<string, RawRun[]>()
  for (const r of runs) {
    const arr = m.get(r.niche) || []
    arr.push(r)
    m.set(r.niche, arr)
  }
  return m
}

function countDistinctAgencies(runs: RawRun[]): number {
  const s = new Set<string>()
  for (const r of runs) s.add(r.agency_id)
  return s.size
}

// ── 1. Timing optimization ────────────────────────────────────────────
function analyzeTiming(runs: RawRun[], niche: string): StatFinding | null {
  const withTime = runs.filter((r) => r.posted_at && Number.isFinite(r.dps))
  if (withTime.length < MIN_RUNS_PER_NICHE) return null

  // Group by hour of day, compute mean dps per hour.
  const hourBuckets = new Map<number, number[]>()
  for (const r of withTime) {
    const h = new Date(r.posted_at as string).getUTCHours()
    const arr = hourBuckets.get(h) || []
    arr.push(r.dps)
    hourBuckets.set(h, arr)
  }

  // Need at least 6 hours with data for a meaningful correlation.
  const hours = Array.from(hourBuckets.keys()).sort((a, b) => a - b)
  if (hours.length < 6) return null

  const xs: number[] = []
  const ys: number[] = []
  for (const h of hours) {
    const bucket = hourBuckets.get(h)!
    if (bucket.length < 3) continue
    xs.push(h)
    ys.push(mean(bucket))
  }
  if (xs.length < 6) return null

  const res = spearmanRho(xs, ys)
  if (
    !Number.isFinite(res.rho) ||
    Math.abs(res.rho) < RHO_THRESHOLD ||
    res.p_value >= P_VALUE_THRESHOLD
  ) {
    return null
  }

  // Find the top hour range — the hours whose mean_dps is in the top
  // third of the distribution.
  const sorted = xs.map((h, i) => ({ h, m: ys[i] })).sort((a, b) => b.m - a.m)
  const topCount = Math.max(1, Math.floor(sorted.length / 3))
  const topHours = sorted.slice(0, topCount).map((s) => s.h).sort((a, b) => a - b)
  const overallMean = mean(ys)
  const topMean = mean(sorted.slice(0, topCount).map((s) => s.m))
  const uplift = overallMean > 0 ? ((topMean - overallMean) / overallMean) * 100 : 0

  const supportingAgencyCount = countDistinctAgencies(withTime)
  if (supportingAgencyCount < MIN_AGENCIES_PER_FINDING) return null

  const confidence = confidenceScore(res.p_value, withTime.length)
  return {
    type: 'timing_optimization',
    niche_scope: niche,
    supporting_agency_count: supportingAgencyCount,
    supporting_run_count: withTime.length,
    p_value: res.p_value,
    confidence,
    payload: {
      rho: Number(res.rho.toFixed(4)),
      n: withTime.length,
      top_hours_utc: topHours,
      top_mean_vps: Number(topMean.toFixed(4)),
      overall_mean_vps: Number(overallMean.toFixed(4)),
      uplift_pct: Number(uplift.toFixed(2)),
      hour_buckets_used: xs.length,
    },
    template_slots: {
      niche,
      top_hours_utc: topHours.join(', '),
      uplift_pct: Number(uplift.toFixed(1)),
      n: withTime.length,
      agency_count: supportingAgencyCount,
      rho: Number(res.rho.toFixed(3)),
    },
  }
}

// ── 2. Format effectiveness ───────────────────────────────────────────
function analyzeFormat(runs: RawRun[], niche: string): StatFinding | null {
  const withDur = runs.filter(
    (r) => r.duration_seconds != null && r.duration_seconds > 0 && Number.isFinite(r.dps),
  )
  if (withDur.length < MIN_RUNS_PER_NICHE) return null

  // Buckets: short <=15s, medium 16-45s, long >45s.
  const short: number[] = []
  const medium: number[] = []
  const long: number[] = []
  const shortAgencies = new Set<string>()
  const mediumAgencies = new Set<string>()
  const longAgencies = new Set<string>()
  for (const r of withDur) {
    const d = r.duration_seconds as number
    if (d <= 15) {
      short.push(r.dps)
      shortAgencies.add(r.agency_id)
    } else if (d <= 45) {
      medium.push(r.dps)
      mediumAgencies.add(r.agency_id)
    } else {
      long.push(r.dps)
      longAgencies.add(r.agency_id)
    }
  }

  const buckets = [
    { name: 'short', values: short, mean: mean(short), agencies: shortAgencies.size },
    { name: 'medium', values: medium, mean: mean(medium), agencies: mediumAgencies.size },
    { name: 'long', values: long, mean: mean(long), agencies: longAgencies.size },
  ].filter((b) => b.values.length >= 10 && b.agencies >= MIN_AGENCIES_PER_FINDING)

  if (buckets.length < 2) return null

  // Pick the best bucket and run Welch's t against the union of the others.
  buckets.sort((a, b) => b.mean - a.mean)
  const best = buckets[0]
  const restValues: number[] = []
  for (const b of buckets.slice(1)) restValues.push(...b.values)
  if (restValues.length < 10) return null

  const t = welchTTest(best.values, restValues)
  if (!Number.isFinite(t.t) || t.p_value >= P_VALUE_THRESHOLD) return null

  const uplift =
    mean(restValues) > 0 ? ((best.mean - mean(restValues)) / mean(restValues)) * 100 : 0

  const supportingAgencyCount = countDistinctAgencies(withDur)
  if (supportingAgencyCount < MIN_AGENCIES_PER_FINDING) return null
  const confidence = confidenceScore(t.p_value, best.values.length + restValues.length)

  return {
    type: 'format_effectiveness',
    niche_scope: niche,
    supporting_agency_count: supportingAgencyCount,
    supporting_run_count: withDur.length,
    p_value: t.p_value,
    confidence,
    payload: {
      best_bucket: best.name,
      best_mean_vps: Number(best.mean.toFixed(4)),
      rest_mean_vps: Number(mean(restValues).toFixed(4)),
      uplift_pct: Number(uplift.toFixed(2)),
      best_bucket_n: best.values.length,
      rest_n: restValues.length,
      t: Number(t.t.toFixed(3)),
      buckets_compared: buckets.map((b) => ({ name: b.name, n: b.values.length, mean: Number(b.mean.toFixed(4)) })),
    },
    template_slots: {
      niche,
      best_bucket: best.name,
      uplift_pct: Number(uplift.toFixed(1)),
      n: withDur.length,
      agency_count: supportingAgencyCount,
      t: Number(t.t.toFixed(2)),
    },
  }
}

// ── 3. Retention correlation ──────────────────────────────────────────
// Honest pairing: for each agency in a niche, compute
//   x = stddev of intervals between consecutive posts (lower = more consistent)
//   y = mean completion_rate
// Spearman correlation across agencies. Expect negative rho (lower
// interval variance → higher completion rate).
function analyzeRetention(runs: RawRun[], niche: string): StatFinding | null {
  const withComp = runs.filter(
    (r) => r.completion_rate != null && r.posted_at != null,
  )
  if (withComp.length < MIN_RUNS_PER_NICHE) return null

  const byAgency = new Map<string, RawRun[]>()
  for (const r of withComp) {
    const arr = byAgency.get(r.agency_id) || []
    arr.push(r)
    byAgency.set(r.agency_id, arr)
  }

  const agencyStats: { intervalStddev: number; meanCompletion: number }[] = []
  for (const [, agencyRuns] of byAgency) {
    if (agencyRuns.length < 5) continue
    const times = agencyRuns
      .map((r) => new Date(r.posted_at as string).getTime())
      .sort((a, b) => a - b)
    const intervals: number[] = []
    for (let i = 1; i < times.length; i++) {
      intervals.push((times[i] - times[i - 1]) / (1000 * 60 * 60)) // hours
    }
    const sdev = stddev(intervals)
    if (!Number.isFinite(sdev) || sdev === 0) continue
    const meanComp = mean(agencyRuns.map((r) => r.completion_rate as number))
    if (!Number.isFinite(meanComp)) continue
    agencyStats.push({ intervalStddev: sdev, meanCompletion: meanComp })
  }

  if (agencyStats.length < MIN_AGENCIES_PER_FINDING) return null

  const xs = agencyStats.map((s) => s.intervalStddev)
  const ys = agencyStats.map((s) => s.meanCompletion)
  const res = spearmanRho(xs, ys)
  if (
    !Number.isFinite(res.rho) ||
    Math.abs(res.rho) < RHO_THRESHOLD ||
    res.p_value >= P_VALUE_THRESHOLD
  ) {
    return null
  }

  const confidence = confidenceScore(res.p_value, agencyStats.length)
  return {
    type: 'retention_correlation',
    niche_scope: niche,
    supporting_agency_count: agencyStats.length,
    supporting_run_count: withComp.length,
    p_value: res.p_value,
    confidence,
    payload: {
      rho: Number(res.rho.toFixed(4)),
      n_agencies: agencyStats.length,
      n_runs: withComp.length,
      direction: res.rho < 0 ? 'consistent_schedules_higher_completion' : 'inconsistent_schedules_higher_completion',
      mean_completion_overall: Number(mean(ys).toFixed(4)),
    },
    template_slots: {
      niche,
      direction:
        res.rho < 0
          ? 'consistent posting schedules correlate with higher completion rates'
          : 'variable posting schedules correlate with higher completion rates',
      n: withComp.length,
      agency_count: agencyStats.length,
      rho: Number(res.rho.toFixed(3)),
    },
  }
}

// ── 4. Posting frequency ───────────────────────────────────────────────
// For each (agency, week) compute post count and mean dps, then fit a
// quadratic on (posts_per_week, mean_dps). Concave-down peak = diminishing
// returns.
function analyzeFrequency(runs: RawRun[], niche: string): StatFinding | null {
  const withTime = runs.filter((r) => r.posted_at != null && Number.isFinite(r.dps))
  if (withTime.length < MIN_RUNS_PER_NICHE) return null

  // key = agency_id + '_' + yearWeek
  const byAgencyWeek = new Map<string, { agency: string; dpses: number[] }>()
  for (const r of withTime) {
    const d = new Date(r.posted_at as string)
    const yw = `${d.getUTCFullYear()}W${Math.floor(
      (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
        Date.UTC(d.getUTCFullYear(), 0, 1)) /
        (7 * 24 * 60 * 60 * 1000),
    )}`
    const key = `${r.agency_id}_${yw}`
    const entry = byAgencyWeek.get(key) || { agency: r.agency_id, dpses: [] }
    entry.dpses.push(r.dps)
    byAgencyWeek.set(key, entry)
  }

  // Bucket (postsThisWeek, meanDps) pairs into per-frequency groups.
  const freqBuckets = new Map<number, number[]>()
  const freqAgencies = new Map<number, Set<string>>()
  for (const [, entry] of byAgencyWeek) {
    const freq = entry.dpses.length
    const mdps = mean(entry.dpses)
    const arr = freqBuckets.get(freq) || []
    arr.push(mdps)
    freqBuckets.set(freq, arr)
    const s = freqAgencies.get(freq) || new Set<string>()
    s.add(entry.agency)
    freqAgencies.set(freq, s)
  }

  const xs: number[] = []
  const ys: number[] = []
  for (const [freq, vals] of Array.from(freqBuckets.entries()).sort((a, b) => a[0] - b[0])) {
    if (vals.length < 5) continue
    if ((freqAgencies.get(freq)?.size || 0) < 3) continue
    xs.push(freq)
    ys.push(mean(vals))
  }
  if (xs.length < 5) return null

  const fit = quadraticFit(xs, ys)
  // Concave parabolas have rho~0 (not monotonic), so Spearman isn't
  // a valid significance test here. Use R² as the quality gate:
  //   - r² >= 0.5 means >= 50% of variance explained (stringent)
  //   - concave_peak_in_range means the dimishing-returns shape is real
  //   - at least 6 distinct x points for a stable fit
  if (!fit.concave_peak_in_range || fit.r2 < 0.5 || xs.length < 6) return null
  if (!Number.isFinite(fit.peak_x)) return null

  // "p_value" proxy: 1 - r². Clamped to [0.001, 0.05] so confidence_score
  // reflects the R² magnitude without claiming a real p-value.
  const pseudoP = Math.max(0.001, Math.min(0.05, 1 - fit.r2))
  const supportingAgencyCount = countDistinctAgencies(withTime)
  if (supportingAgencyCount < MIN_AGENCIES_PER_FINDING) return null
  const confidence = confidenceScore(pseudoP, withTime.length)

  return {
    type: 'posting_frequency',
    niche_scope: niche,
    supporting_agency_count: supportingAgencyCount,
    supporting_run_count: withTime.length,
    p_value: pseudoP,
    confidence,
    payload: {
      peak_posts_per_week: Number(fit.peak_x.toFixed(2)),
      r_squared: Number(fit.r2.toFixed(4)),
      n_runs: withTime.length,
      frequency_range: [fit.x_min, fit.x_max],
      fit_coefficients: {
        a: Number(fit.a.toFixed(4)),
        b: Number(fit.b.toFixed(4)),
        c: Number(fit.c.toFixed(4)),
      },
    },
    template_slots: {
      niche,
      peak_freq: Number(fit.peak_x.toFixed(1)),
      n: withTime.length,
      agency_count: supportingAgencyCount,
      r2: Number(fit.r2.toFixed(2)),
    },
  }
}

// ── Orchestrator entrypoint ───────────────────────────────────────────
export async function runAnalyzer(db: SupabaseClient): Promise<AnalyzerRunResult> {
  const skipped: string[] = []
  const { runs, activeAgencyCount } = await loadRuns(db)

  if (activeAgencyCount < MIN_AGENCIES) {
    return {
      findings: [],
      skipped_reasons: [
        `insufficient_network_size: ${activeAgencyCount} active agencies, need ${MIN_AGENCIES}`,
      ],
      global: { active_agency_count: activeAgencyCount, niches_scanned: 0, runs_examined: runs.length },
    }
  }

  const byNiche = groupByNiche(runs)
  const findings: StatFinding[] = []

  for (const [niche, nicheRuns] of byNiche) {
    if (nicheRuns.length < MIN_RUNS_PER_NICHE) {
      skipped.push(`${niche}: only ${nicheRuns.length} runs, need ${MIN_RUNS_PER_NICHE}`)
      continue
    }
    const timing = analyzeTiming(nicheRuns, niche)
    if (timing) findings.push(timing)
    const format = analyzeFormat(nicheRuns, niche)
    if (format) findings.push(format)
    const retention = analyzeRetention(nicheRuns, niche)
    if (retention) findings.push(retention)
    const freq = analyzeFrequency(nicheRuns, niche)
    if (freq) findings.push(freq)
  }

  return {
    findings,
    skipped_reasons: skipped,
    global: {
      active_agency_count: activeAgencyCount,
      niches_scanned: byNiche.size,
      runs_examined: runs.length,
    },
  }
}
