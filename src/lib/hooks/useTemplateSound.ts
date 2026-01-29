"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound } from '@/lib/types/audio';

/**
 * Hook for managing sounds associated with templates
 * 
 * This hook handles the connection between templates and their associated sounds,
 * making it easy to load, play, and manage template sounds.
 */
export function useTemplateSound(templateId?: string) {
  const { loadSound, state } = useAudio();
  const [templateSound, setTemplateSound] = useState<Sound | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load the template's associated sound when the template ID changes
  useEffect(() => {
    if (!templateId) return;
    
    const fetchTemplateSound = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/templates/${templateId}/sound`);
        const data = await response.json();
        
        if (data.success && data.sound) {
          setTemplateSound(data.sound);
        } else {
          setTemplateSound(null);
          if (data.error) {
            setError(data.error);
          }
        }
      } catch (err) {
        console.error('Error fetching template sound:', err);
        setError('Failed to load template sound');
        setTemplateSound(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplateSound();
  }, [templateId]);
  
  // Update the template's associated sound
  const updateTemplateSound = useCallback(async (sound: Sound | null) => {
    if (!templateId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // If sound is null, we're removing the association
      if (sound === null) {
        await fetch(`/api/templates/${templateId}/sound`, {
          method: 'DELETE',
        });
        
        setTemplateSound(null);
        return;
      }
      
      // Otherwise, we're setting/updating the association
      const response = await fetch(`/api/templates/${templateId}/sound`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ soundId: sound.id }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTemplateSound(sound);
        
        // Load the sound into the audio player
        loadSound(sound);
      } else {
        setError(data.error || 'Failed to update template sound');
      }
    } catch (err) {
      console.error('Error updating template sound:', err);
      setError('Failed to update template sound');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, loadSound]);
  
  // Load and play the template sound
  const playTemplateSound = useCallback(() => {
    if (templateSound) {
      loadSound(templateSound);
    }
  }, [templateSound, loadSound]);
  
  // Check if this sound is currently loaded
  const isCurrentSound = templateSound && state.currentSound 
    ? templateSound.id === state.currentSound.id
    : false;
  
  return {
    templateSound,
    isLoading,
    error,
    isCurrentSound,
    updateTemplateSound,
    playTemplateSound,
  };
}

export default useTemplateSound; 