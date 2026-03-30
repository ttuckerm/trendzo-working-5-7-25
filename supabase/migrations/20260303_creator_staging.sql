-- Creator Staging System: Add staging columns to calibration_profiles
-- Stores the 5-dimension staging result after onboarding calibration completes.

ALTER TABLE calibration_profiles
  ADD COLUMN IF NOT EXISTS creator_stage text DEFAULT null,
  ADD COLUMN IF NOT EXISTS dimension_scores jsonb DEFAULT null,
  ADD COLUMN IF NOT EXISTS staged_at timestamptz DEFAULT null;

-- Index for querying by stage (useful for analytics and cohort analysis)
CREATE INDEX IF NOT EXISTS idx_calibration_profiles_creator_stage
  ON calibration_profiles (creator_stage)
  WHERE creator_stage IS NOT NULL;
