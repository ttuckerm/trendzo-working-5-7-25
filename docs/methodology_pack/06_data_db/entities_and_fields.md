# Database Entities and Fields

## Overview

This document defines the complete database schema for the Trendzo viral prediction platform, including all entities, relationships, and field specifications that support the 13 core objectives and BMAD methodology.

## Core Entity Architecture

### User Management Entities

#### Users Table
```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile Information
    full_name VARCHAR(255),
    profile_image_url VARCHAR(500),
    bio TEXT,
    niche VARCHAR(100),
    experience_level user_experience_level DEFAULT 'beginner',
    
    -- Platform Preferences
    platform_preferences JSONB DEFAULT '{}',
    content_goals TEXT[],
    target_audience JSONB DEFAULT '{}',
    
    -- Account Status
    account_status user_status DEFAULT 'active',
    subscription_tier subscription_tier DEFAULT 'free',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Tracking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Analytics
    total_credits_used INTEGER DEFAULT 0,
    successful_predictions INTEGER DEFAULT 0,
    viral_content_created INTEGER DEFAULT 0
);

-- Enums
CREATE TYPE user_experience_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted', 'pending_verification');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
```

#### User Sessions Table
```sql
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    
    -- Session Data
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_fingerprint VARCHAR(255),
    
    -- Session Context
    ip_address INET,
    user_agent TEXT,
    platform VARCHAR(50),
    device_type VARCHAR(50),
    location_data JSONB,
    
    -- Session Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
```

### Template System Entities

#### Templates Table
```sql
CREATE TABLE templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL,
    template_slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Template Classification
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    niche VARCHAR(100),
    difficulty_level template_difficulty DEFAULT 'beginner',
    
    -- Template Structure
    template_structure JSONB NOT NULL,
    beat_structure JSONB NOT NULL,
    timing_requirements JSONB NOT NULL,
    
    -- Platform Optimization
    platform_compatibility TEXT[] NOT NULL,
    platform_specific_data JSONB DEFAULT '{}',
    
    -- Performance Metrics
    viral_score INTEGER CHECK (viral_score >= 0 AND viral_score <= 100),
    success_rate DECIMAL(5,2) CHECK (success_rate >= 0 AND success_rate <= 100),
    usage_count INTEGER DEFAULT 0,
    approval_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Template Status
    status template_status DEFAULT 'draft',
    visibility template_visibility DEFAULT 'public',
    
    -- Viral Intelligence
    viral_patterns JSONB DEFAULT '{}',
    trend_alignment JSONB DEFAULT '{}',
    algorithm_optimization JSONB DEFAULT '{}',
    
    -- Metadata
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Version Control
    version INTEGER DEFAULT 1,
    parent_template_id UUID REFERENCES templates(template_id)
);

-- Enums
CREATE TYPE template_difficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE template_status AS ENUM ('draft', 'review', 'published', 'archived', 'deprecated');
CREATE TYPE template_visibility AS ENUM ('public', 'private', 'premium', 'beta');
```

#### Template Variants Table
```sql
CREATE TABLE template_variants (
    variant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(template_id) ON DELETE CASCADE,
    
    -- Variant Configuration
    variant_name VARCHAR(255) NOT NULL,
    variant_type variant_type NOT NULL,
    platform_target VARCHAR(50),
    
    -- Variant Data
    variant_configuration JSONB NOT NULL,
    platform_adaptations JSONB DEFAULT '{}',
    surface_optimizations JSONB DEFAULT '{}',
    
    -- Performance
    performance_metrics JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TYPE variant_type AS ENUM ('platform_specific', 'niche_specific', 'surface_specific', 'experience_level');
```

### Content & Prediction Entities

