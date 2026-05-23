# Prediction + Training Model — Read-Only State Diagnostic

**Generated:** 2026-05-22
**Mode:** Read-only audit. No code, migrations, or cron triggers were modified.
**Repo root:** `C:\Projects\CleanCopy`

---

## SECTION 1 — CURRENT ACTIVE MODEL

### 1.1 Currently active XGBoost model version

The model version is **resolved dynamically from the `model_variants` table**, not from a `MODEL_VERSION` env var. The env var still exists in places but is no longer the live switch.

- **Resolver:** `src/lib/prediction/model-router.ts:32` (`resolveModelRoute`)
- **Caller:** `src/lib/prediction/runPredictionPipeline.ts:410` — `const activeVersion = modelRoute?.model_version || 'v10'`
- **Inference:** `src/lib/prediction/xgboost-inference.ts:328` (`predictXGBoost(features, modelVersion)`)
- **Prefix resolver:** `xgboost-inference.ts:101` — anything starting with `v15` loads v15 artefacts; everything else (including `v10`, unknown, legacy) falls back to v10.
- **Default fallback when no variant exists:** `model-router.ts:102` returns `model_version: 'v10'`.

Live DB state (`model_variants`, queried 2026-05-22):

| variant_id | model_version | niche | spearman_score | is_active | created_at |
|---|---|---|---|---|---|
| e7be3eb4… | **v15-honest-with-res** | null (global) | 0.6805 | **true** | 2026-04-17 |
| 2f980950… | v10 | null | 0.7811 | false | 2026-04-08 |
| a9cd03c9… | v14a-sandbox | side-hustles | 0.261 | false | 2026-04-10 |
| d77ad348… | v14b-sandbox | side-hustles | 0.4572 | false | 2026-04-10 |
| 61ec726f… | v14c-sandbox | side-hustles | 0.3757 | false | 2026-04-10 |
| 934ce657… | v14d-sandbox | side-hustles | 0.5776 | false | 2026-04-10 |
| f1e2e53d… | v13-sandbox | side-hustles | 0.5609 | false | 2026-04-09 |

**Active model = `v15-honest-with-res` (global, no niche routing).** No niche-specific variants are active.

Other (older) hard-coded references that are no longer the live path:
- `src/app/api/admin/operations/system-health/route.ts:278` — `const modelVersion = process.env.MODEL_VERSION || 'v5-heuristic'` (used only in the system-health dashboard).
- `src/lib/services/virality-indicator/xgboost-virality-service.ts:61` — `const ACTIVE_MODEL_VERSION = process.env.MODEL_VERSION === 'xgb_v6' ? 'v6' : 'v5-simplified'` (legacy Python-subprocess path; superseded by the TS inference in `predictXGBoost`).
- `src/lib/services/viral-prediction-model.ts:46` — `MODEL_VERSION = 'v2.1.0-beta'` (legacy heuristic model, not the active path).
- `src/lib/services/viral-prediction/unified-prediction-engine.ts:150` — `const MODEL_VERSION = '3.1.0'` (legacy, not the active path).

### 1.2 Model artifact files in use

**`models/` directory:**

| File | Size (bytes) | Modified | Active? |
|---|---|---|---|
| `xgboost-v15-model.json` | 2,322,565 | 2026-04-17 | ✅ matches active variant |
| `xgboost-v15-features.json` | 2,422 | 2026-04-17 | ✅ |
| `xgboost-v15-scaler.json` | 6,427 | 2026-04-17 | ✅ |
| `xgboost-v15-metadata.json` | 2,083 | 2026-04-17 | ✅ |
| `xgboost-v10-model.json` | 2,338,297 | 2026-03-20 | fallback only |
| `xgboost-v10-features.json` | 1,519 | 2026-03-20 | fallback only |
| `xgboost-v10-scaler.json` | 4,583 | 2026-03-20 | fallback only |
| `xgboost-v10-metadata.json` | 6,848 | 2026-03-20 | fallback only |
| `xgboost-v9-*.json` (4 files) | 1.3k–2.3MB | 2026-03-19 | unused |
| `xgboost-v8-*.json` (4 files) | 1.5k–2.1MB | 2026-03-14/18 | unused |
| `xgboost-v7-*.json` (4 files) + `xgboost-v7-scaler.pkl` | 1.9k–172k | 2026-03-13/17 | unused |
| `xgboost-v6-*.json` (4 files) + `xgboost-v6-scaler.pkl` | 0.9k–30k | 2026-02-09/10 | unused |
| `xgboost-dps-model.json` | 383,756 | 2026-01-28 | unused (very old v5-era) |
| `xgboost-enhanced.json` | 48 | 2026-03-19 | stub |
| `feature-names.json` | 2,905 | 2026-01-28 | unused (legacy) |
| `feature-scaler.pkl` | 3,291 | 2026-01-28 | unused (legacy) |
| `training-metrics.json` | 2,957 | 2026-01-28 | unused (legacy) |
| `holdout-video-ids.json` | 1,710 | 2026-03-15 | reference holdout list |

`public/models/` does not exist.

**`data/sandbox/`** — sandbox/experimental artifacts (never loaded by production):
- v11 sandbox: 4 files (2026-04-01), `xgboost-v11-sandbox.model` = 394,573 bytes
- v12: features/metadata + `v12-training-data.json` 11,685,007 bytes (2026-04-08)
- v13 sandbox: 3 files + `xgboost-v13-sandbox-model.json` 9,976,053 bytes (2026-04-08)
- v14-clean sandbox: 4 files including `holdout-ids.json` (2026-04-10)
- v14a/b/c/d sandbox variants: 12 files (2026-04-09/10)
- `retrain-evaluation.json` (2026-04-01) — last v11 LOOCV report
- `cleaning-report.json` (2026-04-10)
- 14 stdout/stderr/log/import txt files from training sessions
- `v13-sandbox-report.md` (2026-04-08 22:42) — last markdown sandbox report

**Production-active artifacts: the four `xgboost-v15-*.json` files in `models/`.**

### 1.3 Last known reported accuracy

From `models/xgboost-v15-metadata.json` (the active variant):

```
cv_spearman_mean:    0.616165820241227
cv_spearman_std:     0.019248804073872198
holdout_spearman:    0.6805371382902647
holdout_mae:         15.49698846244812
training_rows:       5645
holdout_rows:        200
```

Top-10 feature importance (by gain): `sound_type` (59,972) → `music_is_original` (38,716) → `ffmpeg_resolution_height` (22,763) → `audio_silence_count` (15,528) → `visual_avg_scene_duration` (9,462) → `meta_hashtag_count` (8,545) → `ffmpeg_resolution_width` (8,521) → `hashtag_count` (8,484) → `talking_head_ratio` (6,959) → `meta_creator_followers` (6,258).

`models/xgboost-v15-metadata.json:65` is annotated `"validation_status": "validated (Prompt 1, 2026-04-17)"`.

Other Spearman/accuracy references found in code, docs, and markdown:

- `src/lib/training/autoresearch/bridge_results_to_db.ts:29` — `const V15_HOLDOUT_SPEARMAN = 0.6805;` (treated as the production baseline; experiments compare their `holdout_spearman` against this constant).
- `src/lib/training/autoresearch/leaderboard.py:10` and `leaderboard_full.py:9` — `{'holdout': 0.6805, 'mae': 15.50}` for v15.
- `src/lib/training/autoresearch/leaderboard_full.py:9` — `cv_mean: 0.6162, cv_std: 0.0192` for v15.
- `models/xgboost-v10-metadata.json:104` — v10 holdout Spearman = 0.7811 on 50-row holdout (863-video training set).
- `src/app/api/admin/operations/initiative/route.ts:151` — reads `raw.performance.holdout.spearman_rho` from metadata files for UI display.
- `data/sandbox/v13-sandbox-report.md` (2026-04-08) — v13 sandbox: CV ρ=0.5609, holdout ρ=0.3726 (rejected).
- `data/sandbox/retrain-evaluation.json` (2026-04-01) — v11 sandbox LOOCV ρ=0.3209.
- `results-autoresearch/phase3_chain_logs/v16-candidate.log` (2026-04-21) — v16-candidate: CV=0.6146±0.0205, **HOLDOUT=0.6752**, MAE=15.5608.
- `results-autoresearch/phase3_chain_logs/v16-control.log` (2026-04-21) — v16-control: CV=0.6139±0.0184, **HOLDOUT=0.6692**, MAE=15.7298.
- `results-autoresearch/reproduction/results.json` — pipeline reproduction: CV=0.6149, holdout=0.6777 (within ±0.005 of v15).
- 26 individual `results-autoresearch/auto-NNN/results.json` files (auto-001 through auto-044) — every retrain experiment compares against the v15 baseline of 0.6805.

