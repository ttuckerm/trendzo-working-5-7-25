-- GeneTagger Database Schema
-- Creates tables for 48-dimensional gene vector storage and analysis

-- Video Genes: 48-dimensional gene vectors for each video
CREATE TABLE IF NOT EXISTS video_genes (
    video_id VARCHAR(255) PRIMARY KEY,
    genes JSONB NOT NULL, -- 48-dimensional boolean/float array
    confidence_scores JSONB DEFAULT '[]', -- Confidence for each gene detection
    processing_metadata JSONB DEFAULT '{}', -- OCR text, transcript analysis, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gene Analysis Runs: Audit log of gene tagging runs
CREATE TABLE IF NOT EXISTS gene_analysis_runs (
    run_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'completed', 'error', 'processing'
    genes_detected INTEGER NOT NULL DEFAULT 0,
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    framework_version VARCHAR(50) DEFAULT 'v1.0',
    features_processed JSONB DEFAULT '{}', -- Which features were analyzed
    error_message TEXT,
    run_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Framework Genes: Store the gene definitions for reference
CREATE TABLE IF NOT EXISTS framework_genes (
    gene_id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'text', 'visual', 'ocr', 'visual_text', 'audio_visual'
    detection_method TEXT NOT NULL,
    pattern TEXT,
    text_pattern TEXT,
    visual_check TEXT,
    text_condition TEXT,
    threshold DECIMAL(5,4) DEFAULT 0.5,
    frames_to_check INTEGER DEFAULT 5,
    coverage_threshold DECIMAL(5,4) DEFAULT 0.3,
    min_length INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_video_genes_created_at ON video_genes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_genes_video_id ON video_genes(video_id);

-- GIN index for fast gene vector searches
CREATE INDEX IF NOT EXISTS idx_video_genes_genes_gin ON video_genes USING GIN (genes);

CREATE INDEX IF NOT EXISTS idx_gene_analysis_runs_video_id ON gene_analysis_runs(video_id);
CREATE INDEX IF NOT EXISTS idx_gene_analysis_runs_status ON gene_analysis_runs(status);
CREATE INDEX IF NOT EXISTS idx_gene_analysis_runs_timestamp ON gene_analysis_runs(run_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_framework_genes_type ON framework_genes(type);
CREATE INDEX IF NOT EXISTS idx_framework_genes_name ON framework_genes(name);

-- Row Level Security (RLS)
ALTER TABLE video_genes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gene_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_genes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS video_genes_policy ON video_genes;
DROP POLICY IF EXISTS gene_analysis_runs_policy ON gene_analysis_runs;
DROP POLICY IF EXISTS framework_genes_policy ON framework_genes;

-- Create RLS Policies (Allow all for authenticated users)
CREATE POLICY video_genes_policy ON video_genes FOR ALL USING (true);
CREATE POLICY gene_analysis_runs_policy ON gene_analysis_runs FOR ALL USING (true);
CREATE POLICY framework_genes_policy ON framework_genes FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE video_genes IS '48-dimensional gene vectors extracted from video content analysis';
COMMENT ON TABLE gene_analysis_runs IS 'Audit log of gene tagging processing runs';
COMMENT ON TABLE framework_genes IS 'Gene definitions and detection parameters from framework_genes.json';

COMMENT ON COLUMN video_genes.genes IS '48-dimensional boolean/float array representing detected viral genes';
COMMENT ON COLUMN video_genes.confidence_scores IS 'Confidence scores for each gene detection (0.0 to 1.0)';
COMMENT ON COLUMN video_genes.processing_metadata IS 'OCR text, transcript, and other analysis metadata';

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_video_genes_updated_at ON video_genes;
DROP TRIGGER IF EXISTS update_framework_genes_updated_at ON framework_genes;

-- Create triggers
CREATE TRIGGER update_video_genes_updated_at 
    BEFORE UPDATE ON video_genes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_genes_updated_at 
    BEFORE UPDATE ON framework_genes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample framework genes (from framework_genes.json structure)
INSERT INTO framework_genes (gene_id, name, description, type, detection_method, threshold) VALUES
(0, 'AuthorityHook', 'Content establishes creator as authority figure', 'text', 'keyword_analysis', 0.7),
(1, 'ControversyHook', 'Content contains controversial statements', 'text', 'sentiment_analysis', 0.6),
(2, 'TransformationBeforeAfter', 'Visual before/after transformation content', 'visual', 'image_comparison', 0.8),
(3, 'QuestionHook', 'Content starts with engaging question', 'text', 'question_detection', 0.5),
(4, 'NumbersHook', 'Content uses specific numbers or statistics', 'text', 'number_extraction', 0.6),
(5, 'UrgencyHook', 'Content creates sense of urgency', 'text', 'urgency_keywords', 0.7)
ON CONFLICT (gene_id) DO NOTHING;

-- Example queries for verification
/*
-- View all video genes
SELECT video_id, array_length(genes::text::text[], 1) as gene_count, created_at 
FROM video_genes 
ORDER BY created_at DESC 
LIMIT 10;

-- View gene analysis runs
SELECT run_id, video_id, status, genes_detected, processing_time_ms, run_timestamp
FROM gene_analysis_runs
ORDER BY run_timestamp DESC;

-- View framework genes
SELECT gene_id, name, type, detection_method, threshold
FROM framework_genes
ORDER BY gene_id;

-- Find videos with specific gene detected
SELECT video_id, genes->4 as numbers_hook_detected
FROM video_genes
WHERE genes->4 = 'true'::jsonb;
*/