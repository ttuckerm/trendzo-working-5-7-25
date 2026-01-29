'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  Dna, 
  TrendingUp, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  FileJson,
  Filter
} from 'lucide-react';

// Types
interface TrainingStats {
  total: number;
  byClassification: Record<string, number>;
  byNiche: Record<string, number>;
  bySource: Record<string, number>;
  patternExtraction: {
    pending: number;
    completed: number;
    failed: number;
    not_required: number;
  };
}

interface GenomeStats {
  total: number;
  byNiche: Record<string, number>;
  byHookType: Record<string, number>;
  byStoryStructure: Record<string, number>;
  byVisualFormat: Record<string, number>;
  avgDps: number;
  avgAttributeScores: {
    tamResonance: number;
    sharability: number;
    hookStrength: number;
    formatInnovation: number;
    valueDensity: number;
    pacingRhythm: number;
    curiosityGaps: number;
    emotionalJourney: number;
    clearPayoff: number;
  };
  topViralPatterns: Array<{ pattern: string; count: number }>;
}

interface ImportResults {
  success: boolean;
  results: {
    total: number;
    imported: number;
    skipped: number;
    errors: number;
    byClassification: Record<string, number>;
    patternExtractionQueued: number;
    errorDetails: string[];
  };
  message: string;
}

// Classification colors
const classificationColors: Record<string, string> = {
  MEGA_VIRAL: 'bg-gradient-to-br from-purple-500 to-pink-500',
  VIRAL: 'bg-gradient-to-br from-green-500 to-emerald-500',
  GOOD: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  AVERAGE: 'bg-gradient-to-br from-yellow-500 to-orange-400',
  BELOW_AVERAGE: 'bg-gradient-to-br from-orange-500 to-red-400',
  POOR: 'bg-gradient-to-br from-red-500 to-rose-600'
};

const classificationLabels: Record<string, string> = {
  MEGA_VIRAL: 'Mega Viral',
  VIRAL: 'Viral',
  GOOD: 'Good',
  AVERAGE: 'Average',
  BELOW_AVERAGE: 'Below Avg',
  POOR: 'Poor'
};

// Available niches
const NICHES = [
  { value: 'personal-finance', label: 'Personal Finance' },
  { value: 'side-hustles', label: 'Side Hustles' },
  { value: 'investing', label: 'Investing' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'tech', label: 'Tech' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'business', label: 'Business' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'general', label: 'General' }
];

