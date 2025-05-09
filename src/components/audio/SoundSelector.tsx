"use client";

import React, { useState } from 'react';
import { PlusCircle, Music, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sound } from '@/lib/types/audio';
import { useSound } from '@/lib/hooks/useSound';
import InlinePlayer from './InlinePlayer';
import SoundBrowserModal from './SoundBrowserModal';

interface SoundSelectorProps {
  value?: Sound | null;
  onChange?: (sound: Sound | null) => void;
  label?: string;
  placeholder?: string;
  contextType?: 'template' | 'section' | 'general';
  contextId?: string;
  suggestedTags?: string[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * SoundSelector - A component for selecting sounds
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Appears as a simple field until needed
 * - Contextual Intelligence: Shows relevant sound options
 * - Progressive Disclosure: Expands to show sound browser when selecting
 */
const SoundSelector: React.FC<SoundSelectorProps> = ({
  value,
  onChange,
  label = 'Sound',
  placeholder = 'Select a sound',
  contextType = 'general',
  contextId,
  suggestedTags = [],
  disabled = false,
  required = false,
  className
}) => {
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const { isPlaying } = useSound(value || undefined);

  // Handle sound selection
  const handleSelectSound = (sound: Sound) => {
    if (onChange) {
      onChange(sound);
    }
  };

  // Handle sound clear
  const handleClearSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange(null);
    }
  };

  // Open sound browser
  const openSoundBrowser = () => {
    setIsBrowserOpen(true);
  };

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label} {required && <span className="text-destructive">*</span>}
          </label>
        </div>
      )}

      {value ? (
        <div className="relative">
          <InlinePlayer
            sound={value}
            size="sm"
            showControls={false}
            className="pr-8" // Space for the X button
            onSelect={openSoundBrowser}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={handleClearSound}
            disabled={disabled}
          >
            <XCircle className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground font-normal"
          onClick={openSoundBrowser}
          disabled={disabled}
        >
          <Music className="mr-2 h-4 w-4" />
          {placeholder}
        </Button>
      )}

      <SoundBrowserModal
        isOpen={isBrowserOpen}
        onClose={() => setIsBrowserOpen(false)}
        onSelectSound={handleSelectSound}
        contextType={contextType}
        contextId={contextId}
        suggestedTags={suggestedTags}
      />
    </div>
  );
};

export default SoundSelector; 