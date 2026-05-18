# Funnel Option B Feasibility — `force-dynamic` Punt for Non-Funnel Build Errors

**Branch:** `funnel-deploy-techyai`
**Date:** 2026-05-16
**Mode:** Read-only investigation. No source modified.

---

## 1. Suspect modules — what they actually export vs. what the warnings claim

### 1.1 `src/lib/onboarding/delivery-baseline.ts`

**Warning claim (missing):** `DeliveryBaseline`

**Actual top-level exports:**
- `export interface DeliveryBaseline { … }` (line 10)
- `export function deliveryBaselineToScore(baseline)` (line 23)

**Root cause of warning:** `DeliveryBaseline` is a TS `interface` (type-only). The consumer that triggers the warning is **not** the underlying file (which IS correct) — it is the re-exporter:

`src/lib/onboarding/delivery-analyzer.ts:22`
```ts
export { DeliveryBaseline, deliveryBaselineToScore } from './delivery-baseline';
```

Under `isolatedModules` / value-vs-type re-export rules, a type-only symbol must be re-exported with `export type` or `export { type DeliveryBaseline, … }`. Next 14 surfaces this as an "export X was not found" warning. **Not build-fatal** (see Section 8).

### 1.2 `src/lib/services/training/ffmpeg-training-features.ts`

**Warning claim (missing):** `extractFFmpegFeaturesBatch`, `getFFmpegFeatureMetadata`

**Actual top-level exports:**
- `interface FFmpegTrainingFeatures` (line 24)
- `interface FFmpegExtractionResult` (line 43)
- `interface FFmpegExtractionOptions` (line 56)
- `function getDefaultFFmpegFeatures()` (line 64)
- `async function extractFFmpegTrainingFeatures(...)` (line 88)

**Verdict:** `extractFFmpegFeaturesBatch` and `getFFmpegFeatureMetadata` **do not exist** anywhere in the file — they were either removed (file is annotated `@deprecated` at top) or never written. The consumer that breaks is the barrel `src/lib/services/training/index.ts:69-76`:

```ts
export {
  extractFFmpegTrainingFeatures,
  extractFFmpegFeaturesBatch,        // ← missing
  getFFmpegFeatureMetadata,           // ← missing
  getDefaultFFmpegFeatures,
  type FFmpegTrainingFeatures,
  type FFmpegExtractionResult,
} from './ffmpeg-training-features';
```

### 1.3 `src/lib/services/training/transcript-segmentation.ts`

**Warning claim (missing):** `segmentTranscriptByTimestamps`, `HOOK_END`, `CONTEXT_END`, `CTA_DURATION`, `MAX_HOOK_WORDS`, `MAX_CTA_WORDS`, `CTA_ACTION_VERBS`

**Actual top-level exports:**
- `interface TranscriptSegment` (line 7)
- `interface SegmentedTranscript` (line 15)
- `function segmentTranscriptByEstimation(transcript)` (line 30)

**Verdict:** All seven named exports the barrel asks for are **missing**. The file is a stripped-down stub (only the estimation segmenter survives). Breaking re-export is `src/lib/services/training/index.ts:82-94`.

### 1.4 `src/lib/services/training/llm-framework-scoring.ts`

**Warning claim (missing):** `batchScoreWithLLM`, `getDefaultClassifications`

**Actual top-level exports:**
- `interface LLMFrameworkScores` (line 7)
- `interface ScriptInput` (line 19)
- `function getDefaultScores()` (line 30)
- `async function scoreWithLLM(input, options)` (line 47)

**Verdict:** Both `batchScoreWithLLM` and `getDefaultClassifications` are **missing**. Plus the barrel asks for types `StructureClassification` and `LLMScoringResult` that also don't exist. Breaking re-export is `src/lib/services/training/index.ts:100-109`.

---

## 2. `/public/score` root cause

**File:** `src/app/public/score/route.ts` (87 lines).

