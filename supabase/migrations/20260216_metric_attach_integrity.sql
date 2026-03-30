-- Feature #3: Metric Attach Integrity columns
-- Adds checkpoint audit trail, cohort freeze versioning, and metrics source constraint

-- 1. Authoritative checkpoint used for actuals
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS actual_checkpoint_used TEXT;
ALTER TABLE prediction_runs ADD CONSTRAINT chk_actual_checkpoint_used
  CHECK (actual_checkpoint_used IS NULL OR actual_checkpoint_used IN ('4h','24h','48h','7d'));

-- 2. Cohort freeze versioning
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS cohort_key TEXT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS cohort_frozen_at TIMESTAMPTZ;

-- 3. Metrics source strictness (column already exists from contamination lock migration)
ALTER TABLE prediction_runs ADD CONSTRAINT chk_metrics_source
  CHECK (metrics_source IS NULL OR metrics_source IN ('apify','manual_override'));
