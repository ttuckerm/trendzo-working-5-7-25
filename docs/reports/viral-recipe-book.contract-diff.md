# Viral Recipe Book — Contract Diff Report

## Overview
Machine contract: `src/contracts/viral_recipe_book.contract.ts`
Page: `docs/contracts/viral-recipe-book.PAGE.md`

## Features
- templates: PASS (TestIDs present, endpoints present; `/api/discovery/metrics` GAP)
- analyzer: PASS (TestIDs present; endpoint `/api/drafts/analyze` present)
- ab-test: MISSING endpoints (UI TestIDs present; `/api/ab/start`, `/api/ab/:id` GAP)
- validate: MISSING endpoints (UI TestIDs present; `/api/validation/start`, `/api/validation/metrics` GAP)
- dashboard: MISSING rollups endpoint (UI TestIDs present; `/api/discovery/rollups` GAP)
- scripts: MISSING endpoint (UI TestID present; `/api/scripts` GAP)
- optimize: MISSING endpoints (UI TestIDs present; `/api/optimize/*` GAP)
- inception: PASS (UI TestID present; `/api/templates/discovery` present)

## Required TestIDs
- discovery-readiness-pill: PASS
- discovery-readiness-panel: PASS
- tpl-card-<id>: PASS
- tpl-slide-tabs: PASS
- analyze-results: PASS
- btn-export-to-studio: PASS
- btn-open-script-intel: PASS
- ab-start: PASS
- ab-row-<id>: PASS
- validate-start: PASS
- validate-calibration: PASS
- chart-discovery: PASS (renders; backing endpoint GAP)
- chart-decay: PASS (renders; backing endpoint GAP)
- scripts-list: PASS
- opt-schedule: PASS (placeholder present)
- opt-entities: PASS (placeholder present)
- inception-queue: PASS (placeholder present)

## Endpoints
- GET /api/discovery/readiness: PASS
- GET /api/discovery/metrics: MISSING
- GET /api/discovery/rollups: MISSING
- POST /api/drafts/analyze: PASS
- POST /api/ab/start: MISSING
- GET /api/ab/:id: MISSING
- POST /api/validation/start: MISSING
- GET /api/validation/metrics: MISSING
- GET /api/templates: PASS
- GET /api/templates/:id: PASS
- GET /api/templates/:id/examples: PASS
- GET /api/templates/discovery: PASS

## Notes
- Ops Readiness card and QA seed exist and link to page; readiness thresholds match `docs/discovery-readiness.md`.


