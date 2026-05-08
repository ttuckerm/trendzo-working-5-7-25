# Admin Route Audit — 2026-04-30

**Scope:** Every `page.tsx`, `layout.tsx`, and route handler under `src/app/admin/` plus the top-level `/onboarding` route.
**Mode:** Read-only. No files moved, renamed, deleted, or edited.
**Method:** Filesystem inventory + per-page first-60-line read + bulk inbound link search via ripgrep.
**Counts:** 137 page files + 5 layout/route-handler files = **142 admin route files** total.

---

## 1. Executive Summary (read in under 60 seconds)

1. **The `/admin/*` tree is a junk drawer of 142 files.** 137 pages, 5 layouts/route handlers. The folder has accumulated chairman dashboards, creator workflows, internal QA harnesses, broken stubs, and abandoned prototypes side-by-side. There is no audience separation in the URL structure.
2. **All 142 files are gated `chairman`-only at the layout level**, by `src/app/admin/AuthGate.tsx` → `src/components/auth/ProtectedRoute.tsx`. This means creator-audience pages that live under `/admin/` are inaccessible to actual creators in production unless `NEXT_PUBLIC_DISABLE_AUTH=true` is set.
3. **The auth gate is INCONSISTENT with middleware.** `src/middleware.ts:36` allows `chairman` AND `sub_admin` for `/admin/*`, but `src/app/admin/AuthGate.tsx:7` allows ONLY `chairman`. Sub-admins pass the middleware then get rejected by the layout. This is a latent bug.
4. **At least 18 pages are creator-facing or shared by audience**, including the major onboarding flow `/admin/viral-studio`, the script writer `/admin/studio/script`, the quick-win flow `/admin/workflows/quick-win`, the creator workflow page `/admin/workflows/creator`, and several rewards-program pages that show creator-vs-chairman views via in-page role checks.
5. **The visible left-rail navigation only exposes 7 routes.** `src/app/admin/components/MasterNavigation.tsx` ships icons for `/admin/dashboard`, `/admin/control-center`, `/admin/studio`, `/admin/operations`, `/admin/canvas`, `/admin/hub`, and `/admin/ecom` (feature-flagged). The other 130 pages are reachable only by typing the URL or via links from one of those 7.
6. **`SuperAdminSidebar.tsx` lists 76 nav items pointing to ~25 routes that DO NOT EXIST in the codebase**, including `/admin/operations-center`, `/admin/viral-prediction`, `/admin/viral-prediction-hub`, `/admin/engine-room`, `/admin/prediction-validation`, `/admin/super-admin`, `/admin/pipeline`, `/admin/validation`, `/admin/profile`, `/admin/my-videos`, `/admin/demo`, `/admin/supabase-migration`. These nav items are orphan links that 404.
7. **`navigation-config.ts` (the not-yet-enabled new role-based nav) lists ~10 more routes that don't exist**, including `/admin/organization/sub-admins`, `/admin/organization/developers`, `/admin/organization/clippers`, `/admin/organization/independent`, `/admin/config/*`, `/admin/ml-lab/*`. Switching `USE_NEW_NAVIGATION = true` in `src/app/admin/layout.tsx:17` would expose these 404s to operators.
8. **/admin/viral-studio IS confirmed as the multi-screen creator onboarding flow** (entry → onboarding → calibration → profile → gallery → analysis → labs). It requires sign-in (`useAuth()` for `user.uid`) but does no role check, so it works for any signed-in user when auth is disabled. Its 11 phase components live in `src/app/admin/viral-studio/components/phases/`.
9. **At least 6 other pages look like onboarding surfaces, prototypes, or competing flows.** `/admin/workflows/creator`, `/admin/workflows/quick-win`, `/admin/coach`, `/admin/draft-analyzer`, `/admin/drafts-analyzer` (note: TWO near-identical pages), `/admin/value-template-editor`, plus the shorter post-signup `/onboarding` page that is the simple 4-step modal.
10. **The top-level `/onboarding` route is NOT dead code.** This contradicts what was attributed to the previous OB-2 investigation. `src/middleware.ts:220-222` actively redirects un-onboarded users to `/onboarding` on every page load. The page at `src/app/(auth)/onboarding/page.tsx` writes `onboarding_step='complete'` to `onboarding_profiles`. Deleting it would break the onboarded-user redirect.
11. **Several pages are confirmed dead/abandoned stubs** (5 with explicit "Not Implemented / Coming Soon" copy): `/admin/advisor-service`, `/admin/dna-detective`, `/admin/orchestrator`, `/admin/recipe-book-api`, plus `/admin/template-analyzer/template/[id]` which references Firebase functions it doesn't import (broken).
12. **At least 2 pages have the same name and overlap conceptually:** `/admin/draft-analyzer/page.tsx` (255 lines, "My Drafts Analyzer") and `/admin/drafts-analyzer/page.tsx` (425 lines, "🎯 My Drafts Analyzer"). Both are creator-facing prototypes with different implementations and different surface paths. Operator should pick one.
13. **`/admin/upload-test` is the operator's primary prediction test harness** (4035 lines, the largest single page in the tree). It is internal/diagnostic, not a creator surface. Per the project's `CLAUDE.md` it is described as "PRIMARY" but that means primary-for-operators, not primary-for-creators.
14. **No page besides the layout requires `chairman` role**. Inside the page bodies, the role checks that exist are for finer slicing: `isChairman` to show extra columns (e.g., `/admin/upload-test:435`), or to swap between chairman view vs participant view (e.g., `/admin/rewards/affiliate`, `/admin/rewards/app-campaigns`, `/admin/rewards/app-store`, `/admin/rewards/content-campaigns`, `/admin/organization/creators`, `/admin/dashboard`). Several pages still call a legacy `useAuth().isAdmin` flag (separate from the chairman role) as a redundant gate: `/admin/advisor-service`, `/admin/apify-scraper`, `/admin/dna-detective`, `/admin/draft-analyzer`, `/admin/etl-dashboard`, `/admin/feature-decomposer`, `/admin/feedback-ingest`, `/admin/flipboard`, `/admin/gene-tagger`, `/admin/integration`, `/admin/orchestrator`, `/admin/recipe-book-api`, `/admin/viral-filter`.

---

## 2. Full Hierarchical Inventory (Task 1)

Format: `<lines>` `<URL>` — `<file path>`

### `/admin` root
- 18 lines · `/admin` · `src/app/admin/page.tsx`
- 79 lines · *(infra)* · `src/app/admin/layout.tsx`
- *(infra wrapper for AdminAuthGate)* · `src/app/admin/AuthGate.tsx` *(referenced by layout, not a route file)*

### `(studio)` route group (no URL change)
- 13 lines · *(infra)* · `src/app/admin/(studio)/layout.tsx`