#### Content Items Table
```sql
CREATE TABLE content_items (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    template_id UUID REFERENCES templates(template_id),
    
    -- Content Metadata
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    platform VARCHAR(50) NOT NULL,
    
    -- Content Data
    content_url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    
    -- Content Analysis
    content_features JSONB DEFAULT '{}',
    extracted_text TEXT,
    audio_features JSONB DEFAULT '{}',
    visual_features JSONB DEFAULT '{}',
    
    -- Performance Data
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Viral Status
    is_viral BOOLEAN DEFAULT FALSE,
    viral_threshold_reached_at TIMESTAMP WITH TIME ZONE,
    peak_performance_date DATE,
    viral_coefficient DECIMAL(8,4) DEFAULT 0,
    
    -- Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    analyzed_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE content_type AS ENUM ('video', 'image', 'audio', 'text', 'mixed_media');
```

#### Viral Predictions Table
```sql
CREATE TABLE viral_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content_items(content_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    
    -- Prediction Data
    viral_probability DECIMAL(5,4) NOT NULL CHECK (viral_probability >= 0 AND viral_probability <= 1),
    confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    predicted_metrics JSONB NOT NULL,
    
    -- Model Information
    model_version VARCHAR(50) NOT NULL,
    model_features JSONB NOT NULL,
    prediction_reasoning JSONB DEFAULT '{}',
    
    -- Platform Specific Predictions
    platform_predictions JSONB DEFAULT '{}',
    cross_platform_potential DECIMAL(5,4) DEFAULT 0,
    
    -- Validation Data
    actual_outcome JSONB,
    prediction_accuracy DECIMAL(5,4),
    error_magnitude DECIMAL(8,4),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    credits_consumed INTEGER DEFAULT 1
);
```

### Analytics & Learning Entities

#### User Analytics Table
```sql
CREATE TABLE user_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Usage Metrics
    sessions_count INTEGER DEFAULT 0,
    total_session_duration_minutes INTEGER DEFAULT 0,
    templates_viewed INTEGER DEFAULT 0,
    templates_used INTEGER DEFAULT 0,
    predictions_made INTEGER DEFAULT 0,
    content_analyzed INTEGER DEFAULT 0,
    
    -- Feature Usage
    feature_usage JSONB DEFAULT '{}',
    page_views JSONB DEFAULT '{}',
    api_calls_made INTEGER DEFAULT 0,
    
    -- Performance Metrics
    successful_predictions INTEGER DEFAULT 0,
    viral_content_created INTEGER DEFAULT 0,
    credits_consumed INTEGER DEFAULT 0,
    
    -- Engagement Metrics
    feedback_provided INTEGER DEFAULT 0,
    templates_shared INTEGER DEFAULT 0,
    community_interactions INTEGER DEFAULT 0,
    
    UNIQUE(user_id, date)
);
```

#### Viral Patterns Table
```sql
CREATE TABLE viral_patterns (
    pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type pattern_type NOT NULL,
    
    -- Pattern Definition
    pattern_structure JSONB NOT NULL,
    pattern_features JSONB NOT NULL,
    recognition_criteria JSONB NOT NULL,
    
    -- Platform Data
    platform_effectiveness JSONB DEFAULT '{}',
    platform_specific_adaptations JSONB DEFAULT '{}',
    
    -- Performance Data
    success_rate DECIMAL(5,2) NOT NULL,
    usage_frequency INTEGER DEFAULT 0,
    trend_status trend_status DEFAULT 'emerging',
    
    -- Pattern Evolution
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated_at TIMESTAMP WITH TIME ZONE,
    pattern_lifecycle_stage VARCHAR(50) DEFAULT 'emerging',
    
    -- Source Data
    source_content_ids UUID[],
    discovery_method VARCHAR(100),
    confidence_score DECIMAL(5,4) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE pattern_type AS ENUM ('visual', 'audio', 'timing', 'narrative', 'interactive', 'hybrid');
CREATE TYPE trend_status AS ENUM ('emerging', 'trending', 'peak', 'declining', 'stable', 'dormant');
```

### System & Process Entities

