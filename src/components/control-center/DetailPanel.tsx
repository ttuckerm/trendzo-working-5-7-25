'use client';

import React from 'react';
import Link from 'next/link';
import { X, ExternalLink, Clock, Zap, AlertTriangle, Check, Play, Settings, GitBranch } from 'lucide-react';
import { PageHealth, ComponentHealth } from '@/lib/control-center/types';
import { StatusBadge } from './StatusDot';
import { CATEGORY_CONFIG } from '@/lib/control-center/constants';

interface DetailPanelProps {
  item: PageHealth | ComponentHealth | null;
  type: 'page' | 'component' | null;
  onClose: () => void;
}

function isPageHealth(item: PageHealth | ComponentHealth): item is PageHealth {
  return 'workflows' in item;
}

// Map page IDs to their workflow visualization routes
const WORKFLOW_ROUTES: Record<string, string> = {
  'upload-test': '/admin/control-center/workflow/upload-test',
  // Add more pages as workflow visualizations are built
};

export function DetailPanel({ item, type, onClose }: DetailPanelProps) {
  if (!item) return null;

  const pageId = isPageHealth(item) ? item.id : '';
  const hasWorkflowPage = pageId && WORKFLOW_ROUTES[pageId];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-white">{item.name}</h2>
            <p className="text-sm text-gray-500">
              {type === 'page' ? 'Page Details' : 'Component Details'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status</span>
            <StatusBadge status={item.status} />
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
            <p className="text-white">{item.description}</p>
          </div>

          {type === 'page' && isPageHealth(item) && (
            <>
              {/* Path */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Path</h3>
                <a 
                  href={item.path}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
                >
                  {item.path}
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Workflows */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Workflows</h3>
                <div className="space-y-2">
                  {item.workflows.map(workflow => (
                    <div 
                      key={workflow.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {workflow.status === 'healthy' ? (
                          <Check size={16} className="text-green-400" />
                        ) : workflow.status === 'warning' ? (
                          <AlertTriangle size={16} className="text-yellow-400" />
                        ) : (
                          <AlertTriangle size={16} className="text-red-400" />
                        )}
                        <div>
                          <div className="text-white text-sm">{workflow.name}</div>
                          {workflow.error && (
                            <div className="text-xs text-red-400">{workflow.error}</div>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={workflow.status} showLabel={false} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Components Used */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Components Used</h3>
                <div className="flex flex-wrap gap-2">
                  {item.components.map(comp => (
                    <span 
                      key={comp}
                      className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Error */}
              {item.lastError && (
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-2">Current Issue</h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                    {item.lastError}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'component' && !isPageHealth(item) && (
            <>
              {/* Category */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Category</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${CATEGORY_CONFIG[item.category]?.bgColor || ''} ${CATEGORY_CONFIG[item.category]?.color || ''}`}>
                  {CATEGORY_CONFIG[item.category]?.label || item.category}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {item.latency && (
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Clock size={12} />
                      Latency
                    </div>
                    <div className="text-xl font-bold text-white">
                      {item.latency < 1000 ? `${item.latency}ms` : `${(item.latency / 1000).toFixed(1)}s`}
                    </div>
                  </div>
                )}
                {item.accuracy !== undefined && (
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Zap size={12} />
                      Accuracy
                    </div>
                    <div className="text-xl font-bold text-green-400">
                      {item.accuracy}%
                    </div>
                  </div>
                )}
              </div>

              {/* Last Run */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Last Run</h3>
                <p className="text-white">{item.lastRun}</p>
              </div>

              {/* Error */}
              {item.error && (
                <div>
                  <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
                    {item.error}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-gray-800 space-y-2">
            {type === 'page' && isPageHealth(item) && (
              <>
                <a
                  href={item.path}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                >
                  <ExternalLink size={16} />
                  Open Page
                </a>
                {/* Workflow Architecture Link - Only for pages with workflow visualizations */}
                {hasWorkflowPage && (
                  <Link
                    href={WORKFLOW_ROUTES[pageId]}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-white transition-colors font-medium"
                  >
                    <GitBranch size={16} />
                    View Workflow Architecture
                  </Link>
                )}
              </>
            )}
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors">
              <Play size={16} />
              Run Health Check
            </button>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors">
              <Settings size={16} />
              Configure
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default DetailPanel;





























































