-- Cursor Prompt 2 follow-up: switch the user-facing URL from the internal
-- UUID to the EA-X-XXX display ID stored in payload.assessmentId.
--
-- Adds a UNIQUE index on (payload->>'assessmentId') so we can safely use the
-- EA-X-XXX format as the URL key.
--
-- IMPORTANT: this migration is destructive in the sense that it will FAIL if
-- duplicates already exist. To handle pre-existing duplicates produced by the
-- non-unique random generator, we keep the most recent row per display ID and
-- delete older duplicates BEFORE creating the unique index.

BEGIN;

-- Delete duplicates: keep the row with the latest created_at per display ID.
WITH ranked AS (
  SELECT
    assessment_id,
    payload->>'assessmentId' AS display_id,
    ROW_NUMBER() OVER (
      PARTITION BY payload->>'assessmentId'
      ORDER BY created_at DESC
    ) AS rn
  FROM public.escape_assessments
  WHERE payload->>'assessmentId' IS NOT NULL
)
DELETE FROM public.escape_assessments e
USING ranked r
WHERE e.assessment_id = r.assessment_id
  AND r.rn > 1;

-- Create the unique index. Using a partial index because rows without a
-- display ID (legacy/null) shouldn't block index creation.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_escape_assessments_payload_display_id
  ON public.escape_assessments ((payload->>'assessmentId'))
  WHERE payload->>'assessmentId' IS NOT NULL;

COMMENT ON INDEX public.uniq_escape_assessments_payload_display_id IS
  'Unique index on payload.assessmentId (EA-X-XXX display ID) — used as the user-facing URL key.';

COMMIT;
