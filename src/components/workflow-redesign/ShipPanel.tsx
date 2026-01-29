'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { BeatContent } from './FourByFourBeatEditor';
import type { ContentPurpose } from '@/types/database';

interface DPSBreakdown {
  hook: number;
  proof: number;
  value: number;
  cta: number;
}

interface DPSResult {
  score: number;
  breakdown: DPSBreakdown;
  suggestions: {
    hook?: string;
    proof?: string;
    value?: string;
    cta?: string;
  };
}

interface ShipPanelProps {
  beats: BeatContent;
  caption: string;
  hashtags: string[];
  contentPurpose: ContentPurpose | null;
  onGetPrediction: () => Promise<DPSResult>;
  dpsResult: DPSResult | null;
  isLoadingPrediction?: boolean;
  error?: string | null;
}

type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';

const PLATFORMS: { id: Platform; name: string; icon: string; color: string }[] = [
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'border-pink-500 bg-pink-500/10' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: 'border-purple-500 bg-purple-500/10' },
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: 'border-red-500 bg-red-500/10' },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', color: 'border-blue-500 bg-blue-500/10' },
];

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreIcon(score: number) {
  if (score >= 8) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (score >= 5) return <AlertCircle className="w-4 h-4 text-yellow-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function getOverallScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-400' };
  if (score >= 60) return { label: 'Good', color: 'text-green-300' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-400' };
  if (score >= 20) return { label: 'Needs Work', color: 'text-orange-400' };
  return { label: 'Poor', color: 'text-red-400' };
}

export function ShipPanel({
  beats,
  caption,
  hashtags,
  contentPurpose,
  onGetPrediction,
  dpsResult,
  isLoadingPrediction = false,
  error = null,
}: ShipPanelProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [copied, setCopied] = useState(false);

  const handleCopyAndGo = async () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = beats.hook || beats.proof || beats.value || beats.cta;

  return (
    <div className="space-y-6">
      {/* DPS Prediction Section */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-zinc-100">
              <TrendingUp className="w-5 h-5" />
              Virality Prediction
            </CardTitle>
            <Button
              onClick={onGetPrediction}
              disabled={isLoadingPrediction || !hasContent}
              size="sm"
            >
              {isLoadingPrediction ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Get Prediction'
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!dpsResult && !isLoadingPrediction && (
            <div className="text-center py-8 text-zinc-500">
              {hasContent ? (
                'Click "Get Prediction" to analyze your content'
              ) : (
                'Fill in your 4x4 beats to get a prediction'
              )}
            </div>
          )}

          {isLoadingPrediction && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-500" />
              <div className="text-zinc-500 mt-2">Analyzing your content...</div>
            </div>
          )}

          {error && !isLoadingPrediction && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-400">Prediction Failed</div>
                  <div className="text-sm text-red-300/80 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {dpsResult && !isLoadingPrediction && !error && (
            <>
              {/* Overall Score */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                <div>
                  <div className="text-sm text-zinc-500">DPS Score</div>
                  <div className={`text-4xl font-bold ${getOverallScoreLabel(dpsResult.score).color}`}>
                    {dpsResult.score}
                  </div>
                  <div className={`text-sm ${getOverallScoreLabel(dpsResult.score).color}`}>
                    {getOverallScoreLabel(dpsResult.score).label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Purpose Match</div>
                  <Badge className="mt-1">
                    {contentPurpose || 'Not set'}
                  </Badge>
                </div>
              </div>

              {/* 4x4 Breakdown */}
              <div className="space-y-2">
                <div className="text-sm text-zinc-500 uppercase tracking-wide">
                  4x4 Analysis
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Hook */}
                  <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                    {getScoreIcon(dpsResult.breakdown.hook)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">Hook</span>
                        <span className={`text-sm font-bold ${getScoreColor(dpsResult.breakdown.hook)}`}>
                          {dpsResult.breakdown.hook}/10
                        </span>
                      </div>
                      {dpsResult.suggestions.hook && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {dpsResult.suggestions.hook}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Proof */}
                  <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                    {getScoreIcon(dpsResult.breakdown.proof)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">Proof</span>
                        <span className={`text-sm font-bold ${getScoreColor(dpsResult.breakdown.proof)}`}>
                          {dpsResult.breakdown.proof}/10
                        </span>
                      </div>
                      {dpsResult.suggestions.proof && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {dpsResult.suggestions.proof}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                    {getScoreIcon(dpsResult.breakdown.value)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">Value</span>
                        <span className={`text-sm font-bold ${getScoreColor(dpsResult.breakdown.value)}`}>
                          {dpsResult.breakdown.value}/10
                        </span>
                      </div>
                      {dpsResult.suggestions.value && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {dpsResult.suggestions.value}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                    {getScoreIcon(dpsResult.breakdown.cta)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-200">CTA</span>
                        <span className={`text-sm font-bold ${getScoreColor(dpsResult.breakdown.cta)}`}>
                          {dpsResult.breakdown.cta}/10
                        </span>
                      </div>
                      {dpsResult.suggestions.cta && (
                        <div className="text-xs text-zinc-500 mt-1">
                          {dpsResult.suggestions.cta}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-zinc-100">Select Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  selectedPlatform === platform.id
                    ? platform.color + ' border-opacity-100'
                    : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                }`}
              >
                <div className="text-2xl mb-1">{platform.icon}</div>
                <div className="text-sm font-medium text-zinc-200">{platform.name}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Copy & Go */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-200">Ready to publish?</div>
              <div className="text-sm text-zinc-500">
                Copy caption & hashtags to clipboard
              </div>
            </div>
            <Button onClick={handleCopyAndGo} size="lg">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy & Go
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ShipPanel;
