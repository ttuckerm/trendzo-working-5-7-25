-- Memory System — Prompt 28 schema + Prompt 29 consolidation log
-- Two tables: memory_extractions (facts per agency) and memory_consolidation_log (nightly run tracking)

-- ── memory_extractions ──────────────────────────────────────────────────
-- Stores discrete facts/insights extracted from agency interactions.
-- Tiered: hot (injected into LLM context), warm (available on demand), cold (archived).

CREATE TABLE IF NOT EXISTS memory_extractions (
  id            BIGSERIAL PRIMARY KEY,
  agency_id     UUID        NOT NULL,
  fact          TEXT        NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'conversation',
    -- 'conversation', 'brief_feedback', 'performance_data', 'onboarding', 'consolidation'
  tier          TEXT        NOT NULL DEFAULT 'hot'
    CHECK (tier IN ('hot', 'warm', 'cold')),
  confidence    DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  reference_count INT       NOT NULL DEFAULT 1,
  superseded_by BIGINT      REFERENCES memory_extractions(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_extractions_agency_tier
  ON memory_extractions (agency_id, tier);

CREATE INDEX idx_memory_extractions_agency_created
  ON memory_extractions (agency_id, created_at DESC);

-- ── memory_consolidation_log ────────────────────────────────────────────
-- Tracks each nightly consolidation run per agency.

CREATE TABLE IF NOT EXISTS memory_consolidation_log (
  id                        BIGSERIAL PRIMARY KEY,
  agency_id                 UUID        NOT NULL,
  run_date                  DATE        NOT NULL DEFAULT CURRENT_DATE,
  facts_added               INT         NOT NULL DEFAULT 0,
  facts_demoted             INT         NOT NULL DEFAULT 0,
  facts_to_cold             INT         NOT NULL DEFAULT 0,
  contradictions_resolved   INT         NOT NULL DEFAULT 0,
  emergency_drops           INT         NOT NULL DEFAULT 0,
  hot_memory_token_count    INT         NOT NULL DEFAULT 0,
  error_message             TEXT,
  generated_by_agent        TEXT        NOT NULL DEFAULT 'Memory Keeper',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_consolidation_log_agency
  ON memory_consolidation_log (agency_id, run_date DESC);
