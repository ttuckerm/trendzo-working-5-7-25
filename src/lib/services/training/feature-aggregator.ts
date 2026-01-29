/**
 * Feature Aggregator for Training Pipeline
 * 
 * Aggregates features from multiple extraction sources and provides
 * a unified interface for training data generation.
 */

import { 
  extractUnifiedTrainingFeatures, 
  UnifiedExtractionInput,
  UnifiedExtractionOptions,
  UnifiedTrainingFeatures,
  TOTAL_FEATURE_COUNT
} from './unified-training-features';

// ============================================================================
// TYPES (Re-export for convenience)
// ============================================================================

export { UnifiedTrainingFeatures, UnifiedExtractionInput, UnifiedExtractionOptions };

export interface ComponentResult {
  componentId: string;
  success: boolean;
  prediction?: number;
  confidence?: number;
  features?: Record<string, any>;
  insights?: string[];
  error?: string;
  latency: number;
}

export interface AggregatedFeatures {
  features: Record<string, number>;
  featureCount: number;
  coverage: number;
  sources: string[];
  extractionTimeMs: number;
  errors: string[];
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract training features using the unified extraction pipeline
 * 
 * This function wraps the unified feature extraction and formats the output
 * for compatibility with the training data pipeline.
 */
export async function extractTrainingFeatures(
  input: UnifiedExtractionInput,
  options: UnifiedExtractionOptions = {}
): Promise<AggregatedFeatures> {
  const result = await extractUnifiedTrainingFeatures(input, options);

  // Determine which sources were used
  const sources: string[] = [];
  if (result.groupsExtracted.textMetadata) sources.push('text-metadata');
  if (result.groupsExtracted.ffmpeg) sources.push('ffmpeg');
  if (result.groupsExtracted.llm) sources.push('llm');
  if (result.groupsExtracted.pattern) sources.push('pattern');

  return {
    features: result.features,
    featureCount: result.featureCount,
    coverage: result.coverage,
    sources,
    extractionTimeMs: result.extractionTimeMs,
    errors: result.errors,
  };
}

/**
 * Aggregate features from multiple component results
 */
export function aggregateComponentFeatures(
  componentResults: ComponentResult[]
): AggregatedFeatures {
  const features: Record<string, number> = {};
  const sources: string[] = [];
  const errors: string[] = [];
  let totalLatency = 0;

  for (const result of componentResults) {
    if (result.success && result.features) {
      // Merge features with component prefix
      for (const [key, value] of Object.entries(result.features)) {
        if (typeof value === 'number' && !isNaN(value)) {
          features[key] = value;
        }
      }
      sources.push(result.componentId);
    } else if (result.error) {
      errors.push(`${result.componentId}: ${result.error}`);
    }
    totalLatency += result.latency || 0;
  }

  const featureCount = Object.keys(features).length;
  const coverage = featureCount / TOTAL_FEATURE_COUNT;

  return {
    features,
    featureCount,
    coverage: Math.min(1, coverage),
    sources,
    extractionTimeMs: totalLatency,
    errors,
  };
}

/**
 * Batch extract features from multiple videos
 */
export async function extractTrainingFeaturesBatch(
  inputs: UnifiedExtractionInput[],
  options: UnifiedExtractionOptions = {},
  onProgress?: (processed: number, total: number) => void
): Promise<Map<string, AggregatedFeatures>> {
  const results = new Map<string, AggregatedFeatures>();
  const batchSize = 5;

  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(input => extractTrainingFeatures(input, options))
    );

    batch.forEach((input, idx) => {
      results.set(input.video_id, batchResults[idx]);
    });

    if (onProgress) {
      onProgress(Math.min(i + batchSize, inputs.length), inputs.length);
    }
  }

  return results;
}

/**
 * Validate feature quality for training
 */
export function validateFeatureQuality(
  features: AggregatedFeatures,
  thresholds: {
    minFeatureCount?: number;
    minCoverage?: number;
    maxErrors?: number;
  } = {}
): {
  isValid: boolean;
  issues: string[];
} {
  const {
    minFeatureCount = 100,
    minCoverage = 0.5,
    maxErrors = 3,
  } = thresholds;

  const issues: string[] = [];

  if (features.featureCount < minFeatureCount) {
    issues.push(`Feature count ${features.featureCount} below minimum ${minFeatureCount}`);
  }

  if (features.coverage < minCoverage) {
    issues.push(`Coverage ${(features.coverage * 100).toFixed(1)}% below minimum ${(minCoverage * 100).toFixed(0)}%`);
  }

  if (features.errors.length > maxErrors) {
    issues.push(`Too many extraction errors: ${features.errors.length} (max: ${maxErrors})`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Get feature statistics for debugging
 */
export function getFeatureStatistics(features: Record<string, number>): {
  count: number;
  nullCount: number;
  zeroCount: number;
  groups: Record<string, number>;
} {
  const entries = Object.entries(features);
  let nullCount = 0;
  let zeroCount = 0;
  const groups: Record<string, number> = {};

  for (const [key, value] of entries) {
    if (value === null || value === undefined || isNaN(value)) {
      nullCount++;
    } else if (value === 0) {
      zeroCount++;
    }

    // Group by prefix
    const prefix = key.split('_')[0];
    groups[prefix] = (groups[prefix] || 0) + 1;
  }

  return {
    count: entries.length,
    nullCount,
    zeroCount,
    groups,
  };
}
