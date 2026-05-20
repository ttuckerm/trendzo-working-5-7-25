# Chatbot Removal — Phase 1 Diagnostic

**Date:** 2026-05-20
**Branch:** `funnel-deploy-techyai` (working tree has uncommitted Meta Pixel install + the new analysis files; this diagnostic is read-only)
**Mode:** Investigation only. No source files modified. No implementation proposed.

---

## 1 — Identity of the widget

**It is not a third-party widget.** It is an internal Trendzo component.

Search across `src/**` for known widget signatures (Intercom, Crisp, Drift, Tawk.to, HubSpot, Zendesk, LiveChat, Olark, Freshchat, Help Scout Beacon) returns **zero matches**:

```
grep -i -lE "intercom\.io|widget\.intercom|client\.crisp\.chat|\$crisp|js\.driftt\.com|drift\.load|embed\.tawk\.to|Tawk_API|js\.hs-scripts\.com|hubspot|static\.zdassets|zopim|cdn\.livechatinc|static\.olark|olark\(|wchat\.freshchat|beacon-v2\.helpscout" src/
→ (no files)
```

The blue circular bottom-right bubble is `FloatingBrainTrigger`, an internal "AI Brain" component intended for Trendzo admin operators.

Visual fingerprint match — `src/components/admin/FloatingBrainTrigger.tsx:13-21`:

```tsx
<div className="fixed bottom-6 right-6 z-40 group">
  <Button
    onClick={toggleChat}
    size="lg"
    className="h-16 w-16 rounded-full shadow-lg transition-all duration-300 hover:scale-110
               bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-xl
               flex items-center justify-center"
  >
    <MessageSquare className="h-8 w-8 text-white" />
  </Button>
</div>
```

That's a 64×64 px fixed-position round button at `bottom: 24px, right: 24px`, blue-to-purple gradient (Tailwind `from-blue-500 to-purple-500`), with a `MessageSquare` (chat bubble) lucide icon in white. Exact match for the reported widget.

When clicked it opens `FloatingBrainChat`, an "AI Brain ✨" panel that, per the in-panel copy (`FloatingBrainChat.tsx:131-138`), is designed for:
> Pipeline operations · Data analysis · System management · Context-aware assistance

— i.e. operator tooling, not a customer-facing chat.

---

## 2 — Every file that loads / configures / renders the widget

| File | Role | Lines |
|---|---|---|
| `src/app/_app.tsx` | **Top-level mount.** Imports both components and renders them globally for non-`/agency` routes. | imports 11-13; render 47-48; `GlobalBrainProvider` wraps tree 43, 51 |
| `src/components/admin/FloatingBrainTrigger.tsx` | The visible blue bubble. Calls `toggleChat()` from `useGlobalBrain()`. | entire 23-line file |
| `src/components/admin/FloatingBrainChat.tsx` | The expandable chat panel that opens when the bubble is clicked. Mounts always (returns `null` when `isOpen === false`). | entire 254-line file |
| `src/contexts/GlobalBrainContext.tsx` | React context + provider exposing `{ messages, isOpen, sendMessage, toggleChat, … }`. | entire file; provider mounted in `_app.tsx:43` |
| `src/features/Brain/useBrain.ts` | Underlying chat hook consumed by `GlobalBrainProvider` (imported at `GlobalBrainContext.tsx:4`). | not read for this diagnostic; out of scope for removal |
| `src/lib/services/ScreenContextService.ts` | Auto-captures route, page name, visible data, and active elements from the DOM whenever `FloatingBrainChat` mounts. | `FloatingBrainChat.tsx:39-56` instantiates it via `ScreenContextService.getInstance().startAutoCapture()` |
| `src/components/admin/BrainQuickAccess.tsx` | Also consumes `useGlobalBrain()`. **Defined but never imported** (`grep BrainQuickAccess src/` finds only the definition). Dead code; not relevant to removal. | — |

No env vars currently gate the widget. No script tags, no third-party assets, no CDN. Everything is React/TypeScript inside this repo.

---

## 3 — Loaded globally or per-route?

**Globally.** It is mounted in `src/app/_app.tsx` (which is rendered inside `src/app/layout.tsx` via `<RootLayout>`), so every route inherits it.

The only existing exclusion (`_app.tsx:29, 47-48`):

```tsx
const isAgencyRoute = (pathname || '').startsWith('/agency')
…
{!isAgencyRoute && <FloatingBrainChat />}
{!isAgencyRoute && <FloatingBrainTrigger />}
```

