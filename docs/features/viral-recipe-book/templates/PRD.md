# Templates — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #3, #4, #6, #11

## Purpose & Outcome
Enables discovery of viral templates across HOT/COOLING/NEW sections and an All grid with filters. Users can open a template to view details and examples, then take downstream actions (analyze, copy to studio).

## User Stories
- As an owner, I see HOT/COOLING/NEW and All sections populated with up-to-date templates.
- As a user, I filter by window, platform, and niche via `filters-bar`.
- As a user, I open a `tpl-card-<id>` to view details in slide-over `tpl-slide-tabs`.
- As an operator, I view a `discovery-readiness-pill` and open the panel for reasons/actions.

## Edge Cases
- Empty discovery: show hint to run QA seed/recompute.
- Stale data: readiness shows Needs Attention and reasons.
- Example fetch fails: detail loads but examples list shows error state.

## UI Contract
- Screens/Sections: KPI chips (`kpi-chips`), filters (`filters-bar`), HOT/COOLING/NEW lists, All grid, Template slide-over (`tpl-slide-tabs`), Readiness pill/panel (`discovery-readiness-pill`, `discovery-readiness-panel`).
- Visible states: empty/skeleton/error/success for lists and detail.
- Banners/Toasts: success banner on POST actions (e.g., copy winner) with Audit #.

## API Contracts
- GET /api/templates?range=&platform=&niche=&sort=
  - 200: [{ id, name|title, status: HOT|COOLING|NEW|NEWLY, successRate|sr, uses, last_seen_at, safety { nsfw, copyright }, examples, entity { sound, hashtags[] } }]
- GET /api/templates/:id → 200: { id, title, metrics, safety, trend[] }
- GET /api/templates/:id/examples → 200: [{ id, url, caption }]
- GET /api/discovery/metrics → 200: { system:{accuracy_pct}, templates:{active_count}, discovery:{freshness_seconds} } [GAP]
- GET /api/discovery/readiness → 200: { ready, scores, reasons[] }

Errors
- 4xx/5xx: { error: code, message? }

## Data Model & Events
- Reads: tables `viral_templates`, `template_examples`, `daily_recipe_book` (if present).
- Writes: none (Templates tab); copy-winner writes to `templates` (separate action).
- Audit: All POSTs must return `{ audit_id }` and log to `pipeline_control_actions`.

## Non-Functional
- Perf: list loads in <600ms P95 for 60 items; slide-over <400ms P95.
- Rate limits: public GETs ok; POSTs admin-only.
- RBAC: admin for POST-only actions; reads allowed to admin pages.
- Security: avoid leaking private template metadata; validate query params.

## Dependencies
- Upstream: discovery recompute job, QA seed.
- Downstream: Analyzer, A/B Test, Validate, Scripts.
- DAG nodes: `template_discovery` → `entity_velocity` → `schedule_intelligence`.

## Observability
- Logs: templates_list_fetched, template_detail_viewed.
- Metrics: templates.count, sections.{hot,cooling,new}.
- Alerts: discovery.stale_over_threshold.
- Audit trails: POST actions via pipeline_control_actions.

## Rollout Plan
- Flag: none; progressive rollout via readiness gate.
- Phases: local → staging → prod with smoke tests.

## Acceptance Criteria
1. `kpi-chips` renders with non-null values from `/api/discovery/metrics` or synthetic fallback.
2. `filters-bar` visible; changing filters triggers `GET /api/templates` and updates lists.
3. HOT/COOLING/NEW lists render `tpl-card-<id>` entries.
4. Clicking a card opens slide-over with `tpl-slide-tabs` visible.
5. `discovery-readiness-pill` opens `discovery-readiness-panel` with reasons/actions.
6. Errors show visible error states; empty shows hint to run QA seed.

## Gaps
- `/api/discovery/metrics` not found in codebase; mark to-implement with shape above.
