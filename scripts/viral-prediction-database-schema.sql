-- Viral Prediction Platform Database Schema
-- Complete database structure for operational viral prediction system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================
-- CORE VIDEO ANALYSIS TABLES
-- =============================================

-- Videos table - stores all uploaded/scraped videos
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin')),
    platform_video_id VARCHAR(255),
    creator_username VARCHAR(255),
    creator_id VARCHAR(255),
    
    -- File information
    file_url TEXT,
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    width INTEGER,
    height INTEGER,
    fps DECIMAL(5,2),
    
    -- Content metadata
    upload_date TIMESTAMP WITH TIME ZONE,
    posted_date TIMESTAMP WITH TIME ZONE,
    language VARCHAR(10) DEFAULT 'en',
    content_category VARCHAR(100),
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'error')),
    source_type VARCHAR(50) DEFAULT 'upload' CHECK (source_type IN ('upload', 'scraped', 'manual')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_platform_video UNIQUE (platform, platform_video_id)
);

-- Video features table - extracted features for ML analysis
CREATE TABLE video_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Visual features
    visual_features JSONB, -- frames, objects, faces, colors, etc.
    audio_features JSONB,  -- beats, tempo, volume, music analysis
    text_features JSONB,   -- OCR text, captions, hashtags
    
    -- Structural analysis
    hook_duration_seconds DECIMAL(5,2),
    scene_changes INTEGER,
    face_screen_time_percent DECIMAL(5,2),
    text_overlay_duration DECIMAL(5,2),
    
    -- Content analysis
    emotional_tone JSONB, -- happiness, surprise, fear, etc. scores
    complexity_score DECIMAL(5,2),
    novelty_score DECIMAL(5,2),
    engagement_triggers JSONB,
    
    -- Feature vectors for ML
    feature_vector VECTOR(512), -- embedding vector for similarity
    
    -- Processing metadata
    extraction_version VARCHAR(50),
    processing_duration_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video metrics table - performance data
CREATE TABLE video_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Basic metrics
    views_count BIGINT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    saves_count BIGINT DEFAULT 0,
    
    -- Calculated metrics
    engagement_rate DECIMAL(8,4),
    completion_rate DECIMAL(5,4),
    share_rate DECIMAL(8,6),
    comment_rate DECIMAL(8,6),
    
    -- Time-based metrics
    views_24h BIGINT,
    views_7d BIGINT,
    views_30d BIGINT,
    peak_views_day INTEGER,
    
    -- Advanced metrics
    viral_coefficient DECIMAL(8,4),
    organic_reach_percent DECIMAL(5,2),
    algorithm_boost_score DECIMAL(5,2),
    
    -- Temporal data
    metrics_date DATE NOT NULL,
    is_final BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per video per date
    CONSTRAINT unique_video_metrics_date UNIQUE (video_id, metrics_date)
);

-- =============================================
-- VIRAL PREDICTION TABLES
-- =============================================

-- Viral predictions table
CREATE TABLE viral_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Prediction results
    viral_probability DECIMAL(5,4) NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    predicted_views INTEGER,
    predicted_engagement_rate DECIMAL(5,4),
    
    -- Prediction breakdown
    hook_score DECIMAL(5,2),
    content_score DECIMAL(5,2),
    timing_score DECIMAL(5,2),
    platform_fit_score DECIMAL(5,2),
    
    -- Model information
    model_version VARCHAR(50) NOT NULL,
    model_confidence DECIMAL(5,4),
    prediction_factors JSONB,
    
    -- Validation data
    actual_views INTEGER,
    actual_engagement_rate DECIMAL(5,4),
    accuracy_score DECIMAL(5,2),
    prediction_error DECIMAL(8,4),
    is_correct BOOLEAN,
    
    -- Metadata
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validation_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TEMPLATE AND OPTIMIZATION TABLES
-- =============================================

