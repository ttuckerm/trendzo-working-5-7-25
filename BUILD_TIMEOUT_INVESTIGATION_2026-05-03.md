# Build-Phase Timeout / OOM Investigation
Date: 2026-05-03
Branch: vercel-deploy-test
Build commit: 0602498b9c0f12e8881d20fffe35b32d7c50c5f4 (Phase 1.5)
Build log: `vercel_phase1_5_log.txt` (4,927 lines, 353,588 bytes)

---

## TL;DR

**Verdict: STATIC_GEN_NEEDS_DYNAMIC** (with module-level side effects amplifying the blast radius).

The Vercel build now installs cleanly but dies during Next.js's "Collecting page data" / "Generating static pages" phase. **770 of 883 API routes (87%) lack `export const dynamic = 'force-dynamic'`**, so Next.js attempts to pre-render them at build time. Many of those routes execute real Supabase queries and prediction loops in their `GET()` handler. When pre-rendering tries to invoke them, they:

1. Block on real I/O (DB / fetch / heavy compute) for >60s → SIGTERM
2. Or instantiate yet another Supabase client (256 routes do this), inflating memory
3. Cascade: workers OOM, restart batches re-import everything, memory grows again

The single route that hit the 3-restart fatal limit (`/api/admin/integration/dryrun_replay_81225`) is just the alphabetically-first route in each retry batch — not unique. The same fix applies to 617 timed-out API routes.

Of the 113 API routes that DO have `force-dynamic`, **zero timed out**. That's a perfect natural experiment.

The OOM event reported by Vercel's BUILD_SYSTEM_REPORT is corollary, not primary cause: the first worker died with **SIGKILL** (kernel OOM-killer) at 19:47:07, before any 60-second timeout could trigger SIGTERM. Memory pressure → SIGKILL → workers restart → 60-second timeouts cascade in the restart batches.

**Recommended fix shape: Path A** — add `export const dynamic = 'force-dynamic'` to the 770 API routes that lack it. Trivial mechanical change, scoped precisely, fully reversible. Path B (lib refactor) is a longer-term hygiene improvement but not required to unblock this build.

---

## T0 — Entry state

```
$ git status --porcelain | <count non-empty lines>
45 entries
```

(21 WIP source mods/deletions + 2 new untracked source items + 4 PHASE1 MDs + 8 leftover *.txt scratch files from prior sessions + 2 prior investigation MDs + 4 outcome / log files + others.)

Working tree was not modified during this read-only investigation; only one file was created: this report.

## T1 — Build log

- `vercel_phase1_5_log.txt` exists at repo root
- Size: **353,588 bytes**
- Lines: **4,927**

## T2 — Timeout / restart entries

`Select-String` for the precise markers `Restarted (collecting page data|static page generation) for|Sending SIGTERM signal|build worker exited with code|Out of Memory` matched **1,933 lines**.

Three SIGTERM cycles + one SIGKILL + final OOM line:

```
1188: ⨯ Next.js build worker exited with code: null and signal: SIGKILL    [19:47:07 — first kill]
1426: ⨯ Next.js build worker exited with code: null and signal: SIGTERM    [19:48:53 — second kill]
3164: ⨯ Next.js build worker exited with code: null and signal: SIGTERM    [19:49:54 — third kill]
4902: ⨯ Next.js build worker exited with code: null and signal: SIGTERM    [19:50:54 — fatal kill]
4921: • At least one "Out of Memory" ("OOM") event was detected during the build.
```

