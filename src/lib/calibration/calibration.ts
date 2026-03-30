import { createClient } from '@supabase/supabase-js'
import { startOfISOWeek, format } from 'date-fns'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export interface CalibrationModelRecord {
  platform: string
  niche: string
  version: string
  method: 'isotonic' | 'platt'
  isotonic_knots?: Array<{ x: number; y: number }>
  platt_a?: number
  platt_b?: number
  ece_before?: number
  ece_after?: number
  trained_at?: string
}

export async function ensureCalibrationTables(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists calibration_models (
      id bigserial primary key,
      platform text not null,
      niche text not null,
      version text not null,
      method text not null check (method in ('isotonic','platt')),
      isotonic_knots jsonb,
      platt_a double precision,
      platt_b double precision,
      ece_before double precision,
      ece_after double precision,
      trained_at timestamptz not null default now(),
      unique(platform, niche, version)
    );
  ` }) } catch {}
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists decision_thresholds (
      id bigserial primary key,
      niche text not null unique,
      version text not null,
      target_p_at_100 double precision not null,
      threshold double precision not null,
      computed_at timestamptz not null default now()
    );
  ` }) } catch {}
  try { await (db as any).rpc?.('exec_sql', { query: `
    create table if not exists active_label_queue (
      id bigserial primary key,
      created_at timestamptz not null default now(),
      prediction_id text,
      platform text,
      niche text,
      probability double precision,
      confidence double precision,
      disagreement double precision,
      status text not null default 'pending' check (status in ('pending','labeled','skipped')),
      outcome boolean,
      metadata jsonb
    );
    create index if not exists idx_active_label_queue_status on active_label_queue(status, created_at desc);
  ` }) } catch {}
}

function expectedCalibrationError(yTrue: number[], yProb: number[], bins = 10): number {
  const bucket = Array.from({ length: bins }, () => ({ n: 0, p: 0, y: 0 }))
  yProb.forEach((p, i) => { const b = Math.min(bins - 1, Math.floor(p * bins)); const slot = bucket[b] as any; slot.n++; slot.p += p; slot.y += yTrue[i] })
  let ece = 0, total = 0
  bucket.forEach(b => { if (b.n > 0) { const avgP = b.p / b.n, avgY = b.y / b.n; ece += b.n * Math.abs(avgP - avgY); total += b.n } })
  return total ? ece / total : 0
}

function trainIsotonic(prob: number[], y: number[]): Array<{ x: number; y: number }> {
  const pairs = prob.map((p, i) => ({ p, y: y[i] }))
  pairs.sort((a, b) => a.p - b.p)
  const n = pairs.length
  const bins = Math.max(5, Math.min(20, Math.floor(Math.sqrt(n))))
  const per = Math.ceil(n / bins)
  const knots: Array<{ x: number; y: number }> = []
  for (let i = 0; i < n; i += per) {
    const slice = pairs.slice(i, Math.min(n, i + per))
    const x = slice.reduce((s, r) => s + r.p, 0) / slice.length
    const yhat = slice.reduce((s, r) => s + r.y, 0) / slice.length
    knots.push({ x, y: Math.max(0, Math.min(1, yhat)) })
  }
  // enforce monotonicity (pool adjacent violators)
  for (let i = 1; i < knots.length; i++) {
    if (knots[i].y < knots[i - 1].y) knots[i].y = knots[i - 1].y
  }
  return knots
}

function plattFit(prob: number[], y: number[]): { a: number; b: number } {
  // Logistic regression with one feature via simple gradient steps
  let a = 1, b = 0
  const lr = 0.1
  for (let iter = 0; iter < 200; iter++) {
    let ga = 0, gb = 0
    for (let i = 0; i < prob.length; i++) {
      const z = a * prob[i] + b
      const p = 1 / (1 + Math.exp(-z))
      const e = p - y[i]
      ga += e * prob[i]
      gb += e
    }
    a -= lr * (ga / prob.length)
    b -= lr * (gb / prob.length)
  }
  return { a, b }
}

function applyIsotonic(prob: number, knots: Array<{ x: number; y: number }>): number {
  if (knots.length === 0) return prob
  if (prob <= knots[0].x) return knots[0].y
  if (prob >= knots[knots.length - 1].x) return knots[knots.length - 1].y
  for (let i = 1; i < knots.length; i++) {
    if (prob <= knots[i].x) {
      const x0 = knots[i - 1].x, y0 = knots[i - 1].y
      const x1 = knots[i].x, y1 = knots[i].y
      const t = (prob - x0) / Math.max(1e-6, (x1 - x0))
      return y0 + t * (y1 - y0)
    }
  }
  return prob
}

