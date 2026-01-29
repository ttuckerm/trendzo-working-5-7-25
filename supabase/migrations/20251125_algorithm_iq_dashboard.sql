-- Algorithm IQ Dashboard Schema
-- Enables tracking of prediction accuracy and algorithm improvement over time

-- =====================================================
-- Table: algorithm_performance
-- Daily snapshots of algorithm performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS algorithm_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Date for this performance record
  date DATE NOT NULL UNIQUE,
  
  -- IQ Score (starts at 100, evolves based on performance)
  iq_score INTEGER NOT NULL DEFAULT 100,
  iq_change INTEGER DEFAULT 0, -- change from previous day
  
  -- Prediction counts
  total_predictions INTEGER NOT NULL DEFAULT 0,
  validated_predictions INTEGER NOT NULL DEFAULT 0,
  
  -- Accuracy metrics
  accuracy_rate DECIMAL(5,4) DEFAULT 0, -- % of predictions within ±10 DPS
  avg_error DECIMAL(6,2) DEFAULT 0, -- average DPS error
  median_error DECIMAL(6,2) DEFAULT 0,
  
  -- Component-level accuracies
  component_accuracies JSONB NOT NULL DEFAULT '{}',
  -- Format: {"xgboost": {"accuracy": 0.85, "avg_error": 5.2, "count": 100}, ...}
  
  -- Niche-level accuracies
  niche_accuracies JSONB NOT NULL DEFAULT '{}',
  -- Format: {"fitness": {"accuracy": 0.87, "avg_error": 4.1, "count": 50}, ...}
  
  -- Time-window accuracies (predictions validated at different intervals)
  timeframe_accuracies JSONB NOT NULL DEFAULT '{}',
  -- Format: {"6h": 0.72, "24h": 0.84, "48h": 0.91}
  
  -- Streak tracking for consistency bonus
  accuracy_streak_days INTEGER DEFAULT 0, -- consecutive days above 80% accuracy
  
  -- Auto-generated learning insights for the day
  learning_insights TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for date lookups
CREATE INDEX IF NOT EXISTS idx_algorithm_performance_date ON algorithm_performance(date DESC);

-- =====================================================
-- Table: algorithm_learning_insights
-- Tracked learning moments, deficiencies, and improvements
-- =====================================================
CREATE TABLE IF NOT EXISTS algorithm_learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Insight classification
  insight_type TEXT NOT NULL CHECK (insight_type IN ('learned', 'deficiency', 'improvement', 'anomaly')),
  
  -- Insight content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Quantified impact
  impact_value DECIMAL(6,2), -- e.g., +3.2% accuracy improvement
  impact_direction TEXT CHECK (impact_direction IN ('positive', 'negative', 'neutral')),
  
  -- Context
  component_id TEXT, -- which component this relates to
  niche TEXT, -- which niche this relates to
  
  -- Evidence (supporting data)
  evidence JSONB DEFAULT '{}',
  -- Format: {"sample_size": 50, "before": 0.72, "after": 0.85, "examples": [...]}
  
  -- Status
  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_insights_type ON algorithm_learning_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_learning_insights_created ON algorithm_learning_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_insights_component ON algorithm_learning_insights(component_id);
CREATE INDEX IF NOT EXISTS idx_learning_insights_niche ON algorithm_learning_insights(niche);

