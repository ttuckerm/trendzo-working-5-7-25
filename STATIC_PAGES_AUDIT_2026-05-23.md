# Static-pages Audit — `vercel-deploy-test`

**Date:** 2026-05-23
**Branch:** `vercel-deploy-test`
**Trigger:** Vercel build dies at `Generating static pages (0/203)`.
**Scope:** Read-only. No fixes.

---

## Headline numbers

| Bucket | Count |
|---|---:|
| Total `page.{tsx,ts,js,jsx}` files under `src/app/` | **166** |
| → Page files **WITHOUT** `force-dynamic` in their own source | **2** |
| → Page files **WITH** `force-dynamic` in their own source | **164** |
| Total `layout.tsx` files under `src/app/` | 15 |
| → Layouts **WITH** `force-dynamic` | **1** (the root layout, `src/app/layout.tsx:18`) |
| → Layouts **WITHOUT** `force-dynamic` | 14 |
| Total `route.{ts,js}` files under `src/app/api/` | **883** |
| → API route handlers **WITHOUT** `force-dynamic` | **0** |
| Total non-`api` `route.ts` files under `src/app/` | **12** |
| → Non-API route handlers **WITHOUT** `force-dynamic` | **12** (all of them) |
| Next.js special files (`not-found.tsx` / `error.tsx` / `loading.tsx` / `global-error.tsx`) | 14 |
| → Special files **WITHOUT** `force-dynamic` | 14 (all of them) |
| Files declaring `export const revalidate = …` | 19 (all set to `0`) |
| `generateStaticParams` files | 2, producing 16 combos each (= 32 dynamic-param expansions) |

---

## 1. Page files that do NOT contain `force-dynamic`

These 2 pages do not declare `force-dynamic` in their own source. (Both still inherit the directive from `src/app/layout.tsx`, see §3.)

```
src/app/page.tsx
src/app/proof/page.tsx
```

**Detail on each:**

### `src/app/page.tsx` — public landing (`/`)
- Pure server component (no `'use client'`, no `'use server'`).
- Exports `metadata` (`Metadata` from `next`).
- Imports ~14 landing-page section components from `@/components/landing/*`.
- Has `robots: { index: true, ... }` in metadata — explicitly indexable.
- No `dynamic`, no `revalidate`, no `generateStaticParams`, no `fetchCache`.
- This page is a **prime candidate for Next.js to mark as fully static**.

### `src/app/proof/page.tsx` — `/proof`
- First line of file is `'use server'`.
- Uses async `fetch()` calls (`/api/...`) with `cache: 'no-store'`.
- The `'use server'` directive marks this file as a Server Action module, which is **incompatible with also being a Page module**. This combination is what commit `07b960e` ("fix(build): remove force-dynamic from `'use server'` page files") removed `force-dynamic` from — but the underlying conflict between `'use server'` and being a page entrypoint is still present in source.

---

## 2. Pages with `force-dynamic` — source vs. inherited from layout

**Question asked:** "List any pages where `force-dynamic` is ONLY in a layout, not the page."

**Answer: zero pages match this criterion.**

Methodology and reasoning:

- 164 of 166 pages contain `force-dynamic` in their OWN source.
- The 2 pages that do NOT contain it in their own source (§1) both still inherit it from the root layout `src/app/layout.tsx`, because the root layout applies to every page in the tree.
- Of the 14 non-root layouts, **none** declare `force-dynamic`. So no nested layout adds the directive that wouldn't have already been inherited from root.
- Therefore: every page in the tree has `force-dynamic` effectively applied (either on its own file, or via the root layout), and **no page relies on a layout-only declaration** (with the exception of the 2 in §1, which only inherit from root).

### The 164 pages that have `force-dynamic` declared on the page file itself

