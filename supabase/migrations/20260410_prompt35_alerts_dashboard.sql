-- =============================================
-- Prompt 35 — Chairman alerts dashboard
-- Expands chairman_alerts status lifecycle to support
-- Acknowledge and Snooze actions from the Platform Health panel.
--
-- New state machine:
--   open        → new alert, needs first look
--   acknowledged → Chairman has seen it, condition still exists
--   snoozed     → temporarily hidden until snoozed_until passes
--   resolved    → condition is fixed (goes to history)
--   dismissed   → alert was noise / not actionable (goes to history)
--
-- Dedup policy (enforced in platform-monitor.ts, not DB):
--   A new alert is suppressed if an existing alert with the same
--   (alert_type, agency_id) has status IN ('open','acknowledged','snoozed').
--   Only 'resolved' and 'dismissed' statuses allow a future duplicate.
-- =============================================

-- Drop existing CHECK constraint (it only allowed open/resolved/dismissed)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'chairman_alerts'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE chairman_alerts DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE chairman_alerts
  ADD CONSTRAINT chairman_alerts_status_check
  CHECK (status IN ('open', 'acknowledged', 'snoozed', 'resolved', 'dismissed'));

-- New lifecycle columns
ALTER TABLE chairman_alerts
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by TEXT,
  ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snoozed_by TEXT;

-- Index for snooze expiry filter (used by the banner/panel "active" view)
CREATE INDEX IF NOT EXISTS idx_chairman_alerts_snoozed_until
  ON chairman_alerts (snoozed_until)
  WHERE snoozed_until IS NOT NULL;

-- Index for the history view (resolved/dismissed, sorted by created_at)
CREATE INDEX IF NOT EXISTS idx_chairman_alerts_history
  ON chairman_alerts (created_at DESC)
  WHERE status IN ('resolved', 'dismissed');

-- Update the existing partial dedup index created in the Prompt 33
-- migration to cover all "still-live" statuses, not just 'open'.
DROP INDEX IF EXISTS idx_chairman_alerts_open;
DROP INDEX IF EXISTS idx_chairman_alerts_open_dedup;

CREATE INDEX IF NOT EXISTS idx_chairman_alerts_live
  ON chairman_alerts (alert_type, agency_id, created_at DESC)
  WHERE status IN ('open', 'acknowledged', 'snoozed');

COMMENT ON COLUMN chairman_alerts.acknowledged_at IS
  'Set when the Chairman acknowledges an alert. Acknowledged alerts still count as "live" for dedup and stay visible in the Platform Health panel active list, but drop out of the compact banner.';

COMMENT ON COLUMN chairman_alerts.snoozed_until IS
  'Timestamp until which the alert is hidden. Queries filter (snoozed_until IS NULL OR snoozed_until <= now()). No cron needed — auto-wakes via query filter.';
