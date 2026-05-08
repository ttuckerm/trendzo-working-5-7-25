# Reverse Import Breakage Scan — 2026-05-04

**Scope:** read-only diagnostic. Phase 4 deleted 71 admin page directories. The
original dependency map only checked imports *out of* admin pages. This scan
checks imports *into* the deleted paths from the rest of `src/`.

**Pre-flight:**
- Branch: `vercel-deploy-test` ✅
- `git status --short`: 169 entries, 96 deletions (spec said 134+). **3 of the
  71 paths have been restored since Phase 4 — see "Restored paths" below.**

**Restored paths (references to these are NOT broken right now):**
- `src/app/admin/viral-studio/`
- `src/app/admin/studio/`
- `src/app/admin/(studio)/`

All other 68 paths are still deleted. Findings below count only references
whose target is **currently deleted**.

---

## CRITICAL — page / layout / API route files (will execute in production)

| Importing file | Type | Deleted target |
|---|---|---|
| `src/app/membership/viral-recipe-book/page.tsx:7` | dynamic import | `@/app/admin/viral-recipe-book/page` |
| `src/app/admin/studio/script/page.tsx:41` | router.replace | `/admin/viral-recipe-book?starter=on` |
| `src/app/admin/marketing-studio/page.tsx:219` | Link href | `/admin/analytics` |
| `src/app/admin/recipe-book/page.tsx:90` | window.location.href | `/admin/coach` |
| `src/app/admin/viral-studio/layout.tsx:17` | href | `/admin/viral-recipe-book` |
| `src/app/qa/visual/page.tsx:105` | iframe.src | `/admin/viral-recipe-book` |
| `src/app/api/admin/test-ui-integration/route.ts:93` | URL string in response | `/admin/super-admin-live` |
| `src/app/api/admin/test-ui-integration/route.ts:99` | URL string in response | `/admin/command-center` |
| `src/app/api/system-health/errors/route.ts:45` | sourcePath | `/admin/component-test` |

**9 broken references across 8 files.** Note: `viral-studio/layout.tsx` is a kept layout (viral-studio was restored) but its href still targets a deleted page.

---

## HIGH — components / lib / services / contexts / middleware / workflow

### Layout / nav components (rendered on every admin page)

| Importing file | Type | Deleted target |
|---|---|---|
| `src/components/layout/AdminHeader.tsx:68` | Link href (desktop) | `/admin/insights` |
| `src/components/layout/AdminHeader.tsx:74` | Link href (desktop) | `/admin/analytics` |
| `src/components/layout/AdminHeader.tsx:80` | Link href (desktop) | `/admin/ai-brain` |
| `src/components/layout/AdminHeader.tsx:86` | Link href (desktop) | `/admin/etl-dashboard` |
| `src/components/layout/AdminHeader.tsx:194` | Link href (mobile) | `/admin/insights` |
| `src/components/layout/AdminHeader.tsx:204` | Link href (mobile) | `/admin/analytics` |
| `src/components/layout/AdminHeader.tsx:214` | Link href (mobile) | `/admin/users` |
| `src/components/layout/AdminHeader.tsx:244` | Link href (mobile) | `/admin/template-analyzer` |
| `src/components/layout/AdminHeader.tsx:251` | Link href (mobile) | `/admin/newsletter` |
| `src/components/layout/AdminHeader.tsx:258` | Link href (mobile) | `/admin/ai-brain` |
| `src/components/layout/AdminHeader.tsx:268` | Link href (mobile) | `/admin/etl-dashboard` |
| `src/components/layout/AdminSidebar.tsx:296` | href | `/admin/command-center/validation` |
| `src/components/layout/AdminSidebar.tsx:299` | pathname check | `/admin/command-center/validation` |
| `src/components/layout/Footer.tsx:41` | Link href | `/admin/template-analyzer` |
| `src/app/admin/components/GlobalHeader.tsx:23` | switch case | `/admin/command-center` |
| `src/app/admin/components/GlobalHeader.tsx:33` | pathname.startsWith | `/admin/command-center` |

### Studio / template / dashboard components

