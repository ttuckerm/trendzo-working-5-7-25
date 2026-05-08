# Layer 1 Phase 1 — Pre-flight Dependency Map (2026-05-04)

**Branch:** `vercel-deploy-test`
**Repo root:** `C:\Projects\CleanCopy`
**Mode:** Read-only. No file changes were made during this map.

## Pre-flight verification results

| Check | Result |
|---|---|
| Branch | `vercel-deploy-test` ✓ |
| Repo root | `C:\Projects\CleanCopy` ✓ |
| Working tree | 23 modified + 41 untracked (66 total). User expected "22 modified + many untracked" — close enough; proceeding. |

## Input list discrepancy

The task said "84 total" pages but the list itself contains **75** distinct page paths. I processed all 75. Of those:
- **72** have `page.tsx` at the expected path
- **1** (`/admin/template-generator`) has `page.js` (older JS file — same logical page)
- **2** are MISSING entirely:
  - `/admin/expert-dashboard` — directory does not exist anywhere in `src/app/`
  - `/admin/ecom/[productId]` — note: this DOES exist as `src/app/admin/ecom/[productId]/page.tsx` (my initial Test-Path failed on the bracket; I verified with `-LiteralPath` and re-confirmed it exists). So treating as **EXISTS**.

Net: **74 of 75 pages exist** as page files. Only `/admin/expert-dashboard` is truly absent.

## Methodology

- **Page file path**: `Test-Path` for `src/app/<path>/page.tsx` (and `page.js` fallback).
- **API routes**: globbed all 882 `src/app/api/**/route.ts` files; matched any whose URL equals or is a child of `/api/admin/<page-name>/`.
- **Component imports**: parsed each page file for `from '@/components/...'` import statements.
- **Orphan-if-deleted components**: for each unique imported component, counted total importer files in `src/`. Count == 1 means only the page imports it. (Caveat: Some count==1 cases may be cross-imports between sibling components in the same feature dir; the orphan label still holds because if the page is deleted, the chain has no entry point.)
- **Nav references**: searched 16 known sidebar/nav files for the page URL string.
- **Risk flags (API consumers outside delete pages)**: for each delete-page API URL, grep across all `src/**/*.{ts,tsx}` excluding (a) the API route's own file, and (b) every file under any DELETE page directory. Any remaining hit = a kept-side consumer that breaks if the API is deleted.

---

## Per-page dependency table

Format: each page = one row. Lists are semicolon-separated. `(none)` means no entries found. UI primitive components (`@/components/ui/badge`, `/button`, `/card`, etc.) are imported globally across the codebase and are not at risk; they are listed but never marked orphan.

