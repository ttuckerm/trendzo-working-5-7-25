CREATE TABLE freedom_agent_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  freedom_os_plan jsonb,
  segment text CHECK (segment IN ('A', 'B', 'C', 'D')),
  conversation_history jsonb DEFAULT '[]'::jsonb,
  current_week integer DEFAULT 1 CHECK (current_week >= 1 AND current_week <= 8),
  progress_state jsonb DEFAULT '{}'::jsonb,
  messages_this_session integer DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_freedom_agent_email ON freedom_agent_sessions(email);
CREATE INDEX idx_freedom_agent_updated ON freedom_agent_sessions(updated_at DESC);

-- RLS: public access for now (no auth on free routes)
ALTER TABLE freedom_agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON freedom_agent_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select by id" ON freedom_agent_sessions FOR SELECT USING (true);
CREATE POLICY "Public update by id" ON freedom_agent_sessions FOR UPDATE USING (true);
