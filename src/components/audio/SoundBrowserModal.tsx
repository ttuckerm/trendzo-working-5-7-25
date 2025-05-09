"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter, Music, Clock, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSoundCollection } from '@/lib/hooks/useSoundCollection';
import { useSound } from '@/lib/hooks/useSound';
import { Sound } from '@/lib/types/audio';
import InlinePlayer from './InlinePlayer';

interface SoundBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSound: (sound: Sound) => void;
  contextType?: 'template' | 'section' | 'general';
  contextId?: string;
  suggestedTags?: string[];
}

/**
 * SoundBrowserModal - A contextual modal for browsing and selecting sounds
 * 
 * Implements Unicorn UX principles:
 * - Contextual Intelligence: Recommends sounds based on current context
 * - Progressive Disclosure: Reveals advanced filters as needed
 * - Emotional Design: Provides immediate feedback with sound previews
 */
const SoundBrowserModal: React.FC<SoundBrowserModalProps> = ({
  isOpen,
  onClose,
  onSelectSound,
  contextType = 'general',
  contextId,
  suggestedTags = []
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recommended');
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Collections
  const { sounds: recentSounds } = useSoundCollection('recent');
  const { sounds: favoriteSounds } = useSoundCollection('favorites');
  const [recommendedSounds, setRecommendedSounds] = useState<Sound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);

  // Sound controls for the selected sound
  const soundControls = useSound(selectedSound || undefined);

  // Load recommended sounds based on context
  useEffect(() => {
    if (!isOpen) return;

    const fetchRecommendedSounds = async () => {
      setIsLoading(true);
      try {
        // This would normally be an API call to get context-aware recommendations
        // For now, we'll simulate it with a timeout and mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // In a real implementation, we'd fetch recommendations based on contextType and contextId
        // GET /api/sounds/recommendations?contextType=${contextType}&contextId=${contextId}
        
        // Mock data for now
        const mockRecommendedSounds: Sound[] = [
          {
            id: 'rec-1',
            title: 'Upbeat Summer Vibe',
            artist: 'SoundStudio',
            url: 'https://example.com/sounds/summer-vibe.mp3',
            duration: 45,
            category: 'Music',
            tags: ['upbeat', 'summer', 'positive']
          },
          {
            id: 'rec-2',
            title: 'Corporate Success',
            artist: 'BusinessAudio',
            url: 'https://example.com/sounds/corporate.mp3',
            duration: 30,
            category: 'Music',
            tags: ['corporate', 'success', 'professional']
          },
          {
            id: 'rec-3',
            title: 'Social Media Notification',
            artist: 'UX Sounds',
            url: 'https://example.com/sounds/notification.mp3',
            duration: 2,
            category: 'SFX',
            tags: ['notification', 'short', 'social']
          }
        ];
        
        setRecommendedSounds(mockRecommendedSounds);
        setFilteredSounds(mockRecommendedSounds);
      } catch (error) {
        console.error('Error fetching recommended sounds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendedSounds();
  }, [isOpen, contextType, contextId]);

  // Filter sounds based on search query and active filters
  useEffect(() => {
    let sounds: Sound[] = [];
    
    switch (activeTab) {
      case 'recommended':
        sounds = [...recommendedSounds];
        break;
      case 'recent':
        sounds = [...recentSounds];
        break;
      case 'favorites':
        sounds = [...favoriteSounds];
        break;
      default:
        sounds = [...recommendedSounds];
    }
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      sounds = sounds.filter(sound => 
        sound.title.toLowerCase().includes(lowerQuery) ||
        (sound.artist && sound.artist.toLowerCase().includes(lowerQuery)) ||
        (sound.tags && sound.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }
    
    // Apply category/tag filters
    if (activeFilters.length > 0) {
      sounds = sounds.filter(sound => 
        sound.category && activeFilters.includes(sound.category) ||
        sound.tags && sound.tags.some(tag => activeFilters.includes(tag))
      );
    }
    
    setFilteredSounds(sounds);
  }, [searchQuery, activeTab, recommendedSounds, recentSounds, favoriteSounds, activeFilters]);

  // Toggle a filter
  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Handle sound selection
  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    if (selectedSound) {
      onSelectSound(selectedSound);
      onClose();
    }
  };

  // All available categories and tags for filtering
  const availableFilters = [
    'Music', 'SFX', 'Voice', 'Ambient',
    ...suggestedTags
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sound Browser</DialogTitle>
          <DialogDescription>
            {contextType === 'template' ? 
              'Select a sound for your template' : 
              contextType === 'section' ? 
                'Select a sound for this section' : 
                'Browse and select a sound'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 my-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search sounds..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-muted' : ''}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-2 bg-muted/30 rounded-md">
            {availableFilters.map(filter => (
              <Badge 
                key={filter}
                variant={activeFilters.includes(filter) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col">
          <TabsList className="mb-2">
            <TabsTrigger value="recommended" className="flex items-center">
              <Music className="h-4 w-4 mr-1" />
              Recommended
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              Favorites
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow overflow-y-auto">
            {isLoading ? (
              <div className="flex-grow flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSounds.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No sounds found.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSounds.map(sound => (
                  <div 
                    key={sound.id}
                    className={`p-2 rounded-md cursor-pointer ${selectedSound?.id === sound.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                    onClick={() => handleSelectSound(sound)}
                  >
                    <InlinePlayer 
                      sound={sound}
                      size="sm"
                      showControls={false}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs>

        {/* Sound preview for selected sound */}
        {selectedSound && (
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-2">Preview Selected Sound</h4>
            <InlinePlayer 
              sound={selectedSound}
              showControls={true}
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedSound}
          >
            Select Sound
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SoundBrowserModal; 