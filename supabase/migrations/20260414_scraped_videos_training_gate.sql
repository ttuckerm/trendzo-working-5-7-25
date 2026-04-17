-- Training eligibility gate for scraped_videos
-- Adds flags used by the scraped-video data quality gate to exclude
-- low-quality rows from training and holdout selection.

ALTER TABLE scraped_videos
  ADD COLUMN IF NOT EXISTS training_eligible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS training_disqualified_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_training_eligible
  ON scraped_videos (training_eligible);

COMMENT ON COLUMN scraped_videos.training_eligible IS
  'Set false by data quality gate. Excluded from training and holdout selection.';

COMMENT ON COLUMN scraped_videos.training_disqualified_reason IS
  'Reason this row was excluded by the scraped-video data quality gate (e.g. no_dps_score, followers_below_1k, high_null_rate)';
