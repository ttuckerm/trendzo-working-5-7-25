# OB Step 1 Investigation — Creator Invitation flow (OB-1)

Date: 2026-04-26
Scope: read-only audit of the invite path end-to-end
Reference: SUBSTRATE_AUDIT_2026-04-21.md Section 3.2, AI EMPLOYEE ARCHITECTURE doc (Onboarding Specialist OB-1)

---

## Summary table

| Component | Status | Risk |
|---|---|---|
| A. Handler entry (case dispatch, adapter registration, system-prompt advertisement) | Wired correctly end-to-end | CLEAN |
| B. Dashboard entry (parallel UI for invite) | No invite UI exists in Dashboard | GAP (parity) |
| C. Handler body (`sendInvite`) — DB write present, email stubbed | Comment says "ships in Turn 4"; no email transport called | BUG (silent stub) — HIGH RISK |
| D. Read path (`agency-chat/route.ts:502` queries `agency_invitations`) | Table name typo — plural vs singular | BUG — MEDIUM RISK |
| E. Schema for `agency_invites` (OB-1 columns) | All OB-1 columns present | CLEAN |
| E'. Schema for `agency_invites` (OB-3 nudge columns) | `nudge_count`/`last_nudge_at`/`nudge_stage` absent | GAP (blocks OB-3) |
| F. Email-send infrastructure (`src/lib/email/send-brief.ts`) | Healthy, reusable template (nodemailer + SMTP env) | CLEAN |
| G. Audit trail emit for invite | `sendInvite` emits no domain event (e.g. `invite.sent`) | GAP — LOW RISK |

Headline issues, classified:
- Silent stub (no email actually sent): **HIGH RISK** — operator UI says "Invite queued"; creator inbox sees nothing. Trust killer.
- Table-name collision (`agency_invitations` vs `agency_invites`): **MEDIUM RISK** — silent failure inside `safeQuery`; the AI assistant never sees the invite list in its context. One-character fix.
- Missing audit-trail emit: **LOW RISK** — observability gap, no functional break.
- Missing Dashboard UI parity: **MEDIUM RISK** — violates "every workflow works in both Clay and Dashboard" architecture invariant.

---

## A. Handler entry — Clay/Dashboard call sites

**Switch case in `src/lib/clay/action-handler.ts`:**
- Case label: `'send_invite'` — `action-handler.ts:156`
- Dispatches to: `sendInvite(db, action.payload, context)` — `action-handler.ts:157`
- Function definition: `sendInvite` — `action-handler.ts:699-725`

**Proposal gating (handler-adapters.ts):**
- `sendInviteAdapter` defined at `src/lib/agent/handler-adapters.ts:124-135`
- Schema (`sendInviteSchema`, lines 120-123) requires `creatorEmail` and `creatorName`
- Registered in the `ADAPTERS` map at `handler-adapters.ts:256` as `send_invite: sendInviteAdapter`
- → Tool registry generates a `propose_send_invite` tool and the agent must propose-then-confirm before the write fires (matches Phase 2 v2 propose-only pattern from Substrate Pivot).
- Direct (ActionButton) path also works: `AgencyClient.tsx:1118-1125` defines a `send_invite` actionHandler that builds a `handleComponentAction(...)` payload with the same shape.

**Registry (system-prompt context):**
- `src/lib/clay/intelligent-clay-registry.ts:159-170` — entry status `'dead'`, `kind: 'external'`, `targetTable: 'agency_invites'`, `requiredPayload: ['creatorEmail', 'creatorName']`. Notes line 169: *"Must handle Nodemailer send failure → surface 'Email failed to send' and log to chairman_alerts."* This is the spec the current handler does NOT meet.

**System prompt advertisement (`src/app/api/agency-chat/route.ts`):**
- Listed in the operator Actions enumeration: `route.ts:1586` (`send_invite` in the comma-separated list).
- Listed as a propose tool in the agent-write block: `route.ts:1589` (`propose_send_invite`).

→ Component A is wired. The invite IS reachable from Clay both as a direct ActionButton and as an agent-proposed write.

---

## B. Dashboard entry

