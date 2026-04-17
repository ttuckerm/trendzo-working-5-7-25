-- =====================================================================
-- Prompt 43 — MCP server: API keys + call log
-- Atlas subsystem: MCP Server Mode (Idea #14)
--
-- Two tables:
--   1. mcp_api_keys — per-agency API keys for external AI agents
--      (Claude Code, etc.) connecting over stdio/HTTP MCP. Separate
--      from the existing `api_keys` admin table, which is unused
--      by any validation middleware and has a different shape.
--
--   2. mcp_call_log — one row per MCP tool invocation, for rate
--      limiting (windowed COUNT in last 24h) and audit trail.
--
-- Rate limits by agency tier (enforced in application code, not DB):
--   enterprise : unlimited
--   pro        : 1000 calls / 24h
--   growth     : 500 calls / 24h
--   starter    : 100 calls / 24h
-- =====================================================================

CREATE TABLE IF NOT EXISTS mcp_api_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  key_hash        TEXT NOT NULL UNIQUE,
  key_prefix      TEXT NOT NULL,
  label           TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mcp_api_keys_agency_active_idx
  ON mcp_api_keys (agency_id, is_active);

CREATE TABLE IF NOT EXISTS mcp_call_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id      UUID NOT NULL REFERENCES mcp_api_keys(id) ON DELETE CASCADE,
  agency_id       UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  tool_name       TEXT NOT NULL,
  called_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms     INTEGER,
  ok              BOOLEAN NOT NULL,
  error_code      TEXT
);

-- Hot path for rate-limit window COUNT.
CREATE INDEX IF NOT EXISTS mcp_call_log_agency_called_idx
  ON mcp_call_log (agency_id, called_at DESC);

-- Audit query by tool name.
CREATE INDEX IF NOT EXISTS mcp_call_log_tool_idx
  ON mcp_call_log (tool_name, called_at DESC);
