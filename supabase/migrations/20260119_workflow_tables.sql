-- ============================================================================
-- Workflow Tables for Viral Content Creator Workflow (v1.1)
-- ============================================================================
-- Purpose: Data model for the 6-phase Viral Content Creator workflow
-- Date: 2026-01-19
-- Author: Claude Code
-- Milestone: v1.1 - Workflow 1
-- Phase: 71 - Data Model & Schema
-- ============================================================================

-- =============================================
-- WORKFLOW TABLES
-- =============================================

-- workflow_runs: Master record for each workflow execution
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL DEFAULT 'viral_content_creator',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_phase >= 1 AND current_phase <= 6),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT valid_completion CHECK (
    (status = 'completed' AND completed_at IS NOT NULL) OR
    (status != 'completed')
  )
);

-- Index for listing user's workflows
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_status ON workflow_runs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_user_id ON workflow_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON workflow_runs(started_at DESC);

COMMENT ON TABLE workflow_runs IS 'Master record for each workflow execution (e.g., Viral Content Creator)';
COMMENT ON COLUMN workflow_runs.workflow_type IS 'Type of workflow: viral_content_creator (more types in future)';
COMMENT ON COLUMN workflow_runs.current_phase IS 'Current phase 1-6 for Viral Content Creator workflow';
COMMENT ON COLUMN workflow_runs.metadata IS 'Additional workflow metadata (e.g., niche, target audience)';

-- workflow_run_steps: Individual phase records
CREATE TABLE IF NOT EXISTS workflow_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  phase_number INTEGER NOT NULL CHECK (phase_number >= 1 AND phase_number <= 6),
  phase_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_edited_at TIMESTAMPTZ,  -- For back-navigation tracking
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  gate_check_results JSONB,  -- For soft gate warnings

  UNIQUE(workflow_run_id, phase_number)
);

