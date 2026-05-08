# OB-2 Onboarding Progress Tracking — Investigation

Date: 2026-04-29
Scope: Read-only audit. Clay-only. Maps current state of the codebase relevant
to "where each invited creator is in onboarding right now, and which ones are
stalled," so the build prompt can target the gaps precisely.

No code changes, no migrations, no design proposals.

---

## T1 — `onboarding_profiles` schema for OB-2

### Where the columns come from

`onboarding_profiles` is built up across three migrations:

- `supabase/migrations/20260321_core_onboarding_tables.sql:11-78` — initial
  CREATE TABLE.
- `supabase/migrations/20260321_onboarding_session3_columns.sql:4-20` — adds
  `differentiator`, `calibration_completed`, `manychat_connected`,
  `lead_magnet_type`, `niche_intelligence`, `proven_hooks`, `content_strategy`,
  `onboarding_completed`.
- `supabase/migrations/20260322_merge_calibration_into_onboarding.sql:11-48` —
  adds calibration columns including `creator_stage`, `dimension_scores`,
  `staged_at`. Also adds the `UNIQUE (user_id)` constraint and the
  `idx_onboarding_profiles_creator_stage` index (`...:66-68`).

The codebase does not contain a CREATE/ALTER that adds `agency_id` to
`onboarding_profiles`, but every read-side query treats `agency_id` as if it
exists (e.g. `src/lib/triage/overnight-triage.ts:51`
`.from('onboarding_profiles').select('agency_id')`, RLS policy at
`supabase/migrations/20260322_agency_scoped_rls.sql:65-66`). It is reasonable to
assume the column exists in the live DB even though no migration in `supabase/migrations/`
declares it. The chairman should confirm in production.

### Full column list (declared by migrations, in order)

| Column | Type | Source migration | Notes |
| --- | --- | --- | --- |
| `id` | uuid PK | 20260321_core | default `gen_random_uuid()` |
| `user_id` | uuid | 20260321_core | UNIQUE per `..._merge_calibration` |
| `created_at` | timestamptz | 20260321_core | default `now()` |
| `updated_at` | timestamptz | 20260321_core | default `now()` |
| **`onboarding_step`** | text | 20260321_core | default `'entry'` — see below |
| `onboarding_completed_at` | timestamptz | 20260321_core | nullable |
| `account_type` | text | 20260321_core | nullable; `'creator'` / `'agency'` |
| `business_name` | text | 20260321_core | |
| `business_description` | text | 20260321_core | |
| `offer_breakdown` | jsonb | 20260321_core | default `'[]'` |
| `customer_journey_steps` | jsonb | 20260321_core | default `'[]'` |
| `niche_key` | text | 20260321_core | |
| `subtopics` | jsonb | 20260321_core | default `'[]'` |
| `content_goals` | text[] | 20260321_core | default `'{}'` |
| `platform` | text | 20260321_core | default `'tiktok'` |
| `channel_handle` | text | 20260321_core | TikTok handle |
| `channel_verified` | boolean | 20260321_core | default `false` |
| `follower_count` | integer | 20260321_core | |
| `channel_data` | jsonb | 20260321_core | TikTok scrape result |
| `origin_story` | text | 20260321_core | |
| `wins_and_losses` | text | 20260321_core | |
| `current_position` | text | 20260321_core | |
| `content_exclusions` | jsonb | 20260321_core | default `'[]'` |
| `fun_facts` | jsonb | 20260321_core | default `'[]'` |
| `target_demographics` | jsonb | 20260321_core | |
| `audience_pain_points` | jsonb | 20260321_core | default `'[]'` |
| `audience_dream_result` | text | 20260321_core | |
| `audience_myths` | jsonb | 20260321_core | default `'[]'` |
| `audience_mistakes` | jsonb | 20260321_core | default `'[]'` |
| `brand_tone` | text[] | 20260321_core | |
| `editing_style_references` | jsonb | 20260321_core | default `'[]'` |
| `brand_colors` | jsonb | 20260321_core | |
| `brand_assets` | jsonb | 20260321_core | default `'[]'` |
| `competitor_handles` | jsonb | 20260321_core | default `'[]'` |
| `competitor_analysis` | jsonb | 20260321_core | |
| `calibration_preferences` | jsonb | 20260321_core | |
| `hook_style_preference` | text | 20260321_core | |
| `tone_match` | text | 20260321_core | |
| `pattern_saturation` | jsonb | 20260321_core | |
| `manychat_trigger_word` | text | 20260321_core | |
| `landing_page_url` | text | 20260321_core | |
| `lead_magnet_description` | text | 20260321_core | |
| `lead_magnet_url` | text | 20260321_core | |
| `niche_viral_patterns` | jsonb | 20260321_core | |
| `recommended_hooks` | jsonb | 20260321_core | |
| `content_strategy_summary` | text | 20260321_core | |
| `differentiator` | text | 20260321_session3 | |
| **`calibration_completed`** | boolean | 20260321_session3 | default `false` |
| `manychat_connected` | boolean | 20260321_session3 | default `false` |
| `lead_magnet_type` | text | 20260321_session3 | |
| `niche_intelligence` | jsonb | 20260321_session3 | |
| `proven_hooks` | jsonb | 20260321_session3 | |
| `content_strategy` | jsonb | 20260321_session3 | |
| **`onboarding_completed`** | boolean | 20260321_session3 | default `false` |
| `niche_affinity` | jsonb | 20260322_merge | default `'{}'` |
| `cal_hook_style_preference` | jsonb | 20260322_merge | default `'{}'` |
| `cal_tone_match` | jsonb | 20260322_merge | default `'{}'` |
| `audience_pain_alignment` | jsonb | 20260322_merge | default `'{}'` |
| `editing_style_fit` | jsonb | 20260322_merge | default `'{}'` |
| `content_format_preference` | jsonb | 20260322_merge | default `'{}'` |
| `inferred_niche` | text | 20260322_merge | |
| `inferred_audience_age_range` | text | 20260322_merge | |
| `inferred_audience_description` | text | 20260322_merge | |
| `inferred_content_style` | text | 20260322_merge | |
| `inferred_competitors` | text[] | 20260322_merge | default `'{}'` |
| `offer` | text | 20260322_merge | |
| `exclusions` | text[] | 20260322_merge | default `'{}'` |
| **`selected_niche`** | text | 20260322_merge | default `''` |
| `selected_goal` | text | 20260322_merge | default `''` |
| `selected_subtopics` | text[] | 20260322_merge | |
| **`creator_stage`** | text | 20260322_merge | nullable; staging output |
| **`dimension_scores`** | jsonb | 20260322_merge | nullable; 5-dim staging scores |
| **`staged_at`** | timestamptz | 20260322_merge | nullable; when staging fired |
| `cal_creator_story` | jsonb | 20260322_merge | |
| `audience_location` | text | 20260322_merge | |
| `audience_occupation` | text | 20260322_merge | |
| `quality_discernment_score` | numeric(5,2) | 20260322_merge | |
| `hook_usage_log` | jsonb | 20260322_merge | default `'[]'` |
| `agency_id` (assumed) | uuid | NOT in any migration | referenced in queries + RLS, see above |

