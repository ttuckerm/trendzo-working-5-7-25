-- Permanent holdout lock for XGBoost retraining.
-- Rows marked is_holdout = true must never be included in training queries.
-- One-time designation, never reversed.

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS is_holdout BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS holdout_locked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_holdout
  ON prediction_runs(is_holdout);

COMMENT ON COLUMN prediction_runs.is_holdout IS
  'Permanent holdout lock. Once true, must never be set false. Never include in training queries.';

COMMENT ON COLUMN prediction_runs.holdout_locked_at IS
  'Timestamp when the row was designated as holdout. Never updated after initial set.';
