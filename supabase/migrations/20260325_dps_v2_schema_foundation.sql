-- ============================================================================
-- DPS v2 Schema Foundation
-- ============================================================================
-- Step 1 of the DPS v2 rollout. Schema and data-contract groundwork only.
-- No formula changes. No route rewiring.
--
-- Adds:
--   1. Versioned label provenance columns on prediction_runs
--   2. v2 signal storage columns (actual_* engagement rates)
--   3. v2 breakdown storage (JSONB)
--   4. Cohort-stat cache table (dps_v2_cohort_stats)
--   5. Threshold versioning table (dps_v2_thresholds)
--   6. Historical outcome snapshots table (prediction_run_outcome_snapshots)
--   7. Percentile context columns
--
-- Existing rows default to legacy/untrusted semantics.
-- Date: 2026-03-25
-- ============================================================================

-- ============================================================================
-- 1. Label provenance & trust columns on prediction_runs
-- ============================================================================

-- Which DPS formula produced the actual_dps value (NULL = legacy v1)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_formula_version TEXT DEFAULT NULL;

-- Trust level for this label: 'untrusted', 'low', 'medium', 'high'
-- Legacy rows are untrusted by default
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_label_trust TEXT DEFAULT 'untrusted';

-- Numeric training weight (0.0 = excluded, 1.0 = full weight)
-- Legacy rows default to 0.0 (not eligible for v2 training)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_training_weight NUMERIC(4,3) DEFAULT 0.0;

-- ============================================================================
-- 2. Signal quality metadata
-- ============================================================================

-- Overall confidence in the signal inputs (0.0–1.0)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_signal_confidence NUMERIC(4,3) DEFAULT NULL;

-- Which signals were available at scoring time (bitmask or descriptor)
-- e.g. '{"views":true,"likes":true,"shares":false,"saves":false}'
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_signal_availability JSONB DEFAULT NULL;

-- How weights were redistributed when signals were missing
-- e.g. '{"views":0.45,"likes":0.35,"comments":0.20}'
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_weight_redistribution JSONB DEFAULT NULL;

-- ============================================================================
-- 3. v2 breakdown storage
-- ============================================================================

-- Full DPS v2 scoring breakdown (signal scores, weights, sub-scores)
-- Schema TBD by scoring formula; stored as JSONB for flexibility
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_v2_breakdown JSONB DEFAULT NULL;

-- ============================================================================
-- 4. Legacy preservation columns
-- ============================================================================
-- When v2 overwrites actual_dps, preserve the original v1 values here.

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS legacy_actual_dps NUMERIC(5,2) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS legacy_actual_tier TEXT DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS legacy_dps_formula_version TEXT DEFAULT NULL;

-- ============================================================================
-- 5. Granular actual engagement metrics (v2 signal inputs)
-- ============================================================================
-- These store the raw rates/ratios computed from actual_views/likes/etc.
-- at the time of DPS scoring. TikTok-oriented.

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_completion_rate NUMERIC(8,6) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_share_rate NUMERIC(8,6) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_save_rate NUMERIC(8,6) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_velocity_score NUMERIC(8,4) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_view_to_follower_ratio NUMERIC(10,6) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_comment_rate NUMERIC(8,6) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_avg_watch_time_seconds NUMERIC(8,2) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_video_duration_seconds NUMERIC(8,2) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_interactions_first_3h BIGINT DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_hours_since_post NUMERIC(8,2) DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_posted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS actual_collected_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================================================
-- 6. Percentile context columns
-- ============================================================================

-- Percentile within the follower-count cohort (v2 methodology)
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_within_cohort_percentile NUMERIC(6,3) DEFAULT NULL;

-- Percentile across the entire population
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_population_percentile NUMERIC(6,3) DEFAULT NULL;

-- Sample sizes used for percentile computation
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_cohort_sample_size INT DEFAULT NULL;

ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_population_sample_size INT DEFAULT NULL;

