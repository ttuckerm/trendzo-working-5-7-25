/**
 * Prompt 41 — Feature Discovery finalizer
 *
 * Runs AFTER a feature_discovery coordinator task completes. The
 * dispatcher intentionally has no post-hook (Prompt 37's design
 * invariant), so cross-subtask comparison lives here instead.
 *
 * What the finalizer does:
 *   1. Reads the completed coordinator_tasks row.
 *   2. Picks the best-performing worker by max(delta) across non-
 *      skipped results. Tie-break: prefer workers with a
 *      candidate_feature_id over Worker A, so promotions beat drift.
 *   3. For each dispatched candidate_feature row (status='testing'),
 *      flips it to 'promoted' if that worker's delta > threshold,
 *      otherwise 'rejected'. Records spearman_delta + tested_date.
 *   4. Writes one scheduled_action of type 'feature_discovery_review'
 *      pointing at the best performer, so the Chairman dashboard
 *      surfaces it in the existing review queue.
 *
 * Idempotent: safe to call twice. It checks for an existing
 * feature_discovery_review action referencing the same taskId and
 * skips scheduling a duplicate.
 *
 * NOT called by the dispatcher. Called by the finalize API route,
 * which the UI hits once a feature_discovery task flips to
 * status='completed'.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { scheduleActionSafe } from '@/lib/scheduler/schedule-action';

const DEFAULT_PROMOTION_THRESHOLD = 0.005;

interface WorkerResult {
  experiment_id: string;
  worker_label: string;
  experiment_type: string;
  validation_spearman: number;
  baseline_spearman: number;
  delta: number;
  n_evaluated: number;
  /** Present on runs from Prompt 41 honesty upgrade. */
  validation_set_size?: number;
  total_feedback_rows?: number;
  /** 'skipped' | 'inconclusive_tiny_sample' | 'improved' | 'no_change' | 'degraded' */
  result?: string;
  candidate_feature_id: string | null;
  skipped_reason?: string;
}

export interface FinalizeResult {
  ok: boolean;
  task_id: string;
  already_finalized?: boolean;
  best_worker?: {
    label: string;
    delta: number;
    experiment_id: string;
    candidate_feature_id: string | null;
  };
  candidates_updated?: number;
  scheduled_action_id?: string;
  error?: string;
}

