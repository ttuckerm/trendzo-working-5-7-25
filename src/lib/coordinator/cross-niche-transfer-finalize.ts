/**
 * Prompt 42 — Cross-niche transfer finalizer
 *
 * Runs after a cross_niche_transfer coordinator task completes.
 * Mirrors the Prompt 41 feature-discovery finalizer pattern: the
 * dispatcher intentionally has no post-hook, so cross-subtask
 * reconciliation lives in a separate module invoked by its own
 * API route.
 *
 * Per worker result:
 *   - skipped or inconclusive_tiny_sample → NO cross_niche_patterns
 *     write. Honest: we don't promote or reject on noise. The next
 *     transfer run will retry the same candidate.
 *   - improved (delta > threshold) → UPSERT cross_niche_patterns:
 *       target_niche added to confirmed_in_niches
 *   - no_change / degraded → UPSERT cross_niche_patterns:
 *       target_niche added to rejected_in_niches
 *
 * The UPSERT is keyed on (feature_name, source_niche). If a row
 * already exists for that pair, we array_append the target niche
 * into the appropriate list without duplication. If no row exists
 * (first time this source_niche's pattern is being persisted), we
 * INSERT a fresh row using observed_delta = source_total_delta.
 *
 * Idempotent: re-running the finalizer for the same taskId is a
 * no-op because we check for an existing cross_niche_review
 * scheduled_action keyed on task_id.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { scheduleActionSafe } from '@/lib/scheduler/schedule-action'

const DEFAULT_PROMOTION_THRESHOLD = 0.005

interface WorkerResult {
  experiment_id: string
  worker_label: string
  experiment_type: string
  validation_spearman: number
  baseline_spearman: number
  delta: number
  n_evaluated: number
  validation_set_size?: number
  total_feedback_rows?: number
  result?: string
  candidate_feature_id: string | null
  skipped_reason?: string
  // Cross-niche enrichment from the handler's runSubtask.
  target_niche?: string
  source_niche?: string
  source_total_delta?: number
  source_experiment_id?: string | null
  shared_category?: string
  feature_name?: string
}

export interface CrossNicheFinalizeResult {
  ok: boolean
  task_id: string
  already_finalized?: boolean
  confirmed_count: number
  rejected_count: number
  inconclusive_count: number
  skipped_count: number
  patterns_touched: number
  scheduled_action_id?: string
  error?: string
}

export async function finalizeCrossNicheTransferTask(
  db: SupabaseClient,
  taskId: string,
): Promise<CrossNicheFinalizeResult> {
  // 1. Load the task row.
  const { data: task, error: taskErr } = await db
    .from('coordinator_tasks')
    .select('id, task_type, status, output_result')
    .eq('id', taskId)
    .maybeSingle()

  if (taskErr) {
    return {
      ok: false,
      task_id: taskId,
      confirmed_count: 0,
      rejected_count: 0,
      inconclusive_count: 0,
      skipped_count: 0,
      patterns_touched: 0,
      error: `task lookup failed: ${taskErr.message}`,
    }
  }
  if (!task) {
    return {
      ok: false,
      task_id: taskId,
      confirmed_count: 0,
      rejected_count: 0,
      inconclusive_count: 0,
      skipped_count: 0,
      patterns_touched: 0,
      error: 'task not found',
    }
  }
  if (task.task_type !== 'cross_niche_transfer') {
    return {
      ok: false,
      task_id: taskId,
      confirmed_count: 0,
      rejected_count: 0,
      inconclusive_count: 0,
      skipped_count: 0,
      patterns_touched: 0,
      error: `task_type is ${task.task_type}, expected cross_niche_transfer`,
    }
  }
  if (task.status !== 'completed') {
    return {
      ok: false,
      task_id: taskId,
      confirmed_count: 0,
      rejected_count: 0,
      inconclusive_count: 0,
      skipped_count: 0,
      patterns_touched: 0,
      error: `task status is ${task.status}, expected completed`,
    }
  }

  // 2. Idempotency guard.
  const existing = await db
    .from('scheduled_actions')
    .select('id')
    .eq('action_type', 'cross_niche_review')
    .filter('params->>task_id', 'eq', taskId)
    .limit(1)
    .maybeSingle()
  if (existing.data?.id) {
    return {
      ok: true,
      task_id: taskId,
      already_finalized: true,
      confirmed_count: 0,
      rejected_count: 0,
      inconclusive_count: 0,
      skipped_count: 0,
      patterns_touched: 0,
      scheduled_action_id: existing.data.id as string,
    }
  }

  // 3. Extract worker results.
  const output = (task.output_result || {}) as {
    results?: Array<{ label: string; result: WorkerResult }>
  }
  const workerResults: WorkerResult[] = (output.results || [])
    .map((r) => r.result)
    .filter((r): r is WorkerResult => r !== null && typeof r === 'object')

  // 4. Load threshold from active program (same as Prompt 41 finalizer).
  const { data: programRow } = await db
    .from('trainer_programs')
    .select('program_content')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  let threshold = DEFAULT_PROMOTION_THRESHOLD
  if (programRow?.program_content) {
    const m = (programRow.program_content as string).match(
      /Spearman\s+must\s+improve\s+by\s*>\s*([\d.]+)/i,
    )
    if (m) threshold = parseFloat(m[1])
  }

  // 5. Per-worker reconciliation with cross_niche_patterns.
  let confirmedCount = 0
  let rejectedCount = 0
  let inconclusiveCount = 0
  let skippedCount = 0
  let patternsTouched = 0

  for (const wr of workerResults) {
    if (!wr.feature_name || !wr.source_niche || !wr.target_niche) continue

    const isSkipped = !!wr.skipped_reason || wr.result === 'skipped'
    const isInconclusive = wr.result === 'inconclusive_tiny_sample'

    if (isSkipped) {
      skippedCount++
      continue
    }
    if (isInconclusive) {
      inconclusiveCount++
      continue
    }

    const isImprovement = wr.delta > threshold
    if (isImprovement) confirmedCount++
    else rejectedCount++

    // Upsert cross_niche_patterns (feature_name, source_niche).
    const { data: existingRow } = await db
      .from('cross_niche_patterns')
      .select('id, confirmed_in_niches, rejected_in_niches')
      .eq('feature_name', wr.feature_name)
      .eq('source_niche', wr.source_niche)
      .maybeSingle()

    if (existingRow) {
      const confirmed: string[] = (existingRow as any).confirmed_in_niches || []
      const rejected: string[] = (existingRow as any).rejected_in_niches || []
      if (isImprovement) {
        if (!confirmed.includes(wr.target_niche)) confirmed.push(wr.target_niche)
      } else {
        if (!rejected.includes(wr.target_niche)) rejected.push(wr.target_niche)
      }
      const { error: updErr } = await db
        .from('cross_niche_patterns')
        .update({
          confirmed_in_niches: confirmed,
          rejected_in_niches: rejected,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existingRow as any).id)
      if (!updErr) patternsTouched++
    } else {
      const { error: insErr } = await db.from('cross_niche_patterns').insert({
        feature_name: wr.feature_name,
        source_niche: wr.source_niche,
        observed_delta: wr.source_total_delta ?? wr.delta,
        observed_n: wr.n_evaluated,
        source_experiment_id: wr.source_experiment_id || null,
        tier: 'warm',
        confirmed_in_niches: isImprovement ? [wr.target_niche] : [],
        rejected_in_niches: isImprovement ? [] : [wr.target_niche],
      })
      if (!insErr) patternsTouched++
    }
  }

  // 6. Write the review scheduled_action.
  const scheduled = await scheduleActionSafe({
    actionType: 'cross_niche_review',
    triggerCondition:
      `Cross-niche transfer task ${taskId.slice(0, 8)} — ` +
      `confirmed=${confirmedCount}, rejected=${rejectedCount}, inconclusive=${inconclusiveCount}, skipped=${skippedCount}. ` +
      `${patternsTouched} cross_niche_patterns row(s) touched.`,
    scheduledFor: new Date(),
    sourceSubsystem: 'trainer',
    params: {
      task_id: taskId,
      confirmed_count: confirmedCount,
      rejected_count: rejectedCount,
      inconclusive_count: inconclusiveCount,
      skipped_count: skippedCount,
      patterns_touched: patternsTouched,
      promotion_threshold: threshold,
    },
    db,
  })

  return {
    ok: true,
    task_id: taskId,
    confirmed_count: confirmedCount,
    rejected_count: rejectedCount,
    inconclusive_count: inconclusiveCount,
    skipped_count: skippedCount,
    patterns_touched: patternsTouched,
    scheduled_action_id: scheduled.id,
  }
}
