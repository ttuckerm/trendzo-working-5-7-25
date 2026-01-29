'use client';

/**
 * COMPREHENSIVE TESTING FRAMEWORK UI
 * 
 * 🎯 COMPLETE TESTING DASHBOARD:
 * - Run pre-built test suites (accuracy, performance, load, regression, edge cases, A/B)
 * - Execute custom test cases
 * - View real-time test results and metrics
 * - Run performance benchmarks and load tests
 * - Generate comprehensive test reports
 * - Monitor framework statistics and health
 * 
 * FEATURES:
 * - Interactive test execution controls
 * - Real-time progress monitoring
 * - Detailed results visualization
 * - Performance analytics dashboard
 * - Test suite management
 * - Custom test case creation
 */

import React, { useState, useEffect } from 'react';

interface TestSuite {
  name: string;
  id: string;
  description: string;
}

interface TestResult {
  run_id: string;
  suite_name: string;
  status: string;
  summary: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    success_rate: number;
    average_response_time: number;
    average_accuracy: number;
    fastest_test_ms: number;
    slowest_test_ms: number;
  };
  test_results: Array<{
    test_case_id: string;
    status: string;
    viral_score: number;
    confidence: number;
    processing_time_ms: number;
    validation: {
      meets_expectations: boolean;
      accuracy_score: number;
      performance_score: number;
    };
  }>;
}

interface BenchmarkResult {
  benchmark_id: string;
  benchmark_type: string;
  throughput: {
    requests_per_second: number;
    concurrent_users: number;
    total_requests: number;
  };
  response_times: {
    average_ms: number;
    p95_ms: number;
    p99_ms: number;
  };
  resource_utilization: {
    peak_memory_mb: number;
    average_cpu_percent: number;
  };
  quality_metrics: {
    error_rate: number;
    accuracy_score: number;
  };
}

interface FrameworkStats {
  framework_stats: {
    total_test_runs: number;
    total_tests_executed: number;
    total_benchmarks_run: number;
  };
  active_test_runs: number;
  total_test_suites: number;
}

