-- ============================================
-- BRIDGE TABLES TO CONNECT EXISTING & NEW DATA (FIXED VERSION)
-- Creates connections between your existing tables and viral prediction system
-- ============================================

-- Add viral prediction columns to existing tables (if they don't exist)

-- Extend your existing templates table with viral prediction fields
DO $$
BEGIN
    -- Add viral prediction columns to templates if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'viral_score') THEN
        ALTER TABLE templates ADD COLUMN viral_score DECIMAL(10, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'viral_probability') THEN
        ALTER TABLE templates ADD COLUMN viral_probability DECIMAL(5, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'cohort_percentile') THEN
        ALTER TABLE templates ADD COLUMN cohort_percentile DECIMAL(5, 2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'prediction_confidence') THEN
        ALTER TABLE templates ADD COLUMN prediction_confidence DECIMAL(5, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'templates' AND column_name = 'last_analyzed') THEN
        ALTER TABLE templates ADD COLUMN last_analyzed TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Extend tiktok_templates with viral prediction links
DO $$
BEGIN
    -- Add link to videos table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tiktok_templates' AND column_name = 'video_analysis_id') THEN
        ALTER TABLE tiktok_templates ADD COLUMN video_analysis_id UUID REFERENCES videos(id);
    END IF;
    
    -- Add quick viral indicators
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tiktok_templates' AND column_name = 'is_viral') THEN
        ALTER TABLE tiktok_templates ADD COLUMN is_viral BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tiktok_templates' AND column_name = 'viral_category') THEN
        ALTER TABLE tiktok_templates ADD COLUMN viral_category VARCHAR(50); -- 'mega-viral', 'hyper-viral', 'viral', 'trending', 'normal'
    END IF;
END
$$;

-- Extend sounds table with viral analysis
DO $$
BEGIN
    -- Add viral tracking to sounds
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sounds' AND column_name = 'viral_usage_count') THEN
        ALTER TABLE sounds ADD COLUMN viral_usage_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sounds' AND column_name = 'trend_lifecycle_position') THEN
        ALTER TABLE sounds ADD COLUMN trend_lifecycle_position VARCHAR(50); -- 'emerging', 'rising', 'peak', 'declining', 'dead'
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sounds' AND column_name = 'trend_started_at') THEN
        ALTER TABLE sounds ADD COLUMN trend_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sounds' AND column_name = 'viral_effectiveness_score') THEN
        ALTER TABLE sounds ADD COLUMN viral_effectiveness_score DECIMAL(5, 4);
    END IF;
END
$$;

-- Extend analytics table with God Mode metrics
DO $$
BEGIN
    -- Add God Mode analytics columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'psychological_score') THEN
        ALTER TABLE analytics ADD COLUMN psychological_score DECIMAL(5, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'authenticity_balance') THEN
        ALTER TABLE analytics ADD COLUMN authenticity_balance DECIMAL(5, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'timing_score') THEN
        ALTER TABLE analytics ADD COLUMN timing_score DECIMAL(5, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analytics' AND column_name = 'god_mode_factors') THEN
        ALTER TABLE analytics ADD COLUMN god_mode_factors JSONB DEFAULT '{}';
    END IF;
END
$$;

-- Create bridge/mapping tables

-- 1. Template to Video Analysis Bridge
CREATE TABLE IF NOT EXISTS template_video_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id BIGINT, -- Reference to your existing templates table (assuming BIGINT)
    tiktok_template_id BIGINT, -- Reference to your tiktok_templates table (assuming BIGINT)
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50), -- 'initial', 'reanalysis', 'performance_check'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Viral Preferences (extends user_profiles)
CREATE TABLE IF NOT EXISTS user_viral_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT, -- Reference to your existing users table (assuming BIGINT)
    preferred_hook_types JSONB DEFAULT '[]',
    god_mode_enabled BOOLEAN DEFAULT false,
    inception_mode_access BOOLEAN DEFAULT false,
    target_accuracy_threshold DECIMAL(5, 2) DEFAULT 80.0,
    auto_optimization_enabled BOOLEAN DEFAULT true,
    preferred_platforms JSONB DEFAULT '["tiktok"]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sound Viral History (connects to your sounds table)
