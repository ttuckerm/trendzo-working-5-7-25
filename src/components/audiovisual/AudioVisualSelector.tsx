"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Music,
  Play,
  Pause,
  Search,
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
  Clock,
  RefreshCw
} from 'lucide-react';
import WaveformVisualizer from './WaveformVisualizer';
import { useAudioVisual } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

// Sample sounds for demonstration
const DEMO_SOUNDS = [
  {
    id: 'sound-1',
    title: 'Viral Dance Beat',
    artist: 'TrendMusic',
    url: 'https://audio-samples.github.io/samples/mp3/brasstracks-golden-ticket.mp3',
    duration: 30,
    genre: 'Electronic',
    emotionalTone: 'Energetic',
    usages: 12450,
    growth: 18.5,
    trending: true,
  },
  {
    id: 'sound-2',
    title: 'Smooth Transition',
    artist: 'MusicFlow',
    url: 'https://audio-samples.github.io/samples/mp3/brahms-intermezzo.mp3',
    duration: 25,
    genre: 'Ambient',
    emotionalTone: 'Calm',
    usages: 8234,
    growth: 4.2,
    trending: false,
  },
  {
    id: 'sound-3',
    title: 'Product Showcase',
    artist: 'MarketBeats',
    url: 'https://audio-samples.github.io/samples/mp3/blippy-trance.mp3',
    duration: 22,
    genre: 'Corporate',
    emotionalTone: 'Professional',
    usages: 6521,
    growth: 7.8,
    trending: true,
  },
  {
    id: 'sound-4',
    title: 'Chill Lofi Beat',
    artist: 'LofiLab',
    url: 'https://audio-samples.github.io/samples/mp3/blippy-trance.mp3',
    duration: 28,
    genre: 'Lofi',
    emotionalTone: 'Relaxed',
    usages: 4875,
    growth: 12.3,
    trending: true,
  },
  {
    id: 'sound-5',
    title: 'Motivational Drums',
    artist: 'InspirationBeats',
    url: 'https://audio-samples.github.io/samples/mp3/brasstracks-golden-ticket.mp3',
    duration: 32,
    genre: 'Inspirational',
    emotionalTone: 'Uplifting',
    usages: 9218,
    growth: 9.7,
    trending: false,
  },
];

interface AudioVisualSelectorProps {
  onSelectSound?: (sound: any) => void;
  initialSound?: any;
  className?: string;
}

export default function AudioVisualSelector({ 
  onSelectSound, 
  initialSound = null,
  className = "" 
}: AudioVisualSelectorProps) {
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSound, setSelectedSound] = useState(initialSound || DEMO_SOUNDS[0]);
  const [filteredSounds, setFilteredSounds] = useState(DEMO_SOUNDS);
  const { tier } = useSubscription();
  const { isPlaying, setIsPlaying } = useAudioVisual();
  
  // Check if user has premium subscription
  const isPremium = tier === 'premium' || tier === 'business';
  
  // Filter sounds based on search query and active tab
  useEffect(() => {
    let filtered = DEMO_SOUNDS;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sound => 
        sound.title.toLowerCase().includes(query) || 
        sound.artist.toLowerCase().includes(query) ||
        sound.genre.toLowerCase().includes(query) ||
        sound.emotionalTone.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    if (activeTab === 'trending') {
      filtered = filtered.filter(sound => sound.trending);
    }
    
    setFilteredSounds(filtered);
  }, [searchQuery, activeTab]);
  
  // Handle sound selection
  const handleSoundSelect = (sound: any) => {
    setSelectedSound(sound);
    if (onSelectSound) {
      onSelectSound(sound);
    }
  };
  
  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Audio Selection</h3>
          {isPremium && (
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600">
              Advanced Audio
            </Badge>
          )}
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            className="pl-9 bg-white"
            placeholder="Search sounds by title, artist, genre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="trending">
              <TrendingUp size={14} className="mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="all">
              <Music size={14} className="mr-1" />
              All Sounds
            </TabsTrigger>
            {isPremium && (
              <TabsTrigger value="recommended">
                <Sparkles size={14} className="mr-1" />
                Recommended
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="trending" className="m-0">
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredSounds.map(sound => (
                <SoundCard 
                  key={sound.id} 
                  sound={sound} 
                  isSelected={selectedSound.id === sound.id}
                  onClick={() => handleSoundSelect(sound)}
                />
              ))}
              
              {filteredSounds.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No sounds match your search criteria
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredSounds.map(sound => (
                <SoundCard 
                  key={sound.id} 
                  sound={sound} 
                  isSelected={selectedSound.id === sound.id}
                  onClick={() => handleSoundSelect(sound)}
                />
              ))}
              
              {filteredSounds.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No sounds match your search criteria
                </div>
              )}
            </div>
          </TabsContent>
          
          {isPremium && (
            <TabsContent value="recommended" className="m-0">
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                {/* For premium users we show "recommended" sounds */}
                {filteredSounds.slice(0, 3).map(sound => (
                  <SoundCard 
                    key={sound.id} 
                    sound={sound} 
                    isSelected={selectedSound.id === sound.id}
                    onClick={() => handleSoundSelect(sound)}
                    showMatchScore={true}
                  />
                ))}
                
                {filteredSounds.length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    No recommended sounds available
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Sound Preview */}
      <div className="border rounded-md overflow-hidden">
        <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">{selectedSound.title}</h4>
            <p className="text-sm text-gray-500">{selectedSound.artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              <Clock size={14} className="inline mr-1" />
              {formatDuration(selectedSound.duration)}
            </span>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>
        <div className="p-3">
          <WaveformVisualizer 
            audioUrl={selectedSound.url}
            height={80}
            showBeats={isPremium}
            responsive
          />
        </div>
        {isPremium && (
          <div className="px-3 pb-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Synchronization Options</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                <SlidersHorizontal size={12} />
                Advanced
              </Button>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button className="p-2 rounded border bg-white hover:bg-gray-50 text-xs font-medium">Auto Sync</button>
              <button className="p-2 rounded border bg-white hover:bg-gray-50 text-xs font-medium">Beat Match</button>
              <button className="p-2 rounded border bg-white hover:bg-gray-50 text-xs font-medium">Energy Map</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sound card component
interface SoundCardProps {
  sound: any;
  isSelected: boolean;
  showMatchScore?: boolean;
  onClick: () => void;
}

function SoundCard({ sound, isSelected, showMatchScore = false, onClick }: SoundCardProps) {
  return (
    <Card 
      className={`p-3 cursor-pointer transition-all hover:shadow-sm ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">{sound.title}</h4>
          <p className="text-sm text-gray-500">{sound.artist}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs py-0 h-5">
              {sound.genre}
            </Badge>
            <Badge variant="outline" className="text-xs py-0 h-5 bg-gray-100">
              {sound.emotionalTone}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {sound.trending && (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              <TrendingUp size={12} className="mr-1" />
              Trending
            </Badge>
          )}
          
          {showMatchScore && (
            <div className="mt-1 text-xs font-medium text-green-600">
              91% match
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            {sound.duration}s
          </div>
        </div>
      </div>
    </Card>
  );
} 