### Viral Recipe Book — DONE

Route: `/admin/viral-recipe-book`

---

### What changed

- Endpoints and RBAC/audit
  - Enforced admin RBAC, rate limiter, and audit logging on `POST /api/drafts/analyze`; returns `{ audit_id }`.
    - Edited: `src/app/api/drafts/analyze/route.ts`
  - Unified A/B polling to complete after ~5s and return winner payload.
    - Edited: `src/app/api/ab/[id]/route.ts`
  - Existing admin-audited Ops actions verified: `qa-seed`, `recompute-discovery`, `warm-examples`.

- UI wiring & TestIDs
  - Added `data-testid="ab-start"` to actual Start Test button.
    - Edited: `src/components/admin/viral-recipe-book/ABTestInterface.tsx`
  - Made analyzer results container visible with `data-testid="analyze-results"`.
    - Edited: `src/components/admin/viral-recipe-book/DraftsAnalyzer.tsx`
  - Improved readiness panel actions with disabled/spinners and high-contrast banners (persist ≥5s).
    - Edited: `src/app/admin/viral-recipe-book/page.tsx`
  - Added global TopBanner with slide-in, dismiss, and `data-testid="top-banner"`.
    - Edited: `src/components/ui/TopBanner.tsx`
  - Ops buttons now expose testIDs: `ops-btn-qa-seed`, `ops-btn-recompute`, `ops-btn-warm-examples`.
    - Edited: `src/app/admin/operations-center/components/ControlsBar.tsx`, `.../Cards.tsx`

- Banners & Debug Drawer
  - All POST actions now surface a top success banner: “✅ Done (Audit #<id>)”, 5s duration.
  - Debug Drawer (already installed) logs POSTs and shows `Audit #` from JSON.

- Tests
  - Consolidated Playwright Golden Path test.
    - Edited: `playwright/tests/viral-recipe-book.spec.ts`
  - Added Engine Room Ops and Readiness panel tests asserting banner visibility and POST logs.
    - Added: `playwright/tests/engine-room-ops.spec.ts`, `playwright/tests/viral-recipe-book-readiness.spec.ts`

---

### 5-step demo script

1) Operations Center → Discovery card
   - Click “Demo Fill” or run QA Seed then Recompute.
   - Observe toast and top banner “✅ Done (Audit #<id>)”.

2) Viral Recipe Book (Templates)
   - Go to `/admin/viral-recipe-book`
   - Verify KPIs and HOT/COOLING/NEW lists.
   - Click any `tpl-card-*` → slide-over tabs (`tpl-slide-tabs`).

3) Analyzer
   - Switch to Analyzer tab; run analysis (drop/upload or trigger) 
   - See `analyze-results` with both CTAs: `btn-export-to-studio`, `btn-open-script-intel`.
   - Top banner shows Audit #.

4) A/B Test
   - Switch to A/B tab; click `ab-start` on a draft row.
   - An `ab-row-<id>` appears in Active; within ~5s status becomes Completed with a Winner.

5) Validate & Dashboard
   - Validate tab: click `validate-start` → run appears; calibration/confusion metrics visible.
   - Dashboard tab: `chart-discovery` and `chart-decay` render from `/api/discovery/rollups`.

Bonus: Open the Debug Drawer (right-side button) to see POST entries with method/status/duration and “Audit #<id>”.

Screenshot note: please capture the top green banner visible over the dark header while an Ops action completes and attach here.

---

### Switching to live keys later (info only)

- Supabase: set service URL/key via `NEXT_PUBLIC_SUPABASE_URL` and server `SUPABASE_SERVICE_KEY`.
- Apify (or data source): wire discovery generation to live crawlers; replace QA seed with real pipeline.
- OpenAI (or model provider): swap analyzer mock with live scoring endpoint; keep `{ audit_id }` responses and admin RBAC.


