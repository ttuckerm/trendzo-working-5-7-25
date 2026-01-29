import React from 'react';

export function ProgressRing({ value, size = 36, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgb(63 63 70)" strokeWidth={stroke} fill="transparent" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgb(168 85 247)"
        strokeWidth={stroke}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease' }}
      />
    </svg>
  );
}