`tiktok_handle` and `actual_follower_count` are referenced in code
(`src/lib/clay/component-data-fetcher.ts:201`,
`src/app/api/agency-chat/route.ts:646`) but I could not find a migration that
defines either column on `onboarding_profiles`. They may have been added
out-of-band; the chairman should confirm in production.

### Columns that represent "where the creator is in onboarding"

Five columns carry progress signal. Bolded above. In likely-progression order:

| Column | Meaning | Plain English |
| --- | --- | --- |
| `onboarding_step` | step pointer | text label of the current screen — set by every step write. Default `'entry'`. |
| `calibration_completed` | bool | did the calibration phase finish? |
| `creator_stage` | text | the staging classification computed *after* calibration (`'ready-to-ship'`, `'foundation'`, etc. — see T2). Set by `saveCreatorStage()`. |
| `staged_at` | timestamptz | when staging fired |
| `onboarding_completed` | bool | did the entire onboarding flow finish? |
| `onboarding_completed_at` | timestamptz | when it finished |

`creator_stage` and `onboarding_step` are conceptually different and each is
written by a different code path (T2). Today's reads conflate them
(`src/lib/dashboard/queries.ts:128` `const stage = p.creator_stage || p.onboarding_step || ''`).

### Distinct values in production

The investigation is read-only and no SQL was run against the live database.
The code paths suggest the following enum-like sets (verify with `SELECT DISTINCT`
when convenient):

- `onboarding_step` written values found in code:
  - `'entry'` (default, `src/lib/onboarding/get-or-create-profile.ts:54`)
  - `'complete'` (`src/app/(auth)/onboarding/page.tsx:113`)
  - `'migrated'` (legacy backfill, `supabase/migrations/20260322_merge_calibration_into_onboarding.sql:116`)
- `creator_stage` enum from `src/lib/onboarding/creator-stage.ts:18-24`:
  `'ready-to-ship' | 'audience-first' | 'style-refinement' | 'foundation' | 'advanced' | 'delivery-improvement'`.

The chairman should run, in psql or Supabase Studio:

```sql
SELECT creator_stage, COUNT(*) FROM onboarding_profiles GROUP BY 1;
SELECT onboarding_step,  COUNT(*) FROM onboarding_profiles GROUP BY 1;
```

to confirm. Both are read-only.

---

## T2 — How `creator_stage` / `onboarding_step` get *written* today

Three writers total. None are event-driven; every one fires from explicit
client UI clicks. There is no automatic transition on TikTok-link, no
server-side trigger that advances the step.

| File | Line | Column | Trigger | Value(s) written |
| --- | --- | --- | --- | --- |
| `src/lib/onboarding/get-or-create-profile.ts` | `:54` | `onboarding_step` | First time the creator visits the onboarding flow (the row gets inserted). | Always `'entry'` |
| `src/lib/onboarding/update-profile-step.ts` | `:30` | `onboarding_step` | Generic helper. Caller passes a step name; this writes it alongside arbitrary `data`. **No callers exist in `src/`** — `Grep` returned only the export site itself. The function is dead code right now. | Whatever the caller passes |
| `src/app/(auth)/onboarding/page.tsx` | `:113` | `onboarding_step` | The new dashboard onboarding flow finishes — operator/creator clicks Complete on Step 4. | `'complete'` (also writes `onboarding_completed_at` and `niche_key`, `account_type`, `business_name`) |
| `src/lib/onboarding/calibration-db.ts` | `:109` | `creator_stage` (+ `dimension_scores`, `staged_at`) | Calibration phase completes inside Viral Studio. `saveCreatorStage()` is called by `src/app/admin/viral-studio/page.tsx:264` after `calculateCreatorStage()` runs. | One of the six staging values from `creator-stage.ts:18-24` |
| `supabase/migrations/20260322_merge_calibration_into_onboarding.sql` | `:116` | `onboarding_step` | One-time backfill on legacy `calibration_profiles` rows. | `'migrated'` |

