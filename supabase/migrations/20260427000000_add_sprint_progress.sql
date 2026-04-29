-- Adds the sprint_progress column to escape_assessments and an UPDATE policy
-- so that anonymous holders of an assessment_id can toggle sprint-day completion.
-- See Cursor Prompt 2 (Assessment Renderer / HUD).

ALTER TABLE public.escape_assessments
  ADD COLUMN IF NOT EXISTS sprint_progress JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.escape_assessments.sprint_progress IS
  'Map of dayNumber (1-14) -> { completed: boolean, completedAt: ISO timestamp | null }. Updated via /api/assessment/sprint-progress.';

-- Permissive update policy for v1: anyone holding an assessment_id (UUID access
-- token) can update sprint progress on the row. The "Owner can update" policy
-- from 20260426120000 already allows this for anonymous-created rows
-- (user_id IS NULL), but we add an explicit anon-role policy here so this
-- works irrespective of authentication state in v1. Authentication/authorization
-- is intentionally deferred to Prompt 4+.
DROP POLICY IF EXISTS "Anonymous can update sprint_progress on escape_assessments" ON public.escape_assessments;
CREATE POLICY "Anonymous can update sprint_progress on escape_assessments"
  ON public.escape_assessments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
