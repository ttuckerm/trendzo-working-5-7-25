-- Kai A/B Testing Integration Tables
-- Connects A/B testing framework with Kai Learning Loop for component variant testing

-- Component variant tests
CREATE TABLE IF NOT EXISTS kai_component_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL UNIQUE,
  component_id TEXT NOT NULL,
  variant_a_config JSONB NOT NULL,
  variant_b_config JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create index on status for active test queries
CREATE INDEX IF NOT EXISTS idx_kai_component_tests_status ON kai_component_tests(status)
WHERE status = 'running';

-- Create index on component_id
CREATE INDEX IF NOT EXISTS idx_kai_component_tests_component ON kai_component_tests(component_id);

-- Test prediction results (one row per prediction)
CREATE TABLE IF NOT EXISTS kai_test_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  video_id TEXT NOT NULL,
  predicted_dps NUMERIC NOT NULL,
  actual_dps NUMERIC,
  error NUMERIC,
  accuracy NUMERIC,
  latency INTEGER NOT NULL, -- milliseconds
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_test_id FOREIGN KEY (test_id) REFERENCES kai_component_tests(test_id) ON DELETE CASCADE
);

-- Create index on test_id and variant for fast metric aggregation
CREATE INDEX IF NOT EXISTS idx_kai_test_predictions_test_variant
ON kai_test_predictions(test_id, variant);

-- Create index on video_id
CREATE INDEX IF NOT EXISTS idx_kai_test_predictions_video
ON kai_test_predictions(video_id);

-- Component production configurations (promoted winners)
CREATE TABLE IF NOT EXISTS kai_component_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  reliability NUMERIC NOT NULL,
  promoted_from_test TEXT,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on component_id
CREATE INDEX IF NOT EXISTS idx_kai_component_configs_component
ON kai_component_configs(component_id);

-- Component test metrics view (aggregated)
CREATE OR REPLACE VIEW kai_component_test_metrics AS
SELECT
  t.test_id,
  t.component_id,
  t.status,
  t.created_at,

  -- Variant A metrics
  COUNT(CASE WHEN p.variant = 'A' THEN 1 END) AS variant_a_predictions,
  AVG(CASE WHEN p.variant = 'A' THEN p.accuracy END) AS variant_a_avg_accuracy,
  AVG(CASE WHEN p.variant = 'A' THEN p.latency END) AS variant_a_avg_latency,
  AVG(CASE WHEN p.variant = 'A' THEN p.error END) AS variant_a_avg_error,

  -- Variant B metrics
  COUNT(CASE WHEN p.variant = 'B' THEN 1 END) AS variant_b_predictions,
  AVG(CASE WHEN p.variant = 'B' THEN p.accuracy END) AS variant_b_avg_accuracy,
  AVG(CASE WHEN p.variant = 'B' THEN p.latency END) AS variant_b_avg_latency,
  AVG(CASE WHEN p.variant = 'B' THEN p.error END) AS variant_b_avg_error,

  -- Winner determination
  CASE
    WHEN AVG(CASE WHEN p.variant = 'B' THEN p.accuracy END) >
         AVG(CASE WHEN p.variant = 'A' THEN p.accuracy END) + 0.02
    THEN 'B'
    WHEN AVG(CASE WHEN p.variant = 'A' THEN p.accuracy END) >
         AVG(CASE WHEN p.variant = 'B' THEN p.accuracy END) + 0.02
    THEN 'A'
    ELSE 'inconclusive'
  END AS winner

FROM kai_component_tests t
LEFT JOIN kai_test_predictions p ON t.test_id = p.test_id
GROUP BY t.test_id, t.component_id, t.status, t.created_at;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON kai_component_tests TO authenticated;
GRANT SELECT, INSERT ON kai_test_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON kai_component_configs TO authenticated;
GRANT SELECT ON kai_component_test_metrics TO authenticated;

-- RLS policies
ALTER TABLE kai_component_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE kai_test_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kai_component_configs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent migration)
DROP POLICY IF EXISTS "Allow authenticated read kai_component_tests" ON kai_component_tests;
DROP POLICY IF EXISTS "Allow authenticated read kai_test_predictions" ON kai_test_predictions;
DROP POLICY IF EXISTS "Allow authenticated read kai_component_configs" ON kai_component_configs;
DROP POLICY IF EXISTS "Service role only kai_component_tests" ON kai_component_tests;
DROP POLICY IF EXISTS "Service role only kai_test_predictions" ON kai_test_predictions;
DROP POLICY IF EXISTS "Service role only kai_component_configs" ON kai_component_configs;

-- Allow all authenticated users to read test data
CREATE POLICY "Allow authenticated read kai_component_tests"
ON kai_component_tests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read kai_test_predictions"
ON kai_test_predictions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read kai_component_configs"
ON kai_component_configs FOR SELECT
TO authenticated
USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role only kai_component_tests"
ON kai_component_tests FOR ALL
TO authenticated
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only kai_test_predictions"
ON kai_test_predictions FOR ALL
TO authenticated
USING (auth.role() = 'service_role');

CREATE POLICY "Service role only kai_component_configs"
ON kai_component_configs FOR ALL
TO authenticated
USING (auth.role() = 'service_role');
