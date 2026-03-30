'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NICHE_REGISTRY } from '@/lib/prediction/system-registry';
import { zScoreToDisplayDps, classifyDpsV2 } from '@/lib/training/dps-v2';
import { useAdminUserWithDevFallback } from '@/hooks/useAdminUser';

interface DownloadJob {
  id: string;
  job_name: string;
  total_urls: number;
  processed_count: number;
  success_count: number;
  failed_count: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  source: string;
  created_at: string;
}

interface DownloadItem {
  id: string;
  job_id: string;
  tiktok_url: string;
  video_id: string | null;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped';
  local_path: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  error_message: string | null;
  // Prediction fields
  prediction_id: string | null;
  predicted_dps: number | null;
  predicted_range_low: number | null;
  predicted_range_high: number | null;
  confidence: number | null;
  viral_potential: string | null;
  components_used: string[] | null;
  processing_time_ms: number | null;
  prediction_data: any;
  // Actual metrics fields
  actual_dps: number | null;
  actual_views: number | null;
  actual_likes: number | null;
  actual_comments: number | null;
  actual_shares: number | null;
  actual_saves: number | null;
  actual_tier: string | null;
  follower_count: number | null;
  comparison_data: any;
  downloaded_at: string | null;
  created_at: string;
}

// Expanded row state for metrics entry
interface ExpandedRowState {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  loading: boolean;
}

