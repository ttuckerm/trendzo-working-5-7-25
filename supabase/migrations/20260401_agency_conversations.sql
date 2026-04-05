-- Agency conversation sessions for Intelligent Clay
CREATE TABLE IF NOT EXISTS agency_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups: user's active session
CREATE INDEX idx_agency_conversations_active
  ON agency_conversations (user_id, agency_id, is_active, updated_at DESC);

-- Index for recent sessions list
CREATE INDEX idx_agency_conversations_recent
  ON agency_conversations (user_id, agency_id, updated_at DESC);

-- RLS
ALTER TABLE agency_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own conversations
CREATE POLICY "Users can manage their own conversations"
  ON agency_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_conversation_updated_at
  BEFORE UPDATE ON agency_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();
