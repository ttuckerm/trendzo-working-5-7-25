'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BarChart3,
  Brain,
  AlertTriangle,
  CheckCircle,
  Database,
  Layers,
  GitBranch,
  Award,
  Filter,
  Info,
  HelpCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineEvent {
  type: string;
  timestamp: string;
  title: string;
  details: Record<string, any>;
}

interface NicheComposition {
  niche: string;
  count: number;
  avg_vps: number;
  min_vps: number;
  max_vps: number;
}

interface TierComposition {
  tier: string;
  count: number;
}

interface ModeComposition {
  mode: string;
  count: number;
}

interface ErrorPatterns {
  overall: { mae: number; mean_error: number; rmse: number; within_10vps_pct: number; within_pred_range_pct: number | null; n: number };
  per_niche: { niche: string; n: number; avg_error: number; mae: number; bias: string }[];
  error_buckets: { label: string; count: number; pct: number }[];
  confusion_matrix: Record<string, Record<string, number>>;
  confidence_calibration: { range: string; count: number; mae: number; within_10vps_pct: number }[];
  worst_misses: { predicted: number; actual: number; error: number; niche: string; confidence: number | null; created_at: string }[];
}

interface EvalTrendItem {
  computed_at: string;
  n: number;
  spearman_rho: number;
  mae: number;
  within_range_pct: number;
  by_niche: any;
  rho_trend: 'improved' | 'declined' | 'unchanged' | null;
  mae_trend: 'improved' | 'declined' | 'unchanged' | null;
}

interface GrowthPoint {
  date: string;
  daily_new: number;
  cumulative: number;
}

interface ModelVersion {
  id: string;
  version: string;
  status: string;
  config: { model_type?: string; hyperparameters?: Record<string, any> } | null;
  hyperparameters: Record<string, any> | null;
  train_samples: number | null;
  accuracy: number | null;
  mae: number | null;
  rmse: number | null;
  calibration: number | null;
  feature_importance: Record<string, number> | null;
  feature_count: number | null;
  created_at: string;
  deployed_at: string | null;
  archived_at: string | null;
  notes: string | null;
}

