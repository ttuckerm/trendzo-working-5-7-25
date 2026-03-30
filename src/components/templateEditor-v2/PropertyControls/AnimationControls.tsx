"use client";

import React, { useState } from 'react';
import { HelpCircle, Play, Music, Lock } from 'lucide-react';
import { AnimationProperties } from '../types';

interface AnimationControlsProps {
  animation: AnimationProperties | null;
  onChange: (animation: AnimationProperties) => void;
  userTier: 'free' | 'premium' | 'platinum';
  audioAvailable?: boolean;
  onPreviewAnimation?: () => void;
}

// Animation presets
const ANIMATION_PRESETS = {
  basic: [
    { name: 'None', value: null },
    { name: 'Fade', value: 'fade' },
    { name: 'Slide', value: 'slide' },
    { name: 'Scale', value: 'scale' },
  ],
  premium: [
    { name: 'Bounce', value: 'bounce' },
    { name: 'Flip', value: 'flip' },
    { name: 'Rotate', value: 'rotate' },
    { name: 'Zoom', value: 'zoom' },
  ],
  platinum: [
    { name: 'Glitch', value: 'glitch' },
    { name: 'Wave', value: 'wave' },
    { name: 'Shake', value: 'shake' },
    { name: 'Pulse', value: 'pulse' },
  ]
};

