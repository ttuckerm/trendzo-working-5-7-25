# Scripts — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #6

## Purpose & Outcome
Lists script intelligence patterns and surfaced scripts/details for author support.

## User Stories
- As a user, I see `scripts-list` with relevant scripts/patterns.

## UI Contract
- TestID: `scripts-list`.
- States: empty/skeleton/error/success.

## API Contracts
- GET /api/scripts [GAP]
  - 200: [{ id, title, pattern, score }]

## Acceptance Criteria
1. `scripts-list` visible and populated or shows empty state.
