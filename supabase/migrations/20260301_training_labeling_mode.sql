-- Phase 1: Add labeling_mode column to prediction_runs
-- Tracks how each run was labeled: NULL (legacy), 'manual', 'auto_cron', 'manual_script'
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS labeling_mode TEXT;

-- VPS evaluation results table for Spearman rank correlation tracking
CREATE TABLE IF NOT EXISTS vps_evaluation (
  id BIGSERIAL PRIMARY KEY,
  computed_at TIMESTAMPTZ NOT NULL,
  n INT NOT NULL,
  spearman_rho DOUBLE PRECISION NOT NULL,
  p_value DOUBLE PRECISION,
  mae DOUBLE PRECISION NOT NULL,
  within_range_pct DOUBLE PRECISION,
  by_niche JSONB,
  labeling_mode_breakdown JSONB
);
