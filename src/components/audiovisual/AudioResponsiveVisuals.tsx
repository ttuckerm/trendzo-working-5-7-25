"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAudioVisual } from '@/lib/contexts/audiovisual/AudioVisualContext';
import { motion } from 'framer-motion';
import { Sound } from '@/lib/types/audio';
import { TikTokSound } from '@/lib/types/tiktok';
import { cn } from '@/lib/utils';
import { MediaElementAudioSourceNode as MediaElementSource } from 'standardized-audio-context';

interface AudioResponsiveVisualsProps {
  sound?: Sound | TikTokSound | null;
  audioUrl?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  className?: string;
  visualMode?: 'particles' | 'shapes' | 'waves' | 'pulse';
  intensity?: number; // 0-10 scale
  responsive?: boolean;
  children?: React.ReactNode;
}

// Helper to extract URL from various sound object types
const getAudioUrl = (sound?: Sound | TikTokSound | null): string | undefined => {
  if (!sound) return undefined;
  
  // Check if it's a Sound object
  if ('url' in sound && sound.url) {
    return sound.url;
  }
  
  // Check if it's a TikTokSound object
  if ('playUrl' in sound && sound.playUrl) {
    return sound.playUrl;
  }
  
  return undefined;
};

/**
 * AudioResponsiveVisuals - Creates dynamic visual effects that respond to audio
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Technical audio analysis is hidden behind beautiful visuals
 * - Emotional Design: Visuals reflect the emotional quality of the audio
 * - Sensory Harmony: Audio and visual elements work together seamlessly
 */
