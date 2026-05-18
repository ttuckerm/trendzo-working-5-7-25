# Funnel Extraction Diagnostic

Branch: `funnel-deploy-techyai` (CleanCopy / Trendzo)
Scope: Identify every file the techyai.co funnel actually depends on so it can be cleanly extracted into a minimal repo.

Method: Recursive import-graph traversal from the entry points listed in the brief (path alias `@/` → `src/`). Following relative + `@/` imports, ignoring node-builtins and `node_modules` packages. Then static scan of the resulting file set for red flags, package usage, Supabase tables/RPCs, and public-asset references.

Totals: **124 internal files** in the dependency graph, **15 external packages** actually imported, **8 Supabase tables**, **1 RPC**, **86 red flags** across the seven categories.

---

## 1. Entry points

All entry points verified except for the path forms that the brief listed without the `(public)` route group prefix; the actual paths live under `src/app/(public)/...`. Treat that as a naming correction, not a missing file.

| Entry point (as given) | Resolved actual path | Exists |
|---|---|---|
| `src/app/page.tsx` | `src/app/page.tsx` | yes |
| `src/app/welcome/page.tsx` | `src/app/(public)/welcome/page.tsx` | yes (route group) |
| `src/app/free/freedom-os/page.tsx` | `src/app/(public)/free/freedom-os/page.tsx` | yes (route group) |
| `src/app/assessment/[assessmentId]/page.tsx` | same | yes |
| `src/app/layout.tsx` | same | yes |
| `src/middleware.ts` | same | yes |
| `src/app/api/landing/code-validate/route.ts` | same | yes |
| `src/app/api/landing/email-notify/route.ts` | same | yes |
| `src/app/api/checkout/create-session/route.ts` | same | yes |
| `src/app/api/checkout/verify-session/route.ts` | same | yes |
| `src/app/api/checkout/webhook/route.ts` | same | yes |
| `src/app/api/assessment/generate/route.ts` | same | yes |
| `src/app/api/assessment/email-capture/route.ts` | same | yes |
| `src/app/api/assessment/email-status/route.ts` | same | yes |
| `src/app/api/assessment/sprint-progress/route.ts` | same | yes |
| `src/app/api/freedom-agent/chat/route.ts` | same | yes |
| `src/app/api/freedom-agent/conversation/route.ts` | same | yes |

### Sibling files in entry-point directories

- `src/app/`: `layout.tsx`, `page.tsx`, `providers.tsx`, `_app.tsx`, `_supabase-url-shim.tsx`, `error.tsx` (NOT a funnel dep), `components/DeprecationBanner.tsx` (pulled in by `_app.tsx`). The `src/app/error.tsx`, `loading.tsx`, `not-found.tsx` siblings at the root were not traversed (none import from funnel entries); verify whether the funnel deploy needs a root-level `error.tsx` / `not-found.tsx`.
- `src/app/(public)/welcome/`: only `page.tsx`. No layout / loading / error / not-found siblings. Inherits the root `src/app/layout.tsx`.
- `src/app/(public)/free/freedom-os/`: `page.tsx`, `FreedomOSTool.tsx`, `PlanResultsView.tsx`, `hamster-loader.css`, plus the nested `plan/[planId]/{page.tsx, not-found.tsx}`.
- `src/app/assessment/[assessmentId]/`: `page.tsx`, `loading.tsx`, `not-found.tsx`.
- The `(public)/` route group also has a `t/` sibling — NOT in the funnel allowlist, do not copy.

---

## 2. Dependency files (124 total)

Grouped by top-level directory inside `src/`.

### `src/app/` (27)

```
src/app/(public)/free/freedom-os/FreedomOSTool.tsx
src/app/(public)/free/freedom-os/PlanResultsView.tsx
src/app/(public)/free/freedom-os/hamster-loader.css
src/app/(public)/free/freedom-os/page.tsx
src/app/(public)/free/freedom-os/plan/[planId]/not-found.tsx
src/app/(public)/free/freedom-os/plan/[planId]/page.tsx
src/app/(public)/welcome/page.tsx
src/app/_app.tsx
src/app/_supabase-url-shim.tsx
src/app/api/assessment/email-capture/route.ts
src/app/api/assessment/email-status/route.ts
src/app/api/assessment/generate/route.ts
src/app/api/assessment/sprint-progress/route.ts
src/app/api/checkout/create-session/route.ts
src/app/api/checkout/verify-session/route.ts
src/app/api/checkout/webhook/route.ts
src/app/api/freedom-agent/chat/route.ts
src/app/api/freedom-agent/conversation/route.ts
src/app/api/landing/code-validate/route.ts
src/app/api/landing/email-notify/route.ts
src/app/assessment/[assessmentId]/loading.tsx
src/app/assessment/[assessmentId]/not-found.tsx
src/app/assessment/[assessmentId]/page.tsx
src/app/components/DeprecationBanner.tsx
src/app/layout.tsx
src/app/page.tsx
src/app/providers.tsx
```

