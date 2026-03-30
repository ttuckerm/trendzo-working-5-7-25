-- =============================================
-- Step 1: Wire user_id into onboarding
-- Make user_id NOT NULL, add FK to auth.users, add agency_id column
-- =============================================

-- Delete anonymous/test profiles (user_id IS NULL)
DELETE FROM onboarding_profiles WHERE user_id IS NULL;

-- Add NOT NULL constraint to user_id
ALTER TABLE onboarding_profiles
  ALTER COLUMN user_id SET NOT NULL;

-- Add FK to auth.users (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_onboarding_user'
      AND table_name = 'onboarding_profiles'
  ) THEN
    ALTER TABLE onboarding_profiles
      ADD CONSTRAINT fk_onboarding_user
      FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Add agency_id column (nullable — populated when creator onboards via agency invite)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_profiles'
      AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE onboarding_profiles
      ADD COLUMN agency_id UUID REFERENCES agencies(id);
  END IF;
END $$;
