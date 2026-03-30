### Observability & SLOs

- Metrics endpoint: `GET /api/ops/metrics` returns Prometheus text with gauges for p95 latency and error rate.
- Health: `GET /api/ops/health` returns JSON with `status`, `open_incidents`, `degraded_services`.
- Logs: ensure structured logs with request_id correlation (pino or console JSON).
- UI: `/admin/operations-center` → Observability tab with `[data-testid='slo-cards']`, `[data-testid='ratelimit-widget']`, `[data-testid='quota-widget']`, `[data-testid='synthetic-status']`.
- SLOs: p95 ≤ 500ms, error rate ≤ 1%. Cards flag breaches.


