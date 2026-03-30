'use client';

import { Check, X, Undo2 } from 'lucide-react';

export interface FixData {
  category: string; // "HOOK STRATEGY"
  title: string; // "Strengthen Your Opening Hook"
  originalScript: string;
  optimizedScript: string;
  estimatedLift: number; // +8
  retentionImpact?: string; // "Retention predicted +14%"
}

interface FixCardProps {
  fix: FixData;
  status: 'pending' | 'applied' | 'skipped';
  onApply: () => void;
  onSkip: () => void;
  onUndo?: () => void;
}

export function FixCard({ fix, status, onApply, onSkip, onUndo }: FixCardProps) {
  const isApplied = status === 'applied';
  const isSkipped = status === 'skipped';
  const isPending = status === 'pending';

  return (
    <div
      className={`
        bg-gray-800/50 border rounded-2xl p-6 transition-all duration-300
        ${isApplied ? 'border-green-500/50 bg-green-900/10' : ''}
        ${isSkipped ? 'border-gray-600/30 opacity-60' : 'border-gray-700/50'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* VPS Lift Badge */}
          <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full">
            +{fix.estimatedLift} VPS
          </span>
          {/* Category */}
          <span className="text-pink-400 text-xs font-bold uppercase tracking-wider">
            {fix.category}
          </span>
        </div>

        {/* Status indicator */}
        {isApplied && (
          <div className="flex items-center gap-2">
            <span className="text-green-400 text-sm font-medium">Applied</span>
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        {isSkipped && (
          <span className="text-gray-500 text-sm">Skipped</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-4">{fix.title}</h3>

      {/* Script comparison */}
      <div className="space-y-4">
        {/* Original */}
        <div>
          <span className="text-gray-500 text-xs font-bold uppercase tracking-wider block mb-2">
            Original Script:
          </span>
          <p className={`text-gray-400 text-sm leading-relaxed p-3 rounded-lg bg-gray-900/50 ${isApplied ? 'line-through opacity-50' : ''}`}>
            "{fix.originalScript}"
          </p>
        </div>

        {/* Optimized */}
        <div>
          <span className="text-green-400 text-xs font-bold uppercase tracking-wider block mb-2">
            Optimized AI Script:
          </span>
          <p className={`text-white text-sm leading-relaxed p-3 rounded-lg ${isApplied ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-900/50'}`}>
            "{fix.optimizedScript}"
          </p>
        </div>
      </div>

      {/* Retention impact */}
      {fix.retentionImpact && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="text-gray-400">→</span>
          <span className="text-green-400">{fix.retentionImpact}</span>
        </div>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={onSkip}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
            Skip
          </button>
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:scale-105 transition-all"
          >
            <Check className="w-4 h-4" />
            Apply Fix
          </button>
        </div>
      )}

      {/* Undo button for applied/skipped */}
      {!isPending && onUndo && (
        <button
          onClick={onUndo}
          className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
      )}
    </div>
  );
}

export default FixCard;
