'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, TrendingUp, Volume2, Filter, CheckCircle, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card-component';
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select';
import { Input } from '@/components/ui/Input';
import { useAudio } from '@/lib/contexts/AudioContext';
import Link from 'next/link';

// Sound prediction type
interface SoundPrediction {
  id: string;
  title: string;
  artist: string;
  growthRate: number;
  confidence: number;
  predictionStatus: 'emerging' | 'trending' | 'stable' | 'declining';
  peakTimeframe: string;
  playUrl: string;
}

export default function SoundPredictionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<SoundPrediction[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toggle } = useAudio();

  // Fetch sound predictions data
  useEffect(() => {
    const fetchSoundPredictions = async () => {
      setLoading(true);
      try {
        // In production, fetch from API: /api/sounds/trend-report
        // For now, use mock data
        setPredictions(getMockTrendingSounds());
      } catch (error) {
        console.error('Failed to fetch sound predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSoundPredictions();
  }, []);

  // Filter predictions based on status and search query
  const filteredPredictions = predictions.filter(sound => {
    const matchesFilter = filter === 'all' || sound.predictionStatus === filter;
    const matchesSearch = searchQuery === '' || 
      sound.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sound.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Handle expert verification (in a real app, this would call an API)
  const handleExpertVerification = (soundId: string, isAccurate: boolean) => {
    console.log(`Sound ${soundId} marked as ${isAccurate ? 'accurate' : 'inaccurate'}`);
    // In production, call API to update verification status
  };

  // Handle playing a sound by adapting SoundPrediction to match the expected TikTokSound format
  const handlePlaySound = (sound: SoundPrediction) => {
    // Determine the appropriate trend value with the correct type
    const trendValue: 'rising' | 'falling' | 'stable' = 
      sound.predictionStatus === 'emerging' || sound.predictionStatus === 'trending' 
        ? 'rising' 
        : sound.predictionStatus === 'declining' ? 'falling' : 'stable';
      
    const adaptedSound = {
      id: sound.id,
      title: sound.title,
      authorName: sound.artist,
      playUrl: sound.playUrl,
      // Add other required properties with default values
      duration: 30,
      original: false,
      isRemix: false,
      usageCount: 0,
      creationDate: Date.now(),
      // Add required stats property
      stats: {
        usageCount: 0,
        usageChange7d: sound.growthRate,
        usageChange14d: 0,
        usageChange30d: 0,
        trend: trendValue
      }
      // The rest can be undefined
    };
    
    toggle(adaptedSound);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Sound Trend Predictions</h1>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sounds</SelectItem>
              <SelectItem value="emerging">Emerging</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
              <SelectItem value="declining">Declining</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="default">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPredictions.map((sound) => (
              <Card key={sound.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className={
                          sound.predictionStatus === 'emerging' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                          sound.predictionStatus === 'trending' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' :
                          sound.predictionStatus === 'stable' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                          'bg-orange-100 text-orange-800 hover:bg-orange-100'
                        }>
                          {sound.predictionStatus}
                        </Badge>
                        <h3 className="text-lg font-medium mt-2">{sound.title}</h3>
                        <p className="text-sm text-muted-foreground">{sound.artist}</p>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handlePlaySound(sound)}
                        >
                          <Volume2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                        <span>
                          Growth: <span className="font-medium">{sound.growthRate}%</span>
                        </span>
                      </div>
                      <div className="text-sm">
                        Confidence: <span className="font-medium">{sound.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Predicted to {sound.predictionStatus === 'declining' ? 'decline' : 'peak'} in {sound.peakTimeframe}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Expert Verification:</span>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleExpertVerification(sound.id, true)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Accurate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleExpertVerification(sound.id, false)}
                        >
                          <X className="h-3 w-3 mr-1" /> Inaccurate
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredPredictions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Music className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sounds found</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                No sound predictions match your current filters. Try adjusting your search or filter criteria.
              </p>
              <Button onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}>
                Reset Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Mock Trending Sounds Data - same as the one in trend-predictions-dashboard
function getMockTrendingSounds(): SoundPrediction[] {
  return [
    {
      id: 'sound-1',
      title: 'Summer Beach Vibes',
      artist: 'Coastal Dreams',
      growthRate: 42,
      confidence: 87,
      predictionStatus: 'emerging',
      peakTimeframe: '2-3 weeks',
      playUrl: '/sounds/sample-1.mp3'
    },
    {
      id: 'sound-2',
      title: 'Lo-Fi Study Beat',
      artist: 'Chill Hop Master',
      growthRate: 28,
      confidence: 92,
      predictionStatus: 'trending',
      peakTimeframe: '4-6 weeks',
      playUrl: '/sounds/sample-2.mp3'
    },
    {
      id: 'sound-3',
      title: 'Epic Cinematic Rise',
      artist: 'Film Score Studios',
      growthRate: 15,
      confidence: 76,
      predictionStatus: 'stable',
      peakTimeframe: '8-10 weeks',
      playUrl: '/sounds/sample-3.mp3'
    },
    {
      id: 'sound-4',
      title: 'Electric Dance Pop',
      artist: 'Beat Factory',
      growthRate: -8,
      confidence: 81,
      predictionStatus: 'declining',
      peakTimeframe: '1-2 weeks',
      playUrl: '/sounds/sample-4.mp3'
    },
    {
      id: 'sound-5',
      title: 'Viral TikTok Sound 2023',
      artist: 'Social Media Stars',
      growthRate: 65,
      confidence: 94,
      predictionStatus: 'emerging',
      peakTimeframe: '1-2 weeks',
      playUrl: '/sounds/sample-5.mp3'
    },
    {
      id: 'sound-6',
      title: 'Motivational Speech Background',
      artist: 'Inspire Productions',
      growthRate: 32,
      confidence: 88,
      predictionStatus: 'trending',
      peakTimeframe: '3-4 weeks',
      playUrl: '/sounds/sample-6.mp3'
    }
  ];
} 