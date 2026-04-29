# OB-1 Dashboard Parity Investigation

Date: 2026-04-29
Scope: read-only audit; gather everything needed to draft the build prompt that adds Invite UI to the Dashboard
Reference: OB-1 already shipped in Clay — this fills the Dashboard side per the parity rule

---

## T1 — Dashboard layout

- **Page entry:** `src/app/agency/dashboard/page.tsx` (73 lines). Server component. Resolves session + `agencyId` via `createServerSupabaseClient` + `getUserAgencyId`, then runs three queries (`getAgencyStats`, `getAgencyCreatorsList`, `getAgencyBriefs`) in parallel and passes results into the client.
- **Main client component:** `src/app/agency/dashboard/DashboardClient.tsx` (1,079 lines). All state, all mutations, all rendering.
- **Component dir:** `src/app/agency/dashboard/components/` — 10 files. Notable: `tokens.ts` (design system), `IconSidebar.tsx` (left rail), `AccuracyView.tsx`, `MomentumView.tsx`, `RankView.tsx`, `RevenueView.tsx`, `TrendsView.tsx`, `DimensionButtons.tsx`, `ScheduleStrip.tsx`, `ClayPanel.tsx`.
- **Layout pattern (lines 396-468):** flex full-screen, left `IconSidebar` (visited via `<AgencyDashboardHeader>`), right side a single scrollable `<main>` with stacked sections. Top: WORKSPACE header + StatCounters. Then 5 dimension buttons (`DimensionButtons`). Then a single rendered `{activeDimension === 'momentum' && ...}` block (and parallel blocks for accuracy/rank/revenue/trends).

```tsx
// dashboard/DashboardClient.tsx:436-465 (layout backbone)
<main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
  <div className="max-w-[1440px] mx-auto space-y-6">
    {/* WORKSPACE header + stats */}
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="flex items-center gap-4" style={{ animation: 'neuFadeUp 0.5s ease both' }}>
        <h1 className="text-5xl ... font-display font-black tracking-tighter" style={{ color: T.textPrimary }}>
          WORKSPACE
        </h1>
        <Link href="/agency" ...> + New Brief </Link>
      </div>
      ...
    </div>
    <DimensionButtons active={activeDimension} onChange={setActiveDimension} />
    {activeDimension === 'momentum' && ( <div className="space-y-6"> ... </div> )}
    {activeDimension === 'accuracy' && ...}
```

---

## T2 — Closest "create new entity from a small form" analog

**There is NO modal/slide-out create form anywhere in the Dashboard.** Every mutation in DashboardClient.tsx is an **inline expanding form** triggered by a button on a row. No `Dialog`, no shadcn `<Modal>`, no `react-modal`.

Closest analog: the "Mark Published" inline form (lines 765-800). Pattern:

- A button toggles row-scoped state (`publishingId`, `publishedUrlInput`).
- When `publishingId === b.id`, the row swaps the button for a vertical flex with one input + Confirm/Cancel buttons.
- Confirm calls a `useCallback` handler that fetches an API route, updates local state on success, clears the editing state.
- No success toast — just the local state change. No error toast either — errors go to `console.error`.

Reference handler (lines 226-251):

```tsx
const handleCompletionUpdate = useCallback(async (
  briefId: string,
  status: 'acknowledged' | 'in_production' | 'published',
  publishedUrl?: string,
) => {
  const rawId = briefId.startsWith('cb-') ? briefId.slice(3) : briefId;
  setActionLoading(briefId);
  try {
    const res = await fetch('/api/brief-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId: rawId, status, publishedUrl }),
    });
    const data = await res.json();
    if (data.success) {
      setBriefs(prev => prev.map(b => b.id === briefId
        ? { ...b, completionStatus: status, publishedUrl: publishedUrl || b.publishedUrl }
        : b,
      ));
    } else {
      console.error('Status update failed:', data.error);
    }
  } catch { console.error('Status update failed'); }
  setActionLoading(null);
}, []);
```

