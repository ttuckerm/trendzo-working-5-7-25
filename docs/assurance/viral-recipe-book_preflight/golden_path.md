# Golden Path — Manual Acceptance Script

Prereq: Admin logged in. Engine Room → Operations Center available.

1) Seed & Recompute
- Open `/admin/viral-recipe-book`.
- Click pill `Discovery: Needs Attention` (`discovery-readiness-pill`).
- In panel (`discovery-readiness-panel`), click “QA Seed”. Expect top banner: `✅ Done (Audit #<id>)`.
- Click “Recompute Discovery”. Expect top banner: `✅ Done (Audit #<id>)`.
- Close panel. Pill should show `Discovery: Ready`.

2) Templates
- Verify `kpi-chips` visible with non-null values.
- Use `filters-bar` to change window to 30d; lists reload.
- Click a `tpl-card-<id>`; slide-over shows `tpl-slide-tabs`.

3) Analyzer
- Click “Analyzer” tab.
- Drop a sample file into `analyze-dropzone`.
- Expect `analyze-results` with a probability and fixes.
- Buttons visible: `btn-export-to-studio`, `btn-open-script-intel`.

4) A/B Test
- Click “A/B Test” tab.
- Click `ab-start` on a row. Expect top banner: `✅ Done (Audit #<id>)`.
- Verify a row appears `ab-row-<id>`; after ~5s, status shows Completed with Winner.

5) Validate
- Click “Validate” tab.
- Click `validate-start`. Expect banner: `✅ Done (Audit #<id>)`.
- Verify `validate-calibration` shows calibration/metrics.

6) Dashboard
- Click “Dashboard” tab.
- Verify `chart-discovery` and `chart-decay` render bars.

7) Scripts, Optimize, Inception
- Scripts: verify `scripts-list` visible.
- Optimize: verify `opt-schedule` and `opt-entities` present.
- Inception: verify `inception-queue` visible.

8) Debug Drawer
- Open Debug Drawer; confirm recent POSTs include `{ audit_id }` for QA Seed, Recompute, A/B start, Validate start.
