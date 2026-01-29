# Discovery Readiness — Summary

Source: docs/discovery-readiness.md; code: src/app/api/discovery/readiness/route.ts, src/lib/discovery/discovery_readiness.ts

Ready when all true:
- freshness_secs ≤ 7200
- templates_total ≥ 60
- sections.HOT ≥ 10, COOLING ≥ 10, NEW ≥ 10
- examples_coverage_pct ≥ 90
- safety_coverage_pct ≥ 95
- analyzer_online = true
- ab_online = true
- validate_online = true

Endpoints
- GET `/api/discovery/readiness` → { ready, scores, reasons[] }
- POST `/api/discovery/qa-seed` → seeds data; returns `{ audit_id }`
- POST `/api/admin/pipeline/actions/recompute-discovery` → recompute; returns `{ audit_id }`
- POST `/api/admin/pipeline/actions/warm-examples` → backfill examples; returns `{ audit_id }`

UI
- Pill `discovery-readiness-pill` opens `discovery-readiness-panel` with reasons and one-click actions above. Success shows top banner “✅ Done (Audit #<id>)”.
