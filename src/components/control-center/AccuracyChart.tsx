'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { AccuracyDataPoint } from '@/lib/control-center/types';

interface AccuracyChartProps {
  predictions: AccuracyDataPoint[];
  height?: number;
}

export function AccuracyChart({ predictions, height = 200 }: AccuracyChartProps) {
  if (!predictions || predictions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500">
        No prediction data available
      </div>
    );
  }

  // Find min/max for scaling
  const allValues = predictions.flatMap(p => [p.predicted, p.actual]);
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const range = maxVal - minVal;

  // Calculate positions
  const chartWidth = 100;
  const chartHeight = height;
  const padding = 20;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  const getX = (index: number) => padding + (index / (predictions.length - 1)) * usableWidth;
  const getY = (value: number) => chartHeight - padding - ((value - minVal) / range) * usableHeight;

  // Generate path strings
  const predictedPath = predictions
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.predicted)}`)
    .join(' ');
  
  const actualPath = predictions
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.actual)}`)
    .join(' ');

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm text-gray-400">Predicted DPS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-400">Actual DPS</span>
        </div>
      </div>

      {/* Chart */}
      <svg 
        viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
        className="w-full"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = chartHeight - padding - (pct / 100) * usableHeight;
          const value = minVal + (pct / 100) * range;
          return (
            <g key={pct}>
              <line 
                x1={padding} 
                y1={y} 
                x2={chartWidth - padding} 
                y2={y} 
                stroke="rgba(255,255,255,0.1)" 
                strokeDasharray="2,2"
              />
              <text 
                x={padding - 5} 
                y={y + 3} 
                fill="rgba(255,255,255,0.4)" 
                fontSize="3"
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {predictions.map((p, i) => (
          <text
            key={i}
            x={getX(i)}
            y={chartHeight - 5}
            fill="rgba(255,255,255,0.4)"
            fontSize="3"
            textAnchor="middle"
          >
            {p.date}
          </text>
        ))}

        {/* Predicted line */}
        <path 
          d={predictedPath} 
          fill="none" 
          stroke="rgb(168, 85, 247)" 
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Actual line */}
        <path 
          d={actualPath} 
          fill="none" 
          stroke="rgb(34, 197, 94)" 
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points - Predicted */}
        {predictions.map((p, i) => (
          <circle
            key={`pred-${i}`}
            cx={getX(i)}
            cy={getY(p.predicted)}
            r="1.5"
            fill="rgb(168, 85, 247)"
          />
        ))}

        {/* Data points - Actual */}
        {predictions.map((p, i) => (
          <circle
            key={`actual-${i}`}
            cx={getX(i)}
            cy={getY(p.actual)}
            r="1.5"
            fill="rgb(34, 197, 94)"
          />
        ))}
      </svg>

      {/* Data table below */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs">
              <th className="text-left py-2">Date</th>
              <th className="text-right py-2">Predicted</th>
              <th className="text-right py-2">Actual</th>
              <th className="text-right py-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {predictions.slice(0, 5).map((p, i) => (
              <tr key={i} className="border-t border-gray-800">
                <td className="py-2 text-gray-400">{p.date}</td>
                <td className="py-2 text-right text-purple-400">{p.predicted.toFixed(1)}</td>
                <td className="py-2 text-right text-green-400">{p.actual.toFixed(1)}</td>
                <td className={`py-2 text-right ${p.error > 10 ? 'text-red-400' : p.error < -10 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {p.error > 0 ? '+' : ''}{p.error.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AccuracyChart;
































































































