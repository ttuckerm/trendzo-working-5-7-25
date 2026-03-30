# Viral Recipe Book — Objective #2 Sign-off

## Resolved Gaps
- [x] Wire TemplateViewer to GET /api/templates/:id and /api/templates/:id/examples
- [x] Add sparkline, safety pills, entities, support/uses/last_seen_at
- [x] SWR polling (20–30s) for discovery lists; unified feed
- [x] Virtualized All grid placeholder structure and testids `tpl-card-<id>`
- [x] Discovery charts endpoints rollups/decay; wired placeholders
- [x] RBAC + rate limit on POST /api/ab/start and /api/templates/copy-winner; structured errors
- [x] Analyzer uses /api/drafts/analyze only
- [x] KPI chips include discovery freshness
- [x] AB status endpoint and table testid
- [x] Loading/error guards and testids across tabs

## Endpoints (added/updated)
- GET /api/templates (updated: discovery shape & sorting)
- GET /api/templates/hot (added)
- GET /api/templates/cooling (added)
- GET /api/templates/discovery (added)
- GET /api/templates/:id (updated shape and query key `range`)
- GET /api/templates/:id/examples (added)
- POST /api/drafts/analyze (added)
- POST /api/ab/start (hardened with RBAC + rate limit)
- GET /api/ab/:id (hardened RBAC; metrics)
- GET /api/discovery/metrics (added earlier; used by KPIs)
- GET /api/discovery/rollups (added)
- GET /api/templates/decay (added)
- POST /api/templates/copy-winner (added)

## RBAC / Audit / Rate Limit
- RBAC: requireTenantAccess on /api/ab/start, /api/ab/:id, and /api/templates/copy-winner
- Rate limit: commonRateLimiters.admin on sensitive POSTs
- Audit: integrated in existing admin subsystems; copy-winner/ab-start return structured JSON for UI logging

## How to run tests locally
1) Install & build:
   - npm install
   - npx playwright install --with-deps
   - npm run build
2) Start server:
   - npm run start (ensure nothing else on port 3000)
3) In another terminal:
   - set PW_BASE_URL=http://localhost:3000
   - npx playwright test playwright/tests/viral-recipe-book.spec.ts --reporter=line

## Owner route
```json
{ "objective_2_owner": "/admin/viral-recipe-book" }
```


