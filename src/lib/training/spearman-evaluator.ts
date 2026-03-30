/**
 * Spearman Rank Correlation Evaluator
 *
 * Primary quality metric per audit decision D2.
 * Computes Spearman rho between predicted_dps_7d (VPS) and actual_dps (VPS)
 * for all labeled prediction runs.
 *
 * Also computes: MAE, within-range %, per-niche breakdown.
 * Stores results in vps_evaluation table.
 */

import { createClient } from '@supabase/supabase-js';
import {
  classifyLabelCategory,
  computeLabelBreakdown,
  isTrustedV2Label,
  isTrainingLabelEligible,
  type EligibilityRow,
  type LabelCategoryBreakdown,
} from './training-eligibility';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

export interface SpearmanEvalResult {
  n: number;
  spearman_rho: number;
  p_value: number;
  mae: number;
  within_range_pct: number;
  by_niche: Array<{
    niche: string;
    n: number;
    spearman_rho: number;
    mae: number;
    within_range_pct: number;
  }>;
  labeling_mode_breakdown: Record<string, number>;
  label_category_breakdown: LabelCategoryBreakdown;
  /** How many rows were excluded (legacy/untrusted) */
  excluded_legacy_count: number;
  /** Set to true when evaluation used v2-only filter */
  v2_only: boolean;
  computed_at: string;
}

/**
 * Run the Spearman evaluation on labeled prediction runs.
 *
 * By default, evaluates ONLY trusted v2 labels (dps_formula_version='2.x',
 * trust != 'untrusted', training_weight > 0). Legacy rows are excluded
 * from official evaluation to avoid poisoning accuracy metrics.
 *
 * Set `includeLegacy: true` to evaluate ALL labeled rows (for comparison).
 */
