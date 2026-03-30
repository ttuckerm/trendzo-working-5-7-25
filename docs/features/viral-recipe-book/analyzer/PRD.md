# Analyzer — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #3, #6

## Purpose & Outcome
Scores a draft (uploaded or linked) and produces prioritized fixes with handoff to Studio or Script Intelligence. Outcome: a clear probability score, confidence, key features, and actionable recommendations.

## User Stories
- As a user, I drop a file or link a draft and get `analyze-results` with score and fixes.
- As a user, I click `btn-export-to-studio` to create a Studio draft.
- As a user, I click `btn-open-script-intel` to inspect script features.

## Edge Cases
- Unsupported file → error state with hint.
- Long processing → skeleton with progress.
- Partial recommendations → still show top 3 fixes.

## UI Contract
- TestIDs: `analyze-dropzone`, `analyze-results`, `btn-export-to-studio`, `btn-open-script-intel`.
- States: empty/skeleton/error/success.
- Banners: success banner on analyze completion with Audit # (if provided).

## API Contracts
- POST /api/drafts/analyze
  - Req: { title?, platform, script?, videoUrl? }
  - 200: { probability, confidence, features[], recommendations[], timings, audit_id? }
  - 4xx/5xx: { error }

## Data Model & Events
- Reads: uploads store, models features extractors.
- Writes: audit table on POST with `{ audit_id }`.

## Non-Functional
- P95 latency < 2.5s (local < 1.2s mock).
- Rate limits: admin only for page; method-level rate if exposed.
- RBAC: admin for POST.
- Security: validate URLs, sanitize script text.

## Dependencies
- Feature extraction libraries, scoring service.

## Observability
- Logs: analyze.started, analyze.completed.
- Metrics: analyze.latency_ms, analyze.success.
- Alerts: analyze.error_rate_high.

## Rollout Plan
- Dark-launch in admin, then generalize.

## Acceptance Criteria
1. `analyze-dropzone` visible and accepts input.
2. POST `/api/drafts/analyze` returns success and renders `analyze-results` with non-null score.
3. `btn-export-to-studio` and `btn-open-script-intel` visible.
4. Error state renders for 4xx/5xx with readable message.