`src/app/(auth)/login/page.tsx`
`src/app/(auth)/onboarding/page.tsx`
`src/app/(auth)/signup/page.tsx`
`src/app/(dev)/assessment-test/page.tsx`
`src/app/(public)/free/freedom-agent/[sessionId]/page.tsx`
`src/app/(public)/free/freedom-agent/page.tsx`
`src/app/(public)/free/freedom-os/page.tsx`
`src/app/(public)/free/freedom-os/plan/[planId]/page.tsx`
`src/app/(public)/free/page.tsx`
`src/app/(public)/t/[shareId]/page.tsx`
`src/app/(public)/welcome/page.tsx`
`src/app/access-denied/page.tsx`
`src/app/access/page.tsx`
`src/app/admin/adaptation/page.tsx`
`src/app/admin/algorithm-iq/page.tsx`
`src/app/admin/api/page.tsx`
`src/app/admin/apify-scraper/page.tsx`
`src/app/admin/audit-log/page.tsx`
`src/app/admin/bloomberg/marketplace/page.tsx`
`src/app/admin/bloomberg/page.tsx`
`src/app/admin/brief-review/page.tsx`
`src/app/admin/bulk-download/page.tsx`
`src/app/admin/calibration/page.tsx`
`src/app/admin/canvas/[projectId]/page.tsx`
`src/app/admin/canvas/page.tsx`
`src/app/admin/chairman/page.tsx`
`src/app/admin/control-center/page.tsx`
`src/app/admin/creators/[username]/page.tsx`
`src/app/admin/creators/page.tsx`
`src/app/admin/cultural-events/page.tsx`
`src/app/admin/dashboard/page.tsx`
`src/app/admin/hub/page.tsx`
`src/app/admin/integrations/api/page.tsx`
`src/app/admin/integrations/webhooks/page.tsx`
`src/app/admin/keys/page.tsx`
`src/app/admin/learning/page.tsx`
`src/app/admin/login/page.tsx`
`src/app/admin/marketplace/creator/page.tsx`
`src/app/admin/model-evaluation/page.tsx`
`src/app/admin/operations/accuracy/page.tsx`
`src/app/admin/operations/alerts/page.tsx`
`src/app/admin/operations/data-explorer/page.tsx`
`src/app/admin/operations/experiments/page.tsx`
`src/app/admin/operations/health/page.tsx`
`src/app/admin/operations/initiative/page.tsx`
`src/app/admin/operations/model/page.tsx`
`src/app/admin/operations/network-intelligence/page.tsx`
`src/app/admin/operations/page.tsx`
`src/app/admin/operations/system-health/page.tsx`
`src/app/admin/operations/training/base/page.tsx`
`src/app/admin/operations/training/data/page.tsx`
`src/app/admin/operations/training/history/page.tsx`
`src/app/admin/operations/training/jobs/page.tsx`
`src/app/admin/operations/training/models/page.tsx`
`src/app/admin/operations/training/page.tsx`
`src/app/admin/operations/training/readiness/page.tsx`
`src/app/admin/operations/training/viral-scrape/page.tsx`
`src/app/admin/organization/agencies/[id]/page.tsx`
`src/app/admin/organization/agencies/page.tsx`
`src/app/admin/organization/creators/page.tsx`
`src/app/admin/organization/page.tsx`
`src/app/admin/page.tsx`
`src/app/admin/planning/[id]/page.tsx`
`src/app/admin/rewards/affiliate/page.tsx`
`src/app/admin/rewards/app-campaigns/page.tsx`
`src/app/admin/rewards/app-store/page.tsx`
`src/app/admin/rewards/content-campaigns/page.tsx`
`src/app/admin/rewards/page.tsx`
`src/app/admin/rewards/payouts/page.tsx`
`src/app/admin/rewards/platform-campaigns/create/page.tsx`
`src/app/admin/rewards/platform-campaigns/page.tsx`
`src/app/admin/scraping/page.tsx`
`src/app/admin/settings/page.tsx`
`src/app/admin/studio/page.tsx`
`src/app/admin/studio/script/page.tsx`
`src/app/admin/success-tracking/page.tsx`
`src/app/admin/system-settings/page.tsx`
`src/app/admin/system/page.tsx`
`src/app/admin/upload-test/page.tsx`
`src/app/admin/viral-studio/page.tsx`
`src/app/admin/workflows/creator/page.tsx`
`src/app/admin/workflows/quick-win/page.tsx`
`src/app/agency/cards/page.tsx`
`src/app/agency/client-portal/page.tsx`
`src/app/agency/clients/page.tsx`
`src/app/agency/competitive/page.tsx`
`src/app/agency/content-lab/page.tsx`
`src/app/agency/dashboard/page.tsx`
`src/app/agency/memory/page.tsx`
`src/app/agency/network/page.tsx`
`src/app/agency/page.tsx`
`src/app/agency/proposals/page.tsx`
`src/app/agency/trend-iq/page.tsx`
`src/app/agency/trends/page.tsx`
`src/app/agency/what-you-missed/page.tsx`
`src/app/analytics/advanced-insights/page.tsx`
`src/app/analytics/performance/page.tsx`
`src/app/analytics/remix-stats/page.tsx`
`src/app/analytics/trend-insights/page.tsx`
`src/app/app/page.tsx`
`src/app/assessment/[assessmentId]/page.tsx`
`src/app/auth/callback-handler/page.tsx`
`src/app/auth/error/page.tsx`
`src/app/auth/magic-link/page.tsx`
`src/app/auth/page.tsx`
`src/app/auth/save-template/page.tsx`
`src/app/baseline/page.tsx`
`src/app/basic/page.tsx`
`src/app/campaign/page.tsx`
`src/app/chairman/page.tsx`
`src/app/creator-workflow/page.tsx`
`src/app/creator/page.tsx`
`src/app/debug/page.tsx`
`src/app/docs/api/[version]/page.tsx`
`src/app/editor-mvp/page.tsx`
`src/app/enhanced-components/hover-card-demo/page.tsx`
`src/app/enhanced-components/page.tsx`
`src/app/env-demo/page.jsx`
`src/app/experts/performance/page.tsx`
`src/app/l/[niche]/[platform]/page.tsx`
`src/app/l/premium/[niche]/[platform]/page.tsx`
`src/app/mockup/page.tsx`
`src/app/operations-center/page.tsx`
`src/app/ops/validation/page.tsx`
`src/app/os-canvas/page.tsx`
`src/app/plain/page.jsx`
`src/app/prediction/[receiptId]/page.tsx`
`src/app/public-templates/page.tsx`
`src/app/qa/visual/page.tsx`
`src/app/remix/page.tsx`
`src/app/sandbox-landing/page.tsx`
`src/app/sandbox/chairman-design-test/page.tsx`
`src/app/sandbox/onboarding/page.tsx`
`src/app/sandbox/page.tsx`
`src/app/sandbox/viral-lab-v2/page.tsx`
`src/app/sandbox/viral-studio/page.tsx`
`src/app/sandbox/workflow/accuracy/page.tsx`
`src/app/sandbox/workflow/analysis/page.tsx`
`src/app/sandbox/workflow/campaigns/page.tsx`
`src/app/sandbox/workflow/dashboard/page.tsx`
`src/app/sandbox/workflow/gallery/page.tsx`
`src/app/sandbox/workflow/lab/page.tsx`
`src/app/sandbox/workflow/moat/page.tsx`
`src/app/sandbox/workflow/onboarding/page.tsx`
`src/app/sandbox/workflow/page.tsx`
`src/app/sandbox/workflow/process/page.tsx`
`src/app/sandbox/workflow/receipt/page.tsx`
`src/app/sandbox/workflow/schedule/page.tsx`
`src/app/sandbox/workflow/script/page.tsx`
`src/app/sandbox/workflow/starter-playbook/page.tsx`
`src/app/settings/animations/page.tsx`
`src/app/settings/multi-sensory/page.tsx`
`src/app/settings/page.tsx`
`src/app/sound-trend-test/page.tsx`
`src/app/sound-trends/page.tsx`
`src/app/studio/creator/page.tsx`
`src/app/studio/dashboard/page.tsx`
`src/app/system-status/page.tsx`
`src/app/template-completion/[templateId]/page.tsx`
`src/app/template-preview/page.tsx`
`src/app/templates-browse/page.tsx`
`src/app/templates/[id]/page.tsx`
`src/app/templates/page.tsx`
`src/app/trend-predictions/page.tsx`

