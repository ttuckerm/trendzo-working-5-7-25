# `content_briefs.status` — Approved vs. Accepted Decision

**Date:** 2026-04-24
**Mode:** READ-ONLY investigation. No code changed. No SQL run.
**Question:** Site A writes `'approved'` (rejected by the CHECK constraint). Site B writes `'accepted'` (valid). Should we (A) fix Site A to write `'accepted'`, or (B) widen the CHECK to allow `'approved'`?

**TL;DR — Recommendation: OPTION A.** Change `src/lib/clay/action-handler.ts:640` from `'approved'` to `'accepted'`. No migration. No reader updates needed (the display layer already maps `'accepted'` → `'approved'` for the UI). Two doc strings should be updated alongside the fix to stop lying.

---

## CHECK constraint (source of truth)

`supabase/migrations/20260303_content_briefs.sql:12-16`:

```12:16:supabase/migrations/20260303_content_briefs.sql
  status          TEXT NOT NULL DEFAULT 'generated'
                  CHECK (status IN (
                    'generated', 'accepted', 'recorded', 'analyzed',
                    'optimized', 'published', 'measured'
                  )),
```

This is a **content lifecycle** column: `generated → accepted → recorded → analyzed → optimized → published → measured`. `'approved'` is not part of this lifecycle and never has been.

Note: the table also has *other* status-like columns that this investigation does **not** touch:
- `completion_status` (delivered | acknowledged | in_production | published) — operator delivery lifecycle, tightened by `20260423_drop_vps_prediction_and_tighten_completion_status.sql`.
- `delivery_status` (pending | delivered | failed) — email delivery state.

Only `content_briefs.status` is in scope.

---

## PART 1 — Confirm the broken site

### 1a. Site A — `src/lib/clay/action-handler.ts:640`

Function: **`approveContentBrief(db, briefId, context)`** at `src/lib/clay/action-handler.ts:637-654`.

```637:654:src/lib/clay/action-handler.ts
async function approveContentBrief(db: DB, briefId: string, context: ActionContext): Promise<ActionResult> {
  const { error } = await db
    .from('content_briefs')
    .update({ status: 'approved' })
    .eq('id', briefId)
  if (error) return fail(`Failed to approve brief: ${error.message}`)

  // Resolve creator name for the confirmation card.
  let creator = 'the creator'
  const { data: brief } = await db.from('content_briefs').select('user_id, brief_content').eq('id', briefId).single()
  if (brief?.user_id) {
    const { data: profile } = await db.from('onboarding_profiles').select('business_name').eq('user_id', brief.user_id).maybeSingle()
    if (profile?.business_name) creator = profile.business_name
  }
  const briefTitle = brief?.brief_content?.title || brief?.brief_content?.campaign_name || 'Untitled Brief'

  return ok('approve_brief', `Approved "${briefTitle}"`, `${creator}'s brief is cleared to publish.`, { briefId, creator })
}
```

**Caller (one level up)** — `actionHandler` dispatch in the same file:

```151:153:src/lib/clay/action-handler.ts
      case 'approve_brief': {
        return approveContentBrief(db, action.actionId, context)
      }
