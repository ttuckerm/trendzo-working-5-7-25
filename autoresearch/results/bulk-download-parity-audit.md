# Bulk Download Pipeline Parity Audit

**Date:** 2026-03-22
**Status:** Discrepancy confirmed — fix plan provided

---

## 1. Code Path Trace: Upload-Test (Canonical)

```
page.tsx POST → /api/kai/predict/route.ts
  → INSERT video_files (1 row)
  → runPredictionPipeline(videoId, options)
    → INSERT prediction_runs (status='running')
    → KaiOrchestrator.predict() (components execute)
    → INSERT run_component_results (1 row per component)
    → calibratePrediction() (pipeline calibrator rules 1-5)
    → UPDATE prediction_runs (final VPS, confidence, metadata, status='completed')
```

**Tables written:**
| Table | Operation | Key columns |
|---|---|---|
| `video_files` | INSERT | id, tiktok_url, niche, account_size_band |
| `prediction_runs` | INSERT then UPDATE | predicted_dps_7d, confidence, raw_result, qc_flags, llm_spread, transcription_*, pack1_meta, pack2_meta, cohort_key, score_version |
| `run_component_results` | INSERT (N rows) | component_id, prediction, confidence, features, latency_ms |

**Pipeline features present:**
- Two-lane architecture (score lane vs coach lane)
- LLM consensus gate (spread threshold, weight cap)
- Pipeline calibrator (Rules 1-5: confidence penalty, silent video cap, high VPS scaling, creator context)
- QC flags and llm_excluded_reason tracking
- Contamination lock and ingest_mode tracking
- Score version and coach version tagging
- Transcription metadata (source, confidence, latency, skip reason)
- Pack metadata (pack1_meta, pack2_meta with source/provider/latency)

---

## 2. Code Path Trace: Bulk Download (Divergent)

```
page.tsx POST → /api/bulk-download/predict/route.ts
  → new KaiOrchestrator() — direct instantiation
  → executeParallel(kai, input) — raw component execution
  → Simple weighted average: SUM(pred * conf) / SUM(conf)
  → UPSERT video_analysis (prediction summary)
  → UPSERT component_results (1 row per component)
  → UPSERT training_features (feature extraction)
  → UPDATE bulk_download_items (prediction columns)
```

**Tables written:**
| Table | Operation | Key columns |
|---|---|---|
| `video_analysis` | UPSERT | final_dps_prediction, final_confidence, processing_status |
| `component_results` | UPSERT (N rows) | component_id, prediction, confidence, features |
| `training_features` | UPSERT | features (JSONB), feature_count, quality_score |
| `bulk_download_items` | UPDATE | predicted_dps, confidence, viral_potential, prediction_data |

**Pipeline features MISSING:**
- No `runPredictionPipeline` call — orchestrator used directly
- No two-lane architecture (no coach-lane zeroing)
- No LLM consensus gate (no spread check, no weight cap)
- No pipeline calibrator (no rules 1-5)
- No extreme score boost (the parameter the autoresearch just optimized)
- No niche/account calibration adjustments
- No QC flags, no llm_spread tracking
- No transcription metadata
- No pack metadata
- No contamination tracking
- No score/coach versioning
- Naive aggregation: simple confidence-weighted average instead of path-based synthesis
- Naive range: `prediction * 0.85` / `prediction * 1.15` instead of uncertainty-based
- Naive viral_potential: 3 tiers (high/medium/low) instead of System 1 VPS tiers
- Does NOT write to `prediction_runs` or `run_component_results`

---

## 3. Calculate-DPS Route Confirmation

**File:** `src/app/api/bulk-download/calculate-dps/route.ts`

**Confirmed:** Writes `actual_dps` to `bulk_download_items` only (line 136-147).
Does NOT write to `prediction_runs.actual_dps`.

Additionally uses its own DPS formula (engagement-rate based, lines 36-65) which
differs from the auto-labeler formula in `src/lib/training/auto-labeler.ts`.

The actuals entered via bulk download are **completely invisible** to:
- `spearman-evaluator.ts` (reads `prediction_runs.actual_dps`)
- Autoresearch sandbox (reads `prediction_runs` + `run_component_results`)
- Training pipeline cron (reads `prediction_runs` with labeling_mode filters)

---

## 4. UI Dependencies on Current Tables

The bulk download page (`src/app/admin/bulk-download/page.tsx`) reads exclusively
from `bulk_download_items` for display. It does NOT directly query `video_analysis`,
`component_results`, or `training_features`.

**Columns the UI depends on from `bulk_download_items`:**

| Column | UI usage |
|---|---|
| `predicted_dps` | Main prediction display, comparison calculation |
| `predicted_range_low/high` | Range display, within-range check |
| `confidence` | Confidence display |
| `viral_potential` | Badge ("high"/"medium"/"low") |
| `components_used` | Component count display |
| `processing_time_ms` | Timing display |
| `prediction_data` | Full details panel (JSONB) |
| `actual_dps` | Actual score display, comparison |
| `actual_views/likes/comments/shares/saves` | Metrics entry form, display |
| `comparison_data` | Accuracy analysis (JSONB) |