Note: `src/app/globals.css` is imported by `src/app/layout.tsx` but treated as an asset (not a source file in the JS sense). Still required at extraction. See Section 5.

### `src/components/` (51)

```
src/components/FlagProviderClient.tsx
src/components/admin/FloatingBrainChat.tsx              ← TRENDZO, see red flag (c)
src/components/admin/FloatingBrainTrigger.tsx           ← TRENDZO, see red flag (c)
src/components/assessment/AgentChip.tsx
src/components/assessment/AgentGate.tsx
src/components/assessment/AgentIdentityGlyph.tsx
src/components/assessment/AgentInput.tsx
src/components/assessment/AgentMessages.tsx
src/components/assessment/AgentRail.tsx
src/components/assessment/AssessmentHUD.tsx
src/components/assessment/BusinessMatchPanel.tsx
src/components/assessment/Chassis.tsx
src/components/assessment/Day1Spotlight.tsx
src/components/assessment/DeliverablesHeader.tsx
src/components/assessment/FreedomNumberRing.tsx
src/components/assessment/HolographicRing.tsx
src/components/assessment/LeadsPanel.tsx
src/components/assessment/OperatorPanel.tsx
src/components/assessment/RoadmapList.tsx
src/components/assessment/SaveYourLinkNotice.tsx
src/components/assessment/SprintGrid.tsx
src/components/freedom-os/FreedomMultiplierControl.tsx
src/components/freedom-os/HamsterLoader.tsx
src/components/landing/BetrayalSection.tsx
src/components/landing/CTASection.tsx
src/components/landing/CheckoutBanner.tsx
src/components/landing/CloseSection.tsx
src/components/landing/CodeEntry.tsx
src/components/landing/CostSection.tsx
src/components/landing/EmailNotifyForm.tsx
src/components/landing/HookSection.tsx
src/components/landing/MethodSection.tsx
src/components/landing/NotForSection.tsx
src/components/landing/PaidCheckoutButton.tsx
src/components/landing/PromiseSection.tsx
src/components/landing/ReceiveSection.tsx
src/components/landing/ScarcitySection.tsx
src/components/landing/StackSection.tsx
src/components/landing/StatsSection.tsx
src/components/landing/TestimonialsSection.tsx
src/components/landing/YouTubeCTA.tsx
src/components/qa/QaOverlay.tsx
src/components/ui/CompatibilityProvider.tsx
src/components/ui/TopBanner.tsx
src/components/ui/button.tsx
src/components/ui/chat-bubble.tsx
src/components/ui/chat-input.tsx
src/components/ui/chat-message-list.tsx
src/components/ui/error-boundary.tsx
src/components/ui/expandable-chat.tsx
src/components/ui/ui-compatibility.tsx
```

### `src/contexts/` (1)

```
src/contexts/GlobalBrainContext.tsx
```

### `src/features/` (1)

```
src/features/Brain/useBrain.ts
```

### `src/lib/` (38)

```
src/lib/assessment/build-input-from-form.ts
src/lib/assessment/fetch-assessment.ts
src/lib/assessment/generate.ts
src/lib/assessment/validate-payload.ts
src/lib/beehiiv/notify.ts
src/lib/contexts/AnimationContext.tsx
src/lib/contexts/AudioContext.tsx
src/lib/contexts/AuthContext.tsx
src/lib/contexts/FeatureContext.tsx
src/lib/contexts/StateContext.tsx
src/lib/contexts/SubscriptionContext.tsx
src/lib/contexts/ThemeContext.tsx
src/lib/contexts/audiovisual/AudioVisualContext.tsx
src/lib/debug/fetch-instrumentation.ts
src/lib/debug/networkLog.ts
src/lib/flags/client.tsx
src/lib/freedom-agent/append-message.ts
src/lib/freedom-agent/build-system-prompt.ts
src/lib/freedom-agent/fetch-conversation.ts
src/lib/funnel/segment.ts
src/lib/hooks/useAuth.ts
src/lib/prompts/freedom-agent-prompt.ts
src/lib/qa/qa-mode.ts
src/lib/qa/rules.ts
src/lib/services/ScreenContextService.ts
src/lib/stripe/admin.ts
src/lib/stripe/client.ts
src/lib/stripe/cookie.ts
src/lib/stripe/verify.ts
src/lib/supabase/auth-context.tsx
src/lib/supabase/client.ts
src/lib/supabase/env.ts
src/lib/supabase/server.ts
src/lib/types/audio.ts
src/lib/types/tiktok.ts
src/lib/utils.ts
src/lib/utils/component-registry.ts
src/lib/utils/import-resolver.ts
```

