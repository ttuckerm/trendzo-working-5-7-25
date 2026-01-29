-- TRENDZO MVP - Supabase RPC Functions
-- These functions provide the core analytics and data processing capabilities

-- Function 1: Get Conversion Funnel Data
CREATE OR REPLACE FUNCTION get_conversion_funnel(
  p_niche TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH funnel_data AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_id END) as page_views,
      COUNT(DISTINCT CASE WHEN event_type = 'exit_intent_trigger' THEN visitor_id END) as exit_intent_triggers,
      COUNT(DISTINCT CASE WHEN event_type = 'exit_intent_convert' THEN visitor_id END) as exit_intent_conversions,
      COUNT(DISTINCT CASE WHEN event_type = 'editor_entry' THEN visitor_id END) as editor_entries,
      COUNT(DISTINCT CASE WHEN event_type = 'template_select' THEN visitor_id END) as template_selections,
      COUNT(DISTINCT CASE WHEN event_type = 'template_complete' THEN visitor_id END) as template_completions,
      COUNT(DISTINCT CASE WHEN event_type = 'email_capture' THEN visitor_id END) as emails_captured
    FROM campaign_analytics
    WHERE 
      (p_niche IS NULL OR metadata->>'niche' = p_niche)
      AND (p_platform IS NULL OR metadata->>'platform' = p_platform)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
  )
  SELECT json_build_object(
    'pageViews', page_views,
    'exitIntentTriggers', exit_intent_triggers,
    'exitIntentConversions', exit_intent_conversions,
    'editorEntries', editor_entries,
    'templateSelections', template_selections,
    'templateCompletions', template_completions,
    'emailsCaptured', emails_captured,
    'conversionRates', json_build_object(
      'pageToEmail', CASE WHEN page_views > 0 THEN ROUND((emails_captured::numeric / page_views) * 100, 2) ELSE 0 END,
      'emailToEditor', CASE WHEN emails_captured > 0 THEN ROUND((editor_entries::numeric / emails_captured) * 100, 2) ELSE 0 END,
      'editorToComplete', CASE WHEN editor_entries > 0 THEN ROUND((template_completions::numeric / editor_entries) * 100, 2) ELSE 0 END
    )
  ) INTO v_result
  FROM funnel_data;
  
  RETURN v_result;
END;
$$;

