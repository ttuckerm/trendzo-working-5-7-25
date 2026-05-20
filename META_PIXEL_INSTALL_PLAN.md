# Meta Pixel Install — Phase 2 Plan

**Date:** 2026-05-20
**Branch:** `funnel-deploy-techyai`
**Pixel ID:** `1522597192860734`
**Env var:** `NEXT_PUBLIC_META_PIXEL_ID`
**Scope:** base pixel + 5 conversion events (Lead × 3 sources, Purchase, CompleteRegistration)
**Mode:** Plan only. No source files modified. Implementation gated on user approval.

---

## A — Architectural decisions (committed in this plan)

1. **Server-side gate on `DEPLOY_TARGET=funnel`.** The pixel `<Script>` and the SPA-tracker client component are rendered conditionally inside `src/app/layout.tsx` based on `process.env.DEPLOY_TARGET === 'funnel'`. On the Trendzo deploy (no `DEPLOY_TARGET`), neither the script nor the tracker mount, so `fbq` is never defined and no Facebook hosts are contacted. Verified safe because `layout.tsx` already declares `export const dynamic = 'force-dynamic'` (per Phase 1 §7.2).
2. **Next.js `Script` with `strategy="afterInteractive"`.** Confirmed correct for Meta Pixel — the snippet must run after hydration so React owns the DOM first, but before user interactions so the first auto-`PageView` lands on initial paint. Meta's own snippet runs synchronously in the document `<head>` historically, but in a React/Next.js App Router context `afterInteractive` is the documented Next.js equivalent. `beforeInteractive` would race React's hydration; `lazyOnload` would miss the initial PageView.
3. **SPA navigation `PageView`.** Meta Pixel **does not** auto-fire on Next.js client-side route changes. A dedicated client component (`MetaPixelTracker`) subscribes to `usePathname()` and emits `fbq('track','PageView')` on every change (skipping the first one — the snippet's inline `fbq('track','PageView')` already covers the initial load).
4. **Conversion events fire client-side, on the post-redirect surface, not at the action endpoint.** Rationale: Meta Pixel is a browser-side beacon; firing from a server API route is the wrong tool (use Conversions API for server-side). For the code-redeem and Stripe-purchase paths, the firing surface is `/welcome` (which the server has already validated). For the assessment-generated path, it's the first mount of `/assessment/[id]`. For email-capture, it's a window-level listener for the existing `EMAIL_CAPTURED_EVENT` custom event the 3 capture surfaces already dispatch.
5. **Email-capture surfaces are not edited.** `EmailCapturePanel.tsx:140-145`, `AgentRail.tsx:225-227`, and `AgentGate.tsx:248-253` already `window.dispatchEvent(new CustomEvent('assessment:email-captured', { detail: { assessmentId, source } }))`. The pixel tracker subscribes to that event once. Zero edits to capture sites — fewer files touched, fewer regressions possible.
6. **Type safety: typed wrapper helper in `src/lib/analytics/meta-pixel.ts`** — NOT a bare `global.d.ts` declaration. Reasons: (a) callers don't have to remember the `typeof window !== 'undefined' && window.fbq` guard — the wrapper no-ops cleanly when `fbq` isn't loaded; (b) event names become a union type, so typos fail at compile time; (c) future swap to the Conversions API touches one file, not every call site. The wrapper file declares the `Window.fbq` global once, internally.
7. **Deduplication: per-event `sessionStorage` keys.** Survives re-renders, route-back-and-forth navigations, and React Strict Mode double-effects. Cleared when the tab session ends (intentional — a returning visitor on a new session is a new conversion candidate).

---

## B — Files modified / added

### Modified (4)

1. `src/app/layout.tsx` — base pixel `<Script>` + SPA tracker mount, both server-gated on `DEPLOY_TARGET=funnel`.
2. `src/app/(public)/welcome/page.tsx` — render `<MetaPixelWelcomeEvents>` once auth gate passes, passing `isPaid` and `source` props.
3. `src/app/assessment/[assessmentId]/page.tsx` — render `<MetaPixelAssessmentEvent assessmentId={…} />` next to `<AssessmentHUD>`.
4. `src/lib/security/security-headers.ts` — CSP additions for `connect.facebook.net` (script-src + connect-src) and `www.facebook.com` (connect-src). `img-src` is unchanged because the existing `'https:'` wildcard already covers `www.facebook.com/tr` and the `<noscript>` 1×1.

### Added (5)

5. `src/lib/analytics/meta-pixel.ts` — typed wrapper + `Window.fbq` declaration + dedup helpers.
6. `src/components/analytics/MetaPixelTracker.tsx` — client component. SPA `PageView` on pathname change + email-capture event listener.
7. `src/components/analytics/MetaPixelWelcomeEvents.tsx` — client component. Fires `Lead` (code path) or `Purchase` (paid path) once per session.
8. `src/components/analytics/MetaPixelAssessmentEvent.tsx` — client component. Fires `CompleteRegistration` once per assessmentId per session.
9. `.env.example` and `.env.local.example` — append `NEXT_PUBLIC_META_PIXEL_ID=` placeholder.

No edits to `CodeEntry.tsx`, `FreedomOSTool.tsx`, `EmailCapturePanel.tsx`, `AgentRail.tsx`, `AgentGate.tsx`, `AssessmentHUD.tsx`, or any API route.

---

## C — Exact code blocks (insertion points named by line ranges from Phase 1 read)

### C.1 — `src/lib/analytics/meta-pixel.ts` (NEW)

```ts
// Typed wrapper around the Meta Pixel global `fbq`. Single source of truth
// for event names + dedup. All other files use these helpers, not `fbq`
// directly, so a future Conversions-API migration touches this file only.

declare global {
  interface Window {
    fbq?: (
      command: 'init' | 'track' | 'trackCustom' | 'consent' | 'set',
      eventOrName: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    _fbq?: unknown;
  }
}

export type MetaStandardEvent =
  | 'PageView'
  | 'Lead'
  | 'Purchase'
  | 'CompleteRegistration';

function isLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
}

export function trackPageView(): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'PageView');
}

export function trackLead(params?: { content_name?: string }): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'Lead', params);
}

export function trackPurchase(value: number, currency: string = 'USD'): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'Purchase', { value, currency });
}

export function trackCompleteRegistration(): void {
  if (!isLoaded()) return;
  window.fbq!('track', 'CompleteRegistration');
}

// Dedup: returns true the first time a key fires in this tab session, false
// after that. Survives React Strict Mode double-mount + back/forward nav.
export function once(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(key) === '1') return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true; // sessionStorage blocked — fire anyway, accept duplicates
  }
}

export {};
```

### C.2 — `src/app/layout.tsx` (MODIFY)

Current head section ends at line 22 (`</head>` not present — `<head>` only contains the favicon link). The pixel `<Script>` + tracker mount go inside `<body>`, after `<StateProvider>` opens.

Diff intent (added lines marked with `+`):

```tsx
 import './globals.css';
 import { Inter, Playfair_Display, DM_Sans } from 'next/font/google';
 import type { Metadata } from 'next';
 import React from 'react';
 import type { ReactNode } from 'react';
+import Script from 'next/script';
 import Providers from './providers';
 import RootLayout from './_app';
 import { StateProvider } from '@/lib/contexts/StateContext';
 import FlagProviderClient from '@/components/FlagProviderClient';
+import MetaPixelTracker from '@/components/analytics/MetaPixelTracker';

 const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
 // …

 export default function Layout({ children }: { children: ReactNode }) {
+  // Pixel is only loaded on the funnel deploy (techyai.co). On the Trendzo
+  // deploy DEPLOY_TARGET is unset, the Script + Tracker render to null,
+  // and no Facebook hosts are contacted.
+  const isFunnel = process.env.DEPLOY_TARGET === 'funnel';
+  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
+  const showPixel = isFunnel && !!pixelId;
+
   return (
     <html lang="en" suppressHydrationWarning>
       <head>
         <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
+        {showPixel && (
+          <Script id="meta-pixel-base" strategy="afterInteractive">{`
+!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
+n.callMethod.apply(n,arguments):n.queue.push(arguments)};
+if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
+n.queue=[];t=b.createElement(e);t.async=!0;
+t.src=v;s=b.getElementsByTagName(e)[0];
+s.parentNode.insertBefore(t,s)}(window, document,'script',
+'https://connect.facebook.net/en_US/fbevents.js');
+fbq('init', '${pixelId}');
+fbq('track', 'PageView');
+          `}</Script>
+        )}
+        {showPixel && (
+          <noscript
+            dangerouslySetInnerHTML={{
+              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`,
+            }}
+          />
+        )}
       </head>
       <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${inter.className}`}>
         <StateProvider>
           <Providers>
             <RootLayout>
               <FlagProviderClient>
+                {showPixel && <MetaPixelTracker />}
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

Notes:
- `pixelId` is interpolated into the inline script via template literal. `NEXT_PUBLIC_META_PIXEL_ID` is server-readable (Next inlines it at build), so this works even though `layout.tsx` is rendered server-side.
- The `<noscript><img>` fallback is rendered into `<head>` via React. Browsers move it to `<body>` per the HTML spec when JS is disabled. This preserves the fallback PageView for non-JS visitors.
- `MetaPixelTracker` is inside `<FlagProviderClient>` so it benefits from the same React tree, but it is itself `'use client'` so the layout's server-render isn't compromised.

### C.3 — `src/components/analytics/MetaPixelTracker.tsx` (NEW)

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView, trackLead } from '@/lib/analytics/meta-pixel';

interface EmailCapturedDetail {
  assessmentId: string;
  source: 'hud_panel' | 'agent_conversation';
}

export default function MetaPixelTracker() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  // SPA navigation PageView. Skip the very first render — the snippet's
  // inline `fbq('track','PageView')` already fired the initial PageView.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname]);

  // Email-capture Lead — listen for the existing window-level CustomEvent
  // emitted by EmailCapturePanel.tsx, AgentRail.tsx, and AgentGate.tsx.
  // Dedup is keyed by (source, assessmentId) so the same form can't
  // double-fire if the user submits twice in one session.
  useEffect(() => {
    function onCaptured(e: Event) {
      const detail = (e as CustomEvent<EmailCapturedDetail>).detail;
      if (!detail?.source || !detail?.assessmentId) return;
      const key = `meta_pixel:lead:email:${detail.source}:${detail.assessmentId}`;
      if (typeof sessionStorage !== 'undefined') {
        if (sessionStorage.getItem(key) === '1') return;
        try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      }
      trackLead({ content_name: detail.source });
    }
    window.addEventListener('assessment:email-captured', onCaptured as EventListener);
    return () => {
      window.removeEventListener('assessment:email-captured', onCaptured as EventListener);
    };
  }, []);

  return null;
}
```

