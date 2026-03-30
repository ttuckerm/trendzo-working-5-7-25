-- =============================================
-- CLEANCOPY MULTI-TENANT ADMIN SCHEMA
-- Version: 1.0.0
-- Date: December 5, 2024
-- =============================================
-- This schema supports:
-- 1. Role-based access control (chairman > sub_admin > agency > developer > creator > clipper)
-- 2. Multi-tenant organization hierarchy
-- 3. Feature toggles and usage quotas
-- 4. 3-layer rewards ecosystem (platform, content, miniapp campaigns)
-- 5. Comprehensive audit logging
-- =============================================

-- =============================================
-- SECTION 1: ENUMS
-- =============================================

-- User roles in hierarchy order (highest to lowest)
CREATE TYPE user_role AS ENUM ('chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper');

-- Agency subscription tiers
CREATE TYPE agency_tier AS ENUM ('starter', 'growth', 'pro', 'enterprise');

-- Creator verification status
CREATE TYPE creator_verification AS ENUM ('unverified', 'pending', 'verified', 'featured');

-- Campaign types (3 layers)
CREATE TYPE campaign_type AS ENUM ('platform', 'content', 'miniapp');

-- Campaign lifecycle status
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Affiliate/ambassador tiers
CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- Payout processing status
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Mini app approval status
CREATE TYPE app_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

-- =============================================
-- SECTION 2: CORE USER & PROFILE TABLES
-- =============================================

