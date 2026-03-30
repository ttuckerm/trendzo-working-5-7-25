# Side-Hustles Execution Prompts — Niche-Locked Training Sequence

**Scope:** Side-hustles / making money online videos ONLY
**Format:** Creator-led short-form, talking-head knowledge content, direct-to-camera educational shorts
**Contamination Firewall:** All prompts use `models/holdout-video-ids.json` (50 videos, 10 per tier)
**Feature Set:** v7 content-only (72 features, 11 groups)
**Source Plans:** `.planning/accuracy-roadmap.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`

---

## Prompt Tracking

| # | Title | Status | Key Result |
|---|-------|--------|------------|
| 10 | Train & Evaluate Raw-DPS + Breakout | COMPLETE | Raw ρ=0.614 CV, breakout ρ=0.312 (defer) |
| 11 | Initiative Intelligence Page | COMPLETE | /admin/operations/initiative — signal coverage, prompt board, live Spearman |
| 12 | Hyperparameter Optimization | PENDING | — |
| 13 | Feature Selection Refinement | PENDING | — |
| 14 | Error Analysis & Residual Diagnosis | PENDING | — |
| 15 | Pipeline Component Ablation (D2) | PENDING | — |
| 16 | Calibration Overhaul (D3) | PENDING | — |
| 17 | Retrain v8 — Integrate All Improvements | PENDING | — |
| 18 | Creator-Depth Expansion + Breakout v2 | PENDING | — |
| 19 | Accuracy Dashboard & Monitoring | PENDING | — |

---

## Current State (Post-Prompt 10)

- **Dataset:** 863 side-hustles videos (813 train + 50 holdout, stratified by tier)
- **Model:** XGBoost v7, 72 content-only features, locked hyperparameters
- **Raw-DPS model:** CV ρ=0.614 ±0.019 | Holdout ρ=0.783 | MAE=11.22 CV, 14.86 holdout
- **Breakout model:** CV ρ=0.312 (too weak for production, deferred)
- **Ablation findings:** ffmpeg_core strongest contributor; 7 groups marginally hurt (deltas <0.015, likely noise at N=863)
- **Creators:** 20 unique, all with 2+ videos (need more per-creator depth for breakout)
- **Accuracy roadmap expected ρ=0.25-0.40 at 300 videos** — we're at 0.614 with 863, ahead of plan

---

## Prompt 11: Initiative Intelligence Page

**Status:** COMPLETE

**Goal:** Build a dedicated page at `/admin/operations/initiative` that makes the entire research initiative manageable, auditable, and transferable. Linked from the Operations hub.

**Deliverables:**
1. API route: `src/app/api/admin/operations/initiative/route.ts`
2. Page: `src/app/admin/operations/initiative/page.tsx`
3. Link added to Operations hub quick actions

**Page sections:**
- Signal coverage status across 5 families (content, creator, distribution, cultural, audience) with per-signal measured/partial/missing status
- 10-prompt research initiative as a live status board — each prompt as a card with status, output document link, and what it unlocked
- Real Spearman accuracy number from `vps_evaluation` table (falls back to model metadata CV Spearman)
- Summary cards: signal coverage %, initiative progress, training data count, model version

**Design:** Matches existing dark UI (bg-black, white/[0.02] cards, white/[0.06] borders, lucide-react icons, same typography hierarchy as system-health page).

---

## Prompt 12: Hyperparameter Optimization

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Find optimal XGBoost hyperparameters for the 863-video side-hustles dataset. The current hyperparameters were locked during early v5/v6 development and were never tuned for this data volume.

**Deliverables:**
1. Python script at `scripts/hyperparam-search-prompt12.py`
2. Results file at `models/hyperparam-search-results.json`
3. Append results summary to `docs/TRAINING_EVAL_REPORT.md` under a new `## Prompt 12: Hyperparameter Optimization` section

**Required analyses:**
- Bayesian optimization (optuna) OR randomized grid search over:
  - `n_estimators`: [50, 75, 100, 150, 200, 300]
  - `learning_rate`: [0.01, 0.03, 0.05, 0.08, 0.1]
  - `max_depth`: [3, 4, 5, 6]
  - `min_child_weight`: [3, 5, 7, 10]
  - `subsample`: [0.6, 0.7, 0.8, 0.9]
  - `colsample_bytree`: [0.5, 0.6, 0.7, 0.8]
  - `reg_alpha`: [0.1, 0.5, 1.0, 2.0]
  - `reg_lambda`: [1.0, 2.0, 3.0, 5.0]