| Page | File | API routes | Component imports | Nav refs |
|---|---|---|---|---|
| `/admin/command-center` | `src\app\admin\command-center\page.tsx` | (none) | (none) | `src\components\layout\AdminSidebar.tsx` |
| `/admin/system-map` | `src\app\admin\system-map\page.tsx` | (none) | (none) | `src\app\admin\AdminNav.tsx` |
| `/admin/master-orchestrator` | `src\app\admin\master-orchestrator\page.tsx` | `/api/admin/master-orchestrator` | `@/components/ui/{badge,button,card,progress,tabs}` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx` |
| `/admin/monitoring` | `src\app\admin\monitoring\page.tsx` | `/api/admin/monitoring/{comprehensive,dashboard,synthetic}` | `@/components/ui/{alert,badge,button,card,progress,tabs}` | (none) |
| `/admin/mission-control` | `src\app\admin\mission-control\page.tsx` | `/api/admin/mission-control/{metrics,modules,pipeline,restart,templates}` | `@/components/ui/{badge,button,card,progress,tabs}` | (none) |
| `/admin/recipe-book-api` | `src\app\admin\recipe-book-api\page.tsx` | (none) | `@/components/ui/{badge,card}` | (none) |
| `/admin/recipes/leaderboard` | `src\app\admin\recipes\leaderboard\page.tsx` | (none) | (none) | (none) |
| `/admin/viral-recipe-book` | `src\app\admin\viral-recipe-book\page.tsx` | (none) | `@/components/admin/ScriptIntelligenceDashboard` ⚠️ ORPHAN; `@/components/admin/viral-recipe-book/{ABTestInterface,DraftsAnalyzer,InceptionMarketing,OptimizationEngine,PredictionDashboard,TemplateGallery,TemplateViewer,ValidationSystem}` ⚠️ all 8 ORPHAN; `@/components/ui/{badge,card,tabs,use-toast}` | `src\app\admin\AdminNav.tsx` |
| `/admin/template-analyzer` | `src\app\admin\template-analyzer\page.tsx` | (none) | `@/components/ui/{button,card,input,label}` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx` |
| `/admin/template-leaderboard` | `src\app\admin\template-leaderboard\page.tsx` | (none) | `@/components/ui/card` | (none) |
| `/admin/template-generator` | `src\app\admin\template-generator\page.js` | `/api/admin/template-generator/{run,runs,stats,templates,test}` | (none) | (none) |
| `/admin/value-template-editor` | `src\app\admin\value-template-editor\page.tsx` | (none) | `@/components/value-template-editor/{DynamicWorkspace,PhonePreview3D,ViralScoreDisplay}` ⚠️ all 3 ORPHAN; `@/components/value-template-editor/ViralVideoGallery` (2 importers — keep); `@/components/ui/{badge,button,card,progress}` | (none) |
| `/admin/viral-approval-queue` | `src\app\admin\viral-approval-queue\page.tsx` | (none) | (none) | (none) |
| `/admin/viral-filter` | `src\app\admin\viral-filter\page.tsx` | (none) | `@/components/ui/{badge,button,card,tabs}` | (none) |
| `/admin/viral-studio` | `src\app\admin\viral-studio\page.tsx` | (none) | (none) | (none) |
| `/admin/mvp/templates` | `src\app\admin\mvp\templates\page.tsx` | (none) | (none) | (none) |
| `/admin/marketing-inception` | `src\app\admin\marketing-inception\page.tsx` | (none) | `@/components/ui/{button,card}` | `src\app\admin\AdminNav.tsx` |
| `/admin/inception-studio` | `src\app\admin\inception-studio\page.tsx` | `/api/admin/inception-studio/{campaigns,generate}` | `@/components/ui/{badge,button,card,input,progress,select,tabs,textarea}` | (none) |
| `/admin/studio` | `src\app\admin\studio\page.tsx` | (none) | `@/components/admin/ValidationDashboard` ⚠️ ORPHAN | `src\app\admin\components\MasterNavigation.tsx`; `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx`; `src\components\navigation\master-nav.tsx`; `src\components\studio\NetflixSidebar.tsx`; `src\components\studio\StudioSidebar.tsx` (7 nav refs — most-linked page in the delete set) |
| `/admin/studio/script` | `src\app\admin\studio\script\page.tsx` | (none) | `@/components/ui/{badge,button,card,dialog,use-toast}` | (none) |
| `/admin/analytics` | `src\app\admin\analytics\page.tsx` | (none) | (none) | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/analytics/labels` | `src\app\admin\analytics\labels\page.tsx` | (none) | (none) | (none) |
| `/admin/analytics/windows` | `src\app\admin\analytics\windows\page.tsx` | (none) | (none) | (none) |
| `/admin/data-ingestion` | `src\app\admin\data-ingestion\page.tsx` | `/api/admin/data-ingestion` | `@/components/admin/DataIngestionDashboard` ⚠️ ORPHAN | (none) |
| `/admin/etl-dashboard` | `src\app\admin\etl-dashboard\page.tsx` | (none) | `@/components/admin/ETLJobStatus` ⚠️ ORPHAN; `@/components/ui/tabs` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/etl-status` | `src\app\admin\etl-status\page.tsx` | (none) | (none) | `src\app\admin\AdminNav.tsx` |
| `/admin/cross-intel` | `src\app\admin\cross-intel\page.tsx` | (none) | (none) | (none) |
| `/admin/process-intel` | `src\app\admin\process-intel\page.tsx` | (none) | `@/components/ui/{button,card}` | `src\app\admin\AdminNav.tsx` |
| `/admin/agent` | `src\app\admin\agent\page.tsx` | `/api/admin/agent/{diag,kill-switch,tasks}` | (none) | `src\app\admin\AdminNav.tsx` |
| `/admin/ai-brain` | `src\app\admin\ai-brain\page.tsx` | `/api/admin/ai-brain`; `/api/admin/ai-brain/{apply,frameworks,history}` | `@/components/admin/AiBrainInterface` ⚠️ ORPHAN | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/llm-console` | `src\app\admin\llm-console\page.tsx` | (none) | (none) | (none) |
| `/admin/orchestrator` | `src\app\admin\orchestrator\page.tsx` | (none) | `@/components/ui/{badge,card}` | (none) |
| `/admin/coach` | `src\app\admin\coach\page.tsx` | `/api/admin/coach/{generate_variants,suggest_edits}` | (none) | (none) |
| `/admin/scale` | `src\app\admin\scale\page.tsx` | (none) | (none) | (none) |
| `/admin/alignment` | `src\app\admin\alignment\page.tsx` | (none) | (none) | (none) |
| `/admin/draft-analyzer` | `src\app\admin\draft-analyzer\page.tsx` | (none) | `@/components/ui/{button,card}` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx` |
| `/admin/drafts-analyzer` | `src\app\admin\drafts-analyzer\page.tsx` | (none) | `@/components/ui/{badge,button,card,input,textarea}` | (none) |
| `/admin/advisor-service` | `src\app\admin\advisor-service\page.tsx` | (none) | `@/components/ui/{badge,card}` | (none) |
| `/admin/dna-detective` | `src\app\admin\dna-detective\page.tsx` | (none) | `@/components/ui/{badge,card}` | (none) |
| `/admin/feature-decomposer` | `src\app\admin\feature-decomposer\page.tsx` | (none) | `@/components/ui/{badge,button,card,tabs}` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\app\admin\AdminNav.tsx` |
| `/admin/feedback-ingest` | `src\app\admin\feedback-ingest\page.tsx` | (none) | `@/components/ui/{badge,card}` | (none) |
| `/admin/gene-tagger` | `src\app\admin\gene-tagger\page.tsx` | (none) | `@/components/ui/{badge,button,card,tabs}` | `src\app\admin\AdminNav.tsx` |
| `/admin/users` | `src\app\admin\users\page.tsx` | (none) | (none) | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/limited-users` | `src\app\admin\limited-users\page.tsx` | `/api/admin/limited-users`; `/api/admin/limited-users/{activities,bulk-grant,stats,update}` | `@/components/ui/{badge,button,card,dialog,input,select,tabs,textarea}` | (none) |
| `/admin/super-admin-live` | `src\app\admin\super-admin-live\page.tsx` | (none) | `@/components/ViralFeed` (3 importers — keep) | (none) |
| `/admin/settings/analyzer` | `src\app\admin\settings\analyzer\page.tsx` | (none) | `@/components/ui/{checkbox,input,spinner,ui-compatibility,use-toast}` (`spinner` is count=1 ⚠️ ORPHAN) | (none) |
| `/admin/security` | `src\app\admin\security\page.tsx` | `/api/admin/security/{dashboard,events}` | `@/components/ui/{alert,badge,button,card,progress,tabs}` | (none) |
| `/admin/error-logs` | `src\app\admin\error-logs\page.tsx` | (none) | `@/components/ui/{badge,button,card,input,textarea}` | (none) |
| `/admin/diagnostics` | `src\app\admin\diagnostics\page.tsx` | (none) | (none) | (none) |
| `/admin/feature-flags` | `src\app\admin\feature-flags\page.tsx` | (none) | (none) | (none) |
| `/admin/flags` | `src\app\admin\flags\page.tsx` | `/api/admin/flags`; `/api/admin/flags/{bootstrap_beta1,get,list,set}` | (none) | (none) |
| `/admin/workflow-dashboard` | `src\app\admin\workflow-dashboard\page.tsx` | (none) | `@/components/ui/{badge,button,card,progress}`; `@/components/unified-shell/UnifiedShell` (2 importers — keep) | (none) |
| `/admin/checklist` | `src\app\admin\checklist\page.tsx` | (none) | (none) | (none) |
| `/admin/integration` | `src\app\admin\integration\page.tsx` | `/api/admin/integration/*` (61 routes — see RISK FLAGS) | (none) | `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx`; `src\components\admin\navigation-config.ts` |
| `/admin/mvp` | `src\app\admin\mvp\page.tsx` | (none) | (none) | (none) |
| `/admin/mvp/settings` | `src\app\admin\mvp\settings\page.tsx` | (none) | (none) | (none) |
| `/admin/newsletter` | `src\app\admin\newsletter\page.tsx` | (none) | `@/components/newsletter/WeeklyTrendingSounds` ⚠️ ORPHAN; `@/components/ui/{button,card-component,input,separator,tabs}` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/research-review` | `src\app\admin\research-review\page.tsx` | (none) | (none) | (none) |
| `/admin/analysis` | `src\app\admin\analysis\page.tsx` | (none) | (none) | (none) |
| `/admin/baselines` | `src\app\admin\baselines\page.tsx` | `/api/admin/baselines/{metrics_30d,run-now,summary}` | `@/components/ui/{button,card}` | `src\app\admin\AdminNav.tsx` |
| `/admin/compare-runs` | `src\app\admin\compare-runs\page.tsx` | (none) | (none) | (none) |
| `/admin/drift` | `src\app\admin\drift\page.tsx` | `/api/admin/drift/{importance,run-now}` | `@/components/ui/card` | (none) |
| `/admin/ecom` | `src\app\admin\ecom\page.tsx` | `/api/admin/ecom/control-room/session`; `/api/admin/ecom/control-room/session/[id]`; `/api/admin/ecom/control-room/session/[id]/event`; `/api/admin/ecom/forecast`; `/api/admin/ecom/ingest`; `/api/admin/ecom/products/[id]/live-recipe` | (none) | `src\app\admin\components\MasterNavigation.tsx` |
| `/admin/ecom/[productId]` | `src\app\admin\ecom\[productId]\page.tsx` | (none) | (none) | (none) |
| `/admin/experiments` | `src\app\admin\experiments\page.tsx` | (none) | (none) | (none) |
| `/admin/federated` | `src\app\admin\federated\page.tsx` | (none) | `@/components/ui/card` | (none) |
| `/admin/framework-reservoir` | `src\app\admin\framework-reservoir\page.tsx` | (none) | (none) | (none) |
| `/admin/gold-set` | `src\app\admin\gold-set\page.tsx` | (none) | (none) | (none) |
| `/admin/guardrails` | `src\app\admin\guardrails\page.tsx` | (none) | (none) | (none) |
| `/admin/insights` | `src\app\admin\insights\page.tsx` | (none) | (none) | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx`; `src\components\layout\AdminSidebar.tsx` |
| `/admin/moat` | `src\app\admin\moat\page.tsx` | (none) | (none) | (none) |
| `/admin/component-test` | `src\app\admin\component-test\page.tsx` | (none) | (none) | (none) |
| `/admin/testing-accuracy` | `src\app\admin\testing-accuracy\page.tsx` | (none) | (none) | (none) |
| `/admin/flipboard` | `src\app\admin\flipboard\page.tsx` | `/api/admin/flipboard/{apply,flags,migrate,preview,status}` | (none) | `src\components\layout\AdminSidebar.tsx` |
| `/admin/expert-dashboard` | (file does not exist) | (none) | (none) | (none) |

