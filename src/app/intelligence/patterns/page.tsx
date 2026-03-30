'use client';

import React, { useState } from 'react';
import { Sparkles, Brain, Database, RefreshCw } from 'lucide-react';

export default function PatternIntelligence() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [stats, setStats] = useState({
    patternsFound: 0,
    accuracyGain: 0,
    lastRun: 'Never'
  });

  const runExtraction = async () => {
    setExtracting(true);
    try {
      // This would be a real API call in production
      // const result = await fetch('/api/patterns/extract', { method: 'POST' });
      // const data = await result.json();
      
      // Mocking the response for immediate feedback based on plan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPatterns = [
        { id: '1', niche: 'finance', type: 'Emotional Arc', dna: 'Fear -> Relief -> Solution', success: 0.92, examples: 12 },
        { id: '2', niche: 'tech', type: 'Visual Hook', dna: 'Split Screen + Fast Cuts', success: 0.88, examples: 45 },
        { id: '3', niche: 'health', type: 'Story Structure', dna: 'Personal Struggle -> Discovery -> Outcome', success: 0.95, examples: 23 },
      ];
      
      setPatterns(mockPatterns);
      setStats({
        patternsFound: 3,
        accuracyGain: 12.5,
        lastRun: new Date().toLocaleTimeString()
      });
      
    } catch (e) {
      console.error('Extraction failed', e);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              Viral Pattern Intelligence
            </h1>
            <p className="text-gray-400 mt-2">Extract and analyze viral DNA from high-performing content</p>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Accuracy Boost</div>
              <div className="text-2xl font-bold text-green-400">+{stats.accuracyGain}%</div>
            </div>
            <button 
              onClick={runExtraction} 
              disabled={extracting}
              className={`
                px-6 py-3 rounded-xl font-bold flex items-center gap-2
                ${extracting 
                  ? 'bg-purple-900/50 text-purple-200' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20'
                }
              `}
            >
              {extracting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {extracting ? 'Extracting Patterns...' : 'Run Extraction'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <Database className="w-5 h-5" />
              <span>Patterns in Library</span>
            </div>
            <div className="text-4xl font-bold">{stats.patternsFound}</div>
          </div>
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <Sparkles className="w-5 h-5" />
              <span>Avg Success Rate</span>
            </div>
            <div className="text-4xl font-bold">{(patterns.reduce((acc, p) => acc + p.success, 0) / (patterns.length || 1) * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-2 text-gray-400">
              <RefreshCw className="w-5 h-5" />
              <span>Last Extraction</span>
            </div>
            <div className="text-2xl font-bold text-gray-300">{stats.lastRun}</div>
          </div>
        </div>

        {/* Patterns Grid */}
        <h2 className="text-xl font-bold mb-6">Discovered Patterns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patterns.map(pattern => (
            <div key={pattern.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {pattern.niche}
                </span>
                <span className="text-green-400 font-bold text-sm">
                  {(pattern.success * 100).toFixed(0)}% Success
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors">{pattern.type}</h3>
              <div className="bg-black/50 p-3 rounded-lg border border-white/5 text-sm text-gray-300 mb-4 font-mono">
                {pattern.dna}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 border-t border-white/5 pt-4">
                <span>Found in {pattern.examples} videos</span>
                <span>ID: {pattern.id}</span>
              </div>
            </div>
          ))}
          
          {patterns.length === 0 && (
            <div className="col-span-full text-center py-20 bg-[#111] rounded-2xl border border-white/5 border-dashed">
              <Brain className="w-16 h-16 mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400 mb-2">No Patterns Extracted Yet</h3>
              <p className="text-gray-600">Run the extraction pipeline to discover viral DNA from your video library.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





