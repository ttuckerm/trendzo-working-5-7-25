-- =====================================================
-- CLEAN CORE TABLES DEPLOYMENT FOR 12-MODULE SYSTEM
-- =====================================================
-- This script safely drops existing tables and recreates them with correct schema

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- Drop existing tables that might have conflicts (in dependency order)
DROP TABLE IF EXISTS prediction_validation CASCADE;
DROP TABLE IF EXISTS viral_recipe_book CASCADE;
DROP TABLE IF EXISTS system_health_logs CASCADE;
DROP TABLE IF EXISTS system_alerts CASCADE;
DROP TABLE IF EXISTS viral_dna_sequences CASCADE;
DROP TABLE IF EXISTS template_generators CASCADE;
DROP TABLE IF EXISTS script_intelligence_data CASCADE;
DROP TABLE IF EXISTS marketing_campaigns CASCADE;
DROP TABLE IF EXISTS process_intelligence CASCADE;
DROP TABLE IF EXISTS viral_filters CASCADE;
DROP TABLE IF EXISTS evolution_engines CASCADE;
DROP TABLE IF EXISTS feature_decomposers CASCADE;
DROP TABLE IF EXISTS gene_taggers CASCADE;

-- SYSTEM ALERTS TABLE (for AlertService)
CREATE TABLE system_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id VARCHAR(100) UNIQUE NOT NULL,
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'critical')),
    source VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 2: Viral Pattern Analyzer
CREATE TABLE viral_dna_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    sequence_data JSONB NOT NULL,
    pattern_scores JSONB DEFAULT '{}',
    viral_indicators JSONB DEFAULT '{}',
    confidence_score DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 3: Template Discovery Engine  
CREATE TABLE template_generators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    source_videos TEXT[] DEFAULT '{}',
    pattern_data JSONB NOT NULL,
    success_rate DECIMAL(5,4) DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 5: Script Intelligence Module
CREATE TABLE script_intelligence_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    transcript TEXT,
    linguistic_patterns JSONB DEFAULT '{}',
    emotional_markers JSONB DEFAULT '{}',
    viral_script_score DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 6: Recipe Book Generator
CREATE TABLE viral_recipe_book (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    viral_elements JSONB NOT NULL,
    success_metrics JSONB DEFAULT '{}',
    usage_frequency INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(5,4) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'HOT' CHECK (status IN ('HOT', 'COOLING', 'NEW')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 8: Performance Validator
CREATE TABLE prediction_validation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL,
    video_id TEXT NOT NULL,
    predicted_viral_score DECIMAL(5,4) NOT NULL,
    actual_viral_score DECIMAL(5,4),
    predicted_views INTEGER,
    actual_views INTEGER,
    validation_timestamp TIMESTAMP WITH TIME ZONE,
    accuracy_percentage DECIMAL(5,2),
    validation_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 9: Marketing Content Creator
CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    generated_content JSONB NOT NULL,
    performance_metrics JSONB DEFAULT '{}',
    viral_success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 11: System Health Monitor
CREATE TABLE system_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'error', 'warning', 'maintenance')),
    metrics JSONB DEFAULT '{}',
    error_details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MODULE 12: Process Intelligence Layer  
CREATE TABLE process_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_session TEXT NOT NULL,
    process_step VARCHAR(100) NOT NULL,
    step_data JSONB DEFAULT '{}',
    duration_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional support tables
CREATE TABLE viral_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filter_name VARCHAR(255) NOT NULL,
    filter_criteria JSONB NOT NULL,
    videos_processed INTEGER DEFAULT 0,
    viral_videos_found INTEGER DEFAULT 0,
    effectiveness_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE evolution_engines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    algorithm_version VARCHAR(50) NOT NULL,
    performance_data JSONB NOT NULL,
    accuracy_improvement DECIMAL(5,4) DEFAULT 0,
    deployment_status VARCHAR(50) DEFAULT 'testing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE feature_decomposers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    extracted_features JSONB NOT NULL,
    feature_scores JSONB DEFAULT '{}',
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE gene_taggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    detected_genes JSONB NOT NULL,
    gene_confidence JSONB DEFAULT '{}',
    tagging_accuracy DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_viral_dna_video_id ON viral_dna_sequences(video_id);
