# Reference/Strategy Doc Relevance Diagnostic — 2026-05-04

**Branch:** `vercel-deploy-test`
**Repo root:** `C:\Projects\CleanCopy`
**Mode:** Read-only. No file changes were made during this diagnostic.

Methodology:
- Read first 60 lines of each reference/strategy doc.
- Classified each into one of: STRATEGY, REFERENCE, PROMPT_TEMPLATE, SNAPSHOT, OTHER.
- Extracted concrete artifacts — file paths, class names, table names, API routes, external tool names, dates.
- Ran `Test-Path` for each cited file path; ran case-insensitive grep for class/concept terms across `src/`.
- Cross-checked against findings from prior inventories (PREDICTOR, FEAT_DOCS, INNOVATION_DOCS) and MEMORY.md.
- Verdict scale: **CURRENT** / **REFERENCE_KEEP** / **DATED** / **UNCLEAR**. Verdicts are recommendations only.

---

## Verdict table (sorted DATED → UNCLEAR → REFERENCE_KEEP → CURRENT)

| Filename | Type | Stated purpose (1 line) | Code matches | Verdict | Evidence summary |
|----------|------|--------------------------|--------------|---------|------------------|
| UNIVERSAL_REASONING_ARCHITECTURE.md | STRATEGY | Design for a "Universal Reasoning System" with single `/api/reason` entry point, sitting above 11 frameworks + 4 ML models + 662 endpoints | `/api/reason` route MISSING. `UniversalReasoning` class not found in src/. Only `/api/donna/reason` exists (a different system). | DATED | Doc dated November 6, 2025, status "Design Complete - Ready for Implementation." The design was not implemented under that name. Current orchestration is via `kai-orchestrator.ts` (not `/api/reason`). The cited "11 frameworks, 662 endpoints" inventory is also now superseded by recent inventories. |
| Trendzo Development Plan - 14-Day Sprint to Launch.md | STRATEGY | 14-day aggressive sprint plan to launch Superadmin Control Center + Limited User Platform | Tables `limited_users`, `success_stories`, `marketing_campaigns` are alive in code (41 occurrences across 20 files: limited-users routes, success-tracking routes, inception-studio, mission-control, etc.). | DATED | Time-bound sprint plan. The infrastructure it described was largely built (limited_users + success_stories + inception-studio surfaces all exist). The doc itself is a moment-in-time plan; its substance lives on in the code that resulted. |
| Trendzo Viral Prediction Platform - Master Implementation Prompt.md | PROMPT_TEMPLATE / STRATEGY | The build prompt that originally drove Trendzo's two-tier (Superadmin + Limited User) implementation | Same tables (`limited_users`, `user_analytics`, `success_stories`, `marketing_campaigns`) alive in code. | DATED | The prompt drove the build. The build happened. The prompt artifact has historical value but is not actively driving current work. CLAUDE.md is now the operating system for AI agents; this doc is its predecessor. |
| KAI_FEATURE_EXPANSION_PLAN.md | STRATEGY | Plan to expand Kai feature set from 119 → 153 features (FFmpeg + video styles + frameworks + 9 attributes) | `models/feature-names.json` EXISTS, `src/lib/services/ffmpeg-service.ts` EXISTS, `src/lib/frameworks/video-styles-24.ts` EXISTS. The cited paths are real. | DATED | Plan starts from "119 features, XGBoost trained on 152 videos." Per MEMORY.md the current production model is XGBoost v15 (with v16 tested 2026-04-21 and not promoted). SYSTEM_STATE.md shows v9 had 51 features and 863 training videos. The 119-feature baseline this expansion plan starts from no longer matches the live model. The expansion concepts remain valid but the numerical anchor is stale. |
| SYSTEM_STATE.md | SNAPSHOT | "Updated at the end of every session. Fed to Cursor/Claude Code at the start of every session." | "Last updated 2026-03-19" header. Says XGBoost v9 (51 features, 863 training videos). | DATED | Per MEMORY.md, current model is **v15** (with v16 tested 2026-04-21, did NOT beat v15). The doc states v9. Roughly 7 weeks stale. The template structure (Last Session / Tech Debt Queue / Capability Prerequisite Map / Active Feature Flags) is potentially useful as a recurring artifact, but this specific snapshot is out of date. |
| BLOOMBERG_TERMINAL_BUILD.md | SNAPSHOT | Build progress doc for "Bloomberg Terminal" (Phase 1A complete) | Cited path `src/app/bloomberg/page.tsx` MISSING. The actual implementation is at `src/app/admin/bloomberg/page.tsx` (path moved under `admin/`). | DATED | Phase 1A "complete" snapshot. The build moved to a different path (now under `admin/bloomberg/`). Doc's specific file paths are stale; the concept lives on. |
| viral-prediction-api-analysis.md | SNAPSHOT | Mock-vs-real-data audit of viral-prediction API endpoints (Nov 2025) | The 6 endpoints it analyzes all still exist (`/api/admin/viral-prediction/pipeline-status`, `/accuracy-validation`, `/daily-recipe-book`, `/api/admin/apify-scrapers/scheduler`, `/api/admin/script-intelligence/status`, `/api/admin/framework-evolution/run`). | DATED | Snapshot from November 2025. The endpoints still exist; their mock-vs-real ratios may have shifted since the audit. Useful as historical context for which surfaces had gaps then; not authoritative for current state. |
| LOVABLE_DEV_PROMPT_V1.md | PROMPT_TEMPLATE | Build prompt for Lovable.dev (external no-code tool) describing the TikTok viral prediction system | Tech stack listed (Next.js 14, Supabase, XGBoost, GPT-4) matches current Trendzo, but the doc is targeted at Lovable.dev as the build environment. | DATED | Trendzo is built directly in Next.js / Supabase, not via Lovable.dev. This prompt is an artifact from an evaluation of an alternative build path. Specific numbers ("119 features", "trained on 116 videos", "R² = 0.970") are stale. |
| LOVABLE_DEV_PROMPT_V1_GENERIC.md | PROMPT_TEMPLATE | Generic-version Lovable.dev build prompt (industry-agnostic "Social Media Content Analysis Platform") | Doc is a sanitized clone of LOVABLE_DEV_PROMPT_V1, generalized for non-TikTok domains. | DATED | Same logic as above. Useful only if Tommy intends to repackage the prompt for an outside audience. |
| unicorn-workflow-ui-prompt.md | PROMPT_TEMPLATE | UI design prompt using "BMAD Methodology" for a "Progressive Magic" workflow with DNA helix animations and 3-mode interface (Express / Guided / Expert) | Concepts (mode selection, DNA helix, viral score counter) referenced in code only loosely; the specific UI described is not the current production interface. | DATED | Aspirational UI concept. The current Trendzo UI doesn't match this design (no DNA-helix hero animation, no Express/Guided/Expert mode selector as described). Useful if Tommy ever wants to revisit UI direction; not driving current screens. |
| GPT context video explaining GPTs 10-7-25.md | OTHER | Transcript of an educational video explaining what GPTs / transformers are (general AI background) | No project-specific code references. Pure educational content (attention mechanism, transformers, "Massachusetts is a state in the New England region..." example). | DATED | Generic ML/AI explainer transcript. Not project-specific reference material. The date (10-7-25) and informal nature ("This stuff is truly hot off the presses") suggest it was saved as personal context. Adds no signal to development work. |
| methodology pack.md | REFERENCE / PROMPT_TEMPLATE | "Methodology Pack v2.1" — a generic methodology framework (Objective→Capability→Feature→Workflow→UI→Data→API→NFR→Tests→Rollout) with templates | Naming convention from this doc (`OBJ-##`, `CAP-###`, `FEAT-###`, `EVT.*`, `FF-*`) appears throughout the FEAT-XXX docs. Referenced explicitly by FEAT-003-IMPLEMENTATION-SUMMARY.md as "Methodology: Methodology Pack v2.1". | REFERENCE_KEEP | Timeless methodology reference. Frames how features are spec'd in this codebase (the FEAT-XXX prefix system, OBJ-/CAP- traceability). Should remain accessible as the conventions doc. Could move to a `docs/reference/` location if Tommy wants the root cleaner. |
| new viral frameworks 8-8-25.md | REFERENCE | "Social Media Growth Framework Compendium (v2.0)" — 61-framework collection with DPS overview and platform-specific metrics | DPS formula in doc (`Viral_Score = (View_Count / Cohort_Median) × Platform_Weight × Decay_Factor`) maps directly to the DPS implementation in `src/lib/training/dps-v2.ts`. The 61-framework compendium is referenced from KAI_FEATURE_EXPANSION_PLAN.md and other strategy docs. | REFERENCE_KEEP | Date-stamped (2025-08-08) but the content is timeless content-strategy reference material — viral framework playbooks. The DPS section is the canonical framing of the algorithm Trendzo's pipeline implements. Worth preserving as content reference. |
| LIVE_REUSE_MAP.md | REFERENCE | Production component reuse map for the "LIVE Starter Pack Path" (no new atoms, only variants) | All sampled paths verified EXIST: `MasterNavigation.tsx`, `ScriptIntelligenceDashboard.tsx`, `/api/admin/script-intelligence/route.ts`, `ViralVideoGallery.tsx`, `useFeature.ts`, `flags/evaluator.ts`, `windowStore.ts`, `workflowStore.ts`, `_services/exports.ts`. | REFERENCE_KEEP | Component reuse inventory. Useful when adding similar features — tells future-Tommy "these primitives already exist, don't rebuild them." Concrete and accurate vs. current code. |
| SANDBOX_REUSE_MAP.md | REFERENCE | Sandbox component reuse for the "Viral Quick-Win Workflow" — same reuse-first principle | Sampled paths verified EXIST: `(dashboard)/layout.tsx`, `admin/layout.tsx`, `viral-lab-v2/layout.tsx`, `TemplateGrid.tsx`, `ScriptIntelligenceDashboard.tsx`. Identifies known gaps (Drawer, Breadcrumb, Confusion Matrix, Teleprompter). | REFERENCE_KEEP | Same character as LIVE_REUSE_MAP — a reuse inventory plus a list of known gaps. Concrete and useful. |
| MASTER_ALGORITHM_DOCUMENTATION.md | REFERENCE / STRATEGY | "Kai Viral Prediction Algorithm — Master Documentation" — 19-component patent-grade documentation | Already verified LIVELY in INNOVATION_DOCS_RELEVANCE: `kai-orchestrator.ts` exists (4984 lines, 13 importers), `system-registry.ts` exists, `/api/algorithm/explain` exists. Cross-referenced from PATENTABLE_ALGORITHM_COMPLETE.md with line-range citations that all check out. | CURRENT | Most authoritative algorithm reference doc in the repo. Maps directly to current code. Should remain at root. |
| Product Requirements Document- Trendzo Viral Prediction Platform.md | STRATEGY | Trendzo PRD: viral prediction platform, "inception marketing" strategy, Superadmin + Limited User personas, 11 modules | Tables/concepts from the PRD are heavily implemented: `limited_users` routes (5 admin routes), `success_stories` routes (3 admin routes), `inception-studio` page + campaigns route, `mission-control/metrics`, `/api/user/analyze`. 41 grep matches across 20 files. | CURRENT | Foundational product doc. The product direction described (inception marketing, two-tier access, accuracy proof loop) is the direction the running code actually implements. Specific UI metrics in the doc (e.g., "Dashboard loads in <2 seconds") may have drifted but the product shape matches. |
| SUBSTRATE_FRAMEWORK.md | STRATEGY / REFERENCE | "Trendzo Substrate Framework" — primitive-thinking model: prediction is the technical primitive, status is the brand primitive | Concepts referenced are alive: `platform_events` + `emitEvent()` (64 occurrences across 20 files), DPS/VPS terminology matches MEMORY.md, "The Pulse / Studio / Pattern Extraction" surfaces are real. MEMORY.md has an active "Substrate Pivot Deal" entry tying back to this framing. | CURRENT | Strategic framing doc that's currently load-bearing. The "compounding test" and "feature selection filters" appear to be how Tommy decides what to build. Active operating-system-level document. |
| PATTERN_ARCHITECTURE_ANALYSIS.md | REFERENCE / SNAPSHOT | Architecture analysis of pattern-related subsystems (FEAT-003 Pattern Extraction + Script Pattern Definitions + Pre-Content Pattern Matching) | All 9 cited pattern-extraction files exist at `src/lib/services/pattern-extraction/`. Cross-checked in FEAT_DOCS_RELEVANCE_2026-05-04.md as PARTIAL/LIVELY for FEAT-003. The 4 cited DB tables (viral_patterns, pattern_video_associations, pattern_extraction_jobs, pattern_extraction_errors) are heavily referenced (22+ files). | CURRENT | Dated November 3, 2025 but every cited path/table still exists. Accurate snapshot of pattern architecture as of that date — and that architecture hasn't materially changed. Can stay at root or move to a reference folder. |

