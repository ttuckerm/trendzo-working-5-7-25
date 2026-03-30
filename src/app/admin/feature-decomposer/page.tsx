'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, FileVideo, Mic, Image, Clock, Database } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';

export default function FeatureDecomposerPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [rawVideos, setRawVideos] = useState<any[]>([]);
  const [processedVideos, setProcessedVideos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadRawVideos();
    loadProcessedVideos();
    loadStats();
  }, []);

  const loadRawVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('raw_videos')
        .select('*')
        .not('saved_filepath', 'eq', '')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRawVideos(data || []);
    } catch (err) {
      console.error('Error loading raw videos:', err);
    }
  };

  const loadProcessedVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('video_features')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProcessedVideos(data || []);
    } catch (err) {
      console.error('Error loading processed videos:', err);
    }
  };

  const loadStats = async () => {
    try {
      const [rawResult, processedResult] = await Promise.all([
        supabaseClient.from('raw_videos').select('id, created_at'),
        supabaseClient.from('video_features').select('id, duration_sec, created_at')
      ]);

      const totalRaw = rawResult.data?.length || 0;
      const totalProcessed = processedResult.data?.length || 0;
      const todayProcessed = processedResult.data?.filter(v => 
        new Date(v.created_at).toDateString() === new Date().toDateString()
      ).length || 0;
      
      const avgDuration = processedResult.data?.length > 0 
        ? (processedResult.data.reduce((sum, v) => sum + (v.duration_sec || 0), 0) / processedResult.data.length).toFixed(1)
        : '0';

      setStats({
        totalRaw,
        totalProcessed,
        todayProcessed,
        avgDuration,
        processingRate: totalRaw > 0 ? ((totalProcessed / totalRaw) * 100).toFixed(1) : '0'
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const processVideo = async () => {
    if (!selectedVideo) {
      setError('Please select a video to process');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/run-feature-decomposer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: selectedVideo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process video');
      }

      const data = await response.json();
      setResult(data);
      
      // Reload processed videos and stats
      await loadProcessedVideos();
      await loadStats();
      
    } catch (err: any) {
      console.error('Error processing video:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testWithSampleVideo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-modules');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test failed');
      }

      const data = await response.json();
      setResult(data);
      
      // Reload data
      await loadProcessedVideos();
      await loadStats();
      
    } catch (err: any) {
      console.error('Error testing with sample video:', err);
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FeatureDecomposer Dashboard</h1>
        <p className="text-gray-600">Process videos into frames, audio, OCR text, and transcripts</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Videos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRaw || 0}</div>
            <p className="text-xs text-muted-foreground">Available for processing</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.processingRate || 0}% completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayProcessed || 0}</div>
            <p className="text-xs text-muted-foreground">Videos processed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgDuration || 0}s</div>
            <p className="text-xs text-muted-foreground">Average video length</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="process" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="process">Process Video</TabsTrigger>
          <TabsTrigger value="processed">Processed Videos</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Process Raw Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Video to Process
                  </label>
                  <select
                    value={selectedVideo}
                    onChange={(e) => setSelectedVideo(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a video...</option>
                    {rawVideos.map((video) => (
                      <option key={video.id} value={video.id}>
                        {video.id} - {video.caption?.substring(0, 50) || 'No caption'}...
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Only videos with downloaded files can be processed
                  </p>
                </div>

                <Button
                  onClick={processVideo}
                  disabled={loading || !selectedVideo}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Process Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test with Sample Video</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test the FeatureDecomposer with the built-in sample video. This will:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Extract frames every 0.5 seconds</li>
                  <li>• Convert audio to 16kHz mono WAV</li>
                  <li>• Perform OCR on all frames</li>
                  <li>• Transcribe audio using OpenAI Whisper</li>
                  <li>• Store results in Supabase</li>
                </ul>

                <Button
                  onClick={testWithSampleVideo}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <FileVideo className="w-4 h-4 mr-2" />
                      Test with Sample Video
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                  <XCircle className="inline-block w-4 h-4 mr-2" />
                  {error}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="p-4 bg-green-50 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div className="w-full">
                      <p className="font-medium">Processing Completed Successfully</p>
                      {result.tests && (
                        <div className="mt-2 text-sm space-y-1">
                          <p><span className="font-medium">Video exists:</span> {result.tests.videoExists ? '✅' : '❌'}</p>
                          <p><span className="font-medium">Feature decomposer:</span> {result.tests.featureDecomposerWorking ? '✅' : '❌'}</p>
                          <p><span className="font-medium">Apify scraper:</span> {result.tests.apifyScraperImported ? '✅' : '❌'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="processed">
          <Card>
            <CardHeader>
              <CardTitle>Recently Processed Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {processedVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No videos processed yet</p>
              ) : (
                <div className="space-y-4">
                  {processedVideos.map((video) => (
                    <div key={video.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Video ID: {video.id}</p>
                          <p className="text-sm text-gray-500">Duration: {video.duration_sec}s</p>
                        </div>
                        <Badge variant="default">Processed</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
                        <div className="flex items-center">
                          <Image className="w-4 h-4 mr-2" />
                          <span>Frames: {video.frames_path ? '✅' : '❌'}</span>
                        </div>
                        <div className="flex items-center">
                          <Mic className="w-4 h-4 mr-2" />
                          <span>Audio: {video.audio_path ? '✅' : '❌'}</span>
                        </div>
                        <div className="flex items-center">
                          <FileVideo className="w-4 h-4 mr-2" />
                          <span>OCR: {video.ocr_text ? '✅' : '❌'}</span>
                        </div>
                      </div>
                      
                      {video.ocr_text && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>OCR Text:</strong> {video.ocr_text.substring(0, 200)}...
                        </div>
                      )}
                      
                      {video.transcript && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <strong>Transcript:</strong> {video.transcript.substring(0, 200)}...
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-2">
                        Processed: {new Date(video.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">FFmpeg</p>
                    <p className="text-sm text-gray-500">Video processing engine</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tesseract.js</p>
                    <p className="text-sm text-gray-500">OCR text extraction</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">OpenAI Whisper</p>
                    <p className="text-sm text-gray-500">Speech-to-text transcription</p>
                  </div>
                  <Badge variant={process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'default' : 'secondary'}>
                    {process.env.NEXT_PUBLIC_OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'Ready' : 'API Key Needed'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Supabase Database</p>
                    <p className="text-sm text-gray-500">Feature storage database</p>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Data Directories</p>
                    <p className="text-sm text-gray-500">/data/frames, /data/audio</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}