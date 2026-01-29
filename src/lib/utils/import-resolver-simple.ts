"use client";

/**
 * Simplified Component Import Resolver
 * 
 * This is a simplified version that avoids problematic require() calls
 * and React.createElement overrides that were causing bus errors.
 */

import React from 'react';
import * as CompatibilityComponents from '@/components/ui/ui-compatibility';

/**
 * Simple component resolver that just uses compatibility components
 */
export function resolveComponents(components: Record<string, any>): Record<string, any> {
  const resolvedComponents: Record<string, any> = {};
  
  for (const [name, component] of Object.entries(components)) {
    if (!component || typeof component !== 'function') {
      console.warn(`[ImportResolver] Component '${name}' is undefined, using compatibility version`);
      resolvedComponents[name] = (CompatibilityComponents as any)[name] || createFallbackComponent(name);
    } else {
      resolvedComponents[name] = component;
    }
  }
  
  return resolvedComponents;
}

/**
 * Create fallback component with error state
 */
function createFallbackComponent(name: string) {
  return function FallbackComponent(props: any) {
    return React.createElement(
      'div',
      {
        style: {
          padding: '0.5rem',
          border: '1px dashed #f87171',
          borderRadius: '0.25rem',
          color: '#b91c1c',
          fontSize: '0.75rem',
          margin: '0.25rem 0',
          display: 'inline-block'
        },
        ...props,
      },
      `[${name}]`
    );
  };
}

/**
 * Disabled initialization function - no-op to prevent errors
 */
export function initializeComponentResolution() {
  console.log('[ImportResolver] Simple resolver - component resolution disabled');
  return () => {};
}

/**
 * Simple logging function
 */
export function logComponentResolution(
  componentName: string, 
  status: 'success' | 'fallback' | 'error' | boolean,
  details?: any
) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ComponentResolver] ${componentName}: ${status}`);
  }
}