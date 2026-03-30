/**
 * Offline Spearman Evaluation — No Supabase, no live calls.
 *
 * Computes:
 * - Spearman rank correlation (rho) between replayed VPS and actual VPS
 * - MAE (mean absolute error)
 * - Within-range percentage
 * - Per-niche breakdown
 * - Bootstrap 95% confidence interval for rho
 * - Hard validation gates
 */

import type { ReplayResult, EvalResult, ExportedRun } from './types';

// ── Validation gates ─────────────────────────────────────────────────────────

const MIN_RUNS_FOR_EVAL = 5;
const MIN_REPLAY_COVERAGE = 0.5; // At least 50% of runs must be replayable
const MAX_ACCEPTABLE_FIDELITY_MAE = 15; // Replay vs production MAE must be < 15 VPS
const BOOTSTRAP_ITERATIONS = 2000;

export interface ValidationResult {
  passed: boolean;
  gate: string;
  message: string;
}

export function validatePreConditions(
  totalRuns: number,
  replayedCount: number,
  skippedCount: number,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Gate 1: Minimum labeled rows
  if (totalRuns < MIN_RUNS_FOR_EVAL) {
    results.push({
      passed: false,
      gate: 'MIN_LABELED_ROWS',
      message: `Only ${totalRuns} labeled runs (need >= ${MIN_RUNS_FOR_EVAL}). Export more labeled data.`,
    });
  } else {
    results.push({
      passed: true,
      gate: 'MIN_LABELED_ROWS',
      message: `${totalRuns} labeled runs (>= ${MIN_RUNS_FOR_EVAL}).`,
    });
  }

  // Gate 2: Replay coverage
  const coverage = totalRuns > 0 ? replayedCount / totalRuns : 0;
  if (coverage < MIN_REPLAY_COVERAGE) {
    results.push({
      passed: false,
      gate: 'REPLAY_COVERAGE',
      message: `Only ${(coverage * 100).toFixed(0)}% of runs replayable (need >= ${MIN_REPLAY_COVERAGE * 100}%). ${skippedCount} runs skipped.`,
    });
  } else {
    results.push({
      passed: true,
      gate: 'REPLAY_COVERAGE',
      message: `${(coverage * 100).toFixed(0)}% replay coverage (${replayedCount}/${totalRuns}).`,
    });
  }

  return results;
}

export function validateFidelity(
  replayResults: ReplayResult[],
): ValidationResult {
  // Gate 3: Baseline fidelity — replay should approximate production
  const fidelityMAE = meanAbsoluteError(
    replayResults.map(r => r.replayedVps),
    replayResults.map(r => r.originalPredictedVps),
  );

  if (fidelityMAE > MAX_ACCEPTABLE_FIDELITY_MAE) {
    return {
      passed: false,
      gate: 'BASELINE_FIDELITY',
      message: `Replay-vs-production MAE = ${fidelityMAE.toFixed(2)} (max acceptable: ${MAX_ACCEPTABLE_FIDELITY_MAE}). Replay is too inaccurate to trust.`,
    };
  }

  return {
    passed: true,
    gate: 'BASELINE_FIDELITY',
    message: `Replay-vs-production MAE = ${fidelityMAE.toFixed(2)} (<= ${MAX_ACCEPTABLE_FIDELITY_MAE}).`,
  };
}

// ── Spearman correlation ─────────────────────────────────────────────────────

function rankArray(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    // Find ties
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    // Average rank for ties
    const avgRank = (i + j + 1) / 2; // 1-based
    for (let k = i; k < j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j;
  }
  return ranks;
}

export function spearmanRho(predicted: number[], actual: number[]): number {
  if (predicted.length !== actual.length || predicted.length < 3) return 0;

  const n = predicted.length;
  const rankP = rankArray(predicted);
  const rankA = rankArray(actual);

  // Pearson correlation of ranks
  const meanP = rankP.reduce((s, v) => s + v, 0) / n;
  const meanA = rankA.reduce((s, v) => s + v, 0) / n;

  let num = 0, denP = 0, denA = 0;
  for (let i = 0; i < n; i++) {
    const dp = rankP[i] - meanP;
    const da = rankA[i] - meanA;
    num += dp * da;
    denP += dp * dp;
    denA += da * da;
  }

  const den = Math.sqrt(denP * denA);
  return den === 0 ? 0 : num / den;
}

/**
 * Approximate p-value for Spearman rho using t-distribution approximation.
 * For n >= 10 this is reasonable; for smaller n, treat as rough estimate.
 */
function spearmanPValue(rho: number, n: number): number {
  if (n < 3) return 1;
  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho));
  // Approximate two-tailed p using the beta incomplete function
  // For simplicity, use a conservative t-to-p conversion
  const df = n - 2;
  const x = df / (df + t * t);
  // Regularized incomplete beta function approximation
  return betaIncomplete(df / 2, 0.5, x);
}

/** Simple beta incomplete function approximation (sufficient for p-value estimates) */
function betaIncomplete(a: number, b: number, x: number): number {
  // Use series expansion for regularized incomplete beta
  // This is a rough but sufficient approximation for our diagnostic purposes
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // For t-distribution with moderate df, use the continued fraction
  // approximation or fall back to a simple estimate
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  );

  if (x < (a + 1) / (a + b + 2)) {
    return bt * betaCF(a, b, x) / a;
  }
  return 1 - bt * betaCF(b, a, 1 - x) / b;
}

