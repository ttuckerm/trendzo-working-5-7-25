-- ============================================
-- ADD VIRAL PREDICTION TABLES TO EXISTING SUPABASE
-- Only creates tables that don't already exist
-- ============================================

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- CORE VIRAL PREDICTION TABLES (Only Missing Ones)
-- ============================================

-- 1. Videos table (main viral prediction data)
-- This extends your existing tiktok_templates with prediction fields
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
    
    -- Link to your existing tables
    template_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Engagement snapshots (for velocity tracking)
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

-- 3. Hook frameworks (viral hook patterns)
CREATE TABLE IF NOT EXISTS hook_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    success_rate DECIMAL(5, 2),
    usage_count INTEGER DEFAULT 0,
    pattern_rules JSONB NOT NULL,
    example_videos JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Video hooks detected
CREATE TABLE IF NOT EXISTS video_hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    hook_id UUID REFERENCES hook_frameworks(id),
    confidence_score DECIMAL(5, 4),
    detected_elements JSONB,
    performance_impact DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Content series tracking
CREATE TABLE IF NOT EXISTS content_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id VARCHAR(255) NOT NULL,
    series_name VARCHAR(255),
    total_episodes INTEGER DEFAULT 0,
    episode_schedule VARCHAR(100),
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
    cliffhanger_score DECIMAL(5, 2),
    retention_to_next DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENHANCEMENT TABLES
-- ============================================

-- Cross-platform tracking
CREATE TABLE IF NOT EXISTS cross_platform_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_post_id VARCHAR(255),
    engagement_metrics JSONB DEFAULT '{}',
    virality_indicator DECIMAL(10, 2),
    time_to_cross_platform INTERVAL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comment analysis
CREATE TABLE IF NOT EXISTS comment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    total_comments_analyzed INTEGER DEFAULT 0,
    positive_sentiment_ratio DECIMAL(5, 4),
    engagement_sentiment_score DECIMAL(10, 2),
    full_watch_indicators INTEGER DEFAULT 0,
    replay_indicators INTEGER DEFAULT 0,
    timestamp_patterns JSONB DEFAULT '{}',
    emotion_categories JSONB DEFAULT '{}',
    emotion_velocity DECIMAL(10, 4),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pattern matching
CREATE TABLE IF NOT EXISTS pattern_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50),
    matched_pattern_id VARCHAR(255),
    similarity_score DECIMAL(5, 4),
    pattern_metadata JSONB DEFAULT '{}',
    pattern_trending_score DECIMAL(10, 2),
    pattern_usage_count INTEGER DEFAULT 1,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI BRAIN TABLES
-- ============================================

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_type VARCHAR(50),
    messages JSONB NOT NULL DEFAULT '[]',
    context JSONB DEFAULT '{}',
    system_updates_made JSONB DEFAULT '[]',
    parameters_adjusted JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System learning
CREATE TABLE IF NOT EXISTS system_learnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_type VARCHAR(50),
    discovery_context JSONB NOT NULL,
    improvement_metrics JSONB DEFAULT '{}',
    applied_to_system BOOLEAN DEFAULT false,
    approval_status VARCHAR(20) DEFAULT 'pending',
    approval_mode VARCHAR(20) DEFAULT 'auto',
    impact_score DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_at TIMESTAMP WITH TIME ZONE
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    predictions_made INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    false_positives INTEGER DEFAULT 0,
    false_negatives INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5, 2),
    videos_analyzed INTEGER DEFAULT 0,
    processing_time_avg_ms INTEGER,
    cross_platform_signals_detected INTEGER DEFAULT 0,
    comment_analyses_completed INTEGER DEFAULT 0,
    pattern_matches_found INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System configurations
CREATE TABLE IF NOT EXISTS system_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_version VARCHAR(50) NOT NULL,
    viral_thresholds JSONB NOT NULL,
    decay_parameters JSONB NOT NULL,
    platform_weights JSONB NOT NULL,
    hook_effectiveness_scores JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE,
    performance_rating DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- GOD MODE TABLES
-- ============================================

-- Psychological engagement
CREATE TABLE IF NOT EXISTS psychological_engagement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    emotional_arousal_score DECIMAL(5, 4),
    arousal_type VARCHAR(50),
    arousal_intensity DECIMAL(5, 4),
    social_currency_score DECIMAL(5, 4),
    in_the_know_indicators JSONB DEFAULT '[]',
    shareability_factors JSONB DEFAULT '[]',
    parasocial_strength DECIMAL(5, 4),
    creator_viewer_connection_markers JSONB DEFAULT '[]',
    expected_clv_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    high_arousal_emotions JSONB DEFAULT '{}',
    emotion_diversity_score DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production quality analysis
