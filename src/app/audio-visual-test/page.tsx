"use client";

import React, { useState } from 'react';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';
import AudioVisualSynchronizer from '@/components/audiovisual/AudioVisualSynchronizer';
import WaveformVisualizer from '@/components/audiovisual/WaveformVisualizer';
import AudioResponsiveVisuals from '@/components/audiovisual/AudioResponsiveVisuals';

export default function AudioVisualTestPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Simple test sound
  const testSound = {
    id: 'test-sound',
    title: 'Test Sound',
    artist: 'Test Artist',
    url: 'https://audio-samples.github.io/samples/mp3/electronic-lead-1.mp3',
    duration: 30
  };
  
  // Handle play/pause change
  const handlePlayPauseChange = (playing: boolean) => {
    console.log('Play/pause changed:', playing);
    setIsPlaying(playing);
  };
  
  // Handle time update
  const handleTimeUpdate = (time: number) => {
    console.log('Time updated:', time);
    setCurrentTime(time);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Audio-Visual Components Test</h1>
      
      <AudioVisualProvider>
        <div className="space-y-8">
          {/* Test AudioVisualSynchronizer */}
          <div>
            <h2 className="text-xl font-semibold mb-2">AudioVisualSynchronizer Test</h2>
            <div className="p-4 border rounded-md">
              <AudioVisualSynchronizer
                sound={testSound}
                showControls={true}
                onPlayPauseChange={handlePlayPauseChange}
                onTimeUpdate={handleTimeUpdate}
              >
                <div className="h-32 flex items-center justify-center bg-slate-100">
                  <p>Simple AudioVisualSynchronizer Test</p>
                </div>
              </AudioVisualSynchronizer>
            </div>
          </div>
          
          {/* Test WaveformVisualizer */}
          <div>
            <h2 className="text-xl font-semibold mb-2">WaveformVisualizer Test</h2>
            <div className="p-4 border rounded-md">
              <WaveformVisualizer
                sound={testSound}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={testSound.duration}
                height={100}
              />
            </div>
          </div>
          
          {/* Test AudioResponsiveVisuals */}
          <div>
            <h2 className="text-xl font-semibold mb-2">AudioResponsiveVisuals Test</h2>
            <div className="p-4 border rounded-md">
              <AudioResponsiveVisuals
                sound={testSound}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={testSound.duration}
                visualMode="particles"
                intensity={5}
                className="h-64"
              >
                <div className="h-full w-full flex items-center justify-center text-white">
                  <p className="text-xl font-bold drop-shadow-md">
                    {testSound.title}
                  </p>
                </div>
              </AudioResponsiveVisuals>
            </div>
          </div>
        </div>
      </AudioVisualProvider>
    </div>
  );
} 