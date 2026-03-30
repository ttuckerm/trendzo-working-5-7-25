'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Loader2 } from 'lucide-react';
import {
  NICHE_OPTIONS,
  AUDIENCE_AGE_OPTIONS,
  type Niche,
  type AudienceAgeBand,
} from '@/lib/workflow-specs/shared-components';
import type { ContentStrategyInsert, ContentPurpose } from '@/types/database';

interface StrategyCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (strategy: ContentStrategyInsert) => Promise<void>;
  initialData?: Partial<ContentStrategyInsert>;
  isEditing?: boolean;
}

const PURPOSE_OPTIONS: { value: ContentPurpose; label: string; description: string; color: string }[] = [
  {
    value: 'KNOW',
    label: 'KNOW',
    description: 'Awareness content - "Follow for more", "Comment below"',
    color: 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20',
  },
  {
    value: 'LIKE',
    label: 'LIKE',
    description: 'Connection content - "Share with someone", "Tag a friend"',
    color: 'border-pink-500 bg-pink-500/10 hover:bg-pink-500/20',
  },
  {
    value: 'TRUST',
    label: 'TRUST',
    description: 'Conversion content - "Link in bio", "DM me KEYWORD"',
    color: 'border-green-500 bg-green-500/10 hover:bg-green-500/20',
  },
];

export function StrategyCreator({
  open,
  onOpenChange,
  onSave,
  initialData,
  isEditing = false,
}: StrategyCreatorProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [niche, setNiche] = useState<Niche | ''>(initialData?.niche as Niche || '');
  const [audienceAgeBand, setAudienceAgeBand] = useState<AudienceAgeBand | ''>(
    initialData?.audience_age_band as AudienceAgeBand || ''
  );
  const [contentPurpose, setContentPurpose] = useState<ContentPurpose | ''>(
    initialData?.content_purpose || ''
  );
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form state when initialData changes (fixes stale data when editing different strategies)
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name || '');
        setNiche((initialData.niche as Niche) || '');
        setAudienceAgeBand((initialData.audience_age_band as AudienceAgeBand) || '');
        setContentPurpose(initialData.content_purpose || '');
        setKeywords(initialData.keywords || []);
      } else {
        // Reset form for new strategy
        setName('');
        setNiche('');
        setAudienceAgeBand('');
        setContentPurpose('');
        setKeywords([]);
      }
      setKeywordInput('');
      setError(null);
    }
  }, [initialData, open]);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter a strategy name');
      return;
    }
    if (!niche) {
      setError('Please select a niche');
      return;
    }
    if (!contentPurpose) {
      setError('Please select a content purpose');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave({
        name: name.trim(),
        niche,
        audience_age_band: audienceAgeBand || null,
        content_purpose: contentPurpose,
        keywords,
        goals: {},
        exemplar_ids: initialData?.exemplar_ids || [],
        user_id: '', // Will be set by API
      });
      onOpenChange(false);
      // Reset form
      setName('');
      setNiche('');
      setAudienceAgeBand('');
      setContentPurpose('');
      setKeywords([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save strategy');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Edit Content Strategy' : 'Create Content Strategy'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Strategy Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white font-medium">Strategy Name</Label>
            <Input
              id="name"
              placeholder="e.g., Self-Publishing Tips for Beginners"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          {/* Niche Selection */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Niche</Label>
            <Select value={niche} onValueChange={(v: Niche) => setNiche(v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select your niche" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 max-h-[300px]">
                {NICHE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white">
                    <div className="flex flex-col">
                      <span className="text-white">{option.label}</span>
                      <span className="text-xs text-zinc-300">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Audience Age Band */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Target Audience Age</Label>
            <div className="flex gap-2 flex-wrap">
              {AUDIENCE_AGE_OPTIONS.map(option => (
                <Button
                  key={option.value}
                  type="button"
                  variant={audienceAgeBand === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudienceAgeBand(option.value)}
                  className={`flex-1 min-w-[80px] ${audienceAgeBand === option.value ? '' : 'text-white border-zinc-600 hover:bg-zinc-800 hover:text-white'}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Content Purpose (Know/Like/Trust) */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Content Purpose (Know/Like/Trust)</Label>
            <div className="grid grid-cols-1 gap-3">
              {PURPOSE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContentPurpose(option.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    contentPurpose === option.value
                      ? option.color + ' border-opacity-100'
                      : 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-semibold text-lg text-white">{option.label}</div>
                  <div className="text-sm text-zinc-300 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label className="text-white font-medium">Keywords (for SEO)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter keyword and press Enter"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-400"
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:bg-zinc-600 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md p-3">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              'Update Strategy'
            ) : (
              'Create Strategy'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StrategyCreator;
