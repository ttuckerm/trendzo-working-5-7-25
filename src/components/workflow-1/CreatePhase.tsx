'use client';

/**
 * Workflow 1 - Create Phase Components (Steps 3.1 - 3.4)
 * 
 * Step 3.1: Beat Editor (Hook, Value Prop, Proof, Body, CTA)
 * Step 3.2: SEO Pack Generator
 * Step 3.3: On-Screen Display
 * Step 3.4: Caption Generator
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, Hash, Type, FileText,
  ChevronLeft, ChevronRight, Check, Loader2, Sparkles, 
  Clock, Zap, Target, MessageSquare, Plus, X, Copy,
  TrendingUp, Volume2, Eye
} from 'lucide-react';
import {
  BEAT_STRUCTURE,
  type BeatKey,
  type NicheKey,
  type ContentFormatKey,
  type ContentPillarKey,
  getNicheLabel,
} from '@/lib/workflow-shared';

// Create phase data structure
export interface CreateData {
  // Step 3.1 - Beat Editor
  beats: BeatContent[];
  estimatedDuration?: number;
  // Step 3.2 - SEO Pack
  hashtags: string[];
  keywords: string[];
  trendingSound?: string;
  // Step 3.3 - On-Screen Display
  onScreenTexts: OnScreenText[];
  // Step 3.4 - Caption
  caption?: string;
  captionStyle?: 'minimal' | 'storytelling' | 'listicle' | 'question';
}

export interface BeatContent {
  beatKey: BeatKey;
  content: string;
  duration?: number;
  notes?: string;
}

export interface OnScreenText {
  id: string;
  text: string;
  timestamp: string;
  style: 'headline' | 'subtitle' | 'callout' | 'cta';
  position: 'top' | 'center' | 'bottom';
}

// Shared props interface
interface StepProps {
  data: CreateData;
  planData: {
    keywords?: string[];
    primaryKeyword?: string;
    contentTopic?: string;
    topicAngle?: string;
    contentFormat?: ContentFormatKey;
    contentPillar?: ContentPillarKey;
  };
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
  };
  onUpdate: (updates: Partial<CreateData>) => void;
  onNext: () => void;
  onBack?: () => void;
}

// Hook templates based on angle
const HOOK_TEMPLATES: Record<string, string[]> = {
  'myth-busting': [
    "You've been lied to about [topic]...",
    "Everything you know about [topic] is wrong",
    "Stop doing [common mistake] right now",
  ],
  'how-to': [
    "Here's how to [achieve result] in [timeframe]",
    "The secret to [result] that nobody talks about",
    "3 steps to [achieve goal] (that actually work)",
  ],
  'listicle': [
    "[Number] things about [topic] that will blow your mind",
    "Here are [number] [topic] tips you NEED to know",
    "The top [number] mistakes people make with [topic]",
  ],
  'story': [
    "I tried [thing] for 30 days and here's what happened...",
    "This one thing changed my entire [topic] journey",
    "The moment I realized [insight] about [topic]...",
  ],
  'comparison': [
    "[Thing A] vs [Thing B] - which one wins?",
    "I compared [options] so you don't have to",
    "The truth about [A] vs [B] that nobody tells you",
  ],
  'hot-take': [
    "Unpopular opinion: [controversial take]",
    "I'm going to say what nobody else will about [topic]",
    "This might get me canceled but [take]...",
  ],
};

// Hashtag suggestions by niche
const HASHTAG_SUGGESTIONS: Record<string, string[]> = {
  'personal-finance': ['#money', '#finance', '#investing', '#wealth', '#financialfreedom', '#moneytips', '#budgeting', '#passiveincome'],
  'fitness': ['#fitness', '#workout', '#gym', '#health', '#fitfam', '#exercise', '#motivation', '#gains'],
  'business': ['#business', '#entrepreneur', '#startup', '#success', '#hustle', '#money', '#marketing', '#growth'],
  'food': ['#food', '#foodie', '#cooking', '#recipe', '#homemade', '#yummy', '#delicious', '#foodlover'],
  'beauty': ['#beauty', '#skincare', '#makeup', '#glowup', '#beautytips', '#skincareroutine', '#beautyhacks', '#selfcare'],
  'self-improvement': ['#selfimprovement', '#motivation', '#mindset', '#growth', '#productivity', '#success', '#habits', '#goals'],
  'tech': ['#tech', '#technology', '#gadgets', '#review', '#apps', '#tutorial', '#tips', '#howto'],
  'default': ['#fyp', '#viral', '#trending', '#foryou', '#tiktok', '#explore', '#tips', '#hack'],
};

// ============================================
// Step 3.1: Beat Editor
// ============================================
export function BeatEditorStep({ data, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [activeBeat, setActiveBeat] = useState<BeatKey>('hook');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Initialize beats if empty
  useEffect(() => {
    if (!data.beats || data.beats.length === 0) {
      const initialBeats: BeatContent[] = BEAT_STRUCTURE.map(beat => ({
        beatKey: beat.key,
        content: '',
        duration: parseInt(beat.timeRange.split('-')[1]) - parseInt(beat.timeRange.split('-')[0]),
      }));
      onUpdate({ beats: initialBeats });
    }
  }, [data.beats, onUpdate]);

  const handleBeatUpdate = (beatKey: BeatKey, content: string) => {
    const newBeats = (data.beats || []).map(beat => 
      beat.beatKey === beatKey ? { ...beat, content } : beat
    );
    onUpdate({ beats: newBeats });
  };

  const handleGenerateHook = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const angle = planData.topicAngle || 'how-to';
    const templates = HOOK_TEMPLATES[angle] || HOOK_TEMPLATES['how-to'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const topic = planData.contentTopic || planData.primaryKeyword || 'your topic';
    
    const generatedHook = template
      .replace('[topic]', topic.toLowerCase())
      .replace('[thing]', topic.toLowerCase())
      .replace('[result]', 'results')
      .replace('[timeframe]', '30 days')
      .replace('[number]', '5')
      .replace('[Number]', '5');
    
    handleBeatUpdate('hook', generatedHook);
    setIsGenerating(false);
  };

  const currentBeat = BEAT_STRUCTURE.find(b => b.key === activeBeat);
  const beatContent = data.beats?.find(b => b.beatKey === activeBeat);
  const completedBeats = data.beats?.filter(b => b.content.trim().length > 0).length || 0;

  const beatIcons: Record<string, React.ReactNode> = {
    'hook': <Zap className="w-5 h-5" />,
    'value-prop': <Target className="w-5 h-5" />,
    'proof': <Check className="w-5 h-5" />,
    'body': <FileText className="w-5 h-5" />,
    'cta': <MessageSquare className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-4">
          <Edit3 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Build Your Beat</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Structure your content for maximum engagement
        </p>
      </div>

      {/* Progress */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/60">Content Structure</span>
          <span className="text-sm text-green-400">{completedBeats}/5 sections complete</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completedBeats / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Beat Navigation */}
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {BEAT_STRUCTURE.map((beat, index) => {
            const hasBeatContent = data.beats?.find(b => b.beatKey === beat.key)?.content?.trim();
            return (
              <motion.button
                key={beat.key}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveBeat(beat.key)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-xl border whitespace-nowrap transition-all
                  ${activeBeat === beat.key
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : hasBeatContent
                      ? 'bg-white/10 border-green-500/30 text-green-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'}
                `}
              >
                {beatIcons[beat.key]}
                <span className="font-medium">{beat.label}</span>
                <span className="text-xs opacity-60">{beat.timeRange}</span>
                {hasBeatContent && <Check className="w-4 h-4 text-green-400" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Active Beat Editor */}
      <div className="max-w-3xl mx-auto">
        <motion.div
          key={activeBeat}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {beatIcons[activeBeat]}
                {currentBeat?.label}
              </h3>
              <p className="text-white/50 text-sm mt-1">{currentBeat?.description}</p>
            </div>
            <div className="flex items-center gap-2 text-white/40">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{currentBeat?.timeRange}</span>
            </div>
          </div>

          <div className="relative">
            <textarea
              value={beatContent?.content || ''}
              onChange={(e) => handleBeatUpdate(activeBeat, e.target.value)}
              placeholder={`Write your ${currentBeat?.label.toLowerCase()} here...`}
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none h-40"
            />
            
            {activeBeat === 'hook' && (
              <button
                onClick={handleGenerateHook}
                disabled={isGenerating}
                className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Hook
              </button>
            )}
          </div>

          {/* Beat Tips */}
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              {activeBeat === 'hook' && '💡 Tip: Start with a pattern interrupt - something unexpected that stops the scroll'}
              {activeBeat === 'value-prop' && '💡 Tip: Tell them exactly what they\'ll get by watching till the end'}
              {activeBeat === 'proof' && '💡 Tip: Use numbers, testimonials, or quick demonstrations'}
              {activeBeat === 'body' && '💡 Tip: Break complex info into 3-5 digestible points'}
              {activeBeat === 'cta' && '💡 Tip: Be specific - "Follow for daily tips" beats "Follow me"'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between max-w-3xl mx-auto">
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
          disabled={completedBeats < 2}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${completedBeats >= 2
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
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
// Step 3.2: SEO Pack Generator
// ============================================
export function SEOPackStep({ data, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [customHashtag, setCustomHashtag] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const niche = researchData.niche || 'all';
  const nicheForHashtags = niche as string;
  const suggestions = HASHTAG_SUGGESTIONS[nicheForHashtags] || HASHTAG_SUGGESTIONS['default'];

  const handleAddHashtag = (tag: string) => {
    const cleaned = tag.startsWith('#') ? tag : `#${tag}`;
    if (!data.hashtags?.includes(cleaned.toLowerCase())) {
      onUpdate({ hashtags: [...(data.hashtags || []), cleaned.toLowerCase()] });
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    onUpdate({ hashtags: (data.hashtags || []).filter(t => t !== tag) });
  };

  const handleGenerateHashtags = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    
    // Generate relevant hashtags
    const generated = [
      '#fyp',
      '#viral',
      `#${(planData.primaryKeyword || 'tips').replace(/\s+/g, '')}`,
      ...suggestions.slice(0, 3),
    ];
    
    const unique = [...new Set([...(data.hashtags || []), ...generated])];
    onUpdate({ hashtags: unique });
    setIsGenerating(false);
  };

  const trendingSounds = [
    { name: 'Original Sound', type: 'original' },
    { name: 'Trending Audio #1', type: 'trending' },
    { name: 'Motivational Beat', type: 'music' },
    { name: 'Storytelling Piano', type: 'music' },
    { name: 'Viral Sound Effect', type: 'effect' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-4">
          <Hash className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">SEO Pack</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Optimize your content for discoverability
        </p>
      </div>

      {/* Hashtags Section */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Hashtags</h3>
          <button
            onClick={handleGenerateHashtags}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Auto-Generate
          </button>
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customHashtag}
            onChange={(e) => setCustomHashtag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customHashtag) {
                handleAddHashtag(customHashtag);
                setCustomHashtag('');
              }
            }}
            placeholder="Add custom hashtag..."
            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-500/50"
          />
          <button
            onClick={() => {
              if (customHashtag) {
                handleAddHashtag(customHashtag);
                setCustomHashtag('');
              }
            }}
            className="px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Hashtags */}
        {(data.hashtags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.hashtags?.map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="group flex items-center gap-1 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveHashtag(tag)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Suggestions */}
        <div>
          <p className="text-sm text-white/50 mb-2">Suggested for {getNicheLabel(niche)}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.filter(s => !data.hashtags?.includes(s)).map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddHashtag(tag)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/70 hover:border-green-500/50 hover:text-green-400 transition-all text-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Sounds */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          Sound Selection
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trendingSounds.map((sound) => (
            <motion.button
              key={sound.name}
              whileHover={{ scale: 1.02 }}
              onClick={() => onUpdate({ trendingSound: sound.name })}
              className={`
                p-4 rounded-xl border text-left transition-all
                ${data.trendingSound === sound.name
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${sound.type === 'trending' ? 'bg-red-500/20' : sound.type === 'music' ? 'bg-purple-500/20' : 'bg-blue-500/20'}
                `}>
                  {sound.type === 'trending' && <TrendingUp className="w-5 h-5 text-red-400" />}
                  {sound.type === 'music' && <Volume2 className="w-5 h-5 text-purple-400" />}
                  {sound.type === 'original' && <Sparkles className="w-5 h-5 text-blue-400" />}
                  {sound.type === 'effect' && <Zap className="w-5 h-5 text-yellow-400" />}
                </div>
                <div>
                  <p className="font-medium text-white">{sound.name}</p>
                  <p className="text-xs text-white/50 capitalize">{sound.type}</p>
                </div>
                {data.trendingSound === sound.name && <Check className="w-5 h-5 text-green-400 ml-auto" />}
              </div>
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
          disabled={(data.hashtags?.length || 0) < 3}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${(data.hashtags?.length || 0) >= 3
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
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
// Step 3.3: On-Screen Display
// ============================================
export function OnScreenDisplayStep({ data, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [newText, setNewText] = useState('');
  const [newStyle, setNewStyle] = useState<OnScreenText['style']>('headline');
  const [newPosition, setNewPosition] = useState<OnScreenText['position']>('center');
  const [newTimestamp, setNewTimestamp] = useState('0:00');

  const handleAddText = () => {
    if (!newText.trim()) return;
    
    const newOnScreenText: OnScreenText = {
      id: crypto.randomUUID(),
      text: newText,
      timestamp: newTimestamp,
      style: newStyle,
      position: newPosition,
    };
    
    onUpdate({ onScreenTexts: [...(data.onScreenTexts || []), newOnScreenText] });
    setNewText('');
  };

  const handleRemoveText = (id: string) => {
    onUpdate({ onScreenTexts: (data.onScreenTexts || []).filter(t => t.id !== id) });
  };

  const styleOptions: { key: OnScreenText['style']; label: string; icon: React.ReactNode }[] = [
    { key: 'headline', label: 'Headline', icon: <Type className="w-4 h-4" /> },
    { key: 'subtitle', label: 'Subtitle', icon: <FileText className="w-4 h-4" /> },
    { key: 'callout', label: 'Callout', icon: <Zap className="w-4 h-4" /> },
    { key: 'cta', label: 'CTA', icon: <Target className="w-4 h-4" /> },
  ];

  const positionOptions: { key: OnScreenText['position']; label: string }[] = [
    { key: 'top', label: 'Top' },
    { key: 'center', label: 'Center' },
    { key: 'bottom', label: 'Bottom' },
  ];

  // Generate suggested on-screen texts from beats
  const suggestFromBeats = () => {
    const hookBeat = data.beats?.find(b => b.beatKey === 'hook');
    const ctaBeat = data.beats?.find(b => b.beatKey === 'cta');
    
    const suggestions: OnScreenText[] = [];
    
    if (hookBeat?.content) {
      suggestions.push({
        id: crypto.randomUUID(),
        text: hookBeat.content.slice(0, 50) + (hookBeat.content.length > 50 ? '...' : ''),
        timestamp: '0:01',
        style: 'headline',
        position: 'center',
      });
    }
    
    if (ctaBeat?.content) {
      suggestions.push({
        id: crypto.randomUUID(),
        text: ctaBeat.content.slice(0, 30),
        timestamp: '0:45',
        style: 'cta',
        position: 'bottom',
      });
    }
    
    if (suggestions.length > 0) {
      onUpdate({ onScreenTexts: [...(data.onScreenTexts || []), ...suggestions] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-4">
          <Type className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">On-Screen Text</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Add text overlays to reinforce your message
        </p>
      </div>

      {/* Add New Text */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter on-screen text..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-500/50"
            />
            <input
              type="text"
              value={newTimestamp}
              onChange={(e) => setNewTimestamp(e.target.value)}
              placeholder="0:00"
              className="w-20 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-center focus:outline-none focus:border-green-500/50"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            {/* Style Selection */}
            <div className="flex gap-2">
              {styleOptions.map((style) => (
                <button
                  key={style.key}
                  onClick={() => setNewStyle(style.key)}
                  className={`
                    flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-all
                    ${newStyle === style.key
                      ? 'bg-green-500/20 border-green-500/50 text-green-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'}
                  `}
                >
                  {style.icon}
                  {style.label}
                </button>
              ))}
            </div>
            
            {/* Position Selection */}
            <div className="flex gap-2">
              {positionOptions.map((pos) => (
                <button
                  key={pos.key}
                  onClick={() => setNewPosition(pos.key)}
                  className={`
                    px-3 py-2 rounded-lg border text-sm transition-all
                    ${newPosition === pos.key
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:border-white/30'}
                  `}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleAddText}
              disabled={!newText.trim()}
              className="flex-1 px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
            >
              Add Text
            </button>
            <button
              onClick={suggestFromBeats}
              className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Preview ({data.onScreenTexts?.length || 0} texts)</h3>
        
        {/* Phone mockup */}
        <div className="relative mx-auto w-64 h-[450px] bg-gradient-to-b from-gray-900 to-black rounded-3xl border-4 border-gray-800 overflow-hidden">
          <div className="absolute inset-4 flex flex-col justify-between">
            {/* Top texts */}
            <div className="space-y-2">
              {data.onScreenTexts?.filter(t => t.position === 'top').map((text) => (
                <motion.div
                  key={text.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    px-3 py-2 rounded-lg text-center
                    ${text.style === 'headline' ? 'bg-white text-black font-bold' : ''}
                    ${text.style === 'subtitle' ? 'bg-black/50 text-white text-sm' : ''}
                    ${text.style === 'callout' ? 'bg-yellow-500 text-black font-medium' : ''}
                    ${text.style === 'cta' ? 'bg-red-500 text-white font-bold' : ''}
                  `}
                >
                  {text.text}
                </motion.div>
              ))}
            </div>
            
            {/* Center texts */}
            <div className="space-y-2">
              {data.onScreenTexts?.filter(t => t.position === 'center').map((text) => (
                <motion.div
                  key={text.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`
                    px-3 py-2 rounded-lg text-center
                    ${text.style === 'headline' ? 'bg-white text-black font-bold text-lg' : ''}
                    ${text.style === 'subtitle' ? 'bg-black/50 text-white' : ''}
                    ${text.style === 'callout' ? 'bg-yellow-500 text-black font-medium' : ''}
                    ${text.style === 'cta' ? 'bg-red-500 text-white font-bold' : ''}
                  `}
                >
                  {text.text}
                </motion.div>
              ))}
            </div>
            
            {/* Bottom texts */}
            <div className="space-y-2">
              {data.onScreenTexts?.filter(t => t.position === 'bottom').map((text) => (
                <motion.div
                  key={text.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    px-3 py-2 rounded-lg text-center
                    ${text.style === 'headline' ? 'bg-white text-black font-bold' : ''}
                    ${text.style === 'subtitle' ? 'bg-black/50 text-white text-sm' : ''}
                    ${text.style === 'callout' ? 'bg-yellow-500 text-black font-medium' : ''}
                    ${text.style === 'cta' ? 'bg-red-500 text-white font-bold' : ''}
                  `}
                >
                  {text.text}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Text List */}
        {(data.onScreenTexts?.length || 0) > 0 && (
          <div className="mt-4 space-y-2">
            {data.onScreenTexts?.map((text) => (
              <div
                key={text.id}
                className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-mono">{text.timestamp}</span>
                  <span className="text-white">{text.text}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/50">{text.style}</span>
                </div>
                <button
                  onClick={() => handleRemoveText(text.id)}
                  className="text-white/40 hover:text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
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
          className="flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
        >
          Continue
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Step 3.4: Caption Generator
// ============================================
export function CaptionGeneratorStep({ data, planData, researchData, onUpdate, onNext, onBack }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const captionStyles: { key: CreateData['captionStyle']; label: string; description: string; example: string }[] = [
    { 
      key: 'minimal', 
      label: 'Minimal', 
      description: 'Short and punchy',
      example: 'This changed everything 🔥'
    },
    { 
      key: 'storytelling', 
      label: 'Storytelling', 
      description: 'Narrative hook',
      example: 'I never thought I\'d share this but... here\'s what happened when I tried [topic] for 30 days'
    },
    { 
      key: 'listicle', 
      label: 'Listicle', 
      description: 'Numbered format',
      example: '5 things I wish I knew about [topic] earlier:\n1. [point]\n2. [point]\n...'
    },
    { 
      key: 'question', 
      label: 'Question', 
      description: 'Engagement driver',
      example: 'Which one are you? Comment below 👇'
    },
  ];

  const handleGenerateCaption = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const topic = planData.contentTopic || planData.primaryKeyword || 'this';
    const style = data.captionStyle || 'minimal';
    const hookBeat = data.beats?.find(b => b.beatKey === 'hook')?.content || '';
    
    let caption = '';
    
    switch (style) {
      case 'minimal':
        caption = `${hookBeat.slice(0, 50)}... 🔥\n\n${data.hashtags?.slice(0, 5).join(' ') || '#fyp #viral'}`;
        break;
      case 'storytelling':
        caption = `I never thought I'd share this, but here's the truth about ${topic}...\n\nWatch till the end - #3 surprised me the most.\n\n${data.hashtags?.slice(0, 5).join(' ') || '#fyp #viral'}`;
        break;
      case 'listicle':
        caption = `Save this for later 📌\n\nHere are the top insights about ${topic} that will change how you think:\n\n${data.hashtags?.slice(0, 5).join(' ') || '#fyp #viral'}`;
        break;
      case 'question':
        caption = `Which one resonated with you the most? Comment below 👇\n\n${data.hashtags?.slice(0, 5).join(' ') || '#fyp #viral'}`;
        break;
    }
    
    onUpdate({ caption });
    setIsGenerating(false);
  };

  const handleCopyCaption = () => {
    if (data.caption) {
      navigator.clipboard.writeText(data.caption);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 mb-4">
          <FileText className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Video Caption</h2>
        <p className="text-white/60 max-w-md mx-auto">
          Craft the perfect caption for your content
        </p>
      </div>

      {/* Caption Style */}
      <div className="max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-white/60 mb-3">Choose Style</h3>
        <div className="grid grid-cols-2 gap-3">
          {captionStyles.map((style) => (
            <motion.button
              key={style.key}
              whileHover={{ scale: 1.02 }}
              onClick={() => onUpdate({ captionStyle: style.key })}
              className={`
                p-4 rounded-xl border text-left transition-all
                ${data.captionStyle === style.key
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/30'}
              `}
            >
              <p className="font-medium text-white">{style.label}</p>
              <p className="text-sm text-white/50 mt-1">{style.description}</p>
              <p className="text-xs text-white/30 mt-2 italic">&quot;{style.example.slice(0, 40)}...&quot;</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Caption Editor */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/60">Your Caption</h3>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateCaption}
              disabled={isGenerating || !data.captionStyle}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate
            </button>
            {data.caption && (
              <button
                onClick={handleCopyCaption}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/70 hover:bg-white/20 transition-all text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            )}
          </div>
        </div>
        
        <textarea
          value={data.caption || ''}
          onChange={(e) => onUpdate({ caption: e.target.value })}
          placeholder="Write your caption here or generate one based on your selected style..."
          className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-green-500/50 resize-none h-48"
        />
        
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>{data.caption?.length || 0} characters</span>
          <span>{data.hashtags?.length || 0} hashtags included</span>
        </div>
      </div>

      {/* Preview Card */}
      {data.caption && (
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
              <div>
                <p className="text-white font-medium">your_username</p>
                <p className="text-white/50 text-xs">Just now</p>
              </div>
            </div>
            <p className="text-white whitespace-pre-wrap">{data.caption}</p>
          </div>
        </div>
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
          disabled={!data.caption}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl transition-all ml-auto
            ${data.caption
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
              : 'bg-white/10 text-white/40 cursor-not-allowed'}
          `}
        >
          Complete Create Phase
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Phase Component
// ============================================
interface CreatePhaseProps {
  step: number;
  data: CreateData;
  planData: {
    keywords?: string[];
    primaryKeyword?: string;
    contentTopic?: string;
    topicAngle?: string;
    contentFormat?: ContentFormatKey;
    contentPillar?: ContentPillarKey;
  };
  researchData: {
    niche?: NicheKey;
    contentPurpose?: string;
  };
  onUpdate: (updates: Partial<CreateData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CreatePhase({ step, data, planData, researchData, onUpdate, onNext, onBack }: CreatePhaseProps) {
  const stepComponents = [
    <BeatEditorStep key="beats" data={data} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <SEOPackStep key="seo" data={data} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <OnScreenDisplayStep key="onscreen" data={data} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
    <CaptionGeneratorStep key="caption" data={data} planData={planData} researchData={researchData} onUpdate={onUpdate} onNext={onNext} onBack={onBack} />,
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
