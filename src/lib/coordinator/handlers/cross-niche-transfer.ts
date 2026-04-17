/**
 * Prompt 42 — cross_niche_transfer handler
 *
 * Atlas subsystem 3 (Feature Discovery) + 6 (Memory).
 *
 * Tests top features from data-rich adjacent niches against a
 * data-thin target niche. Each transfer candidate becomes one
 * parallel subtask that calls runFeatureDiscoveryExperiment() with
 * experimentType='feature_add' and the candidate appended to the
 * current base feature list.
 *
 * Input params (all optional — at least one must resolve to a niche):
 *   target_niche      — explicit niche id. If set, skip agency lookup.
 *   target_agency_id  — agency uuid. Handler picks the thinnest niche
 *                       the agency works in (fewest scoreable rows).
 *   top_n             — how many candidates to transfer (default 3).
 *
 * Graceful degradation cases (all complete successfully, not fail):
 *   a) No target niche resolvable        → zero subtasks, meta.note
 *   b) No adjacent niches in that category → zero subtasks, meta.note
 *   c) Adjacent niches have zero top features (common in early data)
 *                                         → zero subtasks, meta.note
 *   d) All candidates already tested in the target → zero subtasks
 *
 * Honest subsampling inherited from Prompt 41: workers may report
 * inconclusive_tiny_sample if the target niche's feedback pool is
 * too small. Finalizer handles that correctly.
 */

import type { CoordinatorHandler, Subtask } from '../types'
import {
  loadFeedbackForDiscovery,
  loadActiveFeatureList,
  runFeatureDiscoveryExperiment,
  type FeedbackRow,
  type FeatureDiscoveryExperimentResult,
} from '@/lib/training/trainer-engine'
import {
  findTransferCandidates,
  type TransferCandidate,
} from '@/lib/training/cross-niche-miner'
import { pickThinnestNiche } from '@/lib/memory/agency-niches'

interface WorkerConfig {
  worker_label: string
  target_niche: string
  candidate: TransferCandidate
  features: string[]
  skip_reason: string | null
}

interface BreakdownMeta {
  target_niche: string | null
  target_source: 'param' | 'agency_thinnest' | 'none'
  agency_id: string | null
  agency_row_count?: number
  adjacent_niches_count: number
  candidates_seen: number
  candidates_dispatched: number
  feedback_rows: number
  base_features_count: number
  note?: string
}

