# AM Step 5 Investigation — platform_events emission discipline
Date: 2026-04-26
Scope: read-only audit of three write handlers
Baseline: AM Step 4 standard (commit 39861a8)

## Summary table

| Handler | Emits domain event? | Variant | actor_id type | agency_id | try/catch | Risk |
|---|---|---|---|---|---|---|
| update_brief_status | No (only generic `action.confirmed` from line 75) | n/a (none in handler body) | n/a (string passed in shared line-75 emit) | n/a (string passed in shared line-75 emit) | n/a (`.catch(() => {})` on line-75 emit only) | GAP |
| nudge_creator (action-handler entry) | No | n/a | n/a | n/a | n/a | GAP |
| nudge_creator (shared helper `runNudgeForBrief`) | No (zero `emitEvent*` imports) | n/a | n/a | n/a | n/a | GAP |
| log_performance | No (only generic `action.confirmed` from line 75) | n/a | n/a | n/a | n/a | GAP |

> Shared cross-cutting emit at `src/lib/clay/action-handler.ts:75-85` fires ONE generic `action.confirmed` event for every dispatched case (including all three audited). It uses non-strict `emitEvent`, passes `actorId: context.userId` as a string (no `uuidOrNull()` coercion), passes `agencyId: context.agencyId` as a string, and is wrapped only by a terminal `.catch(() => {})`. It is the same line for all three handlers — it does NOT substitute for a per-domain event.

---

## Handler 1: update_brief_status

**Dispatch:** `src/lib/clay/action-handler.ts:131-135` (case label `'update_brief_status'`) → `updateBriefStatus(db, action.actionId, newStatus, publishedUrl)` defined at `src/lib/clay/action-handler.ts:430-507`.

### A. Emission presence
- The function body of `updateBriefStatus` (lines 430-507) calls **neither** `emitEvent` nor `emitEventStrict`. No domain event such as `brief_status.updated` is recorded.
- The only emit call that fires when this case is dispatched is the generic top-of-handler call at `src/lib/clay/action-handler.ts:75-85`, which fires **before** the switch and therefore fires regardless of which case wins.
- **GAP**: there is no domain-specific event for "brief status changed" that downstream queries (e.g. operator analytics, agent replay) can pivot on.

### B. The shared line-75 emit (relevant only because no per-handler emit exists)
- **Variant**: `emitEvent` (non-strict — swallows errors via `console.error` inside `emit.ts:33-38`).
- **event_type**: `'action.confirmed'`.
- **Payload shape**: `{ actionType: action.type, actionId: action.actionId, payloadKeys: Object.keys(action.payload ?? {}) }`. Note: payload keys are listed by name only — the actual `new_status` value and `published_url` are NOT captured.
- **actor_id**: `context.userId` (passed verbatim as a string). This is a **bug surface** — `actor_id` is `uuid` per `supabase/migrations/20260319_platform_events.sql:9`. If `context.userId` is the `'dev-user'` sentinel or any non-UUID string, Postgres rejects the insert with `invalid input syntax for type uuid`. `uuidOrNull()` from `src/lib/agent/correlation-context.ts:48` is **NOT** used here.
- **agency_id**: `context.agencyId` (passed verbatim as a string; same uuid-coercion concern).
- **try/catch**: a terminal `.catch(() => {})` on the emit promise (line 85). Errors are silently dropped — there is no `errors[]` accumulation, no log surface beyond `emit.ts`'s own `console.error`.

### C. Comparison to AM Step 4 baseline
- Baseline uses `emitEventStrict` with per-call-site `try/catch` that pushes failures into an `errors[]` array; this handler uses non-strict `emitEvent` plus a swallowing `.catch(() => {})`.
- Baseline removes `actor_id` entirely; this handler passes `context.userId` as a string directly into `actorId`.
- Baseline puts the route identifier in `payload.source`; this handler has no per-domain payload at all (the line-75 emit is generic and shared by every case).
- **Divergence on every dimension.**

### D. Risk classification
- **GAP** — no domain emission exists; one needs to be added to record the status transition (`previous_status`, `new_status`, `brief_id`, `agency_id`, `published_url`). The fix is not a one-line variant swap; it is a new emit site inside `updateBriefStatus` after the successful `update` at line 473.

---

## Handler 2: nudge_creator

**Dispatch:** `src/lib/clay/action-handler.ts:158-160` (case label `'nudge_creator'`) → `nudgeCreator(db, action.actionId, action.payload, context)` defined at `src/lib/clay/action-handler.ts:685-699`.

`nudgeCreator` is a thin wrapper that delegates to the shared helper `runNudgeForBrief` (imported at `src/lib/clay/action-handler.ts:6` from `src/lib/account-manager/auto-nudge.ts`).

### A. Emission presence — action-handler entry (`nudgeCreator`, lines 685-699)
- No `emitEvent` or `emitEventStrict` call inside the wrapper. It only delegates to `runNudgeForBrief` and shapes the result into `ok(...)` / `fail(...)`.
- Like every action, the generic `action.confirmed` at line 75 fires upstream of dispatch.
- **GAP**: no `nudge.sent` (or equivalent) event for the operator-triggered nudge path.

### A. Emission presence — shared helper (`runNudgeForBrief`, `src/lib/account-manager/auto-nudge.ts:20-73`)
- The helper file does **not import** `emitEvent` or `emitEventStrict` at all (`grep emitEvent src/lib/account-manager/auto-nudge.ts` returns zero matches). It performs the DB update + email send and returns a result struct; emission is the caller's responsibility by design.
- **GAP**: this is intentional separation of concerns — the cron route emits around the helper call (see baseline reference below). The operator-driven path simply never adds the matching emit, so operator nudges leave no `auto_nudge.sent`-equivalent trail in `platform_events`.

