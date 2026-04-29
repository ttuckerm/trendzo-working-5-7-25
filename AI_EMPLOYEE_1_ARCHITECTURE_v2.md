TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)
Substrate-First Build Blueprint
Date: 2026-04-22  |  Version: 2.0  |  Status: LIVE — supersedes v1.0 (2026-04-14)

WHY THIS DOCUMENT EXISTS
v1 described an end state, not a current state. v2 describes both.
The cost of that omission compounded. Six tables v1 named don't exist. Workflows marked BUILT aren't. "Both UIs parity" was a rule imposed on two different architectures instead of a consequence of shared foundation. Cursor prompts referencing v1 inherited the drift. The system built against it is now 60% real, 40% scaffolding painted to look done. This document fixes that.
v2 does three things v1 didn't:

Names Trendzo's substrate layers explicitly — the invisible foundation that must exist before any AI Employee workflow can be a 48-hour feature.
Labels every workflow with honest STATUS, DISTANCE, and DEPENDENCIES, grounded in audit evidence.
Re-sequences the build order by substrate completion, then by feature unlock — so every phase ships faster than the one before it.


THE SIX SUBSTRATE LAYERS
Trendzo's substrate is the Creator Operations Graph. It is composed of six layers. Each layer must be BUILT before the layer above it can ship honest features.
Layer 0 — Data Ingestion
What it is: TikTok videos in, 58-feature vectors out.
Status: BUILT.
Evidence: Bulk feature extraction pipeline operational. 6,718 videos processed into training cohort. Apify + internal scrapers feeding scraped_videos, video_files, prediction_runs. Feature extraction flows into creator_video_history and run_component_results.
Known drift signals (would unBUILD this layer): scraped_videos CREATE TABLE lives in scripts/, not migrations/ — schema source of truth is ambiguous. Flag for cleanup, not blocking.
Layer 1 — The Scoring Engine
What it is: 58 features in, DPS + VPS out with component-level explainability.
Status: BUILT.
Evidence: runPredictionPipeline.ts operational. XGBoost inference producing VPS with Spearman ρ = 0.61. DPS v2.1.0 with 8-signal architecture locked. Writes to prediction_runs + run_component_results.
Known gaps: Migration named 20260329_dps_v2_incomplete_columns.sql — the name itself signals unfinished work. Needs audit. Not blocking downstream work but should be resolved before Layer 4 depends heavily on DPS v2.
Layer 2 — The Event Log
What it is: Every meaningful action in the system — brief delivered, score computed, creator acknowledged, prediction beat, memory promoted — written as an immutable event to a single canonical table. Queryable for any "how is this performing over time" question, forever.
Status: PARTIAL — this is the most dangerous gap in the stack.
An event log that's only sometimes written to is worse than no event log at all, because it produces confidently-wrong analytics.
Evidence: platform_events table exists (20260319_platform_events.sql, extended 20260418). emitEvent() helper exists (src/lib/events/emit.ts). Emission is inconsistent — two Clay write adapters emit agent.proposal events, the two brief routes locked in Fix 2 now emit audit events, but most mutation paths across the codebase don't emit anything. No enforcement that state mutations must emit. No event taxonomy document. No read-side consumer treating this as canonical.
Why this layer being PARTIAL is dangerous: Every AI Employee feature that asks "what happened?" quietly assumes this layer is complete. Weekly performance reports. Accuracy trend analysis. Coaching feedback grounded in history. Chase sequences. Prediction improvement tracking. Those features will either be built on one-off queries against domain tables (fragile, expensive to change) or built on a half-populated event log (wrong numbers, silent failures). Neither is acceptable.
What "BUILT" would look like (spec):

