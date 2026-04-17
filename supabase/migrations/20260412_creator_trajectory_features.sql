-- Creator trajectory features for XGBoost training
-- Adds creator_id + momentum signals to prediction_runs
-- Adds feature_set tracking to training_experiments

-- Add creator_id column to prediction_runs (was written by pipeline but column never existed)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS creator_id uuid;

COMMENT ON COLUMN prediction_runs.creator_id IS 'Creator/user who this prediction was run for (nullable for scraped/anonymous data)';

-- Add feature_set column to training_experiments (tracks which features were used)
ALTER TABLE training_experiments
  ADD COLUMN IF NOT EXISTS feature_set jsonb;

COMMENT ON COLUMN training_experiments.feature_set IS 'JSON array of feature names used in this training experiment';

-- Add creator trajectory columns to prediction_runs (for audit, not training input)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS creator_momentum_30d double precision,
  ADD COLUMN IF NOT EXISTS creator_trajectory_label integer;

COMMENT ON COLUMN prediction_runs.creator_momentum_30d IS 'Linear regression slope of VPS actuals over 30 days before this prediction (-1 to 1)';
COMMENT ON COLUMN prediction_runs.creator_trajectory_label IS 'Encoded creator trajectory: 0=declining, 1=stable, 2=improving';

-- Add cultural momentum columns to prediction_runs (for audit)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS cultural_momentum_score double precision,
  ADD COLUMN IF NOT EXISTS trend_phase_encoded integer;

COMMENT ON COLUMN prediction_runs.cultural_momentum_score IS 'Cultural tailwind score at post time (0-100)';
COMMENT ON COLUMN prediction_runs.trend_phase_encoded IS 'Trend phase: 0=none, 1=fading, 2=rising, 3=peak';

-- Index for creator trajectory queries (only useful when creator_id is populated)
CREATE INDEX IF NOT EXISTS idx_prediction_runs_creator_trajectory
  ON prediction_runs (creator_id, created_at DESC)
  WHERE creator_id IS NOT NULL AND actual_dps IS NOT NULL;
