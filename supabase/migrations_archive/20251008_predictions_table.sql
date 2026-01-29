CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input
  script TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  niche VARCHAR(100) NOT NULL,

  -- Prediction
  predicted_dps NUMERIC(10, 2),
  predicted_classification VARCHAR(50),
  confidence NUMERIC(5, 4), -- 0.0-1.0

  -- Breakdown
  extraction_insights JSONB,
  top_pattern_matches JSONB,
  recommendations TEXT[],

  -- Validation (filled in later)
  actual_video_id VARCHAR(255),
  actual_dps NUMERIC(10, 2),
  actual_classification VARCHAR(50),
  prediction_error NUMERIC(10, 2),
  validated_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_predictions_niche ON predictions(niche);
CREATE INDEX idx_predictions_confidence ON predictions(confidence DESC);
CREATE INDEX idx_predictions_validated ON predictions(validated_at) WHERE validated_at IS NOT NULL;

-- View: Prediction accuracy by niche
CREATE OR REPLACE VIEW prediction_accuracy AS
SELECT
  niche,
  COUNT(*) as total_predictions,
  COUNT(*) FILTER (WHERE validated_at IS NOT NULL) as validated_count,
  AVG(confidence) as avg_confidence,
  AVG(ABS(predicted_dps - actual_dps)) as avg_error,
  COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) as within_10_points,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ABS(predicted_dps - actual_dps) <= 10) /
    NULLIF(COUNT(*) FILTER (WHERE validated_at IS NOT NULL), 0),
    1
  ) as accuracy_pct
FROM predictions
GROUP BY niche
ORDER BY accuracy_pct DESC NULLS LAST;
