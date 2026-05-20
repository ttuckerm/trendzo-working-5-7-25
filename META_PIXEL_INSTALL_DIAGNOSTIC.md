# Meta Pixel Install — Phase 1 Diagnostic

**Date:** 2026-05-20
**Branch under investigation:** `funnel-deploy-techyai` (local: `c760c80`, origin: `60b8935`; local is 1 commit ahead — docs-only).
**Working tree currently checked out:** `vercel-deploy-test` (Orb work in progress; not switched for this diagnostic — funnel branch read via `git show` only).
**Mode:** Read-only investigation. No files modified except this diagnostic. No implementation proposed.

---

## 1 — Funnel page routes (the allowlist)

Source of truth: `src/middleware.ts` on `funnel-deploy-techyai` (lines 28–40):

```ts
// Funnel-deploy allowlist. When DEPLOY_TARGET=funnel is set
// (techyai.co Vercel project), every URL not matching one of
// these prefixes returns 404.
const FUNNEL_ALLOWLIST = [
  '/',                          // landing (exact)
  '/welcome',
  '/free/freedom-os',
  '/assessment/',               // dynamic [assessmentId]
  '/api/landing/',
  '/api/checkout/',
  '/api/assessment/',
  '/api/freedom-agent/chat',
  '/api/freedom-agent/conversation',
]
```

Enforcement point: `src/middleware.ts:205-210`:

```ts
if (process.env.DEPLOY_TARGET === 'funnel') {
  const pathname = request.nextUrl.pathname
  if (!isFunnelPath(pathname)) {
    return new NextResponse(null, { status: 404 })
  }
}
```

`isFunnelPath` also passthroughs `/_next/`, `/favicon.{ico,svg}`, `/robots.txt`, `/sitemap.xml`.

### Page routes that render HTML (Meta Pixel `PageView` candidates)

| Route | File | Type |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing (server component) |
| `/welcome` | `src/app/(public)/welcome/page.tsx` | Server component with auth gate; renders the "Your Escape Assessment is ready" page on success |
| `/free/freedom-os` | `src/app/(public)/free/freedom-os/page.tsx` (+ `FreedomOSTool.tsx`, `PlanResultsView.tsx`) | Server gate + client form (9 questions) |
| `/free/freedom-os/plan/[planId]` | `src/app/(public)/free/freedom-os/plan/[planId]/page.tsx` | Plan results detail |
| `/assessment/[assessmentId]` | `src/app/assessment/[assessmentId]/page.tsx` (+ `src/components/assessment/AssessmentHUD.tsx`) | Personalised assessment HUD |

### API routes under the allowlist (server-only, no HTML)

```
src/app/api/landing/code-validate/route.ts
src/app/api/landing/email-notify/route.ts
src/app/api/checkout/create-session/route.ts
src/app/api/checkout/verify-session/route.ts
src/app/api/checkout/webhook/route.ts
src/app/api/assessment/generate/route.ts
src/app/api/assessment/email-capture/route.ts
src/app/api/assessment/email-status/route.ts
src/app/api/assessment/sprint-progress/route.ts
src/app/api/assessment/test/route.ts
src/app/api/freedom-agent/chat/route.ts
src/app/api/freedom-agent/conversation/route.ts
```

These never render HTML — no relevance for `<Script>` placement, but they are the trigger sites for several conversion events (see §6).

---

## 2 — Root layout(s) wrapping all funnel pages

**Single shared root layout. No route-group layouts.**

`git ls-tree -r --name-only funnel-deploy-techyai | grep 'layout\.(tsx|jsx|js|ts)$'`:

```
src/app/layout.tsx                                ← the only App Router layout
src/components/layout/EnhancedLayout.tsx          ← component, not a route layout
src/components/netflix-ui/NetflixLayout.tsx       ← component, not a route layout
src/components/templateEditor-v2/EditorLayout.tsx ← component, not a route layout
```

`src/app/layout.tsx` (full content of relevant parts):

```tsx
import './globals.css';
import { Inter, Playfair_Display, DM_Sans } from 'next/font/google';
// …
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'The Escape Assessment', … };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${inter.className}`}>
        <StateProvider>
          <Providers>
            <RootLayout>
              <FlagProviderClient>
                {children}
              </FlagProviderClient>
            </RootLayout>
          </Providers>
        </StateProvider>
      </body>
    </html>
  );
}
```

`(public)/` is a route group — it has no `layout.tsx`, so `/welcome` and `/free/freedom-os` inherit `src/app/layout.tsx` directly. `/assessment/[assessmentId]` lives outside the route group and also inherits the same root.

**Conclusion:** every funnel HTML page renders through exactly one layout: `src/app/layout.tsx`. A single `<Script>` insertion there reaches all 5 page routes.

---

## 3 — Existing `next/script` usage in the funnel surface

**Zero.** `git grep "from ['\"]next/script['\"]" funnel-deploy-techyai -- 'src/**'` returns no matches.

No other `<script>`-injection idiom is present either: `git grep "dangerouslySetInnerHTML.*script"` on the same tree → 0 matches. Clean slate.

---

## 4 — Existing analytics / tracking scripts on funnel pages

**Zero browser-side tracking scripts.** Verified by `git grep -nE "(fbq\(|fbevents|gtag\(|googletagmanager|google-analytics|posthog|segment\.|beehiiv\.com.*track|stripe-js|StripeJS)"` against the whole funnel-branch tree:

| Match | File | What it is |
|---|---|---|
| `https://www.google-analytics.com` | `src/lib/security/security-headers.ts:159` | **CSP allowlist entry** — permits GA if loaded, but nothing actually loads GA |
| `https://www.googletagmanager.com` | `src/lib/security/security-headers.ts:160` | Same — CSP allowlist only |
| `notifyBeehiiv` | `src/lib/beehiiv/notify.ts` (used by `src/app/api/assessment/email-capture/route.ts`) | **Server-side** Beehiiv subscriber API call, not a browser tracking pixel |
| `funnel/segment.ts` | `src/lib/funnel/segment.ts` | Internal lead-segmentation logic — not Segment.io |

