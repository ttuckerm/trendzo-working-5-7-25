# Phase 82: Training Ingest v1 — Verification Checklist

## 1. Database Migration

Run in Supabase SQL Editor:

```sql
-- Verify metric_check_schedule table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'metric_check_schedule'
ORDER BY ordinal_position;

-- Verify unique constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'metric_check_schedule';

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'metric_check_schedule';

-- Verify prediction_runs new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'prediction_runs'
  AND column_name IN ('source', 'source_meta');
```

Expected:
- `metric_check_schedule` has columns: id, prediction_run_id, video_id, platform, platform_video_id, check_type, scheduled_at, status, actual_metrics, completed_at, created_at
- UNIQUE constraint on (prediction_run_id, check_type)
- Indexes: idx_metric_schedule_status, idx_metric_schedule_run
- `prediction_runs.source` TEXT DEFAULT 'manual'
- `prediction_runs.source_meta` JSONB

## 2. Feature Flag Off

```bash
# Set TRAINING_INGEST_ENABLED=false in .env.local, restart dev server
curl -X POST http://localhost:3000/api/admin/training-ingest \
  -F "videoFile=@test.mp4" \
  -F "niche=side_hustles" \
  -F "goal=engagement" \
  -F "accountSize=small (0-10K)"
```

Expected: HTTP 403 `{ "error": "Training ingest is not enabled" }`

## 3. Ingest Flow

```bash
# With TRAINING_INGEST_ENABLED=true
curl -X POST http://localhost:3000/api/admin/training-ingest \
  -F "videoFile=@test.mp4" \
  -F "transcript=This is a test video about side hustles" \
  -F "niche=side_hustles" \
  -F "goal=engagement" \
  -F "accountSize=small (0-10K)" \
  -F "platform=tiktok" \
  -F "platformVideoId=1234567890"
```

Expected response:
```json
{
  "run_id": "<uuid>",
  "video_id": "<uuid>",
  "schedule_count": 4,
  "platform_video_id_attached": true
}
```

Verify in DB:
```sql
-- Check prediction_runs has source='training_ingest'
SELECT id, source, source_meta FROM prediction_runs
WHERE source = 'training_ingest' ORDER BY created_at DESC LIMIT 1;

-- Check 4 schedule rows created
SELECT * FROM metric_check_schedule
WHERE prediction_run_id = '<run_id from above>';
```

## 4. Idempotent Schedules

Run the same ingest again or upsert manually. The UNIQUE(prediction_run_id, check_type) constraint should prevent duplicates:

```sql
-- Should always be exactly 4 rows per run
SELECT prediction_run_id, COUNT(*) as cnt
FROM metric_check_schedule
GROUP BY prediction_run_id
HAVING COUNT(*) > 4;
```

Expected: Empty result set (no run has more than 4 schedules).

## 5. Attach Platform ID

```bash
curl -X POST http://localhost:3000/api/admin/prediction-runs/<run_id>/attach-platform-id \
  -H "Content-Type: application/json" \
  -d '{"platform":"tiktok","platform_video_id":"7890123456"}'
```

Expected: `{ "updated_count": 4 }` (or fewer if some already had platform_video_id)

## 6. List Recent Runs

```bash
curl http://localhost:3000/api/admin/prediction-runs
```

Expected: Array of training runs with schedule summaries, NO prediction internals (no DPS, tier, confidence, components).

## 7. Manual Mode Unchanged

- Navigate to `/admin/upload-test`
- Upload a video using the standard form (not Training Ingest section)
- Submit to `/api/kai/predict`
- Verify full prediction results (DPS, tier, confidence, packs) are displayed as before

## 8. Contamination Safety

```bash
# Verify actual_metrics is never referenced in feature extraction
grep -r "actual_metrics" src/lib/services/training/feature-extractor.ts
grep -r "actual_metrics" src/lib/services/feature-extraction/
```

Expected: No matches. The `actual_metrics` JSONB column in `metric_check_schedule` is never read by feature extraction code.

## 9. UI Verification

1. Navigate to `/admin/upload-test`
2. Scroll to bottom — "Training Ingest" section should appear (indigo/purple themed)
3. Click to expand
4. Upload a video, fill niche/account size, optionally enter platform video ID
5. Click "Ingest for Training"
6. Confirm response shows: run_id, video_id, schedule_count — NO scores/tiers
7. "Recent Training Runs" table should populate
8. Click "Attach ID" on a run without platform_video_id, enter ID, save
