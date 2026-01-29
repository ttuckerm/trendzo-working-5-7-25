"use client";

import React from 'react';
import { PageTransition } from '@/lib/contexts/NavigationContext';

/**
 * Minimal test to verify PageTransition import
 */
export default function MinimalPageTransitionTest() {
  return (
    <div>
      <h1>Minimal PageTransition Test</h1>
      <PageTransition>
        <div>
          <p>This content should be wrapped in a PageTransition component.</p>
        </div>
      </PageTransition>
    </div>
  );
} 