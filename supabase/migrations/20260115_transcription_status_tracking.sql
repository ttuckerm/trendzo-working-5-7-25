-- ============================================================================
-- Transcription Status Tracking for Prediction Pipeline
-- ============================================================================
-- Purpose: Track transcription source, confidence, and metadata for each run
-- Date: 2026-01-15
-- Author: Claude Code
-- ============================================================================

-- Add transcription status columns to prediction_runs
-- Note: prediction_runs may already exist from pipeline usage

-- First, create the table if it doesn't exist (allows flexible table creation)
CREATE TABLE IF NOT EXISTS prediction_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,
  mode VARCHAR(50) DEFAULT 'standard',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  predicted_dps_7d NUMERIC(5,2),
  predicted_tier_7d VARCHAR(50),
  confidence NUMERIC(5,4),
  components_used TEXT[],
  latency_ms_total INTEGER,
  raw_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Run Component Results Table
-- ============================================================================
-- Stores individual component execution results for each prediction run

CREATE TABLE IF NOT EXISTS run_component_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
  video_id UUID REFERENCES video_files(id) ON DELETE SET NULL,
  component_id VARCHAR(100) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  error TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  skip_reason TEXT,
  prediction NUMERIC(5,2),
  confidence NUMERIC(5,4),
  features JSONB,
  insights TEXT[],
  latency_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_run_component_results_run_id ON run_component_results(run_id);
CREATE INDEX IF NOT EXISTS idx_run_component_results_component_id ON run_component_results(component_id);
CREATE INDEX IF NOT EXISTS idx_run_component_results_created_at ON run_component_results(created_at DESC);

-- Add transcription status columns (if they don't exist)
DO $$
BEGIN
  -- Transcription source (user_provided, whisper, fallback_title, fallback_captions, none)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_source') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_source VARCHAR(50);
  END IF;

  -- Transcription confidence (0.0 to 1.0)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_confidence') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_confidence NUMERIC(5,4);
  END IF;

  -- Transcription latency in milliseconds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_latency_ms') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_latency_ms INTEGER;
  END IF;

  -- Whether transcription was skipped
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_skipped') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_skipped BOOLEAN DEFAULT FALSE;
  END IF;

  -- Reason for skipping transcription
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_skip_reason') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_skip_reason TEXT;
  END IF;

  -- Fallback components used (e.g., ['title', 'description'])
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'transcription_fallback_components') THEN
    ALTER TABLE prediction_runs ADD COLUMN transcription_fallback_components TEXT[];
  END IF;

  -- Resolved transcript length for debugging (what Pack 1/2 actually receives)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'resolved_transcript_length') THEN
    ALTER TABLE prediction_runs ADD COLUMN resolved_transcript_length INTEGER DEFAULT 0;
  END IF;

  -- Pack 1 metadata (source, provider, latency_ms)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'pack1_meta') THEN
    ALTER TABLE prediction_runs ADD COLUMN pack1_meta JSONB;
  END IF;

  -- Pack 2 metadata (source, provider, latency_ms)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'prediction_runs' AND column_name = 'pack2_meta') THEN
    ALTER TABLE prediction_runs ADD COLUMN pack2_meta JSONB;
  END IF;
END $$;

-- Create indexes for querying transcription status
CREATE INDEX IF NOT EXISTS idx_prediction_runs_transcription_source
  ON prediction_runs(transcription_source);
CREATE INDEX IF NOT EXISTS idx_prediction_runs_created_at
  ON prediction_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_runs_status
  ON prediction_runs(status);

-- Comments
COMMENT ON COLUMN prediction_runs.transcription_source IS 'Source of transcript: user_provided, whisper, fallback_title, fallback_captions, none';
COMMENT ON COLUMN prediction_runs.transcription_confidence IS 'Confidence score 0.0-1.0 for the transcription';
COMMENT ON COLUMN prediction_runs.transcription_latency_ms IS 'Time taken to generate transcription in milliseconds';
COMMENT ON COLUMN prediction_runs.transcription_skipped IS 'Whether transcription was skipped due to no available source';
COMMENT ON COLUMN prediction_runs.transcription_skip_reason IS 'Reason why transcription was skipped';
COMMENT ON COLUMN prediction_runs.transcription_fallback_components IS 'Components used in fallback (title, description, captions)';
COMMENT ON COLUMN prediction_runs.pack1_meta IS 'Pack 1 (Unified Grading) metadata: {source, provider, latency_ms}';
COMMENT ON COLUMN prediction_runs.pack2_meta IS 'Pack 2 (Editing Coach) metadata: {source, provider, latency_ms}';

-- ============================================================================
-- View: Recent Prediction Runs with Transcription and Pack Metadata
-- ============================================================================

CREATE OR REPLACE VIEW v_recent_prediction_runs AS
SELECT
  pr.id AS run_id,
  pr.video_id,
  pr.status,
  pr.predicted_dps_7d,
  pr.predicted_tier_7d,
  pr.confidence,
  pr.latency_ms_total,
  -- Transcription info
  pr.transcription_source,
  pr.transcription_confidence,
  pr.transcription_latency_ms,
  pr.transcription_skipped,
  pr.transcription_skip_reason,
  pr.transcription_fallback_components,
  -- Pack 1/2 metadata
  pr.pack1_meta->>'source' AS pack1_source,
  pr.pack1_meta->>'provider' AS pack1_provider,
  (pr.pack1_meta->>'latency_ms')::INTEGER AS pack1_latency_ms,
  pr.pack2_meta->>'source' AS pack2_source,
  pr.pack2_meta->>'provider' AS pack2_provider,
  (pr.pack2_meta->>'latency_ms')::INTEGER AS pack2_latency_ms,
  -- Timestamps
  pr.started_at,
  pr.completed_at,
  pr.created_at
FROM prediction_runs pr
ORDER BY pr.created_at DESC
LIMIT 100;

COMMENT ON VIEW v_recent_prediction_runs IS 'Recent prediction runs with transcription status and Pack 1/2 metadata for admin dashboard';
