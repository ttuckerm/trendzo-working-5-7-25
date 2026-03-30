# A/B Test — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #3, #4

## Purpose & Outcome
Lets users start an A/B test on drafts, track status, and see a winner. Outcome: `ab-row-<id>` appears and transitions to Completed with a winner.

## User Stories
- As a user, I click `ab-start` to start a test.
- As a user, I see an `ab-row-<id>` with live status.

## Edge Cases
- Start fails (RBAC/rate) → error toast.
- Poll fails → show retry and stale indicator.

## UI Contract
- TestIDs: `ab-start`, `ab-row-<id>`.
- States: empty/skeleton/error/success.
- Banners: success with `{ audit_id }` on start.

## API Contracts
- POST /api/ab/start [GAP]
  - Req: { testId|draftIds[] }
  - 200: { id, status: active, audit_id }
- GET /api/ab/:id [GAP]
  - 200: { id, status: active|completed, winner? }

## Data & Events
- Writes: audit row on start.

## Non-Functional
- Start P95 < 800ms.
- RBAC: admin-only; rate limit.

## Dependencies
- Drafts store; scoring service.

## Observability
- Logs: ab.start, ab.complete.
- Metrics: ab.active, ab.completed.
- Alerts: ab.start_failure.

## Rollout Plan
- Admin-only first.

## Acceptance Criteria
1. `ab-start` button visible and clickable.
2. POST returns `{ audit_id }` and shows banner.
3. `ab-row-<id>` appears; status transitions to Completed within demo window.
