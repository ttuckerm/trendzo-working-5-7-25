'use client';

import React from 'react';

interface PulseDotProps {
  color?: string;
  size?: 'sm' | 'md';
}

export default function PulseDot({ color = '#2dd4a8', size = 'sm' }: PulseDotProps) {
  const sizeClasses = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <span className={`relative flex ${sizeClasses}`}>
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50`}
        style={{ backgroundColor: color }}
      />
      <span
        className={`relative inline-flex rounded-full ${sizeClasses}`}
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
