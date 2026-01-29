'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { glassTokens, CONFETTI_COLORS } from '@/lib/design-system/glass-config';

interface ViralCelebrationProps {
  score: number;
  threshold?: number;
  onComplete?: () => void;
}

export const ViralCelebration: React.FC<ViralCelebrationProps> = ({
  score,
  threshold = 80,
  onComplete,
}) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (score >= threshold) {
      setIsActive(true);

      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [score, threshold, onComplete]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Radial burst background */}
        <motion.div
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, ${glassTokens.colors.success}40 0%, transparent 70%)`,
            width: '200vmax',
            height: '200vmax',
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Confetti particles */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i / 60) * Math.PI * 2;
          const distance = 300 + Math.random() * 400;
          const duration = 1.5 + Math.random() * 1;
          const size = 8 + Math.random() * 8;

          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              }}
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance - 200, // Bias upward
                scale: [0, 1.2, 0],
                rotate: Math.random() * 720 - 360,
              }}
              transition={{
                duration,
                delay: Math.random() * 0.3,
                ease: 'easeOut',
              }}
            />
          );
        })}

        {/* "VIRAL!" text */}
        <motion.div
          className="relative text-center"
          initial={{ scale: 0, rotate: -15 }}
          animate={{
            scale: [0, 1.3, 1],
            rotate: [-15, 5, 0],
          }}
          transition={{
            duration: 0.6,
            times: [0, 0.6, 1],
            ease: 'easeOut',
          }}
        >
          <span
            className="text-6xl md:text-8xl font-black"
            style={{
              color: glassTokens.colors.success,
              textShadow: `0 0 60px ${glassTokens.colors.success}80`,
            }}
          >
            🔥 VIRAL! 🔥
          </span>

          <motion.p
            className="mt-4 text-xl"
            style={{ color: 'var(--glass-text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Score: {score.toFixed(1)} DPS
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ViralCelebration;
