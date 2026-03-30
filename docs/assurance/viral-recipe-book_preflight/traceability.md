# Traceability Matrix — /admin/viral-recipe-book

| Objective # | Page/Tab | Feature | Endpoint(s) | Data model/table(s) | UI TestIDs | Owner file | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| #2 | Templates | templates | GET /api/templates; GET /api/templates/:id; GET /api/templates/:id/examples; GET /api/discovery/readiness; GET /api/discovery/metrics | `viral_templates`, `template_examples`, `daily_recipe_book` | kpi-chips, filters-bar, tpl-card-<id>, tpl-slide-tabs, discovery-readiness-pill, discovery-readiness-panel | docs/features/viral-recipe-book/templates/PRD.md | PASS (metrics = STUB) |
| #3 | Analyzer | analyzer | POST /api/drafts/analyze | analysis libs (features, scorer) | analyze-dropzone, analyze-results, btn-export-to-studio, btn-open-script-intel | docs/features/viral-recipe-book/analyzer/PRD.md | PASS |
| #4 | A/B Test | ab-test | POST /api/ab/start; GET /api/ab/:id | audit table (pipeline_control_actions) | ab-start, ab-row-<id> | docs/features/viral-recipe-book/ab-test/PRD.md | STUB (endpoints missing) |
| #4 | Validate | validate | POST /api/validation/start; GET /api/validation/metrics | validation metrics store | validate-start, validate-calibration | docs/features/viral-recipe-book/validate/PRD.md | STUB (endpoints missing) |
| #2 | Dashboard | dashboard | GET /api/discovery/rollups | discovery rollups snapshot | chart-discovery, chart-decay | docs/features/viral-recipe-book/dashboard/PRD.md | STUB (endpoint missing) |
| #6 | Scripts | scripts | GET /api/scripts | script intelligence store | scripts-list | docs/features/viral-recipe-book/scripts/PRD.md | STUB (endpoint missing) |
| #2 | Optimize | optimize | POST /api/optimize/schedule; GET /api/optimize/entities | schedule store; entities table | opt-schedule, opt-entities | docs/features/viral-recipe-book/optimize/PRD.md | STUB (endpoints missing) |
| #11 | Inception | inception | GET /api/templates/discovery | discovery tables | inception-queue | docs/features/viral-recipe-book/inception/PRD.md | PASS |

Sources
- PAGE contract: docs/contracts/viral-recipe-book.PAGE.md
- Machine contract: src/contracts/viral_recipe_book.contract.ts
- Feature contracts: docs/features/viral-recipe-book/*/contracts.json
- Code refs: `src/app/admin/viral-recipe-book/page.tsx`, `src/components/admin/viral-recipe-book/*`, `src/app/api/templates/**`, readiness in `src/app/api/discovery/readiness/route.ts` and `src/lib/discovery/discovery_readiness.ts`.