- Objective: maximize 5-fold CV Spearman ρ
- Report top 5 configurations with their CV Spearman, MAE, within-10-DPS
- Compare best configuration vs current locked hyperparameters (Prompt 10 baseline)
- Run the best configuration on holdout to verify generalization

**Constraints:**
- Use SAME holdout split (`models/holdout-video-ids.json`) — holdout is NEVER used during search
- Use SAME 72 features (no feature changes in this prompt)
- Niche filter: side-hustles only
- Do NOT overwrite v7 model files — save new artifacts with `-candidate` suffix
- Contamination firewall: no post-publication metrics in features

**Verification:**
- End with `### Should We Adopt These Hyperparameters?`
- Decision criteria: adopt if CV Spearman improves by ≥0.02 AND holdout Spearman does not degrade by >0.01
- If improvement is <0.02, recommend keeping current hyperparameters
- Report overfit gap (train ρ - holdout ρ) for both old and new configs

---

## Prompt 13: Feature Selection Refinement

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Find the optimal feature subset for the side-hustles model. Prompt 10 ablation showed 7 of 11 feature groups marginally hurt the model, but with deltas <0.015 that may be noise. This prompt does rigorous feature selection to determine if a leaner model generalizes better.

**Deliverables:**
1. Python script at `scripts/feature-selection-prompt13.py`
2. Results file at `models/feature-selection-results.json`
3. Append results summary to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 13: Feature Selection`

**Required analyses:**
- **Backward elimination:** Start with all 72 features. Remove the least-important feature (by XGBoost importance), retrain, measure CV Spearman. Repeat until 5 features remain. Plot CV Spearman vs feature count to find the elbow.
- **Forward selection:** Start with the single best feature (`visual_scene_count`). Add the feature that most improves CV Spearman, one at a time. Stop when adding a feature doesn't improve CV Spearman by ≥0.002. Plot the curve.
- **Hybrid:** Use the best hyperparameters from Prompt 12 (if adopted) OR current locked hyperparameters if Prompt 12 result was "keep."

**Required comparisons:**
- Full 72-feature model vs backward-elimination-optimal vs forward-selection-optimal
- Spearman (CV + holdout), MAE (CV + holdout), within-10-DPS, tier accuracy
- Feature overlap between backward and forward optimal sets

**Constraints:**
- Same holdout split, same contamination firewall
- Do NOT overwrite v7 model files
- If forward and backward disagree, report both and recommend the one with lower overfit gap
- Niche-locked: side-hustles only

**Verification:**
- End with `### Should We Reduce the Feature Set?`
- Decision criteria: keep lean model if CV Spearman ≥ full model AND holdout Spearman ≥ full model - 0.01
- If lean model is better, list the specific features to keep and drop
- If results are inconclusive, recommend keeping all 72 features

---

## Prompt 14: Error Analysis & Residual Diagnosis

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Understand WHERE and WHY the model fails. The v7 model has holdout MAE=14.86 and only 34% within ±10 DPS. This prompt diagnoses systematic error patterns to inform calibration fixes (Prompt 16) and feature engineering.

**Deliverables:**
1. Python script at `scripts/error-analysis-prompt14.py`
2. Report appended to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 14: Error Analysis`
3. Visualization PNGs saved to `models/visualizations/`:
   - `residuals_by_tier.png` — boxplot of prediction errors grouped by actual DPS tier
   - `predictions_vs_actual_scatter.png` — scatter with identity line + regression line
   - `error_by_duration.png` — prediction error vs video duration
   - `error_by_feature_top5.png` — error vs top 5 features (partial dependence)

**Required analyses:**
- **Tier-level error breakdown:** For each DPS tier (low/average/good/viral/mega-viral):
  - Mean prediction error (bias direction: over-predict or under-predict?)
  - MAE, median absolute error
  - N in tier, % correctly classified to tier
- **Systematic bias detection:**
  - Does the model over-predict for low-DPS videos? Under-predict for viral?
  - Is there a regression-to-the-mean effect? (predictions compressed toward 45-55 range)
  - Compute prediction range (max predicted - min predicted) vs actual range — is the model range too narrow?
- **Feature-conditional error:**
  - For the top 10 features by importance: split videos into quartiles by feature value, compute MAE per quartile
  - Identify features where error is concentrated (e.g., "model fails badly on videos >60s")
- **Worst predictions analysis:**
  - List the 10 worst holdout predictions (highest |error|)
  - For each: actual DPS, predicted DPS, top 3 feature values, hypothesize why wrong
- **Creator-level error:**
  - Group errors by creator — does the model fail systematically for specific creators?
  - Mean error per creator, variance per creator

**Constraints:**
- Read-only analysis — no model changes, no retraining
- Use the current v7 model and the Prompt 10 holdout predictions
- Same contamination firewall
- Niche-locked: side-hustles only

**Verification:**
- End with `### Diagnosis Summary` listing:
  1. Top 3 systematic biases found
  2. Which DPS tiers are well-predicted vs poorly predicted
  3. Recommended calibration adjustments for Prompt 15
  4. Any features that should be added or removed based on error patterns

