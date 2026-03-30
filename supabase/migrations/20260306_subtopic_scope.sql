-- Add selected subtopics to calibration profiles
-- Stores 3-5 specific content subtopics the creator wants to cover
ALTER TABLE calibration_profiles
  ADD COLUMN IF NOT EXISTS selected_subtopics text[] DEFAULT NULL;

COMMENT ON COLUMN calibration_profiles.selected_subtopics IS 'Creator-selected subtopics (3-5) for niche saturation assessment and content calendar targeting';