### `src/styles/` (1)

```
src/styles/instrument.css
```

### `src/types/` (4)

```
src/types/assessment.ts
src/types/email-capture.ts
src/types/freedom-agent.ts
src/types/objectives.ts
```

### Other (1)

```
src/middleware.ts
```

---

## 3. Red flags

### (a) External-to-funnel imports (broken / missing module references)

**0 occurrences.** Every resolved internal import points back into the dependency set — no leaked coupling outside the 124 files. The trace is closed.

### (b) Lib-to-app reverse imports

**1 occurrence.**

| File | Line | Imports |
|---|---|---|
| `src/components/freedom-os/HamsterLoader.tsx` | 4 | `../../app/(public)/free/freedom-os/hamster-loader.css` |

A library/component reaching across into an `src/app/` route directory to grab a CSS file. Move `hamster-loader.css` next to `HamsterLoader.tsx` (or under `src/styles/`) during extraction.

### (c) Trendzo-only references

**2 occurrences.** Both come from `src/app/_app.tsx`:

| File | Line | Import |
|---|---|---|
| `src/app/_app.tsx` | 13 | `@/components/admin/FloatingBrainChat` |
| `src/app/_app.tsx` | 14 | `@/components/admin/FloatingBrainTrigger` |

Drag in `src/components/admin/FloatingBrainChat.tsx` and `src/components/admin/FloatingBrainTrigger.tsx` (the only `src/components/admin/*` files in the funnel graph) plus their downstream chain (`src/contexts/GlobalBrainContext.tsx`, `src/features/Brain/useBrain.ts`, `src/lib/services/ScreenContextService.ts`, `src/lib/qa/*`, `src/types/objectives.ts`, `src/components/qa/QaOverlay.tsx`, `src/components/ui/expandable-chat.tsx`, `src/components/ui/chat-*.tsx`).

These are NOT funnel-relevant. They render a Trendzo floating chat widget on every public route. **Recommended extraction action:** delete the two `<FloatingBrainChat />`/`<FloatingBrainTrigger />` JSX usages plus the two imports in `_app.tsx`, then drop the whole `src/contexts/GlobalBrainContext.tsx`, `src/features/Brain/`, `src/components/admin/`, `src/components/qa/`, `src/lib/services/ScreenContextService.ts`, `src/lib/qa/`, `src/types/objectives.ts`, and chat-bubble/chat-input/chat-message-list/expandable-chat UI chain. That removes roughly 15 files from the 124 (~12%) for free.

No other Trendzo tokens (`training/`, `atlas/`, `viral-prediction`, `intel-orchestrator`, `prediction-pipeline`, `kai-orchestrator`, `xgboost`, `pack-metadata`, `editing-coach`, `system-registry`) appear anywhere in the dependency graph. Clean.

### (d) Next 14 server APIs

**7 occurrences.** Need verification in the new project (cookie store API, redirect behavior, dynamic vs static rendering).

| File | Line | Symbol | Source |
|---|---|---|---|
| `src/app/(public)/welcome/page.tsx` | 1 | `redirect` | `next/navigation` |
| `src/app/(public)/welcome/page.tsx` | 2 | `cookies` | `next/headers` |
| `src/app/(public)/free/freedom-os/page.tsx` | 1 | `redirect` | `next/navigation` |
| `src/app/(public)/free/freedom-os/page.tsx` | 2 | `cookies` | `next/headers` |
| `src/app/(public)/free/freedom-os/plan/[planId]/page.tsx` | 2 | `notFound` | `next/navigation` |
| `src/app/assessment/[assessmentId]/page.tsx` | 10 | `notFound` | `next/navigation` |
| `src/lib/supabase/server.ts` | 4 | `cookies` | `next/headers` |

`src/app/layout.tsx` also declares `export const dynamic = 'force-dynamic'` — likely needed in the new repo since the layout consumes Supabase auth state.

### (e) Tailwind arbitrary values

**73 occurrences across 22 files.** Distribution:

| Count | File |
|---|---|
| 16 | `src/app/(public)/free/freedom-os/FreedomOSTool.tsx` |
| 16 | `src/app/(public)/free/freedom-os/PlanResultsView.tsx` |
| 7 | `src/app/(public)/welcome/page.tsx` |
| 7 | `src/components/landing/TestimonialsSection.tsx` |
| 4 | `src/components/landing/CTASection.tsx` |
| 3 | `src/components/landing/CodeEntry.tsx` |
| 3 | `src/components/landing/PromiseSection.tsx` |
| 2 | `src/components/landing/HookSection.tsx` |
| 2 | `src/components/landing/PaidCheckoutButton.tsx` |
| 1 each | 13 other files (BetrayalSection, CheckoutBanner, CloseSection, CostSection, EmailNotifyForm, MethodSection, ScarcitySection, StackSection, StatsSection, YouTubeCTA, FreedomMultiplierControl, QaOverlay, error-boundary) |

