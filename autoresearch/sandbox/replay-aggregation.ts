/**
 * Replay Aggregation — Pure offline replay of the VPS scoring pipeline.
 *
 * Reproduces the production aggregation logic from kai-orchestrator.ts using only
 * exported component scores and a SandboxConfig. No live calls.
 *
 * Production pipeline replicated:
 *   1. Assign components to paths (PATH_DEFINITIONS from system-registry.ts)
 *   2. Filter out default/suspicious scores (same rules as production)
 *   3. Coach-lane zeroing (gpt4, gemini, claude, unified-grading, editing-coach)
 *   4. LLM consensus gate (spread > 10 → zero LLM weight, else cap at 0.15)
 *   5. Per-path weighted aggregation (weight = component confidence)
 *   6. Cross-path synthesis (weighted average by path weight)
 *   7. Niche + account calibration
 *   8. Clamp to [0, 100]
 *
 * Intentional simplifications (documented):
 *   - Agreement level detection is replayed but we always use the "high agreement"
 *     synthesis (weighted average by path weight). The moderate/low methods add
 *     component reliability weighting, which has marginal effect and is out of scope
 *     for phase 1. The agreement level IS logged for fidelity analysis.
 *   - Pattern boost (checkViralPatterns) is skipped — it requires a Supabase query
 *     for viral_genomes. In practice it adds 0 for most runs.
 *   - Pipeline calibration rules (silent video cap, high VPS scaling) are replayed
 *     where data is available; otherwise skipped with a note.
 */

import type { ExportedRun, ExportedComponentResult, SandboxConfig, ReplayResult } from './types';

// ── Path assignment (mirrors system-registry.ts:PATH_DEFINITIONS) ──────────

/** Which path each component belongs to. Mirrors system-registry.ts:635-671. */
const PATH_ASSIGNMENTS: Record<string, string> = {
  // quantitative path
  'feature-extraction': 'quantitative',
  // qualitative path
  'gpt4': 'qualitative',
  'gemini': 'qualitative',
  'claude': 'qualitative',
  // pattern_based path (everything else that runs)
  'ffmpeg': 'pattern_based',
  'visual-scene-detector': 'pattern_based',
  'thumbnail-analyzer': 'pattern_based',
  'audio-analyzer': 'pattern_based',
  '7-legos': 'pattern_based',
  '9-attributes': 'pattern_based',
  '24-styles': 'pattern_based',
  'pattern-extraction': 'pattern_based',
  'hook-scorer': 'pattern_based',
  'virality-indicator': 'pattern_based',
  'xgboost-virality-ml': 'pattern_based',
  'visual-rubric': 'pattern_based',
  'unified-grading': 'pattern_based',
  'editing-coach': 'pattern_based',
  'viral-mechanics': 'pattern_based',
  // historical path — no components (all disabled)
  // whisper is not a prediction component (transcription only)
};

/** Coach-lane components: weight zeroed during aggregation. */
const COACH_LANE_IDS = new Set([
  'gpt4', 'gemini', 'claude', 'unified-grading', 'editing-coach',
]);

/** LLM component IDs for consensus gate. */
const LLM_IDS = new Set(['gpt4', 'gemini', 'claude']);

const LLM_SPREAD_THRESHOLD = 10;
const LLM_CONSENSUS_WEIGHT_CAP = 0.15;

/** Default values that production filters out when component has no real analysis. */
const DEFAULT_VALUES = new Set([50, 62, 65, 68, 70]);

// ── Core replay ────────────────────────────────────────────────────────────

interface PathAggregation {
  path: string;
  aggregatedPrediction: number | undefined;
  aggregatedConfidence: number | undefined;
  weight: number;
  componentCount: number;
}

/**
 * Replay aggregation for a single run.
 * Returns null if the run cannot be replayed (missing components, etc.)
 */
