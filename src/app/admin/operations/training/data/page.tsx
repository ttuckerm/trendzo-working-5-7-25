'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  RefreshCw, 
  Play, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileText,
  Zap,
  Download,
  Settings,
  Trash2,
  ShieldAlert
} from 'lucide-react';

interface TrainingStats {
  training: {
    total: number;
    byTier: Record<string, number>;
    bySplit: Record<string, number>;
    avgQuality: number;
    avgCoverage: number;
    withTranscript: number;
    lastUpdated: string | null;
  };
  source: {
    total: number;
    withTranscript: number;
    withDPS: number;
    byClassification: Record<string, number>;
    alreadyProcessed: number;
    readyForProcessing: number;
  };
}

interface PopulationProgress {
  stage: string;
  current: number;
  total: number;
  isRunning: boolean;
}

export default function TrainingDataPage() {
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [progress, setProgress] = useState<PopulationProgress | null>(null);
  const [result, setResult] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/training/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePopulateTrainingData = async () => {
    setPopulating(true);
    setResult(null);
    setProgress({ stage: 'Starting...', current: 0, total: 100, isRunning: true });

    try {
      const response = await fetch('/api/training/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minQualityScore: 50,
          dataSplit: 'auto'
        })
      });
      
      const data = await response.json();
      setResult(data);
      setProgress(null);
      await fetchStats();
    } catch (error) {
      console.error('Population failed:', error);
      setResult({ success: false, error: 'Pipeline failed' });
    }
    
    setPopulating(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/training/export?format=${exportFormat}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-data.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleResetCleanFeatures = async () => {
    setShowResetConfirm(false);
    setResetting(true);
    setResetResult(null);
    setResult(null);
    setProgress({ stage: 'Clearing existing training data...', current: 10, total: 100, isRunning: true });

    try {
      const response = await fetch('/api/training/reset-clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      setResetResult(data);
      setProgress(null);
      await fetchStats();
    } catch (error) {
      console.error('Reset failed:', error);
      setResetResult({ success: false, error: 'Reset operation failed' });
    }
    
    setResetting(false);
  };

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'mega-viral': 'bg-purple-500',
      'viral': 'bg-green-500',
      'above-average': 'bg-blue-500',
      'average': 'bg-gray-500',
      'below-average': 'bg-orange-500',
      'poor': 'bg-red-500'
    };
    return colors[tier] || 'bg-gray-400';
  };

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      'mega-viral': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'viral': 'bg-green-500/20 text-green-400 border-green-500/50',
      'above-average': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'average': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
      'below-average': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'poor': 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return colors[tier] || 'bg-gray-500/20 text-gray-400';
  };

  const calculateDistributionHealth = () => {
    if (!stats?.training?.byTier) return 0;
    
    const viral = (stats.training.byTier['mega-viral'] || 0) + (stats.training.byTier['viral'] || 0);
    const total = stats.training.total;
    
    if (total === 0) return 0;
    
    const viralPercent = (viral / total) * 100;
    
    // Ideal: 15-25% viral content
    if (viralPercent >= 15 && viralPercent <= 25) return 100;
    if (viralPercent >= 10 && viralPercent < 15) return 75;
    if (viralPercent >= 5 && viralPercent < 10) return 50;
    return 25;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Data Manager</h1>
          <p className="text-gray-400">Prepare and validate data for model training</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <select 
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
              className="bg-gray-700 border-gray-600 text-white text-sm rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <Button 
              variant="outline" 
              onClick={handleExport}
              disabled={!stats?.training?.total}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handlePopulateTrainingData}
            disabled={populating || resetting || (stats?.source?.readyForProcessing === 0)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {populating ? 'Processing...' : 'Prepare Training Data'}
          </Button>
          <Button 
            onClick={() => setShowResetConfirm(true)}
            disabled={populating || resetting || !stats?.source?.total}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {resetting ? 'Resetting...' : 'Reset with Clean Features'}
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gray-800 border-orange-500/50 w-[500px] max-w-[90vw]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                Reset Training Data with Clean Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-orange-900/30 border border-orange-500/50">
                <p className="text-orange-300 text-sm">
                  <strong>This will:</strong>
                </p>
                <ul className="text-orange-300 text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>Delete all {stats?.training?.total || 0} existing training samples</li>
                  <li>Re-extract features from {stats?.source?.total || 0} scraped videos</li>
                  <li><strong>EXCLUDE</strong> engagement metrics (views, likes, shares)</li>
                  <li>Keep DPS score only as the training TARGET, not as input</li>
                </ul>
              </div>
              <p className="text-gray-400 text-sm">
                This fixes the data leakage issue where the model was trained with metrics it shouldn't see at prediction time.
              </p>
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleResetCleanFeatures}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Yes, Reset and Re-extract
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress Banner */}
      {populating && progress && (
        <Card className="bg-blue-900/30 border-blue-500/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-300 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                {progress.stage}
              </span>
              <span className="text-blue-300">{progress.current}/{progress.total}</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Result Banner */}
      {result && (
        <Card className={`${result.success ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <div className="flex-1">
                <p className={result.success ? 'text-green-300' : 'text-red-300'}>
                  {result.success 
                    ? `Successfully processed ${result.result?.processed ?? 0} videos. Inserted: ${result.result?.inserted ?? 0}, Skipped: ${result.result?.skipped ?? 0}, Failed: ${result.result?.failed ?? 0}`
                    : `Processing failed: ${result.error || 'Unknown error'}`
                  }
                </p>
                {result.success && result.result?.distribution && (
                  <div className="flex gap-2 mt-2">
                    {Object.entries(result.result.distribution).map(([tier, count]) => (
                      <Badge key={tier} className={getTierBadgeColor(tier)}>
                        {tier}: {count as number}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setResult(null)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reset Result Banner */}
      {resetResult && (
        <Card className={`${resetResult.success ? 'bg-green-900/30 border-green-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {resetResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <div className="flex-1">
                <p className={resetResult.success ? 'text-green-300' : 'text-red-300'}>
                  {resetResult.success 
                    ? `✅ Clean feature extraction complete! Processed: ${resetResult.stats?.processed || 0}, Inserted: ${resetResult.stats?.inserted || 0}, Skipped: ${resetResult.stats?.skipped || 0}`
                    : `Reset failed: ${resetResult.error || 'Unknown error'}`
                  }
                </p>
                {resetResult.success && (
                  <p className="text-green-400/70 text-sm mt-1">
                    Features now exclude engagement metrics. Ready to retrain XGBoost model.
                  </p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setResetResult(null)}
                className="text-gray-400"
              >
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.source?.total || 0}</p>
                <p className="text-sm text-gray-400">Source Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.source?.withTranscript || 0}</p>
                <p className="text-sm text-gray-400">With Transcript</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.source?.readyForProcessing || 0}</p>
                <p className="text-sm text-gray-400">Ready to Process</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.training?.total || 0}</p>
                <p className="text-sm text-gray-400">Training Samples</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Health */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Training Data Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Performance Tier */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">By Performance Tier</h3>
              <div className="space-y-3">
                {(() => {
                  // Get all unique tiers from data, maintaining a logical order
                  const tierOrder = ['mega-viral', 'viral', 'above-average', 'average', 'below-average', 'poor'];
                  const actualTiers = Object.keys(stats?.training?.byTier || {});
                  const allTiers = [...new Set([...tierOrder.filter(t => actualTiers.includes(t)), ...actualTiers])];
                  
                  return allTiers.map(tier => {
                    const count = stats?.training?.byTier[tier] || 0;
                    const total = stats?.training?.total || 1;
                    const percent = (count / total) * 100;
                    
                    return (
                      <div key={tier} className="flex items-center gap-3">
                        <div className="w-28 text-sm text-gray-300 capitalize">
                          {tier.replace(/-/g, ' ')}
                        </div>
                        <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getTierColor(tier)} transition-all`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="w-24 text-right text-sm text-gray-400">
                          {count} ({percent.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {/* Distribution Health Indicator */}
              <div className="mt-4 p-3 rounded-lg bg-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Distribution Health</span>
                  <Badge className={
                    calculateDistributionHealth() >= 75 
                      ? 'bg-green-500/20 text-green-400' 
                      : calculateDistributionHealth() >= 50
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                  }>
                    {calculateDistributionHealth()}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {calculateDistributionHealth() >= 75 
                    ? '✓ Good balance of viral and normal content'
                    : calculateDistributionHealth() >= 50
                      ? '⚠ Moderate balance - consider adding more viral content'
                      : '✕ Need more viral content for balanced training'
                  }
                </p>
              </div>
            </div>

            {/* By Data Split */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">By Data Split</h3>
              <div className="space-y-3">
                {[
                  { split: 'train', target: 70, color: 'bg-blue-500' },
                  { split: 'validation', target: 15, color: 'bg-purple-500' },
                  { split: 'test', target: 15, color: 'bg-pink-500' }
                ].map(({ split, target, color }) => {
                  const count = stats?.training?.bySplit[split] || 0;
                  const total = stats?.training?.total || 1;
                  const percent = (count / total) * 100;
                  
                  return (
                    <div key={split} className="flex items-center gap-3">
                      <div className="w-28 text-sm text-gray-300 capitalize">{split}</div>
                      <div className="flex-1 h-6 bg-gray-700 rounded-full overflow-hidden relative">
                        <div 
                          className={`h-full ${color} transition-all`}
                          style={{ width: `${percent}%` }}
                        />
                        {/* Target indicator */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                          style={{ left: `${target}%` }}
                        />
                      </div>
                      <div className="w-28 text-right text-sm">
                        <span className="text-white">{count}</span>
                        <span className="text-gray-500 ml-1">
                          ({percent.toFixed(0)}% / {target}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quality Metrics */}
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-gray-400">Quality Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-700/50">
                    <p className="text-lg font-bold text-white">
                      {(stats?.training?.avgQuality || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">Avg Quality Score</p>
                    <Progress 
                      value={stats?.training?.avgQuality || 0} 
                      className="h-1 mt-2"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-gray-700/50">
                    <p className="text-lg font-bold text-white">
                      {(stats?.training?.avgCoverage || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-400">Avg Feature Coverage</p>
                    <Progress 
                      value={stats?.training?.avgCoverage || 0} 
                      className="h-1 mt-2"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">With Transcript Features</p>
                    <p className="text-white font-medium">
                      {stats?.training?.withTranscript || 0} / {stats?.training?.total || 0}
                      <span className="text-gray-500 ml-2">
                        ({stats?.training?.total ? ((stats.training.withTranscript / stats.training.total) * 100).toFixed(0) : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Classification */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Source Video Classification
            </span>
            <span className="text-sm font-normal text-gray-400">
              {stats?.source?.alreadyProcessed || 0} already processed
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {(() => {
              const tierOrder = ['mega-viral', 'viral', 'above-average', 'average', 'below-average', 'poor'];
              const actualTiers = Object.keys(stats?.source?.byClassification || {});
              const allTiers = [...new Set([...tierOrder.filter(t => actualTiers.includes(t)), ...actualTiers])];
              
              return allTiers.map(tier => {
                const count = stats?.source?.byClassification[tier] || 0;
                return (
                  <div key={tier} className="p-3 rounded-lg bg-gray-700/50 text-center">
                    <p className="text-xl font-bold text-white">{count}</p>
                    <p className="text-xs text-gray-400 capitalize mt-1">{tier.replace(/-/g, ' ')}</p>
                    <div className={`h-1 ${getTierColor(tier)} rounded-full mt-2`} />
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {stats?.training?.lastUpdated && (
        <p className="text-sm text-gray-500 text-center">
          Training data last updated: {new Date(stats.training.lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}



