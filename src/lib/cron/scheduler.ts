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
let lastScheduleBackfillAt: string | null = null
let lastMetricCollectorAt: string | null = null
let lastAutoLabelerAt: string | null = null
let lastSpearmanEvalAt: string | null = null
let lastNicheCreatorScrapeAt: string | null = null
let lastDiscoveryScanAt: string | null = null
let lastPatternExtractionAt: string | null = null
let lastPatternMetricsAt: string | null = null
let lastCalendarRefreshAt: string | null = null
let lastCulturalScanAt: string | null = null
let lastMemoryConsolidationAt: string | null = null
let lastTrainerEngineAt: string | null = null
let lastPostPromotionValidationAt: string | null = null
let lastPlatformMonitorAt: string | null = null

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
    baseline_last_run: lastBaselinePublicAt,
    schedule_backfill_last_run: lastScheduleBackfillAt,
    metric_collector_last_run: lastMetricCollectorAt,
    auto_labeler_last_run: lastAutoLabelerAt,
    spearman_eval_last_run: lastSpearmanEvalAt,
    niche_creator_scrape_last_run: lastNicheCreatorScrapeAt,
    discovery_scanner_last_run: lastDiscoveryScanAt,
    pattern_extraction_last_run: lastPatternExtractionAt,
    pattern_metrics_last_run: lastPatternMetricsAt,
    calendar_refresh_last_run: lastCalendarRefreshAt,
    cultural_scan_last_run: lastCulturalScanAt,
    memory_consolidation_last_run: lastMemoryConsolidationAt,
    trainer_engine_last_run: lastTrainerEngineAt,
    post_promotion_validation_last_run: lastPostPromotionValidationAt,
    platform_monitor_last_run: lastPlatformMonitorAt,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Cron registry — SINGLE SOURCE OF TRUTH for what is scheduled + enabled.
// Only `enabled: true` jobs actually register with node-cron at startup.
// Updated 2026-04-14: we are in a 7-day data-accumulation window. Only the
// Feedback Collector (Atlas S1) and the Cultural Intelligence pipeline
// (scanner + classifier, together one logical pipeline) are allowed to run.
// ═══════════════════════════════════════════════════════════════════════════
export type CronJobName =
  | 'nightly-eval'
  | 'nightly-calibration'
  | 'weekly-cohort'
  | 'daily-baseline'
  | 'daily-recipes'
  | 'hourly-discovery-recompute'
  | 'nightly-templates'
  | 'feature-drift'
  | 'discovery-scanner'
  | 'schedule-backfill'
  | 'metric-collector'
  | 'auto-labeler'
  | 'spearman-eval'
  | 'platform-monitor'
  | 'post-promotion-validator'
  | 'trainer-engine'
  | 'pattern-extraction'
  | 'pattern-metrics'
  | 'calendar-refresh'
  | 'cultural-scanner'
  | 'event-classifier'
  | 'autodream'
  | 'memory-consolidation'
  | 'network-intelligence'
  | 'self-scheduler'
  | 'feedback-collector'

export interface CronJobRegistryEntry {
  name: CronJobName
  schedule: string
  enabled: boolean
  /** Human-readable label for the status dashboard. */
  description: string
  /** Name of the row written to integration_job_runs (for last-run lookup). */
  jobRunKey?: string
}