**v16 vs v15 head-to-head (cited from memory and confirmed in logs):** v16-candidate holdout ρ=0.6752 (worse), v16-control ρ=0.6692 (worse), v15 ρ=0.6805. v16 was not promoted.

---

## SECTION 2 — TRAINING PIPELINE INVENTORY

### 2.1 Training cron route

**File:** `src/app/api/cron/training-pipeline/route.ts`
**Line count:** 138 lines
**Vercel config:** `export const dynamic = 'force-dynamic'` (L12), `export const maxDuration = 300` (L13 — 5 minutes, Vercel Pro ceiling).

**Imports (all dynamic `await import(...)`):**
- `@/lib/training/fresh-video-scanner` → `runDiscoveryScan`
- `@/lib/training/schedule-backfill` → `backfillMetricSchedules`
- `@/lib/training/metric-collector` → `runMetricCollector`
- `@/lib/training/auto-labeler` → `runAutoLabeler`
- `@/lib/training/spearman-evaluator` → `runSpearmanEvaluation`
- `@/lib/training/niche-creator-scraper` → `scrapeNicheCreators`
- `@/lib/cron/scheduler` → `runPatternExtractionNow`, `runPatternMetricsNow`, `runCulturalScanNow`

**External services:**
- HTTP `fetch` to `${NEXT_PUBLIC_BASE_URL}/api/cron/classify-events` (step=`classify-events`, L102)
- HTTP `fetch` to `${NEXT_PUBLIC_BASE_URL}/api/cron/autodream` (step=`autodream`, L113)
- Transitively (via imports): TikTok API (via `tiktok-metric-fetcher.ts` inside `metric-collector`), Reddit + Gemini (via scheduler's `runCulturalScanNow`), Apify (via `niche-creator-scraper`).

**What it does (plain English, top-to-bottom):**
1. **L19–29:** Parses `step`, optional `token`, optional `dry_run`. Gates on `CRON_SECRET` if set.
2. **L31–36:** Validates `step` against the 11-value `VALID_STEPS` union.
3. **L43–47 (`step=scan`):** Runs `runDiscoveryScan` — find new videos. NOT included in `all`.
4. **L49–52 (`step=backfill` or `all`):** Calls `backfillMetricSchedules({ limit: 100, dryRun })` — creates `metric_check_schedule` rows for `prediction_runs` that have a TikTok URL but no schedule yet.
5. **L54–57 (`step=collect` or `all`):** Calls `runMetricCollector({ limit: 50, dryRun })` — queries due `metric_check_schedule` rows, fetches actual TikTok metrics (views/likes/etc.), writes them to `metric_check_schedule.actual_metrics` JSONB.
6. **L59–62 (`step=label` or `all`):** Calls `runAutoLabeler({ limit: 50, dryRun })` — for runs with completed schedules, computes `actual_dps` via canonical `dps-v2.ts`, writes the label and sets `labeling_mode='auto_cron'`.
7. **L64–67 (`step=evaluate` or `all`):** Calls `runSpearmanEvaluation()` — computes Spearman ρ between `predicted_dps_7d` and `actual_dps` across ALL labeled runs (v2-only by default), writes to `vps_evaluation`.
8. **L69–115:** Special steps (`scrape-creators`, `pattern-extract`, `pattern-metrics`, `cultural-scan`, `classify-events`, `autodream`) — NOT included in `all`. Each routes to the relevant scheduler or HTTP-fetches a sister cron.
9. **L117–123:** Returns `{ success: true, step, dry_run, elapsed_ms, results }`.
10. **L124–136:** Error handler — returns 500 with `success: false, step, error, elapsed_ms`.

**Runtime estimate:** The `all` path runs four steps in series. Per-call budgets:
- `backfillMetricSchedules` limit=100 (DB reads + writes, no external calls) → seconds.
- `runMetricCollector` limit=50 (50 TikTok metric fetches at ~1–3s each + DB writes) → 50–150s realistically; potential timeout risk if TikTok rate-limits.
- `runAutoLabeler` limit=50 (Supabase reads + DPS computation + writes) → 10–30s.
- `runSpearmanEvaluation` (reads ALL labeled rows — currently 0 in last 30d, see Section 6) → fast today (<5s).

**Verdict:** the `all` path likely runs in **60–250s** today on the current data volume, but is structurally close to the 300s Vercel Pro ceiling — `runMetricCollector` is the dominant variable.

### 2.2 Training-related library code

**`src/lib/training/` line counts** (40 TS/Python files; 22 .ts, several .py):

| File | LoC | Purpose (one-liner) |
|---|---|---|
| `trainer-engine.ts` | 1630 | Production retrain orchestrator (acquires lock, spawns Python, writes `training_experiments` row) |
| `feature-extractor.ts` | 1504 | Canonical training-time feature extraction (mirrored by `extract-prediction-features.ts` for live predicts) |
| `dps-v2.ts` | 1047 | Canonical VPS/DPS computation — single write path for labeling |
| `dataset-prep.ts` | 573 | Builds the train/holdout CSVs |
| `fresh-video-scanner.ts` | 572 | Discovery scan for new videos to label |
| `export-scraped-training-data.ts` | 553 | Exports `scraped_videos` rows into training-ready format |
| `feature-availability-matrix.ts` | 543 | Tracks which features are non-null per row |
| `backfill_fixed_features.ts` | 541 | S9 Group B+C backfill (8 columns, audio-classifier + hook sub-scores) |
| `data-quality-gate.ts` | 494 | Validates training rows before they hit the trainer |
| `spearman-evaluator.ts` | 439 | Computes Spearman ρ for active model on labeled `prediction_runs` |
| `scraped-video-quality-gate.ts` | 402 | Quality gate for scraped videos before training eligibility |
| `auto-labeler.ts` | 371 | Lenient auto-labeling cron implementation |
| `niche-creator-scraper.ts` | 356 | Apify-driven creator scraper |
| `post-promotion-validator.ts` | 335 | Validates a promoted model still performs |
| `training-executor.ts` | 298 | Older training executor (predates trainer-engine?) |
| `designate-scraped-holdout.ts` | 298 | Locks 200 videos as permanent holdout |
| `metric-collector.ts` | 280 | Fetches actual TikTok metrics into `metric_check_schedule.actual_metrics` |
| `metric-attacher.ts` | 283 | Attaches metrics to runs |
| `designate-holdout.ts` | 270 | Older 50-row holdout designator |
| `model-evaluator.ts` | 281 | Spawns `predict-xgboost.py` for Python-side eval |
| `scrape-label.ts` | 227 | Scrape + label combined helper |
| `training-eligibility.ts` | 216 | `isTrustedV2Label`, `classifyLabelCategory`, etc. |
| `training-features-export-columns.ts` | 212 | Column whitelist for export |
| `cross-niche-miner.ts` | 204 | Cross-niche feature mining |
| `dps-insights.ts` | 209 | Diagnostics over DPS distribution |
| `training-ingest-types.ts` | 192 | Shared types for ingest path |
| `tiktok-metric-fetcher.ts` | 142 | TikTok metrics HTTP client |
| `metric-scheduler.ts` | 140 | Builds `metric_check_schedule` rows at 4h/24h/48h/7d offsets |
| `promote_v15.ts` | 145 | One-shot script: registers v15 in `model_variants` and promotes it |
| `contamination-validator.ts` | 131 | Confirms no post-publication columns leak into features |
| `test_dead_features.ts` | 132 | Tests for zero-importance features |
| `run-s6-retrain.ts` | 130 | S6 retrain runner |
| `smoke_test_v15.ts` | 126 | Parity smoke test for v15 |
| `schedule-backfill.ts` | 126 | Backfills `metric_check_schedule` rows for legacy runs |
| `run_export_training_data.ts` | 148 | CLI wrapper for export |
| `smoke_vector_diff.ts` | 105 | Compares scaled-vector outputs between TS and Python |
| `follower-resolver.ts` | 67 | Resolves a creator's follower count |
| `verify_promotion.ts` | 39 | Sanity check after a model is promoted |
| `test_audio_classifier.ts` | 31 | Smoke test for audio classifier |
| `check_scraped_cols.ts` | 9 | Tiny utility |

Python: `generate_v15_artifacts.py`, `investigate_sound_type.py`, `retrain_s6.py`, `retrain_s7.py`, `smoke_crosscheck.py`, `smoke_python_preds.py`, `smoke_trace_trees.py`, `validate_s7.py`.

**`dps-v2.ts` importers** (the MEMORY entry said 19; current state is **9**):
- `src/app/api/bulk-download/calculate-dps/route.ts`
- `src/app/api/bulk-download/route.ts`
- `src/app/api/learning/update/route.ts`
- `src/app/api/operations/training/label/route.ts`
- `src/app/api/outcomes/ingest/route.ts`
- `src/app/api/training/dps-percentile/route.ts`
- `src/app/api/training/history/route.ts`
- `src/app/api/training/scrape-hashtags/route.ts`
- `src/app/api/training/scrape-profiles/route.ts`

AMBIGUOUS: the 19→9 drop may reflect refactors since the memory was written or just a different scope of grep; either way `dps-v2.ts` is still the canonical DPS computation module.

**`src/lib/training/autoresearch/` directory** (parameterized retrain wrapper around `retrain_s7.py`):

| File | LoC | One-liner |
|---|---|---|
| `autoresearch_run.py` | 593 | Parameterized Python trainer (drop/add features, exclude rows, Optuna knobs) |
| `bridge_results_to_db.ts` | 309 | TS orchestrator — acquires sandbox lock, spawns Python, writes `training_experiments` row |
| `bootstrap_validation.py` | 264 | 100-iteration bootstrap of holdout Spearman with 95% CI |
| `leaderboard_full.py` | 142 | Full results leaderboard generator |
| `leaderboard.py` | 64 | Compact leaderboard |
| `list_all_sandbox.ts` | 17 | List sandbox lock rows |
| `check_experiments.ts` | 17 | Quick experiment status check |
| `clear_stuck_lock.ts` | 33 | Releases a stuck sandbox lock |
| `_derived_smoke.py` | 38 | Smoke test for derived-feature code path |
| `run_all_cat2to5.sh` | 160 | Bash runner for batch experiments |
| `run_category1_tail.sh` | 57 | Bash runner for category 1 tail |
| `README.md` | 88 | How to run a single experiment, lock semantics, leakage ban, derived-feature whitelist |

### 2.3 Training experiments tables — live state

All counts queried 2026-05-22 via Supabase REST.

**`training_experiments`** — COUNT = **68**.
Columns: `id, program_id, experiment_type, niche_scope, description, features_used, hyperparams, training_data_rows, validation_spearman, baseline_spearman, delta, result, model_artifact_path, error_message, locked_at, created_at, experiment_mode, promoted_from_sandbox_id, validation_by_niche, feature_set`. (Note: no `status` or `notes` column — `result` and `description` are the analogues.)

Latest 20 rows (newest first, all 2026-04-18 → 2026-04-19, all `experiment_type='retrain'`):

| id | result | val_spearman | delta vs 0.6805 | description |
|---|---|---|---|---|
| f16d7473 | no_change | 0.6145 | -0.0023 | auto-044: Composite content quality index |
| d168fc54 | degraded | 0.6147 | -0.0074 | auto-043: Creator size as category — small/medium/large/huge |
| f70cac10 | degraded | 0.6153 | -0.0071 | auto-042: Duration as category — short/medium/long |
| 509add52 | degraded | 0.6149 | -0.0093 | auto-041: Cyclical posting hour — sin/cos encoding |
| 83e6ff7a | degraded | 0.6140 | -0.0064 | auto-040: Interaction `hook_score * creator_followers_log` |
| f2017c94 | degraded | 0.6155 | -0.0084 | auto-034: Halve learning rate (0.003-0.007) |
| 3a6e78fe | no_change | 0.6168 | -0.0009 | auto-033: 1000 estimators with early stopping (patience 50) |
| 214f12da | no_change | 0.6135 | -0.0037 | auto-032: Deeper trees max_depth 8-10 |
| f16b2cbd | no_change | 0.6135 | -0.0047 | auto-031: Shallower trees max_depth 3-4 |
| 36cac849 | degraded | 0.6155 | -0.0192 | auto-030: Doubling Optuna trials 100→200 |
| 7e7b1591 | degraded | 0.6449 | -0.0242 | auto-023: Exclude videos older than 12 months |
| dd579d5c | **improved** | 0.6148 | **+0.0227** | auto-022: Exclude creators with <5K followers |
| 9a3fea65 | degraded | 0.6056 | -0.0557 | auto-021: Exclude rows where >30% content features NaN |
| 675d52cc | degraded | 0.5616 | -0.0544 | auto-020: Remove DPS outliers (>95 or <5) |
| 18f25746 | degraded | 0.6102 | -0.0094 | auto-017: Drop text/caption features |
| a895a1cf | degraded | 0.6114 | -0.0100 | auto-016: Drop Gemini LLM-scored features |
| 324d2f92 | no_change | 0.6152 | -0.0033 | auto-015: Drop all thumbnail features |
| 47905885 | degraded | 0.6042 | -0.0378 | auto-014: Drop resolution height + width |
| 940fd269 | degraded | 0.6013 | -0.0345 | auto-013: Top-40 features |
| 0c4c9404 | degraded | 0.4650 | -0.1557 | auto-010: Content-only ceiling (remove all context) |

Result tallies across all 68 rows:
- retrain × improved: 3
- retrain × degraded: 25
- retrain × no_change: 7
- retrain × error: 5
- retrain × inconclusive_tiny_sample: 1
- feature_add × improved: 1
- feature_add × inconclusive_tiny_sample: 20
- feature_add × error: 2
- feature_remove × improved: 1
- feature_remove × degraded: 1
- feature_remove × error: 1
- feature_remove × inconclusive_tiny_sample: 1

**Note on auto-022 "improved":** `validation_spearman=0.6148` but `delta=+0.0227`. AMBIGUOUS — looks like the row stored CV mean while delta was computed on holdout (which was 0.703 in `results-autoresearch/auto-022/results.json`-equivalent). The bridge writes `delta` from `holdout_spearman - V15_HOLDOUT_SPEARMAN`, so the +0.0227 number is the *holdout* delta. The S9 bootstrap (see Section 5) confirmed auto-022 was a chance peak, not a stable improvement.

**`model_variants`** — COUNT = **7** (rows already shown in Section 1.1).

**`s6_training_experiments`** — COUNT = **0**. Table exists but is empty (Content-Range `*/0`).

**`model_promotion_log`** — COUNT = **1**.

| id | action | from variant | to variant | niche | before ρ | after ρ | delta | reason | created_at |
|---|---|---|---|---|---|---|---|---|---|
| 1a4e5063… | promote | 2f980950 (v10) | e7be3eb4 (v15-honest-with-res) | null | 0.7811 | 0.6805 | **-0.1006** | "Promoted to production after S7 validation audit (Prompt 2, 2026-04-17). Holdout Spearman 0.6805 on 200 held-out videos from 5,645 diverse training set." | 2026-04-17 |
| (post_validation fields) | post_validation_status=null, post_validation_attempts=0, post_validation_checked_at=null, post_validation_spearman=null, post_validation_sample_size=null |

Promotion was operator-driven (`triggered_by='chairman'`). Post-promotion validation never ran (all fields null). v10 had a higher reported holdout ρ (0.7811) but on only 50 held-out rows from an 863-row dataset — the v15 number is on 200 held-out rows from 5,645, so it is the more trustworthy estimate.

**`candidate_features`** — COUNT = **3** (all `status='untested'`, all created 2026-04-11 as Prompt 41 seed rows):

| feature_name | status | spearman_delta | source / hint |
|---|---|---|---|
| `hook_word_count` | untested | null | "Number of words in the first 1.5s of transcript" — needs Whisper segments |
| `on_screen_text_density` | untested | null | "Count of distinct on-screen text overlays per second in first 5s" — needs Pack V vision pass |
| `audio_onset_count` | untested | null | "Number of audio onsets in first 3s" — needs librosa onset detection |

None tested. The Feature Discovery coordinator that was supposed to test these (per `20260411_prompt41_candidate_features.sql`) hasn't run.

---

## SECTION 3 — FEATURES

### 3.1 Currently active feature set

The active v15 model uses **91 features** (per `models/xgboost-v15-features.json`, count=91). The TS scaler in `xgboost-inference.ts:223` consumes them; the live extractor `src/lib/prediction/extract-prediction-features.ts` initializes all of them (the v10 superset of 58 + the 33 v15-extras, with `creator_followers_log_computed` derived inside the scaler).

Categorization (per the source field in `extract-prediction-features.ts`):

#### STATIC_CONTENT — features computed from the video file itself (75)

| Feature | Type | Source | Extractor |
|---|---|---|---|
| `ffmpeg_scene_changes` | float | FFmpeg scene detect | `analyzeVideoCanonical` (L243) |
| `ffmpeg_cuts_per_second` | float | FFmpeg | same |
| `ffmpeg_avg_motion` | float | FFmpeg | same |
| `ffmpeg_color_variance` | float | FFmpeg | same |
| `ffmpeg_brightness_avg` | float | FFmpeg | same |
| `ffmpeg_contrast_score` | float | FFmpeg | same |
| `ffmpeg_resolution_width` | int | FFmpeg | same |
| `ffmpeg_resolution_height` | int | FFmpeg | same |
| `ffmpeg_duration_seconds` | float | FFmpeg | same |
| `ffmpeg_bitrate` | int | FFmpeg | same |
| `ffmpeg_fps` | float | FFmpeg | same |
| `audio_pitch_mean_hz` | float | Audio prosodic | `analyzeProsody` (L299) |
| `audio_pitch_variance` | float | prosodic | same |
| `audio_pitch_range` | float | prosodic | same |
| `audio_pitch_std_dev` | float | prosodic | same |
| `audio_pitch_contour_slope` | float | prosodic | same |
| `audio_loudness_mean_lufs` | float | prosodic (ebur128) | same |
| `audio_loudness_range` | float | prosodic | same |
| `audio_loudness_variance` | float | prosodic | same |
| `audio_silence_ratio` | float | prosodic (silencedetect) | same |
| `audio_silence_count` | int | prosodic | same |
| `speaking_rate_wpm` | float | derived (word_count / duration × 60) | L286–290 |
| `visual_scene_count` | int | `VisualSceneDetector.buildResult` | L261 |
| `visual_avg_scene_duration` | float | derived | L264 |
| `visual_score` | float | `VisualSceneDetector` | L266 |
| `thumb_brightness` | float | `ThumbnailAnalyzer.buildResult` | L273 |
| `thumb_contrast` | float | same | same |
| `thumb_colorfulness` | float | same | same |
| `thumb_overall_score` | float | same | same |
| `thumb_confidence` | float | same | same |
| `hook_score` | float | `HookScorer.analyze(text)` | L228 |
| `hook_confidence` | float | same | same |
| `hook_text_score` | float | same | same |
| `hook_type_encoded` | int | `HOOK_TYPE_MAP[hookType]` | L235 |
| `hook_motion_ratio` | float | `extractSegmentFeatures` | L329 |
| `hook_audio_intensity` | float | same | same |
| `hook_face_present` | bool | `extractVisionHookFeatures` (Gemini Vision) | L344 |
| `hook_text_overlay` | bool | same | same |
| `hook_composition_score` | float | same | same |
| `hook_emotion_intensity` | float | same | same |
| `text_word_count` | int | text features | L209 |
| `text_sentence_count` | int | same | same |
| `text_question_mark_count` | int | same | same |
| `text_exclamation_count` | int | same | same |
| `text_transcript_length` | int | same | same |
| `text_avg_sentence_length` | float | same | same |
| `text_unique_word_ratio` | float | same | same |
| `text_avg_word_length` | float | same | same |
| `text_syllable_count` | int | same | same |
| `text_flesch_reading_ease` | float | same | same |
| `text_has_cta` | bool | CTA word match | same |
| `text_positive_word_count` | int | same | same |
| `text_negative_word_count` | int | same | same |
| `text_emoji_count` | int | same | same |
| `retention_open_loop_count` | int | `extractContentStrategyFeatures` | L213 |
| `share_relatability_score` | float | same | same |
| `share_utility_score` | float | same | same |
| `psych_curiosity_gap_score` | float | same | same |
| `psych_power_word_density` | float | same | same |
| `psych_direct_address_ratio` | float | same | same |
| `psych_social_proof_count` | int | same | same |
| `specificity_score` | float | `extractSpecificityScoreLive` | L412 |
| `instructional_density` | float | `extractInstructionalDensityLive` | L412 |
| `has_step_structure` | bool | derived in same fn | same |
| `hedge_word_density` | float | `extractHedgeWordDensityLive` | L412 |
| `vocal_confidence_composite` | float | derived from prosodic | L361 |
| `meta_duration_seconds` | float | alias of ffmpeg_duration | L286 |
| `meta_words_per_second` | float | derived | L289 |
| `audio_energy_buildup` | float | segment features | L329 |
| `scene_rate_first_half_vs_second` | float | segment features | same |
| `visual_variety_score` | float | segment features | same |
| `visual_proof_ratio` | float | Gemini Vision frame classifier | L366 |
| `talking_head_ratio` | float | same | same |
| `text_overlay_density` | float | same | same |
| `duration_seconds` | float | v15 alias of ffmpeg_duration | L407 |

#### STATIC_CONTEXT — features from creator profile + caption metadata at snapshot time (11)

| Feature | Type | Source | Extractor |
|---|---|---|---|
| `creator_followers_log` | float | log10(input.creatorFollowerCount+1) | L382 |
| `creator_followers_count` | int | input | L385 |
| `creator_followers_log_computed` | float | derived **inside scaler** (`xgboost-inference.ts:292`) | scaler pass 2 |
| `meta_creator_followers` | int | duplicate of count | L386 |
| `meta_creator_followers_log` | float | duplicate of log | L387 |
| `creator_verified` | bool | NOT populated at predict time (null) | n/a (training-only from scrape) |
| `hashtag_count` | int | parsed from caption | L396 |
| `meta_hashtag_count` | int | duplicate | L397 |
| `has_fyp_hashtag` | bool | caption parse | L398 |
| `meta_has_viral_hashtag` | bool | caption parse | L399 |
| `sound_type` | string-encoded | NOT populated at predict time (null) | n/a (training-only) |
| `music_is_original` | bool | NOT populated at predict time (null) | n/a (training-only) |

Source comments at L195–197 of `extract-prediction-features.ts`: `sound_type / music_is_original / posted_* / creator_verified are only known when the video comes from TikTok metadata. Null at local-predict time — XGBoost's default_left branch absorbs missing values.`

#### TRAINING-ONLY CONTEXT — present in v15 feature list but **always null at live predict time** (5)

| Feature | Why null at predict |
|---|---|
| `post_hour_utc` | "training-only context; the video hasn't been posted yet" (L177) |
| `post_day_of_week` | same |
| `posted_hour_utc` | same (v15 duplicate name) |
| `posted_day_of_week` | same |
| `creator_verified` | only known if scraped from TikTok |

#### DYNAMIC_CREATOR — none
No feature in the active set tracks creator trajectory over time.

#### DYNAMIC_TREND — none
No feature in the active set tracks topic/sound momentum.

**Summary:** **0 of 91 active features are dynamic.** The model is entirely static-content + static-context. This matches the autoresearch experiments that tried (and failed) to add trajectory/cyclical/interaction features (auto-040 to auto-043) — none beat baseline.

### 3.2 Backfilled features

References to backfill in source/migrations/markdown:

- `src/lib/training/backfill_fixed_features.ts:6-15` — S9 Phase 2 Groups B+C backfill. **8 target columns** in `training_features`:
  - Group C (audio classifier, 4 cols): `audio_music_ratio`, `audio_speech_ratio`, `audio_type_encoded`, `audio_energy_variance`
  - Group B (hook sub-scores, 4 cols): `hook_audio_score`, `hook_visual_score`, `hook_pace_score`, `hook_tone_score`
  - Comment at L15–17: `hook_pace_score requires Whisper segment timestamps and will remain 0 until Group A (Whisper backfill) runs.`
- `src/lib/training/schedule-backfill.ts` (126 LoC) — backfills `metric_check_schedule` rows for legacy `prediction_runs` with TikTok URLs. Not feature backfill; schedule backfill.
- `src/lib/backfill/backfill-actual-performance.ts` — fills `prediction_runs.actual_performance` from `actual_dps`.
- `src/lib/backfill/backfill-follower-counts.ts`, `src/lib/backfill/backfill-training-features.ts` — older backfills.
- `supabase/migrations/20260216_backfill_schedule_tiktok_urls.sql` — migration to backfill TikTok URL into source_meta.
- `results-autoresearch/bootstrap_validation_s9/backfill_run.log` — S9 backfill completed 2026-04-20T23:59:28Z. **Final tally:** total=5845, download_ok=5660, download_fail=284, extract_ok=5561, db_ok=5559, db_fail=2. (Group A — Whisper — was NOT done; only Groups B + C.)

The "8 features" reference is the S9 B+C backfill set above. `hook_pace_score` remained 0 because Whisper segments (Group A) were never backfilled. Per the active memory entry: v16-candidate (which included the 7 backfilled cols, excluding the still-dead `hook_pace_score`) finished at ρ=0.6752 vs v15's 0.6805 — i.e. the backfilled features added noise-level signal.

### 3.3 Planned-but-not-yet-active features

From `candidate_features` (full row dump):

| feature_name | status | description | data source needed | populated by which cron? |
|---|---|---|---|---|
| `hook_word_count` | untested | First 1.5s of transcript word count | Whisper segments | **None.** No cron populates Whisper segments. |
| `on_screen_text_density` | untested | Distinct on-screen overlays per second, first 5s | Pack V vision output | **None.** Pack V runs in live prediction; no cron writes its output into training features. |
| `audio_onset_count` | untested | librosa onset detection, first 3s | librosa | **None.** No librosa in the repo. |

The Feature Discovery coordinator handler at `src/lib/coordinator/handlers/feature-discovery.ts:102` reads `candidate_features` rows with `status='untested'`, but the coordinator only runs when manually triggered — there is no Vercel cron wired to it.

### 3.4 Whisper / speaking-rate / transcription

Whisper-related code in the repo:

- `src/lib/services/whisper-service.ts` (the service module) — `extractAudioFromVideo` + `transcribeVideo` via OpenAI Whisper API (`whisper-1` model). Returns `WhisperTranscriptionResult` including segments with `avgLogProb` and `noSpeechProb`.
- `src/app/api/admin/super-admin/quick-predict/route.ts:8,206-211` — imports `transcribeVideo`, calls it on demand, falls back if Whisper fails.
- `src/app/api/admin/transcribe/route.ts:97-103` — admin route, uses OpenAI `audio.transcriptions.create({ model: 'whisper-1' })`.
- `src/app/api/openai/transcribe/route.ts:28-30` — public-ish transcribe endpoint, same model.
- `src/lib/components/hook-scorer.ts:28,308` — accepts `whisperSegments?: Array<{ start, end, text }>` and uses them when present for pace scoring. Without segments, falls back to text-only scoring.
- `src/app/api/admin/run-feature-decomposer/route.ts:59` — message: "OCR/transcription may be disabled".
- `src/grpc/services/viral-prediction-service.ts:203` — `whisper_embeddings: []` — placeholder.
- `src/app/api/calibration/diagnose/route.ts:41` — `'whisper': 'Whisper Transcription'` (UI label).
- `src/app/api/training/export/route.ts:60,253,320,348` — `transcription_source` column is exported into training CSV.

Status of Whisper in the active pipeline:
- **Available:** `whisper-service.ts` works (OpenAI Whisper API).
- **Live predict path:** `runPredictionPipeline.ts` does NOT call Whisper. The transcript is passed in as `input.transcript` from upstream (the upload-test page already-transcribed flow or quick-predict's own Whisper call).
- **Training feature path:** `speaking_rate_wpm` is computed as `text_word_count / ffmpeg_duration_seconds * 60` (`extract-prediction-features.ts:288`). It needs a transcript, not segments. So `speaking_rate_wpm` IS populated whenever a transcript is available, but only as a single number, not per-segment.
- **Whisper segments at training time:** the S9 Whisper backfill (Group A) was planned but never executed (per `backfill_fixed_features.ts:15` comment and per the S9 status entry in MEMORY.md). Without Group A, `hook_pace_score` is stuck at 0 across all training rows, which is why it appeared "DEAD, 1 unique value" in the v16 feature audit (memory entry).

---

## SECTION 4 — SIGNAL COLLECTION CRONS

### 4.1 cultural-scan cron

**File:** `src/app/api/cron/cultural-scan/route.ts`
**Line count:** 557 lines (the largest cron route in the repo).
**Vercel config:** `dynamic = 'force-dynamic'`, `maxDuration = 300` (L18).

**External services:**
- `https://www.reddit.com/r/{subreddit}/top.json?t=week&limit=25` — public Reddit API, no auth (L86–87). User-Agent `Trendzo-Cultural-Scanner/1.0`.
- Google Gemini via `@google/genai` (`gemini-2.5-flash`) — two uses: (1) Twitter trend search via `tools: [{ googleSearch: {} }]` grounding (L254–261), (2) Trend synthesis LLM call (L410–414).

**Tables written:**
- `cultural_scan_results` (upsert on `niche,source,subreddit,scan_date`) — raw Reddit + Twitter data per niche per day.
- `detected_trends` (insert / upsert) — synthesized trends with `velocity_score`, `confidence`, `sources`, `evidence`, `detected_date`.
- `integration_job_runs` (upsert `job='cultural_scanner'`) — last-run timestamp.

**Plain English flow:**
1. Auth-gate on `CRON_SECRET` if set (L494).
2. Parse `niche` and `phase` (reddit / twitter / synthesize / all) query params.
3. For 20 niches (hard-coded `NICHE_SUBREDDITS` and `NICHE_TWITTER_TERMS` maps), do three phases:
   - **Phase 1 (Reddit):** for each of 5 subreddits per niche, fetch top-25 weekly posts, extract themes (TF-IDF-style bigram weighting from `extractThemes` L127), upsert into `cultural_scan_results`. 1.5s delay between subreddits, 1s between niches.
   - **Phase 2 (Twitter):** Gemini search-grounded prompt finds 5–8 trending topics per niche; upsert into `cultural_scan_results` with `source='twitter'`. 2s delay between calls.
   - **Phase 3 (Synthesize):** Gemini synthesizes 3–5 cross-source trend summaries per niche; insert into `detected_trends`. 1.5s delay between niches.
4. Update `integration_job_runs`.

**Live state (queried 2026-05-22):**
- `detected_trends` COUNT = **8**. MAX(detected_date) = 2026-04-21. MAX(created_at) = 2026-04-21T14:17:39Z.
- `cultural_events` COUNT = **11**. Status: 10 `approved`, 1 `expired`. Newest 2026-04-21T14:20:22Z.

**Interpretation:** the cron last produced new trends on 2026-04-21. Either it has not run since (which contradicts the scheduled `30 0 * * *` daily slot — see 4.4) or it has run and found no new trends to insert, or the niche set has been silent. AMBIGUOUS without a job-run log inspection.

### 4.2 classify-events cron

**File:** `src/app/api/cron/classify-events/route.ts`
**Line count:** 239 lines.
**Vercel config:** `dynamic = 'force-dynamic'`, `maxDuration = 120` (L20).

**External services:** Google Gemini `gemini-2.5-flash` via `@google/genai`, single call (no Google Search grounding).

**Tables written:**
- `cultural_events` (insert) — classified events with taxonomy (who/what/where/when/why/how), `decay_rate_estimate`, `activated_niches`, `keywords`, `expires_at`, status.
- `integration_job_runs` (upsert `job='event_classifier'`).

**Plain English flow:**
1. Auth-gate on `CRON_SECRET` (L111).
2. Fetch up to 20 most-recent `detected_trends` (optionally niche-scoped, L129–133).
3. Cross-check against `cultural_events.source_trend_ids` to filter out already-classified trends (L150–160).
4. Send unclassified trends as one prompt to Gemini (L88–93). Asks for `event_title`, `event_summary`, `taxonomy{who/what/where/when/why/how}`, `decay_rate` (0–1), `activated_niches` (multi-niche), `keywords` (5–10 lowercase), `expires_in_days` (1–90).
5. Auto-approve when source trend's `confidence >= AUTO_APPROVE_THRESHOLD = 0.8` (L185). Set `status='approved'` + `reviewed_by='auto'`; otherwise `status='detected'`.
6. Insert one row per event.

LLM prompt (literal, L65–88 trimmed):
> You are a cultural intelligence classifier for a content creation platform. Classify each detected trend into an actionable cultural event. ... For each trend, produce: event_title (5-10 words headline), event_summary (1-2 sentences actionable for creators), taxonomy {who, what, where, when, why, how}, decay_rate (0.0 evergreen → 1.0 expired), activated_niches (array), keywords (5-10 lowercase), expires_in_days (1-90). Return ONLY a JSON array.

### 4.3 atlas/feedback-collector cron

**File:** `src/app/api/atlas/feedback-collector/route.ts`
**Line count:** 172 lines.
**Vercel config:** `dynamic = 'force-dynamic'`. **No `maxDuration` export** (defaults to 10s on Vercel free / 60s default Hobby unless overridden — Pro default 15s for /api/, AMBIGUOUS without Vercel project tier).

**External services:** none (pure Supabase reads + writes).

**Tables read:** `prediction_runs.{id, predicted_dps_7d, actual_dps, prediction_error, source_meta, created_at}` filtered to last 30 days where both predicted and actual are non-null (L66–73). Limit 10,000.

**Tables written:**
- `atlas_accuracy_summary` (insert) with: `period_start`, `period_end`, `niche`, `total_predictions`, `avg_delta`, `median_delta`, `spearman_correlation`, `accuracy_bucket` (JSONB with `within_10pct`, `within_25pct`, `over_25pct`, `by_niche`, `niche_unresolved_count`).

**Plain English flow:**
1. Auth gate (L152).
2. Read labeled `prediction_runs` from last 30 days.
3. Compute Spearman ρ via in-line implementation (L30–44).
4. Compute |Δ| stats: avg, median, within-10, within-25, over-25.
5. Per-niche breakdown from `source_meta.niche`.
6. Insert one summary row.

**Live state (queried 2026-05-22):**
- `atlas_accuracy_summary` COUNT = **1**. Latest (and only) row:
  - period_start=2026-03-22, period_end=2026-04-21
  - total_predictions=**41**
  - avg_delta=**37.98**, median_delta=**38.94**
  - spearman_correlation=**0.2441**
  - accuracy bucket: within_10pct=0, within_25pct=3, over_25pct=38
  - all 41 niche_unresolved (no `source_meta.niche`)
  - created_at=2026-04-21T14:17:48Z

**Interpretation:** the most recent summary (2026-04-21) shows ρ=0.2441 on 41 labeled runs over a 30-day window — *much* worse than the 0.6805 reported on the curated 200-row holdout. This is the gap between curated holdout performance and live-traffic performance, and is the single most important data point in this audit. The collector should have run daily since 2026-04-21 but only one row exists, so either the cron hasn't fired or every subsequent fire saw "no new labeled rows" and the insert path inserts even when total=0 (per L78–84, it returns early before insert if total=0 — so it would not insert a zero-row summary). That explains why only one row exists.

**Aside:** Current `prediction_runs` COUNT = **258 total**, MAX(created_at) = **2026-04-01**. There have been zero new prediction_runs in the last 30 days (last is 51 days old). This is the upstream reason the feedback collector has not produced new summaries.

### 4.4 vercel.json snapshot

Full contents of `vercel.json`:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    { "path": "/api/cron/recency-decay",        "schedule": "0 3 * * 0" },
    { "path": "/api/freedom-agent/weekly-checkin", "schedule": "0 10 * * 1" },
    { "path": "/api/atlas/feedback-collector",  "schedule": "0 6 * * *" },
    { "path": "/api/cron/cultural-scan",        "schedule": "30 0 * * *" },
    { "path": "/api/cron/classify-events",      "schedule": "0 1 * * *" },
    { "path": "/api/cron/overnight-triage",     "schedule": "0 6 * * *" }
  ]
}
```

Comparing against the SUBSTRATE_AUDIT_2026-04-21 list:

| Cron | Audit said | Actual today | Schedule |
|---|---|---|---|
| recency-decay | scheduled (weekly) | ✅ scheduled | `0 3 * * 0` (weekly Sun 03:00 UTC) |
| freedom-agent/weekly-checkin | scheduled (weekly) | ✅ scheduled | `0 10 * * 1` (weekly Mon 10:00 UTC) |
| atlas/feedback-collector | scheduled (6h) | ✅ scheduled, **NOT 6h** — daily 06:00 UTC | `0 6 * * *` |
| cultural-scan | NOT scheduled | ✅ **now scheduled** (changed since audit) | `30 0 * * *` (daily 00:30 UTC) |
| classify-events | NOT scheduled | ✅ **now scheduled** (changed since audit) | `0 1 * * *` (daily 01:00 UTC) |
| overnight-triage | NOT scheduled | ✅ **now scheduled** (changed since audit) | `0 6 * * *` (daily 06:00 UTC) |
| autodream | NOT scheduled | ❌ still NOT scheduled | — |
| training-pipeline | NOT scheduled | ❌ still NOT scheduled | — |
| consolidate-memory | NOT scheduled | ❌ still NOT scheduled | — |
| auto-nudge-unacknowledged | (not mentioned) | ❌ NOT scheduled | route file exists |
| generate-recipes | (not mentioned) | ❌ NOT scheduled | route file exists |
| process-scheduled-actions | (not mentioned) | ❌ NOT scheduled | route file exists |

The audit's note that `atlas/feedback-collector` runs "6h" appears to have been incorrect — the schedule has always been daily (`0 6 * * *`) per the file. AMBIGUOUS whether the audit was wrong or the schedule was changed since.

`src/app/api/cron/` contains 9 route files total. 5 of them (`auto-nudge-unacknowledged`, `autodream`, `consolidate-memory`, `generate-recipes`, `process-scheduled-actions`, `training-pipeline`) are unscheduled.

---

## SECTION 5 — AUTORESEARCH / SANDBOX HISTORY

### 5.1 Autoresearch directory

**Path:** `src/lib/training/autoresearch/`
**File count:** 13 files (10 source + `README.md` + `__pycache__` + 2 shell scripts).
**Total lines (source only):** 1,792 (autoresearch_run 593 + bridge 309 + bootstrap 264 + leaderboard_full 142 + leaderboard 64 + list 17 + check 17 + clear_lock 33 + _derived_smoke 38 + run_all_cat2to5.sh 160 + run_category1_tail.sh 57) + README 88.
**Newest mtime:** `results-autoresearch/bootstrap_validation_s9/backfill_run.log` modified 2026-04-20T23:59:28Z; latest experiment output `results-autoresearch/auto-044/results.json` 2026-04-19T08:04.

`src/lib/autoresearch/` does NOT exist as a sibling — the autoresearch code lives entirely under `src/lib/training/autoresearch/`.

### 5.2 Sandbox output files

Full inventory of `data/sandbox/` (sizes in bytes, mtimes preserved):

```
cleaning-report.json                          397   2026-04-10
crash-test.txt                                ~     2026-04-XX (Python smoke test stdout)
exp-C-log.txt / exp-C-stderr.txt              ~     experiments C log/stderr
exp-D-log.txt / exp-D-stderr.txt              ~     experiments D log/stderr
retrain-evaluation.json                       12217 2026-04-01  ← v11 sandbox LOOCV report
test-imports.txt, test-output.txt, …          ~     misc smoke output
v12-training-data.json                        11,685,007  2026-04-08 (largest)
v12-training-log.txt                          empty (zero bytes)
v13-sandbox-report.md                         ~     2026-04-08 22:42  ← v13 sandbox markdown report
v14-clean-log.txt                             ~     2026-04-10
v14-log.txt / v14-stderr.txt / v14-stdout.txt empty (zero bytes)
verbose-import.txt                            ~     Python import trace

