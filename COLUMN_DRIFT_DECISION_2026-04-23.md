# Column Drift Decision — `content_briefs`

**Date:** 2026-04-23
**Mode:** READ-ONLY investigation. No files modified, no migrations executed.
**Pairs investigated:**
- PAIR 1 (VPS): `predicted_vps` vs `vps_prediction`
- PAIR 2 (Status): `status` vs `completion_status`

---

## SECTION 1 — Migration history for each column

### `predicted_vps`
- **Origin:** `supabase/migrations/20260303_content_briefs.sql` (2026-03-03) — declared inline in the original `CREATE TABLE content_briefs`.
- **Subsequent ALTER migrations:** *None.*
- **Data type:** `NUMERIC(5,1)` — bounded precision (1 decimal, 4 integer digits).

### `vps_prediction`
- **Origin:** `supabase/migrations/20260414_content_briefs_performance.sql` (2026-04-14) — added in the "performance measurement loop" migration alongside `actual_views`, `actual_engagement_rate`, `performance_delta`, `performance_measured_at`, `performance_source`.
- **Subsequent ALTER migrations:** *None.*
- **Data type:** `numeric` — unbounded precision (no scale).
- **Migration comment intent:** "Parallel to the existing `predicted_vps` / `actual_vps` columns; these track views and engagement rather than VPS scores so the feedback loop closes on raw metrics." — i.e. the migration author intended `vps_prediction` to live alongside `predicted_vps`, not replace it. The column was added without a clear write strategy, and the rest of the codebase has been writing both columns inconsistently ever since.

### `status`
- **Origin:** `supabase/migrations/20260303_content_briefs.sql` (2026-03-03) — declared inline in the original `CREATE TABLE content_briefs`.
- **Subsequent ALTER migrations:** *None.*
- **Data type:** `TEXT NOT NULL DEFAULT 'generated'` with `CHECK (status IN ('generated', 'accepted', 'recorded', 'analyzed', 'optimized', 'published', 'measured'))`.
- **Indexed:** `idx_content_briefs_user_status` (composite with `user_id`).

### `completion_status`
- **Origin:** `supabase/migrations/20260414_content_briefs_completion_status.sql` (2026-04-14) — added in the "brief completion lifecycle" migration alongside `acknowledged_at`, `in_production_at`, `published_at`, `published_url`.
- **Subsequent ALTER migrations:** *None.*
- **Data type:** `text DEFAULT 'delivered'`. **No CHECK constraint, no NOT NULL.**
- **Indexed:** `idx_content_briefs_completion_status`.
- **Migration comment:** *"Brief completion lifecycle: delivered -> acknowledged -> in_production -> published. Separate from `delivery_status` (email send state) and `status` (workflow state)."* — the migration author **explicitly states this is a different concept from `status`**.

---

## SECTION 2 — Write-site analysis for VPS pair

### `predicted_vps` (4 write sites on `content_briefs`)

| # | File | Line | Code path | Operation |
|---|------|------|-----------|-----------|
| 1 | `src/app/api/quick-win/brief/route.ts` | 56 | API route (POST) | INSERT |
| 2 | `src/app/api/quick-win/brief/route.ts` | 109 | API route (PATCH) | UPDATE |
| 3 | `src/app/api/agency/brief-review/route.ts` | 194 | API route (operator approval) | INSERT |
| 4 | `src/app/api/content-calendar/accept/route.ts` | 119 | API route (creator accepts calendar slot) | INSERT |

**Context — Site 1 & 2 (`/api/quick-win/brief`):**

```48:60:src/app/api/quick-win/brief/route.ts
    const { data, error } = await serviceClient
      .from('content_briefs')
      .insert({
        user_id: user.id,
        agency_id: resolvedAgencyId,
        source_video_id: source_video_id || null,
        pattern_id: pattern_id || null,
        brief_content: brief_content || {},
        predicted_vps: predicted_vps || null,
        status: 'generated',
      })
      .select('id')
      .single();
```

