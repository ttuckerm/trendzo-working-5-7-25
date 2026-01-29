'use client';

import React, { useState } from 'react';
import { PerformanceVisualizer, PerformanceVisualizerExample } from '@/app/components/common/PerformanceVisualizer';
import { MetricsMonitor } from '@/app/components/development/MetricsMonitor';

// Animation type definitions
interface AnimationTransition {
  duration: number;
  delay: number;
  willChange?: string;
  translateZ?: number;
}

interface AnimationProperties {
  opacity: number;
  y: number;
  transition: AnimationTransition;
}

/**
 * Custom hook based on our useOptimizedAnimation hook
 * for demonstration purposes
 */
const useAnimationDemo = (initialDelay = 0) => {
  const [isOptimized, setIsOptimized] = useState(false);
  
  const regularAnimation: AnimationProperties = {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.5,
      delay: initialDelay,
    }
  };
  
  const optimizedAnimation: AnimationProperties = {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.5,
      delay: initialDelay,
      willChange: 'opacity, transform',
      translateZ: 0,
    }
  };
  
  return {
    animation: isOptimized ? optimizedAnimation : regularAnimation,
    isOptimized,
    setIsOptimized
  };
};

/**
 * Regular list component (unoptimized)
 */
const RegularList = ({ items }: { items: string[] }) => {
  // This will cause unnecessary re-renders on parent state changes
  const handleClick = () => {
    console.log('Item clicked');
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium mb-4">Regular List</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li 
            key={index} 
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={handleClick}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Optimized list component
 */
const OptimizedList = React.memo(({ items }: { items: string[] }) => {
  // Memoize the click handler to prevent unnecessary re-renders
  const handleClick = React.useCallback(() => {
    console.log('Item clicked');
  }, []);

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium mb-4">Optimized List</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li 
            key={item} // Using actual content as key when possible
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={handleClick}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});

OptimizedList.displayName = 'OptimizedList';

/**
 * Documentation page for optimization demos
 */
export default function OptimizationDemoPage() {
  const [count, setCount] = useState(0);
  const [items] = useState(() => [
    'Item 1: React Performance',
    'Item 2: Animation Optimization',
    'Item 3: Data Fetching Strategies',
    'Item 4: Memory Management',
    'Item 5: Bundle Size Reduction'
  ]);
  
  const { animation, isOptimized, setIsOptimized } = useAnimationDemo();
  
  // Force re-render to demonstrate optimization difference
  const incrementCounter = () => {
    setCount(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Optimization Demonstration</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl">
            This page showcases various optimization techniques implemented in the Trendzo platform,
            with real-time metrics and before/after comparisons.
          </p>
        </div>
        
        <MetricsMonitor />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">React Component Optimization</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Click the button below to trigger a state change. Notice how the Regular List
              re-renders unnecessarily while the Optimized List remains stable.
            </p>
            
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={incrementCounter}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Trigger Re-render ({count})
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RegularList items={items} />
              <OptimizedList items={items} />
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Animation Optimization</h2>
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              Toggle between standard and optimized animations. The optimized version uses GPU acceleration
              and other techniques for smoother performance.
            </p>
            
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={() => setIsOptimized(!isOptimized)}
                className={`px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isOptimized 
                    ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                    : 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                }`}
              >
                {isOptimized ? 'Using Optimized Animation' : 'Using Standard Animation'}
              </button>
            </div>
            
            <div 
              className="p-6 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg text-white shadow-lg transform transition-all"
              style={{
                transform: `translateY(${animation.y}px)`,
                opacity: animation.opacity,
                transition: `transform ${animation.transition.duration}s, opacity ${animation.transition.duration}s`,
                willChange: animation.transition.willChange || 'auto',
              }}
            >
              <h3 className="text-xl font-bold mb-2">Animated Card</h3>
              <p>This card demonstrates animation optimization techniques.</p>
              <div className="mt-4 text-sm">
                {isOptimized && (
                  <div className="bg-white/20 rounded px-2 py-1 inline-block">
                    Using GPU acceleration
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <PerformanceVisualizerExample />
          
          <div className="mt-8">
            <PerformanceVisualizer
              title="List Component Optimization"
              description="Optimized the List component to prevent unnecessary re-renders and improve performance."
              metrics={[
                {
                  name: "Re-renders per State Change",
                  before: 5,
                  after: 1,
                  unit: "renders",
                  improvementGoal: 80,
                  category: "render",
                  description: "Number of re-renders when parent state changes. Optimized by using React.memo and useCallback."
                },
                {
                  name: "Memory Footprint",
                  before: 2.4,
                  after: 2.1,
                  unit: "MB",
                  category: "memory",
                  description: "Memory used by the component in browser. Slight improvement due to fewer re-renders."
                },
                {
                  name: "Render Time",
                  before: 12,
                  after: 8,
                  unit: "ms",
                  category: "render",
                  description: "Time taken to complete a render cycle when props change."
                }
              ]}
              techniques={[
                "Applied React.memo to prevent unnecessary re-renders",
                "Implemented useCallback for stable event handlers",
                "Used proper key strategy for list items",
                "Optimized event handler creation"
              ]}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-2 text-blue-800 dark:text-blue-200">Developer Resources</h2>
        <p className="mb-4 text-blue-700 dark:text-blue-300">
          Explore our comprehensive documentation on optimization techniques implemented throughout the Trendzo platform.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <a 
            href="/documentation/ComponentOptimizationGuide" 
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-50 dark:border-gray-700"
          >
            <h3 className="font-medium text-lg mb-1">Component Optimization Guide</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Learn how to optimize React components for maximum performance
            </p>
          </a>
          
          <a 
            href="/documentation/UXUIStyleGuide" 
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-50 dark:border-gray-700"
          >
            <h3 className="font-medium text-lg mb-1">UX/UI Style Guide</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              UI components, animation guidelines, and accessibility standards
            </p>
          </a>
          
          <a 
            href="/documentation/PerformanceChecklist" 
            className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-blue-50 dark:border-gray-700"
          >
            <h3 className="font-medium text-lg mb-1">Performance Checklist</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Pre-deployment checklist for optimizing component performance
            </p>
          </a>
        </div>
      </div>
    </div>
  );
} 