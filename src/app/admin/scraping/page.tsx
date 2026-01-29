'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, PlayCircle, Database, TrendingUp, AlertCircle, CheckCircle, XCircle, Loader2, BarChart3, Eye, Zap, Clock, Target, RefreshCw, GitBranch, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Pipeline status types
interface VideoPipelineStatus {
  video_id: string;
  video_url?: string;
  author_username?: string;
  description?: string;
  source?: string;
  scraped_at: string;
  has_transcript: boolean;
  dps_score: number | null;
  dps_classification: string | null;
  views_count: number | null;
  is_analyzed: boolean;
  analysis_date?: string;
  predicted_dps?: number;
  prediction_confidence?: number;
  has_features: boolean;
  feature_count?: number;
  feature_coverage?: number;
  extraction_version?: string;
  pipeline_status: 'scraped' | 'analyzed' | 'features_extracted' | 'training_ready';
}

interface PipelineSummary {
  total_scraped: number;
  with_transcript: number;
  analyzed_by_kai: number;
  features_extracted: number;
  training_ready: number;
  pending_analysis: number;
  pending_features: number;
  by_source: Record<string, { total: number; analyzed: number; with_features: number }>;
  last_scrape: string | null;
  last_analysis: string | null;
  last_extraction: string | null;
}

interface ScrapingJob {
  id: string;
  type: 'channel' | 'keyword';
  target: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'cancelled';
  videos_found: number;
  videos_processed: number;
  videos_analyzed: number;
  viral_count: number;
  good_count: number;
  poor_count: number;
  avg_dps: number | null;
  created_at: string;
  completed_at: string | null;
  // FFmpeg analysis stats
  ffmpeg_analyzed?: number;
  ffmpeg_failed?: number;
  metadata?: {
    ffmpeg_analyzed?: number;
    kai_analyzed?: number;
    total_videos?: number;
  };
}

interface PatternInsight {
  id: string;
  pattern_name: string;
  pattern_type: string;
  viral_occurrence: number;
  poor_occurrence: number;
  lift_factor: number;
  recommendation: string;
  viral_sample_size: number;
  poor_sample_size: number;
}

interface ScrapingMetrics {
  today: {
    jobs_completed: number;
    videos_scraped: number;
    avg_dps: number;
  };
  week: {
    jobs_completed: number;
    videos_scraped: number;
    avg_dps: number;
  };
  byNiche: Array<{ niche: string; count: number; avg_dps: number }>;
}

interface FreshVideo {
  id: string;
  video_id: string;
  video_url: string;
  keyword: string | null;
  niche: string | null;
  author_username: string | null;
  video_age_minutes: number | null;
  initial_views: number;
  predicted_dps: number | null;
  prediction_confidence: number | null;
  tracking_status: string;
  check_1hr: any;
  check_6hr: any;
  check_24hr: any;
  check_48hr: any;
  check_7d: any;
  final_dps: number | null;
  prediction_accurate: boolean | null;
  scraped_at: string;
}

interface FreshScrapeJob {
  id: string;
  keywords: string[];
  niches: string[] | null;
  max_video_age_minutes: number;
  max_initial_views: number;
  auto_predict: boolean;
  auto_refresh_minutes: number;
  status: string;
  videos_found: number;
  videos_predicted: number;
  last_refresh_at: string | null;
  created_at: string;
}