```107:116:src/app/api/quick-win/brief/route.ts
    const updatePayload: Record<string, any> = { status };
    if (predicted_vps != null) updatePayload.predicted_vps = predicted_vps;
    if (actual_vps != null) updatePayload.actual_vps = actual_vps;

    const { error: updateError } = await serviceClient
      .from('content_briefs')
      .update(updatePayload)
      .eq('id', brief_id)
      .eq('user_id', user.id);
```

**Context — Site 3 (`/api/agency/brief-review`):**

```188:197:src/app/api/agency/brief-review/route.ts
    const { data: contentBrief, error: insertErr } = await db
      .from('content_briefs')
      .insert({
        user_id: brief.client_id,
        agency_id: brief.agency_id, // carry agency from source pre_generated_brief
        brief_content: briefContent,
        predicted_vps: approvedVps,
        vps_prediction: approvedVps, // performance-loop column; mirrors predicted_vps at approval time
        status: 'accepted', // operator-approved; surfaces in the Approved tab
      })
```

**Context — Site 4 (`/api/content-calendar/accept`):**

```104:121:src/app/api/content-calendar/accept/route.ts
    const { data: newBrief, error: briefError } = await serviceClient
      .from('content_briefs')
      .insert({
        user_id: user.id,
        agency_id: resolvedAgencyId,
        source_video_id: null,
        pattern_id,
        brief_content: {
          topic_angle: calendarBrief.topic_angle,
          hook_text: calendarBrief.hook_text,
          format_suggestion: calendarBrief.format_suggestion,
          calendar_day: calendarBrief.day,
          narrative_arc: calendarBrief.narrative_arc,
          pattern_name: calendarBrief.pattern_name,
        },
        predicted_vps: calendarBrief.predicted_vps,
        status: 'accepted',
      })
```

**Total `predicted_vps` write sites: 4**

---

### `vps_prediction` (1 write site on `content_briefs`)

| # | File | Line | Code path | Operation |
|---|------|------|-----------|-----------|
| 1 | `src/app/api/agency/brief-review/route.ts` | 195 | API route (operator approval) | INSERT (mirrors `predicted_vps`) |

**Context — Site 1 (`/api/agency/brief-review`):** *(same block as Site 3 above)*

```190:197:src/app/api/agency/brief-review/route.ts
      .insert({
        user_id: brief.client_id,
        agency_id: brief.agency_id, // carry agency from source pre_generated_brief
        brief_content: briefContent,
        predicted_vps: approvedVps,
        vps_prediction: approvedVps, // performance-loop column; mirrors predicted_vps at approval time
        status: 'accepted', // operator-approved; surfaces in the Approved tab
      })
```

**Total `vps_prediction` write sites: 1** — and that single site is a *mirror* of `predicted_vps`, by the author's own inline comment ("performance-loop column; mirrors predicted_vps at approval time"). No code path *only* writes `vps_prediction`. The Quick-Win and Calendar paths never write it at all, leaving NULL for the majority of briefs.

---

## SECTION 3 — Read-site analysis for VPS pair

### `predicted_vps` reads (content_briefs context only)

