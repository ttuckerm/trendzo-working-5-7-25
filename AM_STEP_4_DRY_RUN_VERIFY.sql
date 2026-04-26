-- AM Step 4 dry-run verification.
-- Run AFTER hitting GET /api/cron/auto-nudge-unacknowledged with dry-run on.
-- Both blocks should produce results consistent with a dry-run (no DB mutation,
-- only platform_events rows).

-- Block 1: confirm dry-run did NOT mutate state on delivered briefs.
-- Compare these values against what they were before the curl. If
-- last_nudged_at or nudge_count changed during a dry-run, that's a bug.
SELECT id AS brief_id, last_nudged_at, nudge_count, delivered_at, completion_status
FROM content_briefs
WHERE completion_status = 'delivered'
  AND delivered_at IS NOT NULL
  AND delivered_at < NOW() - INTERVAL '24 hours'
ORDER BY delivered_at DESC
LIMIT 5;

-- Block 2: confirm platform_events received the dry-run entries.
-- Should show auto_nudge.dry_run rows whose count matches the route's
-- response.dry_run_count from the curl. If the route also flagged any
-- cap-reached briefs, you'll also see auto_nudge.escalated_dry_run rows.
SELECT event_type, COUNT(*) AS rows
FROM platform_events
WHERE event_type LIKE 'auto_nudge.%'
  AND created_at > NOW() - INTERVAL '10 minutes'
GROUP BY event_type
ORDER BY event_type;
