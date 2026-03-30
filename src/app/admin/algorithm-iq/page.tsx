'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Component configuration types
interface ComponentConfig {
  id: string;
  component_id: string;
  component_name: string;
  component_type: string;
  enabled: boolean;
  status: 'active' | 'disabled' | 'needs_calibration' | 'deprecated';
  disabled_reason: string | null;
  disabled_at: string | null;
  avg_error: number | null;
  avg_time_ms: number | null;
  reliability_score: number | null;
  sample_count: number;
  last_accuracy_test: string | null;
  display_order: number;
  description: string | null;
}

interface ComponentConfigSummary {
  total: number;
  enabled: number;
  disabled: number;
  needsCalibration: number;
  newComponentsDetected: number;
}

interface PerformanceData {
  currentIq: number;
  iqChange: number;
  streakDays: number;
  overallAccuracy: number;
  avgError: number;
  totalPredictions: number;
  accuratePredictions: number;
  iqTrend: Array<{ date: string; iq: number; accuracy: number; predictions: number }>;
  componentAccuracies: Array<{
    id: string;
    name: string;
    type: string;
    accuracy: number;
    reliability: number;
    avgError: number;
    predictions: number;
  }>;
  nicheAccuracies: Array<{
    niche: string;
    accuracy: number;
    avgError: number;
    count: number;
  }>;
  timeframeAccuracies: Record<string, number>;
  learningInsights: string[];
  lastUpdated: string;
}

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: number | null;
  impactDirection: string;
  component: string | null;
  niche: string | null;
  isAddressed: boolean;
  createdAt: string;
  icon: string;
  color: string;
}

interface AuditData {
  worstPredictions: Array<{
    video_id: string;
    predicted_dps: number;
    actual_dps: number;
    error: number;
    niche: string | null;
    created_at: string;
  }>;
  failurePatterns: Array<{
    pattern: string;
    description: string;
    occurrences: number;
    avgError: number;
    recommendation: string;
  }>;
  componentIssues: Array<{
    componentId: string;
    componentName: string;
    issue: string;
    avgError: number;
    recommendation: string;
  }>;
  autoAdjustments: Array<{
    type: string;
    description: string;
    applied: boolean;
    impact: string;
  }>;
}

