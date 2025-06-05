-- TRENDZO MVP Schema with Smart Template Engine
-- Run this in Supabase SQL editor to create all necessary tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.campaign_analytics CASCADE;
DROP TABLE IF EXISTS public.user_templates CASCADE;
DROP TABLE IF EXISTS public.landing_pages CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversion_source TEXT CHECK (conversion_source IN ('landing_exit', 'editor_exit', 'direct')),
  entry_niche TEXT,
  entry_platform TEXT,
  attribution_given INTEGER DEFAULT 0,
  total_templates_created INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT false
);

-- Templates table with creator attribution
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  niche TEXT NOT NULL CHECK (niche IN ('business', 'creator', 'fitness', 'education', 'general')),
  platform TEXT[] NOT NULL,
  viral_score DECIMAL(3,2) DEFAULT 0.0 CHECK (viral_score >= 0 AND viral_score <= 1),
  usage_count INTEGER DEFAULT 0,
  original_creator JSONB, -- {username, platform, videoUrl, profileUrl}
  structure JSONB NOT NULL, -- Template structure and elements
  preview_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing pages content with performance tracking
CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche TEXT NOT NULL CHECK (niche IN ('business', 'creator', 'fitness', 'education')),
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')),
  content JSONB NOT NULL, -- {headline, subheadline, painPoints[], benefits[], ctaText, socialProof, templateShowcase, urgencyText}
  performance_data JSONB DEFAULT '{"visitors": 0, "conversions": 0, "conversionRate": 0}',
  ab_variant TEXT DEFAULT 'control',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(niche, platform, ab_variant)
);

-- Campaign analytics for tracking user journey
CREATE TABLE public.campaign_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL, -- Can be anonymous session ID
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'exit_intent_trigger', 'exit_intent_dismiss', 'exit_intent_convert', 'editor_entry', 'template_select', 'customization_start', 'email_capture', 'magic_link_sent', 'magic_link_clicked', 'template_complete', 'attribution_shown', 'attribution_given')),
  metadata JSONB DEFAULT '{}', -- Additional event-specific data
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User templates (saved/edited)
CREATE TABLE public.user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  customization JSONB NOT NULL, -- User's edits and customizations
  completed BOOLEAN DEFAULT false,
  attribution_given BOOLEAN DEFAULT false,
  export_count INTEGER DEFAULT 0,
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator attribution tracking
CREATE TABLE public.creator_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  creator_username TEXT NOT NULL,
  creator_platform TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  comment_posted BOOLEAN DEFAULT false,
  engagement_result TEXT, -- 'liked', 'replied', 'followed', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email captures for magic link system
CREATE TABLE public.email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  capture_source TEXT NOT NULL CHECK (capture_source IN ('landing_exit', 'editor_exit', 'save_template')),
  niche TEXT,
  platform TEXT,
  template_id UUID REFERENCES templates(id),
  magic_link_token UUID DEFAULT gen_random_uuid(),
  magic_link_used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_analytics_visitor ON campaign_analytics(visitor_id);
CREATE INDEX idx_analytics_event ON campaign_analytics(event_type);
CREATE INDEX idx_analytics_created ON campaign_analytics(created_at);
CREATE INDEX idx_templates_niche ON templates(niche);
CREATE INDEX idx_templates_viral_score ON templates(viral_score DESC);
CREATE INDEX idx_landing_pages_lookup ON landing_pages(niche, platform);
CREATE INDEX idx_email_captures_token ON email_captures(magic_link_token);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Templates are public to read
CREATE POLICY "Public can read templates" ON public.templates
  FOR SELECT USING (true);

-- Only admins can modify templates (you'll need to create an admin check function)
CREATE POLICY "Admins can manage templates" ON public.templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email IN ('admin@trendzo.com') -- Add your admin emails
    )
  );

-- Users can CRUD their own templates
CREATE POLICY "Users can read own templates" ON public.user_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own templates" ON public.user_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.user_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.user_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Creator attributions
CREATE POLICY "Users can read own attributions" ON public.creator_attributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create attributions" ON public.creator_attributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Landing pages are public to read
CREATE POLICY "Public can read landing pages" ON public.landing_pages
  FOR SELECT USING (true);

-- Campaign analytics - write only (no read for privacy)
CREATE POLICY "Public can write analytics" ON public.campaign_analytics
  FOR INSERT WITH CHECK (true);

-- Email captures - users can read their own
CREATE POLICY "Users can read own email captures" ON public.email_captures
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE email = email_captures.email
    )
  );

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION update_landing_page_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update performance data when new analytics events come in
  IF NEW.event_type = 'page_view' THEN
    UPDATE landing_pages 
    SET performance_data = jsonb_set(
      performance_data,
      '{visitors}',
      to_jsonb((performance_data->>'visitors')::int + 1)
    )
    WHERE id = NEW.landing_page_id;
  ELSIF NEW.event_type = 'email_capture' THEN
    UPDATE landing_pages 
    SET performance_data = jsonb_set(
      performance_data,
      '{conversions}',
      to_jsonb((performance_data->>'conversions')::int + 1)
    )
    WHERE id = NEW.landing_page_id;
  END IF;
  
  -- Recalculate conversion rate
  UPDATE landing_pages 
  SET performance_data = jsonb_set(
    performance_data,
    '{conversionRate}',
    to_jsonb(
      CASE 
        WHEN (performance_data->>'visitors')::int > 0 
        THEN ROUND(((performance_data->>'conversions')::numeric / (performance_data->>'visitors')::numeric) * 100, 2)
        ELSE 0
      END
    )
  )
  WHERE id = NEW.landing_page_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for analytics updates