---

## Prompt 15: Pipeline Component Ablation (D2)

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Implement the component efficacy evaluation framework (Decision D2 from the prediction audit). This is DIFFERENT from Prompt 10's feature-group ablation — this tests the contribution of each of the 22 pipeline COMPONENTS (Pack 1, Pack 2, XGBoost, hook-scorer, etc.) to overall prediction accuracy.

**Deliverables:**
1. TypeScript module at `src/lib/training/component-ablation.ts`
2. API endpoint at `src/app/api/training/component-ablation/route.ts`
3. Results file at `models/component-ablation-results.json`
4. Report appended to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 15: Component Ablation (D2)`

**Required analyses:**
- For each component in system-registry.ts (22 components):
  - Retrieve all `run_component_results` for the 863 side-hustles videos
  - Compute correlation between that component's prediction/confidence and actual DPS
  - Categorize: positive contributor, neutral, negative contributor
- Leave-one-component-out analysis:
  - For each component: reconstruct VPS without that component's contribution
  - Measure Spearman of the reconstructed VPS vs actual DPS
  - Delta = baseline Spearman - ablated Spearman (positive = component helps)
- Component redundancy check:
  - Correlation matrix between all component predictions
  - Flag pairs with Pearson r > 0.85 as potentially redundant
- Per-tier component value:
  - Does a component help more for viral videos vs low-DPS videos?

**Constraints:**
- This requires querying `run_component_results` from Supabase (not the training_features table)
- Component ablation operates on the FULL pipeline output, not just XGBoost features
- Read-only: do not modify any pipeline code
- Same holdout split and contamination firewall
- Filter to side-hustles niche only

**Verification:**
- End with `### Component Recommendations` listing:
  1. Components to KEEP (positive delta > 0.01)
  2. Components to INVESTIGATE (delta between -0.01 and +0.01)
  3. Components to REMOVE or DISABLE (negative delta < -0.01)
  4. Redundant component pairs to consider merging
- Explicit note on which components have sufficient data for reliable measurement

---

## Prompt 16: Calibration Overhaul (D3)

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Replace the crude calibration multipliers with data-driven cohort-aware baselines (Decision D3). Use the error analysis from Prompt 14 to design calibration that corrects systematic biases. The current calibrator (Rule 4) compresses high-VPS predictions into the 35-60 range — verify if this is destroying signal.

**Deliverables:**
1. Updated calibration logic in `src/lib/prediction/calibrator.ts` (or new file if cleaner)
2. Before/after comparison saved to `models/calibration-comparison.json`
3. Report appended to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 16: Calibration Overhaul`

**Required analyses:**
- **Quantify Rule 4 impact:** On the 863 training set, compute:
  - Spearman of raw (pre-calibration) predictions vs actual DPS
  - Spearman of post-calibration predictions vs actual DPS
  - If Rule 4 HURTS Spearman, it's destroying signal
- **Design data-driven calibration:**
  - Using the training set, fit a monotonic calibration function: `calibrated_vps = f(raw_vps)`
  - Options: isotonic regression, Platt scaling, or simple piecewise linear
  - The function must be monotonic (higher raw → higher calibrated, always)
  - Fit on training data, evaluate on holdout (no leakage)
- **Cohort-aware baselines (D3):**
  - Compute per-creator-size-band DPS distributions from scraped_videos
  - Adjust predictions relative to the creator's cohort median
  - Compare: global calibration vs cohort-aware calibration
- **Before/after on holdout:**
  - Spearman, MAE, within-10-DPS, tier accuracy
  - For each DPS tier: mean bias before and after calibration

**Constraints:**
- Calibration function MUST be monotonic — never reorder predictions
- Fit calibration ONLY on training data, evaluate on holdout
- Do NOT change the XGBoost model or features — calibration is post-prediction adjustment only
- If the new calibration hurts holdout Spearman, do NOT deploy — keep current calibration
- Contamination firewall: no post-publication metrics in calibration inputs
- Niche-locked: side-hustles only

**Verification:**
- End with `### Should We Deploy This Calibration?`
- Decision criteria: deploy if holdout Spearman improves OR stays equal AND tier-level biases are reduced
- If Rule 4 is confirmed to destroy signal, recommend specific replacement
- If results are mixed, recommend keeping current calibration with specific per-tier adjustments

