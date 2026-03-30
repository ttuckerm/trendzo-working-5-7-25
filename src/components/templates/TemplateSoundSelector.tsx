'use client';

import { useState, useEffect } from 'react';
import { SoundPlayer, SoundControls } from '@/app/components/sounds';
import { Music, Search, Plus, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/ui-compatibility';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import InlinePlayer from '@/components/audio/InlinePlayer';

// Types
interface Sound {
  id: string;
  title: string;
  authorName: string;
  playUrl?: string;
  duration?: number;
  tempo?: string;
  genre?: string;
  genres?: string[];
  mood?: string[];
  moods?: string[];
  categories?: string[];
  soundCategory?: string;
  stats?: {
    usageCount?: number;
    usageChange7d?: number;
    trend?: 'rising' | 'stable' | 'falling';
  };
}

interface TemplateSoundSelectorProps {
  selectedSoundId?: string;
  onSelectSound?: (sound: Sound) => void;
  onRemoveSound?: () => void;
  className?: string;
  showRecommendations?: boolean;
  templateCategory?: string;
}

export default function TemplateSoundSelector({
  selectedSoundId,
  onSelectSound,
  onRemoveSound,
  className = '',
  showRecommendations = true,
  templateCategory
}: TemplateSoundSelectorProps) {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<Sound[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);

  // Fetch sounds from API
  useEffect(() => {
    fetchSounds();
  }, [templateCategory]);

  // Fetch selected sound if ID is provided
  useEffect(() => {
    if (selectedSoundId) {
      fetchSoundDetail(selectedSoundId);
    } else {
      setSelectedSound(null);
    }
  }, [selectedSoundId]);

  // Update filtered sounds when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSounds(sounds);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sounds.filter(sound => 
        sound.title.toLowerCase().includes(query) || 
        sound.authorName.toLowerCase().includes(query) ||
        sound.genres?.some(genre => genre.toLowerCase().includes(query)) ||
        sound.moods?.some(mood => mood.toLowerCase().includes(query)) ||
        sound.categories?.some(category => category.toLowerCase().includes(query))
      );
      setFilteredSounds(filtered);
    }
  }, [searchQuery, sounds]);

  const fetchSounds = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real app, we'd fetch from an API endpoint, but for demo we'll use trending sounds
      let endpoint = '/api/sounds/trending';
      
      // If template category is provided, use it to find appropriate sounds
      if (templateCategory) {
        endpoint += `?category=${encodeURIComponent(templateCategory)}`;
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setSounds(data.sounds || []);
        setFilteredSounds(data.sounds || []);
      } else {
        throw new Error(data.error || 'Failed to fetch sounds');
      }
    } catch (err) {
      console.error('Error fetching sounds:', err);
      setError('Could not load sounds. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSoundDetail = async (soundId: string) => {
    try {
      const response = await fetch(`/api/sounds/${soundId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedSound(data.sound);
      } else {
        console.error('Failed to fetch sound details:', data.error);
      }
    } catch (err) {
      console.error('Error fetching sound detail:', err);
    }
  };

  const handleSelectSound = (sound: Sound) => {
    setSelectedSound(sound);
    if (onSelectSound) {
      onSelectSound(sound);
    }
  };

  const handleRemoveSound = () => {
    setSelectedSound(null);
    if (onRemoveSound) {
      onRemoveSound();
    }
  };

  // Format duration in MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Music className="w-5 h-5 mr-2 text-primary" />
        Template Sound
      </h3>

      {selectedSound ? (
        <div className="space-y-4">
          {/* Selected sound display */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-primary">{selectedSound.title}</h4>
                  <p className="text-sm text-muted-foreground">By {selectedSound.authorName}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemoveSound}
                  className="h-8 w-8 p-0"
                >
                  <span className="sr-only">Remove sound</span>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Add InlinePlayer for previewing the sound */}
              {selectedSound.playUrl && (
                <div className="my-3">
                  <InlinePlayer
                    sound={{
                      id: selectedSound.id,
                      title: selectedSound.title,
                      artist: selectedSound.authorName,
                      url: selectedSound.playUrl,
                      duration: selectedSound.duration
                    }}
                    size="sm"
                    showTitle={false}
                    showArtist={false}
                  />
                </div>
              )}
              
              {/* Fallback controls if not using InlinePlayer */}
              {!selectedSound.playUrl && (
                <div className="my-3">
                  {selectedSound.playUrl && (
                    <SoundControls 
                      soundUrl={selectedSound.playUrl} 
                      size="small"
                      className="max-w-[200px]"
                    />
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedSound.duration && (
                  <Badge variant="outline" className="text-xs">
                    {formatDuration(selectedSound.duration)}
                  </Badge>
                )}
                {selectedSound.tempo && (
                  <Badge variant="outline" className="text-xs">
                    {selectedSound.tempo}
                  </Badge>
                )}
                {selectedSound.genres?.slice(0, 1).map(genre => (
                  <Badge key={genre} variant="outline" className="text-xs">
                    {genre}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Button variant="outline" size="sm" onClick={() => setSelectedSound(null)}>
            Change Sound
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sounds by name, genre, mood..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sound list */}
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-700 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          ) : filteredSounds.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No sounds found matching your search.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredSounds.map(sound => (
                <div 
                  key={sound.id}
                  className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors flex justify-between items-center"
                  onClick={() => handleSelectSound(sound)}
                >
                  <div>
                    <h4 className="font-medium">{sound.title}</h4>
                    <p className="text-sm text-muted-foreground">{sound.authorName}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <span className="sr-only">Add sound</span>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Recommendations section */}
          {showRecommendations && !loading && filteredSounds.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recommended for this template:</h4>
              <div className="flex flex-wrap gap-2">
                {filteredSounds
                  .slice(0, 3)
                  .map(sound => (
                    <Button 
                      key={sound.id}
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSelectSound(sound)}
                    >
                      {sound.title}
                    </Button>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 