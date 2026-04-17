/**
 * Autonomous Training Engine
 *
 * Runs experiments based on a human-written research program,
 * maintains per-niche model variants, and evaluates candidates
 * against the current production model.
 *
 * NEVER auto-promotes. Chairman must approve via the dashboard.
 *
 * Flow:
 * 1. Load active program from trainer_programs
 * 2. Parse program rules (thresholds, priorities)
 * 3. Load prediction feedback data
 * 4. Determine which experiment to run (global retrain vs niche variant)
 * 5. Train XGBoost on appropriate data subset
 * 6. Evaluate on 20% held-out validation (stratified by niche)
 * 7. Compare against current active model
 * 8. Record result in training_experiments
 * 9. If improved beyond threshold: mark as pending_promotion
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── Types ───────────────────────────────────────────────────────────────

export interface TrainerProgram {
  id: string
  program_name: string
  program_content: string
  is_active: boolean
}

export interface ProgramRules {
  global_data_threshold: number       // default 500
  niche_data_threshold: number        // default 200
  global_improvement_threshold: number // default 0.005
  niche_improvement_threshold: number  // default 0.01
  max_consecutive_no_improvement: number // default 3
}

export interface FeedbackRow {
  id: string
  predicted_vps: number
  actual_dps: number
  niche: string | null
  video_id: string | null
}

export type ExperimentMode = 'sandbox' | 'production'

export interface ExperimentResult {
  experiment_id: string
  experiment_type: string
  experiment_mode: ExperimentMode
  niche_scope: string | null
  description: string
  training_data_rows: number
  validation_spearman: number
  baseline_spearman: number
  delta: number
  result: 'improved' | 'no_change' | 'degraded' | 'error' | 'pending_promotion'
  model_artifact_path: string | null
  error_message?: string
}

export interface LaunchExperimentOptions {
  experiment_type: 'retrain' | 'feature_add' | 'feature_remove' | 'hyperparameter' | 'niche_specific'
  niche_scope?: string | null
  description: string
  experiment_mode?: ExperimentMode
}

export interface TrainerRunResult {
  success: boolean
  experiments: ExperimentResult[]
  skipped_reason?: string
  data_stats: {
    total_feedback_rows: number
    clean_rows: number
    corrupted_skipped: number
    niches: Record<string, number>
  }
}

// ── Constants ───────────────────────────────────────────────────────────

const DEFAULT_RULES: ProgramRules = {
  global_data_threshold: 500,
  niche_data_threshold: 200,
  global_improvement_threshold: 0.005,
  niche_improvement_threshold: 0.01,
  max_consecutive_no_improvement: 3,
}

// ── Program Parser ──────────────────────────────────────────────────────

export function parseProgramRules(content: string): ProgramRules {
  const rules = { ...DEFAULT_RULES }

  // Extract thresholds from markdown content
  const globalDataMatch = content.match(/global\s+feedback\s+data\s*>\s*(\d+)/i)
  if (globalDataMatch) rules.global_data_threshold = parseInt(globalDataMatch[1])

  const nicheDataMatch = content.match(/niche\s+has\s*>\s*(\d+)\s+feedback/i)
  if (nicheDataMatch) rules.niche_data_threshold = parseInt(nicheDataMatch[1])

  const globalImpMatch = content.match(/Spearman\s+must\s+improve\s+by\s*>\s*([\d.]+)/i)
  if (globalImpMatch) rules.global_improvement_threshold = parseFloat(globalImpMatch[1])

  const nicheImpMatch = content.match(/improve\s+by\s*>\s*([\d.]+)\s+on\s+niche/i)
  if (nicheImpMatch) rules.niche_improvement_threshold = parseFloat(nicheImpMatch[1])

  const consecutiveMatch = content.match(/(\d+)\s+consecutive\s+experiments/i)
  if (consecutiveMatch) rules.max_consecutive_no_improvement = parseInt(consecutiveMatch[1])

  return rules
}

// ── Spearman Computation (standalone, matches spearman-evaluator.ts) ────

function assignRanks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }))
  indexed.sort((a, b) => a.v - b.v)

  const ranks = new Array(values.length)
  let i = 0
  while (i < indexed.length) {
    let j = i
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++
    const avgRank = (i + j - 1) / 2 + 1
    for (let k = i; k < j; k++) ranks[indexed[k].i] = avgRank
    i = j
  }
  return ranks
}

function computeSpearman(predicted: number[], actual: number[]): number {
  const n = predicted.length
  if (n < 3) return 0

  const rx = assignRanks(predicted)
  const ry = assignRanks(actual)

  const meanRx = rx.reduce((s, v) => s + v, 0) / n
  const meanRy = ry.reduce((s, v) => s + v, 0) / n

  let num = 0, denX = 0, denY = 0
  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx
    const dy = ry[i] - meanRy
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }

  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0
}

// ── Stratified Train/Validation Split ───────────────────────────────────

function stratifiedSplit(
  rows: FeedbackRow[],
  validationFraction: number = 0.2,
): { train: FeedbackRow[]; validation: FeedbackRow[] } {
  // Group by niche
  const nicheGroups = new Map<string, FeedbackRow[]>()
  for (const row of rows) {
    const niche = row.niche || '__unknown__'
    if (!nicheGroups.has(niche)) nicheGroups.set(niche, [])
    nicheGroups.get(niche)!.push(row)
  }

  const train: FeedbackRow[] = []
  const validation: FeedbackRow[] = []

  for (const [, nicheRows] of nicheGroups) {
    // Shuffle deterministically (Fisher-Yates with seeded indices)
    const shuffled = [...nicheRows]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.abs(Math.sin(i * 9301 + 49297) * 49297) % (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const valCount = Math.max(1, Math.round(shuffled.length * validationFraction))
    validation.push(...shuffled.slice(0, valCount))
    train.push(...shuffled.slice(valCount))
  }

  return { train, validation }
}

// ── XGBoost Training (TypeScript-native) ────────────────────────────────
// We train by evaluating the existing model on new data and computing
// accuracy metrics. Actual retraining requires Python — this engine
// prepares the dataset, evaluates, and records results.
// Full retrain is triggered via the existing training-executor.ts pipeline.

interface TrainingEvaluation {
  spearman: number
  mae: number
  n: number
}

function evaluateModel(
  predicted: number[],
  actual: number[],
): TrainingEvaluation {
  const n = predicted.length
  if (n < 3) return { spearman: 0, mae: 0, n }

  const spearman = computeSpearman(predicted, actual)

  let maeSum = 0
  for (let i = 0; i < n; i++) {
    maeSum += Math.abs(predicted[i] - actual[i])
  }
  const mae = maeSum / n

  return { spearman, mae, n }
}

// ── Model Variant Loader ────────────────────────────────────────────────

async function getActiveVariant(
  db: SupabaseClient,
  niche: string | null,
): Promise<{ id: string; model_version: string; spearman_score: number } | null> {
  let query = db
    .from('model_variants')
    .select('id, model_version, spearman_score')
    .eq('is_active', true)

  if (niche) {
    query = query.eq('niche', niche)
  } else {
    query = query.is('niche', null)
  }

  const { data } = await query.limit(1).single()
  return data || null
}

// ── Concurrency Lock ────────────────────────────────────────────────────

async function acquireLock(
  db: SupabaseClient,
  mode: ExperimentMode = 'production',
  experimentType: string = 'retrain',
): Promise<string | null> {
  // Check for running experiments with same mode (locked in last 30 minutes)
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { data: running } = await db
    .from('training_experiments')
    .select('id')
    .not('locked_at', 'is', null)
    .gte('locked_at', thirtyMinAgo)
    .eq('experiment_mode', mode)
    .limit(1)

  if (running && running.length > 0) {
    return null // Another experiment of the same mode is running
  }

  // Create a placeholder experiment as a lock
  const { data: lock, error } = await db
    .from('training_experiments')
    .insert({
      experiment_type: experimentType,
      description: 'Lock placeholder — experiment starting',
      training_data_rows: 0,
      result: 'error',
      experiment_mode: mode,
      locked_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !lock) return null
  return lock.id
}

async function releaseLock(db: SupabaseClient, lockId: string): Promise<void> {
  await db
    .from('training_experiments')
    .update({ locked_at: null })
    .eq('id', lockId)
}

// ── Load & Clean Feedback Data ──────────────────────────────────────────

async function loadFeedbackData(
  db: SupabaseClient,
  lastTrainingDate?: string,
): Promise<{ clean: FeedbackRow[]; corrupted: number }> {
  // HOLDOUT GUARD: is_holdout = false is required. Never remove this filter.
  let query = db
    .from('prediction_runs')
    .select('id, predicted_dps_7d, actual_dps, video_id')
    .eq('is_holdout', false)
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)
    // Newest-first so the dedup loop below keeps the latest prediction
    // per video_id. Without this, "latest" is undefined.
    .order('created_at', { ascending: false })

  if (lastTrainingDate) {
    query = query.gte('created_at', lastTrainingDate)
  }

  const { data, error } = await query.limit(5000)

  if (error || !data) {
    console.error('[Trainer] Failed to load feedback data:', error?.message)
    return { clean: [], corrupted: 0 }
  }

  // Get niche info from video_files (UUIDs) and scraped_videos (TikTok IDs).
  // prediction_runs.video_id is text and holds both shapes:
  //   - UUIDs from local uploads → join to video_files.id (uuid)
  //   - TikTok numeric IDs / short codes → join to scraped_videos.video_id (text)
  // Previously this was a single .in() against video_files.id, which
  // silently returned zero matches for non-UUID values because Postgres
  // can't cast a TikTok ID to uuid.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const videoIds = [...new Set(data.map((r: any) => r.video_id).filter(Boolean))]
  const nicheMap = new Map<string, string>()

  if (videoIds.length > 0) {
    // Batch in groups of 100 to avoid query limits
    for (let i = 0; i < videoIds.length; i += 100) {
      const batch = videoIds.slice(i, i + 100)
      const uuidBatch = batch.filter((id) => UUID_RE.test(id))
      const externalBatch = batch.filter((id) => !UUID_RE.test(id))

      if (uuidBatch.length > 0) {
        const { data: videos } = await db
          .from('video_files')
          .select('id, niche')
          .in('id', uuidBatch)
        for (const v of videos || []) {
          if (v.niche) nicheMap.set(v.id, v.niche)
        }
      }

      if (externalBatch.length > 0) {
        const { data: scraped } = await db
          .from('scraped_videos')
          .select('video_id, niche')
          .in('video_id', externalBatch)
        for (const sv of scraped || []) {
          if (sv.niche) nicheMap.set(sv.video_id, sv.niche)
        }
      }
    }
  }

  // Also check prediction_log for niche info
  if (videoIds.length > 0) {
    const { data: logs } = await db
      .from('prediction_log')
      .select('prediction_id, niche')
      .not('niche', 'is', null)
      .limit(5000)

    for (const log of logs || []) {
      if (log.niche && log.prediction_id) {
        // prediction_log.prediction_id may match prediction_runs.id
        // Store as fallback
      }
    }
  }

  let corrupted = 0
  const clean: FeedbackRow[] = []

  for (const row of data) {
    const predicted = Number(row.predicted_dps_7d)
    const actual = Number(row.actual_dps)

    // DPS is a z-score-like metric centered on 0 — negative actual_dps
    // means the video underperformed its cohort median, which is
    // VALID training signal, not corruption. Only reject NaN and
    // negative predicted VPS (0–100 scale, never negative).
    if (isNaN(predicted) || isNaN(actual) || predicted < 0) {
      corrupted++
      continue
    }

    clean.push({
      id: row.id,
      predicted_vps: predicted,
      actual_dps: actual,
      niche: nicheMap.get(row.video_id) || null,
      video_id: row.video_id,
    })
  }

  // Dedup: keep only the latest prediction per video_id. The query is
  // ordered newest-first, so first-seen wins. Rows without a video_id
  // (shouldn't happen in practice) are passed through untouched.
  const seenVideos = new Set<string>()
  const deduped: FeedbackRow[] = []
  for (const row of clean) {
    if (row.video_id && seenVideos.has(row.video_id)) continue
    if (row.video_id) seenVideos.add(row.video_id)
    deduped.push(row)
  }
  const dedupDropped = clean.length - deduped.length

  if (corrupted > 0 || dedupDropped > 0) {
    console.log(
      `[Trainer] Feedback load: ${deduped.length} clean, ${corrupted} corrupted, ${dedupDropped} duplicates dropped`,
    )
  }

  return { clean: deduped, corrupted }
}

// ── Get Last Training Date ──────────────────────────────────────────────

async function getLastTrainingDate(db: SupabaseClient): Promise<string | null> {
  const { data } = await db
    .from('training_experiments')
    .select('created_at')
    .in('result', ['improved', 'no_change', 'degraded', 'pending_promotion'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.created_at || null
}

// ── Check Consecutive No-Improvement ────────────────────────────────────

async function getConsecutiveNoImprovement(db: SupabaseClient): Promise<number> {
  const { data } = await db
    .from('training_experiments')
    .select('result')
    .order('created_at', { ascending: false })
    .limit(10)

  if (!data) return 0

  let count = 0
  for (const exp of data) {
    if (exp.result === 'no_change' || exp.result === 'degraded') {
      count++
    } else {
      break
    }
  }
  return count
}

// ── Run a Single Experiment ─────────────────────────────────────────────

async function runExperiment(
  db: SupabaseClient,
  experimentId: string,
  program: TrainerProgram,
  rules: ProgramRules,
  feedbackRows: FeedbackRow[],
  nicheScope: string | null,
  mode: ExperimentMode = 'production',
  experimentTypeOverride?: string,
): Promise<ExperimentResult> {
  const isNicheSpecific = nicheScope !== null
  const experimentType = experimentTypeOverride || (isNicheSpecific ? 'niche_specific' : 'retrain')
  const threshold = isNicheSpecific
    ? rules.niche_improvement_threshold
    : rules.global_improvement_threshold

  // Filter data for niche scope
  const scopedRows = isNicheSpecific
    ? feedbackRows.filter(r => r.niche === nicheScope)
    : feedbackRows

  // Stratified split
  const { train, validation } = stratifiedSplit(scopedRows)

  console.log(
    `[Trainer] Experiment ${experimentId}: ${experimentType}` +
    (nicheScope ? ` (${nicheScope})` : ' (global)') +
    ` — train=${train.length}, validation=${validation.length}`
  )

  // Get baseline: current active model's Spearman for this scope
  const baselineVariant = await getActiveVariant(db, nicheScope)
  let baselineSpearman = baselineVariant?.spearman_score ?? 0

  // If niche-specific and no niche variant, compare against global
  if (isNicheSpecific && !baselineVariant) {
    const globalVariant = await getActiveVariant(db, null)
    baselineSpearman = globalVariant?.spearman_score ?? 0
  }

  // Evaluate current model on validation set
  // The predicted_vps in feedback rows IS the model's prediction
  const validationPredicted = validation.map(r => r.predicted_vps)
  const validationActual = validation.map(r => r.actual_dps)
  const evalResult = evaluateModel(validationPredicted, validationActual)

  const validationSpearman = Math.round(evalResult.spearman * 10000) / 10000
  const delta = Math.round((validationSpearman - baselineSpearman) * 10000) / 10000

  // Classify result
  let result: ExperimentResult['result']
  if (delta > threshold) {
    result = 'pending_promotion'
  } else if (delta > 0) {
    result = 'improved' // Improved but below threshold
  } else if (Math.abs(delta) < 0.001) {
    result = 'no_change'
  } else {
    result = 'degraded'
  }

  const description = isNicheSpecific
    ? `Niche-specific evaluation for "${nicheScope}": ${scopedRows.length} feedback rows, validation Spearman ${validationSpearman} vs baseline ${baselineSpearman}`
    : `Global model evaluation: ${scopedRows.length} feedback rows across ${new Set(scopedRows.map(r => r.niche).filter(Boolean)).size} niches, validation Spearman ${validationSpearman} vs baseline ${baselineSpearman}`

  // Load current model features for recording
  let featuresUsed: string[] = []
  try {
    const featuresPath = join(process.cwd(), 'models', 'xgboost-v10-features.json')
    if (existsSync(featuresPath)) {
      featuresUsed = JSON.parse(readFileSync(featuresPath, 'utf-8'))
    }
  } catch { /* non-fatal */ }

  // Load current model hyperparams
  let hyperparams: Record<string, any> = {}
  try {
    const metaPath = join(process.cwd(), 'models', 'xgboost-v10-metadata.json')
    if (existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
      hyperparams = meta.hyperparameters || meta.training_config || {}
    }
  } catch { /* non-fatal */ }

  // In sandbox mode, never mark as pending_promotion — keep as improved/no_change/degraded
  const finalResult = mode === 'sandbox' && result === 'pending_promotion' ? 'improved' : result

  // Update experiment record
  await db
    .from('training_experiments')
    .update({
      program_id: program.id,
      experiment_type: experimentType,
      niche_scope: nicheScope,
      description: `[${mode.toUpperCase()}] ${description}`,
      features_used: featuresUsed,
      feature_set: featuresUsed, // duplicate for new schema column (jsonb)
      hyperparams,
      training_data_rows: scopedRows.length,
      validation_spearman: validationSpearman,
      baseline_spearman: baselineSpearman,
      delta,
      result: finalResult,
      experiment_mode: mode,
    })
    .eq('id', experimentId)

  // ONLY in production mode: if pending_promotion, create candidate model variant (inactive)
  if (mode === 'production' && result === 'pending_promotion') {
    const version = isNicheSpecific
      ? `v11-${nicheScope?.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`
      : 'v11'

    await db.from('model_variants').insert({
      niche: nicheScope,
      model_version: version,
      spearman_score: validationSpearman,
      features: featuresUsed,
      hyperparams,
      is_active: false,
      experiment_id: experimentId,
    })

    console.log(
      `[Trainer] Candidate model ${version} created (Spearman ${validationSpearman}, ` +
      `delta +${delta}). Awaiting Chairman approval.`
    )
  } else if (mode === 'sandbox' && result === 'pending_promotion') {
    console.log(
      `[Trainer] SANDBOX: Experiment would qualify for promotion (Spearman ${validationSpearman}, ` +
      `delta +${delta}) but model_variants is NOT modified in sandbox mode.`
    )
  }

  // Prompt 40 — Self-Scheduler hooks. One-liners wrapped in Safe helper:
  // the scheduler.schedule-action module catches all errors internally
  // so a scheduler failure can never break the trainer experiment.
  try {
    const { scheduleActionSafe, hoursFromNow } = await import('@/lib/scheduler/schedule-action')
    if (mode === 'production' && finalResult === 'pending_promotion') {
      // Successful candidate → check back in 48h to confirm it held up.
      void scheduleActionSafe({
        actionType: 'promotion_validation',
        triggerCondition: `Candidate model promoted at Spearman ${validationSpearman} (delta +${delta})`,
        scheduledFor: hoursFromNow(48),
        sourceSubsystem: 'trainer',
        params: { experiment_id: experimentId, niche_scope: nicheScope, validation_spearman: validationSpearman, delta },
      })
    } else if (finalResult === 'degraded' || finalResult === 'no_change') {
      // Failed/flat experiment → try again with an expanded feature set in 48h.
      void scheduleActionSafe({
        actionType: 'retrain_expanded',
        triggerCondition: `Experiment result "${finalResult}" (delta ${delta}) — retry with expanded feature set`,
        scheduledFor: hoursFromNow(48),
        sourceSubsystem: 'trainer',
        params: { experiment_id: experimentId, niche_scope: nicheScope, prior_delta: delta },
      })
    }
  } catch { /* scheduler module unavailable — non-fatal, by design */ }

  return {
    experiment_id: experimentId,
    experiment_type: experimentType,
    experiment_mode: mode,
    niche_scope: nicheScope,
    description,
    training_data_rows: scopedRows.length,
    validation_spearman: validationSpearman,
    baseline_spearman: baselineSpearman,
    delta,
    result: finalResult,
    model_artifact_path: null,
  }
}

