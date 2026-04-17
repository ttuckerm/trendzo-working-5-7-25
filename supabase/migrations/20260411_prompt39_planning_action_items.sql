-- =============================================
-- Prompt 39 — Planning session action items
--
-- When a Chairman or agency operator approves a planning session
-- from Prompt 38, we extract the recommendations in the plan and
-- persist them as trackable action items here. Each item has its
-- own status so the Chairman can march them from open → done on
-- the dashboard without touching the original plan.
--
-- agency_id is nullable: Chairman platform sessions produce
-- platform-scoped action items (agency_id IS NULL), agency sessions
-- produce agency-scoped ones.
-- =============================================

CREATE TABLE IF NOT EXISTS planning_action_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
  agency_id       UUID REFERENCES agencies(id) ON DELETE SET NULL,

  title           TEXT NOT NULL,
  description     TEXT,

  status          TEXT NOT NULL DEFAULT 'open',
  order_index     INTEGER NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,

  CONSTRAINT planning_action_items_status_check
    CHECK (status IN ('open', 'in_progress', 'done', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_planning_action_items_session
  ON planning_action_items (session_id, order_index);

CREATE INDEX IF NOT EXISTS idx_planning_action_items_status
  ON planning_action_items (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_planning_action_items_agency
  ON planning_action_items (agency_id, status, created_at DESC)
  WHERE agency_id IS NOT NULL;

COMMENT ON TABLE planning_action_items IS
  'Prompt 39 — trackable items extracted from approved planning sessions. Auto-populated by the decision endpoint on approve; Chairman can edit/delete on the review page before the final approve click, then march them to done via the dashboard panel.';
