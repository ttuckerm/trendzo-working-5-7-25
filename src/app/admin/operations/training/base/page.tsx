'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  Settings2,
  Activity,
  Search,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Hash,
  HelpCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ScanConfig {
  id: string;
  niche_key: string;
  enabled: boolean;
  search_mode: string;
  hashtags: string[];
  search_queries: string[];
  max_age_minutes: number;
  min_hearts: number;
  min_views: number;
  poll_interval_minutes: number;
  last_polled_at: string | null;
  next_poll_at: string | null;
  max_apify_calls_per_day: number;
  apify_calls_today: number;
  apify_calls_reset_at: string;
  results_per_page: number;
  created_at: string;
  updated_at: string;
}

interface ScanRun {
  id: string;
  niche_key: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  videos_found: number;
  videos_fresh: number;
  videos_new: number;
  videos_predicted: number;
  schedules_created: number;
  apify_calls_made: number;
  error_message: string | null;
}

interface CheckpointStatus {
  status: string;
  metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  } | null;
  completed_at: string | null;
}

interface TrackerRow {
  id: string;
  video_id: string;
  niche: string;
  source: string;
  predicted_dps_7d: number | null;
  predicted_tier_7d: string | null;
  confidence: number | null;
  actual_dps: number | null;
  actual_tier: string | null;
  labeling_mode: string | null;
  created_at: string;
  tiktok_url: string | null;
  checkpoints: Record<string, CheckpointStatus>;
}

interface CommandCenterData {
  configs: ScanConfig[];
  recent_runs: ScanRun[];
  schedules: {
    pending: number;
    completed: number;
    failed: number;
    by_source: Record<string, { pending: number; completed: number; failed: number }>;
  };
  labeled: {
    total: number;
    last_7d: number;
  };
  latest_evaluation: any | null;
  cost: {
    total_apify_calls_7d: number;
    by_day: Record<string, number>;
  };
  jobs: Record<string, string | null>;
  video_tracker: TrackerRow[];
}