---

## Prompt 17: Retrain v8 — Integrate All Improvements

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Train XGBoost v8 integrating the best improvements from Prompts 12-16. This is the model candidate for production deployment.

**Deliverables:**
1. Python script at `scripts/train-xgboost-v8.py`
2. Model files at `models/xgboost-v8-model.json`, `xgboost-v8-scaler.json`, `xgboost-v8-features.json`, `xgboost-v8-metadata.json`
3. Comprehensive evaluation report appended to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 17: v8 Model`

**Required configuration (apply from prior prompts):**
- Hyperparameters: from Prompt 12 (if adopted) OR current locked hyperparameters
- Feature set: from Prompt 13 (if lean model adopted) OR current 72 features
- Calibration: from Prompt 16 (if deployed) OR current calibration
- Apply any component removals from Prompt 15 (if applicable)

**Required analyses:**
- Full evaluation suite: Spearman, MAE, RMSE, R2, within-5, within-10, tier accuracy
- 5-fold CV + holdout evaluation
- Feature importance ranking (top 20)
- Comparison table: v7 vs v8 on all metrics (train, holdout, CV)
- Per-tier accuracy comparison
- Overfit gap comparison (v7 gap vs v8 gap)

**Constraints:**
- Same holdout split (`models/holdout-video-ids.json`) — NEVER train on holdout
- Contamination firewall intact
- Niche-locked: side-hustles only
- Do NOT delete v7 model files — keep them for rollback
- v8 files saved alongside v7 (new filenames)

**Verification:**
- End with `### Should We Ship v8?`
- Decision matrix:

| Condition | Action |
|-----------|--------|
| v8 holdout ρ > v7 holdout ρ AND v8 CV ρ > v7 CV ρ | SHIP v8 |
| v8 CV ρ > v7 CV ρ but holdout ρ is equal/lower | DEFER — possible overfit, collect more data |
| v8 metrics worse than v7 on both CV and holdout | REVERT — keep v7, investigate why improvements didn't compound |
| Mixed results (some metrics better, some worse) | ITERATE — identify which change helped and which hurt, try selective combination |

- If shipping: update `src/lib/prediction/xgboost-inference.ts` to load v8 files
- If deferring/reverting: document why and what to try next

---

## Prompt 18: Creator-Depth Expansion + Breakout v2

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Expand per-creator video depth to enable a viable creator-relative breakout model. Prompt 10 showed breakout CV ρ=0.312 — too weak, primarily because most creators have only 2-5 videos. This prompt scrapes additional videos and retrains.

**Deliverables:**
1. Scraping script at `scripts/expand-creator-depth-prompt18.py` (or TypeScript equivalent)
2. Updated training data in Supabase `training_features` table
3. Retrained breakout model evaluation appended to `docs/TRAINING_EVAL_REPORT.md` under `## Prompt 18: Breakout v2`

**Required analyses:**
- **Data expansion:**
  - For each of the 20 side-hustles creators in the dataset: query Apify for their full video catalog
  - Target: 10+ videos per creator minimum (currently averaging ~43 per creator but unevenly distributed)
  - Run feature extraction on new videos, compute DPS from metrics
  - Add to `training_features` table
- **Breakout model retraining:**
  - Require 5+ videos per creator minimum (strict filter)
  - Creator mean computed from training split only (no holdout leakage)
  - Same 72 features, same hyperparameters (or v8 hyperparameters if adopted)
  - 5-fold CV with creator-stratified folds (all videos from one creator in same fold)
- **Breakout-specific metrics (clearly defined):**
  - Spearman of predicted breakout vs actual breakout
  - MAE of breakout prediction (in DPS points)
  - Within ±5 breakout accuracy, within ±10 breakout accuracy
  - "Breakout direction accuracy" — when model predicts positive breakout, how often is actual breakout positive? (and vice versa)
  - Per-creator Spearman (for creators with 10+ videos)

