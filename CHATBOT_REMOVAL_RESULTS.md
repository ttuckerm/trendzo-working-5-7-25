# Chatbot Removal — Phase 3 Results

**Date:** 2026-05-20
**Branch:** `funnel-deploy-techyai` (HEAD at start: `d8d2157` "feat(funnel): install Meta Pixel on techyai.co — base + 5 conversion events")
**Strategy:** A — server-prop pattern, reuses existing `DEPLOY_TARGET`
**Scope:** minimum — gate `FloatingBrainTrigger` + `FloatingBrainChat`

---

## 1 — Pre-flight outcomes

| Check | Result | Evidence |
|---|---|---|
| C.1 branch | PASS | `git rev-parse --abbrev-ref HEAD` → `funnel-deploy-techyai` |
| C.2 layout.tsx anchors | PASS | `pixelId` at L36, `showPixel` at L37, `<RootLayout>` at L67 (all at planned positions) |
| C.3 _app.tsx anchors | PASS | `isAgencyRoute` at L30, `<FloatingBrainChat />` mount at L47, `<FloatingBrainTrigger />` mount at L48 |
| C.4 no other callers | PASS | Only `src/app/_app.tsx` imports/mounts the brain components (lines 12, 13, 47, 48) |
| C.5 `.env.funnel` | PASS | both `NEXT_PUBLIC_META_PIXEL_ID=1522597192860734` and `DEPLOY_TARGET=funnel` present |
| C.6 working tree | PASS — **clean** | Only `CHATBOT_REMOVAL_DIAGNOSTIC.md` and `CHATBOT_REMOVAL_PLAN.md` untracked. The Meta Pixel install diff had been committed by the operator (commit `d8d2157`) between Phase 2 and Phase 3, so no scope conflict to resolve. |

All 6 pre-flights green. Proceeded to edits.

---

## 2 — Diff applied

```
 src/app/_app.tsx   | 8 +++++---
 src/app/layout.tsx | 3 ++-
 2 files changed, 7 insertions(+), 4 deletions(-)
```

### `src/app/layout.tsx`

```diff
@@ -35,6 +35,7 @@ export default function Layout({
   // Facebook hosts are contacted.
   const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
   const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;
+  const isFunnelDeploy = process.env.DEPLOY_TARGET === 'funnel';

   return (
@@ -64,7 +65,7 @@ fbq('track', 'PageView');
       <body className={`${inter.variable} ${playfair.variable} ${dmSans.variable} ${inter.className}`}>
         <StateProvider>
           <Providers>
-            <RootLayout>
+            <RootLayout isFunnelDeploy={isFunnelDeploy}>
               <FlagProviderClient>
                 {showPixel && <MetaPixelTracker />}
                 {children}
```

### `src/app/_app.tsx`

```diff
@@ -21,9 +21,11 @@ const QaOverlay = dynamic(() => import('@/components/qa/QaOverlay'), { ssr: fals
  * to prevent React reconciliation errors from crashing the application.
  */
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
@@ -44,8 +46,8 @@ export default function RootLayout({
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
```

No other files touched. `FloatingBrainTrigger.tsx`, `FloatingBrainChat.tsx`, `GlobalBrainContext.tsx`, `ScreenContextService.ts` left as-is.

---

## 3 — Verification

### 3.1 — D.1 funnel mode (DEPLOY_TARGET=funnel, server on port 3002)

Command: `DEPLOY_TARGET=funnel NEXT_PUBLIC_META_PIXEL_ID=1522597192860734 npm run dev` (landed on :3002 because :3000 and :3001 were taken).

```
HTTP probe of /:        HTTP 200, 178036 B
FloatingBrainTrigger:                 0 hits
from-blue-500 to-purple-500:          0 hits
h-16 w-16 rounded-full:               0 hits
1522597192860734 (pixel ID):          2 hits   ← Meta Pixel still rendering
meta-pixel-base:                      1 hit    ← Meta Pixel script tag still rendering

DOM probe via browse:
  hasBubble              false
  hasGradient            false
  hasMessageSquareIcon   false
  fixedBottomRight       false
  metaPixelPresent       true
```

PASS — widget gone, pixel preserved.

### 3.2 — D.2 Trendzo simulation (no DEPLOY_TARGET, fresh server on :3002 after killing the funnel one)

Command: `npm run dev`. Landed on :3002 again (:3000 and :3001 still occupied by your other servers).

