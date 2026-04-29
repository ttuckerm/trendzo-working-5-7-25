# AI EMPLOYEE GAP REPORT — v2 Architecture vs. Current Code

**Date:** 2026-04-24
**Scope:** Read-only diagnostic. Zero code changes.
**Sources read in full:**
- `AI_EMPLOYEE_1_ARCHITECTURE_v2.md`
- `AI_EMPLOYEE_2_ONBOARDING_SPECIALIST_v2.md`
- `AI_EMPLOYEE_3_TREND_SCOUT_v2.md`
- `AI_EMPLOYEE_4_PERFORMANCE_ANALYST_v2.md`
- `AI_EMPLOYEE_5_PROJECT_MANAGER_v2_.md`  ← actual filename has trailing underscore
- `AI EMPLOYEE ARCHITECTURE.md` (root, dated 2026-04-14, marked "LOCKED REFERENCE")
- `SUBSTRATE_FRAMEWORK.md` (the closest thing to a "conversation substrate" doc; see contradictions §3)
- `SUBSTRATE_AUDIT_2026-04-21.md` (the ~700-line audit the v2 docs cite as their evidence base)

**Code spot-checked (read-only):**
- `vercel.json` (cron schedule)
- `src/lib/agent/handler-adapters.ts` (12 propose/real adapters, dated 2026-04-21 commit `c56e499`)
- `src/lib/agent/tool-registry.ts` (registers `propose_<id>` per adapter)
- `src/lib/clay/action-handler.ts` (referenced — switch dispatcher)

**Search for "conversation substrate" / "substrate decision" / "conversation is the substrate":**
No file matched any of those phrases (case-insensitive). The closest artifacts are `SUBSTRATE_FRAMEWORK.md` (declares the **prediction** as substrate, and conversation as a *parallel* primitive) and the v2 docs themselves, which embed the "conversation is substrate" principle in each employee preamble. **No standalone "conversation as substrate" decision document exists.** This is a contradiction; see §3.

---

## 0. CONTRADICTIONS — read this before anything else

### 0.1 v2 docs vs. April-14 `AI EMPLOYEE ARCHITECTURE.md` (Account Manager status)

| Workflow | April-14 doc says | v2 doc says |
|---|---|---|
| AM-1 Brief Delivery | Clay tool ❌ | Clay tool **BUILT** (`propose_push_brief_to_creators` + `push_brief_to_creators`) |
| AM-2 Acknowledgment | "No creator-facing acknowledgment link in email" | Acknowledgment link **exists** in delivered emails (cites `src/lib/email/send-brief.ts`) |
| AM-3 Non-Response Follow-Up | NOT BUILT | PARTIAL — manual nudge path **BUILT** (`propose_nudge_creator` + `nudge_creator`); only auto-trigger missing |
| AM-4 Production Tracking | Clay tool ❌ | Clay tool **BUILT** (`propose_update_brief_status` + `update_brief_status`) |
| AM-5 Publication Confirmation | Clay tool ❌ | Same `update_brief_status` adapter handles `new_status='published'`, **BUILT** |

The April-14 doc is labeled "LOCKED REFERENCE" but is now stale on every Account Manager workflow. The v2 docs are correct about the adapters existing — `src/lib/agent/handler-adapters.ts` (commit `c56e499`, 2026-04-21) registers all 12 listed adapters including `nudge_creator`, `update_brief_status`, `log_performance`, `push_brief_to_creators`, `send_invite`, `schedule_post`, `generate_report`. **Decision needed:** which doc is canonical going forward.

### 0.2 v2 docs vs. their own evidence base (`SUBSTRATE_AUDIT_2026-04-21.md`)

The audit (line 12 executive summary) states: *"Only **two write-tool adapter pairs** are registered for Clay (`nudge_creator`, `update_brief_status`)"*. This is **already stale in the code as of the audit's own commit date** — `handler-adapters.ts` was updated to 12 adapters in commit `c56e499` on 2026-04-21 (same day as the audit). Several v2 doc claims that "no Clay adapter exists" for OB-1, PA-1, PA-3, PM-4, etc. are **wrong**: a `propose_<id>` tool *does* exist for each of those actions (`send_invite`, `log_performance`, `generate_report`, `schedule_post`). What is genuinely missing in many cases is the **read** tool, the **API route auth model**, the **downstream consumer**, or the **Dashboard surface** — not the proposal-gated Clay tool.

**Implication:** The v2 docs underestimate Clay tool coverage and overestimate the work needed for "wire as Clay tool call." Real gaps are mostly in (a) auto-triggers (cron), (b) read tools, (c) Dashboard surfaces, (d) downstream consumers.

### 0.3 `SUBSTRATE_FRAMEWORK.md` vs. v2 docs (which primitive is "the substrate"?)

`SUBSTRATE_FRAMEWORK.md` line 5: *"Your technical substrate is **the prediction**. Every feature you build is a new surface the prediction shows up through."* The v2 docs and the user prompt assert *"the conversation is the substrate for the entire platform."* These are not the same primitive. Both may be true at different layers (prediction = data primitive; conversation = interaction primitive), but **no document reconciles them**. Decision needed.

