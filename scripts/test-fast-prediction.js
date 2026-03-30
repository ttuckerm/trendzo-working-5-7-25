#!/usr/bin/env node

/**
 * FAST PREDICTION ENGINE TEST RUNNER
 * 
 * 🎯 Validates ≤100ms latency target
 * 🎯 Tests cache performance
 * 🎯 Runs load tests
 * 
 * Usage:
 *   node scripts/test-fast-prediction.js
 *   npm run test:fast-prediction
 */

const { performance } = require('perf_hooks');

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

async function runFastPredictionTests() {
  console.log('🚀 Starting Fast Prediction Engine Tests...\n');
  
  try {
    // Import the test suite (dynamic import for ES modules)
    const { fastPredictionBenchmark } = await import('../src/lib/testing/fast-prediction-benchmark.js');
    
    console.log('📊 Running Comprehensive Benchmark Suite...');
    const startTime = performance.now();
    
    const results = await fastPredictionBenchmark.runCompleteBenchmark();
    const totalTime = performance.now() - startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 FAST PREDICTION ENGINE BENCHMARK RESULTS');
    console.log('='.repeat(80));
    
    // Overall Performance
    console.log('\n🎯 OVERALL PERFORMANCE:');
    console.log(`   Target: ≤100ms P95 latency`);
    console.log(`   Actual: ${results.overall_performance.p95_latency_ms.toFixed(1)}ms P95 latency`);
    console.log(`   Status: ${results.overall_performance.target_met ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Average: ${results.overall_performance.average_latency_ms.toFixed(1)}ms`);
    console.log(`   P99: ${results.overall_performance.p99_latency_ms.toFixed(1)}ms`);
    
    // Lightning Track Performance
    console.log('\n⚡ LIGHTNING TRACK (Cache Hits):');
    console.log(`   Target: ≤50ms P95 latency`);
    console.log(`   Actual: ${results.lightning_track_performance.p95_latency_ms.toFixed(1)}ms P95 latency`);
    console.log(`   Status: ${results.lightning_track_performance.p95_latency_ms <= 50 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Cache Hit Rate: ${(results.lightning_track_performance.cache_hit_rate * 100).toFixed(1)}%`);
    
    // Fast Track Performance
    console.log('\n🏃 FAST TRACK (New Predictions):');
    console.log(`   Target: ≤100ms P95 latency`);
    console.log(`   Actual: ${results.fast_track_performance.p95_latency_ms.toFixed(1)}ms P95 latency`);
    console.log(`   Status: ${results.fast_track_performance.target_met ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Tier Distribution
    console.log('\n📊 TIER DISTRIBUTION:');
    const dist = results.overall_performance.tier_distribution;
    console.log(`   Lightning: ${(dist.lightning * 100).toFixed(1)}%`);
    console.log(`   Fast: ${(dist.fast * 100).toFixed(1)}%`);
    console.log(`   Full: ${(dist.full * 100).toFixed(1)}%`);
    
    // Load Test Results
    console.log('\n🔥 LOAD TEST RESULTS:');
    results.load_test_results.forEach(result => {
      console.log(`   ${result.concurrent_users} users: ${result.average_latency_ms.toFixed(1)}ms avg, ${result.requests_per_second.toFixed(1)} RPS, ${(result.error_rate * 100).toFixed(2)}% errors ${result.target_met ? '✅' : '❌'}`);
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    results.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    
    // Final Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY:');
    console.log(`   Benchmark Duration: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`   Overall Target Met: ${results.targets_met ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Memory Usage: ${results.overall_performance.memory_usage_mb.toFixed(1)}MB`);
    console.log(`   Accuracy Estimate: ${(results.overall_performance.accuracy_estimate * 100).toFixed(1)}%`);
    console.log('='.repeat(80));
    
    // Exit with appropriate code
    if (results.targets_met) {
      console.log('\n🎉 All performance targets met! Fast Prediction Engine is ready for production.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Performance targets not met. Review recommendations and optimize.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fast Prediction Test Failed:', error);
    
    if (error.message.includes('Redis')) {
      console.log('\n💡 Tip: Make sure Redis is running locally for optimal performance testing');
      console.log('   Start Redis: docker run -p 6379:6379 redis:alpine');
    }
    
    process.exit(1);
  }
}

// Quick API test without full benchmark
async function runQuickTest() {
  console.log('⚡ Running Quick Fast Prediction Test...\n');
  
  try {
    // Simple prediction test
    const testInput = {
      content: 'Secret fitness tip that changed my life',
      hashtags: ['fitness', 'tips', 'transformation'],
      platform: 'tiktok',
      creator_followers: 50000,
      niche: 'fitness'
    };
    
    const { fastPredictionEngine } = await import('../src/lib/services/fast-prediction-engine.js');
    
    // Test 5 predictions
    const latencies = [];
    for (let i = 0; i < 5; i++) {
      const startTime = performance.now();
      const result = await fastPredictionEngine.predict(testInput);
      const latency = performance.now() - startTime;
      
      latencies.push(latency);
      console.log(`   Test ${i + 1}: ${latency.toFixed(1)}ms (${result.tier_used} track) - Score: ${result.viral_score.toFixed(1)}`);
    }
    
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    console.log(`\n📊 Average Latency: ${avgLatency.toFixed(1)}ms`);
    console.log(`🎯 Target: ≤100ms`);
    console.log(`📈 Status: ${avgLatency <= 100 ? '✅ PASSED' : '❌ FAILED'}`);
    
    process.exit(avgLatency <= 100 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
    process.exit(1);
  }
}

// Run based on command line arguments
const args = process.argv.slice(2);
if (args.includes('--quick') || args.includes('-q')) {
  runQuickTest();
} else {
  runFastPredictionTests();
}