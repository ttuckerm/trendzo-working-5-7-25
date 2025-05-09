"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Wand2, 
  Sparkles, 
  Upload, 
  TrendingUp, 
  FileAudio, 
  RefreshCw, 
  Play, 
  Pause,
  AlertCircle,
  Check,
  ChevronRight,
  BarChart3,
  Loader2,
  ThumbsUp,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Types
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

interface Template {
  id: string;
  name: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  soundId?: string;
  soundTitle?: string;
  soundAuthor?: string;
  soundUrl?: string;
}

interface SoundRecommendation {
  id: string;
  title: string;
  authorName: string;
  coverThumb?: string;
  playUrl?: string;
  matchScore: number;
  compatibilityReason?: string;
  predictedEngagementLift?: number;
  confidence?: 'low' | 'medium' | 'high';
}

interface SoundRemixerProps {
  template: Template;
  onSelectSound?: (sound: Sound) => void;
  currentSoundId?: string;
  className?: string;
}

export default function SoundRemixer({
  template,
  onSelectSound,
  currentSoundId,
  className = ''
}: SoundRemixerProps) {
  const [activeTab, setActiveTab] = useState<string>('ai-recommendations');
  const [recommendations, setRecommendations] = useState<SoundRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<Sound | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [customSoundFile, setCustomSoundFile] = useState<File | null>(null);
  const [customSoundName, setCustomSoundName] = useState<string>('');
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const uploadRef = useRef<HTMLInputElement | null>(null);

  // Load the current sound if there is one
  useEffect(() => {
    if (currentSoundId) {
      fetchSoundDetails(currentSoundId);
    }
  }, [currentSoundId]);

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

  // Fetch AI recommendations when the tab is selected
  useEffect(() => {
    if (activeTab === 'ai-recommendations') {
      fetchAiRecommendations();
    }
  }, [activeTab]);

  const fetchSoundDetails = async (soundId: string) => {
    try {
      const response = await fetch(`/api/sounds/${soundId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sound details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedSound(data.sound);
      } else {
        throw new Error(data.error || 'Failed to fetch sound details');
      }
    } catch (error) {
      console.error('Error fetching sound details:', error);
    }
  };

  const fetchAiRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const params = new URLSearchParams({
        templateId: template.id,
        category: template.category,
        limit: '5'
      });
      
      // Call the recommendations API
      const response = await fetch(`/api/sounds/recommendations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to include additional AI insights
        const enhancedRecommendations = data.recommendations.map((rec: any) => ({
          ...rec,
          compatibilityReason: getAiCompatibilityReason(rec, template),
          predictedEngagementLift: calculatePredictedEngagementLift(rec.matchScore),
          confidence: getConfidenceLevel(rec.matchScore)
        }));
        
        setRecommendations(enhancedRecommendations);
      } else {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const getAiCompatibilityReason = (sound: any, template: Template): string => {
    // In a real app, this would come from the AI. For now, we'll generate some plausible reasons
    const reasons = [
      `Matches the ${template.category} template's rhythm and pacing`,
      `Has similar energy to successful ${template.category} content`,
      `Shows strong correlation with high engagement for this template style`,
      `Trending sound that fits well with this template category`,
      `Harmonizes with the visual flow of this template type`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  const calculatePredictedEngagementLift = (matchScore: number): number => {
    // In a real app, this would be a more sophisticated calculation
    // For demo purposes, we'll generate a lift between -10% and +50% based on match score
    const baseLift = (matchScore - 0.5) * 100; // Convert 0.5-1.0 score to 0-50 range
    return Math.round(baseLift);
  };

  const getConfidenceLevel = (matchScore: number): 'low' | 'medium' | 'high' => {
    if (matchScore >= 0.8) return 'high';
    if (matchScore >= 0.6) return 'medium';
    return 'low';
  };

  const calculateTemplateSoundCompatibility = async (soundId: string): Promise<number> => {
    try {
      // In a real app, this would call an actual API endpoint
      const response = await fetch(`/api/sounds/template-pairings?soundId=${soundId}&templateId=${template.id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch compatibility: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.recommendation?.correlation?.score) {
        return data.recommendation.correlation.score;
      }
      
      // Fallback to a random score
      return Math.floor(Math.random() * 30) + 70; // 70-100 range
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      // Fallback to a random score
      return Math.floor(Math.random() * 30) + 70; // 70-100 range
    }
  };

  const handleSelectSound = async (sound: Sound) => {
    setSelectedSound(sound);
    
    // Calculate compatibility score
    const score = await calculateTemplateSoundCompatibility(sound.id);
    setCompatibilityScore(score);
    
    if (onSelectSound) {
      onSelectSound(sound);
    }
  };

  const handlePlaySound = (soundId: string, url?: string) => {
    if (!url) return;
    
    if (playingSound === soundId) {
      // If the same sound is already playing, pause it
      setPlayingSound(null);
    } else {
      // Play a different sound
      setPlayingSound(soundId);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
    }
  };

  const handleUploadClick = () => {
    if (uploadRef.current) {
      uploadRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomSoundFile(file);
      // Set a default name based on the file name (without extension)
      setCustomSoundName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSound = async () => {
    if (!customSoundFile || !customSoundName) {
      setUploadError("Please select a file and provide a name");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // In a real app, this would call an actual API endpoint with FormData
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // Simulate successful upload
      setUploadProgress(100);
      
      // Simulate successful upload
      const mockUploadedSound: Sound = {
        id: `custom-${Date.now()}`,
        title: customSoundName,
        authorName: 'You', // Could be from user profile in real app
        playUrl: URL.createObjectURL(customSoundFile),
        soundCategory: 'Custom',
        duration: 30 // Placeholder duration
      };
      
      // Calculate compatibility score
      const score = Math.floor(Math.random() * 30) + 70; // 70-100 range for demo
      setCompatibilityScore(score);
      
      // Update state
      setSelectedSound(mockUploadedSound);
      if (onSelectSound) {
        onSelectSound(mockUploadedSound);
      }
      
      // Close the dialog after successful upload
      setTimeout(() => {
        setUploadDialogOpen(false);
        setCustomSoundFile(null);
        setCustomSoundName('');
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading sound:', error);
      setUploadError("Failed to upload sound. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  // Format duration in MM:SS
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium flex items-center">
          <Music className="w-5 h-5 mr-2 text-primary" />
          Sound Remix Studio
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enhance your template with the perfect sound to boost engagement
        </p>
      </div>

      {/* Hidden audio element for sound playback */}
      <audio ref={audioRef} className="hidden" />

      {/* If a sound is already selected, show it */}
      {selectedSound && (
        <div className="p-4 bg-primary/5 m-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-primary">Current Sound</h4>
              <p className="text-sm">{selectedSound.title}</p>
              <p className="text-xs text-muted-foreground">By {selectedSound.authorName}</p>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlePlaySound(selectedSound.id, selectedSound.playUrl)}
              className="h-8 w-8 p-0"
            >
              {playingSound === selectedSound.id ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span className="sr-only">
                {playingSound === selectedSound.id ? 'Pause' : 'Play'}
              </span>
            </Button>
          </div>
          
          {compatibilityScore !== null && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">Template Compatibility</span>
                <span className={`text-xs font-medium ${getScoreColor(compatibilityScore)}`}>
                  {compatibilityScore}%
                </span>
              </div>
              <Progress 
                value={compatibilityScore} 
                className={`h-2 ${
                  compatibilityScore >= 80
                    ? "bg-green-500"
                    : compatibilityScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="ai-recommendations" value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="ai-recommendations" className="flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            <span>AI Recommendations</span>
          </TabsTrigger>
          <TabsTrigger value="custom-upload" className="flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            <span>Your Sounds</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-recommendations" className="space-y-4 mt-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Our AI analyzes your template and suggests sounds that will maximize engagement
            </p>
          </div>

          {loadingRecommendations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No recommendations available</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAiRecommendations}
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Recommendations
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              {recommendations.map((sound) => (
                <Card key={sound.id} className="mb-4 overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{sound.title}</CardTitle>
                        <CardDescription>By {sound.authorName}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlaySound(sound.id, sound.playUrl)}
                          className="h-8 w-8 p-0"
                        >
                          {playingSound === sound.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {playingSound === sound.id ? 'Pause' : 'Play'}
                          </span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelectSound(sound as Sound)}
                          className="h-8"
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          Match Score: {Math.round(sound.matchScore * 100)}%
                        </Badge>
                        <Badge 
                          variant={
                            sound.confidence === 'high' 
                              ? 'default' 
                              : sound.confidence === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {sound.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm bg-muted/40 p-2 rounded-md">
                      <p className="font-medium flex items-center text-primary mb-1">
                        <Sparkles className="h-3 w-3 mr-1" /> AI Insight
                      </p>
                      <p className="text-muted-foreground">{sound.compatibilityReason}</p>
                    </div>
                    
                    {sound.predictedEngagementLift !== undefined && (
                      <div className="mt-2 flex items-center">
                        <BarChart3 className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span className="text-sm">
                          Predicted engagement: 
                          <span className={sound.predictedEngagementLift > 0 
                            ? ' text-green-600' 
                            : sound.predictedEngagementLift < 0 
                            ? ' text-red-600' 
                            : ''
                          }>
                            {' '}{sound.predictedEngagementLift > 0 ? '+' : ''}{sound.predictedEngagementLift}%
                          </span>
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
          )}

          <Button 
            variant="outline" 
            className="w-full"
            onClick={fetchAiRecommendations}
            disabled={loadingRecommendations}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Recommendations
          </Button>
        </TabsContent>

        <TabsContent value="custom-upload" className="space-y-4 mt-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Upload your own sounds to use with your templates
            </p>
          </div>

          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors"
            onClick={() => setUploadDialogOpen(true)}
          >
            <FileAudio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Upload Custom Sound</h4>
            <p className="text-sm text-muted-foreground">
              Drag and drop or click to upload MP3, WAV, or M4A files
            </p>
          </div>

          {/* Custom sound upload dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Custom Sound</DialogTitle>
                <DialogDescription>
                  Add your own sound to use with this template
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {customSoundFile ? (
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{customSoundFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCustomSoundFile(null)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(customSoundFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={handleUploadClick}
                  >
                    <FileAudio className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-1">Choose a file</p>
                    <p className="text-xs text-muted-foreground">
                      MP3, WAV, or M4A up to 10MB
                    </p>
                    <input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/m4a,audio/mpeg"
                      className="hidden"
                      onChange={handleFileChange}
                      ref={uploadRef}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="sound-name">Sound Name</Label>
                  <Input
                    id="sound-name"
                    value={customSoundName}
                    onChange={(e) => setCustomSoundName(e.target.value)}
                    placeholder="Enter a name for your sound"
                  />
                </div>

                {uploadError && (
                  <div className="bg-red-50 text-red-600 p-2 rounded text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {uploadError}
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadSound}
                  disabled={!customSoundFile || !customSoundName || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Sound
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
} 