export async function runSpearmanEvaluation(opts?: {
  /** Include legacy v1 labels in evaluation (default: false) */
  includeLegacy?: boolean;
}): Promise<SpearmanEvalResult> {
  const includeLegacy = opts?.includeLegacy ?? false;
  const supabase = getSupabase();

  console.log(`[SpearmanEval] Starting evaluation (v2_only=${!includeLegacy})`);

  // Ensure vps_evaluation table exists
  try {
    await (supabase as any).rpc?.('exec_sql', {
      query: `CREATE TABLE IF NOT EXISTS vps_evaluation (
        id BIGSERIAL PRIMARY KEY,
        computed_at TIMESTAMPTZ NOT NULL,
        n INT NOT NULL,
        spearman_rho DOUBLE PRECISION NOT NULL,
        p_value DOUBLE PRECISION,
        mae DOUBLE PRECISION NOT NULL,
        within_range_pct DOUBLE PRECISION,
        by_niche JSONB,
        labeling_mode_breakdown JSONB
      );`,
    });
  } catch { /* table may already exist */ }

  // Fetch all labeled runs with both predicted and actual VPS,
  // plus v2 provenance columns for filtering
  const { data: runs, error } = await supabase
    .from('prediction_runs')
    .select('id, predicted_dps_7d, actual_dps, prediction_range_low, prediction_range_high, video_id, labeling_mode, dps_formula_version, dps_label_trust, dps_training_weight')
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch labeled runs: ${error.message}`);
  }

  const allRuns = (runs || []) as any[];

  // Compute label category breakdown before filtering
  const labelBreakdown = computeLabelBreakdown(allRuns);

  // Filter: by default, only v2-eligible rows
  const labeledRuns = includeLegacy
    ? allRuns
    : allRuns.filter((r) => isTrainingLabelEligible(r));

  const excludedLegacyCount = allRuns.length - labeledRuns.length;

  if (!includeLegacy && excludedLegacyCount > 0) {
    console.log(
      `[SpearmanEval] Excluded ${excludedLegacyCount} legacy/untrusted rows ` +
      `(${labelBreakdown.legacy_v1} legacy, ${labelBreakdown.v2_untrusted} v2_untrusted)`,
    );
  }

  if (labeledRuns.length < 3) {
    console.log(`[SpearmanEval] Only ${labeledRuns.length} eligible runs — need at least 3 for Spearman`);
    const emptyResult: SpearmanEvalResult = {
      n: labeledRuns.length,
      spearman_rho: 0,
      p_value: 1,
      mae: 0,
      within_range_pct: 0,
      by_niche: [],
      labeling_mode_breakdown: {},
      label_category_breakdown: labelBreakdown,
      excluded_legacy_count: excludedLegacyCount,
      v2_only: !includeLegacy,
      computed_at: new Date().toISOString(),
    };
    return emptyResult;
  }

  // Get niche info
  const videoIds = [...new Set(labeledRuns.map(r => r.video_id))];
  const { data: videoFiles } = await supabase
    .from('video_files')
    .select('id, niche')
    .in('id', videoIds);
  const nicheMap = new Map((videoFiles || []).map((v: any) => [v.id, v.niche]));

  // Compute overall metrics
  const predicted = labeledRuns.map(r => Number(r.predicted_dps_7d));
  const actual = labeledRuns.map(r => Number(r.actual_dps));

  const { rho, p } = spearmanRankCorrelation(predicted, actual);
  const mae = meanAbsoluteError(predicted, actual);
  const withinRangePct = computeWithinRangePct(labeledRuns);

  // Labeling mode breakdown
  const modeBreakdown: Record<string, number> = {};
  for (const r of labeledRuns) {
    const mode = r.labeling_mode || 'legacy';
    modeBreakdown[mode] = (modeBreakdown[mode] || 0) + 1;
  }

  // Per-niche breakdown
  const nicheGroups = new Map<string, any[]>();
  for (const r of labeledRuns) {
    const niche = nicheMap.get(r.video_id) || 'unknown';
    if (!nicheGroups.has(niche)) nicheGroups.set(niche, []);
    nicheGroups.get(niche)!.push(r);
  }

  const byNiche: SpearmanEvalResult['by_niche'] = [];
  for (const [niche, nicheRuns] of nicheGroups) {
    if (nicheRuns.length < 3) {
      byNiche.push({
        niche,
        n: nicheRuns.length,
        spearman_rho: 0,
        mae: meanAbsoluteError(
          nicheRuns.map(r => Number(r.predicted_dps_7d)),
          nicheRuns.map(r => Number(r.actual_dps)),
        ),
        within_range_pct: computeWithinRangePct(nicheRuns),
      });
      continue;
    }

    const nichePredicted = nicheRuns.map(r => Number(r.predicted_dps_7d));
    const nicheActual = nicheRuns.map(r => Number(r.actual_dps));
    const nicheSpearman = spearmanRankCorrelation(nichePredicted, nicheActual);

    byNiche.push({
      niche,
      n: nicheRuns.length,
      spearman_rho: nicheSpearman.rho,
      mae: meanAbsoluteError(nichePredicted, nicheActual),
      within_range_pct: computeWithinRangePct(nicheRuns),
    });
  }

  const computedAt = new Date().toISOString();

  const result: SpearmanEvalResult = {
    n: labeledRuns.length,
    spearman_rho: round4(rho),
    p_value: round4(p),
    mae: round4(mae),
    within_range_pct: round4(withinRangePct),
    by_niche: byNiche,
    labeling_mode_breakdown: modeBreakdown,
    label_category_breakdown: labelBreakdown,
    excluded_legacy_count: excludedLegacyCount,
    v2_only: !includeLegacy,
    computed_at: computedAt,
  };

  // Store result
  try {
    await supabase.from('vps_evaluation').insert({
      computed_at: computedAt,
      n: result.n,
      spearman_rho: result.spearman_rho,
      p_value: result.p_value,
      mae: result.mae,
      within_range_pct: result.within_range_pct,
      by_niche: result.by_niche,
      labeling_mode_breakdown: result.labeling_mode_breakdown,
    });
  } catch (insertErr: any) {
    console.error(`[SpearmanEval] Failed to store result: ${insertErr.message}`);
  }

  console.log(
    `[SpearmanEval] Complete: n=${result.n}, rho=${result.spearman_rho}, ` +
    `p=${result.p_value}, MAE=${result.mae}, within_range=${result.within_range_pct}%`,
  );

  return result;
}

// ── Statistical Functions ───────────────────────────────────────────────────

/**
 * Spearman rank correlation with tie handling.
 * Returns rho and approximate p-value.
 */
function spearmanRankCorrelation(
  x: number[],
  y: number[],
): { rho: number; p: number } {
  const n = x.length;
  if (n < 3) return { rho: 0, p: 1 };

  const rx = assignRanks(x);
  const ry = assignRanks(y);

  // Pearson correlation on ranks
  const meanRx = rx.reduce((s, v) => s + v, 0) / n;
  const meanRy = ry.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = rx[i] - meanRx;
    const dy = ry[i] - meanRy;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const rho = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;

  // Approximate p-value using t-distribution
  const t = rho * Math.sqrt((n - 2) / (1 - rho * rho + 1e-12));
  const df = n - 2;
  const p = 2 * (1 - tCDF(Math.abs(t), df));

  return { rho, p };
}

/**
 * Assign ranks with average-rank tie handling.
 */
function assignRanks(arr: number[]): number[] {
  const n = arr.length;
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);

  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j + 1;
  }

  return ranks;
}

/**
 * Student's t-distribution CDF approximation.
 * Uses the regularized incomplete beta function.
 */
function tCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  return 1 - 0.5 * regularizedIncompleteBeta(x, df / 2, 0.5);
}

/**
 * Regularized incomplete beta function I_x(a, b)
 * using continued fraction approximation (Lentz's method).
 */
function regularizedIncompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use the symmetry relation if x > (a + 1) / (a + b + 2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedIncompleteBeta(1 - x, b, a);
  }

  const lnBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  // Continued fraction (Lentz's algorithm)
  const maxIter = 200;
  const eps = 1e-10;
  let f = 1;
  let c = 1;
  let d = 1 - (a + b) * x / (a + 1);
  if (Math.abs(d) < eps) d = eps;
  d = 1 / d;
  f = d;

  for (let m = 1; m <= maxIter; m++) {
    // Even step
    let numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    d = 1 + numerator * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + numerator / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    f *= c * d;

    // Odd step
    numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + numerator * d;
    if (Math.abs(d) < eps) d = eps;
    c = 1 + numerator / c;
    if (Math.abs(c) < eps) c = eps;
    d = 1 / d;
    const delta = c * d;
    f *= delta;

    if (Math.abs(delta - 1) < eps) break;
  }

  return front * f;
}

/**
 * Log-gamma function (Stirling's approximation + Lanczos).
 */
function lnGamma(z: number): number {
  if (z <= 0) return Infinity;
  // Lanczos approximation (g=7)
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  const g = 7;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i - 1);
  }
  const t = z + g - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z - 0.5) * Math.log(t) - t + Math.log(x);
}

// ── Helper Functions ────────────────────────────────────────────────────────

function meanAbsoluteError(predicted: number[], actual: number[]): number {
  if (predicted.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < predicted.length; i++) {
    sum += Math.abs(predicted[i] - actual[i]);
  }
  return sum / predicted.length;
}

function computeWithinRangePct(runs: any[]): number {
  if (runs.length === 0) return 0;
  let inRange = 0;
  for (const r of runs) {
    const actual = Number(r.actual_dps);
    const low = Number(r.prediction_range_low ?? 0);
    const high = Number(r.prediction_range_high ?? 100);
    if (actual >= low && actual <= high) inRange++;
  }
  return (inRange / runs.length) * 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
