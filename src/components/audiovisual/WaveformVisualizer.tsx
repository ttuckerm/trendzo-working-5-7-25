"use client";

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAudioVisual } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { TikTokSound } from '@/lib/types/tiktok';
import { Sound } from '@/lib/types/audio';
import { MediaElementAudioSourceNode as MediaElementSource } from 'standardized-audio-context';

interface WaveformVisualizerProps {
  sound?: Sound | TikTokSound | null;
  audioUrl?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  color?: string;
  backgroundColor?: string;
  progressColor?: string;
  className?: string;
  responsive?: boolean;
}

/**
 * WaveformVisualizer - Displays audio waveform with playback position
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Technical audio visualization is presented in a beautiful, intuitive form
 * - Emotional Design: Visuals reflect the emotional content of the audio
 * - Sensory Harmony: Visual elements directly represent audio characteristics
 */
const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  sound,
  audioUrl: propAudioUrl,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  height = 80,
  barWidth = 2,
  barGap = 1,
  color = '#cbd5e1', // Tailwind slate-300
  backgroundColor = 'transparent',
  progressColor = '#3b82f6', // Tailwind blue-500
  className,
  responsive = true
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  
  // State
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get audio-visual context
  const audioVisual = useAudioVisual();
  
  // Helper to extract URL from various sound object types
  const getAudioUrl = (sound?: Sound | TikTokSound | null): string | undefined => {
    if (!sound) return undefined;
    
    if ('url' in sound && sound.url) {
      return sound.url;
    }
    
    if ('playUrl' in sound && sound.playUrl) {
      return sound.playUrl;
    }
    
    return undefined;
  };
  
  // Get audio URL
  const soundUrl = getAudioUrl(sound);
  const audioUrl = propAudioUrl || soundUrl;
  
  // Initialize dimensions based on container size
  useEffect(() => {
    if (responsive && containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height
          });
        }
      };
      
      updateDimensions();
      
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
      
      return () => {
        if (containerRef.current) {
          resizeObserver.disconnect();
        }
      };
    } else {
      setDimensions({ width: 300, height });
    }
  }, [responsive, height]);
  
  // Generate waveform data when audio URL changes
  useEffect(() => {
    if (!audioUrl) {
      setWaveformData([]);
      return;
    }
    
    const generateWaveform = async () => {
      try {
        setIsGenerating(true);
        setError(null);
        
        // Create audio context if needed
        if (!audioContextRef.current && typeof window !== 'undefined' && 'AudioContext' in window) {
          audioContextRef.current = new AudioContext();
        }
        
        if (!audioContextRef.current) {
          throw new Error("Audio Context not supported in this browser");
        }
        
        // Fetch audio data
        const response = await fetch(audioUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode audio data
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        // Get audio data
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        
        // Calculate number of bars
        const barCount = Math.floor(dimensions.width / (barWidth + barGap));
        
        // Sample audio data to generate waveform
        const sampledData = sampleAudioData(channelData, barCount);
        
        setWaveformData(sampledData);
        setIsGenerating(false);
      } catch (err) {
        console.error('Error generating waveform:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate waveform');
        setIsGenerating(false);
        
        // Generate dummy waveform data instead
        const barCount = Math.floor(dimensions.width / (barWidth + barGap));
        const dummyData = Array.from({ length: barCount }, () => Math.random() * 0.5 + 0.1);
        setWaveformData(dummyData);
      }
    };
    
    if (dimensions.width > 0) {
      generateWaveform();
    }
  }, [audioUrl, dimensions.width, barWidth, barGap]);
  
  // Draw waveform on canvas
  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate playback progress position
    const progressPosition = duration > 0 ? (currentTime / duration) * canvas.width : 0;
    
    // Draw waveform bars
    const centerY = canvas.height / 2;
    
    waveformData.forEach((value, index) => {
      const barHeight = value * canvas.height;
      const x = index * (barWidth + barGap);
      
      // Set color based on playback position
      ctx.fillStyle = x < progressPosition ? progressColor : color;
      
      // Draw bar (centered vertically)
      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        barWidth,
        barHeight
      );
    });
  }, [
    waveformData,
    dimensions,
    barWidth,
    barGap,
    color,
    backgroundColor,
    progressColor,
    currentTime,
    duration
  ]);
  
  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ height: dimensions.height }}
    >
      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Loading indicator */}
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="text-sm text-white">Generating waveform...</div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
          <div className="text-sm text-red-700 bg-red-100 px-2 py-1 rounded">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to sample audio data for waveform visualization
const sampleAudioData = (channelData: Float32Array, barCount: number): number[] => {
  const sampledData: number[] = [];
  const samplesPerBar = Math.floor(channelData.length / barCount);
  
  for (let i = 0; i < barCount; i++) {
    const startSample = i * samplesPerBar;
    let sum = 0;
    let max = 0;
    
    // Calculate average and max amplitude for this segment
    for (let j = 0; j < samplesPerBar; j++) {
      const sample = Math.abs(channelData[startSample + j] || 0);
      sum += sample;
      max = Math.max(max, sample);
    }
    
    // Use a combination of average and max for better visual representation
    // The average alone can make soft parts too quiet, max alone can make it too spiky
    const value = (sum / samplesPerBar) * 0.7 + max * 0.3;
    
    // Normalize value to 0-1 range with some scaling to make quieter parts more visible
    const normalizedValue = Math.pow(value, 0.8); // Slightly reduce dynamic range
    
    sampledData.push(normalizedValue);
  }
  
  return sampledData;
};

export default WaveformVisualizer; 