---

## 3. All `layout.tsx` files and their `force-dynamic` status

| Path | Has `force-dynamic` |
|---|:---:|
| `src/app/layout.tsx` | **✅ YES** (`export const dynamic = 'force-dynamic'` on line 18) |
| `src/app/admin/(studio)/layout.tsx` | ❌ no |
| `src/app/admin/layout.tsx` | ❌ no |
| `src/app/admin/viral-studio/layout.tsx` | ❌ no |
| `src/app/agency/layout.tsx` | ❌ no |
| `src/app/app/layout.tsx` | ❌ no |
| `src/app/chairman/layout.tsx` | ❌ no |
| `src/app/membership/layout.tsx` | ❌ no |
| `src/app/sandbox/layout.tsx` | ❌ no |
| `src/app/sandbox/viral-lab-v2/layout.tsx` | ❌ no |
| `src/app/sandbox/workflow/layout.tsx` | ❌ no |
| `src/app/templates-browse/layout.tsx` | ❌ no |
| `src/app/templates/[id]/layout.tsx` | ❌ no |
| `src/app/templates/layout.tsx` | ❌ no |
| `src/app/trend-predictions/layout.tsx` | ❌ no |

Only the **root** layout declares `force-dynamic`. All 14 nested layouts are silent on the directive. Because Next.js segment-config directives propagate from layouts to descendant pages, every page in the tree inherits `force-dynamic` from the root layout in addition to any declaration on the page itself.

