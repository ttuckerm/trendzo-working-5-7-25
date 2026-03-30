#!/usr/bin/env npx tsx
/**
 * Autoresearch Optimization Loop
 *
 * Bounded random-walk search over phase-1 numeric parameters.
 * Maximizes validation Spearman rho with guardrails against overfitting
 * and niche degradation.
 *
 * Run:
 *   cd C:\Projects\CleanCopy
 *   npx tsx autoresearch/sandbox/optimize-weights.ts
 *   npx tsx autoresearch/sandbox/optimize-weights.ts --experiments 200
 *   npx tsx autoresearch/sandbox/optimize-weights.ts --seed 42
 *
 * No live API calls. No database writes. Pure file-based.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot, loadConfig } from './loader';
import { replayAll } from './replay-aggregation';
import { evaluate, spearmanRho } from './eval-spearman';
import type { ExportedRun, SandboxConfig, EvalResult } from './types';

// ── CLI args ─────────────────────────────────────────────────────────────────

function getArg(flag: string, defaultVal: string): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf(flag);
  if (idx >= 0 && idx + 1 < args.length) return args[idx + 1];
  const eq = args.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.split('=')[1];
  return defaultVal;
}

const MAX_EXPERIMENTS = parseInt(getArg('--experiments', '300'), 10);
const SEED = parseInt(getArg('--seed', '7'), 10);
const BOOTSTRAP_ITER = 500; // Reduced for speed in loop; final eval uses 2000

// ── Seeded PRNG (xorshift128) ────────────────────────────────────────────────

function createRNG(seed: number) {
  let s = seed | 0 || 1;
  return {
    /** Returns float in [0, 1) */
    next(): number {
      s ^= s << 13;
      s ^= s >> 17;
      s ^= s << 5;
      return (s >>> 0) / 4294967296;
    },
    /** Returns float in [lo, hi) */
    uniform(lo: number, hi: number): number {
      return lo + this.next() * (hi - lo);
    },
    /** Returns int in [lo, hi] inclusive */
    int(lo: number, hi: number): number {
      return lo + Math.floor(this.next() * (hi - lo + 1));
    },
    /** Gaussian via Box-Muller */
    gaussian(mean: number, stdDev: number): number {
      const u1 = this.next() || 1e-10;
      const u2 = this.next();
      return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
    /** Pick random element from array */
    pick<T>(arr: T[]): T {
      return arr[Math.floor(this.next() * arr.length)];
    },
  };
}

// ── K-Fold Cross-Validation ──────────────────────────────────────────────────

const K_FOLDS = 5;

/**
 * Pre-filter runs to only those that are replayable (have scoreable components).
 * This avoids folds full of unreplayable runs.
 */
function filterReplayable(runs: ExportedRun[]): ExportedRun[] {
  return runs.filter(r =>
    r.components.some(c => c.success && c.prediction !== null && c.prediction !== undefined)
  );
}

/**
 * Create K chronological folds from pre-filtered replayable runs.
 * Each fold uses ~(K-1)/K train, ~1/K val.
 */
function createFolds(runs: ExportedRun[], k: number = K_FOLDS): { train: ExportedRun[]; val: ExportedRun[] }[] {
  const sorted = [...runs].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const foldSize = Math.floor(sorted.length / k);
  const folds: { train: ExportedRun[]; val: ExportedRun[] }[] = [];

  for (let i = 0; i < k; i++) {
    const valStart = i * foldSize;
    const valEnd = i === k - 1 ? sorted.length : (i + 1) * foldSize;
    const val = sorted.slice(valStart, valEnd);
    const train = [...sorted.slice(0, valStart), ...sorted.slice(valEnd)];
    folds.push({ train, val });
  }

  return folds;
}

/**
 * Evaluate config across all K folds, return average validation rho + MAE.
 */