-- Viral templates table
CREATE TABLE viral_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Performance data
    success_rate DECIMAL(5,2) NOT NULL,
    avg_views INTEGER,
    avg_engagement_rate DECIMAL(5,4),
    viral_probability DECIMAL(5,4),
    
    -- Template structure
    structure JSONB NOT NULL, -- hook, build, payoff, cta
    viral_elements JSONB, -- key elements that make it viral
    optimization_tips JSONB, -- actionable improvements
    
    -- Platform optimization
    platform_optimized VARCHAR(50)[] DEFAULT ARRAY['tiktok'],
    duration_range VARCHAR(50),
    hook_timing_seconds DECIMAL(4,2),
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('HOT', 'COOLING', 'NEW', 'STABLE', 'ARCHIVED')),
    trend_direction VARCHAR(20) DEFAULT 'STABLE' CHECK (trend_direction IN ('RISING', 'FALLING', 'STABLE')),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template usage tracking
CREATE TABLE template_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES viral_templates(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID, -- Optional: link to user if auth system exists
    
    -- Usage context
    adaptation_notes TEXT,
    customizations JSONB,
    
    -- Results tracking
    viral_success BOOLEAN,
    performance_vs_template DECIMAL(8,4), -- performance relative to template average
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimization suggestions table
CREATE TABLE optimization_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Suggestion details
    suggestion_type VARCHAR(50) NOT NULL CHECK (suggestion_type IN ('hook', 'structure', 'visual', 'audio', 'timing', 'cta')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact estimation
    current_score DECIMAL(5,2),
    potential_score DECIMAL(5,2),
    impact_estimate DECIMAL(5,2),
    confidence DECIMAL(5,4),
    
    -- Implementation
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    implementation_time VARCHAR(50),
    priority VARCHAR(20) CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    
    -- AI reasoning
    ai_reasoning TEXT,
    examples JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'rejected', 'expired')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- A/B TESTING TABLES
-- =============================================

-- A/B test runs
CREATE TABLE ab_test_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Test metadata
    test_name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('hook', 'thumbnail', 'structure', 'cta', 'timing')),
    
    -- Test configuration
    target_sample_size INTEGER NOT NULL,
    target_significance DECIMAL(4,3) DEFAULT 0.95,
    target_accuracy DECIMAL(5,2) DEFAULT 90.0,
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed', 'paused', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Results
    winner_variant_id UUID,
    statistical_significance BOOLEAN DEFAULT FALSE,
    confidence_interval DECIMAL(4,3),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test variants
CREATE TABLE ab_test_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_run_id UUID NOT NULL REFERENCES ab_test_runs(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    
    -- Variant details
    variant_name VARCHAR(255) NOT NULL,
    variant_group CHAR(1) NOT NULL, -- A, B, C, etc.
    description TEXT,
    
    -- Changes made
    changes_made JSONB,
    
    -- Predictions
    predicted_viral_probability DECIMAL(5,4),
    predicted_views INTEGER,
    predicted_engagement DECIMAL(5,4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B test results
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id UUID NOT NULL REFERENCES ab_test_variants(id) ON DELETE CASCADE,
    
    -- Actual performance
    actual_views INTEGER,
    actual_engagement_rate DECIMAL(5,4),
    actual_share_rate DECIMAL(8,6),
    actual_completion_rate DECIMAL(5,4),
    actual_ctr DECIMAL(8,6),
    
    -- Social metrics
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    
    -- Statistical measures
    confidence_interval DECIMAL(4,3),
    statistical_significance BOOLEAN,
    
    -- Performance vs prediction
    prediction_accuracy DECIMAL(5,2),
    
    results_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VALIDATION AND QUALITY ASSURANCE
-- =============================================

-- Validation runs for system accuracy testing
CREATE TABLE validation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Run metadata
    run_name VARCHAR(255) NOT NULL,
    run_type VARCHAR(50) DEFAULT 'accuracy_test',
    
    -- Configuration
    target_predictions INTEGER DEFAULT 10,
    target_accuracy DECIMAL(5,2) DEFAULT 90.0,
    target_significance DECIMAL(4,3) DEFAULT 0.95,
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'paused', 'failed')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Results
    completed_predictions INTEGER DEFAULT 0,
    current_accuracy DECIMAL(5,2),
    confidence_interval DECIMAL(4,3),
    statistical_significance BOOLEAN DEFAULT FALSE,
    
    -- Insights
    insights JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link validation runs to specific predictions
CREATE TABLE validation_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_run_id UUID NOT NULL REFERENCES validation_runs(id) ON DELETE CASCADE,
    prediction_id UUID NOT NULL REFERENCES viral_predictions(id) ON DELETE CASCADE,
    
    -- Validation status
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'tracking', 'completed', 'failed')),
    days_elapsed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SYSTEM METRICS AND MONITORING
