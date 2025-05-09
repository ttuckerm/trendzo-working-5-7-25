'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw, Search, FileText, ChevronRight, Check, AlertTriangle, HelpCircle, Compass, Video, TrendingUp } from 'lucide-react';
import VideoPreview from './VideoPreview';
import TestRunner from './TestRunner';
import HelpGuide from './HelpGuide';
import AnalysisSummary from './AnalysisSummary';
import StoredTemplateList from './StoredTemplateList';
import TemplateVisualizer from './TemplateVisualizer';
import EngagementMetrics from './EngagementMetrics';

// Define interfaces for the data structures
interface TikTokVideo {
  id: string;
  text: string;
  createTime: number;
  authorMeta: {
    id: string;
    name: string;
    nickname: string;
    verified: boolean;
  };
  videoMeta?: {
    height: number;
    width: number;
    duration: number;
  };
  hashtags?: string[];
  stats: {
    commentCount: number;
    diggCount: number;
    playCount: number;
    shareCount: number;
  };
  webVideoUrl?: string;
}

interface VideoAnalysis {
  templateCategory: string;
  templateStructure: {
    sections: Array<{
      type: string;
      timing: string;
      description: string;
    }>;
  };
  viralPotential: number;
  similarTemplates: Array<{
    id: string;
    similarityScore: number;
    category: string;
  }>;
  keyMetrics: {
    engagementRate: number;
    completionRate: number;
    shareability: number;
  };
  analysisConfidence: number;
  templateNotes: string;
  videoId?: string;
  videoText?: string;
}

// Add interface for storage info
interface StorageInfo {
  success: boolean;
  templateId: string | null;
  error: string | null;
}

