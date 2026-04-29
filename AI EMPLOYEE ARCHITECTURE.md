# TRENDZO — AI EMPLOYEE ARCHITECTURE
## The Build Bible
**Date:** April 14, 2026 | **Version:** 1.0 | **Status:** LOCKED REFERENCE

> **Schema source of truth is `supabase/migrations/`. If this doc conflicts with the actual schema, the schema wins. Audit before referencing columns.**

---

## CORE PRINCIPLE

Two UIs. Full parity. Different interaction models. Same engine underneath.

**Intelligent Clay** (`/agency`) — Conversational. Operator speaks or types, the system acts and renders dynamically. This is the flagship. This is what makes VCs lose their minds.

**Traditional Dashboard** (`/agency/dashboard`) — Click-based. Same workflows, same data, same capabilities. Buttons, dropdowns, tables, cards. Familiar UX for operators who prefer it.

**The rule:** If it can be done in one UI, it can be done in the other. No exceptions. No features that only exist in one place.

---

## THE LIFECYCLE

```
ONBOARD → PROFILE → BRIEF → DELIVER → PRODUCE → PUBLISH → MEASURE → COACH → REPEAT
```

Every AI employee owns a segment of this lifecycle. Every segment has defined triggers, actions, and outputs. Every action works in both UIs.

---

## AI EMPLOYEE 1: ACCOUNT MANAGER

**Owns:** Brief delivery → Creator response → Production tracking → Publication confirmation

**What this replaces:** The human who sends briefs to creators, follows up when they don't respond, checks if content is being produced, and confirms when it's published.

### Workflows

#### AM-1: Brief Delivery
| | Detail |
|---|---|
| **Trigger** | Operator approves a brief (in Clay or Dashboard) |
| **Action** | System automatically emails the brief to the creator |
| **Clay UX** | "Approve Jake's brief" → "Done. Brief delivered to jake@email.com at 2:14 PM" |
| **Dashboard UX** | Approve button on brief card → green "Delivered" badge appears → timestamp logged |
| **DB writes** | `content_briefs.delivery_status` → `delivered`, `content_briefs.delivered_at` → timestamp |
| **Failure handling** | If email fails: status → `failed`, operator alerted. Retry available in both UIs. |
| **Status:** | **BUILT (B1)** — nodemailer/Gmail SMTP working |

#### AM-2: Acknowledgment Tracking
| | Detail |
|---|---|
| **Trigger** | Creator opens/clicks acknowledgment link in brief email |
| **Action** | System records acknowledgment, updates brief status |
| **Clay UX** | Operator asks "Any unacknowledged briefs?" → Clay shows list with time-since-delivery |
| **Dashboard UX** | Brief cards show Acknowledged/Pending badge. Filter by status. |
| **DB writes** | `content_briefs.completion_status` → `acknowledged`, `content_briefs.acknowledged_at` → timestamp |
| **Status:** | **PARTIALLY BUILT (B2)** — DB columns exist, manual buttons exist in Dashboard. NOT wired as Clay tool call. No creator-facing acknowledgment link in email. |

#### AM-3: Non-Response Follow-Up
| | Detail |
|---|---|
| **Trigger** | 24 hours after delivery with no acknowledgment |
| **Action** | System auto-sends follow-up nudge email to creator |
| **Clay UX** | "Luna hasn't acknowledged her brief in 26 hours. Nudge sent automatically. Want to call her instead?" |
| **Dashboard UX** | Brief card shows amber "Nudge Sent" badge with timestamp |
| **Escalation** | If no response 48 hours after nudge → operator alerted for manual intervention |
| **DB writes** | `content_briefs.last_nudged_at` → timestamp, `content_briefs.nudge_count` → increment |
| **Status:** | **NOT BUILT** |

