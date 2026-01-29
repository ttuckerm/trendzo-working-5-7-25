# Done Checklist — Analyzer

- [ ] `analyze-dropzone` visible and accepts upload/link
- [ ] POST `/api/drafts/analyze` returns 200 with probability/confidence
- [ ] `analyze-results` renders score and top fixes
- [ ] `btn-export-to-studio` visible and clickable
- [ ] `btn-open-script-intel` visible and clickable
- [ ] Error state renders on failure

## Manual Test Script
1) Go to Analyzer tab.
2) Drop a small file; expect processing then `analyze-results`.
3) Click both buttons; expect navigation or modal.
4) Check Debug Drawer for POST with `audit_id`.
