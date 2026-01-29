-- =============================================
-- OPERATIONS INTELLIGENCE CENTER SCHEMA
-- CleanCopy Platform Operations & ML Monitoring
-- =============================================

-- 1. PREDICTION LOGS (Track every prediction for accuracy measurement)
CREATE TABLE IF NOT EXISTS prediction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- What was predicted
  video_id TEXT,
  video_url TEXT,
  creator_id UUID,
  
  -- The prediction
  predicted_dps DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  prediction_range_low DECIMAL(5,2),
  prediction_range_high DECIMAL(5,2),
  
  -- Model info
  model_version TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'xgboost', 'hybrid', 'ensemble'
  features_used INTEGER DEFAULT 119,
  features_missing TEXT[], -- Any features that were null/missing
  
  -- Processing metrics
  processing_time_ms INTEGER,
  
  -- For accuracy tracking (filled in later when actual performance known)
  actual_dps DECIMAL(5,2),
  actual_views BIGINT,
  actual_engagement_rate DECIMAL(5,4),
  accuracy_measured_at TIMESTAMPTZ,
  prediction_error DECIMAL(5,2), -- actual_dps - predicted_dps
  
  -- Metadata
  request_source TEXT, -- 'api', 'dashboard', 'bulk', 'training'
  user_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MODEL VERSIONS (Track all model versions and their performance)
CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  model_type TEXT NOT NULL, -- 'xgboost', 'gpt4', 'vision', 'ensemble'
  version TEXT NOT NULL,
  
  -- Training info
  trained_at TIMESTAMPTZ NOT NULL,
  training_samples INTEGER NOT NULL,
  training_duration_minutes INTEGER,
  
  -- Performance metrics at training time
  training_accuracy DECIMAL(5,4),
  validation_accuracy DECIMAL(5,4),
  test_accuracy DECIMAL(5,4),
  mae DECIMAL(5,2), -- Mean Absolute Error
  rmse DECIMAL(5,2), -- Root Mean Square Error
  calibration_score DECIMAL(5,4),
  
  -- Feature importance (top 20)
  feature_importance JSONB, -- [{feature: 'hook_strength', importance: 0.15}, ...]
  
  -- Status
  status TEXT DEFAULT 'training' CHECK (status IN ('training', 'validating', 'active', 'deprecated', 'failed')),
  is_production BOOLEAN DEFAULT FALSE,
  promoted_at TIMESTAMPTZ,
  deprecated_at TIMESTAMPTZ,
  deprecation_reason TEXT,
  
  -- Config
  hyperparameters JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRAINING JOBS (Track training pipeline runs)
CREATE TABLE IF NOT EXISTS training_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  job_type TEXT NOT NULL CHECK (job_type IN ('full_retrain', 'incremental', 'fine_tune', 'experiment')),
  model_type TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  
  -- Progress
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  progress_percent INTEGER DEFAULT 0,
  current_step TEXT,
  
  -- Data
  training_samples INTEGER,
  validation_samples INTEGER,
  test_samples INTEGER,
  
  -- Results
  result_model_version_id UUID REFERENCES model_versions(id),
  error_message TEXT,
  logs TEXT,
  
  -- Trigger
  triggered_by TEXT, -- 'scheduled', 'manual', 'auto_drift'
  triggered_by_user UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TRAINING DATA (Track data used for training)
CREATE TABLE IF NOT EXISTS training_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Video info
  video_id TEXT NOT NULL,
  video_url TEXT,
  platform TEXT DEFAULT 'tiktok',
  
  -- Creator info
  creator_handle TEXT,
  creator_followers INTEGER,
  
  -- Performance (ground truth)
  actual_views BIGINT NOT NULL,
  actual_likes BIGINT,
  actual_comments BIGINT,
  actual_shares BIGINT,
  actual_dps DECIMAL(5,2) NOT NULL,
  
  -- Classification
  performance_tier TEXT CHECK (performance_tier IN ('viral', 'above_average', 'average', 'below_average', 'poor')),
  
  -- Features (stored for training)
  features JSONB NOT NULL,
  transcript TEXT,
  
  -- Metadata
  scraped_at TIMESTAMPTZ,
  data_quality_score DECIMAL(3,2),
  
  -- Usage
  used_in_training BOOLEAN DEFAULT FALSE,
  training_job_id UUID REFERENCES training_jobs(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_id, platform)
);

