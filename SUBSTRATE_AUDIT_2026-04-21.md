# SUBSTRATE AUDIT — Creator Operations Graph
**Date:** 2026-04-21
**Project:** Trendzo / CleanCopy (`C:\Projects\CleanCopy`)
**Mode:** Read-only. No code changes.
**Schema source of truth:** `supabase/migrations/*.sql` (declared in `AI EMPLOYEE ARCHITECTURE.md` line 5).
**Note on DB access:** No Supabase MCP available during this audit. All schema claims are derived from migration files + code grep, not live DB inspection. Where column/row existence in the live DB cannot be confirmed from code, findings are marked **AMBIGUOUS**.

---

## EXECUTIVE SUMMARY (read this first)

The substrate is **real but incomplete**. `content_briefs` is well-columned and the `delivered_at` drift was resolved yesterday (migration `20260420`). Agency-level memory, Clay conversation persistence (24h window), a nightly memory-consolidation agent, and an MCP stdio server are genuinely built. But **five tables the architecture doc names do not exist at all** (`trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`), **three parallel "creator" tables coexist** (`creators` / `creator_profiles` / `onboarding_profiles`), and the `invitations` table the doc references is really `agency_invites` with none of the three nudge columns OB-3 requires. Only **two write-tool adapter pairs** are registered for Clay (`nudge_creator`, `update_brief_status`); every other "action" the LLM system prompt advertises reaches the handler through an ActionButton click path, not a proposal-gated tool call. **Three brief-mutating API routes use the service role without agency scoping** (`/api/brief-status`, `/api/brief-performance`, `/api/brief-acknowledge`) — any unauthenticated caller can advance any brief's state for any agency. SKILL-001..005 exist only as inline code; there are **zero `SKILL.md` files** in the project.

---

# STEP 1 — DATABASE LAYER

## 1.A Table inventory (Creator Operations Graph — focus tables)

The `supabase/migrations/` directory contains **151 migration files** spanning `20241205 → 20260421`. Core substrate tables listed below with latest-state columns (all CREATE + ALTER ADD COLUMN merged in chronological order).

### `content_briefs` — brief lifecycle spine
**Created:** `supabase/migrations/20260303_content_briefs.sql:5` | **Latest:** `delivered_at` in `20260420_add_delivered_at_to_content_briefs.sql:8`

| Column | Type | Added in |
|---|---|---|
| id | UUID PK | 20260303:6 |
| user_id | UUID NOT NULL → auth.users | 20260303:7 |
| source_video_id | TEXT | 20260303:8 |
| pattern_id | UUID → pattern_archetypes(id) | 20260303:9 |
| brief_content | JSONB DEFAULT '{}' | 20260303:10 |
| predicted_vps | NUMERIC(5,1) | 20260303:11 |
| status | TEXT CHECK (generated/accepted/recorded/analyzed/optimized/published/measured) | 20260303:12-17 |
| actual_vps | NUMERIC(5,1) | 20260303:18 |
| first_win | BOOLEAN | 20260303:19 |
| created_at / updated_at | TIMESTAMPTZ | 20260303:20-21 |
| delivery_status | TEXT DEFAULT 'pending' | 20260413:5 |
| completion_status | TEXT DEFAULT 'delivered' | 20260414_completion_status:5 |
| acknowledged_at | TIMESTAMPTZ | 20260414_completion_status:6 |
| in_production_at | TIMESTAMPTZ | 20260414_completion_status:7 |
| published_at | TIMESTAMPTZ | 20260414_completion_status:8 |
| published_url | TEXT | 20260414_completion_status:9 |
| vps_prediction | NUMERIC | 20260414_performance:4 |
| actual_views | INTEGER | 20260414_performance:5 |
| actual_engagement_rate | NUMERIC | 20260414_performance:6 |
| performance_delta | NUMERIC | 20260414_performance:7 |
| performance_measured_at | TIMESTAMPTZ | 20260414_performance:8 |
| performance_source | TEXT DEFAULT 'manual' | 20260414_performance:9 |
| opened_at / clicked_at / open_count | TIMESTAMPTZ / INT | 20260417_email_tracking:12-14 |
| scheduled_publish_at | TIMESTAMPTZ | 20260417_phase1_action_scaffolding:60 |
| last_nudged_at | TIMESTAMPTZ | 20260417_phase1_action_scaffolding:61 |
| nudge_count | INTEGER DEFAULT 0 | 20260417_phase1_action_scaffolding:62 |
| delivered_at | TIMESTAMPTZ | 20260420:8 |

**Graph role:** brief lifecycle spine.
**Row count:** AMBIGUOUS (no live DB access).
**Write activity:** Actively written — every agency/brief route.
**⚠ Key omission:** no `agency_id` column and no `creator_id` FK. Creator identity is derived by joining `onboarding_profiles.user_id`. See Steps 2.D and 6.

### `onboarding_profiles` — canonical creator record
**Created:** `supabase/migrations/20260321_core_onboarding_tables.sql:11` | **Merged calibration:** `20260322_merge_calibration_into_onboarding.sql` | **agency_id added:** `20260322_onboarding_user_id_required.sql:35`
**Key columns:** `id`, `user_id` NOT NULL → auth.users, `agency_id` FK (nullable), `onboarding_step`, `business_name`, `niche_key`, `platform`, `channel_handle`, `follower_count`, `creator_stage`, `dimension_scores` (JSONB), `inferred_niche`, `differentiator`, `calibration_completed`, `onboarding_completed`, plus 50+ calibration/tone/audience columns.
**Graph role:** the live canonical creator record. Every new agency workflow reads from this.

### `agencies` — tenant root
**Created:** `20241205_admin_schema_safe.sql:194` | **Re-declared idempotently:** `20260322_agency_scoped_rls.sql:15` | **planning_credits_remaining added:** `20260411_prompt38_planning_sessions.sql:93`
**Columns:** `id`, `name`, `slug` UNIQUE, `tier` (starter/growth/pro/enterprise), `owner_id` → profiles, `is_active`, `planning_credits_remaining`, timestamps.

### `agency_members` — agency membership
**Created:** `20241205_admin_schema_safe.sql:228` | **Re-declared:** `20260322_agency_scoped_rls.sql:27`
**Columns:** `id`, `agency_id` → agencies, `user_id` → auth.users, `role`, `is_active`, `created_at`.

### `creators` — legacy admin roster (see duplicate flag in 1.C)
**Created:** `20241205_admin_schema_safe.sql:249`
**Columns:** `id`, `user_id` → profiles, `agency_id` → agencies, `handle` UNIQUE, `display_name`, `verification_status`, `follower_count`, `avg_dps`, `best_dps`, `engagement_rate`, metadata JSONB, plus platform/revenue/notification/suspension columns.
**Consumers:** `src/mcp-server/tools.ts:38` (`.from('creators').select(...).eq('agency_id', ctx.agency_id)`) + admin dashboard hooks. **Not written by any new agency/Clay workflow.**

### `creator_profiles` — prediction-side TikTok baseline
**Created:** `20251119000000_creator_personalization.sql:8`
**Columns:** `tiktok_username` UNIQUE, `avg_views/likes/comments`, `baseline_dps`, `content_style` JSONB, `strengths/weaknesses` JSONB, `dps_percentiles` JSONB, `analysis_status`, `last_scraped_at`.
**Consumers:** `/api/creator/onboard`, `/api/creator/predict`, `/api/creator/list`. No `auth.users` FK.

### `calibration_profiles` — preserved backup
**Created:** `20260302_calibration_profiles.sql:4` | **creator_stage/dimension_scores/staged_at added:** `20260303_creator_staging.sql:5`
**Status:** Data migrated into `onboarding_profiles`. Intentionally preserved per comment in `20260322_merge_calibration_into_onboarding.sql:209`. No `from('calibration_profiles')` match found in `src/`.