const CRON_REGISTRY: CronJobRegistryEntry[] = [
  { name: 'nightly-eval',               schedule: '0 2 * * *',           enabled: false, description: 'Nightly accuracy metrics',              jobRunKey: 'nightly_eval' },
  { name: 'nightly-calibration',        schedule: '30 2 * * *',          enabled: false, description: 'Nightly calibration + thresholds',      jobRunKey: 'nightly_calibration' },
  { name: 'weekly-cohort',              schedule: '0 3 * * 1',           enabled: false, description: 'Weekly cohort baseline recompute',       jobRunKey: 'weekly_baselines' },
  { name: 'daily-baseline',             schedule: '0 4 * * *',           enabled: false, description: 'Daily public baseline metrics',          jobRunKey: 'baseline_public' },
  { name: 'daily-recipes',              schedule: '0 6 * * *',           enabled: false, description: 'Daily recipe book compute',              jobRunKey: 'daily_recipes' },
  { name: 'hourly-discovery-recompute', schedule: '0 * * * *',           enabled: false, description: 'Hourly discovery recompute (gated)' },
  { name: 'nightly-templates',          schedule: '0 6 * * *',           enabled: false, description: 'Nightly templates aggregate' },
  { name: 'feature-drift',              schedule: '0 */3 * * *',         enabled: false, description: 'Feature importance drift (every 3h)',    jobRunKey: 'feature_drift' },
  { name: 'discovery-scanner',          schedule: '*/15 * * * *',        enabled: false, description: 'Discovery scanner (every 15 min)',       jobRunKey: 'discovery_scanner' },
  { name: 'schedule-backfill',          schedule: '0 1 * * *',           enabled: false, description: 'Daily metric schedule backfill',         jobRunKey: 'schedule_backfill' },
  { name: 'metric-collector',           schedule: '30 0,6,12,18 * * *',  enabled: false, description: 'Apify metric collection (every 6h)',     jobRunKey: 'metric_collector' },
  { name: 'auto-labeler',               schedule: '30 3 * * *',          enabled: false, description: 'Daily auto-labeler',                     jobRunKey: 'auto_labeler' },
  { name: 'spearman-eval',              schedule: '0 5 * * 0',           enabled: false, description: 'Weekly Spearman eval',                   jobRunKey: 'spearman_eval' },
  { name: 'platform-monitor',           schedule: '45 */6 * * *',        enabled: false, description: 'Platform monitor (every 6h)',            jobRunKey: 'platform_monitor' },
  { name: 'post-promotion-validator',   schedule: '15 */6 * * *',        enabled: false, description: 'Post-promotion validator (every 6h)',    jobRunKey: 'post_promotion_validation' },
  { name: 'trainer-engine',             schedule: '30 5 * * *',          enabled: false, description: 'Autonomous trainer engine (nightly)',    jobRunKey: 'trainer_engine' },
  { name: 'pattern-extraction',         schedule: '15 2 * * *',          enabled: false, description: 'Pattern extraction (nightly)',           jobRunKey: 'pattern_extraction' },
  { name: 'pattern-metrics',            schedule: '0 6 * * 0',           enabled: false, description: 'Pattern metrics (weekly)',               jobRunKey: 'pattern_metrics' },
  { name: 'calendar-refresh',           schedule: '0 7 * * 1',           enabled: false, description: 'Content calendar refresh (weekly)',      jobRunKey: 'calendar_refresh' },

  // ── Cultural Intelligence (nightly, 2-step pipeline) ─────────────────────
  // Enabled as a pair — scanner writes detected_trends, classifier writes
  // cultural_events. Neither is useful without the other.
  { name: 'cultural-scanner',           schedule: '30 0 * * *',          enabled: true,  description: 'Cultural Intelligence — Reddit/X scan',  jobRunKey: 'cultural_scanner' },
  { name: 'event-classifier',           schedule: '0 1 * * *',           enabled: true,  description: 'Cultural Intelligence — event classify', jobRunKey: 'event_classifier' },

  { name: 'autodream',                  schedule: '0 4 * * *',           enabled: false, description: 'autoDream overnight pipeline',           jobRunKey: 'autodream' },
  { name: 'memory-consolidation',       schedule: '0 5 * * *',           enabled: false, description: 'Memory consolidation (nightly)',         jobRunKey: 'consolidate_memory' },
  { name: 'network-intelligence',       schedule: '45 4 * * *',          enabled: false, description: 'Network intelligence (daily)' },
  { name: 'self-scheduler',             schedule: '0 * * * *',           enabled: false, description: 'Self-scheduler tick (hourly)' },

  // ── Feedback Collector (Atlas S1) ────────────────────────────────────────
  // Previously unregistered. Calls POST /api/atlas/feedback-collector every 6h.
  { name: 'feedback-collector',         schedule: '0 */6 * * *',         enabled: true,  description: 'Feedback Collector (Atlas S1) — every 6h', jobRunKey: 'feedback_collector' },
]

export function getCronRegistry(): CronJobRegistryEntry[] {
  return CRON_REGISTRY.map((j) => ({ ...j }))
}

function scheduleJob(
  name: CronJobName,
  handler: () => unknown | Promise<unknown>,
): void {
  const job = CRON_REGISTRY.find((j) => j.name === name)
  if (!job) {
    console.error(`[Cron] Unknown job name: ${name} — not scheduled`)
    return
  }
  if (!job.enabled) return
  try {
    cron.schedule(
      job.schedule,
      () => {
        try { Promise.resolve(handler()).catch(() => {}) } catch {}
      },
      { timezone: 'UTC' },
    )
  } catch (err: any) {
    console.error(`[Cron] Failed to register ${name}: ${err?.message || err}`)
  }
}

