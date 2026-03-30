'use client';

import React from 'react';
import { Home, LayoutGrid, Settings, Monitor, Zap, GitBranch, Sparkles, CheckSquare, Workflow } from 'lucide-react';
import type { NodeType } from '../page';
import { NODE_CONFIG } from '../page';

interface SidebarProps {
  onAddNode: (type: NodeType) => void;
}

const PALETTE_TYPES: NodeType[] = ['screen', 'action', 'logic', 'ai', 'acceptance_tests'];

const PALETTE_ICONS: Record<string, React.ElementType> = {
  screen: Monitor,
  action: Zap,
  logic: GitBranch,
  ai: Sparkles,
  acceptance_tests: CheckSquare,
};

export function Sidebar({ onAddNode }: SidebarProps) {
  return (
    <div
      className="flex flex-col items-center py-4 shrink-0"
      style={{ width: 62, background: '#141414' }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center mb-6"
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #e91e63, #c2185d)',
          boxShadow: '0 0 20px rgba(233,30,99,0.3)',
        }}
      >
        <Workflow size={20} color="white" />
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-2 mb-auto">
        <a
          href="/admin/canvas"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Home size={18} />
        </a>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
          style={{ background: 'rgba(233,30,99,0.12)', color: '#e91e63' }}
        >
          <LayoutGrid size={18} />
        </button>
        <a
          href="#"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Settings size={18} />
        </a>
      </nav>

      {/* Palette */}
      <div
        className="flex flex-col items-center gap-2 pt-3 mt-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        {PALETTE_TYPES.map(type => {
          const Icon = PALETTE_ICONS[type];
          const config = NODE_CONFIG[type];
          return (
            <button
              key={type}
              onClick={() => onAddNode(type)}
              title={`Add ${config.label}`}
              className="flex items-center justify-center transition-transform hover:scale-110"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: config.bg,
                color: config.color,
              }}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>

      {/* Avatar */}
      <div
        className="flex items-center justify-center mt-4 text-xs font-semibold text-gray-400 select-none"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
        }}
      >
        TC
      </div>
    </div>
  );
}
