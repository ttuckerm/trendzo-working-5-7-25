-- =============================================
-- Step 1: Auth Reconciliation — Profile auto-creation trigger
-- Creates a profiles row whenever a new auth.users row is inserted.
-- Default role is 'creator'. Chairman is set in the app callback
-- based on NEXT_PUBLIC_ADMIN_EMAIL.
-- =============================================

-- Function that fires after auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, display_name, created_at, updated_at, metadata)
  VALUES (
    NEW.id,
    'creator',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    '{}'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
