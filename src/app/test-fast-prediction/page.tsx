/**
 * FAST PREDICTION ENGINE TEST PAGE
 * 
 * Simple UI to test the Fast Prediction Engine performance
 * and validate ≤100ms latency targets
 */

'use client';

import { useState } from 'react';

interface TestResult {
  viral_score: number;
  viral_probability: number;
  confidence: number;
  processing_time_ms: number;
  tier_used: string;
  cache_status: string;
  prediction_id: string;
}

interface BenchmarkResults {
  test_count: number;
  average_latency: number;
  p95_latency: number;
  target_met: boolean;
  tier_distribution: {
    lightning: number;
    fast: number;
    full: number;
  };
}

export default function FastPredictionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResults | null>(null);
  
  const testCases = [
    {
      content: 'Secret fitness tip that changed my life',
      hashtags: ['fitness', 'tips', 'transformation'],
      platform: 'tiktok',
      creator_followers: 50000,
      niche: 'fitness'
    },
    {
      content: 'Business hack for making money online',
      hashtags: ['business', 'money', 'entrepreneur'],
      platform: 'instagram',
      creator_followers: 10000,
      niche: 'business'
    },
    {
      content: 'This nutrition trick will blow your mind',
      hashtags: ['nutrition', 'health', 'mindblown'],
      platform: 'tiktok',
      creator_followers: 15000,
      niche: 'health'
    }
  ];
  
  async function runSingleTest() {
    setIsRunning(true);
    try {
      const testCase = testCases[Math.floor(Math.random() * testCases.length)];
      
      const response = await fetch('/api/viral-prediction/fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setTestResults(prev => [result.data, ...prev.slice(0, 19)]); // Keep last 20 results
      } else {
        console.error('API returned error:', result);
      }
      
    } catch (error) {
      console.error('Test failed:', error);
      alert(`Test failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }
  
  async function runBenchmark() {
    setIsRunning(true);
    try {
      const results: TestResult[] = [];
      
      // Run 20 tests
      for (let i = 0; i < 20; i++) {
        const testCase = testCases[i % testCases.length];
        
        const response = await fetch('/api/viral-prediction/fast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            results.push(result.data);
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Calculate benchmark metrics
      const latencies = results.map(r => r.processing_time_ms);
      const sortedLatencies = latencies.sort((a, b) => a - b);
      const p95Index = Math.floor(0.95 * sortedLatencies.length);
      
      const tierCounts = results.reduce((acc, r) => {
        acc[r.tier_used] = (acc[r.tier_used] || 0) + 1;
        return acc;
      }, {} as any);
      
      const benchmark: BenchmarkResults = {
        test_count: results.length,
        average_latency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        p95_latency: sortedLatencies[p95Index] || 0,
        target_met: (sortedLatencies[p95Index] || 0) <= 100,
        tier_distribution: {
          lightning: (tierCounts.lightning || 0) / results.length,
          fast: (tierCounts.fast || 0) / results.length,
          full: (tierCounts.full || 0) / results.length
        }
      };
      
      setBenchmarkResults(benchmark);
      setTestResults(results);
      
    } catch (error) {
      console.error('Benchmark failed:', error);
      alert(`Benchmark failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 Fast Prediction Engine Test Suite
        </h1>
        
        <div className="mb-8 text-center">
          <p className="text-xl mb-4">Target: ≤100ms P95 latency</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={runSingleTest}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              {isRunning ? 'Running...' : 'Run Single Test'}
            </button>
            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
            >
              {isRunning ? 'Running...' : 'Run Benchmark (20 tests)'}
            </button>
          </div>
        </div>
        
        {benchmarkResults && (
          <div className="mb-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📊 Benchmark Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
                <div className="space-y-2">
                  <p>Tests Run: <span className="font-mono">{benchmarkResults.test_count}</span></p>
                  <p>Average Latency: <span className="font-mono">{benchmarkResults.average_latency.toFixed(1)}ms</span></p>
                  <p>P95 Latency: <span className="font-mono">{benchmarkResults.p95_latency.toFixed(1)}ms</span></p>
                  <p>Target Met: <span className={`font-mono ${benchmarkResults.target_met ? 'text-green-400' : 'text-red-400'}`}>
                    {benchmarkResults.target_met ? '✅ PASSED' : '❌ FAILED'}
                  </span></p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Tier Distribution</h3>
                <div className="space-y-2">
                  <p>Lightning Track: <span className="font-mono">{(benchmarkResults.tier_distribution.lightning * 100).toFixed(1)}%</span></p>
                  <p>Fast Track: <span className="font-mono">{(benchmarkResults.tier_distribution.fast * 100).toFixed(1)}%</span></p>
                  <p>Full Track: <span className="font-mono">{(benchmarkResults.tier_distribution.full * 100).toFixed(1)}%</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {testResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🧪 Test Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">Prediction ID</th>
                    <th className="text-left p-2">Latency (ms)</th>
                    <th className="text-left p-2">Tier Used</th>
                    <th className="text-left p-2">Cache Status</th>
                    <th className="text-left p-2">Viral Score</th>
                    <th className="text-left p-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {testResults.map((result, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="p-2 font-mono text-xs">{result.prediction_id.slice(-8)}</td>
                      <td className={`p-2 font-mono ${result.processing_time_ms <= 50 ? 'text-green-400' : result.processing_time_ms <= 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {result.processing_time_ms.toFixed(1)}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.tier_used === 'lightning' ? 'bg-green-600' :
                          result.tier_used === 'fast' ? 'bg-blue-600' : 'bg-red-600'
                        }`}>
                          {result.tier_used}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.cache_status === 'hit' ? 'bg-green-600' : 'bg-gray-600'
                        }`}>
                          {result.cache_status}
                        </span>
                      </td>
                      <td className="p-2 font-mono">{result.viral_score.toFixed(1)}</td>
                      <td className="p-2 font-mono">{(result.confidence * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center text-gray-400">
          <p>Fast Prediction Engine v1.0 | Target: ≤100ms P95 latency</p>
          <p>Lightning Track: &lt;50ms | Fast Track: &lt;100ms | Full Track: &lt;2000ms</p>
        </div>
      </div>
    </div>
  );
}