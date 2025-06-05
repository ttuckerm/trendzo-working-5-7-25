'use client';

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

// Breadcrumb steps
const BREADCRUMB_STEPS = ['Template', 'Hook', 'Structure', 'Format', 'Predict', 'Preview', 'Publish'];

export default function TemplateEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedStory, setSelectedStory] = useState(1);
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeBreadcrumb, setActiveBreadcrumb] = useState(1);
  
  // Track editor entry
  useEffect(() => {
    const ref = searchParams.get('ref') || 'direct';
    const email = searchParams.get('email');
    
    trackEvent('editor_entry', {
      source: ref,
      hasEmail: !!email
    });
  }, [searchParams]);

  // Particles background
  useEffect(() => {
    initParticles();
  }, []);

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
    // If user has email from exit intent, use magic link
    const email = searchParams.get('email');
    if (email) {
      trackEvent('magic_link_sent', { email });
      router.push(`/auth?email=${encodeURIComponent(email)}&action=save_template`);
    } else {
      // Show email capture modal
      trackEvent('save_template_prompt', {});
      router.push('/auth?action=save_template');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Particles Background */}
      <div id="particles" className="fixed inset-0 -z-10" />

      <div className="flex flex-col min-h-screen pb-24">
        {/* Story Circle Row */}
        <div className="h-24 flex gap-4 overflow-x-auto px-8 py-4 items-center scrollbar-hide">
          {STORY_OPTIONS.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedStory(story.id)}
              className="w-16 h-16 rounded-full relative cursor-pointer flex-shrink-0"
            >
              <div 
                className="w-full h-full rounded-full p-[3px] flex items-center justify-center"
                style={{ background: story.gradient }}
              >
                <div className="w-full h-full rounded-full bg-[#2a2a2a] flex items-center justify-center text-2xl">
                  {story.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Workbench Grid */}
        <div className="grid lg:grid-cols-12 gap-8 flex-1 px-8 min-h-0 items-start">
          {/* Template Preview Card */}
          <div className="lg:col-span-6 bg-black/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/10">
            <div className="h-12 flex items-center gap-4 mb-6">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-base">
                🎬
              </div>
              <div className="text-base font-semibold">viralcreator</div>
            </div>
            
            <div className="w-full max-w-[360px] h-[360px] bg-black rounded-xl mx-auto mb-6 relative flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center p-6"
                >
                  <div className="text-7xl mb-4">
                    {activeStep <= WORKFLOW_STEPS.length ? WORKFLOW_STEPS[activeStep - 1].icon : '🚀'}
                  </div>
                  <div className="text-2xl font-semibold text-pink-500 mb-2">
                    {activeStep <= WORKFLOW_STEPS.length ? 
                      WORKFLOW_STEPS[activeStep - 1].updateTitle : 
                      'Viral Video Ready'
                    }
                  </div>
                  <div className="text-white/60">
                    {activeStep <= WORKFLOW_STEPS.length ? 
                      WORKFLOW_STEPS[activeStep - 1].updateSubtitle : 
                      'Predicted 2.3M views • Ready to post'
                    }
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className="h-[52px] flex justify-end items-center gap-4 mb-4">
              <div className="text-center cursor-pointer hover:scale-110 transition-transform">
                <div className="text-xl">❤️</div>
                <div className="text-xs font-semibold">12.5K</div>
              </div>
              <div className="text-center cursor-pointer hover:scale-110 transition-transform">
                <div className="text-xl">💬</div>
                <div className="text-xs font-semibold">482</div>
              </div>
              <div className="text-center cursor-pointer hover:scale-110 transition-transform">
                <div className="text-xl">↗️</div>
                <div className="text-xs font-semibold">1.2K</div>
              </div>
            </div>
            
            <div className="text-sm text-white/60">12.5k likes • trending now</div>
          </div>

          {/* Optimization Stack */}
          <div className="lg:col-span-6 lg:-mt-24">
            <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/10 h-[672px] overflow-y-auto scrollbar-hide">
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
                  className={`mb-8 ${completedSteps.includes(step.id) ? 'opacity-70' : ''}`}
                >
                  <div 
                    className="flex items-center gap-4 mb-4 cursor-pointer hover:translate-x-1 transition-transform"
                    onClick={() => activeStep === step.id && setActiveStep(step.id)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      completedSteps.includes(step.id) ? 'bg-green-500 text-white' :
                      activeStep === step.id ? 'bg-purple-500 shadow-lg shadow-purple-500/40' :
                      'bg-white/10'
                    }`}>
                      {completedSteps.includes(step.id) ? '✓' : step.id}
                    </div>
                    <div className="text-lg font-semibold">{step.title}</div>
                  </div>

                  <AnimatePresence>
                    {activeStep === step.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-white/60 mb-4">{step.subtitle}</p>
                        
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
                    className="text-center p-8 bg-green-500/10 border border-green-500/40 rounded-3xl mt-8"
                  >
                    <div className="text-5xl mb-4">🎉</div>
                    <div className="text-xl font-semibold text-green-500 mb-2">
                      Your Viral Video is Ready!
                    </div>
                    <div className="text-sm text-white/60 mb-6">
                      847 creators posted similar videos today
                    </div>
                    <button
                      onClick={handlePublish}
                      className="bg-gradient-to-r from-purple-600 to-pink-500 px-8 py-3 rounded-full font-semibold hover:scale-105 transition-transform"
                    >
                      Publish Video
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Breadcrumb Bar */}
        <nav className="sticky bottom-2 z-50 h-[72px] mx-8 mt-4 flex items-center gap-2 bg-black/50 backdrop-blur-2xl rounded-3xl px-4 shadow-lg border border-white/10">
          {BREADCRUMB_STEPS.map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`px-6 py-2 rounded-full text-sm font-medium cursor-pointer transition-all ${
                  index === 0 ? 'bg-green-500 text-white' :
                  index === activeBreadcrumb ? 'bg-purple-500 text-white' :
                  'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setActiveBreadcrumb(index)}
              >
                {step}
              </div>
              {index < BREADCRUMB_STEPS.length - 1 && (
                <span className="text-white/10">•</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Floating AI Bot */}
        <button className="fixed w-16 h-16 right-8 bottom-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-2xl flex items-center justify-center text-3xl hover:scale-105 transition-transform group">
          🤖
          <div className="absolute bottom-[74px] right-0 bg-[#141414]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-5 w-80 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
            <div className="text-sm text-pink-500 font-semibold mb-2">AI Guide</div>
            <div className="text-white/90">
              {activeStep === 1 && "Click the timing blocks to structure your viral framework. Start with the 0-3s hook to grab attention instantly."}
              {activeStep === 2 && "Select visual elements that complement your message. Each scene should guide viewers through your story."}
              {activeStep === 3 && "Choose an audio track that matches your content energy. The right music can increase engagement by 300%."}
              {activeStep === 4 && "Fine-tune psychological triggers like tension points and engagement beats to maximize viral potential."}
              {showCompletion && "🎉 Congratulations! Your viral video is ready to change everything. Time to share it with the world!"}
            </div>
          </div>
        </button>
      </div>
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
      <div className="grid grid-cols-2 gap-4 mb-4">
        {timings.map((timing, index) => (
          <div
            key={index}
            onClick={() => setSelected(index)}
            className={`p-4 rounded-xl cursor-pointer transition-all ${
              selected === index ? 
              'bg-green-500/10 border-2 border-green-500' : 
              'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="text-pink-500 font-semibold text-xs mb-1">{timing.label}</div>
            <div className="text-xs text-white/60">{timing.description}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
        <button className="flex-1 py-2 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
          Customize Script
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-all"
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
      <div className="grid grid-cols-3 gap-2 mb-4">
        {visuals.map((visual, index) => (
          <div
            key={index}
            onClick={() => setSelected(index)}
            className={`aspect-video rounded-xl flex items-center justify-center text-xl cursor-pointer transition-all ${
              selected === index ? 
              'bg-green-500/10 border-2 border-green-500' : 
              'bg-white/5 border border-white/10 hover:bg-pink-500/10 hover:border-pink-500'
            }`}
          >
            {visual}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
        <button className="flex-1 py-2 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
          Preview Scene
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-all"
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
          className={`flex items-center gap-4 p-4 rounded-xl mb-2 cursor-pointer transition-all ${
            selected === index ? 
            'bg-green-500/10 border border-green-500' : 
            'bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-md flex items-center justify-center text-xs">
            🎵
          </div>
          <div className="flex-1 text-sm font-semibold">{track.name}</div>
          <div className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded">{track.trending}</div>
        </div>
      ))}
      <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
        <button className="flex-1 py-2 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
          Preview Audio
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-all"
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
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
              ⚡
            </div>
            <div className="flex-1 text-sm font-semibold">Tension Points</div>
            <div className="text-xs text-green-500 font-semibold">Optimized</div>
          </div>
          <div className="text-xs text-white/60">Strategic pauses at 7s, 15s, and 25s</div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              🧠
            </div>
            <div className="flex-1 text-sm font-semibold">Engagement Beats</div>
            <div className="text-xs text-green-500 font-semibold">Active</div>
          </div>
          <div className="text-xs text-white/60">Curiosity gaps trigger dopamine release</div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
        <button className="flex-1 py-2 px-4 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all">
          Analyze Flow
        </button>
        <button 
          onClick={onComplete}
          className="flex-1 py-2 px-4 rounded-xl bg-pink-500 text-white hover:bg-pink-600 transition-all"
        >
          Apply Triggers
        </button>
      </div>
    </>
  );
}

// Particles initialization
function initParticles() {
  if (typeof window === 'undefined') return;
  
  const container = document.getElementById('particles');
  if (!container) return;
  
  container.innerHTML = '';
  container.style.background = `
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%), 
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%), 
    radial-gradient(circle at 40% 80%, rgba(120, 200, 255, 0.1) 0%, transparent 50%)
  `;
  
  // Create stars
  for (let i = 0; i < 200; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.position = 'absolute';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = Math.random() * 3 + 1 + 'px';
    star.style.height = star.style.width;
    star.style.background = 'white';
    star.style.borderRadius = '50%';
    star.style.opacity = String(Math.random() * 0.8 + 0.2);
    star.style.animation = `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`;
    container.appendChild(star);
  }
}