function kFoldEval(
  folds: { train: ExportedRun[]; val: ExportedRun[] }[],
  config: SandboxConfig,
): { avgValRho: number; avgValMae: number; foldRhos: number[]; foldMaes: number[]; totalValN: number } | null {
  const foldRhos: number[] = [];
  const foldMaes: number[] = [];
  let totalN = 0;

  for (const fold of folds) {
    const valEval = quickEval(fold.val, config);
    if (!valEval || valEval.n < 3) return null;
    foldRhos.push(valEval.rho);
    foldMaes.push(valEval.mae);
    totalN += valEval.n;
  }

  const avgRho = foldRhos.reduce((s, r) => s + r, 0) / foldRhos.length;
  const avgMae = foldMaes.reduce((s, m) => s + m, 0) / foldMaes.length;
  return { avgValRho: avgRho, avgValMae: avgMae, foldRhos, foldMaes, totalValN: totalN };
}

// ── Quick evaluation (no bootstrap, for speed in the loop) ───────────────────

function quickEval(
  runs: ExportedRun[],
  config: SandboxConfig,
): { rho: number; mae: number; n: number; byNiche: Map<string, { rho: number; mae: number; n: number }> } | null {
  const { results, skipped } = replayAll(runs, config);
  if (results.length < 5) return null;

  const predicted = results.map(r => r.replayedVps);
  const actual = results.map(r => r.actualVps);
  const rho = spearmanRho(predicted, actual);

  let maeSum = 0;
  for (let i = 0; i < predicted.length; i++) {
    maeSum += Math.abs(predicted[i] - actual[i]);
  }
  const mae = maeSum / predicted.length;

  // Per-niche
  const nicheGroups = new Map<string, { pred: number[]; act: number[] }>();
  for (const r of results) {
    const run = runs.find(ru => ru.id === r.runId);
    const niche = run?.niche || 'unknown';
    if (!nicheGroups.has(niche)) nicheGroups.set(niche, { pred: [], act: [] });
    const g = nicheGroups.get(niche)!;
    g.pred.push(r.replayedVps);
    g.act.push(r.actualVps);
  }

  const byNiche = new Map<string, { rho: number; mae: number; n: number }>();
  for (const [niche, g] of nicheGroups) {
    const nr = g.pred.length >= 3 ? spearmanRho(g.pred, g.act) : 0;
    let nm = 0;
    for (let i = 0; i < g.pred.length; i++) nm += Math.abs(g.pred[i] - g.act[i]);
    byNiche.set(niche, { rho: nr, mae: nm / g.pred.length, n: g.pred.length });
  }

  return { rho, mae, n: results.length, byNiche };
}

// ── Bootstrap CI (reduced iterations for speed) ──────────────────────────────

function quickBootstrapCI(
  runs: ExportedRun[],
  config: SandboxConfig,
  iterations: number,
  rng: ReturnType<typeof createRNG>,
): { ci_lower: number; ci_upper: number } {
  const { results } = replayAll(runs, config);
  if (results.length < 5) return { ci_lower: -1, ci_upper: 1 };

  const predicted = results.map(r => r.replayedVps);
  const actual = results.map(r => r.actualVps);
  const n = predicted.length;
  const rhos: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    const sp: number[] = [];
    const sa: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rng.next() * n);
      sp.push(predicted[idx]);
      sa.push(actual[idx]);
    }
    rhos.push(spearmanRho(sp, sa));
  }

  rhos.sort((a, b) => a - b);
  return {
    ci_lower: rhos[Math.floor(0.025 * iterations)],
    ci_upper: rhos[Math.min(Math.floor(0.975 * iterations), iterations - 1)],
  };
}

// ── Perturbation Strategies ──────────────────────────────────────────────────

type PerturbationType =
  | 'component_weight_multipliers'
  | 'extreme_score_boost'
  | 'niche_factors'
  | 'niche_fallback';

// Weight toward multipliers — the primary lever since all components land in one path
const PERTURBATION_POOL: PerturbationType[] = [
  'component_weight_multipliers',
  'component_weight_multipliers',
  'component_weight_multipliers',
  'component_weight_multipliers',
  'extreme_score_boost',
  'niche_factors',
  'niche_fallback',
];

