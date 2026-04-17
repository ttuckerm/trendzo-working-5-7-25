-- =============================================
-- Prompt 42 — Cross-niche feature transfer
-- Atlas subsystems 3 (Feature Discovery) + 6 (Memory)
--
-- Builds on Prompt 41 (candidate_features + feature_discovery).
-- Stores niche-scoped feature patterns that can be transferred
-- between adjacent niches via a new coordinator task type.
--
-- Three pieces in this migration:
--   1. cross_niche_patterns table — niche-scoped memory of
--      features that cleared an improvement threshold in one
--      niche, plus which OTHER niches they've been confirmed or
--      rejected in.
--   2. niche_adjacency view — two niches are adjacent iff they
--      share a category (niches.category). This is v1 adjacency;
--      a real niche_adjacency_edges table can replace the view
--      later without breaking callers, because callers only SELECT
--      from it.
--   3. top_features_per_niche view — per-niche aggregation of
--      training_experiments that have (a) a non-null niche_scope,
--      (b) a positive delta, (c) an "improved" or "pending_promotion"
--      result, (d) a features_used JSONB that is actually an array.
--      Feature Discovery experiments from Prompt 41 all have
--      niche_scope=NULL and will NOT appear in this view — that is
--      correct and intentional. Transfer mines only from experiments
--      that were scoped to a specific niche.
--
-- Also extends coordinator_tasks.task_type CHECK with
-- 'cross_niche_transfer' and scheduled_actions.action_type CHECK
-- with 'cross_niche_review'.
-- =============================================

CREATE TABLE IF NOT EXISTS cross_niche_patterns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name          TEXT NOT NULL,
  source_niche          VARCHAR(50) NOT NULL REFERENCES niches(id),
  observed_delta        DOUBLE PRECISION NOT NULL,
  observed_n            INTEGER NOT NULL,
  source_experiment_id  UUID REFERENCES training_experiments(id),
  tier                  TEXT NOT NULL DEFAULT 'warm'
    CHECK (tier IN ('hot','warm','cold')),
  confirmed_in_niches   TEXT[] NOT NULL DEFAULT '{}',
  rejected_in_niches    TEXT[] NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_niche_patterns_feature_source
  ON cross_niche_patterns (feature_name, source_niche);

CREATE INDEX IF NOT EXISTS idx_cross_niche_patterns_source_delta
  ON cross_niche_patterns (source_niche, observed_delta DESC);

COMMENT ON TABLE cross_niche_patterns IS
  'Prompt 42 — niche-scoped feature patterns promoted from training_experiments. Distinct from agency-scoped memory_extractions: these are GLOBAL observations about a niche, readable by any agency working in that niche (or an adjacent one). The preload helper (src/lib/memory/preload-agency-patterns.ts) copies relevant rows into memory_extractions for a specific agency on demand.';

-- ── niche_adjacency view ───────────────────────────────────────────────
-- Category-based. Two niches are adjacent iff they share a category.
-- The "category" column on the existing niches table already groups
-- them (e.g., "money" → personal-finance, business-entrepreneurship,
-- real-estate). Good enough for v1; swap in a real graph later.

CREATE OR REPLACE VIEW niche_adjacency AS
  SELECT
    a.id       AS niche_a,
    b.id       AS niche_b,
    a.category AS shared_category
  FROM niches a
  JOIN niches b
    ON a.category = b.category
   AND a.id <> b.id;

COMMENT ON VIEW niche_adjacency IS
  'Prompt 42 — v1 adjacency graph for cross-niche transfer. Two niches are adjacent iff they share a niches.category. Callers: src/lib/training/cross-niche-miner.ts. To upgrade to explicit curation later, replace this view with a table of the same columns — callers only SELECT.';

-- ── top_features_per_niche view ────────────────────────────────────────
-- Per-niche ranking of features that cleared a positive delta in a
-- successful experiment. Requires non-null niche_scope (Feature
-- Discovery writes null by design; only legacy niche-specific runs
-- contribute to this view).
--
-- Guards against features_used being a JSONB object instead of array
-- (observed 4 object-shaped rows in live data) by filtering with
-- jsonb_typeof(). Without this guard, jsonb_array_elements_text would
-- throw at query time.

CREATE OR REPLACE VIEW top_features_per_niche AS
  SELECT
    te.niche_scope                                    AS niche,
    f.feature_name                                    AS feature_name,
    SUM(te.delta)                                     AS total_delta,
    COUNT(*)::int                                     AS experiment_count,
    MAX(te.created_at)                                AS last_seen,
    (array_agg(te.id ORDER BY te.delta DESC))[1]      AS top_experiment_id
  FROM training_experiments te
  CROSS JOIN LATERAL jsonb_array_elements_text(te.features_used) AS f(feature_name)
  WHERE te.niche_scope IS NOT NULL
    AND te.result IN ('improved', 'pending_promotion')
    AND te.delta > 0
    AND jsonb_typeof(te.features_used) = 'array'
  GROUP BY te.niche_scope, f.feature_name;

COMMENT ON VIEW top_features_per_niche IS
  'Prompt 42 — per-niche ranking of winning features from training_experiments. Feature Discovery (Prompt 41) experiments all have niche_scope=NULL and do NOT contribute here: that is intentional. Only experiments explicitly scoped to a single niche (the legacy runExperiment() niche_specific path) populate this view. If empty for a given niche, cross-niche transfer gracefully returns zero candidates.';

-- ── Extend coordinator_tasks.task_type CHECK ───────────────────────────

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
    'feature_discovery',
    'cross_niche_transfer'
  ));

-- ── Extend scheduled_actions.action_type CHECK ─────────────────────────

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
    'feature_discovery_review',
    'cross_niche_review'
  ));
