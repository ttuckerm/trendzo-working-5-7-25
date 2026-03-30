-- =====================================================
-- FEAT-070: Pre-Content Viral Prediction
-- =====================================================
-- Purpose: Store pre-content viral predictions for validation and learning
-- Dependencies: viral_patterns, extracted_knowledge tables

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input data
  script TEXT NOT NULL CHECK (LENGTH(script) >= 50 AND LENGTH(script) <= 5000),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  niche VARCHAR(100) NOT NULL,
  estimated_duration INTEGER, -- seconds
  creator_followers INTEGER DEFAULT 10000,

  -- Prediction results
  predicted_dps NUMERIC(10,2) NOT NULL CHECK (predicted_dps >= 0 AND predicted_dps <= 100),
  predicted_classification VARCHAR(50) NOT NULL CHECK (predicted_classification IN ('mega-viral', 'viral', 'good', 'normal')),
  confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  viral_probability NUMERIC(5,4) CHECK (viral_probability >= 0 AND viral_probability <= 1),

  -- Breakdown scores
  pattern_based_score NUMERIC(10,2),
  novelty_bonus NUMERIC(10,2),
  confidence_factor NUMERIC(5,4),

  -- Insights
  extraction_insights JSONB, -- From FEAT-060
  top_pattern_matches JSONB, -- Array of top matching patterns
  viral_elements_detected JSONB, -- Hooks, triggers, structure

  -- Recommendations
  recommendations TEXT[],

  -- Validation (filled later when actual video posted)
  actual_video_id VARCHAR(255),
  actual_dps NUMERIC(10,2) CHECK (actual_dps >= 0 AND actual_dps <= 100),
  prediction_error NUMERIC(10,2), -- abs(predicted_dps - actual_dps)
  validated_at TIMESTAMPTZ,

  -- Metadata
  user_id VARCHAR(255), -- For auth/rate limiting
  user_ip VARCHAR(45), -- For audit
  script_hash VARCHAR(64), -- SHA256 hash for deduplication
  patterns_analyzed INTEGER,
  processing_time_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_niche ON predictions(niche);
CREATE INDEX IF NOT EXISTS idx_predictions_platform ON predictions(platform);
CREATE INDEX IF NOT EXISTS idx_predictions_predicted_dps ON predictions(predicted_dps DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON predictions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_script_hash ON predictions(script_hash);
CREATE INDEX IF NOT EXISTS idx_predictions_validated ON predictions(validated_at) WHERE validated_at IS NOT NULL;

-- Index for finding recent predictions by same user (for caching)
CREATE INDEX IF NOT EXISTS idx_predictions_user_recent ON predictions(user_id, script_hash, created_at DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

-- RLS Policies (users can only see their own predictions)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own predictions
CREATE POLICY predictions_insert_own ON predictions
  FOR INSERT
  WITH CHECK (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Policy: Users can view their own predictions
CREATE POLICY predictions_select_own ON predictions
  FOR SELECT
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Policy: Users can update their own predictions (for validation)
CREATE POLICY predictions_update_own ON predictions
  FOR UPDATE
  USING (auth.uid()::TEXT = user_id OR user_id IS NULL);

-- Policy: Admins can view all predictions
CREATE POLICY predictions_select_admin ON predictions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE predictions IS 'FEAT-070: Stores pre-content viral predictions for validation and learning';
COMMENT ON COLUMN predictions.script IS 'User-submitted script (50-5000 chars)';
COMMENT ON COLUMN predictions.predicted_dps IS 'Predicted DPS score (0-100)';
COMMENT ON COLUMN predictions.confidence IS 'Prediction confidence (0.0-1.0)';
COMMENT ON COLUMN predictions.viral_probability IS 'Probability of going viral (0.0-1.0)';
COMMENT ON COLUMN predictions.top_pattern_matches IS 'Top 5 matching viral patterns with scores';
COMMENT ON COLUMN predictions.recommendations IS 'Actionable recommendations for improvement';
COMMENT ON COLUMN predictions.actual_video_id IS 'Video ID if user later posts (for validation)';
COMMENT ON COLUMN predictions.prediction_error IS 'Absolute error: |predicted_dps - actual_dps|';
COMMENT ON COLUMN predictions.script_hash IS 'SHA256 hash for deduplication and caching';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON predictions TO authenticated;
GRANT ALL ON predictions TO service_role;