-- PROFILES (extends Supabase auth.users)
-- Central user table linking to auth system
CREATE TABLE profiles (
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

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created ON profiles(created_at DESC);

-- SUB_ADMINS (delegated administrators)
-- Chairman can delegate specific permissions to sub-admins
CREATE TABLE sub_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  delegated_permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Permissions: ["manage_agencies", "manage_creators", "manage_campaigns", "manage_payouts", "view_analytics", "manage_features", "manage_developers", "manage_apps"]
  agency_scope UUID[] DEFAULT NULL, -- NULL = all agencies, array = specific agencies only
  max_agencies INTEGER DEFAULT NULL, -- NULL = unlimited
  can_create_sub_admins BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_sub_admins_user ON sub_admins(user_id);
CREATE INDEX idx_sub_admins_active ON sub_admins(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 3: AGENCY TIER DEFINITIONS
-- =============================================

-- AGENCY_TIER_DEFINITIONS
-- Defines what each tier includes
CREATE TABLE agency_tier_definitions (
  tier agency_tier PRIMARY KEY,
  display_name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  price_annual INTEGER, -- in cents (discount for annual)
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

-- Insert default tier definitions
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
   '#8B5CF6', 'For large organizations with custom requirements', false, 4);

-- =============================================
-- SECTION 4: AGENCIES
-- =============================================

-- AGENCIES
-- Organizations that own creators
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier agency_tier NOT NULL DEFAULT 'starter',
  owner_id UUID REFERENCES profiles(id),
  
  -- Branding
  logo_url TEXT,
  cover_url TEXT,
  website TEXT,
  description TEXT,
  
  -- Contact
  contact_email TEXT,
  contact_phone TEXT,
  address JSONB DEFAULT NULL, -- {street, city, state, country, postal_code}
  
  -- Configuration
  feature_overrides JSONB DEFAULT '{}'::jsonb, -- Override tier features
  white_label_config JSONB DEFAULT NULL, -- {domain, colors, logo, favicon, custom_css}
  notification_settings JSONB DEFAULT '{"email": true, "slack": false}'::jsonb,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_email TEXT,
  billing_cycle_start DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agencies_slug ON agencies(slug);
CREATE INDEX idx_agencies_tier ON agencies(tier);
CREATE INDEX idx_agencies_owner ON agencies(owner_id);
CREATE INDEX idx_agencies_active ON agencies(is_active) WHERE is_active = true;

-- AGENCY_MEMBERS
-- Team members within an agency (beyond the owner)
CREATE TABLE agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

CREATE INDEX idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX idx_agency_members_user ON agency_members(user_id);

-- =============================================
-- SECTION 5: CREATORS
-- =============================================

-- CREATORS
-- Content creators (can belong to agency or be independent)
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL, -- NULL = independent
  
  -- Identity
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  
  -- Verification
  verification_status creator_verification DEFAULT 'unverified',
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  
  -- Stats (denormalized for performance)
  follower_count BIGINT DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  total_videos INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  avg_dps DECIMAL(5,2) DEFAULT 0,
  best_dps DECIMAL(5,2) DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Platform connections
  platforms JSONB DEFAULT '[]'::jsonb, -- [{platform: "tiktok", username: "@...", followers: 0, connected: true}]
  
  -- Settings
  revenue_share_rate DECIMAL(4,2) DEFAULT 70.00, -- Creator's share percentage
  payout_method JSONB DEFAULT NULL,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_creators_user ON creators(user_id);
CREATE INDEX idx_creators_agency ON creators(agency_id);
CREATE INDEX idx_creators_handle ON creators(handle);
CREATE INDEX idx_creators_verification ON creators(verification_status);
CREATE INDEX idx_creators_dps ON creators(avg_dps DESC);
CREATE INDEX idx_creators_followers ON creators(follower_count DESC);
CREATE INDEX idx_creators_active ON creators(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 6: DEVELOPERS (Mini App Ecosystem)
-- =============================================

-- DEVELOPERS
-- Third-party developers who build mini apps
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Identity
  company_name TEXT,
  display_name TEXT NOT NULL,
  bio TEXT,
  logo_url TEXT,
  
  -- Contact
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  website TEXT,
  github_url TEXT,
  
  -- Verification & Trust
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  trust_score INTEGER DEFAULT 0, -- 0-100
  
  -- Affiliate Program
  affiliate_tier affiliate_tier DEFAULT 'bronze',
  affiliate_code TEXT UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_referral_revenue_cents INTEGER DEFAULT 0,
  
  -- Revenue
  total_revenue_cents INTEGER DEFAULT 0,
  pending_payout_cents INTEGER DEFAULT 0,
  payout_method JSONB DEFAULT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_developers_user ON developers(user_id);
CREATE INDEX idx_developers_verified ON developers(is_verified) WHERE is_verified = true;
CREATE INDEX idx_developers_affiliate ON developers(affiliate_code);
CREATE INDEX idx_developers_active ON developers(is_active) WHERE is_active = true;

-- =============================================
-- SECTION 7: CLIPPERS (Rewards Participants)
-- =============================================

-- CLIPPERS
-- Users who participate in campaigns by creating/sharing clips
CREATE TABLE clippers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Identity
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Ambassador Program
  ambassador_tier affiliate_tier DEFAULT 'bronze',
  ambassador_code TEXT UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  
  -- Stats
  total_campaigns_joined INTEGER DEFAULT 0,
  total_clips_submitted INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_earnings_cents INTEGER DEFAULT 0,
  avg_clip_performance DECIMAL(5,2) DEFAULT 0,
  
  -- Platform connections
  platforms JSONB DEFAULT '[]'::jsonb, -- [{platform: "tiktok", username: "@...", followers: 0, connected: true}]
  
  -- Payout
  payout_method JSONB DEFAULT NULL, -- {type: "paypal", email: "..."} or {type: "bank", ...}
  min_payout_cents INTEGER DEFAULT 5000, -- $50 minimum
  auto_payout BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(user_id)
);

CREATE INDEX idx_clippers_user ON clippers(user_id);
CREATE INDEX idx_clippers_handle ON clippers(handle);
CREATE INDEX idx_clippers_ambassador ON clippers(ambassador_code);
CREATE INDEX idx_clippers_tier ON clippers(ambassador_tier);
CREATE INDEX idx_clippers_earnings ON clippers(total_earnings_cents DESC);
CREATE INDEX idx_clippers_active ON clippers(is_active) WHERE is_active = true AND is_banned = false;

-- =============================================
-- SECTION 8: FEATURE TOGGLES
-- =============================================

-- FEATURE_TOGGLES (global feature flags)
CREATE TABLE feature_toggles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general', -- general, analytics, campaigns, integrations, advanced
  is_enabled BOOLEAN DEFAULT false,
  tier_availability agency_tier[] DEFAULT '{starter, growth, pro, enterprise}',
  rollout_percentage INTEGER DEFAULT 100, -- For gradual rollouts (0-100)
  requires_setup BOOLEAN DEFAULT false,
  setup_url TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_toggles_enabled ON feature_toggles(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_feature_toggles_category ON feature_toggles(category);

-- Insert default feature toggles
INSERT INTO feature_toggles (id, name, description, category, is_enabled, tier_availability, icon, sort_order) VALUES
  -- Analytics Features
  ('basic_analytics', 'Basic Analytics', 'View performance metrics and trends', 'analytics', true, '{starter, growth, pro, enterprise}', 'BarChart', 1),
  ('dps_calculator', 'DPS Calculator', 'Calculate Dynamic Percentile System scores', 'analytics', true, '{starter, growth, pro, enterprise}', 'Calculator', 2),
  ('pattern_extraction', 'Pattern Extraction', 'Extract viral patterns from videos', 'analytics', true, '{growth, pro, enterprise}', 'Sparkles', 3),
  ('knowledge_extraction', 'Knowledge Extraction', 'Multi-LLM consensus insights', 'analytics', true, '{pro, enterprise}', 'Brain', 4),
  ('pre_content_prediction', 'Pre-Content Prediction', 'Predict DPS before posting', 'analytics', true, '{growth, pro, enterprise}', 'TrendingUp', 5),
  
  -- Content Features
  ('video_download', 'Video Download', 'Download analyzed videos', 'general', true, '{starter, growth, pro, enterprise}', 'Download', 10),
  ('bulk_analysis', 'Bulk Video Analysis', 'Analyze multiple videos at once', 'general', true, '{growth, pro, enterprise}', 'Layers', 11),
  ('content_campaigns', 'Content Campaigns', 'Create campaigns to distribute content', 'campaigns', false, '{pro, enterprise}', 'Megaphone', 12),
  
  -- Team Features
  ('team_collaboration', 'Team Collaboration', 'Invite team members to your workspace', 'general', false, '{growth, pro, enterprise}', 'Users', 20),
  
  -- Integration Features
  ('api_access', 'API Access', 'Programmatic access to CleanCopy features', 'integrations', false, '{pro, enterprise}', 'Code', 30),
  ('webhook_integrations', 'Webhook Integrations', 'Send events to external systems', 'integrations', false, '{pro, enterprise}', 'Webhook', 31),
  ('white_label', 'White Label', 'Custom branding and domain', 'integrations', false, '{pro, enterprise}', 'Palette', 32),
  
  -- Advanced Features
  ('custom_models', 'Custom ML Models', 'Train custom prediction models on your data', 'advanced', false, '{enterprise}', 'Cpu', 40),
  ('priority_support', 'Priority Support', '24/7 priority support access', 'advanced', false, '{pro, enterprise}', 'HeadsetIcon', 41),
  ('dedicated_support', 'Dedicated Support', 'Personal account manager', 'advanced', false, '{enterprise}', 'UserCheck', 42),
  ('sla_guarantee', 'SLA Guarantee', '99.9% uptime guarantee', 'advanced', false, '{enterprise}', 'Shield', 43);

-- AGENCY_FEATURE_OVERRIDES
-- Per-agency feature flag overrides
CREATE TABLE agency_feature_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES feature_toggles(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL,
  expires_at TIMESTAMPTZ, -- Optional expiration for trials
  reason TEXT,
  enabled_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, feature_id)
);

CREATE INDEX idx_agency_feature_overrides_agency ON agency_feature_overrides(agency_id);

-- =============================================
-- SECTION 9: USAGE QUOTAS
-- =============================================

-- USAGE_QUOTAS
-- Track resource usage per agency per billing period
CREATE TABLE usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Counts
  videos_analyzed INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  storage_used_mb INTEGER DEFAULT 0,
  creators_count INTEGER DEFAULT 0,
  team_members_count INTEGER DEFAULT 0,
  campaigns_active INTEGER DEFAULT 0,
  
  -- Alerts
  quota_warning_sent BOOLEAN DEFAULT false,
  quota_exceeded_sent BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agency_id, period_start)
);

