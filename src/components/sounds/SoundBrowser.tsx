"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2, Music, VolumeX, Filter, Search, TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card-component';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';

// Define types
interface Sound {
  id: string;
  title: string;
  authorName: string;
  coverThumb?: string;
  playUrl?: string;
  duration?: number;
  usageCount?: number;
  matchScore?: number;
  soundCategory?: string;
  categories?: string[];
  genre?: string;
  genres?: string[];
  mood?: string[] | undefined;
  moods?: string[];
  tempo?: string;
  stats?: {
    usageChange7d?: number;
    usageChange14d?: number;
    usageChange30d?: number;
    growthVelocity7d?: number;
    trend?: 'rising' | 'stable' | 'falling';
  };
}

interface SoundCategories {
  soundCategories: string[];
  genres?: string[];
  moods?: string[];
  tempos?: string[];
}

interface SoundBrowserProps {
  onSelectSound?: (sound: Sound) => void;
  selectedSoundId?: string;
  initialCategory?: string;
  initialFilters?: {
    genres?: string[];
    moods?: string[];
    tempo?: string;
  };
  showRecommended?: boolean;
  title?: string;
}

export default function SoundBrowser({
  onSelectSound,
  selectedSoundId,
  initialCategory,
  initialFilters,
  showRecommended = true,
  title = "Sound Browser"
}: SoundBrowserProps) {
  // State for sounds and loading
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastId, setLastId] = useState<string | null>(null);

  // State for categories
  const [categories, setCategories] = useState<SoundCategories>({ soundCategories: [] });
  const [loadingCategories, setLoadingCategories] = useState(true);

  // State for filters
  const [category, setCategory] = useState<string>(initialCategory || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialFilters?.genres || []);
  const [selectedMoods, setSelectedMoods] = useState<string[]>(initialFilters?.moods || []);
  const [selectedTempo, setSelectedTempo] = useState<string>(initialFilters?.tempo || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'trending' | 'recent'>('popular');
  
  // State for currently playing sound
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Filter dialog state
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Ref to track if filters have changed
  const filtersChanged = useRef(false);

  // Set up infinite scrolling
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    rootMargin: '200px',
  });

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Load sounds when filters change or on mount
  useEffect(() => {
    loadSounds(true);
    filtersChanged.current = false;
  }, [category, selectedGenres, selectedMoods, selectedTempo, sortBy]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView && !loading && hasMore && !filtersChanged.current) {
      loadSounds(false);
    }
  }, [inView]);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (playingSound) {
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
        });
      } else {
        audioRef.current.pause();
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [playingSound]);

  // Fetch sound categories
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/sounds/categories?includeStats=true');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories);
      } else {
        throw new Error(data.error || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load sound categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load sounds with pagination
  const loadSounds = async (reset: boolean) => {
    try {
      setLoading(true);
      // If reset, clear existing sounds and reset pagination
      if (reset) {
        setSounds([]);
        setLastId(null);
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Check if we're in demo mode by looking at the URL
      const isDemoMode = window.location.search.includes('demo=true');
      if (isDemoMode) {
        params.append('demo', 'true');
      }
      
      if (category) {
        params.append('category', category);
      }
      
      if (selectedGenres.length > 0) {
        params.append('genre', selectedGenres.join(','));
      }
      
      if (selectedMoods.length > 0) {
        params.append('mood', selectedMoods.join(','));
      }
      
      if (selectedTempo) {
        params.append('tempo', selectedTempo);
      }
      
      // Handle pagination
      if (lastId && !reset) {
        params.append('lastId', lastId);
      }
      
      // Default page size
      params.append('limit', '20');
      
      // Handle sorting
      if (sortBy === 'trending') {
        // For trending, we'll use a different endpoint
        const trendingResponse = await fetch(`/api/sounds/trending?${params.toString()}`);
        if (!trendingResponse.ok) {
          throw new Error(`Failed to fetch trending sounds: ${trendingResponse.status}`);
        }
        
        const trendingData = await trendingResponse.json();
        if (trendingData.success) {
          if (reset) {
            setSounds(trendingData.sounds);
          } else {
            setSounds(prev => [...prev, ...trendingData.sounds]);
          }
          setHasMore(trendingData.pagination?.hasMore || false);
          setLastId(trendingData.pagination?.lastVisible || null);
        }
      } else {
        // Add sort parameter
        if (sortBy === 'recent') {
          params.append('sortBy', 'creationDate');
          params.append('sortDirection', 'desc');
        } else {
          params.append('sortBy', 'usageCount');
          params.append('sortDirection', 'desc');
        }
        
        // Fetch sounds
        const response = await fetch(`/api/sounds?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sounds: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          if (reset) {
            setSounds(data.data);
          } else {
            setSounds(prev => [...prev, ...data.data]);
          }
          setHasMore(data.pagination.hasMore);
          setLastId(data.pagination.lastVisible);
        } else {
          throw new Error(data.error || 'Failed to fetch sounds');
        }
      }
    } catch (error) {
      console.error('Error fetching sounds:', error);
      setError('Failed to load sounds');
    } finally {
      setLoading(false);
    }
  };

  // Handle playing a sound
  const handlePlaySound = (soundId: string, url?: string) => {
    if (!url) {
      console.error('Sound URL not available');
      return;
    }
    
    if (audioRef.current) {
      audioRef.current.src = url;
      
      if (playingSound === soundId) {
        setPlayingSound(null); // Stop playing if the same sound is clicked
      } else {
        setPlayingSound(soundId);
      }
    }
  };

  // Handle sound selection
  const handleSelectSound = (sound: Sound) => {
    if (onSelectSound) {
      onSelectSound(sound);
    }
  };

  // Handle filter changes
  const applyFilters = () => {
    filtersChanged.current = true;
    setFiltersOpen(false);
    loadSounds(true);
  };

  // Reset filters
  const resetFilters = () => {
    setCategory('');
    setSelectedGenres([]);
    setSelectedMoods([]);
    setSelectedTempo('');
    filtersChanged.current = true;
    setFiltersOpen(false);
  };

  // Format duration in seconds to mm:ss
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format usage count with K, M suffixes
  const formatUsageCount = (count?: number) => {
    if (!count) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    
    return count.toString();
  };

  // Get trend indicator for a sound
  const getTrendIndicator = (sound: Sound) => {
    const trend = sound.stats?.trend;
    
    if (!trend) return null;
    
    if (trend === 'rising') {
      return <Badge variant="default" className="bg-green-500">Rising</Badge>;
    }
    
    if (trend === 'falling') {
      return <Badge variant="outline" className="border-red-400 text-red-500">Falling</Badge>;
    }
    
    return <Badge variant="outline">Stable</Badge>;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search sounds..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  filtersChanged.current = true;
                  loadSounds(true);
                }
              }}
            />
          </div>
          
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter size={16} />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Filter Sounds</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <h3 className="text-sm font-medium">Category</h3>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.soundCategories && categories.soundCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {categories.genres && categories.genres.length > 0 && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.genres.map((genre) => (
                        <Badge 
                          key={genre}
                          variant={selectedGenres.includes(genre) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedGenres.includes(genre)) {
                              setSelectedGenres(selectedGenres.filter(g => g !== genre));
                            } else {
                              setSelectedGenres([...selectedGenres, genre]);
                            }
                          }}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {categories.moods && categories.moods.length > 0 && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Moods</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.moods.map((mood) => (
                        <Badge 
                          key={mood}
                          variant={selectedMoods.includes(mood) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (selectedMoods.includes(mood)) {
                              setSelectedMoods(selectedMoods.filter(m => m !== mood));
                            } else {
                              setSelectedMoods([...selectedMoods, mood]);
                            }
                          }}
                        >
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {categories.tempos && categories.tempos.length > 0 && (
                  <div className="grid gap-2">
                    <h3 className="text-sm font-medium">Tempo</h3>
                    <Select value={selectedTempo} onValueChange={setSelectedTempo}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Tempos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Tempos</SelectItem>
                        {categories.tempos.map((tempo) => (
                          <SelectItem key={tempo} value={tempo}>
                            {tempo.charAt(0).toUpperCase() + tempo.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={resetFilters}>Reset</Button>
                  <Button onClick={applyFilters}>Apply Filters</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all" onClick={() => setSortBy('popular')}>
            <Music className="mr-2 h-4 w-4" />
            Popular
          </TabsTrigger>
          
          <TabsTrigger value="trending" onClick={() => setSortBy('trending')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Trending
          </TabsTrigger>
          
          <TabsTrigger value="recent" onClick={() => setSortBy('recent')}>
            <Clock className="mr-2 h-4 w-4" />
            Recent
          </TabsTrigger>
          
          {showRecommended && (
            <PremiumFeatureGate
              featureName="Sound Recommendations"
              description="Get personalized sound recommendations based on your previous selections."
              requiredTier="premium"
            >
              <TabsTrigger value="recommended">
                <RefreshCw className="mr-2 h-4 w-4" />
                Recommended
              </TabsTrigger>
            </PremiumFeatureGate>
          )}
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sounds.map((sound) => (
              <Card
                key={sound.id}
                className={`cursor-pointer p-4 ${selectedSoundId === sound.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelectSound(sound)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium truncate">{sound.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">By {sound.authorName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound(sound.id, sound.playUrl);
                    }}
                    className="p-2 rounded-full bg-primary/10 hover:bg-primary/20"
                  >
                    {playingSound === sound.id ? (
                      <VolumeX size={16} />
                    ) : (
                      <Music size={16} />
                    )}
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                  <span>{sound.soundCategory}</span>
                  <span>{formatDuration(sound.duration)}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs text-muted-foreground">Uses: </span>
                    <span className="text-sm font-medium">{formatUsageCount(sound.usageCount)}</span>
                  </div>
                  {getTrendIndicator(sound)}
                </div>
              </Card>
            ))}
            
            {loading && (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          
          {!loading && sounds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Sounds Found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
              <Button variant="outline" className="mt-4" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          )}
          
          {/* Load more trigger element */}
          {hasMore && !loading && (
            <div ref={loadMoreRef} className="h-10 flex justify-center items-center mt-4">
              <span className="text-sm text-muted-foreground">Loading more...</span>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="mt-0">
          {/* Trending content uses the same grid */}
        </TabsContent>
        
        <TabsContent value="recent" className="mt-0">
          {/* Recent content uses the same grid */}
        </TabsContent>
        
        {showRecommended && (
          <TabsContent value="recommended" className="mt-0">
            <PremiumFeatureGate
              featureName="Sound Recommendations"
              description="Get personalized sound recommendations based on your previous selections."
              requiredTier="premium"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Recommended sounds content would go here */}
                <div className="col-span-full flex flex-col items-center justify-center py-12">
                  <Music className="h-12 w-12 text-primary/50 mb-4" />
                  <h3 className="text-lg font-medium">Personalized Recommendations</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Based on your selection history, these sounds would work well with your content style.
                  </p>
                </div>
              </div>
            </PremiumFeatureGate>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setPlayingSound(null)}
        className="hidden"
      />
    </div>
  );
} 