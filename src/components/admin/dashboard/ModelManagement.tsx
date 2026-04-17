'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Crown,
  ArrowUpCircle,
  RotateCcw,
  GitCompare,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Clock,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  BarChart3,
  X,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────

interface ModelVariant {
  id: string;
  niche: string | null;
  model_version: string;
  spearman_score: number | null;
  features: any;
  hyperparams: any;
  is_active: boolean;
  promoted_at: string | null;
  prediction_count: number;
  training_data_stats: any;
  created_at: string;
  experiment_id?: string;
  deactivated_at?: string | null;
  replaced_by?: string | null;
}

interface PromotionLogEntry {
  id: string;
  action: 'promote' | 'rollback';
  variant_id: string;
  previous_variant_id: string | null;
  niche: string | null;
  before_spearman: number | null;
  after_spearman: number | null;
  delta: number | null;
  reason: string | null;
  triggered_by: string;
  experiment_id: string | null;
  created_at: string;
}

interface HyperparamDiffEntry {
  key: string;
  a: any;
  b: any;
  status: 'same' | 'changed' | 'only_a' | 'only_b';
}

interface PerNicheSpearmanRow {
  niche: string;
  a_spearman: number | null;
  a_n: number | null;
  b_spearman: number | null;
  b_n: number | null;
  delta: number | null;
}

interface ComparisonData {
  variant_a: ModelVariant & { experiment: any; feature_count: number };
  variant_b: ModelVariant & { experiment: any; feature_count: number };
  feature_diff: { feature: string; in_a: boolean; in_b: boolean; status: string }[];
  hyperparam_diff: HyperparamDiffEntry[];
  per_niche_spearman: PerNicheSpearmanRow[] | null;
  training_rows_a: number | null;
  training_rows_b: number | null;
  training_rows_delta: number | null;
  spearman_delta: number | null;
}

interface TrainerStatus {
  active_variants: ModelVariant[];
  pending_variants: ModelVariant[];
  inactive_variants: ModelVariant[];
  total_predictions: number;
  recent_promotions: PromotionLogEntry[];
  [key: string]: any;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function SpearmanBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-500">—</span>;
  const color = value >= 0.7 ? 'text-green-400' : value >= 0.5 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-mono font-semibold ${color}`}>{value.toFixed(4)}</span>;
}

// ── Component ───────────────────────────────────────────────────────────

export function ModelManagement() {
  const [status, setStatus] = useState<TrainerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comparison state
  const [showComparison, setShowComparison] = useState(false);
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Promotion log state
  const [showPromotionLog, setShowPromotionLog] = useState(false);
  const [fullPromotionLog, setFullPromotionLog] = useState<PromotionLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  // Action states
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);

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

  // ── Comparison ──────────────────────────────────────────────────────

  const allVariants = useMemo(() => {
    if (!status) return [];
    return [
      ...(status.active_variants || []),
      ...(status.pending_variants || []),
      ...(status.inactive_variants || []),
    ];
  }, [status]);

  const loadComparison = async () => {
    if (!compareA || !compareB) return;
    setLoadingComparison(true);
    try {
      const res = await fetch(`/api/admin/trainer?view=comparison&a=${compareA}&b=${compareB}`);
      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error('Comparison failed:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  // ── Promotion Log ──────────────────────────────────────────────────

  const loadPromotionLog = async () => {
    setLoadingLog(true);
    try {
      const res = await fetch('/api/admin/trainer?view=promotion_log');
      if (res.ok) {
        const data = await res.json();
        setFullPromotionLog(data.promotion_log || []);
      }
    } catch (err) {
      console.error('Failed to load promotion log:', err);
    } finally {
      setLoadingLog(false);
    }
  };

  // ── Promote Variant ────────────────────────────────────────────────

  const handlePromote = async (variantId: string) => {
    const candidate = allVariants.find(v => v.id === variantId) || null;
    const production = status?.active_variants?.find(
      (v: ModelVariant) => v.niche === (candidate?.niche ?? null),
    ) || null;

    const candidateRho = candidate?.spearman_score ?? null;
    const productionRho = production?.spearman_score ?? null;
    const isDegraded =
      candidateRho != null && productionRho != null && candidateRho < productionRho;

    if (isDegraded) {
      const delta = (candidateRho - productionRho).toFixed(4);
      const typed = prompt(
        `⚠ DEGRADED CANDIDATE\n\n` +
        `Production ρ: ${productionRho.toFixed(4)}\n` +
        `Candidate  ρ: ${candidateRho.toFixed(4)}\n` +
        `Delta      : ${delta}\n\n` +
        `This candidate is WORSE than the current production model. ` +
        `Promoting it will degrade prediction accuracy.\n\n` +
        `Type PROMOTE DEGRADED to confirm, or Cancel to abort.`,
      );
      if (typed !== 'PROMOTE DEGRADED') return;
    } else {
      if (!confirm('Promote this model to production? The current model will be backed up.')) return;
    }

    setPromotingId(variantId);
    try {
      const res = await fetch(`/api/admin/trainer?action=promote&variant_id=${variantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Chairman manual promotion from dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        alert(data.error || 'Promotion failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setPromotingId(null);
    }
  };