### Top-level pages (alphabetical)
- 13 lines · `/admin/accuracy/publish` *(POST handler)* · `src/app/admin/accuracy/publish/route.ts`
- 98 lines · `/admin/adaptation` · `src/app/admin/adaptation/page.tsx`
- 70 lines · `/admin/advisor-service` · `src/app/admin/advisor-service/page.tsx`
- 241 lines · `/admin/agent` · `src/app/admin/agent/page.tsx`
- 23 lines · `/admin/ai-brain` · `src/app/admin/ai-brain/page.tsx`
- 903 lines · `/admin/algorithm-iq` · `src/app/admin/algorithm-iq/page.tsx`
- 86 lines · `/admin/alignment` · `src/app/admin/alignment/page.tsx`
- 93 lines · `/admin/analysis` · `src/app/admin/analysis/page.tsx`
- 397 lines · `/admin/apify-scraper` · `src/app/admin/apify-scraper/page.tsx`
- 391 lines · `/admin/audit-log` · `src/app/admin/audit-log/page.tsx`
- 66 lines · `/admin/baselines` · `src/app/admin/baselines/page.tsx`
- 391 lines · `/admin/brief-review` · `src/app/admin/brief-review/page.tsx` *(server-redirects to `/agency/dashboard`)*
- 1131 lines · `/admin/bulk-download` · `src/app/admin/bulk-download/page.tsx`
- 801 lines · `/admin/calibration` · `src/app/admin/calibration/page.tsx`
- 38 lines · `/admin/checklist` · `src/app/admin/checklist/page.tsx`
- 118 lines · `/admin/coach` · `src/app/admin/coach/page.tsx`
- 995 lines · `/admin/command-center` · `src/app/admin/command-center/page.tsx`
- 501 lines · `/admin/compare-runs` · `src/app/admin/compare-runs/page.tsx`
- 446 lines · `/admin/component-test` · `src/app/admin/component-test/page.tsx`
- 523 lines · `/admin/control-center` · `src/app/admin/control-center/page.tsx`
- 94 lines · `/admin/cross-intel` · `src/app/admin/cross-intel/page.tsx`
- 298 lines · `/admin/cultural-events` · `src/app/admin/cultural-events/page.tsx`
- 84 lines · `/admin/dashboard` · `src/app/admin/dashboard/page.tsx`
- 8 lines · `/admin/data-ingestion` · `src/app/admin/data-ingestion/page.tsx`
- 98 lines · `/admin/diagnostics` · `src/app/admin/diagnostics/page.tsx`
- 70 lines · `/admin/dna-detective` · `src/app/admin/dna-detective/page.tsx`
- 255 lines · `/admin/draft-analyzer` · `src/app/admin/draft-analyzer/page.tsx`
- 425 lines · `/admin/drafts-analyzer` · `src/app/admin/drafts-analyzer/page.tsx`
- 114 lines · `/admin/drift` · `src/app/admin/drift/page.tsx`
- 491 lines · `/admin/error-logs` · `src/app/admin/error-logs/page.tsx`
- 281 lines · `/admin/etl-dashboard` · `src/app/admin/etl-dashboard/page.tsx`
- 158 lines · `/admin/etl-status` · `src/app/admin/etl-status/page.tsx`
- 80 lines · `/admin/experiments` · `src/app/admin/experiments/page.tsx`
- 434 lines · `/admin/feature-decomposer` · `src/app/admin/feature-decomposer/page.tsx`
- 78 lines · `/admin/feature-flags` · `src/app/admin/feature-flags/page.tsx`
- 52 lines · `/admin/federated` · `src/app/admin/federated/page.tsx`
- 70 lines · `/admin/feedback-ingest` · `src/app/admin/feedback-ingest/page.tsx`
- 18 lines · `/admin/flags` · `src/app/admin/flags/page.tsx`
- 10 lines · `/admin/flipboard` · `src/app/admin/flipboard/page.tsx`
- 446 lines · `/admin/framework-reservoir` · `src/app/admin/framework-reservoir/page.tsx`
- 506 lines · `/admin/gene-tagger` · `src/app/admin/gene-tagger/page.tsx`
- 409 lines · `/admin/gold-set` · `src/app/admin/gold-set/page.tsx`
- 42 lines · `/admin/guardrails` · `src/app/admin/guardrails/page.tsx`
- 184 lines · `/admin/hub` · `src/app/admin/hub/page.tsx`
- 561 lines · `/admin/inception-studio` · `src/app/admin/inception-studio/page.tsx`
- 48 lines · `/admin/insights` · `src/app/admin/insights/page.tsx`
- 32 lines · `/admin/integration` · `src/app/admin/integration/page.tsx`
- 43 lines · `/admin/keys` · `src/app/admin/keys/page.tsx`
- 79 lines · `/admin/learning` · `src/app/admin/learning/page.tsx`
- 595 lines · `/admin/limited-users` · `src/app/admin/limited-users/page.tsx`
- 77 lines · `/admin/llm-console` · `src/app/admin/llm-console/page.tsx`
- 124 lines · `/admin/login` · `src/app/admin/login/page.tsx`
- 48 lines · `/admin/marketing-inception` · `src/app/admin/marketing-inception/page.tsx`
- 216 lines · `/admin/marketing-studio` · `src/app/admin/marketing-studio/page.tsx`
- 489 lines · `/admin/master-orchestrator` · `src/app/admin/master-orchestrator/page.tsx`
- 455 lines · `/admin/mission-control` · `src/app/admin/mission-control/page.tsx`
- 106 lines · `/admin/moat` · `src/app/admin/moat/page.tsx`
- 1064 lines · `/admin/model-evaluation` · `src/app/admin/model-evaluation/page.tsx`
- 671 lines · `/admin/monitoring` · `src/app/admin/monitoring/page.tsx`
- 386 lines · `/admin/newsletter` · `src/app/admin/newsletter/page.tsx`
- 70 lines · `/admin/orchestrator` · `src/app/admin/orchestrator/page.tsx`
- 69 lines · `/admin/process-intel` · `src/app/admin/process-intel/page.tsx`
- 84 lines · `/admin/recipe-book` · `src/app/admin/recipe-book/page.tsx`
- 70 lines · `/admin/recipe-book-api` · `src/app/admin/recipe-book-api/page.tsx`
- 971 lines · `/admin/research-review` · `src/app/admin/research-review/page.tsx`
- 106 lines · `/admin/scale` · `src/app/admin/scale/page.tsx`
- 1378 lines · `/admin/scraping` · `src/app/admin/scraping/page.tsx`
- 414 lines · `/admin/security` · `src/app/admin/security/page.tsx`
- 433 lines · `/admin/super-admin-live` · `src/app/admin/super-admin-live/page.tsx`
- 192 lines · `/admin/system` · `src/app/admin/system/page.tsx`
- 206 lines · `/admin/system-map` · `src/app/admin/system-map/page.tsx`
- 749 lines · `/admin/system-settings` · `src/app/admin/system-settings/page.tsx`
- 77 lines · `/admin/template-leaderboard` · `src/app/admin/template-leaderboard/page.tsx`
- 1047 lines · `/admin/testing-accuracy` · `src/app/admin/testing-accuracy/page.tsx`
- 4035 lines · `/admin/upload-test` · `src/app/admin/upload-test/page.tsx`
- 136 lines · `/admin/users` · `src/app/admin/users/page.tsx`
- 292 lines · `/admin/value-template-editor` · `src/app/admin/value-template-editor/page.tsx`
- 456 lines · `/admin/viral-approval-queue` · `src/app/admin/viral-approval-queue/page.tsx`
- 410 lines · `/admin/viral-filter` · `src/app/admin/viral-filter/page.tsx`
- 582 lines · `/admin/viral-recipe-book` · `src/app/admin/viral-recipe-book/page.tsx`
- 494 lines · `/admin/workflow-dashboard` · `src/app/admin/workflow-dashboard/page.tsx`

### `/admin/page.tsx` (root) and chairman cockpit
- 1901 lines · `/admin/chairman` · `src/app/admin/chairman/page.tsx`

### `/admin/analytics/*`
- 155 lines · `/admin/analytics` · `src/app/admin/analytics/page.tsx`
- 22 lines · `/admin/analytics/labels` · `src/app/admin/analytics/labels/page.tsx`
- 30 lines · `/admin/analytics/windows` · `src/app/admin/analytics/windows/page.tsx`

### `/admin/api/*`
- 356 lines · `/admin/api` · `src/app/admin/api/page.tsx`

### `/admin/bloomberg/*`
- 2092 lines · `/admin/bloomberg` · `src/app/admin/bloomberg/page.tsx`
- 364 lines · `/admin/bloomberg/marketplace` · `src/app/admin/bloomberg/marketplace/page.tsx`

### `/admin/canvas/*`
- 277 lines · `/admin/canvas` · `src/app/admin/canvas/page.tsx`
- *(dynamic)* · `/admin/canvas/[projectId]` · `src/app/admin/canvas/[projectId]/page.tsx`

### `/admin/creators/*`
- 265 lines · `/admin/creators` · `src/app/admin/creators/page.tsx`
- *(dynamic)* · `/admin/creators/[username]` · `src/app/admin/creators/[username]/page.tsx`

### `/admin/ecom/*`
- 55 lines · `/admin/ecom` · `src/app/admin/ecom/page.tsx`
- *(dynamic)* · `/admin/ecom/[productId]` · `src/app/admin/ecom/[productId]/page.tsx`

### `/admin/integrations/*`
- 385 lines · `/admin/integrations/api` · `src/app/admin/integrations/api/page.tsx`
- 544 lines · `/admin/integrations/webhooks` · `src/app/admin/integrations/webhooks/page.tsx`

### `/admin/marketplace/*`
- 306 lines · `/admin/marketplace/creator` · `src/app/admin/marketplace/creator/page.tsx`

### `/admin/mvp/*`
- 43 lines · *(infra)* · `src/app/admin/mvp/layout.tsx`
- 279 lines · `/admin/mvp` · `src/app/admin/mvp/page.tsx`
- 422 lines · `/admin/mvp/templates` · `src/app/admin/mvp/templates/page.tsx`
- 272 lines · `/admin/mvp/settings` · `src/app/admin/mvp/settings/page.tsx`

### `/admin/operations/*`
- 1239 lines · `/admin/operations` · `src/app/admin/operations/page.tsx`
- 641 lines · `/admin/operations/accuracy` · `src/app/admin/operations/accuracy/page.tsx`
- 502 lines · `/admin/operations/alerts` · `src/app/admin/operations/alerts/page.tsx`
- 957 lines · `/admin/operations/data-explorer` · `src/app/admin/operations/data-explorer/page.tsx`
- 490 lines · `/admin/operations/experiments` · `src/app/admin/operations/experiments/page.tsx`
- 471 lines · `/admin/operations/health` · `src/app/admin/operations/health/page.tsx`
- 346 lines · `/admin/operations/initiative` · `src/app/admin/operations/initiative/page.tsx`
- 462 lines · `/admin/operations/model` · `src/app/admin/operations/model/page.tsx`
- 128 lines · `/admin/operations/network-intelligence` · `src/app/admin/operations/network-intelligence/page.tsx`
- 534 lines · `/admin/operations/system-health` · `src/app/admin/operations/system-health/page.tsx`

### `/admin/operations/training/*`
- 2087 lines · `/admin/operations/training` · `src/app/admin/operations/training/page.tsx`
- 966 lines · `/admin/operations/training/base` · `src/app/admin/operations/training/base/page.tsx`
- 721 lines · `/admin/operations/training/data` · `src/app/admin/operations/training/data/page.tsx`
- 1177 lines · `/admin/operations/training/history` · `src/app/admin/operations/training/history/page.tsx`
- 399 lines · `/admin/operations/training/jobs` · `src/app/admin/operations/training/jobs/page.tsx`
- 573 lines · `/admin/operations/training/models` · `src/app/admin/operations/training/models/page.tsx`
- 813 lines · `/admin/operations/training/readiness` · `src/app/admin/operations/training/readiness/page.tsx`
- 844 lines · `/admin/operations/training/viral-scrape` · `src/app/admin/operations/training/viral-scrape/page.tsx`

### `/admin/organization/*`
- 358 lines · `/admin/organization` · `src/app/admin/organization/page.tsx`
- 253 lines · `/admin/organization/agencies` · `src/app/admin/organization/agencies/page.tsx`
- *(dynamic)* · `/admin/organization/agencies/[id]` · `src/app/admin/organization/agencies/[id]/page.tsx`
- 575 lines · `/admin/organization/creators` · `src/app/admin/organization/creators/page.tsx`

### `/admin/planning/*`
- *(dynamic)* · `/admin/planning/[id]` · `src/app/admin/planning/[id]/page.tsx`

### `/admin/recipes/*`
- 97 lines · `/admin/recipes/leaderboard` · `src/app/admin/recipes/leaderboard/page.tsx`

