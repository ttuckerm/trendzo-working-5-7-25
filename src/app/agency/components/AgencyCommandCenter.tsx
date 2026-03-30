'use client';

import React from 'react';
import MorningBriefCard from './MorningBriefCard';
import KPICard from './KPICard';

export interface CreatorData {
  userId: string;
  name: string;
  niche: string | null;
  lastVPS: number | null;
  lastActive: string | null;
  scriptCount: number;
}

export interface AgencyDashboardData {
  agencyId: string;
  totalCreators: number;
  scriptsThisWeek: number;
  averageVPS: number | null;
  activeBriefs: number;
  creators: CreatorData[];
  bestScript: { vps: number; creatorName: string; hookText: string } | null;
  inactiveCreators: string[];
}

// Generate fake sparkline data from real numbers
function generateChartData(seed: number, length = 8): number[] {
  const data: number[] = [];
  let val = seed || 50;
  for (let i = 0; i < length; i++) {
    val = Math.max(10, Math.min(100, val + (Math.sin(i * 1.3 + seed) * 20)));
    data.push(Math.round(val));
  }
  return data;
}

export default function AgencyCommandCenter({ data }: { data: AgencyDashboardData }) {
  // Compute morning brief data from real data
  const bestScript = data.bestScript;
  const inactiveCount = data.inactiveCreators.length;

  // Count total actions needed
  const actionCount = (inactiveCount > 0 ? 1 : 0) + (bestScript ? 1 : 0) + 1;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      {/* Header — Playfair Display greeting */}
      <div className="animate-[fadeSlideUp_0.5s_ease-out_both]">
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-[#e8e6e3] tracking-tight">
          {greeting}.
        </h1>
        <p className="text-sm text-[#7a7889] mt-2 font-body flex items-center gap-2">
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="text-[#4a4858]">·</span>
          <span className="text-[#00d4ff]">
            {actionCount} action{actionCount !== 1 ? 's' : ''} across {data.totalCreators} client{data.totalCreators !== 1 ? 's' : ''}
          </span>
        </p>
      </div>

      {/* Morning Brief */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-mono-label uppercase tracking-[0.15em] text-[#4a4858] px-1">
          Morning Brief
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MorningBriefCard
            type="success"
            title="Outperformance Alert"
            description={
              bestScript
                ? `${bestScript.creatorName} scored ${bestScript.vps.toFixed(0)} VPS — "${bestScript.hookText}"`
                : 'No scripts generated this week yet'
            }
            metric={bestScript ? `${bestScript.vps.toFixed(0)} VPS` : undefined}
            action={bestScript ? { label: 'View Script', onClick: () => {} } : undefined}
            chartData={generateChartData(data.averageVPS ?? 60)}
          />
          <MorningBriefCard
            type="warning"
            title="Momentum Decay"
            description={
              inactiveCount > 0
                ? `${inactiveCount} creator${inactiveCount !== 1 ? 's' : ''} haven't generated scripts in 7+ days — momentum is decaying`
                : 'All creators are active this week'
            }
            metric={inactiveCount > 0 ? `${inactiveCount} inactive` : undefined}
            action={inactiveCount > 0 ? { label: 'Nudge Creators', onClick: () => {} } : undefined}
            chartData={generateChartData(inactiveCount * 15 + 30)}
          />
          <MorningBriefCard
            type="info"
            title="Emerging Trend"
            description="Cultural timing insights are being computed from your niche's latest viral patterns."
            action={{ label: 'View Trends', onClick: () => {} }}
            chartData={generateChartData(75)}
          />
        </div>
      </section>

      {/* KPI Row */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-mono-label uppercase tracking-[0.15em] text-[#4a4858] px-1">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Creators"
            value={data.totalCreators}
            accentColor="#7b2ff7"
          />
          <KPICard
            label="Scripts This Week"
            value={data.scriptsThisWeek}
            accentColor="#00d4ff"
          />
          <KPICard
            label="Average VPS"
            value={data.averageVPS !== null ? data.averageVPS.toFixed(1) : '--'}
            accentColor="#f4b942"
          />
          <KPICard
            label="Active Briefs"
            value={data.activeBriefs}
            accentColor="#2dd4a8"
          />
        </div>
      </section>
    </div>
  );
}