// Global error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Add global unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setErrorMessage(event.reason?.message || 'An unexpected error occurred');
      event.preventDefault(); // Prevent the default handler
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-medium text-red-600 mb-2 flex items-center">
          <AlertTriangle className="mr-2" size={20} />
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Reload Page
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export default function TemplateAnalyzerPage() {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [numVideos, setNumVideos] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'analyzer' | 'templates'>('analyzer');

  // Fetch videos from the API
  const fetchVideos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/etl/fetch-videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxItems: numVideos }),
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching videos: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.videos && Array.isArray(data.videos)) {
        setVideos(data.videos);
        setSelectedVideo(null);
        setAnalysis(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze a selected video
  const analyzeVideo = async (video: TikTokVideo) => {
    setIsAnalyzing(true);
    setError(null);
    setStorageInfo(null);
    
    try {
      const response = await fetch('/api/etl/analyze-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video }),
      });
      
      if (!response.ok) {
        throw new Error(`Error analyzing video: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.analysis) {
        setAnalysis(data.analysis);
        // Store the Firebase storage info
        if (data.storage) {
          setStorageInfo(data.storage);
        }
        console.log('Analysis source:', data.source);
        console.log('Storage info:', data.storage);
      } else {
        throw new Error('Invalid analysis response format');
      }
    } catch (err) {
      console.error('Error analyzing video:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">TikTok Template Analyzer</h1>
            <p className="text-gray-500">Analyze trending content to identify viral template patterns</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowHelp(!showHelp)}
              variant="outline"
              className="flex items-center"
            >
              <HelpCircle size={16} className="mr-2" />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </Button>
          </div>
        </div>

        {showHelp && <HelpGuide />}

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'analyzer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Compass size={16} className="mr-2 inline-block" /> 
            Video Analyzer
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'templates'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp size={16} className="mr-2 inline-block" />
            Stored Templates
          </button>
        </div>

        {activeTab === 'analyzer' ? (
          <>
            {/* Template Analyzer UI */}
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Fetch TikTok Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="numVideos" className="block text-sm text-gray-700 mb-1">
                      Number of videos to fetch:
                    </Label>
                    <Input
                      id="numVideos"
                      type="number"
                      min="1"
                      max="20"
                      value={numVideos}
                      onChange={(e) => setNumVideos(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Button
                      onClick={() => fetchVideos()}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-4 w-4" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Video className="mr-2 h-4 w-4" />
                          Fetch Videos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                <p>{error}</p>
              </div>
            )}

            {videos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 2: Select a Video to Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className={`transition hover:shadow-md bg-white border rounded-md p-4 cursor-pointer ${
                          selectedVideo?.id === video.id 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <h3 className="font-medium text-gray-800 line-clamp-2 mb-2">{video.text}</h3>
                        <div className="text-sm text-gray-600">
                          <p>Author: {video.authorMeta.nickname}</p>
                          <div className="flex space-x-4 mt-1">
                            <span>{video.stats.playCount.toLocaleString()} views</span>
                            <span>{video.stats.diggCount.toLocaleString()} likes</span>
                          </div>
                        </div>
                        {selectedVideo?.id === video.id && (
                          <div className="mt-3">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeVideo(video);
                              }}
                              disabled={isAnalyzing}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                  Analyzing...
                                </>
                              ) : (
                                'Analyze Template'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedVideo && (
              <Card>
                <CardHeader>
                  <CardTitle>Step 3: Preview & Analyze</CardTitle>
                </CardHeader>
                <CardContent>
                  <VideoPreview video={selectedVideo} />
                </CardContent>
              </Card>
            )}

            {/* Analysis Results - shown when analysis is available */}
            {analysis && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Analysis Results</CardTitle>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {analysis.analysisConfidence ? `${(analysis.analysisConfidence * 100).toFixed(1)}% confidence` : 'AI Analysis'}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-lg text-gray-800">{analysis.templateCategory || 'Uncategorized'}</h3>
                      </div>
                      {analysis.templateNotes && (
                        <p className="text-sm text-gray-600 mt-2">{analysis.templateNotes}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Template Visualizer */}
                      {analysis.templateStructure && analysis.templateStructure.sections && selectedVideo?.videoMeta?.duration && (
                        <TemplateVisualizer 
                          sections={analysis.templateStructure.sections.map((section, index) => ({
                            id: `section-${index}`,
                            type: section.type,
                            startTime: parseInt(section.timing.split('-')[0]),
                            duration: parseInt(section.timing.split('-')[1]) - parseInt(section.timing.split('-')[0]),
                            textOverlays: [],
                            hashtags: [],
                            contentDescription: section.description
                          }))} 
                          duration={selectedVideo.videoMeta.duration} 
                        />
                      )}
                      
                      {/* Engagement Metrics */}
                      <EngagementMetrics 
                        metrics={{
                          engagementRate: analysis.keyMetrics?.engagementRate || 0,
                          completionRate: (analysis.keyMetrics?.completionRate || 0) * 100,
                          shareability: analysis.keyMetrics?.shareability || 0,
                          viralScore: analysis.viralPotential || 0
                        }}
                        insights={analysis.templateNotes}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Use the existing AnalysisSummary component */}
                <AnalysisSummary analysis={analysis} />
              </div>
            )}

            {/* Firebase Storage Status */}
            {storageInfo && (
              <Card className={storageInfo.success ? 'border-green-200' : 'border-yellow-200'}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-2">
                    {storageInfo.success ? 'Template Stored in Firebase' : 'Firebase Storage Status'}
                  </h3>
                  
                  {storageInfo.success ? (
                    <div className="space-y-2">
                      <p className="text-green-600 flex items-center">
                        <Check className="h-5 w-5 mr-2" />
                        Analysis successfully stored in Firebase
                      </p>
                      <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Template ID:</span> {storageInfo.templateId}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          You can view this template in Firebase Console under the <code className="bg-gray-100 px-1 py-0.5 rounded">templates</code> collection.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-yellow-600 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Failed to store template in Firebase
                      </p>
                      {storageInfo.error && (
                        <div className="p-3 rounded-md bg-gray-50 border border-gray-200">
                          <p className="text-sm text-red-500">
                            <span className="font-medium">Error:</span> {storageInfo.error}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add the TestRunner component */}
            <TestRunner />
          </>
        ) : (
          /* Stored Templates Tab */
          <StoredTemplateList />
        )}
      </div>
    </ErrorBoundary>
  );
} 