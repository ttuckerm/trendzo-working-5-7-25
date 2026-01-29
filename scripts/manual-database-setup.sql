-- =====================================================
-- VIRAL PREDICTION SYSTEM - SIMPLIFIED MANUAL SETUP
-- =====================================================
-- 
-- Simplified version for manual deployment via Supabase Dashboard
-- Copy and paste this entire script into Supabase SQL Editor
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE VIRAL PREDICTION TABLES
-- =====================================================

-- Main prediction records
CREATE TABLE IF NOT EXISTS viral_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID,
    script_text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    viral_probability DECIMAL(5,4) NOT NULL,
    viral_score DECIMAL(5,2) NOT NULL,
    confidence_level DECIMAL(5,4) NOT NULL,
    prediction_method VARCHAR(100) DEFAULT 'script_intelligence_enhanced',
    ai_enhancement_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional prediction metadata
    engagement_rate_predicted DECIMAL(5,4),
    share_velocity_predicted DECIMAL(5,4),
    peak_views_estimate INTEGER,
    time_to_peak_hours INTEGER,
    retention_score_predicted DECIMAL(5,4),
    conversion_rate_predicted DECIMAL(5,4),
    audience_growth_predicted DECIMAL(5,4),
    cultural_impact_predicted DECIMAL(5,4),
    
    -- Confidence intervals
    confidence_lower_bound DECIMAL(5,4),
    confidence_upper_bound DECIMAL(5,4),
    confidence_interval_level DECIMAL(5,4) DEFAULT 0.95,
    
    -- Performance tracking
    session_id VARCHAR(255),
    request_metadata JSONB,
    processing_time_ms INTEGER
);

-- Script intelligence memory bank
CREATE TABLE IF NOT EXISTS script_intelligence_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_id VARCHAR(255) UNIQUE NOT NULL,
    script_content TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    viral_probability DECIMAL(5,4) NOT NULL,
    performance_metrics JSONB NOT NULL,
    enhancement_applied BOOLEAN DEFAULT false,
    learning_value DECIMAL(5,4) DEFAULT 0.5,
    retention_priority VARCHAR(20) DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- Script analysis data
    emotional_triggers JSONB,
    hook_effectiveness DECIMAL(5,4),
    engagement_patterns JSONB,
    viral_markers JSONB,
    cultural_relevance DECIMAL(5,4),
    
    -- Cross-references and correlations
    related_memories JSONB DEFAULT '[]'::jsonb,
    correlation_score DECIMAL(5,4) DEFAULT 0.0
);

-- Script DNA sequences
CREATE TABLE IF NOT EXISTS script_dna_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id VARCHAR(255) UNIQUE NOT NULL,
    script_text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    dna_structure JSONB NOT NULL,
    atomic_elements JSONB NOT NULL,
    viral_markers JSONB NOT NULL,
    cultural_context JSONB NOT NULL,
    performance_metrics JSONB NOT NULL,
    mutation_events JSONB DEFAULT '[]'::jsonb,
    evolution_tracking JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- DNA quality metrics
    sequence_completeness DECIMAL(5,4) DEFAULT 1.0,
    complexity_score DECIMAL(5,4),
    uniqueness_score DECIMAL(5,4),
    viral_potential DECIMAL(5,4),
    
    -- Cross-references
    related_sequences JSONB DEFAULT '[]'::jsonb,
    evolution_lineage VARCHAR(255)
);

-- Prediction validations
CREATE TABLE IF NOT EXISTS prediction_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id VARCHAR(255) UNIQUE NOT NULL,
    prediction_id VARCHAR(255),
    validation_status VARCHAR(20) DEFAULT 'pending',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Predicted metrics
    predicted_viral_probability DECIMAL(5,4),
    predicted_viral_score DECIMAL(5,2),
    predicted_engagement_rate DECIMAL(5,4),
    predicted_share_velocity DECIMAL(5,4),
    predicted_peak_views INTEGER,
    
    -- Actual metrics
    actual_viral_probability DECIMAL(5,4),
    actual_viral_score DECIMAL(5,2),
    actual_engagement_rate DECIMAL(5,4),
    actual_share_velocity DECIMAL(5,4),
    actual_peak_views INTEGER,
    
    -- Validation results
    accuracy_score DECIMAL(5,4),
    prediction_confidence DECIMAL(5,4),
    time_to_validation DECIMAL(8,2),
    data_quality_score DECIMAL(5,4),
    external_factors JSONB DEFAULT '[]'::jsonb,
    
    -- Learning feedback
    accuracy_breakdown JSONB,
    learning_feedback JSONB,
    improvement_recommendations JSONB
);

