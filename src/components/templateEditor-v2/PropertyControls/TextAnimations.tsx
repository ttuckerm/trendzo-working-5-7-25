"use client";

import React, { useState, useEffect } from 'react';
import { Play, Wand2, HelpCircle, Sparkles, Music, Lock } from 'lucide-react';
import { TextAnimationEngine } from '../TextAnimationEngine';
import { Element } from '../types';

// Define the extended animation properties type
type ExtendedAnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'custom' | 'bounce' | 'flip' | 'zoom' | 'glitch' | 'wave' | 'shake' | 'pulse';

interface ExtendedAnimationProperties {
  type?: ExtendedAnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'onBeat';
  keyframes?: Record<string, any>[];
  beatSync?: boolean;
  beatPoints?: number[];
  trendCategory?: string;
}

interface TextAnimationsProps {
  text: string;
  animation: ExtendedAnimationProperties | null;
  onChange: (animation: ExtendedAnimationProperties) => void;
  userTier: 'free' | 'premium' | 'platinum';
  context?: {
    templateType?: string;
    trendCategory?: string;
    audioTrack?: string;
  };
}

// Text animation presets
const TEXT_ANIMATION_PRESETS = [
  { name: 'None', value: null },
  { name: 'Fade In', value: 'fade' },
  { name: 'Slide Up', value: 'slide' },
  { name: 'Scale', value: 'scale' },
  { name: 'Bounce', value: 'bounce', premium: true },
  { name: 'Type Writer', value: 'custom', premium: true },
  { name: 'Glitch', value: 'glitch', platinum: true },
  { name: 'Wave', value: 'wave', platinum: true },
];

/**
 * TextAnimations component for controlling text-specific animations
 * Includes AI-driven kinetic text features for platinum users
 */