| # | File | Line(s) | Notes |
|---|------|---------|-------|
| 1 | `src/lib/dashboard/queries.ts` | 252, 318, 322 | `.select(...)` for agency dashboard; mapped to `vpsScore` and as fallback for `vpsPrediction` |
| 2 | `src/app/dashboard/page.tsx` | 196, 454, 456 | `.select(...)` + UI display: `<span className={vpsColor(brief.predicted_vps)}>VPS {brief.predicted_vps}</span>` |
| 3 | `src/app/admin/viral-studio/components/phases/ContentCalendarPhase.tsx` | 357, 359, 417 | UI display: `est. {brief.predicted_vps} VPS` |
| 4 | `src/app/api/quick-win/brief/route.ts` | 136, 139, 146 | history lookup for first-win detection |
| 5 | `src/app/api/quick-win/context/route.ts` | 110, 115 | `.select('predicted_vps, actual_vps, first_win')` |
| 6 | `src/lib/triage/overnight-triage.ts` | 156, 164 | `.select(... predicted_vps, vps_prediction ...)` — uses `vps_prediction \|\| predicted_vps` |
| 7 | `src/lib/content/pattern-performance-tracker.ts` | 43, 54, 58 | `.select('pattern_id, predicted_vps, actual_vps')` for pattern performance |
| 8 | `src/lib/context/assemble-context.ts` | 245 | `.select('predicted_vps, actual_performance, delta, feedback_collected')` |
| 9 | `src/app/api/chairman/performance/route.ts` | 16, 42 | `.select(... vps_prediction, predicted_vps ...)` then `b.vps_prediction ?? b.predicted_vps` |
| 10 | `src/app/api/brief-performance/route.ts` | 47, 80, 157, 173, 189 | Same fallback pattern repeated 3 times across the file |
| 11 | `src/app/api/content-calendar/performance/route.ts` | 45 | `.select(... predicted_vps ...)` |

**Total `predicted_vps` read sites: 11**
**UI display: YES** — `dashboard/page.tsx:454-456`, `ContentCalendarPhase.tsx:417`.

### `vps_prediction` reads (content_briefs context only)

| # | File | Line(s) | Notes |
|---|------|---------|-------|
| 1 | `src/lib/dashboard/queries.ts` | 252, 322 | `.select(...)`, mapped as `vpsPrediction: b.vps_prediction ?? b.predicted_vps` |
| 2 | `src/lib/triage/overnight-triage.ts` | 156, 164 | `.select(...)`, used as `vps_prediction \|\| predicted_vps` |
| 3 | `src/app/api/chairman/performance/route.ts` | 16, 42 | `.select(...)`, fallback to `predicted_vps` |
| 4 | `src/app/api/brief-performance/route.ts` | 47, 80, 157, 173, 189 | `.select(...)` repeated 3×, each time falls back to `predicted_vps` |
| 5 | `src/lib/clay/action-handler.ts` | 531, 539 | `.select('id, user_id, brief_content, vps_prediction, predicted_vps')`, then `toNum(brief.vps_prediction) ?? toNum(brief.predicted_vps)` |
| 6 | `src/app/agency/dashboard/DashboardClient.tsx` | 216 | `vpsPrediction: u.vps_prediction ?? u.predicted_vps ?? b.vpsPrediction` |

**Total `vps_prediction` read sites: 6**
**UI display: YES — but only as a coalesced fallback.** Every single read site uses the pattern `vps_prediction ?? predicted_vps` or `vps_prediction || predicted_vps`. There is **zero** code that displays `vps_prediction` standalone, and **zero** code that prefers it over `predicted_vps` for any business reason. The fallback exists solely because some briefs (those that went through `agency/brief-review`) happen to have both columns populated, while every other write path leaves `vps_prediction` NULL.

---

## SECTION 4 — Write-site analysis for status pair (`content_briefs` only)

### `status` (5 write sites on `content_briefs`)

| # | File | Line | Code path | Operation | Value(s) written |
|---|------|------|-----------|-----------|------------------|
| 1 | `src/app/api/quick-win/brief/route.ts` | 57 | API route (POST, creator) | INSERT | `'generated'` (literal) |
| 2 | `src/app/api/quick-win/brief/route.ts` | 108 | API route (PATCH, creator) | UPDATE | dynamic from request body — workflow allows `'generated' \| 'accepted' \| 'recorded' \| 'analyzed' \| 'optimized' \| 'published' \| 'measured'` per CHECK constraint, but PATCH does not validate |
| 3 | `src/app/api/agency/brief-review/route.ts` | 196 | API route (operator approval) | INSERT | `'accepted'` (literal) |
| 4 | `src/app/api/content-calendar/accept/route.ts` | 120 | API route (creator accept) | INSERT | `'accepted'` (literal) |
| 5 | `src/lib/clay/action-handler.ts` | 640 | Library function (Clay action handler `approveContentBrief`) | UPDATE | `'approved'` (literal) — **⚠ NOT in the CHECK constraint** — this write will be rejected by Postgres at runtime |