What's *not* a writer:

- `src/lib/prediction/runPredictionPipeline.ts:881` writes `creator_stage` to
  the `prediction_runs` table (different table, not `onboarding_profiles`).
- `src/lib/content/pattern-performance-tracker.ts:90` and
  `src/app/api/content-calendar/route.ts:187` write `creator_stage` to
  `creator_pattern_performance` (different table).

Implication: progression through stages is driven entirely by the new
`/onboarding` page (which only writes `'entry'` → `'complete'`) and Viral
Studio (which only sets `creator_stage` once, after calibration). There is **no
event-emitting hook** anywhere that fires on TikTok link, profile completion, or
any other implicit progression. Anything between `'entry'` and `'complete'` is
not represented today.

---

## T3 — How `creator_stage` / `onboarding_step` get *read* today

### Operator-facing reads (Clay-relevant)

| File | Line | What it reads | Used for | Surfaced in Clay? |
| --- | --- | --- | --- | --- |
| `src/app/api/agency-chat/route.ts` | `:495` | `creator_stage, onboarding_step` (compact projection on `onboarding_profiles`) | Maps each creator to a CreatorCard `status` via `toCardStatus(stage, step)` (`:1335-1341`, `:1351`, `:648`). | **Yes** — Clay agent context bundle. |
| `src/app/api/agency-chat/route.ts` | `:500-501` | `select('*')` on `onboarding_profiles` | Powers the `pipelineData` build (`:698-709`) which buckets creators into 5 stages (`invited`, `profile_setup`, `calibrating`, `ready`, `active`) using `determineStage()` (`:681-688`) and surfaces them under the `## ONBOARDING` section of the system prompt (`:1500-1502`, gated by `/onboard|pipeline|calibrat|invite|stall/`). Also produces `calibrationData` (`:735-788`) and `onboardingTimelineData` (`:791-825`). | **Yes** — but only if the operator's last message matches the keyword regex above OR is a generic greeting. |
| `src/lib/notifications/proactive-engine.ts` | `:62` | `creator_stage, onboarding_step` (per profile, in-memory) | `detectStalledCreators()` raises a `'stalled_creator'` ProactiveAlert when stage ≠ `'active'` and `updated_at` is ≥ 7 days old (`:60-85`). Returned alerts are surfaced under `## ALERTS` in the agent system prompt (always included, `:1484`). | **Yes** — but the detector compares against the literal string `'active'`, which is not what either `creator_stage` or `onboarding_step` ever holds today (T2). The comparator at `:63` will only short-circuit when the column matches `'active'` literally. In practice the column is `'complete'`, `'entry'`, or one of the six `creator-stage` enum values, so the rule rarely fires correctly. |
| `src/lib/clay/component-data-fetcher.ts` | `:201` | `creator_stage` projected for `CreatorProfile` card | Read into the card data shape but the card component (`src/components/clay/CreatorProfileCard.tsx`) does not currently render a stage indicator. The field is fetched and dropped. | **Yes** read, but **No** display. |

### Non-Clay surfaces (out of scope per the rules, listed for completeness only)

The following surfaces also read `creator_stage` / `onboarding_step` but live on
the dashboard / creator pages and are not in Clay scope:

- `src/lib/dashboard/queries.ts:111`, `:155` — agency-dashboard
  `getAgencyStats` / `getAgencyCreatorsList`.
- `src/app/agency/page.tsx:34`, `:75` — server-side resolution into the
  `CreatorCard` `status` enum.
- `src/app/dashboard/page.tsx:34`, `:302`, `:167` — creator self-view.
- `src/app/creator/page.tsx:23` — creator self-view.
- `src/app/admin/viral-studio/page.tsx` — Viral Studio reads its own staging
  result back.

### Where it surfaces in the agent's system prompt

In `src/app/api/agency-chat/route.ts`:

- `creators` summary (`:1344-1359`) is included unconditionally inside
  `agencyContext`, which is JSON-stringified into the prompt at `:1361-1386` via
  `toCardStatus(p.creator_stage, p.onboarding_step)` — but `toCardStatus` is a
  three-bucket reducer (`active | onboarding | inactive`) and discards every
  in-progress signal.
- `## CREATORS` section (compressed creator card data, `:1481`) does not surface
  stage information at all.
- `## ONBOARDING` section (`:1500-1502`) is keyword-gated: it appears only if
  the operator says one of `onboard / pipeline / calibrat / invite / stall` or
  uses a greeting (`isGeneral`). The morning auto-greeting hits this code path
  through the deterministic-triage short circuit (T8), which **does not include
  stage data** — see T8.
- `## ALERTS` section (`:1484`) is always included. Stalled-creator alerts are
  emitted through `proactive-engine.ts` (above) but are gated on
  `stage !== 'active'`, which essentially never matches.

### Existing Clay tools that filter by stage

None. None of the registered agent tools accept a stage filter (T6).

---

## T4 — `rebuildCreatorProfile()` and onboarding events

### What `rebuildCreatorProfile()` does

