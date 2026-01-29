/**
 * ACCURACY ENHANCEMENT TEST PAGE - 95% ACCURACY VALIDATION
 * 
 * Test interface for the accuracy enhancement system to validate:
 * - 95% accuracy target achievement
 * - Component performance and health
 * - Enhancement pipeline effectiveness
 * - Comprehensive prediction quality
 */

'use client';

import { useState } from 'react';

interface TestResult {
  baseline_score: number;
  enhanced_score: number;
  accuracy_improvement: number;
  final_confidence: number;
  meets_95_percent_target: boolean;
  estimated_accuracy: number;
  component_results: Array<{
    component: string;
    success: boolean;
    accuracy_contribution: number;
    processing_time_ms: number;
  }>;
  enhancement_breakdown: {
    ensemble_fusion: number;
    trend_awareness: number;
    content_analysis: number;
    feedback_learning: number;
    platform_optimization: number;
  };
  enhanced_recommendations: string[];
  accuracy_insights: string[];
  processing_time_ms: number;
  prediction_id: string;
}

interface SystemStatus {
  accuracy_enhancement_system: {
    status: string;
    target_accuracy: string;
    current_performance: string;
    target_achievement_rate: string;
    total_enhancements: number;
    accuracy_improvement: string;
  };
  enhancement_components: Record<string, {
    target_contribution: string;
    status: string;
  }>;
  pipeline_performance: {
    baseline_accuracy: number;
    target_accuracy: number;
    current_performance: number;
    improvement_needed: number;
  };
}

