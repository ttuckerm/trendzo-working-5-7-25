-- Add agency_id to content_briefs — substrate structural fix (Audit Fix 1).
-- See SUBSTRATE_AUDIT_2026-04-21.md §1.A, §6.G, Appendix #3.
--
-- content_briefs is the lifecycle spine of the Creator Operations Graph.
-- It has no agency_id column; multi-tenancy is enforced only via application-
-- level joins through onboarding_profiles. Multiple API routes bypass that
-- join and write without agency scoping. This migration closes the schema
-- gap. Code updates to populate the new column ship alongside in Fix 1 Step 3.
--
-- Strategy: add column nullable, backfill from onboarding_profiles, add FK +
-- index + agency-scoped RLS SELECT policy. NOT NULL tightening is deferred
-- to a follow-up migration once the backfill is verified clean.
--
-- Safe to run multiple times (idempotent via IF NOT EXISTS + DO blocks).

-- 1. Add column (nullable).
ALTER TABLE content_briefs
  ADD COLUMN IF NOT EXISTS agency_id UUID;

-- 2. Backfill from the onboarding_profiles join. Rows with no matching
--    onboarding_profiles row, or with onboarding_profiles.agency_id = NULL,
--    are intentionally left NULL for operator review (Rule #5: do not
--    silently drop rows).
DO $$
DECLARE
  total_before INT;
  backfilled   INT;
  still_null   INT;
BEGIN
  SELECT COUNT(*) INTO total_before FROM content_briefs;

  UPDATE content_briefs cb
  SET    agency_id = op.agency_id
  FROM   onboarding_profiles op
  WHERE  cb.user_id   = op.user_id
    AND  cb.agency_id IS NULL
    AND  op.agency_id IS NOT NULL;

  GET DIAGNOSTICS backfilled = ROW_COUNT;

  SELECT COUNT(*) INTO still_null
  FROM   content_briefs
  WHERE  agency_id IS NULL;

  RAISE NOTICE 'content_briefs backfill: total=%, backfilled=%, still_null=%',
    total_before, backfilled, still_null;
END $$;

-- 3. FK constraint. ON DELETE SET NULL — if an agency is deleted, briefs are
--    preserved but detached. Matches the onboarding_profiles.agency_id pattern
--    (20260322_onboarding_user_id_required.sql:36).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'content_briefs_agency_id_fkey'
  ) THEN
    ALTER TABLE content_briefs
      ADD CONSTRAINT content_briefs_agency_id_fkey
      FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Index for agency-scoped queries.
CREATE INDEX IF NOT EXISTS idx_content_briefs_agency_id
  ON content_briefs(agency_id);

-- 5. RLS policy — agency members can SELECT briefs in their active agency.
--    PERMISSIVE (default) policies are OR'd, so this is additive to the
--    existing content_briefs_user_select (auth.uid() = user_id) policy from
--    20260303_content_briefs.sql:35. Net effect: users still see their own
--    briefs, AND agency members see briefs scoped to their agency.
DROP POLICY IF EXISTS "Agency members can read their briefs" ON content_briefs;
CREATE POLICY "Agency members can read their briefs"
  ON content_briefs FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 6. Column comment documenting backfill provenance + nullability intent.
COMMENT ON COLUMN content_briefs.agency_id IS
  'Agency this brief belongs to. Added 2026-04-21 (audit Fix 1). '
  'Backfilled from onboarding_profiles.agency_id via user_id join. '
  'Nullable by design — unaffiliated creators (no onboarding_profiles row or '
  'profile.agency_id IS NULL) have NULL here and that is valid. '
  'FK: agencies(id) ON DELETE SET NULL. '
  'Existing user-scoped RLS policies from 20260303_content_briefs.sql are '
  'unchanged; new agency-scoped SELECT policy added here.';