`src/lib/creator/profile_builder.ts:50-120`. In plain English:

1. Ensures `creator_profiles` and `creator_token_coeffs` tables exist (`ensureCreatorTables()` calls a `rpc('exec_sql', ...)`).
2. Pulls the latest row from the `videos` table for this `creator_id` to read `creator_followers` and `niche` — falls back to defaults `niche='general'`, follower band `'10k-100k'`.
3. Buckets the follower count into a band string (`<1k`, `1k-10k`, …).
4. Pulls the last 90 days of `videos.caption` and `videos.hashtags` rows and runs them through a hash-based 32-dim text embedding (`textToEmbedding32()`).
5. Estimates `baseline_completion` and `baseline_share_rate` from the last 90 days of `prediction_validation` rows.
6. Walks `viral_predictions` rows, accumulates per-token mean `frameworkContribution` lifts, applies a shrinkage-to-zero coefficient, and emits `creator_token_coeffs` rows for tokens with at least 2 data points.
7. Cold-start fallback: if no tokens learned, seeds four default tokens (`hook`, `story`, `before_after`, `pov`) with neutral coefficients.
8. Upserts the embedding + bands + baselines into `creator_profiles`.
9. Upserts the per-token coefficients into `creator_token_coeffs`.

### Inputs and outputs

- Input: `creatorId: string`. Function is server-side (uses service role client at module load).
- Writes:
  - `creator_profiles` (upsert): `creator_id`, `niche`, `follower_band`, `style_embedding`, `baseline_completion`, `baseline_share_rate`, `updated_at`.
  - `creator_token_coeffs` (upsert): one row per `(creator_id, token)` with `coeff`, `support`, `updated_at`.
- Reads: `videos`, `prediction_validation`, `viral_predictions`. **Does not read `onboarding_profiles`.**

### Where it is currently called from

- `src/app/api/creator/rebuild_profile/route.ts:8` — the only call site. POST
  endpoint that takes a `?creator_id=` query param and runs the function.
- `Grep` on `rebuildCreatorProfile` returns the export site, the route handler,
  and several historical investigation MD files. No `fetch('/api/creator/rebuild_profile')`
  call anywhere in `src/`. **The function is currently orphaned.** Confirms
  `CREATOR_TABLE_WRITE_INVESTIGATION_2026-04-23.md:301` and
  `SUBSTRATE_AUDIT_2026-04-21.md:393`.

### Natural trigger

The audit doc names "TikTok link event." That signal would land at one of two
points:

1. The Viral Studio "channel verified" step — the moment the operator clicks to
   confirm a `tiktok_handle` and the `channel_data` write fires into
   `onboarding_profiles`. There is no current handler that emits a
   `channel.linked` or `tiktok.linked` event today. (Grep for
   `eventType: 'tiktok` returned zero matches in `src/`.)
2. The dashboard `/onboarding` flow — but the new flow does not collect a
   TikTok handle today (`src/app/(auth)/onboarding/page.tsx`). It only writes
   role, full name, niche, business name and `onboarding_step='complete'`.

### Existing onboarding-completed events

Grep for `onboarding.completed` / `onboarding.finished` / `onboarding_completed`
in event emit calls returns:

- `src/app/sandbox/workflow/onboarding/page.tsx:19` — `emit({ type: "onboarding.completed" })` but this is a **client-side React state machine event** in the sandbox preview at `/sandbox/workflow`, not a `platform_events` write. Defined at `src/app/sandbox/workflow/_context/SandboxWorkflowContext.tsx:18`.

There is **no `emitEvent({eventType: 'onboarding.completed'})` anywhere in
`src/`**. The dashboard onboarding flow at `src/app/(auth)/onboarding/page.tsx`
writes the column but does not emit an audit event. The `platform_events`
table is therefore silent on onboarding lifecycle today, which is the load-bearing
gap for OB-2's "tell the operator who just finished onboarding" use case.

For the record, the only `eventType: 'onboarding*'` reference in code is a Zod
enum in `src/lib/trendzo-catalog.ts:349` that names *renderable* event types
the agent can put on a UI timeline (`'invited' | 'accepted' | 'profile_started' | …`).
Nothing emits these to `platform_events`; they are only consumed as
shape-validation by the agent when it composes a response.

---

## T5 — `agency_invites` lifecycle vs `onboarding_profiles`

### The flow today

1. **Operator triggers an invite** via Clay (`propose_send_invite` →
   `send_invite` adapter, `src/lib/agent/handler-adapters.ts:124-134`) or the
   dashboard (`POST /api/invites/send`, `src/app/api/invites/send/route.ts`).
2. **`sendInviteFor()`** (`src/lib/email/send-invite.ts:194-238`) upserts an
   `agency_invites` row keyed on `(agency_id, creator_email)` with
   `status='pending'`, then calls `sendCreatorInvite(inviteId)` which signs a
   token, sends an SMTP email with an `accept` link, and on success flips the
   row to `status='sent'` (`...:179-182`).
3. **Audit event** — caller emits `invite.sent` or `invite.failed` to
   `platform_events` (`/api/invites/send/route.ts:58-90`,
   `src/lib/clay/action-handler.ts:715-754`).
4. **Creator clicks the link** → `GET /api/invite-acknowledge/[id]?token=…`
   (`src/app/api/invite-acknowledge/[id]/route.ts`).
5. **The handler** (`...:88-107`) sets `status='accepted'`, `accepted_at=now()`,
   emits `invite.accepted_via_email_link`, and renders an HTML "Got it" page.
