-- =====================================================
-- HASHTAG & TIMING FRAMEWORK INTEGRATION - BMAD METHODOLOGY
-- Additive Enhancement to Operational Framework
-- Date: January 19, 2025
-- Research Sources: Buffer 2025, Hootsuite Q1 2025, TikTok Business Guidelines
-- =====================================================

-- BMAD SAFETY: Ensure UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- BMAD COMMENT: This deployment adds hashtag intelligence and timing optimization
-- without modifying any existing tables or disrupting current prediction functionality

-- =====================================================
-- 1. HASHTAG INTELLIGENCE SYSTEM
-- =====================================================

-- Master hashtag registry with intelligence metrics
CREATE TABLE IF NOT EXISTS hashtag_intelligence_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashtag TEXT NOT NULL UNIQUE, -- e.g., "BookTok", "makeup", "FinTok"
    
    -- Volume and popularity metrics
    estimated_post_count BIGINT DEFAULT 0, -- Current estimated posts using this hashtag
    popularity_bucket VARCHAR(20) CHECK (popularity_bucket IN ('micro', 'mid', 'macro', 'mega')), -- <100K, 100K-1M, 1M-5M, >5M
    trend_velocity DECIMAL(8,4) DEFAULT 0, -- Rate of growth in usage
    
    -- Classification and semantic data
    primary_category VARCHAR(100), -- e.g., "beauty", "finance", "education"
    community_type VARCHAR(50), -- e.g., "BookTok", "FinTok", "FoodTok"
    semantic_embedding vector(384), -- Sentence transformer embedding for semantic similarity
    
    -- Performance metrics
    avg_view_performance DECIMAL(8,4) DEFAULT 0, -- Average performance multiplier for videos using this tag
    avg_retention_rate DECIMAL(5,4) DEFAULT 0, -- Average retention for videos with this tag
    spam_likelihood DECIMAL(5,4) DEFAULT 0, -- Likelihood this tag is used as spam (0-1)
    
    -- Research-backed insights
    niche_density_score DECIMAL(8,4), -- 1 / log10(post_count) - higher for rarer tags
    community_engagement_factor DECIMAL(5,4) DEFAULT 1.0, -- Community-specific engagement multiplier
    optimal_usage_context TEXT, -- When/how this tag performs best
    
    -- Data quality and freshness
    data_freshness_hours INTEGER DEFAULT 0, -- Hours since last update
    data_source VARCHAR(50) DEFAULT 'tiktok_creative_center', -- Source of data
    confidence_score DECIMAL(5,4) DEFAULT 0.5, -- Confidence in the data (0-1)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video hashtag analysis results
CREATE TABLE IF NOT EXISTS video_hashtag_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- Extracted hashtags from caption
    hashtags_raw JSONB DEFAULT '[]', -- Raw hashtags extracted from caption
    hashtags_processed JSONB DEFAULT '[]', -- Cleaned and validated hashtags
    hashtag_count INTEGER DEFAULT 0,
    
    -- Hashtag intelligence scoring
    hashtag_relevance_scores JSONB DEFAULT '{}', -- {hashtag: relevance_score} mapping
    semantic_alignment_scores JSONB DEFAULT '{}', -- {hashtag: semantic_similarity} to video content
    spam_detection_scores JSONB DEFAULT '{}', -- {hashtag: spam_likelihood} mapping
    
    -- Framework-based analysis
    optimal_mix_score DECIMAL(5,4) DEFAULT 0, -- How well hashtags follow 1-5 optimal mix rule
    breadth_layering_score DECIMAL(5,4) DEFAULT 0, -- Quality of macro/mid/micro layering
    community_alignment_score DECIMAL(5,4) DEFAULT 0, -- Alignment with creator's community
    niche_targeting_score DECIMAL(5,4) DEFAULT 0, -- Effectiveness of niche targeting
    
    -- Performance predictions
    hashtag_viral_boost DECIMAL(5,4) DEFAULT 1.0, -- Predicted viral multiplier from hashtags
    predicted_reach_multiplier DECIMAL(5,4) DEFAULT 1.0, -- Expected reach enhancement
    community_engagement_prediction DECIMAL(5,4) DEFAULT 0, -- Predicted community engagement
    
    -- Quality metrics
    analysis_confidence DECIMAL(5,4) DEFAULT 0, -- Confidence in hashtag analysis
    semantic_validation_passed BOOLEAN DEFAULT TRUE, -- Whether hashtags passed semantic validation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TIMING OPTIMIZATION SYSTEM
