'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Info,
  Check,
  CheckCircle,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  Eye,
  BellOff,
  XCircle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AlertDetailModal, type AlertDetail } from './AlertDetailModal';

// ── Types ──────────────────────────────────────────────────────────────

interface Alert extends AlertDetail {}

interface SummaryMetrics {
  active_agencies: number;
  platform_spearman: {
    rho: number;
    n: number;
    mae: number;
    within_range_pct: number;
    computed_at: string;
  } | null;
  alerts_this_week: {
    total: number;
    by_severity: { critical: number; warning: number; info: number };
    by_status: Record<string, number>;
  };
}

type TabKey = 'active' | 'snoozed' | 'history';

const HISTORY_PAGE_SIZE = 50;

// ── Helpers ────────────────────────────────────────────────────────────

function formatWhen(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function severityRank(s: Alert['severity']) {
  return s === 'critical' ? 0 : s === 'warning' ? 1 : 2;
}

function severityIcon(s: Alert['severity']) {
  if (s === 'critical') return <AlertOctagon size={16} className="text-red-400" />;
  if (s === 'warning') return <AlertTriangle size={16} className="text-yellow-400" />;
  return <Info size={16} className="text-blue-400" />;
}

function severityBorder(s: Alert['severity']) {
  if (s === 'critical') return 'border-l-red-500';
  if (s === 'warning') return 'border-l-yellow-500';
  return 'border-l-blue-500';
}

function sortedBySeverityThenDate(alerts: Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    const sev = severityRank(a.severity) - severityRank(b.severity);
    if (sev !== 0) return sev;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

// Payload preview — pulls known numeric fields for a compact display
function payloadPreview(payload: any): Array<{ label: string; value: string; tone?: 'good' | 'bad' }> {
  if (!payload || typeof payload !== 'object') return [];
  const chips: Array<{ label: string; value: string; tone?: 'good' | 'bad' }> = [];

  if (payload.before_spearman != null && payload.post_spearman != null) {
    chips.push({ label: 'Before ρ', value: Number(payload.before_spearman).toFixed(4) });
    chips.push({ label: 'After ρ', value: Number(payload.post_spearman).toFixed(4) });
  }
  if (payload.delta != null) {
    const v = Number(payload.delta);
    chips.push({
      label: 'Δ',
      value: (v >= 0 ? '+' : '') + v.toFixed(4),
      tone: v < 0 ? 'bad' : 'good',
    });
  }
  if (payload.pct_change != null) {
    const v = Number(payload.pct_change);
    chips.push({
      label: 'Δ%',
      value: (v >= 0 ? '+' : '') + v.toFixed(1) + '%',
      tone: v < 0 ? 'bad' : 'good',
    });
  }
  if (payload.sample_size != null) {
    chips.push({ label: 'n', value: String(payload.sample_size) });
  }
  if (payload.stale_members != null && payload.total_members != null) {
    chips.push({
      label: 'Stale',
      value: `${payload.stale_members}/${payload.total_members}`,
      tone: 'bad',
    });
  }
  if (payload.days_until_renewal != null) {
    chips.push({ label: 'Renews in', value: `${payload.days_until_renewal}d` });
  }

  return chips;
}

// ── Component ──────────────────────────────────────────────────────────

export function PlatformHealthPanel() {
  const [tab, setTab] = useState<TabKey>('active');
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [snoozedAlerts, setSnoozedAlerts] = useState<Alert[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<Alert[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyOffset, setHistoryOffset] = useState(0);

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // History filters
  const [historyQ, setHistoryQ] = useState('');
  const [historyType, setHistoryType] = useState('');
  const [historySince, setHistorySince] = useState('');
  const [historyUntil, setHistoryUntil] = useState('');

  // ── Data loaders ─────────────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chairman-alerts/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Summary fetch failed:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadActive = useCallback(async () => {
    const res = await fetch('/api/admin/chairman-alerts?view=active&limit=100');
    if (res.ok) {
      const data = await res.json();
      setActiveAlerts(data.alerts || []);
    }
  }, []);

  const loadSnoozed = useCallback(async () => {
    const res = await fetch('/api/admin/chairman-alerts?view=snoozed&limit=100');
    if (res.ok) {
      const data = await res.json();
      setSnoozedAlerts(data.alerts || []);
    }
  }, []);

  const loadHistory = useCallback(
    async (reset: boolean) => {
      const offset = reset ? 0 : historyOffset;
      const params = new URLSearchParams();
      params.set('view', 'history');
      params.set('limit', String(HISTORY_PAGE_SIZE));
      params.set('offset', String(offset));
      if (historyQ) params.set('q', historyQ);
      if (historyType) params.set('alert_type', historyType);
      if (historySince) params.set('since', new Date(historySince).toISOString());
      if (historyUntil) params.set('until', new Date(historyUntil).toISOString());

      const res = await fetch(`/api/admin/chairman-alerts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryTotal(data.total || 0);
        if (reset) {
          setHistoryAlerts(data.alerts || []);
          setHistoryOffset(HISTORY_PAGE_SIZE);
        } else {
          setHistoryAlerts(prev => [...prev, ...(data.alerts || [])]);
          setHistoryOffset(offset + HISTORY_PAGE_SIZE);
        }
      }
    },
    [historyOffset, historyQ, historyType, historySince, historyUntil],
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSummary(), loadActive(), loadSnoozed()]);
    if (tab === 'history') await loadHistory(true);
    setLoading(false);
  }, [loadSummary, loadActive, loadSnoozed, loadHistory, tab]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      loadSummary();
      loadActive();
      loadSnoozed();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When user switches to history tab for the first time, load it
  useEffect(() => {
    if (tab === 'history' && historyAlerts.length === 0 && !loading) {
      loadHistory(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Actions ──────────────────────────────────────────────────────

  const doAction = async (
    alert: Alert,
    action: 'acknowledge' | 'snooze' | 'resolve' | 'dismiss',
  ) => {
    setBusyId(alert.id);
    try {
      const body: any = {};
      if (action === 'snooze') body.hours = 24;
      const res = await fetch(
        `/api/admin/chairman-alerts?action=${action}&id=${alert.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!data.success) {
        window.alert(data.error || `${action} failed`);
        return;
      }
      // Optimistic local update — remove from current list
      if (action === 'snooze' || action === 'resolve' || action === 'dismiss') {
        setActiveAlerts(prev => prev.filter(a => a.id !== alert.id));
      }
      if (action === 'acknowledge') {
        // Update in place so the status changes visibly
        setActiveAlerts(prev =>
          prev.map(a =>
            a.id === alert.id
              ? { ...a, status: 'acknowledged', acknowledged_at: new Date().toISOString() }
              : a,
          ),
        );
      }
      // Kick a background refresh so the other tabs catch up
      loadSnoozed();
      loadSummary();
    } catch (err: any) {
      window.alert(`${action} error: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  // ── Derived data ────────────────────────────────────────────────

  const sortedActive = useMemo(() => sortedBySeverityThenDate(activeAlerts), [activeAlerts]);
  const sortedSnoozed = useMemo(() => sortedBySeverityThenDate(snoozedAlerts), [snoozedAlerts]);

  const alertTypeOptions = useMemo(() => {
    const all = new Set<string>();
    [...activeAlerts, ...snoozedAlerts, ...historyAlerts].forEach(a => all.add(a.alert_type));
    return Array.from(all).sort();
  }, [activeAlerts, snoozedAlerts, historyAlerts]);

  // ── Render ──────────────────────────────────────────────────────

  const currentList = tab === 'active' ? sortedActive : tab === 'snoozed' ? sortedSnoozed : historyAlerts;

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/15 rounded-lg">
            <Activity size={20} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Platform Health</h3>
            <p className="text-xs text-gray-400">Proactive alerts from the monitoring engine</p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard
          icon={<Users size={16} className="text-purple-400" />}
          label="Active Agencies"
          value={summary ? String(summary.active_agencies) : '—'}
          loading={summaryLoading}
        />
        <SummaryCard
          icon={<TrendingUp size={16} className="text-cyan-400" />}
          label="Platform Accuracy (ρ)"
          value={
            summary?.platform_spearman
              ? summary.platform_spearman.rho.toFixed(4)
              : '—'
          }
          sub={
            summary?.platform_spearman
              ? `n=${summary.platform_spearman.n} · ${new Date(summary.platform_spearman.computed_at).toLocaleDateString()}`
              : undefined
          }
          loading={summaryLoading}
        />
        <SummaryCard
          icon={<AlertTriangle size={16} className="text-yellow-400" />}
          label="Alerts This Week"
          value={summary ? String(summary.alerts_this_week.total) : '—'}
          sub={
            summary
              ? `${summary.alerts_this_week.by_severity.critical} crit · ${summary.alerts_this_week.by_severity.warning} warn`
              : undefined
          }
          loading={summaryLoading}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#1a1a2e]">
        <TabButton
          label="Active"
          count={sortedActive.length}
          selected={tab === 'active'}
          onClick={() => setTab('active')}
        />
        <TabButton
          label="Snoozed"
          count={sortedSnoozed.length}
          selected={tab === 'snoozed'}
          onClick={() => setTab('snoozed')}
        />
        <TabButton
          label="History"
          count={historyTotal}
          selected={tab === 'history'}
          onClick={() => setTab('history')}
        />
      </div>

      {/* History filters */}
      {tab === 'history' && (
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 mb-4">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={historyQ}
              onChange={e => setHistoryQ(e.target.value)}
              placeholder="Search title or body…"
              className="w-full pl-7 pr-3 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-xs text-white focus:border-purple-500/50 focus:outline-none"
            />
          </div>
          <select
            value={historyType}
            onChange={e => setHistoryType(e.target.value)}
            className="px-3 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-xs text-white focus:border-purple-500/50 focus:outline-none"
          >
            <option value="">All types</option>
            {alertTypeOptions.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="date"
            value={historySince}
            onChange={e => setHistorySince(e.target.value)}
            className="px-2 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-xs text-white focus:border-purple-500/50 focus:outline-none"
          />
          <input
            type="date"
            value={historyUntil}
            onChange={e => setHistoryUntil(e.target.value)}
            className="px-2 py-2 bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg text-xs text-white focus:border-purple-500/50 focus:outline-none"
          />
          <button
            onClick={() => loadHistory(true)}
            className="px-3 py-2 text-xs font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 rounded-lg hover:bg-purple-500/25 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      {/* List */}
      {loading && currentList.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
          <Loader2 size={16} className="animate-spin" />
          Loading alerts…
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-2">
          {currentList.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              busy={busyId === alert.id}
              onAction={doAction}
              onInvestigate={() => setSelectedAlert(alert)}
              isHistory={tab === 'history'}
              isSnoozed={tab === 'snoozed'}
            />
          ))}
        </div>
      )}

      {/* Load more for history */}
      {tab === 'history' && historyAlerts.length < historyTotal && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => loadHistory(false)}
            className="px-4 py-2 text-xs font-medium text-gray-300 bg-white/5 border border-[#1a1a2e] rounded-lg hover:bg-white/10 transition-colors"
          >
            Load more ({historyAlerts.length}/{historyTotal})
          </button>
        </div>
      )}

      {/* Detail modal */}
      <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-3.5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      </div>
      <div className="text-2xl font-semibold text-white font-mono">
        {loading ? <span className="text-gray-600">—</span> : value}
      </div>
      {sub && <div className="text-[10px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function TabButton({
  label,
  count,
  selected,
  onClick,
}: {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
        selected
          ? 'text-white border-emerald-500'
          : 'text-gray-400 border-transparent hover:text-gray-200'
      }`}
    >
      {label}
      <span
        className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
          selected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-gray-500'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  if (tab === 'active') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle size={32} className="text-emerald-400/60 mb-3" />
        <div className="text-sm font-medium text-white mb-1">All systems nominal</div>
        <div className="text-xs text-gray-500">
          No active alerts. The monitor will surface new issues here automatically.
        </div>
      </div>
    );
  }
  if (tab === 'snoozed') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BellOff size={28} className="text-gray-500 mb-3" />
        <div className="text-sm text-gray-400">No snoozed alerts</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Clock size={28} className="text-gray-500 mb-3" />
      <div className="text-sm text-gray-400">No alerts match these filters</div>
    </div>
  );
}

function AlertCard({
  alert,
  busy,
  onAction,
  onInvestigate,
  isHistory,
  isSnoozed,
}: {
  alert: Alert;
  busy: boolean;
  onAction: (a: Alert, action: 'acknowledge' | 'snooze' | 'resolve' | 'dismiss') => void;
  onInvestigate: () => void;
  isHistory: boolean;
  isSnoozed: boolean;
}) {
  const chips = payloadPreview(alert.payload);

  return (
    <div
      className={`bg-[#0a0a0f] border border-[#1a1a2e] border-l-4 ${severityBorder(alert.severity)} rounded-lg p-4 flex items-start gap-4`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {severityIcon(alert.severity)}
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              alert.severity === 'critical'
                ? 'bg-red-500/20 text-red-300'
                : alert.severity === 'warning'
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {alert.severity}
          </span>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            {alert.alert_type}
          </span>
          {alert.agency_id && (
            <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-0.5 font-mono uppercase tracking-wider flex items-center gap-1">
              <Building2 size={9} />
              agency
            </span>
          )}
          {alert.status === 'acknowledged' && (
            <span className="text-[10px] text-cyan-300 bg-cyan-500/15 rounded px-1.5 py-0.5 uppercase tracking-wider">
              acknowledged
            </span>
          )}
          {alert.status === 'resolved' && (
            <span className="text-[10px] text-emerald-300 bg-emerald-500/15 rounded px-1.5 py-0.5 uppercase tracking-wider">
              resolved
            </span>
          )}
          {alert.status === 'dismissed' && (
            <span className="text-[10px] text-gray-400 bg-gray-500/15 rounded px-1.5 py-0.5 uppercase tracking-wider">
              dismissed
            </span>
          )}
          <span className="text-[10px] text-gray-500 ml-auto">{formatWhen(alert.created_at)}</span>
        </div>
        <div className="text-sm font-medium text-white mb-1">{alert.title}</div>
        {alert.body && (
          <div className="text-xs text-gray-400 leading-relaxed line-clamp-2">{alert.body}</div>
        )}
        {chips.length > 0 && (
          <div className="mt-2 flex items-center gap-3 text-[11px] flex-wrap">
            {chips.map((c, i) => (
              <div key={i}>
                <span className="text-gray-500">{c.label} </span>
                <span
                  className={`font-mono ${
                    c.tone === 'bad' ? 'text-red-400' : c.tone === 'good' ? 'text-green-400' : 'text-gray-300'
                  }`}
                >
                  {c.value}
                </span>
              </div>
            ))}
          </div>
        )}
        {isSnoozed && alert.snoozed_until && (
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
            <Clock size={10} />
            Wakes {formatWhen(alert.snoozed_until)}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {/* Investigate always available */}
        <button
          onClick={onInvestigate}
          disabled={busy}
          title="View full alert details"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded hover:bg-purple-500/20 transition-colors disabled:opacity-40"
        >
          <Eye size={11} />
          Investigate
        </button>

        {!isHistory && !isSnoozed && (
          <>
            {alert.status !== 'acknowledged' && (
              <button
                onClick={() => onAction(alert, 'acknowledge')}
                disabled={busy}
                title="Mark as seen, condition still exists"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded hover:bg-cyan-500/20 transition-colors disabled:opacity-40"
              >
                <Check size={11} />
                Acknowledge
              </button>
            )}
            <button
              onClick={() => onAction(alert, 'resolve')}
              disabled={busy}
              title="Condition is fixed"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
              Resolve
            </button>
            <button
              onClick={() => onAction(alert, 'snooze')}
              disabled={busy}
              title="Hide for 24 hours"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 bg-white/5 border border-[#1a1a2e] rounded hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <BellOff size={11} />
              Snooze 24h
            </button>
            <button
              onClick={() => onAction(alert, 'dismiss')}
              disabled={busy}
              title="Not actionable / noise"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-300 rounded hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              <XCircle size={11} />
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PlatformHealthPanel;
