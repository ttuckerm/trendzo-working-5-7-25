-- =============================================
-- SCRIPT INTELLIGENCE SYSTEM DATABASE SCHEMA
-- World's Preeminent Script Intelligence System
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. OMNISCIENT SCRIPT MEMORY BANK
-- =============================================

-- Core script master memory - The infinite repository of all script patterns
CREATE TABLE script_master_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core script data
    script_text TEXT NOT NULL,
    script_hash VARCHAR(64) UNIQUE, -- For deduplication
    video_id UUID REFERENCES videos(id),
    niche VARCHAR(100),
    template_id UUID, -- References viral_templates if applicable
    
    -- Performance metrics (the truth of what worked)
    performance_metrics JSONB NOT NULL DEFAULT '{}', -- views, shares, comments, watch_time, completion_rate
    emotional_velocity_curve JSONB, -- Second-by-second engagement data
    cross_platform_performance JSONB, -- How it performed across platforms
    cultural_context JSONB, -- Zeitgeist markers, trending topics, cultural moments
    
    -- Lifecycle tracking
    expiration_date TIMESTAMP, -- When it stopped working
    peak_performance_date TIMESTAMP, -- When it performed best
    lifecycle_stage VARCHAR(50) DEFAULT 'emerging', -- emerging, peak, declining, dead, resurrected
    
    -- Evolution data
    mutation_history JSONB DEFAULT '[]', -- How this script evolved over time
    parent_script_id UUID REFERENCES script_master_memory(id), -- What it evolved from
    mutation_type VARCHAR(50), -- substitution, insertion, deletion, combination
    
    -- Script DNA (atomic breakdown)
    script_genome JSONB NOT NULL, -- Detailed linguistic analysis
    pattern_signatures JSONB, -- Recognizable patterns within the script
    
    -- Intelligence markers
    virality_coefficient DECIMAL(5,4), -- How viral this specific script was
    replication_factor INTEGER DEFAULT 0, -- How many times it was copied/adapted
    influence_score DECIMAL(8,4), -- How much it influenced other scripts
    
    -- Memory classification
    memory_type VARCHAR(20) DEFAULT 'immediate', -- immediate, short_term, long_term, eternal
    memory_strength DECIMAL(3,2) DEFAULT 1.0, -- How strongly to weight this memory
    
    -- Metadata
    discovery_method VARCHAR(50), -- scraped, uploaded, generated, mutated
    source_platform VARCHAR(50),
    creator_authority_score DECIMAL(5,2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_referenced_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 2. SCRIPT EVOLUTION TRACKING
-- =============================================

-- Track how script patterns evolve and mutate over time
CREATE TABLE script_evolution_chains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Evolution tracking
    original_pattern JSONB NOT NULL,
    current_pattern JSONB NOT NULL,
    mutation_sequence JSONB NOT NULL, -- Step-by-step evolution path
    
    -- Performance evolution
    performance_delta JSONB, -- How performance changed through mutations
    fitness_score DECIMAL(5,4), -- Evolutionary fitness at each stage
    
    -- Environmental factors that drove evolution
    environmental_factors JSONB, -- Algorithm changes, trend shifts, cultural moments
    selection_pressure JSONB, -- What forces shaped this evolution
    
    -- Evolution metadata
    generation_count INTEGER DEFAULT 1,
    evolution_velocity DECIMAL(8,4), -- How fast it's evolving
    stability_score DECIMAL(3,2), -- How stable the pattern is
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 3. CROSS-MODULE INTELLIGENCE FUSION
-- =============================================

-- Connect script intelligence with ALL other modules
CREATE TABLE script_intelligence_fusion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES script_master_memory(id),
    
    -- Module synergy scores
    visual_synergy_score DECIMAL(3,2), -- How well script matched visuals
    audio_alignment_score DECIMAL(3,2), -- Timing with music/sounds
    framework_compatibility JSONB, -- Which of 48+ frameworks it fits
    trend_lifecycle_position VARCHAR(50), -- Position in trend curve
    
    -- Cross-module data
    template_resonance DECIMAL(3,2), -- How well it fits current templates
    dna_match_quality DECIMAL(3,2), -- DNA Detective compatibility
    weather_prediction_accuracy DECIMAL(3,2), -- How weather system predicted it
    brain_network_activation JSONB, -- Which brain patterns it triggered
    multiverse_performance JSONB, -- Performance in parallel scenarios
    
    -- Composite intelligence
    omniscient_score DECIMAL(5,4), -- Overall cross-module intelligence
    prediction_confidence DECIMAL(3,2), -- How confident we are in predictions
    
    analysis_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 4. SCRIPT DNA SEQUENCING
-- =============================================

-- Atomic breakdown of script components for pattern recognition
CREATE TABLE script_dna_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script_id UUID REFERENCES script_master_memory(id),
    
    -- Linguistic genome
    opening_hook_type VARCHAR(100),
    emotional_arc VARCHAR(200),
    narrative_structure VARCHAR(100),
    
    -- Molecular features
    linguistic_features JSONB NOT NULL, -- pronoun_ratio, certainty_words, power_verbs, etc.
    pacing_signature JSONB, -- Words per second, pause patterns
    rhythm_pattern JSONB, -- Syllable patterns, stress patterns
    
    -- Cultural DNA
    cultural_markers JSONB, -- Trend references, meme patterns, generational signals
    temporal_signatures JSONB, -- Time-specific language patterns
    platform_adaptations JSONB, -- Platform-specific modifications
    
    -- Psychological triggers
    persuasion_techniques JSONB, -- Authority, scarcity, social proof, etc.
    emotional_triggers JSONB, -- Fear, desire, curiosity, urgency
    cognitive_biases_used JSONB, -- Which biases the script exploits
    
    -- Performance genetics
    viral_genes JSONB, -- Specific elements that drive virality
    engagement_genes JSONB, -- Elements that drive engagement
    retention_genes JSONB, -- Elements that keep attention
    
    -- Mutation potential
    mutable_regions JSONB, -- Parts that can be changed without losing effectiveness
    conserved_regions JSONB, -- Parts that must remain unchanged
    mutation_tolerance DECIMAL(3,2), -- How much change the script can handle
    
    sequenced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 5. REAL-TIME SCRIPT OPTIMIZATION
-- =============================================

-- Track real-time optimization suggestions and results
CREATE TABLE script_optimization_engine (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Original and optimized versions
    original_script_id UUID REFERENCES script_master_memory(id),
    optimized_script_id UUID REFERENCES script_master_memory(id),
    
    -- Optimization details
    optimization_type VARCHAR(50), -- word_swap, phrase_enhancement, structure_mod, etc.
    optimization_target VARCHAR(50), -- engagement, retention, virality, platform_fit
    
    -- Performance comparison
    original_performance JSONB,
    optimized_performance JSONB,
    improvement_metrics JSONB,
    
    -- Optimization intelligence
    optimization_reasoning TEXT, -- Why these changes were made
    confidence_score DECIMAL(3,2), -- Confidence in the optimization
    risk_assessment JSONB, -- Potential downsides
    
    -- Real-time data
    a_b_test_results JSONB, -- If A/B tested
    market_response JSONB, -- How the market responded
    
    optimization_timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 6. PATTERN MEMORY CLASSIFICATION
-- =============================================

-- Classify and index patterns for rapid retrieval
CREATE TABLE script_pattern_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Pattern identification
    pattern_name VARCHAR(200),
    pattern_type VARCHAR(100), -- hook, transition, climax, cta, etc.
    pattern_signature JSONB NOT NULL, -- The actual pattern structure
    
    -- Memory classification
    memory_tier VARCHAR(20), -- immediate, short_term, long_term, eternal
    pattern_strength DECIMAL(3,2), -- How strong/reliable this pattern is
    usage_frequency INTEGER DEFAULT 0, -- How often it's been used
    
    -- Performance data
    average_performance JSONB, -- Average metrics across all uses
    peak_performance JSONB, -- Best performance ever recorded
    consistency_score DECIMAL(3,2), -- How consistent its performance is
    
    -- Context data
    optimal_contexts JSONB, -- When/where this pattern works best
    failure_contexts JSONB, -- When/where it fails
    cultural_relevance JSONB, -- Cultural/temporal relevance
    
    -- Evolution data
    stability_over_time JSONB, -- How stable this pattern has been
    mutation_resistance DECIMAL(3,2), -- How resistant to change
    adaptation_history JSONB, -- How it has adapted over time
    
    first_seen_at TIMESTAMP,
    last_effective_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 7. PREDICTIVE SCRIPT GENERATION
-- =============================================

-- Store and track AI-generated scripts and their predictions
CREATE TABLE predictive_script_generation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Generated script
    generated_script_id UUID REFERENCES script_master_memory(id),
    generation_prompt JSONB, -- What inputs were used to generate
    
    -- Prediction data
    predicted_performance JSONB NOT NULL, -- Predicted metrics
    confidence_intervals JSONB, -- Confidence ranges for predictions
    risk_factors JSONB, -- Identified risks and mitigation
    
    -- Generation intelligence
    source_patterns JSONB, -- Which patterns influenced generation
    novelty_score DECIMAL(3,2), -- How novel/unique the generated script is
    safety_score DECIMAL(3,2), -- How safe/reliable the prediction is
    
    -- Market timing
    optimal_release_timing JSONB, -- When to release for maximum impact
    market_readiness_score DECIMAL(3,2), -- How ready the market is
    competition_analysis JSONB, -- Current competitive landscape
    
    -- Actual results (filled in after deployment)
    actual_performance JSONB,
    prediction_accuracy DECIMAL(3,2), -- How accurate our prediction was
    learnings JSONB, -- What we learned from this generation
    
    generated_at TIMESTAMP DEFAULT NOW(),
    deployed_at TIMESTAMP,
    results_recorded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 8. CULTURAL ZEITGEIST TRACKING
-- =============================================

-- Track cultural moments and their impact on script performance
CREATE TABLE cultural_zeitgeist_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Cultural moment
    moment_name VARCHAR(200),
    moment_type VARCHAR(100), -- trend, event, meme, crisis, celebration, etc.
    cultural_intensity DECIMAL(3,2), -- How intense/significant this moment is
    
    -- Temporal data
    start_timestamp TIMESTAMP,
    peak_timestamp TIMESTAMP,
    end_timestamp TIMESTAMP,
    duration_category VARCHAR(50), -- flash, short, medium, long, permanent
    
    -- Impact on scripts
    affected_script_patterns JSONB, -- Which patterns were affected
    performance_impact JSONB, -- How script performance changed
    new_patterns_emerged JSONB, -- New patterns that emerged
    obsolete_patterns JSONB, -- Patterns that became obsolete
    
    -- Cultural data
    geographic_scope JSONB, -- Where this moment was relevant
    demographic_impact JSONB, -- Which demographics were affected
    platform_specificity JSONB, -- Platform-specific impacts
    
    -- Prediction value
    predictive_indicators JSONB, -- What signaled this moment was coming
    similar_historical_moments JSONB, -- Historical parallels
    future_implications JSONB, -- What this might mean for future scripts
    
    detected_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- 9. SCRIPT SINGULARITY METRICS
-- =============================================

-- Track the system's evolution toward script singularity
CREATE TABLE script_singularity_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Singularity indicators
    prediction_accuracy_trend JSONB, -- How accurate predictions are becoming
    pattern_discovery_rate DECIMAL(8,4), -- Rate of discovering new patterns
    evolution_prediction_success DECIMAL(3,2), -- Success at predicting evolution
    
    -- Intelligence metrics
    cross_module_synthesis_score DECIMAL(3,2), -- How well modules work together
    pattern_creation_capability DECIMAL(3,2), -- Ability to create new patterns
    cultural_anticipation_accuracy DECIMAL(3,2), -- Ability to anticipate cultural shifts
    
    -- System capabilities
    real_time_optimization_speed INTEGER, -- Milliseconds to optimize a script
    pattern_memory_size INTEGER, -- Number of patterns in memory
    prediction_horizon_days INTEGER, -- How far ahead we can predict
    
    -- Singularity progression
    singularity_score DECIMAL(5,4), -- Overall progress toward singularity
    human_performance_ratio DECIMAL(4,2), -- How much better than human experts
    market_influence_factor DECIMAL(6,3), -- How much the system influences the market
    
    measurement_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Script memory indexes
CREATE INDEX idx_script_memory_niche ON script_master_memory(niche);
CREATE INDEX idx_script_memory_performance ON script_master_memory USING GIN (performance_metrics);
CREATE INDEX idx_script_memory_lifecycle ON script_master_memory(lifecycle_stage);
CREATE INDEX idx_script_memory_created ON script_master_memory(created_at DESC);
CREATE INDEX idx_script_memory_virality ON script_master_memory(virality_coefficient DESC);

-- Pattern memory indexes
CREATE INDEX idx_pattern_memory_type ON script_pattern_memory(pattern_type);
CREATE INDEX idx_pattern_memory_strength ON script_pattern_memory(pattern_strength DESC);
CREATE INDEX idx_pattern_memory_tier ON script_pattern_memory(memory_tier);

-- DNA sequence indexes
CREATE INDEX idx_script_dna_features ON script_dna_sequences USING GIN (linguistic_features);
CREATE INDEX idx_script_dna_cultural ON script_dna_sequences USING GIN (cultural_markers);

-- Zeitgeist indexes
CREATE INDEX idx_zeitgeist_timestamp ON cultural_zeitgeist_tracker(start_timestamp DESC);
CREATE INDEX idx_zeitgeist_intensity ON cultural_zeitgeist_tracker(cultural_intensity DESC);

-- Full-text search indexes
CREATE INDEX idx_script_text_search ON script_master_memory USING GIN (to_tsvector('english', script_text));
CREATE INDEX idx_pattern_name_search ON script_pattern_memory USING GIN (to_tsvector('english', pattern_name));

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_script_memory_updated_at BEFORE UPDATE ON script_master_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pattern_memory_updated_at BEFORE UPDATE ON script_pattern_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_zeitgeist_updated_at BEFORE UPDATE ON cultural_zeitgeist_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate script hash
CREATE OR REPLACE FUNCTION generate_script_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.script_hash = encode(sha256(NEW.script_text::bytea), 'hex');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_script_hash_trigger BEFORE INSERT ON script_master_memory FOR EACH ROW EXECUTE FUNCTION generate_script_hash();

-- =============================================
-- INITIAL DATA SETUP
-- =============================================

-- Insert foundational cultural patterns
INSERT INTO script_pattern_memory (pattern_name, pattern_type, pattern_signature, memory_tier, pattern_strength) VALUES
('Authority Opening Hook', 'hook', '{"structure": "credential + shocking_claim", "examples": ["As a [authority] who [achievement], I can tell you [shocking_truth]"]}', 'eternal', 0.95),
('Problem-Solution Arc', 'structure', '{"flow": "problem_identification -> agitation -> solution_reveal", "timing": [0.1, 0.4, 0.7]}', 'eternal', 0.92),
('Specific Number Credibility', 'credibility', '{"pattern": "exact_number + time_frame + result", "examples": ["3 weeks", "47 seconds", "$2,847"]}', 'long_term', 0.88),
('Social Proof Stack', 'validation', '{"elements": ["client_results", "testimonial", "peer_validation"], "order": "ascending_credibility"}', 'long_term', 0.85);

-- Insert foundational cultural moments
INSERT INTO cultural_zeitgeist_tracker (moment_name, moment_type, cultural_intensity, start_timestamp, moment_type) VALUES
('Short-Form Content Dominance', 'platform_shift', 0.95, '2020-01-01', 'permanent'),
('Authenticity Over Polish', 'cultural_shift', 0.87, '2021-06-01', 'long'),
('Expert Backlash Movement', 'social_movement', 0.72, '2022-03-01', 'medium');

COMMENT ON TABLE script_master_memory IS 'The omniscient repository of all script patterns and their performance data - the core memory bank of the script intelligence system';
COMMENT ON TABLE script_evolution_chains IS 'Tracks how script patterns evolve and mutate over time, enabling prediction of future script evolution';
COMMENT ON TABLE script_intelligence_fusion IS 'Connects script intelligence with all other modules for omniscient pattern recognition';
COMMENT ON TABLE script_dna_sequences IS 'Atomic breakdown of script components for deep pattern recognition and genetic-level script analysis';
COMMENT ON TABLE predictive_script_generation IS 'AI-generated scripts and their predicted vs actual performance for continuous learning';
COMMENT ON TABLE cultural_zeitgeist_tracker IS 'Tracks cultural moments and their impact on script effectiveness for cultural context awareness';
COMMENT ON TABLE script_singularity_metrics IS 'Measures the systems progress toward achieving script singularity and superhuman performance';