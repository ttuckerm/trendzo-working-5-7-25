-- Training eligibility gate
-- Adds flags used by the data quality gate to exclude low-quality rows
-- from training and holdout selection.

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS training_eligible BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS training_disqualified_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_training_eligible
  ON prediction_runs (training_eligible);

COMMENT ON COLUMN prediction_runs.training_eligible IS
  'Set to false by data quality gate; rows with false are excluded from training and holdout selection';

COMMENT ON COLUMN prediction_runs.training_disqualified_reason IS
  'Reason this row was excluded by the data quality gate (e.g. no_video_analysis, followers_below_1k, high_null_rate)';
