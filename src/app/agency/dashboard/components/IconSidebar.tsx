'use client';

import React from 'react';
import Link from 'next/link';
import { T } from './tokens';

const NAV_ITEMS = [
  { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4', label: 'Dashboard', href: '/agency/dashboard', active: true },
  { icon: 'M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75', label: 'Creators', href: '/agency/clients' },
  { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Briefs', href: '/agency/cards' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Calendar', href: '/agency/dashboard' },
  { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Reports', href: '/agency/dashboard' },
];

export default function IconSidebar() {
  return (
    <aside
      className="flex-shrink-0 flex flex-col items-center py-5 gap-1"
      style={{ width: 52, background: T.bgCard, borderRight: `1px solid ${T.border}` }}
    >
      {/* T logo */}
      <Link
        href="/agency"
        className="flex items-center justify-center mb-6 transition-opacity hover:opacity-80"
        style={{ width: 36, height: 36, borderRadius: 10, background: T.crimson }}
      >
        <span className="font-display text-sm font-bold text-white">T</span>
      </Link>

      {NAV_ITEMS.map(item => (
        <Link
          key={item.label}
          href={item.href}
          title={item.label}
          className="flex items-center justify-center transition-all duration-200 group"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: item.active ? `${T.cyan}12` : 'transparent',
            border: item.active ? `1px solid ${T.cyan}30` : '1px solid transparent',
          }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={item.active ? T.cyan : T.textDim}
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="transition-colors duration-200 group-hover:stroke-[#e8e8f0]"
          >
            <path d={item.icon} />
          </svg>
        </Link>
      ))}
    </aside>
  );
}
