'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomCursor from './components/ui/CustomCursor';
import AmbientBackground from './components/ui/AmbientBackground';
import ViralPredictionDashboard from './components/ViralPredictionDashboard';
import EntryPhase from './components/phases/EntryPhase';
import OnboardingPhase from './components/phases/OnboardingPhase';
import GalleryPhase from './components/phases/GalleryPhase';
import AnalysisPhase from './components/phases/AnalysisPhase';
import LabPhase1 from './components/phases/LabPhase1';
import LabPhase2 from './components/phases/LabPhase2';
import LabPhase3 from './components/phases/LabPhase3';

// Phase definitions
enum ViralStudioPhase {
  ENTRY = 'entry',
  ONBOARDING = 'onboarding', 
  GALLERY = 'gallery',
  ANALYSIS = 'analysis',
  LAB_PHASE_1 = 'lab_phase_1', // DISCOVER YOUR VIRAL OPPORTUNITY
  LAB_PHASE_2 = 'lab_phase_2', // VALIDATE YOUR STRATEGY  
  LAB_PHASE_3 = 'lab_phase_3'  // CREATE WITH CERTAINTY
}

// Template interface
interface Template {
  id: string;
  title: string;
  niche: string;
  views: string;
  likes: string;
  viralScore: number;
  previewImage: string;
  previewVideo?: string;
  hoverFrames?: string[];
  framework?: string;
  successRate?: number;
  setupTime?: string;
  icon?: string;
}

// Comprehensive app state interface
interface ViralStudioState {
  // Current phase
  currentPhase: ViralStudioPhase;
  
  // Entry phase
  selectedPath: 'ai-templates' | 'from-scratch' | null;
  
  // Onboarding phase
  selectedNiche: string;
  selectedGoal: string;
  
  // Gallery phase
  selectedTemplate: Template | null;
  hoveredTemplate: string | null;
  
  // Analysis phase
  analysisData: {
    viralDNA: any;
    predictions: any;
  };
  
  // Lab phases shared state
  viralScore: number;
  videosAnalyzed: number;
  systemAccuracy: number;
  selectedFramework: string | null;
  
  // Lab Phase 1 (Discover)
  labPhase1: {
    trendPredictions: any[];
    selectedTemplate: string | null;
    successPredictions: any;
  };
  
  // Lab Phase 2 (Validate)
  labPhase2: {
    hookPower: number;
    retentionData: any;
    frameworkRecommendation: string;
    validationResults: any;
  };
  
  // Lab Phase 3 (Create)
  labPhase3: {
    checklist: any[];
    contentInputs: {
      hook: string;
      authority: string;
      valuePoints: string[];
    };
    liveScore: number;
    launchWindow: any;
  };
}

// Initial state
const initialState: ViralStudioState = {
  currentPhase: ViralStudioPhase.ENTRY,
  selectedPath: null,
  selectedNiche: '',
  selectedGoal: '',
  selectedTemplate: null,
  hoveredTemplate: null,
  analysisData: {
    viralDNA: null,
    predictions: null
  },
  viralScore: 85,
  videosAnalyzed: 24891,
  systemAccuracy: 91.3,
  selectedFramework: null,
  labPhase1: {
    trendPredictions: [],
    selectedTemplate: null,
    successPredictions: null
  },
  labPhase2: {
    hookPower: 0,
    retentionData: null,
    frameworkRecommendation: '',
    validationResults: null
  },
  labPhase3: {
    checklist: [],
    contentInputs: {
      hook: '',
      authority: '',
      valuePoints: ['', '', '']
    },
    liveScore: 60,
    launchWindow: null
  }
};