CREATE INDEX idx_usage_quotas_agency ON usage_quotas(agency_id);
CREATE INDEX idx_usage_quotas_period ON usage_quotas(period_start, period_end);

-- =============================================
-- SECTION 10: MINI APPS MARKETPLACE
-- =============================================

-- MINI_APPS
-- Third-party apps in the marketplace
CREATE TABLE mini_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  
  -- Media
  icon_url TEXT,
  cover_url TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb, -- [{url, caption}]
  video_url TEXT, -- Demo video
  
  -- Categorization
  category TEXT NOT NULL, -- analytics, automation, content, marketing, finance, utility
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Pricing
  is_free BOOLEAN DEFAULT false,
  price_monthly INTEGER DEFAULT 0, -- in cents
  price_annual INTEGER DEFAULT 0, -- in cents
  has_trial BOOLEAN DEFAULT false,
  trial_days INTEGER DEFAULT 0,
  
  -- Integration
  integration_type TEXT DEFAULT 'iframe', -- iframe, api, redirect, embed
  app_url TEXT NOT NULL,
  oauth_url TEXT,
  webhook_url TEXT,
  required_scopes JSONB DEFAULT '[]'::jsonb,
  
  -- Stats (denormalized)
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  active_installs INTEGER DEFAULT 0,
  
  -- Revenue
  total_revenue_cents INTEGER DEFAULT 0,
  platform_fee_rate DECIMAL(4,2) DEFAULT 30.00, -- Platform takes 30%
  
  -- Approval
  approval_status app_approval_status DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  
  -- Status
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Version
  current_version TEXT DEFAULT '1.0.0',
  changelog JSONB DEFAULT '[]'::jsonb, -- [{version, date, changes: []}]
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_mini_apps_developer ON mini_apps(developer_id);
CREATE INDEX idx_mini_apps_slug ON mini_apps(slug);
CREATE INDEX idx_mini_apps_category ON mini_apps(category);
CREATE INDEX idx_mini_apps_approval ON mini_apps(approval_status);
CREATE INDEX idx_mini_apps_featured ON mini_apps(is_featured) WHERE is_featured = true;
CREATE INDEX idx_mini_apps_rating ON mini_apps(rating DESC);
CREATE INDEX idx_mini_apps_installs ON mini_apps(install_count DESC);
CREATE INDEX idx_mini_apps_active ON mini_apps(is_active) WHERE is_active = true;

-- MINI_APP_INSTALLS
-- Track which users/agencies have installed apps
CREATE TABLE mini_app_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  installed_by UUID NOT NULL REFERENCES profiles(id),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  
  -- Subscription
  subscription_status TEXT DEFAULT 'active', -- active, cancelled, expired, trial
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ DEFAULT NOW(),
  subscription_ends_at TIMESTAMPTZ,
  
  -- Payment
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Usage
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  uninstalled_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(mini_app_id, installed_by)
);

CREATE INDEX idx_mini_app_installs_app ON mini_app_installs(mini_app_id);
CREATE INDEX idx_mini_app_installs_user ON mini_app_installs(installed_by);
CREATE INDEX idx_mini_app_installs_agency ON mini_app_installs(agency_id);
CREATE INDEX idx_mini_app_installs_status ON mini_app_installs(subscription_status);

-- MINI_APP_REVIEWS
-- User reviews for mini apps
CREATE TABLE mini_app_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mini_app_id UUID NOT NULL REFERENCES mini_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  
  -- Developer response
  developer_response TEXT,
  developer_response_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(mini_app_id, user_id)
);

CREATE INDEX idx_mini_app_reviews_app ON mini_app_reviews(mini_app_id);
CREATE INDEX idx_mini_app_reviews_rating ON mini_app_reviews(rating);

-- =============================================
-- SECTION 11: CAMPAIGNS (3-Layer Rewards)
-- =============================================