---

## Totals per verdict

| Verdict | Count |
|---------|------:|
| DATED | 11 |
| UNCLEAR | 0 |
| REFERENCE_KEEP | 4 |
| CURRENT | 4 |
| **Total** | **19** |

---

## DATED verdicts — strongest single piece of evidence each

For each of the 11 DATED docs, the strongest piece of evidence Tommy can sanity-check before treating as archive-candidate:

1. **UNIVERSAL_REASONING_ARCHITECTURE.md** — `Test-Path C:\Projects\CleanCopy\src\app\api\reason\route.ts` returns false. The doc's central deliverable (a single `/api/reason` endpoint) was never built. The closest match in the codebase is `/api/donna/reason`, which is a different system.

2. **Trendzo Development Plan - 14-Day Sprint to Launch.md** — The doc title literally specifies "14-Day Sprint." That sprint clearly ran (its tables `limited_users`, `success_stories`, etc. exist in code). A 14-day plan from a past launch is by definition a moment-in-time artifact.

3. **Trendzo Viral Prediction Platform - Master Implementation Prompt.md** — This is "the prompt that built the platform." CLAUDE.md is now the operating system for AI agents working on this codebase; this prompt is its ancestor. The product it specified is now built.

4. **KAI_FEATURE_EXPANSION_PLAN.md** — Doc opens with: "**119 text-only features**, XGBoost model trained on **152 videos**, Test R²: 0.94." Per MEMORY.md the current production model is **XGBoost v15** with v16 tested (and rejected) on 2026-04-21. SYSTEM_STATE.md (also DATED) shows v9 had 51 features and 863 training videos. The 119/152 baseline this plan starts from is two model generations and ~700 videos out of date.

