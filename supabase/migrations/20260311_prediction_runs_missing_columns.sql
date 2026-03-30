-- ============================================================================
-- Add missing columns to prediction_runs
-- ============================================================================
-- These columns are actively written by production code (auto-labeler,
-- metric-attacher, scrape-label, runPredictionPipeline) but were previously
-- added via Supabase dashboard without migration files.
--
-- This migration documents and guarantees their existence.
-- Date: 2026-03-11
-- ============================================================================

-- ── Actual metrics (written by auto-labeler, metric-attacher, scrape-label) ──
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_dps NUMERIC(5,2);
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_tier TEXT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_views BIGINT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_likes BIGINT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_comments BIGINT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_shares BIGINT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_saves BIGINT;

-- ── Prediction error tracking (written by auto-labeler, metric-attacher, scrape-label) ──
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS prediction_error NUMERIC(5,2);
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS prediction_error_pct NUMERIC(8,2);
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS within_range BOOLEAN;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actuals_entered_at TIMESTAMPTZ;

-- ── Prediction range (written by pipeline calibrator, read by auto-labeler) ──
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS prediction_range_low NUMERIC(5,2);
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS prediction_range_high NUMERIC(5,2);

-- ── QC harness fields (written by runPredictionPipeline on every completed run) ──
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS qc_flags TEXT[] DEFAULT '{}';
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS llm_spread NUMERIC;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS llm_influence_applied BOOLEAN;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS llm_excluded_reason TEXT;

-- ── Two-Lane scoring versions (written by runPredictionPipeline) ──
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS score_version TEXT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS coach_version TEXT;

-- ── Indexes for evaluation queries ──
CREATE INDEX IF NOT EXISTS idx_prediction_runs_actual_dps
  ON prediction_runs(actual_dps) WHERE actual_dps IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prediction_runs_labeling_mode
  ON prediction_runs(labeling_mode) WHERE labeling_mode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prediction_runs_status_created
  ON prediction_runs(status, created_at DESC);