-- CAMPAIGNS
-- Unified table for all 3 campaign layers
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type campaign_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status campaign_status DEFAULT 'draft',
  
  -- Owner varies by type
  owner_id UUID REFERENCES profiles(id), -- Chairman for platform campaigns
  agency_id UUID REFERENCES agencies(id), -- For content campaigns by agency
  creator_id UUID REFERENCES creators(id), -- For content campaigns by creator
  developer_id UUID REFERENCES developers(id), -- For miniapp campaigns
  mini_app_id UUID REFERENCES mini_apps(id), -- For miniapp campaigns
  
  -- Media
  thumbnail_url TEXT,
  cover_url TEXT,
  
  -- Budget & Payouts
  budget_cents INTEGER NOT NULL,
  spent_cents INTEGER DEFAULT 0,
  reserved_cents INTEGER DEFAULT 0, -- Pending payouts
  pay_per_1k_views_cents INTEGER DEFAULT 0,
  pay_per_signup_cents INTEGER DEFAULT 0, -- Platform campaigns
  pay_per_install_cents INTEGER DEFAULT 0, -- Miniapp campaigns
  pay_per_conversion_cents INTEGER DEFAULT 0, -- Generic conversions
  
  -- Bonuses
  bonus_structure JSONB DEFAULT NULL, -- [{threshold: 10000, bonus_cents: 5000}, ...]
  
  -- Source content (for content campaigns)
  source_video_url TEXT,
  source_video_id TEXT,
  source_video_dps DECIMAL(5,2),
  suggested_clips JSONB DEFAULT '[]'::jsonb, -- [{start_time, end_time, description, suggested_hook}]
  
  -- Stats (denormalized)
  total_views BIGINT DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  clips_count INTEGER DEFAULT 0,
  avg_clip_performance DECIMAL(5,2) DEFAULT 0,
  
  -- Requirements
  requirements JSONB DEFAULT '[]'::jsonb, -- [{type: "hashtag", value: "#cleancopy"}, ...]
  min_followers INTEGER DEFAULT 0,
  min_dps DECIMAL(5,2) DEFAULT 0,
  max_participants INTEGER DEFAULT NULL, -- NULL = unlimited
  allowed_platforms JSONB DEFAULT '["tiktok", "instagram", "youtube"]'::jsonb,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true, -- Listed in campaign discovery
  is_invite_only BOOLEAN DEFAULT false,
  allowed_tiers affiliate_tier[] DEFAULT '{bronze, silver, gold, platinum, diamond}',
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_owner ON campaigns(owner_id);
CREATE INDEX idx_campaigns_agency ON campaigns(agency_id);
CREATE INDEX idx_campaigns_developer ON campaigns(developer_id);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaigns_public ON campaigns(is_public) WHERE is_public = true AND status = 'active';

-- CAMPAIGN_PARTICIPATIONS
-- Clippers joining campaigns
CREATE TABLE campaign_participations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  clipper_id UUID NOT NULL REFERENCES clippers(id) ON DELETE CASCADE,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, approved, active, paused, completed, removed, rejected
  rejection_reason TEXT,
  
  -- Stats
  total_clips INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_signups INTEGER DEFAULT 0,
  total_installs INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earnings_cents INTEGER DEFAULT 0,
  pending_earnings_cents INTEGER DEFAULT 0,
  
  -- Bonuses earned
  bonuses_earned_cents INTEGER DEFAULT 0,
  
  -- Activity
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Clips submitted
  clips JSONB DEFAULT '[]'::jsonb, -- [{id, url, platform, views, earnings_cents, submitted_at, approved_at}]
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(campaign_id, clipper_id)
);

CREATE INDEX idx_campaign_participations_campaign ON campaign_participations(campaign_id);
CREATE INDEX idx_campaign_participations_clipper ON campaign_participations(clipper_id);
CREATE INDEX idx_campaign_participations_status ON campaign_participations(status);
CREATE INDEX idx_campaign_participations_earnings ON campaign_participations(total_earnings_cents DESC);

-- CAMPAIGN_INVITES
-- Direct invites to campaigns
CREATE TABLE campaign_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  clipper_id UUID REFERENCES clippers(id) ON DELETE CASCADE,
  email TEXT, -- For inviting by email
  invite_code TEXT UNIQUE,
  
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  message TEXT,
  
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_campaign_invites_campaign ON campaign_invites(campaign_id);
CREATE INDEX idx_campaign_invites_clipper ON campaign_invites(clipper_id);
CREATE INDEX idx_campaign_invites_code ON campaign_invites(invite_code);

-- =============================================
-- SECTION 12: AFFILIATE PROGRAM
-- =============================================

-- AFFILIATE_TIERS_CONFIG
-- Configuration for affiliate/ambassador tiers
CREATE TABLE affiliate_tiers_config (
  tier affiliate_tier PRIMARY KEY,
  display_name TEXT NOT NULL,
  commission_rate DECIMAL(4,2) NOT NULL, -- Base percentage
  recurring_commission_rate DECIMAL(4,2) DEFAULT 0, -- For recurring revenue
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
   '{"min_conversion_rate": 12}'::jsonb);

-- AFFILIATE_REFERRALS
-- Track referrals made by users
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referrer_type TEXT NOT NULL, -- developer, clipper, user
  
  -- Referred person
  referred_user_id UUID REFERENCES profiles(id),
  referred_email TEXT, -- Before they sign up
  referral_code TEXT NOT NULL,
  
  -- Tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, signed_up, converted, qualified, paid
  
  -- Conversion details
  subscription_tier agency_tier,
  subscription_monthly_value_cents INTEGER DEFAULT 0,
  
  -- Commission
  commission_cents INTEGER DEFAULT 0,
  recurring_commission_cents INTEGER DEFAULT 0,
  lifetime_value_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  signed_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  qualified_at TIMESTAMPTZ, -- After refund period
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_affiliate_referrals_referrer ON affiliate_referrals(referrer_id);
CREATE INDEX idx_affiliate_referrals_code ON affiliate_referrals(referral_code);
CREATE INDEX idx_affiliate_referrals_referred ON affiliate_referrals(referred_user_id);
CREATE INDEX idx_affiliate_referrals_status ON affiliate_referrals(status);

-- =============================================
-- SECTION 13: PAYOUTS
-- =============================================

