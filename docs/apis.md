- POST /api/analyze
  - body: { videoUrl? | fileUpload?, scriptText?, platform, niche, caption?, durationSec? }
  - returns: { probability, confidence, reasons[], recommendations[], timings, vitPreview?, frameworkMatches[] }
- GET /api/analyze/examples (MOCK only)
  - returns: { examples: [...] }

- POST /api/predict/log
  - body: PredictionEvent
- POST /api/validation/recompute (GET also supported)
  - returns: { ok, summary }
- GET /api/validation/summary
  - returns latest computed validation summary
- GET /api/validation/records?cursor=&limit=
  - returns paginated validations
- GET /api/validation/export.csv
- GET /api/public/accuracy/summary
- GET /api/public/accuracy/csv
## APIs

- GET `/api/videos?limit=&cursor=&platform=&niche=&order=recent|top`
  - Returns `{ items: [{ id, platform, creatorId, caption, niche, publishTs, views48h, viral, templateState }], nextCursor }`

- GET `/api/videos/:id`
  - Returns full VIT plus `{ viral: { viral, z, p, reasons } }`

- GET `/api/metrics`
  - Returns `{ accuracy: { correct, total }, calibration: [{ bin, meanPred, empRate }], weather: { status, lastChange }, driftIndex }`

- GET `/api/proof-tiles`
  - Returns array of 13 objective tiles `{ id, title, target, value, passed, updatedAt }`

### API Endpoints

- GET `/api/videos?id?cursor&limit&platform&viral` → grid DTO
- GET `/api/videos/:id` → full VIT+metrics
- GET `/api/metrics/calibration` → calibration bins
- GET `/api/metrics/drift` → recent drift events
- GET `/api/pipeline/summary` → recent runs, totals
- POST `/api/admin/pipeline/control` { action: 'start'|'stop'|'retry'|'cancel' }

### Learning

- POST `/api/learning/update` → Runs trainer; returns `{ candidate: LearningModel, deltas: { accuracy, ece, auroc, brier }, trend, driftIndex }`
- POST `/api/learning/promote` → Promotes candidate to current; returns new current model
- GET `/api/learning/summary` → `LearningSummary` with `currentVersion`, optional `candidateVersion`, `lastUpdateISO`, `accuracyTrend[30]`, `driftIndex`, `ece`, `auroc`


