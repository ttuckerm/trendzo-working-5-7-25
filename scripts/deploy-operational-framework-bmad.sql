-- =====================================================
-- VIRAL PREDICTION OPERATIONAL FRAMEWORK DEPLOYMENT
-- BMAD Methodology: Additive Integration, No Disruption
-- Date: January 19, 2025
-- Framework: Drop-in Operational Framework v1.0
-- =====================================================

-- BMAD SAFETY: Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- BMAD COMMENT: This deployment adds operational framework capabilities
-- without modifying any existing tables or disrupting current functionality

-- =====================================================
-- 1. DATA INGESTION PIPELINE TRACKING
-- =====================================================
-- Tracks raw engagement events from API webhooks/scrapers
CREATE TABLE IF NOT EXISTS framework_data_ingestion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Source tracking
    video_id TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'linkedin')),
    ingestion_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Raw engagement events (comprehensive event tracking)
    raw_events JSONB NOT NULL, -- {views, likes, comments, shares, rewatches, skips, not_interested}
    watch_time_histogram JSONB DEFAULT '{}', -- Time-based viewing patterns
    retention_rates JSONB DEFAULT '{}', -- {3_sec: 0.85, 10_sec: 0.72, 60_sec: 0.45}
    
    -- Processing pipeline status
    processing_stage VARCHAR(50) DEFAULT 'ingested' CHECK (processing_stage IN (
        'ingested', 'features_extracted', 'scored', 'analyzed', 'completed', 'error'
    )),
    processing_notes TEXT,
    
    -- BMAD: Error handling and audit trail
    processing_attempts INTEGER DEFAULT 0,
    last_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ENGAGEMENT FEATURE EXTRACTOR (E-FX) RESULTS
-- =====================================================
-- Stores normalized engagement features for ML analysis
CREATE TABLE IF NOT EXISTS framework_engagement_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- Normalized per-view and per-minute rates
    per_view_rates JSONB DEFAULT '{}', -- {likes_per_view: 0.05, comments_per_view: 0.02, shares_per_view: 0.01}
    per_minute_rates JSONB DEFAULT '{}', -- {engagement_per_minute: 0.15, interaction_velocity: 0.08}
    retention_features JSONB DEFAULT '{}', -- {hook_retention: 0.85, mid_retention: 0.60, end_retention: 0.35}
    
    -- ML feature vector (512-dimensional embedding for similarity)
    feature_vector JSONB NOT NULL,
    feature_vector_version VARCHAR(20) DEFAULT 'v1.0',
    
    -- Quality metrics
    data_quality_score DECIMAL(5,4) DEFAULT 0.0, -- 0-1 quality assessment
    completeness_score DECIMAL(5,4) DEFAULT 0.0, -- How complete the feature extraction was
    
    -- Processing metadata
    extraction_version VARCHAR(50) DEFAULT 'v1.0',
    extraction_duration_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. HEURISTIC SCORE ENGINE (H-SCORE V1)
