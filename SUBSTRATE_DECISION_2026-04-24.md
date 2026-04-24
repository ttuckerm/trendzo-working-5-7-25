# SUBSTRATE DECISION — Trendzo Platform Architecture

**Date:** 2026-04-24
**Status:** CANONICAL. Supersedes any prior substrate claim.
**Author:** Tommy Tucker (Chairman)

---

## 1. The Substrate Is The Conversation

The substrate of the Trendzo platform is the conversation.

The conversation is the only primitive that touches every user layer: Chairman,
Sub-Admins, Agency/Operators, Associates, Clients, and Free Users. Every role
interacts with the platform through conversation as the primary surface. Every
capability the platform exposes — brief generation, creator profiling, DPS/VPS
scoring, performance feedback, scheduling, onboarding, trend matching —
renders inside the conversation.

Traditional Dashboards exist in parallel as click-based surfaces for operators
who prefer them, but they do not define the platform. Anything buildable in
the Dashboard must also be buildable in the conversation. The conversation is
the source of truth for what the platform is; the Dashboard is an alternative
view into the same capabilities.

This is the Anthropic pattern. For Anthropic, the conversation is the
technical substrate — messages, roles, context, tool calls. Models, Skills,
Artifacts, Projects, Memory, MCP, and Managed Agents are all composable layers
plugging into that substrate. Trendzo models the same shape: the conversation
is the substrate, and every AI Employee, every Clay component, every tool
call, every Dashboard surface is a composable layer plugging into it.

### What this means in practice
- Every new capability must be reachable through Clay conversation, not just
  Dashboard clicks. The Dashboard can mirror conversational capabilities, but
  must not uniquely contain them.
- Every `propose_<id>` Clay adapter represents a capability the agent can
  wield on behalf of the operator. The adapter registry is the functional
  surface of the platform.
- Every read tool (`get_*`) represents a question the agent can answer
  without the operator leaving the conversation.
- The conversation carries context across sessions through Memory, and
  across roles through scoped permissions. Both are layers on top of the
  substrate.

### What this does NOT mean
- The conversation is not the only user-facing surface. Dashboards, email
  delivery, creator portals, and external integrations (TikTok API, Publer)
  all exist and are valid.
- The conversation is not a replacement for data storage. Supabase holds the
  canonical data; the conversation is how users read and mutate it.
- The conversation substrate does not supersede the prediction engine
  (DPS/VPS). Prediction is a capability rendered through the substrate, not
  a competing substrate.

### Docs superseded by this decision
- `SUBSTRATE_FRAMEWORK.md` — claims prediction is the substrate. Superseded.
  Prediction is one capability among many; it is not the organizing primitive
  of the platform.

---

## 2. Build Order — Account Manager First, Then Substrate-Layer

Two build orders were drafted in prior architecture documents:

- **April-14 `AI EMPLOYEE ARCHITECTURE.md`** — employee-by-employee (Phase 1 = AM, Phase 2 = OB, etc.)
- **v2 AI Employee architecture docs (2026-04-21)** — substrate-layer-first (Phase A = hardening, Phase B = read tools, Phase C = dashboards, Phase D = missing schema, Phase E-I = features)

### Canonical build order going forward

1. **Finish Account Manager first.** AM is 3 BUILT / 2 PARTIAL / 0 missing per the 2026-04-24 gap report. Closing it ships a working demo of the conversation-as-substrate principle end-to-end, and its completion naturally executes most of Phase A substrate work along the way.

2. **After AM is complete, pivot to substrate-layer-first ordering** for the remaining four AI Employees (Onboarding Specialist, Trend Scout, Performance Analyst, Project Manager). That means:
   - Phase A — substrate hardening (creator-table consolidation, tenant scoping, `platform_events` discipline)
   - Phase B — read-tool coverage across all employees
   - Phase C — Dashboard surface completion
   - Phase D — schema closure (missing tables: `trend_creator_matches`, `creator_alerts`, `creator_feedback`, `performance_reports`, `chase_log`; missing columns: `deadline`, `performance_factors`, `nudge_*` on `agency_invites`)
   - Phase E — `defineCapability()` unification
   - Phase F — managed autonomy (cron entries for auto-nudges, weekly reports, trend scans, deadline reminders)
   - Phase G — feature unlock (auto-profiling, auto-brief from trend, auto-feedback)
   - Phase H — creator-facing surfaces (alerts, portals)
   - Phase I — external integrations (TikTok API / Publer for PM-4)

### Rationale
Substrate-layer-first would be the cleanest order in principle, but AM is already 80% done and substantially executes Phase A substrate work on its way to completion. Shipping a finished AI Employee first gives a working demo and validates the substrate pattern before scaling it to four more employees.

### Active bugs fixed inline during AM work (not deferred)
- **`action-handler.ts:956` cross-agency data leak in `generateReport()`.** The query against `onboarding_profiles` does not filter by `agency_id`. Security bug. Fixed inline.
- **`agency-chat/route.ts:869` reads `brief.deadline` column that does not exist on `content_briefs`.** Silently feeds `undefined` into the LLM context. Fixed inline — either by adding the column in the AM-related migration or by removing the read.

---

## 3. Document Status

### Canonical (current source of truth)
- `SUBSTRATE_DECISION_2026-04-24.md` (this document) — substrate definition + build order
- `AI_EMPLOYEE_1_ARCHITECTURE_v2.md` through `AI_EMPLOYEE_5_PROJECT_MANAGER_v2_.md` — per-employee specifications
- `AI_EMPLOYEE_GAP_REPORT_2026-04-24.md` — current ground-truth on what is built
- `SUBSTRATE_AUDIT_2026-04-21.md` — schema/route audit, accurate on most findings; stale on Clay adapter count (12 exist, not 2)

### Superseded (historical reference only)
- `AI EMPLOYEE ARCHITECTURE.md` (2026-04-14) — "LOCKED REFERENCE" label is stale. Many workflow statuses are outdated. Retained for historical trace; not used for planning decisions.
- `SUBSTRATE_FRAMEWORK.md` — claims prediction is substrate. Contradicts this decision. Superseded.

### How to use this document
Every future Claude chat begins with this document loaded into the project. Every build prompt for Cursor anchors to this decision. If a contradiction arises between this document and any other architecture doc, this document wins. If a change to this decision is needed, it is made here first — then downstream docs update.