**Context — Site 5 (`clay/action-handler.ts`):**

```637:642:src/lib/clay/action-handler.ts
async function approveContentBrief(db: DB, briefId: string, context: ActionContext): Promise<ActionResult> {
  const { error } = await db
    .from('content_briefs')
    .update({ status: 'approved' })
    .eq('id', briefId)
  if (error) return fail(`Failed to approve brief: ${error.message}`)
```

The CHECK constraint accepts only: `generated, accepted, recorded, analyzed, optimized, published, measured`. `'approved'` is **not** in this set — the constraint will reject this write. (Out of scope for this audit, but worth flagging in the recommendation.)

**Total `status` write sites: 5**

---

### `completion_status` (3 write sites on `content_briefs`)

| # | File | Line | Code path | Operation | Value(s) written |
|---|------|------|-----------|-----------|------------------|
| 1 | `src/app/api/brief-acknowledge/[briefId]/route.ts` | 90 | API route (signed email-link acknowledgment) | UPDATE | `'acknowledged'` (literal) |
| 2 | `src/app/api/brief-status/route.ts` | 152 | API route (operator dashboard, agency-scoped) | UPDATE | dynamic — restricted to `'acknowledged' \| 'in_production' \| 'published'` (TypeScript `TargetStatus` type + transition validation) |
| 3 | `src/lib/clay/action-handler.ts` | 464, 472 | Library function (Clay action handler `updateBriefStatus`) | UPDATE | dynamic — `VALID` map enforces transitions to `'acknowledged' \| 'in_production' \| 'published'` |

**Context — Site 1 (`brief-acknowledge`):**

```87:92:src/app/api/brief-acknowledge/[briefId]/route.ts
  if (!alreadyAcknowledged) {
    await db
      .from('content_briefs')
      .update({ completion_status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', briefId)
```

**Context — Site 2 (`brief-status`):**

```151:165:src/app/api/brief-status/route.ts
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { completion_status: status }
  if (status === 'acknowledged') update.acknowledged_at = now
  if (status === 'in_production') update.in_production_at = now
  if (status === 'published') {
    update.published_at = now
    if (typeof publishedUrl === 'string' && publishedUrl.trim()) {
      update.published_url = publishedUrl.trim()
    }
  }

  const { error: updateErr } = await db
    .from('content_briefs')
    .update(update)
```

**Context — Site 3 (`clay/action-handler.ts` — `updateBriefStatus`):**

```462:472:src/lib/clay/action-handler.ts
  const now = new Date().toISOString()
  const update: Record<string, unknown> = { completion_status: newStatus }
  if (newStatus === 'acknowledged') update.acknowledged_at = now
  if (newStatus === 'in_production') update.in_production_at = now
  if (newStatus === 'published') {
    update.published_at = now
    if (publishedUrl && publishedUrl.trim()) update.published_url = publishedUrl.trim()
  }

  const { error: updateErr } = await db.from('content_briefs').update(update).eq('id', briefId)
```

The `VALID` map at the top of the same function (line ~440) constrains transitions, so only `'acknowledged' | 'in_production' | 'published'` are ever written.

**Total `completion_status` write sites: 3**

**Note:** `'delivered'` is the column DEFAULT (set when a brief is inserted) — no INSERT explicitly writes it, but every brief gets this value at creation time.

---

## SECTION 5 — Read-site analysis for status pair (`content_briefs` only)

### `status` reads

| # | File | Line(s) | Notes |
|---|------|---------|-------|
| 1 | `src/lib/dashboard/queries.ts` | 252 | `.select('id, user_id, status, ...')` for the agency dashboard list |
| 2 | `src/app/dashboard/page.tsx` | 196 | `.select('id, brief_content, status, predicted_vps, created_at')` for the creator dashboard |
| 3 | `src/lib/clay/action-handler.ts` | 963 | `.select('id, status, completion_status, ...')` for funnel/aggregation |