-- =====================================================
-- Implements the 5-point scoring system with adaptive weights
CREATE TABLE IF NOT EXISTS framework_heuristic_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- Individual component scores using default weights
    likes_score DECIMAL(10,4) DEFAULT 0, -- Weight: 1
    comments_score DECIMAL(10,4) DEFAULT 0, -- Weight: 2  
    shares_score DECIMAL(10,4) DEFAULT 0, -- Weight: 3
    full_watch_score DECIMAL(10,4) DEFAULT 0, -- Weight: 4
    rewatch_score DECIMAL(10,4) DEFAULT 0, -- Weight: 5
    
    -- Computed H-Score and threshold status
    h_score DECIMAL(10,4) NOT NULL,
    passed_50pts_threshold BOOLEAN DEFAULT FALSE,
    normalized_h_score DECIMAL(5,4), -- 0-1 normalized version
    
    -- Dynamic weight learning (can evolve via ML)
    current_weights JSONB DEFAULT '{"like": 1, "comment": 2, "share": 3, "full_watch": 4, "rewatch": 5}',
    weight_confidence DECIMAL(5,4) DEFAULT 1.0, -- Confidence in current weights
    weight_source VARCHAR(50) DEFAULT 'default', -- 'default', 'learned', 'manual'
    
    -- Performance tracking
    prediction_accuracy DECIMAL(5,4), -- How well this H-Score predicted actual performance
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. HEATING ANOMALY DETECTION (HAD)
-- =====================================================
-- Detects manually "heated" videos to prevent training data contamination
CREATE TABLE IF NOT EXISTS framework_heating_detection (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- View velocity analysis
    view_velocity_spike DECIMAL(10,4), -- Current views / rolling median views
    rolling_median_views DECIMAL(10,4),
    rolling_window_hours INTEGER DEFAULT 24, -- Rolling window used for median calculation
    
    -- Engagement ratio during spike period
    engagement_ratio DECIMAL(6,4), -- Total engagement / views during spike
    expected_engagement_ratio DECIMAL(6,4), -- Expected ratio based on creator history
    engagement_deviation DECIMAL(6,4), -- How much engagement deviates from expected
    
    -- Spike analysis
    spike_multiplier DECIMAL(6,2), -- How many times above normal this spike is
    spike_duration_minutes INTEGER, -- How long the spike lasted
    spike_pattern VARCHAR(50), -- 'sudden', 'gradual', 'sustained', 'irregular'
    
    -- Detection results
    is_suspected_heated BOOLEAN DEFAULT FALSE,
    heating_confidence DECIMAL(5,4) DEFAULT 0, -- 0-1 confidence in heating detection
    anomaly_score DECIMAL(8,4), -- Overall anomaly score
    anomaly_type VARCHAR(50), -- 'view_spike', 'engagement_drop', 'pattern_irregular'
    
    -- Detection parameters used (for transparency and tuning)
    spike_threshold_multiplier DECIMAL(4,2) DEFAULT 5.0, -- Threshold: 5× rolling median
    min_engagement_ratio DECIMAL(4,3) DEFAULT 0.01, -- Threshold: < 1% engagement suspicious
    min_views_threshold INTEGER DEFAULT 1000, -- Minimum views to trigger detection
    
    -- BMAD: Audit and debugging
    detection_algorithm_version VARCHAR(20) DEFAULT 'v1.0',
    debug_info JSONB DEFAULT '{}', -- Additional debugging information
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. ADAPTIVE RANKER RESULTS
-- =====================================================
-- ML-powered predictions with SHAP explanations
CREATE TABLE IF NOT EXISTS framework_adaptive_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- Core ML predictions
    virality_probability DECIMAL(5,4) NOT NULL CHECK (virality_probability >= 0 AND virality_probability <= 1),
    confidence_interval_lower DECIMAL(5,4) CHECK (confidence_interval_lower >= 0 AND confidence_interval_lower <= 1),
    confidence_interval_upper DECIMAL(5,4) CHECK (confidence_interval_upper >= 0 AND confidence_interval_upper <= 1),
    prediction_uncertainty DECIMAL(5,4), -- Measure of prediction uncertainty
    
    -- SHAP explainability (top 3 driving factors for creator feedback)
    top_drivers JSONB DEFAULT '[]', -- [{"factor": "rewatch_rate", "impact": 0.23, "direction": "positive"}, ...]
    feature_importance JSONB DEFAULT '{}', -- Complete feature importance map
    counterfactual_analysis JSONB DEFAULT '{}', -- What would increase viral probability
    
    -- Model metadata and quality
    model_version VARCHAR(50) NOT NULL,
    model_confidence DECIMAL(5,4), -- Model's self-assessed confidence
    prediction_quality VARCHAR(20) CHECK (prediction_quality IN ('high', 'medium', 'low')),
    
    -- Training data quality flags
    excluded_heated_videos BOOLEAN DEFAULT TRUE, -- Whether heated videos were excluded from training
    training_data_quality DECIMAL(5,4), -- Quality of training data used
    cohort_representativeness DECIMAL(5,4), -- How representative the training cohort was
    
    -- Performance tracking
    actual_outcome DECIMAL(5,4), -- Actual virality result (filled in later)
    prediction_error DECIMAL(8,4), -- |predicted - actual|
    accuracy_tier VARCHAR(20), -- 'excellent', 'good', 'fair', 'poor'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE -- When actual outcome was recorded
);

