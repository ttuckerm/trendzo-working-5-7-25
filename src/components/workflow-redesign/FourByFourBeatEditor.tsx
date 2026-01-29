'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Clock, ChevronDown, ChevronUp, Play, Eye, ThumbsUp } from 'lucide-react';

export interface BeatContent {
  hook: string;
  proof: string;
  value: string;
  cta: string;
}

interface FourByFourBeatEditorProps {
  beats: BeatContent;
  onBeatsChange: (beats: BeatContent) => void;
  onGenerateSection?: (section: keyof BeatContent) => void;
  isGenerating?: keyof BeatContent | null;
  ctaSuggestions?: string[];
  niche?: string;
}

// Mock content for AI Generate buttons
const MOCK_CONTENT: Record<keyof BeatContent, string> = {
  hook: "If you're struggling to make money on the side, here's what nobody tells you...",
  proof: "According to a 2024 study, 67% of successful side hustlers started with zero experience. After helping over 500 people start their first side hustle, I've discovered the pattern that separates those who succeed from those who give up.",
  value: "Here's the exact 3-step process I used to make my first $1000:\n\n1. Pick ONE skill you already have (writing, design, organizing - anything counts)\n2. Find 3 potential clients in your network (friends, family, local businesses)\n3. Deliver amazing work, ask for referrals, and repeat\n\nThe key is starting small and building momentum. Don't try to build the perfect business on day one.",
  cta: "Follow for more side hustle tips that actually work. Drop a 🔥 in the comments if you're ready to start!",
};

// Mock viral video examples by section type
const MOCK_VIRAL_EXAMPLES: Record<keyof BeatContent, Array<{
  title: string;
  views: string;
  likes: string;
  thumbnail: string;
}>> = {
  hook: [
    { title: "The hook that got 2M views", views: "2.1M", likes: "89K", thumbnail: "🎬" },
    { title: "Why this opening line works", views: "1.4M", likes: "62K", thumbnail: "🎥" },
    { title: "Pattern interrupt example", views: "890K", likes: "41K", thumbnail: "📹" },
  ],
  proof: [
    { title: "Authority proof that converts", views: "1.8M", likes: "76K", thumbnail: "📊" },
    { title: "Social proof done right", views: "1.2M", likes: "55K", thumbnail: "✅" },
    { title: "Stats that grab attention", views: "950K", likes: "43K", thumbnail: "📈" },
  ],
  value: [
    { title: "3-step framework breakdown", views: "3.2M", likes: "142K", thumbnail: "💡" },
    { title: "Teaching content that retains", views: "2.4M", likes: "98K", thumbnail: "📚" },
    { title: "Value delivery masterclass", views: "1.7M", likes: "71K", thumbnail: "🎓" },
  ],
  cta: [
    { title: "CTA that got 50K follows", views: "1.5M", likes: "68K", thumbnail: "🚀" },
    { title: "Comment engagement hack", views: "1.1M", likes: "52K", thumbnail: "💬" },
    { title: "DM funnel that works", views: "870K", likes: "39K", thumbnail: "📩" },
  ],
};

// Proof Badge Component
interface ProofBadgeProps {
  niche: string;
  beatKey: keyof BeatContent;
  onExpand: () => void;
  isExpanded: boolean;
}

