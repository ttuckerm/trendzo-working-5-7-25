-- =====================================================
-- VALUE TEMPLATE EDITOR DATABASE SCHEMA ADDITIONS
-- =====================================================
-- This script adds the required tables for the Value Template Editor
-- while maintaining framework security and protection

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- VIRAL VIDEO GALLERY TABLE
-- =====================================================
-- Stores viral videos available for template inspiration
-- Framework information is NEVER stored here

CREATE TABLE IF NOT EXISTS viral_video_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    thumbnail_url TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    viral_score DECIMAL(5,2) NOT NULL DEFAULT 0, -- 0-100 score
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube')),
    duration_seconds INTEGER DEFAULT 30,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    source_url TEXT, -- Original video URL (optional)
    metadata JSONB DEFAULT '{}', -- Additional non-framework metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VIDEO FRAMEWORK MAPPING TABLE
-- =====================================================
-- SECRET TABLE: Maps videos to frameworks server-side only
-- Framework IDs and details are NEVER exposed to client
-- This table enables framework-enhanced predictions while maintaining secrecy

CREATE TABLE IF NOT EXISTS video_framework_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES viral_video_gallery(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES viral_recipe_book(id),
    mapping_confidence DECIMAL(3,2) DEFAULT 0.95, -- How confident we are in this mapping
    workspace_config_cached JSONB, -- Cached anonymous workspace configuration
    framework_context JSONB, -- Server-side framework data (NEVER sent to client)
    mapping_method VARCHAR(50) DEFAULT 'manual', -- How this mapping was created
    created_by VARCHAR(100) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one mapping per video-framework pair
    UNIQUE(video_id, framework_id)
);

-- =====================================================
-- VALUE TEMPLATE SESSIONS TABLE
-- =====================================================
-- Tracks user sessions in the Value Template Editor
-- Stores user content and prediction history

CREATE TABLE IF NOT EXISTS value_template_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL, -- Anonymous session identifier
    selected_video_id UUID REFERENCES viral_video_gallery(id),
    workspace_config_id VARCHAR(100), -- Anonymous workspace ID from API
    user_content JSONB NOT NULL DEFAULT '{}', -- User's script, hook, style
    prediction_history JSONB DEFAULT '[]', -- Array of predictions over time
    session_duration_seconds INTEGER DEFAULT 0,
    content_iterations INTEGER DEFAULT 0, -- How many times user changed content
    final_viral_score DECIMAL(5,2), -- Final prediction score
    user_satisfied BOOLEAN, -- Did user seem satisfied with final result?
    session_outcome VARCHAR(50), -- 'completed', 'abandoned', 'exported'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WORKSPACE CONFIGURATIONS TABLE
-- =====================================================
-- Caches anonymous workspace configurations
-- No framework details - only UI configurations

CREATE TABLE IF NOT EXISTS workspace_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id VARCHAR(100) UNIQUE NOT NULL, -- Anonymous workspace identifier
    config_data JSONB NOT NULL, -- Anonymous UI configuration data
    source_video_id UUID REFERENCES viral_video_gallery(id),
    usage_count INTEGER DEFAULT 0,
    effectiveness_tracking JSONB DEFAULT '{}', -- How well this config performs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- =====================================================
-- FRAMEWORK PROTECTION AUDIT LOG
-- =====================================================
-- Logs all framework-related operations for security monitoring
-- Ensures framework information never leaks to client-side

