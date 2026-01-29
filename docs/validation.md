## Prediction Validation System (Objective #4)

Lifecycle:
- Log predictions via `POST /api/predict/log` (MOCK writes to `fixtures/validation/predictions.ndjson`).
- Recompute actuals via `POST /api/validation/recompute` (scans predictions older than VALIDATION_WINDOW_HOURS=48; in MOCK, simulates actuals and backfills on first run). Writes to `fixtures/validation/validations.ndjson` and `summary.json`.
- Summary fetched by `GET /api/validation/summary` with 10m staleness guard.

Metrics:
- total, validated, correct, accuracy, confusion (TP/FP/TN/FN)
- AUROC via trapezoidal ROC
- ECE with 10 reliability bins `{p_mid, frac_positive, count}`

APIs:
- POST `/api/predict/log`
- POST/GET `/api/validation/recompute`
- GET `/api/validation/summary`
- GET `/api/validation/records?cursor=&limit=`
- GET `/api/validation/export.csv`
- Public mirrors:
  - GET `/api/public/accuracy/summary`
  - GET `/api/public/accuracy/csv`

Mock simulation:
- First run backfills ~120 examples at ~90% accuracy; subsequent recomputes validate new logs with simulated actuals based on probability.

Switching to live:
- Implement `getSource().get(id)` to return VIT; `computeViral` determines actual viral label. Files remain in fixtures for fallback.


