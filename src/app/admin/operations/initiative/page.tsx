'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  RefreshCw,
  AlertCircle,
  FileText,
  Activity,
  Wifi,
  Eye,
  Users,
  Globe,
  Radio,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { SignalCoverageBar } from '@/components/contracts/SignalCoverageBar';
import { MetricStatCard } from '@/components/contracts/MetricStatCard';
import { ResearchPromptCard } from '@/components/contracts/ResearchPromptCard';

// ── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  name: string;
  family: string;
  status: 'measured' | 'partial' | 'missing';
  source: string;
  detail: string;
}

interface SignalFamily {
  id: string;
  name: string;
  signals: Signal[];
  measured: number;
  partial: number;
  missing: number;
  total: number;
  coveragePct: number;
}

interface PromptEntry {
  number: number;
  title: string;
  status: 'complete' | 'in-progress' | 'pending' | 'blocked';
  outputDoc: string | null;
  outputExists: boolean;
  unlockedNext: string;
}

interface SpearmanData {
  rho: number | null;
  p_value: number | null;
  n: number;
  mae: number | null;
  computed_at: string | null;
}

interface ModelMeta {
  version: string;
  trainedAt: string;
  cvSpearman: number | null;
  holdoutSpearman: number | null;
  featureCount: number;
  datasetSize: number;
}

interface InitiativeData {
  spearman: SpearmanData;
  modelMeta: ModelMeta | null;
  labeledCount: number;
  trainingFeaturesCount: number;
  signalFamilies: SignalFamily[];
  prompts: PromptEntry[];
  initiativeProgress: { completed: number; total: number; pct: number };
  queriedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  content: <FileText className="w-4 h-4 text-blue-400" />,
  creator: <Users className="w-4 h-4 text-purple-400" />,
  distribution: <Globe className="w-4 h-4 text-amber-400" />,
  cultural: <Radio className="w-4 h-4 text-rose-400" />,
  audience: <Eye className="w-4 h-4 text-emerald-400" />,
};

const FAMILY_HEX_COLORS: Record<string, string> = {
  content: '#3b82f6',
  creator: '#a855f7',
  distribution: '#f59e0b',
  cultural: '#f43f5e',
  audience: '#10b981',
};

function mapPromptStatus(status: PromptEntry['status']): 'pending' | 'in_progress' | 'complete' {
  if (status === 'complete') return 'complete';
  if (status === 'in-progress') return 'in_progress';
  return 'pending';
}

// ── Components ───────────────────────────────────────────────────────────────

