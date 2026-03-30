-- Missing tables for viral prediction system
-- Run this in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  predicted_viral_probability DECIMAL(5, 4),
  predicted_peak_time TIMESTAMP WITH TIME ZONE,
  confidence_level VARCHAR(10) CHECK (confidence_level IN ('high', 'medium', 'low')),
  recommended_actions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hook detections table
CREATE TABLE IF NOT EXISTS hook_detections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  hook_type VARCHAR(100),
  confidence_score DECIMAL(5, 4),
  expected_success_rate DECIMAL(5, 4),
  hook_position_seconds INTEGER,
  detected_elements JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. AI Brain analysis table
CREATE TABLE IF NOT EXISTS ai_brain_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  narrative_structure JSONB DEFAULT '{}',
  psychological_insights JSONB DEFAULT '{}',
  cultural_significance JSONB DEFAULT '{}',
  viral_mechanics JSONB DEFAULT '{}',
  expert_recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Engagement velocity tracking
CREATE TABLE IF NOT EXISTS engagement_velocity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_per_hour DECIMAL(10, 2),
  comments_per_hour DECIMAL(10, 2),
  shares_per_hour DECIMAL(10, 2),
  views_per_hour DECIMAL(10, 2),
  velocity_score DECIMAL(5, 4),
  acceleration DECIMAL(5, 4)
);

-- 5. Framework scores table
CREATE TABLE IF NOT EXISTS framework_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES videos(id),
  framework_name VARCHAR(100),
  tier INTEGER CHECK (tier IN (1, 2, 3)),
  score DECIMAL(5, 4),
  weight DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_video_id ON predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_hook_detections_video_id ON hook_detections(video_id);
CREATE INDEX IF NOT EXISTS idx_engagement_velocity_video_id ON engagement_velocity(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_scores_video_id ON framework_scores(video_id);

-- Verify tables created
SELECT 
  table_name, 
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('predictions', 'hook_detections', 'ai_brain_analysis', 'engagement_velocity', 'framework_scores')
ORDER BY table_name;