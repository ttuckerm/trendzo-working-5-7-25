'use client';

/**
 * Workflow 1: Viral Content Creator (Paul's 3-Step Redesign)
 *
 * Simplified workflow: Strategy → Create → Ship
 * Research once, create many videos.
 *
 * Routes to: /admin/workflows/creator
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Home, Target, Palette, Send, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';

// Import redesigned components
import {
  StrategyPanel,
  StrategyCreator,
  FourByFourBeatEditor,
  SEOHealthIndicator,
  CaptionEditor,
  ShipPanel,
  ResultsTracker,
  GenerateCompleteScript,
  ViralReadinessMeter,
  CreatorScore,
  PersonalizationToast,
  getCTASuggestions,
  type BeatContent,
  type VideoResults,
} from '@/components/workflow-redesign';

import { useStrategy } from '@/hooks/useStrategy';
import { useVideoCreation } from '@/hooks/useVideoCreation';
import type { ContentStrategy, ContentPurpose, StrategyVideoData } from '@/types/database';

// ============================================
// Video Creation State
// ============================================

interface VideoCreationState {
  beats: BeatContent;
  caption: string;
  hashtags: string[];
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  dpsResult: {
    score: number;
    breakdown: { hook: number; proof: number; value: number; cta: number };
    suggestions: { hook?: string; proof?: string; value?: string; cta?: string };
  } | null;
  results: VideoResults;
}

const initialVideoState: VideoCreationState = {
  beats: { hook: '', proof: '', value: '', cta: '' },
  caption: '',
  hashtags: [],
  platform: 'tiktok',
  dpsResult: null,
  results: { views: 0, likes: 0, comments: 0, shares: 0 },
};

// ============================================
// Main Component
// ============================================

export default function CreatorWorkflowPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('strategy');
  const [showStrategyCreator, setShowStrategyCreator] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [videoState, setVideoState] = useState<VideoCreationState>(initialVideoState);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [scriptComplete, setScriptComplete] = useState(false);

  // Check if script is complete (for celebration trigger)
  const isScriptComplete =
    videoState.beats.hook.trim().length >= 20 &&
    videoState.beats.proof.trim().length >= 30 &&
    videoState.beats.value.trim().length >= 50 &&
    videoState.beats.cta.trim().length >= 15 &&
    videoState.caption.trim().length >= 20 &&
    videoState.hashtags.length >= 3;

  // Strategy management
  const {
    strategies,
    activeStrategy,
    isLoading: isLoadingStrategies,
    createStrategy,
    updateStrategy,
    selectStrategy,
  } = useStrategy();

  // Video management (database-backed)
  const {
    videos,
    activeVideo,
    isLoading: isLoadingVideos,
    isSaving,
    createVideo,
    updateVideo,
    fetchVideos,
    selectVideo,
    debouncedUpdate,
  } = useVideoCreation();

  // Fetch videos when active strategy changes
  useEffect(() => {
    if (activeStrategy?.id) {
      fetchVideos(activeStrategy.id);
    }
  }, [activeStrategy?.id, fetchVideos]);

  // Sync local state with active video from database
  useEffect(() => {
    if (activeVideo?.video_data) {
      const data = activeVideo.video_data;
      setVideoState({
        beats: {
          hook: data.hook || '',
          proof: data.proof || '',
          value: data.value || '',
          cta: data.cta || '',
        },
        caption: data.caption || '',
        hashtags: data.hashtags || [],
        platform: data.platform || 'tiktok',
        dpsResult: data.dps_score ? {
          score: data.dps_score,
          breakdown: data.dps_breakdown || { hook: 0, proof: 0, value: 0, cta: 0 },
          suggestions: {},
        } : null,
        results: data.results || { views: 0, likes: 0, comments: 0, shares: 0 },
      });
    }
  }, [activeVideo]);

  // Auto-save video state to database (debounced)
  useEffect(() => {
    if (activeStrategy?.id && activeVideo?.id) {
      const videoData: StrategyVideoData = {
        hook: videoState.beats.hook,
        proof: videoState.beats.proof,
        value: videoState.beats.value,
        cta: videoState.beats.cta,
        caption: videoState.caption,
        hashtags: videoState.hashtags,
        platform: videoState.platform,
        dps_score: videoState.dpsResult?.score,
        dps_breakdown: videoState.dpsResult?.breakdown,
        results: videoState.results,
      };
      debouncedUpdate(activeStrategy.id, activeVideo.id, videoData);
    }
  }, [videoState, activeStrategy?.id, activeVideo?.id, debouncedUpdate]);

  // Get CTA suggestions based on active strategy
  const ctaSuggestions = activeStrategy
    ? getCTASuggestions(activeStrategy.content_purpose as ContentPurpose)
    : [];

  // Auto-populate CTA with first suggestion when strategy changes and CTA is empty
  useEffect(() => {
    if (ctaSuggestions.length > 0 && !videoState.beats.cta) {
      setVideoState(prev => ({
        ...prev,
        beats: { ...prev.beats, cta: ctaSuggestions[0] },
      }));
    }
  }, [ctaSuggestions, activeStrategy?.id]);

  // Handlers
  const handleCreateStrategy = () => {
    setIsEditingStrategy(false);
    setShowStrategyCreator(true);
  };

  const handleEditStrategy = () => {
    setIsEditingStrategy(true);
    setShowStrategyCreator(true);
  };

  const handleSaveStrategy = async (data: any) => {
    if (isEditingStrategy && activeStrategy) {
      await updateStrategy(activeStrategy.id, data);
    } else {
      await createStrategy(data);
    }
    setShowStrategyCreator(false);
  };

  const handleCreateVideo = async () => {
    if (!activeStrategy?.id) return;
    
    try {
      // Create new video in database
      await createVideo(activeStrategy.id, {});
      // Reset local state
      setVideoState(initialVideoState);
      // Go to Create tab
      setActiveTab('create');
    } catch (error) {
      console.error('Failed to create video:', error);
    }
  };

  const handleBeatsChange = useCallback((beats: BeatContent) => {
    setVideoState(prev => ({ ...prev, beats }));
  }, []);

  const handleCaptionChange = useCallback((caption: string) => {
    setVideoState(prev => ({ ...prev, caption }));
  }, []);

  const handleHashtagsChange = useCallback((hashtags: string[]) => {
    setVideoState(prev => ({ ...prev, hashtags }));
  }, []);

  // Handler for "Generate Complete Script" one-click generation
  const handleGenerateComplete = useCallback((data: {
    beats: BeatContent;
    caption: string;
    hashtags: string[];
  }) => {
    setVideoState(prev => ({
      ...prev,
      beats: data.beats,
      caption: data.caption,
      hashtags: data.hashtags,
    }));
    // Trigger celebration
    setScriptComplete(true);
    setTimeout(() => setScriptComplete(false), 100); // Reset for next trigger
  }, []);

  const handleResultsChange = useCallback((results: VideoResults) => {
    setVideoState(prev => ({ ...prev, results }));
  }, []);

  const handleGetPrediction = async () => {
    setIsLoadingPrediction(true);
    setPredictionError(null);

    try {
      // Validate we have content to predict
      if (!videoState.beats.hook && !videoState.beats.value) {
        throw new Error('Please fill in at least the Hook and Value sections before getting a prediction');
      }

      // Call prediction API
      const response = await fetch('/api/kai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: videoState.beats.hook,
          proof: videoState.beats.proof,
          value: videoState.beats.value,
          cta: videoState.beats.cta,
          caption: videoState.caption,
          niche: activeStrategy?.niche,
          content_purpose: activeStrategy?.content_purpose,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Prediction failed (${response.status})`);
      }

      const data = await response.json();
      
      // Map API response to our format - use real scores, no random fallbacks
      const dpsResult = {
        score: data.predicted_dps_7d || 0,
        breakdown: {
          hook: data.hook_score || 0,
          proof: data.proof_score || 0,
          value: data.value_score || 0,
          cta: data.cta_score || 0,
        },
        suggestions: {
          hook: data.suggestions?.hook,
          proof: data.suggestions?.proof,
          value: data.suggestions?.value,
          cta: data.suggestions?.cta,
        },
      };
      setVideoState(prev => ({ ...prev, dpsResult }));
      return dpsResult;
    } catch (error) {
      console.error('Prediction error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get prediction. Please try again.';
      setPredictionError(errorMessage);
      // Clear any previous prediction result on error
      setVideoState(prev => ({ ...prev, dpsResult: null }));
      throw error;
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  // Niche-specific hashtag suggestions
  const getSuggestedHashtags = (): string[] => {
    if (!activeStrategy?.niche) return [];
    const nicheHashtags: Record<string, string[]> = {
      personal_finance: ['#personalfinance', '#moneytips', '#budgeting', '#financialfreedom'],
      side_hustles: ['#sidehustle', '#makemoneyonline', '#passiveincome', '#entrepreneur'],
      entrepreneurship: ['#entrepreneur', '#business', '#startup', '#ceo'],
      fitness: ['#fitness', '#workout', '#gym', '#health'],
      // Add more as needed
    };
    return nicheHashtags[activeStrategy.niche] || [];
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-6 p-8 bg-zinc-900 rounded-xl border border-zinc-800 max-w-md">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Sign In Required</h1>
            <p className="text-zinc-400">
              You need to be signed in to use the Creator Workflow.
            </p>
          </div>
          <Button
            onClick={() => signInWithGoogle('/admin/workflows/creator')}
            className="w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <Link href="/admin" className="text-white/50 hover:text-white transition-colors">
                <Home className="w-4 h-4" />
              </Link>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className="text-white/50">Workflows</span>
              <ChevronRight className="w-4 h-4 text-white/30" />
              <span className="text-white font-medium">Full Creator</span>
            </div>

            {/* Strategy, Creator Score, and save indicator */}
            <div className="flex items-center gap-4">
              {/* Creator Score & Streak */}
              <CreatorScore onScriptComplete={scriptComplete} />

              {isSaving && (
                <span className="text-xs text-zinc-500">Saving...</span>
              )}
              {activeStrategy && (
                <div className="text-sm text-zinc-400">
                  Strategy: <span className="text-white">{activeStrategy.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-zinc-900/50">
            <TabsTrigger value="strategy" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">1. Strategy</span>
              <span className="sm:hidden">1</span>
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">2. Create</span>
              <span className="sm:hidden">2</span>
            </TabsTrigger>
            <TabsTrigger value="ship" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">3. Ship</span>
              <span className="sm:hidden">3</span>
            </TabsTrigger>
          </TabsList>

          {/* Step 1: Strategy */}
          <TabsContent value="strategy" className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Your Content Strategy</h1>
              <p className="text-zinc-400 mt-1">
                Define once, create many videos. Research → Strategy → Multiple videos.
              </p>
            </div>

            <StrategyPanel
              strategy={activeStrategy}
              onEdit={handleEditStrategy}
              onCreateNew={handleCreateStrategy}
              onCreateVideo={handleCreateVideo}
              isLoading={isLoadingStrategies}
            />

            {/* Videos from this Strategy */}
            {activeStrategy && videos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm text-zinc-500 uppercase tracking-wide">
                  Videos from this Strategy ({videos.length})
                </h3>
                <div className="grid gap-2">
                  {videos.map(video => (
                    <button
                      key={video.id}
                      onClick={() => {
                        selectVideo(video);
                        setActiveTab('create');
                      }}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        activeVideo?.id === video.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="font-medium text-zinc-200 truncate">
                        {video.video_data?.hook?.slice(0, 50) || 'Untitled Video'}
                        {(video.video_data?.hook?.length || 0) > 50 ? '...' : ''}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {video.video_data?.dps_score ? `DPS: ${video.video_data.dps_score}` : 'No prediction yet'}
                        {' • '}
                        {new Date(video.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Strategy List (if multiple) */}
            {strategies.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm text-zinc-500 uppercase tracking-wide">
                  Your Strategies ({strategies.length})
                </h3>
                <div className="grid gap-2">
                  {strategies.map(strategy => (
                    <button
                      key={strategy.id}
                      onClick={() => selectStrategy(strategy)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        activeStrategy?.id === strategy.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="font-medium text-zinc-200">{strategy.name}</div>
                      <div className="text-xs text-zinc-500">
                        {strategy.niche.replace(/_/g, ' ')} | {strategy.content_purpose}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Step 2: Create */}
          <TabsContent value="create" className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Create Your Video</h1>
              <p className="text-zinc-400 mt-1">
                Use Paul's 4x4 structure: Hook → Proof → Value → CTA
              </p>
            </div>

            {/* Generate Complete Script - One Click Magic */}
            <GenerateCompleteScript
              strategy={activeStrategy}
              onGenerate={handleGenerateComplete}
            />

            {/* 4x4 Beat Editor */}
            <FourByFourBeatEditor
              beats={videoState.beats}
              onBeatsChange={handleBeatsChange}
              ctaSuggestions={ctaSuggestions}
              niche={activeStrategy?.niche}
            />

            {/* SEO Health */}
            <SEOHealthIndicator
              beats={videoState.beats}
              caption={videoState.caption}
              keywords={activeStrategy?.keywords || []}
              niche={activeStrategy?.niche}
            />

            {/* Viral Readiness Meter */}
            <ViralReadinessMeter
              beats={videoState.beats}
              caption={videoState.caption}
              hashtags={videoState.hashtags}
              keywords={activeStrategy?.keywords || []}
            />

            {/* Caption Editor */}
            <CaptionEditor
              caption={videoState.caption}
              onCaptionChange={handleCaptionChange}
              hashtags={videoState.hashtags}
              onHashtagsChange={handleHashtagsChange}
              suggestedHashtags={getSuggestedHashtags()}
              platform={videoState.platform}
            />
          </TabsContent>

          {/* Step 3: Ship */}
          <TabsContent value="ship" className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white">Ship Your Content</h1>
              <p className="text-zinc-400 mt-1">
                Get your DPS prediction and publish to your platform.
              </p>
            </div>

            <ShipPanel
              beats={videoState.beats}
              caption={videoState.caption}
              hashtags={videoState.hashtags}
              contentPurpose={activeStrategy?.content_purpose as ContentPurpose || null}
              onGetPrediction={handleGetPrediction}
              dpsResult={videoState.dpsResult}
              isLoadingPrediction={isLoadingPrediction}
              error={predictionError}
            />

            <ResultsTracker
              results={videoState.results}
              onResultsChange={handleResultsChange}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Strategy Creator Modal */}
      <StrategyCreator
        open={showStrategyCreator}
        onOpenChange={setShowStrategyCreator}
        onSave={handleSaveStrategy}
        initialData={isEditingStrategy && activeStrategy ? {
          name: activeStrategy.name,
          niche: activeStrategy.niche,
          audience_age_band: activeStrategy.audience_age_band,
          content_purpose: activeStrategy.content_purpose,
          keywords: activeStrategy.keywords,
          exemplar_ids: activeStrategy.exemplar_ids,
        } : undefined}
        isEditing={isEditingStrategy}
      />

      {/* Personalization Toast - shows when AI generates content */}
      <PersonalizationToast
        trigger={scriptComplete}
        niche={activeStrategy?.niche}
      />
    </div>
  );
}