**Total `status` read sites: 3**
**UI display:** `dashboard/page.tsx` selects `status` and uses it in render flow (creator dashboard); `dashboard/queries.ts` exposes it via the `AgencyBrief` shape.

### `completion_status` reads (content_briefs context only)

| # | File | Line(s) | Notes |
|---|------|---------|-------|
| 1 | `src/lib/dashboard/queries.ts` | 252, 320 | `.select(...)` + map: `completionStatus: (b.completion_status \|\| 'delivered') as AgencyBrief['completionStatus']` |
| 2 | `src/app/api/brief-performance/route.ts` | 48, 157, 189 | `.eq('completion_status', 'published')`, plus two further `.select(... completion_status ...)` calls used to gate performance display |
| 3 | `src/app/api/chairman/performance/route.ts` | 17 | `.eq('completion_status', 'published')` |
| 4 | `src/app/api/brief-acknowledge/[briefId]/route.ts` | 50, 85 | `.select('id, user_id, agency_id, completion_status')` then `alreadyAcknowledged` gate |
| 5 | `src/app/api/brief-status/route.ts` | 34, 43, 74, 126, 142 | `.select(...)` + `.eq('completion_status', status)` filter + transition validation |
| 6 | `src/lib/clay/action-handler.ts` | 446, 454, 963 | `.select(...)` + transition validation in `updateBriefStatus`, plus aggregation query |
| 7 | `src/lib/triage/overnight-triage.ts` | 119, 125 | `.select(... completion_status ...)`, then `if (b.completion_status === 'published') continue` to skip published briefs from overdue triage |
| 8 | `src/app/agency/dashboard/DashboardClient.tsx` | 41 | Type/comment surface: *"Post-delivery lifecycle (content_briefs.completion_status)"* — drives action button labels in the operator UI |
| 9 | `src/app/api/agency-chat/route.ts` | 1552–1556, 1634, 1650 | LLM tool prompt explicitly instructs the agent to use `completion_status` to choose ActionButton labels (Mark Acknowledged / Mark In Production / Mark Published / Log Performance) |

**Total `completion_status` read sites: 9**
**UI display: YES** — both directly in the agency dashboard cards (via `completionStatus` field on `AgencyBrief`) and indirectly via the agency-chat operator agent which uses it as the primary decision input for which action button to render on each brief.

---

## SECTION 6 — Quick Win workflow status

### Pages / routes named "quick-win"

| Path | Type | Status |
|------|------|--------|
| `src/app/admin/workflows/quick-win/page.tsx` | Admin page (live) | **REACHABLE** — linked from `master-nav.tsx:155` ("Quick Win" desktop nav) and `master-nav.tsx:194` (mobile nav). |
| `src/app/sandbox/quick-win-workflow/page` | Imported by `QuickWinEntry.tsx:10` (`dynamic(() => import('@/app/sandbox/quick-win-workflow/page'))`) | **DOES NOT EXIST** — `Glob '**/sandbox/quick-win-workflow/**'` returns 0 files. The dynamic import will throw at runtime if `QuickWinEntry` is ever rendered. |
| `/dashboard-view/quick-win` | Route referenced in `src/components/layout/Sidebar.tsx:193, 196, 219, 222` | **DOES NOT EXIST** — `Glob '**/dashboard-view/**'` returns 0 files. The "Quick Win" sidebar link points to a 404. |

### Components with "QuickWin" in name

| Component | Path | Used? |
|-----------|------|-------|
| `QuickWinEntry` | `src/components/quickwin/QuickWinEntry.tsx` | Defined but **never imported anywhere** (`grep QuickWinEntry` matches only its own definition). Effectively dead code, and is broken (dynamic-imports a missing page). |

### Navigation links labeled "Quick Win"

