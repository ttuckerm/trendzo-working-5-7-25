### Rollout Runbook — A++ Recommender

Flags
- Primary: `algo_aplusplus` — toggle via `POST /api/rollout/canary { enabled }`

Preflight
- `/qa/visual` all green
- `GET /api/recs/metrics` error_rate ≤ 0.003, p95 ≤ 120ms

Canary → Switchback
- Enable for 5% traffic; monitor 2 hours
- Criteria to proceed: regret −10%+, share +5%+, AVD +5%+, error_rate ≤ 0.3%, p95 ≤ 120ms
- Switchback 50/50 for 24h; confirm ECE ≤ 0.05 and regret improvement sustained

Stop-Loss (immediate rollback)
- Regret +15% vs baseline OR ECE > 0.05 OR p95 > 150ms OR error_rate > 1%

Endpoints
- Metrics: `GET /api/recs/metrics`
- Canary toggle: `GET/POST /api/rollout/canary`

Notes
- Include headers in responses: `X-Alg-Version`, `X-Cal-Version`, `X-Explore-Id`


