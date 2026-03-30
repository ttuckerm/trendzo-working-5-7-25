-- ============================================================================
-- Test Results Table
-- Stores results from all 5 validation test types
-- ============================================================================

CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Test identification
  test_id TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL CHECK (test_type IN (
    '1-historical',
    '2-live-tracking',
    '3-synthetic-ab',
    '4-cross-platform',
    '5-temporal-consistency'
  )),
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Counts
  total_samples INTEGER DEFAULT 0,
  successful_predictions INTEGER DEFAULT 0,
  failed_predictions INTEGER DEFAULT 0,

  -- Accuracy metrics
  mean_absolute_error DECIMAL(10,4),
  rmse DECIMAL(10,4),
  r2_score DECIMAL(10,6),
  classification_accuracy DECIMAL(10,6),
  within_range_percent DECIMAL(10,4),

  -- Details (JSONB for flexibility)
  details JSONB,
  errors TEXT[]
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_test_results_test_type ON test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at DESC);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE test_results IS 'Stores results from all 5 validation test types';
COMMENT ON COLUMN test_results.test_type IS 'Type of test: 1-historical, 2-live-tracking, 3-synthetic-ab, 4-cross-platform, 5-temporal-consistency';
COMMENT ON COLUMN test_results.mean_absolute_error IS 'Average absolute error in DPS prediction';
COMMENT ON COLUMN test_results.rmse IS 'Root mean squared error';
COMMENT ON COLUMN test_results.r2_score IS 'R-squared score (goodness of fit)';
COMMENT ON COLUMN test_results.classification_accuracy IS 'Accuracy of viral/not-viral classification (0-1)';
COMMENT ON COLUMN test_results.within_range_percent IS 'Percentage of predictions within ±10% range';
