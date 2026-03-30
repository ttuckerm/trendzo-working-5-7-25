-- Algorithm Optimizations Table
-- Stores the results of ML-driven weight optimization for the master algorithm

CREATE TABLE IF NOT EXISTS algorithm_optimizations (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    training_data_points INTEGER NOT NULL,
    current_weights JSONB NOT NULL,
    optimized_weights JSONB NOT NULL,
    current_accuracy DECIMAL(5,4) NOT NULL,
    optimized_accuracy DECIMAL(5,4) NOT NULL,
    improvement_percentage DECIMAL(5,4) NOT NULL,
    optimization_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    algorithm_version VARCHAR(50) NOT NULL DEFAULT 'MasterViralAlgorithm_v1.0',
    deployment_status VARCHAR(20) DEFAULT 'pending' CHECK (deployment_status IN ('pending', 'deployed', 'rejected')),
    
    -- Indexes for performance
    CONSTRAINT unique_optimization_id UNIQUE (optimization_id)
);

-- Index for finding latest optimization
CREATE INDEX IF NOT EXISTS idx_algorithm_optimizations_timestamp 
ON algorithm_optimizations(optimization_timestamp DESC);

-- Index for deployed optimizations
CREATE INDEX IF NOT EXISTS idx_algorithm_optimizations_deployed 
ON algorithm_optimizations(deployment_status, optimization_timestamp DESC);

-- Comment explaining the table
COMMENT ON TABLE algorithm_optimizations IS 'Stores ML-driven algorithm weight optimizations with performance metrics and deployment tracking';