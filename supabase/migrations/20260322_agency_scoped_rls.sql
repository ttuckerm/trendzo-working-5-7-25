-- =============================================
-- Step 0: Ensure prerequisite tables exist
-- agencies and agency_members may not have been created if
-- 20241205_admin_schema_safe.sql was not fully applied.
-- =============================================

-- agency_tier enum (needed by agencies table)
DO $$ BEGIN
  CREATE TYPE agency_tier AS ENUM ('starter', 'growth', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- agencies table (minimum schema for FK references)
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  slug TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  tier agency_tier NOT NULL DEFAULT 'starter',
  owner_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- agency_members table (minimum schema for RLS sub-selects)
CREATE TABLE IF NOT EXISTS agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON agency_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_user ON agency_members(user_id);

-- generated_scripts needs a user_id column for RLS (it only has onboarding_profile_id)
ALTER TABLE generated_scripts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- =============================================
-- Step 1: Agency-scoped RLS policies
-- Ensures agency users see only their creators' data.
-- Chairman/sub_admin see everything.
-- Creators see only their own data.
-- =============================================

-- Enable RLS on onboarding_profiles if not already enabled
ALTER TABLE onboarding_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "onboarding_own_or_agency_or_admin" ON onboarding_profiles;

-- Policy: users see their own row, agency users see their agency's creators,
-- chairman/sub_admin see everything
CREATE POLICY "onboarding_own_or_agency_or_admin" ON onboarding_profiles
  FOR ALL
  USING (
    -- Own row
    user_id = auth.uid()
    -- Agency: see creators in their agency
    OR (
      agency_id IS NOT NULL
      AND agency_id IN (
        SELECT am.agency_id FROM agency_members am
        WHERE am.user_id = auth.uid() AND am.is_active = true
      )
    )
    -- Chairman/sub_admin: see everything
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('chairman', 'sub_admin')
    )
  );

-- Enable RLS on generated_scripts if not already enabled
ALTER TABLE generated_scripts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "scripts_own_or_agency_or_admin" ON generated_scripts;

-- Policy: same pattern for generated_scripts
CREATE POLICY "scripts_own_or_agency_or_admin" ON generated_scripts
  FOR ALL
  USING (
    -- Own row
    user_id = auth.uid()
    -- Agency: see scripts for creators in their agency
    OR (
      user_id IN (
        SELECT am2.user_id FROM agency_members am2
        WHERE am2.agency_id IN (
          SELECT am.agency_id FROM agency_members am
          WHERE am.user_id = auth.uid() AND am.is_active = true
        )
        AND am2.is_active = true
      )
    )
    -- Chairman/sub_admin: see everything
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('chairman', 'sub_admin')
    )
  );
