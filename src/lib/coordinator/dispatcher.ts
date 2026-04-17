/**
 * Prompt 37 — Coordinator task dispatcher (v2, background + progress)
 *
 * Changed from Prompt 36's awaited model to fire-and-forget so the UI
 * can poll for live progress ("3 of 8 subtasks complete"). The public
 * entry point is now `startTask()` which:
 *
 *   1. Synchronously inserts a coordinator_tasks row in status='queued'
 *      and returns its id immediately to the caller (the API route
 *      returns this, the UI starts polling).
 *   2. Kicks off `runInBackground()` via `void` — Next.js keeps the
 *      promise alive in the dev-server Node process until it settles.
 *      The background run writes incremental progress to
 *      output_result.progress after each subtask settles.
 *
 * Design invariants preserved from Prompt 36:
 *   - Promise.allSettled semantics: one bad subtask never takes down
 *     its siblings. (Implemented as a try/catch inside each parallel
 *     promise so we can still push live progress as they land.)
 *   - status='completed' means the dispatcher finished — check
 *     output_result.failed for partial runs.
 *   - status='failed' is reserved for dispatcher-level errors (handler
 *     threw during breakdown, DB write failed, etc.).
 *
 * Production caveat (local dev is fine):
 *   On Vercel's serverless runtime, a `void promise` started inside a
 *   request handler is killed the instant the handler returns. For
 *   production we'd either (a) use `@vercel/functions` waitUntil, or
 *   (b) have a Supabase cron pick up status='queued' rows and run them
 *   on a schedule. This module runs fine in `next dev` without either.
 *   Not wiring prod now — separate prompt.
 *
 * Rerun support (also new in Prompt 37):
 *   If input_params contains `_rerun_subtask: true` plus
 *   `_subtask_params`, the dispatcher SKIPS breakdown() and runs a
 *   single subtask with those params instead. This is how the
 *   "re-run individual failed subtask" button works.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CoordinatorHandler,
  CoordinatorTaskOutput,
  CoordinatorTaskType,
  Subtask,
  SubtaskFailure,
  SubtaskSuccess,
} from './types';
import { monthlyReportsHandler } from './handlers/monthly-reports';
import { nicheAnalysisHandler } from './handlers/niche-analysis';
import { batchDpsRegenHandler } from './handlers/batch-dps-regen';
import { platformAuditHandler } from './handlers/platform-audit';
import { featureExperimentHandler } from './handlers/feature-experiment';
import { featureDiscoveryHandler } from './handlers/feature-discovery';
import { crossNicheTransferHandler } from './handlers/cross-niche-transfer';

const HANDLERS: Record<CoordinatorTaskType, CoordinatorHandler> = {
  monthly_reports: monthlyReportsHandler,
  niche_analysis: nicheAnalysisHandler,
  batch_dps_regen: batchDpsRegenHandler,
  platform_audit: platformAuditHandler,
  feature_experiment: featureExperimentHandler,
  feature_discovery: featureDiscoveryHandler,
  cross_niche_transfer: crossNicheTransferHandler,
};

/**
 * Throttle for incremental progress writes. Without this, a 50-subtask
 * fast run would issue ~50 UPDATEs in a few hundred milliseconds. With
 * this, progress jumps roughly every half second, plus a guaranteed
 * write at the very end.
 */
const PROGRESS_WRITE_MIN_INTERVAL_MS = 150;

export interface StartTaskArgs {
  taskType: CoordinatorTaskType;
  params?: Record<string, unknown>;
  createdBy?: string | null;
  db: SupabaseClient;
}

export interface StartTaskResult {
  taskId: string;
}

/**
 * Public entry point. Inserts the task row, kicks the background
 * worker, returns immediately. The returned taskId is what the UI
 * polls on.
 */
