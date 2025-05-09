'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Custom arrow icon component instead of using heroicons
const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 w-4 h-4">
    <path d="M5 12h14"></path>
    <path d="M12 5l7 7-7 7"></path>
  </svg>
);

/**
 * Documentation resource card component
 */
function ResourceCard({ 
  title, 
  description, 
  href, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  description: string; 
  href: string; 
  icon: React.ReactNode; 
  color?: 'blue' | 'purple' | 'green' | 'amber' | 'rose'; 
}) {
  // Handle direct navigation
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Documentation] Direct navigation to:', href);
    window.location.href = href;
  };
  
  const colorClasses = {
    blue: {
      background: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-100 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-800/30'
    },
    purple: {
      background: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-100 dark:border-purple-800',
      text: 'text-purple-800 dark:text-purple-300',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-800/30'
    },
    green: {
      background: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-100 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      hover: 'hover:bg-green-100 dark:hover:bg-green-800/30'
    },
    amber: {
      background: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-100 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-300',
      hover: 'hover:bg-amber-100 dark:hover:bg-amber-800/30'
    },
    rose: {
      background: 'bg-rose-50 dark:bg-rose-900/20',
      border: 'border-rose-100 dark:border-rose-800',
      text: 'text-rose-800 dark:text-rose-300',
      hover: 'hover:bg-rose-100 dark:hover:bg-rose-800/30'
    }
  };

  return (
    <a href={href} onClick={handleClick}>
      <div className={`p-6 rounded-lg border ${colorClasses[color].background} ${colorClasses[color].border} transition-colors ${colorClasses[color].hover}`}>
        <div className="flex items-start">
          <div className={`mr-4 rounded-full p-3 ${colorClasses[color].background}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-2 ${colorClasses[color].text}`}>{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-3">{description}</p>
            <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
              View Documentation
              <ArrowRightIcon />
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function DocumentationIndexPage() {
  const router = useRouter();
  
  // Function for reliable navigation
  const navigateTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('[Documentation Index] Direct navigation to:', path);
    window.location.href = path;
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Trendzo Performance Documentation</h1>
      
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
        Comprehensive guides and tools for achieving the "unicorn" UX/UI experience through performance optimization.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <ResourceCard
          title="Component Optimization Guide"
          description="Practical strategies for optimizing React components with code examples and step-by-step instructions."
          href="/documentation/ComponentOptimizationGuide"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>}
          color="blue"
        />
        
        <ResourceCard
          title="UX/UI Style Guide"
          description="Standards for animations, interactions, and visual feedback to create a cohesive and performant user experience."
          href="/documentation/UXUIStyleGuide"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>}
          color="purple"
        />
        
        <ResourceCard
          title="Performance Checklist"
          description="Pre-deployment verification for optimal performance with detailed checklists for various component types."
          href="/documentation/PerformanceChecklist"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>}
          color="green"
        />
        
        <ResourceCard
          title="Optimization Demo"
          description="Interactive examples of optimization techniques with before/after comparisons and real-time metrics."
          href="/documentation/optimization-demo"
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>}
          color="amber"
        />
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Optimization Utilities & Components</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Performance Tracking</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Measure and analyze component render times and function execution.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            withPerformanceTracking(name, callback)
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/lib/utils/performanceOptimization.ts
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Animation Optimization</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Create smooth, accessible animations with GPU acceleration.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            useOptimizedAnimation(options)
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/lib/hooks/useOptimizedAnimation.ts
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Data Fetching</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Optimize data loading with caching and prefetching strategies.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            useOptimizedDataFetching(url, options)
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/lib/hooks/useOptimizedDataFetching.ts
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Skeleton Loaders</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Progressive loading states with prioritization.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            OptimizedSkeletonLoader
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/app/components/common/OptimizedSkeletonLoader.tsx
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Focus Management</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Accessibility-focused utilities for managing keyboard focus.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            useFocusManagement(options)
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/lib/hooks/useFocusManagement.ts
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-medium mb-2">Metrics Visualization</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
            Visualize performance improvements with before/after comparisons.
          </p>
          <code className="block bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs mb-2">
            PerformanceVisualizer
          </code>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Location: src/app/components/common/PerformanceVisualizer.tsx
          </p>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-3">Getting Started</h2>
        <p className="mb-4">
          To begin optimizing your components, we recommend following these steps:
        </p>
        
        <ol className="list-decimal pl-5 mb-4 space-y-2">
          <li>Review the <strong>Component Optimization Guide</strong> to understand the principles</li>
          <li>Use <strong>MetricsMonitor</strong> to identify performance bottlenecks</li>
          <li>Apply appropriate optimization techniques from the utilities</li>
          <li>Validate improvements with <strong>PerformanceVisualizer</strong></li>
          <li>Follow the <strong>Performance Checklist</strong> before deployment</li>
        </ol>
        
        <div className="mt-4">
          <a 
            href="/documentation/optimization-demo"
            onClick={navigateTo('/documentation/optimization-demo')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Visit the Optimization Demo
            <ArrowRightIcon />
          </a>
        </div>
      </div>
    </div>
  );
} 