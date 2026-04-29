# AM Step 3 Parity Investigation
**Date:** 2026-04-25
**Mode:** Read-only

---

## 1. Clay-side current state

### Tools available to the agent

There are exactly **two** read tools registered for the agency-chat agent today, both inline-defined in `src/app/api/agency-chat/route.ts`:

| Tool | Definition | API route called | Filters |
| --- | --- | --- | --- |
| `get_briefs_by_status` | `route.ts:1695-1716` | `GET /api/brief-status` | `status` (enum), `creator_name` (substring) |
| `get_performance_summary` | `route.ts:1719-1739` | `GET /api/brief-performance` | `period`, `creator_name` |

Registered as `extraReadTools` at `route.ts:1756-1759`. No other read tools exist for content_briefs lifecycle data.

`src/lib/agent/handler-adapters.ts` is the **write/external action** adapter file (12 propose_* tools for things like `nudge_creator`, `update_brief_status`, `log_performance`). It has zero read tools by design — comment at line 13–15 explicitly says reads should be exposed separately, not via this file.

### Can the agent answer "what briefs are unacknowledged?" today without a new tool? **YES.**

The status enum on `briefStatusSchema` (`route.ts:1679-1685`) accepts `'delivered' | 'acknowledged' | 'in_production' | 'published' | 'pending' | 'failed'`. The schema description at line 1683 maps `delivered/acknowledged/in_production/published` to the `completion_status` column.

In this codebase's lifecycle, **"unacknowledged" is encoded as `completion_status='delivered'`** — once acknowledged (via the email link or operator click), the row transitions to `completion_status='acknowledged'`. So the agent can satisfy "what's unacknowledged" with a single tool call:

```jsonc
get_briefs_by_status({ "status": "delivered" })
```

This routes to `GET /api/brief-status?status=delivered`, which now (post-AM Step 2) is agency-scoped and returns all briefs in the operator's agency where `completion_status='delivered'` — i.e. delivered-but-not-acknowledged.

### Test C trace

The agent's "15 unacknowledged total, 4 critical overdue" answer in Test C earlier today came from:
1. Operator types "what briefs are unacknowledged?" in Clay.
2. System prompt at `route.ts:1597` instructs: *"call get_briefs_by_status when the operator asks to see briefs by state/creator ('show delivered', 'what's waiting')"*.
3. Agent calls `get_briefs_by_status({ status: 'delivered' })`.
4. Tool's `execute` function (`route.ts:1702-1715`) constructs `GET /api/brief-status?status=delivered` and forwards the operator's cookie via `headers: { cookie: cookieHeader }`.
5. Route's `resolveContextForStatusGet` (added in AM Step 2) resolves the operator's session → `agencyId`. Query runs `.eq('agency_id', agencyId).eq('completion_status', 'delivered').limit(50)`.
6. Returns up to 50 briefs scoped to the agency.
7. Agent renders the rows as a Grid of `ContentBriefCard` components per the system prompt rule at line 1597-1602, attaching `update_brief_status → acknowledged` ActionButtons.

The "4 critical overdue" + "15 unacknowledged total" wording is the model's own paraphrase of the row count (model freely interprets "overdue" from `created_at` age vs `acknowledged_at IS NULL`). There is **no server-side computation of "overdue"**; the agent inferred it.

So the **functional answer** lives in the agent today. There is no dedicated `get_unacknowledged_briefs` tool, no server-side overdue threshold, no notion of "stale" enforced anywhere except via the model's prose.

---

## 2. Dashboard-side current state

### Where briefs surface

`src/app/agency/dashboard/DashboardClient.tsx` has a single Briefs panel (begins around line 619). It exposes filter pills at line 620:

```ts
(['all', 'draft', 'in-progress', 'approved', 'published'] as const).map(f => ...)
```

These filter on **`b.status`** — the legacy generation/approval workflow column (`BRIEF_STATUS` map at 33–39: draft / in-progress / approved / published). They do **NOT** filter on `completion_status` (the post-delivery lifecycle).

Per-card decoration:
- **Generation status pill** — driven by `BRIEF_STATUS[b.status]`, line 637.
- **Completion status pill** — driven by `COMPLETION_STATUS[b.completionStatus]`, line 638-649. Map at 43-48 covers `delivered / acknowledged / in_production / published` with distinct colors and labels.
- **Acknowledge button** — line 735-742, conditional on `b.source === 'content_brief' && (b.completionStatus === 'delivered' || !b.completionStatus)`. Calls `handleCompletionUpdate(b.id, 'acknowledged')` which POSTs `/api/brief-status`.

