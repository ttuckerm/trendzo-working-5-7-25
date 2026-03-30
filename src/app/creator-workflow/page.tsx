'use client';

// FEAT-071: Unified Creator Workflow
// Main single-page workflow component
// Created: 2025-10-22

import { useState, useEffect } from 'react';
import { GOALS, type Goal, type ViralVideo, type NineFields, type Prediction, type WorkflowUIState } from '@/types/creator-workflow';

export default function CreatorWorkflowPage() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [state, setState] = useState<WorkflowUIState>({
    currentStep: 1,
    selectedGoal: null,
    discoveredVideos: [],
    scriptDraft: {},
    frameworkMatch: null,
    prediction: null,
    loading: false,
    error: null
  });

  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [auditId, setAuditId] = useState<string>('');

  // ============================================================================
  // STEP 1: GOAL SELECTION
  // ============================================================================

  const handleGoalSelect = async (goal: Goal) => {
    setState(prev => ({
      ...prev,
      selectedGoal: goal,
      loading: true,
      error: null
    }));

    try {
      // Call API to create workflow session
      const response = await fetch('/api/creator-workflow/select-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId: goal.id })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to select goal');
      }

      setWorkflowId(result.workflowId);
      setAuditId(result.auditId);

      // Advance to Step 2
      setState(prev => ({
        ...prev,
        currentStep: 2,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to select goal'
      }));
    }
  };

  // ============================================================================
  // STEP 2: DISCOVER VIRAL VIDEOS
  // ============================================================================

  useEffect(() => {
    if (state.currentStep === 2 && state.selectedGoal && state.discoveredVideos.length === 0) {
      discoverViralVideos();
    }
  }, [state.currentStep, state.selectedGoal]);

  const discoverViralVideos = async () => {
    if (!state.selectedGoal || !workflowId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call API to discover viral videos
      const response = await fetch('/api/creator-workflow/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          goalId: state.selectedGoal.id,
          niche: 'general',
          limit: 10
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to discover videos');
      }

      setState(prev => ({
        ...prev,
        discoveredVideos: result.videos || [],
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to discover videos'
      }));
    }
  };

  // ============================================================================
  // STEP 3: DESIGN (AI SUGGESTIONS)
  // ============================================================================

  // Auto-trigger AI suggestions when Step 3 loads
  useEffect(() => {
    if (state.currentStep === 3 && Object.keys(state.scriptDraft).length === 0 && !state.loading) {
      handleAISuggest();
    }
  }, [state.currentStep]);

  const handleAISuggest = async () => {
    if (!state.selectedGoal || state.discoveredVideos.length === 0 || !workflowId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call API to get AI suggestions
      const response = await fetch('/api/creator-workflow/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          goalId: state.selectedGoal.id,
          viralExamples: state.discoveredVideos.slice(0, 3).map(v => v.video_id),
          userNiche: 'general'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate suggestions');
      }

      setState(prev => ({
        ...prev,
        scriptDraft: result.suggestions || {},
        frameworkMatch: result.framework_matched || null,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to generate suggestions'
      }));
    }
  };

  // ============================================================================
  // STEP 4: PREDICT
  // ============================================================================

  const handlePredict = async () => {
    if (!state.selectedGoal || !state.scriptDraft || !workflowId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Call API to get prediction
      const response = await fetch('/api/creator-workflow/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId,
          script: state.scriptDraft,
          goalId: state.selectedGoal.id,
          niche: 'general'
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate prediction');
      }

      setState(prev => ({
        ...prev,
        prediction: result.prediction,
        currentStep: 4,
        loading: false
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to generate prediction'
      }));
    }
  };

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const handleNext = () => {
    if (state.currentStep < 4) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep + 1) as 1 | 2 | 3 | 4 }));
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: (prev.currentStep - 1) as 1 | 2 | 3 | 4 }));
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0A1E] to-[#1a0f2e] text-white">
      {/* Header */}
      <header data-testid="Creator-Workflow-Header" className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Script Performance Lab
          </h1>
          <p className="text-gray-400 mt-2">Turn your script ideas into viral TikTok content</p>

          {/* Progress Bar */}
          <div data-testid="Progress-Bar" className="mt-6 flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step <= state.currentStep
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Step {state.currentStep} of 4
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Error Banner */}
        {state.error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            ⚠️ {state.error}
          </div>
        )}

        {/* Audit ID Banner (for debugging) */}
        {auditId && (
          <div data-testid="Banner-AuditId" className="mb-8 p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-500 font-mono">
            Audit ID: {auditId}
          </div>
        )}

        {/* Step Content */}
        <div className="mb-12">
          {state.currentStep === 1 && <StepGoalSelection goals={GOALS} onSelect={handleGoalSelect} loading={state.loading} />}
          {state.currentStep === 2 && <StepDiscover videos={state.discoveredVideos} loading={state.loading} />}
          {state.currentStep === 3 && <StepDesign scriptDraft={state.scriptDraft} frameworkMatch={state.frameworkMatch} onAISuggest={handleAISuggest} onFieldChange={(field, value) => setState(prev => ({ ...prev, scriptDraft: { ...prev.scriptDraft, [field]: value } }))} loading={state.loading} />}
          {state.currentStep === 4 && <StepPredict prediction={state.prediction} scriptDraft={state.scriptDraft} loading={state.loading} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            data-testid="Btn-Back"
            onClick={handleBack}
            disabled={state.currentStep === 1}
            className="px-6 py-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← Back
          </button>

          {state.currentStep < 4 && (
            <button
              data-testid="Btn-Next"
              onClick={handleNext}
              disabled={
                (state.currentStep === 1 && !state.selectedGoal) ||
                (state.currentStep === 2 && state.discoveredVideos.length === 0) ||
                (state.currentStep === 3 && Object.keys(state.scriptDraft).length === 0) ||
                state.loading
              }
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              Next →
            </button>
          )}

          {state.currentStep === 3 && (
            <button
              onClick={handlePredict}
              disabled={Object.keys(state.scriptDraft).length === 0 || state.loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              🧬 Predict Performance
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS (Placeholders - will implement next)
// ============================================================================

function StepGoalSelection({ goals, onSelect, loading }: { goals: Goal[]; onSelect: (goal: Goal) => void; loading: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">What do you want to achieve?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <button
            key={goal.id}
            data-testid={`Goal-Card-${goal.id.replace('OBJ-', '')}`}
            onClick={() => onSelect(goal)}
            disabled={loading}
            className="p-6 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 disabled:opacity-50 transition-all text-left group"
          >
            <div className="text-4xl mb-3">{goal.icon}</div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-purple-400 transition-colors">{goal.name}</h3>
            <p className="text-gray-400 text-sm">{goal.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDiscover({ videos, loading }: { videos: ViralVideo[]; loading: boolean }) {
  if (loading) {
    return (
      <div data-testid="Discover-Grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 animate-pulse" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return <div className="text-center text-gray-400 py-12">Loading viral videos...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🔥 Viral Videos Achieving Your Goal</h2>
      <div data-testid="Discover-Grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <div key={video.video_id} data-testid={`Video-Card-${video.video_id}`} className="p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-all">
            <div className="flex justify-between items-start mb-3">
              <span data-testid={`Video-DPS-Score-${video.video_id}`} className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">
                DPS {video.dps_score}
              </span>
              <span className="text-gray-400 text-sm">{video.creator}</span>
            </div>
            <p data-testid={`Video-Hook-${video.video_id}`} className="text-white mb-2 font-medium">{video.hook}</p>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span data-testid={`Video-Views-${video.video_id}`}>{(video.views / 1000000).toFixed(1)}M views</span>
              <span>{video.framework_name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDesign({ scriptDraft, frameworkMatch, onAISuggest, onFieldChange, loading }: any) {
  const fields = [
    { key: 'topic', label: 'Topic', placeholder: 'What is your video about?', testId: 'Input-Topic' },
    { key: 'angle', label: 'Angle', placeholder: 'What unique perspective are you taking?', testId: 'Input-Angle' },
    { key: 'hook_spoken', label: 'Hook (Spoken)', placeholder: 'First words viewers will hear...', testId: 'Input-Hook-Spoken' },
    { key: 'hook_text', label: 'Hook (Text Overlay)', placeholder: 'Text that appears on screen...', testId: 'Input-Hook-Text' },
    { key: 'hook_visual', label: 'Hook (Visual)', placeholder: 'Opening visual element...', testId: 'Input-Hook-Visual' },
    { key: 'story_structure', label: 'Story Structure', placeholder: 'How will you tell the story?', testId: 'Input-Story-Structure' },
    { key: 'visual_format', label: 'Visual Format', placeholder: 'Talking head, B-roll, animation...', testId: 'Input-Visual-Format' },
    { key: 'audio', label: 'Audio/Music', placeholder: 'Background music or trending audio...', testId: 'Input-Audio' }
  ];

  // Show loading state while AI generates suggestions
  if (loading && Object.keys(scriptDraft).length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Analyzing Viral Patterns...</h2>
        <p className="text-gray-400">Extracting proven hooks, triggers, and frameworks from top-performing videos</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Design Your Content</h2>
        <button
          data-testid="Btn-AI-Suggest"
          onClick={onAISuggest}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all text-sm font-semibold"
        >
          {loading ? 'Regenerating...' : '🔄 Regenerate'}
        </button>
      </div>

      {frameworkMatch && (
        <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <span data-testid="Framework-Badge" className="font-bold text-purple-400">{frameworkMatch.name}</span>
          <span data-testid="Framework-Success-Rate" className="ml-3 text-sm text-gray-400">{(frameworkMatch.success_rate * 100).toFixed(0)}% success rate</span>
        </div>
      )}

      <div data-testid="Design-Form" className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              {field.label}
            </label>
            <input
              data-testid={field.testId}
              type="text"
              value={scriptDraft[field.key] || ''}
              onChange={(e) => onFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none text-white placeholder-gray-500 transition-all"
            />
          </div>
        ))}

        {/* Key Visuals - Array Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Key Visuals (comma-separated)
          </label>
          <input
            data-testid="Input-Key-Visuals"
            type="text"
            value={Array.isArray(scriptDraft.key_visuals) ? scriptDraft.key_visuals.join(', ') : ''}
            onChange={(e) => onFieldChange('key_visuals', e.target.value.split(',').map((v: string) => v.trim()))}
            placeholder="Visual 1, Visual 2, Visual 3..."
            className="w-full px-4 py-3 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:outline-none text-white placeholder-gray-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

function StepPredict({ prediction, scriptDraft, loading }: any) {
  if (!prediction) {
    return <div className="text-center text-gray-400 py-12">Ready to predict...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">📊 Prediction Results</h2>

      {/* Score Circle */}
      <div className="text-center mb-8">
        <div data-testid="Prediction-Score-Circle" className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white text-4xl font-bold">
          {prediction.dps_score}
        </div>
        <div data-testid="Prediction-Status-Badge" className="mt-4 text-lg font-semibold text-green-400">
          ⚡ LIKELY TO GO VIRAL
        </div>
      </div>

      {/* Projected Performance */}
      <div className="mb-8 p-6 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
        <h3 className="text-xl font-bold mb-4">📈 Projected Performance (24 hours)</h3>
        <div className="space-y-2 text-gray-300">
          <div data-testid="Prediction-Projected-Views">• Views: {(prediction.projected_views.min / 1000).toFixed(0)}K - {(prediction.projected_views.max / 1000000).toFixed(1)}M</div>
          <div data-testid="Prediction-Projected-Engagement">• Engagement Rate: {(prediction.projected_engagement_rate * 100).toFixed(0)}%</div>
          <div>• Share Potential: {prediction.share_potential.toUpperCase()}</div>
        </div>
      </div>

      {/* What's Working */}
      <div data-testid="Whats-Working-Section" className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-green-400">✅ What's Working</h3>
        <div className="space-y-2">
          {prediction.whats_working.map((item: string, i: number) => (
            <div key={i} data-testid={`Whats-Working-Item-${i}`} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300">
              • {item}
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Improvements */}
      <div data-testid="Suggested-Improvements-Section" className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-yellow-400">⚠️ Suggested Improvements</h3>
        <div className="space-y-3">
          {prediction.suggested_improvements.map((improvement: any, i: number) => (
            <div key={i} data-testid={`Suggested-Improvement-${i}`} className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <div className="font-semibold text-yellow-300 mb-2">{improvement.issue}</div>
              <div className="text-gray-300 mb-2">{improvement.fix}</div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Impact: {improvement.impact}</span>
                {improvement.one_click_fix && (
                  <button data-testid={`Btn-Apply-Fix-${i}`} className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-700 text-sm transition-all">
                    Apply Fix
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
