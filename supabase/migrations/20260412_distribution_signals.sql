-- Distribution signals for VPS prediction training
-- Adds post timing, hashtag strategy, sound classification, and engagement velocity
-- All columns nullable — existing rows backfilled where possible

-- ═══ Post timing ═══
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS posted_hour_utc integer;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS posted_day_of_week integer;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS posted_days_since_epoch integer;

-- ═══ Hashtag strategy ═══
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS hashtag_count integer;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS hashtag_niche_count integer;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS hashtag_trending_count integer;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS has_fyp_hashtag boolean;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS hashtag_specificity_score double precision;

-- ═══ Sound/audio classification ═══
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS sound_is_trending boolean;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS sound_type text;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS sound_age_days integer;

-- ═══ Engagement velocity (early signals) ═══
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS views_at_1h bigint;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS views_at_24h bigint;
ALTER TABLE scraped_videos ADD COLUMN IF NOT EXISTS shares_at_24h bigint;

-- ═══ Backfill post timing from upload_timestamp ═══
UPDATE scraped_videos
SET
  posted_hour_utc = EXTRACT(HOUR FROM upload_timestamp AT TIME ZONE 'UTC')::integer,
  posted_day_of_week = (EXTRACT(ISODOW FROM upload_timestamp AT TIME ZONE 'UTC')::integer - 1),
  posted_days_since_epoch = (EXTRACT(EPOCH FROM upload_timestamp) / 86400)::integer
WHERE upload_timestamp IS NOT NULL
  AND posted_hour_utc IS NULL;

-- ═══ Backfill hashtag data from hashtags array ═══
UPDATE scraped_videos
SET
  hashtag_count = COALESCE(array_length(hashtags, 1), 0),
  has_fyp_hashtag = EXISTS (
    SELECT 1 FROM unnest(hashtags) AS h
    WHERE lower(h) IN ('fyp', 'foryou', 'foryoupage', 'viral', 'trending')
  )
WHERE hashtags IS NOT NULL
  AND hashtag_count IS NULL;

-- ═══ Backfill sound_type (safe — checks if source columns exist first) ═══
DO $$
BEGIN
  -- Try music_is_original + music_id first (original schema columns)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_videos' AND column_name = 'music_is_original'
  ) THEN
    EXECUTE '
      UPDATE scraped_videos
      SET sound_type = CASE
        WHEN music_is_original = true THEN ''original''
        WHEN music_id IS NOT NULL THEN ''licensed''
        ELSE ''unknown''
      END
      WHERE sound_type IS NULL
        AND (music_is_original IS NOT NULL OR music_id IS NOT NULL)';
  -- Fallback: try is_original_sound + sound_id (20260308 migration columns)
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scraped_videos' AND column_name = 'is_original_sound'
  ) THEN
    EXECUTE '
      UPDATE scraped_videos
      SET sound_type = CASE
        WHEN is_original_sound = true THEN ''original''
        WHEN sound_id IS NOT NULL THEN ''licensed''
        ELSE ''unknown''
      END
      WHERE sound_type IS NULL
        AND (is_original_sound IS NOT NULL OR sound_id IS NOT NULL)';
  END IF;
  -- If neither column exists, sound_type stays NULL for old rows — that's fine
END $$;

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_scraped_videos_posted_hour
  ON scraped_videos (posted_hour_utc)
  WHERE posted_hour_utc IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scraped_videos_has_fyp
  ON scraped_videos (has_fyp_hashtag)
  WHERE has_fyp_hashtag IS NOT NULL;
