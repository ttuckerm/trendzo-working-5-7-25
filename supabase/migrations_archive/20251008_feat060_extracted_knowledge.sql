-- FEAT-060: GPT Knowledge Extraction Pipeline
-- Creates table to store multi-LLM knowledge extraction results

CREATE TABLE IF NOT EXISTS extracted_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL REFERENCES scraped_videos(video_id),
  extraction_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Multi-LLM outputs (raw responses)
  gpt4_analysis JSONB,
  claude_analysis JSONB,
  gemini_analysis JSONB,

  -- Consensus results (merged insights)
  consensus_insights JSONB NOT NULL,
  agreement_score NUMERIC CHECK (agreement_score >= 0 AND agreement_score <= 1),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Pattern matching
  matched_patterns TEXT[],
  pattern_match_confidence NUMERIC,
  is_novel_pattern BOOLEAN DEFAULT false,

  -- Metadata
  extraction_model_versions JSONB,
  processing_time_ms BIGINT,
  extraction_status TEXT DEFAULT 'success',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one extraction per video (can be refreshed by updating)
  CONSTRAINT unique_video_extraction UNIQUE(video_id)
);

-- Indexes for common queries
CREATE INDEX idx_extracted_knowledge_video_id ON extracted_knowledge(video_id);
CREATE INDEX idx_extracted_knowledge_timestamp ON extracted_knowledge(extraction_timestamp DESC);
CREATE INDEX idx_extracted_knowledge_novel_patterns ON extracted_knowledge(is_novel_pattern) WHERE is_novel_pattern = true;
CREATE INDEX idx_extracted_knowledge_agreement_score ON extracted_knowledge(agreement_score DESC);
CREATE INDEX idx_extracted_knowledge_status ON extracted_knowledge(extraction_status);

-- GIN index for pattern matching queries
CREATE INDEX idx_extracted_knowledge_matched_patterns ON extracted_knowledge USING GIN(matched_patterns);

-- JSONB indexes for consensus insights
CREATE INDEX idx_extracted_knowledge_consensus_insights ON extracted_knowledge USING GIN(consensus_insights);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_extracted_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_extracted_knowledge_updated_at
  BEFORE UPDATE ON extracted_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_extracted_knowledge_updated_at();

-- View for easy querying of successful high-confidence extractions
CREATE OR REPLACE VIEW high_quality_extractions AS
SELECT
  ek.*,
  sv.caption,
  sv.transcript,
  sv.dps_score,
  sv.classification,
  sv.views,
  sv.likes,
  sv.comments,
  sv.shares
FROM extracted_knowledge ek
JOIN scraped_videos sv ON ek.video_id = sv.video_id
WHERE
  ek.extraction_status = 'success'
  AND ek.confidence_score >= 0.7
  AND ek.agreement_score >= 0.6
ORDER BY ek.confidence_score DESC, ek.agreement_score DESC;

-- View for novel pattern candidates
CREATE OR REPLACE VIEW novel_pattern_candidates AS
SELECT
  ek.id,
  ek.video_id,
  ek.consensus_insights,
  ek.agreement_score,
  ek.confidence_score,
  ek.extraction_timestamp,
  sv.dps_score,
  sv.classification,
  sv.url
FROM extracted_knowledge ek
JOIN scraped_videos sv ON ek.video_id = sv.video_id
WHERE
  ek.is_novel_pattern = true
  AND ek.confidence_score >= 0.75
ORDER BY ek.confidence_score DESC, sv.dps_score DESC;

COMMENT ON TABLE extracted_knowledge IS 'Stores structured knowledge extracted from viral videos using multi-LLM consensus analysis';
COMMENT ON COLUMN extracted_knowledge.gpt4_analysis IS 'Raw GPT-4 analysis output in JSON format';
COMMENT ON COLUMN extracted_knowledge.claude_analysis IS 'Raw Claude analysis output in JSON format';
COMMENT ON COLUMN extracted_knowledge.gemini_analysis IS 'Raw Gemini analysis output in JSON format';
COMMENT ON COLUMN extracted_knowledge.consensus_insights IS 'Merged insights from all LLMs using weighted voting';
COMMENT ON COLUMN extracted_knowledge.agreement_score IS 'Percentage of insights that overlap across LLMs (0-1)';
COMMENT ON COLUMN extracted_knowledge.confidence_score IS 'Average confidence from all LLMs (0-1)';
COMMENT ON COLUMN extracted_knowledge.matched_patterns IS 'Array of existing viral pattern IDs that match';
COMMENT ON COLUMN extracted_knowledge.is_novel_pattern IS 'True if no existing pattern matches above threshold';
