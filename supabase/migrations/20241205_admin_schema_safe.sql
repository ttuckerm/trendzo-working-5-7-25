-- =============================================
-- CLEANCOPY MULTI-TENANT ADMIN SCHEMA (SAFE)
-- Version: 1.0.1
-- Date: December 5, 2024
-- =============================================
-- This version handles existing objects safely
-- Use this if you have existing tables like mini_apps
-- =============================================

-- =============================================
-- SECTION 0: CLEANUP EXISTING OBJECTS (OPTIONAL)
-- Uncomment the DROP statements below if you want
-- to completely reset and recreate all tables
-- =============================================

/*
-- WARNING: This will DELETE ALL DATA in these tables!
-- Only uncomment if you want to start fresh

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS earnings_ledger CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS affiliate_referrals CASCADE;
DROP TABLE IF EXISTS affiliate_tiers_config CASCADE;
DROP TABLE IF EXISTS campaign_invites CASCADE;
DROP TABLE IF EXISTS campaign_participations CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS mini_app_reviews CASCADE;
DROP TABLE IF EXISTS mini_app_installs CASCADE;
DROP TABLE IF EXISTS mini_apps CASCADE;
DROP TABLE IF EXISTS usage_quotas CASCADE;
DROP TABLE IF EXISTS agency_feature_overrides CASCADE;
DROP TABLE IF EXISTS feature_toggles CASCADE;
DROP TABLE IF EXISTS clippers CASCADE;
DROP TABLE IF EXISTS developers CASCADE;
DROP TABLE IF EXISTS creators CASCADE;
DROP TABLE IF EXISTS agency_members CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS agency_tier_definitions CASCADE;
DROP TABLE IF EXISTS sub_admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

DROP TYPE IF EXISTS app_approval_status CASCADE;
DROP TYPE IF EXISTS payout_status CASCADE;
DROP TYPE IF EXISTS affiliate_tier CASCADE;
DROP TYPE IF EXISTS campaign_status CASCADE;
DROP TYPE IF EXISTS campaign_type CASCADE;
DROP TYPE IF EXISTS creator_verification CASCADE;
DROP TYPE IF EXISTS agency_tier CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
*/