export const crossNicheTransferHandler: CoordinatorHandler = {
  async breakdown(params, db) {
    const topN = typeof params.top_n === 'number' ? params.top_n : 3
    const paramNiche = typeof params.target_niche === 'string' ? params.target_niche : null
    const paramAgency = typeof params.target_agency_id === 'string' ? params.target_agency_id : null

    // 1. Resolve target niche.
    let targetNiche: string | null = null
    let targetSource: BreakdownMeta['target_source'] = 'none'
    let agencyRowCount: number | undefined

    if (paramNiche) {
      targetNiche = paramNiche
      targetSource = 'param'
    } else if (paramAgency) {
      const picked = await pickThinnestNiche(db, paramAgency)
      if (picked) {
        targetNiche = picked.niche
        targetSource = 'agency_thinnest'
        agencyRowCount = picked.row_count
      }
    }

    if (!targetNiche) {
      const meta: BreakdownMeta = {
        target_niche: null,
        target_source: 'none',
        agency_id: paramAgency,
        adjacent_niches_count: 0,
        candidates_seen: 0,
        candidates_dispatched: 0,
        feedback_rows: 0,
        base_features_count: 0,
        note: 'no_target_niche_resolvable — pass target_niche or target_agency_id with at least one member',
      }
      return { subtasks: [], meta: meta as unknown as Record<string, unknown> }
    }

    // 2. Find transfer candidates.
    const candidates = await findTransferCandidates(db, targetNiche, topN)

    // Count distinct adjacent niches regardless of whether they had
    // features (for honest meta).
    const { data: adjRows } = await db
      .from('niche_adjacency')
      .select('niche_b')
      .eq('niche_a', targetNiche)
    const adjacentNichesCount = (adjRows || []).length

    // 3. Load shared context (feedback + base features) once.
    const { clean: feedbackRows } = await loadFeedbackForDiscovery(db)
    const baseFeatures = await loadActiveFeatureList(db)

    // 4. Build worker configs for each candidate.
    const configs: WorkerConfig[] = candidates.map((c, i) => ({
      worker_label: `transfer_${i + 1}_${c.feature_name}_from_${c.source_niche}`,
      target_niche: targetNiche!,
      candidate: c,
      features: [...baseFeatures, c.feature_name],
      skip_reason: baseFeatures.length === 0 ? 'empty_feature_list' : null,
    }))

    const subtasks: Subtask[] = configs.map((cfg) => ({
      label: cfg.worker_label,
      params: {
        config: cfg as unknown as Record<string, unknown>,
        feedback_rows: feedbackRows as unknown as Record<string, unknown>[],
      },
    }))

    const meta: BreakdownMeta = {
      target_niche: targetNiche,
      target_source: targetSource,
      agency_id: paramAgency,
      agency_row_count: agencyRowCount,
      adjacent_niches_count: adjacentNichesCount,
      candidates_seen: candidates.length,
      candidates_dispatched: subtasks.length,
      feedback_rows: feedbackRows.length,
      base_features_count: baseFeatures.length,
      ...(subtasks.length === 0
        ? {
            note:
              adjacentNichesCount === 0
                ? 'no_adjacent_niches_in_category'
                : candidates.length === 0
                ? 'no_top_features_in_adjacent_niches — training_experiments may have no niche_scope populated yet'
                : 'all_candidates_already_tested_in_target',
          }
        : {}),
    }

    return { subtasks, meta: meta as unknown as Record<string, unknown> }
  },

  async runSubtask(subtaskParams, db) {
    const cfg = subtaskParams.config as unknown as WorkerConfig
    const feedbackRows = subtaskParams.feedback_rows as unknown as FeedbackRow[]

    if (cfg.skip_reason) {
      const skipped: FeatureDiscoveryExperimentResult & {
        target_niche: string
        source_niche: string
      } = {
        experiment_id: '',
        worker_label: cfg.worker_label,
        experiment_type: 'feature_add',
        validation_spearman: 0,
        baseline_spearman: 0,
        delta: 0,
        n_evaluated: 0,
        validation_set_size: 0,
        total_feedback_rows: feedbackRows.length,
        result: 'skipped',
        candidate_feature_id: null,
        skipped_reason: cfg.skip_reason,
        target_niche: cfg.target_niche,
        source_niche: cfg.candidate.source_niche,
      }
      return skipped
    }

    const description =
      `Cross-niche transfer: testing "${cfg.candidate.feature_name}" in "${cfg.target_niche}" ` +
      `(source "${cfg.candidate.source_niche}", source delta ${cfg.candidate.source_total_delta.toFixed(4)}, ` +
      `category "${cfg.candidate.shared_category}")`

    const result = await runFeatureDiscoveryExperiment(db, {
      workerLabel: cfg.worker_label,
      description,
      experimentType: 'feature_add',
      features: cfg.features,
      hyperparams: {},
      feedbackRows,
      programId: null,
      // Note: cross_niche_patterns are separate from candidate_features —
      // we intentionally do NOT pass a candidateFeatureId. The finalizer
      // writes directly to cross_niche_patterns based on worker result.
      candidateFeatureId: null,
    })

    // Attach transfer-specific context so the finalizer can upsert
    // the cross_niche_patterns row without re-looking-up the subtask.
    const enriched = {
      ...result,
      target_niche: cfg.target_niche,
      source_niche: cfg.candidate.source_niche,
      source_total_delta: cfg.candidate.source_total_delta,
      source_experiment_id: cfg.candidate.source_experiment_id,
      shared_category: cfg.candidate.shared_category,
      feature_name: cfg.candidate.feature_name,
    }
    return enriched
  },
}
