'use client';

import React from 'react';
import { ComponentScore } from '@/lib/control-center/types';

interface AccuracyBreakdownProps {
  componentScores: ComponentScore[];
  predicted: number;
  actual: number;
  error: number;
}

export function AccuracyBreakdown({ componentScores, predicted, actual, error }: AccuracyBreakdownProps) {
  const errorPercentage = actual > 0 ? Math.abs((error / actual) * 100) : 0;
  const isOverPrediction = error > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-purple-500/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{predicted.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Predicted DPS</div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{actual.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Actual DPS</div>
        </div>
        <div className={`${error > 10 ? 'bg-red-500/10' : 'bg-yellow-500/10'} rounded-lg p-4 text-center`}>
          <div className={`text-2xl font-bold ${error > 10 ? 'text-red-400' : 'text-yellow-400'}`}>
            {isOverPrediction ? '+' : ''}{error.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            {isOverPrediction ? 'Over' : 'Under'}-prediction ({errorPercentage.toFixed(0)}%)
          </div>
        </div>
      </div>

      {/* Component breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-400 mb-3">Component Contributions</h4>
        <div className="space-y-3">
          {componentScores.map((component, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{component.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">{component.weight}% weight</span>
                  <span className="text-white font-medium">{component.score.toFixed(1)}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    component.score >= 80 ? 'bg-green-500' :
                    component.score >= 60 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${component.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weighted average calculation */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2">Weighted Average Calculation</h4>
        <div className="text-xs text-gray-500 font-mono">
          {componentScores.map((c, i) => (
            <span key={i}>
              ({c.score.toFixed(1)} × {c.weight}%)
              {i < componentScores.length - 1 ? ' + ' : ''}
            </span>
          ))}
          <span className="text-purple-400 ml-2">= {predicted.toFixed(1)} DPS</span>
        </div>
      </div>
    </div>
  );
}

export default AccuracyBreakdown;
































































































