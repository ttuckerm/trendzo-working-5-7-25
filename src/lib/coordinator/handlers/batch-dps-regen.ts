/**
 * Prompt 36 — batch_dps_regen handler
 *
 * Breakdown: one subtask per 1000-row page of completed prediction runs
 * (optionally filtered by params.since).
 *
 * Per-subtask work: SKELETON — returns counts and a row sample for the
 * batch. Actual re-prediction wiring to runPredictionPipeline is out of
 * scope for Prompt 36 (it'd require a much larger plumbing change and
 * its own dispatch window). This handler proves the fan-out shape and
 * gives us a safe way to rehearse the parallel pattern against real
 * data. Replacing the body of runSubtask() with a real regen loop is
 * the follow-up.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CoordinatorHandler, Subtask } from '../types';

const BATCH_SIZE = 1000;

export const batchDpsRegenHandler: CoordinatorHandler = {
  async breakdown(params, db) {
    const sinceIso = typeof params.since === 'string' ? params.since : null;
    const maxBatches = typeof params.max_batches === 'number' ? params.max_batches : 100;

    let countQuery = db
      .from('prediction_runs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');
    if (sinceIso) countQuery = countQuery.gte('created_at', sinceIso);

    const { count, error } = await countQuery;
    if (error) throw new Error(`prediction_runs count failed: ${error.message}`);

    const total = count ?? 0;
    const numBatches = Math.min(Math.ceil(total / BATCH_SIZE), maxBatches);

    const subtasks: Subtask[] = [];
    for (let i = 0; i < numBatches; i++) {
      const from = i * BATCH_SIZE;
      const to = from + BATCH_SIZE - 1;
      subtasks.push({
        label: `batch:${from + 1}-${to + 1}`,
        params: { from, to, since: sinceIso },
      });
    }

    return {
      subtasks,
      meta: {
        batch_size: BATCH_SIZE,
        total_rows: total,
        planned_batches: numBatches,
        since: sinceIso,
        skeleton: true,
        skeleton_note: 'This handler counts and samples; real regen wiring is follow-up work.',
      },
    };
  },

  async runSubtask(subtaskParams, db) {
    const from = subtaskParams.from as number;
    const to = subtaskParams.to as number;
    const sinceIso = subtaskParams.since as string | null;

    let query = db
      .from('prediction_runs')
      .select('id, video_id, predicted_dps_7d, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (sinceIso) query = query.gte('created_at', sinceIso);

    const { data, error } = await query;
    if (error) throw new Error(`batch fetch failed: ${error.message}`);

    const rows = data || [];
    const avgDps =
      rows.length > 0
        ? Math.round(
            (rows.reduce(
              (sum: number, r: { predicted_dps_7d: number | null }) =>
                sum + (r.predicted_dps_7d ?? 0),
              0,
            ) /
              rows.length) *
              100,
          ) / 100
        : null;

    return {
      range: [from, to],
      rows_in_batch: rows.length,
      avg_predicted_dps: avgDps,
      sample_ids: rows.slice(0, 3).map((r: { id: string }) => r.id),
      _note: 'Skeleton: no rows were actually re-predicted.',
    };
  },
};
