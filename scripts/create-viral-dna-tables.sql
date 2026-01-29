-- Viral DNA Report Database Schema
-- JARVIS Protocol: Complete functional implementation

-- Create viral DNA reports table
CREATE TABLE IF NOT EXISTS viral_dna_reports (
  id TEXT PRIMARY KEY,
  user_handle TEXT NOT NULL,
  email TEXT,
  report_data JSONB NOT NULL,
  viral_score INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_viral_dna_reports_user_handle ON viral_dna_reports(user_handle);
CREATE INDEX IF NOT EXISTS idx_viral_dna_reports_email ON viral_dna_reports(email);
CREATE INDEX IF NOT EXISTS idx_viral_dna_reports_generated_at ON viral_dna_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_viral_dna_reports_viral_score ON viral_dna_reports(viral_score);

-- Create analytics table for tracking report generation
CREATE TABLE IF NOT EXISTS viral_dna_analytics (
  id SERIAL PRIMARY KEY,
  user_handle TEXT NOT NULL,
  email TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_viral_dna_analytics_user_handle ON viral_dna_analytics(user_handle);
CREATE INDEX IF NOT EXISTS idx_viral_dna_analytics_generated_at ON viral_dna_analytics(generated_at);
CREATE INDEX IF NOT EXISTS idx_viral_dna_analytics_source ON viral_dna_analytics(source);

-- Create table for storing viral patterns (used by the matching engine)
CREATE TABLE IF NOT EXISTS viral_patterns (
  id SERIAL PRIMARY KEY,
  pattern_id TEXT UNIQUE NOT NULL,
  pattern_name TEXT NOT NULL,
  framework_id TEXT NOT NULL,
  framework_name TEXT NOT NULL,
  description TEXT,
  confidence_threshold DECIMAL(3,2) DEFAULT 0.7,
  success_rate DECIMAL(3,2),
  category TEXT,
  tags TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for viral patterns
CREATE INDEX IF NOT EXISTS idx_viral_patterns_pattern_id ON viral_patterns(pattern_id);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_framework_id ON viral_patterns(framework_id);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_category ON viral_patterns(category);
CREATE INDEX IF NOT EXISTS idx_viral_patterns_active ON viral_patterns(active);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_viral_dna_reports_updated_at 
  BEFORE UPDATE ON viral_dna_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_patterns_updated_at 
  BEFORE UPDATE ON viral_patterns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default viral patterns
INSERT INTO viral_patterns (pattern_id, pattern_name, framework_id, framework_name, description, success_rate, category) VALUES
('hook_strong_opening', 'Strong Opening Hook', 'attention_grabbing', 'Attention Grabbing', 'Video starts with compelling hook in first 3 seconds', 0.85, 'hooks'),
('story_personal_narrative', 'Personal Story Narrative', 'storytelling', 'Storytelling', 'Personal story with clear beginning, middle, end', 0.78, 'narrative'),
('comparison_this_vs_that', 'This vs That Comparison', 'comparison', 'Comparison Framework', 'Direct comparison between two options/ideas', 0.82, 'comparison'),
('tutorial_step_by_step', 'Step-by-Step Tutorial', 'educational', 'Educational Content', 'Clear tutorial with actionable steps', 0.75, 'education'),
('behind_scenes_day_in_life', 'Behind the Scenes / Day in Life', 'authenticity', 'Authentic Content', 'Authentic behind-the-scenes content', 0.80, 'lifestyle'),
('transformation_before_after', 'Transformation / Before & After', 'transformation', 'Transformation Content', 'Clear before and after transformation', 0.88, 'transformation'),
('controversy_hot_take', 'Controversial Hot Take', 'controversy', 'Controversial Content', 'Polarizing opinion that sparks discussion', 0.72, 'opinion'),
('trend_current_audio', 'Current Trending Audio', 'trending', 'Trending Content', 'Uses currently viral audio/sound', 0.90, 'audio'),
('question_engagement', 'Question for Engagement', 'engagement', 'Engagement Tactics', 'Ends with question to drive comments', 0.77, 'engagement'),
('value_actionable_tip', 'Actionable Value/Tip', 'value', 'Value-Driven Content', 'Provides clear actionable value', 0.83, 'value')
ON CONFLICT (pattern_id) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE viral_dna_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_dna_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read viral patterns (they're public)
CREATE POLICY "Public viral patterns are viewable by everyone" ON viral_patterns
  FOR SELECT USING (active = true);

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage viral_dna_reports" ON viral_dna_reports
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage viral_dna_analytics" ON viral_dna_analytics
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage viral_patterns" ON viral_patterns
  USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON viral_dna_reports TO service_role;
GRANT ALL ON viral_dna_analytics TO service_role;
GRANT ALL ON viral_patterns TO service_role;
GRANT USAGE ON SEQUENCE viral_dna_analytics_id_seq TO service_role;
GRANT USAGE ON SEQUENCE viral_patterns_id_seq TO service_role;