### 0.4 Schema-code drift the v2 docs flag accurately
- `agency-chat/route.ts:869` reads `brief.deadline`, but **no `deadline` column exists** on `content_briefs` (PM-2). Confirmed against `SUBSTRATE_AUDIT_2026-04-21.md` §1.A column list.
- `intelligent-clay-registry.ts:247` declares `targetTable='scheduled_actions'` for `schedule_post`, but the handler (`action-handler.ts:920`) writes to `content_briefs.scheduled_publish_at`. Registry-handler mismatch (PM-4).
- v2 docs reference an `invitations` table; actual table is `agency_invites` (audit §1.A). OB-1 / OB-3 doc copy is therefore wrong about table name.
- v2 docs reference five tables that **do not exist at all**: `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log` (TS-2, TS-4, PA-3, PA-4, PM-5).

---

## 1. AI EMPLOYEE 1 — ACCOUNT MANAGER

### A. Workflow inventory

| ID | Description (verbatim from v2 doc) |
|---|---|
| AM-1 | Brief Delivery — operator approves brief → email delivered to creator with read receipt + acknowledgment link |
| AM-2 | Acknowledgment — creator clicks acknowledgment link in email → brief status flips to `acknowledged` |
| AM-3 | Non-Response Follow-Up — unacknowledged briefs >24h → automatic nudge email (with manual override path) |
| AM-4 | Production Tracking — operator/creator updates brief status as work progresses (`acknowledged → in_production → published`) |
| AM-5 | Publication Confirmation — creator marks published, supplies URL → Performance Analyst handoff |

### B. Substrate status per workflow

#### AM-1 Brief Delivery
- **DB schema:** COMPLETE — `content_briefs.delivered_at` (`20260420_add_delivered_at_to_content_briefs.sql:8`), `delivery_status` (`20260413:5`), `opened_at`/`clicked_at`/`open_count` (`20260417_email_tracking:12-14`)
- **API route:** COMPLETE — `src/app/api/agency/brief-review/route.ts` (approval + delivery), `/api/clay/action` (proposal-gated execution)
- **Clay tool call:** COMPLETE — `propose_push_brief_to_creators` (`handler-adapters.ts:170`), real handler in `action-handler.ts` switch
- **Dashboard UI:** COMPLETE — `DashboardClient.tsx` brief review surface (per audit §4)
- **Auto-trigger:** N/A by design (operator-initiated)

