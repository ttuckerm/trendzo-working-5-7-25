-- FEAT-072: Fix VARCHAR limits that are too restrictive
-- Created: 2025-10-24

-- Increase cluster_name from VARCHAR(100) to VARCHAR(255)
ALTER TABLE validation_fingerprints
  ALTER COLUMN cluster_name TYPE VARCHAR(255);

-- Increase other fields that might be too restrictive
ALTER TABLE validation_patterns
  ALTER COLUMN hook_time TYPE VARCHAR(255),
  ALTER COLUMN visual_style TYPE VARCHAR(255),
  ALTER COLUMN audio_pattern TYPE VARCHAR(255),
  ALTER COLUMN text_overlay TYPE VARCHAR(255),
  ALTER COLUMN pacing TYPE VARCHAR(255),
  ALTER COLUMN emotion TYPE VARCHAR(255),
  ALTER COLUMN call_to_action TYPE VARCHAR(255),
  ALTER COLUMN share_trigger TYPE VARCHAR(255),
  ALTER COLUMN engagement_hook TYPE VARCHAR(255);

-- Increase niche field in validation_runs
ALTER TABLE validation_runs
  ALTER COLUMN niche TYPE VARCHAR(255),
  ALTER COLUMN success_metric TYPE VARCHAR(255);

COMMENT ON TABLE validation_fingerprints IS 'FEAT-072: Fixed VARCHAR limits to prevent truncation errors';
