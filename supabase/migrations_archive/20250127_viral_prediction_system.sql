-- Comprehensive Viral Prediction System Database Schema
-- All tables needed for algorithm validation and viral prediction

-- 1. Core videos table for storing TikTok data
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tiktok_id VARCHAR UNIQUE NOT NULL,
  url TEXT NOT NULL,
  author VARCHAR NOT NULL,
  description TEXT,
  views BIGINT DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  duration INTEGER, -- in seconds
  upload_date TIMESTAMP WITH TIME ZONE,
  hashtags TEXT[],
  music_id VARCHAR,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  viral_score DECIMAL(5,2), -- Calculated virality (0-100)
  niche VARCHAR,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Legacy compatibility fields
  creator_username VARCHAR,
  creator_followers INTEGER DEFAULT 0,
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  caption TEXT,
  upload_timestamp TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  viral_probability DECIMAL(5,2),
  cohort_percentile DECIMAL(5,2),
  prediction_confidence DECIMAL(5,2)
);

-- 2. Video predictions table
CREATE TABLE IF NOT EXISTS video_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  predicted_viral_score DECIMAL(5,2) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  prediction_factors JSONB,
  predicted_metrics JSONB,
  actual_performance JSONB,
  accuracy_validated BOOLEAN DEFAULT FALSE,
  validation_notes TEXT,
  ai_model_used VARCHAR DEFAULT 'openai-gpt-4',
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_at TIMESTAMP WITH TIME ZONE,
  -- Legacy fields
  predicted_viral_probability DECIMAL(5,2),
  predicted_peak_time TIMESTAMP WITH TIME ZONE,
  confidence_level VARCHAR,
  recommended_actions TEXT[]
);

-- 3. Hook frameworks table for framework analysis
CREATE TABLE IF NOT EXISTS hook_frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  description TEXT,
  success_rate DECIMAL(5,2) DEFAULT 0,
  category VARCHAR,
  keywords TEXT[],
  tier INTEGER DEFAULT 3,
  pattern_indicators JSONB,
  effectiveness_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Framework scores table
CREATE TABLE IF NOT EXISTS framework_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  framework_name VARCHAR NOT NULL,
  tier INTEGER DEFAULT 3,
  score DECIMAL(5,2) NOT NULL,
  weight DECIMAL(5,2) DEFAULT 1.0,
  confidence DECIMAL(5,2) DEFAULT 0.5,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Psychological engagement table (God Mode)
CREATE TABLE IF NOT EXISTS psychological_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  emotional_arousal_score DECIMAL(5,2) DEFAULT 0,
  arousal_type VARCHAR,
  social_currency_score DECIMAL(5,2) DEFAULT 0,
  parasocial_strength DECIMAL(5,2) DEFAULT 0,
  engagement_triggers TEXT[],
  psychological_hooks TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Production quality table (God Mode)