-- 5. SYSTEM METRICS (Time-series metrics for monitoring)
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(12,4) NOT NULL,
  metric_unit TEXT,
  
  -- Dimensions
  service TEXT, -- 'api', 'python', 'supabase', 'openai'
  endpoint TEXT,
  
  -- Time
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- For aggregation
  period TEXT DEFAULT 'minute' CHECK (period IN ('minute', 'hour', 'day'))
);

-- Index for efficient time-series queries
CREATE INDEX IF NOT EXISTS idx_system_metrics_time ON system_metrics(metric_name, recorded_at DESC);

-- 6. OPERATIONS ALERTS (Active and historical alerts)
CREATE TABLE IF NOT EXISTS operations_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  alert_type TEXT NOT NULL, -- 'model_drift', 'accuracy_drop', 'service_down', 'error_spike', 'anomaly'
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Context
  metric_name TEXT,
  metric_value DECIMAL(12,4),
  threshold_value DECIMAL(12,4),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'snoozed')),
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  
  -- Recurrence
  first_triggered_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. EXPERIMENTS (A/B tests and feature experiments)
CREATE TABLE IF NOT EXISTS ml_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  description TEXT,
  
  experiment_type TEXT NOT NULL CHECK (experiment_type IN ('model_ab', 'feature_test', 'algorithm_change', 'ui_test')),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'cancelled')),
  
  -- Config
  control_config JSONB NOT NULL,
  variant_config JSONB NOT NULL,
  traffic_split DECIMAL(3,2) DEFAULT 0.5,
  
  -- Timeline
  started_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  control_samples INTEGER DEFAULT 0,
  variant_samples INTEGER DEFAULT 0,
  control_metric DECIMAL(8,4),
  variant_metric DECIMAL(8,4),
  lift_percent DECIMAL(5,2),
  p_value DECIMAL(6,4),
  is_significant BOOLEAN,
  winner TEXT, -- 'control', 'variant', 'inconclusive'
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. DAILY METRICS SNAPSHOT (Aggregated daily metrics for trends)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  date DATE NOT NULL,
  
  -- Prediction metrics
  total_predictions INTEGER DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  predictions_with_actuals INTEGER DEFAULT 0,
  
  -- Accuracy metrics (only for predictions with actuals)
  mean_absolute_error DECIMAL(5,2),
  mean_squared_error DECIMAL(8,2),
  accuracy_within_5 DECIMAL(5,4),
  accuracy_within_10 DECIMAL(5,4),
  calibration_score DECIMAL(5,4),
  
  -- Model performance by tier
  accuracy_viral DECIMAL(5,4),
  accuracy_average DECIMAL(5,4),
  accuracy_poor DECIMAL(5,4),
  
  -- System metrics
  avg_response_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  uptime_percent DECIMAL(5,2),
  
  -- Training data
  new_training_samples INTEGER DEFAULT 0,
  total_training_samples INTEGER,
  
  -- Business metrics
  videos_analyzed INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date)
);

-- 9. FEATURE HEALTH (Track feature extraction quality)
CREATE TABLE IF NOT EXISTS feature_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  date DATE NOT NULL,
  
  feature_name TEXT NOT NULL,
  feature_group TEXT,
  
  -- Coverage
  total_extractions INTEGER,
  successful_extractions INTEGER,
  null_count INTEGER,
  error_count INTEGER,
  coverage_percent DECIMAL(5,2),
  
  -- Distribution
  mean_value DECIMAL(12,4),
  std_dev DECIMAL(12,4),
  min_value DECIMAL(12,4),
  max_value DECIMAL(12,4),
  
  -- Drift detection
  baseline_mean DECIMAL(12,4),
  drift_score DECIMAL(5,4),
  is_drifting BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(date, feature_name)
);

-- 10. OPERATIONS LOG (High-level operations events)
CREATE TABLE IF NOT EXISTS operations_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  event_type TEXT NOT NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Related entities
  related_type TEXT,
  related_id UUID,
  
  -- Context
  metadata JSONB,
  
  -- Who
  actor_id UUID,
  actor_type TEXT, -- 'user', 'system', 'scheduled'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_prediction_logs_created ON prediction_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_video ON prediction_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_accuracy ON prediction_logs(actual_dps) WHERE actual_dps IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_training_data_tier ON training_data(performance_tier);