export default function BulkDownloadPage() {
  const { role: userRole } = useAdminUserWithDevFallback();
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DownloadJob | null>(null);
  const [jobItems, setJobItems] = useState<DownloadItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [urlInput, setUrlInput] = useState('');
  const [jobName, setJobName] = useState('');
  const [testNiche, setTestNiche] = useState(NICHE_REGISTRY[0].key);
  // Per-item follower counts keyed by item ID
  const [followerCounts, setFollowerCounts] = useState<Record<string, string>>({});
  
  const [activeTab, setActiveTab] = useState<'input' | 'jobs' | 'results'>('input');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedRowState, setExpandedRowState] = useState<ExpandedRowState>({
    views: '', likes: '', comments: '', shares: '', saves: '', loading: false
  });
  const [predictingItems, setPredictingItems] = useState<Set<string>>(new Set());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/bulk-download', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.jobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load job details
  const loadJobDetails = useCallback(async (jobId: string) => {
    try {
      const res = await fetch(`/api/bulk-download?jobId=${jobId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setSelectedJob(data.data.job);
        setJobItems(data.data.items);
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
    }
  }, []);

  // Start download job
  const startDownload = async () => {
    if (!urlInput.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urlText: urlInput,
          jobName: jobName || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setUrlInput('');
        setJobName('');
        setActiveTab('jobs');
        loadJobs();
        
        if (data.data.jobId) {
          startPolling(data.data.jobId);
        }
      } else {
        alert(data.error || 'Failed to start download');
      }
    } catch (err) {
      console.error('Failed to start download:', err);
      alert('Failed to start download');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle CSV upload
  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const csvContent = await file.text();
      
      const res = await fetch('/api/bulk-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          jobName: `CSV Upload: ${file.name}`
        })
      });

      const data = await res.json();
      if (data.success) {
        setActiveTab('jobs');
        loadJobs();
        if (data.data.jobId) {
          startPolling(data.data.jobId);
        }
      } else {
        alert(data.error || 'Failed to process CSV');
      }
    } catch (err) {
      console.error('Failed to process CSV:', err);
      alert('Failed to process CSV file');
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Persist follower count for an item
  const saveFollowerCount = async (itemId: string, value: string) => {
    setFollowerCounts(prev => ({ ...prev, [itemId]: value }));
    const fc = parseInt(value, 10);
    if (!value || isNaN(fc)) return;
    try {
      await fetch('/api/bulk-download/update-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, followerCount: fc })
      });
    } catch { /* fire-and-forget */ }
  };

  // Run prediction on single video
  const runPrediction = async (itemId: string) => {
    setPredictingItems(prev => new Set(prev).add(itemId));

    // Derive account-size band from follower count (same logic as upload-test)
    const fcStr = followerCounts[itemId] || '';
    const fc = parseInt(fcStr, 10);
    let accountSize = 'medium (10K-100K)';
    if (fc > 0) {
      accountSize = fc >= 1_000_000 ? 'mega (1M+)' : fc >= 100_000 ? 'large (100K-1M)' : fc >= 10_000 ? 'medium (10K-100K)' : 'small (0-10K)';
    }

    try {
      const res = await fetch('/api/bulk-download/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          niche: testNiche,
          goal: 'build-engaged-following',
          accountSize,
          followerCount: fc > 0 ? fc : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        // Reload job details to get updated prediction
        if (selectedJob) {
          loadJobDetails(selectedJob.id);
        }
      } else {
        alert(data.error || 'Prediction failed');
      }
    } catch (err) {
      console.error('Prediction failed:', err);
      alert('Prediction failed');
    } finally {
      setPredictingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Run all predictions
  const runAllPredictions = async () => {
    const itemsToPredict = jobItems.filter(item => 
      item.status === 'completed' && !item.predicted_dps
    );

    for (const item of itemsToPredict) {
      await runPrediction(item.id);
    }
  };

  // Calculate actual DPS from metrics
  const calculateActualDps = async (itemId: string) => {
    const { views, likes, comments, shares, saves } = expandedRowState;
    
    if (!views || !likes || !comments || !shares || !saves) {
      alert('Please enter all metrics');
      return;
    }

    setExpandedRowState(prev => ({ ...prev, loading: true }));
    
    try {
      const res = await fetch('/api/bulk-download/calculate-dps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          views: parseInt(views),
          likes: parseInt(likes),
          comments: parseInt(comments),
          shares: parseInt(shares),
          saves: parseInt(saves)
        })
      });

      const data = await res.json();
      if (data.success) {
        // Reload job details to get updated comparison
        if (selectedJob) {
          loadJobDetails(selectedJob.id);
        }
        setExpandedRow(null);
        setExpandedRowState({ views: '', likes: '', comments: '', shares: '', saves: '', loading: false });
      } else {
        alert(data.error || 'Calculation failed');
      }
    } catch (err) {
      console.error('Calculation failed:', err);
      alert('Calculation failed');
    } finally {
      setExpandedRowState(prev => ({ ...prev, loading: false }));
    }
  };

  // Polling for job updates
  const startPolling = (jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    pollIntervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/bulk-download?jobId=${jobId}`, { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        setSelectedJob(data.data.job);
        setJobItems(data.data.items);
        
        if (data.data.job.status === 'completed' || data.data.job.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          loadJobs();
        }
      }
    }, 2000);
  };

  useEffect(() => {
    loadJobs();
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadJobs]);

  // Count URLs in input
  const urlCount = urlInput.split(/[\n,;]+/).filter(line => {
    const trimmed = line.trim();
    return trimmed && (trimmed.includes('tiktok.com') || trimmed.includes('vm.tiktok'));
  }).length;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'processing':
      case 'downloading': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/30 border-green-700/50';
      case 'failed': return 'bg-red-900/30 border-red-700/50';
      case 'processing':
      case 'downloading': return 'bg-yellow-900/30 border-yellow-700/50';
      default: return 'bg-gray-800/30 border-gray-700/50';
    }
  };

  const getViralPotentialColor = (potential: string | null) => {
    switch (potential) {
      case 'mega-viral': return 'bg-purple-600 text-white';
      case 'viral': return 'bg-green-600 text-white';
      case 'good': return 'bg-blue-600 text-white';
      case 'average': return 'bg-yellow-600 text-black';
      default: return 'bg-gray-600 text-white';
    }
  };

  /** Derive display score (0-100) from z-score stored in actual_dps */
  const getDisplayDps = (item: DownloadItem): number | null => {
    if (item.actual_dps == null) return null;
    return zScoreToDisplayDps(item.actual_dps);
  };

  /** Derive v2 tier from z-score (the DB column actual_tier is not written by calculate-dps route) */
  const getDpsTier = (item: DownloadItem): string | null => {
    if (item.actual_dps == null) return null;
    return classifyDpsV2(item.actual_dps).classification;
  };

  /** Color for 0-100 display score */
  const getDisplayDpsColor = (score: number): string => {
    if (score >= 80) return 'text-[#2dd4a8]';
    if (score >= 60) return 'text-[#f59e0b]';
    return 'text-[#e63946]';
  };

  /** Color for v2 tier badge */
  const getDpsTierStyle = (tier: string): string => {
    switch (tier) {
      case 'mega-viral': return 'bg-purple-600/50 text-purple-200';
      case 'hyper-viral': return 'bg-red-900/50 text-red-300';
      case 'viral': return 'bg-orange-900/50 text-orange-300';
      case 'above-average': return 'bg-emerald-900/50 text-emerald-300';
      case 'average': return 'bg-gray-700/50 text-gray-300';
      case 'below-average': return 'bg-yellow-900/50 text-yellow-300';
      case 'poor': return 'bg-red-900/50 text-red-400';
      case 'normal': return 'bg-gray-700/50 text-gray-300'; // legacy compat
      default: return 'bg-gray-700/50 text-gray-300';
    }
  };

  // Stats calculations
  const completedItems = jobItems.filter(i => i.status === 'completed');
  const predictedItems = jobItems.filter(i => i.predicted_dps !== null);
  const comparedItems = jobItems.filter(i => i.actual_dps !== null);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk TikTok Downloader</h1>
          <p className="text-gray-400 text-sm">Download RAW videos, run predictions, compare with actual metrics</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          Videos stored at: <code className="bg-gray-800 px-2 py-1 rounded text-xs">data/tiktok_downloads/</code>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['input', 'jobs', 'results'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'input' ? 'New Download' : tab}
          </button>
        ))}
      </div>

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* URL Input Card */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Paste TikTok URLs</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Job Name (optional)</label>
              <input
                type="text"
                value={jobName}
                onChange={e => setJobName(e.target.value)}
                placeholder="My download batch..."
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                TikTok URLs (one per line, or comma/semicolon separated)
              </label>
              <textarea
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={`https://www.tiktok.com/@user/video/1234567890
https://vm.tiktok.com/ABC123/
https://www.tiktok.com/t/XXXXXX/`}
                className="w-full h-48 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
              />
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-gray-500">Downloads RAW video only - no metrics attached</span>
                <span className={urlCount > 0 ? 'text-green-400' : 'text-gray-500'}>
                  {urlCount} valid URL{urlCount !== 1 ? 's' : ''} detected
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={startDownload}
                disabled={submitting || urlCount === 0}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {submitting ? 'Starting...' : `Download ${urlCount} RAW Video${urlCount !== 1 ? 's' : ''}`}
              </button>
              
              <label className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium cursor-pointer transition-colors">
                Upload CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Workflow Instructions */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6 border border-blue-700/50">
            <h4 className="text-white font-medium mb-3">Workflow (matches upload-test page)</h4>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
              <li><strong>Download RAW videos</strong> - No metrics attached (preserves prediction integrity)</li>
              <li><strong>Run Predictions</strong> - Click &quot;Run Prediction&quot; on each video or &quot;Run All&quot;</li>
              <li><strong>Wait for actual performance</strong> - Let the video run on TikTok</li>
              <li><strong>Enter actual metrics</strong> - Views, likes, comments, shares, saves</li>
              <li><strong>System calculates actual DPS</strong> and compares to prediction</li>
              <li><strong>Results feed to Algorithm IQ</strong> - Improves future predictions</li>
            </ol>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No download jobs yet</p>
              <button
                onClick={() => setActiveTab('input')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
              >
                Start a new download
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map(job => {
                const progress = job.total_urls > 0 
                  ? Math.round((job.processed_count / job.total_urls) * 100) 
                  : 0;
                
                return (
                  <div
                    key={job.id}
                    onClick={() => {
                      setSelectedJob(job);
                      loadJobDetails(job.id);
                      setActiveTab('results');
                      if (job.status === 'processing') {
                        startPolling(job.id);
                      }
                    }}
                    className={`bg-gray-800 rounded-lg p-5 border cursor-pointer transition-all hover:border-blue-500/50 ${
                      selectedJob?.id === job.id ? 'border-blue-500' : 'border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">{job.job_name}</h4>
                      <span className={`px-2 py-1 rounded text-xs uppercase ${getStatusBg(job.status)} ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-400 mb-1">
                        <span>{job.processed_count} / {job.total_urls} videos</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            job.status === 'completed' ? 'bg-green-500' : 
                            job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">✓ {job.success_count} success</span>
                      <span className="text-red-400">✗ {job.failed_count} failed</span>
                      <span className="text-gray-500 ml-auto">
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && selectedJob && (
        <div className="space-y-6">
          {/* Job Summary */}
          <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedJob.job_name}</h3>
                <p className="text-gray-400 text-sm">
                  {completedItems.length} of {selectedJob.total_urls} videos downloaded
                </p>
              </div>
              
              {selectedJob.status === 'completed' && completedItems.length > 0 && (
                <div className="flex items-center gap-3">
                  <select
                    value={testNiche}
                    onChange={e => setTestNiche(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  >
                    {NICHE_REGISTRY.map(n => (
                      <option key={n.key} value={n.key}>{n.label}</option>
                    ))}
                  </select>

                  <button
                    onClick={runAllPredictions}
                    disabled={predictingItems.size > 0 || predictedItems.length === completedItems.length}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-white font-medium"
                  >
                    {predictingItems.size > 0 ? `Running (${predictingItems.size})...` : 'Run All Predictions'}
                  </button>
                </div>
              )}
            </div>

            {/* Progress Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">{completedItems.length}</div>
                <div className="text-xs text-gray-400">Downloaded</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{predictedItems.length}</div>
                <div className="text-xs text-gray-400">Predicted</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{comparedItems.length}</div>
                <div className="text-xs text-gray-400">Compared</div>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {comparedItems.length > 0 ? comparedItems.length : '-'}
                </div>
                <div className="text-xs text-gray-400">Labeled</div>
              </div>
            </div>
          </div>

          {/* Videos Table */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h4 className="text-white font-medium">Downloaded Videos</h4>
              <span className="text-xs text-gray-500">Click row to expand and enter actual metrics</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/50 text-gray-400 text-left">
                    <th className="px-4 py-3">Video ID</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">File Size</th>
                    <th className="px-4 py-3 text-center">Prediction</th>
                    <th className="px-4 py-3 text-center">Actual DPS</th>
                    <th className="px-4 py-3 text-center">Tier</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobItems.map(item => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`border-t border-gray-700/50 hover:bg-gray-700/30 cursor-pointer ${
                          expandedRow === item.id ? 'bg-gray-700/50' : ''
                        }`}
                        onClick={() => {
                          if (expandedRow === item.id) {
                            setExpandedRow(null);
                          } else {
                            setExpandedRow(item.id);
                            setExpandedRowState({ 
                              views: item.actual_views?.toString() || '', 
                              likes: item.actual_likes?.toString() || '', 
                              comments: item.actual_comments?.toString() || '', 
                              shares: item.actual_shares?.toString() || '', 
                              saves: item.actual_saves?.toString() || '', 
                              loading: false 
                            });
                          }
                        }}
                      >
                        <td className="px-4 py-3">
                          <a 
                            href={item.tiktok_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline font-mono text-xs"
                            onClick={e => e.stopPropagation()}
                          >
                            {item.video_id?.substring(0, 15) || 'Unknown'}...
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusBg(item.status)} ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          {item.file_size_bytes ? formatBytes(item.file_size_bytes) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.predicted_dps !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-green-400 font-mono font-bold">
                                {item.predicted_dps.toFixed(1)} DPS
                              </span>
                              {item.viral_potential && (
                                <span className={`px-2 py-0.5 rounded text-xs ${getViralPotentialColor(item.viral_potential)}`}>
                                  {item.viral_potential}
                                </span>
                              )}
                            </div>
                          ) : item.status === 'completed' ? (
                            <div className="flex flex-col items-center gap-1">
                              <input
                                type="number"
                                placeholder="Followers"
                                value={followerCounts[item.id] ?? (item.follower_count?.toString() || '')}
                                onChange={e => saveFollowerCount(item.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className="w-24 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs text-center"
                              />
                              <button
                                onClick={e => { e.stopPropagation(); runPrediction(item.id); }}
                                disabled={predictingItems.has(item.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded text-xs text-white"
                              >
                                {predictingItems.has(item.id) ? 'Running...' : 'Run Prediction'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.actual_dps !== null ? (() => {
                            const display = getDisplayDps(item)!;
                            return (
                              <span className={`font-mono font-bold ${getDisplayDpsColor(display)}`} title={`z-score: ${item.actual_dps.toFixed(4)}`}>
                                {display.toFixed(1)} DPS
                              </span>
                            );
                          })() : item.predicted_dps !== null ? (
                            <span className="text-yellow-400 text-xs">Click to enter metrics</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.actual_dps !== null ? (() => {
                            const tier = getDpsTier(item)!;
                            return (
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDpsTierStyle(tier)}`}>
                                {tier}
                              </span>
                            );
                          })() : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-400 text-xs">
                            {expandedRow === item.id ? '▲' : '▼'}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expanded Row - Metrics Entry */}
                      {expandedRow === item.id && (
                        <tr className="bg-gray-900/50">
                          <td colSpan={7} className="px-4 py-4">
                            {item.predicted_dps !== null ? (
                              <div className="space-y-4">
                                {/* Prediction Details */}
                                <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-700/50">
                                  <h5 className="text-sm font-semibold text-white mb-3">Prediction Details</h5>
                                  <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-gray-400">Predicted:</span>
                                      <div className="font-bold text-green-400">{item.predicted_dps?.toFixed(1)} DPS</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Range:</span>
                                      <div className="font-medium text-white">
                                        {item.predicted_range_low?.toFixed(1)} - {item.predicted_range_high?.toFixed(1)}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Confidence:</span>
                                      <div className="font-medium text-white">{((item.confidence || 0) * 100).toFixed(0)}%</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Processing:</span>
                                      <div className="font-medium text-white">{item.processing_time_ms}ms</div>
                                    </div>
                                  </div>
                                  {item.components_used && item.components_used.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                      {item.components_used.map((comp, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                                          {comp}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Actual Metrics Entry */}
                                {!item.actual_dps && (
                                  <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-lg p-4 border border-green-700/50">
                                    <h5 className="text-sm font-semibold text-white mb-3">Enter Actual Metrics</h5>
                                    <div className="grid grid-cols-5 gap-3 mb-4">
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Views</label>
                                        <input
                                          type="number"
                                          value={expandedRowState.views}
                                          onChange={e => setExpandedRowState(prev => ({ ...prev, views: e.target.value }))}
                                          placeholder="e.g., 100000"
                                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Likes</label>
                                        <input
                                          type="number"
                                          value={expandedRowState.likes}
                                          onChange={e => setExpandedRowState(prev => ({ ...prev, likes: e.target.value }))}
                                          placeholder="e.g., 5000"
                                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Comments</label>
                                        <input
                                          type="number"
                                          value={expandedRowState.comments}
                                          onChange={e => setExpandedRowState(prev => ({ ...prev, comments: e.target.value }))}
                                          placeholder="e.g., 100"
                                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Saves</label>
                                        <input
                                          type="number"
                                          value={expandedRowState.saves}
                                          onChange={e => setExpandedRowState(prev => ({ ...prev, saves: e.target.value }))}
                                          placeholder="e.g., 500"
                                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs text-gray-400 mb-1">Shares</label>
                                        <input
                                          type="number"
                                          value={expandedRowState.shares}
                                          onChange={e => setExpandedRowState(prev => ({ ...prev, shares: e.target.value }))}
                                          placeholder="e.g., 200"
                                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                                          onClick={e => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                    {!followerCounts[item.id] && !item.follower_count && (
                                      <div className="mb-3 px-3 py-2 bg-yellow-900/40 border border-yellow-600/50 rounded text-yellow-300 text-xs">
                                        DPS cannot be computed without follower count. The view-to-follower ratio is a top-weighted signal.
                                      </div>
                                    )}
                                    <button
                                      onClick={e => { e.stopPropagation(); calculateActualDps(item.id); }}
                                      disabled={expandedRowState.loading}
                                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 rounded text-white font-medium"
                                    >
                                      {expandedRowState.loading ? 'Calculating...' : 'Calculate Actual DPS & Compare'}
                                    </button>
                                  </div>
                                )}

                                {/* Comparison Results */}
                                {item.actual_dps !== null && item.comparison_data && (
                                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-700/50">
                                    <h5 className="text-sm font-semibold text-white mb-3">Prediction vs Actual</h5>
                                    {(() => {
                                      const displayDps = getDisplayDps(item);
                                      const tier = getDpsTier(item);
                                      return (
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                      <div className="bg-blue-900/30 rounded p-3 text-center">
                                        <div className="text-xs text-gray-400 mb-1">Predicted VPS</div>
                                        <div className="text-2xl font-bold text-blue-400">{item.predicted_dps?.toFixed(1)}</div>
                                        <div className="text-xs text-gray-500 mt-1">0-100 scale</div>
                                      </div>
                                      <div className="bg-green-900/30 rounded p-3 text-center">
                                        <div className="text-xs text-gray-400 mb-1">Actual DPS v2</div>
                                        <div className={`text-2xl font-bold ${displayDps != null ? getDisplayDpsColor(displayDps) : 'text-green-400'}`}>{displayDps != null ? displayDps.toFixed(1) : '-'}</div>
                                        <div className="text-xs text-gray-500 mt-1" title={`z-score: ${item.actual_dps?.toFixed(4)}`}>0-100 scale</div>
                                      </div>
                                      <div className="bg-purple-900/30 rounded p-3 text-center">
                                        <div className="text-xs text-gray-400 mb-1">DPS v2 Tier</div>
                                        <div className="text-2xl font-bold">
                                          {tier ? (
                                            <span className={`px-2 py-0.5 rounded ${getDpsTierStyle(tier)}`}>
                                              {tier}
                                            </span>
                                          ) : (
                                            <span className="text-gray-500">-</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                      );
                                    })()}

                                    {/* Actual Metrics */}
                                    <div className="grid grid-cols-7 gap-2 mb-3">
                                      {[
                                        { label: 'Followers', value: item.follower_count },
                                        { label: 'Views', value: item.actual_views },
                                        { label: 'Likes', value: item.actual_likes },
                                        { label: 'Comments', value: item.actual_comments },
                                        { label: 'Saves', value: item.actual_saves },
                                        { label: 'Shares', value: item.actual_shares },
                                        { label: 'Eng. Rate', value: item.comparison_data?.engagementRate != null ? item.comparison_data.engagementRate.toFixed(2) + '%' : null },
                                      ].map(({ label, value }) => (
                                        <div key={label} className="bg-gray-800/50 rounded p-2 text-center">
                                          <div className="text-xs text-gray-500">{label}</div>
                                          <div className="text-sm font-mono text-gray-200">
                                            {value != null ? (typeof value === 'number' ? value.toLocaleString() : value) : '-'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    <div className="text-xs text-gray-500 italic">
                                      VPS predicts content quality (0-100), DPS v2 measures actual engagement relative to niche cohort (0-100)
                                    </div>
                                  </div>
                                )}

                                {/* Performance Insights Panel */}
                                {item.actual_dps !== null && (() => {
                                  const insights = item.comparison_data?.insights;
                                  const displayDps = getDisplayDps(item);
                                  const tier = getDpsTier(item);
                                  if (!insights) {
                                    return (
                                      <div className="bg-[#0f0f16] rounded-lg p-4 border border-[#1e1e2e]">
                                        <h5 className="text-sm font-semibold text-white mb-2">Performance Insights</h5>
                                        <p className="text-sm text-gray-500">Performance insights available for newly labeled videos</p>
                                      </div>
                                    );
                                  }
                                  const headlineColor = tier === 'mega-viral' || tier === 'hyper-viral'
                                    ? 'text-[#2dd4a8]'
                                    : tier === 'viral'
                                      ? 'text-[#f59e0b]'
                                      : (displayDps != null && displayDps >= 60)
                                        ? 'text-white'
                                        : 'text-[#e63946]';
                                  return (
                                    <div className="bg-[#0f0f16] rounded-lg p-4 border border-[#1e1e2e]">
                                      <h5 className="text-sm font-semibold text-white mb-3">Performance Insights</h5>
                                      <p className={`text-lg font-semibold mb-4 ${headlineColor}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                        {insights.headline}
                                      </p>

                                      {insights.strengths?.length > 0 && (
                                        <div className="mb-4">
                                          <h6 className="text-xs font-semibold text-[#2dd4a8] uppercase tracking-wider mb-2">What Worked</h6>
                                          <div className="space-y-1.5">
                                            {insights.strengths.map((s: string, i: number) => (
                                              <div key={i} className="flex items-start gap-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                                <span className="text-[#2dd4a8] mt-0.5 flex-shrink-0">✓</span>
                                                <span className="text-sm text-gray-300">{s}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {insights.improvements?.length > 0 && (
                                        <div className="mb-4">
                                          <h6 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">How to Improve</h6>
                                          <div className="space-y-1.5">
                                            {insights.improvements.map((s: string, i: number) => (
                                              <div key={i} className="flex items-start gap-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                                                <span className="text-cyan-400 mt-0.5 flex-shrink-0">→</span>
                                                <span className="text-sm text-gray-300">{s}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {insights.unlock_prompt && (
                                        <div className="bg-[#141420] rounded p-3 border-l-2 border-violet-500 flex items-start gap-2">
                                          <span className="text-violet-400 mt-0.5 flex-shrink-0">🔒</span>
                                          <span className="text-sm text-gray-400">{insights.unlock_prompt}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Chairman Signal Breakdown Panel */}
                                {userRole === 'chairman' && item.comparison_data?.dps_v2_breakdown && (() => {
                                  const bd = item.comparison_data.dps_v2_breakdown;
                                  const signals = bd.signals ?? {};
                                  const effWeights = bd.effective_weights ?? {};
                                  const availability = bd.signal_availability ?? {};

                                  const SIGNAL_LABELS: Record<string, string> = {
                                    share_rate: 'Share Rate',
                                    save_rate: 'Save Rate',
                                    view_to_follower_ratio: 'View/Follower Ratio',
                                    reach_score: 'Reach Score',
                                    view_percentile_within_cohort: 'Cohort Percentile',
                                    comment_rate: 'Comment Rate',
                                    velocity_score: 'Velocity',
                                    completion_rate: 'Completion Rate',
                                  };

                                  const BAR_COLORS = ['#e63946', '#dc2626', '#c026d3', '#7c3aed', '#6366f1', '#0891b2', '#06b6d4', '#22d3ee'];

                                  const rows = Object.keys(SIGNAL_LABELS).map(key => ({
                                    key,
                                    label: SIGNAL_LABELS[key],
                                    value: signals[key] as number | null,
                                    weight: (effWeights[key] as number) ?? 0,
                                    available: !!availability[key],
                                  }));
                                  rows.sort((a, b) => b.weight - a.weight);

                                  const maxContribution = Math.max(...rows.filter(r => r.value != null).map(r => Math.abs((r.value ?? 0) * r.weight)), 0.001);

                                  const confidenceColor = bd.confidence?.level === 'high' ? 'text-[#2dd4a8]' : bd.confidence?.level === 'medium' ? 'text-[#f59e0b]' : 'text-[#e63946]';

                                  return (
                                    <details className="bg-[#0a0a12] rounded-lg border-l-2 border-[#e63946] overflow-hidden group">
                                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">🔒</span>
                                          <h5 className="text-sm font-semibold text-white">Signal Breakdown — Chairman View</h5>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] uppercase tracking-wider text-[#e63946] bg-[#e63946]/10 px-2 py-0.5 rounded font-semibold">Chairman Only</span>
                                          <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                                        </div>
                                      </summary>

                                      <div className="px-4 pb-4">
                                          {/* Signal Table */}
                                          <table className="w-full text-sm mb-4">
                                            <thead>
                                              <tr className="text-xs text-gray-500 uppercase tracking-wider">
                                                <th className="text-left py-1 pr-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Signal</th>
                                                <th className="text-right py-1 px-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Value</th>
                                                <th className="text-right py-1 px-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Weight</th>
                                                <th className="text-left py-1 px-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Contribution</th>
                                                <th className="text-center py-1 pl-2" style={{ fontFamily: 'DM Sans, sans-serif' }}>Status</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {rows.map((row, i) => {
                                                const contribution = row.value != null ? Math.abs(row.value * row.weight) : 0;
                                                const barPct = maxContribution > 0 ? (contribution / maxContribution) * 100 : 0;
                                                const isRate = row.key.includes('rate');
                                                const formatValue = (v: number | null) => {
                                                  if (v == null) return '—';
                                                  return isRate ? v.toFixed(4) : v.toFixed(2);
                                                };
                                                return (
                                                  <tr key={row.key} className={row.available ? '' : 'opacity-30'}>
                                                    <td className="py-1.5 pr-2 text-gray-300" style={{ fontFamily: 'DM Sans, sans-serif' }}>{row.label}</td>
                                                    <td className="py-1.5 px-2 text-right text-gray-200" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatValue(row.value)}</td>
                                                    <td className="py-1.5 px-2 text-right text-gray-200" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(row.weight * 100).toFixed(1)}%</td>
                                                    <td className="py-1.5 px-2">
                                                      <div className="w-full bg-gray-800 rounded-full h-2">
                                                        <div
                                                          className="h-2 rounded-full transition-all"
                                                          style={{ width: `${barPct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                                                        />
                                                      </div>
                                                    </td>
                                                    <td className="py-1.5 pl-2 text-center">
                                                      <span className={row.available ? 'text-[#2dd4a8]' : 'text-gray-600'}>●</span>
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>

                                          {/* Metadata Grid */}
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                            {[
                                              { label: 'Formula', value: bd.formula_version ?? '—' },
                                              { label: 'Weight Tier', value: bd.weight_tier != null ? `Tier ${bd.weight_tier}` : '—' },
                                              { label: 'Confidence', value: bd.confidence?.level ?? '—', className: confidenceColor },
                                              { label: 'Redistributed', value: bd.weight_was_redistributed ? 'Yes' : 'No' },
                                              { label: 'Composite Eng.', value: bd.composite_engagement?.toFixed(6) ?? '—' },
                                              { label: 'Viral z-score', value: bd.viral_score?.toFixed(4) ?? '—' },
                                              { label: 'Time-adj z-score', value: bd.time_adjusted_score?.toFixed(4) ?? '—' },
                                              { label: 'Decay Factor', value: bd.decay_factor?.toFixed(4) ?? '—' },
                                              { label: 'Cohort Size', value: bd.cohort_sample_size?.toString() ?? '—' },
                                              { label: 'Shrinkage Weight', value: bd.shrinkage_weight?.toFixed(4) ?? '—' },
                                              { label: 'Cohort Median', value: bd.cohort_median?.toFixed(4) ?? '—' },
                                              { label: 'Cohort Spread', value: bd.cohort_spread?.toFixed(4) ?? '—' },
                                            ].map(({ label, value, className }) => (
                                              <div key={label} className="bg-gray-900/50 rounded p-2">
                                                <div className="text-gray-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>{label}</div>
                                                <div className={`font-mono ${className ?? 'text-gray-300'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                                              </div>
                                            ))}
                                          </div>

                                          {/* Confidence Reasons */}
                                          {bd.confidence?.reasons?.length > 0 && (
                                            <div className="mt-2 text-xs text-gray-500">
                                              <span style={{ fontFamily: 'DM Sans, sans-serif' }}>Confidence reasons: </span>
                                              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{bd.confidence.reasons.join(' · ')}</span>
                                            </div>
                                          )}
                                        </div>
                                    </details>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-500">
                                Run prediction first to enter actual metrics
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              
              {jobItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No items yet. Select a job from the Jobs tab.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No Job Selected Message for Results Tab */}
      {activeTab === 'results' && !selectedJob && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Select a job from the Jobs tab to see results</p>
          <button
            onClick={() => setActiveTab('jobs')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
          >
            View Jobs
          </button>
        </div>
      )}
    </div>
  );
}
