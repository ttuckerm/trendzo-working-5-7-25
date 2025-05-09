'use client';

import { useState } from 'react';
import { Music, Check, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card-component';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAudio } from '@/lib/hooks/useAudio';

interface Sound {
  id: string;
  title: string;
  authorName: string;
  category?: string;
  playUrl?: string;
}

interface OneClickSoundSelectorProps {
  sound: Sound;
  templateId?: string;
  linkId?: string;
  newsletterId?: string;
  onSelect?: (soundId: string) => void;
  showPreview?: boolean;
  className?: string;
}

/**
 * A component for one-click sound selection from newsletters
 */
export default function OneClickSoundSelector({
  sound,
  templateId,
  linkId,
  newsletterId,
  onSelect,
  showPreview = true,
  className = ''
}: OneClickSoundSelectorProps) {
  const [selected, setSelected] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { playing, toggle } = useAudio(sound.playUrl || '');
  
  const handleSelect = async () => {
    if (selected) return;
    
    setLoading(true);
    
    try {
      // Track the selection through the API
      if (linkId) {
        await fetch(`/api/sounds/performance-tracking?soundId=${sound.id}&linkId=${linkId}`);
      }
      
      if (templateId) {
        // Apply the sound to the template
        await fetch(`/api/templates/update-sound`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            templateId,
            soundId: sound.id,
            fromNewsletter: true,
            newsletterId,
            linkId
          })
        });
      }
      
      // Update UI state
      setSelected(true);
      
      // Show success toast
      toast({
        title: 'Sound Applied',
        description: `"${sound.title}" has been applied to your template.`,
        duration: 3000
      });
      
      // Call onSelect callback
      if (onSelect) {
        onSelect(sound.id);
      }
    } catch (error) {
      console.error('Error selecting sound:', error);
      
      toast({
        title: 'Error',
        description: 'There was an error applying the sound. Please try again.',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-center p-3">
          <div className="flex-grow">
            <h3 className="font-medium text-sm">{sound.title}</h3>
            <p className="text-xs text-muted-foreground">{sound.authorName}</p>
            {sound.category && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {sound.category}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showPreview && sound.playUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant={selected ? "outline" : "default"}
              size="sm"
              onClick={handleSelect}
              disabled={loading || selected}
              className={selected ? "border-green-500 text-green-500" : ""}
            >
              {selected ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> Applied
                </>
              ) : loading ? (
                <span className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-1 border-2 border-current border-t-transparent rounded-full" />
                  Applying...
                </span>
              ) : (
                <>
                  <Music className="h-4 w-4 mr-1" /> 
                  Apply Sound
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 