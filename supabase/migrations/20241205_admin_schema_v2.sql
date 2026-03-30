-- =============================================
-- CLEANCOPY MULTI-TENANT ADMIN SCHEMA v2
-- Version: 2.0.0 - Truly Defensive Migration
-- Date: December 5, 2024
-- =============================================
-- This migration safely handles ANY existing state
-- by checking for column existence before operations
-- =============================================

-- =============================================
-- SECTION 1: ENUMS (Safe creation with exception handling)
-- =============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agency_tier AS ENUM ('starter', 'growth', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE creator_verification AS ENUM ('unverified', 'pending', 'verified', 'featured');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_type AS ENUM ('platform', 'content', 'miniapp');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE app_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- SECTION 2: HELPER FUNCTION FOR SAFE COLUMN ADDITION
-- =============================================

CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table_name TEXT,
  p_column_name TEXT,
  p_column_def TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name 
    AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_def);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SECTION 3: PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'creator',
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add any missing columns to profiles
SELECT add_column_if_not_exists('profiles', 'role', 'user_role NOT NULL DEFAULT ''creator''');
SELECT add_column_if_not_exists('profiles', 'display_name', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'avatar_url', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'email', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'phone', 'TEXT');
SELECT add_column_if_not_exists('profiles', 'timezone', 'TEXT DEFAULT ''UTC''');
SELECT add_column_if_not_exists('profiles', 'language', 'TEXT DEFAULT ''en''');
SELECT add_column_if_not_exists('profiles', 'is_active', 'BOOLEAN DEFAULT true');
SELECT add_column_if_not_exists('profiles', 'last_login_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('profiles', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT add_column_if_not_exists('profiles', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT add_column_if_not_exists('profiles', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =============================================
-- SECTION 4: SUB_ADMINS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS sub_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  delegated_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  agency_scope UUID[] DEFAULT NULL,
  max_agencies INTEGER DEFAULT NULL,
  can_create_sub_admins BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT add_column_if_not_exists('sub_admins', 'delegated_permissions', 'JSONB NOT NULL DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('sub_admins', 'agency_scope', 'UUID[]');
SELECT add_column_if_not_exists('sub_admins', 'max_agencies', 'INTEGER');
SELECT add_column_if_not_exists('sub_admins', 'can_create_sub_admins', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('sub_admins', 'is_active', 'BOOLEAN DEFAULT true');
SELECT add_column_if_not_exists('sub_admins', 'notes', 'TEXT');
SELECT add_column_if_not_exists('sub_admins', 'created_by', 'UUID');
SELECT add_column_if_not_exists('sub_admins', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT add_column_if_not_exists('sub_admins', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');

CREATE INDEX IF NOT EXISTS idx_sub_admins_user ON sub_admins(user_id);

-- =============================================
-- SECTION 5: AGENCY_TIER_DEFINITIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS agency_tier_definitions (
  tier agency_tier PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_annual INTEGER,
  max_creators INTEGER NOT NULL,
  max_videos_per_month INTEGER NOT NULL,
  max_api_calls_per_month INTEGER NOT NULL,
  storage_gb INTEGER NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  color TEXT NOT NULL,
  badge_icon TEXT,
  description TEXT,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO agency_tier_definitions (tier, display_name, price_monthly, price_annual, max_creators, max_videos_per_month, max_api_calls_per_month, storage_gb, features, color, description, is_popular, sort_order) VALUES
  ('starter', 'Starter', 2900, 29000, 5, 100, 0, 5, '["basic_analytics", "dps_calculator", "video_download"]'::jsonb, '#6B7280', 'Perfect for individual creators', false, 1),
  ('growth', 'Growth', 5900, 59000, 15, 500, 10000, 20, '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis"]'::jsonb, '#3B82F6', 'For growing teams', true, 2),
  ('pro', 'Pro', 9900, 99000, 50, 1000, 100000, 50, '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis", "api_access", "white_label"]'::jsonb, '#FFD700', 'For professional agencies', false, 3),
  ('enterprise', 'Enterprise', 19900, 199000, 200, 5000, 1000000, 200, '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis", "api_access", "white_label", "custom_models"]'::jsonb, '#8B5CF6', 'For large organizations', false, 4)
ON CONFLICT (tier) DO NOTHING;

-- =============================================
-- SECTION 6: AGENCIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier agency_tier NOT NULL DEFAULT 'starter',
  owner_id UUID,
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT NULL,
  feature_overrides JSONB DEFAULT '{}'::jsonb,
  white_label_config JSONB DEFAULT NULL,
  notification_settings JSONB DEFAULT '{"email": true}'::jsonb,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT,
  billing_cycle_start DATE,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

SELECT add_column_if_not_exists('agencies', 'slug', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'tier', 'agency_tier DEFAULT ''starter''');
SELECT add_column_if_not_exists('agencies', 'owner_id', 'UUID');
SELECT add_column_if_not_exists('agencies', 'cover_url', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'description', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'contact_phone', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'address', 'JSONB');
SELECT add_column_if_not_exists('agencies', 'feature_overrides', 'JSONB DEFAULT ''{}''::jsonb');
SELECT add_column_if_not_exists('agencies', 'white_label_config', 'JSONB');
SELECT add_column_if_not_exists('agencies', 'notification_settings', 'JSONB DEFAULT ''{"email": true}''::jsonb');
SELECT add_column_if_not_exists('agencies', 'stripe_customer_id', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'stripe_subscription_id', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'billing_email', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'billing_cycle_start', 'DATE');
SELECT add_column_if_not_exists('agencies', 'is_active', 'BOOLEAN DEFAULT true');
SELECT add_column_if_not_exists('agencies', 'suspended_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('agencies', 'suspension_reason', 'TEXT');
SELECT add_column_if_not_exists('agencies', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- Safe index creation (only if column exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agencies' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_id);

-- =============================================
-- SECTION 7: AGENCY_MEMBERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON agency_members(user_id);

-- =============================================
-- SECTION 8: CREATORS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  agency_id UUID,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  verification_status creator_verification DEFAULT 'unverified',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  follower_count BIGINT DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  avg_dps DECIMAL(5,2) DEFAULT 0,
  best_dps DECIMAL(5,2) DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  platforms JSONB DEFAULT '[]'::jsonb,
  revenue_share_rate DECIMAL(4,2) DEFAULT 70.00,
  payout_method JSONB DEFAULT NULL,
  notification_preferences JSONB DEFAULT '{"email": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

SELECT add_column_if_not_exists('creators', 'handle', 'TEXT');
SELECT add_column_if_not_exists('creators', 'bio', 'TEXT');
SELECT add_column_if_not_exists('creators', 'cover_url', 'TEXT');
SELECT add_column_if_not_exists('creators', 'verification_status', 'creator_verification DEFAULT ''unverified''');
SELECT add_column_if_not_exists('creators', 'verification_notes', 'TEXT');
SELECT add_column_if_not_exists('creators', 'verified_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('creators', 'verified_by', 'UUID');
SELECT add_column_if_not_exists('creators', 'following_count', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('creators', 'total_views', 'BIGINT DEFAULT 0');
SELECT add_column_if_not_exists('creators', 'best_dps', 'DECIMAL(5,2) DEFAULT 0');
SELECT add_column_if_not_exists('creators', 'engagement_rate', 'DECIMAL(5,2) DEFAULT 0');
SELECT add_column_if_not_exists('creators', 'revenue_share_rate', 'DECIMAL(4,2) DEFAULT 70.00');
SELECT add_column_if_not_exists('creators', 'payout_method', 'JSONB');
SELECT add_column_if_not_exists('creators', 'notification_preferences', 'JSONB DEFAULT ''{"email": true}''::jsonb');
SELECT add_column_if_not_exists('creators', 'suspended_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('creators', 'suspension_reason', 'TEXT');
SELECT add_column_if_not_exists('creators', 'last_activity_at', 'TIMESTAMPTZ');

CREATE INDEX IF NOT EXISTS idx_creators_user ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_agency ON creators(agency_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creators' AND column_name = 'handle') THEN
    CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);
  END IF;
END $$;

-- =============================================
-- SECTION 9: DEVELOPERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  company_name TEXT,
  display_name TEXT NOT NULL,
  bio TEXT,
  logo_url TEXT,
  contact_email TEXT,
  contact_name TEXT,
  website TEXT,
  github_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  trust_score INTEGER DEFAULT 0,
  affiliate_tier affiliate_tier DEFAULT 'bronze',
  affiliate_code TEXT UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_referral_revenue_cents INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  pending_payout_cents INTEGER DEFAULT 0,
  payout_method JSONB DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

SELECT add_column_if_not_exists('developers', 'bio', 'TEXT');
SELECT add_column_if_not_exists('developers', 'logo_url', 'TEXT');
SELECT add_column_if_not_exists('developers', 'contact_name', 'TEXT');
SELECT add_column_if_not_exists('developers', 'github_url', 'TEXT');
SELECT add_column_if_not_exists('developers', 'verified_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('developers', 'verified_by', 'UUID');
SELECT add_column_if_not_exists('developers', 'trust_score', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('developers', 'affiliate_tier', 'affiliate_tier DEFAULT ''bronze''');
SELECT add_column_if_not_exists('developers', 'affiliate_code', 'TEXT');
SELECT add_column_if_not_exists('developers', 'total_referrals', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('developers', 'total_referral_revenue_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('developers', 'total_revenue_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('developers', 'pending_payout_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('developers', 'payout_method', 'JSONB');
SELECT add_column_if_not_exists('developers', 'suspended_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('developers', 'suspension_reason', 'TEXT');

CREATE INDEX IF NOT EXISTS idx_developers_user ON developers(user_id);

-- =============================================
-- SECTION 10: CLIPPERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS clippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  ambassador_tier affiliate_tier DEFAULT 'bronze',
  ambassador_code TEXT UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_campaigns_joined INTEGER DEFAULT 0,
  total_clips_submitted INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_earnings_cents INTEGER DEFAULT 0,
  avg_clip_performance DECIMAL(5,2) DEFAULT 0,
  platforms JSONB DEFAULT '[]'::jsonb,
  payout_method JSONB DEFAULT NULL,
  min_payout_cents INTEGER DEFAULT 5000,
  auto_payout BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

SELECT add_column_if_not_exists('clippers', 'bio', 'TEXT');
SELECT add_column_if_not_exists('clippers', 'ambassador_tier', 'affiliate_tier DEFAULT ''bronze''');
SELECT add_column_if_not_exists('clippers', 'ambassador_code', 'TEXT');
SELECT add_column_if_not_exists('clippers', 'total_referrals', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('clippers', 'total_campaigns_joined', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('clippers', 'total_clips_submitted', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('clippers', 'pending_earnings_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('clippers', 'avg_clip_performance', 'DECIMAL(5,2) DEFAULT 0');
SELECT add_column_if_not_exists('clippers', 'min_payout_cents', 'INTEGER DEFAULT 5000');
SELECT add_column_if_not_exists('clippers', 'auto_payout', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('clippers', 'is_banned', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('clippers', 'ban_reason', 'TEXT');
SELECT add_column_if_not_exists('clippers', 'last_activity_at', 'TIMESTAMPTZ');

CREATE INDEX IF NOT EXISTS idx_clippers_user ON clippers(user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clippers' AND column_name = 'handle') THEN
    CREATE INDEX IF NOT EXISTS idx_clippers_handle ON clippers(handle);
  END IF;
END $$;

-- =============================================
-- SECTION 11: FEATURE_TOGGLES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS feature_toggles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_enabled BOOLEAN DEFAULT false,
  tier_availability agency_tier[] DEFAULT '{starter, growth, pro, enterprise}',
  rollout_percentage INTEGER DEFAULT 100,
  requires_setup BOOLEAN DEFAULT false,
  setup_url TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO feature_toggles (id, name, description, category, is_enabled, tier_availability, icon, sort_order) VALUES
  ('basic_analytics', 'Basic Analytics', 'View performance metrics', 'analytics', true, '{starter, growth, pro, enterprise}', 'BarChart', 1),
  ('dps_calculator', 'DPS Calculator', 'Calculate DPS scores', 'analytics', true, '{starter, growth, pro, enterprise}', 'Calculator', 2),
  ('pattern_extraction', 'Pattern Extraction', 'Extract viral patterns', 'analytics', true, '{growth, pro, enterprise}', 'Sparkles', 3),
  ('bulk_analysis', 'Bulk Analysis', 'Analyze multiple videos', 'general', true, '{growth, pro, enterprise}', 'Layers', 4),
  ('api_access', 'API Access', 'Programmatic access', 'integrations', false, '{pro, enterprise}', 'Code', 5),
  ('white_label', 'White Label', 'Custom branding', 'integrations', false, '{pro, enterprise}', 'Palette', 6),
  ('custom_models', 'Custom Models', 'Train custom ML models', 'advanced', false, '{enterprise}', 'Cpu', 7)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SECTION 12: AGENCY_FEATURE_OVERRIDES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS agency_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  feature_id TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ,
  reason TEXT,
  enabled_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_feature_overrides_agency ON agency_feature_overrides(agency_id);

-- =============================================
-- SECTION 13: USAGE_QUOTAS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  videos_analyzed INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  creators_count INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  campaigns_active INTEGER DEFAULT 0,
  quota_warning_sent BOOLEAN DEFAULT false,
  quota_exceeded_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_agency ON usage_quotas(agency_id);

-- =============================================
-- SECTION 14: MINI_APPS TABLE (FULLY DEFENSIVE)
-- =============================================

-- First ensure the table exists with minimal required columns
CREATE TABLE IF NOT EXISTS mini_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Unnamed App',
  app_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Now add ALL potentially missing columns one by one
SELECT add_column_if_not_exists('mini_apps', 'developer_id', 'UUID');
SELECT add_column_if_not_exists('mini_apps', 'name', 'TEXT NOT NULL DEFAULT ''Unnamed App''');
SELECT add_column_if_not_exists('mini_apps', 'slug', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'tagline', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'description', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'icon_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'cover_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'screenshots', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('mini_apps', 'video_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'category', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'tags', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('mini_apps', 'is_free', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('mini_apps', 'price_monthly', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'price_annual', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'has_trial', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('mini_apps', 'trial_days', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'integration_type', 'TEXT DEFAULT ''iframe''');
SELECT add_column_if_not_exists('mini_apps', 'app_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'oauth_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'webhook_url', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'required_scopes', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('mini_apps', 'rating', 'DECIMAL(2,1) DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'review_count', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'install_count', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'active_installs', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'total_revenue_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('mini_apps', 'platform_fee_rate', 'DECIMAL(4,2) DEFAULT 30.00');
SELECT add_column_if_not_exists('mini_apps', 'approval_status', 'app_approval_status DEFAULT ''pending''');
SELECT add_column_if_not_exists('mini_apps', 'approved_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('mini_apps', 'approved_by', 'UUID');
SELECT add_column_if_not_exists('mini_apps', 'rejection_reason', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'is_featured', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('mini_apps', 'featured_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('mini_apps', 'is_active', 'BOOLEAN DEFAULT true');
SELECT add_column_if_not_exists('mini_apps', 'suspended_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('mini_apps', 'suspension_reason', 'TEXT');
SELECT add_column_if_not_exists('mini_apps', 'current_version', 'TEXT DEFAULT ''1.0.0''');
SELECT add_column_if_not_exists('mini_apps', 'changelog', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('mini_apps', 'published_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('mini_apps', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT add_column_if_not_exists('mini_apps', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- Safe index creation for mini_apps (only if columns exist)
CREATE INDEX IF NOT EXISTS idx_mini_apps_developer ON mini_apps(developer_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mini_apps' AND column_name = 'slug') THEN
    CREATE INDEX IF NOT EXISTS idx_mini_apps_slug ON mini_apps(slug);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mini_apps' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_mini_apps_category ON mini_apps(category);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mini_apps' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_mini_apps_active ON mini_apps(is_active);
  END IF;
END $$;

-- =============================================
-- SECTION 15: MINI_APP_INSTALLS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS mini_app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL,
  installed_by UUID NOT NULL,
  agency_id UUID,
  subscription_status TEXT DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_ends_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_mini_app_installs_app ON mini_app_installs(mini_app_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_installs_user ON mini_app_installs(installed_by);

-- =============================================
-- SECTION 16: MINI_APP_REVIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS mini_app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  helpful_count INTEGER DEFAULT 0,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  developer_response TEXT,
  developer_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mini_app_reviews_app ON mini_app_reviews(mini_app_id);

-- =============================================
-- SECTION 17: CAMPAIGNS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type campaign_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',
  owner_id UUID,
  agency_id UUID,
  creator_id UUID,
  developer_id UUID,
  mini_app_id UUID,
  thumbnail_url TEXT,
  cover_url TEXT,
  budget_cents INTEGER NOT NULL DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  reserved_cents INTEGER DEFAULT 0,
  pay_per_1k_views_cents INTEGER DEFAULT 0,
  pay_per_signup_cents INTEGER DEFAULT 0,
  pay_per_install_cents INTEGER DEFAULT 0,
  pay_per_conversion_cents INTEGER DEFAULT 0,
  bonus_structure JSONB DEFAULT NULL,
  source_video_url TEXT,
  source_video_id TEXT,
  source_video_dps DECIMAL(5,2),
  suggested_clips JSONB DEFAULT '[]'::jsonb,
  total_views BIGINT DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  clips_count INTEGER DEFAULT 0,
  avg_clip_performance DECIMAL(5,2) DEFAULT 0,
  requirements JSONB DEFAULT '[]'::jsonb,
  min_followers INTEGER DEFAULT 0,
  min_dps DECIMAL(5,2) DEFAULT 0,
  max_participants INTEGER DEFAULT NULL,
  allowed_platforms JSONB DEFAULT '["tiktok", "instagram", "youtube"]'::jsonb,
  is_public BOOLEAN DEFAULT true,
  is_invite_only BOOLEAN DEFAULT false,
  allowed_tiers affiliate_tier[] DEFAULT '{bronze, silver, gold, platinum, diamond}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

SELECT add_column_if_not_exists('campaigns', 'type', 'campaign_type');
SELECT add_column_if_not_exists('campaigns', 'status', 'campaign_status DEFAULT ''draft''');
SELECT add_column_if_not_exists('campaigns', 'creator_id', 'UUID');
SELECT add_column_if_not_exists('campaigns', 'developer_id', 'UUID');
SELECT add_column_if_not_exists('campaigns', 'mini_app_id', 'UUID');
SELECT add_column_if_not_exists('campaigns', 'thumbnail_url', 'TEXT');
SELECT add_column_if_not_exists('campaigns', 'cover_url', 'TEXT');
SELECT add_column_if_not_exists('campaigns', 'budget_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'spent_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'reserved_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'pay_per_1k_views_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'pay_per_signup_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'pay_per_install_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'pay_per_conversion_cents', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'bonus_structure', 'JSONB');
SELECT add_column_if_not_exists('campaigns', 'source_video_url', 'TEXT');
SELECT add_column_if_not_exists('campaigns', 'source_video_id', 'TEXT');
SELECT add_column_if_not_exists('campaigns', 'source_video_dps', 'DECIMAL(5,2)');
SELECT add_column_if_not_exists('campaigns', 'suggested_clips', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('campaigns', 'total_views', 'BIGINT DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'total_signups', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'total_installs', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'total_conversions', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'participant_count', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'clips_count', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'avg_clip_performance', 'DECIMAL(5,2) DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'requirements', 'JSONB DEFAULT ''[]''::jsonb');
SELECT add_column_if_not_exists('campaigns', 'min_followers', 'INTEGER DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'min_dps', 'DECIMAL(5,2) DEFAULT 0');
SELECT add_column_if_not_exists('campaigns', 'max_participants', 'INTEGER');
SELECT add_column_if_not_exists('campaigns', 'allowed_platforms', 'JSONB DEFAULT ''["tiktok", "instagram", "youtube"]''::jsonb');
SELECT add_column_if_not_exists('campaigns', 'is_public', 'BOOLEAN DEFAULT true');
SELECT add_column_if_not_exists('campaigns', 'is_invite_only', 'BOOLEAN DEFAULT false');
SELECT add_column_if_not_exists('campaigns', 'allowed_tiers', 'affiliate_tier[]');
SELECT add_column_if_not_exists('campaigns', 'start_date', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('campaigns', 'end_date', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('campaigns', 'published_at', 'TIMESTAMPTZ');
SELECT add_column_if_not_exists('campaigns', 'completed_at', 'TIMESTAMPTZ');

CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_agency ON campaigns(agency_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
  END IF;
END $$;

-- =============================================
-- SECTION 18: CAMPAIGN_PARTICIPATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  clipper_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  total_clips INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_earnings_cents INTEGER DEFAULT 0,
  bonuses_earned_cents INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  clips JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_clipper ON campaign_participations(clipper_id);

-- =============================================
-- SECTION 19: CAMPAIGN_INVITES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS campaign_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  clipper_id UUID,
  email TEXT,
  invite_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaign_invites_campaign ON campaign_invites(campaign_id);

-- =============================================
-- SECTION 20: AFFILIATE_TIERS_CONFIG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS affiliate_tiers_config (
  tier affiliate_tier PRIMARY KEY,
  display_name TEXT NOT NULL,
  commission_rate DECIMAL(4,2) NOT NULL,
  recurring_commission_rate DECIMAL(4,2) DEFAULT 0,
  min_referrals INTEGER NOT NULL,
  min_revenue_cents INTEGER DEFAULT 0,
  color TEXT NOT NULL,
  badge_icon TEXT,
  perks JSONB DEFAULT '[]'::jsonb,
  requirements JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO affiliate_tiers_config (tier, display_name, commission_rate, recurring_commission_rate, min_referrals, min_revenue_cents, color, perks) VALUES
  ('bronze', 'Bronze', 10.00, 5.00, 0, 0, '#CD7F32', '["basic_tracking"]'::jsonb),
  ('silver', 'Silver', 15.00, 7.50, 10, 50000, '#C0C0C0', '["basic_tracking", "priority_support"]'::jsonb),
  ('gold', 'Gold', 20.00, 10.00, 50, 250000, '#FFD700', '["basic_tracking", "priority_support", "account_manager"]'::jsonb),
  ('platinum', 'Platinum', 25.00, 12.50, 200, 1000000, '#E5E4E2', '["basic_tracking", "priority_support", "account_manager", "api_access"]'::jsonb),
  ('diamond', 'Diamond', 30.00, 15.00, 500, 5000000, '#B9F2FF', '["basic_tracking", "priority_support", "dedicated_manager", "api_access", "equity_consideration"]'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- =============================================
-- SECTION 21: AFFILIATE_REFERRALS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referrer_type TEXT NOT NULL,
  referred_user_id UUID,
  referred_email TEXT,
  referral_code TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  ip_address INET,
  user_agent TEXT,
  status TEXT DEFAULT 'pending',
  subscription_tier agency_tier,
  subscription_monthly_value_cents INTEGER DEFAULT 0,
  commission_cents INTEGER DEFAULT 0,
  recurring_commission_cents INTEGER DEFAULT 0,
  lifetime_value_cents INTEGER DEFAULT 0,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referrer ON affiliate_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_code ON affiliate_referrals(referral_code);

-- =============================================
-- SECTION 22: PAYOUTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  breakdown JSONB DEFAULT '{}'::jsonb,
  status payout_status DEFAULT 'pending',
  payout_method JSONB NOT NULL DEFAULT '{}'::jsonb,
  processor TEXT,
  processor_reference TEXT,
  processor_fee_cents INTEGER DEFAULT 0,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payouts_recipient ON payouts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- =============================================
-- SECTION 23: EARNINGS_LEDGER TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  source_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payout_id UUID,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  available_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_earnings_ledger_user ON earnings_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_ledger_status ON earnings_ledger(status);

-- =============================================
-- SECTION 24: AUDIT_LOG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role user_role,
  actor_email TEXT,
  action TEXT NOT NULL,
  action_category TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  resource_name TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  retain_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years')
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- =============================================
-- SECTION 25: ACTIVITY_FEED TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT,
  severity TEXT DEFAULT 'info',
  actor_id UUID,
  actor_name TEXT,
  actor_avatar TEXT,
  actor_role user_role,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  target_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'admin',
  agency_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(type);

-- =============================================
-- SECTION 26: NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  action_label TEXT,
  icon TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  channels JSONB DEFAULT '["in_app"]'::jsonb,
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- =============================================
-- SECTION 27: HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safe trigger creation
DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
  CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
  CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
  CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_mini_apps_updated_at ON mini_apps;
  CREATE TRIGGER update_mini_apps_updated_at BEFORE UPDATE ON mini_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN null;
END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
  CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- =============================================
-- SECTION 28: RLS HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_current_role user_role;
BEGIN
  SELECT role INTO user_current_role FROM profiles WHERE id = auth.uid();
  IF user_current_role IS NULL THEN RETURN false; END IF;
  
  RETURN CASE required_role
    WHEN 'clipper' THEN user_current_role IN ('chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper')
    WHEN 'creator' THEN user_current_role IN ('chairman', 'sub_admin', 'agency', 'developer', 'creator')
    WHEN 'developer' THEN user_current_role IN ('chairman', 'sub_admin', 'agency', 'developer')
    WHEN 'agency' THEN user_current_role IN ('chairman', 'sub_admin', 'agency')
    WHEN 'sub_admin' THEN user_current_role IN ('chairman', 'sub_admin')
    WHEN 'chairman' THEN user_current_role = 'chairman'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_chairman()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECTION 29: ENABLE RLS (Safe)
-- =============================================

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_type = 'BASE TABLE'
           AND table_name IN ('profiles', 'sub_admins', 'agencies', 'agency_members', 
                              'creators', 'developers', 'clippers', 'feature_toggles',
                              'agency_feature_overrides', 'usage_quotas', 'mini_apps',
                              'mini_app_installs', 'mini_app_reviews', 'campaigns',
                              'campaign_participations', 'campaign_invites', 
                              'affiliate_referrals', 'payouts', 'earnings_ledger',
                              'audit_log', 'activity_feed', 'notifications')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- =============================================
-- SECTION 30: CREATE BASIC RLS POLICIES
-- =============================================

-- Drop existing policies first
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT USING (user_has_role('sub_admin'));
CREATE POLICY "profiles_chairman_all" ON profiles FOR ALL USING (is_chairman());

-- Feature toggles - everyone can read
CREATE POLICY "feature_toggles_select_all" ON feature_toggles FOR SELECT USING (true);
CREATE POLICY "feature_toggles_chairman_all" ON feature_toggles FOR ALL USING (is_chairman());

-- Mini apps - active apps are public
CREATE POLICY "mini_apps_select_active" ON mini_apps FOR SELECT USING (is_active = true);
CREATE POLICY "mini_apps_admin_select" ON mini_apps FOR SELECT USING (user_has_role('sub_admin'));
CREATE POLICY "mini_apps_chairman_all" ON mini_apps FOR ALL USING (is_chairman());

-- Notifications - users see their own
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_all" ON notifications FOR INSERT WITH CHECK (true);

-- Audit log - admin only
CREATE POLICY "audit_log_admin_select" ON audit_log FOR SELECT USING (is_chairman());

-- Activity feed - visibility based
CREATE POLICY "activity_feed_public" ON activity_feed FOR SELECT USING (visibility = 'public');
CREATE POLICY "activity_feed_admin" ON activity_feed FOR SELECT USING (visibility = 'admin' AND user_has_role('sub_admin'));

-- Campaigns - public active campaigns visible
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'is_public') THEN
    CREATE POLICY "campaigns_select_public" ON campaigns FOR SELECT USING (is_public = true AND status = 'active');
  END IF;
EXCEPTION WHEN OTHERS THEN null;
END $$;

CREATE POLICY "campaigns_admin_select" ON campaigns FOR SELECT USING (user_has_role('sub_admin'));
CREATE POLICY "campaigns_chairman_all" ON campaigns FOR ALL USING (is_chairman());

-- Payouts - users see own
CREATE POLICY "payouts_select_own" ON payouts FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "payouts_admin_select" ON payouts FOR SELECT USING (user_has_role('sub_admin'));
CREATE POLICY "payouts_chairman_all" ON payouts FOR ALL USING (is_chairman());

-- Earnings - users see own
CREATE POLICY "earnings_select_own" ON earnings_ledger FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "earnings_admin_select" ON earnings_ledger FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- SECTION 31: GRANTS
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- v2.0.0 - Truly defensive migration
-- Handles ANY existing schema state safely
-- =============================================



























































