xgboost-v11-sandbox-features.json             1519   2026-04-01
xgboost-v11-sandbox-metadata.json             2662   2026-04-01
xgboost-v11-sandbox-scaler.json               3646   2026-04-01
xgboost-v11-sandbox.model                     394573 2026-04-01
xgboost-v12-sandbox-features.json             1460   2026-04-08
xgboost-v12-sandbox-metadata.json             5707   2026-04-08
xgboost-v13-sandbox-features.json             1519   2026-04-08
xgboost-v13-sandbox-metadata.json             6853   2026-04-08
xgboost-v13-sandbox-model.json                9976053 2026-04-08
xgboost-v14-clean-sandbox-features.json       1519   2026-04-10
xgboost-v14-clean-sandbox-holdout-ids.json    4600   2026-04-10
xgboost-v14-clean-sandbox-metadata.json       6542   2026-04-10
xgboost-v14-clean-sandbox-model.json          5477934 2026-04-10
xgboost-v14a-sandbox-features.json            1519   2026-04-09
xgboost-v14a-sandbox-metadata.json            3179   2026-04-09
xgboost-v14a-sandbox-model.json               818761 2026-04-09
xgboost-v14b-sandbox-features.json            1519   2026-04-09
xgboost-v14b-sandbox-metadata.json            3169   2026-04-09
xgboost-v14b-sandbox-model.json               8046485 2026-04-09
xgboost-v14c-sandbox-features.json            1519   2026-04-09
xgboost-v14c-sandbox-metadata.json            2926   2026-04-09
xgboost-v14c-sandbox-model.json               6027627 2026-04-09
xgboost-v14d-sandbox-features.json            1519   2026-04-10
xgboost-v14d-sandbox-metadata.json            2928   2026-04-10
xgboost-v14d-sandbox-model.json               2998494 2026-04-10
```

Most recent file: `xgboost-v14d-sandbox-model.json` 2026-04-10 01:06.

**First 50 lines of the v13 sandbox report** (`data/sandbox/v13-sandbox-report.md`, most recent markdown):

```
# v13 Sandbox Retrain Report
**Date:** 2026-04-08 22:42
**Script:** scripts/train-v13-sandbox.py
**XGBoost:** 3.2.0 (Python — real, not Node.js)
**Optuna:** 4.7.0 (100 trials)
**NaN handling:** Native XGBoost (NOT fillna(0))

