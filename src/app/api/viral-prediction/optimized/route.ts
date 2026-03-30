/**
 * OPTIMIZED VIRAL PREDICTION API - MAXIMUM PERFORMANCE ENDPOINT
 * 
 * 🎯 TARGET: Sub-100ms predictions with coordinated optimizations
 * 
 * FEATURES:
 * - PerformanceCacheManager: Multi-tier intelligent caching
 * - OptimizedEngineCore: Streamlined prediction engines  
 * - DatabaseOptimizationLayer: Query performance enhancement
 * - ParallelProcessingCoordinator: Enhanced parallelization
 * - MemoryEfficientProcessor: Memory and GC optimization
 * - OptimizationOrchestrator: Unified coordination
 * 
 * ENDPOINT: POST /api/viral-prediction/optimized
 */

import { NextRequest, NextResponse } from 'next/server';
import { optimizationOrchestrator } from '@/lib/services/optimization/optimization-orchestrator';
import { realTimeMonitor } from '@/lib/monitoring/real-time-monitor';

// ===== REQUEST/RESPONSE TYPES =====

interface OptimizedPredictionAPIRequest {
  content: string;
  hashtags?: string[];
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  creator_followers?: number;
  niche: string;
  video_length?: number;
  visual_quality?: number;
  audio_quality?: number;
  
  // Optimization preferences
  optimization_preferences?: {
    prioritize_speed?: boolean;
    prioritize_accuracy?: boolean;
    enable_caching?: boolean;
    use_parallel_processing?: boolean;
    optimize_memory?: boolean;
  };
  
  // Request options
  request_id?: string;
  include_performance_metrics?: boolean;
  include_engine_breakdown?: boolean;
}

interface OptimizedPredictionAPIResponse {
  success: boolean;
  request_id: string;
  
  // Prediction results
  prediction: {
    viral_score: number;
    viral_probability: number;
    confidence: number;
    recommendations: string[];
  };
  
  // Performance metrics (if requested)
  performance?: {
    total_processing_time_ms: number;
    cache_hit_rate: number;
    parallel_efficiency: number;
    memory_optimization_mb: number;
    database_query_time_ms: number;
    optimizations_applied: string[];
    response_time_percentile: number;
    optimization_score: number;
  };
  
  // Engine breakdown (if requested)
  engine_results?: {
    main_engine?: any;
    real_engine?: any;
    unified_engine?: any;
    framework_engine?: any;
  };
  
  // Quality metrics
  quality: {
    prediction_accuracy: number;
    resource_efficiency: number;
  };
  
  // Metadata
  metadata: {
    strategy_used: string;
    optimizations_count: number;
    timestamp: string;
  };
}

