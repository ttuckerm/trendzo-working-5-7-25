# Vercel Build OOM Diagnostic — `vercel-deploy-test`

**Date:** 2026-05-23
**Branch:** `vercel-deploy-test`
**Scope:** Read-only investigation. No fixes proposed.
**Repo:** `C:\Projects\CleanCopy`

---

## 1. `next.config.mjs` (full contents)

File is **`next.config.mjs`**, not `next.config.js`. Full contents:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* in production builds while keeping warnings and errors
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_CLONE_URL: process.env.NEXT_PUBLIC_CLONE_URL || 'https://os.ryo.lu/',
  },
  // Enable standalone output ONLY for production builds (Docker deployment).
  ...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {}),

  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [ /* 10 patterns: placehold.co, randomuser.me, placekitten,
                        replicate.com, replicate.delivery, firebasestorage,
                        images.unsplash.com, lh3.googleusercontent.com,
                        picsum.photos */ ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    instrumentationHook: false,                    // disabled 2026-04-21
    optimizeServerReact: true,                     // ⚠ raises peak build RAM
    serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify'],
    optimizePackageImports: [
      'lucide-react', 'recharts', 'd3', 'framer-motion',
      '@radix-ui/react-dialog', '@radix-ui/react-popover',
      '@radix-ui/react-tabs', '@radix-ui/react-tooltip',
      '@radix-ui/react-scroll-area', '@radix-ui/react-slider',
      '@radix-ui/react-switch', '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu', '@radix-ui/react-radio-group',
      'date-fns', 'chart.js', 'react-chartjs-2',
    ],
    outputFileTracingExcludes: {
      '*': ['**/whisper_env/**', '**/node_modules/**/.bin/**']
    }
  },

  webpack: (config, { isServer, webpack }) => {
    // Externals: ffmpeg-static, ffprobe-static (always)
    // Server-only externals: apify, apify-client, ioredis, pg, fluent-ffmpeg,
    //                        @supabase/realtime-js, @supabase/gotrue-js
    // IgnorePlugin (server): natural, webworker-threads
    // IgnorePlugin (client): natural, webworker-threads, apify, apify-client
    // Client aliases: natural=false, webworker-threads=false, apify=false, apify-client=false
    // config.experiments.asyncWebAssembly = true     // for tesseract.js
    return config;
  },

  async redirects() { /* favicon.ico→.svg, multiple /trend-predictions and
                         /admin/operations-center redirects */ },
  async rewrites() { /* /api/openai/* → api.openai.com, /lab/canvas → /lab-canvas */ },
};
export default nextConfig;
```

**Flags worth flagging:**
- `experimental.optimizeServerReact: true` — Next.js docs flag this as memory-intensive during RSC compilation; it touches every server component.
- `experimental.optimizePackageImports` — 17 packages listed. Each requires module-graph analysis at build time and is applied per-page.
- `experimental.instrumentationHook: false` — disabled to keep scheduler chain out of the build graph (see commits `97071ef`, `dbfdb16`, `1a2fcf8`). Currently inert.
- `output: 'standalone'` — only set when `NODE_ENV === 'production'`. Vercel builds set `NODE_ENV=production`, so this IS active in Vercel builds. Standalone adds file-tracing overhead.
- `typescript.ignoreBuildErrors: true` + `eslint.ignoreDuringBuilds: true` — skips checks; not memory-relevant but means type/lint problems can't be the OOM.
- Webpack externals list is large; this REDUCES the bundle but does not affect Next.js's per-page compile RAM.
- No `experimental.workerThreads`, `experimental.cpus`, or `webpackBuildWorker` setting present. Earlier `cpus: 2` was reverted in commit `b097a09`.
- No `NODE_OPTIONS` configured anywhere in config or package.json.

---

## 2. `vercel.json` (full contents)

```json
{
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    { "path": "/api/cron/recency-decay",           "schedule": "0 3 * * 0" },
    { "path": "/api/freedom-agent/weekly-checkin", "schedule": "0 10 * * 1" },
    { "path": "/api/atlas/feedback-collector",     "schedule": "0 6 * * *" },
    { "path": "/api/cron/cultural-scan",           "schedule": "30 0 * * *" },
    { "path": "/api/cron/classify-events",         "schedule": "0 1 * * *" },
    { "path": "/api/cron/overnight-triage",        "schedule": "0 6 * * *" }
  ]
}
```

**Notes:**
- No `build.env` block — build-time env vars come exclusively from Vercel project settings.
- No `functions[].memory` block — does NOT affect build memory anyway (only runtime).
- No `NODE_OPTIONS` (e.g. `--max-old-space-size`) anywhere. The default Vercel build runs Node with the platform default heap — on the standard Vercel build container the cap is ~8 GB but it can be tighter on hobby/preview tiers and earlier OOMs may be killed by container memory rather than V8.
- `--legacy-peer-deps` was added in commit `0602498` (Phase 1.5) because peer-dep resolution failed under strict npm.

---

## 3. Page count

| Metric | Count |
|---|---|
| Directories under `src/app/` | **1,373** |
| Page files (`page.{tsx,ts,js,jsx}`) under `src/app/` | **166** |
| Route handler files (`route.{ts,js}`) under `src/app/` | **895** |
| → API route handlers under `src/app/api/` | **882** |
| Layout files (`layout.tsx`) under `src/app/` | 15 |
| Pages-router files under `src/pages/` | **2** (likely `/lab/canvas` bypass + 1 fallback) |
| Top-level `app/` or `pages/` outside `src/` | 0 |

**Total compile units Next.js processes:** ~1,063 (166 pages + 895 route handlers + 2 pages-router). This is the dominant build-graph size driver. Every one of them is a separate compilation entry point.

### API route distribution (top groups)

| Group | Route handlers |
|---|---|
| `api/admin` | **304** |
| `api/templates` | 26 |
| `api/validation` | 19 |
| `api/training` | 17 |
| `api/sounds` | 14 |
| `api/viral-prediction` | 10 |
| `api/script` | 10 |
| `api/bloomberg` | 10 |
| `api/scale` | 9 |
| `api/experiments` | 9 |
| `api/cron` | 9 |
| `api/studio` | 8 |
| `api/ops` | 8 |
| `api/creator` | 8 |
| (everything else) | 421 |
| **Total** | **882** |

The `api/admin` group alone (304 route handlers) is larger than most full Next.js apps.

---

## 4. Force-dynamic audit

| Metric | Count |
|---|---|
| Files containing `export const dynamic = 'force-dynamic'` under `src/app/` | **1,049** |

That's **more files than there are page + route handlers combined** (~1,063), meaning effectively every page and every route handler now has `force-dynamic`. The +1 over total is likely a server-action / shared module that re-exports the symbol.

### Distribution by top-level directory

| Path | Files with force-dynamic |
|---|---|
| `src/app/api` | **884** |
| `src/app/admin` | **69** |
| `src/app/sandbox` | 19 |
| `src/app/agency` | 13 |
| `src/app/(public)` | 7 |
| `src/app/auth` | 5 |
| `src/app/analytics` | 4 |
| `src/app/settings` | 3 |
| `src/app/(auth)` | 3 |
| `src/app/templates` | 2 |
| `src/app/studio` | 2 |
| `src/app/l` | 2 |
| `src/app/enhanced-components` | 2 |
| (singletons) | many |

**Observation:** `force-dynamic` prevents static prerendering but does NOT reduce compile-time work. Next.js still has to:
- Parse the file
- Run the optimizePackageImports analyzer
- Run RSC compilation (because of `optimizeServerReact: true`)
- Build the per-route bundle and trace its dependencies for `output: 'standalone'`

So the multiple commits that added `force-dynamic` (`da993d9` = 640 routes, `91ec27e` = admin, `fbcd4ac` = remaining pages, `07b960e` = removed it from `'use server'` files) addressed a different failure mode (build-time fetch / build-time eval crashes), not heap pressure from compilation itself.

---

## 5. Static generation triggers

`generateStaticParams` appears in **only 2 files**:

| File | Static params produced |
|---|---|
| `src/app/l/[niche]/[platform]/page.tsx` | 4 niches × 4 platforms = **16** |
| `src/app/l/premium/[niche]/[platform]/page.tsx` | 4 niches × 4 platforms = **16** |

Total: **32 statically generated pages**, and the niche/platform lists are hard-coded constants (`['business','creator','fitness','education']` and `['linkedin','twitter','facebook','instagram']`). No DB iteration, no large dataset traversal.

Also notable: **both files ALSO declare `export const dynamic = 'force-dynamic'`** — these directives contradict each other. Next.js typically resolves this in favor of dynamic rendering, but the static path still gets generated at build time as far as the planner is concerned.

`getStaticProps` / `getStaticPaths` (pages router): **0 occurrences**.

**Conclusion:** Static generation is NOT the source of OOM. The dataset being iterated is 16 trivial combinations of string constants.

---

## 6. Last build log — SIGKILL line

**Not available locally.** The Vercel CLI is not installed on this machine (`vercel: command not found`). There are no local build-log artifacts (no `vercel-build*.log`, no `build*.log`, no `.vercel/output/`).

**To obtain the precise SIGKILL line, the user needs to:**
- Pull it from the Vercel dashboard's Deployments → failed deployment → "Build Logs" tab, **OR**
- Install Vercel CLI (`npm i -g vercel`), `vercel login`, `vercel link`, then `vercel inspect <url> --logs`

**What the commit history strongly suggests is happening at OOM time** (inferred, not verified — needs Vercel log to confirm):
- `3be7600` / `02ed265` lazy-init'd Supabase clients. This is a signature of OOM during the **"Collecting page data"** or **"Generating static pages"** phase, where Next.js spawns worker processes to import every page/route to read its exports (`dynamic`, `revalidate`, `runtime`, `generateMetadata`, etc.). If a module imports a Supabase client at top level, the client is constructed in every worker — multiplied by the worker count it can balloon heap.
- `b097a09` reverted an `experimental.cpus: 2` cap, meaning the team tried throttling worker count and it did NOT help — points away from worker-multiplication being the primary cause, and toward a single-process compile/trace pass that exceeds the heap.

**Highest-probability OOM phase candidates** (still needs log confirmation):
1. `Collecting page data` — running each of 1,063 entrypoints' top-level code to read its exports
2. `Generating static pages` — running the 32 SSG pages including `generateMetadata` (which calls `ContentGeneratorService.getInstance().generateNichePage(...)` per page)
3. Webpack server compilation with `optimizeServerReact: true` analyzing all 166 page components' RSC trees

---

## 7. Last 10 commits touching build / `next.config.mjs` / `vercel.json`

| Commit | Subject |
|---|---|
| `b097a09` | revert(build): remove `cpus: 2` experimental flag; did not help build memory |
| `3be7600` | fix(build): lazy-init Supabase client in `emit.ts`; limit build workers to 2 |
| `51b7af1` | Layer 1 cleanup: triage dispositions executed *(touches `next.config.mjs`)* |
| `0602498` | Phase 1.5: add `--legacy-peer-deps` to npm install *(touches `vercel.json`)* |
| `dccf1b5` | Phase 1: lock package manager to npm + recover silently-excluded source files *(touches `vercel.json`)* |
| `b280d13` | Fix Problem A: overnight-triage Vercel cron + Problem B dev auth fallback *(touches `vercel.json`)* |
| `98f346a` | fix: externalize `jsdom` and `isomorphic-dompurify` for Vercel build |
| `97071ef` | fix: disable `instrumentationHook` to unblock dev server boot |
| `dbfdb16` | fix: externalize `fluent-ffmpeg` so instrumentation hook can bundle |
| `1a2fcf8` | atlas crons: auto-start scheduler on dev server boot via instrumentation hook |

### Build-fix narrative (commits matching `build|fix|OOM|memory|vercel|deploy|force-dynamic`)

Chronological — oldest at bottom:

| Commit | Subject |
|---|---|
| `3267405` | snapshot: full project state 2026-05-12 |
| `02ed265` | fix(build): lazy-init Supabase clients in 3 high-leverage modules + gate rate-limiter cleanup timer |
| `b097a09` | revert(build): remove `cpus: 2` experimental flag; did not help build memory |
| `3be7600` | fix(build): lazy-init Supabase client in `emit.ts`; limit build workers to 2 |
| `07b960e` | fix(build): remove `force-dynamic` from `'use server'` page files |
| `fbcd4ac` | fix(build): delete 14 abandoned trees and force-dynamic remaining pages |
| `91ec27e` | fix(build): mark admin pages and API routes as `force-dynamic` |
| `159fd12` | fix(build): correct `nodemailer.createTransporter` typo |
| `05c364f` | fix(build): lazy-init Supabase clients for Vercel compatibility |
| `da993d9` | Phase 1.6: add `force-dynamic` to 640 API routes to fix Vercel build OOM |
| `0602498` | Phase 1.5: add `--legacy-peer-deps` to npm install |
| `dccf1b5` | Phase 1: lock package manager to npm + recover silently-excluded source files |
| `1b32bf6` | chore: temporarily disable broken routes to unblock Vercel deploy |
| `98f346a` | fix: externalize `jsdom` and `isomorphic-dompurify` for Vercel build |
| `f6232a4` | deploy: add `.vercelignore` and refresh `pnpm-lock.yaml` for Vercel preview |

**Pattern read:** Five distinct fix axes have been attempted, none verified successful:
1. Mass `force-dynamic` ramp (~640 + remaining routes)
2. Lazy-init Supabase clients (3 modules + emit.ts)
3. Cap build workers (`cpus: 2`, reverted as ineffective)
4. Externalize heavy native deps (jsdom, isomorphic-dompurify, fluent-ffmpeg, ffmpeg-static, ffprobe-static)
5. Remove `force-dynamic` from `'use server'` files (this combination was actually invalid and would crash the build with a different error)

---

## 8. Package size

`node_modules/` total size could not be measured by `du -sh` (Windows path semantics return 0). Top packages by recursive size (via PowerShell, MB):

| Size (MB) | Package |
|---:|---|
| **1,110.4** | `node_modules/.pnpm` ⚠ |
| **767.8** | `node_modules/.ignored` ⚠ |
| 335.2 | `ffprobe-static` |
| 259.3 | `@next` (scoped: SWC binaries for all platforms) |
| 82.7 | `next` |
| 77.5 | `ffmpeg-static` |
| 33.8 | `wordnet-db` (transitive of `natural`) |
| 29.2 | `tesseract.js-core` |
| 23.3 | `lucide-react` |
| 21.8 | `typescript` |
| 21.1 | `date-fns` |
| 19.0 | `@img` (scoped: `sharp` native binaries) |
| 14.0 | `stripe` |
| 13.2 | `natural` |
| 11.8 | `chromium-bidi` (transitive of `puppeteer-core`) |

**Total `node_modules`: roughly 3.0–3.5 GB locally** (1.1 GB `.pnpm` + 0.77 GB `.ignored` + ~1.2 GB miscellaneous flat tree).

### Lockfile / package-manager state — POTENTIAL ANOMALY

- `vercel.json` says `installCommand: "npm install --legacy-peer-deps"`.
- Only `package-lock.json` is present in repo (no `pnpm-lock.yaml`, no `yarn.lock`).
- BUT the local `node_modules/` contains a **`.pnpm/` directory (1.1 GB)** and a **`.ignored/` directory (0.77 GB)** — both are pnpm-specific layouts.
- `package.json` has no `engines` field and no `packageManager` field.
- Commit `dccf1b5` is titled "Phase 1: lock package manager to npm" and commit `f6232a4` references `pnpm-lock.yaml` — there's been a pnpm→npm migration in the project's history.
- Commit `dccf1b5`'s subject mentions "recover silently-excluded source files," suggesting a previous package-manager mismatch was causing files to be missing from builds.

**Implication:** The local install is not what Vercel reproduces. The local `.pnpm` layer is residue and not used by Vercel, so it doesn't appear in the Vercel build container. The Vercel build does a clean `npm install --legacy-peer-deps` against `package-lock.json` (~87 dependencies + 34 dev dependencies = 121 direct deps; transitively, this resolves to ~1,124 packages locally). Heaviest non-`.pnpm` first-party packages on Vercel will be `ffprobe-static`, `@next` SWC binaries, `ffmpeg-static`, `wordnet-db`, `tesseract.js-core`, `sharp` (`@img`), `puppeteer-core` and its `chromium-bidi` dep.

### Heavyweight deps from `package.json` (relevant subset)

```
@google/genai          ^1.43.0
@anthropic-ai/sdk      ^0.71.2
openai                 ^4.104.0
@ai-sdk/{react,anthropic,openai}
@clerk/nextjs          ^5.1.3
@supabase/{ssr,supabase-js,auth-helpers-nextjs}
next                   ^14.2.28
puppeteer-core         ^24.12.0      ← brings chromium-bidi
sharp                  ^0.34.3       ← native, ~19MB @img
ffmpeg-static          ^5.2.0        ← 77 MB binary
fluent-ffmpeg          ^2.1.3        ← externalized in webpack
apify / apify-client                 ← externalized server-side
tesseract.js / tesseract.js-core     ← async-WASM enabled in webpack
natural                ^8.1.0        ← brings wordnet-db (34 MB)
d3, recharts, chart.js, chartjs-2, html2canvas
14 @radix-ui/* packages
playwright / @playwright/test         (devDependency)
@axe-core/playwright                  (devDependency)
```

`puppeteer-core@24.12.0` is unusually heavy in modern versions; combined with `playwright` in devDependencies (`devDependencies` ARE installed by default on Vercel unless `NPM_CONFIG_PRODUCTION=true` or `--production` is set, which they are not in `vercel.json`), browser-automation binaries are present at build time.

---

## Cross-cutting observations (factual, not prescriptive)

These are facts established by the data above. No fix recommendations.

1. **Build surface area is ~1,063 entry points** (166 pages + 895 route handlers + 2 pages-router files), of which 1,049 declare `force-dynamic`. Next.js still compiles all of them at build time.

2. **`force-dynamic` only changes runtime rendering**, not build-time compile. The 5+ commits adding `force-dynamic` (peaking at 640 routes in `da993d9`) cannot reduce peak build heap by themselves; they only prevent SSG attempts that may have been calling external services at build time.

3. **`experimental.optimizeServerReact: true` is active.** This is documented in Next 14 release notes as increasing peak build memory because it adds a server-component-graph analysis pass.

4. **`experimental.optimizePackageImports` lists 17 packages**, several of which are large (`recharts`, `d3`, `chart.js`, `lucide-react`, all `@radix-ui/*`). This adds a per-page analysis pass that scans imports for unused exports.

5. **`output: 'standalone'` is active in Vercel builds** (gated on `NODE_ENV === 'production'`). Standalone adds the `@vercel/nft` file-tracing pass over the full server bundle, which can spike RAM substantially when many route handlers each pull in large transitive graphs (e.g., `apify`, `natural`+`wordnet-db`, `tesseract.js`, `puppeteer-core`, `sharp`).

6. **Two conflicting directives co-exist** in `src/app/l/[niche]/[platform]/page.tsx` and `src/app/l/premium/[niche]/[platform]/page.tsx`: both `generateStaticParams` (with 16 combos) and `export const dynamic = 'force-dynamic'`. The data set is trivial; this is not the OOM source but is internally inconsistent.

7. **Build workers commit history is informative**: commit `3be7600` "limit build workers to 2" coexisted with the `cpus: 2` experimental flag (since reverted in `b097a09`). Reverting did not help. This is consistent with the OOM being a single-process peak (compile or NFT trace) rather than a worker-multiplication issue.

8. **`api/admin` alone has 304 route handlers.** Whatever shared library code that group imports (Supabase clients, auth helpers, telemetry, agency context, kai-orchestrator, etc.) is loaded 304 times during the "collecting page data" phase.

9. **No `NODE_OPTIONS=--max-old-space-size=…` is configured** in `vercel.json`, `package.json`, `.npmrc`, or anywhere visible. The Vercel build runs with V8 defaults for the build container.

10. **Two pieces of data the diagnostic cannot resolve without Vercel-side access:**
    - The exact phase/route shown on the last line before SIGKILL (needed: dashboard build log or Vercel CLI).
    - The actual RSS at OOM time and the Vercel project's effective memory limit on its build container.

---

## Outstanding info still required (for any future fix attempt)

1. Vercel dashboard build-log tail (last ~80 lines before SIGKILL), specifically the phase header (`Collecting page data`, `Generating static pages`, `Creating an optimized production build`, `Finalizing page optimization`, or `Tracing files...`).
2. The Vercel project's plan/tier — determines build container memory ceiling.
3. Whether the Vercel project sets `NODE_OPTIONS` in its environment-variables UI (this would override / supplement what's in repo).
4. Whether `NPM_CONFIG_PRODUCTION=true` is set in Vercel env (would skip devDependencies and shrink the install).
