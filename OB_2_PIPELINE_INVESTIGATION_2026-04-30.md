# OB-2 Onboarding Progress Tracking — Pipeline Investigation

Date: 2026-04-30
Scope: Read-only audit. Build on the prior investigation (`OB_2_INVESTIGATION_2026-04-29.md`)
to map every step in the onboarding flow, identify natural checkpoints, and confirm
write/read paths for the Clay-only progress-tracking surface.

No code changes, no migrations.

---

## Task 1 — Onboarding flow entry point

### Two distinct "onboarding" surfaces exist in the codebase

The screenshots the operator described ("How would you like to create viral content?",
"Choose your niche" with 20 options, 8-video calibration, Phase 01 Signal Calibration,
"Here's what we know about you", "Your Story", "Your Audience", land on viral templates)
correspond to **`/admin/viral-studio`**, NOT to the simple 4-step `/onboarding` page
documented in T2 of the prior investigation.

Both surfaces touch `onboarding_profiles`, but they are not connected:

| URL path | File path | What it does | Writes to `onboarding_profiles`? |
| --- | --- | --- | --- |
| `/onboarding` | `src/app/(auth)/onboarding/page.tsx` | 4-step modal — name, role, niche, agency note. Only used post-signup for self-serve sign-ups. | Yes — only `onboarding_step='complete'` at the very end (line 113) |
| `/admin/viral-studio` | `src/app/admin/viral-studio/page.tsx` | The 9-screen creator setup flow shown in the operator screenshots. | Yes — `creator_stage`, `dimension_scores`, `staged_at`, `cal_creator_story`, `audience_location`, `audience_occupation`, calibration columns. **Never writes `onboarding_step`.** |

### How a creator arrives at viral-studio

There is **no automatic route from invite-acceptance to either onboarding surface.**
Per `src/app/api/invite-acknowledge/[id]/route.ts:109-115`, the creator's email link
returns a static "Got it. Your agency will be in touch with onboarding next steps. You
can close this tab." HTML page. No redirect. No magic link. No URL pointing at signup
or viral-studio. This is the bridge gap (Task 5).

For a creator who has somehow signed up and arrived authenticated on `/admin/viral-studio`:

- `src/app/admin/viral-studio/page.tsx:183-185` mounts with `currentPhase: ENTRY` from
  `initialState` (line 137-181). State is purely client-side React state — no DB read
  on mount, no resume capability.
- `useAuth()` is called at line 186, but only the user's `uid` is used downstream for
  fire-and-forget save calls (lines 251, 287, 320). The phase pointer is never loaded
  from DB; if the creator refreshes the browser they restart at ENTRY.

### Whether `onboarding_profiles` row exists when they arrive

**Not necessarily.** The Viral Studio flow does not call `getOrCreateProfile()` at any
point — `Grep` for `getOrCreateProfile` across `src/` returns only the export site
itself (this confirms T2 of the prior investigation that `getOrCreateProfile()` is
dead code).

Instead, the flow relies on **upsert** in `saveCalibrationProfile()`
(`src/lib/onboarding/calibration-db.ts:30-52` — `.upsert(..., { onConflict: 'user_id' })`),
which only fires AFTER the `CALIBRATION_PROFILE` phase completes (8-video calibration
+ profile confirmation). If the creator drops out before that, the row never gets
created and the entire flow is invisible.

The other `onboarding_profiles` writes from viral-studio are `.update(...).eq('user_id', ...)`
calls (page.tsx:293-296 for Creator Story, :327-330 for audience enrichment,
calibration-db.ts:107-113 for `saveCreatorStage`). If the row didn't get inserted by
the calibration upsert first, these updates silently match zero rows and accomplish
nothing.

### Plain English

> "When a creator clicks the email link, they hit a static HTML page. There is no
> redirect to anywhere. They have to find the platform on their own, sign up, log in,
> and navigate to `/admin/viral-studio`. The first time anything is written to
> `onboarding_profiles` is after they finish the 8-video calibration phase plus the
> 'Here's what we know about you' confirmation screen — typically the 5th or 6th
> screen in the flow. Anything before that point, the creator is invisible to the DB."

---

## Task 2 — Walking the onboarding sequence top to bottom

The reference flow from the operator screenshots is essentially correct, but there
are extra branches and subtleties. Below is what the code actually does. Phase enum
at `src/app/admin/viral-studio/page.tsx:31-45`:

```ts
enum ViralStudioPhase {
  ENTRY = 'entry',
  ONBOARDING = 'onboarding',
  CHANNEL_CONNECT = 'channel_connect',
  SIGNAL_CALIBRATION = 'signal_calibration',
  CALIBRATION_PROFILE = 'calibration_profile',
  CREATOR_STORY = 'creator_story',
  AUDIENCE_DIAGNOSTIC = 'audience_diagnostic',
  GALLERY = 'gallery',
  ANALYSIS = 'analysis',
  LAB_PHASE_1 = 'lab_phase_1', // DISCOVER YOUR VIRAL OPPORTUNITY
  LAB_PHASE_2 = 'lab_phase_2', // VALIDATE YOUR STRATEGY
  LAB_PHASE_3 = 'lab_phase_3', // CREATE WITH CERTAINTY
  CONTENT_CALENDAR = 'content_calendar' // 30-DAY CONTENT PLAN
}
```

