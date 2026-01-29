'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Save,
  Loader2,
} from 'lucide-react';

export interface VideoResults {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

interface ResultsTrackerProps {
  results: VideoResults;
  onResultsChange: (results: VideoResults) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
}

export function ResultsTracker({
  results,
  onResultsChange,
  onSave,
  isSaving = false,
}: ResultsTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateResult = (key: keyof VideoResults, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    onResultsChange({ ...results, [key]: numValue });
  };

  const engagementRate = results.views > 0
    ? (((results.likes + results.comments + results.shares) / results.views) * 100).toFixed(2)
    : '0.00';

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-base text-zinc-100">Track Results</CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="text-sm text-zinc-500">
            Track your video's performance after publishing
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Views */}
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs text-zinc-400">
                <Eye className="w-3 h-3" />
                Views
              </Label>
              <Input
                type="number"
                min="0"
                value={results.views || ''}
                onChange={e => updateResult('views', e.target.value)}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            {/* Likes */}
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs text-zinc-400">
                <Heart className="w-3 h-3" />
                Likes
              </Label>
              <Input
                type="number"
                min="0"
                value={results.likes || ''}
                onChange={e => updateResult('likes', e.target.value)}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            {/* Comments */}
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs text-zinc-400">
                <MessageCircle className="w-3 h-3" />
                Comments
              </Label>
              <Input
                type="number"
                min="0"
                value={results.comments || ''}
                onChange={e => updateResult('comments', e.target.value)}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
              />
            </div>

            {/* Shares */}
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs text-zinc-400">
                <Share2 className="w-3 h-3" />
                Shares
              </Label>
              <Input
                type="number"
                min="0"
                value={results.shares || ''}
                onChange={e => updateResult('shares', e.target.value)}
                placeholder="0"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Engagement Rate */}
          {results.views > 0 && (
            <div className="p-3 bg-zinc-800/50 rounded-lg">
              <div className="text-xs text-zinc-500">Engagement Rate</div>
              <div className="text-2xl font-bold text-zinc-200">
                {engagementRate}%
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                (Likes + Comments + Shares) / Views
              </div>
            </div>
          )}

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="w-full"
              variant="outline"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Results
                </>
              )}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default ResultsTracker;
