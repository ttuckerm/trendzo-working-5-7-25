-- FEAT-072: Admin Accuracy Validation Workflow
-- Database tables for 6-step validation pipeline
-- Created: 2025-10-23

-- ============================================================================
-- TABLE 1: validation_runs (main experiment/run tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_number INT NOT NULL, -- e.g., #47
  name VARCHAR(255) NOT NULL, -- e.g., "Quick Win Validation Run #47"
  description TEXT, -- e.g., "Testing 80-90% accuracy on fitness/weight loss niche"

  -- Experiment Constraints (Step 1)
  niche VARCHAR(100) NOT NULL, -- e.g., "Fitness/Weight Loss"
  video_format VARCHAR(50), -- e.g., "15-30s"
  account_size VARCHAR(50), -- e.g., "10K-100K"
  timeframe VARCHAR(50), -- e.g., "Last 7 days"
  success_metric VARCHAR(100) NOT NULL, -- e.g., "DPS ≥ 80"
  formula_locked JSONB, -- DPS × Nine-Attributes × Platform-decay

  -- Workflow Status
  status VARCHAR(50) NOT NULL DEFAULT 'setup' CHECK (
    status IN ('setup', 'intake', 'pattern_qa', 'fingerprint', 'predict', 'validate', 'complete')
  ),
  current_step INT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 6),

  -- Validation Results (Step 6)
  overall_accuracy NUMERIC(5,2), -- e.g., 87.00 (87%)
  green_precision NUMERIC(5,2), -- e.g., 92.00 (92%)
  yellow_recall NUMERIC(5,2), -- e.g., 78.00 (78%)
  lift_vs_baseline NUMERIC(5,2), -- e.g., 23.00 (+23%)
  failure_modes JSONB, -- {hook_time: "pass", share_trigger: "fail", ...}

  -- Decision Gate
  approved BOOLEAN DEFAULT NULL, -- null = pending, true = approved, false = rejected
  approved_at TIMESTAMPTZ,
  approved_by UUID, -- User ID who approved/rejected

  -- Accuracy Target
  accuracy_target_min NUMERIC(3,2) DEFAULT 0.80, -- 80%
  accuracy_target_max NUMERIC(3,2) DEFAULT 0.90, -- 90%

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_by UUID, -- User ID who created the run
  notes TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_validation_runs_status ON validation_runs(status);
CREATE INDEX IF NOT EXISTS idx_validation_runs_created ON validation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_runs_run_number ON validation_runs(run_number DESC);
CREATE INDEX IF NOT EXISTS idx_validation_runs_approved ON validation_runs(approved);

-- Auto-increment run_number
CREATE SEQUENCE IF NOT EXISTS validation_runs_run_number_seq START 1;

-- ============================================================================
-- TABLE 2: validation_cohorts (Step 2 - Intake & Cohort data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,

  -- Scraper Stats
  total_videos_scraped INT NOT NULL DEFAULT 0,
  videos_passing_dps INT NOT NULL DEFAULT 0, -- Videos with DPS ≥ threshold

  -- Cohort Splits
  train_count INT NOT NULL DEFAULT 0,
  val_count INT NOT NULL DEFAULT 0,
  test_count INT NOT NULL DEFAULT 0,

  -- Video IDs for each split
  train_video_ids TEXT[], -- Array of video_id's
  val_video_ids TEXT[],
  test_video_ids TEXT[],

  -- Filters Applied
  language_filter VARCHAR(50), -- e.g., "English Only"
  timeframe_filter VARCHAR(50), -- e.g., "Last 7 Days"
  dedupe_method VARCHAR(50), -- e.g., "By Video ID"

  -- Processing Stats
  avg_processing_time_seconds NUMERIC(10,2), -- e.g., 12.5 seconds

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(run_id) -- One cohort per run
);

CREATE INDEX IF NOT EXISTS idx_validation_cohorts_run ON validation_cohorts(run_id);

