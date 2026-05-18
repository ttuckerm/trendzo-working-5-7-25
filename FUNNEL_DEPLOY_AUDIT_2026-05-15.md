# Escape Assessment Funnel Deploy Audit — 2026-05-15

Repo root: `C:\Projects\CleanCopy` (branch: `vercel-deploy-test`). Paths are repo-relative unless noted. Builds on `FUNNEL_INVENTORY_2026-05-15.md`.

---

## Section 1: The Funnel's Deployable Surface

### Funnel pages — all confirmed to exist

| Route | File | Verified |
|---|---|---|
| `/` | `src/app/page.tsx` | yes — landing, 67 lines |
| `/welcome` | `src/app/(public)/welcome/page.tsx` | yes |
| `/free/freedom-os` | `src/app/(public)/free/freedom-os/page.tsx` + `FreedomOSTool.tsx` | yes |
| `/assessment/[assessmentId]` | `src/app/assessment/[assessmentId]/page.tsx` (+ `loading.tsx`, `not-found.tsx`) | yes |

### Funnel API routes — verification

All paths under `src/app/api/`. `route.ts` checked for each.

| Route | File | Funnel-used? |
|---|---|---|
| `/api/landing/code-validate` | `landing/code-validate/route.ts` | yes — CodeEntry on `/` |
| `/api/landing/email-notify` | `landing/email-notify/route.ts` | yes — landing-page notification CTA |
| `/api/checkout/create-session` | `checkout/create-session/route.ts` | yes — PaidCheckoutButton |
| `/api/checkout/verify-session` | `checkout/verify-session/route.ts` | yes — server-side `verifySession()` via `@/lib/stripe/verify` (the `/api/checkout/verify-session` HTTP endpoint exists but is not currently called from any client; the same logic is used directly by `/welcome` and `/free/freedom-os` server components) |
| `/api/checkout/webhook` | `checkout/webhook/route.ts` | yes — Stripe webhook |
| `/api/assessment/generate` | `assessment/generate/route.ts` | yes — POSTed from `FreedomOSTool.tsx:175` |
| `/api/assessment/email-capture` | `assessment/email-capture/route.ts` | yes — POSTed from `AgentRail.tsx:197` and `AgentGate.tsx:228` |
| `/api/assessment/email-status` | `assessment/email-status/route.ts` | yes — fetched from `AgentRail.tsx:142` and `AgentGate.tsx:54` |
| `/api/assessment/sprint-progress` | `assessment/sprint-progress/route.ts` | yes — POSTed from `SprintGrid.tsx:84` and `Day1Spotlight.tsx:78` |
| `/api/freedom-agent/chat` | `freedom-agent/chat/route.ts` | yes — POSTed from `AgentRail.tsx:263` |
| `/api/freedom-agent/conversation` | `freedom-agent/conversation/route.ts` | yes — fetched from `AgentRail.tsx:54` |

### `/api/freedom-agent/*` confirm-whether-funnel-uses

Greps confirmed in `src/`:

- `/api/freedom-agent/history` — **NOT used by funnel.** Called only from `src/app/(public)/free/freedom-agent/[sessionId]/page.tsx:155`. That `[sessionId]` page is the legacy plan-flow agent, NOT the Escape Assessment HUD's `AgentRail`. The Escape funnel uses `/api/freedom-agent/conversation` instead.
- `/api/freedom-agent/session` — **NOT used by funnel.** Called only from `src/app/(public)/free/freedom-agent/page.tsx:26`, the legacy entry page that takes `?planId=`. The Escape funnel never reaches it.
- `/api/freedom-agent/unsubscribe` — **NOT used by funnel.** Referenced only from `src/app/api/freedom-agent/weekly-checkin/route.ts:149` as an unsubscribe link in a weekly-checkin email body.
- `/api/freedom-agent/weekly-checkin` — **NOT used by funnel at user-touch time.** Pure cron job. Listed in `vercel.json:11-14` with schedule `'0 10 * * 1'`. It emails legacy `freedom_agent_sessions` users; the Escape funnel does not write to that table.

INFERRED: The Escape Assessment funnel needs **only `chat` and `conversation`** from `/api/freedom-agent/*`. The other four can be excluded from the techyai.co deploy without breaking funnel behavior.

### Smallest funnel surface — full list

**4 pages + 11 API routes:**

```
PAGES (4)
  /                                         src/app/page.tsx
  /welcome                                  src/app/(public)/welcome/page.tsx
  /free/freedom-os                          src/app/(public)/free/freedom-os/page.tsx (+ FreedomOSTool.tsx)
  /assessment/[assessmentId]                src/app/assessment/[assessmentId]/page.tsx (+ loading.tsx, not-found.tsx)

API ROUTES (11)
  /api/landing/code-validate
  /api/landing/email-notify
  /api/checkout/create-session
  /api/checkout/verify-session              (server lib also imported directly)
  /api/checkout/webhook
  /api/assessment/generate
  /api/assessment/email-capture
  /api/assessment/email-status
  /api/assessment/sprint-progress
  /api/freedom-agent/chat
  /api/freedom-agent/conversation
```

Supporting code (must ship together): `src/components/landing/*`, `src/components/assessment/*`, `src/components/freedom-os/{HamsterLoader,FreedomMultiplierControl}.tsx`, `src/lib/assessment/*`, `src/lib/freedom-agent/{fetch-conversation,append-message,build-system-prompt}.ts`, `src/lib/prompts/{escape-assessment-prompt,freedom-agent-prompt}.ts`, `src/lib/stripe/*`, `src/lib/beehiiv/notify.ts`, `src/lib/funnel/segment.ts` (only `classifyEscapeAssessment` half), `src/lib/supabase/server.ts` (only used by `email-notify`), `src/styles/instrument.css`, `src/types/assessment.ts`, `src/types/freedom-agent.ts`, `src/types/email-capture.ts`, plus the root `src/app/layout.tsx`, `src/app/providers.tsx`, `src/app/_app.tsx`, `src/app/_supabase-url-shim.tsx`, `src/app/globals.css`. Migration files under `supabase/migrations/` for the seven funnel tables (see prior audit, Section 11). Public assets: `public/favicon.svg`, `public/favicon.ico`, `public/images/escape-assessment-product.png` (and `src/app/icon.svg`, `src/app/favicon.ico`).