### C.4 — `src/components/analytics/MetaPixelWelcomeEvents.tsx` (NEW)

```tsx
'use client';

import { useEffect } from 'react';
import { trackLead, trackPurchase, once } from '@/lib/analytics/meta-pixel';

interface Props {
  isPaid: boolean;
  isCode: boolean;
  sessionId: string | null;
}

const PURCHASE_VALUE = 97.0;
const PURCHASE_CURRENCY = 'USD';

export default function MetaPixelWelcomeEvents({ isPaid, isCode, sessionId }: Props) {
  useEffect(() => {
    if (isPaid && sessionId) {
      // Keyed on Stripe session_id — a refresh of /welcome?session_id=X
      // won't re-fire, but a new purchase with a different session_id will.
      if (once(`meta_pixel:purchase:${sessionId}`)) {
        trackPurchase(PURCHASE_VALUE, PURCHASE_CURRENCY);
      }
      return;
    }
    if (isCode) {
      // Keyed on a tab-session basis — a code-path visitor who refreshes
      // /welcome doesn't double-fire. Different sessions still re-fire.
      if (once('meta_pixel:lead:code')) {
        trackLead({ content_name: 'code_redeemed' });
      }
    }
  }, [isPaid, isCode, sessionId]);

  return null;
}
```

### C.5 — `src/app/(public)/welcome/page.tsx` (MODIFY)

