-- =====================================================
-- POSTGRESQL-COMPATIBLE DATABASE DEPLOYMENT FOR TRENDZO
-- Fixes function compatibility issues for Supabase
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables that might have conflicts (in dependency order)
DROP TABLE IF EXISTS video_framework_mapping CASCADE;
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
DROP TABLE IF EXISTS viral_video_gallery CASCADE;

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

-- MODULE 6: Recipe Book Generator (must be created before framework mappings)
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

-- Viral Video Gallery for Value Template Editor (must be created before framework mappings)
CREATE TABLE viral_video_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    creator_name VARCHAR(100) NOT NULL,
    thumbnail_url TEXT,
    view_count INTEGER DEFAULT 0,
    viral_score DECIMAL(5,2) DEFAULT 0,
    platform VARCHAR(20) DEFAULT 'tiktok',
    duration_seconds INTEGER DEFAULT 30,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    transcript TEXT,
    viral_elements JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Framework Mapping table (depends on both above tables)
CREATE TABLE video_framework_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES viral_video_gallery(id),
    framework_id UUID NOT NULL REFERENCES viral_recipe_book(id),
    mapping_confidence DECIMAL(5,4) DEFAULT 0.95,
    workspace_config_cached JSONB,
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

-- MODULE 11: System Health Monitor
CREATE TABLE system_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'error', 'warning', 'maintenance')),
    metrics JSONB DEFAULT '{}',
    error_details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional support tables
CREATE TABLE viral_dna_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    sequence_data JSONB NOT NULL,
    pattern_scores JSONB DEFAULT '{}',
    viral_indicators JSONB DEFAULT '{}',
    confidence_score DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE script_intelligence_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    transcript TEXT,
    linguistic_patterns JSONB DEFAULT '{}',
    emotional_markers JSONB DEFAULT '{}',
    viral_script_score DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    generated_content JSONB NOT NULL,
    performance_metrics JSONB DEFAULT '{}',
    viral_success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE process_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_session TEXT NOT NULL,
    process_step VARCHAR(100) NOT NULL,
    step_data JSONB DEFAULT '{}',
    duration_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_featured ON viral_video_gallery(is_featured, display_order);
