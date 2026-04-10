'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Cpu,
  FlaskConical,
  Play,
  ArrowUpCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────

interface Experiment {
  id: string;
  experiment_type: string;
  experiment_mode: string;
  niche_scope: string | null;
  description: string;
  training_data_rows: number;
  validation_spearman: number | null;
  baseline_spearman: number | null;
  delta: number | null;
  result: string;
  error_message: string | null;
  promoted_from_sandbox_id: string | null;
  features_used: any;
  hyperparams: any;
  created_at: string;
}

interface TrainerStatus {
  active_program: any;
  active_variants: any[];
  pending_variants: any[];
  recent_experiments: Experiment[];
  feedback_rows_since_last_training: number;
  niches_with_data: Record<string, number>;
}

type ExperimentType = 'retrain' | 'feature_add' | 'feature_remove' | 'hyperparameter' | 'niche_specific';
type ModeFilter = 'all' | 'sandbox' | 'production';
type SortField = 'created_at' | 'delta' | 'validation_spearman' | 'result';

const EXPERIMENT_TYPES: { value: ExperimentType; label: string }[] = [
  { value: 'retrain', label: 'Full Retrain' },
  { value: 'feature_add', label: 'Feature Add' },
  { value: 'feature_remove', label: 'Feature Remove' },
  { value: 'hyperparameter', label: 'Hyperparameter Tune' },
  { value: 'niche_specific', label: 'Niche-Specific' },
];

const RESULT_COLORS: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
  improved: { bg: 'bg-green-500/15', text: 'text-green-400', icon: TrendingUp },
  pending_promotion: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', icon: ArrowUpCircle },
  no_change: { bg: 'bg-gray-500/15', text: 'text-gray-400', icon: Minus },
  degraded: { bg: 'bg-red-500/15', text: 'text-red-400', icon: TrendingDown },
  error: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: XCircle },
};

// ── Component ───────────────────────────────────────────────────────────