The render block starts at line 80 (`return ( <main … >`). The mount goes immediately inside `<main>`, before the `<section>` opens — outside any animated container, so it always runs even if the visual surface is hidden by reduced-motion.

Diff intent (around line 80):

```tsx
+import MetaPixelWelcomeEvents from '@/components/analytics/MetaPixelWelcomeEvents'
 // …
   return (
     <main className="min-h-screen bg-instrument-bg text-instrument-primary font-body antialiased">
+      <MetaPixelWelcomeEvents isPaid={isPaid} isCode={isCode} sessionId={sessionId} />
       <section className="relative px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24">
```

Notes:
- `isPaid`, `isCode`, `sessionId` are already server-resolved in the page body (lines 56-78). They're just forwarded as props.
- The component returns `null` on the Trendzo deploy because the script isn't loaded → `fbq` is undefined → the wrapper no-ops.

### C.6 — `src/components/analytics/MetaPixelAssessmentEvent.tsx` (NEW)

```tsx
'use client';

import { useEffect } from 'react';
import { trackCompleteRegistration, once } from '@/lib/analytics/meta-pixel';

interface Props {
  assessmentId: string;
}

export default function MetaPixelAssessmentEvent({ assessmentId }: Props) {
  useEffect(() => {
    if (!assessmentId) return;
    if (once(`meta_pixel:completereg:${assessmentId}`)) {
      trackCompleteRegistration();
    }
  }, [assessmentId]);
  return null;
}
```

