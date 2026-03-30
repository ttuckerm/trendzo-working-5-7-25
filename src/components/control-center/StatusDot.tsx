'use client';

import React from 'react';
import { HealthStatus } from '@/lib/control-center/types';
import { STATUS_CONFIG } from '@/lib/control-center/constants';

interface StatusDotProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4'
};

export function StatusDot({ status, size = 'md', pulse = false, className = '' }: StatusDotProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  
  return (
    <span 
      className={`
        inline-block rounded-full ${config.dotColor} ${sizeClasses[size]}
        ${pulse && (status === 'healthy' || status === 'running') ? 'animate-pulse' : ''}
        ${className}
      `}
      title={config.label}
    />
  );
}

interface StatusBadgeProps {
  status: HealthStatus;
  showLabel?: boolean;
  className?: string;
}

export function StatusBadge({ status, showLabel = true, className = '' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
        ${config.bgColor} ${config.color}
        ${className}
      `}
    >
      <StatusDot status={status} size="sm" />
      {showLabel && config.label}
    </span>
  );
}

export default StatusDot;
































































































