'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Plus, Video, Target, Users, Hash, Sparkles } from 'lucide-react';
import type { ContentStrategy } from '@/types/database';

interface StrategyPanelProps {
  strategy: ContentStrategy | null;
  onEdit: () => void;
  onCreateNew: () => void;
  onCreateVideo: () => void;
  isLoading?: boolean;
}

const PURPOSE_COLORS: Record<string, string> = {
  KNOW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  LIKE: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  TRUST: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const PURPOSE_DESCRIPTIONS: Record<string, string> = {
  KNOW: 'Awareness content - Get them to know you',
  LIKE: 'Connection content - Build rapport & relatability',
  TRUST: 'Conversion content - Convert to customers',
};

export function StrategyPanel({
  strategy,
  onEdit,
  onCreateNew,
  onCreateVideo,
  isLoading = false,
}: StrategyPanelProps) {
  if (isLoading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-zinc-500">Loading strategy...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!strategy) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800 border-dashed">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <Target className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-zinc-200">No Strategy Selected</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Create a content strategy to get started. Research once, create many videos.
              </p>
            </div>
            <Button onClick={onCreateNew} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Strategy
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-zinc-100">
            {strategy.name}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={onCreateNew}>
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Niche */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Sparkles className="w-3 h-3" />
              Niche
            </div>
            <Badge variant="outline" className="font-medium">
              {strategy.niche.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </Badge>
          </div>

          {/* Audience */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Users className="w-3 h-3" />
              Audience
            </div>
            <Badge variant="outline" className="font-medium">
              {strategy.audience_age_band || 'All ages'}
            </Badge>
          </div>

          {/* Purpose */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Target className="w-3 h-3" />
              Purpose
            </div>
            <Badge className={PURPOSE_COLORS[strategy.content_purpose]}>
              {strategy.content_purpose}
            </Badge>
          </div>

          {/* Exemplars */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Video className="w-3 h-3" />
              Exemplars
            </div>
            <Badge variant="outline" className="font-medium">
              {strategy.exemplar_ids?.length || 0} saved
            </Badge>
          </div>
        </div>

        {/* Purpose Description */}
        <div className="text-sm text-zinc-400 bg-zinc-800/50 rounded-md p-3">
          {PURPOSE_DESCRIPTIONS[strategy.content_purpose]}
        </div>

        {/* Keywords */}
        {strategy.keywords && strategy.keywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Hash className="w-3 h-3" />
              Keywords
            </div>
            <div className="flex flex-wrap gap-2">
              {strategy.keywords.map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Create Video Button */}
        <div className="pt-2">
          <Button onClick={onCreateVideo} className="w-full" size="lg">
            <Video className="w-4 h-4 mr-2" />
            Create Video from this Strategy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default StrategyPanel;