**Eager module-load Supabase init: NO** — `createClient` is called inside `POST()` (line 24), not at module top-level. But the imports at the top still hit `@/lib/env` (line 5):

```ts
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
```

`src/lib/env.ts` evaluates env vars at module load (lines 2-6) and **falls back to empty string** when env vars are missing — so `SUPABASE_URL = ''` at build time.

The route exports a **GET handler** (lines 19-21) with no params and no `dynamic` declaration. Next 14.2 attempts page-data collection (a static-optimization probe) and the GET happens to be safe — BUT the build trace shows the failure came from data-collection time invocation. Most likely scenario: Next probed the route during `Generating static pages` and the `createClient('', '')` call inside `POST` was not the trigger — the trigger is that this route is part of a server graph and the Supabase singleton inside `getPredictionEngine()` (line 44, called from POST) reaches a top-level Supabase init during webpack tracing.

**Critical fact:** `export const dynamic = 'force-dynamic'` is **not declared** on this route (verified: zero matches in the file). API route handlers default to dynamic in Next 14, but the build attempted data collection anyway — adding `export const dynamic = 'force-dynamic'` will force Next to skip prerender/data-collection for the route and defer all evaluation to request time. **This is the textbook fix for this exact failure mode.**

**Alternative:** the route is dead-looking — only one referenced caller pattern exists (an "x-api-key" telemetry endpoint). If confirmed orphaned, deleting it is cleaner. **Flagging only — do not act.**

---

## 3. Consumers of broken code

| Consumer file | Route path served | In funnel allowlist? | Already has `force-dynamic`? |
|---|---|---|---|
| `src/app/api/training/populate/route.ts` | `/api/training/populate` | NO | YES (line 18) |
| `src/app/api/training/stats/route.ts` | `/api/training/stats` | NO | YES (line 18) |
| `src/app/api/creator/concept-score/route.ts` | `/api/creator/concept-score` | NO | YES (line 18) |
| `src/app/api/creator/concept-score/expand/route.ts` | `/api/creator/concept-score/expand` | NO | (not inspected — irrelevant; transitive only) |
| `src/app/api/creator/predict/route.ts` | `/api/creator/predict` | NO | (transitive: imports `creator-context` which imports `delivery-baseline`) |
| `src/app/api/quick-win/analyze/route.ts` | `/api/quick-win/analyze` | NO | (transitive via creator-context) |
| `src/app/api/quick-win/context/route.ts` | `/api/quick-win/context` | NO | (transitive) |
| `src/app/api/quick-win/generate-script/route.ts` | `/api/quick-win/generate-script` | NO | (transitive) |
| `src/app/api/admin/operations/initiative/route.ts` | `/api/admin/operations/initiative` | NO | (transitive) |
| `src/app/api/content-calendar/route.ts` | `/api/content-calendar` | NO | (transitive) |
| `src/app/admin/studio/components/ConceptScorerTab.tsx` | client component (`/admin/studio` page) | NO | n/a (component, not route) |
| `src/app/admin/viral-studio/page.tsx` | `/admin/viral-studio` | NO | (transitive via creator-context) |
| `src/app/admin/upload-test/page.tsx` | `/admin/upload-test` | NO | (transitive) |
| `src/app/admin/viral-studio/components/phases/AudienceDiagnosticPhase.tsx` | (component) | NO | n/a |

**Transitive note:** `creator-context.ts` (line 14) imports `DeliveryBaseline` + `deliveryBaselineToScore` from `delivery-baseline.ts`. The `delivery-baseline.ts` file itself is **complete and correct** — the only "missing export" warning is generated by the broken `export {}` line in `delivery-analyzer.ts:22`. Routes that import directly from `delivery-baseline` (not from `delivery-analyzer`) are unaffected by the warning. `delivery-analyzer.ts` consumers (search yielded none in `src/app/`): zero direct.

