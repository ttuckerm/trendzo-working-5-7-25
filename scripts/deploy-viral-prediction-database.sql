-- =====================================================
-- VIRAL PREDICTION SYSTEM - COMPLETE DATABASE SCHEMA
-- =====================================================
-- 
-- Complete Supabase PostgreSQL schema for the omniscient
-- viral prediction ecosystem with all AI systems
--

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =====================================================
-- CORE VIRAL PREDICTION TABLES
-- =====================================================

-- Main prediction records
CREATE TABLE IF NOT EXISTS viral_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    script_text TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    viral_probability DECIMAL(5,4) NOT NULL CHECK (viral_probability >= 0 AND viral_probability <= 1),
    viral_score DECIMAL(5,2) NOT NULL CHECK (viral_score >= 0 AND viral_score <= 100),
    confidence_level DECIMAL(5,4) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    prediction_method VARCHAR(100) NOT NULL DEFAULT 'script_intelligence_enhanced',
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
    processing_time_ms INTEGER,
    
    CONSTRAINT valid_platform CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin', 'twitter', 'facebook')),
    CONSTRAINT valid_niche CHECK (niche IN ('business', 'fitness', 'entertainment', 'education', 'lifestyle', 'technology', 'marketing', 'productivity', 'finance', 'health'))
);

-- =====================================================
-- SCRIPT INTELLIGENCE SYSTEM TABLES
-- =====================================================

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
    correlation_score DECIMAL(5,4) DEFAULT 0.0,
    
    CONSTRAINT valid_retention CHECK (retention_priority IN ('low', 'medium', 'high', 'eternal'))
);

-- Script intelligence insights
CREATE TABLE IF NOT EXISTS script_intelligence_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    insight_id VARCHAR(255) UNIQUE NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    insight_description TEXT NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    supporting_evidence JSONB,
    platform_specific BOOLEAN DEFAULT false,
    platforms JSONB DEFAULT '[]'::jsonb,
    niche_specific BOOLEAN DEFAULT false,
    niches JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE,
    validation_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(5,4),
    
    CONSTRAINT valid_insight_type CHECK (insight_type IN ('pattern', 'trend', 'optimization', 'prediction', 'correlation'))
);

-- =====================================================
-- SCRIPT DNA SEQUENCING TABLES
-- =====================================================

-- Script DNA records
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

-- DNA evolution tracking
CREATE TABLE IF NOT EXISTS script_dna_evolution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evolution_id VARCHAR(255) UNIQUE NOT NULL,
    parent_sequence_id VARCHAR(255) REFERENCES script_dna_sequences(sequence_id),
    child_sequence_id VARCHAR(255) REFERENCES script_dna_sequences(sequence_id),
    mutation_type VARCHAR(50) NOT NULL,
    mutation_description TEXT,
    mutation_impact DECIMAL(5,4),
    performance_change DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Mutation details
    mutated_elements JSONB,
    fitness_improvement DECIMAL(5,4),
    viral_enhancement DECIMAL(5,4),
    
    CONSTRAINT valid_mutation_type CHECK (mutation_type IN ('substitution', 'insertion', 'deletion', 'duplication', 'inversion', 'enhancement'))
);

-- =====================================================
-- MULTI-MODULE INTELLIGENCE HARVESTING
-- =====================================================

-- Intelligence harvesting records
CREATE TABLE IF NOT EXISTS intelligence_harvesting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    harvest_id VARCHAR(255) UNIQUE NOT NULL,
    harvest_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source_modules JSONB NOT NULL,
    harvested_intelligence JSONB NOT NULL,
    synthesis_results JSONB,
    cross_correlations JSONB DEFAULT '[]'::jsonb,
    emergent_properties JSONB DEFAULT '[]'::jsonb,
    intelligence_score DECIMAL(5,4),
    actionable_insights INTEGER DEFAULT 0,
    
    -- Harvesting metadata
    harvest_method VARCHAR(100),
    processing_time_ms INTEGER,
    data_quality_score DECIMAL(5,4),
    coverage_completeness DECIMAL(5,4)
);