-- =============================================

-- System performance metrics
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Accuracy metrics
    overall_accuracy DECIMAL(5,2),
    precision_score DECIMAL(6,4),
    recall_score DECIMAL(6,4),
    f1_score DECIMAL(6,4),
    
    -- Error metrics
    mean_absolute_error DECIMAL(8,4),
    root_mean_square_error DECIMAL(8,4),
    
    -- Model performance
    confidence_calibration DECIMAL(6,4),
    prediction_consistency DECIMAL(6,4),
    cross_platform_variance DECIMAL(6,4),
    
    -- Volume metrics
    predictions_made INTEGER,
    correct_predictions INTEGER,
    false_positives INTEGER,
    false_negatives INTEGER,
    
    -- Time period
    metric_date DATE NOT NULL,
    metric_period VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_system_metrics_date UNIQUE (metric_date, metric_period)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Video table indexes
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_creator ON videos(creator_username);
CREATE INDEX idx_videos_status ON videos(processing_status);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_platform_id ON videos(platform, platform_video_id);

-- Video features indexes
CREATE INDEX idx_video_features_video_id ON video_features(video_id);
CREATE INDEX idx_video_features_vector ON video_features USING ivfflat (feature_vector vector_cosine_ops);

-- Video metrics indexes
CREATE INDEX idx_video_metrics_video_id ON video_metrics(video_id);
CREATE INDEX idx_video_metrics_date ON video_metrics(metrics_date);
CREATE INDEX idx_video_metrics_views ON video_metrics(views_count);

-- Viral predictions indexes
CREATE INDEX idx_viral_predictions_video_id ON viral_predictions(video_id);
CREATE INDEX idx_viral_predictions_probability ON viral_predictions(viral_probability);
CREATE INDEX idx_viral_predictions_date ON viral_predictions(prediction_date);
CREATE INDEX idx_viral_predictions_model ON viral_predictions(model_version);

-- Template indexes
CREATE INDEX idx_viral_templates_category ON viral_templates(category);
CREATE INDEX idx_viral_templates_status ON viral_templates(status);
CREATE INDEX idx_viral_templates_success_rate ON viral_templates(success_rate);

-- A/B testing indexes
CREATE INDEX idx_ab_test_runs_status ON ab_test_runs(status);
CREATE INDEX idx_ab_test_variants_test_id ON ab_test_variants(test_run_id);
CREATE INDEX idx_ab_test_results_variant_id ON ab_test_results(variant_id);

-- Validation indexes
CREATE INDEX idx_validation_runs_status ON validation_runs(status);
CREATE INDEX idx_validation_predictions_run_id ON validation_predictions(validation_run_id);

