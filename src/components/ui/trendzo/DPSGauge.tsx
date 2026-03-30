'use client';

import { useEffect, useState, useRef } from 'react';
import { getVpsTier } from '@/lib/prediction/system-registry';

export interface VPSGaugeProps {
  score: number; // 0-100
  animate?: boolean; // Count up animation
  size?: 'sm' | 'md' | 'lg'; // 120px, 180px, 240px
  showTier?: boolean; // Show tier badge below score
  confidence?: number; // 0-1, optional — subtly adjusts visual intensity (D6)
}

const SIZES = {
  sm: { width: 120, strokeWidth: 8, fontSize: 'text-2xl', tierSize: 'text-xs' },
  md: { width: 180, strokeWidth: 10, fontSize: 'text-4xl', tierSize: 'text-sm' },
  lg: { width: 240, strokeWidth: 12, fontSize: 'text-5xl', tierSize: 'text-base' },
};

function getGradientColors(score: number): { start: string; end: string } {
  const tier = getVpsTier(score);
  return tier.gradient;
}

export function VPSGauge({ score, animate = true, size = 'md', showTier = true, confidence }: VPSGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const animationRef = useRef<number | null>(null);
  const { width, strokeWidth, fontSize, tierSize } = SIZES[size];
  const tier = getVpsTier(score);
  const colors = getGradientColors(score);

  // D6: Subtle confidence visual cue — lower confidence = more muted appearance
  // Range: 0.5 (low confidence) to 1.0 (high confidence or not provided)
  const confidenceOpacity = confidence !== undefined ? Math.max(0.5, confidence) : 1;

  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const offset = circumference - progress;

  // Generate unique gradient ID for this instance
  const gradientId = `vps-gradient-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds
    const startValue = 0;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (score - startValue) * eased;

      setDisplayScore(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScore);
      }
    };

    animationRef.current = requestAnimationFrame(animateScore);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, animate]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width, opacity: confidenceOpacity }}>
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
          viewBox={`0 0 ${width} ${width}`}
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="100%" stopColor={colors.end} />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="rgba(75, 85, 99, 0.3)"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-100 ease-out"
          />
        </svg>

        {/* Score display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold text-white`}>
            {displayScore.toFixed(1)}
          </span>
          <span className="text-gray-400 text-xs uppercase tracking-wider mt-1">VPS</span>
        </div>
      </div>

      {/* Tier badge */}
      {showTier && (
        <div
          className={`mt-3 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50 ${tierSize} ${tier.colorClass} font-medium`}
          style={{ opacity: confidenceOpacity }}
        >
          {tier.label}
        </div>
      )}
    </div>
  );
}

/** @deprecated Use VPSGauge instead */
export const DPSGauge = VPSGauge;
/** @deprecated Use VPSGaugeProps instead */
export type DPSGaugeProps = VPSGaugeProps;
export default VPSGauge;
