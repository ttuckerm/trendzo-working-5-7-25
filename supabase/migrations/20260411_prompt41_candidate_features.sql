-- =============================================
-- Prompt 41 — Feature Discovery: Parallel experiment workers
-- Atlas subsystem 3 (Feature Discovery)
--
-- Introduces candidate_features: a backlog of feature ideas the
-- system can test. The Feature Discovery coordinator task fans out
-- 5 parallel workers:
--   A) baseline retrain (current features)
--   B) add untested candidate feature X
--   C) add untested candidate feature Y
--   D) remove weakest feature (lowest-importance)
--   E) modify hyperparameters per active trainer_program
-- Each worker reports Spearman, coordinator finalizer picks the
-- best performer and flags it for Chairman review via a scheduled
-- action.
--
-- Lifecycle of candidate_features.status:
--   untested  → row created, never run through a worker
--   testing   → breakdown() dispatched it to worker B or C
--   promoted  → finalizer saw a positive spearman_delta above
--               the active program's global_improvement_threshold
--   rejected  → finalizer saw no improvement (delta <= threshold)
-- =============================================

CREATE TABLE IF NOT EXISTS candidate_features (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name      TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  extraction_logic  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'untested',
  tested_date       TIMESTAMPTZ,
  spearman_delta    DOUBLE PRECISION,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT candidate_features_status_check
    CHECK (status IN ('untested', 'testing', 'promoted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_candidate_features_status
  ON candidate_features (status, created_at);

COMMENT ON TABLE candidate_features IS
  'Prompt 41 — backlog of feature ideas for the Feature Discovery coordinator task. Rows are in status=untested until a feature_discovery task picks them up; status=testing while a worker is evaluating them; status=promoted if the worker''s spearman_delta cleared the active program''s global_improvement_threshold; status=rejected otherwise.';

COMMENT ON COLUMN candidate_features.extraction_logic IS
  'Free-text description OR code snippet OR pipeline identifier that explains how this feature would be extracted. NOT executed — consumed by the Python retrain pipeline when Prompt 41 is wired to real training. The TS feature-discovery handler produces proxy deltas via validation subsampling, not real retrain (see src/lib/coordinator/handlers/feature-discovery.ts).';

-- ── Extend coordinator_tasks task_type CHECK ───────────────────────────
-- Adds 'feature_discovery' as a dispatchable task type.

ALTER TABLE coordinator_tasks
  DROP CONSTRAINT IF EXISTS coordinator_tasks_task_type_check;

ALTER TABLE coordinator_tasks
  ADD CONSTRAINT coordinator_tasks_task_type_check
  CHECK (task_type IN (
    'batch_dps_regen',
    'platform_audit',
    'monthly_reports',
    'niche_analysis',
    'feature_experiment',
    'feature_discovery'
  ));

-- ── Extend scheduled_actions action_type CHECK ─────────────────────────
-- Adds 'feature_discovery_review' so the finalizer can queue a
-- Chairman review action pointing at the best-performing worker.

ALTER TABLE scheduled_actions
  DROP CONSTRAINT IF EXISTS scheduled_actions_action_type_check;

ALTER TABLE scheduled_actions
  ADD CONSTRAINT scheduled_actions_action_type_check
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
    'feature_experiment',
    'feature_discovery_review'
  ));

-- ── Seed 3 candidate features for verification ─────────────────────────
-- Per Prompt 41 verification requirement: "Add 3 candidate features to
-- the table. Run feature discovery. Confirm 5 parallel experiments
-- execute." Only the first 2 will be picked up per run (workers B and C);
-- the third stays untested so we can confirm the "top N" selection works.

INSERT INTO candidate_features (feature_name, description, extraction_logic, status)
VALUES
  (
    'hook_word_count',
    'Number of words in the first 1.5 seconds of transcript. Hypothesis: tighter hooks correlate with higher VPS in short-form.',
    'transcript.slice(0, 1500ms).split(/\s+/).length',
    'untested'
  ),
  (
    'on_screen_text_density',
    'Count of distinct on-screen text overlays per second in the first 5 seconds. Hypothesis: dense overlays signal production value and hold attention.',
    'pack_v.frame_analysis.text_overlays_first_5s / 5',
    'untested'
  ),
  (
    'audio_onset_count',
    'Number of audio onsets (beat/transient hits) in the first 3 seconds. Hypothesis: rhythm-heavy intros correlate with retention.',
    'librosa.onset.onset_detect(y[:sr*3], sr)',
    'untested'
  )
ON CONFLICT (feature_name) DO NOTHING;
