# Done Checklist — Validate

- [ ] `validate-start` visible and triggers POST `/api/validation/start`
- [ ] Banner shows `{ audit_id }` on success
- [ ] `validate-calibration` visible with metrics
- [ ] Error state visible on failure

## Manual Test Script
1) Open Validate tab.
2) Click `validate-start`; expect banner with Audit #.
3) Confirm `validate-calibration` renders metrics.
4) Check Debug Drawer for POST with `audit_id`.