#### AM-4: Production Status Tracking
| | Detail |
|---|---|
| **Trigger** | Creator updates status, OR operator updates on their behalf |
| **Action** | Brief moves through: Delivered → Acknowledged → In Production → Published |
| **Clay UX** | "Mark Jake's GLP-1 brief as in production" → done. "What's in production right now?" → shows list. |
| **Dashboard UX** | Status dropdown on each brief card. Kanban view option (columns = statuses). |
| **DB writes** | `content_briefs.completion_status` → new status, corresponding timestamp column |
| **Status:** | **PARTIALLY BUILT (B2)** — DB columns + manual Dashboard buttons exist. NOT wired as Clay tool call. |

#### AM-5: Publication Confirmation
| | Detail |
|---|---|
| **Trigger** | Creator pastes published URL, OR operator logs it, OR (future) TikTok API auto-detects |
| **Action** | Brief marked as published. Performance measurement loop activates. |
| **Clay UX** | "Log Luna's video — published at [URL]" → "Got it. VPS prediction was 42K. I'll track actuals and report back." |
| **Dashboard UX** | "Mark Published" button with URL input field on brief card. |
| **DB writes** | `content_briefs.completion_status` → `published`, `content_briefs.published_at` → timestamp, `content_briefs.published_url` → URL |
| **Status:** | **PARTIALLY BUILT (B2)** — DB columns exist. Dashboard has manual input. NOT wired as Clay tool call. |

### Account Manager — Build Gaps Summary
| Workflow | DB Schema | API Route | Dashboard UI | Clay Tool Call | Auto-Trigger |
|---|---|---|---|---|---|
| AM-1 Brief Delivery | ✅ | ✅ | ✅ | ❌ | ✅ (on approve) |
| AM-2 Acknowledgment | ✅ | ✅ | ✅ (manual only) | ❌ | ❌ (no creator link) |
| AM-3 Non-Response | ❌ | ❌ | ❌ | ❌ | ❌ |
| AM-4 Production Tracking | ✅ | ✅ | ✅ (manual only) | ❌ | ❌ |
| AM-5 Publication | ✅ | ✅ | ✅ (manual only) | ❌ | ❌ |

---

## AI EMPLOYEE 2: ONBOARDING SPECIALIST

**Owns:** Creator invitation → Account creation → Profile building → Fingerprint generation → Active roster entry

**What this replaces:** The human who sends welcome emails, walks new creators through setup, follows up when they stall, and manually builds creator profiles.

### Workflows

#### OB-1: Creator Invitation
| | Detail |
|---|---|
| **Trigger** | Operator invites a new creator (in Clay or Dashboard) |
| **Action** | System sends invitation email with signup link. Invitation tracked in DB. |
| **Clay UX** | "Invite jake@email.com — he's a fitness creator with 50K followers" → "Invitation sent. I'll track his onboarding and alert you if he stalls." |
| **Dashboard UX** | "Invite Creator" button → email input + optional notes → sends invitation |
| **DB writes** | `invitations` table — email, status, invited_at, agency_id |
| **Status:** | **NOT BUILT** — invitations table may exist in schema but no create/send path |

#### OB-2: Onboarding Progress Tracking
| | Detail |
|---|---|
| **Trigger** | Creator clicks invitation link and begins signup |
| **Action** | System tracks each onboarding step: Account Created → Profile Started → Content Linked → Fingerprint Generated → Active |
| **Clay UX** | "How's Jake's onboarding going?" → "He created his account 2 days ago but hasn't linked his TikTok yet. Step 3 of 5." |
| **Dashboard UX** | Onboarding pipeline view — creators in columns by stage. Progress bar per creator. |
| **DB writes** | Creator profile fields populated progressively. Onboarding stage field updated. |
| **Status:** | **NOT BUILT** — pipeline is read-only surface per Section 4 of capability audit |

