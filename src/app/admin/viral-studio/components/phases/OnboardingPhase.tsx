'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, X } from 'lucide-react';

interface OnboardingPhaseProps {
  onComplete: (niche: string, goal: string) => void;
  selectedNiche: string;
  selectedGoal: string;
}

interface DropdownOption {
  key: string;
  label: string;
  description?: string;
}

const NICHE_OPTIONS: DropdownOption[] = [
  { key: 'personal-finance-investing', label: 'Personal Finance/Investing', description: 'Money management, investing tips' },
  { key: 'fitness-weight-loss', label: 'Fitness/Weight Loss', description: 'Workouts, weight management, health' },
  { key: 'business-entrepreneurship', label: 'Business/Entrepreneurship', description: 'Business tips, startup advice' },
  { key: 'food-nutrition-comparisons', label: 'Food/Nutrition Comparisons', description: 'Food reviews, nutrition facts' },
  { key: 'beauty-skincare', label: 'Beauty/Skincare', description: 'Makeup, skincare routines, beauty tips' },
  { key: 'real-estate-property', label: 'Real Estate/Property', description: 'Property investment, real estate tips' },
  { key: 'self-improvement-productivity', label: 'Self-Improvement/Productivity', description: 'Personal development, productivity hacks' },
  { key: 'dating-relationships', label: 'Dating/Relationships', description: 'Dating advice, relationship tips' },
  { key: 'education-study-tips', label: 'Education/Study Tips', description: 'Learning strategies, academic advice' },
  { key: 'career-job-advice', label: 'Career/Job Advice', description: 'Career development, job search tips' },
  { key: 'parenting-family', label: 'Parenting/Family', description: 'Parenting tips, family activities' },
  { key: 'tech-reviews-tutorials', label: 'Tech Reviews/Tutorials', description: 'Technology reviews, tech tutorials' },
  { key: 'fashion-style', label: 'Fashion/Style', description: 'Fashion trends, styling tips' },
  { key: 'health-medical-education', label: 'Health/Medical Education', description: 'Health information, medical education' },
  { key: 'cooking-recipes', label: 'Cooking/Recipes', description: 'Cooking tips, recipe tutorials' },
  { key: 'psychology-mental-health', label: 'Psychology/Mental Health', description: 'Mental wellness, psychology insights' },
  { key: 'travel-lifestyle', label: 'Travel/Lifestyle', description: 'Travel tips, lifestyle content' },
  { key: 'diy-home-improvement', label: 'DIY/Home Improvement', description: 'DIY projects, home renovation' },
  { key: 'language-learning', label: 'Language Learning', description: 'Language tutorials, learning tips' },
  { key: 'side-hustles-making-money-online', label: 'Side Hustles/Making Money Online', description: 'Online income, side business ideas' }
];

const GOAL_OPTIONS: Record<string, DropdownOption[]> = {
  'fitness-weight-loss': [
    { key: 'build-following', label: 'Build a fitness community', description: 'Grow engaged followers' },
    { key: 'product-promotion', label: 'Promote fitness products', description: 'Drive sales and conversions' },
    { key: 'brand-awareness', label: 'Increase brand awareness', description: 'Build recognition' },
    { key: 'lead-generation', label: 'Generate leads', description: 'Collect potential customers' },
    { key: 'establish-expertise', label: 'Establish expertise', description: 'Become a fitness authority' }
  ],
  'beauty-skincare': [
    { key: 'build-following', label: 'Build beauty community', description: 'Grow engaged followers' },
    { key: 'product-promotion', label: 'Promote beauty products', description: 'Drive sales and conversions' },
    { key: 'brand-partnerships', label: 'Attract brand partnerships', description: 'Collaborate with brands' },
    { key: 'establish-expertise', label: 'Establish expertise', description: 'Become a beauty authority' },
    { key: 'drive-traffic', label: 'Drive website traffic', description: 'Get more visitors' }
  ],
  'personal-finance-investing': [
    { key: 'build-following', label: 'Build engaged following', description: 'Grow your audience' },
    { key: 'increase-engagement', label: 'Increase engagement', description: 'Boost likes, comments, shares' },
    { key: 'drive-traffic', label: 'Drive website traffic', description: 'Get more visitors' },
    { key: 'generate-leads', label: 'Generate leads', description: 'Collect potential customers' },
    { key: 'establish-expertise', label: 'Establish expertise', description: 'Become a finance authority' }
  ],
  'default': [
    { key: 'build-following', label: 'Build engaged following', description: 'Grow your audience' },
    { key: 'increase-engagement', label: 'Increase engagement', description: 'Boost likes, comments, shares' },
    { key: 'drive-traffic', label: 'Drive website traffic', description: 'Get more visitors' },
    { key: 'generate-leads', label: 'Generate leads', description: 'Collect potential customers' },
    { key: 'brand-awareness', label: 'Increase brand awareness', description: 'Build recognition' }
  ]
};

