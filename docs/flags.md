### Feature Flags & Kill-Switch

- Server API: `GET /api/flags` (ETag/If-None-Match), `POST /api/flags { name, enabled, audience? }`
- Flags: `telemetry_ingest`, `federated_training`, `branches_longform3m`, `branches_carousel`, `attribution_pixel`, `leaderboard`.
- Server evaluator: `src/lib/flags.ts` with in-process cache and ETag.
- UI: `/admin/operations-center` → Controls tab (`[data-testid='flags-table']`).
- Enforcement: APIs gate by `evaluateFlag(...)` and return 403 `feature_disabled`.
- Audit: `updated_by`, `updated_at` tracked in `flag` table.
- Runbook: Toggle via UI or `curl -XPOST /api/flags -d '{"name":"leaderboard","enabled":true}'`.