#### OB-3: Stall Detection & Auto-Nudge
| | Detail |
|---|---|
| **Trigger** | Creator has been at the same onboarding stage for 48+ hours |
| **Action** | System auto-sends nudge email specific to their stalled stage |
| **Clay UX** | "2 creators stalled in onboarding. Marcus hasn't linked TikTok (3 days). Sent nudge #2 yesterday. Recommend manual outreach." |
| **Dashboard UX** | Amber "Stalled" badge on onboarding pipeline cards. Nudge history visible on hover. |
| **Escalation** | After 2 auto-nudges with no progress → operator flagged for manual intervention |
| **DB writes** | `invitations.nudge_count`, `invitations.last_nudge_at`, `invitations.nudge_stage` |
| **Status:** | **NOT BUILT** |

#### OB-4: Auto-Profiling
| | Detail |
|---|---|
| **Trigger** | Creator links their TikTok account during onboarding |
| **Action** | System runs SKILL-001 (Creator Profiling) automatically — analyzes existing content, builds 58-feature fingerprint, calculates DPS baseline, determines staging path |
| **Clay UX** | "Jake just completed onboarding. His fingerprint shows strong hook retention but weak audience clarity. Staging path: Audience-First. Ready for his first brief." |
| **Dashboard UX** | Creator card appears in roster with full profile, scores, and staging path. No manual data entry. |
| **DB writes** | Full creator profile record. Fingerprint. DPS baseline. Staging path. |
| **Status:** | **NOT BUILT** as automated flow — SKILL-001 exists but must be triggered manually |

### Onboarding Specialist — Build Gaps Summary
| Workflow | DB Schema | API Route | Dashboard UI | Clay Tool Call | Auto-Trigger |
|---|---|---|---|---|---|
| OB-1 Invitation | Partial | ❌ | ❌ | ❌ | ❌ |
| OB-2 Progress Tracking | ❌ | ❌ | ❌ (read-only surface) | ❌ | ❌ |
| OB-3 Stall & Nudge | ❌ | ❌ | ❌ | ❌ | ❌ |
| OB-4 Auto-Profiling | Partial (SKILL-001) | ❌ | ❌ | ❌ | ❌ |

---

## AI EMPLOYEE 3: TREND SCOUT / CONTENT STRATEGIST

**Owns:** Cultural signal monitoring → Trend-to-creator matching → Auto-brief generation → Real-time alerts

**What this replaces:** The human who scrolls TikTok for 3 hours a day looking for trends, then manually figures out which creators should jump on which trends, then writes briefs from scratch.

### Workflows

#### TS-1: Continuous Trend Monitoring
| | Detail |
|---|---|
| **Trigger** | Scheduled — runs on interval (every 1-6 hours depending on config) |
| **Action** | System scans cultural signals (TikTok trending, Reddit, X, news) and scores emerging trends by velocity, relevance to agency's creator niches, and predicted window of opportunity |
| **Clay UX** | Morning briefing includes: "3 trends spiking in your niches overnight. Fitness: GLP-1 shortage panic (velocity: high, window: 48hrs). Finance: Fed rate speculation (velocity: medium, window: 5 days)." |
| **Dashboard UX** | Trend Radar page shows real-time trend cards sorted by velocity + relevance score. Niche filters. |
| **DB writes** | `cultural_events` or equivalent trend table — topic, velocity, niche_tags, detected_at, predicted_window |
| **Status:** | **PARTIAL** — cultural events exist in DB, trend radar page exists but uses placeholder data. No continuous scanning. mvanhorn/last30days-skill identified for this but not integrated. |

#### TS-2: Trend-to-Creator Matching
| | Detail |
|---|---|
| **Trigger** | New trend detected with relevance to one or more creator niches |
| **Action** | System matches trend to specific creators based on their fingerprint, niche, and performance history. Generates match confidence score. |
| **Clay UX** | "The GLP-1 trend matches 3 of your creators: Luna (92% match — she's done health content before), Jake (71% match — adjacent niche), Marcus (45% match — stretch but his audience skews health-curious)." |
| **Dashboard UX** | Trend cards have "Matched Creators" section showing creator avatars + match scores |
| **DB writes** | `trend_creator_matches` — trend_id, creator_id, match_score, match_reason |
| **Status:** | **NOT BUILT** |

