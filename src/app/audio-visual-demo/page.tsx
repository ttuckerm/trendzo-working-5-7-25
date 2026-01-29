"use client";

import React from 'react';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';
import AudioVisualSynchronizer from '@/components/audiovisual/AudioVisualSynchronizer';

const simpleDemoSound = {
  id: 'demo-sound',
  title: 'Demo Sound',
  artist: 'Test Artist',
  url: 'https://audio-samples.github.io/samples/mp3/brasstracks-golden-ticket.mp3',
  duration: 30,
  genre: 'Electronic'
};

export default function AudioVisualDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Audio Demo</h1>
      <p className="mb-6">A simple demo of the audio player component.</p>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden h-64">
        <AudioVisualProvider>
          <AudioVisualSynchronizer sound={simpleDemoSound} showControls={true}>
            <div className="h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500">
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                {simpleDemoSound.title}
              </h2>
            </div>
          </AudioVisualSynchronizer>
        </AudioVisualProvider>
      </div>
    </div>
  );
} 