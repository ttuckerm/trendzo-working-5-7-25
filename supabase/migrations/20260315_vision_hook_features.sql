-- Add 4 Gemini Vision hook analysis features to training_features
-- These analyze the opening frames of the video via Gemini Vision API.

ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_face_present numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_text_overlay numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_composition_score numeric;
ALTER TABLE training_features ADD COLUMN IF NOT EXISTS hook_emotion_intensity numeric;

COMMENT ON COLUMN training_features.hook_face_present IS 'Binary: human face visible in first frame (1=yes, 0=no) — Gemini Vision';
COMMENT ON COLUMN training_features.hook_text_overlay IS 'Binary: designed text overlay visible in first 3s (1=yes, 0=no) — Gemini Vision';
COMMENT ON COLUMN training_features.hook_composition_score IS 'Attention-grabbing score of opening frame (1-10) — Gemini Vision';
COMMENT ON COLUMN training_features.hook_emotion_intensity IS 'Facial expression intensity in opening frame (0-10, 0=no face) — Gemini Vision';
