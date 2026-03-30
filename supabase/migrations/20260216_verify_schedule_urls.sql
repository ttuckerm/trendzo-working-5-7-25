-- Verification Query 1: Find schedules where platform_video_id is NULL or a UUID
-- These rows cannot be collected by the metric collector.
-- Run this AFTER the backfill migration to confirm all rows are fixed.

SELECT
  mcs.id AS schedule_id,
  mcs.prediction_run_id,
  mcs.check_type,
  mcs.status,
  mcs.platform_video_id,
  pr.source_meta->>'post_url' AS source_meta_post_url,
  pr.source_meta->>'platform_url' AS source_meta_platform_url,
  pr.source_meta->>'platformVideoId' AS source_meta_platformVideoId
FROM metric_check_schedule mcs
JOIN prediction_runs pr ON pr.id = mcs.prediction_run_id
WHERE mcs.platform = 'tiktok'
  AND (
    mcs.platform_video_id IS NULL
    OR mcs.platform_video_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
ORDER BY mcs.created_at DESC;

-- Verification Query 2: Show last completed schedules with views from actual_metrics
-- Confirms the metric collector is working and writing real data.

SELECT
  mcs.id AS schedule_id,
  mcs.prediction_run_id,
  mcs.check_type,
  mcs.status,
  mcs.platform_video_id,
  mcs.completed_at,
  (mcs.actual_metrics->>'views')::int AS views,
  (mcs.actual_metrics->>'likes')::int AS likes,
  (mcs.actual_metrics->>'comments')::int AS comments,
  (mcs.actual_metrics->>'shares')::int AS shares,
  mcs.actual_metrics->>'collected_at' AS collected_at,
  mcs.actual_metrics->>'source' AS source
FROM metric_check_schedule mcs
WHERE mcs.status = 'completed'
  AND mcs.actual_metrics IS NOT NULL
ORDER BY mcs.completed_at DESC
LIMIT 20;