#### TS-3: Auto-Brief Generation from Trends
| | Detail |
|---|---|
| **Trigger** | High-confidence trend-creator match (above operator-configured threshold), OR operator requests brief from trend |
| **Action** | System auto-generates draft brief using creator's fingerprint + trend data + adversarial evaluation. Operator reviews. |
| **Clay UX** | "I've drafted a GLP-1 brief for Luna based on the trending topic. VPS prediction: 38K views. Want to review it?" → renders brief card in conversation |
| **Dashboard UX** | Draft brief appears in review queue with "Trend-Generated" tag and source trend linked |
| **DB writes** | `draft_briefs` — standard brief row with trend_id reference |
| **Status:** | **PARTIAL** — batch brief generation exists with cultural events, but not real-time trend-triggered. Brief generation uses Gemini 2.5 Flash and works. Missing: real-time trigger + trend-creator matching. |

#### TS-4: Creator-Facing Trend Alerts
| | Detail |
|---|---|
| **Trigger** | Trend matched to creator AND operator has auto-alert enabled for that creator |
| **Action** | Creator receives in-app notification or email: "Trending now in your niche: [topic]. Your agency has a brief ready — check your dashboard." |
| **Clay UX** | "Auto-alerts sent to Luna and Jake about the GLP-1 trend. Briefs are in their queues." |
| **Dashboard UX** | Alert log showing which creators were notified about which trends, with timestamps |
| **DB writes** | `creator_alerts` — creator_id, trend_id, alert_type, sent_at |
| **Status:** | **NOT BUILT** — requires creator-facing portal (currently a stub) |

### Trend Scout — Build Gaps Summary
| Workflow | DB Schema | API Route | Dashboard UI | Clay Tool Call | Auto-Trigger |
|---|---|---|---|---|---|
| TS-1 Trend Monitoring | Partial | ❌ (no scan job) | Partial (placeholder data) | ❌ | ❌ |
| TS-2 Creator Matching | ❌ | ❌ | ❌ | ❌ | ❌ |
| TS-3 Auto-Brief from Trend | Partial | Partial (batch exists) | Partial (review queue) | ❌ | ❌ |
| TS-4 Creator Alerts | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## AI EMPLOYEE 4: PERFORMANCE ANALYST

**Owns:** Data capture → Prediction vs actual → Trend analysis → Coaching feedback → Reporting

**What this replaces:** The human who manually pulls TikTok analytics, compares them to goals, writes performance summaries in spreadsheets, and records Loom videos explaining what worked and what didn't (15-30 hours/week at scale).

### Workflows

#### PA-1: Performance Data Capture
| | Detail |
|---|---|
| **Trigger** | Video published + measurement window elapsed (24hr, 48hr, 7-day checkpoints) |
| **Action** | System captures actual performance metrics — views, engagement rate, shares, comments. Initially manual input; future: TikTok API auto-pull. |
| **Clay UX** | "Log 50,000 views and 4.2% engagement on Luna's GLP-1 video" → "Logged. VPS predicted 38K — she outperformed by 32%. Nice." |
| **Dashboard UX** | Performance input on published brief cards. Or bulk performance log view for entering multiple at once. |
| **DB writes** | `content_briefs.actual_views`, `content_briefs.actual_engagement_rate`, `content_briefs.performance_delta`, `content_briefs.performance_measured_at` |
| **Status:** | **PARTIALLY BUILT (B3)** — DB columns exist. Manual Dashboard input exists. NOT wired as Clay tool call. |

#### PA-2: Prediction vs Actual Analysis
| | Detail |
|---|---|
| **Trigger** | Performance data captured for a brief |
| **Action** | System compares VPS prediction to actual, calculates delta, identifies contributing factors from the creator's fingerprint and content attributes |
| **Clay UX** | "Luna outperformed by 32%. Contributing factors: she used a declarative hook (her strongest pattern), posted during peak engagement window, and the topic had high velocity. Her question-style hooks underperform by 40% — this confirms the pattern." |
| **Dashboard UX** | Performance card on brief shows predicted vs actual with visual delta indicator (green up / red down). Expandable analysis section. |
| **DB writes** | `content_briefs.performance_delta`, analysis stored (format TBD) |
| **Status:** | **PARTIALLY BUILT (B3)** — delta calculation exists. No factor analysis. No Clay tool. |