export default function TestFrameworkPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [frameworkStats, setFrameworkStats] = useState<FrameworkStats | null>(null);
  const [currentTestResult, setCurrentTestResult] = useState<TestResult | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suites' | 'custom' | 'benchmarks' | 'results' | 'stats'>('suites');
  
  // Custom test configuration
  const [customTestCases, setCustomTestCases] = useState([
    {
      name: 'Custom Test 1',
      content: 'Test content for custom prediction',
      platform: 'tiktok',
      niche: 'fitness',
      creator_followers: 50000
    }
  ]);
  
  // Test execution options
  const [executionOptions, setExecutionOptions] = useState({
    parallel: true,
    fail_fast: false,
    include_benchmarks: false,
    generate_report: true
  });
  
  // Load initial data
  useEffect(() => {
    loadTestSuites();
    loadFrameworkStats();
  }, []);
  
  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(loadFrameworkStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  const loadTestSuites = async () => {
    try {
      const response = await fetch('/api/testing/framework?action=test_suites');
      const data = await response.json();
      
      if (data.success) {
        setTestSuites(data.data.available_suites);
      }
    } catch (error) {
      console.error('Failed to load test suites:', error);
    }
  };
  
  const loadFrameworkStats = async () => {
    try {
      const response = await fetch('/api/testing/framework?action=framework_stats');
      const data = await response.json();
      
      if (data.success) {
        setFrameworkStats(data.data.framework_statistics);
      }
    } catch (error) {
      console.error('Failed to load framework stats:', error);
    }
  };
  
  const executeTestSuite = async (suiteId: string, suiteName: string) => {
    setIsLoading(true);
    
    try {
      console.log(`🧪 Executing test suite: ${suiteName}`);
      
      const response = await fetch('/api/testing/framework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          suite_id: suiteId,
          execution_options: executionOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentTestResult(data.data);
        setActiveTab('results');
        console.log(`✅ Test suite completed: ${data.data.test_run.run_id}`);
      } else {
        console.error('Test execution failed:', data.error);
      }
      
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsLoading(false);
      loadFrameworkStats(); // Refresh stats
    }
  };
  
  const executeCustomTests = async () => {
    setIsLoading(true);
    
    try {
      console.log(`🔧 Executing ${customTestCases.length} custom test cases`);
      
      const response = await fetch('/api/testing/framework', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          custom_test_cases: customTestCases,
          execution_options: executionOptions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCurrentTestResult(data.data);
        setActiveTab('results');
        console.log(`✅ Custom tests completed: ${data.data.test_run.run_id}`);
      } else {
        console.error('Custom test execution failed:', data.error);
      }
      
    } catch (error) {
      console.error('Custom test execution error:', error);
    } finally {
      setIsLoading(false);
      loadFrameworkStats();
    }
  };
  
  const runQuickValidation = async () => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Running quick validation...');
      
      const response = await fetch('/api/testing/framework?action=quick_validation');
      const data = await response.json();
      
      if (data.success) {
        const result = data.data.validation_result;
        alert(`Quick Validation Results:\n\nSuccess Rate: ${result.success_rate.toFixed(1)}%\nAverage Accuracy: ${(result.average_accuracy * 100).toFixed(1)}%\nAverage Response Time: ${result.average_response_time.toFixed(1)}ms\n\nRecommendation: ${data.data.recommendation}`);
      }
      
    } catch (error) {
      console.error('Quick validation error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const runBenchmark = async (benchmarkType: 'performance' | 'load' | 'stress') => {
    setIsLoading(true);
    
    try {
      console.log(`🚀 Running ${benchmarkType} benchmark...`);
      
      const config = {
        performance: { duration_seconds: 30, concurrent_users: 5, requests_per_user: 10 },
        load: { duration_seconds: 60, concurrent_users: 20, requests_per_user: 20 },
        stress: { duration_seconds: 120, concurrent_users: 50, requests_per_user: 50 }
      };
      
      const response = await fetch('/api/testing/framework', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          benchmark_type: benchmarkType,
          config: config[benchmarkType]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newBenchmark = data.data.benchmark_result;
        setBenchmarkResults(prev => [newBenchmark, ...prev.slice(0, 9)]); // Keep last 10
        setActiveTab('benchmarks');
        console.log(`✅ Benchmark completed: ${newBenchmark.benchmark_id}`);
      } else {
        console.error('Benchmark failed:', data.error);
      }
      
    } catch (error) {
      console.error('Benchmark error:', error);
    } finally {
      setIsLoading(false);
      loadFrameworkStats();
    }
  };
  
  const addCustomTestCase = () => {
    setCustomTestCases(prev => [...prev, {
      name: `Custom Test ${prev.length + 1}`,
      content: '',
      platform: 'tiktok',
      niche: 'fitness',
      creator_followers: 25000
    }]);
  };
  
  const updateCustomTestCase = (index: number, field: string, value: string | number) => {
    setCustomTestCases(prev => 
      prev.map((testCase, i) => 
        i === index ? { ...testCase, [field]: value } : testCase
      )
    );
  };
  
  const removeCustomTestCase = (index: number) => {
    setCustomTestCases(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            🧪 Algorithm Testing Framework
          </h1>
          <p className="text-gray-400 text-lg">
            Comprehensive testing suite for viral prediction algorithms - accuracy, performance, load testing & more
          </p>
        </div>
        
        {/* Framework Statistics Dashboard */}
        {frameworkStats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-green-400">📊 Total Test Runs</h3>
              <div className="text-2xl font-bold text-white">
                {frameworkStats.framework_stats.total_test_runs}
              </div>
              <div className="text-xs text-gray-400">All time executions</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-blue-400">🧪 Tests Executed</h3>
              <div className="text-2xl font-bold text-white">
                {frameworkStats.framework_stats.total_tests_executed}
              </div>
              <div className="text-xs text-gray-400">Individual test cases</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-purple-400">🚀 Benchmarks Run</h3>
              <div className="text-2xl font-bold text-white">
                {frameworkStats.framework_stats.total_benchmarks_run}
              </div>
              <div className="text-xs text-gray-400">Performance tests</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-sm font-semibold mb-2 text-yellow-400">⚡ Active Runs</h3>
              <div className="text-2xl font-bold text-white">
                {frameworkStats.active_test_runs}
              </div>
              <div className="text-xs text-gray-400">Currently executing</div>
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={runQuickValidation}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
          >
            {isLoading ? 'Running...' : '🚀 Quick Validation'}
          </button>
          
          <button
            onClick={() => runBenchmark('performance')}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
          >
            {isLoading ? 'Running...' : '⚡ Performance Benchmark'}
          </button>
          
          <button
            onClick={() => runBenchmark('load')}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
          >
            {isLoading ? 'Running...' : '🔄 Load Test'}
          </button>
          
          <button
            onClick={() => runBenchmark('stress')}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
          >
            {isLoading ? 'Running...' : '💥 Stress Test'}
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'suites', name: '📋 Test Suites', icon: '📋' },
              { id: 'custom', name: '🔧 Custom Tests', icon: '🔧' },
              { id: 'benchmarks', name: '🚀 Benchmarks', icon: '🚀' },
              { id: 'results', name: '📊 Results', icon: '📊' },
              { id: 'stats', name: '📈 Stats', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Test Execution Options */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">⚙️ Execution Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={executionOptions.parallel}
                onChange={(e) => setExecutionOptions(prev => ({ ...prev, parallel: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Parallel Execution</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={executionOptions.fail_fast}
                onChange={(e) => setExecutionOptions(prev => ({ ...prev, fail_fast: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Fail Fast</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={executionOptions.include_benchmarks}
                onChange={(e) => setExecutionOptions(prev => ({ ...prev, include_benchmarks: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Include Benchmarks</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={executionOptions.generate_report}
                onChange={(e) => setExecutionOptions(prev => ({ ...prev, generate_report: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm">Generate Report</span>
            </label>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          {/* Test Suites Tab */}
          {activeTab === 'suites' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-400">📋 Pre-built Test Suites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {testSuites.map((suite) => (
                  <div key={suite.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-semibold mb-2 text-blue-400">{suite.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{suite.description}</p>
                    <button
                      onClick={() => executeTestSuite(suite.id, suite.name)}
                      disabled={isLoading}
                      className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
                    >
                      {isLoading ? 'Running...' : 'Execute Suite'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Tests Tab */}
          {activeTab === 'custom' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-green-400">🔧 Custom Test Cases</h2>
                <button
                  onClick={addCustomTestCase}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all"
                >
                  + Add Test Case
                </button>
              </div>
              
              <div className="space-y-4 mb-6">
                {customTestCases.map((testCase, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-blue-400">Test Case {index + 1}</h3>
                      <button
                        onClick={() => removeCustomTestCase(index)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Test Name</label>
                        <input
                          type="text"
                          value={testCase.name}
                          onChange={(e) => updateCustomTestCase(index, 'name', e.target.value)}
                          className="w-full p-2 rounded bg-gray-600 border border-gray-500 text-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Platform</label>
                        <select
                          value={testCase.platform}
                          onChange={(e) => updateCustomTestCase(index, 'platform', e.target.value)}
                          className="w-full p-2 rounded bg-gray-600 border border-gray-500 text-white"
                        >
                          <option value="tiktok">TikTok</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="twitter">Twitter</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Niche</label>
                        <select
                          value={testCase.niche}
                          onChange={(e) => updateCustomTestCase(index, 'niche', e.target.value)}
                          className="w-full p-2 rounded bg-gray-600 border border-gray-500 text-white"
                        >
                          <option value="fitness">Fitness</option>
                          <option value="business">Business</option>
                          <option value="finance">Finance</option>
                          <option value="lifestyle">Lifestyle</option>
                          <option value="education">Education</option>
                          <option value="entertainment">Entertainment</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Creator Followers</label>
                        <input
                          type="number"
                          value={testCase.creator_followers}
                          onChange={(e) => updateCustomTestCase(index, 'creator_followers', parseInt(e.target.value))}
                          className="w-full p-2 rounded bg-gray-600 border border-gray-500 text-white"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-300">Content</label>
                        <textarea
                          value={testCase.content}
                          onChange={(e) => updateCustomTestCase(index, 'content', e.target.value)}
                          rows={3}
                          className="w-full p-2 rounded bg-gray-600 border border-gray-500 text-white"
                          placeholder="Enter test content..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={executeCustomTests}
                disabled={isLoading || customTestCases.length === 0}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-all"
              >
                {isLoading ? 'Executing...' : `Execute ${customTestCases.length} Custom Tests`}
              </button>
            </div>
          )}
          
          {/* Benchmarks Tab */}
          {activeTab === 'benchmarks' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-400">🚀 Benchmark Results</h2>
              
              {benchmarkResults.length > 0 ? (
                <div className="space-y-4">
                  {benchmarkResults.map((benchmark) => (
                    <div key={benchmark.benchmark_id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-blue-400">
                            {benchmark.benchmark_type.toUpperCase()} Benchmark
                          </h3>
                          <p className="text-sm text-gray-400">{benchmark.benchmark_id}</p>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-400">Throughput</div>
                          <div className="text-lg font-semibold text-green-400">
                            {benchmark.throughput.requests_per_second.toFixed(1)} req/sec
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-400">Avg Response</div>
                          <div className="text-lg font-semibold text-blue-400">
                            {benchmark.response_times.average_ms.toFixed(1)}ms
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-400">P95 Response</div>
                          <div className="text-lg font-semibold text-purple-400">
                            {benchmark.response_times.p95_ms.toFixed(1)}ms
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-gray-400">Error Rate</div>
                          <div className="text-lg font-semibold text-red-400">
                            {(benchmark.quality_metrics.error_rate * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No benchmark results yet. Run a benchmark to see performance metrics!
                </div>
              )}
            </div>
          )}
          
          {/* Results Tab */}
          {activeTab === 'results' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-400">📊 Test Results</h2>
              
              {currentTestResult ? (
                <div>
                  {/* Summary */}
                  <div className="mb-6 bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-semibold mb-3 text-blue-400">
                      {currentTestResult.suite_name} - {currentTestResult.run_id}
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Success Rate</div>
                        <div className="text-2xl font-semibold text-green-400">
                          {currentTestResult.summary.success_rate.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400">Avg Response</div>
                        <div className="text-2xl font-semibold text-blue-400">
                          {currentTestResult.summary.average_response_time.toFixed(1)}ms
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400">Avg Accuracy</div>
                        <div className="text-2xl font-semibold text-purple-400">
                          {(currentTestResult.summary.average_accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-400">Tests</div>
                        <div className="text-2xl font-semibold text-yellow-400">
                          {currentTestResult.summary.passed_tests}/{currentTestResult.summary.total_tests}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Individual Results */}
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-gray-300">Individual Test Results</h4>
                    {currentTestResult.test_results.map((result, index) => (
                      <div key={result.test_case_id} className="bg-gray-700 p-3 rounded-lg border border-gray-600">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <span className={`w-3 h-3 rounded-full ${
                              result.status === 'passed' ? 'bg-green-400' :
                              result.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                            }`}></span>
                            <span className="font-medium">Test {index + 1}</span>
                            <span className="text-sm text-gray-400">({result.test_case_id})</span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm">
                            <span>Score: {result.viral_score.toFixed(1)}%</span>
                            <span>Confidence: {(result.confidence * 100).toFixed(1)}%</span>
                            <span>Time: {result.processing_time_ms.toFixed(1)}ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No test results yet. Execute a test suite to see results!
                </div>
              )}
            </div>
          )}
          
          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-green-400">📈 Framework Statistics</h2>
              
              {frameworkStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-semibold mb-3 text-blue-400">Execution Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Test Runs:</span>
                        <span className="font-semibold">{frameworkStats.framework_stats.total_test_runs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Tests:</span>
                        <span className="font-semibold">{frameworkStats.framework_stats.total_tests_executed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Benchmarks:</span>
                        <span className="font-semibold">{frameworkStats.framework_stats.total_benchmarks_run}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Active Runs:</span>
                        <span className="font-semibold text-green-400">{frameworkStats.active_test_runs}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <h3 className="text-lg font-semibold mb-3 text-purple-400">Framework Health</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Available Suites:</span>
                        <span className="font-semibold">{frameworkStats.total_test_suites}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Framework Status:</span>
                        <span className="font-semibold text-green-400">Healthy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">API Response:</span>
                        <span className="font-semibold text-green-400">Normal</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  Loading framework statistics...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}