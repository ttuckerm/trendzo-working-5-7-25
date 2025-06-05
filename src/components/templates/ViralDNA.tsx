'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ViralDNAProps {
  score: number;
  className?: string;
}

export function ViralDNA({ score, className }: ViralDNAProps) {
  // Determine number of DNA dots based on viral score
  const dotCount = score >= 90 ? 3 : score >= 70 ? 2 : 1;
  
  return (
    <div className={cn("absolute top-5 right-5 flex gap-2 z-10", className)}>
      {Array.from({ length: dotCount }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: i * 0.1,
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 2 - i * 0.2,
          }}
          className={cn(
            "w-3 h-3 rounded-full",
            "bg-gradient-to-br from-purple-400 to-pink-600",
            "shadow-lg shadow-purple-500/50"
          )}
          style={{
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
} 