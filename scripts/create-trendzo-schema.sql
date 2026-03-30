-- Trendzo Viral Prediction System Database Schema
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS recipe_book_daily CASCADE;
DROP TABLE IF EXISTS script_patterns CASCADE;
DROP TABLE IF EXISTS module_health CASCADE;
DROP TABLE IF EXISTS prediction_accuracy CASCADE;
DROP TABLE IF EXISTS viral_templates CASCADE;

-- 1. Create viral_templates table
CREATE TABLE viral_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  success_rate DECIMAL(5,2) DEFAULT 0,
  status TEXT CHECK (status IN ('HOT', 'COOLING', 'NEW')) DEFAULT 'NEW',
  usage_count INTEGER DEFAULT 0,
  framework_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: video_predictions table must exist for foreign key references
-- Assuming it already exists in the database

-- 2. Create prediction_accuracy table
CREATE TABLE prediction_accuracy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES video_predictions(id),
  predicted_score INTEGER NOT NULL,
  actual_views INTEGER,
  actual_likes INTEGER,
  actual_shares INTEGER,
  accuracy_percentage DECIMAL(5,2),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create module_health table
CREATE TABLE module_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_name TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('green', 'red', 'yellow')) DEFAULT 'green',
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_count INTEGER DEFAULT 0,
  error_message TEXT,
  uptime_percentage DECIMAL(5,2) DEFAULT 100
);

-- 4. Create script_patterns table
CREATE TABLE script_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES video_predictions(id),
  transcript_text TEXT,
  viral_score INTEGER,
  framework_type TEXT,
  pattern_keywords TEXT[],
  success_indicators TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create recipe_book_daily table
CREATE TABLE recipe_book_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  hot_templates JSONB,
  cooling_templates JSONB,
  new_templates JSONB,
  total_videos_analyzed INTEGER DEFAULT 0,
  system_accuracy DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial data for the 11 modules
INSERT INTO module_health (module_name, status, processed_count) VALUES
('TikTok Scraper', 'green', 24891),
('Viral Pattern Analyzer', 'green', 24891),
('Template Discovery Engine', 'green', 1247),
('Draft Video Analyzer', 'green', 156),
('Script Intelligence Module', 'green', 18993),
('Recipe Book Generator', 'green', 365),
('Prediction Engine', 'green', 24891),
('Performance Validator', 'green', 22344),
('Marketing Content Creator', 'green', 89),
('Dashboard Aggregator', 'green', 24891),
('System Health Monitor', 'green', 999999);

-- Add indexes for better performance
CREATE INDEX idx_viral_templates_status ON viral_templates(status);
CREATE INDEX idx_prediction_accuracy_video_id ON prediction_accuracy(video_id);
CREATE INDEX idx_module_health_status ON module_health(status);
CREATE INDEX idx_script_patterns_video_id ON script_patterns(video_id);
CREATE INDEX idx_recipe_book_daily_date ON recipe_book_daily(date);

-- Add Row Level Security (RLS) policies
ALTER TABLE viral_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_book_daily ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read all data
CREATE POLICY "Allow authenticated users to read viral_templates" 
  ON viral_templates FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read prediction_accuracy" 
  ON prediction_accuracy FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read module_health" 
  ON module_health FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read script_patterns" 
  ON script_patterns FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to read recipe_book_daily" 
  ON recipe_book_daily FOR SELECT 
  TO authenticated 
  USING (true);

-- Test queries
SELECT * FROM module_health ORDER BY module_name;
SELECT COUNT(*) FROM viral_templates;
SELECT COUNT(*) FROM video_predictions;