CREATE TABLE IF NOT EXISTS production_quality (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    shot_pacing_score DECIMAL(5, 4),
    average_shot_duration DECIMAL(5, 2),
    rapid_cut_percentage DECIMAL(5, 2),
    pattern_interrupt_count INTEGER DEFAULT 0,
    pattern_interrupt_effectiveness DECIMAL(5, 4),
    lighting_balance DECIMAL(5, 4),
    lighting_consistency DECIMAL(5, 4),
    professional_score DECIMAL(5, 4),
    accessibility_score DECIMAL(5, 4),
    authenticity_score DECIMAL(5, 4),
    audio_clarity DECIMAL(5, 4),
    speech_clarity DECIMAL(5, 4),
    audio_layering_quality DECIMAL(5, 4),
    close_up_shot_percentage DECIMAL(5, 2),
    on_screen_text_usage DECIMAL(5, 4),
    visual_hook_strength DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Second-person perspective
CREATE TABLE IF NOT EXISTS perspective_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    second_person_usage_count INTEGER DEFAULT 0,
    second_person_percentage DECIMAL(5, 2),
    you_references JSONB DEFAULT '[]',
    viewer_addressing_score DECIMAL(5, 4),
    direct_engagement_score DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participation potential
CREATE TABLE IF NOT EXISTS participation_potential (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    duet_potential_score DECIMAL(5, 4),
    stitch_potential_score DECIMAL(5, 4),
    recreation_ease_score DECIMAL(5, 4),
    is_challenge_format BOOLEAN DEFAULT false,
    challenge_template_clarity DECIMAL(5, 4),
    creative_barrier_score DECIMAL(5, 4),
    expected_response_count INTEGER,
    actual_response_count INTEGER DEFAULT 0,
    response_quality_score DECIMAL(5, 4),
    interactive_cta_count INTEGER DEFAULT 0,
    question_prompts JSONB DEFAULT '[]',
    poll_usage BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced series strategy
CREATE TABLE IF NOT EXISTS series_strategy_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES content_series(id) ON DELETE CASCADE,
    cliffhanger_type VARCHAR(50),
    cliffhanger_effectiveness_score DECIMAL(5, 4),
    part_two_request_count INTEGER DEFAULT 0,
    target_return_rate DECIMAL(5, 2) DEFAULT 67.0,
    actual_return_rate DECIMAL(5, 2),
    return_rate_optimization_suggestions JSONB DEFAULT '[]',
    narrative_arc_type VARCHAR(50),
    multi_part_requirement_score DECIMAL(5, 4),
    story_completion_necessity DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cultural timing
CREATE TABLE IF NOT EXISTS cultural_timing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    trend_position VARCHAR(50),
    trend_age_hours INTEGER,
    optimal_window_alignment DECIMAL(5, 4),
    cultural_events JSONB DEFAULT '[]',
    event_relevance_score DECIMAL(5, 4),
    timing_precision_score DECIMAL(5, 4),
    niche_category VARCHAR(100),
    niche_saturation_level DECIMAL(5, 4),
    content_differentiation_score DECIMAL(5, 4),
    timing_score DECIMAL(5, 4),
    luck_factor_estimate DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator authority
CREATE TABLE IF NOT EXISTS creator_authority (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id VARCHAR(255) UNIQUE NOT NULL,
    overall_authority_score DECIMAL(5, 4),
    niche_authority_score DECIMAL(5, 4),
    consistency_score DECIMAL(5, 4),
    historical_viral_rate DECIMAL(5, 4),
    algorithm_favor_score DECIMAL(5, 4),
    initial_reach_multiplier DECIMAL(3, 2) DEFAULT 1.0,
    total_videos_analyzed INTEGER DEFAULT 0,
    viral_video_count INTEGER DEFAULT 0,
    average_performance_percentile DECIMAL(5, 2),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authenticity paradox
CREATE TABLE IF NOT EXISTS authenticity_paradox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    spontaneity_appearance_score DECIMAL(5, 4),
    strategic_planning_indicators DECIMAL(5, 4),
    authenticity_strategy_balance DECIMAL(5, 4),
    personal_story_present BOOLEAN DEFAULT false,
    universal_appeal_score DECIMAL(5, 4),
    relatability_factors JSONB DEFAULT '[]',
    viral_formula_adherence DECIMAL(5, 4),
    formula_disguise_effectiveness DECIMAL(5, 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Algorithm state
CREATE TABLE IF NOT EXISTS algorithm_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detected_change_date TIMESTAMP WITH TIME ZONE NOT NULL,
    change_type VARCHAR(50),
    change_magnitude DECIMAL(5, 4),
    affected_metrics JSONB DEFAULT '[]',
    performance_impact JSONB DEFAULT '{}',
    adaptation_required BOOLEAN DEFAULT true,
    adaptation_completed BOOLEAN DEFAULT false,
    new_weights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INCEPTION MODE TABLES
-- ============================================

-- Marketing templates
CREATE TABLE IF NOT EXISTS marketing_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50),
    source_video_id UUID REFERENCES videos(id),
    source_viral_score DECIMAL(10, 4),
    source_engagement_rate DECIMAL(5, 4),
    viral_structure JSONB NOT NULL,
    hook_framework UUID REFERENCES hook_frameworks(id),
    emotional_triggers JSONB DEFAULT '[]',
    replacement_markers JSONB DEFAULT '{}',
    brand_insertion_points JSONB DEFAULT '[]',
    times_used INTEGER DEFAULT 0,
    average_viral_score DECIMAL(10, 4),
    best_performing_variant UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- One-click optimizations
CREATE TABLE IF NOT EXISTS one_click_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimization_name VARCHAR(255) NOT NULL,
    optimization_type VARCHAR(50),
    before_pattern TEXT NOT NULL,
    after_pattern TEXT NOT NULL,
    expected_improvement DECIMAL(5, 2),
    applicable_platforms JSONB DEFAULT '["tiktok", "instagram", "youtube"]',
    context_requirements JSONB DEFAULT '{}',
    times_applied INTEGER DEFAULT 0,
    actual_improvement_avg DECIMAL(5, 2),
    success_rate DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inception analytics
CREATE TABLE IF NOT EXISTS inception_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50),
    views INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5, 4),
    share_count INTEGER DEFAULT 0,
    clicks_to_landing INTEGER DEFAULT 0,
    signups_generated INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 4),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    platform VARCHAR(50),
    platform_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing queue
