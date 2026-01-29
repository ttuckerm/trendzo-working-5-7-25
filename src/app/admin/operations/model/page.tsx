'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  GitBranch,
  Calendar,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ModelVersion {
  id: string;
  version: string;
  modelType: string;
  trainedAt: string;
  trainingSamples: number;
  accuracy: number;
  mae: number;
  calibration: number;
  status: 'active' | 'deprecated' | 'training' | 'failed';
  isProduction: boolean;
}

interface FeatureImportance {
  name: string;
  importance: number;
  group: string;
  drift: number;
}

interface AccuracyDataPoint {
  date: string;
  accuracy: number;
  mae: number;
  predictions: number;
}

// Mock data
const mockModelVersions: ModelVersion[] = [
  { id: '1', version: 'v2.3.1', modelType: 'XGBoost Ensemble', trainedAt: '2 days ago', trainingSamples: 12847, accuracy: 73.2, mae: 8.4, calibration: 0.82, status: 'active', isProduction: true },
  { id: '2', version: 'v2.3.0', modelType: 'XGBoost Ensemble', trainedAt: '9 days ago', trainingSamples: 11234, accuracy: 71.8, mae: 9.1, calibration: 0.79, status: 'deprecated', isProduction: false },
  { id: '3', version: 'v2.2.0', modelType: 'XGBoost Ensemble', trainedAt: '30 days ago', trainingSamples: 9876, accuracy: 69.8, mae: 10.2, calibration: 0.75, status: 'deprecated', isProduction: false },
];

const mockFeatureImportance: FeatureImportance[] = [
  { name: 'hook_strength', importance: 0.152, group: 'Viral Patterns', drift: -0.02 },
  { name: 'emotional_peak_intensity', importance: 0.128, group: 'Emotional', drift: 0.01 },
  { name: 'trend_alignment_score', importance: 0.115, group: 'Trend', drift: -0.05 },
  { name: 'creator_baseline_dps', importance: 0.098, group: 'Creator', drift: 0.00 },
  { name: 'pacing_score', importance: 0.087, group: 'Content', drift: 0.03 },
  { name: 'audio_energy', importance: 0.076, group: 'Audio', drift: -0.01 },
  { name: 'visual_complexity', importance: 0.068, group: 'Visual', drift: 0.02 },
  { name: 'text_sentiment', importance: 0.062, group: 'Text', drift: -0.03 },
  { name: 'posting_time_score', importance: 0.054, group: 'Timing', drift: 0.00 },
  { name: 'niche_relevance', importance: 0.048, group: 'Content', drift: 0.04 },
];

const mockAccuracyTrend: AccuracyDataPoint[] = [
  { date: '7d ago', accuracy: 70.5, mae: 9.2, predictions: 134 },
  { date: '6d ago', accuracy: 71.2, mae: 8.9, predictions: 167 },
  { date: '5d ago', accuracy: 72.1, mae: 8.7, predictions: 145 },
  { date: '4d ago', accuracy: 71.8, mae: 8.8, predictions: 189 },
  { date: '3d ago', accuracy: 72.8, mae: 8.5, predictions: 143 },
  { date: '2d ago', accuracy: 73.0, mae: 8.4, predictions: 156 },
  { date: 'Yesterday', accuracy: 73.2, mae: 8.4, predictions: 127 },
];

