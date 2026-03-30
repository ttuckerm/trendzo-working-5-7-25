## Templates (Discovery Engine)

Definition: A template is the stable signature of a video’s structure and framework. We generate `templateId` as sha1 of primary framework + structure flags + platform.

Thresholds:
- HOT: successRate > 0.80 and uses >= 10
- COOLING: 0.50 ≤ successRate ≤ 0.80 and uses >= 10
- NEW: uses < 10

Windows: 7d, 30d, 90d (default 30d)

APIs:
- GET `/api/recipe-book?window=30d&platform=&niche=` → `{ generatedAtISO, counts, hot[], cooling[], newly[] }`
- POST `/api/recipe-book/generate` (optional header `x-recipe-secret`) → `{ ok, generatedAt, counts }`
- GET `/api/templates/leaderboard?window=30d&platform=&niche=&limit=100` → list of templates
- GET `/api/templates/:id` → detail with example videos

Generation:
- MOCK=1: fixtures persisted to `fixtures/recipe_book.json` and `fixtures/templates_leaderboard.json` on first generation and reused.
- MOCK=0: in-memory LRU cache (TTL 10 min) keyed by `{window, platform, niche}`.

Viral Rule: Viral iff z ≥ 2.0 AND percentile ≥ 95 within first 48h.


