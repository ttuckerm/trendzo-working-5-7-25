'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
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
  Plus,
  BarChart3,
  Target,
  Users,
  Calendar,
  X,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  type: 'model_ab' | 'feature_test' | 'algorithm_change';
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  controlConfig: string;
  variantConfig: string;
  trafficSplit: number;
  startedAt: string | null;
  endsAt: string | null;
  controlSamples: number;
  variantSamples: number;
  controlMetric: number;
  variantMetric: number;
  liftPercent: number;
  pValue: number;
  isSignificant: boolean;
  winner: 'control' | 'variant' | 'inconclusive' | null;
  createdBy: string;
  createdAt: string;
}

// Mock data
const mockExperiments: Experiment[] = [
  {
    id: '1',
    name: 'Hook Pattern Weighting v2',
    hypothesis: 'Increasing weight of hook patterns from 0.15 to 0.20 will improve prediction accuracy for viral content',
    type: 'algorithm_change',
    status: 'running',
    controlConfig: 'hook_weight: 0.15',
    variantConfig: 'hook_weight: 0.20',
    trafficSplit: 0.5,
    startedAt: '3 days ago',
    endsAt: 'in 4 days',
    controlSamples: 1847,
    variantSamples: 1892,
    controlMetric: 72.3,
    variantMetric: 75.4,
    liftPercent: 4.2,
    pValue: 0.023,
    isSignificant: true,
    winner: 'variant',
    createdBy: 'System',
    createdAt: '3 days ago',
  },
  {
    id: '2',
    name: 'Emotional Peak Detection',
    hypothesis: 'Using audio energy peaks instead of sentiment analysis for emotional detection will improve accuracy',
    type: 'feature_test',
    status: 'running',
    controlConfig: 'emotional_method: sentiment',
    variantConfig: 'emotional_method: audio_energy',
    trafficSplit: 0.5,
    startedAt: '5 days ago',
    endsAt: 'in 2 days',
    controlSamples: 3102,
    variantSamples: 3156,
    controlMetric: 71.8,
    variantMetric: 73.8,
    liftPercent: 2.8,
    pValue: 0.041,
    isSignificant: true,
    winner: 'variant',
    createdBy: 'Admin',
    createdAt: '5 days ago',
  },
  {
    id: '3',
    name: 'XGBoost vs LightGBM',
    hypothesis: 'LightGBM will provide faster inference with similar accuracy',
    type: 'model_ab',
    status: 'completed',
    controlConfig: 'model: xgboost',
    variantConfig: 'model: lightgbm',
    trafficSplit: 0.5,
    startedAt: '14 days ago',
    endsAt: '7 days ago',
    controlSamples: 5234,
    variantSamples: 5189,
    controlMetric: 72.1,
    variantMetric: 71.8,
    liftPercent: -0.4,
    pValue: 0.78,
    isSignificant: false,
    winner: 'inconclusive',
    createdBy: 'System',
    createdAt: '14 days ago',
  },
  {
    id: '4',
    name: 'Trend Timing Boost',
    hypothesis: 'Boosting predictions for videos posted during trend peaks will improve accuracy',
    type: 'algorithm_change',
    status: 'draft',
    controlConfig: 'trend_boost: false',
    variantConfig: 'trend_boost: true, boost_factor: 1.15',
    trafficSplit: 0.3,
    startedAt: null,
    endsAt: null,
    controlSamples: 0,
    variantSamples: 0,
    controlMetric: 0,
    variantMetric: 0,
    liftPercent: 0,
    pValue: 1,
    isSignificant: false,
    winner: null,
    createdBy: 'Admin',
    createdAt: '1 day ago',
  },
];

const typeColors = {
  model_ab: 'bg-purple-500/20 text-purple-400',
  feature_test: 'bg-blue-500/20 text-blue-400',
  algorithm_change: 'bg-green-500/20 text-green-400',
};

const typeLabels = {
  model_ab: 'Model A/B',
  feature_test: 'Feature Test',
  algorithm_change: 'Algorithm',
};

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-400',
  running: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