-- Function 2: Get Top Performing Landing Pages
CREATE OR REPLACE FUNCTION get_top_performing_pages(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  niche TEXT,
  platform TEXT,
  page_views BIGINT,
  conversions BIGINT,
  conversion_rate NUMERIC,
  avg_time_on_page NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH page_metrics AS (
    SELECT 
      lp.niche,
      lp.platform,
      COUNT(DISTINCT CASE WHEN ca.event_type = 'page_view' THEN ca.visitor_id END) as views,
      COUNT(DISTINCT CASE WHEN ca.event_type = 'email_capture' THEN ca.visitor_id END) as convs,
      AVG(CASE WHEN ca.event_type = 'page_view' THEN EXTRACT(EPOCH FROM (ca.metadata->>'duration')::interval) END) as avg_duration
    FROM landing_pages lp
    LEFT JOIN campaign_analytics ca ON ca.landing_page_id = lp.id
    WHERE ca.created_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY lp.niche, lp.platform
  )
  SELECT 
    niche,
    platform,
    views,
    convs,
    CASE WHEN views > 0 THEN ROUND((convs::numeric / views) * 100, 2) ELSE 0 END,
    COALESCE(ROUND(avg_duration, 2), 0),
    CASE WHEN views > 0 THEN ROUND(((views - convs)::numeric / views) * 100, 2) ELSE 0 END
  FROM page_metrics
  ORDER BY convs DESC, views DESC
  LIMIT p_limit;
END;
$$;

-- Function 3: Capture Email with Attribution
CREATE OR REPLACE FUNCTION capture_email_with_attribution(
  p_email TEXT,
  p_landing_page_id UUID DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'direct',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email_capture_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  -- Create user if doesn't exist
  IF v_user_id IS NULL THEN
    INSERT INTO users (email, created_at, updated_at)
    VALUES (p_email, NOW(), NOW())
    RETURNING id INTO v_user_id;
  END IF;
  
  -- Record email capture
  INSERT INTO email_captures (
    user_id,
    landing_page_id,
    template_id,
    source,
    metadata,
    created_at
  ) VALUES (
    v_user_id,
    p_landing_page_id,
    p_template_id,
    p_source,
    p_metadata,
    NOW()
  )
  RETURNING id INTO v_email_capture_id;
  
  -- Update landing page performance if applicable
  IF p_landing_page_id IS NOT NULL THEN
    UPDATE landing_pages
    SET performance_data = jsonb_set(
      performance_data,
      '{conversions}',
      to_jsonb(COALESCE((performance_data->>'conversions')::int, 0) + 1)
    ),
    updated_at = NOW()
    WHERE id = p_landing_page_id;
  END IF;
  
  RETURN v_user_id;
END;
$$;

-- Function 4: Calculate Viral Score
CREATE OR REPLACE FUNCTION get_viral_score(
  p_template_id UUID,
  p_niche TEXT,
  p_platform TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_base_score NUMERIC := 50;
  v_trend_boost NUMERIC := 0;
  v_timing_score NUMERIC := 0;
  v_audio_score NUMERIC := 0;
  v_engagement_prediction NUMERIC := 0;
BEGIN
  -- Calculate trend boost based on current trends
  SELECT 
    CASE 
      WHEN COUNT(*) > 100 THEN 30
      WHEN COUNT(*) > 50 THEN 20
      WHEN COUNT(*) > 10 THEN 10
      ELSE 5
    END INTO v_trend_boost
  FROM templates
  WHERE niche = p_niche
  AND platform = p_platform
  AND created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Calculate timing score (hook effectiveness)
  v_timing_score := 15; -- Placeholder for actual timing analysis
  
  -- Calculate audio trending score
  v_audio_score := 20; -- Placeholder for audio trend analysis
  
  -- Calculate final score
  v_engagement_prediction := LEAST(100, v_base_score + v_trend_boost + v_timing_score + v_audio_score);
  
  -- Build result
  SELECT json_build_object(
    'viralScore', v_engagement_prediction,
    'breakdown', json_build_object(
      'baseScore', v_base_score,
      'trendBoost', v_trend_boost,
      'timingScore', v_timing_score,
      'audioScore', v_audio_score
    ),
    'prediction', CASE 
      WHEN v_engagement_prediction >= 80 THEN 'High viral potential'
      WHEN v_engagement_prediction >= 60 THEN 'Good engagement expected'
      WHEN v_engagement_prediction >= 40 THEN 'Moderate performance'
      ELSE 'Needs optimization'
    END,
    'tips', CASE
      WHEN v_timing_score < 10 THEN ARRAY['Improve your hook timing', 'Add trending audio']
      WHEN v_audio_score < 15 THEN ARRAY['Use trending sounds', 'Match beat drops']
      ELSE ARRAY['Looking good!', 'Post at peak hours']
    END
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function 5: Get Real-time Activity Feed
CREATE OR REPLACE FUNCTION get_live_activity_feed(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  activity_type TEXT,
  location TEXT,
  time_ago TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE event_type
      WHEN 'template_complete' THEN 'completed'
      WHEN 'email_capture' THEN 'joined'
      WHEN 'page_view' THEN 'viewing'
      ELSE 'active'
    END,
    COALESCE(metadata->>'location', 'Unknown'),
    CASE 
      WHEN created_at > NOW() - INTERVAL '1 minute' THEN 'just now'
      WHEN created_at > NOW() - INTERVAL '5 minutes' THEN '< 5 min ago'
      WHEN created_at > NOW() - INTERVAL '30 minutes' THEN '< 30 min ago'
      ELSE '< 1 hour ago'
    END,
    CASE event_type
      WHEN 'template_complete' THEN 'Created viral video'
      WHEN 'email_capture' THEN 'Started creating content'
      WHEN 'page_view' THEN 'Exploring templates'
      ELSE 'Creating content'
    END
  FROM campaign_analytics
  WHERE created_at > NOW() - INTERVAL '1 hour'
  AND event_type IN ('template_complete', 'email_capture', 'page_view')
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function 6: Admin Dashboard Metrics
CREATE OR REPLACE FUNCTION get_admin_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH metrics AS (
    SELECT 
      -- User metrics
      (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as new_users_today,
      (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_week,
      (SELECT COUNT(*) FROM users) as total_users,
      
      -- Template metrics
      (SELECT COUNT(*) FROM templates WHERE created_at >= CURRENT_DATE) as templates_today,
      (SELECT COUNT(*) FROM templates WHERE viral_score >= 80) as viral_templates,
      
      -- Revenue metrics (placeholder)
      0 as revenue_today,
      0 as revenue_month,
      
      -- Engagement metrics
      (SELECT COUNT(*) FROM campaign_analytics WHERE event_type = 'template_complete' AND created_at >= CURRENT_DATE) as videos_created_today,
      (SELECT AVG(EXTRACT(EPOCH FROM (metadata->>'completionTime')::interval)) FROM campaign_analytics WHERE event_type = 'template_complete') as avg_creation_time
  )
  SELECT json_build_object(
    'users', json_build_object(
      'newToday', new_users_today,
      'newThisWeek', new_users_week,
      'total', total_users,
      'growthRate', CASE WHEN new_users_week > 0 THEN ROUND((new_users_today::numeric / new_users_week) * 100, 2) ELSE 0 END
    ),
    'templates', json_build_object(
      'createdToday', templates_today,
      'viralCount', viral_templates,
      'videosCreatedToday', videos_created_today,
      'avgCreationTime', COALESCE(ROUND(avg_creation_time, 2), 0)
    ),
    'revenue', json_build_object(
      'today', revenue_today,
      'month', revenue_month,
      'mrr', 0,
      'ltv', 0
    )
  ) INTO v_result
  FROM metrics;
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_conversion_funnel TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_top_performing_pages TO authenticated, anon;
GRANT EXECUTE ON FUNCTION capture_email_with_attribution TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_viral_score TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_live_activity_feed TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_admin_dashboard_metrics TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_event_type ON campaign_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_created_at ON campaign_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_visitor_id ON campaign_analytics(visitor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_landing_page_id ON campaign_analytics(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_user_id ON email_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_niche_platform ON templates(niche, platform);
CREATE INDEX IF NOT EXISTS idx_templates_viral_score ON templates(viral_score);