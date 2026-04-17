/**
 * Prompt 36 — feature_experiment handler
 *
 * Single-subtask task: look up one experiment and return its status
 * snapshot. Reads from brief_evaluations (Prompt 32 scorecard table)
 * keyed by params.experiment_id.
 *
 * This is deliberately read-only — running or mutating experiments
 * belongs in the trainer engine, not in a generic dispatcher.
 */

import type { CoordinatorHandler, Subtask } from '../types';

export const featureExperimentHandler: CoordinatorHandler = {
  async breakdown(params) {
    const experimentId = typeof params.experiment_id === 'string' ? params.experiment_id : null;
    if (!experimentId) {
      return {
        subtasks: [],
        meta: { note: 'feature_experiment requires params.experiment_id' },
      };
    }
    const subtasks: Subtask[] = [
      { label: `experiment:${experimentId}`, params: { experiment_id: experimentId } },
    ];
    return { subtasks };
  },

  async runSubtask(subtaskParams, db) {
    const experimentId = subtaskParams.experiment_id as string;

    const { data, error } = await db
      .from('brief_evaluations')
      .select('*')
      .eq('id', experimentId)
      .maybeSingle();

    if (error) throw new Error(`brief_evaluations lookup failed: ${error.message}`);
    if (!data) throw new Error(`experiment not found: ${experimentId}`);

    return {
      experiment_id: experimentId,
      status_snapshot: data,
    };
  },
};