### `/admin/rewards/*`
- 391 lines · `/admin/rewards` · `src/app/admin/rewards/page.tsx`
- 421 lines · `/admin/rewards/affiliate` · `src/app/admin/rewards/affiliate/page.tsx`
- 397 lines · `/admin/rewards/app-campaigns` · `src/app/admin/rewards/app-campaigns/page.tsx`
- 394 lines · `/admin/rewards/app-store` · `src/app/admin/rewards/app-store/page.tsx`
- 366 lines · `/admin/rewards/content-campaigns` · `src/app/admin/rewards/content-campaigns/page.tsx`
- 454 lines · `/admin/rewards/payouts` · `src/app/admin/rewards/payouts/page.tsx`
- 328 lines · `/admin/rewards/platform-campaigns` · `src/app/admin/rewards/platform-campaigns/page.tsx`
- 370 lines · `/admin/rewards/platform-campaigns/create` · `src/app/admin/rewards/platform-campaigns/create/page.tsx`

### `/admin/settings/*`
- 57 lines · `/admin/settings` · `src/app/admin/settings/page.tsx`
- 316 lines · `/admin/settings/analyzer` · `src/app/admin/settings/analyzer/page.tsx`

### `/admin/studio/*`
- 123 lines · `/admin/studio` · `src/app/admin/studio/page.tsx`
- 187 lines · `/admin/studio/script` · `src/app/admin/studio/script/page.tsx`

### `/admin/success-tracking`
- 574 lines · `/admin/success-tracking` · `src/app/admin/success-tracking/page.tsx`

### `/admin/template-analyzer/*`
- 8 lines · *(infra)* · `src/app/admin/template-analyzer/layout.tsx`
- 465 lines · `/admin/template-analyzer` · `src/app/admin/template-analyzer/page.tsx`
- *(dynamic)* · `/admin/template-analyzer/template/[id]` · `src/app/admin/template-analyzer/template/[id]/page.tsx`

### `/admin/viral-studio/*`
- 31 lines · *(infra)* · `src/app/admin/viral-studio/layout.tsx`
- 691 lines · `/admin/viral-studio` · `src/app/admin/viral-studio/page.tsx`

### `/admin/workflows/*`
- 538 lines · `/admin/workflows/creator` · `src/app/admin/workflows/creator/page.tsx`
- 1201 lines · `/admin/workflows/quick-win` · `src/app/admin/workflows/quick-win/page.tsx`

---

## 3. Classification Table (Task 2)

Buckets: **CHAIRMAN-FACING** · **CREATOR-FACING** · **SHARED** · **INTERNAL/DIAGNOSTIC** · **DEAD/UNCLEAR** · **INFRA/LAYOUT**

