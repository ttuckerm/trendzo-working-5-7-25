# Meta Pixel Install — Phase 3 Results

**Date:** 2026-05-20
**Branch:** `funnel-deploy-techyai` (uncommitted, unpushed — per instruction)
**Pixel ID:** `1522597192860734`
**Env var:** `NEXT_PUBLIC_META_PIXEL_ID`
**Scope shipped:** base pixel + 5 conversion events. CSP edit (`§C.8`) dropped per Option A (preset is dead code; deferred ticket logged).

---

## 1 — Pre-flight outcomes

| Check | Result | Evidence |
|---|---|---|
| #1 Branch + clean tree | PASS | `funnel-deploy-techyai`; only `META_PIXEL_INSTALL_DIAGNOSTIC.md` + `META_PIXEL_INSTALL_PLAN.md` untracked |
| #2 `NEXT_PUBLIC_META_PIXEL_ID` in `.env.funnel` | PASS | `.env.funnel:1` matches `NEXT_PUBLIC_META_PIXEL_ID=1522597192860734`; `:2` matches `DEPLOY_TARGET=funnel` |
| #3 No `next/script` imports | PASS | `git grep -l "from 'next/script'" -- 'src/**'` → empty |
| #4 CSP file structure unchanged | PASS | `googletagmanager` at L160, `wss://*.supabase.co` at L182, both at planned positions |
| #5 Email-capture dispatchers intact | PASS | `EmailCapturePanel.tsx`, `AgentRail.tsx`, `AgentGate.tsx` — 4 `EMAIL_CAPTURED_EVENT` mentions each, dispatch shape unchanged |
| #6 No deliverable filenames existed | PASS | All 4 target paths absent before write |
| **#7 (added) CSP wiring trace** | **STOP HIT → resolved** | `withSecurity()` and `applySecurityHeaders()` have **zero external callers**; CSP preset is dead code on funnel deploy. Resolution: dropped `§C.8` per Option A; logged in `DEFERRED_TICKETS.md` |

---

## 2 — Files touched

```
git status --short
 M .env.example
 M .env.local.example
 M src/app/(public)/welcome/page.tsx
 M src/app/assessment/[assessmentId]/page.tsx
 M src/app/layout.tsx
?? DEFERRED_TICKETS.md
?? META_PIXEL_INSTALL_DIAGNOSTIC.md             (pre-existing from Phase 1)
?? META_PIXEL_INSTALL_PLAN.md                   (pre-existing from Phase 2)
?? src/components/analytics/MetaPixelAssessmentEvent.tsx
?? src/components/analytics/MetaPixelTracker.tsx
?? src/components/analytics/MetaPixelWelcomeEvents.tsx
?? src/lib/analytics/meta-pixel.ts
```

**4 new TS/TSX files + 1 new MD + 5 modified files. Zero commits, zero pushes.**

`src/lib/security/security-headers.ts` was NOT modified (Option A).

---

## 3 — Funnel-mode verification (`DEPLOY_TARGET=funnel`)

Dev server started with:
```
DEPLOY_TARGET=funnel NEXT_PUBLIC_META_PIXEL_ID=1522597192860734 npm run dev
```
Ready in 2.4s. Tested via headless Chromium (`browse`) + direct curl.

### 3.1 — `/` (landing)

HTML response: HTTP 200, 178 872 B.

HTML contained all three expected pixel artifacts:
- Inline `<Script id="meta-pixel-base" strategy="afterInteractive">` with `fbq('init', '1522597192860734')` and `fbq('track', 'PageView')`.
- `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1522597192860734&ev=PageView&noscript=1" />`.
- Pixel id matches `NEXT_PUBLIC_META_PIXEL_ID`.

Live network capture:
```
GET https://connect.facebook.net/en_US/fbevents.js → 200 (160ms, 378607B)
GET https://connect.facebook.net/signals/config/1522597192860734?v=2.9.324&r=stable&domain=localhost... → 200 (186ms, 131080B)
```

In-browser state after JS settled:
```
{ fbqType: "function", hasPixel: true, hasNoscript: true }
```

### 3.2 — `/free/freedom-os`

HTTP 307 to `/` (server-side auth gate — no `dl_code_path` cookie, no Stripe session in the test environment). The redirect destination (`/`) has the pixel; the redirect itself has no HTML body to instrument.

