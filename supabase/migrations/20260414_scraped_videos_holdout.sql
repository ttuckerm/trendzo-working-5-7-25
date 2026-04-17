-- Stratified evaluation holdout for scraped_videos
-- Adds flags used by the holdout designation function to permanently lock
-- 200 videos as the model-evaluation set. Rows marked is_holdout = true
-- must never be used as training data.

ALTER TABLE scraped_videos
  ADD COLUMN IF NOT EXISTS is_holdout BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS holdout_locked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_is_holdout
  ON scraped_videos (is_holdout);

COMMENT ON COLUMN scraped_videos.is_holdout IS
  'Holdout videos for model evaluation. Never train on these.';

COMMENT ON COLUMN scraped_videos.holdout_locked_at IS
  'Timestamp the row was locked into the evaluation holdout set.';
