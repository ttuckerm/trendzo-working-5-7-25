-- Comprehensive Viral Prediction Platform Database Schema
-- Phase 1: Complete Database Setup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text similarity
CREATE EXTENSION IF NOT EXISTS "vector"; -- For ML embeddings

-- Core Prediction Tables

-- 1. Videos table (extends existing or creates new)
CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tiktok_id VARCHAR(255) UNIQUE NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    creator_username VARCHAR(255),
    creator_followers INTEGER DEFAULT 0,
    
    -- Basic metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    -- Video metadata
    upload_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds INTEGER,
    caption TEXT,
    hashtags JSONB DEFAULT '[]',
    sound_id VARCHAR(255),
    sound_name TEXT,
    
    -- Multimodal analysis results
    visual_features JSONB DEFAULT '{}',
    audio_features JSONB DEFAULT '{}',
    text_features JSONB DEFAULT '{}',
    
    -- Prediction data
    viral_score DECIMAL(10, 4),
    viral_probability DECIMAL(5, 4),
    cohort_percentile DECIMAL(5, 2),
    prediction_confidence DECIMAL(5, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Engagement tracking for velocity calculations
CREATE TABLE IF NOT EXISTS engagement_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    snapshot_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    hours_since_upload DECIMAL(10, 2),
    
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    
    -- Calculated velocities
    likes_per_hour DECIMAL(10, 2),
    comments_per_hour DECIMAL(10, 2),
    shares_per_hour DECIMAL(10, 2),
    engagement_acceleration DECIMAL(10, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Hook Engineering System
CREATE TABLE IF NOT EXISTS hook_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'storytelling', 'authority', 'challenge', etc.
    description TEXT,
    success_rate DECIMAL(5, 2), -- Historical success percentage
    usage_count INTEGER DEFAULT 0,
    
    -- Hook pattern definition
    pattern_rules JSONB NOT NULL, -- Rules for detecting this hook type
    example_videos JSONB DEFAULT '[]', -- Example video IDs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Hook detection results
CREATE TABLE IF NOT EXISTS video_hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    hook_id UUID REFERENCES hook_frameworks(id),
    confidence_score DECIMAL(5, 4),
    detected_elements JSONB, -- Specific elements that matched
    performance_impact DECIMAL(10, 2), -- Measured impact on viral score
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Template Library System
CREATE TABLE IF NOT EXISTS viral_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    
    -- Template components
    structure JSONB NOT NULL, -- Template structure definition
    required_elements JSONB DEFAULT '[]',
    optimal_duration_range JSONB DEFAULT '{"min": 15, "max": 60}',
    
    -- Performance tracking
    usage_count INTEGER DEFAULT 0,
    retirement_count INTEGER DEFAULT 0, -- Track 5-use retirement
    average_viral_score DECIMAL(10, 4),
    success_rate DECIMAL(5, 2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Series/Episode Architecture
CREATE TABLE IF NOT EXISTS content_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id VARCHAR(255) NOT NULL,
    series_name VARCHAR(255),
    
    -- Series metadata
    total_episodes INTEGER DEFAULT 0,
    episode_schedule VARCHAR(100), -- 'daily', 'weekly', etc.
    
    -- Performance metrics
    average_retention_rate DECIMAL(5, 2),
    follower_conversion_rate DECIMAL(5, 2),
    total_series_views BIGINT DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series_episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES content_series(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    episode_number INTEGER NOT NULL,
    
    -- Episode-specific metrics
    cliffhanger_score DECIMAL(5, 2), -- How effective the cliffhanger was
    retention_to_next DECIMAL(5, 2), -- % who watched next episode
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhancement Strategy Tables

-- 7. Cross-platform tracking
CREATE TABLE IF NOT EXISTS cross_platform_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'twitter', 'instagram', 'youtube'
    platform_post_id VARCHAR(255),
    
    -- Platform-specific metrics
    engagement_metrics JSONB DEFAULT '{}',
    virality_indicator DECIMAL(10, 2),
    time_to_cross_platform INTERVAL, -- Time from TikTok to other platform
    
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Comment Analysis
CREATE TABLE IF NOT EXISTS comment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Aggregate metrics
    total_comments_analyzed INTEGER DEFAULT 0,
    positive_sentiment_ratio DECIMAL(5, 4),
    engagement_sentiment_score DECIMAL(10, 2),
    
    -- Completion indicators
    full_watch_indicators INTEGER DEFAULT 0, -- "watched whole video" comments
    replay_indicators INTEGER DEFAULT 0,
    timestamp_patterns JSONB DEFAULT '{}', -- Inferred drop-off points
    
    -- Emotional velocity
    emotion_categories JSONB DEFAULT '{}',
    emotion_velocity DECIMAL(10, 4), -- Rate of emotional response
    
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Pattern Recognition
CREATE TABLE IF NOT EXISTS pattern_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50), -- 'audio_fingerprint', 'visual_similarity', 'template_match'
    
    -- Pattern details
    matched_pattern_id VARCHAR(255),
    similarity_score DECIMAL(5, 4),
    pattern_metadata JSONB DEFAULT '{}',
    
    -- Trend correlation
    pattern_trending_score DECIMAL(10, 2),
    pattern_usage_count INTEGER DEFAULT 1,
    
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Brain Tables

-- 10. AI Conversations (with Claude)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_type VARCHAR(50), -- 'system_update', 'prediction_review', 'strategy_adjustment'
    
    -- Conversation data
    messages JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    
    -- Outcomes
    system_updates_made JSONB DEFAULT '[]',
    parameters_adjusted JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. System Learning & Evolution
CREATE TABLE IF NOT EXISTS system_learnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_type VARCHAR(50), -- 'pattern_discovered', 'threshold_adjustment', 'algorithm_improvement'
    
    -- Learning details
    discovery_context JSONB NOT NULL,
    improvement_metrics JSONB DEFAULT '{}',
    
    -- Application
    applied_to_system BOOLEAN DEFAULT false,
    approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approval_mode VARCHAR(20) DEFAULT 'auto', -- 'auto', 'manual'
    
    impact_score DECIMAL(10, 2), -- Measured improvement
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE
);

-- 12. Performance Metrics Tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    
    -- Accuracy metrics
    predictions_made INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5, 2),
    
    -- System performance
    videos_analyzed INTEGER DEFAULT 0,
    processing_time_avg_ms INTEGER,
    
    -- Enhancement strategy metrics
    cross_platform_signals_detected INTEGER DEFAULT 0,
    comment_analyses_completed INTEGER DEFAULT 0,
    pattern_matches_found INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Configuration States (for system evolution)
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_version VARCHAR(50) NOT NULL,
    
    -- Configuration data
    viral_thresholds JSONB NOT NULL,
    decay_parameters JSONB NOT NULL,
    platform_weights JSONB NOT NULL,
    hook_effectiveness_scores JSONB NOT NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    performance_rating DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- God Mode Formula Enhancement Tables

-- 14. Psychological Engagement Tracking
CREATE TABLE IF NOT EXISTS psychological_engagement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Emotional activation scores
    emotional_arousal_score DECIMAL(5, 4),
    arousal_type VARCHAR(50), -- 'awe', 'anger', 'surprise', 'excitement'
    arousal_intensity DECIMAL(5, 4),
    
    -- Social currency metrics
    social_currency_score DECIMAL(5, 4),
    in_the_know_indicators JSONB DEFAULT '[]',
    shareability_factors JSONB DEFAULT '[]',
    
    -- Parasocial relationship building
    parasocial_strength DECIMAL(5, 4),
    creator_viewer_connection_markers JSONB DEFAULT '[]',
    expected_clv_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    
    -- Detailed emotion breakdown
    high_arousal_emotions JSONB DEFAULT '{}',
    emotion_diversity_score DECIMAL(5, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Production Quality Analysis
CREATE TABLE IF NOT EXISTS production_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Shot pacing metrics
    shot_pacing_score DECIMAL(5, 4),
    average_shot_duration DECIMAL(5, 2), -- in seconds
    rapid_cut_percentage DECIMAL(5, 2), -- % of cuts under 2 seconds
    pattern_interrupt_count INTEGER DEFAULT 0,
    pattern_interrupt_effectiveness DECIMAL(5, 4),
    
    -- Quality balance
    lighting_balance DECIMAL(5, 4),
    lighting_consistency DECIMAL(5, 4),
    professional_score DECIMAL(5, 4),
    accessibility_score DECIMAL(5, 4),
    
    -- Authenticity paradox
    calculated_spontaneity_score DECIMAL(5, 4),
    strategic_planning_indicators JSONB DEFAULT '[]',
    authenticity_balance DECIMAL(5, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 16. Perspective and Participation
CREATE TABLE IF NOT EXISTS perspective_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Second-person usage
    you_usage_count INTEGER DEFAULT 0,
    you_percentage DECIMAL(5, 2),
    direct_address_moments JSONB DEFAULT '[]',
    viewer_inclusion_score DECIMAL(5, 4),
    
    -- Participation mechanics
    duet_potential_score DECIMAL(5, 4),
    stitch_potential_score DECIMAL(5, 4),
    challenge_participation_likelihood DECIMAL(5, 4),
    response_video_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Cultural Timing Intelligence
CREATE TABLE IF NOT EXISTS cultural_timing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Trend lifecycle position
    trend_stage VARCHAR(50), -- 'emerging', 'rising', 'peak', 'declining'
    hours_until_peak_estimate DECIMAL(10, 2),
    trend_lifecycle_position DECIMAL(5, 2), -- 0-100 scale
    
    -- Cultural moment alignment
    cultural_relevance_score DECIMAL(5, 4),
    aligned_events JSONB DEFAULT '[]',
    seasonal_alignment DECIMAL(5, 4),
    
    -- Platform-specific timing
    platform_peak_times JSONB DEFAULT '{}',
    optimal_post_window JSONB DEFAULT '{}',
    
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. Algorithm Evolution Tracking
CREATE TABLE IF NOT EXISTS algorithm_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    
    -- Change detection
    change_detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    change_indicators JSONB NOT NULL,
    confidence_level DECIMAL(5, 4),
    
    -- Impact analysis
    affected_metrics JSONB DEFAULT '[]',
    strategy_adjustments_needed JSONB DEFAULT '[]',
    system_adaptations_made JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. Series Strategy Analysis
CREATE TABLE IF NOT EXISTS series_strategy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES content_series(id) ON DELETE CASCADE,
    
    -- Part 2 return rates
    part_two_return_rate DECIMAL(5, 2),
    optimal_gap_hours DECIMAL(10, 2),
    cliffhanger_effectiveness DECIMAL(5, 4),
    
    -- Long-term metrics
    binge_watching_score DECIMAL(5, 4),
    series_completion_rate DECIMAL(5, 2),
    follower_growth_rate DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inception Mode: Super Admin Marketing Tables

-- 20. Marketing Templates
CREATE TABLE IF NOT EXISTS marketing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50), -- 'case_study', 'demo', 'testimonial', 'educational'
    
    -- Template content
    structure JSONB NOT NULL,
    viral_elements JSONB DEFAULT '[]',
    proven_hooks JSONB DEFAULT '[]',
    
    -- Performance
    average_viral_score DECIMAL(10, 4),
    conversion_rate DECIMAL(5, 4), -- Views to signups
    usage_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. One-Click Optimizations
CREATE TABLE IF NOT EXISTS one_click_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimization_type VARCHAR(50), -- 'copy_winner', 'optimize_viral', 'platform_specific'
    
    -- Optimization rules
    transformation_rules JSONB NOT NULL,
    success_patterns JSONB DEFAULT '[]',
    
    -- Effectiveness
    average_score_improvement DECIMAL(5, 2),
    success_rate DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. Platform-Specific Adaptations
CREATE TABLE IF NOT EXISTS platform_adaptations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_platform VARCHAR(50),
    target_platform VARCHAR(50),
    
    -- Adaptation rules
    content_modifications JSONB NOT NULL,
    timing_adjustments JSONB DEFAULT '{}',
    format_changes JSONB DEFAULT '{}',
    
    -- Success metrics
    cross_platform_success_rate DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 23. Self-Referential Analytics
CREATE TABLE IF NOT EXISTS inception_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50),
    
    -- Viral performance
    viral_score DECIMAL(10, 4),
    view_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 4),
    
    -- Conversion tracking
    clicks_to_site INTEGER DEFAULT 0,
    signups_generated INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 4),
    
    -- Meta-analysis
    prediction_accuracy DECIMAL(5, 2), -- How accurate was our own prediction
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 24. Copy Viral Winner Data
CREATE TABLE IF NOT EXISTS viral_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_url VARCHAR(500),
    platform VARCHAR(50),
    
    -- Content analysis
    viral_elements JSONB NOT NULL,
    hook_structure JSONB NOT NULL,
    emotional_triggers JSONB DEFAULT '[]',
    
    -- Adaptability
    adaptation_potential DECIMAL(5, 4),
    niche_relevance JSONB DEFAULT '{}',
    
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 25. Optimization History
CREATE TABLE IF NOT EXISTS optimization_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_content JSONB NOT NULL,
    optimized_content JSONB NOT NULL,
    
    -- Changes made
    modifications_applied JSONB DEFAULT '[]',
    optimization_rationale JSONB DEFAULT '[]',
    
    -- Results
    original_score DECIMAL(10, 4),
    optimized_score DECIMAL(10, 4),
    actual_performance JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 26. Marketing Queue
