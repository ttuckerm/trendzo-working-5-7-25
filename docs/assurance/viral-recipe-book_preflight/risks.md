# Risks & Ambiguities

1) Discovery Metrics shape (Missing Endpoint)
- Ambiguity: `/api/discovery/metrics` not implemented; page expects KPIs.
- Proposed default: { system:{ accuracy_pct:number }, templates:{ active_count:number }, discovery:{ freshness_seconds:number } }.

2) A/B payload shape
- Ambiguity: Use { testId } vs { draftIds:string[] }.
- Proposed: { draftIds:string[] } with optional testName; response { id, audit_id }.

3) Validation metrics
- Ambiguity: Minimal fields.
- Proposed: { auc:number, ece:number, accuracy_pct:number, f1:number }.

4) Dashboard rollups
- Ambiguity: Series scaling/length.
- Proposed: { freshness_series:number[], active_count:number[] } covering last 60 points.

5) Scripts endpoint
- Ambiguity: Filters and shape.
- Proposed: GET returns [{ id, title, pattern, score:number }].

6) Optimize endpoints
- Ambiguity: Schedule payload and entity shape.
- Proposed: POST /optimize/schedule { window:'7d'|'30d'|'90d', platform?:string, niche?:string } → { audit_id }.
- GET /optimize/entities → [{ id, entity_type, value, score }].

7) RBAC and rate limits
- Ensure POST endpoints require admin and return `{ audit_id }`. Rate limit A/B start and Validate start.
