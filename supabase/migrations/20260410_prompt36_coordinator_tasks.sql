-- =============================================
-- Prompt 36 — Coordinator parallel task dispatch
-- Atlas subsystem 3 (Feature Discovery) + Chairman tools
--
-- Tracks long-running tasks that fan out into
-- parallel subtasks (per agency / per niche /
-- per video-batch) and collect results back.
--
-- Lifecycle:
--   queued    → row created, not yet picked up
--   running   → dispatcher has started breaking into subtasks
--   completed → all subtasks finished (some may have failed —
--               output_result contains { ok: N, failed: M, results, errors })
--   failed    → the dispatcher itself errored (not a subtask);
--               no partial results were collected
-- =============================================

CREATE TABLE IF NOT EXISTS coordinator_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type        TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'queued',
  input_params     JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_result    JSONB,
  error_message    TEXT,
  created_by       TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,

  CONSTRAINT coordinator_tasks_task_type_check
    CHECK (task_type IN (
      'batch_dps_regen',
      'platform_audit',
      'monthly_reports',
      'niche_analysis',
      'feature_experiment'
    )),

  CONSTRAINT coordinator_tasks_status_check
    CHECK (status IN ('queued', 'running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_created_at
  ON coordinator_tasks (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_status
  ON coordinator_tasks (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coordinator_tasks_type
  ON coordinator_tasks (task_type, created_at DESC);

COMMENT ON TABLE coordinator_tasks IS
  'Prompt 36 — parallel task dispatch log. The dispatcher (src/lib/coordinator/dispatcher.ts) writes one row per dispatched task, breaks it into subtasks via the per-type handlers, runs them with Promise.allSettled, then writes the aggregated result back into output_result. A task row in status=completed may still contain failed subtasks — check output_result.failed.';

COMMENT ON COLUMN coordinator_tasks.output_result IS
  'Aggregated shape: { ok: <int>, failed: <int>, results: <per-subtask success payloads>, errors: <per-subtask error strings> }. status=completed means the dispatcher finished, not that every subtask succeeded.';

COMMENT ON COLUMN coordinator_tasks.error_message IS
  'Set only when the dispatcher itself throws (not when individual subtasks fail — those go into output_result.errors).';
