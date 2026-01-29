-- TemplateGenerator Database Schema
-- Creates tables for template generation from viral gene vectors using HDBSCAN clustering

-- Template Library: Master templates from clustering
CREATE TABLE IF NOT EXISTS template_library (
    template_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    centroid JSONB NOT NULL, -- 48-dimensional gene vector centroid
    niche VARCHAR(100) NOT NULL DEFAULT 'general',
    videos TEXT[] NOT NULL DEFAULT '{}', -- Array of video_ids in this template
    success_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0, -- Success rate (0.0 to 1.0)
    cluster_size INTEGER NOT NULL DEFAULT 0, -- Number of videos in template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Membership: Many-to-many relationship between videos and templates
CREATE TABLE IF NOT EXISTS template_membership (
    video_id VARCHAR(255) NOT NULL,
    template_id UUID NOT NULL REFERENCES template_library(template_id) ON DELETE CASCADE,
    similarity_score DECIMAL(5,4) DEFAULT 0.0, -- How well video matches template centroid
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (video_id, template_id)
);

-- Template Generation Runs: Audit log of generation runs
CREATE TABLE IF NOT EXISTS template_generation_runs (
    run_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status VARCHAR(50) NOT NULL, -- 'completed', 'error', 'insufficient_data'
    templates_created INTEGER NOT NULL DEFAULT 0,
    videos_processed INTEGER NOT NULL DEFAULT 0,
    clusters_found INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    algorithm_params JSONB DEFAULT '{}', -- Store MIN_CLUSTER_SIZE, etc.
    error_message TEXT,
    run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_template_library_niche ON template_library(niche);
CREATE INDEX IF NOT EXISTS idx_template_library_success_rate ON template_library(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_template_library_created_at ON template_library(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_template_library_cluster_size ON template_library(cluster_size DESC);

CREATE INDEX IF NOT EXISTS idx_template_membership_video_id ON template_membership(video_id);
CREATE INDEX IF NOT EXISTS idx_template_membership_template_id ON template_membership(template_id);
CREATE INDEX IF NOT EXISTS idx_template_membership_similarity ON template_membership(similarity_score DESC);

CREATE INDEX IF NOT EXISTS idx_template_generation_runs_status ON template_generation_runs(status);
CREATE INDEX IF NOT EXISTS idx_template_generation_runs_timestamp ON template_generation_runs(run_timestamp DESC);

-- GIN index for fast centroid similarity searches
CREATE INDEX IF NOT EXISTS idx_template_library_centroid_gin ON template_library USING GIN (centroid);

-- Row Level Security (RLS)
ALTER TABLE template_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_generation_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for authenticated users - adjust as needed)
CREATE POLICY IF NOT EXISTS template_library_policy ON template_library FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS template_membership_policy ON template_membership FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS template_generation_runs_policy ON template_generation_runs FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE template_library IS 'Master templates generated from HDBSCAN clustering of viral gene vectors';
COMMENT ON TABLE template_membership IS 'Many-to-many relationship between videos and templates';
COMMENT ON TABLE template_generation_runs IS 'Audit log of template generation runs with performance metrics';

COMMENT ON COLUMN template_library.centroid IS '48-dimensional gene vector representing template center';
COMMENT ON COLUMN template_library.success_rate IS 'Success rate calculated as cluster_size / total_videos';
COMMENT ON COLUMN template_membership.similarity_score IS 'Cosine similarity between video genes and template centroid';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_library_updated_at 
    BEFORE UPDATE ON template_library 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Example queries for verification
/*
-- View all templates
SELECT template_id, name, niche, cluster_size, success_rate, created_at 
FROM template_library 
ORDER BY success_rate DESC;

-- View template membership
SELECT tl.name, tm.video_id, tm.similarity_score
FROM template_library tl
JOIN template_membership tm ON tl.template_id = tm.template_id
ORDER BY tl.name, tm.similarity_score DESC;

-- View generation run history
SELECT run_id, status, templates_created, videos_processed, duration_ms, run_timestamp
FROM template_generation_runs
ORDER BY run_timestamp DESC;

-- Find templates in specific niche
SELECT * FROM template_library WHERE niche = 'fitness' ORDER BY success_rate DESC;

-- Find videos in multiple templates (potential outliers)
SELECT video_id, COUNT(*) as template_count
FROM template_membership
GROUP BY video_id
HAVING COUNT(*) > 1
ORDER BY template_count DESC;
*/