# Done Checklist — A/B Test

- [ ] `ab-start` visible and clickable
- [ ] POST `/api/ab/start` returns 200 with `{ audit_id }`
- [ ] `ab-row-<id>` appears after start
- [ ] Status transitions to Completed with winner in UI
- [ ] Error state/Toast on start failure

## Manual Test Script
1) Open A/B tab.
2) Click `ab-start` for a row.
3) Verify banner with Audit #.
4) Wait ~5s; expect `ab-row-*` shows Completed and Winner.
