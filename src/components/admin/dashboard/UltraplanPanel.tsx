'use client';

/**
 * Prompt 38 — ULTRAPLAN / Agent2 panel (Chairman dashboard)
 *
 * A remote Opus planning session launcher + reviewer. The Chairman
 * types a prompt, flips test-mode on/off, and optionally overrides
 * cost caps. When the session finishes streaming, the panel shows
 * the plan with Approve / Reject buttons.
 *
 * Safety-first defaults:
 *   - test_mode defaults to ON. Every new session is free unless the
 *     requester explicitly flips the switch.
 *   - When test_mode is ON the cap sliders are hidden (they don't
 *     matter and it's less clutter).
 *   - When test_mode is OFF, a red warning banner makes it obvious
 *     that the next click will charge real money.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

type SessionStatus =
  | 'queued'
  | 'running'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'failed';

interface PlanOutput {
  partial_text?: string;
  text?: string;
  thinking_text?: string;
  thinking?: string;
  blocks_count?: number;
  usage?: { input_tokens: number; output_tokens: number };
  stop_reason?: string | null;
  model?: string;
  test_mode?: boolean;
}

interface PlanningSession {
  id: string;
  requester_role: 'chairman' | 'agency';
  agency_id: string | null;
  input_prompt: string;
  model_used: string | null;
  status: SessionStatus;
  plan_output: PlanOutput | null;
  error_message: string | null;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cap_max_seconds: number;
  cap_max_output_tokens: number;
  cap_max_cost_usd: number;
  test_mode: boolean;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

// Cap defaults mirror the constants in src/lib/planning/types.ts.
const DEFAULT_CAP_SECONDS = 600;
const DEFAULT_CAP_TOKENS = 50_000;
const DEFAULT_CAP_COST = 5;

const MAX_CAP_SECONDS = 1800;
const MAX_CAP_TOKENS = 100_000;
const MAX_CAP_COST = 15;

export function UltraplanPanel() {
  const [prompt, setPrompt] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [showCaps, setShowCaps] = useState(false);
  const [capSeconds, setCapSeconds] = useState(DEFAULT_CAP_SECONDS);
  const [capTokens, setCapTokens] = useState(DEFAULT_CAP_TOKENS);
  const [capCost, setCapCost] = useState(DEFAULT_CAP_COST);

  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<PlanningSession[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/planning/sessions?limit=10', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } catch {
      /* tolerate transient errors while polling */
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Poll while any session is queued or running.
  const hasInFlight = sessions.some(
    (s) => s.status === 'queued' || s.status === 'running',
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
      loadSessions();
      setNowTick(Date.now());
    }, 2000);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [hasInFlight, loadSessions]);

  useEffect(() => {
    if (!hasInFlight) return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasInFlight]);

  const handleDispatch = async () => {
    if (!prompt.trim()) {
      setDispatchError('Enter a prompt first.');
      return;
    }
    setDispatching(true);
    setDispatchError(null);
    try {
      const res = await fetch('/api/admin/planning/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_role: 'chairman',
          input_prompt: prompt.trim(),
          test_mode: testMode,
          caps: showCaps
            ? {
                maxSeconds: capSeconds,
                maxOutputTokens: capTokens,
                maxCostUsd: capCost,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDispatchError(data.error || 'Dispatch failed');
      } else {
        setPrompt('');
        await loadSessions();
        if (data.session_id) setExpandedId(data.session_id);
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
    } finally {
      setDispatching(false);
    }
  };

  const handleDecision = async (sessionId: string, decision: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/planning/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, decision }),
      });
      if (res.ok) await loadSessions();
      else {
        const data = await res.json();
        setDispatchError(data.error || 'Decision failed');
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain size={18} className="text-cyan-400" />
          ULTRAPLAN (Agent2)
        </h3>
        <button
          onClick={loadSessions}
          className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Dispatch form */}
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should Opus plan for you? (e.g. Analyze platform health and recommend 3 product changes.)"
          rows={3}
          className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm"
          disabled={dispatching}
        />

        {/* Test mode toggle */}
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
              className="accent-cyan-500"
            />
            <span className="text-gray-300">
              Test mode{' '}
              <span className="text-xs text-gray-500">
                (canned fake response, zero cost)
              </span>
            </span>
          </label>
          <button
            onClick={() => setShowCaps((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-300"
          >
            {showCaps ? 'Hide caps' : 'Override caps'}
          </button>
        </div>

        {/* Real-mode warning */}
        {!testMode && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-400">Real Opus call — costs money.</div>
              Your next dispatch will call Claude Opus and be billed against
              your Anthropic account. Caps will abort the session at{' '}
              {(showCaps ? capCost : DEFAULT_CAP_COST).toFixed(2)} USD /{' '}
              {(showCaps ? capSeconds : DEFAULT_CAP_SECONDS) / 60} min /{' '}
              {((showCaps ? capTokens : DEFAULT_CAP_TOKENS) / 1000).toFixed(0)}k
              tokens, whichever trips first.
            </div>
          </div>
        )}

        {/* Cap override sliders */}
        {showCaps && (
          <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg p-3 space-y-2">
            <CapRow
              icon={<Clock size={12} />}
              label="Max duration"
              value={`${Math.round(capSeconds / 60)} min`}
              min={60}
              max={MAX_CAP_SECONDS}
              step={60}
              current={capSeconds}
              onChange={setCapSeconds}
            />
            <CapRow
              icon={<span className="text-xs">#</span>}
              label="Max output tokens"
              value={`${(capTokens / 1000).toFixed(0)}k`}
              min={1000}
              max={MAX_CAP_TOKENS}
              step={1000}
              current={capTokens}
              onChange={setCapTokens}
            />
            <CapRow
              icon={<DollarSign size={12} />}
              label="Max cost"
              value={`$${capCost.toFixed(2)}`}
              min={1}
              max={MAX_CAP_COST}
              step={0.5}
              current={capCost}
              onChange={setCapCost}
            />
          </div>
        )}

        <button
          onClick={handleDispatch}
          disabled={dispatching || !prompt.trim()}
          className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg px-4 py-2 text-sm hover:bg-cyan-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {dispatching ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {dispatching ? 'Starting…' : testMode ? 'Run (test mode)' : 'Run for real'}
        </button>

        {dispatchError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2 text-sm">
            {dispatchError}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      <div className="mt-5 border-t border-[#1a1a2e] pt-4">
        <div className="text-xs text-gray-400 mb-2">Recent sessions</div>
        {sessions.length === 0 ? (
          <div className="text-sm text-gray-500">No planning sessions yet.</div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                expanded={expandedId === session.id}
                now={nowTick}
                onToggle={() =>
                  setExpandedId(expandedId === session.id ? null : session.id)
                }
                onDecision={(decision) => handleDecision(session.id, decision)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CapRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-500 w-4">{icon}</div>
      <div className="text-xs text-gray-400 w-32">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-cyan-500"
      />
      <div className="text-xs text-gray-300 w-16 text-right">{value}</div>
    </div>
  );
}

function SessionRow({
  session,
  expanded,
  now,
  onToggle,
  onDecision,
}: {
  session: PlanningSession;
  expanded: boolean;
  now: number;
  onToggle: () => void;
  onDecision: (d: 'approve' | 'reject') => void;
}) {
  const statusIcon = () => {
    if (session.status === 'running' || session.status === 'queued')
      return <Loader2 size={14} className="text-yellow-400 animate-spin" />;
    if (session.status === 'failed')
      return <XCircle size={14} className="text-red-400" />;
    if (session.status === 'rejected')
      return <ThumbsDown size={14} className="text-gray-400" />;
    if (session.status === 'approved')
      return <ThumbsUp size={14} className="text-green-400" />;
    return <CheckCircle size={14} className="text-cyan-400" />;
  };

  const startedAt = session.started_at ? new Date(session.started_at).getTime() : null;
  const elapsedMs =
    session.completed_at && session.started_at
      ? new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()
      : startedAt
        ? now - startedAt
        : 0;

  const streamedText =
    session.plan_output?.text || session.plan_output?.partial_text || '';

  return (
    <div className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#141424]"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {statusIcon()}
          <span className="text-sm truncate">{session.input_prompt}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {session.test_mode && (
            <span className="bg-gray-500/20 text-gray-400 rounded px-1.5 py-0.5">
              test
            </span>
          )}
          <span>${session.cost_usd.toFixed(4)}</span>
          <span>{formatElapsed(elapsedMs)}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1a1a2e] space-y-2">
          {/* Status header */}
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-400">
              Status: <span className="text-gray-300">{session.status}</span>
              {' · '}
              Model: <span className="text-gray-300">{session.model_used || '?'}</span>
            </div>
            <div className="text-gray-500">
              {session.input_tokens}→{session.output_tokens} tok
            </div>
          </div>

          {/* Streamed plan output */}
          {streamedText && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Plan output</div>
              <div className="text-xs bg-black/40 rounded p-2 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                {streamedText}
                {session.status === 'running' && (
                  <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {session.error_message && (
            <div>
              <div className="text-xs text-red-400 mb-1">Error</div>
              <pre className="text-xs bg-red-500/10 text-red-300 rounded p-2 overflow-x-auto">
                {session.error_message}
              </pre>
            </div>
          )}

          {/* Full review link — always available once the session has output */}
          {(session.status === 'reviewing' ||
            session.status === 'approved' ||
            session.status === 'rejected') && (
            <div className="pt-2 border-t border-[#1a1a2e]">
              <Link
                href={`/admin/planning/${session.id}`}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                Open full review page <ExternalLink size={10} />
              </Link>
            </div>
          )}

          {/* Quick approve / reject (only in reviewing state) */}
          {session.status === 'reviewing' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onDecision('approve')}
                className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-3 py-2 text-sm hover:bg-green-500/30 flex items-center justify-center gap-2"
              >
                <ThumbsUp size={14} />
                Quick approve
              </button>
              <button
                onClick={() => onDecision('reject')}
                className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-2 text-sm hover:bg-red-500/30 flex items-center justify-center gap-2"
              >
                <ThumbsDown size={14} />
                Quick reject
              </button>
            </div>
          )}

          {/* Context snapshot (collapsed detail) */}
          {session.plan_output && (
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                Raw plan_output JSON
              </summary>
              <pre className="text-xs bg-black/40 rounded p-2 overflow-x-auto max-h-64 mt-1">
                {JSON.stringify(session.plan_output, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = Math.round(ms / 100) / 10;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const rem = Math.round(seconds - mins * 60);
  return `${mins}m ${rem}s`;
}

export default UltraplanPanel;
