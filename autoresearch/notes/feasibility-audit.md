# Feasibility Audit: Offline Autoresearch Sandbox

**Date:** 2026-03-22
**Status:** Feasible — proceed to scaffold

---

## 1. Data Available for Offline Replay

### `prediction_runs` table (row-level)

Key columns for replay:

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID | Run identifier |
| `video_id` | UUID | Link to video |
| `predicted_dps_7d` | NUMERIC(5,2) | Predicted VPS |
| `actual_dps` | NUMERIC(5,2) | Ground-truth VPS (post-publication) |
| `prediction_range_low` | NUMERIC(5,2) | Confidence interval low |
| `prediction_range_high` | NUMERIC(5,2) | Confidence interval high |
| `confidence` | NUMERIC(5,4) | Pipeline confidence |
| `components_used` | TEXT[] | Which components ran |
| `raw_result` | JSONB | Full orchestrator output (see caveat below) |
| `labeling_mode` | TEXT | manual / auto_cron / manual_script |
| `created_at` | TIMESTAMPTZ | Run timestamp |

### `run_component_results` table (component-level)

| Column | Type | Purpose |
|---|---|---|
| `run_id` | UUID | FK to prediction_runs |
| `component_id` | VARCHAR(100) | e.g. 'hook-scorer', 'ffmpeg' |
| `success` | BOOLEAN | Whether component succeeded |
| `prediction` | NUMERIC(5,2) | Component's VPS prediction |
| `confidence` | NUMERIC(5,4) | Component's confidence |
| `features` | JSONB | Component-specific output (ffmpeg metrics, etc.) |
| `latency_ms` | INTEGER | Execution time |

### Critical Caveat: `raw_result` Truncation

When `raw_result` JSON exceeds 500KB, it is truncated to a compact summary that **drops the
`paths` array** entirely (`runPredictionPipeline.ts:819-831`). Truncated rows have
`_truncated: true` and lose all per-component/per-path detail.

**Decision:** Use `run_component_results` as the primary replay source. It is never truncated
and contains per-component prediction, confidence, and features independently.

---

## 2. Minimum Export Schema

**Filter:** `actual_dps IS NOT NULL` (only labeled runs with ground truth).

**From prediction_runs:**
- id, video_id, predicted_dps_7d, actual_dps
- prediction_range_low, prediction_range_high, confidence
- components_used, labeling_mode, created_at
- raw_result->'adjustments' (rawScore, nicheFactor, accountFactor)
- Niche (from raw_result or video_files join)

**From run_component_results (joined on run_id):**
- component_id, success, prediction, confidence, features

---

## 3. Phase 1 Safe Parameters (~60+ numeric knobs)

| Parameter | File | Current Value(s) |
|---|---|---|
| Path base weights (4) | `system-registry.ts:635-671` | 0.15 / 0.25 / 0.45 / 0.15 |
| Context weights (5x4) | `system-registry.ts:677-708` | Various per workflow |
| Niche difficulty factors (19+) | `kai-orchestrator.ts:1173-1200` + `system-registry.ts:405-416` | 0.75 - 1.05 |
| Account size factors (6) | `kai-orchestrator.ts:1264-1292` | 0.68 - 1.15 |
| Component default reliability (22) | `system-registry.ts:92-268` | 0.50 - 0.99 |
| CONFIDENCE_PENALTY_NO_SPEECH | `prediction-calibrator.ts:92` | 0.7 |
| SILENT_VIDEO_VPS_CAP | `prediction-calibrator.ts:93` | 55 |
| SILENT_VIDEO_VPS_CAP_VISUAL_FIRST | `prediction-calibrator.ts:94` | 65 |
| SILENT_VIDEO_PACKV_THRESHOLD | `prediction-calibrator.ts:95` | 50 |
| HIGH_VPS_THRESHOLD | `prediction-calibrator.ts:99` | 60 |
| HIGH_VPS_SCALING_FACTOR | `prediction-calibrator.ts:100` | 0.85 |

All of these can be replayed purely from exported component scores without re-running
any LLMs, Python models, or live pipelines.

---

## 4. Out of Scope for Phase 1

| Parameter | Reason |
|---|---|
| LLM prompts (Pack 1/2, GPT-4, Claude, Gemini) | Requires live API calls |
| XGBoost model weights | Requires Python retrain loop |
| Component internal logic | Requires full re-execution |
| Pack V Gemini Vision blend ratio | Requires re-execution |
| Creator context calibration | Near-zero labeled data |
| Agreement thresholds | Changes synthesis method selection; defer to phase 2 |

---

## 5. Dataset Size Constraint

Current labeled dataset: ~27 videos, mostly 1 niche (side-hustles). Optimization results
will be noisy. The sandbox must include bootstrap confidence intervals on rho to flag
statistically meaningless results. Minimum viable: 50+ labeled runs across 3+ niches.

---

## 6. Scoring Pipeline (for replay implementation)

```
Step 1: Component -> Path Aggregation
  path.aggregatedPrediction = SUM(comp.prediction * comp.confidence) / SUM(comp.confidence)

Step 2: Path -> Raw VPS
  High agreement:    rawVPS = SUM(path.prediction * path.weight) / SUM(path.weight)
  Moderate agreement: rawVPS = SUM(path.prediction * path.weight * pathReliability) / SUM(...)
  Low agreement:     rawVPS = disagreement reconciliation (weighted average + outlier dampening)

Step 3: Orchestrator Calibration
  calibratedVPS = rawVPS * nicheFactor * accountFactor

Step 4: Pipeline Calibration
  Apply: confidence penalty, silent video cap, high VPS scaling (currently disabled)
  Final VPS = clamped 0-100
```

Source files:
- `src/lib/orchestration/kai-orchestrator.ts` (aggregation, synthesis, calibration)
- `src/lib/prediction/prediction-calibrator.ts` (pipeline calibration rules)
- `src/lib/prediction/system-registry.ts` (weights, paths, components, niches)
- `src/lib/prediction/runPredictionPipeline.ts` (pipeline orchestration, DB writes)