-- Which threshold version was used for tier assignment
ALTER TABLE prediction_runs
  ADD COLUMN IF NOT EXISTS dps_threshold_version TEXT DEFAULT NULL;

-- ============================================================================
-- 7. Indexes for v2 queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prediction_runs_dps_formula_version
  ON prediction_runs(dps_formula_version)
  WHERE dps_formula_version IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_dps_label_trust
  ON prediction_runs(dps_label_trust)
  WHERE dps_label_trust != 'untrusted';

CREATE INDEX IF NOT EXISTS idx_prediction_runs_dps_training_weight
  ON prediction_runs(dps_training_weight)
  WHERE dps_training_weight > 0;

CREATE INDEX IF NOT EXISTS idx_prediction_runs_actual_posted_at
  ON prediction_runs(actual_posted_at)
  WHERE actual_posted_at IS NOT NULL;

-- ============================================================================
-- 8. New table: dps_v2_cohort_stats
-- ============================================================================
-- Cached cohort statistics for DPS v2 percentile computation.
-- One row per cohort per computation window.

CREATE TABLE IF NOT EXISTS dps_v2_cohort_stats (
  id BIGSERIAL PRIMARY KEY,

  -- Cohort definition
  niche TEXT NOT NULL,
  follower_band TEXT NOT NULL,            -- e.g. '10k-50k', '50k-100k'
  follower_min BIGINT NOT NULL,
  follower_max BIGINT,                    -- NULL = unbounded upper end

  -- Stat window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Aggregates
  sample_size INT NOT NULL DEFAULT 0,
  median_views DOUBLE PRECISION,
  median_likes DOUBLE PRECISION,
  median_shares DOUBLE PRECISION,
  median_saves DOUBLE PRECISION,
  median_comments DOUBLE PRECISION,
  median_completion_rate DOUBLE PRECISION,
  median_share_rate DOUBLE PRECISION,
  median_save_rate DOUBLE PRECISION,
  median_view_to_follower DOUBLE PRECISION,
  p25_dps DOUBLE PRECISION,
  p50_dps DOUBLE PRECISION,
  p75_dps DOUBLE PRECISION,
  p90_dps DOUBLE PRECISION,
  mean_dps DOUBLE PRECISION,
  stddev_dps DOUBLE PRECISION,

  -- Metadata
  formula_version TEXT NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (niche, follower_band, window_start, window_end, formula_version)
);

CREATE INDEX IF NOT EXISTS idx_dps_v2_cohort_stats_lookup
  ON dps_v2_cohort_stats(niche, follower_band, formula_version, computed_at DESC);

-- ============================================================================
-- 9. New table: dps_v2_thresholds
-- ============================================================================
-- Monthly threshold snapshots for DPS tier assignment.
-- Versioned so tier boundaries can evolve without breaking historical labels.

