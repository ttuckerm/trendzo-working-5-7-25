-- =====================================================
-- UNIFIED VIRAL PREDICTIONS SCHEMA - PHASE 3.2 CLEANUP
-- =====================================================
-- This script creates a unified viral_predictions table that supports
-- all usage patterns found in the codebase

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA (if table exists)
-- =====================================================

-- Create backup table for existing data
CREATE TABLE IF NOT EXISTS viral_predictions_backup AS 
SELECT * FROM viral_predictions WHERE 1=0;

-- Try to backup existing data (will fail gracefully if table doesn't exist)
DO $$
BEGIN
    INSERT INTO viral_predictions_backup SELECT * FROM viral_predictions;
    RAISE NOTICE 'Existing viral_predictions data backed up to viral_predictions_backup';
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'No existing viral_predictions table found - proceeding with fresh creation';
END $$;

-- =====================================================
-- STEP 2: DROP AND RECREATE WITH UNIFIED SCHEMA
-- =====================================================

-- Drop existing table (safe with CASCADE)
DROP TABLE IF EXISTS viral_predictions CASCADE;

-- Create unified viral_predictions table that supports ALL usage patterns
CREATE TABLE viral_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- LEGACY SUPPORT: Multiple ID patterns found in code
    prediction_id VARCHAR(255) UNIQUE DEFAULT ('pred_' || extract(epoch from now()) || '_' || substr(gen_random_uuid()::text, 1, 8)),
    video_id UUID, -- References videos table when available
    tiktok_id VARCHAR(255), -- Legacy support for direct TikTok ID references
    
    -- USER & SESSION CONTEXT 
    user_id UUID, -- References auth.users when available
    session_id VARCHAR(255),
    
    -- CONTENT DATA
    script_text TEXT,
    caption TEXT, -- Alternative field name found in code
    platform VARCHAR(50) NOT NULL DEFAULT 'tiktok',
    niche VARCHAR(100) DEFAULT 'general',
    hashtags JSONB DEFAULT '[]',
    
    -- CORE PREDICTION RESULTS
    viral_probability DECIMAL(5,4) NOT NULL DEFAULT 0,
    viral_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    confidence_score DECIMAL(5,4) DEFAULT 0,
    confidence_level VARCHAR(20) DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    
    -- PREDICTION BREAKDOWN (Multiple patterns found)
    hook_score DECIMAL(5,2),
    content_score DECIMAL(5,2), 
    timing_score DECIMAL(5,2),
    platform_fit_score DECIMAL(5,2),
    overall_score DECIMAL(5,2), -- Alternative field name
    
    -- PREDICTION ESTIMATES
    predicted_views INTEGER,
    predicted_engagement_rate DECIMAL(5,4),
    predicted_peak_time TIMESTAMP WITH TIME ZONE,
    time_to_peak_hours INTEGER,
    
    -- ACTUAL PERFORMANCE (for validation)
    actual_views INTEGER,
    actual_likes INTEGER,
    actual_comments INTEGER,
    actual_shares INTEGER,
    actual_engagement_rate DECIMAL(5,4),
    actual_viral_score DECIMAL(5,2),
    
    -- VALIDATION & ACCURACY
    accuracy_score DECIMAL(5,2),
    prediction_error DECIMAL(8,4),
    is_correct BOOLEAN,
    validation_status VARCHAR(50) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'tracking', 'validated', 'failed')),
    validation_date TIMESTAMP WITH TIME ZONE,
    
    -- MODEL & METHOD INFO
    model_version VARCHAR(50) NOT NULL DEFAULT 'unified_v1.0',
    prediction_method VARCHAR(100) DEFAULT 'unified_engine',
    model_confidence DECIMAL(5,4),
    
    -- ENHANCED PREDICTION DATA (JSONB for flexibility)
    prediction_factors JSONB DEFAULT '{}', -- Stores all factor breakdowns
    ai_enhancement_applied BOOLEAN DEFAULT false,
    god_mode_analysis JSONB DEFAULT '{}', -- God mode enhancements
    framework_breakdown JSONB DEFAULT '{}', -- Framework analysis results
    psychological_factors JSONB DEFAULT '{}', -- Psychological analysis
    production_quality JSONB DEFAULT '{}', -- Production quality metrics
    cultural_timing JSONB DEFAULT '{}', -- Cultural relevance analysis
    
    -- RECOMMENDATION & INSIGHTS
    recommended_actions TEXT[],
    recommendations JSONB DEFAULT '[]', -- Alternative field format
    risk_factors TEXT[],
    optimization_suggestions JSONB DEFAULT '[]',
    
    -- CONFIDENCE INTERVALS & ESTIMATES
    confidence_lower_bound DECIMAL(5,4),
    confidence_upper_bound DECIMAL(5,4),
    confidence_interval_level DECIMAL(5,4) DEFAULT 0.95,
    
    -- PERFORMANCE ESTIMATES (Multiple ranges found in code)
    peak_views_estimate INTEGER,
    estimated_views_pessimistic INTEGER,
    estimated_views_realistic INTEGER,
    estimated_views_optimistic INTEGER,
    
    -- EXTENDED METRICS
    engagement_rate_predicted DECIMAL(5,4),
    share_velocity_predicted DECIMAL(5,4),
    retention_score_predicted DECIMAL(5,4),
    conversion_rate_predicted DECIMAL(5,4),
    audience_growth_predicted DECIMAL(5,4),
    cultural_impact_predicted DECIMAL(5,4),
    
    -- PROCESSING & REQUEST META
    processing_time_ms INTEGER,
    request_metadata JSONB DEFAULT '{}',
    raw_analysis_data JSONB DEFAULT '{}', -- For storing complete analysis
    
    -- TIMESTAMPS
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE PERFORMANCE INDEXES
-- =====================================================

