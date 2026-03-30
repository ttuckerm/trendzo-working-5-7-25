'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Cpu,
  Key,
  Layers,
  ChevronLeft,
  Zap,
  Server,
  Box,
  Eye,
  EyeOff,
  MinusCircle,
} from 'lucide-react';

// ─── Types (matching API response) ──────────────────────────────────────────

interface ComponentHealth {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'conditional' | 'stub' | 'disabled';
  apiDependency: string | null;
  apiKeyConfigured: boolean | null;
  hasFallback: boolean;
  recentRuns: number;
  successes: number;
  failures: number;
  skipped: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  lastRunAt: string | null;
  lastSuccess: boolean | null;
}

interface PackHealth {
  id: string;
  name: string;
  componentId: string;
  provider: string;
  requiresTranscript: boolean;
  dependsOn: string[];
  recentRuns: number;
  successes: number;
  failures: number;
  successRate: number | null;
  avgLatencyMs: number | null;
  sources: { real: number; mock: number; template: number; unknown: number };
}

interface ApiKeyStatus {
  key: string;
  label: string;
  configured: boolean;
  usedBy: string[];
}

interface SystemHealthData {
  components: ComponentHealth[];
  packs: PackHealth[];
  apiKeys: ApiKeyStatus[];
  modelVersion: string;
  totalRecentRuns: number;
  queryWindow: string;
  queriedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatLatency(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-green-400';
    case 'conditional': return 'text-yellow-400';
    case 'stub': return 'text-orange-400';
    case 'disabled': return 'text-neutral-500';
    default: return 'text-neutral-400';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-500/10 border-green-500/20';
    case 'conditional': return 'bg-yellow-500/10 border-yellow-500/20';
    case 'stub': return 'bg-orange-500/10 border-orange-500/20';
    case 'disabled': return 'bg-neutral-500/10 border-neutral-500/20';
    default: return 'bg-neutral-500/10 border-neutral-500/20';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'active': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
    case 'conditional': return <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />;
    case 'stub': return <MinusCircle className="w-3.5 h-3.5 text-orange-400" />;
    case 'disabled': return <EyeOff className="w-3.5 h-3.5 text-neutral-500" />;
    default: return <Eye className="w-3.5 h-3.5 text-neutral-400" />;
  }
}

function successRateColor(rate: number | null): string {
  if (rate == null) return 'text-neutral-500';
  if (rate >= 90) return 'text-green-400';
  if (rate >= 70) return 'text-yellow-400';
  if (rate >= 50) return 'text-orange-400';
  return 'text-red-400';
}

function SuccessRateBar({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-neutral-500 text-xs">No data</span>;
  const color = rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : rate >= 50 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${rate}%` }} />
      </div>
      <span className={`text-xs font-mono ${successRateColor(rate)}`}>{rate}%</span>
    </div>
  );
}

// ─── Component Type Badge ───────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    quantitative: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    qualitative: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    pattern: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    historical: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/20',
  };
  return (
    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${colors[type] || colors.historical}`}>
      {type}
    </span>
  );
}

// ─── Source Distribution Bar ────────────────────────────────────────────────

