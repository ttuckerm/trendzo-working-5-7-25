'use client';

/**
 * Prompt 40 — Scheduled actions panel (Chairman dashboard)
 *
 * Lists pending and recently-executed self-scheduled actions with
 * cancel / reschedule controls. System-scheduled actions (from
 * trainer, proactive, cultural, memory) are tagged with a purple
 * "auto" badge; manual Chairman actions get a blue "manual" badge.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  X,
  ChevronDown,
} from 'lucide-react';

type ActionStatus = 'pending' | 'executed' | 'cancelled' | 'failed';

interface ScheduledAction {
  id: string;
  action_type: string;
  trigger_condition: string;
  scheduled_for: string;
  source_subsystem: string;
  status: ActionStatus;
  created_by_system: boolean;
  params: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  executed_at: string | null;
  cancelled_at: string | null;
}

export function ScheduledActionsPanel() {
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = showTerminal
        ? '?limit=20'
        : '?status=pending&limit=20';
      const res = await fetch(`/api/admin/scheduled-actions${qs}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setActions(data.actions || []);
      else setError(data.error || 'Failed to load');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [showTerminal]);

  useEffect(() => {
    load();
  }, [load]);

  const cancelAction = async (id: string) => {
    const res = await fetch('/api/admin/scheduled-actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, op: 'cancel' }),
    });
    if (res.ok) await load();
    else {
      const data = await res.json();
      setError(data.error || 'Cancel failed');
    }
  };

  const rescheduleAction = async (id: string) => {
    // Simple prompt-based reschedule. Browser native prompt is fine
    // for the Chairman-only dashboard; avoids an extra modal component.
    const hours = window.prompt('Reschedule to how many hours from now?', '24');
    if (!hours) return;
    const n = Number(hours);
    if (!Number.isFinite(n) || n <= 0) {
      setError('Invalid hours value');
      return;
    }
    const target = new Date(Date.now() + n * 3600_000).toISOString();
    const res = await fetch('/api/admin/scheduled-actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, op: 'reschedule', scheduled_for: target }),
    });
    if (res.ok) await load();
    else {
      const data = await res.json();
      setError(data.error || 'Reschedule failed');
    }
  };

  const runProcessor = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const res = await fetch('/api/cron/process-scheduled-actions', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setProcessResult(
          `Picked up ${data.picked_up}, executed ${data.executed}, failed ${data.failed}.`,
        );
        await load();
      } else {
        setError(data.error || 'Process failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold flex items-center gap-2">
          <Calendar size={18} className="text-orange-400" />
          Scheduled actions{' '}
          <span className="text-xs text-gray-500 font-normal">({actions.length})</span>
        </h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showTerminal}
              onChange={(e) => setShowTerminal(e.target.checked)}
              className="accent-orange-500"
            />
            Show executed/cancelled
          </label>
          <button
            onClick={runProcessor}
            disabled={processing}
            className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded px-2 py-1 disabled:opacity-50"
          >
            {processing ? 'Running…' : 'Run processor now'}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {processResult && (
        <div className="mb-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg px-3 py-2 text-sm">
          {processResult}
        </div>
      )}

      {actions.length === 0 ? (
        <div className="text-sm text-gray-500">
          No scheduled actions. Atlas subsystems will add them as they observe state transitions.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <ActionRow
              key={action.id}
              action={action}
              expanded={expandedId === action.id}
              onToggle={() =>
                setExpandedId(expandedId === action.id ? null : action.id)
              }
              onCancel={() => cancelAction(action.id)}
              onReschedule={() => rescheduleAction(action.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActionRow({
  action,
  expanded,
  onToggle,
  onCancel,
  onReschedule,
}: {
  action: ScheduledAction;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onReschedule: () => void;
}) {
  const statusIcon = () => {
    if (action.status === 'pending') return <Clock size={14} className="text-yellow-400" />;
    if (action.status === 'executed') return <CheckCircle size={14} className="text-green-400" />;
    if (action.status === 'failed') return <XCircle size={14} className="text-red-400" />;
    return <X size={14} className="text-gray-500" />;
  };

  const dueRelative = (() => {
    const ms = new Date(action.scheduled_for).getTime() - Date.now();
    if (action.status !== 'pending') return new Date(action.scheduled_for).toLocaleString();
    if (ms <= 0) return 'overdue';
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `in ${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return `in ${hrs}h`;
    return `in ${Math.round(hrs / 24)}d`;
  })();

  return (
    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left min-w-0 hover:opacity-80"
        >
          {statusIcon()}
          <span className="text-sm font-mono text-gray-200">{action.action_type}</span>
          <span
            className={`text-xs rounded px-1.5 py-0.5 ${
              action.created_by_system
                ? 'bg-purple-500/20 text-purple-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {action.created_by_system ? 'auto' : 'manual'}
          </span>
          <span className="text-xs text-gray-500">from {action.source_subsystem}</span>
          <span className="text-xs text-gray-500 truncate">· {action.trigger_condition}</span>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400">{dueRelative}</span>
          {action.status === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule();
                }}
                className="text-xs text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded px-2 py-0.5"
              >
                Reschedule
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 rounded px-2 py-0.5"
              >
                Cancel
              </button>
            </>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1a1a2e] space-y-2">
          <div className="text-xs text-gray-400">
            Scheduled for: <span className="text-gray-200">{new Date(action.scheduled_for).toLocaleString()}</span>
          </div>
          {action.params && Object.keys(action.params).length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Params</div>
              <pre className="text-xs bg-black/40 rounded p-2 overflow-x-auto">
                {JSON.stringify(action.params, null, 2)}
              </pre>
            </div>
          )}
          {action.output && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Output</div>
              <pre className="text-xs bg-black/40 rounded p-2 overflow-x-auto max-h-64">
                {JSON.stringify(action.output, null, 2)}
              </pre>
            </div>
          )}
          {action.error_message && (
            <div>
              <div className="text-xs text-red-400 mb-1">Error</div>
              <pre className="text-xs bg-red-500/10 text-red-300 rounded p-2 overflow-x-auto">
                {action.error_message}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ScheduledActionsPanel;
