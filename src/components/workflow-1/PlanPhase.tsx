'use client';

/**
 * Workflow 1 - Plan Phase Components (Steps 2.1 - 2.5)
 * 
 * Step 2.1: Keyword Selection
 * Step 2.2: Content Topic
 * Step 2.3: Format Analysis
 * Step 2.4: Content Pillar
 * Step 2.5: Content Goals
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, FileText, Layout, Layers, Target,
  ChevronLeft, ChevronRight, Check, Loader2, Sparkles, Hash,
  TrendingUp, Lightbulb, X, Plus
} from 'lucide-react';
import {
  CONTENT_PILLARS,
  CONTENT_FORMATS,
  GOAL_TYPES,
  type ContentPillarKey,
  type ContentFormatKey,
  type GoalTypeKey,
  type NicheKey,
  getNicheLabel,
} from '@/lib/workflow-shared';

// Plan phase data structure
export interface PlanData {
  // Step 2.1
  keywords: string[];
  primaryKeyword?: string;
  // Step 2.2
  contentTopic?: string;
  topicAngle?: string;
  // Step 2.3
  contentFormat?: ContentFormatKey;
  formatReason?: string;
  // Step 2.4
  contentPillar?: ContentPillarKey;
  secondaryPillars?: ContentPillarKey[];
  // Step 2.5
  contentGoals: ContentGoal[];
}

export interface ContentGoal {
  type: GoalTypeKey;
  target: string;
  priority: 'primary' | 'secondary';
}

// Shared props interface for all step components
interface StepProps {
  data: PlanData;
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
    goalType?: string;
    exemplarAccounts?: Array<{ username: string }>;
  };
  onUpdate: (updates: Partial<PlanData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// Keyword suggestions based on niche
const KEYWORD_SUGGESTIONS: Record<string, string[]> = {
  'personal-finance': ['investing tips', 'save money', 'passive income', 'budget hacks', 'credit score', 'debt free', 'wealth building', 'money mindset'],
  'fitness': ['weight loss', 'home workout', 'gym motivation', 'meal prep', 'protein', 'gains', 'transformation', 'healthy lifestyle'],
  'business': ['entrepreneur', 'startup tips', 'marketing', 'side hustle', 'passive income', 'business growth', 'leadership', 'success mindset'],
  'food': ['recipe', 'easy cooking', 'meal ideas', 'food review', 'healthy eating', 'budget meals', 'quick dinner', 'cooking tips'],
  'beauty': ['skincare routine', 'makeup tutorial', 'glow up', 'beauty hacks', 'product review', 'drugstore finds', 'self care', 'natural beauty'],
  'real-estate': ['home buying', 'investment property', 'real estate tips', 'first time buyer', 'market update', 'house tour', 'renovation', 'property investing'],
  'self-improvement': ['productivity', 'morning routine', 'goal setting', 'motivation', 'mindset shift', 'habits', 'success tips', 'personal growth'],
  'dating': ['relationship advice', 'dating tips', 'red flags', 'healthy relationships', 'communication', 'love life', 'single life', 'dating stories'],
  'education': ['study tips', 'learning hacks', 'exam prep', 'note taking', 'student life', 'online learning', 'college advice', 'study motivation'],
  'career': ['job search', 'interview tips', 'resume', 'career advice', 'work life', 'promotion', 'salary negotiation', 'professional growth'],
  'parenting': ['mom life', 'parenting tips', 'baby hacks', 'family time', 'toddler life', 'mom hacks', 'parenting advice', 'family routine'],
  'tech': ['tech review', 'gadgets', 'app recommendation', 'tech tips', 'iPhone hacks', 'productivity apps', 'tech news', 'tutorial'],
  'fashion': ['outfit ideas', 'style tips', 'fashion haul', 'capsule wardrobe', 'trendy outfits', 'thrift finds', 'styling hacks', 'seasonal fashion'],
  'health': ['health tips', 'wellness', 'mental health', 'nutrition', 'sleep tips', 'stress relief', 'holistic health', 'self care'],
  'cooking': ['easy recipe', 'cooking tutorial', 'meal prep', 'kitchen hacks', 'beginner cooking', 'quick meals', 'healthy recipes', 'comfort food'],
  'psychology': ['mental health', 'anxiety tips', 'therapy talk', 'psychology facts', 'self awareness', 'emotional intelligence', 'mindfulness', 'healing'],
  'travel': ['travel tips', 'budget travel', 'hidden gems', 'travel vlog', 'packing tips', 'travel hacks', 'destination guide', 'solo travel'],
  'diy': ['DIY project', 'home decor', 'craft ideas', 'renovation', 'upcycling', 'home improvement', 'budget decor', 'organization'],
  'language': ['language learning', 'vocabulary', 'pronunciation', 'speaking practice', 'language tips', 'fluency', 'study methods', 'polyglot'],
  'side-hustles': ['make money online', 'side hustle ideas', 'passive income', 'freelancing', 'online business', 'money tips', 'income streams', 'work from home'],
};

// ============================================
// Step 2.1: Keyword Selection
// ============================================
export function KeywordSelectionStep({ data, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [customKeyword, setCustomKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const niche = researchData.niche || 'all';
  const suggestions = KEYWORD_SUGGESTIONS[niche] || KEYWORD_SUGGESTIONS['business'];
  
  const handleAddKeyword = (keyword: string) => {
    if (!keyword.trim()) return;
    const newKeywords = [...(data.keywords || [])];
    if (!newKeywords.includes(keyword.toLowerCase().trim())) {
      newKeywords.push(keyword.toLowerCase().trim());
      onUpdate({ keywords: newKeywords });
    }
  };
  
  const handleRemoveKeyword = (keyword: string) => {
    const newKeywords = (data.keywords || []).filter(k => k !== keyword);
    onUpdate({ keywords: newKeywords });
  };
  
  const handleSetPrimary = (keyword: string) => {
    onUpdate({ primaryKeyword: keyword });
  };
  
  const handleGenerateMore = async () => {
    setIsGenerating(true);
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 1000));
    // Add some trending keywords
    const trending = ['viral hack', 'game changer', 'you need this', 'underrated'];
    const newKeyword = trending[Math.floor(Math.random() * trending.length)];
    handleAddKeyword(newKeyword);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <Hash className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Select Keywords</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Choose keywords that resonate with your {getNicheLabel(niche)} audience
        </p>
      </div>

      {/* Custom Keyword Input */}
      <div className="max-w-xl mx-auto">
        <div className="flex gap-2">
          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddKeyword(customKeyword);
                setCustomKeyword('');
              }
            }}
            placeholder="Add custom keyword..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={() => {
              handleAddKeyword(customKeyword);
              setCustomKeyword('');
            }}
            className="px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 hover:bg-blue-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleGenerateMore}
            disabled={isGenerating}
            className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Selected Keywords */}
      {(data.keywords?.length || 0) > 0 && (
        <div className="max-w-2xl mx-auto">
          <h3 className="text-sm font-medium text-white/60 mb-3">Selected Keywords ({data.keywords?.length || 0})</h3>
          <div className="flex flex-wrap gap-2">
            {data.keywords?.map((keyword) => (
              <motion.div
                key={keyword}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer
                  ${data.primaryKeyword === keyword 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' 
                    : 'bg-white/5 border-white/10 text-white hover:border-white/30'}
                `}
                onClick={() => handleSetPrimary(keyword)}
              >
                {data.primaryKeyword === keyword && <Check className="w-4 h-4" />}
                <span>#{keyword}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveKeyword(keyword);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
          {data.primaryKeyword && (
            <p className="text-sm text-blue-400 mt-2">
              ✓ Primary keyword: #{data.primaryKeyword}
            </p>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Suggested for {getNicheLabel(niche)}</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((keyword) => {
            const isSelected = data.keywords?.includes(keyword);
            return (
              <motion.button
                key={keyword}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !isSelected && handleAddKeyword(keyword)}
                disabled={isSelected}
                className={`
                  px-3 py-2 rounded-lg border transition-all
                  ${isSelected 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 cursor-default' 
                    : 'bg-white/5 border-white/10 text-white/80 hover:border-blue-500/50 hover:bg-blue-500/10'}
                `}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                #{keyword}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={(data.keywords?.length || 0) < 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${(data.keywords?.length || 0) >= 1
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 2.2: Content Topic
// ============================================
export function ContentTopicStep({ data, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const topicAngles = [
    { key: 'myth-busting', label: 'Myth Busting', description: 'Debunk common misconceptions' },
    { key: 'how-to', label: 'How-To Guide', description: 'Step-by-step instruction' },
    { key: 'listicle', label: 'Listicle', description: 'X things you need to know' },
    { key: 'story', label: 'Personal Story', description: 'Share your experience' },
    { key: 'comparison', label: 'Comparison', description: 'A vs B breakdown' },
    { key: 'hot-take', label: 'Hot Take', description: 'Controversial opinion' },
  ];
  
  const handleGenerateTopic = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const primaryKeyword = data.primaryKeyword || data.keywords?.[0] || 'your niche';
    const topics = [
      `Why most people fail at ${primaryKeyword}`,
      `The ${primaryKeyword} hack nobody talks about`,
      `I tried ${primaryKeyword} for 30 days - here's what happened`,
      `Stop doing this with ${primaryKeyword}`,
      `${primaryKeyword} mistakes costing you money`,
    ];
    onUpdate({ contentTopic: topics[Math.floor(Math.random() * topics.length)] });
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <FileText className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Define Your Topic</h2>
        <p className="text-white/60 max-w-md mx-auto">
          What specific topic will this content cover?
        </p>
      </div>

      {/* Topic Input */}
      <div className="max-w-xl mx-auto space-y-4">
        <div className="relative">
          <textarea
            value={data.contentTopic || ''}
            onChange={(e) => onUpdate({ contentTopic: e.target.value })}
            placeholder="E.g., 3 money habits that changed my life..."
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none h-32"
          />
          <button
            onClick={handleGenerateTopic}
            disabled={isGenerating}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Idea
          </button>
        </div>
        
        {data.primaryKeyword && (
          <p className="text-sm text-white/40">
            Using primary keyword: <span className="text-blue-400">#{data.primaryKeyword}</span>
          </p>
        )}
      </div>

      {/* Topic Angle */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Choose Your Angle</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {topicAngles.map((angle) => (
            <motion.button
              key={angle.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ topicAngle: angle.key })}
              className={`
                p-4 rounded-xl border text-left transition-all
                ${data.topicAngle === angle.key
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <p className="font-medium text-white">{angle.label}</p>
              <p className="text-sm text-white/50 mt-1">{angle.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.contentTopic}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${data.contentTopic
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 2.3: Format Analysis
// ============================================
export function FormatAnalysisStep({ data, researchData, onUpdate, onNext, onBack }: StepProps) {
  const formatIcons: Record<string, React.ReactNode> = {
    'talking-head': '🎤',
    'story': '📖',
    'tutorial': '📚',
    'reaction': '😮',
    'duet': '👥',
    'trend': '📈',
    'list': '📋',
    'pov': '👁️',
    'asmr': '🎧',
    'greenscreen': '🟢',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <Layout className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Choose Format</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Select the content format that best fits your topic
        </p>
      </div>

      {/* Format Grid */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CONTENT_FORMATS.map((format) => (
            <motion.button
              key={format.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ contentFormat: format.key as ContentFormatKey })}
              className={`
                p-4 rounded-xl border text-center transition-all
                ${data.contentFormat === format.key
                  ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <div className="text-3xl mb-2">{formatIcons[format.key] || '📹'}</div>
              <p className="font-medium text-white text-sm">{format.label}</p>
              <p className="text-xs text-white/40 mt-1">{format.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Format Reason */}
      {data.contentFormat && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto"
        >
          <label className="text-sm font-medium text-white/60 mb-2 block">
            Why this format? (optional)
          </label>
          <textarea
            value={data.formatReason || ''}
            onChange={(e) => onUpdate({ formatReason: e.target.value })}
            placeholder="E.g., My audience responds well to tutorial content..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 resize-none h-20"
          />
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.contentFormat}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${data.contentFormat
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 2.4: Content Pillar
// ============================================
export function ContentPillarStep({ data, researchData, onUpdate, onNext, onBack }: StepProps) {
  const handleToggleSecondary = (pillar: ContentPillarKey) => {
    if (pillar === data.contentPillar) return; // Can't be both primary and secondary
    
    const current = data.secondaryPillars || [];
    if (current.includes(pillar)) {
      onUpdate({ secondaryPillars: current.filter(p => p !== pillar) });
    } else if (current.length < 2) {
      onUpdate({ secondaryPillars: [...current, pillar] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <Layers className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Content Pillar</h2>
        <p className="text-white/60 max-w-md mx-auto">
          What&apos;s the primary purpose of this content?
        </p>
      </div>

      {/* Primary Pillar Selection */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Primary Pillar</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTENT_PILLARS.map((pillar) => (
            <motion.button
              key={pillar.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdate({ 
                contentPillar: pillar.key as ContentPillarKey,
                // Remove from secondary if it was there
                secondaryPillars: (data.secondaryPillars || []).filter(p => p !== pillar.key)
              })}
              className={`
                p-4 rounded-xl border text-left transition-all
                ${data.contentPillar === pillar.key
                  ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{pillar.icon}</span>
                <span className="font-medium text-white">{pillar.label}</span>
              </div>
              <p className="text-sm text-white/50">{pillar.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Secondary Pillars */}
      {data.contentPillar && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="text-sm font-medium text-white/60 mb-3">
            Secondary Pillars (optional, max 2)
          </h3>
          <div className="flex flex-wrap gap-2">
            {CONTENT_PILLARS.filter(p => p.key !== data.contentPillar).map((pillar) => {
              const isSelected = data.secondaryPillars?.includes(pillar.key as ContentPillarKey);
              return (
                <motion.button
                  key={pillar.key}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleToggleSecondary(pillar.key as ContentPillarKey)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                    ${isSelected
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-white/80 hover:border-white/30'}
                  `}
                >
                  <span>{pillar.icon}</span>
                  <span>{pillar.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!data.contentPillar}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${data.contentPillar
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 2.5: Content Goals
// ============================================
export function ContentGoalsStep({ data, researchData, onUpdate, onNext, onBack }: StepProps) {
  const handleAddGoal = (type: GoalTypeKey) => {
    const existingGoal = data.contentGoals?.find(g => g.type === type);
    if (existingGoal) return;
    
    const goalConfig = GOAL_TYPES.find(g => g.key === type);
    const newGoal: ContentGoal = {
      type,
      target: goalConfig?.targetRange?.split('-')[0] || '1000',
      priority: (data.contentGoals?.length || 0) === 0 ? 'primary' as const : 'secondary' as const,
    };
    
    onUpdate({ contentGoals: [...(data.contentGoals || []), newGoal] });
  };
  
  const handleRemoveGoal = (type: GoalTypeKey) => {
    const newGoals = (data.contentGoals || []).filter(g => g.type !== type);
    // If removed primary, make first remaining goal primary
    if (newGoals.length > 0 && !newGoals.some(g => g.priority === 'primary')) {
      newGoals[0].priority = 'primary';
    }
    onUpdate({ contentGoals: newGoals });
  };
  
  const handleSetPrimary = (type: GoalTypeKey) => {
    const newGoals: ContentGoal[] = (data.contentGoals || []).map(g => ({
      ...g,
      priority: (g.type === type ? 'primary' : 'secondary') as 'primary' | 'secondary',
    }));
    onUpdate({ contentGoals: newGoals });
  };
  
  const handleUpdateTarget = (type: GoalTypeKey, target: string) => {
    const newGoals = (data.contentGoals || []).map(g => 
      g.type === type ? { ...g, target } : g
    );
    onUpdate({ contentGoals: newGoals });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
          <Target className="w-8 h-8 text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Set Content Goals</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Define what success looks like for this content
        </p>
      </div>

      {/* Selected Goals */}
      {(data.contentGoals?.length || 0) > 0 && (
        <div className="max-w-2xl mx-auto space-y-3">
          <h3 className="text-sm font-medium text-white/60">Your Goals</h3>
          {data.contentGoals?.map((goal) => {
            const goalConfig = GOAL_TYPES.find(g => g.key === goal.type);
            return (
              <motion.div
                key={goal.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  p-4 rounded-xl border transition-all
                  ${goal.priority === 'primary' 
                    ? 'bg-blue-500/20 border-blue-500/50' 
                    : 'bg-white/5 border-white/10'}
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {goal.priority === 'primary' && (
                      <span className="px-2 py-0.5 bg-blue-500/30 rounded text-xs text-blue-300">PRIMARY</span>
                    )}
                    <span className="font-medium text-white">{goalConfig?.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.priority !== 'primary' && (
                      <button
                        onClick={() => handleSetPrimary(goal.type)}
                        className="text-xs text-white/50 hover:text-blue-400 transition-colors"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveGoal(goal.type)}
                      className="text-white/40 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-white/40 block mb-1">Target ({goalConfig?.metric})</label>
                    <input
                      type="text"
                      value={goal.target}
                      onChange={(e) => handleUpdateTarget(goal.type, e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div className="text-xs text-white/40">
                    Benchmark: {goalConfig?.targetRange}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Available Goals */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Add Goals</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GOAL_TYPES.filter(g => !data.contentGoals?.some(cg => cg.type === g.key)).map((goal) => (
            <motion.button
              key={goal.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAddGoal(goal.key as GoalTypeKey)}
              className="p-4 rounded-xl border bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-left transition-all"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{goal.label}</span>
                <Plus className="w-4 h-4 text-white/40" />
              </div>
              <p className="text-xs text-white/50">{goal.metric}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-2xl mx-auto">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={(data.contentGoals?.length || 0) < 1}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${(data.contentGoals?.length || 0) >= 1
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Complete Plan Phase
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Phase Component
// ============================================
interface PlanPhaseProps {
  step: number;
  data: PlanData;
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
    goalType?: string;
    exemplarAccounts?: Array<{ username: string }>;
  };
  onUpdate: (updates: Partial<PlanData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PlanPhase({ step, data, researchData, onUpdate, onNext, onBack }: PlanPhaseProps) {
  const stepComponents = [
    <KeywordSelectionStep key="keywords" data={data} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <ContentTopicStep key="topic" data={data} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <FormatAnalysisStep key="format" data={data} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <ContentPillarStep key="pillar" data={data} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <ContentGoalsStep key="goals" data={data} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {stepComponents[step - 1]}
      </motion.div>
    </AnimatePresence>
  );
}