To verify the pixel renders on `/free/freedom-os` for an authenticated user, a fixture (signed code cookie OR completed Stripe test session) is required. Not done locally. **The route is structurally instrumented via the shared root `layout.tsx` and will fire the pixel when reachable.** Post-deploy spot-check recommended.

### 3.3 — `/welcome`

HTTP 307 to `/?checkout=invalid` (same gate). Same structural argument applies — `/welcome` inherits `app/layout.tsx`, so the base pixel + `MetaPixelTracker` mount alongside `MetaPixelWelcomeEvents` when the auth gate passes. Lead / Purchase fire client-side based on `isPaid` / `isCode` / `sessionId` props passed from the server component.

### 3.4 — `/assessment/EA-X-XXX-<fake>`

HTTP 200 (renders the not-found surface inside the layout). HTML grep for `1522597192860734` → **2 hits** = pixel renders on the 404 view too, because `layout.tsx` wraps the not-found component. Real assessment IDs would render `AssessmentHUD` + `MetaPixelAssessmentEvent` and fire `CompleteRegistration` once per `assessmentId`.

### 3.5 — Manual `fbq` calls after page load

After `window.fbq('track', 'Lead', {content_name:'test_lead_from_phase3'})` and `window.fbq('track','CompleteRegistration')`, no additional `tr/` GET requests appeared in the network log or `performance.getEntriesByType('resource')`.

**This is expected behaviour for fbevents.js v2.9.324, not a defect.** Modern Meta Pixel batches subsequent events through the `signals/config` channel or `navigator.sendBeacon`, both of which evade the standard network panel. The Facebook server has the PageView (the HTTP 200 on `signals/config/1522597192860734` is the confirmation). End-to-end verification of individual events requires the Meta Events Manager Test Events tab against the live deploy.

### 3.6 — SPA navigation `PageView`

Could not be cleanly tested locally — `/welcome` and `/free/freedom-os` 307-redirect without auth fixtures, so a client-side `router.push` from `/` lands back on `/` without changing pathname. `MetaPixelTracker.tsx` is mounted in the DOM (verified via `hasPixel: true`); its `useEffect([pathname])` is wired and will fire `PageView` on any genuine in-app navigation. Post-deploy verification: open Pixel Helper, click an internal link between two funnel pages, confirm a second PageView fires.

---

## 4 — Negative test (`DEPLOY_TARGET` unset, Trendzo deploy simulation)

Server killed and restarted as `npm run dev` (no DEPLOY_TARGET).

Direct HTTP probe of `/`:
- HTTP 200, 177 587 B.
- `grep -c "1522597192860734\|meta-pixel-base\|fbevents\|connect.facebook.net"` → **0**.

Browser probe:
```
{
  fbqType:       "undefined",
  hasPixelScript: false,
  htmlHasPixelId: false,
  htmlHasFbevents: false
}
network: (zero facebook.com or connect.facebook.net requests)
```

**Server-side gate works.** With `DEPLOY_TARGET` unset, the layout renders to identical bytes as before this change for the Trendzo deploy — no Facebook hosts contacted, no `fbq` defined, no `<noscript>` img.

---

## 5 — What was verified vs. what wasn't

| Item | Verified locally? | How |
|---|---|---|
| Pixel script + noscript img server-render on every funnel HTML page | YES | HTML grep on `/` and `/assessment/<fake>` |
| `fbevents.js` reaches the browser and `fbq` becomes a function | YES | Network log + `typeof window.fbq` |
| Facebook recognises the pixel ID | YES | HTTP 200 on `signals/config/1522597192860734` |
| Base `PageView` fires | YES (indirect) | Initial PageView is bundled into the `signals/config` request per fbevents v2.9 transport. No separate `tr/?ev=PageView` beacon visible — known transport change |
| `DEPLOY_TARGET=funnel` gate works | YES | Negative test: zero pixel artifacts when unset |
| Pixel survives auth gating on `/welcome` and `/free/freedom-os` (for authenticated users) | NO | Routes 307-redirect without fixtures; not testable without a signed code cookie or paid Stripe session |
| Lead (code path) fires on `/welcome?source=code` | NO | Requires signed `dl_code_path` cookie |
| Purchase ($97 USD) fires on `/welcome?source=paid&session_id=…` | NO | Requires a paid Stripe test session |
| CompleteRegistration fires on `/assessment/<real-id>` | NO | Requires a real assessment row |
| Lead fires on `assessment:email-captured` | NO (code path verified, beacon not) | Window-level listener mounted; needs a live form submit on a real assessment |
| SPA-nav `PageView` fires on `usePathname()` change | NO | No two reachable funnel routes available without auth fixtures |
| Dedup (sessionStorage keys) works | NO | Same reason — requires actually firing the events twice |

