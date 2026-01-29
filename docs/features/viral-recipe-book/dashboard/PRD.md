# Dashboard — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #4

## Purpose & Outcome
Shows Discovery Freshness and Template Decay charts for situational awareness.

## User Stories
- As a user, I view `chart-discovery` and `chart-decay` rendering from rollups.

## Edge Cases
- Rollups missing → hint to Recompute (Ops card).

## UI Contract
- TestIDs: `chart-discovery`, `chart-decay`.
- States: empty/skeleton/error/success.

## API Contracts
- GET /api/discovery/rollups [GAP]
  - 200: { freshness_series: number[], active_count: number[] }

## Non-Functional
- P95 render < 350ms.

## Dependencies
- Discovery recompute job; rollups snapshot.

## Observability
- Logs: dashboard.rollups_loaded.
- Metrics: series lengths.

## Acceptance Criteria
1. Both charts render from `GET /api/discovery/rollups`.
2. Empty state shows hint if arrays empty.
