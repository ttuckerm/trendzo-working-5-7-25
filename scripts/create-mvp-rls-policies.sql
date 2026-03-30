-- TRENDZO MVP - Row Level Security Policies
-- Secure data access at the database level

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow new user registration
CREATE POLICY "Enable user registration" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Templates table policies
-- Anyone can view published templates
CREATE POLICY "Public templates are viewable by all" ON templates
  FOR SELECT USING (is_public = true);

-- Users can view their own templates
CREATE POLICY "Users can view own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create templates
CREATE POLICY "Users can create templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- Landing pages policies (admin only)
-- Public can view landing pages
CREATE POLICY "Landing pages are public" ON landing_pages
  FOR SELECT USING (true);

-- Only admins can modify landing pages
CREATE POLICY "Only admins can create landing pages" ON landing_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update landing pages" ON landing_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Campaign analytics policies
-- Allow anonymous inserts for tracking
CREATE POLICY "Allow anonymous analytics tracking" ON campaign_analytics
  FOR INSERT WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Only admins can view analytics" ON campaign_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Creator attributions policies
-- Public can view attributions
CREATE POLICY "Attributions are public" ON creator_attributions
  FOR SELECT USING (true);

-- Users can create attributions for their templates
CREATE POLICY "Users can create attributions" ON creator_attributions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates 
      WHERE id = template_id 
      AND user_id = auth.uid()
    )
  );

-- Email captures policies
-- Users can view their own email captures
CREATE POLICY "Users can view own email captures" ON email_captures
  FOR SELECT USING (user_id = auth.uid());

-- Allow anonymous email capture (for landing pages)
CREATE POLICY "Allow anonymous email capture" ON email_captures
  FOR INSERT WITH CHECK (true);

-- Service role bypass for all tables (for server-side operations)
CREATE POLICY "Service role has full access to users" ON users
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to templates" ON templates
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to landing_pages" ON landing_pages
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to campaign_analytics" ON campaign_analytics
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to creator_attributions" ON creator_attributions
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to email_captures" ON email_captures
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Additional security functions

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Function to check if user owns template
CREATE OR REPLACE FUNCTION owns_template(p_template_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM templates 
    WHERE id = p_template_id 
    AND user_id = auth.uid()
  );
END;
$$;

-- Function to check feature access based on tier
CREATE OR REPLACE FUNCTION has_feature_access(p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_tier TEXT;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO v_user_tier
  FROM users
  WHERE id = auth.uid();
  
  -- Check feature access based on tier
  CASE p_feature
    WHEN 'premium_analytics' THEN
      RETURN v_user_tier IN ('premium', 'business', 'admin');
    WHEN 'ai_suggestions' THEN
      RETURN v_user_tier IN ('premium', 'business', 'admin');
    WHEN 'unlimited_templates' THEN
      RETURN v_user_tier IN ('business', 'admin');
    WHEN 'api_access' THEN
      RETURN v_user_tier IN ('business', 'admin');
    WHEN 'white_label' THEN
      RETURN v_user_tier = 'business';
    ELSE
      RETURN true; -- Basic features available to all
  END CASE;
END;
$$;

-- Grant execute permissions on security functions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION owns_template TO authenticated;
GRANT EXECUTE ON FUNCTION has_feature_access TO authenticated;