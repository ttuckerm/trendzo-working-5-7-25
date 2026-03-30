-- Phase 81: Training Pipeline v2 — Contamination Firewall & Versioning
-- Feature flag: TRAINING_V2_ENABLED

-- 1. Feature Availability Matrix
CREATE TABLE IF NOT EXISTS feature_availability_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  available_pre BOOLEAN NOT NULL DEFAULT true,
  available_post BOOLEAN NOT NULL DEFAULT false,
  used_in_pop BOOLEAN NOT NULL DEFAULT false,
  used_in_pob BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'unknown',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fam_feature_name ON feature_availability_matrix(feature_name);
CREATE INDEX idx_fam_available_pre ON feature_availability_matrix(available_pre);

COMMENT ON TABLE feature_availability_matrix IS 'Catalogs every feature with pre/post execution availability for contamination prevention';

-- 2. Contamination Audit Log
CREATE TABLE IF NOT EXISTS contamination_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES training_jobs(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  features_checked INTEGER NOT NULL DEFAULT 0,
  contaminated_features TEXT[] NOT NULL DEFAULT '{}',
  passed BOOLEAN NOT NULL,
  niche TEXT,
  auditor TEXT NOT NULL DEFAULT 'system',
  details JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cal_job_id ON contamination_audit_log(job_id);
CREATE INDEX idx_cal_passed ON contamination_audit_log(passed);
CREATE INDEX idx_cal_created_at ON contamination_audit_log(created_at DESC);

COMMENT ON TABLE contamination_audit_log IS 'Audit trail of contamination checks run before training jobs';

-- 3. Model Performance Segments
CREATE TABLE IF NOT EXISTS model_performance_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  niche TEXT NOT NULL,
  mae NUMERIC,
  rmse NUMERIC,
  correlation NUMERIC,
  bias NUMERIC,
  sample_count INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mps_model_version ON model_performance_segments(model_version_id);
CREATE INDEX idx_mps_niche ON model_performance_segments(niche);

COMMENT ON TABLE model_performance_segments IS 'Per-niche performance metrics for each model version';

-- 4. Add contamination_audit_id to model_versions
ALTER TABLE model_versions
ADD COLUMN IF NOT EXISTS contamination_audit_id UUID REFERENCES contamination_audit_log(id) ON DELETE SET NULL;

COMMENT ON COLUMN model_versions.contamination_audit_id IS 'FK to passing contamination audit required for production deployment';
