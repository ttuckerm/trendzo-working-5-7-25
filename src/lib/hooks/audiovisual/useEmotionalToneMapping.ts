"use client";

import { useState, useEffect, useCallback } from 'react';
import { EmotionalTone } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { TikTokSound } from '@/lib/types/tiktok';

// Default emotional tones that match the ones in AudioVisualContext
const DEFAULT_TONES: EmotionalTone[] = [
  {
    id: 'energetic',
    name: 'Energetic',
    colorScheme: ['#ff7b00', '#ff9500', '#ffb700', '#ffda00', '#fffc00'],
    animationStyle: 'bounce',
    visualIntensity: 8
  },
  {
    id: 'calm',
    name: 'Calm',
    colorScheme: ['#00b4d8', '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8'],
    animationStyle: 'fade',
    visualIntensity: 3
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    colorScheme: ['#480ca8', '#560bad', '#7209b7', '#b5179e', '#f72585'],
    animationStyle: 'slide',
    visualIntensity: 7
  },
  {
    id: 'cheerful',
    name: 'Cheerful',
    colorScheme: ['#ff9a8b', '#ffb8b1', '#ffcbc1', '#fddedc', '#f5e8e6'],
    animationStyle: 'pop',
    visualIntensity: 6
  },
  {
    id: 'serious',
    name: 'Serious',
    colorScheme: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#ffffff'],
    animationStyle: 'zoom',
    visualIntensity: 5
  }
];

interface AudioCharacteristics {
  tempo: number; // BPM
  energy: number; // 0-1
  valence: number; // 0-1 (negative to positive emotional tone)
  danceability: number; // 0-1
  acousticness: number; // 0-1
  instrumentalness: number; // 0-1
  liveness: number; // 0-1
}

interface ToneMapping {
  matchedTone: EmotionalTone;
  confidence: number; // 0-1 confidence score of the match
  alternativeTones: EmotionalTone[]; // Other possible tones ranked by likelihood
  characteristics: AudioCharacteristics; // Detected audio characteristics
}

interface EmotionalToneMappingOptions {
  customTones?: EmotionalTone[]; // Optional custom tones to use instead of defaults
  preferUserHistory?: boolean; // Whether to consider user's historical preferences
  includeAlternatives?: boolean; // Whether to include alternative tone suggestions
  analysisSensitivity?: number; // 0-1 sensitivity level for analysis
}

const DEFAULT_OPTIONS: EmotionalToneMappingOptions = {
  preferUserHistory: true,
  includeAlternatives: true,
  analysisSensitivity: 0.7
};

/**
 * Hook for mapping audio characteristics to emotional tones
 * 
 * @param sound TikTokSound to analyze, or audio characteristics directly
 * @param options Configuration options for tone mapping
 * @returns Mapping result with matched tone and alternatives
 */
const useEmotionalToneMapping = (
  sound?: TikTokSound | AudioCharacteristics | null,
  options: EmotionalToneMappingOptions = DEFAULT_OPTIONS
): { 
  toneMapping: ToneMapping | null;
  loading: boolean;
  error: string | null;
  refreshMapping: () => void;
} => {
  const [toneMapping, setToneMapping] = useState<ToneMapping | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Merge options with defaults
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    customTones: options.customTones || DEFAULT_TONES
  };
  
  // Function to analyze audio and map to emotional tones
  const analyzeAndMap = useCallback(async () => {
    if (!sound) {
      setToneMapping(null);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would:
      // 1. Analyze the audio file to extract features like tempo, energy, etc.
      // 2. Use an algorithm to map these features to emotional tones
      // 3. Calculate confidence scores for matches
      
      // For now, simulate analysis with a timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Generate simulated audio characteristics
      // In a real implementation, these would come from actual audio analysis
      const simulatedCharacteristics: AudioCharacteristics = 'tempo' in sound 
        ? sound as AudioCharacteristics // Use provided characteristics if already available
        : {
            // Generate random but plausible values
            tempo: Math.floor(Math.random() * 80) + 80, // 80-160 BPM
            energy: Math.random(),
            valence: Math.random(),
            danceability: Math.random(),
            acousticness: Math.random(),
            instrumentalness: Math.random(),
            liveness: Math.random()
          };
      
      // Simulate tone matching based on characteristics
      // In a real implementation, this would use a more sophisticated algorithm
      const tones = mergedOptions.customTones || DEFAULT_TONES;
      
      // Simplified mapping algorithm:
      // - High energy + high tempo = energetic
      // - High valence + high danceability = cheerful
      // - Low valence + high energy = dramatic
      // - Low energy + high acousticness = calm
      // - Low valence + low energy = serious
      
      let bestMatch: EmotionalTone;
      let confidence: number;
      
      const { tempo, energy, valence, danceability, acousticness } = simulatedCharacteristics;
      
      if (energy > 0.7 && tempo > 120) {
        bestMatch = tones.find(t => t.id === 'energetic') || tones[0];
        confidence = 0.8 + (Math.random() * 0.2); // 0.8-1.0
      } else if (valence > 0.7 && danceability > 0.7) {
        bestMatch = tones.find(t => t.id === 'cheerful') || tones[0];
        confidence = 0.75 + (Math.random() * 0.25); // 0.75-1.0
      } else if (valence < 0.4 && energy > 0.6) {
        bestMatch = tones.find(t => t.id === 'dramatic') || tones[0];
        confidence = 0.7 + (Math.random() * 0.3); // 0.7-1.0
      } else if (energy < 0.4 && acousticness > 0.6) {
        bestMatch = tones.find(t => t.id === 'calm') || tones[0];
        confidence = 0.8 + (Math.random() * 0.2); // 0.8-1.0
      } else {
        bestMatch = tones.find(t => t.id === 'serious') || tones[0];
        confidence = 0.6 + (Math.random() * 0.3); // 0.6-0.9
      }
      
      // Generate alternative tones (all other tones, ranked by some simulated score)
      const alternativeTones = tones
        .filter(tone => tone.id !== bestMatch.id)
        .sort(() => Math.random() - 0.5); // Random sort for simulation
      
      // Create mapping result
      const mappingResult: ToneMapping = {
        matchedTone: bestMatch,
        confidence,
        alternativeTones: mergedOptions.includeAlternatives ? alternativeTones : [],
        characteristics: simulatedCharacteristics
      };
      
      setToneMapping(mappingResult);
      setLoading(false);
    } catch (err) {
      console.error('Error mapping emotional tone:', err);
      setError('Failed to analyze audio for emotional tone mapping');
      setLoading(false);
    }
  }, [sound, mergedOptions]);
  
  // Run analysis when sound changes
  useEffect(() => {
    if (sound) {
      analyzeAndMap();
    } else {
      setToneMapping(null);
      setError(null);
    }
  }, [sound, analyzeAndMap]);
  
  return {
    toneMapping,
    loading,
    error,
    refreshMapping: analyzeAndMap
  };
};

export type { AudioCharacteristics, ToneMapping, EmotionalToneMappingOptions };
export default useEmotionalToneMapping; 