-- Monitoring System Database Schema
-- Comprehensive schema for metrics, alerts, notifications, and monitoring data

-- Metrics table for storing time-series data
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('counter', 'gauge', 'histogram', 'summary', 'timer')),
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  labels JSONB DEFAULT '{}',
  source TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert rules configuration
CREATE TABLE alert_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metric_name TEXT NOT NULL,
  condition JSONB NOT NULL,
  threshold DECIMAL NOT NULL,
  duration INTEGER NOT NULL, -- Duration in seconds
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  enabled BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  notification_channels TEXT[] DEFAULT '{}',
  escalation_policy JSONB,
  suppress_duration INTEGER,
  adaptive_threshold BOOLEAN DEFAULT false,
  baseline_window INTEGER, -- Hours for baseline calculation
  anomaly_detection BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active and historical alerts
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL REFERENCES alert_rules(id),
  rule_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('firing', 'resolved', 'suppressed', 'acknowledged')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  message TEXT NOT NULL,
  description TEXT,
  value DECIMAL NOT NULL,
  threshold DECIMAL NOT NULL,
  labels JSONB DEFAULT '{}',
  annotations JSONB DEFAULT '{}',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  escalation_level INTEGER DEFAULT 0,
  last_escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification templates
CREATE TABLE notification_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'slack', 'webhook', 'discord', 'microsoft_teams', 'mobile_push', 'browser_push')),
  subject TEXT,
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification results and history
CREATE TABLE notification_results (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'slack', 'webhook', 'discord', 'microsoft_teams', 'mobile_push', 'browser_push')),
  recipients TEXT[] NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  template_id TEXT REFERENCES notification_templates(id),
  variables JSONB DEFAULT '{}',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  success BOOLEAN NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'retrying', 'expired')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business KPIs tracking
CREATE TABLE business_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  value DECIMAL NOT NULL,
  target DECIMAL,
  unit TEXT NOT NULL,
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'stable')),
  percentage_change DECIMAL NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions for engagement tracking
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration INTEGER, -- Duration in seconds
  page_views INTEGER DEFAULT 0,
  actions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User engagement events
CREATE TABLE user_engagement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System health snapshots
CREATE TABLE system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_score INTEGER NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'warning', 'critical')),
  cpu_usage DECIMAL,
  memory_usage DECIMAL,
  disk_usage DECIMAL,
  network_in BIGINT,
  network_out BIGINT,
  active_connections INTEGER,
  response_time DECIMAL,
  error_rate DECIMAL,
  uptime BIGINT, -- Uptime in seconds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API endpoint performance tracking
CREATE TABLE api_endpoint_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time DECIMAL NOT NULL,
  request_size BIGINT,
  response_size BIGINT,
  user_id TEXT,
  api_key_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viral prediction performance tracking
CREATE TABLE viral_prediction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  video_url TEXT,
  niche TEXT,
  predicted_score DECIMAL NOT NULL,
  actual_score DECIMAL,
  accuracy DECIMAL,
  confidence_score DECIMAL,
  response_time DECIMAL,
  model_version TEXT,
  features_used JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Revenue and subscription tracking
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('subscription_created', 'subscription_renewed', 'subscription_cancelled', 'payment_received', 'refund_issued')),
  amount DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  subscription_plan TEXT,
  billing_period TEXT,
  payment_method TEXT,
  transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring dashboard configurations
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  dashboard_name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
-- Metrics indexes
CREATE INDEX idx_metrics_name ON metrics(name);
CREATE INDEX idx_metrics_created_at ON metrics(created_at);
CREATE INDEX idx_metrics_source ON metrics(source);
CREATE INDEX idx_metrics_name_created_at ON metrics(name, created_at);
CREATE INDEX idx_metrics_labels ON metrics USING GIN(labels);

-- Alert indexes
CREATE INDEX idx_alerts_rule_id ON alerts(rule_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_starts_at ON alerts(starts_at);
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);

-- Alert rules indexes
CREATE INDEX idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX idx_alert_rules_metric_name ON alert_rules(metric_name);

-- Notification indexes
CREATE INDEX idx_notification_results_channel ON notification_results(channel);
CREATE INDEX idx_notification_results_sent_at ON notification_results(sent_at);
CREATE INDEX idx_notification_results_success ON notification_results(success);

-- User session indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_started_at ON user_sessions(started_at);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);

-- User engagement indexes
CREATE INDEX idx_user_engagement_events_user_id ON user_engagement_events(user_id);
CREATE INDEX idx_user_engagement_events_session_id ON user_engagement_events(session_id);
CREATE INDEX idx_user_engagement_events_type ON user_engagement_events(event_type);
CREATE INDEX idx_user_engagement_events_created_at ON user_engagement_events(created_at);

-- System health indexes
CREATE INDEX idx_system_health_snapshots_created_at ON system_health_snapshots(created_at);
CREATE INDEX idx_system_health_snapshots_status ON system_health_snapshots(status);

-- API endpoint indexes
CREATE INDEX idx_api_endpoint_metrics_endpoint ON api_endpoint_metrics(endpoint);
CREATE INDEX idx_api_endpoint_metrics_created_at ON api_endpoint_metrics(created_at);
CREATE INDEX idx_api_endpoint_metrics_status_code ON api_endpoint_metrics(status_code);
CREATE INDEX idx_api_endpoint_metrics_endpoint_created_at ON api_endpoint_metrics(endpoint, created_at);