```

**UI trigger** — the Clay action bus. The `approve_brief` action is dispatched via window CustomEvent from agent chat / brief cards:

- `src/lib/trendzo-registry.tsx:6771-6775` — `actionHandlers.approve_brief` → `window.dispatchEvent(new CustomEvent('trendzo-action', { detail: { action: 'approve_brief', params } }))`.
- `src/lib/trendzo-registry.tsx:4671` — emitted from a brief card's approve button.
- `src/lib/agent/handler-adapters.ts:112-118` — `approveBriefAdapter` (`callHandler('approve_brief', ...)`) — the agent (Clay LLM) can also propose this action via `propose_approve_brief`.
- `src/app/api/agency-chat/route.ts:1536-1544` — agent system prompt explicitly tells the LLM to render `ActionButton(action="approve_brief", ...)` for pending briefs and to call `propose_approve_brief`.
- `src/lib/clay/intelligent-clay-registry.ts:147-158` — registry entry, `firedBy: ['ContentBriefCard', 'MorningBriefCard (action card)']`.

So Site A is invoked from: (i) a "Approve" button on `ContentBriefCard` / `MorningBriefCard` rendered in agent-chat surfaces, (ii) the Clay LLM proposing the action.

**Error swallowing?** Partially.
- The local `approveContentBrief` checks `error` and returns `fail(\`Failed to approve brief: ${error.message}\`)` — so it does NOT throw. The Postgres rejection comes back as a non-success `ActionResult` with the message `Failed to approve brief: new row for relation "content_briefs" violates check constraint "content_briefs_status_check"` (or similar).
- The outer `actionHandler` (`src/lib/clay/action-handler.ts:188-195`) wraps everything in `try/catch` and returns `{ success: false, message: ... }` on throw. Since `approveContentBrief` doesn't throw, that catch isn't what matters here — the failure is reported through the normal fail path, surfacing as a "Failed to approve brief" toast/card in the chat UI.

**Net effect:** every operator click of "Approve" via the Clay/agent surfaces produces a visible failure toast. The brief is never moved to `'approved'`. The user thinks the button is broken.

### 1b. Site B — `src/app/api/agency/brief-review/route.ts:195`

```187:225:src/app/api/agency/brief-review/route.ts
    // Create entry in content_briefs table
    const { data: contentBrief, error: insertErr } = await db
      .from('content_briefs')
      .insert({
        user_id: brief.client_id,
        agency_id: brief.agency_id, // carry agency from source pre_generated_brief
        brief_content: briefContent,
        predicted_vps: approvedVps,
        status: 'accepted', // operator-approved; surfaces in the Approved tab
      })
      .select('id')
      .single()

    if (insertErr) {
      return NextResponse.json({ error: `Failed to create content brief: ${insertErr.message}` }, { status: 500 })
    }

    // ... fire-and-forget email send ...

    return NextResponse.json({
      success: true,
      action: 'approved',
      pre_brief_id: id,
      content_brief_id: contentBrief?.id,
      variant_selected: variant_label || 'A',
    })
```

**HTTP method + route:** `PATCH /api/agency/brief-review` (the file's `PATCH` export, `body.action === 'approve'`). The action approves a row in `pre_generated_briefs` (`status='accepted'` on that table) and then **inserts a new row** into `content_briefs` with `status: 'accepted'`.

**UI trigger:** `src/app/agency/dashboard/DashboardClient.tsx:252-289` — `handleApproveBrief` → `fetch('/api/agency/brief-review', { method: 'PATCH', body: { id, action: 'approve', variant_label } })`. This is the production agency dashboard's "Approve" button on a pending pre-generated brief card.

**Does this one work?** Yes. `'accepted'` is in the CHECK constraint, the insert succeeds, and the comment on line 195 explicitly notes that this is the value that "surfaces in the Approved tab" (because the dashboard's display layer maps `'accepted'` → `'approved'`; see Bucket 3 below). There is no reason to think Site B is broken.

**Asymmetry between A and B:** Site A is an `UPDATE` of an existing `content_briefs` row (path: a brief that was already created with `status='generated'` is being moved forward by an operator). Site B is the `INSERT` of a brand-new `content_briefs` row at the moment a pre-generated brief is approved (path: `pre_generated_briefs` → new `content_briefs`). Both writes mean "this is the operator-approved state." They write the **same intended product state** with **different string values**.

---

## PART 2 — Audit of every reader of `content_briefs.status`

### Bucket 1 — Readers that expect `'accepted'`

| File:line | Code | UI surface |
|---|---|---|
| `src/app/dashboard/page.tsx:198` | `.in('status', ['generated', 'accepted'])` | Creator-facing `/dashboard` "active briefs" list (top 5). |
| `src/lib/content/calendar-refresh.ts:62-69` | `.in('status', ['accepted', 'recorded', 'analyzed', 'optimized', 'published', 'measured'])` | Cron: identifies "active users" with brief activity in last 30 days; triggers content-calendar refresh. |

These would **silently exclude** any brief that was successfully written with `'approved'`. Today they exclude none, because Site A's `'approved'` writes are all rejected by Postgres.

### Bucket 2 — Readers that expect `'approved'` on `content_briefs.status`

**None.**

Every match for the literal `'approved'` in the codebase is on a *different* table or a different concept:
- `src/app/admin/viral-approval-queue/page.tsx`, `src/app/admin/research-review/page.tsx`, `src/app/admin/cultural-events/page.tsx`, `src/lib/services/viral-prediction/cultural-timing-intelligence.ts`, `src/app/api/cron/classify-events/route.ts`, `src/app/api/cron/autodream/route.ts`, `src/app/api/admin/cultural-events/route.ts`, `src/lib/features/cultural-momentum.ts`, `src/lib/context/assemble-context.ts:216`, `src/app/api/agency/batch-briefs/route.ts:190` → all read `cultural_events.status='approved'` (different table).
- `src/lib/clay/action-handler.ts:205` → updates `pre_generated_briefs.status='approved'` (different table; this is the legacy `approveBrief` path, distinct from `approveContentBrief`).
- `src/lib/clay/action-handler.ts:347` → updates `experiments.result='approved'`.
- `src/app/admin/rewards/app-store/page.tsx`, `src/hooks/useMiniApps.ts`, `src/components/admin/dashboard/DeveloperDashboard.tsx` → mini-app approval status (different domain).
- `src/app/admin/planning/[id]/page.tsx`, `src/app/api/admin/planning/decision/route.ts`, `src/lib/planning/types.ts` → planning sessions (different domain).
- `src/components/clay/ContentBriefCard.tsx:17`, `src/components/clay/TrainerResultCard.tsx` → **local React component state only** (`useState<'pending'|'approved'|'rejected'>`), not bound to a DB query. The card flips to "Approved" optimistically after `actionId === 'approve'` is clicked; it never reads the value back from `content_briefs`.

The agent-side adapter description string `'... sets content_briefs.status = "approved"'` (`src/lib/agent/handler-adapters.ts:114`) and the registry note "`approve_brief targets content_briefs.status = "approved"`" (`src/lib/clay/intelligent-clay-registry.ts:157`) are **documentation strings**, not readers. They describe Site A's broken intent.

### Bucket 3 — Readers that treat both as equivalent, or read `status` without filtering

| File:line | Code | UI surface / behavior |
|---|---|---|
| `src/lib/dashboard/queries.ts:300-303` | `statusMap = { ..., approved: 'approved', accepted: 'approved', generated: 'in-progress', ... }` | **Critical.** `getAgencyBriefs()` projects raw `content_briefs.status` to the dashboard's display enum. **`'accepted'` and `'approved'` collapse to the same display value `'approved'`.** This is what powers the Agency Dashboard "Approved" tab and badge. |
| `src/app/agency/dashboard/DashboardClient.tsx:169, 278, 386, 620` | UI filter / counter / setBriefs uses display-side `'approved'` | The "Approved" tab filter, the count card, and optimistic local state all use the post-mapped display value. They never see the raw DB value. |
| `src/app/agency/page.tsx:36-38` | `.select('id, user_id, status').in('user_id', safeIds)` | Selects `status` for a length-only KPI count (`briefs.length` and `briefs.filter(b => b.user_id === p.user_id).length`). Status value is never inspected. |
| `src/lib/dashboard/queries.ts:117-120` | `.in('status', ['draft', 'in-progress'])` | Dead filter. Neither value is in the CHECK constraint, so this returns 0 rows — bug, but unrelated to this question. |
| `src/app/api/agency-chat/route.ts:452-454` | `.select('id, user_id, status').in('user_id', safeCreatorIds)` | Pulled into agent-chat context payload; the LLM may reference values but no code branches on them. |
| `src/app/api/agency-chat/route.ts:463-464` | `.select('*').eq('agency_id', agencyId).limit(50)` | Same as above — agent context, no code branch. |
| `src/app/api/content-calendar/route.ts:167-174` | `.select('pattern_id, status, created_at')` → `briefHistory[].status` | Passed into `generateContentCalendar()` for pattern-history scoring; no equality test on `'approved'` vs `'accepted'`. |
| `src/app/creator/page.tsx:40-44` | `.select('id, title, status, created_at, niche_key')` | Creator's own brief list rendered to UI as raw status string. No equality branch. |
| `src/app/api/quick-win/brief/route.ts:108, 129, 167` | `update({ status })` with arbitrary string from request body | Operator UI (`/admin/workflows/quick-win`) lifecycle controls; values used: `'accepted'`, `'recorded'`, `'analyzed'`, `'measured'`, `'published'`. All in CHECK. |

**Summary of Part 2:** Every place that reads `content_briefs.status` either (a) treats `'accepted'` and `'approved'` as the same UI state via `statusMap`, (b) only accepts `'accepted'` (Bucket 1), or (c) doesn't branch on the value at all. **No code anywhere distinguishes `'approved'` from `'accepted'` as a different product state.**

---

## PART 3 — Hardcoded `content_briefs.status` writes / fixtures

There are no seed scripts, test fixtures, or migrations that `INSERT INTO content_briefs ... status = ...` with a hardcoded value. All hardcoded writes live in application code:

| File:line | Hardcoded value | Notes |
|---|---|---|
| `src/lib/clay/action-handler.ts:640` | `'approved'` | **THE BUG.** UPDATE — rejected by CHECK. |
| `src/app/api/agency/brief-review/route.ts:195` | `'accepted'` | INSERT — valid. |
| `src/app/api/content-calendar/accept/route.ts:120` | `'accepted'` | INSERT (creator accepts a calendar suggestion) — valid. |
| `src/app/api/quick-win/brief/route.ts:57` | `'generated'` | INSERT (initial brief creation) — valid (matches DB default). |
| `src/app/admin/workflows/quick-win/page.tsx:404` | `'accepted'` | Calls `updateBriefStatus('accepted')` → POST to brief API → UPDATE — valid. |
| `src/app/admin/workflows/quick-win/page.tsx:417` | `'recorded'` | Same pattern — valid. |
| (Other quick-win lifecycle calls in the same file write `'analyzed'`, `'measured'`, `'published'` — all valid.) | | |
| `src/app/api/creator/concept-score/expand/route.ts:192` | (no status field) | INSERT relies on DB default `'generated'`. Valid. |

There are no fixtures or migrations that pre-load rows with `status='approved'`. The Postgres CHECK has been authoritative since 2026-03-03, so no historical row could have `'approved'` in this column.

Two **non-write** references to the literal `"approved"` in the context of `content_briefs.status` exist as documentation strings and need to be updated alongside the fix:
- `src/lib/agent/handler-adapters.ts:114` — adapter description.
- `src/lib/clay/intelligent-clay-registry.ts:157` — registry notes.

---

## PART 4 — Recommendation: **OPTION A**

**Change `src/lib/clay/action-handler.ts:640` from `status: 'approved'` to `status: 'accepted'`.**

### Why Option A and not Option B

1. **The CHECK constraint encodes a real lifecycle.** `generated → accepted → recorded → analyzed → optimized → published → measured` is a thought-out content state machine. `'approved'` doesn't fit into that lifecycle as a distinct state — it would be a synonym for `'accepted'`. Adding a synonym to the CHECK would make the column ambiguous (two values mean the same thing) and weaken the constraint's integrity guarantee.

2. **Site B is the older, established write path.** `/api/agency/brief-review` is the production agency dashboard's approval flow and has been writing `'accepted'` the whole time. The display layer is built around it.

3. **The display layer already proves operator equivalence.** `src/lib/dashboard/queries.ts:300-303` collapses **both** `'accepted'` and `'approved'` to the single display state `'approved'` for the "Approved" tab. Whoever wrote that map knew operators think of these as the same state — the disagreement is purely a *naming* disagreement at the DB level, not a *product state* disagreement.

4. **No reader meaningfully distinguishes the two.** Bucket 2 is empty (Part 2). Bucket 1 readers — `/dashboard` active-briefs list and the calendar-refresh cron — currently *exclude* the broken `'approved'` writes from their results, which is itself a latent bug that Option A fixes for free.

5. **No data exists in the wild to migrate.** Postgres has been rejecting every Site A write since the column was created (Part 3). There are zero rows with `status='approved'` in any environment. No backfill needed.

6. **Option B is more code, more risk, no benefit.** Option B requires: (a) a new migration to drop and re-add the CHECK, (b) updating Bucket 1 readers to also accept `'approved'`, (c) a long-tail audit of LLM prompts and Clay action descriptions that currently say "accepted." Net result: same observable behavior as Option A, more surface area, and a denormalized state column.

### What could break if we pick Option A

- **Nothing observable changes for users.** The Clay/agent "Approve" button currently produces an error toast — after Option A it succeeds and the brief moves to the "Approved" tab (because `statusMap` maps `'accepted'` → `'approved'`).
- The two doc strings in Bucket 2 (`handler-adapters.ts:114`, `intelligent-clay-registry.ts:157`) will become stale unless updated — they will say `"approved"` when the code writes `"accepted"`. Cosmetic only, but should be updated in the same PR to keep the agent's self-description honest. The agent's behavior does not depend on these strings (it calls the action by ID, not by description).

### What needs to change in code

| File:line | Change | Severity |
|---|---|---|
| `src/lib/clay/action-handler.ts:640` | `.update({ status: 'approved' })` → `.update({ status: 'accepted' })` | **Required.** This is the bug fix. |
| `src/lib/agent/handler-adapters.ts:114` | `description: 'Approve a generated content brief (sets content_briefs.status = "approved").'` → `... = "accepted"` | Recommended. Keeps the adapter's self-description accurate. |
| `src/lib/clay/intelligent-clay-registry.ts:157` | `notes: '... approve_brief targets content_briefs.status = "approved".'` → `... = "accepted"` | Recommended. Same reason. |

### Migration

**No SQL migration needed.** The CHECK constraint already permits `'accepted'`.

### Readers to update

**None.** Every reader either already handles `'accepted'`, treats it as equivalent to `'approved'` via `statusMap`, or doesn't branch on the value. The current Bucket 1 readers (`/dashboard` and `calendar-refresh`) will start *correctly* including operator-approved briefs as a side effect of the fix — that is the intended behavior.

### Verification after applying Option A

1. From the agency-chat surface (where `ContentBriefCard` is rendered with the `approve_brief` action), click "Approve" on a `content_briefs` row in `status='generated'`.
2. Expect: success toast, brief moves to the "Approved" tab in the agency dashboard (via `statusMap` collapse).
3. Verify in Supabase: `SELECT id, status FROM content_briefs WHERE id = <briefId>;` → `status='accepted'`.
4. Confirm the `/dashboard` active-briefs list (`src/app/dashboard/page.tsx:198`) now includes the brief.
5. Confirm `calendar-refresh` cron (next scheduled run) treats the user as active.
