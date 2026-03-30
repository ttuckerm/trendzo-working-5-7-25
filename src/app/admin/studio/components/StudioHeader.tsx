'use client'

import React from 'react'

export interface StudioTab {
  id: string;
  label: string;
  color: string;
  svg: React.ReactNode;
}

export const STUDIO_TABS: StudioTab[] = [
  {
    id: 'template-library',
    label: 'Template Library',
    color: '#e53935',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'instant-analysis',
    label: 'Instant Analysis',
    color: '#111111',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    id: 'creator',
    label: 'Creator',
    color: '#1a73e8',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'concept-scorer',
    label: 'Concept Scorer',
    color: '#ff9500',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    id: 'viral-workflow',
    label: 'Viral Workflow',
    color: '#2e7d32',
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
      </svg>
    ),
  },
];

interface StudioHeaderProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function StudioHeader({ activeTab, onTabChange }: StudioHeaderProps) {
  return (
    <div
      className="studio-header p-8 pb-0"
      style={{
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      <nav className="mb-6" style={{ position: 'relative', zIndex: 10, overflow: 'visible', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            height: 52,
            backgroundColor: '#ffffff',
            borderRadius: 115,
            paddingInline: 10,
            position: 'relative',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            width: 'fit-content',
            overflow: 'visible',
            zIndex: 10,
          }}
        >
          {STUDIO_TABS.map((tab, index) => {
            const isActive = activeTab === tab.id;
            return (
              <div key={tab.id} style={{ display: 'flex', alignItems: 'center' }}>
                {index > 0 && (
                  <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.08)', marginRight: 2 }} />
                )}
                <div
                  onClick={() => onTabChange(tab.id)}
                  className="studio-tab-pill"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: isActive ? `${tab.color}14` : 'transparent',
                    transition: 'all 0.4s',
                    color: tab.color,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(0,0,0,0.05)';
                    el.style.transform = 'scale(1.05)';
                    el.style.zIndex = '15';
                    const badge = el.querySelector('.tab-badge') as HTMLElement;
                    const rect = el.getBoundingClientRect();
                    const existing = document.getElementById('studio-tab-tooltip');
                    if (existing) existing.remove();
                    const tooltip = document.createElement('div');
                    tooltip.id = 'studio-tab-tooltip';
                    tooltip.style.cssText = `position:fixed;left:${rect.left + rect.width / 2}px;top:${rect.top - 8}px;transform:translateX(-50%) translateY(-100%);background-color:#222;color:#fff;border-radius:7px;padding:4px 10px;font-size:12px;font-weight:600;white-space:nowrap;z-index:99999;pointer-events:none;opacity:0;transition:opacity 0.25s ease;`;
                    tooltip.textContent = tab.label;
                    const arrow = document.createElement('span');
                    arrow.style.cssText = `position:absolute;border-top:8px solid #222;border-left:6px solid transparent;border-right:6px solid transparent;top:100%;left:50%;transform:translateX(-50%);display:block;width:0;height:0;`;
                    tooltip.appendChild(arrow);
                    document.body.appendChild(tooltip);
                    requestAnimationFrame(() => { tooltip.style.opacity = '1'; });
                    if (badge) { badge.style.opacity = '1'; badge.style.bottom = '-130%'; }
                    const parent = el.closest('nav')?.querySelector('div');
                    parent?.querySelectorAll('.studio-tab-pill').forEach((sibling) => {
                      if (sibling !== el) {
                        (sibling as HTMLElement).style.filter = 'blur(2px)';
                        (sibling as HTMLElement).style.opacity = '0.35';
                        (sibling as HTMLElement).style.transform = 'scale(0.85)';
                      }
                    });
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = isActive ? `${tab.color}14` : 'transparent';
                    el.style.transform = 'scale(1)';
                    el.style.zIndex = '1';
                    const floatingTooltip = document.getElementById('studio-tab-tooltip');
                    if (floatingTooltip) floatingTooltip.remove();
                    const badge = el.querySelector('.tab-badge') as HTMLElement;
                    if (badge) { badge.style.opacity = '0'; badge.style.bottom = '0%'; }
                    const parent = el.closest('nav')?.querySelector('div');
                    parent?.querySelectorAll('.studio-tab-pill').forEach((sibling) => {
                      (sibling as HTMLElement).style.filter = 'none';
                      (sibling as HTMLElement).style.opacity = '1';
                      (sibling as HTMLElement).style.transform = 'scale(1)';
                    });
                  }}
                >
                  <div style={{ color: tab.color, display: 'flex', alignItems: 'center', transition: 'all 0.3s' }}>
                    {tab.svg}
                  </div>
                  <span
                    className="tab-label"
                    style={{
                      position: 'absolute',
                      top: '0%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      backgroundColor: '#222',
                      color: '#fff',
                      borderRadius: 7,
                      opacity: 0,
                      padding: '4px 10px',
                      width: 'max-content',
                      fontSize: 12,
                      fontWeight: 600,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      zIndex: 9999,
                    }}
                  >
                    {tab.label}
                    <span style={{
                      position: 'absolute',
                      borderTop: '8px solid #222',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'block',
                      width: 0,
                      height: 0,
                    }} />
                  </span>
                  <span
                    className="tab-badge"
                    style={{
                      position: 'absolute',
                      bottom: '0%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      backgroundColor: '#e91e63',
                      color: '#fff',
                      borderRadius: 7,
                      opacity: 0,
                      padding: '3px 10px',
                      width: 'max-content',
                      fontSize: 11,
                      fontWeight: 700,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      zIndex: 9999,
                    }}
                  >
                    Open
                    <span style={{
                      position: 'absolute',
                      borderBottom: '8px solid #e91e63',
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'block',
                      width: 0,
                      height: 0,
                    }} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Filter Bar - Template Library uses inline filters */}
      {activeTab === 'template-library' && null}

      {/* Armory Filter Bar */}
      {activeTab === 'armory' && (
        <div className="armory-filters flex justify-between items-center mb-8">
          <div className="category-tabs flex gap-6">
            <div className="category-tab active flex items-center gap-3 px-6 py-4 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded-xl cursor-pointer transition-all duration-300">
              <span className="category-icon text-xl">🔥</span>
              <span className="category-name text-sm font-bold uppercase tracking-wide">HOT</span>
              <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">67</span>
            </div>
            <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
              <span className="category-icon text-xl">🧊</span>
              <span className="category-name text-sm font-bold uppercase tracking-wide">COOLING</span>
              <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">124</span>
            </div>
            <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
              <span className="category-icon text-xl">✨</span>
              <span className="category-name text-sm font-bold uppercase tracking-wide">NEW</span>
              <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">12</span>
            </div>
            <div className="category-tab flex items-center gap-3 px-6 py-4 bg-white/[0.05] border border-white/10 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-0.5">
              <span className="category-icon text-xl">💀</span>
              <span className="category-name text-sm font-bold uppercase tracking-wide">RETIRED</span>
              <span className="category-count px-2 py-1 bg-white/10 rounded-xl text-xs font-semibold">45</span>
            </div>
          </div>
          <div className="armory-view-options flex gap-4 items-center">
            <select className="armory-sort px-4 py-2.5 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm cursor-pointer">
              <option>Sort by Success Rate</option>
              <option>Sort by Recent Use</option>
              <option>Sort by Viral Velocity</option>
              <option>Sort by Deployments</option>
            </select>
            <button className="view-toggle active w-9 h-9 bg-[rgba(229,9,20,0.2)] border border-[#e50914] rounded text-white text-lg cursor-pointer transition-all duration-300">⊞</button>
            <button className="view-toggle w-9 h-9 bg-white/[0.05] border border-white/10 rounded text-gray-400 text-lg cursor-pointer transition-all duration-300 hover:bg-white/[0.08] hover:text-white">☰</button>
          </div>
        </div>
      )}
    </div>
  );
}