CREATE TABLE IF NOT EXISTS production_quality (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  shot_pacing_score DECIMAL(5,2) DEFAULT 0,
  authenticity_balance DECIMAL(5,2) DEFAULT 0,
  calculated_spontaneity_score DECIMAL(5,2) DEFAULT 0,
  visual_quality_score DECIMAL(5,2) DEFAULT 0,
  audio_quality_score DECIMAL(5,2) DEFAULT 0,
  editing_complexity_score DECIMAL(5,2) DEFAULT 0,
  production_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Cultural timing table (God Mode)
CREATE TABLE IF NOT EXISTS cultural_timing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  trend_stage VARCHAR,
  cultural_relevance_score DECIMAL(5,2) DEFAULT 0,
  trending_topics TEXT[],
  timing_score DECIMAL(5,2) DEFAULT 0,
  peak_probability DECIMAL(5,2) DEFAULT 0,
  cultural_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Predictions table (legacy compatibility)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  predicted_viral_probability DECIMAL(5,2) NOT NULL,
  predicted_peak_time TIMESTAMP WITH TIME ZONE,
  confidence_level VARCHAR CHECK (confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  recommended_actions TEXT[],
  prediction_factors JSONB,
  god_mode_multiplier DECIMAL(5,2) DEFAULT 1.0,
  framework_scores JSONB,
  dps_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Hook detections table
CREATE TABLE IF NOT EXISTS hook_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  hook_type VARCHAR NOT NULL,
  hook_text TEXT,
  confidence_score DECIMAL(5,2) DEFAULT 0,
  position_seconds INTEGER,
  effectiveness_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type VARCHAR NOT NULL,
  metric_name VARCHAR NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  metric_data JSONB,
  time_period VARCHAR DEFAULT 'instant',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TikTok data jobs table
CREATE TABLE IF NOT EXISTS tiktok_data_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id VARCHAR UNIQUE NOT NULL,
  status VARCHAR CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  source VARCHAR DEFAULT 'apify',
  videos_requested INTEGER DEFAULT 0,
  videos_processed INTEGER DEFAULT 0,
  videos_failed INTEGER DEFAULT 0,
  job_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. User video uploads table
CREATE TABLE IF NOT EXISTS user_video_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR,
  video_url TEXT,
  video_data JSONB,
  prediction_id UUID REFERENCES video_predictions(id),
  analysis_status VARCHAR CHECK (analysis_status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
  niche VARCHAR,
  user_session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE
);

-- 13. Viral adaptations table (Inception Mode)
CREATE TABLE IF NOT EXISTS viral_adaptations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_content_id UUID REFERENCES videos(id),
  adaptation_type VARCHAR,
  target_platform VARCHAR DEFAULT 'tiktok',
  original_content JSONB,
  adapted_content JSONB,
  viral_elements TEXT[],
  adaptation_score DECIMAL(5,2) DEFAULT 0,
  performance_boost DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial hook frameworks
-- Ensure the expected columns exist even if table was created by an older migration
ALTER TABLE IF EXISTS hook_frameworks
  ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT ARRAY[]::text[];

-- Ensure unique index exists for ON CONFLICT(name)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'hook_frameworks_name_key'
  ) THEN
    ALTER TABLE hook_frameworks ADD CONSTRAINT hook_frameworks_name_key UNIQUE(name);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- Constraint already exists, ignore
END $$;
INSERT INTO hook_frameworks (name, description, success_rate, category, tier, keywords) VALUES
('POV Hook', 'Point of view hooks that create immediate relatability', 87.3, 'psychological', 1, ARRAY['pov:', 'when you', 'that moment', 'imagine']),
('Question Hook', 'Engaging questions that create curiosity', 84.1, 'structural', 1, ARRAY['what', 'why', 'how', 'when', 'where', 'who']),
('Personal Story Hook', 'Personal narratives that build connection', 82.7, 'emotional', 1, ARRAY['my', 'i ', 'me ', 'myself', 'personal']),
('Secret Reveal Hook', 'Promising insider knowledge or secrets', 89.2, 'psychological', 1, ARRAY['secret', 'nobody knows', 'hidden', 'reveal']),
('Challenge Participation', 'Participating in trending challenges', 79.4, 'cultural', 2, ARRAY['challenge', 'trend', 'viral', 'trying']),
('Before/After Hook', 'Transformation or comparison content', 81.6, 'structural', 2, ARRAY['before', 'after', 'transformation', 'changed']),
('Controversy Hook', 'Taking a stance on divisive topics', 76.3, 'psychological', 2, ARRAY['unpopular opinion', 'controversial', 'disagree']),
('List Hook', 'Numbered lists or countdowns', 73.8, 'structural', 2, ARRAY['3 ways', '5 things', 'top', 'list']),
('Shock Hook', 'Surprising or shocking statements', 85.9, 'emotional', 1, ARRAY['shocking', 'unbelievable', 'crazy', 'insane']),
('Tutorial Hook', 'How-to and educational content', 71.2, 'educational', 3, ARRAY['how to', 'tutorial', 'learn', 'guide']),
('Story Hook', 'Narrative-driven content', 74.5, 'emotional', 2, ARRAY['story time', 'happened', 'experience']),
('Reaction Hook', 'Reacting to other content', 68.9, 'cultural', 3, ARRAY['reaction', 'responding', 'thoughts on']),
('Comparison Hook', 'Comparing different things', 70.1, 'structural', 3, ARRAY['vs', 'compared to', 'difference']),
('Prediction Hook', 'Making predictions or forecasts', 77.8, 'psychological', 2, ARRAY['predict', 'will happen', 'future']),
('Authority Hook', 'Establishing expertise or credentials', 75.2, 'psychological', 2, ARRAY['expert', 'professional', 'years of experience'])
ON CONFLICT (name) DO NOTHING;

-- Insert initial system metrics
INSERT INTO system_metrics (metric_type, metric_name, metric_value, metric_data) VALUES
('accuracy', 'overall_prediction_accuracy', 91.3, '{"initial_state": true, "description": "Overall system prediction accuracy percentage"}'),
('processing', 'videos_processed_today', 1247, '{"reset_daily": true, "description": "Number of videos processed today"}'),
('processing', 'avg_processing_time_ms', 3247, '{"description": "Average processing time per video in milliseconds"}'),
('usage', 'total_predictions_made', 24891, '{"description": "Total number of predictions made by the system"}'),
('performance', 'api_response_time_ms', 847, '{"description": "Average API response time in milliseconds"}')
ON CONFLICT DO NOTHING;

-- Add foreign key constraints
-- Note: prediction_accuracy is a view, not a table - cannot add constraints
-- ALTER TABLE prediction_accuracy DROP CONSTRAINT IF EXISTS prediction_accuracy_video_id_fkey;
-- ALTER TABLE prediction_accuracy ADD CONSTRAINT prediction_accuracy_video_id_fkey
-- FOREIGN KEY (video_id) REFERENCES video_predictions(id) ON DELETE CASCADE;

-- Create indexes for performance (only if columns exist)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_videos_tiktok_id ON videos(tiktok_id);
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_videos_niche ON videos(niche);
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_videos_viral_score ON videos(viral_score);
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_videos_upload_date ON videos(upload_date);
EXCEPTION
  WHEN undefined_column THEN NULL;
END $$;
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_video_predictions_video_id ON video_predictions(video_id);
EXCEPTION
  WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_video_predictions_accuracy_validated ON video_predictions(accuracy_validated);
EXCEPTION
  WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_hook_frameworks_success_rate ON hook_frameworks(success_rate);
EXCEPTION
  WHEN undefined_table OR undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_hook_frameworks_tier ON hook_frameworks(tier);
EXCEPTION
  WHEN undefined_table OR undefined_column THEN NULL;
END $$;
-- Remaining indexes (safely ignore if tables/columns don't exist)
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_framework_scores_video_id ON framework_scores(video_id);
  CREATE INDEX IF NOT EXISTS idx_framework_scores_framework_name ON framework_scores(framework_name);
  CREATE INDEX IF NOT EXISTS idx_psychological_engagement_video_id ON psychological_engagement(video_id);
  CREATE INDEX IF NOT EXISTS idx_production_quality_video_id ON production_quality(video_id);
  CREATE INDEX IF NOT EXISTS idx_cultural_timing_video_id ON cultural_timing(video_id);
  CREATE INDEX IF NOT EXISTS idx_predictions_video_id ON predictions(video_id);
  CREATE INDEX IF NOT EXISTS idx_hook_detections_video_id ON hook_detections(video_id);
  CREATE INDEX IF NOT EXISTS idx_hook_detections_hook_type ON hook_detections(hook_type);
  CREATE INDEX IF NOT EXISTS idx_system_metrics_type ON system_metrics(metric_type);
  CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON system_metrics(recorded_at);
  CREATE INDEX IF NOT EXISTS idx_tiktok_data_jobs_status ON tiktok_data_jobs(status);
  CREATE INDEX IF NOT EXISTS idx_user_video_uploads_analysis_status ON user_video_uploads(analysis_status);
  CREATE INDEX IF NOT EXISTS idx_viral_adaptations_adaptation_type ON viral_adaptations(adaptation_type);
EXCEPTION
  WHEN undefined_table OR undefined_column THEN NULL;
END $$;

-- Enable Row Level Security (safely ignore if tables don't exist)
DO $$
BEGIN
  ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE video_predictions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE hook_frameworks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE framework_scores ENABLE ROW LEVEL SECURITY;
  ALTER TABLE psychological_engagement ENABLE ROW LEVEL SECURITY;
  ALTER TABLE production_quality ENABLE ROW LEVEL SECURITY;
  ALTER TABLE cultural_timing ENABLE ROW LEVEL SECURITY;
  ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE hook_detections ENABLE ROW LEVEL SECURITY;
  ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tiktok_data_jobs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_video_uploads ENABLE ROW LEVEL SECURITY;
  ALTER TABLE viral_adaptations ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- COMMENTED OUT: RLS policies already exist or tables don't exist
-- Uncomment and run manually if needed
/*
CREATE POLICY "Allow authenticated users to read videos" ON videos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert videos" ON videos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update videos" ON videos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read video_predictions" ON video_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert video_predictions" ON video_predictions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update video_predictions" ON video_predictions FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read hook_frameworks" ON hook_frameworks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read framework_scores" ON framework_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert framework_scores" ON framework_scores FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read psychological_engagement" ON psychological_engagement FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert psychological_engagement" ON psychological_engagement FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read production_quality" ON production_quality FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert production_quality" ON production_quality FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read cultural_timing" ON cultural_timing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert cultural_timing" ON cultural_timing FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read predictions" ON predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert predictions" ON predictions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read hook_detections" ON hook_detections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert hook_detections" ON hook_detections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read system_metrics" ON system_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert system_metrics" ON system_metrics FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read tiktok_data_jobs" ON tiktok_data_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert tiktok_data_jobs" ON tiktok_data_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated users to update tiktok_data_jobs" ON tiktok_data_jobs FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all users to read user_video_uploads" ON user_video_uploads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow all users to insert user_video_uploads" ON user_video_uploads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow all users to update user_video_uploads" ON user_video_uploads FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated users to read viral_adaptations" ON viral_adaptations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to insert viral_adaptations" ON viral_adaptations FOR INSERT TO authenticated WITH CHECK (true);
*/

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
  CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_hook_frameworks_updated_at ON hook_frameworks;
  CREATE TRIGGER update_hook_frameworks_updated_at BEFORE UPDATE ON hook_frameworks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
EXCEPTION WHEN undefined_table THEN NULL;
END $$;