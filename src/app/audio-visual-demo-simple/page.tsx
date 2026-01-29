"use client";

import React from 'react';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';

export default function AudioVisualDemoSimplePage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Simple Audio-Visual Demo</h1>
      
      <AudioVisualProvider>
        <div className="p-8 border rounded-lg bg-gray-50">
          <p className="text-lg">This is a simplified test to verify the audio-visual components are loading correctly.</p>
        </div>
      </AudioVisualProvider>
    </div>
  );
} 