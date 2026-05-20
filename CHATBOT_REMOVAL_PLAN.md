# Chatbot Removal — Phase 2 Plan

**Date:** 2026-05-20
**Branch:** `funnel-deploy-techyai`
**Strategy:** A — server-prop pattern, reuses existing `DEPLOY_TARGET` server-side env var.
**Scope:** minimum — gate `FloatingBrainTrigger` and `FloatingBrainChat`. Do **not** touch `GlobalBrainProvider`, `ScreenContextService`, or the individual brain components.
**Mode:** plan only. No source files modified. Implementation gated on user approval.

---

## A — Architectural decisions

1. **Re-use the existing `DEPLOY_TARGET` server-side env var** that already gates the Meta Pixel in `src/app/layout.tsx:36-37`. Single source of truth for "is this the funnel deploy". No new `NEXT_PUBLIC_*` var.
2. **Server-side derivation + prop drilling.** `src/app/layout.tsx` is a server component (`force-dynamic`). It reads `process.env.DEPLOY_TARGET`, derives `isFunnelDeploy: boolean`, passes it to `<RootLayout>` (which is `src/app/_app.tsx`, a `'use client'` component). The boolean is plain data — safe to cross the server→client boundary.
3. **Default prop value of `false`.** If `isFunnelDeploy` is omitted (because some other test or harness mounts `<RootLayout>` directly without passing it), the widget keeps existing behaviour — visible on non-`/agency` routes. The Trendzo deploy doesn't have to change anything; only the funnel deploy passes the prop with `true`.
4. **Combine with the existing `isAgencyRoute` check, don't replace it.** `/agency` exclusion stays in place on both deploys. The new gate adds: "hide on funnel deploy, even outside `/agency`."
5. **Keep `<GlobalBrainProvider>` mounted on both deploys.** Removing it would be a bundle-weight optimisation, but it requires touching the provider, would shadow-break `BrainQuickAccess` (currently dead but could be re-introduced), and adds zero user-visible value once the trigger/chat are hidden. Out of scope per the approved minimum.

---

## B — Exact file edits

### B.1 — `src/app/layout.tsx` (modify)

Current state (verified by Read just now):

- Line 36: `const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;`
- Line 37: `const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;`
- Line 67: `<RootLayout>` (no props)

Two changes:

1. Add one line after line 37 deriving `isFunnelDeploy`.
2. Update the `<RootLayout>` mount on line 67 to pass that prop.

Diff intent (added lines marked `+`):

```tsx
   const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
   const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;
+  const isFunnelDeploy = process.env.DEPLOY_TARGET === 'funnel';

   return (
     <html lang="en" suppressHydrationWarning>
       ...
       <body className={...}>
         <StateProvider>
           <Providers>
-            <RootLayout>
+            <RootLayout isFunnelDeploy={isFunnelDeploy}>
               <FlagProviderClient>
                 {showPixel && <MetaPixelTracker />}
                 {children}
               </FlagProviderClient>
             </RootLayout>
           </Providers>
         </StateProvider>
       </body>
     </html>
   );
```

Note on naming: `isFunnelDeploy` is intentionally a separate constant from `showPixel`, not a reuse, because the semantics differ (pixel also requires `!!pixelId`; the brain gate does not).

### B.2 — `src/app/_app.tsx` (modify)

Current state (verified earlier):

- Line 23-27: signature `export default function RootLayout({ children }: { children: ReactNode })`
- Line 30: `const isAgencyRoute = (pathname || '').startsWith('/agency')`
- Lines 47-48:
  ```tsx
  {!isAgencyRoute && <FloatingBrainChat />}
  {!isAgencyRoute && <FloatingBrainTrigger />}
  ```

Two changes:

1. Extend the signature to accept the new `isFunnelDeploy` prop with a default.
2. Combine the new gate with the existing `!isAgencyRoute` check on both mounts.

Diff intent:

