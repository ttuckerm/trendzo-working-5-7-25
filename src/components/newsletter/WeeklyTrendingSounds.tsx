'use client';

import { useState, useEffect } from 'react';
import { Music, TrendingUp, Play, Pause, Info, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { WeeklyTrendingSoundsShowcase, NewsletterSoundRecommendation } from '@/lib/types/newsletter';

interface WeeklyTrendingSoundsProps {
  showcase?: WeeklyTrendingSoundsShowcase;
  newsletterId?: string;
  linkId?: string;
  onSoundSelect?: (soundId: string) => void;
  className?: string;
  compactView?: boolean;
}

export default function WeeklyTrendingSounds({
  showcase,
  newsletterId,
  linkId,
  onSoundSelect,
  className = '',
  compactView = false
}: WeeklyTrendingSoundsProps) {
  const [currentShowcase, setCurrentShowcase] = useState<WeeklyTrendingSoundsShowcase | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Load showcase if not provided
  useEffect(() => {
    if (showcase) {
      setCurrentShowcase(showcase);
      return;
    }
    
    const fetchShowcase = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/newsletter/weekly-sounds');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch weekly trending sounds (${response.status})`);
        }
        
        const data = await response.json();
        
        if (data.success && data.showcase) {
          setCurrentShowcase(data.showcase);
        } else {
          throw new Error(data.error || 'Failed to fetch showcase data');
        }
      } catch (error: any) {
        console.error('Error fetching weekly sounds showcase:', error);
        setError(error.message || 'Could not load trending sounds. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchShowcase();
  }, [showcase]);
  
  const handleSoundPlay = (soundId: string) => {
    if (playingSound === soundId) {
      setPlayingSound(null);
    } else {
      setPlayingSound(soundId);
      
      // Stop playing after 30 seconds
      setTimeout(() => {
        setPlayingSound(p => p === soundId ? null : p);
      }, 30000);
    }
  };
  
  const handleSoundSelect = (soundId: string) => {
    // Track selection if linkId is provided
    if (linkId) {
      fetch(`/api/sounds/performance-tracking?soundId=${soundId}&linkId=${linkId}`);
    }
    
    if (onSoundSelect) {
      onSoundSelect(soundId);
    }
  };
  
  const getTrendingStatusColor = (status: string) => {
    switch (status) {
      case 'emerging': return 'text-green-500';
      case 'growing': return 'text-blue-500';
      case 'peaking': return 'text-purple-500';
      case 'declining': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };
  
  const getTrendBadge = (sound: NewsletterSoundRecommendation) => {
    const statusColor = getTrendingStatusColor(sound.trendingStatus);
    
    return (
      <Badge 
        variant="outline" 
        className={`${statusColor} border-current`}
      >
        <TrendingUp size={14} className="mr-1" /> 
        {sound.trendingStatus.charAt(0).toUpperCase() + sound.trendingStatus.slice(1)}
      </Badge>
    );
  };

  // If no showcase available, display a zero-state with retry option
  if ((!currentShowcase && !loading && !error) || (!currentShowcase && error)) {
    return (
      <Card className={`border border-gray-200 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary" />
            Weekly Trending Sounds
          </CardTitle>
          <CardDescription>
            Discover the hottest sounds trending this week
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          {error ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">{error}</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetch('/api/newsletter/weekly-sounds')
                    .then(res => res.json())
                    .then(data => {
                      if (data.success && data.showcase) {
                        setCurrentShowcase(data.showcase);
                      } else {
                        throw new Error(data.error || 'Failed to fetch showcase data');
                      }
                    })
                    .catch(err => {
                      console.error('Error retrying showcase fetch:', err);
                      setError('Could not load trending sounds. Please try again later.');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">No trending sounds available</p>
              <Button 
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  fetch('/api/newsletter/weekly-sounds?generateNew=true')
                    .then(res => res.json())
                    .then(data => {
                      if (data.success && data.showcase) {
                        setCurrentShowcase(data.showcase);
                      } else {
                        throw new Error(data.error || 'Failed to generate showcase data');
                      }
                    })
                    .catch(err => {
                      console.error('Error generating showcase:', err);
                      setError('Could not generate trending sounds. Please try again later.');
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
              >
                Generate Showcase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Simplified compact view for mobile/newsletter
  if (compactView || isMobile) {
    return (
      <Card className={`border border-gray-200 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Music className="h-5 w-5 mr-2 text-primary" />
            Weekly Trending Sounds
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">{error}</div>
          ) : currentShowcase ? (
            <div className="space-y-3">
              {currentShowcase.sounds && currentShowcase.sounds.slice(0, 3).map((sound) => (
                <div key={sound.soundId} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{sound.soundTitle}</p>
                    <p className="text-xs text-muted-foreground">{sound.authorName}</p>
                    <div className="mt-1">
                      {getTrendBadge(sound)}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSoundSelect(sound.soundId)}
                    className="ml-2"
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No trending sounds available
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <Link href="/sounds" className="text-sm text-primary flex items-center">
            See all trending sounds <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  // Full detailed view
  return (
    <Card className={`border border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Music className="h-5 w-5 mr-2 text-primary" />
          Weekly Trending Sounds
        </CardTitle>
        <CardDescription>
          Discover the hottest sounds trending this week
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : currentShowcase && currentShowcase.sounds ? (
          <div className="space-y-4">
            {currentShowcase.sounds.slice(0, 5).map((sound) => (
              <Card key={sound.soundId} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="p-4 md:w-3/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{sound.soundTitle}</h3>
                        <p className="text-sm text-muted-foreground">{sound.authorName}</p>
                      </div>
                      <div>
                        {getTrendBadge(sound)}
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="secondary">{sound.category}</Badge>
                      {sound.weeklyChange > 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          +{sound.weeklyChange.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-1">Template match score:</p>
                      <div className="space-y-2">
                        {sound.templatePairings && sound.templatePairings.slice(0, 2).map((pairing, i) => (
                          <div key={i} className="flex items-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info size={14} className="text-muted-foreground mr-2" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[200px] text-xs">
                                    Match score indicates how well this sound pairs with "{pairing.templateTitle}"
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="flex-grow">
                              <div className="flex text-xs justify-between mb-1">
                                <span>{pairing.templateTitle}</span>
                                <span>{Math.round(pairing.correlationScore)}%</span>
                              </div>
                              <Progress 
                                value={pairing.correlationScore} 
                                className="h-1.5" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 md:w-2/5 flex flex-col justify-between">
                    <div className="mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mb-3 w-full"
                        onClick={() => handleSoundPlay(sound.soundId)}
                      >
                        {playingSound === sound.soundId ? (
                          <>
                            <Pause size={16} className="mr-2" /> 
                            Stop Preview
                          </>
                        ) : (
                          <>
                            <Play size={16} className="mr-2" /> 
                            Preview Sound
                          </>
                        )}
                      </Button>
                      
                      <div className="flex justify-between">
                        <Link 
                          href={`/sounds/${sound.soundId}?${newsletterId ? `newsletterId=${newsletterId}` : ''}`}
                          className="text-xs text-primary underline"
                        >
                          See performance analytics
                        </Link>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleSoundSelect(sound.soundId)}
                      className="w-full"
                    >
                      Select this Sound
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No trending sounds available
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Link href="/sounds" className="text-sm text-primary flex items-center">
            Explore all trending sounds <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
          <span className="text-xs text-muted-foreground">
            Updated {currentShowcase?.date ? new Date(currentShowcase.date).toLocaleDateString() : 'recently'}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
} 