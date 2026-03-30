-- Add creator story to calibration profiles
-- Stores transformation story, niche myths, and audience desired result
ALTER TABLE calibration_profiles
  ADD COLUMN IF NOT EXISTS creator_story JSONB DEFAULT NULL;

COMMENT ON COLUMN calibration_profiles.creator_story IS 'Creator story: transformation, nicheMyths[], audienceDesiredResult';