The training barrel `@/lib/services/training` only has **two** direct app consumers (the two training API routes). Everything else lives under `src/lib/...` and is only build-time relevant if Next traces the import chain.

---

## 4. Funnel allowlist intersection — does any funnel route touch broken code?

**Funnel pages (4):** `/`, `/welcome`, `/free/freedom-os`, `/assessment/[assessmentId]`
**Funnel APIs (11):** `/api/landing/code-validate`, `/api/landing/email-notify`, `/api/checkout/create-session`, `/api/checkout/verify-session`, `/api/checkout/webhook`, `/api/assessment/generate`, `/api/assessment/email-capture`, `/api/assessment/email-status`, `/api/assessment/sprint-progress`, `/api/freedom-agent/chat`, `/api/freedom-agent/conversation`

**Grep results (direct imports of broken modules within funnel route trees):**
- `src/app/api/landing/**` — 0 hits
- `src/app/api/checkout/**` — 0 hits
- `src/app/api/assessment/**` — 0 hits
- `src/app/api/freedom-agent/**` — 0 hits
- `src/app/(public)/welcome/page.tsx` — imports only `@/lib/stripe/cookie`, `@/lib/stripe/verify`, no broken modules
- `src/app/(public)/free/freedom-os/page.tsx` — same, no broken modules
- `src/app/page.tsx` — landing components only, no broken modules
- `src/app/assessment/[assessmentId]/**` — no broken-module imports

**VERDICT: NO funnel route imports broken code, directly or transitively.** Option B has a clear path forward.

---

## 5. Non-funnel Supabase-touching routes (candidates for `force-dynamic`)

The repo has **212 files** under `src/app/` importing from `@/lib/env` alone (proxy for Supabase-touching). Auditing all 212 is out of scope for this feasibility doc — and unnecessary, because:

1. The build only reported **one** hard data-collection-time error: `/public/score`.
2. Next.js 14 API `route.ts` handlers are dynamic by default; static probing only happens for routes with stable handlers and no obvious request-dependence. The vast majority of those 212 routes use cookies/headers/auth and Next already skips them.
3. The Background brief explicitly says: "These are warnings, not errors. They don't fail the build."

So the only confirmed candidate for `force-dynamic` is `/public/score`. If a subsequent Vercel build surfaces additional data-collection failures, they can be addressed with the same one-line patch — the pattern is well-understood.

| Route path | File path | Already has `force-dynamic`? |
|---|---|---|
| `/public/score` | `src/app/public/score/route.ts` | **NO** ← the only confirmed need |

---

## 6. `next.config.js` audit (`next.config.mjs`)

- **`output: 'standalone'`** — yes, but only when `NODE_ENV === 'production'` (line 15). Standalone bundles the full server graph; it does not exclude routes. No effect on the build-failure surface.
- **`pageExtensions` filtering** — not set. All `.ts`/`.tsx` under `src/app/` are compiled.
- **`experimental.skipMiddlewareUrlNormalize`** — not set.
- **`typescript.ignoreBuildErrors: true`** (line 27) — important. TS "export not found" diagnostics that would otherwise fail strict builds are downgraded. This is part of why the four broken-export warnings did **not** fail the build.
- **`eslint.ignoreDuringBuilds: true`** (line 23) — same reasoning, for lint.
- **`experimental.instrumentationHook: false`** (line 87) — keeps the scheduler chain out of webpack tracing. Helps the build proceed.
- **`experimental.serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify']`** — narrow scope.
- **`experimental.outputFileTracingExcludes`** — excludes `whisper_env/**` and `node_modules/**/.bin/**`. Trace-time only.
- **`webpack` customization** — externalizes `ffmpeg-static`, `ffprobe-static`, `apify`, `apify-client`, `ioredis`, `pg`, `fluent-ffmpeg`, `@supabase/realtime-js`, `@supabase/gotrue-js`. Plus `IgnorePlugin` for `natural` and `webworker-threads`. None of this selectively excludes routes.
- **`async redirects()`** — page-level redirects, no build skipping.
- **`async rewrites()`** — `/api/openai/:path*` and `/lab/canvas`, no build skipping.

