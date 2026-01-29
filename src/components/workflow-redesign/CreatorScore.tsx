'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Star, Sparkles } from 'lucide-react';

interface CreatorScoreProps {
  onScriptComplete?: boolean; // Trigger celebration when true
}

// Local storage keys
const SCORE_KEY = 'trendzo_creator_score';
const STREAK_KEY = 'trendzo_creator_streak';
const LAST_CREATE_KEY = 'trendzo_last_create_date';

function getStoredScore(): number {
  if (typeof window === 'undefined') return 73;
  return parseInt(localStorage.getItem(SCORE_KEY) || '73', 10);
}

function getStoredStreak(): number {
  if (typeof window === 'undefined') return 5;

  const lastCreate = localStorage.getItem(LAST_CREATE_KEY);
  const streak = parseInt(localStorage.getItem(STREAK_KEY) || '5', 10);

  if (!lastCreate) return streak;

  const lastDate = new Date(lastCreate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  // If more than 1 day gap, reset streak
  if (diffDays > 1) {
    localStorage.setItem(STREAK_KEY, '1');
    return 1;
  }

  return streak;
}

export function CreatorScore({ onScriptComplete }: CreatorScoreProps) {
  const [score, setScore] = useState(73);
  const [streak, setStreak] = useState(5);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setScore(getStoredScore());
    setStreak(getStoredStreak());
  }, []);

  // Handle script completion
  useEffect(() => {
    if (onScriptComplete) {
      // Add points
      const newScore = score + 10;
      setScore(newScore);
      localStorage.setItem(SCORE_KEY, newScore.toString());

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const lastCreate = localStorage.getItem(LAST_CREATE_KEY);

      if (lastCreate !== today) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem(STREAK_KEY, newStreak.toString());
        localStorage.setItem(LAST_CREATE_KEY, today);
      }

      // Show animations
      setShowPointsAnimation(true);
      setShowConfetti(true);

      // Hide animations after delay
      setTimeout(() => setShowPointsAnimation(false), 2000);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [onScriptComplete]);

  return (
    <div className="relative flex items-center gap-4">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Simple CSS confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Creator Score */}
      <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-1.5 relative">
        <Star className="w-4 h-4 text-amber-400" />
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 leading-none">Creator Score</span>
          <span className="text-lg font-bold text-white leading-none">{score}</span>
        </div>

        {/* Points Animation */}
        {showPointsAnimation && (
          <div className="absolute -top-8 right-0 animate-bounce">
            <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/50 rounded-full px-2 py-1">
              <Sparkles className="w-3 h-3 text-green-400" />
              <span className="text-xs font-semibold text-green-400">+10</span>
            </div>
          </div>
        )}
      </div>

      {/* Streak */}
      <div
        className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 rounded-lg px-2.5 py-1.5"
        title="You've created content multiple days in a row!"
      >
        <Flame className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-orange-400">{streak} day streak</span>
      </div>

      {/* Add confetti keyframes via style tag */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

export default CreatorScore;