function betaCF(a: number, b: number, x: number): number {
  const maxIter = 100;
  const eps = 1e-10;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - qab * x / qap;
  if (Math.abs(d) < eps) d = eps;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    h *= d * c;

    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + aa / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < eps) break;
  }
  return h;
}

function lgamma(x: number): number {
  // Stirling's approximation with correction terms
  const cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (const c of cof) {
    y += 1;
    ser += c / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// ── MAE ──────────────────────────────────────────────────────────────────────

function meanAbsoluteError(predicted: number[], actual: number[]): number {
  if (predicted.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < predicted.length; i++) {
    sum += Math.abs(predicted[i] - actual[i]);
  }
  return sum / predicted.length;
}

// ── Bootstrap CI ─────────────────────────────────────────────────────────────

function bootstrapSpearmanCI(
  predicted: number[],
  actual: number[],
  iterations: number = BOOTSTRAP_ITERATIONS,
  alpha: number = 0.05,
): { ci_lower: number; ci_upper: number } {
  const n = predicted.length;
  if (n < 5) return { ci_lower: -1, ci_upper: 1 }; // Meaningless with < 5

  const rhos: number[] = [];
  for (let iter = 0; iter < iterations; iter++) {
    const sampleP: number[] = [];
    const sampleA: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sampleP.push(predicted[idx]);
      sampleA.push(actual[idx]);
    }
    rhos.push(spearmanRho(sampleP, sampleA));
  }

  rhos.sort((a, b) => a - b);
  const lo = Math.floor((alpha / 2) * iterations);
  const hi = Math.floor((1 - alpha / 2) * iterations);
  return {
    ci_lower: rhos[lo],
    ci_upper: rhos[Math.min(hi, iterations - 1)],
  };
}

// ── Main evaluation ──────────────────────────────────────────────────────────

export function evaluate(
  replayResults: ReplayResult[],
  runs: ExportedRun[],
): EvalResult {
  const predicted = replayResults.map(r => r.replayedVps);
  const actual = replayResults.map(r => r.actualVps);

  const rho = spearmanRho(predicted, actual);
  const pValue = spearmanPValue(rho, predicted.length);
  const mae = meanAbsoluteError(predicted, actual);

  // Within-range: check if actual falls within the original prediction range
  // (we use the original range since range calculation isn't a phase-1 knob)
  const runMap = new Map(runs.map(r => [r.id, r]));
  let withinRange = 0;
  let rangeChecked = 0;
  for (const rr of replayResults) {
    const orig = runMap.get(rr.runId);
    if (orig?.prediction_range_low != null && orig?.prediction_range_high != null) {
      rangeChecked++;
      if (rr.actualVps >= orig.prediction_range_low && rr.actualVps <= orig.prediction_range_high) {
        withinRange++;
      }
    }
  }
  const withinRangePct = rangeChecked > 0 ? (withinRange / rangeChecked) * 100 : 0;

  // Bootstrap CI
  const { ci_lower, ci_upper } = bootstrapSpearmanCI(predicted, actual);

  // Per-niche breakdown
  const nicheGroups = new Map<string, { predicted: number[]; actual: number[] }>();
  for (const rr of replayResults) {
    const orig = runMap.get(rr.runId);
    const niche = orig?.niche || 'unknown';
    if (!nicheGroups.has(niche)) {
      nicheGroups.set(niche, { predicted: [], actual: [] });
    }
    const g = nicheGroups.get(niche)!;
    g.predicted.push(rr.replayedVps);
    g.actual.push(rr.actualVps);
  }

  const byNiche = [...nicheGroups.entries()]
    .map(([niche, g]) => ({
      niche,
      n: g.predicted.length,
      spearman_rho: g.predicted.length >= 3 ? spearmanRho(g.predicted, g.actual) : 0,
      mae: meanAbsoluteError(g.predicted, g.actual),
    }))
    .sort((a, b) => b.n - a.n);

  return {
    n: replayResults.length,
    spearman_rho: rho,
    p_value: pValue,
    mae,
    within_range_pct: withinRangePct,
    ci_lower,
    ci_upper,
    by_niche: byNiche,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Compute fidelity metrics: how well does replay match production predictions?
 */
export function computeFidelityMetrics(results: ReplayResult[]): {
  mae: number;
  maxDelta: number;
  correlation: number;
  perRunDeltas: { runId: string; replayed: number; original: number; delta: number }[];
} {
  const replayed = results.map(r => r.replayedVps);
  const original = results.map(r => r.originalPredictedVps);

  const mae = meanAbsoluteError(replayed, original);
  const deltas = results.map(r => Math.abs(r.replayedVps - r.originalPredictedVps));
  const maxDelta = deltas.length > 0 ? Math.max(...deltas) : 0;
  const correlation = results.length >= 3 ? spearmanRho(replayed, original) : 0;

  const perRunDeltas = results
    .map(r => ({
      runId: r.runId,
      replayed: r.replayedVps,
      original: r.originalPredictedVps,
      delta: Math.round((r.replayedVps - r.originalPredictedVps) * 10) / 10,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return { mae, maxDelta, correlation, perRunDeltas };
}