function ProofBadge({ niche, beatKey, onExpand, isExpanded }: ProofBadgeProps) {
  // Random-ish number based on beat key for consistency
  const videoCount = { hook: 47, proof: 52, value: 63, cta: 41 }[beatKey];

  return (
    <div className="mt-2 space-y-2">
      {/* Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full px-2 py-0.5 text-purple-300">
            ✨ Based on {videoCount} viral videos in {niche || 'your niche'}
          </span>
        </div>
        <button
          onClick={onExpand}
          className="text-xs text-zinc-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
        >
          Show me why this works
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
}

// Viral Examples Panel
interface ViralExamplesPanelProps {
  beatKey: keyof BeatContent;
  isExpanded: boolean;
}

function ViralExamplesPanel({ beatKey, isExpanded }: ViralExamplesPanelProps) {
  const examples = MOCK_VIRAL_EXAMPLES[beatKey];

  if (!isExpanded) return null;

  return (
    <div className="mt-3 bg-zinc-900/80 border border-zinc-700 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
      <div className="text-xs font-medium text-zinc-400 mb-2">
        Top performing {beatKey}s in this format:
      </div>

      {/* Mini carousel of examples */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {examples.map((example, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[140px] bg-zinc-800 rounded-lg overflow-hidden hover:bg-zinc-750 transition-colors cursor-pointer group"
          >
            {/* Thumbnail placeholder */}
            <div className="h-20 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center relative">
              <span className="text-2xl">{example.thumbnail}</span>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Info */}
            <div className="p-2">
              <div className="text-xs text-zinc-300 font-medium truncate">
                {example.title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {example.views}
                </span>
                <span className="flex items-center gap-0.5">
                  <ThumbsUp className="w-3 h-3" />
                  {example.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-zinc-500 italic">
        Content generated using patterns from these top-performing videos
      </div>
    </div>
  );
}

interface BeatQuadrantProps {
  label: string;
  beatKey: keyof BeatContent;
  timing: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  suggestions?: string[];
  color: string;
  bgColor: string;
  niche?: string;
}

function BeatQuadrant({
  label,
  beatKey,
  timing,
  placeholder,
  value,
  onChange,
  onGenerate,
  isGenerating,
  suggestions,
  color,
  bgColor,
  niche,
}: BeatQuadrantProps) {
  const [localGenerating, setLocalGenerating] = useState(false);
  const [wasAIGenerated, setWasAIGenerated] = useState(false);
  const [showProofPanel, setShowProofPanel] = useState(false);

  const charCount = value.length;
  const maxChars = beatKey === 'hook' ? 150 : 300;

  const handleGenerate = async () => {
    if (onGenerate) {
      // Use provided generator
      onGenerate();
      setWasAIGenerated(true);
    } else {
      // Use mock content with simulated delay
      setLocalGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 800));

      // For CTA, use the first suggestion if available, otherwise use mock
      if (beatKey === 'cta' && suggestions && suggestions.length > 0) {
        onChange(suggestions[0]);
      } else {
        onChange(MOCK_CONTENT[beatKey]);
      }
      setLocalGenerating(false);
      setWasAIGenerated(true);
    }
  };

  const showGenerating = isGenerating || localGenerating;

  return (
    <Card className={`${bgColor} border-2 ${color} p-4 flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${color.replace('border-', 'text-')}`}>
            {label}
          </span>
          <span className="text-xs text-zinc-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timing}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGenerate}
          disabled={showGenerating}
          className="h-7 px-2 text-zinc-300 hover:text-white hover:bg-zinc-700"
        >
          <Sparkles className={`w-3 h-3 mr-1 ${showGenerating ? 'animate-spin' : ''}`} />
          {showGenerating ? 'Generating...' : 'AI Generate'}
        </Button>
      </div>

      {/* Textarea */}
      <Textarea
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          // If user edits after AI generation, keep the proof badge visible
        }}
        className="flex-1 min-h-[100px] bg-zinc-900/50 border-zinc-700 resize-none text-zinc-100 placeholder:text-zinc-400"
      />

      {/* Proof Badge - shows after AI generation */}
      {wasAIGenerated && value.length > 0 && (
        <ProofBadge
          niche={niche || 'your niche'}
          beatKey={beatKey}
          onExpand={() => setShowProofPanel(!showProofPanel)}
          isExpanded={showProofPanel}
        />
      )}

      {/* Viral Examples Panel */}
      <ViralExamplesPanel beatKey={beatKey} isExpanded={showProofPanel} />

      {/* Suggestions (for CTA) */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-zinc-300 font-medium">Suggested CTAs:</div>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 3).map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onChange(suggestion)}
                className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Character count */}
      <div className="mt-2 text-xs text-zinc-300 text-right">
        <span className={charCount > maxChars ? 'text-red-400' : ''}>
          {charCount}
        </span>
        /{maxChars}
      </div>
    </Card>
  );
}

export function FourByFourBeatEditor({
  beats,
  onBeatsChange,
  onGenerateSection,
  isGenerating,
  ctaSuggestions = [],
  niche,
}: FourByFourBeatEditorProps) {
  const updateBeat = (key: keyof BeatContent, value: string) => {
    onBeatsChange({ ...beats, [key]: value });
  };

  const nicheDisplay = niche?.replace(/_/g, ' ') || 'your niche';

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">4x4 Video Structure</h3>
        <div className="text-xs text-zinc-300">
          Paul's proven framework: Hook → Proof → Value → CTA
        </div>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <BeatQuadrant
          label="1. HOOK"
          beatKey="hook"
          timing="0-4 seconds"
          placeholder="Start with a pain point, desire, or polarizing statement...

Examples:
• 'If you're struggling to...'
• 'Nobody talks about this but...'
• 'Stop doing [X] if you want [Y]'"
          value={beats.hook}
          onChange={v => updateBeat('hook', v)}
          onGenerate={onGenerateSection ? () => onGenerateSection('hook') : undefined}
          isGenerating={isGenerating === 'hook'}
          color="border-blue-500"
          bgColor="bg-blue-500/5"
          niche={nicheDisplay}
        />

        <BeatQuadrant
          label="2. PROOF"
          beatKey="proof"
          timing="4-10 seconds"
          placeholder="Back up your hook with credibility...

Examples:
• Stats: 'According to [study]...'
• Authority: 'After 10 years of...'
• Social proof: '10,000 people have...'"
          value={beats.proof}
          onChange={v => updateBeat('proof', v)}
          onGenerate={onGenerateSection ? () => onGenerateSection('proof') : undefined}
          isGenerating={isGenerating === 'proof'}
          color="border-purple-500"
          bgColor="bg-purple-500/5"
          niche={nicheDisplay}
        />

        {/* Row 2 */}
        <BeatQuadrant
          label="3. VALUE"
          beatKey="value"
          timing="10-45 seconds"
          placeholder="Deliver the actual value/content...

Examples:
• Steps: 'Here's exactly how...'
• Tips: 'The 3 things you need...'
• Process: 'First... then... finally...'"
          value={beats.value}
          onChange={v => updateBeat('value', v)}
          onGenerate={onGenerateSection ? () => onGenerateSection('value') : undefined}
          isGenerating={isGenerating === 'value'}
          color="border-amber-500"
          bgColor="bg-amber-500/5"
          niche={nicheDisplay}
        />

        <BeatQuadrant
          label="4. CTA"
          beatKey="cta"
          timing="45-60 seconds"
          placeholder="Tell them what to do next...

Based on your content purpose (Know/Like/Trust)"
          value={beats.cta}
          onChange={v => updateBeat('cta', v)}
          onGenerate={onGenerateSection ? () => onGenerateSection('cta') : undefined}
          isGenerating={isGenerating === 'cta'}
          suggestions={ctaSuggestions}
          color="border-green-500"
          bgColor="bg-green-500/5"
          niche={nicheDisplay}
        />
      </div>

      {/* Visual Flow */}
      <div className="hidden md:flex items-center justify-center text-zinc-600 text-sm gap-4 pt-2">
        <span className="text-blue-400">Hook</span>
        <span>→</span>
        <span className="text-purple-400">Proof</span>
        <span>→</span>
        <span className="text-amber-400">Value</span>
        <span>→</span>
        <span className="text-green-400">CTA</span>
      </div>
    </div>
  );
}

export default FourByFourBeatEditor;