### Non-funnel page routes — grouped (counts per group)

Counts of `page.tsx` files under each top-level prefix. Funnel-only dirs marked with `(funnel)`:

| Prefix | Count | One-line description |
|---|---|---|
| `/admin/*` | 69 | Admin/operator console (prediction, training, briefs, pack-health, etc.) — **protected by middleware** |
| `/sandbox/*` | 19 | Internal sandbox / experiment pages |
| `/agency/*` | 13 | Agency-side dashboard surface — **protected by middleware** |
| `/(public)/*` | 7 (incl. funnel) | `(public)/welcome` + `(public)/free/freedom-os` + `(public)/free/freedom-os/plan/[planId]` (legacy) + `(public)/free/freedom-agent` (legacy) + `(public)/free/freedom-agent/[sessionId]` (legacy) + `(public)/free/page.tsx` (free-tools hub) + `(public)/t/[shareId]` (creator card share) |
| `/auth/*` | 5 | Login flow handlers (callback, error, magic-link, save-template) |
| `/analytics/*` | 4 | Analytics dashboards (presumed) |
| `/(auth)/*` | 3 | login, signup, onboarding |
| `/settings/*` | 3 | User settings |
| `/templates/*` | 2 | Template browsing |
| `/l/*` | 2 | Short-link redirector (presumed) |
| `/studio/*` | 2 | Creator studio |
| `/enhanced-components/*` | 2 | Component demo pages |
| `/(dev)/*` | 1 | Dev-only `assessment-test` route |
| `/app/*`, `/basic/*`, `/baseline/*`, `/campaign/*`, `/chairman/*`, `/creator/*`, `/creator-workflow/*`, `/debug/*`, `/docs/*`, `/editor-mvp/*`, `/experts/*`, `/mockup/*`, `/operations-center/*`, `/ops/*`, `/os-canvas/*`, `/prediction/*`, `/proof/*`, `/public-templates/*`, `/qa/*`, `/remix/*`, `/sandbox-landing/*`, `/sound-trend-test/*`, `/sound-trends/*`, `/system-status/*`, `/template-completion/*`, `/template-preview/*`, `/templates-browse/*`, `/trend-predictions/*`, `/access/*`, `/access-denied/*` | 1 each | One-off pages — mostly internal/dev/demo |
| `/assessment/*` | 1 | (funnel) |

Total `page.tsx` files repo-wide: **164**. Funnel: **4**. Non-funnel: **160**.

### Non-funnel API routes — grouped (counts per top-level prefix)

200 directories under `src/app/api/`, **882 `route.ts` files total**. Funnel uses 11. The largest non-funnel groups:

| Prefix | Routes | Description (from folder name) |
|---|---|---|
| `/api/admin/*` | 304 | Admin/operator backend (training, prediction, ML, briefs, pack-health, monitoring) |
| `/api/templates/*` | 26 | Template CRUD/search |
| `/api/validation/*` | 19 | Pipeline validation |
| `/api/training/*` | 17 | Training pipeline (Bucket 3) |
| `/api/sounds/*` | 14 | Sound-trend telemetry |
| `/api/viral-prediction/*`, `/api/script/*`, `/api/bloomberg/*` | 10 each | Prediction-related |
| `/api/scale/*`, `/api/experiments/*`, `/api/cron/*` | 9 each | Internal ops + Vercel crons |
| `/api/studio/*`, `/api/ops/*`, `/api/creator/*`, `/api/analytics/*` | 8 each | Creator/analytics |
| `/api/system/*`, `/api/public/*`, `/api/newsletter/*`, `/api/donna/*`, `/api/billing/*` | 7 each | System + comms + alt billing |
| `/api/predict/*`, `/api/freedom-agent/*`, `/api/federated/*`, `/api/etl/*` | 6 each | (freedom-agent: 2 funnel + 4 legacy) |
| `/api/cards/*`, `/api/canvas/*`, `/api/calibration/*`, `/api/bulk-download/*`, `/api/assessment/*`, ... | 5 each | (assessment: all 5 are funnel-ish — see below) |
| ~70 prefixes | 1–4 each | Long tail (chairman-chat, agency-chat, brain, brain-emergency, jarvis, donna, dna-detective, kai, atlas, clay, …) |

Notes:
- `/api/assessment/*` has 5 routes (`generate`, `email-capture`, `email-status`, `sprint-progress`, `test`). All 4 functional ones are funnel; `test` is a dev route.
- `/api/freedom-agent/*` has 6 routes; only `chat` + `conversation` are funnel.
- `/api/landing/*` has 2 routes; both funnel.
- `/api/checkout/*` has 3 routes; all funnel.
- All other 195 prefixes are **non-funnel**.

INFERRED: **~871 of 882 route.ts files** (98.7%) are non-funnel.

---

## Section 2: Exclusion Mechanisms — What's Possible

### Approach A — `next.config.mjs` route exclusion via env-conditional config

Mechanism: Use Next.js conditional config or experimental output to limit which routes get compiled when `DEPLOY_TARGET=funnel`.

Files that would need to be modified or created:
- `next.config.mjs` — add `DEPLOY_TARGET`-gated logic
- Possibly a build-time codegen script if using `pageExtensions` to remap

