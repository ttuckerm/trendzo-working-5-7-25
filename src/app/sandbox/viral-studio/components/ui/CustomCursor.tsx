'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && (
        target.closest('button') ||
        target.closest('.cursor-hover') ||
        target.closest('.path-card') ||
        target.closest('.template-card') ||
        target.closest('.trending-sound')
      )) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && target.closest && (
        target.closest('button') ||
        target.closest('.cursor-hover') ||
        target.closest('.path-card') ||
        target.closest('.template-card') ||
        target.closest('.trending-sound')
      )) {
        setIsHovering(false);
      }
    };

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
    };
  }, []);

  return (
    <motion.div
      className="fixed pointer-events-none z-[10000] mix-blend-screen"
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: isHovering 
          ? 'radial-gradient(circle, rgba(255, 97, 166, 0.8) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(123, 97, 255, 0.8) 0%, transparent 70%)'
      }}
      animate={{
        x: mousePosition.x - 10,
        y: mousePosition.y - 10,
        scale: isHovering ? 2 : 1
      }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 120,
        mass: 0.1
      }}
    />
  );
}