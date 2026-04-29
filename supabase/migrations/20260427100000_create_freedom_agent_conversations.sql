-- One row per assessment. Stores the chat history between the user and the
-- Freedom Agent (the AI advisor pinned to the bottom of the assessment HUD).
--
-- The natural foreign key would be escape_assessments.payload->>'assessmentId',
-- but Postgres does not allow FOREIGN KEY constraints on expressions. We rely on
-- application-level validation (the chat route fetches the assessment first and
-- rejects with ASSESSMENT_NOT_FOUND if it does not exist).

CREATE TABLE IF NOT EXISTS public.freedom_agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freedom_agent_conversations_assessment_id
  ON public.freedom_agent_conversations(assessment_id);

ALTER TABLE public.freedom_agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anonymous can read freedom_agent_conversations" ON public.freedom_agent_conversations;
CREATE POLICY "Anonymous can read freedom_agent_conversations"
  ON public.freedom_agent_conversations FOR SELECT
  TO anon USING (true);

DROP POLICY IF EXISTS "Anonymous can insert freedom_agent_conversations" ON public.freedom_agent_conversations;
CREATE POLICY "Anonymous can insert freedom_agent_conversations"
  ON public.freedom_agent_conversations FOR INSERT
  TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Anonymous can update freedom_agent_conversations" ON public.freedom_agent_conversations;
CREATE POLICY "Anonymous can update freedom_agent_conversations"
  ON public.freedom_agent_conversations FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.set_updated_at_freedom_agent()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_freedom_agent_conversations_updated_at ON public.freedom_agent_conversations;
CREATE TRIGGER trg_freedom_agent_conversations_updated_at
  BEFORE UPDATE ON public.freedom_agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at_freedom_agent();

COMMENT ON TABLE public.freedom_agent_conversations IS
  'One row per assessment. Stores the full chat history between the user and the Freedom Agent.';

COMMENT ON COLUMN public.freedom_agent_conversations.messages IS
  'Array of { role: "user" | "assistant", content: string, timestamp: ISO string }. Capped at 20 most recent at write time.';