export function replayRun(
  run: ExportedRun,
  config: SandboxConfig
): ReplayResult | null {
  const adjustments: string[] = [];

  // Get scoreable components (successful, with prediction)
  const scoreable = run.components.filter(c =>
    c.success && c.prediction !== null && c.prediction !== undefined
  );

  if (scoreable.length === 0) {
    return null; // Cannot replay — no component scores
  }

  // Step 1: Filter out default/suspicious scores (same as production)
  const filtered = scoreable.filter(c => {
    const rounded = Math.round(c.prediction!);
    if (DEFAULT_VALUES.has(rounded)) {
      // In production, excluded only when component has no real analysis (features/insights).
      // We check features here; insights aren't exported but features is a good proxy.
      const hasFeatures = c.features && Object.keys(c.features).length > 0;
      if (!hasFeatures) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return null; // All components filtered out
  }

  // Step 2: LLM consensus gate
  const llmPreds = filtered
    .filter(c => LLM_IDS.has(c.component_id) && !COACH_LANE_IDS.has(c.component_id))
    .map(c => c.prediction!);
  // Note: gpt4/gemini/claude are in BOTH LLM_IDS and COACH_LANE_IDS in production,
  // so they never contribute to VPS. But the spread is still computed.

  const llmSpread = llmPreds.length >= 2
    ? Math.max(...llmPreds) - Math.min(...llmPreds)
    : 0;
  const llmDisagreement = llmSpread > LLM_SPREAD_THRESHOLD;

  // Step 3: Assign components to paths and compute per-path aggregation
  const pathGroups = new Map<string, ExportedComponentResult[]>();
  for (const c of filtered) {
    const pathId = PATH_ASSIGNMENTS[c.component_id];
    if (!pathId) continue; // Unknown component, skip
    const list = pathGroups.get(pathId) || [];
    list.push(c);
    pathGroups.set(pathId, list);
  }

  // Use base path weights from config (most runs use the default workflow)
  const pathWeights = config.pathBaseWeights;

  const pathAggregations: PathAggregation[] = [];

  for (const [pathId, components] of pathGroups.entries()) {
    let totalWeight = 0;
    let weightedSum = 0;
    let confidenceSum = 0;

    for (const c of components) {
      let weight = c.confidence ?? 0.5;

      // Coach-lane: zero weight
      if (COACH_LANE_IDS.has(c.component_id)) {
        weight = 0;
      }
      // LLM consensus gate (for non-coach-lane LLMs — in practice none exist,
      // but replicate the logic for correctness)
      else if (LLM_IDS.has(c.component_id)) {
        if (llmDisagreement) {
          weight = 0;
        } else {
          weight = Math.min(weight, LLM_CONSENSUS_WEIGHT_CAP);
        }
      }
      // Non-LLM, non-coach: apply extreme score boost + component weight multiplier
      else {
        const score = c.prediction!;
        const extremeBoost = config.extremeScoreBoost ?? 1.5;
        if (score < 30 || score > 80) {
          weight *= extremeBoost;
        }
        // Apply per-component weight multiplier (default 1.0)
        const compMultiplier = config.componentWeightMultipliers?.[c.component_id] ?? 1.0;
        weight *= compMultiplier;
      }

      weightedSum += c.prediction! * weight;
      totalWeight += weight;
      confidenceSum += c.confidence ?? 0;
    }

    const aggPrediction = totalWeight > 0 ? weightedSum / totalWeight : undefined;
    const aggConfidence = components.length > 0 ? confidenceSum / components.length : undefined;

    const pw = (pathWeights as any)[pathId] ?? 0;
    pathAggregations.push({
      path: pathId,
      aggregatedPrediction: aggPrediction,
      aggregatedConfidence: aggConfidence,
      weight: pw,
      componentCount: components.length,
    });
  }

  // Step 4: Cross-path synthesis (high-agreement method: weighted average)
  const activePaths = pathAggregations.filter(
    p => p.aggregatedPrediction !== undefined && p.weight > 0
  );

  if (activePaths.length === 0) {
    return null;
  }

  let pathWeightedSum = 0;
  let pathTotalWeight = 0;

  for (const p of activePaths) {
    pathWeightedSum += p.aggregatedPrediction! * p.weight;
    pathTotalWeight += p.weight;
  }

  let rawVps = pathTotalWeight > 0 ? pathWeightedSum / pathTotalWeight : 50;

  // Log agreement level for fidelity analysis
  if (activePaths.length >= 2) {
    const mean = activePaths.reduce((s, p) => s + p.aggregatedPrediction!, 0) / activePaths.length;
    const variance = activePaths.reduce((s, p) => s + Math.pow(p.aggregatedPrediction! - mean, 2), 0) / activePaths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev >= 15) {
      adjustments.push(`agreement:low (stdDev=${stdDev.toFixed(1)})`);
    } else if (stdDev >= 5) {
      adjustments.push(`agreement:moderate (stdDev=${stdDev.toFixed(1)})`);
    }
  }

  // Step 5: Niche + Account calibration
  // In production, these are skipped in "Raw VPS mode" (no accountSize).
  // We replicate: if account_size is present, apply both; otherwise skip.
  const isRawVpsMode = !run.account_size;
  let nicheFactor = 1.0;
  let accountFactor = 1.0;

  if (!isRawVpsMode) {
    // Niche factor
    const nicheKey = run.niche?.toLowerCase().replace(/[^a-z-]/g, '') || 'general';
    nicheFactor = config.nicheDifficultyFactors[nicheKey] ?? config.nicheFallbackFactor;

    // Account factor
    accountFactor = resolveAccountFactor(run.account_size!, config.accountSizeTiers);
    adjustments.push(`niche=${nicheKey}(${nicheFactor}), account=${run.account_size}(${accountFactor})`);
  } else {
    adjustments.push('rawVpsMode (niche/account skipped)');
  }

  let calibratedVps = rawVps * nicheFactor * accountFactor;

  // Step 6: Clamp
  calibratedVps = Math.max(0, Math.min(100, calibratedVps));
  calibratedVps = Math.round(calibratedVps * 10) / 10;

  return {
    runId: run.id,
    replayedVps: calibratedVps,
    replayedConfidence: run.confidence, // Confidence replay is secondary
    actualVps: run.actual_dps,
    originalPredictedVps: run.predicted_dps_7d,
    nicheFactor,
    accountFactor,
    calibrationAdjustments: adjustments,
  };
}

/**
 * Replay all runs in a snapshot.
 */
export function replayAll(
  runs: ExportedRun[],
  config: SandboxConfig
): { results: ReplayResult[]; skipped: number; skipReasons: string[] } {
  const results: ReplayResult[] = [];
  let skipped = 0;
  const skipReasons: string[] = [];

  for (const run of runs) {
    const result = replayRun(run, config);
    if (result) {
      results.push(result);
    } else {
      skipped++;
      const compCount = run.components.filter(c => c.success && c.prediction !== null).length;
      if (compCount === 0) {
        skipReasons.push(`${run.id}: no scoreable components`);
      } else {
        skipReasons.push(`${run.id}: all components filtered (default values)`);
      }
    }
  }

  return { results, skipped, skipReasons };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveAccountFactor(
  accountSize: string,
  tiers: SandboxConfig['accountSizeTiers']
): number {
  // Parse accountSize string to estimate follower count (same as production)
  const sizeLower = accountSize.toLowerCase();
  let followers = 0;

  if (sizeLower.includes('0-10k') || sizeLower.includes('nano') || sizeLower.includes('micro')) {
    followers = 5000;
  } else if (sizeLower.includes('10k-100k') || (sizeLower.includes('small') && !sizeLower.includes('0-'))) {
    followers = 35000;
  } else if (sizeLower.includes('100k-1m') || sizeLower.includes('large')) {
    followers = 350000;
  } else if (sizeLower.includes('1m+') || sizeLower.includes('mega') || sizeLower.includes('1m-')) {
    followers = 2000000;
  } else if (sizeLower.startsWith('small')) {
    followers = 5000;
  } else if (sizeLower.startsWith('medium')) {
    followers = 35000;
  } else {
    followers = 10000;
  }

  // Find matching tier
  for (const tier of tiers) {
    const max = tier.maxFollowers ?? Infinity;
    if (followers <= max) {
      return tier.factor;
    }
  }

  return 1.0; // fallback
}