interface HistoryData {
  success: boolean;
  timeline: TimelineEvent[];
  models: ModelVersion[];
  model_segments: Record<string, any[]>;
  data_composition: {
    by_niche: NicheComposition[];
    by_tier: TierComposition[];
    by_labeling_mode: ModeComposition[];
    total: number;
  };
  error_patterns: ErrorPatterns | null;
  evaluation_trend: EvalTrendItem[];
  growth_curve: GrowthPoint[];
  current_status: {
    total_labeled: number;
    production_model: { version: string; status: string; trained_at: string; train_samples?: number | null } | null;
    latest_spearman_rho: number | null;
    days_since_eval: number | null;
    next_milestone: number | null;
    remaining_to_milestone: number | null;
    labels_per_week: number | null;
    weeks_to_milestone: number | null;
    first_label_date: string | null;
    unique_niches: number;
    total_niches_available: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const TIER_COLORS: Record<string, string> = {
  'mega-viral': 'bg-purple-500',
  'viral': 'bg-pink-500',
  'good': 'bg-blue-500',
  'average': 'bg-zinc-500',
  'low': 'bg-zinc-700',
};

const TIER_TEXT_COLORS: Record<string, string> = {
  'mega-viral': 'text-purple-400',
  'viral': 'text-pink-400',
  'good': 'text-blue-400',
  'average': 'text-zinc-400',
  'low': 'text-zinc-500',
};

const EVENT_COLORS: Record<string, string> = {
  labeling_milestone: 'bg-green-500',
  evaluation_run: 'bg-blue-500',
  model_created: 'bg-purple-500',
  model_deployed: 'bg-purple-400',
  model_deprecated: 'bg-zinc-600',
  training_job: 'bg-zinc-500',
};

/** Translate raw XGBoost feature names to plain English */
const FEATURE_LABELS: Record<string, string> = {
  hook_strength: 'Hook quality',
  emotional_intensity: 'Emotional intensity',
  trend_alignment: 'Trend alignment',
  storytelling_score: 'Storytelling quality',
  visual_quality: 'Visual quality',
  audio_quality: 'Audio quality',
  pacing_score: 'Pacing & rhythm',
  engagement_potential: 'Engagement potential',
  shareability: 'Shareability',
  novelty_score: 'Novelty / uniqueness',
  editing_quality: 'Editing quality',
  thumbnail_appeal: 'Thumbnail appeal',
  cta_effectiveness: 'Call-to-action strength',
  retention_potential: 'Retention potential',
  controversy_level: 'Controversy level',
  educational_value: 'Educational value',
  entertainment_value: 'Entertainment value',
  relatability: 'Relatability',
  production_value: 'Production value',
  timing_relevance: 'Timing relevance',
  niche_fit: 'Niche fit',
  virality_matrix_score: 'Virality matrix',
  vm_hook_strength: 'Hook quality (matrix)',
  vm_emotional_intensity: 'Emotional intensity (matrix)',
  vm_trend_alignment: 'Trend alignment (matrix)',
  llm_hook_strength: 'Hook quality (LLM)',
  llm_consensus_score: 'LLM consensus',
  emotional_intensity_score: 'Emotional intensity (scored)',
  council_agreement: 'Council agreement',
  council_mean_score: 'Council mean score',
};

function humanFeatureName(raw: string): string {
  return FEATURE_LABELS[raw] || raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function TrendIcon({ trend }: { trend: string | null }) {
  if (trend === 'improved') return <TrendingUp className="w-4 h-4 text-green-400 inline" />;
  if (trend === 'declined') return <TrendingDown className="w-4 h-4 text-red-400 inline" />;
  return <Minus className="w-4 h-4 text-zinc-500 inline" />;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-zinc-500 text-sm">
      {message}
    </div>
  );
}

/** Tooltip wrapper */
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group inline-flex items-center">
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 px-3 py-2 rounded-lg shadow-lg whitespace-normal max-w-xs z-50 pointer-events-none">
        {text}
      </span>
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TrainingHistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEval, setExpandedEval] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showExperimentalModels, setShowExperimentalModels] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/training/history');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'API returned failure');
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="bg-red-900/30 border border-red-800 rounded p-4 text-red-300">
          Error loading training history: {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { timeline, models, model_segments, data_composition, error_patterns, evaluation_trend, growth_curve, current_status } = data;

  // Separate production model from experimental
  const productionModel = models.find(m => m.deployed_at != null || m.status === 'active');
  const experimentalModels = models.filter(m => m.id !== productionModel?.id);

  // Compute tier distribution insights
  const tierInsights = (() => {
    if (data_composition.total === 0) return null;
    const tiers = data_composition.by_tier;
    const totalCount = data_composition.total;
    const findPct = (tier: string) => {
      const entry = tiers.find(t => t.tier === tier);
      return entry ? Math.round((entry.count / totalCount) * 100) : 0;
    };
    const lowPct = findPct('low');
    const megaPct = findPct('mega-viral');
    const edgePct = lowPct + megaPct;
    const goodPct = findPct('good');
    return { lowPct, megaPct, edgePct, goodPct };
  })();

  // Error distribution summary
  const errorDistSummary = (() => {
    if (!error_patterns) return null;
    const overBuckets = error_patterns.error_buckets.filter(b => b.label.includes('Over'));
    const overPct = overBuckets.reduce((s, b) => s + b.pct, 0);
    return { overPct: Math.round(overPct) };
  })();

  // Confusion matrix insight
  const confusionInsight = (() => {
    if (!error_patterns) return null;
    const cm = error_patterns.confusion_matrix;
    const tiers = ['mega-viral', 'viral', 'good', 'average', 'low'];
    const neverPredicted: string[] = [];
    for (const tier of tiers) {
      const totalPredicted = tiers.reduce((s, actual) => s + (cm[tier]?.[actual] || 0), 0);
      if (totalPredicted === 0) neverPredicted.push(tier);
    }
    // Find where most predictions cluster
    const predCounts: Record<string, number> = {};
    for (const predicted of tiers) {
      predCounts[predicted] = tiers.reduce((s, actual) => s + (cm[predicted]?.[actual] || 0), 0);
    }
    const topPredicted = Object.entries(predCounts)
      .filter(([, c]) => c > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([t]) => t);
    return { neverPredicted, topPredicted };
  })();

  // Confidence calibration insight
  const confidenceInsight = (() => {
    if (!error_patterns) return null;
    const cal = error_patterns.confidence_calibration;
    const highBucket = cal.find(c => c.range === '> 0.75');
    const midBuckets = cal.filter(c => c.range === '0.25 \u2013 0.50' || c.range === '0.50 \u2013 0.75');
    const midWithData = midBuckets.filter(b => b.count > 0);
    if (highBucket && highBucket.count > 0 && midWithData.length > 0) {
      const bestMidMAE = Math.min(...midWithData.map(b => b.mae));
      if (highBucket.mae > bestMidMAE) {
        return { miscalibrated: true, highMAE: highBucket.mae, midMAE: bestMidMAE };
      }
    }
    return { miscalibrated: false, highMAE: 0, midMAE: 0 };
  })();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/operations/training/base" className="text-zinc-400 hover:text-zinc-200">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Training History</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Milestone Progress */}
      {current_status.next_milestone && (
        <div className="mb-6 bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-300 font-medium">
              <Target className="w-4 h-4 inline mr-1" />
              Next milestone: {current_status.next_milestone} labeled videos
            </span>
            <span className="text-sm text-yellow-400">
              {current_status.remaining_to_milestone} remaining
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (current_status.total_labeled / current_status.next_milestone) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Health Summary Card — first thing the user sees                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-zinc-400" />
            Model Health Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <span className="text-zinc-500">Model:</span>{' '}
              <span className="text-zinc-200">
                {current_status.production_model
                  ? `${current_status.production_model.version} (${
                      (current_status.production_model.train_samples ?? 0) === 0
                        ? 'synthetic data, no real training yet'
                        : `trained on ${current_status.production_model.train_samples} real samples`
                    })`
                  : 'No production model'
                }
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Data:</span>{' '}
              <span className="text-zinc-200">
                {current_status.total_labeled} labeled videos
                {current_status.unique_niches === 1 && data_composition.by_niche.length > 0
                  ? `, all ${data_composition.by_niche[0].niche}`
                  : current_status.unique_niches > 1
                    ? ` across ${current_status.unique_niches} niches`
                    : ''
                }
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Accuracy:</span>{' '}
              <span className="text-zinc-200">
                {error_patterns
                  ? error_patterns.overall.mean_error > 5
                    ? `Overpredicts by ~${Math.round(Math.abs(error_patterns.overall.mean_error))} points (expected at this stage)`
                    : error_patterns.overall.mean_error < -5
                      ? `Underpredicts by ~${Math.round(Math.abs(error_patterns.overall.mean_error))} points`
                      : `Within ~${Math.round(Math.abs(error_patterns.overall.mean_error))} points (balanced)`
                  : 'No scored predictions yet'
                }
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Ranking:</span>{' '}
              <span className="text-zinc-200">
                {current_status.latest_spearman_rho != null
                  ? `rho=${current_status.latest_spearman_rho.toFixed(2)} (${
                      current_status.latest_spearman_rho >= 0.7 ? 'strong' :
                      current_status.latest_spearman_rho >= 0.4 ? 'moderate' :
                      current_status.latest_spearman_rho >= 0.2 ? 'weak' : 'very weak'
                    } — model ${
                      current_status.latest_spearman_rho >= 0.4
                        ? 'roughly knows which videos are better than others, but not by how much'
                        : 'struggles to rank videos correctly'
                    })`
                  : 'No evaluations yet'
                }
              </span>
            </div>
          </div>

          {/* Next milestone */}
          {current_status.next_milestone && (
            <div className="mt-4 pt-4 border-t border-zinc-800 text-sm">
              <p className="text-zinc-300">
                <span className="font-medium">Next milestone:</span>{' '}
                {current_status.next_milestone} labeled videos ({current_status.remaining_to_milestone} to go)
              </p>
              <p className="text-zinc-400 mt-1">
                What happens: First retrain on real data — expect significant accuracy improvement
              </p>
            </div>
          )}

          {/* Key issues */}
          {(confidenceInsight?.miscalibrated || current_status.unique_niches <= 1 || (current_status.production_model?.train_samples ?? 0) === 0) && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-sm font-medium text-yellow-400 mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Key issues:
              </p>
              <ul className="text-sm text-zinc-400 space-y-1 ml-5 list-disc">
                {confidenceInsight?.miscalibrated && (
                  <li>Confidence scores are not calibrated (don&apos;t trust them)</li>
                )}
                {current_status.unique_niches <= 1 && data_composition.by_niche.length > 0 && (
                  <li>All data is from one niche ({data_composition.by_niche[0].niche})</li>
                )}
                {(current_status.production_model?.train_samples ?? 0) === 0 && (
                  <li>Model has never been trained on real data</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section A: Training Journey Timeline                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-zinc-400" />
            Training Journey
          </h2>
          <button
            onClick={() => setShowAllEvents(!showAllEvents)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              showAllEvents ? 'bg-zinc-700 text-zinc-200' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            {showAllEvents ? 'All events' : 'Milestones & evals only'}
          </button>
        </div>

        {(() => {
          // Default: filter out model_created/deployed/deprecated + training_job (milestones & evals only)
          const filteredTimeline = showAllEvents
            ? timeline
            : timeline.filter(e => e.type === 'labeling_milestone' || e.type === 'evaluation_run');
          return filteredTimeline.length === 0 ? (
            <EmptyState message="No training events yet" />
          ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-zinc-800" />

            <div className="space-y-3">
              {filteredTimeline.slice(0, 20).map((event, i) => (
                <div key={i} className="relative pl-10">
                  {/* Dot */}
                  <div className={`absolute left-1.5 top-3 w-3 h-3 rounded-full ${EVENT_COLORS[event.type] || 'bg-zinc-600'} ring-2 ring-zinc-950`} />

                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        {/* Inline metrics */}
                        <div className="flex gap-3 mt-1 text-xs text-zinc-400">
                          {event.details.spearman_rho != null && (
                            <span>rho={Number(event.details.spearman_rho).toFixed(2)}</span>
                          )}
                          {event.details.mae != null && (
                            <span>MAE={Number(event.details.mae).toFixed(1)}</span>
                          )}
                          {event.details.n != null && event.type === 'evaluation_run' && (
                            <span>n={event.details.n}</span>
                          )}
                          {event.details.training_samples != null && (
                            <span>samples={event.details.training_samples}</span>
                          )}
                          {event.details.status && event.type === 'training_job' && (
                            <span className={event.details.status === 'completed' ? 'text-green-400' : event.details.status === 'failed' ? 'text-red-400' : ''}>
                              {event.details.status}
                            </span>
                          )}
                          {event.details.count != null && (
                            <span className="text-green-400">{event.details.count} videos</span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 whitespace-nowrap ml-4">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {timeAgo(event.timestamp)}
                        <span className="text-zinc-600 ml-1">({formatDate(event.timestamp)})</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredTimeline.length > 20 && (
              <p className="text-xs text-zinc-500 mt-2 pl-10">+ {filteredTimeline.length - 20} more events</p>
            )}
          </div>
          );
        })()}

        {/* Growth projection text (replaces bar chart) */}
        {current_status.total_labeled > 0 && (
          <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <p className="text-sm text-zinc-300">
              {current_status.total_labeled} labeled since{' '}
              {current_status.first_label_date ? formatDate(current_status.first_label_date) : 'start'}
              {current_status.labels_per_week != null && (
                <span> (~{current_status.labels_per_week.toFixed(1)}/week)</span>
              )}
              {current_status.weeks_to_milestone != null && current_status.next_milestone && (
                <span>
                  . At this rate, you&apos;ll hit {current_status.next_milestone} labeled in ~{current_status.weeks_to_milestone} weeks.
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section B: Model Versions — Production hero + collapsed experimental  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-zinc-400" />
          Model Versions
        </h2>

        {models.length === 0 ? (
          <EmptyState message="No model versions registered yet" />
        ) : (
          <div className="space-y-4">
            {/* Production Model Hero Card */}
            {productionModel && (
              <div className="bg-zinc-900 border-2 border-purple-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl font-bold">{productionModel.version}</span>
                  <span className="px-2 py-0.5 bg-purple-900/60 border border-purple-700 rounded text-xs text-purple-300">
                    <Award className="w-3 h-3 inline mr-1" />
                    Production Model
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-zinc-500">Created:</span>{' '}
                    <span className="text-zinc-200">{productionModel.created_at ? formatDate(productionModel.created_at) : 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Trained on:</span>{' '}
                    <span className="text-zinc-200">
                      {(productionModel.train_samples ?? 0) === 0
                        ? 'Synthetic data (0 real samples)'
                        : `${productionModel.train_samples} real samples`
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Status:</span>{' '}
                    <span className="text-zinc-200">
                      {(productionModel.train_samples ?? 0) === 0
                        ? 'Active but untrained on real data'
                        : 'Active'
                      }
                    </span>
                  </div>
                </div>

                {(productionModel.train_samples ?? 0) === 0 && current_status.next_milestone && (
                  <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-3 text-sm text-yellow-300">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    This model has never been trained on your real labeled data. First retrain happens at{' '}
                    {current_status.next_milestone} labels. You have {current_status.total_labeled} — {current_status.remaining_to_milestone} to go.
                  </div>
                )}

                {/* Feature Importance — translated to plain English */}
                {productionModel.feature_importance && Object.keys(productionModel.feature_importance).length > 0 && (
                  <div className="mt-5 pt-5 border-t border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">What matters most to the model</h3>
                    {(() => {
                      const sorted = Object.entries(productionModel.feature_importance!)
                        .sort(([, a], [, b]) => Number(b) - Number(a))
                        .slice(0, 10);
                      const totalImportance = sorted.reduce((s, [, v]) => s + Number(v), 0);
                      return sorted.map(([feature, importance], idx) => {
                        const pct = totalImportance > 0 ? Math.round((Number(importance) / totalImportance) * 100) : 0;
                        const maxPct = totalImportance > 0
                          ? Math.round((Number(sorted[0][1]) / totalImportance) * 100)
                          : 0;
                        const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0;
                        return (
                          <div key={feature} className="mb-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-zinc-300">{humanFeatureName(feature)}</span>
                              <span className="text-zinc-400">{pct}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2 mt-0.5">
                              <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${barWidth}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Experimental Models Accordion */}
            {experimentalModels.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
                <button
                  onClick={() => setShowExperimentalModels(!showExperimentalModels)}
                  className="w-full flex items-center justify-between p-4 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <span>Experimental Versions ({experimentalModels.length})</span>
                  {showExperimentalModels ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showExperimentalModels && (
                  <div className="px-4 pb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-zinc-500 text-xs">
                          <th className="text-left py-1.5">Version</th>
                          <th className="text-left py-1.5">Date</th>
                          <th className="text-right py-1.5">MAE</th>
                          <th className="text-right py-1.5">RMSE</th>
                          <th className="text-left py-1.5">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {experimentalModels.map((model) => (
                          <tr key={model.id} className="border-t border-zinc-800">
                            <td className="py-2 text-zinc-300 font-medium">{model.version || 'Unknown'}</td>
                            <td className="py-2 text-zinc-400">{model.created_at ? formatDate(model.created_at) : '—'}</td>
                            <td className="py-2 text-right text-zinc-400">{model.mae != null ? Number(model.mae).toFixed(1) : '—'}</td>
                            <td className="py-2 text-right text-zinc-400">{model.rmse != null ? Number(model.rmse).toFixed(1) : '—'}</td>
                            <td className="py-2">
                              <span className={model.archived_at ? 'text-zinc-500' : 'text-zinc-300'}>
                                {model.archived_at ? 'archived' : model.status || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section C: Training Data Composition                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-zinc-400" />
          Training Data Composition
          <span className="text-sm font-normal text-zinc-500">({data_composition.total} labeled)</span>
        </h2>

        {data_composition.total === 0 ? (
          <EmptyState message="No labeled training data yet" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Niche Distribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">By Niche</h3>
              {data_composition.by_niche.map((n) => {
                const pct = (n.count / data_composition.total) * 100;
                return (
                  <div key={n.niche} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-zinc-300">{n.niche}</span>
                      <span className="text-zinc-400">{n.count} ({pct.toFixed(0)}%) avg={n.avg_vps}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {/* Automated niche insight */}
              <div className="mt-3 p-3 bg-yellow-900/15 border border-yellow-800/40 rounded text-xs text-yellow-300/90">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                {data_composition.by_niche.length === 1 ? (
                  <>
                    All {data_composition.total} labeled videos are from {data_composition.by_niche[0].niche}.
                    The model has zero data from the other {current_status.total_niches_available - 1} niches.
                    Predictions for other niches will be unreliable until you label videos from those niches too.
                  </>
                ) : (
                  <>
                    Data covers {data_composition.by_niche.length} of {current_status.total_niches_available} niches.
                    {data_composition.by_niche.length < 5 && ' Predictions for uncovered niches will be unreliable.'}
                  </>
                )}
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">By Tier</h3>
              {['mega-viral', 'viral', 'good', 'average', 'low'].map((tier) => {
                const entry = data_composition.by_tier.find(t => t.tier === tier);
                const count = entry?.count || 0;
                const pct = data_composition.total > 0 ? (count / data_composition.total) * 100 : 0;
                return (
                  <div key={tier} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={TIER_TEXT_COLORS[tier] || 'text-zinc-300'}>{tier}</span>
                      <span className="text-zinc-400">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className={`${TIER_COLORS[tier] || 'bg-zinc-600'} h-2 rounded-full`} style={{ width: `${Math.max(pct, 1)}%` }} />
                    </div>
                  </div>
                );
              })}
              {/* Automated tier insight */}
              {tierInsights && (
                <div className="mt-3 p-3 bg-blue-900/15 border border-blue-800/40 rounded text-xs text-blue-300/90">
                  <Info className="w-3 h-3 inline mr-1" />
                  Your labeled data skews toward extremes: {tierInsights.lowPct}% low-performing + {tierInsights.megaPct}% mega-viral = {tierInsights.edgePct}% at the edges.
                  {tierInsights.goodPct <= 10 && (
                    <> Only {tierInsights.goodPct}% are &apos;good&apos; tier. The model may struggle with middle-of-the-road videos.</>
                  )}
                </div>
              )}
            </div>

            {/* Labeling Mode */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">By Labeling Mode</h3>
              {data_composition.by_labeling_mode.map((m) => {
                const pct = (m.count / data_composition.total) * 100;
                return (
                  <div key={m.mode} className="flex justify-between text-sm py-1.5 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-300">{m.mode}</span>
                    <span className="text-zinc-400">{m.count} ({pct.toFixed(0)}%)</span>
                  </div>
                );
              })}
              {/* Automated labeling mode insight */}
              <div className="mt-3 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded text-xs text-zinc-400">
                <Info className="w-3 h-3 inline mr-1" />
                {data_composition.by_labeling_mode.every(m => m.mode === 'legacy') ? (
                  <>
                    All {data_composition.total} labels are legacy (manual). Once the auto-labeler has enough
                    metric checkpoints, it will start generating labels automatically.
                  </>
                ) : (
                  <>
                    {data_composition.by_labeling_mode.find(m => m.mode === 'auto_cron')
                      ? 'Auto-labeler is contributing labels alongside manual labeling.'
                      : 'Mix of labeling modes active.'
                    }
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section D: Error Patterns — Plain English                             */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-zinc-400" />
          Error Patterns
        </h2>

        {!error_patterns ? (
          <EmptyState message="No predictions with labels yet — error analysis requires both predicted and actual VPS" />
        ) : (
          <div className="space-y-4">
            {/* Accuracy Summary — plain English */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-base font-semibold text-zinc-200 mb-4">
                Your Model&apos;s Accuracy <span className="text-sm font-normal text-zinc-500">(based on {error_patterns.overall.n} scored predictions)</span>
              </h3>

              <div className="space-y-3 text-sm">
                {error_patterns.overall.mean_error > 5 ? (
                  <>
                    <p className="text-zinc-200">
                      The model consistently predicts scores <span className="text-red-400 font-semibold">TOO HIGH</span> by about{' '}
                      {Math.round(Math.abs(error_patterns.overall.mean_error))} points.
                    </p>
                    <p className="text-zinc-400">
                      When the model says a video will score 70, it actually scores around{' '}
                      {70 - Math.round(Math.abs(error_patterns.overall.mean_error))}.
                    </p>
                  </>
                ) : error_patterns.overall.mean_error < -5 ? (
                  <>
                    <p className="text-zinc-200">
                      The model consistently predicts scores <span className="text-blue-400 font-semibold">TOO LOW</span> by about{' '}
                      {Math.round(Math.abs(error_patterns.overall.mean_error))} points.
                    </p>
                    <p className="text-zinc-400">
                      When the model says a video will score 50, it actually scores around{' '}
                      {50 + Math.round(Math.abs(error_patterns.overall.mean_error))}.
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-200">
                    The model is <span className="text-green-400 font-semibold">roughly balanced</span> — within{' '}
                    {Math.round(Math.abs(error_patterns.overall.mean_error))} points on average.
                  </p>
                )}

                <p className="text-zinc-400">
                  Only {error_patterns.overall.within_10vps_pct.toFixed(0)}% of predictions land within 10 points of the actual score.
                </p>

                <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm">
                  <p className="text-zinc-300">
                    <BarChart3 className="w-4 h-4 inline mr-1 text-zinc-500" />
                    <span className="font-medium">What this means:</span> At {current_status.total_labeled} labeled videos, this level
                    of error is expected. Accuracy typically improves significantly after 100+ labeled samples when the
                    model gets retrained on real data (currently on synthetic data).
                  </p>
                </div>

                <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm">
                  <p className="text-zinc-300">
                    <Target className="w-4 h-4 inline mr-1 text-zinc-500" />
                    <span className="font-medium">What to do:</span> Keep labeling. No action needed yet.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Distribution */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Error Distribution</h3>
              {errorDistSummary && (
                <p className="text-xs text-zinc-400 mb-3">
                  {errorDistSummary.overPct}% of predictions are off by 10+ points (overpredicting).
                  This will improve after the first real retrain at {current_status.next_milestone || 100} labels.
                </p>
              )}
              {error_patterns.error_buckets.map((bucket) => {
                const maxPct = Math.max(...error_patterns.error_buckets.map(b => b.pct));
                const barWidth = maxPct > 0 ? (bucket.pct / maxPct) * 100 : 0;
                const color = bucket.label.includes('Within') ? 'bg-green-600' :
                  bucket.label.includes('Over') ? 'bg-red-600' : 'bg-blue-600';
                return (
                  <div key={bucket.label} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-zinc-400">{bucket.label}</span>
                      <span className="text-zinc-300">{bucket.count} ({bucket.pct}%)</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.max(barWidth, 1)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Per-Niche Errors — only show when 2+ niches */}
            {error_patterns.per_niche.length >= 2 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Per-Niche Errors</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-xs">
                      <th className="text-left py-1">Niche</th>
                      <th className="text-right py-1">n</th>
                      <th className="text-right py-1">Avg Error</th>
                      <th className="text-right py-1">MAE</th>
                      <th className="text-right py-1">Bias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {error_patterns.per_niche.map((row) => (
                      <tr key={row.niche} className="border-t border-zinc-800">
                        <td className="py-1.5 text-zinc-300">{row.niche}</td>
                        <td className="py-1.5 text-right text-zinc-400">{row.n}</td>
                        <td className={`py-1.5 text-right ${row.avg_error > 5 ? 'text-red-400' : row.avg_error < -5 ? 'text-blue-400' : 'text-green-400'}`}>
                          {row.avg_error > 0 ? '+' : ''}{row.avg_error.toFixed(1)}
                        </td>
                        <td className="py-1.5 text-right text-zinc-300">{row.mae.toFixed(1)}</td>
                        <td className="py-1.5 text-right text-xs">
                          {row.bias === 'Consistently overpredicts' && <span className="text-red-400">{row.bias}</span>}
                          {row.bias === 'Consistently underpredicts' && <span className="text-blue-400">{row.bias}</span>}
                          {row.bias === 'Balanced' && <span className="text-green-400">{row.bias}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tier Confusion — plain English instead of matrix */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Tier Prediction Accuracy</h3>
              {confusionInsight && (
                <div className="text-sm text-zinc-400 space-y-2">
                  {confusionInsight.neverPredicted.length > 0 && (
                    <p>
                      The model never predicts{' '}
                      <span className="text-zinc-200">{confusionInsight.neverPredicted.map(t => `'${t}'`).join(' or ')}</span>.
                      {confusionInsight.topPredicted.length > 0 && (
                        <> It clusters most predictions in the{' '}
                          <span className="text-zinc-200">{confusionInsight.topPredicted.map(t => `'${t}'`).join(' and ')}</span>{' '}
                          range, even when videos are actually in other tiers.
                        </>
                      )}
                    </p>
                  )}
                  <p className="text-zinc-500 text-xs">
                    This is a common pattern with early models trained on synthetic data.
                  </p>
                </div>
              )}

              {/* Still show the matrix as collapsible detail */}
              <details className="mt-3">
                <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-300">Show confusion matrix</summary>
                <div className="overflow-x-auto mt-2">
                  <table className="text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 text-zinc-500">Predicted \ Actual</th>
                        {['mega-viral', 'viral', 'good', 'average', 'low'].map(t => (
                          <th key={t} className={`p-2 ${TIER_TEXT_COLORS[t]}`}>{t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['mega-viral', 'viral', 'good', 'average', 'low'].map(predicted => (
                        <tr key={predicted}>
                          <td className={`p-2 font-medium ${TIER_TEXT_COLORS[predicted]}`}>{predicted}</td>
                          {['mega-viral', 'viral', 'good', 'average', 'low'].map(actual => {
                            const count = error_patterns.confusion_matrix[predicted]?.[actual] || 0;
                            const isDiagonal = predicted === actual;
                            const bg = count === 0 ? 'bg-zinc-800' :
                              isDiagonal ? 'bg-green-900/50 text-green-300' :
                              count >= 3 ? 'bg-red-900/50 text-red-300' :
                              'bg-red-900/20 text-red-400';
                            return (
                              <td key={actual} className={`p-2 text-center ${bg} border border-zinc-800`}>
                                {count || '\u2014'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* Worst Misses */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Top 5 Worst Misses</h3>
              <p className="text-xs text-zinc-500 mb-3">
                These 5 predictions had the biggest errors. Look for patterns — are they all from a certain type of content?
              </p>
              {error_patterns.worst_misses.length === 0 ? (
                <EmptyState message="No misses to show" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 text-xs">
                      <th className="text-left py-1">Niche</th>
                      <th className="text-right py-1">Predicted</th>
                      <th className="text-right py-1">Actual</th>
                      <th className="text-right py-1">Error</th>
                      <th className="text-right py-1">Confidence</th>
                      <th className="text-right py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {error_patterns.worst_misses.map((miss, i) => (
                      <tr key={i} className="border-t border-zinc-800">
                        <td className="py-1.5 text-zinc-300">{miss.niche}</td>
                        <td className="py-1.5 text-right">{miss.predicted.toFixed(1)}</td>
                        <td className="py-1.5 text-right">{miss.actual.toFixed(1)}</td>
                        <td className={`py-1.5 text-right font-medium ${miss.error > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                          {miss.error > 0 ? '+' : ''}{miss.error.toFixed(1)}
                        </td>
                        <td className="py-1.5 text-right text-zinc-400">{miss.confidence != null ? miss.confidence.toFixed(2) : '\u2014'}</td>
                        <td className="py-1.5 text-right text-zinc-500">{formatDate(miss.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section E: Confidence Calibration — lead with insight                 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-zinc-400" />
          Confidence Calibration
        </h2>

        {!error_patterns ? (
          <EmptyState message="No data yet — requires predictions with labels" />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            {/* Lead with the insight */}
            {confidenceInsight?.miscalibrated ? (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded text-sm text-yellow-300">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                The model&apos;s confidence scores are <span className="font-semibold">NOT calibrated</span>.
                High-confidence predictions (&gt;0.75) are <span className="font-semibold">LESS accurate</span>{' '}
                (MAE {confidenceInsight.highMAE.toFixed(1)}) than medium-confidence ones (MAE {confidenceInsight.midMAE.toFixed(1)}).
                Don&apos;t trust the confidence number yet — it needs recalibration after the v6 retrain.
              </div>
            ) : (
              <p className="text-sm text-zinc-400 mb-4">
                Are high-confidence predictions actually more accurate? Here&apos;s the breakdown:
              </p>
            )}

            {/* Supporting table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs">
                  <th className="text-left py-1">Confidence Range</th>
                  <th className="text-right py-1">Count</th>
                  <th className="text-right py-1">
                    <Tooltip text="Average number of points the prediction is off by.">
                      <span>Avg Error (MAE)</span>
                      <HelpCircle className="w-3 h-3 ml-1 text-zinc-600" />
                    </Tooltip>
                  </th>
                  <th className="text-right py-1">Within ±10 VPS</th>
                </tr>
              </thead>
              <tbody>
                {error_patterns.confidence_calibration.map((row) => (
                  <tr key={row.range} className="border-t border-zinc-800">
                    <td className="py-2 text-zinc-300 font-medium">{row.range}</td>
                    <td className="py-2 text-right text-zinc-400">{row.count}</td>
                    <td className={`py-2 text-right ${row.count > 0 && row.mae < error_patterns.overall.mae ? 'text-green-400' : 'text-zinc-300'}`}>
                      {row.count > 0 ? row.mae.toFixed(1) : '\u2014'}
                    </td>
                    <td className={`py-2 text-right ${row.count > 0 && row.within_10vps_pct > error_patterns.overall.within_10vps_pct ? 'text-green-400' : 'text-zinc-300'}`}>
                      {row.count > 0 ? `${row.within_10vps_pct.toFixed(0)}%` : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {error_patterns.confidence_calibration.every(r => r.count < 10) && (
              <p className="text-xs text-yellow-400 mt-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Small sample sizes — confidence calibration becomes meaningful at 100+ labeled videos
              </p>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Section F: Evaluation History — with context & tooltips               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-zinc-400" />
          Evaluation History
        </h2>

        {evaluation_trend.length === 0 ? (
          <EmptyState message="No Spearman evaluations run yet" />
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-500 text-xs">
                  <th className="text-left py-1">Date</th>
                  <th className="text-right py-1">n</th>
                  <th className="text-right py-1">
                    <Tooltip text="How well the model ranks videos from worst to best. 1.0 = perfect ranking.">
                      <span>Rank Accuracy (rho)</span>
                      <HelpCircle className="w-3 h-3 ml-1 text-zinc-600" />
                    </Tooltip>
                  </th>
                  <th className="text-right py-1">
                    <Tooltip text="Average number of points the prediction is off by.">
                      <span>Avg Error (MAE)</span>
                      <HelpCircle className="w-3 h-3 ml-1 text-zinc-600" />
                    </Tooltip>
                  </th>
                  <th className="text-right py-1">
                    <Tooltip text="Percentage of predictions where the actual score fell within the model's predicted range (low-high). Different from ±10 VPS.">
                      <span>In Range %</span>
                      <HelpCircle className="w-3 h-3 ml-1 text-zinc-600" />
                    </Tooltip>
                  </th>
                  <th className="text-right py-1">Trend</th>
                  <th className="text-center py-1">Detail</th>
                </tr>
              </thead>
              <tbody>
                {evaluation_trend.slice().reverse().map((ev) => (
                  <React.Fragment key={ev.computed_at}>
                    <tr className="border-t border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => setExpandedEval(expandedEval === ev.computed_at ? null : ev.computed_at)}>
                      <td className="py-2 text-zinc-300">{formatDate(ev.computed_at)}</td>
                      <td className="py-2 text-right text-zinc-400">{ev.n}</td>
                      <td className="py-2 text-right font-medium">
                        {ev.spearman_rho != null ? ev.spearman_rho.toFixed(3) : '\u2014'}
                      </td>
                      <td className="py-2 text-right text-zinc-300">
                        {ev.mae != null ? ev.mae.toFixed(1) : '\u2014'}
                      </td>
                      <td className="py-2 text-right text-zinc-300">
                        {ev.within_range_pct != null ? `${ev.within_range_pct.toFixed(0)}%` : '\u2014'}
                      </td>
                      <td className="py-2 text-right">
                        <TrendIcon trend={ev.rho_trend} />
                      </td>
                      <td className="py-2 text-center text-zinc-500">
                        {ev.by_niche ? (expandedEval === ev.computed_at ? '\u25B2' : '\u25BC') : '\u2014'}
                      </td>
                    </tr>
                    {/* Expanded per-niche detail */}
                    {expandedEval === ev.computed_at && ev.by_niche && (
                      <tr>
                        <td colSpan={7} className="bg-zinc-800/50 p-3">
                          <p className="text-xs text-zinc-400 mb-2 font-medium">Per-Niche Breakdown</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(Array.isArray(ev.by_niche) ? ev.by_niche : []).map((nb: any, idx: number) => (
                              <div key={idx} className="text-xs">
                                <span className="text-zinc-300 font-medium">{nb.niche}</span>
                                <span className="text-zinc-500 ml-2">
                                  n={nb.n} | rho={nb.spearman_rho?.toFixed(2)} | MAE={nb.mae?.toFixed(1)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Footnote about different metrics */}
            <p className="text-xs text-zinc-600 mt-3 border-t border-zinc-800 pt-3">
              &quot;In Range %&quot; measures if actual scores fall inside the model&apos;s predicted range (low-high).
              &quot;Within ±10 VPS&quot; (in Section D) measures if predictions are within 10 points of actual.
              These are different metrics.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
