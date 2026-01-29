-- Temporal Consistency Monitoring Tables
-- Tracks component drift over time using PSI and KS-Test

-- Table: kai_drift_metrics
-- Stores drift analysis results for each component and time window
CREATE TABLE IF NOT EXISTS kai_drift_metrics (
  id BIGSERIAL PRIMARY KEY,
  component_id TEXT NOT NULL,
  time_window TEXT NOT NULL CHECK (time_window IN ('7d', '14d', '30d')),

  -- Statistical measures
  psi DOUBLE PRECISION NOT NULL, -- Population Stability Index
  ks_statistic DOUBLE PRECISION NOT NULL, -- Kolmogorov-Smirnov statistic
  p_value DOUBLE PRECISION NOT NULL, -- KS test p-value

  -- Performance metrics
  avg_accuracy DOUBLE PRECISION NOT NULL,
  reliability_change DOUBLE PRECISION NOT NULL,

  -- Drift detection
  drift_detected BOOLEAN NOT NULL,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('green', 'yellow', 'red')),
  recommendations TEXT[] NOT NULL,

  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kai_drift_metrics_component_id ON kai_drift_metrics(component_id);
CREATE INDEX IF NOT EXISTS idx_kai_drift_metrics_analyzed_at ON kai_drift_metrics(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_kai_drift_metrics_alert_level ON kai_drift_metrics(alert_level) WHERE alert_level IN ('yellow', 'red');

-- View: Latest drift metrics per component
CREATE OR REPLACE VIEW kai_latest_drift_metrics AS
SELECT DISTINCT ON (component_id, time_window)
  component_id,
  time_window,
  psi,
  ks_statistic,
  p_value,
  avg_accuracy,
  reliability_change,
  drift_detected,
  alert_level,
  recommendations,
  analyzed_at
FROM kai_drift_metrics
ORDER BY component_id, time_window, analyzed_at DESC;

-- Function: Get components with active alerts
CREATE OR REPLACE FUNCTION get_components_with_alerts()
RETURNS TABLE (
  component_id TEXT,
  alert_level TEXT,
  time_window TEXT,
  psi DOUBLE PRECISION,
  recommendations TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kdm.component_id,
    kdm.alert_level,
    kdm.time_window,
    kdm.psi,
    kdm.recommendations
  FROM kai_latest_drift_metrics kdm
  WHERE kdm.alert_level IN ('yellow', 'red')
  ORDER BY
    CASE kdm.alert_level
      WHEN 'red' THEN 1
      WHEN 'yellow' THEN 2
    END,
    kdm.psi DESC;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE kai_drift_metrics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read drift metrics
CREATE POLICY "Allow authenticated read access to drift metrics"
ON kai_drift_metrics FOR SELECT
TO authenticated
USING (true);

-- Allow service role to insert/update drift metrics
CREATE POLICY "Allow service role full access to drift metrics"
ON kai_drift_metrics FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Comments
COMMENT ON TABLE kai_drift_metrics IS 'Stores temporal consistency monitoring results for Kai components';
COMMENT ON COLUMN kai_drift_metrics.psi IS 'Population Stability Index - measures distribution shift (>0.25 = significant drift)';
COMMENT ON COLUMN kai_drift_metrics.ks_statistic IS 'Kolmogorov-Smirnov test statistic (>0.2 = significant drift)';
COMMENT ON COLUMN kai_drift_metrics.p_value IS 'KS test p-value (<0.05 = significant drift)';
COMMENT ON COLUMN kai_drift_metrics.alert_level IS 'green = stable, yellow = monitor, red = urgent action required';