-- =====================================================
-- 6. COHORT PERCENTILE SCORER (DPS-LITE)
-- =====================================================
-- Cohort-relative performance analysis
CREATE TABLE IF NOT EXISTS framework_cohort_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    creator_follower_count INTEGER NOT NULL,
    
    -- Cohort definition (±20% follower count, 7-day rolling window)
    cohort_follower_range_min INTEGER, -- Lower bound of cohort follower range
    cohort_follower_range_max INTEGER, -- Upper bound of cohort follower range  
    cohort_time_window_days INTEGER DEFAULT 7,
    cohort_size INTEGER, -- Number of videos in comparison cohort
    cohort_quality VARCHAR(20) CHECK (cohort_quality IN ('excellent', 'good', 'fair', 'insufficient')),
    
    -- Cohort statistics
    cohort_median_views DECIMAL(12,2),
    cohort_mean_views DECIMAL(12,2),  
    cohort_std_dev DECIMAL(12,4),
    cohort_min_views INTEGER,
    cohort_max_views INTEGER,
    
    -- Percentile calculation results
    cohort_percentile DECIMAL(5,2) CHECK (cohort_percentile >= 0 AND cohort_percentile <= 100),
    viral_classification VARCHAR(20) CHECK (viral_classification IN ('viral', 'hyper', 'mega', 'trending', 'normal')),
    classification_threshold_percentile DECIMAL(5,2), -- What percentile threshold was used
    
    -- Statistical analysis
    z_score DECIMAL(8,4), -- Z-score within cohort
    statistical_significance DECIMAL(5,4), -- P-value of performance vs cohort
    outlier_status VARCHAR(20), -- 'normal', 'positive_outlier', 'negative_outlier'
    
    -- BMAD: Fallback handling
    analysis_method VARCHAR(30) DEFAULT 'cohort' CHECK (analysis_method IN ('cohort', 'fallback_global', 'fallback_platform')),
    fallback_reason TEXT, -- Why fallback was used (if applicable)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. DRIFT MONITORING SYSTEM
-- =====================================================
-- Monitors feature drift and triggers retraining
CREATE TABLE IF NOT EXISTS framework_drift_monitoring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Feature being monitored
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50), -- 'engagement', 'temporal', 'content', 'creator'
    
    -- Drift measurement
    drift_metric VARCHAR(50) NOT NULL CHECK (drift_metric IN ('kl_divergence', 'wasserstein', 'kolmogorov_smirnov', 'psi')),
    drift_value DECIMAL(8,6),
    drift_threshold DECIMAL(8,6) DEFAULT 0.05, -- 5% threshold
    drift_severity VARCHAR(20) CHECK (drift_severity IN ('none', 'low', 'medium', 'high', 'critical')),
    
    -- Time windows for comparison
    baseline_period_start TIMESTAMP WITH TIME ZONE,
    baseline_period_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    
    -- Statistical analysis
    baseline_sample_size INTEGER,
    current_sample_size INTEGER,
    statistical_significance DECIMAL(5,4), -- P-value of drift test
    
    -- Alert and action status
    requires_retrain BOOLEAN DEFAULT FALSE,
    requires_investigation BOOLEAN DEFAULT FALSE,
    alert_triggered BOOLEAN DEFAULT FALSE,
    alert_acknowledged BOOLEAN DEFAULT FALSE,
    action_taken TEXT, -- Description of any actions taken
    
    -- BMAD: Monitoring metadata
    monitoring_version VARCHAR(20) DEFAULT 'v1.0',
    detection_sensitivity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 8. FRAMEWORK CONFIGURATION MANAGEMENT
-- =====================================================
-- YAML-like configuration storage with versioning
CREATE TABLE IF NOT EXISTS framework_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    
    -- Configuration metadata
    config_category VARCHAR(50), -- 'weights', 'thresholds', 'schedules', 'features'
    data_type VARCHAR(20) CHECK (data_type IN ('object', 'array', 'number', 'string', 'boolean')),
    
    -- Versioning and lifecycle
    version VARCHAR(20) DEFAULT 'v1.0',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Validation and constraints
    validation_schema JSONB, -- JSON Schema for validating config_value
    min_value DECIMAL(10,4), -- For numeric configurations
    max_value DECIMAL(10,4), -- For numeric configurations
    allowed_values JSONB, -- For enum-like configurations
    
    -- Change management
    description TEXT,
    change_reason TEXT,
    last_updated_by VARCHAR(100),
    requires_restart BOOLEAN DEFAULT FALSE,
    
    -- BMAD: Safety and rollback
    previous_value JSONB, -- For quick rollback
    rollback_available BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. OPERATIONAL WORKFLOW TRACKING
