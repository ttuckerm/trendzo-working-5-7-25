/**
 * Parallel Execution for Kai Orchestrator
 * 
 * Provides parallel and batch execution utilities for running
 * multiple Kai components concurrently with controlled concurrency.
 */

import { KaiOrchestrator } from './kai-orchestrator';

// ============================================================================
// TYPES
// ============================================================================

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

export interface ParallelExecutionInput {
  videoId: string;
  transcript: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  niche?: string;
  videoPath?: string;
  duration?: number;
  creatorFollowers?: number;
  accountSize?: string;
}

export interface ParallelExecutionOptions {
  maxConcurrency?: number;
  timeout?: number;
  retryCount?: number;
}

// ============================================================================
// PARALLEL EXECUTION
// ============================================================================

/**
 * Execute Kai orchestrator components in parallel batches
 */
export async function executeParallel(
  kai: KaiOrchestrator,
  input: ParallelExecutionInput,
  options: ParallelExecutionOptions = {}
): Promise<ComponentResult[]> {
  const { 
    maxConcurrency = 5, 
    timeout = 60000,
  } = options;

  const startTime = Date.now();
  const results: ComponentResult[] = [];

  try {
    // Run prediction through orchestrator
    const predictionResult = await Promise.race([
      kai.predict({
        videoId: input.videoId,
        transcript: input.transcript,
        title: input.title || '',
        description: input.description || '',
        hashtags: input.hashtags || [],
        niche: input.niche || 'general',
        videoPath: input.videoPath,
        duration: input.duration || 0,
        creatorFollowers: input.creatorFollowers || 0,
        accountSize: input.accountSize || 'medium',
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      )
    ]);

    // Convert orchestrator results to ComponentResult format
    if (predictionResult.components_used) {
      for (const componentId of predictionResult.components_used) {
        results.push({
          componentId,
          success: true,
          latency: Date.now() - startTime,
        });
      }
    }

    // Add main prediction result
    results.push({
      componentId: 'kai-orchestrator',
      success: true,
      prediction: predictionResult.predicted_dps,
      confidence: predictionResult.confidence,
      features: predictionResult.training_features,
      insights: predictionResult.insights || [],
      latency: predictionResult.latency_ms_total || (Date.now() - startTime),
    });

  } catch (error: any) {
    console.error('[Parallel Execution] Error:', error.message);
    results.push({
      componentId: 'kai-orchestrator',
      success: false,
      error: error.message,
      latency: Date.now() - startTime,
    });
  }

  return results;
}

/**
 * Execute multiple videos in parallel
 */
export async function executeBatchParallel(
  videos: ParallelExecutionInput[],
  options: ParallelExecutionOptions = {}
): Promise<Map<string, ComponentResult[]>> {
  const { maxConcurrency = 3 } = options;
  const results = new Map<string, ComponentResult[]>();

  // Process in batches
  for (let i = 0; i < videos.length; i += maxConcurrency) {
    const batch = videos.slice(i, i + maxConcurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (input) => {
        const kai = new KaiOrchestrator();
        const componentResults = await executeParallel(kai, input, options);
        return { videoId: input.videoId, results: componentResults };
      })
    );

    for (const { videoId, results: videoResults } of batchResults) {
      results.set(videoId, videoResults);
    }

    console.log(`[Batch Parallel] Processed ${Math.min(i + maxConcurrency, videos.length)}/${videos.length} videos`);
  }

  return results;
}

/**
 * Execute with retry logic
 */
export async function executeWithRetry(
  kai: KaiOrchestrator,
  input: ParallelExecutionInput,
  options: ParallelExecutionOptions = {}
): Promise<ComponentResult[]> {
  const { retryCount = 2 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      return await executeParallel(kai, input, options);
    } catch (error: any) {
      lastError = error;
      console.warn(`[Parallel Execution] Attempt ${attempt + 1} failed: ${error.message}`);
      
      if (attempt < retryCount) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // All retries failed
  return [{
    componentId: 'kai-orchestrator',
    success: false,
    error: lastError?.message || 'All retry attempts failed',
    latency: 0,
  }];
}
