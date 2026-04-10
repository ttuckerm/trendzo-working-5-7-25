'use client';

import React, { useState, useRef, useEffect } from 'react';
import { T } from './tokens';
import type { AgencyCreator, AgencyBrief, AgencyStats, CoachingInsight } from '@/lib/dashboard/queries';

interface ClayPanelProps {
  creators: AgencyCreator[];
  briefs: AgencyBrief[];
  stats: AgencyStats;
  insights: CoachingInsight[];
}

// Priority-ranked coaching items
function getCoachingItems(creators: AgencyCreator[], briefs: AgencyBrief[], insights: CoachingInsight[]) {
  const items: {
    id: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    creator?: string;
    action: string;
    color: string;
  }[] = [];

  // Priority 1: Silent creators (3+ days)
  const inactive = creators.filter(c => c.status === 'inactive' || (c.status === 'active' && c.scriptCount === 0));
  if (inactive.length > 0) {
    const c = inactive[0];
    items.push({
      id: 'silent-' + c.userId,
      severity: 'high',
      title: `${c.name} needs attention`,
      description: `No recent content detected. Momentum decaying. I've drafted 3 rescue concepts.`,
      creator: c.name,
      action: 'Generate rescue concepts →',
      color: T.crimson,
    });
  }

  // Priority 2: Overdue briefs
  const overdue = briefs.filter(b => b.status === 'draft' || b.status === 'in-progress');
  if (overdue.length > 0) {
    items.push({
      id: 'overdue-briefs',
      severity: 'medium',
      title: `${overdue.length} brief${overdue.length > 1 ? 's' : ''} need action`,
      description: `${overdue[0].title} for ${overdue[0].creatorName} is still in ${overdue[0].status}.`,
      creator: overdue[0].creatorName,
      action: 'Review briefs →',
      color: T.gold,
    });
  }

  // Priority 3: Add coaching insights
  for (const ins of insights.slice(0, 2)) {
    items.push({
      id: ins.id,
      severity: ins.priority,
      title: ins.title,
      description: ins.recommendation,
      creator: ins.creatorName,
      action: 'Act on this →',
      color: ins.priority === 'high' ? T.crimson : ins.priority === 'medium' ? T.gold : T.cyan,
    });
  }

  return items.slice(0, 3);
}

const SEVERITY_BADGE = {
  high: { color: T.crimson, label: 'HIGH' },
  medium: { color: T.gold, label: 'MED' },
  low: { color: T.cyan, label: 'LOW' },
} as const;

interface ChatMsg {
  role: 'ai' | 'user';
  text: string;
}

export default function ClayPanel({ creators, briefs, stats, insights }: ClayPanelProps) {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    { role: 'ai', text: 'Good morning. I\'ve scanned your roster. Here\'s what needs your attention today.' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const coachingItems = getCoachingItems(creators, briefs, insights);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    // TODO: wire to /api/agency-chat
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        text: `I'll look into that. Analyzing your roster data for "${userMsg}"...`,
      }]);
    }, 800);
  };

  const quickActions = [
    { label: '✦ Generate briefs', action: 'Generate content briefs for all creators' },
    { label: '⚡ Nudge silent', action: 'Send nudge to inactive creators' },
    { label: '◎ Weekly report', action: 'Generate weekly performance report' },
    { label: '◆ Trend scan', action: 'Scan for trending content formats' },
  ];

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{
        width: 320,
        background: 'rgba(15, 15, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: `1px solid ${T.border}`,
      }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-2.5 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: T.cyan, animation: 'pulse 2s ease-in-out infinite' }}
        />
        <span className="text-sm font-display font-bold" style={{ color: T.textPrimary }}>CLAY</span>
        <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: T.textDim }}>AI Copilot</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Coaching section */}
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: T.textSecondary }}>
            What to do next
          </p>
          <div className="space-y-2">
            {coachingItems.map(item => {
              const badge = SEVERITY_BADGE[item.severity];
              return (
                <div
                  key={item.id}
                  className="rounded-xl p-3 transition-all duration-200 hover:translate-y-[-1px]"
                  style={{
                    background: T.bgElevated,
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: `${badge.color}15`, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-display font-bold truncate" style={{ color: T.textPrimary }}>
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[10px] font-sans leading-relaxed mb-2" style={{ color: T.textSecondary }}>
                    {item.description}
                  </p>
                  {item.creator && (
                    <p className="text-[9px] font-mono mb-2" style={{ color: T.cyan }}>Re: {item.creator}</p>
                  )}
                  <button
                    className="text-[9px] font-mono uppercase tracking-wide px-2 py-1 rounded-lg transition-all duration-200 hover:brightness-125"
                    style={{ background: `${item.color}12`, color: item.color, border: `1px solid ${item.color}25` }}
                  >
                    {item.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: 'Posts Today', value: stats.contentThisWeek, color: T.green },
            { label: 'Briefs Due', value: stats.briefsPending, color: T.gold },
            { label: 'Avg VPS', value: stats.avgVPS || '--', color: T.cyan },
            { label: 'Overdue', value: briefs.filter(b => b.status === 'draft').length, color: T.crimson },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg p-2.5" style={{ background: T.bgElevated }}>
              <p className="text-[8px] font-mono uppercase tracking-wider" style={{ color: T.textDim }}>{stat.label}</p>
              <p className="text-lg font-display font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
          {quickActions.map(qa => (
            <button
              key={qa.label}
              onClick={() => {
                setChatMessages(prev => [...prev, { role: 'user', text: qa.action }]);
                setTimeout(() => {
                  setChatMessages(prev => [...prev, { role: 'ai', text: `Working on it: ${qa.action.toLowerCase()}...` }]);
                }, 500);
              }}
              className="text-[10px] font-mono px-2.5 py-1.5 rounded-lg transition-all duration-200 hover:border-[#00d4ff] hover:text-[#00d4ff]"
              style={{ background: T.bgElevated, color: T.textSecondary, border: `1px solid ${T.border}` }}
            >
              {qa.label}
            </button>
          ))}
        </div>

        {/* Chat messages */}
        <div className="px-4 py-3 space-y-3">
          {chatMessages.map((msg, i) => (
            <div key={i}>
              {msg.role === 'ai' ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.cyan, animation: 'pulse 2s ease-in-out infinite' }} />
                    <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: T.cyan }}>Trendzo</span>
                  </div>
                  <p className="text-[11px] font-sans leading-relaxed" style={{ color: T.textPrimary }}>{msg.text}</p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div
                    className="px-3 py-2 rounded-xl max-w-[85%] text-[11px] font-sans text-white"
                    style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.crimson})` }}
                  >
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar (sticky bottom) */}
      <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: `1px solid ${T.border}`, background: T.bgCard }}>
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
          <div className="flex-1 relative">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask Clay anything..."
              className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-sans focus:outline-none"
              style={{
                background: T.bgElevated,
                border: `1px solid ${T.border}`,
                color: T.textPrimary,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] disabled:opacity-30 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${T.violet}, ${T.crimson})` }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
