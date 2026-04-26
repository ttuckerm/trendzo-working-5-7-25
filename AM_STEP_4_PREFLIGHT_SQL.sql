-- AM Step 4 Pre-flight 5: confirm there are unacknowledged briefs older than 24h
-- that the new route would actually act on. If 0, the dry-run test will be useless.
--
-- Run in the Supabase browser SQL Editor and paste the single-row result back to Cursor.
-- Expected: eligible_briefs >= 1. If 0, STOP — there's nothing for the route to act on.

SELECT
  COUNT(*) AS eligible_briefs,
  COUNT(*) FILTER (WHERE last_nudged_at IS NULL) AS never_nudged,
  COUNT(*) FILTER (WHERE nudge_count >= 3) AS at_cap
FROM content_briefs
WHERE completion_status = 'delivered'
  AND delivered_at IS NOT NULL
  AND delivered_at < NOW() - INTERVAL '24 hours'
  AND agency_id IS NOT NULL;
