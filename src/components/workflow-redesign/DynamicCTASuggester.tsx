'use client';

import React from 'react';
import type { ContentPurpose } from '@/types/database';

// CTA suggestions organized by content purpose (Know/Like/Trust)
const CTA_SUGGESTIONS: Record<ContentPurpose, string[]> = {
  KNOW: [
    'Follow for more tips like this',
    'Comment below with your biggest struggle',
    'What would you add to this list?',
    'Drop a 🔥 if this helped',
    'Save this for later',
    'Share with someone who needs this',
  ],
  LIKE: [
    'Tag a friend who needs to see this',
    'Share this with your community',
    'Duet this with your reaction',
    'Tell me your story in the comments',
    'Which one resonates with you?',
    'Double tap if you agree',
  ],
  TRUST: [
    'Link in bio for the full guide',
    'DM me "START" to get the template',
    'Comment "HOW" and I\'ll send you the steps',
    'Click the link to book a call',
    'Get the free resource in my bio',
    'Join the waitlist - link in bio',
  ],
};

// Purpose descriptions for context
const PURPOSE_CONTEXT: Record<ContentPurpose, { goal: string; description: string }> = {
  KNOW: {
    goal: 'Build awareness',
    description: 'Get them to discover and follow you. Focus on engagement-driving CTAs.',
  },
  LIKE: {
    goal: 'Build connection',
    description: 'Create relatability and shareability. Focus on community-building CTAs.',
  },
  TRUST: {
    goal: 'Convert to action',
    description: 'Move them toward becoming customers. Focus on conversion CTAs.',
  },
};

interface DynamicCTASuggesterProps {
  purpose: ContentPurpose | null;
  onSelectCTA?: (cta: string) => void;
  currentCTA?: string;
}

export function DynamicCTASuggester({
  purpose,
  onSelectCTA,
  currentCTA,
}: DynamicCTASuggesterProps) {
  if (!purpose) {
    return (
      <div className="text-sm text-zinc-500 italic">
        Select a content purpose in your strategy to see CTA suggestions.
      </div>
    );
  }

  const suggestions = CTA_SUGGESTIONS[purpose];
  const context = PURPOSE_CONTEXT[purpose];

  return (
    <div className="space-y-3">
      {/* Context */}
      <div className="text-sm">
        <span className="font-medium text-zinc-200">{purpose} Goal:</span>{' '}
        <span className="text-zinc-400">{context.description}</span>
      </div>

      {/* Suggestions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((cta, idx) => (
          <button
            key={idx}
            onClick={() => onSelectCTA?.(cta)}
            className={`text-left text-sm p-3 rounded-lg border transition-all ${
              currentCTA === cta
                ? 'border-green-500 bg-green-500/10 text-green-300'
                : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:border-zinc-600'
            }`}
          >
            "{cta}"
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Get CTA suggestions for a given purpose
 * Utility function for use in other components
 */
export function getCTASuggestions(purpose: ContentPurpose | null): string[] {
  if (!purpose) return [];
  return CTA_SUGGESTIONS[purpose] || [];
}

export default DynamicCTASuggester;