// ── InfoTooltip ────────────────────────────────────────────────────────────────

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<'below' | 'above'>('below');

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      // If less than 220px below the icon, flip above
      setPos(window.innerHeight - rect.bottom < 220 ? 'above' : 'below');
    }
    setShow(true);
  };

  return (
    <span className="relative inline-block" ref={ref}>
      <HelpCircle
        className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span
          className={`absolute z-50 w-80 px-3 py-2.5 text-xs text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl leading-relaxed pointer-events-none ${
            pos === 'below'
              ? 'top-full left-1/2 -translate-x-1/2 mt-2'
              : 'bottom-full left-1/2 -translate-x-1/2 mb-2'
          }`}
        >
          {text}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
              pos === 'below'
                ? 'bottom-full -mb-px border-b-zinc-700'
                : 'top-full -mt-px border-t-zinc-700'
            }`}
          />
        </span>
      )}
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

function statusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-green-400';
    case 'running': return 'text-yellow-400';
    case 'failed': return 'text-red-400';
    default: return 'text-zinc-400';
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [triggerResult, setTriggerResult] = useState<{ action: string; ok: boolean; msg: string } | null>(null);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<Record<string, any> | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/admin/training-command');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error || 'Failed to load');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // ── Trigger action ─────────────────────────────────────────────────────

  async function triggerAction(action: string, nicheKey?: string) {
    setTriggering(action);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/admin/training-command/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, niche_key: nicheKey }),
      });
      const json = await res.json();
      setTriggerResult({
        action,
        ok: json.success,
        msg: json.success
          ? `${action} completed in ${json.elapsed_ms}ms`
          : json.error || 'Failed',
      });
      if (json.success) fetchData();
    } catch (err: any) {
      setTriggerResult({ action, ok: false, msg: err.message });
    } finally {
      setTriggering(null);
    }
  }

  // ── Toggle niche enabled ───────────────────────────────────────────────

  async function toggleNiche(nicheKey: string, enabled: boolean) {
    try {
      await fetch('/api/admin/training-command/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche_key: nicheKey, enabled }),
      });
      fetchData();
    } catch {}
  }

  // ── Save config changes ────────────────────────────────────────────────

  async function saveConfig() {
    if (!editingConfig) return;
    setSavingConfig(true);
    try {
      await fetch('/api/admin/training-command/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingConfig),
      });
      setEditingConfig(null);
      setExpandedConfig(null);
      fetchData();
    } catch {} finally {
      setSavingConfig(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchData} className="mt-2 text-sm text-red-300 underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" />
              Training Base
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Control discovery scans, monitor pipeline health, track Apify costs
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="px-3 py-1.5 bg-zinc-800 rounded text-sm hover:bg-zinc-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Trigger result toast */}
        {triggerResult && (
          <div className={`mb-4 px-4 py-2 rounded text-sm flex items-center gap-2 ${
            triggerResult.ok ? 'bg-green-900/30 border border-green-800 text-green-300' : 'bg-red-900/30 border border-red-800 text-red-300'
          }`}>
            {triggerResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {triggerResult.msg}
            <button onClick={() => setTriggerResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">dismiss</button>
          </div>
        )}

        {/* ────────────── Milestone Alerts ────────────── */}
        {data && (() => {
          const total = data.labeled.total;
          const milestones = [
            { target: 100, action: 'Retrain XGBoost v6 — first model trained on real predicted-vs-actual VPS pairs instead of synthetic features.' },
            { target: 300, action: 'Retrain XGBoost v7 — enough data for per-niche feature weighting and component efficacy analysis.' },
            { target: 500, action: 'Retrain XGBoost v8 — full production model with cross-niche generalization and confidence calibration.' },
          ];
          const nextMilestone = milestones.find(m => total < m.target);
          const reachedMilestones = milestones.filter(m => total >= m.target);

          return (
            <div className="mb-6 space-y-2">
              {/* Reached milestones that need action */}
              {reachedMilestones.map(m => (
                <div key={m.target} className="px-4 py-3 rounded-lg bg-green-900/20 border border-green-800/50 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-green-300">Milestone reached: {m.target} labeled videos</div>
                    <div className="text-xs text-green-400/70 mt-0.5">{m.action}</div>
                  </div>
                </div>
              ))}
              {/* Next milestone progress */}
              {nextMilestone && (
                <div className="px-4 py-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm text-zinc-300">
                      Next milestone: <span className="font-medium text-yellow-300">{nextMilestone.target} labeled videos</span>
                      <span className="text-zinc-500 ml-2">({total}/{nextMilestone.target} — {nextMilestone.target - total} remaining)</span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">{nextMilestone.action}</div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                      <div
                        className="h-full rounded-full bg-yellow-500 transition-all"
                        style={{ width: `${Math.min(100, (total / nextMilestone.target) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ────────────── Section 1: Control Panel ────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-zinc-400" />
            Control Panel
          </h2>

          {/* Global actions */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerAction('scan')}
                disabled={triggering === 'scan'}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm flex items-center gap-1.5"
              >
                {triggering === 'scan' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Scan All Niches
              </button>
              <InfoTooltip text="Searches TikTok for freshly posted videos (within your configured max age, default 5 minutes) matching your hashtags and search queries. Uses the PAID Apify actor. For each new video found, runs a text-only VPS prediction and creates 4 metric checkpoint schedules (4h, 24h, 48h, 7d) with the real TikTok URL. This is how training data enters the system." />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerAction('collect')}
                disabled={triggering === 'collect'}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-sm flex items-center gap-1.5"
              >
                {triggering === 'collect' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Collect Metrics
              </button>
              <InfoTooltip text="Checks for any metric checkpoint schedules that are due (e.g. a 4h checkpoint where 4+ hours have passed). For each due checkpoint, fetches the video's current TikTok metrics — views, likes, comments, shares, saves — using the FREE Apify actor. Writes results back to the schedule row. This is how you get ground truth performance data over time." />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerAction('label')}
                disabled={triggering === 'label'}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-sm flex items-center gap-1.5"
              >
                {triggering === 'label' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Auto-Label
              </button>
              <InfoTooltip text="Finds prediction runs where metric collection is complete but no actual VPS has been computed yet. Takes the collected metrics (typically the 7-day checkpoint) and computes the actual VPS score. Writes actual_dps and actual_tier to each prediction run. This turns raw metric data into labeled training pairs — predicted VPS vs actual VPS — which is the data needed to retrain and improve the model." />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerAction('evaluate')}
                disabled={triggering === 'evaluate'}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded text-sm flex items-center gap-1.5"
              >
                {triggering === 'evaluate' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                Spearman Eval
              </button>
              <InfoTooltip text="Runs Spearman rank correlation across all labeled prediction runs — comparing predicted VPS rankings to actual VPS rankings. Outputs a correlation coefficient (rho from -1 to +1), p-value, MAE, and within-range percentage. This is your accuracy measurement — tells you how well the prediction system is actually performing. Results stored in the vps_evaluation table." />
            </div>

            <button
              onClick={() => triggerAction('pause_all')}
              disabled={triggering === 'pause_all'}
              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 border border-red-800 disabled:opacity-50 rounded text-sm flex items-center gap-1.5"
            >
              {triggering === 'pause_all' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
              Pause All
            </button>
          </div>

          {/* Per-niche config cards */}
          <div className="space-y-3">
            {data.configs.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
                No scan configs found. Run the migration SQL to seed the default side-hustles config.
              </div>
            ) : (
              data.configs.map(cfg => {
                const isExpanded = expandedConfig === cfg.niche_key;
                const isEditing = editingConfig?.niche_key === cfg.niche_key;
                const budgetPct = cfg.max_apify_calls_per_day > 0
                  ? Math.min(100, (cfg.apify_calls_today / cfg.max_apify_calls_per_day) * 100)
                  : 0;

                return (
                  <div key={cfg.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* Enable/disable toggle */}
                        <button
                          onClick={() => toggleNiche(cfg.niche_key, !cfg.enabled)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${
                            cfg.enabled ? 'bg-green-600' : 'bg-zinc-700'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            cfg.enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>

                        <div>
                          <span className="font-medium">{cfg.niche_key}</span>
                          <span className={`ml-2 text-xs ${cfg.enabled ? 'text-green-400' : 'text-zinc-500'}`}>
                            {cfg.enabled ? 'active' : 'paused'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        {/* Budget bar */}
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5" />
                          <div className="w-20 bg-zinc-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${budgetPct}%` }}
                            />
                          </div>
                          <span className="text-xs">{cfg.apify_calls_today}/{cfg.max_apify_calls_per_day}</span>
                        </div>

                        {/* Last poll */}
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" />
                          {timeAgo(cfg.last_polled_at)}
                        </div>

                        {/* Scan now */}
                        <button
                          onClick={() => triggerAction('scan', cfg.niche_key)}
                          disabled={!!triggering}
                          className="px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 rounded text-xs flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Scan
                        </button>

                        {/* Expand */}
                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedConfig(null);
                              setEditingConfig(null);
                            } else {
                              setExpandedConfig(cfg.niche_key);
                              setEditingConfig({
                                niche_key: cfg.niche_key,
                                hashtags: cfg.hashtags,
                                search_queries: cfg.search_queries,
                                search_mode: cfg.search_mode,
                                poll_interval_minutes: cfg.poll_interval_minutes,
                                max_apify_calls_per_day: cfg.max_apify_calls_per_day,
                                max_age_minutes: cfg.max_age_minutes,
                                min_hearts: cfg.min_hearts,
                                min_views: cfg.min_views,
                              });
                            }
                          }}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded config editor */}
                    {isExpanded && isEditing && editingConfig && (
                      <div className="border-t border-zinc-800 px-4 py-4 bg-zinc-900/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {/* Hashtags */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">
                              <Hash className="w-3 h-3 inline mr-1" />Hashtags (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={(editingConfig.hashtags || []).join(', ')}
                              onChange={e => setEditingConfig({
                                ...editingConfig,
                                hashtags: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean),
                              })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Search queries */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">
                              <Search className="w-3 h-3 inline mr-1" />Search Queries (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={(editingConfig.search_queries || []).join(', ')}
                              onChange={e => setEditingConfig({
                                ...editingConfig,
                                search_queries: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean),
                              })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Search mode */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Search Mode</label>
                            <select
                              value={editingConfig.search_mode}
                              onChange={e => setEditingConfig({ ...editingConfig, search_mode: e.target.value })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            >
                              <option value="hashtag">Hashtag</option>
                              <option value="search_query">Search Query</option>
                              <option value="both">Both</option>
                            </select>
                          </div>

                          {/* Poll interval */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Poll Interval (minutes)</label>
                            <input
                              type="number"
                              min={5}
                              value={editingConfig.poll_interval_minutes}
                              onChange={e => setEditingConfig({ ...editingConfig, poll_interval_minutes: parseInt(e.target.value) || 30 })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Max Apify calls */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Max Apify Calls / Day</label>
                            <input
                              type="number"
                              min={0}
                              value={editingConfig.max_apify_calls_per_day}
                              onChange={e => setEditingConfig({ ...editingConfig, max_apify_calls_per_day: parseInt(e.target.value) || 10 })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Max age minutes */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Max Video Age (minutes)</label>
                            <input
                              type="number"
                              min={5}
                              value={editingConfig.max_age_minutes}
                              onChange={e => setEditingConfig({ ...editingConfig, max_age_minutes: parseInt(e.target.value) || 60 })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Min hearts */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Min Hearts</label>
                            <input
                              type="number"
                              min={0}
                              value={editingConfig.min_hearts}
                              onChange={e => setEditingConfig({ ...editingConfig, min_hearts: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>

                          {/* Min views */}
                          <div>
                            <label className="block text-zinc-400 text-xs mb-1">Min Views</label>
                            <input
                              type="number"
                              min={0}
                              value={editingConfig.min_views}
                              onChange={e => setEditingConfig({ ...editingConfig, min_views: parseInt(e.target.value) || 0 })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={saveConfig}
                            disabled={savingConfig}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded text-sm"
                          >
                            {savingConfig ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={() => { setExpandedConfig(null); setEditingConfig(null); }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ────────────── Section 2: Scan Activity ────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-zinc-400" />
            Recent Scan Activity
          </h2>

          {data.recent_runs.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
              No scans yet. Enable a niche and trigger a scan to get started.
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                    <th className="text-left px-4 py-2">Niche</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Time</th>
                    <th className="text-right px-4 py-2">Found</th>
                    <th className="text-right px-4 py-2">Fresh</th>
                    <th className="text-right px-4 py-2">New</th>
                    <th className="text-right px-4 py-2">Predicted</th>
                    <th className="text-right px-4 py-2">Schedules</th>
                    <th className="text-right px-4 py-2">Apify Calls</th>
                    <th className="text-left px-4 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_runs.map(run => (
                    <tr key={run.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="px-4 py-2 font-medium">{run.niche_key}</td>
                      <td className={`px-4 py-2 ${statusColor(run.status)}`}>
                        {run.status === 'running' && <RefreshCw className="w-3 h-3 inline animate-spin mr-1" />}
                        {run.status}
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{timeAgo(run.started_at)}</td>
                      <td className="px-4 py-2 text-right">{run.videos_found}</td>
                      <td className="px-4 py-2 text-right">{run.videos_fresh}</td>
                      <td className="px-4 py-2 text-right text-blue-400">{run.videos_new}</td>
                      <td className="px-4 py-2 text-right">{run.videos_predicted}</td>
                      <td className="px-4 py-2 text-right">{run.schedules_created}</td>
                      <td className="px-4 py-2 text-right">{run.apify_calls_made}</td>
                      <td className="px-4 py-2 text-red-400 text-xs truncate max-w-[200px]">
                        {run.error_message || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ────────────── Section 3: Cost Monitor ────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-zinc-400" />
            Cost Monitor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total 7-day calls */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">Apify Calls (Last 7 Days)</div>
              <div className="text-2xl font-bold">{data.cost.total_apify_calls_7d}</div>
              <div className="text-xs text-zinc-500 mt-1">PAID actor (discovery scans)</div>
            </div>

            {/* Per-niche budget today */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-2">Budget Today (per niche)</div>
              {data.configs.length === 0 ? (
                <div className="text-zinc-500 text-sm">No configs</div>
              ) : (
                <div className="space-y-2">
                  {data.configs.map(cfg => {
                    const pct = cfg.max_apify_calls_per_day > 0
                      ? (cfg.apify_calls_today / cfg.max_apify_calls_per_day) * 100
                      : 0;
                    return (
                      <div key={cfg.niche_key}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className={cfg.enabled ? 'text-zinc-200' : 'text-zinc-500'}>
                            {cfg.niche_key}
                          </span>
                          <span className="text-zinc-400">
                            {cfg.apify_calls_today}/{cfg.max_apify_calls_per_day}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-1.5">
                          <div
                            className={`h-full rounded-full ${
                              pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Daily breakdown */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-2">Daily Breakdown (Last 7 Days)</div>
              {Object.keys(data.cost.by_day).length === 0 ? (
                <div className="text-zinc-500 text-sm">No data</div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(data.cost.by_day).sort(([a], [b]) => b.localeCompare(a)).map(([day, calls]) => (
                    <div key={day} className="flex justify-between text-xs">
                      <span className="text-zinc-400">{day}</span>
                      <span className="text-zinc-200">{calls} calls</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ────────────── Section 4: Video Tracker ────────────── */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-400" />
            Video Tracker
            <InfoTooltip text="Each row is a discovered or user-submitted video. Shows the predicted VPS at scan time, then tracks 4 metric checkpoints (4h, 24h, 48h, 7d). When the 7-day checkpoint completes and auto-labeling runs, the actual VPS appears. The gap between predicted and actual is what trains the model." />
          </h2>

          {(!data.video_tracker || data.video_tracker.length === 0) ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center text-zinc-500">
              No tracked videos yet. Run a discovery scan or submit a video through the creator pipeline.
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs">
                    <th className="text-left px-3 py-2">Source</th>
                    <th className="text-left px-3 py-2">Niche</th>
                    <th className="text-left px-3 py-2">Age</th>
                    <th className="text-right px-3 py-2">Predicted VPS</th>
                    <th className="text-center px-2 py-2">4h</th>
                    <th className="text-center px-2 py-2">24h</th>
                    <th className="text-center px-2 py-2">48h</th>
                    <th className="text-center px-2 py-2">7d</th>
                    <th className="text-right px-3 py-2">Actual VPS</th>
                    <th className="text-left px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {data.video_tracker.map(row => {
                    const checkpointOrder = ['4h', '24h', '48h', '7d'] as const;
                    return (
                      <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                        <td className="px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            row.source === 'discovery_scan' ? 'bg-blue-900/40 text-blue-300' :
                            row.source === 'creator_predict' ? 'bg-purple-900/40 text-purple-300' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {row.source === 'discovery_scan' ? 'discovery' :
                             row.source === 'creator_predict' ? 'creator' : row.source}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-zinc-300 text-xs">{row.niche || '—'}</td>
                        <td className="px-3 py-2 text-zinc-400 text-xs">{timeAgo(row.created_at)}</td>
                        <td className="px-3 py-2 text-right font-mono">
                          {row.predicted_dps_7d != null ? (
                            <span className={
                              row.predicted_dps_7d >= 70 ? 'text-green-400' :
                              row.predicted_dps_7d >= 40 ? 'text-yellow-400' : 'text-red-400'
                            }>
                              {row.predicted_dps_7d.toFixed(1)}
                            </span>
                          ) : '—'}
                          {row.confidence != null && (
                            <span className="text-zinc-600 text-xs ml-1">
                              ({(row.confidence * 100).toFixed(0)}%)
                            </span>
                          )}
                        </td>
                        {checkpointOrder.map(ct => {
                          const cp = row.checkpoints[ct];
                          if (!cp || cp.status === 'not_scheduled') {
                            return <td key={ct} className="px-2 py-2 text-center"><span className="inline-block w-3 h-3 rounded-full bg-zinc-800 border border-zinc-700" title="Not scheduled" /></td>;
                          }
                          if (cp.status === 'completed' && cp.metrics) {
                            const v = cp.metrics.views;
                            const label = v != null ? (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v)) : '?';
                            return (
                              <td key={ct} className="px-2 py-2 text-center" title={`Views: ${v?.toLocaleString() || '?'}, Likes: ${cp.metrics.likes?.toLocaleString() || '?'}, Shares: ${cp.metrics.shares?.toLocaleString() || '?'}`}>
                                <span className="inline-flex items-center gap-0.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                                  <span className="text-xs text-zinc-300">{label}</span>
                                </span>
                              </td>
                            );
                          }
                          if (cp.status === 'pending' || cp.status === 'scheduled') {
                            return <td key={ct} className="px-2 py-2 text-center"><span className="inline-block w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-600 animate-pulse" title={`Scheduled — due ${cp.completed_at ? timeAgo(cp.completed_at) : 'soon'}`} /></td>;
                          }
                          // failed
                          return <td key={ct} className="px-2 py-2 text-center"><span className="inline-block w-3 h-3 rounded-full bg-red-500" title="Failed" /></td>;
                        })}
                        <td className="px-3 py-2 text-right font-mono">
                          {row.actual_dps != null ? (
                            <span className={`font-semibold ${
                              row.actual_dps >= 70 ? 'text-green-400' :
                              row.actual_dps >= 40 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {row.actual_dps.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.actual_dps != null ? (
                            <span className="text-xs text-green-400">labeled</span>
                          ) : row.checkpoints['7d']?.status === 'completed' ? (
                            <span className="text-xs text-yellow-400">awaiting label</span>
                          ) : (
                            <span className="text-xs text-zinc-500">tracking</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {row.tiktok_url && (
                            <a href={row.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs">
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ────────────── Quick Stats + Links ────────────── */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-400" />
            Pipeline Health
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Labeled count */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Labeled Videos</div>
              <div className="text-2xl font-bold">{data.labeled.total}</div>
              <div className="text-xs text-zinc-400 mt-1">
                +{data.labeled.last_7d} this week
              </div>
            </div>

            {/* Schedule totals */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Total Schedules</div>
              <div className="text-2xl font-bold">{data.schedules.pending + data.schedules.completed + data.schedules.failed}</div>
              <div className="text-xs text-zinc-400 mt-1">{data.schedules.pending} pending</div>
            </div>

            {/* Schedules */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Schedules</div>
              <div className="text-sm mt-1 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-zinc-400">pending</span>
                  <span>{data.schedules.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">completed</span>
                  <span>{data.schedules.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">failed</span>
                  <span>{data.schedules.failed}</span>
                </div>
              </div>
            </div>

            {/* Latest Spearman */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500">Spearman Eval</div>
              {data.latest_evaluation ? (
                <>
                  <div className="text-2xl font-bold">
                    {typeof data.latest_evaluation.spearman_rho === 'number'
                      ? data.latest_evaluation.spearman_rho.toFixed(3)
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    n={data.latest_evaluation.n} / {timeAgo(data.latest_evaluation.computed_at)}
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-500 mt-1">No evaluation yet</div>
              )}
            </div>
          </div>

          {/* Job last-run timestamps */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
            <div className="text-xs text-zinc-500 mb-2">Job Last Run</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              {Object.entries(data.jobs).map(([job, lastRun]) => (
                <div key={job} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${lastRun ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  <span className="text-zinc-400">{job.replace(/_/g, ' ')}</span>
                  <span className="text-zinc-500 ml-auto">{timeAgo(lastRun)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links to existing dashboards */}
          <div className="flex flex-wrap gap-3">
            <a
              href="/admin/operations/training/readiness"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Training Readiness Dashboard
            </a>
            <a
              href="/admin/operations/system-health"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Pack Health Dashboard
            </a>
            <a
              href="/admin/operations/training/history"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Training History
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