-- Cross-module correlations
CREATE TABLE IF NOT EXISTS cross_module_correlations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correlation_id VARCHAR(255) UNIQUE NOT NULL,
    source_module VARCHAR(100) NOT NULL,
    target_module VARCHAR(100) NOT NULL,
    correlation_type VARCHAR(50) NOT NULL,
    correlation_strength DECIMAL(5,4) NOT NULL,
    confidence_level DECIMAL(5,4) NOT NULL,
    supporting_data JSONB,
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_validated TIMESTAMP WITH TIME ZONE,
    validation_count INTEGER DEFAULT 0,
    
    CONSTRAINT valid_correlation_type CHECK (correlation_type IN ('causal', 'predictive', 'temporal', 'categorical', 'behavioral'))
);

-- =====================================================
-- REAL-TIME OPTIMIZATION TABLES
-- =====================================================

-- Optimization records
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

-- Real-time optimization queue
CREATE TABLE IF NOT EXISTS optimization_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    queue_id VARCHAR(255) UNIQUE NOT NULL,
    script_content TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    niche VARCHAR(100) NOT NULL,
    priority_level VARCHAR(20) DEFAULT 'normal',
    queue_status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Queue metadata
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    optimization_requirements JSONB,
    estimated_processing_time INTEGER,
    
    CONSTRAINT valid_priority CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
    CONSTRAINT valid_queue_status CHECK (queue_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- =====================================================
-- SCRIPT SINGULARITY TABLES
-- =====================================================

-- Singularity generation records
CREATE TABLE IF NOT EXISTS script_singularity_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_id VARCHAR(255) UNIQUE NOT NULL,
    generation_type VARCHAR(50) NOT NULL,
    target_platform VARCHAR(50) NOT NULL,
    target_niche VARCHAR(100) NOT NULL,
    transcendence_level VARCHAR(50) NOT NULL,
    creativity_mode VARCHAR(50) NOT NULL,
    generated_scripts JSONB NOT NULL,
    singularity_score DECIMAL(5,4),
    revolutionary_potential DECIMAL(5,4),
    cultural_impact_prediction DECIMAL(5,4),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Generation metadata
    content_requirements JSONB,
    inspiration_sources JSONB,
    innovation_markers JSONB,
    trend_creation_potential DECIMAL(5,4),
    
    CONSTRAINT valid_generation_type CHECK (generation_type IN ('trend_seed', 'future_echo', 'pattern_break', 'cultural_bridge', 'algorithm_hack')),
    CONSTRAINT valid_transcendence CHECK (transcendence_level IN ('human', 'enhanced', 'superhuman', 'transcendent')),
    CONSTRAINT valid_creativity CHECK (creativity_mode IN ('adaptive', 'innovative', 'revolutionary', 'transcendent'))
);

-- =====================================================
-- VALIDATION SYSTEM TABLES
-- =====================================================

-- Validation records
CREATE TABLE IF NOT EXISTS prediction_validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    validation_id VARCHAR(255) UNIQUE NOT NULL,
    prediction_id VARCHAR(255) REFERENCES viral_predictions(prediction_id),
    validation_status VARCHAR(20) DEFAULT 'pending',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    
    -- Predicted metrics (from original prediction)
    predicted_viral_probability DECIMAL(5,4),
    predicted_viral_score DECIMAL(5,2),
    predicted_engagement_rate DECIMAL(5,4),
    predicted_share_velocity DECIMAL(5,4),
    predicted_peak_views INTEGER,
    predicted_time_to_peak_hours INTEGER,
    predicted_retention_score DECIMAL(5,4),
    predicted_conversion_rate DECIMAL(5,4),
    predicted_audience_growth DECIMAL(5,4),
    predicted_cultural_impact DECIMAL(5,4),
    
    -- Actual metrics (from real-world performance)
    actual_viral_probability DECIMAL(5,4),
    actual_viral_score DECIMAL(5,2),
    actual_engagement_rate DECIMAL(5,4),
    actual_share_velocity DECIMAL(5,4),
    actual_peak_views INTEGER,
    actual_time_to_peak_hours INTEGER,
    actual_retention_score DECIMAL(5,4),
    actual_conversion_rate DECIMAL(5,4),
    actual_audience_growth DECIMAL(5,4),
    actual_cultural_impact DECIMAL(5,4),
    
    -- Validation results
    accuracy_score DECIMAL(5,4),
    prediction_confidence DECIMAL(5,4),
    time_to_validation DECIMAL(8,2), -- hours
    data_quality_score DECIMAL(5,4),
    external_factors JSONB DEFAULT '[]'::jsonb,
    
    -- Learning feedback
    accuracy_breakdown JSONB,
    learning_feedback JSONB,
    improvement_recommendations JSONB,
    
    CONSTRAINT valid_validation_status CHECK (validation_status IN ('pending', 'validated', 'failed', 'expired'))
);

