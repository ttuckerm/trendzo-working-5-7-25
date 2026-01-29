# Viral Recipe Book — Features

## Index

| Feature | PRD | Flows | Checklist |
| --- | --- | --- | --- |
| Templates | templates/PRD.md | templates/flows.md | templates/checklist.md |
| Analyzer | analyzer/PRD.md | analyzer/flows.md | analyzer/checklist.md |
| A/B Test | ab-test/PRD.md | ab-test/flows.md | ab-test/checklist.md |
| Validate | validate/PRD.md | validate/flows.md | validate/checklist.md |
| Dashboard | dashboard/PRD.md | dashboard/flows.md | dashboard/checklist.md |
| Scripts | scripts/PRD.md | scripts/flows.md | scripts/checklist.md |
| Optimize | optimize/PRD.md | optimize/flows.md | optimize/checklist.md |
| Inception | inception/PRD.md | inception/flows.md | inception/checklist.md |

## Contract Coverage

| Item | Status |
| --- | --- |
| TestIDs (kpi-chips, filters-bar, tpl-card-<id>, tpl-slide-tabs, discovery-readiness-pill, discovery-readiness-panel) | PASS |
| TestIDs (analyze-dropzone, analyze-results, btn-export-to-studio, btn-open-script-intel) | PASS |
| TestIDs (ab-start, ab-row-<id>) | PASS |
| TestIDs (validate-start, validate-calibration) | PASS |
| TestIDs (chart-discovery, chart-decay) | PASS |
| TestIDs (scripts-list, opt-schedule, opt-entities, inception-queue) | PASS (present as sr-only placeholders in page)
| Endpoints: /api/discovery/readiness | PASS |
| Endpoints: /api/discovery/rollups | MISSING (to-implement) |
| Endpoints: /api/discovery/metrics | MISSING (to-implement) |
| Endpoints: /api/drafts/analyze | PASS |
| Endpoints: /api/ab/start, /api/ab/:id | MISSING (to-implement) |
| Endpoints: /api/validation/start, /api/validation/metrics | MISSING (to-implement) |
| Endpoints: /api/templates, /api/templates/:id, /api/templates/:id/examples | PASS |
| Endpoints: /api/templates/discovery | PASS |

## Next Actions
- Implement `/api/discovery/metrics` and wire KPI chips fully.
- Implement `/api/discovery/rollups` backing for charts (currently mocked by rollups usage).
- Implement `/api/ab/start` and `/api/ab/:id` with RBAC + rate limit.
- Implement `/api/validation/start` and `/api/validation/metrics` with audit.
