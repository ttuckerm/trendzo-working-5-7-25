-- Creator Personalization System
-- Enables individualized predictions based on each creator's unique baseline

-- =====================================================
-- Table: creator_profiles
-- Stores creator baseline metrics and content analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Creator identification
  tiktok_username TEXT NOT NULL UNIQUE,
  channel_url TEXT NOT NULL,

  -- Channel statistics
  total_videos INTEGER NOT NULL DEFAULT 0,
  avg_views DECIMAL(12,2) NOT NULL DEFAULT 0,
  avg_likes DECIMAL(12,2) NOT NULL DEFAULT 0,
  avg_comments DECIMAL(12,2) NOT NULL DEFAULT 0,
  avg_shares DECIMAL(12,2) NOT NULL DEFAULT 0,
  avg_saves DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Performance baseline
  baseline_dps DECIMAL(5,2) NOT NULL DEFAULT 0,
  baseline_engagement_rate DECIMAL(6,4) NOT NULL DEFAULT 0,

  -- Content analysis
  content_style JSONB NOT NULL DEFAULT '{}',
  -- Format: { "primary_niche": "business", "video_styles": ["talking_head", "b_roll"], "avg_duration": 45 }

  strengths JSONB NOT NULL DEFAULT '[]',
  -- Format: ["high_energy_audio", "fast_editing", "strong_hooks"]

  weaknesses JSONB NOT NULL DEFAULT '[]',
  -- Format: ["low_text_overlay_usage", "inconsistent_posting"]

  -- Video distribution (percentiles)
  dps_percentiles JSONB NOT NULL DEFAULT '{}',
  -- Format: { "p25": 30, "p50": 45, "p75": 60, "p90": 75 }

  -- Scraping metadata
  last_scraped_at TIMESTAMPTZ,
  videos_analyzed INTEGER NOT NULL DEFAULT 0,
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'scraping' | 'analyzing' | 'complete' | 'failed'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_profiles_username ON creator_profiles(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_status ON creator_profiles(analysis_status);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_updated ON creator_profiles(updated_at DESC);

-- =====================================================
-- Table: creator_video_history
-- Links scraped videos to creator profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS creator_video_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  creator_profile_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,
  prediction_id UUID REFERENCES prediction_events(id) ON DELETE SET NULL,

  -- TikTok metadata
  tiktok_video_id TEXT NOT NULL,
  tiktok_url TEXT NOT NULL,

  -- Actual metrics (scraped)
  actual_views INTEGER NOT NULL,
  actual_likes INTEGER NOT NULL,
  actual_comments INTEGER NOT NULL,
  actual_shares INTEGER NOT NULL,
  actual_saves INTEGER NOT NULL,

  -- Calculated DPS
  actual_dps DECIMAL(5,2) NOT NULL,
  actual_engagement_rate DECIMAL(6,4) NOT NULL,

  -- Video metadata
  duration_seconds INTEGER,
  posted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_creator_video UNIQUE(creator_profile_id, tiktok_video_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_video_history_creator ON creator_video_history(creator_profile_id);
CREATE INDEX IF NOT EXISTS idx_creator_video_history_video ON creator_video_history(video_id);
CREATE INDEX IF NOT EXISTS idx_creator_video_history_dps ON creator_video_history(actual_dps DESC);
CREATE INDEX IF NOT EXISTS idx_creator_video_history_posted ON creator_video_history(posted_at DESC);

-- =====================================================
-- Function: calculate_creator_baseline
-- Calculates baseline metrics from video history
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_creator_baseline(p_creator_profile_id UUID)
RETURNS void AS $$
DECLARE
  v_avg_views DECIMAL;
  v_avg_likes DECIMAL;
  v_avg_comments DECIMAL;
  v_avg_shares DECIMAL;
  v_avg_saves DECIMAL;
  v_avg_dps DECIMAL;
  v_avg_engagement DECIMAL;
  v_total_videos INTEGER;
  v_p25 DECIMAL;
  v_p50 DECIMAL;
  v_p75 DECIMAL;
  v_p90 DECIMAL;
BEGIN
  -- Calculate averages
  SELECT
    AVG(actual_views),
    AVG(actual_likes),
    AVG(actual_comments),
    AVG(actual_shares),
    AVG(actual_saves),
    AVG(actual_dps),
    AVG(actual_engagement_rate),
    COUNT(*)
  INTO
    v_avg_views,
    v_avg_likes,
    v_avg_comments,
    v_avg_shares,
    v_avg_saves,
    v_avg_dps,
    v_avg_engagement,
    v_total_videos
  FROM creator_video_history
  WHERE creator_profile_id = p_creator_profile_id;

  -- Calculate DPS percentiles
  SELECT
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY actual_dps),
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY actual_dps),
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY actual_dps),
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY actual_dps)
  INTO v_p25, v_p50, v_p75, v_p90
  FROM creator_video_history
  WHERE creator_profile_id = p_creator_profile_id;

  -- Update creator profile
  UPDATE creator_profiles
  SET
    total_videos = v_total_videos,
    avg_views = v_avg_views,
    avg_likes = v_avg_likes,
    avg_comments = v_avg_comments,
    avg_shares = v_avg_shares,
    avg_saves = v_avg_saves,
    baseline_dps = v_avg_dps,
    baseline_engagement_rate = v_avg_engagement,
    dps_percentiles = jsonb_build_object(
      'p25', v_p25,
      'p50', v_p50,
      'p75', v_p75,
      'p90', v_p90
    ),
    videos_analyzed = v_total_videos,
    updated_at = NOW()
  WHERE id = p_creator_profile_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE creator_profiles IS 'Creator baseline metrics for personalized predictions';
COMMENT ON TABLE creator_video_history IS 'Historical video performance linked to creator profiles';
COMMENT ON FUNCTION calculate_creator_baseline IS 'Recalculates creator baseline from video history';
