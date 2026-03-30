-- ============================================================================
-- Normalize niche spelling: side_hustles → side-hustles
-- ============================================================================
-- The canonical niche key is hyphenated (system-registry.ts convention).
-- video_files has a mix of 'side_hustles' (215 rows) and 'side-hustles' (125).
-- scraped_videos already uses 'side-hustles' exclusively.
-- This one-time UPDATE unifies video_files to the canonical spelling.
--
-- Idempotent: only touches rows with the underscore variant.
-- Date: 2026-03-25
-- ============================================================================

UPDATE video_files
SET niche = 'side-hustles'
WHERE niche = 'side_hustles';

-- Verify
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM video_files WHERE niche = 'side_hustles';
  IF remaining > 0 THEN
    RAISE WARNING 'UNEXPECTED: % rows still have side_hustles', remaining;
  ELSE
    RAISE NOTICE 'Normalization complete: 0 rows with side_hustles remain';
  END IF;
END $$;
