-- FEAT-071: Unified Creator Workflow Tables
-- Created: 2025-10-22
-- Purpose: Store user workflow sessions and audit events

-- Table: creator_workflows (main session state)
CREATE TABLE IF NOT EXISTS creator_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- Will add FK to users table when auth is implemented
  goal_id VARCHAR(10) NOT NULL CHECK (goal_id IN ('OBJ-01', 'OBJ-02', 'OBJ-03', 'OBJ-04', 'OBJ-05')),
  niche VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'goal_selected' CHECK (status IN ('goal_selected', 'discovering', 'designing', 'predicting', 'complete')),

  -- Step 2: Discover
  discovered_videos JSONB DEFAULT '[]', -- Array of video objects

  -- Step 3: Design
  script_draft JSONB DEFAULT '{}', -- 9 fields (topic, angle, hooks, etc.)
  framework_id UUID, -- Will add FK to frameworks table when that's created
  framework_confidence NUMERIC(3,2),

  -- Step 4: Predict
  prediction_result JSONB DEFAULT '{}', -- Full prediction object
  predicted_dps NUMERIC(10,2),

  -- Metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  audit_id VARCHAR(255) NOT NULL UNIQUE, -- For tracing

  -- Privacy & Retention
  pii_flags JSONB DEFAULT '{}', -- Empty for now, user-generated scripts may contain PII
  retention_days INT DEFAULT 90 -- Auto-delete after 90 days
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_user ON creator_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON creator_workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_audit ON creator_workflows(audit_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created ON creator_workflows(started_at DESC);

-- Table: workflow_events (audit trail)
CREATE TABLE IF NOT EXISTS workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES creator_workflows(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  audit_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for events
CREATE INDEX IF NOT EXISTS idx_events_workflow ON workflow_events(workflow_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON workflow_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON workflow_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_audit ON workflow_events(audit_id);

-- RLS (Row Level Security) - Disable for now, will enable when auth is implemented
ALTER TABLE creator_workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_events DISABLE ROW LEVEL SECURITY;

-- Grants (allow access for authenticated users)
GRANT ALL ON creator_workflows TO anon, authenticated;
GRANT ALL ON workflow_events TO anon, authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Comments for documentation
COMMENT ON TABLE creator_workflows IS 'FEAT-071: Stores user workflow sessions for the 6-step creator workflow';
COMMENT ON TABLE workflow_events IS 'FEAT-071: Audit trail of all workflow actions for tracing and analytics';
COMMENT ON COLUMN creator_workflows.audit_id IS 'Unique identifier for tracing this workflow session across logs and events';
COMMENT ON COLUMN creator_workflows.pii_flags IS 'Flags for detected PII in user-generated scripts (e.g., {"contains_name": true})';
COMMENT ON COLUMN creator_workflows.retention_days IS 'Auto-delete workflow after this many days (GDPR compliance)';