### `agency_invites` — creator invitation tracking (the real "invitations" table)
**Created:** `20260417_phase1_action_scaffolding.sql:10`
**Columns:** `id`, `agency_id` NOT NULL, `creator_email` NOT NULL, `creator_name`, `invited_by`, `invited_at`, `status` CHECK (pending/sent/accepted/declined/expired/failed), `sent_at`, `accepted_at`, `error_message`.
**⚠ Missing columns (doc claims):** `nudge_count`, `last_nudge_at`, `nudge_stage` — NOT in migration. OB-3 has no schema.

### `agency_events` — operator-defined trend events (agency-scoped)
**Created:** `20260417_phase1_action_scaffolding.sql:34`
**Columns:** `id`, `agency_id`, `event_name`, `category`, `description`, `event_date`, `trend_window_start/end`, `created_by`, `created_at`.

### `cultural_events` — platform-wide classified trends
**Created:** `20260407_create_cultural_events.sql:5` | **generated_by_agent added:** `20260407_agent_attribution.sql:7`
**Columns:** `id` BIGSERIAL, `niche`, `event_title`, `event_summary`, `taxonomy_classification` JSONB, `velocity_score`, `confidence`, `decay_rate_estimate`, `activated_niches[]`, `source_trend_ids[]`, `keywords[]`, `status` (detected/approved/expired/rejected), `auto_approved`, `reviewed_at/by`, `created_at`, `expires_at`, `generated_by_agent`.

### `detected_trends` — raw LLM-synthesized trend output
**Created:** `20260407_create_detected_trends.sql:4`
**Columns:** `id`, `niche`, `trend_summary`, `velocity_score`, `confidence`, `source_count`, `sources[]`, `evidence` JSONB, `detected_date`, `created_at`.

### `pre_generated_briefs` — overnight brief drafts (Atlas subsystem 5 output)
**Created:** `20260407_autodream_tables.sql:6` | **critic columns added:** `20260407_brief_evaluations.sql:20`
**Columns:** `id` BIGSERIAL, `agency_id`, `client_id` (UUID, no FK — see 1.B3), `cultural_event_id` → cultural_events, `brief_content` JSONB, `vps_score`, `confidence`, `priority_type` CHECK, `status` (draft/presented/accepted/rejected/expired), `generated_at`, `expires_at`, `niche`, `final_critic_score`, `adversarial_rounds`, `generated_by_agent`.

### `morning_briefs` — compiled daily brief cards per agency
**Created:** `20260407_autodream_tables.sql:32`
**Columns:** `id`, `agency_id`, `brief_date`, `cards` JSONB, `card_count`, `status`, `created_at`, `generated_by_agent`.

### `agency_conversations` — Intelligent Clay session history
**Created:** `20260401_agency_conversations.sql:2`
**Columns:** `id`, `agency_id`, `user_id`, `messages` JSONB DEFAULT '[]', `title`, `is_active`, timestamps.

### `agency_triage` — precomputed morning triage
**Created:** `20260417_agency_triage.sql:8`
**Columns:** `id`, `agency_id`, `triage_date`, `items` JSONB, `item_count`, `computed_at`. `UNIQUE(agency_id, triage_date)`.

### `memory_extractions` — agency memory facts
**Created:** `20260407_memory_system.sql:8` | **creator_id added:** `20260407_context_assembly.sql:34-38`
**Columns:** `id`, `agency_id` NOT NULL, `creator_id` FK → auth.users (nullable), `fact`, `source`, `tier` (hot/warm/cold), `confidence`, `reference_count`, `superseded_by`, timestamps.

### `chairman_alerts` — alert inbox (agency-scoped)
**Created:** `20260410_prompt33_model_promotion_validation.sql:14` | **agency_id added:** `20260410_prompt34_platform_monitoring.sql:8` | **ack/snooze added:** `20260410_prompt35_alerts_dashboard.sql:40`

### `platform_events` — unified event spine
**Created:** `20260319_platform_events.sql:5` | **extended:** `20260418_platform_events_extend.sql:9` (actor_type, agency_id, correlation_id)

### Other confirmed tables (summary)
| Table | Created In | Role |
|---|---|---|
| `prediction_runs` | `20260115_transcription_status_tracking.sql:13` | VPS prediction run log |
| `run_component_results` | (pipeline support) | Per-component scoring |
| `workflow_runs` / `_steps` / `_artifacts` | `20260119_workflow_tables.sql` | 6-phase viral content workflow |
| `tiktok_drafts` | `20260119_workflow_tables.sql` | TikTok scheduled drafts |
| `pattern_archetypes` | `20260303_pattern_library.sql` | Content pattern templates |
| `archetype_instances`, `archetype_niche_metrics` | `20260303_pattern_library.sql` | Pattern usage |
| `creator_pattern_performance` | `20260303_creator_pattern_performance.sql` | Per-creator pattern win rates |
| `content_calendars` | `20260303_creator_pattern_performance.sql` | Calendar scheduling |
| `generated_scripts` | `20260321_core_onboarding_tables.sql` | Onboarding-generated scripts |
| `cultural_scan_results` | `20260406_create_cultural_scan_results.sql` | Reddit/X raw scans |
| `agent_cards` / `agent_card_sessions` / `agent_card_leads` | `20260403_create_agent_cards.sql` | Shareable agent cards |
| `training_experiments`, `model_variants` | `20260407_trainer_engine.sql` | Model training |
| `trainer_programs` | `20260407_trainer_engine.sql` | Trainer config |
| `model_promotion_log` | `20260408_model_promotion_log.sql` | Model promotion history |
| `memory_consolidation_log` | `20260407_memory_system.sql` | Nightly memory consolidation |
| `planning_sessions` | `20260411_prompt38_planning_sessions.sql:22` | ULTRAPLAN runs |
| `planning_action_items` | `20260411_prompt39_planning_action_items.sql` | Planning outputs |
| `scheduled_actions` | `20260411_prompt40_scheduled_actions.sql:17` | Self-scheduled Atlas actions |
| `candidate_features` | `20260411_prompt41_candidate_features.sql` | ML feature candidates |
| `cross_niche_patterns` | `20260411_prompt42_cross_niche_patterns.sql` | Cross-niche transfers |
| `network_insights` | `20260411_prompt44_network_insights.sql` | Cohort insights |
| `context_assembly_log` | `20260407_context_assembly.sql` | LLM context audit |
| `mcp_api_keys`, `mcp_call_log` | `20260411_prompt43_mcp.sql` | MCP server auth + log |
| `s6_training_experiments` | `20260415_s6_training_experiments.sql` | S6 retrain variants |
| `brief_evaluations` | `20260407_brief_evaluations.sql:5` | Adversarial critic rounds |
| `brief_variants` | `20260407_brief_variants.sql:4` | A/B/C brief variants |
| `creator_video_history` | (migration contains FKs) | Per-creator video history |

### ⚠ Table with AMBIGUOUS canonical definition
**`scraped_videos`** — CREATE TABLE is in `scripts/create-apify-scraper-tables.sql:23` (outside `supabase/migrations/`). Multiple migrations ALTER this table (niche, dps_score/classification, pattern_extraction_status, training_eligible, holdout columns). The schema source-of-truth rule cannot be applied. Treat with caution.

## 1.B Relationships

