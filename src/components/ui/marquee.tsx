'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useMotionValue, useVelocity, useAnimationFrame } from 'framer-motion';
import { cn } from '@/lib/utils';
import { wrap } from '@motionone/utils';

interface MarqueeProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({
  children,
  speed = 50,
  direction = 'left',
  pauseOnHover = false,
  className,
}: MarqueeProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  const x = useTransform(baseX, (v) => `${direction === 'right' ? -v : v}%`);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);

  useAnimationFrame((_, delta) => {
    let moveBy = direction === 'right' ? speed : -speed;
    moveBy = pauseOnHover && isHovered ? 0 : moveBy;

    baseX.set(wrap(-100, 0, baseX.get() + moveBy * delta / 1000));
  });

  return (
    <div 
      ref={containerRef} 
      className={cn("overflow-hidden relative whitespace-nowrap py-5", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex w-full">
        <motion.div
          style={{ x }}
          className="flex items-center gap-8 min-w-full"
        >
          {children}
        </motion.div>
        <motion.div
          style={{ x }}
          className="flex items-center gap-8 min-w-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
} 