### Filter, tab, badge, list for `delivered AND acknowledged_at IS NULL`?

- **Filter:** No. The 5 filter pills are keyed on the generation-workflow column. There is no "delivered" or "unacknowledged" pill.
- **Count badge:** No. `briefStatusCounts` (line 382-388) only counts the generation-workflow buckets (draft / in-progress / approved / published). There is no `completionStatusCounts` aggregating delivered/acknowledged/in_production/published.
- **Sort/group:** No. The panel renders `filteredBriefs` in the order returned by the queries, which is `created_at DESC` (per `lib/dashboard/queries.ts:254`).
- **Visual indicator on cards:** YES — the `COMPLETION_STATUS` pill at 638-649 is a colored chip per row. Operators *can* visually distinguish "Delivered" (gray) from "Acknowledged" (blue), "In Production" (amber), "Published" (green) on a card-by-card basis.
- **At-a-glance count:** NO. To answer "how many of my briefs are unacknowledged", an operator has to scan cards and count gray pills. Possible for ≤10 cards, painful for 50+, useless without filters at any larger scale.
- **Action affordance:** YES — a clearly labeled `Acknowledge` button appears on every delivered card (line 735-742). The action is reachable, just not the discoverability of *which cards need attention*.

### Operator UX summary

A dashboard-only operator (no Clay) can:
1. See, on each card, whether it's been acknowledged (badge color/label).
2. Click "Acknowledge" on each delivered card to advance its state.

A dashboard-only operator **cannot** easily:
1. See an at-a-glance count of "N briefs need acknowledgement".
2. Filter the list down to only those.
3. Triage by overdue-ness (no `days_since_delivery` or "X days waiting" surfaced).

The completion-status pill exists per row but the panel UI doesn't aggregate or filter on it.

---

## 3. Parity assessment and recommendation

### Verdict: **PARTIAL PARITY** — closer to "no parity" on discoverability, but full parity on action affordance.

| Capability | Clay (today) | Dashboard (today) |
| --- | --- | --- |
| Surface "what's unacknowledged" on demand | ✅ via `get_briefs_by_status({status:'delivered'})` | ❌ no filter / count / dedicated tab |
| Show count of unacked briefs | ✅ agent paraphrases ("15 unacknowledged") | ❌ no `briefStatusCounts.delivered` |
| Visual identification per item | ✅ ContentBriefCard | ✅ completion-status pill on each row |
| Action: mark acknowledged | ✅ ActionButton in agent surface | ✅ Acknowledge button on each card |
| Triage by overdue-ness | ⚠️ model-inferred only | ❌ no time-since signal |

The dashboard has the **action** but not the **discovery**. An operator cannot answer "how many briefs are stuck waiting?" without typing the question into Clay or manually scanning. This is the architectural rule's failure case: a workflow that works in one UI but not the other.

### Recommendation

**AM Step 3 must include both Clay-side and Dashboard-side work** to satisfy the parity rule.

- **Clay side:** Adding a dedicated `get_unacknowledged_briefs` tool is *not strictly required* for capability parity (the agent already does this via `get_briefs_by_status({status:'delivered'})`). But adding it has two real benefits:
  1. **Predictability** — current behavior depends on the model picking `status:'delivered'` from the prompt rule. A dedicated tool is name-driven and prompt-light.
  2. **Server-side overdue threshold** — letting the route compute "days since delivery" or "≥3 days unacked" once gives both the agent AND the dashboard a single source of truth for "overdue" instead of relying on model paraphrase.