#### PA-3: Weekly Performance Reports
| | Detail |
|---|---|
| **Trigger** | Scheduled — weekly (configurable day/time) |
| **Action** | System generates comprehensive performance report per agency: briefs delivered, acknowledged, published, performance vs predictions, top performer, biggest miss, trend in prediction accuracy, recommended adjustments |
| **Clay UX** | Monday morning: "Here's your weekly performance report. 12 briefs delivered, 9 published. Average performance: +14% above prediction. Top performer: Luna's GLP-1 video (+32%). Biggest miss: Jake's fitness video (-28% — posted outside optimal window). Your prediction accuracy improved 3% this week." |
| **Dashboard UX** | Weekly report card in dashboard. Downloadable/exportable. Historical comparison. |
| **DB writes** | `performance_reports` — report data, generated_at, period_start, period_end |
| **Status:** | **NOT BUILT** |

#### PA-4: Coaching Feedback Generation
| | Detail |
|---|---|
| **Trigger** | Performance data captured, OR on-demand from operator, OR scheduled per-creator cadence |
| **Action** | System generates personalized coaching feedback for each creator based on their fingerprint, recent performance, and identified patterns. Replaces manual Loom recordings. |
| **Clay UX** | "Generate feedback for Jake" → "Jake's last 5 videos averaged 22K views (down 15% from his 30-day average). Primary issue: his hooks have shifted from declarative to question-style, which his audience responds to 40% less. His posting consistency dropped — 2 videos last week vs his 4-video average. Recommendation: return to declarative hooks, increase posting cadence. Want me to send this to Jake?" |
| **Dashboard UX** | Feedback tab per creator showing latest feedback, historical feedback, trend indicators |
| **DB writes** | `creator_feedback` — creator_id, feedback_content, feedback_type, generated_at, delivered_at |
| **Status:** | **NOT BUILT** — SKILL-005 (Feedback Generation) identified but blocked on SKILL-002 |

#### PA-5: Model Feedback Loop
| | Detail |
|---|---|
| **Trigger** | Every prediction vs actual comparison |
| **Action** | Data fed back into XGBoost VPS model training pipeline. Over time, predictions improve per creator, per niche, per content type. |
| **Clay UX** | Operator doesn't see this directly — it's infrastructure. But they see: "Your prediction accuracy has improved 12% over the last 30 days across your roster." |
| **Dashboard UX** | Accuracy trend chart on performance overview. Model confidence indicators on future predictions. |
| **DB writes** | Training data tables for XGBoost pipeline |
| **Status:** | **NOT BUILT** — accuracy tracking view exists but not wired to real pipeline per capability audit |

### Performance Analyst — Build Gaps Summary
| Workflow | DB Schema | API Route | Dashboard UI | Clay Tool Call | Auto-Trigger |
|---|---|---|---|---|---|
| PA-1 Data Capture | ✅ | ✅ | ✅ (manual) | ❌ | ❌ |
| PA-2 Pred vs Actual | Partial | Partial | Partial | ❌ | ❌ |
| PA-3 Weekly Reports | ❌ | ❌ | ❌ | ❌ | ❌ |
| PA-4 Coaching Feedback | ❌ | ❌ | ❌ | ❌ | ❌ |
| PA-5 Model Loop | ❌ | ❌ | ❌ (placeholder) | ❌ | ❌ |

---

## AI EMPLOYEE 5: PROJECT MANAGER / COORDINATOR

**Owns:** Production deadlines → Schedule optimization → Post timing → Calendar management → Automated reminders

**What this replaces:** The human who tracks where every piece of content is in the production pipeline, sends reminder DMs, manages the posting calendar, and makes sure nothing falls through the cracks.

