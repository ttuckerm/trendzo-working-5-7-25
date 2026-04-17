-- =============================================
-- Prompt 40 — Self-Scheduler: dynamic scheduled actions
--
-- Atlas subsystem 8. Records actions that Atlas subsystems decide
-- to schedule for themselves based on observed state transitions.
-- The hourly processor picks up rows where scheduled_for <= now()
-- and status='pending', runs their executor, then marks them
-- executed (with output) or failed (with error_message).
--
-- Lifecycle:
--   pending   → row just written, waiting for its scheduled_for
--   executed  → processor ran the executor successfully
--   cancelled → Chairman cancelled from the dashboard
--   failed    → processor tried to execute but the executor threw
-- =============================================

CREATE TABLE IF NOT EXISTS scheduled_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type         TEXT NOT NULL,
  trigger_condition   TEXT NOT NULL,
  scheduled_for       TIMESTAMPTZ NOT NULL,
  source_subsystem    TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  created_by_system   BOOLEAN NOT NULL DEFAULT true,

  params              JSONB,
  output              JSONB,
  error_message       TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancelled_by        TEXT,

  CONSTRAINT scheduled_actions_action_type_check
    CHECK (action_type IN (
      'retrain',
      'retrain_expanded',
      'emergency_retrain',
      'promotion_validation',
      'niche_scan',
      'niche_baseline_scan',
      'engagement_check',
      'churn_alert',
      'memory_audit',
      'feature_experiment'
    )),

  CONSTRAINT scheduled_actions_source_subsystem_check
    CHECK (source_subsystem IN (
      'trainer',
      'proactive',
      'cultural',
      'memory',
      'chairman',
      'test'
    )),

  CONSTRAINT scheduled_actions_status_check
    CHECK (status IN ('pending', 'executed', 'cancelled', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_pending_ready
  ON scheduled_actions (scheduled_for)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_created_at
  ON scheduled_actions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_actions_status
  ON scheduled_actions (status, scheduled_for DESC);

COMMENT ON TABLE scheduled_actions IS
  'Prompt 40 — Atlas subsystems schedule their own follow-up actions here (e.g. trainer schedules a validation check 48h after a candidate model is created). The /api/cron/process-scheduled-actions route picks up due rows hourly.';

COMMENT ON COLUMN scheduled_actions.created_by_system IS
  'true when an Atlas subsystem self-scheduled this action; false when a Chairman manually created it from the dashboard. Used to distinguish "autonomous" scheduling from manual Chairman overrides.';

COMMENT ON COLUMN scheduled_actions.trigger_condition IS
  'Human-readable explanation of why this action was scheduled. Shown in the Chairman dashboard so the Chairman can understand what the subsystem observed.';