- **Dashboard side:** Add the missing discoverability surfaces. Two minimal options:
  - **Option A (small):** add a `delivered` filter pill to the existing 5-pill row, sourced from a new `completionStatusCounts.delivered` aggregator. Keeps the existing UI pattern. Surfaces count and filter in one shot.
  - **Option B (closer to Clay's experience):** add a dedicated "Needs Acknowledgement" section/banner above the briefs panel that shows count + age, with a click-through that filters the list. More visible, more code.

Recommend **Option A** for AM Step 3 — minimal-blast-radius, mirrors existing pattern, full discoverability. Bumps to Option B only if user testing shows the count pill isn't prominent enough.

---

## 4. Schema check

### Columns

`content_briefs.completion_status` — added 2026-04-14 (`20260414_content_briefs_completion_status.sql:5`), `text DEFAULT 'delivered'`. Tightened with CHECK constraint on 2026-04-23 (`20260423_drop_vps_prediction_and_tighten_completion_status.sql:31-34`) restricting values to `NULL | 'delivered' | 'acknowledged' | 'in_production' | 'published'`.

`content_briefs.acknowledged_at` — added 2026-04-14 (same migration, `:6`), `timestamptz` nullable.

Both columns confirmed present.

### Indexes

| Index | File | Columns |
| --- | --- | --- |
| `idx_content_briefs_completion_status` | `20260414_content_briefs_completion_status.sql:11-12` | `completion_status` |
| `idx_content_briefs_user` | `20260303_content_briefs.sql:23-24` | `user_id` |
| `idx_content_briefs_user_status` | `20260303_content_briefs.sql:26-27` | `user_id, status` (legacy `status`, not `completion_status`) |
| `idx_content_briefs_created` | `20260303_content_briefs.sql:29-30` | `created_at DESC` |
| `idx_content_briefs_agency_id` | `20260421_add_agency_id_to_content_briefs.sql:65-66` | `agency_id` |

**No composite index on `(agency_id, completion_status)` exists.** PostgreSQL can use `idx_content_briefs_agency_id` then bitmap-filter on `completion_status` (or vice versa via `idx_content_briefs_completion_status`), which is fine at current row counts (~20 briefs in dev). At scale this would become sub-optimal and warrant `CREATE INDEX idx_content_briefs_agency_completion ON content_briefs(agency_id, completion_status)`. **Not blocking AM Step 3** — flag as a follow-up index to add when row count crosses ~10k or when query plan inspection shows scan cost.

**No index on `acknowledged_at`.** A "find delivered briefs older than N days" query would scan the agency's delivered subset and filter by `created_at` (which IS indexed). Adequate for the foreseeable scale.

---

## 5. Edge cases — REQUIRES OPERATOR SQL RUN

The following queries must be run in the Supabase SQL Editor — I have no direct DB access. Output values into `AM_STEP_3_PARITY_INVESTIGATION_2026-04-25.md` §5 once captured.

### Q1. Has any brief been acknowledged via the email link?

```sql
SELECT
  COUNT(*) FILTER (WHERE completion_status = 'delivered')                   AS delivered_unacked,
  COUNT(*) FILTER (WHERE completion_status = 'acknowledged' AND acknowledged_at IS NOT NULL)
                                                                            AS acked_with_timestamp,
  COUNT(*) FILTER (WHERE completion_status = 'acknowledged' AND acknowledged_at IS NULL)
                                                                            AS acked_no_timestamp,
  COUNT(*) FILTER (WHERE completion_status = 'in_production')               AS in_production,
  COUNT(*) FILTER (WHERE completion_status = 'published')                   AS published,
  COUNT(*) FILTER (WHERE completion_status IS NULL)                         AS null_completion,
  COUNT(*)                                                                  AS total
FROM content_briefs;
```

`acked_with_timestamp > 0` confirms the `ad3b784` ack-link path is being used. `acked_no_timestamp > 0` would indicate state-machine drift (someone updated `completion_status` directly without setting `acknowledged_at` — possibly the dashboard's `handleCompletionUpdate` if it doesn't write the timestamp; worth verifying).

### Q2. State-machine drift between `delivery_status` and `completion_status`?

```sql
SELECT
  delivery_status,
  completion_status,
  COUNT(*) AS rows
FROM content_briefs
GROUP BY delivery_status, completion_status
ORDER BY rows DESC;
```

Expected pairs:
- `(delivered, delivered)` — sent, not yet acked
- `(delivered, acknowledged)` — sent + acked
- `(delivered, in_production)`, `(delivered, published)` — full lifecycle
- `(pending, NULL)` or `(pending, delivered)` — undelivered (expected to be small)
- `(failed, *)` — delivery error

Anything else (e.g. `delivery_status='pending'` paired with `completion_status='acknowledged'`) signals drift — a brief reached "acknowledged" without ever being delivered. This would need investigation before declaring AM Step 3 done.

---

## 6. Recommended scope for AM Step 3

In dependency order:

### 6.1 Clay-side (additive — does not change existing behavior)

**(a)** Add dedicated `get_unacknowledged_briefs` read tool to `src/app/api/agency-chat/route.ts`.
  - Accepts optional `creator_name`. No status arg (the tool name is the filter).
  - Internally calls `GET /api/brief-status?status=delivered` (no new route needed) and optionally augments the response with a server-computed `days_since_created` per row so the agent stops paraphrasing "overdue".
  - Register in `extraReadTools` alongside `get_briefs_by_status` and `get_performance_summary`.
  - System prompt addition: one sentence at line ~1597 — *"For 'unacknowledged', 'overdue', or 'stale' phrasing, prefer get_unacknowledged_briefs over get_briefs_by_status."*

**(b)** Optional but cheap: extend the response of `GET /api/brief-status` (when `status=delivered` only) to include `days_since_created` per row. This puts the "overdue" notion server-side, not model-side. Same change benefits the dashboard (see 6.2 (b)).

### 6.2 Dashboard-side (the parity fix)

**(a)** Add a `delivered` filter pill to the briefs panel filter row in `DashboardClient.tsx` at line 620. Mirror existing pill pattern.
  - Source `b.completionStatus === 'delivered'` from the existing `briefs` array (already on every row from `lib/dashboard/queries.ts:251-255`).
  - Add `delivered` to the `briefStatusCounts` aggregation at line 382-388.
  - Edit the existing FilterPill `.map(f => ...)` to include `'delivered'` in the array — but be careful not to mix completion-status with generation-status visually; consider a small visual divider or a sub-label.

**(b)** Optional polish: when the `delivered` filter is active, sort the list by `created_at ASC` (oldest first) so the most-overdue surface to the top, and add a small "(X days)" subtitle on each card derived from `created_at`. Reuses `timeAgo()` already at line 62-69.

### 6.3 Verification (mirror of AM Step 2 verification protocol)

- Test A — Clay: ask the agent "what's unacknowledged?" and confirm it now calls `get_unacknowledged_briefs` (visible in tool-call traces) and returns scoped results. Compare row count to dashboard's new pill count — they MUST match.
- Test B — Dashboard: open the agency dashboard, observe the `delivered` filter pill exists, click it, confirm the list filters down to delivered briefs and the count matches what Clay reports.
- Test C — cross-check with the Q1 SQL output. The delivered count from §5 Q1 should equal what Clay returns AND what the dashboard pill says.

### 6.4 Out of scope for AM Step 3

- Composite `(agency_id, completion_status)` index. Not needed at current row counts. Defer.
- Email link acknowledgement timestamp check (`acked_no_timestamp` from Q1). Investigate if Q1 returns >0; otherwise no action.
- Server-side "overdue threshold" config (e.g. "≥3 days waiting → red"). Not in scope here; could be added in a follow-up if the operator wants explicit triage rules.
- "Needs Acknowledgement" hero banner above the briefs panel (Option B from §3). Defer to user feedback after Option A ships.

---

## Anything unexpected

- **The substring "unacknowledged" does not appear anywhere in the codebase.** No prompt rule, no comment, no UI label uses it. The Clay agent answered "what's unacknowledged" by mapping the question's intent to `status='delivered'` via the system prompt's "show delivered / what's waiting" guidance. This is fragile prompt-engineering rather than a structural concept. Adding `get_unacknowledged_briefs` as a named tool removes that fragility.
- **The dashboard `Acknowledge` button (line 737) calls the POST mutation but I did not verify it writes `acknowledged_at`.** Worth checking — if it only writes `completion_status='acknowledged'` without the timestamp, that's the source of any `acked_no_timestamp > 0` rows in Q1. Would need a one-line tweak to `handleCompletionUpdate` or the `/api/brief-status` POST. Out of scope for this investigation; flag as a "verify or fix during AM Step 3 if Q1 surfaces drift".
- **The legacy `b.status` filter pills (`draft/in-progress/approved/published`) and the new `completionStatus` lifecycle are visually overlapping concepts** to a non-technical operator. A brief can be `status='approved'` AND `completionStatus='delivered'` simultaneously. The dashboard already shows BOTH pills on each card, which is correct, but adding a `delivered` filter pill alongside `draft/in-progress/approved/published` will further blur the line. Worth either (a) adding a small label "Generation:" / "Delivery:" above each filter group, or (b) splitting the filter row into two stacked rows. Cosmetic, not blocking.

---

**Path:** `C:\Projects\CleanCopy\AM_STEP_3_PARITY_INVESTIGATION_2026-04-25.md`. Not committed.