-- Index for step lookups
CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_workflow ON workflow_run_steps(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_run_steps_status ON workflow_run_steps(status);

COMMENT ON TABLE workflow_run_steps IS 'Individual phase records for each workflow run';
COMMENT ON COLUMN workflow_run_steps.phase_name IS 'Human-readable phase name (Research, Plan, Create, Optimize, Publish, Engage)';
COMMENT ON COLUMN workflow_run_steps.last_edited_at IS 'Tracks when user last edited this phase (for back-navigation)';
COMMENT ON COLUMN workflow_run_steps.gate_check_results IS 'Soft gate warnings and validation results';

-- workflow_run_artifacts: Phase outputs/artifacts
CREATE TABLE IF NOT EXISTS workflow_run_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_run_steps(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  artifact_data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,  -- Track artifact versions for edits
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for artifact lookups
CREATE INDEX IF NOT EXISTS idx_workflow_run_artifacts_workflow ON workflow_run_artifacts(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_run_artifacts_type ON workflow_run_artifacts(workflow_run_id, artifact_type);
CREATE INDEX IF NOT EXISTS idx_workflow_run_artifacts_step ON workflow_run_artifacts(step_id);

COMMENT ON TABLE workflow_run_artifacts IS 'Phase outputs and artifacts (scripts, thumbnails, analytics, etc.)';
COMMENT ON COLUMN workflow_run_artifacts.artifact_type IS 'Type: script, thumbnail, hook_options, optimized_content, etc.';
COMMENT ON COLUMN workflow_run_artifacts.version IS 'Version number for tracking edits to artifacts';

-- =============================================
-- EXEMPLAR LIBRARY TABLES
-- =============================================

-- exemplar_library: Global collection of exemplar accounts/videos
CREATE TABLE IF NOT EXISTS exemplar_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'tiktok' CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
  account_handle TEXT,
  account_name TEXT,
  video_url TEXT,
  video_title TEXT,
  metrics JSONB,  -- views, likes, engagement at time of capture
  notes TEXT,
  tags TEXT[],  -- For categorization
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user's exemplar library
CREATE INDEX IF NOT EXISTS idx_exemplar_library_user ON exemplar_library(user_id);
CREATE INDEX IF NOT EXISTS idx_exemplar_library_platform ON exemplar_library(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_exemplar_library_tags ON exemplar_library USING GIN(tags);

COMMENT ON TABLE exemplar_library IS 'User collection of exemplar accounts and videos for inspiration';
COMMENT ON COLUMN exemplar_library.metrics IS 'Captured metrics at time of save: {views, likes, comments, shares, engagement_rate}';
COMMENT ON COLUMN exemplar_library.tags IS 'User-defined tags for categorization (e.g., ["hook", "comedy", "lifestyle"])';

-- workflow_exemplars: Junction table linking exemplars to workflows
CREATE TABLE IF NOT EXISTS workflow_exemplars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  exemplar_id UUID NOT NULL REFERENCES exemplar_library(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workflow_run_id, exemplar_id)
);

-- Index for junction lookups
CREATE INDEX IF NOT EXISTS idx_workflow_exemplars_workflow ON workflow_exemplars(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exemplars_exemplar ON workflow_exemplars(exemplar_id);

COMMENT ON TABLE workflow_exemplars IS 'Links exemplars to specific workflow runs for reference during creation';

-- =============================================
-- TIKTOK INTEGRATION TABLES
-- =============================================

-- tiktok_drafts: Track scheduled drafts on TikTok
CREATE TABLE IF NOT EXISTS tiktok_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  tiktok_draft_id TEXT,  -- TikTok's draft ID
  scheduled_for TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  published_url TEXT,  -- Final TikTok URL after publication
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for draft lookups
CREATE INDEX IF NOT EXISTS idx_tiktok_drafts_workflow ON tiktok_drafts(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_drafts_status ON tiktok_drafts(status);
CREATE INDEX IF NOT EXISTS idx_tiktok_drafts_scheduled ON tiktok_drafts(scheduled_for);

COMMENT ON TABLE tiktok_drafts IS 'Tracks TikTok drafts and scheduled posts from workflow';
COMMENT ON COLUMN tiktok_drafts.tiktok_draft_id IS 'TikTok API draft ID for tracking';
COMMENT ON COLUMN tiktok_drafts.published_url IS 'Final TikTok URL after successful publication';

-- =============================================
-- PERFORMANCE TRACKING
-- =============================================

-- workflow_performance: Track predicted vs actual metrics
CREATE TABLE IF NOT EXISTS workflow_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,

  -- Predicted metrics (from Optimize phase)
  predicted_dps NUMERIC(10, 2),
  predicted_views INTEGER,
  predicted_engagement NUMERIC(5, 4),

  -- Actual metrics (from TikTok API)
  actual_views INTEGER,
  actual_likes INTEGER,
  actual_comments INTEGER,
  actual_shares INTEGER,
  actual_watch_time_seconds NUMERIC(10, 2),
  actual_engagement NUMERIC(5, 4),

  -- AI-generated insights
  performance_delta JSONB,  -- Comparison analysis
  improvement_insights JSONB,  -- AI recommendations

  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance lookups
CREATE INDEX IF NOT EXISTS idx_workflow_performance_workflow ON workflow_performance(workflow_run_id);

COMMENT ON TABLE workflow_performance IS 'Tracks predicted vs actual performance metrics for learning';
COMMENT ON COLUMN workflow_performance.predicted_dps IS 'Predicted DPS (Daily Points Score) from Optimize phase';
COMMENT ON COLUMN workflow_performance.performance_delta IS 'AI analysis of prediction vs actual differences';
COMMENT ON COLUMN workflow_performance.improvement_insights IS 'AI-generated insights for future content improvement';

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_run_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exemplar_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_exemplars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_performance ENABLE ROW LEVEL SECURITY;

-- workflow_runs: Users can only access their own workflows
CREATE POLICY workflow_runs_user_policy ON workflow_runs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- workflow_run_steps: Users can access steps of their own workflows
CREATE POLICY workflow_run_steps_user_policy ON workflow_run_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_run_steps.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_run_steps.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  );

-- workflow_run_artifacts: Users can access artifacts of their own workflows
CREATE POLICY workflow_run_artifacts_user_policy ON workflow_run_artifacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_run_artifacts.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_run_artifacts.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  );

-- exemplar_library: Users can only access their own exemplars
CREATE POLICY exemplar_library_user_policy ON exemplar_library
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- workflow_exemplars: Users can access exemplar links of their own workflows
CREATE POLICY workflow_exemplars_user_policy ON workflow_exemplars
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_exemplars.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_exemplars.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  );

-- tiktok_drafts: Users can access drafts of their own workflows
CREATE POLICY tiktok_drafts_user_policy ON tiktok_drafts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = tiktok_drafts.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = tiktok_drafts.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  );

-- workflow_performance: Users can access performance data of their own workflows
CREATE POLICY workflow_performance_user_policy ON workflow_performance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_performance.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflow_runs
      WHERE workflow_runs.id = workflow_performance.workflow_run_id
      AND workflow_runs.user_id = auth.uid()
    )
  );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function: Count active workflows for a user