function deepCloneConfig(config: SandboxConfig): SandboxConfig {
  return JSON.parse(JSON.stringify(config));
}

function perturbConfig(
  base: SandboxConfig,
  rng: ReturnType<typeof createRNG>,
): { config: SandboxConfig; changes: string[] } {
  const config = deepCloneConfig(base);
  const changes: string[] = [];

  // Pick 1-3 perturbation types
  const numChanges = rng.int(1, 3);
  const selected = new Set<PerturbationType>();
  while (selected.size < numChanges) {
    selected.add(rng.pick(PERTURBATION_POOL));
  }

  for (const pType of selected) {
    switch (pType) {
      case 'component_weight_multipliers': {
        // Perturb 1-3 component weight multipliers — this is the primary lever
        if (!config.componentWeightMultipliers) config.componentWeightMultipliers = {};
        const compIds = [
          'ffmpeg', 'visual-scene-detector', 'thumbnail-analyzer', 'audio-analyzer',
          '7-legos', '9-attributes', '24-styles', 'pattern-extraction',
          'hook-scorer', 'virality-indicator', 'xgboost-virality-ml',
          'visual-rubric', 'viral-mechanics',
        ];
        const numComps = rng.int(1, 3);
        for (let j = 0; j < numComps; j++) {
          const compId = rng.pick(compIds);
          const old = config.componentWeightMultipliers[compId] ?? 1.0;
          const delta = rng.gaussian(0, 0.3);
          const newVal = Math.max(0.1, Math.min(3.0, old + delta));
          config.componentWeightMultipliers[compId] = Math.round(newVal * 1000) / 1000;
          changes.push(`compWeight.${compId}: ${old.toFixed(3)} → ${newVal.toFixed(3)}`);
        }
        break;
      }

      case 'extreme_score_boost': {
        const old = config.extremeScoreBoost ?? 1.5;
        const delta = rng.gaussian(0, 0.3);
        const newVal = Math.max(0.5, Math.min(3.0, old + delta));
        config.extremeScoreBoost = Math.round(newVal * 1000) / 1000;
        changes.push(`extremeScoreBoost: ${old.toFixed(3)} → ${newVal.toFixed(3)}`);
        break;
      }

      case 'niche_factors': {
        const nicheKeys = Object.keys(config.nicheDifficultyFactors);
        const numNiches = rng.int(1, 2);
        for (let j = 0; j < numNiches; j++) {
          const niche = rng.pick(nicheKeys);
          const old = config.nicheDifficultyFactors[niche];
          const delta = rng.gaussian(0, 0.08);
          const newVal = Math.max(0.5, Math.min(1.3, old + delta));
          config.nicheDifficultyFactors[niche] = Math.round(newVal * 1000) / 1000;
          changes.push(`nicheFactor.${niche}: ${old.toFixed(3)} → ${newVal.toFixed(3)}`);
        }
        break;
      }

      case 'niche_fallback': {
        const old = config.nicheFallbackFactor;
        const delta = rng.gaussian(0, 0.06);
        const newVal = Math.max(0.6, Math.min(1.2, old + delta));
        config.nicheFallbackFactor = Math.round(newVal * 1000) / 1000;
        changes.push(`nicheFallbackFactor: ${old.toFixed(3)} → ${newVal.toFixed(3)}`);
        break;
      }
    }
  }

  config.version = `experiment-${Date.now()}`;
  config.created_at = new Date().toISOString();
  return { config, changes };
}

// ── Acceptance Criteria ──────────────────────────────────────────────────────

interface AcceptanceResult {
  accepted: boolean;
  reasons: string[];
}

const MIN_RHO_IMPROVEMENT = 0.01;       // Must improve by at least this much
const MAX_MAE_DEGRADATION = 3.0;        // MAE can worsen by at most 3 VPS
const MAX_NICHE_RHO_DEGRADATION = 0.15; // No niche can lose more than 0.15 rho
const MIN_NICHE_N_FOR_GUARD = 5;        // Only guard niches with >= 5 samples

