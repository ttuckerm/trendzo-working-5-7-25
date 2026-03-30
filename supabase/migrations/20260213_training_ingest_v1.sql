-- Phase 82: Training Ingest v1
-- Creates metric_check_schedule table and adds source/source_meta to prediction_runs

-- metric_check_schedule: tracks when to collect actual metrics for training data
CREATE TABLE IF NOT EXISTS metric_check_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_run_id UUID NOT NULL REFERENCES prediction_runs(id),
  video_id UUID NOT NULL REFERENCES video_files(id),
  platform TEXT NOT NULL DEFAULT 'tiktok',
  platform_video_id TEXT,         -- TikTok video ID or URL (attached later)
  check_type TEXT NOT NULL,       -- '4h', '24h', '48h', '7d'
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'completed', 'failed', 'skipped')),
  actual_metrics JSONB,           -- filled when metrics are collected
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_run_id, check_type)
);

CREATE INDEX IF NOT EXISTS idx_metric_schedule_status ON metric_check_schedule(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_metric_schedule_run ON metric_check_schedule(prediction_run_id);

-- Add source + source_meta columns to prediction_runs
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
ALTER TABLE prediction_runs ADD COLUMN IF NOT EXISTS source_meta JSONB;
COMMENT ON COLUMN prediction_runs.source IS 'Origin: manual | training_ingest | api';
COMMENT ON COLUMN prediction_runs.source_meta IS 'Metadata about the ingest source (platform, caller, etc.)';
