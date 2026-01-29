"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { trackEvent } from '@/lib/services/analytics';

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

export default function DashboardTemplateEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedStory, setSelectedStory] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  
  // Track editor entry
  useEffect(() => {
    const ref = searchParams.get('ref') || 'dashboard';
    const email = searchParams.get('email');
    const restricted = searchParams.get('restricted') === 'true';
    
    trackEvent('editor_entry', {
      source: ref,
      hasEmail: !!email,
      isRestricted: restricted
    });
  }, [searchParams]);

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
    const isRestricted = searchParams.get('restricted') === 'true';
    const email = searchParams.get('email');
    
    if (isRestricted) {
      // Restricted users must sign up
      trackEvent('restricted_save_attempt', {});
      router.push('/auth?action=save_template&restricted=true');
    } else if (email) {
      // Users with email from exit intent use magic link
      trackEvent('magic_link_sent', { email });
      router.push(`/auth?email=${encodeURIComponent(email)}&action=save_template`);
    } else {
      // Regular users can save
      trackEvent('template_saved', {});
      // Here you would normally save the template
      alert('Template saved successfully!');
    }
  };

  return (
    <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4">
        <h1 className="text-white text-2xl font-bold">Viral Template Editor</h1>
        <p className="text-white/80 text-sm mt-1">Create content that gets results</p>
      </div>

      <div className="p-6 h-[calc(100%-120px)] overflow-y-auto">
        {/* Story Options */}
        <div className="mb-6">
          <h3 className="text-gray-700 font-semibold mb-3">Choose Your Template Style</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STORY_OPTIONS.map((story) => (
              <motion.div
                key={story.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedStory(story.id)}
                className="cursor-pointer flex-shrink-0"
              >
                <div 
                  className="w-16 h-16 rounded-full p-[3px]"
                  style={{ background: story.gradient }}
                >
                  <div className={`w-full h-full rounded-full bg-white flex items-center justify-center text-2xl ${
                    selectedStory === story.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                  }`}>
                    {story.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-gray-700 font-semibold mb-4">Preview</h3>
            <div className="bg-black rounded-lg aspect-[9/16] max-w-[300px] mx-auto flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center p-6"
                >
                  <div className="text-6xl mb-4">
                    {activeStep <= WORKFLOW_STEPS.length ? WORKFLOW_STEPS[activeStep - 1].icon : '🚀'}
                  </div>
                  <div className="text-xl font-semibold text-pink-500 mb-2">
                    {activeStep <= WORKFLOW_STEPS.length ? 
                      WORKFLOW_STEPS[activeStep - 1].updateTitle : 
                      'Ready to Go Viral!'
                    }
                  </div>
                  <div className="text-white/60 text-sm">
                    {activeStep <= WORKFLOW_STEPS.length ? 
                      WORKFLOW_STEPS[activeStep - 1].updateSubtitle : 
                      'Your content is optimized'
                    }
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-4">
            <h3 className="text-gray-700 font-semibold mb-4">Build Your Viral Content</h3>
            {WORKFLOW_STEPS.map((step) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: activeStep >= step.id ? 1 : 0.5,
                  x: 0
                }}
                className={`border rounded-lg p-4 ${
                  completedSteps.includes(step.id) ? 'border-green-500 bg-green-50' :
                  activeStep === step.id ? 'border-purple-500 bg-purple-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    completedSteps.includes(step.id) ? 'bg-green-500 text-white' :
                    activeStep === step.id ? 'bg-purple-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {completedSteps.includes(step.id) ? '✓' : step.id}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.subtitle}</p>
                  </div>
                </div>

                <AnimatePresence>
                  {activeStep === step.id && !completedSteps.includes(step.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4"
                    >
                      <button
                        onClick={() => completeStep(step.id)}
                        className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Complete This Step
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* Completion */}
            <AnimatePresence>
              {showCompletion && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-6 text-center"
                >
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold mb-2">Your Template is Ready!</h3>
                  <p className="mb-4 opacity-90">Time to share it with the world</p>
                  <button
                    onClick={handlePublish}
                    className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Publish Template
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component sections (simplified for dashboard integration)
function TimingSection({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-3">
      <div className="bg-white border border-gray-200 rounded p-3">
        <div className="text-sm font-semibold text-purple-600">0-3s Hook</div>
        <div className="text-xs text-gray-600">Grab attention instantly</div>
      </div>
      <button 
        onClick={onComplete}
        className="w-full bg-purple-500 text-white py-2 rounded hover:bg-purple-600"
      >
        Set Timing
      </button>
    </div>
  );
}