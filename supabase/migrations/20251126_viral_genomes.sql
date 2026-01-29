CREATE TABLE IF NOT EXISTS viral_genomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    niche TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    pattern_dna JSONB NOT NULL,
    success_rate FLOAT DEFAULT 0,
    discovered_by TEXT[] DEFAULT '{}',
    example_videos TEXT[] DEFAULT '{}',
    dps_average FLOAT DEFAULT 0,
    times_used INTEGER DEFAULT 0,
    last_seen TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for niche lookups
CREATE INDEX IF NOT EXISTS idx_viral_genomes_niche ON viral_genomes(niche);
CREATE INDEX IF NOT EXISTS idx_viral_genomes_success_rate ON viral_genomes(success_rate);