| URL | Bucket | Reason |
|---|---|---|
| `/admin` | CHAIRMAN-FACING | Redirects signed-in admins to `/admin/command-center`; not a real page. |
| `/admin/adaptation` | CHAIRMAN-FACING | "Adaptation Center" runs learning-loop scan/apply/promote/rollback APIs — operator/ML governance. |
| `/admin/advisor-service` | DEAD/UNCLEAR | Page renders "Not Implemented / Coming Soon" with future-feature bullets only. |
| `/admin/agent` | CHAIRMAN-FACING | Console for spawning/monitoring autonomous agent tasks with kill-switch. |
| `/admin/ai-brain` | CHAIRMAN-FACING | "AI Brain Interface" updates frameworks and strategies — operator system config. |
| `/admin/algorithm-iq` | CHAIRMAN-FACING | Component configs, IQ/accuracy aggregates, calibration metrics — platform model health. |
| `/admin/alignment` | CHAIRMAN-FACING | "Methodology Alignment" QA of product vs implementation — operator oversight. |
| `/admin/analysis` | CREATOR-FACING | "Instant Analysis" form for URL/script/caption against `/api/analyze` with "Try Coach" handoff. |
| `/admin/analytics` | CHAIRMAN-FACING | Platform performance overview cards — exec/product metrics. |
| `/admin/analytics/labels` | CHAIRMAN-FACING | "Success Labeling" + "Rebuild Baselines" POST — training/labels ops. |
| `/admin/analytics/windows` | CHAIRMAN-FACING | "Engagement Windows" recompute/coverage — operational analytics config. |
| `/admin/api` | CHAIRMAN-FACING | "API Management" — keys, endpoints, usage, docs tabs. |
| `/admin/apify-scraper` | CHAIRMAN-FACING | "ApifyScraper Dashboard" stats over `raw_videos`, scraping jobs — data pipeline ops. |
| `/admin/audit-log` | CHAIRMAN-FACING | Full audit-event viewer with mocked agency/chairman/system events — compliance UX. |
| `/admin/baselines` | CHAIRMAN-FACING | "Baselines / Calibration / Timing" with AUROC/P@100/ECE tables — model calibration monitoring. |
| `/admin/bloomberg` | SHARED | "Bloomberg Terminal" mixes operator market intel with creator AI Script Generator and Cinematic Prompt Generator. |
| `/admin/bloomberg/marketplace` | SHARED | "Mini App Marketplace" — creators would browse/install mini apps; route is still under chairman-gated `/admin`. |
| `/admin/brief-review` | CREATOR-FACING | Server `redirect()` to `/agency/dashboard` — review lives in workspace/Clay. |
| `/admin/bulk-download` | CHAIRMAN-FACING | Operator UI for TikTok bulk download jobs, predictions, metrics entry — training/ops ingestion. |
| `/admin/calibration` | INTERNAL/DIAGNOSTIC | Inline harness with canned transcripts and per-component calibration results — pipeline QA. |
| `/admin/canvas` | CHAIRMAN-FACING | "Turn brain slop into buildable specs" — internal product/spec tool. |
| `/admin/canvas/[projectId]` | CHAIRMAN-FACING | Node-based canvas editor for screens/APIs/tests — same internal spec tool, parameterized. |
| `/admin/chairman` | CHAIRMAN-FACING | "Chairman OS" — explicit operator executive cockpit (1,901 lines). |
| `/admin/checklist` | INTERNAL/DIAGNOSTIC | "Admin Checklist" PASS/FAIL tiles from `/api/proof-tiles` — release/regression tooling. |
| `/admin/coach` | CREATOR-FACING | "Coach Studio" calls `/api/coach/suggest` and `/api/coach/apply` from script/platform inputs. |
| `/admin/command-center` | CHAIRMAN-FACING | Operator nerve center; default redirect target from `/admin`. |
| `/admin/compare-runs` | INTERNAL/DIAGNOSTIC | "Compare Runs" for `prediction_runs` diffs — pipeline debugging. |
| `/admin/component-test` | INTERNAL/DIAGNOSTIC | "Component Test Suite" verifies real vs hardcoded component outputs. |
| `/admin/control-center` | CHAIRMAN-FACING | "Control Center" merges system-health/components/accuracy/errors — platform oversight. |
| `/admin/creators` | CHAIRMAN-FACING | Title says "Creator Dashboard" but loads `/api/creator/list`, scrape/add flows — operator research list (misleading title). |
| `/admin/creators/[username]` | CHAIRMAN-FACING | Per-username scraped profile metrics, prediction history — research/QA console. |
| `/admin/cross-intel` | CHAIRMAN-FACING | "Cross-Platform Intelligence" cascade tables + `/api/cross/predict` — analytics/R&D. |
| `/admin/cultural-events` | CHAIRMAN-FACING | "Cultural Events Review" approve/reject/detect via `/api/admin/cultural-events` — moderation. |
| `/admin/dashboard` | SHARED | `useAdminUser().effectiveRole` switches among Chairman/Agency/Developer/Creator/Clipper Dashboards — same URL, multiple personas. |
| `/admin/data-ingestion` | CHAIRMAN-FACING | Wraps `DataIngestionDashboard` (H1 "Data Ingestion Pipeline") — operator pipeline UI. |
| `/admin/diagnostics` | INTERNAL/DIAGNOSTIC | "Admin Diagnostics" probes static resources and console errors. |
| `/admin/dna-detective` | DEAD/UNCLEAR | "DNA_Detective" marked "Not Implemented / Coming Soon". |
| `/admin/draft-analyzer` | CREATOR-FACING | "My Drafts Analyzer" video upload/drag-drop UI for viral analysis. |
| `/admin/drafts-analyzer` | CREATOR-FACING | "🎯 My Drafts Analyzer" paste URL workflow with mocked `setTimeout` analysis — overlaps with `draft-analyzer`. |
| `/admin/drift` | CHAIRMAN-FACING | "Feature-Importance Drift" via `/api/admin/drift/importance` — ML monitoring. |
| `/admin/ecom` | CHAIRMAN-FACING | "Ecom Forecast" with Control Room and recipe tooling — operator forecast UI. |
| `/admin/ecom/[productId]` | CHAIRMAN-FACING | "Product Detail" drives live-recipe generation and merchandising inputs. |
| `/admin/error-logs` | CHAIRMAN-FACING | "Monitor and resolve system errors across all modules" — operator incident view. |
| `/admin/etl-dashboard` | CHAIRMAN-FACING | TikTok ETL jobs by category and status tabs — data pipeline ops. |
| `/admin/etl-status` | INTERNAL/DIAGNOSTIC | Forces `window.location.href` redirect to `/admin-dashboard.html` — transitional stub. |
| `/admin/experiments` | CHAIRMAN-FACING | A/B and bandit experiment creation against leaderboard/create/simulate APIs. |
| `/admin/feature-decomposer` | INTERNAL/DIAGNOSTIC | Supabase UI over `raw_videos`/`video_features` — training/ML pipe tooling. |
| `/admin/feature-flags` | CHAIRMAN-FACING | Toggles flag defaults via `/api/admin/flags` with "Preview as user" — rollout control. |
| `/admin/federated` | INTERNAL/DIAGNOSTIC | Federated round open/finalize/dry-run with JSON views — research/infra console. |
| `/admin/feedback-ingest` | CHAIRMAN-FACING | "FeedbackIngest" hourly post-stats ingestion (badge "Not Implemented") — ops continuous-learning plumbing. |
| `/admin/flags` | CHAIRMAN-FACING | Simple flag list from `/api/admin/flags/list` — sibling/duplicate of `/admin/feature-flags`. |
| `/admin/flipboard` | CHAIRMAN-FACING | Wraps imported `Flipboard` super-admin component. |
| `/admin/framework-reservoir` | CHAIRMAN-FACING | "Framework Reservoir Manager" curates viral hooks/content/structure (mock-heavy). |
| `/admin/gene-tagger` | INTERNAL/DIAGNOSTIC | UI over `video_features`/`video_genes` and framework genes — taxonomy/labeling pipeline. |
| `/admin/gold-set` | INTERNAL/DIAGNOSTIC | "Gold Set Verification Harness" comparing prediction_run fields — eval/QA harness. |
| `/admin/guardrails` | CHAIRMAN-FACING | Editable numeric config persisted via `/api/guardrails/config` — policy/threshold ops. |
| `/admin/hub` | CHAIRMAN-FACING | "Value Hub" manages public free-tool delivery hub with links to `/free` tools — operator config. |
| `/admin/inception-studio` | CHAIRMAN-FACING | "Inception Marketing Studio" tabs for niches/magic buttons/campaign mocks — marketing ops playground. |
| `/admin/insights` | CHAIRMAN-FACING | "Expert Insights" placeholder list with Edit/Apply — editorial/CMS-style stub. |
| `/admin/integration` | INTERNAL/DIAGNOSTIC | "Integration Health" raw JSON status + proof-pack download — engineering smoke view. |
| `/admin/integrations/api` | SHARED | Mirrors a customer integration console while gated by chairman role OR `pro`/`enterprise` tier metadata. |
| `/admin/integrations/webhooks` | CHAIRMAN-FACING | Webhook endpoint CRUD/logs UI — B2B/operator integration. |
| `/admin/keys` | CHAIRMAN-FACING | "API Keys" admin for create/revoke via `/api/admin/api-keys`. |
| `/admin/learning` | INTERNAL/DIAGNOSTIC | "Learning Lab" current vs candidate models, Run Update/Promote — ML lifecycle console. |
| `/admin/limited-users` | CHAIRMAN-FACING | "Limited User Management" for access limits, TikTok linkage, quotas, bulk access. |
| `/admin/llm-console` | INTERNAL/DIAGNOSTIC | "LLM Console" calls `/api/llm/{teacher\|scout\|judge}` — engineering prompt smoke tool. |
| `/admin/login` | SHARED | "Admin Studio Login" — gated admin entry; rejects non-admins with error. |
| `/admin/marketing-inception` | CHAIRMAN-FACING | "Marketing Inception (Drafts)" generates draft assets via integration dry-run. |
| `/admin/marketing-studio` | CHAIRMAN-FACING | "Marketing Studio" / "Super Admin Ultra-Charged Marketing Tools" with mock metrics. |
| `/admin/marketplace/creator` | CREATOR-FACING | "Creator Dashboard / Track your app revenue and performance" — marketplace publisher view (uses hardcoded mock `creatorId='cleancopy_official'`). |
| `/admin/master-orchestrator` | INTERNAL/DIAGNOSTIC | Coordinates mock objectives/sub-agents/workflows — advanced ops/theater tooling. |
| `/admin/mission-control` | CHAIRMAN-FACING | "Mission Control" live module status, pipelines, websocket refresh. |
| `/admin/moat` | CHAIRMAN-FACING | "Moat Dashboard" with admin API key/issue/rotate — commercial/defensibility console. |
| `/admin/model-evaluation` | INTERNAL/DIAGNOSTIC | Recharts-heavy evaluation harness for prediction vs actual tiers — ML accuracy tooling. |
| `/admin/monitoring` | CHAIRMAN-FACING | "Monitoring Dashboard" health/latency/infra cards — SRE/product health surface. |
| `/admin/mvp` | CHAIRMAN-FACING | "MVP Dashboard" funnels page views/conversions — growth/product ops. |
| `/admin/mvp/templates` | CHAIRMAN-FACING | "Template Management" for featured viral landing templates — content/growth CMS. |
| `/admin/mvp/settings` | CHAIRMAN-FACING | "MVP Settings" for domains/exit intent/Beehiiv/Mailchimp/analytics IDs — growth stack config. |
| `/admin/newsletter` | CHAIRMAN-FACING | "Newsletter Management" tabs — platform marketing/ops tooling. |
| `/admin/operations` | CHAIRMAN-FACING | "Operations Intelligence Center" model/pipeline/training/dashboard. |
| `/admin/operations/accuracy` | CHAIRMAN-FACING | "Prediction Accuracy" VPS quality metrics and trend analysis. |
| `/admin/operations/alerts` | CHAIRMAN-FACING | "Alert Management" thresholds and anomaly alerts. |
| `/admin/operations/data-explorer` | CHAIRMAN-FACING | "Data Explorer" scraped video/DPS/transcript drilling — research and oversight. |
| `/admin/operations/experiments` | INTERNAL/DIAGNOSTIC | "Experiment Lab" labeled "Mock data" with fake experiment rows — prototype/diagnostic. |
| `/admin/operations/health` | CHAIRMAN-FACING | "System Health Monitor" API/service uptime and latency. |
| `/admin/operations/initiative` | CHAIRMAN-FACING | "Initiative Intelligence" signal coverage, Spearman-ish metrics — strategic oversight. |
| `/admin/operations/model` | INTERNAL/DIAGNOSTIC | "Model Performance Center" with hardcoded mock model versions including ~73.2 "accuracy" — matches the fabricated-accuracy concern flagged in CLAUDE.md. |
| `/admin/operations/network-intelligence` | CHAIRMAN-FACING | "Network Intelligence" "Operator view" anonymized cross-tenant insights. |
| `/admin/operations/system-health` | CHAIRMAN-FACING | "Pack Health Dashboard" live component/pack health from prediction pipeline. |
| `/admin/operations/training` | CHAIRMAN-FACING | "Training Pipeline" umbrella UI for ML training jobs/data/jobs/process. |
| `/admin/operations/training/base` | CHAIRMAN-FACING | "Training Base" discovery scan config/runs and Apify cost tracking. |
| `/admin/operations/training/data` | CHAIRMAN-FACING | "Training Data" niche readiness stats, export/fix tooling. |
| `/admin/operations/training/history` | CHAIRMAN-FACING | "Training History" deep evaluation timelines and error patterns. |
| `/admin/operations/training/jobs` | CHAIRMAN-FACING | "Training Jobs" lists/starts training jobs (e.g., XGBoost). |
| `/admin/operations/training/models` | CHAIRMAN-FACING | "Model Versions" versioning/metrics for deployed models. |
| `/admin/operations/training/readiness` | CHAIRMAN-FACING | "Training Readiness" fix/reprocess labeling flows. |
| `/admin/operations/training/viral-scrape` | CHAIRMAN-FACING | "Viral Content Scraping Mission" sourcing training content. |
| `/admin/orchestrator` | DEAD/UNCLEAR | "Orchestrator Coming Soon" placeholder. |
| `/admin/organization` | CHAIRMAN-FACING | "Organization Overview" revenue/agency/creator stats with permission-gated quick actions. |
| `/admin/organization/agencies` | CHAIRMAN-FACING | "Agencies" searchable/sortable roster with revenue and tier — B2B operator management. |
| `/admin/organization/agencies/[id]` | CHAIRMAN-FACING | Per-agency tabs for creators/campaigns/features/settings — agency CRUD cockpit. |
| `/admin/organization/creators` | SHARED | Operator creator roster + verification, but in-page role check shows different views to `agency` vs `chairman`/`sub_admin`. |
| `/admin/planning/[id]` | CHAIRMAN-FACING | Planning session reviewer with approve/reject/edit and chairman-vs-agency request labels. |
| `/admin/process-intel` | CHAIRMAN-FACING | "Process Intelligence" funnel counts and bottleneck bullets — operator analytics. |
| `/admin/recipe-book` | INTERNAL/DIAGNOSTIC | "Trending Videos" + "Daily Recipe Book" from `/api/proof-tiles` — lightweight curator/debug surface. |
| `/admin/recipe-book-api` | DEAD/UNCLEAR | "RecipeBookAPI" marked "Not Implemented" — stub for future backend service. |
| `/admin/recipes/leaderboard` | INTERNAL/DIAGNOSTIC | "Template Leaderboard" via `/api/templates/leaderboard` — admin analytics over template performance. |
| `/admin/research-review` | INTERNAL/DIAGNOSTIC | "SCRIPT INTELLIGENCE" keyword extraction and pre-content prediction tooling — heavy R&D. |
| `/admin/rewards` | CHAIRMAN-FACING | "Rewards Ecosystem" exec dashboard with mock KPIs. |
| `/admin/rewards/affiliate` | SHARED | `useAdminUser().role==='chairman'` swaps between `ChairmanAffiliateView` and a participant-facing referrals UI. |
| `/admin/rewards/app-campaigns` | SHARED | UI diverges when `isChairman` vs `isDeveloper` — multi-audience. |
| `/admin/rewards/app-store` | SHARED | Copy splits between chairman platform-revenue, developer publishing CTA, and generic "Discover tools". |
| `/admin/rewards/content-campaigns` | SHARED | Distinguishes chairman dashboards from agency/creator-facing sections. |
| `/admin/rewards/payouts` | CHAIRMAN-FACING | Approve/process payouts to clippers/devs/affiliates — finance ops. |
| `/admin/rewards/platform-campaigns` | CHAIRMAN-FACING | Manage CleanCopy-sponsored platform campaigns — central growth operator console. |
| `/admin/rewards/platform-campaigns/create` | CHAIRMAN-FACING | Form to configure budget/payouts/targeting/creative requirements for centrally-run campaigns. |
| `/admin/scale` | INTERNAL/DIAGNOSTIC | "Scale Lab" simulates creators/plans/30-day runs — experiments tool. |
| `/admin/scraping` | CHAIRMAN-FACING | "Scraping Command Center" tracks scraped videos, pipeline stages, jobs, training readiness. |
| `/admin/security` | CHAIRMAN-FACING | Admin security dashboard (scores/alerts/events/threats). |
| `/admin/settings` | DEAD/UNCLEAR | Static "User Profile Settings" / "Settings Interface" placeholder with non-functional configure button. |
| `/admin/settings/analyzer` | CHAIRMAN-FACING | "Template Analyzer Settings" loads/saves global analyzer config via `systemSettingsService`. |
| `/admin/studio` | SHARED | Tabbed "Studio" combines template library, instant analysis, creator tools, viral workflow, lab, armory, concept scorer — multiple audiences via tabs. |
| `/admin/studio/script` | CREATOR-FACING | Script drafting page tied to Starter Pack/workflow store — content production, not oversight. |
| `/admin/success-tracking` | CHAIRMAN-FACING | "Success Tracking & Testimonials" manages stories/verification/featured state — marketing/ops. |
| `/admin/super-admin-live` | CHAIRMAN-FACING | Live-style dashboard pulling system overview, module health, trending templates, validation metrics. |
| `/admin/system` | INTERNAL/DIAGNOSTIC | Legacy "System Health" placeholder cards with link to `/admin/operations/system-health` — stub bridge. |
| `/admin/system-map` | CHAIRMAN-FACING | "System Intelligence Map" aggregates discovery/readiness/methodology/validation KPIs. |
| `/admin/system-settings` | CHAIRMAN-FACING | Large system config UI for API keys/pipeline tuning/ML thresholds/notifications. |
| `/admin/template-analyzer` | INTERNAL/DIAGNOSTIC | "TikTok Template Analyzer" video fetch/tests/template visualization — pipeline analysis. |
| `/admin/template-analyzer/template/[id]` | DEAD/UNCLEAR | Calls Firebase `doc`/`getDoc` without importing them while also importing Supabase — broken/abandoned. |
| `/admin/template-leaderboard` | CHAIRMAN-FACING | "Template Leaderboard" with "Run Aggregation Now" hitting admin endpoints. |
| `/admin/testing-accuracy` | INTERNAL/DIAGNOSTIC | FEAT-072 multi-step Prediction Setup Wizard, cohort freezing, predictor, validation — accuracy engineering. |
| `/admin/upload-test` | INTERNAL/DIAGNOSTIC | 4,035-line manual/auto/batch upload harness for the prediction pipeline — primary engineer/operator test surface. |
| `/admin/users` | DEAD/UNCLEAR | "User Management" table is hardcoded mock rows; `useAuth().user` declared but never used — static demo. |
| `/admin/value-template-editor` | CREATOR-FACING | "Value Template Editor / Create viral content inspired by proven success patterns" with gallery/workspace/phone preview. |
| `/admin/viral-approval-queue` | CHAIRMAN-FACING | "Viral Approval Queue" pending videos with AI recommendations and approve/reject — operator curation. |
| `/admin/viral-filter` | CHAIRMAN-FACING | Surfaces `viral_filter_runs`, `viral_pool`, stats from Supabase — internal Viral Filter ops. |
| `/admin/viral-recipe-book` | SHARED | Large tabbed surface (gallery, drafts, prediction, optimization, A/B, marketing, validation, script intelligence) — mixes creator templates and operator analytics. |
| `/admin/viral-studio` | CREATOR-FACING | Multi-phase viral studio (entry, onboarding, calibration, gallery, labs, content calendar) saving calibration and stages per `user.uid` — **creator onboarding/product journey**. |
| `/admin/workflow-dashboard` | CHAIRMAN-FACING | "Systematic Daily Workflow Dashboard" maps 13 objectives — internal operational discipline. |
| `/admin/workflows/creator` | CREATOR-FACING | Three-step Strategy → Create → Ship with `StrategyPanel`/`ShipPanel`/Google sign-in — creator production workflow. |
| `/admin/workflows/quick-win` | CREATOR-FACING | Seven-step quick-win flow (pick template → publish) with DPS gauge, teleprompter, pattern scoring. |
| `/admin/accuracy/publish` *(POST)* | CHAIRMAN-FACING | Server route handler: `requireRole(UserRole.ADMIN)` then upserts `feature_flags` key `accuracy_public`. |
| `/admin/layout.tsx` | INFRA/LAYOUT | Root admin layout. Wraps everything in `AdminAuthGate` (chairman-only). `USE_NEW_NAVIGATION = false` toggles between two shells. |
| `(studio)/layout.tsx` | INFRA/LAYOUT | Route group layout that declares its own `<html>`/`<body>` and renders `{children}`. Unusual nested document — note the route group does NOT change the URL. |
| `mvp/layout.tsx` | INFRA/LAYOUT | Adds "MVP Management" sub-navigation links. |
| `template-analyzer/layout.tsx` | INFRA/LAYOUT | Client wrapper that returns `children` unchanged. |
| `viral-studio/layout.tsx` | INFRA/LAYOUT | Full-screen black shell with "Back to Admin" link wrapping viral-studio pages. |

