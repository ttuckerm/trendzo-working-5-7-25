-- Pre-scrape top creators per niche for training data matching
-- Infrastructure only — no prediction pipeline integration yet

CREATE TABLE IF NOT EXISTS niche_top_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  niche_key TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  follower_count BIGINT,
  avg_views BIGINT,
  avg_engagement_rate DOUBLE PRECISION,
  top_video_ids TEXT[] DEFAULT '{}',
  sample_video_count INT DEFAULT 0,
  last_scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT niche_top_creators_unique UNIQUE (niche_key, creator_username, platform)
);

-- Fast lookup by niche
CREATE INDEX IF NOT EXISTS idx_niche_top_creators_niche_key
  ON niche_top_creators(niche_key);

-- For staleness queries
CREATE INDEX IF NOT EXISTS idx_niche_top_creators_last_scraped
  ON niche_top_creators(last_scraped_at);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_niche_top_creators_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER niche_top_creators_updated_at
  BEFORE UPDATE ON niche_top_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_niche_top_creators_updated_at();
