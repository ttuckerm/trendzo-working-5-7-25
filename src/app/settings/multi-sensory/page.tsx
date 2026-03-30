"use client";

import React from 'react';
import { Music, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import MultiSensoryPreferenceManager from '@/components/audiovisual/MultiSensoryPreferenceManager';
import { AudioVisualProvider } from '@/lib/contexts/audiovisual/AudioVisualContext';

export default function MultiSensoryPreferencesPage() {
  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="mb-8">
        <Link href="/settings" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Settings
        </Link>
      
        <div className="flex items-center gap-3">
          <Music className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Multi-Sensory Preferences</h1>
        </div>
      </div>
      
      <AudioVisualProvider>
        <MultiSensoryPreferenceManager />
      </AudioVisualProvider>
    </div>
  );
} 