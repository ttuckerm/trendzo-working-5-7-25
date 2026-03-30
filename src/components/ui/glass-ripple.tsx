'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

interface GlassRippleProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  disabled?: boolean;
}

export const GlassRipple: React.FC<GlassRippleProps> = ({
  children,
  className,
  color = 'rgba(255, 255, 255, 0.3)',
  disabled = false,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id }]);

    // Clean up after animation completes
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, [disabled]);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onClick={handleClick}
    >
      {children}

      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-glass-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
};

export default GlassRipple;
