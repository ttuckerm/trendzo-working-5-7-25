'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DownloadJob | null>(null);
  const [jobItems, setJobItems] = useState<DownloadItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [urlInput, setUrlInput] = useState('');
  const [jobName, setJobName] = useState('');
  const [testNiche, setTestNiche] = useState('general');
  const [testAccountSize, setTestAccountSize] = useState('medium (10K-100K)');
  
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

  // Run prediction on single video
  const runPrediction = async (itemId: string) => {
    setPredictingItems(prev => new Set(prev).add(itemId));
    
    try {
      const res = await fetch('/api/bulk-download/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          niche: testNiche,
          goal: 'build-engaged-following',
          accountSize: testAccountSize
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
                    <option value="general">General</option>
                    <option value="personal-finance">Personal Finance</option>
                    <option value="fitness">Fitness</option>
                    <option value="business">Business</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="education">Education</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="side-hustles">Side Hustles</option>
                  </select>
                  
                  <select
                    value={testAccountSize}
                    onChange={e => setTestAccountSize(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="small (0-10K)">Small (0-10K)</option>
                    <option value="medium (10K-100K)">Medium (10K-100K)</option>
                    <option value="large (100K-1M)">Large (100K-1M)</option>
                    <option value="mega (1M+)">Mega (1M+)</option>
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
                  {comparedItems.length > 0 
                    ? (comparedItems.filter(i => 
                        Math.abs((i.predicted_dps || 0) - (i.actual_dps || 0)) <= 10
                      ).length / comparedItems.length * 100).toFixed(0)
                    : '-'}%
                </div>
                <div className="text-xs text-gray-400">Accuracy (±10 DPS)</div>
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
                    <th className="px-4 py-3 text-center">Error</th>
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
                            <button
                              onClick={e => { e.stopPropagation(); runPrediction(item.id); }}
                              disabled={predictingItems.has(item.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded text-xs text-white"
                            >
                              {predictingItems.has(item.id) ? 'Running...' : 'Run Prediction'}
                            </button>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.actual_dps !== null ? (
                            <span className="text-blue-400 font-mono font-bold">
                              {item.actual_dps.toFixed(1)} DPS
                            </span>
                          ) : item.predicted_dps !== null ? (
                            <span className="text-yellow-400 text-xs">Click to enter metrics</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.actual_dps !== null && item.predicted_dps !== null ? (
                            <span className={`font-mono ${
                              Math.abs(item.predicted_dps - item.actual_dps) <= 10 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {item.predicted_dps - item.actual_dps > 0 ? '+' : ''}
                              {(item.predicted_dps - item.actual_dps).toFixed(1)}
                            </span>
                          ) : (
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
                                    </div>
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
                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                      <div className="bg-blue-900/30 rounded p-3 text-center">
                                        <div className="text-xs text-gray-400 mb-1">Predicted</div>
                                        <div className="text-2xl font-bold text-blue-400">{item.predicted_dps?.toFixed(1)}</div>
                                      </div>
                                      <div className="bg-green-900/30 rounded p-3 text-center">
                                        <div className="text-xs text-gray-400 mb-1">Actual</div>
                                        <div className="text-2xl font-bold text-green-400">{item.actual_dps?.toFixed(1)}</div>
                                      </div>
                                      <div className={`${
                                        Math.abs((item.predicted_dps || 0) - (item.actual_dps || 0)) <= 10
                                          ? 'bg-green-900/30'
                                          : 'bg-red-900/30'
                                      } rounded p-3 text-center`}>
                                        <div className="text-xs text-gray-400 mb-1">Error</div>
                                        <div className={`text-2xl font-bold ${
                                          Math.abs((item.predicted_dps || 0) - (item.actual_dps || 0)) <= 10
                                            ? 'text-green-400'
                                            : 'text-red-400'
                                        }`}>
                                          {item.comparison_data.error > 0 ? '+' : ''}{item.comparison_data.error?.toFixed(1)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-300">
                                      {item.comparison_data.withinRange ? (
                                        <span className="text-green-400">✓ Within predicted range - accurate prediction!</span>
                                      ) : (
                                        <span className="text-yellow-400">⚠ Outside predicted range</span>
                                      )}
                                    </div>
                                  </div>
                                )}
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