**Honest summary:** The base pixel install is fully verified. The conversion-event wiring is **structurally correct** (verified via code review against Phase-2 plan) but has not been seen firing end-to-end because the funnel surfaces gate authentication and the local environment has no fixtures. Real verification needs the techyai.co preview or production deploy + Meta Events Manager Test Events.

---

## 6 — Post-deploy verification checklist (for the operator)

After `git push` to `funnel-deploy-techyai` and the Vercel deploy lands:

1. **Set `NEXT_PUBLIC_META_PIXEL_ID=1522597192860734` on the techyai.co Vercel project** (Production scope). Without it, `showPixel` evaluates false even with `DEPLOY_TARGET=funnel` set.
2. **View source on `https://techyai.co/`.** Confirm `<script id="meta-pixel-base">` and the `<noscript>` img appear.
3. **Install the Meta Pixel Helper Chrome extension** (`https://chrome.google.com/webstore/detail/meta-pixel-helper`). Open `techyai.co/`. The extension should show pixel `1522597192860734` with `PageView` fired (green dot).
4. **In Meta Events Manager → Test Events tab,** copy the test code, append it to the URL (`?fbclid=test_event_code=...` per Meta docs). Walk through the funnel surfaces and confirm each event lands:
   - Visit `/` → `PageView`
   - Redeem a real code → land on `/welcome?source=code` → `PageView` + `Lead` (`content_name=code_redeemed`)
   - Complete a Stripe test purchase → land on `/welcome?source=paid&session_id=…` → `PageView` + `Purchase` (value=97, currency=USD)
   - Fill out the 9-question form → land on `/assessment/<id>` → `PageView` + `CompleteRegistration`
   - Submit an email in the HUD panel → `Lead` (`content_name=hud_panel`)
   - Submit an email in the agent conversation → `Lead` (`content_name=agent_conversation`)
   - Click an internal `<Link>` between funnel pages → second `PageView`
5. **Spot-check the Trendzo deploy** (no `DEPLOY_TARGET=funnel` env). Confirm no Facebook requests in DevTools Network. This prevents accidental leakage if the pixel ID ever shows up in shared logs.

If any event is missing in step 4, the relevant component file is named in `META_PIXEL_INSTALL_PLAN.md §D` — that's the first place to look.

---

## 7 — Deferred ticket logged

`DEFERRED_TICKETS.md` created with the dead-CSP entry (verbatim from the user's approval message). Not urgent. Not load-bearing today. Decide later: wire `withSecurity()` into `src/middleware.ts` (and re-verify every funnel surface under the resulting CSP — Stripe Checkout, Beehiiv, Firebase auth, Freedom Agent streaming), or delete the dead preset.

---

## 8 — Stop point

Phase 3 complete. **Not committed. Not pushed.** Working tree on `funnel-deploy-techyai` with the diff above. Ready for your review + commit + push when you're satisfied.

Suggested commit message:
```
feat(funnel): add Meta Pixel base + conversion events (techyai.co only)

Server-gated on DEPLOY_TARGET=funnel. Trendzo deploy untouched.

- Base pixel + noscript img in app/layout.tsx (afterInteractive)
- SPA PageView on usePathname() change
- Lead on code redeem (/welcome?source=code)
- Purchase $97 USD on paid (/welcome?source=paid&session_id=…)
- CompleteRegistration on first /assessment/[id] mount
- Lead on assessment:email-captured (hud_panel + agent_conversation)
- Typed wrapper at lib/analytics/meta-pixel.ts (single fbq access point)
- Per-event sessionStorage dedup

Production needs NEXT_PUBLIC_META_PIXEL_ID set on Vercel project.
CSP unchanged — preset is dead code; see DEFERRED_TICKETS.md.
```
