-- Phase 84: Contamination Lock — per-run cryptographic proof of clean prediction
-- Adds columns to prediction_runs for contamination tracking and proof storage.

ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS ingest_mode TEXT;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS contamination_lock BOOLEAN DEFAULT true;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS contamination_proof JSONB;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS metrics_attached_at TIMESTAMPTZ;
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS metrics_source TEXT;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_ingest_mode ON prediction_runs(ingest_mode);