6. **End of flow.** No further server-side action. **No `onboarding_profiles`
   row is created.** No email-confirmation. No onboarding URL is sent in the
   response or in the email. The acceptance page literally says:
   _"Your agency will be in touch with onboarding next steps. You can close this tab."_
   (`...:114`).

### What connects `agency_invites.status='accepted'` to `onboarding_profiles`?

**Nothing.** The two tables share no foreign key, no shared column other than
the email address (which is `creator_email` on `agency_invites` but does not
exist as a column on `onboarding_profiles`), and there is no listener for the
`invite.accepted_via_email_link` event in `src/`.

A creator has to (a) accept the invite via the email link, then separately
(b) sign up at the platform, log in, and trigger
`getOrCreateProfile()` (which inserts the row with `onboarding_step='entry'`,
`src/lib/onboarding/get-or-create-profile.ts:50-57`). There is no automatic
linkage and no audit pointer between these events.

### What the operator sees today when an invite is accepted

The agent context bundle pulls all `agency_invites` rows
(`src/app/api/agency-chat/route.ts:502-503`) into `invitations[]`, but **the
prompt does not include them**. Search the file for `invitations` usage —
the variable is read once into the data array and never referenced again.

The morning briefing (T8) does not include invite-acceptance signals. The
`detectStalledCreators` proactive alert (T9) operates on
`onboarding_profiles`, not `agency_invites`, so an accepted-but-no-profile
creator is invisible to it.

In short: **the operator sees nothing in Clay when an invite is accepted today.**
The only surface that displays invite rows is the dashboard (`src/app/agency/dashboard/DashboardClient.tsx:230-234`,
`src/lib/dashboard/queries.ts:417-430`), which is out of scope for OB-2.

---

## T6 — Clay tools related to creators

The Clay agent's tools are assembled in `src/app/api/agency-chat/route.ts:1797-1804`:
12 propose-only write tools generated from
`src/lib/agent/handler-adapters.ts:251-264` plus 3 inline read tools.

| Tool name | Source | Reads / Writes | Touches creators? | Filters / surfaces by stage? |
| --- | --- | --- | --- | --- |
| `propose_nudge_creator` | `handler-adapters.ts:62-68` | Writes `content_briefs.last_nudged_at` (via `action-handler.ts`); sends nudge email. Wraps a `creatorId`. | Yes — operator-driven, brief-anchored. | No |
| `propose_update_brief_status` | `:75-89` | Writes `content_briefs.completion_status`. | Indirectly (creator owns brief). | No |
| `propose_log_performance` | `:96-107` | Writes brief actuals. | Indirectly. | No |
| `propose_approve_brief` | `:112-118` | Writes `content_briefs.status='accepted'`. | Indirectly. | No |
| `propose_send_invite` | `:124-135` | Inserts `agency_invites` row + sends email (T5). | Yes — pre-creator. | No |
| `propose_create_event` | `:142-153` | Writes `agency_events`. | No. | — |
| `propose_match_creators_to_event` | `:158-164` | Reads `onboarding_profiles` + `agency_events` to score matches. | Yes — read. | No |
| `propose_push_brief_to_creators` | `:170-181` | Writes brief assignments to N creators. | Yes — write. | No |
| `propose_generate_batch_briefs` | `:187-198` | Generates N briefs for N creators. | Yes — write. | No |
| `propose_schedule_post` | `:204-215` | Writes `scheduled_actions`. | Indirectly. | No |
| `propose_generate_report` | `:220-231` | Writes/returns a report aggregation. | No. | — |
| `propose_reschedule_post` | `:237-248` | Writes `scheduled_actions`. | Indirectly. | No |
| `get_briefs_by_status` | `route.ts:1695-1716` | Reads `content_briefs` via `/api/brief-status`. | Indirectly. | No |
| `get_unacknowledged_briefs` | `route.ts:1730-1758` | Reads `content_briefs` via `/api/brief-status?status=delivered`, attaches `days_since_created`. | Indirectly. | No |
| `get_performance_summary` | `route.ts:1762-1782` | Reads `/api/brief-performance`. | Indirectly. | No |

**No tool today reads `onboarding_profiles` directly. No tool accepts a
`creator_stage` or `onboarding_step` filter. No tool returns "stalled
creators." No tool exists to query who has accepted an invite but not started
their profile.** The agent inherits stage information passively through the
prompt's `## ONBOARDING` section (T3), which means the agent must do its own
in-context filtering and is keyword-gated to specific operator phrasings.

---

## T7 — Clay component cards related to creators

15 component types are registered in `src/lib/clay/component-registry.ts:8-24`,
backed by 16 `*.tsx` files in `src/components/clay/`. Two render creator
information; one renders a triage list that may contain a creator.

