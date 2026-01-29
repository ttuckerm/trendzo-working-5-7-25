'use client';

/**
 * Workflow 1 - Research Phase Components (Steps 1.1 - 1.5)
 * 
 * Step 1.1: Niche Selection
 * Step 1.2: Target Audience
 * Step 1.3: Content Purpose (KNOW/LIKE/TRUST)
 * Step 1.4: Set Goals & KPIs
 * Step 1.5: Exemplar Swoop
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Users, Lightbulb, Goal, Search,
  ChevronLeft, ChevronRight, Check, Loader2
} from 'lucide-react';
import {
  NICHE_OPTIONS,
  AUDIENCE_AGE_BANDS,
  CONTENT_PURPOSES,
  GOAL_TYPES,
  formatNumber,
  type NicheKey,
  type AudienceAgeBand,
  type ContentPurposeKey,
  type GoalTypeKey,
} from '@/lib/workflow-shared';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Shared props interface for all step components
interface StepProps {
  data: ResearchData;
  onUpdate: (updates: Partial<ResearchData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// Research phase data structure
export interface ResearchData {
  // Step 1.1
  niche?: NicheKey;
  // Step 1.2
  audienceAgeBand?: AudienceAgeBand;
  audienceInterests?: string[];
  audiencePainPoints?: string[];
  // Step 1.3
  contentPurpose?: ContentPurposeKey;
  // Step 1.4
  goalType?: GoalTypeKey;
  targetViews?: number;
  // Step 1.5
  exemplarAccounts?: ExemplarAccount[];
}

export interface ExemplarAccount {
  username: string;
  platform: 'TIKTOK' | 'YOUTUBE' | 'INSTAGRAM';
  followers: number;
  avgViews: number;
  topVideoId?: string;
}

// ============================================
// Step 1.1: Niche Selection
// ============================================
export function NicheSelectionStep({ data, onUpdate, onNext, onBack }: StepProps) {
  // Filter out 'all' option for selection
  const selectableNiches = NICHE_OPTIONS.filter(n => n.key !== 'all');
  
  const handleSelect = (nicheKey: NicheKey) => {
    onUpdate({ niche: nicheKey });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
          <Target className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Niche</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Select the category that best describes your content focus
        </p>
      </div>

      {/* Niche Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {selectableNiches.map((niche) => (
          <motion.button
            key={niche.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(niche.key)}
            className={`
              relative p-4 rounded-xl border transition-all duration-200 text-left
              ${data.niche === niche.key 
                ? 'border-purple-500 bg-purple-500/20 ring-2 ring-purple-500/50' 
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
              }
            `}
          >
            {/* Selected checkmark */}
            {data.niche === niche.key && (
              <div className="absolute top-2 right-2">
                <Check className="w-4 h-4 text-purple-400" />
              </div>
            )}
            
            <span className="text-2xl mb-2 block">{niche.icon}</span>
            <span className="text-white text-sm font-medium line-clamp-2">{niche.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.niche}
          className={`
            px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ml-auto
            ${data.niche 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 1.2: Target Audience
// ============================================
export function TargetAudienceStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [interests, setInterests] = useState<string>(data.audienceInterests?.join(', ') || '');
  const [painPoints, setPainPoints] = useState<string>(data.audiencePainPoints?.join(', ') || '');

  const handleAgeBandSelect = (ageBand: AudienceAgeBand) => {
    onUpdate({ audienceAgeBand: ageBand });
  };

  const handleContinue = () => {
    // Parse comma-separated interests and pain points
    const parsedInterests = interests.split(',').map(s => s.trim()).filter(Boolean);
    const parsedPainPoints = painPoints.split(',').map(s => s.trim()).filter(Boolean);
    
    onUpdate({
      audienceInterests: parsedInterests,
      audiencePainPoints: parsedPainPoints,
    });
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <Users className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Define Your Target Audience</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Who are you creating content for?
        </p>
      </div>

      {/* Age Band Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-white/80">Primary Age Group</label>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {AUDIENCE_AGE_BANDS.map((band) => (
            <motion.button
              key={band.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAgeBandSelect(band.key)}
              className={`
                p-4 rounded-xl border transition-all duration-200 text-left
                ${data.audienceAgeBand === band.key 
                  ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/50' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className="text-white font-medium text-sm">{band.label}</div>
              <div className="text-white/50 text-xs mt-1">{band.description}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Audience Interests</label>
        <textarea
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="e.g., investing, side hustles, financial freedom, budgeting..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          rows={2}
        />
        <p className="text-xs text-white/40">Separate with commas</p>
      </div>

      {/* Pain Points */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Pain Points & Challenges</label>
        <textarea
          value={painPoints}
          onChange={(e) => setPainPoints(e.target.value)}
          placeholder="e.g., debt overwhelm, low income, no savings, confused about investing..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          rows={2}
        />
        <p className="text-xs text-white/40">Separate with commas</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={!data.audienceAgeBand}
          className={`
            px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ml-auto
            ${data.audienceAgeBand 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 1.3: Content Purpose (KNOW/LIKE/TRUST)
// ============================================
export function ContentPurposeStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const handleSelect = (purpose: ContentPurposeKey) => {
    onUpdate({ contentPurpose: purpose });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mb-4">
          <Lightbulb className="w-8 h-8 text-yellow-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Content Purpose</h2>
        <p className="text-white/60 max-w-md mx-auto">
          What do you want your audience to do after watching?
        </p>
      </div>

      {/* KLT Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CONTENT_PURPOSES.map((purpose) => (
          <motion.button
            key={purpose.key}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(purpose.key)}
            className={`
              relative p-6 rounded-2xl border transition-all duration-200 text-left
              ${data.contentPurpose === purpose.key 
                ? 'border-yellow-500 bg-yellow-500/10 ring-2 ring-yellow-500/50' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            {/* Selected indicator */}
            {data.contentPurpose === purpose.key && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              </div>
            )}
            
            <span className="text-4xl mb-4 block">{purpose.icon}</span>
            <h3 className="text-xl font-bold text-white mb-2">{purpose.label}</h3>
            <p className="text-white/60 text-sm mb-4">{purpose.description}</p>
            
            {/* CTA Examples */}
            <div className="space-y-1">
              <p className="text-xs text-white/40 uppercase tracking-wide">Example CTAs:</p>
              {purpose.ctaExamples.map((cta, i) => (
                <span 
                  key={i} 
                  className="inline-block mr-2 mb-1 px-2 py-1 bg-white/5 rounded text-xs text-white/70"
                >
                  {cta}
                </span>
              ))}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.contentPurpose}
          className={`
            px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ml-auto
            ${data.contentPurpose 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 1.4: Set Goals & KPIs
// ============================================
export function GoalsKPIStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [targetViews, setTargetViews] = useState<string>(data.targetViews?.toString() || '');

  const handleGoalSelect = (goalKey: GoalTypeKey) => {
    onUpdate({ goalType: goalKey });
  };

  const handleContinue = () => {
    const views = parseInt(targetViews.replace(/,/g, ''), 10);
    if (!isNaN(views)) {
      onUpdate({ targetViews: views });
    }
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-4">
          <Goal className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Set Your Goals & KPIs</h2>
        <p className="text-white/60 max-w-md mx-auto">
          What metrics define success for this content?
        </p>
      </div>

      {/* Goal Type Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-white/80">Primary Goal</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GOAL_TYPES.map((goal) => (
            <motion.button
              key={goal.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGoalSelect(goal.key)}
              className={`
                p-4 rounded-xl border transition-all duration-200 text-left
                ${data.goalType === goal.key 
                  ? 'border-green-500 bg-green-500/20 ring-2 ring-green-500/50' 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className="text-white font-medium text-sm">{goal.label}</div>
              <div className="text-white/50 text-xs mt-1">{goal.metric}</div>
              <div className="text-green-400/70 text-xs mt-2">Target: {goal.targetRange}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Target Views Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Target View Count</label>
        <div className="relative">
          <input
            type="text"
            value={targetViews}
            onChange={(e) => {
              // Allow only numbers and commas
              const value = e.target.value.replace(/[^0-9,]/g, '');
              setTargetViews(value);
            }}
            placeholder="e.g., 100,000"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
            views
          </div>
        </div>
        <p className="text-xs text-white/40">
          Based on your niche and audience, we'll help you set realistic targets
        </p>
      </div>

      {/* Goal Summary Card */}
      {data.goalType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Goal className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">
                {GOAL_TYPES.find(g => g.key === data.goalType)?.label}
              </div>
              <div className="text-white/50 text-sm">
                {targetViews ? `${targetViews} views target` : 'Set your target views above'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={!data.goalType}
          className={`
            px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ml-auto
            ${data.goalType 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 1.5: Exemplar Swoop
// ============================================
interface ViralVideo {
  video_id: string;
  title: string;
  creator_username: string;
  views_count: number;
  likes_count: number;
  dps_score: number;
  thumbnail_url: string;
}

export function ExemplarSwoopStep({ data, onUpdate, onNext, onBack }: StepProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ViralVideo[]>([]);
  const [selectedExemplars, setSelectedExemplars] = useState<string[]>([]);

  // Fetch viral videos based on niche
  const fetchExemplars = async () => {
    if (!data.niche) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('scraped_videos')
        .select('video_id, title, creator_username, views_count, likes_count, dps_score, thumbnail_url')
        .gte('views_count', 50000)
        .order('views_count', { ascending: false })
        .limit(25);

      // Filter by search query if provided
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,creator_username.ilike.%${searchQuery}%`);
      }

      const { data: videos, error } = await query;

      if (error) {
        console.error('Error fetching exemplars:', error);
        return;
      }

      setResults(videos || []);
    } catch (err) {
      console.error('Error in fetchExemplars:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchExemplars();
  }, [data.niche]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchExemplars();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleExemplar = (videoId: string) => {
    setSelectedExemplars(prev => 
      prev.includes(videoId) 
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleContinue = () => {
    // Convert selected videos to exemplar accounts
    const exemplars: ExemplarAccount[] = results
      .filter(v => selectedExemplars.includes(v.video_id))
      .map(v => ({
        username: v.creator_username,
        platform: 'TIKTOK' as const,
        followers: 0, // Would need another query to get this
        avgViews: v.views_count,
        topVideoId: v.video_id,
      }));
    
    onUpdate({ exemplarAccounts: exemplars });
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 mb-4">
          <Search className="w-8 h-8 text-pink-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Exemplar Swoop</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Find viral videos in your niche to model your content after
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by creator, hashtag, or keyword..."
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
        />
      </div>

      {/* Selection count */}
      <div className="flex items-center justify-between">
        <span className="text-white/60 text-sm">
          {selectedExemplars.length} of 25 exemplars selected
        </span>
        <span className="text-white/40 text-sm">
          Select videos to analyze their viral patterns
        </span>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
          {results.map((video) => (
            <motion.button
              key={video.video_id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleExemplar(video.video_id)}
              className={`
                relative rounded-xl overflow-hidden border transition-all duration-200
                ${selectedExemplars.includes(video.video_id)
                  ? 'border-pink-500 ring-2 ring-pink-500/50'
                  : 'border-white/10 hover:border-white/20'
                }
              `}
            >
              {/* Thumbnail */}
              <div className="aspect-[9/16] bg-white/5">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    🎬
                  </div>
                )}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Selected indicator */}
              {selectedExemplars.includes(video.video_id) && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <div className="text-white text-xs font-medium truncate">
                  @{video.creator_username}
                </div>
                <div className="text-white/60 text-xs">
                  {formatNumber(video.views_count)} views
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-white/60">No videos found. Try a different search term.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
        )}
        <button
          onClick={handleContinue}
          disabled={selectedExemplars.length === 0}
          className={`
            px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 transition-all ml-auto
            ${selectedExemplars.length > 0
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30' 
              : 'bg-white/10 opacity-50 cursor-not-allowed'
            }
          `}
        >
          Continue with {selectedExemplars.length} exemplars <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Export all components
export const ResearchPhaseComponents = {
  NicheSelection: NicheSelectionStep,
  TargetAudience: TargetAudienceStep,
  ContentPurpose: ContentPurposeStep,
  GoalsKPI: GoalsKPIStep,
  ExemplarSwoop: ExemplarSwoopStep,
};

export default ResearchPhaseComponents;