```tsx
 export default function RootLayout({
-  children
+  children,
+  isFunnelDeploy = false,
 }: {
   children: ReactNode
+  isFunnelDeploy?: boolean
 }) {
   const pathname = usePathname()
   const isMembershipRoute = (pathname || '').startsWith('/membership')
   const isAgencyRoute = (pathname || '').startsWith('/agency')
   ...
   return (
     <ErrorBoundary>
       <GlobalBrainProvider>
         <div id="app-root">
           <TopBanner />
           {children}
-          {!isAgencyRoute && <FloatingBrainChat />}
-          {!isAgencyRoute && <FloatingBrainTrigger />}
+          {!isAgencyRoute && !isFunnelDeploy && <FloatingBrainChat />}
+          {!isAgencyRoute && !isFunnelDeploy && <FloatingBrainTrigger />}
           <QaOverlay />
         </div>
       </GlobalBrainProvider>
     </ErrorBoundary>
   );
 }
```

The default of `false` preserves existing Trendzo behaviour for any caller that doesn't pass the prop (production, tests, Storybook, etc.).

### Files NOT modified

- `src/components/admin/FloatingBrainTrigger.tsx` — unchanged. Still mounted on Trendzo.
- `src/components/admin/FloatingBrainChat.tsx` — unchanged. Still mounted on Trendzo.
- `src/contexts/GlobalBrainContext.tsx` — provider stays globally mounted on both deploys. Minimum scope.
- `src/lib/services/ScreenContextService.ts` — only instantiated inside `FloatingBrainChat`, never reached on funnel post-fix.
- `src/components/admin/BrainQuickAccess.tsx` — dead code. Out of scope.

---

## C — Pre-flight checks (Phase 3 must run these and STOP on any mismatch)

Each check is a single command. If a check fails, halt and report — do not edit any file.

### C.1 — Branch

```
git rev-parse --abbrev-ref HEAD
# Expected: funnel-deploy-techyai
```

If not on `funnel-deploy-techyai`, STOP. Do not auto-switch (the working tree currently carries the uncommitted Meta Pixel work + this plan; a silent checkout could lose it).

### C.2 — `src/app/layout.tsx` pixel-gate anchors still at expected lines

```
grep -n "const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID" src/app/layout.tsx
grep -n "const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId" src/app/layout.tsx
grep -n "<RootLayout>" src/app/layout.tsx
# Expected: pixelId line at 36, showPixel line at 37, <RootLayout> at 67
```

If line numbers differ but the content matches at OTHER lines, the edits still apply — proceed with a note. If content has changed (e.g. `DEPLOY_TARGET` check refactored away), STOP and re-plan.

### C.3 — `src/app/_app.tsx` agency-exclusion anchors still at expected lines

```
grep -n "const isAgencyRoute = (pathname || '').startsWith('/agency')" src/app/_app.tsx
grep -n "!isAgencyRoute && <FloatingBrainChat />" src/app/_app.tsx
grep -n "!isAgencyRoute && <FloatingBrainTrigger />" src/app/_app.tsx
# Expected: isAgencyRoute line ~30, FloatingBrainChat mount ~47, FloatingBrainTrigger mount ~48
```

If any of the three exact strings is missing, STOP. The mount pattern has been refactored and the gate has to be re-targeted.

### C.4 — No other callers of `FloatingBrainTrigger` or `FloatingBrainChat`

```
git grep -nE "FloatingBrainTrigger|FloatingBrainChat" -- 'src/**' ':!src/components/admin/FloatingBrainTrigger.tsx' ':!src/components/admin/FloatingBrainChat.tsx'
# Expected: only matches in src/app/_app.tsx (imports + mounts). No other files.
```

If anything outside `_app.tsx` and the two component files imports or renders them, STOP — the gate in `_app.tsx` alone won't reach those other sites. Either expand the gate or re-plan.

### C.5 — `.env.funnel` still carries the funnel-mode env (sanity check for verification)

