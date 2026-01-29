-- Fix for the system_alerts table to add the missing is_read column and its index.
-- This script should be run to bring the database schema in sync with the application code.

-- Add the is_read column with a default value of FALSE
ALTER TABLE system_alerts
ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Add an index for the is_read column to optimize queries filtering by read status
CREATE INDEX IF NOT EXISTS idx_system_alerts_is_read ON system_alerts(is_read);

-- Re-create the composite index for unread alerts now that the column exists
CREATE INDEX IF NOT EXISTS idx_system_alerts_unread_severity 
ON system_alerts(is_read, severity, created_at DESC);

-- Add a comment for documentation purposes
COMMENT ON COLUMN system_alerts.is_read IS 'Whether the alert has been acknowledged/read'; 