-- Omniscient knowledge records
CREATE TABLE IF NOT EXISTS omniscient_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id VARCHAR(255) UNIQUE NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    source_module VARCHAR(100) NOT NULL,
    data_payload JSONB NOT NULL,
    knowledge_level VARCHAR(20) NOT NULL DEFAULT 'surface',
    retention_priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    cross_references JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    -- Knowledge metadata
    user_id UUID,
    session_id VARCHAR(255),
    platform VARCHAR(50),
    niche VARCHAR(100),
    performance_score DECIMAL(5,4) DEFAULT 0,
    learning_value DECIMAL(5,4) DEFAULT 0.5,
    correlation_strength DECIMAL(5,4) DEFAULT 0.5,
    novelty_score DECIMAL(5,4) DEFAULT 0.5,
    strategic_importance DECIMAL(5,4) DEFAULT 0.5
);

-- Knowledge graph nodes
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id VARCHAR(255) UNIQUE NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    strength DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    discovery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reinforced TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reinforcement_count INTEGER DEFAULT 1
);

-- Knowledge graph connections
CREATE TABLE IF NOT EXISTS knowledge_graph_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    source_node_id VARCHAR(255),
    target_node_id VARCHAR(255),
    connection_type VARCHAR(50) NOT NULL,
    strength DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    bidirectional BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Script optimizations
CREATE TABLE IF NOT EXISTS script_optimizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    optimization_id VARCHAR(255) UNIQUE NOT NULL,
    original_script TEXT NOT NULL,
    optimized_script TEXT NOT NULL,
    optimization_method VARCHAR(100) NOT NULL,
    target_platform VARCHAR(50) NOT NULL,
    target_niche VARCHAR(100) NOT NULL,
    optimization_goals JSONB NOT NULL,
    performance_improvement DECIMAL(5,4),
    confidence_score DECIMAL(5,4),
    optimization_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optimization details
    applied_techniques JSONB,
    before_metrics JSONB,
    after_metrics JSONB,
    improvement_breakdown JSONB,
    
    -- Performance tracking
    processing_time_ms INTEGER,
    optimization_quality DECIMAL(5,4),
    user_acceptance BOOLEAN,
    real_world_validation BOOLEAN DEFAULT false
);

-- Template analysis records
CREATE TABLE IF NOT EXISTS template_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id VARCHAR(255) UNIQUE NOT NULL,
    template_id VARCHAR(255),
    template_content TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
    
    -- Analysis results
    quality_score DECIMAL(5,4),
    viral_potential DECIMAL(5,4),
    engagement_prediction DECIMAL(5,4),
    improvement_opportunities JSONB,
    competitive_analysis JSONB,
    performance_prediction JSONB,
    optimization_recommendations JSONB,
    
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_duration_ms INTEGER,
    
    -- Template metadata
    template_category VARCHAR(100),
    content_type VARCHAR(50),
    target_audience JSONB,
    business_objectives JSONB
);

-- A/B test configurations
CREATE TABLE IF NOT EXISTS ab_test_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id VARCHAR(255) UNIQUE NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_description TEXT,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    test_type VARCHAR(50) NOT NULL DEFAULT 'script_comparison',
    
    -- Test setup
    control_variant JSONB NOT NULL,
    test_variants JSONB NOT NULL,
    success_metrics JSONB NOT NULL,
    sample_size_target INTEGER,
    confidence_level DECIMAL(5,4) DEFAULT 0.95,
    minimum_effect_size DECIMAL(5,4) DEFAULT 0.05,
    
    -- Test status
    test_status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Test metadata
    creator_id UUID,
    expected_duration_days INTEGER,
    business_impact_priority VARCHAR(20) DEFAULT 'medium'
);