function SpearmanCard({ spearman, modelMeta }: { spearman: SpearmanData; modelMeta: ModelMeta | null }) {
  const rho = spearman.rho;
  const rhoDisplay = rho != null ? rho.toFixed(3) : '—';

  // Color based on rho value
  let rhoColor = 'text-neutral-400';
  let rhoLabel = 'Unknown';
  if (rho != null) {
    if (rho >= 0.7) { rhoColor = 'text-green-400'; rhoLabel = 'Strong'; }
    else if (rho >= 0.5) { rhoColor = 'text-emerald-400'; rhoLabel = 'Moderate'; }
    else if (rho >= 0.3) { rhoColor = 'text-yellow-400'; rhoLabel = 'Weak'; }
    else { rhoColor = 'text-red-400'; rhoLabel = 'Very Weak'; }
  }

  return (
    <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-neutral-300">Prediction Accuracy</span>
        </div>
        {spearman.computed_at && (
          <span className="text-[10px] text-neutral-500">{timeAgo(spearman.computed_at)}</span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-3xl font-bold font-mono ${rhoColor}`}>{rhoDisplay}</span>
        <span className="text-xs text-neutral-500">Spearman rho</span>
      </div>
      <div className={`text-xs ${rhoColor} mb-4`}>{rhoLabel} rank correlation</div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs text-neutral-500 mb-0.5">N</div>
          <div className="text-sm font-medium text-neutral-200">{spearman.n || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 mb-0.5">MAE</div>
          <div className="text-sm font-medium text-neutral-200">{spearman.mae != null ? spearman.mae.toFixed(1) : '—'}</div>
        </div>
        <div>
          <div className="text-xs text-neutral-500 mb-0.5">Model</div>
          <div className="text-sm font-medium text-neutral-200">{modelMeta?.version || '—'}</div>
        </div>
      </div>

      {modelMeta && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-neutral-500 mb-0.5">CV Spearman</div>
            <div className="text-sm font-mono text-neutral-300">{modelMeta.cvSpearman?.toFixed(3) ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-0.5">Holdout Spearman</div>
            <div className="text-sm font-mono text-neutral-300">{modelMeta.holdoutSpearman?.toFixed(3) ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-0.5">Features</div>
            <div className="text-sm text-neutral-300">{modelMeta.featureCount}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-0.5">Dataset</div>
            <div className="text-sm text-neutral-300">{modelMeta.datasetSize} videos</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function InitiativePage() {
  const [data, setData] = useState<InitiativeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/operations/initiative');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="h-8 w-64 bg-white/5 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/[0.02] rounded-xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/[0.02] rounded-xl animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-sm text-red-400">{error}</div>
            <button onClick={fetchData} className="mt-3 px-4 py-2 bg-red-500/20 rounded-lg text-sm text-red-300 hover:bg-red-500/30 transition-colors">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalSignals = data.signalFamilies.reduce((s, f) => s + f.total, 0);
  const measuredSignals = data.signalFamilies.reduce((s, f) => s + f.measured, 0);
  const partialSignals = data.signalFamilies.reduce((s, f) => s + f.partial, 0);
  const overallCoverage = Math.round(((measuredSignals + partialSignals * 0.5) / totalSignals) * 100);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-[1200px] mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/operations"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Initiative Intelligence</h1>
              <p className="text-sm text-neutral-400 mt-0.5">
                Side-hustles accuracy research — signal coverage, prompt progress, model performance
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricStatCard
            icon={<Layers className="w-4 h-4 text-blue-400" />}
            label="Signal Coverage"
            value={`${overallCoverage}%`}
            subtitle={`${measuredSignals} measured, ${partialSignals} partial of ${totalSignals}`}
          />
          <MetricStatCard
            icon={<Activity className="w-4 h-4 text-purple-400" />}
            label="Initiative"
            value={`${data.initiativeProgress.completed}/${data.initiativeProgress.total}`}
            subtitle={`${data.initiativeProgress.pct}% prompts complete`}
          />
          <MetricStatCard
            icon={<Wifi className="w-4 h-4 text-emerald-400" />}
            label="Training Data"
            value={data.trainingFeaturesCount}
            subtitle={`${data.labeledCount} labeled runs`}
          />
          <MetricStatCard
            icon={<TrendingUp className="w-4 h-4 text-amber-400" />}
            label="Model"
            value={data.modelMeta?.version || '—'}
            subtitle={`${data.modelMeta?.featureCount || 0} features`}
          />
        </div>

        {/* Spearman + Signal Coverage Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spearman Card */}
          <div className="lg:col-span-1">
            <SpearmanCard spearman={data.spearman} modelMeta={data.modelMeta} />
          </div>

          {/* Signal Families */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-neutral-300">Signal Coverage by Family</h2>
              <span className="text-[10px] text-neutral-500">{totalSignals} total signals across 5 families</span>
            </div>
            {data.signalFamilies.map((family) => (
              <SignalCoverageBar
                key={family.id}
                label={family.name}
                signalCount={family.total}
                coveragePercent={family.coveragePct}
                accentColor={FAMILY_HEX_COLORS[family.id] || '#3b82f6'}
                icon={FAMILY_ICONS[family.id]}
                signals={family.signals.map(s => ({
                  id: s.id,
                  name: s.name,
                  detail: s.detail,
                  status: s.status,
                }))}
              />
            ))}
          </div>
        </div>

        {/* Initiative Prompt Board */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-neutral-300">Research Initiative — 10-Prompt Sequence</h2>
            <div className="flex items-center gap-2">
              {/* Progress bar */}
              <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all"
                  style={{ width: `${data.initiativeProgress.pct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-neutral-400">{data.initiativeProgress.pct}%</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.prompts.map((prompt) => (
              <ResearchPromptCard
                key={prompt.number}
                number={prompt.number}
                title={prompt.title}
                description={prompt.unlockedNext}
                status={mapPromptStatus(prompt.status)}
                outputPath={prompt.outputDoc ?? undefined}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-neutral-600 pt-4 border-t border-white/[0.03]">
          Last queried {timeAgo(data.queriedAt)} &middot; Side-hustles niche &middot; Contamination firewall active
        </div>
      </div>
    </div>
  );
}
