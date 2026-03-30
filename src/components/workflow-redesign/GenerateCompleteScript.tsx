'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, PartyPopper } from 'lucide-react';
import type { BeatContent } from './FourByFourBeatEditor';
import type { ContentStrategy } from '@/types/database';

interface GenerateCompleteScriptProps {
  strategy: ContentStrategy | null;
  onGenerate: (data: {
    beats: BeatContent;
    caption: string;
    hashtags: string[];
  }) => void;
}

// Loading messages that cycle during generation
const LOADING_MESSAGES = [
  "Analyzing 500+ viral videos in your niche...",
  "Finding the perfect hook for your audience...",
  "Crafting proof that builds credibility...",
  "Optimizing for maximum engagement...",
  "Adding the finishing touches...",
];

// Niche-specific mock content generators
function generateMockContent(strategy: ContentStrategy): {
  beats: BeatContent;
  caption: string;
  hashtags: string[];
} {
  const niche = strategy.niche.replace(/_/g, ' ');
  const purpose = strategy.content_purpose;
  const keywords = strategy.keywords || [];
  const keywordText = keywords.length > 0 ? keywords[0] : niche;

  // Purpose-based CTAs
  const ctaByPurpose: Record<string, string> = {
    KNOW: `Follow for more ${niche} tips and drop a 🔥 in the comments if this helped!`,
    LIKE: `Tag someone who needs to hear this! Share with a friend who's into ${niche}.`,
    TRUST: `DM me "${keywordText.toUpperCase()}" to get my free guide, or tap the link in bio!`,
  };

  // Generate personalized content
  const beats: BeatContent = {
    hook: `If you're trying to succeed in ${niche}, here's what nobody tells you...`,
    proof: `After studying 500+ viral videos in the ${niche} space and helping thousands of creators, I've discovered the exact pattern that separates viral content from content that flops.`,
    value: `Here's the 3-step framework that works every time:\n\n1. Start with a pattern interrupt (that's what we just did with the hook)\n2. Back it up with real proof - stats, results, or authority\n3. Deliver actual value they can use TODAY\n\nThe key? ${keywords.length > 0 ? `Focus on ${keywords.join(', ')} - ` : ''}Make them feel like they discovered something new.`,
    cta: ctaByPurpose[purpose] || ctaByPurpose.KNOW,
  };

  // Generate caption with keywords
  const caption = `The ${niche} secret that changed everything for me 👇\n\n${keywords.length > 0 ? `If you're looking for ${keywords.slice(0, 2).join(' and ')}, this is it.\n\n` : ''}Save this for later and share with someone who needs to see it!`;

  // Generate hashtags based on niche
  const nicheHashtags: Record<string, string[]> = {
    personal_finance: ['#personalfinance', '#moneytips', '#financialfreedom', '#budgeting', '#wealth'],
    side_hustles: ['#sidehustle', '#makemoneyonline', '#entrepreneur', '#passiveincome', '#hustle'],
    entrepreneurship: ['#entrepreneur', '#business', '#startup', '#ceo', '#success'],
    fitness: ['#fitness', '#workout', '#gym', '#fitnessmotivation', '#health'],
    health_wellness: ['#wellness', '#health', '#selfcare', '#mentalhealth', '#healthylifestyle'],
    beauty: ['#beauty', '#skincare', '#makeup', '#glowup', '#beautytips'],
    fashion: ['#fashion', '#style', '#ootd', '#fashiontips', '#outfitinspo'],
    food_cooking: ['#cooking', '#recipe', '#foodie', '#homecooking', '#delicious'],
    travel: ['#travel', '#wanderlust', '#adventure', '#explore', '#vacation'],
    tech: ['#tech', '#technology', '#gadgets', '#innovation', '#techtips'],
    gaming: ['#gaming', '#gamer', '#videogames', '#twitch', '#esports'],
    education: ['#education', '#learning', '#studytips', '#knowledge', '#growth'],
    parenting: ['#parenting', '#momlife', '#dadlife', '#family', '#parentingtips'],
    relationships: ['#relationships', '#dating', '#love', '#advice', '#couples'],
    comedy: ['#comedy', '#funny', '#humor', '#memes', '#lol'],
    motivation: ['#motivation', '#inspiration', '#mindset', '#success', '#goals'],
    lifestyle: ['#lifestyle', '#life', '#dailylife', '#aesthetic', '#vibes'],
  };

  const hashtags = nicheHashtags[strategy.niche] || ['#viral', '#trending', '#fyp', '#foryou', '#tips'];

  return { beats, caption, hashtags };
}

export function GenerateCompleteScript({ strategy, onGenerate }: GenerateCompleteScriptProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleGenerate = async () => {
    if (!strategy) return;

    setIsGenerating(true);
    setShowCelebration(false);

    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 1200);

    // Simulate AI generation time (2.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    clearInterval(messageInterval);

    // Generate content
    const generatedContent = generateMockContent(strategy);
    onGenerate(generatedContent);

    setIsGenerating(false);
    setShowCelebration(true);

    // Hide celebration after 3 seconds
    setTimeout(() => setShowCelebration(false), 3000);
  };

  if (!strategy) {
    return (
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 text-center">
        <p className="text-zinc-400">Select a strategy first to generate your script</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl px-8 py-4 animate-bounce">
            <div className="flex items-center gap-3 text-green-400">
              <PartyPopper className="w-6 h-6" />
              <span className="text-lg font-semibold">Your viral script is ready!</span>
              <PartyPopper className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Main Button Area */}
      <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/30 rounded-xl p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white">One-Click Magic</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Generate a complete viral script based on your {strategy.niche.replace(/_/g, ' ')} strategy
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                ✨ Generate Complete Script
              </>
            )}
          </Button>

          {/* Loading Message */}
          {isGenerating && (
            <div className="text-center animate-pulse">
              <p className="text-sm text-purple-300">{loadingMessage}</p>
              <div className="flex justify-center gap-1 mt-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* Info */}
          {!isGenerating && (
            <p className="text-xs text-zinc-500 text-center max-w-md">
              Generates Hook, Proof, Value, CTA + Caption + Hashtags tailored to your{' '}
              <span className="text-purple-400">{strategy.content_purpose}</span> content strategy
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateCompleteScript;