No `fbq(`, no `gtag(`, no `posthog.`, no `analytics.track`, no `@stripe/stripe-js`, no `StripeJS`. Stripe is server-only (`getStripe()` in `src/lib/stripe/client.ts` with `STRIPE_SECRET_KEY`); checkout redirects to the hosted Stripe Checkout page, so no client-side `stripe-js` bundle is loaded on funnel pages.

The CSP file mentions GA / GTM hosts but no script loads from them. Whether the CSP `script-src` is broad enough to permit `connect.facebook.net` and `www.facebook.com` will need verification in Phase 2 before any pixel is inserted.

---

## 5 — Env var pattern for public IDs

### `.env*` files present on disk (current working tree, vercel-deploy-test):

```
.env.example         (1467 B, tracked)
.env.local.example   ( 768 B, tracked)
.env.local           (4128 B, gitignored)
.env.funnel          (2215 B, gitignored — funnel-specific local env)
```

`.gitignore` (on `funnel-deploy-techyai`):

```
.env
.env*.local
!.env.example
!.env.local.example
!.env.*.example
.env.funnel
```

So `.env.funnel` is **explicitly gitignored** — it's the established place to keep funnel-only local env. Production env vars live on the techyai.co Vercel project (per `FUNNEL_DEPLOY_README.md`):

```
DEPLOY_TARGET=funnel
NEXT_PUBLIC_SITE_URL=https://techyai.co
NEXT_PUBLIC_BASE_URL=https://techyai.co
NEXT_PUBLIC_APP_URL=https://techyai.co
NEXT_PUBLIC_DISABLE_AUTH=false
(+ Supabase, Stripe, Beehiiv, Anthropic, cookie-secret vars)
```

### `NEXT_PUBLIC_*` usage pattern (sampled across the funnel branch `src/`)

```
NEXT_PUBLIC_ADMIN_EMAIL
NEXT_PUBLIC_AI_API_URL
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_BASE_URL
NEXT_PUBLIC_DEMO_MODE
NEXT_PUBLIC_DISABLE_AUTH
NEXT_PUBLIC_ETL_API_KEY
NEXT_PUBLIC_FEATURE_*           (feature flags)
NEXT_PUBLIC_FIREBASE_*          (firebase auth — separate path)
NEXT_PUBLIC_OPENAI_API_KEY      (note: ill-advised but present)
NEXT_PUBLIC_PYTHON_SERVICE_URL
NEXT_PUBLIC_SHOW_ACTUALS
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
```

`NEXT_PUBLIC_*` is the standard pattern for client-readable vars. A pixel ID would naturally land as `NEXT_PUBLIC_META_PIXEL_ID` or `NEXT_PUBLIC_FB_PIXEL_ID`.

`DEPLOY_TARGET` is **not** prefixed `NEXT_PUBLIC_*` — it's read server-side only, inside middleware and (if added) inside the root layout's server render. That's important: the pixel can be conditionally injected at server-render time by reading `process.env.DEPLOY_TARGET` in `src/app/layout.tsx`, which means the Trendzo deploy (no `DEPLOY_TARGET=funnel`) emits no pixel script at all.

---

## 6 — Conversion event trigger points

Nothing currently fires any browser-side conversion event (no analytics installed). The list below is the inventory of **where each event WOULD fire** if mapped to Meta Pixel events later.

### 6.1 — Code redemption (5-letter code → access granted)

| Path | Server endpoint | Client trigger |
|---|---|---|
| Where validated | `src/app/api/landing/code-validate/route.ts:91-131` | — |
| Server return on success | line 121: `NextResponse.json({ ok: true, redirectTo: '/welcome?source=code' })` + signed `dl_code_path` cookie set | — |
| Client caller | `src/components/landing/CodeEntry.tsx` (POSTs to the route) | After `data.ok`, calls `router.push(data.redirectTo)` |
| Page where event would client-side fire | `/welcome` rendered with `searchParams.source === 'code'` | `src/app/(public)/welcome/page.tsx:60-95` (server component — would need a small client child to call `fbq`) |

Suggested Meta event mapping (for Phase 2 decision): `Lead` or custom `CodeRedeemed`.

