-- =====================================================
-- PHASE 2: PREDICTION CALIBRATION TABLES
-- Created: 2025-12-03
-- Purpose: Store calibration configs and validation data
-- =====================================================

-- Table to store calibration configurations
CREATE TABLE IF NOT EXISTS calibration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id TEXT UNIQUE NOT NULL,
  scale DECIMAL(5,3) NOT NULL DEFAULT 1.0,
  offset DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  min_output DECIMAL(5,1) NOT NULL DEFAULT 0.0,
  max_output DECIMAL(5,1) NOT NULL DEFAULT 100.0,
  breakpoints JSONB DEFAULT NULL, -- For piecewise calibration
  data_points INTEGER DEFAULT 0,
  last_error DECIMAL(5,1) DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on component_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_calibration_configs_component 
ON calibration_configs(component_id);

-- Table to store prediction validation results
CREATE TABLE IF NOT EXISTS prediction_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT,
  predicted_dps DECIMAL(5,1) NOT NULL,
  actual_dps DECIMAL(5,1) NOT NULL,
  error DECIMAL(5,1) NOT NULL,
  error_percentage DECIMAL(6,1),
  component_scores JSONB DEFAULT '{}',
  calibrated_scores JSONB DEFAULT '{}',
  negative_signals JSONB DEFAULT '[]',
  transcript_hash TEXT,
  niche TEXT DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_created 
ON prediction_accuracy(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_error 
ON prediction_accuracy(ABS(error));

CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_niche 
ON prediction_accuracy(niche);

CREATE INDEX IF NOT EXISTS idx_prediction_accuracy_video 
ON prediction_accuracy(video_id);

-- Table to store calibration history for auditing
CREATE TABLE IF NOT EXISTS calibration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id TEXT NOT NULL,
  old_scale DECIMAL(5,3),
  new_scale DECIMAL(5,3),
  old_offset DECIMAL(5,1),
  new_offset DECIMAL(5,1),
  data_points INTEGER,
  expected_improvement DECIMAL(5,1),
  actual_improvement DECIMAL(5,1) DEFAULT NULL,
  applied_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookup
CREATE INDEX IF NOT EXISTS idx_calibration_history_component 
ON calibration_history(component_id, created_at DESC);

-- Table to store diagnostic runs
CREATE TABLE IF NOT EXISTS calibration_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'single', 'custom'
  samples_tested INTEGER NOT NULL,
  samples_passed INTEGER NOT NULL,
  samples_failed INTEGER NOT NULL,
  avg_error DECIMAL(5,1),
  systematic_bias DECIMAL(5,1),
  component_results JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  overall_health TEXT DEFAULT 'unknown', -- 'healthy', 'warning', 'critical'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for diagnostic history
CREATE INDEX IF NOT EXISTS idx_calibration_diagnostics_created 
ON calibration_diagnostics(created_at DESC);

-- =====================================================
-- INSERT DEFAULT CALIBRATION CONFIGS
-- =====================================================

INSERT INTO calibration_configs (component_id, scale, offset, min_output, max_output, data_points)
VALUES 
  ('xgboost', 0.60, -10.0, 0.0, 100.0, 0),
  ('gpt4', 0.55, -5.0, 0.0, 100.0, 0),
  ('pattern', 0.70, -8.0, 0.0, 100.0, 0),
  ('historical', 0.75, -5.0, 0.0, 100.0, 0),
  ('gemini', 0.50, -10.0, 0.0, 100.0, 0)
ON CONFLICT (component_id) DO UPDATE SET
  updated_at = NOW();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate calibrated score
CREATE OR REPLACE FUNCTION calculate_calibrated_score(
  raw_score DECIMAL,
  component_id TEXT
) RETURNS DECIMAL AS $$
DECLARE
  config RECORD;
  calibrated DECIMAL;
BEGIN
  SELECT * INTO config FROM calibration_configs WHERE calibration_configs.component_id = $2;
  
  IF config IS NULL THEN
    RETURN raw_score;
  END IF;
  
  calibrated := (raw_score * config.scale) + config.offset;
  calibrated := GREATEST(config.min_output, LEAST(config.max_output, calibrated));
  
  RETURN calibrated;
END;
$$ LANGUAGE plpgsql;

-- Function to get calibration stats
CREATE OR REPLACE FUNCTION get_calibration_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_predictions BIGINT,
  avg_error DECIMAL,
  avg_abs_error DECIMAL,
  within_10_percent DECIMAL,
  systematic_bias DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_predictions,
    AVG(error)::DECIMAL as avg_error,
    AVG(ABS(error))::DECIMAL as avg_abs_error,
    (COUNT(*) FILTER (WHERE ABS(error) <= 10)::DECIMAL / COUNT(*)::DECIMAL * 100) as within_10_percent,
    AVG(error)::DECIMAL as systematic_bias
  FROM prediction_accuracy
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (Optional)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE calibration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_diagnostics ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON calibration_configs
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON prediction_accuracy
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON calibration_history
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON calibration_diagnostics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow service role full access
CREATE POLICY "Allow service role" ON calibration_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role" ON prediction_accuracy
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role" ON calibration_history
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role" ON calibration_diagnostics
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE calibration_configs IS 'Stores calibration parameters for each prediction component';
COMMENT ON TABLE prediction_accuracy IS 'Stores validation data comparing predicted vs actual DPS';
COMMENT ON TABLE calibration_history IS 'Audit log of calibration parameter changes';
COMMENT ON TABLE calibration_diagnostics IS 'Results of diagnostic runs on calibration samples';

COMMENT ON COLUMN calibration_configs.scale IS 'Multiplier applied to raw score';
COMMENT ON COLUMN calibration_configs.offset IS 'Value added after scaling';
COMMENT ON COLUMN prediction_accuracy.error IS 'predicted_dps - actual_dps (positive = over-prediction)';




























































