-- PAYOUTS
-- Track all payouts to users
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  recipient_type TEXT NOT NULL, -- clipper, developer, affiliate, creator
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Breakdown
  breakdown JSONB DEFAULT '{}'::jsonb, -- {platform_campaigns: X, content_campaigns: Y, affiliate: Z, ...}
  
  -- Status
  status payout_status DEFAULT 'pending',
  
  -- Payout method
  payout_method JSONB NOT NULL, -- {type: "paypal", email: "..."} or {type: "stripe", account_id: "..."}
  
  -- Processing
  processor TEXT, -- paypal, stripe, wise
  processor_reference TEXT,
  processor_fee_cents INTEGER DEFAULT 0,
  
  -- Request
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES profiles(id),
  
  -- Processing
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id),
  
  -- Failure
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_payouts_recipient ON payouts(recipient_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_requested ON payouts(requested_at DESC);
CREATE INDEX idx_payouts_type ON payouts(recipient_type);

-- EARNINGS_LEDGER
-- Detailed earnings record for audit trail
CREATE TABLE earnings_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  user_type TEXT NOT NULL, -- clipper, developer, affiliate, creator
  
  -- Source
  source_type TEXT NOT NULL, -- campaign_views, campaign_signup, campaign_install, affiliate_commission, app_revenue, bonus
  source_id UUID, -- campaign_id, referral_id, etc.
  source_name TEXT,
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, available, paid, reversed
  
  -- Payout reference
  payout_id UUID REFERENCES payouts(id),
  
  -- Timestamps
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  available_at TIMESTAMPTZ, -- When it becomes withdrawable
  paid_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_earnings_ledger_user ON earnings_ledger(user_id);
CREATE INDEX idx_earnings_ledger_source ON earnings_ledger(source_type, source_id);
CREATE INDEX idx_earnings_ledger_status ON earnings_ledger(status);
CREATE INDEX idx_earnings_ledger_earned ON earnings_ledger(earned_at DESC);

-- =============================================
-- SECTION 14: AUDIT & ACTIVITY LOGGING
-- =============================================

-- AUDIT_LOG
-- Comprehensive audit trail for all actions
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  actor_id UUID REFERENCES profiles(id),
  actor_role user_role,
  actor_email TEXT,
  
  -- Action
  action TEXT NOT NULL, -- create, update, delete, login, logout, export, etc.
  action_category TEXT, -- auth, data, admin, billing, campaign, etc.
  
  -- Resource
  resource_type TEXT NOT NULL, -- agency, creator, campaign, etc.
  resource_id TEXT,
  resource_name TEXT,
  
  -- Changes
  changes JSONB DEFAULT '{}'::jsonb, -- {before: {}, after: {}, diff: {}}
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  session_id TEXT,
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Retention
  retain_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years')
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_category ON audit_log(action_category);
CREATE INDEX idx_audit_log_retention ON audit_log(retain_until);

-- ACTIVITY_FEED
-- Denormalized activity feed for fast reads (recent events)
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event type
  type TEXT NOT NULL, -- user_signup, campaign_created, payout_completed, etc.
  category TEXT, -- user, campaign, payout, system
  severity TEXT DEFAULT 'info', -- info, success, warning, error
  
  -- Actor
  actor_id UUID REFERENCES profiles(id),
  actor_name TEXT,
  actor_avatar TEXT,
  actor_role user_role,
  
  -- Target
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  target_url TEXT,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- Visibility
  visibility TEXT DEFAULT 'admin', -- admin, agency, public
  agency_id UUID REFERENCES agencies(id), -- For agency-scoped events
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- TTL
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(type);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_visibility ON activity_feed(visibility);
CREATE INDEX idx_activity_feed_agency ON activity_feed(agency_id);
CREATE INDEX idx_activity_feed_expires ON activity_feed(expires_at);

-- =============================================
-- SECTION 15: NOTIFICATIONS
-- =============================================

-- NOTIFICATIONS
-- In-app notifications for users
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  type TEXT NOT NULL, -- system, campaign, payout, achievement, etc.
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  action_label TEXT,
  
  -- Media
  icon TEXT,
  image_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  channels JSONB DEFAULT '["in_app"]'::jsonb, -- in_app, email, push
  email_sent_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

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

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sub_admins_updated_at BEFORE UPDATE ON sub_admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_developers_updated_at BEFORE UPDATE ON developers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clippers_updated_at BEFORE UPDATE ON clippers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mini_apps_updated_at BEFORE UPDATE ON mini_apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_toggles_updated_at BEFORE UPDATE ON feature_toggles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_quotas_updated_at BEFORE UPDATE ON usage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for audit logging
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  actor_uuid UUID;
  actor_role_val user_role;
BEGIN
  -- Get current user from auth context
  actor_uuid := auth.uid();
  
  -- Try to get actor's role
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

-- Apply audit triggers to key tables
CREATE TRIGGER audit_agencies AFTER INSERT OR UPDATE OR DELETE ON agencies FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_creators AFTER INSERT OR UPDATE OR DELETE ON creators FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_campaigns AFTER INSERT OR UPDATE OR DELETE ON campaigns FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_mini_apps AFTER INSERT OR UPDATE OR DELETE ON mini_apps FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_feature_toggles AFTER UPDATE ON feature_toggles FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_payouts AFTER INSERT OR UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_clippers AFTER INSERT OR UPDATE OR DELETE ON clippers FOR EACH ROW EXECUTE FUNCTION log_audit_event();
CREATE TRIGGER audit_developers AFTER INSERT OR UPDATE OR DELETE ON developers FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- Function to add activity feed entry
CREATE OR REPLACE FUNCTION add_activity_feed_entry(
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_target_name TEXT DEFAULT NULL,
  p_visibility TEXT DEFAULT 'admin',
  p_agency_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_actor_name TEXT;
  v_actor_avatar TEXT;
  v_actor_role user_role;
  v_entry_id UUID;
BEGIN
  -- Get actor details
  IF p_actor_id IS NOT NULL THEN
    SELECT display_name, avatar_url, role 
    INTO v_actor_name, v_actor_avatar, v_actor_role
    FROM profiles 
    WHERE id = p_actor_id;
  END IF;

  INSERT INTO activity_feed (
    type, category, actor_id, actor_name, actor_avatar, actor_role,
    target_type, target_id, target_name,
    title, description, visibility, agency_id, metadata
  )
  VALUES (
    p_type, p_category, p_actor_id, v_actor_name, v_actor_avatar, v_actor_role,
    p_target_type, p_target_id, p_target_name,
    p_title, p_description, p_visibility, p_agency_id, p_metadata
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_current_role user_role;
BEGIN
  SELECT role INTO user_current_role FROM profiles WHERE id = auth.uid();
  
  -- Role hierarchy: chairman > sub_admin > agency > developer > creator > clipper
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

-- Function to check if user is chairman
CREATE OR REPLACE FUNCTION is_chairman()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'chairman');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is sub_admin with specific permission
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

-- Function to check if user can access agency
CREATE OR REPLACE FUNCTION can_access_agency(agency_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_current_role user_role;
  user_agency_scope UUID[];
BEGIN
  SELECT role INTO user_current_role FROM profiles WHERE id = auth.uid();
  
  -- Chairman can access all
  IF user_current_role = 'chairman' THEN
    RETURN true;
  END IF;
  
  -- Sub-admin with scope
  IF user_current_role = 'sub_admin' THEN
    SELECT agency_scope INTO user_agency_scope 
    FROM sub_admins 
    WHERE user_id = auth.uid() AND is_active = true;
    
    -- NULL scope means all agencies
    IF user_agency_scope IS NULL THEN
      RETURN true;
    END IF;
    
    RETURN agency_uuid = ANY(user_agency_scope);
  END IF;
  
  -- Agency owner or member
  IF user_current_role = 'agency' THEN
    RETURN EXISTS (
      SELECT 1 FROM agencies WHERE id = agency_uuid AND owner_id = auth.uid()
      UNION
      SELECT 1 FROM agency_members WHERE agency_id = agency_uuid AND user_id = auth.uid() AND is_active = true
    );
  END IF;
  
  -- Creator in agency
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

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Chairman and sub_admin can view all profiles
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (user_has_role('sub_admin'));

-- Chairman can update all profiles
CREATE POLICY "Chairman can update all profiles" ON profiles
  FOR UPDATE USING (is_chairman());

-- Chairman can insert profiles
CREATE POLICY "Chairman can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_chairman());

-- =============================================
-- SUB_ADMINS POLICIES
-- =============================================

-- Only chairman can manage sub_admins
CREATE POLICY "Chairman full access to sub_admins" ON sub_admins
  FOR ALL USING (is_chairman());

-- Sub-admins can view their own record
CREATE POLICY "Sub-admins can view own record" ON sub_admins
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- AGENCIES POLICIES
-- =============================================

-- Public can view active agencies (for discovery)
CREATE POLICY "Public can view active agencies" ON agencies
  FOR SELECT USING (is_active = true);

-- Chairman and sub_admin can view all agencies
CREATE POLICY "Admin can view all agencies" ON agencies
  FOR SELECT USING (user_has_role('sub_admin'));

-- Chairman can manage all agencies
CREATE POLICY "Chairman can manage all agencies" ON agencies
  FOR ALL USING (is_chairman());

-- Sub-admin can manage scoped agencies
CREATE POLICY "Sub-admin can manage scoped agencies" ON agencies
  FOR ALL USING (has_sub_admin_permission('manage_agencies') AND can_access_agency(id));

-- Agency owners can update their agency
CREATE POLICY "Agency owners can update own agency" ON agencies
  FOR UPDATE USING (owner_id = auth.uid());

-- =============================================
-- AGENCY_MEMBERS POLICIES
-- =============================================

-- Members can view their agency's members
CREATE POLICY "Members can view agency members" ON agency_members
  FOR SELECT USING (can_access_agency(agency_id));

-- Agency admins can manage members
CREATE POLICY "Agency admins can manage members" ON agency_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agencies WHERE id = agency_members.agency_id AND owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM agency_members am 
      WHERE am.agency_id = agency_members.agency_id 
      AND am.user_id = auth.uid() 
      AND am.role = 'admin'
    )
  );

-- Chairman can manage all members
CREATE POLICY "Chairman can manage all members" ON agency_members
  FOR ALL USING (is_chairman());

-- =============================================
-- CREATORS POLICIES
-- =============================================

-- Public can view verified creators
CREATE POLICY "Public can view verified creators" ON creators
  FOR SELECT USING (verification_status IN ('verified', 'featured') AND is_active = true);

-- Admin can view all creators
CREATE POLICY "Admin can view all creators" ON creators
  FOR SELECT USING (user_has_role('sub_admin'));

-- Users can view and update their own creator profile
CREATE POLICY "Users can manage own creator profile" ON creators
  FOR ALL USING (user_id = auth.uid());

-- Agency can view their creators
CREATE POLICY "Agency can view their creators" ON creators
  FOR SELECT USING (can_access_agency(agency_id));

-- Agency can manage their creators
CREATE POLICY "Agency can manage their creators" ON creators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agencies WHERE id = creators.agency_id AND owner_id = auth.uid()
    )
  );