| Importing file | Type | Deleted target |
|---|---|---|
| `src/components/studio/TemplateGallery.tsx:206` | Link href | `/admin/viral-recipe-book` |
| `src/components/studio/StudioControls.tsx:49` | Link href | `/admin/viral-recipe-book` |
| `src/components/templateMiniUI/RightRailShell.tsx:27` | deepLinkHref | `/admin/viral-recipe-book` |
| `src/components/admin/viral-recipe-book/TemplateViewer.tsx:209` | href | `/admin/viral-recipe-book` |
| `src/components/dashboard/QuickActions.tsx:50` | route | `/admin/analysis` |
| `src/app/admin/super-admin-components/QuickActionsDashboard.tsx:27` | router.push | `/admin/analytics` |
| `src/app/admin/super-admin-components/QuickActionsDashboard.tsx:33` | router.push | `/admin/analytics` |
| `src/app/admin/super-admin-components/QuickActionsDashboard.tsx:45` | router.push | `/admin/analytics` |
| `src/app/admin/super-admin-components/QuickActionsDashboard.tsx:51` | router.push | `/admin/ai-brain` |
| `src/app/admin/super-admin-components/QuickActionsDashboard.tsx:57` | router.push | `/admin/newsletter` |

### Middleware / context / workflow

| Importing file | Type | Deleted target |
|---|---|---|
| `src/middleware/viralPredictionSecurity.ts:162` | path list entry | `/admin/mission-control` |
| `src/middleware/viralPredictionSecurity.ts:164` | path list entry | `/admin/inception-studio` |
| `src/middleware/viralPredictionSecurity.ts:165` | path list entry | `/admin/limited-users` |
| `src/contexts/GlobalBrainContext.tsx:151` | mapping key | `/admin/ai-brain` |
| `src/contexts/GlobalBrainContext.tsx:154` | mapping key | `/admin/analytics` |
| `src/contexts/GlobalBrainContext.tsx:156` | mapping key | `/admin/users` |
| `src/workflow/url.ts:18` | allowedStarterRoutes entry | `/admin/viral-recipe-book` |
| `src/workflow/routeGuards.ts:18` | DENY list entry (dead) | `/admin/viral-recipe-book` |
| `src/workflow/routeGuards.ts:22` | DENY list entry (dead) | `/admin/analytics` |
| `src/workflow/routeGuard.ts:9` | conditional pathname check | `/admin/viral-recipe-book` |

### Service config (uiPath / uiPaths route registries)

| Importing file | Type | Deleted target |
|---|---|---|
| `src/lib/control-center/constants.ts:19` | path | `/admin/component-test` |
| `src/lib/control-center/constants.ts:135` | path | `/admin/error-logs` |
| `src/lib/services/integration-validation-system.ts:72` | uiPath | `/admin/template-analyzer` |
| `src/lib/services/integration-validation-system.ts:81` | uiPath | `/admin/data-ingestion` |
| `src/lib/services/integration-validation-system.ts:92` | uiPath | `/admin/dna-detective` |
| `src/lib/services/integration-validation-system.ts:101` | uiPath | `/admin/feature-decomposer` |
| `src/lib/services/integration-validation-system.ts:110` | uiPath | `/admin/gene-tagger` |
| `src/lib/services/integration-validation-system.ts:130` | uiPath | `/admin/template-generator` |
| `src/lib/services/integration-validation-system.ts:139` | uiPath | `/admin/inception-studio` |
| `src/lib/services/integration-validation-system.ts:148` | uiPath | `/admin/viral-filter` |
| `src/lib/services/integration-validation-system.ts:188` | uiPath | `/admin/feedback-ingest` |
| `src/lib/services/integration-validation-system.ts:197` | uiPath | `/admin/advisor-service` |
| `src/lib/services/integration-validation-system.ts:207` | uiPath | `/admin/mission-control` |
| `src/lib/services/master-agent-orchestrator.ts:99` | uiPath | `/admin/template-analyzer` |
| `src/lib/services/master-agent-orchestrator.ts:109` | uiPath | `/admin/data-ingestion` |
| `src/lib/services/master-agent-orchestrator.ts:121` | uiPath | `/admin/dna-detective` |
| `src/lib/services/master-agent-orchestrator.ts:131` | uiPath | `/admin/feature-decomposer` |
| `src/lib/services/master-agent-orchestrator.ts:141` | uiPath | `/admin/gene-tagger` |
| `src/lib/services/master-agent-orchestrator.ts:163` | uiPath | `/admin/template-generator` |
| `src/lib/services/master-agent-orchestrator.ts:173` | uiPath | `/admin/inception-studio` |
| `src/lib/services/master-agent-orchestrator.ts:183` | uiPath | `/admin/viral-filter` |
| `src/lib/services/master-agent-orchestrator.ts:227` | uiPath | `/admin/feedback-ingest` |
| `src/lib/services/master-agent-orchestrator.ts:237` | uiPath | `/admin/advisor-service` |
| `src/lib/services/master-agent-orchestrator.ts:253` | uiPaths array entry | `/admin/etl-dashboard` |
| `src/lib/services/master-agent-orchestrator.ts:273` | uiPaths array entry | `/admin/template-generator` |
| `src/lib/services/master-agent-orchestrator.ts:273` | uiPaths array entry | `/admin/template-analyzer` |
| `src/lib/services/master-agent-orchestrator.ts:283` | uiPaths array entry | `/admin/orchestrator` |
| `src/lib/services/master-agent-orchestrator.ts:303` | uiPaths array entry | `/admin/framework-reservoir` |
| `src/lib/services/master-agent-orchestrator.ts:313` | uiPaths array entry | `/admin/ai-brain` |
| `src/lib/services/master-agent-orchestrator.ts:323` | uiPaths array entry | `/admin/etl-status` |
| `src/lib/services/master-agent-orchestrator.ts:343` | uiPaths array entry | `/admin/command-center` |
| `src/lib/services/master-agent-orchestrator.ts:343` | uiPaths array entry | `/admin/mission-control` |
| `src/lib/services/master-agent-orchestrator.ts:343` | uiPaths array entry | `/admin/super-admin-live` |