-- =====================================================
-- Tracks the complete operational workflow per video
CREATE TABLE IF NOT EXISTS framework_operational_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    workflow_version VARCHAR(20) DEFAULT 'v1.0',
    
    -- Workflow stage tracking
    current_stage VARCHAR(50) DEFAULT 'api_webhook',
    stages_completed JSONB DEFAULT '[]', -- Array of completed stage names
    stages_failed JSONB DEFAULT '[]', -- Array of failed stages with error info
    
    -- Timing analysis
    workflow_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    workflow_end_time TIMESTAMP WITH TIME ZONE,
    total_processing_time_ms INTEGER,
    stage_timings JSONB DEFAULT '{}', -- {stage_name: duration_ms, ...}
    
    -- Processing results summary
    final_viral_probability DECIMAL(5,4),
    final_confidence DECIMAL(5,4),
    prediction_quality VARCHAR(20),
    
    -- Operational flags
    heating_detected BOOLEAN DEFAULT FALSE,
    cohort_analysis_successful BOOLEAN DEFAULT FALSE,
    drift_alerts_triggered BOOLEAN DEFAULT FALSE,
    
    -- BMAD: Error handling and recovery
    error_count INTEGER DEFAULT 0,
    recovery_attempts INTEGER DEFAULT 0,
    fallback_used BOOLEAN DEFAULT FALSE,
    fallback_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Optimized indexes for operational queries

