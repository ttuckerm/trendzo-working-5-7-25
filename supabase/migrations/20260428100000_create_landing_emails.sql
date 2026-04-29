CREATE TABLE landing_email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('landing_notify', 'landing_youtube_fallback')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_landing_emails_email ON landing_email_notifications(email);

ALTER TABLE landing_email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous can insert landing_email_notifications"
  ON landing_email_notifications FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated can insert landing_email_notifications"
  ON landing_email_notifications FOR INSERT TO authenticated WITH CHECK (true);

COMMENT ON TABLE landing_email_notifications IS
  'Emails captured from the public landing page for code-drop notifications. Distinct from assessment_emails.';
