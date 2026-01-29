'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  RefreshCw,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  Flame,
  BarChart3,
  Settings,
  Download,
  Search,
  XCircle,
  FileText,
  Video,
  Pin,
  Zap
} from 'lucide-react';

// ============================================================================
// DEFAULT SEARCH QUERIES (from user's Apify config)
// ============================================================================

const DEFAULT_SEARCH_QUERIES = [
  "personal finance",
  "best finance influencers",
  "personal finance management",
  "personal finance influencers",
  "finance mindset",
  "personal finance books",
  "personal finance over 50",
  "honest personal finance",
  "money mindset and finance",
  "personal finance tips and tricks",
  "finance tips",
  "how to improve finance management",
  "personal finance management app",
  "how to learn personal finance management",
  "business finance management",
  "earn to learn personal finance training",
  "how to learn personal finance",
  "what do you learn from personal finance",
  "how to invest and get monthly income",
  "how to invest for beginners",
  "how to invest money",
  "money tips",
  "passive income",
  "financial freedom",
  "money hack",
  "investing tips"
];

// ============================================================================
// TYPES
// ============================================================================

interface TrainingDistribution {
  total: number;
  megaViral: number;
  viral: number;
  normal: number;
  percentViral: number;
  targetViral: number;
  progress: number;
  needed: number;
}

interface ScrapeJob {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalScraped: number;
  totalImported: number;
  duplicatesSkipped: number;
  errors: string[];
  breakdown: {
    megaViral: number;
    viral: number;
    normal: number;
  };
  startedAt: string;
  completedAt?: string;
  // FFmpeg analysis stats
  ffmpegAnalyzed?: number;
  ffmpegFailed?: number;
}

interface ScrapeConfig {
  searchQueries: string[];
  resultsPerPage: number;
  minHearts: number;
  publishedAfter: string;
  shouldDownloadSubtitles: boolean;
  shouldDownloadVideos: boolean;
  excludePinnedPosts: boolean;
  searchSection: string;
  scrapeRelatedVideos: boolean;
  maxItems?: number;
}

