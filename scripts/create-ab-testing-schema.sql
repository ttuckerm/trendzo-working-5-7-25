-- A/B Testing Schema for TRENDZO MVP
-- Tables to support comprehensive A/B testing functionality

-- Create ab_tests table
CREATE TABLE IF NOT EXISTS public.ab_tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('landing_page', 'email', 'template', 'hook', 'cta')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed')) DEFAULT 'draft',
    variants JSONB NOT NULL DEFAULT '[]',
    traffic_split NUMERIC[] NOT NULL DEFAULT ARRAY[50, 50],
    target_metrics TEXT[] NOT NULL DEFAULT ARRAY['conversion_rate'],
    min_sample_size INTEGER NOT NULL DEFAULT 100,
    confidence_level NUMERIC NOT NULL DEFAULT 95.0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_by TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ab_test_assignments table
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, user_id)
);

-- Create ab_test_events table  
CREATE TABLE IF NOT EXISTS public.ab_test_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'conversion', 'engagement')),
    conversion_type TEXT,
    value NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ab_test_results table (for cached results)
CREATE TABLE IF NOT EXISTS public.ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate NUMERIC DEFAULT 0,
    confidence_level NUMERIC DEFAULT 0,
    lift_percentage NUMERIC DEFAULT 0,
    statistical_significance BOOLEAN DEFAULT FALSE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(test_id, variant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_type ON ab_tests(type);
CREATE INDEX IF NOT EXISTS idx_ab_tests_created_by ON ab_tests(created_by);
CREATE INDEX IF NOT EXISTS idx_ab_tests_dates ON ab_tests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_test_id ON ab_test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_assignments_user_id ON ab_test_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_ab_test_events_test_variant ON ab_test_events(test_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_user_id ON ab_test_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_type ON ab_test_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ab_test_events_timestamp ON ab_test_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);

-- RLS Policies
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own tests
CREATE POLICY "Users can view own tests" ON ab_tests
    FOR SELECT USING (auth.uid()::text = created_by);

-- Users can create tests
CREATE POLICY "Users can create tests" ON ab_tests
    FOR INSERT WITH CHECK (auth.uid()::text = created_by);

-- Users can update their own tests
CREATE POLICY "Users can update own tests" ON ab_tests
    FOR UPDATE USING (auth.uid()::text = created_by);

-- Admins can view all tests
CREATE POLICY "Admins can view all tests" ON ab_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

-- Service role has full access
CREATE POLICY "Service role full access ab_tests" ON ab_tests
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Assignments - users can view their own
CREATE POLICY "Users can view own assignments" ON ab_test_assignments
    FOR SELECT USING (auth.uid()::text = user_id);

-- System can create assignments
CREATE POLICY "System can create assignments" ON ab_test_assignments
    FOR INSERT WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role full access assignments" ON ab_test_assignments
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Events - system can insert, users can view their own
CREATE POLICY "System can track events" ON ab_test_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events" ON ab_test_events
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access events" ON ab_test_events
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Results - readable by test creators and admins
CREATE POLICY "Test creators can view results" ON ab_test_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ab_tests 
            WHERE id = test_id 
            AND created_by = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all results" ON ab_test_results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'admin'
        )
    );

CREATE POLICY "Service role full access results" ON ab_test_results
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for A/B testing

