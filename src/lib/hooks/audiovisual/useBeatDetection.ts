"use client";

import { useState, useCallback, useEffect } from 'react';

interface BeatDetectionOptions {
  sensitivity?: number; // 0-1 sensitivity level, higher means more beats detected
  minBeatInterval?: number; // Minimum time between beats in milliseconds
  frequencyRange?: [number, number]; // Frequency range to analyze [min, max]
}

interface BeatDetectionResult {
  beats: number[]; // Array of beat timestamps in seconds
  timeSignature: number; // Estimated time signature (e.g., 4 for 4/4)
  bpm: number; // Beats per minute
  strength: number[]; // Relative strength of each beat (0-1)
  loading: boolean;
  error: string | null;
}

const DEFAULT_OPTIONS: BeatDetectionOptions = {
  sensitivity: 0.5,
  minBeatInterval: 250, // 250ms = minimum time between beats
  frequencyRange: [60, 120], // Focus on bass frequencies for beat detection
};

/**
 * Hook for detecting and analyzing beats in audio tracks
 * 
 * @param audioUrl URL of the audio file to analyze
 * @param options Beat detection configuration options
 * @returns Beat detection result with timing information
 */
const useBeatDetection = (
  audioUrl?: string,
  options: BeatDetectionOptions = DEFAULT_OPTIONS
): BeatDetectionResult => {
  const [beats, setBeats] = useState<number[]>([]);
  const [timeSignature, setTimeSignature] = useState<number>(4); // Default to 4/4
  const [bpm, setBpm] = useState<number>(0);
  const [strength, setStrength] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Merged options
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  
  /**
   * Detect beats from audio URL
   * This is a simplified implementation - a real one would use Web Audio API
   * for spectral analysis and actual beat detection
   */
  const detectBeats = useCallback(async () => {
    if (!audioUrl) {
      setError('No audio URL provided');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, we would:
      // 1. Load the audio file using Web Audio API
      // 2. Create an AnalyserNode to process frequency data
      // 3. Detect energy peaks in the relevant frequency bands
      // 4. Identify beats based on those energy peaks
      // 5. Calculate BPM and time signature
      
      // For now, simulate beat detection with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate detected beats (2 measures in 4/4 time at 120 BPM)
      const simulatedBpm = 120;
      const beatsPerMeasure = 4;
      const secondsPerBeat = 60 / simulatedBpm;
      const numberOfBeats = beatsPerMeasure * 4; // 4 measures
      
      const simulatedBeats = Array.from(
        { length: numberOfBeats },
        (_, i) => i * secondsPerBeat
      );
      
      // Simulate beat strength (first beat of measure is stronger)
      const simulatedStrength = simulatedBeats.map((_, i) => 
        i % beatsPerMeasure === 0 ? 1.0 : 0.7 - (0.1 * (i % beatsPerMeasure))
      );
      
      setBeats(simulatedBeats);
      setBpm(simulatedBpm);
      setTimeSignature(beatsPerMeasure);
      setStrength(simulatedStrength);
      
      setLoading(false);
    } catch (err) {
      console.error('Error detecting beats:', err);
      setError('Failed to analyze audio for beats');
      setLoading(false);
    }
  }, [audioUrl, mergedOptions]);
  
  // Detect beats when audioUrl changes
  useEffect(() => {
    if (audioUrl) {
      detectBeats();
    } else {
      // Reset state when no URL is provided
      setBeats([]);
      setBpm(0);
      setTimeSignature(4);
      setStrength([]);
      setError(null);
    }
  }, [audioUrl, detectBeats]);
  
  return {
    beats,
    timeSignature,
    bpm,
    strength,
    loading,
    error,
  };
};

export default useBeatDetection; 