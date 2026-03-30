-- Migration: Create user_channels table for TikTok channel verification data
-- Part of onboarding workflow — stores verified channel metrics for prediction context

CREATE TABLE IF NOT EXISTS user_channels (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,

  -- Channel identity
  platform text NOT NULL DEFAULT 'tiktok',
  username text NOT NULL,
  display_name text,
  avatar_url text,
  bio text,

  -- Verified metrics (from Apify profile scrape)
  follower_count integer,
  following_count integer,
  video_count integer,

  -- Computed from recent videos
  recent_video_count integer,
  avg_views numeric,
  avg_likes numeric,
  avg_comments numeric,
  avg_engagement_rate numeric,

  -- Niche inference
  inferred_niche_key text,
  inferred_niche_confidence numeric,
  top_hashtags text[],

  -- Raw Apify response for future-proofing
  raw_author_meta jsonb,

  -- Timestamps
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- One channel per user per platform (allows future YouTube/IG)
  CONSTRAINT user_channels_user_platform_unique UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_user_channels_user_id ON user_channels(user_id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_user_channels_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_channels_updated_at
  BEFORE UPDATE ON user_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_user_channels_updated_at();