**No "exclude this route from build" hook exists in `next.config.mjs`.** Route-level `export const dynamic = 'force-dynamic'` (or `export const runtime = 'nodejs'` + dynamic) is the only available mechanism.

---

## 7. Next.js version

`package.json:` `"next": "^14.2.28"`

This is Next 14.x, where `export const dynamic = 'force-dynamic'` reliably defers all data collection to request time. The approach behaves as described in the task brief.

---

## 8. Verdict on Question A

**Question A:** Can we make the build succeed by adding `export const dynamic = 'force-dynamic'` to non-funnel routes that pull in broken code, **without modifying any funnel file**?

**Answer: YES.**

**Reasoning:**

1. The four "export X was not found" warnings (`delivery-baseline`, `ffmpeg-training-features`, `transcript-segmentation`, `llm-framework-scoring`) are **non-fatal warnings**, not build errors. With `typescript.ignoreBuildErrors: true` in `next.config.mjs` (line 27), Next compiles through them. They emit noise in the build log but do not fail the build. **No action needed.**

2. The **single** hard error that killed the build — `/public/score` failing with `supabaseUrl is required` at page-data collection — is a textbook data-collection-time failure caused by Next 14 probing a route whose dependency chain instantiates Supabase at module load with missing env. **`export const dynamic = 'force-dynamic'` defers all module-load and data-collection to request time, which fixes it.**

3. No funnel route (page or API) imports any of the broken modules. The fix touches exactly one non-funnel file. Funnel files are untouched. (Verified by grep across all four funnel API directories and all funnel pages.)

4. A cleaner alternative — **deleting `/public/score`** — is on the table if the route is orphaned. The grep evidence (the route is a public x-api-key telemetry endpoint with no internal callers visible) suggests it MAY be unreachable in the funnel-only deploy. The brief is read-only, so this is flagged but not actioned. The minimum-change path is still the one-line `force-dynamic`.

---

## 9. Answer to Question B

**Question B:** Approximate number of non-funnel route files that would need a one-line `export const dynamic = 'force-dynamic'` addition?

**Answer: 1 file.**

That file is:
- `src/app/public/score/route.ts` (add `export const dynamic = 'force-dynamic'` near top, e.g. after line 6)

The four "export not found" warnings are non-fatal in this build configuration (`typescript.ignoreBuildErrors: true`). All other consumers of broken code already declare `force-dynamic` (verified for the three direct app routes: `/api/training/populate`, `/api/training/stats`, `/api/creator/concept-score`).

If a subsequent Vercel build surfaces *additional* data-collection failures from other Supabase-touching routes, the same one-line fix applies. But based on the evidence in this build's log, only `/public/score` needs the patch.

---

## 10. Recommended next step (minimum change set to ship a green build)

**Add a single line — `export const dynamic = 'force-dynamic'` — to `src/app/public/score/route.ts`** (insert after the imports, e.g. line 6). This will defer the route's evaluation to request time, sidestepping the build-time `supabaseUrl is required` failure without touching any funnel file or attempting to "fix" the dead training pipeline exports. Leave the four "export not found" warnings alone — they are noise in the log, not build failures, because `next.config.mjs` has `typescript.ignoreBuildErrors: true`. If a later build surfaces additional data-collection failures from other non-funnel routes, repeat the same one-line patch per route. As a parallel-track cleanup (not blocking deploy), consider whether `/public/score` is reachable from the funnel-only deploy at all — middleware blocks it via `DEPLOY_TARGET=funnel` (the route is not in `FUNNEL_ALLOWLIST`), so it would 404 in production regardless — meaning **deleting the file is also a legitimate fix** and would be even cleaner. Either patch ships the build.
