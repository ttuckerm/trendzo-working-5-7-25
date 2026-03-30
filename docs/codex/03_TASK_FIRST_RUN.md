# TASK — First Codex Run: Ecom Forecast MVP (Top-Level Nav)

## Goal
Ship a working feature that:
1) stores ingested scraped product records in Supabase
2) displays a forecast feed + product detail page
3) generates a Live Recipe output
4) is gated by feature flag and includes basic tests
5) appears as newest TOP-LEVEL menu item directly below "HUB"

## Deliverables
### A) Database
Add Supabase SQL migration (or create migration file in repo if that’s your pattern) to create:
1) ecom_products
2) ecom_ingest_runs (optional but recommended)
3) ecom_feature_events (optional; only if not reusing analytics.ts)

### B) API Routes (Next.js App Router)
1) POST /api/ecom/ingest
   - Validates payload with Zod
   - Upserts products into ecom_products
   - Stores observed_at and raw metrics json
2) GET /api/ecom/forecast
   - Returns top N products sorted by breakoutProbability desc
   - Includes computed ForecastScore and topReasons
3) GET /api/ecom/products/[id]
   - Returns product + computed score + reasons
4) POST /api/ecom/products/[id]/live-recipe
   - Returns LiveRecipe JSON (deterministic template-based generation is fine)

### C) UI (Top-Level)
1) /ecom page
   - Table/grid of products + scores + reasons
   - Filters: Emerging/Breakout/Saturated (derived from breakoutProbability + confidence thresholds)
2) /ecom/[id] page
   - Product summary + evidence
   - Button: "Generate Live Recipe"
   - Shows recipe output in a styled card

### D) Navigation + Gating (MUST FOLLOW EXACTLY)
- Modify: src/app/admin/components/MasterNavigation.tsx
- Add a NEW TOP-LEVEL sidebar item labeled "Ecom Forecast" (or "Ecommerce Forecast")
- It must be the newest menu item directly BELOW "HUB"
- It is NOT nested under Hub and must NOT use /hub/* routes
- Routes:
  - /ecom
  - /ecom/[productId]
- Hide the nav item when FEATURE_ECOM_FORECAST is disabled
- Block /ecom and /ecom/[productId] when disabled (locked state or redirect)

### E) Tests
- Unit test scoring function (deterministic)
- Basic route handler tests if existing test framework exists
- If no test framework is present, add minimal test setup consistent with repo standards OR provide a manual acceptance checklist.

## Acceptance Criteria
- Ingest endpoint accepts a payload of ≥10 products and persists them.
- /ecom renders with scores and at least 3 reasons per product.
- /ecom/[id] loads without errors.
- Live Recipe generation returns required sections.
- Feature is hidden/blocked when flag disabled.
- Nav item placement is correct (newest item directly below HUB).
