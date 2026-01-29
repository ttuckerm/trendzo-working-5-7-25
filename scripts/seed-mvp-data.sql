-- TRENDZO MVP - Data Seeding Script
-- Populates initial data for testing and development

-- Clear existing data (optional - remove for production)
-- TRUNCATE TABLE campaign_analytics, email_captures, creator_attributions, templates, landing_pages, users RESTART IDENTITY CASCADE;

-- 1. Create Sample Users
INSERT INTO users (id, email, role, subscription_tier, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@trendzo.com', 'admin', 'admin', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'creator1@example.com', 'user', 'premium', NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'business@example.com', 'user', 'business', NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'fitness@example.com', 'user', 'free', NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'educator@example.com', 'user', 'premium', NOW() - INTERVAL '10 days', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'viral.creator@example.com', 'user', 'business', NOW() - INTERVAL '5 days', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'newbie@example.com', 'user', 'free', NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Create Landing Pages for all niche/platform combinations
INSERT INTO landing_pages (id, niche, platform, ab_variant, content, performance_data, created_at, updated_at) VALUES
-- Business niche
('550e8400-e29b-41d4-a716-446655441001', 'business', 'linkedin', 'control', '{"headline": "Executive Video Content That Gets You Promoted", "subheadline": "Create professional videos that showcase your expertise in 60 seconds"}', '{"visitors": 1247, "conversions": 187, "conversionRate": 15.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441002', 'business', 'twitter', 'control', '{"headline": "The Twitter Strategy That 10x Your Business", "subheadline": "Turn threads into customers with viral video content"}', '{"visitors": 892, "conversions": 134, "conversionRate": 15.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441003', 'business', 'facebook', 'control', '{"headline": "Facebook Ads That Actually Convert", "subheadline": "Video content that turns scrollers into buyers"}', '{"visitors": 2341, "conversions": 281, "conversionRate": 12.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441004', 'business', 'instagram', 'control', '{"headline": "Instagram Reels for B2B Success", "subheadline": "Professional content that builds authority"}', '{"visitors": 1567, "conversions": 220, "conversionRate": 14.0}', NOW() - INTERVAL '30 days', NOW()),

-- Creator niche
('550e8400-e29b-41d4-a716-446655441005', 'creator', 'linkedin', 'control', '{"headline": "Build Your Personal Brand on LinkedIn", "subheadline": "Creator strategies that land brand deals"}', '{"visitors": 567, "conversions": 85, "conversionRate": 15.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441006', 'creator', 'twitter', 'control', '{"headline": "Twitter Growth for Content Creators", "subheadline": "Viral tweets that grow your audience"}', '{"visitors": 1234, "conversions": 197, "conversionRate": 16.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441007', 'creator', 'facebook', 'control', '{"headline": "Facebook Creator Success Blueprint", "subheadline": "Turn your passion into profit"}', '{"visitors": 789, "conversions": 102, "conversionRate": 13.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441008', 'creator', 'instagram', 'control', '{"headline": "Instagram Creator Monetization", "subheadline": "Reels that pay the bills"}', '{"visitors": 2890, "conversions": 434, "conversionRate": 15.0}', NOW() - INTERVAL '30 days', NOW()),

-- Fitness niche
('550e8400-e29b-41d4-a716-446655441009', 'fitness', 'linkedin', 'control', '{"headline": "Corporate Wellness That Works", "subheadline": "Fitness content for professionals"}', '{"visitors": 345, "conversions": 41, "conversionRate": 12.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441010', 'fitness', 'twitter', 'control', '{"headline": "Fitness Transformations That Inspire", "subheadline": "Document your journey, inspire others"}', '{"visitors": 678, "conversions": 88, "conversionRate": 13.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441011', 'fitness', 'facebook', 'control', '{"headline": "Community-Driven Fitness Success", "subheadline": "Build a tribe around your transformation"}', '{"visitors": 1456, "conversions": 204, "conversionRate": 14.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441012', 'fitness', 'instagram', 'control', '{"headline": "Fitness Reels That Motivate", "subheadline": "Transform your workouts into viral content"}', '{"visitors": 3457, "conversions": 553, "conversionRate": 16.0}', NOW() - INTERVAL '30 days', NOW()),

-- Education niche
('550e8400-e29b-41d4-a716-446655441013', 'education', 'linkedin', 'control', '{"headline": "Educational Leadership Content", "subheadline": "Share knowledge, build authority"}', '{"visitors": 456, "conversions": 59, "conversionRate": 13.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441014', 'education', 'twitter', 'control', '{"headline": "EduTwitter Growth Strategies", "subheadline": "Teaching threads that go viral"}', '{"visitors": 867, "conversions": 121, "conversionRate": 14.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441015', 'education', 'facebook', 'control', '{"headline": "Educational Content for Parents", "subheadline": "Learning videos families love"}', '{"visitors": 1123, "conversions": 146, "conversionRate": 13.0}', NOW() - INTERVAL '30 days', NOW()),
('550e8400-e29b-41d4-a716-446655441016', 'education', 'instagram', 'control', '{"headline": "EdTech Reels That Educate", "subheadline": "Make learning fun and viral"}', '{"visitors": 2234, "conversions": 312, "conversionRate": 14.0}', NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Create Sample Templates
INSERT INTO templates (id, user_id, name, niche, platform, script, viral_score, usage_count, is_public, metadata, created_at, updated_at) VALUES
-- High-performing templates
('550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655440002', 'LinkedIn Authority Builder', 'business', 'linkedin', 'Hook: The ONE mistake 90% of professionals make on LinkedIn... [Continue with problem/solution/CTA]', 92, 245, true, '{"tags": ["authority", "professional"], "duration": 30, "audioTrack": "corporate-beat"}', NOW() - INTERVAL '25 days', NOW()),
('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655440003', 'Twitter Thread Template', 'business', 'twitter', 'Thread starter: I made $50k from one Twitter thread. Here''s the exact formula: [1/8]', 89, 567, true, '{"tags": ["thread", "monetization"], "duration": 45, "audioTrack": "trending-beat"}', NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655440006', 'Viral Fitness Transformation', 'fitness', 'instagram', 'Hook: 30 days ago I couldn''t do a single push-up. Today... [Show transformation]', 94, 1203, true, '{"tags": ["transformation", "motivation"], "duration": 15, "audioTrack": "motivational-beat"}', NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655442004', '550e8400-e29b-41d4-a716-446655440005', 'Educational Explainer', 'education', 'tiktok', 'Hook: Your teacher never told you this math trick... [Quick tutorial]', 87, 834, true, '{"tags": ["education", "tutorial"], "duration": 60, "audioTrack": "upbeat-learning"}', NOW() - INTERVAL '10 days', NOW()),

-- Medium-performing templates
('550e8400-e29b-41d4-a716-446655442005', '550e8400-e29b-41d4-a716-446655440002', 'Creator Economy Insights', 'creator', 'youtube', 'Hook: The creator economy is broken. Here''s how to fix it...', 76, 156, true, '{"tags": ["creator", "economy"], "duration": 90, "audioTrack": "discussion-beat"}', NOW() - INTERVAL '18 days', NOW()),
('550e8400-e29b-41d4-a716-446655442006', '550e8400-e29b-41d4-a716-446655440004', 'Quick Workout Routine', 'fitness', 'facebook', 'Hook: 5 minutes to stronger abs. No equipment needed...', 71, 298, true, '{"tags": ["workout", "quick"], "duration": 30, "audioTrack": "workout-beat"}', NOW() - INTERVAL '12 days', NOW()),
('550e8400-e29b-41d4-a716-446655442007', '550e8400-e29b-41d4-a716-446655440005', 'Study Hacks for Students', 'education', 'instagram', 'Hook: Study hack that got me from C''s to A''s...', 82, 445, true, '{"tags": ["study", "hacks"], "duration": 20, "audioTrack": "focus-beat"}', NOW() - INTERVAL '8 days', NOW()),

-- New templates
('550e8400-e29b-41d4-a716-446655442008', '550e8400-e29b-41d4-a716-446655440007', 'Beginner Business Tips', 'business', 'instagram', 'Hook: Starting a business? Avoid these 3 deadly mistakes...', 65, 23, true, '{"tags": ["beginner", "business"], "duration": 25, "audioTrack": "startup-beat"}', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 4. Create Sample Email Captures
INSERT INTO email_captures (id, user_id, landing_page_id, template_id, source, metadata, created_at) VALUES
-- Recent captures from different sources
('550e8400-e29b-41d4-a716-446655443001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655442001', 'landing_exit', '{"exitTrigger": "mouse", "timeOnPage": 47}', NOW() - INTERVAL '2 hours'),
('550e8400-e29b-41d4-a716-446655443002', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655441008', '550e8400-e29b-41d4-a716-446655442003', 'template_complete', '{"viralScore": 94, "completionTime": 180}', NOW() - INTERVAL '4 hours'),
('550e8400-e29b-41d4-a716-446655443003', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655441012', NULL, 'landing_exit', '{"exitTrigger": "scroll", "timeOnPage": 23}', NOW() - INTERVAL '6 hours'),
('550e8400-e29b-41d4-a716-446655443004', '550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655441004', NULL, 'landing_page', '{"source": "organic"}', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655443005', '550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655441016', '550e8400-e29b-41d4-a716-446655442004', 'save_template', '{"saveReason": "high_viral_score"}', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 5. Create Creator Attributions
INSERT INTO creator_attributions (id, template_id, original_creator_username, original_creator_platform, attribution_url, performance_boost, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655444001', '550e8400-e29b-41d4-a716-446655442003', '@fitness_guru_mike', 'instagram', 'https://instagram.com/fitness_guru_mike', 15.5, NOW() - INTERVAL '15 days', NOW()),
('550e8400-e29b-41d4-a716-446655444002', '550e8400-e29b-41d4-a716-446655442002', '@business_thread_master', 'twitter', 'https://twitter.com/business_thread_master', 12.3, NOW() - INTERVAL '20 days', NOW()),
('550e8400-e29b-41d4-a716-446655444003', '550e8400-e29b-41d4-a716-446655442004', '@math_teacher_sarah', 'tiktok', 'https://tiktok.com/@math_teacher_sarah', 8.7, NOW() - INTERVAL '10 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 6. Create Sample Analytics Events (realistic user journey)
INSERT INTO campaign_analytics (id, landing_page_id, visitor_id, session_id, event_type, metadata, device_type, utm_source, utm_medium, utm_campaign, created_at) VALUES
-- Recent page views
('550e8400-e29b-41d4-a716-446655445001', '550e8400-e29b-41d4-a716-446655441001', 'visitor_001', 'session_001', 'page_view', '{"niche": "business", "platform": "linkedin", "location": "New York"}', 'desktop', 'google', 'organic', 'business_linkedin', NOW() - INTERVAL '10 minutes'),
('550e8400-e29b-41d4-a716-446655445002', '550e8400-e29b-41d4-a716-446655441008', 'visitor_002', 'session_002', 'page_view', '{"niche": "creator", "platform": "instagram", "location": "California"}', 'mobile', 'instagram', 'social', 'creator_instagram', NOW() - INTERVAL '15 minutes'),
('550e8400-e29b-41d4-a716-446655445003', '550e8400-e29b-41d4-a716-446655441012', 'visitor_003', 'session_003', 'page_view', '{"niche": "fitness", "platform": "instagram", "location": "Texas"}', 'mobile', 'direct', 'direct', 'fitness_instagram', NOW() - INTERVAL '20 minutes'),

-- Exit intent triggers
('550e8400-e29b-41d4-a716-446655445004', '550e8400-e29b-41d4-a716-446655441001', 'visitor_001', 'session_001', 'exit_intent_trigger', '{"trigger": "mouse", "timeOnPage": 45}', 'desktop', 'google', 'organic', 'business_linkedin', NOW() - INTERVAL '8 minutes'),
('550e8400-e29b-41d4-a716-446655445005', '550e8400-e29b-41d4-a716-446655441012', 'visitor_003', 'session_003', 'exit_intent_trigger', '{"trigger": "scroll", "timeOnPage": 23}', 'mobile', 'direct', 'direct', 'fitness_instagram', NOW() - INTERVAL '18 minutes'),

-- Email captures
('550e8400-e29b-41d4-a716-446655445006', '550e8400-e29b-41d4-a716-446655441001', 'visitor_001', 'session_001', 'exit_intent_convert', '{"email_domain": "company.com"}', 'desktop', 'google', 'organic', 'business_linkedin', NOW() - INTERVAL '5 minutes'),
('550e8400-e29b-41d4-a716-446655445007', '550e8400-e29b-41d4-a716-446655441008', 'visitor_002', 'session_002', 'email_capture', '{"email_domain": "gmail.com", "source": "cta_click"}', 'mobile', 'instagram', 'social', 'creator_instagram', NOW() - INTERVAL '12 minutes'),

-- Editor activity
('550e8400-e29b-41d4-a716-446655445008', NULL, 'visitor_001', 'session_001', 'editor_entry', '{"source": "exit_intent", "templateId": "550e8400-e29b-41d4-a716-446655442001"}', 'desktop', 'google', 'organic', 'business_linkedin', NOW() - INTERVAL '3 minutes'),
('550e8400-e29b-41d4-a716-446655445009', NULL, 'visitor_002', 'session_002', 'template_select', '{"templateId": "550e8400-e29b-41d4-a716-446655442003"}', 'mobile', 'instagram', 'social', 'creator_instagram', NOW() - INTERVAL '10 minutes'),
('550e8400-e29b-41d4-a716-446655445010', NULL, 'visitor_002', 'session_002', 'template_complete', '{"templateId": "550e8400-e29b-41d4-a716-446655442003", "completionTime": 142, "viralScore": 89}', 'mobile', 'instagram', 'social', 'creator_instagram', NOW() - INTERVAL '7 minutes'),

-- Older events for trend analysis
('550e8400-e29b-41d4-a716-446655445011', '550e8400-e29b-41d4-a716-446655441004', 'visitor_004', 'session_004', 'template_complete', '{"templateId": "550e8400-e29b-41d4-a716-446655442008", "viralScore": 65}', 'mobile', 'facebook', 'social', 'business_instagram', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655445012', '550e8400-e29b-41d4-a716-446655441016', 'visitor_005', 'session_005', 'template_complete', '{"templateId": "550e8400-e29b-41d4-a716-446655442007", "viralScore": 82}', 'tablet', 'youtube', 'social', 'education_instagram', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655445013', '550e8400-e29b-41d4-a716-446655441011', 'visitor_006', 'session_006', 'template_complete', '{"templateId": "550e8400-e29b-41d4-a716-446655442006", "viralScore": 71}', 'mobile', 'tiktok', 'social', 'fitness_facebook', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 7. Update landing page performance based on analytics
UPDATE landing_pages 
SET performance_data = jsonb_set(
  performance_data, 
  '{lastUpdated}', 
  to_jsonb(NOW()::text)
),
updated_at = NOW();

-- 8. Create indexes for better performance (if not already created)
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_recent ON campaign_analytics(created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_templates_trending ON templates(viral_score DESC, usage_count DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_email_captures_recent ON email_captures(created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';

-- 9. Refresh any materialized views (if they exist)
-- REFRESH MATERIALIZED VIEW IF EXISTS trending_templates_view;

COMMIT;