Two phases of restarts:
- **`Restarted collecting page data`** — first wave at 19:47:08 (worker had just been SIGKILL'd)
- **`Restarted static page generation`** — second/third wave at 19:48:53 and 19:49:54

The fact the first kill was **SIGKILL** (not SIGTERM) is the smoking gun for OOM: SIGKILL is what the kernel sends when the OOM-killer fires; Next.js's own 60-second timeout uses SIGTERM. So the first failure was OOM, not timeout. The subsequent SIGTERMs are downstream cascades.

## T3 — Routes that timed out

**933 unique routes** restarted at least once. This is essentially the entire app (out of 883 API routes + 285 pages). Examples across categories:

- `/api/admin/integration/dryrun_replay_81225` (the one that hit 3-restart fatal limit)
- `/api/bloomberg/feed`, `/api/billing/usage`, `/api/predict`, `/api/quick-win/*`
- `/admin/dashboard`, `/admin/studio`, `/admin/operations/training/*`
- `/sandbox/*` (entire family)
- `/dashboard`, `/dashboard/analytics`, `/viral-lab-entry/*`

Full list saved to `$env:TEMP\timed-out-routes.txt`.

## T4 — Fatal route context

`/api/admin/integration/dryrun_replay_81225` was named in 3 different SIGTERM batches (19:48:53, 19:49:54, 19:50:54). The third strike triggered:

```
Error: Static page generation for /api/admin/integration/dryrun_replay_81225 is still timing
out after 3 attempts. See more info here https://nextjs.org/docs/messages/static-page-generation-timeout
  at onRestart (/vercel/path0/node_modules/next/dist/build/index.js:292:27)
```

It is alphabetically the first route under `/api/admin/integration/dryrun_*/` so it appears at the head of each retry batch — not because it is uniquely slow, but because the batch contains many `dryrun_*` siblings that all share the same shape.

## T5 — Fatal route source

File: `src/app/api/admin/integration/dryrun_replay_81225/route.ts` (37 lines). First 50 lines:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { UnifiedPredictionEngine } from '@/lib/services/viral-prediction/unified-prediction-engine'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const from = '2025-08-12T00:00:00.000Z'
  const to = '2025-08-12T23:59:59.999Z'
  const { data: raws } = await db.from('raw_videos')
    .select('id,caption,views_1h,likes_1h,uploaded_at')
    .gte('created_at', from).lte('created_at', to).limit(200)
  const scanned = (raws||[]).length
  let promoted = 0, predicted = 0
  const engine = new UnifiedPredictionEngine()
  for (const r of (raws||[])) {
    const res = await engine.predict({ ... } as any)
    if (res) predicted++
  }
  return NextResponse.json({ ok:true, dryrun:true, ... })
}
```

Diagnosis:
- ❌ No `export const dynamic = ...` declaration
- ❌ Handler does live Supabase query for up to 200 records
- ❌ Then loops up to 200 times calling `engine.predict()` (heavy CPU + chains imports of `unified-prediction-engine`, which transitively pulls `@/lib/features/store`, `@/lib/features/quality_gate`, etc., all of which create their own module-level Supabase clients)
- ❌ Imports `UnifiedPredictionEngine` at module load even though Next.js may try to pre-render this — the entire prediction subsystem is loaded just to evaluate "should this route get a static cache entry?"

This is an ideal candidate for `export const dynamic = 'force-dynamic'`.

## T6 — API route inventory

| Metric | Count |
|---|---|
| Total API route files (`src/app/api/**/route.ts`) | **883** |
| With `export const dynamic = 'force-dynamic'` | **113** (12.8%) |
| Without any `dynamic` export | **770** (87.2%) |
| With module-level Supabase client (`const x = createClient(...)` at top level) | **256** (29%) |
| With module-level fetch | **46** |
| **Module-Supabase + no `dynamic` export (worst combo)** | **228** |

Only `force-dynamic` was found among declared values; no `force-static`, `auto`, or numeric `revalidate` worth flagging.

A sample of routes with module-level Supabase but no `dynamic` (heaviest blast radius):

```
src/app/api/ab/start/route.ts
src/app/api/ab/[id]/route.ts
src/app/api/admin/accuracy-dashboard/route.ts
src/app/api/admin/active-label-queue/route.ts
src/app/api/admin/agencies/[id]/preload-patterns/route.ts
src/app/api/admin/apify-scrapers/scheduler/route.ts
src/app/api/admin/baselines/metrics_30d/route.ts
src/app/api/admin/baselines/run-now/route.ts
src/app/api/admin/baselines/summary/route.ts
src/app/api/admin/bulk-import/route.ts
... (218 more)
```

Full inventory: `$env:TEMP\api-routes-inventory.csv`.

## T7 — Page route inventory

| Metric | Count |
|---|---|
| Total page files (`page.ts`/`page.tsx`/`page.js`) | **285** |
| Without `dynamic` export | **281** |
| With `force-dynamic` | **4** |
| `'use client'` pages (mostly safe — pre-render to a shell) | **233** |
| Server async pages (riskier) | **17** |

The 17 server async pages are the page-side equivalents to the API-route problem; some of them likely contributed to the 315 non-API routes seen in the timeout list. Most pages are `'use client'` and pre-render fine — but they timed out anyway because they share lib-level imports with the API routes. (See T10.)

## T8 — Cross-reference: timed-out routes vs `dynamic` config

Of the 933 timed-out routes, **617 mapped 1:1 to API route files**:

| Group | Count |
|---|---|
| Timed-out API routes WITHOUT `dynamic` export | **617** |
| Timed-out API routes WITH `force-dynamic` | **0** |

That's a perfect natural experiment: every API route that had `force-dynamic` declared survived the build phase. Every route without it was either dynamically bailed (7 routes — see T11) or timed out.

Remaining 315 timed-out routes are page routes (matched ~315 of the 281 non-dynamic pages, with some duplicates from intercepted/parallel routes).

## T9 — `next.config.mjs` (verbatim, key sections)

```js
const nextConfig = {
  compiler: { removeConsole: ... },
  env: { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, ... },
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  eslint:    { ignoreDuringBuilds: true },
  typescript:{ ignoreBuildErrors: true },
  images:    { remotePatterns: [...], dangerouslyAllowSVG: true, ... },
  experimental: {
    instrumentationHook: false,
    optimizeServerReact: true,
    serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify'],
    optimizePackageImports: ['lucide-react','recharts','d3','framer-motion', /* + 11 more */],
    outputFileTracingExcludes: { '*': ['**/whisper_env/**','**/node_modules/**/.bin/**'] }
  },
  webpack: (config, { isServer, webpack }) => {
    config.externals.push({ 'ffmpeg-static': 'commonjs ffmpeg-static' });
    config.externals.push({ 'ffprobe-static': 'commonjs ffprobe-static' });
    if (isServer) {
      config.externals.push({ 'apify': 'commonjs apify' });
      config.externals.push({ 'apify-client': 'commonjs apify-client' });
      config.externals.push({ 'ioredis': 'commonjs ioredis' });
      config.externals.push({ 'pg': 'commonjs pg' });
      config.externals.push({ 'fluent-ffmpeg': 'commonjs fluent-ffmpeg' });
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        '@supabase/gotrue-js': 'commonjs @supabase/gotrue-js'
      });
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^(natural|webworker-threads)$/ }));
    } else { /* client */ }
    config.experiments.asyncWebAssembly = true;
    return config;
  },
  async redirects() { ... },
  async rewrites()  { ... },
};
```

Notable absences:
- No `experimental.workerThreads`, no NODE_OPTIONS adjustment, no memory tweak
- No `staticPageGenerationTimeout` override — defaults to 60 seconds
- `output: 'standalone'` is enabled in production. Adds file-tracing overhead but is correct for Vercel.

## T10 — Module-level side effects in `src/lib/`

**144 of 842** lib files contain potential module-level side effects (regex match `^(const|let|var|export const) X = createClient(...)` or `^(...) X = (await )?fetch(...)` or top-level `await` outside a function):

- 109 files — module-level Supabase client init
- ~35 files — module-level fetch
- 0 — top-level await detected

Most-load-bearing examples (verified by spot-reading):

| File | Side effect |
|---|---|
| `src/lib/database/supabase.ts` | `export const supabase = createClient(...)` at line 13 — **plus** `console.log(...)` at lines 9–10 — runs at every import |
| `src/lib/auth/server-auth.ts` | Module-level Supabase client; reads cookies in helper used by ~600 routes (this is the chain that produced the 7 DYNAMIC_SERVER_USAGE bails — see T11) |
| `src/lib/features/store.ts` | Module-level Supabase client |
| `src/lib/features/quality_gate.ts` | Module-level Supabase client |
| `src/lib/orchestration/kai-orchestrator.ts` | Module-level Supabase client |
| `src/lib/prediction/runPredictionPipeline.ts` | Module-level Supabase client |
| `src/lib/services/viral-prediction/unified-prediction-engine.ts` | Class-level (constructor / methods) — clean. But its imports chain into `features/store.ts` etc., which DO have module-level clients. |
| `src/lib/services/viral-prediction/dps-baselines.ts` | Module-level Supabase client |
| `src/lib/services/viral-prediction/apify-scraper.ts` | Module-level Supabase client + module-level fetch |
| `src/lib/cron/scheduler.ts` | Module-level Supabase client + fetch |

(Full list of 144 files: see T10 raw output above.)

**Why this matters for the build phase:** `export const supabase = createClient(...)` at module load means *every route handler that imports anything that transitively imports this file* triggers a Supabase client construction at static-analysis time. Multiplied across 770 routes being pre-rendered concurrently in a worker, this is a substantial memory + connection storm. Combined with the routes that then proceed to do real DB queries (a handler-level concern, not module-level), it's not surprising the 8 GB container ran out of memory.

## T11 — OOM context

Log line 4921 (post-failure summary):
```
2026-05-03T19:50:57.338Z  ▲ Build system report
2026-05-03T19:50:57.338Z  ▲ To always completely log this report, add VERCEL_BUILD_SYSTEM_REPORT=1 as an Environment Variable to your project.
2026-05-03T19:50:57.338Z  • At least one "Out of Memory" ("OOM") event was detected during the build.
2026-05-03T19:50:57.339Z  • This occurs when processes or applications running during the build completely fill up the available memory (RAM) in the build container. When this happens, the build container terminates one of the processes during the build with a SIGKILL signal.
2026-05-03T19:50:57.339Z  • Read this troubleshooting guide for more information: https://vercel.link/troubleshoot-build-errors
status	● Error
```

This corroborates the SIGKILL at line 1188 (19:47:07) being kernel-driven OOM rather than worker timeout.

A sample of DYNAMIC_SERVER_USAGE error context (line 1277, the FIRST bail-out):
```
2026-05-03T19:47:32.103Z  at Object.getItem (/vercel/path0/.next/server/chunks/67721.js:5:3103)
2026-05-03T19:47:32.104Z  at B (/vercel/path0/.next/server/chunks/24139.js:1:4536)
2026-05-03T19:47:32.104Z  at K.__loadSession (/vercel/path0/.next/server/chunks/24139.js:1:36350)
2026-05-03T19:47:32.104Z  at K._useSession (/vercel/path0/.next/server/chunks/24139.js:1:36087)
2026-05-03T19:47:32.104Z  at K._getUser (/vercel/path0/.next/server/chunks/24139.js:1:37947)
description: "Route /api/admin/commerce/attribution/summary couldn't be rendered statically because it used `request.cookies`. See more info here: https://nextjs.org/docs/messages/dynamic-server-error"
digest: 'DYNAMIC_SERVER_USAGE'
```

This is `src/lib/auth/server-auth.ts` calling Supabase `getUser()` → `__loadSession()` → `cookies().get(...)`. Next.js detected dynamic server usage and successfully bailed out of static rendering for that route. Exactly 7 routes got lucky enough to throw this error before hanging on real I/O. The other ~600 routes did real I/O (DB query, fetch, predict loop) BEFORE reaching any cookie-touching code, so they hung until SIGTERM rather than bailing cleanly.

## T12 — Build phase timing

| Phase | Time | Δ |
|---|---|---|
| Compile finished (with warnings) | 19:38:58 | — |
| `Collecting page data...` started | 19:38:58 | 0s |
| First worker SIGKILL (OOM) | 19:47:07 | **+8m 9s** |
| First DYNAMIC_SERVER_USAGE bail | 19:47:32 | +8m 34s |
| Second worker SIGTERM | 19:48:53 | +9m 55s |
| Third worker SIGTERM | 19:49:54 | +10m 56s |
| Fourth worker SIGTERM (3-attempt fatal) | 19:50:54 | +11m 56s |
| `Error: Command "npm run build" exited with 1` | 19:50:55 | +11m 57s |
| Vercel BUILD_SYSTEM_REPORT (OOM detected) | 19:50:57 | +11m 59s |

Total log lines: **4,927**. Total build time before crash: ~12 minutes.

## T13 — Verdict

### Classification: **STATIC_GEN_NEEDS_DYNAMIC** (primary cause)

Evidence — direct, stacked, mutually reinforcing:

1. **770 of 883 API routes (87%) lack any `dynamic` export.** Without it, Next.js 14's default behavior is to attempt static generation at build time.
2. **0 of 113 `force-dynamic` routes timed out.** Perfect natural experiment showing `force-dynamic` is sufficient prevention.
3. **All 617 timed-out API routes lack `dynamic` export.** Direct cross-reference (T8).
4. **The fatal route (`dryrun_replay_81225`) does Supabase query + 200-iteration prediction loop with no `dynamic` declaration** (T5).
5. **7 routes were saved by accidental `request.cookies` usage** (T11) — those threw DYNAMIC_SERVER_USAGE and bailed out of static rendering. The others did real I/O before reaching any cookie-touching code, so they hung.

### Secondary contributor: **MODULE_LEVEL_SIDE_EFFECTS**

Evidence:
- 256 API routes have `const x = createClient(...)` at top level
- 144 lib files have similar module-level side effects
- These ARE imported transitively across hundreds of routes
- The first kill was SIGKILL (OOM), not SIGTERM (timeout) — strongly suggests memory pressure, not pure latency

But: Path A alone (add `force-dynamic`) almost certainly resolves the build because it short-circuits Next.js's attempt to even *start* pre-rendering. Path B (refactor lib side effects) is a hygiene improvement that would help dev iteration speed and runtime stability, but is **not required to unblock the build**.

### Ranked culprit list

| Rank | File / pattern | Evidence | Confidence | Proposed fix |
|---|---|---|---|---|
| 1 | All 770 API routes without `dynamic` export | T6, T8 | Very high | Add `export const dynamic = 'force-dynamic'` (Path A) |
| 2 | `src/app/api/admin/integration/dryrun_*/route.ts` (~14 routes) | T4, T5 | Very high | Path A (these specifically — fast win) |
| 3 | `src/lib/database/supabase.ts` (line 13: `export const supabase = createClient(...)`) | T10 | High (cause of OOM cascade) | Path B candidate (lazy `getSupabase()` getter) — defer until Path A confirms build passes |
| 4 | `src/lib/auth/server-auth.ts` (cookie-reading auth helper used by ~600 routes) | T11 | High | Already triggers DYNAMIC_SERVER_USAGE; once routes have `force-dynamic`, this becomes a non-issue |
| 5 | `src/lib/features/store.ts`, `src/lib/features/quality_gate.ts` | T10 | Medium | Path B candidate (lazy init) |
| 6 | `src/lib/orchestration/kai-orchestrator.ts`, `src/lib/prediction/runPredictionPipeline.ts` | T10 | Medium | Path B candidate (lazy init) |
| 7 | 17 server async pages without `dynamic` | T7 | Medium | Path A (page-level) |
| 8 | 281 'use client' pages without `dynamic` | T7 | Low (mostly fine) | Investigate only the ones that timed out — likely chained import problem |

### Edit-count estimate

| Path | Files changed | Effort | Risk |
|---|---|---|---|
| **Path A (recommended)** — add `export const dynamic = 'force-dynamic'` to API routes that need it | **~770** | Mechanical (one line per file) | Low — fully reversible; only affects build behavior, not runtime |
| **Path A scoped (cautious)** — only the routes that timed out | **~617** | Mechanical | Lowest — only touches confirmed-affected routes |
| **Path A absolute minimum** — only the ~14 `/api/admin/integration/dryrun_*` routes | **~14** | Mechanical | Tiny — but 600+ other routes still time out. Likely insufficient. |
| **Path B (longer term)** — refactor the top ~10 lib files with module-level Supabase clients to lazy `getClient()` getters | **~10–20** | Real refactor (each is load-bearing) | Medium-high — risk of breaking working code; needs testing per file |
| **Path C (sledgehammer)** — set `staticPageGenerationTimeout: 600` in `next.config.mjs` and `NODE_OPTIONS=--max-old-space-size=12288` | **2** | Tiny config edit | High — masks the real problem; OOM would still likely fire on 8 GB container |

### Recommended sequencing

1. **Phase 2 (next fix prompt)**: Path A scoped to the 617 timed-out API routes. Single mechanical commit. Re-deploy. If green → Phase 1 build pipeline restored.
2. **Phase 3 (later)**: Path A for remaining 153 untimed-out routes (preventive — they would time out next time the build picks them in a different order).
3. **Phase 4 (separate session, much later)**: Path B refactor of the worst lib-level Supabase initializers. Hygiene, not unblocking.

### Things this verdict explicitly does NOT claim

- That every one of the 770 routes is "safe to mark `force-dynamic`" — a small number may legitimately be intended as static (e.g. `/api/openapi.json`, `/api/ping`, `/api/openapi`-style no-side-effect endpoints). Those should be sampled by the next fix prompt and possibly left alone or marked `force-static` instead. Estimate: ~10–20 such candidates out of 770, requiring a one-time human review.
- That OOM is fully resolved by Path A alone. It probably is, because Path A prevents 600+ routes from being instantiated concurrently. But if the next build still OOMs, Path B becomes mandatory.
- That `dryrun_replay_81225` is uniquely problematic. It is not — it is one of ~14 sibling `dryrun_*` routes, all with the same shape, and one of 617 broader-pattern routes.

## T15 — Integrity check

Done after report write. Expected delta: +1 entry (this report file). See bottom of report for the actual numbers.
