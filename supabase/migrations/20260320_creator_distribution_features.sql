-- Add creator + distribution signal columns to training_features
-- These are sourced from scraped_videos and will be used for future model retraining.
--
-- NOTE: meta_creator_followers and meta_creator_followers_log already exist
-- from the metadata extractor. These new columns use the explicit naming
-- convention (creator_* / post_*) for the model feature namespace.

ALTER TABLE training_features
  ADD COLUMN IF NOT EXISTS creator_followers_count NUMERIC,
  ADD COLUMN IF NOT EXISTS creator_followers_log NUMERIC,
  ADD COLUMN IF NOT EXISTS post_hour_utc INTEGER,
  ADD COLUMN IF NOT EXISTS post_day_of_week INTEGER,
  ADD COLUMN IF NOT EXISTS is_original_sound INTEGER;

COMMENT ON COLUMN training_features.creator_followers_count IS 'Raw follower count at scrape time (from scraped_videos.creator_followers_count)';
COMMENT ON COLUMN training_features.creator_followers_log IS 'log10(creator_followers_count + 1) for model use';
COMMENT ON COLUMN training_features.post_hour_utc IS 'Hour of day posted (0-23 UTC, from scraped_videos.upload_timestamp)';
COMMENT ON COLUMN training_features.post_day_of_week IS 'Day of week posted (0=Monday, 6=Sunday, from scraped_videos.upload_timestamp)';
COMMENT ON COLUMN training_features.is_original_sound IS '1 if creator made the sound, 0 if used existing (from scraped_videos.is_original_sound)';
