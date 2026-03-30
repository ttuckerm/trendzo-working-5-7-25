'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  ChevronRight,
  Minus,
} from 'lucide-react';
import type { CalendarBrief } from '@/lib/content/content-calendar';

// ============================================================================
// Types
// ============================================================================

interface ContentCalendarPhaseProps {
  selectedNiche: string;
  onBack: () => void;
}

interface CalendarData {
  id: string | null;
  briefs: CalendarBrief[];
  generated_at: string;
  niche: string;
  total_briefs: number;
}

interface PerformanceData {
  total_measured: number;
  avg_delta: number | null;
  patterns_tried: number;
  overperformed_count: number;
  underperformed_count: number;
}

// ============================================================================
// Arc color mapping
// ============================================================================

const ARC_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  transformation: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300' },
  revelation: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300' },
  warning: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300' },
  social_proof: { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-300' },
  challenge: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-300' },
  insider_access: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-300' },
  myth_bust: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300' },
};

function getArcColor(arc: string) {
  return ARC_COLORS[arc] || { bg: 'bg-zinc-500/20', border: 'border-zinc-500/40', text: 'text-zinc-300' };
}

// ============================================================================
// Main Component
// ============================================================================

export default function ContentCalendarPhase({
  selectedNiche,
  onBack,
}: ContentCalendarPhaseProps) {
  const [calendar, setCalendar] = useState<CalendarData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [acceptingDay, setAcceptingDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Load calendar ────────────────────────────────────────────────────
  const loadCalendar = useCallback(async (force = false) => {
    try {
      if (force) setRegenerating(true);
      else setLoading(true);
      setError(null);

      const url = force
        ? '/api/content-calendar?force=true'
        : '/api/content-calendar';

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to load calendar');
        return;
      }

      if (data.calendar) {
        setCalendar(data.calendar);
      } else {
        setError(data.message || 'No calendar available');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }, []);

  // ── Load performance ──────────────────────────────────────────────────
  const loadPerformance = useCallback(async () => {
    try {
      const res = await fetch('/api/content-calendar/performance');
      const data = await res.json();
      if (data.success && data.performance) {
        setPerformance(data.performance);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    loadCalendar();
    loadPerformance();
  }, [loadCalendar, loadPerformance]);

  // ── Accept brief ──────────────────────────────────────────────────────
  const handleAccept = useCallback(
    async (brief: CalendarBrief) => {
      if (!calendar?.id) return;
      setAcceptingDay(brief.day);

      try {
        const res = await fetch('/api/content-calendar/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calendar_id: calendar.id,
            day: brief.day,
            pattern_id: brief.pattern_id,
          }),
        });

        const data = await res.json();

        if (data.success) {
          // Update local state
          setCalendar(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              briefs: prev.briefs.map(b =>
                b.day === brief.day
                  ? { ...b, status: 'accepted' as const, brief_id: data.brief_id }
                  : b,
              ),
            };
          });
        }
      } catch {
        // Non-fatal
      } finally {
        setAcceptingDay(null);
      }
    },
    [calendar?.id],
  );

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Generating your content calendar...</p>
        </div>
      </div>
    );
  }

  // ── Counts ────────────────────────────────────────────────────────────
  const acceptedCount = calendar?.briefs.filter(b => b.status === 'accepted').length || 0;
  const completedCount = calendar?.briefs.filter(b => b.status === 'completed').length || 0;
  const pendingCount = calendar?.briefs.filter(b => b.status === 'pending').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-7 h-7 text-purple-400" />
              Your 30-Day Content Calendar
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {calendar?.total_briefs || 0} briefs personalized for{' '}
              <span className="text-purple-300">{selectedNiche || calendar?.niche || 'your niche'}</span>
              {' '} &middot; One every 2 days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {calendar?.generated_at && (
            <span className="text-white/30 text-xs">
              Generated{' '}
              {new Date(calendar.generated_at).toLocaleDateString()}
            </span>
          )}
          <button
            onClick={() => loadCalendar(true)}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`}
            />
            Regenerate
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Pending"
          value={pendingCount}
          color="text-white/70"
        />
        <StatCard
          label="Accepted"
          value={acceptedCount}
          color="text-blue-400"
        />
        <StatCard
          label="Completed"
          value={completedCount}
          color="text-green-400"
        />
        <StatCard
          label="Avg Performance"
          value={
            performance?.avg_delta != null
              ? `${performance.avg_delta > 0 ? '+' : ''}${performance.avg_delta}`
              : '--'
          }
          color={
            performance?.avg_delta != null
              ? performance.avg_delta > 0
                ? 'text-green-400'
                : performance.avg_delta < 0
                  ? 'text-red-400'
                  : 'text-white/70'
              : 'text-white/40'
          }
        />
      </div>

      {/* Error state */}
      {error && !calendar && (
        <div className="text-center py-16">
          <Sparkles className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <p className="text-white/50 text-lg">{error}</p>
        </div>
      )}

      {/* Calendar grid */}
      {calendar && calendar.briefs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendar.briefs.map((brief, idx) => (
            <BriefCard
              key={brief.day}
              brief={brief}
              index={idx}
              isAccepting={acceptingDay === brief.day}
              onAccept={() => handleAccept(brief)}
            />
          ))}
        </div>
      )}

      {/* Performance breakdown (if has data) */}
      {performance && performance.total_measured > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Pattern Performance
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-white/40 text-sm">Patterns Tried</div>
              <div className="text-2xl font-bold text-white mt-1">
                {performance.patterns_tried}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-white/40 text-sm">Overperformed</div>
              <div className="text-2xl font-bold text-green-400 mt-1">
                {performance.overperformed_count}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
              <div className="text-white/40 text-sm">Underperformed</div>
              <div className="text-2xl font-bold text-red-400 mt-1">
                {performance.underperformed_count}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
      <div className="text-white/40 text-xs uppercase tracking-wider">{label}</div>
      <div className={`text-xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function BriefCard({
  brief,
  index,
  isAccepting,
  onAccept,
}: {
  brief: CalendarBrief;
  index: number;
  isAccepting: boolean;
  onAccept: () => void;
}) {
  const arcColor = getArcColor(brief.narrative_arc);
  const isAccepted = brief.status === 'accepted';
  const isCompleted = brief.status === 'completed';
  const hasDelta =
    isCompleted && brief.actual_vps != null && brief.predicted_vps != null;
  const delta = hasDelta
    ? Number(brief.actual_vps) - brief.predicted_vps
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`rounded-xl border p-4 transition-colors ${
        isCompleted
          ? 'bg-white/[0.02] border-white/[0.08]'
          : isAccepted
            ? 'bg-blue-500/5 border-blue-500/20'
            : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
      }`}
    >
      {/* Top row: day + arc badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs font-medium">
            Day {brief.day}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full border ${arcColor.bg} ${arcColor.border} ${arcColor.text}`}
          >
            {brief.narrative_arc.replace('_', ' ')}
          </span>
        </div>

        {/* VPS indicator */}
        <div className="text-right">
          {hasDelta && delta != null ? (
            <div className="flex items-center gap-1">
              <span className="text-white/50 text-xs">
                {brief.actual_vps}
              </span>
              {delta > 10 ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              ) : delta < -10 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-white/30" />
              )}
              <span
                className={`text-xs font-medium ${
                  delta > 10
                    ? 'text-green-400'
                    : delta < -10
                      ? 'text-red-400'
                      : 'text-white/40'
                }`}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-white/30 text-xs">
              est. {brief.predicted_vps} VPS
            </span>
          )}
        </div>
      </div>

      {/* Pattern name */}
      <div className="text-sm font-medium text-white mb-1">
        {brief.pattern_name.replace(/-/g, ' ')}
      </div>

      {/* Topic angle */}
      <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mb-1">
        {brief.topic_angle}
      </p>

      {/* Hook preview */}
      <p className="text-purple-300/70 text-xs italic mb-3 line-clamp-1">
        &ldquo;{brief.hook_text}&rdquo;
      </p>

      {/* Format + action */}
      <div className="flex items-center justify-between">
        <span className="text-white/20 text-[10px] uppercase tracking-wider">
          {brief.format_suggestion}
        </span>

        {isCompleted ? (
          <span className="flex items-center gap-1 text-green-400/60 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        ) : isAccepted ? (
          <span className="flex items-center gap-1 text-blue-400/60 text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            Accepted
          </span>
        ) : (
          <button
            onClick={onAccept}
            disabled={isAccepting}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {isAccepting ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Accept
          </button>
        )}
      </div>
    </motion.div>
  );
}
