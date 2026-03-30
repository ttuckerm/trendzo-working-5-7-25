'use client';

import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle } from 'lucide-react';

interface PersonalizationToastProps {
  trigger: boolean; // Show toast when this becomes true
  niche?: string;
}

const LEARNING_MESSAGES = [
  "Learning your style...",
  "Analyzing your niche preferences...",
  "Adapting to your audience...",
  "Personalizing content patterns...",
];

const COMPLETE_MESSAGES = [
  "Style preferences saved!",
  "Content personalized to your niche!",
  "AI calibrated to your audience!",
];

export function PersonalizationToast({ trigger, niche }: PersonalizationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [phase, setPhase] = useState<'learning' | 'complete'>('learning');
  const [message, setMessage] = useState(LEARNING_MESSAGES[0]);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    // Only trigger once per session (or when trigger prop changes from false to true)
    if (trigger && !triggered) {
      setTriggered(true);
      setIsVisible(true);
      setPhase('learning');

      // Pick a random learning message
      const learningMsg = LEARNING_MESSAGES[Math.floor(Math.random() * LEARNING_MESSAGES.length)];
      setMessage(learningMsg);

      // After 1.5s, show complete message
      const completeTimer = setTimeout(() => {
        setPhase('complete');
        const completeMsg = COMPLETE_MESSAGES[Math.floor(Math.random() * COMPLETE_MESSAGES.length)];
        setMessage(completeMsg);
      }, 1500);

      // Hide after 3s total
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => {
        clearTimeout(completeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [trigger, triggered]);

  // Reset triggered state when trigger goes false
  useEffect(() => {
    if (!trigger) {
      setTriggered(false);
    }
  }, [trigger]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
        ${phase === 'learning'
          ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30'
          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
        }
        backdrop-blur-xl
      `}>
        {/* Icon */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center
          ${phase === 'learning' ? 'bg-purple-500/30' : 'bg-green-500/30'}
        `}>
          {phase === 'learning' ? (
            <Brain className="w-4 h-4 text-purple-300 animate-pulse" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-300" />
          )}
        </div>

        {/* Message */}
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${
            phase === 'learning' ? 'text-purple-200' : 'text-green-200'
          }`}>
            {message}
          </span>
          {niche && phase === 'learning' && (
            <span className="text-xs text-zinc-400">
              Optimizing for {niche.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Progress dots (only in learning phase) */}
        {phase === 'learning' && (
          <div className="flex gap-1 ml-2">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PersonalizationToast;
