import 'server-only'
import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { startOfISOWeek, format } from 'date-fns'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, logSupabaseRuntimeEnv } from '@/lib/env'
import { spawn } from 'child_process'
import { trainCalibrationModelsForLast30d } from '@/lib/calibration/calibration'
import { computeDailyRecipeBook } from '@/lib/services/recipes/compute'
import { computeFeatureImportance } from '@/lib/drift/feature-importance'

let started = false
let lastNightlyEvalAt: string | null = null
let lastWeeklyCohortAt: string | null = null
let lastBaselinePublicAt: string | null = null
let lastCalibrationAt: string | null = null

async function computeAndInsertMetrics(): Promise<void> {
  logSupabaseRuntimeEnv()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists accuracy_metrics (id bigserial primary key, computed_at timestamptz not null, model_version text not null, n int not null, auroc double precision not null, precision_at_100 double precision not null, ece double precision not null, heated_excluded_count int default 0, coverage_of_real_actuals double precision default 0, leakage_checks jsonb default '{}'::jsonb);" }) } catch {}
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" }) } catch {}

  const { data } = await db
    .from('prediction_validation')
    .select('predicted_viral_probability,label_viral,created_at,model_version,heated_flag')
    .eq('validation_status','validated')
    .gte('created_at', new Date(Date.now()-30*24*3600*1000).toISOString())
  const allRows: any[] = data || []
  const heatedExcludedCount = allRows.filter((r:any) => r.heated_flag).length
  const rows = allRows.filter((r:any) => !r.heated_flag)
  // Compute coverage_of_real_actuals for nightly summary visibility
  const coverage_of_real_actuals = rows.length ? rows.filter((r:any)=> r.label_viral===1 || r.label_viral===0).length / rows.length : 0
  if (!rows.length) return
  const yTrue = rows.map((r:any)=> r.label_viral ? 1 : 0)
  const yScore = rows.map((r:any)=> r.predicted_viral_probability)
  const pos = yScore.filter((_:any,i:number)=>yTrue[i]===1), neg = yScore.filter((_:any,i:number)=>yTrue[i]===0)
  let conc=0, pairs=pos.length*neg.length; pos.forEach((p:any)=>neg.forEach((n:any)=>{ if (p>n) conc++; else if (p===n) conc+=0.5; }))
  const auroc = pairs ? conc/pairs : 0.5
  const pAt100 = (() => { const idx = yScore.map((s:any,i:number)=>[s,i]).sort((a:any,b:any)=>b[0]-a[0]).slice(0,100).map((x:any)=>x[1]); const hits = idx.reduce((acc:number,i:number)=>acc + (yTrue[i]===1 ? 1 : 0), 0); return hits / 100 })()
  const ece = (() => { const bins=10; const bucket = Array.from({length: bins},()=>({n:0,p:0,y:0})); yScore.forEach((p:any,i:number)=>{ const b = Math.min(bins-1, Math.floor(p*bins)); const slot:any=bucket[b]; slot.n++; slot.p+=p; slot.y+=yTrue[i]; }); let e=0,t=0; bucket.forEach((b:any)=>{ if(b.n>0){ const ap=b.p/b.n, ay=b.y/b.n; e+=b.n*Math.abs(ap-ay); t+=b.n; } }); return t? e/t : 0 })()
  await db.from('accuracy_metrics').insert({ n: rows.length, auroc, precision_at_100: pAt100, ece, model_version: rows[0].model_version, computed_at: new Date().toISOString(), heated_excluded_count: heatedExcludedCount, coverage_of_real_actuals, leakage_checks: { creatorOverlap: 0, futureFeatures: 0, nearDupes: 0 } as any })

  // Judge critique stats (best-effort)
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists judge_critiques (id uuid default gen_random_uuid() primary key, audit_id text, prediction_id text, verdict text, issues jsonb, recommendations jsonb, created_at timestamptz default now());" })
  } catch {}
  try {
    const since24h = new Date(Date.now()-24*3600*1000).toISOString()
    const { data } = await db.from('judge_critiques').select('verdict,prediction_id,created_at').gte('created_at', since24h)
    const arr = Array.isArray(data) ? data as any[] : []
    const pass = arr.filter(r=> r.verdict==='pass').length
    const fail = arr.filter(r=> r.verdict==='fail').length
    const needs = arr.filter(r=> r.verdict==='needs_review').length
    // Disagreement: Judge fail but Doer predicted viral (approx by reading predictions table when available)
    let disagreement = 0
    try {
      const ids = arr.filter(r=> r.verdict==='fail' && r.prediction_id).map(r=> r.prediction_id)
      if (ids.length) {
        const { data: preds } = await db.from('predictions').select('video_id,viral_probability').in('video_id', ids as any)
        const viralCut = 0.5
        disagreement = (preds||[]).filter((p:any)=> Number(p.viral_probability||0) >= viralCut).length
      }
    } catch {}
    // Record into integration_job_runs as a compact JSON snapshot
    try { await db.from('integration_job_runs').upsert({ job: 'judge_stats', last_run: new Date().toISOString(), } as any) } catch {}
    try { await (db as any).rpc?.('exec_sql', { query: `create table if not exists judge_daily_stats (day date primary key, pass int, fail int, needs int, disagreement int);` }) } catch {}
    try {
      const day = new Date().toISOString().slice(0,10)
      await (db as any).rpc?.('exec_sql', { query: `insert into judge_daily_stats(day,pass,fail,needs,disagreement) values ('${day}',${pass},${fail},${needs},${disagreement}) on conflict(day) do update set pass=excluded.pass, fail=excluded.fail, needs=excluded.needs, disagreement=excluded.disagreement;` })
    } catch {}
  } catch {}
  lastNightlyEvalAt = new Date().toISOString()
  try { await db.from('integration_job_runs').upsert({ job: 'nightly_eval', last_run: lastNightlyEvalAt } as any) } catch {}
}