**Other consumers of `video_analysis` / `component_results`:**
- `/api/system-health/accuracy/route.ts` — accuracy dashboard
- `/api/data-explorer/quality/route.ts` — quality metrics
- `/lib/services/training/video-selector.ts` — training video selection
- `/lib/control-center/component-status-checker.ts` — component health

These would need updating if bulk-download stops writing to those tables.

---

## 5. Fix Plan

### Strategy

Replace the direct KaiOrchestrator path with `runPredictionPipeline`, while keeping
the `bulk_download_items` update for UI compatibility. The bulk download items table
becomes a UI view layer that mirrors the canonical prediction_runs data.

### File Changes

#### A. `src/app/api/bulk-download/predict/route.ts` — MAJOR REWRITE

**What changes:**
1. Remove `KaiOrchestrator` direct instantiation (line 14, 54-78)
2. Remove `executeParallel` import and call (line 30, 77)
3. Remove `extractTrainingFeatures` / `evaluateTrainingReadiness` calls (lines 172-174, 254-262)
4. Remove `validatePreProcessing/AllComponents/PostProcessing/Storage` calls (lines 131, 170, 179, 294)
5. Remove all UPSERT to `video_analysis` (lines 137-147, 206-226)
6. Remove all UPSERT to `component_results` (lines 233-251)
7. Remove all UPSERT to `training_features` (lines 265-289)
8. Remove naive aggregation (lines 182-198)
9. **Add** import of `runPredictionPipeline` from `@/lib/prediction/runPredictionPipeline`
10. **Add** INSERT to `video_files` (matching what `/api/kai/predict` does)
11. **Call** `runPredictionPipeline(videoId, options)` with appropriate options
12. **Keep** the UPDATE to `bulk_download_items` (lines 325-353) but populate it from the pipeline result instead of the naive calculation

**Tables after fix:**
| Table | Operation | Source |
|---|---|---|
| `video_files` | INSERT | New (matches upload-test) |
| `prediction_runs` | INSERT + UPDATE | Via runPredictionPipeline |
| `run_component_results` | INSERT (N rows) | Via runPredictionPipeline |
| `bulk_download_items` | UPDATE | From pipeline result (mirror) |

**What this unlocks:**
- Bulk download predictions appear in Spearman evaluation
- Bulk download predictions appear in autoresearch sandbox
- Full pipeline calibration (extreme score boost, calibrator rules) applied
- Two-lane architecture with coach-lane zeroing applied
- LLM consensus gate applied
- QC flags and metadata tracked

#### B. `src/app/api/bulk-download/calculate-dps/route.ts` — ADD prediction_runs WRITE

**What changes:**
1. After updating `bulk_download_items` (line 136-147), also UPDATE the corresponding
   `prediction_runs` row with actual metrics
2. Look up the prediction_runs.id using the video_id (stored via the pipeline in step A)
3. Write: `actual_dps`, `actual_views`, `actual_likes`, `actual_comments`, `actual_shares`,
   `actual_saves`, `actuals_entered_at`, `prediction_error`, `prediction_error_pct`, `within_range`

**New code (approximately):**
```typescript
// After bulk_download_items update succeeds:
const { error: prError } = await supabase
  .from('prediction_runs')
  .update({
    actual_dps: actualDps,
    actual_views: views,
    actual_likes: likes,
    actual_comments: comments,
    actual_shares: shares,
    actual_saves: saves,
    actuals_entered_at: new Date().toISOString(),
    prediction_error: Math.abs(error),
    prediction_error_pct: errorPct,
    within_range: withinRange,
  })
  .eq('video_id', item.video_id)
  .order('created_at', { ascending: false })
  .limit(1);
```

#### C. `src/app/admin/bulk-download/page.tsx` — NO CHANGES NEEDED

The UI reads from `bulk_download_items` exclusively. As long as the predict route
continues to UPDATE those columns (step A keeps this), the UI is unaffected.

#### D. Downstream consumers of `video_analysis` / `component_results` — ASSESS SEPARATELY

The system health accuracy dashboard and training video selector read from these tables.
Two options:
1. **Keep dual-write** (write to both old and new tables during transition)
2. **Migrate those consumers** to read from `prediction_runs` + `run_component_results`

Recommendation: Option 1 (dual-write) first, then migrate consumers in a separate PR.

### What Stays the Same

- `bulk_download_items` table structure — unchanged
- Bulk download page UI — unchanged
- Job management (`/api/bulk-download` route) — unchanged
- File download logic — unchanged
- `test-all` route — already calls `/api/kai/predict` (line 202), so it's already correct

---

## 6. Summary of Impact

| Aspect | Before | After |
|---|---|---|
| Prediction pipeline | Naive KaiOrchestrator direct | Canonical runPredictionPipeline |
| Calibration | None | Full (Rules 1-5 + niche + account) |
| Two-lane architecture | Missing | Applied |
| LLM consensus gate | Missing | Applied |
| Extreme score boost | Missing | Applied (including autoresearch-optimized value) |
| Writes to prediction_runs | No | Yes |
| Writes to run_component_results | No | Yes |
| Visible to Spearman eval | No | Yes |
| Visible to autoresearch | No | Yes |
| Actuals flow to prediction_runs | No | Yes |
| Bulk download UI | Works | Still works (bulk_download_items unchanged) |
