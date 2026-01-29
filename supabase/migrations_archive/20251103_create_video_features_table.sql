-- Create video_features table to store extracted ML features
-- Each row represents a complete feature vector for one video

CREATE TABLE IF NOT EXISTS video_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES scraped_videos(video_id) ON DELETE CASCADE,

  -- Extraction metadata
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feature_count INTEGER NOT NULL,

  -- Store complete feature object as JSONB for flexibility
  features JSONB NOT NULL,

  -- Store flattened feature vector as array for ML model input
  -- This is a 119-element array (120 features minus 1 string feature)
  feature_vector FLOAT8[] NOT NULL,

  -- Denormalized fields for quick filtering/sorting
  dps_score FLOAT8,
  engagement_rate FLOAT8,
  word_count INTEGER,
  sentiment_polarity FLOAT8,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one feature extraction per video
  UNIQUE(video_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_video_features_video_id ON video_features(video_id);
CREATE INDEX IF NOT EXISTS idx_video_features_extracted_at ON video_features(extracted_at);
CREATE INDEX IF NOT EXISTS idx_video_features_dps_score ON video_features(dps_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_engagement_rate ON video_features(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_video_features_word_count ON video_features(word_count);

-- Create GIN index for JSONB features for fast queries
CREATE INDEX IF NOT EXISTS idx_video_features_features_gin ON video_features USING GIN (features);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at (drop first if exists)
DROP TRIGGER IF EXISTS video_features_updated_at ON video_features;
CREATE TRIGGER video_features_updated_at
  BEFORE UPDATE ON video_features
  FOR EACH ROW
  EXECUTE FUNCTION update_video_features_updated_at();

-- Add comments
COMMENT ON TABLE video_features IS 'Extracted ML features from video transcripts and metadata (120 features per video)';
COMMENT ON COLUMN video_features.features IS 'Complete feature object with all 12 feature groups (A-L)';
COMMENT ON COLUMN video_features.feature_vector IS 'Flattened numeric array (119 features) ready for ML model input';
COMMENT ON COLUMN video_features.dps_score IS 'Denormalized DPS score for quick filtering';
COMMENT ON COLUMN video_features.engagement_rate IS 'Denormalized engagement rate for quick filtering';
