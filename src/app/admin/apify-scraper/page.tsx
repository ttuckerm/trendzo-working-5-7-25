'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, Database, Video, Clock } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase/client';
import useSWR from 'swr';

export default function ApifyScraperPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [safeLoading, setSafeLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [job, setJob] = useState<{ id?: string; progress?: number; status?: string; logs?: any[] }|null>(null);
  const [keywords, setKeywords] = useState('fitness,cooking,diy');
  const [stats, setStats] = useState<any>(null);
  const [recentVideos, setRecentVideos] = useState<any[]>([]);

  // Load statistics on component mount
  useEffect(() => {
    loadStats();
    loadRecentVideos();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('raw_videos')
        .select('id, views_1h, likes_1h, uploaded_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalVideos = data?.length || 0;
      const todayVideos = data?.filter(v => 
        new Date(v.created_at).toDateString() === new Date().toDateString()
      ).length || 0;
      
      const totalViews = data?.reduce((sum, v) => sum + (v.views_1h || 0), 0) || 0;
      const totalLikes = data?.reduce((sum, v) => sum + (v.likes_1h || 0), 0) || 0;

      setStats({
        totalVideos,
        todayVideos,
        totalViews,
        totalLikes,
        avgEngagement: totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(2) : '0'
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadRecentVideos = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('raw_videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentVideos(data || []);
    } catch (err) {
      console.error('Error loading recent videos:', err);
    }
  };

  const runScraper = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      
      if (keywordArray.length === 0) {
        throw new Error('Please enter at least one keyword');
      }

      const response = await fetch('/api/admin/apify-scrapers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywordArray,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run scraper');
      }

      const data = await response.json();
      setResult(data);
      if (data.job_id && data.sse) {
        setJob({ id: data.job_id, progress: 0, status: 'running', logs: [] })
        const es = new EventSource(data.sse)
        es.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data)
            if (msg?.type === 'progress') {
              setJob(prev => ({ ...(prev||{}), id: data.job_id, progress: msg.progress_pct ?? 0, status: msg.status, logs: [ ...(prev?.logs||[]), msg.meta?.progress_events?.slice?.(-1)?.[0] ].slice(-100) }))
              if (msg.status === 'success' || msg.status === 'error' || msg.status === 'canceled') es.close()
            }
          } catch {}
        }
        es.onerror = () => { es.close() }
      }
      
      // Reload stats and recent videos
      await loadStats();
      await loadRecentVideos();
      
    } catch (err: any) {
      console.error('Error running scraper:', err);
      setError(err.message || 'An unknown error occurred');
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
        <h1 className="text-3xl font-bold mb-2">ApifyScraper Dashboard</h1>
        <p className="text-gray-600">Monitor and control TikTok video scraping operations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVideos || 0}</div>
            <p className="text-xs text-muted-foreground">In database</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Scrapes</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayVideos || 0}</div>
            <p className="text-xs text-muted-foreground">Videos scraped today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Across all videos</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgEngagement || 0}%</div>
            <p className="text-xs text-muted-foreground">Likes/Views ratio</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="scraper" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="scraper">Run Scraper</TabsTrigger>
          <TabsTrigger value="videos">Recent Videos</TabsTrigger>
          <TabsTrigger value="status">System Status</TabsTrigger>
        </TabsList>

        <TabsContent value="scraper">
          <Card>
            <CardHeader>
              <CardTitle>TikTok Video Scraper</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="fitness,cooking,diy,lifestyle"
                  className="w-full bg-white text-black border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter keywords or hashtags to scrape (without #)
                </p>
              </div>

              <Button
                onClick={runScraper}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Scraping
                  </>
                )}
              </Button>

              {job?.id && (
                <div className="space-y-2 border rounded-md p-3">
                  <div className="flex justify-between text-sm">
                    <span>Job</span>
                    <span className="font-mono">{job.id}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded h-2 overflow-hidden"><div className="bg-blue-600 h-2" style={{ width: `${Math.round(job.progress||0)}%` }} /></div>
                  <div className="text-xs text-gray-600">Status: {job.status} • {Math.round(job.progress||0)}%</div>
                  <details>
                    <summary className="text-xs cursor-pointer">View logs</summary>
                    <pre className="text-xs overflow-auto max-h-40 bg-gray-50 p-2">{JSON.stringify(job.logs||[], null, 2)}</pre>
                  </details>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={async()=>{ if (!job?.id) return; await fetch(`/api/admin/jobs/cancel?id=${job.id}`, { method:'POST' }); }} disabled={!job || job.status!=='running'}>Cancel</Button>
                    <Button variant="outline" onClick={()=> runScraper()} disabled={loading}>Retry</Button>
                  </div>
                </div>
              )}

              <div className="w-full">
                <Button
                  onClick={async () => {
                    setSafeLoading(true);
                    try {
                      const test = await fetch('/api/admin/self-test', { cache: 'no-store' });
                      const ok = (await test.json())?.ok;
                      if (!ok) {
                        setError('Self‑Test is not green. Fix checks before running.');
                        return;
                      }
                      const res = await fetch('/api/admin/safe-scrape', { method: 'POST', body: JSON.stringify({}) });
                      const json = await res.json();
                      if (!json?.ok) {
                        setError(json?.error || 'Safe scrape blocked');
                        return;
                      }
                      setResult({
                        message: 'Safe scrape completed (capped).',
                        totalProcessed: json.run?.totalProcessed,
                        durationSec: json.run?.durationSec,
                      });
                      await loadStats();
                      await loadRecentVideos();
                    } catch (e: any) {
                      console.error(e);
                      setError(e?.message || 'Unable to start safe scrape');
                    } finally {
                      setSafeLoading(false);
                    }
                  }}
                  variant="secondary"
                  className="w-full"
                  disabled={safeLoading}
                >
                  {safeLoading ? 'Running Safe Scrape…' : 'Run Safe Scrape (capped)'}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Safe Scrape caps volume/time and only runs when the system self‑test is green. It shows a result below when done.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-md">
                  <XCircle className="inline-block w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-50 rounded-md">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <div>
                      <p className="font-medium">{result.message || 'Scraping Completed Successfully'}</p>
                      <div className="mt-2 text-sm space-y-1">
                        <p><span className="font-medium">Videos processed:</span> {result.totalProcessed || 0}</p>
                        <p><span className="font-medium">Duration:</span> {result.duration || result.durationSec || 'N/A'}</p>
                        <p><span className="font-medium">Rate:</span> {result.rate || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!result && safeLoading && (
                <div className="p-3 bg-gray-100 text-gray-800 rounded-md">Running Safe Scrape…</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>Recently Scraped Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVideos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No videos scraped yet</p>
              ) : (
                <div className="space-y-4">
                  {recentVideos.map((video, index) => (
                    <div key={video.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-medium truncate">{video.caption || 'No caption'}</p>
                          <p className="text-sm text-gray-500">ID: {video.id}</p>
                        </div>
                        <Badge variant={video.saved_filepath ? 'default' : 'secondary'}>
                          {video.saved_filepath ? 'Downloaded' : 'Metadata Only'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Views:</span> {video.views_1h?.toLocaleString() || 0}
                        </div>
                        <div>
                          <span className="font-medium">Likes:</span> {video.likes_1h?.toLocaleString() || 0}
                        </div>
                        <div>
                          <span className="font-medium">Sound ID:</span> {video.sound_id || 'None'}
                        </div>
                        <div>
                          <span className="font-medium">Scraped:</span> {new Date(video.created_at).toLocaleDateString()}
                        </div>
                      </div>
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
                    <p className="font-medium">Apify API</p>
                    <p className="text-sm text-gray-500">Connection to Apify service</p>
                  </div>
                  <ApifyStatusBadge />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Supabase Database</p>
                    <p className="text-sm text-gray-500">Video storage database</p>
                  </div>
                  <Badge variant="default">Connected</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Data Directory</p>
                    <p className="text-sm text-gray-500">/data/raw_videos storage</p>
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

function ApifyStatusBadge() {
  const { data } = useSWR('/api/admin/apify-status', (url) => fetch(url).then(r => r.json()), { refreshInterval: 15000 });
  const ok = Boolean(data?.configured);
  return (
    <Badge variant={ok ? 'default' : 'destructive'}>
      {ok ? 'Connected' : 'Not Configured'}
    </Badge>
  );
}