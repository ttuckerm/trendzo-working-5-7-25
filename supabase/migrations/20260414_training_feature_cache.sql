-- Training feature cache + actual_performance column
-- Backs the one-time backfill that activates creator trajectory, cultural
-- momentum, audience quality, and distribution features on historical rows.

-- ═══ Ensure prediction_runs.actual_performance exists ═══
-- The Feedback Collector cron writes here. Backfill pulls from scraped_videos.views_count.
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_performance NUMERIC;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_actual_performance
  ON prediction_runs(actual_performance)
  WHERE actual_performance IS NOT NULL;

-- ═══ training_feature_cache ═══
-- One row per prediction_run holding the 20 context features computed at
-- backfill time. Never overwritten; future retrains read from here.
CREATE TABLE IF NOT EXISTS training_feature_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_run_id UUID REFERENCES prediction_runs(id) ON DELETE CASCADE,

  -- Creator trajectory (5)
  feature_creator_momentum_30d FLOAT,
  feature_creator_avg_vps_90d FLOAT,
  feature_creator_viral_recency FLOAT,
  feature_creator_consistency_score FLOAT,
  feature_creator_trajectory_label INT,

  -- Cultural momentum (4)
  feature_cultural_momentum_score FLOAT,
  feature_trend_phase_encoded FLOAT,
  feature_niche_activation_score FLOAT,
  feature_cultural_timing_advantage FLOAT,

  -- Audience quality (5)
  feature_follower_count_log FLOAT,
  feature_engagement_rate_estimate FLOAT,
  feature_follower_growth_velocity FLOAT,
  feature_audience_size_tier FLOAT,
  feature_follower_quality_score FLOAT,

  -- Distribution signals (6)
  feature_post_hour_score FLOAT,
  feature_post_day_score FLOAT,
  feature_hashtag_strategy_score FLOAT,
  feature_sound_advantage_score FLOAT,
  feature_early_velocity_signal FLOAT,
  feature_distribution_composite FLOAT,

  -- Temporal validity: true iff cultural events existed strictly before
  -- the video's post date. False means we zeroed the 4 cultural features
  -- to prevent data leakage.
  cultural_temporal_valid BOOLEAN DEFAULT false,

  backfilled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_run_id)
);

CREATE INDEX IF NOT EXISTS idx_training_feature_cache_run_id
  ON training_feature_cache(prediction_run_id);

COMMENT ON TABLE training_feature_cache IS
  'Cached 20-feature context vector per prediction_run. Populated by one-time backfill + per-run writes on new predictions.';
COMMENT ON COLUMN training_feature_cache.cultural_temporal_valid IS
  'false = cultural features zeroed because no cultural_events existed before the video post date. Prevents data leakage.';