Walked top-to-bottom:

### Step 1 — ENTRY (Path Choice)
- **Short name:** `path_chosen` (Manual Analysis vs. AI Templates)
- **File:** `src/app/admin/viral-studio/components/phases/EntryPhase.tsx`
- **Action:** Click on a `PathCard` (`EntryPhase.tsx:63` / `:72`) — `onPathSelect('manual'|'ai-templates')`
- **Advance:** `page.tsx:208-213` `handlePathSelection()` only routes to ONBOARDING if `path === 'ai-templates'`. Manual path is logged but goes nowhere.
- **DB write:** **None.** Nothing fires.

### Step 2 — ONBOARDING (3 sub-screens: niche → subtopics → goal)
- **Short name:** `niche_subtopics_goal_chosen`
- **File:** `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx`
- **Action:** This phase contains 3 sub-steps inside its own `step` state (1, 2, 3):
  1. Pick niche from 20 dropdown options (`OnboardingPhase.tsx:21-42`, `handleNicheSelect:83-88`)
  2. Pick 3-5 subtopics (`getSubtopicsForNiche:90-94`, `toggleSubtopic:96-102`, continue at `handleSubtopicsContinue:104-106`)
  3. Pick goal from 5-option dropdown (`handleGoalSelect:108-120`)
- **Advance:** `handleGoalSelect` calls `onComplete(label, goal.label, registryKey, subtopics)` after 800ms. Up the tree, `page.tsx:215-218` `handleOnboardingComplete()` stores in React state and routes to `CHANNEL_CONNECT`.
- **DB write:** **None.** Nothing fires for niche, subtopics, or goal at this stage. Selections live only in client memory until calibration phase finishes.

### Step 3 — CHANNEL_CONNECT
- **Short name:** `channel_connected_or_skipped`
- **File:** `src/app/admin/viral-studio/components/phases/ChannelConnectPhase.tsx`
- **Action — verify:** Type TikTok handle, click "Verify Channel" (`ChannelConnectPhase.tsx:160`). Posts to `/api/channel/verify`. On success, click "Continue" (`:287`) to fire `onComplete(channelData)`.
- **Action — skip:** Click "Skip for now" (`:169` or `:327`) → `onComplete(null)`.
- **Advance:** `page.tsx:220-223` `handleChannelConnectComplete()` stores `channelData` in state and routes to `SIGNAL_CALIBRATION`.
- **DB write:** **None.** `channelData` is held in client state only.

### Step 4 — SIGNAL_CALIBRATION (the 8-video phase)
- **Short name:** `calibration_done`
- **File:** `src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx`
- **Action:** Swipe up (accept) / swipe down (reject) on each of the 8 videos. Each swipe records into `scorerRef.current` (`SignalCalibrationPhase.tsx:137`). Per the operator's locked decision, this entire 8-video sub-sequence counts as ONE checkpoint.
- **Advance:** When `nextIndex >= total` (line 141), the runner builds `rawScores` + `inferred` and calls `setTimeout(() => onComplete(inferred, rawScores), 400)` (`:145`). Up the tree, `page.tsx:229-232` `handleCalibrationComplete()` stores both and routes to `CALIBRATION_PROFILE`.
- **DB write:** **None at this transition.** The DB save is deferred until the next phase completes.

### Step 5 — CALIBRATION_PROFILE ("Here's what we know about you")
- **Short name:** `calibration_profile_confirmed`
- **File:** `src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx`
- **Action:** Confirm or edit 4 inferred cards (niche, audience, style, competitors), optionally fill offer + exclusions, click submit (`CalibrationProfilePhase.tsx:60-69` `handleSubmit`).
- **Advance:** `onComplete(finalProfile)` → `page.tsx:234-271` `handleProfileComplete()`:
  - `calculateCreatorStage()` runs synchronously to compute `stage` + `dimensions` (`page.tsx:238-242`).
  - Routes to `CREATOR_STORY` (`:248`).
  - **First DB write of the entire flow** — fire-and-forget chain at `page.tsx:251-270`:
    1. `saveCalibrationProfile(uid, rawScores, finalProfile, niche, goal, subtopics)` upserts on `user_id` (`calibration-db.ts:28-52`). This row contains every selection collected across Steps 2–5: `niche_affinity`, `cal_hook_style_preference`, `cal_tone_match`, `audience_pain_alignment`, `editing_style_fit`, `content_format_preference`, `inferred_niche`, `inferred_audience_*`, `inferred_content_style`, `inferred_competitors`, `offer`, `exclusions`, `selected_niche`, `selected_goal`, `selected_subtopics`, `quality_discernment_score`. Note: this upsert does NOT write `onboarding_step` or `creator_stage`.
    2. After that succeeds, `saveCreatorStage(uid, stagingResult)` writes `creator_stage`, `dimension_scores`, `staged_at` (`calibration-db.ts:106-115`).