#### API Usage Logs Table
```sql
CREATE TABLE api_usage_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    session_id UUID REFERENCES user_sessions(session_id),
    
    -- Request Data
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Response Data
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    response_size_bytes INTEGER,
    
    -- Usage Context
    api_key_used VARCHAR(255),
    rate_limit_remaining INTEGER,
    credits_consumed INTEGER DEFAULT 0,
    
    -- Request Details
    request_payload JSONB,
    response_payload JSONB,
    error_details JSONB,
    
    -- Analytics
    geographic_region VARCHAR(100),
    user_agent TEXT,
    ip_address INET
);
```

#### System Events Table
```sql
CREATE TABLE system_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    
    -- Event Context
    user_id UUID REFERENCES users(user_id),
    session_id UUID REFERENCES user_sessions(session_id),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    
    -- Event Data
    event_data JSONB NOT NULL,
    event_metadata JSONB DEFAULT '{}',
    
    -- System Context
    system_version VARCHAR(50),
    feature_flags TEXT[],
    experiment_groups TEXT[],
    
    -- Timing
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_time_ms INTEGER
);
```

## Relationship Indexes and Constraints

### Primary Indexes
```sql
-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Template indexes
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_niche ON templates(niche);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_viral_score ON templates(viral_score DESC);
CREATE INDEX idx_templates_success_rate ON templates(success_rate DESC);
CREATE INDEX idx_templates_platform_compatibility ON templates USING GIN(platform_compatibility);

-- Content indexes
CREATE INDEX idx_content_items_user_id ON content_items(user_id);
CREATE INDEX idx_content_items_template_id ON content_items(template_id);
CREATE INDEX idx_content_items_platform ON content_items(platform);
CREATE INDEX idx_content_items_is_viral ON content_items(is_viral);
CREATE INDEX idx_content_items_created_at ON content_items(created_at);

-- Prediction indexes
CREATE INDEX idx_viral_predictions_content_id ON viral_predictions(content_id);
CREATE INDEX idx_viral_predictions_user_id ON viral_predictions(user_id);
CREATE INDEX idx_viral_predictions_viral_probability ON viral_predictions(viral_probability DESC);
CREATE INDEX idx_viral_predictions_created_at ON viral_predictions(created_at);

-- Analytics indexes
CREATE INDEX idx_user_analytics_user_date ON user_analytics(user_id, date);
CREATE INDEX idx_user_analytics_date ON user_analytics(date);

-- System indexes
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_timestamp ON api_usage_logs(request_timestamp);
CREATE INDEX idx_system_events_type_category ON system_events(event_type, event_category);
CREATE INDEX idx_system_events_timestamp ON system_events(event_timestamp);
```

### JSONB Indexes for Performance
```sql
-- Template structure indexes
CREATE INDEX idx_templates_structure_beats ON templates USING GIN((template_structure->'beats'));
CREATE INDEX idx_templates_viral_patterns ON templates USING GIN(viral_patterns);

-- Content features indexes
CREATE INDEX idx_content_features ON content_items USING GIN(content_features);
CREATE INDEX idx_audio_features ON content_items USING GIN(audio_features);
CREATE INDEX idx_visual_features ON content_items USING GIN(visual_features);

-- Prediction data indexes
CREATE INDEX idx_predicted_metrics ON viral_predictions USING GIN(predicted_metrics);
CREATE INDEX idx_platform_predictions ON viral_predictions USING GIN(platform_predictions);

-- Analytics data indexes
CREATE INDEX idx_feature_usage ON user_analytics USING GIN(feature_usage);
CREATE INDEX idx_page_views ON user_analytics USING GIN(page_views);

-- Event data indexes
CREATE INDEX idx_system_events_data ON system_events USING GIN(event_data);
```

## Data Integrity Constraints

