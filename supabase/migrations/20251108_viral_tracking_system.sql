-- =============================================
-- VIRAL TRACKING SYSTEM - Framework 1
-- Created: 2025-11-07
-- Purpose: Support automated viral prediction tracking
-- =============================================

-- Table: tracking_checkpoints
-- Stores scheduled checkpoints for tracking video performance over time
CREATE TABLE IF NOT EXISTS tracking_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  checkpoint_time TEXT NOT NULL CHECK (checkpoint_time IN ('5min', '30min', '1hr', '4hr', '24hr', '7day')),

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Metrics at this checkpoint
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  saves INTEGER,

  -- Calculated metrics
  actual_dps DECIMAL(5,2),
  velocity DECIMAL(10,2), -- Views per hour

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT unique_checkpoint UNIQUE (video_id, checkpoint_time)
);

-- Index for finding due checkpoints
CREATE INDEX IF NOT EXISTS idx_tracking_due ON tracking_checkpoints(scheduled_for, completed)
WHERE completed = FALSE;

-- Index for video lookups
CREATE INDEX IF NOT EXISTS idx_tracking_video ON tracking_checkpoints(video_id);

-- =============================================

-- Table: viral_creators
-- List of creators to monitor for fresh content
CREATE TABLE IF NOT EXISTS viral_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  follower_count INTEGER,
  niche TEXT,
  historical_dps DECIMAL(5,2), -- Average DPS of past content

  -- Monitoring
  active BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMPTZ,
  last_video_found TIMESTAMPTZ,

  -- Stats
  videos_scraped INTEGER DEFAULT 0,
  avg_prediction_accuracy DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_creator UNIQUE (username, platform)
);

CREATE INDEX IF NOT EXISTS idx_viral_creators_active ON viral_creators(platform, active)
WHERE active = TRUE;

-- =============================================

-- Table: viral_hashtags
-- List of hashtags to monitor
CREATE TABLE IF NOT EXISTS viral_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
  niche TEXT,
  avg_dps DECIMAL(5,2), -- Average DPS of content with this hashtag

  -- Monitoring
  active BOOLEAN DEFAULT TRUE,
  last_checked TIMESTAMPTZ,

  -- Stats
  videos_found INTEGER DEFAULT 0,
  hit_rate DECIMAL(5,2), -- % of videos that were actually viral

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_hashtag UNIQUE (tag, platform)
);

CREATE INDEX IF NOT EXISTS idx_viral_hashtags_active ON viral_hashtags(platform, active)
WHERE active = TRUE;

-- =============================================

-- Enhance existing prediction_validations table
-- Add new columns for tracking workflow

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS tracking_status TEXT DEFAULT 'scheduled'
  CHECK (tracking_status IN ('scheduled', 'tracking', 'completed', 'failed'));

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS next_checkpoint TEXT;

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS initial_views INTEGER DEFAULT 0;
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS initial_likes INTEGER DEFAULT 0;
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS initial_comments INTEGER DEFAULT 0;
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS initial_shares INTEGER DEFAULT 0;

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS prediction_range_min DECIMAL(5,2);
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS prediction_range_max DECIMAL(5,2);

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS identified_patterns TEXT[];
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS models_used TEXT[];
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;

ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS final_checkpoint TEXT CHECK (final_checkpoint IN ('24hr', '7day'));
ALTER TABLE prediction_validations ADD COLUMN IF NOT EXISTS within_range BOOLEAN;

-- =============================================

-- Table: scraping_runs
-- Log of scraping cycles for monitoring
CREATE TABLE IF NOT EXISTS scraping_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Run metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),

  -- Stats
  creators_checked INTEGER DEFAULT 0,
  hashtags_checked INTEGER DEFAULT 0,
  videos_found INTEGER DEFAULT 0,
  predictions_made INTEGER DEFAULT 0,

  -- Performance
  duration_ms INTEGER,
  errors TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraping_runs_date ON scraping_runs(started_at DESC);

-- =============================================

-- Table: accuracy_metrics
-- Aggregate accuracy metrics over time
CREATE TABLE IF NOT EXISTS accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('24hr', '7day')),

  -- Sample size
  total_predictions INTEGER DEFAULT 0,

  -- Accuracy metrics
  mean_absolute_error DECIMAL(5,2),
  median_absolute_error DECIMAL(5,2),
  rmse DECIMAL(5,2),
  r_squared DECIMAL(5,4),

  -- Classification metrics
  accuracy DECIMAL(5,4), -- % correct viral/not-viral classification
  precision_viral DECIMAL(5,4), -- Of predicted viral, % actually viral
  recall_viral DECIMAL(5,4), -- Of actually viral, % predicted viral

  -- Range accuracy
  within_range_percent DECIMAL(5,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_accuracy_period UNIQUE (period_start, checkpoint_type)
);