export async function finalizeFeatureDiscoveryTask(
  db: SupabaseClient,
  taskId: string,
): Promise<FinalizeResult> {
  // 1. Load the task row.
  const { data: task, error: taskErr } = await db
    .from('coordinator_tasks')
    .select('id, task_type, status, output_result')
    .eq('id', taskId)
    .maybeSingle();

  if (taskErr) return { ok: false, task_id: taskId, error: `task lookup failed: ${taskErr.message}` };
  if (!task) return { ok: false, task_id: taskId, error: 'task not found' };
  if (task.task_type !== 'feature_discovery') {
    return { ok: false, task_id: taskId, error: `task_type is ${task.task_type}, expected feature_discovery` };
  }
  if (task.status !== 'completed') {
    return { ok: false, task_id: taskId, error: `task status is ${task.status}, expected completed` };
  }

  // 2. Idempotency: if we already wrote a review action for this task,
  //    don't double-promote / double-schedule.
  const existingReview = await db
    .from('scheduled_actions')
    .select('id')
    .eq('action_type', 'feature_discovery_review')
    .filter('params->>task_id', 'eq', taskId)
    .limit(1)
    .maybeSingle();
  if (existingReview.data?.id) {
    return { ok: true, task_id: taskId, already_finalized: true, scheduled_action_id: existingReview.data.id as string };
  }

  // 3. Extract successful worker results from output_result.
  const output = (task.output_result || {}) as { results?: Array<{ label: string; result: WorkerResult }> };
  const workerResults: WorkerResult[] = (output.results || [])
    .map((r) => r.result)
    .filter((r): r is WorkerResult => r !== null && typeof r === 'object');

  // Load threshold from active program (parseProgramRules exists in
  // trainer-engine but is overkill here — just read the one number).
  const { data: programRow } = await db
    .from('trainer_programs')
    .select('program_content')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  let threshold = DEFAULT_PROMOTION_THRESHOLD;
  if (programRow?.program_content) {
    const m = (programRow.program_content as string).match(/Spearman\s+must\s+improve\s+by\s*>\s*([\d.]+)/i);
    if (m) threshold = parseFloat(m[1]);
  }

  // 4. Update candidate_features rows based on their worker's outcome.
  //
  //    Three cases per candidate-carrying worker:
  //      a) skipped (insufficient_data_for_proxy_evaluation) →
  //         breakdown() marked the row 'testing' before dispatch. Reset
  //         it back to 'untested' so the next run can retry — otherwise
  //         it's stuck forever.
  //      b) inconclusive_tiny_sample → same as (a): reset to untested.
  //         We ran, but the result is statistical noise, so promoting or
  //         rejecting on it would be dishonest. Try again when there's
  //         more data.
  //      c) actually ran with a reliable subsample → promote if delta
  //         cleared threshold, otherwise reject. This is the only
  //         terminal path.
  let candidatesUpdated = 0;
  let candidatesReset = 0;
  for (const wr of workerResults) {
    if (!wr.candidate_feature_id) continue;
    const isSkipped = !!wr.skipped_reason || wr.result === 'skipped';
    const isInconclusive = wr.result === 'inconclusive_tiny_sample';
    if (isSkipped || isInconclusive) {
      const { error: resetErr } = await db
        .from('candidate_features')
        .update({ status: 'untested', spearman_delta: null, tested_date: null })
        .eq('id', wr.candidate_feature_id);
      if (!resetErr) candidatesReset++;
      continue;
    }
    const newStatus = wr.delta > threshold ? 'promoted' : 'rejected';
    const { error: updErr } = await db
      .from('candidate_features')
      .update({
        status: newStatus,
        spearman_delta: wr.delta,
        tested_date: new Date().toISOString(),
      })
      .eq('id', wr.candidate_feature_id);
    if (!updErr) candidatesUpdated++;
  }

  // 5. Pick the best performer. Exclude skipped AND inconclusive —
  //    picking a "best" from noise is the bug we're fixing. Tie-breaker:
  //    prefer workers with a candidate_feature_id (a real feature ADD
  //    beats a baseline drift win).
  const ranActual = workerResults.filter(
    (r) => !r.skipped_reason && r.result !== 'skipped' && r.result !== 'inconclusive_tiny_sample',
  );
  if (ranActual.length === 0) {
    // Nothing to review — still write a review action so the Chairman
    // sees the task ran but produced no candidates.
    const scheduled = await scheduleActionSafe({
      actionType: 'feature_discovery_review',
      triggerCondition: `Feature Discovery task ${taskId.slice(0, 8)} completed with 0 non-skipped workers (data gap or empty candidate queue).`,
      scheduledFor: new Date(),
      sourceSubsystem: 'trainer',
      params: {
        task_id: taskId,
        best_worker_label: null,
        best_delta: null,
        reason: 'no_workers_ran',
      },
      db,
    });
    return {
      ok: true,
      task_id: taskId,
      candidates_updated: candidatesUpdated,
      scheduled_action_id: scheduled.id,
    };
  }

  ranActual.sort((a, b) => {
    if (b.delta !== a.delta) return b.delta - a.delta;
    // Tie: prefer candidate_feature_id workers.
    const aHasCand = a.candidate_feature_id ? 1 : 0;
    const bHasCand = b.candidate_feature_id ? 1 : 0;
    return bHasCand - aHasCand;
  });
  const best = ranActual[0];

  // 6. Write the review action.
  const scheduled = await scheduleActionSafe({
    actionType: 'feature_discovery_review',
    triggerCondition: `Feature Discovery task ${taskId.slice(0, 8)} — best performer "${best.worker_label}" with delta ${best.delta.toFixed(4)} (threshold ${threshold}). ${candidatesUpdated} candidate feature(s) updated.`,
    scheduledFor: new Date(),
    sourceSubsystem: 'trainer',
    params: {
      task_id: taskId,
      best_worker_label: best.worker_label,
      best_delta: best.delta,
      best_experiment_id: best.experiment_id,
      best_candidate_feature_id: best.candidate_feature_id,
      promotion_threshold: threshold,
      candidates_updated: candidatesUpdated,
    },
    db,
  });

  return {
    ok: true,
    task_id: taskId,
    best_worker: {
      label: best.worker_label,
      delta: best.delta,
      experiment_id: best.experiment_id,
      candidate_feature_id: best.candidate_feature_id,
    },
    candidates_updated: candidatesUpdated,
    scheduled_action_id: scheduled.id,
  };
}
