# Trendzo Prediction System — Current-State Audit

**Date:** 2026-03-19
**Auditor:** Claude Code (automated codebase scan)
**Scope:** Prediction model, training pipeline, active iteration state, infrastructure

---

## PART 1: PREDICTION MODEL STATE

### 1.1 Current Deployed Model

| Field | Value |
|-------|-------|
| **Model** | XGBoost v9 |
| **Trained** | 2026-03-19T10:01:14 UTC |
| **Format** | JSON-serialized XGBoost Regressor (413 trees) |
| **Inference** | Pure TypeScript (no Python subprocess) |
| **Feature count** | 51 |
| **Artifacts** | `models/xgboost-v9-model.json` (2.29 MB), `xgboost-v9-scaler.json`, `xgboost-v9-features.json`, `xgboost-v9-metadata.json` |
| **Status** | Uncommitted — v9 model files are untracked in git |

**Performance Metrics:**

| Metric | Train (n=813) | Holdout (n=50) | 5-Fold CV |
|--------|---------------|----------------|-----------|
| Spearman ρ | 0.9963 | **0.8002** | **0.6497 ± 0.0197** |
| MAE (DPS) | 1.49 | 13.23 | 10.85 ± 0.69 |
| RMSE | 2.07 | 15.95 | — |
| R² | 0.9869 | 0.5412 | — |
| Within ±5 DPS | 97.2% | 20.0% | — |
| Within ±10 DPS | 99.9% | 42.0% | 54.9% |
| Tier accuracy | 94.8% | 40.0% | — |

**Baseline comparison:** Mean predictor MAE on holdout = 21.56 DPS. v9 MAE = 13.23 DPS (38.6% improvement over baseline).

**Delta vs v8:** CV Spearman +0.011, Holdout Spearman +0.012, Holdout MAE −0.46.

**Training data:** 863 videos, all "side-hustles" niche. 813 train / 50 holdout (stratified: 10 per tier). Holdout IDs fixed in `models/holdout-video-ids.json`.

**Target variable:** DPS score (0–100 continuous). Train mean = 49.46, std = 18.05, range 11.58–91.44.

**Hyperparameters (Optuna-optimized, 200 trials, inherited from v8):**

```json
{
  "objective": "reg:squarederror",
  "n_estimators": 413,
  "max_depth": 8,
  "learning_rate": 0.02585,
  "min_child_weight": 5,
  "subsample": 0.7064,
  "colsample_bytree": 0.7169,
  "reg_alpha": 0.6171,
  "reg_lambda": 4.9456
}
```

**Version history:**

| Version | Date | Features | Holdout ρ | Notes |
|---------|------|----------|-----------|-------|
| v5 | — | 42 | — | Initial heuristic baseline |
| v6 | 2026-02-10 | 42 | — | First Optuna optimization |
| v7 | 2026-03-17 | 72 | 0.6385 | Added segment + vision features (overfit) |
| v8 | 2026-03-14 | 48 | 0.7878 | Pruned 20 zero-importance features |
| v9 | 2026-03-19 | 51 | 0.8002 | v8 + 3 validated features |

---

### 1.2 Complete Feature List (51 Features)

#### FFmpeg Features (11)

| # | Feature | Importance (v9) | Rank | Data Source |
|---|---------|-----------------|------|-------------|
| 1 | `ffmpeg_scene_changes` | 0.1044 | 1 | `extract-prediction-features.ts` → `ffmpeg-canonical-analyzer.ts` |
| 2 | `ffmpeg_cuts_per_second` | 0.0098 | 27 | Same |
| 3 | `ffmpeg_avg_motion` | 0.0174 | 13 | Same |
| 4 | `ffmpeg_color_variance` | 0.0109 | 23 | Same |
| 5 | `ffmpeg_brightness_avg` | 0.0098 | 28 | Same |
| 6 | `ffmpeg_contrast_score` | 0.0082 | 37 | Same |
| 7 | `ffmpeg_resolution_width` | 0.0645 | 4 | Same |
| 8 | `ffmpeg_resolution_height` | 0.0689 | 3 | Same |
| 9 | `ffmpeg_duration_seconds` | 0.0093 | 30 | Same |
| 10 | `ffmpeg_bitrate` | 0.0093 | 31 | Same |
| 11 | `ffmpeg_fps` | 0.0351 | 5 | Same |