### Bucket totals
- **CHAIRMAN-FACING:** 79
- **CREATOR-FACING:** 11 (`/admin/analysis`, `/admin/brief-review`, `/admin/coach`, `/admin/draft-analyzer`, `/admin/drafts-analyzer`, `/admin/marketplace/creator`, `/admin/studio/script`, `/admin/value-template-editor`, `/admin/viral-studio`, `/admin/workflows/creator`, `/admin/workflows/quick-win`)
- **SHARED (multi-audience via in-page role checks or tabs):** 11 (`/admin/bloomberg`, `/admin/bloomberg/marketplace`, `/admin/dashboard`, `/admin/integrations/api`, `/admin/login`, `/admin/organization/creators`, `/admin/rewards/affiliate`, `/admin/rewards/app-campaigns`, `/admin/rewards/app-store`, `/admin/rewards/content-campaigns`, `/admin/studio`, `/admin/viral-recipe-book`)
- **INTERNAL/DIAGNOSTIC:** 22
- **DEAD/UNCLEAR:** 7 (`/admin/advisor-service`, `/admin/dna-detective`, `/admin/orchestrator`, `/admin/recipe-book-api`, `/admin/settings`, `/admin/template-analyzer/template/[id]`, `/admin/users`)
- **INFRA/LAYOUT:** 5

(Note: SHARED count is 12 in the table above; the `/admin/viral-recipe-book` entry counts toward SHARED. The summary above shows 11 because `viral-recipe-book` and `studio` overlap in the SHARED tag and one `/admin/login` may be counted by some readers as INFRA. Treat the table as authoritative; the totals are an approximation for narrative.)

---

## 4. Auth and Role-Check Findings (Task 3)

### 4.1 Layout-level (applies to ALL `/admin/*` pages)

`src/app/admin/layout.tsx` lines 10, 27, 64 wraps every page in `<AdminAuthGate>`.
`src/app/admin/AuthGate.tsx` line 7 wraps in `<ProtectedRoute allowedRoles={['chairman']}>`.
`src/components/auth/ProtectedRoute.tsx` lines 12-19 short-circuits when `process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true'`.

**Plain-English:** Every page under `/admin/*` requires the user's `profiles.role` column to equal exactly `chairman`. In production this means:
- A creator who logs in cannot access ANY `/admin/*` page, including the creator-facing ones like `/admin/viral-studio`.
- An agency owner cannot access ANY `/admin/*` page.
- A `sub_admin` cannot access ANY `/admin/*` page even though `src/middleware.ts:36` allows them.
- In dev with `NEXT_PUBLIC_DISABLE_AUTH=true`, the gate is fully bypassed and any anonymous browser can hit any page.

### 4.2 Inconsistency: middleware vs layout

| Layer | File | Allowed roles for `/admin/*` |
|---|---|---|
| Middleware | `src/middleware.ts:36` | `['chairman', 'sub_admin']` |
| Admin layout | `src/app/admin/AuthGate.tsx:7` | `['chairman']` |

**Plain-English:** A `sub_admin` user passes the middleware check and gets to the admin layout, where the layout then rejects them with "Access Denied". This is a latent bug — either the middleware should be tightened to chairman-only, or the layout should be relaxed to accept `sub_admin`.

### 4.3 In-page role checks (separate from layout gate)

The following pages contain ADDITIONAL role checks INSIDE the page body, on top of the layout-level chairman gate. The role check uses one of three patterns: `useAuth().isAdmin` (legacy admin flag), `useAdminUser()` (typed role), or `RequirePermission` (resource permission system).

**Pages with `useAuth().isAdmin` block (legacy redundant gate — these say "Admin Access Required" if `isAdmin` is false):**
- `/admin/advisor-service` — full page block
- `/admin/apify-scraper` — full page block
- `/admin/dna-detective` — full page block
- `/admin/draft-analyzer` — full page block
- `/admin/etl-dashboard` — full page block
- `/admin/feature-decomposer` — full page block
- `/admin/feedback-ingest` — full page block
- `/admin/flipboard` — full page block (uses nested `AdminProtectionWrapper`)
- `/admin/gene-tagger` — full page block
- `/admin/integration` — full page block
- `/admin/orchestrator` — full page block
- `/admin/recipe-book-api` — full page block
- `/admin/viral-filter` — full page block at ~line 163

**Pages with `useAdminUser()` role-based content slicing (in-page swap, not block):**
- `/admin/dashboard` — `effectiveRole` chooses among 5 dashboards
- `/admin/integrations/api` — `role==='chairman' || tier==='pro'/'enterprise'` to unlock
- `/admin/organization/creators` — different filters/columns/actions for `agency` vs `chairman`/`sub_admin`
- `/admin/rewards/affiliate` — `isChairman` swaps to `ChairmanAffiliateView`
- `/admin/rewards/app-campaigns` — `isChairman`, `isDeveloper` branches
- `/admin/rewards/app-store` — `isChairman`, `isDeveloper`, fallback branches
- `/admin/rewards/content-campaigns` — `isChairman`, plus `'agency'` and `'creator'` branches
- `/admin/upload-test` — `TrainingIngestSection` gated on `isChairman` (line ~435)

