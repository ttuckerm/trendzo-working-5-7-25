-- =============================================
-- Autonomous Training Engine — Schema
-- trainer_programs, training_experiments, model_variants
-- =============================================

-- ── trainer_programs ────────────────────────────────────────────────────
-- Human-written research programs that guide the autonomous trainer.

CREATE TABLE IF NOT EXISTS trainer_programs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name  TEXT NOT NULL,
  program_content TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT false,
  created_by    TEXT NOT NULL DEFAULT 'chairman',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── training_experiments ────────────────────────────────────────────────
-- Each experiment is a single-variable test run by the trainer.

CREATE TABLE IF NOT EXISTS training_experiments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID REFERENCES trainer_programs(id),
  experiment_type     TEXT NOT NULL CHECK (experiment_type IN (
    'retrain', 'feature_add', 'feature_remove', 'hyperparameter', 'niche_specific'
  )),
  niche_scope         TEXT,  -- NULL = global, otherwise specific niche
  description         TEXT NOT NULL,
  features_used       JSONB,
  hyperparams         JSONB,
  training_data_rows  INTEGER NOT NULL DEFAULT 0,
  validation_spearman DOUBLE PRECISION,
  baseline_spearman   DOUBLE PRECISION,
  delta               DOUBLE PRECISION,
  result              TEXT NOT NULL DEFAULT 'error' CHECK (result IN (
    'improved', 'no_change', 'degraded', 'error', 'pending_promotion'
  )),
  model_artifact_path TEXT,
  error_message       TEXT,
  locked_at           TIMESTAMPTZ,  -- concurrency lock
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_experiments_program
  ON training_experiments (program_id, created_at DESC);

CREATE INDEX idx_training_experiments_niche
  ON training_experiments (niche_scope, created_at DESC);

-- ── model_variants ──────────────────────────────────────────────────────
-- Per-niche (or global) model versions with promotion tracking.

CREATE TABLE IF NOT EXISTS model_variants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche           TEXT,  -- NULL = global/default model
  model_version   TEXT NOT NULL,
  spearman_score  DOUBLE PRECISION,
  features        JSONB,
  hyperparams     JSONB,
  is_active       BOOLEAN NOT NULL DEFAULT false,
  promoted_at     TIMESTAMPTZ,
  experiment_id   UUID REFERENCES training_experiments(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_model_variants_active
  ON model_variants (niche, is_active)
  WHERE is_active = true;

CREATE UNIQUE INDEX idx_model_variants_one_active_per_niche
  ON model_variants (COALESCE(niche, '__global__'))
  WHERE is_active = true;

-- ── Seed default program ────────────────────────────────────────────────

INSERT INTO trainer_programs (program_name, program_content, is_active, created_by)
VALUES (
  'Trendzo Trainer Program v1',
  E'# Trendzo Trainer Program v1\n\n## Current state\nModel: XGBoost (version auto-detected from model_variants)\nBaseline accuracy: (auto-populated from active global model)\n\n## Experiment rules\n- One variable per experiment. Never change two things simultaneously.\n- Evaluation on held-out 20% of data, stratified by niche.\n- Global improvement threshold: Spearman must improve by > 0.005.\n- Niche-specific improvement threshold: Spearman must improve by > 0.01 on niche data.\n- If a niche variant beats the global model by > 0.01 on that niche''s data: candidate for niche-specific promotion.\n\n## Experiment priority\n1. If global feedback data > 500 rows since last training: retrain global model.\n2. If any niche has > 200 feedback rows and no niche variant: train niche variant.\n3. If accuracy degraded in any niche this week: diagnose that niche.\n4. If no improvement in 3 consecutive experiments: flag for Chairman review.\n\n## Niche variant rules\n- Only create niche variants for niches with 200+ feedback rows.\n- Always compare niche variant against global model on THAT niche''s data.\n- If niche variant underperforms global on niche data: discard, don''t promote.\n- Maintain global model as fallback for niches without enough data.',
  true,
  'system'
)
ON CONFLICT DO NOTHING;

-- ── Seed current production model as global variant ─────────────────────

INSERT INTO model_variants (niche, model_version, spearman_score, is_active, promoted_at)
VALUES (NULL, 'v10', 0.7811, true, now())
ON CONFLICT DO NOTHING;