Patterns in use: `text-[10px]` / `text-[11px]` / `sm:text-[17px]`, `max-w-[680px]` / `max-w-[720px]` / `max-w-[640px]`, `focus:ring-[#e50914]`, `accent-[#e50914]`, `tracking-[0.12em]` / `tracking-[0.18em]`, `mt-[2px]`, `z-[100]`, `min-h-[50vh]`, `w-[calc(100%-2rem)]`.

Sample lines (full list in trace data):

```
src/app/(public)/free/freedom-os/FreedomOSTool.tsx:273   focus:ring-[#e50914]
src/app/(public)/welcome/page.tsx:106                    max-w-[720px]
src/components/landing/CTASection.tsx:28                 tracking-[0.18em]
src/components/landing/CheckoutBanner.tsx:37             w-[calc(100%-2rem)]
src/components/qa/QaOverlay.tsx:78                       z-[100]
```

**Implication:** Tailwind JIT must be enabled (default in Tailwind 3.4) and the `content` glob in `tailwind.config.ts` must cover `./src/**/*.{ts,tsx}`. The current config already does so. No theme tokens required for these values, but they will only resolve if Tailwind's JIT picks them up at build time.

### (f) CSS file imports

**5 occurrences** (3 unique files).

| File | Line | CSS path |
|---|---|---|
| `src/app/layout.tsx` | 1 | `./globals.css` |
| `src/app/page.tsx` | 13 | `@/styles/instrument.css` |
| `src/app/(public)/welcome/page.tsx` | 7 | `@/styles/instrument.css` |
| `src/components/assessment/AssessmentHUD.tsx` | 21 | `@/styles/instrument.css` |
| `src/components/freedom-os/HamsterLoader.tsx` | 4 | `../../app/(public)/free/freedom-os/hamster-loader.css` |

Three CSS files total are needed:

- `src/app/globals.css` (2040 lines — large; contains the entire Trendzo design-system. Audit for dead rules during extraction, but copying as-is will work.)
- `src/styles/instrument.css` (153 lines — funnel-specific powered-instrument aesthetic)
- `src/app/(public)/free/freedom-os/hamster-loader.css`

No `@import` or `url(...)` references inside either of the two main CSS files — they are self-contained.

### (g) Public-asset references

**3 occurrences.** Only one is broken at present.

| Reference | File:line | Exists in `public/`? |
|---|---|---|
| `/favicon.svg` | `src/app/layout.tsx:37` | yes (`public/favicon.svg`) |
| `/images/escape-assessment-product.png` | `src/app/(public)/welcome/page.tsx:110` | yes (`public/images/escape-assessment-product.png`) |
| `/config/objectives.matrix.json` | `src/components/qa/QaOverlay.tsx:127` | **NO** — `public/config/` does not exist |

`/config/objectives.matrix.json` is only fetched by the QaOverlay debug component, which is part of the Trendzo carry-over (red flag c). If QaOverlay is dropped during extraction this asset is moot. Otherwise it must be created.

The layout also sets icons via `metadata.icons.icon = '/favicon.svg'` (line 24) — same file.

---

## 4. Package dependencies

### USED (16 packages — imported by at least one funnel file)

| Package | Version range in `package.json` |
|---|---|
| `@ai-sdk/anthropic` | `^3.0.69` |
| `@supabase/ssr` | `^0.7.0` |
| `@supabase/supabase-js` | `^2.57.4` |
| `ai` | `^6.0.138` |
| `class-variance-authority` | `^0.7.1` |
| `clsx` | `^2.1.1` |
| `cookies-next` | `^4.1.1` |
| `date-fns` | `^3.6.0` |
| `framer-motion` | `^11.18.2` |
| `lucide-react` | `^0.436.0` |
| `next` | `^14.2.28` |
| `next-themes` | `^0.4.6` |
| `react` | `18.2.0` |
| `react-dom` | `18.2.0` (transitively required by `next` and `react` — not directly imported by funnel source, but mandatory) |
| `stripe` | `^22.1.0` |
| `tailwind-merge` | `^2.3.0` |

Tooling / dev-deps required to build the funnel:

- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `tailwindcss`, `tailwindcss-animate` (referenced in `tailwind.config.ts` plugins), `postcss`
- `eslint`, `eslint-config-next` (optional, lint-only)