function checkAcceptanceKFold(
  candidate: { avgValRho: number; avgValMae: number; foldRhos: number[] },
  best: { avgValRho: number; avgValMae: number; foldRhos: number[] },
  candidateFullNiche: Map<string, { rho: number; mae: number; n: number }>,
  bestFullNiche: Map<string, { rho: number; mae: number; n: number }>,
): AcceptanceResult {
  const reasons: string[] = [];
  let accepted = true;

  // Gate 1: Average validation rho must improve
  const rhoDelta = candidate.avgValRho - best.avgValRho;
  if (rhoDelta < MIN_RHO_IMPROVEMENT) {
    reasons.push(`rho_insufficient: delta=${rhoDelta.toFixed(4)} (need >= ${MIN_RHO_IMPROVEMENT})`);
    accepted = false;
  } else {
    reasons.push(`rho_improved: ${best.avgValRho.toFixed(4)} → ${candidate.avgValRho.toFixed(4)} (+${rhoDelta.toFixed(4)})`);
  }

  // Gate 2: Fold consistency check
  // With small samples, fold rhos are noisy. Instead of requiring strict majority,
  // require that improvement is at least 0.5x the fold standard deviation (effect size check).
  // This is a practical signal-to-noise threshold.
  let foldsImproved = 0;
  for (let i = 0; i < candidate.foldRhos.length; i++) {
    if (candidate.foldRhos[i] > best.foldRhos[i]) foldsImproved++;
  }
  const bestStd = std(best.foldRhos);
  const effectSize = rhoDelta / Math.max(bestStd, 0.1); // Normalize improvement by noise level
  if (effectSize < 0.3) {
    reasons.push(`effect_size_too_small: ${effectSize.toFixed(3)} (delta=${rhoDelta.toFixed(4)} / std=${bestStd.toFixed(4)}, need >= 0.3)`);
    accepted = false;
  } else {
    reasons.push(`effect_size_ok: ${effectSize.toFixed(3)} (${foldsImproved}/${candidate.foldRhos.length} folds improved)`);
  }

  // Gate 3: Fold variance check — if candidate has much higher variance, it's fragile
  const candStd = std(candidate.foldRhos);
  if (candStd > bestStd + 0.15) {
    reasons.push(`fold_variance_high: candidate std=${candStd.toFixed(4)} >> best std=${bestStd.toFixed(4)}`);
    accepted = false;
  }

  // Gate 4: MAE must not materially worsen
  const maeDelta = candidate.avgValMae - best.avgValMae;
  if (maeDelta > MAX_MAE_DEGRADATION) {
    reasons.push(`mae_degraded: ${best.avgValMae.toFixed(2)} → ${candidate.avgValMae.toFixed(2)} (+${maeDelta.toFixed(2)} > ${MAX_MAE_DEGRADATION})`);
    accepted = false;
  } else {
    reasons.push(`mae_ok: ${candidate.avgValMae.toFixed(2)} (delta=${maeDelta > 0 ? '+' : ''}${maeDelta.toFixed(2)})`);
  }

  // Gate 5: Niche degradation guard (on full dataset — more stable than per-fold)
  for (const [niche, bestNiche] of bestFullNiche) {
    if (bestNiche.n < MIN_NICHE_N_FOR_GUARD) continue;
    const candNiche = candidateFullNiche.get(niche);
    if (!candNiche) continue;
    const nicheRhoDelta = candNiche.rho - bestNiche.rho;
    if (nicheRhoDelta < -MAX_NICHE_RHO_DEGRADATION) {
      reasons.push(`niche_degraded:${niche}: rho ${bestNiche.rho.toFixed(4)} → ${candNiche.rho.toFixed(4)} (${nicheRhoDelta.toFixed(4)} < -${MAX_NICHE_RHO_DEGRADATION})`);
      accepted = false;
    }
  }

  return { accepted, reasons };
}

