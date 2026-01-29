'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState<'data' | 'jobs'>('data');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
        </div>
      </div>
    </div>
  );
}
























































































