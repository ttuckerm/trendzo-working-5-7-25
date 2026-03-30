-- =====================================================
-- Experiment Tracking Log
-- =====================================================
-- Tracks every model change (feature add/remove, hyperparameter
-- change, retrain, bug fix, data change) with before/after metrics
-- and computed deltas. Enables regression detection and
-- "which change caused which metric change" analysis.
--
-- Author: Trendzo ML Pipeline
-- Date: 2026-03-15
-- =====================================================

CREATE TABLE IF NOT EXISTS experiment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name TEXT NOT NULL,
  experiment_type TEXT NOT NULL CHECK (experiment_type IN (
    'feature_added', 'feature_removed', 'feature_modified',
    'hyperparameter_change', 'model_retrain', 'bug_fix', 'data_change'
  )),
  description TEXT,
  model_version_before TEXT,
  model_version_after TEXT,
  metrics_before JSONB,
  metrics_after JSONB,
  delta JSONB,
  verdict TEXT NOT NULL DEFAULT 'inconclusive' CHECK (verdict IN ('kept', 'reverted', 'inconclusive')),
  features_changed TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT 'human'
);

CREATE INDEX IF NOT EXISTS idx_experiment_log_created_at
  ON experiment_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_experiment_log_verdict
  ON experiment_log(verdict);

CREATE INDEX IF NOT EXISTS idx_experiment_log_type
  ON experiment_log(experiment_type);