-- Validation reports
CREATE TABLE IF NOT EXISTS validation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(255) UNIQUE NOT NULL,
    report_period VARCHAR(50) NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_validations INTEGER NOT NULL,
    overall_accuracy DECIMAL(5,4) NOT NULL,
    
    -- Accuracy breakdowns
    accuracy_by_metric JSONB NOT NULL,
    accuracy_by_platform JSONB NOT NULL,
    accuracy_by_niche JSONB NOT NULL,
    accuracy_by_timeframe JSONB NOT NULL,
    
    -- Performance analysis
    model_performance_summary JSONB NOT NULL,
    key_insights JSONB DEFAULT '[]'::jsonb,
    improvement_recommendations JSONB DEFAULT '[]'::jsonb,
    system_health JSONB NOT NULL,
    
    -- Report metadata
    validation_period_start TIMESTAMP WITH TIME ZONE,
    validation_period_end TIMESTAMP WITH TIME ZONE,
    report_quality_score DECIMAL(5,4),
    actionable_insights_count INTEGER DEFAULT 0
);

-- =====================================================
-- OMNISCIENT DATABASE TABLES
-- =====================================================

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
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    platform VARCHAR(50),
    niche VARCHAR(100),
    performance_score DECIMAL(5,4) DEFAULT 0,
    learning_value DECIMAL(5,4) DEFAULT 0.5,
    correlation_strength DECIMAL(5,4) DEFAULT 0.5,
    novelty_score DECIMAL(5,4) DEFAULT 0.5,
    strategic_importance DECIMAL(5,4) DEFAULT 0.5,
    
    CONSTRAINT valid_record_type CHECK (record_type IN ('script_analysis', 'prediction_result', 'validation_outcome', 'template_performance', 'ab_test_result', 'user_interaction', 'system_insight', 'pattern_discovery')),
    CONSTRAINT valid_knowledge_level CHECK (knowledge_level IN ('surface', 'deep', 'strategic', 'omniscient')),
    CONSTRAINT valid_retention_priority CHECK (retention_priority IN ('temporary', 'short_term', 'long_term', 'eternal'))
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
    reinforcement_count INTEGER DEFAULT 1,
    
    CONSTRAINT valid_node_type CHECK (node_type IN ('concept', 'pattern', 'relationship', 'insight', 'prediction', 'outcome'))
);

-- Knowledge graph connections
CREATE TABLE IF NOT EXISTS knowledge_graph_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id VARCHAR(255) UNIQUE NOT NULL,
    source_node_id VARCHAR(255) REFERENCES knowledge_graph_nodes(node_id),
    target_node_id VARCHAR(255) REFERENCES knowledge_graph_nodes(node_id),
    connection_type VARCHAR(50) NOT NULL,
    strength DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    confidence DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    bidirectional BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_connection_type CHECK (connection_type IN ('causal', 'correlational', 'temporal', 'categorical', 'predictive'))
);

-- Learning events
CREATE TABLE IF NOT EXISTS learning_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    learning_impact DECIMAL(5,4) NOT NULL,
    knowledge_delta DECIMAL(8,2) NOT NULL,
    source_modules JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_event_type CHECK (event_type IN ('new_knowledge', 'pattern_reinforcement', 'correlation_discovery', 'prediction_validation', 'insight_generation'))
);

-- =====================================================
-- TEMPLATE ANALYSIS TABLES
-- =====================================================

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
    business_objectives JSONB,
    
    CONSTRAINT valid_analysis_type CHECK (analysis_type IN ('basic', 'comprehensive', 'competitive', 'performance', 'optimization'))
);

