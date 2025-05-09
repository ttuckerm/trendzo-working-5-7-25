'use client';

import { useState } from 'react';
import { Video, BarChart2, TrendingUp, Search, ArrowRight, Lock } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label } from '@/components/ui/ui-compatibility';
import LoadingFallback from '@/components/ui/LoadingFallback';
import PremiumFeatureGate from '@/components/ui/PremiumFeatureGate';
import { useSubscription } from '@/lib/contexts/SubscriptionContext';

/**
 * Video Analyzer Tools Page
 * This page provides tools for analyzing TikTok videos and discovering trends
 * Some features require premium subscription
 */
export default function VideoAnalyzerTools() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTrendSearching, setIsTrendSearching] = useState(false);
  const { tier, hasPremium } = useSubscription();
  
  // Handle video URL analysis
  const handleAnalyzeUrl = () => {
    if (!videoUrl) return;
    
    // Set analyzing state
    setIsAnalyzing(true);
    
    // Simulate analysis delay for development
    setTimeout(() => {
      setIsAnalyzing(false);
      // In a real implementation, we would navigate to the results page
      window.location.href = `/dashboard-view/video-analyzer/results?url=${encodeURIComponent(videoUrl)}`;
    }, 2000);
  };
  
  // Handle trend discovery
  const handleDiscoverTrending = () => {
    setIsTrendSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      setIsTrendSearching(false);
      window.location.href = '/dashboard-view/video-analyzer/trends';
    }, 2000);
  };
  
  if (isAnalyzing) {
    return (
      <LoadingFallback 
        loadingMessage="Analyzing video..." 
        fallbackMessage="Video analysis is taking longer than expected."
        timeoutMs={10000}
      />
    );
  }
  
  if (isTrendSearching) {
    return (
      <LoadingFallback 
        loadingMessage="Discovering trending videos..." 
        fallbackMessage="Trend discovery is taking longer than expected."
        timeoutMs={10000}
      />
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Video Analyzer Tools</h1>
            <div className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
              <span>{tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</span>
              {!hasPremium && (
                <Button variant="link" className="text-xs ml-1 text-yellow-800" onClick={() => window.location.href = '/pricing'}>
                  Upgrade <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-gray-500">
            Analyze TikTok videos to extract template structures, effects, and audience engagement patterns.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video URL Analyzer Card */}
          <PremiumFeatureGate
            featureName="Video Analysis"
            description="Analyze any TikTok video to extract its template structure, timing, and visual elements."
            requiredTier="premium"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Analyze Video
                </CardTitle>
                <CardDescription>
                  Extract template structure from any TikTok video URL
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">TikTok Video URL</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://www.tiktok.com/@username/video/1234567890"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      What you'll get:
                    </p>
                    <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                      <li>Full template structure breakdown</li>
                      <li>Section timing analysis</li>
                      <li>Audio synchronization patterns</li>
                      <li>Visual effect identification</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAnalyzeUrl}
                  disabled={!videoUrl}
                  className="w-full"
                >
                  Analyze Video
                </Button>
              </CardFooter>
            </Card>
          </PremiumFeatureGate>
          
          {/* Trend Discovery Card */}
          <PremiumFeatureGate
            featureName="Trend Discovery"
            description="Find currently trending videos and templates before they go viral."
            requiredTier="premium"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Discover Trends
                </CardTitle>
                <CardDescription>
                  Find currently trending videos and templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-100 text-blue-800">Trending Today</Badge>
                    <Badge className="bg-purple-100 text-purple-800">Rising Templates</Badge>
                    <Badge className="bg-green-100 text-green-800">High Engagement</Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">Viral Potential</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      Our algorithm analyzes thousands of videos daily to identify patterns in:
                    </p>
                    <ul className="text-sm text-gray-500 list-disc pl-5 space-y-1">
                      <li>Growth velocity and acceleration</li>
                      <li>Engagement rate patterns</li>
                      <li>Creator adoption rates</li>
                      <li>Cross-category template usage</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleDiscoverTrending}
                  className="w-full"
                >
                  Discover Trending Videos
                </Button>
              </CardFooter>
            </Card>
          </PremiumFeatureGate>
        </div>
        
        {/* Free Feature Card */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Search className="h-5 w-5" />
              Available on Free Plan
            </CardTitle>
            <CardDescription className="text-green-700">
              Features available to all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium mb-2 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-green-600" />
                  Basic Template Search
                </h3>
                <p className="text-sm text-gray-600">
                  Access our database of pre-analyzed templates and search by category or keyword.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => window.location.href = '/templates'}
                >
                  Browse Templates
                </Button>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-medium mb-2 flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2 text-green-600" />
                  Engagement Statistics
                </h3>
                <p className="text-sm text-gray-600">
                  View basic engagement metrics and statistics for popular templates.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={() => window.location.href = '/dashboard-view'}
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Recent Analysis
            </CardTitle>
            <CardDescription>
              Your recently analyzed videos and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium">No Recent Analysis</h3>
              <p className="text-gray-500 max-w-md mx-auto mt-1">
                Your recently analyzed videos will appear here. Start by analyzing a video or discovering trends.
              </p>
              {!hasPremium && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 text-sm bg-gray-100 text-gray-700 py-1 px-3 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Upgrade to Premium to unlock analysis features</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 