'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  RotateCcw,
  X,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ChairmanAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string | null;
  payload: any;
  action_type: string | null;
  action_payload: any;
  status: 'open' | 'resolved' | 'dismissed';
  agency_id: string | null;
  created_at: string;
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ChairmanAlertsBanner() {
  const [alerts, setAlerts] = useState<ChairmanAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chairman-alerts?status=open');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch chairman alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    // Poll every 60s so newly-written validator alerts appear without a refresh
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleDismiss = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/chairman-alerts?action=dismiss&id=${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: 'chairman' }),
      });
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRollback = async (alert: ChairmanAlert) => {
    if (alert.action_type !== 'rollback_model') return;
    const niche = alert.action_payload?.niche ?? null;
    const scope = niche || 'global';
    if (!confirm(`Roll back the ${scope} model to the previous version?\n\nReason: ${alert.title}\n\nThis will deactivate the current production model and re-activate the previous one.`)) {
      return;
    }
    setBusyId(alert.id);
    try {
      const nicheParam = niche ? `&niche=${encodeURIComponent(niche)}` : '&niche=';
      const res = await fetch(`/api/admin/trainer?action=rollback${nicheParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: `Auto-rollback from chairman_alert ${alert.id}: ${alert.title}`,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        window.alert(data.error || 'Rollback failed');
        return;
      }
      // Resolve the alert now that the rollback succeeded
      await fetch(`/api/admin/chairman-alerts?action=resolve&id=${alert.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved_by: 'chairman' }),
      });
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
    } catch (err: any) {
      window.alert(`Rollback error: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  const headerBg =
    criticalCount > 0
      ? 'from-red-900/40 to-red-950/20 border-red-500/40'
      : warningCount > 0
      ? 'from-yellow-900/30 to-yellow-950/10 border-yellow-500/30'
      : 'from-blue-900/20 to-blue-950/10 border-blue-500/20';

  return (
    <div className={`bg-gradient-to-r ${headerBg} border rounded-xl overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {criticalCount > 0 ? (
            <AlertOctagon size={22} className="text-red-400" />
          ) : warningCount > 0 ? (
            <AlertTriangle size={22} className="text-yellow-400" />
          ) : (
            <Info size={22} className="text-blue-400" />
          )}
          <div className="text-left">
            <div className="font-semibold text-white">
              {alerts.length} open alert{alerts.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-gray-400">
              {criticalCount > 0 && <span className="text-red-400">{criticalCount} critical</span>}
              {criticalCount > 0 && (warningCount > 0 || infoCount > 0) && ' · '}
              {warningCount > 0 && <span className="text-yellow-400">{warningCount} warning</span>}
              {warningCount > 0 && infoCount > 0 && ' · '}
              {infoCount > 0 && <span className="text-blue-400">{infoCount} info</span>}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-white/5 divide-y divide-white/5">
          {alerts.map(alert => {
            const severityColor =
              alert.severity === 'critical'
                ? 'border-l-red-500'
                : alert.severity === 'warning'
                ? 'border-l-yellow-500'
                : 'border-l-blue-500';
            const canRollback = alert.action_type === 'rollback_model';

            return (
              <div
                key={alert.id}
                className={`p-4 border-l-4 ${severityColor} flex items-start gap-4`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded px-1.5 py-0.5 font-mono uppercase tracking-wider">
                        agency
                      </span>
                    )}
                    <span className="text-[10px] text-gray-500">{formatWhen(alert.created_at)}</span>
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{alert.title}</div>
                  {alert.body && (
                    <div className="text-xs text-gray-400 leading-relaxed">{alert.body}</div>
                  )}
                  {alert.payload && (alert.payload.before_spearman != null || alert.payload.post_spearman != null) && (
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      {alert.payload.before_spearman != null && (
                        <div>
                          <span className="text-gray-500">Before ρ </span>
                          <span className="font-mono text-gray-300">{Number(alert.payload.before_spearman).toFixed(4)}</span>
                        </div>
                      )}
                      {alert.payload.post_spearman != null && (
                        <div>
                          <span className="text-gray-500">After ρ </span>
                          <span className="font-mono text-gray-300">{Number(alert.payload.post_spearman).toFixed(4)}</span>
                        </div>
                      )}
                      {alert.payload.delta != null && (
                        <div>
                          <span className="text-gray-500">Δ </span>
                          <span className={`font-mono ${Number(alert.payload.delta) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {Number(alert.payload.delta) >= 0 ? '+' : ''}{Number(alert.payload.delta).toFixed(4)}
                          </span>
                        </div>
                      )}
                      {alert.payload.sample_size != null && (
                        <div>
                          <span className="text-gray-500">n </span>
                          <span className="font-mono text-gray-300">{alert.payload.sample_size}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {canRollback && (
                    <button
                      onClick={() => handleRollback(alert)}
                      disabled={busyId === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-300 bg-orange-500/15 border border-orange-500/30 rounded-md hover:bg-orange-500/25 transition-colors disabled:opacity-40"
                    >
                      {busyId === alert.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      Rollback Now
                    </button>
                  )}
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    disabled={busyId === alert.id}
                    title="Dismiss alert"
                    className="p-1.5 text-gray-500 hover:text-white rounded hover:bg-white/5 disabled:opacity-40"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChairmanAlertsBanner;
