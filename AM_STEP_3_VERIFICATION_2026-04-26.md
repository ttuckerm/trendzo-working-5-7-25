# AM Step 3 — Verification (2026-04-26)

Branch: `vercel-deploy-test`
Files changed:
- `src/app/api/agency-chat/route.ts` — new `get_unacknowledged_briefs` tool + system-prompt update
- `src/app/agency/dashboard/DashboardClient.tsx` — new "Delivered" filter pill + Generation/Delivery row labels

Commit not pushed, not deployed. Operator runs the tests below in the local dev environment and pastes results.

---

## Pre-flight summary (already done before build)

- **PF1 — agency-chat tool slot location:** ✅ `getBriefsByStatus` at `route.ts:1695`, registered in `extraReadTools` at `route.ts:1757`, `streamText({ ... tools, ... })` at `route.ts:1762`. Structure matched the parity-investigation doc.
- **PF2 — DashboardClient pill pattern:** ✅ Pills keyed on legacy `status` column (state at line 169, render at line 620, counts at lines 382-388). `AgencyBrief.completionStatus` already exists (`queries.ts:79`); reused — no new field, no new query.
- **PF3 — fragile mapping line:** ✅ Found at `route.ts:1597`. Updated in this build (see Step A).
- **PF4 — `delivered` is the largest non-null bucket:**
  ```
  acknowledged   1
  delivered      15
  in_production  1
  published      3
  ```
  No null `completion_status` rows. Healthy state to build on.

---

## Cosmetic split decision (Step C)

**Option 1 (inline labels) chosen.** The existing pill row is a single horizontal flex bar with `overflow-x-auto`. Adding a second row below would have meant restructuring the parent flex container and the surrounding header (which includes the section title, brief-count badge, and Generate button on the same row). Inline `Generation:` / `Delivery:` text labels in the muted token color (`T.textDim`) keep the existing visual rhythm with the smallest possible DOM change — two `<span>` siblings, no layout restructure.

---

## Test 1 — Tool registration smoke check (code-level)

Cursor-side inspection performed. Expected lines (verbatim):

`src/app/api/agency-chat/route.ts` — `extraReadTools` block (around line 1757):

```ts
extraReadTools: {
  get_briefs_by_status: getBriefsByStatus,
  get_performance_summary: getPerformanceSummary,
  get_unacknowledged_briefs: getUnacknowledgedBriefs,
},
```

The `getUnacknowledgedBriefs` tool definition is added immediately above `getPerformanceSummary` and:

- has its own zod schema `unacknowledgedSchema` with optional `limit` (1-100, default 50)
- carries the description: *"Returns briefs that have been delivered to creators but not yet acknowledged. Use when the operator asks about unacknowledged briefs, briefs awaiting acknowledgment, what's waiting, or who hasn't responded yet."*
- internally calls `/api/brief-status?status=delivered` with the operator's cookie (same auth pattern `getBriefsByStatus` uses; AM Step 2 already gates that endpoint by session + agency)
- returns the same shape as `get_briefs_by_status` plus a server-computed `days_since_created: number | null` on each row
- caps results at `limit` (default 50, max 100)

System-prompt update at `route.ts:1597`: the old line that mapped *"show delivered" / "what's waiting"* to `get_briefs_by_status` has been rewritten to route those phrasings (plus *"unacknowledged"*, *"awaiting acknowledgment"*, *"hasn't responded yet"*) to `get_unacknowledged_briefs`. `get_briefs_by_status` is kept and explicitly redirected to *"any other status query — 'show me what's in production', 'what did Luna publish this week', a specific creator filter, or any non-delivered status"*.

**T1 PASS** — confirmed by code inspection.

---

## Test 2 — Clay end-to-end (operator runs in browser)

Open Clay (the operator chat panel on the agency dashboard).