export default function AccuracyEnhancementTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [testInput, setTestInput] = useState({
    content: "Secret fitness tip that changed my life - this simple technique helped me lose 30 pounds in 3 months",
    hashtags: ["fitness", "transformation", "viral", "foryou"],
    platform: "tiktok" as const,
    creator_followers: 50000,
    niche: "fitness",
    video_length: 30,
    visual_quality: 85,
    audio_quality: 90
  });
  
  const testCases = [
    {
      name: "Fitness Transformation",
      content: "Secret fitness tip that changed my life - this simple technique helped me lose 30 pounds in 3 months",
      hashtags: ["fitness", "transformation", "viral", "foryou"],
      platform: "tiktok" as const,
      niche: "fitness",
      creator_followers: 50000
    },
    {
      name: "Business Growth Hack",
      content: "I grew my business from $0 to $100k in 6 months using this one strategy that nobody talks about",
      hashtags: ["business", "entrepreneur", "growth", "success"],
      platform: "instagram" as const,
      niche: "business",
      creator_followers: 100000
    },
    {
      name: "Productivity Secret",
      content: "How I wake up at 5 AM every day without struggle - the mindset shift that changed everything",
      hashtags: ["productivity", "motivation", "5amclub", "success"],
      platform: "youtube" as const,
      niche: "self-improvement",
      creator_followers: 200000
    },
    {
      name: "Finance Education",
      content: "Why 99% of people will never be rich - the financial mistakes everyone makes",
      hashtags: ["finance", "investing", "wealth", "money"],
      platform: "tiktok" as const,
      niche: "finance",
      creator_followers: 75000
    }
  ];
  
  const runAccuracyTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/viral-prediction/accuracy-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...testInput,
          upload_time: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setTestResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/viral-prediction/accuracy-enhanced');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const status = await response.json();
      setSystemStatus(status);
      
    } catch (err) {
      console.error('Failed to load system status:', err);
    }
  };
  
  const runTestCase = (testCase: typeof testCases[0]) => {
    setTestInput({
      ...testInput,
      content: testCase.content,
      hashtags: testCase.hashtags,
      platform: testCase.platform,
      niche: testCase.niche,
      creator_followers: testCase.creator_followers
    });
  };
  
  // Load system status on component mount
  useState(() => {
    loadSystemStatus();
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎯 Accuracy Enhancement Test Lab
          </h1>
          <p className="text-xl text-gray-300">
            Validate 95% Accuracy Target Achievement
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-green-400 font-bold">Target: 95% Accuracy</span>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <span className="text-blue-400 font-bold">5 Enhancement Components</span>
            </div>
          </div>
        </div>
        
        {/* System Status */}
        {systemStatus && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Current Performance</div>
                <div className="text-2xl font-bold text-green-400">
                  {systemStatus.accuracy_enhancement_system.current_performance}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Target Achievement Rate</div>
                <div className="text-2xl font-bold text-blue-400">
                  {systemStatus.accuracy_enhancement_system.target_achievement_rate}
                </div>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-sm text-gray-400">Total Enhancements</div>
                <div className="text-2xl font-bold text-purple-400">
                  {systemStatus.accuracy_enhancement_system.total_enhancements}
                </div>
              </div>
            </div>
            
            {/* Component Health */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-3">Component Health</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(systemStatus.enhancement_components).map(([key, component]) => (
                  <div key={key} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-300 capitalize">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-500">{component.target_contribution}</div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      component.status === 'healthy' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {component.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Input */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Test Input</h2>
            
            {/* Quick Test Cases */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Quick Test Cases</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {testCases.map((testCase) => (
                  <button
                    key={testCase.name}
                    onClick={() => runTestCase(testCase)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg text-left transition-colors"
                  >
                    <div className="text-sm font-semibold text-white">{testCase.name}</div>
                    <div className="text-xs text-gray-400">{testCase.platform} • {testCase.niche}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content
                </label>
                <textarea
                  value={testInput.content}
                  onChange={(e) => setTestInput({...testInput, content: e.target.value})}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  rows={3}
                  placeholder="Enter your video content or script..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={testInput.platform}
                    onChange={(e) => setTestInput({...testInput, platform: e.target.value as any})}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  >
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Niche
                  </label>
                  <input
                    type="text"
                    value={testInput.niche}
                    onChange={(e) => setTestInput({...testInput, niche: e.target.value})}
                    className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                    placeholder="e.g., fitness, business"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hashtags (comma-separated)
                </label>
                <input
                  type="text"
                  value={testInput.hashtags.join(', ')}
                  onChange={(e) => setTestInput({...testInput, hashtags: e.target.value.split(',').map(h => h.trim()).filter(h => h)})}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  placeholder="fitness, viral, foryou"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Creator Followers
                </label>
                <input
                  type="number"
                  value={testInput.creator_followers}
                  onChange={(e) => setTestInput({...testInput, creator_followers: parseInt(e.target.value) || 0})}
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  placeholder="50000"
                />
              </div>
              
              <button
                onClick={runAccuracyTest}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white text-lg transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Running Enhancement Pipeline...
                  </div>
                ) : (
                  '🚀 Run Accuracy Enhancement Test'
                )}
              </button>
            </div>
          </div>
          
          {/* Test Results */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Test Results</h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <div className="text-red-400 font-bold">Error</div>
                <div className="text-red-300">{error}</div>
              </div>
            )}
            
            {testResult ? (
              <div className="space-y-6">
                {/* Accuracy Achievement */}
                <div className={`p-6 rounded-lg border-2 ${
                  testResult.meets_95_percent_target 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-yellow-500/20 border-yellow-500/50'
                }`}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      {testResult.meets_95_percent_target ? '🎉' : '📈'}
                    </div>
                    <div className="text-xl font-bold text-white">
                      {testResult.meets_95_percent_target 
                        ? '95% ACCURACY TARGET ACHIEVED!' 
                        : 'Working Towards 95% Target'
                      }
                    </div>
                    <div className="text-lg text-gray-300 mt-2">
                      Estimated Accuracy: {(testResult.estimated_accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Core Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Enhanced Score</div>
                    <div className="text-3xl font-bold text-purple-400">
                      {testResult.enhanced_score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-500">
                      +{(testResult.enhanced_score - testResult.baseline_score).toFixed(1)} from baseline
                    </div>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Confidence</div>
                    <div className="text-3xl font-bold text-green-400">
                      {(testResult.final_confidence * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      Processing: {testResult.processing_time_ms.toFixed(0)}ms
                    </div>
                  </div>
                </div>
                
                {/* Enhancement Breakdown */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Enhancement Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(testResult.enhancement_breakdown).map(([component, contribution]) => (
                      <div key={component} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <span className="text-gray-300 capitalize">
                          {component.replace(/_/g, ' ')}
                        </span>
                        <span className={`font-bold ${contribution > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          +{contribution.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Component Results */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Component Performance</h3>
                  <div className="space-y-2">
                    {testResult.component_results.map((component, index) => (
                      <div key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                        <div>
                          <span className="text-gray-300">{component.component}</span>
                          <div className="text-xs text-gray-500">{component.processing_time_ms.toFixed(0)}ms</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${component.success ? 'text-green-400' : 'text-red-400'}`}>
                            +{component.accuracy_contribution.toFixed(1)}%
                          </span>
                          <div className={`w-3 h-3 rounded-full ${component.success ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Recommendations */}
                {testResult.enhanced_recommendations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Enhanced Recommendations</h3>
                    <div className="space-y-2">
                      {testResult.enhanced_recommendations.slice(0, 5).map((rec, index) => (
                        <div key={index} className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3">
                          <div className="text-blue-300 text-sm">{rec}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Accuracy Insights */}
                {testResult.accuracy_insights.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Accuracy Insights</h3>
                    <div className="space-y-2">
                      {testResult.accuracy_insights.slice(0, 3).map((insight, index) => (
                        <div key={index} className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3">
                          <div className="text-purple-300 text-sm">{insight}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <div className="text-4xl mb-4">🧪</div>
                <div className="text-lg">
                  Run an accuracy enhancement test to see results
                </div>
                <div className="text-sm mt-2">
                  Tests the complete 5-component enhancement pipeline
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}