'use client';

/**
 * OPTIMIZED ALGORITHMS TEST PAGE
 * 
 * 🎯 DEMONSTRATES: All 5 optimization components working together
 * 
 * FEATURES:
 * - Performance comparison (optimized vs standard)
 * - Real-time optimization metrics
 * - Component performance breakdown
 * - Batch processing demonstration
 * - Interactive optimization controls
 */

import React, { useState, useEffect } from 'react';

interface PredictionResult {
  viral_score: number;
  viral_probability: number;
  confidence: number;
  recommendations: string[];
}

interface PerformanceMetrics {
  total_processing_time_ms: number;
  cache_hit_rate: number;
  parallel_efficiency: number;
  memory_optimization_mb: number;
  database_query_time_ms: number;
  optimizations_applied: string[];
  response_time_percentile: number;
  optimization_score: number;
}

interface TestResult {
  request_id: string;
  prediction: PredictionResult;
  performance?: PerformanceMetrics;
  quality: {
    prediction_accuracy: number;
    resource_efficiency: number;
  };
  metadata: {
    strategy_used: string;
    optimizations_count: number;
    timestamp: string;
  };
}

export default function TestOptimizedAlgorithms() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any>(null);
  
  // Test configuration
  const [testContent, setTestContent] = useState("Here's the secret hack that fitness influencers don't want you to know! This simple 5-minute routine will transform your body in just 30 days. I've helped over 10,000 people achieve their dream physique with this proven method.");
  const [platform, setPlatform] = useState<'tiktok' | 'instagram' | 'youtube' | 'twitter'>('tiktok');
  const [niche, setNiche] = useState('fitness');
  const [creatorFollowers, setCreatorFollowers] = useState(50000);
  
  // Optimization preferences
  const [prioritizeSpeed, setPrioritizeSpeed] = useState(true);
  const [prioritizeAccuracy, setPrioritizeAccuracy] = useState(false);
  const [enableCaching, setEnableCaching] = useState(true);
  const [useParallel, setUseParallel] = useState(true);
  const [optimizeMemory, setOptimizeMemory] = useState(true);
  
  // Test single optimized prediction
  const testOptimizedPrediction = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/viral-prediction/optimized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: testContent,
          hashtags: ['fyp', 'viral', 'fitness', 'hack', 'transformation'],
          platform,
          creator_followers: creatorFollowers,
          niche,
          video_length: 60,
          visual_quality: 85,
          audio_quality: 80,
          optimization_preferences: {
            prioritize_speed: prioritizeSpeed,
            prioritize_accuracy: prioritizeAccuracy,
            enable_caching: enableCaching,
            use_parallel_processing: useParallel,
            optimize_memory: optimizeMemory
          },
          include_performance_metrics: true,
          include_engine_breakdown: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestResults(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 results
      } else {
        console.error('Prediction failed:', data.error);
      }
      
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test batch processing
  const testBatchProcessing = async () => {
    setIsLoading(true);
    
    try {
      const batchRequests = [
        {
          content: "Secret fitness hack that trainers hate! Transform your body in 30 days with this simple routine.",
          platform: 'tiktok' as const,
          niche: 'fitness',
          creator_followers: 25000
        },
        {
          content: "POV: You discover the investment strategy that made me $100k in 6 months. Here's exactly how I did it.",
          platform: 'instagram' as const,
          niche: 'finance',
          creator_followers: 75000
        },
        {
          content: "This productivity hack increased my output by 300%. I'll show you the exact system I use daily.",
          platform: 'youtube' as const,
          niche: 'productivity',
          creator_followers: 150000
        },
        {
          content: "Breaking: The psychology trick that makes people instantly like you. Scientists are shocked by the results.",
          platform: 'twitter' as const,
          niche: 'psychology',
          creator_followers: 10000
        },
        {
          content: "The skincare routine that cleared my skin in 2 weeks. Dermatologists recommend this $5 ingredient.",
          platform: 'tiktok' as const,
          niche: 'beauty',
          creator_followers: 40000
        }
      ].map((req, index) => ({
        ...req,
        hashtags: ['viral', 'trending', 'fyp'],
        optimization_preferences: {
          prioritize_speed: true,
          enable_caching: true,
          use_parallel_processing: true,
          optimize_memory: true
        },
        request_id: `batch_test_${index + 1}`
      }));
      
      const response = await fetch('/api/viral-prediction/optimized', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: batchRequests })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBatchResults(data);
      } else {
        console.error('Batch processing failed:', data.error);
      }
      
    } catch (error) {
      console.error('Batch test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get performance statistics
  const getPerformanceStats = async () => {
    try {
      const response = await fetch('/api/viral-prediction/optimized');
      const data = await response.json();
      setPerformanceStats(data);
    } catch (error) {
      console.error('Failed to get performance stats:', error);
    }
  };
  
  // Auto-refresh performance stats
  useEffect(() => {
    getPerformanceStats();
    const interval = setInterval(getPerformanceStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            🔧 Optimized Algorithms Test Lab
          </h1>
          <p className="text-gray-400 text-lg">
            Testing the complete optimization stack: 5 components working together for maximum performance
          </p>
        </div>
        
        {/* Performance Statistics Dashboard */}
        {performanceStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Cache Performance */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-purple-400">📦 Cache Performance</h3>
              <div className="text-2xl font-bold text-green-400">
                {(performanceStats.component_performance.cache.overall_hit_rate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-400">Hit Rate</div>
              <div className="text-sm text-gray-300 mt-1">
                {performanceStats.component_performance.cache.average_response_time.toFixed(1)}ms avg
              </div>
            </div>
            
            {/* Engine Performance */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">⚡ Engine Speed</h3>
              <div className="text-2xl font-bold text-green-400">
                {performanceStats.component_performance.engines.average_processing_time.toFixed(0)}ms
              </div>
              <div className="text-xs text-gray-400">Avg Processing</div>
              <div className="text-sm text-gray-300 mt-1">
                {performanceStats.component_performance.engines.total_calls} calls
              </div>
            </div>
            
            {/* Database Performance */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-yellow-400">🗄️ Database</h3>
              <div className="text-2xl font-bold text-green-400">
                {performanceStats.component_performance.database.average_query_time.toFixed(1)}ms
              </div>
              <div className="text-xs text-gray-400">Query Time</div>
              <div className="text-sm text-gray-300 mt-1">
                {(performanceStats.component_performance.database.connection_pool_efficiency * 100).toFixed(0)}% efficiency
              </div>
            </div>
            
            {/* Parallel Processing */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-red-400">🔄 Parallel</h3>
              <div className="text-2xl font-bold text-green-400">
                {performanceStats.component_performance.parallel_processing.total_workers}
              </div>
              <div className="text-xs text-gray-400">Workers</div>
              <div className="text-sm text-gray-300 mt-1">
                {(performanceStats.component_performance.parallel_processing.worker_efficiency * 100).toFixed(0)}% efficiency
              </div>
            </div>
            
            {/* Memory Performance */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-green-400">🧠 Memory</h3>
              <div className="text-2xl font-bold text-green-400">
                {performanceStats.component_performance.memory.heap_used_mb.toFixed(0)}MB
              </div>
              <div className="text-xs text-gray-400">Heap Used</div>
              <div className="text-sm text-gray-300 mt-1">
                {(performanceStats.component_performance.memory.pool_efficiency * 100).toFixed(0)}% pool efficiency
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Configuration */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">🧪 Test Configuration</h2>
            
            {/* Content Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">Test Content</label>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white"
                rows={4}
                placeholder="Enter content to test..."
              />
            </div>
            
            {/* Platform and Niche */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as any)}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube">YouTube</option>
                  <option value="twitter">Twitter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Niche</label>
                <select
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 text-white"
                >
                  <option value="fitness">Fitness</option>
                  <option value="business">Business</option>
                  <option value="finance">Finance</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="education">Education</option>
                  <option value="entertainment">Entertainment</option>
                </select>
              </div>
            </div>
            
            {/* Creator Followers */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Creator Followers: {creatorFollowers.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="1000000"
                value={creatorFollowers}
                onChange={(e) => setCreatorFollowers(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            {/* Optimization Preferences */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Optimization Preferences</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={prioritizeSpeed}
                    onChange={(e) => setPrioritizeSpeed(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Prioritize Speed</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={prioritizeAccuracy}
                    onChange={(e) => setPrioritizeAccuracy(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Prioritize Accuracy</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={enableCaching}
                    onChange={(e) => setEnableCaching(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Enable Caching</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={useParallel}
                    onChange={(e) => setUseParallel(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Use Parallel Processing</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={optimizeMemory}
                    onChange={(e) => setOptimizeMemory(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Optimize Memory</span>
                </label>
              </div>
            </div>
            
            {/* Test Buttons */}
            <div className="space-y-3">
              <button
                onClick={testOptimizedPrediction}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                {isLoading ? 'Testing...' : '🚀 Test Single Prediction'}
              </button>
              
              <button
                onClick={testBatchProcessing}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                {isLoading ? 'Testing...' : '🔄 Test Batch Processing (5 requests)'}
              </button>
            </div>
          </div>
          
          {/* Test Results */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">📊 Test Results</h2>
            
            {testResults.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={result.request_id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-lg font-semibold text-blue-400">
                        Viral Score: {result.prediction.viral_score}%
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(result.metadata.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-400">Confidence</div>
                        <div className="text-lg font-semibold text-green-400">
                          {(result.prediction.confidence * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Probability</div>
                        <div className="text-lg font-semibold text-purple-400">
                          {(result.prediction.viral_probability * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {result.performance && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-yellow-400 mb-2">Performance</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">Processing:</span>
                            <span className="text-green-400 ml-1">
                              {result.performance.total_processing_time_ms.toFixed(1)}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Cache Hit:</span>
                            <span className="text-blue-400 ml-1">
                              {(result.performance.cache_hit_rate * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Parallel:</span>
                            <span className="text-purple-400 ml-1">
                              {result.performance.parallel_efficiency.toFixed(1)}x
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Memory:</span>
                            <span className="text-red-400 ml-1">
                              {result.performance.memory_optimization_mb.toFixed(1)}MB
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-orange-400 mb-1">Optimizations Applied</div>
                      <div className="flex flex-wrap gap-1">
                        {result.performance?.optimizations_applied.map((opt, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-600 rounded text-xs">
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="text-gray-400 mb-1">Strategy: {result.metadata.strategy_used}</div>
                      <div className="text-gray-400">Quality Score: {result.quality.resource_efficiency.toFixed(1)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No test results yet. Run a test to see optimization performance!
              </div>
            )}
          </div>
        </div>
        
        {/* Batch Results */}
        {batchResults && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">🔄 Batch Processing Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-400">Total Requests</div>
                <div className="text-2xl font-bold text-white">{batchResults.total_requests}</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-green-400">Success Rate</div>
                <div className="text-2xl font-bold text-white">
                  {((batchResults.successful_predictions / batchResults.total_requests) * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-400">Batch Time</div>
                <div className="text-2xl font-bold text-white">
                  {batchResults.batch_performance.total_time_ms.toFixed(0)}ms
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {batchResults.results.map((result: any, index: number) => (
                <div key={result.request_id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-blue-400">
                      {result.request_id}: {result.prediction.viral_score}%
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.performance_summary.processing_time_ms.toFixed(1)}ms
                      ({result.performance_summary.optimizations_applied} optimizations)
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-300 mt-2">
                    Confidence: {(result.prediction.confidence * 100).toFixed(1)}% | 
                    Optimization Score: {result.performance_summary.optimization_score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Overall Performance Summary */}
        {performanceStats && (
          <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400">📈 Overall Performance Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-400">Total Requests</div>
                <div className="text-2xl font-bold text-white">
                  {performanceStats.optimization_orchestrator.total_requests}
                </div>
                <div className="text-sm text-gray-400">
                  {performanceStats.optimization_orchestrator.optimized_requests} optimized
                </div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-green-400">Success Rate</div>
                <div className="text-2xl font-bold text-white">
                  {(performanceStats.optimization_orchestrator.optimization_success_rate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400">optimization success</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-purple-400">Avg Time</div>
                <div className="text-2xl font-bold text-white">
                  {performanceStats.optimization_orchestrator.average_optimization_time.toFixed(1)}ms
                </div>
                <div className="text-sm text-gray-400">per request</div>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="text-lg font-semibold text-orange-400">Strategy</div>
                <div className="text-lg font-bold text-white">
                  {performanceStats.optimization_orchestrator.current_strategy}
                </div>
                <div className="text-sm text-gray-400">active strategy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}