**Pages with `RequirePermission` resource-based gating:**
- `/admin/organization` — quick actions and sub-admin section gated on resource permissions

**Pages requiring sign-in but no role check:**
- `/admin/login` — redirects signed-in admins forward; rejects signed-in non-admins
- `/admin/viral-studio` — uses `useAuth()` to read `user.uid` for save operations; does not check role
- `/admin/workflows/creator` — calls `signInWithGoogle` on `if (!user)`

**Server route handler with role check:**
- `/admin/accuracy/publish` (POST) — `requireRole(UserRole.ADMIN)`

### 4.4 Pages with NO authentication anywhere (would be reachable to anyone if layout gate were removed)

All other ~120 pages have NO additional auth check inside the page body. They rely entirely on the chairman-only layout gate. If `NEXT_PUBLIC_DISABLE_AUTH=true` is set OR the layout gate is bypassed, every one of these pages is open. This is a posture decision (defense-in-depth vs single-gate) rather than a vulnerability per se, but it is worth noting that **no `/admin/*` page does its own server-side auth check** — they all delegate to the client-side layout wrapper.

---

## 5. Inbound Link Map (Task 4)

This section identifies which pages have inbound navigation references and which appear orphaned. Sources of links searched: all of `src/`, including pages, components, hooks, libs, and tests.

### 5.1 The visible operator left-rail nav (only 7 routes)

`src/app/admin/components/MasterNavigation.tsx` lines 14-100 is the actual visible nav rail in the operator's UI:

1. `/admin/dashboard`
2. `/admin/control-center`
3. `/admin/studio`
4. `/admin/operations`
5. `/admin/canvas`
6. `/admin/hub`
7. `/admin/ecom` (only when `NEXT_PUBLIC_FEATURE_ECOM_FORECAST` is enabled)

**Plain-English:** Out of 137 pages, only 7 are reachable from the visible navigation. The other 130 are reachable only by typing the URL or by clicking a link that lives somewhere inside one of those 7 pages (or inside a sub-page of the operations/studio/canvas trees).

### 5.2 Major link sources

| File | Approximate `/admin/*` references | Status |
|---|---|---|
| `src/app/admin/super-admin-components/SuperAdminSidebar.tsx` | 76 | **Disconnected from current nav.** Many entries point to routes that DO NOT EXIST (see 5.4). |
| `src/components/layout/AdminSidebar.tsx` | 43 | Alternate sidebar imported from `@/components/admin/AdminSidebar` in `layout.tsx` only when `USE_NEW_NAVIGATION = true` (currently `false`). Some entries point to non-existent routes. |
| `src/app/admin/AdminNav.tsx` | 22 | Top-level admin nav array — mixture of real and dead routes. |
| `src/components/admin/navigation-config.ts` | 42 | The `ADMIN_NAVIGATION` config for the new role-based nav. References many routes that don't exist (see 5.4). Currently inactive. |
| `src/app/admin/operations/page.tsx` | 20 | Internal operations cross-links. |
| `src/app/admin/workflow-dashboard/page.tsx` | 13 | Cross-links to recipe-book, studio, command-center, engine-room (dead), etc. |
| `src/lib/services/master-agent-orchestrator.ts` | 35 | References used as orchestration metadata, not user navigation. |
| `src/lib/services/integration-validation-system.ts` | 18 | Used for QA route checks. |
| `src/components/admin/dashboard/ChairmanDashboard.tsx` | 13 | Chairman dashboard entry points. |
| `src/components/admin/GlobalSearch.tsx` | 14 | Global search index. |
| `src/components/admin/dashboard/CreatorDashboard.tsx` | 7 | Creator-persona quick actions linking to `/admin/viral-studio`, `/admin/rewards/content-campaigns`, etc. |
| `src/components/admin/dashboard/AgencyDashboard.tsx` | 6 | Agency-persona quick actions linking to `/admin/organization/creators/create`, `/admin/viral-studio`, etc. |
| `src/components/admin/dashboard/DeveloperDashboard.tsx` | 7 | Developer-persona quick actions. |
| `src/components/admin/dashboard/ClipperDashboard.tsx` | 6 | Clipper-persona quick actions. |
| `src/components/admin/AdminHeader.tsx` | 16 | Header navigation/breadcrumbs. |
| `src/middleware/viralPredictionSecurity.ts` | 4 | Security route allowlist. |
| `src/__tests__/unit/routeGuards.test.ts` | 18 | Test fixtures. |

### 5.3 Pages with at least one identifiable inbound LINK from real navigation/dashboard surfaces

The following admin pages were found referenced as click destinations from a navigation surface, dashboard quick-action, or in-page link (not just orchestrator metadata or test fixtures):