5. **SYSTEM_STATE.md** — Header says "Last updated: 2026-03-19" and "Current model: XGBoost v9." Per MEMORY.md, current model is **v15** (and v16 was tested 2026-04-21 and not promoted). Roughly 7 weeks of drift, two model versions out of date.

6. **BLOOMBERG_TERMINAL_BUILD.md** — Doc cites `src/app/bloomberg/page.tsx` as the file created. `Test-Path` returns false. The actual implementation moved to `src/app/admin/bloomberg/page.tsx`. The doc's path references are stale.

7. **viral-prediction-api-analysis.md** — Dated material from November 2025 audit of mock-vs-real data ratios. The 6 endpoints it audits all still exist, but the mock/real ratios cited are point-in-time numbers that almost certainly have shifted.

8. **LOVABLE_DEV_PROMPT_V1.md** — Doc is targeted at building Trendzo via Lovable.dev (no-code tool). Trendzo is built directly in Next.js. The build environment Lovable.dev specified is not the one in use. The numerical anchors ("116 training videos", "R² = 0.970") match the same era as KAI_FEATURE_EXPANSION_PLAN.md.

9. **LOVABLE_DEV_PROMPT_V1_GENERIC.md** — Same as above, sanitized for non-TikTok domains. Same DATED logic applies.

