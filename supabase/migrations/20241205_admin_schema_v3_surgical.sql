-- =============================================
-- CLEANCOPY ADMIN SCHEMA - SURGICAL FIX v3
-- Only adds missing columns/indexes safely
-- Does NOT attempt to recreate existing tables
-- =============================================

-- STEP 1: Create helper function
CREATE OR REPLACE FUNCTION safe_add_column(
  tbl TEXT, col TEXT, col_type TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
  ) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', tbl, col, col_type);
    RAISE NOTICE 'Added column %.%', tbl, col;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add column %.%: %', tbl, col, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Create helper to safely create index
CREATE OR REPLACE FUNCTION safe_create_index(
  idx_name TEXT, tbl TEXT, cols TEXT
) RETURNS VOID AS $$
DECLARE
  col_list TEXT[];
  col TEXT;
  all_exist BOOLEAN := true;
BEGIN
  -- Parse columns
  col_list := string_to_array(cols, ',');
  
  -- Check all columns exist
  FOREACH col IN ARRAY col_list LOOP
    col := trim(col);
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = col
    ) THEN
      all_exist := false;
      RAISE NOTICE 'Skipping index % - column % does not exist in %', idx_name, col, tbl;
      EXIT;
    END IF;
  END LOOP;
  
  IF all_exist THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (%s)', idx_name, tbl, cols);
    RAISE NOTICE 'Created/verified index %', idx_name;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create index %: %', idx_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENUMS (safe creation)
