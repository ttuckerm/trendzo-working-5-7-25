'use client';

import React from 'react';
import type { AgencyBrief } from '@/lib/dashboard/queries';

interface WeeklyCalendarProps {
  briefs: AgencyBrief[];
}

function getWeekDays(): { label: string; dateStr: string; isToday: boolean }[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === now.toDateString();
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateStr: d.toISOString().slice(0, 10),
      isToday,
    };
  });
}

export default function WeeklyCalendar({ briefs }: WeeklyCalendarProps) {
  const days = getWeekDays();

  const briefsByDay = new Map<string, AgencyBrief[]>();
  for (const brief of briefs) {
    const dayKey = brief.createdAt.slice(0, 10);
    const existing = briefsByDay.get(dayKey) || [];
    existing.push(brief);
    briefsByDay.set(dayKey, existing);
  }

  return (
    <div
      className="rounded-2xl p-4 overflow-hidden"
      style={{
        background: 'rgba(15, 15, 22, 0.5)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid #1e1e2e',
      }}
    >
      <h3 className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#8888a0] mb-3">
        Weekly Calendar
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayBriefs = briefsByDay.get(day.dateStr) || [];
          const hasContent = dayBriefs.length > 0;
          const isGap = !hasContent;

          return (
            <div key={day.dateStr} className="text-center">
              <p className={`text-[9px] font-mono uppercase mb-1 ${day.isToday ? 'text-[#00d4ff]' : 'text-[#8888a0]'}`}>
                {day.label}
              </p>
              <div
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-mono transition-colors ${
                  day.isToday ? 'ring-1 ring-[#00d4ff44]' : ''
                }`}
                style={{
                  background: hasContent
                    ? '#2dd4a818'
                    : isGap ? '#f04a4d08' : '#1e1e2e44',
                  border: `1px solid ${hasContent ? '#2dd4a825' : isGap ? '#f04a4d15' : '#1e1e2e'}`,
                  color: hasContent ? '#2dd4a8' : '#3a3a4a',
                }}
              >
                {hasContent ? dayBriefs.length : '·'}
              </div>
            </div>
          );
        })}
      </div>
      {/* Gap detection label */}
      {days.filter(d => !(briefsByDay.get(d.dateStr)?.length)).length >= 4 && (
        <p className="text-[9px] font-mono text-[#f4b942] mt-2">
          ⚠ {days.filter(d => !(briefsByDay.get(d.dateStr)?.length)).length} days with no content scheduled
        </p>
      )}
    </div>
  );
}