Blockers:
- **Next.js App Router does NOT support a built-in include/exclude for routes** based on env at build time. The closest mechanism is `pageExtensions` (rename file extensions per env) — but that requires file-tree changes per build, which is fragile.
- `next.config.mjs` already has a complex webpack config (lines 119-166) tied to ffmpeg/Apify/ioredis externals for the non-funnel half. If those modules become unreachable, leaving the externals harmless; but if any funnel route incidentally imports them (none do today, per Section 9 of the prior audit), exclusion could break the build.
- Conditional `rewrites()` could 404 non-funnel paths, but it would not exclude their code from the build (they'd still bundle).
- The redirects in `next.config.mjs:168-222` reference non-funnel routes (`/admin/engine-room`, `/admin/operations-center`, `/dashboard-view/trend-predictions-dashboard`) — these become dead links in funnel-only builds, but not breakage.

Vercel-specific concerns:
- Env vars: set `DEPLOY_TARGET=funnel` per-project in the techyai.co Vercel project. Vercel propagates env at build, so `process.env.DEPLOY_TARGET` is readable in `next.config.mjs` (it executes at build/start time).
- Build caching: a single repo with two Vercel projects will share neither cache nor `.next` output; OK.
- Branch-to-project mapping: techyai.co Vercel project can point at branch `vercel-deploy-test` (or whatever the funnel branch is). The trendzo.com Vercel project points at `main`.

Scope estimate: **Medium**. The clean version of this requires moving non-funnel routes (or wrapping them) so that they tree-shake out cleanly. Roughly: 1 file modified (`next.config.mjs`); 0 files created if you accept that non-funnel routes are still compiled but unreachable.

### Approach B — Vercel ignored-build-step + middleware-based 404

Mechanism: keep one `next.config.mjs`, but in `src/middleware.ts` check `process.env.DEPLOY_TARGET === 'funnel'` and return `NextResponse.rewrite(new URL('/not-found', request.url))` (or `new NextResponse(null, { status: 404 })`) for any URL whose pathname doesn't match the funnel allowlist. The non-funnel files still build, but are unreachable publicly.

Files that would need to be modified or created:
- `src/middleware.ts` — add funnel allowlist and `DEPLOY_TARGET` gate (~30 lines of additions)
- Optionally a new `src/app/not-found.tsx` polish for the funnel deploy (the current root-level `src/app/not-found.tsx` exists at 1523 bytes and is generic)

Blockers:
- The current matcher (`middleware.ts:236-241`) already covers all non-static URLs, so the middleware runs everywhere it needs to. Good.
- Middleware runs on the Edge runtime. Cannot import `@supabase/*` (already noted in `middleware.ts:5-9`). Adding a path-allowlist string check is trivial — no extra deps.
- The funnel currently relies on the dev short-circuit `NEXT_PUBLIC_DISABLE_AUTH=true` (`middleware.ts:168-170`). For techyai.co prod, you'd want to set this `false` OR set it `true` but rely solely on the new funnel-allowlist gate. Either works; **the new gate must take precedence over the disable-auth short-circuit** or the allowlist won't be enforced.
- The standalone build still includes the bundled non-funnel server code; this is wasteful but not a correctness risk.

Vercel-specific concerns:
- Env var: set `DEPLOY_TARGET=funnel` on techyai.co Vercel project.
- No build caching changes.
- Same branch-mapping option as Approach A.

Scope estimate: **Small**. One file modified (`src/middleware.ts`). The non-funnel code is still in the build, but a single env var flips the public surface.

### Approach C — Split into a Next.js workspace / monorepo

Mechanism: Restructure repo into `apps/funnel/` and `apps/trendzo/` (and `packages/shared/` for cross-app code), drive Vercel with `rootDirectory` per project.

Files that would need to be modified or created:
- New: `apps/funnel/`, `apps/trendzo/`, `packages/shared/`, `pnpm-workspace.yaml` (or `package.json` workspaces), per-app `next.config.mjs`, per-app `package.json`, per-app `tsconfig.json`
- Move: every funnel file listed in Section 1 (4 pages + 11 API routes + ~25 supporting files) into `apps/funnel/`
- Move: everything else into `apps/trendzo/`
- Move: shared code (types, the 2 shared lib files, possibly `instrument.css`) into `packages/shared/`
- Modify: `vercel.json` (or remove; per-app Vercel config)
- Modify: all `@/` import aliases in moved files (they currently resolve to `src/`; the new structure needs per-app `tsconfig.json` paths or workspace-package imports)

Cross-imports beyond the two "Connected" files in prior audit (`@/lib/supabase/server.ts`, `@/lib/funnel/segment.ts`):

Greps confirm **none new found**. Imports from funnel files that reach outside the funnel module set:
- `src/app/api/landing/email-notify/route.ts:2` → `@/lib/supabase/server` (already flagged)
- `src/app/api/assessment/email-capture/route.ts:9` → `@/lib/funnel/segment` for `classifyEscapeAssessment` (already flagged)
- Everything else in funnel files is intra-funnel (`@/lib/assessment/*`, `@/lib/stripe/*`, `@/lib/beehiiv/*`, `@/lib/freedom-agent/*`, `@/lib/prompts/*`, `@/types/*`, `@/components/landing/*`, `@/components/assessment/*`, `@/components/freedom-os/{Hamster,FreedomMultiplier}`) or external packages.

Blockers:
- Root `src/app/layout.tsx` imports `@/lib/contexts/StateContext` and `@/components/FlagProviderClient` (`layout.tsx:8-9`). The funnel-only build would need a stripped-down layout that doesn't pull those. INFERRED: This is a small refactor — replace `layout.tsx` with a minimal funnel version in `apps/funnel/`.
- `src/app/_app.tsx`, `_supabase-url-shim.tsx`, `providers.tsx` would each need review for non-funnel imports.
- `supabase/migrations/` is repo-wide; either share, or duplicate the 7 funnel-related ones into `apps/funnel/supabase/migrations/`.
- ~22 Vercel cron paths in `vercel.json:6-31` — none of them belong to the funnel except `/api/freedom-agent/weekly-checkin` (legacy; not funnel-active). The funnel project's `vercel.json` would have zero crons.

Vercel-specific concerns:
- Each Vercel project sets its own `rootDirectory` (e.g., `apps/funnel`).
- Env vars are per-project — clean separation.
- Build caching independent per app — actually faster than monolithic.
- Branch-to-project mapping unchanged.

Scope estimate: **Large**. Files-touched count is ~50 files moved, plus tooling config (workspaces, tsconfig, per-app `next.config.mjs`, root-layout strip-down). High one-time cost; lowest long-term tax.

### Summary table

| Approach | Files modified | Files created | Non-funnel code in build? | One-time cost | Long-term tax |
|---|---|---|---|---|---|
| A — next.config exclusion | 1 | 0 | yes (mostly) | Medium | Medium |
| B — middleware 404 | 1 | 0–1 | yes (all) | Small | Small |
| C — monorepo split | ~50 (moves) | ~10 | no | Large | Smallest |

---

## Section 3: The Current `next.config.mjs`

Full contents at `next.config.mjs` (240 lines):

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
```

Highlights:

- **Route exclusion** — `next.config.mjs` has NO explicit page/route inclusion or exclusion logic.
- **Env-conditional config** — line 15: `...(process.env.NODE_ENV === 'production' ? { output: 'standalone' } : {})` — only `output: 'standalone'` flips on `NODE_ENV=production`. No `DEPLOY_TARGET` logic exists yet.
- **Output mode** — `output: 'standalone'` (line 15) when production. This is critical for Vercel/Docker. No `output: 'export'`.
- **Rewrites** (`next.config.mjs:224-235`) — proxies `/api/openai/:path*` → `https://api.openai.com/:path*` (non-funnel use case), and rewrites `/lab/canvas` → `/lab-canvas` (non-funnel).
- **Redirects** (`next.config.mjs:168-222`) — 7 entries, all non-funnel except `/favicon.ico` → `/favicon.svg` (lines 172-176). The rest reference `/trend-predictions/*`, `/admin/engine-room`, `/admin/operations-center` — all non-funnel routes. None affect the funnel.
- **Headers** — NOT FOUND. There is no `async headers()` block. No CSP, no Strict-Transport-Security, no X-Frame-Options. The image config does set CSP on SVG-rendered images only (`images.contentSecurityPolicy`, line 76).
- **Webpack / Turbopack tweaks** (`next.config.mjs:119-166`) — extensive:
  - Externals: `ffmpeg-static`, `ffprobe-static`, `fluent-ffmpeg`, `apify`, `apify-client`, `ioredis`, `pg`, `@supabase/realtime-js`, `@supabase/gotrue-js`
  - `IgnorePlugin` for `natural`, `webworker-threads`, optional client-side stubs for `apify`/`apify-client`
  - `experiments.asyncWebAssembly = true` (tesseract.js)
  - `serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify']`
  - `experimental.instrumentationHook: false` (line 87) — temporarily disabled per the inline comment 2026-04-21
  - `optimizePackageImports` for 14 packages
  - `outputFileTracingExcludes: ['**/whisper_env/**', '**/node_modules/**/.bin/**']`
- **Image config** (`next.config.mjs:30-77`) — 9 remote hostnames allowed (`placehold.co`, `randomuser.me`, `placekitten.com`, `replicate.com`, `replicate.delivery`, `firebasestorage.googleapis.com`, `images.unsplash.com`, `lh3.googleusercontent.com`, `picsum.photos`). `dangerouslyAllowSVG: true`. None of these are funnel-required (funnel uses `<img>` in `welcome/page.tsx:110`, not next/image).
- **Compiler** — `removeConsole` in production (excludes `error`/`warn`).
- **`poweredByHeader: false`**, **`generateEtags: false`**, **`compress: true`**.
- **`eslint.ignoreDuringBuilds: true`** (line 23) and **`typescript.ignoreBuildErrors: true`** (line 27).

### `vercel.json`

Full contents (32 lines):

```json
{
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "crons": [
    { "path": "/api/cron/recency-decay",        "schedule": "0 3 * * 0"   },
    { "path": "/api/freedom-agent/weekly-checkin", "schedule": "0 10 * * 1" },
    { "path": "/api/atlas/feedback-collector",  "schedule": "0 6 * * *"   },
    { "path": "/api/cron/cultural-scan",        "schedule": "30 0 * * *"  },
    { "path": "/api/cron/classify-events",      "schedule": "0 1 * * *"   },
    { "path": "/api/cron/overnight-triage",     "schedule": "0 6 * * *"   }
  ]
}
```

Six cron entries. **None of them belong to the Escape Assessment funnel.** A techyai.co Vercel project would drop the `crons` array entirely (or keep `weekly-checkin` if the legacy email nurture is wanted, but per the prior audit it targets the legacy `freedom_agent_sessions` table not the funnel's `assessment_emails`).

---

## Section 4: Middleware Behavior for the Exclusion Question

### Matcher config

`src/middleware.ts:236-241`:

```js
export const config = {
  matcher: [
    // Page routes (exclude static assets)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

The middleware runs on every URL except `_next/static`, `_next/image`, `favicon.ico`, and image extensions. It runs on every funnel and non-funnel route.

### Per-prefix middleware behavior in production (NEXT_PUBLIC_DISABLE_AUTH=false)

The middleware logic (`middleware.ts:168-234`) for each prefix:

- If pathname matches `PUBLIC_PREFIXES` (`/free`, `/login`, `/signup`, `/auth`, `/api/free`, `/api/freedom-agent`, `/api/funnel`, `/api/auth`, `/api/health`, `/api/ping`, `/api/cron`) → `NextResponse.next()`. **PUBLIC.**
- Else if `getRequiredRoles(pathname)` returns non-null (matches `PROTECTED_ROUTES`) → run auth check.
- Else (the **catch-all path** for everything else) → `NextResponse.next({ request })`. **PUBLIC.**

`PROTECTED_ROUTES` (`middleware.ts:33-45`):
- `/chairman` → chairman
- `/admin` → chairman, sub_admin
- `/agency` → chairman, sub_admin, agency
- `/creator` → chairman, sub_admin, agency, creator
- `/dashboard` → chairman, sub_admin, agency, developer, creator, clipper
- `/onboarding` → all logged-in roles
- `/api/admin` → chairman, sub_admin
- `/api/agency-chat` → chairman, sub_admin, agency
- `/api/chairman-chat` → chairman, sub_admin

### Per-prefix blocking in production (NEXT_PUBLIC_DISABLE_AUTH=false, anon visitor)

| Top-level prefix | Middleware blocks anon? |
|---|---|
| `/admin/*` | YES — redirected to `/login?redirect=...` |
| `/chairman/*` | YES |
| `/agency/*` | YES |
| `/creator/*` | YES |
| `/dashboard/*` | YES (route doesn't exist as page.tsx at top level — but middleware would protect any) |
| `/onboarding/*` | YES |
| `/api/admin/*` | YES — 401 |
| `/api/agency-chat/*`, `/api/chairman-chat/*` | YES — 401 |
| `/free/*` | NO — public allowlist |
| `/api/freedom-agent/*` | NO — public allowlist |
| `/api/free/*`, `/api/funnel/*`, `/api/auth/*`, `/api/health/*`, `/api/ping/*`, `/api/cron/*` | NO — public allowlist |
| **Everything else** | **NO — catch-all `NextResponse.next()`** |

### Non-funnel routes that ARE public in production (leak risks under techyai.co)

These are routes NOT in the funnel AND NOT protected by middleware. **All would be publicly reachable at techyai.co/$path without intervention:**

**Page routes (anon-accessible):**
- `/access`, `/access-denied`, `/analytics/*` (4 pages), `/app`, `/assessment/*` (the funnel one + dev (`(dev)/assessment-test`)), `/baseline`, `/basic`, `/campaign`, `/components`, `/creator-workflow`, `/debug`, `/docs`, `/editor-mvp`, `/enhanced-components/*` (2), `/env-demo`, `/experts`, `/integrations`, `/l/*` (2), `/lib`, `/membership`, `/mockup`, `/nl`, `/operations-center`, `/ops`, `/os-canvas`, `/plain`, `/prediction`, `/proof`, `/public`, `/public-templates`, `/qa`, `/remix`, `/sandbox/*` (19), `/sandbox-landing`, `/settings/*` (3), `/sound-trend-test`, `/sound-trends`, `/status`, `/studio/*` (2), `/system-status`, `/template-completion`, `/template-preview`, `/templates/*` (2), `/templates-browse`, `/trend-predictions`, `/widget`
- `/(auth)/login`, `/(auth)/signup`, `/(auth)/onboarding` — these render but the `(auth)` group has its own client logic; `/onboarding` would redirect once authed. Onboarding's `page.tsx` says "Welcome to Trendzo" (line 157).
- `/(public)/free` (free-tools hub) — renders "Free AI Tools for Creators & Founders | Trendzo"
- `/(public)/free/freedom-agent` (legacy planId flow)
- `/(public)/free/freedom-agent/[sessionId]` (legacy session-id flow)
- `/(public)/free/freedom-os/plan/[planId]` (legacy plan flow)
- `/(public)/t/[shareId]` (creator-card share page, renders `TrendzoCard` component)
- `/auth/*` (5 auth callback handlers)

**API routes (anon-accessible):**
- ~870 of 882 API routes are public to anon callers. Examples: `/api/templates/*` (26), `/api/training/*` (17), `/api/sounds/*` (14), `/api/viral-prediction/*` (10), `/api/script/*` (10), `/api/bloomberg/*` (10), `/api/system-health/*` (3), `/api/clay/*` (3), `/api/jarvis*` (4), `/api/donna/*` (7), `/api/predict/*` (6), `/api/openapi.json` (the OpenAPI spec!), and many more.
- Each of these is reachable at `techyai.co/api/...` unless excluded.

This is the **single biggest deploy blocker** — without an exclusion mechanism, every non-funnel page and API on this repo would be publicly callable at `techyai.co`.

---

## Section 5: Trendzo Mentions in Publicly-Visible Funnel Surfaces

Case-insensitive search across the surfaces the funnel renders or sends.

### `[VISIBLE]` — User-visible copy in funnel pages/components

| File:Line | Context | Classification |
|---|---|---|
| `src/components/landing/HookSection.tsx:18` | `<p className="...">TRENDZO :: ESCAPE ASSESSMENT</p>` — eyebrow over H1 on landing | `[VISIBLE]` |
| `src/app/(public)/welcome/page.tsx:95` | `<p className="...">TRENDZO :: ESCAPE ASSESSMENT</p>` — eyebrow on the "Your Escape Assessment is Ready" page | `[VISIBLE]` |

### `[PROMPT]` — Text the LLM sees (could leak into chat output)

| File:Line | Context | Classification |
|---|---|---|
| `src/lib/prompts/escape-assessment-prompt.ts:11` | `return \`You are the Trendzo Personalization Engine.` — system prompt to Claude when generating the assessment | `[PROMPT]` — narrative-only; output is JSON validated by `validate-payload.ts`, so unlikely to surface verbatim in user-facing payload. Still scrub. |
| `src/lib/prompts/freedom-agent-prompt.ts:48` | `You are powered by Trendzo, an agency-management and creator-analytics platform currently in development as a full product. The Escape Assessment — the system that produced this user's plan — is one capability of the larger Trendzo system.` | `[PROMPT]` |
| `src/lib/prompts/freedom-agent-prompt.ts:50` | `Your job is NOT to sell Trendzo. ...` | `[PROMPT]` |
| `src/lib/prompts/freedom-agent-prompt.ts:52` | `However: you do not hide that Trendzo exists. ...` | `[PROMPT]` |
| `src/lib/prompts/freedom-agent-prompt.ts:58` | `You NEVER pivot a coaching conversation into a sales conversation. You NEVER bring up Trendzo before message 6...` | `[PROMPT]` |
| `src/lib/prompts/freedom-agent-prompt.ts:60` | `"This conversation is running on Trendzo, the agency-in-a-box system we're building..."` — model is **instructed to literally say this to the user** | `[PROMPT]` |
| `src/lib/prompts/freedom-agent-prompt.ts:62` | `Trendzo is for the user when they're ready to operate at scale. The assessment is for them right now.` | `[PROMPT]` |

The freedom-agent-prompt.ts mentions are the most dangerous — the model is **explicitly directed to surface the word "Trendzo" to the end user** under several conditions (message ≥ 6, engagement, "what powers this", scaling questions). This is not a find-and-replace fix; it changes the semantics of the soft-sell. See Section 8.

### `[META]` — Page metadata, OG tags, titles, descriptions

| File:Line | Context |
|---|---|
| `src/app/layout.tsx:21` | `title: 'Trendzo \| AI-Powered Social Media Template Management'` — root layout metadata title (inherited by funnel pages unless overridden) |
| `src/app/page.tsx:31` | `title: 'The Escape Assessment — Trendzo'` — landing page `<title>` |
| `src/app/(public)/welcome/page.tsx:10` | `title: 'Your Escape Assessment is Ready \| Trendzo'` |
| `src/app/(public)/free/freedom-os/page.tsx:8` | `title: 'Generate Your Escape Assessment \| Trendzo'` |
| `src/app/assessment/[assessmentId]/page.tsx:22` | `title: 'Your Escape Assessment — Trendzo'` |

OG-tag check: `src/app/page.tsx:34-38` sets `openGraph.title: 'The Escape Assessment'` and `description: "You weren't the failure. You were the product."` — neither contains "Trendzo".

The other 3 page files do not export `openGraph` keys — they inherit from the root layout, which has no `openGraph` either, so OG tags fall back to `<title>` per Next.js.

### `[ASSET]` — Image/asset references in funnel-rendered pages

| File:Line | Referenced asset | Notes |
|---|---|---|
| `src/app/(public)/welcome/page.tsx:110` | `/images/escape-assessment-product.png` | Plain `<img>`, asset filename is generic — not Trendzo-branded |
| `src/app/layout.tsx:24,25,37` | `/favicon.svg` | Generic name. Did NOT inspect contents. |
| `src/app/favicon.ico`, `src/app/icon.svg` | (built-in Next.js favicon discovery) | Generic name. Contents not inspected. |

**Public folder Trendzo-branded files found in `public/images/`** (NOT referenced by funnel pages per grep):
- `public/images/Trendzo (1).svg`
- `public/images/Trendzo Resized (1).png`
- `public/images/Trendzo logo standard.png`
- `public/images/Trendzo submark logo.svg`
- `public/images/trendzo-logo.png`
- `public/images/trendzo-logo.svg`
- `public/images/trendzo-new-logo.svg`

Grep across `src/components/landing/`, `src/components/assessment/`, `src/components/freedom-os/`, `src/app/page.tsx`, `src/app/(public)/`, `src/app/assessment/` for these filenames: **NOT FOUND.** No funnel surface references any of them. They're dead weight in the funnel deploy — but they'd be reachable at `techyai.co/images/...` since `public/` is served verbatim by Next.js. **Treat as a leak risk** (Section 8).

### `[IDENTIFIER]` — Variable names, comments, internal labels

| File:Line | Context |
|---|---|
| `src/lib/beehiiv/notify.ts:4` | `// the legacy BeehiivService is a Trendzo-era singleton with hardcoded...` — comment only |

### Related-string sweep (case-insensitive)

| Pattern | Search location | Hits in funnel |
|---|---|---|
| `"TZ"`, `"tz-"`, `"tz_"` | `src/components/landing/`, `src/components/assessment/` | NOT FOUND |
| `"@trendzo"` | funnel surfaces | NOT FOUND |
| `"trendzo.com"`, `"trendzo.ai"`, `"trendzo.co"`, `"trendzo.io"` | funnel surfaces (landing, assessment, public, lib/stripe, api/landing, api/checkout, api/assessment, api/freedom-agent/{chat,conversation}, lib/prompts, lib/freedom-agent (active), lib/assessment, lib/beehiiv) | NOT FOUND |
| `"Clay"`, `"AI Employee"`, `"agency operating system"`, `"operator dashboard"` | `src/components/landing/`, `src/components/assessment/`, `src/app/(public)/` | NOT FOUND |
| `"agency-in-a-box"` | funnel | FOUND once at `src/lib/prompts/freedom-agent-prompt.ts:60` (same line covered above as `[PROMPT]`) |

### Total counts

- `[VISIBLE]` user-facing copy: **2 occurrences** in 2 files (HookSection, welcome). Trivial find-and-replace, but they are the eyebrow tag — needs new branding decision.
- `[PROMPT]` LLM-visible: **7 occurrences** in 2 files (escape-assessment-prompt.ts ×1 + freedom-agent-prompt.ts ×6). The freedom-agent ones are **semantically load-bearing** — the agent will reveal "Trendzo" to users under specific conditions.
- `[META]` page metadata: **5 occurrences** in 5 files (root layout + 4 funnel pages).
- `[ASSET]` assets actually referenced by funnel: **1** (escape-assessment-product.png — not Trendzo-named). Plus **7 unreferenced Trendzo-branded files** in `public/images/` that would still be reachable via direct URL.
- `[IDENTIFIER]` comment-only: **1 occurrence** (beehiiv/notify.ts).

**Total: 16 file:line hits across funnel-touched surfaces, plus 7 dead public assets.**

---

## Section 6: Beehiiv Publication and Template Concerns

### Custom field names

The funnel sends **5 distinct custom fields** to Beehiiv:

| Field name | Source | Sent by |
|---|---|---|
| `waitlist_source` | `'landing-page'` (hardcoded) | `src/app/api/landing/email-notify/route.ts:117` |
| `assessment_url` | `${SITE_URL}/assessment/${EA-X-XXX}-{share_token}` (computed) | `src/app/api/assessment/email-capture/route.ts:190` |
| `funnel_segment` | one of `'ready-to-scale'`, `'building-momentum'`, `'stuck-zero'`, `'tire-kicker'` | `src/app/api/assessment/email-capture/route.ts:191` |
| `freedom_number` | `String(Math.round(assessment.payload.freedomNumber.monthlyTarget))` | `src/app/api/assessment/email-capture/route.ts:192` |
| `youtube_source` | `redemption_codes.youtube_source` if code path, else `''` | `src/app/api/assessment/email-capture/route.ts:193` |

The `notify.ts` header comment at lines 17-24 documents the field set and includes `recovery-requested` (tag) — but the funnel only sends the 5 above plus 2 tags below.

### Tag values

The funnel applies these tags:

| Tag | Source | Sent by |
|---|---|---|
| `'high-intent'` | hardcoded | `src/app/api/landing/email-notify/route.ts:119` (landing-page subscribers, no assessment yet) |
| `'ready-to-scale'` \| `'building-momentum'` \| `'stuck-zero'` \| `'tire-kicker'` | computed via `classifyEscapeAssessment` in `src/lib/funnel/segment.ts:211-264` | `src/app/api/assessment/email-capture/route.ts:199` (`tags: [segment]`) |

Comment in `src/lib/beehiiv/notify.ts:20-21` also lists `'recovery-requested'` as a known publication tag, but no funnel code applies it — INFERRED: it's set elsewhere or planned.

### UTM and referring_site values pushed to Beehiiv

`src/lib/beehiiv/notify.ts:99-102`:

```js
utm_source: params.utmSource ?? 'dailylotion',
utm_medium: params.utmMedium ?? 'website',
utm_campaign: params.utmCampaign ?? 'escape-funnel',
referring_site: params.referringSite ?? '',
```

Per-caller overrides:

- `landing/email-notify/route.ts:122-124` — `utmSource: 'dailylotion'`, `utmMedium: 'landing'`, `utmCampaign: <source>` (where `<source>` is `'landing_notify' | 'landing_youtube_fallback'`).
- `assessment/email-capture/route.ts:202-205` — `utmSource: 'dailylotion'`, `utmMedium: 'assessment'`, `utmCampaign: 'escape-assessment'`, `referringSite: assessmentUrl`.

**`utm_source: 'dailylotion'` is the funnel-wide identifier** in Beehiiv. Not Trendzo-branded — keep as-is.

### Publication ID env var name

`BEEHIIV_PUBLICATION_ID` — read in `src/lib/beehiiv/notify.ts:70`. Value not echoed.

### URL construction pointing back at the funnel

These are URLs that need to be `techyai.co` (or the chosen funnel domain) in production:

- `src/app/api/assessment/email-capture/route.ts:168-172` — `assessmentUrl` is built from `NEXT_PUBLIC_SITE_URL || NEXT_PUBLIC_BASE_URL || NEXT_PUBLIC_APP_URL || 'http://localhost:3000'`. This `assessment_url` is pushed to Beehiiv as a custom field and used in welcome emails. **CRITICAL: must point to techyai.co.**
- `src/app/api/checkout/create-session/route.ts:46-47` — `success_url: \`${base}/welcome?source=paid&session_id={CHECKOUT_SESSION_ID}\`` and `cancel_url: \`${base}/?checkout=cancelled\``. `base` is `process.env.NEXT_PUBLIC_SITE_URL` per `create-session/route.ts:12`. **CRITICAL: must point to techyai.co.**
- `src/app/api/freedom-agent/weekly-checkin/route.ts:149,174` (non-funnel but ships with the repo) — hardcodes `agent@updates.trendzo.io` and constructs unsubscribe link `${BASE_URL}/api/freedom-agent/unsubscribe?...`. If the weekly-checkin cron stays in the techyai.co deploy, those URLs would point to the wrong domain. INFERRED: drop the weekly-checkin cron from the funnel deploy (it's legacy anyway).

NOT FOUND — no funnel code anywhere constructs `https://trendzo.*` hardcoded URLs. All funnel-built URLs go through `NEXT_PUBLIC_SITE_URL` (or the three-way fallback above).

---

## Section 7: Env Vars Needed at Build and Runtime

Legend: (a) in `.env.local`? (b) in `.env.example`? (c) bake vs runtime?

| Var | In `.env.local`? | In `.env.example`? | Type |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | yes (line 4) | NEXT_PUBLIC — baked at build |
| `SUPABASE_URL` | no | no | server-only runtime (read as fallback only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | no | NEXT_PUBLIC — baked at build |
| `SUPABASE_ANON_KEY` | no | no | server-only runtime (read as fallback only) |
| `SUPABASE_SERVICE_KEY` | yes | yes (line 5) | server-only runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | no | no | server-only runtime (read as fallback only) |
| `STRIPE_SECRET_KEY` | yes | yes (line 30) | server-only runtime |
| `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` | yes | yes (line 32) | server-only runtime |
| `STRIPE_WEBHOOK_SECRET` | yes | yes (line 33) | server-only runtime |
| `NEXT_PUBLIC_SITE_URL` | yes | yes (line 36, default `http://localhost:3004`) | NEXT_PUBLIC — baked at build. **MUST be set to `https://techyai.co` in techyai.co Vercel project.** |
| `NEXT_PUBLIC_BASE_URL` | yes | no | NEXT_PUBLIC — baked at build. Currently `http://localhost:3001` per prior audit `.env.local:4`. |
| `NEXT_PUBLIC_APP_URL` | yes | no | NEXT_PUBLIC — baked at build. **Current value contains `trendzo`** (verified by `grep -nE "trendzo" .env.local`: line 68 is `NEXT_PUBLIC_APP_URL`). Must be overridden to techyai.co for the funnel project. |
| `BEEHIIV_API_KEY` | yes | no | server-only runtime |
| `BEEHIIV_PUBLICATION_ID` | yes | no | server-only runtime |
| `ANTHROPIC_API_KEY` | yes | yes (line 9) | server-only runtime |
| `CODE_PATH_COOKIE_SECRET` | yes | yes (line 40) | server-only runtime |
| `NEXT_PUBLIC_DISABLE_AUTH` | yes | no | NEXT_PUBLIC — baked at build. Today `true` in dev. For techyai.co prod, see Section 4. |
| `NODE_ENV` | INFERRED: Vercel sets this automatically to `production` | no | bake-time + runtime |

Notes:
- `next.config.mjs:7-12` re-exports `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_KEY` (with fallback to `SUPABASE_SERVICE_ROLE_KEY`) into the bundled `process.env`. This means even `SUPABASE_SERVICE_KEY` (a server-only secret) gets pulled into the *server* bundle at build time. Not exposed to the client because it's not `NEXT_PUBLIC_*`, but it does mean the value is baked into `.next/server/*` files. INFERRED: refresh required when rotating.
- The funnel reads `SUPABASE_URL` and `SUPABASE_ANON_KEY` (without `NEXT_PUBLIC_`) and `SUPABASE_SERVICE_ROLE_KEY` only as **fallbacks** — set the `NEXT_PUBLIC_*` and `SUPABASE_SERVICE_KEY` and you're fine.
- The Stripe webhook needs the live-mode `STRIPE_WEBHOOK_SECRET`, and the webhook URL on the Stripe dashboard must point at `https://techyai.co/api/checkout/webhook`. INFERRED: this is a Stripe dashboard step, not a code change.

---

## Section 8: Observations and Open Questions

1. **Approach-by-approach leak surface under techyai.co:**
   - **Approach A** (next.config exclusion) — non-funnel routes are still bundled. If exclusion is via redirects/rewrites only, every non-funnel page and API endpoint is potentially reachable at techyai.co. Leak surface: ~160 non-funnel pages + ~870 non-funnel API routes. Without true file-tree exclusion or `pageExtensions` magic, this approach is structurally weak.
   - **Approach B** (middleware 404) — strongest sealing per minute of effort. As long as the middleware allowlist is right and the env gate runs **before** the `NEXT_PUBLIC_DISABLE_AUTH` short-circuit, every non-funnel URL returns 404. Caveat: `public/` static files (e.g., `public/images/Trendzo logo standard.png`) bypass middleware. Anyone hitting `techyai.co/images/Trendzo logo standard.png` would still get the file. **Mitigation:** delete or rename the 7 unreferenced Trendzo-branded files in `public/images/` before deploy.
   - **Approach C** (monorepo split) — zero leak by construction. Cost is the repo restructure.

2. **Hardest Trendzo mentions to remove (not simple find-and-replace):**
   - `src/lib/prompts/freedom-agent-prompt.ts:46-62` — the `ABOUT THE TECHNOLOGY YOU'RE BUILT ON` section is **semantically Trendzo-shaped**: it pitches a future agency product. Replacing "Trendzo" with a new brand name keeps the soft-sell logic intact. Removing it entirely changes the agent's tone arc. Decision needed before launch:
     - Option 1: rename Trendzo → techyai (or new brand) everywhere; keep soft-sell mechanic.
     - Option 2: strip the whole section (lines 46-62) and replace with "Do not discuss the platform you run on" instruction. Simpler but loses the email-capture follow-through.
   - `src/lib/prompts/escape-assessment-prompt.ts:3,11` — "Trendzo Personalization Engine" is a comment + a system-prompt identifier line. The model never echoes the engine name into the JSON payload (validation strips anything non-schema), so this is cosmetic for end users but visible in any LLM observability tool.

3. **Dead public assets in `public/images/` that bypass middleware:**
   - 7 files named `Trendzo *.svg/png` or `trendzo-*.svg/png` — none referenced by funnel pages but still served verbatim by Next.js static. List in Section 5.
   - Recommendation: delete or `.gitignore` before deploy, OR add a `next.config.mjs` `headers()` block / `rewrites()` to 404 them on techyai.co.

4. **Env vars whose current values would need to differ on techyai.co:**
   - `NEXT_PUBLIC_SITE_URL` — today `http://localhost:3000` (`.env.local:86` per prior audit); techyai.co Vercel project must set `https://techyai.co`.
   - `NEXT_PUBLIC_BASE_URL` — today `http://localhost:3001` per prior audit; must align with techyai.co.
   - `NEXT_PUBLIC_APP_URL` — **today contains the substring `trendzo`** in `.env.local:68` (filename verified; value not echoed). Must be overridden to a techyai.co URL.
   - `STRIPE_PRICE_ID_ESCAPE_ASSESSMENT` — INFERRED: a different Stripe price (or the same in live mode) may need to be configured for techyai.co. Today's value is unknown without echoing the .env.
   - `STRIPE_WEBHOOK_SECRET` — different per Stripe-dashboard webhook endpoint. Each Vercel project needs its own.
   - `CODE_PATH_COOKIE_SECRET` — per-deployment-environment secret; should not be shared between trendzo.com and techyai.co (cookie domain differs).
   - `BEEHIIV_PUBLICATION_ID` — INFERRED: if the techyai.co funnel feeds the same Beehiiv publication as trendzo.com (likely, given Beehiiv is the nurture sequence), keep the same value. If a separate publication is wanted, change here.
   - `NEXT_PUBLIC_DISABLE_AUTH` — today `true` in `.env.local`. For techyai.co production, recommendation depends on chosen exclusion approach (Section 4); for Approach B this needs careful interaction with the new gate.

5. **`vercel.json` crons leak — funnel deploy should not run any of them.** The current file ships 6 cron paths, none of which the funnel uses. If `vercel.json` is shared, Vercel will create cron jobs in the techyai.co project that hit non-funnel routes — and those routes won't exist (or won't be the intended logic) if Approach B/C is used. Need a per-project `vercel.json` or a conditional way to omit crons.

6. **`/api/freedom-agent/weekly-checkin` hardcodes `agent@updates.trendzo.io`** (`weekly-checkin/route.ts:174`). If this route is anywhere on the techyai.co deploy (intentionally or accidentally via Approach A) it would send emails From: a trendzo.io address. Exclude this route + drop its cron from any techyai.co `vercel.json`.

7. **`src/app/layout.tsx:21` root metadata title `'Trendzo | AI-Powered Social Media Template Management'`** is the fallback title for any page that doesn't override `metadata.title`. The four funnel pages do override, so the root title only leaks if a non-funnel page is reachable (see leak risks in Section 4). After scrubbing, set the root title to something neutral (or to the funnel brand) for defense-in-depth.

8. **Codebase identifier surface (open question):** The funnel's HTML id-attributes and `data-*` attributes do not contain "Trendzo" per the searches above. Class names like `text-instrument-primary`, `instrument-bg`, `instrument-divider` (in `src/styles/instrument.css`) describe an "Instrument" design system — these are funnel-internal and unrelated to Trendzo.

9. **The funnel's "TRENDZO :: ESCAPE ASSESSMENT" eyebrow in 2 places** is the most visible end-user Trendzo mention. Branding swap before launch: pick one of (a) blank eyebrow, (b) `TECHYAI :: ESCAPE ASSESSMENT`, (c) `THE ESCAPE ASSESSMENT` only. This is a 2-line code change.

10. **The `verify-session` HTTP API route has no current client caller** (`src/app/api/checkout/verify-session/route.ts`). The same `verifySession()` function is imported directly by the server components at `/welcome` and `/free/freedom-os`. INFERRED: keep the route in the funnel deploy anyway — it's tiny and may be useful for debugging.

11. **Approach B + monorepo middleware caveat:** Whatever `DEPLOY_TARGET=funnel` logic gets added must run BEFORE `if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') return NextResponse.next()` at `middleware.ts:169`. Today that env var is `true` in `.env.local` — if a Vercel build inherits it and the new gate is below, the funnel allowlist is bypassed entirely.

12. **The `(public)/free/page.tsx` "Free AI Tools for Creators & Founders | Trendzo" hub** is in the `(public)` group alongside the funnel, AND is in the middleware public allowlist (`/free`), AND mentions Trendzo three times in user-visible copy. It is NOT part of the funnel but **would be reachable at `techyai.co/free`** under every approach (Approach B's allowlist would need to exclude it explicitly; Approach C moves it out of the funnel app).

---

Output path: `C:\Projects\CleanCopy\FUNNEL_DEPLOY_AUDIT_2026-05-15.md`.
