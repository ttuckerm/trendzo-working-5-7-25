"use client";

import React, { useState } from 'react';
import { useAudioVisual } from '@/lib/contexts/audiovisual/AudioVisualContext';
import AudioVisualSynchronizer from './AudioVisualSynchronizer';

// Demo sound options
const DEMO_SOUNDS = [
  {
    id: 'energetic-demo',
    title: 'Energetic Demo',
    artist: 'Demo Artist',
    url: 'https://audio-samples.github.io/samples/mp3/electronic-lead-1.mp3',
    duration: 30,
    genre: 'Electronic'
  }
];

/**
 * Simplified AudioVisualDemo - Demonstrates basic audio-visual synchronization
 */
const AudioVisualDemo: React.FC = () => {
  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Get selected sound
  const selectedSound = DEMO_SOUNDS[0];
  
  // Handle time update
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // Handle play/pause
  const handlePlayPauseChange = (playing: boolean) => {
    setIsPlaying(playing);
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Audio-Visual Synchronization Demo</h2>
        
        <div className="rounded-md overflow-hidden h-64 bg-gray-50">
          <AudioVisualSynchronizer
            sound={selectedSound}
            showControls={true}
            onTimeUpdate={handleTimeUpdate}
            onPlayPauseChange={handlePlayPauseChange}
          >
            <div className="h-full w-full flex items-center justify-center">
              <p className="text-2xl font-bold">{selectedSound.title}</p>
            </div>
          </AudioVisualSynchronizer>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualDemo; 