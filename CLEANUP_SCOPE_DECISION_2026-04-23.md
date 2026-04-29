# Cleanup Scope Decision — `content_briefs` migration

**Date:** 2026-04-23
**Mode:** READ-ONLY investigation. No files modified, no SQL executed.
**Settled scope (do not re-investigate):** drop `vps_prediction`, update the one mirroring write site in `src/app/api/agency/brief-review/route.ts`, keep `predicted_vps` as canonical.
**Question:** which adjacent issues are safe to bundle into the same cleanup migration?

---

## ISSUE A — Add a CHECK constraint to `content_briefs.completion_status`

### 1. What the issue is (in plain English)

The column `completion_status` tracks where a brief is in the agency's "after we sent it to the creator" lifecycle (delivered → acknowledged → in production → published). Right now Postgres will accept literally any text string into this column — there's no rule preventing a typo like `acknowledg` or `inproduction` from being saved as a real value. Its sibling column `status` does have such a rule. This is just a missing safety net.

### 2. What would need to change (files + SQL)

**Files to change:** none — this is a DB-only change.

**SQL needed (illustrative; not executed):**
```sql
ALTER TABLE content_briefs
  ADD CONSTRAINT content_briefs_completion_status_check
  CHECK (completion_status IN ('delivered','acknowledged','in_production','published'));
```

The four values above are the **complete** set of literal strings written anywhere in the code. I greppped every write site:

| Write site | Value written |
|---|---|
| `src/app/api/brief-acknowledge/[briefId]/route.ts:90` | `'acknowledged'` |
| `src/app/api/brief-status/route.ts:152` | dynamic — TypeScript type `'acknowledged' \| 'in_production' \| 'published'` enforced upstream |
| `src/lib/clay/action-handler.ts:464` | dynamic — TypeScript type `'acknowledged' \| 'in_production' \| 'published'` enforced upstream |
| Migration `20260414_content_briefs_completion_status.sql:5` | DEFAULT `'delivered'` (every brief gets this on insert) |

The agency-chat operator-agent prompt (`src/app/api/agency-chat/route.ts:1553-1556`) also documents these four values as the canonical lifecycle. There is no drift anywhere in the code — all writers use the same four values.

### 3. Risk if bundled with the VPS cleanup — **LOW**

The CHECK is additive, not destructive. It does not touch any rows or any other column. The migration will only fail at *apply time* if there is an existing row in the live DB whose `completion_status` value is not in the four-value set. Every code path I found writes a valid value, and the column DEFAULT is `'delivered'` (also valid), so any backfilled rows from before this column existed will have `'delivered'` and pass. The cleanup PR is already touching this table for the `vps_prediction` drop, so there is no extra coordination cost.

### 4. Risk if left alone for now — **LOW**

Nothing is currently broken. The DB will quietly accept a typo from a future code change, but every present writer is correct. The cost of waiting is "we lose a small future-proofing safety net" rather than "something is breaking right now".

### 5. Recommendation

**BUNDLE.** A trivial additive constraint that pairs naturally with a migration already touching the same table; pre-flight `SELECT DISTINCT completion_status FROM content_briefs;` verifies safety in 10 seconds.

---

## ISSUE B — `src/lib/clay/action-handler.ts:640` writes `status: 'approved'`

### 1. What the issue is (in plain English)

When an operator clicks the green "Approve" button on a brief card, or asks the agency-chat assistant to "approve this brief", the code tries to set the brief's `status` column to the value `'approved'`. But `'approved'` is not in the list of values the database is configured to allow for that column. So the database rejects the write, and the operator sees an error message instead of the brief being approved. The button is silently broken.

### 2. What would need to change (files + SQL)

**The fix is not as simple as "add `'approved'` to the CHECK list" — there is a semantic conflict that needs resolving first.** Two different code paths claim to do "operator approves a generated brief", but they write **different values** to the same column:

- `src/app/api/agency/brief-review/route.ts:196` writes `status: 'accepted'` with the comment `// operator-approved; surfaces in the Approved tab`
- `src/lib/clay/action-handler.ts:640` writes `status: 'approved'` (unsupported)

Whoever fixes this has to pick one of these conventions. Two viable paths:

**Path 1 — Add `'approved'` to the CHECK and standardize on it.**
- *Files:* `src/app/api/agency/brief-review/route.ts:196` change `'accepted'` to `'approved'`.
- *SQL:* drop the existing `status` CHECK, re-add it including `'approved'`, plus a one-time `UPDATE content_briefs SET status='approved' WHERE status='accepted' AND ...` to keep the dashboards consistent.
- *Knock-on work:* audit every reader of `status` (`src/lib/dashboard/queries.ts:252`, `src/app/dashboard/page.tsx:196`, `src/lib/clay/action-handler.ts:963`, plus the "Approved tab" filter in the agency dashboard) to make sure they handle the new value. Verify the creator dashboard's status badges, the triage filter, and any aggregation queries.