- **DB write:** YES — the upsert + stage update from `page.tsx:251-270`.

### Step 6 — CREATOR_STORY ("Your Story" — transformation, myths, etc.)
- **Short name:** `story_submitted`
- **File:** `src/app/admin/viral-studio/components/phases/CreatorStoryPhase.tsx`
- **Action:** Fill `transformation` (≥20 chars), at least one `myth1`, `desiredResult` (≥10 chars), optionally credentials + mistakes. Click submit (`CreatorStoryPhase.tsx:34-44` `handleSubmit` → `onComplete(story)`).
- **Advance:** `page.tsx:282-309` `handleCreatorStoryComplete()`:
  - Stores in React state.
  - Fire-and-forget update writes `cal_creator_story` to `onboarding_profiles` (`page.tsx:288-301`).
  - **Branches**: if `creatorStage.stage === 'audience-first'` → `AUDIENCE_DIAGNOSTIC`; otherwise straight to `GALLERY` (`page.tsx:303-308`).
- **DB write:** YES — the `cal_creator_story` update.

### Step 7 — AUDIENCE_DIAGNOSTIC (conditional — only for `audience-first` stage)
- **Short name:** `audience_diagnostic_submitted`
- **File:** `src/app/admin/viral-studio/components/phases/AudienceDiagnosticPhase.tsx`
- **Action:** Answer `idealViewer` (required, ≥1 char), `problemSolved` (optional), `uniqueAngle` (optional). Optionally fill `location` and `occupation`. Click submit (`AudienceDiagnosticPhase.tsx:64-68`).
- **Advance:** `page.tsx:315-336` `handleAudienceDiagnosticComplete()`:
  - Stores in state.
  - Routes to `GALLERY` (`:317`).
  - Fire-and-forget update writes `audience_location` and/or `audience_occupation` if either was filled (`page.tsx:320-335`). The 3 textarea answers (`idealViewer`/`problemSolved`/`uniqueAngle`) are held in React state only — NOT written to DB.
- **DB write:** YES — partial (`audience_location`, `audience_occupation` only).

### Step 8 — GALLERY (templates / starter pack list)
- **Short name:** `gallery_reached`
- **File:** `src/app/admin/viral-studio/components/phases/GalleryPhase.tsx`
- **Action:** Browse templates. Click a template button → `router.push('/admin/studio/script?starter=on')` (`GalleryPhase.tsx:845`, `:941`). There is also `router.push('/admin/workflows/quick-win')` (`:778`).
- **Advance:** Hard navigation away from viral-studio. The downstream pages (`/admin/studio/script`) live outside the viral-studio component tree.
- **DB write:** **None.** The flow exits silently. **No `onboarding_completed=true`, no `onboarding_completed_at`, no `onboarding_step='complete'`, no `platform_events` event is ever emitted by viral-studio.**

### Steps 9-12 — ANALYSIS / LAB_PHASE_1 / LAB_PHASE_2 / LAB_PHASE_3 / CONTENT_CALENDAR
These phases exist in the enum and are referenced in `goToPhase` calls (`page.tsx:353-371`), but they're triggered only after a creator selects a template inside Gallery (`page.tsx:342-355` `handleTemplateSelection`). In practice, the operator screenshots the user described stop at Gallery (template list) — once they pick a template they leave viral-studio for `/admin/studio/script`. The Lab phases are alternative paths that don't appear in the standard onboarding screenshots.

### Differences from operator's reference flow

The operator's reference list:
- a) Manual vs AI Templates
- b) Niche
- c) Subtopics
- d) Goal
- e) TikTok
- f) Calibration (8 videos)
- g) Confirmation
- h) Your Story
- i) Land on /admin/studio with templates

Code reality:
- a–d match (a is ENTRY; b/c/d are sub-steps inside ONBOARDING phase)
- e matches (CHANNEL_CONNECT)
- f matches (SIGNAL_CALIBRATION)
- g matches (CALIBRATION_PROFILE — "Here's what we know")
- h matches (CREATOR_STORY)
- **MISSING from operator's list:** AUDIENCE_DIAGNOSTIC ("Your Audience" — 3 questions about ideal viewer + location/occupation enrichment), which fires conditionally between h and i for creators whose calibration produced `creator_stage='audience-first'`. Operator should consider this a valid 9th screen for those creators.
- i lands at `/admin/studio/script?starter=on` (GalleryPhase.tsx:845/:941), not the bare `/admin/studio`.

