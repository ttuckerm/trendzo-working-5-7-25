-- Create video_genes table for storing 48-dimensional gene vectors
CREATE TABLE IF NOT EXISTS video_genes (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES raw_videos(id) ON DELETE CASCADE,
  genes JSONB NOT NULL, -- 48-element boolean array
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  UNIQUE(video_id)
);

-- Add index on video_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_video_genes_video_id ON video_genes(video_id);

-- Add index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_video_genes_created_at ON video_genes(created_at);

-- Add GIN index on genes JSONB for fast gene-based queries
CREATE INDEX IF NOT EXISTS idx_video_genes_genes ON video_genes USING GIN(genes);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_genes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_genes_updated_at
  BEFORE UPDATE ON video_genes
  FOR EACH ROW
  EXECUTE FUNCTION update_video_genes_updated_at();

-- Add constraints to ensure genes array has exactly 48 elements
ALTER TABLE video_genes ADD CONSTRAINT check_genes_length 
CHECK (jsonb_array_length(genes) = 48);

-- Add constraint to ensure all elements are boolean
ALTER TABLE video_genes ADD CONSTRAINT check_genes_boolean
CHECK (
  (SELECT COUNT(*) FROM jsonb_array_elements(genes) elem 
   WHERE jsonb_typeof(elem) != 'boolean') = 0
);

-- Add comments for documentation
COMMENT ON TABLE video_genes IS 'Stores 48-dimensional gene vectors for viral content analysis';
COMMENT ON COLUMN video_genes.video_id IS 'Foreign key to raw_videos table';
COMMENT ON COLUMN video_genes.genes IS 'Array of 48 boolean values representing detected genes';
COMMENT ON COLUMN video_genes.created_at IS 'Timestamp when genes were first detected';
COMMENT ON COLUMN video_genes.updated_at IS 'Timestamp when genes were last updated';

-- Create view for easier gene analysis
CREATE OR REPLACE VIEW video_genes_analysis AS
SELECT 
  vg.video_id,
  vg.genes,
  vg.created_at,
  rv.caption,
  rv.duration_sec,
  rv.views_count,
  rv.likes_count,
  -- Count active genes
  (SELECT COUNT(*) FROM jsonb_array_elements(vg.genes) elem WHERE elem::boolean = true) as active_genes_count,
  -- Calculate gene density
  ROUND(
    (SELECT COUNT(*) FROM jsonb_array_elements(vg.genes) elem WHERE elem::boolean = true)::NUMERIC / 48 * 100, 
    2
  ) as gene_density_percent
FROM video_genes vg
JOIN raw_videos rv ON vg.video_id = rv.id;

COMMENT ON VIEW video_genes_analysis IS 'Analysis view showing gene statistics with video metadata';

-- Create function to get specific gene value
CREATE OR REPLACE FUNCTION get_gene_value(genes_array JSONB, gene_index INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  IF gene_index < 0 OR gene_index > 47 THEN
    RAISE EXCEPTION 'Gene index must be between 0 and 47';
  END IF;
  
  RETURN (genes_array->gene_index)::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_gene_value IS 'Extract boolean value for specific gene by index (0-47)';

-- Create function to find videos with specific gene patterns
CREATE OR REPLACE FUNCTION find_videos_with_genes(target_genes INTEGER[])
RETURNS TABLE(video_id TEXT, match_count INTEGER, total_genes INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vg.video_id,
    (SELECT COUNT(*) FROM unnest(target_genes) gene_idx 
     WHERE get_gene_value(vg.genes, gene_idx) = true)::INTEGER as match_count,
    array_length(target_genes, 1) as total_genes
  FROM video_genes vg
  WHERE (SELECT COUNT(*) FROM unnest(target_genes) gene_idx 
         WHERE get_gene_value(vg.genes, gene_idx) = true) > 0
  ORDER BY match_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_videos_with_genes IS 'Find videos that match specific gene patterns';

-- Insert sample data for testing (if needed)
-- This will be populated by the GeneTagger module