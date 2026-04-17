# SYSTEM_STATE.md

> Updated at the end of every session. Fed to Cursor/Claude Code at the start of every session.

**Last updated:** 2026-03-19
**Platform status:** Pre-launch
**Stack:** Next.js / React / Supabase
**Hierarchy:** Chairman → Admin → Agency → User
**Current model:** XGBoost v9 — CV Spearman 0.6497, Holdout Spearman 0.8002, 51 features, 863 training videos (side-hustles niche)

---

## Current Focus

Stabilize the prediction pipeline — fix broken features and add low-hanging-fruit signals before building any new surfaces.

---

## Last Session

| Field | Value |
|-------|-------|
| Date | 2026-03-19 |
| What was built | XGBoost v9 trained and deployed. 3 new validated features (text_overlay_density r=0.442, visual_proof_ratio r=0.222, vocal_confidence_composite r=0.076). Backfilled 963 videos via Wave 1 + Wave 2 Gemini Vision. Wired v9 into prediction pipeline (xgboost-inference.ts, extract-prediction-features.ts, runPredictionPipeline.ts). |
| What's half-done | 4 features returning n=0: specificity_score, hedge_word_density, instructional_density, visual_to_verbal_ratio — transcript extraction failed. Initiative Intelligence page route.ts needs 3 fixes. |
| Decisions made | Validating methodology on side-hustles niche first before expanding to 20 niches. Used Gemini Vision for frame classification (10hr one-time cost, acceptable). |
| Next session starts with | Fix the 4 broken n=0 features (transcript extraction). This is highest priority because broken features degrade model accuracy and block the next retrain. |

---

## Active Feature Flags

| Flag Name | Status | Tier Access | Notes |
|-----------|--------|-------------|-------|
| xgboost_v9 | enabled | Chairman | Production model, wired into prediction pipeline |

---

## Tech Debt Queue

| Location | Description | Priority | Date Tagged |
|----------|-------------|----------|------------|
| src/app/api/admin/operations/initiative/route.ts | Initiative Intelligence page needs 3 fixes (see task prompt) | M | 2026-03-19 |
| Feature extraction pipeline | 4 features returning n=0 due to transcript extraction failure: specificity_score, hedge_word_density, instructional_density, visual_to_verbal_ratio | H | 2026-03-19 |

---

## Capability Prerequisite Map

> Format: "If I build X → Y and Z become trivial"

| Prerequisite (X) | What it unlocks (Y, Z) | Status |
|-------------------|----------------------|--------|
| Fix transcript extraction for n=0 features | Next retrain with 55 features, specificity/instructional signals improve tier accuracy | Blocked |
| Add creator + distribution signals (follower count, posting hour, sound trend) | v10 retrain with richer signal set, all data already in scraped_videos table | Not started |
| Event Spine (`platform_events` + `emitEvent()`) | Activity feeds, Feedback Loop, trigger-based notifications, analytics | Not started |
| Prediction object lifecycle (draft → computed → delivered → verified) | Pattern Extraction, Feedback Loop, score history, render contracts | Not started |
| Feature flags table + `useFlag()` hook | Per-tier rollout, A/B testing surfaces, controlled launch | Not started |

---

## Architecture Primitives Status

| Primitive | Status | Notes |
|-----------|--------|-------|
| Event Spine (`platform_events` + `emitEvent()`) | Not started | |
| Prediction Object (lifecycle: draft → computed → delivered → verified) | Not started | Pipeline exists but no formal lifecycle |
| Render Contracts | Not started | |
| Feature Flags (`feature_flags` table + `useFlag()`) | Not started | Using ad-hoc flags, no system |
| Zod schemas at data boundaries | Not started | |

---

## Key Files Reference

| Area | File |
|------|------|
| Prediction inference | src/lib/prediction/xgboost-inference.ts |
| Feature extraction | src/lib/prediction/extract-prediction-features.ts |
| Training extraction | src/lib/training/feature-extractor.ts |
| Prediction pipeline | src/lib/prediction/runPredictionPipeline.ts |
| Initiative page API | src/app/api/admin/operations/initiative/route.ts |
| Backfill script | scripts/backfill-new-features.ts |
| Validation script | scripts/validate-new-features.ts |
| Production model | models/xgboost-v9-* |
| Feature backlog | docs/NEXT_FEATURE_QUEUE.md |
| Validation results | docs/FEATURE_VALIDATION_REPORT.md |
| Retrain report | docs/RETRAIN_REPORT_REAL.md |