---

## Task 3 — Natural checkpoints

Per the operator-locked decision, the 8-video calibration counts as ONE checkpoint
named `calibration_done`. Below is the full set of natural checkpoints that match the
phase transitions in Task 2. Each one names the line that fires the transition.

| Checkpoint short name | Code location of the transition | Plain-English meaning of "stalled at this checkpoint" |
| --- | --- | --- |
| `entry` (default — created on row insert) | `src/lib/onboarding/get-or-create-profile.ts:54` (today's only writer of 'entry'; dead code) — OR an OB-2 hook at the start of viral-studio | They got into the platform and the row exists, but they haven't picked a content path yet. |
| `path_chosen` | `src/app/admin/viral-studio/page.tsx:208-213` (`handlePathSelection`, only fires for `ai-templates`) | They picked AI Templates and saw the niche dropdown but never selected a niche. |
| `niche_selected` | `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx:83-88` (`handleNicheSelect`) | They picked a niche but stopped before committing to subtopics. |
| `subtopics_selected` | `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx:104-106` (`handleSubtopicsContinue`) | They picked 3-5 subtopics but didn't pick a goal. |
| `goal_selected` | `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx:108-120` (`handleGoalSelect` → calls `onComplete`); transition lands in `page.tsx:215-218` (`handleOnboardingComplete`) | They finished the niche/subtopic/goal block but never opened the TikTok connect screen. |
| `channel_connected` | `src/app/admin/viral-studio/components/phases/ChannelConnectPhase.tsx:287` ("Continue" with verified data) — OR `:169` / `:327` ("Skip for now" → `onComplete(null)`); transition lands in `page.tsx:220-223` (`handleChannelConnectComplete`) | They reached the calibration screen but haven't started swiping videos. |
| `calibration_done` (LOCKED — single checkpoint covers all 8 videos) | `src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx:141-145` (`if (nextIndex >= total) ... onComplete(...)`) — runs after the 8th swipe; transition lands in `page.tsx:229-232` (`handleCalibrationComplete`) | They finished the 8 videos but haven't confirmed their inferred profile. |
| `calibration_profile_confirmed` | `src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx:60-69` (`handleSubmit`); transition lands in `page.tsx:234-271` (`handleProfileComplete`). **First DB write — `saveCalibrationProfile` + `saveCreatorStage` fire here.** | They saw "Here's what we know about you" and confirmed but never wrote their story. |
| `story_submitted` | `src/app/admin/viral-studio/components/phases/CreatorStoryPhase.tsx:34-44` (`handleSubmit`); transition lands in `page.tsx:282-309` (`handleCreatorStoryComplete`) | They submitted their transformation/myths/credentials but didn't reach the audience diagnostic OR gallery. |
| `audience_diagnostic_submitted` (only fires for `creator_stage='audience-first'`) | `src/app/admin/viral-studio/components/phases/AudienceDiagnosticPhase.tsx:64-68` (`handleSubmit`); transition lands in `page.tsx:315-336` (`handleAudienceDiagnosticComplete`) | (Audience-first stage only) They answered the 3 audience questions but didn't browse a template. |
| `complete` (CURRENT — set only by `/onboarding` page; never set by viral-studio) | `src/app/(auth)/onboarding/page.tsx:113`. **There is currently NO write of `complete` from viral-studio when the user reaches gallery.** A future OB-2 hook would attach to `GalleryPhase.tsx:845` / `:941` (the template-click `router.push`). | They reached the template gallery but never picked one to start scripting. |

### Locked operator interpretation: "stalled" today

Per the operator's locked decision: until real checkpoints accumulate, "stalled
creators" = "started onboarding (i.e., have an `onboarding_profiles` row) but did not
reach `onboarding_step='complete'` OR `onboarding_completed=true`."

Today this collapses into "any row with `onboarding_step != 'complete'`" since the
viral-studio flow never advances `onboarding_step` past its default `'entry'`. In
practice that is also "any row with `onboarding_completed != true`" since
`onboarding_completed` defaults to `false` (`20260321_onboarding_session3_columns.sql`).

---

## Task 4 — Database write strategy

### a) Does `onboarding_step` have a CHECK constraint?

**No.** Grep across `supabase/migrations/` for `CHECK\s*\(.*onboarding_step` returns
zero matches. Grep for `onboarding_step` returns only two files (the original
`20260321_core_onboarding_tables.sql` and the merge migration
`20260322_merge_calibration_into_onboarding.sql`).

The defining migration is `supabase/migrations/20260321_core_onboarding_tables.sql:11-78`.
The relevant declaration:

```sql
create table if not exists onboarding_profiles (
  ...
  onboarding_step text default 'entry',
  ...
);
```

**Free-form `text` with default `'entry'`.** No enum, no CHECK constraint, no
foreign key. OB-2 can write any string value to it without DB-level rejection.

The operator should run `\d onboarding_profiles` in Supabase Studio to confirm there
is no out-of-band CHECK constraint on the live DB; the migration files do not declare
one but that's not a guarantee.

### b) Allowed values

Not applicable — no constraint. Any string is accepted. Today only three string
values are written anywhere in code or migrations:
- `'entry'` (default + `get-or-create-profile.ts:54`, dead code)
- `'complete'` (`/onboarding/page.tsx:113`)
- `'migrated'` (`20260322_merge_calibration_into_onboarding.sql:116`, one-time backfill)

### c) Is there an `updated_at` or `last_step_at` column?

**There is `updated_at`** (`20260321_core_onboarding_tables.sql:15` —
`updated_at timestamptz default now()`).

There is NO column named `last_step_at` or `step_updated_at`. Grep confirms:
no migration file or source file in `src/` mentions either name.

### Behaviour of `updated_at` today

`updated_at` is a column with `default now()` BUT **there is no DB trigger that
updates it on row update.** In the migration file, no `CREATE TRIGGER ... BEFORE UPDATE`
or `update_updated_at_column()` function is declared on `onboarding_profiles`.

The application code that writes to `onboarding_profiles` is responsible for setting
`updated_at = now()` manually:

| Write site | Sets `updated_at` manually? |
| --- | --- |
| `src/lib/onboarding/update-profile-step.ts:31` | YES (`updated_at: new Date().toISOString()`) — but dead code |
| `src/lib/onboarding/calibration-db.ts:30-52` (`saveCalibrationProfile` upsert) | NO — relies on default for inserts, doesn't set on conflict update |
| `src/lib/onboarding/calibration-db.ts:107-113` (`saveCreatorStage`) | NO |
| `src/app/admin/viral-studio/page.tsx:293-296` (cal_creator_story update) | NO |
| `src/app/admin/viral-studio/page.tsx:325-330` (audience enrichment update) | NO |
| `src/app/(auth)/onboarding/page.tsx:111-119` (`/onboarding` final write) | NO |
| `src/app/api/invite-acknowledge/[id]/route.ts:89-93` | doesn't touch onboarding_profiles |

**Implication for OB-2:** today, `updated_at` is unreliable as a "how long has this
creator been at this step" marker. Every fire-and-forget `.update(...)` from
viral-studio writes specific columns but does NOT bump `updated_at`. So a creator who
hasn't moved in 6 days but had their `cal_creator_story` saved 6 days ago will still
show `updated_at` as 6 days old — that's accidentally correct for stalls, but for
the same reason a row updated last week by some unrelated agency-ID backfill or RLS
test might appear "stalled at calibration" even though they finished a year ago.

**Status:** column EXISTS but is not auto-bumped. OB-2's read query "stalled at
<checkpoint> for X days" REQUIRES either:
- a server-side trigger that bumps `updated_at` on UPDATE (not present today), OR
- every checkpoint write must explicitly include `updated_at: now()`, OR
- a new dedicated column like `last_step_at` that gets stamped only when
  `onboarding_step` changes.

This investigation does not pick — the operator instructed not to propose schema
changes. Just identifying what exists.

---

## Task 5 — The bridge gap

### File + line where invite acceptance is handled

`src/app/api/invite-acknowledge/[id]/route.ts`. The full handler is the `GET` function
at line 22. Acceptance write is at lines 88-93:

```ts
await db
  .from('agency_invites')
  .update({ status: 'accepted', accepted_at: new Date().toISOString() })
  .eq('id', inviteId)
  .in('status', ['sent', 'pending'])
```

Audit event emitted at lines 99-106:

```ts
emitEvent({
  eventType: 'invite.accepted_via_email_link',
  payload: { inviteId },
  actorType: 'user',
  agencyId: invite.agency_id ?? undefined,
  entityType: 'agency_invite',
  entityId: inviteId,
})
```

### What it writes today

- `agency_invites.status = 'accepted'`
- `agency_invites.accepted_at = now()`
- `platform_events` row via `emitEvent` — type `invite.accepted_via_email_link`

### What it does NOT write that OB-2 will need

CONFIRMED — the prior investigation was correct: **no `onboarding_profiles` row is
created at this step.** Verified by:

1. The full handler (`src/app/api/invite-acknowledge/[id]/route.ts:22-117`) does not
   reference `onboarding_profiles`. Grep confirms.
2. There is no listener anywhere in `src/` for the `invite.accepted_via_email_link`
   event. Grep for that string returns only the emit site itself.
3. The HTML response at line 109-115 says the agency will be in touch — no redirect,
   no signup link, no creator handoff URL.

So at acceptance time:
- An `agency_invites` row is updated to `accepted`.
- A `platform_events` audit row is written.
- **No `onboarding_profiles` row is created.** OB-2 cannot say "Vivian accepted but
  hasn't started her profile" because there is no row to query.
- **No `onboarding.started` or similar event** is emitted that would let the morning
  briefing surface the bridge gap.
- The creator has no link to `/admin/viral-studio` from the acceptance page.

For OB-2 to mark "accepted but hasn't started," the operator's plan needs to choose
one of: (a) handler creates a placeholder `onboarding_profiles` row at acceptance,
or (b) Clay queries `agency_invites WHERE status='accepted' AND <no matching profile row>`
as a separate funnel surface. This investigation flags the gap; does not pick.

---

## Task 6 — Existing read paths (Clay tools that touch onboarding_profiles)

### Clay agent tools (registered tools the LLM can call)

Per the prior investigation T6 (still accurate — confirmed via re-grep):

`src/app/api/agency-chat/route.ts:1797-1804` assembles the agent's tools. The 12
propose-only write tools come from `src/lib/agent/handler-adapters.ts:251-264` and
the 3 inline read tools come from the route file itself.

**None of the 15 registered tools touch `onboarding_profiles` directly.** Grep confirms:

```
$ Grep "onboarding_profiles" src/lib/agent/
→ 0 matches
$ Grep "onboarding_profiles" src/lib/clay/action-handler.ts
→ 7 matches, ALL of them in handler bodies that resolve creator names or agency-id
  lookups — not exposed as tool parameters.
```

The 3 read tools (`get_briefs_by_status`, `get_unacknowledged_briefs`,
`get_performance_summary`) all hit `/api/brief-status` and `/api/brief-performance`
exclusively — neither endpoint reads `onboarding_profiles` for filtering.

### Component data fetchers (Clay UI cards)

Five fetchers in `src/lib/clay/component-data-fetcher.ts` read `onboarding_profiles`,
but only to dereference creator NAMES — never to filter by `onboarding_step` or
`creator_stage`:

| Line | Fetcher | What it does with onboarding_profiles |
| --- | --- | --- |
| 168 | `fetchContentBrief` | `.select('business_name').eq('user_id', brief.client_id).single()` |
| 200-201 | `fetchCreatorProfile` | `.select('id, user_id, business_name, tiktok_handle, selected_niche, niche_key, follower_count, actual_follower_count, creator_stage')` — selects `creator_stage` but the `CreatorProfileCard` JSX does not render it |
| 413 | `fetchTrendCard` | `.select('selected_niche, niche_key')` to compute "agency niches" |
| 502 | `fetchPerformanceTimeline` | `.select('business_name')` to label the chart |
| 605 | `fetchMomentumDecay` | `.select('business_name')` — name lookup |

**No fetcher filters or sorts by `onboarding_step` or `staged_at`.**
Confirmed by grep:

```
$ Grep "\.eq\(['\"]onboarding_step|\.in\(['\"]onboarding_step|\.eq\(['\"]creator_stage|\.order\(['\"]staged_at" src/
→ 0 matches.
```

### Agent context bundle (the system-prompt build that loads `onboarding_profiles`)

`src/app/api/agency-chat/route.ts` loads `onboarding_profiles` twice during the
system-prompt assembly:

- Line 494-496: `.select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step').in('user_id', safeCreatorIds)` — drives the compact `CreatorCard` status (`status: toCardStatus(creator.creator_stage, creator.onboarding_step)` at line 648).
- Line 500-501: `.select('*').in('user_id', safeCreatorIds).order('created_at', { ascending: false })` — full rows that drive `pipelineData` (line 698-709).

Both reads are unconditional on `onboarding_step` / `creator_stage` value (no `eq` /
`in` filter), and ordering is by `created_at` not by the step pointer.

`pipelineData` at line 698-709 buckets creators into 5 named stages via
`determineStage(profile)` at line 681-688. That function inspects `onboarding_step`
in two clauses:

```ts
if (profile.calibration_started_at || profile.calibration_status === 'in_progress' || profile.onboarding_step === 'calibration') return 'calibrating';
if (profile.profile_completed_at || profile.onboarding_step === 'profile' || profile.accepted_at) return 'profile_setup';
```

Since the codebase never writes `onboarding_step='calibration'` or
`onboarding_step='profile'` (Task 7), these clauses never match. The function falls
through to `return 'profile_setup'` for every in-flight creator.

### Notifications (`proactive-engine.ts`)

`src/lib/notifications/proactive-engine.ts:57-85` `detectStalledCreators()` operates
on the in-memory `data.onboardingProfiles` array (loaded by the agency-chat route
above). It compares `stage = creator_stage || onboarding_step || ''` against the
literal `'active'` (line 63). As the prior investigation flagged and Task 7 confirms,
no code anywhere writes `'active'` to either column, so this rule almost never fires.

---

## Task 7 — Existing stalled-detection code

### Exact file + function

`src/lib/notifications/proactive-engine.ts:57-85`, function `detectStalledCreators`.

Full body (lines 57-85, file-line accurate):

```ts
function detectStalledCreators(data: AgencyData): ProactiveAlert[] {
  const now = Date.now();
  const alerts: ProactiveAlert[] = [];

  for (const profile of data.onboardingProfiles) {
    const stage = profile.creator_stage || profile.onboarding_step || '';
    if (stage === 'active') continue;

    const updatedAt = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
    if (!updatedAt) continue;

    const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate < 7) continue;

    const name = profile.business_name || profile.creator_name || 'Unknown';
    alerts.push({
      id: `stalled_creator_${slugify(name)}`,
      priority: 'high',
      type: 'stalled_creator',
      title: `${name} has been stalled in ${stage} for ${daysSinceUpdate} days`,
      description: `This creator hasn't progressed since ${new Date(updatedAt).toLocaleDateString()}.`,
      affected_creators: [name],
      suggested_action: 'Send a nudge to get them moving',
      data: { creator_name: name, stage, days_stalled: daysSinceUpdate },
    });
  }

  return alerts;
}
```

### Current broken check

Line 63: `if (stage === 'active') continue;`

The intent is to skip "already active" creators. But "active" is never a value
written to either `creator_stage` or `onboarding_step` anywhere in this codebase.
Effectively the early-return never fires, and the function correctly evaluates the
remaining "≥7 days stale" check on every onboarding row. The bug is that the
*opposite* polarity is also wrong: it cannot distinguish "completed onboarding"
from "stalled mid-onboarding." Every creator who finished onboarding is still
flagged if they haven't been written to in 7 days.

### What real `onboarding_step` values exist in the codebase today

Comprehensive grep on `onboarding_step\s*[:=]|onboarding_step['"]\s*:`:

```
src/app/(auth)/onboarding/page.tsx:113:        onboarding_step: 'complete',
src/app/dashboard/page.tsx:34:  onboarding_step: string;            ← TYPE, not a value
src/lib/onboarding/update-profile-step.ts:30:      onboarding_step: step,    ← passes through caller
src/lib/onboarding/get-or-create-profile.ts:7:  onboarding_step: string;     ← TYPE, not a value
src/lib/onboarding/get-or-create-profile.ts:54:      onboarding_step: 'entry',
src/app/api/agency-chat/route.ts:684:    ... profile.onboarding_step === 'calibration' ...
src/app/api/agency-chat/route.ts:685:    ... profile.onboarding_step === 'profile' ...
```

Migrations grep — only `'migrated'` (`20260322_merge_calibration_into_onboarding.sql:116`).

**Real values written in the application today: `'entry'`, `'complete'`, `'migrated'`.**
The two checks on `'calibration'` and `'profile'` in `agency-chat/route.ts:684-685`
are READ-side guards that would only match if some out-of-band code wrote those
strings — no code in this codebase does.

`creator_stage` values come from the enum in `src/lib/onboarding/creator-stage.ts:18-24`:
`'ready-to-ship' | 'audience-first' | 'style-refinement' | 'foundation' | 'advanced' | 'delivery-improvement'`. None of these match `'active'` either, confirming the
bug is purely in the comparator.

---

## Task 8 — Morning briefing signal types

### Cron file path

The Vercel-managed cron handler: `src/app/api/cron/overnight-triage/route.ts`. It
calls `runTriageForAllAgencies()` at line 35 (defined in
`src/lib/triage/overnight-triage.ts:43-93`).

There is also a manual-trigger sibling at `src/app/api/triage/run/route.ts` and a
read endpoint at `src/app/api/triage/today/route.ts` (consumed by the
agency-client morning auto-greeting in `src/app/agency/AgencyClient.tsx:680-720`).

A legacy node-cron registration exists at `src/lib/cron/scheduler.ts:212` per the
file header at `src/app/api/cron/overnight-triage/route.ts:13-15`, but that is not
the production path on Vercel. The `vercel.json` cron entry triggers the route at
`/api/cron/overnight-triage`.

### Where signal types are defined/enumerated

`src/lib/clay/intelligent-clay-registry.ts:300`:

```ts
export type TriageItemType = 'overdue_brief' | 'performance_highlight' | 'trend_opportunity';
```

These are still the only three. Confirmed via grep — no `'stalled_creator'`,
`'stalled_onboarding'`, `'invite_accepted'`, `'invite_overdue'`, etc. variants
appear.

The 3-type union is used downstream:

| File | Line | Usage |
| --- | --- | --- |
| `src/lib/clay/intelligent-clay-registry.ts` | 302-314 | `TriageItem` interface — `type: TriageItemType` |
| `src/lib/clay/intelligent-clay-registry.ts` | 320-333 | `URGENCY_SCORING` — formula per type |
| `src/lib/clay/intelligent-clay-registry.ts` | 336-340 | `TRIAGE_TYPE_PRIORITY` — tie-break ranking |
| `src/lib/triage/overnight-triage.ts` | (whole file) | three detector functions, one per type, and the writer |
| `src/app/api/agency-chat/route.ts` | 227-336 | `buildTriageSpec()` — the deterministic JSONL builder; `typeLabel` and `actionsForTriageItem()` are switch statements over `TriageItemType` (170-225) |

### How a new signal type would be added (documentation only — DO NOT add)

Adding a 4th signal type (e.g. `'stalled_onboarding'`) is a 4-edit operation:

1. **Type union** — extend `src/lib/clay/intelligent-clay-registry.ts:300` to add the
   new variant: `... | 'stalled_onboarding'`.
2. **Urgency formula** — add an entry to `URGENCY_SCORING` at
   `intelligent-clay-registry.ts:320-333` with a `formula` and `description`.
3. **Tie-break priority** — add an entry to `TRIAGE_TYPE_PRIORITY` at line 336-340
   (records can't be partial — TypeScript will require it).
4. **Detector function** — add a new function in `src/lib/triage/overnight-triage.ts`
   that scans `onboarding_profiles` for the agency, computes urgency, and pushes
   `TriageItem` objects into `allItems` inside `runTriageForAgency()`. Then add
   typeLabel + action mapping in `src/app/api/agency-chat/route.ts`:
   - `getTypeLabel(item: TriageItem)` switch (verify by reading `:227-336` for the
     exact name; the switch is the rendering function `buildTriageSpec`).
   - `actionsForTriageItem(item)` (line 170-225).

The deterministic JSONL spec builder in `agency-chat/route.ts` is a plain switch on
`item.type` — TypeScript exhaustiveness will surface the missing branch at
build-time once the type is widened.

---

## Appendix — Quick links to load-bearing locations

Phase enum + transition wiring:
- `src/app/admin/viral-studio/page.tsx:31-45` — phase enum
- `src/app/admin/viral-studio/page.tsx:208-371` — phase handlers (each `handleXxx` is a transition firing point)

Phase components + completion handlers:
- `src/app/admin/viral-studio/components/phases/EntryPhase.tsx:11-20` — path choice
- `src/app/admin/viral-studio/components/phases/OnboardingPhase.tsx:75-120` — niche/subtopics/goal
- `src/app/admin/viral-studio/components/phases/ChannelConnectPhase.tsx:59-97` — TikTok verify, plus :169 / :287 / :327 for completion buttons
- `src/app/admin/viral-studio/components/phases/SignalCalibrationPhase.tsx:117-151` — 8-video calibration finish
- `src/app/admin/viral-studio/components/phases/CalibrationProfilePhase.tsx:23-69` — confirmation submit
- `src/app/admin/viral-studio/components/phases/CreatorStoryPhase.tsx:20-44` — story submit
- `src/app/admin/viral-studio/components/phases/AudienceDiagnosticPhase.tsx:43-68` — audience submit
- `src/app/admin/viral-studio/components/phases/GalleryPhase.tsx:845`, `:941` — exit to `/admin/studio/script`

DB layer:
- `src/lib/onboarding/calibration-db.ts:17-115` — saveCalibrationProfile, loadCalibrationProfile, saveCreatorStage
- `src/lib/onboarding/get-or-create-profile.ts` — dead code, never called
- `src/lib/onboarding/update-profile-step.ts` — dead code, never called

Schema:
- `supabase/migrations/20260321_core_onboarding_tables.sql:11-78` — base table
- `supabase/migrations/20260322_merge_calibration_into_onboarding.sql:11-48` — `creator_stage`, `dimension_scores`, `staged_at`

Invite lifecycle:
- `src/app/api/invites/send/route.ts:50-93` — invite send
- `src/app/api/invite-acknowledge/[id]/route.ts:22-117` — invite acceptance (no profile row created)
- `src/lib/email/send-invite.ts:122-128` — accept URL construction

Stalled detection (broken):
- `src/lib/notifications/proactive-engine.ts:57-85` — `detectStalledCreators`

Triage / morning brief:
- `src/lib/clay/intelligent-clay-registry.ts:300` — `TriageItemType`
- `src/lib/triage/overnight-triage.ts:43-93` — `runTriageForAllAgencies`
- `src/app/api/cron/overnight-triage/route.ts` — Vercel cron handler
- `src/app/api/agency-chat/route.ts:227-336` — JSONL spec builder for morning brief
- `src/app/agency/AgencyClient.tsx:680-720` — auto-greeting consumer (per prior investigation)

Read-side (Clay):
- `src/app/api/agency-chat/route.ts:494-501` — onboarding_profiles loads
- `src/app/api/agency-chat/route.ts:681-688` — `determineStage` (broken — never matches `'calibration'` / `'profile'`)
- `src/lib/clay/component-data-fetcher.ts:168, 200-201, 413, 502, 605` — name dereferences only, no step filters