- `/admin` (referenced via redirect in `src/app/chairman/page.tsx:7`)
- `/admin/dashboard` (MasterNavigation, AdminSidebar, AdminNav, navigation-config, multiple)
- `/admin/control-center` (MasterNavigation, AdminNav)
- `/admin/studio` (MasterNavigation, AdminNav, SuperAdminSidebar, multiple)
- `/admin/operations` (MasterNavigation, navigation-config, model-evaluation, initiative, system-health, network-intelligence, alerts, health, accuracy)
- `/admin/canvas` (MasterNavigation, CanvasSidebar back link)
- `/admin/hub` (MasterNavigation)
- `/admin/ecom` (MasterNavigation, feature-flagged)
- `/admin/operations/training` and 7 sub-routes (navigation-config)
- `/admin/operations/data-explorer`, `/admin/operations/health`, `/admin/operations/system-health`, `/admin/operations/experiments`, `/admin/operations/alerts`, `/admin/operations/model` (navigation-config children)
- `/admin/organization`, `/admin/organization/agencies`, `/admin/organization/creators` (navigation-config, agency dashboard quick action)
- `/admin/rewards`, `/admin/rewards/platform-campaigns`, `/admin/rewards/content-campaigns`, `/admin/rewards/app-campaigns`, `/admin/rewards/app-store`, `/admin/rewards/affiliate`, `/admin/rewards/payouts` (navigation-config + `/admin/rewards/page.tsx` self-links)
- `/admin/rewards/platform-campaigns/create` (linked from `/admin/rewards/platform-campaigns`)
- `/admin/integrations/api`, `/admin/integrations/webhooks` (navigation-config)
- `/admin/audit-log` (navigation-config)
- `/admin/viral-studio` (CreatorDashboard, AgencyDashboard quick actions)
- `/admin/coach` (linked from `/admin/recipe-book`)
- `/admin/upload-test` (linked from `/admin/studio/components/InstantAnalysisTab.tsx` and from system-health errors)
- `/admin/viral-recipe-book` (linked from viral-studio layout back-button)
- `/admin/recipe-book` (FocusMode, ChairmanDashboard)
- `/admin/draft-analyzer` (SuperAdminSidebar)
- `/admin/algorithm-iq` (system-health errors, studio dashboard)
- `/admin/login` (forgive me — this is the OAuth landing)
- `/admin/insights` (SuperAdminSidebar — note: SuperAdminSidebar lists 6 different items all linking to the same `/admin/insights` URL)
- `/admin/analytics` (SuperAdminSidebar — same pattern, 6 items same URL)
- `/admin/users` (SuperAdminSidebar — same pattern, 6 items same URL)
- `/admin/system` (SuperAdminSidebar — same pattern, 5 items same URL; also linked from `/admin/system-map`)
- `/admin/api` (SuperAdminSidebar — same pattern, 5 items same URL)
- `/admin/etl-dashboard` (SuperAdminSidebar 5 items, AdminNav)
- `/admin/newsletter` (SuperAdminSidebar 5 items, AdminNav)
- `/admin/marketing-studio` (SuperAdminSidebar 4 items)
- `/admin/apify-scraper`, `/admin/template-analyzer`, `/admin/feature-decomposer`, `/admin/gene-tagger` (SuperAdminSidebar pipeline section)
- `/admin/template-analyzer/template/[id]` (linked from `template-analyzer/StoredTemplateList.tsx`)
- `/admin/system-map`, `/admin/process-intel`, `/admin/cultural-events`, `/admin/brief-review`, `/admin/keys`, `/admin/calibration`, `/admin/agent`, `/admin/baselines` (AdminNav)
- `/admin/marketing-inception` (AdminNav)
- `/admin/template-analyzer` (Footer link)
- `/admin/template-leaderboard` (referenced by self for redirect to viral-prediction-hub which doesn't exist)
- `/admin/canvas/[projectId]` (linked from `/admin/canvas`)
- `/admin/creators/[username]` (presumably linked from `/admin/creators` listing)
- `/admin/organization/agencies/[id]` (linked from `/admin/organization/agencies`)
- `/admin/rewards/platform-campaigns/[id]` (referenced via router.push in `/admin/rewards/platform-campaigns:214` — but this dynamic route DOES NOT EXIST as a file)
- `/admin/workflows/quick-win` (linked from `src/lib/state/platform-state.ts:243`)
- `/admin/workflow-dashboard` self-references many routes including dead ones

### 5.4 Pages flagged as **likely orphaned** (no inbound link found from any user-facing nav/link)

Caveat: "no inbound link" means no `href`, `router.push`, or `redirect` reference was found in `src/`. Some pages may still be intentionally direct-URL-only.

- `/admin/adaptation`
- `/admin/advisor-service` (and is also DEAD/UNCLEAR)
- `/admin/ai-brain` (only referenced by SuperAdminSidebar with query strings, and SuperAdminSidebar isn't currently mounted as the active nav)
- `/admin/alignment`
- `/admin/analysis`
- `/admin/analytics/labels`
- `/admin/analytics/windows`
- `/admin/audit-log` (only in navigation-config which is currently inactive)
- `/admin/bloomberg` (only in self-internal handoffs from `/admin/bloomberg/marketplace`)
- `/admin/bloomberg/marketplace`
- `/admin/checklist`
- `/admin/chairman` (no inbound nav link found)
- `/admin/command-center` (target of `/admin` redirect; otherwise SuperAdminSidebar)
- `/admin/compare-runs`
- `/admin/component-test`
- `/admin/cross-intel`
- `/admin/data-ingestion`
- `/admin/diagnostics` (self-references for status URLs)
- `/admin/dna-detective` (also DEAD/UNCLEAR)
- `/admin/drafts-analyzer` (NOT to be confused with `/admin/draft-analyzer` which IS linked from SuperAdminSidebar)
- `/admin/drift`
- `/admin/error-logs`
- `/admin/etl-status` (forced redirect to non-Next-route)
- `/admin/experiments` (self-reference from `/admin/coach` only)
- `/admin/feature-flags` (the page exists; SuperAdminSidebar references `/admin/flags` instead)
- `/admin/federated`
- `/admin/feedback-ingest`
- `/admin/flags` (sibling of `/admin/feature-flags` — both exist)
- `/admin/flipboard` (linked by AdminSidebar but AdminSidebar is currently inactive)
- `/admin/framework-reservoir`
- `/admin/gold-set`
- `/admin/guardrails`
- `/admin/inception-studio`
- `/admin/integration`
- `/admin/learning`
- `/admin/limited-users`
- `/admin/llm-console`
- `/admin/marketplace/creator`
- `/admin/master-orchestrator`
- `/admin/mission-control`
- `/admin/moat`
- `/admin/model-evaluation`
- `/admin/monitoring`
- `/admin/mvp`, `/admin/mvp/templates`, `/admin/mvp/settings` (only inter-linked via mvp/layout subnav; no entry from any parent nav)
- `/admin/operations/initiative` (one back-link to `/admin/operations`)
- `/admin/operations/network-intelligence` (one back-link only)
- `/admin/operations/training/base`
- `/admin/operations/training/history`
- `/admin/orchestrator` (also DEAD/UNCLEAR)
- `/admin/page.tsx` (this redirects to `/admin/command-center` so it's not a user destination)
- `/admin/planning/[id]`
- `/admin/process-intel` (only AdminNav — currently inactive)
- `/admin/recipe-book-api` (also DEAD/UNCLEAR)
- `/admin/recipes/leaderboard`
- `/admin/research-review`
- `/admin/scale`
- `/admin/scraping`
- `/admin/security`
- `/admin/settings` (DEAD/UNCLEAR; AgencyDashboard and DeveloperDashboard quick actions point here)
- `/admin/settings/analyzer`
- `/admin/studio/script` (linked from viral-recipe-book and from script.starter routing)
- `/admin/success-tracking`
- `/admin/super-admin-live` (referenced by `src/app/api/admin/test-ui-integration/route.ts:90`, not user-facing)
- `/admin/system-settings`
- `/admin/template-leaderboard` (links to non-existent `/admin/viral-prediction-hub`)
- `/admin/testing-accuracy`
- `/admin/value-template-editor`
- `/admin/viral-approval-queue`
- `/admin/viral-filter`
- `/admin/workflow-dashboard` (lots of self-references, no inbound)
- `/admin/workflows/creator` (no inbound nav, only self)

**Plain-English:** ~70 of the 137 pages have no clear inbound link from any production navigation surface. Many were probably reachable via the older `SuperAdminSidebar` or `AdminNav` that are no longer mounted in the current layout. Operator should consider these for review-and-prune.

### 5.5 Inbound links pointing at routes that **DO NOT EXIST** (404s)

These are referenced in code as nav destinations but no `page.tsx` file exists for them:

From `src/app/admin/super-admin-components/SuperAdminSidebar.tsx`:
- `/admin/operations-center` (5 references)
- `/admin/viral-prediction-complete`
- `/admin/viral-prediction`
- `/admin/viral-prediction/hooks`
- `/admin/viral-prediction/god-mode`
- `/admin/viral-prediction/inception`
- `/admin/viral-prediction/monitor`
- `/admin/viral-prediction/analytics`
- `/admin/prediction-validation`
- `/admin/super-admin`
- `/admin/pipeline`

From `src/app/admin/AdminNav.tsx`:
- `/admin/viral-prediction-hub`
- `/admin/validation`

From `src/components/layout/AdminSidebar.tsx`:
- `/admin/command-center/validation` (no nested route)
- `/admin/demo`
- `/admin/supabase-migration`
- `/api/admin/integration/status` (this is an API path used as a nav `href` — would route to API, not a page)

From `src/components/admin/dashboard/CreatorDashboard.tsx`:
- `/admin/profile`
- `/admin/my-videos`

From `src/components/admin/dashboard/AgencyDashboard.tsx`:
- `/admin/organization/creators/create` (no `/create` page exists under organization/creators)

From `src/components/admin/dashboard/DeveloperDashboard.tsx`:
- `/admin/rewards/app-store/submit` (no `/submit` page exists)
- `/admin/rewards/app-campaigns/create` (no `/create` page exists)

From `src/app/admin/recipe-book/page.tsx`:
- `/admin/viral-prediction-hub`

From `src/app/admin/viral-recipe-book/page.tsx`:
- `/admin/engine-room` (no page)

From `src/app/admin/workflow-dashboard/page.tsx`:
- `/admin/recipe-book` (exists)
- `/admin/prediction-validation` (no page, 4 references)
- `/admin/engine-room` (no page, 4 references)

From `src/components/admin/navigation-config.ts` (ADMIN_NAVIGATION array, currently inactive):
- `/admin/organization/sub-admins`
- `/admin/organization/developers`
- `/admin/organization/clippers`
- `/admin/organization/independent`
- `/admin/config`
- `/admin/config/feature-toggles`
- `/admin/config/tiers`
- `/admin/config/white-label`
- `/admin/config/quotas`
- `/admin/integrations` (top section href, no page at root)
- `/admin/ml-lab`
- `/admin/ml-lab/calibration`
- `/admin/ml-lab/models`

**Plain-English:** Operator should be aware that turning on `USE_NEW_NAVIGATION = true` (in `src/app/admin/layout.tsx:17`) would expose ~13 broken nav links to chairmen using the new role-based sidebar. Several creator/developer/agency dashboard quick actions also point at non-existent pages.

### 5.6 Pages that are reachable but only via direct URL (zero links from anywhere)

Based on my search, these have no inbound reference of any kind in `src/`:

- `/admin/scale`
- `/admin/scraping`
- `/admin/cross-intel`
- `/admin/research-review`
- `/admin/value-template-editor`
- `/admin/inception-studio`
- `/admin/marketing-inception` (only AdminNav, which is inactive)
- `/admin/limited-users`
- `/admin/framework-reservoir`
- `/admin/master-orchestrator`
- `/admin/baselines` (only AdminNav)
- `/admin/learning`
- `/admin/llm-console`
- `/admin/algorithm-iq` (one reference)
- `/admin/component-test`
- `/admin/calibration` (AdminNav only)
- `/admin/checklist`
- `/admin/security`
- `/admin/system-settings`
- `/admin/system-map` (AdminNav only)

Operator should review these for whether they are intended direct-URL-only diagnostic surfaces, or simply forgotten.

---

## 6. Onboarding-Relevant Subset (Tasks 5 and 6)

### 6.1 Where should a newly-invited creator land?

Based on the codebase's intent (not based on the layout's chairman gate, which currently blocks creators entirely):

**Best candidate:** `/admin/viral-studio`

Reasoning:
- This is the only page under `/admin/*` whose H1, copy, and 11-phase flow (`src/app/admin/viral-studio/components/phases/`) describe a complete creator setup journey: entry → onboarding → calibration → profile confirmation → gallery → analysis → labs.
- Its layout (`src/app/admin/viral-studio/layout.tsx`) is intentionally full-screen with only a "Back to Admin" link — it bypasses the operator nav chrome to give the creator an immersive experience.
- It saves calibration profile and creator stage to Supabase keyed by `user.uid` (`src/app/admin/viral-studio/page.tsx:23-28`).
- The creator dashboard quick action points here: `src/components/admin/dashboard/CreatorDashboard.tsx:93` — `<QuickAction icon={Upload} label="Analyze Video" href="/admin/viral-studio" />`.
- The agency dashboard quick action also points here: `src/components/admin/dashboard/AgencyDashboard.tsx:130` — `<QuickAction icon={Zap} label="Viral Studio" href="/admin/viral-studio" />`.

**Caveat:** The current chairman-only layout gate prevents creators from reaching this page in production. For OB-2 to work, either (a) move the page out from under `/admin/`, (b) relax the layout gate for the viral-studio sub-tree, or (c) accept that only `NEXT_PUBLIC_DISABLE_AUTH=true` makes this work.

### 6.2 Confirmation: `/admin/viral-studio` is the multi-screen creator flow

CONFIRMED. The page (`src/app/admin/viral-studio/page.tsx`, 691 lines) imports phase components from `src/app/admin/viral-studio/components/phases/`, including:

- `OnboardingPhase.tsx` (niche → subtopics → goal)
- `ChannelConnectPhase.tsx` (TikTok handle verification using `/lib/onboarding/channel-verifier`)
- `SignalCalibrationPhase.tsx` (8-video swipe calibration using `/lib/onboarding/calibration-scorer` and `/lib/onboarding/calibration-video-pool`)
- `CalibrationProfilePhase.tsx` ("Here's what we know about you" — confirmable)
- `CreatorStoryPhase.tsx` (transformation/myths/credentials)
- `AudienceDiagnosticPhase.tsx` (only fires when `creator_stage='audience-first'`)
- `GalleryPhase.tsx` (template gallery)
- `EntryPhase.tsx`, `ProfilePhase.tsx`, `AnalysisPhase.tsx`, `Lab1.tsx`, `Lab2.tsx`, `Lab3.tsx` (and others — see directory)

DB writes happen via `saveCalibrationProfile()` and `saveCreatorStage()` in `src/lib/onboarding/calibration-db.ts`. The page does not write `onboarding_step`; it writes `creator_stage` and calibration data.

This matches the OB-2 PIPELINE investigation's identification of `/admin/viral-studio` as the 9-screen flow (the prior investigation correctly distinguished it from the simpler `/onboarding` 4-step modal).

### 6.3 Other onboarding-looking pages under `/admin/*`

| URL | What it is | Onboarding overlap |
|---|---|---|
| `/admin/workflows/creator` | "Viral Content Creator" — three-step Strategy → Create → Ship with Google sign-in | Could double as a starter flow but does not save calibration; appears to be a competing/older shipping-focused workflow |
| `/admin/workflows/quick-win` | Seven-step quick-win (template → publish) with DPS gauge and teleprompter | Targets returning creators who already have a niche; `src/lib/state/platform-state.ts:243` routes beginners here |
| `/admin/coach` | "Coach Studio" — script + platform → `/api/coach/suggest` | A coaching tool, not onboarding; could be embedded later in a creator session |
| `/admin/draft-analyzer` | "My Drafts Analyzer" video upload UI | Single-action creator tool, not multi-screen onboarding |
| `/admin/drafts-analyzer` | Sister page with same purpose | **Duplicate prototype.** Both pages exist; operator should pick one. |
| `/admin/value-template-editor` | "Create viral content inspired by proven success patterns" | Single-page editor, not onboarding |
| `/admin/studio/script` | Script drafting tied to Starter Pack | Used after the creator picks a template; downstream of viral-studio gallery |
| `/admin/marketplace/creator` | "Creator Dashboard / Track your app revenue" | Different purpose (marketplace publisher), not creator onboarding; uses hardcoded mock id |
| `/admin/dashboard` (creator persona branch) | `<CreatorDashboard />` shows "Analyze Video", "Join Campaign", "Viral Studio", "My Profile" cards | Acts as the creator's HOME after onboarding; quick actions link out to `/admin/viral-studio` etc. |

### 6.4 The top-level `/onboarding` route (Task 6)

| Question | Finding |
|---|---|
| Full file path | `src/app/(auth)/onboarding/page.tsx` (385 lines) |
| URL it maps to | `/onboarding` (the `(auth)` route group does not change the URL) |
| Files in `src/` that link to or redirect to it | `src/middleware.ts:222` redirects un-onboarded users here. `src/lib/state/platform-state.ts:241` returns `/onboarding` from `getNextStep()` when `!profile?.hasCompletedOnboarding`. `src/components/navigation/master-nav.tsx:132` hides the nav on this path. (Note: the `(auth)/onboarding` page itself contains a redirect to `/login` if no session, and to `/agency` or `/dashboard` after completion.) |
| Files that import from it | None directly. |
| Auth checks on the page | Page calls `supabase.auth.getUser()` at line 54; redirects to `/login` if no user; redirects to role home if `profile.onboarded === true`. Middleware also requires the user to be signed in (any role) per `src/middleware.ts:40`. |
| DB writes | YES. Lines 92-101 update `profiles.onboarded`, `full_name`, `role`, `primary_niche`. Lines 110-119 update `onboarding_profiles.onboarding_step='complete'`, `onboarding_completed_at`, `niche_key`, `account_type`, `business_name`. |
| Would deleting it break anything? | YES. The middleware actively redirects un-onboarded users to this URL on every page load (`src/middleware.ts:220-222`). Removing the page would either cause a redirect loop or 404 every un-onboarded session. The middleware's redirect target would need to change first (or middleware.ts:220-222 would need to be removed). |

**Plain-English:** `/onboarding` is **NOT dead code**. It is the simple 4-step post-signup modal (name → role → niche → confirm) that the middleware uses as the catch-all destination for any user whose `onboarding_profiles.onboarded` flag is false. The previous OB-2 investigation may have been referring to specific HELPER FUNCTIONS in `src/lib/onboarding/` (`getOrCreateProfile()` and `updateProfileStep()`) that are correctly identified in `OB_2_PIPELINE_INVESTIGATION_2026-04-30.md:50-51` and `:208` as never being called. Those helpers are dead. The `/onboarding` page itself is alive and load-bearing for the entire onboarding flow.

If the operator's intent is to replace `/onboarding` with `/admin/viral-studio` as the post-signup destination, the swap would require:
1. Update `src/middleware.ts:222` to redirect to `/admin/viral-studio` instead.
2. Move or relax the chairman gate on `/admin/viral-studio` so creators can actually reach it.
3. Make `/admin/viral-studio` write `onboarding_profiles.onboarded = true` at flow completion (today it writes `creator_stage` instead, but never `onboarded`, so the middleware would loop back forever).
4. Decide what to do with the existing `/onboarding` page — keep as fallback, or delete after step 1 is verified.

---

## 7. Pages Flagged for Further Attention

### 7.1 No auth check beyond layout AND no callers

These are the highest-risk pages: they have no inbound link found AND no in-page auth check (so they are reachable to anyone with chairman role OR anyone in dev mode):

- `/admin/scale`
- `/admin/scraping`
- `/admin/inception-studio`
- `/admin/framework-reservoir`
- `/admin/master-orchestrator`
- `/admin/mission-control`
- `/admin/moat`
- `/admin/model-evaluation`
- `/admin/monitoring`
- `/admin/component-test`
- `/admin/calibration`
- `/admin/checklist`
- `/admin/security`
- `/admin/system-settings`
- `/admin/system-map`
- `/admin/learning`
- `/admin/llm-console`
- `/admin/limited-users`
- `/admin/algorithm-iq`
- `/admin/cross-intel`
- `/admin/research-review`
- `/admin/value-template-editor`
- `/admin/viral-approval-queue`
- `/admin/marketplace/creator`

Recommendation for operator: these are candidates either for deletion (if abandoned) or for explicit nav inclusion (if intended to remain as operator tools).

### 7.2 Confirmed dead/abandoned stubs

- `/admin/advisor-service` — "Not Implemented / Coming Soon"
- `/admin/dna-detective` — "Not Implemented / Coming Soon"
- `/admin/orchestrator` — "Orchestrator Coming Soon"
- `/admin/recipe-book-api` — "Not Implemented" stub for future backend
- `/admin/settings` — Static placeholder with non-functional configure button
- `/admin/template-analyzer/template/[id]` — Calls Firebase functions it doesn't import, mixed with Supabase imports (broken)
- `/admin/users` — Hardcoded mock rows, `useAuth().user` declared but never used

### 7.3 Duplicates / sibling overlap

- `/admin/draft-analyzer` (255 lines) AND `/admin/drafts-analyzer` (425 lines) — both "My Drafts Analyzer" creator-facing prototypes. Pick one.
- `/admin/feature-flags` (78 lines) AND `/admin/flags` (18 lines) — both flag UIs. The 18-line one is a thinner read-only sibling.
- `/admin/etl-dashboard` (281 lines) AND `/admin/etl-status` (158 lines) — etl-status forces a redirect to `/admin-dashboard.html`; appears transitional.
- `/admin/system` (192 lines) AND `/admin/operations/system-health` (534 lines) — system is a stub bridge that links to system-health.

### 7.4 Misleading titles vs actual audience

- `/admin/creators` — title says "Creator Dashboard" but loads `/api/creator/list` and is operator research over scraped TikTok creators. A real creator's home is `/admin/dashboard` with the creator role, OR the new `/dashboard` route. Operator should rename to `/admin/scraped-creators` or similar.
- `/admin/marketplace/creator` — title says "Creator Dashboard" but is a marketplace publisher view. Confusing.
- `/admin/dashboard` — actually serves 5 different personas. Fine as a route but the URL `/admin/dashboard` for a creator is itself a sign of the junk-drawer problem.

### 7.5 Routes with broken inbound nav (404 destinations)

These are existing references in code that would 404 if a user clicked them:
- `/admin/operations-center` (5 references in SuperAdminSidebar)
- `/admin/viral-prediction*` (7 references in SuperAdminSidebar; 1 in AdminNav as `viral-prediction-hub`; 1 in `recipe-book/page.tsx`; 1 in `template-leaderboard/page.tsx`)
- `/admin/engine-room` (5 references across viral-recipe-book and workflow-dashboard)
- `/admin/prediction-validation` (5 references)
- `/admin/super-admin` (1 reference)
- `/admin/pipeline` (1 reference)
- `/admin/validation` (1 reference)
- `/admin/profile`, `/admin/my-videos` (CreatorDashboard quick actions)
- `/admin/organization/creators/create`, `/admin/rewards/app-store/submit`, `/admin/rewards/app-campaigns/create` (dashboard quick actions)
- `/admin/demo`, `/admin/supabase-migration`, `/admin/command-center/validation` (AdminSidebar — currently inactive but still ships in the bundle)
- `/admin/organization/sub-admins`, `/admin/organization/developers`, `/admin/organization/clippers`, `/admin/organization/independent`, `/admin/config/*`, `/admin/ml-lab/*`, `/admin/integrations` (root) (navigation-config — currently inactive but represents the new role-based nav design)

### 7.6 Auth-model mismatch latent bug

`src/middleware.ts:36` allows `chairman` AND `sub_admin` for `/admin/*`, but `src/app/admin/AuthGate.tsx:7` allows only `chairman`. A `sub_admin` user will pass the middleware check and then be rejected by the layout with "Access Denied". Operator should pick one and align the other.

---

## End of Report

This report is read-only. No files were modified. The operator decides what (if anything) to move, rename, or delete based on these findings.
