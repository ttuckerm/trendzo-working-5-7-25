-- TRENDZO Viral Intelligence Engine Database Schema
-- Based on the comprehensive blueprint for functioning viral video template system

-- =============================================
-- VIRAL PATTERNS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS viral_patterns (
  id BIGSERIAL PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  framework_id TEXT NOT NULL, -- References viral framework from viralFrameworkEngine
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('hook', 'transition', 'climax', 'call_to_action', 'full_structure')),
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook')),
  
  -- Pattern Definition
  pattern_definition JSONB NOT NULL, -- Structured pattern data
  trigger_words TEXT[],
  visual_elements TEXT[],
  timing_requirements JSONB, -- {min_duration: 15, max_duration: 60, peak_moment: 7}
  
  -- Performance Metrics
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of videos using this pattern that went viral
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_view_count BIGINT DEFAULT 0,
  total_uses INTEGER DEFAULT 0,
  
  -- Metadata
  confidence_score DECIMAL(3,2) DEFAULT 0.00, -- AI confidence in pattern identification
  last_validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VIDEO CONTENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS video_content (
  id BIGSERIAL PRIMARY KEY,
  
  -- Source Information
  source_platform TEXT NOT NULL CHECK (source_platform IN ('instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook')),
  original_url TEXT NOT NULL UNIQUE,
  video_id TEXT NOT NULL, -- Platform-specific video ID
  
  -- Creator Information
  creator_username TEXT NOT NULL,
  creator_display_name TEXT,
  creator_follower_count BIGINT,
  creator_verification_status TEXT,
  
  -- Content Metadata
  title TEXT,
  description TEXT,
  duration INTEGER, -- Duration in seconds
  upload_date TIMESTAMP WITH TIME ZONE,
  hashtags TEXT[],
  mentions TEXT[],
  
  -- Engagement Metrics
  view_count BIGINT DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  
  -- Viral Analysis
  viral_score DECIMAL(5,2), -- Calculated viral score
  growth_velocity DECIMAL(10,2), -- Views per hour at peak
  peak_engagement_time TIMESTAMP WITH TIME ZONE,
  
  -- AI Analysis Results
  transcript TEXT,
  visual_analysis JSONB, -- AI-detected visual elements
  audio_analysis JSONB, -- Audio/music analysis
  sentiment_analysis JSONB, -- Sentiment and emotion detection
  
  -- Processing Status
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PATTERN MATCHES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pattern_matches (
  id BIGSERIAL PRIMARY KEY,
  video_id BIGINT REFERENCES video_content(id) ON DELETE CASCADE,
  pattern_id BIGINT REFERENCES viral_patterns(id) ON DELETE CASCADE,
  
  -- Match Details
  confidence_score DECIMAL(3,2) NOT NULL, -- AI confidence in pattern match
  match_segments JSONB, -- Time segments where pattern appears
  contributing_factors TEXT[], -- What elements contributed to the match
  
  -- Performance Impact
  engagement_contribution DECIMAL(5,2), -- How much this pattern contributed to engagement
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- APPROVAL QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS approval_queue (
  id BIGSERIAL PRIMARY KEY,
  video_id BIGINT REFERENCES video_content(id) ON DELETE CASCADE,
  
  -- Approval Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1 = highest priority
  
  -- AI Recommendation
  ai_recommendation TEXT CHECK (ai_recommendation IN ('approve', 'reject', 'review')),
  ai_confidence DECIMAL(3,2),
  ai_reasoning TEXT,
  
  -- Human Review
  reviewed_by TEXT, -- Admin/expert user ID
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Template Generation Readiness
  ready_for_template BOOLEAN DEFAULT FALSE,
  template_complexity TEXT CHECK (template_complexity IN ('simple', 'moderate', 'complex')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- GENERATED TEMPLATES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS generated_templates (
  id TEXT PRIMARY KEY, -- Custom template ID format: tpl_timestamp_random
  
  -- Source Information
  source_video_id BIGINT REFERENCES video_content(id),
  primary_pattern_id BIGINT REFERENCES viral_patterns(id),
  
  -- Template Metadata
  template_name TEXT NOT NULL,
  template_description TEXT,
  target_platform TEXT NOT NULL,
  target_niche TEXT NOT NULL,
  
  -- Template Structure
  template_structure JSONB NOT NULL, -- Complete template definition
  personalization_options JSONB, -- Available customization options
  
  -- Performance Predictions
  predicted_viral_score DECIMAL(5,2),
  confidence_interval JSONB, -- {min: 65, max: 85}
  target_demographics JSONB,
  optimal_posting_times JSONB,
  
  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  avg_performance JSONB, -- Average performance metrics from users
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  quality_score DECIMAL(3,2), -- Internal quality assessment
  last_performance_update TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEMPLATE USAGE TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS template_usage (
  id BIGSERIAL PRIMARY KEY,
  template_id TEXT REFERENCES generated_templates(id) ON DELETE CASCADE,
  
  -- User Information (anonymous tracking)
  user_session_id TEXT, -- Anonymous session tracking
  user_tier TEXT CHECK (user_tier IN ('free', 'premium', 'enterprise')),
  
  -- Usage Details
  customizations_applied JSONB, -- What customizations user made
  final_content JSONB, -- Final template content after customization
  
  -- Performance Results
  actual_view_count BIGINT,
  actual_engagement_rate DECIMAL(5,2),
  actual_viral_score DECIMAL(5,2),
  performance_vs_prediction DECIMAL(5,2), -- How actual performance compared to prediction
  
  -- Attribution
  creator_attribution_given BOOLEAN DEFAULT FALSE,
  attribution_method TEXT, -- How user gave credit to original creator
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  results_updated_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- NEWSLETTER TRACKING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_links (
  id TEXT PRIMARY KEY, -- Custom link ID format: nl_timestamp_random
  template_id TEXT REFERENCES generated_templates(id),
  
  -- Link Configuration
  short_code TEXT NOT NULL UNIQUE, -- For shortened URLs
  target_url TEXT NOT NULL,
  campaign_name TEXT,
  
  -- Tracking Data
  click_count INTEGER DEFAULT 0,
  unique_clicks INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0, -- How many completed the template
  
  -- Analytics
  click_sources JSONB, -- Where clicks came from
  geographic_data JSONB, -- Geographic distribution of clicks
  device_data JSONB, -- Device/browser information
  
  -- Configuration
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_clicked_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- VIRAL INTELLIGENCE JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS viral_intelligence_jobs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Job Configuration
  job_type TEXT NOT NULL CHECK (job_type IN ('video_scraping', 'pattern_analysis', 'template_generation', 'performance_tracking')),
  job_status TEXT DEFAULT 'pending' CHECK (job_status IN ('pending', 'running', 'completed', 'failed', 'retrying')),
  
  -- Job Parameters
  job_config JSONB NOT NULL, -- Job-specific configuration
  target_platform TEXT,
  priority INTEGER DEFAULT 3,
  
  -- Execution Tracking
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Results
  results JSONB, -- Job execution results
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Viral Patterns
CREATE INDEX IF NOT EXISTS viral_patterns_framework_idx ON viral_patterns(framework_id);
CREATE INDEX IF NOT EXISTS viral_patterns_platform_idx ON viral_patterns(platform);
CREATE INDEX IF NOT EXISTS viral_patterns_type_idx ON viral_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS viral_patterns_success_rate_idx ON viral_patterns(success_rate DESC);

-- Video Content
CREATE INDEX IF NOT EXISTS video_content_platform_idx ON video_content(source_platform);
CREATE INDEX IF NOT EXISTS video_content_viral_score_idx ON video_content(viral_score DESC);
CREATE INDEX IF NOT EXISTS video_content_creator_idx ON video_content(creator_username);
CREATE INDEX IF NOT EXISTS video_content_upload_date_idx ON video_content(upload_date DESC);
CREATE INDEX IF NOT EXISTS video_content_analysis_status_idx ON video_content(analysis_status);

-- Pattern Matches
CREATE INDEX IF NOT EXISTS pattern_matches_video_idx ON pattern_matches(video_id);
CREATE INDEX IF NOT EXISTS pattern_matches_pattern_idx ON pattern_matches(pattern_id);
CREATE INDEX IF NOT EXISTS pattern_matches_confidence_idx ON pattern_matches(confidence_score DESC);

-- Approval Queue
CREATE INDEX IF NOT EXISTS approval_queue_status_idx ON approval_queue(status);
CREATE INDEX IF NOT EXISTS approval_queue_priority_idx ON approval_queue(priority);
CREATE INDEX IF NOT EXISTS approval_queue_ready_idx ON approval_queue(ready_for_template);

-- Generated Templates
CREATE INDEX IF NOT EXISTS generated_templates_platform_idx ON generated_templates(target_platform);
CREATE INDEX IF NOT EXISTS generated_templates_niche_idx ON generated_templates(target_niche);
CREATE INDEX IF NOT EXISTS generated_templates_viral_score_idx ON generated_templates(predicted_viral_score DESC);
CREATE INDEX IF NOT EXISTS generated_templates_usage_idx ON generated_templates(usage_count DESC);

-- Template Usage
CREATE INDEX IF NOT EXISTS template_usage_template_idx ON template_usage(template_id);
CREATE INDEX IF NOT EXISTS template_usage_performance_idx ON template_usage(actual_viral_score DESC);

-- Newsletter Links
CREATE INDEX IF NOT EXISTS newsletter_links_short_code_idx ON newsletter_links(short_code);
CREATE INDEX IF NOT EXISTS newsletter_links_template_idx ON newsletter_links(template_id);
CREATE INDEX IF NOT EXISTS newsletter_links_clicks_idx ON newsletter_links(click_count DESC);

-- Viral Intelligence Jobs
CREATE INDEX IF NOT EXISTS viral_intelligence_jobs_status_idx ON viral_intelligence_jobs(job_status);
CREATE INDEX IF NOT EXISTS viral_intelligence_jobs_type_idx ON viral_intelligence_jobs(job_type);
CREATE INDEX IF NOT EXISTS viral_intelligence_jobs_priority_idx ON viral_intelligence_jobs(priority);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS
ALTER TABLE viral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_intelligence_jobs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (can be restricted later based on user roles)
CREATE POLICY viral_patterns_all_access ON viral_patterns FOR ALL USING (true);
CREATE POLICY video_content_all_access ON video_content FOR ALL USING (true);
CREATE POLICY pattern_matches_all_access ON pattern_matches FOR ALL USING (true);
CREATE POLICY approval_queue_all_access ON approval_queue FOR ALL USING (true);
CREATE POLICY generated_templates_all_access ON generated_templates FOR ALL USING (true);
CREATE POLICY template_usage_all_access ON template_usage FOR ALL USING (true);
CREATE POLICY newsletter_links_all_access ON newsletter_links FOR ALL USING (true);
CREATE POLICY viral_intelligence_jobs_all_access ON viral_intelligence_jobs FOR ALL USING (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_viral_patterns_updated_at BEFORE UPDATE ON viral_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_content_updated_at BEFORE UPDATE ON video_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approval_queue_updated_at BEFORE UPDATE ON approval_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_templates_updated_at BEFORE UPDATE ON generated_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_viral_intelligence_jobs_updated_at BEFORE UPDATE ON viral_intelligence_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate viral score
CREATE OR REPLACE FUNCTION calculate_viral_score(
  views BIGINT,
  likes INTEGER,
  comments INTEGER,
  shares INTEGER,
  follower_count BIGINT,
  hours_since_upload INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  viral_score DECIMAL(5,2);
  engagement_rate DECIMAL(5,4);
  velocity DECIMAL(10,2);
BEGIN
  -- Calculate engagement rate
  engagement_rate := CASE 
    WHEN views > 0 THEN (likes + comments + shares)::DECIMAL / views::DECIMAL
    ELSE 0
  END;
  
  -- Calculate velocity (views per hour)
  velocity := CASE 
    WHEN hours_since_upload > 0 THEN views::DECIMAL / hours_since_upload::DECIMAL
    ELSE views::DECIMAL
  END;
  
  -- Calculate viral score (0-100 scale)
  viral_score := LEAST(100, 
    (engagement_rate * 1000) + 
    (velocity / 1000) + 
    (CASE WHEN follower_count > 0 THEN (views::DECIMAL / follower_count::DECIMAL) * 10 ELSE 0 END)
  );
  
  RETURN GREATEST(0, viral_score);
END;
$$ LANGUAGE plpgsql;

-- Insert some initial viral patterns based on the viral framework engine
INSERT INTO viral_patterns (pattern_name, framework_id, pattern_type, platform, pattern_definition, trigger_words, visual_elements, timing_requirements, success_rate)
VALUES 
('Hook Formula', 'curiosity_gap', 'hook', 'instagram', 
 '{"structure": "question + promise", "duration": "3-5 seconds", "placement": "opening"}',
 ARRAY['Did you know', 'What if I told you', 'This will blow your mind'],
 ARRAY['close_up_face', 'text_overlay', 'dramatic_zoom'],
 '{"min_duration": 3, "max_duration": 5, "peak_moment": 2}',
 78.5),

('Story Arc Complete', 'story_arc', 'full_structure', 'tiktok',
 '{"structure": "setup + conflict + resolution", "pacing": "fast", "emotional_journey": "high_low_high"}',
 ARRAY['So this happened', 'But then', 'Plot twist'],
 ARRAY['multiple_scenes', 'transition_effects', 'emotional_expressions'],
 '{"min_duration": 15, "max_duration": 60, "peak_moment": 45}',
 82.3),

('Value Proposition', 'value_first', 'hook', 'linkedin',
 '{"structure": "benefit + proof", "tone": "professional", "credibility": "high"}',
 ARRAY['Here is how', 'The secret to', 'What I learned'],
 ARRAY['professional_setting', 'data_visualization', 'authoritative_presence'],
 '{"min_duration": 5, "max_duration": 10, "peak_moment": 3}',
 71.2)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE viral_patterns IS 'Stores identified viral patterns from successful content';
COMMENT ON TABLE video_content IS 'Raw video data scraped from various platforms';
COMMENT ON TABLE pattern_matches IS 'Links videos to the viral patterns they contain';
COMMENT ON TABLE approval_queue IS 'Queue for human review of AI-identified viral content';
COMMENT ON TABLE generated_templates IS 'Templates generated from approved viral content';
COMMENT ON TABLE template_usage IS 'Tracks how users interact with generated templates';
COMMENT ON TABLE newsletter_links IS 'Tracking system for newsletter link campaigns';
COMMENT ON TABLE viral_intelligence_jobs IS 'Background job queue for viral intelligence processing';