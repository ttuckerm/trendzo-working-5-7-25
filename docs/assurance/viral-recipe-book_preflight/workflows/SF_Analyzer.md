# SF — Analyzer

```mermaid
graph TD
  UI -->|POST| ANALYZE[/api/drafts/analyze]
  ANALYZE --> FEAT[Extract features]
  FEAT --> SCORE[Score draft]
  SCORE --> RECS[Generate recs]
  RECS --> RESP[{ probability, confidence, features[], recommendations[], audit_id? }]
```