export function TrainerExperiments() {
  const [status, setStatus] = useState<TrainerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Launcher state
  const [launchType, setLaunchType] = useState<ExperimentType>('retrain');
  const [launchNiche, setLaunchNiche] = useState<string>('');
  const [launchDescription, setLaunchDescription] = useState('');
  const [launchMode, setLaunchMode] = useState<'sandbox' | 'production'>('sandbox');
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<string | null>(null);

  // Filter state
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  // Expand state for experiment details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Promoting state
  const [promotingId, setPromotingId] = useState<string | null>(null);

  // ── Data Loading ────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trainer');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch trainer status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  // ── Launch Experiment ────────────────────────────────────────────────

  const handleLaunch = async () => {
    if (!launchDescription.trim()) return;
    setLaunching(true);
    setLaunchResult(null);

    try {
      const res = await fetch('/api/admin/trainer?action=launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_type: launchType,
          niche_scope: launchType === 'niche_specific' ? launchNiche : null,
          description: launchDescription.trim(),
          experiment_mode: launchMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.experiments?.length > 0) {
        const exp = data.experiments[0];
        const delta = exp.delta >= 0 ? `+${exp.delta}` : `${exp.delta}`;
        setLaunchResult(
          `${launchMode === 'sandbox' ? 'Sandbox' : 'Production'} experiment complete: ` +
          `Spearman ${exp.validation_spearman} (${delta}) — ${exp.result}`
        );
      } else {
        setLaunchResult(data.skipped_reason || data.error || 'Experiment completed with no results');
      }

      setLaunchDescription('');
      fetchStatus();
    } catch (err: any) {
      setLaunchResult(`Error: ${err.message}`);
    } finally {
      setLaunching(false);
    }
  };

  // ── Promote Sandbox to Production ────────────────────────────────────

  const handlePromote = async (experimentId: string) => {
    setPromotingId(experimentId);
    try {
      const res = await fetch(
        `/api/admin/trainer?action=promote_sandbox&experiment_id=${experimentId}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        alert(data.skipped_reason || data.error || 'Promotion failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPromotingId(null);
    }
  };

  // ── Filtering & Sorting ──────────────────────────────────────────────

  const allExperiments = status?.recent_experiments || [];

  const uniqueNiches = useMemo(() => {
    const niches = new Set<string>();
    for (const exp of allExperiments) {
      if (exp.niche_scope) niches.add(exp.niche_scope);
    }
    return [...niches].sort();
  }, [allExperiments]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    for (const exp of allExperiments) {
      types.add(exp.experiment_type);
    }
    return [...types].sort();
  }, [allExperiments]);

  const filteredExperiments = useMemo(() => {
    let filtered = [...allExperiments];

    // Remove lock placeholders that were cleaned up
    filtered = filtered.filter(e => e.description !== 'Lock placeholder — experiment starting');

    if (modeFilter !== 'all') {
      filtered = filtered.filter(e => e.experiment_mode === modeFilter);
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(e => e.experiment_type === typeFilter);
    }
    if (nicheFilter !== 'all') {
      filtered = filtered.filter(e => e.niche_scope === nicheFilter);
    }

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'delta':
          cmp = (a.delta ?? 0) - (b.delta ?? 0);
          break;
        case 'validation_spearman':
          cmp = (a.validation_spearman ?? 0) - (b.validation_spearman ?? 0);
          break;
        case 'result':
          cmp = a.result.localeCompare(b.result);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return filtered;
  }, [allExperiments, modeFilter, typeFilter, nicheFilter, sortField, sortAsc]);

  const sandboxExperiments = useMemo(
    () => filteredExperiments.filter(e => e.experiment_mode === 'sandbox'),
    [filteredExperiments],
  );

  // ── Niches with data (for launcher) ──────────────────────────────────

  const nichesWithData = useMemo(() => {
    if (!status?.niches_with_data) return [];
    return Object.entries(status.niches_with_data)
      .sort(([, a], [, b]) => b - a)
      .map(([niche, count]) => ({ niche, count }));
  }, [status]);

  // ── Render Helpers ───────────────────────────────────────────────────

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (loading) {
    return (
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        Loading trainer data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Section: Quick Experiment Launcher ──────────────────────────── */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <FlaskConical size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Quick Experiment Launcher</h3>
            <p className="text-sm text-gray-400">Run a controlled experiment on the training engine</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Experiment Type */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Experiment Type</label>
            <select
              value={launchType}
              onChange={e => setLaunchType(e.target.value as ExperimentType)}
              className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
            >
              {EXPERIMENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Niche Scope */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">
              Niche Scope
              {launchType !== 'niche_specific' && <span className="text-gray-600 normal-case"> (auto: global)</span>}
            </label>
            <select
              value={launchNiche}
              onChange={e => setLaunchNiche(e.target.value)}
              disabled={launchType !== 'niche_specific'}
              className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">Global (all niches)</option>
              {nichesWithData.map(n => (
                <option key={n.niche} value={n.niche}>
                  {n.niche} ({n.count} rows)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">What are you testing?</label>
          <input
            type="text"
            value={launchDescription}
            onChange={e => setLaunchDescription(e.target.value)}
            placeholder="e.g. Remove audio features to test impact on Spearman..."
            className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-cyan-500/50 focus:outline-none"
          />
        </div>

        {/* Mode Toggle + Launch Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-1.5">
            <button
              onClick={() => setLaunchMode('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                launchMode === 'sandbox'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Shield size={14} />
              Sandbox
            </button>
            <button
              onClick={() => setLaunchMode('production')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                launchMode === 'production'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Zap size={14} />
              Production
            </button>
          </div>

          {launchMode === 'production' && (
            <span className="text-xs text-red-400/70 flex items-center gap-1">
              <AlertTriangle size={12} />
              Will affect model_variants if improved
            </span>
          )}

          <button
            onClick={handleLaunch}
            disabled={launching || !launchDescription.trim()}
            className="ml-auto flex items-center gap-2 px-5 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
          >
            {launching ? (
              <><Loader2 size={16} className="animate-spin" /> Running...</>
            ) : (
              <><Play size={16} /> Run Experiment</>
            )}
          </button>
        </div>

        {launchResult && (
          <div className="mt-3 p-3 bg-[#0a0a0f] rounded-lg text-sm text-gray-300 border border-[#1a1a2e]">
            {launchResult}
          </div>
        )}
      </div>

      {/* ── Section: Sandbox Experiments ─────────────────────────────────── */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Shield size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Sandbox Experiments</h3>
              <p className="text-sm text-gray-400">
                {sandboxExperiments.length} sandbox experiment{sandboxExperiments.length !== 1 ? 's' : ''} — safe, no production impact
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {sandboxExperiments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No sandbox experiments yet. Use the launcher above to run one.
          </div>
        ) : (
          <div className="space-y-2">
            {sandboxExperiments.slice(0, 10).map(exp => {
              const rc = RESULT_COLORS[exp.result] || RESULT_COLORS.error;
              const ResultIcon = rc.icon;
              const isExpanded = expandedId === exp.id;
              const canPromote = exp.result === 'improved' || exp.result === 'pending_promotion';
              const isDegraded = exp.result === 'degraded';

              return (
                <div key={exp.id} className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  >
                    <div className={`p-1.5 rounded-md ${rc.bg}`}>
                      <ResultIcon size={14} className={rc.text} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {exp.description?.replace(/^\[SANDBOX\]\s*/i, '') || exp.experiment_type}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{exp.experiment_type}</span>
                        {exp.niche_scope && <span className="text-purple-400">{exp.niche_scope}</span>}
                        <span>{formatDate(exp.created_at)}</span>
                      </div>
                    </div>

                    <div className="text-right mr-2">
                      <div className="text-sm font-mono">
                        <span className="text-gray-400">ρ</span>{' '}
                        <span className="text-white">{exp.validation_spearman ?? '—'}</span>
                      </div>
                      <div className={`text-xs font-mono ${(exp.delta ?? 0) > 0 ? 'text-green-400' : (exp.delta ?? 0) < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {exp.delta !== null ? (exp.delta >= 0 ? `+${exp.delta}` : exp.delta) : '—'}
                      </div>
                    </div>

                    {canPromote ? (
                      <button
                        onClick={e => { e.stopPropagation(); handlePromote(exp.id); }}
                        disabled={promotingId === exp.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded-md text-xs font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
                        title="Re-run this experiment in production mode"
                      >
                        {promotingId === exp.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ArrowUpCircle size={12} />
                        )}
                        Promote
                      </button>
                    ) : isDegraded ? (
                      <span className="text-xs text-red-400/60 px-3 py-1.5" title="Cannot promote — would degrade production">
                        Degraded
                      </span>
                    ) : null}

                    {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-[#1a1a2e] space-y-2">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">Training rows</span>
                          <div className="text-white font-mono">{exp.training_data_rows}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Baseline Spearman</span>
                          <div className="text-white font-mono">{exp.baseline_spearman ?? '—'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Validation Spearman</span>
                          <div className="text-white font-mono">{exp.validation_spearman ?? '—'}</div>
                        </div>
                      </div>
                      {exp.features_used && (
                        <div className="text-xs">
                          <span className="text-gray-500">Features: </span>
                          <span className="text-gray-300">
                            {Array.isArray(exp.features_used) ? exp.features_used.length : 0} features
                          </span>
                        </div>
                      )}
                      {exp.hyperparams && Object.keys(exp.hyperparams).length > 0 && (
                        <div className="text-xs">
                          <span className="text-gray-500">Hyperparams: </span>
                          <code className="text-gray-300 bg-[#111118] px-1 rounded">
                            {JSON.stringify(exp.hyperparams).slice(0, 120)}
                          </code>
                        </div>
                      )}
                      {exp.error_message && (
                        <div className="text-xs text-orange-400 bg-orange-500/10 rounded p-2">
                          {exp.error_message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Section: Experiment History ──────────────────────────────────── */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Clock size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Experiment History</h3>
              <p className="text-sm text-gray-400">All experiments — sortable by date, type, result, mode</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Filter size={12} />
            {filteredExperiments.length} of {allExperiments.length}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value as ModeFilter)}
            className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="all">All modes</option>
            <option value="sandbox">Sandbox only</option>
            <option value="production">Production only</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="all">All types</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={nicheFilter}
            onChange={e => setNicheFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-cyan-500/50 focus:outline-none"
          >
            <option value="all">All niches</option>
            {uniqueNiches.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Table */}
        {filteredExperiments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No experiments match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-[#1a1a2e]">
                  <th className="text-left py-2 px-2 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('created_at')}>
                    <span className="flex items-center gap-1">Date <SortIcon field="created_at" /></span>
                  </th>
                  <th className="text-left py-2 px-2 font-medium">Mode</th>
                  <th className="text-left py-2 px-2 font-medium">Type</th>
                  <th className="text-left py-2 px-2 font-medium">Niche</th>
                  <th className="text-left py-2 px-2 font-medium">Description</th>
                  <th className="text-right py-2 px-2 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('validation_spearman')}>
                    <span className="flex items-center justify-end gap-1">Spearman <SortIcon field="validation_spearman" /></span>
                  </th>
                  <th className="text-right py-2 px-2 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('delta')}>
                    <span className="flex items-center justify-end gap-1">Delta <SortIcon field="delta" /></span>
                  </th>
                  <th className="text-center py-2 px-2 font-medium cursor-pointer hover:text-white" onClick={() => toggleSort('result')}>
                    <span className="flex items-center justify-center gap-1">Result <SortIcon field="result" /></span>
                  </th>
                  <th className="text-right py-2 px-2 font-medium">Rows</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperiments.map(exp => {
                  const rc = RESULT_COLORS[exp.result] || RESULT_COLORS.error;
                  return (
                    <tr key={exp.id} className="border-b border-[#1a1a2e]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{formatDate(exp.created_at)}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          exp.experiment_mode === 'sandbox'
                            ? 'bg-amber-500/15 text-amber-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {exp.experiment_mode === 'sandbox' ? <Shield size={10} /> : <Zap size={10} />}
                          {exp.experiment_mode}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-gray-300">{exp.experiment_type}</td>
                      <td className="py-2 px-2">
                        {exp.niche_scope ? (
                          <span className="text-purple-400">{exp.niche_scope}</span>
                        ) : (
                          <span className="text-gray-600">global</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-gray-300 max-w-[200px] truncate" title={exp.description || ''}>
                        {exp.description?.replace(/^\[(SANDBOX|PRODUCTION)\]\s*/i, '') || '—'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-white">{exp.validation_spearman ?? '—'}</td>
                      <td className={`py-2 px-2 text-right font-mono ${
                        (exp.delta ?? 0) > 0 ? 'text-green-400' : (exp.delta ?? 0) < 0 ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {exp.delta !== null ? (exp.delta >= 0 ? `+${exp.delta}` : exp.delta) : '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${rc.bg} ${rc.text}`}>
                          {exp.result}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-gray-400 font-mono">{exp.training_data_rows}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrainerExperiments;
