'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle, Hash, TrendingUp } from 'lucide-react';
import type { BeatContent } from './FourByFourBeatEditor';

interface SEOHealthIndicatorProps {
  beats: BeatContent;
  caption: string;
  keywords: string[];
  niche?: string;
  onScreenText?: string; // Text planned to appear on-screen in the video
}

interface KeywordMatch {
  keyword: string;
  inHook: boolean;
  inValue: boolean;
  inCaption: boolean;
  inOnScreen: boolean;
  totalOccurrences: number;
}

function countOccurrences(text: string, keyword: string): number {
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

function getStatusIcon(score: number) {
  if (score >= 80) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (score >= 50) return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function getStatusColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-400';
}

// Niche-specific hashtag suggestions
const NICHE_HASHTAGS: Record<string, string[]> = {
  personal_finance: ['#personalfinance', '#moneytips', '#budgeting', '#financialfreedom', '#savings'],
  side_hustles: ['#sidehustle', '#makemoneyonline', '#passiveincome', '#entrepreneur', '#hustleculture'],
  entrepreneurship: ['#entrepreneur', '#business', '#startup', '#businesstips', '#ceo'],
  real_estate: ['#realestate', '#investing', '#property', '#realestateinvesting', '#housing'],
  investing: ['#investing', '#stocks', '#stockmarket', '#investment', '#wealthbuilding'],
  crypto: ['#crypto', '#bitcoin', '#cryptocurrency', '#blockchain', '#web3'],
  fitness: ['#fitness', '#workout', '#gym', '#fitnessmotivation', '#health'],
  health_wellness: ['#wellness', '#health', '#selfcare', '#mentalhealth', '#healthylifestyle'],
  beauty: ['#beauty', '#skincare', '#makeup', '#beautytips', '#glowup'],
  fashion: ['#fashion', '#style', '#ootd', '#fashiontips', '#outfitinspo'],
  food_cooking: ['#cooking', '#recipe', '#foodie', '#homecooking', '#easyrecipes'],
  travel: ['#travel', '#wanderlust', '#travelgram', '#adventure', '#explore'],
  tech: ['#tech', '#technology', '#gadgets', '#techtips', '#innovation'],
  gaming: ['#gaming', '#gamer', '#videogames', '#twitch', '#esports'],
  education: ['#education', '#learning', '#studytips', '#students', '#knowledge'],
  parenting: ['#parenting', '#momlife', '#dadlife', '#parentingtips', '#family'],
  relationships: ['#relationships', '#dating', '#love', '#relationshipadvice', '#couples'],
  comedy: ['#comedy', '#funny', '#humor', '#memes', '#lol'],
  motivation: ['#motivation', '#inspiration', '#mindset', '#success', '#goals'],
  lifestyle: ['#lifestyle', '#life', '#dailylife', '#aesthetic', '#vibes'],
};

export function SEOHealthIndicator({
  beats,
  caption,
  keywords,
  niche,
  onScreenText = '',
}: SEOHealthIndicatorProps) {
  const analysis = useMemo(() => {
    const allContent = `${beats.hook} ${beats.proof} ${beats.value} ${beats.cta}`.toLowerCase();
    const captionLower = caption.toLowerCase();
    const onScreenLower = onScreenText.toLowerCase();

    // Analyze each keyword
    const keywordMatches: KeywordMatch[] = keywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      return {
        keyword,
        inHook: beats.hook.toLowerCase().includes(keywordLower),
        inValue: beats.value.toLowerCase().includes(keywordLower),
        inCaption: captionLower.includes(keywordLower),
        inOnScreen: onScreenLower.includes(keywordLower),
        totalOccurrences: countOccurrences(allContent + ' ' + captionLower, keywordLower),
      };
    });

    // Calculate scores
    const keywordsInHook = keywordMatches.filter(k => k.inHook).length;
    const keywordsInValue = keywordMatches.filter(k => k.inValue).length;
    const keywordsInCaption = keywordMatches.filter(k => k.inCaption).length;
    const keywordsOnScreen = keywordMatches.filter(k => k.inOnScreen).length;

    const hookScore = keywords.length > 0 ? Math.min(100, (keywordsInHook / Math.min(keywords.length, 2)) * 100) : 100;
    const valueScore = keywords.length > 0 ? Math.min(100, (keywordsInValue / Math.min(keywords.length, 3)) * 100) : 100;
    const captionScore = keywords.length > 0 ? Math.min(100, (keywordsInCaption / keywords.length) * 100) : 100;
    // On-screen text: expect at least 1 keyword for SEO discoverability
    const onScreenScore = keywords.length > 0 ? Math.min(100, (keywordsOnScreen / Math.min(keywords.length, 2)) * 100) : 100;

    // Overall now includes on-screen score (4 factors)
    const overallScore = Math.round((hookScore + valueScore + captionScore + onScreenScore) / 4);

    return {
      keywordMatches,
      keywordsInHook,
      keywordsInValue,
      keywordsInCaption,
      keywordsOnScreen,
      hookScore,
      valueScore,
      captionScore,
      onScreenScore,
      overallScore,
    };
  }, [beats, caption, keywords, onScreenText]);

  const suggestedHashtags = niche ? NICHE_HASHTAGS[niche] || [] : [];

  if (keywords.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-zinc-500">
            <Hash className="w-4 h-4" />
            <span className="text-sm">
              Add keywords to your strategy to see SEO health analysis
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            SEO Health
          </CardTitle>
          <div className={`text-lg font-bold ${getStatusColor(analysis.overallScore)}`}>
            {analysis.overallScore}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Breakdown */}
        <div className="grid grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            {getStatusIcon(analysis.hookScore)}
            <div>
              <div className="text-white font-medium">Hook</div>
              <div className="text-zinc-300">
                {analysis.keywordsInHook}/{Math.min(keywords.length, 2)} keywords
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(analysis.valueScore)}
            <div>
              <div className="text-white font-medium">Value</div>
              <div className="text-zinc-300">
                {analysis.keywordsInValue}/{Math.min(keywords.length, 3)} keywords
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(analysis.captionScore)}
            <div>
              <div className="text-white font-medium">Caption</div>
              <div className="text-zinc-300">
                {analysis.keywordsInCaption}/{keywords.length} keywords
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(analysis.onScreenScore)}
            <div>
              <div className="text-white font-medium">On Screen</div>
              <div className={analysis.keywordsOnScreen === 0 ? 'text-red-400' : 'text-zinc-300'}>
                {analysis.keywordsOnScreen}/{Math.min(keywords.length, 2)} keywords
              </div>
            </div>
          </div>
        </div>

        {/* Warning if no keywords on screen */}
        {analysis.keywordsOnScreen === 0 && onScreenText === '' && (
          <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/10 rounded-md px-3 py-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Add on-screen text with keywords for better discoverability in search</span>
          </div>
        )}

        {/* Keyword Status */}
        <div className="space-y-2">
          <div className="text-xs text-white uppercase tracking-wide font-medium">Keyword Coverage</div>
          <div className="flex flex-wrap gap-2">
            {analysis.keywordMatches.map((match, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className={
                  match.totalOccurrences > 0
                    ? 'border-green-500/50 text-green-400'
                    : 'border-red-500/50 text-red-400'
                }
              >
                {match.keyword}
                {match.totalOccurrences > 0 && (
                  <span className="ml-1 opacity-60">×{match.totalOccurrences}</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Suggested Hashtags */}
        {suggestedHashtags.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-white uppercase tracking-wide font-medium">
              Suggested Hashtags for {niche?.replace(/_/g, ' ')}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedHashtags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {analysis.overallScore < 80 && (
          <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-md p-3">
            <div className="font-medium text-zinc-300 mb-1">Tips to improve:</div>
            <ul className="list-disc list-inside space-y-1">
              {analysis.hookScore < 80 && (
                <li>Add keywords to your hook for better discoverability</li>
              )}
              {analysis.valueScore < 80 && (
                <li>Include more keywords naturally in your value section</li>
              )}
              {analysis.captionScore < 80 && (
                <li>Make sure all keywords appear in your caption</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SEOHealthIndicator;
