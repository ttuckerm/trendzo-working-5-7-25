'use client';

import React from 'react';

interface MiniChartProps {
  data: number[];
  color: string;
  height?: number;
}

export default function MiniChart({ data, color, height = 32 }: MiniChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((val, i) => {
        const barHeight = Math.max((val / max) * height, 2);
        const opacity = 0.4 + (i / data.length) * 0.6;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-300"
            style={{
              height: barHeight,
              backgroundColor: color,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}
