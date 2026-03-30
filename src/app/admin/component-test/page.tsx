'use client';

import { useState } from 'react';

const SAMPLE_TRANSCRIPTS: Record<string, string> = {
  good_viral: "Want to retire early? Here's the secret nobody talks about! Most people think it's about saving every penny, but it's really about making your money work FOR YOU! Invest in assets like stocks or real estate that generate passive income. Your money should be earning money while you sleep! The rich don't trade time for money - they build systems. Hit follow for more wealth-building tips and drop a comment with your biggest financial goal! 💰",
  
  bad_boring: "Today I want to talk about some financial concepts. First, there's saving money. Second, there's investing. Third, there's budgeting. These are important topics that everyone should know about. I hope you found this information helpful. Thank you for watching my video today.",
  
  medium_decent: "Here's a quick tip that changed my finances forever. Instead of buying coffee every day at Starbucks, I started making it at home. That's $5 a day saved, which is $150 a month, $1800 a year. Now here's where it gets interesting - put that money in an index fund earning 10% average returns, and in 10 years you'll have over $25,000. Small changes lead to big results.",
  
  hooks_strong: "STOP scrolling! This one mistake is keeping you broke and I'm going to show you exactly how to fix it in the next 60 seconds. I went from $50k in debt to a millionaire in 3 years using this exact strategy. Ready? Here it is...",
  
  no_hook: "Um, so, I wanted to make a video about, you know, money stuff. I've been thinking about it for a while and I finally decided to record this. So basically, there are some things you can do with your money I guess. Let me explain what I mean by that."
};

interface ComponentResult {
  score: number | null;
  confidence: number | null;
  success: boolean;
  isReal: boolean;
  isHardcoded: boolean;
  latency: string | null;
  insights: string[];
  features: any;
  error: string | null;
  path: string;
}

interface TestResults {
  success: boolean;
  finalScore: number;
  confidence: number;
  viralPotential: string;
  range: { low: number; high: number };
  components: Record<string, ComponentResult>;
  stats: {
    totalComponents: number;
    successfulComponents: number;
    realAnalysisComponents: number;
    hardcodedComponents: number;
    avgScore: number;
    minScore: number;
    maxScore: number;
    scoreSpread: number;
    isSuspicious: boolean;
  };
  paths: Array<{
    name: string;
    score: number | null;
    confidence: number | null;
    weight: number;
    success: boolean;
    componentCount: number;
  }>;
  warnings: string[];
  recommendations: string[];
  metadata: {
    transcriptLength: number;
    wordCount: number;
    niche: string;
    processingTime: number;
  };
}