-- =====================================================
-- Table: prediction_tracking (enhanced tracking)
-- Individual prediction tracking for detailed analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS prediction_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Video and prediction references
  video_id TEXT NOT NULL,
  prediction_id UUID,
  
  -- Predicted values
  predicted_dps DECIMAL(5,2) NOT NULL,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence DECIMAL(4,3),
  
  -- Component-level predictions
  component_predictions JSONB DEFAULT '{}',
  -- Format: {"xgboost": 72.3, "gpt4": 68.5, "gemini": 71.0, ...}
  
  -- Actual values (filled in later)
  actual_dps DECIMAL(5,2),
  actual_metrics_at TIMESTAMPTZ,
  
  -- Accuracy calculation
  error_delta DECIMAL(6,2), -- predicted - actual
  error_delta_abs DECIMAL(6,2), -- abs(predicted - actual)
  within_threshold BOOLEAN, -- within ±10 DPS
  
  -- Context
  niche TEXT,
  account_size TEXT,
  
  -- Status
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'expired')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prediction_tracking_video ON prediction_tracking(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_tracking_status ON prediction_tracking(validation_status);
CREATE INDEX IF NOT EXISTS idx_prediction_tracking_predicted_at ON prediction_tracking(predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_tracking_niche ON prediction_tracking(niche);

-- =====================================================
-- Function: calculate_iq_score
-- Calculates the Algorithm IQ score based on metrics
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_iq_score(
  p_accuracy_rate DECIMAL,
  p_streak_days INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_base_iq INTEGER := 100;
  v_accuracy_bonus DECIMAL;
  v_consistency_bonus DECIMAL;
  v_final_iq INTEGER;
BEGIN
  -- Accuracy bonus: +20 points for 100% accuracy, -20 for 60% accuracy
  v_accuracy_bonus := (p_accuracy_rate - 0.80) * 100;
  
  -- Consistency bonus: up to +15 for 30-day streak
  v_consistency_bonus := LEAST(p_streak_days * 0.5, 15);
  
  -- Calculate final IQ
  v_final_iq := v_base_iq + v_accuracy_bonus + v_consistency_bonus;
  
  -- Clamp to reasonable range (50-200)
  RETURN GREATEST(50, LEAST(200, v_final_iq));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: update_daily_performance
-- Aggregates daily metrics and updates performance table
-- =====================================================
CREATE OR REPLACE FUNCTION update_daily_performance(p_date DATE DEFAULT CURRENT_DATE) 
RETURNS void AS $$
DECLARE
  v_total INTEGER;
  v_validated INTEGER;
  v_accuracy DECIMAL;
  v_avg_error DECIMAL;
  v_prev_streak INTEGER;
  v_new_streak INTEGER;
  v_iq INTEGER;
  v_prev_iq INTEGER;
  v_component_accs JSONB;
  v_niche_accs JSONB;
BEGIN
  -- Get prediction counts and accuracy for the date
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE validation_status = 'validated'),
    COALESCE(AVG(CASE WHEN within_threshold THEN 1.0 ELSE 0.0 END), 0),
    COALESCE(AVG(error_delta_abs), 0)
  INTO v_total, v_validated, v_accuracy, v_avg_error
  FROM prediction_tracking
  WHERE DATE(predicted_at) = p_date AND validation_status = 'validated';

  -- Get previous day's streak
  SELECT COALESCE(accuracy_streak_days, 0), COALESCE(iq_score, 100)
  INTO v_prev_streak, v_prev_iq
  FROM algorithm_performance
  WHERE date = p_date - INTERVAL '1 day';

  -- Calculate new streak
  IF v_accuracy >= 0.80 THEN
    v_new_streak := COALESCE(v_prev_streak, 0) + 1;
  ELSE
    v_new_streak := 0;
  END IF;

  -- Calculate IQ score
  v_iq := calculate_iq_score(v_accuracy, v_new_streak);

  -- Aggregate component accuracies
  SELECT COALESCE(jsonb_object_agg(
    component_id,
    jsonb_build_object(
      'accuracy', ROUND(AVG(CASE WHEN cr.successful_predictions > 0 
        THEN cr.successful_predictions::decimal / cr.total_predictions 
        ELSE 0 END)::numeric, 3),
      'avg_error', ROUND(AVG(cr.avg_accuracy_delta)::numeric, 2),
      'count', SUM(cr.total_predictions)
    )
  ), '{}')
  INTO v_component_accs
  FROM component_reliability cr;

  -- Aggregate niche accuracies from prediction_tracking
  SELECT COALESCE(jsonb_object_agg(
    niche,
    jsonb_build_object(
      'accuracy', ROUND(AVG(CASE WHEN within_threshold THEN 1.0 ELSE 0.0 END)::numeric, 3),
      'avg_error', ROUND(AVG(error_delta_abs)::numeric, 2),
      'count', COUNT(*)
    )
  ), '{}')
  INTO v_niche_accs
  FROM prediction_tracking
  WHERE DATE(predicted_at) = p_date 
    AND validation_status = 'validated'
    AND niche IS NOT NULL
  GROUP BY niche;

  -- Upsert the daily performance record
  INSERT INTO algorithm_performance (
    date, iq_score, iq_change, total_predictions, validated_predictions,
    accuracy_rate, avg_error, accuracy_streak_days,
    component_accuracies, niche_accuracies, updated_at
  ) VALUES (
    p_date, v_iq, v_iq - COALESCE(v_prev_iq, 100), v_total, v_validated,
    v_accuracy, v_avg_error, v_new_streak,
    v_component_accs, v_niche_accs, NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    iq_score = EXCLUDED.iq_score,
    iq_change = EXCLUDED.iq_change,
    total_predictions = EXCLUDED.total_predictions,
    validated_predictions = EXCLUDED.validated_predictions,
    accuracy_rate = EXCLUDED.accuracy_rate,
    avg_error = EXCLUDED.avg_error,
    accuracy_streak_days = EXCLUDED.accuracy_streak_days,
    component_accuracies = EXCLUDED.component_accuracies,
    niche_accuracies = EXCLUDED.niche_accuracies,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initialize with today's record
-- =====================================================
INSERT INTO algorithm_performance (date, iq_score)
VALUES (CURRENT_DATE, 100)
ON CONFLICT (date) DO NOTHING;

-- Comments
COMMENT ON TABLE algorithm_performance IS 'Daily snapshots of algorithm performance and IQ score';
COMMENT ON TABLE algorithm_learning_insights IS 'Learning moments, deficiencies, and improvements tracked over time';
COMMENT ON TABLE prediction_tracking IS 'Individual prediction tracking for detailed accuracy analysis';
COMMENT ON FUNCTION calculate_iq_score IS 'Calculates Algorithm IQ from accuracy and consistency metrics';
COMMENT ON FUNCTION update_daily_performance IS 'Aggregates daily metrics and updates algorithm_performance table';
















