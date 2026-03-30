# Done Checklist — Templates

- [ ] `kpi-chips` shows non-null values (system.accuracy_pct, templates.active_count, discovery.freshness_seconds)
- [ ] `filters-bar` changes trigger GET `/api/templates` and update lists
- [ ] HOT/COOLING/NEW sections render `tpl-card-<id>` items
- [ ] Clicking a card opens slide-over with `tpl-slide-tabs`
- [ ] `discovery-readiness-pill` opens `discovery-readiness-panel` with reasons/actions
- [ ] Error state renders when endpoints fail; empty state hints QA seed

## Manual Test Script
1) Navigate `/admin/viral-recipe-book`.
2) Verify `kpi-chips` visible with values.
3) Change window to 7d → list reloads.
4) Click first `tpl-card-*` → verify `tpl-slide-tabs`.
5) Click `discovery-readiness-pill` → panel shows reasons.
6) Open Debug Drawer → verify latest POSTs (if any) include `audit_id`.

## Debug Drawer Links
- Inspect POST entries; confirm `{ audit_id }` returned on Ops actions.
