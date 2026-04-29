-- AM Step 3 — Pre-flight 4 verification.
-- Run this in the Supabase browser SQL Editor and paste the result back to Cursor.
-- Expected: `delivered` is the largest non-null bucket. If `delivered` is 0 or
-- near-zero, STOP — building UI on an empty state is not worth shipping today.

SELECT completion_status, COUNT(*) AS rows
FROM content_briefs
WHERE agency_id IS NOT NULL
GROUP BY completion_status
ORDER BY completion_status;