| Component | Component file | Data fetcher | Fields shown today | Stage / onboarding indicator? |
| --- | --- | --- | --- | --- |
| `CREATOR_PROFILE` (`CreatorProfileCard`) | `src/components/clay/CreatorProfileCard.tsx` | `src/lib/clay/component-data-fetcher.ts:195-298` (`fetchCreatorProfile`) | `creatorId`, `name`, `handle`, `niche`, `followerCount`, `avgVPS`, `trend ('up'/'down'/'flat')`, `topFormats[]`, `recentScore`, `briefsThisWeek`, `agencyName`, `memoryFacts[]`. The fetcher selects `creator_stage` (`:201`) but the card type definition (`:5-18`) does not include it and the JSX (`:38-298`) never renders it. | **No.** Field is fetched and dropped. |
| `MOMENTUM_DECAY` (`MomentumDecayCard`) | `src/components/clay/MomentumDecayCard.tsx` | `component-data-fetcher.ts:fetchMomentumDecay` (`:597-627`) | `daysSincePost`, `projectedDecayPct`, `urgencyLevel`, `recommendedAction`, `estimatedRecoveryDays`. Operates on prediction-runs activity, not onboarding. | No. |
| `MORNING_BRIEF` (`MorningBriefCard`) | `src/components/clay/MorningBriefCard.tsx` | `component-data-fetcher.ts:fetchMorningBrief` (`:75-148`) | Headline + summary built from `morning_briefs` or `pre_generated_briefs`. Includes `creatorsAffected[]` as plain names. | No. |
| `KPI_SUMMARY`, `TREND_CARD`, `CONTENT_BRIEF`, `PERFORMANCE_TIMELINE`, `TRAINER_RESULT`, `PROACTIVE_ALERT`, `NETWORK_INSIGHT`, `MEMORY_FACT`, `CALENDAR_SNIPPET`, `AGENCY_SCORECARD`, `ACTION_CONFIRMATION`, `VARIANT_COMPARISON`, `UniversalSkeleton` | various | various | None of these render onboarding-stage information for a creator. | No. |

There is also the JSON-render `ActionDecisionCard` used by the morning triage
spec (`src/app/api/agency-chat/route.ts:309-326`), but that card describes a
triage item (overdue brief / trend / win) — never an onboarding stall, since
the triage cron does not currently emit onboarding items (T8).

In summary: **no Clay card today shows where a creator is in onboarding, or
flags a creator as stalled in onboarding.** OB-2 will need to extend
`CreatorProfileCard` (add a stage / progress field that already arrives in the
fetcher) **or** introduce a dedicated card type. Both are valid; this
investigation does not pick.

---

## T8 — Morning briefing pipeline

### How the briefing is composed today

1. **Cron** (defined in the platform's BullMQ scheduler — see
   `src/lib/triage/overnight-triage.ts:1-14` doc comment, "06:00 UTC nightly") calls
   `runTriageForAllAgencies()` (`...:43-93`).
2. For each agency, `runTriageForAgency(db, agencyId)` (`...:98-277`):
   - Reads `onboarding_profiles` to find roster members (`:100-103`).
   - Detects **overdue briefs** by querying `content_briefs` with
     `delivery_status='delivered'` AND `created_at < now() - 24h` AND
     `completion_status != 'published'` (`:117-122`). Urgency =
     `min(10, days_overdue * 2)`.
   - Detects **performance highlights** from `content_briefs` with
     `performance_delta > 0` in the last 7 days (`:154-189`).
   - Detects **trend opportunities** from `agency_events` whose
     `trend_window_end` is within 48h (`:197-238`).
   - Sorts by urgency, tie-breaks via `TRIAGE_TYPE_PRIORITY` (overdue > trend > performance, `intelligent-clay-registry.ts:336-340`), caps at `TRIAGE_MAX_ITEMS = 5` (`:343`).
   - Upserts a row into `agency_triage` keyed on `(agency_id, triage_date)`
     (`:250-262`). Schema at `supabase/migrations/20260417_agency_triage.sql`.
   - Emits `triage.generated` event (`:264-274`).
3. **Operator opens Clay.** `src/app/agency/AgencyClient.tsx:680-720`
   `fireAutoGreeting()` fetches `GET /api/triage/today?agency_id=…`
   (`src/app/api/triage/today/route.ts`), which returns
   `{ items, triage_date, stale }` from `readTriageForAgency()`
   (`overnight-triage.ts:283-314`).
4. If `items.length > 0`, the client injects a hidden user message
   `[__TRENDZO_TRIAGE__] {jsonpayload}` (`AgencyClient.tsx:701-702`).
5. The chat route detects the marker (`agency-chat/route.ts:458-461`,
   `:338-372`) and **bypasses the LLM**, streaming a deterministic JSONL spec
   built by `buildTriageSpec(payload)` (`:227-336`). Each item becomes one
   `ActionDecisionCard`. Cards have `metaLeft` (the type label —
   `OVERDUE / TREND / WIN`), `creatorName`, `statusText`, `context`, and 1-2
   action buttons keyed off `actionsForTriageItem(item)` (`:170-225`).
6. If `items.length === 0` the client falls through to the original LLM
   greeting path (`AgencyClient.tsx:716-718`).

### Does the morning brief surface stalled creators today?

**No.** Three reasons:

1. **The triage cron does not look at `onboarding_profiles` for stage
   stalls.** It reads roster identity (`onboarding-triage.ts:100-103`) only to
   resolve `business_name` and niche for overdue-brief items. It never inspects
   `onboarding_step`, `creator_stage`, `staged_at`, or `onboarding_completed_at`.
2. **The `TriageItemType` enum is exhaustive at three values** —
   `'overdue_brief' | 'performance_highlight' | 'trend_opportunity'`
   (`intelligent-clay-registry.ts:300`). There is no `'stalled_creator'` variant.
   Adding one would also require updating the JSONL spec builder
   (`agency-chat/route.ts:227-336`) since the type-label and action-button
   mapping are switch statements.
