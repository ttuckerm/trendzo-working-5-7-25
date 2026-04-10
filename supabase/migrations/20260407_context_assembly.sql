-- Context Assembly Infrastructure
-- 1. Logging table for monitoring context assembly per LLM call
-- 2. creator_id column on memory_extractions for per-client warm memory

-- ── context_assembly_log ────────────────────────────────────────────────
-- Tracks every assembleContext() invocation for monitoring token usage,
-- identifying bloated agencies, and detecting slow queries.

CREATE TABLE IF NOT EXISTS context_assembly_log (
  id            BIGSERIAL PRIMARY KEY,
  agency_id     UUID        NOT NULL,
  tool_name     TEXT        NOT NULL,
  total_tokens  INT         NOT NULL DEFAULT 0,
  hot_tokens    INT         NOT NULL DEFAULT 0,
  warm_tokens   INT         NOT NULL DEFAULT 0,
  cultural_tokens INT       NOT NULL DEFAULT 0,
  accuracy_tokens INT       NOT NULL DEFAULT 0,
  skill_tokens  INT         NOT NULL DEFAULT 0,
  tool_tokens   INT         NOT NULL DEFAULT 0,
  latency_ms    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_context_assembly_log_agency
  ON context_assembly_log (agency_id, created_at DESC);

CREATE INDEX idx_context_assembly_log_tool
  ON context_assembly_log (tool_name, created_at DESC);

-- ── Add creator_id to memory_extractions ────────────────────────────────
-- Enables per-client warm memory queries (tier='warm' + creator_id filter).
-- NULL for agency-level facts, populated for client-specific facts.

ALTER TABLE memory_extractions
  ADD COLUMN IF NOT EXISTS creator_id UUID;

CREATE INDEX IF NOT EXISTS idx_memory_extractions_creator
  ON memory_extractions (creator_id, tier)
  WHERE creator_id IS NOT NULL;
