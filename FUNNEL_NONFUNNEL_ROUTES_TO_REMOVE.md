# Non-Funnel Route Removal Map — Build-Time Risk Audit

**Branch:** `funnel-deploy-techyai`
**Date:** 2026-05-16
**Mode:** Read-only investigation. No source files modified.
**Purpose:** Catalog every `page.tsx` / `route.ts` / `page.jsx` / `route.js` / `route.tsx` outside the funnel allowlist, classify build-time risk, and produce a directory-level deletion plan.

---

## 0. CRITICAL CLARIFICATION ABOUT `force-dynamic`

Before reading the buckets below, understand this: **`export const dynamic = 'force-dynamic'` does NOT defer module-level code evaluation. It only defers handler execution.**

The task brief's Step 5 said "SAFE = ... declares `force-dynamic`. The build won't try to evaluate this at collect time." That premise is contradicted by direct evidence in this repo:

- `src/app/api/admin/extract-genomes/route.ts` declares `export const dynamic = 'force-dynamic'` on line 16, AND ALSO calls `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)` at module top-level (lines 18-21). The user reports this route "just" failed the Vercel build with the same `supabaseUrl is required` error as `/public/score`. Same failure mode. `force-dynamic` did not save it.

**Why:** During Vercel's `Generating static pages` and webpack-trace phases, Next 14.2 *imports* every route module to discover its exports. The `import` evaluates module top-level code. `createClient(undefined, undefined)` is reached during that import. The Supabase SDK throws synchronously at construction when the URL is empty. Boom — build fails. `force-dynamic` only kicks in after module evaluation succeeds, when Next decides whether to prerender.

This audit therefore treats **module-level construction with `process.env.X!` (non-null assertion) or other env-required arguments as RISKY regardless of whether `force-dynamic` is set.** The 107 routes in the RISKY bucket below all match this pattern.

The previously-deleted `/public/score` was a slightly different pattern (it imported from `@/lib/env` which has empty-string fallbacks, so the failure was deeper in its dependency chain) but the root cause is the same: top-level code that throws when env is missing.

---

## 1. Verified Funnel Allowlist

Source of truth: `src/middleware.ts`, `FUNNEL_ALLOWLIST` constant (lines 33-43).

### Page routes preserved
| Route URL | Filesystem path |
|---|---|
| `/` (exact) | `src/app/page.tsx` |
| `/welcome` (prefix) | `src/app/(public)/welcome/page.tsx` |
| `/free/freedom-os` (prefix) | `src/app/(public)/free/freedom-os/page.tsx` + descendants |
| `/assessment/<id>` (prefix `/assessment/`) | `src/app/assessment/[assessmentId]/page.tsx` + descendants |

Also preserved: `src/app/layout.tsx`, `src/app/middleware.ts`, `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/globals.css`, `src/app/providers.tsx`, `src/app/_app.tsx`, `src/app/_supabase-url-shim.tsx`, `src/app/DevelopmentProviders.tsx`, `src/app/favicon.ico`, `src/app/icon.svg`, `src/app/px.gif` (the *image asset*, not the route — see below).

**Route groups in use:** `(auth)`, `(dev)`, `(public)`. Only `(public)` contains funnel routes. The other two groups are entirely deletable.

### API routes preserved
| Route URL | Filesystem path |
|---|---|
| `/api/landing/*` | `src/app/api/landing/**/route.ts` |
| `/api/checkout/*` | `src/app/api/checkout/**/route.ts` |
| `/api/assessment/*` | `src/app/api/assessment/**/route.ts` |
| `/api/freedom-agent/chat` + descendants | `src/app/api/freedom-agent/chat/route.ts` |
| `/api/freedom-agent/conversation` + descendants | `src/app/api/freedom-agent/conversation/route.ts` |

> **DISCREPANCY WITH BRIEF:** The task brief listed "Anything under `src/app/api/freedom-agent/**`" as preserved. The actual middleware only allows `/api/freedom-agent/chat` and `/api/freedom-agent/conversation`. The other four routes — `history`, `session`, `unsubscribe`, `weekly-checkin` — are **NOT** in the allowlist and will 404 at runtime under `DEPLOY_TARGET=funnel`. They're treated as non-funnel below. If you actually need them, fix the middleware first.