Every mutation in every API route under /api/agency/*, /api/brief-*, /api/creator/* emits a platform_events row within the same database transaction as the mutation. Enforced by code review + a lint rule that flags mutation routes without emission.
A docs/event-taxonomy.md file lists every valid event_type with its required payload shape. No new event types outside this registry.
At least one read-side consumer (the nightly memory consolidation agent is a natural candidate) treats platform_events as source of truth for "what happened" — not a supplementary log.

Layer 3 — Memory
What it is: Curated, tiered, decayable state about creators and agencies — distinct from the Event Log. The Event Log is immutable history; Memory is promoted, contradicted, consolidated, and expired facts. A different read pattern, a different write rule, a different consumer set.
Status: PARTIAL (leaning BUILT).
Evidence: memory_extractions table exists with hot/warm/cold tiers, confidence scores, reference counts, and supersession logic (20260407_memory_system.sql). Nightly consolidation agent (/api/cron/consolidate-memory) uses Gemini 2.5 Flash to merge, resolve contradictions, and demote stale facts — real LLM agent, ~500 lines, scheduled and running. assembleContext() injects hot memory into every agency-chat LLM call. Clay's 24-hour conversation persistence is a separate but adjacent primitive (agency_conversations, 20260401).
Why it's PARTIAL not BUILT: Per-creator warm memory has a read path (fetchWarmMemory() filters by creator_id) but no confirmed write path for creator-tagged facts. Conversation extraction might populate it via consolidation, but that pipeline isn't traced end-to-end yet. Also: no operator-facing memory surface outside Clay's MemoryFactCard. "What does Trendzo know about this creator?" has no direct answer page.
What "BUILT" would look like (spec):

Conversation extraction → memory_extractions write path documented and traced. A fact surfaced in a conversation about creator X ends up tagged to creator X's warm memory within 24 hours.
Operator-facing memory surface at /agency/memory showing both agency-level hot facts and per-creator warm facts. Read/edit/delete available.
Memory write path separate from Event Log write path. Events record that something happened; memory records what the system now believes is true.

Layer 4 — The Creator Operations Graph
What it is: The single source of truth for every creator — identity, fingerprint, agency relationship, brief history, performance trajectory, memory facts, onboarding state — unified and synchronized such that every surface reads consistent data regardless of which table it queries.
Status: NOT BUILT as a unified graph. Components exist, unified substrate does not.
Evidence: Three parallel creator tables coexist with zero synchronization: creators (legacy admin roster, consumed by MCP server + admin dashboard), creator_profiles (prediction-side TikTok baseline, no auth link, consumed by prediction routes), onboarding_profiles (canonical per the merge migration comment, consumed by agency-chat + Dashboard). A creator added via one flow does not appear in the other flows.
Why this layer being NOT BUILT is the reason features fracture: The Creator Operations Graph was named as Trendzo's substrate in the original vision (see GitHub_repos doc §2b). It's the Rippling Employee Graph equivalent. Every AI Employee assumes they're operating on the same creator record. They aren't.
What "BUILT" would look like (spec — decision made, not pending):
Canonical table: onboarding_profiles. Chosen because (a) it's already consumed by the surfaces new work is happening on — agency-chat and Dashboard, (b) it already has the agency_id column Fix 1 depended on, (c) the merge migration comment explicitly names it canonical, (d) creators is scoped to legacy admin/billing concerns and creator_profiles is scoped to prediction — both are narrower than the unified identity the Graph requires.
Consolidation rules:

onboarding_profiles.id becomes the canonical creator identifier. All new FKs point at it. Fix 1's content_briefs.agency_id pattern generalizes: every creator-scoped table gets a nullable creator_id FK at minimum.
creators is frozen. Migration adds a -- DEPRECATED: read-only. Source of truth is onboarding_profiles. banner comment. No new writes. Admin dashboards continue reading it until migrated; all new admin work reads from onboarding_profiles joined to profiles.
creator_profiles freezes in its current state during Phase A3 — read-only, stale but functional. The rebuild job that converts it to a live materialized projection of onboarding_profiles + prediction data ships in Phase F (Managed Autonomy), because creating a cron entry before the autonomy substrate is properly built is the exact v1 failure mode. Write access is revoked from all routes except that future rebuild job.
calibration_profiles remains as a preserved backup per its existing migration comment. No action needed.

Verification (Phase A3 exit criteria): Six greps must all return zero matches in src/ (excluding the future rebuild job path):
grep -r ".from('creators').insert(" src/
grep -r ".from('creators').update(" src/
grep -r ".from('creators').upsert(" src/
grep -r ".from('creator_profiles').insert(" src/
grep -r ".from('creator_profiles').update(" src/
grep -r ".from('creator_profiles').upsert(" src/
A grep for .from('onboarding_profiles') returns the writes that replaced them. Three operations × two tables = six total patterns. If any pattern returns a hit that isn't the rebuild job, Phase A3 is not done.
Layer 5 — Capability Surfaces
What it is: The attachment points where visible features plug into substrate. A consistent pattern for adding a new capability such that it appears in Clay (as a tool call or component) AND the Dashboard (as a button/view/card) from a single registration, not two separate builds.
Status: PARTIAL — asymmetric.
Evidence: Clay side is real. Tool registry exists (src/lib/agent/tool-registry.ts). Component registry exists (src/lib/clay/intelligent-clay-registry.ts). Adapter pattern emits propose/real tool pairs (src/lib/agent/handler-adapters.ts). Dashboard side has no equivalent — adding a new Dashboard capability means editing DashboardClient.tsx by hand. "Both UIs parity" is enforced by discipline, not architecture.
Why this layer being PARTIAL is the reason parity keeps breaking: The "both UIs" rule only works if both UIs consume from the same registration. Right now they consume from two different codebases that happen to point at overlapping API routes. Every new capability requires building the same thing twice and remembering to keep them in sync. The audit shows this already breaking: send_invite is stubbed on the Clay side and has no Dashboard equivalent; generate_batch_briefs is handler-only with no Clay tool pair.
What "BUILT" would look like (spec):

A single defineCapability() function that accepts one declaration and produces: (a) a Clay tool call (propose/real pair if it's a write action), (b) a Clay component for rendering, (c) a Dashboard UI element matched to the declared category (button / card / table / kanban slot), (d) the API route handler, (e) event emissions on mutations.
src/capabilities/ directory holding one file per capability. Registry auto-discovers them on startup.
Adding a new capability is: write one file, app picks it up, both UIs see it. Removing is: delete one file, both UIs lose it.

Layer 6 — Managed Autonomy
What it is: The infrastructure that lets AI Employees actually run without human triggers. Scheduled cron jobs. Long-running agent sessions. Self-scheduled actions. The difference between "we have code that could act autonomously" and "the system is acting autonomously right now."
Status: PARTIAL.
Evidence: vercel.json schedules 3 cron jobs (recency-decay weekly, freedom-agent weekly, feedback-collector every 6h). Meanwhile, cron routes exist but are NOT scheduled for: autodream (overnight brief generation), cultural-scan (trend detection), classify-events, training-pipeline, consolidate-memory (despite being the Memory layer's consolidation agent). The nightly Memory Keeper logic is written and autonomous-capable. The trend scout, overnight brief writer, and autonomous account manager behaviors are code that happens to exist but doesn't run on its own.
Why this layer is separate from Capability Surfaces: A cron-triggered execution path is a different runtime than a user-triggered API call. Different failure modes (silent vs visible). Different observability needs (operator won't see a cron failure unless we surface it). Different permission model (system identity vs user identity). Different rollback semantics. Combining them would let unscheduled "autonomous" features hide behind capability registrations and never get the autonomy spec.
What "BUILT" would look like (spec):

Every claimed autonomous behavior has either a vercel.json cron entry or a documented live-session trigger. Zero routes labeled autonomous that only run when a human clicks.
A docs/autonomy.md file listing every scheduled job with its cadence, observability hook, and failure-alerting path.
Cron failures surface in the operator-facing alert inbox, not just in server logs.
Phase F deliverable: the creator_profiles rebuild job deferred from Phase A3 lands here, with its own cron entry and alerting.


SCHEMA SOURCE OF TRUTH
The only valid reference for database shape is supabase/migrations/*.sql.
Not this document. Not v1. Not code comments. Not the MCP server's table references. Not READMEs. If a migration doesn't declare it, it doesn't exist — and any code assuming it does exist is a bug, not a feature.
Known current drifts (as of 2026-04-21 audit) that every build prompt must respect until resolved:
What a prompt might sayRealityinvitations tableReal table is agency_invites. invitations does not exist.invitations.nudge_count / last_nudge_at / nudge_stageNone of these columns exist on agency_invites.trend_creator_matchesDoes not exist. Workflow TS-2 has no schema.creator_alertsDoes not exist. Workflow TS-4 has no schema.creator_feedbackDoes not exist. Workflow PA-4 has no schema.performance_reportsDoes not exist. Workflow PA-3 has no schema.chase_logDoes not exist. Workflow PM-5 has no schema.scheduled_postsDoes not exist. (There is content_briefs.scheduled_publish_at + tiktok_drafts but no scheduled_posts table.)agency_invitations (plural)Real table is agency_invites (singular). Plural queries return empty silently.content_briefs.nudge_sent_atReal column is last_nudged_at.content_briefs.vps_prediction vs predicted_vpsBOTH EXIST — active dual-column drift. No single source of truth yet. Phase A1 resolves.content_briefs.status vs completion_statusBOTH EXIST — status is legacy Quick Win, completion_status is AM lifecycle. Phase A1 resolves.agencies.statusColumn does not exist. Real column is is_active. Two cron routes query the nonexistent column and get null back silently.
Every build prompt that touches schema must cross-check against the live migration directory before referencing a column or table name. Claude Code's Step 1 diagnostic must confirm schema existence before writing any migration or query.

THE LIFECYCLE (UNCHANGED FROM v1)
ONBOARD → PROFILE → BRIEF → DELIVER → PRODUCE → PUBLISH → MEASURE → COACH → REPEAT
Every AI Employee owns a segment of this lifecycle. Every segment must work in both Intelligent Clay (/agency) and Traditional Dashboard (/agency/dashboard) from a single capability registration (once Layer 5 is BUILT).

STATUS / DISTANCE / DEPENDENCIES FORMAT
Every AI Employee workflow in the sections that follow is labeled with three fields. This is what lets this document function as a buildable roadmap instead of a wishlist.
STATUS is one of four values:

BUILT — fully working in both UIs, wired to substrate, verified against audit.
PARTIAL — some of the pieces exist (schema, API, UI, tool call, auto-trigger) but not all of them. PARTIAL is specified as a list of what exists and what doesn't.
NOT BUILT — no real implementation. Schema may exist but nothing uses it, or schema doesn't exist and neither does anything else.
DEPRECATED — was in v1, removed from v2 because it depends on substrate that shouldn't be built, or it's a feature we no longer intend to ship.

DISTANCE is the honest estimate of time from current status to BUILT, assuming all dependencies are already BUILT. Expressed in founder-hours, not calendar time:

Hours (2-8 hours) — wiring and glue. No new substrate needed.
Days (1-3 days) — meaningful feature work. Substrate ready, logic to build.
Weeks (1-3 weeks) — significant work. Likely triggers follow-on work.
Blocked — cannot be estimated until dependencies resolve.

DEPENDENCIES is the explicit list of substrate layers and other workflows that must be BUILT before this workflow can be a 48-hour feature. If any dependency is PARTIAL or NOT BUILT, this workflow inherits BLOCKED status regardless of DISTANCE.

BUILD ORDER — RE-SEQUENCED FROM v1
Phase A is invisible work, and that's the point.
v1 sequenced by AI Employee (Account Manager → Onboarding → Trend Scout → Performance → Project Manager). That order is wrong because it front-loads workflows whose substrate dependencies are broken. Every AM workflow touching performance data would inherit the Event Log gap. Every Onboarding workflow writing a creator would inherit the three-table fracture. The features would look built and produce wrong numbers.
v2 sequences by substrate completion, then by feature unlock. Phases A through F build substrate. Phases G through I build features. The trade is apparent speed for real speed — Phase A ships no visible progress, but every phase after it ships faster than it would have under v1 sequencing.
If you read this doc on a hard day and feel the urge to skip Phase A to get to something visible, that urge is the problem v1 was caused by. Resist it.
PHASE A — Close the substrate holes Fix 1 and Fix 2 exposed
A1. Resolve content_briefs dual-column drift. Pick authoritative columns for vps_prediction vs predicted_vps and status vs completion_status. Deprecate the losers with comment banners. Migrate consumers.
A2. Event Log hardening (Layer 2 → BUILT). Event taxonomy document, universal emission on mutations in agency/brief/creator routes, one read-side consumer (likely the memory consolidation agent) treating events as canonical.
A3. Creator Operations Graph consolidation (Layer 4 → BUILT). Execute the spec in Layer 4 above: freeze creators, freeze creator_profiles in a stale-but-readable state (the rebuild job lands in Phase F), point new FKs at onboarding_profiles.id. Exit criteria: the six verification greps all return zero non-rebuild-job matches.
PHASE B — Complete the Account Manager

Accepted technical debt: Phase B will be built on the current asymmetric capability pattern — hand-built Dashboard UI alongside Clay tool calls. These workflows will be refactored in Phase E when Capability Surfaces unify. The cost is accepted because parity from Phase E onward is automatic instead of policed.

Five workflows (AM-1 through AM-5). Most are wiring on top of now-solid substrate. Shortest distance to "one AI Employee fully built in both UIs."
PHASE C — Complete the Onboarding Specialist
Four workflows (OB-1 through OB-4). Requires Phase A3's Creator Operations Graph consolidation. Cannot start until A3 is done.
PHASE D — Memory Layer completion (Layer 3 → BUILT)

Accepted technical debt: Phase D's operator-facing surface at /agency/memory will be hand-built on the current asymmetric capability pattern and refactored in Phase E. The cost is accepted because parity from Phase E onward is automatic instead of policed.

Per-creator memory write path traced end-to-end. Operator-facing memory surface at /agency/memory unified for agency + per-creator view.
PHASE E — Capability Surfaces unification (Layer 5 → BUILT)
Replace Dashboard's hand-built UI with a registration-driven shell consuming the same capability declarations Clay consumes. After this, "both UIs parity" is automatic, not policed. Phases B and D workflows get refactored to the new pattern here.
PHASE F — Managed Autonomy backbone (Layer 6 → BUILT)
Schedule every cron that exists but isn't scheduled. Wire cron-failure alerts to operator inbox. Document what's autonomous and what isn't. Phase A3's deferred creator_profiles rebuild job ships as a cron here.
PHASE G — Trend Scout
Four workflows (TS-1 through TS-4). Requires Layers 2, 4, 5, and 6 BUILT. This is the feature that makes creators log in daily.
PHASE H — Performance Analyst
Five workflows (PA-1 through PA-5). Requires Phase B's accumulated brief performance data + Layer 2 events as source of truth.
PHASE I — Project Manager / Coordinator
Five workflows (PM-1 through PM-5). Requires Phases B, C, and G complete.

DOCUMENT CONVENTIONS FOR ALL SECTIONS BELOW
Each AI Employee section contains:

Role summary (what this employee owns in the lifecycle)
What it replaces (the human work being displaced, with approximate hours saved)
Per-workflow detail table with: Trigger, Action, Clay UX, Dashboard UX, DB writes, Failure handling, STATUS, DISTANCE, DEPENDENCIES
Build gaps summary (matrix of Schema / API / Dashboard / Clay / Auto-trigger)
Tool Call Registry contribution

END OF OPENING SECTION.


AI EMPLOYEE 1 — ACCOUNT MANAGER
Role summary
The Account Manager owns the middle of the lifecycle: DELIVER → PRODUCE → PUBLISH. Once an operator approves a brief, the Account Manager is responsible for getting it into the creator's hands, confirming they received it, nudging them when they go silent, tracking the brief through production, and closing the loop when the video ships.
What it replaces
The human at an agency who sends briefs to creators, follows up when they don't respond, checks in on production status, and confirms publication. At a 10-creator agency with ~14 active briefs on average, this is roughly 6-10 hours/week of DM-chasing, spreadsheet-updating, and calendar-watching. At scale (40+ creators) it becomes a full-time role.
Substrate assumption
This section is written assuming Phase A is complete. That means:

Layer 0 (Data Ingestion): BUILT (was BUILT pre-Phase A)
Layer 1 (Scoring Engine): BUILT (was BUILT pre-Phase A)
Layer 2 (Event Log): BUILT via Phase A2. Every mutation route emits to platform_events. Event taxonomy documented.
Layer 3 (Memory): PARTIAL — Phase D completes this. AM workflows do not depend on Phase D.
Layer 4 (Creator Operations Graph): BUILT via Phase A3. onboarding_profiles is canonical. creators and creator_profiles are frozen.
Layer 5 (Capability Surfaces): PARTIAL — Phase E completes this. Per the accepted technical debt callout on Phase B, AM workflows are built on the current asymmetric pattern and refactored in Phase E.
Layer 6 (Managed Autonomy): PARTIAL — Phase F completes this. AM-3's auto-trigger requires Phase F; the manual nudge path does not.

Per-workflow detail
AM-1 — Brief Delivery
FieldDetailTriggerOperator approves a brief (in Clay or Dashboard).ActionSystem emails the brief to the creator via SMTP. Writes delivery timestamp and status to content_briefs. Emits brief.delivered event to platform_events.Clay UX"Approve Jake's brief" → Clay calls the approve-brief handler → "Done. Brief delivered to jake@email.com at 2:14 PM."Dashboard UXApprove button on the brief card → green "Delivered" badge appears with timestamp.DB writescontent_briefs.delivery_status → delivered, content_briefs.delivered_at → NOW(), content_briefs.completion_status → delivered. platform_events row with event_type = 'brief.delivered'.Failure handlingIf SMTP fails: delivery_status → failed, error logged, operator alerted. Retry available in both UIs. Delivery is idempotent — re-sending does not duplicate the content_briefs row; it updates timestamp and increments a delivery attempt counter.STATUSBUILT. Evidence: audit §3.1 marks this COMPLETE. src/lib/email/send-brief.ts:122 handles SMTP. src/app/api/agency/brief-review/route.ts:208 fires the approve path. No dedicated Clay tool — it rides on the approve_brief action. Post-Phase A2, platform_events emission is part of the approve path.DISTANCEAlready BUILT. Zero additional work.DEPENDENCIESLayer 2 (Event Log) for audit emission. Otherwise none.
AM-2 — Acknowledgment
FieldDetailTriggerCreator clicks the acknowledgment link embedded in the brief email.ActionAcknowledgment route updates the brief. Emits brief.acknowledged event.Clay UXOperator asks "any unacknowledged briefs?" → Clay queries via get_briefs_by_status → returns list with time-since-delivery. No dedicated Clay tool for acknowledgment itself — the creator does that via email link.Dashboard UXBrief cards show Acknowledged / Pending badge. Filter by status. Manual override button exists for operators who confirm acknowledgment through other channels (DM, call).DB writescontent_briefs.completion_status → acknowledged, content_briefs.acknowledged_at → NOW(). platform_events row with event_type = 'brief.acknowledged'.Failure handlingIf the creator never clicks the link, the brief sits in delivered state until AM-3's nudge fires. If they acknowledge via manual operator override, the event is emitted with actor_type = 'operator' rather than actor_type = 'creator'.STATUSPARTIAL. What exists: DB columns, /api/brief-acknowledge/[briefId]/route.ts handles the email-link click, send-brief.ts:151 embeds the ackUrl in outgoing email, Dashboard has a manual override button. What doesn't exist: no Clay tool for the operator-side acknowledgment query (only the generic get_briefs_by_status tool covers it indirectly). Audit §3.1 flagged the v1 doc as incorrect on "no creator link" — the link IS embedded.DISTANCEHours. The missing piece is a dedicated Clay read tool surfacing unacknowledged briefs in a more readable shape than get_briefs_by_status (e.g., "which briefs are stale?"). Everything else is in place.DEPENDENCIESLayer 2 (Event Log) for emission. Otherwise none.
AM-3 — Non-Response Follow-Up
FieldDetailTriggerManual path: operator invokes nudge_creator from Clay or clicks Nudge button on Dashboard. Auto path: scheduled function detects a brief in delivered state for > 24 hours with no acknowledgment and fires nudge automatically.ActionSystem sends a follow-up nudge email to the creator, increments nudge_count, stamps last_nudged_at. Emits brief.nudged event. Rate-limited: the same brief cannot be nudged more than once per 24 hours regardless of path.Clay UXOperator: "Luna hasn't acknowledged her brief in 26 hours — nudge her." Clay proposes propose_nudge_creator, operator confirms, Clay calls nudge_creator → "Nudge sent. She's been nudged once this cycle."Dashboard UXBrief card shows amber "Nudge Sent" badge with timestamp and count. Nudge button disabled during the 24-hour rate-limit window.DB writescontent_briefs.last_nudged_at → NOW(), content_briefs.nudge_count → increment. platform_events row with event_type = 'brief.nudged' and actor_type distinguishing manual vs auto.Failure handlingIf SMTP fails: nudge counter does NOT increment; operator alerted. Rate-limit check happens before the email is attempted, so a retry within 24h is blocked regardless of SMTP outcome. Escalation: if nudge_count >= 2 and still no acknowledgment 48 hours after the last nudge, the brief appears in the operator's "at risk" surface for manual intervention.STATUSPARTIAL. What exists: DB columns (last_nudged_at, nudge_count added in 20260417_phase1_action_scaffolding.sql:61-62), Clay tool pair (nudge_creator / propose_nudge_creator) at src/lib/agent/handler-adapters.ts:58 with 24h rate-limit at src/lib/clay/action-handler.ts:684, Dashboard Nudge button wired. What doesn't exist: the auto-trigger. Audit §3.1 notes "Auto-trigger absent from vercel.json" and §7 confirms "Critical agency-facing auto-behaviors (AM-3, OB-3, PM-5) NOT BUILT."DISTANCEDays. The manual path is BUILT. The auto-trigger is one scheduled function that queries content_briefs WHERE delivery_status = 'delivered' AND completion_status = 'delivered' AND delivered_at < NOW() - INTERVAL '24 hours' AND (last_nudged_at IS NULL OR last_nudged_at < NOW() - INTERVAL '24 hours') and calls the existing nudge handler per row. 1-2 days to write, test, add to vercel.json, and wire cron-failure alerting.DEPENDENCIESManual path: Layer 2 (Event Log). Auto path: Layer 2 + Layer 6 (Managed Autonomy). Auto-trigger is BLOCKED until Phase F. The manual path can ship as part of Phase B independently.
AM-4 — Production Tracking
FieldDetailTriggerCreator marks their own brief as "in production" via a future creator portal, OR operator marks it on their behalf via Clay or Dashboard. Today, only the operator path exists.ActionBrief advances through states: delivered → acknowledged → in_production → published. Each transition validates that the new state is a legal next-state from the current state. Emits brief.status_changed event with old and new values.Clay UX"Mark Jake's GLP-1 brief as in production" → Clay proposes propose_update_brief_status, operator confirms, Clay calls update_brief_status → "Done." "What's in production right now?" → Clay calls get_briefs_by_status(status='in_production') → returns list.Dashboard UXStatus dropdown on each brief card. Kanban view (stretch goal, part of Phase I). Status badges color-coded by state.DB writescontent_briefs.completion_status → new status, corresponding timestamp column set (acknowledged_at, in_production_at, published_at). platform_events row with event_type = 'brief.status_changed', payload { from, to }.Failure handlingInvalid transitions (e.g., jumping straight from delivered to published without passing through intermediate states) are rejected at the API layer. Operator sees an error with the allowed next-states. Database-level CHECK constraint on completion_status prevents garbage values.STATUSBUILT. Evidence: audit §3.1 marks this COMPLETE and notes the v1 doc was outdated. Clay tool pair update_brief_status / propose_update_brief_status at src/lib/agent/handler-adapters.ts:88. Dashboard status dropdowns wired. Post-Phase A2, platform_events emission is part of the state-change path.DISTANCEAlready BUILT. The kanban view is a stretch goal that lives under PM-1 in Phase I, not AM-4.DEPENDENCIESLayer 2 (Event Log). Otherwise none.
AM-5 — Publication Confirmation
FieldDetailTriggerCreator pastes published URL into a future creator portal, OR operator logs it via Clay or Dashboard, OR (future) TikTok API auto-detection. Today, only the operator path exists.ActionBrief marked published. published_url stored. The measurement window opens — AM-5 hands off to PA-1 (Performance Data Capture) which begins the 24h/48h/7d measurement cycle. Emits brief.published event.Clay UX"Log Luna's video — https://tiktok.com/…" → Clay proposes propose_update_brief_status with new_status = 'published' and published_url parameter, operator confirms → "Got it. VPS prediction was 42K. I'll track actuals and report back at the 24h mark."Dashboard UX"Mark Published" button with URL input field on the brief card at DashboardClient.tsx:757–802.DB writescontent_briefs.completion_status → published, content_briefs.published_at → NOW(), content_briefs.published_url → URL. platform_events row with event_type = 'brief.published', payload includes the URL and the VPS prediction captured at publish time for later delta calculation.Failure handlingURL validation at the API layer rejects malformed input. If the URL is valid but points to content that's later taken down, performance measurement (PA-1) handles that downstream — AM-5's job ends at confirming the brief reached "published." Re-publishing (e.g., creator reposts after deletion) updates the URL and re-stamps published_at; the event log preserves both.STATUSBUILT. Evidence: audit §3.1 marks this COMPLETE. Wired via update_brief_status with new_status='published' plus published_url parameter. /api/brief-status/route.ts:120 handles the write. Dashboard input field exists. Post-Phase A2, emission to platform_events is in place.DISTANCEAlready BUILT. The TikTok API auto-detection path is deferred to PM-4 in Phase I.DEPENDENCIESLayer 2 (Event Log). Otherwise none. AM-5's output is the trigger for PA-1, so PA-1's completeness depends on AM-5 — not the other way around.
Build gaps summary
WorkflowSchemaAPIDashboardClay toolAuto-triggerSTATUSAM-1 Brief Delivery✅✅✅✅ (via approve_brief)✅BUILTAM-2 Acknowledgment✅✅✅⚠️ (generic read tool only)✅ (email link)PARTIAL — dedicated Clay read tool missingAM-3 Non-Response Follow-Up✅✅✅✅ (manual)❌ (blocked on Phase F)PARTIAL — auto-trigger missingAM-4 Production Tracking✅✅✅✅N/ABUILTAM-5 Publication Confirmation✅✅✅✅N/A (TikTok API deferred to PM-4)BUILT
Tool Call Registry contribution (Account Manager)
ToolKindWrite pairPurposeSTATUSapprove_briefWritepropose / realApproves a brief, fires AM-1 deliveryBUILTget_briefs_by_statusReadn/aQuery briefs by completion_status, used by AM-2 and AM-4BUILTnudge_creatorWritepropose / realManual nudge for AM-3BUILTupdate_brief_statusWritepropose / realState transitions for AM-4 and AM-5BUILTget_unacknowledged_briefsReadn/aDedicated AM-2 read — time-since-delivery viewNOT BUILT (Phase B adds)
Phase B exit criteria
Phase B is complete when:

AM-2's dedicated Clay read tool (get_unacknowledged_briefs) exists and is registered.
AM-3's auto-trigger scheduled function is written, tested, and merged — but NOT yet added to vercel.json (that happens in Phase F).
All five AM workflows emit their documented platform_events types on every mutation path.
Every AM workflow passes a round-trip test: action taken in Clay → state visible in Dashboard, and action taken in Dashboard → state visible in Clay.
A docs/ai-employees/account-manager.md file exists summarizing the five workflows, their current STATUS, and their Phase E refactor plan.

Phase B does NOT ship AM-3's auto-trigger live — that waits for Phase F. It does ship the code.
END OF AI EMPLOYEE 1 — ACCOUNT MANAGER.