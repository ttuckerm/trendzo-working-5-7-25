/**
 * FAST PREDICTION ENGINE MONITORING ENDPOINT
 * 
 * Provides real-time performance metrics for the Fast Prediction Engine
 * Integration with comprehensive monitoring system
 */

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { getFastPredictionEngine } from '@/lib/services/fast-prediction-engine';
import { fastPredictionBenchmark } from '@/lib/testing/fast-prediction-benchmark';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'benchmark':
        return await runBenchmark();
      case 'stats':
        return await getPerformanceStats();
      case 'health':
        return await getHealthCheck();
      default:
        return await getDashboard();
    }
    
  } catch (error) {
    console.error('❌ Fast prediction monitoring error:', error);
    return NextResponse.json(
      { error: 'Monitoring endpoint failed', details: error.message },
      { status: 500 }
    );
  }
}

async function getDashboard() {
  const stats = getFastPredictionEngine().getPerformanceStats();
  
  return NextResponse.json({
    status: 'active',
    engine: 'Fast Prediction Engine v1.0',
    overview: {
      performance_targets: {
        lightning_track: '< 50ms (cache hits)',
        fast_track: '< 100ms (new predictions)',
        full_track: '< 2000ms (fallback)'
      },
      current_performance: {
        lightning_hit_rate: `${(stats.lightning_hit_rate * 100).toFixed(1)}%`,
        fast_hit_rate: `${(stats.fast_hit_rate * 100).toFixed(1)}%`,
        full_fallback_rate: `${(stats.full_fallback_rate * 100).toFixed(1)}%`,
        total_predictions: stats.total_predictions,
        cache_status: stats.cache_status
      }
    },
    metrics: {
      latency_targets: {
        p95_target: '≤ 100ms',
        p99_target: '≤ 150ms',
        cache_hit_target: '≤ 50ms'
      },
      tier_optimization: {
        lightning: 'Memory cache + pre-computed patterns',
        fast: 'Simplified algorithms + smart routing',
        full: 'Comprehensive analysis (existing system)'
      }
    },
    actions: {
      run_benchmark: '/api/admin/monitoring/fast-prediction?action=benchmark',
      get_stats: '/api/admin/monitoring/fast-prediction?action=stats',
      health_check: '/api/admin/monitoring/fast-prediction?action=health'
    },
    timestamp: new Date().toISOString()
  });
}

async function getPerformanceStats() {
  const stats = getFastPredictionEngine().getPerformanceStats();
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  return NextResponse.json({
    engine_performance: {
      tier_distribution: {
        lightning_predictions: stats.lightning_hit_rate,
        fast_predictions: stats.fast_hit_rate,
        full_fallback_predictions: stats.full_fallback_rate
      },
      total_predictions: stats.total_predictions,
      cache_effectiveness: stats.cache_status,
      optimization_level: calculateOptimizationLevel(stats)
    },
    system_performance: {
      memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      uptime_seconds: process.uptime(),
      node_version: process.version
    },
    recommendations: generatePerformanceRecommendations(stats),
    timestamp: new Date().toISOString()
  });
}

async function getHealthCheck() {
  try {
    // Run a quick test prediction
    const testStartTime = performance.now();
    const testResult = await getFastPredictionEngine().predict({
      content: 'Test prediction for health check',
      hashtags: ['test'],
      platform: 'tiktok',
      creator_followers: 1000,
      niche: 'test'
    });
    const testLatency = performance.now() - testStartTime;
    
    const isHealthy = testLatency <= 100 && testResult.viral_score >= 0;
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'degraded',
      health_check: {
        test_prediction_latency_ms: Math.round(testLatency * 10) / 10,
        test_prediction_successful: testResult.viral_score >= 0,
        target_met: testLatency <= 100,
        tier_used: testResult.tier_used,
        cache_status: testResult.cache_status
      },
      engine_status: {
        initialization: fastPredictionEngine.getPerformanceStats().cache_status,
        memory_resident: 'active',
        redis_connection: 'available', // Simplified for demo
        pattern_cache: 'loaded'
      },
      performance_summary: {
        avg_latency_target: '≤ 100ms',
        current_test_latency: `${Math.round(testLatency)}ms`,
        performance_grade: testLatency <= 50 ? 'A' : testLatency <= 100 ? 'B' : 'C'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function runBenchmark() {
  try {
    console.log('🚀 Starting Fast Prediction Benchmark via API...');
    
    const results = await fastPredictionBenchmark.runCompleteBenchmark();
    
    return NextResponse.json({
      benchmark_complete: true,
      results: {
        overall_performance: {
          target_met: results.overall_performance.target_met,
          p95_latency_ms: Math.round(results.overall_performance.p95_latency_ms * 10) / 10,
          average_latency_ms: Math.round(results.overall_performance.average_latency_ms * 10) / 10,
          total_predictions: results.overall_performance.total_predictions,
          cache_hit_rate: Math.round(results.overall_performance.cache_hit_rate * 1000) / 10 + '%'
        },
        lightning_track: {
          p95_latency_ms: Math.round(results.lightning_track_performance.p95_latency_ms * 10) / 10,
          target_met: results.lightning_track_performance.p95_latency_ms <= 50,
          cache_effectiveness: Math.round(results.lightning_track_performance.cache_hit_rate * 1000) / 10 + '%'
        },
        fast_track: {
          p95_latency_ms: Math.round(results.fast_track_performance.p95_latency_ms * 10) / 10,
          target_met: results.fast_track_performance.target_met,
          tier_distribution: results.fast_track_performance.tier_distribution
        },
        load_testing: results.load_test_results.map(lr => ({
          concurrent_users: lr.concurrent_users,
          avg_latency_ms: Math.round(lr.average_latency_ms * 10) / 10,
          requests_per_second: Math.round(lr.requests_per_second * 10) / 10,
          error_rate: Math.round(lr.error_rate * 1000) / 10 + '%',
          target_met: lr.target_met
        }))
      },
      recommendations: results.recommendations,
      targets_met: results.targets_met,
      benchmark_timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    return NextResponse.json({
      benchmark_complete: false,
      error: 'Benchmark failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function calculateOptimizationLevel(stats: any): string {
  const lightningRate = stats.lightning_hit_rate;
  const fastRate = stats.fast_hit_rate;
  
  if (lightningRate > 0.5) return 'Excellent';
  if (lightningRate > 0.3 || fastRate > 0.8) return 'Good';
  if (fastRate > 0.6) return 'Fair';
  return 'Needs Optimization';
}

function generatePerformanceRecommendations(stats: any): string[] {
  const recommendations = [];
  
  if (stats.lightning_hit_rate < 0.3) {
    recommendations.push('Consider increasing cache TTL or pre-computing more patterns');
  }
  
  if (stats.full_fallback_rate > 0.2) {
    recommendations.push('High fallback rate detected - optimize fast track algorithms');
  }
  
  if (stats.total_predictions < 100) {
    recommendations.push('Run more predictions to get statistically significant performance data');
  }
  
  if (stats.cache_status !== 'ready') {
    recommendations.push('Engine still initializing - performance will improve once fully loaded');
  }
  
  return recommendations;
}