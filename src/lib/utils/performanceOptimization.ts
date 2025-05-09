// Performance Optimization Utilities
// This module provides tools for measuring, analyzing, and optimizing application performance

/**
 * Performance measurement wrapper that captures timing metrics for component or function execution
 * 
 * @param name - Identifier for the performance measurement
 * @param callback - Function to measure
 * @returns The result of the callback function
 */
export function withPerformanceTracking<T>(name: string, callback: () => T): T {
  // Only measure in development or when performance monitoring is enabled
  if (process.env.NODE_ENV !== 'development' && !window.__PERF_MONITORING_ENABLED__) {
    return callback();
  }
  
  const startTime = performance.now();
  
  try {
    return callback();
  } finally {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log performance metrics
    console.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    // Store metrics for analysis
    if (typeof window !== 'undefined') {
      if (!window.__PERF_METRICS__) {
        window.__PERF_METRICS__ = {};
      }
      
      if (!window.__PERF_METRICS__[name]) {
        window.__PERF_METRICS__[name] = [];
      }
      
      window.__PERF_METRICS__[name].push(duration);
    }
  }
}

/**
 * Creates a debounced version of a function that delays invocation
 * until after the specified wait time has elapsed since the last call
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function (...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled version of a function that limits invocations
 * to at most once per every wait milliseconds
 * 
 * @param func - Function to throttle
 * @param wait - Minimum time between invocations in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;
  
  return function (...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

/**
 * Memoizes a function to cache computed results based on input arguments
 * 
 * @param func - Function to memoize
 * @param hashFunction - Optional function to generate a cache key from arguments
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  hashFunction?: (...args: Parameters<T>) => string
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function (...args: Parameters<T>): ReturnType<T> {
    const key = hashFunction 
      ? hashFunction(...args) 
      : JSON.stringify(args);
      
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  };
}

/**
 * RAF-based animation frame scheduler that optimizes multiple animations
 */
export class AnimationScheduler {
  private callbacks: Map<string, (time: number) => void> = new Map();
  private isRunning = false;
  private lastTime = 0;
  
  /**
   * Add an animation callback to be scheduled
   * 
   * @param id - Unique identifier for the animation
   * @param callback - Animation callback function
   */
  public schedule(id: string, callback: (time: number) => void): void {
    this.callbacks.set(id, callback);
    
    if (!this.isRunning) {
      this.isRunning = true;
      this.tick();
    }
  }
  
  /**
   * Remove an animation callback
   * 
   * @param id - Identifier of the animation to remove
   */
  public unschedule(id: string): void {
    this.callbacks.delete(id);
    
    if (this.callbacks.size === 0) {
      this.isRunning = false;
    }
  }
  
  /**
   * Main animation loop
   */
  private tick = (time = 0): void => {
    if (!this.isRunning) return;
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    
    // Execute all animation callbacks
    for (const callback of this.callbacks.values()) {
      callback(deltaTime);
    }
    
    // Continue the loop
    requestAnimationFrame(this.tick);
  };
}

// Global instance of the animation scheduler
export const animationScheduler = new AnimationScheduler();

// Add TypeScript global declarations
declare global {
  interface Window {
    __PERF_METRICS__?: Record<string, number[]>;
    __PERF_MONITORING_ENABLED__?: boolean;
  }
} 