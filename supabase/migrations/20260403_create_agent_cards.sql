-- =============================================
-- Agent Cards — shareable creator cards with AI chat
-- Tables: agent_cards, agent_card_sessions, agent_card_leads
-- =============================================

CREATE TABLE agent_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  agency_id uuid NOT NULL,
  creator_id uuid,

  -- Creator info (denormalized for public access without auth)
  creator_name text NOT NULL,
  creator_handle text,
  creator_avatar_url text,
  creator_niche text NOT NULL,

  -- Score data
  vps_score numeric,
  dps_score numeric,
  follower_count integer,
  trend_direction text CHECK (trend_direction IN ('up', 'down', 'stable')),
  niche_rank integer,

  -- Agency branding
  agency_name text NOT NULL,
  agency_logo_url text,

  -- Agent config
  agent_enabled boolean DEFAULT true,
  agent_system_prompt text,

  -- Analytics
  total_views integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_agent_sessions integer DEFAULT 0,
  total_leads integer DEFAULT 0,

  -- Meta
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read by share_id" ON agent_cards
  FOR SELECT USING (is_active = true);

CREATE POLICY "Agency manages own cards" ON agent_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (role = 'chairman' OR agency_id = agent_cards.agency_id)
    )
  );

CREATE INDEX idx_agent_cards_share ON agent_cards(share_id);
CREATE INDEX idx_agent_cards_agency ON agent_cards(agency_id);

-- Agent card chat sessions
CREATE TABLE agent_card_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid REFERENCES agent_cards(id) ON DELETE CASCADE,
  visitor_email text,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  messages_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_card_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON agent_card_sessions FOR ALL USING (true);

-- Leads captured from agent cards
CREATE TABLE agent_card_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id uuid REFERENCES agent_cards(id) ON DELETE CASCADE,
  email text NOT NULL,
  source text DEFAULT 'card_cta',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_card_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert" ON agent_card_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Agency reads own leads" ON agent_card_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_cards ac
      JOIN profiles p ON p.id = auth.uid()
      WHERE ac.id = agent_card_leads.card_id
        AND (p.role = 'chairman' OR p.agency_id = ac.agency_id)
    )
  );
