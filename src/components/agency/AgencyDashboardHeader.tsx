'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const T = {
  bg: '#1c1c24',
  accent: '#f04a4d',
  cyan: '#00d4ff',
  green: '#2dd4a8',
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  raised: '-5px -5px 12px rgba(255,255,255,0.05), 5px 5px 12px rgba(0,0,0,0.6)',
  raisedSm: '-3px -3px 8px rgba(255,255,255,0.05), 3px 3px 8px rgba(0,0,0,0.5)',
  inset: 'inset -3px -3px 8px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.6)',
  navShadow: '0 4px 12px rgba(0,0,0,0.5)',
  pillShadow: '-2px -2px 6px rgba(255,255,255,0.05), 2px 2px 6px rgba(0,0,0,0.55)',
} as const;

const STORAGE_KEY = 'trendzo-dashboard-mode';

export type DashboardMode = 'clay' | 'grid';

export function getDashboardMode(): DashboardMode {
  if (typeof window === 'undefined') return 'clay';
  return (localStorage.getItem(STORAGE_KEY) as DashboardMode) || 'clay';
}

export function setDashboardMode(mode: DashboardMode) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, mode);
}

interface AgencyDashboardHeaderProps {
  mode: DashboardMode;
  agencyName?: string;
  onSignOut?: () => void;
  /** Extra element to render between branding and toggle (e.g. schedule strip) */
  centerSlot?: React.ReactNode;
}

export default function AgencyDashboardHeader({ mode, agencyName, onSignOut, centerSlot }: AgencyDashboardHeaderProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  const handleToggle = useCallback(() => {
    const next: DashboardMode = mode === 'clay' ? 'grid' : 'clay';
    setDashboardMode(next);
    router.push(next === 'clay' ? '/agency' : '/agency/dashboard');
  }, [mode, router]);

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 flex-shrink-0"
      style={{ background: T.bg, boxShadow: T.navShadow, height: 56 }}
    >
      <style>{`
        @keyframes hdrBrandIn {
          from { opacity: 0; transform: translateX(-12px); letter-spacing: 0.15em; }
          to { opacity: 1; transform: translateX(0); letter-spacing: -0.01em; }
        }
        @keyframes hdrToggleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .hdr-brand { animation: hdrBrandIn 500ms cubic-bezier(0.22, 1, 0.36, 1) 150ms both; }
        .hdr-toggle { animation: hdrToggleIn 350ms cubic-bezier(0.22, 1, 0.36, 1) 300ms both; }
        .hdr-toggle:hover {
          box-shadow: -4px -4px 10px rgba(255,255,255,0.06), 4px 4px 10px rgba(0,0,0,0.55), 0 0 16px rgba(0,212,255,0.12) !important;
          transform: translateY(-1px);
        }
        .hdr-toggle:active {
          box-shadow: inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 6px rgba(0,0,0,0.5) !important;
          transform: translateY(0) scale(0.97);
          transition-duration: 80ms;
        }
        .hdr-menu-btn:hover {
          box-shadow: -4px -4px 10px rgba(255,255,255,0.06), 4px 4px 10px rgba(0,0,0,0.55) !important;
        }
        .hdr-menu-btn:active {
          box-shadow: inset -2px -2px 6px rgba(255,255,255,0.04), inset 2px 2px 6px rgba(0,0,0,0.5) !important;
          transition-duration: 80ms;
        }
      `}</style>
      {/* Left: branding */}
      <div className="flex items-center gap-3">
        <span className="hdr-brand font-display text-xl font-bold tracking-tight" style={{ color: T.accent }}>TRENDZO</span>
        {agencyName && (
          <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline" style={{ color: T.textSecondary }}>
            {agencyName}
          </span>
        )}
      </div>

      {/* Center slot */}
      {centerSlot}

      {/* Right: toggle + menu */}
      <div className="flex items-center gap-3">
        {/* Mode toggle */}
        <button
          onClick={handleToggle}
          className="hdr-toggle flex items-center gap-2 px-4 py-2 font-mono text-xs uppercase tracking-wide transition-all duration-200"
          style={{
            borderRadius: 14,
            background: T.bg,
            boxShadow: T.raisedSm,
            color: mode === 'clay' ? T.cyan : T.green,
          }}
        >
          {mode === 'clay' ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
              Dashboard
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full" style={{ background: T.cyan, animation: 'pulse 2s ease-in-out infinite' }} />
              Clay
            </>
          )}
        </button>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="hdr-menu-btn flex items-center justify-center transition-all duration-150"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: T.bg,
              boxShadow: menuOpen ? T.inset : T.raisedSm,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill={T.textPrimary}>
              <circle cx="5" cy="5" r="2" /><circle cx="13" cy="5" r="2" />
              <circle cx="5" cy="13" r="2" /><circle cx="13" cy="13" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-[48px] z-50 flex flex-col"
              style={{
                background: T.bg,
                boxShadow: T.raised,
                borderRadius: 16,
                padding: '10px 8px',
                gap: 6,
                minWidth: 180,
              }}
            >
              <a
                href="/agency/cards"
                className="flex items-center gap-3 font-body text-sm transition hover:text-[#f04a4d]"
                style={{ background: T.bg, boxShadow: T.pillShadow, borderRadius: 12, padding: '9px 14px', color: T.textPrimary }}
                onClick={() => setMenuOpen(false)}
              >
                Cards
              </a>
              <a
                href="/agency/clients"
                className="flex items-center gap-3 font-body text-sm transition hover:text-[#f04a4d]"
                style={{ background: T.bg, boxShadow: T.pillShadow, borderRadius: 12, padding: '9px 14px', color: T.textPrimary }}
                onClick={() => setMenuOpen(false)}
              >
                Clients
              </a>
              {onSignOut && (
                <button
                  className="flex items-center gap-3 font-body text-sm transition hover:opacity-80 w-full text-left"
                  style={{ background: T.bg, boxShadow: T.pillShadow, borderRadius: 12, padding: '9px 14px', color: T.accent }}
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
