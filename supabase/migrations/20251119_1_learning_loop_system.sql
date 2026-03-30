-- Learning Loop System
-- Enables Kai to learn from prediction outcomes and improve accuracy over time

-- =====================================================
-- Table: prediction_outcomes
-- Stores actual metrics after video goes live
-- =====================================================
CREATE TABLE IF NOT EXISTS prediction_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  video_id UUID NOT NULL REFERENCES video_files(id) ON DELETE CASCADE,
  prediction_id UUID NOT NULL REFERENCES prediction_events(id) ON DELETE CASCADE,

  -- Actual metrics (as reported by user or scraped)
  actual_views INTEGER NOT NULL,
  actual_likes INTEGER NOT NULL,
  actual_comments INTEGER NOT NULL,
  actual_shares INTEGER NOT NULL,
  actual_saves INTEGER NOT NULL,

  -- Calculated actual DPS
  actual_dps DECIMAL(5,2) NOT NULL,
  actual_engagement_rate DECIMAL(6,4) NOT NULL,

  -- Prediction accuracy
  predicted_dps DECIMAL(5,2) NOT NULL,
  accuracy_delta DECIMAL(6,2) NOT NULL, -- predicted - actual
  accuracy_delta_pct DECIMAL(6,2) NOT NULL, -- abs(delta) / actual * 100
  within_confidence_range BOOLEAN NOT NULL,

  -- Component-level deltas (JSONB for flexibility)
  component_deltas JSONB NOT NULL DEFAULT '{}',
  -- Format: { "xgboost": { "predicted": 72.3, "delta": -15.6 }, ... }

  -- Metadata
  reported_by TEXT, -- 'user_manual' | 'apify_scraper' | 'system_auto'
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Days since prediction
  days_since_prediction INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_prediction_outcome UNIQUE(prediction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_video ON prediction_outcomes(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_prediction ON prediction_outcomes(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_accuracy ON prediction_outcomes(accuracy_delta_pct);
CREATE INDEX IF NOT EXISTS idx_prediction_outcomes_reported_at ON prediction_outcomes(reported_at DESC);

-- =====================================================
-- Table: component_reliability
-- Tracks each component's historical accuracy
-- =====================================================
CREATE TABLE IF NOT EXISTS component_reliability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Component identification
  component_id TEXT NOT NULL UNIQUE,
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL, -- 'quantitative' | 'qualitative' | 'pattern' | 'historical'

  -- Reliability metrics (updated with each outcome)
  total_predictions INTEGER NOT NULL DEFAULT 0,
  successful_predictions INTEGER NOT NULL DEFAULT 0, -- within ±10 DPS

  -- Accuracy statistics
  avg_accuracy_delta DECIMAL(6,2) NOT NULL DEFAULT 0, -- average error
  avg_accuracy_delta_pct DECIMAL(6,2) NOT NULL DEFAULT 0, -- average % error
  median_accuracy_delta DECIMAL(6,2) NOT NULL DEFAULT 0,

  -- Reliability score (0-1, used for weighting)
  reliability_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,

  -- Confidence metrics
  confidence_score DECIMAL(4,3) NOT NULL DEFAULT 0.500,
  consistency_score DECIMAL(4,3) NOT NULL DEFAULT 0.500, -- low variance = high consistency

  -- Performance by context
  performance_by_niche JSONB NOT NULL DEFAULT '{}',
  -- Format: { "business": { "count": 15, "avg_delta": -5.2, "reliability": 0.82 }, ... }

  performance_by_account_size JSONB NOT NULL DEFAULT '{}',
  -- Format: { "small": { "count": 20, "avg_delta": 2.1, "reliability": 0.75 }, ... }

  -- Last updated
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_component_reliability_score ON component_reliability(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_component_reliability_type ON component_reliability(component_type);
CREATE INDEX IF NOT EXISTS idx_component_reliability_enabled ON component_reliability(enabled);

-- =====================================================
-- Initialize component_reliability with Kai's components
-- =====================================================
INSERT INTO component_reliability (component_id, component_name, component_type) VALUES
  ('xgboost', 'XGBoost 118 Features', 'quantitative'),
  ('feature-extraction', 'Feature Extraction Engine', 'quantitative'),
  ('ffmpeg', 'FFmpeg Visual Analysis', 'quantitative'),
  ('dps-engine', 'DPS Calculator', 'quantitative'),

  ('gpt4', 'GPT-4 Analysis', 'qualitative'),
  ('claude', 'Claude Analysis', 'qualitative'),
  ('gemini', 'Gemini Analysis', 'qualitative'),

  ('7-legos', '7 Idea Legos', 'pattern'),
  ('9-attributes', '9 Attributes Scorer', 'pattern'),
  ('24-styles', '24 Video Styles', 'pattern'),
  ('pattern-extraction', 'Pattern Extraction', 'pattern'),
  ('virality-matrix', 'Virality Matrix', 'pattern'),
  ('hook-scorer', 'Hook Strength Scorer', 'pattern'),

  ('audio-analyzer', 'Audio Analysis Engine', 'quantitative'),
  ('visual-scene-detector', 'Visual Scene Detection', 'quantitative'),

  ('historical', 'Historical Comparison', 'historical'),
  ('niche-keywords', 'Niche Keywords', 'historical')
ON CONFLICT (component_id) DO NOTHING;

-- =====================================================
-- Function: update_component_reliability
-- Called when a new outcome is recorded
-- =====================================================
CREATE OR REPLACE FUNCTION update_component_reliability(
  p_component_id TEXT,
  p_predicted_dps DECIMAL,
  p_actual_dps DECIMAL,
  p_niche TEXT,
  p_account_size TEXT
) RETURNS void AS $$
DECLARE
  v_delta DECIMAL;
  v_delta_pct DECIMAL;
  v_within_range BOOLEAN;
  v_current_count INTEGER;
  v_current_avg DECIMAL;
  v_new_avg DECIMAL;
  v_new_reliability DECIMAL;
BEGIN
  -- Calculate delta
  v_delta := p_predicted_dps - p_actual_dps;
  v_delta_pct := ABS(v_delta) / NULLIF(p_actual_dps, 0) * 100;
  v_within_range := ABS(v_delta) <= 10;

  -- Get current stats
  SELECT total_predictions, avg_accuracy_delta
  INTO v_current_count, v_current_avg
  FROM component_reliability
  WHERE component_id = p_component_id;

  -- Update running averages
  v_new_avg := ((v_current_avg * v_current_count) + v_delta) / (v_current_count + 1);

  -- Calculate new reliability (exponential moving average)
  -- High reliability = low average error
  v_new_reliability := GREATEST(0, LEAST(1, 1 - (ABS(v_new_avg) / 100)));

  -- Update component_reliability
  UPDATE component_reliability
  SET
    total_predictions = total_predictions + 1,
    successful_predictions = successful_predictions + CASE WHEN v_within_range THEN 1 ELSE 0 END,
    avg_accuracy_delta = v_new_avg,
    avg_accuracy_delta_pct = ((avg_accuracy_delta_pct * v_current_count) + v_delta_pct) / (v_current_count + 1),
    reliability_score = v_new_reliability,
    confidence_score = CAST(successful_predictions AS DECIMAL) / NULLIF(total_predictions, 0),
    last_updated = NOW()
  WHERE component_id = p_component_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE prediction_outcomes IS 'Stores actual video performance metrics for learning loop';
COMMENT ON TABLE component_reliability IS 'Tracks accuracy and reliability of each Kai component over time';
COMMENT ON FUNCTION update_component_reliability IS 'Updates component reliability metrics when new outcome is recorded';