-- A/B test results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id VARCHAR(255) UNIQUE NOT NULL,
    test_id VARCHAR(255),
    variant_id VARCHAR(255) NOT NULL,
    
    -- Performance metrics
    sample_size INTEGER NOT NULL,
    conversion_rate DECIMAL(5,4),
    engagement_rate DECIMAL(5,4),
    viral_score DECIMAL(5,2),
    retention_rate DECIMAL(5,4),
    
    -- Statistical analysis
    statistical_significance DECIMAL(5,4),
    confidence_interval_lower DECIMAL(5,4),
    confidence_interval_upper DECIMAL(5,4),
    p_value DECIMAL(10,8),
    effect_size DECIMAL(5,4),
    
    -- Results metadata
    measurement_period_start TIMESTAMP WITH TIME ZONE,
    measurement_period_end TIMESTAMP WITH TIME ZONE,
    data_quality_score DECIMAL(5,4),
    external_factors JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System performance metrics
CREATE TABLE IF NOT EXISTS system_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id VARCHAR(255) UNIQUE NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    measurement_unit VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metric context
    platform VARCHAR(50),
    niche VARCHAR(100),
    user_context JSONB,
    system_load DECIMAL(5,4)
);

-- System alerts
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(255) UNIQUE NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    alert_message TEXT NOT NULL,
    affected_components JSONB NOT NULL,
    alert_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Alert details
    trigger_conditions JSONB,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    escalation_level INTEGER DEFAULT 1,
    auto_resolution_attempted BOOLEAN DEFAULT false
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Viral predictions indexes
CREATE INDEX IF NOT EXISTS idx_viral_predictions_user_id ON viral_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_platform ON viral_predictions(platform);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_niche ON viral_predictions(niche);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_created_at ON viral_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_viral_predictions_viral_probability ON viral_predictions(viral_probability);

-- Script intelligence indexes
CREATE INDEX IF NOT EXISTS idx_script_memory_platform_niche ON script_intelligence_memory(platform, niche);
CREATE INDEX IF NOT EXISTS idx_script_memory_viral_prob ON script_intelligence_memory(viral_probability);
CREATE INDEX IF NOT EXISTS idx_script_memory_created_at ON script_intelligence_memory(created_at);

-- DNA sequencing indexes
CREATE INDEX IF NOT EXISTS idx_dna_sequences_platform_niche ON script_dna_sequences(platform, niche);
CREATE INDEX IF NOT EXISTS idx_dna_sequences_viral_potential ON script_dna_sequences(viral_potential);
CREATE INDEX IF NOT EXISTS idx_dna_sequences_created_at ON script_dna_sequences(created_at);

-- Validation indexes
CREATE INDEX IF NOT EXISTS idx_validations_prediction_id ON prediction_validations(prediction_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON prediction_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_validations_accuracy ON prediction_validations(accuracy_score);

-- Omniscient knowledge indexes
CREATE INDEX IF NOT EXISTS idx_omniscient_record_type ON omniscient_knowledge(record_type);
CREATE INDEX IF NOT EXISTS idx_omniscient_source_module ON omniscient_knowledge(source_module);
CREATE INDEX IF NOT EXISTS idx_omniscient_platform_niche ON omniscient_knowledge(platform, niche);
CREATE INDEX IF NOT EXISTS idx_omniscient_created_at ON omniscient_knowledge(created_at);

-- =====================================================
-- INSERT INITIAL DATA
-- =====================================================

-- Insert initial system insight
INSERT INTO omniscient_knowledge (
    record_id, record_type, source_module, data_payload, 
    knowledge_level, retention_priority, platform, niche
) VALUES (
    'system_init_001',
    'system_insight',
    'viral_prediction_database',
    jsonb_build_object(
        'event', 'database_initialized',
        'timestamp', NOW()::text,
        'version', '1.0.0'
    ),
    'omniscient',
    'eternal',
    'system',
    'initialization'
) ON CONFLICT (record_id) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
    'Viral Prediction Database Schema Deployed Successfully!' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%viral%' OR table_name LIKE '%omniscient%' OR table_name LIKE '%script%');