10. **unicorn-workflow-ui-prompt.md** — Describes "Progressive Magic" workflow with DNA helix animation and Express/Guided/Expert mode selector. The current Trendzo UI does not match this design. Aspirational UI exploration, not driving current screens.

11. **GPT context video explaining GPTs 10-7-25.md** — Pure ML/AI educational content (attention, transformers, "Massachusetts is a state in the New England region..."). Filename literally describes itself as a video transcript. No project-specific signal. Stray reference doc.

---

## UNCLEAR verdicts — what would need to be checked

None. Every doc had at least one concrete artifact (cited file path, table name, class name, API route, external tool name, or explicit date) that resolved its status.

---

## Read-only observations (things that surprised me)

1. **The "inception marketing" PRD theme is heavily realized in code.** When I ran the table grep, `limited_users` / `success_stories` / `marketing_campaigns` / `inception` showed up across 20 files including dedicated admin routes (`/api/admin/limited-users/*`, `/api/admin/success-tracking/*`, `/api/admin/inception-studio/campaigns`) and a dedicated admin UI page (`/admin/inception-studio`). The PRD reads like aspirational planning, but the code reads like the plan was substantially executed.

2. **The Substrate framing is alive in MEMORY.md.** `SUBSTRATE_FRAMEWORK.md` describes "the prediction" as the technical primitive and "Event Spine / `platform_events` / `emitEvent()`" as the unlock. The grep confirms `emitEvent` is referenced 64+ times across 20+ files — that infrastructure was built. MEMORY.md has an active "Substrate Pivot Deal" workstream tying back to this same primitive thinking. The doc isn't aspirational; it's the active operating model.

