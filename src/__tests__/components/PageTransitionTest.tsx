"use client";

import React from 'react';
import { PageTransition } from '@/lib/contexts/NavigationContext';

/**
 * Minimal test component to verify PageTransition import
 */
export default function PageTransitionTest() {
  return (
    <div className="test-container">
      <h1>PageTransition Import Test</h1>
      
      <PageTransition>
        <div className="content-area">
          <p>This tests if PageTransition component imports correctly from NavigationContext.</p>
        </div>
      </PageTransition>
    </div>
  );
} 