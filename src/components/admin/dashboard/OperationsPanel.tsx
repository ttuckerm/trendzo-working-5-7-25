'use client';

/**
 * Prompt 37 — Operations panel (Chairman dashboard)
 *
 * Replaces the Prompt 36 CoordinatorDispatchPanel. Adds:
 *   - Quick-dispatch buttons per task type (no JSON typing required)
 *   - Live progress polling while any visible task is running
 *   - Progress bar, elapsed time, and naive ETA for running tasks
 *   - Re-run entire task button for completed/failed tasks
 *   - Re-run a single failed subtask button
 *   - Searchable history (status, type, text query)
 *
 * Polling rule: every 2 seconds while at least one visible task has
 * status='running' OR 'queued'. Stops polling once all tasks in view
 * are terminal. Reactivates when a new task is dispatched.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Cpu,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  Search,
  Activity,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────

type TaskType =
  | 'monthly_reports'
  | 'niche_analysis'
  | 'batch_dps_regen'
  | 'platform_audit'
  | 'feature_experiment'
  | 'feature_discovery'
  | 'cross_niche_transfer';

type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

interface SubtaskResult {
  label: string;
  ok: true;
  result: unknown;
  subtask_params: Record<string, unknown>;
}

interface SubtaskError {
  label: string;
  ok: false;
  error: string;
  subtask_params: Record<string, unknown>;
}

interface TaskOutput {
  ok: number;
  failed: number;
  results: SubtaskResult[];
  errors: SubtaskError[];
  progress?: { done: number; total: number };
  meta?: Record<string, unknown>;
}

interface TaskRow {
  id: string;
  task_type: TaskType;
  status: TaskStatus;
  input_params: Record<string, unknown>;
  output_result: TaskOutput | null;
  error_message: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// ── Quick-dispatch buttons ──────────────────────────────────────────────

const QUICK_TASKS: {
  type: TaskType;
  label: string;
  params: Record<string, unknown>;
  hint: string;
}[] = [
  {
    type: 'monthly_reports',
    label: 'Monthly Reports',
    params: {},
    hint: 'All active agencies, last 30 days',
  },
  {
    type: 'niche_analysis',
    label: 'Niche Analysis',
    params: {},
    hint: 'All niches from recent cultural scans',
  },
  {
    type: 'platform_audit',
    label: 'Platform Audit',
    params: {},
    hint: 'Platform-wide snapshot',
  },
  {
    type: 'batch_dps_regen',
    label: 'Regenerate DPS',
    params: { max_batches: 2 },
    hint: 'Skeleton: 2 batches of 1,000 rows',
  },
  {
    type: 'feature_discovery',
    label: 'Feature Discovery',
    params: {},
    hint: '5 parallel workers: baseline, +feature ×2, −weakest, hyperparams',
  },
  {
    type: 'cross_niche_transfer',
    label: 'Cross-niche Transfer',
    params: {},
    hint: 'Transfers top features from adjacent niches into a thin niche',
  },
];

// ── Main component ──────────────────────────────────────────────────────

export function OperationsPanel() {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Prompt 41 — track which completed feature_discovery tasks we've
  // already hit the finalize endpoint for, so polling doesn't re-fire it.
  const finalizedRef = useRef<Set<string>>(new Set());

  // ── Load ──
  const loadTasks = useCallback(async () => {
    const qs = new URLSearchParams({ limit: '20' });
    if (statusFilter) qs.set('status', statusFilter);
    if (typeFilter) qs.set('task_type', typeFilter);
    if (searchQuery.trim()) qs.set('q', searchQuery.trim());
    try {
      const res = await fetch(`/api/admin/coordinator/tasks?${qs.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) setTasks(data.tasks || []);
    } catch {
      /* polling tolerates transient errors */
    }
  }, [statusFilter, typeFilter, searchQuery]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // ── Live polling while any task is in-flight ──
  const hasInFlight = useMemo(
    () => tasks.some((t) => t.status === 'running' || t.status === 'queued'),
    [tasks],
  );

  useEffect(() => {
    if (!hasInFlight) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      loadTasks();
      setNowTick(Date.now()); // drive elapsed-time re-renders
    }, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasInFlight, loadTasks]);

  // Prompts 41 + 42 — when a feature_discovery or cross_niche_transfer
  // task completes, auto-call the appropriate finalize endpoint. The
  // dispatcher intentionally has no post-hook, so the UI is the
  // trigger. Each task id is finalized exactly once per session via
  // finalizedRef.
  useEffect(() => {
    const finalizeEndpoints: Partial<Record<TaskType, string>> = {
      feature_discovery: '/api/admin/coordinator/feature-discovery/finalize',
      cross_niche_transfer: '/api/admin/coordinator/cross-niche-transfer/finalize',
    };
    const toFinalize = tasks.filter(
      (t) =>
        finalizeEndpoints[t.task_type] &&
        t.status === 'completed' &&
        !finalizedRef.current.has(t.id),
    );
    if (toFinalize.length === 0) return;
    for (const t of toFinalize) {
      finalizedRef.current.add(t.id);
      const endpoint = finalizeEndpoints[t.task_type]!;
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: t.id }),
      }).catch(() => {
        // Non-fatal. The endpoint is idempotent.
        // eslint-disable-next-line no-console
        console.warn(`[OperationsPanel] ${t.task_type} finalize failed for ${t.id}`);
      });
    }
  }, [tasks]);

  // Also tick nowTick every second so elapsed counters stay live even
  // between poll cycles.
  useEffect(() => {
    if (!hasInFlight) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasInFlight]);

  // ── Dispatch ──
  const dispatch = async (
    taskType: TaskType,
    params: Record<string, unknown>,
    buttonKey: string,
  ) => {
    setDispatching(buttonKey);
    setDispatchError(null);
    try {
      const res = await fetch('/api/admin/coordinator/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_type: taskType, params }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDispatchError(data.error || 'Dispatch failed');
      } else {
        await loadTasks();
        if (data.task_id) setExpandedId(data.task_id);
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
    } finally {
      setDispatching(null);
    }
  };

  const rerunTask = async (taskId: string) => {
    try {
      const res = await fetch('/api/admin/coordinator/rerun-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadTasks();
        if (data.task_id) setExpandedId(data.task_id);
      } else {
        setDispatchError(data.error || 'Re-run failed');
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
    }
  };

  const rerunSubtask = async (taskId: string, subtaskLabel: string) => {
    try {
      const res = await fetch('/api/admin/coordinator/rerun-subtask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, subtask_label: subtaskLabel }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadTasks();
        if (data.task_id) setExpandedId(data.task_id);
      } else {
        setDispatchError(data.error || 'Re-run failed');
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Split tasks into active vs history ──
  const activeTasks = tasks.filter(
    (t) => t.status === 'running' || t.status === 'queued',
  );
  const historyTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed',
  );

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Cpu size={18} className="text-purple-400" />
          Operations
        </h3>
        <button
          onClick={loadTasks}
          className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Quick dispatch row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {QUICK_TASKS.map((qt) => {
          const key = `quick:${qt.type}`;
          const busy = dispatching === key;
          return (
            <button
              key={qt.type}
              onClick={() => dispatch(qt.type, qt.params, key)}
              disabled={busy}
              className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-3 text-left hover:bg-purple-500/20 disabled:opacity-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-purple-400 font-medium text-sm mb-1">
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Play size={14} />
                )}
                {qt.label}
              </div>
              <div className="text-xs text-gray-500">{qt.hint}</div>
            </button>
          );
        })}
      </div>

      {dispatchError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm">
          {dispatchError}
        </div>
      )}

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Activity size={12} className="text-yellow-400 animate-pulse" />
            Active ({activeTasks.length})
          </div>
          <div className="space-y-2">
            {activeTasks.map((task) => (
              <ActiveTaskRow key={task.id} task={task} now={nowTick} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="border-t border-[#1a1a2e] pt-4">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="text-xs text-gray-400">History</div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#1a1a2e] rounded px-2 py-1 text-xs"
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="queued">Queued</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0a0a0f] border border-[#1a1a2e] rounded px-2 py-1 text-xs"
          >
            <option value="">All types</option>
            <option value="monthly_reports">Monthly Reports</option>
            <option value="niche_analysis">Niche Analysis</option>
            <option value="platform_audit">Platform Audit</option>
            <option value="batch_dps_regen">Regenerate DPS</option>
            <option value="feature_experiment">Feature Experiment</option>
          </select>
          <div className="flex items-center gap-1 bg-[#0a0a0f] border border-[#1a1a2e] rounded px-2 py-1">
            <Search size={12} className="text-gray-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search errors…"
              className="bg-transparent text-xs outline-none w-32"
            />
          </div>
        </div>

        {historyTasks.length === 0 ? (
          <div className="text-sm text-gray-500">No tasks in history.</div>
        ) : (
          <div className="space-y-2">
            {historyTasks.map((task) => (
              <HistoryTaskRow
                key={task.id}
                task={task}
                expanded={expandedId === task.id}
                onToggle={() =>
                  setExpandedId(expandedId === task.id ? null : task.id)
                }
                onRerunTask={() => rerunTask(task.id)}
                onRerunSubtask={(label) => rerunSubtask(task.id, label)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Active task row ─────────────────────────────────────────────────────

function ActiveTaskRow({ task, now }: { task: TaskRow; now: number }) {
  const progress = task.output_result?.progress || { done: 0, total: 0 };
  const startedAt = task.started_at ? new Date(task.started_at).getTime() : null;
  const elapsedMs = startedAt ? now - startedAt : 0;
  const elapsedLabel = formatElapsed(elapsedMs);

  // Naive ETA: extrapolate from (elapsed / done) once at least one done.
  let etaLabel: string | null = null;
  if (progress.done >= 1 && progress.total > progress.done && elapsedMs > 0) {
    const perSubtask = elapsedMs / progress.done;
    const remainingMs = perSubtask * (progress.total - progress.done);
    etaLabel = `~${formatElapsed(remainingMs)} remaining`;
  }

  const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  return (
    <div className="bg-[#0a0a0f] border border-yellow-500/30 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Loader2 size={14} className="text-yellow-400 animate-spin" />
          <span className="text-sm font-mono">{task.task_type}</span>
          <span className="text-xs text-gray-500">
            {progress.done}/{progress.total || '?'} subtasks
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {elapsedLabel}
          {etaLabel && <span className="ml-2 text-gray-600">· {etaLabel}</span>}
        </div>
      </div>
      <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── History task row ────────────────────────────────────────────────────

function HistoryTaskRow({
  task,
  expanded,
  onToggle,
  onRerunTask,
  onRerunSubtask,
}: {
  task: TaskRow;
  expanded: boolean;
  onToggle: () => void;
  onRerunTask: () => void;
  onRerunSubtask: (label: string) => void;
}) {
  const statusIcon = () => {
    if (task.status === 'failed')
      return <XCircle size={14} className="text-red-400" />;
    if (task.output_result && task.output_result.failed > 0)
      return <CheckCircle size={14} className="text-yellow-400" />;
    return <CheckCircle size={14} className="text-green-400" />;
  };

  const summary = (() => {
    if (task.status === 'failed') return task.error_message || 'failed';
    if (task.status !== 'completed') return task.status;
    const out = task.output_result;
    if (!out) return 'completed';
    return `${out.ok} ok / ${out.failed} failed`;
  })();

  const elapsedMs =
    task.started_at && task.completed_at
      ? new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()
      : null;

  return (
    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80"
        >
          {statusIcon()}
          <span className="text-sm font-mono">{task.task_type}</span>
          <span className="text-xs text-gray-500 truncate">{summary}</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            {elapsedMs != null ? `${elapsedMs}ms` : new Date(task.created_at).toLocaleTimeString()}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRerunTask();
            }}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 border border-purple-500/30 rounded px-2 py-1"
          >
            <RotateCcw size={10} />
            Re-run
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1a1a2e]">
          <div className="text-xs text-gray-400 mb-1">Input</div>
          <pre className="text-xs bg-black/40 rounded p-2 overflow-x-auto">
            {JSON.stringify(task.input_params, null, 2)}
          </pre>

          {task.error_message && (
            <>
              <div className="text-xs text-red-400 mt-2 mb-1">Dispatcher error</div>
              <pre className="text-xs bg-red-500/10 text-red-300 rounded p-2 overflow-x-auto">
                {task.error_message}
              </pre>
            </>
          )}

          {task.output_result && task.output_result.errors.length > 0 && (
            <>
              <div className="text-xs text-red-400 mt-2 mb-1">
                Failed subtasks ({task.output_result.errors.length})
              </div>
              <div className="space-y-1">
                {task.output_result.errors.map((err, i) => (
                  <div
                    key={i}
                    className="bg-red-500/10 border border-red-500/20 rounded px-2 py-1 flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-red-300 truncate">
                        {err.label}
                      </div>
                      <div className="text-xs text-red-400/70 truncate">
                        {err.error}
                      </div>
                    </div>
                    <button
                      onClick={() => onRerunSubtask(err.label)}
                      className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/30 rounded px-2 py-0.5 flex items-center gap-1 whitespace-nowrap"
                    >
                      <RotateCcw size={10} />
                      Re-run
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {task.output_result && (
            <>
              <div className="text-xs text-gray-400 mt-2 mb-1">
                Full output
              </div>
              <pre className="text-xs bg-black/40 rounded p-2 overflow-x-auto max-h-96">
                {JSON.stringify(task.output_result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = Math.round(ms / 100) / 10;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds - mins * 60);
  return `${mins}m ${rem}s`;
}

export default OperationsPanel;
