# Prediction System Audit

**Purpose:** Living document tracking verified findings, red flags, and open questions across the full prediction system audit.  
**Created:** 2026-02-25  
**Status:** Complete (Bucket 1). Superseded by God's Eye Forensic Audit (Mar 5-7) — see CLAUDE.md "God's Eye Audit — Critical Findings" section.  
**Phases:** 5 total (Pipeline Architecture → XGBoost & Niches → Scoring & Display → Pack Deep-Dives → Viral Workflow)  
**God's Eye follow-up:** Agent transcript `f5a22e73-d70e-47ed-846d-34ec1dc73c4c` contains the 6-phase forensic audit, prompt rewrite, and 22-component classification.

---

## ⚠️ CRITICAL CORRECTION (Added During Phase 2 Review)

**DPS = "Dynamic Percentile System"** — NOT "Daily Performance Score."

DPS is a proprietary cohort-based percentile ranking system defined in `frameworks-and-research/POC Research & Framework Data/Framework- The Dynamic Percentile System DPS 8-8-25.MD` and implemented in `src/lib/services/viral-prediction/dynamic-percentile-system.ts`. It measures where a video's performance falls RELATIVE to a cohort of similar-sized creators on the same platform, with time decay and engagement weighting.

Any reference to "Daily Performance Score" in Phase 1 or Phase 2 findings below is an error. The correct definition is Dynamic Percentile System. See Red Flag RF-2.9 and Question Q-2K for full ramifications.

---

## How to Use This Document

When opening a new chat, start with:
> "Read `.planning/prediction-audit.md` and `CLAUDE.md`. Continue from Phase [X]."

Each phase contains:
1. **Verified Findings** — confirmed from code, not documentation
2. **Red Flags** — inconsistencies, broken things, things that need fixing
3. **Open Questions** — may be answered by later phases
4. **Decisions Pending** — owner (Thomas) decides after all phases complete

---

## Phase 1: Pipeline Architecture — How a Video Becomes a DPS Score

### 1.1 Verified Findings

#### The End-to-End Chain

When you upload a video on `/admin/upload-test` and click "Analyze Video":

1. **UI sends form to `/api/kai/predict`** — includes video file (MP4), transcript (optional), niche, goal, account size, pipeline mode
2. **API saves video** — writes MP4 to disk, creates `video_files` row in Supabase
3. **API calls `runPredictionPipeline()`** — the single canonical entry point (file: `src/lib/prediction/runPredictionPipeline.ts`)
4. **Pipeline creates tracking record** — new `prediction_runs` row with `status='running'` and unique UUID `run_id`
5. **Transcript resolution** — determines what text ALL components will use:
   - User-provided (if 10+ characters typed/pasted)
   - Whisper auto-transcription (if video file uploaded but no transcript)
   - None (text-dependent components skip)
6. **KaiOrchestrator runs 4 paths in parallel** — see Component Table below
7. **LLM Consensus Gate** — if LLM components disagree by more than 10 DPS, their weight is zeroed
8. **Path synthesis** — paths are combined into one raw DPS number via weighted average
9. **Three calibration layers applied** — niche difficulty, account size, conservative pull, then silent-video rules
10. **Database finalization** — `prediction_runs` row updated with final results (guaranteed by `finally` block)
11. **Response sent to UI** — DPS, range, tier, pack results, component details, debug info

#### Component Table — Exact Count from Code

**Source:** `src/lib/orchestration/kai-orchestrator.ts`, method `initializeComponentRegistry()`

There are exactly **22 components registered** in the component registry (meaning: code exists that adds them to the Map and they are NOT commented out).

There are exactly **6 additional components** that exist in the code but are **commented out** (disabled at the code level, can never run).

| # | Registry ID | Name | Path | Status | Notes |
|---|-------------|------|------|--------|-------|
| 1 | `9-attributes` | 9 Attributes Scorer | pattern_based | **Active** | Scores on 9 content attributes from text |
| 2 | `ffmpeg` | FFmpeg Visual Analysis | pattern_based | **Active** | Real video file analysis — motion, brightness, scenes |
| 3 | `7-legos` | 7 Idea Legos | pattern_based | **Active** | Detects 7 viral content patterns |
| 4 | `whisper` | Whisper Transcription | pattern_based | **Active** | Auto-transcribes audio to text |
| 5 | `gpt4` | GPT-4 Analysis | qualitative | **Active** | Currently uses heuristic, NOT real OpenAI API |
| 6 | `gemini` | Gemini Analysis | qualitative | **Conditional** | Real API call — disabled if no GOOGLE_GEMINI_AI_API_KEY |
| 7 | `niche-keywords` | Niche Keywords | historical | **Runtime-disabled** | Always disabled by default config |
| 8 | `feature-extraction` | Feature Extraction (152 features) | quantitative | **Active** | Extracts numerical features for XGBoost |
| 9 | `pattern-extraction` | Pattern Extraction | pattern_based | **Active** | Identifies viral patterns |
| 10 | `hook-scorer` | Hook Strength Scorer | pattern_based | **Active** | Scores opening hook quality |
| 11 | `audio-analyzer` | Audio Analysis | pattern_based | **Active** | Analyzes audio characteristics |
| 12 | `visual-scene-detector` | Visual Scene Detection | pattern_based | **Active** | Scene changes, composition |
| 13 | `thumbnail-analyzer` | Thumbnail Analyzer | pattern_based | **Active** | Visual thumbnail quality |
| 14 | `24-styles` | 24 Video Styles Classifier | pattern_based | **Active** | Classifies into 1 of 24 style categories |
| 15 | `virality-matrix` | TikTok Virality Matrix | pattern_based | **Active** | Uses OpenAI GPT-4 API call |
| 16 | `claude` | Claude Analysis | qualitative | **Conditional** | Real API — disabled if no ANTHROPIC_API_KEY |
| 17 | `virality-indicator` | Virality Indicator Engine | pattern_based | **Active** | Proprietary 6-factor algorithm, runs locally |
| 18 | `xgboost-virality-ml` | XGBoost ML Predictor v5 | quantitative | **Active** | Real trained model via Python subprocess |
| 19 | `unified-grading` | Pack 1: Unified Grading Rubric | pattern_based | **Active** | LLM rubric — but see Red Flag RF-1.1 |
| 20 | `editing-coach` | Pack 2: Editing Coach | pattern_based | **Active** | AI coaching from Pack 1 output |
| 21 | `visual-rubric` | Pack V: Visual Rubric | pattern_based | **Active** | Rule-based visual scoring from FFmpeg data |
| 22 | `viral-mechanics` | Pack 3: Viral Mechanics | pattern_based | **Stub** | Registered but returns hardcoded "not implemented" |

**Commented out (never execute):**

| ID | Name | Why Disabled |
|----|------|-------------|
| `xgboost` | Old XGBoost (fake) | Was heuristic-based, not real ML. Replaced by `xgboost-virality-ml` |
| `dps-engine` | DPS Calculator | Redundant — DPS calculated by orchestrator aggregation |
| `historical` | Historical Comparison | Zero variance — returned niche average regardless of content |
| `trend-timing-analyzer` | Trend Timing | Content-independent — same score for every video |
| `posting-time-optimizer` | Posting Time | Content-independent — recommendation tool, not prediction |
| `python-analysis` | Python Enhanced Analysis | Commented out, no explanation |

**Summary of what actually runs per prediction:**
- 22 registered → minus 1 stub (viral-mechanics) → minus 1 always-disabled (niche-keywords) = **20 that CAN run**
- Of those 20, gemini and claude depend on API keys being present
- Of the remaining, several require a video file (ffmpeg, audio-analyzer, visual-scene-detector, thumbnail-analyzer, whisper) and several require a transcript (many text-based ones)
- **Typical run with video + transcript + all API keys: ~18-19 components execute**
- **Typical run without some API keys or missing inputs: ~14-17 components execute**

#### The 4 Prediction Paths

Components are organized into 4 parallel execution paths with base weights:

| Path | Base Weight | Components (from code) |
|------|-----------|----------------------|
| **Quantitative** | 15% | feature-extraction, xgboost-virality-ml |
| **Qualitative** | 25% | gpt4, gemini, claude |
| **Pattern-Based** | 45% | ffmpeg, visual-scene-detector, thumbnail-analyzer, audio-analyzer, 7-legos, 9-attributes, 24-styles, virality-matrix, pattern-extraction, hook-scorer, virality-indicator, visual-rubric, unified-grading, editing-coach, viral-mechanics |
| **Historical** | 15% | historical, niche-keywords, trend-timing-analyzer, posting-time-optimizer |

Note: The Historical path has ALL its components either commented-out or runtime-disabled. It effectively contributes nothing. Its 15% weight gets redistributed to surviving paths via graceful degradation.

#### How Paths Become One DPS Number

1. Each component returns a DPS prediction (0-100) and confidence (0-1)
2. Within each path: confidence-weighted average of component predictions = path's aggregated DPS
3. Components returning suspicious default values (exactly 50, 62, 65, 68, 70) with no real analysis are excluded
4. LLM Consensus Gate checks if LLM components agree — if spread > 10 DPS, LLM weights zeroed
5. Based on path agreement level:
   - High agreement → simple weighted average of paths
   - Moderate → context-aware weighted consensus
   - Low → "deep analysis" favoring most reliable path
6. Result = one raw DPS number

#### Three Calibration Layers

**Layer 1 — Orchestrator calibration (inside `applyCalibrationAdjustments`):**
- Niche difficulty: multiplier from 0.75 (dropshipping) to 1.05 (pets/gardening). Side hustles = 0.85.
- Account size: Small (0-10K) = +15% boost, Medium (50-100K) = no change, Mega (1M+) = -32% reduction
- Conservative pull: Predictions above 80 → -8%, above 70 → -5%

**Layer 2 — Pipeline calibration (inside `calibratePrediction`):**
- No speech detected → confidence × 0.7
- Silent video + low visual scores → DPS capped at 55 (or 65 for visual-first styles)

**Layer 3 — Score versioning:**
- Checks for deployed production model version in `model_versions` table

#### Two-Lane Architecture

- **Score Lane:** DPS number shown to user. Only uses deterministic/ML components (XGBoost, FFmpeg, pattern extractors, virality indicator). LLM outputs do NOT change this number (unless consensus gate passes).
- **Coach Lane:** Pack 1 and Pack 2 qualitative feedback (attribute scores, improvement suggestions). Shown on screen as the coaching panels but never influences the DPS number.

On the upload-test page: the big DPS circle = Score Lane. The Pack 1/Pack 2 panels below = Coach Lane.

#### Pack 3 Status

Pack 3 (Viral Mechanics) is **NOT implemented**. The code returns a hardcoded stub:
```
{ pack: '3', status: 'not_implemented', notes: 'Viral Mechanics (Pack 3) is planned for future release' }
```
File: `src/lib/rubric-engine/viral-mechanics-types.ts`

The CLAUDE.md documentation claiming Pack 3 is "Complete" is incorrect. The UI showing "COMING SOON" is accurate.

### 1.2 Red Flags

| ID | Severity | Description |
|----|----------|-------------|
| **RF-1.1** | HIGH | Pack 1 (Unified Grading) shows "MOCK" badge in UI — means it's returning hardcoded placeholder data, not real LLM analysis. Either `ENABLE_MOCK_COMPONENTS=true` in env, or LLM API call is failing silently. |
| **RF-1.2** | HIGH | Pack 3 documented as "Complete" in CLAUDE.md but is actually a stub. Documentation has drifted from reality. |
| **RF-1.3** | MEDIUM | Historical path (15% weight) has ALL components disabled — it contributes nothing but its weight gets redistributed. Is this intentional or a gap? |
| **RF-1.4** | MEDIUM | GPT-4 component labeled as "GPT-4 Qualitative Analysis" but code comment says "uses heuristic analysis, not OpenAI API." If it's not calling GPT-4, it shouldn't be named GPT-4. |
| **RF-1.5** | LOW | UI displays hardcoded "23 components" / "24 components" strings that don't match the actual count of components executing. Should be dynamic. |
| **RF-1.6** | INFO | The `python-analysis` component is commented out with no explanation — unclear if it was deprecated or just temporarily disabled. |

### 1.3 Open Questions (May Be Answered in Later Phases)

| ID | Question | Expected Phase |
|----|----------|---------------|
| **OQ-1.1** | What specifically does each of the 9 attributes measure? What are the 7 idea legos? | Phase 4 |
| **OQ-1.2** | What does the XGBoost model actually predict on, and why are only 2 niches trained? | Phase 2 |
| **OQ-1.3** | Why is the DPS number in Pack 2 different from the main DPS? | Phase 3 |
| **OQ-1.4** | What do the recommendations mean and why do they look generic? | Phase 3 |
| **OQ-1.5** | Is the end-to-end chain the most efficient and maximal way of analyzing a video and producing the DPS score? Is this how the process should flow, or should it be restructured? | Post-Phase 5 |
| **OQ-1.6** | Pack 3 is not implemented — why? What is it supposed to do? What would it contribute to prediction accuracy if built? | Phase 4 |
| **OQ-1.7** | The variable component count (14-17) is unacceptable — we need an ironclad, exact number of what runs per prediction. Why isn't this deterministic? What causes the variance? | Post-Phase 5 |
| **OQ-1.8** | Do we have an accurate accounting of precisely what each active component contributes to the prediction? Is each one measuring something different, or is there redundancy? | Post-Phase 5 |
| **OQ-1.9** | What is the complete list of everything we measure in a video? (video style, format, visual hook, textual hook, verbal hook, cadence, etc.) Are these documented anywhere as "features"? | Phase 2 / Phase 4 |
| **OQ-1.10** | Are we storing the best-performing elements (best hooks, best scripts, best visual patterns) per niche/topic so they can be provided to users and used for training? | Phase 5 |
| **OQ-1.11** | Does this kind of element storage lead to better model training? Is there a feedback loop from stored viral elements back into the prediction model? | Phase 5 |
| **OQ-1.12** | Is there an existing research framework or structure (academic or industry) we can borrow from to properly build out the full set of video analysis components and tracking? Should we deep-research what the optimal set of measured features should be? | Post-Phase 5 |
| **OQ-1.13** | Do we need to deep-research other prediction models to determine whether our components are individually and cumulatively structured for maximum contribution? | Post-Phase 5 |
| **OQ-1.14** | Given all the inconsistencies identified (mock data, stubs, disabled paths, variable component count, mislabeled components), can the system genuinely be called "functioning properly"? | Post-Phase 5 |

### 1.4 Decisions Pending (Thomas to decide after all phases)

| ID | Decision Needed |
|----|----------------|
| **DP-1.1** | Should the Historical path be rebuilt with real components, or permanently removed? |
| **DP-1.2** | Should Pack 3 be implemented or removed from the UI? |
| **DP-1.3** | Should component count in UI be made dynamic (show actual count)? |
| **DP-1.4** | After all phases: Is this end-to-end chain the optimal architecture? |
| **DP-1.5** | Should we conduct deep research into existing prediction frameworks (academic/industry) to validate or restructure our component set? |
| **DP-1.6** | Do we need a "viral element storage" system that captures the best hooks, scripts, visual patterns per niche for user access and model training? |
| **DP-1.7** | Should the component count be made deterministic (same components always run regardless of environment), or is conditional execution acceptable? |

---

## Phase 2: XGBoost & Niche System

### 2.1 Verified Findings

#### What XGBoost Actually Is

XGBoost is a machine learning model — a real, trained statistical model (not heuristic, not LLM). It was trained on actual video data with known outcomes (actual DPS scores) to learn which video features correlate with virality. It's one of the 22 registered components (component #18: `xgboost-virality-ml`).

There are TWO versions of XGBoost in the codebase:

| Version | Status | What It Does |
|---------|--------|-------------|
| **v5-simplified** | **Active by default** | A heuristic fallback. It takes 14 hand-tuned feature weights (duration, motion, word count, etc.), normalizes them, and produces a weighted score. This is NOT a real ML model — it's a formula pretending to be one. |
| **v6** | **Available but NOT active by default** | A real trained XGBoost model. Calls a Python subprocess (`scripts/predict-xgboost.py`) which loads a real `.json` model file and `.pkl` scaler. Requires `MODEL_VERSION=xgb_v6` in `.env.local` to activate. |

**Which one is running right now?** Unless `MODEL_VERSION=xgb_v6` is set in the environment, the system uses v5-simplified (the heuristic). The green "Using XGBoost ML Trained Model" badge in the UI does NOT guarantee the real model is running.

#### The v6 Model's Training Data (Critical)

From `models/xgboost-v6-metadata.json`:

- **Trained on:** 27 total rows (21 train, 6 eval)
- **Source:** Side Hustles niche only (`trendzo_side_hustles_training.csv`)
- **Train/eval split:** Time-based 80/20
- **DPS range in training data:** 36.0 to 91.29 (mean: 54.7)
- **Cross-validation R²:** -164,093 (catastrophically bad — means the model generalizes extremely poorly)
- **Eval R²:** 0.0 (the model explains none of the variance in the eval set)
- **Train R²:** 0.983 (near-perfect on training data = severe overfitting)

**Plain English:** The v6 model memorized 21 videos perfectly but cannot predict anything new. It is massively overfit. This is because 27 training examples is far too few for a 42-feature model.

#### The 42 Features XGBoost Uses

The model takes 42 input features organized in 4 groups:

**FFmpeg features (14):** duration_seconds, resolution_width, resolution_height, fps, motion_score, has_faces, face_time_ratio, has_music, avg_volume, brightness_avg, contrast_ratio, saturation_avg, visual_complexity, hook_scene_changes

**Text features (7):** text_word_count, text_char_count, text_sentence_count, text_avg_word_length, text_question_count, text_exclamation_count, text_hashtag_count

**Component prediction features (18):** hook_scorer_pred/conf, 7_legos_pred/conf, 9_attributes_pred/conf, 24_styles_pred/conf, niche_keywords_pred/conf, virality_matrix_pred/conf, pattern_extraction_pred/conf, trend_timing_pred/conf, posting_time_pred/conf

**LLM features (2):** gpt4_score, claude_score

**Important finding:** The 18 "component prediction" features are NOT pulled from the actual component results. They are independently computed INSIDE the XGBoost component using simple keyword-matching heuristics (e.g., checking if the transcript contains words like "problem", "solution", "benefit"). These are duplicative approximations of what the actual standalone components do.

