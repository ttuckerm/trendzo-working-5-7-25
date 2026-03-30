### Public Proof & Reliability

This public, shareable page exposes live accuracy, reliability (calibration), and algorithm weather, plus an embeddable badge.

#### What is shown
- **Accuracy**: overall accuracy as a percentage with counts (correct / validated).
- **Reliability curve**: 10+ calibration bins with ECE and AUROC tiles.
- **Algorithm Weather**: status chip (Stable / Shifting / Storm) with last change timestamp.
- **Rule**: Viral = z≥2 & ≥95th in first 48h.
- **Downloads**: CSV and JSON via public endpoints.

#### Data sources
- `GET /api/public/accuracy/summary` returns `{ ok, summary }` where `summary` includes `accuracy`, `validated`, `correct`, `bins`, `ece`, `auroc`, `computedAtISO`.
- `GET /api/metrics` provides `weather` and `driftIndex`.
- `GET /api/public/accuracy/csv` returns CSV of validations.

#### Embed the badge
Add this snippet to any site:

```html
<div id="tz-accuracy-badge"></div>
<script async src="https://YOUR_HOST/widget/accuracy.js" data-target="tz-accuracy-badge"></script>
```

The loader inserts a Shadow DOM badge. It retries once on network error and gracefully degrades to a static badge if both attempts fail. CORS is enabled for `*`.

#### MOCK mode and live fallback
- With `MOCK=1`, fixtures are auto-seeded and all routes return valid shapes and content.
- In live mode, routes never 500; the page uses server components and streaming and shows skeletons/empty-safe values if upstream fails.