### Used but missing from `package.json`

**0 packages.** All bare-package imports resolve cleanly against declared dependencies. (An earlier pass flagged `firebase/firestore` in `src/lib/contexts/FeatureContext.tsx` — that line is commented out; the file is dead-code-equivalent for the funnel.)

### NOT USED by funnel (106 packages — safe to omit from minimal repo)

Grouped for readability:

- **All Radix UI (12):** `@radix-ui/react-avatar`, `react-collapsible`, `react-context-menu`, `react-dialog`, `react-label`, `react-popover`, `react-radio-group`, `react-scroll-area`, `react-slider`, `react-slot`, `react-switch`, `react-tabs`, `react-tooltip` — none of the funnel components import Radix primitives.
- **Other AI SDKs (3):** `@ai-sdk/openai`, `@ai-sdk/react`, `@anthropic-ai/sdk`, `@google/genai`, `openai`. (The funnel uses `@ai-sdk/anthropic` + `ai` only.)
- **Clerk auth (1):** `@clerk/nextjs` — not used.
- **Supabase legacy (1):** `@supabase/auth-helpers-nextjs` — funnel uses `@supabase/ssr` instead.
- **Trendzo media stack:** `@deepgram/sdk`, `apify`, `apify-client`, `ffmpeg-static`, `ffprobe-static`, `fluent-ffmpeg`, `pitchfinder`, `standardized-audio-context`, `tesseract.js`, `tesseract.js-core`, `puppeteer-core`, `sharp`, `replicate`, `html2canvas`.
- **Trendzo data / charts:** `chart.js`, `react-chartjs-2`, `d3`, `@types/d3`, `recharts`.
- **Trendzo infra:** `bullmq`, `ioredis`, `pg`, `node-cron`, `nodemailer`, `pino`, `cheerio`, `isomorphic-git`, `isomorphic-dompurify`, `axios`.
- **Validation / schema (carry over selectively):** `ajv`, `ajv-formats`, `zod`, `zod4`, `validator`, `jsonwebtoken`, `@types/jsonwebtoken`.
- **Misc UI not used in funnel:** `react-draggable`, `react-dropzone`, `react-error-boundary`, `react-hotkeys-hook`, `react-intersection-observer`, `react-markdown`, `react-use-measure`, `sonner`, `next-auth`.
- **State / utilities not imported:** `zustand`, `serve`, `natural`, `@motionone/utils`, `@json-render/core`, `@json-render/react`, `@modelcontextprotocol/sdk`.
- **All testing / lint tooling (devDeps):** `@axe-core/playwright`, `@playwright/test`, `playwright`, `@testing-library/*`, `jest`, `jest-environment-jsdom`, `ts-jest`, `ts-node`, `tsx`, `dotenv`, `dotenv-cli`, `chalk`, `cross-env`, `kill-port`, `node-fetch`, `pixelmatch`, `pngjs`, `prettier`, `fast-json-patch`, `@types/jest`, `@types/uuid`, `uuid`.

If the minimal repo wants Stripe webhook signature verification, keep `stripe`. If it wants Supabase RLS-aware cookie auth in route handlers, keep `@supabase/ssr` and `@supabase/supabase-js`. Beehiiv calls in `src/lib/beehiiv/notify.ts` are plain `fetch` — no package needed.

---

## 5. Config files

### `next.config.mjs`

- `compiler.removeConsole` — keep (production console stripping).
- `env` — re-exposes `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_CLONE_URL` (Trendzo-only, default `https://os.ryo.lu/`). **Drop `NEXT_PUBLIC_CLONE_URL`.** Keep Supabase env mappings.
- `output: 'standalone'` — keep if deploying via Docker; harmless on Vercel.
- `poweredByHeader: false`, `generateEtags: false`, `compress: true` — keep.
- `eslint.ignoreDuringBuilds: true`, `typescript.ignoreBuildErrors: true` — review; recommend tightening in the new repo.
- `images.remotePatterns` — the entries `placehold.co`, `randomuser.me`, `placekitten.com`, `replicate.com`, `replicate.delivery`, `firebasestorage.googleapis.com`, `lh3.googleusercontent.com`, `picsum.photos` are all Trendzo-only. Funnel uses no remote images (verified by Section 6). **Drop the entire `remotePatterns` array.** Keep `dangerouslyAllowSVG: true` and the CSP string only if a Next `<Image>` is fed an SVG anywhere (none currently).
- `experimental.instrumentationHook: false` — Trendzo workaround for scheduler chain. **Drop.**
- `experimental.optimizeServerReact` — keep, harmless.
- `experimental.serverComponentsExternalPackages: ['jsdom', 'isomorphic-dompurify']` — Trendzo-only. **Drop.**
- `experimental.optimizePackageImports` — lists Trendzo-only packages (`recharts`, `d3`, `chart.js`, `react-chartjs-2`, plus several Radix primitives, plus `framer-motion`, `lucide-react`, `date-fns`). Keep only `framer-motion`, `lucide-react`, `date-fns`.
- `experimental.outputFileTracingExcludes` — Trendzo-only (`whisper_env`). **Drop.**
- `webpack(...)` — entirely Trendzo (ffmpeg externals, apify externals, pg, ioredis, fluent-ffmpeg, natural, webworker-threads, tesseract WASM, supabase realtime/gotrue externals). **Drop the whole `webpack` hook.** None of these packages are funnel deps.
- `redirects()` — `/favicon.ico` → `/favicon.svg` is the only funnel-relevant entry. All others (`/trend-predictions/*`, `/admin/operations-center`, `/admin/engine-room`) are Trendzo. **Keep only the favicon redirect.**
- `rewrites()` — `/api/openai/:path*` proxy and `/lab/canvas` rewrite are Trendzo. **Drop the entire `rewrites()` function.**