**Constraints:**
- Contamination firewall: no post-publication metrics in features (use only DPS from scraped_videos)
- New holdout: for breakout model, hold out 20% of videos PER CREATOR (not the v7 holdout which is tier-stratified)
- Do NOT modify the raw-DPS model or v7/v8 files
- Niche-locked: side-hustles only

**Verification:**
- End with `### Should We Deploy the Breakout Model?`
- Deploy criteria: CV Spearman ≥ 0.45 AND breakout direction accuracy ≥ 65%
- If criteria not met: recommend specific data requirements (e.g., "need 20+ videos per creator" or "need 50+ creators")
- If criteria met: describe how to integrate with `/api/creator/predict` alongside raw-DPS

---

## Prompt 19: Accuracy Dashboard & Monitoring

Read CLAUDE.md first.

You are working ONLY on side-hustles / making money online videos in this format:
- creator-led short-form
- talking-head knowledge content
- direct-to-camera educational shorts

**Goal:** Build a monitoring dashboard for prediction accuracy, model health, and training data progress. This makes the system's honesty observable and tracks progress toward accuracy milestones.

**Deliverables:**
1. API endpoint at `src/app/api/admin/operations/accuracy/route.ts`
2. Dashboard page at `src/app/admin/operations/accuracy/page.tsx`
3. Link added to Operations hub quick actions (`src/app/admin/operations/page.tsx`)

**Required sections on dashboard:**
- **Overview card:** Current Spearman ρ, MAE, within-10-DPS %, N labeled, model version, last evaluated
- **Scatter plot:** Predicted VPS vs Actual VPS (interactive, hover shows video ID)
- **Residual distribution:** Histogram of prediction errors, normal curve overlay
- **Tier confusion matrix:** 5x5 grid showing predicted vs actual tier counts
- **Milestone tracker:** Progress bars for 100/300/500/1000 labeled videos per niche
- **Model version history:** Table of past model versions with their key metrics (from `models/*-metadata.json`)
- **Per-creator accuracy:** Table showing Spearman per creator (for creators with 5+ labeled videos)

**Required data sources:**
- `prediction_runs` WHERE `actual_dps IS NOT NULL` (for scatter, residuals, confusion matrix)
- `vps_evaluation` table (for historical Spearman trend)
- `models/*-metadata.json` files (for model version history)
- `scraped_videos` (for milestone counts by niche)

**Constraints:**
- Follow existing admin page patterns (dark theme, Tailwind, server components where possible)
- Read-only dashboard — no mutations
- Filter by niche (default: side-hustles)
- All charts use recharts (already in project dependencies) or pure SVG
- No external chart CDNs
- Niche filter in URL params: `?niche=side-hustles`

**Verification:**
- Page loads without errors at `/admin/operations/accuracy`
- All sections render with real data from Supabase
- Scatter plot correctly plots predicted vs actual for all labeled runs
- Milestone tracker shows accurate counts
- Page is linked from Operations hub
- Test by navigating to the page and verifying all sections populated

---

## Dependency Graph

```
Prompt 10 (DONE) ─── baseline established
    │
    ├── Prompt 11 (initiative page) ─── DONE (observability layer)
    │
    ├── Prompt 12 (hyperparameters) ──┐
    │                                  │
    ├── Prompt 13 (feature selection)──┤
    │                                  ├── Prompt 17 (v8 retrain)
    ├── Prompt 14 (error analysis) ────┤        │
    │          │                       │        └── Ship decision
    │          └── Prompt 16 (calibr.) ┘
    │
    ├── Prompt 15 (component ablation D2) ── informs Prompt 17
    │
    ├── Prompt 18 (creator depth + breakout v2) ── independent track
    │
    └── Prompt 19 (accuracy dashboard) ── can run anytime after Prompt 10
```

**Parallelizable:** Prompts 12, 13, 14, 15 can run in any order or in parallel.
**Sequential:** Prompt 16 depends on Prompt 14. Prompt 17 depends on 12, 13, 15, 16.
**Independent:** Prompts 11 (done), 18, and 19 can run at any time.

---

*Last Updated: 2026-03-18 (generated from accuracy-roadmap.md, ROADMAP.md, STATE.md, Prompt 10 results)*
