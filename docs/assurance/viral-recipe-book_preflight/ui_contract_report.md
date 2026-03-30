# UI Contract Compliance — /admin/viral-recipe-book

Source of truth: src/contracts/viral_recipe_book.contract.ts (aggregated TestIDs)

| TestID | Present? | Where (file) | State Coverage |
| --- | --- | --- | --- |
| kpi-chips | Yes | src/app/admin/viral-recipe-book/page.tsx | success (rendered), empty/error fallback implicit |
| filters-bar | Yes | src/app/admin/viral-recipe-book/page.tsx | success |
| tpl-card-<id> | Yes | src/app/admin/viral-recipe-book/page.tsx | success, empty implied |
| tpl-slide-tabs | Yes | src/components/admin/viral-recipe-book/TemplateViewer.tsx | success |
| discovery-readiness-pill | Yes | src/app/admin/viral-recipe-book/page.tsx | success |
| discovery-readiness-panel | Yes | src/app/admin/viral-recipe-book/page.tsx | success |
| analyze-dropzone | Yes | src/app/admin/viral-recipe-book/page.tsx | sr-only placeholder present |
| analyze-results | Yes | src/app/admin/viral-recipe-book/page.tsx and DraftsAnalyzer.tsx | success |
| btn-export-to-studio | Yes | DraftsAnalyzer.tsx | success |
| btn-open-script-intel | Yes | DraftsAnalyzer.tsx | success |
| ab-start | Yes | src/app/admin/viral-recipe-book/page.tsx | placeholder present; success on ABTestInterface action |
| ab-row-<id> | Yes | ABTestInterface.tsx | success (row rendering) |
| validate-start | Yes | ValidationSystem.tsx | success |
| validate-calibration | Yes | src/app/admin/viral-recipe-book/page.tsx and ValidationSystem.tsx | placeholder + success |
| chart-discovery | Yes | PredictionDashboard.tsx | success (data-driven) |
| chart-decay | Yes | PredictionDashboard.tsx | success (data-driven) |
| scripts-list | Yes | src/app/admin/viral-recipe-book/page.tsx | sr-only placeholder |
| opt-schedule | Yes | src/app/admin/viral-recipe-book/page.tsx | sr-only placeholder |
| opt-entities | Yes | src/app/admin/viral-recipe-book/page.tsx | sr-only placeholder |
| inception-queue | Yes | src/app/admin/viral-recipe-book/page.tsx | sr-only placeholder |

Notes
- Placeholders (sr-only) are present on the page for cross-tab visibility; concrete rendering lives in respective components.
- Screenshots: see docs/screenshots if available; otherwise, code anchors above serve as references.