### B. For the (zero) emit calls in this handler
Nothing to document — there are no per-handler emit calls.

For reference, the upstream cron route emits the events the operator path is missing (`src/app/api/cron/auto-nudge-unacknowledged/route.ts`):
- Line 108: `emitEventStrict({ eventType: 'auto_nudge.dry_run', payload: { source: 'auto-nudge-unacknowledged', brief_id, creator_id, ... }, actorType: 'cron', agencyId: row.agency_id, ... })` — no `actorId`.
- Line 134: `emitEventStrict({ eventType: 'auto_nudge.sent', payload: { source: 'auto-nudge-unacknowledged', brief_id, creator, new_nudge_count, email_sent }, actorType: 'cron', agencyId: row.agency_id, ... })` — no `actorId`.
- Line 191: `emitEventStrict({ eventType: 'auto_nudge.escalated_dry_run', ... })`.
- Line 249: `emitEventStrict({ eventType: 'auto_nudge.escalated', ... })`.
- Each call is wrapped by the per-iteration `try { ... } catch (e: any) { errors.push(...) }` at lines 106-151 and 169-265.

### C. Comparison to AM Step 4 baseline
- Baseline (the cron route at lines 108, 134, 191, 249) uses `emitEventStrict`, omits `actor_id`, places `source: 'auto-nudge-unacknowledged'` in payload, and wraps each emit in a per-iteration `try/catch` that records failures in `errors[]`.
- The operator-driven nudge path (action-handler `nudgeCreator` + shared helper) emits **nothing** at the domain level. It is not "one variant swap away" from baseline — it is missing the emit site entirely.

### D. Risk classification
- **GAP** — operator nudges produce zero entries in `platform_events` for the nudge action itself. Adding a `nudge.sent` (or `auto_nudge.sent` for parity) emit inside `nudgeCreator` after a successful `runNudgeForBrief` result would close this. Suggested shape, mirroring the cron route at line 134-147: `emitEventStrict({ eventType: 'nudge.sent', payload: { source: 'operator-action', brief_id: briefId, creator: result.creator, new_nudge_count: result.newNudgeCount, email_sent: result.emailSent === true }, actorType: 'user', agencyId: context.agencyId, entityType: 'content_brief', entityId: briefId })` — note `actorType: 'user'` here (cron uses `'cron'`), and **no `actorId`** per the Step 4 baseline.

---

## Handler 3: log_performance

**Dispatch:** `src/lib/clay/action-handler.ts:137-141` (case label `'log_performance'`) → `logBriefPerformance(db, action.actionId, views, engagement)` defined at `src/lib/clay/action-handler.ts:509-588`.

### A. Emission presence
- The function body of `logBriefPerformance` (lines 509-588) calls **neither** `emitEvent` nor `emitEventStrict`. No domain event such as `performance.logged` is recorded.
- Only the generic `action.confirmed` from line 75 fires when this case is dispatched.
- **GAP**: no domain-specific event for "actual performance recorded" — which is precisely the event the agent loop and downstream feedback systems (VPS calibration, training data ingestion) would want to subscribe to.

### B. The shared line-75 emit
Identical surface to Handler 1 — see Handler 1 § B for the full breakdown:
- `emitEvent` (non-strict).
- `event_type: 'action.confirmed'`.
- payload only carries `actionType`, `actionId`, `payloadKeys` — the actual `actual_views` / `actual_engagement_rate` / computed `delta` values are NOT captured.
- `actor_id`: `context.userId` passed as a string with no `uuidOrNull()` coercion — same uuid-rejection bug surface.
- `agency_id`: `context.agencyId` passed as a string with no coercion.
- try/catch: only a terminal `.catch(() => {})` on line 85.

### C. Comparison to AM Step 4 baseline
- Same divergence pattern as Handler 1: non-strict variant; raw string `actor_id`; no `source` in payload; no per-call-site `try/catch` beyond the swallowing `.catch`.

### D. Risk classification
- **GAP** — no domain emission exists. Fix is a new emit site inside `logBriefPerformance` after the successful `update` at line 544, ideally capturing `brief_id`, `agency_id`, `actual_views`, `actual_engagement_rate`, `predicted_vps`, and `performance_delta` so downstream consumers can join measurement to prediction without a second DB hop.

---

## Recommendation

All three handlers diverge from the AM Step 4 baseline in **the same direction** — none of them emit a per-domain event at all, and the only emission they currently produce is the cross-cutting `action.confirmed` at `src/lib/clay/action-handler.ts:75-85`, which carries neither the mutation's outcome data nor a strict failure mode. So directionally one fix shape applies: for each, add a per-domain `emitEventStrict` call at the success-path tail (after line 473 in `updateBriefStatus`, after `runNudgeForBrief` returns success in `nudgeCreator` at line 691, after line 544 in `logBriefPerformance`), each wrapped in its own `try/catch` that converts a strict failure into a returned `fail(...)` (or warning) rather than crashing the handler.

That said, the three are not literally identical fixes: each needs different payload shape (status transition vs nudge bookkeeping vs performance metrics + delta) and a different `event_type` namespace. Separately, the shared line-75 emit is itself a latent bug: it passes `context.userId` straight into `actorId` without `uuidOrNull()` from `src/lib/agent/correlation-context.ts:48`, and the `platform_events.actor_id` column is `uuid` (per `supabase/migrations/20260319_platform_events.sql:9`). If `context.userId` is the `'dev-user'` sentinel or anything non-UUID, every `action.confirmed` insert silently fails — but the swallowing `.catch(() => {})` on line 85 hides it. Worth fixing line 75 to use `uuidOrNull(context.userId)` and `uuidOrNull(context.agencyId)` in the same workstream that lands the per-domain emits, so the audit trail is actually intact end-to-end.