export function startScheduler(): void {
  if (started) return
  started = true

  const enabledCount = CRON_REGISTRY.filter((j) => j.enabled).length
  console.log(
    `Cron scheduler: ${CRON_REGISTRY.length} jobs registered, ${enabledCount} enabled ` +
    `(${CRON_REGISTRY.filter((j) => j.enabled).map((j) => j.name).join(', ') || 'none'})`,
  )

  // Nightly at 02:00 UTC
  scheduleJob('nightly-eval', () => computeAndInsertMetrics())
  // Nightly calibration + thresholds at 02:30 UTC
  scheduleJob('nightly-calibration', () => runCalibrationJob())
  // Weekly Monday at 03:00 UTC
  scheduleJob('weekly-cohort', () => recomputeCohorts())
  // Daily baseline public metrics at 04:00 UTC
  scheduleJob('daily-baseline', () => computeAndStorePublicBaseline())
  // Daily recipes at 06:00 UTC
  scheduleJob('daily-recipes', () => computeDailyRecipeBook())
  // Hourly discovery recompute with backpressure guard
  scheduleJob('hourly-discovery-recompute', async () => {
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
  })
  // Nightly templates aggregate at 06:00 UTC
  scheduleJob('nightly-templates', async () => { try { const { aggregateTemplates } = await import('@/lib/templates/aggregate'); await aggregateTemplates(30) } catch {} })
  // Every 3 hours: feature-importance drift
  scheduleJob('feature-drift', async () => {
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
  })

  // ── Training Pipeline Automation (re-enabled 2026-03-05) ─────────────────
  // Previously disabled 2026-03-04 due to Apify budget burn.
  // Now re-enabled with proper controls:
  // - Discovery Scanner uses DB-level next_poll_at locking (no in-memory flags)
  // - Budget enforcement via max_apify_calls_per_day per niche
  // - Dashboard visibility via Command Center (/admin/operations/training/base)
  // - Niche Creator Scraper REMOVED — replaced by Discovery Scanner

  // Every 15 min — Discovery Scanner (Track 1)
  // DB-level locking prevents double-scan; budget check inside runDiscoveryScan()
  scheduleJob('discovery-scanner', async () => {
    try {
      const { runDiscoveryScan } = await import('@/lib/training/fresh-video-scanner')
      const result = await runDiscoveryScan()
      if (result.niches_scanned > 0) {
        console.log(`[Cron:DiscoveryScanner] Scanned ${result.niches_scanned} niches, ${result.total_new} new videos`)
      }
      lastDiscoveryScanAt = new Date().toISOString()
    } catch (err: any) { console.error('[Cron:DiscoveryScanner] Error:', err.message) }
  })

  // Daily at 01:00 UTC — backfill metric schedules for runs missing them
  scheduleJob('schedule-backfill', async () => {
    try {
      const { backfillMetricSchedules } = await import('@/lib/training/schedule-backfill')
      const result = await backfillMetricSchedules({ limit: 100 })
      console.log(`[Cron:ScheduleBackfill] Created ${result.scheduled} schedules`)
      lastScheduleBackfillAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'schedule_backfill', last_run: lastScheduleBackfillAt } as any)
    } catch (err: any) { console.error('[Cron:ScheduleBackfill] Error:', err.message) }
  })

  // Every 6h — collect due metrics from TikTok via Apify (FREE actor)
  // metric-collector.ts already rejects UUID-based platform_video_ids
  scheduleJob('metric-collector', async () => {
    try {
      const { runMetricCollector } = await import('@/lib/training/metric-collector')
      const result = await runMetricCollector({ limit: 50 })
      console.log(`[Cron:MetricCollector] Processed ${result.processed}, succeeded ${result.succeeded}, failed ${result.failed}`)
      lastMetricCollectorAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'metric_collector', last_run: lastMetricCollectorAt } as any)
    } catch (err: any) { console.error('[Cron:MetricCollector] Error:', err.message) }
  })

  // Daily at 03:30 UTC — auto-label runs with completed metrics
  scheduleJob('auto-labeler', async () => {
    try {
      const { runAutoLabeler } = await import('@/lib/training/auto-labeler')
      const result = await runAutoLabeler({ limit: 50 })
      console.log(`[Cron:AutoLabeler] Labeled ${result.labeled} runs`)
      lastAutoLabelerAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'auto_labeler', last_run: lastAutoLabelerAt } as any)
    } catch (err: any) { console.error('[Cron:AutoLabeler] Error:', err.message) }
  })

  // Weekly Sunday at 05:00 UTC — Spearman rank correlation evaluation
  scheduleJob('spearman-eval', async () => {
    try {
      const { runSpearmanEvaluation } = await import('@/lib/training/spearman-evaluator')
      const result = await runSpearmanEvaluation()
      console.log(`[Cron:SpearmanEval] rho=${result.spearman_rho}, n=${result.n}`)
      lastSpearmanEvalAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'spearman_eval', last_run: lastSpearmanEvalAt } as any)
    } catch (err: any) { console.error('[Cron:SpearmanEval] Error:', err.message) }
  })

  // Every 6h at :45 — Proactive Platform Monitor (Prompt 34)
  // Offset from post-promotion validator (:15) so the two jobs don't
  // run concurrently and share a common cache miss window.
  scheduleJob('platform-monitor', async () => {
    try {
      const { runPlatformMonitor } = await import('@/lib/monitoring/platform-monitor')
      const result = await runPlatformMonitor()
      console.log(
        `[Cron:PlatformMonitor] candidates=${result.candidate_alerts} ` +
        `written=${result.written} deduped=${result.suppressed_duplicate} ` +
        `bumped=${result.bumped_existing} dropped_sev=${result.suppressed_low_severity} ` +
        `dropped_conf=${result.suppressed_low_confidence} errors=${result.write_errors}`,
      )
      lastPlatformMonitorAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'platform_monitor', last_run: lastPlatformMonitorAt } as any)
    } catch (err: any) { console.error('[Cron:PlatformMonitor] Error:', err.message) }
  })

  // Every 6h at :15 — Post-Promotion Validator (Prompt 33)
  // Checks promotions 48h+ old. Computes post-promotion Spearman vs
  // pre-promotion baseline. Writes chairman_alerts on degradation
  // (warning: delta <= -0.05, critical: delta <= -0.10) or starvation
  // (insufficient_data after 96h).
  scheduleJob('post-promotion-validator', async () => {
    try {
      const { runPostPromotionValidation } = await import('@/lib/training/post-promotion-validator')
      const result = await runPostPromotionValidation()
      console.log(
        `[Cron:PostPromotionValidator] checked=${result.checked} validated=${result.validated} ` +
        `retry=${result.insufficient_retry} final=${result.insufficient_final} ` +
        `alerts=${result.degradation_alerts} errors=${result.errors}`,
      )
      lastPostPromotionValidationAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'post_promotion_validation', last_run: lastPostPromotionValidationAt } as any)
    } catch (err: any) { console.error('[Cron:PostPromotionValidator] Error:', err.message) }
  })

  // Nightly at 05:30 UTC — Autonomous Trainer Engine (checks program conditions)
  scheduleJob('trainer-engine', async () => {
    try {
      const { runTrainerEngine } = await import('@/lib/training/trainer-engine')
      const result = await runTrainerEngine()
      console.log(
        `[Cron:TrainerEngine] ${result.experiments.length} experiments, ` +
        `data: ${result.data_stats.clean_rows} rows` +
        (result.skipped_reason ? ` — skipped: ${result.skipped_reason}` : '')
      )
      lastTrainerEngineAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'trainer_engine', last_run: lastTrainerEngineAt } as any)
    } catch (err: any) { console.error('[Cron:TrainerEngine] Error:', err.message) }
  })

  // REMOVED: Niche Creator Scraper — replaced by Discovery Scanner (2026-03-05)
  // See fresh-video-scanner.ts. Old scraper burned 60+ PAID Apify calls per run
  // across 20 niches with no usable training data.

  // ── Pattern Library ────────────────────────────────────────────────────────

  // Nightly at 02:15 UTC — extract patterns from newly viral scraped videos
  scheduleJob('pattern-extraction', async () => {
    try {
      const result = await runPatternExtractionJob()
      console.log(`[Cron:PatternExtraction] ${result.extracted}/${result.candidates} classified`)
      lastPatternExtractionAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'pattern_extraction', last_run: lastPatternExtractionAt } as any)
    } catch (err: any) { console.error('[Cron:PatternExtraction] Error:', err.message) }
  })

  // Weekly Sunday at 06:00 UTC — recompute pattern niche metrics
  scheduleJob('pattern-metrics', async () => {
    try {
      const { computeArchetypeMetrics } = await import('@/lib/patterns/pattern-metrics')
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const result = await computeArchetypeMetrics(db)
      console.log(`[Cron:PatternMetrics] ${result.patternsUpdated} pattern-niche rows, ${result.nichesProcessed} niches`)
      lastPatternMetricsAt = new Date().toISOString()
      await db.from('integration_job_runs').upsert({ job: 'pattern_metrics', last_run: lastPatternMetricsAt } as any)
    } catch (err: any) { console.error('[Cron:PatternMetrics] Error:', err.message) }
  })

  // ── Content Calendar ──────────────────────────────────────────────────────

  // Weekly Monday at 07:00 UTC — regenerate content calendars for active creators
  scheduleJob('calendar-refresh', async () => {
    try {
      const { refreshActiveCalendars } = await import('@/lib/content/calendar-refresh')
      const result = await refreshActiveCalendars()
      console.log(`[Cron:CalendarRefresh] ${result.refreshed} refreshed, ${result.skipped} skipped, ${result.errors} errors`)
      lastCalendarRefreshAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'calendar_refresh', last_run: lastCalendarRefreshAt } as any)
    } catch (err: any) { console.error('[Cron:CalendarRefresh] Error:', err.message) }
  })

  // Nightly at 00:30 UTC — cultural intelligence Reddit scan
  scheduleJob('cultural-scanner', async () => {
    try {
      const result = await runCulturalScanViaApi()
      console.log(`[Cron:CulturalScanner] ${result.niches_scanned} niches, ${result.total_posts} posts, ${result.rows_upserted} rows`)
      lastCulturalScanAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'cultural_scanner', last_run: lastCulturalScanAt } as any)
    } catch (err: any) { console.error('[Cron:CulturalScanner] Error:', err.message) }
  })

  // Nightly at 01:00 UTC — classify detected trends → cultural events (runs after cultural scan)
  scheduleJob('event-classifier', async () => {
    try {
      const result = await runEventClassifierViaApi()
      const niches = Number(result?.niches_processed ?? result?.niches_scanned ?? 0)
      const inserted = Number(result?.classified ?? 0)
      console.log(`[Cron:EventClassifier] Cultural Intelligence: processed ${niches} niches, inserted ${inserted} new events ` +
        `(auto-approved ${result?.auto_approved ?? 0})`)
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'event_classifier', last_run: new Date().toISOString() } as any)
    } catch (err: any) { console.error('[Cron:EventClassifier] Error:', err.message) }
  })

  // Nightly at 04:00 UTC — autoDream overnight pipeline (runs after cultural intel completes)
  scheduleJob('autodream', async () => {
    try {
      const result = await runAutoDreamViaApi()
      console.log(`[Cron:autoDream] ${result.total_briefs_generated} briefs, ${result.total_morning_cards} morning cards`)
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'autodream', last_run: new Date().toISOString() } as any)
    } catch (err: any) { console.error('[Cron:autoDream] Error:', err.message) }
  })

  // Nightly at 05:00 UTC — memory consolidation (runs after autoDream completes)
  scheduleJob('memory-consolidation', async () => {
    try {
      const result = await runMemoryConsolidationViaApi()
      console.log(`[Cron:MemoryConsolidation] ${result.agencies_processed} agencies, ${result.total_facts_added} facts added, ${result.total_contradictions} contradictions resolved`)
      lastMemoryConsolidationAt = new Date().toISOString()
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'consolidate_memory', last_run: lastMemoryConsolidationAt } as any)
    } catch (err: any) { console.error('[Cron:MemoryConsolidation] Error:', err.message) }
  })

  // Prompt 44 — Network Intelligence: daily at 04:45 UTC, generate
  // aggregate statistical insights across the network. Skips gracefully
  // when <30 active agencies.
  scheduleJob('network-intelligence', async () => {
    try {
      const { generateNetworkInsights } = await import('@/lib/network-intelligence/generate')
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const result = await generateNetworkInsights(db)
      console.log(`[Cron:NetworkIntelligence] run=${result.run_id.slice(0,8)} written=${result.written_count} skipped=${result.skipped} agencies=${result.global.active_agency_count}`)
    } catch (err: any) { console.error('[Cron:NetworkIntelligence] Error:', err.message) }
  })

  // Prompt 40 — Self-Scheduler: every hour at :00, process any due scheduled_actions.
  scheduleJob('self-scheduler', async () => {
    try {
      const { processPendingActions } = await import('@/lib/scheduler/processor')
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      const result = await processPendingActions(db)
      if (result.picked_up > 0) {
        console.log(`[Cron:SelfScheduler] picked_up=${result.picked_up} executed=${result.executed} failed=${result.failed}`)
      }
    } catch (err: any) { console.error('[Cron:SelfScheduler] Error:', err.message) }
  })

  // Feedback Collector (Atlas S1) — every 6h. Calls the existing HTTP endpoint
  // at /api/atlas/feedback-collector with CRON_SECRET auth. The endpoint reads
  // prediction_log + prediction_runs.actual_dps and writes actual_performance
  // back to prediction_log.
  scheduleJob('feedback-collector', async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const url = `${baseUrl}/api/atlas/feedback-collector`
      const secret = process.env.CRON_SECRET
      const res = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
        headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        console.error(`[Cron:FeedbackCollector] HTTP ${res.status}: ${json?.error || 'unknown'}`)
      } else {
        console.log(`[Cron:FeedbackCollector] collected=${json?.collected ?? 0} skipped=${json?.skipped ?? 0} total=${json?.total ?? 0}`)
      }
      try {
        const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        await db.from('integration_job_runs').upsert({ job: 'feedback_collector', last_run: new Date().toISOString() } as any)
      } catch {}
    } catch (err: any) { console.error('[Cron:FeedbackCollector] Error:', err.message) }
  })
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