### `tailwind.config.ts`

- `darkMode: ["class"]` — keep.
- `content` — keep the three globs (pages, components, app).
- `container` — keep.
- `theme.extend.colors`:
  - HSL-variable base palette (border, input, ring, background, foreground, primary, secondary, destructive, muted, accent, popover, card) — keep, but verify CSS variables exist in `globals.css` (they do — defined in the `:root` block).
  - `instrument.*` palette (`bg`, `surface`, `surface-raised`, `surface-inset`, `divider`, `primary`, `secondary`, `tertiary`, `crimson`, `crimson-deep`, `crimson-dim`, `success`) — **keep, funnel-specific.**
  - `glass.*` palette — Trendzo-only (audio-visual / liquid-glass design system). **Can drop**, but cheap to keep.
- `theme.extend.borderRadius` — keep (uses `--radius` CSS var).
- `theme.extend.fontFamily` — keep (`Inter`, `Playfair Display`, `DM Sans` loaded via `next/font/google` in `layout.tsx`). Mono entries reference `JetBrains Mono`/`Fira Code` but no local font files are imported — that's a fallback chain only.
- `theme.extend.backgroundImage.gradient-radial` — keep. `glass-gradient` — Trendzo, optional.
- `theme.extend.backdropBlur.glass` — Trendzo, optional.
- `theme.extend.boxShadow.glass-*` — Trendzo, optional.
- `theme.extend.keyframes` + `animation` — all custom keyframes (`accordion-down/up`, `text-gradient`, `aurora`, `gradient-x`, `pulse-slow`, `float`, `glow`, `shimmer`, `morph`, `breathe`). The funnel landing uses `framer-motion` for motion, not Tailwind keyframes — likely no production use. Audit; safe to delete all except `accordion-down`/`accordion-up` if `tailwindcss-animate` plugin is kept.
- `theme.extend.transitionDuration['400']`, `['600']` — keep, cheap.
- `theme.extend.animationDelay['2000']` — not a real Tailwind property (Tailwind has no `animationDelay` theme key by default). Likely dead config.
- `plugins: [require("tailwindcss-animate")]` — keep (provides accordion utilities).

### `postcss.config.mjs`

```js
{ plugins: { tailwindcss: {} } }
```

Trivial. Copy verbatim.

### `tsconfig.json`

- `compilerOptions.target: "es2018"`, `lib: ["dom","dom.iterable","esnext"]` — keep.
- `allowJs: true`, `skipLibCheck: true`, `strict: true`, `forceConsistentCasingInFileNames: true`.
- `module: "commonjs"`, `moduleResolution: "node"` — unusual for a Next.js 14 project (Next typically wants `"esnext"` + `"bundler"`), but works. Keep as-is unless the new repo wants to modernize.
- `jsx: "preserve"`, `incremental: true`, `isolatedModules: true`.
- `paths`:
  - `"@/*": ["./src/*"]` — **keep, required.**
  - `"@trendzo/shared"` + `"@trendzo/shared/*"` — Trendzo monorepo alias, points at `./packages/shared/src/...` which is NOT in the funnel graph. **Drop.**
  - `"@json-render/react/schema"` — Trendzo. **Drop.**
- `types: ["react", "react-dom", "node"]` — keep.
- `plugins: [{ name: "next" }]` — keep.
- `include` — keep `src/**/*.ts`, `src/**/*.tsx`, `.next/types/**/*.ts`.
- `exclude` — keep.

### Environment

`.env.local` is gitignored and contains the full Trendzo config. `.env.funnel` (referenced by prior session, also gitignored) holds the 27 funnel env vars.

