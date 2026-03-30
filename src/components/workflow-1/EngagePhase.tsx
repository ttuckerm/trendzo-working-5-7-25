'use client';

/**
 * Workflow 1 - Engage & Learn Phase Components (Steps 6.1 - 6.2)
 * 
 * Step 6.1: Results Tracker - Track views, retention, engagement metrics
 * Step 6.2: Content Iteration - Get suggestions for improvement based on results
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, ChevronLeft, ChevronRight, Check, 
  TrendingUp, TrendingDown, Eye, Heart, MessageCircle,
  Share2, Clock, Users, Target, Lightbulb, RefreshCw,
  AlertTriangle, ArrowRight, Sparkles, RotateCcw
} from 'lucide-react';
import type { CreateData } from './CreatePhase';
import type { OptimizeData } from './OptimizePhase';
import type { PublishData } from './PublishPhase';

// Engage phase data structure
export interface EngageData {
  // Results Tracker
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    avgWatchTime: number; // seconds
    completionRate: number; // percentage
    followerGain: number;
    profileVisits: number;
  };
  metricsUpdatedAt?: string;
  
  // Content Iteration
  iterationNotes?: string;
  improvements?: string[];
  nextVideoIdea?: string;
  lessonsLearned?: string[];
  
  // Status
  resultsReviewed?: boolean;
  iterationComplete?: boolean;
}

// Shared props interface
interface StepProps {
  data: EngageData;
  createData: CreateData;
  optimizeData: OptimizeData;
  publishData: PublishData;
  onUpdate: (updates: Partial<EngageData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// ============================================
// Step 6.1: Results Tracker
// ============================================
export function ResultsTrackerStep({ data, optimizeData, publishData, onUpdate, onNext, onBack }: StepProps) {
  const [metrics, setMetrics] = useState<EngageData['metrics']>(data.metrics || {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    avgWatchTime: 0,
    completionRate: 0,
    followerGain: 0,
    profileVisits: 0,
  });

  const handleMetricChange = (key: keyof NonNullable<EngageData['metrics']>, value: string) => {
    const numValue = parseFloat(value) || 0;
    setMetrics(prev => prev ? { ...prev, [key]: numValue } : undefined);
  };

  const handleSaveMetrics = () => {
    onUpdate({ 
      metrics, 
      metricsUpdatedAt: new Date().toISOString(),
      resultsReviewed: true 
    });
  };

  // Calculate engagement rate
  const engagementRate = metrics && metrics.views > 0 
    ? ((metrics.likes + metrics.comments + metrics.shares + metrics.saves) / metrics.views * 100).toFixed(2)
    : '0.00';

  // Compare to prediction
  const predictedDPS = optimizeData.prediction?.predicted_dps_7d;
  const actualPerformance = metrics && metrics.views > 0 ? 'calculated' : 'pending';

  const metricInputs = [
    { key: 'views', label: 'Views', icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { key: 'likes', label: 'Likes', icon: Heart, color: 'from-pink-500 to-rose-500' },
    { key: 'comments', label: 'Comments', icon: MessageCircle, color: 'from-purple-500 to-violet-500' },
    { key: 'shares', label: 'Shares', icon: Share2, color: 'from-green-500 to-emerald-500' },
    { key: 'saves', label: 'Saves', icon: Target, color: 'from-yellow-500 to-orange-500' },
    { key: 'followerGain', label: 'New Followers', icon: Users, color: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 mb-4">
          <BarChart3 className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Track Your Results</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Enter your video performance metrics to learn and improve
        </p>
      </div>

      {/* Published Status */}
      <div className="max-w-2xl mx-auto">
        <div className={`
          p-4 rounded-xl border flex items-center gap-4
          ${publishData.status === 'published' 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-yellow-500/10 border-yellow-500/30'}
        `}>
          {publishData.status === 'published' ? (
            <Check className="w-6 h-6 text-green-400" />
          ) : (
            <Clock className="w-6 h-6 text-yellow-400" />
          )}
          <div>
            <p className="text-white font-medium">
              {publishData.status === 'published' 
                ? `Published to ${publishData.platform || 'platform'}` 
                : `Scheduled for ${publishData.scheduledFor ? new Date(publishData.scheduledFor).toLocaleString() : 'later'}`}
            </p>
            <p className="text-white/50 text-sm">
              {publishData.publishedAt 
                ? `On ${new Date(publishData.publishedAt).toLocaleString()}`
                : 'Waiting for publish date'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4">Enter Your Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metricInputs.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/60 text-sm">{label}</span>
              </div>
              <input
                type="number"
                min="0"
                value={metrics?.[key as keyof typeof metrics] || 0}
                onChange={(e) => handleMetricChange(key as keyof NonNullable<EngageData['metrics']>, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xl font-bold focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Watch Time & Completion */}
      <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-white/60 text-sm">Avg Watch Time (seconds)</span>
          </div>
          <input
            type="number"
            min="0"
            step="0.1"
            value={metrics?.avgWatchTime || 0}
            onChange={(e) => handleMetricChange('avgWatchTime', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xl font-bold focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-white/60 text-sm">Completion Rate (%)</span>
          </div>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={metrics?.completionRate || 0}
            onChange={(e) => handleMetricChange('completionRate', e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xl font-bold focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Calculated Stats */}
      {metrics && metrics.views > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Performance Analysis
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <p className="text-white/50 text-sm mb-1">Engagement Rate</p>
                <p className="text-2xl font-bold text-white">{engagementRate}%</p>
                <p className="text-xs text-white/40 mt-1">
                  {parseFloat(engagementRate) > 5 ? 'Excellent!' : parseFloat(engagementRate) > 2 ? 'Good' : 'Below average'}
                </p>
              </div>
              
              {predictedDPS && (
                <div className="text-center p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-sm mb-1">Predicted DPS</p>
                  <p className="text-2xl font-bold text-white">{predictedDPS}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {optimizeData.prediction?.predicted_tier_7d || 'N/A'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-white/5">
              <p className="text-white/70 text-sm">
                {metrics.views >= 1000 
                  ? metrics.views >= 10000 
                    ? '🔥 Great performance! Your content is resonating well.' 
                    : '📈 Solid start! Keep engaging with your audience.'
                  : '⏳ Early days - give it time to pick up momentum.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save & Navigation */}
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
        <div className="flex gap-3 ml-auto">
          <button
            onClick={handleSaveMetrics}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <Check className="w-5 h-5" />
            Save Metrics
          </button>
          <button
            onClick={() => {
              handleSaveMetrics();
              onNext();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white hover:opacity-90 transition-all"
          >
            Continue to Iteration
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Step 6.2: Content Iteration
// ============================================
export function ContentIterationStep({ data, createData, optimizeData, onUpdate, onNext, onBack }: StepProps) {
  const [notes, setNotes] = useState(data.iterationNotes || '');
  const [improvements, setImprovements] = useState<string[]>(data.improvements || []);
  const [newImprovement, setNewImprovement] = useState('');
  const [nextIdea, setNextIdea] = useState(data.nextVideoIdea || '');
  const [lessons, setLessons] = useState<string[]>(data.lessonsLearned || []);
  const [newLesson, setNewLesson] = useState('');

  const handleAddImprovement = () => {
    if (newImprovement.trim()) {
      setImprovements([...improvements, newImprovement.trim()]);
      setNewImprovement('');
    }
  };

  const handleAddLesson = () => {
    if (newLesson.trim()) {
      setLessons([...lessons, newLesson.trim()]);
      setNewLesson('');
    }
  };

  const handleRemoveImprovement = (index: number) => {
    setImprovements(improvements.filter((_, i) => i !== index));
  };

  const handleRemoveLesson = (index: number) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    onUpdate({
      iterationNotes: notes,
      improvements,
      nextVideoIdea: nextIdea,
      lessonsLearned: lessons,
      iterationComplete: true,
    });
    onNext();
  };

  // Performance-based suggestions
  const metrics = data.metrics;
  const suggestions: { icon: React.ReactNode; title: string; suggestion: string; type: 'improve' | 'keep' | 'test' }[] = [];

  if (metrics) {
    // Hook analysis
    if (metrics.completionRate < 30) {
      suggestions.push({
        icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        title: 'Hook Needs Work',
        suggestion: 'Low completion rate suggests your hook isn\'t capturing attention. Try a more provocative opening statement or visual.',
        type: 'improve'
      });
    } else if (metrics.completionRate > 60) {
      suggestions.push({
        icon: <Check className="w-5 h-5 text-green-400" />,
        title: 'Strong Hook',
        suggestion: 'Your hook is working! Keep this style for future content.',
        type: 'keep'
      });
    }

    // Engagement analysis
    const engagementRate = metrics.views > 0 
      ? (metrics.likes + metrics.comments + metrics.shares) / metrics.views * 100 
      : 0;

    if (engagementRate < 2 && metrics.views > 100) {
      suggestions.push({
        icon: <MessageCircle className="w-5 h-5 text-orange-400" />,
        title: 'Boost Engagement',
        suggestion: 'Add a clear CTA asking viewers to comment or share. Question-based CTAs work best.',
        type: 'improve'
      });
    }

    // Shares analysis
    if (metrics.shares > 0 && metrics.shares / metrics.views > 0.01) {
      suggestions.push({
        icon: <Share2 className="w-5 h-5 text-green-400" />,
        title: 'Shareable Content',
        suggestion: 'People are sharing your content! This indicates high value. Double down on this topic.',
        type: 'keep'
      });
    }

    // Saves analysis
    if (metrics.saves > metrics.likes * 0.3) {
      suggestions.push({
        icon: <Target className="w-5 h-5 text-purple-400" />,
        title: 'High Save Rate',
        suggestion: 'People are saving your content for later. Consider creating a series on this topic.',
        type: 'keep'
      });
    }
  }

  // Add generic suggestions if no metrics
  if (suggestions.length === 0) {
    suggestions.push({
      icon: <Lightbulb className="w-5 h-5 text-yellow-400" />,
      title: 'Test Different Hooks',
      suggestion: 'Try 3 different hook styles: question, bold statement, or curiosity gap.',
      type: 'test'
    });
    suggestions.push({
      icon: <RefreshCw className="w-5 h-5 text-blue-400" />,
      title: 'Repurpose Content',
      suggestion: 'Take your best-performing content and adapt it for different angles or audiences.',
      type: 'test'
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
          <RefreshCw className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Learn & Iterate</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Capture insights and plan your next content based on what worked
        </p>
      </div>

      {/* AI Suggestions */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Performance Insights
        </h3>
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-xl border
                ${suggestion.type === 'improve' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  suggestion.type === 'keep' ? 'bg-green-500/10 border-green-500/30' :
                  'bg-blue-500/10 border-blue-500/30'}
              `}
            >
              <div className="flex items-start gap-3">
                {suggestion.icon}
                <div>
                  <p className="text-white font-medium">{suggestion.title}</p>
                  <p className="text-white/60 text-sm mt-1">{suggestion.suggestion}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lessons Learned */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4">What did you learn?</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newLesson}
              onChange={(e) => setNewLesson(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLesson()}
              placeholder="Add a lesson learned..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleAddLesson}
              className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
              >
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-white/80 text-sm">{lesson}</span>
                <button
                  onClick={() => handleRemoveLesson(index)}
                  className="text-white/40 hover:text-white/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvements for Next Time */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4">What will you improve?</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newImprovement}
              onChange={(e) => setNewImprovement(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddImprovement()}
              placeholder="Add an improvement for next time..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50"
            />
            <button
              onClick={handleAddImprovement}
              className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {improvements.map((improvement, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg"
              >
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-white/80 text-sm">{improvement}</span>
                <button
                  onClick={() => handleRemoveImprovement(index)}
                  className="text-white/40 hover:text-white/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Video Idea */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Next Video Idea
        </h3>
        <textarea
          value={nextIdea}
          onChange={(e) => setNextIdea(e.target.value)}
          placeholder="Based on what you learned, what's your next video idea?"
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 resize-none"
        />
      </div>

      {/* Additional Notes */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-4">Additional Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other thoughts, observations, or ideas..."
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Results
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            onClick={handleComplete}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-green-500/30"
          >
            <Check className="w-5 h-5" />
            Complete Workflow
          </button>
        </div>
      </div>

      {/* Celebration on Complete */}
      {data.iterationComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-white mb-2">Workflow Complete!</h3>
          <p className="text-white/60 mb-6">
            You've completed the full content creation cycle. Ready for your next video?
          </p>
          <button
            onClick={() => {
              // Reset state or navigate to start
              window.location.href = '/admin/workflows/creator';
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Start New Workflow
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// Main Phase Component
// ============================================
interface EngagePhaseProps {
  step: number;
  data: EngageData;
  createData: CreateData;
  optimizeData: OptimizeData;
  publishData: PublishData;
  onUpdate: (updates: Partial<EngageData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EngagePhase({ step, data, createData, optimizeData, publishData, onUpdate, onNext, onBack }: EngagePhaseProps) {
  const handleStepBack = () => {
    if (step > 1) {
      // Go back within phase
      onBack();
    } else {
      // Go back to previous phase
      onBack();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {step === 1 && (
          <ResultsTrackerStep 
            data={data} 
            createData={createData}
            optimizeData={optimizeData}
            publishData={publishData}
            onUpdate={onUpdate} 
            onNext={onNext} 
            onBack={onBack} 
          />
        )}
        {step === 2 && (
          <ContentIterationStep 
            data={data}
            createData={createData}
            optimizeData={optimizeData}
            publishData={publishData}
            onUpdate={onUpdate} 
            onNext={onNext} 
            onBack={handleStepBack} 
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
