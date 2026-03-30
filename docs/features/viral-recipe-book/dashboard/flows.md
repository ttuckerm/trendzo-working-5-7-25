# Dashboard — UF/SF

## UF
1. Open Dashboard tab.
2. View Discovery Freshness and Template Decay.

```mermaid
graph TD
  A[Open Dashboard] --> B[Chart Discovery]
  A --> C[Chart Decay]
```

## SF
1. GET `/api/discovery/rollups` [GAP] → chart series.

```mermaid
graph TD
  U[UI] --> S1[GET /api/discovery/rollups]
  S1 --> V1[Render charts]
```

### Variants
- Golden: both charts populated.
- Failure: empty arrays → hint.

