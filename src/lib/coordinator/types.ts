/**
 * Prompt 36 — Coordinator task types
 *
 * Shared types for the parallel task dispatcher.
 * Handlers live in src/lib/coordinator/handlers/ and the
 * dispatcher in src/lib/coordinator/dispatcher.ts.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export type CoordinatorTaskType =
  | 'batch_dps_regen'
  | 'platform_audit'
  | 'monthly_reports'
  | 'niche_analysis'
  | 'feature_experiment'
  | 'feature_discovery'
  | 'cross_niche_transfer';

export type CoordinatorTaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface CoordinatorTaskRow {
  id: string;
  task_type: CoordinatorTaskType;
  status: CoordinatorTaskStatus;
  input_params: Record<string, unknown>;
  output_result: CoordinatorTaskOutput | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * A subtask is the unit of parallel work. Each handler's `breakdown()`
 * returns an array of these, which the dispatcher then runs via
 * Promise.allSettled. Use `label` for human-readable reporting
 * (e.g. "agency:Viral Kings", "niche:fitness", "batch:1-1000").
 */
export interface Subtask {
  label: string;
  params: Record<string, unknown>;
}

export interface SubtaskSuccess {
  label: string;
  ok: true;
  result: unknown;
  /**
   * The params this subtask was called with. Persisted so a Chairman can
   * re-run a single failed subtask without re-planning the breakdown.
   */
  subtask_params: Record<string, unknown>;
}

export interface SubtaskFailure {
  label: string;
  ok: false;
  error: string;
  subtask_params: Record<string, unknown>;
}

export type SubtaskOutcome = SubtaskSuccess | SubtaskFailure;

/**
 * Aggregated result written to coordinator_tasks.output_result.
 * status='completed' means the dispatcher finished the run, NOT that
 * every subtask succeeded — check `failed > 0` to detect partial runs.
 */
export interface CoordinatorTaskOutput {
  ok: number;
  failed: number;
  results: SubtaskSuccess[];
  errors: SubtaskFailure[];
  /**
   * Live progress while the task is still running (status='running').
   * Set from the very first subtask completion. Once the task flips to
   * 'completed' the progress field reflects the final counts, so UIs
   * can render a full bar either way.
   */
  progress?: { done: number; total: number };
  meta?: Record<string, unknown>;
}

/**
 * Every task type exports one of these. `breakdown()` decides how to
 * fan out. `runSubtask()` is called once per subtask, in parallel,
 * wrapped in a try/catch by the dispatcher.
 *
 * If breakdown() returns zero subtasks, the dispatcher marks the task
 * completed with ok=0/failed=0 and a meta.note explaining why — this
 * is a valid success state (e.g. "no agencies to report on").
 */
export interface CoordinatorHandler {
  breakdown(
    params: Record<string, unknown>,
    db: SupabaseClient,
  ): Promise<{ subtasks: Subtask[]; meta?: Record<string, unknown> }>;
  runSubtask(
    subtaskParams: Record<string, unknown>,
    db: SupabaseClient,
  ): Promise<unknown>;
}
