'use client';

/**
 * Workflow 1 - Optimize Phase Components (Steps 4.1 - 4.2)
 * 
 * Step 4.1: Optimization Checklist
 * Step 4.2: DPS Prediction
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, Zap, ChevronLeft, ChevronRight, Check, 
  Loader2, AlertCircle, TrendingUp, Target, Sparkles,
  Clock, BarChart3, Lightbulb, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  predictDPS,
  type DPSPredictionResponse,
  type NicheKey,
  type ContentFormatKey,
  getNicheLabel,
} from '@/lib/workflow-shared';
import type { CreateData } from './CreatePhase';
import type { PlanData } from './PlanPhase';

// Optimize phase data structure
export interface OptimizeData {
  // Step 4.1 - Checklist
  checklist: ChecklistItem[];
  checklistCompletedAt?: string;
  // Step 4.2 - DPS Prediction
  prediction?: DPSPredictionResponse;
  predictionRequestedAt?: string;
  predictionCompletedAt?: string;
}

export interface ChecklistItem {
  id: string;
  category: 'hook' | 'content' | 'cta' | 'seo' | 'technical';
  label: string;
  checked: boolean;
  tip?: string;
}

// Default optimization checklist
const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Hook
  { id: 'hook_1', category: 'hook', label: 'Hook grabs attention in first 1-2 seconds', checked: false, tip: 'Pattern interrupts work best' },
  { id: 'hook_2', category: 'hook', label: 'Opening creates curiosity or tension', checked: false, tip: 'Promise value upfront' },
  { id: 'hook_3', category: 'hook', label: 'No wasted intro ("Hey guys...")', checked: false, tip: 'Jump straight into value' },
  // Content
  { id: 'content_1', category: 'content', label: 'Clear value proposition stated early', checked: false },
  { id: 'content_2', category: 'content', label: 'Content delivers on hook promise', checked: false },
  { id: 'content_3', category: 'content', label: 'Pacing keeps attention (no dead air)', checked: false, tip: 'Cut the pauses' },
  { id: 'content_4', category: 'content', label: 'Visual variety maintains interest', checked: false },
  // CTA
  { id: 'cta_1', category: 'cta', label: 'Clear call-to-action at end', checked: false },
  { id: 'cta_2', category: 'cta', label: 'CTA is specific (not just "follow me")', checked: false, tip: 'Tell them exactly what to do' },
  // SEO
  { id: 'seo_1', category: 'seo', label: 'Using relevant hashtags (3-5 minimum)', checked: false },
  { id: 'seo_2', category: 'seo', label: 'Caption includes keywords', checked: false },
  { id: 'seo_3', category: 'seo', label: 'Trending sound selected (if applicable)', checked: false },
  // Technical
  { id: 'tech_1', category: 'technical', label: 'Video is under 60 seconds (ideal 15-30s)', checked: false },
  { id: 'tech_2', category: 'technical', label: 'Audio is clear and audible', checked: false },
  { id: 'tech_3', category: 'technical', label: 'Text is readable on mobile', checked: false },
];

// Shared props interface
interface StepProps {
  data: OptimizeData;
  createData: CreateData;
  planData: PlanData;
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
  };
  onUpdate: (updates: Partial<OptimizeData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// ============================================
// Step 4.1: Optimization Checklist
// ============================================
export function OptimizationChecklistStep({ data, createData, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  // Initialize checklist if empty
  React.useEffect(() => {
    if (!data.checklist || data.checklist.length === 0) {
      onUpdate({ checklist: DEFAULT_CHECKLIST });
    }
  }, [data.checklist, onUpdate]);

  const handleToggle = (id: string) => {
    const newChecklist = (data.checklist || DEFAULT_CHECKLIST).map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onUpdate({ checklist: newChecklist });
  };

  const checklist = data.checklist || DEFAULT_CHECKLIST;
  const checkedCount = checklist.filter(item => item.checked).length;
  const progress = (checkedCount / checklist.length) * 100;

  const categories = [
    { key: 'hook', label: 'Hook', icon: <Zap className="w-4 h-4" />, color: 'text-yellow-400' },
    { key: 'content', label: 'Content', icon: <Target className="w-4 h-4" />, color: 'text-blue-400' },
    { key: 'cta', label: 'Call to Action', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-400' },
    { key: 'seo', label: 'SEO', icon: <BarChart3 className="w-4 h-4" />, color: 'text-purple-400' },
    { key: 'technical', label: 'Technical', icon: <CheckSquare className="w-4 h-4" />, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-4">
          <CheckSquare className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Pre-Publish Checklist</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Verify your content is optimized for maximum reach
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Optimization Score</span>
          <span className={`text-sm font-medium ${progress >= 80 ? 'text-green-400' : progress >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {checkedCount}/{checklist.length} ({Math.round(progress)}%)
          </span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className={`h-full ${progress >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      <div className="max-w-2xl mx-auto space-y-6">
        {categories.map((category) => {
          const items = checklist.filter(item => item.category === category.key);
          const categoryChecked = items.filter(item => item.checked).length;
          
          return (
            <div key={category.key} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className={category.color}>{category.icon}</span>
                <h3 className="font-medium text-white">{category.label}</h3>
                <span className="text-xs text-white/40 ml-auto">{categoryChecked}/{items.length}</span>
              </div>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleToggle(item.id)}
                    className={`
                      w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left
                      ${item.checked 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-white/5 border-white/10 hover:border-white/30'}
                    `}
                  >
                    <div className={`
                      w-5 h-5 rounded flex items-center justify-center mt-0.5 flex-shrink-0
                      ${item.checked ? 'bg-green-500' : 'border border-white/30'}
                    `}>
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${item.checked ? 'text-green-300' : 'text-white'}`}>
                        {item.label}
                      </p>
                      {item.tip && !item.checked && (
                        <p className="text-xs text-white/40 mt-1 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          {item.tip}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={() => {
            onUpdate({ checklistCompletedAt: new Date().toISOString() });
            onNext();
          }}
          disabled={progress < 50}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${progress >= 50
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Continue to Prediction
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 4.2: DPS Prediction
// ============================================
export function DPSPredictionStep({ data, createData, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetPrediction = async () => {
    setIsLoading(true);
    setError(null);
    onUpdate({ predictionRequestedAt: new Date().toISOString() });

    try {
      // Build transcript from beats
      const transcript = createData.beats
        ?.filter(b => b.content)
        .map(b => b.content)
        .join('\n\n') || '';

      const response = await predictDPS({
        transcript,
        niche: researchData.niche,
        format: planData.contentFormat,
        hashtags: createData.hashtags,
        hooks: createData.beats?.filter(b => b.beatKey === 'hook').map(b => b.content) || [],
      });

      onUpdate({ 
        prediction: response,
        predictionCompletedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const prediction = data.prediction;
  const tierColors: Record<string, string> = {
    'poor': 'from-red-500 to-red-600',
    'average': 'from-yellow-500 to-orange-500',
    'good': 'from-green-500 to-emerald-500',
    'excellent': 'from-blue-500 to-purple-500',
    'viral': 'from-purple-500 to-pink-500',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-4">
          <Zap className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">DPS Prediction</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Get an AI prediction of your content&apos;s viral potential
        </p>
      </div>

      {/* Prediction Content */}
      <div className="max-w-2xl mx-auto">
        {!prediction && !isLoading && (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Ready to Analyze</h3>
            <p className="text-white/60 mb-6 max-w-sm mx-auto">
              Our AI will analyze your beat structure, hashtags, and content to predict virality
            </p>
            <button
              onClick={handleGetPrediction}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-medium hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              Get Prediction
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Analyzing Content...</h3>
            <p className="text-white/60">This may take up to 25 seconds</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-white/40 text-sm">
              <Clock className="w-4 h-4" />
              Running Pack 1/2/3/V analysis
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Prediction Failed</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={handleGetPrediction}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {prediction && (
          <div className="space-y-6">
            {/* Main Score */}
            <div className={`
              relative overflow-hidden rounded-2xl p-8 text-center
              bg-gradient-to-br ${tierColors[prediction.predicted_tier_7d] || tierColors['average']}
            `}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative">
                <p className="text-white/80 text-sm uppercase tracking-wider mb-2">Predicted DPS (7-day)</p>
                <p className="text-7xl font-bold text-white mb-2">{prediction.predicted_dps_7d}</p>
                <p className="text-2xl font-medium text-white/90 capitalize">{prediction.predicted_tier_7d}</p>
                <div className="flex items-center justify-center gap-4 mt-4 text-white/70 text-sm">
                  <span>Confidence: {Math.round(prediction.confidence * 100)}%</span>
                  <span>•</span>
                  <span>Run: {prediction.run_id?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Tier</span>
                </div>
                <p className="text-xl font-bold text-white capitalize">{prediction.predicted_tier_7d}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">Confidence</span>
                </div>
                <p className="text-xl font-bold text-white">{Math.round(prediction.confidence * 100)}%</p>
              </div>
            </div>

            {/* Qualitative Analysis */}
            {prediction.qualitative_analysis && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  AI Insights
                </h4>
                
                {prediction.qualitative_analysis.editing_suggestions?.changes && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/60">Improvement Suggestions:</p>
                    {prediction.qualitative_analysis.editing_suggestions.changes.slice(0, 3).map((change: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                        <ArrowUp className="w-4 h-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-white text-sm">{change.suggestion}</p>
                          {change.estimated_lift && (
                            <p className="text-xs text-green-400 mt-1">+{change.estimated_lift} potential lift</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {prediction.qualitative_analysis.viral_mechanics?.mechanics && (
                  <div className="mt-4">
                    <p className="text-sm text-white/60 mb-2">Viral Mechanics Detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {prediction.qualitative_analysis.viral_mechanics.mechanics.slice(0, 5).map((mech: any, i: number) => (
                        <span 
                          key={i}
                          className={`
                            px-3 py-1 rounded-full text-xs font-medium
                            ${mech.strength > 70 ? 'bg-green-500/20 text-green-400' : 
                              mech.strength > 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                              'bg-white/10 text-white/60'}
                          `}
                        >
                          {mech.name} ({mech.strength}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Re-run button */}
            <div className="text-center">
              <button
                onClick={handleGetPrediction}
                disabled={isLoading}
                className="text-white/50 hover:text-white text-sm transition-colors"
              >
                Run prediction again
              </button>
            </div>
          </div>
        )}

        {/* Error state with skip option */}
        {error && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
            <p className="text-yellow-400 text-sm mb-3">
              Prediction API unavailable. You can skip and proceed without prediction.
            </p>
            <button
              onClick={onNext}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-all"
            >
              Skip Prediction & Continue →
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!prediction && !error}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${prediction || error
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Complete Optimize Phase
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Phase Component
// ============================================
interface OptimizePhaseProps {
  step: number;
  data: OptimizeData;
  createData: CreateData;
  planData: PlanData;
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
  };
  onUpdate: (updates: Partial<OptimizeData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OptimizePhase({ step, data, createData, planData, researchData, onUpdate, onNext, onBack }: OptimizePhaseProps) {
  const stepComponents = [
    <OptimizationChecklistStep key="checklist" data={data} createData={createData} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <DPSPredictionStep key="prediction" data={data} createData={createData} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {stepComponents[step - 1]}
      </motion.div>
    </AnimatePresence>
  );
}