## 3 Fixes Applied
1. v12 used Node.js histogram GBM → real Python XGBoost 3.2.0
2. fillna(0) — pitch_mean_hz=0 means "no pitch" → NaN preserved
3. Optuna tuned for 863 rows (v8) → re-tuned for 6629 rows

## Dataset
v10:  Training 813, Holdout 50, DPS mean 49.46 std 18.05
v13-sandbox: Training 6629, Holdout 50, DPS mean 56.89 std 26.86

## Timing Features A/B Test
A (WITH timing) vs B (WITHOUT timing):
  CV Spearman:    0.5609 ± 0.0102  vs  0.5505 ± 0.0103  → +0.0104
  Holdout ρ:      0.3726           vs  0.3706
**Verdict:** timing helps; winner = A.

## Head-to-Head v10 vs v13-sandbox
  CV ρ:      0.7399 (v10)  vs  0.5609 (v13)  Δ=-0.1790
  Holdout ρ: 0.7811 (v10)  vs  0.3726 (v13)  Δ=-0.4085
  MAE:       13.13         vs  17.28         Δ=+4.14

## Top Features (v13)
1. ffmpeg_resolution_height (0.1232)
2. ffmpeg_resolution_width (0.0509)
3. ffmpeg_fps (0.0417)
4. visual_avg_scene_duration (0.0315)
5. creator_followers_log (0.0295)
6. visual_proof_ratio (0.0216)
7. post_day_of_week (0.0204)
8. text_has_cta (0.0202)
9. instructional_density (0.0186)
10. ffmpeg_duration_seconds (0.0174)
```

**First 50 lines of `data/sandbox/retrain-evaluation.json`** (v11 LOOCV report):

```
model_version:    v11-sandbox
training_rows:    45
feature_count:    58
avg_features_per_row: 19.3
evaluation_method: LOOCV
v10_baseline.spearman_on_17_rows: 0.61
v10_baseline.holdout_spearman:    0.7811
v11_sandbox.loocv_spearman:        0.3209  (p=0.0316)
v11_sandbox.loocv_mae:             18.17
v11_sandbox.loocv_within_5:        28.9%
v11_sandbox.loocv_within_10:       40.0%
delta.spearman_vs_baseline:        -0.2891
per_tier:
  below-average: 11 rows, 0% exact, 90.9% adjacent
  average:       22 rows, 81.8% exact, 100% adjacent
  above-average: 10 rows, 50% exact, 100% adjacent
  viral:          2 rows, 0% exact, 0% adjacent
