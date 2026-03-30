-- DPS Percentile Scoring — post-publication cohort percentile from DynamicPercentileSystem
-- Adds percentile ranking within follower-count cohort alongside existing actual VPS

-- New columns on prediction_runs
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS dps_percentile DOUBLE PRECISION;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS dps_z_score DOUBLE PRECISION;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS dps_category TEXT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_follower_count BIGINT;

-- Index for queries filtering by category
CREATE INDEX IF NOT EXISTS idx_prediction_runs_dps_category
  ON prediction_runs(dps_category) WHERE dps_category IS NOT NULL;

-- Cohort medians cache for DynamicPercentileSystem.updateCohortMedians()
CREATE TABLE IF NOT EXISTS cohort_medians (
  follower_min BIGINT NOT NULL,
  follower_max BIGINT,
  median_views DOUBLE PRECISION NOT NULL,
  sample_size INT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_min, follower_max)
);