### C.7 — `src/app/assessment/[assessmentId]/page.tsx` (MODIFY)

The render currently returns `<AssessmentHUD ... />`. Wrap in a fragment and add the event component as a sibling. `AssessmentHUD.tsx` is untouched.

Diff intent:

```tsx
 import { AssessmentHUD } from '@/components/assessment/AssessmentHUD'
+import MetaPixelAssessmentEvent from '@/components/analytics/MetaPixelAssessmentEvent'
 // …
   return (
-    <AssessmentHUD
-      assessmentId={row.assessment_id}
-      …
-    />
+    <>
+      <MetaPixelAssessmentEvent assessmentId={row.assessment_id} />
+      <AssessmentHUD
+        assessmentId={row.assessment_id}
+        …
+      />
+    </>
   )
```

### C.8 — `src/lib/security/security-headers.ts` (MODIFY) — CSP additions

Current `PRODUCTION` preset (lines 143-171 per the read in Phase 2):

```ts
'script-src': [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  'https://apis.google.com',
  'https://www.google-analytics.com',
  'https://www.googletagmanager.com'
],
'img-src': ["'self'", 'data:', 'https:', 'blob:'],
'connect-src': [
  "'self'",
  'https://api.openai.com',
  'https://api.anthropic.com',
  'https://*.supabase.co',
  'wss://*.supabase.co'
],
```

Required additions:

```ts
 'script-src': [
   "'self'",
   "'unsafe-inline'",
   "'unsafe-eval'",
   'https://apis.google.com',
   'https://www.google-analytics.com',
-  'https://www.googletagmanager.com'
+  'https://www.googletagmanager.com',
+  'https://connect.facebook.net'
 ],
 'img-src': ["'self'", 'data:', 'https:', 'blob:'],
 'connect-src': [
   "'self'",
   'https://api.openai.com',
   'https://api.anthropic.com',
   'https://*.supabase.co',
-  'wss://*.supabase.co'
+  'wss://*.supabase.co',
+  'https://connect.facebook.net',
+  'https://www.facebook.com'
 ],
```

`img-src` does NOT need editing — the existing `'https:'` blanket already permits `www.facebook.com/tr?...`. (If you later tighten `img-src` by removing `'https:'`, add `'https://www.facebook.com'` explicitly.)

Note: this is the **declarative preset only**. Whether the preset is actually applied to funnel page responses depends on where `applySecurityHeaders` is called. Phase 3 pre-flight verifies that an outbound funnel page response actually carries the new CSP — if it doesn't (e.g. the funnel deploy uses a different config slot), the CSP edit is a no-op and harmless, but a deploy on a stricter CSP would block fbevents.js.

### C.9 — `.env.example` and `.env.local.example` (MODIFY)

Append a labeled block to both files:

```
# Meta Pixel — base pixel + conversion events on techyai.co funnel pages only.
# The pixel is gated server-side by DEPLOY_TARGET=funnel, so leaving this
# unset on the Trendzo deploy is the correct configuration.
NEXT_PUBLIC_META_PIXEL_ID=
```

`.env.local` is gitignored — operator sets a real value locally. `.env.funnel` (also gitignored) is the right local file for funnel-mode dev. The production value lives on the techyai.co Vercel project env panel.

---

