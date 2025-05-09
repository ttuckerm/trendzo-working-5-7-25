"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Music, 
  Volume2, 
  Sparkles, 
  PaintBucket, 
  Clock, 
  CheckCircle2, 
  Save,
  Brain,
  Heart,
  Globe,
  Users,
  Star,
  Bell,
  Sliders,
  Mic
} from 'lucide-react';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

// Sample data
const SAMPLE_PREFERENCES = {
  audioPreferences: {
    genrePreferences: {
      electronic: 85,
      ambient: 75,
      lofi: 65,
      inspirational: 55,
      corporate: 40
    },
    tempo: {
      slow: 30,
      medium: 60,
      fast: 80
    },
    musicComplexity: 65,
    volumePreference: 75,
    autoPlayEnabled: true
  },
  visualPreferences: {
    colorSchemes: {
      vibrant: 80,
      muted: 40,
      monochrome: 30,
      pastel: 65,
      dark: 55
    },
    animationIntensity: 70,
    transitionSpeed: 65,
    visualComplexity: 55,
    beatSyncEnabled: true
  },
  timeBasedPreferences: {
    morningPreference: 'energetic',
    afternoonPreference: 'balanced',
    eveningPreference: 'calm',
    weekendPreference: 'creative'
  },
  emotionalPreferences: {
    happy: 80,
    calm: 75,
    energetic: 85,
    professional: 65,
    thoughtful: 60
  }
};

// Example learned patterns
const LEARNED_PATTERNS = [
  {
    name: 'Morning Flow',
    description: 'High-energy electronic beats with vibrant visuals',
    matchScore: 92,
    timeContext: 'Weekday Mornings',
    elements: ['Electronic', 'Fast-paced', 'Vibrant colors']
  },
  {
    name: 'Focus Session',
    description: 'Ambient sounds with minimal visual distractions',
    matchScore: 87,
    timeContext: 'Afternoons',
    elements: ['Ambient', 'Medium tempo', 'Muted colors']
  },
  {
    name: 'Evening Wind Down',
    description: 'Calm lofi beats with soothing visuals',
    matchScore: 90,
    timeContext: 'Evenings',
    elements: ['Lofi', 'Slow tempo', 'Pastel colors']
  }
];

interface MultiSensoryPreferenceManagerProps {
  className?: string;
}