-- Chairman can manage all creators
CREATE POLICY "Chairman can manage all creators" ON creators
  FOR ALL USING (is_chairman());

-- =============================================
-- DEVELOPERS POLICIES
-- =============================================

-- Public can view verified developers
CREATE POLICY "Public can view verified developers" ON developers
  FOR SELECT USING (is_verified = true AND is_active = true);

-- Admin can view all developers
CREATE POLICY "Admin can view all developers" ON developers
  FOR SELECT USING (user_has_role('sub_admin'));

-- Users can manage their own developer profile
CREATE POLICY "Users can manage own developer profile" ON developers
  FOR ALL USING (user_id = auth.uid());

-- Chairman can manage all developers
CREATE POLICY "Chairman can manage all developers" ON developers
  FOR ALL USING (is_chairman());

-- =============================================
-- CLIPPERS POLICIES
-- =============================================

-- Public can view active clippers (leaderboards)
CREATE POLICY "Public can view active clippers" ON clippers
  FOR SELECT USING (is_active = true AND is_banned = false);

-- Admin can view all clippers
CREATE POLICY "Admin can view all clippers" ON clippers
  FOR SELECT USING (user_has_role('sub_admin'));

-- Users can manage their own clipper profile
CREATE POLICY "Users can manage own clipper profile" ON clippers
  FOR ALL USING (user_id = auth.uid());

