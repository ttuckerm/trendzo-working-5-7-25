-- Training dataset preparation pipeline.
-- Adds the per-run diagnostic table, the per-feature scaling params table,
-- and the dps_population_flag column on training_feature_cache.

-- ═══ training_prep_runs ═══
-- One row per prepare() invocation. Captures the filter params, the
-- diagnostic results (row floor, bimodal), and whether scaling was applied.
CREATE TABLE IF NOT EXISTS training_prep_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  total_eligible INT,
  total_after_filter INT,
  dps_mean_original FLOAT,
  dps_mean_new FLOAT,
  is_bimodal BOOLEAN,
  dps_population_flag_added BOOLEAN,
  min_row_floor_met BOOLEAN,
  scaling_applied BOOLEAN,
  filter_params JSONB,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_training_prep_runs_run_at
  ON training_prep_runs(run_at DESC);

-- ═══ feature_scaling_params ═══
-- One row per scaled feature. Re-computed on every prepare() call — UPSERT on feature_name.
CREATE TABLE IF NOT EXISTS feature_scaling_params (
  feature_name TEXT PRIMARY KEY,
  min_val FLOAT,
  max_val FLOAT,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  row_count INT
);

-- ═══ training_feature_cache.dps_population_flag ═══
-- 0 = original cohort DPS range (mean ~34), 1 = newer cohort (mean ~57).
-- NULL until the bimodal check identifies two populations.
ALTER TABLE training_feature_cache
  ADD COLUMN IF NOT EXISTS dps_population_flag INT DEFAULT NULL;

COMMENT ON COLUMN training_feature_cache.dps_population_flag IS
  '0=original cohort DPS range (mean~34), 1=newer cohort DPS range (mean~57). NULL until bimodal check runs. Becomes feature 79 for S6 Variants B/C/D.';