// ── Training Pipeline Manual Triggers ────────────────────────────────────

export async function runScheduleBackfillNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { backfillMetricSchedules } = await import('@/lib/training/schedule-backfill')
    const result = await backfillMetricSchedules({ limit: 100 })
    lastScheduleBackfillAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'schedule_backfill', last_run: lastScheduleBackfillAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

export async function runMetricCollectorNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { runMetricCollector } = await import('@/lib/training/metric-collector')
    const result = await runMetricCollector({ limit: 50 })
    lastMetricCollectorAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'metric_collector', last_run: lastMetricCollectorAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

export async function runAutoLabelerNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { runAutoLabeler } = await import('@/lib/training/auto-labeler')
    const result = await runAutoLabeler({ limit: 50 })
    lastAutoLabelerAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'auto_labeler', last_run: lastAutoLabelerAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

export async function runSpearmanEvalNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { runSpearmanEvaluation } = await import('@/lib/training/spearman-evaluator')
    const result = await runSpearmanEvaluation()
    lastSpearmanEvalAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'spearman_eval', last_run: lastSpearmanEvalAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

export async function runDiscoveryScanNow(nicheKey?: string): Promise<{ ok: boolean; result?: any }> {
  try {
    const { runDiscoveryScan } = await import('@/lib/training/fresh-video-scanner')
    const result = await runDiscoveryScan({ nicheKey: nicheKey || undefined })
    lastDiscoveryScanAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'discovery_scanner', last_run: lastDiscoveryScanAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

/** @deprecated Use runDiscoveryScanNow() instead. Old scraper replaced by Discovery Scanner. */
export async function runNicheCreatorScrapeNow(niches?: string[]): Promise<{ ok: boolean; result?: any }> {
  try {
    const { scrapeNicheCreators } = await import('@/lib/training/niche-creator-scraper')
    const result = await scrapeNicheCreators(niches?.length ? { niches } : undefined)
    lastNicheCreatorScrapeAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'niche_creator_scrape', last_run: lastNicheCreatorScrapeAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

// ── Pattern Library Manual Triggers ──────────────────────────────────────

async function runPatternExtractionJob(): Promise<{ candidates: number; extracted: number }> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Find scraped videos that crossed 100K views in last 24h and don't have an archetype instance yet
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { data: candidates, error } = await db
    .from('scraped_videos')
    .select('id, title, description, hashtags, niche, views_count, likes_count, comments_count, shares_count, saves_count, duration_seconds, creator_name, creator_unique_id, creator_followers_count')
    .gt('views_count', 100000)
    .gte('imported_at', since)
    .limit(100)

  if (error || !candidates?.length) {
    return { candidates: 0, extracted: 0 }
  }

  // Filter out videos that already have archetype instances
  const videoIds = candidates.map((v: any) => v.id)
  const { data: existing } = await db
    .from('archetype_instances')
    .select('video_id')
    .in('video_id', videoIds)

  const existingIds = new Set((existing || []).map((e: any) => e.video_id))
  const newVideos = candidates.filter((v: any) => !existingIds.has(v.id))

  if (newVideos.length === 0) {
    return { candidates: candidates.length, extracted: 0 }
  }

  const { extractPatternsBatch } = await import('@/lib/patterns/pattern-extractor')
  const results = await extractPatternsBatch(newVideos, db)

  return { candidates: newVideos.length, extracted: results.length }
}

export async function runPatternExtractionNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const result = await runPatternExtractionJob()
    lastPatternExtractionAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'pattern_extraction', last_run: lastPatternExtractionAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

// ── Content Calendar Manual Trigger ──────────────────────────────────────

export async function runCalendarRefreshNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { refreshActiveCalendars } = await import('@/lib/content/calendar-refresh')
    const result = await refreshActiveCalendars()
    lastCalendarRefreshAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'calendar_refresh', last_run: lastCalendarRefreshAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

export async function runPatternMetricsNow(): Promise<{ ok: boolean; result?: any }> {
  try {
    const { computeArchetypeMetrics } = await import('@/lib/patterns/pattern-metrics')
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const result = await computeArchetypeMetrics(db)
    lastPatternMetricsAt = new Date().toISOString()
    await db.from('integration_job_runs').upsert({ job: 'pattern_metrics', last_run: lastPatternMetricsAt } as any)
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
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

// ── Cultural Intelligence Scanner ──────────────────────────────────────

async function runCulturalScanViaApi(niche?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = niche
    ? `${baseUrl}/api/cron/cultural-scan?niche=${encodeURIComponent(niche)}`
    : `${baseUrl}/api/cron/cultural-scan`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cultural scan API returned ${res.status}: ${text}`)
  }
  return await res.json()
}

export async function runCulturalScanNow(niche?: string): Promise<{ ok: boolean; result?: any }> {
  try {
    const result = await runCulturalScanViaApi(niche)
    lastCulturalScanAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'cultural_scanner', last_run: lastCulturalScanAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

// ── Event Classifier ────────────────────────────────────────────────────

async function runEventClassifierViaApi(niche?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = niche
    ? `${baseUrl}/api/cron/classify-events?niche=${encodeURIComponent(niche)}`
    : `${baseUrl}/api/cron/classify-events`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Event classifier API returned ${res.status}: ${text}`)
  }
  return await res.json()
}

export async function runEventClassifierNow(niche?: string): Promise<{ ok: boolean; result?: any }> {
  try {
    const result = await runEventClassifierViaApi(niche)
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'event_classifier', last_run: new Date().toISOString() } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

// ── autoDream Overnight Pipeline ────────────────────────────────────────

async function runAutoDreamViaApi(agencyId?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = agencyId
    ? `${baseUrl}/api/cron/autodream?agency_id=${encodeURIComponent(agencyId)}`
    : `${baseUrl}/api/cron/autodream`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`autoDream API returned ${res.status}: ${text}`)
  }
  return await res.json()
}

export async function runAutoDreamNow(agencyId?: string): Promise<{ ok: boolean; result?: any }> {
  try {
    const result = await runAutoDreamViaApi(agencyId)
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'autodream', last_run: new Date().toISOString() } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

// ── Memory Consolidation (Memory Keeper) ────────────────────────────────

async function runMemoryConsolidationViaApi(agencyId?: string): Promise<any> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const url = agencyId
    ? `${baseUrl}/api/cron/consolidate-memory?agency_id=${encodeURIComponent(agencyId)}`
    : `${baseUrl}/api/cron/consolidate-memory`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Memory consolidation API returned ${res.status}: ${text}`)
  }
  return await res.json()
}

export async function runMemoryConsolidationNow(agencyId?: string): Promise<{ ok: boolean; result?: any }> {
  try {
    const result = await runMemoryConsolidationViaApi(agencyId)
    lastMemoryConsolidationAt = new Date().toISOString()
    try {
      const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
      await db.from('integration_job_runs').upsert({ job: 'consolidate_memory', last_run: lastMemoryConsolidationAt } as any)
    } catch {}
    return { ok: true, result }
  } catch (err: any) {
    return { ok: false, result: { error: err.message } }
  }
}