### 1.B.1 Explicit Foreign Keys
| Table.column | → | Referenced |
|---|---|---|
| content_briefs.user_id | → | auth.users(id) ON DELETE CASCADE |
| content_briefs.pattern_id | → | pattern_archetypes(id) ON DELETE SET NULL |
| onboarding_profiles.user_id | → | auth.users(id) (added 20260322) |
| onboarding_profiles.agency_id | → | agencies(id) |
| generated_scripts.onboarding_profile_id | → | onboarding_profiles(id) |
| generated_scripts.parent_script_id | → | generated_scripts(id) self-ref |
| generated_scripts.user_id | → | auth.users(id) (added 20260322) |
| creators.user_id | → | profiles(id) ON DELETE CASCADE |
| creators.agency_id | → | agencies(id) ON DELETE SET NULL |
| creators.verified_by | → | profiles(id) |
| agencies.owner_id | → | profiles(id) |
| agency_members.agency_id | → | agencies(id) ON DELETE CASCADE |
| agency_members.user_id | → | auth.users(id) ON DELETE CASCADE |
| profiles.id | → | auth.users(id) ON DELETE CASCADE |
| pre_generated_briefs.cultural_event_id | → | cultural_events(id) |
| brief_evaluations.brief_id | → | pre_generated_briefs(id) ON DELETE CASCADE |
| brief_variants.brief_id | → | pre_generated_briefs(id) ON DELETE CASCADE |
| creator_video_history.creator_profile_id | → | creator_profiles(id) ON DELETE CASCADE |
| creator_video_history.video_id | → | video_files(id) ON DELETE SET NULL |
| creator_video_history.prediction_id | → | prediction_events(id) ON DELETE SET NULL |
| memory_extractions.creator_id | → | auth.users(id) ON DELETE CASCADE |
| memory_extractions.superseded_by | → | memory_extractions(id) ON DELETE SET NULL |
| chairman_alerts.agency_id | → | agencies(id) ON DELETE SET NULL |
| planning_sessions.agency_id | → | agencies(id) ON DELETE SET NULL |
| workflow_runs.user_id | → | auth.users(id) ON DELETE CASCADE |
| workflow_run_steps.workflow_run_id | → | workflow_runs(id) ON DELETE CASCADE |
| workflow_run_artifacts.workflow_run_id / step_id | → | workflow_runs / workflow_run_steps |
| exemplar_library.user_id | → | auth.users(id) |
| tiktok_drafts.workflow_run_id | → | workflow_runs(id) |
| workflow_performance.workflow_run_id | → | workflow_runs(id) |