| File | Line(s) | Target | Reachable? |
|------|---------|--------|-----------|
| `src/components/navigation/master-nav.tsx` | 155–156 (desktop), 194–195 (mobile) | `/admin/workflows/quick-win` | **YES** (file exists) |
| `src/components/layout/Sidebar.tsx` | 192–197, 218–223 | `/dashboard-view/quick-win` | **NO** (route does not exist) |

### Callers of `/api/quick-win/brief` in `src/`

| File | Line | Context |
|------|------|---------|
| `src/app/admin/workflows/quick-win/page.tsx` | 308 | `fetch('/api/quick-win/brief', ...)` — POST to create brief |
| `src/app/admin/workflows/quick-win/page.tsx` | 495 | `fetch('/api/quick-win/brief', ...)` — PATCH update |
| `src/app/admin/workflows/quick-win/page.tsx` | 628 | `fetch('/api/quick-win/brief', ...)` — PATCH update |

**Total callers: 3 fetch sites in 1 file.** All from the admin workflow page.

### Reachability summary

- **Admin (operator) Quick Win:** `/admin/workflows/quick-win` is **fully reachable** behind admin nav. This page is the only live UI consumer of `/api/quick-win/brief`.
- **Member/creator Quick Win:** Two attempts to surface a member-facing Quick Win flow exist (`Sidebar.tsx` link to `/dashboard-view/quick-win`, and `QuickWinEntry` lazy-loading `/sandbox/quick-win-workflow/page`). Both target paths do **not** exist on disk. The "Quick Win" entry in the user sidebar is a dead link, and `QuickWinEntry` is dead code that would crash if mounted.

The Quick Win workflow as a *user-facing* feature is **not currently reachable**. As an *admin/operator* tool it is reachable and actively used.

---

## SECTION 7 — Semantic distinction check (status pair)

### Constraint / value evidence

| Column | CHECK constraint | Values actually written (Section 4) | Default |
|--------|------------------|-------------------------------------|---------|
| `status` | `'generated' \| 'accepted' \| 'recorded' \| 'analyzed' \| 'optimized' \| 'published' \| 'measured'` | `'generated'`, `'accepted'`, `'approved'` (illegal — `clay/action-handler.ts:640`); PATCH allows the full enum but no observed call writes anything past `'accepted'` | `'generated'` |
| `completion_status` | *(none)* | `'acknowledged'`, `'in_production'`, `'published'` | `'delivered'` |

### Migration author's stated intent

The 2026-04-14 migration that introduced `completion_status` carries this header comment, verbatim:

> *"Brief completion lifecycle: delivered -> acknowledged -> in_production -> published. Separate from `delivery_status` (email send state) and `status` (workflow state)."*

The author explicitly distinguished three orthogonal lifecycles: email delivery, creator workflow, agency completion.

### Verdict: **DISTINCT PURPOSES**

**Justification.** The two columns model two different actor lifecycles that happen to share one terminal label (`'published'`). `status` is the **creator's content-production pipeline state** — it advances as the creator works through Quick Win (generate → accept → record → analyze → optimize → publish → measure) and is owned by the creator-facing Quick Win and Calendar APIs. `completion_status` is the **agency's post-delivery tracking lifecycle** — it advances as the operator and creator coordinate after the brief has been emailed (delivered → acknowledged → in_production → published) and is owned by the operator dashboard, the signed email-acknowledge link, and the Clay/agency-chat operator agent. The value sets do not overlap (`status` uses `generated/accepted/recorded/analyzed/optimized/measured`; `completion_status` uses `delivered/acknowledged/in_production`), the writers do not overlap (creator-side APIs vs operator-side APIs), and the readers serve different UIs (creator dashboard + content-calendar phase vs agency dashboard + operator chat). Collapsing them into one column would force the same string to mean two different things depending on who set it, and would break the clean transition validation each side currently enforces.

---

## SECTION 8 — Recommendation

### PAIR 1 (VPS): **Canonicalize `predicted_vps`. Eliminate `vps_prediction`.**