-- ============================================================================
-- TABLE 3: validation_patterns (Step 3 - Pattern QA data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
  video_id VARCHAR(255) NOT NULL, -- References scraped_videos.video_id

  -- 9 Attributes (auto-extracted from FEAT-060)
  hook_time VARCHAR(100), -- e.g., "0-1s" or "verified"
  visual_style VARCHAR(100),
  audio_pattern VARCHAR(100),
  text_overlay VARCHAR(100),
  pacing VARCHAR(100),
  emotion VARCHAR(100),
  call_to_action VARCHAR(100),
  share_trigger VARCHAR(100),
  engagement_hook VARCHAR(100),

  -- QA Status for each attribute
  hook_time_status VARCHAR(20) CHECK (hook_time_status IN ('verified', 'review', 'missing')),
  visual_style_status VARCHAR(20) CHECK (visual_style_status IN ('verified', 'review', 'missing')),
  audio_pattern_status VARCHAR(20) CHECK (audio_pattern_status IN ('verified', 'review', 'missing')),
  text_overlay_status VARCHAR(20) CHECK (text_overlay_status IN ('verified', 'review', 'missing')),
  pacing_status VARCHAR(20) CHECK (pacing_status IN ('verified', 'review', 'missing')),
  emotion_status VARCHAR(20) CHECK (emotion_status IN ('verified', 'review', 'missing')),
  call_to_action_status VARCHAR(20) CHECK (call_to_action_status IN ('verified', 'review', 'missing')),
  share_trigger_status VARCHAR(20) CHECK (share_trigger_status IN ('verified', 'review', 'missing')),
  engagement_hook_status VARCHAR(20) CHECK (engagement_hook_status IN ('verified', 'review', 'missing')),

  -- Pattern Tags (from Enhanced Pattern Extraction)
  pattern_tags TEXT[], -- e.g., ['transformation-reveal', 'before-after', 'quick-tips']

  -- Auto-fill Confidence
  auto_fill_accuracy NUMERIC(3,2), -- e.g., 0.92 (92%)

  -- Human Review
  reviewed_by UUID, -- User ID who reviewed
  reviewed_at TIMESTAMPTZ,
  human_corrections JSONB, -- Any manual edits made

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_patterns_run ON validation_patterns(run_id);
CREATE INDEX IF NOT EXISTS idx_validation_patterns_video ON validation_patterns(video_id);
CREATE INDEX IF NOT EXISTS idx_validation_patterns_status ON validation_patterns(run_id, hook_time_status, visual_style_status);

-- ============================================================================
-- TABLE 4: validation_fingerprints (Step 4 - Fingerprint & Template Mapping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,

  -- Cluster Name (e.g., "Transformation Reveal")
  cluster_name VARCHAR(100) NOT NULL,
  video_count INT NOT NULL DEFAULT 0, -- e.g., 89 videos
  match_confidence NUMERIC(3,2), -- e.g., 0.94 (94% match)
  color_gradient VARCHAR(100), -- e.g., "from-purple-600 to-pink-600"

  -- Video IDs in this cluster
  video_ids TEXT[], -- Array of video_id's

  -- Compendium Template Mapping
  template_id UUID, -- References framework_compendium table if exists
  template_name VARCHAR(255), -- e.g., "Transformation Reveal Template"
  pattern_weights JSONB, -- {hook: 0.8, cta: 0.6, share_trigger: 0.3, ...}
  performance_drivers TEXT[], -- e.g., ['Hook', 'CTA']

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_fingerprints_run ON validation_fingerprints(run_id);
CREATE INDEX IF NOT EXISTS idx_validation_fingerprints_cluster ON validation_fingerprints(cluster_name);

-- ============================================================================
-- TABLE 5: validation_predictions (Step 5 - Pre-Post Predictions Lockbox)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
  video_id VARCHAR(255) NOT NULL, -- References scraped_videos.video_id

  -- Predicted Status (from FEAT-070)
  predicted_status VARCHAR(10) NOT NULL CHECK (predicted_status IN ('green', 'yellow', 'red')),
  predicted_dps NUMERIC(10,2), -- e.g., 82.50
  predicted_views_min INT,
  predicted_views_max INT,
  predicted_engagement_rate NUMERIC(5,2), -- e.g., 12.50 (12.5%)
  share_potential VARCHAR(10), -- e.g., "high", "medium", "low"

  -- 9 Attributes Breakdown (from prediction model)
  nine_attributes_breakdown JSONB, -- {tam_resonance: 0.85, sharability: 0.92, ...}

  -- Recommended Fixes
  recommended_fixes JSONB, -- [{issue: "Hook too slow", fix: "Move to 0-1s", severity: "high"}, ...]

  -- Lockbox (timestamp + hash for audit trail)
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lock_hash VARCHAR(255) NOT NULL, -- SHA256 hash of prediction for tamper detection

  -- Actual Results (filled after video posts or from test set)
  actual_dps NUMERIC(10,2),
  actual_views INT,
  actual_engagement_rate NUMERIC(5,2),
  actual_status VARCHAR(10) CHECK (actual_status IN ('green', 'yellow', 'red')),
  actuals_updated_at TIMESTAMPTZ,

  -- Validation
  prediction_correct BOOLEAN, -- true if predicted_status == actual_status
  dps_error NUMERIC(10,2), -- abs(predicted_dps - actual_dps)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_predictions_run ON validation_predictions(run_id);
CREATE INDEX IF NOT EXISTS idx_validation_predictions_video ON validation_predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_validation_predictions_status ON validation_predictions(predicted_status);
CREATE INDEX IF NOT EXISTS idx_validation_predictions_correct ON validation_predictions(prediction_correct);

-- ============================================================================
-- TABLE 6: validation_events (Audit trail for all workflow actions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS validation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL, -- e.g., "constraints_locked", "cohort_built", "patterns_extracted", etc.
  event_data JSONB NOT NULL DEFAULT '{}', -- Additional context

  -- User Tracking
  user_id UUID, -- Who triggered this event

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_events_run ON validation_events(run_id);
CREATE INDEX IF NOT EXISTS idx_validation_events_type ON validation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_validation_events_created ON validation_events(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Disable RLS for now (admin-only access)
ALTER TABLE validation_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_cohorts DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_fingerprints DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE validation_events DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-increment run_number
CREATE OR REPLACE FUNCTION set_validation_run_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.run_number IS NULL THEN
    NEW.run_number := nextval('validation_runs_run_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_validation_run_number
BEFORE INSERT ON validation_runs
FOR EACH ROW
EXECUTE FUNCTION set_validation_run_number();

-- Function to update last_updated_at timestamp
CREATE OR REPLACE FUNCTION update_validation_run_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_validation_run_timestamp
BEFORE UPDATE ON validation_runs
FOR EACH ROW
EXECUTE FUNCTION update_validation_run_timestamp();

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a few previous validation runs for testing
INSERT INTO validation_runs (run_number, name, description, niche, video_format, account_size, timeframe, success_metric, status, current_step, overall_accuracy, approved, approved_at, created_at)
VALUES
  (44, 'Run #44: Food/Nutrition DPS≥90', 'Food/Nutrition niche with high DPS threshold', 'Food/Nutrition', '15-30s', '10K-100K', 'Last 7 days', 'DPS ≥ 90', 'complete', 6, 91.00, true, NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week'),
  (45, 'Run #45: Real Estate Quick Win', 'Quick win validation for real estate niche', 'Real Estate', '15-30s', '10K-100K', 'Last 7 days', 'DPS ≥ 80', 'complete', 6, 79.00, false, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  (46, 'Run #46: Beauty/Skincare Test', 'Beauty/skincare niche accuracy test', 'Beauty/Skincare', '15-30s', '10K-100K', 'Last 7 days', 'DPS ≥ 80', 'complete', 6, 82.00, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE validation_runs IS 'FEAT-072: Main experiment/validation run tracking for admin accuracy validation workflow';
COMMENT ON TABLE validation_cohorts IS 'FEAT-072: Cohort data for Step 2 (Intake & Cohort Build)';
COMMENT ON TABLE validation_patterns IS 'FEAT-072: Pattern QA data for Step 3 (9 attributes extraction and review)';
COMMENT ON TABLE validation_fingerprints IS 'FEAT-072: Fingerprint clustering and template mapping for Step 4';
COMMENT ON TABLE validation_predictions IS 'FEAT-072: Prediction lockbox for Step 5 (pre-post predictions with audit trail)';
COMMENT ON TABLE validation_events IS 'FEAT-072: Audit trail for all workflow actions';
