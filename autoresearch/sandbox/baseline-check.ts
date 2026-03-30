#!/usr/bin/env npx tsx
/**
 * Baseline Reproduction Check
 *
 * Runs the full sandbox evaluation pipeline using baseline.json and the exported
 * snapshot. Produces a mismatch report and go/no-go recommendation.
 *
 * Run:
 *   cd C:\Projects\CleanCopy
 *   npx tsx autoresearch/sandbox/baseline-check.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadSnapshot, loadConfig } from './loader';
import { replayAll } from './replay-aggregation';
import {
  validatePreConditions,
  validateFidelity,
  evaluate,
  computeFidelityMetrics,
} from './eval-spearman';

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Autoresearch Sandbox — Baseline Reproduction Check');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ── Load data ──────────────────────────────────────────────────────────────
  let snapshot;
  try {
    snapshot = loadSnapshot();
    console.log(`Loaded snapshot: ${snapshot.run_count} runs (exported ${snapshot.exported_at})\n`);
  } catch (e: any) {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig('baseline');
    console.log(`Loaded config: ${config.version}\n`);
  } catch (e: any) {
    console.error(`FATAL: ${e.message}`);
    process.exit(1);
  }

  // ── Replay ─────────────────────────────────────────────────────────────────
  console.log('Running replay aggregation...');
  const { results, skipped, skipReasons } = replayAll(snapshot.runs, config);
  console.log(`  Replayed: ${results.length}, Skipped: ${skipped}\n`);

  // ── Validation gates ───────────────────────────────────────────────────────
  console.log('─── Validation Gates ───────────────────────────────────');
  const preChecks = validatePreConditions(snapshot.run_count, results.length, skipped);
  const fidelityCheck = validateFidelity(results);
  const allChecks = [...preChecks, fidelityCheck];

  let allPassed = true;
  for (const check of allChecks) {
    const icon = check.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${check.gate}: ${check.message}`);
    if (!check.passed) allPassed = false;
  }
  console.log();

  // ── Fidelity analysis ──────────────────────────────────────────────────────
  console.log('─── Replay Fidelity (vs Production) ────────────────────');
  const fidelity = computeFidelityMetrics(results);
  console.log(`  MAE (replay vs production):  ${fidelity.mae.toFixed(2)} VPS`);
  console.log(`  Max delta:                   ${fidelity.maxDelta.toFixed(2)} VPS`);
  console.log(`  Rank correlation:            ${fidelity.correlation.toFixed(4)}`);

  if (fidelity.perRunDeltas.length > 0) {
    console.log(`\n  Largest mismatches:`);
    const top5 = fidelity.perRunDeltas.slice(0, 5);
    for (const d of top5) {
      console.log(`    ${d.runId.substring(0, 8)}... replayed=${d.replayed} original=${d.original} delta=${d.delta > 0 ? '+' : ''}${d.delta}`);
    }
  }
  console.log();

  // ── Eval metrics (replay vs actuals) ───────────────────────────────────────
  console.log('─── Sandbox Eval (Replayed VPS vs Actual VPS) ──────────');
  const evalResult = evaluate(results, snapshot.runs);

  console.log(`  N:                  ${evalResult.n}`);
  console.log(`  Spearman rho:       ${evalResult.spearman_rho.toFixed(4)}`);
  console.log(`  p-value:            ${evalResult.p_value.toFixed(4)}`);
  console.log(`  Bootstrap 95% CI:   [${evalResult.ci_lower.toFixed(4)}, ${evalResult.ci_upper.toFixed(4)}]`);
  console.log(`  MAE:                ${evalResult.mae.toFixed(2)} VPS`);
  console.log(`  Within range:       ${evalResult.within_range_pct.toFixed(1)}%`);

  if (evalResult.by_niche.length > 0) {
    console.log(`\n  Per-niche breakdown:`);
    for (const n of evalResult.by_niche) {
      const rhoStr = n.n >= 3 ? n.spearman_rho.toFixed(4) : 'N/A (<3)';
      console.log(`    ${n.niche.padEnd(25)} n=${String(n.n).padStart(3)}  rho=${rhoStr}  MAE=${n.mae.toFixed(2)}`);
    }
  }
  console.log();

  // ── Niche distribution ─────────────────────────────────────────────────────
  console.log('─── Niche Distribution ─────────────────────────────────');
  const nicheCounts = new Map<string, number>();
  for (const run of snapshot.runs) {
    const n = run.niche || 'unknown';
    nicheCounts.set(n, (nicheCounts.get(n) || 0) + 1);
  }
  for (const [niche, count] of [...nicheCounts.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${niche.padEnd(25)} ${count}`);
  }
  console.log();

  // ── Skip reasons (sample) ──────────────────────────────────────────────────
  if (skipReasons.length > 0) {
    console.log('─── Skipped Runs (sample) ──────────────────────────────');
    for (const reason of skipReasons.slice(0, 5)) {
      console.log(`  ${reason}`);
    }
    if (skipReasons.length > 5) {
      console.log(`  ... and ${skipReasons.length - 5} more`);
    }
    console.log();
  }

  // ── CI noise warning ───────────────────────────────────────────────────────
  const ciWidth = evalResult.ci_upper - evalResult.ci_lower;
  if (ciWidth > 0.5) {
    console.log('WARNING: Bootstrap CI width is > 0.5 — results are very noisy.');
    console.log('         Any apparent improvement < 0.25 rho is likely noise.\n');
  } else if (ciWidth > 0.3) {
    console.log('CAUTION: Bootstrap CI width is > 0.3 — moderate noise.');
    console.log('         Only trust improvements > 0.15 rho.\n');
  }

  // ── Write report ───────────────────────────────────────────────────────────
  const goNoGo = allPassed ? 'GO' : 'NO-GO';

  const report = {
    timestamp: new Date().toISOString(),
    config_version: config.version,
    snapshot_date: snapshot.exported_at,

    sample_counts: {
      total_labeled_runs: snapshot.run_count,
      replayed: results.length,
      skipped,
    },

    niche_distribution: Object.fromEntries(nicheCounts),

    replay_fidelity: {
      mae_vs_production: fidelity.mae,
      max_delta: fidelity.maxDelta,
      rank_correlation: fidelity.correlation,
    },

    baseline_eval: {
      n: evalResult.n,
      spearman_rho: evalResult.spearman_rho,
      p_value: evalResult.p_value,
      mae: evalResult.mae,
      within_range_pct: evalResult.within_range_pct,
      bootstrap_ci_95: [evalResult.ci_lower, evalResult.ci_upper],
      ci_width: ciWidth,
      by_niche: evalResult.by_niche,
    },

    validation_gates: allChecks.map(c => ({
      gate: c.gate,
      passed: c.passed,
      message: c.message,
    })),

    recommendation: goNoGo,
    recommendation_detail: allPassed
      ? 'All validation gates passed. Replay fidelity is acceptable. Safe to proceed to optimization.'
      : `One or more gates failed. Fix blockers before proceeding to optimization.`,
  };

  const resultsDir = path.resolve(__dirname, '..', 'results');
  const reportPath = path.join(resultsDir, 'baseline-check.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  // ── Final verdict ──────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  RECOMMENDATION: ${goNoGo}`);
  console.log(`  ${report.recommendation_detail}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\nReport written to: ${reportPath}\n`);

  process.exit(allPassed ? 0 : 1);
}

main();