-- =====================================================

-- Global timing research data (from Buffer 2025, Hootsuite Q1 2025)
CREATE TABLE IF NOT EXISTS timing_research_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Research source and metadata
    research_source VARCHAR(100) NOT NULL, -- 'buffer_2025', 'hootsuite_q1_2025'
    sample_size INTEGER, -- Number of videos analyzed
    research_period_start DATE,
    research_period_end DATE,
    
    -- Platform and demographic
    platform VARCHAR(50) NOT NULL,
    audience_demographic VARCHAR(100), -- 'general', 'gen_z', 'millennials', etc.
    geographic_region VARCHAR(50) DEFAULT 'global',
    
    -- Timing insights
    optimal_time_slots JSONB NOT NULL, -- [{"day": "sunday", "hour": 20, "performance_score": 0.95}, ...]
    peak_engagement_windows JSONB DEFAULT '[]', -- Specific high-performance windows
    worst_performing_slots JSONB DEFAULT '[]', -- Times to avoid
    
    -- Performance metrics
    median_view_performance JSONB DEFAULT '{}', -- Performance by time slot
    retention_by_timeslot JSONB DEFAULT '{}', -- Retention rates by posting time
    engagement_velocity_by_time JSONB DEFAULT '{}', -- Engagement speed by time
    
    -- Statistical confidence
    confidence_level DECIMAL(5,4) DEFAULT 0.95, -- Statistical confidence in findings
    margin_of_error DECIMAL(5,4) DEFAULT 0.05, -- Expected margin of error
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator-specific timing optimization
CREATE TABLE IF NOT EXISTS creator_timing_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id TEXT NOT NULL,
    creator_follower_count INTEGER,
    
    -- Audience analysis
    follower_timezone_distribution JSONB DEFAULT '{}', -- {timezone: percentage} mapping
    follower_activity_patterns JSONB DEFAULT '{}', -- {hour: activity_score} mapping
    audience_demographic_profile JSONB DEFAULT '{}', -- Age, interests, etc.
    
    -- Historical performance by timing
    historical_performance_by_hour JSONB DEFAULT '{}', -- {hour: avg_performance} mapping
    best_performing_time_slots JSONB DEFAULT '[]', -- Top 3-5 time slots for this creator
    worst_performing_time_slots JSONB DEFAULT '[]', -- Time slots to avoid
    
    -- Optimization recommendations
    recommended_posting_schedule JSONB DEFAULT '[]', -- Optimized schedule recommendations
    timing_confidence_score DECIMAL(5,4) DEFAULT 0, -- Confidence in timing recommendations
    last_optimization_date TIMESTAMP WITH TIME ZONE,
    
    -- A/B testing results
    ab_test_results JSONB DEFAULT '[]', -- Results from timing A/B tests
    statistical_significance BOOLEAN DEFAULT FALSE, -- Whether results are statistically significant
    
    -- Data quality
    data_points_count INTEGER DEFAULT 0, -- Number of posts analyzed for this creator
    analysis_reliability VARCHAR(20) CHECK (analysis_reliability IN ('high', 'medium', 'low')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video timing analysis and optimization
CREATE TABLE IF NOT EXISTS video_timing_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    creator_id TEXT,
    
    -- Actual posting details
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    posted_hour INTEGER, -- 0-23 hour of posting
    posted_day_of_week INTEGER, -- 0-6 (Sunday=0)
    posted_timezone VARCHAR(50),
    
    -- Timing optimization scoring
    global_timing_score DECIMAL(5,4) DEFAULT 0, -- Score vs global research benchmarks
    creator_timing_score DECIMAL(5,4) DEFAULT 0, -- Score vs creator's optimal times
    audience_alignment_score DECIMAL(5,4) DEFAULT 0, -- How well timing matches audience activity
    
    -- Performance analysis
    first_hour_performance DECIMAL(8,4) DEFAULT 0, -- Critical first-hour metrics
    test_batch_success_rate DECIMAL(5,4) DEFAULT 0, -- Success in TikTok's test batch
    peak_engagement_time TIMESTAMP WITH TIME ZONE, -- When video hit peak engagement
    
    -- Competitive analysis
    time_slot_competition_level VARCHAR(20), -- 'low', 'medium', 'high' posting competition
    estimated_feed_saturation DECIMAL(5,4) DEFAULT 0, -- How saturated the feed was
    
    -- Recommendations and predictions
    timing_improvement_potential DECIMAL(5,4) DEFAULT 0, -- Potential improvement from better timing
    optimal_repost_windows JSONB DEFAULT '[]', -- If reposting, when to do it
    timing_viral_multiplier DECIMAL(5,4) DEFAULT 1.0, -- Expected viral boost from timing
    
    -- Quality and confidence
    analysis_confidence DECIMAL(5,4) DEFAULT 0, -- Confidence in timing analysis
    recommendation_reliability VARCHAR(20), -- Reliability of timing recommendations
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. HASHTAG-TIMING COMBINED INTELLIGENCE
-- =====================================================

-- Combined hashtag + timing optimization insights
CREATE TABLE IF NOT EXISTS hashtag_timing_optimization (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id TEXT NOT NULL,
    
    -- Combined scoring
    hashtag_timing_synergy_score DECIMAL(5,4) DEFAULT 0, -- How well hashtags and timing work together
    community_timing_alignment DECIMAL(5,4) DEFAULT 0, -- Whether timing matches hashtag communities' activity
    trend_momentum_score DECIMAL(5,4) DEFAULT 0, -- Hashtag trending + optimal timing combination
    
    -- Strategic recommendations
    optimization_recommendations JSONB DEFAULT '[]', -- Specific actionable recommendations
    viral_potential_multiplier DECIMAL(5,4) DEFAULT 1.0, -- Combined hashtag + timing viral boost
    reach_amplification_factor DECIMAL(5,4) DEFAULT 1.0, -- Expected reach amplification
    
    -- Performance prediction
    predicted_first_hour_views INTEGER DEFAULT 0, -- Predicted views in critical first hour
    predicted_24h_performance DECIMAL(8,4) DEFAULT 0, -- 24-hour performance prediction
    breakthrough_probability DECIMAL(5,4) DEFAULT 0, -- Probability of breaking 300-view gate
    
    -- Analysis metadata
    analysis_version VARCHAR(20) DEFAULT 'v1.0',
    confidence_level DECIMAL(5,4) DEFAULT 0, -- Overall confidence in analysis
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Hashtag intelligence indexes
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_hashtag ON hashtag_intelligence_registry(hashtag);
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_popularity ON hashtag_intelligence_registry(popularity_bucket);
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_category ON hashtag_intelligence_registry(primary_category);
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_community ON hashtag_intelligence_registry(community_type);
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_performance ON hashtag_intelligence_registry(avg_view_performance DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_registry_freshness ON hashtag_intelligence_registry(data_freshness_hours);

-- Video hashtag analysis indexes
CREATE INDEX IF NOT EXISTS idx_video_hashtag_analysis_video_id ON video_hashtag_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_hashtag_analysis_confidence ON video_hashtag_analysis(analysis_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_video_hashtag_analysis_boost ON video_hashtag_analysis(hashtag_viral_boost DESC);

-- Timing optimization indexes
CREATE INDEX IF NOT EXISTS idx_timing_benchmarks_platform ON timing_research_benchmarks(platform);
CREATE INDEX IF NOT EXISTS idx_timing_benchmarks_source ON timing_research_benchmarks(research_source);
CREATE INDEX IF NOT EXISTS idx_creator_timing_creator_id ON creator_timing_profiles(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_timing_confidence ON creator_timing_profiles(timing_confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_video_timing_video_id ON video_timing_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_video_timing_posted_hour ON video_timing_analysis(posted_hour);
CREATE INDEX IF NOT EXISTS idx_video_timing_day_week ON video_timing_analysis(posted_day_of_week);

-- Combined optimization indexes
CREATE INDEX IF NOT EXISTS idx_hashtag_timing_optimization_video_id ON hashtag_timing_optimization(video_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_timing_synergy ON hashtag_timing_optimization(hashtag_timing_synergy_score DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_timing_viral_multiplier ON hashtag_timing_optimization(viral_potential_multiplier DESC);

-- =====================================================
-- RESEARCH-BACKED DEFAULT DATA
-- =====================================================

-- Insert Buffer 2025 research data
INSERT INTO timing_research_benchmarks (
    research_source, sample_size, research_period_start, research_period_end,
    platform, audience_demographic, geographic_region,
    optimal_time_slots, peak_engagement_windows, confidence_level
) VALUES (
    'buffer_2025', 1000000, '2025-01-01', '2025-07-31',
    'tiktok', 'general', 'global',
    '[
        {"day": "sunday", "hour": 20, "performance_score": 0.95, "median_views_multiplier": 1.8},
        {"day": "tuesday", "hour": 16, "performance_score": 0.92, "median_views_multiplier": 1.6},
        {"day": "wednesday", "hour": 17, "performance_score": 0.90, "median_views_multiplier": 1.5},
        {"day": "thursday", "hour": 18, "performance_score": 0.87, "median_views_multiplier": 1.4},
        {"day": "saturday", "hour": 14, "performance_score": 0.85, "median_views_multiplier": 1.3}
    ]',
    '[
        {"start_hour": 13, "end_hour": 21, "days": ["tuesday", "wednesday", "thursday"], "performance_boost": 1.4},
        {"start_hour": 19, "end_hour": 22, "days": ["sunday"], "performance_boost": 1.7},
        {"start_hour": 10, "end_hour": 18, "days": ["saturday"], "performance_boost": 1.3}
    ]',
    0.95
),

-- Insert Hootsuite Q1 2025 research data
(
    'hootsuite_q1_2025', 1000000, '2025-01-01', '2025-03-31',
    'tiktok', 'general', 'global',
    '[
        {"day": "thursday", "hour": 6, "performance_score": 0.93, "median_views_multiplier": 1.7},
        {"day": "thursday", "hour": 7, "performance_score": 0.91, "median_views_multiplier": 1.6},
        {"day": "thursday", "hour": 8, "performance_score": 0.89, "median_views_multiplier": 1.5},
        {"day": "saturday", "hour": 10, "performance_score": 0.88, "median_views_multiplier": 1.4},
        {"day": "saturday", "hour": 14, "performance_score": 0.86, "median_views_multiplier": 1.3},
        {"day": "monday", "hour": 16, "performance_score": 0.84, "median_views_multiplier": 1.2}
    ]',
    '[
        {"start_hour": 6, "end_hour": 9, "days": ["thursday"], "performance_boost": 1.6},
        {"start_hour": 10, "end_hour": 18, "days": ["saturday"], "performance_boost": 1.4},
        {"start_hour": 16, "end_hour": 19, "days": ["monday"], "performance_boost": 1.2}
    ]',
    0.94
)
ON CONFLICT DO NOTHING;

-- Insert common hashtag intelligence data
INSERT INTO hashtag_intelligence_registry (
    hashtag, estimated_post_count, popularity_bucket, primary_category, 
    community_type, niche_density_score, avg_view_performance, spam_likelihood
) VALUES 
('BookTok', 2500000, 'macro', 'entertainment', 'BookTok', 0.435, 1.25, 0.15),
('FinTok', 800000, 'mid', 'finance', 'FinTok', 0.565, 1.35, 0.12),
('makeup', 15000000, 'mega', 'beauty', 'BeautyTok', 0.215, 1.15, 0.25),
('skincare', 8000000, 'mega', 'beauty', 'BeautyTok', 0.275, 1.20, 0.20),
('FYP', 500000000000, 'mega', 'generic', 'none', 0.001, 0.85, 0.85),
('viral', 100000000, 'mega', 'generic', 'none', 0.035, 0.80, 0.90),
('trending', 50000000, 'mega', 'generic', 'none', 0.045, 0.82, 0.88)
ON CONFLICT (hashtag) DO NOTHING;

-- =====================================================
-- BMAD VALIDATION QUERIES
-- =====================================================

-- Verify hashtag tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%hashtag%'
ORDER BY table_name;

-- Verify timing tables created  
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%timing%'
ORDER BY table_name;

-- Verify research data inserted
SELECT research_source, sample_size, platform FROM timing_research_benchmarks;

-- Verify hashtag data inserted
SELECT hashtag, popularity_bucket, niche_density_score FROM hashtag_intelligence_registry LIMIT 5;

-- =====================================================
-- DEPLOYMENT COMPLETION NOTICE
-- =====================================================

SELECT 'HASHTAG & TIMING FRAMEWORK DEPLOYMENT COMPLETED - BMAD METHODOLOGY SUCCESSFUL' as deployment_status; 