#### Audio Prosodic Features (10)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 12 | `audio_pitch_mean_hz` | 0.0168 | 15 | `audio-prosodic-analyzer.ts` |
| 13 | `audio_pitch_variance` | 0.0142 | 20 | Same |
| 14 | `audio_pitch_range` | 0.0140 | 21 | Same |
| 15 | `audio_pitch_std_dev` | 0.0092 | 32 | Same |
| 16 | `audio_pitch_contour_slope` | 0.0084 | 36 | Same |
| 17 | `audio_loudness_mean_lufs` | 0.0137 | 22 | Same |
| 18 | `audio_loudness_range` | 0.0088 | 33 | Same |
| 19 | `audio_loudness_variance` | 0.0098 | 26 | Same |
| 20 | `audio_silence_ratio` | 0.0087 | 34 | Same |
| 21 | `audio_silence_count` | 0.0085 | 35 | Same |

#### Speaking Rate (1)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 22 | `speaking_rate_wpm` | 0.0157 | 16 | `audio-prosodic-analyzer.ts` |

#### Visual Scene Features (3)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 23 | `visual_scene_count` | 0.1024 | 2 | `extract-prediction-features.ts` scene detection |
| 24 | `visual_avg_scene_duration` | 0.0099 | 25 | Same |
| 25 | `visual_score` | 0.0095 | 29 | Same |

#### Thumbnail Features (4)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 26 | `thumb_brightness` | 0.0156 | 17 | Thumbnail analysis in `extract-prediction-features.ts` |
| 27 | `thumb_contrast` | 0.0100 | 24 | Same |
| 28 | `thumb_colorfulness` | 0.0140 | — | Same |
| 29 | `thumb_overall_score` | 0.0099 | — | Same |

#### Hook Scoring Features (4)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 30 | `hook_score` | 0.0098 | — | Hook scorer component |
| 31 | `hook_confidence` | 0.0152 | 19 | Same |
| 32 | `hook_text_score` | 0.0185 | 11 | Same |
| 33 | `hook_type_encoded` | 0.0098 | — | Same (0–10 categorical encoding) |

#### Text/Transcript Features (13)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 34 | `text_word_count` | 0.0098 | — | `extractTextFeatures()` in extract-prediction-features.ts |
| 35 | `text_sentence_count` | 0.0187 | 10 | Same |
| 36 | `text_question_mark_count` | 0.0098 | — | Same |
| 37 | `text_exclamation_count` | 0.0269 | 7 | Same |
| 38 | `text_transcript_length` | 0.0170 | 14 | Same |
| 39 | `text_avg_sentence_length` | 0.0098 | — | Same |
| 40 | `text_unique_word_ratio` | 0.0098 | — | Same |
| 41 | `text_avg_word_length` | 0.0098 | — | Same |
| 42 | `text_syllable_count` | 0.0154 | 18 | Same |
| 43 | `text_flesch_reading_ease` | 0.0098 | — | Same |
| 44 | `text_has_cta` | 0.0098 | — | Same (boolean → 0/1) |
| 45 | `text_negative_word_count` | 0.0333 | 6 | Same |
| 46 | `text_emoji_count` | 0.0182 | 12 | Same |

#### Metadata Features (2)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 47 | `meta_duration_seconds` | 0.0259 | 8 | Duplicate of ffmpeg_duration_seconds |
| 48 | `meta_words_per_second` | 0.0098 | — | Computed: word_count / duration |

#### v9 New Features (3)

| # | Feature | Importance | Rank | Data Source |
|---|---------|------------|------|-------------|
| 49 | `text_overlay_density` | 0.0054 | **51** (last) | Gemini Vision frame classifier |
| 50 | `visual_proof_ratio` | 0.0258 | **9** | Gemini Vision frame classifier |
| 51 | `vocal_confidence_composite` | 0.0108 | **34** | Derived: pitch_variance + loudness_variance + silence_ratio |

**Feature validation status (from FEATURE_VALIDATION_REPORT.md):**

| Feature | Non-null count (of 863) | Spearman r(DPS) | Spearman r(deviation) | Status |
|---------|------------------------|-----------------|----------------------|--------|
| `text_overlay_density` | 936 | 0.455 | 0.442 | STRONG |
| `visual_proof_ratio` | 936 | 0.398 | 0.222 | STRONG |
| `vocal_confidence_composite` | 962 | 0.147 | 0.076 | MODERATE |