**HIGH total: 69 broken references across 18 files.**

---

## MEDIUM — tests and scripts

| Importing file | Type | Deleted target |
|---|---|---|
| `src/__tests__/pages/leaderboard.page.test.tsx:4` | static import | `@/app/admin/recipes/leaderboard/page` |
| `src/__tests__/pages/admin.scale.page.test.tsx:3` | static import | `@/app/admin/scale/page` |
| `src/__tests__/pages/admin.cross_intel.page.test.tsx:4` | static import | `@/app/admin/cross-intel/page` |
| `src/__tests__/integration/instant_analysis.page.test.tsx:2` | static import | `@/app/admin/analysis/page` |
| `src/__tests__/unit/routeGuards.test.ts:41` | string literal under test | `/admin/viral-recipe-book` |
| `src/__tests__/unit/routeGuards.test.ts:46` | string literal under test | `/admin/analytics` |
| `src/__tests__/unit/routeGuard.test.ts:4` | string literal under test | `/admin/viral-recipe-book` |

**MEDIUM total: 7 broken references across 6 files.**

---

## LOW — documentation

| Importing file | Type | Deleted target |
|---|---|---|
| `src/lib/modules/README-Orchestrator.md:359` | docs link | `/admin/error-logs` |
| `src/lib/modules/README-DNA-Detective.md:220` | docs link | `/admin/error-logs` |
| `src/lib/etl/README.md:108` | docs paragraph | `/admin/etl-dashboard` |

**LOW total: 3 broken references across 3 files.**

---

## Totals

- **Total broken references: 88**
  - CRITICAL: 9
  - HIGH: 69
  - MEDIUM: 7
  - LOW: 3
- **Total files affected: 35**
  - CRITICAL: 8
  - HIGH: 18
  - MEDIUM: 6
  - LOW: 3

---

## URLs that will 500 in production right now

Strictly "throw at request time" pages — the only one is the dynamic-import case:

- **`/membership/viral-recipe-book`** — `src/app/membership/viral-recipe-book/page.tsx`
  dynamically imports `@/app/admin/viral-recipe-book/page`, which is a deleted
  module. Module resolution will fail at request time and the page will throw.

All other broken references will fail with **404** (link/redirect/router.push to
deleted route) or **silent dead-config** (uiPath/middleware/context entries that
never match a live path). Those don't 500, but they break navigation flows. See
"Surprises" #1 for the worst offender.

---

## Test files now broken (MEDIUM group)