export default function TrainingDataPage() {
  // State
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [genomeStats, setGenomeStats] = useState<GenomeStats | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importNiche, setImportNiche] = useState('personal-finance');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const url = selectedNiche 
        ? `/api/admin/bulk-import?niche=${selectedNiche}`
        : '/api/admin/bulk-import';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [selectedNiche]);

  const fetchGenomeStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/viral-genomes/stats');
      if (res.ok) {
        const data = await res.json();
        setGenomeStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch genome stats:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchGenomeStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchGenomeStats]);

  // Handle file import
  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    setImporting(true);
    setMessage(null);
    setImportResults(null);

    try {
      const text = await importFile.text();
      let videos;
      
      try {
        videos = JSON.parse(text);
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON file. Please check the file format.' });
        setImporting(false);
        return;
      }

      const res = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videos: Array.isArray(videos) ? videos : [videos],
          niche: importNiche,
          extractPatterns: true
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Imported ${data.results.imported} videos. ${data.results.patternExtractionQueued} queued for pattern extraction.` 
        });
        setImportResults(data);
        fetchStats();
        fetchGenomeStats();
      } else {
        setMessage({ type: 'error', text: `Import failed: ${data.error}` });
      }
    } catch (error) {
      const err = error as Error;
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setImporting(false);
    }
  };

  // Handle pattern extraction
  const handleExtractPatterns = async () => {
    setExtracting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/extract-genomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: selectedNiche || undefined,
          minDps: 70,
          limit: 50
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `Processed ${data.processed} videos. ${data.processed - data.failed} successful, ${data.failed} failed.` 
        });
        fetchStats();
        fetchGenomeStats();
      } else {
        setMessage({ type: 'error', text: `Extraction failed: ${data.error}` });
      }
    } catch (error) {
      const err = error as Error;
      setMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setExtracting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-gray-400">Loading training data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Training Data Pipeline
          </h1>
        </div>
        <p className="text-gray-400">
          Import videos from Apify, calculate DPS scores, and extract viral patterns
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-900/30 border border-green-700/50 text-green-300' 
            : message.type === 'error'
            ? 'bg-red-900/30 border border-red-700/50 text-red-300'
            : 'bg-blue-900/30 border border-blue-700/50 text-blue-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Clock className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Import Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Import from Apify</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* File Input */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <FileJson className="w-4 h-4 inline mr-1" />
              Apify Export (JSON)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-sm
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:bg-purple-600 file:text-white file:cursor-pointer
                       hover:file:bg-purple-700 transition-colors"
            />
          </div>
          
          {/* Niche Select */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Content Niche
            </label>
            <select
              value={importNiche}
              onChange={(e) => setImportNiche(e.target.value)}
              className="w-full p-3 bg-gray-800/50 rounded-lg border border-gray-700 text-white"
            >
              {NICHES.map(niche => (
                <option key={niche.value} value={niche.value}>
                  {niche.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Import Button */}
          <div className="flex items-end">
            <button
              onClick={handleImport}
              disabled={importing || !importFile}
              className="w-full p-3 bg-gradient-to-r from-blue-600 to-purple-600 
                       hover:from-blue-700 hover:to-purple-700 
                       disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                       rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Videos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Import Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total:</span>{' '}
                <span className="text-white font-medium">{importResults.results.total}</span>
              </div>
              <div>
                <span className="text-gray-500">Imported:</span>{' '}
                <span className="text-green-400 font-medium">{importResults.results.imported}</span>
              </div>
              <div>
                <span className="text-gray-500">Errors:</span>{' '}
                <span className="text-red-400 font-medium">{importResults.results.errors}</span>
              </div>
              <div>
                <span className="text-gray-500">Pattern Queue:</span>{' '}
                <span className="text-purple-400 font-medium">{importResults.results.patternExtractionQueued}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-blue-400" />
            <p className="text-gray-400 text-sm">Total Videos</p>
          </div>
          <p className="text-4xl font-bold">{stats?.total?.toLocaleString() || 0}</p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Dna className="w-5 h-5 text-purple-400" />
            <p className="text-gray-400 text-sm">Viral Genomes</p>
          </div>
          <p className="text-4xl font-bold text-purple-400">{genomeStats?.total?.toLocaleString() || 0}</p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <p className="text-gray-400 text-sm">Pending Extraction</p>
          </div>
          <p className="text-4xl font-bold text-yellow-400">{stats?.patternExtraction?.pending || 0}</p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <p className="text-gray-400 text-sm">Avg DPS</p>
          </div>
          <p className="text-4xl font-bold text-green-400">{genomeStats?.avgDps || 0}</p>
        </div>
      </div>

      {/* Pattern Extraction Control */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-semibold">Pattern Extraction</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Extract 7 Idea Legos and 9 Attributes from high-performing videos (DPS 70+)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="p-2 bg-gray-800/50 rounded-lg border border-gray-700 text-white text-sm"
            >
              <option value="">All Niches</option>
              {NICHES.map(niche => (
                <option key={niche.value} value={niche.value}>
                  {niche.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={handleExtractPatterns}
              disabled={extracting || (stats?.patternExtraction?.pending || 0) === 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 
                       hover:from-purple-700 hover:to-pink-700 
                       disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed
                       rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {extracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Dna className="w-4 h-4" />
                  Extract ({stats?.patternExtraction?.pending || 0})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Distribution by Classification */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Distribution by Performance</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {['MEGA_VIRAL', 'VIRAL', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR'].map((classification) => {
            const count = stats?.byClassification?.[classification] || 0;
            const total = stats?.total || 1;
            const percentage = ((count / total) * 100).toFixed(1);
            
            return (
              <div key={classification} className="text-center">
                <div className={`${classificationColors[classification]} rounded-xl p-4 mb-2 
                                transform hover:scale-105 transition-transform cursor-default`}>
                  <span className="text-3xl font-bold">{count}</span>
                  <span className="text-sm opacity-75 ml-1">({percentage}%)</span>
                </div>
                <p className="text-sm text-gray-400">{classificationLabels[classification]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Videos by Niche */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Videos by Niche</h2>
          <div className="space-y-3">
            {Object.entries(stats?.byNiche || {})
              .sort((a, b) => b[1] - a[1])
              .map(([niche, count]) => {
                const total = stats?.total || 1;
                const percentage = (count / total) * 100;
                
                return (
                  <div key={niche}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-300 capitalize">{niche.replace(/-/g, ' ')}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(stats?.byNiche || {}).length === 0 && (
              <p className="text-gray-500 text-center py-4">No videos imported yet</p>
            )}
          </div>
        </div>
        
        {/* Viral Patterns */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Top Viral Patterns</h2>
          <div className="space-y-3">
            {genomeStats?.topViralPatterns?.slice(0, 8).map(({ pattern, count }, index) => (
              <div key={pattern} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                               ${index < 3 ? 'bg-purple-600' : 'bg-gray-700'}`}>
                  {index + 1}
                </span>
                <span className="text-gray-300 flex-1">{pattern}</span>
                <span className="font-semibold text-purple-400">{count}</span>
              </div>
            ))}
            {(genomeStats?.topViralPatterns?.length || 0) === 0 && (
              <p className="text-gray-500 text-center py-4">No patterns extracted yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Nine Attributes Average Scores */}
      {genomeStats && genomeStats.total > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Average Nine Attributes Scores</h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
            {Object.entries(genomeStats.avgAttributeScores || {}).map(([attr, score]) => {
              const label = attr
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              
              return (
                <div key={attr} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-700"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${(score as number / 10) * 176} 176`}
                        className="text-purple-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                      {(score as number).toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-tight">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}