CREATE INDEX IF NOT EXISTS idx_viral_video_gallery_viral_score ON viral_video_gallery(viral_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_framework_mapping_video_id ON video_framework_mapping(video_id);
CREATE INDEX IF NOT EXISTS idx_video_framework_mapping_framework_id ON video_framework_mapping(framework_id);
CREATE INDEX IF NOT EXISTS idx_viral_recipe_book_status ON viral_recipe_book(status);
CREATE INDEX IF NOT EXISTS idx_viral_recipe_book_effectiveness ON viral_recipe_book(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_prediction_validation_video_id ON prediction_validation(video_id);
CREATE INDEX IF NOT EXISTS idx_prediction_validation_status ON prediction_validation(validation_status);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_module ON system_health_logs(module_name);
CREATE INDEX IF NOT EXISTS idx_system_health_logs_timestamp ON system_health_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_level ON system_alerts(level);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- =====================================================
-- POPULATE INITIAL DATA (PostgreSQL-compatible)
-- =====================================================

-- Insert initial data for Recipe Book (HOT templates)
INSERT INTO viral_recipe_book (recipe_name, template_type, viral_elements, status, effectiveness_score) VALUES
('Authority Hook', 'hook', 
    '{"pattern": "credibility_statement", "timing": "first_3_seconds", "elements": ["expertise_claim", "results_proof", "specific_numbers"], "emotional_triggers": ["curiosity", "aspiration", "authority"], "optimal_duration": 30, "hook_timing": 3, "proof_requirements": ["numerical_evidence", "credentials", "social_proof"]}'::jsonb, 
    'HOT', 0.89),
('Before/After Transformation', 'structure', 
    '{"pattern": "transformation", "timing": "throughout", "elements": ["initial_state", "process", "final_result", "emotional_journey"], "emotional_triggers": ["relatability", "hope", "inspiration"], "optimal_duration": 45, "hook_timing": 3, "proof_requirements": ["visual_evidence", "time_progression", "dramatic_change"]}'::jsonb, 
    'HOT', 0.86),
('Secret Knowledge Reveal', 'hook', 
    '{"pattern": "curiosity_gap", "timing": "first_5_seconds", "elements": ["insider_info", "exclusive_access", "surprising_insight"], "emotional_triggers": ["curiosity", "exclusivity", "fomo"], "optimal_duration": 35, "hook_timing": 5, "proof_requirements": ["credible_source", "immediate_value", "actionable_insight"]}'::jsonb, 
    'HOT', 0.82),
('POV Relatability', 'hook', 
    '{"pattern": "point_of_view", "timing": "immediate", "elements": ["common_experience", "emotional_connection"], "emotional_triggers": ["relatability", "nostalgia", "shared_struggle"], "optimal_duration": 30, "hook_timing": 2, "proof_requirements": ["authentic_emotion", "universal_experience", "relatable_scenario"]}'::jsonb, 
    'HOT', 0.79),
('Quick Tutorial Format', 'structure', 
    '{"pattern": "educational", "timing": "60_seconds", "elements": ["problem_identification", "step_by_step", "result_showcase"], "emotional_triggers": ["empowerment", "accomplishment", "value"], "optimal_duration": 60, "hook_timing": 3, "proof_requirements": ["clear_steps", "immediate_value", "actionable_content"]}'::jsonb, 
    'HOT', 0.77),
('Challenge Documentation', 'structure', 
    '{"pattern": "progress_journey", "timing": "documentary_style", "elements": ["initial_commitment", "daily_updates", "final_transformation"], "emotional_triggers": ["inspiration", "accountability", "possibility"], "optimal_duration": 50, "hook_timing": 3, "proof_requirements": ["consistent_documentation", "visible_progress", "authentic_struggle"]}'::jsonb, 
    'HOT', 0.81);

-- Insert realistic viral video gallery data for Value Template Editor
INSERT INTO viral_video_gallery (
    title, creator_name, thumbnail_url, view_count, viral_score, 
    platform, duration_seconds, is_featured, display_order, transcript, viral_elements
) VALUES 
(
    'How I Built a 7-Figure Business in 6 Months',
    'entrepreneurmindset',
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=600&fit=crop&auto=format',
    2400000,
    94.2,
    'tiktok',
    58,
    true,
    1,
    'Everyone told me I was crazy when I quit my $200k job to start this business. But in 6 months, I built a 7-figure company. Here''s exactly how I did it...',
    '{"framework": "authority", "hook_type": "credibility_gap", "emotional_triggers": ["curiosity", "aspiration"], "proof_elements": ["specific_numbers", "transformation"]}'::jsonb
),
(
    'This Morning Routine Changed My Life',
    'productivityguru',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop&auto=format',
    1800000,
    91.7,
    'tiktok',
    45,
    true,
    2,
    'I used to wake up at 11am feeling terrible. Then I discovered this 5-step morning routine that completely transformed my life. Now I wake up at 5am energized...',
    '{"framework": "storytelling", "hook_type": "transformation", "emotional_triggers": ["relatability", "hope"], "proof_elements": ["before_after", "specific_steps"]}'::jsonb
),
(
    'Secret Productivity Hack Nobody Talks About',
    'lifehacker_official',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop&auto=format',
    1500000,
    89.3,
    'tiktok',
    32,
    true,
    3,
    'I''ve tried every productivity hack out there. But this one secret method increased my output by 300%. It''s so simple yet nobody talks about it...',
    '{"framework": "authority", "hook_type": "secret_knowledge", "emotional_triggers": ["curiosity", "exclusivity"], "proof_elements": ["percentage_improvement", "social_proof"]}'::jsonb
),
(
    'POV: You Just Discovered Your Passion',
    'creativesoul',
    'https://images.unsplash.com/photo-1494790108755-2616c27de05c?w=400&h=600&fit=crop&auto=format',
    1200000,
    87.8,
    'tiktok',
    28,
    true,
    4,
    'POV: You''ve been working a job you hate for 5 years. Then one random Tuesday, you try something new and everything clicks. This is that moment...',
    '{"framework": "storytelling", "hook_type": "pov_relatable", "emotional_triggers": ["relatability", "hope", "inspiration"], "proof_elements": ["shared_experience", "emotional_journey"]}'::jsonb
),
(
    'Psychology Trick That Makes People Listen',
    'psychologyhacks',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop&auto=format',
    980000,
    85.4,
    'tiktok',
    41,
    true,
    5,
    'Want people to actually listen when you speak? Use this psychology trick that makes anyone pay attention to every word you say. It''s backed by science...',
    '{"framework": "authority", "hook_type": "psychology_authority", "emotional_triggers": ["curiosity", "social_improvement"], "proof_elements": ["science_backing", "immediate_application"]}'::jsonb
),
(
    'Before vs After: 30 Days of This Habit',
    'transformationtuesday',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop&auto=format',
    850000,
    83.9,
    'tiktok',
    52,
    true,
    6,
    'I challenged myself to do this one thing every day for 30 days. The transformation was insane. Day 1 vs Day 30 will shock you...',
    '{"framework": "hero", "hook_type": "challenge_documentation", "emotional_triggers": ["inspiration", "possibility"], "proof_elements": ["visual_proof", "time_progression"]}'::jsonb
);

-- Insert framework mappings for each video using WITH clause for better PostgreSQL compatibility
WITH video_recipe_pairs AS (
  SELECT 
    v.id as video_id,
    r.id as framework_id,
    v.title,
    v.duration_seconds,
    r.recipe_name
  FROM viral_video_gallery v
  CROSS JOIN viral_recipe_book r
  WHERE 
    (v.title LIKE '%Built a 7-Figure Business%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Morning Routine%' AND r.recipe_name = 'Before/After Transformation') OR
    (v.title LIKE '%Secret Productivity%' AND r.recipe_name = 'Secret Knowledge Reveal') OR
    (v.title LIKE '%POV: You Just%' AND r.recipe_name = 'POV Relatability') OR
    (v.title LIKE '%Psychology Trick%' AND r.recipe_name = 'Authority Hook') OR
    (v.title LIKE '%Before vs After%' AND r.recipe_name = 'Challenge Documentation')
)
INSERT INTO video_framework_mapping (video_id, framework_id, mapping_confidence, workspace_config_cached)
SELECT 
  video_id,
  framework_id,
  0.95,
  jsonb_build_object(
    'workspaceId', 'ws_' || extract(epoch from now())::text || '_' || substring(video_id::text, 1, 8),
    'suggestedHooks', CASE 
      WHEN recipe_name = 'Authority Hook' THEN 
        '["Establish your credentials immediately", "Share specific results or numbers", "Use authoritative language"]'::jsonb
      WHEN recipe_name = 'Before/After Transformation' THEN 
        '["Show the dramatic change", "Reveal the simple method", "Connect with viewer struggle"]'::jsonb
      WHEN recipe_name = 'Secret Knowledge Reveal' THEN 
        '["Promise exclusive information", "Build curiosity gap", "Deliver surprising insight"]'::jsonb
      WHEN recipe_name = 'POV Relatability' THEN 
        '["Start with relatable scenario", "Build emotional connection", "Show transformation possibility"]'::jsonb
      WHEN recipe_name = 'Quick Tutorial Format' THEN 
        '["Identify common problem", "Promise quick solution", "Deliver step-by-step value"]'::jsonb
      ELSE '["Hook viewer attention", "Build curiosity", "Deliver on promise"]'::jsonb
    END,
    'timingGuidance', jsonb_build_object(
      'optimal_duration', duration_seconds,
      'hook_timing_seconds', 3,
      'peak_moment_seconds', duration_seconds * 0.5,
      'call_to_action_timing', duration_seconds * 0.8
    ),
    'visualElements', jsonb_build_object(
      'recommended_colors', '["#1f2937", "#3b82f6", "#10b981"]'::jsonb,
      'visual_style', 'authentic',
      'camera_angles', '["close-up", "medium-shot"]'::jsonb,
      'transition_suggestions', '["cut", "fade"]'::jsonb
    ),
    'scriptGuidance', jsonb_build_object(
      'tone', 'conversational',
      'style_hints', '["be authentic", "tell a story", "provide value"]'::jsonb
    )
  )
FROM video_recipe_pairs;

-- Insert prediction validation data using PostgreSQL-compatible syntax
INSERT INTO prediction_validation (prediction_id, video_id, predicted_viral_score, actual_viral_score, predicted_views, actual_views, validation_timestamp, accuracy_percentage, validation_status) 
SELECT 
    gen_random_uuid() as prediction_id,
    id::text as video_id,
    viral_score as predicted_viral_score,
    viral_score + (random() * 4 - 2) as actual_viral_score,
    view_count as predicted_views,
    view_count + (random() * 200000 - 100000)::int as actual_views,
    NOW() - interval '48 hours' as validation_timestamp,
    -- Fixed PostgreSQL-compatible ROUND function
    ROUND((95 + random() * 5)::numeric, 2) as accuracy_percentage,
    'completed' as validation_status
FROM viral_video_gallery
WHERE is_featured = true;

-- Insert system health monitoring entries for all 12 modules
INSERT INTO system_health_logs (module_name, status, metrics) VALUES
('TikTok_Scraper', 'active', '{"uptime": 99.8, "videos_processed": 24891, "last_run": "2025-01-15T10:00:00Z"}'::jsonb),
('Viral_Pattern_Analyzer', 'active', '{"patterns_detected": 47, "accuracy": 91.3, "processing_speed": "2.1s"}'::jsonb),
('Template_Discovery_Engine', 'active', '{"templates_generated": 156, "success_rate": 78.4, "hot_templates": 23}'::jsonb),
('Draft_Video_Analyzer', 'active', '{"analyses_completed": 8934, "avg_analysis_time": "4.2s", "accuracy": 89.7}'::jsonb),
('Script_Intelligence_Module', 'active', '{"scripts_analyzed": 12847, "viral_patterns": 342, "accuracy": 85.6}'::jsonb),
('Recipe_Book_Generator', 'active', '{"recipes_active": 89, "hot_recipes": 23, "cooling_recipes": 31}'::jsonb),
('Prediction_Engine', 'active', '{"predictions_made": 15672, "accuracy": 91.3, "confidence": 0.89}'::jsonb),
('Performance_Validator', 'active', '{"validations_completed": 14523, "accuracy_verified": 91.3, "false_positives": 8.7}'::jsonb),
('Marketing_Content_Creator', 'active', '{"campaigns_generated": 234, "viral_success_rate": 67.8, "engagement_boost": 340}'::jsonb),
('Dashboard_Aggregator', 'active', '{"data_points": 1847293, "update_frequency": "real_time", "uptime": 99.9}'::jsonb),
('System_Health_Monitor', 'active', '{"modules_monitored": 12, "alerts_sent": 23, "average_uptime": 99.2}'::jsonb),
('Process_Intelligence_Layer', 'active', '{"user_journeys_tracked": 5672, "bottlenecks_detected": 17, "optimization_suggestions": 43}'::jsonb);

-- Final verification query
SELECT 'PostgreSQL-compatible database deployment completed! 🚀' as status,
       (SELECT COUNT(*) FROM viral_video_gallery) as viral_videos_count,
       (SELECT COUNT(*) FROM video_framework_mapping) as framework_mappings_count,
       (SELECT COUNT(*) FROM viral_recipe_book) as recipe_book_count,
       (SELECT COUNT(*) FROM prediction_validation) as validations_count,
       (SELECT COUNT(*) FROM system_health_logs) as health_logs_count; 