top_features:
  1. hook_type_encoded (0.1429)
  2. visual_scene_count (0.0808)
  3. text_exclamation_count (0.0777)
  4. hook_confidence (0.0752)
  5. instructional_density (0.0731)
  …
```

### 5.3 Repo-root experiment reports

Result-report markdowns in the repo root:

| File | mtime | First-line gist |
|---|---|---|
| `MODEL_TRAINING_SUCCESS.md` | 2026-01-28 21:17 | "🎉 XGBoost Model Training - EXCEPTIONAL RESULTS" — v5-era report claiming R²=0.970 (heavily contaminated by including `dps_score` itself as a feature; superseded by everything after) |
| `TRAINING_COMPLETE_116_VIDEOS.md` | 2026-01-28 21:17 | Same era, 116-video training set |
| `SANDBOX_INTEGRATION_SUMMARY.md` | 2026-01-28 21:17 | Sandbox integration notes |
| `SANDBOX_REUSE_MAP.md` | 2026-01-28 21:17 | What sandbox artifacts to reuse |
| `README_SANDBOX_WORKFLOW.md` | 2026-01-28 | Sandbox workflow guide |
| `FEATURE_SCORECARD.md` | 2026-03-18 19:59 | Feature scorecard (most recent feature audit) |
| `FEATURE_EXTRACTION_COMPLETE.md` | (older) | Feature extraction status |
| `FEATURE_EXTRACTION_VERIFICATION.md` | (older) | Verification notes |
| `KAI_FEATURE_EXPANSION_PLAN.md` | (older) | Plan doc |

No `AUTORESEARCH_*.md`, `MODEL_*.md`, or `EXPERIMENT_*.md` files exist at the repo root.

**Phase 3 chain logs** (`results-autoresearch/phase3_chain_logs/`):

```
CHAIN_COMPLETE        (empty marker file)
chain.log:
  CHAIN START 2026-04-21T06:35:52
  === Phase 2D: run_export_training_data.ts @ 06:35:52 ===
  === Phase 2D OK @ 06:36:10 ===
  === Phase 3a: v16-candidate @ 06:36:10 ===
  === v16-candidate OK @ 07:05:08 ===
  === Phase 3b: v16-control @ 07:05:08 ===
  === v16-control OK @ 07:43:59 ===
  === CHAIN COMPLETE @ 07:44:00 ===

