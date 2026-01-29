# Endpoint Inventory — /admin/viral-recipe-book

| Method | Path | Request | Response | Status | Handler (file) | Consumed by (component + TestID) |
| --- | --- | --- | --- | --- | --- | --- |
| GET | /api/discovery/readiness | — | { ready, scores, reasons[] } | Implemented | src/app/api/discovery/readiness/route.ts | page.tsx (discovery-readiness-pill/panel) |
| GET | /api/discovery/metrics | — | { system, templates, discovery } | Missing | — | page.tsx (`kpi-chips`) |
| GET | /api/discovery/rollups | range? | { freshness_series:number[], active_count:number[] } | Missing | — | PredictionDashboard.tsx (`chart-discovery`, `chart-decay`) |
| POST | /api/discovery/qa-seed | x-user-id | { seed_id, counts, readiness, audit_id } | Implemented | src/app/api/discovery/qa-seed/route.ts | page.tsx (panel actions, success banner) |
| POST | /api/admin/pipeline/actions/recompute-discovery | x-user-id | { audit_id } | Implemented | src/app/api/admin/pipeline/actions/[action]/route.ts | page.tsx (panel action) |
| POST | /api/admin/pipeline/actions/warm-examples | x-user-id | { audit_id } | Implemented | src/app/api/admin/pipeline/actions/[action]/route.ts | page.tsx (panel action) |
| GET | /api/templates | range, platform, niche, sort | Template[] | Implemented | src/app/api/templates/route.ts | page.tsx (filters-bar; lists) |
| GET | /api/templates/:id | id | TemplateDetail | Implemented | src/app/api/templates/[id]/route.ts | TemplateViewer (tpl-slide-tabs) |
| GET | /api/templates/:id/examples | id | Example[] | Implemented | src/app/api/templates/[id]/examples/route.ts | TemplateViewer |
| GET | /api/templates/discovery | — | Discovery[] | Implemented | src/app/api/templates/discovery/route.ts | Inception (`inception-queue`) |
| POST | /api/drafts/analyze | { title?, platform, script?, videoUrl? } | { probability, confidence, features[], recommendations[], audit_id? } | Implemented | src/app/api/drafts/analyze/route.ts | DraftsAnalyzer (`analyze-results`) |
| POST | /api/ab/start | { testId|draftIds[] } | { id, audit_id } | Missing | — | ABTestInterface (`ab-start`) |
| GET | /api/ab/:id | id | { id, status, winner? } | Missing | — | ABTestInterface (`ab-row-<id>`) |
| POST | /api/validation/start | — | { run_id, audit_id } | Missing | — | ValidationSystem (`validate-start`) |
| GET | /api/validation/metrics | — | { auc, ece, accuracy_pct, f1 } | Missing | — | ValidationSystem (`validate-calibration`) |
| GET | /api/scripts | — | Script[] | Missing | — | ScriptIntelligenceDashboard (`scripts-list`) |
| POST | /api/optimize/schedule | — | { audit_id } | Missing | — | OptimizationEngine (`opt-schedule`) |
| GET | /api/optimize/entities | — | Entity[] | Missing | — | OptimizationEngine (`opt-entities`) |
