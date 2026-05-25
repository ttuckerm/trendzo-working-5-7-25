-- Extend the capture_source CHECK constraint on assessment_emails to allow
-- the new 'rail_gate' value, posted by the inline locked-state gate at the
-- bottom of the Freedom Agent rail. Replaces the deleted modal flow that
-- used 'hud_panel'. Existing 'hud_panel' and 'agent_conversation' values
-- remain valid (the conversational ask still uses 'agent_conversation';
-- 'hud_panel' is kept for back-compat with any pre-existing rows).

ALTER TABLE assessment_emails
  DROP CONSTRAINT IF EXISTS assessment_emails_capture_source_check;

ALTER TABLE assessment_emails
  ADD CONSTRAINT assessment_emails_capture_source_check
  CHECK (capture_source IN ('hud_panel', 'agent_conversation', 'rail_gate'));

COMMENT ON COLUMN assessment_emails.capture_source IS
  'hud_panel = legacy soft-capture panel (retired). agent_conversation = conversational ask from the Agent post-unlock. rail_gate = inline locked-state gate at the bottom of the rail.';