#### AM-2 Acknowledgment
- **DB schema:** COMPLETE — `acknowledged_at` (`20260414_completion_status:6`)
- **API route:** COMPLETE — `/api/brief-acknowledge` (per audit §2.D #2), one-click link path exists
- **Clay tool call:** PARTIAL — `propose_update_brief_status` adapter handles `new_status='acknowledged'` (`handler-adapters.ts:75`); **no dedicated read tool** to query "which briefs are still unacknowledged?" without operator already knowing the brief id
- **Dashboard UI:** COMPLETE — status badges + manual acknowledgment button
- **Auto-trigger:** N/A (creator-initiated)

#### AM-3 Non-Response Follow-Up
- **DB schema:** COMPLETE — `last_nudged_at` + `nudge_count` (`20260417_phase1_action_scaffolding:61-62`)
- **API route:** COMPLETE for manual path (`nudge_creator` handler in `action-handler.ts`); MISSING for scheduled cron
- **Clay tool call:** COMPLETE for manual path — `propose_nudge_creator` (`handler-adapters.ts:62`)
- **Dashboard UI:** COMPLETE — manual "Send Nudge" ActionButton on overdue cards
- **Auto-trigger:** **MISSING** — no cron entry in `vercel.json` (the 6 existing crons are: `recency-decay`, `freedom-agent/weekly-checkin`, `atlas/feedback-collector`, `cultural-scan`, `classify-events`, `overnight-triage`). No `/api/cron/nudge-stale-briefs` or equivalent

#### AM-4 Production Tracking
- **DB schema:** COMPLETE — `in_production_at`, `completion_status` (`20260414_completion_status:5,7`)
- **API route:** COMPLETE — `/api/brief-status` (but service-role without agency scoping per audit §2.D #2; **see broken assumption D.2**)
- **Clay tool call:** COMPLETE — `propose_update_brief_status` (`handler-adapters.ts:75`) covers `acknowledged|in_production|published`
- **Dashboard UI:** COMPLETE — status badges + manual update buttons
- **Auto-trigger:** N/A (operator/creator-initiated)

#### AM-5 Publication Confirmation
- **DB schema:** COMPLETE — `published_at`, `published_url` (`20260414_completion_status:8-9`)
- **API route:** COMPLETE — same `/api/brief-status` route accepts `published_url`
- **Clay tool call:** COMPLETE — `propose_update_brief_status` accepts `published_url` param (`handler-adapters.ts:73`)
- **Dashboard UI:** COMPLETE — published-URL field on completion form
- **Auto-trigger:** N/A (creator-initiated)

### C. Conformance to "conversation is substrate"
All five AM workflows have a `propose_<id>` Clay tool registered, and all five have a Dashboard ActionButton path. The principle is **respected for AM-1, AM-3 (manual path), AM-4, AM-5**. AM-2 is borderline: the operator can update status via Clay, but there is no read tool that lets the agent volunteer *"these 3 briefs are stuck at unacknowledged"* without the operator first asking — i.e., the conversation can react but cannot proactively surface the gap.

### D. Critical broken assumptions
1. **Doc claims `vercel.json` has a `nudge-stale-briefs` cron entry "ready to add."** It does not. The cron schedule is the 6 entries listed above. AM-3 auto-trigger is blocked on Phase F substrate work per the v2 doc's own dependency map.
2. **Doc claims `/api/brief-status` is safely callable from Clay.** It is, but it's also callable by **any unauthenticated request** with a valid brief id, because the route uses the Supabase service role and does not enforce `agency_id` scoping (`SUBSTRATE_AUDIT_2026-04-21.md` §2.D, finding #2). This is a cross-tenant leak, not just a "wiring" gap. The same applies to `/api/brief-performance` (AM-5 / PA-1) and `/api/brief-acknowledge` (AM-2).
3. **No `agency_id` column on `content_briefs`.** Creator/agency identity is derived by joining `onboarding_profiles.user_id`. Every "list overdue briefs for agency X" query is a join, not a filter. Audit §1.A flags this; the April-22 commit `ad3b784` ("substrate: Fix 1 (content_briefs.agency_id)") suggests work has begun but the v2 docs don't confirm it landed in production schema. **AMBIGUOUS** — verify migration applied.

---

## 2. AI EMPLOYEE 2 — ONBOARDING SPECIALIST

### A. Workflow inventory

| ID | Description |
|---|---|
| OB-1 | Creator Invitation — operator invites creator (Clay or Dashboard) → email sent + tracking row |
| OB-2 | Onboarding Progress Tracking — system tracks each onboarding stage (`Account Created → Profile Started → Content Linked → Fingerprint Generated → Active`) |
| OB-3 | Stall Detection & Auto-Nudge — invites at same stage 48h+ → auto-nudge email; escalation after 2 nudges |
| OB-4 | Auto-Profiling — creator links TikTok → SKILL-001 runs automatically (58-feature fingerprint, DPS baseline, staging path) |

### B. Substrate status per workflow

#### OB-1 Invitation
- **DB schema:** PARTIAL — `agency_invites` table exists (NOT `invitations`); v2 doc references a different table name. Missing: `nudge_count`, `last_nudge_at`, `nudge_stage` columns required by OB-3.
- **API route:** PARTIAL — `agency-chat/route.ts` references `agency_invitations` (plural typo per audit), email send is **stubbed** (no SMTP wired in production)
- **Clay tool call:** COMPLETE (registered) — `propose_send_invite` (`handler-adapters.ts:124`), but the underlying handler likely no-ops on email send
- **Dashboard UI:** PARTIAL — invite button surface exists in agency dashboard but no progress confirmation
- **Auto-trigger:** N/A by design

#### OB-2 Onboarding Progress Tracking
- **DB schema:** PARTIAL — `onboarding_profiles.onboarding_step`, `onboarding_completed`, `calibration_completed` exist (`20260321_core_onboarding_tables.sql`); no enumerated 5-stage column matching the doc's pipeline (`Account Created → Profile Started → Content Linked → Fingerprint Generated → Active`)
- **API route:** PARTIAL — onboarding endpoints exist but no aggregated "pipeline status" route
- **Clay tool call:** **MISSING** — no `get_onboarding_status` read tool registered
- **Dashboard UI:** **MISSING** — no `/agency/onboarding` pipeline page (audit §4 calls it "read-only surface" placeholder)
- **Auto-trigger:** N/A (event-driven, but `platform_events` emissions are inconsistent across onboarding steps per audit §2.E)

#### OB-3 Stall Detection & Auto-Nudge
- **DB schema:** **MISSING** — `agency_invites` lacks `nudge_count`, `last_nudge_at`, `nudge_stage` columns (audit §1.A). No migration found.
- **API route:** **MISSING** — no manual `nudge_invite` handler, no `/api/cron/nudge-stalled-onboarding`
- **Clay tool call:** **MISSING** — no `propose_nudge_invite` adapter in `handler-adapters.ts` ADAPTERS map
- **Dashboard UI:** **MISSING** — no stalled-invite surface, no nudge history hover
- **Auto-trigger:** **MISSING** — no cron entry in `vercel.json`; v2 doc declares this blocked on Phase F (memory + scheduled-actions substrate)

#### OB-4 Auto-Profiling
- **DB schema:** PARTIAL — `onboarding_profiles` is the canonical creator table (audit §1.A, layer-4 SoT), but profile-builder code writes to `creator_profiles` (`src/lib/creator/profile_builder.ts`) — **wrong table** per the canonical-table decision. Fingerprint stored as 32-element hash, not the 58-feature vector the doc specifies.
- **API route:** PARTIAL — `rebuildCreatorProfile` function exists but is not exposed as an HTTP route triggered by TikTok-link event
- **Clay tool call:** **MISSING** — no `propose_run_profiling` or equivalent
- **Dashboard UI:** **MISSING** — no "Run Profiling" button on creator card
- **Auto-trigger:** **MISSING** — TikTok-link event does not invoke profile builder (no listener)

### C. Conformance to "conversation is substrate"
- OB-1 conforms (Clay propose tool exists), but the underlying email send is stubbed → calling the tool from Clay produces a confirmation card but no email actually sends.
- OB-2 violates the principle — the agent has no read tool to answer "How's Jake's onboarding going?"
- OB-3 violates the principle — neither manual nor auto path is reachable via Clay.
- OB-4 violates the principle — the auto-profiling action is not exposed as a tool, and the underlying function writes to the wrong table.

### D. Critical broken assumptions
1. **Doc references `invitations` table.** Real table is `agency_invites`. All SQL examples in OB-1/OB-3 are against a non-existent table name.
2. **OB-3 schema (`nudge_count`, `last_nudge_at`, `nudge_stage`) does not exist** on `agency_invites`. No migration. Auto-nudge is fully blocked at the schema layer.
3. **OB-4 writes to `creator_profiles`, not `onboarding_profiles`.** This perpetuates the three-parallel-creator-tables problem (audit §1.C). Every consumer of the new canonical table will miss this data.
4. **OB-4 fingerprint is 32-element hash, not 58-feature vector.** SKILL-002 (Video Fingerprinting) is "blocked on input interview" per the April-14 dependency map, so the v2 doc is asking for output that is not yet specified.
5. **OB-2 pipeline stages are not modeled in schema.** The 5-stage progression (`Account Created → ... → Active`) lives only in the doc; `onboarding_profiles.onboarding_step` is a free-form integer/text not constrained to those values.

---

## 3. AI EMPLOYEE 3 — TREND SCOUT

### A. Workflow inventory

| ID | Description |
|---|---|
| TS-1 | Continuous Trend Monitoring — scheduled scan of cultural signals (TikTok, Reddit, X, news), score by velocity + niche relevance + window |
| TS-2 | Trend-to-Creator Matching — match new trend to creators by fingerprint/niche/history → match score + reason |
| TS-3 | Auto-Brief Generation from Trends — high-confidence match → auto-generate draft brief; below threshold → operator review |
| TS-4 | Creator-Facing Trend Alerts — operator-enabled per creator; in-app/email notification when trend matched |

### B. Substrate status per workflow

#### TS-1 Continuous Trend Monitoring
- **DB schema:** COMPLETE — `cultural_events` (`20260407_create_cultural_events.sql`), `detected_trends` (`20260407_create_detected_trends.sql`), `agent_attribution` (`20260407_agent_attribution.sql`)
- **API route:** PARTIAL — `/api/cron/cultural-scan/route.ts` exists
- **Clay tool call:** **MISSING** — no `get_trending_topics` read tool
- **Dashboard UI:** PARTIAL — `src/app/agency/trends/page.tsx` exists but uses fabricated `Math.random()` data per audit §10
- **Auto-trigger:** **PARTIAL** — `vercel.json` line 19-20 schedules `/api/cron/cultural-scan` daily at 00:30, and line 23-24 schedules `/api/cron/classify-events` daily at 01:00. Doc asks for 1-6 hour interval; current is 24h. Manual refresh path is missing.

#### TS-2 Trend-to-Creator Matching
- **DB schema:** **MISSING** — no `trend_creator_matches` table. No migration.
- **API route:** **MISSING**
- **Clay tool call:** **MISSING** — no `get_trend_matches`. The existing `propose_match_creators_to_event` adapter (`handler-adapters.ts:158`) matches against agency_events table by category, not against detected_trends with multi-signal scoring.
- **Dashboard UI:** **MISSING** — no "Matched Creators" section on trend cards
- **Auto-trigger:** **MISSING** — no listener on `trend.detected` events

#### TS-3 Auto-Brief Generation from Trends
- **DB schema:** PARTIAL — `pre_generated_briefs` exists (`20260407_autodream_tables.sql`), but missing `trend_match_id` FK column the v2 doc requires
- **API route:** PARTIAL — `/api/cron/autodream/route.ts` exists for batch generation; no real-time trigger on `trend.promoted` event
- **Clay tool call:** **MISSING** — no `propose_generate_trend_brief`. The existing `propose_generate_batch_briefs` adapter (`handler-adapters.ts:188`) takes operator-supplied creator list + topic, not trend-driven.
- **Dashboard UI:** PARTIAL — review queue exists but no "Trend-Generated" tag or trend backlink
- **Auto-trigger:** **MISSING** — `autodream` cron is **not scheduled in `vercel.json`** (the 6 entries do not include it)

#### TS-4 Creator-Facing Trend Alerts
- **DB schema:** **MISSING** — no `creator_alerts` table. No migration.
- **API route:** **MISSING**
- **Clay tool call:** **MISSING**
- **Dashboard UI:** **MISSING** — no alert log; no creator-facing portal exists at all (audit §4 confirms creator portal is a stub)
- **Auto-trigger:** **MISSING**

### C. Conformance to "conversation is substrate"
The Trend Scout is **the worst-conforming employee**. Three of four workflows have zero Clay surface. TS-1 has a cron but no read tool — the agent cannot answer "what's trending right now?" without a Dashboard query. None of the trend-driven actions (match, alert) can be initiated from a conversation.

### D. Critical broken assumptions
1. **`trend_creator_matches` table does not exist.** TS-2 is fully blocked at the schema layer.
2. **`creator_alerts` table does not exist.** TS-4 is fully blocked at the schema layer.
3. **No creator-facing notification channel exists.** TS-4 assumes in-app notifications + email-to-creator delivery; neither path is built.
4. **`pre_generated_briefs.trend_match_id` column missing.** TS-3 cannot link a brief back to its source trend.
5. **`autodream` cron not in `vercel.json`.** TS-3 auto-flow has no scheduler.
6. **`/agency/trends/page.tsx` displays fabricated data** (`Math.random()`). Operators cannot trust the surface even for the partial TS-1 capability.

---

## 4. AI EMPLOYEE 4 — PERFORMANCE ANALYST

### A. Workflow inventory

| ID | Description |
|---|---|
| PA-1 | Performance Data Capture — capture views/engagement at 24h/48h/7d checkpoints (manual now, TikTok API later) |
| PA-2 | Prediction vs Actual Analysis — compare VPS prediction to actual, calculate delta, identify contributing factors |
| PA-3 | Weekly Performance Reports — scheduled per-agency report (briefs delivered/published, accuracy trend, top performer, biggest miss) |
| PA-4 | Coaching Feedback Generation — personalized per-creator feedback based on fingerprint + recent performance |
| PA-5 | Model Feedback Loop — feed predictions vs actuals into XGBoost retraining pipeline |

### B. Substrate status per workflow

#### PA-1 Performance Data Capture
- **DB schema:** COMPLETE — `actual_views`, `actual_engagement_rate`, `performance_delta`, `performance_measured_at`, `performance_source` (`20260414_performance:5-9`)
- **API route:** PARTIAL — `/api/brief-performance/route.ts` POST exists but is service-role without agency scoping (audit §2.D #2)
- **Clay tool call:** COMPLETE — `propose_log_performance` (`handler-adapters.ts:96`)
- **Dashboard UI:** COMPLETE — `DashboardClient.tsx:794-802` performance log form
- **Auto-trigger:** **MISSING** — no scheduled checkpoint cron; no implausibility guard (v2 doc requested both)

#### PA-2 Prediction vs Actual Analysis
- **DB schema:** PARTIAL — delta calc lives in route handler (`brief-performance:88-104`); `performance_factors` JSONB column missing on `content_briefs`
- **API route:** PARTIAL — `get_performance_summary` read tool wired (audit acknowledges)
- **Clay tool call:** PARTIAL — read summary is BUILT; factor analysis is MISSING
- **Dashboard UI:** PARTIAL — `AccuracyView.tsx` uses `Math.random()` fabrications per audit §10
- **Auto-trigger:** **MISSING** — no listener on `performance.logged` event

#### PA-3 Weekly Performance Reports
- **DB schema:** **MISSING** — no `performance_reports` table. No migration.
- **API route:** PARTIAL — `generateReport()` exists (`action-handler.ts:943-987`) but contains a **multi-tenancy leak at line 956** (queries all `onboarding_profiles` without `agency_id` filter; audit §3.5 / §6 cross-agency data leak finding)
- **Clay tool call:** COMPLETE (registered) — `propose_generate_report` (`handler-adapters.ts:220`); but no read tool `get_performance_report`
- **Dashboard UI:** **MISSING** — no historical reports view
- **Auto-trigger:** **MISSING** — no weekly cron in `vercel.json`

#### PA-4 Coaching Feedback Generation
- **DB schema:** **MISSING** — no `creator_feedback` table. No migration. (Audit §1.C #4 flags this.)
- **API route:** **MISSING**
- **Clay tool call:** **MISSING** — no `propose_generate_feedback`
- **Dashboard UI:** **MISSING** — no feedback tab on creator profile
- **Auto-trigger:** **MISSING**

#### PA-5 Model Feedback Loop
- **DB schema:** PARTIAL — admin model training tables exist; not connected to agency-side performance data
- **API route:** **MISSING** — no path from `/api/brief-performance` → training pipeline
- **Clay tool call:** **MISSING** (and arguably should never be a Clay action — infrastructure)
- **Dashboard UI:** PARTIAL — `AccuracyView.tsx` exists but stubbed (`Math.random()` per audit §10)
- **Auto-trigger:** **MISSING** — no scheduled retraining cron consuming agency data; no per-segment accuracy gating

### C. Conformance to "conversation is substrate"
- PA-1 conforms (Clay propose tool + Dashboard form both exist).
- PA-2 partially conforms (read summary works; factor analysis missing).
- PA-3 conforms for write (`propose_generate_report`) but the read path is missing — agent cannot answer "show me last week's report" without re-running it. **Critical:** invocation will silently leak cross-agency data due to the line-956 bug.
- PA-4, PA-5 violate the principle entirely (no Clay surface).

### D. Critical broken assumptions
1. **`performance_reports` table does not exist.** PA-3 cannot persist generated reports; every "show me last week's report" call re-generates from scratch.
2. **`creator_feedback` table does not exist.** PA-4 is fully blocked.
3. **`generateReport()` leaks cross-agency data** at `action-handler.ts:956` (no `agency_id` filter on `onboarding_profiles` query). Audit §3.5 + §6 confirm. **This is active in production.**
4. **`AccuracyView.tsx` displays `Math.random()` numbers.** Operator-visible accuracy is fabricated.
5. **`/api/brief-performance` is unauthenticated service-role.** Any caller can log fake performance data against any brief in any agency (audit §2.D #2).
6. **No model retraining pipeline consumes agency data.** PA-5 is architectural-only; no actionable wire exists.
7. **`content_briefs.performance_factors` column missing** for PA-2 factor storage.

---

## 5. AI EMPLOYEE 5 — PROJECT MANAGER

### A. Workflow inventory

| ID | Description |
|---|---|
| PM-1 | Pipeline Overview — real-time view of all active briefs across all creators (stages: Draft → Approved → Delivered → Acknowledged → In Production → Ready for Review → Published) |
| PM-2 | Deadline Management — track briefs against deadline, send creator reminders, alert operator when missed |
| PM-3 | Optimal Posting Time — recommend post time based on creator audience patterns + saturation scoring |
| PM-4 | Post Scheduling — schedule via TikTok API or third-party (Publer); calendar UI; drag-to-reschedule |
| PM-5 | Automated Chase Sequences — escalating outreach for silent creators (auto-nudge → follow-up → operator alert → manual flag) |

### B. Substrate status per workflow

#### PM-1 Pipeline Overview
- **DB schema:** COMPLETE — `content_briefs` status fields exist (`status`, `delivery_status`, `completion_status`)
- **API route:** PARTIAL — `agency-chat/route.ts:856-875` injects passive pipeline context into LLM system prompt; no dedicated `/api/pipeline-status` route
- **Clay tool call:** **MISSING** — no `get_pipeline_status` read tool
- **Dashboard UI:** PARTIAL — status badges on individual brief cards; no kanban view; no `/agency/pipeline` page
- **Auto-trigger:** N/A (read-only)

#### PM-2 Deadline Management
- **DB schema:** **MISSING** — no `deadline` column on `content_briefs`. **But `agency-chat/route.ts:869` already reads `brief.deadline`** — schema-code drift. No `reminder_sent_at` either.
- **API route:** **MISSING**
- **Clay tool call:** **MISSING** — no `propose_set_deadline`
- **Dashboard UI:** **MISSING** — no due-date indicators, no calendar view
- **Auto-trigger:** **MISSING** — no `/api/cron/deadline-reminders` in `vercel.json`

#### PM-3 Optimal Posting Time
- **DB schema:** **MISSING** — no `recommended_post_time`, `scheduled_post_time` columns on `content_briefs`. (`scheduled_publish_at` exists for PM-4 but that's the actual schedule, not recommendation.) `posting_time_score` XGBoost feature exists in model but is not exposed via any column.
- **API route:** **MISSING** — no recommendation API exposing the model output
- **Clay tool call:** **MISSING** — no `propose_recommend_post_time` or `get_post_time_recommendation`
- **Dashboard UI:** PARTIAL — `ScheduleStrip.tsx` exists but is read-only with no scheduling logic (audit §4)
- **Auto-trigger:** N/A (operator-initiated)

#### PM-4 Post Scheduling
- **DB schema:** PARTIAL — `content_briefs.scheduled_publish_at` exists (`20260417_phase1_action_scaffolding:60`); no scheduler-path/status columns; no external `scheduled_actions` table consumer wired
- **API route:** PARTIAL — `schedule_post` handler in `action-handler.ts:920` writes to `scheduled_publish_at`
- **Clay tool call:** **PARTIAL with bug** — `propose_schedule_post` adapter exists (`handler-adapters.ts:204`); but `intelligent-clay-registry.ts:247` declares `targetTable='scheduled_actions'` while handler writes to `content_briefs.scheduled_publish_at`. Registry-handler mismatch. No downstream reader of `scheduled_publish_at` (audit §3.5).
- **Dashboard UI:** PARTIAL — ActionButton-only; no calendar view, no drag-to-reschedule
- **Auto-trigger:** **MISSING** — no external integration (TikTok API or Publer); even with `scheduled_publish_at` set, **nothing actually publishes the post**

#### PM-5 Automated Chase Sequences
- **DB schema:** **MISSING** — no `chase_log` table. No migration. (Audit §1.C #4.)
- **API route:** **MISSING** — no cross-touchpoint silence detection, no escalation classifier
- **Clay tool call:** **MISSING**
- **Dashboard UI:** **MISSING** — no "At Risk" section
- **Auto-trigger:** **MISSING** — no scheduled cron

### C. Conformance to "conversation is substrate"
- PM-1: PARTIAL — agent can passively reference pipeline (system prompt injection) but cannot answer structured queries via tool calls.
- PM-2, PM-3, PM-5: violate the principle entirely.
- PM-4: appears to conform (Clay tool exists), but the registry-handler mismatch means the agent will tell the operator "I scheduled it" while no downstream consumer actually publishes anything. **This is worse than missing — it's misleading.**

### D. Critical broken assumptions
1. **Code reads a column that does not exist** — `agency-chat/route.ts:869` references `brief.deadline`, but `content_briefs` has no `deadline` column. This is silent: it returns `undefined` and the LLM gets a wrong context. Schema-code drift.
2. **`chase_log` table does not exist.** PM-5 is fully blocked.
3. **Registry-handler target-table mismatch** for `schedule_post` (registry says `scheduled_actions`, handler writes `content_briefs.scheduled_publish_at`) — Clay agent's mental model of what gets written is wrong.
4. **No downstream consumer of `scheduled_publish_at`.** The column gets written, nothing reads it. PM-4 produces no real-world side effect.
5. **No TikTok API or Publer integration.** PM-4 cannot deliver on its core promise even if the schema were correct.
6. **No audience-pattern computation, no saturation-scoring, no memory-feedback loop** for PM-3 — the v2 doc lists these as required substrate but none exist.
7. **PM-1 kanban view does not exist.** Operators rely on per-card badges to reconstruct the pipeline mentally.

---

## 6. CROSS-EMPLOYEE SUMMARY

### 6.1 Closest to complete

**Account Manager (AI Employee 1)** is closest to complete. Of its 5 workflows: AM-1, AM-4, AM-5 are BUILT; AM-2 is PARTIAL (missing only a proactive read tool); AM-3 is PARTIAL (manual path BUILT, only auto-trigger missing). All 5 have a registered `propose_<id>` Clay adapter. All 5 have a Dashboard surface. The substrate is real.

The single largest blocker remaining for AM is the **cross-tenant data leak on `/api/brief-status`, `/api/brief-performance`, `/api/brief-acknowledge`** (audit §2.D #2) — but that's a security fix, not a feature build.

### 6.2 Most foundational (unblocks the most other workflows)

**Onboarding Specialist (AI Employee 2)** is most foundational. Reasoning:
- OB-4 (Auto-Profiling) writes to `onboarding_profiles`, the canonical creator table per the audit's layer-4 SoT decision (D11 equivalent for AI Employees). **Every** trend match (TS-2), every fingerprint-driven brief (TS-3, AM-1), every coaching feedback (PA-4), every audience-pattern recommendation (PM-3) reads from this table.
- OB-2 pipeline schema gives every other employee a reliable "is this creator active yet?" filter. Without it, downstream workflows operate on a polluted creator pool.
- Fixing the `creator_profiles` vs `onboarding_profiles` write target (broken assumption D.3 in §2) is a one-place change that removes a cross-cutting bug.

**Caveat:** Onboarding Specialist itself is **less complete** than Account Manager — it's foundational because of its role in the data graph, not because it's nearly done.

### 6.3 Build order — what the v2 docs say

The v2 docs **do** specify a build order. Quoted verbatim from `AI_EMPLOYEE_1_ARCHITECTURE_v2.md` (the common preamble shared across all five docs):

> **Phase A** — Substrate hardening (creator-table consolidation, tenant scoping, `platform_events` discipline)
> **Phase B** — Read-tool coverage (`get_*` read tools across all employees)
> **Phase C** — Dashboard surface completion (kanban, calendar, pipeline pages, alert logs)
> **Phase D** — Schema closure (the 5 missing tables: `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`; plus the missing columns: `deadline`, `performance_factors`, `nudge_*` on `agency_invites`)
> **Phase E** — `defineCapability()` unification (one declaration → Clay tool + Dashboard surface + event emission)
> **Phase F** — Managed autonomy (cron entries for nudges, weekly reports, trend scans at 1-6h cadence, deadline reminders)
> **Phase G** — Feature unlock (auto-profiling, auto-brief from trend, auto-feedback)
> **Phase H** — Creator-facing surfaces (alerts, portals)
> **Phase I** — External integrations (TikTok API or Publer for PM-4)

The ordering principle is **substrate before features** — Phases A-F harden the foundation, G-I unlock user-visible workflows. This matches the SUBSTRATE_FRAMEWORK.md compounding test.

The April-14 doc proposes a **different order** (Phase 1 = Account Manager, Phase 2 = Onboarding, etc.) which is employee-centric, not substrate-layer-centric. **Decision needed** on which ordering to follow.

### 6.4 Shortest path to "Account Manager fully complete"

Account Manager is 4-of-5 BUILT and 1-of-5 PARTIAL. The shortest path closes the AM-3 auto-trigger gap and fixes the security/observability gaps that affect AM-1/4/5 but are out-of-scope for "AM as a feature." Counting only what's needed to mark AM "complete":

**Step 1 — migration** (1 file)
Add `agency_id UUID NOT NULL` column + FK to `content_briefs` + backfill from `onboarding_profiles.agency_id` join. This is the prerequisite for safe agency-scoped queries in steps 2-4. (Commit `ad3b784` from 2026-04-22 may have already done this — verify.)
*Dependencies: none.*

**Step 2 — API route hardening** (3 routes)
Add agency scoping + auth check to `/api/brief-status`, `/api/brief-performance`, `/api/brief-acknowledge`. These already exist; the change is moving from service-role to authenticated client + `agency_id` filter on every query.
*Dependencies: Step 1 (`agency_id` column must exist).*

**Step 3 — Clay read tool** (1 adapter + 1 registry entry)
Register `get_unacknowledged_briefs` (and optionally `get_briefs_by_status`) as read tools in `tool-registry.ts` `extraReadTools`. Backed by the now-scoped `/api/brief-status` GET. Closes AM-2's "agent cannot proactively surface gaps" gap.
*Dependencies: Step 2.*

**Step 4 — cron entry** (1 line in `vercel.json` + 1 route)
Add `/api/cron/nudge-stale-briefs` route (queries `content_briefs WHERE delivery_status='delivered' AND completion_status='delivered' AND delivered_at < NOW() - INTERVAL '24 hours' AND nudge_count < 2`, then calls existing `nudge_creator` handler). Add corresponding entry to `vercel.json` `crons` array. Closes AM-3 auto-trigger.
*Dependencies: Step 1 (agency-scoped query) + Step 2 (handler chain assumes auth context).*

**Step 5 — emission discipline** (small refactor in 3 handlers)
Confirm `update_brief_status`, `nudge_creator`, `log_performance` handlers all emit `platform_events` rows on success (audit §2.E flagged this as inconsistent). Required so the Performance Analyst dependency chain (PA-2 listener) and any future memory-consolidation works against AM-driven state changes.
*Dependencies: Step 4 (the cron-driven nudge needs to emit too).*

**(Optional) Step 6 — Dashboard "stale briefs" widget**
Surface the same query in `DashboardClient.tsx`. Strictly speaking the doc's principle ("Dashboard never requires Clay to function") is already satisfied via per-card badges, but a roll-up widget closes the parity gap.
*Dependencies: Step 2.*

**Effort estimate:** Steps 1-5 are ~1-2 days of work for a single engineer if the `agency_id` migration from commit `ad3b784` is already applied; ~3-4 days otherwise. No new schema beyond Step 1. No new tables. No external integrations. No LLM prompt changes.

After Step 5, AM-1 through AM-5 are: BUILT / BUILT / BUILT (manual + auto) / BUILT / BUILT — with full conversation-substrate parity (Clay can both read and write every workflow), full Dashboard parity, and no known cross-tenant leaks.

---

## 7. APPENDIX — STATUS TALLY

| Employee | Workflows | BUILT | PARTIAL | NOT BUILT | Notes |
|---|---|---|---|---|---|
| Account Manager | 5 | 3 | 2 | 0 | Closest to done |
| Onboarding Specialist | 4 | 0 | 2 | 2 | Foundational |
| Trend Scout | 4 | 0 | 2 | 2 | 5 missing tables; worst Clay coverage |
| Performance Analyst | 5 | 0 | 3 | 2 | Active cross-tenant leak in PA-3 |
| Project Manager | 5 | 0 | 2 | 3 | Schema-code drift in PM-2; misleading PM-4 |

**Cron entries actually scheduled in `vercel.json`:** 6 — `recency-decay`, `freedom-agent/weekly-checkin`, `atlas/feedback-collector`, `cultural-scan`, `classify-events`, `overnight-triage`. None of them serve AM-3, OB-3, PA-3, PM-2, PM-5, or TS-3.

**Clay write adapters registered (`handler-adapters.ts:251-263`):** 12 — `nudge_creator`, `update_brief_status`, `log_performance`, `approve_brief`, `send_invite`, `create_event`, `match_creators_to_event`, `push_brief_to_creators`, `generate_batch_briefs`, `schedule_post`, `generate_report`, `reschedule_post`. Each is exposed to the agent as `propose_<id>` via `tool-registry.ts`.

**Read tools registered:** Only `get_performance_summary` is explicitly cited in the v2 docs as BUILT. No other `get_*` tool is confirmed in the audit. (Phase B in §6.3 exists to address this.)

**Tables the v2 docs reference that do not exist:** `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`. Plus `invitations` (real name is `agency_invites`) and `nudge_*` columns on `agency_invites`.

**Files with `Math.random()` fabrication in operator-visible UI** (audit §10): `AccuracyView.tsx`, `MomentumView.tsx`, `RankView.tsx`, `RevenueView.tsx`, `TrendsView.tsx`, `src/app/agency/trends/page.tsx`. Operators cannot trust any of these without remediation.
