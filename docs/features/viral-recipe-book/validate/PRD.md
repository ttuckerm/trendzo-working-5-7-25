# Validate — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #4

## Purpose & Outcome
Runs a validation batch (e.g., 10 predictions) to verify model accuracy and calibration. Outcome: calibration visible (`validate-calibration`), pass/fail vs 90% target.

## User Stories
- As a user, I click `validate-start` to begin a run.
- As a user, I see calibration and metrics update.

## Edge Cases
- Start blocked by RBAC → toast.
- Metrics missing → skeleton and hint.

## UI Contract
- TestIDs: `validate-start`, `validate-calibration`.
- States: empty/skeleton/error/success.
- Banner: success on start with `{ audit_id }`.

## API Contracts
- POST /api/validation/start [GAP]
  - 200: { run_id, audit_id }
- GET /api/validation/metrics [GAP]
  - 200: { auc, ece, accuracy_pct, f1 }

## Data & Events
- Writes: audit on start.

## Non-Functional
- RBAC: admin; rate limit starts to prevent spam.

## Dependencies
- Predictions store; metrics computation.

## Observability
- Logs: validation.run_started/completed.
- Metrics: validation.accuracy_pct, auc, ece.

## Rollout Plan
- Admin-only.

## Acceptance Criteria
1. `validate-start` starts a run; banner shows Audit #.
2. `validate-calibration` renders with non-null data.
3. Failure path shows error state.
