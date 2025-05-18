"use client";

/**
 * A simplified implementation of beat detection for testing purposes.
 * This isolates the core functionality from the more complex audioProcessing.ts
 */

/**
 * Detects beats in audio data
 * @param audioBuffer The audio buffer to analyze
 * @returns Array of beat timestamps in seconds
 */
export async function detectBeats(audioBuffer: AudioBuffer): Promise<number[]> {
  // Extract audio data
  const audioData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Parameters for beat detection
  const timeWindow = 0.35; // Window size in seconds
  const minThreshold = 0.15; // Minimum energy threshold
  const timeWindowSamples = Math.floor(timeWindow * sampleRate);
  
  const beats: number[] = [];
  let isPeak = false;
  let energyHistory: number[] = [];
  const historySize = 20;
  
  // Process in chunks to detect energy peaks
  for (let i = 0; i < audioData.length; i += timeWindowSamples) {
    // Calculate energy in this window
    let energy = 0;
    const end = Math.min(i + timeWindowSamples, audioData.length);
    
    for (let j = i; j < end; j++) {
      energy += audioData[j] * audioData[j];
    }
    energy = energy / (end - i);
    
    // Calculate dynamic threshold based on energy history
    const avgEnergy = energyHistory.length > 0
      ? energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length
      : 0;
    
    const threshold = Math.max(minThreshold, avgEnergy * 1.3); // 30% higher than average
    
    // Check if this window contains a beat
    if (energy > threshold && !isPeak) {
      isPeak = true;
      beats.push(i / sampleRate); // Convert sample position to seconds
    } else if (energy < threshold * 0.8) {
      // Reset peak flag when energy drops significantly below threshold
      isPeak = false;
    }
    
    // Update energy history
    energyHistory.push(energy);
    if (energyHistory.length > historySize) {
      energyHistory.shift();
    }
  }
  
  return beats;
}

/**
 * Loads an audio file and creates an AudioBuffer
 * @param url URL of the audio file to load
 * @returns AudioBuffer containing the decoded audio data
 */
export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  // Fetch the audio file
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
  }
  
  // Get array buffer from response
  const arrayBuffer = await response.arrayBuffer();
  
  // Create audio context
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Decode audio data
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Simple function to create sync points from beats
 * @param beats Array of beat timestamps
 * @param elements Array of element objects with ids
 * @returns Array of sync points
 */
export function createSyncPointsFromBeats(
  beats: number[],
  elements: Array<{ id: string; type?: string }>
): Array<{
  id: string;
  timestamp: number;
  elementId: string;
  elementType: string;
  action: string;
}> {
  return beats.map((timestamp, index) => {
    // Select an element (cycling through the available elements)
    const element = elements[index % elements.length];
    
    // Determine element type based on element properties or ID
    let elementType = element.type || 'unknown';
    if (!elementType || elementType === 'unknown') {
      const id = element.id.toLowerCase();
      if (id.includes('text')) elementType = 'text';
      else if (id.includes('image') || id.includes('img')) elementType = 'image';
      else if (id.includes('bg')) elementType = 'background';
      else elementType = 'animation';
    }
    
    // Determine action based on beat position
    let action = 'pulse';
    if (index % 4 === 0) action = 'highlight'; // First beat of a measure
    else if (index % 8 === 4) action = 'transform'; // Middle of every other measure
    
    return {
      id: `sync_${Date.now()}_${index}`,
      timestamp,
      elementId: element.id,
      elementType,
      action
    };
  });
} 