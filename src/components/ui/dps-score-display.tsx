'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GlassCard } from './glass-card';
import { glassTokens, getDPSColor, getDPSGlow, dpsThresholds } from '@/lib/design-system/glass-config';

interface DPSScoreDisplayProps {
  score: number;
  confidence?: number;
  range?: [number, number];
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onAnimationComplete?: () => void;
}

export const DPSScoreDisplay: React.FC<DPSScoreDisplayProps> = ({
  score,
  confidence = 0,
  range = [0, 100],
  animated = true,
  size = 'lg',
  showDetails = true,
  onAnimationComplete,
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  const scoreColor = getDPSColor(score);
  const scoreGlow = getDPSGlow(score);

  // Animated count-up effect
  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    const duration = 2000; // 2 seconds
    const steps = 60;
    let step = 0;

    const interval = setInterval(() => {
      step++;

      // Ease out cubic for natural feel
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased * 10) / 10);

      if (step >= steps) {
        setDisplayScore(score);
        clearInterval(interval);
        onAnimationComplete?.();
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score, animated, onAnimationComplete]);

  const sizeStyles = {
    sm: { score: 'text-4xl', label: 'text-xs', padding: 'p-4' },
    md: { score: 'text-6xl', label: 'text-sm', padding: 'p-6' },
    lg: { score: 'text-8xl', label: 'text-base', padding: 'p-8' },
  };

  const styles = sizeStyles[size];

  return (
    <GlassCard
      variant="elevated"
      className={cn('text-center', styles.padding)}
      style={{ boxShadow: score >= dpsThresholds.viral ? scoreGlow : undefined }}
    >
      {/* Animated score */}
      <motion.div
        initial={animated ? { scale: 0.5, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={glassTokens.spring.bouncy}
      >
        <span
          className={cn(
            styles.score,
            'font-bold tabular-nums tracking-tight'
          )}
          style={{ color: scoreColor }}
        >
          {displayScore.toFixed(1)}
        </span>
      </motion.div>

      <motion.p
        className={cn('mt-2', styles.label)}
        style={{ color: 'var(--glass-text-secondary)' }}
        initial={animated ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Predicted DPS
      </motion.p>

      {showDetails && (
        <motion.div
          initial={animated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Range indicator */}
          <div
            className="mt-4 flex items-center justify-center gap-2 text-sm"
            style={{ color: 'var(--glass-text-tertiary)' }}
          >
            <span>Range: [{range[0].toFixed(1)} - {range[1].toFixed(1)}]</span>
          </div>

          {/* Confidence bar */}
          {confidence > 0 && (
            <div className="mt-4">
              <div
                className="flex justify-between text-xs mb-1"
                style={{ color: 'var(--glass-text-tertiary)' }}
              >
                <span>Confidence</span>
                <span>{Math.round(confidence * 100)}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'var(--glass-bg-primary)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${glassTokens.colors.accentSecondary}, ${glassTokens.colors.accentTertiary})`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence * 100}%` }}
                  transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </GlassCard>
  );
};

export default DPSScoreDisplay;
