/**
 * Orchestrator Types and Interfaces
 * Comprehensive type definitions for the prediction router and blender
 */

import { z } from 'zod';

// Share graph edge for viral propagation analysis
export interface ShareEdge {
  from: string;    // user_id who shared
  to: string;      // user_id who received
  t: number;       // timestamp
}

// Early metrics data structure
export interface EarlyMetrics {
  views_10m: number;   // Views in first 10 minutes
  likes_10m: number;   // Likes in first 10 minutes  
  shares_10m: number;  // Shares in first 10 minutes
}

// Audio and visual embeddings for future engines
export interface AudioEmbedding {
  embedding: number[];     // High-dimensional audio feature vector
  duration_ms: number;     // Audio clip duration
  sample_rate: number;     // Audio sample rate
}

export interface VisualEmbedding {
  embedding: number[];     // High-dimensional visual feature vector
  frame_count: number;     // Number of frames analyzed
  resolution: string;      // Video resolution (e.g., "1920x1080")
}

// Complete draft input with all possible data types
export interface DraftInput {
  genes: boolean[];                    // Required: 48-gene vector from GeneTagger
  earlyMetrics?: EarlyMetrics;        // Optional: early engagement metrics
  shareGraph?: ShareEdge[];           // Optional: viral propagation graph
  audioEmbedding?: AudioEmbedding;    // Optional: audio analysis data
  visualEmbedding?: VisualEmbedding;  // Optional: visual analysis data
  metadata?: {                        // Optional: additional context
    platform: 'tiktok' | 'instagram' | 'youtube' | 'other';
    niche: string;
    upload_time?: string;
    creator_tier?: 'micro' | 'macro' | 'mega';
  };
}

// Individual prediction engine result
export interface EngineResult {
  engine_name: string;
  probability: number;        // 0-1 viral probability
  confidence: number;         // 0-1 confidence in prediction
  processing_time_ms: number; // Time taken to compute
  features_used: string[];    // List of features this engine analyzed
  engine_specific_data?: any; // Engine-specific additional data
}

// Final blended prediction output
export interface BlendedPrediction {
  final_probability: number;           // 0-1 blended viral probability
  confidence_score: number;            // 0-1 overall confidence
  engines_used: EngineResult[];        // Results from all engines called
  blending_strategy: string;           // Method used to combine results
  rationale: string[];                 // Human-readable explanation list
  metadata: {
    total_processing_time_ms: number;
    engines_available: number;
    engines_called: number;
    data_completeness: number;         // 0-1 how much input data was available
  };
}

// Engine availability and capabilities
export interface EngineCapability {
  name: string;
  requires: {
    genes?: boolean;
    earlyMetrics?: boolean;
    shareGraph?: boolean;
    audioEmbedding?: boolean;
    visualEmbedding?: boolean;
  };
  performance: {
    typical_processing_time_ms: number;
    accuracy_score: number;           // Historical accuracy (0-1)
    reliability_score: number;        // Uptime/success rate (0-1)
  };
  enabled: boolean;                   // Whether engine is currently available
}

// Blending strategy configuration
export interface BlendingConfig {
  strategy: 'weighted_average' | 'confidence_weighted' | 'max_confidence' | 'ensemble_voting';
  weights?: { [engineName: string]: number };  // Manual weights if using weighted_average
  confidence_threshold?: number;               // Minimum confidence to include result
  outlier_detection?: boolean;                 // Remove outlier predictions
  uncertainty_penalty?: number;               // Reduce final confidence when engines disagree
}

// Input validation schemas
export const ShareEdgeSchema = z.object({
  from: z.string(),
  to: z.string(), 
  t: z.number()
});

export const EarlyMetricsSchema = z.object({
  views_10m: z.number().min(0),
  likes_10m: z.number().min(0),
  shares_10m: z.number().min(0)
});

export const AudioEmbeddingSchema = z.object({
  embedding: z.array(z.number()),
  duration_ms: z.number().positive(),
  sample_rate: z.number().positive()
});

export const VisualEmbeddingSchema = z.object({
  embedding: z.array(z.number()),
  frame_count: z.number().positive(),
  resolution: z.string()
});

export const DraftInputSchema = z.object({
  genes: z.array(z.boolean()).length(48),
  earlyMetrics: EarlyMetricsSchema.optional(),
  shareGraph: z.array(ShareEdgeSchema).optional(),
  audioEmbedding: AudioEmbeddingSchema.optional(),
  visualEmbedding: VisualEmbeddingSchema.optional(),
  metadata: z.object({
    platform: z.enum(['tiktok', 'instagram', 'youtube', 'other']),
    niche: z.string(),
    upload_time: z.string().optional(),
    creator_tier: z.enum(['micro', 'macro', 'mega']).optional()
  }).optional()
});

export const BlendedPredictionSchema = z.object({
  final_probability: z.number().min(0).max(1),
  confidence_score: z.number().min(0).max(1),
  engines_used: z.array(z.object({
    engine_name: z.string(),
    probability: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    processing_time_ms: z.number().min(0),
    features_used: z.array(z.string()),
    engine_specific_data: z.any().optional()
  })),
  blending_strategy: z.string(),
  rationale: z.array(z.string()),
  metadata: z.object({
    total_processing_time_ms: z.number().min(0),
    engines_available: z.number().min(0),
    engines_called: z.number().min(0),
    data_completeness: z.number().min(0).max(1)
  })
});

// Error types for better error handling
export class OrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OrchestratorError';
  }
}

export class EngineError extends Error {
  constructor(
    message: string,
    public engineName: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EngineError';
  }
}

// Type guards for runtime type checking
export function isDraftInputValid(input: any): input is DraftInput {
  return DraftInputSchema.safeParse(input).success;
}

export function isBlendedPredictionValid(prediction: any): prediction is BlendedPrediction {
  return BlendedPredictionSchema.safeParse(prediction).success;
}

// Utility types for engine implementations
export type EngineImplementation = (input: DraftInput) => Promise<EngineResult>;
export type BlendingFunction = (results: EngineResult[], config: BlendingConfig) => BlendedPrediction;