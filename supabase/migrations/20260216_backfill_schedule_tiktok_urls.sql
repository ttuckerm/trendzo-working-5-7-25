-- Backfill metric_check_schedule.platform_video_id with real TikTok URLs
-- from prediction_runs.source_meta for rows where platform_video_id is
-- NULL or contains an internal UUID instead of a TikTok URL.
--
-- UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
-- Real TikTok URLs start with 'http' or are 15-25 digit numeric IDs.

UPDATE metric_check_schedule mcs
SET platform_video_id = COALESCE(
  pr.source_meta->>'post_url',
  pr.source_meta->>'platform_url',
  CASE
    WHEN (pr.source_meta->>'platformVideoId') IS NOT NULL
     AND (pr.source_meta->>'platformVideoId') ~ '^https?://'
    THEN pr.source_meta->>'platformVideoId'
    WHEN (pr.source_meta->>'platformVideoId') IS NOT NULL
     AND (pr.source_meta->>'platformVideoId') ~ '^\d{15,25}$'
    THEN pr.source_meta->>'platformVideoId'
    ELSE NULL
  END
)
FROM prediction_runs pr
WHERE mcs.prediction_run_id = pr.id
  AND mcs.platform = 'tiktok'
  AND (
    mcs.platform_video_id IS NULL
    OR mcs.platform_video_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
  AND (
    pr.source_meta->>'post_url' IS NOT NULL
    OR pr.source_meta->>'platform_url' IS NOT NULL
    OR (
      (pr.source_meta->>'platformVideoId') IS NOT NULL
      AND (
        (pr.source_meta->>'platformVideoId') ~ '^https?://'
        OR (pr.source_meta->>'platformVideoId') ~ '^\d{15,25}$'
      )
    )
  );
