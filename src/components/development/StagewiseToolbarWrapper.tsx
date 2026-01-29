'use client';

import { useEffect } from 'react';
import { initToolbar } from '@stagewise/toolbar';

export default function StagewiseToolbarWrapper() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      if (!(window as any).__stagewiseInitialized) {
        initToolbar({ plugins: [] });
        (window as any).__stagewiseInitialized = true;
      }
    }
  }, []);

  return null;
} 