-- =====================================================
-- Training Data Table for ML Model Training
-- Created: 2025-12-06
-- Purpose: Store processed video features and labels for XGBoost training
-- =====================================================

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS training_data CASCADE;

-- Training Data Table
CREATE TABLE training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source reference
  video_id TEXT NOT NULL,
  
  -- Ground truth labels (what we're training to predict)
  actual_dps_score NUMERIC NOT NULL,
  actual_dps_percentile NUMERIC,
  performance_tier TEXT NOT NULL CHECK (performance_tier IN ('mega-viral', 'viral', 'above-average', 'average', 'below-average', 'poor')),
  
  -- Engagement metrics (ground truth)
  actual_views BIGINT,
  actual_likes BIGINT,
  actual_comments BIGINT,
  actual_shares BIGINT,
  actual_saves BIGINT,
  actual_engagement_rate NUMERIC,
  
  -- Extracted features (119 features stored as JSONB for flexibility)
  features JSONB NOT NULL DEFAULT '{}',
  feature_count INTEGER NOT NULL DEFAULT 0,
  feature_coverage NUMERIC DEFAULT 0,
  
  -- Feature extraction metadata
  extraction_version TEXT DEFAULT '1.0',
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  extraction_duration_ms INTEGER,
  
  -- Data quality flags
  has_transcript BOOLEAN DEFAULT false,
  has_audio_features BOOLEAN DEFAULT false,
  has_visual_features BOOLEAN DEFAULT false,
  quality_score NUMERIC DEFAULT 0,
  
  -- Training metadata
  included_in_training BOOLEAN DEFAULT true,
  exclusion_reason TEXT,
  data_split TEXT CHECK (data_split IN ('train', 'validation', 'test')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates
  UNIQUE(video_id)
);

-- Indexes for common queries
CREATE INDEX idx_training_data_performance_tier ON training_data(performance_tier);
CREATE INDEX idx_training_data_quality_score ON training_data(quality_score DESC);
CREATE INDEX idx_training_data_included ON training_data(included_in_training);
CREATE INDEX idx_training_data_split ON training_data(data_split);
CREATE INDEX idx_training_data_created ON training_data(created_at DESC);
CREATE INDEX idx_training_data_video_id ON training_data(video_id);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_training_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS training_data_updated ON training_data;

-- Create trigger
CREATE TRIGGER training_data_updated
  BEFORE UPDATE ON training_data
  FOR EACH ROW
  EXECUTE FUNCTION update_training_data_timestamp();

-- Comments for documentation
COMMENT ON TABLE training_data IS 'Processed video features and labels for ML model training';
COMMENT ON COLUMN training_data.features IS 'JSONB containing all 119 extracted features';
COMMENT ON COLUMN training_data.feature_coverage IS 'Percentage (0-100) of features successfully extracted';
COMMENT ON COLUMN training_data.quality_score IS 'Data quality score (0-100) based on completeness';
COMMENT ON COLUMN training_data.data_split IS 'Dataset split: train (70%), validation (15%), test (15%)';

-- Confirm success
SELECT 'training_data table created successfully' AS status;
