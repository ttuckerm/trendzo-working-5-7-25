'use client';

import React from 'react';
import { AlertTriangle, AlertOctagon, Info, ExternalLink, Clock, Check } from 'lucide-react';
import { ErrorLogEntry } from '@/lib/control-center/types';

interface ErrorItemProps {
  error: ErrorLogEntry;
  onResolve?: (id: string) => void;
  onClick?: () => void;
}

export function ErrorItem({ error, onResolve, onClick }: ErrorItemProps) {
  const getIcon = () => {
    switch (error.severity) {
      case 'error':
        return <AlertOctagon size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const severityColors = {
    error: 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10',
    info: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
  };

  return (
    <div 
      onClick={onClick}
      className={`
        rounded-lg border p-4 transition-all cursor-pointer
        ${severityColors[error.severity]}
        ${error.resolved ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-white">{error.source}</span>
            {error.sourcePath && (
              <span className="text-xs text-gray-500">{error.sourcePath}</span>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-2">{error.message}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {getTimeAgo(error.timestamp)}
            </span>
            {error.sourcePath && (
              <a 
                href={error.sourcePath}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                View Page
              </a>
            )}
          </div>
        </div>
        {!error.resolved && onResolve && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onResolve(error.id);
            }}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Mark as resolved"
          >
            <Check size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ErrorListProps {
  errors: ErrorLogEntry[];
  onResolve?: (id: string) => void;
  onErrorClick?: (error: ErrorLogEntry) => void;
}

export function ErrorList({ errors, onResolve, onErrorClick }: ErrorListProps) {
  const sortedErrors = [...errors].sort((a, b) => {
    // Sort by severity first, then by timestamp
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  if (errors.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
        <p>No errors to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedErrors.map(error => (
        <ErrorItem 
          key={error.id} 
          error={error} 
          onResolve={onResolve}
          onClick={() => onErrorClick?.(error)}
        />
      ))}
    </div>
  );
}

export default ErrorItem;
































































































