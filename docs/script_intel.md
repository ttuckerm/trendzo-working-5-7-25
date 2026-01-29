## Script Intelligence

Implements deterministic, non-LLM script analysis and generation.

### Patterns Library
- Location: `src/lib/script/patterns.ts`
- 16+ canonical patterns with `id`, `name`, `description`, `hookTemplates`, `bodyTemplates`, detection `signals`, and `platformFits`.

### Feature Extraction
- Location: `src/lib/script/features.ts`
- Outputs counts (words/sentences/questions/numbers), readability, sentiment-lite, CTA/before-after/myth-truth/POV flags, unique n-grams.

### Pattern Matching
- Location: `src/lib/script/match.ts`
- Deterministic rules map features to top 1–3 patterns.

### Scoring
- Location: `src/lib/script/score.ts`
- Subscores: Hook, Clarity, Pacing, Novelty, Platform Fit, CTA. Blends with learning model weights and applies calibration.

### Generation
- Location: `src/lib/script/generate.ts`
- Deterministic composition chooses a pattern and fills placeholders from the seed idea and tone.

### Edit Operations
- Location: `src/lib/script/edit.ts`
- Deterministic transforms: shorten, rephrase, reorder, insertCTA, numberize, questionize.

### Recommendations
- Location: `src/lib/script/recommend.ts`
- Produces concrete edit suggestions based on features and platform.

### Metrics
- Location: `src/lib/script/metrics.ts`
- Computes per-pattern SR% table; in MOCK uses `fixtures/scripts/metrics.json` or synthesizes ≥5 rows.

### Storage
- Location: `src/lib/script/store.ts`
- Append/read NDJSON under `fixtures/scripts/` with atomic temp+rename.

### APIs
- `POST /api/script/analyze` → `{ probScript, confidence, breakdown, matchedPatterns, features, recommendations }` and appends analysis in MOCK.
- `POST /api/script/generate` → `{ id, patternId, hook, body, cta, durationEstimateSec, matchedPatterns }` and appends draft in MOCK.
- `GET /api/script/patterns` → pattern list plus optional SR% from recipe book.
- `GET /api/script/metrics` → `{ byPattern, overall }`.
- Integration: `/api/analyze` blends script-only probability into overall probability and returns `script` block.

### UI
- Page: `/admin/script-intel` with Generator and Analyzer panels, recommendations with one-click “Apply”, and links to Instant Analysis.

### Proof Tiles
- In MOCK, Objective #6 marked PASS when `/api/script/generate` and `/api/script/analyze` work and `/api/script/metrics` has ≥5 patterns.








































































































