export async function startTask(args: StartTaskArgs): Promise<StartTaskResult> {
  const { taskType, params = {}, createdBy = null, db } = args;

  if (!(taskType in HANDLERS)) {
    throw new Error(`Unknown task_type: ${taskType}`);
  }

  const { data: inserted, error: insertErr } = await db
    .from('coordinator_tasks')
    .insert({
      task_type: taskType,
      status: 'queued',
      input_params: params,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to create coordinator_tasks row: ${insertErr?.message}`);
  }

  const taskId = inserted.id as string;

  // Fire-and-forget. We intentionally do NOT await this — the whole
  // point of v2 is that the API route returns in a few ms and the UI
  // polls for progress. Any unhandled error inside runInBackground is
  // swallowed into the task row's error_message, so we just log here
  // as a last-resort belt-and-braces.
  void runInBackground(taskId, taskType, params, db).catch((err) => {
    console.error(`[coordinator] runInBackground crashed for ${taskId}:`, err);
  });

  return { taskId };
}

/**
 * Background worker. Never throws to its caller — it always writes
 * the outcome (completed or failed) into the task row.
 */
async function runInBackground(
  taskId: string,
  taskType: CoordinatorTaskType,
  params: Record<string, unknown>,
  db: SupabaseClient,
): Promise<void> {
  const handler = HANDLERS[taskType];

  // Flip to running + stamp started_at.
  await db
    .from('coordinator_tasks')
    .update({ status: 'running', started_at: new Date().toISOString() })
    .eq('id', taskId);

  try {
    // Rerun path: if the caller passed _rerun_subtask we skip breakdown
    // and treat the task as a single hand-crafted subtask.
    let subtasks: Subtask[];
    let meta: Record<string, unknown> | undefined;

    if (params._rerun_subtask === true && typeof params._subtask_params === 'object') {
      subtasks = [
        {
          label:
            typeof params._rerun_label === 'string'
              ? params._rerun_label
              : 'rerun:single',
          params: params._subtask_params as Record<string, unknown>,
        },
      ];
      meta = { rerun: true, rerun_of: params._rerun_of };
    } else {
      const planned = await handler.breakdown(params, db);
      subtasks = planned.subtasks;
      meta = planned.meta;
    }

    const total = subtasks.length;
    const results: SubtaskSuccess[] = [];
    const errors: SubtaskFailure[] = [];
    let done = 0;
    let lastProgressWrite = 0;

    // Write a zero-progress update up front so the UI can render the
    // denominator immediately, even before the first subtask finishes.
    await writeProgress(db, taskId, { done, total, results, errors, meta });

    // Parallel execution. Each inner async converts exceptions into
    // SubtaskFailure so the siblings survive — same semantics as
    // Promise.allSettled, just with a completion hook.
    const promises = subtasks.map(async (st) => {
      try {
        const result = await handler.runSubtask(st.params, db);
        results.push({ label: st.label, ok: true, result, subtask_params: st.params });
      } catch (err) {
        errors.push({
          label: st.label,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
          subtask_params: st.params,
        });
      } finally {
        done++;
        const now = Date.now();
        if (now - lastProgressWrite >= PROGRESS_WRITE_MIN_INTERVAL_MS || done === total) {
          lastProgressWrite = now;
          // Fire-and-forget inside the worker — we don't want a
          // transient DB hiccup to abort the whole run, just skip
          // one progress frame.
          writeProgress(db, taskId, { done, total, results, errors, meta }).catch(
            (err) => console.warn(`[coordinator] progress write failed for ${taskId}:`, err),
          );
        }
      }
    });

    await Promise.all(promises);

    const output: CoordinatorTaskOutput = {
      ok: results.length,
      failed: errors.length,
      results: [...results],
      errors: [...errors],
      progress: { done: total, total },
      ...(meta ? { meta } : {}),
    };

    const { error: updErr } = await db
      .from('coordinator_tasks')
      .update({
        status: 'completed',
        output_result: output,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updErr) {
      throw new Error(`Failed to write final output_result: ${updErr.message}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .from('coordinator_tasks')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);
  }
}

/**
 * Write an intermediate progress snapshot. Uses a shallow copy of the
 * in-flight results/errors arrays so the worker can keep pushing into
 * the live ones without mutating what we just serialized.
 */
async function writeProgress(
  db: SupabaseClient,
  taskId: string,
  snapshot: {
    done: number;
    total: number;
    results: SubtaskSuccess[];
    errors: SubtaskFailure[];
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const partial: CoordinatorTaskOutput = {
    ok: snapshot.results.length,
    failed: snapshot.errors.length,
    results: [...snapshot.results],
    errors: [...snapshot.errors],
    progress: { done: snapshot.done, total: snapshot.total },
    ...(snapshot.meta ? { meta: snapshot.meta } : {}),
  };

  await db
    .from('coordinator_tasks')
    .update({ output_result: partial })
    .eq('id', taskId);
}