-- Chairman can manage all clippers
CREATE POLICY "Chairman can manage all clippers" ON clippers
  FOR ALL USING (is_chairman());

-- =============================================
-- FEATURE_TOGGLES POLICIES
-- =============================================

-- Anyone can view feature toggles
CREATE POLICY "Anyone can view feature toggles" ON feature_toggles
  FOR SELECT USING (true);

-- Only chairman can manage feature toggles
CREATE POLICY "Chairman can manage feature toggles" ON feature_toggles
  FOR ALL USING (is_chairman());

-- =============================================
-- USAGE_QUOTAS POLICIES
-- =============================================

-- Users can view their agency's quotas
CREATE POLICY "Users can view agency quotas" ON usage_quotas
  FOR SELECT USING (can_access_agency(agency_id));

-- Admin can view all quotas
CREATE POLICY "Admin can view all quotas" ON usage_quotas
  FOR SELECT USING (user_has_role('sub_admin'));

-- Chairman can manage quotas
CREATE POLICY "Chairman can manage quotas" ON usage_quotas
  FOR ALL USING (is_chairman());

-- =============================================
-- MINI_APPS POLICIES
-- =============================================

-- Anyone can view approved and active apps
CREATE POLICY "Anyone can view approved apps" ON mini_apps
  FOR SELECT USING (approval_status = 'approved' AND is_active = true);

-- Admin can view all apps
CREATE POLICY "Admin can view all apps" ON mini_apps
  FOR SELECT USING (user_has_role('sub_admin'));

-- Developers can manage their own apps
CREATE POLICY "Developers can manage own apps" ON mini_apps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM developers WHERE id = mini_apps.developer_id AND user_id = auth.uid())
  );

-- Chairman can manage all apps
CREATE POLICY "Chairman can manage all apps" ON mini_apps
  FOR ALL USING (is_chairman());

-- =============================================
-- MINI_APP_INSTALLS POLICIES
-- =============================================

-- Users can view their own installs
CREATE POLICY "Users can view own installs" ON mini_app_installs
  FOR SELECT USING (installed_by = auth.uid() OR can_access_agency(agency_id));

-- Users can manage their own installs
CREATE POLICY "Users can manage own installs" ON mini_app_installs
  FOR ALL USING (installed_by = auth.uid());

-- Developers can view installs of their apps
CREATE POLICY "Developers can view app installs" ON mini_app_installs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mini_apps ma 
      JOIN developers d ON ma.developer_id = d.id 
      WHERE ma.id = mini_app_installs.mini_app_id AND d.user_id = auth.uid()
    )
  );

-- Admin can view all installs
CREATE POLICY "Admin can view all installs" ON mini_app_installs
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- CAMPAIGNS POLICIES
-- =============================================

-- Anyone can view public active campaigns
CREATE POLICY "Anyone can view public campaigns" ON campaigns
  FOR SELECT USING (is_public = true AND status = 'active');

-- Campaign owners can manage their campaigns
CREATE POLICY "Owners can manage own campaigns" ON campaigns
  FOR ALL USING (
    owner_id = auth.uid()
    OR (agency_id IS NOT NULL AND can_access_agency(agency_id))
    OR EXISTS (
      SELECT 1 FROM developers WHERE id = campaigns.developer_id AND user_id = auth.uid()
    )
  );

-- Admin can view all campaigns
CREATE POLICY "Admin can view all campaigns" ON campaigns
  FOR SELECT USING (user_has_role('sub_admin'));

-- Chairman can manage all campaigns
CREATE POLICY "Chairman can manage all campaigns" ON campaigns
  FOR ALL USING (is_chairman());

-- =============================================
-- CAMPAIGN_PARTICIPATIONS POLICIES
-- =============================================

-- Clippers can view their own participations
CREATE POLICY "Clippers can view own participations" ON campaign_participations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM clippers WHERE id = campaign_participations.clipper_id AND user_id = auth.uid())
  );

-- Clippers can manage their own participations
CREATE POLICY "Clippers can manage own participations" ON campaign_participations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM clippers WHERE id = campaign_participations.clipper_id AND user_id = auth.uid())
  );

-- Campaign owners can view participations
CREATE POLICY "Campaign owners can view participations" ON campaign_participations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns c 
      WHERE c.id = campaign_participations.campaign_id 
      AND (c.owner_id = auth.uid() OR can_access_agency(c.agency_id))
    )
  );

-- Admin can view all participations
CREATE POLICY "Admin can view all participations" ON campaign_participations
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- PAYOUTS POLICIES
-- =============================================

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts" ON payouts
  FOR SELECT USING (recipient_id = auth.uid());

-- Users can request payouts for themselves
CREATE POLICY "Users can request own payouts" ON payouts
  FOR INSERT WITH CHECK (recipient_id = auth.uid());

-- Admin can view all payouts
CREATE POLICY "Admin can view all payouts" ON payouts
  FOR SELECT USING (user_has_role('sub_admin'));

-- Chairman can manage all payouts
CREATE POLICY "Chairman can manage all payouts" ON payouts
  FOR ALL USING (is_chairman() OR has_sub_admin_permission('manage_payouts'));

-- =============================================
-- EARNINGS_LEDGER POLICIES
-- =============================================

-- Users can view their own earnings
CREATE POLICY "Users can view own earnings" ON earnings_ledger
  FOR SELECT USING (user_id = auth.uid());