---

## 4. API route handlers without `force-dynamic`

### Under `src/app/api/`

Total: **883** route handlers.
Without `force-dynamic`: **0**.

Every single API route handler under `src/app/api/` contains the `force-dynamic` directive.

### Under `src/app/` but **NOT** under `api/` (12 handlers)

These are route handlers that serve non-`/api/*` URLs. **None of them contain `force-dynamic`.**

```
src/app/admin/accuracy/publish/route.ts
src/app/auth/callback/route.ts
src/app/config/objectives.matrix.json/route.ts
src/app/integrations/make/app.json/route.ts
src/app/integrations/zapier/app.json/route.ts
src/app/nl/[shortCode]/route.ts
src/app/public/score/route.ts
src/app/px.gif/route.ts
src/app/status/baseline/route.ts
src/app/status/integrity/route.ts
src/app/status/sandbox/route.ts
src/app/widget/accuracy.js/route.ts
```

These handlers serve URLs like `/px.gif`, `/widget/accuracy.js`, `/status/baseline`, `/nl/[shortCode]`, `/config/objectives.matrix.json`, `/integrations/make/app.json`, etc. Since they live outside `/api/*`, the mass `force-dynamic` migrations (commits `da993d9` "640 API routes" and `91ec27e` "admin pages and API routes") did not touch them. Next.js will try to statically prerender route handlers when it can; non-GET handlers or handlers using request-scoped APIs get marked dynamic automatically, but pure GET handlers returning JSON or static blobs (`px.gif`, `app.json`) are SSG-eligible.

### Next.js special files (not-found / error / loading / global-error)

14 files; none contain `force-dynamic`:

```
src/app/error.tsx
src/app/global-error.tsx
src/app/not-found.tsx
src/app/app/not-found.tsx
src/app/(public)/free/freedom-os/plan/[planId]/not-found.tsx
src/app/admin/not-found.tsx
src/app/admin/loading.tsx
src/app/admin/canvas/loading.tsx
src/app/admin/control-center/loading.tsx
src/app/admin/dashboard/loading.tsx
src/app/admin/operations/loading.tsx
src/app/admin/studio/loading.tsx
src/app/assessment/[assessmentId]/loading.tsx
src/app/assessment/[assessmentId]/not-found.tsx
```

Special files contribute to the static-pages count as their own prerendered units (`/_not-found`, `/_error`, route-specific 404s, etc.).

---

## 5. `export const revalidate = …` — ISR/SSG opt-ins

All 19 hits in the repo set `revalidate = 0`:

```
src/app/api/admin/api-keys/[id]/regenerate/route.ts:9    export const revalidate = 0;
src/app/api/admin/api-keys/[id]/route.ts:9               export const revalidate = 0;
src/app/api/admin/api-keys/[id]/toggle/route.ts:9        export const revalidate = 0;
src/app/api/admin/apify-scrapers/route.ts:12             export const revalidate = 0;
src/app/api/admin/bandit/allocate/route.ts:4             export const revalidate = 0
src/app/api/admin/cache-stats/route.ts:9                 export const revalidate = 0;
src/app/api/admin/data-ingestion/route.ts:10             export const revalidate = 0
src/app/api/admin/database/migrate/route.ts:10           export const revalidate = 0;
src/app/api/admin/framework-evolution/patterns/route.ts:10  export const revalidate = 0;
src/app/api/admin/framework-evolution/run/route.ts:10    export const revalidate = 0;
src/app/api/admin/monitoring/fast-prediction/route.ts.disabled:11  export const revalidate = 0;
src/app/api/admin/run-feature-decomposer/route.ts:4      export const revalidate = 0;
src/app/api/data-explorer/quality/route.ts:19            export const revalidate = 0;
src/app/api/data-explorer/videos/route.ts:16             export const revalidate = 0;
src/app/api/training/models/route.ts:5                   export const revalidate = 0;
src/app/api/training/readiness-summary/route.ts:13       export const revalidate = 0;
src/app/api/training/stats/route.ts:19                   export const revalidate = 0;
src/app/api/viral-scraping/route.ts:21                   export const revalidate = 0;
src/app/assessment/[assessmentId]/page.tsx:19            export const revalidate = 0
```