**Missing features at prediction time:** When a feature is null/missing, it is filled with the training mean from the scaler, which scales to 0 (neutral) after standardization. The model proceeds with whatever features are available.

---

### 1.3 Signals Available But NOT Used in Training

#### In `training_features` table (defined in `20260312_training_features.sql` + `20260318_new_features.sql`) — 26 unused columns:

**Audio Classifier (4):**
- `audio_music_ratio` — music vs speech ratio
- `audio_speech_ratio` — speech proportion
- `audio_type_encoded` — 1=speech-only, 2=music-only, 3=speech-over-music, 4=mixed, 5=silent
- `audio_energy_variance` — energy dynamics

**Speaking Rate Extended (5):**
- `speaking_rate_wpm_variance` — WPM variability
- `speaking_rate_wpm_acceleration` — speech acceleration
- `speaking_rate_wpm_peak_count` — number of rate peaks
- `speaking_rate_fast_segments` — count of fast segments
- `speaking_rate_slow_segments` — count of slow segments

**Thumbnail (1):**
- `thumb_confidence` — thumbnail analysis confidence

**Hook Scorer Extended (4):**
- `hook_audio_score` — audio hook quality
- `hook_visual_score` — visual hook quality
- `hook_pace_score` — pacing hook quality
- `hook_tone_score` — tonal hook quality

**Text (1):**
- `text_positive_word_count` — positive emotion words

**Metadata (4):**
- `meta_hashtag_count` — number of hashtags
- `meta_has_viral_hashtag` — boolean: contains viral hashtag
- `meta_creator_followers` — raw follower count
- `meta_creator_followers_log` — log-transformed followers

**FFmpeg (1):**
- `ffmpeg_has_audio` — boolean: video has audio track

**New Wave 1 Features (6) — columns exist, data status varies:**
- `specificity_score` — **n=0, no data**
- `instructional_density` — **n=0, no data**
- `has_step_structure` — **n=0, no data**
- `hedge_word_density` — **n=0, no data**
- `talking_head_ratio` — n=936, r(DPS)=−0.110 (weak, flagged for dropping)
- `visual_to_verbal_ratio` — **n=0, no data**

#### In `scraped_videos` table — available but not connected to training:

**Creator metadata:**
- `creator_followers_count` (BIGINT) — raw follower count at scrape time
- `creator_verified` (BOOLEAN) — verification status
- `creator_username`, `creator_nickname` — could enable creator-level features

**Engagement metrics at scrape time:**
- `views_count`, `likes_count`, `shares_count`, `comments_count` (BIGINT) — raw engagement numbers
- `saves_count` (added 20251201) — bookmark count

**Content metadata:**
- `hashtags` (TEXT[]) — full hashtag array
- `mentions` (TEXT[]) — mentioned accounts
- `caption` (TEXT) — full caption text (used for transcript fallback, not as feature)

**Sound/Music metadata (added 20260308):**
- `sound_id` (TEXT, indexed) — TikTok sound identifier
- `sound_name` (TEXT) — sound/music track name
- `sound_author` (TEXT) — sound creator
- `is_original_sound` (BOOLEAN, indexed) — original vs trending sound
- `audio_fingerprint` (TEXT, indexed) — spectral centroid hash for clustering

**DPS/scoring (added 20251201):**
- `niche` — content niche classification
- `dps_score` (DECIMAL) — the actual DPS score (used as training TARGET, not as input feature)
- `dps_classification` — tier label
- `dps_breakdown` (JSONB) — score component breakdown

**Raw platform data:**
- `raw_scraping_data` (JSONB, GIN-indexed) — complete Apify response payload

**Upload timing:**
- `upload_timestamp` (TIMESTAMPTZ) — when uploaded to TikTok
- `created_at_utc` (TIMESTAMPTZ) — creation time on platform

---

## PART 2: TRAINING PIPELINE

### 2.1 End-to-End Sequence

