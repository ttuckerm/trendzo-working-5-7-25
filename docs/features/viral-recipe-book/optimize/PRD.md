# Optimize — Atomic Feature PRD

- Owner Objective: #2
- Also Supports: #6

## Purpose & Outcome
Provides scheduling and entity optimization tools to improve discovery performance.

## User Stories
- As a user, I schedule optimization jobs (`opt-schedule`).
- As a user, I browse optimized entities (`opt-entities`).

## UI Contract
- TestIDs: `opt-schedule`, `opt-entities`.

## API Contracts
- POST /api/optimize/schedule [GAP]
- GET /api/optimize/entities [GAP]

## Acceptance Criteria
1. `opt-schedule` and `opt-entities` visible.
2. POST returns success and banner with Audit #.