export default function MultiSensoryPreferenceManager({ className = "" }: MultiSensoryPreferenceManagerProps) {
  const [preferences, setPreferences] = useState(SAMPLE_PREFERENCES);
  const [activeTab, setActiveTab] = useState('audio');
  const [currentLearning, setCurrentLearning] = useState(78);
  const { subscription } = useSubscription();
  
  // Check if user has premium subscription
  const isPremium = subscription && ['premium', 'platinum', 'business'].includes(subscription.plan);
  
  // Simulate learning progress
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLearning(prev => {
        const newValue = prev + Math.random() * 0.5;
        return newValue > 100 ? 78 : newValue;
      });
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Update audio preferences
  const handleAudioPreferenceChange = (key: string, value: number | boolean) => {
    setPreferences(prev => ({
      ...prev,
      audioPreferences: {
        ...prev.audioPreferences,
        [key]: value
      }
    }));
  };
  
  // Update visual preferences
  const handleVisualPreferenceChange = (key: string, value: number | boolean) => {
    setPreferences(prev => ({
      ...prev,
      visualPreferences: {
        ...prev.visualPreferences,
        [key]: value
      }
    }));
  };
  
  // Reset preferences
  const handleReset = () => {
    setPreferences(SAMPLE_PREFERENCES);
  };
  
  // Save preferences
  const handleSave = () => {
    // In a real app, this would save to backend
    console.log('Preferences saved:', preferences);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Multi-Sensory Preferences</h2>
          <p className="text-gray-500">Manage your personalized audio-visual experience</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          <Brain size={14} className="mr-1" />
          Learning Mode Active
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Preferences Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Preferences</CardTitle>
              <CardDescription>
                Customize how templates adapt to your preferences
              </CardDescription>
              
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-2">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-4">
                  <TabsTrigger value="audio">
                    <Music size={16} className="mr-1" />
                    Audio
                  </TabsTrigger>
                  <TabsTrigger value="visual">
                    <PaintBucket size={16} className="mr-1" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger value="timing" disabled={!isPremium}>
                    <Clock size={16} className="mr-1" />
                    Timing
                    {!isPremium && <span className="ml-1 text-xs">PRO</span>}
                  </TabsTrigger>
                  <TabsTrigger value="emotional" disabled={!isPremium}>
                    <Sparkles size={16} className="mr-1" />
                    Emotional
                    {!isPremium && <span className="ml-1 text-xs">PRO</span>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="audio" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Genre Preferences</h3>
                    <div className="space-y-4">
                      {Object.entries(preferences.audioPreferences.genrePreferences).map(([genre, value]) => (
                        <div key={genre} className="space-y-1">
                          <div className="flex justify-between">
                            <Label className="capitalize">{genre}</Label>
                            <span className="text-sm text-gray-500">{value}%</span>
                          </div>
                          <Slider 
                            value={[value]} 
                            max={100} 
                            step={1}
                            onValueChange={([newValue]) => {
                              setPreferences(prev => ({
                                ...prev,
                                audioPreferences: {
                                  ...prev.audioPreferences,
                                  genrePreferences: {
                                    ...prev.audioPreferences.genrePreferences,
                                    [genre]: newValue
                                  }
                                }
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Volume Preference</Label>
                      <span className="text-sm text-gray-500">{preferences.audioPreferences.volumePreference}%</span>
                    </div>
                    <Slider 
                      value={[preferences.audioPreferences.volumePreference]} 
                      max={100} 
                      step={1}
                      onValueChange={([newValue]) => handleAudioPreferenceChange('volumePreference', newValue)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Music Complexity</Label>
                      <span className="text-sm text-gray-500">{preferences.audioPreferences.musicComplexity}%</span>
                    </div>
                    <Slider 
                      value={[preferences.audioPreferences.musicComplexity]} 
                      max={100} 
                      step={1}
                      onValueChange={([newValue]) => handleAudioPreferenceChange('musicComplexity', newValue)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={preferences.audioPreferences.autoPlayEnabled}
                      onCheckedChange={(checked) => handleAudioPreferenceChange('autoPlayEnabled', checked)}
                    />
                    <Label>Auto-play music when templates load</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="visual" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Color Scheme Preferences</h3>
                    <div className="space-y-4">
                      {Object.entries(preferences.visualPreferences.colorSchemes).map(([scheme, value]) => (
                        <div key={scheme} className="space-y-1">
                          <div className="flex justify-between">
                            <Label className="capitalize">{scheme}</Label>
                            <span className="text-sm text-gray-500">{value}%</span>
                          </div>
                          <Slider 
                            value={[value]} 
                            max={100} 
                            step={1}
                            onValueChange={([newValue]) => {
                              setPreferences(prev => ({
                                ...prev,
                                visualPreferences: {
                                  ...prev.visualPreferences,
                                  colorSchemes: {
                                    ...prev.visualPreferences.colorSchemes,
                                    [scheme]: newValue
                                  }
                                }
                              }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Animation Intensity</Label>
                      <span className="text-sm text-gray-500">{preferences.visualPreferences.animationIntensity}%</span>
                    </div>
                    <Slider 
                      value={[preferences.visualPreferences.animationIntensity]} 
                      max={100} 
                      step={1}
                      onValueChange={([newValue]) => handleVisualPreferenceChange('animationIntensity', newValue)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Visual Complexity</Label>
                      <span className="text-sm text-gray-500">{preferences.visualPreferences.visualComplexity}%</span>
                    </div>
                    <Slider 
                      value={[preferences.visualPreferences.visualComplexity]} 
                      max={100} 
                      step={1}
                      onValueChange={([newValue]) => handleVisualPreferenceChange('visualComplexity', newValue)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={preferences.visualPreferences.beatSyncEnabled}
                      onCheckedChange={(checked) => handleVisualPreferenceChange('beatSyncEnabled', checked)}
                    />
                    <Label>Sync visual elements to audio beats</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="timing" className="mt-0">
                {isPremium ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Time-Based Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-blue-50 py-3">
                            <CardTitle className="text-base">Morning Preference</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <select
                              className="w-full p-2 border rounded"
                              value={preferences.timeBasedPreferences.morningPreference}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  timeBasedPreferences: {
                                    ...prev.timeBasedPreferences,
                                    morningPreference: e.target.value
                                  }
                                }));
                              }}
                            >
                              <option value="energetic">Energetic</option>
                              <option value="calm">Calm</option>
                              <option value="balanced">Balanced</option>
                              <option value="focused">Focused</option>
                              <option value="creative">Creative</option>
                            </select>
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-amber-50 py-3">
                            <CardTitle className="text-base">Afternoon Preference</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <select
                              className="w-full p-2 border rounded"
                              value={preferences.timeBasedPreferences.afternoonPreference}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  timeBasedPreferences: {
                                    ...prev.timeBasedPreferences,
                                    afternoonPreference: e.target.value
                                  }
                                }));
                              }}
                            >
                              <option value="energetic">Energetic</option>
                              <option value="calm">Calm</option>
                              <option value="balanced">Balanced</option>
                              <option value="focused">Focused</option>
                              <option value="creative">Creative</option>
                            </select>
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-purple-50 py-3">
                            <CardTitle className="text-base">Evening Preference</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <select
                              className="w-full p-2 border rounded"
                              value={preferences.timeBasedPreferences.eveningPreference}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  timeBasedPreferences: {
                                    ...prev.timeBasedPreferences,
                                    eveningPreference: e.target.value
                                  }
                                }));
                              }}
                            >
                              <option value="energetic">Energetic</option>
                              <option value="calm">Calm</option>
                              <option value="balanced">Balanced</option>
                              <option value="focused">Focused</option>
                              <option value="creative">Creative</option>
                            </select>
                          </CardContent>
                        </Card>
                        
                        <Card className="overflow-hidden">
                          <CardHeader className="bg-green-50 py-3">
                            <CardTitle className="text-base">Weekend Preference</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <select
                              className="w-full p-2 border rounded"
                              value={preferences.timeBasedPreferences.weekendPreference}
                              onChange={(e) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  timeBasedPreferences: {
                                    ...prev.timeBasedPreferences,
                                    weekendPreference: e.target.value
                                  }
                                }));
                              }}
                            >
                              <option value="energetic">Energetic</option>
                              <option value="calm">Calm</option>
                              <option value="balanced">Balanced</option>
                              <option value="focused">Focused</option>
                              <option value="creative">Creative</option>
                            </select>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border rounded-lg bg-amber-50 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock size={30} className="text-amber-800" />
                    </div>
                    <h3 className="text-lg font-medium text-amber-800 mb-2">Premium Feature</h3>
                    <p className="text-amber-700 mb-4 max-w-md mx-auto">
                      Upgrade to Premium to access time-based preferences that adapt your experience 
                      based on the time of day and your creative energy.
                    </p>
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="emotional" className="mt-0">
                {isPremium ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Emotional Tone Preferences</h3>
                      <div className="space-y-4">
                        {Object.entries(preferences.emotionalPreferences).map(([emotion, value]) => (
                          <div key={emotion} className="space-y-1">
                            <div className="flex justify-between">
                              <Label className="capitalize">{emotion}</Label>
                              <span className="text-sm text-gray-500">{value}%</span>
                            </div>
                            <Slider 
                              value={[value]} 
                              max={100} 
                              step={1}
                              onValueChange={([newValue]) => {
                                setPreferences(prev => ({
                                  ...prev,
                                  emotionalPreferences: {
                                    ...prev.emotionalPreferences,
                                    [emotion]: newValue
                                  }
                                }));
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start mb-3">
                        <Sparkles className="text-blue-500 mr-2 mt-1" size={18} />
                        <div>
                          <h4 className="font-medium text-blue-700">Emotional Intelligence</h4>
                          <p className="text-sm text-blue-600">
                            Our system learns from your interactions to better match content with your emotional preferences.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border rounded-lg bg-amber-50 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles size={30} className="text-amber-800" />
                    </div>
                    <h3 className="text-lg font-medium text-amber-800 mb-2">Premium Feature</h3>
                    <p className="text-amber-700 mb-4 max-w-md mx-auto">
                      Upgrade to Premium to access emotional tone preferences that match content 
                      to your preferred emotional states.
                    </p>
                    <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </TabsContent>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
              <Button onClick={handleSave}>
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Learning System Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="mr-2 text-blue-500" size={18} />
                Learning System
              </CardTitle>
              <CardDescription>
                Your preferences are continuously refined based on your interactions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Learning Progress</h3>
                <div className="space-y-2">
                  <Progress value={currentLearning} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Initial</span>
                    <span>{Math.round(currentLearning)}% Complete</span>
                    <span>Refined</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Detected Patterns</h3>
                <div className="space-y-3">
                  {LEARNED_PATTERNS.map((pattern, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                        <div className="font-medium">{pattern.name}</div>
                        <Badge className="bg-green-100 text-green-800">
                          {pattern.matchScore}% Match
                        </Badge>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm text-gray-600 mb-2">{pattern.description}</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">{pattern.timeContext}</span>
                          <div className="flex gap-1">
                            {pattern.elements.map((element, i) => (
                              <Badge key={i} variant="outline" className="text-xs py-0 h-5">
                                {element}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  <LineChart size={16} className="mr-2" />
                  View Detailed Analytics
                </Button>
                
                <Button variant="ghost" className="w-full text-gray-500">
                  Clear Learning Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 