# Phase 83: Metric Collection v1 (TikTok) — Verification Checklist

## 1. Feature Flag Gate

```bash
# Set METRIC_COLLECTOR_ENABLED=false in .env.local, restart dev server
curl -X POST http://localhost:3000/api/admin/metric-collector/run \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: HTTP 403 `{ "error": "Metric collector is not enabled (METRIC_COLLECTOR_ENABLED=false)" }`

## 2. Dry Run — No Side Effects

```bash
curl -X POST http://localhost:3000/api/admin/metric-collector/run \
  -H "Content-Type: application/json" \
  -d '{ "dry_run": true, "limit": 5 }'
```

Expected:
```json
{
  "processed": <N>,
  "succeeded": 0,
  "failed": 0,
  "skipped": <N>,
  "dry_run": true,
  "details": [{ "schedule_id": "...", "status": "skipped", ... }]
}
```

Verify no `metric_check_schedule` rows were updated:
```sql
SELECT id, status, actual_metrics, completed_at
FROM metric_check_schedule
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '5 minutes';
-- Should return 0 rows (if no prior collection)
```

## 3. Live Collection — Single Run

```bash
# Collect metrics for a specific run
curl -X POST http://localhost:3000/api/admin/metric-collector/run \
  -H "Content-Type: application/json" \
  -d '{ "run_id": "<prediction_run_id>", "limit": 2 }'
```

Expected (if schedules are due and have platform_video_id):
```json
{
  "processed": 2,
  "succeeded": 2,
  "failed": 0,
  "skipped": 0,
  "dry_run": false,
  "details": [
    {
      "schedule_id": "...",
      "prediction_run_id": "...",
      "check_type": "4h",
      "platform_video_id": "...",
      "status": "completed",
      "metrics": { "views": 12345, "likes": 678, ... }
    }
  ]
}
```

## 4. Verify Row Updates in Database

```sql
-- Check completed schedules have actual_metrics populated
SELECT id, check_type, status, actual_metrics, completed_at
FROM metric_check_schedule
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- Verify actual_metrics has expected shape
SELECT id,
  actual_metrics->>'views' AS views,
  actual_metrics->>'likes' AS likes,
  actual_metrics->>'comments' AS comments,
  actual_metrics->>'shares' AS shares,
  actual_metrics->>'collected_at' AS collected_at,
  actual_metrics->>'source' AS source
FROM metric_check_schedule
WHERE status = 'completed' AND actual_metrics IS NOT NULL
LIMIT 5;
```

Expected: `source = 'apify'`, numeric view/like/comment/share counts, ISO timestamp for `collected_at`.

## 5. Failed Schedules Store Error

```sql
-- Check failed schedules have error details
SELECT id, check_type, status,
  actual_metrics->>'error' AS error_msg,
  actual_metrics->>'attempted_at' AS attempted_at
FROM metric_check_schedule
WHERE status = 'failed' AND actual_metrics IS NOT NULL
LIMIT 5;
```

Expected: `error_msg` contains a human-readable error, `attempted_at` has an ISO timestamp.

## 6. Schedule Query Conditions

Only schedules matching ALL of these conditions should be processed:
```sql
-- These are the exact conditions the collector uses:
SELECT COUNT(*)
FROM metric_check_schedule
WHERE status IN ('pending', 'failed')
  AND scheduled_at <= NOW()
  AND platform = 'tiktok'
  AND platform_video_id IS NOT NULL;
```

Schedules without `platform_video_id` are correctly skipped (need Attach ID first).

## 7. Contamination Firewall

```bash
# Verify actual_metrics is NEVER referenced in feature extraction
grep -r "actual_metrics" C:/Projects/CleanCopy/src/lib/services/training/feature-extractor.ts
grep -r "actual_metrics" C:/Projects/CleanCopy/src/lib/services/feature-extraction/
grep -r "actual_metrics" C:/Projects/CleanCopy/src/lib/prediction/
```

Expected: No matches. `actual_metrics` lives only in `metric_check_schedule` and is only read/written by the metric collector.

## 8. Detail Endpoint

```bash
# Fetch training runs with full schedule detail
curl http://localhost:3000/api/admin/prediction-runs?detail=true
```

Expected: Each run includes `schedule_rows` array with full schedule data including `actual_metrics`, `check_type`, `status`, `completed_at`.

## 9. Rate Limiting

The collector has a 2-second pause between Apify calls. Verify via server logs:

```
[MetricCollector] Starting batch (limit=10, dryRun=false)
[MetricCollector] Found 3 due schedule(s)
[TikTokMetrics] Fetching metrics for: https://www.tiktok.com/@user/video/123...
[TikTokMetrics] Got metrics: 12345 views, 678 likes, ...
[MetricCollector] Completed 4h for run abc-123: 12345 views
  <2s pause>
[TikTokMetrics] Fetching metrics for: ...
```

## 10. UI Verification

1. Navigate to `/admin/upload-test`
2. Scroll to Training Ingest section
3. Verify "Run Metric Collector Now" button appears (chairman-only)
4. Click it — should show results (processed, succeeded, failed counts)
5. Expand a training run row — schedule detail rows should show:
   - Check type (4h, 24h, 48h, 7d)
   - Status badge (pending/completed/failed)
   - Actual metrics if collected (views, likes, etc.)
6. Per-run "Collect Now" button should trigger collection for that specific run only

## Files Created/Modified (Phase 83)

| File | Action |
|------|--------|
| `src/lib/training/feature-availability-matrix.ts` | Added `METRIC_COLLECTOR_ENABLED()` |
| `src/lib/training/training-ingest-types.ts` | Added collector + fetcher types |
| `src/lib/training/tiktok-metric-fetcher.ts` | **NEW** — Single-video TikTok metric fetcher |
| `src/lib/training/metric-collector.ts` | **NEW** — Batch metric collector |
| `src/app/api/admin/metric-collector/run/route.ts` | **NEW** — POST endpoint |
| `src/app/api/admin/prediction-runs/route.ts` | Updated with `?detail=true` + `failed` count |
| `src/app/admin/upload-test/page.tsx` | Added collector UI controls + schedule detail |
| `.env.local` | Added `METRIC_COLLECTOR_ENABLED=true` + `NEXT_PUBLIC_METRIC_COLLECTOR_ENABLED=true` |