---

## 2. Enumeration of Non-Allowlist Route Files

Scan: `find src/app -name "page.tsx" -o -name "page.jsx" -o -name "page.js" -o -name "route.ts" -o -name "route.tsx" -o -name "route.js"`.

| File type | Total in `src/app/` | In allowlist | **Non-allowlist** |
|---|---:|---:|---:|
| `page.tsx` | 164 | 5 | **159** |
| `page.jsx` | 2 | 0 | **2** |
| `route.ts` | 893 | 16 | **877** |
| `route.tsx` | 1 | 0 | **1** |
| `route.js` | 1 | 0 | **1** |
| **TOTAL** | **1061** | **21** | **1040 page + route = 1040** non-`tsx`/`ts` adjusted total: **1044** |

(Allowlist counted: `src/app/page.tsx`, `(public)/welcome/page.tsx`, `(public)/free/freedom-os/page.tsx`, `(public)/free/freedom-os/plan/[planId]/page.tsx`, `assessment/[assessmentId]/page.tsx`; 2 landing + 3 checkout + 5 assessment + 2 freedom-agent + 4 other landing/freedom-agent routes = 16 API routes.)

**Bottom-line non-allowlist count: 1044 route files** (1040 from page.tsx+route.ts and 4 from page.jsx/route.tsx/route.js).

---

## 3. Per-Route Risk Classification

### 3.1 Classification rules used

- **RISKY (delete or patch):** Has module-level constructor of an external client (`createClient`, `new OpenAI`, `new Anthropic`, `new Stripe`, `new ApifyClient`, `new Replicate`, `new GoogleGenerativeAI`, `new GoogleGenAI`) at file top level. Pattern detected via `^(const|let|var|export const|export let)\s+\w+\s*=\s*(createClient|new <client>)\(`. **107 files** match.
- **MODERATE RISK (delete or patch):** Does NOT declare `force-dynamic` AND has no detected top-level constructor — but Next 14.2 may still attempt static prerender/data collection, exposing handler bodies to env-missing failures. **12 files** match (see 3.3).
- **SAFE (still dead in funnel mode, can delete):** Declares `force-dynamic` AND no top-level constructor detected. **925 files** match. These won't fail the build but they're orphaned at runtime (middleware 404s them).
- **UNCLEAR:** Uses `runtime = 'edge'` or unusual patterns. **0 files** — no `runtime = 'edge'` declarations exist outside the matched filter.

> Caveat: the RISKY scan checks only **direct, line-leading, module-level construction**. It does NOT catch transitive risk (e.g. a route that imports a `lib/` singleton whose top-level constructs Supabase). Spot-checks of `src/lib/` show 109 lib files with top-level construction patterns, so transitive risk is real — but tracing it across 1044 files is intractable. Since the deletion plan removes whole directories, transitive routes are deleted as collateral and the question is moot.

### 3.2 RISKY bucket (107 files — top-level external-client construction)

Grouped by directory of origin. All routes in this bucket are confirmed candidates for **build-time failure** in any environment missing the required env vars (Supabase service key, OpenAI key, etc.).