export default function OnboardingPhase({ onComplete, selectedNiche: initialSelectedNiche, selectedGoal: initialSelectedGoal }: OnboardingPhaseProps) {
  const [selectedNiche, setSelectedNiche] = useState<string>(initialSelectedNiche || '');
  const [selectedGoal, setSelectedGoal] = useState<string>(initialSelectedGoal || '');
  const [showNicheDropdown, setShowNicheDropdown] = useState(false);
  const [showGoalDropdown, setShowGoalDropdown] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleNicheSelect = (niche: DropdownOption) => {
    setSelectedNiche(niche.key);
    setShowNicheDropdown(false);
    
    // Delay showing goal selection for smooth UX
    setTimeout(() => {
      setStep(2);
    }, 500);
  };

  const handleGoalSelect = (goal: DropdownOption) => {
    setSelectedGoal(goal.key);
    setShowGoalDropdown(false);
    
    // Auto-advance after selection
    setTimeout(() => {
      const selectedNicheData = NICHE_OPTIONS.find(n => n.key === selectedNiche);
      onComplete(selectedNicheData?.label || selectedNiche, goal.label);
    }, 800);
  };

  const getCurrentGoalOptions = () => {
    return GOAL_OPTIONS[selectedNiche] || GOAL_OPTIONS.default;
  };

  const selectedNicheData = NICHE_OPTIONS.find(n => n.key === selectedNiche);

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center px-5 py-10"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="text-center max-w-3xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-5 bg-gradient-to-br from-[#7b61ff] to-[#ff61a6] bg-clip-text text-transparent">
            Let's customize your viral strategy
          </h2>
          <p className="text-xl text-white/70 mb-12">
            Tell us about your niche and goals to get personalized content templates
          </p>
        </motion.div>

        {/* Step 1: Niche Selection */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">
                What's your content niche?
              </h3>
              
              <div className="relative">
                <motion.button
                  onClick={() => setShowNicheDropdown(!showNicheDropdown)}
                  className={`
                    w-full max-w-md mx-auto relative flex items-center justify-between
                    px-6 py-4 rounded-2xl border-2 transition-all duration-300
                    ${selectedNiche 
                      ? 'bg-[#7b61ff]/10 border-[#7b61ff]/50 text-white' 
                      : 'bg-white/[0.03] border-white/20 text-white/70 hover:border-white/40'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">
                    {selectedNicheData?.label || 'Select your niche...'}
                  </span>
                  <motion.div
                    animate={{ rotate: showNicheDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showNicheDropdown && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setShowNicheDropdown(false)}
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl"
                        style={{ maxHeight: '80vh' }}
                      >
                      {/* Scroll indicator header */}
                      <div className="sticky top-0 bg-[#1a1a1a]/95 px-6 py-3 border-b border-white/10">
                        <div className="text-xs text-white/60 flex items-center justify-between">
                          <span>Choose your niche ({NICHE_OPTIONS.length} options)</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#7b61ff]">⬇ Scroll to see all</span>
                            <button
                              onClick={() => setShowNicheDropdown(false)}
                              className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4 text-white/60 hover:text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scrollable content */}
                      <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(80vh - 140px)' }}>
                        <div className="py-2">
                          {NICHE_OPTIONS.map((niche, index) => (
                            <motion.button
                              key={niche.key}
                              onClick={() => handleNicheSelect(niche)}
                              className="w-full px-6 py-3 text-left hover:bg-[#7b61ff]/10 transition-colors duration-200 border-b border-white/5 last:border-b-0"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.01 }}
                              whileHover={{ x: 5, backgroundColor: 'rgba(123, 97, 255, 0.1)' }}
                            >
                              <div className="text-white font-medium text-sm">{niche.label}</div>
                              {niche.description && (
                                <div className="text-white/60 text-xs mt-1">{niche.description}</div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Scroll indicator footer */}
                      <div className="sticky bottom-0 bg-gradient-to-t from-[#1a1a1a] to-transparent px-6 py-2">
                        <div className="text-xs text-white/40 text-center">
                          Scroll for more options
                        </div>
                      </div>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="mb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#7b61ff]/20 border border-[#7b61ff]/30 rounded-full">
                    <Check className="w-4 h-4 text-[#7b61ff]" />
                    <span className="text-[#7b61ff] font-medium">{selectedNicheData?.label}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  What's your primary goal?
                </h3>
              </div>
              
              <div className="relative">
                <motion.button
                  onClick={() => setShowGoalDropdown(!showGoalDropdown)}
                  className={`
                    w-full max-w-md mx-auto relative flex items-center justify-between
                    px-6 py-4 rounded-2xl border-2 transition-all duration-300
                    ${selectedGoal 
                      ? 'bg-[#00ff00]/10 border-[#00ff00]/50 text-white' 
                      : 'bg-white/[0.03] border-white/20 text-white/70 hover:border-white/40'
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">
                    {getCurrentGoalOptions().find(g => g.key === selectedGoal)?.label || 'Select your goal...'}
                  </span>
                  <motion.div
                    animate={{ rotate: showGoalDropdown ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {showGoalDropdown && (
                    <>
                      {/* Backdrop */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setShowGoalDropdown(false)}
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-[35%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl z-50 shadow-2xl"
                        style={{ maxHeight: '70vh' }}
                      >
                      {/* Header */}
                      <div className="sticky top-0 bg-[#1a1a1a]/95 px-6 py-3 border-b border-white/10">
                        <div className="text-xs text-white/60 flex items-center justify-between">
                          <span>Choose your goal ({getCurrentGoalOptions().length} options)</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#00ff00]">Select one</span>
                            <button
                              onClick={() => setShowGoalDropdown(false)}
                              className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4 text-white/60 hover:text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Scrollable content */}
                      <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                        <div className="py-2">
                          {getCurrentGoalOptions().map((goal, index) => (
                            <motion.button
                              key={goal.key}
                              onClick={() => handleGoalSelect(goal)}
                              className="w-full px-6 py-3 text-left hover:bg-[#00ff00]/10 transition-colors duration-200 border-b border-white/5 last:border-b-0"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              whileHover={{ x: 5, backgroundColor: 'rgba(0, 255, 0, 0.1)' }}
                            >
                              <div className="text-white font-medium text-sm">{goal.label}</div>
                              {goal.description && (
                                <div className="text-white/60 text-xs mt-1">{goal.description}</div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicator */}
        <motion.div 
          className="flex justify-center gap-2 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#7b61ff]' : 'bg-white/20'}`} />
          <div className={`w-3 h-3 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#7b61ff]' : 'bg-white/20'}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}