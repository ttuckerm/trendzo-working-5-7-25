-- Phase 1, Turn 2: DDL for the 11 dead action handlers
-- Adds the tables + columns needed to wire approve_brief, send_invite,
-- nudge_creator, create_event, match_creators_to_event, push_brief_to_creators,
-- check_push_status, generate_batch_briefs, schedule_post, generate_report,
-- reschedule_post.

-- =============================================================================
-- agency_invites — send_invite target
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  creator_email TEXT NOT NULL,
  creator_name TEXT,
  invited_by UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','accepted','declined','expired','failed')),
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(agency_id, creator_email)
);

CREATE INDEX IF NOT EXISTS idx_agency_invites_agency_status
  ON agency_invites(agency_id, status);

COMMENT ON TABLE agency_invites IS
  'Invites sent by operators to prospective creators. Email delivery is queued in Phase 1 Turn 4; for Turn 2 the row is created with status=pending and delivery follows.';

-- =============================================================================
-- agency_events — create_event / match_creators_to_event target
-- =============================================================================
CREATE TABLE IF NOT EXISTS agency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  event_date DATE,
  trend_window_start TIMESTAMPTZ,
  trend_window_end TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_events_agency_date
  ON agency_events(agency_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_agency_events_category
  ON agency_events(category);

COMMENT ON TABLE agency_events IS
  'Operator-created events for matching creators to trending topics. Distinct from the broader cultural_events table (platform-wide) — agency_events are scoped to one agency.';

-- =============================================================================
-- content_briefs — scheduled_publish_at + last_nudged_at
-- =============================================================================
ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_nudged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nudge_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_content_briefs_scheduled_publish_at
  ON content_briefs(scheduled_publish_at) WHERE scheduled_publish_at IS NOT NULL;

COMMENT ON COLUMN content_briefs.scheduled_publish_at IS
  'Operator-set publication target. Used by schedule_post / reschedule_post actions. A cron job (Phase 2+) can use this to remind creators as the date approaches.';

COMMENT ON COLUMN content_briefs.last_nudged_at IS
  'Last time the nudge_creator action fired for this brief. Prevents spam (rate-limited in the handler).';