export const TextAnimations: React.FC<TextAnimationsProps> = ({
  text,
  animation,
  onChange,
  userTier,
  context = {}
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ExtendedAnimationProperties[]>([]);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState<string | null>(null);
  
  // Helper to check if a feature is available for user tier
  const isFeatureAvailable = (feature: string) => {
    const tierLevels = { free: 0, premium: 1, platinum: 2 };
    
    if (feature === 'basicTextAnimations') return true;
    if (feature === 'advancedTextAnimations') return tierLevels[userTier] >= tierLevels['premium'];
    if (feature === 'beatSyncedAnimations') return tierLevels[userTier] >= tierLevels['premium'];
    if (feature === 'aiKineticText') return tierLevels[userTier] >= tierLevels['platinum'];
    
    return false;
  };
  
  // Get trending animation presets if available
  useEffect(() => {
    if (context.templateType === 'trending' && context.trendCategory) {
      // Create a mock element to generate a trend animation
      const mockElement: Element = {
        id: 'preview',
        type: 'text',
        content: text,
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 1,
      };
      
      // Apply trend-based animation
      const trendAnimation = TextAnimationEngine.applyTrendStyle(mockElement, context);
      
      // Update animation if not already set
      if (!animation && trendAnimation) {
        onChange(trendAnimation);
      }
    }
  }, [context.templateType, context.trendCategory, text]);
  
  // Generate AI suggestions
  const generateAiSuggestions = async () => {
    if (!isFeatureAvailable('aiKineticText')) return;
    
    setLoading(true);
    
    try {
      // Create a mock element
      const mockElement: Element = {
        id: 'preview',
        type: 'text',
        content: text,
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 1,
      };
      
      // Get AI suggestions
      const suggestions = await TextAnimationEngine.getAISuggestions(mockElement, context);
      
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle animation preset selection
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetValue = e.target.value;
    
    if (!presetValue || presetValue === 'none') {
      onChange({ type: undefined });
      return;
    }
    
    // Find the selected preset
    const preset = TEXT_ANIMATION_PRESETS.find(p => p.value === presetValue);
    
    // Check if this is a premium preset
    if ((preset?.premium && !isFeatureAvailable('advancedTextAnimations')) || 
        (preset?.platinum && !isFeatureAvailable('aiKineticText'))) {
      return;
    }
    
    // Create a mock element to generate animation properties
    const mockElement: Element = {
      id: 'preview',
      type: 'text',
      content: text,
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    };
    
    let newAnimation: ExtendedAnimationProperties;
    
    if (presetValue === 'custom') {
      // Type writer effect
      newAnimation = TextAnimationEngine.generateCharacterAnimation(mockElement);
    } else {
      // Default animation with selected type
      newAnimation = TextAnimationEngine.generateDefaultAnimation(mockElement);
      newAnimation.type = presetValue as ExtendedAnimationType;
    }
    
    onChange(newAnimation);
  };
  
  // Toggle audio sync
  const handleAudioSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!context.audioTrack || !isFeatureAvailable('beatSyncedAnimations')) return;
    
    const isSync = e.target.checked;
    
    if (isSync) {
      // Create a mock element
      const mockElement: Element = {
        id: 'preview',
        type: 'text',
        content: text,
        x: 0,
        y: 0,
        width: 200,
        height: 50,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 1,
      };
      
      // Async function to sync with audio
      const syncWithAudio = async () => {
        try {
          const syncedAnimation = await TextAnimationEngine.syncWithAudio(
            mockElement, 
            context.audioTrack || ''
          );
          
          onChange(syncedAnimation);
        } catch (error) {
          console.error('Error syncing with audio:', error);
        }
      };
      
      syncWithAudio();
    } else if (animation) {
      // Remove beat sync
      onChange({
        ...animation,
        beatSync: false,
        trigger: 'onLoad',
        beatPoints: undefined,
      });
    }
  };
  
  // Apply AI suggestion
  const applySuggestion = (suggestion: ExtendedAnimationProperties) => {
    onChange(suggestion);
  };
  
  // Toggle help tooltip
  const toggleHelp = (section: string) => {
    setShowHelp(showHelp === section ? null : section);
  };
  
  // Get help text for a specific section
  const getHelpText = (section: string) => {
    const helpTexts: Record<string, string> = {
      presets: "Choose a predefined animation style for your text.",
      aiKinetic: "AI analyzes your text and generates custom animations based on content and context.",
      audioSync: "Synchronizes your text animation with the beat of your audio track.",
      preview: "See how your animation will look in the final template.",
    };
    
    return helpTexts[section] || "";
  };
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium mb-2">Text Animations</h3>
      
      {/* Animation Preset Selector */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="animation-preset" className="block text-xs font-medium">
            Animation Preset
          </label>
          <button 
            type="button"
            onClick={() => toggleHelp('presets')}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        
        {showHelp === 'presets' && (
          <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
            {getHelpText('presets')}
          </div>
        )}
        
        <select
          id="animation-preset"
          className="w-full text-sm p-1.5 border rounded"
          value={animation?.type || ''}
          onChange={handlePresetChange}
          aria-label="Animation Preset"
        >
          <option value="">None</option>
          
          <optgroup label="Basic Animations">
            {TEXT_ANIMATION_PRESETS.filter(preset => !preset.premium && !preset.platinum).map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name}
              </option>
            ))}
          </optgroup>
          
          <optgroup label="Premium Animations" disabled={!isFeatureAvailable('advancedTextAnimations')}>
            {TEXT_ANIMATION_PRESETS.filter(preset => preset.premium).map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name} {!isFeatureAvailable('advancedTextAnimations') ? '(Premium)' : ''}
              </option>
            ))}
          </optgroup>
          
          <optgroup label="Platinum Animations" disabled={!isFeatureAvailable('aiKineticText')}>
            {TEXT_ANIMATION_PRESETS.filter(preset => preset.platinum).map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name} {!isFeatureAvailable('aiKineticText') ? '(Platinum)' : ''}
              </option>
            ))}
          </optgroup>
          
          {context.templateType === 'trending' && (
            <optgroup label="Trending Presets">
              <option value="trend">Trending: {context.trendCategory || 'Popular'}</option>
            </optgroup>
          )}
        </select>
      </div>
      
      {/* Audio Sync (Premium) */}
      {context.audioTrack && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="audio-sync" className="block text-xs font-medium">
              Sync with Audio
            </label>
            <button 
              type="button"
              onClick={() => toggleHelp('audioSync')}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          
          {showHelp === 'audioSync' && (
            <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
              {getHelpText('audioSync')}
            </div>
          )}
          
          <div className="flex items-center">
            <label className="flex items-center text-xs">
              <input
                id="audio-sync"
                type="checkbox"
                checked={!!animation?.beatSync}
                onChange={handleAudioSyncToggle}
                disabled={!isFeatureAvailable('beatSyncedAnimations')}
                className="mr-1"
                aria-label="Sync with audio"
              />
              <Music size={14} className="mr-1" />
              Sync with beat
            </label>
            
            {!isFeatureAvailable('beatSyncedAnimations') && (
              <span className="ml-2 text-xs text-gray-500">
                (Premium)
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* AI Kinetic Text (Platinum) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-medium">AI Kinetic Text</h4>
          <button 
            type="button"
            onClick={() => toggleHelp('aiKinetic')}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        
        {showHelp === 'aiKinetic' && (
          <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
            {getHelpText('aiKinetic')}
          </div>
        )}
        
        {!isFeatureAvailable('aiKineticText') ? (
          <div className="p-3 border rounded bg-gray-50">
            <div className="flex items-center mb-2">
              <Lock size={16} className="text-gray-500 mr-2" />
              <h4 className="text-sm font-medium">AI Kinetic Text</h4>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              Upgrade to Platinum to access AI-generated animations.
            </p>
            <button
              type="button"
              className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              onClick={() => window.open('/pricing', '_blank')}
            >
              Upgrade to Platinum
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              className="w-full flex items-center justify-center text-sm bg-purple-500 text-white px-3 py-2 rounded hover:bg-purple-600 mb-2"
              onClick={generateAiSuggestions}
              disabled={loading}
            >
              <Wand2 size={16} className="mr-1" /> 
              {loading ? 'Generating...' : 'Generate Suggestions'}
            </button>
            
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 mt-3">
                <h5 className="text-xs font-medium">AI Suggestions</h5>
                <div className="grid grid-cols-2 gap-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="p-2 border rounded text-xs hover:bg-blue-50"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <Sparkles size={12} className="inline mr-1 text-yellow-500" />
                      {suggestion.type?.charAt(0).toUpperCase() + suggestion.type?.slice(1) || 'Custom'} 
                      {suggestion.trendCategory ? ` (${suggestion.trendCategory})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Preview Button */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-medium">Preview</h4>
          <button 
            type="button"
            onClick={() => toggleHelp('preview')}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        
        {showHelp === 'preview' && (
          <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
            {getHelpText('preview')}
          </div>
        )}
        
        <button
          type="button"
          className="w-full flex items-center justify-center text-sm bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Play size={16} className="mr-1" /> 
          Preview Animation
        </button>
        
        {showPreview && (
          <div 
            className={`mt-3 p-4 border rounded text-center animating`}
            data-testid="animation-preview"
          >
            <div 
              className={`inline-block ${animation?.type || ''}`}
              style={{
                animation: animation?.type ? 
                  `${animation.type} ${animation.duration || 1000}ms ${animation.easing || 'ease'} ${animation.delay || 0}ms ${animation.repeat === 'infinite' ? 'infinite' : (animation.repeat || 1)}` : 
                  'none'
              }}
            >
              {text || 'Sample Text'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 