CREATE TABLE IF NOT EXISTS sound_viral_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sound_id BIGINT, -- Reference to your existing sounds table (assuming BIGINT)
    usage_date DATE NOT NULL,
    video_count INTEGER DEFAULT 0,
    viral_video_count INTEGER DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    viral_effectiveness DECIMAL(5, 4),
    trend_position VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Expert Insight Enhancement (extends your expert_insights table)
CREATE TABLE IF NOT EXISTS expert_insight_enhancements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_insight_id BIGINT, -- Reference to your existing expert_insights table (assuming BIGINT)
    ai_validation_score DECIMAL(5, 4),
    god_mode_factors JSONB DEFAULT '{}',
    prediction_impact DECIMAL(5, 4),
    accuracy_improvement DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREATE VIEWS FOR EASY ACCESS (FIXED TYPE CASTS)
-- ============================================

-- 1. Complete Video Analysis View (with proper type casting)
CREATE OR REPLACE VIEW video_complete_analysis AS
SELECT 
    v.*,
    t.name as template_name,
    t.category as template_category,
    s.name as sound_name,
    s.trend_lifecycle_position,
    pe.emotional_arousal_score,
    pe.arousal_type,
    pq.authenticity_score,
    pq.shot_pacing_score,
    pa.second_person_percentage,
    pp.duet_potential_score,
    ct.timing_score,
    ct.trend_position,
    ap.formula_disguise_effectiveness
FROM videos v
LEFT JOIN templates t ON v.template_id::text = t.id::text
LEFT JOIN sounds s ON v.sound_id::text = s.id::text
LEFT JOIN psychological_engagement pe ON v.id = pe.video_id
LEFT JOIN production_quality pq ON v.id = pq.video_id
LEFT JOIN perspective_analysis pa ON v.id = pa.video_id
LEFT JOIN participation_potential pp ON v.id = pp.video_id
LEFT JOIN cultural_timing ct ON v.id = ct.video_id
LEFT JOIN authenticity_paradox ap ON v.id = ap.video_id;

-- 2. Viral Performance Dashboard View
CREATE OR REPLACE VIEW viral_performance_dashboard AS
SELECT 
    DATE(v.upload_timestamp) as analysis_date,
    COUNT(*) as videos_analyzed,
    COUNT(CASE WHEN v.viral_probability > 0.7 THEN 1 END) as predicted_viral,
    COUNT(CASE WHEN v.cohort_percentile >= 95 THEN 1 END) as actually_viral,
    AVG(v.viral_score) as avg_viral_score,
    AVG(pe.emotional_arousal_score) as avg_emotional_score,
    AVG(pq.authenticity_score) as avg_authenticity_score,
    AVG(ct.timing_score) as avg_timing_score
FROM videos v
LEFT JOIN psychological_engagement pe ON v.id = pe.video_id
LEFT JOIN production_quality pq ON v.id = pq.video_id
LEFT JOIN cultural_timing ct ON v.id = ct.video_id
WHERE v.upload_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(v.upload_timestamp)
ORDER BY analysis_date DESC;

-- 3. Hook Effectiveness View
CREATE OR REPLACE VIEW hook_effectiveness_analysis AS
SELECT 
    hf.name as hook_name,
    hf.category,
    hf.success_rate as baseline_success_rate,
    COUNT(vh.*) as videos_with_hook,
    AVG(v.viral_probability) as avg_viral_probability,
    AVG(v.cohort_percentile) as avg_percentile,
    COUNT(CASE WHEN v.cohort_percentile >= 95 THEN 1 END) as viral_count,
    ROUND(
        (COUNT(CASE WHEN v.cohort_percentile >= 95 THEN 1 END) * 100.0 / NULLIF(COUNT(vh.*), 0)), 2
    ) as actual_success_rate
FROM hook_frameworks hf
LEFT JOIN video_hooks vh ON hf.id = vh.hook_id
LEFT JOIN videos v ON vh.video_id = v.id
GROUP BY hf.id, hf.name, hf.category, hf.success_rate
HAVING COUNT(vh.*) > 0
ORDER BY actual_success_rate DESC;