Search method: `Grep -i "invite|Invite"` over `C:\Projects\CleanCopy\src\app\agency\dashboard\` and direct read of `DashboardClient.tsx`.

Result: **no matches.** `DashboardClient.tsx` (1+ sections sampled) imports `AgencyDashboardHeader`, `DimensionButtons`, `TrendsView`, `AccuracyView`, `RankView`, `RevenueView`, `ClayPanel` (lines 5-13). None of the dashboard's own components reference invite — directory listing of `src/app/agency/dashboard/components/` returned 10 files: `AccuracyView.tsx`, `ClayPanel.tsx`, `DimensionButtons.tsx`, `IconSidebar.tsx`, `MomentumView.tsx`, `RankView.tsx`, `RevenueView.tsx`, `ScheduleStrip.tsx`, `TrendsView.tsx`, `tokens.ts`. None named or referencing invite.

The only path to inviting a creator from Dashboard today is the embedded `ClayPanel` (chat surface) — i.e. the operator must drop into Clay anyway. There is no first-class "Invite Creator" button or form.

→ **Parity GAP.** Per the doc's invariant that every workflow must work in both Clay and Dashboard, OB-1 needs a Dashboard surface (button + modal/form, or a dedicated `InvitedCreatorsList` panel with an "Invite" CTA).

---

## C. The handler body (`sendInvite`, action-handler.ts:699-725)

Line-by-line:
- L700: `const email = String(payload.creatorEmail || payload.email || '').trim().toLowerCase()`
- L701: `const name  = String(payload.creatorName  || payload.name  || '').trim()`
- L702: `if (!email) return fail('Email address required')`
- L704-715: Upsert into table `'agency_invites'` (singular):
  - Columns written: `agency_id`, `creator_email`, `creator_name` (or null), `invited_by`, `status: 'pending'`
  - `onConflict: 'agency_id,creator_email'` (matches the `UNIQUE(agency_id, creator_email)` constraint in the migration)
  - Columns NOT explicitly set (rely on DB defaults): `id` (uuid default), `invited_at` (default `NOW()`), `sent_at` (NULL), `accepted_at` (NULL), `error_message` (NULL)
- L716: `if (error) return fail(\`Failed to queue invite: ${error.message}\`)` — the upsert IS error-checked.
- L718: **stub comment** — `// Email send lives in Phase 1 Turn 4; for now the invite row is queued.`
- L719-724: returns `ok('send_invite', \`Invite queued for ${name || email}\`, 'Delivery pipeline ships in Turn 4; invite row recorded.', { email, name })`

Email-send call: **NONE.** Searched the function body — no `nodemailer`, no `sendMail`, no `sendgrid`, no `resend`, no fetch to any transport. The audit's claim is verified.

DB write wrapped in try/catch: the OUTER `handleComponentAction` switch is wrapped in try/catch (line 88) which catches any throw and returns `fail`. The inner upsert relies on Supabase's returned `error` object (L716). If both succeed, returns `ok(...)` with the structured confirmation — operator sees green checkmark.

Confirmation UI: `ok(...)` returns `kind: 'structured'` ActionConfirmationPayload — title says "Invite queued for X". The subtitle text "Delivery pipeline ships in Turn 4; invite row recorded." is technically honest ABOUT the stub, but no operator reads that subtitle as "your creator did not get an email."

Audit comment at action-handler.ts:675 (per the audit): the LINE NUMBER HAS SHIFTED. The actual stub comment is now at **line 718** (the file has grown since the 2026-04-21 audit). The exact comment text matches: `// Email send lives in Phase 1 Turn 4; for now the invite row is queued.`

→ **BUG (silent stub).** The `ok(...)` confirmation lies about the outcome from the operator's UX perspective. HIGH RISK — this is the substrate pivot's exact failure mode (DB-only writes pretending to be end-to-end actions).

---

## D. The agency-chat read path — table-name collision

**Query location:** `src/app/api/agency-chat/route.ts:502`
```
safeQuery(() => serviceClient.from('agency_invitations')
  .select('*').eq('agency_id', agencyId).order('created_at', { ascending: false })),
```

The result is destructured into `inviteData` (route.ts:491) and assigned to `invitations` (route.ts:522), which is then folded into `pipelineData` for the AI's context-assembly compression (`includeOnboarding` branch, L1492 + L1500-1502).

**Write location:** `src/lib/clay/action-handler.ts:705` writes `'agency_invites'` (singular).

**Migration:** `supabase/migrations/20260417_phase1_action_scaffolding.sql:10` creates `CREATE TABLE IF NOT EXISTS agency_invites (...)`. **No table named `agency_invitations` is defined anywhere in the migrations directory.** (Confirmed by searching for `agency_invit` in `src/` — only three hits: the registry, the read path, and the write — no migration file other than 20260417 defines either.)

**Why it fails silently:** `safeQuery` at `agency-chat/route.ts:485-487` swallows errors and returns `null`. So the AI assistant's onboarding context block always sees zero invitations even when the agency has invited creators. There is no thrown error, no log at the chat layer.

**Classification:** typo — one-character fix in `route.ts:502` (`agency_invitations` → `agency_invites`). The columns selected (`*`) are compatible with the schema in component E. The write side is correct; the read side is wrong.

---

## E. The `agency_invites` schema

Source: `supabase/migrations/20260417_phase1_action_scaffolding.sql` lines 10-26.

| Column | Type | Constraint |
|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` |
| `agency_id` | UUID | NOT NULL |
| `creator_email` | TEXT | NOT NULL |
| `creator_name` | TEXT | nullable |
| `invited_by` | UUID | nullable |
| `invited_at` | TIMESTAMPTZ | NOT NULL DEFAULT `NOW()` |
| `status` | TEXT | NOT NULL DEFAULT `'pending'`; CHECK `IN ('pending','sent','accepted','declined','expired','failed')` |
| `sent_at` | TIMESTAMPTZ | nullable |
| `accepted_at` | TIMESTAMPTZ | nullable |
| `error_message` | TEXT | nullable |

Constraints/indexes:
- `UNIQUE(agency_id, creator_email)` (line 22)
- Index `idx_agency_invites_agency_status` on `(agency_id, status)` (lines 25-26)

Compared to doc OB-1 requirements (id, agency_id, creator_email, creator_name, invited_by, invited_at, status, sent_at, accepted_at, error_message): **ALL PRESENT.** Status CHECK already includes the lifecycle values needed (`sent`, `failed`, `accepted`, `expired`, `declined`).

OB-3 requirements (nudge_count, last_nudge_at, nudge_stage on `agency_invites`):
- The same migration adds `nudge_count INTEGER DEFAULT 0` at **line 62** — but to `content_briefs`, NOT `agency_invites`.
- `content_briefs.last_nudged_at` exists (line 61); note name mismatch (`last_nudged_at` vs doc's `last_nudge_at`).
- `nudge_stage`: not in any migration.
- **Confirmed: the OB-3 nudge columns on `agency_invites` are absent.** OB-1 build can ignore this; OB-3 will need a follow-up migration.

→ Schema is clean for OB-1; gap for OB-3.

---

## F. Email-send infrastructure that already exists

File: `src/lib/email/send-brief.ts` (203 lines).

Exports:
- `interface SendBriefResult { success: boolean; error?: string }`
- `async function sendBriefToCreator(briefId: string): Promise<SendBriefResult>`

Internal helpers (file-private): `esc()`, `buildEmailHtml()`, `buildEmailText()`.

Dependencies:
- `@supabase/supabase-js` (createClient) — for reading the brief + creator profile, writing back `delivery_status`/`delivered_at`.
- `signBriefAckToken` from `@/lib/email/brief-ack-token` — HMAC ack-token signing.
- `nodemailer` — dynamic import (`await import('nodemailer')`), pattern from `src/lib/ops/notifier.ts`.

Env vars consumed:
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (config sanity check at L124-126)
- `NEXT_PUBLIC_APP_URL` || `APP_URL` (ack URL base, L156)
- `BRIEF_ACK_SECRET` (via `signBriefAckToken`; throws if unset)
- `BRIEF_EMAIL_FROM` || `ALERT_EMAIL_FROM` (sender; fail with explicit message if missing, L169-173)
- `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_SECURE` (default `'false'`), `SMTP_USER`, `SMTP_PASS`

Failure modes (already handled):
- Missing creator email → marks brief `delivery_status='failed'` and returns `{success:false, error}`.
- Missing `BRIEF_ACK_SECRET` → marks failed, returns error.
- Missing `BRIEF_EMAIL_FROM` → marks failed, returns error.
- Nodemailer init failure → marks failed, returns error.
- SMTP send failure → marks failed, returns error.
- Success → updates `delivery_status='delivered'`, sets `delivered_at`.

→ **CLEAN, reusable.** This is the template the OB-1 fix should mirror. The clay registry (`intelligent-clay-registry.ts:168`) already names the planned filename: `lib/email/send-invite.ts`. A new `sendInviteEmail(inviteId)` function modeled directly on `sendBriefToCreator(briefId)` would: read the `agency_invites` row, pull invitee email/name, build subject + HTML/text, sign an "accept invite" token (likely a new `signInviteToken` mirroring `signBriefAckToken`), send via the same nodemailer/SMTP path, and on success update `agency_invites.status='sent'`, `sent_at=NOW()`. On failure, set `status='failed'`, write `error_message`.

---

## G. Audit trail

Emit infrastructure: `src/lib/events/emit.ts` exports `emitEvent` (silent on failure, L11-39) and `emitEventStrict` (throws, L45-69). Both write a row to `platform_events` with `event_type`, `payload`, `actor_*`, `agency_id`, `correlation_id`, `entity_type`, `entity_id`.

`handleComponentAction` already emits a generic `'action.confirmed'` event at `action-handler.ts:76-86` BEFORE the switch dispatches — so EVERY action records a generic confirmation. This is NOT an invite-domain event; it's a transport-layer ack with `payloadKeys` only.

`sendInvite` itself (lines 699-725) emits **no domain event.** Searched for `'invite.` event-type strings across `src/` — no matches.

Comparable handlers that DO emit:
- `nudgeCreator` at `action-handler.ts:736-753` emits `'nudge.sent'` via `emitEventStrict` with payload `{source, brief_id, creator, new_nudge_count, email_sent}`. This is the pattern to mirror.
- `updateBriefStatus` at L481-497 emits `'brief.status_changed'`.
- `logBriefPerformance` at L582-599 emits `'performance.logged'`.

→ **GAP.** Per AM Step 5, every write handler should emit a per-domain event. Suggested for OB-1: `'invite.sent'` on success and `'invite.failed'` on email transport failure, mirroring nudge-creator's payload shape:
```
eventType: 'invite.sent',
payload: { source: 'operator-action', invite_id, creator_email, creator_name, email_sent: true },
actorType: 'user',
agencyId: uuidOrNull(context.agencyId),
entityType: 'agency_invite',
entityId: <invite row id>,
```

---

## H. Risk classification (consolidated)

| Issue | Classification | Risk |
|---|---|---|
| `sendInvite` writes DB but never sends email; `ok(...)` confirmation tells operator it worked | BUG (silent stub) | **HIGH** — feature appears to work; creator never knows; substrate-pivot failure mode |
| `agency-chat/route.ts:502` queries non-existent `agency_invitations`; `safeQuery` swallows error | BUG (typo) | **MEDIUM** — agent context misses invite list; AI cannot reason about pending invites; one-char fix |
| No `invite.sent` / `invite.failed` emits to `platform_events` | GAP (observability) | **LOW** — no functional break; blocks observability + downstream OB-3 stall detection that may want to query the event stream |
| No Dashboard UI surface for invite | GAP (parity) | **MEDIUM** — violates two-UI invariant; only Clay-side operators can invite |
| `agency_invites.{nudge_count,last_nudge_at,nudge_stage}` absent | GAP (out of OB-1 scope) | **LOW** for OB-1 (clean); blocks OB-3 |
| Schema for OB-1 itself | CLEAN | — |
| Email infra (send-brief.ts) reusable | CLEAN | — |
| Adapter wiring + system-prompt advertisement | CLEAN | — |

---

## Recommendation

The OB-1 build prompt should ship four things together, in this order:

1. **New email module** — Create `src/lib/email/send-invite.ts` modeled on `send-brief.ts`. Export `sendCreatorInvite(inviteId): Promise<{success:boolean; error?:string}>`. It reads the `agency_invites` row, signs an accept-invite token (mirror `signBriefAckToken`), builds a Trendzo-branded HTML+text email with an "Accept invitation" CTA, sends via the same nodemailer/SMTP env, and on success updates `agency_invites.status='sent'` + `sent_at=NOW()`. On failure, sets `status='failed'` + `error_message`. Add `INVITE_ACK_SECRET` (or reuse `BRIEF_ACK_SECRET` if scope allows) and a `/api/invite-acknowledge/[id]` route similar to `/api/brief-acknowledge`.
2. **Wire the handler** — Modify `sendInvite` in `action-handler.ts:699-725` to (a) capture the inserted row's `id` from the upsert (use `.select('id').single()`), (b) call `sendCreatorInvite(insertedId)`, (c) on transport failure, return `fail(...)` with the email error (do NOT return `ok` — this is the trust-killer), (d) on transport success, return `ok` with honest copy ("Invite emailed to X"). Remove the "ships in Turn 4" stub comment.
3. **Fix the table-name typo** — Change `'agency_invitations'` → `'agency_invites'` at `agency-chat/route.ts:502`. Verify the AI's onboarding context now actually shows pending invites.
4. **Emit the audit event** — In the same `sendInvite`, on success emit `'invite.sent'` via `emitEventStrict` (entity_type=`'agency_invite'`, entity_id=invite.id). On transport failure (DB row exists but email failed), emit `'invite.failed'` so OB-3 stall detection can observe both sides. Mirror the `nudgeCreator` shape exactly.

Defer Dashboard parity (component B) to a follow-up prompt — it's UI work that doesn't gate the trust fix and warrants a small design pass (probably a "Creators → Invite" tab with a pending-invites table + "Invite creator" button + modal). The schema for OB-1 is already clean, so no migration is required for this fix; the OB-3 nudge columns can wait for an OB-3-specific migration when stall detection is built.

The single most important change is step 2: stop returning `ok` until the email actually sent. Everything else is structural cleanup.
