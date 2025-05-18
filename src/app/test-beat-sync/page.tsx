"use client";

import React from 'react';
import BeatSyncTester from '@/components/editor/BeatSyncTester';

export default function TestBeatSyncPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Beat Sync Testing Page</h1>
      <p className="text-gray-600 mb-8">
        This page allows testing the Beat Sync Controller functionality in isolation.
      </p>
      
      <BeatSyncTester />
    </div>
  );
} 