const AudioResponsiveVisuals: React.FC<AudioResponsiveVisualsProps> = ({
  sound,
  audioUrl: propAudioUrl,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  className,
  visualMode = 'particles',
  intensity = 5,
  responsive = true,
  children
}) => {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  
  // State
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  
  // Get audio-visual context
  const audioVisual = useAudioVisual();
  
  // Determine audio URL
  const soundUrl = getAudioUrl(sound);
  const audioUrl = propAudioUrl || soundUrl;
  
  // Initialize canvas and audio context
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Set up canvas context
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    setCanvasContext(ctx);
    
    // Set up audio context if we have an audio source
    if (audioUrl && typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256; // Power of 2, controls detail level
        
        // Connect to audio element if we have one
        if (audioRef.current) {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
        }
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        setAudioData(new Uint8Array(bufferLength));
      } catch (err) {
        console.error('Failed to initialize AudioContext:', err);
      }
    }
    
    // Update dimensions initially
    updateDimensions();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Clean up audio context
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      
      // Clean up resize observer
      resizeObserver.disconnect();
    };
  }, [audioUrl]);
  
  // Update canvas dimensions when container resizes
  const updateDimensions = () => {
    if (!containerRef.current) return;
    
    const { width, height } = containerRef.current.getBoundingClientRect();
    setDimensions({ width, height });
    
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  };
  
  // Handle audio playing state
  useEffect(() => {
    if (isPlaying) {
      // Resume audio context if it's suspended
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Start visualization if we have audio data
      if (analyserRef.current && canvasContext) {
        startVisualization();
      }
    } else {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [isPlaying, canvasContext, visualMode, intensity]);
  
  // Start the visualization loop
  const startVisualization = () => {
    if (!analyserRef.current || !canvasContext || !audioData) return;
    
    const draw = () => {
      // Get frequency data from analyser
      analyserRef.current!.getByteFrequencyData(audioData);
      
      // Clear canvas
      canvasContext.clearRect(0, 0, dimensions.width, dimensions.height);
      
      // Draw based on selected visual mode
      switch (visualMode) {
        case 'particles':
          drawParticles(canvasContext, audioData, dimensions, intensity);
          break;
        case 'shapes':
          drawShapes(canvasContext, audioData, dimensions, intensity);
          break;
        case 'waves':
          drawWaves(canvasContext, audioData, dimensions, intensity);
          break;
        case 'pulse':
          drawPulse(canvasContext, audioData, dimensions, intensity);
          break;
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(draw);
    };
    
    // Start animation loop
    draw();
  };
  
  // Render the visualization component
  const renderVisuals = () => {
    // Use colors from the current emotional tone
    const colors = audioVisual.currentTone?.colorScheme || ['#ff7b00', '#ff9500', '#ffb700', '#ffda00'];
    
    // Create a gradient background based on current tone
    const gradientStyle = {
      background: `linear-gradient(45deg, ${colors[0]}22, ${colors[colors.length - 1]}11)`,
    };
    
    return (
      <div className="absolute inset-0 overflow-hidden" style={gradientStyle}>
        <canvas 
          ref={canvasRef} 
          className="absolute inset-0"
          width={dimensions.width} 
          height={dimensions.height} 
        />
        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            style={{ display: 'none' }} 
          />
        )}
      </div>
    );
  };
  
  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {renderVisuals()}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Drawing functions for different visual modes

const drawParticles = (
  ctx: CanvasRenderingContext2D, 
  audioData: Uint8Array, 
  dimensions: { width: number, height: number }, 
  intensity: number
) => {
  const particleCount = Math.floor(audioData.length / 2);
  const intensityFactor = intensity / 5; // Scale intensity to a reasonable range
  
  for (let i = 0; i < particleCount; i++) {
    const value = audioData[i * 2];
    const percent = value / 255;
    const size = percent * 20 * intensityFactor + 2;
    
    // Calculate position based on audio data
    const x = (i / particleCount) * dimensions.width;
    const y = dimensions.height / 2 + (Math.sin(percent * Math.PI * 2) * dimensions.height / 4);
    
    // Draw particle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${(i * 2) % 360}, 80%, 60%, ${percent * 0.8})`;
    ctx.fill();
  }
};

const drawShapes = (
  ctx: CanvasRenderingContext2D, 
  audioData: Uint8Array, 
  dimensions: { width: number, height: number }, 
  intensity: number
) => {
  const shapeCount = 5;
  const intensityFactor = intensity / 5;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  
  // Get average audio levels for different frequency ranges
  const bass = getAverageLevel(audioData, 0, 10);
  const mid = getAverageLevel(audioData, 10, 100);
  const treble = getAverageLevel(audioData, 100, audioData.length);
  
  // Draw shapes based on audio levels
  const maxRadius = Math.min(dimensions.width, dimensions.height) / 2;
  
  // Outer shape
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `hsla(${bass * 360}, 80%, 60%, 0.7)`;
  ctx.arc(centerX, centerY, treble * maxRadius * intensityFactor, 0, Math.PI * 2);
  ctx.stroke();
  
  // Middle shape
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = `hsla(${mid * 360}, 80%, 60%, 0.8)`;
  drawPolygon(ctx, centerX, centerY, mid * maxRadius * 0.8 * intensityFactor, 6);
  ctx.stroke();
  
  // Inner shape
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = `hsla(${treble * 360}, 80%, 70%, 0.9)`;
  drawPolygon(ctx, centerX, centerY, bass * maxRadius * 0.6 * intensityFactor, 3);
  ctx.stroke();
};

const drawWaves = (
  ctx: CanvasRenderingContext2D, 
  audioData: Uint8Array, 
  dimensions: { width: number, height: number }, 
  intensity: number
) => {
  const intensityFactor = intensity / 5;
  const waveCount = 3;
  const centerY = dimensions.height / 2;
  
  // Draw multiple waves
  for (let wave = 0; wave < waveCount; wave++) {
    const waveOffset = (wave / waveCount) * 40;
    const alpha = 1 - (wave / waveCount) * 0.6;
    
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    // Draw wave points
    for (let i = 0; i < dimensions.width; i += 10) {
      const dataIndex = Math.floor((i / dimensions.width) * audioData.length);
      const value = audioData[dataIndex] || 0;
      const percent = value / 255;
      
      // Calculate y position with wave effect
      const y = centerY + 
        Math.sin(i * 0.01 + waveOffset) * 20 * intensityFactor + 
        percent * 100 * intensityFactor;
      
      ctx.lineTo(i, y);
    }
    
    // Complete the path
    ctx.lineTo(dimensions.width, centerY);
    ctx.strokeStyle = `hsla(${200 + wave * 40}, 80%, 50%, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
};

const drawPulse = (
  ctx: CanvasRenderingContext2D, 
  audioData: Uint8Array, 
  dimensions: { width: number, height: number }, 
  intensity: number
) => {
  const intensityFactor = intensity / 5;
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  
  // Get overall audio energy
  const energy = getAverageLevel(audioData, 0, audioData.length);
  
  // Draw pulse effect
  const pulseRadius = energy * Math.min(dimensions.width, dimensions.height) / 2 * intensityFactor;
  
  // Outer pulse
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${energy * 360}, 80%, 60%, ${0.1 * intensityFactor})`;
  ctx.fill();
  
  // Middle pulse
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius * 0.7, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${energy * 360}, 85%, 65%, ${0.2 * intensityFactor})`;
  ctx.fill();
  
  // Inner pulse
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${energy * 360}, 90%, 70%, ${0.3 * intensityFactor})`;
  ctx.fill();
};

// Helper functions for visualizations

const getAverageLevel = (data: Uint8Array, start: number, end: number): number => {
  let sum = 0;
  const count = Math.min(end, data.length) - start;
  
  if (count <= 0) return 0;
  
  for (let i = start; i < Math.min(end, data.length); i++) {
    sum += data[i] / 255;
  }
  
  return sum / count;
};

const drawPolygon = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  radius: number, 
  sides: number
) => {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;
    
    if (i === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }
  ctx.closePath();
};

export default AudioResponsiveVisuals; 