```
grep -E '^(DEPLOY_TARGET=funnel|NEXT_PUBLIC_META_PIXEL_ID=)' .env.funnel
# Expected: both lines present (the pixel-ID line can be empty value — only DEPLOY_TARGET matters here)
```

If `.env.funnel` is gone or `DEPLOY_TARGET=funnel` is missing, the funnel-mode verification can't simulate techyai.co locally. STOP and ask whether to recreate it or skip live verification.

### C.6 — Working tree state

```
git status --short
# Expected: the Meta Pixel install diff + the Phase 1 diagnostic. No conflicting in-flight work on _app.tsx or layout.tsx beyond what the pixel install committed (which is the new RootLayout integration, but RootLayout is still called with no props in layout.tsx — the diff above is additive).
```

If `src/app/layout.tsx` or `src/app/_app.tsx` show uncommitted edits other than the Meta Pixel changes already accounted for in pre-flights C.2 and C.3, STOP.

---

## D — Verification plan (Phase 3 runs after the edits)

Three scenarios. Two dev-server modes (funnel and Trendzo simulation). Plus a static-code regression check.

### D.1 — Funnel mode: blue bubble must be GONE

Start dev server with funnel env:

```
DEPLOY_TARGET=funnel NEXT_PUBLIC_META_PIXEL_ID=1522597192860734 npm run dev
```

Wait for `Ready in …` then probe:

```
curl -s -o /tmp/funnel_home.html http://localhost:3000/
grep -c "FloatingBrainTrigger\|from-blue-500 to-purple-500\|h-16 w-16 rounded-full" /tmp/funnel_home.html
# Expected: 0
```

Also, browse and inspect the DOM:

```
$B goto http://localhost:3000/
$B js "({
  hasBubble: !!document.querySelector('button.h-16.w-16.rounded-full'),
  hasGradient: !!document.querySelector('[class*=\"from-blue-500\"][class*=\"to-purple-500\"]'),
  hasMessageSquareIcon: document.documentElement.outerHTML.includes('lucide-message-square'),
  fixedBottomRight: !!document.querySelector('div.fixed.bottom-6.right-6')
})"
# Expected: all four false
```

PASS if all grep counts are 0 and all four DOM probes return false.

### D.2 — Trendzo mode: blue bubble must still be PRESENT on non-`/agency` routes

Kill the funnel-mode dev server. Restart without `DEPLOY_TARGET`:

```
npm run dev
```

