# Autoresearch Sandbox

Offline optimization sandbox for Trendzo's VPS (Viral Prediction Score) prediction pipeline.

## What This Is

A **file-based, production-safe** environment for replaying the VPS aggregation pipeline offline
and optimizing numeric configuration parameters against Spearman rank correlation (rho) with
ground-truth actuals.

- **No live API calls.** All replay uses pre-exported labeled data from Supabase.
- **No production writes.** Nothing in this folder touches `src/`, `scripts/`, or any deployed config.
- **No LLM re-execution.** Component scores are frozen from historical runs; only the aggregation
  math (weights, factors, thresholds) is replayed and varied.

## How It Works

1. **Export** labeled prediction data from Supabase into `data/` (one-time snapshot).
2. **Replay** the aggregation pipeline in `sandbox/` using component-level scores from the export.
3. **Evaluate** each configuration against Spearman rho (predicted VPS rank vs actual VPS rank).
4. **Optimize** phase-1 numeric knobs (path weights, niche factors, account factors, calibrator
   constants) via grid or Bayesian search.
5. **Record** results in `results/` and promote the best config to `configs/best.json`.

## Phase 1 Scope

Phase 1 optimizes **only** numeric/config parameters that affect aggregation math:

| Knob Category | Count | Source File |
|---|---|---|
| Path base weights | 4 | `system-registry.ts` |
| Context weights (5 workflows x 4 paths) | 20 | `system-registry.ts` |
| Niche difficulty factors | 19+ | `kai-orchestrator.ts` + `system-registry.ts` |
| Account size factors | 6 tiers | `kai-orchestrator.ts` |
| Component default reliability | 22 | `system-registry.ts` |
| Calibrator constants | 6 | `prediction-calibrator.ts` |

### Explicit Non-Goals (Phase 1)

- LLM prompt tuning (Pack 1/2, GPT-4, Claude, Gemini)
- XGBoost model retraining
- Component internal logic changes
- Agreement threshold tuning (high/moderate/low synthesis method selection)
- Creator context calibration (near-zero labeled data)

## Directory Layout

```
autoresearch/
  README.md              <- You are here
  notes/                 <- Audit memos and decision records
  data/                  <- Exported snapshots (gitignored JSON/CSV, .gitkeep tracked)
  sandbox/               <- Pure replay + eval + optimization code (TypeScript)
  configs/               <- Baseline and best-found parameter configs (JSON)
  results/               <- Optimization run outputs (.gitkeep tracked)
```
