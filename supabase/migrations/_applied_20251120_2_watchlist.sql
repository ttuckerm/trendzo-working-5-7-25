-- Watchlist feature for Bloomberg Terminal
-- Users can track specific niches and see aggregated stats

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  niche TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(creator_id, niche)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_watchlist_creator ON watchlist(creator_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_niche ON watchlist(niche);

-- Comments
COMMENT ON TABLE watchlist IS 'User watchlist for tracking specific niches in Bloomberg Terminal';
COMMENT ON COLUMN watchlist.creator_id IS 'User/creator tracking this niche';
COMMENT ON COLUMN watchlist.niche IS 'Niche being tracked (e.g., "Fitness", "Real Estate")';
