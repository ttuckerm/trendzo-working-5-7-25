'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Music, Lightbulb, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { NewsletterSoundRecommendation } from '@/lib/types/newsletter';

interface SoundTemplatePairingsProps {
  templateId: string;
  templateTitle?: string;
  newsletterId?: string;
  linkId?: string;
  onSoundSelect?: (soundId: string) => void;
  className?: string;
}

export default function SoundTemplatePairings({
  templateId,
  templateTitle,
  newsletterId,
  linkId,
  onSoundSelect,
  className = ''
}: SoundTemplatePairingsProps) {
  const [soundRecommendations, setSoundRecommendations] = useState<NewsletterSoundRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch sound recommendations for this template
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!templateId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/sounds/template-pairings?templateId=${templateId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sound recommendations');
        }
        
        const data = await response.json();
        
        if (data.success && data.recommendations) {
          setSoundRecommendations(data.recommendations);
        } else {
          throw new Error(data.error || 'Failed to fetch recommendation data');
        }
      } catch (error) {
        console.error('Error fetching sound recommendations:', error);
        setError('Could not load sound recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [templateId]);
  
  const handleSoundSelect = (soundId: string) => {
    // Track selection if linkId is provided
    if (linkId) {
      fetch(`/api/sounds/performance-tracking?soundId=${soundId}&linkId=${linkId}`);
    }
    
    // Notify the user
    toast({
      title: 'Sound Selected',
      description: 'This sound has been selected for your template.',
      duration: 3000
    });
    
    if (onSoundSelect) {
      onSoundSelect(soundId);
    }
  };
  
  return (
    <Card className={`border border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wand2 className="h-5 w-5 mr-2 text-primary" />
          Recommended Sounds for {templateTitle || 'Your Template'}
        </CardTitle>
        <CardDescription>
          AI-powered sound recommendations to enhance your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">{error}</div>
        ) : soundRecommendations.length > 0 ? (
          <div className="space-y-4">
            {soundRecommendations.slice(0, 3).map((sound) => (
              <div key={sound.soundId} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium">{sound.soundTitle}</h3>
                    <p className="text-sm text-muted-foreground">{sound.authorName}</p>
                  </div>
                  <Badge variant="outline" className="text-primary border-primary">
                    {Math.round(sound.templatePairings[0]?.correlationScore || 0)}% Match
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm mb-1">Compatibility with this template:</div>
                  <Progress 
                    value={sound.templatePairings[0]?.correlationScore || 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{sound.category}</Badge>
                  {sound.trendingStatus && (
                    <Badge variant="outline">
                      {sound.trendingStatus.charAt(0).toUpperCase() + sound.trendingStatus.slice(1)}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={() => handleSoundSelect(sound.soundId)}
                    className="flex-1"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Use This Sound
                  </Button>
                  <Link 
                    href={`/sounds/${sound.soundId}?${newsletterId ? `newsletterId=${newsletterId}` : ''}`}
                    passHref
                  >
                    <Button variant="outline" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 flex flex-col items-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No sound recommendations found for this template
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex justify-between w-full">
          <Link href="/sounds/browser" className="text-sm text-primary flex items-center">
            Browse all sounds <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            Refresh recommendations
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 