Wait for ready. Probe a public non-`/agency` route — `/` is the simplest (Trendzo's marketing landing, no auth gate):

```
curl -s -o /tmp/trendzo_home.html http://localhost:3000/
grep -c "from-blue-500 to-purple-500\|h-16 w-16 rounded-full" /tmp/trendzo_home.html
# Expected: ≥ 1
```

Plus browse DOM:

```
$B goto http://localhost:3000/
$B js "({
  hasBubble: !!document.querySelector('button.h-16.w-16.rounded-full'),
  fixedBottomRight: !!document.querySelector('div.fixed.bottom-6.right-6')
})"
# Expected: hasBubble true, fixedBottomRight true
```

Optional secondary probe: `/admin` (the user's example). Note this is auth-gated by middleware (`PROTECTED_ROUTES['/admin']` requires `chairman` / `sub_admin`). Without auth fixtures locally, it 307-redirects to `/login`. **If `/admin` redirects, fall back to `/` as the primary Trendzo regression probe.** Document the fallback in the results doc.

PASS if `/` shows the widget in Trendzo mode.

### D.3 — `/agency` regression: bubble must be hidden in BOTH modes

`/agency` exclusion is pre-existing behaviour. We must not regress it.

**Funnel mode (`DEPLOY_TARGET=funnel`):** The middleware allowlist 404s `/agency` before any layout renders, because `/agency` is not in `FUNNEL_ALLOWLIST`. So there's no DOM to check — the 404 implicitly satisfies the requirement (no widget can render on a 404 response that the middleware short-circuits).

```
curl -s -o /tmp/funnel_agency.html -w 'HTTP %{http_code}\n' http://localhost:3000/agency
# Expected: HTTP 404 (middleware short-circuit)
```

**Trendzo mode (no `DEPLOY_TARGET`):** `/agency` is auth-gated by middleware (`PROTECTED_ROUTES['/agency']`). Without auth fixtures locally, it 307-redirects to `/login`. The widget is hidden on `/login` too (it's a public route but the existing `isAgencyRoute = pathname.startsWith('/agency')` check is irrelevant since we're now on `/login` — and we're verifying `/agency` specifically, which isn't reached). For a truly clean check, set `NEXT_PUBLIC_DISABLE_AUTH=true` in `.env.local` temporarily, then probe — but that's invasive.

**Pragmatic alternative — static-code regression check (no auth required):**

```
grep -nE "isAgencyRoute = .*startsWith.'/agency'." src/app/_app.tsx
grep -nE "!isAgencyRoute" src/app/_app.tsx
# Expected: original isAgencyRoute derivation untouched; both mounts still gate on !isAgencyRoute
```

Static check is sufficient for D.3 — the `/agency` exclusion is pure-pathname React conditional rendering; if the source code still has `!isAgencyRoute` on both mounts, the runtime behaviour is determined and a live test would only re-confirm what the code says.

PASS criteria for D.3:
- Funnel mode `/agency` returns HTTP 404 (existing middleware behaviour).
- Static grep confirms `!isAgencyRoute` still present on both `<FloatingBrainChat />` and `<FloatingBrainTrigger />` mounts (now combined with `!isFunnelDeploy`).

### D.4 — No type errors

After the edits, do not run a full type-check (project-wide build can take minutes and may surface pre-existing errors unrelated to this change — `next.config.mjs:typescript.ignoreBuildErrors: true` is set for that reason). Instead, type-narrow check the two touched files via tsc on those files only, or accept that the dev server's incremental compile catches the relevant errors.

```
# Optional, recommended:
npx tsc --noEmit --project tsconfig.json src/app/layout.tsx src/app/_app.tsx 2>&1 | head -20
# Expected: no errors on the touched files
```

If the dev server starts and renders `/` without a compile error in the log, that's sufficient.

---

## E — Results doc

Phase 3 writes `CHATBOT_REMOVAL_RESULTS.md` containing:

1. Pre-flight outcomes per check C.1–C.6.
2. Diff of `src/app/layout.tsx` and `src/app/_app.tsx` (as actually written, copy-pasted from `git diff`).
3. Verification outcomes per scenario D.1, D.2, D.3 — including the actual DOM probe results and `/` HTTP responses for both modes.
4. Confirmation that no other files were touched.
5. Note on any pre-flight fallbacks (e.g. if `/admin` redirected and `/` was used instead).
6. Reminder: not committed, not pushed.

---

## F — Out of scope

- Removing `GlobalBrainProvider` from the funnel bundle. Not required to hide the widget; the provider's state machinery has no UI without `FloatingBrainTrigger` or `FloatingBrainChat` to mount.
- Deleting `BrainQuickAccess.tsx` (dead code). Separate cleanup.
- Auditing other potential cross-deploy leakage (admin floats, debug overlays). The `QaOverlay` in `_app.tsx:49` is also globally mounted — flagged here for awareness but not in scope for this ticket.

---

## G — Stop point

Phase 2 complete. Awaiting your approval to execute Phase 3. On approval, Phase 3 will:

1. Run pre-flight checks (§C). STOP on any mismatch.
2. Apply the two edits in §B in order: `src/app/layout.tsx` first, then `src/app/_app.tsx`.
3. Run the verification plan (§D), restarting the dev server between funnel-mode and Trendzo-mode tests.
4. Write `CHATBOT_REMOVAL_RESULTS.md`.
5. Do NOT commit. Do NOT push.

Reply "approved" (or any modifications) to proceed.