## D — Where each conversion event fires (mapping summary)

| Event | Surface | Trigger | Dedup key |
|---|---|---|---|
| `PageView` (initial) | every funnel page | inline `fbq('track','PageView')` in the base snippet | none (browser-default once) |
| `PageView` (SPA nav) | every funnel page | `MetaPixelTracker` `useEffect([pathname])` | none (one per nav is the contract) |
| `Lead` (code) | `/welcome?source=code` | `MetaPixelWelcomeEvents` `useEffect` when `isCode === true` | `meta_pixel:lead:code` |
| `Purchase` ($97 USD) | `/welcome?source=paid&session_id=…` | `MetaPixelWelcomeEvents` `useEffect` when `isPaid === true && sessionId` | `meta_pixel:purchase:<sessionId>` |
| `CompleteRegistration` | `/assessment/[assessmentId]` | `MetaPixelAssessmentEvent` `useEffect` on first mount | `meta_pixel:completereg:<assessmentId>` |
| `Lead` (`content_name: 'hud_panel'`) | window-level | `MetaPixelTracker` listener on `assessment:email-captured` | `meta_pixel:lead:email:hud_panel:<assessmentId>` |
| `Lead` (`content_name: 'agent_conversation'`) | window-level | same listener, source from detail | `meta_pixel:lead:email:agent_conversation:<assessmentId>` |

---

## E — Pre-flight checks (Phase 3 must run these and STOP on any mismatch)

Each check below is a single shell or git command. If any returns a different result than stated, halt and report — do not proceed to file edits.

1. **Working tree is on `funnel-deploy-techyai`.**
   ```
   git rev-parse --abbrev-ref HEAD
   # Expected: funnel-deploy-techyai
   ```
   If currently on `vercel-deploy-test` (Phase 1 §7.6 state), the Orb work must be either (a) committed to a topic branch off `vercel-deploy-test`, or (b) `git stash push -u -m "orb-wip"`. Phase 3 STOPS until the user picks one — neither is silently auto-chosen.

