-- ============================================================================
-- Admin Prediction Lab: Three-Table Architecture
-- ============================================================================
-- Purpose: Anti-contamination guarantee for prediction testing
-- Date: 2025-11-15
-- Author: Claude (based on PRD v1.2)
-- ============================================================================

-- ============================================================================
-- Drop existing tables if they exist (safe - verified empty)
-- ============================================================================

DROP TABLE IF EXISTS prediction_actuals CASCADE;
DROP TABLE IF EXISTS prediction_events CASCADE;
DROP TABLE IF EXISTS video_files CASCADE;

-- ============================================================================
-- Table 1: video_files (INPUT)
-- Predictor reads from here
-- ============================================================================

CREATE TABLE video_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input source (one of these required)
  tiktok_url TEXT,
  storage_path TEXT,  -- Path to MP4 file in data/raw_videos or Supabase Storage

  -- Metadata
  niche VARCHAR(100),
  goal VARCHAR(255),  -- e.g., "grow followers", "promote product"
  account_size_band VARCHAR(50),  -- e.g., "small (0-10K)", "medium (10K-100K)"
  platform VARCHAR(50) DEFAULT 'tiktok',

  -- Optional (if video already posted)
  posted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_files_created_at ON video_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_files_niche ON video_files(niche);

-- Comments
COMMENT ON TABLE video_files IS 'Admin Lab: Video inputs for prediction (no metrics)';
COMMENT ON COLUMN video_files.storage_path IS 'Path like data/raw_videos/video123.mp4';

-- ============================================================================
-- Table 2: prediction_events (FROZEN PREDICTIONS)
-- Predictor writes here
-- ============================================================================

CREATE TABLE prediction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES video_files(id) ON DELETE CASCADE,

  -- Model info
  model_version VARCHAR(50) NOT NULL,  -- e.g., "xgb_v1.0", "hybrid_v1.2"

  -- Feature snapshot (for debugging)
  feature_snapshot JSONB NOT NULL,  -- Top 10 features only, not all 119

  -- Predictions
  predicted_dps NUMERIC(5,2) NOT NULL CHECK (predicted_dps >= 0 AND predicted_dps <= 100),
  predicted_dps_low NUMERIC(5,2) NOT NULL,  -- Lower bound of range
  predicted_dps_high NUMERIC(5,2) NOT NULL,  -- Upper bound of range
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  -- Explanation
  explanation TEXT,  -- Human-readable explanation of prediction

  -- Verification (cryptographic freezing)
  prediction_hash TEXT NOT NULL,  -- SHA-256 of prediction payload
  blockchain_tx_hash TEXT,  -- Optional blockchain transaction hash (Phase 1)
  blockchain_block_number INTEGER,  -- Optional block number (Phase 1)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_events_video_id ON prediction_events(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_events_created_at ON prediction_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_events_hash ON prediction_events(prediction_hash);
CREATE UNIQUE INDEX idx_prediction_events_video_latest ON prediction_events(video_id, created_at DESC);

-- Comments
COMMENT ON TABLE prediction_events IS 'Admin Lab: Frozen predictions with cryptographic proof';
COMMENT ON COLUMN prediction_events.prediction_hash IS 'SHA-256 hash proving prediction made before metrics known';

-- ============================================================================
-- Table 3: prediction_actuals (ACTUAL METRICS)
-- Scraper writes here (predictor CANNOT access this)
-- ============================================================================

CREATE TABLE prediction_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES prediction_events(id) ON DELETE CASCADE,

  -- Snapshot type (time-sliced metrics)
  snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('1h', '4h', '8h', '24h', '7d', 'lifetime')),

  -- Engagement metrics (all from Apify scraper)
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  bookmarks BIGINT,  -- collectCount from Apify

  -- Calculated DPS (for accuracy comparison)
  actual_dps NUMERIC(5,2) CHECK (actual_dps >= 0 AND actual_dps <= 100),

  -- Metadata
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source VARCHAR(50) NOT NULL DEFAULT 'manual' CHECK (source IN ('apify', 'manual')),  -- How metrics were obtained

  UNIQUE(prediction_id, snapshot_type)  -- One snapshot per type per prediction
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_actuals_prediction_id ON prediction_actuals(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_actuals_snapshot_type ON prediction_actuals(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_prediction_actuals_fetched_at ON prediction_actuals(fetched_at DESC);

-- Comments
COMMENT ON TABLE prediction_actuals IS 'Admin Lab: Actual engagement metrics (predictor has NO ACCESS)';
COMMENT ON COLUMN prediction_actuals.actual_dps IS 'Calculated from actual metrics for accuracy comparison';
COMMENT ON COLUMN prediction_actuals.source IS 'manual = Phase 0, apify = Phase 1';

-- ============================================================================
-- Grant Permissions (Placeholder - will be set in next migration with roles)
-- ============================================================================

-- NOTE: PostgreSQL roles will be created in 20251115_admin_lab_roles.sql
-- This migration only creates the table structure
