'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/services/analytics';
import { ErrorBoundary } from '@/components/debug/ErrorBoundary';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Story options with gradients
const STORY_OPTIONS = [
  { id: 1, icon: '👩‍🦰', gradient: 'linear-gradient(45deg, #e1306c, #ff8a65)' },
  { id: 2, icon: '👨‍💼', gradient: 'linear-gradient(45deg, #7c4dff, #b388ff)' },
  { id: 3, icon: '👤', gradient: 'linear-gradient(45deg, #448aff, #82b1ff)' },
  { id: 4, icon: '🧠', gradient: 'linear-gradient(45deg, #00e676, #69f0ae)' },
  { id: 5, icon: '⏰', gradient: 'linear-gradient(45deg, #ff6e40, #ffab40)' },
  { id: 6, icon: '🎯', gradient: 'linear-gradient(45deg, #ab47bc, #e1bee7)' },
];

// Workflow steps
const WORKFLOW_STEPS = [
  {
    id: 1,
    title: 'Script with Timing Markers',
    subtitle: 'Structure your viral framework',
    icon: '⏱️',
    updateTitle: 'Timing Structure Set',
    updateSubtitle: 'Hook → Problem → Value → CTA flow ready'
  },
  {
    id: 2,
    title: 'Visual Composition',
    subtitle: 'Camera angles & scene transitions',
    icon: '🎬',
    updateTitle: 'Visual Composition Active',
    updateSubtitle: 'Camera angles and scenes configured'
  },
  {
    id: 3,
    title: 'Audio-Visual Sync',
    subtitle: 'Trending tracks for your niche',
    icon: '🎵',
    updateTitle: 'Audio Synchronized',
    updateSubtitle: 'Beat-matched to viral timing patterns'
  },
  {
    id: 4,
    title: 'Psychological Triggers',
    subtitle: 'Optimize engagement beats',
    icon: '🧠',
    updateTitle: 'Psychology Optimized',
    updateSubtitle: 'Engagement triggers activated'
  }
];

// Breadcrumb steps
const BREADCRUMB_STEPS = ['Template', 'Hook', 'Structure', 'Format', 'Predict', 'Preview', 'Publish'];

