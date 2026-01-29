# SF — Validate

```mermaid
graph TD
  UI -->|POST| START[/api/validation/start]:::gap
  classDef gap fill:#fff3cd,stroke:#f0ad4e,color:#8a6d3b
  START --> R1[{ run_id, audit_id }]
  UI -->|poll| METRICS[GET /api/validation/metrics]:::gap
  METRICS --> CAL[Charts render]
```
