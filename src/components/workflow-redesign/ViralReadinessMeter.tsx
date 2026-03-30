'use client';

import React, { useMemo } from 'react';
import { TrendingUp, Zap, Target, Rocket } from 'lucide-react';
import type { BeatContent } from './FourByFourBeatEditor';

interface ViralReadinessMeterProps {
  beats: BeatContent;
  caption: string;
  hashtags: string[];
  keywords: string[];
}

interface ReadinessLevel {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
}

const READINESS_LEVELS: Record<string, ReadinessLevel> = {
  needsWork: {
    label: 'Needs work',
    color: 'text-red-400',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500/30',
    icon: <Target className="w-4 h-4" />,
  },
  gettingThere: {
    label: 'Getting there',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-500/30',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  goodPotential: {
    label: 'Good potential',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500/30',
    icon: <Zap className="w-4 h-4" />,
  },
  viralReady: {
    label: 'Viral ready! 🚀',
    color: 'text-green-400',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500/30',
    icon: <Rocket className="w-4 h-4" />,
  },
};

function getReadinessLevel(percentage: number): ReadinessLevel {
  if (percentage >= 76) return READINESS_LEVELS.viralReady;
  if (percentage >= 51) return READINESS_LEVELS.goodPotential;
  if (percentage >= 26) return READINESS_LEVELS.gettingThere;
  return READINESS_LEVELS.needsWork;
}

export function ViralReadinessMeter({
  beats,
  caption,
  hashtags,
  keywords,
}: ViralReadinessMeterProps) {
  const { percentage, breakdown } = useMemo(() => {
    let score = 0;
    const breakdown: Record<string, { filled: boolean; points: number }> = {};

    // HOOK: +15%
    const hookFilled = beats.hook.trim().length >= 20;
    breakdown.hook = { filled: hookFilled, points: 15 };
    if (hookFilled) score += 15;

    // PROOF: +15%
    const proofFilled = beats.proof.trim().length >= 30;
    breakdown.proof = { filled: proofFilled, points: 15 };
    if (proofFilled) score += 15;

    // VALUE: +20%
    const valueFilled = beats.value.trim().length >= 50;
    breakdown.value = { filled: valueFilled, points: 20 };
    if (valueFilled) score += 20;

    // CTA: +15%
    const ctaFilled = beats.cta.trim().length >= 15;
    breakdown.cta = { filled: ctaFilled, points: 15 };
    if (ctaFilled) score += 15;

    // Caption with keywords: +20%
    const captionLower = caption.toLowerCase();
    const hasKeywords = keywords.length === 0 || keywords.some(k => captionLower.includes(k.toLowerCase()));
    const captionFilled = caption.trim().length >= 20 && hasKeywords;
    breakdown.caption = { filled: captionFilled, points: 20 };
    if (captionFilled) score += 20;

    // Hashtags (3+): +15%
    const hashtagsFilled = hashtags.length >= 3;
    breakdown.hashtags = { filled: hashtagsFilled, points: 15 };
    if (hashtagsFilled) score += 15;

    return { percentage: score, breakdown };
  }, [beats, caption, hashtags, keywords]);

  const level = getReadinessLevel(percentage);

  return (
    <div className={`bg-zinc-900/50 border ${level.borderColor} rounded-xl p-4 transition-all duration-500`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={level.color}>{level.icon}</div>
          <span className="text-sm font-medium text-white">Viral Readiness</span>
        </div>
        <div className={`text-2xl font-bold ${level.color}`}>
          {percentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${level.bgColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status Label */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${level.color}`}>{level.label}</span>
        <div className="flex gap-1">
          {/* Mini indicators for each section */}
          <div
            className={`w-2 h-2 rounded-full ${breakdown.hook?.filled ? 'bg-blue-500' : 'bg-zinc-700'}`}
            title="Hook"
          />
          <div
            className={`w-2 h-2 rounded-full ${breakdown.proof?.filled ? 'bg-purple-500' : 'bg-zinc-700'}`}
            title="Proof"
          />
          <div
            className={`w-2 h-2 rounded-full ${breakdown.value?.filled ? 'bg-amber-500' : 'bg-zinc-700'}`}
            title="Value"
          />
          <div
            className={`w-2 h-2 rounded-full ${breakdown.cta?.filled ? 'bg-green-500' : 'bg-zinc-700'}`}
            title="CTA"
          />
          <div
            className={`w-2 h-2 rounded-full ${breakdown.caption?.filled ? 'bg-pink-500' : 'bg-zinc-700'}`}
            title="Caption"
          />
          <div
            className={`w-2 h-2 rounded-full ${breakdown.hashtags?.filled ? 'bg-cyan-500' : 'bg-zinc-700'}`}
            title="Hashtags"
          />
        </div>
      </div>

      {/* Breakdown tooltip on hover - simplified inline */}
      {percentage < 100 && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            {!breakdown.hook?.filled && 'Add a hook (20+ chars) • '}
            {!breakdown.proof?.filled && 'Add proof (30+ chars) • '}
            {!breakdown.value?.filled && 'Add value (50+ chars) • '}
            {!breakdown.cta?.filled && 'Add CTA (15+ chars) • '}
            {!breakdown.caption?.filled && 'Add caption with keywords • '}
            {!breakdown.hashtags?.filled && 'Add 3+ hashtags'}
          </p>
        </div>
      )}
    </div>
  );
}

export default ViralReadinessMeter;
