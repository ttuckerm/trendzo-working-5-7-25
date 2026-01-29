-- Create the system_alerts table for logging system-wide events
-- This table will serve as the foundation for real-time system monitoring and alerting

CREATE TABLE system_alerts (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error')),
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_source ON system_alerts(source);
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);

-- Create a composite index for common queries (unread alerts by severity)
CREATE INDEX IF NOT EXISTS idx_system_alerts_unread_severity 
ON system_alerts(is_read, severity, created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE system_alerts IS 'System-wide alerts and events logging table';
COMMENT ON COLUMN system_alerts.severity IS 'Alert severity level: info, warning, or error';
COMMENT ON COLUMN system_alerts.source IS 'Component or service that generated the alert';
COMMENT ON COLUMN system_alerts.message IS 'Human-readable alert message';
COMMENT ON COLUMN system_alerts.is_read IS 'Whether the alert has been acknowledged/read';

-- Grant appropriate permissions (adjust based on your Supabase setup)
-- These would typically be handled through Supabase RLS policies in production