export default function ComponentTestPage() {
  const [selectedSample, setSelectedSample] = useState<string>('good_viral');
  const [transcript, setTranscript] = useState<string>(SAMPLE_TRANSCRIPTS.good_viral);
  const [niche, setNiche] = useState<string>('personal-finance');
  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testHistory, setTestHistory] = useState<Array<{ sample: string; score: number; time: string }>>([]);

  const handleSampleChange = (sample: string) => {
    setSelectedSample(sample);
    setTranscript(SAMPLE_TRANSCRIPTS[sample]);
  };

  const testAllComponents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, niche })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(data);
      
      // Add to history
      setTestHistory(prev => [
        { sample: selectedSample, score: data.finalScore, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runAllSamples = async () => {
    setLoading(true);
    setError(null);
    
    const allResults: Array<{ sample: string; score: number }> = [];
    
    for (const [sample, text] of Object.entries(SAMPLE_TRANSCRIPTS)) {
      try {
        const response = await fetch('/api/test/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: text, niche })
        });
        
        const data = await response.json();
        allResults.push({ sample, score: data.finalScore });
        
      } catch (err) {
        allResults.push({ sample, score: -1 });
      }
    }
    
    // Show comparison
    alert(
      'Score Comparison:\n\n' +
      allResults.map(r => `${r.sample}: ${r.score}`).join('\n') +
      '\n\n' +
      'Expected:\n' +
      'good_viral: 75-95\n' +
      'bad_boring: 25-45\n' +
      'medium_decent: 50-70\n' +
      'hooks_strong: 80-95\n' +
      'no_hook: 20-40'
    );
    
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    if (score >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-500/20 border-green-500/50';
    if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/50';
    if (score >= 25) return 'bg-orange-500/20 border-orange-500/50';
    return 'bg-red-500/20 border-red-500/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Component Test Suite
          </h1>
          <p className="text-gray-400 mt-2">
            Test each Kai Orchestrator component individually to verify real analysis
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sample Selector */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Sample Transcript
            </label>
            <select
              value={selectedSample}
              onChange={(e) => handleSampleChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="good_viral">🔥 Good Viral Content</option>
              <option value="bad_boring">😴 Bad Boring Content</option>
              <option value="medium_decent">📊 Medium Decent Content</option>
              <option value="hooks_strong">🪝 Strong Hooks</option>
              <option value="no_hook">❌ No Hook</option>
            </select>
            
            <div className="mt-4 text-xs text-gray-500">
              <p className="font-semibold mb-1">Expected Scores:</p>
              <p>🔥 Good Viral: 75-95</p>
              <p>😴 Bad Boring: 25-45</p>
              <p>📊 Medium: 50-70</p>
              <p>🪝 Strong Hooks: 80-95</p>
              <p>❌ No Hook: 20-40</p>
            </div>
          </div>

          {/* Niche Selector */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Content Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="personal-finance">💰 Personal Finance</option>
              <option value="side-hustles">💼 Side Hustles</option>
              <option value="investing">📈 Investing</option>
              <option value="entrepreneurship">🚀 Entrepreneurship</option>
              <option value="real-estate">🏠 Real Estate</option>
              <option value="crypto">₿ Crypto</option>
            </select>
          </div>

          {/* Actions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col gap-4">
            <button
              onClick={testAllComponents}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Testing...
                </span>
              ) : (
                '🧪 Test Selected Sample'
              )}
            </button>
            
            <button
              onClick={runAllSamples}
              disabled={loading}
              className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 px-6 py-3 rounded-lg font-semibold transition-all duration-200 border border-gray-700"
            >
              📊 Compare All Samples
            </button>
          </div>
        </div>

        {/* Transcript Preview */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Transcript Preview ({transcript.split(/\s+/).length} words)
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-32 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-8">
            <p className="text-red-400 font-medium">❌ Error: {error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Final Score */}
              <div className={`rounded-xl p-6 border ${getScoreBg(results.finalScore)}`}>
                <p className="text-sm text-gray-400 mb-1">Final DPS Score</p>
                <p className={`text-5xl font-bold ${getScoreColor(results.finalScore)}`}>
                  {results.finalScore}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Range: {results.range.low} - {results.range.high}
                </p>
              </div>

              {/* Confidence */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Confidence</p>
                <p className="text-5xl font-bold text-blue-400">{results.confidence}%</p>
                <p className="text-sm text-gray-500 mt-2">
                  {results.viralPotential}
                </p>
              </div>

              {/* Component Health */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Component Health</p>
                <p className="text-3xl font-bold">
                  <span className="text-green-400">{results.stats.realAnalysisComponents}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-400">{results.stats.totalComponents}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {results.stats.hardcodedComponents > 0 && (
                    <span className="text-red-400">⚠️ {results.stats.hardcodedComponents} hardcoded</span>
                  )}
                  {results.stats.hardcodedComponents === 0 && (
                    <span className="text-green-400">✅ All real analysis</span>
                  )}
                </p>
              </div>

              {/* Score Spread */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <p className="text-sm text-gray-400 mb-1">Score Spread</p>
                <p className="text-3xl font-bold">
                  {results.stats.minScore} - {results.stats.maxScore}
                </p>
                <p className="text-sm mt-2">
                  {results.stats.isSuspicious ? (
                    <span className="text-red-400">⚠️ Narrow spread - suspicious</span>
                  ) : (
                    <span className="text-green-400">✅ Good differentiation</span>
                  )}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {results.warnings.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Warnings</h3>
                <ul className="space-y-1">
                  {results.warnings.map((warning, i) => (
                    <li key={i} className="text-yellow-300 text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Path Results */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Prediction Paths</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {results.paths.map((path) => (
                  <div
                    key={path.name}
                    className={`p-4 rounded-lg border ${
                      path.success ? 'bg-gray-800/50 border-gray-700' : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <p className="font-medium capitalize">{path.name.replace('_', ' ')}</p>
                    <p className={`text-2xl font-bold mt-1 ${path.score ? getScoreColor(path.score) : 'text-gray-500'}`}>
                      {path.score ?? 'N/A'}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Weight: {Math.round(path.weight * 100)}%</span>
                      <span>{path.componentCount} components</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Components */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Individual Components</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(results.components).map(([name, data]) => (
                  <div
                    key={name}
                    className={`p-4 rounded-lg border ${
                      data.isReal
                        ? 'bg-green-500/5 border-green-500/30'
                        : data.isHardcoded
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-gray-800/50 border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-sm">{name}</h4>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-700">
                        {data.path}
                      </span>
                    </div>
                    
                    <p className={`text-3xl font-bold ${
                      data.score !== null ? getScoreColor(data.score) : 'text-gray-500'
                    }`}>
                      {data.score ?? 'N/A'}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      {data.isReal && <span className="text-green-400">✅ Real</span>}
                      {data.isHardcoded && <span className="text-red-400">❌ Hardcoded</span>}
                      {!data.success && <span className="text-yellow-400">⚠️ Failed</span>}
                      {data.latency && <span className="text-gray-500">{data.latency}</span>}
                    </div>
                    
                    {data.insights && data.insights.length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        {data.insights.slice(0, 2).map((insight: string, i: number) => (
                          <p key={i} className="truncate">{insight}</p>
                        ))}
                      </div>
                    )}
                    
                    {data.error && (
                      <p className="mt-2 text-xs text-red-400 truncate">
                        Error: {data.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-400 mb-4">💡 Recommendations</h3>
                <ul className="space-y-2">
                  {results.recommendations.map((rec, i) => (
                    <li key={i} className="text-blue-300">{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Test Metadata</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Transcript:</span>
                  <span className="ml-2">{results.metadata.transcriptLength} chars</span>
                </div>
                <div>
                  <span className="text-gray-500">Words:</span>
                  <span className="ml-2">{results.metadata.wordCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Niche:</span>
                  <span className="ml-2">{results.metadata.niche}</span>
                </div>
                <div>
                  <span className="text-gray-500">Processing:</span>
                  <span className="ml-2">{results.metadata.processingTime}ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test History */}
        {testHistory.length > 0 && (
          <div className="mt-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Tests</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {testHistory.map((test, i) => (
                <div key={i} className="flex-shrink-0 bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">{test.sample}</p>
                  <p className={`text-2xl font-bold ${getScoreColor(test.score)}`}>{test.score}</p>
                  <p className="text-xs text-gray-600">{test.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}