1. `src/__tests__/pages/leaderboard.page.test.tsx`
2. `src/__tests__/pages/admin.scale.page.test.tsx`
3. `src/__tests__/pages/admin.cross_intel.page.test.tsx`
4. `src/__tests__/integration/instant_analysis.page.test.tsx`
5. `src/__tests__/unit/routeGuards.test.ts`
6. `src/__tests__/unit/routeGuard.test.ts`

Files 1–4 statically import deleted page modules — the module-resolution failure
will surface as a Jest "Cannot find module" error before any test runs. Files 5–6
test string-literal pathnames; the assertions still pass syntactically, but they
now assert behavior over routes that no longer exist.

---

## Surprises

1. **`next.config.mjs` has 4 PERMANENT redirects targeting deleted pages.**
   Outside the strict `src/` scan scope, but critical to flag:
   - `/admin/recipe-book` → `/admin/viral-recipe-book` *(KEPT page redirected to a DELETED page → 404)*
   - `/admin/recipe-book/:path*` → `/admin/viral-recipe-book` *(same)*
   - `/admin/template-analyzer` → `/admin/viral-recipe-book?tab=analyzer`
   - `/admin/template-analyzer/:path*` → `/admin/viral-recipe-book?tab=analyzer`

   The `recipe-book` case is the worst: `recipe-book` is on the kept-pages list,
   but `next.config.mjs` lines 222–230 silently route every visit to it to the
   deleted `viral-recipe-book`. With `permanent: true`, browsers will cache the
   redirect, making rollback messier than just restoring the page.

2. **`AdminHeader.tsx` was missed by Phase 3 nav cleanup.** It is *not* in the
   list of 7 modified nav files, yet it has **11 dead Link hrefs** across the
   desktop nav (lines 68–86) and mobile menu (lines 194–268). This component
   renders on every admin route.

3. **`AdminSidebar.tsx` *was* in the Phase 3 modified set but still has dead
   refs at lines 296, 299** (`/admin/command-center/validation`). Phase 3 did
   not fully scrub it.

4. **Two large service-discovery configs (`integration-validation-system.ts` +
   `master-agent-orchestrator.ts`) carry 31 dead `uiPath`/`uiPaths` entries
   between them.** Whatever consumer iterates these will get phantom services
   pointing at 404s. These weren't on the dependency map either.

5. **The 3 restored paths (`viral-studio`, `studio`, `(studio)`) are masking
   additional breakage.** If any of them get re-deleted, these references
   become broken too:
   - `src/app/membership/studio/page.tsx` (dynamic import → would 500)
   - `src/components/studio/VideoCard.tsx` (type import from `(studio)/studio/page`)
   - `src/components/studio/VideoAnalysisPanel.tsx` (type import from `(studio)/studio/page`)
   - `src/app/admin/studio/components/ViralWorkflowTab.tsx` (imports `viral-studio/page`)
   - `src/app/admin/studio/components/TemplateLibraryTab.tsx` (imports `viral-studio/components/phases/GalleryPhase`)
   - Plus ~20 URL-string refs in dashboards, sidebars, and route-guard configs
     that point at `/admin/studio/...` or `/admin/viral-studio`.

6. **Kept admin pages link out to deleted admin pages.** Three KEPT pages contain
   navigation to DELETED targets (CRITICAL group above):
   - `admin/recipe-book/page.tsx` → `/admin/coach` (click handler)
   - `admin/marketing-studio/page.tsx` → `/admin/analytics` (Link)
   - `admin/studio/script/page.tsx` → `/admin/viral-recipe-book` (router.replace
     fired in a useEffect — likely the *primary* flow path)

7. **Two API routes return URL strings pointing at deleted admin pages**
   (`api/admin/test-ui-integration/route.ts`, `api/system-health/errors/route.ts`).
   These won't crash, but any client consuming the response and following the
   URL will 404.

8. **The `comprehensive-database-report.js` at the repo root references
   `/api/admin/template-generator`** — but per Decisions 1–3, API routes were
   intentionally kept, so this isn't broken. Flagging only because it surfaced
   in the scan.

9. **`ADMIN_ROUTE_AUDIT_2026-04-30.md` at the repo root has 50+ references** to
   the deleted admin paths, all in prose/listing form. Documentation-only, but
   it's now stale.