-- Admin can view all earnings
CREATE POLICY "Admin can view all earnings" ON earnings_ledger
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- AFFILIATE_REFERRALS POLICIES
-- =============================================

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals" ON affiliate_referrals
  FOR SELECT USING (referrer_id = auth.uid());

-- Admin can view all referrals
CREATE POLICY "Admin can view all referrals" ON affiliate_referrals
  FOR SELECT USING (user_has_role('sub_admin'));

-- =============================================
-- AUDIT_LOG POLICIES
-- =============================================

-- Only chairman and sub_admin with analytics permission can view audit logs
CREATE POLICY "Admin can view audit logs" ON audit_log
  FOR SELECT USING (is_chairman() OR has_sub_admin_permission('view_analytics'));

-- =============================================
-- ACTIVITY_FEED POLICIES
-- =============================================

-- Admin can view all activity
CREATE POLICY "Admin can view all activity" ON activity_feed
  FOR SELECT USING (
    visibility = 'admin' AND user_has_role('sub_admin')
  );

-- Agency members can view agency activity
CREATE POLICY "Agency can view agency activity" ON activity_feed
  FOR SELECT USING (
    visibility = 'agency' AND can_access_agency(agency_id)
  );

-- Anyone can view public activity
CREATE POLICY "Anyone can view public activity" ON activity_feed
  FOR SELECT USING (visibility = 'public');

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications (via service role)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- SECTION 18: VIEWS FOR COMMON QUERIES
-- =============================================

-- Active campaigns view
CREATE OR REPLACE VIEW active_campaigns AS
SELECT 
  c.*,
  p.display_name as owner_name,
  a.name as agency_name,
  d.display_name as developer_name,
  ma.name as mini_app_name
FROM campaigns c
LEFT JOIN profiles p ON c.owner_id = p.id
LEFT JOIN agencies a ON c.agency_id = a.id
LEFT JOIN developers d ON c.developer_id = d.id
LEFT JOIN mini_apps ma ON c.mini_app_id = ma.id
WHERE c.status = 'active'
AND (c.end_date IS NULL OR c.end_date > NOW());

-- Agency dashboard stats view
CREATE OR REPLACE VIEW agency_dashboard_stats AS
SELECT 
  a.id as agency_id,
  a.name as agency_name,
  a.tier,
  COUNT(DISTINCT cr.id) as creator_count,
  COUNT(DISTINCT c.id) as campaign_count,
  COALESCE(SUM(c.total_views), 0) as total_views,
  COALESCE(SUM(c.spent_cents), 0) as total_spent_cents,
  uq.videos_analyzed,
  uq.api_calls,
  uq.storage_used_mb,
  atd.max_creators,
  atd.max_videos_per_month,
  atd.max_api_calls_per_month,
  atd.storage_gb
FROM agencies a
LEFT JOIN creators cr ON a.id = cr.agency_id AND cr.is_active = true
LEFT JOIN campaigns c ON a.id = c.agency_id
LEFT JOIN usage_quotas uq ON a.id = uq.agency_id 
  AND uq.period_start <= CURRENT_DATE 
  AND uq.period_end >= CURRENT_DATE
LEFT JOIN agency_tier_definitions atd ON a.tier = atd.tier
WHERE a.is_active = true
GROUP BY a.id, a.name, a.tier, uq.videos_analyzed, uq.api_calls, uq.storage_used_mb,
         atd.max_creators, atd.max_videos_per_month, atd.max_api_calls_per_month, atd.storage_gb;

-- Clipper leaderboard view
CREATE OR REPLACE VIEW clipper_leaderboard AS
SELECT 
  c.id,
  c.handle,
  c.display_name,
  c.avatar_url,
  c.ambassador_tier,
  c.total_earnings_cents,
  c.total_views,
  c.total_campaigns_joined,
  c.total_clips_submitted,
  RANK() OVER (ORDER BY c.total_earnings_cents DESC) as earnings_rank,
  RANK() OVER (ORDER BY c.total_views DESC) as views_rank
FROM clippers c
WHERE c.is_active = true AND c.is_banned = false;

-- Mini app leaderboard view
CREATE OR REPLACE VIEW mini_app_leaderboard AS
SELECT 
  ma.id,
  ma.name,
  ma.slug,
  ma.icon_url,
  ma.category,
  ma.price_monthly,
  ma.rating,
  ma.review_count,
  ma.install_count,
  d.display_name as developer_name,
  d.is_verified as developer_verified,
  RANK() OVER (ORDER BY ma.install_count DESC) as popularity_rank,
  RANK() OVER (ORDER BY ma.rating DESC) as rating_rank
FROM mini_apps ma
JOIN developers d ON ma.developer_id = d.id
WHERE ma.approval_status = 'approved' AND ma.is_active = true;

-- =============================================
-- SECTION 19: CLEANUP FUNCTIONS
-- =============================================

-- Function to clean up expired activity feed entries
CREATE OR REPLACE FUNCTION cleanup_expired_activity_feed()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM activity_feed WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old audit logs (beyond retention)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_log WHERE retain_until < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SECTION 20: GRANTS FOR SERVICE ROLE
-- =============================================

-- Grant service role access to all tables (for backend operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =============================================
-- SCHEMA COMPLETE
-- =============================================
-- 
-- Tables created: 25
-- Enums created: 8
-- Functions created: 10
-- Triggers created: 18
-- Indexes created: 60+
-- RLS policies created: 45+
-- Views created: 4
--
-- Next steps:
-- 1. Run this migration in Supabase Dashboard > SQL Editor
-- 2. Create chairman user in auth.users
-- 3. Insert chairman profile record
-- 4. Configure Stripe webhooks for billing
-- 5. Set up cron jobs for cleanup functions
-- =============================================



























































