### 1.B.2 Implicit *_id columns (no FK constraint)
| Table | Column | Likely Target |
|---|---|---|
| agency_conversations | agency_id | agencies |
| agency_triage | agency_id | agencies |
| agency_invites | agency_id, invited_by | agencies, auth.users |
| agency_events | agency_id, created_by | agencies, auth.users |
| pre_generated_briefs | agency_id | agencies |
| pre_generated_briefs | client_id | **AMBIGUOUS** — auth.users.id OR onboarding_profiles.user_id (code at `autodream/route.ts:208` queries `onboarding_profiles` with this id → implies auth.users) |
| morning_briefs | agency_id | agencies |
| memory_consolidation_log | agency_id | agencies |
| platform_events | actor_id / entity_id / agency_id | various |
| chairman_alerts (before 20260410_34) | agency_id | agencies (later FK'd) |

### 1.B.3 Dangling references
- `generated_scripts.prediction_run_id` — declared UUID, no FK. Implicit reference to `prediction_runs(id)` — not enforced.
- All confirmed other *_id references resolve to tables that exist. No broken FKs detected.

## 1.C Anomalies

### 1.C.1 Three parallel "creator" identity tables
| Table | Role | Active write path? |
|---|---|---|
| `creators` | Legacy admin roster, agency-scoped | Read-only from new agency flows. Consumed by `src/mcp-server/tools.ts` + admin hooks. |
| `creator_profiles` | Prediction-side TikTok baseline (no auth link) | Written by `/api/creator/onboard`, `/api/creator/predict` |
| `onboarding_profiles` | Canonical creator record (per merge migration comment "Every downstream feature reads from this table") | Written by onboarding flow + agency-chat |
| `calibration_profiles` | Data migrated out; preserved as backup | Read-only; no `from(...)` matches in `src/` |

**Impact:** The agency-chat route and Dashboard use `onboarding_profiles`. The MCP server and admin dashboard use `creators`. There is no synchronization — a creator added via one flow may not appear in the other.

### 1.C.2 Duplicate `training_data` CREATE TABLE
Two migrations on 2025-12-06 both create `training_data`:
- `20251206_operations_center.sql:114`
- `20251206_training_data_table.sql:11`

The second uses `IF NOT EXISTS`, preventing crash, but the column schemas may differ. Runtime state depends on execution order.

### 1.C.3 Orphaned tables (no consumers in `src/`)
| Table | Evidence |
|---|---|
| `calibration_profiles` | Backup only — intentional |
| `campaign_invites` | In admin schema (20241205). Zero `from('campaign_invites')` matches. |
| `clippers` | In admin schema. Zero matches. |
| `developers` | In admin schema. Zero matches. |
| `content_calendars` | Zero `from('content_calendars')` matches. |

### 1.C.4 Architecture doc tables that DO NOT EXIST
| Doc reference | Real schema status |
|---|---|
| `invitations.nudge_count` / `last_nudge_at` / `nudge_stage` | **NOT IN SCHEMA** — the real table is `agency_invites`, and it has none of these columns |
| `trend_creator_matches` | **NOT IN SCHEMA** — no migration, zero code references |
| `creator_alerts` | **NOT IN SCHEMA** — no migration, zero code references |
| `creator_feedback` | **NOT IN SCHEMA** — no migration, zero code references |
| `performance_reports` | **NOT IN SCHEMA** — no migration, zero code references |
| `scheduled_posts` | **NOT IN SCHEMA** — (there is `content_briefs.scheduled_publish_at` + `tiktok_drafts` but no `scheduled_posts` table) |
| `chase_log` | **NOT IN SCHEMA** — no migration, zero code references |
| `draft_briefs` | **NOT IN SCHEMA** — conceptual name for `pre_generated_briefs` with `status='draft'` |

### 1.C.5 Columns referenced in code but not in migrations
| Code reference | File:line | Status |
|---|---|---|
| `agencies.status` | `src/app/api/cron/autodream/route.ts:389`, `src/app/api/cron/consolidate-memory/route.ts:454` | **NOT IN ANY MIGRATION.** `agencies` has `is_active` not `status`. Query returns null silently. |

---

# STEP 2 — API LAYER

**Total route.ts files:** ~870 (vs. the ~197 mentioned in the brief — the codebase has grown). Only the substrate-writing subset is inventoried here.

## 2.A Substrate-writing routes (the important list)

### Brief group
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/brief-status/route.ts` | GET, POST | content_briefs, onboarding_profiles | content_briefs (completion_status, timestamps) | **supabaseAdmin (SERVICE_KEY). No auth gate. No agency_id filter.** | `DashboardClient.tsx:234` |
| `/api/brief-performance/route.ts` | GET, POST | content_briefs, onboarding_profiles | content_briefs (actual_views, actual_engagement_rate, performance_delta, performance_measured_at) | **supabaseAdmin. No auth gate. No agency_id filter.** | `DashboardClient.tsx:194` |
| `/api/brief-acknowledge/[briefId]/route.ts` | GET | content_briefs | content_briefs (completion_status=acknowledged, acknowledged_at) | **supabaseAdmin. No auth gate** (token-in-URL pattern) | Email link only |

### Agency group
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/agency/batch-briefs/route.ts` | POST | cultural_events, onboarding_profiles, pre_generated_briefs | pre_generated_briefs, brief_variants, brief_evaluation_rounds | **supabaseAdmin. `agency_id` from request body, not session.** | `DashboardClient.tsx:310` |
| `/api/agency/brief-review/route.ts` | GET, PATCH | pre_generated_briefs, onboarding_profiles, cultural_events, brief_variants | pre_generated_briefs (status), content_briefs (insert on approve), brief_variants | **supabaseAdmin. `agency_id` from query/body.** | `DashboardClient.tsx:255,295` |
| `/api/agency/memory/route.ts` | GET, POST, PATCH, DELETE | memory_extractions | memory_extractions, memory_consolidation_log | **supabaseAdmin. `agency_id` from request, no session auth.** | `MemoryClient.tsx:51,60,69` |
| `/api/agency-chat/route.ts` | POST (streaming) | content_briefs, pre_generated_briefs, onboarding_profiles, agency_invitations, cultural_events, agency_events, prediction_runs_enriched, dps_v2_cohort_stats, generated_scripts, brief_variants, brief_assignments, memory_extractions | indirect writes via tool dispatch | Mixed: `createServerSupabaseClient` for identity at :384, then **supabaseAdmin** at :436, :1495 for data | `AgencyClient.tsx:636` (AI SDK transport) |

### Creator group
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/creator/onboard/route.ts` | POST, GET | creator_profiles | creator_profiles, creator_video_history | **supabaseAdmin module-level. No auth gate.** | `admin/creators/page.tsx:58,90` |
| `/api/creator/predict/route.ts` | POST, GET | onboarding_profiles, creator_calibration_profiles, video_files, prediction_runs | video_files, prediction_runs, metric_check_schedule | `createServerSupabaseClient` for auth + supabaseAdmin for writes | `admin/creators/page.tsx:131`, `workflows/creator/page.tsx:257` |
| `/api/creator/list/route.ts` | GET | creator_profiles | — | **supabaseAdmin. No auth gate.** | `admin/creators/page.tsx:39` |
| `/api/creator/profile/route.ts` | GET | creator_profiles | — | None | No callers |

### Invite / onboarding group
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/invites/route.ts` | GET, POST | invite | invite, email_queue | **supabaseAdmin. Tenant from `x-tenant-id` header only (easily spoofed). GET with no header returns all tenants' invites.** | None |
| `/api/invites/accept/route.ts` | POST | invite | invite (accepted_at) | **supabaseAdmin. Token-based, no session.** | None |
| `/api/onboarding/status/route.ts` | GET | onboarding_progress | — | **supabaseAdmin. Tenant from header.** | None |
| `/api/onboarding/mark/route.ts` | POST | — | onboarding_progress | **supabaseAdmin. Tenant from body.** | None |
| `/api/onboarding/process/route.ts` | POST | onboarding_profiles, viral_genomes, scraped_videos | — | **supabaseAdmin. No auth check.** | None |

### Prediction group
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/kai/predict/route.ts` | POST, GET | video_files, prediction_runs | video_files, prediction_runs | **supabaseAdmin module-level. No auth gate.** | `upload-test/page.tsx:1297,1479,1620`, `workflows/creator/page.tsx:257`, `studio/creator/page.tsx:343` |
| `/api/admin/prediction-runs/route.ts` | GET | prediction_runs, metric_check_schedule, video_files | — | supabaseAdmin + `verifyAdminAuth` | `upload-test/page.tsx:478` |

### Cultural events + feedback
| Route | Methods | Reads | Writes | Auth Model | Callers |
|---|---|---|---|---|---|
| `/api/admin/cultural-events/route.ts` | GET, PATCH | cultural_events | cultural_events | **supabaseAdmin. No session auth.** | `admin/cultural-events/page.tsx:66` |
| `/api/feedback/route.ts` | POST | — | feedback | **supabaseAdmin. `user_id` from request body (self-reported).** | `operations-center/page.tsx:33` (GET summary) |
| `/api/feedback-ingest/cron/route.ts` | POST, GET | prediction_runs, metric_check_schedule | prediction_runs / creator_feedback (via lib) | Bearer `CRON_SECRET_KEY` (optional) | None (cron) |

### Content calendar / quick win
| Route | Methods | Reads | Writes | Auth Model |
|---|---|---|---|---|
| `/api/content-calendar/accept/route.ts` | POST | content_calendar | content_briefs (insert), content_calendar (update) | `createServerSupabaseClient` + supabaseAdmin |
| `/api/quick-win/brief/route.ts` | POST, PATCH | content_briefs | content_briefs (status, predicted_vps, actual_vps), creator_profiles (first_win) | `createServerSupabaseClient` + supabaseAdmin |

## 2.B Off-substrate routes (count summary)
- **Replicate proxy:** 1 route
- **Apify scrape proxies (no internal write):** ~15 routes (of ~43 Apify-touching)
- **LLM proxies (Gemini/OpenAI/Anthropic wrappers, no persistence):** ~10 routes
- **Health/ping/status (no DB, no third-party write):** ~21 routes
- **Integration dryrun harnesses (`/api/admin/integration/dryrun_*`):** 58 routes
- **No Supabase import at all:** 413 routes

## 2.C Dead routes (zero `fetch()` callers in `src/`)
- `/api/brief-acknowledge/[briefId]` — email-link-only, not dead by design
- `/api/agency-chat` — invoked via AI SDK `DefaultChatTransport`, not a bare fetch (not technically dead)
- `/api/invites/*` — no callers
- `/api/onboarding/status`, `/api/onboarding/process`, `/api/onboarding/mark` — superseded by Viral Studio direct-lib flow
- `/api/feedback-ingest/cron` — cron-triggered externally
- `/api/creator/profile` — no callers

## 2.D RLS bypass flags — agency-isolation leaks (HIGH SEVERITY)

Routes using service role AND writing agency-scoped data WITHOUT binding to session identity:

1. **`/api/brief-status`** (lines 27, 106) — unauthenticated POST can advance any brief's `completion_status` by `briefId` alone.
2. **`/api/brief-performance`** (lines 40, 137) — unauthenticated POST writes `actual_views`, `performance_delta` to any brief.
3. **`/api/brief-acknowledge/[briefId]`** (line 32) — public GET (by design for email links) but no token verification.
4. **`/api/agency/batch-briefs`** (line 182) — `agency_id` from body. Zero auth.
5. **`/api/agency/brief-review`** (lines 21–24) — `agency_id` from query/body. Inserts `content_briefs` and emails creator. No session auth.
6. **`/api/agency/memory`** (lines 18–21) — all four methods, `agency_id` from request, no auth. Any caller can read/write/delete any agency's memory.
7. **`/api/admin/cultural-events`** (lines 13–18) — PATCH has no session auth.
8. **`/api/creator/onboard`** (module-level line 14) — no auth. Creates/updates `creator_profiles` for any TikTok username.
9. **`/api/kai/predict`** (module-level line 33) — no auth. Inserts into `video_files`, `prediction_runs`.
10. **`/api/invites` GET** — without `x-tenant-id` header returns **all tenants' invites** (line 26).
11. **`/api/onboarding/mark`** (line 8) — upsert with tenant from body.
12. **`/api/feedback`** (lines 5–7) — `user_id` self-reported from body.

**`/api/agency-chat`** (lines 436, 1495) — has session auth at :384, then uses serviceClient. Correct in theory but any bug in `getUserAgencyId()` exposes cross-agency data.

## 2.E Audit trail gaps
Every route writing to `content_briefs` or `creator_profiles` without `updated_at` or `operator_id`:
1. `/api/brief-status` POST (128–136) — no `updated_at`, no `operator_id`.
2. `/api/brief-performance` POST (155–160) — `performance_source='manual'` is the only actor signal.
3. `/api/brief-acknowledge/[briefId]` GET (53–55) — anonymous email link.
4. `/api/agency/brief-review` PATCH approve (188–200) — insert has no `operator_id`, no `agency_id` on the new row.
5. `/api/agency/brief-review` PATCH reject (236–249) — `rejected_by='chairman'` hardcoded, not session user.
6. `/api/quick-win/brief` POST (42) and PATCH (98–110) — no audit.
7. `/api/creator/onboard` (58–83, 168–260) — no `operator_id`.
8. `/api/feedback` POST — `user_id` is untrusted.

---

# STEP 3 — FEATURE LAYER (5 AI EMPLOYEES + 5 SKILLS)

## 3.1 Account Manager

| Workflow | Doc Claim | Verified | Substrate | Clay Tool | Dashboard | Evidence |
|---|---|---|---|---|---|---|
| AM-1 Brief Delivery | BUILT (B1) | **COMPLETE** | content_briefs (delivery_status, delivered_at) | No dedicated tool — fires on `approve_brief` | Approve button → SMTP | `src/lib/email/send-brief.ts:122`, `src/app/api/agency/brief-review/route.ts:208` |
| AM-2 Acknowledgment | PARTIAL — no creator link | **PARTIAL (doc is wrong about the link)** — ack link IS embedded; no Clay tool | content_briefs (completion_status, acknowledged_at) | None | Manual Dashboard button | `src/app/api/brief-acknowledge/[briefId]/route.ts`, `send-brief.ts:151` (ackUrl embedded) |
| AM-3 Non-Response Follow-Up | NOT BUILT | **PARTIAL (doc understates)** — manual nudge Clay tool IS built (`nudge_creator`); auto-trigger is NOT | content_briefs (last_nudged_at, nudge_count) | `nudge_creator` (propose/real pair, rate-limited 24h) | Nudge button wired | `src/lib/clay/action-handler.ts:684`, `src/lib/agent/handler-adapters.ts:58`. Auto-trigger absent from `vercel.json`. |
| AM-4 Production Tracking | PARTIAL — no Clay | **COMPLETE (doc is outdated)** — Clay tool pair IS wired | content_briefs (completion_status, in_production_at) | `update_brief_status` (propose/real pair) | Status dropdowns | `src/lib/agent/handler-adapters.ts:88` |
| AM-5 Publication | PARTIAL — no Clay | **COMPLETE** — wired via `update_brief_status` with `new_status='published'` + `published_url` | content_briefs (completion_status, published_at, published_url) | `update_brief_status` | Manual input field at `DashboardClient.tsx:757–802` | `/api/brief-status/route.ts:120` |

**AM bugs/stubs:**
- `DashboardClient.tsx:89` — `daysSilent()` is a deterministic hash stub with `// TODO: wire to real last-post date`.
- `send_invite` action explicitly stubbed: "Email send lives in Phase 1 Turn 4; for now the invite row is queued." (`action-handler.ts:675`).

## 3.2 Onboarding Specialist

| Workflow | Doc Claim | Verified | Substrate | Clay Tool | Dashboard | Evidence |
|---|---|---|---|---|---|---|
| OB-1 Invitation | NOT BUILT | **PARTIAL — DB row created, email NOT SENT** | agency_invites | `send_invite` case in handler (not a registered Clay adapter) | ActionButton dispatches chat message | `action-handler.ts:656`, line 675 stub comment |
| OB-2 Progress Tracking | NOT BUILT | **PARTIAL** — `creator_stage` exists, agency-chat reads stages passively; no dedicated page | onboarding_profiles (creator_stage) | None | None | `agency-chat/route.ts:629–658`, `20260322_merge_calibration:35` |
| OB-3 Stall Detection & Auto-Nudge | NOT BUILT | **NOT BUILT** | `invitations.nudge_*` — NOT IN MIGRATIONS | None | None | No schema, no cron, no logic |
| OB-4 Auto-Profiling | NOT BUILT as auto | **PARTIAL** — `rebuildCreatorProfile()` exists but no auto-trigger on TikTok link | creator_profiles, creator_token_coeffs | None | Manual invocation only | `src/lib/creator/profile_builder.ts:50` |

**OB bugs/stubs:**
- `send_invite` is stubbed at `action-handler.ts:675-679`.
- Table-name collision: `agency-chat/route.ts:457` queries `agency_invitations` (plural), `action-handler.ts:662` writes `agency_invites` (singular). Only `agency_invites` exists; the plural query always returns empty.

## 3.3 Trend Scout / Content Strategist

| Workflow | Doc Claim | Verified | Substrate | Clay Tool | Dashboard | Evidence |
|---|---|---|---|---|---|---|
| TS-1 Trend Monitoring | PARTIAL | **PARTIAL** — cron route exists, is NOT registered in `vercel.json`; TrendRadar page uses scraped_videos + hardcoded fallback, not detected_trends | detected_trends, cultural_events | None | `/agency/trends/` (placeholders) | `/api/cron/cultural-scan/route.ts`, `trends/page.tsx:56–76` (random `Math.random()` at :72). `vercel.json` lacks cultural-scan cron. |
| TS-2 Trend-to-Creator Matching | NOT BUILT | **NOT BUILT** | `trend_creator_matches` — missing | None | None | `match_creators_to_event` matches on niche equality to `agency_events`, not cultural trends |
| TS-3 Auto-Brief from Trend | PARTIAL | **PARTIAL** — autodream nightly batch exists; `generate-brief` ActionButton reachable, not a Clay adapter; no real-time trigger | content_briefs, pre_generated_briefs, morning_briefs, cultural_events | `generate_brief` in system prompt but ActionButton-only | `/agency/` Clay | `action-handler.ts:103,242`, `/api/cron/autodream/route.ts` |
| TS-4 Creator Alerts | NOT BUILT | **NOT BUILT** | `creator_alerts` — missing | None | None | — |

**TS bugs/stubs:**
- `src/app/agency/trends/page.tsx:72` — `velocity: Math.round(data.count * 12 + Math.random() * 20)` in a server component. Non-deterministic.
- TrendRadar FOMO section hardcodes "12 agencies" / "3.2x higher engagement".
- `cultural-scan` cron exists but not scheduled.

## 3.4 Performance Analyst

| Workflow | Doc Claim | Verified | Substrate | Clay Tool | Dashboard | Evidence |
|---|---|---|---|---|---|---|
| PA-1 Data Capture | PARTIAL (B3) | **PARTIAL** — manual Dashboard + handler case; no Clay adapter | content_briefs (actual_views etc.) | `log_performance` ActionButton-only | `DashboardClient.tsx:794–802` | `/api/brief-performance/route.ts` |
| PA-2 Pred vs Actual | PARTIAL | **PARTIAL** — delta on write; `get_performance_summary` Clay read tool exists; NO factor analysis | content_briefs (performance_delta, vps_prediction, actual_views) | `get_performance_summary` | `AccuracyView.tsx:11` TODO — stubbed with `Math.random()` | `brief-performance:88–104`, `AccuracyView.tsx:17` generatePredictions uses Math.random |
| PA-3 Weekly Reports | NOT BUILT | **PARTIAL** — `generateReport()` aggregates on demand; NOT scheduled; no `performance_reports` table | content_briefs (reads) | `generate_report` handler case, not system-prompt action | Quick-action button in ClayPanel | `action-handler.ts:943–987` |
| PA-4 Coaching Feedback | NOT BUILT | **NOT BUILT** | `creator_feedback` — missing | None | None | `feedback-learning-engine.ts` is model-accuracy, not creator coaching |
| PA-5 Model Loop | NOT BUILT | **NOT BUILT (as agency loop)** | XGBoost admin tables, disconnected from agency | None | AccuracyView stubbed | `AccuracyView.tsx:11` TODO; entire component uses `Math.random()` |

**PA bugs/stubs:**
- `AccuracyView.tsx`, `MomentumView.tsx`, `RankView.tsx`, `RevenueView.tsx`, `TrendsView.tsx` — all carry TODO markers; several use `Math.random()` to fabricate dashboard numbers shown to operators.
- `generateReport` (`action-handler.ts:956`) queries ALL `onboarding_profiles` without `.eq('agency_id', ...)` — can aggregate cross-agency.

## 3.5 Project Manager / Coordinator

| Workflow | Doc Claim | Verified | Substrate | Clay Tool | Dashboard | Evidence |
|---|---|---|---|---|---|---|
| PM-1 Pipeline Overview | PARTIAL | **PARTIAL** — badges + passive system-prompt context; no kanban, no `get_pipeline_status` tool | content_briefs (reads) | None | Status badges only | `agency-chat/route.ts:856–875` |
| PM-2 Deadlines | NOT BUILT | **NOT BUILT** — `deadline` read in context but no migration adds it; no reminder logic | — | None | None | `agency-chat:869` reads `brief.deadline`; no migration |
| PM-3 Posting Time | NOT BUILT | **NOT BUILT** — `posting_time_score` is an XGBoost feature but no recommendation API | — | None | `ScheduleStrip.tsx` read-only | — |
| PM-4 Post Scheduling | NOT BUILT | **PARTIAL** — `schedule_post` writes `content_briefs.scheduled_publish_at`; no TikTok/Publer integration; no downstream reader | content_briefs (scheduled_publish_at) | ActionButton only | None | `action-handler.ts:920`. **Write has no consumer.** |
| PM-5 Chase Sequences | NOT BUILT | **NOT BUILT** | `chase_log` — missing | None | None | — |

## 3.6 Skills

**Zero `SKILL.md` files exist in the project.** The `.claude/skills/` directory contains symlinks to design skills (adapt, animate, colorize, etc.) in `.agents/skills/` — none of these are SKILL-001..005.

| Skill | Doc Claim | Verified | Packaged as SKILL.md? | Evidence |
|---|---|---|---|---|
| SKILL-001 Creator Profiling | BUILT | **PARTIAL** — inline code only. Implementation is a **32-element character-frequency hash** as "style_embedding" + token-lift coefficients — NOT the "58-feature fingerprint" the arch doc implies | No | `src/lib/creator/profile_builder.ts:50` |
| SKILL-002 Video Fingerprinting | BLOCKED | **NOT BUILT** (as 58-feature fingerprint). Audio spectral fingerprint exists for a different purpose (clustering). | No | `src/lib/services/audio-classifier.ts:316` is unrelated |
| SKILL-003 DPS/VPS Scoring | BLOCKED | **PARTIAL** — the production VPS pipeline (`runPredictionPipeline.ts`) is real and well-used, but it is NOT the skill-chained version deriving from SKILL-002 | No | `src/lib/prediction/runPredictionPipeline.ts`, `src/lib/calibration/` |
| SKILL-004 Brief Generation | BLOCKED | **PARTIAL** — brief generation works (Gemini 2.5 Flash + adversarial, autodream batch, trend-triggered) but does NOT consume a SKILL-002 fingerprint | No | `/api/cron/autodream/route.ts`, `action-handler.ts:242`, `/api/agency/batch-briefs/route.ts` |
| SKILL-005 Feedback Generation | NOT BUILT | **NOT BUILT** | No | No `creator_feedback` table; no coaching generator |

---

# STEP 4 — CONVERSATION LAYER (Intelligent Clay)

## 4.A Anthropic-SDK tools (registered to LLM)

Tools are built via `buildToolsFromRegistry` (`src/lib/agent/tool-registry.ts`). SDK call at `route.ts:1711` uses `streamText` (AI SDK wrapping Anthropic). Tools come from two sources: (1) `ADAPTERS` in `src/lib/agent/handler-adapters.ts`, which emit propose/real pairs; (2) inline `extraReadTools`.

### 4.A.1 From ADAPTERS (write-action propose/real pairs)
| Real tool | Propose tool | Writes | Handler | Stub? |
|---|---|---|---|---|
| `nudge_creator` | `propose_nudge_creator` | content_briefs (last_nudged_at, nudge_count) + email via nodemailer | `handler-adapters.ts:64` → `action-handler.ts` case `nudge_creator` | No. Rate-limited 24h. Errors surfaced. |
| `update_brief_status` | `propose_update_brief_status` | content_briefs (completion_status, timestamps, published_url) | `handler-adapters.ts:97` → case `update_brief_status` | No. State transitions validated. |

The proposal tools write an `agent.proposal` event to `platform_events` via `emitEventStrict` (`tool-registry.ts:85`).

### 4.A.2 Inline read tools (route.ts:1644–1689)
| Tool | Description | Handler |
|---|---|---|
| `get_briefs_by_status` | Fetch briefs by completion_status / creator name | HTTP GET to `/api/brief-status` (route.ts:1652) |
| `get_performance_summary` | Aggregate performance for published briefs | HTTP GET to `/api/brief-performance` (route.ts:1675) |

**That is the complete tool-use surface: 4 tools (2 write propose/real pairs + 2 inline reads). Everything else the system prompt advertises goes through the ActionButton path, not tool-use.**

## 4.B ActionButton types

### 4.B.1 Handler-side cases (`action-handler.ts`)
| Case | Function | Tables Written | Error Surfaced? |
|---|---|---|---|
| `approve` (brief path) | approveBrief | pre_generated_briefs | Yes |
| `approve` (trainer path) | approveTrainerExperiment | training_experiments, model_variants | Yes |
| `reject` (brief path) | rejectBrief | pre_generated_briefs | Yes |
| `reject` (trainer path) | rejectTrainerExperiment | training_experiments | Yes |
| `generate-brief` | generateBriefFromTrend | pre_generated_briefs | Yes |
| `generate-recovery-brief` | generateRecoveryBrief | pre_generated_briefs | Yes |
| `select-variant` | selectVariant | brief_variants | Yes |
| `confirm` | (inline) | — | **Silent success, no DB op (intentional UX)** |
| `cancel` | (inline) | — | **Silent success, no DB op (intentional UX)** |
| `acknowledge_alert` | dismissAlert | chairman_alerts | **Swallowed** (see 4.C) |
| `dismiss_alert` | dismissAlert | chairman_alerts | **Swallowed** (see 4.C) |
| `update_brief_status` | updateBriefStatus | content_briefs | Yes |
| `log_performance` | logBriefPerformance | content_briefs | Yes |
| `upgrade` | (inline) | — | **Silent success (placeholder, per registry)** |
| `approve_brief` | approveContentBrief | content_briefs | Yes. **Missing agency_id scope guard** (line 638-642) |
| `send_invite` | sendInvite | agency_invites | Partial — DB row inserted, **email silently deferred** (line 675) |
| `nudge_creator` | nudgeCreator | content_briefs | Yes (rate-limited) |
| `create_event` | createAgencyEvent | agency_events | Yes |
| `match_creators_to_event` | matchCreatorsToEvent | — (read) | Yes |
| `push_brief_to_creators` | pushBriefToCreators | content_briefs (clones) | Partial — per-creator error list |
| `check_push_status` | checkPushStatus | — | Yes |
| `generate_batch_briefs` | generateBatchBriefs | content_briefs | Partial. **Missing agency_id on insert** (line 896–908) |
| `schedule_post` | schedulePost | content_briefs (scheduled_publish_at). **Registry says target=scheduled_actions (mismatch)** | Yes |
| `generate_report` | generateReport | — (reads) | N/A. **Cross-agency leak**: selects all onboarding_profiles |
| `reschedule_post` | reschedulePost | content_briefs (scheduled_publish_at). **Registry mismatch like schedule_post** | Yes |

### 4.B.2 System-prompt emission list (route.ts:1541)
`analyze_creator, generate_brief, refresh_data, export_report, navigate_creator, send_invite, nudge_creator, create_event, match_creators_to_event, generate_batch_briefs, approve_brief, schedule_post, reschedule_post, update_brief_status, log_performance`

### 4.B.3 Emission ↔ handler gaps
| Action | Emitted? | Handler? | Gap |
|---|---|---|---|
| `analyze_creator` | Yes | **No** | Chat-message only; no handler case |
| `generate_brief` | Yes | **No** | Handler case is `generate-brief` (hyphen); chat-message fallback |
| `refresh_data` | Yes | **No** | Client-side `window.location.reload()` |
| `navigate_creator` | Yes | **No** | Chat-message only |
| `export_report` | Yes | **No** | Frontend `alert("Export coming soon")` — registry marks `placeholder` (`intelligent-clay-registry.ts:141`) |
| `approve` / `reject` / `generate-brief` / `generate-recovery-brief` / `select-variant` / `upgrade` / `push_brief_to_creators` / `check_push_status` / `generate_report` | **Not listed** | Yes | Orphan handlers — reachable only via ActionButton constructed by components, never by LLM instruction |
| `acknowledge_alert` / `dismiss_alert` | **Not listed** | Yes | Fired by ProactiveAlertCard buttons baked into component data (`component-data-fetcher.ts:709`) |

## 4.C Silent-success & error-swallowing

| Location | Pattern | Severity |
|---|---|---|
| `action-handler.ts:601-603` | `} catch { // Table may not exist — that's fine }` → returns `{ success: true }` for `dismissAlert` | **Medium.** Any failure (auth, constraint, network) is discarded; operator sees "Alert acknowledged" without DB change |
| `action-handler.ts:675-681` | `send_invite` returns `ok(...)` after only upserting `agency_invites`. Comment: "Delivery pipeline ships in Turn 4" | **High** — feature appears to work; no email sent |
| `component-data-fetcher.ts:265-266, 279-281, 432-433, 436-437, 714-716, 822-830, 934-937` | Multiple `} catch { ... }` blocks with table-missing excuses — render empty/null | Medium — graceful but unlogged |
| `component-data-fetcher.ts:292` | `topFormats: ['Short-form', 'Educational', 'Story-driven']` — hardcoded | Cosmetic |
| `intelligent-clay-registry.ts:141` | `export_report` marked `placeholder` in registry | Known stub |

### Additional structural bugs
1. **`generate_batch_briefs` missing `agency_id`** on content_briefs insert (`action-handler.ts:896-908`). Reports keyed by agency_id will miss these briefs.
2. **`schedule_post` / `reschedule_post` table mismatch:** registry declares `targetTable='scheduled_actions'` (`intelligent-clay-registry.ts:247,271`), handler writes `content_briefs.scheduled_publish_at`. `scheduled_actions` never touched.
3. **`approveContentBrief` (case `approve_brief`) missing `agency_id` filter** (`action-handler.ts:638-642`).
4. **`generateReport` cross-agency leak** (`action-handler.ts:956`) — no `.eq('agency_id', ...)`.
5. **Inconsistent security model**: only 2 of 11+ write actions go through the proposal-gated tool path; 9+ write actions reach `action-handler.ts` via raw ActionButton HTTP POST without proposal verification.

## 4.D Intent classifier + renderer
Pipeline: `route.ts:1486` → `classifyIntent(msg, ctx)` → keyword match in `getComponentsForIntent` → role/tier gating → dedupe vs `recentComponents` → `Promise.allSettled(fetchComponentData)` → keep only non-empty → inject `## CLAY COMPONENTS READY` hint into system prompt → model renders references.

**Empty-state handling:** `component-renderer.tsx:52-130` renders a real card only when `data && Object.keys(data).length > 0`; otherwise a graceful empty-state card (`component-renderer.tsx:132-185`). **No fake data is fabricated at render time.** The one exception is `topFormats` (see 4.C).

## 4.E Clay component cards — data source verdicts
| Card | DB Source(s) | Verdict |
|---|---|---|
| `MorningBriefCard` | morning_briefs → pre_generated_briefs fallback | Real; fallback empty-state is a shell |
| `ContentBriefCard` | pre_generated_briefs + onboarding_profiles + brief_variants | Real |
| `CreatorProfileCard` | onboarding_profiles, agency_members, generated_scripts, content_briefs, memory_extractions, agencies | **Partially mocked** — `topFormats` static |
| `KPISummaryCard` | agency_members, generated_scripts, content_briefs, prediction_runs, agencies | Real |
| `TrendCard` | cultural_events → agency_events fallback | Real |
| `PerformanceTimelineCard` | agency_members, onboarding_profiles, generated_scripts | Real |
| `MomentumDecayCard` | agency_members, prediction_runs, onboarding_profiles | Real |
| `TrainerResultCard` | training_experiments, model_variants | Real |
| `ProactiveAlertCard` | chairman_alerts | Real; silent-null on catch |
| `NetworkInsightCard` | network_insights | Real |
| `MemoryFactCard` | memory_extractions (tier='hot') | Real |
| `CalendarSnippetCard` | scheduled_actions, pre_generated_briefs | Real — catch returns **zero-data card, not null** (masks table-missing) |
| `AgencyScorecardCard` | agencies, agency_members, generated_scripts, pre_generated_briefs, prediction_runs | Real |
| `ActionConfirmationCard` | — (reactive) | N/A |
| `VariantComparisonCard` | pre_generated_briefs, brief_variants | Real |

---

# STEP 5 — MEMORY LAYER

## 5.A Per-agency context: **BUILT**
- Canonical table: **`memory_extractions`** (`supabase/migrations/20260407_memory_system.sql:8-21`). Tiered hot/warm/cold, agency-scoped, with confidence + reference_count + supersession.
- Nightly LLM consolidation agent: `src/app/api/cron/consolidate-memory/route.ts` (~500 lines). Uses Gemini 2.5 Flash to merge/resolve contradictions, demotes stale facts after 90 days, enforces 2000-token hard cap on hot memory. Logs to `memory_consolidation_log`.
- `assembleContext()` injects hot memory into every LLM call: `src/lib/context/assemble-context.ts`.

## 5.B Per-creator context: **PARTIAL**
- `memory_extractions.creator_id` column (FK → auth.users) added in `20260407_context_assembly.sql:34-38`.
- Warm memory queried per-creator in `src/lib/context/assemble-context.ts:148-165` (`fetchWarmMemory()` filters `.eq('agency_id', ...).eq('creator_id', ...).eq('tier', 'warm')`).
- **Write path for creator-tagged warm facts is not confirmed.** Population is likely through the consolidation agent, but no explicit write path in the conversation extraction code was located.
- No dedicated `creator_notes` / `operator_notes` table.

## 5.C Clay cross-session continuity: **BUILT (24-hour window)**
- Table: `agency_conversations` (`20260401_agency_conversations.sql`) — stores the full message array as JSONB.
- Store: `src/lib/sessions/conversation-store.ts`
  - `loadActiveConversation()` returns the most recent active session if <24h old (line 87-88)
  - `saveConversation()` upserts after each exchange (line 47-57)
  - `loadRecentSessionSummaries()` can pull metadata from older sessions for context injection
- Wired at `src/app/agency/AgencyClient.tsx:770-795`: on mount, 5s race to load; if session <24h old, full message array restored; else fresh greeting.

**So:** within 24h = full message history persists across browser refresh. After 24h = fresh greeting; only `memory_extractions` hot facts carry context forward.

## 5.D MemoryFactCard — **real, data-backed**
- Component: `src/components/clay/MemoryFactCard.tsx`
- Fetcher: `src/lib/clay/component-data-fetcher.ts:747-777` — queries `memory_extractions` with `.eq('agency_id', ctx.agencyId).eq('tier', 'hot').order('created_at', { ascending: false }).limit(3)`.
- Registered at `src/lib/clay/component-renderer.tsx:107`.
- Links to `/agency/memory` for "View all".
- **Not mocked. Real substrate data.**

## 5.E Claude-code-style memory: **not used in project**
- No project-local `SKILL.md`, `memory/`, or `.claude/memory` files.
- `src/lib/memory/` contains only `agency-niches.ts` and `preload-agency-patterns.ts` — operational utilities.
- `CLAUDE.md` (project root) references the global user memory at `~/.claude/projects/C--Users-thoma/memory/` (outside repo).

---

# STEP 6 — SCHEMA DRIFT

## 6.A `nudge_sent_at` vs `last_nudged_at` vs `last_nudge_at`

| Location | Column | Source |
|---|---|---|
| Migration (content_briefs) | `last_nudged_at` | `20260417_phase1_action_scaffolding.sql:61` |
| Code `action-handler.ts` | `last_nudged_at` | lines 692, 698, 699, 712 |
| Code `overnight-triage.ts` | `last_nudged_at` | lines 119, 142 |
| Code `intelligent-clay-registry.ts` | `last_nudged_at` | line 181 |
| Doc AM-3 (line 68) | `last_nudged_at` | matches schema |
| **Doc OB-3 (line 138)** | `invitations.last_nudge_at` | **DIFFERENT NAME on NON-EXISTENT TABLE** |

**Verdict:** `content_briefs.last_nudged_at` is consistent schema↔code. The doc's OB-3 reference to `invitations.last_nudge_at` is doubly broken: wrong table name (`invitations` doesn't exist, real is `agency_invites`) and wrong column name (`last_nudge_at` vs `last_nudged_at`). The name `nudge_sent_at` appears nowhere in schema or code.

## 6.B `delivered_at` — resolved 2026-04-20
- Migration `20260420_add_delivered_at_to_content_briefs.sql:8` adds the column, backfilling `delivered_at = created_at` for existing `delivery_status='delivered'` rows.
- `overnight-triage.ts:114` comment acknowledges prior workaround: "we add a delivered_at column".
- `send-brief.ts:191` writes `delivered_at: new Date().toISOString()` at delivery time.
- **Status: RESOLVED.**

## 6.C `vps_prediction` vs `predicted_vps` — ACTIVE DUAL-COLUMN DRIFT
- `predicted_vps` NUMERIC(5,1) — `20260303_content_briefs.sql:11` (original)
- `vps_prediction` NUMERIC — `20260414_content_briefs_performance.sql:4` (new)

Both coexist on `content_briefs`. `/api/brief-performance/route.ts:44, :141` selects both. **No migration consolidates or deprecates either.** No single name is authoritative.

## 6.D `status` vs `completion_status` — DUAL STATUS FIELDS
- `status` (original, 20260303): Quick Win workflow (generated/accepted/recorded/...)
- `completion_status` (20260414): AM lifecycle (delivered/acknowledged/in_production/published)

New agency routes use `completion_status`. Legacy `status` is for Quick Win. Coexistence is documented but confusing. No consumer consolidation.

## 6.E `agencies.status` — code references non-existent column
- `/api/cron/autodream/route.ts:389` — `.select('id, name, tier, status')`
- `/api/cron/consolidate-memory/route.ts:454` — same
- `agencies` table has `is_active`, not `status`.
- **Impact:** query returns `status: null` silently. Not a crash, but the selector returns stale fiction.

## 6.F `agency_invitations` vs `agency_invites`
- `agency-chat/route.ts:457` queries `agency_invitations` (plural)
- `action-handler.ts:662` writes to `agency_invites` (singular)
- Only `agency_invites` exists in migrations. The plural query returns empty silently.

## 6.G `content_briefs` has no `agency_id`
- Table FK is only `user_id → auth.users`.
- RLS policy (`20260303:33-43`) allows only `auth.uid() = user_id`.
- All agency routes bypass RLS via service role and rely on derived `agency_id` from `onboarding_profiles` join.
- Result: **DB-level multi-tenancy for briefs is not enforced**; relies entirely on application-level scoping, which is inconsistent across routes (see Step 2.D).
- `agency-chat/route.ts:464` includes a `.eq('agency_id', agencyId)` filter against this column that doesn't exist. PostgreSQL will error or return empty depending on version/filter ordering. **AMBIGUOUS (needs live DB verification)** whether this always errors silently or silently drops rows.

---

# STEP 7 — ANTHROPIC LAYER MAP

| Anthropic Layer | Trendzo Equivalent | Verdict | Evidence |
|---|---|---|---|
| **Conversation (substrate)** | Creator Operations Graph | **PARTIAL** | Core tables present (`content_briefs`, `prediction_runs`, `onboarding_profiles`, `agency_conversations`, `memory_extractions`, `cultural_events`, `agencies`, `agency_members`). Missing: `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`. Three parallel creator tables. `content_briefs` lacks `agency_id`. |
| **Models** | DPS/VPS engine | **PARTIAL** | `src/lib/prediction/runPredictionPipeline.ts` ~900+ lines, writes `prediction_runs` + `run_component_results`. XGBoost inference at `src/lib/prediction/xgboost-inference.ts`. DPS v2 migration named `20260329_dps_v2_incomplete_columns.sql` — name signals active gap. SKILL-003 BLOCKED on SKILL-002 per doc dependency map. |
| **Skills** | Agent skills per niche/function | **NOT BUILT** (as Anthropic-SDK-loadable) | **Zero `SKILL.md` files in project tree.** SKILL-001..005 are inline code only. `.claude/skills/` symlinks are unrelated design skills (adapt, animate, etc.). |
| **Artifacts** | TrendzoCards + json-render components | **PARTIAL** | 16 clay components in `src/components/clay/` with real DB fetchers in `component-data-fetcher.ts`. Renderer dispatches via `@json-render/core`. Gap: artifact *generation* via Clay tool calls is largely unimplemented (only 4 tool endpoints). |
| **Projects** | Agency workspaces | **PARTIAL** | 76 `.eq('agency_id', ...)` occurrences across 30 files. MCP server enforces `ctx.agency_id` scoping. **But `content_briefs` has no `agency_id` column** — brief isolation relies on join + service role. Multiple API routes take `agency_id` from caller input without session binding (Step 2.D). |
| **Memory** | Persistent cross-session context | **PARTIAL** | Agency-level hot/warm/cold memory BUILT, with nightly consolidation cron. Per-creator warm-fact write path unconfirmed. Clay session restore is 24h only; beyond 24h only memory facts carry context. |
| **MCP** | External tool integrations | **PARTIAL** | `src/mcp-server/` has full stdio server via `@modelcontextprotocol/sdk` + auth + rate limit + 5 tools. `mcp_api_keys` + `mcp_call_log` in schema (`20260411_prompt43_mcp.sql`). Not HTTP-deployed; requires manual `claude mcp add` registration. |
| **Managed Agents** | Autonomous agency agents | **PARTIAL** | Nightly Memory Keeper (`/api/cron/consolidate-memory`) is a real LLM agent with self-scheduling. Hourly `process-scheduled-actions`. `autodream`, `cultural-scan`, `training-pipeline`, `classify-events` routes exist but **NOT scheduled in `vercel.json`**. Critical agency-facing auto-behaviors (AM-3, OB-3, PM-5) NOT BUILT. |
| **Multi-agent** | Agency Swarm | **NOT BUILT** | All "orchestrator" hits in `src/lib/` are single-pipeline coordinators (`kai-orchestrator.ts` = prediction pipeline; `bandit/orchestrator.ts` = UCB1 A/B allocator; `coordinator/handlers/*` = handler dispatcher). Zero matches for agent-to-agent swarm topology. |

### Off-substrate check
No layer above reads/writes outside the Creator Operations Graph in a way that conflicts with the compound-startup thesis. The closest off-substrate feature is the XGBoost training pipeline (`src/app/api/cron/training-pipeline/*`), which is cleanly partitioned (it writes `training_experiments`, `model_variants`, `s6_training_experiments` — these ARE substrate tables but live in a separate sub-graph from creator operations).

---

# APPENDIX — The 10 most load-bearing issues for the founder

1. **Five tables the arch doc names simply do not exist.** `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`. Every "AI employee" feature that depends on them (TS-2, TS-4, PA-3, PA-4, PM-5) is paper only.

2. **Three parallel creator tables** — `creators` (admin), `creator_profiles` (prediction), `onboarding_profiles` (canonical). No synchronization. Depending on which surface an operator uses, they see different creator lists.

3. **`content_briefs` has no `agency_id` column.** The brief is the spine of the lifecycle. Multi-tenancy is enforced in application code only, and three routes bypass it entirely without auth (see #4).

4. **Three brief-mutating routes are unauthenticated service-role endpoints** — `/api/brief-status`, `/api/brief-performance`, `/api/brief-acknowledge`. Any internet caller can advance/poison brief state for any agency. `/api/invites` GET returns all tenants' invites if no header is supplied.

5. **Only 2 write-action Clay tool pairs exist** (`nudge_creator`, `update_brief_status`). Every other "action" the system prompt advertises reaches the handler via an ActionButton HTTP POST with no proposal gate. The security model is inconsistent; 9+ write actions are outside the propose/verify flow.

6. **`send_invite` is a silent stub** — the invite row is written but no email is sent. The comment says "Email delivery pipeline ships in Turn 4." Operators see confirmation. Creator sees nothing.

7. **`dismissAlert` swallows all errors** and always returns `success: true`. If the table write fails for any reason, the operator sees "Alert acknowledged" and nothing changed.

8. **Cron gap** — `vercel.json` schedules only 3 crons (recency-decay weekly, freedom-agent weekly-checkin, atlas/feedback-collector every 6h). `autodream`, `cultural-scan`, `classify-events`, `training-pipeline`, `consolidate-memory` all exist as routes but **are not scheduled**. The "autonomous" agency is running almost no autonomy.

9. **SKILL-001 is overstated as "BUILT".** The implementation is a 32-element character-frequency hash, not a 58-feature fingerprint. SKILL-002..005 are BLOCKED or NOT BUILT. Zero `SKILL.md` files exist — no packaged-skill deployment model.

10. **Stubbed operator-facing dashboards.** `AccuracyView`, `MomentumView`, `RankView`, `RevenueView`, `TrendsView` all carry TODOs and several use `Math.random()` to fabricate numbers shown to operators. `trends/page.tsx:72` generates random velocity values in a server component. `topFormats` in `CreatorProfileCard` is always the same three-item list regardless of creator.

---

**End of audit.** Document: `C:\Projects\CleanCopy\SUBSTRATE_AUDIT_2026-04-21.md`
