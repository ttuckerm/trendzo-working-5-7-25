/**
 * Prompt 41 — feature_discovery handler
 *
 * Atlas subsystem 3 (Feature Discovery). Dispatches 5 parallel workers:
 *
 *   A) worker_a_baseline           — retrain with current features
 *   B) worker_b_add_<feature_X>    — current features + 1st untested candidate
 *   C) worker_c_add_<feature_Y>    — current features + 2nd untested candidate
 *   D) worker_d_remove_weakest     — current features minus the weakest
 *   E) worker_e_hyperparams        — current features, overridden hyperparams
 *
 * Each worker evaluates the current deployed model on a deterministic
 * validation subsample seeded by its label, via
 * `runFeatureDiscoveryExperiment()` in trainer-engine.ts. The handler
 * itself does NO training math — it's a pure orchestrator.
 *
 * See trainer-engine.ts' "Prompt 41 — Feature Discovery helpers" block
 * for the honest limitations of the current proxy-delta approach and
 * the TODO for wiring real Python retrains.
 *
 * Graceful degradation:
 *   - Zero untested candidates → B and C become no-ops (skipped:
 *     no_candidates_available). A, D, E still run.
 *   - Zero feedback rows → every worker records skipped:
 *     insufficient_data. Task still completes with ok=5 rather than
 *     failing, so the Chairman dashboard surfaces the data gap.
 *   - Feature list empty → D becomes a no-op (skipped: empty_feature_list).
 *   - No hyperparam overrides in the active program → E becomes a no-op
 *     (skipped: no_overrides_defined).
 *   - 50+ untested candidates → breakdown picks only the top 2 by
 *     created_at ASC. The other 48 stay untested for the next run.
 */

import type { CoordinatorHandler, Subtask } from '../types';
import {
  parseHyperparameterOverrides,
  loadActiveFeatureList,
  loadFeedbackForDiscovery,
  runFeatureDiscoveryExperiment,
  type FeedbackRow,
  type FeatureDiscoveryExperimentResult,
} from '@/lib/training/trainer-engine';

// ── Worker config carried through from breakdown → runSubtask ──────────

interface WorkerConfig {
  worker_label: string;
  experiment_type: 'retrain' | 'feature_add' | 'feature_remove' | 'hyperparameter';
  description: string;
  features: string[];
  hyperparams: Record<string, unknown>;
  candidate_feature_id: string | null;
  /** Set when the worker has nothing to do. runSubtask short-circuits. */
  skip_reason: string | null;
}

interface BreakdownMeta {
  feedback_rows: number;
  corrupted: number;
  base_features: string[];
  base_features_source: 'db' | 'disk' | 'none';
  candidates_seen: number;
  candidates_dispatched: number;
  weakest_feature: { name: string | null; source: 'importance' | 'last_in_list_fallback' | 'none' };
  hyperparam_overrides: Record<string, number | string>;
  program_id: string | null;
  /**
   * Feedback rows are stringified once during breakdown and passed
   * through each subtask's params. This keeps each subtask
   * self-contained and avoids re-hitting the DB five times for the
   * same dataset. Size: ~200B per row × up to 5000 rows = ~1MB JSON
   * per subtask, which is well inside Postgres JSONB column limits.
   */
  feedback_payload_id: string;
}

