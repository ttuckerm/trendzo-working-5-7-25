-- Seed: XGBoost v5 model version (ALREADY APPLIED via script)
--
-- The live model_versions table has a different schema than the original migration.
-- Actual columns: id, version, status, training_job_id, model_path, model_size_bytes,
-- accuracy, mae, rmse, calibration, config (JSONB), hyperparameters (JSONB),
-- train_samples, feature_importance (JSONB), feature_count, created_at, deployed_at,
-- archived_at, notes, contamination_audit_id
--
-- There is a UNIQUE PARTIAL INDEX: idx_model_versions_single_active
-- Only one row can have status='active' at a time.

-- Step 1: Demote old test entry
UPDATE model_versions
  SET status = 'testing', notes = 'Auto-generated test entry, superseded by v5'
  WHERE id = '4e2f1c3a-a498-46c0-b9c4-9bd9b7b0cc53';

-- Step 2: Insert v5
INSERT INTO model_versions (
  version, status, config, hyperparameters,
  train_samples, feature_count, created_at, deployed_at, notes
) VALUES (
  'v5', 'active',
  '{"model_type": "xgboost-virality-ml"}'::jsonb,
  '{"note": "Trained on synthetic data. First real retrain at 100 labeled videos.", "features": 42, "training_data": "synthetic"}'::jsonb,
  0, 42,
  '2025-12-01T00:00:00Z',
  '2025-12-01T00:00:00Z',
  'XGBoost v5 — synthetic training data. 42 features. First real retrain at 100 labeled videos.'
);