function ExperimentCard({ experiment }: { experiment: Experiment }) {
  const progressPercent = experiment.status === 'running' 
    ? Math.round((experiment.controlSamples + experiment.variantSamples) / 8000 * 100)
    : experiment.status === 'completed' ? 100 : 0;

  return (
    <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5 hover:border-[#2a2a4e] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs px-2 py-0.5 rounded-full', typeColors[experiment.type])}>
              {typeLabels[experiment.type]}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColors[experiment.status])}>
              {experiment.status}
            </span>
          </div>
          <h3 className="font-semibold">{experiment.name}</h3>
        </div>
        {experiment.status === 'running' && (
          <button className="p-1.5 hover:bg-[#1a1a2e] rounded transition-colors">
            <Pause size={16} className="text-gray-400" />
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-400 mb-4 line-clamp-2">{experiment.hypothesis}</p>
      
      {(experiment.status === 'running' || experiment.status === 'completed') && (
        <>
          {/* Progress */}
          {experiment.status === 'running' && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{(experiment.controlSamples + experiment.variantSamples).toLocaleString()} samples</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-400 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Results */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-[#0a0a0f] rounded-lg p-3 border border-[#1a1a2e]">
              <div className="text-xs text-gray-500 mb-1">Control</div>
              <div className="text-xl font-bold">{experiment.controlMetric}%</div>
              <div className="text-xs text-gray-400">{experiment.controlSamples.toLocaleString()} samples</div>
            </div>
            <div className={cn(
              'rounded-lg p-3 border',
              experiment.winner === 'variant' ? 'bg-green-500/10 border-green-500/30' : 'bg-[#0a0a0f] border-[#1a1a2e]'
            )}>
              <div className="text-xs text-gray-500 mb-1">Variant</div>
              <div className="text-xl font-bold">{experiment.variantMetric}%</div>
              <div className="text-xs text-gray-400">{experiment.variantSamples.toLocaleString()} samples</div>
            </div>
          </div>
          
          {/* Statistical Results */}
          <div className="flex items-center justify-between py-3 border-t border-[#1a1a2e]">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xs text-gray-500">Lift</div>
                <div className={cn(
                  'font-medium',
                  experiment.liftPercent > 0 ? 'text-green-400' : experiment.liftPercent < 0 ? 'text-red-400' : 'text-gray-400'
                )}>
                  {experiment.liftPercent > 0 ? '+' : ''}{experiment.liftPercent}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">p-value</div>
                <div className={cn(
                  'font-medium',
                  experiment.pValue < 0.05 ? 'text-green-400' : 'text-gray-400'
                )}>
                  {experiment.pValue.toFixed(3)}
                </div>
              </div>
            </div>
            
            {experiment.isSignificant && experiment.winner && (
              <div className={cn(
                'text-xs px-2 py-1 rounded-full flex items-center gap-1',
                experiment.winner === 'variant' && 'bg-green-500/20 text-green-400',
                experiment.winner === 'control' && 'bg-blue-500/20 text-blue-400',
                experiment.winner === 'inconclusive' && 'bg-gray-500/20 text-gray-400'
              )}>
                {experiment.winner === 'variant' && <><TrendingUp size={12} /> Variant wins</>}
                {experiment.winner === 'control' && <><CheckCircle size={12} /> Control wins</>}
                {experiment.winner === 'inconclusive' && 'Inconclusive'}
              </div>
            )}
          </div>
        </>
      )}
      
      {experiment.status === 'draft' && (
        <div className="flex items-center gap-2 pt-3 border-t border-[#1a1a2e]">
          <button className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm flex items-center justify-center gap-1">
            <Play size={14} />
            Start
          </button>
          <button className="px-4 py-2 bg-[#0a0a0f] text-gray-400 rounded-lg hover:text-gray-300 transition-colors text-sm">
            Edit
          </button>
        </div>
      )}
      
      {experiment.status === 'completed' && experiment.winner === 'variant' && (
        <button className="w-full py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm flex items-center justify-center gap-1 mt-3">
          <ArrowRight size={14} />
          Deploy Variant to Production
        </button>
      )}
    </div>
  );
}

export default function ExperimentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  
  const filteredExperiments = statusFilter === 'all' 
    ? mockExperiments 
    : mockExperiments.filter(e => e.status === statusFilter);

  const runningCount = mockExperiments.filter(e => e.status === 'running').length;
  const avgLift = mockExperiments
    .filter(e => e.status === 'completed' && e.isSignificant)
    .reduce((sum, e) => sum + e.liftPercent, 0) / 
    mockExperiments.filter(e => e.status === 'completed' && e.isSignificant).length || 0;

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
            <h1 className="text-2xl font-bold">Experiment Lab</h1>
            <p className="text-gray-400 text-sm mt-1">
              A/B tests, feature experiments, and hypothesis tracking
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          New Experiment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="text-green-400" size={18} />
            <span className="text-sm text-gray-400">Running</span>
          </div>
          <div className="text-3xl font-bold">{runningCount}</div>
          <div className="text-xs text-gray-400 mt-1">experiments active</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-400" size={18} />
            <span className="text-sm text-gray-400">Avg Lift</span>
          </div>
          <div className="text-3xl font-bold text-green-400">+{avgLift.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 mt-1">from significant results</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-purple-400" size={18} />
            <span className="text-sm text-gray-400">Success Rate</span>
          </div>
          <div className="text-3xl font-bold">67%</div>
          <div className="text-xs text-gray-400 mt-1">experiments win</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-orange-400" size={18} />
            <span className="text-sm text-gray-400">Total Samples</span>
          </div>
          <div className="text-3xl font-bold">
            {mockExperiments.reduce((sum, e) => sum + e.controlSamples + e.variantSamples, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">across all experiments</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1a1a2e]">
        {['all', 'running', 'completed', 'draft'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px capitalize',
              statusFilter === status 
                ? 'border-green-400 text-green-400' 
                : 'border-transparent text-gray-400 hover:text-gray-300'
            )}
          >
            {status}
            {status !== 'all' && (
              <span className="ml-2 text-xs">
                ({mockExperiments.filter(e => status === 'all' ? true : e.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredExperiments.map((experiment) => (
          <ExperimentCard key={experiment.id} experiment={experiment} />
        ))}
      </div>

      {filteredExperiments.length === 0 && (
        <div className="text-center py-12">
          <FlaskConical className="mx-auto text-gray-600 mb-3" size={48} />
          <p className="text-gray-400 mb-4">No experiments found</p>
          <button 
            onClick={() => setShowNewModal(true)}
            className="text-green-400 hover:text-green-300"
          >
            Create your first experiment →
          </button>
        </div>
      )}

      {/* New Experiment Modal (simplified) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">New Experiment</h2>
              <button 
                onClick={() => setShowNewModal(false)}
                className="p-1 hover:bg-[#1a1a2e] rounded"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input 
                  type="text"
                  placeholder="e.g., Hook Pattern Weighting v3"
                  className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Hypothesis</label>
                <textarea 
                  placeholder="What do you expect to happen and why?"
                  rows={3}
                  className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm">
                  <option value="algorithm_change">Algorithm Change</option>
                  <option value="feature_test">Feature Test</option>
                  <option value="model_ab">Model A/B Test</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Control Config</label>
                  <input 
                    type="text"
                    placeholder="e.g., hook_weight: 0.15"
                    className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Variant Config</label>
                  <input 
                    type="text"
                    placeholder="e.g., hook_weight: 0.20"
                    className="w-full bg-[#0a0a0f] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Traffic Split (% to variant)</label>
                <input 
                  type="range"
                  min="10"
                  max="90"
                  defaultValue="50"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>10%</span>
                  <span>50%</span>
                  <span>90%</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#1a1a2e]">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 py-2 bg-[#0a0a0f] text-gray-400 rounded-lg hover:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
























































































