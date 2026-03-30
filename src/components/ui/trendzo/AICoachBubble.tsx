'use client';

import { X, Bot, Sparkles } from 'lucide-react';

interface AICoachBubbleProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'default' | 'celebration' | 'tip';
}

const VARIANTS = {
  default: {
    gradient: 'from-purple-600 to-pink-600',
    icon: Bot,
    borderColor: 'border-purple-500/30',
  },
  celebration: {
    gradient: 'from-green-500 to-emerald-500',
    icon: Sparkles,
    borderColor: 'border-green-500/30',
  },
  tip: {
    gradient: 'from-blue-500 to-cyan-500',
    icon: Bot,
    borderColor: 'border-blue-500/30',
  },
};

export function AICoachBubble({ message, onDismiss, variant = 'default' }: AICoachBubbleProps) {
  const { gradient, icon: Icon, borderColor } = VARIANTS[variant];

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        max-w-sm
        bg-gradient-to-r ${gradient}
        rounded-2xl p-4 pr-10
        border ${borderColor}
        shadow-lg shadow-purple-500/20
        animate-in slide-in-from-bottom-4 fade-in duration-300
      `}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-white/80" />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Message */}
        <div>
          <p className="text-sm font-medium text-white/90 leading-relaxed">
            {message}
          </p>
          <p className="text-xs text-white/60 mt-1">Trendzo AI Coach</p>
        </div>
      </div>
    </div>
  );
}

export default AICoachBubble;
