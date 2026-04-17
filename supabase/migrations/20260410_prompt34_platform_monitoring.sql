-- =============================================
-- Prompt 34 — Proactive platform monitoring
-- Adds agency_id to chairman_alerts so agency-scoped
-- alerts (staleness, brief rate drop, renewal risk)
-- can link back to the originating agency.
-- =============================================

ALTER TABLE chairman_alerts
  ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL;

-- Partial index to make dedup checks fast:
-- "Is there already an open alert for this (alert_type, agency_id)?"
CREATE INDEX IF NOT EXISTS idx_chairman_alerts_open_dedup
  ON chairman_alerts (alert_type, agency_id)
  WHERE status = 'open';

COMMENT ON COLUMN chairman_alerts.agency_id IS
  'Optional link to the agency this alert concerns. NULL for platform-wide alerts (e.g. spearman drop, insufficient_data).';
