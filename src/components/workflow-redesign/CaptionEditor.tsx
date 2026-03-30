'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Hash, AlertCircle } from 'lucide-react';

interface CaptionEditorProps {
  caption: string;
  onCaptionChange: (caption: string) => void;
  hashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
  suggestedHashtags?: string[];
  onGenerate?: () => void;
  isGenerating?: boolean;
  platform?: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
}

// Platform-specific character limits
const PLATFORM_LIMITS: Record<string, { caption: number; hashtags: number }> = {
  tiktok: { caption: 2200, hashtags: 5 },
  instagram: { caption: 2200, hashtags: 30 },
  youtube: { caption: 5000, hashtags: 15 },
  twitter: { caption: 280, hashtags: 3 },
};

export function CaptionEditor({
  caption,
  onCaptionChange,
  hashtags,
  onHashtagsChange,
  suggestedHashtags = [],
  onGenerate,
  isGenerating,
  platform = 'tiktok',
}: CaptionEditorProps) {
  const [copied, setCopied] = useState(false);
  const [hashtagInput, setHashtagInput] = useState('');

  const limits = PLATFORM_LIMITS[platform];
  const captionLength = caption.length;
  const isOverLimit = captionLength > limits.caption;
  const hashtagsOverLimit = hashtags.length > limits.hashtags;

  const handleAddHashtag = (tag: string) => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    const normalized = cleanTag.toLowerCase().replace(/[^#a-z0-9]/g, '');
    if (normalized.length > 1 && !hashtags.includes(normalized)) {
      onHashtagsChange([...hashtags, normalized]);
    }
    setHashtagInput('');
  };

  const handleRemoveHashtag = (tag: string) => {
    onHashtagsChange(hashtags.filter(h => h !== tag));
  };

  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hashtagInput.trim()) {
        handleAddHashtag(hashtagInput.trim());
      }
    }
  };

  const handleCopyAll = async () => {
    const fullText = `${caption}\n\n${hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fullPreview = `${caption}${hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : ''}`;

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white font-semibold">Caption & Hashtags</CardTitle>
          <div className="flex items-center gap-2">
            {onGenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
              >
                <Sparkles className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Generating...' : 'Generate'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAll}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy All
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Caption Textarea */}
        <div className="space-y-2">
          <Textarea
            placeholder="Write your caption here... Include keywords for better reach."
            value={caption}
            onChange={e => onCaptionChange(e.target.value)}
            className="min-h-[120px] bg-zinc-800/50 border-zinc-700 resize-none text-zinc-100 placeholder:text-zinc-400"
          />
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs capitalize">
                {platform}
              </Badge>
            </div>
            <div className={isOverLimit ? 'text-red-400' : 'text-zinc-300'}>
              {captionLength}/{limits.caption}
              {isOverLimit && (
                <span className="ml-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Over limit
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-white font-medium">
              <Hash className="w-3 h-3" />
              Hashtags
            </div>
            <div className={`text-xs ${hashtagsOverLimit ? 'text-red-400' : 'text-zinc-300'}`}>
              {hashtags.length}/{limits.hashtags} max
            </div>
          </div>

          {/* Hashtag Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add hashtag..."
              value={hashtagInput}
              onChange={e => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              className="flex-1 px-3 py-1.5 text-sm bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-600 text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          {/* Active Hashtags */}
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-zinc-600"
                  onClick={() => handleRemoveHashtag(tag)}
                >
                  {tag}
                  <span className="text-zinc-400 hover:text-red-400">×</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Suggested Hashtags */}
          {suggestedHashtags.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs text-zinc-300 font-medium">Suggested:</div>
              <div className="flex flex-wrap gap-1">
                {suggestedHashtags
                  .filter(tag => !hashtags.includes(tag))
                  .slice(0, 8)
                  .map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAddHashtag(tag)}
                      className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="text-xs text-white uppercase tracking-wide font-medium">Preview</div>
          <div className="p-3 bg-zinc-800/50 rounded-md text-sm whitespace-pre-wrap text-zinc-300">
            {fullPreview || <span className="text-zinc-600 italic">Your caption will appear here...</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CaptionEditor;