CREATE TABLE IF NOT EXISTS marketing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content details
    content_title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50),
    target_platform VARCHAR(50),
    
    -- Optimization status
    original_score DECIMAL(10, 4),
    optimized_score DECIMAL(10, 4),
    optimizations_applied JSONB DEFAULT '[]',
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'optimizing', 'scheduled', 'published'
    
    -- Results tracking
    inception_analytics_id UUID REFERENCES inception_analytics(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_videos_tiktok_id ON videos(tiktok_id);
CREATE INDEX idx_videos_upload_timestamp ON videos(upload_timestamp);
CREATE INDEX idx_videos_viral_score ON videos(viral_score DESC);
CREATE INDEX idx_engagement_video_timestamp ON engagement_snapshots(video_id, snapshot_timestamp);
CREATE INDEX idx_cross_platform_video ON cross_platform_signals(video_id);
CREATE INDEX idx_pattern_matches_video ON pattern_matches(video_id);
CREATE INDEX idx_psychological_video ON psychological_engagement(video_id);
CREATE INDEX idx_production_video ON production_quality(video_id);
CREATE INDEX idx_perspective_video ON perspective_analysis(video_id);
CREATE INDEX idx_cultural_video ON cultural_timing(video_id);
CREATE INDEX idx_series_strategy_series ON series_strategy(series_id);
CREATE INDEX idx_marketing_templates_type ON marketing_templates(template_type);
CREATE INDEX idx_optimizations_type ON one_click_optimizations(optimization_type);
CREATE INDEX idx_inception_analytics_content ON inception_analytics(content_id);
CREATE INDEX idx_marketing_queue_status ON marketing_queue(status);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hook_frameworks_updated_at BEFORE UPDATE ON hook_frameworks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_viral_templates_updated_at BEFORE UPDATE ON viral_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_series_updated_at BEFORE UPDATE ON content_series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initial system configuration
INSERT INTO system_configurations (config_version, viral_thresholds, decay_parameters, platform_weights, hook_effectiveness_scores, is_active, activated_at)
VALUES (
    'v1.0',
    '{"mega_viral": 99.9, "hyper_viral": 99, "viral": 95, "trending": 90}',
    '{"tiktok": 0.5, "instagram": 0.3, "youtube": 0.1}',
    '{"tiktok": 1.0, "instagram": 0.85, "youtube": 0.7}',
    '{"storytelling": 1.0, "authority": 0.85, "challenge": 0.75, "emotional": 0.8}',
    true,
    NOW()
);

-- Insert initial hook frameworks (30+ patterns)
INSERT INTO hook_frameworks (name, category, description, success_rate, pattern_rules) VALUES
('Personal Story Hook', 'storytelling', 'Personal narrative that creates emotional connection', 30, '{"keywords": ["my", "I", "me"], "structure": "personal_anecdote"}'),
('Before/After Transformation', 'storytelling', 'Dramatic change narrative', 28, '{"keywords": ["before", "after", "transformation"], "visual": "split_screen"}'),
('POV Hook', 'relatability', 'Point of view scenarios', 87, '{"keywords": ["POV:", "when you", "that moment"], "perspective": "second_person"}'),
('Shock Value Opening', 'emotional', 'Surprising or shocking start', 28, '{"timing": "first_3_seconds", "intensity": "high"}'),
('Question Hook', 'curiosity', 'Compelling question that demands answer', 26, '{"structure": "interrogative", "answer_timing": "delayed"}'),
('List/Ranking Hook', 'educational', 'Numbered lists or rankings', 25, '{"keywords": ["top", "best", "worst"], "structure": "enumerated"}'),
('Tutorial/How-To Hook', 'educational', 'Teaching something valuable', 24, '{"keywords": ["how to", "tutorial", "learn"], "value": "practical"}'),
('Behind the Scenes', 'authority', 'Exclusive insider content', 23, '{"keywords": ["behind", "secret", "exclusive"], "access": "privileged"}'),
('Challenge Participation', 'challenge', 'Popular challenge entry', 26, '{"structure": "challenge_format", "hashtag": "required"}'),
('Duet/Reaction Hook', 'social', 'Responding to other content', 22, '{"format": "duet", "engagement": "responsive"}'),
('Cliffhanger Opening', 'curiosity', 'Suspense that demands completion', 25, '{"structure": "incomplete", "resolution": "end_of_video"}'),
('Relatable Struggle', 'relatability', 'Common frustrations', 24, '{"emotion": "frustration", "resolution": "humor"}'),
('Expert Authority', 'authority', 'Demonstrating expertise', 25, '{"credentials": "implied", "confidence": "high"}'),
('Emotional Story Arc', 'storytelling', 'Journey with emotional payoff', 27, '{"structure": "three_act", "emotion": "progressive"}'),
('Humor/Comedy Hook', 'emotional', 'Immediate comedic value', 27, '{"timing": "immediate", "style": "varied"}'),
('Controversy/Opinion', 'emotional', 'Polarizing viewpoint', 23, '{"stance": "strong", "engagement": "debate"}'),
('FOMO Creation', 'curiosity', 'Fear of missing out', 24, '{"urgency": "high", "exclusivity": "implied"}'),
('Social Proof', 'authority', 'Others endorsing/using', 22, '{"evidence": "visible", "quantity": "multiple"}'),
('Pattern Interrupt', 'curiosity', 'Unexpected break in flow', 21, '{"timing": "strategic", "contrast": "high"}'),
('Nostalgia Trigger', 'emotional', 'Memories and past experiences', 23, '{"references": "generational", "emotion": "warm"}'),
('Problem/Solution', 'educational', 'Clear problem with solution', 24, '{"structure": "problem_first", "solution": "satisfying"}'),
('Myth Busting', 'educational', 'Correcting misconceptions', 22, '{"structure": "myth_then_truth", "authority": "demonstrated"}'),
('Day in the Life', 'relatability', 'Routine content', 21, '{"format": "chronological", "authenticity": "high"}'),
('Comparison Hook', 'educational', 'Comparing options', 20, '{"structure": "side_by_side", "clarity": "high"}'),
('Storytime Hook', 'storytelling', 'Compelling story opener', 26, '{"opener": "intriguing", "promise": "payoff"}'),
('Results/Outcome First', 'curiosity', 'Showing end result first', 25, '{"structure": "reverse_chronological", "impact": "high"}'),
('Celebrity/Influencer Angle', 'authority', 'Name recognition', 21, '{"recognition": "immediate", "relevance": "high"}'),
('User-Generated Response', 'social', 'Responding to comments/requests', 20, '{"format": "response", "engagement": "direct"}'),
('Trend Hijacking', 'social', 'Riding current trends', 24, '{"timing": "trend_aligned", "adaptation": "creative"}'),
('Secret/Hack Reveal', 'curiosity', 'Hidden knowledge sharing', 26, '{"value": "exclusive", "application": "immediate"}');

-- Success message
SELECT 'Viral Prediction Platform database schema created successfully!' as message;