CREATE TABLE IF NOT EXISTS dps_v2_thresholds (
  id BIGSERIAL PRIMARY KEY,

  version TEXT NOT NULL UNIQUE,           -- e.g. '2026-03', '2026-04'
  effective_from DATE NOT NULL,
  effective_until DATE,                   -- NULL = currently active

  -- Tier boundaries (DPS score thresholds)
  -- tier_boundaries is a JSONB object mapping tier names to min/max DPS
  -- e.g. {"viral": {"min": 85}, "high": {"min": 65, "max": 84.99}, ...}
  tier_boundaries JSONB NOT NULL,

  -- Methodology metadata
  formula_version TEXT NOT NULL,
  computation_method TEXT,                -- e.g. 'population_percentile', 'cohort_relative'
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dps_v2_thresholds_active
  ON dps_v2_thresholds(effective_from DESC)
  WHERE effective_until IS NULL;

-- ============================================================================
-- 10. New table: prediction_run_outcome_snapshots
-- ============================================================================
-- Frozen outcome snapshots at specific collection checkpoints.
-- One row per run per checkpoint. Preserves metrics at exact moment of collection.

CREATE TABLE IF NOT EXISTS prediction_run_outcome_snapshots (
  id BIGSERIAL PRIMARY KEY,

  run_id UUID NOT NULL REFERENCES prediction_runs(id) ON DELETE CASCADE,
  checkpoint TEXT NOT NULL,               -- e.g. '3h', '24h', '7d', '30d'

  -- Raw metrics at this checkpoint
  views BIGINT,
  likes BIGINT,
  comments BIGINT,
  shares BIGINT,
  saves BIGINT,
  follower_count BIGINT,

  -- Computed rates at this checkpoint
  completion_rate NUMERIC(8,6),
  share_rate NUMERIC(8,6),
  save_rate NUMERIC(8,6),
  view_to_follower_ratio NUMERIC(10,6),
  comment_rate NUMERIC(8,6),
  avg_watch_time_seconds NUMERIC(8,2),

  -- DPS computed at this checkpoint
  dps_score NUMERIC(5,2),
  dps_tier TEXT,
  dps_formula_version TEXT,

  -- Timing
  hours_since_post NUMERIC(8,2),
  posted_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- De-duplication
  UNIQUE (run_id, checkpoint)
);

CREATE INDEX IF NOT EXISTS idx_outcome_snapshots_run_id
  ON prediction_run_outcome_snapshots(run_id);

CREATE INDEX IF NOT EXISTS idx_outcome_snapshots_checkpoint
  ON prediction_run_outcome_snapshots(checkpoint, collected_at DESC);

-- ============================================================================
-- 11. Update prediction_runs_enriched view
-- ============================================================================
-- IMPORTANT:
-- Match the LIVE production definition exactly, preserving all existing columns
-- and their order. Append new DPS v2 columns at the end so CREATE OR REPLACE VIEW
-- remains safe for existing consumers.

CREATE OR REPLACE VIEW prediction_runs_enriched AS
SELECT
  r.id,
  r.video_id,
  r.mode,
  r.status,
  r.error_message,
  r.predicted_dps_7d,
  r.predicted_percentile_7d,
  r.predicted_tier_7d,
  r.confidence,
  r.prediction_range_low,
  r.prediction_range_high,
  r.components_used,
  r.components_count,
  r.latency_ms_total,
  r.raw_result,
  r.started_at,
  r.completed_at,
  r.created_at,
  r.actual_views,
  r.actual_likes,
  r.actual_comments,
  r.actual_shares,
  r.actual_saves,
  r.actual_dps,
  r.prediction_error,
  r.prediction_error_pct,
  r.within_range,
  r.actuals_entered_at,
  r.transcription_source,
  r.transcription_confidence,
  r.transcription_latency_ms,
  r.transcription_skipped,
  r.transcription_skip_reason,
  r.transcription_fallback_components,
  r.resolved_transcript_length,
  r.pack1_meta,
  r.pack2_meta,
  r.qc_flags,
  r.llm_spread,
  r.llm_influence_applied,
  r.score_version,
  r.coach_version,
  r.llm_excluded_reason,
  r.actual_tier,
  vf.niche,
  vf.goal,
  vf.platform,
  vf.account_size_band,
  vf.tiktok_url,
  COALESCE(comp.cnt, 0::bigint)::integer                AS component_rows_count,
  COALESCE(comp.cnt, 0::bigint) > 0                     AS has_components,
  r.raw_result IS NOT NULL                              AS has_raw_result,
  (
    (r.status = ANY (ARRAY['completed'::text, 'success'::text]))
    AND r.actual_dps IS NOT NULL
    AND COALESCE(comp.cnt, 0::bigint) > 0
    AND r.raw_result IS NOT NULL
  )                                                     AS training_ready,

  -- Raw DPS v2 fields needed by downstream aggregate views.
  r.dps_formula_version,
  r.dps_label_trust,
  r.dps_training_weight,

  -- New computed DPS v2 field appended to preserve backwards compatibility.
  (
    r.dps_formula_version IS NOT NULL
    AND r.dps_formula_version LIKE '2%'
    AND COALESCE(r.dps_label_trust, 'untrusted') <> 'untrusted'
    AND COALESCE(r.dps_training_weight, 0) > 0
  )                                                     AS training_label_eligible
FROM prediction_runs r
JOIN video_files vf ON vf.id::text = r.video_id
LEFT JOIN (
  SELECT
    run_component_results.run_id,
    count(*) AS cnt
  FROM run_component_results
  GROUP BY run_component_results.run_id
) comp ON comp.run_id = r.id;

-- ============================================================================
-- 12. Recreate training_readiness_summary view
-- ============================================================================
-- Preserve the live shape exactly and append new v2 aggregates at the end.

CREATE OR REPLACE VIEW training_readiness_summary AS
SELECT
  e.niche,
  count(*)::integer                                     AS total_runs,
  count(*) FILTER (
    WHERE e.status = ANY (ARRAY['completed'::text, 'success'::text])
  )::integer                                            AS completed_runs,
  count(*) FILTER (
    WHERE e.actual_dps IS NOT NULL
  )::integer                                            AS labeled_runs,
  count(*) FILTER (
    WHERE e.training_ready
  )::integer                                            AS training_ready_runs,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NOT NULL
      AND NOT e.has_components
  )::integer                                            AS missing_components,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NOT NULL
      AND NOT e.has_raw_result
  )::integer                                            AS missing_raw_result,
  count(*) FILTER (
    WHERE
      (e.status = ANY (ARRAY['completed'::text, 'success'::text]))
      AND e.actual_dps IS NULL
  )::integer                                            AS missing_actual_dps,
  count(*) FILTER (WHERE
    e.status <> ALL (ARRAY['completed'::text, 'success'::text])
  )::integer                                            AS non_completed,

  -- New DPS v2 aggregates appended after the legacy columns.
  count(*) FILTER (WHERE
    e.dps_formula_version IS NOT NULL
    AND e.dps_formula_version LIKE '2%'
  )::integer                                            AS v2_labeled_runs,
  count(*) FILTER (
    WHERE e.training_label_eligible
  )::integer                                            AS v2_training_eligible_runs,

  -- Trust breakdown
  count(*) FILTER (WHERE e.dps_label_trust = 'high')::integer    AS trust_high,
  count(*) FILTER (WHERE e.dps_label_trust = 'medium')::integer  AS trust_medium,
  count(*) FILTER (WHERE e.dps_label_trust = 'low')::integer     AS trust_low,
  count(*) FILTER (WHERE
    COALESCE(e.dps_label_trust, 'untrusted') = 'untrusted'
  )::integer                                            AS trust_untrusted
FROM prediction_runs_enriched e
GROUP BY e.niche;

-- ============================================================================
-- Done. Verify new columns exist.
-- ============================================================================
DO $$
DECLARE
  col_count INTEGER;
  table_count INTEGER;
BEGIN
  -- Count new DPS v2 columns on prediction_runs
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'prediction_runs'
    AND (
      column_name LIKE 'dps_%'
      OR column_name LIKE 'legacy_%'
      OR column_name IN (
      'actual_completion_rate', 'actual_share_rate', 'actual_save_rate',
      'actual_velocity_score', 'actual_view_to_follower_ratio',
      'actual_comment_rate', 'actual_avg_watch_time_seconds',
      'actual_video_duration_seconds', 'actual_interactions_first_3h',
      'actual_hours_since_post', 'actual_posted_at', 'actual_collected_at'
      )
    );

  RAISE NOTICE 'DPS v2 columns on prediction_runs: %', col_count;

  -- Verify new tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
    'dps_v2_cohort_stats',
    'dps_v2_thresholds',
    'prediction_run_outcome_snapshots'
  );

  RAISE NOTICE 'New DPS v2 tables created: %/3', table_count;
END $$;