-- Core lookup indexes
CREATE INDEX IF NOT EXISTS idx_viral_predictions_prediction_id ON viral_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_video_id ON viral_predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_tiktok_id ON viral_predictions(tiktok_id);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_user_id ON viral_predictions(user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_viral_predictions_viral_score ON viral_predictions(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_confidence ON viral_predictions(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_platform ON viral_predictions(platform);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_validation_status ON viral_predictions(validation_status);

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_viral_predictions_created_at ON viral_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_prediction_date ON viral_predictions(prediction_date DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_viral_predictions_platform_score ON viral_predictions(platform, viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_user_recent ON viral_predictions(user_id, created_at DESC);

-- =====================================================
-- STEP 4: CREATE AUTO-UPDATE TRIGGER
-- =====================================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_viral_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_viral_predictions_updated_at ON viral_predictions;
CREATE TRIGGER trigger_update_viral_predictions_updated_at
    BEFORE UPDATE ON viral_predictions
    FOR EACH ROW
    EXECUTE FUNCTION update_viral_predictions_updated_at();

-- =====================================================
-- STEP 5: CREATE VALIDATION VIEW FOR EASY QUERYING
-- =====================================================

-- Create a view that provides cleaned, easy-to-use data
CREATE OR REPLACE VIEW viral_predictions_clean AS
SELECT 
    id,
    prediction_id,
    video_id,
    user_id,
    platform,
    viral_score,
    viral_probability,
    confidence_level,
    predicted_views,
    actual_views,
    accuracy_score,
    validation_status,
    model_version,
    created_at,
    -- Computed fields
    CASE 
        WHEN viral_score >= 85 THEN 'mega-viral'
        WHEN viral_score >= 70 THEN 'hyper-viral' 
        WHEN viral_score >= 55 THEN 'viral'
        WHEN viral_score >= 40 THEN 'trending'
        ELSE 'normal'
    END as viral_category,
    CASE
        WHEN confidence_score >= 0.8 THEN 'high'
        WHEN confidence_score >= 0.6 THEN 'medium'
        ELSE 'low'
    END as confidence_level_computed
FROM viral_predictions;

-- =====================================================
-- STEP 6: INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a few sample records to test the unified schema
INSERT INTO viral_predictions (
    script_text,
    platform,
    viral_probability,
    viral_score,
    confidence_score,
    hook_score,
    content_score,
    predicted_views,
    model_version
) VALUES 
(
    'POV: You just discovered the secret that millionaires don''t want you to know...',
    'tiktok',
    0.8500,
    85.00,
    0.92,
    88.5,
    82.3,
    2500000,
    'unified_v1.0'
),
(
    'This simple morning routine changed my life in 30 days...',
    'tiktok', 
    0.7200,
    72.00,
    0.88,
    75.2,
    70.8,
    1200000,
    'unified_v1.0'
),
(
    'Before vs After: 6 months of consistency...',
    'instagram',
    0.6800,
    68.00,
    0.85,
    70.1,
    66.9,
    800000,
    'unified_v1.0'
);

-- =====================================================
-- COMPLETION REPORT
-- =====================================================

-- Report the results
SELECT 
    'UNIFIED VIRAL_PREDICTIONS SCHEMA DEPLOYED!' as status,
    COUNT(*) as sample_records_created,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM viral_predictions;

-- Show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'viral_predictions' 
ORDER BY ordinal_position; 