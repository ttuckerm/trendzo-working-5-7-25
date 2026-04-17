-- =============================================
-- Prompt 38 — Agent2/ULTRAPLAN planning sessions
--
-- Tracks remote Opus planning runs. Sessions are long-lived
-- (up to 10 minutes on local dev) and stream output back to
-- this table as it's generated, so the UI can render progress.
--
-- Lifecycle:
--   queued     → row just inserted, worker not started
--   running    → worker is streaming deltas into plan_output
--   reviewing  → worker finished, awaiting Chairman approve/reject
--   approved   → Chairman accepted the plan
--   rejected   → Chairman rejected the plan (still kept for audit)
--   failed     → worker crashed; error_message is set
--
-- Cost model (enforced in code, not DB):
--   Default caps : 10 minutes / 50k output tokens / $5
--   Chairman max : 30 minutes / 100k output tokens / $15
--   Anything above the Chairman max requires a code change.
-- =============================================

CREATE TABLE IF NOT EXISTS planning_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who triggered this session
  requester_role    TEXT NOT NULL,
  requester_user_id UUID,
  agency_id         UUID REFERENCES agencies(id) ON DELETE SET NULL,

  -- The ask
  input_prompt      TEXT NOT NULL,
  context_snapshot  JSONB,

  -- The run
  model_used        TEXT,
  status            TEXT NOT NULL DEFAULT 'queued',
  plan_output       JSONB,
  error_message     TEXT,

  -- Cost tracking (written during streaming, updated on final usage event)
  input_tokens      INTEGER DEFAULT 0,
  output_tokens     INTEGER DEFAULT 0,
  cost_usd          NUMERIC(10,4) DEFAULT 0,

  -- Caps actually applied to this run (may have been Chairman-overridden)
  cap_max_seconds   INTEGER NOT NULL DEFAULT 600,
  cap_max_output_tokens INTEGER NOT NULL DEFAULT 50000,
  cap_max_cost_usd  NUMERIC(10,4) NOT NULL DEFAULT 5.00,

  -- Test mode flag — when true, no real Opus call is made and the
  -- session returns a canned fake response. THIS IS HOW WE VERIFY
  -- THE PLUMBING WITHOUT SPENDING MONEY. Chairman flips this off
  -- via the UI when ready to burn budget.
  test_mode         BOOLEAN NOT NULL DEFAULT true,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  CONSTRAINT planning_sessions_requester_role_check
    CHECK (requester_role IN ('chairman', 'agency')),

  CONSTRAINT planning_sessions_status_check
    CHECK (status IN ('queued', 'running', 'reviewing', 'approved', 'rejected', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_planning_sessions_created_at
  ON planning_sessions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_planning_sessions_status
  ON planning_sessions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_planning_sessions_agency
  ON planning_sessions (agency_id, created_at DESC)
  WHERE agency_id IS NOT NULL;

COMMENT ON TABLE planning_sessions IS
  'Prompt 38 — Agent2/ULTRAPLAN remote Opus planning runs. Each row is one session: the prompt the requester sent, the streamed plan output, the cost caps that bounded it, and the final approve/reject decision. test_mode=true short-circuits the real Opus call with a canned fake, so we can verify plumbing without spending money.';

COMMENT ON COLUMN planning_sessions.plan_output IS
  'Streamed incrementally during status=running as { partial_text, thinking_text, blocks }. Finalized on status=reviewing as { text, thinking, blocks, usage }.';

COMMENT ON COLUMN planning_sessions.test_mode IS
  'When true, the worker returns a canned fake response and does not call Anthropic. Default true so new sessions never spend money unless the requester explicitly opts in via the UI.';

COMMENT ON COLUMN planning_sessions.cap_max_cost_usd IS
  'Hard ceiling enforced by the worker. Worker aborts early if estimated_cost_usd exceeds this. Chairman can raise to 15.00 per session; anything above requires a code change.';

-- Tier gating helper: quarterly_plan_credit counts how many included
-- sessions an enterprise agency has used this quarter. Simple counter,
-- no rollover logic — the worker checks and decrements on start.
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS planning_credits_remaining INTEGER DEFAULT 0;

COMMENT ON COLUMN agencies.planning_credits_remaining IS
  'Prompt 38 — number of ULTRAPLAN sessions this agency can run without extra billing. Enterprise tier gets 1 per quarter (manually topped up). Other tiers get 0 and must pay $500 per session as an add-on.';