-- =====================================================
-- A/B TESTING TABLES
-- =====================================================

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
    creator_id UUID REFERENCES auth.users(id),
    expected_duration_days INTEGER,
    business_impact_priority VARCHAR(20) DEFAULT 'medium',
    
    CONSTRAINT valid_test_type CHECK (test_type IN ('script_comparison', 'hook_optimization', 'platform_adaptation', 'niche_targeting', 'engagement_enhancement')),
    CONSTRAINT valid_test_status CHECK (test_status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    CONSTRAINT valid_business_priority CHECK (business_impact_priority IN ('low', 'medium', 'high', 'critical'))
);

-- A/B test results
CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id VARCHAR(255) UNIQUE NOT NULL,
    test_id VARCHAR(255) REFERENCES ab_test_configurations(test_id),
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

-- =====================================================
-- SYSTEM MONITORING TABLES
-- =====================================================

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
    system_load DECIMAL(5,4),
    
    CONSTRAINT valid_metric_type CHECK (metric_type IN ('response_time', 'accuracy', 'throughput', 'error_rate', 'memory_usage', 'cpu_usage', 'prediction_count', 'optimization_count', 'validation_accuracy'))
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
    auto_resolution_attempted BOOLEAN DEFAULT false,
    
    CONSTRAINT valid_alert_type CHECK (alert_type IN ('performance_degradation', 'accuracy_drop', 'system_error', 'capacity_limit', 'data_quality_issue', 'prediction_anomaly')),
    CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_alert_status CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed'))
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
CREATE INDEX IF NOT EXISTS idx_script_memory_retention ON script_intelligence_memory(retention_priority);

-- DNA sequencing indexes
CREATE INDEX IF NOT EXISTS idx_dna_sequences_platform_niche ON script_dna_sequences(platform, niche);
CREATE INDEX IF NOT EXISTS idx_dna_sequences_viral_potential ON script_dna_sequences(viral_potential);
CREATE INDEX IF NOT EXISTS idx_dna_sequences_created_at ON script_dna_sequences(created_at);

-- Validation indexes
CREATE INDEX IF NOT EXISTS idx_validations_prediction_id ON prediction_validations(prediction_id);
CREATE INDEX IF NOT EXISTS idx_validations_status ON prediction_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_validations_accuracy ON prediction_validations(accuracy_score);
CREATE INDEX IF NOT EXISTS idx_validations_validated_at ON prediction_validations(validated_at);

-- Omniscient knowledge indexes
CREATE INDEX IF NOT EXISTS idx_omniscient_record_type ON omniscient_knowledge(record_type);
CREATE INDEX IF NOT EXISTS idx_omniscient_source_module ON omniscient_knowledge(source_module);
CREATE INDEX IF NOT EXISTS idx_omniscient_platform_niche ON omniscient_knowledge(platform, niche);
CREATE INDEX IF NOT EXISTS idx_omniscient_created_at ON omniscient_knowledge(created_at);
CREATE INDEX IF NOT EXISTS idx_omniscient_retention ON omniscient_knowledge(retention_priority);
CREATE INDEX IF NOT EXISTS idx_omniscient_knowledge_level ON omniscient_knowledge(knowledge_level);