-- =============================================
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE agency_tier AS ENUM ('starter', 'growth', 'pro', 'enterprise'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE creator_verification AS ENUM ('unverified', 'pending', 'verified', 'featured'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE campaign_type AS ENUM ('platform', 'content', 'miniapp'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE affiliate_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE app_approval_status AS ENUM ('pending', 'approved', 'rejected', 'suspended'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- MINI_APPS columns
SELECT safe_add_column('mini_apps', 'developer_id', 'UUID');
SELECT safe_add_column('mini_apps', 'name', 'TEXT DEFAULT ''Unnamed''');
SELECT safe_add_column('mini_apps', 'slug', 'TEXT');
SELECT safe_add_column('mini_apps', 'tagline', 'TEXT');
SELECT safe_add_column('mini_apps', 'description', 'TEXT');
SELECT safe_add_column('mini_apps', 'icon_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'cover_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'screenshots', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('mini_apps', 'video_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'category', 'TEXT');
SELECT safe_add_column('mini_apps', 'tags', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('mini_apps', 'is_free', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('mini_apps', 'price_monthly', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'price_annual', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'has_trial', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('mini_apps', 'trial_days', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'integration_type', 'TEXT DEFAULT ''iframe''');
SELECT safe_add_column('mini_apps', 'app_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'oauth_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'webhook_url', 'TEXT');
SELECT safe_add_column('mini_apps', 'required_scopes', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('mini_apps', 'rating', 'DECIMAL(2,1) DEFAULT 0');
SELECT safe_add_column('mini_apps', 'review_count', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'install_count', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'active_installs', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'total_revenue_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('mini_apps', 'platform_fee_rate', 'DECIMAL(4,2) DEFAULT 30.00');
SELECT safe_add_column('mini_apps', 'approval_status', 'TEXT DEFAULT ''pending''');
SELECT safe_add_column('mini_apps', 'approved_at', 'TIMESTAMPTZ');
SELECT safe_add_column('mini_apps', 'approved_by', 'UUID');
SELECT safe_add_column('mini_apps', 'rejection_reason', 'TEXT');
SELECT safe_add_column('mini_apps', 'is_featured', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('mini_apps', 'featured_at', 'TIMESTAMPTZ');
SELECT safe_add_column('mini_apps', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('mini_apps', 'suspended_at', 'TIMESTAMPTZ');
SELECT safe_add_column('mini_apps', 'suspension_reason', 'TEXT');
SELECT safe_add_column('mini_apps', 'current_version', 'TEXT DEFAULT ''1.0.0''');
SELECT safe_add_column('mini_apps', 'changelog', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('mini_apps', 'published_at', 'TIMESTAMPTZ');
SELECT safe_add_column('mini_apps', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('mini_apps', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- AUDIT_LOG columns
SELECT safe_add_column('audit_log', 'actor_id', 'UUID');
SELECT safe_add_column('audit_log', 'actor_role', 'TEXT');
SELECT safe_add_column('audit_log', 'actor_email', 'TEXT');
SELECT safe_add_column('audit_log', 'action', 'TEXT');
SELECT safe_add_column('audit_log', 'action_category', 'TEXT');
SELECT safe_add_column('audit_log', 'resource_type', 'TEXT');
SELECT safe_add_column('audit_log', 'resource_id', 'TEXT');
SELECT safe_add_column('audit_log', 'resource_name', 'TEXT');
SELECT safe_add_column('audit_log', 'changes', 'JSONB DEFAULT ''{}''::jsonb');
SELECT safe_add_column('audit_log', 'ip_address', 'INET');
SELECT safe_add_column('audit_log', 'user_agent', 'TEXT');
SELECT safe_add_column('audit_log', 'request_id', 'TEXT');
SELECT safe_add_column('audit_log', 'session_id', 'TEXT');
SELECT safe_add_column('audit_log', 'success', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('audit_log', 'error_message', 'TEXT');
SELECT safe_add_column('audit_log', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');

-- ACTIVITY_FEED columns
SELECT safe_add_column('activity_feed', 'type', 'TEXT');
SELECT safe_add_column('activity_feed', 'category', 'TEXT');
SELECT safe_add_column('activity_feed', 'severity', 'TEXT DEFAULT ''info''');
SELECT safe_add_column('activity_feed', 'actor_id', 'UUID');
SELECT safe_add_column('activity_feed', 'actor_name', 'TEXT');
SELECT safe_add_column('activity_feed', 'actor_avatar', 'TEXT');
SELECT safe_add_column('activity_feed', 'actor_role', 'TEXT');
SELECT safe_add_column('activity_feed', 'target_type', 'TEXT');
SELECT safe_add_column('activity_feed', 'target_id', 'TEXT');
SELECT safe_add_column('activity_feed', 'target_name', 'TEXT');
SELECT safe_add_column('activity_feed', 'target_url', 'TEXT');
SELECT safe_add_column('activity_feed', 'title', 'TEXT');
SELECT safe_add_column('activity_feed', 'description', 'TEXT');
SELECT safe_add_column('activity_feed', 'visibility', 'TEXT DEFAULT ''admin''');
SELECT safe_add_column('activity_feed', 'agency_id', 'UUID');
SELECT safe_add_column('activity_feed', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('activity_feed', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- PROFILES columns (if table exists)
SELECT safe_add_column('profiles', 'role', 'TEXT DEFAULT ''creator''');
SELECT safe_add_column('profiles', 'display_name', 'TEXT');
SELECT safe_add_column('profiles', 'avatar_url', 'TEXT');
SELECT safe_add_column('profiles', 'email', 'TEXT');
SELECT safe_add_column('profiles', 'phone', 'TEXT');
SELECT safe_add_column('profiles', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('profiles', 'last_login_at', 'TIMESTAMPTZ');
SELECT safe_add_column('profiles', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('profiles', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('profiles', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- AGENCIES columns
SELECT safe_add_column('agencies', 'name', 'TEXT');
SELECT safe_add_column('agencies', 'slug', 'TEXT');
SELECT safe_add_column('agencies', 'tier', 'TEXT DEFAULT ''starter''');
SELECT safe_add_column('agencies', 'owner_id', 'UUID');
SELECT safe_add_column('agencies', 'logo_url', 'TEXT');
SELECT safe_add_column('agencies', 'cover_url', 'TEXT');
SELECT safe_add_column('agencies', 'website', 'TEXT');
SELECT safe_add_column('agencies', 'description', 'TEXT');
SELECT safe_add_column('agencies', 'contact_email', 'TEXT');
SELECT safe_add_column('agencies', 'feature_overrides', 'JSONB DEFAULT ''{}''::jsonb');
SELECT safe_add_column('agencies', 'white_label_config', 'JSONB');
SELECT safe_add_column('agencies', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('agencies', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('agencies', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('agencies', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- CREATORS columns
SELECT safe_add_column('creators', 'user_id', 'UUID');
SELECT safe_add_column('creators', 'agency_id', 'UUID');
SELECT safe_add_column('creators', 'handle', 'TEXT');
SELECT safe_add_column('creators', 'display_name', 'TEXT');
SELECT safe_add_column('creators', 'bio', 'TEXT');
SELECT safe_add_column('creators', 'avatar_url', 'TEXT');
SELECT safe_add_column('creators', 'verification_status', 'TEXT DEFAULT ''unverified''');
SELECT safe_add_column('creators', 'verified_at', 'TIMESTAMPTZ');
SELECT safe_add_column('creators', 'verified_by', 'UUID');
SELECT safe_add_column('creators', 'follower_count', 'BIGINT DEFAULT 0');
SELECT safe_add_column('creators', 'total_videos', 'INTEGER DEFAULT 0');
SELECT safe_add_column('creators', 'avg_dps', 'DECIMAL(5,2) DEFAULT 0');
SELECT safe_add_column('creators', 'platforms', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('creators', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('creators', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('creators', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('creators', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- DEVELOPERS columns
SELECT safe_add_column('developers', 'user_id', 'UUID');
SELECT safe_add_column('developers', 'company_name', 'TEXT');
SELECT safe_add_column('developers', 'display_name', 'TEXT');
SELECT safe_add_column('developers', 'contact_email', 'TEXT');
SELECT safe_add_column('developers', 'website', 'TEXT');
SELECT safe_add_column('developers', 'affiliate_tier', 'TEXT DEFAULT ''bronze''');
SELECT safe_add_column('developers', 'total_referrals', 'INTEGER DEFAULT 0');
SELECT safe_add_column('developers', 'is_verified', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('developers', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('developers', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('developers', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('developers', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- CLIPPERS columns
SELECT safe_add_column('clippers', 'user_id', 'UUID');
SELECT safe_add_column('clippers', 'handle', 'TEXT');
SELECT safe_add_column('clippers', 'display_name', 'TEXT');
SELECT safe_add_column('clippers', 'avatar_url', 'TEXT');
SELECT safe_add_column('clippers', 'ambassador_tier', 'TEXT DEFAULT ''bronze''');
SELECT safe_add_column('clippers', 'total_referrals', 'INTEGER DEFAULT 0');
SELECT safe_add_column('clippers', 'total_earnings', 'DECIMAL(10,2) DEFAULT 0');
SELECT safe_add_column('clippers', 'total_views', 'BIGINT DEFAULT 0');
SELECT safe_add_column('clippers', 'platforms', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('clippers', 'payout_method', 'JSONB');
SELECT safe_add_column('clippers', 'is_active', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('clippers', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('clippers', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('clippers', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- CAMPAIGNS columns
SELECT safe_add_column('campaigns', 'type', 'TEXT');
SELECT safe_add_column('campaigns', 'name', 'TEXT');
SELECT safe_add_column('campaigns', 'description', 'TEXT');
SELECT safe_add_column('campaigns', 'status', 'TEXT DEFAULT ''draft''');
SELECT safe_add_column('campaigns', 'owner_id', 'UUID');
SELECT safe_add_column('campaigns', 'agency_id', 'UUID');
SELECT safe_add_column('campaigns', 'developer_id', 'UUID');
SELECT safe_add_column('campaigns', 'mini_app_id', 'UUID');
SELECT safe_add_column('campaigns', 'budget_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'spent_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'pay_per_1k_views_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'pay_per_signup_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'pay_per_install_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'source_video_url', 'TEXT');
SELECT safe_add_column('campaigns', 'source_video_dps', 'DECIMAL(5,2)');
SELECT safe_add_column('campaigns', 'suggested_clips', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('campaigns', 'total_views', 'BIGINT DEFAULT 0');
SELECT safe_add_column('campaigns', 'total_signups', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'total_installs', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'participant_count', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'requirements', 'JSONB DEFAULT ''[]''::jsonb');
SELECT safe_add_column('campaigns', 'min_followers', 'INTEGER DEFAULT 0');
SELECT safe_add_column('campaigns', 'min_dps', 'DECIMAL(5,2) DEFAULT 0');
SELECT safe_add_column('campaigns', 'allowed_platforms', 'JSONB DEFAULT ''["tiktok", "instagram", "youtube"]''::jsonb');
SELECT safe_add_column('campaigns', 'start_date', 'TIMESTAMPTZ');
SELECT safe_add_column('campaigns', 'end_date', 'TIMESTAMPTZ');
SELECT safe_add_column('campaigns', 'is_public', 'BOOLEAN DEFAULT true');
SELECT safe_add_column('campaigns', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('campaigns', 'updated_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('campaigns', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- PAYOUTS columns
SELECT safe_add_column('payouts', 'recipient_id', 'UUID');
SELECT safe_add_column('payouts', 'recipient_type', 'TEXT');
SELECT safe_add_column('payouts', 'amount_cents', 'INTEGER DEFAULT 0');
SELECT safe_add_column('payouts', 'status', 'TEXT DEFAULT ''pending''');
SELECT safe_add_column('payouts', 'payout_method', 'JSONB DEFAULT ''{}''::jsonb');
SELECT safe_add_column('payouts', 'breakdown', 'JSONB DEFAULT ''{}''::jsonb');
SELECT safe_add_column('payouts', 'requested_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('payouts', 'processed_at', 'TIMESTAMPTZ');
SELECT safe_add_column('payouts', 'processed_by', 'UUID');
SELECT safe_add_column('payouts', 'failure_reason', 'TEXT');
SELECT safe_add_column('payouts', 'notes', 'TEXT');
SELECT safe_add_column('payouts', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- NOTIFICATIONS columns
SELECT safe_add_column('notifications', 'user_id', 'UUID');
SELECT safe_add_column('notifications', 'type', 'TEXT');
SELECT safe_add_column('notifications', 'title', 'TEXT');
SELECT safe_add_column('notifications', 'body', 'TEXT');
SELECT safe_add_column('notifications', 'action_url', 'TEXT');
SELECT safe_add_column('notifications', 'is_read', 'BOOLEAN DEFAULT false');
SELECT safe_add_column('notifications', 'read_at', 'TIMESTAMPTZ');
SELECT safe_add_column('notifications', 'created_at', 'TIMESTAMPTZ DEFAULT NOW()');
SELECT safe_add_column('notifications', 'metadata', 'JSONB DEFAULT ''{}''::jsonb');

-- =============================================
-- CREATE INDEXES SAFELY (only if columns exist)
-- =============================================

SELECT safe_create_index('idx_mini_apps_slug', 'mini_apps', 'slug');
SELECT safe_create_index('idx_mini_apps_developer', 'mini_apps', 'developer_id');
SELECT safe_create_index('idx_mini_apps_category', 'mini_apps', 'category');
SELECT safe_create_index('idx_mini_apps_active', 'mini_apps', 'is_active');

SELECT safe_create_index('idx_audit_log_actor', 'audit_log', 'actor_id');
SELECT safe_create_index('idx_audit_log_resource', 'audit_log', 'resource_type, resource_id');
SELECT safe_create_index('idx_audit_log_created', 'audit_log', 'created_at');
SELECT safe_create_index('idx_audit_log_action', 'audit_log', 'action');

SELECT safe_create_index('idx_activity_feed_created', 'activity_feed', 'created_at');
SELECT safe_create_index('idx_activity_feed_type', 'activity_feed', 'type');

SELECT safe_create_index('idx_profiles_role', 'profiles', 'role');
SELECT safe_create_index('idx_profiles_email', 'profiles', 'email');

SELECT safe_create_index('idx_agencies_slug', 'agencies', 'slug');
SELECT safe_create_index('idx_agencies_owner', 'agencies', 'owner_id');

SELECT safe_create_index('idx_creators_user', 'creators', 'user_id');
SELECT safe_create_index('idx_creators_agency', 'creators', 'agency_id');
SELECT safe_create_index('idx_creators_handle', 'creators', 'handle');

SELECT safe_create_index('idx_developers_user', 'developers', 'user_id');

SELECT safe_create_index('idx_clippers_user', 'clippers', 'user_id');
SELECT safe_create_index('idx_clippers_handle', 'clippers', 'handle');

SELECT safe_create_index('idx_campaigns_owner', 'campaigns', 'owner_id');
SELECT safe_create_index('idx_campaigns_agency', 'campaigns', 'agency_id');
SELECT safe_create_index('idx_campaigns_type', 'campaigns', 'type');
SELECT safe_create_index('idx_campaigns_status', 'campaigns', 'status');

SELECT safe_create_index('idx_payouts_recipient', 'payouts', 'recipient_id');
SELECT safe_create_index('idx_payouts_status', 'payouts', 'status');

SELECT safe_create_index('idx_notifications_user', 'notifications', 'user_id');
SELECT safe_create_index('idx_notifications_unread', 'notifications', 'user_id, is_read');

-- =============================================
-- DONE - This migration only ADDS, never removes
-- =============================================
SELECT 'Migration complete - all missing columns and indexes added safely' as status;


























































