-- Data ingestion indexes
CREATE INDEX IF NOT EXISTS idx_framework_data_ingestion_video_id ON framework_data_ingestion(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_data_ingestion_timestamp ON framework_data_ingestion(ingestion_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_framework_data_ingestion_platform ON framework_data_ingestion(platform);
CREATE INDEX IF NOT EXISTS idx_framework_data_ingestion_stage ON framework_data_ingestion(processing_stage);

-- Feature extraction indexes
CREATE INDEX IF NOT EXISTS idx_framework_engagement_features_video_id ON framework_engagement_features(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_engagement_features_version ON framework_engagement_features(extraction_version);
CREATE INDEX IF NOT EXISTS idx_framework_engagement_features_quality ON framework_engagement_features(data_quality_score DESC);

-- Heuristic scores indexes
CREATE INDEX IF NOT EXISTS idx_framework_heuristic_scores_video_id ON framework_heuristic_scores(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_heuristic_scores_h_score ON framework_heuristic_scores(h_score DESC);
CREATE INDEX IF NOT EXISTS idx_framework_heuristic_scores_threshold ON framework_heuristic_scores(passed_50pts_threshold);

-- Heating detection indexes
CREATE INDEX IF NOT EXISTS idx_framework_heating_detection_video_id ON framework_heating_detection(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_heating_suspected ON framework_heating_detection(is_suspected_heated);
CREATE INDEX IF NOT EXISTS idx_framework_heating_confidence ON framework_heating_detection(heating_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_framework_heating_timestamp ON framework_heating_detection(created_at DESC);

-- Adaptive predictions indexes
CREATE INDEX IF NOT EXISTS idx_framework_adaptive_predictions_video_id ON framework_adaptive_predictions(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_adaptive_predictions_probability ON framework_adaptive_predictions(virality_probability DESC);
CREATE INDEX IF NOT EXISTS idx_framework_adaptive_predictions_model ON framework_adaptive_predictions(model_version);
CREATE INDEX IF NOT EXISTS idx_framework_adaptive_predictions_quality ON framework_adaptive_predictions(prediction_quality);

-- Cohort analysis indexes
CREATE INDEX IF NOT EXISTS idx_framework_cohort_analysis_video_id ON framework_cohort_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_cohort_analysis_follower_count ON framework_cohort_analysis(creator_follower_count);
CREATE INDEX IF NOT EXISTS idx_framework_cohort_analysis_percentile ON framework_cohort_analysis(cohort_percentile DESC);
CREATE INDEX IF NOT EXISTS idx_framework_cohort_analysis_classification ON framework_cohort_analysis(viral_classification);

-- Drift monitoring indexes
CREATE INDEX IF NOT EXISTS idx_framework_drift_monitoring_feature ON framework_drift_monitoring(feature_name);
CREATE INDEX IF NOT EXISTS idx_framework_drift_monitoring_severity ON framework_drift_monitoring(drift_severity);
CREATE INDEX IF NOT EXISTS idx_framework_drift_monitoring_timestamp ON framework_drift_monitoring(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_framework_drift_monitoring_alerts ON framework_drift_monitoring(requires_retrain, alert_triggered);

-- Configuration indexes
CREATE INDEX IF NOT EXISTS idx_framework_config_active ON framework_configuration(is_active);
CREATE INDEX IF NOT EXISTS idx_framework_config_category ON framework_configuration(config_category);
CREATE INDEX IF NOT EXISTS idx_framework_config_version ON framework_configuration(version);

-- Workflow tracking indexes
CREATE INDEX IF NOT EXISTS idx_framework_workflow_video_id ON framework_operational_workflow(video_id);
CREATE INDEX IF NOT EXISTS idx_framework_workflow_stage ON framework_operational_workflow(current_stage);
CREATE INDEX IF NOT EXISTS idx_framework_workflow_timestamp ON framework_operational_workflow(created_at DESC);

-- =====================================================
-- DEFAULT CONFIGURATION DATA
-- =====================================================
-- Insert framework configuration with BMAD safety (ON CONFLICT DO NOTHING)

INSERT INTO framework_configuration (config_key, config_value, config_category, description, data_type) VALUES
('heuristic_weights', '{"like": 1, "comment": 2, "share": 3, "full_watch": 4, "rewatch": 5}', 'weights', 'Default H-Score component weights (can be learned)', 'object'),
('heating_filter', '{"spike_multiplier": 5, "min_views": 1000, "max_engagement_ratio": 0.01}', 'thresholds', 'Heating anomaly detection parameters', 'object'),
('cohort_window_days', '7', 'analysis', 'Rolling window for cohort analysis in days', 'number'),
('drift_threshold_pct', '5', 'monitoring', 'Drift detection threshold percentage', 'number'),
('retrain_cron', '"0 3 * * 1"', 'schedules', 'Weekly retrain schedule (Mondays 03:00 UTC)', 'string'),
('feature_extraction_version', '"v1.0"', 'processing', 'Current feature extraction algorithm version', 'string'),
('prediction_confidence_threshold', '0.7', 'thresholds', 'Minimum confidence for high-quality predictions', 'number'),
('cohort_min_sample_size', '10', 'analysis', 'Minimum cohort size for statistical analysis', 'number'),
('workflow_timeout_minutes', '30', 'processing', 'Maximum time allowed for complete workflow', 'number'),
('enable_heating_detection', 'true', 'features', 'Whether to enable heating anomaly detection', 'boolean'),
('enable_drift_monitoring', 'true', 'features', 'Whether to enable feature drift monitoring', 'boolean'),
('enable_shap_explanations', 'true', 'features', 'Whether to generate SHAP explanations', 'boolean')
ON CONFLICT (config_key) DO NOTHING;

-- =====================================================
-- BMAD VALIDATION QUERIES
-- =====================================================
-- These queries validate the deployment was successful

-- Verify all tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'framework_%'
ORDER BY table_name;

-- Verify configuration was inserted
SELECT 
    config_key,
    config_category,
    is_active,
    description
FROM framework_configuration
WHERE is_active = true
ORDER BY config_category, config_key;

-- Verify indexes were created
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename LIKE 'framework_%'
ORDER BY tablename, indexname;

-- =====================================================
-- DEPLOYMENT COMPLETION NOTICE
-- =====================================================

-- BMAD SUCCESS: Framework deployment completed successfully
-- All tables, indexes, and default configuration deployed
-- Zero disruption to existing viral prediction functionality
-- Ready for operational framework integration in Phase 1.5

SELECT 'OPERATIONAL FRAMEWORK DEPLOYMENT COMPLETED - BMAD METHODOLOGY SUCCESSFUL' as deployment_status; 