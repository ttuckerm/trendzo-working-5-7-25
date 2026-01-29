import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { ensureP1AccuracyTables } from '@/lib/db/ensure'
import { recordPrediction } from '@/lib/prediction/record'
import { addPrediction, addOutcome, upsertLabel } from '@/lib/dev/accuracyStore'
import { thresholdFor } from '@/lib/calibration/thresholds'
import { POST as INGEST } from '@/app/api/outcomes/ingest/route'

// TODO: Add proper auth/role protection. This is an unauthenticated debug endpoint intended for local/demo only.

type Platform = 'tiktok' | 'instagram' | 'youtube'

// NOTE: Use shared thresholdFor(platform) from calibration helpers for consistency

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededChoice<T>(arr: T[], rand: () => number): T { return arr[Math.floor(rand() * arr.length)] }

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)) }

function clamp01(x: number): number { return clamp(x, 0, 1) }

// Sample standard normal via Box–Muller with provided RNG
function stdNormal(rand: () => number): number {
  let u = 0, v = 0
  // Avoid 0
  while (u === 0) u = rand()
  while (v === 0) v = rand()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

// Exponential(1)
function randExp(rand: () => number): number { let u = rand(); while (u === 0) u = rand(); return -Math.log(u) }

// Gamma(k, 1) for integer k using sum of exponentials
function randGammaInt(k: number, rand: () => number): number { let s = 0; for (let i=0;i<k;i++) s += randExp(rand); return s }

// Beta(a, b) with small integer parameters via Gamma sampling
function sampleBeta(a: number, b: number, rand: () => number): number {
  const x = randGammaInt(Math.max(1, Math.floor(a)), rand)
  const y = randGammaInt(Math.max(1, Math.floor(b)), rand)
  const sum = x + y
  if (sum <= 0) return 0.5
  return x / sum
}

// Mixture: 40% Beta(2,5), 40% Beta(5,2), 20% Uniform(0.05, 0.95)
function samplePredictedProb(rand: () => number): number {
  const u = rand()
  if (u < 0.4) return clamp01(sampleBeta(2, 5, rand))
  if (u < 0.8) return clamp01(sampleBeta(5, 2, rand))
  const u2 = rand()
  return 0.05 + 0.90 * u2
}

function synthOutcomeMetrics(platform: Platform, rand: () => number, prob: number) {
  // Metrics correlated with prob; values in [0,1] except views and *_per_1k
  const eps = (sd: number) => stdNormal(rand) * sd
  const watch_time_pct = clamp01(0.25 + 0.6 * prob + eps(0.03))
  const retention_3s = clamp01(0.30 + 0.6 * prob + eps(0.03))
  const retention_8s = clamp01(0.20 + 0.7 * prob + eps(0.03))
  const ctr = clamp01(0.02 + 0.08 * prob + eps(0.01))
  const shares_per_1k = Math.max(0, Math.round(2 + 25 * prob + eps(1.2)))
  const saves_per_1k = Math.max(0, Math.round(2 + 20 * prob + eps(1.0)))
  const completion_rate = clamp01(0.15 + 0.7 * prob + eps(0.03))
  // Log-normal views scaled by prob; heavier tails for higher prob
  const base = 500 + 20000 * Math.pow(Math.max(0, Math.min(1, prob)), 1.2)
  const sigma = 0.9
  const z = stdNormal(rand)
  const factor = Math.exp(sigma * z)
  const views = Math.max(50, Math.round(base * factor))
  const window_hours = 48
  const hoursAgo = Math.floor(rand() * 5)
  const captured_at = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString()
  return { views, watch_time_pct, retention_3s, retention_8s, ctr, shares_per_1k, saves_per_1k, completion_rate, captured_at, window_hours }
}

export async function POST(_req: NextRequest) {
  try {
    await ensureP1AccuracyTables()
    const db = (SUPABASE_URL && SUPABASE_SERVICE_KEY) ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null as any

    // Fixed known cohort for dev calibration
    const COHORT = 'demo-tt-001::v1'
    const PLATFORM: Platform = 'tiktok'
    const [baseTemplateId, baseVariant] = COHORT.split('::')
    const cohortVariants = [baseVariant]
    const niches = ['fitness', 'beauty', 'technology', 'food', 'business']

    const cohorts: string[] = [COHORT]
    const total = 2000
    const perCohort = Math.floor(total / cohorts.length)
    const modelVersion = 'demo-seed'

    let predictions = 0
    let outcomes = 0
    let labels = 0

    // Deterministic RNG for repeatable demo
    const rand = mulberry32(42)
    type Sample = { templateId: string; variantId: string | null; prob: number; om: ReturnType<typeof synthOutcomeMetrics> }
    const samples: Sample[] = []
    for (const key of cohorts) {
      const [templateId, variantId] = key.split('::')
      for (let i = 0; i < perCohort; i++) {
        const prob = samplePredictedProb(rand)
        // Record prediction via shared path (ensures correct schema)
        try {
          await recordPrediction({
            templateId,
            variantId,
            cohortSnapshot: { platform: PLATFORM, niche: seededChoice(niches, rand), seed: true },
            predictedProb: prob,
            modelVersion,
            force: true
          })
        } catch {}
        // Mirror to dev store
        addPrediction({ template_id: templateId, variant_id: variantId, predicted_prob: prob, model_version: modelVersion, created_at: new Date().toISOString() })
        predictions++
        const om = synthOutcomeMetrics(PLATFORM, rand, prob)
        samples.push({ templateId, variantId, prob, om })
      }
    }

    // Write outcomes to dev store
    for (const s of samples) {
      addOutcome({ template_id: s.templateId, variant_id: s.variantId, platform: PLATFORM, views: s.om.views, captured_at: s.om.captured_at })
      outcomes++
    }

    // Compute 95th percentile of views within cohort and label accordingly
    const viewsSorted = samples.map(s => s.om.views).sort((a, b) => a - b)
    const nViews = viewsSorted.length
    const idx95 = Math.max(0, Math.min(nViews - 1, Math.floor(0.95 * (nViews - 1))))
    const p95Views = viewsSorted[idx95]
    const tPercent = thresholdFor(PLATFORM) // expected 95 for tiktok

    // Precompute percentile mapping by view value (use last index for duplicates)
    const lastIndexByValue = new Map<number, number>()
    for (let i = 0; i < nViews; i++) lastIndexByValue.set(viewsSorted[i], i)

    for (const s of samples) {
      const lastIdx = lastIndexByValue.get(s.om.views) ?? 0
      const percentile = Math.round(((lastIdx + 1) / Math.max(1, nViews)) * 100)
      // Label is top thresholdFor(platform) percentile by cohort views; for TikTok this is 95th percentile
      const label = s.om.views >= p95Views
      const labelRow = { template_id: s.templateId, variant_id: s.variantId, platform: PLATFORM, label, percentile, computed_at: new Date().toISOString() }
      upsertLabel(labelRow as any)
      labels++
    }

    // Verify label rows present for debug (best-effort; not critical for DEV mode)
    let labelCount = 0
    try {
      const { count } = db ? await db.from('viral_label').select('template_id', { count: 'exact', head: true }) : { count: 0 }
      labelCount = Number((count as any) || 0)
    } catch {}

    return NextResponse.json({ predictions, outcomes, labels, labelCount, cohorts })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}