3. **The `methodology pack.md` is verbatim a ChatGPT 5 transcript** (opens with "Initial prompt…" and "ChatGPT 5 Thinking response…"). It then yields "Methodology Pack v2.1" which uses the OBJ-/CAP-/FEAT-/UF-/SF- naming convention that every FEAT-XXX doc in the repo follows. The doc is the source of the convention. That makes it foundational reference material despite its informal transcript format.

4. **`SYSTEM_STATE.md` has a self-described purpose that the file is no longer fulfilling.** Its first line says "Updated at the end of every session. Fed to Cursor/Claude Code at the start of every session." But it hasn't been updated since 2026-03-19, and the canonical session state is now MEMORY.md's "ACTIVE COMMITMENTS" block at the top. The intended-cadence file fell out of cadence.

5. **Two near-duplicate Lovable.dev prompts (V1 + V1_GENERIC).** Same purpose, one TikTok-specific and one generalized. Suggests Tommy was at one point evaluating whether to externalize the Trendzo prompt for resale or generalization. The V1_GENERIC file may be the more reusable artifact if that ever resurfaces.

6. **`new viral frameworks 8-8-25.md` is 108 KB** — the largest reference doc at root. Its DPS formula (line 16, `Viral_Score = (View_Count / Cohort_Median) × Platform_Weight × Decay_Factor`) is the canonical formulation that `src/lib/training/dps-v2.ts` implements. If Tommy ever needs to defend the DPS algorithm to a reviewer or licensee, this is the source-of-truth reference for the formula.

7. **`MASTER_ALGORITHM_DOCUMENTATION.md` and `PATENTABLE_ALGORITHM_COMPLETE.md` are paired** — the former is the master spec, the latter is the patent-claims summary. Both reference `kai-orchestrator.ts` line ranges that exist. The pair forms the IP-defensible documentation set.

8. **`LIVE_REUSE_MAP.md` and `SANDBOX_REUSE_MAP.md` are practical companion docs** — same author voice, same "reuse-first" thesis, different scopes (production vs. sandbox). Worth keeping together if either is moved.

9. **`KAI_FEATURE_EXPANSION_PLAN.md` is interesting because the *plan* is dated but the *cited paths still exist*.** `models/feature-names.json`, `ffmpeg-service.ts`, `video-styles-24.ts` are all real files. The document is a planning artifact whose substrate is intact — only the numerical baseline (119 features, 152 training videos) is stale. If Tommy ever wanted to revive a feature-expansion sprint, this doc could be salvaged as a starting outline rather than discarded.

10. **The `GPT context video explaining GPTs 10-7-25.md` file is the clearest stray** — it's an educational transcript with no project-specific signal. If anything in Section C (the "ambiguous" bucket from ROOT_MARKDOWN_INVENTORY) is a candidate for a "general references" subfolder rather than the repo root, this is it.

— end of diagnostic —