Funnel source actually references **20 env vars** (excluding `NEXT_PUBLIC_DISABLE_AUTH` if you want to lock auth on in the funnel):

```
ANTHROPIC_API_KEY
BEEHIIV_API_KEY
BEEHIIV_PUBLICATION_ID
CODE_PATH_COOKIE_SECRET
DEPLOY_TARGET
NEXT_PUBLIC_ADMIN_EMAIL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_DISABLE_AUTH
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NODE_ENV
STRIPE_PRICE_ID_ESCAPE_ASSESSMENT
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

`DEPLOY_TARGET` becomes irrelevant in a minimal funnel repo (middleware no longer gates by it), but other vars all need values.

---

## 6. Public assets referenced

Scanned only inside the 124 dependency files (plus the 3 CSS files). Three references found.

| Reference | File:line | Exists at `public/<path>`? | Funnel-required? |
|---|---|---|---|
| `/favicon.svg` | `src/app/layout.tsx:37` (also `metadata.icons.icon` line 24, `metadata.icons.shortcut` line 25) | yes — `public/favicon.svg` | yes |
| `/images/escape-assessment-product.png` | `src/app/(public)/welcome/page.tsx:110` | yes — `public/images/escape-assessment-product.png` | yes |
| `/config/objectives.matrix.json` | `src/components/qa/QaOverlay.tsx:127` | **no** | only if QaOverlay/Trendzo Brain chain is kept (see Section 3 red flag c) |

No `next/font` local font files, no `next/script` self-hosted scripts, no `url(...)` references inside the CSS files (`globals.css` and `instrument.css` are both font-and-color-only).

**Recommended `public/` for the funnel repo:**

```
public/
  favicon.svg
  favicon.ico               (optional — redirect rule already maps to favicon.svg)
  images/
    escape-assessment-product.png
