# Operations Center Readiness (Objective 1)

## SLOs (defaults)
- Freshness: <= 2h
- Throughput (1h): >= 1 item
- Latency p95: <= 5s
- Error rate (1h): <= 10%

Override per module via DB/feature flags in future revisions.

## Synthetic vs Live
- If Supabase/APIFY creds are missing, endpoints return synthetic data so UI remains verifiable.
- Synthetic QA seed writes to `module_runs`/`module_logs` with `is_synthetic=true`.

## QA Seed
- Bottom Controls Bar → Run QA seed. Returns `seed_id` and populates runs/logs for all 12 modules within ~1–2s.
- Tiles turn green when SLOs pass.

## Alerts
- Alerts appear in banner. Use “View details” to Ack or Resolve. Actions are audited in `pipeline_control_actions`.

## Exports
- CSV/JSON: `/api/admin/pipeline/export.(csv|json)`
- PDF: `/api/admin/pipeline/export.pdf` (HTML printable report)

## Runbooks
- Slide-over → Runbook tab renders markdown from `module_runbooks` (fallback provided if missing).