const DEFAULT_CONFIG: ScrapeConfig = {
  searchQueries: DEFAULT_SEARCH_QUERIES,
  resultsPerPage: 50,
  minHearts: 100000,
  publishedAfter: "2025-07-01",
  shouldDownloadSubtitles: true,  // CRITICAL for ML
  shouldDownloadVideos: false,
  excludePinnedPosts: false,
  searchSection: "/video",
  scrapeRelatedVideos: false,
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
    running: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Loader2 },
    completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
    failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle }
  }[status] || { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: Clock };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Progress Ring Component
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
        <span className="text-xs text-gray-400">Progress</span>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
        {subValue && (
          <span className="text-xs text-gray-500">{subValue}</span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
  critical
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ElementType;
  critical?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-6 rounded-full transition-colors ${
            checked 
              ? critical 
                ? 'bg-green-500' 
                : 'bg-purple-500' 
              : 'bg-gray-700'
          }`}
        />
        <div
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className={critical ? 'text-green-400' : 'text-gray-400'} />}
          <span className={`font-medium ${critical ? 'text-green-400' : 'text-white'}`}>
            {label}
          </span>
          {critical && (
            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-medium">
              Required for ML
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ViralScrapeMissionPage() {
  const [distribution, setDistribution] = useState<TrainingDistribution | null>(null);
  const [recentJobs, setRecentJobs] = useState<ScrapeJob[]>([]);
  const [activeJob, setActiveJob] = useState<ScrapeJob | null>(null);
  const [config, setConfig] = useState<ScrapeConfig>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/viral-scraping');
      const data = await response.json();

      if (data.success) {
        setDistribution(data.distribution);
        setRecentJobs(data.recentJobs || []);
        
        // Check for running job
        const running = data.recentJobs?.find((j: ScrapeJob) => j.status === 'running');
        if (running) {
          setActiveJob(running);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for updates when job is running
  useEffect(() => {
    if (!activeJob || activeJob.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/viral-scraping?jobId=${activeJob.jobId}`);
        const data = await response.json();
        
        if (data.success && data.job) {
          setActiveJob(data.job);
          
          // Job completed - refresh everything
          if (data.job.status !== 'running') {
            fetchStatus();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJob, fetchStatus]);

  // Store raw textarea value separately to preserve newlines while typing
  const [queriesText, setQueriesText] = useState(config.searchQueries.join('\n'));
  
  // Handle search queries change - preserve raw text for textarea
  const handleQueriesChange = (value: string) => {
    setQueriesText(value);
    // Parse into array for config (filter empty lines for counting/usage)
    const queries = value
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0);
    setConfig({ ...config, searchQueries: queries });
  };

  // Start scraping job
  const startScrape = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/viral-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        // Start polling for the new job
        setActiveJob({
          jobId: data.jobId,
          status: 'running',
          totalScraped: 0,
          totalImported: 0,
          duplicatesSkipped: 0,
          errors: [],
          breakdown: { megaViral: 0, viral: 0, normal: 0 },
          startedAt: new Date().toISOString()
        });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scraping');
    } finally {
      setIsStarting(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG);
    setQueriesText(DEFAULT_SEARCH_QUERIES.join('\n'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-purple-500" size={32} />
          <p className="text-gray-400">Loading viral scrape mission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
            <Flame size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Viral Content Scraping Mission</h1>
            <p className="text-gray-400">Balance ML training data with verified viral content (100K+ likes)</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-medium text-red-400">Error</p>
            <p className="text-sm text-red-300/70">{error}</p>
          </div>
        </div>
      )}

      {/* Mission Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target size={18} className="text-purple-400" />
            Mission Progress
          </h3>
          
          <div className="flex items-center gap-6">
            <ProgressRing progress={distribution?.progress || 0} />
            
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm text-gray-400">Current Viral Videos</p>
                <p className="text-xl font-bold">
                  {(distribution?.megaViral || 0) + (distribution?.viral || 0)}
                  <span className="text-sm font-normal text-gray-500"> / {distribution?.targetViral || 150}</span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-400">Still Needed</p>
                <p className="text-xl font-bold text-orange-400">{distribution?.needed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Distribution */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" />
            Training Data Distribution
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Mega-Viral</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                    style={{ width: `${distribution?.total ? (distribution.megaViral / distribution.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-10 text-right">{distribution?.megaViral || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Viral</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                    style={{ width: `${distribution?.total ? (distribution.viral / distribution.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-10 text-right">{distribution?.viral || 0}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Normal</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gray-600" 
                    style={{ width: `${distribution?.total ? (distribution.normal / distribution.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="font-mono text-sm w-10 text-right">{distribution?.normal || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Videos</span>
              <span className="font-bold">{distribution?.total || 0}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Viral %</span>
              <span className="font-bold text-green-400">{distribution?.percentViral?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" />
            Execute Scrape
          </h3>
          
          {activeJob?.status === 'running' ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="animate-spin text-blue-400" size={16} />
                  <span className="font-medium text-blue-400">Scraping in Progress</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Scraped:</span>
                    <span className="ml-2 font-mono">{activeJob.totalScraped}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">FFmpeg:</span>
                    <span className={`ml-2 font-mono ${
                      (activeJob.ffmpegAnalyzed || 0) >= activeJob.totalImported * 0.9 
                        ? 'text-green-400' 
                        : (activeJob.ffmpegAnalyzed || 0) >= activeJob.totalImported * 0.5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}>
                      {activeJob.ffmpegAnalyzed || 0} ✓
                    </span>
                    {(activeJob.ffmpegFailed || 0) > 0 && (
                      <span className="ml-1 font-mono text-red-400">
                        {activeJob.ffmpegFailed} ✗
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500">Imported:</span>
                    <span className="ml-2 font-mono text-green-400">{activeJob.totalImported}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Duplicates:</span>
                    <span className="ml-2 font-mono text-yellow-400">{activeJob.duplicatesSkipped}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Errors:</span>
                    <span className="ml-2 font-mono text-red-400">{activeJob.errors.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-400">
                <p className="mb-2">Ready to scrape viral content from TikTok:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>{config.searchQueries.length} search queries</li>
                  <li>Minimum {config.minHearts.toLocaleString()} likes</li>
                  <li>
                    Subtitles: {config.shouldDownloadSubtitles ? (
                      <span className="text-green-400">✓ Enabled</span>
                    ) : (
                      <span className="text-red-400">✗ Disabled</span>
                    )}
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={startScrape}
                  disabled={isStarting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {isStarting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Play size={18} />
                  )}
                  {isStarting ? 'Starting...' : 'Start Scrape'}
                </button>
                
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className={`p-3 rounded-lg transition-colors ${
                    showConfig 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="mb-8 bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Settings size={18} className="text-gray-400" />
            Scrape Configuration
          </h3>
          
          {/* Number inputs row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Minimum Hearts (Likes)
              </label>
              <input
                type="number"
                value={config.minHearts}
                onChange={(e) => setConfig({ ...config, minHearts: parseInt(e.target.value) || 100000 })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Only scrape videos with this many likes or more</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Results Per Page
              </label>
              <input
                type="number"
                value={config.resultsPerPage}
                onChange={(e) => setConfig({ ...config, resultsPerPage: parseInt(e.target.value) || 50 })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Videos per search query (max 100)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Published After
              </label>
              <input
                type="date"
                value={config.publishedAfter}
                onChange={(e) => setConfig({ ...config, publishedAfter: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Only recent videos</p>
            </div>
          </div>

          {/* Toggle switches */}
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-4">Download Options</h4>
            <div className="space-y-4">
              <ToggleSwitch
                checked={config.shouldDownloadSubtitles}
                onChange={(checked) => setConfig({ ...config, shouldDownloadSubtitles: checked })}
                label="Download Subtitles"
                description="Required for transcript extraction and ML feature analysis"
                icon={FileText}
                critical
              />
              
              <ToggleSwitch
                checked={config.shouldDownloadVideos}
                onChange={(checked) => setConfig({ ...config, shouldDownloadVideos: checked })}
                label="Download Videos"
                description="Download actual video files (uses more storage and time)"
                icon={Video}
              />
              
              <ToggleSwitch
                checked={config.excludePinnedPosts}
                onChange={(checked) => setConfig({ ...config, excludePinnedPosts: checked })}
                label="Exclude Pinned Posts"
                description="Skip videos that are pinned to creator profiles"
                icon={Pin}
              />
            </div>
          </div>
          
          {/* Search queries textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Queries ({config.searchQueries.length} queries)
            </label>
            <textarea
              value={queriesText}
              onChange={(e) => handleQueriesChange(e.target.value)}
              rows={10}
              placeholder="Enter one search query per line..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm resize-y"
              style={{ minHeight: '200px' }}
            />
            <p className="mt-1 text-xs text-gray-500">
              One search query per line. These terms will be used to find viral finance content on TikTok.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              Reset to Defaults
            </button>
            
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Database}
          label="Total Videos"
          value={distribution?.total || 0}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={Flame}
          label="Viral Videos"
          value={(distribution?.megaViral || 0) + (distribution?.viral || 0)}
          subValue={`${distribution?.percentViral?.toFixed(1) || 0}%`}
          color="bg-orange-500/20 text-orange-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Mega-Viral"
          value={distribution?.megaViral || 0}
          subValue="500K+ likes"
          color="bg-purple-500/20 text-purple-400"
        />
        <StatCard
          icon={Target}
          label="Target Gap"
          value={distribution?.needed || 0}
          subValue="videos needed"
          color="bg-red-500/20 text-red-400"
        />
      </div>

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Recent Scraping Jobs
          </h3>
          
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div
                key={job.jobId}
                className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <StatusBadge status={job.status} />
                  <div>
                    <p className="font-mono text-sm text-gray-300">{job.jobId}</p>
                    <p className="text-xs text-gray-500">
                      Started: {new Date(job.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-white">{job.totalScraped}</p>
                    <p className="text-xs text-gray-500">Scraped</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-green-400">{job.totalImported}</p>
                    <p className="text-xs text-gray-500">Imported</p>
                  </div>
                  <div className="text-center">
                    <p className={`font-bold ${
                      (job.ffmpegAnalyzed || 0) >= job.totalImported * 0.9 
                        ? 'text-cyan-400' 
                        : (job.ffmpegAnalyzed || 0) >= job.totalImported * 0.5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}>{job.ffmpegAnalyzed || 0}</p>
                    <p className="text-xs text-gray-500">FFmpeg</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-yellow-400">{job.duplicatesSkipped}</p>
                    <p className="text-xs text-gray-500">Duplicates</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-red-400">{job.errors.length}</p>
                    <p className="text-xs text-gray-500">Errors</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 p-6 bg-gray-900/30 border border-gray-800/50 rounded-xl">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          How This Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Download size={16} className="text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">1. Scrape</p>
              <p>Apify scrapes TikTok for videos with 100K+ likes in your niche</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Database size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">2. Import</p>
              <p>Videos are deduplicated and imported to scraped_videos table</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <BarChart3 size={16} className="text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white">3. Calculate</p>
              <p>DPS scores are calculated and videos are classified</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <TrendingUp size={16} className="text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">4. Train</p>
              <p>Balanced data improves ML model accuracy for viral prediction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
