## Exponential Learning System

Lifecycle:
- Current model stored at `fixtures/learning/model_current.json`; candidate stored at `fixtures/learning/model_candidate.json` and versioned as `model_v{n}.json`.
- Update flow: `POST /api/learning/update` runs trainer over `fixtures/validation/validations.ndjson`, recomputes calibration bins, searches weights to reduce Brier loss, tunes threshold 0.40–0.70, and emits metrics.
- Promotion: `POST /api/learning/promote` copies candidate to current; new model takes effect immediately because scorer reads `model_current.json` per request.

Optimized metrics:
- Accuracy, AUROC (trapezoidal ROC), ECE (10-bin reliability), Brier score, validated count.
- Drift/Weather: PSI-like index over prediction probabilities compares last 7 days vs prior 7; thresholds map to Stable/Shifting/Storm.

MOCK vs live:
- With `MOCK=1`, reads/writes under `fixtures/` and auto-bootstraps `model_v1` with neutral weights and calibration copied from validation summary.
- With `MOCK=0`, the same code paths run; if any live source fails or files are missing, the system auto-bootstraps a neutral model and returns valid JSON shapes.

APIs:
- POST `/api/learning/update` → `{ candidate, deltas, trend, driftIndex }`
- POST `/api/learning/promote` → new current model
- GET `/api/learning/summary` → `LearningSummary` with versions, 30-day trend, driftIndex, AUROC/ECE from current model; cached for 10 minutes

UI:
- `/accuracy` shows 30-day trend badge `Model vN` and optional `candidate vN+1`, and Weather status based on drift.
- `/admin/learning` shows Current and Candidate cards, metric deltas, Trend sparkline, Drift meter, and actions (Run Update, Promote Candidate, Download current JSON).

Proof Tile (#5):
- Passes when 7-day accuracy ≥ prior 7-day, candidate improves Accuracy and ECE vs current, and driftIndex < 0.3.








































































































































