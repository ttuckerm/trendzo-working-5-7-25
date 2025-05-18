"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { useEditor } from '@/lib/contexts/EditorContext';
import { 
  detectBeats, 
  loadAudioBuffer, 
  createSyncPointsFromBeats 
} from '@/lib/utils/audioProcessing';
import { 
  Animation, 
  BaseElement,
  TextElement,
  TemplateElement 
} from '@/lib/types/templateEditor.types';
import { Sound } from '@/lib/types/audio';

export interface SyncPoint {
  id: string;
  timestamp: number;
  elementId: string;
  elementType: 'text' | 'image' | 'background' | 'transition' | 'animation';
  action: string;
  params?: Record<string, any>;
}

interface BeatSyncAnimationOptions {
  autoSync?: boolean;
  intensity?: number;
  threshold?: number;
}

export function useBeatSyncAnimation(options: BeatSyncAnimationOptions = {}) {
  const { 
    autoSync = false,
    intensity = 1.0,
    threshold = 0.15
  } = options;
  
  const { state: audioState } = useAudio();
  const { state: editorState, updateElement } = useEditor();
  
  // Reference to active animations
  const activeAnimationsRef = useRef<Map<string, number>>(new Map());
  
  // State for sync points
  const [syncPoints, setSyncPoints] = useState<SyncPoint[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load audio buffer when sound changes
  useEffect(() => {
    if (!audioState.currentSound) {
      setAudioBuffer(null);
      return;
    }
    
    const soundUrl = getValidSoundUrl(audioState.currentSound as any);
    if (!soundUrl) {
      setError('Invalid or missing audio URL');
      setAudioBuffer(null);
      return;
    }
    
    const loadBuffer = async () => {
      try {
        const buffer = await loadAudioBuffer(soundUrl);
        setAudioBuffer(buffer);
        setError(null);
      } catch (err) {
        console.error('Error loading audio buffer:', err);
        setError('Failed to load audio for beat detection');
        setAudioBuffer(null);
      }
    };
    
    loadBuffer();
  }, [audioState.currentSound]);
  
  // Generate sync points when requested or automatically
  const generateSyncPoints = useCallback(async () => {
    if (!audioBuffer || !editorState.template.id) {
      return;
    }
    
    try {
      setIsSyncing(true);
      
      // Get all visible elements with IDs
      const elements = getAllElementsFromTemplate(editorState);
      const elementIds = elements.map(el => el.id);
      
      if (elementIds.length === 0) {
        setSyncPoints([]);
        setIsSyncing(false);
        return;
      }
      
      if (!audioState.currentSound) {
        throw new Error('No audio available');
      }
      
      const soundUrl = getValidSoundUrl(audioState.currentSound as any);
      if (!soundUrl) {
        throw new Error('Invalid or missing audio URL');
      }
      
      // Generate sync points based on beats
      const points = await createSyncPointsFromBeats(
        soundUrl,
        elementIds
      );
      
      setSyncPoints(points);
      setError(null);
    } catch (err) {
      console.error('Error generating sync points:', err);
      setError('Failed to generate beat sync points');
      setSyncPoints([]);
    } finally {
      setIsSyncing(false);
    }
  }, [audioBuffer, editorState, audioState.currentSound]);
  
  // Auto-sync when conditions are met
  useEffect(() => {
    if (autoSync && audioBuffer && editorState.template.id && 
        audioState.currentSound && !isSyncing && syncPoints.length === 0) {
      generateSyncPoints();
    }
  }, [autoSync, audioBuffer, editorState.template.id, 
      audioState.currentSound, isSyncing, syncPoints.length, generateSyncPoints]);
  
  // Apply animations when current time matches beat timestamps
  useEffect(() => {
    if (!audioState.isPlaying || syncPoints.length === 0) {
      return;
    }
    
    // Get current time
    const currentTime = (audioState as any).playback?.currentTime || 0;
    
    // Find beats that should trigger now
    // We look for beats within a small time window to account for timing imprecision
    const timeWindow = 0.05; // 50ms window
    const triggeredPoints = syncPoints.filter(point => {
      return Math.abs(point.timestamp - currentTime) < timeWindow &&
             !activeAnimationsRef.current.has(point.id);
    });
    
    // Trigger animations for these points
    triggeredPoints.forEach(point => {
      const element = getElementById(editorState, point.elementId);
      if (!element) return;
      
      // Track this animation as active
      activeAnimationsRef.current.set(point.id, window.setTimeout(() => {
        activeAnimationsRef.current.delete(point.id);
      }, 500)); // Animation cooldown
      
      // Apply animation effect based on the action
      applyBeatAnimation(point, element, updateElement, intensity, editorState);
    });
  }, [audioState.isPlaying, (audioState as any).playback?.currentTime, 
      syncPoints, editorState, updateElement, intensity]);
  
  // Clear all sync points
  const clearSyncPoints = useCallback(() => {
    setSyncPoints([]);
  }, []);
  
  return {
    syncPoints,
    isSyncing,
    error,
    generateSyncPoints,
    clearSyncPoints,
    hasSyncPoints: syncPoints.length > 0
  };
}

// Helper function to get all elements from template
function getAllElementsFromTemplate(editorState: any): TemplateElement[] {
  const elements: TemplateElement[] = [];
  
  // Get elements from each section
  editorState.template.sections.forEach((section: any) => {
    if (section.elements && Array.isArray(section.elements)) {
      elements.push(...section.elements);
    }
  });
  
  return elements;
}

// Helper function to get element by ID
function getElementById(editorState: any, elementId: string): TemplateElement | null {
  for (const section of editorState.template.sections) {
    if (!section.elements) continue;
    
    const element = section.elements.find((el: any) => el.id === elementId);
    if (element) return element;
  }
  return null;
}

// Helper function to safely get sound URL
function getValidSoundUrl(sound: any): string {
  if (!sound) return '';
  
  // Check if url property exists
  if ('url' in sound && typeof sound.url === 'string') {
    return sound.url;
  }
  
  // For TikTok-specific sounds that might use a different property
  if ('playUrl' in sound && typeof sound.playUrl === 'string') {
    return sound.playUrl;
  }
  
  return '';
}

// Apply beat animation based on action type
function applyBeatAnimation(
  point: SyncPoint, 
  element: TemplateElement, 
  updateElement: any, // Using any to avoid complex type definition issues
  intensity: number,
  editorState: any
) {
  const { action, params } = point;
  const effectIntensity = (params?.intensity || 1.0) * intensity;
  
  // We'll apply temporary animations via the animation property
  // In a real implementation, you might use a more sophisticated animation system
  
  // Clone the existing animation if any
  const baseAnimation = element.animation ? { ...element.animation } : {
    type: 'scale' as const,
    delay: 0,
    duration: 0.3,
    easing: 'ease-out'
  };
  
  // Create animation based on action type
  let animation: Animation;
  
  switch (action) {
    case 'pulse':
      animation = {
        ...baseAnimation,
        type: 'scale',
        duration: params?.duration || 0.3,
        customParams: {
          pulse: true,
          pulseIntensity: effectIntensity,
          beatTimestamp: point.timestamp
        }
      };
      break;
      
    case 'highlight':
      animation = {
        ...baseAnimation,
        type: 'custom',
        duration: params?.duration || 0.5,
        customParams: {
          highlight: true,
          highlightIntensity: effectIntensity,
          beatTimestamp: point.timestamp
        }
      };
      break;
      
    case 'transform':
      animation = {
        ...baseAnimation,
        type: 'rotate',
        duration: params?.duration || 0.4,
        customParams: {
          transform: true,
          transformIntensity: effectIntensity,
          beatTimestamp: point.timestamp
        }
      };
      break;
      
    default:
      animation = baseAnimation as Animation;
  }
  
  // Update the element with the new animation
  if (typeof updateElement === 'function') {
    // Handle different function signatures
    try {
      const sectionId = getSectionIdForElement(editorState, element.id);
      if (sectionId) {
        updateElement(sectionId, element.id, { animation });
      } else {
        updateElement(element.id, { animation });
      }
    } catch (err) {
      console.error('Error updating element animation:', err);
    }
  }
}

// Helper function to get section ID for an element
function getSectionIdForElement(editorState: any, elementId: string): string | null {
  for (const section of editorState.template.sections) {
    if (!section.elements) continue;
    
    const elementExists = section.elements.some((el: any) => el.id === elementId);
    if (elementExists) return section.id;
  }
  return null;
} 