function SourceBar({ sources }: { sources: PackHealth['sources'] }) {
  const total = sources.real + sources.mock + sources.template + sources.unknown;
  if (total === 0) return <span className="text-neutral-500 text-xs">No data</span>;

  const segments = [
    { key: 'real', count: sources.real, color: 'bg-green-500', label: 'Real LLM' },
    { key: 'mock', count: sources.mock, color: 'bg-yellow-500', label: 'Heuristic' },
    { key: 'template', count: sources.template, color: 'bg-orange-500', label: 'Template' },
    { key: 'unknown', count: sources.unknown, color: 'bg-neutral-500', label: 'Unknown' },
  ].filter(s => s.count > 0);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 bg-white/5 rounded-full overflow-hidden">
        {segments.map(s => (
          <div
            key={s.key}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {segments.map(s => (
          <span key={s.key} className="text-[10px] text-neutral-400">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.color} mr-1`} />
            {s.label}: {s.count}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/operations/system-health', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Summary counts
  const activeCount = data?.components.filter(c => c.status === 'active').length ?? 0;
  const conditionalCount = data?.components.filter(c => c.status === 'conditional').length ?? 0;
  const disabledCount = data?.components.filter(c => c.status === 'disabled').length ?? 0;
  const keysConfigured = data?.apiKeys.filter(k => k.configured).length ?? 0;
  const keysTotal = data?.apiKeys.length ?? 0;

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/operations"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="w-6 h-6 text-red-500" />
              Pack Health Dashboard
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Real-time component and pack status from prediction pipeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-neutral-500">
              Updated {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load health data: {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ─── Summary Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              icon={<Layers className="w-5 h-5 text-green-400" />}
              label="Active Components"
              value={activeCount}
              sub={`${conditionalCount} conditional, ${disabledCount} disabled`}
            />
            <SummaryCard
              icon={<Box className="w-5 h-5 text-purple-400" />}
              label="Packs"
              value={data.packs.length}
              sub={data.packs.map(p => p.name).join(', ')}
            />
            <SummaryCard
              icon={<Key className="w-5 h-5 text-yellow-400" />}
              label="API Keys"
              value={`${keysConfigured}/${keysTotal}`}
              sub={keysConfigured === keysTotal ? 'All configured' : `${keysTotal - keysConfigured} missing`}
              alert={keysConfigured < keysTotal}
            />
            <SummaryCard
              icon={<Cpu className="w-5 h-5 text-blue-400" />}
              label="XGBoost Model"
              value={data.modelVersion}
              sub={data.queryWindow}
            />
          </div>

          {/* ─── API Key Status ─────────────────────────────────────────────── */}
          <Section title="API Key Status" icon={<Key className="w-4 h-4" />}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.apiKeys.map(ak => (
                <div
                  key={ak.key}
                  className={`p-3 rounded-lg border ${
                    ak.configured
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {ak.configured ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium">{ak.label}</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">{ak.key}</div>
                  {ak.usedBy.length > 0 && (
                    <div className="text-[10px] text-neutral-400 mt-1">
                      Used by: {ak.usedBy.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* ─── Pack Status Cards ──────────────────────────────────────────── */}
          <Section title="Pack Status" icon={<Box className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.packs.map(pack => (
                <div
                  key={pack.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{pack.name}</h3>
                      <span className="text-[10px] text-neutral-500 font-mono">{pack.id}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                        {pack.provider}
                      </span>
                      {pack.requiresTranscript && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          transcript
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className={`text-lg font-bold ${successRateColor(pack.successRate)}`}>
                        {pack.successRate != null ? `${pack.successRate}%` : '—'}
                      </div>
                      <div className="text-[10px] text-neutral-500">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-neutral-200">
                        {formatLatency(pack.avgLatencyMs)}
                      </div>
                      <div className="text-[10px] text-neutral-500">Avg Latency</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-neutral-200">{pack.recentRuns}</div>
                      <div className="text-[10px] text-neutral-500">Recent Runs</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-neutral-500 mb-1">Source Distribution</div>
                    <SourceBar sources={pack.sources} />
                  </div>

                  {pack.dependsOn.length > 0 && (
                    <div className="text-[10px] text-neutral-500">
                      Depends on: {pack.dependsOn.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* ─── Component Status Grid ─────────────────────────────────────── */}
          <Section title="Component Status Grid" icon={<Server className="w-4 h-4" />}>
            <div className="text-xs text-neutral-500 mb-3">
              {data.totalRecentRuns} recent prediction runs analyzed &middot; {data.queryWindow}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Active</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-400" /> Conditional (needs API key)</span>
              <span className="flex items-center gap-1"><EyeOff className="w-3 h-3 text-neutral-500" /> Disabled</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-[11px] uppercase tracking-wider text-neutral-500">
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Component</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">API Key</th>
                    <th className="py-2 pr-3">Success Rate</th>
                    <th className="py-2 pr-3">Runs</th>
                    <th className="py-2 pr-3">Avg Latency</th>
                    <th className="py-2 pr-3">Last Run</th>
                  </tr>
                </thead>
                <tbody>
                  {data.components.map(comp => (
                    <tr
                      key={comp.id}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon status={comp.status} />
                          <span className={`text-[10px] capitalize ${statusColor(comp.status)}`}>
                            {comp.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div>
                          <span className="text-neutral-200">{comp.name}</span>
                          <div className="text-[10px] text-neutral-600 font-mono">{comp.id}</div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <TypeBadge type={comp.type} />
                      </td>
                      <td className="py-2.5 pr-3">
                        {comp.apiDependency ? (
                          <div className="flex items-center gap-1">
                            {comp.apiKeyConfigured ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {comp.apiDependency.replace(/_/g, '_')}
                            </span>
                            {comp.hasFallback && (
                              <span className="text-[9px] text-orange-400 ml-1">(fallback)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-600 text-[10px]">none</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <SuccessRateBar rate={comp.successRate} />
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="text-xs font-mono text-neutral-300">
                          {comp.recentRuns > 0 ? (
                            <span>
                              {comp.successes}<span className="text-green-500">/</span>
                              {comp.failures > 0 && <span className="text-red-400">{comp.failures}F</span>}
                              {comp.failures === 0 && <span className="text-neutral-500">0F</span>}
                              {comp.skipped > 0 && <span className="text-neutral-500"> +{comp.skipped}S</span>}
                            </span>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs font-mono text-neutral-400">
                          {formatLatency(comp.avgLatencyMs)}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {comp.lastRunAt ? (
                          <div className="flex items-center gap-1">
                            {comp.lastSuccess ? (
                              <CheckCircle className="w-3 h-3 text-green-400" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400" />
                            )}
                            <span className="text-[10px] text-neutral-500">
                              {timeAgo(comp.lastRunAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-600 text-[10px]">never</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// ─── Reusable Sub-Components ────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  alert?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      alert ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-white/[0.02] border-white/[0.06]'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-neutral-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold text-neutral-100">{value}</div>
      <div className="text-[11px] text-neutral-500 mt-0.5">{sub}</div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-300 flex items-center gap-2 mb-3">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}