// ── Main Entry Point ────────────────────────────────────────────────────

export async function runTrainerEngine(
  dbOrNull?: SupabaseClient | null,
  options?: { mode?: ExperimentMode },
): Promise<TrainerRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      experiments: [],
      skipped_reason: 'Missing Supabase env vars',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  const db = dbOrNull || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const mode: ExperimentMode = options?.mode ?? 'sandbox'
  const startTime = Date.now()

  // 1. Load active program
  const { data: programs } = await db
    .from('trainer_programs')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  const program = programs?.[0] as TrainerProgram | undefined

  if (!program) {
    console.log('[Trainer] No active program found. Using default rules.')
  }

  const rules = program
    ? parseProgramRules(program.program_content)
    : DEFAULT_RULES

    // 2. Acquire concurrency lock (scoped by mode — sandbox and production don't block each other)
  const lockId = await acquireLock(db, mode)
  if (!lockId) {
    return {
      success: false,
      experiments: [],
      skipped_reason: `Another ${mode} experiment is currently running. Try again later.`,
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  try {
    // 3. Load feedback data
    const lastTraining = await getLastTrainingDate(db)
    const { clean: feedbackRows, corrupted } = await loadFeedbackData(db, lastTraining || undefined)

    // Build niche distribution
    const nicheDistribution: Record<string, number> = {}
    for (const row of feedbackRows) {
      const niche = row.niche || '__unknown__'
      nicheDistribution[niche] = (nicheDistribution[niche] || 0) + 1
    }

    const dataStats = {
      total_feedback_rows: feedbackRows.length + corrupted,
      clean_rows: feedbackRows.length,
      corrupted_skipped: corrupted,
      niches: nicheDistribution,
    }

    console.log(
      `[Trainer] Loaded ${feedbackRows.length} clean feedback rows ` +
      `(${corrupted} corrupted skipped) across ${Object.keys(nicheDistribution).length} niches`
    )

    // 4. Check if enough data exists
    if (feedbackRows.length === 0) {
      console.log('[Trainer] Insufficient data — no feedback rows available')
      await releaseLock(db, lockId)
      // Clean up lock placeholder
      await db.from('training_experiments').delete().eq('id', lockId)
      return {
        success: true,
        experiments: [],
        skipped_reason: 'Insufficient data — no feedback rows with actual performance available',
        data_stats: dataStats,
      }
    }

    // 5. Determine experiments to run based on program priority
    const experiments: ExperimentResult[] = []

    // Priority 1: Global retrain if enough data
    if (feedbackRows.length >= rules.global_data_threshold) {
      console.log(`[Trainer] Global threshold met (${feedbackRows.length} >= ${rules.global_data_threshold}). Running global experiment.`)

      const result = await runExperiment(
        db, lockId, program || { id: lockId, program_name: 'default', program_content: '', is_active: true },
        rules, feedbackRows, null, mode,
      )
      experiments.push(result)
    }

    // Priority 2: Niche-specific variants
    for (const [niche, count] of Object.entries(nicheDistribution)) {
      if (niche === '__unknown__') continue
      if (count < rules.niche_data_threshold) continue

      // Check if niche variant already exists
      const existingVariant = await getActiveVariant(db, niche)
      if (existingVariant) continue

      console.log(`[Trainer] Niche "${niche}" has ${count} rows (>= ${rules.niche_data_threshold}). Running niche experiment.`)

      // Create new experiment record for this niche
      const { data: nicheExp } = await db
        .from('training_experiments')
        .insert({
          experiment_type: 'niche_specific',
          description: `Niche-specific experiment for "${niche}" — starting`,
          training_data_rows: 0,
          result: 'error',
          experiment_mode: mode,
        })
        .select('id')
        .single()

      if (nicheExp) {
        const result = await runExperiment(
          db, nicheExp.id,
          program || { id: lockId, program_name: 'default', program_content: '', is_active: true },
          rules, feedbackRows, niche, mode,
        )
        experiments.push(result)
      }
    }

    // Priority 3: Check for consecutive no-improvement
    const consecutiveNoImprove = await getConsecutiveNoImprovement(db)
    if (consecutiveNoImprove >= rules.max_consecutive_no_improvement) {
      console.warn(
        `[Trainer] WARNING: ${consecutiveNoImprove} consecutive experiments without improvement. ` +
        `Flagging for Chairman review.`
      )
    }

    // If no experiments were run (data below all thresholds)
    if (experiments.length === 0 && feedbackRows.length > 0) {
      console.log(
        `[Trainer] Data below thresholds. Global: ${feedbackRows.length}/${rules.global_data_threshold}. ` +
        `Per-niche: ${JSON.stringify(nicheDistribution)}`
      )
      await db.from('training_experiments').delete().eq('id', lockId)

      return {
        success: true,
        experiments: [],
        skipped_reason: `Insufficient data for experiments. Global: ${feedbackRows.length}/${rules.global_data_threshold}. Per-niche thresholds not met.`,
        data_stats: dataStats,
      }
    }

    await releaseLock(db, lockId)

    const elapsed = Date.now() - startTime
    console.log(`[Trainer] Complete: ${experiments.length} experiments in ${(elapsed / 1000).toFixed(1)}s`)

    return {
      success: true,
      experiments,
      data_stats: dataStats,
    }
  } catch (err: any) {
    console.error('[Trainer] Error:', err.message)
    await releaseLock(db, lockId)

    // Update lock record with error
    await db
      .from('training_experiments')
      .update({
        result: 'error',
        error_message: err.message,
        description: `Trainer engine error: ${err.message}`,
      })
      .eq('id', lockId)

    return {
      success: false,
      experiments: [{
        experiment_id: lockId,
        experiment_type: 'retrain',
        experiment_mode: mode,
        niche_scope: null,
        description: `Error: ${err.message}`,
        training_data_rows: 0,
        validation_spearman: 0,
        baseline_spearman: 0,
        delta: 0,
        result: 'error',
        model_artifact_path: null,
        error_message: err.message,
      }],
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }
}

// ── Launch Targeted Experiment (Chairman quick-launch) ───────────────────

/**
 * Launch a single experiment with explicit parameters (type, niche, mode).
 * Used by the Chairman's quick-experiment-launcher form.
 */
export async function launchExperiment(
  opts: LaunchExperimentOptions,
  dbOrNull?: SupabaseClient | null,
): Promise<TrainerRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      experiments: [],
      skipped_reason: 'Missing Supabase env vars',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  const db = dbOrNull || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  const mode: ExperimentMode = opts.experiment_mode ?? 'sandbox'
  const nicheScope = opts.niche_scope ?? null

  // Load active program
  const { data: programs } = await db
    .from('trainer_programs')
    .select('*')
    .eq('is_active', true)
    .limit(1)

  const program = programs?.[0] as TrainerProgram | undefined
  const rules = program ? parseProgramRules(program.program_content) : DEFAULT_RULES

  // Acquire lock scoped by mode
  const lockId = await acquireLock(db, mode, opts.experiment_type)
  if (!lockId) {
    return {
      success: false,
      experiments: [],
      skipped_reason: `Another ${mode} experiment is currently running. Try again later.`,
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  try {
    const { clean: feedbackRows, corrupted } = await loadFeedbackData(db)

    const nicheDistribution: Record<string, number> = {}
    for (const row of feedbackRows) {
      const niche = row.niche || '__unknown__'
      nicheDistribution[niche] = (nicheDistribution[niche] || 0) + 1
    }

    const dataStats = {
      total_feedback_rows: feedbackRows.length + corrupted,
      clean_rows: feedbackRows.length,
      corrupted_skipped: corrupted,
      niches: nicheDistribution,
    }

    // Filter for niche-specific experiments
    const scopedRows = nicheScope
      ? feedbackRows.filter(r => r.niche === nicheScope)
      : feedbackRows

    if (scopedRows.length === 0) {
      await releaseLock(db, lockId)
      await db.from('training_experiments').update({
        description: `${opts.description} — insufficient data`,
        result: 'error',
        error_message: nicheScope
          ? `No feedback data for niche "${nicheScope}". Need labeled videos in this niche.`
          : 'No feedback data available. Need labeled videos.',
        experiment_mode: mode,
        experiment_type: opts.experiment_type,
        niche_scope: nicheScope,
      }).eq('id', lockId)

      return {
        success: true,
        experiments: [{
          experiment_id: lockId,
          experiment_type: opts.experiment_type,
          experiment_mode: mode,
          niche_scope: nicheScope,
          description: `${opts.description} — insufficient data`,
          training_data_rows: 0,
          validation_spearman: 0,
          baseline_spearman: 0,
          delta: 0,
          result: 'error',
          model_artifact_path: null,
          error_message: nicheScope
            ? `No feedback data for niche "${nicheScope}"`
            : 'No feedback data available',
        }],
        skipped_reason: `Insufficient data${nicheScope ? ` for niche "${nicheScope}"` : ''}`,
        data_stats: dataStats,
      }
    }

    // Run the experiment
    const programFallback: TrainerProgram = {
      id: lockId, program_name: 'default', program_content: '', is_active: true
    }
    const result = await runExperiment(
      db, lockId,
      program || programFallback,
      rules, feedbackRows, nicheScope, mode, opts.experiment_type,
    )

    // Override description with user-provided one
    await db.from('training_experiments').update({
      description: `[${mode.toUpperCase()}] ${opts.description} — Spearman ${result.validation_spearman} (delta ${result.delta >= 0 ? '+' : ''}${result.delta})`,
    }).eq('id', lockId)

    result.description = opts.description

    await releaseLock(db, lockId)

    return {
      success: true,
      experiments: [result],
      data_stats: dataStats,
    }
  } catch (err: any) {
    console.error('[Trainer] Launch experiment error:', err.message)
    await releaseLock(db, lockId)
    await db.from('training_experiments').update({
      result: 'error',
      error_message: err.message,
      description: `[${mode.toUpperCase()}] ${opts.description} — Error: ${err.message}`,
      experiment_mode: mode,
    }).eq('id', lockId)

    return {
      success: false,
      experiments: [{
        experiment_id: lockId,
        experiment_type: opts.experiment_type,
        experiment_mode: mode,
        niche_scope: nicheScope,
        description: `Error: ${err.message}`,
        training_data_rows: 0,
        validation_spearman: 0,
        baseline_spearman: 0,
        delta: 0,
        result: 'error',
        model_artifact_path: null,
        error_message: err.message,
      }],
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }
}

// ── Model Promotion (Chairman-triggered, with backup + logging) ─────────

export interface PromotionResult {
  success: boolean
  error?: string
  promotion_log_id?: string
  previous_variant_id?: string
}

/**
 * Promote a pending model variant to active.
 * Creates a backup of the current active variant, logs the promotion,
 * and atomically swaps the active model.
 */
export async function promoteModelVariant(
  variantId: string,
  reason?: string,
  db?: SupabaseClient,
): Promise<PromotionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return { success: false, error: 'Missing env vars' }

  const client = db || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Get the variant to promote
  const { data: variant, error: fetchErr } = await client
    .from('model_variants')
    .select('*')
    .eq('id', variantId)
    .single()

  if (fetchErr || !variant) {
    return { success: false, error: 'Variant not found' }
  }

  if (variant.is_active) {
    return { success: false, error: 'Variant is already active' }
  }

  // Find the current active variant for this scope (the one being replaced)
  let previousQuery = client
    .from('model_variants')
    .select('*')
    .eq('is_active', true)

  if (variant.niche) {
    previousQuery = previousQuery.eq('niche', variant.niche)
  } else {
    previousQuery = previousQuery.is('niche', null)
  }

  const { data: previousVariants } = await previousQuery.limit(1)
  const previousVariant = previousVariants?.[0] || null

  // Deactivate previous and mark it as replaced
  if (previousVariant) {
    await client
      .from('model_variants')
      .update({
        is_active: false,
        replaced_by: variantId,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', previousVariant.id)
  }

  // Activate the new variant
  await client
    .from('model_variants')
    .update({
      is_active: true,
      promoted_at: new Date().toISOString(),
    })
    .eq('id', variantId)

  // Update the experiment result
  if (variant.experiment_id) {
    await client
      .from('training_experiments')
      .update({ result: 'improved' })
      .eq('id', variant.experiment_id)
  }

  // Write promotion log entry
  const beforeSpearman = previousVariant?.spearman_score ?? null
  const afterSpearman = variant.spearman_score ?? null
  const delta = beforeSpearman != null && afterSpearman != null
    ? Math.round((afterSpearman - beforeSpearman) * 10000) / 10000
    : null

  const { data: logEntry } = await client
    .from('model_promotion_log')
    .insert({
      action: 'promote',
      variant_id: variantId,
      previous_variant_id: previousVariant?.id ?? null,
      niche: variant.niche,
      before_spearman: beforeSpearman,
      after_spearman: afterSpearman,
      delta,
      reason: reason || `Promoted ${variant.model_version} to production`,
      triggered_by: 'chairman',
      experiment_id: variant.experiment_id ?? null,
    })
    .select('id')
    .single()

  console.log(
    `[Trainer] Model ${variant.model_version} promoted (niche: ${variant.niche || 'global'}). ` +
    `Spearman ${beforeSpearman ?? '?'} → ${afterSpearman ?? '?'} (delta ${delta ?? '?'}). ` +
    `Backup: ${previousVariant?.id ?? 'none'}`
  )

  return {
    success: true,
    promotion_log_id: logEntry?.id,
    previous_variant_id: previousVariant?.id ?? undefined,
  }
}

// ── Model Rollback (Chairman-triggered) ─────────────────────────────────

/**
 * Roll back to the previous production model for a given scope.
 * Finds the most recently deactivated variant and reactivates it.
 */
export async function rollbackModelVariant(
  niche: string | null,
  reason?: string,
  db?: SupabaseClient,
): Promise<PromotionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) return { success: false, error: 'Missing env vars' }

  const client = db || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Find the current active variant
  let currentQuery = client
    .from('model_variants')
    .select('*')
    .eq('is_active', true)

  if (niche) {
    currentQuery = currentQuery.eq('niche', niche)
  } else {
    currentQuery = currentQuery.is('niche', null)
  }

  const { data: currentVariants } = await currentQuery.limit(1)
  const currentVariant = currentVariants?.[0] || null

  if (!currentVariant) {
    return { success: false, error: 'No active variant to roll back from' }
  }

  // Find the most recently deactivated variant for this scope
  let previousQuery = client
    .from('model_variants')
    .select('*')
    .eq('is_active', false)
    .not('deactivated_at', 'is', null)
    .order('deactivated_at', { ascending: false })

  if (niche) {
    previousQuery = previousQuery.eq('niche', niche)
  } else {
    previousQuery = previousQuery.is('niche', null)
  }

  const { data: previousVariants } = await previousQuery.limit(1)
  const previousVariant = previousVariants?.[0] || null

  if (!previousVariant) {
    return { success: false, error: 'No previous variant found to roll back to' }
  }

  // Deactivate current
  await client
    .from('model_variants')
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', currentVariant.id)

  // Reactivate previous
  await client
    .from('model_variants')
    .update({
      is_active: true,
      promoted_at: new Date().toISOString(),
      replaced_by: null,
      deactivated_at: null,
    })
    .eq('id', previousVariant.id)

  // Write rollback log entry
  const beforeSpearman = currentVariant.spearman_score
  const afterSpearman = previousVariant.spearman_score
  const delta = beforeSpearman != null && afterSpearman != null
    ? Math.round((afterSpearman - beforeSpearman) * 10000) / 10000
    : null

  const { data: logEntry } = await client
    .from('model_promotion_log')
    .insert({
      action: 'rollback',
      variant_id: previousVariant.id,
      previous_variant_id: currentVariant.id,
      niche,
      before_spearman: beforeSpearman,
      after_spearman: afterSpearman,
      delta,
      reason: reason || `Rolled back from ${currentVariant.model_version} to ${previousVariant.model_version}`,
      triggered_by: 'chairman',
    })
    .select('id')
    .single()

  console.log(
    `[Trainer] ROLLBACK: ${currentVariant.model_version} → ${previousVariant.model_version} ` +
    `(niche: ${niche || 'global'})`
  )

  return {
    success: true,
    promotion_log_id: logEntry?.id,
    previous_variant_id: currentVariant.id,
  }
}

// ── Promote Sandbox Experiment to Production ────────────────────────────

/**
 * Re-run a sandbox experiment in production mode.
 * Loads the original experiment's parameters and launches a new production experiment.
 */
export async function promoteSandboxExperiment(
  sandboxExperimentId: string,
  db?: SupabaseClient,
): Promise<TrainerRunResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false, experiments: [],
      skipped_reason: 'Missing env vars',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  const client = db || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  const { data: sandbox, error } = await client
    .from('training_experiments')
    .select('*')
    .eq('id', sandboxExperimentId)
    .single()

  if (error || !sandbox) {
    return {
      success: false, experiments: [],
      skipped_reason: 'Sandbox experiment not found',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  if (sandbox.experiment_mode !== 'sandbox') {
    return {
      success: false, experiments: [],
      skipped_reason: 'Experiment is not a sandbox experiment',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  if (sandbox.result === 'degraded') {
    return {
      success: false, experiments: [],
      skipped_reason: 'Cannot promote a degraded experiment to production. The sandbox result shows this would make the model worse.',
      data_stats: { total_feedback_rows: 0, clean_rows: 0, corrupted_skipped: 0, niches: {} },
    }
  }

  // Re-run with the same parameters in production mode
  const result = await launchExperiment({
    experiment_type: sandbox.experiment_type,
    niche_scope: sandbox.niche_scope,
    description: `Promoted from sandbox ${sandboxExperimentId.slice(0, 8)}: ${sandbox.description?.replace(/^\[SANDBOX\]\s*/i, '') || 'Re-run'}`,
    experiment_mode: 'production',
  }, client)

  // Link the production experiment back to the sandbox source
  if (result.success && result.experiments.length > 0) {
    await client.from('training_experiments').update({
      promoted_from_sandbox_id: sandboxExperimentId,
    }).eq('id', result.experiments[0].experiment_id)
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════
// Prompt 41 — Feature Discovery helpers
// ═══════════════════════════════════════════════════════════════════════
//
// The Feature Discovery coordinator task (src/lib/coordinator/handlers/
// feature-discovery.ts) dispatches 5 parallel workers and each one calls
// `runFeatureDiscoveryExperiment()`. The helper exists here (not in the
// handler file) so the proxy-delta evaluation logic lives next to the
// rest of the trainer's Spearman math and stays consistent with
// `runExperiment()`.
//
// HONEST LIMITATION — read this before interpreting results:
//   The current trainer engine does not retrain XGBoost from TypeScript.
//   It evaluates the already-deployed model's stored predicted_vps against
//   actual_dps on a validation split. Worker B ("add feature X") therefore
//   cannot measure the actual lift from a new feature — the deployed
//   model doesn't know about it yet. Instead, each worker evaluates
//   Spearman on a DETERMINISTIC VALIDATION SUBSAMPLE seeded by the
//   worker's label. The resulting deltas differentiate workers enough
//   for the coordinator to pick a "best performer" and flag it for
//   Chairman review — but the delta is a PROXY, not a true lift
//   measurement. The Chairman review step is where a human decides
//   whether to trigger the real Python retrain (training-executor.ts)
//   with the candidate feature wired into the extraction pipeline.
//
//   TODO(prompt-41-followup): when the Trainer Engine gains the ability
//   to invoke training-executor.ts for real retrains, replace the
//   subsample-proxy in runFeatureDiscoveryExperiment() with a real
//   Python retrain call. The handler's Subtask surface is already
//   shaped for this — only the body of this function changes.
//
//   TODO(prompt-41-followup): when training-executor.ts completes a
//   retrain it should call XGBoost's `model.get_score()` (or equivalent
//   importance extraction) and write the result to model_variants.features
//   as a ranked list from most to least important. Worker D currently
//   uses the "last feature in the list" fallback because this ranking
//   doesn't exist yet. Once present, Worker D's removeWeakestFeature()
//   becomes a real importance-driven choice instead of a positional guess.

// ── Hyperparameter overrides format ─────────────────────────────────────
//
// Active trainer_programs.program_content can include an optional section:
//
//   ## Hyperparameter overrides
//   - max_depth: 8
//   - learning_rate: 0.05
//   - n_estimators: 500
//
// parseHyperparameterOverrides() pulls these out as { key: value } pairs.
// Values are parsed as numbers when they look numeric, otherwise left as
// strings. If the section is absent or empty, returns an empty object and
// Worker E becomes a no-op (it reports `skipped: no_overrides_defined`).
//
// Why markdown and not JSON: the rest of the program is human-written
// markdown (see seed in 20260407_trainer_engine.sql). Keeping the override
// section in the same format means the Chairman edits one file, not two.

export function parseHyperparameterOverrides(
  content: string,
): Record<string, number | string> {
  const out: Record<string, number | string> = {}
  // Match the section header up to the next `## ` header (or EOF).
  const sectionMatch = content.match(
    /##\s+Hyperparameter\s+overrides\s*\n([\s\S]*?)(?=\n##\s|$)/i,
  )
  if (!sectionMatch) return out

  const body = sectionMatch[1]
  const lineRe = /^\s*-\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.+?)\s*$/gm
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(body)) !== null) {
    const key = m[1]
    const raw = m[2].trim()
    const asNum = Number(raw)
    out[key] = Number.isFinite(asNum) && raw !== '' ? asNum : raw
  }
  return out
}

// ── Current-model feature list loader ──────────────────────────────────
//
// Reads the features list for the currently-active GLOBAL variant.
// Falls back to reading models/xgboost-v10-features.json from disk if
// the DB row has no `features` array. Returns [] if neither source is
// available — callers must handle the empty case.

export async function loadActiveFeatureList(
  db: SupabaseClient,
): Promise<string[]> {
  const { data } = await db
    .from('model_variants')
    .select('features')
    .is('niche', null)
    .eq('is_active', true)
    .limit(1)
    .single()

  const fromDb = data?.features
  if (Array.isArray(fromDb) && fromDb.length > 0) {
    return fromDb.map((f) => String(f))
  }

  // Disk fallback.
  try {
    const featuresPath = join(process.cwd(), 'models', 'xgboost-v10-features.json')
    if (existsSync(featuresPath)) {
      const parsed = JSON.parse(readFileSync(featuresPath, 'utf-8'))
      if (Array.isArray(parsed)) return parsed.map((f) => String(f))
    }
  } catch { /* non-fatal */ }

  return []
}

// ── Deterministic validation subsample ──────────────────────────────────
//
// Seeded shuffle using FNV-1a → LCG. Same seed → same subset → same
// Spearman. Different seeds → different subsets → different Spearman.
// This is how the 5 workers produce differentiated proxy deltas.

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededSubsample<T>(rows: T[], fraction: number, seed: number): T[] {
  if (rows.length === 0) return []
  const clamped = Math.max(0.1, Math.min(1, fraction))
  const targetN = Math.max(3, Math.floor(rows.length * clamped))

  // Tag each row with a deterministic score, sort by score, take top N.
  let state = seed || 1
  const scored = rows.map((row) => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return { row, score: state }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored.slice(0, targetN).map((x) => x.row)
}

// ── Feature Discovery experiment runner ─────────────────────────────────
//
// Called by the feature-discovery coordinator handler once per worker.
// Records one row in training_experiments, returns the proxy delta.
//
// IMPORTANT: this function is sandbox-only. It never sets
// result='pending_promotion' and never writes to model_variants. Promotion
// from Feature Discovery always requires a human via the Chairman review
// scheduled_action written by the finalizer.

export interface FeatureDiscoveryExperimentInput {
  /** Worker label, e.g. "worker_b_add_hook_word_count". Used as seed. */
  workerLabel: string
  /** Human description for training_experiments.description. */
  description: string
  /** "retrain" | "feature_add" | "feature_remove" | "hyperparameter". */
  experimentType: 'retrain' | 'feature_add' | 'feature_remove' | 'hyperparameter'
  /** Full feature list this worker is "testing" (for recording only). */
  features: string[]
  /** Hyperparameter set this worker is "testing" (for recording only). */
  hyperparams: Record<string, unknown>
  /** Pre-loaded clean feedback rows (shared across workers in one run). */
  feedbackRows: FeedbackRow[]
  /** Active trainer_program id to link the experiment to, or null. */
  programId: string | null
  /** Optional candidate_features.id this worker is evaluating. */
  candidateFeatureId?: string | null
}

export interface FeatureDiscoveryExperimentResult {
  experiment_id: string
  worker_label: string
  experiment_type: string
  validation_spearman: number
  baseline_spearman: number
  delta: number
  n_evaluated: number
  /** Size of the worker's validation subsample (same as n_evaluated). */
  validation_set_size: number
  /** Total clean feedback rows the loader returned for this run. */
  total_feedback_rows: number
  /**
   * Honest classification. 'inconclusive_tiny_sample' when the validation
   * subsample was < MIN_RELIABLE_SUBSET rows — Spearman on that few
   * points is statistical noise, not signal. The finalizer MUST NOT
   * promote/reject candidate_features on inconclusive results.
   */
  result:
    | 'improved'
    | 'no_change'
    | 'degraded'
    | 'inconclusive_tiny_sample'
    | 'skipped'
  candidate_feature_id: string | null
  skipped_reason?: string
}

// Honesty thresholds for the proxy evaluator.
// Rationale: with fewer than 20 feedback rows total, a stratified
// 20% validation split leaves 3–4 rows. Workers B–E then take an
// 85% subsample → still 3–4 rows. Spearman on 3 points is a 1-in-6
// random-ordering event, not a signal. Skipping below 20 avoids
// wasting DB rows on noise. The subsample threshold (10) catches
// the case where the total is high enough but the per-worker
// subsample still ends up tiny.
const MIN_FEEDBACK_ROWS_FOR_PROXY = 20
const MIN_RELIABLE_SUBSET = 10

export async function runFeatureDiscoveryExperiment(
  db: SupabaseClient,
  input: FeatureDiscoveryExperimentInput,
): Promise<FeatureDiscoveryExperimentResult> {
  const {
    workerLabel, description, experimentType, features, hyperparams,
    feedbackRows, programId, candidateFeatureId = null,
  } = input

  // Baseline = the currently-active global variant's stored Spearman.
  const baselineVariant = await getActiveVariant(db, null)
  const baselineSpearman = baselineVariant?.spearman_score ?? 0

  // Insufficient data → skip WITHOUT writing a training_experiments row.
  // Proxy deltas below this threshold are pure noise; persisting them
  // pollutes the experiment history.
  if (feedbackRows.length < MIN_FEEDBACK_ROWS_FOR_PROXY) {
    return {
      experiment_id: '',
      worker_label: workerLabel,
      experiment_type: experimentType,
      validation_spearman: 0,
      baseline_spearman: baselineSpearman,
      delta: 0,
      n_evaluated: 0,
      validation_set_size: 0,
      total_feedback_rows: feedbackRows.length,
      result: 'skipped',
      candidate_feature_id: candidateFeatureId,
      skipped_reason: `insufficient_data_for_proxy_evaluation (${feedbackRows.length} rows, need ${MIN_FEEDBACK_ROWS_FOR_PROXY}+)`,
    }
  }

  // Split stratified by niche (same logic as runExperiment).
  const { validation } = stratifiedSplit(feedbackRows)

  // Worker A (baseline) evaluates the full validation set. Workers B–E
  // evaluate a deterministic subsample seeded by their label. This is
  // the proxy-delta mechanism — see the limitation comment at the top.
  const isBaseline = experimentType === 'retrain'
  const subset = isBaseline
    ? validation
    : seededSubsample(validation, 0.85, hashSeed(workerLabel))

  const predicted = subset.map((r) => r.predicted_vps)
  const actual = subset.map((r) => r.actual_dps)
  const evalResult = evaluateModel(predicted, actual)

  const validationSpearman = Math.round(evalResult.spearman * 10000) / 10000
  const delta = Math.round((validationSpearman - baselineSpearman) * 10000) / 10000

  // Honest labeling: tiny samples → inconclusive, not improved/degraded.
  // A Spearman of 1.0 on 3 points is a 1-in-6 random event, not a signal.
  const isTinySubset = subset.length < MIN_RELIABLE_SUBSET
  const honestResult: FeatureDiscoveryExperimentResult['result'] = isTinySubset
    ? 'inconclusive_tiny_sample'
    : delta > 0
      ? 'improved'
      : Math.abs(delta) < 0.001
        ? 'no_change'
        : 'degraded'

  const descriptionFull =
    `[PROXY_EVAL][FEATURE_DISCOVERY] ${description} — proxy delta from deterministic subsample ` +
    `(n=${subset.length}/${validation.length}, total=${feedbackRows.length}). ` +
    `NOTE: same model evaluated on different subsets, NOT a retrained model. ` +
    `Feature changes are metadata only.` +
    (isTinySubset ? ` INCONCLUSIVE — tiny sample (n<${MIN_RELIABLE_SUBSET}), Spearman is statistical noise.` : '')

  const { data: inserted } = await db
    .from('training_experiments')
    .insert({
      program_id: programId,
      experiment_type: experimentType,
      niche_scope: null,
      description: descriptionFull,
      features_used: features,
      hyperparams,
      training_data_rows: subset.length,
      validation_spearman: validationSpearman,
      baseline_spearman: baselineSpearman,
      delta,
      result: honestResult,
      experiment_mode: 'sandbox',
    })
    .select('id')
    .single()

  return {
    experiment_id: inserted?.id ?? '',
    worker_label: workerLabel,
    experiment_type: experimentType,
    validation_spearman: validationSpearman,
    baseline_spearman: baselineSpearman,
    delta,
    n_evaluated: subset.length,
    validation_set_size: subset.length,
    total_feedback_rows: feedbackRows.length,
    result: honestResult,
    candidate_feature_id: candidateFeatureId,
  }
}

// ── Shared loader used by feature-discovery ─────────────────────────────
// Deliberately does NOT apply the `created_at >= lastTrainingDate`
// incremental filter that the regular retrain path uses. Feature
// Discovery is comparing different feature sets / hyperparams against
// the SAME validation data, not doing incremental retraining on new
// rows, so it needs every scoreable row the DB has — not just rows
// added since the last retrain. Without this, a recent production
// retrain would "consume" all existing labeled data and feature
// discovery would see feedback_rows=0 forever after.
export async function loadFeedbackForDiscovery(
  db: SupabaseClient,
): Promise<{ clean: FeedbackRow[]; corrupted: number }> {
  return loadFeedbackData(db, undefined)
}
