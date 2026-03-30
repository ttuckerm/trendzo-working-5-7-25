'use client';

import React, { useEffect, useState } from 'react';

interface WorkflowPickerItem {
  id: string;
  status: 'active' | 'completed';
  currentPhase: number;
  currentPhaseName: string;
  title: string;
  startedAt: string;
  completedAt: string | null;
  lastEditedLabel: string;
}

interface WorkflowPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (workflowId: string) => void;
  onCreateNew: () => void;
}

export function WorkflowPicker({
  isOpen,
  onClose,
  onSelectWorkflow,
  onCreateNew,
}: WorkflowPickerProps) {
  const [workflows, setWorkflows] = useState<WorkflowPickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRecentWorkflows();
    }
  }, [isOpen]);

  async function fetchRecentWorkflows() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/creator-workflows/recent');
      const { data, error: apiError } = await res.json();

      if (apiError) {
        setError(apiError);
      } else {
        setWorkflows(data || []);
      }
    } catch (err) {
      setError('Failed to load workflows');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#1a1a1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Creator Workflow</h2>
          <p className="text-gray-400 text-sm mt-1">
            Start a new workflow or continue where you left off
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Create New Button */}
          <button
            onClick={onCreateNew}
            className="w-full p-4 mb-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] rounded-xl text-white font-bold text-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-2xl">+</span>
            Start New Workflow
          </button>

          {/* Divider */}
          {workflows.length > 0 && (
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-gray-500 text-sm">or continue</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 text-center">
              <div className="inline-block w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-gray-400 mt-2">Loading workflows...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-4 px-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Workflow List */}
          {!isLoading && !error && workflows.length > 0 && (
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => onSelectWorkflow(workflow.id)}
                  className="w-full p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white truncate">
                          {workflow.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            workflow.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {workflow.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span>Phase {workflow.currentPhase}: {workflow.currentPhaseName}</span>
                        <span className="text-gray-600">-</span>
                        <span>{workflow.lastEditedLabel}</span>
                      </div>
                    </div>
                    <div className="text-gray-500 group-hover:text-white transition-colors">
                      &rarr;
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && workflows.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              <p>No workflows yet. Start your first one above!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02]">
          <button
            onClick={onClose}
            className="w-full py-3 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default WorkflowPicker;
