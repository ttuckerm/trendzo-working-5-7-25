-- Create TikTok templates table
CREATE TABLE IF NOT EXISTS tiktok_templates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  structure JSONB NOT NULL DEFAULT '{"sections": []}',
  engagement_metrics JSONB NOT NULL DEFAULT '{"views": 0, "likes": 0, "comments": 0, "shares": 0}',
  growth_data JSONB NOT NULL DEFAULT '{"velocity": 0, "acceleration": 0}',
  is_trending BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tiktok_templates IS 'Stores TikTok template metadata and structure';

-- Create template expert insights table
CREATE TABLE IF NOT EXISTS template_expert_insights (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT REFERENCES tiktok_templates(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  manual_adjustment BOOLEAN DEFAULT false,
  adjustment_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT
);

COMMENT ON TABLE template_expert_insights IS 'Stores expert insights and manual adjustments for templates';

-- Create template audit logs table
CREATE TABLE IF NOT EXISTS template_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT REFERENCES tiktok_templates(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by TEXT
);

COMMENT ON TABLE template_audit_logs IS 'Tracks changes to templates for auditing purposes';

-- Create indexes for improved query performance
CREATE INDEX IF NOT EXISTS tiktok_templates_category_idx ON tiktok_templates(category);
CREATE INDEX IF NOT EXISTS tiktok_templates_is_trending_idx ON tiktok_templates(is_trending);
CREATE INDEX IF NOT EXISTS template_expert_insights_template_id_idx ON template_expert_insights(template_id);
CREATE INDEX IF NOT EXISTS template_audit_logs_template_id_idx ON template_audit_logs(template_id);

-- Enable Row Level Security but allow access for now
ALTER TABLE tiktok_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_expert_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for now (can be restricted later)
CREATE POLICY tiktok_templates_all_access ON tiktok_templates FOR ALL USING (true);
CREATE POLICY template_expert_insights_all_access ON template_expert_insights FOR ALL USING (true);
CREATE POLICY template_audit_logs_all_access ON template_audit_logs FOR ALL USING (true); 