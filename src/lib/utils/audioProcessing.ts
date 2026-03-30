"use client";

/**
 * Audio processing utilities for the audio-visual experience framework
 * These functions provide common audio analysis capabilities used throughout the framework
 */

/**
 * Analyzes audio data to detect beats
 * @param audioBuffer AudioBuffer containing audio data to analyze
 * @param options Configuration options for beat detection
 * @returns Array of beat timestamps in seconds
 */
export async function detectBeats(
  audioBuffer: AudioBuffer,
  options: {
    minThreshold?: number; // Minimum energy level to consider as beat
    timeWindow?: number; // Time window in seconds for beat detection
    lowPassFreq?: number; // Low-pass filter frequency in Hz
  } = {}
): Promise<number[]> {
  // Default options
  const {
    minThreshold = 0.15,
    timeWindow = 0.35,
    lowPassFreq = 150
  } = options;
  
  // Get audio data from the buffer
  const audioData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Create an offline audio context for processing
  const offlineCtx = new OfflineAudioContext(
    1,
    audioData.length,
    sampleRate
  );
  
  // Create a buffer source
  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Create a low-pass filter to focus on bass frequencies (where beats are most prominent)
  const filter = offlineCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowPassFreq;
  filter.Q.value = 1;
  
  // Connect nodes
  source.connect(filter);
  filter.connect(offlineCtx.destination);
  
  // Start the source
  source.start(0);
  
  // Process audio
  const renderedBuffer = await offlineCtx.startRendering();
  const filteredData = renderedBuffer.getChannelData(0);
  
  // Calculate beats
  const beats: number[] = [];
  const timeWindowSamples = Math.floor(timeWindow * sampleRate);
  
  let isPeak = false;
  let energyHistory: number[] = [];
  const historySize = 20; // Number of energy measurements to keep for relative comparison
  
  // Process in chunks to detect energy peaks
  for (let i = 0; i < filteredData.length; i += timeWindowSamples) {
    // Calculate energy (sum of squared amplitudes) in this window
    let energy = 0;
    const end = Math.min(i + timeWindowSamples, filteredData.length);
    for (let j = i; j < end; j++) {
      energy += filteredData[j] * filteredData[j];
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
 * Analyzes audio to determine its characteristics
 * @param audioBuffer AudioBuffer containing audio data to analyze
 * @returns Object with audio characteristics (tempo, energy, etc.)
 */
export async function analyzeAudioCharacteristics(
  audioBuffer: AudioBuffer
): Promise<{
  tempo: number;
  energy: number;
  valence: number;
  danceability: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
}> {
  // Get beats to calculate tempo
  const beats = await detectBeats(audioBuffer);
  
  // Calculate tempo from beats
  let tempo = 120; // Default
  if (beats.length > 3) {
    const beatIntervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      beatIntervals.push(beats[i] - beats[i - 1]);
    }
    
    // Calculate median interval
    beatIntervals.sort((a, b) => a - b);
    const medianInterval = beatIntervals[Math.floor(beatIntervals.length / 2)];
    
    // Convert to BPM
    tempo = Math.round(60 / medianInterval);
    
    // Sanity check (typical music is 60-200 BPM)
    if (tempo < 60) tempo *= 2;
    if (tempo > 200) tempo /= 2;
  }
  
  // Calculate energy (overall intensity/loudness)
  const data = audioBuffer.getChannelData(0);
  let totalEnergy = 0;
  for (let i = 0; i < data.length; i++) {
    totalEnergy += data[i] * data[i];
  }
  const energy = Math.min(1, totalEnergy / data.length * 100);
  
  // For a real implementation, we would analyze more aspects of the audio
  // Here we're calculating simulated values for the remaining characteristics
  
  // Valence (musical positiveness) - simulated for this example
  // In a real implementation, we would analyze spectral and harmonic content
  const valence = calculateSimulatedValence(audioBuffer, energy, tempo);
  
  // Danceability - combination of tempo, rhythm stability, and energy
  const danceability = calculateSimulatedDanceability(beats, tempo, energy);
  
  // These would be based on spectral analysis in a real implementation
  const acousticness = Math.random() * (1 - energy * 0.5); // Less energy often means more acoustic
  const instrumentalness = Math.random(); // Would analyze vocal presence
  const liveness = Math.random() * energy; // Live music often has higher energy
  
  return {
    tempo,
    energy,
    valence,
    danceability,
    acousticness,
    instrumentalness,
    liveness
  };
}

/**
 * Helper function to calculate simulated valence (musical positiveness)
 */
function calculateSimulatedValence(audioBuffer: AudioBuffer, energy: number, tempo: number): number {
  // In a real implementation, this would analyze harmonic content, mode (major/minor), etc.
  // For this demonstration, we'll use a heuristic based on energy and tempo
  
  // Fast, energetic music tends to be perceived as more positive
  const tempoFactor = (tempo - 60) / 140; // Normalized tempo (60-200 BPM)
  const baseFactor = 0.5; // Start at neutral
  
  return Math.min(1, Math.max(0, baseFactor + 0.3 * energy + 0.2 * tempoFactor));
}

/**
 * Helper function to calculate simulated danceability
 */
function calculateSimulatedDanceability(beats: number[], tempo: number, energy: number): number {
  // In a real implementation, this would analyze beat strength, regularity, etc.
  
  // Rhythm regularity (consistency of beat intervals)
  let rhythmRegularity = 0.5; // Default medium regularity
  if (beats.length > 3) {
    const beatIntervals: number[] = [];
    for (let i = 1; i < beats.length; i++) {
      beatIntervals.push(beats[i] - beats[i - 1]);
    }
    
    // Calculate standard deviation of intervals (lower means more regular)
    const mean = beatIntervals.reduce((sum, interval) => sum + interval, 0) / beatIntervals.length;
    const variance = beatIntervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / beatIntervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to regularity score (0-1)
    rhythmRegularity = Math.max(0, Math.min(1, 1 - (stdDev / mean)));
  }
  
  // Ideal dance tempo is around 100-130 BPM
  const tempoFactor = 1 - Math.abs((tempo - 115) / 115);
  
  // Combine factors for overall danceability
  return Math.min(1, Math.max(0, 0.3 * rhythmRegularity + 0.4 * energy + 0.3 * tempoFactor));
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
 * Creates sync points automatically based on beat detection
 * @param audioUrl URL of the audio file
 * @param elementIds Array of element IDs to create sync points for
 * @returns Array of sync points mapping beats to elements
 */
export async function createSyncPointsFromBeats(
  audioUrl: string,
  elementIds: string[]
): Promise<Array<{
  id: string;
  timestamp: number;
  elementId: string;
  elementType: 'text' | 'image' | 'background' | 'transition' | 'animation';
  action: string;
  params?: Record<string, any>;
}>> {
  if (!audioUrl || elementIds.length === 0) {
    return [];
  }
  
  try {
    // Load and analyze audio
    const audioBuffer = await loadAudioBuffer(audioUrl);
    const beats = await detectBeats(audioBuffer);
    
    // Create sync points mapping beats to elements
    const syncPoints = beats.map((beatTime, index) => {
      // Select an element ID (cycle through the provided IDs)
      const elementId = elementIds[index % elementIds.length];
      
      // Determine element type based on ID naming convention (simplistic approach)
      let elementType: 'text' | 'image' | 'background' | 'transition' | 'animation' = 'animation';
      if (elementId.includes('text')) elementType = 'text';
      else if (elementId.includes('image')) elementType = 'image';
      else if (elementId.includes('img')) elementType = 'image';
      else if (elementId.includes('bg')) elementType = 'background';
      else if (elementId.includes('transition')) elementType = 'transition';
      
      // Determine action based on beat position
      let action = 'pulse';
      if (index % 4 === 0) action = 'highlight'; // First beat of a measure
      else if (index % 8 === 4) action = 'transform'; // Middle of every other measure
      
      // Create sync point
      return {
        id: `sync_${Date.now()}_${index}`,
        timestamp: beatTime,
        elementId,
        elementType,
        action,
        params: {
          intensity: index % 4 === 0 ? 1.0 : 0.7, // Stronger on downbeats
          duration: 0.3,
        }
      };
    });
    
    return syncPoints;
  } catch (error) {
    console.error('Error creating sync points from beats:', error);
    return [];
  }
} 