#### Top Features by Importance (v6 model)

Only 4 features matter in the trained v6 model:

| Feature | Importance | What It Is |
|---------|-----------|-----------|
| `text_avg_word_length` | 42.4% | Average character length of words in transcript |
| `text_char_count` | 33.5% | Total characters in transcript |
| `visual_complexity` | 20.7% | FFmpeg-derived visual complexity score |
| `duration_seconds` | 3.2% | Video length |

**Everything else has 0% importance** — including motion_score, has_faces, has_music, all component predictions, and both LLM scores. The model learned to predict DPS from essentially 3 features (word length, character count, visual complexity) because that's all 27 training examples could support.

#### Why Only 2 Niches Have the Special XGBoost Designation

The UI niche dropdown has 2 groups:
- **"XGBoost ML Trained Niches"**: Side Hustles (0.61 correlation) and Personal Finance (0.52 correlation) — 2 entries
- **"General Niches"**: 20 niches including ALL niches (Personal Finance/Investing and Side Hustles/Making Money Online appear here AGAIN with different value keys)

**⚠️ CORRECTION (from Thomas's review):** The original audit stated "18 other niches." The actual count is 20 general niches. Side Hustles and Personal Finance are duplicated across both groups with different value keys (`side_hustles` vs `side-hustles`, `personal_finance` vs `personal-finance`). Only the underscore versions in Group 1 trigger the XGBoost badge and model mapping.

The special designation means: for these 2 niches, the system has a trained XGBoost model file that was built from real labeled data in that niche. The correlation numbers (0.61 and 0.52) represent how well the model's predictions matched actual outcomes during evaluation.

**What happens when you select a non-XGBoost niche?** The `xgboost-virality-ml` component still runs, but it force-maps ANY niche to `side_hustles` as the default. Code at line 4164: `const supportedNiche = niche === 'personal_finance' ? 'personal_finance' : 'side_hustles'`. So if you pick "Fitness" or "Cooking," you get the Side Hustles model applied anyway.

**The green checkmark "Using XGBoost ML Trained Model - Best prediction accuracy!"** only appears when `side_hustles` or `personal_finance` is selected. For all other niches, the XGBoost component still runs with the side_hustles model but the UI doesn't highlight it.

#### What the Pipeline Mode Dropdown Does

| Mode | What Changes |
|------|-------------|
| **Standard** | Default. All components run normally. LLMs use their default temperature. A/B tests are random. |
| **Fast** | Name exists in the dropdown but **has NO special behavior in the code**. The pipeline stores it in the DB as `mode='fast'` but does not skip any components or change any weights. It's identical to Standard. |
| **Admin** | Same as Fast — name exists but **no special behavior implemented**. Stored as `mode='admin'` but functionally identical to Standard. |
| **Validation** | **The only mode with real behavior.** Sets `isDeterministic=true` which forces: LLM temperature → 0, A/B variant → deterministic hash. Also enables the "Exclude LLMs from DPS" checkbox. Purpose: repeatable predictions for QC testing. |

#### Why the Component Count Says "23" in Image 1 but "24" in Image 3

The "23 components" text in Image 1 is a **hardcoded string** in the UI:
```
Uses 23 components: XGBoost Virality ML, FFmpeg, GPT-4, 9 Attributes, 24 Styles, 7 Legos, Gemini, and more
```

The "24 components" in Image 3 (the pipeline steps display) comes from the API response field `componentCount` which is the length of `components_used` — the actual components that executed and returned success. This number varies per run depending on which components had the required inputs and API keys.

Neither number is a deliberate architectural choice. Both are artifacts — one hardcoded, one variable.

#### How Account Size Affects the DPS Score

Account size goes through the calibration layer (see Phase 1, Section "Three Calibration Layers"). In plain English:

- DPS stands for "Dynamic Percentile System" and measures how well a video performs **relative to what's expected for that account size and cohort**
- A video getting 50K views from a 5K-follower account is exceptional. The same 50K views from a 500K-follower account is below average.
- The multiplier adjusts the raw prediction to reflect this:

| Account Size | Estimated Followers | Multiplier | Effect |
|-------------|-------------------|-----------|--------|
| Small (0-10K) | ~5,000 | 1.15 | +15% boost |
| Growing (10K-50K) | ~35,000 | 1.08 | +8% boost |
| Medium (50K-100K) | ~75,000 | 1.00 | No change (baseline) |
| Large (100K-500K) | ~350,000 | 0.88 | -12% reduction |
| Very Large (500K-1M) | ~750,000 | 0.78 | -22% reduction |
| Mega (1M+) | ~2,000,000 | 0.68 | -32% reduction |

The same video content will get a higher DPS prediction for a small account and a lower DPS prediction for a mega account.

### 2.2 Red Flags

| ID | Severity | Description |
|----|----------|-------------|
| **RF-2.1** | CRITICAL | The v6 XGBoost model is trained on only 27 videos. Cross-validation R² is -164,093 (catastrophic overfitting). This model cannot generalize. |
| **RF-2.2** | CRITICAL | The v5-simplified "XGBoost" is not XGBoost at all — it's a hand-coded heuristic with hardcoded feature weights. The name is misleading. |
| **RF-2.3** | HIGH | Unless `MODEL_VERSION=xgb_v6` is set in env, the system runs the heuristic (v5), NOT the trained model. The UI's "Using XGBoost ML Trained Model" badge may be lying. Need to verify which is actually running. |
| **RF-2.4** | HIGH | XGBoost v6 model only trained on Side Hustles niche. When any other niche is selected (including Personal Finance), the Side Hustles model is used. The "Personal Finance (XGBoost: 0.52 correlation)" label implies a separate trained model for that niche — but there is no separate model file. |
| **RF-2.5** | HIGH | The 18 "component prediction" features inside XGBoost are computed independently using simple keyword matching, NOT pulled from the actual component execution results. This means XGBoost is doing its own crude version of what other components do, potentially creating redundancy and inconsistency. |
| **RF-2.6** | MEDIUM | Pipeline modes "Fast" and "Admin" have NO implementation. They are identical to "Standard." The dropdown implies they do something different. |
| **RF-2.7** | MEDIUM | The v6 model's feature importance shows 38 of 42 features have 0% importance. The model is essentially predicting DPS from word length + character count + visual complexity. This is not a meaningful virality model. |

### 2.3 Thomas's Phase 2 Questions & Concerns

#### Q-2A: How do we ensure the real XGBoost is running?
The UI badge "Using XGBoost ML Trained Model - Best prediction accuracy!" displays when a trained niche is selected, but it does NOT verify which model version (v5 heuristic vs v6 real) is actually active. We need a way to verify at runtime which model is executing, and the UI badge must reflect reality, not assumption.

#### Q-2B: What is XGBoost's actual impact on predictions?
As one of 22 components, XGBoost contributes its DPS prediction to the quantitative path (15% base weight). Its prediction gets averaged with all other component predictions. But if it's running the v5 heuristic (not real ML), its contribution is just a weighted formula, not a learned model. Need to determine: does replacing XGBoost's output with random noise change the final DPS meaningfully?

#### Q-2C: Is XGBoost optimized and maximized, or does it need enhancement?
As currently built: NO. The v6 model is trained on 27 videos (catastrophic overfitting). The v5 is a hand-coded formula. Neither represents real ML prediction. This component needs either (a) massive training data expansion or (b) a fundamental rearchitect.

#### Q-2D: How do we fix the v6 model's overfitting problem?
The model "memorized 21 videos perfectly but cannot predict anything new" because 27 training examples is far too few for 42 features. The fix requires hundreds to thousands of labeled examples per niche. The training pipeline infrastructure exists (Phase 82/83) but needs to be actually producing labeled data at scale.

#### Q-2E: Do we need a component efficacy evaluation architecture?
YES — there is currently no system that measures whether each component actually improves prediction accuracy. We need something that can answer: "If I remove component X, does accuracy go up or down?" This is a critical gap.

#### Q-2F: What does the "component prediction features" issue mean?
The 18 "component prediction" features inside XGBoost are independently computed using simple keyword matching, NOT pulled from the actual component execution results. This means XGBoost is doing its own crude version of what the real components do, potentially creating redundancy. The real fix would be: feed XGBoost the actual outputs from the real components that already ran, not re-approximate them.

#### Q-2G: Why do 38 of 42 features have 0% importance?
Because with only 27 training samples, the model can only learn from 3-4 features before overfitting. With thousands of training examples, the model WOULD learn that motion_score, has_faces, has_music etc. matter. The 0% importance is a symptom of insufficient data, not proof those features don't matter for virality.

#### Q-2H: CRITICAL — Niche dropdown count correction
**The audit originally stated 18 general niches.** This was WRONG. The actual dropdown contains:
- **Group 1 (XGBoost Trained):** 2 niches (side_hustles, personal_finance)
- **Group 2 (General Niches):** 20 niches (including duplicates of personal-finance and side-hustles with different value keys)
- **Total unique niches represented:** 20 (Side Hustles and Personal Finance appear in BOTH groups with different value keys: `side_hustles` vs `side-hustles`, `personal_finance` vs `personal-finance`)

This duplication means selecting "Side Hustles" from Group 1 (`side_hustles`) triggers XGBoost, but selecting "Side Hustles/Making Money Online" from Group 2 (`side-hustles`) does NOT trigger the same badge or model mapping. This is a UI/data consistency bug.

#### Q-2I: Pipeline mode intent — why is this dropdown necessary?
The pipeline mode dropdown exists for QC/debugging purposes. Only "Validation" mode has real behavior (deterministic LLM calls for repeatable testing). "Fast" and "Admin" are unimplemented labels. For an end-user product, this dropdown would not exist. For admin testing, only Standard and Validation are meaningful.

#### Q-2J: Why does Pack 1/Pack 2 information appear to be the same regardless of video?
To be investigated in Phase 4 (Pack Deep-Dives). This is likely related to RF-1.1 (Pack 1 returning MOCK data).

#### Q-2K: ⚠️ CRITICAL CORRECTION — DPS means "Dynamic Percentile System", NOT "Daily Performance Score"
**DPS = Dynamic Percentile System.** This is a proprietary, cohort-based scoring methodology defined in `frameworks-and-research/POC Research & Framework Data/Framework- The Dynamic Percentile System DPS 8-8-25.MD` and implemented in `src/lib/services/viral-prediction/dynamic-percentile-system.ts`.

The DPS methodology works by:
1. **Cohort grouping** — creators compared to others with ±20% follower count
2. **Z-score calculation** — statistical performance vs cohort median
3. **Time decay** — platform-specific decay (TikTok decays fastest)
4. **Engagement weighting** — likes, comments, shares weighted by platform
5. **Percentile ranking** — where this video falls within its cohort

The DPS score represents: "How does this video's performance compare to what is typical for a creator of this size on this platform, accounting for time and engagement?" It is NOT a raw performance number — it is a PERCENTILE-BASED ranking system.

**Ramification of the misunderstanding:** If the prediction pipeline and its components are treating DPS as a raw 0-100 score rather than a percentile-based cohort ranking, then the entire calibration logic (niche difficulty multipliers, account size adjustments, conservative pull-back) may be architecturally misaligned with the DPS methodology. This requires URGENT investigation in the Post-Audit phase.

#### Q-2L: ★★★ GOD-TIER QUESTION — How to achieve 80-90% prediction accuracy
**"If God Himself needed to build technology that can predictably pinpoint with 80-90% accuracy what needs to be contained in a video to make it go viral, how should He go about doing that?"**

This is THE question that must be comprehensively answered in the Post-Audit phase. It requires:
1. Deep research into existing academic/industry prediction models
2. Evaluation of whether our current component architecture can support that accuracy
3. Identification of everything we're doing that could jeopardize reaching that accuracy
4. A concrete plan for what needs to change

**⚠️ MANDATORY RETURN POINT: This question and Q-2K (DPS definition) must be the FIRST things addressed in the Post-Audit resolution phase.**

#### Q-2M: What guardrails ensure flawless accuracy across the entire system?
The gap between what the UI shows, what the code does, what the documentation says, and what is actually running is unacceptable. We need guardrails that ensure:
- UI labels match actual system behavior
- Documentation matches actual code state
- Component outputs are verified, not assumed
- No misrepresentation of model status or capability
This must be addressed as a systemic solution in the Post-Audit phase.

### 2.4 Open Questions (May Be Answered in Later Phases)

| ID | Question | Expected Phase |
|----|----------|---------------|
| **OQ-2.1** | How many labeled training videos do we actually have across all niches? Is 27 the total, or are there more that haven't been used? | Post-Phase 5 |
| **OQ-2.2** | The training pipeline (Phase 82/83 in the codebase) — is it producing the labeled data needed to retrain XGBoost with thousands of examples? | Post-Phase 5 |
| **OQ-2.3** | Should the XGBoost component features pull from actual component execution results instead of computing its own heuristic approximations? | Post-Phase 5 |
| **OQ-2.4** | Is the 0.61 correlation for Side Hustles computed from the v5 or v6 model? Where does that number come from? | Post-Phase 5 |
| **OQ-2.5** | Is the prediction pipeline treating DPS as a raw 0-100 score or as a Dynamic Percentile System cohort ranking? Are these architecturally aligned? | Post-Phase 5 (URGENT) |

### 2.5 Red Flags (Updated)

| ID | Severity | Description |
|----|----------|-------------|
| **RF-2.1** | CRITICAL | The v6 XGBoost model is trained on only 27 videos. Cross-validation R² is -164,093 (catastrophic overfitting). This model cannot generalize. |
| **RF-2.2** | CRITICAL | The v5-simplified "XGBoost" is not XGBoost at all — it's a hand-coded heuristic with hardcoded feature weights. The name is misleading. |
| **RF-2.3** | HIGH | Unless `MODEL_VERSION=xgb_v6` is set in env, the system runs the heuristic (v5), NOT the trained model. The UI's "Using XGBoost ML Trained Model" badge may be lying. Need to verify which is actually running. |
| **RF-2.4** | HIGH | XGBoost v6 model only trained on Side Hustles niche. When any other niche is selected (including Personal Finance), the Side Hustles model is used. The "Personal Finance (XGBoost: 0.52 correlation)" label implies a separate trained model — but there isn't one. |
| **RF-2.5** | HIGH | The 18 "component prediction" features inside XGBoost are computed independently using simple keyword matching, NOT pulled from actual component results. Redundant and potentially inconsistent. |
| **RF-2.6** | MEDIUM | Pipeline modes "Fast" and "Admin" have NO implementation. Identical to "Standard." Dropdown implies otherwise. |
| **RF-2.7** | MEDIUM | v6 model's feature importance: 38/42 features at 0% importance. Model predicts from word length + char count + visual complexity only. |
| **RF-2.8** | HIGH | Niche dropdown has Side Hustles and Personal Finance appearing TWICE with different value keys (`side_hustles` vs `side-hustles`). Only the underscore version triggers XGBoost. |
| **RF-2.9** | ★CRITICAL★ | DPS = "Dynamic Percentile System" (cohort-based percentile ranking), but Phase 1 findings described it as "Daily Performance Score" and the orchestrator calibration treats it as a raw 0-100 score with arbitrary multipliers. There may be a fundamental architectural misalignment between how DPS is DEFINED vs how it's COMPUTED in the prediction pipeline. |

### 2.6 Decisions Pending

| ID | Decision Needed |
|----|----------------|
| **DP-2.1** | Should we invest in collecting hundreds/thousands of labeled videos per niche to train a real XGBoost model, or is a different ML approach needed? |
| **DP-2.2** | Should the "Fast" and "Admin" pipeline modes be implemented with real behavior, or removed from the dropdown? |
| **DP-2.3** | Should the XGBoost niche mapping be transparent in the UI? |
| **DP-2.4** | Is XGBoost the right model architecture given the feature space? |
| **DP-2.5** | Do we need a component efficacy evaluation system that measures each component's actual contribution to accuracy? |
| **DP-2.6** | Should the duplicate niche entries be consolidated (remove duplicates from General group)? |
| **DP-2.7** | ★PRIORITY★ Is the entire calibration system (niche multipliers, account size adjustments) compatible with DPS as a percentile ranking, or does it need to be rebuilt? |

---

## Phase 3: Scoring & Display — How Scores Are Calculated and Shown

### 3.1 Verified Findings

#### How the Raw DPS Number Is Calculated

The DPS number shown in the big circle on `/admin/upload-test` is produced through this exact chain:

**Step 1 — Component Execution:**
Each component runs and returns a `prediction` (0-100 number) and a `confidence` (0-1 number).

**Step 2 — Path Aggregation (inside orchestrator `executeMultiPath`):**
Within each of the 4 paths (quantitative, qualitative, pattern_based, historical), the system computes a confidence-weighted average of all successful component predictions in that path:
```
path_dps = Σ(component_prediction × component_confidence) / Σ(component_confidence)
```
Each path also has a `weight` assigned from the workflow context weights (see Phase 1). After path execution, if any path fails entirely (e.g., qualitative path fails due to missing API keys), its weight is redistributed proportionally to surviving paths.

**Step 3 — LLM Consensus Gate:**
The orchestrator checks LLM component predictions (gpt4, gemini, claude, unified-grading, editing-coach, 9-attributes, 7-legos). If the spread (max LLM prediction - min LLM prediction) exceeds 10 DPS, ALL LLM weights are zeroed. If spread is ≤10, LLM component weights are capped at 0.15.

**Step 4 — Agreement Check:**
The orchestrator checks how much the path-level predictions agree:
- **High agreement** (low variance): Simple weighted average of paths → `Σ(path_dps × path_weight) / Σ(path_weight)`
- **Moderate agreement**: Weighted average incorporating per-component reliability scores from a learning loop
- **Low agreement**: Qualitative path (Gemini) gets 3x weight boost because code comment says "Gemini is the most accurate differentiator"

**Step 5 — Viral Pattern Boost:**
If the orchestrator detects "viral patterns" in the input (a separate check), a small percentage boost is applied: `finalPrediction *= (1 + patternBoost)`.

**Step 6 — Orchestrator Calibration (`applyCalibrationAdjustments`):**
Three multiplicative factors:
- **Niche difficulty factor:** 0.75 (dropshipping) to 1.05 (pets/gardening). These are hardcoded in a lookup table.
- **Account size factor:** Based on estimated follower count. See Phase 2 table.
- **Conservative pull:** If prediction > 80 → multiply by 0.92. If > 70 → multiply by 0.95.

Formula: `finalPrediction = rawPrediction × nicheFactor × accountFactor × conservativeFactor`

**Step 7 — Pipeline Calibration (`calibratePrediction` in prediction-calibrator.ts):**
Three additional rules applied AFTER the orchestrator calibration:
- **Rule 1 — Confidence penalty:** If no speech detected, multiply confidence by 0.7 (DPS unchanged).
- **Rule 2 — Silent video DPS cap:** If no audio AND no transcript AND Pack V visual score < 50, soft-cap DPS at 55 (or 65 for visual-first styles like ASMR, cooking_montage).
- **Rule 4 — High DPS scaling (LLM over-prediction correction):**
  - DPS 60-70: multiply by 0.85 (15% reduction)
  - DPS 70-80: multiply by 0.80 (20% reduction)
  - DPS 80+: multiply by 0.75 (25% reduction)

**This means the pipeline applies TWO separate high-prediction reductions:**
1. Orchestrator conservative pull: >70 → -5%, >80 → -8%
2. Calibrator high DPS scaling: 60-70 → -15%, 70-80 → -20%, 80+ → -25%

These compound multiplicatively. For a raw prediction of 85:
- After orchestrator: 85 × 0.92 = 78.2
- After calibrator: 78.2 × 0.80 = 62.6
- Total reduction: 85 → 62.6 (a 26.4% reduction)

#### What the DPS Gauge Circle Displays

**Source file:** `src/components/ui/trendzo/DPSGauge.tsx`

The DPS Gauge is a circular SVG progress indicator. It takes a `score` (0-100) and displays it with:
- **Number in center:** The DPS value to 1 decimal place (e.g., "62.6")
- **Label below number:** "DPS" in gray text
- **Color gradient:** Based on score ranges:
  - 75+ → green gradient
  - 60-74 → yellow-green gradient
  - 40-59 → yellow-amber gradient
  - Below 40 → red-orange gradient
- **Tier badge:** Below the circle, a text label (see Tier Table below)
- **Animation:** Counts up from 0 to the score over 1.5 seconds with ease-out

**The DPSGauge component takes `score` and optionally `confidence`, `size`, `animated`, `showTier` props.** However, looking at the actual component code, the `confidence` prop is defined in the CALLING code (upload-test page passes it) but the DPSGauge component interface ONLY accepts `score`, `animate`, `size`, and `showTier`. **Confidence is passed but not used by the gauge component.**

#### The Tier System — Two DIFFERENT Tier Systems Exist

**CRITICAL FINDING:** There are TWO completely different tier classification systems that use different thresholds and different labels, and they DO NOT match.

**System 1 — DPSGauge UI component (`DPSGauge.tsx`, function `getTier`):**

| DPS Range | Tier Label | Color |
|-----------|-----------|-------|
| 90+ | Viral Potential | Purple |
| 75-89 | Excellent - Top 10% | Green |
| 60-74 | Good - Top 25% | Green |
| 40-59 | Average | Yellow |
| Below 40 | Needs Work | Red |

**System 2 — Orchestrator (`kai-orchestrator.ts`, method `getViralPotential`):**

| DPS Range | Tier Label |
|-----------|-----------|
| 85+ | mega-viral |
| 70-84 | viral |
| 55-69 | good |
| 40-54 | average |
| Below 40 | low |

**The tier shown to the user depends on which system renders it.** The DPSGauge uses System 1 (getTier). The `viralPotential` field in the API response uses System 2 (getViralPotential). Both are displayed on the upload-test page — the gauge shows System 1, but the API response's `tier` field uses System 2.

**System 3 — Dynamic Percentile System (`dynamic-percentile-system.ts`, method `classifyVirality`):**

| Percentile | Category |
|-----------|----------|
| 99.9+ | mega-viral |
| 99+ | hyper-viral |
| 95+ | viral |
| 90+ | trending |
| Below 90 | normal |

**This third system is NOT connected to the prediction pipeline at all.** It lives in a separate class that requires actual view counts, follower counts, and engagement data. (See Red Flag RF-3.1 below.)

#### What the "Cohort Context" Panel Shows

Below the DPS gauge, the UI displays a "Cohort Context" panel with:
- **Account Size:** The selected dropdown value (shown as-is)
- **Cohort Performance:** A text label derived from the predicted DPS:
  - DPS ≥ 70 → "Top 30% of Cohort"
  - DPS ≥ 50 → "Above Average"
  - DPS ≥ 30 → "Average"
  - Below 30 → "Below Average"

**This is a THIRD tier system** with completely different thresholds and labels than both the gauge tier and the orchestrator tier. The "Top 30% of Cohort" and "Above Average" labels are NOT derived from any actual cohort comparison or percentile calculation. They are hardcoded interpretations of the DPS number.

The panel also shows calibration adjustments: raw score, account factor, niche factor, conservative factor, and final score. Below that, a description: "DPS is relative to account size. A DPS of X for a [size] account means this video is predicted to [outperform/underperform] typical content from similar-sized creators."

**This description claims DPS is relative to account size, which is partially true** — the account size multiplier does adjust the score. But it is NOT a true cohort percentile as the Dynamic Percentile System defines it.

#### How the Range Is Calculated

**Source:** `kai-orchestrator.ts`, lines 974-986

The prediction range (shown as "[X.X - Y.Y] DPS" below the gauge) is computed as:

```
baseUncertainty = (1 - confidence) × 15
predictionUncertainty = (prediction > 75) ? (prediction - 75) × 0.5 : 0
totalUncertainty = baseUncertainty + predictionUncertainty
range = [prediction - totalUncertainty, prediction + totalUncertainty]
```

Clamped to [0, 100].

**Example:** If DPS = 65 and confidence = 0.72:
- baseUncertainty = (1 - 0.72) × 15 = 4.2
- predictionUncertainty = 0 (65 < 75)
- range = [60.8, 69.2]

**Note:** This range is SYMMETRIC around the prediction (same distance above and below). A real confidence interval would typically be asymmetric for bounded scores.

**There's a secondary range calculation** in the `/api/kai/predict` route (lines 161-165) used for backward compatibility:
```
uncertainty = (1 - confidence) × 15
range = [max(0, dps - uncertainty), min(100, dps + uncertainty)]
```
This one does NOT include the extra uncertainty for high predictions. Both are present in the API response — the orchestrator's range (via `raw_result.range`) and the API's range (via `predicted_range`). The UI uses `result.predicted_range` which could come from either, depending on which field exists.

#### How Confidence Is Calculated

Confidence is NOT a single calculated value — it's assembled through multiple layers:

1. **Component-level confidence:** Each component returns its own confidence (0-1). For heuristic components this is usually hardcoded (e.g., 0.7, 0.8). For LLM components it's set based on model reliability.
2. **Path-level confidence:** Weighted average of component confidences in that path.
3. **Synthesis-level adjustment:** If paths agree well, confidence gets +0.1 boost (capped at 0.98).
4. **Orchestrator calibration:** If niche factor < 0.9, confidence gets -0.05. If no video file, -0.1. Clamped to [0.4, 0.95].
5. **Pipeline calibration:** If no speech detected, multiply by 0.7.

The final confidence is displayed nowhere prominently on the upload-test page — it's only used to compute the range width. The "Grader Confidence" shown in Pack 1 is Pack 1's OWN confidence, NOT the overall prediction confidence.

#### ★ CRITICAL: DPS Is NOT the Dynamic Percentile System

**This confirms and escalates Red Flag RF-2.9.**

The `DynamicPercentileSystem` class (`src/lib/services/viral-prediction/dynamic-percentile-system.ts`) is a fully implemented, sophisticated statistical system that:
- Takes ACTUAL video metrics (view count, follower count, hours since upload, engagement)
- Queries a cohort of similar-sized creators from the `videos` table
- Computes a z-score (how many standard deviations above/below the cohort mean)
- Converts to a percentile (where does this video rank within its cohort)
- Classifies virality using statistical thresholds

**This class is NOT imported, NOT called, and NOT connected to the prediction pipeline in ANY way.** The orchestrator (`kai-orchestrator.ts`) does not import it. The pipeline (`runPredictionPipeline.ts`) does not import it. The API route (`/api/kai/predict`) does not import it.

**Where IS it used?** Only in:
1. `src/lib/services/dps-powered-content-generator.ts` — a content generation tool (not prediction)
2. `src/app/api/outcomes/ingest/route.ts` — an outcomes tracking endpoint (post-publication)
3. `src/lib/services/viral-prediction/main-prediction-engine.ts` — a separate prediction engine that is NOT the canonical pipeline

**What the prediction pipeline calls "DPS" is fundamentally different from the Dynamic Percentile System:**

| Aspect | Pipeline "DPS" | Dynamic Percentile System |
|--------|---------------|--------------------------|
| **Input** | Video content (transcript, visuals) | Actual metrics (views, likes, shares) |
| **When used** | BEFORE publishing (prediction) | AFTER publishing (measurement) |
| **Method** | Weighted component aggregation | Statistical z-score vs cohort |
| **What it measures** | "How viral will this be?" | "How viral was this?" |
| **Scale** | Arbitrary 0-100 composite | True percentile ranking |
| **Account size handling** | Multiplicative calibration factor | Actual cohort comparison |
| **Niche handling** | Hardcoded difficulty multiplier | Same-cohort comparison |

**The pipeline's "DPS" is a composite prediction score, not a percentile ranking.** Calling it "DPS" (Dynamic Percentile System) is misleading because no percentile calculation occurs. The account size and niche adjustments are crude multipliers, not true cohort-based statistical comparisons.

#### How Pack 1/2/3/V Results Are Displayed

**Pack 1 (Unified Grading) — Display:**
- Blue gradient panel with "LLM RUBRIC" badge
- Source badge: "REAL" (green) or "MOCK" (yellow) based on `_meta.source`
- Grader Confidence percentage
- 9 Attribute Scores shown as horizontal bars (scaled 0-100 from 1-10 scores)
- 7 Idea Legos shown as checkmark/x grid
- Hook Analysis: type, clarity score, pattern
- Pacing/Clarity/Novelty scores as numbers

**Pack 2 (Editing Coach) — Display:**
- Purple gradient panel with "AI COACH" badge
- Source badge: "REAL" or "MOCK"
- Before/After DPS comparison (current vs potential)
- Top 3 improvement suggestions with priority number, estimated DPS lift, what to change, how to change it
- Coach Notes
- "Generate Improved Script" CTA button

**Pack 3 (Viral Mechanics) — Display:**
- TWO conditional renders:
  1. If `result.qualitative_analysis.pack3` has a `mechanics` property: Shows full panel with detected mechanics, strength bars (green/yellow/red), evidence, signals
  2. If `result.qualitative_analysis.pack3` has `status === 'not_implemented'`: Shows "COMING SOON" stub

**Pack V (Visual Rubric) — Display:**
- Orange gradient panel with "VISUAL ONLY" badge
- Overall Visual Score (out of 100)
- 5 sub-scores: Visual Hook, Pacing, Pattern Interrupts, Visual Clarity, Style Fit (each out of 10 with progress bars)
- Evidence text for each sub-score

**Mock vs Real Detection:**
The UI correctly reads `_meta.source` and shows "MOCK" in yellow or "REAL" in green. This is displayed for Pack 1, Pack 2, Pack 3, and Pack V. **However, the mock decision happens upstream:**
- Pack 1 (`executeUnifiedGrading` in orchestrator): If `GOOGLE_AI_API_KEY` is missing → uses `createMockUnifiedGradingResult` which returns hardcoded data with `_meta.source = 'mock'`
- Pack 2 (`executeEditingCoach`): Uses rule-based suggestions (NOT mock), but depends on Pack 1's output
- Pack V (`visual-rubric`): Rule-based from FFmpeg data (not LLM-dependent)

#### ★ Why Pack 1/Pack 2 May Show Same Data Regardless of Video (Q-2J)

**Verified finding from code analysis:**

If `GOOGLE_AI_API_KEY` is not set in the environment:

1. **Pack 1** calls `createMockUnifiedGradingResult()` which generates HARDCODED scores:
   - All attribute scores cycle through 5, 6, 7, 8 (fixed pattern, NOT based on transcript content)
   - Hook type is always "question"
   - Hook clarity score is always 7
   - Grader confidence is always 0.8
   - `_meta.source` = "mock"

2. **Pack 2** takes Pack 1's output and runs `generateRuleBasedSuggestions()`. Since Pack 1's mock output is nearly identical each time (the only variation comes from which transcript substring is used for evidence text), Pack 2's suggestions will be nearly identical too.

3. **Even IF `GOOGLE_AI_API_KEY` IS set:** Pack 1 calls Google's Gemini AI, which SHOULD produce different results per video. If Pack 1 shows "REAL" but still looks the same, it could mean the LLM is failing silently and falling back to mock, or the LLM is returning similar results because the prompt structure produces homogeneous output.

**To determine which scenario is active:** Check if the Pack 1 badge shows "MOCK" or "REAL". If "MOCK" → the API key is missing or invalid. If "REAL" → the LLM is running but may be producing similar output.

#### What "23 Components" Means

The upload-test page has TWO hardcoded instances of "23 components":
1. **Header subtitle (line 1606):** `"AI-Powered Video Analysis • 23 Components • Real-time Viral Predictions"`
2. **Form description (line 1847):** `"Uses 23 components: XGBoost Virality ML, FFmpeg, GPT-4, 9 Attributes, 24 Styles, 7 Legos, Gemini, and more"`

The actual number is 22 registered (see Phase 1). Neither 23 nor 24 is architecturally correct — they are hardcoded display strings that were never updated as components were added/removed.

Additionally, the results section shows the ACTUAL executed count from the API response:
- "Analyzed (X components)" — from `result.debug.executedComponentCount`
- "Y SCHEDULED" / "Z EXECUTED" badges — from `result.components_used.length` and `result.debug.executedComponentCount`

These dynamic values ARE accurate per-run.

### 3.2 Red Flags

| ID | Severity | Description |
|----|----------|-------------|
| **RF-3.1** | ★CRITICAL★ | The prediction pipeline's "DPS" is NOT the Dynamic Percentile System. The `DynamicPercentileSystem` class (which implements real cohort-based z-score percentile ranking) is not imported, called, or connected to the prediction pipeline in any way. The pipeline produces a composite prediction score using weighted component averaging and calls it "DPS." This is a fundamental misrepresentation. |
| **RF-3.2** | HIGH | TWO separate high-prediction reduction systems exist and compound multiplicatively: orchestrator conservative pull (-5% to -8%) AND calibrator high DPS scaling (-15% to -25%). A raw prediction of 85 gets reduced to ~62.6. This double-reduction may be intentional (over-prediction correction) or accidental (added by different developers without awareness of the other). Either way, it's aggressive. |
| **RF-3.3** | HIGH | THREE different tier classification systems exist with DIFFERENT thresholds and labels: (1) DPSGauge UI component, (2) Orchestrator `getViralPotential`, (3) DynamicPercentileSystem `classifyVirality`. The user sees System 1 on the gauge but System 2 in the API response. They do not agree at common boundary points (e.g., DPS 75 = "Excellent - Top 10%" in System 1 but "viral" in System 2). |
| **RF-3.4** | HIGH | The "Cohort Context" panel displays labels like "Top 30% of Cohort" that are NOT computed from any cohort data. They are simple threshold checks on the composite DPS number. The word "Cohort" implies a statistical comparison to similar creators that does not occur. |
| **RF-3.5** | MEDIUM | The prediction range is symmetric around the DPS value, which is statistically incorrect for a bounded [0, 100] score. There are also TWO range calculations (orchestrator and API route) that differ — the orchestrator adds extra uncertainty for high predictions, the API route does not. It's unclear which one the UI displays. |
| **RF-3.6** | MEDIUM | The "23 components" count in the UI header/form is hardcoded and wrong. Actual registered count is 22. Dynamic count in the results section IS accurate. |
| **RF-3.7** | MEDIUM | Confidence value is NOT displayed prominently to the user — it only affects range width. The "Grader Confidence" shown in Pack 1 is that pack's own confidence, not the overall prediction confidence. Users have no clear visibility into how confident the system is in its prediction. |
| **RF-3.8** | INFO | `enableMockComponents` in `prediction-config.ts` is named `enableMocks` but the orchestrator references `config.enableMockComponents` (a property that doesn't exist on the config object). This is a property name mismatch, though it may be non-critical because the mock check for Pack 1 happens separately (checking for API key presence). |

### 3.3 Thomas's Phase 3 Questions & Concerns

#### Q-3A: What is the fastest chain to produce a DPS score without reducing prediction accuracy? And are you clear about what the DPS should actually be, and what it actually is?

**What the DPS actually IS right now (in plain English):**
The number shown in the big circle on the upload-test page is a "composite prediction score." It is produced by running ~18 analysis components against a video's transcript and visual properties, averaging their individual 0-100 guesses using a weighted formula, and then reducing the result through two layers of calibration multipliers (niche difficulty, account size, conservative pull-back, LLM over-prediction correction). The result is a number from 0-100 that represents the system's best guess at "how likely is this video to go viral relative to what's expected for this account size and niche." It is NOT a percentile ranking, NOT derived from actual cohort data, and NOT connected to the DynamicPercentileSystem class.

**What the DPS SHOULD be according to the framework document:**
A true Dynamic Percentile System score — a percentile ranking that compares a video's predicted performance against a cohort of similar-sized creators on the same platform, using z-score statistics, time decay, and engagement weighting. This is fully defined in the framework document and fully implemented in `dynamic-percentile-system.ts` — it's just not connected to the prediction pipeline.

**Are these two things reconcilable?** They serve different purposes. The pipeline needs to predict virality BEFORE a video is published (no real metrics exist yet). The DPS methodology is designed to MEASURE virality AFTER publication (using actual views, likes, shares). The fundamental challenge is: how do you compute a percentile ranking when there are no actual metrics to rank yet?

**The fastest possible chain without reducing accuracy:**
The current chain has 7 steps (component execution → path aggregation → LLM consensus gate → agreement check → viral pattern boost → orchestrator calibration → pipeline calibration). Steps 3, 4, and 5 involve re-checking and re-weighting the same data. A streamlined chain would be:
1. Component execution (parallel, required — this is where the actual analysis happens)
2. Single-pass aggregation with consensus-aware weighting (merge steps 2-4 into one)
3. Single calibration pass (merge steps 6-7 into one — eliminate the double high-prediction squashing)
4. Tier classification (one system, not three)

This would reduce computational complexity and eliminate the double-reduction problem (RF-3.2) without losing accuracy — in fact, removing the accidental double-squashing would likely IMPROVE accuracy for high-quality videos that are currently being penalized twice.

#### Q-3B: Are all steps in the chain optimally working to produce the most accurate prediction results?

**No.** Verified issues from Phase 1-3 that directly reduce accuracy:
1. **Historical path (15% weight) contributes nothing** — all its components are disabled (RF-1.3)
2. **XGBoost uses v5 heuristic by default**, not the real trained model (RF-2.3)
3. **XGBoost v6 model overfit** on 27 videos and cannot generalize (RF-2.1)
4. **Pack 1 may be returning mock data** if API key is missing (RF-1.1)
5. **Pack 3 is a stub** returning hardcoded "not implemented" (RF-1.2)
6. **GPT-4 component uses heuristics**, not actual GPT-4 (RF-1.4)
7. **Double high-prediction reduction** over-penalizes high-quality content (RF-3.2)
8. **DynamicPercentileSystem not connected** — an entire statistical engine is available but unused (RF-3.1)
9. **"Deep analysis" doesn't actually do deeper analysis** — just re-weights toward Gemini (OQ-3.7)
10. **18 XGBoost features are crude keyword approximations** of what real components already compute (RF-2.5)

Each of these is a concrete, code-verified gap. None of these are theoretical concerns — they are things the code is doing right now that directly undermine prediction accuracy.

#### Q-3C: What is the DPS truly measuring, in plain English?

**In plain English:** The DPS number is the system's answer to: "On a scale of 0-100, how likely is this video's content to perform well on TikTok compared to other videos from a similar-sized account in this niche?"

**How it gets there:** It takes everything it can learn from the video (what the transcript says, how it looks, what style it uses, how strong the hook is, what viral patterns it contains) and has ~18 different analysis engines each give their own 0-100 rating. It then blends those ratings together using a weighted formula, favoring the engines that have historically been more reliable. Finally, it adjusts the blended score based on how competitive the niche is and how big the account is.

**What it does NOT do:** It does not compare against a real database of similar creators. It does not use actual engagement data. It does not compute a statistical percentile. It does not incorporate time decay or platform-specific performance baselines. These are all things the DPS framework document says it SHOULD do — and the code for doing them exists — but the prediction pipeline doesn't use any of it.

#### Q-3D: What is the benefit of the confidence score? Does it improve prediction accuracy?

**What confidence currently does:**
1. Controls the width of the prediction range (lower confidence = wider range displayed to user)
2. Gets stored in the database for each prediction run
3. Gets penalized by 30% when no speech is detected (Rule 1 in calibrator)
4. Gets reduced by 5% for competitive niches and 10% for missing video files

**Does it improve prediction accuracy?** No — not directly. Confidence does NOT change the DPS number itself. A prediction with 40% confidence shows the exact same DPS as one with 90% confidence. Confidence only makes the displayed range wider or narrower, and that range is not used for any subsequent decision-making.

**What confidence SHOULD do (and could do):**
Confidence should be a critical input for two things:
1. **User trust calibration:** A high-confidence prediction of DPS 70 is a strong signal. A low-confidence prediction of DPS 70 is unreliable. Users should see this prominently, not buried in range width.
2. **Training data quality filtering:** When building training datasets, high-confidence predictions should be weighted more heavily than low-confidence ones. The training pipeline should know which predictions to trust.
3. **Model improvement feedback loop:** If low-confidence predictions end up being accurate, that tells us something about which components are over-reporting uncertainty. If high-confidence predictions are wrong, that tells us which components are over-confident.

Currently, none of these uses are implemented. Confidence is computed through 5 layers of adjustment and then has almost no functional impact.

#### Q-3E: How should we address the 3 disconnected tier systems and the disconnected DynamicPercentileSystem?

**The structural problem:** Three tier systems exist because three different developers (or three different sessions) built classification logic without checking if one already existed. The DynamicPercentileSystem was built as the scientifically correct approach but was never wired into the pipeline.

**What structure is needed:**

1. **Single Tier Authority:** One function, in one file, referenced everywhere. Define tier thresholds ONCE. Both the gauge UI and the API response read from the same source. No hardcoded thresholds in components.

2. **Naming Convention Enforcement:**
   - "DPS" = Dynamic Percentile System (post-publication, actual metrics, cohort comparison)
   - "VPS" = Viral Prediction Score (pre-publication, predicted metrics, component analysis)
   - These are two different metrics. The pipeline produces a VPS. After publication, actual performance is scored via DPS.

3. **System Integrity Contract:** A validation layer that runs at build time (or test time) and asserts:
   - Every tier label used in the UI exists in the single tier authority
   - Every score range in the UI matches the single tier authority
   - No hardcoded tier thresholds exist outside the authority file
   - The component count displayed matches the actual registered count
   - The API response field names match the UI field references

4. **Integration Bridge:** The DynamicPercentileSystem should be connected to the pipeline in the following way:
   - BEFORE publication: Pipeline produces a VPS using component analysis
   - AFTER publication: The outcomes ingest system collects actual metrics and computes a real DPS using the DynamicPercentileSystem
   - The DIFFERENCE between VPS (predicted) and DPS (actual) becomes the training signal for improving the model
   - This feedback loop is how you get to 80%+ accuracy over time

5. **Guardrails Against Future Incongruence:**
   - TypeScript strict mode enforcement on shared types (one `TierLevel` type used everywhere)
   - Automated tests that check for hardcoded tier strings in UI files
   - Build-time schema validation between API response shape and UI expectations
   - A "system coherence" test suite that runs all classification systems on the same inputs and asserts they produce consistent outputs

#### Q-3F: How do we fix the Cohort Context panel?

**Option A (Quick fix):** Remove the word "Cohort" entirely. Replace "Top 30% of Cohort" with honest language: "Strong viral prediction — expected to outperform most content in this niche." This is accurate without implying statistical cohort comparison.

**Option B (Proper fix):** Actually connect to cohort data. Since the DynamicPercentileSystem already queries the `videos` table for similar-sized creators, the Cohort Context panel could:
1. Show the actual cohort median views for this account size (from cached `cohort_medians` table)
2. Show what percentile the predicted VPS would place this video in (using the z-score methodology)
3. Show how many videos in the cohort the system compared against

This requires the `cohort_medians` table to be populated (the DPS class has an `updateCohortMedians()` method that should run periodically). It would transform a misleading UI element into a genuinely informative one.

#### Q-3G: How do we fix the symmetric range and uncertainty issue?

**The problem:** The range [DPS - uncertainty, DPS + uncertainty] is symmetric, which creates impossible values near the bounds (e.g., DPS 95 with uncertainty 8 = range [87, 103] — clamped to [87, 100], making it look artificially certain on the upside).

**The fix:** Use an asymmetric beta distribution-based interval:
- For scores near 50: keep symmetric
- For scores near 0: compress the lower bound, expand the upper
- For scores near 100: expand the lower bound, compress the upper
- Formula: `lower = DPS - uncertainty × (DPS / 50)`, `upper = DPS + uncertainty × ((100 - DPS) / 50)`

This would also require consolidating the two existing range calculations (orchestrator and API route) into one authoritative function.

#### Q-3H: How do all these Phase 3 gaps tie into the viral workflow tab (`/admin/studio`)?

**What the viral studio is:** The `/admin/viral-studio` page is a multi-phase workflow: Entry → Onboarding → Signal Calibration → Calibration Profile → Gallery → Analysis → Lab Phase 1 (Discover) → Lab Phase 2 (Validate) → Lab Phase 3 (Create). It guides users through selecting templates, analyzing viral DNA, and creating content.

**How Phase 3 gaps affect it:**
1. **If the viral studio uses the same prediction pipeline** (which it should), every gap identified in Phase 3 carries over — wrong tier labels, misleading cohort context, double-squashed scores, disconnected DPS.
2. **The calibration phases in the studio** (Signal Calibration, Calibration Profile) are designed to learn a user's taste and style preferences. These could feed INTO the prediction pipeline as personalization signals — but only if the pipeline's scoring is trustworthy enough to calibrate against.
3. **The Lab Phase 2 "Validate" step** is supposed to validate a content strategy using prediction. If that prediction is built on mock Pack 1 data, a stub Pack 3, and a heuristic XGBoost, the validation is meaningless.
4. **The Gallery phase** shows viral templates with scores. If those scores are VPS (component analysis) but labeled as DPS (percentile system), users will misinterpret them.

**Bottom line:** Fixing the prediction pipeline is a prerequisite for the viral studio to deliver accurate value. The studio is a UI workflow wrapper — if the engine underneath it is producing unreliable scores, the entire workflow produces unreliable guidance.

#### Q-3I: ★ How are we planning to address the MASSIVE disconnects? What guardrails prevent this from happening again?

**The disconnects summarized (from Phases 1-3):**
- DPS name used for a non-DPS metric
- DynamicPercentileSystem built but disconnected
- 3 different tier systems
- Pack 3 documented as "Complete" but is a stub
- GPT-4 component doesn't use GPT-4
- XGBoost badge shows "Trained Model" when heuristic may be running
- "23 components" hardcoded when 22 are registered
- Double high-prediction reduction (possibly accidental)
- Pack 1 may return mock data without clear user warning
- Cohort Context implies cohort comparison that doesn't exist

**How to fix (systemic approach):**

1. **Single Source of Truth Registry:** One file that defines every component, every pack, every tier, every scoring system. All UI, API, and pipeline code imports from this registry. No hardcoded strings allowed.

2. **Runtime Assertion Layer:** A middleware that validates at prediction time:
   - Components that claim to be "active" actually produced output
   - Tier labels in the response match the registry
   - Score version tags match the active model
   - Pack _meta.source accurately reflects what ran

3. **Build-Time Integrity Tests:**
   - Grep for hardcoded tier strings, component counts, or DPS labels in UI files → fail build
   - Schema validation between API response and UI type expectations
   - Component registry count matches README/CLAUDE.md count

4. **Documentation Auto-Generation:** Instead of manually keeping CLAUDE.md and component counts in sync, auto-generate the documentation sections from the code registry. If a component is commented out, the docs automatically reflect that.

5. **Accuracy Dashboard:** A real-time dashboard showing:
   - Which components are actually running (not just registered)
   - Whether each is producing real output or mock/heuristic
   - The active model version for XGBoost
   - Pack source (real/mock) from the last N predictions
   - VPS-to-DPS accuracy (predicted vs actual) once outcomes are tracked

#### Q-3J: Plain English explanation of each Pack — what are they actually doing to help predict virality? Where is Pack 4 (IV)?

**Pack 1 — Unified Grading Rubric (the Content Report Card):**
Pack 1 sends the video's transcript to Google's Gemini AI and asks it to grade the content on 9 attributes (hook strength, curiosity gaps, emotional resonance, etc.), identify which of 7 "idea legos" are present (viral content patterns like "challenging conventional wisdom" or "before/after transformation"), and analyze the hook, pacing, clarity, and novelty. Think of it as getting a professional content reviewer to grade every aspect of the script. **Does it help accuracy?** Yes — IF it's running real LLM analysis (not mock). The attribute scores give granular signal about what specifically makes the content strong or weak. Its individual DPS prediction (average attribute score × 10) contributes to the composite score.

**Pack 2 — Editing Coach (the Improvement Advisor):**
Pack 2 takes Pack 1's report card and generates the top 3 improvement suggestions with estimated DPS lift. For example: "Your hook scored 4/10 — try opening with a provocative question instead of a statement. Estimated lift: +8 DPS." **Does it help accuracy?** Not directly — Pack 2 is a coaching tool, not a prediction tool. Its DPS contribution to the composite score is redundant because it's derived from Pack 1's scores. Its real value is helping users IMPROVE their content to actually achieve a higher score.

**Pack V — Visual Rubric (the Visual Quality Scorer):**
Pack V analyzes the video's visual properties using FFmpeg data (not LLM — rule-based). It scores visual hook strength, pacing, pattern interrupts, visual clarity, and style fit on a 1-10 scale. This runs WITHOUT a transcript, so it works for silent videos. **Does it help accuracy?** Yes — it captures an entire dimension (visual quality) that text-based components miss. It also feeds into the calibration system to decide whether silent videos should be penalized.

**Pack 3 — Viral Mechanics (supposed to be the "Why It Works" Analyzer):**
Pack 3 is SUPPOSED to synthesize signals from Pack 1, Pack 2, and Pack V to identify specific viral mechanics (e.g., "curiosity loop", "social proof cascade", "emotional escalation") and explain WHY a video would go viral. **Does it help accuracy?** Currently, NO — it is a stub that returns "not implemented." The UI shows "COMING SOON." If built properly, it would add a synthesis layer that could catch viral potential that individual components miss.

**Where is Pack 4 (IV)?** There is no Pack 4. The pack numbering is: Pack 1, Pack 2, Pack 3, and Pack V. The "V" stands for "Visual" (not Roman numeral 5). This was a deliberate naming choice — Pack V was given a letter instead of a number because it operates on a fundamentally different input (video frames, not text). The gap between Pack 3 and Pack V is not a missing pack — it's a naming convention.

#### Q-3K: What needs to be in place so the upload-test page shows only accurate, real information and performs only accurate, real actions?

**Minimum requirements for honest, accurate operation:**
1. **Pack 1 must run real LLM analysis** — verify `GOOGLE_AI_API_KEY` is set, or if mock is running, display a prominent "DEMO MODE" banner (not just a small "MOCK" badge)
2. **Pack 3 must either be implemented or completely removed from the UI** — no "COMING SOON" stubs in a production tool
3. **XGBoost badge must reflect what's actually running** — if v5 heuristic is active, say "Heuristic Model" not "ML Trained Model"
4. **Component count must be dynamic** — read from the actual executed count, not hardcoded
5. **Tier labels must come from one system** — not three conflicting ones
6. **"Cohort" language must be backed by real cohort data** — or removed
7. **Score must be called what it is** — VPS (Viral Prediction Score) if it's a prediction, DPS only when it's a real percentile measurement

#### Q-3L: Thomas's preliminary decision on DP-3.1 — Rename to VPS

**Thomas's position:** The pipeline should be consistent with the Dynamic Percentile System methodology since that is one of the main impetuses of the technology. The prediction score should be renamed to "VPS" (Viral Prediction Score) to avoid confusion between the prediction (VPS) and the actual measurement system (DPS).

**Analysis of this decision:** This logic is sound. The two metrics serve different purposes:
- **VPS = Prediction** ("Before you publish, we predict this video will score X")
- **DPS = Measurement** ("After you published, this video actually scored Y based on cohort comparison")

The gap between VPS and DPS becomes the accuracy metric: how close was the prediction to reality? This is exactly how you build the feedback loop needed to reach 80%+ accuracy (Q-2L). You predict (VPS), you measure (DPS), you compare, you retrain, you improve.

**To confirm before finalizing:** The DPS framework document should be reviewed to ensure the VPS/DPS distinction is philosophically aligned with the original methodology vision. This will be addressed in the Post-Audit resolution when Q-2K is revisited.

**⚠️ MANDATORY RETURN POINT for Post-Audit:** Thomas's VPS/DPS naming decision, the DynamicPercentileSystem integration plan, and the guardrails for system coherence must ALL be addressed together as they are interconnected.

### 3.4 Open Questions (May Be Answered in Later Phases)

| ID | Question | Expected Phase |
|----|----------|---------------|
| **OQ-3.1** | The double high-prediction reduction (orchestrator + calibrator) — is this intentional or accidental? Should they be consolidated into one system? | Post-Phase 5 |
| **OQ-3.2** | Should the tier systems be unified? Which one should be the single source of truth? | Post-Phase 5 |
| **OQ-3.3** | Should the "Cohort Context" panel be connected to the real DynamicPercentileSystem for post-publication analysis, or should the misleading "cohort" language be removed? | Post-Phase 5 |
| **OQ-3.4** | Is the pipeline "DPS" intended to approximate what the Dynamic Percentile System would score, or are they fundamentally different metrics? If different, should they have different names? | Post-Phase 5 (URGENT) — Thomas preliminary answer: rename prediction to VPS |
| **OQ-3.5** | Pack 1 mock behavior — is `GOOGLE_AI_API_KEY` currently set in production? Is Pack 1 running real LLM analysis or mock? This directly answers Q-2J. | Verify in environment |
| **OQ-3.6** | The performDeepAnalysis method gives Gemini 3x weight when paths disagree. Is this evidence-based, or is Gemini just assumed to be most accurate? | Post-Phase 5 |
| **OQ-3.7** | The low agreement "deep analysis" does NOT actually do any deeper analysis — it just re-weights toward Gemini. The name is misleading. Should it be renamed or actually implemented? | Post-Phase 5 |
| **OQ-3.8** | What is the optimal chain length to produce a prediction score without reducing accuracy? Can steps 2-4 and 6-7 be merged? | Post-Phase 5 |
| **OQ-3.9** | Should confidence score be repurposed to serve a more functional role (user trust indicator, training data quality filter, model improvement feedback signal)? | Post-Phase 5 |
| **OQ-3.10** | How should the VPS/DPS feedback loop work? VPS predicts → video published → actual DPS measured → comparison → retrain. What infrastructure is needed? | Post-Phase 5 |
| **OQ-3.11** | Does the viral studio workflow (/admin/viral-studio) need to be audited separately, or do all Phase 3 gaps automatically apply to it? | Phase 5 |
| **OQ-3.12** | What guardrails (build-time tests, runtime assertions, auto-generated docs) need to be implemented to prevent system incongruence from ever happening again? | Post-Phase 5 |

### 3.5 Decisions Pending

| ID | Decision Needed |
|----|----------------|
| **DP-3.1** | ★PRELIMINARY DECISION BY THOMAS★ Rename prediction pipeline output from "DPS" to "VPS" (Viral Prediction Score). Reserve "DPS" for the actual Dynamic Percentile System measurement. To be confirmed in Post-Audit after reviewing the DPS framework document for philosophical alignment. |
| **DP-3.2** | Should the double high-prediction reduction be consolidated into one calibration pass? |
| **DP-3.3** | Should a single tier system be chosen and used everywhere? |
| **DP-3.4** | Should "Cohort Context" language be removed (quick fix) or backed by real cohort data from DynamicPercentileSystem (proper fix)? |
| **DP-3.5** | Should overall prediction confidence be made visible to the user as a trust indicator? |
| **DP-3.6** | Should the range calculation be made asymmetric near the bounds (0 and 100)? |
| **DP-3.7** | Should the "23 components" hardcoded string be replaced with a dynamic count from the registry? |
| **DP-3.8** | Should a Single Source of Truth Registry be created (one file defining all components, packs, tiers, scoring systems) with all UI/API/pipeline code importing from it? |
| **DP-3.9** | Should runtime assertions and build-time integrity tests be implemented as guardrails against future system incongruence? |
| **DP-3.10** | Should Pack 3 be implemented or permanently removed? (Raised again from DP-1.2 — now with more context about what it would contribute.) |
| **DP-3.11** | Should the viral studio be validated against all Phase 3 gaps before further development? |

---

## Phase 4: Pack Deep-Dives

### 4.1 Verified Findings

#### Pack 1: Unified Grading Rubric — What It Actually Does

**File:** `src/lib/rubric-engine/unified-grading-runner.ts`
**Provider:** Google Gemini 2.0 Flash (model: `gemini-2.0-flash-exp`)
**Type:** LLM-powered with Zod validation

**How it works, step by step:**

1. The orchestrator calls `executeUnifiedGrading(input)` in `kai-orchestrator.ts` (line ~5121).
2. It checks if `GOOGLE_AI_API_KEY` environment variable is set.
3. **If API key IS set:**
   - Sends the video transcript + niche + goal to Google Gemini with a system prompt asking for a structured JSON rubric.
   - The prompt instructs Gemini to score 9 attributes (1-10), evaluate 7 "idea legos" (boolean), analyze the hook, and rate pacing/clarity/novelty.
   - Validates the response against a Zod schema (`UnifiedGradingResultSchema`) that requires exactly 9 attribute scores, all between 1-10, with evidence strings of at least 5 characters.
   - If Gemini returns invalid JSON, it retries up to 3 times with a "repair prompt" that shows the errors.
   - On success, returns the validated result with `_meta.source = 'real'` and `_meta.provider = 'google-ai'`.
4. **If API key is NOT set:**
   - Falls back to `createMockUnifiedGradingResult()` which returns HARDCODED data:
     - Style: always "educational" with 0.85 confidence
     - Legos: always `[true, true, false, true, false, true, false]` — same pattern every time
     - Attribute scores: cycle through 5, 6, 7, 8, 5, 6, 7, 8, 5 — same for every video
     - Hook: always "question" type with clarity 7
     - Pacing: always 6, Clarity: always 7, Novelty: always 5
     - Evidence strings are generic templates: "Mock evidence for [attribute name]"
   - Returns with `_meta.source = 'mock'` and `_meta.provider = 'mock'`.

**The 9 Attributes scored by Pack 1:**

| # | Attribute | What It Measures | Weight in Pack 2 |
|---|-----------|------------------|-------------------|
| 1 | tam_resonance | How well content matches target audience | 11% |
| 2 | shareability | Likelihood viewers share the video | 12% |
| 3 | value_density | Value delivered per second of video | 10% |
| 4 | emotional_journey | Strength of emotional arc | 8% |
| 5 | hook_strength | Power of the opening | 18% |
| 6 | format_innovation | Creative use of video format | 5% |
| 7 | pacing_rhythm | Flow and timing of content | 9% |
| 8 | curiosity_gaps | Open loops that keep viewer watching | 14% |
| 9 | clear_payoff | Satisfying conclusion/takeaway | 8% |

**The 7 Idea Legos:**

| # | Lego | What It Checks |
|---|------|----------------|
| 1 | lego_1 | Clear topic identified |
| 2 | lego_2 | Relevant to target audience |
| 3 | lego_3 | Unique angle presented |
| 4 | lego_4 | Intriguing hook present |
| 5 | lego_5 | Story structure exists |
| 6 | lego_6 | Visual format matches content |
| 7 | lego_7 | Call-to-action present |

**What Pack 1 contributes to virality prediction accuracy:**
- When running REAL (with API key): Pack 1 provides genuinely useful content analysis. The LLM grades the transcript for the 9 attributes that research suggests correlate with virality.
- The average of the 9 attribute scores is converted to a 10-100 DPS estimate (`avgScore * 10`) and fed into the orchestrator's path aggregation as one component's prediction.
- Pack 1 also feeds into Pack 2 (suggestions) and Pack 3 (mechanics detection).
- **When running MOCK:** Contributes nothing real. Returns identical data for every video, so it's the same as not running at all.

**Plain English:** Pack 1 is your "content report card." It's an AI grader that reads the transcript and scores 9 dimensions of content quality (hook strength, shareability, emotional arc, etc.) plus checks 7 structural elements (does it have a topic? a hook? a call-to-action?). When the API key is set, it uses real AI analysis. When it's missing, it returns the same fake grades for every video.

---

#### Pack 2: Editing Coach — What It Actually Does

**File:** `src/lib/rubric-engine/editing-coach-runner.ts`
**Provider:** Rule-based templates (NOT LLM — see RF-4.2)
**Type:** Deterministic rule engine

**How it works, step by step:**

1. The orchestrator calls `executeEditingCoach(input)` in `kai-orchestrator.ts` (line ~5200).
2. It looks for the `unified-grading` result from the prior Pack 1 execution.
3. If Pack 1 didn't succeed → returns `success: false` with error "requires unified-grading result."
4. **CRITICAL:** The orchestrator calls `generateRuleBasedSuggestions(rubric, predictedScore)` — NOT the LLM-based `runEditingCoach()`.
5. The rule-based function does the following:
   a. Sorts Pack 1's 9 attribute scores from lowest to highest.
   b. For the 3 lowest-scoring attributes, looks up a hardcoded template in `generateSuggestionForAttribute()`.
   c. Each template has a fixed `what_to_change`, `how_to_change`, and `example` string.
   d. If the hook clarity score is below 6 and there's room, adds a hook improvement suggestion.
   e. Calculates "estimated lift" using: `(10 - currentScore) * weight * 100 * 0.5 * 0.75`
   f. Returns `_meta.source = 'real'` and `_meta.provider = 'rule-based'`.

**The lift estimation formula explained:**
- `improvementHeadroom` = how far the score is from a perfect 10
- `weight` = the attribute's weight from `RUBRIC_WEIGHTS` (e.g., hook_strength = 0.18)
- `theoreticalLift` = headroom * weight * 100 (converts to DPS scale)
- `conservativeLift` = theoreticalLift * 0.5 (CONSERVATIVE_FACTOR) * 0.75 (default confidence)
- Example: If hook_strength is 4/10, lift = (10-4) * 0.18 * 100 * 0.5 * 0.75 = **40.5 DPS lift estimated**

**What the RUBRIC_WEIGHTS are based on:**
The weights are defined in `editing-coach-types.ts` with a comment "from XGBoost feature importance." However, there is no evidence in the codebase that these weights were actually derived from XGBoost feature importance analysis. Given that the XGBoost model was trained on only 27 videos (RF-2.1), even if these weights WERE derived from it, they would be unreliable.

**The dead LLM path:**
The file `editing-coach-runner.ts` also contains `runEditingCoach()` which calls Google Gemini with a coaching prompt. This function EXISTS but is NEVER called by the orchestrator. It's dead code. The `runEditingCoach` function could provide more nuanced, context-aware suggestions than the templates — but it's simply never invoked.

**What Pack 2 contributes to virality prediction accuracy:**
- Pack 2 does NOT directly contribute to the prediction score. Its purpose is coaching (telling creators how to improve).
- Its `predicted_after_estimate` is stored in the component result but not used in the DPS calculation.
- Its suggestions are useful IF Pack 1 is running real data. If Pack 1 is mock, Pack 2's suggestions are based on fake scores and are meaningless.

**Plain English:** Pack 2 is your "improvement coach." It looks at Pack 1's report card, finds the 3 weakest areas, and suggests specific improvements with template-based advice (like "add a pattern interrupt in the first 2 seconds"). Despite the "AI COACH" label in the UI, it does NOT use AI — it uses pre-written suggestion templates. The LLM-powered version exists in the code but is never activated. The estimated "DPS lift" numbers are calculated from a simple formula, not from real performance data.

---

#### Pack V: Visual Rubric — What It Actually Does

**File:** `src/lib/rubric-engine/visual-rubric-runner.ts`
**Provider:** Rule-based signal aggregation (no LLM)
**Type:** Deterministic signal processor

**How it works, step by step:**

1. The orchestrator calls `executeVisualRubric(input)` in `kai-orchestrator.ts` (line ~5252).
2. The orchestrator extracts data from 6 upstream component results and maps them to Pack V's expected format:
   - **ffmpeg** → duration, fps, resolution, scene count, motion intensity, brightness, contrast
   - **24-styles** → detected style, style confidence, visual elements
   - **thumbnail-analyzer** → thumbnail score, face detection, text overlay, color vibrancy, composition
   - **visual-scene-detector** → scene transitions, shot length, visual variety, dominant colors
   - **audio-analyzer** → has music, beat aligned, audio-visual sync
   - **hook-scorer** → hook visual score, opening frame quality
3. If NONE of the 6 upstream components provided data → returns a **stub** with all scores = 5 and evidence = "No visual data available for analysis." `_meta.source = 'mock'`.
4. If ANY data is available, calculates 5 visual scores (each starts at 5 and adjusts +/- based on thresholds):
   - **Visual Hook** (weight: 25%): Thumbnail quality, face detection, text overlay, hook visual score
   - **Pacing** (weight: 20%): Scene frequency (optimal: 1 cut every 2-4 sec), motion intensity, FPS, beat alignment
   - **Pattern Interrupts** (weight: 20%): Scene transitions, visual variety, color diversity
   - **Visual Clarity** (weight: 15%): Resolution, brightness, contrast, portrait mode bonus, composition
   - **Style Fit** (weight: 20%): Detected style + niche compatibility, music presence, audio-visual sync
5. Overall score = weighted average of 5 sub-scores * 10 (scale: 0-100).
6. Includes a **signal coverage debug block** tracking which upstream fields were consumed vs. available.

**The stub scenario (most common for text-only predictions):**
When a user enters only a transcript on the upload-test page (no video file), the ffmpeg, thumbnail-analyzer, visual-scene-detector, audio-analyzer, and hook-scorer components all have nothing to analyze. The 24-styles component may still produce something based on the niche. If no visual data flows through, Pack V returns the stub: all 5 scores at exactly 5/10, overall = 50/100, with "No visual data available" evidence strings.

**What Pack V contributes to virality prediction accuracy:**
- Pack V's component prediction is its overall visual score, which feeds into the pattern_based path.
- For text-only predictions, it contributes a neutral 50 (neither helps nor hurts).
- For video predictions, it provides real signal about visual quality that correlates with TikTok performance.

**Plain English:** Pack V is the "visual quality inspector." It doesn't read the transcript — instead, it looks at the video's visual properties: resolution, scene cuts, brightness, color variety, thumbnail quality, and whether the style matches the niche. It's fully rule-based (no AI), using simple "if resolution > 1080p, add points" logic. When there's no actual video to analyze (text-only mode), it returns a neutral placeholder (all scores = 5 out of 10).

---

#### Pack 3: Viral Mechanics — What It Actually Does (and Why It's Broken)

**Files:**
- `src/lib/rubric-engine/viral-mechanics-types.ts` — the STUB (what actually runs)
- `src/lib/rubric-engine/viral-mechanics-runner.ts` — FULL implementation (unreachable)
- `src/lib/rubric-engine/index.ts` — barrel exports (does NOT export the runner)

**The double disconnection (RF-4.1):**

Pack 3 has a complete, 580-line implementation that detects 9 viral mechanics. But it is disconnected at TWO levels:

**Disconnection #1 — Missing barrel export:**
The barrel file `src/lib/rubric-engine/index.ts` only exports `createViralMechanicsStub` from `viral-mechanics-types.ts`. It does NOT export `runViralMechanics` from `viral-mechanics-runner.ts`. The orchestrator's `executeViralMechanics` method uses `const { runViralMechanics } = await import('@/lib/rubric-engine')`, which resolves to the barrel — so `runViralMechanics` is `undefined`. Calling `undefined(pack3Input)` throws a `TypeError`, caught by the catch block, and the component returns `success: false`.

**Disconnection #2 — Pipeline always uses stub:**
Even if the orchestrator DID successfully run Pack 3, the pipeline (`runPredictionPipeline.ts` line ~561) ALWAYS writes `pack3: createViralMechanicsStub()` in the `qualitative_analysis` object. It never checks the `viral-mechanics` component result. So even if the barrel export were fixed, the pipeline would still ignore the actual Pack 3 output.

**What the FULL implementation would do (if connected):**

The runner detects 9 viral mechanics by synthesizing signals from Pack 1, Pack 2, Pack V, and other components:

| # | Mechanic | Signals Used | Strength Threshold |
|---|----------|-------------|-------------------|
| 1 | Visual Hook | Pack V visual scores, hook-scorer | >= 50 |
| 2 | Curiosity Gap | Pack 1 hook analysis, hook-scorer, 7-legos | >= 50 |
| 3 | Style-Platform Fit | 24-styles, niche | >= 40 |
| 4 | Optimal Pacing | Pack 1 pacing, Pack V visual pacing | >= 60 |
| 5 | Audio-Visual Sync | audio-analyzer, Pack V audio signals | >= 50 |
| 6 | Trend Alignment | trend-timing, historical-analyzer, virality-matrix | >= 50 |
| 7 | Pattern Interrupt | Pack V novelty, Pack 1 novelty | >= 60 |
| 8 | Emotional Trigger | Pack 1 emotional attributes, 9-attributes | >= 60 |
| 9 | Timing Advantage | posting-optimizer | >= 50 |

It would output the top 3 strongest mechanics with evidence, a confidence score, and a plain-English summary explaining WHY the video should perform well.

**Additional format mismatch (RF-4.3):**
Even if both disconnections were fixed, the Pack 3 runner expects Pack V output in a format that Pack V doesn't produce. The runner looks for `packV.visual_scores` (an array of `{dimension, score}` objects), but Pack V returns separate named fields (`visual_hook_score`, `pacing_score`, etc.). This means the visual hook, pacing, and pattern interrupt mechanic detectors would fail to read Pack V data — they'd silently skip those signals.

**UI behavior:**
The upload-test page checks for `'mechanics' in pack3` to show the full Pack 3 panel, and `pack3.status === 'not_implemented'` to show the "COMING SOON" stub. Since the pipeline always returns the stub, the user always sees the gray "COMING SOON" message.

**What Pack 3 would contribute to virality prediction accuracy:**
Pack 3 was designed as the "synthesis layer" — the one that combines all other signals and explains WHY a video is predicted to perform well or poorly. It wouldn't directly change the prediction score, but it would provide the most actionable human-readable explanation. Think of it as: Pack 1 gives the grades, Pack 2 gives improvement tips, Pack V grades visuals, and Pack 3 ties them all together to explain the viral mechanics at play.

**Plain English:** Pack 3 is supposed to be the "why it works" explainer. It would look at everything — the transcript analysis, the visual quality, the style, the timing — and identify which specific viral mechanics (like "strong curiosity gap" or "optimal pacing") are at play. A full implementation EXISTS in the codebase (580 lines of code, 9 mechanic detectors), but it's completely disconnected — the pipeline can't reach it due to a missing export, and even if it could, the pipeline ignores the result. Users see only "COMING SOON."

---

#### How Packs Relate to Each Other (Dependency Chain)

```
Upstream Components (ffmpeg, 24-styles, audio-analyzer, etc.)
         │
         ├──────────────────────────────── Pack V (visual signals only)
         │                                       │
         │    Transcript + Niche + Goal           │
         │            │                           │
         │        Pack 1 (LLM grading)            │
         │            │                           │
         │        Pack 2 (rule-based coaching)     │
         │            │                           │
         └────────────┴───────────────────────────┘
                              │
                          Pack 3 (synthesis — DISCONNECTED)
```

**Execution order enforced by orchestrator:**
1. Phase 1 (parallel): All upstream components (ffmpeg, 24-styles, gpt4, gemini, etc.)
2. Phase 2 (sequential): visual-rubric → unified-grading → editing-coach → viral-mechanics

This order ensures each pack has the data it needs from the pack before it.

---

### 4.2 Red Flags

| ID | Severity | Finding |
|----|----------|---------|
| **RF-4.1** | **CRITICAL** | Pack 3 full implementation (580 lines, 9 mechanic detectors) exists but is DOUBLE-DISCONNECTED: (1) barrel `index.ts` doesn't export `runViralMechanics`, so the orchestrator gets `undefined` and crashes; (2) the pipeline always uses `createViralMechanicsStub()` and never reads the `viral-mechanics` component result. |
| **RF-4.2** | **HIGH** | Pack 2 NEVER calls the LLM. The orchestrator uses `generateRuleBasedSuggestions()` (template-based) instead of `runEditingCoach()` (Gemini-powered). The UI header says "AI COACH" but the provider is `rule-based`. The LLM version exists as dead code. |
| **RF-4.3** | **HIGH** | Pack 3 runner has a format mismatch with Pack V. Pack 3 expects `packV.visual_scores[]` (array with `dimension` field), but Pack V returns `visual_hook_score`, `pacing_score`, etc. as separate named fields. Even if Pack 3 were connected, 3 of its 9 mechanic detectors (visual hook, optimal pacing, pattern interrupt) would fail to read Pack V data. |
| **RF-4.4** | **HIGH** | Pack 1 mock generates IDENTICAL output for every video: attribute scores cycle 5→6→7→8, same lego pattern, same hook type, same dimension scores. This is the root cause of Q-2J (Pack 1/2 showing same results regardless of video) when `GOOGLE_AI_API_KEY` is missing. |
| **RF-4.5** | **MEDIUM** | Pack 2's RUBRIC_WEIGHTS (which drive suggestion priority and lift estimates) are labeled "from XGBoost feature importance" but there's no evidence they were actually derived from the model. The XGBoost model was trained on only 27 videos (RF-2.1), so even if derived, the weights are unreliable. |
| **RF-4.6** | **MEDIUM** | Pack V returns a stub (all scores = 5/10, overall = 50/100) for text-only predictions because no video signals are available. This is honest but means Pack V provides zero useful information in the upload-test page's most common use case (entering transcript text without video). |
| **RF-4.7** | **LOW** | The `runEditingCoach()` function — the LLM-powered version of Pack 2 that calls Gemini — exists in the codebase but is dead code. It's exported from the barrel but never called by the orchestrator. |
| **RF-4.8** | **MEDIUM** | Pack 3's `detectEmotionalTrigger` looks for Pack 1 attribute names like `emotional_resonance`, `relatability`, `entertainment_value` — but Pack 1's actual attribute names are `emotional_journey`, `shareability`, `tam_resonance`, etc. The string matching uses `.includes()` so `emotional_journey` would partially match `emotional`, but `relatability` and `entertainment_value` would never match any Pack 1 attribute. |

---

### 4.3 Pack Status Truth Table

This table shows the ACTUAL runtime behavior of each pack under different conditions:

| Condition | Pack 1 | Pack 2 | Pack V | Pack 3 |
|-----------|--------|--------|--------|--------|
| **API key set + transcript + video** | REAL (Gemini LLM) | REAL (rule-based templates) | REAL (rule-based signal aggregation) | ALWAYS STUB |
| **API key set + transcript only** | REAL (Gemini LLM) | REAL (rule-based templates) | STUB (all 5s, no visual data) | ALWAYS STUB |
| **API key MISSING + transcript + video** | MOCK (hardcoded data) | "REAL" but based on mock Pack 1 data | REAL (rule-based signal aggregation) | ALWAYS STUB |
| **API key MISSING + transcript only** | MOCK (hardcoded data) | "REAL" but based on mock Pack 1 data | STUB (all 5s) | ALWAYS STUB |
| **No transcript (video only)** | FAILS (min 10 chars required) | FAILS (needs Pack 1) | REAL (rule-based) | ALWAYS STUB |

**Key insight:** In the most common development/testing scenario (API key missing, transcript only), ALL four packs are either mock, template-based-on-mock, stub, or stub. Zero real analysis occurs.

---

### 4.4 What Each Pack ACTUALLY Contributes to Prediction Accuracy

| Pack | Contributes to Score? | How? | Accuracy Impact |
|------|----------------------|------|-----------------|
| **Pack 1** | YES (indirectly) | Average of 9 attribute scores * 10 → fed as one component's prediction into the orchestrator's pattern_based path | **Moderate when REAL.** Gemini is analyzing actual content and scoring it. But it's just one of many component predictions averaged together. **Zero when MOCK.** |
| **Pack 2** | NO | Pack 2's `predicted_after_estimate` is stored but not used in the final DPS/VPS calculation | **None.** Pack 2 is purely advisory. It tells the creator what to improve but doesn't change the prediction score. |
| **Pack V** | YES (indirectly) | Overall visual score → fed as one component's prediction into the pattern_based path | **Moderate for video predictions.** Rule-based but grounded in real visual signals. **None for text-only.** Returns neutral 50. |
| **Pack 3** | NO (disconnected) | Would not directly change prediction even if connected — designed as synthesis/explanation layer | **None.** Would contribute understanding (WHY the prediction is what it is) but not the prediction number itself. |

---

### 4.5 Thomas's Phase 4 Questions & Concerns

#### Q-4A: How do we fix Pack 1 so that when the API key is missing, it does NOT return the same fake grades for every video? How do we create a logic fallback?

**The problem:** When `GOOGLE_AI_API_KEY` is missing, `createMockUnifiedGradingResult()` returns hardcoded scores (5→6→7→8 cycling, same legos, same hook type) regardless of input. The only dynamic element is that it uses the first 50 characters of the transcript as the hook "evidence" — everything else is identical.

**The fix — a tiered fallback strategy:**

There are 3 possible fallback levels, from simplest to most sophisticated:

**Level 1 — Honest failure (simplest, recommended minimum):**
Stop returning fake data entirely. When the API key is missing, return `success: false` with a clear error message like "Pack 1 requires GOOGLE_AI_API_KEY to analyze content." The UI already handles this case — it shows "Pack 1/2 Analysis Not Available" with a reason. This is honest and prevents users from being misled by fake data.

**Level 2 — Transcript-aware heuristic fallback:**
Instead of hardcoded scores, build a lightweight rule-based analyzer that examines the actual transcript:
- Count question marks → estimate hook_strength and curiosity_gaps
- Count sentences → estimate pacing_rhythm
- Detect emotional words → estimate emotional_journey
- Check for calls-to-action ("follow", "share", "link in bio") → estimate lego_7 (CTA present)
- Measure vocabulary diversity → estimate novelty
- Check word count per second (if duration available) → estimate value_density

This would still be far less accurate than Gemini, but at least the scores would VARY between different transcripts and reflect something real about the content. The `_meta` would say `source: 'real', provider: 'heuristic'`.

**Level 3 — Alternative LLM fallback:**
If the Google key is missing, try other available LLM providers in priority order:
1. `ANTHROPIC_API_KEY` → use Claude
2. `OPENAI_API_KEY` → use GPT-4
3. Fall back to Level 2 heuristic
4. Fall back to Level 1 honest failure

This requires adapting the prompt for each provider's API format but gives the most robust coverage.

**Recommendation:** Implement Level 1 immediately (stop lying with fake data) + Level 2 as a near-term improvement (gives real but simpler analysis without any API key). Level 3 is a nice-to-have for maximum resilience.

**What needs to change in code:**
- `unified-grading-runner.ts`: Replace the "no API key" branch (lines 44-57) with either a failure return (Level 1) or a transcript-aware heuristic (Level 2).
- `kai-orchestrator.ts` `executeUnifiedGrading`: Remove the mock fallback code (lines 5150-5158) and let the runner handle the fallback logic directly.
- Optional: Add a fallback provider chain (Level 3) in the runner.

---

#### Q-4B: Pack 2's "DPS lift" — what does it refer to, and does the VPS rename apply here?

**Verified answer from code:**

The "DPS lift" in Pack 2 refers to the **pipeline's prediction score** (the 0-100 number), NOT the Dynamic Percentile System. Here is the exact evidence:

- `editing-coach-types.ts` line 15: `predicted_score: number; // Current DPS prediction` — this is the pipeline's output number
- `editing-coach-types.ts` line 30: `estimated_lift: number; // Expected DPS improvement` — improvement in that same number
- `editing-coach-runner.ts` line 153: `// Convert to DPS scale (0-100)` — confirms it's on the 0-100 scale
- `editing-coach-prompt.ts` line 56: `CURRENT PREDICTED DPS: ${predictedScore}` — sends the pipeline score to the LLM
- `upload-test/page.tsx` line 2576: `Current DPS` / line 2583: `Potential DPS` / line 2592: `+X.X DPS potential lift` — UI display

**So "DPS" here means the same thing as everywhere else in the pipeline** — it's the loose shorthand for the prediction score. It is NOT referring to the Dynamic Percentile System methodology.

**Once DP-3.1 is confirmed (rename to VPS):** Every one of these references should change:
- Code comments: "Current DPS prediction" → "Current VPS prediction"
- Code comments: "Expected DPS improvement" → "Expected VPS improvement"
- Code comments: "Convert to DPS scale" → "Convert to VPS scale"
- LLM prompt: "CURRENT PREDICTED DPS" → "CURRENT PREDICTED VPS"
- UI labels: "Current DPS" → "Current VPS", "Potential DPS" → "Potential VPS", "+X.X DPS potential lift" → "+X.X VPS potential lift"

**Thomas's instinct is correct:** The rename to VPS eliminates the confusion. "DPS lift" and "VPS lift" would mean the same thing mathematically (estimated improvement in the prediction score), but "VPS lift" makes clear we're talking about the Viral Prediction Score, not the Dynamic Percentile System.

**However, a deeper issue remains (RF-4.5):** Even after renaming, the lift numbers themselves are calculated from `RUBRIC_WEIGHTS` that may not be empirically validated. So "+6.5 VPS lift" is still a formula-derived estimate, not a measurement backed by real performance data. The rename solves the naming confusion; the weight validation (DP-4.4) solves the accuracy question.

---

#### Q-4C: Fix Pack V — same score each time for text-only, what does it measure, should it use AI (Gemini video recognition)?

**What Pack V measures (plain English):**
Pack V measures 5 visual aspects of a video on a 1-10 scale:
1. **Visual Hook** (25% weight) — Is the first frame attention-grabbing? Does it have a face, text overlay, vibrant colors?
2. **Pacing** (20% weight) — Are the scene cuts at a good rhythm? (TikTok optimal: 1 cut every 2-4 seconds)
3. **Pattern Interrupts** (20% weight) — Does the video change things up visually? Scene transitions, color variety?
4. **Visual Clarity** (15% weight) — Is the video high-resolution, well-lit, good contrast? Vertical format?
5. **Style Fit** (20% weight) — Does the visual style match what works in this niche? (e.g., "talking head" works for finance)

**Why it returns the same score for text-only predictions:**
When no video file is uploaded, none of the 6 upstream components (ffmpeg, thumbnail-analyzer, scene-detector, audio-analyzer, 24-styles, hook-scorer) can produce data. With zero visual signals, Pack V returns its stub: all five scores at exactly 5/10, overall = 50/100. Every text-only prediction gets this same neutral placeholder.

**How much it adds to prediction accuracy:**
- For video predictions: Pack V contributes moderately. Its overall score (0-100) becomes one component's prediction in the pattern_based path (45% weight path). The rule-based scoring is reasonable for basic quality signals (resolution, pacing, lighting).
- For text-only predictions: It contributes nothing (neutral 50 = no signal).

**Should Pack V use AI (Gemini video analysis)?**

This is a genuinely important question. Here's the analysis:

**YES — there are strong reasons to add Gemini vision analysis to Pack V:**
- Google Gemini can analyze video frames and understand WHAT is in the video (not just technical quality metrics). It could evaluate: "Is this visually compelling? Does the opening frame create curiosity? Are the scene transitions effective for this niche?"
- Current Pack V only sees numbers (resolution, brightness, FPS) — it has no understanding of CONTENT. It can tell you the video is 1080p at 30fps with 5 scene cuts, but it can't tell you whether those scene cuts are effective or whether the visuals are interesting.
- Gemini vision analysis would dramatically improve Pack V's value, especially for the visual hook and style fit dimensions where human judgment matters most.

**Caveats:**
- Adds latency (~3-8 seconds for video frame analysis)
- Requires sending video frames to Google's API (privacy/cost consideration)
- Should be additive (enhance the rule-based scores) not a replacement (keep the rule-based signals as a fast baseline)

**Better fallback for text-only predictions:**
When no video is available, instead of showing all 5s, Pack V could:
1. **Option A — Hide Pack V entirely** for text-only predictions. Don't show it at all. The UI would just not render the Pack V panel.
2. **Option B — Style-inference mode:** Even without a video, if the niche is known (e.g., "cooking"), Pack V could infer typical visual benchmarks for that niche: "For cooking content, top performers typically have: 7+ pacing score, frequent pattern interrupts, warm lighting." This becomes advisory guidance rather than scoring.
3. **Option C — Prompt the user:** Show a message like "Upload a video to get visual quality analysis" instead of fake 5/10 scores.

**Recommendation:** Short-term: Option A (hide Pack V when no video). Medium-term: Add Gemini vision analysis for video predictions. Long-term: Option B for text-only (niche-based visual guidance).

---

#### Q-4D: How do we fully implement Pack 3 (the disconnected "why it works" explainer)?

**Three specific fixes needed, in order:**

**Fix 1 — Add the barrel export (5 minutes):**
In `src/lib/rubric-engine/index.ts`, add the missing export:
```
export { runViralMechanics } from './viral-mechanics-runner';
export type { ViralMechanicsResult, Pack3Input, ViralMechanic } from './viral-mechanics-types';
```
This makes the function reachable by the orchestrator's dynamic import.

**Fix 2 — Fix the Pack V format mismatch (~1-2 hours):**
The Pack 3 runner's mechanic detectors (e.g., `detectVisualHook`, `detectOptimalPacing`, `detectPatternInterrupt`) currently look for `packV.visual_scores` — an array of `{dimension, score}` objects. But Pack V returns separate named fields like `visual_hook_score: {score, evidence}`.

Two options:
- **Option A:** Update the Pack 3 runner to read Pack V's actual format: `packV.visual_hook_score?.score` instead of `packV.visual_scores.find(s => s.dimension === 'hook_strength')`. This is the cleaner fix.
- **Option B:** Add an adapter in the orchestrator's `executeViralMechanics` that converts Pack V's output to the array format Pack 3 expects. This avoids touching the Pack 3 runner.

Also fix RF-4.8: update `detectEmotionalTrigger` to use Pack 1's actual attribute names (`emotional_journey`, not `emotional_resonance`; `tam_resonance`, not `relatability`).

**Fix 3 — Update the pipeline to extract Pack 3 results (~30 minutes):**
In `runPredictionPipeline.ts`:
1. Add extraction logic (similar to Pack 1/2/V): `if (componentResult.componentId === 'viral-mechanics' && componentResult.success) { viralMechanics = componentResult.features; }`
2. Change `qualitative_analysis.pack3` from `createViralMechanicsStub()` to `viralMechanics || createViralMechanicsStub()` — use real data when available, fall back to stub only when the component genuinely failed.
3. Update the `QualitativeAnalysis` TypeScript interface to accept the real `ViralMechanicsResult` type in addition to the stub type.

**After these 3 fixes:** Pack 3 would run as the final component in Phase 2, synthesize signals from Pack 1/2/V and all other components, detect the top 3 viral mechanics, and the UI (which already has full Pack 3 rendering code) would show the mechanics with strength bars, evidence, and a summary — instead of "COMING SOON."

**Estimated total effort:** 2-4 hours for all three fixes including testing.

---

#### Q-4E: How do we confirm proper execution structure of packs and ensure they integrate with every other prediction component?

**The problem:** Right now, there's no automated verification that the pack chain is working correctly. Each pack was built and tested in isolation, but the integration between them was never systematically validated.

**A Pack Integration Validation System would include:**

**1. Build-time integrity tests (automated, runs before every deploy):**
- Barrel export test: Verify every function the orchestrator imports is actually exported from `@/lib/rubric-engine`
- Type compatibility test: Verify Pack 3's input types match Pack V's output types (catches format mismatches like RF-4.3)
- Dependency chain test: Verify the orchestrator's execution order matches the pack dependency graph (V before 1, 1 before 2, all before 3)
- Component registry test: Verify every pack registered in the orchestrator has a corresponding runner, types file, and test

**2. Runtime integration tests (runs in CI pipeline):**
- End-to-end test: Send a real transcript through `runPredictionPipeline()` and verify: (a) all 4 pack results are present in `qualitative_analysis`, (b) each has `_meta.source` set, (c) Pack 2 received Pack 1's actual data, (d) Pack 3 received all other packs' data
- Mock isolation test: Run with API key unset and verify: (a) Pack 1 returns a clear failure or heuristic (not hardcoded mock), (b) Pack 2 handles Pack 1 failure gracefully, (c) Pack V returns appropriate output for text-only
- Signal flow test: Verify that upstream component data (ffmpeg, 24-styles, etc.) correctly flows into Pack V's input and that Pack V's output correctly flows into Pack 3's input

**3. Runtime assertions (guard rails in production code):**
- At the start of each pack runner, assert that required inputs are present (e.g., Pack 2 asserts Pack 1 result is not null)
- After each pack runs, assert the output conforms to the expected schema (Zod validation — already exists for Pack 1 and Pack V, needs adding for Pack 2 and Pack 3)
- In the pipeline, after all components run, assert the count of successful pack results matches expectation

**4. A Pack Health Dashboard (medium-term):**
- Display on the admin page: which packs are running real vs mock/stub
- Show pack execution latencies, success rates, and signal coverage
- Alert when a pack fails or falls back to stub for an unexpected reason

This ties directly into the guardrails question raised in Q-3K and DP-3.9 — these pack integration tests ARE a specific instance of the broader "system integrity guardrails" needed across the entire prediction system.

---

#### Q-4F: How do we fix the "zero real analysis" problem (API key missing + transcript only)?

**The root cause chain:**
1. `GOOGLE_AI_API_KEY` missing → Pack 1 returns mock → Pack 2 uses mock data → meaningless suggestions
2. No video uploaded → Pack V returns stub → neutral 50
3. Pack 3 disconnected → always "COMING SOON"
4. Result: 4 packs, 0 real analysis

**The fix is a layered approach:**

**Layer 1 — Ensure the API key is always set (immediate):**
The single most impactful fix. If `GOOGLE_AI_API_KEY` is set:
- Pack 1 runs REAL Gemini analysis
- Pack 2 generates suggestions based on REAL Pack 1 data
- Pack 3 (once connected) synthesizes REAL signals
- Only Pack V remains limited for text-only (which is appropriate — you can't analyze visuals without visuals)

Action: Verify the key is set in `.env.local` and any production deployment environment. Add a startup check that logs a prominent warning if it's missing.

**Layer 2 — Fix Pack 1's fallback (addresses the no-API-key scenario):**
Implement Q-4A Level 2 (transcript-aware heuristic). Even without an API key, Pack 1 would analyze the actual transcript and produce varying, meaningful (if less accurate) scores. This makes Pack 2's suggestions meaningful even without the API key.

**Layer 3 — Connect Pack 3 (addresses the "COMING SOON" problem):**
Implement Q-4D fixes. Pack 3 is rule-based (no API key needed), so once connected, it would produce real synthesis results in ALL scenarios — API key or not.

**Layer 4 — Fix Pack V for text-only (addresses the neutral stub):**
Implement Q-4C recommendations: hide Pack V when no video, or provide niche-based visual guidance.

**After all 4 layers:**
- API key present + video: ALL 4 packs produce real analysis
- API key present + text only: Pack 1 (real), Pack 2 (real), Pack 3 (real synthesis), Pack V (hidden or guidance mode)
- API key missing + video: Pack 1 (heuristic), Pack 2 (based on heuristic), Pack 3 (real synthesis), Pack V (real rule-based)
- API key missing + text only: Pack 1 (heuristic), Pack 2 (based on heuristic), Pack 3 (limited synthesis), Pack V (hidden or guidance mode)

Zero scenarios produce "zero real analysis."

---

#### Q-4G: Do we agree this needs a comprehensive plan within the context of all five phases?

**Absolutely, yes.** The Phase 4 findings are not isolated problems — they are deeply interconnected with findings from Phases 1-3, and will almost certainly connect to Phase 5 as well:

**Cross-phase connections already identified:**

| Phase 4 Issue | Connected To |
|---------------|-------------|
| Pack 1 mock data (RF-4.4) | RF-1.1 (Phase 1: Pack 1 showing mock data) — same root cause |
| Pack 3 disconnected (RF-4.1) | RF-1.2 (Phase 1: Pack 3 documented as "Complete" but is a stub) — now we know WHY it's a stub |
| Pack 2 "DPS lift" naming (Q-4B) | DP-3.1 (Phase 3: VPS rename decision) — part of the same rename |
| Pack integration validation (Q-4E) | DP-3.8 (Phase 3: Single Source of Truth Registry), DP-3.9 (Phase 3: Runtime assertions/guardrails) — packs are a key subsystem that needs these guardrails |
| Pack V for text-only (RF-4.6) | OQ-3.3 (Phase 3: Should "Cohort Context" be connected to real data?) — both are about showing meaningful vs. misleading information when full data isn't available |
| Pack 2's unvalidated weights (RF-4.5) | RF-2.1 (Phase 2: XGBoost trained on 27 videos) — the weights claim to come from the same undertrained model |

**The Post-Audit Resolution plan must address ALL of these as interconnected systems, not as isolated bug fixes.** A piecemeal approach — fixing Pack 3 without fixing Pack 1's fallback, or renaming DPS to VPS without updating Pack 2's labels — would create new inconsistencies.

**The comprehensive plan should be structured as:**
1. **Foundation layer:** VPS rename + Single Source of Truth Registry + API key management
2. **Pack restoration layer:** Connect Pack 3 + Fix Pack 1 fallback + Activate Pack 2 LLM (or fix labels) + Fix Pack V text-only
3. **Validation layer:** Build-time integrity tests + Runtime integration tests + Pack Health Dashboard
4. **Accuracy layer:** Recalibrate RUBRIC_WEIGHTS + Address double calibration + Validate XGBoost training data

This plan should emerge naturally from the Post-Audit Resolution phase after Phase 5 completes and we can see the full picture.

---

### 4.6 Open Questions

| ID | Question |
|----|----------|
| **OQ-4.1** | Is `GOOGLE_AI_API_KEY` set in the production/development environment? This single variable determines whether Pack 1 produces real analysis or fake data, and by extension whether Pack 2's suggestions are meaningful. Thomas needs to verify this. |
| **OQ-4.2** | Should Pack 2 be upgraded to use the existing `runEditingCoach()` LLM function instead of `generateRuleBasedSuggestions()`? Thomas's position: the "AI COACH" label is misleading and needs resolution — either activate the LLM or change the label. |
| **OQ-4.3** | Should Pack 3 be connected? Thomas's position: YES — see Q-4D for the 3-step implementation plan. |
| **OQ-4.4** | Should Pack 2's `RUBRIC_WEIGHTS` be recalibrated once more training data is available? Thomas's position: the lift estimates need to be based on real data, not fictional weights. |
| **OQ-4.5** | Should the UI "AI COACH" label for Pack 2 be changed? Thomas's position: naming discrepancy must be resolved alongside the VPS rename. |
| **OQ-4.6** | For text-only predictions, should Pack V be hidden entirely instead of showing a stub with all 5s? Thomas's position: needs a better fallback — see Q-4C for options. |
| **OQ-4.7** | Should Pack 1's mock behavior be changed? Thomas's position: YES — need a logic fallback, not identical fake data. See Q-4A for the tiered fallback strategy. |
| **OQ-4.8** | Should Gemini vision analysis be added to Pack V for video predictions? Could dramatically improve visual quality assessment beyond rule-based metrics. See Q-4C for analysis. |
| **OQ-4.9** | What is the comprehensive plan for fixing all pack issues within the context of all 5 audit phases? Thomas's position: these are interconnected system problems requiring a unified resolution, not isolated bug fixes. See Q-4G for cross-phase connection map. |

---

### 4.7 Decisions Pending

| ID | Decision |
|----|----------|
| **DP-4.1** | ★THOMAS DIRECTION★ Connect Pack 3. The full implementation exists and needs 3 fixes (barrel export, Pack V format mismatch, pipeline extraction). Estimated effort: ~2-4 hours. To be executed as part of Post-Audit Resolution. |
| **DP-4.2** | Activate Pack 2's LLM mode or fix the label? Thomas requires the naming discrepancy be resolved: either activate the Gemini-powered `runEditingCoach()` (making "AI COACH" honest) or change the label (making it honest the other way). |
| **DP-4.3** | Pack 1 fallback strategy: Thomas requires a logic fallback when API key is missing — NOT identical fake data. Recommended: Level 1 (honest failure) + Level 2 (transcript-aware heuristic). See Q-4A. |
| **DP-4.4** | Pack 2's RUBRIC_WEIGHTS revalidation: Must be addressed once more training data is available. Currently labeled "from XGBoost feature importance" but likely fictional given RF-2.1 (27-video training set). |
| **DP-4.5** | Pack dependency chain resilience: Should be addressed as part of the Pack Integration Validation System described in Q-4E. |
| **DP-4.6** | Pack V enhancement: (a) Short-term: hide for text-only predictions, (b) Medium-term: add Gemini vision analysis for video predictions, (c) Long-term: niche-based visual guidance for text-only. |
| **DP-4.7** | VPS rename includes Pack 2: All "DPS lift" references in code, prompts, and UI must be updated to "VPS lift" as part of the DP-3.1 rename. Confirmed by code evidence in Q-4B. |
| **DP-4.8** | Comprehensive cross-phase fix plan required: Thomas has explicitly stated that Phase 4 pack issues must be resolved within the context of all 5 phases as an interconnected system — not as isolated fixes. The Post-Audit Resolution must address this. |

---

## Phase 5: Viral Workflow & Calibration System

### 5.1 Verified Findings

#### 5.1.1 Viral Studio Architecture Overview

The Viral Studio lives at `/admin/viral-studio` and is a **9-phase multi-step workflow** for content creation guidance. There is also a **separate** `/admin/studio` page (159,000+ characters, the largest file in the codebase) that serves as a tabbed dashboard embedding the viral studio as one of its tabs.

**The 9 Phases (in order):**

| # | Phase Enum | Purpose | Data Source |
|---|-----------|---------|-------------|
| 1 | `ENTRY` | Path selection: "AI Templates" or "From Scratch" | Static UI |
| 2 | `ONBOARDING` | Niche + goal selection | Static dropdown |
| 3 | `SIGNAL_CALIBRATION` | TikTok-style swipe calibration (8 videos) | Local video pool (20 hardcoded videos) |
| 4 | `CALIBRATION_PROFILE` | Shows inferred profile; user can edit | Computed from swipe data |
| 5 | `GALLERY` | Browse viral video templates | **Real data** — fetches from `scraped_videos` Supabase table |
| 6 | `ANALYSIS` | "Deep dive" into selected template's viral DNA | **100% mock data** — hardcoded strings |
| 7 | `LAB_PHASE_1` (Discover) | "Discover Your Viral Opportunity" | **100% mock data** — hardcoded predictions |
| 8 | `LAB_PHASE_2` (Validate) | "Validate Your Strategy" | **100% mock data** — hardcoded retention curves |
| 9 | `LAB_PHASE_3` (Create) | "Create With Certainty" — live score as user types | **Local heuristic** — character-counting formula |

**Code location:** `src/app/admin/viral-studio/page.tsx` (main orchestrator, 528 lines)

#### 5.1.2 The Dashboard View — ViralPredictionDashboard

The viral studio page has a **view mode switcher** (Dashboard vs. Workflow). The Dashboard view renders `ViralPredictionDashboard.tsx` which displays:

- **"PREDICTION ACCURACY: 92.3%"** — hardcoded initial value, never fetched from real data
- **"VIDEOS ANALYZED: 24,891+"** — hardcoded, then auto-incremented by random 1-5 every 3 seconds
- **"SYSTEM UPTIME: 99.7%"** — hardcoded
- **"12-MODULE AUTOMATED PIPELINE"** — lists 12 modules (TikTok Scraper, Viral Pattern Analyzer, Template Discovery Engine, etc.) — **all hardcoded** with fake `processed` counts that auto-increment randomly
- **"DAILY VIRAL RECIPE BOOK"** — 3 "HOT" templates, 2 "COOLING" templates, 2 "NEW" templates — **all hardcoded** with fake success rates

**CRITICAL: None of these numbers come from the actual prediction system.** The 92.3% accuracy, 24,891 videos, 12 modules, recipe book entries — all are static values defined in the component's `useState` initializers. The counters increment on a timer to create the illusion of live processing.

**Code evidence:** `ViralPredictionDashboard.tsx` lines 24-61 (hardcoded state), lines 64-79 (fake counter incrementer on 3-second interval).

#### 5.1.3 System Banner — Fake Live Stats

The main viral studio page itself also shows a **"System Banner"** on lab phases with:
- `System Accuracy: 91.3%` — hardcoded in `initialState` (line 123)
- `Videos Analyzed: 24,891` — hardcoded, then incremented by random 1-3 every 2 seconds (line 253-261)
- "Live Analysis Active" with pulsing green dot — **pure decoration**

These numbers have no connection to any backend system.

#### 5.1.4 Signal Calibration System (Phases 3-4)

This is the **only substantive, working feature** in the viral studio workflow. It consists of:

**CalibrationScorer** (`src/lib/onboarding/calibration-scorer.ts`, 161 lines):
- Records swipe decisions (up = accept, down = reject) across 6 dimensions:
  - `nicheAffinity`, `hookStylePreference`, `toneMatch`, `audiencePainAlignment`, `editingStyleFit`, `contentFormatPreference`
- Accept weight: +15, Reject weight: -10, clamped to 0-100 range
- After all swipes, `inferProfile()` identifies top preference in each dimension
- Produces an `InferredProfile`: inferred niche, audience (with age range + description), content style, competitor list

**CalibrationVideoPool** (`src/lib/onboarding/calibration-video-pool.ts`, 389 lines):
- 20 hardcoded videos across 5 niches (Fitness=5, Business=5, Beauty=4, Education=3, Real Estate=3)
- Each video has 6 attribute tags matching the scorer dimensions
- `getCalibrationVideos(niche)` returns 8 videos: 4 niche-matched + 4 cross-niche, shuffled

**SignalCalibrationPhase** (`src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx`, 272 lines):
- TikTok-style swipeable card interface (drag up = accept, drag down = reject)
- Green glow at top (accept), red glow at bottom (reject)
- Keyboard shortcuts (Arrow Up/Down)
- After 8 swipes, calls `inferProfile()` and passes result to CalibrationProfilePhase

**CalibrationProfilePhase** (`src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx`, 242 lines):
- Shows 4 editable cards: Niche, Audience, Content Style, Competitors
- User can tap any card to edit the inferred value
- Two additional text inputs: "What do you sell?" (offer) and "Anything we should never include?" (exclusions)
- "THIS LOOKS RIGHT →" button advances to Gallery phase

**Assessment:** The calibration system is well-designed from a UX and data-modeling perspective. The scoring algorithm is sensible (weighted swipe accumulation across 6 dimensions). However, the inferred profile is **never passed to the prediction pipeline.** It exists only within the viral studio's local React state and is lost when the user navigates away.

#### 5.1.5 Gallery Phase — The One Real Data Connection

GalleryPhase (`src/app/admin/viral-studio/components/phases/GalleryPhase.tsx`, 954 lines) is the **only phase that fetches real data.** It queries `scraped_videos` from Supabase:

```
supabase.from('scraped_videos')
  .select('video_id, title, creator_username, views_count, likes_count, ...')
  .gte('views_count', 10000)
  .order('views_count', { ascending: false })
  .limit(24)
```

It also has a local `calculateDPS(video)` function (lines 36-50) that computes a DPS-like score from view/like/comment/share counts using a formula: `viewScore + engagementScore + viralityBonus + 10`. **This formula has NO connection to the actual prediction pipeline's DPS calculation.** It's a separate, independent scoring function defined inline in the gallery component.

Niche filtering is done via keyword matching on video titles (not a niche column) — the code comments acknowledge this: "scraped_videos doesn't have a 'niche' column, so we filter by title keywords."

#### 5.1.6 Analysis Phase — Pure Theater

When a user selects a template from the Gallery, the `handleTemplateSelection` callback (viral-studio/page.tsx line 201-210) calls two functions:

- `generateViralDNA(template)` — returns hardcoded object:
  ```
  { hookType: 'Authority Statement', valueProposition: 'Educational Content',
    callToAction: 'Follow for more tips', visualStyle: 'Clean & Professional',
    audioTrend: 'Trending Sound #1', framework: template.framework || 'Authority Hook' }
  ```
- `generatePredictions(template)` — returns:
  ```
  { viralProbability: template.viralScore, predictedViews: template.views,
    peakEngagement: '72h', confidence: '94%',
    successFactors: [
      { factor: 'Audience Match', score: '94%' },
      { factor: 'Trending Audio Sync', score: '91%' },
      { factor: 'Optimal Timing', score: '87%' },
      { factor: 'Hook Strength', score: '92%' }
    ] }
  ```

These functions are defined locally in the page component (lines 225-248). The "predictions" displayed to the user are **not predictions at all** — they are the template's existing metrics repackaged with hardcoded success factors. No prediction pipeline is called, no API request is made.

The Analysis Phase UI renders these fake predictions with impressive formatting: a large "Success Probability" percentage, predicted views, peak engagement window, confidence level, and 4 success factors with animated bars.

#### 5.1.7 Lab Phases — All Mock Data

**Lab Phase 1 (Discover):**
- Shows "Future Viral Vault" with "14-day predictions proving system intelligence" — all hardcoded
- Success factors: `['YOUR Audience Match: 94%', 'Trending Audio Sync: 91%', 'Optimal Timing: 87%', 'Hook Strength: 92%']` — same hardcoded values every time
- No API calls, no prediction pipeline interaction

**Lab Phase 2 (Validate):**
- "Hook Power" meter animates from 0 to 85 — hardcoded target
- Framework recommendations: `{ framework: 'Authority Hook', confidence: '94%' }` — a static lookup table keyed by niche
- Retention curve: `[95%, 78%, 65%, 52%, 41%, 33%]` — hardcoded array, same for every video
- "AI Confidence: 94% success prediction" — hardcoded string
- No API calls

**Lab Phase 3 (Create):**
- "Live Viral Score" — a **local character-counting heuristic** (lines 69-93):
  - Base score: 60
  - Hook length > 10 chars: +5, > 20 chars: +5
  - Hook contains "?": +3 (questions)
  - Hook contains digit: +2 (numbers)
  - Authority field > 5 chars: +3, contains "expert"/"certified"/"years": +4, > 15 chars: +3
  - Each value point > 5 chars: +5 per point (max 3)
  - 5+ checklist items completed: +5
  - Cap at 95
- Displays: "This will succeed with {liveScore + 4}% confidence" — adds 4 to whatever score was calculated
- No API calls, no prediction pipeline

#### 5.1.8 The `/admin/studio` Page — Mega File

The `/admin/studio/page.tsx` is approximately **159,000+ characters** (2,796+ lines). It's a tabbed interface that embeds:
- `ViralWorkflowComponent` (the viral-studio page) as one tab, with `initialView='workflow'` and `hideViewSwitcher={true}`
- `GalleryPhase` directly as another tab
- `ValidationDashboard` as another tab
- Several other workflow-related features (creator workflow, script writing)

Key finding: `/admin/studio` imports and renders `ViralWorkflowComponent` from `viral-studio/page.tsx`, so the viral studio is accessible through two routes.

Navigation: `MasterNavigation.tsx` shows "THE STUDIO" pointing to `/admin/studio` (the mega-page), but `/admin/viral-studio` is not listed in the main navigation. It's accessible via direct URL or through the Super Admin Sidebar.

#### 5.1.9 Prediction Calibrator — Properly Connected

The **Prediction Calibrator** (`src/lib/prediction/prediction-calibrator.ts`, 437 lines) is the **one correctly functioning calibration system**. Unlike the viral studio's fake calibration, this is:

- **Called by the actual pipeline:** `runPredictionPipeline.ts` line 486: `calibratePrediction(calibrationInput)`
- **Uses real component outputs:** Takes raw DPS, confidence, transcription status, audio presence, Pack V results, style/niche
- **Applies 3 rules:**
  - Rule 1: Confidence × 0.7 when no speech detected
  - Rule 2: DPS cap (55 standard / 65 visual-first) for silent videos with low Pack V scores
  - Rule 4: Progressive high-DPS scaling (15%/20%/25% reduction for 60-70/70-80/80+ DPS)
- **Logs training features:** Pack V scores are saved to `training_features_packv` table for model retraining
- **Returns full audit trail:** Every adjustment is logged with before/after values and rule name

**Assessment:** The prediction calibrator is architecturally sound. It does what it claims, is well-tested, properly integrated into the pipeline, and provides full traceability. The double-calibration concern from Phase 3 (OQ-3.1) remains: the orchestrator's `performDeepAnalysis` also reduces high predictions, and the calibrator's Rule 4 does the same. These could compound to over-penalize.

#### 5.1.10 Key Disconnection: Calibration Profile → Prediction Pipeline

The signal calibration system (viral studio phases 3-4) builds a sophisticated user profile with 6 dimensions of preference. This profile contains valuable information about the creator's niche, audience, hook style, tone, editing style, and content format.

**The prediction pipeline never receives this information.** When a user eventually runs a prediction through `/admin/upload-test` (the primary prediction page), the pipeline has no knowledge of the user's calibration profile. The two systems exist in entirely separate code paths:

- **Calibration system:** React state in viral studio → never persisted to database → lost on navigation
- **Prediction pipeline:** Receives videoId, optional niche string, optional transcript → no user profile context

The calibration data, if connected, could meaningfully improve predictions by providing creator context (what kind of content they make, who their audience is, what style resonates with their followers).

---

### 5.2 Red Flags

| ID | Severity | Finding |
|----|----------|---------|
| **RF-5.1** | **CRITICAL** | **ViralPredictionDashboard is 100% fabricated data.** The "92.3% accuracy," "24,891 videos analyzed," "12-module pipeline," and "recipe book" are all hardcoded values with fake auto-incrementing counters. No real system metrics are displayed. A user seeing this dashboard would believe the system is far more capable and validated than it actually is. |
| **RF-5.2** | **CRITICAL** | **The viral studio workflow has ZERO connection to the prediction pipeline.** None of the 9 phases call `runPredictionPipeline()`, `/api/kai/predict`, or any prediction endpoint. The "predictions" shown in the Analysis Phase and Lab Phases are hardcoded strings. The user is presented with fake prediction data as if it were real AI analysis. |
| **RF-5.3** | **HIGH** | **System Banner displays fake live stats.** "System Accuracy: 91.3%" and "Videos Analyzed: 24,891" (auto-incrementing) with a pulsing "Live Analysis Active" indicator — all client-side fabrications with no backend connection. |
| **RF-5.4** | **HIGH** | **Analysis Phase "predictions" are template data repackaged.** `generatePredictions(template)` simply returns the template's existing `viralScore` as "Success Probability" and hardcoded success factors. No analysis occurs. |
| **RF-5.5** | **HIGH** | **Lab Phase 3 "Viral Score" is a character-counting formula.** It awards points for string length, question marks, and keywords ("expert", "certified"), capped at 95. It then claims "This will succeed with {score+4}% confidence." This is presented as AI-powered viral prediction but is pure string-length heuristics. |
| **RF-5.6** | **MEDIUM** | **Gallery's `calculateDPS()` is a separate, unrelated scoring formula.** It exists only in GalleryPhase.tsx and has no connection to the pipeline's DPS calculation, the Dynamic Percentile System, or any other scoring system in the codebase. A third independent "DPS" computation adds to the naming confusion (see DP-3.1). |
| **RF-5.7** | **MEDIUM** | **Calibration profile is never persisted.** The signal calibration system builds a useful 6-dimension creator profile, but it lives only in React state. It's not saved to the database, not passed to the prediction pipeline, and is lost on page navigation. |
| **RF-5.8** | **MEDIUM** | **The `/admin/studio` page is ~159,000 characters.** This single-file mega-component is a maintenance hazard. It embeds the viral workflow, gallery, validation dashboard, creator workflow, script writing, and more in one file. |
| **RF-5.9** | **LOW** | **LabPhase2 "retention curve" is hardcoded** — the same `[95%, 78%, 65%, 52%, 41%, 33%]` data points appear regardless of the selected video or niche. |
| **RF-5.10** | **LOW** | **LabPhase1 and LabPhase2 "AI insights" are static strings** — identical for every user, every niche, every video. "Hook strength is optimal for your niche audience" is always displayed. |

---

### 5.3 Viral Studio Truth Table

| Phase | Claims | Reality | Connected to Pipeline? |
|-------|--------|---------|----------------------|
| Entry | "AI Templates" path | Static UI, no AI | No |
| Onboarding | Niche/goal selection | Works as described | No — data not passed to pipeline |
| Signal Calibration | "Your DNA is building..." | Real algorithm (CalibrationScorer with 6 dimensions) | No — profile never persisted |
| Calibration Profile | "Here's what we know about you" | Accurately shows computed profile | No — lost on navigation |
| Gallery | Browse viral templates | **REAL DATA** from `scraped_videos` table | Partial — reads DB, but its `calculateDPS()` is independent |
| Analysis | "Deep dive into viral DNA and success predictions" | Hardcoded strings, no analysis occurs | No |
| Lab Phase 1 | "14-day predictions proving system intelligence" | Hardcoded success factors, no predictions | No |
| Lab Phase 2 | "AI Confidence: 94% success prediction" | Hardcoded retention curve, static insights | No |
| Lab Phase 3 | "Live Viral Score" with confidence % | Character-counting heuristic | No |
| Dashboard | "92.3% accuracy, 24,891 videos analyzed, 12 modules" | 100% fabricated, auto-incrementing counters | No |

**Summary:** Out of 10 distinct views in the viral studio system, exactly **1** (Gallery) connects to real data, and **1** (Signal Calibration) runs a real algorithm. The remaining 8 views present fabricated or hardcoded data as if it were AI-powered analysis.

---

### 5.4 What the Calibration System ACTUALLY Does vs. Claims

#### Signal Calibration (Viral Studio — Phases 3-4)

| Aspect | Claim | Reality |
|--------|-------|---------|
| **What it does** | "PHASE 01: SIGNAL CALIBRATION" — "Your DNA is building..." | Accurately described — it IS building a preference profile |
| **Algorithm** | Implied: sophisticated AI | Reality: weighted accumulator (+15 accept / -10 reject) across 6 dimensions. Simple but functional. |
| **Video pool** | Implied: large dataset | 20 hardcoded videos, 8 shown per session |
| **Output** | Inferred profile (niche, audience, style, competitors) | Correctly computed from swipe data — this works |
| **Persistence** | Implied: saves to your account | React state only — lost on page refresh |
| **Pipeline connection** | Implied: improves your predictions | Zero connection to prediction pipeline |

#### Prediction Calibrator (Pipeline — `prediction-calibrator.ts`)

| Aspect | Claim | Reality |
|--------|-------|---------|
| **What it does** | Calibrates raw prediction scores | Accurately described — it applies 3 correction rules |
| **Connection** | Part of the canonical pipeline | Confirmed — called at line 486 of `runPredictionPipeline.ts` |
| **Rule 1** | Confidence penalty for no-speech videos | Works as documented: confidence × 0.7 |
| **Rule 2** | DPS cap for silent videos | Works with guardrails: language signal check + visual-first allowlist |
| **Rule 4** | High-DPS scaling (LLM over-prediction correction) | Works: progressive 15%/20%/25% reduction above DPS 60/70/80 |
| **Training data logging** | Logs Pack V features for model retrain | Implemented — writes to `training_features_packv` table |
| **Audit trail** | Shows all adjustments | Full before/after logging with rule names |

**Key distinction:** There are two completely separate "calibration" concepts in the codebase:
1. **Signal Calibration** (viral studio) — user preference profiling via swipe interface. **Not connected** to predictions.
2. **Prediction Calibrator** (pipeline) — post-prediction score adjustment based on content attributes. **Fully connected** and working.

---

### 5.5 The `/admin/studio` vs `/admin/viral-studio` Relationship

| Route | File | Size | Navigation | Purpose |
|-------|------|------|------------|---------|
| `/admin/viral-studio` | `src/app/admin/viral-studio/page.tsx` | 528 lines | Not in main nav; accessible via Super Admin Sidebar or direct URL | 9-phase creation workflow + dashboard |
| `/admin/studio` | `src/app/admin/studio/page.tsx` | ~2,796+ lines (~159K chars) | Listed in MasterNavigation as "THE STUDIO" | Mega-page that **embeds** viral-studio as one of its tabs, plus gallery, validation, creator workflow, script writing |

`/admin/studio` imports `ViralWorkflowComponent` from `viral-studio/page.tsx` (line 8) and renders it as a tab with `initialView='workflow'` and `hideViewSwitcher={true}`.

The same viral studio content is therefore accessible through two routes, with slightly different wrapping (the `/admin/studio` version hides the view mode switcher and embeds it in a tabbed layout).

---

### 5.6 Double Calibration Issue (Cross-Reference OQ-3.1)

Two systems reduce high predictions independently:

1. **Orchestrator's `performDeepAnalysis`** (Phase 3 finding): When LLM predictions disagree, gives Gemini 3x weight and can reduce scores
2. **Prediction Calibrator Rule 4**: Applies 15-25% progressive reduction for all predictions above DPS 60

These run sequentially in the pipeline. If the orchestrator already reduced a high prediction from 80 → 65, the calibrator then applies another 15% reduction: 65 → 55.25. The net effect is a ~31% total reduction, which is likely excessive.

**Evidence from prediction-calibrator.ts:**
- Rule 4 thresholds: `HIGH_DPS_THRESHOLD = 60`, scaling factors: `0.85` (60-70), `0.80` (70-80), `0.75` (80+)
- This applies to ALL predictions above 60, regardless of whether the orchestrator already adjusted them

This confirms OQ-3.1 from Phase 3: the double reduction is very likely accidental, not intentional.

---

### 5.7 Open Questions

| ID | Question |
|----|----------|
| **OQ-5.1** | Should the ViralPredictionDashboard be connected to real system metrics, or should it be removed/rebuilt? The current fabricated data is actively misleading. |
| **OQ-5.2** | Should the calibration profile (from signal calibration) be persisted to the database and passed to the prediction pipeline? This data could genuinely improve prediction accuracy by providing creator context. |
| **OQ-5.3** | Should the viral studio's Analysis and Lab phases be connected to the real prediction pipeline? Currently they show fabricated data. Options: (a) connect them to real predictions, (b) clearly label them as demo/concept, (c) remove them. |
| **OQ-5.4** | Should the `/admin/studio` mega-file be decomposed? At ~159K characters in a single file, it's a maintenance hazard and likely causes IDE performance issues. |
| **OQ-5.5** | Should Gallery's independent `calculateDPS()` be replaced with the pipeline's DPS calculation (or the future VPS)? Having a third, unrelated "DPS" formula adds to the naming confusion documented in DP-3.1. |
| **OQ-5.6** | Should the double calibration (orchestrator reduction + calibrator Rule 4) be consolidated into a single calibration pass? See OQ-3.1 for the original question; Phase 5 provides the detailed code evidence. |
| **OQ-5.7** | Is the calibration video pool (20 hardcoded videos, 5 niches) sufficient for accurate preference profiling? If the user's niche isn't one of the 5 (fitness, business, beauty, education, real estate), they get only cross-niche videos. |
| **OQ-5.8** | Should the Lab Phase 3 "Viral Score" character-counting heuristic be connected to the real pipeline, or should it be honestly labeled as a "content completeness" score rather than a "viral prediction"? |

---

### 5.8 Decisions Pending

| ID | Decision |
|----|----------|
| **DP-5.1** | What to do with fabricated dashboard metrics: (a) Connect to real system data (requires backend metrics collection), (b) Remove the dashboard, (c) Honestly label as "demo/mockup." |
| **DP-5.2** | Calibration profile persistence: (a) Save to Supabase after calibration profile phase, (b) Pass as context to prediction pipeline, (c) Leave as-is (local state, no persistence). |
| **DP-5.3** | Viral studio pipeline connection: (a) Full connection — Analysis + Lab phases call real prediction API, (b) Partial connection — only connect where meaningful, (c) Honest labeling — mark as concept/demo, (d) Remove — strip out fake prediction displays. |
| **DP-5.4** | Double calibration consolidation: Merge orchestrator's high-prediction reduction with calibrator Rule 4 into a single, well-documented calibration pass with clear thresholds and audit trail. See OQ-3.1. |
| **DP-5.5** | Gallery DPS formula: (a) Replace with pipeline's scoring, (b) Rename to distinguish from pipeline DPS/VPS, (c) Remove — just show raw view counts. |
| **DP-5.6** | Studio mega-file decomposition: Break `/admin/studio/page.tsx` (~2,800 lines) into focused sub-components. Priority: after functional fixes. |
| **DP-5.7** | Calibration video pool expansion: (a) Expand to cover all 20 niches in the platform, (b) Fetch calibration videos from database instead of hardcoding, (c) Leave as-is for MVP. |

---

## Post-Audit: Interconnected Issues & Resolution Plan

### Cross-Phase Red Flag Summary

| ID | Severity | Phase | Summary |
|----|----------|-------|---------|
| **RF-1.1** | CRITICAL | 1 | XGBoost model trained on only 27 videos — any ML claims are unsubstantiated |
| **RF-1.2** | HIGH | 1 | "DPS" used for 3 completely different things (pipeline score, Dynamic Percentile System, Gallery's local formula) |
| **RF-2.1** | HIGH | 2 | Component registry shows 27 registered, but many are stubs or disabled |
| **RF-3.1** | MEDIUM | 3 | Double high-prediction reduction (orchestrator + calibrator) may over-penalize |
| **RF-4.1** | CRITICAL | 4 | Pack 3's full 580-line implementation is completely unreachable (double disconnection) |
| **RF-4.2** | HIGH | 4 | Pack 2 labeled "AI COACH" but uses zero AI — pre-written templates only |
| **RF-4.3** | HIGH | 4 | Pack 3/Pack V data format mismatch — even if connected, 3 of 9 detectors would fail |
| **RF-4.4** | HIGH | 4 | Pack 1 mock returns identical data for every video when API key missing |
| **RF-5.1** | CRITICAL | 5 | ViralPredictionDashboard is 100% fabricated data — 92.3% accuracy, 24,891 videos, 12 modules all fake |
| **RF-5.2** | CRITICAL | 5 | Viral studio workflow has ZERO connection to prediction pipeline — all "predictions" are hardcoded |
| **RF-5.3** | HIGH | 5 | System Banner displays fabricated "live" stats with auto-incrementing counters |
| **RF-5.4** | HIGH | 5 | Analysis Phase "predictions" are template data repackaged as AI analysis |
| **RF-5.5** | HIGH | 5 | Lab Phase 3 "Viral Score" is a character-counting formula presented as AI prediction |

### Interconnection Map

The red flags cluster into **4 interconnected problem domains:**

**Domain A: Naming & Identity Crisis (RF-1.2, RF-5.6)**
- "DPS" means 3 different things in 3 different places
- Pack 2 calls its lift estimate "DPS lift" — refers to the pipeline score, not the Dynamic Percentile System
- Gallery has its own independent `calculateDPS()` formula
- DP-3.1 (VPS rename) resolves this IF applied comprehensively across all 3 domains

**Domain B: Fabricated Data & Theater (RF-5.1, RF-5.2, RF-5.3, RF-5.4, RF-5.5, RF-5.7)**
- The entire viral studio presents fabricated data as real AI analysis
- The ViralPredictionDashboard fabricates system metrics
- Lab phases show hardcoded "predictions" as if computed by AI
- The calibration profile is built but never used
- Resolution: Either connect to real systems OR honestly label as demos

**Domain C: Disconnected Components (RF-4.1, RF-4.2, RF-4.3, RF-4.4, RF-2.1)**
- Pack 3: full implementation exists but is unreachable
- Pack 2: LLM version exists but is never called
- Pack 1: returns identical fake data without API key
- Pack V: returns neutral stub for text-only
- Multiple component registrations are stubs or disabled
- Resolution: Connect what exists, fix data format mismatches, handle missing API keys gracefully

**Domain D: Calibration & Accuracy (RF-1.1, RF-3.1)**
- XGBoost trained on 27 videos — ML claims unsubstantiated
- Double high-prediction reduction compounds penalties
- Pack 2's RUBRIC_WEIGHTS claim XGBoost origin but are likely fictional
- Resolution: Consolidate calibration, retrain with more data, validate weight claims

### Recommended Resolution Priority

**Priority 1 — Integrity (Weeks 1-2): Stop showing fabricated data as real**
1. DP-5.1: Remove or honestly label fabricated dashboard metrics
2. DP-5.3: Remove or honestly label fake predictions in viral studio
3. DP-3.1: Complete VPS rename to eliminate DPS confusion (includes DP-4.7, DP-5.5)
4. DP-4.3: Pack 1 fallback — show honest "no analysis available" instead of identical fake data

**Priority 2 — Connection (Weeks 2-4): Make real things work**
5. DP-4.1: Connect Pack 3 (barrel export + format fix + pipeline extraction)
6. DP-4.2: Activate Pack 2 LLM mode OR fix "AI COACH" label
7. DP-5.4: Consolidate double calibration into single pass
8. DP-5.2: Persist calibration profile to database, pass to pipeline

**Priority 3 — Enhancement (Weeks 4-6): Make things better**
9. DP-4.6: Pack V enhancement (hide for text-only, add Gemini vision for video)
10. DP-5.3 (option a): Connect viral studio to real prediction pipeline
11. DP-5.7: Expand calibration video pool
12. DP-3.8: Single Source of Truth Registry

**Priority 4 — Validation (Ongoing): Prove it works**
13. DP-4.4: Recalibrate RUBRIC_WEIGHTS with real training data
14. DP-3.9: Build-time integrity tests + runtime assertions
15. DP-5.6: Studio mega-file decomposition
16. RF-1.1: Retrain XGBoost with larger dataset

### Final Assessment for Thomas

**In plain English, here is what the 5-phase audit found:**

Your prediction system has two very different halves:

**The prediction pipeline (the engine room)** — This is real, functional software. When you go to `/admin/upload-test` and submit a transcript, a real process runs: components analyze the text, LLMs grade the content (when the API key is set), scores are calculated, calibration rules adjust for edge cases, and everything is saved to the database with a traceable run_id. It has genuine issues (some components are disconnected, the ML model needs more training data, there's a naming mess with "DPS"), but the core architecture is sound and it produces real analysis.

**The viral studio (the showroom)** — This is almost entirely presentation. The impressive-looking dashboard with "92.3% accuracy" and "24,891 videos analyzed" is fabricated — those numbers are typed into the code and a timer makes them tick up to look live. The "predictions" shown after you select a template are hardcoded strings, not actual predictions. The "Live Viral Score" in the creation lab is counting how many characters you typed, not analyzing viral potential. The one genuinely clever feature — the swipe-based calibration system — builds a useful creator profile that is then thrown away because nothing reads it.

**The two halves don't talk to each other.** The viral studio never calls the prediction pipeline. The calibration profile is never sent to the prediction engine. They exist as completely separate codebases that happen to live in the same project.

**What needs to happen:**
1. **Stop fabricating data.** Either connect the viral studio to real systems or clearly mark it as a demo/concept. Showing fake numbers dressed up as real AI analysis erodes trust.
2. **Connect what's already built.** Pack 3 has a complete 580-line implementation that just needs 3 lines fixed to start working. Pack 2 has a real AI version sitting unused. The calibration profile could improve predictions if saved and forwarded.
3. **Fix the naming.** "DPS" meaning three different things in three different places guarantees confusion. The VPS rename (which you've already preliminarily approved) needs to be applied everywhere.
4. **Consolidate calibration.** Two systems independently reduce high predictions, potentially over-penalizing. They should be merged into one clear system.
5. **Validate claims.** The ML model was trained on 27 videos. Pack 2's weights claim to come from XGBoost but likely don't. These claims need to be either validated with real data or removed.