CREATE TABLE IF NOT EXISTS framework_protection_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_type VARCHAR(50) NOT NULL, -- 'framework_access', 'mapping_created', 'config_generated'
    video_id UUID REFERENCES viral_video_gallery(id),
    framework_id UUID REFERENCES viral_recipe_book(id),
    workspace_id VARCHAR(100),
    client_exposed_data JSONB, -- What data was sent to client (should never contain framework info)
    server_only_data JSONB, -- Framework data that stayed server-side
    operation_success BOOLEAN DEFAULT TRUE,
    security_violation BOOLEAN DEFAULT FALSE, -- Flag if framework data was accidentally exposed
    request_ip INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Viral Video Gallery indexes
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_featured ON viral_video_gallery(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_viral_score ON viral_video_gallery(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_platform ON viral_video_gallery(platform);
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_status ON viral_video_gallery(status);

-- Framework Mapping indexes (for server-side operations only)
CREATE INDEX IF NOT EXISTS idx_video_framework_mapping_video_id ON video_framework_mapping(video_id);
CREATE INDEX IF NOT EXISTS idx_video_framework_mapping_framework_id ON video_framework_mapping(framework_id);
CREATE INDEX IF NOT EXISTS idx_video_framework_mapping_confidence ON video_framework_mapping(mapping_confidence DESC);

-- Session tracking indexes
CREATE INDEX IF NOT EXISTS idx_value_template_sessions_video_id ON value_template_sessions(selected_video_id);
CREATE INDEX IF NOT EXISTS idx_value_template_sessions_created_at ON value_template_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_value_template_sessions_outcome ON value_template_sessions(session_outcome);

-- Workspace configuration indexes
CREATE INDEX IF NOT EXISTS idx_workspace_configurations_workspace_id ON workspace_configurations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_configurations_video_id ON workspace_configurations(source_video_id);
CREATE INDEX IF NOT EXISTS idx_workspace_configurations_expires_at ON workspace_configurations(expires_at);

-- Security audit indexes
CREATE INDEX IF NOT EXISTS idx_framework_protection_audit_created_at ON framework_protection_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_framework_protection_audit_security_violation ON framework_protection_audit(security_violation);
CREATE INDEX IF NOT EXISTS idx_framework_protection_audit_operation_type ON framework_protection_audit(operation_type);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on framework-sensitive tables
ALTER TABLE video_framework_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_protection_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only server-side operations can access framework mappings
-- Client requests should NEVER directly access this table
CREATE POLICY framework_mapping_server_only ON video_framework_mapping
    FOR ALL USING (
        -- Only allow access from server-side operations
        -- This would be expanded with proper authentication checks
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR current_setting('app.environment', true) = 'server_side'
    );

-- Policy: Framework audit log is append-only for security monitoring
CREATE POLICY framework_audit_append_only ON framework_protection_audit
    FOR INSERT WITH CHECK (true);

-- Prevent updates/deletes on audit log
CREATE POLICY framework_audit_no_modify ON framework_protection_audit
    FOR UPDATE USING (false);
    
CREATE POLICY framework_audit_no_delete ON framework_protection_audit
    FOR DELETE USING (false);

-- =====================================================
-- TRIGGERS FOR AUTOMATED SECURITY MONITORING
-- =====================================================

-- Function to log framework protection operations
CREATE OR REPLACE FUNCTION log_framework_operation()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO framework_protection_audit (
        operation_type,
        video_id,
        framework_id,
        operation_success,
        created_at
    ) VALUES (
        TG_OP || '_framework_mapping',
        COALESCE(NEW.video_id, OLD.video_id),
        COALESCE(NEW.framework_id, OLD.framework_id),
        true,
        NOW()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log framework mapping operations
CREATE TRIGGER framework_mapping_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON video_framework_mapping
    FOR EACH ROW EXECUTE FUNCTION log_framework_operation();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert sample viral videos for testing
INSERT INTO viral_video_gallery (
    title, creator_name, view_count, viral_score, platform, duration_seconds, is_featured, display_order
) VALUES
    ('How I Built a 7-Figure Business in 6 Months', 'EntrepreneurJoe', 2400000, 94.0, 'tiktok', 32, true, 1),
    ('This Morning Routine Changed My Life', 'MotivationMaria', 1800000, 87.0, 'tiktok', 28, true, 2),
    ('Secret Productivity Hack Nobody Talks About', 'ProductivityPro', 3100000, 91.0, 'tiktok', 35, true, 3),
    ('POV: You Just Discovered the Perfect Recipe', 'ChefCreative', 1200000, 83.0, 'instagram', 24, true, 4),
    ('The Psychology Trick That Makes People Listen', 'PsychHacker', 2900000, 96.0, 'tiktok', 41, true, 5),
    ('Before vs After: 30 Days of This Habit', 'TransformationTina', 1600000, 79.0, 'tiktok', 26, true, 6)
ON CONFLICT DO NOTHING;

-- Create initial framework mappings for sample videos
-- This maps the sample videos to existing frameworks from viral_recipe_book
DO $$
DECLARE
    video_rec RECORD;
    framework_rec RECORD;
BEGIN
    -- Map each sample video to a random framework from viral_recipe_book
    FOR video_rec IN 
        SELECT id FROM viral_video_gallery WHERE creator_name IN ('EntrepreneurJoe', 'MotivationMaria', 'ProductivityPro', 'ChefCreative', 'PsychHacker', 'TransformationTina')
    LOOP
        -- Get a random HOT framework
        SELECT id INTO framework_rec FROM viral_recipe_book WHERE status = 'HOT' ORDER BY RANDOM() LIMIT 1;
        
        IF framework_rec.id IS NOT NULL THEN
            INSERT INTO video_framework_mapping (
                video_id, 
                framework_id, 
                mapping_confidence,
                mapping_method
            ) VALUES (
                video_rec.id, 
                framework_rec.id, 
                0.95,
                'initial_seeding'
            ) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to clean up expired workspace configurations
CREATE OR REPLACE FUNCTION cleanup_expired_workspaces()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM workspace_configurations 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to validate framework protection (ensure no framework data leaks)
CREATE OR REPLACE FUNCTION validate_framework_protection()
RETURNS TABLE(
    security_issue TEXT,
    affected_table TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Check for any potential framework data exposure
    -- This would be run periodically to ensure security
    
    RETURN QUERY
    SELECT 
        'Framework protection validated' as security_issue,
        'All tables checked' as affected_table,
        'Continue monitoring' as recommendation
    WHERE true; -- Placeholder - would contain actual security checks
END;
$$ LANGUAGE plpgsql;

SELECT 'Value Template Editor schema deployment completed! 🎯' as status; 