3. **The fallback LLM greeting** (when triage items are empty) hits the same
   `## ALERTS` system-prompt section that includes
   `proactive-engine.ts:detectStalledCreators` output (T3). But the detector's
   `stage === 'active'` short-circuit is wrong against current data shape, so
   stalls almost never fire. Even when they do, they appear under `## ALERTS`,
   not the morning hero.

### Where the signal would need to be injected for OB-2

Two architecturally distinct paths, both straightforward to identify:

- **Cron-side (preferred for the deterministic short-circuit):** add a
  fourth detector inside `runTriageForAgency()` (between
  `overnight-triage.ts:147` and `:152`) that scans `onboarding_profiles` for
  members of the agency whose stage indicates incompleteness AND whose
  `updated_at` exceeds the stall threshold. Append the items to `allItems`
  with a new `'stalled_onboarding'` (or similar) `TriageItemType`. The card
  rendering in `agency-chat/route.ts:buildTriageSpec` would need a new
  `typeLabel` / `bottomLabel` / `actionsForTriageItem` branch.

- **Read-side (lighter):** keep the cron unchanged and introduce a new agent
  read tool (e.g. `get_stalled_onboarding`) plus a system-prompt hint, so the
  LLM auto-pulls stage status when the operator asks "what's going on with my
  roster" or "who's stalled." The cost is the LLM has to do the right thing —
  it loses the deterministic-spec property of the triage path.

Picking between these is a build-prompt decision; this investigation does not.

### Other surfaces that *could* show stage but don't

- The `## ONBOARDING` section in the system prompt (`agency-chat/route.ts:1500-1502`)
  does include `pipelineData` already (T3) — a flat list of creators bucketed
  by 5-stage `determineStage()` output with a `days_in_stage` field
  (`:706`). It just doesn't fire on the morning auto-greeting because that goes
  through the deterministic triage short-circuit, never the LLM.

---

## T9 — What "stalled" means today

OB-3 (per the audit doc) sets a 48h threshold for invite-stage stalls. OB-2
asks the operator to know "where each creator is right now." The two related
"stall calculations" already in the codebase:

| Place | Threshold / formula | Source | Notes |
| --- | --- | --- | --- |
| `proactive-engine.ts:detectStalledCreators` | `stage !== 'active'` AND `daysSinceUpdate >= 7` (computed from `(now - new Date(updated_at).getTime()) / 86400000`). Priority `'high'`. | `src/lib/notifications/proactive-engine.ts:57-85` | Operates on full `onboarding_profiles` rows. The `'active'` comparator is wrong against current data (T3), so this rarely fires. |
| Triage `overdue_brief` | `urgency = min(10, days_overdue * 2)`, where `days_overdue = (now - created_at) / 86400000 - 1`. Brief must have `delivery_status='delivered'` and not be `'published'`. | `src/lib/triage/overnight-triage.ts:115-147`, formula doc at `src/lib/clay/intelligent-clay-registry.ts:321-324` | This is the load-bearing "stall" pattern in the system today: a delivery happened (signal exists), then >24h passed without progression. Same shape OB-2 wants — invite delivered, then nothing. |
| `MomentumDecayCard` data fetcher | `daysSince >= 3` to surface anything; tiers at `>= 5` (medium), `>= 7` (high), `>= 14` (critical). | `src/lib/clay/component-data-fetcher.ts:597-627` | Operates on time-since-last-post, not onboarding. Useful as a tiering reference. |
| Pipeline `days_in_stage` | `daysSince(p.updated_at \|\| p.created_at)` — no threshold, just a number rendered on the card. | `src/app/api/agency-chat/route.ts:690-694, 706` | Already computed in the agent context bundle. Threshold-free. |

Pattern of "time since last activity" is already implemented at three different
sites with three different time conventions:

- `(Date.now() - new Date(ts).getTime()) / (1000 * 60 * 60 * 24)` — proactive engine, route.ts pipeline
- `MS_PER_DAY = 86_400_000` constant divided into a millisecond delta —
  overnight-triage
- `Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))` —
  momentum decay

No `stalled_creator` calculation exists anywhere that operates on
`agency_invites` (i.e., for the OB-3 pre-acceptance stall). The
`overdue_brief` shape is the closest analog and would be the natural pattern
to copy.

OB-2 itself is read-side per the audit doc; it does not pick a threshold. But
when the morning briefing surfaces a stalled creator, *some* threshold is
needed. The 7-day rule baked into `proactive-engine.ts:69` is the only
existing precedent for an onboarding-style stall.

---

## T10 — Schema gaps for OB-2

Listed below in priority order. None of these are migrations — just plain-English
descriptions of what's missing.

### Hard gaps (something will not work without this)

1. **No `agency_id` migration on `onboarding_profiles`.** Every read assumes
   it exists (T1). If it does not exist in production, OB-2's
   "creators *for this agency*" query returns nothing. The chairman must
   confirm. If absent: needs a new column on `onboarding_profiles` (UUID
   FK to `agencies(id)`), a backfill from `agency_members.user_id`, and an
   index. *Status:* most likely added out-of-band given the live RLS policy at
   `supabase/migrations/20260322_agency_scoped_rls.sql:65-66`.

