# Feature-Importance Drift Panel

## Computation
- Windowed drop-one delta: for each feature, neutralize and recompute calibrated probability; take mean absolute delta across window.
- If labels available, compute ΔAUROC between base and neutralized.
- Features: zScoreNormalized, engagementScore, platformWeight, decayFactor, frameworkContribution, transcriptFeatures, telemetryAlignment, timingScore, personalizationFactor, simulatorFactor, distributionFactor, calibrationImpact, qualityFactor, safetyPenalty.

## Thresholds
- See `src/config/drift.ts`: REL_CHANGE=0.35, ABS_CHANGE=0.05, RANK_SHIFT=3, MIN_SUPPORT=500

## Run
- POST `/api/admin/drift/run-now` (admin) — computes last 7d vs 30d baseline; returns summary.
- Scheduler runs every ~3h.

## Alerts
- On threshold breach, sends Slack + Email via notifier; deduped 6h.

## API
- GET `/api/admin/drift/importance?window=7d&platform=TT&niche=ALL`

## UI
- Page `/admin/drift` with controls, list, bars, and table.
