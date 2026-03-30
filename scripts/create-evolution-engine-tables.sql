-- EvolutionEngine Database Schema
-- Creates tables for storing evolution analysis runs and template status tracking

-- Evolution Runs: Track each execution of the EvolutionEngine
CREATE TABLE IF NOT EXISTS evolution_runs (
    run_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hot_count INTEGER NOT NULL DEFAULT 0,
    cooling_count INTEGER NOT NULL DEFAULT 0,
    new_count INTEGER NOT NULL DEFAULT 0,
    stable_count INTEGER NOT NULL DEFAULT 0,
    total_templates_analyzed INTEGER GENERATED ALWAYS AS (hot_count + cooling_count + new_count + stable_count) STORED,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    run_ts TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Status History: Track status changes over time for trend analysis
CREATE TABLE IF NOT EXISTS template_status_history (
    history_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    run_id UUID NOT NULL REFERENCES evolution_runs(run_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('HOT', 'COOLING', 'NEW', 'STABLE')),
    trend_pct DECIMAL(8,4) NOT NULL DEFAULT 0.0000,
    current_rate DECIMAL(8,6) NOT NULL DEFAULT 0.000000,
    previous_rate DECIMAL(8,6) NOT NULL DEFAULT 0.000000,
    viral_count_current INTEGER NOT NULL DEFAULT 0,
    viral_count_previous INTEGER NOT NULL DEFAULT 0,
    template_age_days INTEGER NOT NULL DEFAULT 0,
    analysis_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Negative Pool: Store non-viral videos for comparison (used by evolution algorithm)
CREATE TABLE IF NOT EXISTS negative_pool (
    video_id VARCHAR(255) PRIMARY KEY,
    follower_bucket VARCHAR(50) NOT NULL, -- '1k-10k', '10k-100k', '100k-1m', '1m+'
    niche VARCHAR(100),
    platform VARCHAR(50) DEFAULT 'tiktok',
    views BIGINT DEFAULT 0,
    likes BIGINT DEFAULT 0,
    creator_id VARCHAR(255),
    creator_followers BIGINT DEFAULT 0,
    upload_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_runs_run_ts ON evolution_runs(run_ts DESC);
CREATE INDEX IF NOT EXISTS idx_evolution_runs_duration ON evolution_runs(duration_ms);
CREATE INDEX IF NOT EXISTS idx_evolution_runs_total_templates ON evolution_runs(total_templates_analyzed DESC);

CREATE INDEX IF NOT EXISTS idx_template_status_history_template_id ON template_status_history(template_id);
CREATE INDEX IF NOT EXISTS idx_template_status_history_run_id ON template_status_history(run_id);
CREATE INDEX IF NOT EXISTS idx_template_status_history_status ON template_status_history(status);
CREATE INDEX IF NOT EXISTS idx_template_status_history_created_at ON template_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_negative_pool_follower_bucket ON negative_pool(follower_bucket);
CREATE INDEX IF NOT EXISTS idx_negative_pool_niche ON negative_pool(niche);
CREATE INDEX IF NOT EXISTS idx_negative_pool_upload_date ON negative_pool(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_negative_pool_creator_followers ON negative_pool(creator_followers DESC);

-- GIN indexes for JSON fields
CREATE INDEX IF NOT EXISTS idx_template_status_history_metadata_gin ON template_status_history USING GIN (analysis_metadata);

-- Row Level Security (RLS)
ALTER TABLE evolution_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE negative_pool ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS evolution_runs_policy ON evolution_runs;
DROP POLICY IF EXISTS template_status_history_policy ON template_status_history;
DROP POLICY IF EXISTS negative_pool_policy ON negative_pool;

-- Create RLS Policies (Allow all for authenticated users)
CREATE POLICY evolution_runs_policy ON evolution_runs FOR ALL USING (true);
CREATE POLICY template_status_history_policy ON template_status_history FOR ALL USING (true);
CREATE POLICY negative_pool_policy ON negative_pool FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE evolution_runs IS 'Audit log of EvolutionEngine analysis runs with template status counts';
COMMENT ON TABLE template_status_history IS 'Historical tracking of template status changes and trend analysis';
COMMENT ON TABLE negative_pool IS 'Non-viral videos used for comparison in evolution algorithm';

COMMENT ON COLUMN evolution_runs.duration_ms IS 'Processing time in milliseconds (target: <10,000ms for 1,000 templates)';
COMMENT ON COLUMN template_status_history.trend_pct IS 'Percentage change in performance rate (-1.0 to +1.0+)';
COMMENT ON COLUMN negative_pool.follower_bucket IS 'Creator follower count bucket for fair comparison';

-- Trigger to update updated_at timestamp (if needed for future columns)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert sample negative pool data for testing
INSERT INTO negative_pool (video_id, follower_bucket, niche, views, likes, creator_followers, upload_date) VALUES
('neg_fitness_001', '1k-10k', 'fitness', 850, 12, 2500, NOW() - INTERVAL '2 days'),
('neg_fitness_002', '10k-100k', 'fitness', 1200, 45, 25000, NOW() - INTERVAL '1 day'),
('neg_business_001', '1k-10k', 'business', 650, 8, 3200, NOW() - INTERVAL '3 days'),
('neg_business_002', '100k-1m', 'business', 2100, 89, 150000, NOW() - INTERVAL '1 day'),
('neg_entertainment_001', '10k-100k', 'entertainment', 900, 23, 45000, NOW() - INTERVAL '2 days'),
('neg_lifestyle_001', '1k-10k', 'lifestyle', 750, 15, 1800, NOW() - INTERVAL '4 days')
ON CONFLICT (video_id) DO NOTHING;

-- Example queries for verification
/*
-- View recent evolution runs
SELECT run_id, hot_count, cooling_count, new_count, stable_count, 
       total_templates_analyzed, duration_ms, run_ts
FROM evolution_runs 
ORDER BY run_ts DESC 
LIMIT 10;

-- View template status changes
SELECT h.template_id, h.status, h.trend_pct, h.current_rate, 
       h.viral_count_current, h.created_at
FROM template_status_history h
ORDER BY h.created_at DESC
LIMIT 20;

-- Performance analysis - average processing time
SELECT 
    COUNT(*) as total_runs,
    AVG(duration_ms) as avg_duration_ms,
    MAX(duration_ms) as max_duration_ms,
    MIN(duration_ms) as min_duration_ms,
    AVG(total_templates_analyzed) as avg_templates_analyzed
FROM evolution_runs
WHERE error_message IS NULL;

-- Template status distribution over time
SELECT 
    DATE_TRUNC('day', run_ts) as run_date,
    AVG(hot_count) as avg_hot,
    AVG(cooling_count) as avg_cooling,
    AVG(new_count) as avg_new,
    AVG(stable_count) as avg_stable
FROM evolution_runs
WHERE run_ts >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', run_ts)
ORDER BY run_date DESC;

-- Negative pool summary by niche
SELECT niche, follower_bucket, COUNT(*) as video_count, 
       AVG(views) as avg_views, AVG(likes) as avg_likes
FROM negative_pool
GROUP BY niche, follower_bucket
ORDER BY niche, follower_bucket;
*/