-- Create index safely (table might exist from old migration with different schema)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_accuracy_metrics_date ON accuracy_metrics(period_start DESC);
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

-- =============================================

-- Function: Calculate accuracy metrics for a time period
CREATE OR REPLACE FUNCTION calculate_accuracy_metrics(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_checkpoint_type TEXT
)
RETURNS TABLE (
  total_predictions BIGINT,
  mean_absolute_error DECIMAL,
  median_absolute_error DECIMAL,
  rmse DECIMAL,
  r_squared DECIMAL,
  accuracy DECIMAL,
  precision_viral DECIMAL,
  recall_viral DECIMAL,
  within_range_percent DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH validation_data AS (
    SELECT
      predicted_dps,
      final_dps,
      error,
      within_range,
      predicted_viral,
      actual_viral,
      correct_classification
    FROM prediction_validations
    WHERE validated_at BETWEEN p_start_date AND p_end_date
      AND final_checkpoint = p_checkpoint_type
      AND tracking_status = 'completed'
  ),
  stats AS (
    SELECT
      COUNT(*)::BIGINT as total,
      AVG(error)::DECIMAL as mae,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY error)::DECIMAL as median_ae,
      SQRT(AVG(error * error))::DECIMAL as rmse_val,

      -- R-squared calculation
      1 - (SUM(POWER(final_dps - predicted_dps, 2)) /
           NULLIF(SUM(POWER(final_dps - AVG(final_dps) OVER (), 2)), 0))::DECIMAL as r2,

      -- Classification metrics
      (COUNT(*) FILTER (WHERE correct_classification) * 1.0 / COUNT(*))::DECIMAL as acc,

      (COUNT(*) FILTER (WHERE predicted_viral AND actual_viral) * 1.0 /
       NULLIF(COUNT(*) FILTER (WHERE predicted_viral), 0))::DECIMAL as prec,

      (COUNT(*) FILTER (WHERE predicted_viral AND actual_viral) * 1.0 /
       NULLIF(COUNT(*) FILTER (WHERE actual_viral), 0))::DECIMAL as rec,

      (COUNT(*) FILTER (WHERE within_range) * 100.0 / COUNT(*))::DECIMAL as within_pct
    FROM validation_data
  )
  SELECT
    total,
    ROUND(mae, 2),
    ROUND(median_ae, 2),
    ROUND(rmse_val, 2),
    ROUND(r2, 4),
    ROUND(acc, 4),
    ROUND(prec, 4),
    ROUND(rec, 4),
    ROUND(within_pct, 2)
  FROM stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================

-- Seed some viral creators and hashtags for testing
INSERT INTO viral_creators (username, platform, follower_count, niche, historical_dps) VALUES
  ('alexhormozi', 'tiktok', 5200000, 'business', 78.5),
  ('garyvee', 'tiktok', 18500000, 'business', 75.2),
  ('mrbeast', 'tiktok', 95000000, 'entertainment', 85.3),
  ('ryantrahan', 'tiktok', 4300000, 'lifestyle', 72.8),
  ('zachking', 'tiktok', 72000000, 'entertainment', 81.4)
ON CONFLICT (username, platform) DO NOTHING;

INSERT INTO viral_hashtags (tag, platform, niche, avg_dps) VALUES
  ('moneyadvice', 'tiktok', 'finance', 72.3),
  ('motivation', 'tiktok', 'lifestyle', 68.9),
  ('businesstips', 'tiktok', 'business', 71.5),
  ('transformation', 'tiktok', 'fitness', 74.2),
  ('lifehacks', 'tiktok', 'lifestyle', 69.8),
  ('viral', 'tiktok', 'general', 75.1),
  ('trending', 'tiktok', 'general', 73.6)
ON CONFLICT (tag, platform) DO NOTHING;

-- =============================================

COMMENT ON TABLE tracking_checkpoints IS 'Scheduled performance tracking checkpoints for predicted videos';
COMMENT ON TABLE viral_creators IS 'List of viral creators to monitor for fresh content';
COMMENT ON TABLE viral_hashtags IS 'List of viral hashtags to track';
COMMENT ON TABLE scraping_runs IS 'Log of automated scraping cycles';
COMMENT ON TABLE accuracy_metrics IS 'Aggregate prediction accuracy metrics over time';