-- Function to get user's test variant
CREATE OR REPLACE FUNCTION get_user_test_variant(
    p_test_id TEXT,
    p_user_id TEXT
)
RETURNS TABLE(
    variant_id TEXT,
    variant_content JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assignment_exists BOOLEAN;
    v_variant_id TEXT;
    v_test ab_tests%ROWTYPE;
    v_hash INTEGER;
    v_random NUMERIC;
    v_cumulative NUMERIC := 0;
    v_variant JSONB;
BEGIN
    -- Check if test exists and is running
    SELECT * INTO v_test FROM ab_tests WHERE id = p_test_id AND status = 'running';
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Check for existing assignment
    SELECT EXISTS(
        SELECT 1 FROM ab_test_assignments 
        WHERE test_id = p_test_id AND user_id = p_user_id
    ) INTO v_assignment_exists;
    
    IF v_assignment_exists THEN
        -- Return existing assignment
        SELECT a.variant_id INTO v_variant_id
        FROM ab_test_assignments a
        WHERE a.test_id = p_test_id AND a.user_id = p_user_id;
        
        -- Get variant content
        SELECT variant INTO v_variant
        FROM jsonb_array_elements(v_test.variants) AS variant
        WHERE variant->>'id' = v_variant_id;
        
        RETURN QUERY SELECT v_variant_id, v_variant->'content';
        RETURN;
    END IF;
    
    -- Create new assignment using hash-based allocation
    -- Convert user_id to hash for consistent assignment
    v_hash := abs(hashtext(p_user_id));
    v_random := (v_hash % 10000) / 100.0; -- 0-99.99
    
    -- Find variant based on traffic split
    FOR i IN 0..jsonb_array_length(v_test.variants) - 1 LOOP
        v_cumulative := v_cumulative + v_test.traffic_split[i + 1];
        
        IF v_random < v_cumulative THEN
            v_variant := v_test.variants->i;
            v_variant_id := v_variant->>'id';
            EXIT;
        END IF;
    END LOOP;
    
    -- Fallback to first variant
    IF v_variant_id IS NULL THEN
        v_variant := v_test.variants->0;
        v_variant_id := v_variant->>'id';
    END IF;
    
    -- Save assignment
    INSERT INTO ab_test_assignments (test_id, user_id, variant_id)
    VALUES (p_test_id, p_user_id, v_variant_id);
    
    RETURN QUERY SELECT v_variant_id, v_variant->'content';
END;
$$;

-- Function to calculate test results
CREATE OR REPLACE FUNCTION calculate_ab_test_results(p_test_id TEXT)
RETURNS TABLE(
    variant_id TEXT,
    variant_name TEXT,
    impressions BIGINT,
    conversions BIGINT,
    conversion_rate NUMERIC,
    confidence_level NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_test ab_tests%ROWTYPE;
    v_variant JSONB;
    v_control_rate NUMERIC := 0;
    v_control_impressions BIGINT := 0;
    v_control_conversions BIGINT := 0;
BEGIN
    -- Get test details
    SELECT * INTO v_test FROM ab_tests WHERE id = p_test_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- First pass: get control metrics
    FOR v_variant IN SELECT value FROM jsonb_array_elements(v_test.variants) LOOP
        IF (v_variant->>'is_control')::boolean THEN
            SELECT 
                COUNT(*) FILTER (WHERE event_type = 'impression'),
                COUNT(*) FILTER (WHERE event_type = 'conversion')
            INTO v_control_impressions, v_control_conversions
            FROM ab_test_events
            WHERE test_id = p_test_id AND variant_id = v_variant->>'id';
            
            v_control_rate := CASE 
                WHEN v_control_impressions > 0 THEN 
                    (v_control_conversions::numeric / v_control_impressions) * 100 
                ELSE 0 
            END;
            EXIT;
        END IF;
    END LOOP;
    
    -- Second pass: calculate results for all variants
    FOR v_variant IN SELECT value FROM jsonb_array_elements(v_test.variants) LOOP
        DECLARE
            v_impressions BIGINT;
            v_conversions BIGINT;
            v_conv_rate NUMERIC;
            v_confidence NUMERIC := 0;
        BEGIN
            -- Get metrics for this variant
            SELECT 
                COUNT(*) FILTER (WHERE event_type = 'impression'),
                COUNT(*) FILTER (WHERE event_type = 'conversion')
            INTO v_impressions, v_conversions
            FROM ab_test_events
            WHERE test_id = p_test_id AND variant_id = v_variant->>'id';
            
            v_conv_rate := CASE 
                WHEN v_impressions > 0 THEN (v_conversions::numeric / v_impressions) * 100 
                ELSE 0 
            END;
            
            -- Calculate confidence (simplified z-test)
            IF v_impressions >= 30 AND v_control_impressions >= 30 AND NOT (v_variant->>'is_control')::boolean THEN
                DECLARE
                    v_pooled_rate NUMERIC;
                    v_standard_error NUMERIC;
                    v_z_score NUMERIC;
                BEGIN
                    v_pooled_rate := (v_conversions + v_control_conversions)::numeric / 
                                   (v_impressions + v_control_impressions);
                    
                    v_standard_error := sqrt(
                        v_pooled_rate * (1 - v_pooled_rate) * 
                        (1.0/v_impressions + 1.0/v_control_impressions)
                    );
                    
                    IF v_standard_error > 0 THEN
                        v_z_score := abs((v_conv_rate/100) - (v_control_rate/100)) / v_standard_error;
                        
                        -- Convert z-score to confidence
                        v_confidence := CASE
                            WHEN v_z_score > 2.58 THEN 99
                            WHEN v_z_score > 1.96 THEN 95
                            WHEN v_z_score > 1.65 THEN 90
                            WHEN v_z_score > 1.28 THEN 80
                            ELSE GREATEST(0, LEAST(100, v_z_score * 40))
                        END;
                    END IF;
                END;
            END IF;
            
            RETURN QUERY SELECT 
                v_variant->>'id',
                v_variant->>'name',
                v_impressions,
                v_conversions,
                v_conv_rate,
                v_confidence;
        END;
    END LOOP;
END;
$$;

-- Function to update test results cache
CREATE OR REPLACE FUNCTION refresh_ab_test_results(p_test_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete old results
    DELETE FROM ab_test_results WHERE test_id = p_test_id;
    
    -- Insert new results
    INSERT INTO ab_test_results (
        test_id, variant_id, impressions, conversions, 
        conversion_rate, confidence_level, statistical_significance
    )
    SELECT 
        p_test_id,
        variant_id,
        impressions,
        conversions,
        conversion_rate,
        confidence_level,
        confidence_level >= 95 AND conversion_rate > 0
    FROM calculate_ab_test_results(p_test_id);
END;
$$;

-- Trigger to update test results when events are added
CREATE OR REPLACE FUNCTION trigger_refresh_test_results()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh results for the affected test (async would be better in production)
    PERFORM refresh_ab_test_results(NEW.test_id);
    RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_results_on_event
    AFTER INSERT ON ab_test_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_refresh_test_results();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_test_variant TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_ab_test_results TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_ab_test_results TO authenticated;

COMMIT;