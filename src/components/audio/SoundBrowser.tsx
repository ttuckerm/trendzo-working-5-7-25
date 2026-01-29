import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAudio } from '@/lib/contexts/AudioContext';
import { TikTokSound } from '@/lib/types/tiktok';
import SoundCard from '@/components/audio/SoundCard';
import { TrendingUp, Star, Music, Filter, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface SoundBrowserProps {
  onSelectSound?: (sound: TikTokSound) => void;
  isPremium?: boolean;
  currentSound?: TikTokSound | null;
}

export const SoundBrowser: React.FC<SoundBrowserProps> = ({
  onSelectSound,
  isPremium = false,
  currentSound
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('trending');
  const [trendingSounds, setTrendingSounds] = useState<TikTokSound[]>([]);
  const [recommendedSounds, setRecommendedSounds] = useState<TikTokSound[]>([]);
  const [allSounds, setAllSounds] = useState<TikTokSound[]>([]);
  const [filteredSounds, setFilteredSounds] = useState<TikTokSound[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { favorites, addToFavorites, removeFromFavorites, toggle, play, isPlaying, currentSound: playingSound } = useAudio();

  // Fetch sounds data
  useEffect(() => {
    const fetchSounds = async () => {
      setIsLoading(true);
      
      try {
        // Here you would normally fetch from API
        // Mock data for demonstration purposes
        const mockSounds: TikTokSound[] = Array(20).fill(null).map((_, index) => ({
          id: `sound-${index}`,
          title: `Sound ${index + 1}`,
          authorName: `Artist ${index % 5 + 1}`,
          playUrl: `https://example.com/sound-${index + 1}.mp3`,
          duration: 30 + Math.random() * 60,
          original: index % 2 === 0,
          isRemix: index % 3 === 0,
          usageCount: Math.floor(Math.random() * 10000),
          creationDate: Date.now() - (Math.random() * 10000000),
          stats: {
            usageCount: Math.floor(Math.random() * 10000),
            usageChange7d: Math.floor(Math.random() * 500) * (Math.random() > 0.5 ? 1 : -1),
            usageChange14d: Math.floor(Math.random() * 800) * (Math.random() > 0.5 ? 1 : -1),
            usageChange30d: Math.floor(Math.random() * 1200) * (Math.random() > 0.5 ? 1 : -1),
            trend: Math.random() > 0.6 ? 'rising' : (Math.random() > 0.5 ? 'stable' : 'falling')
          },
          categories: index % 2 === 0 ? ['trending'] : ['popular'],
          soundCategory: index % 3 === 0 ? 'music' : 'voiceover',
          coverThumb: `https://picsum.photos/seed/sound${index}/200/200`
        }));
        
        // Sort and categorize data
        const trending = [...mockSounds].sort(() => Math.random() - 0.5).slice(0, 8);
        const recommended = [...mockSounds].sort(() => Math.random() - 0.5).slice(0, 10);
        
        setTrendingSounds(trending);
        setRecommendedSounds(recommended);
        setAllSounds(mockSounds);
        setFilteredSounds(mockSounds);
      } catch (error) {
        console.error('Error fetching sounds', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSounds();
  }, []);
  
  // Filter sounds based on search term and category
  useEffect(() => {
    let filtered = [...allSounds];
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(sound => 
        sound.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sound.authorName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        sound.categories?.some(cat => cat.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(sound => sound.categories?.includes(category));
    }
    
    // Sort
    if (sortBy === 'trending') {
      filtered = [...filtered].sort((a, b) => 
        (b.stats?.usageChange7d || 0) - (a.stats?.usageChange7d || 0)
      );
    } else if (sortBy === 'newest') {
      filtered = [...filtered].sort((a, b) => 
        b.creationDate - a.creationDate
      );
    } else if (sortBy === 'popularity') {
      filtered = [...filtered].sort((a, b) => 
        (b.stats?.usageCount || 0) - (a.stats?.usageCount || 0)
      );
    }
    
    setFilteredSounds(filtered);
  }, [debouncedSearchTerm, category, sortBy, allSounds]);
  
  const handleSelectSound = (sound: TikTokSound) => {
    if (onSelectSound) {
      onSelectSound(sound);
    }
  };
  
  const handleToggleFavorite = (sound: TikTokSound) => {
    if (favorites.some(fav => fav.id === sound.id)) {
      removeFromFavorites(sound.id);
    } else {
      addToFavorites(sound);
    }
  };
  
  const handlePlaySound = (sound: TikTokSound) => {
    toggle(sound);
  };
  
  const isSoundPlaying = (sound: TikTokSound) => {
    return isPlaying && playingSound?.id === sound.id;
  };
  
  const isSoundSelected = (sound: TikTokSound) => {
    return currentSound?.id === sound.id;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="p-4 space-y-3 bg-muted/10 rounded-lg border">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search sounds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          {isPremium && (
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="popularity">Popular</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={category === 'all' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setCategory('all')}>
            All
          </Badge>
          <Badge variant="outline" className={category === 'trending' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setCategory('trending')}>
            Trending
          </Badge>
          <Badge variant="outline" className={category === 'popular' ? 'bg-primary text-primary-foreground' : ''} onClick={() => setCategory('popular')}>
            Popular
          </Badge>
          {isPremium && (
            <Badge variant="outline" className="ml-auto bg-amber-100 text-amber-900 hover:bg-amber-200">
              <Crown className="w-3 h-3 mr-1" />
              Premium Filters
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="all" className="flex-1 my-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="all"><Music className="w-4 h-4 mr-2" /> All</TabsTrigger>
          <TabsTrigger value="trending"><TrendingUp className="w-4 h-4 mr-2" /> Trending</TabsTrigger>
          <TabsTrigger value="favorites"><Star className="w-4 h-4 mr-2" /> Favorites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
              {filteredSounds.map(sound => (
                <div 
                  key={sound.id}
                  className="cursor-pointer"
                  onClick={() => handleSelectSound(sound)}
                >
                  <SoundCard 
                    sound={sound}
                    showStats
                    showTrend
                    variant="horizontal"
                    onClick={() => handleSelectSound(sound)}
                  />
                </div>
              ))}
              {filteredSounds.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Music className="w-10 h-10 mb-2" />
                  <p>No sounds match your search</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
              {trendingSounds.map(sound => (
                <div 
                  key={sound.id}
                  className="cursor-pointer"
                  onClick={() => handleSelectSound(sound)}
                >
                  <SoundCard 
                    sound={sound}
                    showStats
                    showTrend
                    variant="horizontal"
                    onClick={() => handleSelectSound(sound)}
                  />
                </div>
              ))}
              {trendingSounds.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <TrendingUp className="w-10 h-10 mb-2" />
                  <p>No trending sounds available</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="favorites" className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
            {favorites.map(sound => (
              <div 
                key={sound.id}
                className="cursor-pointer"
                onClick={() => handleSelectSound(sound)}
              >
                <SoundCard 
                  sound={sound}
                  showStats
                  showTrend
                  variant="horizontal"
                  onClick={() => handleSelectSound(sound)}
                />
              </div>
            ))}
            {favorites.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Star className="w-10 h-10 mb-2" />
                <p>You haven't favorited any sounds yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {!isPremium && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-100 rounded-lg border border-amber-200 mt-auto mb-2">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-amber-500 mr-2" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800">Upgrade to Premium</h4>
              <p className="text-sm text-amber-700">Get access to trending sound predictions and performance analytics</p>
            </div>
            <Button variant="default" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Upgrade</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundBrowser; 