-- =============================================
-- Profiles table — create + enhance for auth activation
-- Creates the table if absent, then adds columns, RLS, indexes
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text DEFAULT 'creator',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'agency_id') THEN
    ALTER TABLE profiles ADD COLUMN agency_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarded') THEN
    ALTER TABLE profiles ADD COLUMN onboarded BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Index on agency_id for agency lookups
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Chairman can read all profiles
DROP POLICY IF EXISTS "profiles_select_chairman" ON profiles;
CREATE POLICY "profiles_select_chairman" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'chairman'
    )
  );

-- Chairman can update all profiles
DROP POLICY IF EXISTS "profiles_update_chairman" ON profiles;
CREATE POLICY "profiles_update_chairman" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'chairman'
    )
  );

-- Allow insert for the trigger (service role bypasses RLS, but just in case)
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