export default function ViralStudioPage({ initialView = 'dashboard', hideViewSwitcher = false }: { initialView?: 'dashboard' | 'workflow'; hideViewSwitcher?: boolean }) {
  const [viewMode, setViewMode] = useState<'dashboard' | 'workflow'>(initialView);
  const [state, setState] = useState<ViralStudioState>(initialState);

  // Phase transition handler
  const goToPhase = useCallback((phase: ViralStudioPhase, additionalData?: Partial<ViralStudioState>) => {
    setState(prevState => ({
      ...prevState,
      currentPhase: phase,
      ...additionalData
    }));
  }, []);

  // State update handlers
  const updateState = useCallback((updates: Partial<ViralStudioState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates
    }));
  }, []);

  // Specific phase handlers
  const handlePathSelection = useCallback((path: 'ai-templates' | 'from-scratch') => {
    updateState({ selectedPath: path });
    if (path === 'ai-templates') {
      goToPhase(ViralStudioPhase.ONBOARDING);
    }
  }, [updateState, goToPhase]);

  const handleOnboardingComplete = useCallback((niche: string, goal: string) => {
    updateState({ selectedNiche: niche, selectedGoal: goal });
    goToPhase(ViralStudioPhase.GALLERY);
  }, [updateState, goToPhase]);

  const handleTemplateSelection = useCallback((template: Template) => {
    updateState({ 
      selectedTemplate: template,
      analysisData: {
        viralDNA: generateViralDNA(template),
        predictions: generatePredictions(template)
      }
    });
    goToPhase(ViralStudioPhase.ANALYSIS);
  }, [updateState, goToPhase]);

  const handleAnalysisComplete = useCallback(() => {
    goToPhase(ViralStudioPhase.LAB_PHASE_1);
  }, [goToPhase]);

  const handleLabPhase1Complete = useCallback(() => {
    goToPhase(ViralStudioPhase.LAB_PHASE_2);
  }, [goToPhase]);

  const handleLabPhase2Complete = useCallback(() => {
    goToPhase(ViralStudioPhase.LAB_PHASE_3);
  }, [goToPhase]);

  // Mock data generators
  const generateViralDNA = (template: Template) => {
    return {
      hookType: 'Authority Statement',
      valueProposition: 'Educational Content',
      callToAction: 'Follow for more tips',
      visualStyle: 'Clean & Professional',
      audioTrend: 'Trending Sound #1',
      framework: template.framework || 'Authority Hook'
    };
  };

  const generatePredictions = (template: Template) => {
    return {
      viralProbability: template.viralScore,
      predictedViews: template.views,
      peakEngagement: '72h',
      confidence: '94%',
      successFactors: [
        { factor: 'Audience Match', score: '94%' },
        { factor: 'Trending Audio Sync', score: '91%' },
        { factor: 'Optimal Timing', score: '87%' },
        { factor: 'Hook Strength', score: '92%' }
      ]
    };
  };

  // Videos analyzed counter effect
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prevState => ({
        ...prevState,
        videosAnalyzed: prevState.videosAnalyzed + Math.floor(Math.random() * 3) + 1
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // System accuracy banner component
  const SystemBanner = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 px-6 py-3 flex justify-between items-center text-white font-semibold text-sm"
    >
      <div className="flex items-center gap-4">
        <div>🎯 System Accuracy: {state.systemAccuracy}%</div>
        <div>📊 Videos Analyzed: {state.videosAnalyzed.toLocaleString()}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Live Analysis Active</span>
      </div>
    </motion.div>
  );

  // Navigation header for lab phases
  const LabNavigation = () => {
    const isLabPhase = [ViralStudioPhase.LAB_PHASE_1, ViralStudioPhase.LAB_PHASE_2, ViralStudioPhase.LAB_PHASE_3].includes(state.currentPhase);
    
    if (!isLabPhase) return null;

    const phases = [
      { id: ViralStudioPhase.LAB_PHASE_1, label: 'Discover', subtitle: 'Your Viral Opportunity' },
      { id: ViralStudioPhase.LAB_PHASE_2, label: 'Validate', subtitle: 'Your Strategy' },
      { id: ViralStudioPhase.LAB_PHASE_3, label: 'Create', subtitle: 'With Certainty' }
    ];

    return (
      <div className="bg-black/20 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Viral Lab V2</h1>
            <p className="text-white/60 text-sm">The 3-Phase Creation System</p>
          </div>
          
          <div className="flex items-center gap-6">
            {phases.map((phase, index) => (
              <motion.button
                key={phase.id}
                onClick={() => goToPhase(phase.id)}
                className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                  state.currentPhase === phase.id
                    ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  state.currentPhase === phase.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/60'
                }`}>
                  {index + 1}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm">{phase.label}</div>
                  <div className="text-xs opacity-70">{phase.subtitle}</div>
                </div>
              </motion.button>
            ))}
          </div>
          
          <div className="text-right">
            <div className="text-white/60 text-sm">Selected Niche</div>
            <div className="text-white font-semibold">{state.selectedNiche || 'Not Selected'}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <CustomCursor />
      <AmbientBackground />
      
      {/* View Mode Switcher */}
      {!hideViewSwitcher && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'dashboard' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📊 Command Dashboard
          </button>
          <button
            onClick={() => setViewMode('workflow')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'workflow' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🎬 Creation Workflow
          </button>
        </div>
      )}

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'dashboard' ? (
        <ViralPredictionDashboard />
      ) : (
        <>
          {/* System Banner - shown on lab phases */}
          {[ViralStudioPhase.LAB_PHASE_1, ViralStudioPhase.LAB_PHASE_2, ViralStudioPhase.LAB_PHASE_3].includes(state.currentPhase) && (
            <SystemBanner />
          )}
          
          {/* Lab Navigation - shown on lab phases */}
          <LabNavigation />
      
      {/* Main Content Area */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {state.currentPhase === ViralStudioPhase.ENTRY && (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <EntryPhase onPathSelect={handlePathSelection} />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.ONBOARDING && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <OnboardingPhase 
                onComplete={handleOnboardingComplete}
                selectedNiche={state.selectedNiche}
                selectedGoal={state.selectedGoal}
              />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.GALLERY && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <GalleryPhase 
                selectedNiche={state.selectedNiche}
                onTemplateSelect={handleTemplateSelection}
                hoveredTemplate={state.hoveredTemplate}
                onTemplateHover={(templateId) => updateState({ hoveredTemplate: templateId })}
              />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.ANALYSIS && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <AnalysisPhase 
                template={state.selectedTemplate}
                analysisData={state.analysisData}
                onComplete={handleAnalysisComplete}
              />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.LAB_PHASE_1 && (
            <motion.div
              key="lab-phase-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <LabPhase1 
                state={state}
                updateState={updateState}
                onComplete={handleLabPhase1Complete}
              />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.LAB_PHASE_2 && (
            <motion.div
              key="lab-phase-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <LabPhase2 
                state={state}
                updateState={updateState}
                onComplete={handleLabPhase2Complete}
              />
            </motion.div>
          )}

          {state.currentPhase === ViralStudioPhase.LAB_PHASE_3 && (
            <motion.div
              key="lab-phase-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <LabPhase3 
                state={state}
                updateState={updateState}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </>
      )}
    </div>
  );
}