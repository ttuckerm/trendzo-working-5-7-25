'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Database,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Filter,
  Search,
  Trash2,
  Eye,
  BarChart3,
  Loader2,
  Calendar,
  FileText,
  Zap,
  ShieldCheck,
  XCircle,
  Cpu,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricScheduleSummary, MetricCheckType } from '@/lib/training/training-ingest-types';

// Types
interface TrainingJob {
  id: string;
  type: 'full_retrain' | 'incremental' | 'fine_tune' | 'experiment';
  modelType: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStep: string;
  trainingSamples: number;
  startedAt: string | null;
  completedAt: string | null;
  triggeredBy: string;
  error?: string;
}

interface TrainingDataItem {
  id: string;
  videoId: string;
  platform: string;
  creatorHandle: string;
  actualDps: number;
  performanceTier: 'viral' | 'above_average' | 'average' | 'below_average' | 'poor';
  actualViews: number;
  dataQuality: number;
  usedInTraining: boolean;
  createdAt: string;
}

// Mock data
const mockJobs: TrainingJob[] = [
  { id: '1', type: 'full_retrain', modelType: 'XGBoost Ensemble', status: 'completed', progress: 100, currentStep: 'Completed', trainingSamples: 12847, startedAt: '2 days ago', completedAt: '2 days ago', triggeredBy: 'scheduled' },
  { id: '2', type: 'incremental', modelType: 'XGBoost Ensemble', status: 'queued', progress: 0, currentStep: 'Waiting', trainingSamples: 342, startedAt: null, completedAt: null, triggeredBy: 'manual' },
];

const mockTrainingData: TrainingDataItem[] = [
  { id: '1', videoId: '7891234567', platform: 'tiktok', creatorHandle: '@viral_queen', actualDps: 89.5, performanceTier: 'viral', actualViews: 4500000, dataQuality: 0.98, usedInTraining: true, createdAt: '2h ago' },
  { id: '2', videoId: '7891234568', platform: 'tiktok', creatorHandle: '@comedy_king', actualDps: 72.3, performanceTier: 'above_average', actualViews: 1200000, dataQuality: 0.95, usedInTraining: true, createdAt: '4h ago' },
  { id: '3', videoId: '7891234569', platform: 'tiktok', creatorHandle: '@daily_vibes', actualDps: 45.2, performanceTier: 'average', actualViews: 250000, dataQuality: 0.92, usedInTraining: false, createdAt: '6h ago' },
  { id: '4', videoId: '7891234570', platform: 'tiktok', creatorHandle: '@newbie_creator', actualDps: 23.1, performanceTier: 'below_average', actualViews: 45000, dataQuality: 0.88, usedInTraining: false, createdAt: '8h ago' },
  { id: '5', videoId: '7891234571', platform: 'tiktok', creatorHandle: '@test_account', actualDps: 8.4, performanceTier: 'poor', actualViews: 5000, dataQuality: 0.75, usedInTraining: false, createdAt: '12h ago' },
];

const tierColors = {
  viral: 'bg-emerald-500/20 text-emerald-400',
  above_average: 'bg-green-500/20 text-green-400',
  average: 'bg-blue-500/20 text-blue-400',
  below_average: 'bg-orange-500/20 text-orange-400',
  poor: 'bg-red-500/20 text-red-400',
};

const tierLabels = {
  viral: 'Viral',
  above_average: 'Above Avg',
  average: 'Average',
  below_average: 'Below Avg',
  poor: 'Poor',
};