function AccuracyChart({ data }: { data: AccuracyDataPoint[] }) {
  const maxAccuracy = Math.max(...data.map(d => d.accuracy));
  const minAccuracy = Math.min(...data.map(d => d.accuracy));
  const range = maxAccuracy - minAccuracy;
  
  return (
    <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">Accuracy Trend (7 days)</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-purple-400 rounded-full" />
            Accuracy %
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-400 rounded-full" />
            MAE
          </span>
        </div>
      </div>
      
      <div className="h-40 flex items-end gap-2">
        {data.map((point, i) => {
          const heightPercent = ((point.accuracy - minAccuracy + 5) / (range + 10)) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full flex justify-center">
                <div 
                  className="w-3/4 bg-purple-400/30 rounded-t relative group cursor-pointer"
                  style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-purple-400 rounded-t transition-all"
                    style={{ height: '100%' }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a2e] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {point.accuracy}% | MAE: {point.mae}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 mt-1">{point.date.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalibrationCurve() {
  const points = [
    { predicted: 10, actual: 12 },
    { predicted: 20, actual: 22 },
    { predicted: 30, actual: 31 },
    { predicted: 40, actual: 42 },
    { predicted: 50, actual: 48 },
    { predicted: 60, actual: 58 },
    { predicted: 70, actual: 67 },
    { predicted: 80, actual: 76 },
    { predicted: 90, actual: 85 },
  ];
  
  return (
    <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm">Calibration Curve</h3>
        <span className="text-xs text-gray-400">Score: 0.82</span>
      </div>
      
      <div className="h-40 relative">
        {/* Perfect calibration line */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full h-full border-l border-b border-[#2a2a4e] relative">
            <div className="absolute bottom-0 left-0 w-full h-full">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <line x1="0" y1="100%" x2="100%" y2="0" stroke="#3a3a5e" strokeWidth="1" strokeDasharray="4" />
              </svg>
            </div>
            {/* Actual calibration curve */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <polyline
                points={points.map((p, i) => `${(i / (points.length - 1)) * 100}%,${100 - p.actual}%`).join(' ')}
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2"
              />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={`${(i / (points.length - 1)) * 100}%`}
                  cy={`${100 - p.actual}%`}
                  r="3"
                  fill="#8b5cf6"
                />
              ))}
            </svg>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-gray-500 pt-2">
          <span>0</span>
          <span>Predicted Confidence</span>
          <span>100</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-400">
        <Info size={12} className="inline mr-1" />
        Model slightly underconfident at high predictions
      </div>
    </div>
  );
}

export default function ModelPerformancePage() {
  const [selectedVersion, setSelectedVersion] = useState<string>('1');
  const currentModel = mockModelVersions.find(v => v.id === selectedVersion) || mockModelVersions[0];
  
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
            <h1 className="text-2xl font-bold">Model Performance Center</h1>
            <p className="text-gray-400 text-sm mt-1">
              Monitor accuracy, calibration, and feature importance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="bg-[#111118] border border-[#1a1a2e] rounded-lg px-3 py-2 text-sm"
          >
            {mockModelVersions.map(v => (
              <option key={v.id} value={v.id}>
                {v.version} {v.isProduction ? '(Production)' : ''}
              </option>
            ))}
          </select>
          <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center gap-2">
            <RefreshCw size={16} />
            Recalculate
          </button>
        </div>
      </div>

      {/* Current Model Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-purple-400" size={18} />
            <span className="text-sm text-gray-400">Accuracy</span>
          </div>
          <div className="text-3xl font-bold">{currentModel.accuracy}%</div>
          <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <TrendingUp size={12} />
            +2.3% vs baseline
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-blue-400" size={18} />
            <span className="text-sm text-gray-400">MAE (DPS)</span>
          </div>
          <div className="text-3xl font-bold">{currentModel.mae}</div>
          <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <TrendingDown size={12} />
            -0.7 vs baseline
          </div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={18} />
            <span className="text-sm text-gray-400">Calibration</span>
          </div>
          <div className="text-3xl font-bold">{currentModel.calibration}</div>
          <div className="text-xs text-gray-400 mt-1">Target: 0.85+</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="text-green-400" size={18} />
            <span className="text-sm text-gray-400">Training Samples</span>
          </div>
          <div className="text-3xl font-bold">{currentModel.trainingSamples.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">+1,613 new samples</div>
        </div>
        
        <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-orange-400" size={18} />
            <span className="text-sm text-gray-400">Last Trained</span>
          </div>
          <div className="text-xl font-bold">{currentModel.trainedAt}</div>
          <div className={cn(
            'text-xs px-2 py-0.5 rounded-full mt-2 inline-block',
            currentModel.status === 'active' && 'bg-green-500/20 text-green-400',
            currentModel.status === 'deprecated' && 'bg-gray-500/20 text-gray-400'
          )}>
            {currentModel.status}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccuracyChart data={mockAccuracyTrend} />
        <CalibrationCurve />
      </div>

      {/* Feature Importance */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <BarChart3 className="text-purple-400" size={18} />
            Feature Importance (Top 10)
          </h2>
          <button className="text-xs text-purple-400 hover:text-purple-300">
            View All 119 Features →
          </button>
        </div>
        
        <div className="space-y-3">
          {mockFeatureImportance.map((feature, i) => (
            <div key={feature.name} className="flex items-center gap-4">
              <span className="w-6 text-xs text-gray-500">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{feature.name}</span>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      feature.group === 'Viral Patterns' && 'bg-purple-500/20 text-purple-400',
                      feature.group === 'Emotional' && 'bg-red-500/20 text-red-400',
                      feature.group === 'Trend' && 'bg-blue-500/20 text-blue-400',
                      feature.group === 'Creator' && 'bg-green-500/20 text-green-400',
                      feature.group === 'Content' && 'bg-yellow-500/20 text-yellow-400',
                      feature.group === 'Audio' && 'bg-orange-500/20 text-orange-400',
                      feature.group === 'Visual' && 'bg-pink-500/20 text-pink-400',
                      feature.group === 'Text' && 'bg-cyan-500/20 text-cyan-400',
                      feature.group === 'Timing' && 'bg-indigo-500/20 text-indigo-400'
                    )}>
                      {feature.group}
                    </span>
                    <span className="text-sm text-gray-300">{(feature.importance * 100).toFixed(1)}%</span>
                    {feature.drift !== 0 && (
                      <span className={cn(
                        'text-xs flex items-center gap-0.5',
                        feature.drift > 0 ? 'text-green-400' : feature.drift < -0.03 ? 'text-red-400' : 'text-yellow-400'
                      )}>
                        {feature.drift > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(feature.drift * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all"
                    style={{ width: `${feature.importance * 100 * 6}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Version History */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <GitBranch className="text-blue-400" size={18} />
            Model Version History
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-[#1a1a2e]">
                <th className="pb-3 font-medium">Version</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Trained</th>
                <th className="pb-3 font-medium">Samples</th>
                <th className="pb-3 font-medium">Accuracy</th>
                <th className="pb-3 font-medium">MAE</th>
                <th className="pb-3 font-medium">Calibration</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockModelVersions.map((model) => (
                <tr key={model.id} className="border-b border-[#1a1a2e] last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.version}</span>
                      {model.isProduction && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                          PROD
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-400">{model.modelType}</td>
                  <td className="py-3 text-sm text-gray-400">{model.trainedAt}</td>
                  <td className="py-3 text-sm">{model.trainingSamples.toLocaleString()}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-sm font-medium',
                      model.accuracy >= 72 ? 'text-green-400' : model.accuracy >= 70 ? 'text-yellow-400' : 'text-red-400'
                    )}>
                      {model.accuracy}%
                    </span>
                  </td>
                  <td className="py-3 text-sm">{model.mae}</td>
                  <td className="py-3 text-sm">{model.calibration}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      model.status === 'active' && 'bg-green-500/20 text-green-400',
                      model.status === 'deprecated' && 'bg-gray-500/20 text-gray-400',
                      model.status === 'training' && 'bg-blue-500/20 text-blue-400',
                      model.status === 'failed' && 'bg-red-500/20 text-red-400'
                    )}>
                      {model.status}
                    </span>
                  </td>
                  <td className="py-3">
                    {!model.isProduction && model.status === 'active' && (
                      <button className="text-xs text-purple-400 hover:text-purple-300">
                        Promote →
                      </button>
                    )}
                    {model.isProduction && (
                      <button className="text-xs text-gray-400 hover:text-gray-300">
                        Rollback
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drift Detection */}
      <div className="bg-[#111118] border border-[#1a1a2e] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="text-yellow-400" size={18} />
            Drift Detection
          </h2>
          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1">
            <CheckCircle size={12} />
            No significant drift detected
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
            <div className="text-sm text-gray-400 mb-2">Feature Distribution Shift</div>
            <div className="text-2xl font-bold text-green-400">2.3%</div>
            <div className="text-xs text-gray-500">Threshold: 10%</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
            <div className="text-sm text-gray-400 mb-2">Prediction Distribution Shift</div>
            <div className="text-2xl font-bold text-green-400">1.8%</div>
            <div className="text-xs text-gray-500">Threshold: 15%</div>
          </div>
          <div className="bg-[#0a0a0f] rounded-lg p-4 border border-[#1a1a2e]">
            <div className="text-sm text-gray-400 mb-2">Accuracy Degradation</div>
            <div className="text-2xl font-bold text-green-400">+2.3%</div>
            <div className="text-xs text-gray-500">vs 7-day baseline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
























































