export default function AlgorithmIQDashboard() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'niches' | 'audit' | 'active-components'>('overview');
  
  // Component configuration state
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>([]);
  const [configSummary, setConfigSummary] = useState<ComponentConfigSummary | null>(null);
  const [newComponents, setNewComponents] = useState<any[]>([]);
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [perfRes, insightsRes] = await Promise.all([
        fetch('/api/algorithm-iq/performance', { cache: 'no-store' }),
        fetch('/api/algorithm-iq/insights?limit=10', { cache: 'no-store' })
      ]);

      const perfData = await perfRes.json();
      const insightsData = await insightsRes.json();

      if (perfData.success) setPerformance(perfData.data);
      if (insightsData.success) setInsights(insightsData.data.insights);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load component configurations
  const loadComponentConfigs = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin/component-config', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        setComponentConfigs(data.components || []);
        setConfigSummary(data.summary || null);
        setNewComponents(data.newComponents || []);
      }
    } catch (err) {
      console.error('Failed to load component configs:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Toggle component enabled/disabled
  const toggleComponent = async (componentId: string, enabled: boolean, reason?: string) => {
    setSavingConfig(componentId);
    try {
      const res = await fetch('/api/admin/component-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          component_id: componentId, 
          enabled,
          disabled_reason: reason 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setComponentConfigs(prev => prev.map(c => 
          c.component_id === componentId 
            ? { ...c, enabled, status: enabled ? 'active' : 'disabled' as const, disabled_reason: enabled ? null : reason || null }
            : c
        ));
        // Update summary
        if (configSummary) {
          setConfigSummary({
            ...configSummary,
            enabled: enabled ? configSummary.enabled + 1 : configSummary.enabled - 1,
            disabled: enabled ? configSummary.disabled - 1 : configSummary.disabled + 1
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle component:', err);
    } finally {
      setSavingConfig(null);
    }
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    if (!confirm('Reset all components to default configuration? This will enable 14 components and disable 8.')) return;
    
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin/component-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_defaults' })
      });
      const data = await res.json();
      
      if (data.success) {
        await loadComponentConfigs();
      }
    } catch (err) {
      console.error('Failed to reset defaults:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  // Sync new components
  const syncNewComponents = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/admin/component-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });
      await loadComponentConfigs();
    } catch (err) {
      console.error('Failed to sync components:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const runAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/algorithm-iq/self-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 7, limit: 5 })
      });
      const data = await res.json();
      if (data.success) {
        setAuditData(data.data);
        // Reload insights after audit
        loadData();
      }
    } catch (err) {
      console.error('Failed to run audit:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const refreshPerformance = async () => {
    try {
      await fetch('/api/algorithm-iq/performance', { method: 'POST' });
      loadData();
    } catch (err) {
      console.error('Failed to refresh performance:', err);
    }
  };

  useEffect(() => {
    loadData();
    loadComponentConfigs();
  }, [loadData, loadComponentConfigs]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading Algorithm IQ Dashboard...</p>
        </div>
      </div>
    );
  }

  const iq = performance?.currentIq || 100;
  const iqColor = iq >= 120 ? 'text-green-500' : iq >= 100 ? 'text-blue-500' : iq >= 80 ? 'text-yellow-500' : 'text-red-500';
  const accuracyPct = ((performance?.overallAccuracy || 0) * 100).toFixed(1);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Algorithm IQ Dashboard</h1>
          <p className="text-gray-400 text-sm">Track prediction accuracy and algorithm improvement</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshPerformance}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Refresh
          </button>
          <button 
            onClick={runAudit}
            disabled={auditLoading}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50"
          >
            {auditLoading ? 'Running...' : 'Run Self-Audit'}
          </button>
        </div>
      </div>

      {/* IQ Score Hero Card */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Algorithm IQ</p>
            <div className="flex items-baseline gap-4">
              <span className={`text-7xl font-bold ${iqColor}`}>{iq}</span>
              {performance?.iqChange !== 0 && (
                <span className={`text-xl ${(performance?.iqChange || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {(performance?.iqChange || 0) > 0 ? '↑' : '↓'} {Math.abs(performance?.iqChange || 0)}
                </span>
              )}
            </div>
            <p className="text-gray-400 mt-2">
              {performance?.streakDays || 0} day accuracy streak
            </p>
          </div>
          <div className="text-right">
            <div className="bg-gray-700/50 rounded-lg px-6 py-4">
              <p className="text-gray-400 text-sm">Overall Accuracy</p>
              <p className="text-4xl font-bold text-white">{accuracyPct}%</p>
              <p className="text-gray-500 text-sm">±10 DPS threshold</p>
            </div>
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Total Predictions</p>
            <p className="text-2xl font-semibold text-white">{performance?.totalPredictions || 0}</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Accurate</p>
            <p className="text-2xl font-semibold text-green-400">{performance?.accuratePredictions || 0}</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Avg Error</p>
            <p className="text-2xl font-semibold text-white">{(performance?.avgError || 0).toFixed(1)} DPS</p>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <p className="text-gray-400 text-xs uppercase">Last Updated</p>
            <p className="text-sm font-semibold text-white">
              {performance?.lastUpdated ? new Date(performance.lastUpdated).toLocaleTimeString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['overview', 'components', 'niches', 'audit', 'active-components'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'active-components' ? 'Active Components' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'active-components' && (configSummary?.needsCalibration || 0) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-black text-xs rounded-full flex items-center justify-center">
                {configSummary?.needsCalibration}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* IQ Trend Chart */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">30-Day IQ Trend</h3>
            <div className="h-48 flex items-end gap-1">
              {(performance?.iqTrend || []).slice(-30).map((day, i) => {
                const height = Math.max(10, ((day.iq - 50) / 150) * 100);
                const color = day.iq >= 120 ? 'bg-green-500' : day.iq >= 100 ? 'bg-blue-500' : day.iq >= 80 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div 
                    key={i} 
                    className="flex-1 group relative"
                    title={`${day.date}: IQ ${day.iq}, ${(day.accuracy * 100).toFixed(1)}% accurate`}
                  >
                    <div 
                      className={`${color} rounded-t transition-all hover:opacity-80`}
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg whitespace-nowrap z-10">
                      <div className="font-semibold">IQ: {day.iq}</div>
                      <div>Accuracy: {(day.accuracy * 100).toFixed(1)}%</div>
                      <div className="text-gray-400">{day.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Timeframe Accuracy */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Accuracy by Timeframe</h3>
            <div className="space-y-4">
              {Object.entries(performance?.timeframeAccuracies || {}).map(([timeframe, accuracy]) => (
                <div key={timeframe} className="flex items-center gap-4">
                  <span className="text-gray-400 w-12">{timeframe}</span>
                  <div className="flex-1 bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all"
                      style={{ width: `${(accuracy as number) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-mono w-16 text-right">
                    {((accuracy as number) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Learning Insights</h3>
            {insights.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No insights yet. Run a self-audit to generate insights.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {insights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      insight.type === 'deficiency' ? 'bg-red-900/20 border border-red-800/30' :
                      insight.type === 'improvement' ? 'bg-green-900/20 border border-green-800/30' :
                      insight.type === 'learned' ? 'bg-blue-900/20 border border-blue-800/30' :
                      'bg-yellow-900/20 border border-yellow-800/30'
                    }`}
                  >
                    <span className="text-xl">{insight.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{insight.title}</p>
                      <p className="text-gray-400 text-sm">{insight.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(insight.createdAt).toLocaleDateString()}
                        {insight.niche && ` • ${insight.niche}`}
                        {insight.component && ` • ${insight.component}`}
                      </p>
                    </div>
                    {insight.impact !== null && (
                      <span className={`text-sm font-mono ${
                        insight.impactDirection === 'positive' ? 'text-green-400' : 
                        insight.impactDirection === 'negative' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {insight.impact > 0 ? '+' : ''}{insight.impact?.toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'components' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Component Accuracy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700">
                  <th className="pb-3">Component</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Accuracy</th>
                  <th className="pb-3 text-right">Reliability</th>
                  <th className="pb-3 text-right">Avg Error</th>
                  <th className="pb-3 text-right">Predictions</th>
                </tr>
              </thead>
              <tbody>
                {(performance?.componentAccuracies || []).map((comp) => (
                  <tr key={comp.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-3 text-white font-medium">{comp.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        comp.type === 'quantitative' ? 'bg-blue-900 text-blue-300' :
                        comp.type === 'qualitative' ? 'bg-purple-900 text-purple-300' :
                        comp.type === 'pattern' ? 'bg-green-900 text-green-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {comp.type}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={comp.accuracy >= 0.8 ? 'text-green-400' : comp.accuracy >= 0.6 ? 'text-yellow-400' : 'text-red-400'}>
                        {(comp.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${comp.reliability * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-300 w-10">{(comp.reliability * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-300">{comp.avgError.toFixed(1)}</td>
                    <td className="py-3 text-right text-gray-400">{comp.predictions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'niches' && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Accuracy by Niche</h3>
          {(performance?.nicheAccuracies?.length || 0) === 0 ? (
            <p className="text-gray-500 text-center py-8">No niche data available yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(performance?.nicheAccuracies || []).map((niche) => {
                const accPct = niche.accuracy * 100;
                const bgColor = accPct >= 85 ? 'from-green-900/50' : accPct >= 70 ? 'from-blue-900/50' : accPct >= 50 ? 'from-yellow-900/50' : 'from-red-900/50';
                return (
                  <div 
                    key={niche.niche}
                    className={`bg-gradient-to-br ${bgColor} to-gray-800 rounded-lg p-4 border border-gray-700`}
                  >
                    <p className="text-white font-medium capitalize">{niche.niche}</p>
                    <p className="text-3xl font-bold text-white mt-2">{accPct.toFixed(0)}%</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Avg Error: {niche.avgError.toFixed(1)}</span>
                      <span>{niche.count} predictions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-6">
          {!auditData ? (
            <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
              <p className="text-gray-400 mb-4">No audit data available. Run a self-audit to analyze algorithm performance.</p>
              <button 
                onClick={runAudit}
                disabled={auditLoading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50"
              >
                {auditLoading ? 'Running Audit...' : 'Run Self-Audit Now'}
              </button>
            </div>
          ) : (
            <>
              {/* Worst Predictions */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Worst Predictions (Last 7 Days)</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-gray-700">
                      <th className="pb-3">Video ID</th>
                      <th className="pb-3">Niche</th>
                      <th className="pb-3 text-right">Predicted</th>
                      <th className="pb-3 text-right">Actual</th>
                      <th className="pb-3 text-right">Error</th>
                      <th className="pb-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.worstPredictions.map((pred, i) => (
                      <tr key={i} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-mono text-xs">{pred.video_id.substring(0, 12)}...</td>
                        <td className="py-3 text-gray-300">{pred.niche || 'Unknown'}</td>
                        <td className="py-3 text-right text-gray-300">{pred.predicted_dps.toFixed(1)}</td>
                        <td className="py-3 text-right text-gray-300">{pred.actual_dps.toFixed(1)}</td>
                        <td className="py-3 text-right">
                          <span className={pred.error > 0 ? 'text-red-400' : 'text-blue-400'}>
                            {pred.error > 0 ? '+' : ''}{pred.error.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 text-right text-gray-500 text-xs">
                          {new Date(pred.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Failure Patterns */}
              {auditData.failurePatterns.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Detected Failure Patterns</h3>
                  <div className="space-y-4">
                    {auditData.failurePatterns.map((pattern, i) => (
                      <div key={i} className="bg-red-900/20 border border-red-800/30 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-medium">{pattern.description}</p>
                            <p className="text-gray-400 text-sm mt-1">
                              {pattern.occurrences} occurrences • Avg error: {pattern.avgError.toFixed(1)} DPS
                            </p>
                          </div>
                          <span className="px-2 py-1 bg-red-900/50 text-red-300 text-xs rounded">
                            {pattern.pattern}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-800 rounded text-sm">
                          <span className="text-gray-400">Recommendation: </span>
                          <span className="text-green-400">{pattern.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Component Issues */}
              {auditData.componentIssues.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Component Issues</h3>
                  <div className="space-y-4">
                    {auditData.componentIssues.map((issue, i) => (
                      <div key={i} className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-medium">{issue.componentName}</p>
                            <p className="text-yellow-400 text-sm">{issue.issue}</p>
                          </div>
                          <span className="text-gray-400 text-sm">
                            Avg Error: {issue.avgError.toFixed(1)}
                          </span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-800 rounded text-sm">
                          <span className="text-gray-400">Recommendation: </span>
                          <span className="text-green-400">{issue.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Adjustments */}
              {auditData.autoAdjustments.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Suggested Auto-Adjustments</h3>
                  <div className="space-y-3">
                    {auditData.autoAdjustments.map((adj, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                        <div>
                          <p className="text-white">{adj.description}</p>
                          <p className="text-gray-400 text-sm">{adj.impact}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm ${
                          adj.applied ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'
                        }`}>
                          {adj.applied ? 'Applied' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Active Components Tab */}
      {activeTab === 'active-components' && (
        <div className="space-y-6">
          {/* Summary Header */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active Components</h2>
                <p className="text-gray-400 text-sm">Configure which components run during predictions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadComponentConfigs}
                  disabled={configLoading}
                  className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white disabled:opacity-50"
                >
                  {configLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={resetToDefaults}
                  disabled={configLoading}
                  className="px-3 py-1.5 text-sm bg-orange-600 hover:bg-orange-500 rounded text-white disabled:opacity-50"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-700/30 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{configSummary?.total || 0}</p>
                <p className="text-gray-400 text-sm">Total Components</p>
              </div>
              <div className="bg-green-900/30 rounded-lg p-4 text-center border border-green-800/30">
                <p className="text-3xl font-bold text-green-400">{configSummary?.enabled || 0}</p>
                <p className="text-gray-400 text-sm">Enabled</p>
              </div>
              <div className="bg-red-900/30 rounded-lg p-4 text-center border border-red-800/30">
                <p className="text-3xl font-bold text-red-400">{configSummary?.disabled || 0}</p>
                <p className="text-gray-400 text-sm">Disabled</p>
              </div>
              <div className="bg-yellow-900/30 rounded-lg p-4 text-center border border-yellow-800/30">
                <p className="text-3xl font-bold text-yellow-400">{configSummary?.needsCalibration || 0}</p>
                <p className="text-gray-400 text-sm">Needs Calibration</p>
              </div>
            </div>
          </div>

          {/* New Components Alert */}
          {newComponents.length > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-yellow-400 font-medium">
                    {newComponents.length} new component{newComponents.length > 1 ? 's' : ''} detected
                  </p>
                  <p className="text-gray-400 text-sm">
                    Run calibration before enabling: {newComponents.map(c => c.component_name).join(', ')}
                  </p>
                </div>
              </div>
              <button
                onClick={syncNewComponents}
                disabled={configLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded text-white text-sm disabled:opacity-50"
              >
                Add to Configuration
              </button>
            </div>
          )}

          {/* Components Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enabled Components */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-green-900/30 border-b border-gray-700">
                <h3 className="font-semibold text-green-400 flex items-center gap-2">
                  <span>🟢</span> Enabled Components ({componentConfigs.filter(c => c.enabled).length})
                </h3>
              </div>
              <div className="divide-y divide-gray-700/50 max-h-[500px] overflow-y-auto">
                {componentConfigs.filter(c => c.enabled).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No enabled components</p>
                ) : (
                  componentConfigs.filter(c => c.enabled).map(comp => (
                    <div key={comp.component_id} className="p-4 hover:bg-gray-700/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{comp.component_name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              comp.component_type === 'llm' ? 'bg-purple-900 text-purple-300' :
                              comp.component_type === 'ml' ? 'bg-blue-900 text-blue-300' :
                              comp.component_type === 'quantitative' ? 'bg-cyan-900 text-cyan-300' :
                              comp.component_type === 'pattern' ? 'bg-green-900 text-green-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {comp.component_type}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            {comp.avg_error !== null && (
                              <span className={comp.avg_error < 25 ? 'text-green-400' : comp.avg_error < 35 ? 'text-yellow-400' : 'text-red-400'}>
                                Error: {comp.avg_error.toFixed(1)} DPS
                              </span>
                            )}
                            {comp.avg_time_ms !== null && (
                              <span>Time: {(comp.avg_time_ms / 1000).toFixed(1)}s</span>
                            )}
                            {comp.sample_count > 0 && (
                              <span>Samples: {comp.sample_count}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleComponent(comp.component_id, false, 'Manually disabled')}
                          disabled={savingConfig === comp.component_id}
                          className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 rounded transition-colors disabled:opacity-50"
                        >
                          {savingConfig === comp.component_id ? '...' : 'Disable'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Disabled Components */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-red-900/30 border-b border-gray-700">
                <h3 className="font-semibold text-red-400 flex items-center gap-2">
                  <span>🔴</span> Disabled Components ({componentConfigs.filter(c => !c.enabled).length})
                </h3>
              </div>
              <div className="divide-y divide-gray-700/50 max-h-[500px] overflow-y-auto">
                {componentConfigs.filter(c => !c.enabled).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No disabled components</p>
                ) : (
                  componentConfigs.filter(c => !c.enabled).map(comp => (
                    <div key={comp.component_id} className="p-4 hover:bg-gray-700/30">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 font-medium">{comp.component_name}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              comp.component_type === 'llm' ? 'bg-purple-900/50 text-purple-400' :
                              comp.component_type === 'ml' ? 'bg-blue-900/50 text-blue-400' :
                              comp.component_type === 'quantitative' ? 'bg-cyan-900/50 text-cyan-400' :
                              comp.component_type === 'pattern' ? 'bg-green-900/50 text-green-400' :
                              'bg-gray-700/50 text-gray-400'
                            }`}>
                              {comp.component_type}
                            </span>
                            {comp.status === 'needs_calibration' && (
                              <span className="px-2 py-0.5 rounded text-xs bg-yellow-900/50 text-yellow-400">
                                ⚠️ Needs calibration
                              </span>
                            )}
                          </div>
                          {comp.disabled_reason && (
                            <p className="text-xs text-red-400 mt-1">
                              Reason: {comp.disabled_reason}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            {comp.avg_error !== null && (
                              <span className={comp.avg_error < 25 ? 'text-green-500' : comp.avg_error < 35 ? 'text-yellow-500' : 'text-red-500'}>
                                Error: {comp.avg_error.toFixed(1)} DPS
                              </span>
                            )}
                            {comp.avg_time_ms !== null && (
                              <span>Time: {(comp.avg_time_ms / 1000).toFixed(1)}s</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleComponent(comp.component_id, true)}
                          disabled={savingConfig === comp.component_id || comp.status === 'needs_calibration'}
                          className={`px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 ${
                            comp.status === 'needs_calibration'
                              ? 'bg-gray-600/20 border border-gray-600/50 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600/20 hover:bg-green-600/40 border border-green-600/50 text-green-400'
                          }`}
                          title={comp.status === 'needs_calibration' ? 'Run calibration first' : 'Enable this component'}
                        >
                          {savingConfig === comp.component_id ? '...' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Current Configuration Impact</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Estimated Prediction Time</p>
                <p className="text-2xl font-bold text-white">
                  {((componentConfigs.filter(c => c.enabled).reduce((sum, c) => sum + (c.avg_time_ms || 0), 0)) / 1000).toFixed(1)}s
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Expected Error</p>
                <p className="text-2xl font-bold text-white">
                  {(() => {
                    const enabledWithError = componentConfigs.filter(c => c.enabled && c.avg_error !== null);
                    return enabledWithError.length > 0
                      ? (enabledWithError.reduce((sum, c) => sum + (c.avg_error || 0), 0) / enabledWithError.length).toFixed(1)
                      : 'N/A';
                  })()}{' '}
                  <span className="text-sm font-normal text-gray-400">DPS</span>
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">LLM Components</p>
                <p className="text-2xl font-bold text-white">
                  {componentConfigs.filter(c => c.enabled && c.component_type === 'llm').length}
                  <span className="text-sm font-normal text-gray-400"> / {componentConfigs.filter(c => c.component_type === 'llm').length}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-4 text-sm text-gray-300">
            <p className="font-medium text-blue-400 mb-2">💡 How Component Configuration Works</p>
            <ul className="space-y-1 text-gray-400">
              <li>• <strong>Enabled components</strong> will run during every prediction and contribute to the DPS score.</li>
              <li>• <strong>Disabled components</strong> are skipped entirely (no API calls, no processing time).</li>
              <li>• <strong>Components needing calibration</strong> must be tested before enabling to ensure accuracy.</li>
              <li>• Changes take effect immediately. The KaiOrchestrator reads this configuration at runtime.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
