function DistributionChart({ distribution }: { distribution: Record<string, number> }) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const tiers = ['viral', 'above_average', 'average', 'below_average', 'poor'];
  
  return (
    <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
      <h3 className="font-medium text-sm mb-4">Training Data Distribution</h3>
      <div className="space-y-3">
        {tiers.map((tier) => {
          const count = distribution[tier] || 0;
          const percent = total > 0 ? (count / total * 100).toFixed(1) : 0;
          return (
            <div key={tier}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', tierColors[tier as keyof typeof tierColors].split(' ')[0].replace('/20', ''))} />
                  {tierLabels[tier as keyof typeof tierLabels]}
                </span>
                <span className="text-gray-400">
                  {count.toLocaleString()} ({percent}%)
                </span>
              </div>
              <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div 
                  className={cn('h-full rounded-full', tierColors[tier as keyof typeof tierColors].split(' ')[0])}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[#1a1a2e] text-center">
        <div className="text-2xl font-bold">{total.toLocaleString()}</div>
        <div className="text-xs text-gray-400">Total Samples</div>
      </div>
    </div>
  );
}

export default function TrainingPipelinePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'data' | 'jobs' | 'label' | 'readiness'>('data');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Label tab state ──────────────────────────────────────────────────────
  const [labelNiche, setLabelNiche] = useState('side_hustles');
  const [labelForce, setLabelForce] = useState(true);
  const [labelJobs, setLabelJobs] = useState<any[]>([]);
  const [labelSubmitting, setLabelSubmitting] = useState(false);
  const [labelError, setLabelError] = useState<string | null>(null);

  const labelHasRunning = labelJobs.some(
    (j: any) => j.status === 'running' || j.status === 'queued',
  );

  // ── Readiness tab state ───────────────────────────────────────────────────
  const [readinessNiche, setReadinessNiche] = useState('side_hustles');
  const [readinessSummary, setReadinessSummary] = useState<any>(null);
  const [readinessTimestamp, setReadinessTimestamp] = useState<string | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  // Contamination audit state
  const [auditResult, setAuditResult] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Export / Train job tracking
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportJob, setExportJob] = useState<any>(null);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [trainJobId, setTrainJobId] = useState<string | null>(null);
  const [trainJob, setTrainJob] = useState<any>(null);
  const [trainSubmitting, setTrainSubmitting] = useState(false);

  const fetchLabelJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/label-dps');
      const data = await res.json();
      if (data.jobs) setLabelJobs(data.jobs);
    } catch (err) {
      console.error('Failed to fetch label jobs:', err);
    }
  }, []);

  // Fetch label jobs when tab becomes active
  useEffect(() => {
    if (activeTab !== 'label') return;
    fetchLabelJobs();
  }, [activeTab, fetchLabelJobs]);

  // Poll every 5s while a label job is running
  useEffect(() => {
    if (activeTab !== 'label' || !labelHasRunning) return;
    const interval = setInterval(fetchLabelJobs, 5000);
    return () => clearInterval(interval);
  }, [activeTab, labelHasRunning, fetchLabelJobs]);

  const handleRunLabel = async () => {
    setLabelSubmitting(true);
    setLabelError(null);
    try {
      const res = await fetch('/api/admin/label-dps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: labelNiche, force: labelForce }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLabelError(data.error || 'Failed to start labeling job');
      } else {
        await fetchLabelJobs();
      }
    } catch (err: any) {
      setLabelError(err.message);
    } finally {
      setLabelSubmitting(false);
    }
  };

  // ── Readiness data fetcher ─────────────────────────────────────────────────

  const fetchReadiness = useCallback(async () => {
    // Only show the full loading spinner on initial load (when no data yet)
    if (!readinessSummary) setReadinessLoading(true);
    setReadinessError(null);
    try {
      const url = `/api/training/readiness-summary?niche=${readinessNiche}&_=${Date.now()}`;
      const sumRes = await fetch(url, { cache: 'no-store' });
      const sumJson = await sumRes.json();
      if (sumJson.success) {
        const row = (sumJson.data || []).find(
          (r: any) => r.niche === readinessNiche,
        );
        setReadinessSummary(row || null);
        if (sumJson.serverTimestamp) setReadinessTimestamp(sumJson.serverTimestamp);
      } else {
        setReadinessError(sumJson.error || 'Failed to load summary');
      }
    } catch (err: any) {
      setReadinessError(err.message);
    } finally {
      setReadinessLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readinessNiche]);

  // Fetch when readiness tab becomes active or niche changes
  useEffect(() => {
    if (activeTab !== 'readiness') return;
    fetchReadiness();
  }, [activeTab, fetchReadiness]);

  // ── Export handler ──────────────────────────────────────────────────────────

  const handleExport = async () => {
    setExportSubmitting(true);
    setExportJob(null);
    setExportJobId(null);
    try {
      const res = await fetch(
        `/api/operations/training/export?niche=${readinessNiche}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok) {
        setReadinessError(data.error || 'Failed to start export');
      } else if (data.job) {
        setExportJobId(data.job.id);
        setExportJob(data.job);
      }
    } catch (err: any) {
      setReadinessError(err.message);
    } finally {
      setExportSubmitting(false);
    }
  };

  // ── Train handler ──────────────────────────────────────────────────────────

  const handleTrain = async () => {
    setTrainSubmitting(true);
    setTrainJob(null);
    setTrainJobId(null);
    try {
      const res = await fetch(
        `/api/operations/training/train?niche=${readinessNiche}`,
        { method: 'POST' },
      );
      const data = await res.json();
      if (!res.ok) {
        setReadinessError(data.error || 'Failed to start training');
      } else if (data.job) {
        setTrainJobId(data.job.id);
        setTrainJob(data.job);
      }
    } catch (err: any) {
      setReadinessError(err.message);
    } finally {
      setTrainSubmitting(false);
    }
  };

  // ── Contamination audit handler ──────────────────────────────────────────
  const handleRunAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/training/validate-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: readinessNiche }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuditError(data.error || 'Audit request failed');
      } else {
        setAuditResult(data);
      }
    } catch (err: any) {
      setAuditError(err.message);
    } finally {
      setAuditLoading(false);
    }
  };

  // ── Poll export/train jobs ────────────────────────────────────────────────

  useEffect(() => {
    if (!exportJobId) return;
    if (exportJob?.status === 'completed' || exportJob?.status === 'failed') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/operations/training/export?job_id=${exportJobId}`,
        );
        const data = await res.json();
        if (data.job) setExportJob(data.job);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [exportJobId, exportJob?.status]);

  useEffect(() => {
    if (!trainJobId) return;
    if (trainJob?.status === 'completed' || trainJob?.status === 'failed') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/operations/training/train?job_id=${trainJobId}`,
        );
        const data = await res.json();
        if (data.job) setTrainJob(data.job);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [trainJobId, trainJob?.status]);

  const distribution = {
    viral: 2156,
    above_average: 3421,
    average: 4813,
    below_average: 1543,
    poor: 914,
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/operations"
            className="p-2 hover:bg-[#1a1a2e] rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Training Pipeline</h1>
            <p className="text-gray-400 text-sm mt-1">
              Manage training data, run training jobs, monitor progress
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg hover:border-purple-500/50 transition-colors flex items-center gap-2 text-sm">
            <Upload size={16} />
            Upload Data
          </button>
          <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2">
            <Play size={16} />
            Start Training
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="text-purple-400" size={18} />
            <span className="text-sm text-gray-400">Total Samples</span>
          </div>
          <div className="text-3xl font-bold">12,847</div>
          <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <TrendingUp size={12} />
            +342 this week
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={18} />
            <span className="text-sm text-gray-400">Viral Samples</span>
          </div>
          <div className="text-3xl font-bold text-emerald-400">2,156</div>
          <div className="text-xs text-gray-400 mt-1">16.8% of total</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-blue-400" size={18} />
            <span className="text-sm text-gray-400">Avg Quality Score</span>
          </div>
          <div className="text-3xl font-bold">0.91</div>
          <div className="text-xs text-gray-400 mt-1">Target: 0.85+</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-orange-400" size={18} />
            <span className="text-sm text-gray-400">Last Training</span>
          </div>
          <div className="text-xl font-bold">2 days ago</div>
          <div className="text-xs text-gray-400 mt-1">Next: Tomorrow 3:00 AM</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Distribution */}
        <div className="lg:col-span-1 space-y-4">
          <DistributionChart distribution={distribution} />
          
          {/* Quick Actions */}
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-sm">Quick Actions</h3>
            <button className="w-full py-2 bg-[#0a0a0f] text-sm rounded-lg hover:bg-purple-500/10 hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
              <Download size={14} />
              Export Dataset
            </button>
            <button className="w-full py-2 bg-[#0a0a0f] text-sm rounded-lg hover:bg-blue-500/10 hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
              <RefreshCw size={14} />
              Recalculate Quality
            </button>
            <button className="w-full py-2 bg-[#0a0a0f] text-sm rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center gap-2">
              <Trash2 size={14} />
              Clean Low Quality
            </button>
          </div>
        </div>

        {/* Main Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-[#1a1a2e]">
            <button
              onClick={() => setActiveTab('data')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'data' 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              Training Data
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'jobs' 
                  ? 'border-purple-400 text-purple-400' 
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              Training Jobs
            </button>
            <button
              onClick={() => setActiveTab('label')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'label'
                  ? 'border-purple-400 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              Label DPS
            </button>
            <button
              onClick={() => setActiveTab('readiness')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === 'readiness'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              )}
            >
              Training Readiness
            </button>
          </div>

          {activeTab === 'data' && (
            <>
              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by video ID or creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#111118] border border-[#1a1a2e] rounded-lg text-sm focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="bg-[#111118] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Tiers</option>
                  <option value="viral">Viral</option>
                  <option value="above_average">Above Average</option>
                  <option value="average">Average</option>
                  <option value="below_average">Below Average</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e] bg-[#0a0a0f]">
                      <th className="p-4 font-medium">Video ID</th>
                      <th className="p-4 font-medium">Creator</th>
                      <th className="p-4 font-medium">Actual DPS</th>
                      <th className="p-4 font-medium">Tier</th>
                      <th className="p-4 font-medium">Views</th>
                      <th className="p-4 font-medium">Quality</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTrainingData.map((item) => (
                      <tr key={item.id} className="border-b border-[#1a1a2e] last:border-0 hover:bg-[#0a0a0f]/50">
                        <td className="p-4">
                          <div className="font-mono text-sm">{item.videoId}</div>
                          <div className="text-xs text-gray-500">{item.platform}</div>
                        </td>
                        <td className="p-4 text-sm">{item.creatorHandle}</td>
                        <td className="p-4">
                          <span className={cn(
                            'text-sm font-medium',
                            item.actualDps >= 70 ? 'text-emerald-400' : 
                            item.actualDps >= 50 ? 'text-green-400' : 
                            item.actualDps >= 30 ? 'text-blue-400' : 
                            item.actualDps >= 15 ? 'text-orange-400' : 'text-red-400'
                          )}>
                            {item.actualDps}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', tierColors[item.performanceTier])}>
                            {tierLabels[item.performanceTier]}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-400">
                          {(item.actualViews / 1000000).toFixed(1)}M
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-[#1a1a2e] rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  'h-full rounded-full',
                                  item.dataQuality >= 0.9 ? 'bg-green-400' : 
                                  item.dataQuality >= 0.8 ? 'bg-yellow-400' : 'bg-red-400'
                                )}
                                style={{ width: `${item.dataQuality * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{(item.dataQuality * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {item.usedInTraining ? (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 w-fit">
                              <CheckCircle size={10} />
                              Trained
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors">
                              <Eye size={14} className="text-gray-400" />
                            </button>
                            <button className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors">
                              <Trash2 size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'jobs' && (
            <div className="space-y-4">
              {mockJobs.map((job) => (
                <div key={job.id} className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        job.status === 'completed' && 'bg-green-500/20',
                        job.status === 'running' && 'bg-blue-500/20',
                        job.status === 'queued' && 'bg-yellow-500/20',
                        job.status === 'failed' && 'bg-red-500/20'
                      )}>
                        {job.status === 'completed' && <CheckCircle className="text-green-400" size={20} />}
                        {job.status === 'running' && <Loader2 className="text-blue-400 animate-spin" size={20} />}
                        {job.status === 'queued' && <Clock className="text-yellow-400" size={20} />}
                        {job.status === 'failed' && <AlertTriangle className="text-red-400" size={20} />}
                      </div>
                      <div>
                        <div className="font-medium">{job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                        <div className="text-sm text-gray-400">{job.modelType}</div>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      job.status === 'completed' && 'bg-green-500/20 text-green-400',
                      job.status === 'running' && 'bg-blue-500/20 text-blue-400',
                      job.status === 'queued' && 'bg-yellow-500/20 text-yellow-400',
                      job.status === 'failed' && 'bg-red-500/20 text-red-400'
                    )}>
                      {job.status}
                    </span>
                  </div>
                  
                  {job.status === 'running' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>{job.currentStep}</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Samples</div>
                      <div>{job.trainingSamples.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Started</div>
                      <div>{job.startedAt || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Completed</div>
                      <div>{job.completedAt || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Triggered By</div>
                      <div className="capitalize">{job.triggeredBy}</div>
                    </div>
                  </div>
                  
                  {job.status === 'queued' && (
                    <div className="mt-4 pt-4 border-t border-[#1a1a2e] flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 transition-colors">
                        Start Now
                      </button>
                      <button className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/30 transition-colors">
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              <button className="w-full py-3 border border-dashed border-[#2a2a4e] text-gray-400 rounded-xl hover:border-purple-500/50 hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
                <Play size={16} />
                Schedule New Training Job
              </button>
            </div>
          )}

          {/* ── Label DPS Tab ───────────────────────────────────────────── */}
          {activeTab === 'label' && (
            <div className="space-y-4">
              {/* Config card */}
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
                <h3 className="font-medium text-sm mb-4">Label Configuration</h3>
                <div className="flex items-end gap-4 flex-wrap mb-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1.5">Niche</label>
                    <select
                      value={labelNiche}
                      onChange={(e) => setLabelNiche(e.target.value)}
                      className="bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="side_hustles">side_hustles</option>
                      <option value="gaming">gaming</option>
                      <option value="personal_finance">personal_finance</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 py-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={labelForce}
                      onChange={(e) => setLabelForce(e.target.checked)}
                      className="rounded border-gray-600"
                    />
                    <span className="text-sm text-gray-400">Force re-label existing</span>
                  </label>
                </div>

                {labelError && (
                  <div className="mb-3 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    {labelError}
                  </div>
                )}

                <button
                  onClick={handleRunLabel}
                  disabled={labelSubmitting || labelHasRunning}
                  className={cn(
                    'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
                    labelSubmitting || labelHasRunning
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
                  )}
                >
                  {labelSubmitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  ) : labelHasRunning ? (
                    <><Loader2 size={16} className="animate-spin" /> Job Running...</>
                  ) : (
                    <><Play size={16} /> Run Labeling</>
                  )}
                </button>
              </div>

              {/* Empty state */}
              {labelJobs.length === 0 && !labelSubmitting && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No labeling jobs yet. Configure and run one above.
                </div>
              )}

              {/* Job cards */}
              {labelJobs.map((job: any) => (
                <div key={job.id} className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        job.status === 'completed' && 'bg-green-500/20',
                        job.status === 'running' && 'bg-blue-500/20',
                        job.status === 'queued' && 'bg-yellow-500/20',
                        job.status === 'failed' && 'bg-red-500/20',
                      )}>
                        {job.status === 'completed' && <CheckCircle className="text-green-400" size={20} />}
                        {job.status === 'running' && <Loader2 className="text-blue-400 animate-spin" size={20} />}
                        {job.status === 'queued' && <Clock className="text-yellow-400" size={20} />}
                        {job.status === 'failed' && <AlertTriangle className="text-red-400" size={20} />}
                      </div>
                      <div>
                        <div className="font-medium">DPS Labeling</div>
                        <div className="text-sm text-gray-400">
                          Niche: {job.config?.niche || 'unknown'}
                        </div>
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      job.status === 'completed' && 'bg-green-500/20 text-green-400',
                      job.status === 'running' && 'bg-blue-500/20 text-blue-400',
                      job.status === 'queued' && 'bg-yellow-500/20 text-yellow-400',
                      job.status === 'failed' && 'bg-red-500/20 text-red-400',
                    )}>
                      {job.status}
                    </span>
                  </div>

                  {/* Progress bar (running/queued) */}
                  {(job.status === 'running' || job.status === 'queued') && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Labeling {job.config?.niche}...</span>
                        <span>{job.progress ?? 0}%</span>
                      </div>
                      <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 rounded-full transition-all"
                          style={{ width: `${job.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 text-xs">Started</div>
                      <div>{job.started_at ? new Date(job.started_at).toLocaleString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Completed</div>
                      <div>{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Niche</div>
                      <div>{job.config?.niche || '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Force</div>
                      <div>{job.config?.force ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  {/* Results */}
                  {job.results && (
                    <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <div className="text-gray-500 text-xs">Rows Labeled</div>
                          <div className="text-lg font-bold text-green-400">
                            {job.results.rows_labeled ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Rows Skipped</div>
                          <div className="text-lg font-bold text-yellow-400">
                            {job.results.rows_skipped ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Errors</div>
                          <div className={cn(
                            'text-lg font-bold',
                            (job.results.error_count ?? 0) > 0 ? 'text-red-400' : 'text-gray-400',
                          )}>
                            {job.results.error_count ?? '—'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Distinct DPS</div>
                          <div className="text-lg font-bold text-blue-400">
                            {job.results.distinct_dps ?? '—'}
                          </div>
                        </div>
                      </div>
                      {(job.results.min_dps != null && job.results.max_dps != null) && (
                        <div className="text-xs text-gray-500">
                          DPS Range:{' '}
                          <span className="text-gray-300">{job.results.min_dps}</span>
                          {' — '}
                          <span className="text-gray-300">{job.results.max_dps}</span>
                          {job.results.dps_range != null && (
                            <span className="ml-2">(span: {job.results.dps_range})</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error display */}
                  {job.error && (
                    <div className="mt-4 pt-4 border-t border-[#1a1a2e]">
                      <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {job.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Training Readiness Tab ────────────────────────────────── */}
          {activeTab === 'readiness' && (
            <div className="space-y-5">
              {/* Controls row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Niche picker */}
                <div className="relative">
                  <select
                    value={readinessNiche}
                    onChange={(e) => setReadinessNiche(e.target.value)}
                    className="appearance-none bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="side_hustles">side_hustles</option>
                    <option value="gaming">gaming</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>

                <button
                  onClick={fetchReadiness}
                  disabled={readinessLoading}
                  className="p-2 rounded-lg border border-[#1a1a2e] bg-[#111118] hover:border-gray-600 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw
                    size={16}
                    className={readinessLoading ? 'animate-spin text-gray-500' : 'text-gray-400'}
                  />
                </button>

                <div className="flex-1" />

                {/* Export button */}
                <button
                  onClick={handleExport}
                  disabled={
                    exportSubmitting ||
                    exportJob?.status === 'running' ||
                    !readinessSummary?.training_ready_runs
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
                    exportSubmitting || exportJob?.status === 'running'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : !readinessSummary?.training_ready_runs
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30',
                  )}
                >
                  {exportSubmitting || exportJob?.status === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Exporting...</>
                  ) : (
                    <><Download size={16} /> Export Dataset</>
                  )}
                </button>

                {/* Train button */}
                <button
                  onClick={handleTrain}
                  disabled={
                    trainSubmitting ||
                    trainJob?.status === 'running' ||
                    !readinessSummary?.training_ready_runs
                  }
                  className={cn(
                    'px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors',
                    trainSubmitting || trainJob?.status === 'running'
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : !readinessSummary?.training_ready_runs
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30',
                  )}
                >
                  {trainSubmitting || trainJob?.status === 'running' ? (
                    <><Loader2 size={16} className="animate-spin" /> Training...</>
                  ) : (
                    <><Cpu size={16} /> Train XGBoost v6</>
                  )}
                </button>
              </div>

              {/* Error */}
              {readinessError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
                  <XCircle size={16} className="flex-shrink-0" />
                  {readinessError}
                  <button
                    onClick={() => setReadinessError(null)}
                    className="ml-auto text-gray-500 hover:text-gray-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Loading */}
              {readinessLoading && !readinessSummary && (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
                </div>
              )}

              {/* Summary cards */}
              {readinessSummary && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ReadinessCard
                      label="Total Runs"
                      value={readinessSummary.total_runs}
                      color="gray"
                      icon={<Database size={16} />}
                    />
                    <ReadinessCard
                      label="Completed"
                      value={readinessSummary.completed_runs}
                      color="blue"
                      icon={<CheckCircle size={16} />}
                    />
                    <ReadinessCard
                      label="Labeled"
                      value={readinessSummary.labeled_runs}
                      color="purple"
                      icon={<BarChart3 size={16} />}
                    />
                    <ReadinessCard
                      label="Training Ready"
                      value={readinessSummary.training_ready_runs}
                      color="emerald"
                      icon={<ShieldCheck size={16} />}
                    />
                  </div>

                  {/* Gap cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <ReadinessCard
                      label="Non-Completed"
                      value={readinessSummary.non_completed}
                      color={readinessSummary.non_completed > 0 ? 'amber' : 'gray'}
                      icon={<AlertTriangle size={16} />}
                    />
                    <ReadinessCard
                      label="Missing Components"
                      value={readinessSummary.missing_components}
                      color={readinessSummary.missing_components > 0 ? 'amber' : 'gray'}
                      icon={<AlertTriangle size={16} />}
                    />
                    <ReadinessCard
                      label="Missing raw_result"
                      value={readinessSummary.missing_raw_result}
                      color={readinessSummary.missing_raw_result > 0 ? 'amber' : 'gray'}
                      icon={<AlertTriangle size={16} />}
                    />
                    <ReadinessCard
                      label="Missing actual_dps"
                      value={readinessSummary.missing_actual_dps}
                      color={readinessSummary.missing_actual_dps > 0 ? 'red' : 'gray'}
                      icon={<XCircle size={16} />}
                    />
                  </div>

                  {/* Readiness bar */}
                  <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Readiness</span>
                      <span className="text-sm font-medium text-emerald-400">
                        {readinessSummary.total_runs > 0
                          ? (
                              (readinessSummary.training_ready_runs /
                                readinessSummary.total_runs) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            readinessSummary.total_runs > 0
                              ? (readinessSummary.training_ready_runs /
                                  readinessSummary.total_runs) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-gray-600">
                        {readinessSummary.training_ready_runs} of{' '}
                        {readinessSummary.total_runs} runs are training-ready
                      </p>
                      {readinessTimestamp && (
                        <span className="text-[10px] text-gray-600 tabular-nums">
                          synced {new Date(readinessTimestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Metric Checks Panel */}
              <MetricChecksPanel
                onRefreshReadiness={fetchReadiness}
              />

              {/* Contamination Audit Panel */}
              <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Contamination Audit</span>
                    {auditResult && (
                      auditResult.passed ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          <CheckCircle size={12} /> PASS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          <XCircle size={12} /> FAIL
                        </span>
                      )
                    )}
                  </div>
                  <button
                    onClick={handleRunAudit}
                    disabled={auditLoading}
                    className={cn(
                      'px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-medium transition-colors',
                      auditLoading
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30',
                    )}
                  >
                    {auditLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Running...</>
                    ) : (
                      <><ShieldCheck size={14} /> Run Audit</>
                    )}
                  </button>
                </div>

                {auditError && (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                    <XCircle size={14} className="flex-shrink-0" />
                    {auditError}
                  </div>
                )}

                {auditResult && (
                  <div className="space-y-2">
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>Features checked: <span className="text-white font-medium">{auditResult.features_checked ?? 0}</span></span>
                      <span>Contaminated: <span className={cn('font-medium', (auditResult.contaminated_features?.length ?? 0) > 0 ? 'text-red-400' : 'text-green-400')}>{auditResult.contaminated_features?.length ?? 0}</span></span>
                      {auditResult.audit_id && (
                        <span className="text-gray-600 font-mono">ID: {auditResult.audit_id.slice(0, 8)}</span>
                      )}
                    </div>
                    {auditResult.contaminated_features?.length > 0 && (
                      <div className="p-2 rounded bg-red-900/20 border border-red-500/20">
                        <p className="text-xs text-red-300 mb-1">Contaminated features found:</p>
                        <div className="flex flex-wrap gap-1">
                          {auditResult.contaminated_features.map((f: string) => (
                            <span key={f} className="text-[11px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {auditResult.passed && (
                      <p className="text-xs text-green-400/80">{auditResult.summary}</p>
                    )}
                  </div>
                )}

                {!auditResult && !auditError && (
                  <p className="text-xs text-gray-600">Click &quot;Run Audit&quot; to scan training data for post-execution feature contamination.</p>
                )}
              </div>

              {/* Export job status */}
              {exportJob && (
                <JobStatusCard
                  title="Export Dataset"
                  job={exportJob}
                  details={
                    exportJob.results?.row_count != null
                      ? `${exportJob.results.row_count} rows exported → ${exportJob.results.output_path || 'temp'}`
                      : undefined
                  }
                />
              )}

              {/* Train job status */}
              {trainJob && (
                <JobStatusCard
                  title="XGBoost v6 Training"
                  job={trainJob}
                  details={
                    trainJob.results?.eval_mae != null
                      ? `MAE: ${trainJob.results.eval_mae} | Within ±5: ${trainJob.results.within_5_pct ?? '—'}% | Tier Acc: ${trainJob.results.tier_accuracy_pct ?? '—'}%`
                      : undefined
                  }
                />
              )}

              {/* Not-Ready Runs Table */}
              <NotReadyRunsTable
                niche={readinessNiche}
                active={activeTab === 'readiness'}
                onLabeled={fetchReadiness}
                summaryGap={readinessSummary ? readinessSummary.total_runs - readinessSummary.training_ready_runs : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components for Training Readiness tab ────────────────────────────────

function ReadinessCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'gray' | 'emerald' | 'amber' | 'blue' | 'purple' | 'red';
  icon: React.ReactNode;
}) {
  const borderMap: Record<string, string> = {
    gray: 'border-[#1a1a2e]',
    emerald: 'border-emerald-500/30',
    amber: 'border-amber-500/30',
    blue: 'border-blue-500/30',
    purple: 'border-purple-500/30',
    red: 'border-red-500/30',
  };
  const textMap: Record<string, string> = {
    gray: 'text-gray-500',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };
  return (
    <div className={cn('bg-[#111118] border rounded-xl p-3.5', borderMap[color])}>
      <div className="flex items-center gap-2 mb-1">
        <span className={textMap[color]}>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={cn('text-xl font-semibold', value > 0 ? textMap[color] : 'text-gray-600')}>
        {value?.toLocaleString() ?? 0}
      </p>
    </div>
  );
}

function JobStatusCard({
  title,
  job,
  details,
}: {
  title: string;
  job: any;
  details?: string;
}) {
  const statusColors: Record<string, string> = {
    running: 'border-blue-500/30 bg-blue-500/5',
    completed: 'border-emerald-500/30 bg-emerald-500/5',
    failed: 'border-red-500/30 bg-red-500/5',
    queued: 'border-yellow-500/30 bg-yellow-500/5',
  };
  const statusIcons: Record<string, React.ReactNode> = {
    running: <Loader2 size={16} className="text-blue-400 animate-spin" />,
    completed: <CheckCircle size={16} className="text-emerald-400" />,
    failed: <XCircle size={16} className="text-red-400" />,
    queued: <Clock size={16} className="text-yellow-400" />,
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        statusColors[job.status] || 'border-[#1a1a2e] bg-[#111118]',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        {statusIcons[job.status] || null}
        <span className="text-sm font-medium text-gray-200">{title}</span>
        <span className="text-xs text-gray-500 ml-auto">{job.status}</span>
      </div>

      {job.status === 'running' && (
        <div className="mb-2">
          <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${job.progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {details && (
        <p className="text-xs text-gray-400">{details}</p>
      )}

      {job.started_at && (
        <p className="text-xs text-gray-600 mt-1">
          Started: {new Date(job.started_at).toLocaleString()}
          {job.completed_at && ` | Completed: ${new Date(job.completed_at).toLocaleString()}`}
        </p>
      )}

      {job.error && (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 font-mono max-h-24 overflow-y-auto whitespace-pre-wrap">
          {job.error}
        </div>
      )}
    </div>
  );
}

/** Derives a plain-English reason why a run is not training_ready */
function whyNotReady(row: any): string {
  const reasons: string[] = [];
  const statusOk = row.status === 'completed' || row.status === 'success';
  if (!statusOk) reasons.push('Status is not completed');
  if (row.actual_dps == null) reasons.push('Missing actual_dps (unlabeled)');
  if (row.has_raw_result === false) reasons.push('Missing raw_result');
  if (row.has_components === false) reasons.push('Missing component results');
  return reasons.length > 0 ? reasons.join('; ') : 'Unknown';
}

/** Self-contained component that fetches not-ready rows from Supabase */
function NotReadyRunsTable({
  niche,
  active,
  onLabeled,
  summaryGap,
}: {
  niche: string;
  active: boolean;
  onLabeled?: () => void | Promise<void>;
  summaryGap?: number;
}) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [drawerRow, setDrawerRow] = React.useState<any | null>(null);
  // Track reprocessing jobs: run_id → { jobId, status }
  const [reprocessing, setReprocessing] = React.useState<
    Record<string, { jobId: string; status: string }>
  >({});

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/training/readiness-summary/not-ready?niche=${niche}&limit=50&_=${Date.now()}`,
        { cache: 'no-store' },
      );
      const data = await res.json();
      setRows(data.rows || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [niche]);

  React.useEffect(() => {
    if (!active) return;
    fetchRows();
  }, [active, fetchRows]);

  // Consistency check: table row count vs summary gap
  React.useEffect(() => {
    if (summaryGap == null || loading) return;
    const capped = Math.min(summaryGap, 50); // API limit=50
    if (rows.length !== capped) {
      console.warn(
        `[Readiness] Table rows (${rows.length}) ≠ expected gap (${summaryGap}` +
        `${summaryGap > 50 ? `, capped to ${capped}` : ''}).` +
        ` Cards and table may be out of sync.`,
      );
    }
  }, [rows.length, summaryGap, loading]);

  const handleLabelSaved = async (_runId: string) => {
    setDrawerRow(null);
    // Refetch both summary cards and table rows from the server —
    // the server decides which rows are still not-ready.
    await onLabeled?.();
    await fetchRows();
  };

  // ── Reprocess handler ──────────────────────────────────────────────────
  const handleReprocess = async (runId: string) => {
    setReprocessing((prev) => ({
      ...prev,
      [runId]: { jobId: '', status: 'submitting' },
    }));

    try {
      const res = await fetch('/api/operations/training/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setReprocessing((prev) => ({
          ...prev,
          [runId]: { jobId: '', status: 'error' },
        }));
        return;
      }

      setReprocessing((prev) => ({
        ...prev,
        [runId]: { jobId: data.job.id, status: 'running' },
      }));
    } catch {
      setReprocessing((prev) => ({
        ...prev,
        [runId]: { jobId: '', status: 'error' },
      }));
    }
  };

  // ── Poll running reprocess jobs ──────────────────────────────────────
  const runningJobs = Object.entries(reprocessing).filter(
    ([, v]) => v.status === 'running' && v.jobId,
  );

  React.useEffect(() => {
    if (runningJobs.length === 0) return;

    const interval = setInterval(async () => {
      for (const [runId, { jobId }] of runningJobs) {
        try {
          const res = await fetch(
            `/api/operations/training/reprocess?job_id=${jobId}`,
          );
          const data = await res.json();
          const job = data.job;
          if (!job) continue;

          if (job.status === 'completed') {
            setReprocessing((prev) => ({
              ...prev,
              [runId]: { jobId, status: 'completed' },
            }));
            // Refetch both summary + table from server after a short delay
            setTimeout(async () => {
              setReprocessing((prev) => {
                const next = { ...prev };
                delete next[runId];
                return next;
              });
              await onLabeled?.();
              await fetchRows();
            }, 1500);
          } else if (job.status === 'failed') {
            setReprocessing((prev) => ({
              ...prev,
              [runId]: { jobId, status: 'failed' },
            }));
          }
        } catch {
          /* ignore polling errors */
        }
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runningJobs.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-600" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-6 text-center text-gray-600 text-sm">
        No non-ready runs found for <strong>{niche}</strong>.
      </div>
    );
  }

  return (
    <>
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#1a1a2e] flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber-400" />
          <span className="text-sm font-medium text-gray-300">
            Not-Ready Runs ({rows.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-[#1a1a2e] bg-[#0a0a0f]">
                <th className="px-3 py-2.5 text-left font-medium">Run ID</th>
                <th className="px-3 py-2.5 text-left font-medium">Video</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">DPS</th>
                <th className="px-3 py-2.5 text-left font-medium">Why Not Ready</th>
                <th className="px-3 py-2.5 text-left font-medium">Created</th>
                <th className="px-3 py-2.5 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a2e]">
              {rows.map((row: any) => {
                const reason = whyNotReady(row);
                const canLabel = reason.includes('Missing actual_dps');
                const canReprocess =
                  reason.includes('Missing raw_result') ||
                  reason.includes('Missing component results') ||
                  reason.includes('Status is not completed');
                const rpState = reprocessing[row.id];

                return (
                  <tr key={row.id} className="hover:bg-[#0a0a0f]/50">
                    <td className="px-3 py-2 font-mono text-gray-400">
                      {row.id?.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-400">
                      {row.video_id?.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
                          row.status === 'completed'
                            ? 'bg-green-500/15 text-green-400'
                            : row.status === 'failed'
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-yellow-500/15 text-yellow-400',
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {row.actual_dps != null
                        ? Number(row.actual_dps).toFixed(1)
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-amber-400/80 max-w-[250px] truncate">
                      {reason}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canLabel && (
                          <button
                            onClick={() => setDrawerRow(row)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors whitespace-nowrap"
                          >
                            Label now
                          </button>
                        )}
                        {canReprocess && !rpState && (
                          <button
                            onClick={() => handleReprocess(row.id)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors whitespace-nowrap"
                          >
                            Reprocess
                          </button>
                        )}
                        {rpState?.status === 'submitting' && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Loader2 size={10} className="animate-spin" /> Queuing…
                          </span>
                        )}
                        {rpState?.status === 'running' && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-400">
                            <Loader2 size={10} className="animate-spin" /> Running…
                          </span>
                        )}
                        {rpState?.status === 'completed' && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                            <CheckCircle size={10} /> Fixed
                          </span>
                        )}
                        {rpState?.status === 'failed' && (
                          <button
                            onClick={() => handleReprocess(row.id)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors whitespace-nowrap"
                            title="Retry reprocess"
                          >
                            Retry
                          </button>
                        )}
                        {rpState?.status === 'error' && (
                          <button
                            onClick={() => handleReprocess(row.id)}
                            className="px-2 py-1 text-[10px] font-semibold rounded bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors whitespace-nowrap"
                            title="Retry reprocess"
                          >
                            Retry
                          </button>
                        )}
                        {!canLabel && !canReprocess && !rpState && (
                          <span className="text-gray-700">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Label Drawer */}
      {drawerRow && (
        <LabelDrawer
          row={drawerRow}
          onClose={() => setDrawerRow(null)}
          onSaved={handleLabelSaved}
        />
      )}
    </>
  );
}

// ── Label Drawer ────────────────────────────────────────────────────────────

function LabelDrawer({
  row,
  onClose,
  onSaved,
}: {
  row: any;
  onClose: () => void;
  onSaved: (runId: string) => void | Promise<void>;
}) {
  const [views, setViews] = React.useState('');
  const [likes, setLikes] = React.useState('');
  const [comments, setComments] = React.useState('');
  const [shares, setShares] = React.useState('');
  const [saves, setSaves] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    const numViews = Number(views);
    if (!views || isNaN(numViews) || numViews < 0) {
      setError('Views is required and must be a positive number');
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/operations/training/label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          run_id: row.id,
          views: numViews,
          likes: Number(likes) || 0,
          comments: Number(comments) || 0,
          shares: Number(shares) || 0,
          saves: Number(saves) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Label failed');
      } else {
        setResult(data);
        // Auto-close after brief display, then refresh cards
        setTimeout(async () => await onSaved(row.id), 1200);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Right-side drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0d0d14] border-l border-[#1a1a2e] z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a2e]">
          <div>
            <h3 className="text-sm font-semibold text-gray-200">
              Label Actual DPS
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter engagement metrics to compute DPS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#1a1a2e] text-gray-500 hover:text-gray-300 transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Run info */}
          <div className="space-y-2">
            <InfoRow label="Run ID" value={row.id} mono />
            <InfoRow label="Video ID" value={row.video_id} mono />
            {row.tiktok_url && (
              <div className="flex items-start gap-2 text-xs">
                <span className="text-gray-500 w-24 flex-shrink-0">TikTok URL</span>
                <a
                  href={row.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {row.tiktok_url}
                </a>
              </div>
            )}
            {row.predicted_dps_7d != null && (
              <InfoRow
                label="Predicted DPS"
                value={Number(row.predicted_dps_7d).toFixed(1)}
              />
            )}
            {row.account_size_band && (
              <InfoRow label="Account Band" value={row.account_size_band} />
            )}
          </div>

          <div className="border-t border-[#1a1a2e]" />

          {/* Metric inputs */}
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Engagement Metrics
            </p>
            <MetricInput label="Views" value={views} onChange={setViews} required />
            <MetricInput label="Likes" value={likes} onChange={setLikes} />
            <MetricInput label="Comments" value={comments} onChange={setComments} />
            <MetricInput label="Shares" value={shares} onChange={setShares} />
            <MetricInput label="Saves" value={saves} onChange={setSaves} />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle size={14} />
                Labeled successfully
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
                <span className="text-gray-500">Actual DPS</span>
                <span className="text-emerald-300 font-semibold">
                  {result.actual_dps}
                </span>
                <span className="text-gray-500">Tier</span>
                <span className="text-gray-300">{result.actual_tier}</span>
                <span className="text-gray-500">Prediction Error</span>
                <span
                  className={
                    result.prediction_error > 0
                      ? 'text-red-400'
                      : 'text-emerald-400'
                  }
                >
                  {result.prediction_error > 0 ? '+' : ''}
                  {result.prediction_error}
                </span>
                <span className="text-gray-500">Within Range</span>
                <span className="text-gray-300">
                  {result.within_range === true
                    ? '✓ Yes'
                    : result.within_range === false
                      ? '✗ No'
                      : '—'}
                </span>
                <span className="text-gray-500">Cohort Size</span>
                <span className="text-gray-300">
                  {result.cohort_size?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1a1a2e] flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-[#1a1a2e] rounded-lg hover:border-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !!result}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors',
              submitting || result
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border border-purple-500/30',
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Computing…
              </>
            ) : result ? (
              <>
                <CheckCircle size={14} /> Saved
              </>
            ) : (
              <>
                <Zap size={14} /> Calculate + Save Actual DPS
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-500 w-24 flex-shrink-0">{label}</span>
      <span className={cn('text-gray-300 break-all', mono && 'font-mono')}>
        {value}
      </span>
    </div>
  );
}

function MetricInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-gray-400 w-20 flex-shrink-0">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="flex-1 bg-[#111118] border border-[#1a1a2e] rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-purple-500/50 placeholder:text-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

// ── Metric Checks Panel ──────────────────────────────────────────────────────

function MetricChecksPanel({
  onRefreshReadiness,
}: {
  onRefreshReadiness?: () => void | Promise<void>;
}) {
  const [summaries, setSummaries] = React.useState<MetricScheduleSummary[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSchedules = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/metric-schedule?limit=30&_=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setSummaries(data.summaries || []);
      } else {
        setError(data.error || 'Failed to load schedules');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleAction = async (action: string, runId?: string) => {
    const key = runId ? `${action}:${runId}` : action;
    setActionLoading(key);
    setError(null);

    try {
      let res: Response;
      if (action === 'attach') {
        res = await fetch('/api/admin/metric-attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ run_id: runId }),
        });
      } else if (action === 'batch-attach') {
        res = await fetch('/api/admin/metric-attach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: true }),
        });
      } else if (action === 'schedule') {
        res = await fetch('/api/admin/metric-schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ run_id: runId }),
        });
      } else if (action === 'collect') {
        res = await fetch('/api/admin/metric-collector/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(runId ? { run_id: runId } : {}),
        });
      } else {
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `${action} failed`);
      } else {
        // Refetch after action
        await fetchSchedules();
        await onRefreshReadiness?.();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Compute summary stats
  const allCompleteCount = summaries.filter((s) => {
    const types: MetricCheckType[] = ['4h', '24h', '48h', '7d'];
    return types.every((t) => s.checks[t]?.status === 'completed');
  }).length;

  const attachableCount = summaries.filter((s) => {
    const hasCompleted = (['4h', '24h', '48h', '7d'] as MetricCheckType[]).some(
      (t) => s.checks[t]?.status === 'completed',
    );
    return hasCompleted && !s.has_actuals && s.contamination_lock;
  }).length;

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-400" />
          <span className="text-sm font-medium text-gray-300">Metric Checks</span>
          {summaries.length > 0 && (
            <span className="text-[10px] text-gray-500 ml-1">
              {summaries.length} runs | {allCompleteCount} all-complete | {attachableCount} attachable
            </span>
          )}
        </div>
        <button
          onClick={fetchSchedules}
          disabled={loading}
          className="p-1.5 rounded-lg border border-[#1a1a2e] bg-[#0a0a0f] hover:border-gray-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw
            size={14}
            className={loading ? 'animate-spin text-gray-500' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
          <XCircle size={14} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-gray-500 hover:text-gray-300 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && summaries.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && summaries.length === 0 && !error && (
        <p className="text-xs text-gray-600 text-center py-4">
          No metric schedules found. Schedules are created when videos are ingested via training ingest.
        </p>
      )}

      {/* Schedule table */}
      {summaries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-[#1a1a2e] bg-[#0a0a0f]">
                <th className="px-2 py-2 text-left font-medium">Run</th>
                <th className="px-2 py-2 text-left font-medium">Plat. ID</th>
                <th className="px-2 py-2 text-center font-medium">4h</th>
                <th className="px-2 py-2 text-center font-medium">24h</th>
                <th className="px-2 py-2 text-center font-medium">48h</th>
                <th className="px-2 py-2 text-center font-medium">7d</th>
                <th className="px-2 py-2 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a2e]">
              {summaries.map((s) => {
                const types: MetricCheckType[] = ['4h', '24h', '48h', '7d'];
                const hasAnyCompleted = types.some(
                  (t) => s.checks[t]?.status === 'completed',
                );
                const hasAllCompleted = types.every(
                  (t) => s.checks[t]?.status === 'completed',
                );
                const hasAnySchedule = types.some((t) => s.checks[t] !== null);
                const canAttach = hasAnyCompleted && !s.has_actuals && s.contamination_lock;
                const canSchedule = !hasAnySchedule;
                const isLoading = actionLoading?.endsWith(s.prediction_run_id);

                return (
                  <tr key={s.prediction_run_id} className="hover:bg-[#0a0a0f]/50">
                    <td className="px-2 py-1.5 font-mono text-gray-400">
                      {s.prediction_run_id.slice(0, 8)}…
                    </td>
                    <td className="px-2 py-1.5 font-mono text-gray-500">
                      {s.platform_video_id ? s.platform_video_id.slice(0, 8) + '…' : '--'}
                    </td>
                    {types.map((t) => (
                      <td key={t} className="px-2 py-1.5 text-center">
                        <CheckDot check={s.checks[t]} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center">
                      {isLoading ? (
                        <Loader2 size={12} className="animate-spin text-gray-500 mx-auto" />
                      ) : s.has_actuals ? (
                        <span className="text-emerald-400 flex items-center justify-center gap-0.5">
                          <CheckCircle size={12} /> Done
                        </span>
                      ) : canAttach ? (
                        <button
                          onClick={() => handleAction('attach', s.prediction_run_id)}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
                        >
                          Attach
                        </button>
                      ) : canSchedule ? (
                        <button
                          onClick={() => handleAction('schedule', s.prediction_run_id)}
                          className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 transition-colors"
                        >
                          Schedule
                        </button>
                      ) : (
                        <span className="text-gray-700">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Global action buttons */}
      {summaries.length > 0 && (
        <div className="flex items-center gap-3 pt-2 border-t border-[#1a1a2e]">
          <button
            onClick={() => handleAction('collect')}
            disabled={!!actionLoading}
            className={cn(
              'px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors',
              actionLoading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30',
            )}
          >
            {actionLoading === 'collect' ? (
              <><Loader2 size={12} className="animate-spin" /> Collecting...</>
            ) : (
              <><Play size={12} /> Run Collector Now</>
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={() => handleAction('batch-attach')}
            disabled={!!actionLoading || attachableCount === 0}
            className={cn(
              'px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors',
              actionLoading || attachableCount === 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30',
            )}
          >
            {actionLoading === 'batch-attach' ? (
              <><Loader2 size={12} className="animate-spin" /> Attaching...</>
            ) : (
              <><CheckCircle size={12} /> Auto-Attach All ({attachableCount})</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/** Status dot for a single metric check */
function CheckDot({
  check,
}: {
  check: { status: string; completed_at: string | null; views: number | null } | null;
}) {
  if (!check) {
    // No schedule exists
    return <span className="text-gray-700">○</span>;
  }

  if (check.status === 'completed') {
    return (
      <span className="text-emerald-400" title={`Views: ${check.views?.toLocaleString() ?? '?'}`}>
        ●
      </span>
    );
  }

  if (check.status === 'failed') {
    return <span className="text-red-400" title="Failed">●</span>;
  }

  // Pending — check if overdue (for visual distinction)
  return <span className="text-yellow-400/60" title={`${check.status}`}>●</span>;
}






















































































