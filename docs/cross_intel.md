### Cross-Platform Intelligence

Objective: Track TikTok→Instagram→YouTube cascades, compute lag metrics, predict cross-platform virality, and expose UI + proof tile.

Matching and Identity (src/lib/cross/identity.ts):
- normalizeHandle('@User.Name') → 'username'
- videoSignature(vit): textSig from caption tokens (top informative), audioSig from audio.id or caption hash, durationBucket
- isSameVideo(a,b): heuristic on textSig/audioSig/duration

Cascades (src/lib/cross/cascade.ts):
- Groups videos by signature and creator in 30d window; builds nodes array
- Computes lags (TT→IG, IG→YT, TT→YT), leader platform, per-video viral flag and 48h views
- crossSR computed from template success in window

Prediction (src/lib/cross/predict.ts):
- Deterministic logistic-style scorer with features: leader platform, templateId, niche, duration bucket, early velocity, creator baseline, historical crossSR
- Returns probIG, probYT, confidence from signal count, and recommended repost windows

Service (src/lib/cross/service.ts):
- buildCascades(...) with 10m TTL LRU; in MOCK=1, writes/reads fixtures and seeds ≥20 cascades
- predictForSeed persists last prediction to fixtures
- summarize() produces aggregates (topLeader, avg lags, crossSR by template)

APIs:
- GET /api/cross/cascades?window=30d&niche=&creator=
- POST /api/cross/predict { platform, videoId?, templateId?, niche? }
- GET /api/cross/summary

UI (/admin/cross-intel):
- Cascades board with leader, lags, viral badges
- Predict panel (seed video or template), outputs probs and recommended window
- Insights cards with aggregates

Proof Tile (#8):
- PASS when cascades ≥ 20, predict returns probs + window, and summary aggregates are non-empty

Go-live plan:
- Replace mock fixtures by keeping buildCascades pipeline reading unified source; existing getSource() handles safe fallback to mock
- Optional: enrich identity matching using transcript/text fingerprints and audio metadata for higher precision


