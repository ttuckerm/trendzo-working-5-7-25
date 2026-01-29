# SF — Templates

```mermaid
graph TD
  UI -->|poll 20s| METRICS[GET /api/discovery/metrics]
  UI -->|load| LIST[GET /api/templates?range=&platform=&niche=]
  UI -->|select card| DETAIL[GET /api/templates/:id]
  UI -->|select card| EXAMPLES[GET /api/templates/:id/examples]
  UI -->|readiness| READY[GET /api/discovery/readiness]
  UI -->|ops| QA[POST /api/discovery/qa-seed]\nreturns { audit_id }
  UI -->|ops| RECOMP[POST /api/admin/pipeline/actions/recompute-discovery]\nreturns { audit_id }
  UI -->|ops| WARM[POST /api/admin/pipeline/actions/warm-examples]\nreturns { audit_id }
```