export async function trainCalibrationModelsForLast30d(targetPrecisionAt100: number = 0.60): Promise<{ version: string; trained: number; thresholdsUpdated: number; eceBefore?: number; eceAfter?: number }> {
  await ensureCalibrationTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const version = format(startOfISOWeek(new Date()), "yyyy'W'II")
  // Pull labeled validations for last 30d (excluding heated)
  const { data: rows } = await db
    .from('prediction_validation')
    .select('platform,predicted_viral_probability,label_viral,niche,created_at,heated_flag')
    .eq('validation_status', 'validated')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString())
  const records: any[] = (rows || []).filter((r: any) => !r.heated_flag && typeof r.predicted_viral_probability === 'number' && r.niche)
  if (!records.length) return { version, trained: 0, thresholdsUpdated: 0 }
  // Group by platform+niche
  const groups = new Map<string, any[]>()
  for (const r of records) {
    const k = `${r.platform || 'tiktok'}|${r.niche}`
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(r)
  }
  let trained = 0
  let thresholdsUpdated = 0
  let eceBeforeAgg = 0, eceAfterAgg = 0, eceCount = 0
  for (const [key, arr] of groups.entries()) {
    const [platform, niche] = key.split('|')
    const prob = arr.map((r: any) => Number(r.predicted_viral_probability))
    const y = arr.map((r: any) => (r.label_viral ? 1 : 0))
    const eceBefore = expectedCalibrationError(y, prob, 10)
    // Prefer isotonic; fallback to Platt if too few points
    let method: 'isotonic' | 'platt' = 'isotonic'
    let knots: Array<{ x: number; y: number }> | undefined
    let a: number | undefined, b: number | undefined
    if (arr.length < 40) {
      method = 'platt'
      const fit = plattFit(prob, y)
      a = fit.a; b = fit.b
    } else {
      knots = trainIsotonic(prob, y)
    }
    const calibrated = prob.map(p => {
      if (method === 'isotonic') return applyIsotonic(p, knots!)
      const z = (a! * p) + (b!)
      return 1 / (1 + Math.exp(-z))
    })
    const eceAfter = expectedCalibrationError(y, calibrated, 10)
    try {
      await db.from('calibration_models').upsert({
        platform,
        niche,
        version,
        method,
        isotonic_knots: method === 'isotonic' ? knots : null,
        platt_a: method === 'platt' ? a : null,
        platt_b: method === 'platt' ? b : null,
        ece_before: eceBefore,
        ece_after: eceAfter
      } as any)
      trained++
      eceBeforeAgg += eceBefore
      eceAfterAgg += eceAfter
      eceCount++
    } catch {}

    // Compute threshold to meet target precision@100 for this niche
    const idx = calibrated.map((s, i) => [s, i] as [number, number]).sort((a, b) => b[0] - a[0]).slice(0, 100).map(x => x[1])
    const hits = idx.reduce((acc, i) => acc + (y[i] === 1 ? 1 : 0), 0)
    const precisionAt100 = hits / Math.max(1, Math.min(100, calibrated.length))
    let threshold = 0.5
    if (precisionAt100 < targetPrecisionAt100) {
      // tighten threshold by taking 75th percentile of calibrated top-100 as threshold
      const topScores = calibrated.slice().sort((a, b) => b - a).slice(0, 100)
      const j = Math.max(0, Math.min(topScores.length - 1, Math.floor(0.75 * topScores.length)))
      threshold = topScores[j]
    } else {
      // looser threshold at 50th percentile of top-100
      const topScores = calibrated.slice().sort((a, b) => b - a).slice(0, 100)
      const j = Math.max(0, Math.min(topScores.length - 1, Math.floor(0.50 * topScores.length)))
      threshold = topScores[j]
    }
    try {
      await db.from('decision_thresholds').upsert({ niche, version, target_p_at_100: targetPrecisionAt100, threshold } as any)
      thresholdsUpdated++
    } catch {}
  }
  const eceBefore = eceCount ? eceBeforeAgg / eceCount : undefined
  const eceAfter = eceCount ? eceAfterAgg / eceCount : undefined
  return { version, trained, thresholdsUpdated, eceBefore, eceAfter }
}

export async function getCalibrationVersion(): Promise<string | null> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('calibration_models').select('version,trained_at').order('trained_at', { ascending: false }).limit(1)
  return (data && data.length) ? String((data as any)[0].version) : null
}

export async function applyCalibration(probability: number, platform: string, niche: string, format?: string): Promise<{ calibrated: number; method: 'isotonic' | 'platt' | 'identity'; version: string | null }> {
  await ensureCalibrationTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  let { data } = await db.from('calibration_models').select('method,version,isotonic_knots,platt_a,platt_b').eq('platform', platform).eq('niche', niche).eq('format', format || 'short_video').order('trained_at', { ascending: false }).limit(1)
  if (!data || !data.length) {
    // fallback to format-agnostic
    const res = await db.from('calibration_models').select('method,version,isotonic_knots,platt_a,platt_b').eq('platform', platform).eq('niche', niche).order('trained_at', { ascending: false }).limit(1)
    data = res.data as any
  }
  if (data && data.length) {
    const row = data[0] as any
    if (row.method === 'isotonic' && row.isotonic_knots) {
      const cal = applyIsotonic(probability, row.isotonic_knots as Array<{ x: number; y: number }>)
      return { calibrated: Math.max(0, Math.min(1, cal)), method: 'isotonic', version: row.version }
    }
    if (row.method === 'platt' && typeof row.platt_a === 'number' && typeof row.platt_b === 'number') {
      const z = row.platt_a * probability + row.platt_b
      const cal = 1 / (1 + Math.exp(-z))
      return { calibrated: Math.max(0, Math.min(1, cal)), method: 'platt', version: row.version }
    }
  }
  return { calibrated: probability, method: 'identity', version: null }
}

export async function getDecisionThreshold(niche: string, defaultTarget: number = 0.60): Promise<{ threshold: number; target: number; version: string | null }> {
  await ensureCalibrationTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('decision_thresholds').select('threshold,version,target_p_at_100').eq('niche', niche).order('computed_at', { ascending: false }).limit(1)
  if (data && data.length) {
    const row = data[0] as any
    return { threshold: Number(row.threshold), target: Number(row.target_p_at_100), version: row.version }
  }
  return { threshold: 0.5, target: defaultTarget, version: null }
}


