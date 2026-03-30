'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Diamond,
  ArrowLeft,
  Home,
  LayoutGrid,
  Layers,
  Link2,
  Settings,
  Play,
} from 'lucide-react';

interface CanvasSidebarProps {
  nodeCount: number;
}

interface SidebarItem {
  id: string;
  icon: React.ElementType;
  label: string;
  action?: () => void;
}

export function CanvasSidebar({ nodeCount }: CanvasSidebarProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState('overview');
  const [hovered, setHovered] = useState(false);

  const items: SidebarItem[] = [
    { id: 'back', icon: ArrowLeft, label: 'Back to Projects', action: () => router.push('/admin/canvas') },
    { id: 'overview', icon: Home, label: 'Overview' },
    { id: 'node-types', icon: LayoutGrid, label: 'Node Types' },
    { id: 'layers', icon: Layers, label: 'Layers' },
    { id: 'connections', icon: Link2, label: 'Connections' },
    { id: 'settings', icon: Settings, label: 'Canvas Settings' },
  ];

  const width = hovered ? 180 : 56;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col shrink-0 select-none"
      style={{
        width,
        background: '#0a0a0a',
        borderRadius: 16,
        margin: '12px 0 12px 8px',
        padding: '12px 8px',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-1.5 pb-3" style={{ minHeight: 40 }}>
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #e91e63, #c2185d)',
            boxShadow: '0 0 16px rgba(233,30,99,0.25)',
          }}
        >
          <Diamond size={16} color="white" />
        </div>
        <span
          className="text-xs font-bold text-white whitespace-nowrap"
          style={{
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          Canvas
        </span>
      </div>

      {/* Divider */}
      <div className="mx-1 mb-2" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* Nav items */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {items.map((item, i) => {
          const Icon = item.icon;
          const isBack = item.id === 'back';
          const isActive = !isBack && activeId === item.id;

          return (
            <React.Fragment key={item.id}>
              {i === 1 && <div className="h-1" />}
              <button
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveId(item.id);
                  }
                }}
                className={`group flex items-center gap-2.5 w-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                }`}
                style={{
                  height: 40,
                  paddingLeft: hovered ? 14 : 0,
                  paddingRight: 8,
                  justifyContent: hovered ? 'flex-start' : 'center',
                }}
              >
                <Icon size={17} className="shrink-0 transition-colors" />
                <span
                  className="text-[11px] font-semibold whitespace-nowrap overflow-hidden"
                  style={{
                    opacity: hovered ? 1 : 0,
                    width: hovered ? 'auto' : 0,
                    transition: 'opacity 0.2s ease, width 0.2s ease',
                  }}
                >
                  {item.label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 mt-2">
        {/* Node count */}
        <div className="flex items-center justify-center rounded-xl text-zinc-600 text-[10px] font-semibold" style={{ height: 32 }}>
          {hovered ? `${nodeCount} node${nodeCount !== 1 ? 's' : ''}` : `${nodeCount}n`}
        </div>

        {/* Run button — only when expanded */}
        {hovered && (
          <button
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white transition-all hover:scale-105 self-center"
            style={{ background: 'linear-gradient(135deg, #e91e63, #c2185b)' }}
          >
            <Play size={13} fill="white" />
          </button>
        )}
      </div>
    </div>
  );
}
