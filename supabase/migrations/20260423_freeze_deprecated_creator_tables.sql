-- =============================================================================
-- MIGRATION: Freeze deprecated creator tables — establish onboarding_profiles as canonical
-- Date: 2026-04-23
-- Phase: Substrate Pivot — Phase A3
-- =============================================================================
--
-- CANONICAL DECISION:
--   `onboarding_profiles` is the authoritative creator record table.
--   All new features must read from and write to `onboarding_profiles`.
--
-- DEPRECATED TABLES:
--   `creators`          — Hard-frozen. No live writers. Reads preserved for
--                          MCP server + admin dashboard + legacy reporting.
--   `creator_profiles`  — Soft-frozen. Active writers exist at
--                          `/api/creator/onboard` (used by /admin/creators).
--                          Full deprecation deferred until that admin flow
--                          is migrated to write to onboarding_profiles.
--
-- THIS MIGRATION:
--   - Adds table-level deprecation comments to `creators` and `creator_profiles`
--   - Adds a table-level canonical-table comment to `onboarding_profiles`
--   - Revokes INSERT/UPDATE/DELETE on `creators` from authenticated/anon roles
--     (safe because no live code writes to this table)
--   - Does NOT revoke writes on `creator_profiles` (live admin writers depend on it)
--   - Does NOT drop any column, row, or table
--
-- KNOWN FOLLOW-UPS (tracked separately, not done in this migration):
--   1. Migrate `/api/creator/onboard` writes from `creator_profiles` to
--      `onboarding_profiles`, then hard-freeze `creator_profiles`.
--   2. Investigate production traffic on `/api/creator/rebuild_profile`
--      (writer: `src/lib/creator/profile_builder.ts:117`). No src/ caller exists.
--      If unused, remove route and hard-freeze the writer path.
--   3. Resolve schema drift inside `creator_profiles`: `/api/creator/onboard`
--      and `profile_builder.ts` write incompatible column sets to the same table.
--      Reconcile before migrating either writer to `onboarding_profiles`.
-- =============================================================================

-- Step 1: Annotate `creators` as hard-deprecated
COMMENT ON TABLE public.creators IS
  'DEPRECATED (2026-04-23). Do not write. Canonical creator table is onboarding_profiles. Reads preserved for MCP + admin + legacy reporting only.';

-- Step 2: Annotate `creator_profiles` as soft-deprecated
COMMENT ON TABLE public.creator_profiles IS
  'DEPRECATED (2026-04-23). Do not add new writers. Canonical creator table is onboarding_profiles. Active legacy writers: /api/creator/onboard. Pending migration.';

-- Step 3: Annotate `onboarding_profiles` as canonical
COMMENT ON TABLE public.onboarding_profiles IS
  'CANONICAL creator record table (declared 2026-04-23). All new features must read from and write to this table. Supersedes creators and creator_profiles.';

-- Step 4: Hard-freeze writes on `creators` (safe — no live writers)
-- Reads remain fully permitted.
REVOKE INSERT, UPDATE, DELETE ON public.creators FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.creators FROM anon;

-- Note: service_role retains full access on `creators` by default.
-- Any service-role write to `creators` from application code is a bug
-- and should be migrated to onboarding_profiles.

-- Step 5: Log the decision to platform_events if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'platform_events') THEN
    INSERT INTO public.platform_events (event_type, payload, created_at)
    VALUES (
      'schema.canonical_decision',
      jsonb_build_object(
        'decision', 'onboarding_profiles_is_canonical_creator_table',
        'deprecated_tables', ARRAY['creators', 'creator_profiles'],
        'migration_file', '20260423_freeze_deprecated_creator_tables.sql'
      ),
      NOW()
    );
  END IF;
END $$;