Pathname check via `usePathname()` (client-side). Applied to:
- ✅ `/agency/*` — widget hidden (this is why operators on the agency surface don't see it)
- ❌ everything else — widget visible

Funnel routes (`/`, `/welcome`, `/free/freedom-os`, `/assessment/[id]`) do not start with `/agency`, so the widget renders on all of them.

The `GlobalBrainProvider` itself wraps every route unconditionally (`_app.tsx:43`). Even on `/agency` routes where the trigger/chat are not rendered, the provider's state machinery still mounts.

---

## 4 — Effect of removal on non-funnel surfaces (Trendzo deploy)

The widget is in use on the Trendzo deploy. Specifically:

- It is intentionally hidden on `/agency/*` (per the existing exclusion).
- It is intentionally visible on `/admin/*`, `/dashboard/*`, `/chairman/*`, `/creator/*`, and any other operator-facing surface — these all live on the Trendzo deploy.
- The "AI Brain" copy ("Pipeline operations / Data analysis / System management") describes the Trendzo operator experience, not the techyai.co funnel.

**Implication:** an unconditional removal in `_app.tsx` would also strip the widget from Trendzo's admin surfaces, which is presumably not what you want. Removal must be gated.

Two viable gating strategies (decision deferred to Phase 2):

### Strategy A — Server-prop pattern (consistent with Meta Pixel install)

`src/app/layout.tsx` already reads `process.env.DEPLOY_TARGET` server-side (used for the pixel gate). Add a second derived flag and pass it down through to `_app.tsx`. The pixel install set the precedent at `src/app/layout.tsx:31-34`:

```ts
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;
```

Same pattern for the brain widget:

```ts
const isFunnelDeploy = process.env.DEPLOY_TARGET === 'funnel';
```

Then thread `isFunnelDeploy` into `<RootLayout>` (which is `_app.tsx`) as a new prop, and combine it with the existing `isAgencyRoute` check inside `_app.tsx`.

- Pros: server-only env stays server-only. No new public env var. Consistent with the pixel pattern.
- Cons: `_app.tsx` gains a new prop; `app/layout.tsx` has to pass it. Two file edits.

### Strategy B — Promote `DEPLOY_TARGET` to a client-readable env var

Add `NEXT_PUBLIC_DEPLOY_TARGET=funnel` to the techyai.co Vercel project. Read it directly in `_app.tsx`:

```ts
const isFunnelDeploy = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'funnel';
```

- Pros: one file edit (`_app.tsx`). No layout plumbing.
- Cons: introduces a new public env var that has to be kept in sync with the existing server-only `DEPLOY_TARGET`. Two sources of truth for the same deploy mode.

I do not recommend a `NEXT_PUBLIC_DEPLOY_TARGET` because it duplicates state; Strategy A reuses the existing variable. But the call is yours in Phase 2.

---

## 5 — Files to modify (under Strategy A — the recommended path)

**Two files. No deletes.**

### 5.1 — `src/app/layout.tsx` (modify)

Derive `isFunnelDeploy` next to the existing pixel-gate logic at lines 31-34. Pass it to `<RootLayout>` as a new prop.

Diff intent:

```tsx
   const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
   const showPixel = process.env.DEPLOY_TARGET === 'funnel' && !!pixelId;
+  const isFunnelDeploy = process.env.DEPLOY_TARGET === 'funnel';
   …
         <StateProvider>
           <Providers>
-            <RootLayout>
+            <RootLayout isFunnelDeploy={isFunnelDeploy}>
               <FlagProviderClient>
```

### 5.2 — `src/app/_app.tsx` (modify)

Accept the new prop, combine it with the existing `isAgencyRoute` exclusion.

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
   …
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

`isFunnelDeploy` has a default of `false`, so the Trendzo deploy (where no prop is passed because `DEPLOY_TARGET` is unset) keeps existing behaviour: widget visible everywhere except `/agency/*`.

### Files **NOT** modified

| File | Why kept untouched |
|---|---|
| `src/components/admin/FloatingBrainTrigger.tsx` | Still needed by Trendzo. No funnel surface should reach it after the gate, so no internal changes required. |
| `src/components/admin/FloatingBrainChat.tsx` | Same. |
| `src/contexts/GlobalBrainContext.tsx` | The provider still wraps the whole tree on both deploys; the unused state machinery on funnel costs roughly nothing because no consumer mounts. Optionally, Phase 2 could decide to also skip `<GlobalBrainProvider>` itself when `isFunnelDeploy` is true — a small bundle-weight win and a small extra safety net (no `ScreenContextService` static reference reachable from the funnel bundle), but not required to make the widget invisible. |
| `src/lib/services/ScreenContextService.ts` | Only ever instantiated inside `FloatingBrainChat.tsx`'s `useEffect`. With the chat unmounted on funnel, it is never invoked. |
| `src/components/admin/BrainQuickAccess.tsx` | Dead code (not imported anywhere). Leave alone — separate cleanup if desired. |

---

## 6 — Side-channel concern (not in scope, flagging it)

`FloatingBrainChat.tsx:39-56` instantiates `ScreenContextService.getInstance().startAutoCapture()` inside a `useEffect` that runs **only when the chat panel is open** (`FloatingBrainChat` returns `null` while `isOpen === false`). So the auto-capture is not currently scraping funnel pages — it only fires if a visitor clicks the bubble and opens the panel.

That said, the bubble being visible is enough: a curious visitor who clicks it would trigger DOM auto-capture (`route`, `pageName`, `visibleData`, `activeElements`) on a funnel page and then either see the chat work against the Trendzo Brain backend (cross-deploy leakage if the API is reachable from techyai.co) or see an error. Neither is acceptable on a customer-facing surface.

Removing the trigger removes that risk. No additional work needed for this specific concern — the gate in §5 closes the loop.

---

## 7 — Stop and report

Phase 1 complete. No files modified. Awaiting your Phase 2 decision:

1. Strategy A (server-prop) or Strategy B (`NEXT_PUBLIC_DEPLOY_TARGET`)?
2. Scope: minimum (gate trigger + chat) only, or also skip `<GlobalBrainProvider>` on the funnel deploy?

Once those are answered, I will produce a Phase 2 plan with exact code blocks and pre-flight checks. No implementation yet.
