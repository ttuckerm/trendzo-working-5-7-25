'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyBrief, AgencyCreator } from '@/lib/dashboard/queries';

interface ScheduleStripProps {
  briefs: AgencyBrief[];
  creators: AgencyCreator[];
}

// Generate time slots for today
function getTimeSlots() {
  const slots: { time: string; hour: number }[] = [];
  for (let h = 9; h <= 18; h++) {
    slots.push({ time: h <= 12 ? `${h}am` : `${h - 12}pm`, hour: h });
  }
  return slots;
}

export default function ScheduleStrip({ briefs, creators }: ScheduleStripProps) {
  const slots = getTimeSlots();
  const today = new Date().toISOString().slice(0, 10);
  const todayBriefs = briefs.filter(b => b.createdAt.slice(0, 10) === today);

  // Map briefs to time slots (spread evenly across the day for visual)
  const slotMap = new Map<number, AgencyBrief>();
  todayBriefs.forEach((b, i) => {
    const hour = 9 + Math.floor((i / Math.max(todayBriefs.length, 1)) * 8);
    slotMap.set(hour, b);
  });

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto no-scrollbar rounded-full px-2 py-1"
      style={{ background: T.bgCard, border: `1px solid ${T.border}` }}
    >
      {/* Label */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full mr-1"
        style={{ background: T.bgElevated }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.textPrimary }}>
          Today
        </span>
        <span className="text-[10px] font-mono" style={{ color: T.textDim }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Time slots */}
      {slots.map(slot => {
        const brief = slotMap.get(slot.hour);
        const hasContent = !!brief;
        const initial = brief
          ? brief.creatorName.split(' ').map(w => w[0]).join('').slice(0, 1)
          : null;

        return (
          <div
            key={slot.hour}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 transition-all duration-200"
            style={{
              borderLeft: `1px solid ${T.border}`,
              minWidth: 60,
            }}
            title={brief ? `${brief.creatorName}: ${brief.title}` : `${slot.time} — open`}
          >
            <span className="text-[9px] font-mono" style={{ color: T.textDim }}>{slot.time}</span>
            {hasContent ? (
              <div className="flex items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: `${T.green}20`, color: T.green, border: `1px solid ${T.green}40` }}
                >
                  {initial}
                </div>
              </div>
            ) : (
              <span className="text-[10px] font-mono" style={{ color: T.textDim, opacity: 0.4 }}>+</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