-- 4. God Mode Summary View
CREATE OR REPLACE VIEW god_mode_summary AS
SELECT 
    v.id as video_id,
    v.tiktok_id,
    v.viral_probability,
    -- God Mode Scores
    pe.emotional_arousal_score,
    pq.authenticity_score,
    pa.second_person_percentage,
    pp.duet_potential_score + pp.stitch_potential_score as participation_score,
    ct.timing_score,
    ap.formula_disguise_effectiveness,
    -- Combined God Mode Score
    ROUND(
        (COALESCE(pe.emotional_arousal_score, 0) * 0.20 +
         COALESCE(pq.authenticity_score, 0) * 0.15 +
         COALESCE(pa.direct_engagement_score, 0) * 0.15 +
         COALESCE((pp.duet_potential_score + pp.stitch_potential_score)/2, 0) * 0.15 +
         COALESCE(ct.timing_score, 0) * 0.20 +
         COALESCE(ap.formula_disguise_effectiveness, 0) * 0.15) * 100, 2
    ) as god_mode_score
FROM videos v
LEFT JOIN psychological_engagement pe ON v.id = pe.video_id
LEFT JOIN production_quality pq ON v.id = pq.video_id
LEFT JOIN perspective_analysis pa ON v.id = pa.video_id
LEFT JOIN participation_potential pp ON v.id = pp.video_id
LEFT JOIN cultural_timing ct ON v.id = ct.video_id
LEFT JOIN authenticity_paradox ap ON v.id = ap.video_id;

-- ============================================
-- CREATE INDEXES FOR BRIDGE TABLES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_template_video_analysis_template ON template_video_analysis(template_id);
CREATE INDEX IF NOT EXISTS idx_template_video_analysis_video ON template_video_analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_user_viral_preferences_user ON user_viral_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_sound_viral_history_sound ON sound_viral_history(sound_id);
CREATE INDEX IF NOT EXISTS idx_sound_viral_history_date ON sound_viral_history(usage_date);
CREATE INDEX IF NOT EXISTS idx_expert_insight_enhancements_insight ON expert_insight_enhancements(expert_insight_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to sync existing TikTok templates with video analysis
CREATE OR REPLACE FUNCTION sync_tiktok_templates_to_videos()
RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
    template_record RECORD;
BEGIN
    -- Loop through existing TikTok templates and create video records
    FOR template_record IN 
        SELECT * FROM tiktok_templates 
        WHERE video_analysis_id IS NULL 
        LIMIT 100 -- Process in batches
    LOOP
        -- Insert into videos table
        INSERT INTO videos (
            tiktok_id,
            creator_id,
            creator_username,
            view_count,
            like_count,
            comment_count,
            share_count,
            upload_timestamp,
            caption,
            template_id
        ) VALUES (
            COALESCE(template_record.tiktok_id, template_record.id::text),
            COALESCE(template_record.creator_id, 'unknown'),
            COALESCE(template_record.creator_username, 'unknown'),
            COALESCE(template_record.view_count, 0),
            COALESCE(template_record.like_count, 0),
            COALESCE(template_record.comment_count, 0),
            COALESCE(template_record.share_count, 0),
            COALESCE(template_record.created_at, NOW()),
            COALESCE(template_record.description, ''),
            template_record.id::text
        )
        ON CONFLICT (tiktok_id) DO NOTHING;
        
        sync_count := sync_count + 1;
    END LOOP;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate viral category for existing data
CREATE OR REPLACE FUNCTION update_viral_categories()
RETURNS INTEGER AS $$
DECLARE
    update_count INTEGER := 0;
BEGIN
    -- Update viral categories based on percentile
    UPDATE videos SET 
        viral_probability = CASE 
            WHEN cohort_percentile >= 99.9 THEN 0.95
            WHEN cohort_percentile >= 99 THEN 0.85
            WHEN cohort_percentile >= 95 THEN 0.75
            WHEN cohort_percentile >= 90 THEN 0.65
            ELSE 0.45
        END
    WHERE viral_probability IS NULL AND cohort_percentile IS NOT NULL;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RETURN update_count;
END;
$$ LANGUAGE plpgsql;