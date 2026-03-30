-- New pre-publication features for side-hustles niche (2026-03-18)
-- Wave 1: transcript/audio features
-- Wave 2: Gemini Vision frame classifier features

ALTER TABLE training_features
  ADD COLUMN IF NOT EXISTS specificity_score NUMERIC,
  ADD COLUMN IF NOT EXISTS instructional_density NUMERIC,
  ADD COLUMN IF NOT EXISTS has_step_structure BOOLEAN,
  ADD COLUMN IF NOT EXISTS hedge_word_density NUMERIC,
  ADD COLUMN IF NOT EXISTS vocal_confidence_composite NUMERIC,
  ADD COLUMN IF NOT EXISTS visual_proof_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS talking_head_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS visual_to_verbal_ratio NUMERIC,
  ADD COLUMN IF NOT EXISTS text_overlay_density NUMERIC;
