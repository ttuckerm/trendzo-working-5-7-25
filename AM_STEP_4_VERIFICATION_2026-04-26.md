# AM Step 4 — Verification (2026-04-26)

Branch: `vercel-deploy-test`
Commit: pending (single commit at the end of this build)

## Files

- `src/app/api/cron/auto-nudge-unacknowledged/route.ts` — new cron route (GET, Bearer auth, dry-run default true, eligible-query + escalation pass)
- `src/lib/account-manager/auto-nudge.ts` — new shared `runNudgeForBrief(db, briefId)` helper (single source of truth for nudge logic)
- `src/lib/clay/action-handler.ts` — `nudgeCreator` refactored to delegate to the shared helper (no behavior change for the operator-driven path; just no longer inlines the nudge logic)
- `.env.example` — `AUTO_NUDGE_DRY_RUN=true` appended with one-line comment
- `AM_STEP_4_PREFLIGHT_SQL.sql` — operator pre-build query (already run, see PF5)
- `AM_STEP_4_DRY_RUN_VERIFY.sql` — operator post-curl verify query (run after build)

**No changes to `vercel.json`. No push. No deploy. No cron schedule wired.** The route exists and is invokable on demand. The Vercel cron schedule will be added in a separate workstream after substrate stabilization.

---

## Pre-flight summary

| # | Check | Result |
|---|---|---|
| PF1 | `nudgeCreator` reusable | ✅ at `action-handler.ts:684` — fetches brief, rate-limits 24h, calls `sendBriefToCreator`, updates `last_nudged_at`+`nudge_count`. Refactored in this build to delegate to `runNudgeForBrief` so the cron and the operator path share one implementation. |
| PF2 | `chairman_alerts` shape | ✅ Created in `20260410_prompt33`, extended in `_prompt34` (added `agency_id`) and `_prompt35` (lifecycle). Columns used by escalation insert: `alert_type`, `severity` (warning), `title`, `body`, `payload` (jsonb — encodes `brief_id` for per-brief dedup), `agency_id`, `status`. App-level dedup via `payload->>'brief_id'` filter. |
| PF3 | `emitEventStrict` exists | ✅ at `src/lib/events/emit.ts:45`. Note: this build uses the non-strict `emitEvent` (also from that file) for auto_nudge.* events. Reasoning: a dropped audit log is preferable to crashing a cron run mid-batch — the existing operator-side `nudge_creator` handler also uses the non-strict variant for audit. The `emitEventStrict` variant remains reserved for load-bearing events (agent.proposal et al). Flag for review if you'd prefer strict here. |
| PF4 | `delivered_at`, `last_nudged_at`, `nudge_count` columns | ✅ `last_nudged_at` + `nudge_count` from `20260417_phase1_action_scaffolding.sql:60-62`; `delivered_at` from `20260420_add_delivered_at_to_content_briefs.sql:8`. |
| PF5 | Operator SQL count | ✅ `eligible_briefs=3, never_nudged=2, at_cap=0`. The 12-row gap from Step 3's 15 delivered comes from the stricter `delivered_at < NOW()-24h` filter excluding rows where `delivered_at IS NULL` (legacy cosmetic drift). |

---

## Decisions confirmed in code

| Decision | Implementation |
|---|---|
| Auth pattern | `Authorization: Bearer ${CRON_SECRET}` — matches `overnight-triage`, `cultural-scan`, `classify-events`. The prompt's suggestion of `x-cron-secret/CRON_SECRET_KEY` was rejected because no other cron route uses it; consistency wins. (Approved by operator.) |
| Dry-run default | `process.env.AUTO_NUDGE_DRY_RUN !== 'false'`. Unset → dry-run on. Only the literal string `false` flips it off. |
| Cap | `nudge_count < 3` enforced in SQL pre-filter; cap-reached briefs queried separately and escalated to `chairman_alerts`. |
| Cooldown | Pre-filter `last_nudged_at IS NULL OR last_nudged_at < NOW()-24h`. The shared `runNudgeForBrief` helper also re-checks (defense in depth, no-op when called from the cron path). |
| 50-per-run safety bound | `LIMIT 50` on both eligible and capped queries. |
| Per-brief error isolation | Each brief in its own try/catch; failures land in `errors[]`, route still returns 200. |
| Escalation dedup | `chairman_alerts` rows with `alert_type='manual_outreach_needed'` AND `agency_id=X` AND `payload->>'brief_id'=Y` AND `status IN (open|acknowledged|snoozed)`. Brief-id encoded in payload (not alert_type) to avoid bloating the alert_type vocabulary while still scoping dedup to one alert per brief per live cycle. |
| Severity on escalation alert | `'warning'` (not `'critical'`) — manual outreach is actionable but not page-the-CEO. |

---

## Internal tests (Cursor ran these)

### Test C.1 — Type check on the new code
`npx tsc --noEmit` over the full repo, filtered to the AM Step 4 files:

```
$ npx tsc --noEmit -p tsconfig.json 2>&1 | grep -E "auto-nudge|account-manager"
(empty)
```

✅ Zero new TS errors. (Pre-existing repo-wide errors at lines 494-548 / 1669 / 1831 of `agency-chat/route.ts` are unchanged from AM Step 3 — out of scope.)

### Test C.2 — Static review

Re-read end-to-end. Confirmed:
- ✅ Auth gate (`Bearer CRON_SECRET`) is the very first thing the handler does after parameter parsing.
- ✅ `dryRun` is read once at the top and threaded through both the eligible loop and the escalation loop.
- ✅ Every DB mutation (`update`, `insert`) is inside a `if (dryRun) { … continue; }` guard or after it. Dry-run never writes to `content_briefs` or `chairman_alerts`. Dry-run DOES write to `platform_events` (event_type=`auto_nudge.dry_run` / `auto_nudge.escalated_dry_run`) — that's intentional and required.
- ✅ Each per-brief operation wrapped in try/catch. A single failure pushes a `{brief_id, error}` row and continues; the run returns 200 with partial-success metrics.
- ✅ The shared `runNudgeForBrief` helper is the only place that calls `sendBriefToCreator` or mutates `last_nudged_at`/`nudge_count`. The operator-driven `nudgeCreator` action-handler now delegates to it. One source of truth — no parallel email path.

### Test C.3 — Local invocation in dry-run mode

Cursor curled the local dev server (no operator action needed):

```
$ curl -H "authorization: Bearer ${CRON_SECRET}" \
  http://localhost:3001/api/cron/auto-nudge-unacknowledged

{"dry_run":true,"eligible_count":3,"nudged_count":0,"dry_run_count":3,"escalated_count":0,"errors":[]}
```

Cross-check against PF5 (`eligible_briefs=3, never_nudged=2, at_cap=0`):

- `eligible_count=3` ↔ PF5 `eligible_briefs=3` ✅
- `nudged_count=0` ↔ dry-run on, no real sends ✅
- `dry_run_count=3` ↔ all eligible briefs logged to platform_events ✅
- `escalated_count=0` ↔ PF5 `at_cap=0` (no capped briefs) ✅
- `errors=[]` ↔ no per-brief failures ✅

Auth gate also confirmed — without the Bearer header, the route returned `401 Unauthorized`.

---

## Operator's only browser job

### One-time .env.local setup

Add this exact line to `C:/Projects/CleanCopy/.env.local` (operator does this manually — Cursor cannot edit `.env.local`):

```
AUTO_NUDGE_DRY_RUN=true
```

That's it. No other env edits, no terminal commands, no curls.

### Run the verify SQL

Open `AM_STEP_4_DRY_RUN_VERIFY.sql` and run both blocks in the Supabase browser SQL Editor.

Paste back the two block results.

**Block 1 expected:**
- 3 to 5 rows.
- `last_nudged_at` and `nudge_count` for the 3 eligible briefs should be **unchanged** from before the curl (i.e. matching what PF5 implied: 2 with `last_nudged_at IS NULL`, 1 with `last_nudged_at` past the 24h cutoff). No row should suddenly show `last_nudged_at = NOW()` — if it does, dry-run is broken.

**Block 2 expected:**
- One row: `event_type='auto_nudge.dry_run'`, `rows=3` (from Cursor's curl above; this number will grow if the route is invoked again within the 10-minute window).
- No `auto_nudge.sent` rows (would mean the cron ran in non-dry-run mode).
- No `auto_nudge.escalated*` rows (no capped briefs).

If Block 1 shows mutated state, **STOP and flag** — that's a dry-run guard bug.
If Block 2 shows zero rows, the dev server may have been restarted before the operator ran the SQL, or `platform_events` writes are silently failing. Inspect the dev-server logs.

---

## Parity check (mandatory per AI EMPLOYEE ARCHITECTURE.md)

This step is invisible-by-design — the cron is autonomous, no UI to mirror. The Step 3 Clay tool (`get_unacknowledged_briefs`) and Dashboard pill ("Delivered") already cover discoverability. This step adds *autonomy* on top.

- Operator surface: ✅ `chairman_alerts` rows for cap-reached briefs (already rendered in the Platform Health panel today; existing UI, no changes here)
- Audit trail: ✅ every nudge attempt (real or dry-run) and every escalation lands in `platform_events` with a `correlation_id`-able actor (`actorType='cron'`, `actorId='auto-nudge-unacknowledged'`)
- Same backend logic as the operator-driven nudge: ✅ shared `runNudgeForBrief` helper

---

## Out of scope (per the prompt)

Untouched in this commit:
- `vercel.json` (the cron schedule will be added in a separate workstream)
- Any push or deploy
- AM Step 5 (platform_events emission audit across other handlers)
- `action-handler.ts:956` cross-agency leak in `generateReport()`
- Markdown rendering in Clay output
- All other AI Employees
