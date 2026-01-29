# SF — Optimize

```mermaid
graph TD
  UI --> SCHED[POST /api/optimize/schedule]:::gap
  classDef gap fill:#fff3cd,stroke:#f0ad4e,color:#8a6d3b
  SCHED --> AUD[{ audit_id }]
  UI --> ENT[GET /api/optimize/entities]:::gap
  ENT --> LIST[Render opt-entities]
```
