-- Add creator context tracking to prediction_runs
-- Enables tracking which predictions used personalization and the creator's stage

ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS creator_context_active boolean DEFAULT false;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS creator_stage text DEFAULT null;