**Reasoning:**
1. **Write-site dominance.** `predicted_vps` is written from 4 distinct code paths (Quick Win INSERT, Quick Win PATCH, agency approval INSERT, calendar accept INSERT). `vps_prediction` is written from exactly 1 site (`agency/brief-review/route.ts:195`), and that site explicitly mirrors `predicted_vps` ("performance-loop column; mirrors predicted_vps at approval time").
2. **No standalone reads.** Every one of the 6 `vps_prediction` read sites in `src/` uses the coalescing pattern `vps_prediction ?? predicted_vps` (or `||`). There is no business logic, no UI display, and no analytics that prefers `vps_prediction` over `predicted_vps`. The fallback exists only because the column is NULL on the majority of briefs.
3. **NULL drift.** Any brief created via `/api/quick-win/brief` or `/api/content-calendar/accept` has `vps_prediction = NULL`. Only briefs that went through `/api/agency/brief-review` have it populated. This means `vps_prediction` is structurally a partial-coverage duplicate of `predicted_vps`.
4. **Older + tighter type.** `predicted_vps` is `NUMERIC(5,1)` (declared in the original `CREATE TABLE` 2026-03-03), versus `vps_prediction`'s untyped `numeric` (added 2026-04-14). The older, tighter column is the natural canonical.
5. **Cheap migration path (out of scope, but worth noting).** Code change is one-line per read site (delete the `?? b.predicted_vps` half), one-line at the agency-approval write site (delete `vps_prediction: approvedVps,`). A separate migration can later drop the column.

### PAIR 2 (Status): **Keep both columns. Clarify purposes in code comments and column comments.**

**Reasoning:**
1. **Distinct purposes confirmed (Section 7).** `status` = creator workflow state; `completion_status` = agency post-delivery lifecycle. The migration author already wrote this explicitly in the 2026-04-14 migration header.
2. **Disjoint value sets.** `status` writes `generated/accepted` (and could legally write `recorded/analyzed/optimized/published/measured`). `completion_status` writes `delivered` (default) `/acknowledged/in_production/published`. They share only the *concept* of "published" but the columns are owned by different actors and have different post-conditions (creator marking own video published vs. operator confirming on creator's behalf).
3. **Disjoint writers and readers.** Creator-side APIs (`/api/quick-win`, `/api/content-calendar/accept`) write only `status`. Operator-side APIs (`/api/brief-acknowledge`, `/api/brief-status`, `clay/action-handler#updateBriefStatus`) write only `completion_status`. The agency dashboard, agency-chat, and overnight triage read only `completion_status`. The creator dashboard reads only `status`. There is no current consumer that needs to coalesce them.
4. **Two anomalies should be cleaned up at the same time** (independent of the keep/drop decision):
    - `clay/action-handler.ts:640` writes `status: 'approved'`, which is **not** in the original CHECK constraint and will be rejected by Postgres at runtime. Either the constraint needs `'approved'` added, or this write should switch to `completion_status` (the operator-lifecycle column it actually belongs in semantically — operator-side approval is post-delivery, not creator workflow).
    - `completion_status` has no CHECK constraint. It should probably get one matching the agency lifecycle: `CHECK (completion_status IN ('delivered','acknowledged','in_production','published'))` to prevent silent typos in operator code.
5. **Optional clarifying renames** (for future consideration; not required to keep both):
    - `status` → `creator_workflow_status` (or `production_status`)
    - `completion_status` → `delivery_lifecycle_status` (or `operator_status`)

### Out-of-scope but worth flagging

- The `'approved'` write in `clay/action-handler.ts:640` is a latent runtime bug (CHECK violation). It is not part of the column-drift question, but the canonicalization decision touches the same file, so it would be efficient to fix in the same PR.
- The Quick Win user-facing surface (`QuickWinEntry` + sidebar link to `/dashboard-view/quick-win`) is dead. The only live consumer of `predicted_vps` writes from Quick Win is the **admin** workflow page. If a member-facing Quick Win is no longer planned, those dead nav entries and `QuickWinEntry` should be deleted.

---

*Report complete. File written to `./COLUMN_DRIFT_DECISION_2026-04-23.md`.*