**Path 2 — Change Clay to write `'accepted'` (the value already used elsewhere).**
- *File:* `src/lib/clay/action-handler.ts:640` change `'approved'` to `'accepted'`.
- *SQL:* none.
- *Knock-on work:* update the registry comment at `src/lib/clay/intelligent-clay-registry.ts:157` (which currently says `content_briefs.status = "approved"`).

The handler IS reachable. I traced the callers:

| Caller | File:line |
|---|---|
| ContentBriefCard "Approve" button | `src/lib/clay/component-data-fetcher.ts:127` |
| Trendzo action dispatcher | `src/lib/trendzo-registry.tsx:4671, 6771` |
| AgencyClient handler dispatch | `src/app/agency/AgencyClient.tsx:1092-1097` |
| Agent handler adapter (LLM tool surface) | `src/lib/agent/handler-adapters.ts:113-117` |
| Operator chat agent prompt | `src/app/api/agency-chat/route.ts:1536, 1541, 1544` (instructs the LLM to surface this action) |

Author intent is documented at `src/lib/clay/intelligent-clay-registry.ts:157`:
> *"approve_brief targets content_briefs.status = 'approved'."*

So the author *meant* to introduce a new state called `'approved'` and forgot to update the constraint migration to allow it. Best guess at the *correct* value: `'accepted'` (Path 2), because it matches the convention already in production at `agency/brief-review/route.ts:196`, requires no schema change, and avoids touching every downstream reader. But that is an interpretive call, not a mechanical one.

### 3. Risk if bundled with the VPS cleanup — **MEDIUM**

Bundling forces a decision between Path 1 and Path 2 right now, while the VPS migration is in flight. Either path involves work outside the scope of "drop a column":

- Path 1 brings in a schema constraint change *plus* a data backfill *plus* a downstream-reader audit (UI badges, dashboard tabs, filters, triage logic). That is its own PR's worth of testing.
- Path 2 is a one-line code change with no schema change, but it still requires verifying that "Approve" in the operator UI does the right thing end-to-end and that the registry comment gets updated.

The risk is not that the SQL is hard; it's that "fix the broken Approve button" is a behavior change that turns a silently-broken feature back on, and we will not know what other parts of the system assume it stays broken. That belongs in a focused PR with its own QA pass.

### 4. Risk if left alone for now — **LOW-to-MEDIUM**

The current state of the world: the operator's "Approve" button is already broken, has been broken since the action handler was wired up, and is failing in a *visible* way (the user gets an error message; nothing silently corrupts). No data is being damaged. Operators are presumably either ignoring the button or using the working `agency/brief-review` flow instead. The cost of waiting is "the broken button stays broken for a few more days/weeks", which is the same cost as today.

It does need to be fixed eventually, but it is a self-contained product bug, not a schema-cleanup concern.

### 5. Recommendation

**DEFER.** The fix is a semantic decision (`'approved'` vs `'accepted'`) plus a downstream-reader audit, not a schema cleanup; mixing it into the VPS migration risks turning a focused infrastructure PR into a behavior-change PR.

---

## FINAL RECOMMENDATION

### The three options

- **OPTION 1:** Drop `vps_prediction` only. Defer both A and B.
- **OPTION 2:** Drop `vps_prediction` + add the CHECK constraint to `completion_status` (Issue A). Defer B.   ✅ **RECOMMENDED**
- **OPTION 3:** Drop `vps_prediction` + fix both A and B.

### Recommendation: **OPTION 2**

In plain English: do the column drop *and* add the missing safety-net constraint, but leave the broken "Approve" button for a separate, focused fix.

**Why this is the safest option:**

The `vps_prediction` drop and the `completion_status` CHECK constraint are the same kind of work — both are "tighten up the schema, no behavior changes, no UI changes, no decisions to make about what something *means*". They both touch the `content_briefs` table, both are additive-or-subtractive at the schema level only, and both can be verified before they run with a single `SELECT` query against the live database. Bundling them keeps the migration coherent: one PR, one table, one purpose ("clean up the schema").

The "Approve" button issue, by contrast, is a different *kind* of problem. It is not "the schema is sloppy"; it is "the application has two competing ideas about what 'approval' means and one of them never worked". Fixing it requires picking which idea wins, then auditing every screen that displays a brief's status to make sure the chosen value renders correctly. That is product work, not infrastructure work, and bundling product work with infrastructure work is exactly how migrations grow tentacles and have to be rolled back at 2 a.m. The button is already broken in a visible, contained, non-destructive way; another week of brokenness costs nothing.

The pre-flight check before applying the bundled migration is one query:

```sql
SELECT DISTINCT completion_status FROM content_briefs;
```

If every row returns one of `delivered, acknowledged, in_production, published, NULL`, the CHECK is safe. If anything else appears, hold the migration and investigate the outlier first. That single query is the entire safety net needed to bundle Issue A.

---

*Report complete. File written to `./CLEANUP_SCOPE_DECISION_2026-04-23.md`.*