CREATE TRIGGER update_performance_on_analytics
AFTER INSERT ON campaign_analytics
FOR EACH ROW
EXECUTE FUNCTION update_landing_page_performance();

-- Function to update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE templates 
  SET usage_count = usage_count + 1
  WHERE id = NEW.template_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for template usage
CREATE TRIGGER increment_template_usage
AFTER INSERT ON user_templates
FOR EACH ROW
EXECUTE FUNCTION update_template_usage();

-- Insert sample templates for testing
INSERT INTO public.templates (name, category, niche, platform, viral_score, structure, preview_url, original_creator) VALUES
('Professional Expertise Showcase', 'Educational', 'business', ARRAY['linkedin', 'twitter'], 0.85, 
  '{"sections": ["hook", "problem", "solution", "cta"], "duration": 30}', 
  '/previews/business-expertise.mp4',
  '{"username": "alexceo", "platform": "linkedin", "videoUrl": "https://linkedin.com/example", "profileUrl": "https://linkedin.com/in/alexceo"}'
),
('Viral Story Format', 'Entertainment', 'creator', ARRAY['tiktok', 'instagram'], 0.92, 
  '{"sections": ["hook", "buildup", "reveal", "reaction"], "duration": 15}', 
  '/previews/viral-story.mp4',
  '{"username": "storytime", "platform": "tiktok", "videoUrl": "https://tiktok.com/@storytime/123", "profileUrl": "https://tiktok.com/@storytime"}'
),
('Transformation Journey', 'Motivational', 'fitness', ARRAY['instagram', 'tiktok'], 0.88, 
  '{"sections": ["before", "process", "after", "tips"], "duration": 45}', 
  '/previews/transformation.mp4',
  '{"username": "fitjourney", "platform": "instagram", "videoUrl": "https://instagram.com/p/example", "profileUrl": "https://instagram.com/fitjourney"}'
),
('Quick Teaching Format', 'Educational', 'education', ARRAY['youtube', 'tiktok'], 0.79, 
  '{"sections": ["question", "explanation", "example", "summary"], "duration": 60}', 
  '/previews/teaching-format.mp4',
  '{"username": "teachertalks", "platform": "tiktok", "videoUrl": "https://tiktok.com/@teachertalks/456", "profileUrl": "https://tiktok.com/@teachertalks"}'
);

-- Insert default landing page content for each niche/platform combination
INSERT INTO public.landing_pages (niche, platform, content) VALUES
('business', 'linkedin', 
  '{"headline": "Executive Video Content That Gets You Promoted", "subheadline": "Create professional videos that showcase expertise in 60 seconds", "painPoints": ["Struggling to stand out in a competitive market", "No time to learn complex video editing", "Need to build executive presence online"], "benefits": ["Get noticed by decision makers", "Position yourself as an industry leader", "Save hours with done-for-you templates"], "ctaText": "Start Creating", "socialProof": "Join 5,000+ executives building their brand", "templateShowcase": "The Executive Insight format - 2M+ views average", "urgencyText": "Templates updated weekly - get early access"}'
),
('creator', 'twitter', 
  '{"headline": "Go Viral on Twitter in 60 Seconds", "subheadline": "Steal the video formats getting millions of views right now", "painPoints": ["Tweets getting lost in the algorithm", "Missing out on video engagement", "Don''t know what content works"], "benefits": ["10x your engagement rates", "Get retweeted by influencers", "Build a loyal following fast"], "ctaText": "Get Templates", "socialProof": "Creators gained 500K+ followers using these", "templateShowcase": "The Thread Explainer - viral every time", "urgencyText": "Only 48 hours before everyone copies this"}'
),
('fitness', 'instagram', 
  '{"headline": "Turn Your Workouts Into Viral Content", "subheadline": "Fitness templates that grow your following and impact lives", "painPoints": ["Great transformations but no engagement", "Reels not reaching your audience", "Competition from bigger accounts"], "benefits": ["Reach millions with your message", "Attract your ideal clients", "Build a fitness empire online"], "ctaText": "Start Growing", "socialProof": "Fitness coaches earned $10K+ from viral videos", "templateShowcase": "The Transformation Reveal - 5M+ views average", "urgencyText": "New Instagram algorithm favors these formats"}'
),
('education', 'facebook', 
  '{"headline": "Engage Students With Video Content That Works", "subheadline": "Educational templates proven to boost learning and retention", "painPoints": ["Students distracted and disengaged", "Traditional teaching not working", "Need to compete with social media"], "benefits": ["Triple student engagement rates", "Make complex topics simple", "Build a following of eager learners"], "ctaText": "Transform Teaching", "socialProof": "Teachers reached 1M+ students with these formats", "templateShowcase": "The Quick Explainer - 95% completion rate", "urgencyText": "Start before the new semester rush"}'
);

-- Add more combinations as needed...

COMMENT ON TABLE public.users IS 'Extended user profiles linked to Supabase auth';
COMMENT ON TABLE public.templates IS 'Viral video templates with creator attribution';
COMMENT ON TABLE public.landing_pages IS 'Dynamic landing page content for Smart Template Engine';
COMMENT ON TABLE public.campaign_analytics IS 'Comprehensive event tracking for conversion optimization';
COMMENT ON TABLE public.user_templates IS 'User customizations and saved templates';
COMMENT ON TABLE public.creator_attributions IS 'Track creator credit and networking';
COMMENT ON TABLE public.email_captures IS 'Magic link system for email authentication';