-- Add 5 FFmpeg segment-based features to training_features
-- These analyze temporal segments of the actual video file.

ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_motion_ratio numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS audio_energy_buildup numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS scene_rate_first_half_vs_second numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS visual_variety_score numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_audio_intensity numeric;

COMMENT ON COLUMN training_features.hook_motion_ratio IS 'Motion intensity ratio: first 3s vs rest (>1 = hook has more motion)';
COMMENT ON COLUMN training_features.audio_energy_buildup IS 'Linear regression slope of loudness across 4 quarters (positive = energy builds)';
COMMENT ON COLUMN training_features.scene_rate_first_half_vs_second IS 'Ratio of scene changes: first half / second half';
COMMENT ON COLUMN training_features.visual_variety_score IS 'Visual diversity score 0-100 from scene count + duration variance';
COMMENT ON COLUMN training_features.hook_audio_intensity IS 'Audio intensity ratio: first 3s / overall (linear power scale)';