| Directory | Risky count | Files |
|---|---:|---|
| `src/app/admin/` (pages) | 3 | `bloomberg/marketplace/page.tsx`, `marketplace/creator/page.tsx`, `upload-test/page.tsx` |
| `src/app/api/admin/` | 30 | `bulk-import`, `events`, `expand-keywords`, `extract-genomes`, `fetch-metrics`, `inception-studio/generate`, `jobs/enqueue`, `jobs/list`, `monitoring/synthetic`, `pipeline-status`, `predict`, `prediction-runs/[id]/attach-platform-id`, `prediction-runs`, `reprocess-queue`, `run-migration`, `run-viral-filter`, `seed/videos`, `template-generator/runs`, `template-generator/stats`, `template-generator/templates`, `tenants`, `tenants/[tenantId]/keys`, `tenants/[tenantId]/keys/[keyId]`, `training-ingest`, `transcribe`, `viral-genomes/stats`, `viral-prediction/accuracy-validation`, `viral-prediction/accuracy-validation-real`, `viral-prediction/daily-recipe-book`, `viral-prediction/pipeline-status` |
| `src/app/api/ai/` | 1 | `generate-script` |
| `src/app/api/algorithm/` | 1 | `explain` |
| `src/app/api/algorithm-iq/` | 4 | `insights`, `performance`, `self-audit`, `track` |
| `src/app/api/bloomberg/` | 9 | `extract-patterns`, `feed`, `market-stats`, `marketplace`, `marketplace/installed`, `marketplace/recommended`, `patterns`, `watchlist`, `weather` |
| `src/app/api/brain/` | 2 | `history`, `(root)` |
| `src/app/api/bulk-download/` | 5 | `calculate-dps`, `predict`, `(root)`, `test-all`, `update-item` |
| `src/app/api/chairman-chat/` | 1 | `(root)` |
| `src/app/api/channel/` | 1 | `verify` |
| `src/app/api/content-calendar/` | 3 | `accept`, `performance`, `(root)` |
| `src/app/api/creator/` | 6 | `concept-score`, `concept-score/expand`, `list`, `onboard`, `predict`, `predictions` |
| `src/app/api/freedom-agent/` | 4 | `history`, `session`, `unsubscribe`, `weekly-checkin` (NOTE: the allowlisted `chat` + `conversation` are NOT in this list — they're safe) |
| `src/app/api/fresh-scraper/` | 4 | `add`, `check`, `predict`, `(root)` |
| `src/app/api/gemini/` | 1 | `analyze-video` |
| `src/app/api/generate/` | 3 | `optimize`, `script`, `video` |
| `src/app/api/generate-cinematic-prompt/` | 1 | `(root)` |
| `src/app/api/kai/` | 4 | `ab-test`, `ab-test/[testId]`, `drift`, `predict` |
| `src/app/api/knowledge/` | 1 | `extract` |
| `src/app/api/learning/` | 1 | `update` |
| `src/app/api/onboarding/` | 1 | `process` |
| `src/app/api/openai/` | 1 | `transcribe` |
| `src/app/api/predict/` | 2 | `v2`, `viral` |
| `src/app/api/privacy/` | 2 | `delete`, `export` |
| `src/app/api/quick-win/` | 4 | `analyze`, `brief`, `context`, `generate-script` |
| `src/app/api/remix/` | 1 | `generate-variations` |
| `src/app/api/replicate/` | 1 | `generate-image` |
| `src/app/api/scraping/` | 4 | `insights`, `jobs`, `metrics`, `start` |
| `src/app/api/studio/` | 3 | `module-health`, `system-metrics`, `video-intelligence` |
| `src/app/api/thumbnails/` | 1 | `resolve` |
| `src/app/api/video/` | 1 | `upload` |
| `src/app/api/video-status/` | 1 | `[id]` |

**Total RISKY: 107.** Pattern in every one: a `const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)` (or similar — OpenAI, Anthropic, etc.) at file top level. Eight of these also declare `force-dynamic` and a comment "Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM" — that comment is wrong: forcing dynamic doesn't prevent module-load failures.

### 3.3 MODERATE RISK bucket (12 files — no `force-dynamic`)

These do not declare `force-dynamic` and do not have detected top-level construction. They import from `@/lib/env` (which has safe empty-string fallbacks) and construct clients inside handlers. They're the same pattern as the previously-deleted `/public/score` — Next 14.2 may probe their GET handlers during page-data collection and fail when the dependency chain hits a deeper top-level constructor.

| File | Notes |
|---|---|
| `src/app/admin/accuracy/publish/route.ts` | Imports `createClient` + `@/lib/env`; handler uses Supabase |
| `src/app/auth/callback/route.ts` | Uses `createServerClient` from `@supabase/ssr`; auth flow |
| `src/app/config/objectives.matrix.json/route.ts` | Reads from `fs`, returns JSON. Low risk but no `force-dynamic` |
| `src/app/integrations/make/app.json/route.ts` | Static JSON serve. Likely safe |
| `src/app/integrations/zapier/app.json/route.ts` | Static JSON serve. Likely safe |
| `src/app/nl/[shortCode]/route.ts` | Newsletter shortlink. Disabled stub |
| `src/app/proof/page.tsx` | Marketing page. May import client libs |
| `src/app/px.gif/route.ts` | Tracking pixel. Imports `createClient` (in handler) and `@/lib/env` |
| `src/app/status/baseline/route.ts` | Imports `createClient` + `@/lib/env`. Rate-limited public endpoint |
| `src/app/status/integrity/route.ts` | Imports `createClient` + `@/lib/env`. Rate-limited public endpoint |
| `src/app/status/sandbox/route.ts` | Imports `createClient` + `@/lib/env`. Public endpoint |
| `src/app/widget/accuracy.js/route.ts` | Public widget JS |

(Note: `widget/badge/route.tsx`, found by extended file-extension scan, HAS no `force-dynamic` and was missed by the `.tsx`-only filter. Adding it makes the moderate-risk count effectively **13**.)

### 3.4 SAFE bucket (925 files — `force-dynamic` declared, no detected top-level construction)

These should not fail the build *from their own code*. They may still be exposed to transitive risk via `lib/` imports. But under the "delete-not-patch" strategy, they're deletion candidates anyway because middleware will 404 them at runtime.

The SAFE bucket is dominated by:
- `src/app/api/admin/*` (274 routes)
- `src/app/admin/*` pages (66)
- `src/app/api/templates/*` (26)
- `src/app/sandbox/*` pages (19)
- `src/app/api/validation/*` (19)
- `src/app/api/training/*` (17)
- 217 distinct directories total

A full SAFE file list is unwieldy and would consume ~50KB. If you need it, run:
```
grep -rL "force-dynamic" --include="page.tsx" --include="route.ts" src/app/
```
inverted — i.e. routes with `force-dynamic` minus routes in the RISKY/MODERATE lists.

---

## 4. RISKY-by-Directory Summary (with deletion verdict)

Tagging each non-allowlist directory: how many risky files, and whether the *entire* directory can be deleted.

### 4.1 Top-level `src/app/` directories — entirely deletable (48 dirs)

Every route file inside these top-level dirs is non-allowlist. No funnel route lives in them. Deleting the entire directory is correct.

```
src/app/(auth)/               — 3 page.tsx (login, signup, onboarding); SAFE bucket; entire group deletable
src/app/(dev)/                — 1 page.tsx (assessment-test); SAFE; deletable
src/app/access/
src/app/access-denied/
src/app/admin/                — 80 page.tsx; 3 RISKY, rest SAFE; deletable in one shot
src/app/agency/               — 13 page.tsx; SAFE; deletable
src/app/analytics/            — 4 page.tsx; SAFE; deletable
src/app/app/                  — 1 page.tsx
src/app/auth/                 — 5 page.tsx + 1 route.ts (callback, MODERATE); deletable
src/app/baseline/
src/app/basic/
src/app/campaign/
src/app/chairman/
src/app/config/               — 1 route.ts (objectives.matrix.json, MODERATE)
src/app/creator/
src/app/creator-workflow/
src/app/debug/
src/app/docs/
src/app/editor-mvp/
src/app/enhanced-components/
src/app/env-demo/             — 1 page.jsx
src/app/experts/
src/app/integrations/         — 2 route.ts (make, zapier app.json, MODERATE)
src/app/l/                    — 2 page.tsx (vanity URLs)
src/app/mockup/
src/app/nl/                   — 1 route.ts (MODERATE)
src/app/operations-center/
src/app/ops/
src/app/os-canvas/
src/app/plain/                — 1 page.jsx
src/app/prediction/
src/app/proof/                — 1 page.tsx (MODERATE)
src/app/public-templates/
src/app/qa/
src/app/remix/
src/app/sandbox/              — 19 page.tsx; SAFE; deletable
src/app/sandbox-landing/
src/app/settings/             — 3 page.tsx; SAFE; deletable
src/app/sound-trend-test/
src/app/sound-trends/
src/app/status/               — 3 route.ts (baseline, integrity, sandbox; ALL MODERATE)
src/app/studio/               — 2 page.tsx
src/app/system-status/
src/app/template-completion/
src/app/template-preview/
src/app/templates/            — 2 page.tsx
src/app/templates-browse/
src/app/trend-predictions/
src/app/widget/               — 1 route.ts (accuracy.js, MODERATE) + 1 route.tsx (badge, MODERATE)
```

### 4.2 Top-level `src/app/(public)/` — MIXED (selective deletion)

```
src/app/(public)/free/freedom-os/        — KEEP (in allowlist)
src/app/(public)/welcome/                — KEEP (in allowlist)
src/app/(public)/free/freedom-agent/     — DELETE (2 page.tsx, NOT in allowlist; SAFE bucket)
src/app/(public)/free/page.tsx           — DELETE (/free root NOT in allowlist; SAFE)
src/app/(public)/t/                      — DELETE (share-link page, NOT in allowlist; SAFE)
```

### 4.3 Top-level `src/app/api/` — MIXED (selective deletion)

API directories to KEEP (4):
- `src/app/api/landing/`
- `src/app/api/checkout/`
- `src/app/api/assessment/`
- `src/app/api/freedom-agent/chat/` and `src/app/api/freedom-agent/conversation/` (NOT the whole `freedom-agent/` dir)

API directories to DELETE WHOLE (every subdir except the four above): see full list in §5. **Roughly 170 directories under `src/app/api/`.**

Within `src/app/api/freedom-agent/`, delete 4 files (`history`, `session`, `unsubscribe`, `weekly-checkin`) but keep `chat/` and `conversation/`.

---

## 5. UNCLEAR Items (manual review before deletion)

There are no `runtime = 'edge'` declarations in non-allowlist files. The UNCLEAR bucket is therefore empty.

Items worth a one-look before deleting — but no blockers:

- **`src/app/auth/callback/route.ts`** — auth callback. If any non-funnel auth flow is still needed for the funnel deploy (it shouldn't be — funnel is anonymous), confirm before deleting. The funnel allowlist does not include `/auth/callback`, so middleware will 404 it anyway.
- **`src/app/integrations/make/app.json/route.ts`** and **`zapier/app.json/route.ts`** — these serve static JSON. Cheap to keep, cheaper to delete. They're not in allowlist; middleware will 404 them. Safe to delete.
- **`src/app/widget/badge/route.tsx`** — public widget badge. Not in allowlist. Safe to delete.

---

## 6. RECOMMENDED DELETION PLAN

The simplest, safest path: **delete every non-allowlist route file**. This eliminates all 107 RISKY files, all 13 MODERATE files, all transitive risk, and the dead-code surface area. The deploy is funnel-only; middleware 404s the rest at runtime regardless.

### 6.1 Whole-directory deletions (48 top-level dirs)

```
rm -rf src/app/(auth)/
rm -rf src/app/(dev)/
rm -rf src/app/access/
rm -rf src/app/access-denied/
rm -rf src/app/admin/
rm -rf src/app/agency/
rm -rf src/app/analytics/
rm -rf src/app/app/
rm -rf src/app/auth/
rm -rf src/app/baseline/
rm -rf src/app/basic/
rm -rf src/app/campaign/
rm -rf src/app/chairman/
rm -rf src/app/config/
rm -rf src/app/creator/
rm -rf src/app/creator-workflow/
rm -rf src/app/debug/
rm -rf src/app/docs/
rm -rf src/app/editor-mvp/
rm -rf src/app/enhanced-components/
rm -rf src/app/env-demo/
rm -rf src/app/experts/
rm -rf src/app/integrations/
rm -rf src/app/l/
rm -rf src/app/mockup/
rm -rf src/app/nl/
rm -rf src/app/operations-center/
rm -rf src/app/ops/
rm -rf src/app/os-canvas/
rm -rf src/app/plain/
rm -rf src/app/prediction/
rm -rf src/app/proof/
rm -rf src/app/public-templates/
rm -rf src/app/qa/
rm -rf src/app/remix/
rm -rf src/app/sandbox/
rm -rf src/app/sandbox-landing/
rm -rf src/app/settings/
rm -rf src/app/sound-trend-test/
rm -rf src/app/sound-trends/
rm -rf src/app/status/
rm -rf src/app/studio/
rm -rf src/app/system-status/
rm -rf src/app/template-completion/
rm -rf src/app/template-preview/
rm -rf src/app/templates/
rm -rf src/app/templates-browse/
rm -rf src/app/trend-predictions/
rm -rf src/app/widget/
```

> **Do NOT delete:** `src/app/actions/`, `src/app/components/`, `src/app/lib/`, `src/app/membership/components/` (no route files; non-routable helper modules). `src/app/membership/layout.tsx` exists with no `page.tsx` — it's not a route and is unreachable, but if you want to be tidy, `rm -rf src/app/membership/` is also fine.

### 6.2 Selective deletions under `src/app/(public)/`

```
rm -rf src/app/(public)/free/freedom-agent/
rm    src/app/(public)/free/page.tsx
rm -rf src/app/(public)/t/
```

Keep:
- `src/app/(public)/free/freedom-os/`
- `src/app/(public)/welcome/`

### 6.3 Selective deletions under `src/app/api/`

Delete every subdir EXCEPT `landing/`, `checkout/`, `assessment/`, `freedom-agent/chat/`, `freedom-agent/conversation/`.

The cleanest scripted version (Bash):
```bash
cd src/app/api
for d in */; do
  case "$d" in
    landing/|checkout/|assessment/) ;;
    freedom-agent/)
      # Keep only chat and conversation
      for sub in freedom-agent/*/; do
        case "$sub" in
          freedom-agent/chat/|freedom-agent/conversation/) ;;
          *) rm -rf "$sub" ;;
        esac
      done
      ;;
    *) rm -rf "$d" ;;
  esac
done
```

This removes approximately **170 subdirectories** under `src/app/api/`.

### 6.4 Totals

| Action | Count |
|---|---:|
| Top-level dirs deleted whole | 48 |
| `api/` subdirs deleted whole | ~170 |
| `(public)/` partial deletions | 2 dirs + 1 file |
| `api/freedom-agent/` partial deletions | 4 files (history, session, unsubscribe, weekly-checkin) |
| **Total directories removed** | **~220** |
| **Total individual files removed (outside whole-dir deletions)** | **5** (the 1 file under `(public)/free/` and 4 files under `api/freedom-agent/`) |
| **Total route files eliminated** | **1044** |

### 6.5 Post-deletion sanity check (DO BEFORE COMMITTING)

After deletion, the surviving `src/app/` should contain only:
- Top-level scaffolding: `layout.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `page.tsx`, `providers.tsx`, `globals.css`, `_app.tsx`, `_supabase-url-shim.tsx`, `DevelopmentProviders.tsx`, `favicon.ico`, `icon.svg`, `px.gif` (image, if it exists separate from the route)
- `assessment/[assessmentId]/page.tsx` and any children
- `(public)/welcome/page.tsx`
- `(public)/free/freedom-os/page.tsx` and children
- `api/landing/`, `api/checkout/`, `api/assessment/`
- `api/freedom-agent/chat/`, `api/freedom-agent/conversation/`
- (Optionally) helper dirs: `actions/`, `components/`, `lib/` — only if they're referenced by funnel files. If unreferenced, also delete.

Then run a build locally with `DEPLOY_TARGET=funnel` env set, and verify Vercel build passes.

---

## 7. Alternative: Patch Instead of Delete (NOT recommended for most files)

If you'd rather keep a non-allowlist route (e.g. for a future non-funnel deploy from the same branch) and patch it to survive the build, the per-file patch depends on the risk class:

### 7.1 RISKY routes (107 files with module-level construction)

`force-dynamic` is **not enough** for these — it does not defer module-level evaluation. To make them build-safe without deleting:
- Move the constructor inside the handler (lazy init):
  ```ts
  // BEFORE (RISKY)
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  export async function POST(req: Request) { /* uses supabase */ }

  // AFTER (SAFE)
  export const dynamic = 'force-dynamic'
  function getSupabase() {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
  }
  export async function POST(req: Request) { const supabase = getSupabase(); /* ... */ }
  ```
- Or replace `process.env.X!` with safe-fallback wrappers like `@/lib/env` (which uses `|| ''` defaults) so construction with empty strings still completes synchronously, and let runtime fail loudly if the env is actually missing at request time.

### 7.2 MODERATE routes (12 files without `force-dynamic`)

Add `export const dynamic = 'force-dynamic'` at the top (after imports). This is necessary AND sufficient for these particular routes because they don't have module-level constructor patterns — `force-dynamic` skips static prerender so the handler-time `createClient(...)` calls only run at request time.

### 7.3 Per-route opt-in

If only a subset of currently-RISKY routes are worth keeping for a future deploy, the right move is: for each one, apply the lazy-init pattern from 7.1. The rest delete.

---

## 8. Appendix: Full RISKY file list (107 entries)

```
src/app/admin/bloomberg/marketplace/page.tsx
src/app/admin/marketplace/creator/page.tsx
src/app/admin/upload-test/page.tsx
src/app/api/admin/bulk-import/route.ts
src/app/api/admin/events/route.ts
src/app/api/admin/expand-keywords/route.ts
src/app/api/admin/extract-genomes/route.ts
src/app/api/admin/fetch-metrics/route.ts
src/app/api/admin/inception-studio/generate/route.ts
src/app/api/admin/jobs/enqueue/route.ts
src/app/api/admin/jobs/list/route.ts
src/app/api/admin/monitoring/synthetic/route.ts
src/app/api/admin/pipeline-status/route.ts
src/app/api/admin/predict/route.ts
src/app/api/admin/prediction-runs/[id]/attach-platform-id/route.ts
src/app/api/admin/prediction-runs/route.ts
src/app/api/admin/reprocess-queue/route.ts
src/app/api/admin/run-migration/route.ts
src/app/api/admin/run-viral-filter/route.ts
src/app/api/admin/seed/videos/route.ts
src/app/api/admin/template-generator/runs/route.ts
src/app/api/admin/template-generator/stats/route.ts
src/app/api/admin/template-generator/templates/route.ts
src/app/api/admin/tenants/[tenantId]/keys/[keyId]/route.ts
src/app/api/admin/tenants/[tenantId]/keys/route.ts
src/app/api/admin/tenants/route.ts
src/app/api/admin/training-ingest/route.ts
src/app/api/admin/transcribe/route.ts
src/app/api/admin/viral-genomes/stats/route.ts
src/app/api/admin/viral-prediction/accuracy-validation-real/route.ts
src/app/api/admin/viral-prediction/accuracy-validation/route.ts
src/app/api/admin/viral-prediction/daily-recipe-book/route.ts
src/app/api/admin/viral-prediction/pipeline-status/route.ts
src/app/api/ai/generate-script/route.ts
src/app/api/algorithm-iq/insights/route.ts
src/app/api/algorithm-iq/performance/route.ts
src/app/api/algorithm-iq/self-audit/route.ts
src/app/api/algorithm-iq/track/route.ts
src/app/api/algorithm/explain/route.ts
src/app/api/bloomberg/extract-patterns/route.ts
src/app/api/bloomberg/feed/route.ts
src/app/api/bloomberg/market-stats/route.ts
src/app/api/bloomberg/marketplace/installed/route.ts
src/app/api/bloomberg/marketplace/recommended/route.ts
src/app/api/bloomberg/marketplace/route.ts
src/app/api/bloomberg/patterns/route.ts
src/app/api/bloomberg/watchlist/route.ts
src/app/api/bloomberg/weather/route.ts
src/app/api/brain/history/route.ts
src/app/api/brain/route.ts
src/app/api/bulk-download/calculate-dps/route.ts
src/app/api/bulk-download/predict/route.ts
src/app/api/bulk-download/route.ts
src/app/api/bulk-download/test-all/route.ts
src/app/api/bulk-download/update-item/route.ts
src/app/api/chairman-chat/route.ts
src/app/api/channel/verify/route.ts
src/app/api/content-calendar/accept/route.ts
src/app/api/content-calendar/performance/route.ts
src/app/api/content-calendar/route.ts
src/app/api/creator/concept-score/expand/route.ts
src/app/api/creator/concept-score/route.ts
src/app/api/creator/list/route.ts
src/app/api/creator/onboard/route.ts
src/app/api/creator/predict/route.ts
src/app/api/creator/predictions/route.ts
src/app/api/freedom-agent/history/route.ts
src/app/api/freedom-agent/session/route.ts
src/app/api/freedom-agent/unsubscribe/route.ts
src/app/api/freedom-agent/weekly-checkin/route.ts
src/app/api/fresh-scraper/add/route.ts
src/app/api/fresh-scraper/check/route.ts
src/app/api/fresh-scraper/predict/route.ts
src/app/api/fresh-scraper/route.ts
src/app/api/gemini/analyze-video/route.ts
src/app/api/generate-cinematic-prompt/route.ts
src/app/api/generate/optimize/route.ts
src/app/api/generate/script/route.ts
src/app/api/generate/video/route.ts
src/app/api/kai/ab-test/[testId]/route.ts
src/app/api/kai/ab-test/route.ts
src/app/api/kai/drift/route.ts
src/app/api/kai/predict/route.ts
src/app/api/knowledge/extract/route.ts
src/app/api/learning/update/route.ts
src/app/api/onboarding/process/route.ts
src/app/api/openai/transcribe/route.ts
src/app/api/predict/v2/route.ts
src/app/api/predict/viral/route.ts
src/app/api/privacy/delete/route.ts
src/app/api/privacy/export/route.ts
src/app/api/quick-win/analyze/route.ts
src/app/api/quick-win/brief/route.ts
src/app/api/quick-win/context/route.ts
src/app/api/quick-win/generate-script/route.ts
src/app/api/remix/generate-variations/route.ts
src/app/api/replicate/generate-image/route.ts
src/app/api/scraping/insights/route.ts
src/app/api/scraping/jobs/route.ts
src/app/api/scraping/metrics/route.ts
src/app/api/scraping/start/route.ts
src/app/api/studio/module-health/route.ts
src/app/api/studio/system-metrics/route.ts
src/app/api/studio/video-intelligence/route.ts
src/app/api/thumbnails/resolve/route.ts
src/app/api/video-status/[id]/route.ts
src/app/api/video/upload/route.ts
```

---

## 9. Quick checklist — apply the plan in order

1. **Stage 1 (highest leverage):** Delete the 30 risky `src/app/api/admin/*` routes by deleting `src/app/api/admin/` whole. Removes 30 RISKY + ~274 SAFE files in one stroke.
2. **Stage 2:** Delete the remaining 26 `src/app/api/*` dirs that contain RISKY files (`bloomberg/`, `bulk-download/`, `creator/`, `kai/`, etc.). Each is a `rm -rf` of one directory.
3. **Stage 3:** Delete the 3 RISKY pages in `src/app/admin/` by deleting `src/app/admin/` whole.
4. **Stage 4:** Delete the 4 RISKY routes in `src/app/api/freedom-agent/` (NOT chat/conversation).
5. **Stage 5:** Delete remaining MODERATE files and SAFE-but-dead directories (everything else from §6.1).
6. **Stage 6:** Build locally with `DEPLOY_TARGET=funnel`. Push. If anything still fails the build, repeat the diagnostic — but at this point the only failures should be inside funnel files themselves (none expected per `FUNNEL_EXTRACTION_DIAGNOSTIC.md`).