// Easing options
const EASING_OPTIONS = [
  { name: 'Linear', value: 'linear' },
  { name: 'Ease', value: 'ease' },
  { name: 'Ease In', value: 'ease-in' },
  { name: 'Ease Out', value: 'ease-out' },
  { name: 'Ease In Out', value: 'ease-in-out' },
  { name: 'Elastic', value: 'cubic-bezier(0.7, 0, 0.3, 1.5)' },
  { name: 'Bounce', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
];

/**
 * AnimationControls component for controlling element animations
 * Supports tier-based feature access and audio synchronization
 */
export const AnimationControls: React.FC<AnimationControlsProps> = ({
  animation,
  onChange,
  userTier,
  audioAvailable = false,
  onPreviewAnimation
}) => {
  const [showHelp, setShowHelp] = useState<string | null>(null);
  
  // Default animation values
  const defaultAnimation: AnimationProperties = {
    type: 'fade',
    duration: 1000,
    delay: 0,
    easing: 'ease',
    repeat: 0,
    direction: 'normal',
    trigger: 'onLoad',
  };
  
  // Use provided animation or default
  const currentAnimation = animation || defaultAnimation;
  
  // Helper to check if a feature is available for user tier
  const isFeatureAvailable = (feature: string) => {
    const tierLevels = { free: 0, premium: 1, platinum: 2 };
    
    if (feature === 'basicAnimations') return true;
    if (feature === 'advancedAnimations') return tierLevels[userTier] >= tierLevels['premium'];
    if (feature === 'beatSyncedAnimations') return tierLevels[userTier] >= tierLevels['premium'];
    if (feature === 'customKeyframes') return tierLevels[userTier] >= tierLevels['platinum'];
    
    return false;
  };
  
  // Handle animation type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as AnimationProperties['type'];
    onChange({ ...currentAnimation, type: type || 'fade' });
  };
  
  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value, 10);
    if (!isNaN(duration) && duration >= 0) {
      onChange({ ...currentAnimation, duration });
    }
  };
  
  // Handle delay change
  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const delay = parseInt(e.target.value, 10);
    if (!isNaN(delay) && delay >= 0) {
      onChange({ ...currentAnimation, delay });
    }
  };
  
  // Handle easing change
  const handleEasingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...currentAnimation, easing: e.target.value });
  };
  
  // Handle repeat change
  const handleRepeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const repeat = e.target.value === 'infinite' 
      ? 'infinite' 
      : parseInt(e.target.value, 10);
      
    onChange({ ...currentAnimation, repeat });
  };
  
  // Handle beat sync toggle
  const handleBeatSyncToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ 
      ...currentAnimation, 
      beatSync: e.target.checked,
      trigger: e.target.checked ? 'onBeat' : 'onLoad'
    });
  };
  
  // Toggle help tooltip
  const toggleHelp = (section: string) => {
    setShowHelp(showHelp === section ? null : section);
  };
  
  // Get help text for a specific section
  const getHelpText = (section: string) => {
    const helpTexts: Record<string, string> = {
      type: "Choose how your element animates. Different types create different movements.",
      duration: "How long the animation takes to complete one cycle (in milliseconds).",
      delay: "How long to wait before starting the animation (in milliseconds).",
      easing: "Controls the acceleration and deceleration of the animation.",
      repeat: "How many times the animation should repeat. 'Infinite' means it will loop forever.",
      beatSync: "Synchronizes animation with the beat of your audio track.",
    };
    
    return helpTexts[section] || "";
  };
  
  return (
    <div className="space-y-3">
      {/* Animation Type */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="animation-type" className="block text-xs font-medium">
            Animation Type
          </label>
          <button 
            type="button"
            onClick={() => toggleHelp('type')}
            className="text-gray-400 hover:text-gray-600"
          >
            <HelpCircle size={14} />
          </button>
        </div>
        
        {showHelp === 'type' && (
          <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
            {getHelpText('type')}
          </div>
        )}
        
        <select
          id="animation-type"
          className="w-full text-sm p-1.5 border rounded"
          value={currentAnimation.type || ''}
          onChange={handleTypeChange}
          aria-label="Animation Type"
        >
          <optgroup label="Basic Animations">
            {ANIMATION_PRESETS.basic.map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name}
              </option>
            ))}
          </optgroup>
          
          <optgroup label="Premium Animations" disabled={!isFeatureAvailable('advancedAnimations')}>
            {ANIMATION_PRESETS.premium.map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name} {!isFeatureAvailable('advancedAnimations') ? '(Premium)' : ''}
              </option>
            ))}
          </optgroup>
          
          <optgroup label="Platinum Animations" disabled={!isFeatureAvailable('customKeyframes')}>
            {ANIMATION_PRESETS.platinum.map((preset) => (
              <option key={preset.value} value={preset.value || ''}>
                {preset.name} {!isFeatureAvailable('customKeyframes') ? '(Platinum)' : ''}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      
      {/* Basic Animation Properties */}
      <div className="grid grid-cols-2 gap-3">
        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="animation-duration" className="block text-xs font-medium">
              Duration
            </label>
            <button 
              type="button"
              onClick={() => toggleHelp('duration')}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          
          {showHelp === 'duration' && (
            <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
              {getHelpText('duration')}
            </div>
          )}
          
          <div className="flex items-center">
            <input
              id="animation-duration"
              type="number"
              min="0"
              step="100"
              value={currentAnimation.duration || 1000}
              onChange={handleDurationChange}
              className="w-full text-sm p-1.5 border rounded"
              aria-label="Duration"
            />
            <span className="ml-1 text-xs text-gray-500">ms</span>
          </div>
        </div>
        
        {/* Delay */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="animation-delay" className="block text-xs font-medium">
              Delay
            </label>
            <button 
              type="button"
              onClick={() => toggleHelp('delay')}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          
          {showHelp === 'delay' && (
            <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
              {getHelpText('delay')}
            </div>
          )}
          
          <div className="flex items-center">
            <input
              id="animation-delay"
              type="number"
              min="0"
              step="100"
              value={currentAnimation.delay || 0}
              onChange={handleDelayChange}
              className="w-full text-sm p-1.5 border rounded"
              aria-label="Delay"
            />
            <span className="ml-1 text-xs text-gray-500">ms</span>
          </div>
        </div>
      </div>
      
      {/* Advanced Animation Properties (Premium) */}
      {!isFeatureAvailable('advancedAnimations') ? (
        <div className="mt-3 p-3 border rounded bg-gray-50">
          <div className="flex items-center mb-2">
            <Lock size={16} className="text-gray-500 mr-2" />
            <h4 className="text-sm font-medium">Advanced Animations</h4>
          </div>
          <p className="text-xs text-gray-600 mb-2">
            Unlock advanced animation controls with our Premium tier.
          </p>
          <button
            type="button"
            className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            onClick={() => window.open('/pricing', '_blank')}
          >
            Upgrade to Premium
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Easing */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="animation-easing" className="block text-xs font-medium">
                Easing
              </label>
              <button 
                type="button"
                onClick={() => toggleHelp('easing')}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            
            {showHelp === 'easing' && (
              <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                {getHelpText('easing')}
              </div>
            )}
            
            <select
              id="animation-easing"
              className="w-full text-sm p-1.5 border rounded"
              value={currentAnimation.easing || 'ease'}
              onChange={handleEasingChange}
              aria-label="Easing"
            >
              {EASING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Repeat */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="animation-repeat" className="block text-xs font-medium">
                Repeat
              </label>
              <button 
                type="button"
                onClick={() => toggleHelp('repeat')}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
            </div>
            
            {showHelp === 'repeat' && (
              <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                {getHelpText('repeat')}
              </div>
            )}
            
            <div className="flex items-center">
              <input
                id="animation-repeat"
                type="number"
                min="0"
                value={currentAnimation.repeat === 'infinite' ? '' : currentAnimation.repeat || 0}
                onChange={handleRepeatChange}
                disabled={currentAnimation.repeat === 'infinite'}
                className="w-20 text-sm p-1.5 border rounded mr-2"
                aria-label="Repeat count"
              />
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={currentAnimation.repeat === 'infinite'}
                  onChange={(e) => {
                    onChange({
                      ...currentAnimation,
                      repeat: e.target.checked ? 'infinite' : 0
                    });
                  }}
                  className="mr-1"
                />
                Infinite
              </label>
            </div>
          </div>
          
          {/* Beat Sync (Premium) */}
          {audioAvailable && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="beat-sync" className="block text-xs font-medium">
                  Sync with Audio
                </label>
                <button 
                  type="button"
                  onClick={() => toggleHelp('beatSync')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {showHelp === 'beatSync' && (
                <div className="text-xs text-gray-600 mb-2 p-2 bg-blue-50 rounded">
                  {getHelpText('beatSync')}
                </div>
              )}
              
              <div className="flex items-center">
                <label className="flex items-center text-xs">
                  <input
                    id="beat-sync"
                    type="checkbox"
                    checked={!!currentAnimation.beatSync}
                    onChange={handleBeatSyncToggle}
                    className="mr-1"
                    aria-label="Sync with audio"
                  />
                  <Music size={14} className="mr-1" />
                  Sync animation with beat
                </label>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Preview Button */}
      <div className="mt-3">
        <button
          type="button"
          className="w-full flex items-center justify-center text-sm bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
          onClick={onPreviewAnimation}
        >
          <Play size={16} className="mr-1" /> 
          Preview Animation
        </button>
      </div>
    </div>
  );
}; 