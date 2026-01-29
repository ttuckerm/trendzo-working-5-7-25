'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card-component';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Search, 
  ArrowRight, 
  Play, 
  ChevronRight,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface VideoDetails {
  id: string;
  title: string;
  author: {
    name: string;
    username: string;
    verified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  category: string;
  metrics: {
    viralPotential: number;
    engagementRate: number;
    completionRate: number;
    shareability: number;
  };
  templateStructure: {
    hook: {
      description: string;
      duration: string;
    };
    introduction: {
      description: string;
      duration: string;
    };
    steps: {
      number: number;
      description: string;
      duration: string;
    }[];
    callToAction: {
      description: string;
      duration: string;
    };
  };
  similarTemplates: {
    id: string;
    title: string;
    views: number;
    engagement: number;
    matchPercentage: number;
  }[];
  notes: string;
}

export default function VideoAnalyzerPage() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [numVideos, setNumVideos] = useState<number>(5);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'search' | 'analysis'>('search');
  const [selectedVideo, setSelectedVideo] = useState<VideoDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch videos function
  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be a real API call in production
      setTimeout(() => {
        setIsLoading(false);
        // After "fetching", show the analysis directly with mock data
        handleAnalyzeVideo();
      }, 1500);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to fetch videos. Please try again.');
      setIsLoading(false);
    }
  };

  // Analyze video function
  const handleAnalyzeVideo = () => {
    setIsAnalyzing(true);
    
    // In a real app, this would be an API call with the selected video
    setTimeout(() => {
      setSelectedVideo(getMockVideoDetails());
      setIsAnalyzing(false);
      setActiveTab('analysis');
    }, 1000);
  };

  // Reset function to go back to search
  const resetAnalysis = () => {
    setActiveTab('search');
    setSelectedVideo(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Analyzer</h1>
        <p className="text-gray-500">
          Analyze TikTok videos to understand their structure and engagement patterns
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'search' | 'analysis')}>
        <TabsList className="mb-6">
          <TabsTrigger value="search" onClick={resetAnalysis}>
            <Search className="mr-2 h-4 w-4" />
            Search Videos
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!selectedVideo}>
            <div className="flex items-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
              Analysis
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search TikTok Videos</CardTitle>
              <CardDescription>
                Find trending videos to analyze their template structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of videos to fetch
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={numVideos}
                      onChange={(e) => setNumVideos(parseInt(e.target.value) || 5)}
                    />
                  </div>
                  <Button
                    onClick={fetchVideos}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Fetch Videos
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis">
          {isAnalyzing ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
                <p className="mt-4">Analyzing video structure...</p>
              </div>
            </div>
          ) : selectedVideo ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <Button variant="outline" className="flex items-center gap-2" onClick={resetAnalysis}>
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Search</span>
                </Button>
              </div>
              
              {/* Video Details Section */}
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedVideo.title}</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">@{selectedVideo.author.username}</span>
                        {selectedVideo.author.verified && (
                          <Badge className="bg-blue-500">Verified</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-xl font-bold">{selectedVideo.stats.views.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{selectedVideo.stats.likes.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{selectedVideo.stats.comments.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold">{selectedVideo.stats.shares.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Shares</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Template Structure */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Template Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Hook */}
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-blue-600">Hook</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {selectedVideo.templateStructure.hook.duration}
                            </Badge>
                          </div>
                          <p className="text-gray-700">{selectedVideo.templateStructure.hook.description}</p>
                        </div>
                        
                        {/* Introduction */}
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-blue-600">Introduction</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {selectedVideo.templateStructure.introduction.duration}
                            </Badge>
                          </div>
                          <p className="text-gray-700">{selectedVideo.templateStructure.introduction.description}</p>
                        </div>
                        
                        {/* Steps */}
                        {selectedVideo.templateStructure.steps.map((step, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <div className="flex justify-between mb-2">
                              <h3 className="font-semibold text-blue-600">Step {step.number}</h3>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {step.duration}
                              </Badge>
                            </div>
                            <p className="text-gray-700">{step.description}</p>
                          </div>
                        ))}
                        
                        {/* Call to Action */}
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between mb-2">
                            <h3 className="font-semibold text-blue-600">Call to Action</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {selectedVideo.templateStructure.callToAction.duration}
                            </Badge>
                          </div>
                          <p className="text-gray-700">{selectedVideo.templateStructure.callToAction.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Similar Templates */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Similar Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedVideo.similarTemplates.map((template, index) => (
                          <div key={index} className="flex items-center justify-between border-b last:border-0 py-3">
                            <div className="flex items-center">
                              <h3 className="font-medium">{template.title}</h3>
                            </div>
                            <div className="flex items-center">
                              <Badge className="mr-2">{template.matchPercentage}% match</Badge>
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Video Metrics */}
                <div>
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Video Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Template Category</span>
                          </div>
                          <div className="mt-2">
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              {selectedVideo.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Viral Potential</span>
                            <span className="text-sm font-medium">{selectedVideo.metrics.viralPotential.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedVideo.metrics.viralPotential * 10}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Engagement Rate</span>
                            <span className="text-sm font-medium text-blue-600">{selectedVideo.metrics.engagementRate.toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Completion Rate</span>
                            <span className="text-sm font-medium text-green-600">{selectedVideo.metrics.completionRate.toFixed(1)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Shareability</span>
                            <span className="text-sm font-medium">{selectedVideo.metrics.shareability.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${selectedVideo.metrics.shareability * 10}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Template Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Template Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedVideo.notes}</p>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">Analysis Confidence: 89%</span>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg> 
                          Export Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="mt-6">
                    <Button className="w-full" onClick={() => window.location.reload()}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                      Analyze Another Video
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400">
                    <path d="M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z" />
                    <path d="M9 10v4h4" />
                    <path d="M9 14h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">No Video Selected</h3>
                <p className="text-gray-500 mb-6">Please search for and select a video to analyze.</p>
                <Button onClick={() => setActiveTab('search')}>
                  <Search className="mr-2 h-4 w-4" />
                  Search Videos
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Mock data function
function getMockVideoDetails(): VideoDetails {
  return {
    id: 'video123',
    title: 'Let me show you how to make the most delicious pasta 🍝 #foodtiktok #cooking',
    author: {
      name: 'Chef Daniela',
      username: 'chef_daniela',
      verified: true
    },
    stats: {
      views: 358900,
      likes: 24800,
      comments: 1300,
      shares: 3900
    },
    category: 'Tutorial',
    metrics: {
      viralPotential: 8.5,
      engagementRate: 9.2,
      completionRate: 76.0,
      shareability: 8.7
    },
    templateStructure: {
      hook: {
        description: 'Quick attention-grabbing introduction with promise of value',
        duration: '0-5s'
      },
      introduction: {
        description: 'Presenter explains what viewers will learn',
        duration: '5-15s'
      },
      steps: [
        {
          number: 1,
          description: 'First key point or action demonstrated',
          duration: '15-30s'
        },
        {
          number: 2,
          description: 'Second key point or action demonstrated',
          duration: '30-45s'
        }
      ],
      callToAction: {
        description: 'Request for engagement and promise of more content',
        duration: '45-60s'
      }
    },
    similarTemplates: [
      {
        id: 'template-123',
        title: 'How-To Template',
        views: 12000,
        engagement: 7.8,
        matchPercentage: 87
      },
      {
        id: 'template-456',
        title: 'Educational Template',
        views: 8400,
        engagement: 6.2,
        matchPercentage: 74
      }
    ],
    notes: 'This is a highly effective educational format that follows a proven step-by-step structure. The quick hook and clear value proposition contribute to high retention rates.'
  };
} 