### 6.2 — Stripe checkout success ($97 paid path)

| Path | Server endpoint | Client trigger |
|---|---|---|
| Checkout session created | `src/app/api/checkout/create-session/route.ts:46-48` — `success_url: ${base}/welcome?source=paid&session_id={CHECKOUT_SESSION_ID}` | `src/components/landing/PaidCheckoutButton.tsx` |
| Webhook confirms payment | `src/app/api/checkout/webhook/route.ts:29-58` — handles `checkout.session.completed`, updates `stripe_purchases.status='paid'` | Server-only (Stripe → server) |
| Page where event would client-side fire | `/welcome?source=paid&session_id=...` after `waitForPaid()` returns ok (`src/app/(public)/welcome/page.tsx:67-77`) | Server component — fires only if `isPaid === true`, which means money has actually settled |

Suggested mapping: `Purchase` with `value: 97.00, currency: 'USD'`.

### 6.3 — Assessment generated (9-question form submitted)

| Path | Server endpoint | Client trigger |
|---|---|---|
| Form submit | `src/app/(public)/free/freedom-os/FreedomOSTool.tsx:175` — `fetch('/api/assessment/generate', …)` | Form `onSubmit` |
| Generator | `src/app/api/assessment/generate/route.ts` — persists row, marks Stripe purchase consumed (lines 172-189), links code redemption (lines 198+) | — |
| Client redirect on success | `FreedomOSTool.tsx:215` — `router.push('/assessment/' + shareUrlId)` | — |
| Page where event would client-side fire | `/assessment/[assessmentId]` first mount (`src/components/assessment/AssessmentHUD.tsx`) | Already a client component — `fbq('track', ...)` could fire in a `useEffect` |

Suggested mapping: `CompleteRegistration` or `Lead` (since lead identity established here).

### 6.4 — Email capture (HUD email panel / agent conversation)

| Path | Server endpoint | Client trigger |
|---|---|---|
| Capture form | `src/components/assessment/EmailCapturePanel.tsx` (also `AgentGate.tsx`, `AgentRail.tsx`, `AssessmentHUD.tsx`) | User submits email on assessment page |
| Server route | `src/app/api/assessment/email-capture/route.ts` | Validates `source: 'hud_panel' \| 'agent_conversation'`, persists, then `notifyBeehiiv()` (line ~140) |
| Source values | `'hud_panel'`, `'agent_conversation'` (defined `VALID_SOURCES`) | — |

Suggested mapping: `Lead` (separate event id from §6.1 if both are mapped).

### 6.5 — Freedom Agent conversation (qualitative engagement)

| Path | Server endpoint | Client trigger |
|---|---|---|
| Chat & conversation routes | `src/app/api/freedom-agent/chat/route.ts`, `src/app/api/freedom-agent/conversation/route.ts` | Used from `AssessmentHUD.tsx` / `AgentRail.tsx` |

Not a clean "conversion" — likely **out of scope** for an initial pixel install unless you want a custom `AgentOpened` event.

---

## 7 — Cross-cutting notes

1. **The Trendzo (non-funnel) deploy and the techyai.co (funnel) deploy share the same `src/`**. The only thing that distinguishes them at runtime is `DEPLOY_TARGET=funnel` set on the techyai.co Vercel project. Whatever is injected into `src/app/layout.tsx` runs on both deploys unless it's gated by `process.env.DEPLOY_TARGET === 'funnel'`.
2. **`src/app/layout.tsx` already declares `export const dynamic = 'force-dynamic'`.** So `process.env.DEPLOY_TARGET` is readable per-render — no caching surprise.
3. **The funnel surface has no service worker, no `_document.tsx`** (App Router, not Pages Router). All HTML head/body injection happens through `app/layout.tsx`.
4. **CSP** is defined in `src/lib/security/security-headers.ts:159-160` and currently allows `google-analytics.com` and `googletagmanager.com` in `script-src`/`connect-src`. For Meta Pixel it would need `connect.facebook.net` (script) and `www.facebook.com` (img + connect). Verify before implementation.
5. **Branch state.** `funnel-deploy-techyai` HEAD is local `c760c80` ("docs(funnel): archive planning + audit docs"), 1 commit ahead of `origin/funnel-deploy-techyai` (`60b8935`). Push state: that 1 commit is docs-only.
6. **Current working tree** is `vercel-deploy-test` with the uncommitted Orb work documented in `ORB_FORENSIC_2026-05-19.md`. To do Phase 3 implementation cleanly, the Orb work needs to either be stashed, committed to its own branch, or untouched before checking out `funnel-deploy-techyai`. Phase 2 should flag this.

---

## 8 — Stop and report

Phase 1 complete. No source files modified. Awaiting:

- Confirmation of Meta Pixel ID + which env var name you want to use.
- Whether you want **base pixel only** (`PageView` on all 5 funnel page routes) or **base pixel + conversion events** mapped to the 4-5 funnel actions in §6.

Once those two are answered, I will produce `META_PIXEL_INSTALL_PLAN.md` (Phase 2). No implementation yet.
