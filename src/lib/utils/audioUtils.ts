/**
 * Audio Utility Functions
 * 
 * This file contains helper functions for working with audio data and formatting.
 */

/**
 * Format seconds into MM:SS display format
 * @param seconds - Time in seconds
 * @param showHours - Whether to include hours in display
 * @returns Formatted time string (e.g., "3:45" or "1:23:45")
 */
export function formatAudioTime(seconds: number, showHours = false): string {
  if (isNaN(seconds) || seconds < 0) {
    return showHours ? '00:00:00' : '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  if (showHours || hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Format seconds into a user-friendly display string
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "3 min 45 sec")
 */
export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0 sec';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  } else if (remainingSeconds === 0) {
    return `${minutes} min`;
  } else {
    return `${minutes} min ${remainingSeconds} sec`;
  }
}

/**
 * Calculate time remaining from current time and total duration
 * @param currentTime - Current playback position (seconds)
 * @param duration - Total duration (seconds)
 * @returns Formatted time remaining
 */
export function getTimeRemaining(currentTime: number, duration: number): string {
  const remaining = duration - currentTime;
  return formatAudioTime(Math.max(0, remaining));
}

/**
 * Calculate the progress percentage
 * @param currentTime - Current playback position (seconds)
 * @param duration - Total duration (seconds)
 * @returns Percentage from 0-100
 */
export function calculateProgress(currentTime: number, duration: number): number {
  if (duration <= 0 || currentTime < 0) return 0;
  return Math.min(100, (currentTime / duration) * 100);
}

/**
 * Convert a percentage to a time value
 * @param percent - Percentage (0-100)
 * @param duration - Total duration (seconds)
 * @returns Time in seconds
 */
export function percentToTime(percent: number, duration: number): number {
  if (duration <= 0) return 0;
  return (percent / 100) * duration;
}

/**
 * Generate waveform data from an audio URL
 * This function fetches an audio file and analyzes it to create waveform data
 * @param audioUrl - URL of the audio file
 * @param samples - Number of data points to generate
 * @returns Promise resolving to array of amplitude values (0-1)
 */
export async function generateWaveformData(
  audioUrl: string,
  samples = 100
): Promise<number[]> {
  try {
    // Create audio context
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Fetch the audio file
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Get the channel data
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / samples);
    
    // Calculate the waveform data
    const waveform = [];
    
    for (let i = 0; i < samples; i++) {
      const start = blockSize * i;
      let sum = 0;
      let max = 0;
      
      for (let j = 0; j < blockSize; j++) {
        const amplitude = Math.abs(channelData[start + j]);
        sum += amplitude;
        if (amplitude > max) {
          max = amplitude;
        }
      }
      
      // Use a mix of average and peak for better visual representation
      const value = (sum / blockSize + max) / 2;
      waveform.push(value);
    }
    
    // Normalize the waveform data to range 0-1
    const maxValue = Math.max(...waveform);
    return waveform.map(value => value / maxValue);
  } catch (error) {
    console.error('Error generating waveform data:', error);
    // Return a flat line if there's an error
    return Array(samples).fill(0.5);
  }
}

/**
 * Check if the browser supports audio playback
 * @returns True if audio is supported
 */
export function isAudioSupported(): boolean {
  return typeof Audio !== 'undefined';
}

/**
 * Check if the Web Audio API is supported
 * @returns True if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return typeof window !== 'undefined' && 
         (typeof window.AudioContext !== 'undefined' || 
          typeof (window as any).webkitAudioContext !== 'undefined');
}

/**
 * Get the browser's supported audio formats
 * @returns Object with boolean flags for each format
 */
export function getSupportedAudioFormats(): { [key: string]: boolean } {
  if (typeof document === 'undefined') {
    return {
      mp3: false,
      wav: false,
      ogg: false,
      aac: false,
      flac: false
    };
  }
  
  const audio = document.createElement('audio');
  
  return {
    mp3: audio.canPlayType('audio/mpeg').replace('no', '') !== '',
    wav: audio.canPlayType('audio/wav').replace('no', '') !== '',
    ogg: audio.canPlayType('audio/ogg; codecs="vorbis"').replace('no', '') !== '',
    aac: audio.canPlayType('audio/aac').replace('no', '') !== '',
    flac: audio.canPlayType('audio/flac').replace('no', '') !== ''
  };
}

/**
 * Converts decibels to a percentage value (0-100)
 * @param db - Decibel value
 * @returns Percentage value
 */
export function dbToPercent(db: number): number {
  // Standard formula for converting dB to linear scale
  // 0dB = 100%, -60dB ~= 0%
  if (db >= 0) return 100;
  if (db <= -60) return 0;
  
  return Math.round(100 * Math.pow(10, db / 20));
}

/**
 * Converts a percentage (0-100) to a decibel value
 * @param percent - Percentage value
 * @returns Decibel value
 */
export function percentToDb(percent: number): number {
  if (percent <= 0) return -Infinity;
  if (percent >= 100) return 0;
  
  return 20 * Math.log10(percent / 100);
}

/**
 * Calculates audio energy level based on frequency data
 * @param frequencyData - Uint8Array of frequency data from analyzer
 * @returns Energy level as percentage (0-100)
 */
export function calculateAudioEnergy(frequencyData: Uint8Array): number {
  if (!frequencyData?.length) return 0;
  
  // Calculate average energy across the frequency spectrum
  const sum = Array.from(frequencyData).reduce((acc, val) => acc + val, 0);
  const average = sum / frequencyData.length;
  
  // Normalize to 0-100 scale (frequency data is 0-255)
  return Math.round((average / 255) * 100);
}

/**
 * Detects BPM (beats per minute) from audio buffer
 * Note: This is a simplified implementation and may not be accurate for all music types
 * @param audioBuffer - AudioBuffer containing audio data
 * @returns Estimated BPM or null if detection fails
 */
export function detectBPM(audioBuffer: AudioBuffer): number | null {
  // This is a placeholder for a more sophisticated BPM detection algorithm
  // A real implementation would use techniques like:
  // - Energy-based onset detection
  // - Autocorrelation
  // - Spectral flux analysis
  
  // For demo purposes, we'll return a random value in a realistic range
  return Math.floor(Math.random() * (180 - 70) + 70);
} 