-- =============================================
-- SECTION 1: ENUMS (Create if not exists)
-- =============================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE agency_tier AS ENUM ('starter', 'growth', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE creator_verification AS ENUM ('unverified', 'pending', 'verified', 'featured');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_type AS ENUM ('platform', 'content', 'miniapp');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE app_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- SECTION 2: CORE USER & PROFILE TABLES
-- =============================================

-- PROFILES (extends Supabase auth.users)
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

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON profiles(created_at DESC);

-- SUB_ADMINS
CREATE TABLE IF NOT EXISTS sub_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delegated_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  agency_scope UUID[] DEFAULT NULL,
  max_agencies INTEGER DEFAULT NULL,
  can_create_sub_admins BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_sub_admins_user ON sub_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_admins_active ON sub_admins(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 3: AGENCY TIER DEFINITIONS
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

-- Insert default tier definitions (ignore if exists)
INSERT INTO agency_tier_definitions (tier, display_name, price_monthly, price_annual, max_creators, max_videos_per_month, max_api_calls_per_month, storage_gb, features, color, description, is_popular, sort_order) VALUES
  ('starter', 'Starter', 2900, 29000, 5, 100, 0, 5, 
   '["basic_analytics", "dps_calculator", "video_download"]'::jsonb, 
   '#6B7280', 'Perfect for individual creators getting started', false, 1),
  ('growth', 'Growth', 5900, 59000, 15, 500, 10000, 20, 
   '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis", "pre_content_prediction", "team_collaboration"]'::jsonb, 
   '#3B82F6', 'For growing teams and small agencies', true, 2),
  ('pro', 'Pro', 9900, 99000, 50, 1000, 100000, 50, 
   '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis", "pre_content_prediction", "team_collaboration", "api_access", "white_label", "knowledge_extraction", "content_campaigns", "webhook_integrations", "priority_support"]'::jsonb, 
   '#FFD700', 'For professional agencies with advanced needs', false, 3),
  ('enterprise', 'Enterprise', 19900, 199000, 200, 5000, 1000000, 200, 
   '["basic_analytics", "dps_calculator", "video_download", "pattern_extraction", "bulk_analysis", "pre_content_prediction", "team_collaboration", "api_access", "white_label", "knowledge_extraction", "content_campaigns", "webhook_integrations", "priority_support", "custom_models", "dedicated_support", "sla_guarantee", "onboarding_session"]'::jsonb, 
   '#8B5CF6', 'For large organizations with custom requirements', false, 4)
ON CONFLICT (tier) DO NOTHING;

-- =============================================
-- SECTION 4: AGENCIES
-- =============================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier agency_tier NOT NULL DEFAULT 'starter',
  owner_id UUID REFERENCES profiles(id),
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT NULL,
  feature_overrides JSONB DEFAULT '{}'::jsonb,
  white_label_config JSONB DEFAULT NULL,
  notification_settings JSONB DEFAULT '{"email": true, "slack": false}'::jsonb,
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

CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_tier ON agencies(tier);
CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(is_active) WHERE is_active = true;

-- AGENCY_MEMBERS
CREATE TABLE IF NOT EXISTS agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON agency_members(user_id);

-- =============================================
-- SECTION 5: CREATORS
-- =============================================

CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  verification_status creator_verification DEFAULT 'unverified',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
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
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_creators_user ON creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_agency ON creators(agency_id);
CREATE INDEX IF NOT EXISTS idx_creators_handle ON creators(handle);
CREATE INDEX IF NOT EXISTS idx_creators_verification ON creators(verification_status);
CREATE INDEX IF NOT EXISTS idx_creators_dps ON creators(avg_dps DESC);
CREATE INDEX IF NOT EXISTS idx_creators_followers ON creators(follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_creators_active ON creators(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 6: DEVELOPERS
-- =============================================

CREATE TABLE IF NOT EXISTS developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  display_name TEXT NOT NULL,
  bio TEXT,
  logo_url TEXT,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  github_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
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
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_developers_user ON developers(user_id);
CREATE INDEX IF NOT EXISTS idx_developers_verified ON developers(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_developers_affiliate ON developers(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_developers_active ON developers(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 7: CLIPPERS
-- =============================================

CREATE TABLE IF NOT EXISTS clippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_clippers_user ON clippers(user_id);
CREATE INDEX IF NOT EXISTS idx_clippers_handle ON clippers(handle);
CREATE INDEX IF NOT EXISTS idx_clippers_ambassador ON clippers(ambassador_code);
CREATE INDEX IF NOT EXISTS idx_clippers_tier ON clippers(ambassador_tier);
CREATE INDEX IF NOT EXISTS idx_clippers_earnings ON clippers(total_earnings_cents DESC);
CREATE INDEX IF NOT EXISTS idx_clippers_active ON clippers(is_active) WHERE is_active = true AND is_banned = false;

-- =============================================
-- SECTION 8: FEATURE TOGGLES
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

CREATE INDEX IF NOT EXISTS idx_feature_toggles_enabled ON feature_toggles(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_feature_toggles_category ON feature_toggles(category);

-- Insert default feature toggles
INSERT INTO feature_toggles (id, name, description, category, is_enabled, tier_availability, icon, sort_order) VALUES
  ('basic_analytics', 'Basic Analytics', 'View performance metrics and trends', 'analytics', true, '{starter, growth, pro, enterprise}', 'BarChart', 1),
  ('dps_calculator', 'DPS Calculator', 'Calculate Dynamic Percentile System scores', 'analytics', true, '{starter, growth, pro, enterprise}', 'Calculator', 2),
  ('pattern_extraction', 'Pattern Extraction', 'Extract viral patterns from videos', 'analytics', true, '{growth, pro, enterprise}', 'Sparkles', 3),
  ('knowledge_extraction', 'Knowledge Extraction', 'Multi-LLM consensus insights', 'analytics', true, '{pro, enterprise}', 'Brain', 4),
  ('pre_content_prediction', 'Pre-Content Prediction', 'Predict DPS before posting', 'analytics', true, '{growth, pro, enterprise}', 'TrendingUp', 5),
  ('video_download', 'Video Download', 'Download analyzed videos', 'general', true, '{starter, growth, pro, enterprise}', 'Download', 10),
  ('bulk_analysis', 'Bulk Video Analysis', 'Analyze multiple videos at once', 'general', true, '{growth, pro, enterprise}', 'Layers', 11),
  ('content_campaigns', 'Content Campaigns', 'Create campaigns to distribute content', 'campaigns', false, '{pro, enterprise}', 'Megaphone', 12),
  ('team_collaboration', 'Team Collaboration', 'Invite team members to your workspace', 'general', false, '{growth, pro, enterprise}', 'Users', 20),
  ('api_access', 'API Access', 'Programmatic access to CleanCopy features', 'integrations', false, '{pro, enterprise}', 'Code', 30),
  ('webhook_integrations', 'Webhook Integrations', 'Send events to external systems', 'integrations', false, '{pro, enterprise}', 'Webhook', 31),
  ('white_label', 'White Label', 'Custom branding and domain', 'integrations', false, '{pro, enterprise}', 'Palette', 32),
  ('custom_models', 'Custom ML Models', 'Train custom prediction models on your data', 'advanced', false, '{enterprise}', 'Cpu', 40),
  ('priority_support', 'Priority Support', '24/7 priority support access', 'advanced', false, '{pro, enterprise}', 'HeadsetIcon', 41),
  ('dedicated_support', 'Dedicated Support', 'Personal account manager', 'advanced', false, '{enterprise}', 'UserCheck', 42),
  ('sla_guarantee', 'SLA Guarantee', '99.9% uptime guarantee', 'advanced', false, '{enterprise}', 'Shield', 43)
ON CONFLICT (id) DO NOTHING;

-- AGENCY_FEATURE_OVERRIDES
CREATE TABLE IF NOT EXISTS agency_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES feature_toggles(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ,
  reason TEXT,
  enabled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_feature_overrides_agency ON agency_feature_overrides(agency_id);

-- =============================================
-- SECTION 9: USAGE QUOTAS
-- =============================================

CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_quotas_agency ON usage_quotas(agency_id);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_period ON usage_quotas(period_start, period_end);

-- =============================================
-- SECTION 10: MINI APPS MARKETPLACE
-- =============================================

-- Add new columns to existing mini_apps table if it exists
-- Otherwise create the full table
DO $$
BEGIN
  -- Check if mini_apps table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mini_apps') THEN
    -- Add missing columns if they don't exist
    BEGIN
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS developer_id UUID;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS cover_url TEXT;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS has_trial BOOLEAN DEFAULT false;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS oauth_url TEXT;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS required_scopes JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS active_installs INTEGER DEFAULT 0;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS total_revenue_cents INTEGER DEFAULT 0;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(4,2) DEFAULT 30.00;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS approval_status app_approval_status DEFAULT 'pending';
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS current_version TEXT DEFAULT '1.0.0';
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS changelog JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
      ALTER TABLE mini_apps ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Some columns may already exist or could not be added';
    END;
  ELSE
    -- Create full mini_apps table
    CREATE TABLE mini_apps (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT,
      description TEXT,
      icon_url TEXT,
      cover_url TEXT,
      screenshots JSONB DEFAULT '[]'::jsonb,
      video_url TEXT,
      category TEXT,
      tags JSONB DEFAULT '[]'::jsonb,
      is_free BOOLEAN DEFAULT false,
      price_monthly INTEGER DEFAULT 0,
      price_annual INTEGER DEFAULT 0,
      has_trial BOOLEAN DEFAULT false,
      trial_days INTEGER DEFAULT 0,
      integration_type TEXT DEFAULT 'iframe',
      app_url TEXT NOT NULL,
      oauth_url TEXT,
      webhook_url TEXT,
      required_scopes JSONB DEFAULT '[]'::jsonb,
      rating DECIMAL(2,1) DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      install_count INTEGER DEFAULT 0,
      active_installs INTEGER DEFAULT 0,
      total_revenue_cents INTEGER DEFAULT 0,
      platform_fee_rate DECIMAL(4,2) DEFAULT 30.00,
      approval_status app_approval_status DEFAULT 'pending',
      approved_at TIMESTAMPTZ,
      approved_by UUID REFERENCES profiles(id),
      rejection_reason TEXT,
      is_featured BOOLEAN DEFAULT false,
      featured_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      suspended_at TIMESTAMPTZ,
      suspension_reason TEXT,
      current_version TEXT DEFAULT '1.0.0',
      changelog JSONB DEFAULT '[]'::jsonb,
      published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mini_apps_developer ON mini_apps(developer_id);
CREATE INDEX IF NOT EXISTS idx_mini_apps_slug ON mini_apps(slug);
CREATE INDEX IF NOT EXISTS idx_mini_apps_category ON mini_apps(category);
CREATE INDEX IF NOT EXISTS idx_mini_apps_featured ON mini_apps(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_mini_apps_rating ON mini_apps(rating DESC);
CREATE INDEX IF NOT EXISTS idx_mini_apps_installs ON mini_apps(install_count DESC);
CREATE INDEX IF NOT EXISTS idx_mini_apps_active ON mini_apps(is_active) WHERE is_active = true;

-- MINI_APP_INSTALLS
CREATE TABLE IF NOT EXISTS mini_app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  installed_by UUID NOT NULL REFERENCES profiles(id),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
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
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(mini_app_id, installed_by)
);

CREATE INDEX IF NOT EXISTS idx_mini_app_installs_app ON mini_app_installs(mini_app_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_installs_user ON mini_app_installs(installed_by);
CREATE INDEX IF NOT EXISTS idx_mini_app_installs_agency ON mini_app_installs(agency_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_installs_status ON mini_app_installs(subscription_status);

-- MINI_APP_REVIEWS
CREATE TABLE IF NOT EXISTS mini_app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mini_app_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mini_app_reviews_app ON mini_app_reviews(mini_app_id);
CREATE INDEX IF NOT EXISTS idx_mini_app_reviews_rating ON mini_app_reviews(rating);

-- =============================================
-- SECTION 11: CAMPAIGNS (3-Layer Rewards)
-- =============================================

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type campaign_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',
  owner_id UUID REFERENCES profiles(id),
  agency_id UUID REFERENCES agencies(id),
  creator_id UUID REFERENCES creators(id),
  developer_id UUID REFERENCES developers(id),
  mini_app_id UUID REFERENCES mini_apps(id),
  thumbnail_url TEXT,
  cover_url TEXT,
  budget_cents INTEGER NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_agency ON campaigns(agency_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_developer ON campaigns(developer_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_public ON campaigns(is_public) WHERE is_public = true AND status = 'active';

-- CAMPAIGN_PARTICIPATIONS
CREATE TABLE IF NOT EXISTS campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  clipper_id UUID NOT NULL REFERENCES clippers(id) ON DELETE CASCADE,
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
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(campaign_id, clipper_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_participations_campaign ON campaign_participations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_clipper ON campaign_participations(clipper_id);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_status ON campaign_participations(status);
CREATE INDEX IF NOT EXISTS idx_campaign_participations_earnings ON campaign_participations(total_earnings_cents DESC);

-- CAMPAIGN_INVITES
CREATE TABLE IF NOT EXISTS campaign_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  clipper_id UUID REFERENCES clippers(id) ON DELETE CASCADE,
  email TEXT,
  invite_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_campaign_invites_campaign ON campaign_invites(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_clipper ON campaign_invites(clipper_id);
CREATE INDEX IF NOT EXISTS idx_campaign_invites_code ON campaign_invites(invite_code);

-- =============================================
-- SECTION 12: AFFILIATE PROGRAM
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

INSERT INTO affiliate_tiers_config (tier, display_name, commission_rate, recurring_commission_rate, min_referrals, min_revenue_cents, color, perks, requirements) VALUES
  ('bronze', 'Bronze', 10.00, 5.00, 0, 0, '#CD7F32', 
   '["basic_tracking", "30_day_cookie", "monthly_payouts"]'::jsonb,
   '{}'::jsonb),
  ('silver', 'Silver', 15.00, 7.50, 10, 50000, '#C0C0C0', 
   '["basic_tracking", "60_day_cookie", "bi_weekly_payouts", "priority_support"]'::jsonb,
   '{"min_conversion_rate": 5}'::jsonb),
  ('gold', 'Gold', 20.00, 10.00, 50, 250000, '#FFD700', 
   '["basic_tracking", "90_day_cookie", "weekly_payouts", "priority_support", "account_manager", "custom_landing_pages", "early_access"]'::jsonb,
   '{"min_conversion_rate": 7}'::jsonb),
  ('platinum', 'Platinum', 25.00, 12.50, 200, 1000000, '#E5E4E2', 
   '["basic_tracking", "lifetime_cookie", "weekly_payouts", "priority_support", "account_manager", "custom_landing_pages", "early_access", "revenue_share", "co_marketing", "api_access"]'::jsonb,
   '{"min_conversion_rate": 10}'::jsonb),
  ('diamond', 'Diamond', 30.00, 15.00, 500, 5000000, '#B9F2FF', 
   '["basic_tracking", "lifetime_cookie", "instant_payouts", "priority_support", "dedicated_manager", "custom_landing_pages", "early_access", "revenue_share", "co_marketing", "api_access", "equity_consideration", "advisory_board"]'::jsonb,
   '{"min_conversion_rate": 12}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- AFFILIATE_REFERRALS
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referrer_type TEXT NOT NULL,
  referred_user_id UUID REFERENCES profiles(id),
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
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON affiliate_referrals(status);

-- =============================================
-- SECTION 13: PAYOUTS
-- =============================================

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  recipient_type TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  breakdown JSONB DEFAULT '{}'::jsonb,
  status payout_status DEFAULT 'pending',
  payout_method JSONB NOT NULL,
  processor TEXT,
  processor_reference TEXT,
  processor_fee_cents INTEGER DEFAULT 0,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_payouts_recipient ON payouts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested ON payouts(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_type ON payouts(recipient_type);

-- EARNINGS_LEDGER
CREATE TABLE IF NOT EXISTS earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  source_name TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  payout_id UUID REFERENCES payouts(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  available_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_earnings_ledger_user ON earnings_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_ledger_source ON earnings_ledger(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_earnings_ledger_status ON earnings_ledger(status);
CREATE INDEX IF NOT EXISTS idx_earnings_ledger_earned ON earnings_ledger(earned_at DESC);

-- =============================================
-- SECTION 14: AUDIT & ACTIVITY LOGGING
-- =============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
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
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_log_retention ON audit_log(retain_until);

-- ACTIVITY_FEED
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT,
  severity TEXT DEFAULT 'info',
  actor_id UUID REFERENCES profiles(id),
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
  agency_id UUID REFERENCES agencies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX IF NOT EXISTS idx_activity_feed_agency ON activity_feed(agency_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_expires ON activity_feed(expires_at);

-- =============================================
-- SECTION 15: NOTIFICATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =============================================
-- SECTION 16: FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (drop first if exists)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sub_admins_updated_at ON sub_admins;
CREATE TRIGGER update_sub_admins_updated_at BEFORE UPDATE ON sub_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agencies_updated_at ON agencies;
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clippers_updated_at ON clippers;
CREATE TRIGGER update_clippers_updated_at BEFORE UPDATE ON clippers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mini_apps_updated_at ON mini_apps;
CREATE TRIGGER update_mini_apps_updated_at BEFORE UPDATE ON mini_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_toggles_updated_at ON feature_toggles;
CREATE TRIGGER update_feature_toggles_updated_at BEFORE UPDATE ON feature_toggles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_quotas_updated_at ON usage_quotas;
CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON usage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for audit logging
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  actor_uuid UUID;
  actor_role_val user_role;
BEGIN
  actor_uuid := auth.uid();
  
  IF actor_uuid IS NOT NULL THEN
    SELECT role INTO actor_role_val FROM profiles WHERE id = actor_uuid;
  END IF;

  INSERT INTO audit_log (
    actor_id,
    actor_role,
    action,
    action_category,
    resource_type,
    resource_id,
    resource_name,
    changes
  )
  VALUES (
    actor_uuid,
    actor_role_val,
    TG_OP,
    'data',
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE 
      WHEN TG_TABLE_NAME = 'agencies' THEN COALESCE(NEW.name, OLD.name)
      WHEN TG_TABLE_NAME = 'creators' THEN COALESCE(NEW.handle, OLD.handle)
      WHEN TG_TABLE_NAME = 'campaigns' THEN COALESCE(NEW.name, OLD.name)
      WHEN TG_TABLE_NAME = 'mini_apps' THEN COALESCE(NEW.name, OLD.name)
      ELSE NULL
    END,
    jsonb_build_object(
      'before', CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'after', CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers (drop first if exists)
DROP TRIGGER IF EXISTS audit_agencies ON agencies;
CREATE TRIGGER audit_agencies AFTER INSERT OR UPDATE OR DELETE ON agencies FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_creators ON creators;
CREATE TRIGGER audit_creators AFTER INSERT OR UPDATE OR DELETE ON creators FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_campaigns ON campaigns;
CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_mini_apps ON mini_apps;
CREATE TRIGGER audit_mini_apps AFTER INSERT OR UPDATE OR DELETE ON mini_apps FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_feature_toggles ON feature_toggles;
CREATE TRIGGER audit_feature_toggles AFTER UPDATE ON feature_toggles FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_payouts ON payouts;
CREATE TRIGGER audit_payouts AFTER INSERT OR UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_clippers ON clippers;
CREATE TRIGGER audit_clippers AFTER INSERT OR UPDATE OR DELETE ON clippers FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_developers ON developers;
CREATE TRIGGER audit_developers AFTER INSERT OR UPDATE OR DELETE ON developers FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Helper functions
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_current_role user_role;
BEGIN
  SELECT role INTO user_current_role FROM profiles WHERE id = auth.uid();
  
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

CREATE OR REPLACE FUNCTION has_sub_admin_permission(permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN sub_admins sa ON p.id = sa.user_id
    WHERE p.id = auth.uid() 
    AND p.role IN ('chairman', 'sub_admin')
    AND sa.is_active = true
    AND (
      p.role = 'chairman' OR 
      sa.delegated_permissions ? permission
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_agency(agency_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_current_role user_role;
  user_agency_scope UUID[];
BEGIN
  SELECT role INTO user_current_role FROM profiles WHERE id = auth.uid();
  
  IF user_current_role = 'chairman' THEN
    RETURN true;
  END IF;
  
  IF user_current_role = 'sub_admin' THEN
    SELECT agency_scope INTO user_agency_scope 
    FROM sub_admins 
    WHERE user_id = auth.uid() AND is_active = true;
    
    IF user_agency_scope IS NULL THEN
      RETURN true;
    END IF;
    
    RETURN agency_uuid = ANY(user_agency_scope);
  END IF;
  
  IF user_current_role = 'agency' THEN
    RETURN EXISTS (
      SELECT 1 FROM agencies WHERE id = agency_uuid AND owner_id = auth.uid()
      UNION
      SELECT 1 FROM agency_members WHERE agency_id = agency_uuid AND user_id = auth.uid() AND is_active = true
    );
  END IF;
  
  IF user_current_role = 'creator' THEN
    RETURN EXISTS (
      SELECT 1 FROM creators WHERE user_id = auth.uid() AND agency_id = agency_uuid AND is_active = true
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SECTION 17: ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_feature_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_app_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_app_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =============================================
-- PROFILES POLICIES
-- =============================================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Chairman can update all profiles" ON profiles
  FOR UPDATE USING (is_chairman());

CREATE POLICY "Chairman can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_chairman());

-- =============================================
-- SUB_ADMINS POLICIES
-- =============================================

CREATE POLICY "Chairman full access to sub_admins" ON sub_admins
  FOR ALL USING (is_chairman());

CREATE POLICY "Sub-admins can view own record" ON sub_admins
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- AGENCIES POLICIES
-- =============================================

CREATE POLICY "Public can view active agencies" ON agencies
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can view all agencies" ON agencies
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Chairman can manage all agencies" ON agencies
  FOR ALL USING (is_chairman());

CREATE POLICY "Sub-admin can manage scoped agencies" ON agencies
  FOR ALL USING (has_sub_admin_permission('manage_agencies') AND can_access_agency(id));

CREATE POLICY "Agency owners can update own agency" ON agencies
  FOR UPDATE USING (owner_id = auth.uid());

-- =============================================
-- FEATURE_TOGGLES POLICIES
-- =============================================

CREATE POLICY "Anyone can view feature toggles" ON feature_toggles
  FOR SELECT USING (true);

CREATE POLICY "Chairman can manage feature toggles" ON feature_toggles
  FOR ALL USING (is_chairman());

-- =============================================
-- MINI_APPS POLICIES
-- =============================================

CREATE POLICY "Anyone can view approved apps" ON mini_apps
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can view all apps" ON mini_apps
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Developers can manage own apps" ON mini_apps
  FOR ALL USING (
    developer_id IS NULL OR
    EXISTS (SELECT 1 FROM developers WHERE id = mini_apps.developer_id AND user_id = auth.uid())
  );

CREATE POLICY "Chairman can manage all apps" ON mini_apps
  FOR ALL USING (is_chairman());

-- =============================================
-- CAMPAIGNS POLICIES
-- =============================================

CREATE POLICY "Anyone can view public campaigns" ON campaigns
  FOR SELECT USING (is_public = true AND status = 'active');

CREATE POLICY "Owners can manage own campaigns" ON campaigns
  FOR ALL USING (
    owner_id = auth.uid()
    OR (agency_id IS NOT NULL AND can_access_agency(agency_id))
    OR (developer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM developers WHERE id = campaigns.developer_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Admin can view all campaigns" ON campaigns
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Chairman can manage all campaigns" ON campaigns
  FOR ALL USING (is_chairman());

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- AUDIT_LOG POLICIES
-- =============================================

CREATE POLICY "Admin can view audit logs" ON audit_log
  FOR SELECT USING (is_chairman() OR has_sub_admin_permission('view_analytics'));

-- =============================================
-- ACTIVITY_FEED POLICIES
-- =============================================

CREATE POLICY "Admin can view all activity" ON activity_feed
  FOR SELECT USING (
    visibility = 'admin' AND user_has_role('sub_admin')
  );

CREATE POLICY "Agency can view agency activity" ON activity_feed
  FOR SELECT USING (
    visibility = 'agency' AND can_access_agency(agency_id)
  );

CREATE POLICY "Anyone can view public activity" ON activity_feed
  FOR SELECT USING (visibility = 'public');

-- =============================================
-- PAYOUTS POLICIES
-- =============================================

CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can request own payouts" ON payouts
  FOR INSERT WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Admin can view all payouts" ON payouts
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Chairman can manage all payouts" ON payouts
  FOR ALL USING (is_chairman() OR has_sub_admin_permission('manage_payouts'));

-- =============================================
-- EARNINGS_LEDGER POLICIES
-- =============================================

CREATE POLICY "Users can view own earnings" ON earnings_ledger
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all earnings" ON earnings_ledger
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- CREATORS POLICIES
-- =============================================

CREATE POLICY "Public can view verified creators" ON creators
  FOR SELECT USING (verification_status IN ('verified', 'featured') AND is_active = true);

CREATE POLICY "Admin can view all creators" ON creators
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Users can manage own creator profile" ON creators
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Agency can view their creators" ON creators
  FOR SELECT USING (can_access_agency(agency_id));

CREATE POLICY "Chairman can manage all creators" ON creators
  FOR ALL USING (is_chairman());

-- =============================================
-- DEVELOPERS POLICIES
-- =============================================

CREATE POLICY "Public can view verified developers" ON developers
  FOR SELECT USING (is_verified = true AND is_active = true);

CREATE POLICY "Admin can view all developers" ON developers
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Users can manage own developer profile" ON developers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Chairman can manage all developers" ON developers
  FOR ALL USING (is_chairman());

-- =============================================
-- CLIPPERS POLICIES
-- =============================================

CREATE POLICY "Public can view active clippers" ON clippers
  FOR SELECT USING (is_active = true AND is_banned = false);

CREATE POLICY "Admin can view all clippers" ON clippers
  FOR SELECT USING (user_has_role('sub_admin'));

CREATE POLICY "Users can manage own clipper profile" ON clippers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Chairman can manage all clippers" ON clippers
  FOR ALL USING (is_chairman());

-- =============================================
-- CAMPAIGN_PARTICIPATIONS POLICIES
-- =============================================

CREATE POLICY "Clippers can view own participations" ON campaign_participations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clippers WHERE id = campaign_participations.clipper_id AND user_id = auth.uid())
  );

CREATE POLICY "Clippers can manage own participations" ON campaign_participations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM clippers WHERE id = campaign_participations.clipper_id AND user_id = auth.uid())
  );

CREATE POLICY "Campaign owners can view participations" ON campaign_participations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_participations.campaign_id 
      AND (c.owner_id = auth.uid() OR can_access_agency(c.agency_id))
    )
  );

CREATE POLICY "Admin can view all participations" ON campaign_participations
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- AFFILIATE_REFERRALS POLICIES
-- =============================================

CREATE POLICY "Users can view own referrals" ON affiliate_referrals
  FOR SELECT USING (referrer_id = auth.uid());

CREATE POLICY "Admin can view all referrals" ON affiliate_referrals
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- GRANTS FOR SERVICE ROLE
-- =============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =============================================
-- SCHEMA MIGRATION COMPLETE
-- =============================================
-- This safe migration handles existing objects
-- Run this to add/update tables without errors
-- =============================================



























































































