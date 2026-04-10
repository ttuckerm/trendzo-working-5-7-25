-- =============================================
-- Model Promotion Log & Backup Infrastructure
-- Tracks every promotion/rollback with before/after state.
-- Enables one-click rollback to previous production model.
-- =============================================

-- ── model_promotion_log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS model_promotion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL CHECK (action IN ('promote', 'rollback')),
  variant_id      UUID NOT NULL REFERENCES model_variants(id),
  previous_variant_id UUID REFERENCES model_variants(id),
  niche           TEXT,
  before_spearman DOUBLE PRECISION,
  after_spearman  DOUBLE PRECISION,
  delta           DOUBLE PRECISION,
  reason          TEXT,
  triggered_by    TEXT NOT NULL DEFAULT 'chairman',
  experiment_id   UUID REFERENCES training_experiments(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotion_log_date
  ON model_promotion_log (created_at DESC);

CREATE INDEX idx_promotion_log_niche
  ON model_promotion_log (niche, created_at DESC);

-- ── Add backup tracking to model_variants ─────────────────────────────
ALTER TABLE model_variants
  ADD COLUMN IF NOT EXISTS replaced_by UUID REFERENCES model_variants(id);

ALTER TABLE model_variants
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- ── Add prediction count tracking ─────────────────────────────────────
ALTER TABLE model_variants
  ADD COLUMN IF NOT EXISTS prediction_count INTEGER NOT NULL DEFAULT 0;

-- ── Add training_data_stats for comparison UI ─────────────────────────
ALTER TABLE model_variants
  ADD COLUMN IF NOT EXISTS training_data_stats JSONB;
