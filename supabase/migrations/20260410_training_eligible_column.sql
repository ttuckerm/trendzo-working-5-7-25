-- Add training_eligible column to training_features
-- Soft-delete for data cleaning: false = excluded from training, true = eligible.
-- No rows are deleted. Every filter decision is reversible.

ALTER TABLE training_features
  ADD COLUMN IF NOT EXISTS training_eligible BOOLEAN NOT NULL DEFAULT true;

-- Track WHY a row was excluded
ALTER TABLE training_features
  ADD COLUMN IF NOT EXISTS exclusion_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_training_features_eligible
  ON training_features (training_eligible)
  WHERE training_eligible = true;

COMMENT ON COLUMN training_features.training_eligible IS 'false = excluded by data cleaning filters. Default true. Reversible.';
COMMENT ON COLUMN training_features.exclusion_reason IS 'Human-readable reason for exclusion (e.g. "no_video_features", "sub_1k_followers", "low_fill_rate")';
