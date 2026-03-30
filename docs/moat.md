## Moat Mechanics

### Keys, Plans, Quotas

- Plans: `free` (30 rpm / 1k rpd), `pro` (120 rpm / 10k rpd), `enterprise` (600 rpm / 100k rpd)
- Keys file: `fixtures/keys/keys.json` (atomic writes). Key records store `keyId`, salted `keyHash`, plan, limits, usage counters and rotations.
- Hashing: Node HMAC-SHA256 with salt from `KEY_SALT` (fallback to `ADMIN_TOKEN`). Plaintext shown once at issuance/rotation.
- Admin API (header `x-admin-token: ${ADMIN_TOKEN}`):
  - POST `/api/admin/keys/issue` { plan } → { keyId, keyLast4, plan, limits, plaintext }
  - POST `/api/admin/keys/rotate` { keyId } → { keyId, keyLast4, plaintext }
  - POST `/api/admin/keys/revoke` { keyId } → { ok }
  - GET `/api/admin/keys/list` → masked list with limits and usage

### Feature Flags

- Flags file: `fixtures/flags.json` with `{ publicApi: true, insights: true }` (atomic writes)
- Admin: POST `/api/admin/flags/set` { name, value }

### Rate Limiting

- Token bucket per key (in-memory) for RPM; persisted counters in `fixtures/keys/usage.json` for RPM/RPD windows.
- Enforcement returns 429 with `{ ok:false, message:'rate_limited_rpm|rate_limited_rpd' }`.

### Public API (MOCK-friendly)

- All endpoints require key via `x-api-key` unless flag is disabled.
- GET `/api/public/v1/recipe-book?window=30d&platform=&niche=` → same shape as internal generator; falls back to fixtures when live fails.
- POST `/api/public/v1/analyze` { scriptText?, caption?, platform, niche, durationSec?, videoUrl? } → same shape as internal `/api/analyze`, RPM/RPD metered.
- GET `/api/public/v1/insights/unique?n=50` → `{ items: InsightItem[] }` top-N unique-lift insights.

### Insights Criteria

- Dimensions: templateId × niche × durationBucket × captionSignal
- Metrics: support ≥ 30, Δ vs baseline ≥ +8pp, PMI ≥ 0.2
- Source: `fixtures/videos.json` (auto-seeded in MOCK)

### Benchmark

- GET `/api/benchmark/report` → { current, baseline, deltas }
- Metrics: accuracy, AUROC, ECE, Brier, P@100, coverage at FPR≤3%

### Demo and Acceptance (MOCK=1)

1) Issue a key:
```bash
curl -s -X POST -H "x-admin-token: $ADMIN_TOKEN" -H "content-type: application/json" \
  -d '{"plan":"free"}' http://localhost:3000/api/admin/keys/issue
```
2) Use key:
```bash
curl -s -H "x-api-key: $KEY" http://localhost:3000/api/public/v1/recipe-book
curl -s -H "x-api-key: $KEY" http://localhost:3000/api/public/v1/insights/unique
```
3) Rate-limit: burst multiple times within a minute to observe at least one 429.
4) Benchmark: `GET /api/benchmark/report` never returns 500.
5) Admin UI: `/admin/moat` to manage keys, flags, view insights and benchmark.