v16-candidate.log:
  trial 100/100, best CV Spearman: 0.6146
  CV=0.6146 +/- 0.0205   HOLDOUT Spearman = 0.6752   MAE=15.5608

v16-control.log:
  trial 100/100, best CV Spearman: 0.6139
  CV=0.6139 +/- 0.0184   HOLDOUT Spearman = 0.6692   MAE=15.7298
```

This corroborates the active memory entry: v16 (with the 7 backfilled S9-Group-B+C features) finished at ρ=0.6752 vs v15's ρ=0.6805 — a regression of 0.0053. v16-candidate (with backfill) only beat v16-control (without) by 0.0060, well within noise.

**Bootstrap validation** (`results-autoresearch/bootstrap_validation_s9/`):
- `bootstrap_results.json`: 100-iteration bootstrap (2026-04-19) of auto_022. Mean ρ=0.6029, CI95=[0.5758, 0.6260], std=0.0138. **The originally-reported +0.0227 delta vs v15 was inside the bootstrap CI — i.e. not a real improvement, just chance.**
- `backfill_run.log`: S9 Group B+C backfill ran 2026-04-19 → 2026-04-20T23:59, processed 5845 video_ids, 5559 DB updates succeeded.
- `backfill_stdout.log`, `backfill_checkpoint.json`: live state during the backfill.

---

## SECTION 6 — DATA INVENTORY

All queries run 2026-05-22 via Supabase REST against the production database (read-only, service-role key).

### 6.1 scraped_videos

| Query | Value |
|---|---|
| `SELECT COUNT(*)` | **6,718** |
| `WHERE dps_score IS NOT NULL` | **6,679** |
| `WHERE training_eligible = true` | **5,845** |
| `WHERE is_holdout = true` | **200** |
| Per-niche breakdown | **side-hustles: 6,718.** All other 19 niches (`personal-finance`, `fitness`, `business`, etc.): 0. **One niche only.** |
| MAX(created_at_utc) | **2026-03-30T22:20:51Z** (~53 days old) |

### 6.2 prediction_runs

| Query | Value |
|---|---|
| `SELECT COUNT(*)` | **258** |
| `WHERE is_holdout = true` | **63** |
| `WHERE created_at > NOW() - INTERVAL '30 days'` (i.e. > 2026-04-22) | **0** |
| MAX(created_at) | **2026-04-01T13:58:51Z** (51 days old) |

There have been zero new live predictions in the last 51 days. This is why `atlas_accuracy_summary` has not picked up new rows since 2026-04-21.

### 6.3 Holdout / test data

Holdout designation lives in **two places**:

- `prediction_runs.is_holdout` (boolean, default false) — migration `supabase/migrations/20260413_holdout_lock.sql:6`. Comment: "Permanent holdout lock. Once true, must never be set false. Never include in training queries." Companion column `holdout_locked_at TIMESTAMPTZ`. Index `idx_prediction_runs_holdout`. Current count: **63 rows locked.**
- `scraped_videos.is_holdout` + `holdout_locked_at` — same lock semantics, current count: **200 rows locked.** This is the v15 holdout set (200 rows from 5,645 training set, matching the `holdout_rows: 200` in v15 metadata).
- `models/holdout-video-ids.json` (1,710 bytes, 2026-03-15) — explicit list of v9/v10 holdout IDs.

There is no `holdout_set` table; holdout is a per-row boolean. Holdout designators:
- `src/lib/training/designate-holdout.ts` — 50-row (v9/v10-era) designator.
- `src/lib/training/designate-scraped-holdout.ts` — 200-row (v15-era) designator (newest).
- `src/app/api/admin/holdout/designate/route.ts` — admin route to trigger designation.

---

## SECTION 7 — VERCEL CONSTRAINTS

### 7.1 Vercel function execution limits

`vercel.json` does **not** declare a `functions` block, so per-route `maxDuration` is sourced from the route file itself. Currently configured maxDurations:

| Route | File | `maxDuration` |
|---|---|---|
| `/api/cron/training-pipeline` | `src/app/api/cron/training-pipeline/route.ts:13` | **300** |
| `/api/cron/cultural-scan` | `src/app/api/cron/cultural-scan/route.ts:18` | **300** |
| `/api/cron/classify-events` | `src/app/api/cron/classify-events/route.ts:20` | **120** |
| `/api/atlas/feedback-collector` | `src/app/api/atlas/feedback-collector/route.ts` | **not set** (uses Vercel default — 10s on Hobby; up to 300s on Pro if not declared, but typically defaults to a lower number for non-cron functions). AMBIGUOUS without the Vercel project tier setting. |

Pro tier ceiling for cron functions: 300s (already reached on training-pipeline and cultural-scan).

### 7.2 Heavy operations in training-pipeline

The training-pipeline route file itself is thin — it dispatches to library modules. Heavy operations live in those modules:

| Step | Module (file:line) | Concern |
|---|---|---|
| `backfill` | `src/lib/training/schedule-backfill.ts:48` | Reads ALL `metric_check_schedule` rows (`select('prediction_run_id')`, no limit) into a Set. With many schedules this becomes a memory hot-spot and quadratic against `candidateRuns`. Currently fine (low row count), but unbounded growth path. |
| `collect` | `src/lib/training/metric-collector.ts` | Calls `fetchTikTokMetrics` per schedule (up to 50 per cron tick). External API latency dominates. Each fetch is sequential per the current implementation. If TikTok returns slowly or rate-limits, 50 × 3s = 150s, leaving little margin under the 300s budget. |
| `label` | `src/lib/training/auto-labeler.ts:72` | Reads ALL `metric_check_schedule` rows where `status=completed` into a Set (no limit). Then 1000-page cohort fetching (`COHORT_PAGE_SIZE = 1000`). Bounded but grows with completed schedule count. |
| `evaluate` | `src/lib/training/spearman-evaluator.ts:62` | "Fetch all labeled runs with both predicted and actual VPS" — uses paged read but loads all in-memory to compute Spearman. Currently fast (only ~41 rows in the most recent 30d window). |
| (transitive) Gemini calls | `cultural-scan` / `classify-events` modules | Each Gemini call ~3–8s. cultural-scan in `phase=all` does up to 20 × Gemini Twitter calls + 20 × Gemini synthesis calls = 40 calls. At 5s each = 200s. Tight against 300s budget. |

None of these calls trains a model in-process. XGBoost training happens out-of-band via `autoresearch_run.py` + `retrain_s7.py` (Python subprocess invoked by `bridge_results_to_db.ts`), which is not in any cron route. **There is no in-Vercel model training.**

---

## SECTION 8 — KNOWN GAPS / WHAT'S OBVIOUSLY MISSING

### 8.1 Features the model would benefit from but isn't getting

- **`hook_word_count`** — defined in `candidate_features` (status=untested) with description "first 1.5s of transcript". No cron populates Whisper segments, so the prerequisite data isn't there. Feature is dead in the water until Whisper Group A backfill runs.
- **`on_screen_text_density`** — defined in `candidate_features` (status=untested). Pack V (Gemini Vision) produces this at live-predict time but nothing writes it back into `training_features`.
- **`audio_onset_count`** — defined in `candidate_features` (status=untested). No librosa in repo; would need a new Python helper or a different audio onset detector. The S9 Group C audio classifier columns (`audio_music_ratio`, etc.) WERE backfilled but onset counts specifically were not.
- **`hook_pace_score`** — column exists in `training_features` (per `backfill_fixed_features.ts:13`) but is **stuck at 0** because the S9 Group A Whisper backfill never ran. The v16 audit flagged this as "DEAD, 1 unique value".
- **Whisper segment timestamps** — needed for `hook_pace_score`, `hook_word_count`, and any future pace/segment features. The Whisper service exists; no batch backfill cron exists.
- **Creator trajectory / 30-day momentum** — 0 of 91 active features are dynamic. The model has no notion of whether a creator is trending up or down over time. The autoresearch sweep (auto-040 to auto-043) tested creator-size as a category and creator-followers interactions; none beat baseline, but the experiments tested *snapshots*, not *trajectory*. Trajectory has never been tested.
- **Topic / sound momentum** — `detected_trends` and `cultural_events` tables exist and are populated, but nothing joins them to `prediction_runs` or `training_features`. There is no feature column carrying "is this video's topic currently trending?".
- **Per-niche models** — 0 niches besides side-hustles have any data. `scraped_videos.niche` shows side-hustles=6,718 and every other niche=0. The router supports per-niche variants (`model-router.ts:52`) but cannot ever activate them until other niches are scraped.

### 8.2 Crons that need to run for the model to improve

- **`/api/cron/training-pipeline`** — NOT scheduled in `vercel.json`. Without it: no `metric_check_schedule` rows are created, no actual TikTok metrics are fetched, no auto-labels are produced, no Spearman evaluation is computed. This is the master training cron and it is currently dark. Manual triggering only.
- **`/api/cron/autodream`** — NOT scheduled. Generates briefs; downstream effect on training data is indirect (briefs become content which becomes scrape candidates) but if dormant, no new niches enter the pipeline.
- **`/api/cron/consolidate-memory`** — NOT scheduled. Affects agent memory, not directly training.
- **`/api/cron/process-scheduled-actions`** — NOT scheduled. This is the cron that would process `scheduled_actions` rows (including `feature_discovery_review`, `retrain`, `promotion_validation`). Without it, even if Feature Discovery flags a good candidate, nothing executes.
- A "**Whisper backfill**" cron — does not exist. Would need to be authored before `hook_pace_score`, `hook_word_count`, and future segment-aware features become non-trivial.
- A "**train-eligible cross-niche scraper**" — `niche-creator-scraper.ts` exists; its only cron entrypoint is the training-pipeline route's `step=scrape-creators`. Since training-pipeline itself isn't scheduled, no niche-expansion is happening automatically.

### 8.3 Data hygiene concerns

- **Single-niche training data.** 100% of training-eligible scraped videos are `niche='side-hustles'`. The model is, in effect, a side-hustles model that the system treats as global. Cross-niche generalization is untested.
- **0 prediction_runs in the last 51 days.** Either the predict-side UI hasn't been used, or rows aren't being written, or some routing layer is bypassed. `atlas_accuracy_summary` has only 1 row (2026-04-21) — the live-traffic accuracy signal has been silent for 7+ weeks.
- **Live-traffic Spearman (0.2441 on 41 rows) is dramatically lower than holdout Spearman (0.6805 on 200 rows).** This is the single biggest data-quality red flag in this audit. Possible causes: distribution shift between scraped training set and the videos people actually upload; the 41 labeled live runs aren't representative; predict-time feature extraction differs from training-time. Worth a dedicated investigation but is out of scope for this read-only audit.
- **`prediction_runs.is_holdout=true` count = 63**, but the active v15 holdout is on `scraped_videos.is_holdout=true` (count=200). Two parallel holdout systems exist; AMBIGUOUS whether the 63 prediction_runs are tied to those same 200 scraped videos or are an orthogonal set.
- **Model promotion has no post-validation.** The single row in `model_promotion_log` has `post_validation_*` all NULL — the post-promotion validator (`src/lib/training/post-promotion-validator.ts`, 335 LoC) was never wired into the promotion path or never fired.
- **3 candidate_features rows exist, all untested for 41 days** (created 2026-04-11). The Feature Discovery coordinator that should consume them has no scheduled cron.
- **`xgboost-enhanced.json` is 48 bytes** — likely a stub or error file in `models/`. Not loaded by any code path I can find, but it sits in the artifact directory.
- **Naming collision risk.** v15 features include both `creator_followers_log` and `meta_creator_followers_log` and `creator_followers_log_computed`, plus both `posted_hour_utc` and `post_hour_utc`. The first two are aliases written from the same source; the duplicate names could cause confusion if a feature engineer reads only the feature list.

### 8.4 The one thing that doesn't fit anywhere else

The autoresearch sweep ran **39 retrain experiments** (auto-001 → auto-044, with some gaps) over 4 days (2026-04-18 → 2026-04-19). The single "improved" verdict (auto-022, "Exclude creators with <5K followers") was **explicitly bootstrap-falsified** the same week — the bootstrap CI of [0.5758, 0.6260] contains v15's baseline, so the +0.0227 delta vs v15 was inside expected noise. After 39 attempts (and the subsequent v16 chain on 2026-04-21), **no variant has cleared v15's 0.6805 holdout Spearman by a statistically meaningful margin.** The team has been thoroughly stuck at the v15 ceiling since mid-April 2026, and the experiments that have been attempted are exclusively *static* (drop features, add interactions, change hyperparams, exclude rows). The directions that have NOT been attempted (per `candidate_features` and the absence of any trajectory/trend features in the active set) — dynamic creator features, topic momentum joining `cultural_events`, Whisper segment-aware features — are the unexplored quadrants.

---

## End-of-report metadata

- **Total files modified by this audit:** 1 (`MODEL_STATE_DIAGNOSTIC_2026-05-22.md`).
- **Code edits:** 0.
- **Cron triggers:** 0.
- **Supabase writes:** 0 (all REST queries were SELECT/HEAD).
- **`git status` confirms:** the only NEW file relative to the prior worktree state is this report; all other untracked files (`.env.funnel`, hero verify PNGs) were present at the start of the audit.