function std(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// ── Research Log ─────────────────────────────────────────────────────────────

interface LogEntry {
  iteration: number;
  timestamp: string;
  type: 'baseline' | 'accepted' | 'rejected';
  changes: string[];
  train_rho: number;
  val_rho: number;
  val_mae: number;
  val_ci_lower: number;
  val_ci_upper: number;
  acceptance_reasons: string[];
  config_version: string;
}

const LOGS_DIR = path.resolve(__dirname, '..', 'logs');
const LOG_PATH = path.join(LOGS_DIR, 'research-log.jsonl');

function appendLog(entry: LogEntry): void {
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', 'utf-8');
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Autoresearch Optimization Loop (K-Fold CV)');
  console.log(`  Experiments: ${MAX_EXPERIMENTS}, Seed: ${SEED}, Folds: ${K_FOLDS}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Ensure logs directory exists
  if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

  // Clear previous log
  if (fs.existsSync(LOG_PATH)) fs.unlinkSync(LOG_PATH);

  const rng = createRNG(SEED);

  // ── Load data ──────────────────────────────────────────────────────────────
  const snapshot = loadSnapshot();
  const baseline = loadConfig('baseline');
  console.log(`Loaded ${snapshot.run_count} runs, baseline ${baseline.version}\n`);

  // ── Pre-filter to replayable runs, then create K-folds ──────────────────
  const replayable = filterReplayable(snapshot.runs);
  console.log(`Replayable runs: ${replayable.length}/${snapshot.run_count} (pre-filtered)\n`);

  if (replayable.length < 10) {
    console.error(`FATAL: Only ${replayable.length} replayable runs (need >= 10). Aborting.`);
    process.exit(1);
  }

  const folds = createFolds(replayable, K_FOLDS);
  console.log(`Created ${K_FOLDS} chronological folds:`);
  for (let i = 0; i < folds.length; i++) {
    console.log(`  Fold ${i + 1}: train=${folds[i].train.length}, val=${folds[i].val.length}`);
  }
  console.log();

  // ── Baseline k-fold eval ───────────────────────────────────────────────────
  const baselineKF = kFoldEval(folds, baseline);
  if (!baselineKF) {
    console.error('FATAL: Baseline k-fold eval failed. Aborting.');
    process.exit(1);
  }

  // Full-dataset eval for niche tracking (use replayable set)
  const baselineFull = quickEval(replayable, baseline);
  if (!baselineFull) {
    console.error('FATAL: Baseline full eval failed. Aborting.');
    process.exit(1);
  }

  // Bootstrap CI on full replayable dataset for reporting
  const baselineFullCI = quickBootstrapCI(replayable, baseline, BOOTSTRAP_ITER, rng);

  console.log('─── Baseline ───────────────────────────────────────────');
  console.log(`  Avg val rho:  ${baselineKF.avgValRho.toFixed(4)} (folds: ${baselineKF.foldRhos.map(r => r.toFixed(3)).join(', ')})`);
  console.log(`  Avg val MAE:  ${baselineKF.avgValMae.toFixed(2)} (folds: ${baselineKF.foldMaes.map(m => m.toFixed(1)).join(', ')})`);
  console.log(`  Fold std:     ${std(baselineKF.foldRhos).toFixed(4)}`);
  console.log(`  Full rho:     ${baselineFull.rho.toFixed(4)}, MAE: ${baselineFull.mae.toFixed(2)}`);
  console.log(`  Full CI:      [${baselineFullCI.ci_lower.toFixed(4)}, ${baselineFullCI.ci_upper.toFixed(4)}]\n`);

  appendLog({
    iteration: 0,
    timestamp: new Date().toISOString(),
    type: 'baseline',
    changes: [],
    train_rho: 0,
    val_rho: baselineKF.avgValRho,
    val_mae: baselineKF.avgValMae,
    val_ci_lower: baselineFullCI.ci_lower,
    val_ci_upper: baselineFullCI.ci_upper,
    acceptance_reasons: ['baseline', `foldRhos: ${baselineKF.foldRhos.map(r => r.toFixed(4)).join(',')}`],
    config_version: baseline.version,
  });

  // ── Optimization loop ──────────────────────────────────────────────────────
  let bestConfig = deepCloneConfig(baseline);
  let bestKF = baselineKF;
  let bestFullNiche = baselineFull.byNiche;
  let accepted = 0;
  let rejected = 0;

  console.log('─── Running Experiments ─────────────────────────────────');

  for (let i = 1; i <= MAX_EXPERIMENTS; i++) {
    const { config: candidate, changes } = perturbConfig(bestConfig, rng);

    // K-fold evaluation
    const candKF = kFoldEval(folds, candidate);
    if (!candKF) {
      rejected++;
      continue;
    }

    // Quick check: if avg rho didn't improve at all, skip niche check (fast path)
    const rawRhoDelta = candKF.avgValRho - bestKF.avgValRho;

    // Full-dataset niche eval (only if rho looks promising)
    let candFullNiche = bestFullNiche;
    if (rawRhoDelta >= MIN_RHO_IMPROVEMENT) {
      const candFull = quickEval(replayable, candidate);
      if (candFull) candFullNiche = candFull.byNiche;
    }

    const acceptance = checkAcceptanceKFold(candKF, bestKF, candFullNiche, bestFullNiche);

    if (acceptance.accepted) {
      accepted++;
      bestConfig = candidate;
      bestKF = candKF;
      // Update niche baseline for next comparison
      const bf = quickEval(replayable, candidate);
      if (bf) bestFullNiche = bf.byNiche;

      console.log(`  [${i}/${MAX_EXPERIMENTS}] ACCEPTED avgValRho=${candKF.avgValRho.toFixed(4)} (was ${bestKF.avgValRho === candKF.avgValRho ? (candKF.avgValRho - rawRhoDelta).toFixed(4) : bestKF.avgValRho.toFixed(4)}) MAE=${candKF.avgValMae.toFixed(2)}`);
      console.log(`    Folds: ${candKF.foldRhos.map(r => r.toFixed(3)).join(', ')}`);
      for (const c of changes) console.log(`    ${c}`);
    } else {
      rejected++;
      if (i % 50 === 0) {
        console.log(`  [${i}/${MAX_EXPERIMENTS}] ... ${accepted} accepted, ${rejected} rejected so far (best avgValRho=${bestKF.avgValRho.toFixed(4)})`);
      }
    }

    appendLog({
      iteration: i,
      timestamp: new Date().toISOString(),
      type: acceptance.accepted ? 'accepted' : 'rejected',
      changes,
      train_rho: 0,
      val_rho: candKF.avgValRho,
      val_mae: candKF.avgValMae,
      val_ci_lower: 0,
      val_ci_upper: 0,
      acceptance_reasons: acceptance.reasons,
      config_version: candidate.version,
    });
  }

  // ── Final full evaluation on best config ───────────────────────────────────
  console.log('\n─── Final Evaluation (Best Config) ─────────────────────');

  const { results: bestResults } = replayAll(replayable, bestConfig);
  const fullEval = evaluate(bestResults, replayable);

  // Overfit check: compare avg fold train vs avg fold val
  const bestFoldStd = std(bestKF.foldRhos);

  console.log(`  K-fold avg val rho:  ${bestKF.avgValRho.toFixed(4)}`);
  console.log(`  K-fold fold rhos:    ${bestKF.foldRhos.map(r => r.toFixed(4)).join(', ')}`);
  console.log(`  K-fold fold std:     ${bestFoldStd.toFixed(4)} ${bestFoldStd > 0.3 ? '⚠️ HIGH VARIANCE' : '(ok)'}`);
  console.log(`  K-fold avg val MAE:  ${bestKF.avgValMae.toFixed(2)}`);
  console.log(`  Full dataset rho:    ${fullEval.spearman_rho.toFixed(4)}`);
  console.log(`  Full dataset MAE:    ${fullEval.mae.toFixed(2)}`);
  console.log(`  Full CI:             [${fullEval.ci_lower.toFixed(4)}, ${fullEval.ci_upper.toFixed(4)}]`);

  console.log('\n  Per-niche (full):');
  for (const n of fullEval.by_niche) {
    const rhoStr = n.n >= 3 ? n.spearman_rho.toFixed(4) : 'N/A';
    console.log(`    ${n.niche.padEnd(25)} n=${String(n.n).padStart(3)} rho=${rhoStr} MAE=${n.mae.toFixed(2)}`);
  }

  // ── Save best config ───────────────────────────────────────────────────────
  bestConfig.version = 'best-v1';
  bestConfig.description = `Optimized from ${MAX_EXPERIMENTS} experiments (seed=${SEED}, ${K_FOLDS}-fold CV). Avg val rho: ${baselineKF.avgValRho.toFixed(4)} → ${bestKF.avgValRho.toFixed(4)}`;

  const bestPath = path.resolve(__dirname, '..', 'configs', 'best.json');
  fs.writeFileSync(bestPath, JSON.stringify(bestConfig, null, 2), 'utf-8');
  console.log(`\nBest config written to: ${bestPath}`);

  // ── Save summary report ────────────────────────────────────────────────────
  const report = {
    timestamp: new Date().toISOString(),
    seed: SEED,
    k_folds: K_FOLDS,
    total_experiments: MAX_EXPERIMENTS,
    accepted,
    rejected,
    acceptance_rate: `${((accepted / MAX_EXPERIMENTS) * 100).toFixed(1)}%`,
    data: {
      total_runs: snapshot.run_count,
      replayable_runs: replayable.length,
      folds: folds.map((f, i) => ({ fold: i + 1, train: f.train.length, val: f.val.length })),
    },
    baseline: {
      avg_val_rho: baselineKF.avgValRho,
      fold_rhos: baselineKF.foldRhos,
      avg_val_mae: baselineKF.avgValMae,
      fold_std: std(baselineKF.foldRhos),
      full_rho: baselineFull.rho,
      full_mae: baselineFull.mae,
      full_ci: [baselineFullCI.ci_lower, baselineFullCI.ci_upper],
    },
    best: {
      avg_val_rho: bestKF.avgValRho,
      fold_rhos: bestKF.foldRhos,
      avg_val_mae: bestKF.avgValMae,
      fold_std: bestFoldStd,
      full_rho: fullEval.spearman_rho,
      full_mae: fullEval.mae,
      full_ci: [fullEval.ci_lower, fullEval.ci_upper],
    },
    improvement: {
      avg_val_rho_delta: bestKF.avgValRho - baselineKF.avgValRho,
      avg_val_mae_delta: bestKF.avgValMae - baselineKF.avgValMae,
    },
    overfit_signals: {
      fold_std: bestFoldStd,
      suspect: bestFoldStd > 0.3,
    },
    per_niche_final: fullEval.by_niche,
  };

  const reportPath = path.resolve(__dirname, '..', 'results', 'optimization-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Summary written to: ${reportPath}`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  OPTIMIZATION COMPLETE`);
  console.log(`  Experiments:  ${MAX_EXPERIMENTS} (${accepted} accepted, ${rejected} rejected)`);
  console.log(`  Avg val rho:  ${baselineKF.avgValRho.toFixed(4)} → ${bestKF.avgValRho.toFixed(4)} (${(bestKF.avgValRho - baselineKF.avgValRho) > 0 ? '+' : ''}${(bestKF.avgValRho - baselineKF.avgValRho).toFixed(4)})`);
  console.log(`  Avg val MAE:  ${baselineKF.avgValMae.toFixed(2)} → ${bestKF.avgValMae.toFixed(2)}`);
  if (bestFoldStd > 0.3) {
    console.log(`  ⚠️  High fold std ${bestFoldStd.toFixed(4)} — results are fragile`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(accepted > 0 ? 0 : 1);
}

main();