### Workflows

#### PM-1: Production Pipeline Overview
| | Detail |
|---|---|
| **Trigger** | Always running — real-time view of all active briefs across all creators |
| **Action** | System maintains pipeline view: Draft → Approved → Delivered → Acknowledged → In Production → Ready for Review → Published |
| **Clay UX** | "What's my pipeline look like?" → "You have 14 active briefs. 3 awaiting approval. 2 delivered but unacknowledged (Luna: 18hrs, Marcus: 6hrs). 5 in production. 4 published this week." |
| **Dashboard UX** | Kanban board — columns are pipeline stages. Cards are briefs. Drag-and-drop optional. Filters by creator, date, status. |
| **DB writes** | Reads from `content_briefs` status fields — no new writes needed |
| **Status:** | **PARTIALLY BUILT** — status fields exist. Dashboard shows status badges. No kanban view. No Clay tool for pipeline queries. |

#### PM-2: Deadline Management
| | Detail |
|---|---|
| **Trigger** | Brief created with expected production timeline (based on historical creator pace or operator-set deadline) |
| **Action** | System tracks against deadline. Sends creator reminders at configurable intervals before deadline. Alerts operator when deadline passes. |
| **Clay UX** | "Jake's fitness brief is due tomorrow and he hasn't started production. Want me to send a reminder?" |
| **Dashboard UX** | Due date indicators on brief cards. Overdue = red. Due soon = amber. On track = green. |
| **DB writes** | `content_briefs.deadline`, `content_briefs.reminder_sent_at` |
| **Status:** | **NOT BUILT** |

#### PM-3: Optimal Posting Time
| | Detail |
|---|---|
| **Trigger** | Content ready for publish, OR operator asks for scheduling recommendation |
| **Action** | System recommends optimal posting time based on creator's audience engagement patterns, day of week, competing content volume |
| **Clay UX** | "When should Luna post her GLP-1 video?" → "Based on her audience patterns, Tuesday 6-8 PM EST is her highest engagement window. Avoid Thursday — her niche is saturated on Thursdays." |
| **Dashboard UX** | Schedule suggestion displayed on ready-to-publish brief cards. Calendar view showing recommended slots. |
| **DB writes** | `content_briefs.recommended_post_time`, `content_briefs.scheduled_post_time` |
| **Status:** | **NOT BUILT** — calendar widgets exist but are read-only with no scheduling logic |

#### PM-4: Post Scheduling (Future — TikTok API)
| | Detail |
|---|---|
| **Trigger** | Operator approves scheduled time, OR auto-schedule enabled |
| **Action** | System schedules post directly through TikTok API or third-party scheduler (Publer). Content uploaded, caption set, publish time locked. |
| **Clay UX** | "Schedule Luna's video for Tuesday 7 PM" → "Scheduled. I'll confirm when it goes live and start tracking performance." |
| **Dashboard UX** | Calendar with scheduled posts. Drag to reschedule. Click to preview. |
| **DB writes** | `scheduled_posts` — creator_id, brief_id, platform, scheduled_time, status |
| **Status:** | **NOT BUILT** — requires TikTok API integration or third-party scheduler |

#### PM-5: Automated Chase Sequences
| | Detail |
|---|---|
| **Trigger** | Creator goes silent at any pipeline stage for configurable duration |
| **Action** | Escalating outreach: Auto-nudge → Follow-up → Operator alert → Flag for manual intervention |
| **Clay UX** | "Marcus has been unresponsive for 5 days across 2 briefs. I've sent 2 nudges. Flagging for your direct outreach." |
| **Dashboard UX** | "At Risk" section showing creators with stalled production and chase history |
| **DB writes** | `chase_log` — creator_id, brief_id, chase_type, sent_at, response_received |
| **Status:** | **NOT BUILT** |

