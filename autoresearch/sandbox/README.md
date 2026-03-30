# Autoresearch Sandbox

Pure TypeScript modules for offline replay, evaluation, and optimization.
No Supabase connections. No production imports. No side effects.

## Planned Modules

### `types.ts` (created)

Shared type definitions for exported data, configuration, and evaluation results.

### `replay-aggregation.ts` (future)

**Responsibility:** Given a set of component scores and a parameter config, reproduce the
VPS aggregation pipeline as a pure function.

Steps replayed:
1. Assign components to paths (using PATH_DEFINITIONS from config)
2. Aggregate per-path: `path.vps = SUM(comp.prediction * comp.confidence) / SUM(comp.confidence)`
3. Synthesize across paths: `rawVPS = SUM(path.vps * path.weight) / SUM(path.weight)`
4. Apply niche difficulty factor: `calibratedVPS = rawVPS * nicheFactor`
5. Apply account size factor: `calibratedVPS *= accountFactor`
6. Apply calibrator rules (silent video cap, confidence penalty, high VPS scaling)
7. Clamp to 0-100

**Input:** `ExportedRun` + `SandboxConfig`
**Output:** `ReplayResult` (replayedVps, replayedConfidence, adjustments applied)

### `eval-spearman.ts` (future)

**Responsibility:** Compute Spearman rank correlation between replayed VPS and actual VPS
across a dataset. Also computes MAE, within-range %, and bootstrap confidence intervals.

**Input:** Array of `{ predicted: number, actual: number }`
**Output:** `EvalResult` (rho, p_value, mae, within_range_pct, ci_lower, ci_upper, n)

### `optimize-weights.ts` (future)

**Responsibility:** Search over phase-1 parameter space to maximize Spearman rho.
Candidate strategies: grid search, random search, Bayesian (Gaussian process).

**Input:** Exported dataset + baseline config + search bounds
**Output:** Best config found + evaluation metrics + search history

## Explicit Non-Goals (Phase 1)

- **No LLM prompt tuning.** Component scores are frozen from historical runs.
- **No XGBoost retraining.** The ML model is a black box; its output is a fixed input.
- **No component logic changes.** Hook-scorer formulas, rubric rules, etc. are not varied.
- **No agreement threshold tuning.** The choice of synthesis method (high/moderate/low agreement)
  is not varied in phase 1 due to non-trivial interaction effects.
- **No creator context calibration.** Near-zero labeled data with creator context active.
- **No live API calls.** Everything runs on pre-exported snapshots.
- **No production writes.** Results stay in `autoresearch/results/`.