export default function ScrapingCommandCenter() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'channel' | 'keyword' | 'fresh' | 'pipeline'>('channel');

  // Pipeline status state
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [pipelineVideos, setPipelineVideos] = useState<VideoPipelineStatus[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineFilter, setPipelineFilter] = useState<'all' | 'pending_analysis' | 'pending_features' | 'complete'>('all');

  // State for scraping controls
  const [scrapeMode, setScrapeMode] = useState<'channel' | 'keyword'>('channel');
  const [channelInput, setChannelInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState('tiktok');
  const [minViews, setMinViews] = useState(10000);
  const [dateRange, setDateRange] = useState(7);
  const [scraping, setScraping] = useState(false);

  // State for jobs and results
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [metrics, setMetrics] = useState<ScrapingMetrics | null>(null);
  const [insights, setInsights] = useState<PatternInsight[]>([]);

  // Fresh Capture state
  const [freshKeywords, setFreshKeywords] = useState('');
  const [freshNiche, setFreshNiche] = useState('general');
  const [freshMaxAge, setFreshMaxAge] = useState(15);
  const [freshMaxViews, setFreshMaxViews] = useState(1000);
  const [freshAutoRefresh, setFreshAutoRefresh] = useState(5);
  const [freshStarting, setFreshStarting] = useState(false);
  const [freshJobs, setFreshJobs] = useState<FreshScrapeJob[]>([]);
  const [freshVideos, setFreshVideos] = useState<FreshVideo[]>([]);
  const [freshStats, setFreshStats] = useState({
    totalTracked: 0,
    activelyTracking: 0,
    completed: 0,
    accuratePredictions: 0,
    dueChecks: 0
  });
  const [manualUrl, setManualUrl] = useState('');
  const [addingManual, setAddingManual] = useState(false);
  const [processingChecks, setProcessingChecks] = useState(false);

  // Available niches
  const niches = [
    "Personal Finance/Investing",
    "Fitness/Weight Loss",
    "Business/Entrepreneurship",
    "Food/Nutrition Comparisons",
    "Beauty/Skincare",
    "Real Estate/Property",
    "Self-Improvement/Productivity",
    "Dating/Relationships",
    "Education/Study Tips",
    "Career/Job Advice",
    "Parenting/Family",
    "Tech Reviews/Tutorials",
    "Fashion/Style",
    "Health/Medical Education",
    "Cooking/Recipes",
    "Psychology/Mental Health",
    "Travel/Lifestyle",
    "DIY/Home Improvement",
    "Language Learning",
    "Side Hustles/Making Money Online",
  ];

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/scraping/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/scraping/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/scraping/insights?limit=10');
      const data = await res.json();
      if (data.success) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  }, []);

  const fetchFreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/fresh-scraper');
      const data = await res.json();
      if (data.success) {
        setFreshJobs(data.data.jobs || []);
        setFreshVideos(data.data.recentVideos || []);
        setFreshStats(prev => ({
          ...prev,
          ...data.data.stats
        }));
      }

      // Get due checks count
      const checkRes = await fetch('/api/fresh-scraper/check');
      const checkData = await checkRes.json();
      if (checkData.success) {
        setFreshStats(prev => ({
          ...prev,
          dueChecks: checkData.data.dueNow || 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch fresh data:', err);
    }
  }, []);

  const fetchPipelineStatus = useCallback(async (filter?: string) => {
    setPipelineLoading(true);
    try {
      const statusFilter = filter && filter !== 'all' ? `&status=${filter}` : '';
      const res = await fetch(`/api/scraping/pipeline-status?limit=100${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setPipelineSummary(data.summary);
        setPipelineVideos(data.videos || []);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline status:', err);
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchMetrics();
    fetchInsights();
    fetchFreshData();
    fetchPipelineStatus();

    const interval = setInterval(() => {
      fetchJobs();
      fetchMetrics();
      if (activeTab === 'fresh') {
        fetchFreshData();
      }
      if (activeTab === 'pipeline') {
        fetchPipelineStatus(pipelineFilter);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchJobs, fetchMetrics, fetchInsights, fetchFreshData, fetchPipelineStatus, activeTab, pipelineFilter]);

  // Refetch pipeline when filter changes
  useEffect(() => {
    if (activeTab === 'pipeline') {
      fetchPipelineStatus(pipelineFilter);
    }
  }, [pipelineFilter, activeTab, fetchPipelineStatus]);

  const startScraping = async () => {
    setScraping(true);

    try {
      const target = scrapeMode === 'channel' ? channelInput : keywordInput;

      const res = await fetch('/api/scraping/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: scrapeMode,
          target,
          platform: platformFilter,
          niches: selectedNiches,
          filters: {
            minViews,
            dateRange,
          },
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Scraping started! Job ID: ${data.jobId}`);
        setChannelInput('');
        setKeywordInput('');
        fetchJobs();
      } else {
        alert(`Failed to start scraping: ${data.error}`);
      }
    } catch (err) {
      console.error('Error starting scraping:', err);
      alert('Failed to start scraping');
    } finally {
      setScraping(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/scraping/jobs/${jobId}`, {
        method: 'DELETE',
      });
      fetchJobs();
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const startFreshCapture = async () => {
    if (!freshKeywords.trim()) {
      alert('Please enter at least one keyword');
      return;
    }

    setFreshStarting(true);
    try {
      const keywords = freshKeywords.split(',').map(k => k.trim()).filter(k => k);

      const res = await fetch('/api/fresh-scraper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords,
          niches: [freshNiche],
          maxVideoAgeMinutes: freshMaxAge,
          maxInitialViews: freshMaxViews,
          autoPredict: true,
          autoRefreshMinutes: freshAutoRefresh
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Fresh capture started for: ${keywords.join(', ')}`);
        setFreshKeywords('');
        fetchFreshData();
      } else {
        alert(data.error || 'Failed to start fresh capture');
      }
    } catch (err) {
      console.error('Failed to start fresh capture:', err);
      alert('Failed to start fresh capture');
    } finally {
      setFreshStarting(false);
    }
  };

  const addManualFreshVideo = async () => {
    if (!manualUrl.trim()) return;

    setAddingManual(true);
    try {
      const res = await fetch('/api/fresh-scraper/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: manualUrl,
          niche: freshNiche,
          runPrediction: true
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Added video: ${data.data.message}`);
        setManualUrl('');
        fetchFreshData();
      } else {
        alert(data.error || 'Failed to add video');
      }
    } catch (err) {
      console.error('Failed to add manual video:', err);
      alert('Failed to add video');
    } finally {
      setAddingManual(false);
    }
  };

  const processTrackingChecks = async () => {
    setProcessingChecks(true);
    try {
      const res = await fetch('/api/fresh-scraper/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Processed ${data.data.processed} checks, ${data.data.failed} failed`);
        fetchFreshData();
      } else {
        alert(data.error || 'Failed to process checks');
      }
    } catch (err) {
      console.error('Failed to process checks:', err);
      alert('Failed to process checks');
    } finally {
      setProcessingChecks(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      case 'cancelled': return 'text-gray-400';
      case 'tracking': return 'text-yellow-400';
      default: return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-5 h-5" />;
      case 'running': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'failed': return <XCircle className="w-5 h-5" />;
      case 'tracking': return <Clock className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getTrackingProgress = (video: FreshVideo) => {
    const checks = [video.check_1hr, video.check_6hr, video.check_24hr, video.check_48hr, video.check_7d];
    const completed = checks.filter(c => c !== null).length;
    return { completed, total: 5 };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Database className="w-10 h-10 text-purple-400" />
            Scraping Command Center
          </h1>
          <p className="text-gray-400">Automated content discovery and pattern analysis</p>
        </div>

        {/* Main Mode Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 pb-4">
          <button
            onClick={() => { setActiveTab('channel'); setScrapeMode('channel'); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'channel'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            <Search className="w-5 h-5" />
            Channel Scraper
          </button>
          <button
            onClick={() => { setActiveTab('keyword'); setScrapeMode('keyword'); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'keyword'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            <Target className="w-5 h-5" />
            Keyword Scraper
          </button>
          <button
            onClick={() => setActiveTab('fresh')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'fresh'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            <Zap className="w-5 h-5" />
            Fresh Capture
            <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full">NEW</span>
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'pipeline'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            <GitBranch className="w-5 h-5" />
            Pipeline Status
            {pipelineSummary && pipelineSummary.pending_analysis > 0 && (
              <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                {pipelineSummary.pending_analysis} pending
              </span>
            )}
          </button>
        </div>

        {/* Fresh Capture Tab */}
        {activeTab === 'fresh' && (
          <div className="space-y-8">
            {/* Fresh Capture Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-5 border border-green-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Total Tracked</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{freshStats.totalTracked}</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-5 border border-yellow-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Actively Tracking</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{freshStats.activelyTracking}</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 rounded-xl p-5 border border-blue-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Completed</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">{freshStats.completed}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-5 border border-purple-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Accurate (±10 DPS)</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{freshStats.accuratePredictions}</div>
              </div>
              <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-xl p-5 border border-red-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-gray-400 text-sm">Checks Due</span>
                </div>
                <div className="text-3xl font-bold text-red-400">{freshStats.dueChecks}</div>
                {freshStats.dueChecks > 0 && (
                  <button
                    onClick={processTrackingChecks}
                    disabled={processingChecks}
                    className="mt-2 text-xs px-3 py-1 bg-red-600 hover:bg-red-500 rounded transition-colors w-full"
                  >
                    {processingChecks ? 'Processing...' : 'Process Now'}
                  </button>
                )}
              </div>
            </div>

            {/* Fresh Capture Controls */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Zap className="w-6 h-6 text-green-400" />
                Fresh Video Capture
                <span className="text-sm font-normal text-gray-400 ml-2">
                  (5-15 min old, &lt;1000 views)
                </span>
              </h2>

              <div className="grid grid-cols-2 gap-6">
                {/* Automated Capture */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 className="font-semibold mb-4 text-green-400">Automated Keyword Capture</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Keywords (comma-separated)</label>
                      <input
                        type="text"
                        value={freshKeywords}
                        onChange={e => setFreshKeywords(e.target.value)}
                        placeholder="fitness, workout, morning routine"
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Max Age (minutes)</label>
                        <input
                          type="number"
                          value={freshMaxAge}
                          onChange={e => setFreshMaxAge(parseInt(e.target.value))}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Max Views</label>
                        <input
                          type="number"
                          value={freshMaxViews}
                          onChange={e => setFreshMaxViews(parseInt(e.target.value))}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Niche</label>
                        <select
                          value={freshNiche}
                          onChange={e => setFreshNiche(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        >
                          <option value="general">General</option>
                          <option value="fitness">Fitness</option>
                          <option value="personal-finance">Personal Finance</option>
                          <option value="business">Business</option>
                          <option value="side-hustles">Side Hustles</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="education">Education</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Auto-Refresh (min)</label>
                        <select
                          value={freshAutoRefresh}
                          onChange={e => setFreshAutoRefresh(parseInt(e.target.value))}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
                        >
                          <option value="0">One-time only</option>
                          <option value="5">Every 5 minutes</option>
                          <option value="10">Every 10 minutes</option>
                          <option value="15">Every 15 minutes</option>
                          <option value="30">Every 30 minutes</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={startFreshCapture}
                      disabled={freshStarting || !freshKeywords.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    >
                      {freshStarting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Start Fresh Capture
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Manual Add */}
                <div className="bg-gray-800/50 rounded-lg p-5 border border-gray-700">
                  <h3 className="font-semibold mb-4 text-blue-400">Manual Fresh Video Add</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">TikTok URL</label>
                      <input
                        type="text"
                        value={manualUrl}
                        onChange={e => setManualUrl(e.target.value)}
                        placeholder="https://www.tiktok.com/@user/video/123..."
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <p className="text-xs text-gray-500">
                      Found a fresh video? Add it manually for immediate prediction and tracking.
                      The system will auto-check metrics at 1hr, 6hr, 24hr, 48hr, and 7 days.
                    </p>

                    <button
                      onClick={addManualFreshVideo}
                      disabled={addingManual || !manualUrl.trim()}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {addingManual ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          Add &amp; Predict
                        </>
                      )}
                    </button>

                    <div className="mt-4 p-3 bg-green-900/20 border border-green-700/30 rounded-lg text-xs text-green-400">
                      <strong>Tracking Schedule:</strong> 1hr → 6hr → 24hr → 48hr → 7 days
                      <br />
                      Final accuracy calculated after 7-day check.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fresh Videos Table */}
            <div className="bg-gray-900 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Tracked Fresh Videos</h2>
                <button
                  onClick={fetchFreshData}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {freshVideos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Zap className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No fresh videos tracked yet.</p>
                  <p className="text-sm mt-2">Add a video or start a fresh capture above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b border-gray-800 text-gray-400">
                        <th className="pb-3">Video ID</th>
                        <th className="pb-3">Keyword</th>
                        <th className="pb-3 text-right">Initial Views</th>
                        <th className="pb-3 text-right">Age (min)</th>
                        <th className="pb-3 text-center">Predicted</th>
                        <th className="pb-3 text-center">Progress</th>
                        <th className="pb-3 text-center">Final DPS</th>
                        <th className="pb-3 text-center">Accurate?</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {freshVideos.map(video => {
                        const progress = getTrackingProgress(video);
                        return (
                          <tr key={video.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-3">
                              <a
                                href={video.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline font-mono text-xs"
                              >
                                {video.video_id?.substring(0, 12)}...
                              </a>
                            </td>
                            <td className="py-3 text-gray-300">{video.keyword || '-'}</td>
                            <td className="py-3 text-right text-gray-300">
                              {video.initial_views?.toLocaleString()}
                            </td>
                            <td className="py-3 text-right text-gray-400">
                              {video.video_age_minutes || '?'}
                            </td>
                            <td className="py-3 text-center">
                              {video.predicted_dps ? (
                                <span className="text-green-400 font-mono">
                                  {video.predicted_dps.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-green-500 rounded-full h-2 transition-all"
                                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400">{progress.completed}/5</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              {video.final_dps ? (
                                <span className="text-blue-400 font-mono">
                                  {video.final_dps.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              {video.prediction_accurate === null ? (
                                <span className="text-gray-500">-</span>
                              ) : video.prediction_accurate ? (
                                <CheckCircle className="w-5 h-5 text-green-400 inline" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400 inline" />
                              )}
                            </td>
                            <td className="py-3">
                              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(video.tracking_status)}`}>
                                {video.tracking_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pipeline Status Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-8">
            {/* Pipeline Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border border-blue-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm">Total Scraped</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">{pipelineSummary?.total_scraped || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {pipelineSummary?.with_transcript || 0} with transcript
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-5 border border-yellow-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400 text-sm">Pending Analysis</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">{pipelineSummary?.pending_analysis || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Not yet processed by Kai
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-5 border border-purple-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm">Analyzed by Kai</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{pipelineSummary?.analyzed_by_kai || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  In video_analysis table
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-900/30 to-teal-900/30 rounded-xl p-5 border border-cyan-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span className="text-gray-400 text-sm">Features Extracted</span>
                </div>
                <div className="text-3xl font-bold text-cyan-400">{pipelineSummary?.features_extracted || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  In training_features table
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-5 border border-green-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm">Training Ready</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{pipelineSummary?.training_ready || 0}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Ready for ML training
                </div>
              </div>
            </div>

            {/* Pipeline Flow Visualization */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Pipeline Flow</h3>
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-center p-4 bg-gray-800 rounded-lg">
                  <Database className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{pipelineSummary?.total_scraped || 0}</div>
                  <div className="text-sm text-gray-400">Scraped Videos</div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div className="flex-1 text-center p-4 bg-gray-800 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{pipelineSummary?.analyzed_by_kai || 0}</div>
                  <div className="text-sm text-gray-400">Kai Analyzed</div>
                  <div className="text-xs text-yellow-500 mt-1">
                    {pipelineSummary?.pending_analysis || 0} pending
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div className="flex-1 text-center p-4 bg-gray-800 rounded-lg">
                  <TrendingUp className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{pipelineSummary?.features_extracted || 0}</div>
                  <div className="text-sm text-gray-400">Features Extracted</div>
                  <div className="text-xs text-yellow-500 mt-1">
                    {pipelineSummary?.pending_features || 0} pending
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-gray-600 flex-shrink-0" />
                <div className="flex-1 text-center p-4 bg-green-900/30 rounded-lg border border-green-700/50">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-400">{pipelineSummary?.training_ready || 0}</div>
                  <div className="text-sm text-gray-400">Training Ready</div>
                </div>
              </div>
            </div>

            {/* Source Breakdown */}
            {pipelineSummary?.by_source && Object.keys(pipelineSummary.by_source).length > 0 && (
              <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">By Source</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(pipelineSummary.by_source).map(([source, stats]) => (
                    <div key={source} className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-2 capitalize">{source}</div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total:</span>
                        <span className="text-white font-medium">{stats.total}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Analyzed:</span>
                        <span className="text-purple-400 font-medium">{stats.analyzed}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">With Features:</span>
                        <span className="text-cyan-400 font-medium">{stats.with_features}</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500" 
                          style={{ width: `${stats.total > 0 ? (stats.with_features / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Table with Pipeline Status */}
            <div className="bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Video Pipeline Status</h3>
                <div className="flex gap-2">
                  <select
                    value={pipelineFilter}
                    onChange={(e) => setPipelineFilter(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="all">All Videos</option>
                    <option value="pending_analysis">Pending Analysis</option>
                    <option value="pending_features">Pending Features</option>
                    <option value="complete">Training Ready</option>
                  </select>
                  <button
                    onClick={() => fetchPipelineStatus(pipelineFilter)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm flex items-center gap-2"
                    disabled={pipelineLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${pipelineLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-400">Video</th>
                      <th className="px-4 py-3 text-left text-gray-400">Source</th>
                      <th className="px-4 py-3 text-center text-gray-400">Scraped</th>
                      <th className="px-4 py-3 text-center text-gray-400">Transcript</th>
                      <th className="px-4 py-3 text-center text-gray-400">Kai Analyzed</th>
                      <th className="px-4 py-3 text-center text-gray-400">Features</th>
                      <th className="px-4 py-3 text-left text-gray-400">DPS</th>
                      <th className="px-4 py-3 text-left text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {pipelineLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading pipeline status...
                        </td>
                      </tr>
                    ) : pipelineVideos.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                          No videos found
                        </td>
                      </tr>
                    ) : (
                      pipelineVideos.map((video) => (
                        <tr key={video.video_id} className="hover:bg-gray-800/50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-white font-medium truncate max-w-[200px]">
                                @{video.author_username || 'unknown'}
                              </span>
                              <span className="text-gray-500 text-xs truncate max-w-[200px]">
                                {video.description || video.video_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-400 text-xs px-2 py-1 bg-gray-800 rounded">
                              {video.source || 'unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {video.has_transcript ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {video.is_analyzed ? (
                              <div className="flex flex-col items-center">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                {video.predicted_dps && (
                                  <span className="text-xs text-gray-500">{video.predicted_dps.toFixed(1)}%</span>
                                )}
                              </div>
                            ) : (
                              <XCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {video.has_features ? (
                              <div className="flex flex-col items-center">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-xs text-gray-500">
                                  {video.feature_count}/{180}
                                </span>
                              </div>
                            ) : (
                              <XCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {video.dps_score !== null && (
                              <span className={`font-medium ${
                                video.dps_score >= 70 ? 'text-green-400' :
                                video.dps_score >= 40 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {video.dps_score.toFixed(1)}
                              </span>
                            )}
                            {video.dps_classification && (
                              <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                                video.dps_classification === 'mega-viral' ? 'bg-purple-500/20 text-purple-400' :
                                video.dps_classification === 'viral' ? 'bg-green-500/20 text-green-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {video.dps_classification}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              video.pipeline_status === 'training_ready' ? 'bg-green-500/20 text-green-400' :
                              video.pipeline_status === 'features_extracted' ? 'bg-cyan-500/20 text-cyan-400' :
                              video.pipeline_status === 'analyzed' ? 'bg-purple-500/20 text-purple-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {video.pipeline_status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {pipelineVideos.length > 0 && (
                <div className="p-4 border-t border-gray-800 text-sm text-gray-500">
                  Showing {pipelineVideos.length} videos
                </div>
              )}
            </div>

            {/* Last Activity */}
            {pipelineSummary && (
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Last scrape: {pipelineSummary.last_scrape ? new Date(pipelineSummary.last_scrape).toLocaleString() : 'Never'}</span>
                <span>|</span>
                <span>Last analysis: {pipelineSummary.last_analysis ? new Date(pipelineSummary.last_analysis).toLocaleString() : 'Never'}</span>
                <span>|</span>
                <span>Last extraction: {pipelineSummary.last_extraction ? new Date(pipelineSummary.last_extraction).toLocaleString() : 'Never'}</span>
              </div>
            )}
          </div>
        )}

        {/* Channel/Keyword Tabs Content */}
        {(activeTab === 'channel' || activeTab === 'keyword') && (
          <>
            {/* Metrics Overview */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <span className="text-gray-400 text-sm">Today</span>
                  </div>
                  <div className="text-3xl font-bold">{metrics.today.videos_scraped}</div>
                  <div className="text-sm text-gray-400">{metrics.today.jobs_completed} jobs • Avg DPS: {metrics.today.avg_dps?.toFixed(1) || 'N/A'}</div>
                </div>

                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-6 h-6 text-blue-400" />
                    <span className="text-gray-400 text-sm">This Week</span>
                  </div>
                  <div className="text-3xl font-bold">{metrics.week.videos_scraped}</div>
                  <div className="text-sm text-gray-400">{metrics.week.jobs_completed} jobs • Avg DPS: {metrics.week.avg_dps?.toFixed(1) || 'N/A'}</div>
                </div>

                <div className="bg-gray-900 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Eye className="w-6 h-6 text-purple-400" />
                    <span className="text-gray-400 text-sm">Active Jobs</span>
                  </div>
                  <div className="text-3xl font-bold">
                    {jobs.filter(j => j.status === 'running' || j.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-400">
                    {jobs.filter(j => j.status === 'running').length} running
                  </div>
                </div>
              </div>
            )}

            {/* Scraping Controls */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Start New Scraping Job</h2>

              {/* Channel Mode */}
              {activeTab === 'channel' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Channel Username</label>
                    <input
                      type="text"
                      placeholder="@sidehustlereview"
                      value={channelInput}
                      onChange={(e) => setChannelInput(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Niche (Optional)</label>
                    <select
                      multiple
                      value={selectedNiches}
                      onChange={(e) => setSelectedNiches(Array.from(e.target.selectedOptions, option => option.value))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      size={4}
                    >
                      {niches.map(niche => (
                        <option key={niche} value={niche}>{niche}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>
              )}

              {/* Keyword Mode */}
              {activeTab === 'keyword' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Search Keyword</label>
                    <input
                      type="text"
                      placeholder="side hustle tips"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Platform</label>
                      <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram</option>
                        <option value="youtube">YouTube</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Min Views</label>
                      <input
                        type="number"
                        value={minViews}
                        onChange={(e) => setMinViews(parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2">Date Range (days)</label>
                      <input
                        type="number"
                        value={dateRange}
                        onChange={(e) => setDateRange(parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={startScraping}
                disabled={scraping || (!channelInput && !keywordInput)}
                className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-3"
              >
                {scraping ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting Scraping...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start Scraping
                  </>
                )}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                💰 Est. cost: $0.30 per 1,000 videos • Rate limit: 10 channels/hour
              </div>
            </div>

            {/* Active Jobs Monitor */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">Active &amp; Recent Jobs</h2>

              {jobsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
                  <p className="text-gray-400">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Database className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No scraping jobs yet. Start one above!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-800">
                        <th className="pb-3 text-sm font-semibold text-gray-400">Status</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Type</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Target</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Progress</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">FFmpeg</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Results</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Avg DPS</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Started</th>
                        <th className="pb-3 text-sm font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-b border-gray-800 hover:bg-gray-850">
                          <td className="py-4">
                            <div className={`flex items-center gap-2 ${getStatusColor(job.status)}`}>
                              {getStatusIcon(job.status)}
                              <span className="text-sm font-semibold capitalize">{job.status}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm capitalize">{job.type}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm font-mono">{job.target}</span>
                          </td>
                          <td className="py-4">
                            <div className="text-sm">
                              <div className="mb-1">{job.videos_processed} / {job.videos_found} videos</div>
                              <div className="w-32 bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 rounded-full h-2 transition-all"
                                  style={{ width: `${(job.videos_processed / (job.videos_found || 1)) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            {/* FFmpeg Analysis Status */}
                            {(() => {
                              const ffmpegCount = job.metadata?.ffmpeg_analyzed ?? job.ffmpeg_analyzed ?? 0;
                              const total = job.videos_processed || job.videos_found || 1;
                              const percentage = total > 0 ? Math.round((ffmpegCount / total) * 100) : 0;
                              const isGood = percentage >= 90;
                              const isWarning = percentage >= 50 && percentage < 90;
                              return (
                                <div className="text-sm">
                                  <div className={`font-medium ${isGood ? 'text-green-400' : isWarning ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {ffmpegCount} / {total}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {percentage}% analyzed
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="py-4">
                            <div className="text-sm">
                              <span className="text-green-400">{job.viral_count} viral</span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="text-blue-400">{job.good_count} good</span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="text-gray-400">{job.poor_count} poor</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-sm font-semibold">
                              {job.avg_dps ? job.avg_dps.toFixed(1) : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-xs text-gray-500">
                              {new Date(job.created_at).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4">
                            {job.status === 'running' && (
                              <button
                                onClick={() => cancelJob(job.id)}
                                className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pattern Insights */}
            {insights.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6">Top Pattern Insights</h2>

                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="bg-gray-800 rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-semibold text-lg">{insight.pattern_name}</span>
                          <span className="ml-3 text-xs px-2 py-1 bg-gray-700 rounded">{insight.pattern_type}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-400">{insight.lift_factor.toFixed(1)}x</div>
                          <div className="text-xs text-gray-400">lift</div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-300 mb-3">
                        {insight.recommendation}
                      </div>

                      <div className="flex items-center gap-6 text-xs">
                        <div>
                          <span className="text-gray-400">Viral videos:</span>
                          <span className="ml-2 text-green-400 font-semibold">
                            {(insight.viral_occurrence * 100).toFixed(1)}% ({insight.viral_sample_size})
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Poor videos:</span>
                          <span className="ml-2 text-gray-400 font-semibold">
                            {(insight.poor_occurrence * 100).toFixed(1)}% ({insight.poor_sample_size})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