-- Viral prediction indexes
CREATE INDEX idx_viral_prediction_metrics_user_id ON viral_prediction_metrics(user_id);
CREATE INDEX idx_viral_prediction_metrics_niche ON viral_prediction_metrics(niche);
CREATE INDEX idx_viral_prediction_metrics_created_at ON viral_prediction_metrics(created_at);

-- Revenue indexes
CREATE INDEX idx_revenue_events_user_id ON revenue_events(user_id);
CREATE INDEX idx_revenue_events_event_type ON revenue_events(event_type);
CREATE INDEX idx_revenue_events_created_at ON revenue_events(created_at);

-- Dashboard config indexes
CREATE INDEX idx_dashboard_configs_user_id ON dashboard_configs(user_id);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at
    BEFORE UPDATE ON dashboard_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
-- Active alerts view
CREATE VIEW active_alerts AS
SELECT 
    a.*,
    ar.tags,
    ar.notification_channels
FROM alerts a
JOIN alert_rules ar ON a.rule_id = ar.id
WHERE a.status IN ('firing', 'acknowledged')
ORDER BY a.severity DESC, a.starts_at DESC;

-- Recent metrics view (last 24 hours)
CREATE VIEW recent_metrics AS
SELECT *
FROM metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- System health summary view
CREATE VIEW system_health_summary AS
SELECT 
    AVG(health_score) as avg_health_score,
    MIN(health_score) as min_health_score,
    MAX(health_score) as max_health_score,
    AVG(cpu_usage) as avg_cpu_usage,
    AVG(memory_usage) as avg_memory_usage,
    AVG(response_time) as avg_response_time,
    AVG(error_rate) as avg_error_rate,
    COUNT(*) as total_snapshots,
    DATE_TRUNC('hour', created_at) as hour
FROM system_health_snapshots
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- API performance summary view
CREATE VIEW api_performance_summary AS
SELECT 
    endpoint,
    method,
    COUNT(*) as total_requests,
    AVG(response_time) as avg_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    (COUNT(*) FILTER (WHERE status_code >= 400) * 100.0 / COUNT(*)) as error_rate,
    DATE_TRUNC('hour', created_at) as hour
FROM api_endpoint_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY endpoint, method, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC, total_requests DESC;

-- User engagement summary view
CREATE VIEW user_engagement_summary AS
SELECT 
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT session_id) as total_sessions,
    AVG(duration) as avg_session_duration,
    SUM(page_views) as total_page_views,
    SUM(actions) as total_actions,
    DATE_TRUNC('day', started_at) as day
FROM user_sessions
WHERE started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', started_at)
ORDER BY day DESC;

-- Business metrics summary view
CREATE VIEW business_metrics_summary AS
SELECT 
    category,
    name,
    value,
    target,
    unit,
    trend,
    percentage_change,
    period,
    ROW_NUMBER() OVER (PARTITION BY category, name ORDER BY created_at DESC) as rn
FROM business_kpis
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Revenue summary view
CREATE VIEW revenue_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    SUM(amount) FILTER (WHERE event_type = 'payment_received') as daily_revenue,
    COUNT(*) FILTER (WHERE event_type = 'subscription_created') as new_subscriptions,
    COUNT(*) FILTER (WHERE event_type = 'subscription_cancelled') as cancelled_subscriptions,
    COUNT(DISTINCT user_id) as active_customers
FROM revenue_events
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO monitoring_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO monitoring_user;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_readonly;

-- Create partitions for large tables (optional, for high-volume environments)
-- This example shows partitioning for metrics table by month
/*
CREATE TABLE metrics_y2024m01 PARTITION OF metrics
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE metrics_y2024m02 PARTITION OF metrics
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add more partitions as needed
*/

-- Sample data for testing (remove in production)
/*
INSERT INTO alert_rules (id, name, description, metric_name, condition, threshold, duration, severity, created_by) VALUES
('rule_high_response_time', 'High API Response Time', 'Alert when API response time exceeds threshold', 'api_request_duration', '{"operator": "gt", "aggregation": "p95", "timeWindow": 300}', 2000, 300, 'high', 'system'),
('rule_high_error_rate', 'High Error Rate', 'Alert when error rate exceeds threshold', 'api_request_count', '{"operator": "gt", "aggregation": "rate", "timeWindow": 300}', 0.05, 180, 'critical', 'system'),
('rule_low_prediction_accuracy', 'Low Prediction Accuracy', 'Alert when viral prediction accuracy drops', 'viral_prediction_accuracy', '{"operator": "lt", "aggregation": "avg", "timeWindow": 3600}', 80, 1800, 'medium', 'system');

INSERT INTO notification_templates (id, name, channel, subject, template, variables, priority) VALUES
('email_alert', 'Alert Email Template', 'email', 'Trendzo Alert: {{alertName}}', 'Alert: {{alertName}}\n\nSeverity: {{severity}}\nMessage: {{message}}\n\nTime: {{timestamp}}', ARRAY['alertName', 'severity', 'message', 'timestamp'], 'high'),
('slack_alert', 'Slack Alert Template', 'slack', null, '🚨 Alert: {{alertName}}\nSeverity: {{severity}}\n{{message}}', ARRAY['alertName', 'severity', 'message'], 'high');
*/