```
┌─────────────────────────────────────────────────────────────────────┐
│ GROUND TRUTH COLLECTION (Automated)                                │
│                                                                     │
│ 1. metric-scheduler.ts creates metric_check_schedule rows           │
│    (4h, 24h, 48h, 7d checkpoints)                                  │
│                                                                     │
│ 2. metric-collector.ts (cron: every 6h at :30)                     │
│    Fetches TikTok metrics via Apify → writes to                    │
│    metric_check_schedule.actual_metrics JSONB                       │
│                                                                     │
│ 3. auto-labeler.ts (cron: daily 03:30 UTC)                        │
│    Reads completed metric_check_schedule rows                       │
│    Computes actual DPS from engagement metrics + niche cohort       │
│    Writes to prediction_runs: actual_dps, actual_tier,             │
│    actual_views/likes/comments/shares/saves, prediction_error,      │
│    within_range, labeling_mode='auto_cron'                         │
│                                                                     │
│ 4. scrape-label.ts (triggered post-prediction for scraped videos)  │
│    Labels prediction_runs with labeling_mode='scrape_ingest'        │
│    when video is 48+ hours old                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ FEATURE EXTRACTION (Offline)                                        │
│                                                                     │
│ Features stored in training_features table                          │
│ (77 base columns + 9 wave-1 columns = 86 total columns)           │
│                                                                     │
│ JOIN: training_features.video_id → scraped_videos.video_id          │
│ Target: scraped_videos.dps_score                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ TRAINING DATA EXPORT                                                │
│                                                                     │
│ Script: scripts/export-training-dataset.ts                          │
│ Alt:    Python scripts fetch directly from Supabase                 │
│                                                                     │
│ Query: SELECT tf.*, sv.dps_score, sv.niche                         │
│        FROM training_features tf                                    │
│        JOIN scraped_videos sv ON tf.video_id = sv.video_id         │
│        WHERE sv.dps_score IS NOT NULL                              │
│          AND sv.niche = 'side-hustles'                             │
│                                                                     │
│ Output: CSV file (training_data.csv)                               │
│ Filter: rows with feature coverage >= 25%                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ MODEL TRAINING                                                      │
│                                                                     │
│ Script: scripts/train-v9-retrain.py (Python)                       │
│                                                                     │
│ 1. Load data from Supabase or cached CSV                           │
│ 2. Filter to side-hustles niche, drop null targets                 │
│ 3. Exclude 50 holdout video IDs (from holdout-video-ids.json)      │
│ 4. Select 51 feature columns (V9_FEATURES list)                   │
│ 5. Fill NaN with 0, convert booleans to float                     │
│ 6. StandardScaler normalization                                     │
│ 7. Train XGBoost with fixed hyperparameters (Optuna v8 params)     │
│ 8. 5-fold cross-validation on training set                         │
│ 9. Evaluate on holdout set                                          │
│ 10. Save 4 artifact files to models/ directory                     │
│                                                                     │
│ Output files:                                                       │
│   models/xgboost-v9-model.json    (serialized trees)               │
│   models/xgboost-v9-scaler.json   (mean/std per feature)           │
│   models/xgboost-v9-features.json (ordered feature name list)      │
│   models/xgboost-v9-metadata.json (metrics, hyperparams, history)  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PREDICTION-TIME INFERENCE                                           │
│                                                                     │
│ File: src/lib/prediction/xgboost-inference.ts                      │
│                                                                     │
│ 1. Load model/scaler/features from models/ (singleton, cached)     │
│ 2. Build feature vector in canonical order from features.json      │
│ 3. Fill missing features with training mean                        │
│ 4. Apply StandardScaler: (x - mean) / std                         │
│ 5. DFS tree traversal across 413 trees                             │
│ 6. Sum tree contributions + base_score (49.85)                     │
│ 7. Clamp to [0, 100], round to 1 decimal                          │
│                                                                     │
│ Called from: runPredictionPipeline.ts → predictXGBoostV9()          │
│ Exposed via: /api/kai/predict (testing), /api/creator/predict       │
│                                                                     │
│ Note: API response uses key "xgboost_v7" for backward compat       │
│ but model_version field reads "v9"                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Automated Cron Jobs

| Job | Schedule | File | Function |
|-----|----------|------|----------|
| Schedule Backfill | `0 1 * * *` (01:00 UTC daily) | `schedule-backfill.ts` | `backfillMetricSchedules({ limit: 100 })` |
| Metric Collector | `30 0,6,12,18 * * *` (every 6h) | `metric-collector.ts` | `runMetricCollector({ limit: 50 })` |
| Auto-Labeler | `30 3 * * *` (03:30 UTC daily) | `auto-labeler.ts` | `runAutoLabeler({ limit: 50 })` |
| Spearman Evaluator | `0 5 * * 0` (Sun 05:00 UTC) | `spearman-evaluator.ts` | `runSpearmanEvaluation()` |
| Discovery Scanner | `*/15 * * * *` (every 15 min) | `fresh-video-scanner.ts` | `runDiscoveryScan()` |

All jobs configured in `src/lib/cron/scheduler.ts`. Status tracked in `integration_job_runs` table.

### 2.3 Ground Truth Collection

Ground truth flows through a 3-tier fallback:

1. **Best:** `metric_check_schedule.actual_metrics` (7d checkpoint preferred > 48h > 24h > 4h)
2. **Fallback:** `scraped_video_metrics` time-series snapshots
3. **Last resort:** `scraped_videos` inline metrics (views_count, likes_count, etc.)

DPS is computed from engagement metrics + niche cohort percentiles via `computeDps()`. The auto-labeler runs daily and is **lenient** — no contamination_lock required, tracks `labeling_mode='auto_cron'`.

### 2.4 Spearman Evaluator Output

Stores results in `vps_evaluation` table:
- `n` — sample size of labeled runs
- `spearman_rho` — rank correlation between predicted and actual DPS
- `p_value` — statistical significance
- `mae` — mean absolute error
- `within_range_pct` — % of actuals within predicted confidence range
- `by_niche` (JSONB) — per-niche breakdown
- `labeling_mode_breakdown` (JSONB) — counts by labeling source

---

## PART 3: ACTIVE ITERATION STATE

### 3.1 Recent Git Commits (Last 2 Weeks)

All work is on branch `boris-workflow-implementation` (93 commits ahead of `main`, no remote tracking).

Only 3 commits in the last 2 weeks — all are large checkpoint snapshots:

| Hash | Date | Message |
|------|------|---------|
| `89c8c3a3` | Mar 19 | checkpoint: full system state snapshot 2026-03-19 — layers 1-5 complete, XGBoost disabled, all fixes applied |
| `c3ee0aa8` | Mar 12 | checkpoint: Layer 1-5 component audit complete + training pipeline + disk backup (2026-03-07 to 2026-03-12) |
| `86bf0305` | Mar 7 | checkpoint: Buckets 2-4 complete + God's Eye audit + onboarding overhaul (2026-02-28 to 2026-03-07) |

No merge commits. No granular feature-by-feature commits.

### 3.2 Uncommitted Changes

**Modified source files (unstaged):**
- `src/app/api/admin/operations/initiative/route.ts`
- `src/lib/evaluation/benchmark-runner.ts`
- `src/lib/prediction/extract-prediction-features.ts`
- `src/lib/prediction/runPredictionPipeline.ts`
- `src/lib/prediction/xgboost-inference.ts`
- `src/lib/training/model-evaluator.ts`

**Untracked files (new):**
- `docs/RETRAIN_REPORT.md` — v1 retrain report (synthetic 4-sample mock data)
- `docs/RETRAIN_REPORT_REAL.md` — v9 retrain report (real 863-video data)
- `docs/cultural-intelligence/2026-03-19-side-hustles-trends.md` — cultural intelligence briefing
- `models/xgboost-enhanced.json` — intermediate model artifact
- `models/xgboost-v9-model.json` — current v9 model (2.29 MB)
- `models/xgboost-v9-scaler.json` — v9 scaler
- `models/xgboost-v9-features.json` — v9 feature list
- `models/xgboost-v9-metadata.json` — v9 metadata
- `scripts/train-v9-retrain.py` — v9 training script
- `synthetic_data.csv` — test data
- `training_data.csv` — training data export
- `nul` — Windows artifact (accidental)

**No stashes.** No in-progress branches beyond `boris-workflow-implementation`.

### 3.3 Other Branches

| Branch | Status | Divergence from main |
|--------|--------|---------------------|
| `boris-workflow-implementation` | **CURRENT** | +93 commits |
| `feature/system-rebuild` | Stale | +91 commits (shares most history) |
| `feat/unified-grading-rubric` | Stale | +2 commits |
| `fresh-checkpoint-2026-01-28` | Archive | +1 commit |
| `backup-before-recovery` | Archive | Same as feature/system-rebuild |
| `backup/*` (3 branches) | Archive | Old snapshots |

### 3.4 Recent Analysis Documents (docs/)

| File | Date | Description |
|------|------|-------------|
| `cultural-intelligence/2026-03-19-side-hustles-trends.md` | Mar 19 | TikTok side hustle cultural trends briefing |
| `RETRAIN_REPORT_REAL.md` | Mar 19 | v9 retrain report — 863 real videos, 51 features, holdout ρ=0.8002 |
| `RETRAIN_REPORT.md` | Mar 19 | v1 retrain attempt on synthetic 4-sample mock data |
| `FEATURE_VALIDATION_REPORT.md` | Mar 18–19 | New feature validation: 4 features have zero data, 3 have data with correlations |
| `TRAINING_EVAL_REPORT.md` | Mar 18 | Training eval: v7 content-only, 72 features, raw CV ρ=0.614 |
| `NEXT_FEATURE_QUEUE.md` | Mar 18 | Prioritized queue of next pre-pub features |
| `TIER_DEFINITIONS.md` | Mar 18 | 5-tier DPS definitions with mechanism profiles |
| `TIER_MECHANISM_PROFILES.md` | Mar 18 | Per-tier mechanism explanations with evidence labels |
| `RESPONSE_STACK_REPORT.md` | Mar 18 | Response-type classification (save/share/comment-heavy) |
| `CREATOR_BASELINE_ANALYSIS.md` | Mar 18 | Creator baseline deviation: 16 signals survive controlling for creator authority, 18 vanish |
| `POST_PUB_ANALYSIS_REPORT.md` | Mar 18 | Post-pub signal analysis: save rate strongest discriminator |
| `MANUAL_ANNOTATION_SCHEMA.md` | Mar 18 | Human annotation rubric for 100–200 videos across 5 DPS tiers |
| `SIGNAL_ONTOLOGY.md` | Mar 18 | Signal/mechanism/feature ontology: pre-pub vs post-pub, endogenous vs exogenous |
| `FORMAT_ONTOLOGY.md` | Mar 17 | Atomic structure of teach-prove-convert talking-head side-hustle content |
| `FEATURE_CORRELATION_REPORT.md` | Mar 17 | Spearman correlation of all features vs DPS (863 videos) |
| `TIER_ANALYSIS_REPORT.md` | Mar 17 | Per-tier feature profiles: mega-viral vs underperformer signal differences |
| `FEATURE_ROADMAP.md` | Mar 15 | Comprehensive pre-pub signal roadmap |
| `COMPONENT_DEEP_ANALYSIS.md` | Mar 10–11 | 240KB forensic analysis of all 22 prediction components |
| `TRENDZO_PLAYBOOK.md` | Mar 10 | Product playbook v1.0 |

### 3.5 Execution Queue Status

From `.planning/side-hustles-execution-prompts.md`:
- **Prompts 10–11:** COMPLETE (raw Spearman eval, Initiative Intelligence page)
- **Prompts 12–19:** PENDING (hyperparameter optimization, feature selection, error analysis, ablation, calibration, retrain v8, creator expansion, accuracy dashboard)

---

## PART 4: INFRASTRUCTURE STATE

### 4.1 Incremental Retraining

**Not supported.** Every retrain is a full rebuild:

1. Loads ALL training data from `training_features` + `scraped_videos`
2. Filters to niche
3. Splits into train/holdout
4. Trains from scratch with full Optuna or fixed hyperparameters
5. Saves new model artifacts

There is no warm-start, online learning, or incremental update mechanism. XGBoost itself supports `xgb_model` parameter for warm-start, but none of the training scripts use it.

### 4.2 Automated Ground Truth Collection

**Yes — fully automated via 4 cron jobs:**

1. **Schedule Backfill** (01:00 UTC daily) — creates metric_check_schedule rows for runs that lack them
2. **Metric Collector** (every 6h) — fetches actual TikTok metrics via Apify, writes to `metric_check_schedule.actual_metrics`
3. **Auto-Labeler** (03:30 UTC daily) — computes actual DPS from collected metrics + niche cohort, writes `actual_dps` to `prediction_runs`
4. **Spearman Evaluator** (Sun 05:00 UTC) — computes Spearman ρ between predicted and actual DPS, stores in `vps_evaluation`

Ground truth data flows: Apify scrape → `metric_check_schedule` → `auto-labeler` → `prediction_runs.actual_dps`.

The auto-labeler uses a 3-tier metric source fallback (scheduled checkpoint > time-series snapshot > inline scraped metrics). It only labels runs that are 7+ days old.

**Manual labeling is also possible** via admin UI — sets `labeling_mode='manual'`.

### 4.3 Process for Adding a New Feature to the Model

**Step 1 — Extract the feature at prediction time:**
Edit `src/lib/prediction/extract-prediction-features.ts`:
- Add the feature key with `null` default to the features object
- Add extraction logic (call FFmpeg, audio analyzer, Gemini Vision, text analysis, etc.)
- Handle errors gracefully (feature stays null on failure)

**Step 2 — Add column to `training_features` table:**
Create a Supabase migration:
```sql
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS new_feature NUMERIC;
```

**Step 3 — Populate the column for existing training videos:**
Run a backfill script that:
- Downloads each video (or accesses cached video files)
- Runs the extraction function
- Writes the value to `training_features.new_feature`

This is the bottleneck — there is no automated backfill for new features. Each video needs its file available for re-extraction.

**Step 4 — Add to the Python training script:**
In `scripts/train-v9-retrain.py` (or next version):
- Add `'new_feature'` to the feature list constant
- The rest of the pipeline (fetch, filter, scale, train) handles it automatically

**Step 5 — Train and save model:**
Run the Python script. It produces 4 JSON artifacts in `models/`.

**Step 6 — Update inference:**
If the new model version has a different filename prefix (e.g., v10), update the file path in `src/lib/prediction/xgboost-inference.ts`. If reusing the same prefix, no code change needed — inference reads feature names from `xgboost-vX-features.json` dynamically.

**Step 7 — Deploy:**
Model files are read from `models/` directory on the local filesystem via `fs.readFileSync()`. Deployment means committing the new model files and deploying the application.

**Gap: There is no automated feature backfill pipeline.** When a new feature is added, populating it for all 863+ existing training videos requires manual scripting. The extraction functions require the actual video file, which may or may not still be accessible on disk or in storage.

---

## APPENDIX: KEY FILE PATHS

### Model Artifacts
- `models/xgboost-v9-model.json` — serialized XGBoost trees (2.29 MB)
- `models/xgboost-v9-scaler.json` — StandardScaler params (4 KB)
- `models/xgboost-v9-features.json` — 51 feature names in canonical order (1.4 KB)
- `models/xgboost-v9-metadata.json` — training metadata + metrics (6 KB)
- `models/holdout-video-ids.json` — 50 holdout video IDs (stratified)

### Training Pipeline
- `scripts/train-v9-retrain.py` — Python training script
- `scripts/export-training-dataset.ts` — TypeScript data export
- `src/lib/training/auto-labeler.ts` — automated ground truth labeling
- `src/lib/training/metric-collector.ts` — Apify metric collection
- `src/lib/training/scrape-label.ts` — post-scrape labeling
- `src/lib/training/metric-scheduler.ts` — metric checkpoint scheduling
- `src/lib/training/spearman-evaluator.ts` — accuracy evaluation
- `src/lib/cron/scheduler.ts` — all cron job definitions

### Prediction Pipeline
- `src/lib/prediction/runPredictionPipeline.ts` — canonical pipeline entry point
- `src/lib/prediction/extract-prediction-features.ts` — 51-feature extraction
- `src/lib/prediction/xgboost-inference.ts` — pure TypeScript tree traversal
- `src/lib/prediction/system-registry.ts` — component metadata registry

### Database Schemas
- `supabase/migrations/20260312_training_features.sql` — training_features table (77 columns)
- `supabase/migrations/20260318_new_features.sql` — wave-1 new feature columns (+9)
- `supabase/migrations/20260308_sound_metadata.sql` — sound metadata on scraped_videos
- `supabase/migrations_archive/20251012_create_scraped_videos_table.sql` — scraped_videos base schema
- `supabase/migrations/20260115_transcription_status_tracking.sql` — prediction_runs + run_component_results
- `supabase/migrations/20260301_training_labeling_mode.sql` — vps_evaluation table

### Analysis Documents
- `docs/FEATURE_VALIDATION_REPORT.md` — new feature validation with Spearman correlations
- `docs/FEATURE_CORRELATION_REPORT.md` — all features correlated against DPS
- `docs/CREATOR_BASELINE_ANALYSIS.md` — creator authority confound analysis
- `docs/TIER_ANALYSIS_REPORT.md` — per-tier feature profile breakdown
- `.planning/side-hustles-execution-prompts.md` — execution prompt queue (10-11 done, 12-19 pending)