CREATE OR REPLACE FUNCTION count_active_workflows(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM workflow_runs
    WHERE user_id = p_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION count_active_workflows IS 'Returns count of active workflows for a user (for limit enforcement)';

-- Function: Check active workflow limit before insert
CREATE OR REPLACE FUNCTION check_active_workflow_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
  max_active_workflows INTEGER := 5;  -- Configurable limit (3-5)
BEGIN
  -- Only check on INSERT of new active workflows
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    active_count := count_active_workflows(NEW.user_id);

    IF active_count >= max_active_workflows THEN
      RAISE EXCEPTION 'Maximum active workflows limit (%) reached. Complete or abandon an existing workflow first.', max_active_workflows;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Enforce active workflow limit
DROP TRIGGER IF EXISTS enforce_active_workflow_limit ON workflow_runs;
CREATE TRIGGER enforce_active_workflow_limit
  BEFORE INSERT ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION check_active_workflow_limit();

-- Function: Auto-create workflow steps when workflow is created
CREATE OR REPLACE FUNCTION create_workflow_steps()
RETURNS TRIGGER AS $$
DECLARE
  phase_names TEXT[] := ARRAY['Research', 'Plan', 'Create', 'Optimize', 'Publish', 'Engage'];
  i INTEGER;
BEGIN
  -- Create all 6 phases for the workflow
  FOR i IN 1..6 LOOP
    INSERT INTO workflow_run_steps (
      workflow_run_id,
      phase_number,
      phase_name,
      status
    ) VALUES (
      NEW.id,
      i,
      phase_names[i],
      CASE WHEN i = 1 THEN 'in_progress' ELSE 'pending' END
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create steps on workflow creation
DROP TRIGGER IF EXISTS create_workflow_steps_trigger ON workflow_runs;
CREATE TRIGGER create_workflow_steps_trigger
  AFTER INSERT ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION create_workflow_steps();

-- Function: Update workflow current_phase when step status changes
CREATE OR REPLACE FUNCTION sync_workflow_current_phase()
RETURNS TRIGGER AS $$
BEGIN
  -- When a step is marked as in_progress, update workflow current_phase
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    UPDATE workflow_runs
    SET current_phase = NEW.phase_number
    WHERE id = NEW.workflow_run_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Sync current_phase with step status
DROP TRIGGER IF EXISTS sync_workflow_phase_trigger ON workflow_run_steps;
CREATE TRIGGER sync_workflow_phase_trigger
  AFTER UPDATE ON workflow_run_steps
  FOR EACH ROW
  EXECUTE FUNCTION sync_workflow_current_phase();

-- =============================================
-- VIEW: Active Workflows Summary
-- =============================================

CREATE OR REPLACE VIEW v_active_workflows AS
SELECT
  wr.id AS workflow_id,
  wr.user_id,
  wr.workflow_type,
  wr.status,
  wr.current_phase,
  wrs.phase_name AS current_phase_name,
  wr.started_at,
  wr.metadata,
  (
    SELECT COUNT(*)::INTEGER
    FROM workflow_run_artifacts
    WHERE workflow_run_id = wr.id
  ) AS artifact_count
FROM workflow_runs wr
LEFT JOIN workflow_run_steps wrs ON wrs.workflow_run_id = wr.id AND wrs.phase_number = wr.current_phase
WHERE wr.status = 'active'
ORDER BY wr.started_at DESC;

COMMENT ON VIEW v_active_workflows IS 'Summary of active workflows with current phase info';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
