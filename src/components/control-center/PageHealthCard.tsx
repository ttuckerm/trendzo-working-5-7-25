'use client';

import React from 'react';
import { 
  Download, Upload, FlaskConical, BarChart3, Video, Brain,
  Database, Users, Settings, AlertTriangle, Home, LogIn,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { PageHealth } from '@/lib/control-center/types';
import { StatusDot, StatusBadge } from './StatusDot';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Download,
  Upload,
  FlaskConical,
  BarChart3,
  Video,
  Brain,
  Database,
  Users,
  Settings,
  AlertTriangle,
  Home,
  LogIn
};

interface PageHealthCardProps {
  page: PageHealth;
  onClick?: () => void;
  compact?: boolean;
}

export function PageHealthCard({ page, onClick, compact = false }: PageHealthCardProps) {
  const Icon = iconMap[page.icon] || Database;
  
  const statusColors = {
    healthy: 'border-green-500/30 hover:border-green-500/50 bg-green-500/5',
    warning: 'border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-500/5',
    error: 'border-red-500/30 hover:border-red-500/50 bg-red-500/5',
    inactive: 'border-gray-500/30 hover:border-gray-500/50 bg-gray-500/5',
    running: 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5'
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 p-3 rounded-lg border transition-all
          ${statusColors[page.status]}
          hover:scale-[1.02] cursor-pointer
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <StatusDot status={page.status} />
          <Icon size={16} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-white truncate">{page.name}</span>
        </div>
        <ChevronRight size={14} className="text-gray-500" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all group
        ${statusColors[page.status]}
        hover:scale-[1.02] cursor-pointer
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${page.status === 'healthy' ? 'bg-green-500/20' : 
              page.status === 'warning' ? 'bg-yellow-500/20' : 
              page.status === 'error' ? 'bg-red-500/20' : 'bg-gray-500/20'}
          `}>
            <Icon size={20} className={`
              ${page.status === 'healthy' ? 'text-green-400' : 
                page.status === 'warning' ? 'text-yellow-400' : 
                page.status === 'error' ? 'text-red-400' : 'text-gray-400'}
            `} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{page.name}</h3>
            <p className="text-xs text-gray-500">{page.path}</p>
          </div>
        </div>
        <StatusBadge status={page.status} />
      </div>
      
      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{page.description}</p>
      
      {page.lastError && (
        <div className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded mb-3 truncate">
          {page.lastError}
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{page.workflows.length} workflow{page.workflows.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View details</span>
          <ChevronRight size={12} />
        </div>
      </div>
    </button>
  );
}

interface PageHealthGridProps {
  pages: PageHealth[];
  onPageClick?: (page: PageHealth) => void;
  compact?: boolean;
}

export function PageHealthGrid({ pages, onPageClick, compact = false }: PageHealthGridProps) {
  if (compact) {
    return (
      <div className="grid grid-cols-1 gap-2">
        {pages.map(page => (
          <PageHealthCard 
            key={page.id} 
            page={page} 
            onClick={() => onPageClick?.(page)}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {pages.map(page => (
        <PageHealthCard 
          key={page.id} 
          page={page} 
          onClick={() => onPageClick?.(page)}
        />
      ))}
    </div>
  );
}

export default PageHealthCard;
































































































