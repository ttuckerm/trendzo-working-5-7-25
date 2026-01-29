### Ingestion & Cron Flow

1) Apify → Edge Function `apify-ingest`
- Validates payload, computes dedupe signatures, upserts `videos`, seeds `video_metrics`(1h), logs `cost_ledger`.
- Schedules metrics refresh via RPC.

2) Metrics Refresh (pg_cron or function)
- `refresh_video_metrics` recomputes windowed aggregates and refreshes `mv_video_metrics_48h`.

3) Validation Rollup (pg_cron)
- `run_validation_rollup` calls `compute_viral_label` for videos past 48h and `recompute_calibration_bins`, refreshes `mv_accuracy_summary`.

4) UI/API
- `/api/videos`, `/api/videos/:id`, `/api/metrics/calibration`, `/api/metrics/drift`, `/api/pipeline/summary`, `/api/admin/pipeline/control`.