Refresh: optimistic local-state mutation via `setBriefs(prev => prev.map(...))`. No re-fetch. No toast. The "+ New Brief" button at line 445 is a `<Link href="/agency">` — it punts the user to Clay; it is NOT a Dashboard form. So the Dashboard has never built a true "create entity" form before.

**RECOMMENDATION:** mirror the inline expanding-form pattern. A small "Invite Creator" panel at the top of (or beside) the Recent Invites list, with two inputs (email + name) and Send/Cancel buttons. No modal — modals don't exist in this codebase.

---

## T3 — Closest list-with-status-column analog

The brief list inside the momentum dimension (DashboardClient.tsx ~lines 700-900) is the closest analog. Each brief row has a status badge derived from `COMPLETION_STATUS` (lines 43-48 of DashboardClient.tsx):

```tsx
const COMPLETION_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  delivered:     { bg: '#6B6D6D', fg: '#ffffff', label: 'Delivered' },
  acknowledged:  { bg: '#6C92A0', fg: '#ffffff', label: 'Acknowledged' },
  in_production: { bg: T.amber,   fg: '#1a1a1a', label: 'In Production' },
  published:     { bg: '#4A8C6A', fg: '#ffffff', label: 'Published' },
};
```

Data source: `getAgencyBriefs(agencyId)` from `@/lib/dashboard/queries` — called server-side in `page.tsx` and passed in as `briefs` prop. No client-side fetch on mount; no auto-refresh; no pagination. Optimistic local updates only.

**RECOMMENDATION for the Recent Invites list:** mirror the same approach.
- Add `getAgencyInvites(agencyId)` to `src/lib/dashboard/queries.ts` (server-side query of `agency_invites` ordered by `invited_at DESC`, hard limit 50).
- Pass result through `page.tsx` → `DashboardClient`.
- Render a status badge using a parallel constant `INVITE_STATUS: Record<'pending'|'sent'|'accepted'|'declined'|'expired'|'failed', {bg, fg, label}>`.
- After a successful invite send, prepend the new row to local state (mirroring how `setBriefs` is used today). No re-fetch.

---

## T4 — API surface for the invite write

- `sendInvite()` in `src/lib/clay/action-handler.ts:699-772` is **internal** — not exported, no HTTP route wrapping it. Its signature: `async function sendInvite(db: DB, payload: Record<string, unknown>, context: ActionContext): Promise<ActionResult>`. It expects `payload.creatorEmail` + `payload.creatorName` and `context.agencyId` + `context.userId`. It does the upsert, calls `sendCreatorInvite(inviteRow.id)`, emits `invite.sent`/`invite.failed`, returns `ActionResult`.
- `sendCreatorInvite()` in `src/lib/email/send-invite.ts:76` IS exported. Signature: `async function sendCreatorInvite(inviteId: string): Promise<SendInviteResult>`. It re-reads the invite row, sends the email, updates `status` to `sent`/`failed`. It does NOT emit audit events (the handler in action-handler.ts emits them).
- **`/api/invites/route.ts` exists** (PF7 found it) but it's a different system — see UNEXPECTED FINDINGS below. Cannot reuse.

So the Dashboard has three options for getting OB-1 functionality:

| Option | Cost | Pros | Cons |
|---|---|---|---|
| (a) Reuse existing route | impossible | — | `/api/invites` writes to a different table (`invite`, not `agency_invites`), uses different schema, has no auth. Reusing it would re-introduce the silent-stub bug it has, and bypass the audit emits. |
| (b) New thin POST `/api/invites/send` route that wraps the OB-1 logic | small | Clean separation, mirrors `/api/brief-status` pattern exactly, gives the Dashboard a stable HTTP surface, easy to test independently | One new file (~80-100 lines). Need to extract the upsert+send+emit logic into a shared lib helper OR duplicate it carefully. |
| (c) Server action calling `sendCreatorInvite` directly | smallest | No HTTP route at all; co-located with the form | Server actions in this codebase are not used for any other write — would be a new pattern. Auth boundary becomes implicit, harder to test in isolation. Inconsistent with `/api/brief-status` and `/api/brief-performance` precedent. |