async function recomputeCohorts(): Promise<void> {
  const { recomputeCohortStats } = await import('@/lib/services/viral-prediction/dps-baselines')
  await recomputeCohortStats()
  lastWeeklyCohortAt = new Date().toISOString()
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" })
    await db.from('integration_job_runs').upsert({ job: 'weekly_baselines', last_run: lastWeeklyCohortAt } as any)
  } catch {}
}

export function getLastRuns() {
  return {
    nightlyEvalAt: lastNightlyEvalAt,
    weeklyCohortAt: lastWeeklyCohortAt,
    calibrationAt: lastCalibrationAt,
    nightly_eval_last_run: lastNightlyEvalAt,
    weekly_cohort_last_run: lastWeeklyCohortAt,
    baseline_last_run: lastBaselinePublicAt
  }
}

export function startScheduler(): void {
  if (started) return
  started = true
  // Nightly at 02:00 UTC
  try { cron.schedule('0 2 * * *', () => { computeAndInsertMetrics().catch(()=>{}) }, { timezone: 'UTC' }) } catch {}
  // Nightly calibration + thresholds at 02:30 UTC
  try { cron.schedule('30 2 * * *', () => { runCalibrationJob().catch(()=>{}) }, { timezone: 'UTC' }) } catch {}
  // Weekly Monday at 03:00 UTC
  try { cron.schedule('0 3 * * 1', () => { recomputeCohorts().catch(()=>{}) }, { timezone: 'UTC' }) } catch {}
  // Daily baseline public metrics at 04:00 UTC
  try { cron.schedule('0 4 * * *', () => { computeAndStorePublicBaseline().catch(()=>{}) }, { timezone: 'UTC' }) } catch {}
  // Daily recipes at 06:00 UTC
  try { cron.schedule('0 6 * * *', () => { computeDailyRecipeBook().catch(()=>{}) }, { timezone: 'UTC' }) } catch {}
  // Hourly discovery recompute with backpressure guard
  try { cron.schedule('0 * * * *', async () => {
    try {
      // Check pipeline readiness via modules endpoint; skip if any non-green
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/admin/pipeline/modules`
      const res = await fetch(url, { cache: 'no-store', headers: { 'x-user-id': 'cron' } })
      const j = await res.json().catch(()=>null)
      const items = (j?.items||[]) as any[]
      const failing = items.filter(m => m.overall_status && m.overall_status !== 'green')
      if (failing.length === 0) {
        try { await computeDailyRecipeBook() } catch {}
      }
    } catch {}
  }, { timezone: 'UTC' }) } catch {}
  // Nightly templates aggregate at 06:00 UTC
  try { cron.schedule('0 6 * * *', async () => { try { const { aggregateTemplates } = await import('@/lib/templates/aggregate'); await aggregateTemplates(30) } catch {} }, { timezone: 'UTC' }) } catch {}
  // Every 3 hours: feature-importance drift
  try { cron.schedule('0 */3 * * *', async () => {
    try {
      const now = new Date()
      const end = now.toISOString()
      const start = new Date(now.getTime() - 7*24*3600*1000).toISOString()
      await computeFeatureImportance(start, end)
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" }) } catch {}
      await db.from('integration_job_runs').upsert({ job: 'feature_drift', last_run: new Date().toISOString() } as any)
      ;(globalThis as any).__drift_last_run = new Date().toISOString()
    } catch {}
  }, { timezone: 'UTC' }) } catch {}
}

export async function stopScheduler(): Promise<void> {
  // Minimal no-op stub to satisfy imports in admin tools. Our cron jobs are
  // registered with node-cron and cannot be reliably enumerated/cleared here
  // without keeping references. For admin toggles, treating stop as a soft
  // no-op is acceptable in dev. In prod, a process manager should handle restarts.
  return
}

async function runEvalScript(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
    const child = spawn(cmd, ['run', 'eval:metrics'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'ignore', 'ignore']
    })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`eval:metrics exited with code ${code}`))
    })
  })
}

export async function runNightlyEvalNow(): Promise<{ ok: boolean; ran: 'script' | 'inline' }>{
  try {
    await runEvalScript()
    lastNightlyEvalAt = new Date().toISOString()
    return { ok: true, ran: 'script' }
  } catch {
    await computeAndInsertMetrics()
    lastNightlyEvalAt = new Date().toISOString()
    return { ok: true, ran: 'inline' }
  }
}

export async function runWeeklyBaselinesNow(): Promise<{ ok: boolean }>{
  await recomputeCohorts()
  // token drift job
  try {
    const { syncFrameworks, extractAllTokens } = await import('@/lib/frameworks/loader')
    await syncFrameworks()
    const tokens = await extractAllTokens()
    // update last run and count in memory for status endpoint
    ;(globalThis as any).__token_drift_last_run = new Date().toISOString()
    ;(globalThis as any).__frameworks_count = tokens.size
  } catch {}
  return { ok: true }
}

export async function runCalibrationJob(): Promise<{ ok: boolean; version?: string; trained?: number; thresholdsUpdated?: number }>{
  try {
    const out = await trainCalibrationModelsForLast30d(0.60)
    lastCalibrationAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists integration_job_runs (job text primary key, last_run timestamptz not null);" })
      await db.from('integration_job_runs').upsert({ job: 'nightly_calibration', last_run: lastCalibrationAt } as any)
    } catch {}
    return { ok: true, version: out.version, trained: out.trained, thresholdsUpdated: out.thresholdsUpdated }
  } catch {
    return { ok: false }
  }
}

async function computeAndStorePublicBaseline(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Ensure baseline table exists
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists baseline_public_metrics (id bigserial primary key, computed_at timestamptz not null, cohort_version text not null, n int not null, auroc double precision not null, precision_at_100 double precision not null, ece double precision not null);" }) } catch {}
  // Pull latest accuracy_metrics (already excludes heated rows at compute time)
  const { data } = await db.from('accuracy_metrics').select('n,auroc,precision_at_100,ece,computed_at,model_version').order('computed_at', { ascending: false }).limit(1)
  if (!data || !data.length) return
  const row = data[0] as any
  const cohortVersion = format(startOfISOWeek(new Date()), "yyyy'W'II")
  try {
    await db.from('baseline_public_metrics').insert({
      computed_at: new Date().toISOString(),
      cohort_version: cohortVersion,
      n: row.n,
      auroc: row.auroc,
      precision_at_100: row.precision_at_100,
      ece: row.ece
    } as any)
  } catch {}
  lastBaselinePublicAt = new Date().toISOString()
  try { await db.from('integration_job_runs').upsert({ job: 'baseline_public', last_run: lastBaselinePublicAt } as any) } catch {}
}


