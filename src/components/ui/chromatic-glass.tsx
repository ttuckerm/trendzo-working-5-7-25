'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChromaticGlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 1-10, default 3
  disabled?: boolean;
}

export const ChromaticGlass: React.FC<ChromaticGlassProps> = ({
  children,
  className,
  intensity = 3,
  disabled = false,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left - rect.width / 2) / rect.width,
      y: (e.clientY - rect.top - rect.height / 2) / rect.height,
    });
  }, [disabled]);

  const offset = intensity * (isHovered ? 1 : 0);

  return (
    <div
      className={cn('relative', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: 0, y: 0 });
      }}
    >
      {/* Red channel offset */}
      <motion.div
        className="absolute inset-0 mix-blend-screen pointer-events-none rounded-[inherit]"
        animate={{
          x: mousePos.x * offset,
          y: mousePos.y * offset,
          opacity: isHovered ? 0.15 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: 'rgba(255, 0, 0, 0.1)',
          filter: 'blur(0.5px)',
        }}
      />

      {/* Blue channel offset */}
      <motion.div
        className="absolute inset-0 mix-blend-screen pointer-events-none rounded-[inherit]"
        animate={{
          x: -mousePos.x * offset,
          y: -mousePos.y * offset,
          opacity: isHovered ? 0.15 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: 'rgba(0, 0, 255, 0.1)',
          filter: 'blur(0.5px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default ChromaticGlass;
