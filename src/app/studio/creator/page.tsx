'use client';

/**
 * Creator Studio - 17-Step Viral Creation System
 * 
 * The comprehensive workflow for creating viral content with
 * real-time DPS prediction as users progress through each step.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Users, Crosshair, Search, Lightbulb, Layout, 
  Layers, Goal, Music, Hash, Monitor, Captions, 
  CheckSquare, Video, Calendar, BarChart3, RefreshCw,
  ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

// Workflow step configuration
const WORKFLOW_STEPS = [
  { id: 'niche', label: 'Niche', icon: Target, description: 'Choose your content niche' },
  { id: 'audience', label: 'Audience', icon: Users, description: 'Define your target audience' },
  { id: 'goal', label: 'Goal', icon: Crosshair, description: 'Set your content goal' },
  { id: 'keywords', label: 'Keywords', icon: Search, description: 'Research trending keywords' },
  { id: 'topic', label: 'Topic', icon: Lightbulb, description: 'Generate viral topics' },
  { id: 'format', label: 'Format', icon: Layout, description: 'Choose video format' },
  { id: 'pillar', label: 'Pillar', icon: Layers, description: 'Select content pillar' },
  { id: 'goals-detail', label: 'Content Goals', icon: Goal, description: 'Define specific goals' },
  { id: 'beats', label: 'Beats', icon: Music, description: 'Build content beats' },
  { id: 'seo', label: 'SEO', icon: Hash, description: 'Optimize for discovery' },
  { id: 'display', label: 'On-Screen', icon: Monitor, description: 'Plan visual elements' },
  { id: 'captions', label: 'Captions', icon: Captions, description: 'Generate captions' },
  { id: 'checklist', label: 'Optimize', icon: CheckSquare, description: 'Final optimization' },
  { id: 'create', label: 'Create', icon: Video, description: 'Generate or film video' },
  { id: 'publish', label: 'Publish', icon: Calendar, description: 'Schedule publication' },
  { id: 'track', label: 'Track', icon: BarChart3, description: 'Monitor performance' },
  { id: 'iterate', label: 'Iterate', icon: RefreshCw, description: 'Improve and repeat' },
];

interface WorkflowData {
  niche?: string;
  audience?: {
    age: string;
    interests: string[];
    painPoints: string[];
  };
  goal?: string;
  keywords?: string[];
  topic?: string;
  format?: string;
  pillar?: string;
  contentGoals?: string[];
  beats?: { time: string; content: string }[];
  seo?: { hashtags: string[]; description: string };
  display?: { elements: string[] };
  captions?: string;
  script?: string;
  videoUrl?: string;
  scheduledTime?: string;
}

function DPSScore({ value }: { value: number }) {
  const getGradient = () => {
    if (value >= 85) return 'from-emerald-400 to-green-500';
    if (value >= 70) return 'from-yellow-400 to-orange-500';
    if (value >= 50) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-red-600';
  };

  return (
    <span className={`bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent`}>
      {value.toFixed(1)}
    </span>
  );
}

function WorkflowStepper({ 
  steps, 
  currentStep, 
  completedSteps 
}: { 
  steps: typeof WORKFLOW_STEPS; 
  currentStep: number;
  completedSteps: Record<string, boolean>;
}) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
      <div 
        className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep || completedSteps[step.id];
          
          return (
            <div
              key={step.id}
              className={`
                flex flex-col items-center cursor-pointer transition-all duration-300
                ${index <= currentStep ? 'opacity-100' : 'opacity-40'}
              `}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-125 shadow-lg shadow-purple-500/50' 
                    : isCompleted 
                      ? 'bg-green-500' 
                      : 'bg-white/10'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive || isCompleted ? 'text-white' : 'text-white/50'}`} />
              </div>
              <span className={`
                mt-2 text-xs font-medium
                ${isActive ? 'text-white' : 'text-white/50'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Step Components
function NicheSelector({ data, onUpdate, onNext }: any) {
  const niches = [
    { id: 'personal-finance', label: 'Personal Finance', icon: '💰' },
    { id: 'fitness', label: 'Fitness & Health', icon: '💪' },
    { id: 'tech', label: 'Technology', icon: '📱' },
    { id: 'travel', label: 'Travel', icon: '✈️' },
    { id: 'food', label: 'Food & Cooking', icon: '🍳' },
    { id: 'fashion', label: 'Fashion & Beauty', icon: '👗' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Select Your Niche</h2>
        <p className="text-white/60">Choose the category that best fits your content</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {niches.map(niche => (
          <motion.button
            key={niche.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onUpdate({ niche: niche.id });
              onNext();
            }}
            className={`
              p-6 rounded-xl border transition-all duration-300
              ${data.niche === niche.id 
                ? 'border-purple-500 bg-purple-500/20' 
                : 'border-white/10 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <span className="text-4xl mb-3 block">{niche.icon}</span>
            <span className="text-white font-medium">{niche.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function CreationHub({ data, onUpdate, onNext, liveDPS }: any) {
  const [creationPath, setCreationPath] = useState<'ai' | 'film' | null>(null);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Create Your Video</h2>
        <p className="text-white/60">Current DPS Score: <DPSScore value={liveDPS} /></p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* AI Generation Path */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`
            bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-8 cursor-pointer border-2 transition-all
            ${creationPath === 'ai' ? 'border-purple-500' : 'border-transparent'}
          `}
          onClick={() => setCreationPath('ai')}
        >
          <div className="flex items-center gap-4 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">AI Video Generation</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Generate a complete video using AI in 2 minutes
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ No filming required</li>
            <li>✓ Professional quality</li>
            <li>✓ Multiple style options</li>
            <li>✓ ~6.6 Kling credits</li>
          </ul>
        </motion.div>

        {/* Self-Film Path */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`
            bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-xl p-8 cursor-pointer border-2 transition-all
            ${creationPath === 'film' ? 'border-blue-500' : 'border-transparent'}
          `}
          onClick={() => setCreationPath('film')}
        >
          <div className="flex items-center gap-4 mb-4">
            <Video className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Film Yourself</h3>
          </div>
          <p className="text-gray-300 mb-4">
            Use our teleprompter to record your video
          </p>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>✓ Personal authenticity</li>
            <li>✓ Built-in teleprompter</li>
            <li>✓ Auto-captions</li>
            <li>✓ Free to create</li>
          </ul>
        </motion.div>
      </div>

      {creationPath && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={() => {
              onUpdate({ creationType: creationPath });
              onNext();
            }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Continue with {creationPath === 'ai' ? 'AI Generation' : 'Self-Filming'}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Generic step placeholder
function GenericStep({ step, data, onUpdate, onNext, onBack }: any) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{step.label}</h2>
        <p className="text-white/60">{step.description}</p>
      </div>
      
      <div className="bg-white/5 rounded-xl p-8 text-center">
        <step.icon className="w-16 h-16 mx-auto mb-4 text-purple-400" />
        <p className="text-white/60">This step will be fully implemented with rich UI components.</p>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <button
          onClick={() => {
            onUpdate({ [step.id]: true });
            onNext();
          }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2"
        >
          Continue <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function CreatorStudio() {
  const [currentStep, setCurrentStep] = useState(0);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({});
  const [liveDPS, setLiveDPS] = useState(50);
  const [predictions, setPredictions] = useState<any>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isCalculatingDPS, setIsCalculatingDPS] = useState(false);
  const [kaiComponents, setKaiComponents] = useState<string[]>([]);

  // REAL DPS calculation using Kai Orchestrator
  useEffect(() => {
    const calculateRealDPS = async () => {
      // Only call Kai if we have meaningful data
      const hasEnoughData = workflowData.niche || workflowData.topic || workflowData.script;
      
      if (!hasEnoughData) {
        // Show baseline DPS for early steps
        const completedCount = Object.keys(workflowData).length;
        const baseDPS = 40 + (completedCount * 2);
        setLiveDPS(baseDPS);
        return;
      }

      setIsCalculatingDPS(true);
      
      try {
        // Build transcript from available data
        const transcript = [
          workflowData.topic || '',
          workflowData.script || '',
          workflowData.beats?.map(b => b.content).join(' ') || '',
          workflowData.seo?.description || ''
        ].filter(Boolean).join('\n');

        // Call Kai Orchestrator for REAL prediction
        const formData = new FormData();
        formData.append('transcript', transcript);
        formData.append('niche', workflowData.niche || 'general');
        formData.append('goal', workflowData.goal || 'build-following');
        formData.append('accountSize', 'medium');
        formData.append('workflow', 'full-studio');

        const response = await fetch('/api/kai/predict', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.prediction) {
            const realDPS = result.prediction.dps;
            setLiveDPS(realDPS);
            setPredictions(result.prediction);
            setKaiComponents(result.prediction.componentsUsed || []);
            
            console.log(`✅ Kai prediction: ${realDPS} DPS (${result.prediction.componentsUsed?.length || 0} components)`);

            // Dispatch event for navigation bar
            window.dispatchEvent(new CustomEvent('dps-update', { 
              detail: { 
                dps: realDPS,
                confidence: result.prediction.confidence,
                viralPotential: result.prediction.viralPotential
              } 
            }));
          }
        } else {
          console.warn('Kai prediction failed, using fallback');
          // Fallback to heuristic
          const completedCount = Object.keys(workflowData).length;
          const baseDPS = 40 + (completedCount * 3);
          setLiveDPS(Math.min(85, baseDPS));
        }
      } catch (error) {
        console.error('Error calling Kai:', error);
        // Fallback calculation
        const completedCount = Object.keys(workflowData).length;
        setLiveDPS(40 + (completedCount * 3));
      } finally {
        setIsCalculatingDPS(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(calculateRealDPS, 500);
    return () => clearTimeout(timeoutId);
  }, [workflowData]);

  const handleUpdateStep = (stepData: Partial<WorkflowData>) => {
    setWorkflowData(prev => ({ ...prev, ...stepData }));
    setCompletedSteps(prev => ({
      ...prev,
      [WORKFLOW_STEPS[currentStep].id]: true
    }));
  };

  const currentStepConfig = WORKFLOW_STEPS[currentStep];

  // Render step component
  const renderStep = () => {
    const props = {
      step: currentStepConfig,
      data: workflowData,
      onUpdate: handleUpdateStep,
      onNext: () => setCurrentStep(prev => Math.min(prev + 1, WORKFLOW_STEPS.length - 1)),
      onBack: () => setCurrentStep(prev => Math.max(prev - 1, 0)),
      predictions,
      liveDPS
    };

    switch (currentStepConfig.id) {
      case 'niche':
        return <NicheSelector {...props} />;
      case 'create':
        return <CreationHub {...props} />;
      default:
        return <GenericStep {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Persistent DPS Bar - NOW CONNECTED TO KAI */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-purple-900/90 to-pink-900/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white/80">
                {isCalculatingDPS ? '⏳ Analyzing with Kai...' : 'Live DPS Score:'}
              </span>
              <div className="text-3xl font-bold">
                {isCalculatingDPS ? (
                  <span className="text-white/50 animate-pulse">...</span>
                ) : (
                  <DPSScore value={liveDPS} />
                )}
              </div>
              {kaiComponents.length > 0 && (
                <span className="text-xs text-white/50">
                  ({kaiComponents.length} Kai components)
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {isCalculatingDPS && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm animate-pulse">
                  🧠 Kai Analyzing...
                </span>
              )}
              {!isCalculatingDPS && liveDPS < 70 && (
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                  Needs Optimization
                </span>
              )}
              {!isCalculatingDPS && liveDPS >= 70 && liveDPS < 85 && (
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                  ✨ Viral Potential
                </span>
              )}
              {!isCalculatingDPS && liveDPS >= 85 && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  🔥 Mega-Viral Ready
                </span>
              )}
            </div>
          </div>
          {/* DPS Progress Bar */}
          <div className="mt-2 h-2 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isCalculatingDPS ? 'bg-blue-500 animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${liveDPS}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Show Kai components when available */}
          {kaiComponents.length > 0 && !isCalculatingDPS && (
            <div className="mt-2 flex flex-wrap gap-1">
              {kaiComponents.slice(0, 6).map((comp, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/40">
                  {comp}
                </span>
              ))}
              {kaiComponents.length > 6 && (
                <span className="px-2 py-0.5 text-xs text-white/40">
                  +{kaiComponents.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Content */}
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        {/* Step Progress */}
        <div className="mb-12 overflow-x-auto">
          <WorkflowStepper
            steps={WORKFLOW_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Current Step Component */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}