**RECOMMENDATION (b):** new POST `/api/invites/send` route. Inside it: do session auth + agency scope (mirroring `/api/brief-status:138-154`), then run the same three steps `sendInvite()` does (upsert → call `sendCreatorInvite` → emit `invite.sent`/`invite.failed`). To avoid duplicating that block, extract it into a new helper `sendInviteFor({agencyId, userId, email, name})` in `src/lib/email/send-invite.ts` (or a new `src/lib/agency/invites.ts`) and have BOTH `action-handler.ts:sendInvite` AND the new route call it. That gives one source of truth and matches the parity rule's spirit.

---

## T5 — Read API for the Recent Invites list

- No existing API route returns rows from `agency_invites`. `/api/invites/route.ts` GET reads from the wrong table (`invite`).
- `agency-chat/route.ts:502` reads `agency_invites` (now correctly, after the OB-1 fix), but only as part of the AI context-assembly bundle — it's not a clean JSON endpoint the Dashboard could call.

**RECOMMENDATION:** put the read on the SERVER side, not behind a fetch. Add `getAgencyInvites(agencyId: string)` to `src/lib/dashboard/queries.ts`, call it in `page.tsx` alongside `getAgencyStats/Creators/Briefs`, and pass `invites` as a prop to `DashboardClient`. No new HTTP GET route is needed. After a successful invite-send, the new row gets prepended client-side from the POST response (no re-fetch).

Columns to select: `id, creator_email, creator_name, status, invited_at, sent_at, accepted_at, error_message`. Order by `invited_at DESC`. Limit 50.

---

## T6 — Auth pattern for Dashboard mutations

Reference: `src/app/api/brief-status/route.ts:138-154` (the canonical pattern, applied during AM Step 2 hardening on 2026-04-24):

```ts
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ success: false, error: 'Missing Supabase config' }, { status: 500 })
  }

  // ── Session auth ─────────────────────────────────────────────────────────
  const authSupabase = await createServerSupabaseClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  }

  // ── Agency membership ────────────────────────────────────────────────────
  const operatorAgencyId = await getUserAgencyId(user.id)
  if (!operatorAgencyId) {
    return NextResponse.json({ success: false, error: 'Operator not assigned to an agency' }, { status: 403 })
  }
  // ... body parsing, ownership check, mutation, audit emit
}
```

Audit emit pattern at `brief-status/route.ts:222-235` uses `emitEvent` (fire-and-forget) with `actorId: user.id`, `actorType: 'user'`, `agencyId: operatorAgencyId`. The new invite POST route must mirror this exactly. Per OB-1, it should emit `invite.sent` (success) or `invite.failed` (transport failure) — same event names the Clay path uses, so observability stays unified.

---

## T7 — Style/component conventions

**No UI library.** No shadcn, no Radix, no Headless UI imported anywhere in `dashboard/`. Pure Tailwind utility classes plus inline `style={{...}}` references to the `T` token object from `tokens.ts`. The visual identity is "neumorphic dark" — heavy use of `boxShadow: T.raisedSm/inset/raisedLg`, `background: T.bg/bgGlass/bgCard`, `border: 1px solid ${T.border}`.

**Tokens reference (`dashboard/components/tokens.ts:1-36`):**

```ts
export const T = {
  bg: '#1c1c24', bgCard: '#0f0f16', bgGlass: 'rgba(15, 15, 22, 0.6)',
  border: '#1e1e2e',
  accent: '#f04a4d', cyan: '#00d4ff', green: '#2dd4a8', amber: '#f4b942',
  textPrimary: '#e8e8f0', textSecondary: '#8888a0', textDim: '#55556a',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  inset: 'inset -3px -3px 8px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
} as const;
```

**One button (`DashboardClient.tsx:733-738`, "Approve" — green-tinted action button):**
```tsx
<button
  onClick={() => handleApproveBrief(b.id, 'A')}
  disabled={actionLoading === b.id}
  className="text-[10px] font-mono font-bold uppercase tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200"
  style={{ background: `${T.green}18`, color: T.green, border: `1px solid ${T.green}30`, cursor: 'pointer', opacity: actionLoading === b.id ? 0.5 : 1 }}
>Approve</button>
```