// ===== API HANDLER =====

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  
  try {
    // Parse request body
    const body: OptimizedPredictionAPIRequest = await request.json();
    
    // Validate required fields
    const validation = validateRequest(body);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      }, { status: 400 });
    }
    
    // Generate request ID
    const requestId = body.request_id || `opt_api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚀 Optimized prediction API request: ${requestId}`);
    
    // Prepare optimization request
    const optimizationRequest = {
      input: {
        content: body.content,
        hashtags: body.hashtags || [],
        platform: body.platform,
        creator_followers: body.creator_followers || 1000,
        niche: body.niche,
        video_length: body.video_length,
        visual_quality: body.visual_quality,
        audio_quality: body.audio_quality
      },
      optimization_preferences: {
        prioritize_speed: body.optimization_preferences?.prioritize_speed || false,
        prioritize_accuracy: body.optimization_preferences?.prioritize_accuracy || false,
        enable_caching: body.optimization_preferences?.enable_caching !== false,
        use_parallel_processing: body.optimization_preferences?.use_parallel_processing !== false,
        optimize_memory: body.optimization_preferences?.optimize_memory !== false
      },
      request_id: requestId
    };
    
    // Execute optimized prediction
    const result = await optimizationOrchestrator.executeOptimizedPrediction(optimizationRequest);
    
    // Build API response
    const apiResponse: OptimizedPredictionAPIResponse = {
      success: true,
      request_id: requestId,
      prediction: {
        viral_score: Math.round(result.viral_score * 100) / 100,
        viral_probability: Math.round(result.viral_probability * 10000) / 10000,
        confidence: Math.round(result.confidence * 100) / 100,
        recommendations: result.recommendations
      },
      quality: {
        prediction_accuracy: Math.round(result.quality.prediction_accuracy * 100) / 100,
        resource_efficiency: Math.round(result.quality.resource_efficiency * 100) / 100
      },
      metadata: {
        strategy_used: getStrategyFromOptimizations(result.performance.optimizations_applied),
        optimizations_count: result.performance.optimizations_applied.length,
        timestamp: new Date().toISOString()
      }
    };
    
    // Include performance metrics if requested
    if (body.include_performance_metrics) {
      apiResponse.performance = {
        total_processing_time_ms: Math.round(result.performance.total_processing_time_ms * 100) / 100,
        cache_hit_rate: Math.round(result.performance.cache_hit_rate * 100) / 100,
        parallel_efficiency: Math.round(result.performance.parallel_efficiency * 100) / 100,
        memory_optimization_mb: Math.round(result.performance.memory_optimization_mb * 100) / 100,
        database_query_time_ms: Math.round(result.performance.database_query_time_ms * 100) / 100,
        optimizations_applied: result.performance.optimizations_applied,
        response_time_percentile: result.quality.response_time_percentile,
        optimization_score: result.quality.optimization_score
      };
    }
    
    // Include engine breakdown if requested
    if (body.include_engine_breakdown) {
      apiResponse.engine_results = result.engine_results;
    }
    
    // Track API performance
    const totalTime = performance.now() - startTime;
    trackAPIPerformance(requestId, totalTime, result.performance.optimizations_applied.length, true);
    
    console.log(`✅ Optimized prediction API complete: ${requestId} (${totalTime.toFixed(2)}ms)`);
    
    return NextResponse.json(apiResponse);
    
  } catch (error) {
    console.error('❌ Optimized prediction API error:', error);
    
    const errorResponse = {
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      request_id: 'error',
      timestamp: new Date().toISOString()
    };
    
    // Track API error
    const totalTime = performance.now() - startTime;
    trackAPIPerformance('error', totalTime, 0, false);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===== BATCH PROCESSING ENDPOINT =====

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const startTime = performance.now();
  
  try {
    // Parse batch request
    const body: { requests: OptimizedPredictionAPIRequest[] } = await request.json();
    
    if (!body.requests || !Array.isArray(body.requests)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch request format'
      }, { status: 400 });
    }
    
    if (body.requests.length > 50) {
      return NextResponse.json({
        success: false,
        error: 'Batch size too large (max 50 requests)'
      }, { status: 400 });
    }
    
    console.log(`🔄 Optimized batch prediction API: ${body.requests.length} requests`);
    
    // Prepare batch optimization requests
    const optimizationRequests = body.requests.map((req, index) => ({
      input: {
        content: req.content,
        hashtags: req.hashtags || [],
        platform: req.platform,
        creator_followers: req.creator_followers || 1000,
        niche: req.niche,
        video_length: req.video_length,
        visual_quality: req.visual_quality,
        audio_quality: req.audio_quality
      },
      optimization_preferences: {
        prioritize_speed: req.optimization_preferences?.prioritize_speed || false,
        prioritize_accuracy: req.optimization_preferences?.prioritize_accuracy || false,
        enable_caching: req.optimization_preferences?.enable_caching !== false,
        use_parallel_processing: req.optimization_preferences?.use_parallel_processing !== false,
        optimize_memory: req.optimization_preferences?.optimize_memory !== false
      },
      request_id: req.request_id || `batch_${Date.now()}_${index}`
    }));
    
    // Execute optimized batch
    const results = await optimizationOrchestrator.executeOptimizedBatch(optimizationRequests);
    
    // Build batch response
    const batchResponse = {
      success: true,
      batch_id: `batch_${Date.now()}`,
      total_requests: body.requests.length,
      successful_predictions: results.filter(r => r.viral_score > 0).length,
      results: results.map((result, index) => ({
        request_id: result.request_id,
        prediction: {
          viral_score: Math.round(result.viral_score * 100) / 100,
          viral_probability: Math.round(result.viral_probability * 10000) / 10000,
          confidence: Math.round(result.confidence * 100) / 100,
          recommendations: result.recommendations.slice(0, 3) // Limit for batch
        },
        performance_summary: {
          processing_time_ms: Math.round(result.performance.total_processing_time_ms * 100) / 100,
          optimizations_applied: result.performance.optimizations_applied.length,
          optimization_score: result.quality.optimization_score
        }
      })),
      batch_performance: {
        total_time_ms: performance.now() - startTime,
        average_time_per_request: (performance.now() - startTime) / body.requests.length,
        optimization_effectiveness: calculateBatchOptimizationEffectiveness(results)
      }
    };
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ Optimized batch prediction API complete: ${body.requests.length} requests in ${totalTime.toFixed(2)}ms`);
    
    return NextResponse.json(batchResponse);
    
  } catch (error) {
    console.error('❌ Optimized batch prediction API error:', error);
    
    const errorResponse = {
      success: false,
      error: 'Batch processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// ===== PERFORMANCE STATUS ENDPOINT =====

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get optimization statistics
    const stats = optimizationOrchestrator.getOptimizationStats();
    
    const performanceStatus = {
      optimization_orchestrator: {
        total_requests: stats.orchestration_stats.total_requests,
        optimized_requests: stats.orchestration_stats.optimized_requests,
        optimization_success_rate: Math.round(stats.orchestration_stats.optimization_success_rate * 100) / 100,
        average_optimization_time: stats.orchestration_stats.optimized_requests > 0 
          ? Math.round(stats.orchestration_stats.total_optimization_time / stats.orchestration_stats.optimized_requests * 100) / 100
          : 0,
        current_strategy: stats.current_strategy.strategy_name
      },
      component_performance: {
        cache: {
          overall_hit_rate: Math.round(stats.component_performance.cache.overall_hit_rate * 100) / 100,
          average_response_time: Math.round(stats.component_performance.cache.average_response_time * 100) / 100,
          cache_efficiency: Math.round(stats.component_performance.cache.cache_efficiency * 100) / 100
        },
        engines: {
          total_calls: stats.component_performance.engines.total_engine_calls,
          average_processing_time: Math.round(stats.component_performance.engines.average_processing_time * 100) / 100,
          cache_hit_rate: Math.round(stats.component_performance.engines.cache_hit_rate * 100) / 100
        },
        database: {
          total_queries: stats.component_performance.database.total_queries,
          average_query_time: Math.round(stats.component_performance.database.average_query_time * 100) / 100,
          connection_pool_efficiency: Math.round(stats.component_performance.database.connection_pool_efficiency * 100) / 100
        },
        parallel_processing: {
          total_workers: stats.component_performance.parallel.worker_pool_status.total_workers,
          worker_efficiency: Math.round(stats.component_performance.parallel.worker_pool_status.worker_efficiency * 100) / 100,
          parallel_efficiency: Math.round(stats.component_performance.parallel.processing_stats.parallel_efficiency * 100) / 100
        },
        memory: {
          heap_used_mb: Math.round(stats.component_performance.memory.current_profile.heap_used_mb * 100) / 100,
          memory_usage_percentage: Math.round(stats.component_performance.memory.current_profile.memory_usage_percentage * 100) / 100,
          pool_efficiency: Math.round(stats.component_performance.memory.object_pools.pool_efficiency * 100) / 100
        }
      },
      performance_baseline: stats.performance_baseline,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(performanceStatus);
    
  } catch (error) {
    console.error('❌ Performance status API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get performance status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===== UTILITY FUNCTIONS =====

function validateRequest(body: OptimizedPredictionAPIRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields
  if (!body.content || typeof body.content !== 'string') {
    errors.push('Content is required and must be a string');
  }
  
  if (!body.platform || !['tiktok', 'instagram', 'youtube', 'twitter'].includes(body.platform)) {
    errors.push('Platform is required and must be one of: tiktok, instagram, youtube, twitter');
  }
  
  if (!body.niche || typeof body.niche !== 'string') {
    errors.push('Niche is required and must be a string');
  }
  
  // Optional field validation
  if (body.creator_followers !== undefined && (typeof body.creator_followers !== 'number' || body.creator_followers < 0)) {
    errors.push('Creator followers must be a non-negative number');
  }
  
  if (body.video_length !== undefined && (typeof body.video_length !== 'number' || body.video_length < 0)) {
    errors.push('Video length must be a non-negative number');
  }
  
  if (body.hashtags !== undefined && !Array.isArray(body.hashtags)) {
    errors.push('Hashtags must be an array');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function getStrategyFromOptimizations(optimizations: string[]): string {
  if (optimizations.includes('cache_hit')) {
    return 'cache_optimized';
  } else if (optimizations.includes('parallel_processing')) {
    return 'parallel_optimized';
  } else if (optimizations.includes('memory_optimization')) {
    return 'memory_optimized';
  } else if (optimizations.length > 3) {
    return 'multi_optimized';
  } else {
    return 'standard';
  }
}

function calculateBatchOptimizationEffectiveness(results: any[]): number {
  if (results.length === 0) return 0;
  
  const totalOptimizations = results.reduce((sum, r) => sum + r.performance.optimizations_applied.length, 0);
  const averageOptimizations = totalOptimizations / results.length;
  
  // Effectiveness based on optimization count and success rate
  const successRate = results.filter(r => r.viral_score > 0).length / results.length;
  
  return Math.round((averageOptimizations * 10 + successRate * 50) * 100) / 100;
}

function trackAPIPerformance(requestId: string, responseTime: number, optimizationsCount: number, success: boolean): void {
  // Track with real-time monitoring
  realTimeMonitor.recordResponseTime({
    endpoint: '/api/viral-prediction/optimized',
    method: 'POST',
    responseTime,
    statusCode: success ? 200 : 500,
    timestamp: new Date()
  });
  
  console.log(`📊 API Performance: ${requestId} - ${responseTime.toFixed(2)}ms (${optimizationsCount} optimizations, ${success ? 'success' : 'failure'})`);
}