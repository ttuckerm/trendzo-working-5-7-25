-- API Usage Logging for Cost Tracking
-- Track OpenAI and Kling API usage to monitor costs

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying by endpoint and date
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint_date
  ON api_usage_logs(endpoint, created_at DESC);

-- Index for cost analysis
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at
  ON api_usage_logs(created_at DESC);

COMMENT ON TABLE api_usage_logs IS 'Tracks API usage for OpenAI and Kling to monitor costs';
COMMENT ON COLUMN api_usage_logs.endpoint IS 'API endpoint name (e.g., script_generation, video_generation)';
COMMENT ON COLUMN api_usage_logs.metadata IS 'Additional context like platform, niche, concept';
COMMENT ON COLUMN api_usage_logs.tokens_used IS 'Number of tokens consumed (for OpenAI)';
COMMENT ON COLUMN api_usage_logs.cost_usd IS 'Cost in USD for this API call';
