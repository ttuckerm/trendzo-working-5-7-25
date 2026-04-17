-- =============================================
-- Prompt 33 — Model comparison + promotion pipeline
-- Adds: chairman_alerts (generic), post-promotion validation
-- tracking on model_promotion_log, validation_by_niche on
-- training_experiments.
-- =============================================

-- ── chairman_alerts ─────────────────────────────────────────────────────
-- Generic alert inbox for the Chairman dashboard. Reused by the Trainer
-- Engine (model_degradation, insufficient_data), and later by Agency
-- alerts, pipeline failures, data quality checks, etc. Keep alert_type
-- free-form so new subsystems can add values without a schema change.

CREATE TABLE IF NOT EXISTS chairman_alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type     TEXT NOT NULL,  -- e.g. model_degradation, insufficient_data, pipeline_failure, data_quality
  severity       TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title          TEXT NOT NULL,
  body           TEXT,
  payload        JSONB,           -- diagnostic context (e.g. before/after spearman, sample sizes)
  action_type    TEXT,            -- optional one-click action, e.g. rollback_model
  action_payload JSONB,           -- parameters for the action, e.g. { variant_id, niche }
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by    TEXT,            -- 'chairman' | 'auto' | NULL while open
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chairman_alerts_open
  ON chairman_alerts (status, created_at DESC)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_chairman_alerts_type
  ON chairman_alerts (alert_type, created_at DESC);

-- ── model_promotion_log: post-promotion validation tracking ─────────────
-- The 48h validator cron reads these columns to know which promotions
-- still need a post-promotion accuracy check, and how many attempts it
-- has made. Retry schedule: 48h, 72h, 96h (three attempts). If sample
-- size < 30 after 96h, we write an insufficient_data alert.

ALTER TABLE model_promotion_log
  ADD COLUMN IF NOT EXISTS post_validation_status TEXT
    CHECK (post_validation_status IN ('pending', 'validated', 'insufficient_data')),
  ADD COLUMN IF NOT EXISTS post_validation_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_validation_checked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_validation_spearman DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS post_validation_sample_size INTEGER;

-- Back-fill existing promote rows to 'pending' so the validator picks
-- them up (rollbacks are skipped by the validator query).
UPDATE model_promotion_log
SET post_validation_status = 'pending'
WHERE action = 'promote'
  AND post_validation_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_model_promotion_log_pending_validation
  ON model_promotion_log (created_at)
  WHERE action = 'promote' AND post_validation_status = 'pending';

-- ── training_experiments: per-niche validation scores ──────────────────
-- Forward-looking column. The trainer engine will populate this going
-- forward so the comparison UI can show per-niche Spearman. Rows written
-- before this migration stay NULL; the UI renders "Global only" for them.

ALTER TABLE training_experiments
  ADD COLUMN IF NOT EXISTS validation_by_niche JSONB;

COMMENT ON COLUMN training_experiments.validation_by_niche IS
  'Per-niche validation scores for this experiment. Shape: { [niche]: { spearman: number, n: number } }. NULL for experiments run before 2026-04-10.';