2. **No bridge from `agency_invites.status='accepted'` to
   `onboarding_profiles`.** Today an accepted invite vanishes — the creator
   gets the "your agency will be in touch" page (T5) and the operator has
   no signal. For OB-2 the operator needs to see "Vivian accepted, hasn't
   started profile yet." This requires either:
   - a column on `agency_invites` that points at the eventual
     `onboarding_profiles.id` (or `user_id`) once the creator signs up, **or**
   - a column on `onboarding_profiles` that points back at the source
     `agency_invites.id`, **or**
   - a server-side handler in `/api/invite-acknowledge/[id]` that creates a
     placeholder `onboarding_profiles` row right at acceptance.

   Plain-English description either way: "we need a stable identifier that
   ties the email-side invite to the platform-side profile."

3. **No `onboarding.completed` event in `platform_events`.** T4 confirmed
   zero emissions. Without this the agent has no way to surface "creator just
   finished onboarding" in the morning briefing or the proactive alerts. OB-2
   needs at least one of: an emit at the end of `src/app/(auth)/onboarding/page.tsx`,
   or at the end of Viral Studio's full flow, or both.

### Soft gaps (capability exists but is incomplete or misaligned)

4. **`creator_stage` is set once, then frozen.** Set only by Viral Studio's
   calibration completion (T2). It does not advance further. If OB-2 wants to
   distinguish "calibrated, hasn't shipped" from "calibrated, shipped 5 briefs"
   the column today does not give that. (`onboarding_step` would, but only
   `'entry'` and `'complete'` ever get written.) OB-2 needs to decide if it
   reads creator_stage as-is or if a richer step pointer is required.

5. **`detectStalledCreators` is broken against current data shape.** T3, T9.
   The `stage === 'active'` short-circuit assumes a value that is never
   written. Either the comparator needs to widen (`stage === 'complete' || stage === 'completed' || stage === 'active'` — same pattern `dashboard/queries.ts:129` uses) or the detector needs to be replaced. OB-2 must
   align this if it wants `## ALERTS` to fire.

6. **No `onboarding_step` writes between `'entry'` and `'complete'`.** The
   helper `updateProfileStep()` exists but has no callers (T2). OB-2's "where
   are they right now" surface is degenerate today: every in-flight creator
   reads as `'entry'`, which is uninformative.

### Confirmation: OB-3 columns vs OB-2

The audit specifically calls out `nudge_count`, `last_nudge_at`, `nudge_stage`
on `agency_invites` for OB-3 (auto-nudge of stale invites). **OB-2 does not
need these.** OB-2 is purely a read-side capability: "show the operator where
each creator is, and which ones are stalled." Reads work over the existing
shape (modulo gaps 1-6 above). The OB-3 columns cover *write*-side concerns
(track that a nudge happened), which OB-2 does not introduce.

The current `agency_invites` table at `supabase/migrations/20260417_phase1_action_scaffolding.sql:10-29`
already has `invited_at`, `sent_at`, `accepted_at`, `status`. That is enough
for OB-2 to compute "invited X days ago, accepted Y days ago, no profile yet."

Whether OB-2 also wants to add a `nudge_*` column trio so OB-3 can land
cheaper is a build-prompt-time choice; this investigation flags it but does
not pick.

---

## Appendix — files touched in this investigation

Read-only references for the build prompt:

- Onboarding schema: `supabase/migrations/20260321_core_onboarding_tables.sql`,
  `..._onboarding_session3_columns.sql`, `..._merge_calibration_into_onboarding.sql`,
  `..._creator_staging.sql`.
- Writers: `src/lib/onboarding/get-or-create-profile.ts`,
  `src/lib/onboarding/update-profile-step.ts`,
  `src/lib/onboarding/calibration-db.ts`,
  `src/app/(auth)/onboarding/page.tsx`,
  `src/app/admin/viral-studio/page.tsx`.
- Readers (Clay): `src/app/api/agency-chat/route.ts`,
  `src/lib/notifications/proactive-engine.ts`,
  `src/lib/clay/component-data-fetcher.ts`.
- Readers (out of scope): `src/lib/dashboard/queries.ts`,
  `src/app/agency/page.tsx`, `src/app/dashboard/page.tsx`,
  `src/app/creator/page.tsx`.
- Profile builder: `src/lib/creator/profile_builder.ts`,
  `src/app/api/creator/rebuild_profile/route.ts`.
- Invite lifecycle: `src/lib/email/send-invite.ts`,
  `src/app/api/invites/send/route.ts`,
  `src/app/api/invite-acknowledge/[id]/route.ts`,
  `src/lib/clay/action-handler.ts:715-754` (Clay invite path).
- Agent tools: `src/lib/agent/tool-registry.ts`,
  `src/lib/agent/handler-adapters.ts`.
- Clay components: `src/lib/clay/component-registry.ts`,
  `src/lib/clay/component-data-fetcher.ts`,
  `src/components/clay/CreatorProfileCard.tsx`.
- Triage / morning brief: `src/lib/triage/overnight-triage.ts`,
  `src/lib/clay/intelligent-clay-registry.ts:300-346`,
  `src/app/api/triage/today/route.ts`,
  `src/app/api/agency-chat/route.ts:227-372`,
  `src/app/agency/AgencyClient.tsx:680-772`,
  `supabase/migrations/20260417_agency_triage.sql`.
- Stall calculations: `src/lib/notifications/proactive-engine.ts:57-85`,
  `src/lib/triage/overnight-triage.ts:115-147`,
  `src/lib/clay/component-data-fetcher.ts:597-627`.