CREATE TABLE IF NOT EXISTS marketing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50),
    target_platform VARCHAR(50),
    original_score DECIMAL(10, 4),
    optimized_score DECIMAL(10, 4),
    optimizations_applied JSONB DEFAULT '[]',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft',
    inception_analytics_id UUID REFERENCES inception_analytics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_videos_tiktok_id ON videos(tiktok_id);
CREATE INDEX IF NOT EXISTS idx_videos_upload_timestamp ON videos(upload_timestamp);
CREATE INDEX IF NOT EXISTS idx_videos_viral_score ON videos(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_video_timestamp ON engagement_snapshots(video_id, snapshot_timestamp);
CREATE INDEX IF NOT EXISTS idx_cross_platform_video ON cross_platform_signals(video_id);
CREATE INDEX IF NOT EXISTS idx_pattern_matches_video ON pattern_matches(video_id);
CREATE INDEX IF NOT EXISTS idx_psych_engagement_video ON psychological_engagement(video_id);
CREATE INDEX IF NOT EXISTS idx_production_quality_video ON production_quality(video_id);
CREATE INDEX IF NOT EXISTS idx_cultural_timing_trend ON cultural_timing(trend_position);
CREATE INDEX IF NOT EXISTS idx_creator_authority_creator ON creator_authority(creator_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_state_date ON algorithm_state(detected_change_date);
CREATE INDEX IF NOT EXISTS idx_marketing_templates_type ON marketing_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_optimizations_type ON one_click_optimizations(optimization_type);
CREATE INDEX IF NOT EXISTS idx_inception_analytics_content ON inception_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_marketing_queue_status ON marketing_queue(status);

-- ============================================
-- CREATE UPDATE TRIGGER IF NOT EXISTS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_videos_updated_at') THEN
        CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hook_frameworks_updated_at') THEN
        CREATE TRIGGER update_hook_frameworks_updated_at BEFORE UPDATE ON hook_frameworks
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_marketing_templates_updated_at') THEN
        CREATE TRIGGER update_marketing_templates_updated_at BEFORE UPDATE ON marketing_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_content_series_updated_at') THEN
        CREATE TRIGGER update_content_series_updated_at BEFORE UPDATE ON content_series
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- ============================================
-- INITIAL CONFIGURATION
-- ============================================

-- Insert initial system configuration only if none exists
INSERT INTO system_configurations (
    config_version,
    viral_thresholds,
    decay_parameters,
    platform_weights,
    hook_effectiveness_scores,
    is_active
) 
SELECT 
    'v1.0.0',
    '{"viral": 0.7, "trending": 0.5, "normal": 0.3}',
    '{"tiktok": 0.5, "instagram": 0.3, "youtube": 0.1}',
    '{"tiktok": 1.0, "instagram": 0.85, "youtube": 0.7}',
    '{}',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM system_configurations WHERE is_active = true
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
    new_tables_count INTEGER;
BEGIN
    -- Count newly created tables
    SELECT COUNT(*) INTO new_tables_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'videos', 'engagement_snapshots', 'hook_frameworks', 'video_hooks',
        'content_series', 'series_episodes', 'cross_platform_signals',
        'comment_analysis', 'pattern_matches', 'ai_conversations',
        'system_learnings', 'performance_metrics', 'system_configurations',
        'psychological_engagement', 'production_quality', 'perspective_analysis',
        'participation_potential', 'series_strategy_enhanced', 'cultural_timing',
        'creator_authority', 'authenticity_paradox', 'algorithm_state',
        'marketing_templates', 'one_click_optimizations', 'inception_analytics',
        'marketing_queue'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Viral Prediction tables added to existing project!';
    RAISE NOTICE '📊 New tables created: %', new_tables_count;
    RAISE NOTICE '🔗 Ready to integrate with your existing templates and analytics';
    RAISE NOTICE '🚀 Your existing data remains untouched and available';
    RAISE NOTICE '';
END $$;