```
HTTP probe of /:        HTTP 200, 177612 B
h-16 w-16 rounded-full:               1 hit    ← widget visible
from-blue-500 to-purple-500:          1 hit    ← widget visible
1522597192860734 (pixel ID):          0 hits   ← pixel correctly suppressed
meta-pixel-base:                      0 hits   ← pixel correctly suppressed
```

PASS — widget still rendered on Trendzo, pixel correctly suppressed.

Note on `/admin`: the plan documented falling back to `/` if `/admin` redirected to login under the middleware's auth gate. `/` was sufficient; `/admin` was not probed in this run.

Note on the `:3000` server (PID `18624`): you had a separate CleanCopy dev server running there from before Phase 3. Probing it gave the same Trendzo signature (widget present, no pixel), which is consistent with it running on this branch without `DEPLOY_TARGET` and without `NEXT_PUBLIC_META_PIXEL_ID`. Not relied on for verification — used the fresh :3002 Trendzo-sim instead so the test environment was unambiguous.

### 3.3 — D.3 `/agency` regression (no widget on either deploy)

**Funnel mode** (DEPLOY_TARGET=funnel, :3002 first run):
```
curl http://localhost:3002/agency  →  HTTP 404, body size 0
```
Middleware short-circuited before any layout rendered. No body means no widget can render.

**Trendzo simulation** (no DEPLOY_TARGET, :3002 second run):
```
curl http://localhost:3002/agency  →  HTTP 404, body size 9677 B
```
This time the response carries a full 404 page rendered through `app/layout.tsx` (`app-root` mention present in the body). Widget signature on that page:
```
h-16 w-16 rounded-full:               0 hits
from-blue-500 to-purple-500:          0 hits
```
The existing `!isAgencyRoute` exclusion correctly hides the widget on the `/agency` 404 page — proves the regression case is closed.

**Static-code regression check** (plan §D.3 fallback):
```
src/app/_app.tsx:32:  const isAgencyRoute = (pathname || '').startsWith('/agency')
src/app/_app.tsx:49:          {!isAgencyRoute && !isFunnelDeploy && <FloatingBrainChat />}
src/app/_app.tsx:50:          {!isAgencyRoute && !isFunnelDeploy && <FloatingBrainTrigger />}
```
`!isAgencyRoute` is preserved on both mounts, just combined with `!isFunnelDeploy`. The `/agency` exclusion contract is unchanged.

PASS — `/agency` continues to suppress the widget on both deploys.

### 3.4 — Side note on a verification false alarm

The first D.1 attempt probed `http://localhost:3000/` instead of `:3002` because the dev server had been pushed to :3002 by port collisions and I missed the warning in the dev log. That probe returned the brain-widget signature with no Meta Pixel — a confusing combination that initially read like a code regression. Once redirected to the correct port (`:3002`), the same probe came back clean (widget gone, pixel present). Listed here for honesty; no code change needed.

---

## 4 — Files NOT touched (confirmed by `git status --short`)

```
$ git status --short
 M src/app/_app.tsx           ← gate added
 M src/app/layout.tsx         ← prop derived + passed
?? CHATBOT_REMOVAL_DIAGNOSTIC.md
?? CHATBOT_REMOVAL_PLAN.md
?? CHATBOT_REMOVAL_RESULTS.md
```

No edits to:
- `src/components/admin/FloatingBrainTrigger.tsx`
- `src/components/admin/FloatingBrainChat.tsx`
- `src/contexts/GlobalBrainContext.tsx`
- `src/lib/services/ScreenContextService.ts`
- `src/components/admin/BrainQuickAccess.tsx`

---

## 5 — Post-deploy spot check (for the operator)

After `git push` to `funnel-deploy-techyai` and Vercel rebuild lands on techyai.co:

1. **Open `https://techyai.co/`** in a private/incognito window.
2. **Confirm the blue circular bubble in the bottom-right is gone.**
3. **Open DevTools → Elements** and search for `from-blue-500` or `h-16 w-16 rounded-full`. Expect zero matches in the live DOM.
4. **Spot-check a Trendzo non-`/agency` admin route** (e.g. `/admin/operations/training`) after authenticating, to confirm the bubble is still present there. The default-`false` prop preserves existing Trendzo behaviour, so this should be unchanged from before the deploy.

If the bubble persists on techyai.co after the deploy lands, check that `DEPLOY_TARGET=funnel` is still set on the techyai.co Vercel project. The whole gate hinges on that one env var.

---

## 6 — Stop point

Phase 3 implementation + verification complete. Proceeding to commit + push per your authorization with the specified message.
