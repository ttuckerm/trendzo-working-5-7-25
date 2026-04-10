'use client';

import React from 'react';
import { T, stagger } from './tokens';
import type { AgencyCreator } from '@/lib/dashboard/queries';

interface RevenueViewProps {
  creators: AgencyCreator[];
}

// TODO: wire to real revenue/conversion data source
function getRevenueData(c: AgencyCreator) {
  const engagementRate = c.latestVPS > 0 ? +(c.latestVPS * 0.08 + Math.random() * 2).toFixed(1) : 0;
  const costPerContent = 50 + Math.floor(Math.random() * 150);
  const revenue = Math.round(c.scriptCount * costPerContent * (1 + engagementRate / 10));
  const conversions = Math.floor(c.scriptCount * engagementRate * 0.3);
  return { engagementRate, costPerContent, revenue, conversions };
}

export default function RevenueView({ creators }: RevenueViewProps) {
  const rows = creators.map(c => ({ ...c, ...getRevenueData(c) }));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const avgClientValue = creators.length > 0 ? Math.round(totalRevenue / creators.length) : 0;
  const totalCost = rows.reduce((s, r) => s + r.costPerContent * r.scriptCount, 0);
  const roiMultiplier = totalCost > 0 ? +(totalRevenue / totalCost).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(0) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>Monthly Revenue</p>
          <p className="text-3xl font-display font-bold" style={{ color: T.gold }}>
            ${totalRevenue.toLocaleString()}
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(1) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>Avg Client Value</p>
          <p className="text-3xl font-display font-bold" style={{ color: T.cyan }}>
            ${avgClientValue.toLocaleString()}
          </p>
        </div>
        <div
          className="rounded-2xl p-5"
          style={{ background: T.bgCard, border: `1px solid ${T.border}`, boxShadow: T.cardShadow, ...stagger(2) }}
        >
          <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: T.textDim }}>Content ROI</p>
          <p className="text-3xl font-display font-bold" style={{ color: T.green }}>
            {roiMultiplier}×
          </p>
        </div>
      </div>

      {/* Client table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: T.bgCard, border: `1px solid ${T.border}`, ...stagger(3) }}>
        {/* Header */}
        <div
          className="grid gap-4 px-5 py-3 text-[9px] font-mono uppercase tracking-wider"
          style={{
            gridTemplateColumns: '1fr 80px 90px 90px 70px',
            color: T.textDim,
            borderBottom: `1px solid ${T.border}`,
            background: T.bgElevated,
          }}
        >
          <span>Creator</span>
          <span className="text-right">Engagement</span>
          <span className="text-right">Cost/Content</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">Conv.</span>
        </div>

        {/* Rows */}
        {rows.map((r, i) => {
          const initials = r.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div
              key={r.userId}
              className="grid gap-4 px-5 py-3 items-center transition-colors duration-200 hover:bg-[#1a1a28]"
              style={{
                gridTemplateColumns: '1fr 80px 90px 90px 70px',
                borderBottom: `1px solid ${T.border}`,
                ...stagger(i, 250),
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: `${T.cyan}12`, color: T.cyan }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-sans font-medium truncate" style={{ color: T.textPrimary }}>{r.name}</p>
                  <p className="text-[9px] font-mono" style={{ color: T.textDim }}>{r.niche}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-right" style={{ color: r.engagementRate > 5 ? T.green : T.textSecondary }}>
                {r.engagementRate}%
              </span>
              <span className="text-xs font-mono text-right" style={{ color: T.textSecondary }}>
                ${r.costPerContent}
              </span>
              <span className="text-xs font-display font-bold text-right" style={{ color: T.gold }}>
                ${r.revenue.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-right" style={{ color: r.conversions > 5 ? T.green : T.textSecondary }}>
                {r.conversions}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