CREATE INDEX IF NOT EXISTS idx_viral_dna_confidence ON viral_dna_sequences(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_template_generators_status ON template_generators(status);
CREATE INDEX IF NOT EXISTS idx_template_generators_success_rate ON template_generators(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_script_intelligence_video_id ON script_intelligence_data(video_id);
CREATE INDEX IF NOT EXISTS idx_script_intelligence_score ON script_intelligence_data(viral_script_score DESC);
CREATE INDEX IF NOT EXISTS idx_viral_recipe_book_status ON viral_recipe_book(status);
CREATE INDEX IF NOT EXISTS idx_viral_recipe_book_effectiveness ON viral_recipe_book(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_validation_video_id ON prediction_validation(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_validation_status ON prediction_validation(validation_status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(content_type);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_module ON system_health_logs(module_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_timestamp ON system_health_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_level ON system_alerts(level);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_acknowledged ON system_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_process_intelligence_session ON process_intelligence(user_session);
CREATE INDEX IF NOT EXISTS idx_feature_decomposers_video_id ON feature_decomposers(video_id);
CREATE INDEX IF NOT EXISTS idx_gene_taggers_video_id ON gene_taggers(video_id);

-- Insert initial data for Recipe Book (HOT templates)
INSERT INTO viral_recipe_book (recipe_name, template_type, viral_elements, status, effectiveness_score) VALUES
('Authority Hook', 'hook', '{"pattern": "credibility_statement", "timing": "first_3_seconds", "elements": ["expertise_claim", "results_proof"]}', 'HOT', 0.87),
('Before/After Transformation', 'structure', '{"pattern": "transformation", "timing": "throughout", "elements": ["initial_state", "process", "final_result"]}', 'HOT', 0.83),
('Secret Knowledge Reveal', 'hook', '{"pattern": "curiosity_gap", "timing": "first_5_seconds", "elements": ["insider_info", "exclusive_access"]}', 'HOT', 0.79),
('POV Relatability', 'hook', '{"pattern": "point_of_view", "timing": "immediate", "elements": ["common_experience", "emotional_connection"]}', 'HOT', 0.76),
('Quick Tutorial Format', 'structure', '{"pattern": "educational", "timing": "60_seconds", "elements": ["problem_identification", "step_by_step", "result_showcase"]}', 'HOT', 0.74),
('Trending Audio Hook', 'audio', '{"pattern": "music_sync", "timing": "immediate", "elements": ["popular_sound", "perfect_timing", "visual_match"]}', 'COOLING', 0.68);

-- Insert system health monitoring entries for all 12 modules
INSERT INTO system_health_logs (module_name, status, metrics) VALUES
('TikTok_Scraper', 'active', '{"uptime": 99.8, "videos_processed": 24891, "last_run": "2025-01-15T10:00:00Z"}'),
('Viral_Pattern_Analyzer', 'active', '{"patterns_detected": 47, "accuracy": 91.3, "processing_speed": "2.1s"}'),
('Template_Discovery_Engine', 'active', '{"templates_generated": 156, "success_rate": 78.4, "hot_templates": 23}'),
('Draft_Video_Analyzer', 'active', '{"analyses_completed": 8934, "avg_analysis_time": "4.2s", "accuracy": 89.7}'),
('Script_Intelligence_Module', 'active', '{"scripts_analyzed": 12847, "viral_patterns": 342, "accuracy": 85.6}'),
('Recipe_Book_Generator', 'active', '{"recipes_active": 89, "hot_recipes": 23, "cooling_recipes": 31}'),
('Prediction_Engine', 'active', '{"predictions_made": 15672, "accuracy": 91.3, "confidence": 0.89}'),
('Performance_Validator', 'active', '{"validations_completed": 14523, "accuracy_verified": 91.3, "false_positives": 8.7}'),
('Marketing_Content_Creator', 'active', '{"campaigns_generated": 234, "viral_success_rate": 67.8, "engagement_boost": 340}'),
('Dashboard_Aggregator', 'active', '{"data_points": 1847293, "update_frequency": "real_time", "uptime": 99.9}'),
('System_Health_Monitor', 'active', '{"modules_monitored": 12, "alerts_sent": 23, "average_uptime": 99.2}'),
('Process_Intelligence_Layer', 'active', '{"user_journeys_tracked": 5672, "bottlenecks_detected": 17, "optimization_suggestions": 43}');

SELECT 'Clean core tables deployment completed! 🚀' as status; 