---

## SUMMARY

| Metric | Count |
|---|---:|
| Pages listed | 75 |
| Pages that exist as page files | 74 |
| Pages truly absent (no file at all) | 1 (`/admin/expert-dashboard`) |
| Total API routes that would orphan with their pages | **117** (1 + 3 + 5 + 5 + 2 + 1 + 3 + 4 + 2 + 5 + 2 + 5 + 61 + 3 + 2 + 6 + 5 = sum across 17 pages with API routes) |
| Components that would orphan if these pages are deleted | **18** (see Orphan-component list below) |
| Total nav reference points needing update | **22** distinct entries across 7 nav files (see Nav-update list below) |

### Orphan components (count == 1, only the listed page imports them)

| Component | Used by page | Orphan if page deleted |
|---|---|---|
| `@/components/admin/ScriptIntelligenceDashboard` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/ABTestInterface` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/DraftsAnalyzer` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/InceptionMarketing` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/OptimizationEngine` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/PredictionDashboard` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/TemplateGallery` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/TemplateViewer` | `/admin/viral-recipe-book` | YES |
| `@/components/admin/viral-recipe-book/ValidationSystem` | `/admin/viral-recipe-book` | YES |
| `@/components/value-template-editor/DynamicWorkspace` | `/admin/value-template-editor` | YES |
| `@/components/value-template-editor/PhonePreview3D` | `/admin/value-template-editor` | YES |
| `@/components/value-template-editor/ViralScoreDisplay` | `/admin/value-template-editor` | YES |
| `@/components/admin/ValidationDashboard` | `/admin/studio` | YES |
| `@/components/admin/DataIngestionDashboard` | `/admin/data-ingestion` | YES (also referenced by `master-agent-orchestrator.ts` and `integration-validation-system.ts`, but only as URL strings — see Risk flags) |
| `@/components/admin/ETLJobStatus` | `/admin/etl-dashboard` | YES |
| `@/components/admin/AiBrainInterface` | `/admin/ai-brain` | YES |
| `@/components/ui/spinner` | `/admin/settings/analyzer` | YES (only one importer despite living in `ui/` — unusual; double-check before treating as a UI primitive) |
| `@/components/newsletter/WeeklyTrendingSounds` | `/admin/newsletter` | YES |

### Nav files that need updating (22 link entries across 7 nav files)

| Nav file | Pages that link from this file (need removal/redirect) |
|---|---|
| `src\app\admin\AdminNav.tsx` | `/admin/system-map`, `/admin/viral-recipe-book`, `/admin/marketing-inception`, `/admin/etl-dashboard`, `/admin/etl-status`, `/admin/process-intel`, `/admin/agent`, `/admin/feature-decomposer`, `/admin/gene-tagger`, `/admin/users`, `/admin/newsletter`, `/admin/integration`, `/admin/baselines`, `/admin/studio` (14 pages) |
| `src\app\admin\super-admin-components\SuperAdminSidebar.tsx` | `/admin/master-orchestrator`, `/admin/template-analyzer`, `/admin/etl-dashboard`, `/admin/feature-decomposer`, `/admin/users`, `/admin/draft-analyzer`, `/admin/ai-brain`, `/admin/analytics`, `/admin/insights`, `/admin/newsletter`, `/admin/studio` (11 pages) |
| `src\components\layout\AdminSidebar.tsx` | `/admin/command-center`, `/admin/etl-dashboard`, `/admin/users`, `/admin/ai-brain`, `/admin/analytics`, `/admin/insights`, `/admin/newsletter`, `/admin/integration`, `/admin/flipboard`, `/admin/studio` (10 pages) |
| `src\components\admin\navigation-config.ts` | `/admin/integration` (1) |
| `src\app\admin\components\MasterNavigation.tsx` | `/admin/ecom`, `/admin/studio` (2) |
| `src\components\navigation\master-nav.tsx` | `/admin/studio` (1) |
| `src\components\studio\NetflixSidebar.tsx` | `/admin/studio` (1) |
| `src\components\studio\StudioSidebar.tsx` | `/admin/studio` (1) |

(`/admin/studio` is the most-linked delete page — appears in 7 nav files.)

---

## RISK FLAGS — API routes consumed by KEPT files

These are API routes attached to delete pages BUT also called from files that are NOT in any delete-page directory. If the API route is removed alongside its delete page, the kept-side caller will break.

| Risk level | API route | Kept-side consumer(s) | What happens if route is deleted |
|---|---|---|---|
| 🔴 HIGH | `/api/admin/integration/status` | `src\app\admin\super-admin-components\IntegrationHealthCard.tsx`; `src\app\admin\AdminNav.tsx`; `src\components\layout\AdminSidebar.tsx` (plus 2 intra-API references in `dryrun_transcripts/route.ts` and `readiness_report/route.ts`) | Sidebar IntegrationHealthCard breaks; AdminNav status indicator breaks; AdminSidebar status indicator breaks. **5 kept-side consumers** — highest blast radius in the set. |
| 🔴 HIGH | `/api/admin/flipboard/apply` | `src\app\admin\super-admin-components\Flipboard.tsx` | Flipboard component (in super-admin-components, not in a delete page) loses its apply call. |
| 🔴 HIGH | `/api/admin/flipboard/flags` | `src\app\admin\super-admin-components\Flipboard.tsx` | Same Flipboard component — flag fetching breaks. |
| 🔴 HIGH | `/api/admin/flipboard/preview` | `src\app\admin\super-admin-components\Flipboard.tsx` | Same — preview rendering breaks. |
| 🔴 HIGH | `/api/admin/flipboard/status` | `src\app\admin\super-admin-components\Flipboard.tsx` | Same — status polling breaks. **4 of the 5 flipboard API routes are consumed by Flipboard.tsx in super-admin-components**, which is NOT in a delete page. Deleting the API routes would break this kept component. |
| 🟠 MEDIUM | `/api/admin/master-orchestrator` | `src\app\admin\super-admin-components\SuperAdminSidebar.tsx` | SuperAdminSidebar (kept) loses one of its links/calls. |
| 🟠 MEDIUM | `/api/admin/ai-brain` | `src\lib\services\ai-brain.service.ts`; `src\lib\services\master-agent-orchestrator.ts` | `ai-brain.service.ts` is a lib service (not a page) — if it calls this URL, deleting the route breaks the service. |
| 🟠 MEDIUM | `/api/admin/ai-brain/apply` | `src\lib\services\ai-brain.service.ts`; `src\lib\services\master-agent-orchestrator.ts` | Same. |
| 🟠 MEDIUM | `/api/admin/ai-brain/frameworks` | `src\lib\services\ai-brain.service.ts` | Same. |
| 🟠 MEDIUM | `/api/admin/ai-brain/history` | `src\lib\services\ai-brain.service.ts` | Same. The 4 `ai-brain` URLs together are wired into `ai-brain.service.ts` — that service must also be deleted (or its calls neutralized) to safely remove the API routes. |
| 🟠 MEDIUM | `/api/admin/template-generator/run` | `src\app\api\admin\pipeline-actions\route.ts`; `src\app\api\admin\template-generator\runs\route.ts`; `src\lib\services\integration-validation-system.ts`; `src\lib\services\master-agent-orchestrator.ts` | 4 kept-side consumers including a pipeline-actions API route and the master orchestrator service. |
| 🟠 MEDIUM | `/api/admin/inception-studio/generate` | `src\lib\services\integration-validation-system.ts`; `src\lib\services\master-agent-orchestrator.ts` | Two lib services reference the URL. |
| 🟠 MEDIUM | `/api/admin/data-ingestion` | `src\components\admin\DataIngestionDashboard.tsx`; `src\lib\services\integration-validation-system.ts`; `src\lib\services\master-agent-orchestrator.ts` | `DataIngestionDashboard` is itself an orphan-if-page-deleted component (only the data-ingestion page imports it), so the component's reference to this URL is moot if both go together. But `integration-validation-system.ts` and `master-agent-orchestrator.ts` are kept lib services. |
| 🟠 MEDIUM | `/api/admin/mission-control/metrics` | `src\lib\services\master-agent-orchestrator.ts` | One lib service references the URL. |
| 🟡 LOW | `/api/admin/integration/dryrun` | `src\app\api\admin\integration\readiness_report\route.ts` | One intra-API reference. (Both routes belong to the integration set; deleting the parent dir is consistent.) |
| 🟡 LOW | `/api/admin/integration/readiness_report` | `src\app\api\admin\integration\dryrun_full\route.ts` | Same — intra-API reference. |
| 🟡 LOW | `/api/admin/baselines/summary` | `src\app\api\docs\admin\v1\route.ts` | The admin v1 docs route references this URL. If `/admin/baselines` page is deleted but `/api/admin/baselines/summary` is kept, no risk. If the route is also deleted, the docs route's mention of it should be cleaned up but won't crash anything (it's a docs string, likely). |

### Summary of risk

- **One lib service is heavily entangled with delete-page APIs**: `src\lib\services\master-agent-orchestrator.ts` references **6 distinct delete-page API URLs** (`mission-control/metrics`, `template-generator/run`, `inception-studio/generate`, `data-ingestion`, `ai-brain`, `ai-brain/apply`). That service is the single biggest risk concentration. Anyone deleting these API routes needs to either also delete `master-agent-orchestrator.ts` or remove its calls.
- **`integration-validation-system.ts`** also references 3 delete-page URLs (template-generator/run, inception-studio/generate, data-ingestion).
- **`ai-brain.service.ts`** is wired entirely to `/api/admin/ai-brain*` — those 4 routes and this service are a tightly coupled unit.
- **`Flipboard.tsx`** in `super-admin-components` is wired to 4 of the 5 flipboard API routes. Deleting the routes without also addressing Flipboard.tsx will break the kept super-admin sidebar.
- **`IntegrationHealthCard.tsx`** + **`AdminNav.tsx`** + **`AdminSidebar.tsx`** all reference `/api/admin/integration/status`. Deleting the integration page is fine, but **keep `/api/admin/integration/status/route.ts`** unless those three kept files are also updated.

### Recommended consolidation rule of thumb

For any delete-page that has a 🔴 HIGH or 🟠 MEDIUM risk flag above, the delete plan must also include either:
1. Updating the kept-side consumer to no longer call the URL, or
2. Keeping the API route (delete the page only, not the API), or
3. Deleting the entangled lib service / kept component as well.

Pages with **no risk flags** (their API routes have no kept-side consumers): `/admin/monitoring`, `/admin/mission-control` (4 of 5 sub-routes), `/admin/inception-studio/campaigns`, `/admin/agent`, `/admin/coach`, `/admin/limited-users`, `/admin/security`, `/admin/flags`, `/admin/integration` (preflight, replay_apify, inspect_ingestion_window, proof/latest), `/admin/drift`, `/admin/ecom` (all sub-routes).

— end of dependency map —
