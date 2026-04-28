CREATE TABLE assessment_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  capture_source TEXT NOT NULL CHECK (capture_source IN ('hud_panel', 'agent_conversation')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  notify_on_codes BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_assessment_emails_assessment_id ON assessment_emails(assessment_id);
CREATE INDEX idx_assessment_emails_email ON assessment_emails(email);

ALTER TABLE assessment_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous can insert assessment_emails"
  ON assessment_emails FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous can read own assessment_emails"
  ON assessment_emails FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous can update assessment_emails"
  ON assessment_emails FOR UPDATE TO anon USING (true) WITH CHECK (true);

COMMENT ON TABLE assessment_emails IS
  'Email captures from the assessment HUD. One row per assessment_id maximum. Source tracks which capture path succeeded.';

COMMENT ON COLUMN assessment_emails.capture_source IS
  'hud_panel = soft-capture panel above Agent rail. agent_conversation = conversational ask from the Agent.';
