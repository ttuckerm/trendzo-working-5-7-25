# SF — A/B Test

```mermaid
graph TD
  UI -->|POST| START[/api/ab/start]:::gap
  classDef gap fill:#fff3cd,stroke:#f0ad4e,color:#8a6d3b
  START --> R1[{ id, audit_id }]
  UI -->|poll| POLL[GET /api/ab/:id]:::gap
  POLL --> WIN[Winner]
```
