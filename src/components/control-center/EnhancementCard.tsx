'use client';

import React from 'react';
import { Check, X, Clock, AlertTriangle, Zap } from 'lucide-react';
import { EnhancementStatus } from '@/lib/control-center/types';

interface EnhancementCardProps {
  enhancement: EnhancementStatus;
}

export function EnhancementCard({ enhancement }: EnhancementCardProps) {
  const getStatusIcon = () => {
    if (enhancement.error) {
      return <AlertTriangle size={16} className="text-red-400" />;
    }
    if (enhancement.usedInPredictions) {
      return <Zap size={16} className="text-green-400" />;
    }
    if (enhancement.connected) {
      return <Check size={16} className="text-yellow-400" />;
    }
    return <X size={16} className="text-gray-500" />;
  };

  const getStatusText = () => {
    if (enhancement.error) return 'Error';
    if (enhancement.usedInPredictions) return 'Active in Predictions';
    if (enhancement.connected) return 'Connected (Not Used)';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (enhancement.error) return 'border-red-500/30 bg-red-500/5';
    if (enhancement.usedInPredictions) return 'border-green-500/30 bg-green-500/5';
    if (enhancement.connected) return 'border-yellow-500/30 bg-yellow-500/5';
    return 'border-gray-500/30 bg-gray-500/5';
  };

  return (
    <div className={`rounded-xl border p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{enhancement.name}</h3>
          <p className="text-xs text-gray-500">{enhancement.description}</p>
        </div>
        {getStatusIcon()}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Installed</span>
          <span className={enhancement.installed ? 'text-green-400' : 'text-red-400'}>
            {enhancement.installed ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Connected</span>
          <span className={enhancement.connected ? 'text-green-400' : 'text-red-400'}>
            {enhancement.connected ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">In Predictions</span>
          <span className={enhancement.usedInPredictions ? 'text-green-400' : 'text-gray-400'}>
            {enhancement.usedInPredictions ? 'Yes' : 'No'}
          </span>
        </div>
        {enhancement.lastUsed && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Used</span>
            <span className="text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {enhancement.lastUsed}
            </span>
          </div>
        )}
      </div>

      {enhancement.error && (
        <div className="mt-3 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
          {enhancement.error}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500">{getStatusText()}</div>
      </div>
    </div>
  );
}

interface EnhancementGridProps {
  enhancements: EnhancementStatus[];
}

export function EnhancementGrid({ enhancements }: EnhancementGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {enhancements.map(enhancement => (
        <EnhancementCard key={enhancement.id} enhancement={enhancement} />
      ))}
    </div>
  );
}

export default EnhancementCard;
































































