export const featureDiscoveryHandler: CoordinatorHandler = {
  async breakdown(_params, db) {
    // 1. Load feedback rows.
    const { clean: feedbackRows, corrupted } = await loadFeedbackForDiscovery(db);

    // 2. Load current base feature list.
    const baseFeatures = await loadActiveFeatureList(db);
    const baseFeaturesSource: BreakdownMeta['base_features_source'] =
      baseFeatures.length === 0 ? 'none' : 'db';

    // 3. Load active program id + hyperparameter overrides.
    const { data: programRow } = await db
      .from('trainer_programs')
      .select('id, program_content')
      .eq('is_active', true)
      .limit(1)
      .single();
    const programId = (programRow?.id as string | undefined) ?? null;
    const hyperparamOverrides = programRow?.program_content
      ? parseHyperparameterOverrides(programRow.program_content as string)
      : {};

    // 4. Load top-2 untested candidate features (oldest first).
    //    Passing limit(2) is how we handle the 50-candidate overload case.
    const { data: candidatesRaw } = await db
      .from('candidate_features')
      .select('id, feature_name, description')
      .eq('status', 'untested')
      .order('created_at', { ascending: true })
      .limit(2);
    const candidates = (candidatesRaw || []) as Array<{
      id: string; feature_name: string; description: string;
    }>;

    // Count how many untested candidates actually exist, so meta can
    // report "saw 50, dispatched 2".
    const { count: candidatesSeenRaw } = await db
      .from('candidate_features')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'untested');
    const candidatesSeen = typeof candidatesSeenRaw === 'number' ? candidatesSeenRaw : candidates.length;

    // 5. Mark the dispatched candidates as testing BEFORE workers run.
    //    The finalizer flips them to promoted/rejected after.
    if (candidates.length > 0) {
      await db
        .from('candidate_features')
        .update({ status: 'testing' })
        .in('id', candidates.map((c) => c.id));
    }

    // 6. Resolve "weakest feature" for Worker D.
    //    TODO(prompt-41-followup): use real XGBoost feature importances
    //    once model_variants.features stores them as a ranked list.
    //    Current fallback: last feature in the list.
    const weakestFeature =
      baseFeatures.length > 0
        ? {
            name: baseFeatures[baseFeatures.length - 1],
            source: 'last_in_list_fallback' as const,
          }
        : { name: null, source: 'none' as const };

    // 7. Stash feedback payload under a meta key so each subtask can
    //    receive it via params without a second DB fetch.
    const feedbackPayloadId = `fb_${Date.now().toString(36)}`;

    // 8. Build worker configs.
    const configs: WorkerConfig[] = [];

    // Worker A — baseline retrain.
    configs.push({
      worker_label: 'worker_a_baseline',
      experiment_type: 'retrain',
      description: 'Worker A — baseline retrain with current features',
      features: baseFeatures,
      hyperparams: {},
      candidate_feature_id: null,
      skip_reason: baseFeatures.length === 0 ? 'empty_feature_list' : null,
    });

    // Workers B and C — add candidate X / Y. If fewer than 2 candidates,
    // the missing slot becomes a skipped no-op.
    for (let i = 0; i < 2; i++) {
      const slot = i === 0 ? 'b' : 'c';
      const cand = candidates[i];
      if (!cand) {
        configs.push({
          worker_label: `worker_${slot}_add_none`,
          experiment_type: 'feature_add',
          description: `Worker ${slot.toUpperCase()} — no candidate available`,
          features: baseFeatures,
          hyperparams: {},
          candidate_feature_id: null,
          skip_reason: 'no_candidates_available',
        });
        continue;
      }
      configs.push({
        worker_label: `worker_${slot}_add_${cand.feature_name}`,
        experiment_type: 'feature_add',
        description: `Worker ${slot.toUpperCase()} — add candidate feature "${cand.feature_name}"`,
        features: [...baseFeatures, cand.feature_name],
        hyperparams: {},
        candidate_feature_id: cand.id,
        skip_reason: null,
      });
    }

    // Worker D — remove weakest.
    configs.push({
      worker_label: 'worker_d_remove_weakest',
      experiment_type: 'feature_remove',
      description: weakestFeature.name
        ? `Worker D — remove weakest feature "${weakestFeature.name}" (source: ${weakestFeature.source})`
        : 'Worker D — no feature list available',
      features: weakestFeature.name
        ? baseFeatures.filter((f) => f !== weakestFeature.name)
        : baseFeatures,
      hyperparams: {},
      candidate_feature_id: null,
      skip_reason: weakestFeature.name === null ? 'empty_feature_list' : null,
    });

    // Worker E — hyperparameter overrides.
    const hasOverrides = Object.keys(hyperparamOverrides).length > 0;
    configs.push({
      worker_label: 'worker_e_hyperparams',
      experiment_type: 'hyperparameter',
      description: hasOverrides
        ? `Worker E — override hyperparameters: ${Object.entries(hyperparamOverrides).map(([k, v]) => `${k}=${v}`).join(', ')}`
        : 'Worker E — no hyperparameter overrides in active program',
      features: baseFeatures,
      hyperparams: hyperparamOverrides,
      candidate_feature_id: null,
      skip_reason: hasOverrides ? null : 'no_overrides_defined',
    });

    // Feedback rows are passed by reference through meta.feedback_rows
    // rather than copied into each subtask's params, to keep the task
    // row JSONB small. The runSubtask reads them from meta via a
    // closure-style hack: we embed the rows directly in each subtask's
    // params (they serialize once, Promise.allSettled uses refs, no
    // extra round-trips). For very large datasets this is still fine
    // because it stays in process memory.
    const subtasks: Subtask[] = configs.map((cfg) => ({
      label: cfg.worker_label,
      params: {
        config: cfg as unknown as Record<string, unknown>,
        feedback_rows: feedbackRows as unknown as Record<string, unknown>[],
        program_id: programId,
      },
    }));

    const meta: BreakdownMeta = {
      feedback_rows: feedbackRows.length,
      corrupted,
      base_features: baseFeatures,
      base_features_source: baseFeaturesSource,
      candidates_seen: candidatesSeen,
      candidates_dispatched: candidates.length,
      weakest_feature: weakestFeature,
      hyperparam_overrides: hyperparamOverrides,
      program_id: programId,
      feedback_payload_id: feedbackPayloadId,
    };

    return { subtasks, meta: meta as unknown as Record<string, unknown> };
  },

  async runSubtask(subtaskParams, db) {
    const cfg = subtaskParams.config as unknown as WorkerConfig;
    const feedbackRows = subtaskParams.feedback_rows as unknown as FeedbackRow[];
    const programId = (subtaskParams.program_id as string | null) ?? null;

    // Short-circuit skipped workers — no experiment row written.
    if (cfg.skip_reason) {
      const skipped: FeatureDiscoveryExperimentResult = {
        experiment_id: '',
        worker_label: cfg.worker_label,
        experiment_type: cfg.experiment_type,
        validation_spearman: 0,
        baseline_spearman: 0,
        delta: 0,
        n_evaluated: 0,
        validation_set_size: 0,
        total_feedback_rows: feedbackRows.length,
        result: 'skipped',
        candidate_feature_id: cfg.candidate_feature_id,
        skipped_reason: cfg.skip_reason,
      };
      return skipped;
    }

    const result = await runFeatureDiscoveryExperiment(db, {
      workerLabel: cfg.worker_label,
      description: cfg.description,
      experimentType: cfg.experiment_type,
      features: cfg.features,
      hyperparams: cfg.hyperparams,
      feedbackRows,
      programId,
      candidateFeatureId: cfg.candidate_feature_id,
    });

    return result;
  },
};