  // ── Rollback ───────────────────────────────────────────────────────

  const handleRollback = async (niche: string | null) => {
    const scope = niche || 'global';
    if (!confirm(`Roll back the ${scope} model to the previous version? The current model will be preserved.`)) return;
    setRollingBack(true);
    try {
      const nicheParam = niche ? `&niche=${encodeURIComponent(niche)}` : '&niche=';
      const res = await fetch(`/api/admin/trainer?action=rollback${nicheParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Chairman manual rollback from dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        alert(data.error || 'Rollback failed');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setRollingBack(false);
    }
  };

  // ── Derived Data ───────────────────────────────────────────────────

  const globalModel = status?.active_variants?.find((v: ModelVariant) => v.niche === null) || null;
  const nicheModels = status?.active_variants?.filter((v: ModelVariant) => v.niche !== null) || [];
  const pendingVariants = status?.pending_variants || [];
  const recentPromotions = status?.recent_promotions || [];

  if (loading) {
    return (
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        Loading model data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Production Model Status Card ──────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#111118] to-[#0d0d15] border border-emerald-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/15 rounded-lg">
              <Crown size={22} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">Production Model</h3>
              <p className="text-sm text-gray-400">Currently serving all predictions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              disabled={allVariants.length < 2}
              title={allVariants.length < 2 ? 'Need at least 2 model variants to compare' : ''}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <GitCompare size={14} />
              Compare
            </button>
            <button
              onClick={() => { setShowPromotionLog(!showPromotionLog); if (!showPromotionLog) loadPromotionLog(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-white/5 border border-[#1a1a2e] rounded-lg hover:bg-white/10 transition-colors"
            >
              <Clock size={14} />
              History
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {globalModel ? (
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-[#0a0a0f] rounded-lg p-3.5">
              <div className="text-xs text-gray-500 mb-1">Version</div>
              <div className="text-white font-semibold font-mono text-lg">{globalModel.model_version}</div>
            </div>
            <div className="bg-[#0a0a0f] rounded-lg p-3.5">
              <div className="text-xs text-gray-500 mb-1">Spearman ρ</div>
              <div className="text-lg"><SpearmanBadge value={globalModel.spearman_score} /></div>
            </div>
            <div className="bg-[#0a0a0f] rounded-lg p-3.5">
              <div className="text-xs text-gray-500 mb-1">Features</div>
              <div className="text-white font-semibold">
                {Array.isArray(globalModel.features) ? globalModel.features.length : '—'}
              </div>
            </div>
            <div className="bg-[#0a0a0f] rounded-lg p-3.5">
              <div className="text-xs text-gray-500 mb-1">Predictions Made</div>
              <div className="text-white font-semibold">
                {(status?.total_predictions || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-[#0a0a0f] rounded-lg p-3.5">
              <div className="text-xs text-gray-500 mb-1">Last Promoted</div>
              <div className="text-white text-sm">
                {globalModel.promoted_at
                  ? formatDate(globalModel.promoted_at)
                  : formatDate(globalModel.created_at)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 text-sm">
            No active global model found. Run the seed migration.
          </div>
        )}

        {/* Niche-specific models */}
        {nicheModels.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Niche-Specific Variants</div>
            <div className="flex flex-wrap gap-2">
              {nicheModels.map((v: ModelVariant) => (
                <div key={v.id} className="flex items-center gap-2 bg-[#0a0a0f] rounded-lg px-3 py-2 text-xs">
                  <span className="text-purple-400 font-medium">{v.niche}</span>
                  <span className="text-gray-500">·</span>
                  <span className="font-mono text-white">{v.model_version}</span>
                  <span className="text-gray-500">·</span>
                  <SpearmanBadge value={v.spearman_score} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rollback button */}
        {globalModel && (
          <div className="mt-4 pt-3 border-t border-[#1a1a2e] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Activity size={12} />
              Training date: {formatDate(globalModel.created_at)}
            </div>
            <button
              onClick={() => handleRollback(null)}
              disabled={rollingBack}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400/80 bg-orange-500/10 border border-orange-500/20 rounded-lg hover:bg-orange-500/20 transition-colors disabled:opacity-40"
            >
              {rollingBack ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Rollback to Previous
            </button>
          </div>
        )}
      </div>

      {/* ── Pending Promotion Candidates ──────────────────────────────── */}
      {pendingVariants.length > 0 && (
        <div className="bg-[#111118] border border-cyan-500/20 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/15 rounded-lg">
              <ArrowUpCircle size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Pending Promotion</h3>
              <p className="text-sm text-gray-400">{pendingVariants.length} candidate model{pendingVariants.length !== 1 ? 's' : ''} awaiting approval</p>
            </div>
          </div>

          <div className="space-y-2">
            {pendingVariants.map((v: ModelVariant) => (
              <div key={v.id} className="flex items-center justify-between bg-[#0a0a0f] rounded-lg p-3">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-mono text-white font-medium">{v.model_version}</span>
                    {v.niche && <span className="ml-2 text-purple-400 text-xs">({v.niche})</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    ρ <SpearmanBadge value={v.spearman_score} />
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(v.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prodId = globalModel?.id || '';
                      setCompareA(prodId);
                      setCompareB(v.id);
                      setShowComparison(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-md hover:bg-purple-500/20 transition-colors"
                  >
                    <GitCompare size={12} />
                    Compare
                  </button>
                  <button
                    onClick={() => handlePromote(v.id)}
                    disabled={promotingId === v.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-md hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                  >
                    {promotingId === v.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <ArrowUpCircle size={12} />
                    )}
                    Promote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comparison Modal ──────────────────────────────────────────── */}
      {showComparison && (
        <div className="bg-[#111118] border border-purple-500/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/15 rounded-lg">
                <GitCompare size={20} className="text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Model Comparison</h3>
            </div>
            <button onClick={() => setShowComparison(false)} className="p-1.5 text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {allVariants.length < 2 && (
            <div className="mb-4 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-sm text-yellow-200/80">
              Need at least 2 model variants to run a comparison. Currently {allVariants.length} variant{allVariants.length === 1 ? '' : 's'} in the system.
            </div>
          )}

          {/* Variant selectors */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Model A (Left)</label>
              <select
                value={compareA}
                onChange={e => setCompareA(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
              >
                <option value="">Select model...</option>
                {allVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.model_version} {v.is_active ? '(active)' : ''} — ρ {v.spearman_score ?? '?'} {v.niche ? `[${v.niche}]` : '[global]'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wider">Model B (Right)</label>
              <select
                value={compareB}
                onChange={e => setCompareB(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none"
              >
                <option value="">Select model...</option>
                {allVariants.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.model_version} {v.is_active ? '(active)' : ''} — ρ {v.spearman_score ?? '?'} {v.niche ? `[${v.niche}]` : '[global]'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={loadComparison}
            disabled={!compareA || !compareB || loadingComparison}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loadingComparison ? <Loader2 size={14} className="animate-spin" /> : <GitCompare size={14} />}
            Load Comparison
          </button>

          {/* Comparison Results */}
          {comparison && (
            <div className="space-y-4">
              {/* Side-by-side metrics */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'A', variant: comparison.variant_a, color: 'blue' },
                  { label: 'B', variant: comparison.variant_b, color: 'emerald' },
                ].map(({ label, variant, color }) => (
                  <div key={label} className={`bg-[#0a0a0f] border border-${color}-500/20 rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 bg-${color}-500/20 text-${color}-400 rounded text-xs font-bold`}>
                        {label}
                      </span>
                      <span className="font-mono text-white font-semibold">{variant.model_version}</span>
                      {variant.is_active && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded text-[10px]">ACTIVE</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Spearman ρ</span>
                        <div className="mt-0.5"><SpearmanBadge value={variant.spearman_score} /></div>
                      </div>
                      <div>
                        <span className="text-gray-500">Features</span>
                        <div className="text-white font-mono mt-0.5">{variant.feature_count}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Training Rows</span>
                        <div className="text-white font-mono mt-0.5">
                          {(label === 'A' ? comparison.training_rows_a : comparison.training_rows_b)?.toLocaleString() ?? '—'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Niche</span>
                        <div className="text-white mt-0.5">{variant.niche || 'Global'}</div>
                      </div>
                    </div>

                    {variant.experiment && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a2e] text-xs">
                        <div className="text-gray-500 mb-1">Why (experiment description)</div>
                        <div className="text-gray-300">{variant.experiment.description?.replace(/^\[(SANDBOX|PRODUCTION)\]\s*/i, '') || '—'}</div>
                        <div className="mt-1 text-gray-500">
                          {variant.experiment.experiment_type} · trained {formatDate(variant.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Headline deltas */}
              <div className="grid grid-cols-2 gap-4">
                {comparison.spearman_delta !== null && (
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium ${
                    comparison.spearman_delta > 0
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : comparison.spearman_delta < 0
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-gray-500/10 text-gray-400 border border-[#1a1a2e]'
                  }`}>
                    {comparison.spearman_delta > 0 ? <TrendingUp size={16} /> : comparison.spearman_delta < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                    B is {comparison.spearman_delta > 0 ? '+' : ''}{comparison.spearman_delta} Spearman {comparison.spearman_delta > 0 ? 'better' : comparison.spearman_delta < 0 ? 'worse' : 'same'}
                  </div>
                )}
                {comparison.training_rows_delta !== null && (
                  <div className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium ${
                    comparison.training_rows_delta > 0
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : comparison.training_rows_delta < 0
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      : 'bg-gray-500/10 text-gray-400 border border-[#1a1a2e]'
                  }`}>
                    <Database size={16} />
                    B trained on {comparison.training_rows_delta >= 0 ? '+' : ''}{comparison.training_rows_delta.toLocaleString()} rows
                  </div>
                )}
              </div>

              {/* Hyperparameter diff */}
              {comparison.hyperparam_diff && comparison.hyperparam_diff.length > 0 && (
                <div className="bg-[#0a0a0f] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Hyperparameters</div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-500/40"></span>same</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400/70"></span>changed</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400/70"></span>A only</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/70"></span>B only</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-gray-600 pb-1 border-b border-[#1a1a2e]">
                      <span>Key</span>
                      <span>A</span>
                      <span>B</span>
                    </div>
                    {comparison.hyperparam_diff.map(h => {
                      const rowColor =
                        h.status === 'changed' ? 'bg-yellow-500/5 text-yellow-200' :
                        h.status === 'only_a' ? 'bg-blue-500/5 text-blue-200' :
                        h.status === 'only_b' ? 'bg-emerald-500/5 text-emerald-200' :
                        'text-gray-400';
                      return (
                        <div key={h.key} className={`grid grid-cols-[1fr_1fr_1fr] gap-2 px-2 py-1 rounded ${rowColor}`}>
                          <span className="font-mono text-gray-400">{h.key}</span>
                          <span className="font-mono truncate">{h.a === null ? '—' : String(h.a)}</span>
                          <span className="font-mono truncate">{h.b === null ? '—' : String(h.b)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Per-niche Spearman */}
              <div className="bg-[#0a0a0f] rounded-lg p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Per-Niche Spearman</div>
                {comparison.per_niche_spearman && comparison.per_niche_spearman.length > 0 ? (
                  <div className="space-y-1 text-xs">
                    <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 text-[10px] uppercase tracking-wider text-gray-600 pb-1 border-b border-[#1a1a2e]">
                      <span>Niche</span>
                      <span>A (ρ / n)</span>
                      <span>B (ρ / n)</span>
                      <span>Δ</span>
                    </div>
                    {comparison.per_niche_spearman.map(row => (
                      <div key={row.niche} className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 px-2 py-1 rounded hover:bg-white/5">
                        <span className="text-purple-400 font-medium">{row.niche}</span>
                        <span className="font-mono text-gray-300">
                          {row.a_spearman != null ? row.a_spearman.toFixed(4) : '—'}
                          {row.a_n != null && <span className="text-gray-600"> / {row.a_n}</span>}
                        </span>
                        <span className="font-mono text-gray-300">
                          {row.b_spearman != null ? row.b_spearman.toFixed(4) : '—'}
                          {row.b_n != null && <span className="text-gray-600"> / {row.b_n}</span>}
                        </span>
                        <span className={`font-mono ${
                          row.delta == null ? 'text-gray-500' :
                          row.delta > 0 ? 'text-green-400' :
                          row.delta < 0 ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {row.delta == null ? '—' : (row.delta >= 0 ? '+' : '') + row.delta.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic">
                    Global only — per-niche scores not recorded for these experiments. Future experiments will populate this.
                  </div>
                )}
              </div>

              {/* Feature diff */}
              {comparison.feature_diff.length > 0 && (
                <div className="bg-[#0a0a0f] rounded-lg p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Feature Comparison (Top 15)</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    {comparison.feature_diff.slice(0, 15).map(f => (
                      <div
                        key={f.feature}
                        className={`px-2 py-1 rounded ${
                          f.status === 'both' ? 'bg-gray-500/10 text-gray-400' :
                          f.status === 'only_a' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        <span className="font-mono">{f.feature}</span>
                        <span className="ml-1 text-[10px] opacity-60">
                          {f.status === 'only_a' ? '(A only)' : f.status === 'only_b' ? '(B only)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                  {comparison.feature_diff.length > 15 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{comparison.feature_diff.length - 15} more features
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Promotion Log ─────────────────────────────────────────────── */}
      {showPromotionLog && (
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-500/15 rounded-lg">
                <Clock size={20} className="text-gray-400" />
              </div>
              <h3 className="font-semibold text-white">Promotion History</h3>
            </div>
            <button onClick={() => setShowPromotionLog(false)} className="p-1.5 text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          {loadingLog ? (
            <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
              <Loader2 size={16} className="animate-spin" /> Loading...
            </div>
          ) : fullPromotionLog.length === 0 ? (
            <div className="text-center py-6 text-gray-500 text-sm">No promotions or rollbacks recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {fullPromotionLog.map(entry => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                  entry.action === 'promote' ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-orange-500/5 border border-orange-500/10'
                }`}>
                  <div className={`p-1.5 rounded-md ${
                    entry.action === 'promote' ? 'bg-emerald-500/15' : 'bg-orange-500/15'
                  }`}>
                    {entry.action === 'promote'
                      ? <ArrowUpCircle size={14} className="text-emerald-400" />
                      : <RotateCcw size={14} className="text-orange-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">
                      {entry.action === 'promote' ? 'Promoted' : 'Rolled back'}
                      {entry.niche && <span className="text-purple-400 ml-1">({entry.niche})</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {entry.reason || '—'}
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">ρ</span>
                      <span className="text-gray-400 font-mono">{entry.before_spearman?.toFixed(4) ?? '?'}</span>
                      <span className="text-gray-600">→</span>
                      <SpearmanBadge value={entry.after_spearman} />
                    </div>
                    <div className={`font-mono ${
                      (entry.delta ?? 0) > 0 ? 'text-green-400' : (entry.delta ?? 0) < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {entry.delta !== null ? (entry.delta >= 0 ? `+${entry.delta}` : entry.delta) : '—'}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Inline recent promotions when log is empty but we have some */}
          {recentPromotions.length > 0 && fullPromotionLog.length === 0 && !loadingLog && (
            <div className="mt-2 text-xs text-gray-500">
              Recent promotions available — refresh to see.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ModelManagement;