// Main Template Editor Component
function MVPTemplateEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedStory, setSelectedStory] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeBreadcrumb, setActiveBreadcrumb] = useState(1);
  const isRestricted = searchParams.get('restricted') === 'true';
  
  // Track editor entry
  useEffect(() => {
    const ref = searchParams.get('ref') || 'dashboard';
    const email = searchParams.get('email');
    
    trackEvent('editor_entry', {
      source: ref,
      hasEmail: !!email,
      isRestricted
    });
  }, [searchParams, isRestricted]);

  const completeStep = (stepNumber: number) => {
    setCompletedSteps([...completedSteps, stepNumber]);
    
    trackEvent('template_step_complete', {
      step: stepNumber,
      stepName: WORKFLOW_STEPS[stepNumber - 1].title
    });

    // Advance to next step or show completion
    if (stepNumber < WORKFLOW_STEPS.length) {
      setTimeout(() => {
        setActiveStep(stepNumber + 1);
      }, 600);
    } else {
      setTimeout(() => {
        setShowCompletion(true);
        trackEvent('template_complete', {
          templateId: 'demo',
          userId: 'anonymous',
          completionTime: Date.now()
        });
      }, 600);
    }
  };

  const handlePublish = () => {
    // If user is restricted, redirect to auth
    if (isRestricted) {
      trackEvent('restricted_user_save_attempt', {});
      router.push('/auth?action=complete_signup&return=/dashboard-view/template-editor');
      return;
    }

    // If user has email from exit intent, use magic link
    const email = searchParams.get('email');
    if (email) {
      trackEvent('magic_link_sent', { email });
      router.push(`/auth/magic-link?email=${encodeURIComponent(email)}&action=save_template`);
    } else {
      // Show save template flow
      trackEvent('save_template_prompt', {});
      router.push('/auth/save-template');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Story Circle Row */}
      <div className="h-20 flex gap-3 overflow-x-auto px-6 py-3 items-center bg-white border-b border-gray-200 scrollbar-hide">
        {STORY_OPTIONS.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedStory(story.id)}
            className="w-14 h-14 rounded-full relative cursor-pointer flex-shrink-0"
          >
            <div 
              className="w-full h-full rounded-full p-[2px] flex items-center justify-center"
              style={{ background: story.gradient }}
            >
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl">
                {story.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Workbench Grid */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Template Preview Card */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm p-6 overflow-hidden">
          <div className="h-12 flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm">
              🎬
            </div>
            <div className="text-sm font-medium text-gray-800">viralcreator</div>
          </div>
          
          <div className="aspect-square bg-gray-100 rounded-xl mx-auto mb-4 relative flex items-center justify-center max-w-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center p-4"
              >
                <div className="text-5xl mb-3">
                  {activeStep <= WORKFLOW_STEPS.length ? WORKFLOW_STEPS[activeStep - 1].icon : '🚀'}
                </div>
                <div className="text-lg font-semibold text-purple-600 mb-1">
                  {activeStep <= WORKFLOW_STEPS.length ? 
                    WORKFLOW_STEPS[activeStep - 1].updateTitle : 
                    'Viral Video Ready'
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {activeStep <= WORKFLOW_STEPS.length ? 
                    WORKFLOW_STEPS[activeStep - 1].updateSubtitle : 
                    'Predicted 2.3M views • Ready to post'
                  }
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="flex justify-center gap-6 text-center">
            <div className="cursor-pointer hover:scale-110 transition-transform">
              <div className="text-lg">❤️</div>
              <div className="text-xs font-medium text-gray-600">12.5K</div>
            </div>
            <div className="cursor-pointer hover:scale-110 transition-transform">
              <div className="text-lg">💬</div>
              <div className="text-xs font-medium text-gray-600">482</div>
            </div>
            <div className="cursor-pointer hover:scale-110 transition-transform">
              <div className="text-lg">↗️</div>
              <div className="text-xs font-medium text-gray-600">1.2K</div>
            </div>
          </div>
        </div>

        {/* Optimization Stack */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-xl shadow-sm p-6 h-full overflow-y-auto">
            {/* Workflow Steps */}
            {WORKFLOW_STEPS.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: activeStep >= step.id ? 1 : 0.3,
                  y: activeStep >= step.id ? 0 : 20
                }}
                transition={{ delay: step.id * 0.1 }}
                className={`mb-6 ${completedSteps.includes(step.id) ? 'opacity-70' : ''}`}
              >
                <div 
                  className="flex items-center gap-3 mb-3 cursor-pointer hover:translate-x-1 transition-transform"
                  onClick={() => activeStep === step.id && setActiveStep(step.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    completedSteps.includes(step.id) ? 'bg-green-500 text-white' :
                    activeStep === step.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {completedSteps.includes(step.id) ? '✓' : step.id}
                  </div>
                  <div className="text-base font-medium text-gray-800">{step.title}</div>
                </div>

                <AnimatePresence>
                  {activeStep === step.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="ml-11"
                    >
                      <p className="text-sm text-gray-600 mb-3">{step.subtitle}</p>
                      
                      {/* Step-specific content */}
                      {step.id === 1 && <TimingSection onComplete={() => completeStep(1)} />}
                      {step.id === 2 && <VisualSection onComplete={() => completeStep(2)} />}
                      {step.id === 3 && <AudioSection onComplete={() => completeStep(3)} />}
                      {step.id === 4 && <PsychologySection onComplete={() => completeStep(4)} />}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Completion Celebration */}
            <AnimatePresence>
              {showCompletion && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-6 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="text-4xl mb-3">🎉</div>
                  <div className="text-lg font-semibold text-green-700 mb-2">
                    Your Viral Video is Ready!
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    847 creators posted similar videos today
                  </div>
                  <button
                    onClick={handlePublish}
                    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:scale-105 transition-transform"
                  >
                    {isRestricted ? 'Sign Up to Publish' : 'Publish Video'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Breadcrumb Bar */}
      <nav className="h-16 bg-white border-t border-gray-200 px-6 flex items-center gap-2 overflow-x-auto">
        {BREADCRUMB_STEPS.map((step, index) => (
          <React.Fragment key={step}>
            <div
              className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
                index === 0 ? 'bg-green-500 text-white' :
                index === activeBreadcrumb ? 'bg-purple-500 text-white' :
                'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => setActiveBreadcrumb(index)}
            >
              {step}
            </div>
            {index < BREADCRUMB_STEPS.length - 1 && (
              <span className="text-gray-300">•</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}

// Component sections for each step
function TimingSection({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState(0);
  const timings = [
    { label: '0-3s', description: 'Hook - Grab attention instantly' },
    { label: '3-10s', description: 'Problem - Present pain point' },
    { label: '10-20s', description: 'Value - Deliver solution' },
    { label: '20-30s', description: 'CTA - Drive action' }
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {timings.map((timing, index) => (
          <div
            key={index}
            onClick={() => setSelected(index)}
            className={`p-3 rounded-lg cursor-pointer transition-all ${
              selected === index ? 
              'bg-green-50 border-2 border-green-500' : 
              'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className="text-purple-600 font-medium text-xs mb-1">{timing.label}</div>
            <div className="text-xs text-gray-600">{timing.description}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <button className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all">
          Customize Script
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-all"
        >
          Complete Timing
        </button>
      </div>
    </>
  );
}

function VisualSection({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const visuals = ['📱', '🎥', '🏠', '🌅', '💼', '🎯'];

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {visuals.map((visual, index) => (
          <div
            key={index}
            onClick={() => setSelected(index)}
            className={`aspect-video rounded-lg flex items-center justify-center text-xl cursor-pointer transition-all ${
              selected === index ? 
              'bg-green-50 border-2 border-green-500' : 
              'bg-gray-50 border border-gray-200 hover:bg-purple-50 hover:border-purple-300'
            }`}
          >
            {visual}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <button className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all">
          Preview Scene
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-all"
        >
          Apply Visuals
        </button>
      </div>
    </>
  );
}

function AudioSection({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const tracks = [
    { name: 'Viral Beat #247', trending: '2.3M uses' },
    { name: 'Trending Mix #89', trending: '+847%' },
    { name: 'Lo-fi Vibe #34', trending: 'Rising' }
  ];

  return (
    <>
      {tracks.map((track, index) => (
        <div
          key={index}
          onClick={() => setSelected(index)}
          className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all ${
            selected === index ? 
            'bg-green-50 border border-green-500' : 
            'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center text-xs">
            🎵
          </div>
          <div className="flex-1 text-sm font-medium text-gray-800">{track.name}</div>
          <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">{track.trending}</div>
        </div>
      ))}
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <button className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all">
          Preview Audio
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-all"
        >
          Sync Track
        </button>
      </div>
    </>
  );
}

function PsychologySection({ onComplete }: { onComplete: () => void }) {
  return (
    <>
      <div className="space-y-3">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">
              ⚡
            </div>
            <div className="flex-1 text-sm font-medium text-gray-800">Tension Points</div>
            <div className="text-xs text-green-600 font-medium">Optimized</div>
          </div>
          <div className="text-xs text-gray-600">Strategic pauses at 7s, 15s, and 25s</div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-sm">
              🧠
            </div>
            <div className="flex-1 text-sm font-medium text-gray-800">Engagement Beats</div>
            <div className="text-xs text-green-600 font-medium">Active</div>
          </div>
          <div className="text-xs text-gray-600">Curiosity gaps trigger dopamine release</div>
        </div>
      </div>
      
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
        <button className="flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-all">
          Analyze Flow
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-lg bg-purple-500 text-white text-sm hover:bg-purple-600 transition-all"
        >
          Apply Triggers
        </button>
      </div>
    </>
  );
}

// Fallback component if the editor fails to load
const EditorErrorFallback = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Editor Error</h2>
        <p className="text-gray-600 mb-6">
          We encountered an issue loading the template editor. This could be due to a browser compatibility issue or a temporary technical problem.
        </p>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Refresh Editor
          </Button>
          <Link href="/dashboard-view/template-library" passHref>
            <Button variant="outline" className="w-full">
              Return to Template Library
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function DashboardTemplateEditorPage() {
  return (
    <ErrorBoundary 
      componentName="DashboardTemplateEditorPage"
      fallback={<EditorErrorFallback />}
    >
      <MVPTemplateEditor />
    </ErrorBoundary>
  );
} 