-- System metrics indexes
CREATE INDEX idx_system_metrics_date ON system_metrics(metric_date);
CREATE INDEX idx_system_metrics_accuracy ON system_metrics(overall_accuracy);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_features_updated_at BEFORE UPDATE ON video_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_viral_templates_updated_at BEFORE UPDATE ON viral_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ab_test_runs_updated_at BEFORE UPDATE ON ab_test_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
    views_count BIGINT,
    likes_count BIGINT,
    comments_count BIGINT,
    shares_count BIGINT
) RETURNS DECIMAL(8,4) AS $$
BEGIN
    IF views_count = 0 OR views_count IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND(
        (COALESCE(likes_count, 0) + COALESCE(comments_count, 0) + COALESCE(shares_count, 0))::DECIMAL / views_count,
        4
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE viral_templates 
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = NEW.template_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_template_usage_trigger 
    AFTER INSERT ON template_usage 
    FOR EACH ROW EXECUTE FUNCTION increment_template_usage();

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert some initial viral templates
INSERT INTO viral_templates (name, description, category, success_rate, avg_views, avg_engagement_rate, viral_probability, structure, viral_elements, optimization_tips, platform_optimized, duration_range, hook_timing_seconds, status) VALUES

('Authority Transformation', 'Position yourself as an expert while showing dramatic transformation results', 'business', 89.0, 2400000, 0.087, 0.87, 
'{"hook": "I went from [struggling state] to [success state]", "build": "Here''s exactly what I did differently", "payoff": "The one thing that changed everything", "cta": "Follow for more transformation stories"}',
'[{"element": "Authority Statement", "importance": "critical", "description": "Establish credibility early"}, {"element": "Specific Numbers", "importance": "high", "description": "Use concrete metrics"}, {"element": "Before/After Visual", "importance": "high", "description": "Show clear transformation"}]',
'[{"tip": "Use specific timeframes (30 days, 6 months)", "impact": "high", "difficulty": "easy"}, {"tip": "Include screenshots of results", "impact": "high", "difficulty": "medium"}]',
ARRAY['tiktok', 'instagram'], '15-30s', 3.0, 'HOT'),

('Problem Agitation Solution', 'Identify a pain point, agitate the emotions, then provide the solution', 'tutorial', 84.0, 1900000, 0.076, 0.82,
'{"hook": "Nobody tells you this secret about [topic]", "build": "Here''s what actually happens behind the scenes", "payoff": "That''s why [unexpected outcome]", "cta": "Save this for later"}',
'[{"element": "Relatable Problem", "importance": "critical", "description": "Address common pain point"}, {"element": "Emotional Agitation", "importance": "high", "description": "Amplify frustration"}, {"element": "Clear Solution", "importance": "high", "description": "Provide actionable fix"}]',
'[{"tip": "Start with \"Stop doing this...\"", "impact": "medium", "difficulty": "easy"}, {"tip": "Use urgency language", "impact": "high", "difficulty": "easy"}]',
ARRAY['tiktok', 'youtube'], '20-45s', 2.5, 'HOT'),

('Day in Life Success', 'Showcase aspirational lifestyle through daily routine', 'lifestyle', 76.0, 1200000, 0.081, 0.74,
'{"hook": "Day in my life as [aspirational role]", "build": "Morning routine + key activities", "payoff": "Why this lifestyle is achievable", "cta": "Follow for daily motivation"}',
'[{"element": "Aspirational Content", "importance": "high", "description": "Show desirable lifestyle"}, {"element": "Routine Structure", "importance": "medium", "description": "Clear daily flow"}, {"element": "Achievability", "importance": "high", "description": "Make it seem possible"}]',
'[{"tip": "Show actual workspace/environment", "impact": "high", "difficulty": "medium"}, {"tip": "Include time stamps", "impact": "medium", "difficulty": "easy"}]',
ARRAY['instagram', 'youtube'], '30-60s', 5.0, 'STABLE');

-- Insert initial system metrics
INSERT INTO system_metrics (overall_accuracy, precision_score, recall_score, f1_score, mean_absolute_error, root_mean_square_error, confidence_calibration, prediction_consistency, cross_platform_variance, predictions_made, correct_predictions, false_positives, false_negatives, metric_date) VALUES
(92.3, 0.891, 0.943, 0.915, 17.7, 23.4, 0.912, 0.874, 0.123, 1250, 1154, 89, 96, CURRENT_DATE);

COMMENT ON DATABASE current_database() IS 'Viral Prediction Platform - Complete operational database for viral video prediction and optimization system';