2. **`NEXT_PUBLIC_META_PIXEL_ID` is set in `.env.funnel`.**
   ```
   grep -E '^NEXT_PUBLIC_META_PIXEL_ID=1522597192860734$' .env.funnel
   ```
   Must match exactly. If the value differs or the var is missing, STOP. (The production deploy will still need the value set on the Vercel project — that's a deploy-time step, not a Phase 3 step.)

3. **No `next/script` import has been added to `src/**` since Phase 1.**
   ```
   git grep -l "from ['\"]next/script['\"]" -- 'src/**'
   # Expected: zero results
   ```
   If anything matches, the existing `<Script>` site must be reviewed before piling on a second one.

4. **CSP file structure unchanged.** Verify the `PRODUCTION` preset's `script-src`, `img-src`, and `connect-src` arrays match the lines documented in §C.8 above. If the arrays have new entries or have been refactored, the diff target has moved — re-plan the CSP edit before touching the file.
   ```
   git show HEAD:src/lib/security/security-headers.ts | grep -nE "googletagmanager|wss://\*\.supabase\.co"
   # Expected lines exist at the documented positions
   ```

5. **Email-capture dispatch sites still emit the expected event shape.**
   ```
   git grep -nE "EMAIL_CAPTURED_EVENT|assessment:email-captured" -- 'src/components/assessment/**'
   # Expected matches: EmailCapturePanel.tsx, AgentRail.tsx, AgentGate.tsx all dispatch
   # CustomEvent('assessment:email-captured', { detail: { assessmentId, source } })
   ```
   If the event name, detail shape, or any dispatcher has changed, the email-capture Lead wiring needs re-review.

6. **No Phase-2 deliverable filenames already exist.**
   ```
   ls src/lib/analytics/meta-pixel.ts \
      src/components/analytics/MetaPixelTracker.tsx \
      src/components/analytics/MetaPixelWelcomeEvents.tsx \
      src/components/analytics/MetaPixelAssessmentEvent.tsx 2>&1
   # Expected: all four "No such file or directory"
   ```
   Existing files at any of these paths would indicate a prior partial install — STOP and reconcile manually.

---

## F — Verification plan for Phase 3 (post-implementation)

### F.1 — Local dev verification (DEPLOY_TARGET=funnel)

Start dev server with funnel env:
```
DEPLOY_TARGET=funnel NEXT_PUBLIC_META_PIXEL_ID=1522597192860734 npm run dev
```

For each of the 5 page routes, load via `browse` (headless Chromium with DevTools-equivalent network capture):

| Route | Expected `fbevents.js`? | Expected first event |
|---|---|---|
| `/` | YES | `PageView` (from inline snippet) |
| `/welcome?source=code` (with valid `dl_code_path` cookie) | YES | `PageView` then `Lead` (content_name: code_redeemed) |
| `/welcome?source=paid&session_id=cs_test_…` (test fixture) | YES | `PageView` then `Purchase` (value=97, currency=USD) |
| `/free/freedom-os` | YES | `PageView` |
| `/assessment/EA-X-XXX-<token>` (real assessment row) | YES | `PageView` then `CompleteRegistration` |

For each route:
- Confirm `https://connect.facebook.net/en_US/fbevents.js` loads (HTTP 200, small JS bundle).
- Confirm at least one request to `https://www.facebook.com/tr/` with `id=1522597192860734` and the expected `ev=` parameter.
- Confirm console has no CSP violation messages mentioning facebook.

### F.2 — Conversion-event triggers (manual)

- **Email capture (HUD panel):** load `/assessment/EA-X-XXX-<token>`, paste a valid email into the email panel, submit. Watch network — expect `Lead` with `cd[content_name]=hud_panel`.
- **Email capture (agent conversation):** load same page, trigger the agent's inline email ask, submit. Expect `Lead` with `cd[content_name]=agent_conversation`.
- **SPA navigation:** from `/`, client-side-navigate (via `<Link>`) to `/welcome` (if such an internal link exists; otherwise reload via `router.push` from a test stub). Expect a second `PageView` request distinct from the initial one.

### F.3 — Negative test (DEPLOY_TARGET unset = Trendzo simulation)

Restart dev server without `DEPLOY_TARGET`:
```
npm run dev
```

Load `/`, `/welcome`, `/free/freedom-os`. Expectations:
- **Zero** requests to `connect.facebook.net` or `www.facebook.com`.
- `<script id="meta-pixel-base">` is not present in the rendered HTML.
- `window.fbq` is `undefined` in the JS console.
- `<noscript><img src="...facebook.com/tr...">` is not present in source.

If any of those fail, the server gate on `DEPLOY_TARGET` is broken — STOP and report.

### F.4 — Evidence written to `META_PIXEL_INSTALL_RESULTS.md`

Phase 3 writes a results document containing:
- Pre-flight check pass/fail per check 1–6.
- Network log summary per route (fbevents.js status, first event, content_name where applicable).
- Screenshot or text dump of DevTools showing the `Purchase` request payload (value=97, currency=USD).
- Negative-test confirmation that no Facebook requests fire without `DEPLOY_TARGET=funnel`.
- Any unexpected console messages.

---

## G — Out of scope for this plan

- **Server-side Conversions API.** Browser-side pixel only. CAPI would dedup with `eventID` and require a Facebook access token — a Phase-2.5 add if attribution accuracy demands it.
- **Consent gating.** No EU cookie banner integration. If techyai.co serves EEA traffic, a consent layer needs to be added before the pixel is shipped to production. Flag for product.
- **Freedom Agent conversation as a custom event** (Phase 1 §6.5). Excluded per the configuration in this round.
- **Migrating CSP from `'unsafe-inline'` + `'unsafe-eval'`.** Out of scope. The pixel works with the existing permissive CSP without nonces.
- **CodeEntry / FreedomOSTool / AssessmentHUD edits.** Not modified — all conversion firing happens on adjacent surfaces (post-redirect pages or window-level listeners).

---

## H — Stop point

Phase 2 complete. Awaiting your approval to execute Phase 3. On approval, Phase 3 will:
1. Run pre-flight checks (§E). STOP on any mismatch.
2. Switch to `funnel-deploy-techyai` after the Orb-work disposition is confirmed.
3. Apply the file edits in §C in the order listed.
4. Run the verification plan (§F).
5. Write `META_PIXEL_INSTALL_RESULTS.md`.
6. Do NOT commit. Do NOT push.

Reply with "approved" (or any modifications) to proceed.
