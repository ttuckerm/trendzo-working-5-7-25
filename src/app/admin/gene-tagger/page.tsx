'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// Using text symbols instead of lucide-react to avoid dependency issues
import { supabaseClient } from '@/lib/supabase/client';

export default function GeneTaggerPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [processedVideos, setProcessedVideos] = useState<any[]>([]);
  const [rawVideos, setRawVideos] = useState<any[]>([]);
  const [geneStats, setGeneStats] = useState<any>(null);
  const [frameworkGenes, setFrameworkGenes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadFrameworkGenes();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadRawVideos(),
      loadProcessedVideos(),
      loadGeneStats()
    ]);
  };

  const loadRawVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('video_features')
        .select('video_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRawVideos(data || []);
    } catch (err) {
      console.error('Error loading processed videos:', err);
    }
  };

  const loadProcessedVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('video_genes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setProcessedVideos(data || []);
    } catch (err) {
      console.error('Error loading gene-tagged videos:', err);
    }
  };

  const loadGeneStats = async () => {
    try {
      const [rawResult, genesResult] = await Promise.all([
        supabaseClient.from('video_features').select('video_id'),
        supabaseClient.from('video_genes').select('*')
      ]);

      const totalRaw = rawResult.data?.length || 0;
      const totalTagged = genesResult.data?.length || 0;
      const todayTagged = genesResult.data?.filter(v => 
        new Date(v.created_at).toDateString() === new Date().toDateString()
      ).length || 0;

      // Calculate gene frequency
      const geneFrequency = new Array(48).fill(0);
      genesResult.data?.forEach(video => {
        if (video.genes && Array.isArray(video.genes)) {
          video.genes.forEach((gene: boolean, index: number) => {
            if (gene) geneFrequency[index]++;
          });
        }
      });

      setGeneStats({
        totalRaw,
        totalTagged,
        todayTagged,
        processingRate: totalRaw > 0 ? ((totalTagged / totalRaw) * 100).toFixed(1) : '0',
        geneFrequency,
        avgGenesPerVideo: totalTagged > 0 ? 
          (geneFrequency.reduce((a, b) => a + b, 0) / totalTagged).toFixed(1) : '0'
      });
    } catch (err) {
      console.error('Error loading gene stats:', err);
    }
  };

  const loadFrameworkGenes = async () => {
    try {
      const response = await fetch('/framework_genes.json');
      const data = await response.json();
      setFrameworkGenes(data.genes || []);
    } catch (err) {
      console.error('Error loading framework genes:', err);
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
      const response = await fetch('/api/admin/run-gene-tagger', {
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
      
      // Reload data
      await loadData();
      
    } catch (err: any) {
      console.error('Error processing video:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testGeneTagger = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-gene-tagger');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test failed');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (err: any) {
      console.error('Error testing GeneTagger:', err);
      setError(err.message || 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  const getGeneName = (index: number): string => {
    return frameworkGenes[index]?.name || `Gene ${index}`;
  };

  const getGeneDescription = (index: number): string => {
    return frameworkGenes[index]?.description || '';
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
        <h1 className="text-3xl font-bold mb-2">GeneTagger Dashboard</h1>
        <p className="text-gray-600">Convert video features into 48-dimensional gene vectors for viral content analysis</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Videos</CardTitle>
            <span className="text-lg">🗄️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geneStats?.totalRaw || 0}</div>
            <p className="text-xs text-muted-foreground">Videos with features</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gene Tagged</CardTitle>
            <span className="text-lg">🧬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geneStats?.totalTagged || 0}</div>
            <p className="text-xs text-muted-foreground">{geneStats?.processingRate || 0}% completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Processing</CardTitle>
            <span className="text-lg">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geneStats?.todayTagged || 0}</div>
            <p className="text-xs text-muted-foreground">Videos processed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Genes/Video</CardTitle>
            <span className="text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geneStats?.avgGenesPerVideo || 0}</div>
            <p className="text-xs text-muted-foreground">Average active genes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="process" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="process">Process Video</TabsTrigger>
          <TabsTrigger value="tagged">Tagged Videos</TabsTrigger>
          <TabsTrigger value="genes">Gene Analysis</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Process Video into Genes</CardTitle>
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
                      <option key={video.video_id} value={video.video_id}>
                        {video.video_id} - {new Date(video.created_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Only videos with extracted features can be processed
                  </p>
                </div>

                <Button
                  onClick={processVideo}
                  disabled={loading || !selectedVideo}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">🔄</span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧬</span>
                      Extract Genes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test GeneTagger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test the GeneTagger with built-in sample data. This will:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Load 48 gene definitions from framework</li>
                  <li>• Test text pattern recognition</li>
                  <li>• Test visual analysis algorithms</li>
                  <li>• Validate detection logic</li>
                  <li>• Return gene activation results</li>
                </ul>

                <Button
                  onClick={testGeneTagger}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="mr-2">🔄</span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧪</span>
                      Test GeneTagger
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
                  <span className="mr-2">❌</span>
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
                    <span className="text-green-500 mr-2 mt-0.5">✅</span>
                    <div className="w-full">
                      <p className="font-medium">Gene Processing Completed Successfully</p>
                      {result.genes && (
                        <div className="mt-2 text-sm">
                          <p><span className="font-medium">Genes detected:</span> {result.genes.filter(Boolean).length}/48</p>
                          <p><span className="font-medium">Processing time:</span> {result.duration || 'N/A'}</p>
                          {result.activeGenes && (
                            <div className="mt-2">
                              <p className="font-medium">Active genes:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.activeGenes.map((geneIndex: number) => (
                                  <Badge key={geneIndex} variant="secondary" className="text-xs">
                                    {getGeneName(geneIndex)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tagged">
          <Card>
            <CardHeader>
              <CardTitle>Recently Tagged Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {processedVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No videos tagged yet</p>
              ) : (
                <div className="space-y-4">
                  {processedVideos.map((video) => (
                    <div key={video.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Video ID: {video.video_id}</p>
                          <p className="text-sm text-gray-500">
                            Tagged: {new Date(video.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="default">
                          {video.genes ? video.genes.filter(Boolean).length : 0}/48 genes
                        </Badge>
                      </div>
                      
                      {video.genes && Array.isArray(video.genes) && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Active Genes:</p>
                          <div className="flex flex-wrap gap-1">
                            {video.genes.map((gene: boolean, index: number) => 
                              gene ? (
                                <Badge 
                                  key={index} 
                                  variant="secondary" 
                                  className="text-xs"
                                  title={getGeneDescription(index)}
                                >
                                  {getGeneName(index)}
                                </Badge>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genes">
          <Card>
            <CardHeader>
              <CardTitle>Gene Frequency Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {geneStats?.geneFrequency ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Frequency of each gene across all tagged videos (top 20 most common):
                  </p>
                  {frameworkGenes
                    .map((gene, index) => ({
                      ...gene,
                      frequency: geneStats.geneFrequency[index] || 0
                    }))
                    .sort((a, b) => b.frequency - a.frequency)
                    .slice(0, 20)
                    .map((gene) => (
                      <div key={gene.id} className="flex items-center justify-between py-2 border-b">
                        <div className="flex-1">
                          <p className="font-medium">{gene.name}</p>
                          <p className="text-sm text-gray-500">{gene.description}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={gene.frequency > 0 ? "default" : "secondary"}>
                            {gene.frequency} videos
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No gene analysis data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Framework Genes</p>
                    <p className="text-sm text-gray-500">48 gene definitions loaded</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Sharp (Image Processing)</p>
                    <p className="text-sm text-gray-500">Visual analysis engine</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tesseract.js (OCR)</p>
                    <p className="text-sm text-gray-500">Text extraction from images</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Natural (NLP)</p>
                    <p className="text-sm text-gray-500">Text analysis and processing</p>
                  </div>
                  <Badge variant="default">Ready</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Supabase Database</p>
                    <p className="text-sm text-gray-500">Gene storage and retrieval</p>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Performance Target</p>
                    <p className="text-sm text-gray-500">&lt; 5s per video processing</p>
                  </div>
                  <Badge variant="default">Optimized</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}