**Important semantic note (no proposal — just a fact about how Next.js treats this):**
- `export const revalidate = 0` is the **dynamic** value — it tells Next.js "never cache; render on every request." It is functionally equivalent to `force-dynamic` and is **not** an ISR/SSG opt-in.
- An actual ISR/SSG opt-in would be `export const revalidate = <positive number>` (e.g. `revalidate = 60` for ISR every 60s) or `export const revalidate = false` for permanent caching.
- No file in the repo uses a positive `revalidate` value or `revalidate = false`. **There is no opt-in to ISR/SSG via the `revalidate` export anywhere in the codebase.**

Also: no `export const dynamic = '<other-value>'` is used anywhere (no `'auto'`, no `'error'`, no `'force-static'`). Searched: `grep "export const dynamic" --include="page.*"` excluding `force-dynamic` returned zero results.

---

## 6. Other SSG entry points

`generateStaticParams` is declared in exactly **2 files**:

| File | Combos produced |
|---|---:|
| `src/app/l/[niche]/[platform]/page.tsx` | 16 (`{business,creator,fitness,education}` × `{linkedin,twitter,facebook,instagram}`) |
| `src/app/l/premium/[niche]/[platform]/page.tsx` | 16 (same hard-coded constant arrays) |

The niche/platform arrays are hard-coded string-literal constants — no DB queries, no large iterations.

Both files ALSO declare `export const dynamic = 'force-dynamic'` on the same page (line 10 of each). When `force-dynamic` and `generateStaticParams` co-exist, Next.js still calls `generateStaticParams` during build (because it has to expand the param table), but treats the rendered output as dynamic at runtime.

---

## 7. Why the build reports `(0/203)`

The arithmetic, as best the source can be reconciled with the failure count:

| Source | Count |
|---|---:|
| `page.{tsx,ts,js,jsx}` files | 166 |
| `+` `generateStaticParams` expansion: extra dynamic-route combinations beyond the 2 base page files | +30 (32 combos − 2 base files already counted) |
| `+` Special files (`not-found.tsx`, `error.tsx`, `loading.tsx`, `global-error.tsx`) | +14 |
| `+` Non-API `route.ts` handlers without `force-dynamic` | +12 |
| `+` Implicit `_not-found` / route-group root entries | (Next-internal — count not derivable from source) |
| ≈ Total | **≈ 222** (close to but not exactly 203) |

The repo source does not include enough information to derive the exact 203 number — Next.js's static-pages denominator is computed from the route manifest produced after the page-data-collection phase, with some routes being merged or short-circuited internally. The most likely composition is **166 pages + ~30 SSG-expansion combos + ~14 special files + handful of route handlers + Next-internal entries**, with `force-dynamic` declarations not preventing entries from being counted in the static-pages phase — the directive only changes the final rendering mode after the page-data-collection import has already executed.

In other words: even though 164/166 pages and all 883 API routes declare `force-dynamic`, the "Generating static pages (0/203)" pass still has to **import every page module's top-level code** to evaluate which exports it has — and that import is where the OOM occurs.

---

## Summary

- **2 of 166** page files have no `force-dynamic` declaration of their own (`src/app/page.tsx`, `src/app/proof/page.tsx`). Both still inherit it from the root layout.
- **0 pages** rely solely on a layout-only declaration. The only layout with `force-dynamic` is the root, which applies universally, so this question is degenerate in this codebase.
- **All 14 non-root layouts** are silent on `force-dynamic`. Inheritance comes from `src/app/layout.tsx` alone.
- **All 883 `src/app/api/**/route.ts` files** declare `force-dynamic`.
- **12 non-API route handlers** under `src/app/` (e.g. `/px.gif`, `/widget/accuracy.js`, `/status/*`, `/integrations/*/app.json`) have **no** `force-dynamic`.
- **0 files opt into ISR/SSG via `revalidate`**. The 19 `revalidate = 0` declarations are dynamic, not static, opt-ins.
- **2 SSG opt-ins** via `generateStaticParams`, producing 16 combos each over hard-coded string-constant arrays — not data-driven, not large.
- The `(0/203)` denominator cannot be exactly reproduced from source alone — it includes Next-internal route-manifest entries — but the constituent buckets explain a number in the ~200–220 range.
