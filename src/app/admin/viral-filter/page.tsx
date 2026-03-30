'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabaseClient } from '@/lib/supabase/client';

export default function ViralFilterPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [filterRuns, setFilterRuns] = useState<any[]>([]);
  const [viralVideos, setViralVideos] = useState<any[]>([]);
  const [negativeVideos, setNegativeVideos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadFilterRuns(),
      loadViralVideos(),
      loadNegativeVideos(),
      loadStats()
    ]);
  };

  const loadFilterRuns = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('viral_filter_runs')
        .select('*')
        .order('run_timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setFilterRuns(data || []);
    } catch (err) {
      console.error('Error loading filter runs:', err);
    }
  };

  const loadViralVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('viral_pool')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setViralVideos(data || []);
    } catch (err) {
      console.error('Error loading viral videos:', err);
    }
  };

  const loadNegativeVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('negative_pool')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNegativeVideos(data || []);
    } catch (err) {
      console.error('Error loading negative videos:', err);
    }
  };

  const loadStats = async () => {
    try {
      const [viralResult, negativeResult, runsResult] = await Promise.all([
        supabaseClient.from('viral_pool').select('video_id'),
        supabaseClient.from('negative_pool').select('video_id'),
        supabaseClient.from('viral_filter_runs').select('*').order('run_timestamp', { ascending: false }).limit(1)
      ]);

      const totalViral = viralResult.data?.length || 0;
      const totalNegative = negativeResult.data?.length || 0;
      const lastRun = runsResult.data?.[0];
      const todayRuns = filterRuns.filter(run => 
        new Date(run.run_timestamp).toDateString() === new Date().toDateString()
      ).length;

      setStats({
        totalViral,
        totalNegative,
        lastRun,
        todayRuns,
        successRate: filterRuns.length > 0 ? 
          (filterRuns.filter(r => r.status === 'completed').length / filterRuns.length * 100).toFixed(1) : '0'
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const runViralFilter = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/run-viral-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run viral filter');
      }

      const data = await response.json();
      setResult(data);
      
      // Reload data
      await loadData();
      
    } catch (err: any) {
      console.error('Error running viral filter:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testViralFilter = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/test-viral-filter');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Test failed');
      }

      const data = await response.json();
      setResult(data);
      
    } catch (err: any) {
      console.error('Error testing viral filter:', err);
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
        <h1 className="text-3xl font-bold mb-2">ViralFilter Dashboard</h1>
        <p className="text-gray-600">Applies DPS top-5% rule to identify viral candidates and balanced negative samples</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viral Pool</CardTitle>
            <span className="text-lg">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViral || 0}</div>
            <p className="text-xs text-muted-foreground">Top 5% candidates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Pool</CardTitle>
            <span className="text-lg">⚖️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalNegative || 0}</div>
            <p className="text-xs text-muted-foreground">Stratified samples</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Runs</CardTitle>
            <span className="text-lg">⏱️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayRuns || 0}</div>
            <p className="text-xs text-muted-foreground">Filter executions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <span className="text-lg">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Successful runs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="process" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="process">Run Filter</TabsTrigger>
          <TabsTrigger value="runs">Filter Runs</TabsTrigger>
          <TabsTrigger value="viral">Viral Pool</TabsTrigger>
          <TabsTrigger value="negative">Negative Pool</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Run ViralFilter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Execute the viral filter algorithm on the latest batch of videos. This will:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Calculate engagement scores for all videos</li>
                  <li>• Identify top 5% as viral candidates</li>
                  <li>• Select stratified negative samples</li>
                  <li>• Update viral_pool and negative_pool tables</li>
                </ul>

                <Button
                  onClick={runViralFilter}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Running Filter...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔥</span>
                      Run ViralFilter
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test ViralFilter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Test the ViralFilter with synthetic data to verify functionality:
                </p>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Generate 105 synthetic videos</li>
                  <li>• Include 5 obvious viral candidates</li>
                  <li>• Verify top 5% detection accuracy</li>
                  <li>• Test stratified negative sampling</li>
                </ul>

                <Button
                  onClick={testViralFilter}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Testing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧪</span>
                      Test ViralFilter
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
                      <p className="font-medium">ViralFilter Completed Successfully</p>
                      <div className="mt-2 text-sm">
                        <p><span className="font-medium">Viral candidates:</span> {result.viralCount || 'N/A'}</p>
                        <p><span className="font-medium">Negative samples:</span> {result.negativeCount || 'N/A'}</p>
                        <p><span className="font-medium">Processing time:</span> {result.duration || 'N/A'}ms</p>
                        {result.success !== undefined && (
                          <p><span className="font-medium">Test result:</span> {result.success ? 'PASSED' : 'FAILED'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="runs">
          <Card>
            <CardHeader>
              <CardTitle>Recent Filter Runs</CardTitle>
            </CardHeader>
            <CardContent>
              {filterRuns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No filter runs yet</p>
              ) : (
                <div className="space-y-4">
                  {filterRuns.map((run) => (
                    <div key={run.run_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium">Run ID: {run.run_id}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(run.run_timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={
                          run.status === 'completed' ? 'default' : 
                          run.status === 'insufficient_data' ? 'secondary' : 'destructive'
                        }>
                          {run.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Processed:</span> {run.total_processed}
                        </div>
                        <div>
                          <span className="font-medium">Viral:</span> {run.viral_count}
                        </div>
                        <div>
                          <span className="font-medium">Negative:</span> {run.neg_count}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viral">
          <Card>
            <CardHeader>
              <CardTitle>Viral Pool (Top 5%)</CardTitle>
            </CardHeader>
            <CardContent>
              {viralVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No viral videos in pool</p>
              ) : (
                <div className="space-y-2">
                  {viralVideos.map((video) => (
                    <div key={video.video_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-mono text-sm">{video.video_id}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="negative">
          <Card>
            <CardHeader>
              <CardTitle>Negative Pool (Stratified 5%)</CardTitle>
            </CardHeader>
            <CardContent>
              {negativeVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No negative samples in pool</p>
              ) : (
                <div className="space-y-2">
                  {negativeVideos.map((video) => (
                    <div key={video.video_id} className="flex justify-between items-center p-3 border rounded">
                      <span className="font-mono text-sm">{video.video_id}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(video.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}