### Project Manager — Build Gaps Summary
| Workflow | DB Schema | API Route | Dashboard UI | Clay Tool Call | Auto-Trigger |
|---|---|---|---|---|---|
| PM-1 Pipeline Overview | ✅ (status fields) | Partial | Partial (badges only) | ❌ | N/A (read) |
| PM-2 Deadlines | ❌ | ❌ | ❌ | ❌ | ❌ |
| PM-3 Posting Time | ❌ | ❌ | ❌ | ❌ | ❌ |
| PM-4 Post Scheduling | ❌ | ❌ | ❌ | ❌ | ❌ |
| PM-5 Chase Sequences | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## BUILD PRIORITY MATRIX

Based on dependency sequencing and what already exists:

### PHASE 1: Complete the Account Manager (highest leverage — unlocks everything)

**Build 1A:** Wire existing AM workflows as Clay tool calls
- `get_briefs_by_status` — query briefs filtered by status
- `update_brief_completion_status` — change a brief's status
- `log_brief_performance` — record actual performance data
- `get_performance_summary` — aggregate performance view
- These API routes already exist. DB columns already exist. This is pure wiring.

**Build 1B:** Creator acknowledgment link
- Brief emails include a one-click acknowledgment link
- When creator clicks it, `completion_status` → `acknowledged` automatically
- No manual button-clicking by operator

**Build 1C:** Non-response auto-nudge
- Supabase scheduled function checks for unacknowledged briefs > 24hrs
- Auto-sends follow-up email
- Logs nudge in DB

### PHASE 2: Onboarding Specialist

**Build 2A:** Creator invitation flow
- API route to create invitation + send email
- Clay tool: "Invite [email] as a [niche] creator"
- Dashboard UI: Invite button + form

**Build 2B:** Onboarding progress tracking
- Stage field on creator profiles
- Pipeline view in Dashboard
- Clay can query: "Who's stalled in onboarding?"

**Build 2C:** Auto-nudge for stalled onboarding
- Same pattern as AM nudges — scheduled function + email

**Build 2D:** Auto-profiling on TikTok link
- When creator connects TikTok, SKILL-001 runs automatically
- Profile, fingerprint, staging path generated without operator intervention

### PHASE 3: Trend Scout (this is what makes creators log in daily)

**Build 3A:** Cultural signal scanning job
- Scheduled function that scans sources on interval
- Writes detected trends to DB with velocity + niche tags
- Adapt mvanhorn/last30days-skill

**Build 3B:** Trend-to-creator matching
- When new trend detected, match against active creators' fingerprints
- Generate match scores + reasons

**Build 3C:** Auto-brief generation from high-confidence matches
- Above operator-set threshold → auto-generate draft brief
- Below threshold → surface trend for operator review

### PHASE 4: Performance Analyst

**Build 4A:** Prediction vs actual analysis
- When performance data logged, auto-generate contributing factor analysis
- Compare against creator fingerprint patterns

**Build 4B:** Weekly performance reports
- Scheduled — generates comprehensive report per agency
- Delivered in Clay morning briefing + Dashboard card

**Build 4C:** Coaching feedback generation
- Per-creator feedback based on performance patterns
- Replaces manual Loom recordings
- Requires SKILL-005

### PHASE 5: Project Manager / Coordinator

**Build 5A:** Pipeline kanban view (Dashboard)
- Visual pipeline of all active briefs across stages
- Clay equivalent: "Show me my pipeline" → structured pipeline view

**Build 5B:** Deadline management + reminders
- Due dates on briefs + automated reminder sequences

**Build 5C:** Optimal posting time recommendations
- Based on creator audience patterns + historical data

**Build 5D:** Post scheduling integration (TikTok API or Publer)
- System schedules posts directly

---

## TOOL CALL REGISTRY

Every action that can be performed must exist as a tool call in the agency-chat API. This is the master list. Each tool must be registered in `/api/agency-chat` following the existing tool pattern.