```

---

## 7. Supabase tables, migrations, RLS

8 tables + 1 RPC referenced by funnel server code.

| Table | Read/written from | Migration(s) | RLS enabled | Policies | Notes |
|---|---|---|---|---|---|
| `redemption_codes` | `src/app/api/assessment/email-capture/route.ts:82` | `20260429000000_create_redemption_codes.sql` | yes | 0 explicit (RLS on, no `CREATE POLICY` — implies service-role-only access) | Funnel-owned. |
| `code_redemptions` | `src/app/api/assessment/email-capture/route.ts:76`, `src/app/api/assessment/generate/route.ts:197` | `20260429000000_create_redemption_codes.sql` | yes | 0 explicit | Funnel-owned. |
| `assessment_emails` | `src/app/api/assessment/email-capture/route.ts:125,139`, `src/app/api/assessment/email-status/route.ts:53`, `src/app/api/freedom-agent/chat/route.ts:225` | `20260428000000_create_assessment_emails.sql` | yes | 3 (`Anonymous can insert/read/update assessment_emails`) | Funnel-owned. Anonymous-write by design. |
| `escape_assessments` | `src/app/api/assessment/generate/route.ts:137`, `src/app/api/assessment/sprint-progress/route.ts:116,142`, `src/lib/assessment/fetch-assessment.ts:103` | `20260426120000_create_escape_assessments.sql`, `20260427000000_add_sprint_progress.sql`, `20260430000000_assessment_share_token.sql` | yes | 4 (`Anyone can insert assessments`, `Anyone can read by assessment_id`, `Owner can update`, `Anonymous can update sprint_progress on escape_assessments`) | Funnel-owned. Multiple migrations because schema evolved. |
| `stripe_purchases` | `src/app/api/assessment/generate/route.ts:174`, `src/app/api/checkout/create-session/route.ts:69`, `src/app/api/checkout/webhook/route.ts:53`, `src/lib/stripe/verify.ts:12` | `20260428200000_create_stripe_purchases.sql` | yes | 0 explicit (service-role-only) | Funnel-owned. |
| `landing_email_notifications` | `src/app/api/landing/email-notify/route.ts:85` | `20260428100000_create_landing_emails.sql` | yes | 2 (`Anonymous can insert`, `Authenticated can insert`) | Funnel-owned. |
| `freedom_agent_conversations` | `src/lib/freedom-agent/append-message.ts:42,56`, `src/lib/freedom-agent/fetch-conversation.ts:69,80,89,105` | `20260427100000_create_freedom_agent_conversations.sql` | yes | 3 (`Anonymous can read/insert/update freedom_agent_conversations`) | Funnel-owned. |
| `profiles` | `src/lib/supabase/auth-context.tsx:45` (client-side context provider) | `20241205_admin_schema.sql`, `20241205_admin_schema_safe.sql`, `20241205_admin_schema_v2.sql`, `20260403_create_profiles.sql`, `20260406_add_primary_niche_to_profiles.sql` | yes | 19 | **Trendzo table.** Reached only because `Providers` mounts `<SupabaseAuthProvider>`. The funnel does not auth users — this read returns null for anonymous visitors and is harmless. **Recommendation:** during extraction, either strip the `<SupabaseAuthProvider>` from `providers.tsx` (drops the `profiles` query) or carry over a minimal `profiles` table stub. The 5 Trendzo migrations have substantial RLS surface that's irrelevant to the funnel. |

| RPC | Called from | Migration | Notes |
|---|---|---|---|
| `redeem_code` | `src/app/api/assessment/email-capture/route.ts:82` (transactional code redemption) | `20260429000000_create_redemption_codes.sql` (`CREATE OR REPLACE FUNCTION redeem_code(...)`) | Funnel-owned. Must be carried with the redemption_codes / code_redemptions tables. |

**Migration carry-over list for a minimal funnel repo (7 SQL files):**

```
supabase/migrations/20260426120000_create_escape_assessments.sql
supabase/migrations/20260427000000_add_sprint_progress.sql
supabase/migrations/20260427100000_create_freedom_agent_conversations.sql
supabase/migrations/20260428000000_create_assessment_emails.sql
supabase/migrations/20260428100000_create_landing_emails.sql
supabase/migrations/20260428200000_create_stripe_purchases.sql
supabase/migrations/20260429000000_create_redemption_codes.sql
supabase/migrations/20260430000000_assessment_share_token.sql
```

Plus a minimal `profiles` stub if `SupabaseAuthProvider` is retained.

Schema-as-of-today is already in production Supabase, so a fresh deploy can either: (a) re-run these migrations against a new Supabase project, or (b) re-use the existing Supabase project and just point env vars at it.

---

## 8. Extraction complexity estimate

**Verdict: MEDIUM.**

Reasoning:

1. **The graph is small and closed.** 124 internal files, 15 production packages, 0 broken/unresolved imports, 0 references outside the dep set. That's an unusually clean cut for a project this large — the funnel team has clearly been disciplined about not reaching into the Trendzo internals (Section 3 red flag c surfaces only 2 imports, both pointing at one Trendzo widget chain that is trivially excisable).

2. **Two specific decoupling moves shrink the graph by ~15 files.** Remove `<FloatingBrainChat>` + `<FloatingBrainTrigger>` from `_app.tsx` (red flag c) and the entire Brain/Qa/expandable-chat chain drops out. Optionally also strip `<SupabaseAuthProvider>` to drop the `profiles` table dependency. Both moves are mechanical, not redesigns.

3. **Supabase carry-over is clean.** 7 funnel-owned migrations cover 7 of 8 tables. The 8th (`profiles`) is the only Trendzo-bleed, and it's read-only and harmless.

4. **Config files have known Trendzo bleed but it's surgical.** `next.config.mjs` has roughly 20 sections — 6 are funnel-relevant, the rest are ffmpeg / apify / scheduler / Trendzo redirects. `tailwind.config.ts` keeps its useful keyframes + the funnel-specific `instrument.*` palette; can drop the Trendzo `glass.*` palette + glass-related shadows safely. `tsconfig.json` needs only the `@trendzo/shared` and `@json-render/react/schema` path aliases removed.

5. **No font / image asset bleed.** Only one funnel image (`escape-assessment-product.png`) + favicon. Fonts loaded via `next/font/google` (Inter, Playfair Display, DM Sans). Tailwind arbitrary values are widespread (73 occurrences, 22 files) but require nothing beyond default Tailwind 3.4 JIT.

6. **The one ambiguity is `globals.css`.** It's 2040 lines of Trendzo-era CSS variables and utility classes that the funnel layout pulls in by `import './globals.css'`. The funnel's actual visual language lives in `instrument.css` (153 lines). A clean extraction could either copy `globals.css` verbatim (cheap, large) or audit which `:root` CSS variables the surviving Tailwind config + `instrument.css` actually need. The Tailwind `theme.extend.colors` block uses `hsl(var(--background))`, `hsl(var(--border))`, etc. — those CSS variables are defined in `globals.css`. So `globals.css` must come along OR be replaced by a 30-line file defining the HSL vars the kept Tailwind tokens reference.

Headline: **the funnel is already structurally a sub-project hiding inside a monorepo.** Two import deletions, one config trim, seven migration copies, three public assets, two CSS files — and you've extracted it. The biggest risk is `globals.css` being heavier than the funnel needs.

---

*Diagnostic generated 2026-05-16. Read-only investigation, no source files modified.*