CREATE INDEX IF NOT EXISTS idx_training_data_dps ON training_data(actual_dps);
CREATE INDEX IF NOT EXISTS idx_operations_alerts_status ON operations_alerts(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_ml_experiments_status ON ml_experiments(status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date DESC);
CREATE INDEX IF NOT EXISTS idx_feature_health_date ON feature_health(date DESC, feature_name);
CREATE INDEX IF NOT EXISTS idx_operations_log_created ON operations_log(created_at DESC);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to calculate accuracy metrics for a date range
CREATE OR REPLACE FUNCTION calculate_accuracy_metrics(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_predictions BIGINT,
  predictions_with_actuals BIGINT,
  mean_absolute_error DECIMAL,
  accuracy_within_5 DECIMAL,
  accuracy_within_10 DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_predictions,
    COUNT(pl.actual_dps)::BIGINT as predictions_with_actuals,
    AVG(ABS(pl.prediction_error))::DECIMAL as mean_absolute_error,
    (COUNT(*) FILTER (WHERE ABS(pl.prediction_error) <= 5)::DECIMAL / 
     NULLIF(COUNT(pl.actual_dps), 0))::DECIMAL as accuracy_within_5,
    (COUNT(*) FILTER (WHERE ABS(pl.prediction_error) <= 10)::DECIMAL / 
     NULLIF(COUNT(pl.actual_dps), 0))::DECIMAL as accuracy_within_10
  FROM prediction_logs pl
  WHERE pl.created_at BETWEEN start_date AND end_date
    AND pl.actual_dps IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to get training data distribution
CREATE OR REPLACE FUNCTION get_training_data_distribution()
RETURNS TABLE (
  performance_tier TEXT,
  count BIGINT,
  percentage DECIMAL
) AS $$
DECLARE
  total_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_count FROM training_data;
  
  RETURN QUERY
  SELECT 
    td.performance_tier,
    COUNT(*)::BIGINT as count,
    (COUNT(*)::DECIMAL / NULLIF(total_count, 0) * 100)::DECIMAL as percentage
  FROM training_data td
  WHERE td.performance_tier IS NOT NULL
  GROUP BY td.performance_tier
  ORDER BY 
    CASE td.performance_tier
      WHEN 'viral' THEN 1
      WHEN 'above_average' THEN 2
      WHEN 'average' THEN 3
      WHEN 'below_average' THEN 4
      WHEN 'poor' THEN 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Insert some seed data for demo
INSERT INTO model_versions (model_type, version, trained_at, training_samples, training_accuracy, validation_accuracy, test_accuracy, mae, rmse, calibration_score, status, is_production)
VALUES 
  ('ensemble', 'v2.3.1', NOW() - INTERVAL '2 days', 12847, 0.752, 0.738, 0.732, 8.4, 12.1, 0.82, 'active', true),
  ('ensemble', 'v2.3.0', NOW() - INTERVAL '9 days', 11234, 0.741, 0.722, 0.718, 9.1, 13.2, 0.79, 'deprecated', false),
  ('ensemble', 'v2.2.0', NOW() - INTERVAL '30 days', 9876, 0.723, 0.705, 0.698, 10.2, 14.8, 0.75, 'deprecated', false)
ON CONFLICT DO NOTHING;

-- Insert sample daily metrics
INSERT INTO daily_metrics (date, total_predictions, avg_confidence, predictions_with_actuals, mean_absolute_error, accuracy_within_5, accuracy_within_10, avg_response_time_ms, videos_analyzed, api_calls)
VALUES 
  (CURRENT_DATE, 127, 0.73, 89, 8.4, 0.34, 0.68, 340, 127, 892),
  (CURRENT_DATE - 1, 156, 0.71, 112, 8.8, 0.32, 0.65, 356, 156, 1023),
  (CURRENT_DATE - 2, 143, 0.72, 98, 8.6, 0.33, 0.67, 328, 143, 945),
  (CURRENT_DATE - 3, 189, 0.74, 134, 8.2, 0.35, 0.70, 312, 189, 1156),
  (CURRENT_DATE - 4, 134, 0.70, 87, 9.1, 0.31, 0.63, 378, 134, 867),
  (CURRENT_DATE - 5, 167, 0.73, 121, 8.5, 0.34, 0.68, 345, 167, 1089),
  (CURRENT_DATE - 6, 145, 0.72, 102, 8.7, 0.33, 0.66, 352, 145, 956)
ON CONFLICT (date) DO NOTHING;
























































































