-- Validation fixes migration: quality discernment, creator credentials, hook usage log

-- Fix 4: Quality discernment score (computed during calibration)
ALTER TABLE calibration_profiles
  ADD COLUMN IF NOT EXISTS quality_discernment_score numeric(5,2) DEFAULT NULL;

COMMENT ON COLUMN calibration_profiles.quality_discernment_score IS
  'Quality discernment: (high_accepted + underperformer_rejected) / total_swipes * 100';

-- Fix 12: Hook usage log for novelty decay tracking
ALTER TABLE calibration_profiles
  ADD COLUMN IF NOT EXISTS hook_usage_log jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN calibration_profiles.hook_usage_log IS
  'Last 10 hook types used in concept scoring (for novelty decay penalty)';