-- Knowledge graph indexes
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kg_connections_source ON knowledge_graph_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_connections_target ON knowledge_graph_connections(target_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_connections_type ON knowledge_graph_connections(connection_type);

-- System monitoring indexes
CREATE INDEX IF NOT EXISTS idx_performance_system_name ON system_performance_metrics(system_name);
CREATE INDEX IF NOT EXISTS idx_performance_metric_type ON system_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_recorded_at ON system_performance_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON system_alerts(alert_status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON system_alerts(created_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user-specific tables
ALTER TABLE viral_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_intelligence_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_dna_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE omniscient_knowledge ENABLE ROW LEVEL SECURITY;

-- Viral predictions policies
CREATE POLICY "Users can view own predictions" ON viral_predictions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own predictions" ON viral_predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions" ON viral_predictions
    FOR UPDATE USING (auth.uid() = user_id);

-- Script intelligence policies
CREATE POLICY "Users can view accessible script memory" ON script_intelligence_memory
    FOR SELECT USING (
        retention_priority IN ('medium', 'high', 'eternal') OR 
        created_at > NOW() - INTERVAL '24 hours'
    );

-- Omniscient knowledge policies
CREATE POLICY "Users can view relevant omniscient knowledge" ON omniscient_knowledge
    FOR SELECT USING (
        auth.uid() = user_id OR 
        retention_priority IN ('long_term', 'eternal') OR
        knowledge_level IN ('strategic', 'omniscient')
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers
CREATE TRIGGER update_viral_predictions_updated_at BEFORE UPDATE ON viral_predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_dna_sequences_updated_at BEFORE UPDATE ON script_dna_sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate accuracy function for validations
CREATE OR REPLACE FUNCTION calculate_prediction_accuracy(
    predicted_prob DECIMAL(5,4),
    actual_prob DECIMAL(5,4),
    predicted_score DECIMAL(5,2),
    actual_score DECIMAL(5,2)
) RETURNS DECIMAL(5,4) AS $$
BEGIN
    -- Simple accuracy calculation based on probability and score differences
    RETURN 1.0 - (
        (ABS(predicted_prob - actual_prob) * 0.6) + 
        (ABS(predicted_score - actual_score) / 100.0 * 0.4)
    );
END;
$$ LANGUAGE plpgsql;

-- Omniscience level calculation function
CREATE OR REPLACE FUNCTION calculate_omniscience_level()
RETURNS DECIMAL(5,4) AS $$
DECLARE
    record_count INTEGER;
    knowledge_points DECIMAL(10,2);
    connection_count INTEGER;
    omniscience_score DECIMAL(5,4);
BEGIN
    -- Get metrics for omniscience calculation
    SELECT COUNT(*) INTO record_count FROM omniscient_knowledge;
    
    SELECT SUM(learning_value * 10) INTO knowledge_points 
    FROM omniscient_knowledge;
    
    SELECT COUNT(*) INTO connection_count 
    FROM knowledge_graph_connections;
    
    -- Calculate omniscience level
    omniscience_score := (
        LEAST(record_count / 10000.0, 1.0) * 0.4 +
        LEAST(COALESCE(knowledge_points, 0) / 100000.0, 1.0) * 0.4 +
        LEAST(connection_count / 50000.0, 1.0) * 0.2
    );
    
    RETURN GREATEST(LEAST(omniscience_score, 1.0), 0.0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert initial system insights
INSERT INTO omniscient_knowledge (
    record_id, record_type, source_module, data_payload, 
    knowledge_level, retention_priority, platform, niche
) VALUES (
    'system_init_001',
    'system_insight',
    'viral_prediction_database',
    '{"event": "database_initialized", "timestamp": "' || NOW() || '", "version": "1.0.0"}',
    'omniscient',
    'eternal',
    'system',
    'initialization'
) ON CONFLICT (record_id) DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON viral_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON script_intelligence_memory TO authenticated;
GRANT SELECT, INSERT, UPDATE ON script_dna_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON prediction_validations TO authenticated;
GRANT SELECT, INSERT ON omniscient_knowledge TO authenticated;
GRANT SELECT ON knowledge_graph_nodes TO authenticated;
GRANT SELECT ON knowledge_graph_connections TO authenticated;
GRANT SELECT ON template_analysis TO authenticated;
GRANT SELECT ON ab_test_configurations TO authenticated;
GRANT SELECT ON ab_test_results TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Viral Prediction System Database Schema Deployed Successfully!';
    RAISE NOTICE 'Created tables: viral_predictions, script_intelligence_memory, script_dna_sequences,';
    RAISE NOTICE 'prediction_validations, omniscient_knowledge, knowledge_graph_nodes,';
    RAISE NOTICE 'knowledge_graph_connections, learning_events, template_analysis,';
    RAISE NOTICE 'ab_test_configurations, ab_test_results, system_performance_metrics,';
    RAISE NOTICE 'system_alerts, and all supporting tables.';
    RAISE NOTICE 'Total tables created: 20+';
    RAISE NOTICE 'Indexes created: 25+';
    RAISE NOTICE 'RLS policies enabled for data security';
    RAISE NOTICE 'System ready for omniscient viral prediction operations!';
END $$;