-- =============================================
-- Sandbox Experiment Mode — training_experiments extension
-- Adds experiment_mode ('sandbox' | 'production') to isolate
-- observational experiments from production-affecting ones.
-- =============================================

-- ── Add experiment_mode column ────────────────────────────────────────────
ALTER TABLE training_experiments
  ADD COLUMN IF NOT EXISTS experiment_mode TEXT NOT NULL DEFAULT 'sandbox'
    CHECK (experiment_mode IN ('sandbox', 'production'));

-- ── Add promoted_from_sandbox_id for tracking sandbox → production lineage ─
ALTER TABLE training_experiments
  ADD COLUMN IF NOT EXISTS promoted_from_sandbox_id UUID REFERENCES training_experiments(id);

-- ── Index for querying by mode ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_training_experiments_mode
  ON training_experiments (experiment_mode, created_at DESC);

-- ── Index for concurrency lock queries (locked_at + experiment_mode) ──────
CREATE INDEX IF NOT EXISTS idx_training_experiments_lock
  ON training_experiments (locked_at, experiment_mode)
  WHERE locked_at IS NOT NULL;