### Account Manager Tools
| Tool Name | Description | API Route | Priority |
|---|---|---|---|
| `get_briefs_by_status` | Query briefs filtered by delivery/completion status | `/api/brief-status` | BUILD NOW |
| `update_brief_status` | Update a brief's completion status | `/api/brief-status` | BUILD NOW |
| `log_performance` | Record actual views/engagement for a published brief | `/api/brief-performance` | BUILD NOW |
| `get_performance_summary` | Aggregate performance across briefs/creators | `/api/brief-performance` | BUILD NOW |
| `send_brief_nudge` | Manually trigger follow-up to creator | TBD | Phase 1C |

### Onboarding Tools
| Tool Name | Description | API Route | Priority |
|---|---|---|---|
| `invite_creator` | Send invitation email to new creator | TBD | Phase 2A |
| `get_onboarding_status` | Query creators by onboarding stage | TBD | Phase 2B |
| `nudge_stalled_creator` | Send onboarding nudge | TBD | Phase 2C |

### Trend Scout Tools
| Tool Name | Description | API Route | Priority |
|---|---|---|---|
| `get_trending_topics` | Query current trending topics by niche | TBD | Phase 3A |
| `get_trend_matches` | Show creator matches for a specific trend | TBD | Phase 3B |
| `generate_trend_brief` | Create brief from trend + creator match | TBD | Phase 3C |

### Performance Analyst Tools
| Tool Name | Description | API Route | Priority |
|---|---|---|---|
| `analyze_performance` | Detailed pred vs actual with factors | TBD | Phase 4A |
| `get_weekly_report` | Generate/retrieve weekly performance report | TBD | Phase 4B |
| `generate_feedback` | Create coaching feedback for a creator | TBD | Phase 4C |

### Project Manager Tools
| Tool Name | Description | API Route | Priority |
|---|---|---|---|
| `get_pipeline_status` | Full pipeline view across all creators/briefs | TBD | Phase 5A |
| `set_deadline` | Assign deadline to a brief | TBD | Phase 5B |
| `recommend_post_time` | Get optimal posting window for a creator | TBD | Phase 5C |
| `schedule_post` | Schedule a post for publishing | TBD | Phase 5D |

---

## IMPLEMENTATION RULES

1. **Every new capability must work in both UIs before it's considered done.** Clay tool call + Dashboard UI element. No exceptions.

2. **Clay tool calls connect to the same API routes that the Dashboard uses.** One backend, two frontends.

3. **The Dashboard never requires Clay to function. Clay never requires the Dashboard to function.** They are independent interfaces to the same engine.

4. **Auto-triggers (scheduled functions, event-driven actions) run regardless of which UI the operator is using.** They're backend operations.

5. **Every build prompt for Cursor must specify both UI implementations.** If it only mentions one, it's incomplete.

6. **Test in both UIs after every build.** If it works in Dashboard but not Clay (or vice versa), the build is not done.

---

## DEPENDENCIES MAP

```
SKILL-001 (Creator Profiling) ← BUILT
    ↓
SKILL-002 (Video Fingerprinting) ← BLOCKED on input interview
    ↓
SKILL-003 (DPS/VPS Scoring) ← BLOCKED on SKILL-002
    ↓
SKILL-004 (Brief Generation) ← BLOCKED on SKILL-002 + SKILL-003
    ↓
SKILL-005 (Feedback Generation) ← BLOCKED on SKILL-001 (can start after SKILL-002)

Account Manager (Phase 1) ← CAN START NOW — routes + schema exist
    ↓
Onboarding Specialist (Phase 2) ← after Phase 1
    ↓
Trend Scout (Phase 3) ← after Phase 2 (independent of skill chain)
    ↓
Performance Analyst (Phase 4) ← after Phase 1 data accumulates + SKILL-005
    ↓
Project Manager (Phase 5) ← after Phases 2 + 3
```

---

## THIS DOCUMENT IS THE SOURCE OF TRUTH

Every future build session references this document. Every Cursor prompt checks against this document. If a capability isn't mapped here, it doesn't get built until it's added here first.

Drop this into the Trendzo Claude Project. Reference it in every chat.