**One input (`DashboardClient.tsx:710-716`, the inline Reject reason input):**
```tsx
<input
  value={rejectReason}
  onChange={e => setRejectReason(e.target.value)}
  placeholder="Reason (optional)"
  className="text-[10px] px-2 py-1 rounded border bg-transparent text-[#c0c0d0]"
  style={{ borderColor: T.border, width: 160 }}
/>
```

**One badge (`DashboardClient.tsx:478-480`, "N Creators" pill):**
```tsx
<span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${T.cyan}15`, color: T.cyan }}>
  {creators.length} Creators
</span>
```

The new invite UI should match these three primitives verbatim — no new design system, no library imports, just `T` tokens + Tailwind utility classes.

---

## T8 — Routing decision

**RECOMMENDATION: option (a) — new top-level section on `/agency/dashboard`, placed inside the existing `momentum` dimension below the Briefs list.** Reasoning:

1. The Dashboard is a single-page surface today. Every existing capability (briefs, creators, alerts, performance) lives on this one page; users do not navigate sub-routes. Adding `/agency/dashboard/invites` would be the only sub-route in the entire dashboard tree and would feel orphaned.
2. There are no tabs in the existing layout to slot into — `DimensionButtons` toggles between five analytics views (momentum/accuracy/rank/revenue/trends), none of which are "operational management" containers. Invites belong with the operational primitives (briefs, creators) which all live in `momentum`, not with the analytics dimensions.
3. The Dashboard has no modal infrastructure (T2 finding). Building one just for invites is over-investing for a two-input form.

**Concrete placement:** add a new `<section>` block inside the `{activeDimension === 'momentum' && (...)}` branch (DashboardClient.tsx ~line 471), positioned AFTER the Briefs section and BEFORE Coaching/Alerts. Two-pane layout in that section: left ~40% an "Invite Creator" inline form (matching T2's expanding-form style; always-visible since it's a top-level section, not a row action), right ~60% a "Recent Invites" list with status badges (T3 pattern).

The chairman makes the final call. If they prefer modal-style or sub-route, the build prompt can pivot — but option (a) is the lowest-friction, highest-consistency choice given the existing codebase.

---

## UNEXPECTED FINDINGS

1. **`/api/invites/route.ts` is a parallel/abandoned invite system.** Discovered during T4. It writes to a table called `invite` (singular, no agency_id, uses `tenant_id` text), generates an HMAC-style token, and inserts into a separate `email_queue` table instead of actually sending email. It runs `ensureInviteTables(db)` at request time using `exec_sql` — implying the table may not even exist in production. **Critically: it has NO auth check** (no session resolve, no agency scoping, no role check). Anyone who can hit the route can create rows. Companion `/api/invites/accept/route.ts` (21 lines) accepts a token and updates `accepted_at` — also unauthenticated. The OB-1 work in `agency_invites` is the canonical invite system; `/api/invites/*` should not be reused, and arguably should be deleted in a follow-up to remove the dead/insecure surface. Flag for the chairman: this looks like a leftover from an earlier auth/onboarding experiment that never got removed.

2. **There is a hardcoded agency_id in DashboardClient.tsx.** Line 165: `const AGENCY_ID = '62cb020e-5303-452e-8cf2-83368c912b6e';` — the same UUID I used in the SQL sanity-check block earlier. This means the dashboard is currently single-tenant in client code, even though `page.tsx` correctly resolves `agencyId` server-side and gates access. Out of scope for OB-1 parity but worth noting — the new invite POST route MUST take the agency from the server session (per T6), not from this hardcoded client constant.

3. **No client-side data refresh anywhere.** All data flows server → page.tsx → DashboardClient props once at mount. After mutations, only optimistic local-state updates; no re-fetch, no SWR/React Query. The Recent Invites list will follow the same pattern: prepend on success, no polling. If the chairman wants live status updates (e.g. when a creator clicks the email link and the row flips to `accepted`), that's a separate enhancement requiring either a manual refresh button or a real-time subscription — neither exists in the dashboard today.
