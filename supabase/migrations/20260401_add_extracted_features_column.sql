-- Add extracted_features JSONB column to prediction_runs.
-- Stores the full 58-feature vector at prediction time so it can be
-- re-used for XGBoost retraining without re-downloading videos.
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS extracted_features JSONB DEFAULT NULL;

COMMENT ON COLUMN prediction_runs.extracted_features IS
  'Full 58-feature vector (v10 schema) produced by extractPredictionFeatures(). '
  'Persisted at prediction time for retraining. Keys match models/xgboost-v10-features.json.';