For each prompt below, send it as a fresh user message and confirm the model invokes `get_unacknowledged_briefs` (you can see the tool call in the server logs / network tab) and renders a Grid of `ContentBriefCard` components for delivered-but-not-acknowledged briefs:

1. `what briefs are unacknowledged?`
2. `show me what's waiting`
3. `who hasn't responded yet`
4. `show delivered`

Paste the rendered card count and the tool name(s) used for each prompt:

| Prompt | Tool called | Card count rendered |
| --- | --- | --- |
| what briefs are unacknowledged? | _operator fills_ | _operator fills_ |
| show me what's waiting | _operator fills_ | _operator fills_ |
| who hasn't responded yet | _operator fills_ | _operator fills_ |
| show delivered | _operator fills_ | _operator fills_ |

Counter-check (must still route to the old tool, not the new one):

5. `show me what's in production` → expect `get_briefs_by_status({status:'in_production'})`
6. `what did Luna publish this week` → expect `get_briefs_by_status({status:'published', creator_name:'Luna'})`

**T2 PASS criteria:** prompts 1–4 invoke `get_unacknowledged_briefs`; prompts 5–6 still invoke `get_briefs_by_status`.

---

## Test 3 — Dashboard end-to-end (operator runs in browser)

1. Open `/agency/dashboard` in the browser.
2. Scroll to the **Active Briefs** section.
3. Confirm the pill row now shows two muted labels: `Generation:` before the existing `All / Draft / In Progress / Approved / Published` pills, and `Delivery:` before the new `Delivered` pill.
4. Confirm the `Delivered` pill shows a count badge.
5. Click the `Delivered` pill. Confirm:
   - The brief list filters to rows where `completionStatus === 'delivered'`.
   - Each filtered card shows the existing "Mark Acknowledged" action button (the existing acknowledge UI is reachable from these cards — no rebuild was done; verify only).
6. Click the `Delivered` pill again. Confirm the filter clears and the pill returns to inactive state.

**T3 PASS criteria:** all six items above tick green.

Operator notes (paste anything that didn't match expectation): _operator fills_

---

## Test 4 — Parity count match (operator runs in browser SQL Editor)

Run this query (substitute the operator's agency_id):

```sql
SELECT COUNT(*) FROM content_briefs
WHERE agency_id = '<the operator's agency_id>'
  AND completion_status = 'delivered';
```

| Source | Count |
| --- | --- |
| SQL (`completion_status='delivered'` for this agency) | _operator fills_ |
| Dashboard pill count badge | _operator fills_ |
| Clay `get_unacknowledged_briefs` result count (from prompt 1) | _operator fills_ |

**T4 PASS criteria:** all three numbers match exactly. If they don't, the build is not done.

(Note: the agency's PF4 result was 15 delivered rows aggregated across all agencies. The per-agency count above will be ≤15. Whatever it is, all three sources must agree.)

---

## Parity check (mandatory per AI EMPLOYEE ARCHITECTURE.md)

- Clay: ✅ `get_unacknowledged_briefs` registered (Step A) — pending T2 confirmation
- Dashboard: ✅ "Delivered" filter pill with live count (Step B) — pending T3 confirmation
- Same backend route serves both: ✅ `/api/brief-status?status=delivered` (already shipped in AM Step 2, commit 9090b71). No new auth or RPC work in this prompt.
- Same SQL truth: ⏳ pending T4 confirmation

If T2, T3, T4 all pass when the operator fills them in, all four boxes are checked.

---

## Out of scope (per original prompt)

Untouched in this commit, by design:
- Auto-nudge cron for briefs unacknowledged > 24h (AM Step 4)
- platform_events emission audit across handlers (AM Step 5)
- `action-handler.ts:956` cross-agency leak in `generateReport()`
- `agency-chat/route.ts:869` `brief.deadline` non-existent column read
- Markdown rendering / system-prompt formatting in Clay output
- The 12 cosmetic legacy-drift rows in `(pending, delivered)` and `(failed, delivered)`
- Any creator-table consolidation
