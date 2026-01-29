'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TrendingBadgeProps {
  count: number;
}

export function TrendingBadge({ count }: TrendingBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm backdrop-blur-sm"
      style={{
        boxShadow: '0 0 20px rgba(123, 97, 255, 0.3)',
        animation: 'badge-glow 2s ease-in-out infinite',
      }}
    >
      <motion.div
        animate={{ scale: [1, 2, 1] }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="w-2 h-2 bg-red-500 rounded-full"
        style={{
          boxShadow: '0 0 10px rgba(255, 68, 88, 0.8)',
        }}
      />
      <span className="text-white font-medium">
        {count} Templates Trending Now
      </span>

      <style jsx>{`
        @keyframes badge-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(123, 97, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(255, 97, 166, 0.4); }
        }
      `}</style>
    </motion.div>
  );
} 