### Business Rule Constraints
```sql
-- Ensure viral score is consistent with success metrics
ALTER TABLE templates ADD CONSTRAINT check_viral_score_consistency 
    CHECK (
        (viral_score IS NULL) OR 
        (viral_score >= 0 AND viral_score <= 100 AND success_rate IS NOT NULL)
    );

-- Ensure content items have required fields based on type
ALTER TABLE content_items ADD CONSTRAINT check_content_type_requirements
    CHECK (
        (content_type = 'video' AND duration_seconds > 0) OR
        (content_type = 'image' AND duration_seconds IS NULL) OR
        (content_type = 'audio' AND duration_seconds > 0) OR
        (content_type = 'text' AND content_url IS NOT NULL)
    );

-- Ensure predictions have reasonable confidence scores
ALTER TABLE viral_predictions ADD CONSTRAINT check_confidence_viral_correlation
    CHECK (
        (confidence_score >= 0.1) AND
        (confidence_score <= 1.0) AND
        (viral_probability >= 0.0 AND viral_probability <= 1.0)
    );

-- Ensure user analytics data consistency
ALTER TABLE user_analytics ADD CONSTRAINT check_usage_consistency
    CHECK (
        (templates_used <= templates_viewed) AND
        (successful_predictions <= predictions_made) AND
        (credits_consumed >= 0)
    );
```

### Foreign Key Constraints
```sql
-- User session constraints
ALTER TABLE user_sessions ADD CONSTRAINT fk_user_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Template variant constraints
ALTER TABLE template_variants ADD CONSTRAINT fk_template_variants_template
    FOREIGN KEY (template_id) REFERENCES templates(template_id) ON DELETE CASCADE;

-- Content prediction constraints
ALTER TABLE viral_predictions ADD CONSTRAINT fk_predictions_content
    FOREIGN KEY (content_id) REFERENCES content_items(content_id) ON DELETE CASCADE;
ALTER TABLE viral_predictions ADD CONSTRAINT fk_predictions_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Analytics constraints
ALTER TABLE user_analytics ADD CONSTRAINT fk_user_analytics_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

## Database Functions and Triggers

### Automatic Timestamp Updates
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Viral Status Detection
```sql
-- Function to automatically detect viral status
CREATE OR REPLACE FUNCTION check_viral_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Define viral thresholds based on platform
    IF NEW.platform = 'tiktok' AND NEW.view_count >= 100000 THEN
        NEW.is_viral = TRUE;
        NEW.viral_threshold_reached_at = COALESCE(NEW.viral_threshold_reached_at, NOW());
    ELSIF NEW.platform = 'instagram' AND NEW.view_count >= 50000 THEN
        NEW.is_viral = TRUE;
        NEW.viral_threshold_reached_at = COALESCE(NEW.viral_threshold_reached_at, NOW());
    ELSIF NEW.platform = 'youtube' AND NEW.view_count >= 10000 THEN
        NEW.is_viral = TRUE;
        NEW.viral_threshold_reached_at = COALESCE(NEW.viral_threshold_reached_at, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_viral_status_check BEFORE INSERT OR UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION check_viral_status();
```

### Template Success Rate Calculation
```sql
-- Function to calculate template success rate
CREATE OR REPLACE FUNCTION calculate_template_success_rate(template_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_usage INTEGER;
    viral_count INTEGER;
    success_rate DECIMAL;
BEGIN
    SELECT COUNT(*) INTO total_usage
    FROM content_items 
    WHERE template_id = template_uuid AND published_at IS NOT NULL;
    
    IF total_usage = 0 THEN
        RETURN 0;
    END IF;
    
    SELECT COUNT(*) INTO viral_count
    FROM content_items 
    WHERE template_id = template_uuid AND is_viral = TRUE;
    
    success_rate := (viral_count::DECIMAL / total_usage::DECIMAL) * 100;
    
    UPDATE templates 
    SET success_rate = success_rate, usage_count = total_usage
    WHERE template_id = template_uuid;
    
    RETURN success_rate;
END;
$$ LANGUAGE plpgsql;
```

---

*This database schema provides the foundation for all 13 objectives, supporting user management, template systems, viral prediction, analytics, and system intelligence through a comprehensive, performance-optimized data model.*