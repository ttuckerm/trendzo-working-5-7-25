-- Phase 1, Step 8: Overnight Triage storage
-- Stores pre-computed morning brief triage items so the 8 AM operator view
-- is a deterministic read, not an LLM cold-start.
--
-- One row per agency per triage_date. Items is a ranked JSONB array (max 5 per design doc).
-- Retention: 30 days (cron deletes older rows).

CREATE TABLE IF NOT EXISTS agency_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  triage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL,
  item_count INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, triage_date)
);

CREATE INDEX IF NOT EXISTS idx_agency_triage_lookup
  ON agency_triage(agency_id, triage_date DESC);

COMMENT ON TABLE agency_triage IS
  'Pre-computed morning brief triage for /agency 8 AM view. One row per agency per day. Items JSONB is a ranked array (max 5) with urgency-scored entries of type overdue_brief | performance_highlight | trend_opportunity. Written by overnight BullMQ job, read by morning brief renderer.';

COMMENT ON COLUMN agency_triage.items IS
  'JSONB array. Each item: { type, urgency (1-10), creator_id, creator_name, summary, data, suggested_actions[] }. Sorted by urgency DESC, ties broken by type priority: overdue > trend > performance.';
