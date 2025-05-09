'use client';

import React from 'react';
import Link from 'next/link';

export default function ComponentOptimizationGuide() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Optimization Guide</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Version 1.0.0 - Last updated: July 15, 2023
        </p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p>
            This guide provides practical strategies for optimizing React components in the Trendzo platform. 
            By following these optimization techniques, you can significantly improve application performance, 
            reduce unnecessary renders, and create a more responsive user experience.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Performance Analysis</h2>
          <p>
            Before optimizing, it's essential to measure and identify performance bottlenecks:
          </p>

          <h3 className="text-xl font-medium mt-6 mb-3">Using Performance Tracking</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { withPerformanceTracking } from '@/lib/utils/performanceOptimization';

// Track component render time
function MyComponent() {
  return withPerformanceTracking('MyComponent', () => {
    // Component rendering logic
    return <div>Component content</div>;
  });
}`}
            </pre>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-3">Using the Metrics Monitor</h3>
          <p>
            Add the MetricsMonitor component to your development pages to visualize performance metrics in real-time:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { MetricsMonitor } from '@/app/components/development/MetricsMonitor';

function DevelopmentPage() {
  return (
    <div>
      <YourComponent />
      <MetricsMonitor position="bottom-right" />
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Render Optimization</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Preventing Unnecessary Renders</h3>
          <p>
            Use React.memo for functional components that render the same result given the same props:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`// Before optimization
function UserAvatar({ user }) {
  return <img src={user.avatarUrl} alt={user.name} />;
}

// After optimization
const UserAvatar = React.memo(function UserAvatar({ user }) {
  return <img src={user.avatarUrl} alt={user.name} />;
});`}
            </pre>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-3">Optimizing Event Handlers</h3>
          <p>
            Use useCallback to prevent unnecessary re-renders when passing functions to child components:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`// Before optimization
function ParentComponent() {
  const handleClick = () => {
    console.log('Button clicked');
  };
  
  return <ChildComponent onClick={handleClick} />;
}

// After optimization
function ParentComponent() {
  const handleClick = useCallback(() => {
    console.log('Button clicked');
  }, []);
  
  return <ChildComponent onClick={handleClick} />;
}`}
            </pre>
          </div>

          <h3 className="text-xl font-medium mt-6 mb-3">Memoizing Expensive Calculations</h3>
          <p>
            Use useMemo to cache the results of expensive calculations:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`// Before optimization
function FilteredList({ items, filterTerm }) {
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(filterTerm.toLowerCase())
  );
  
  return (
    <ul>
      {filteredItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}

// After optimization
function FilteredList({ items, filterTerm }) {
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(filterTerm.toLowerCase())
    );
  }, [items, filterTerm]);
  
  return (
    <ul>
      {filteredItems.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}`}
            </pre>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Animation Performance</h2>
          
          <p>
            Use the useOptimizedAnimation hook for performant animations:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { useOptimizedAnimation } from '@/lib/hooks/useOptimizedAnimation';
import { motion } from 'framer-motion';

function AnimatedComponent() {
  const { motionProps, ref } = useOptimizedAnimation({
    type: 'fade',
    duration: 300,
    delay: 0.2,
    useGPU: true, // Enable GPU acceleration
    animateOnIntersection: true // Only animate when visible
  });
  
  return (
    <motion.div 
      ref={ref}
      {...motionProps}
      className="p-4 bg-blue-500 text-white rounded"
    >
      Animated content
    </motion.div>
  );
}`}
            </pre>
          </div>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Animation Best Practices</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Animate only transform and opacity properties when possible</li>
            <li>Use will-change property sparingly and only when needed</li>
            <li>Implement reduced motion preferences for accessibility</li>
            <li>Consider using CSS transitions for simple animations</li>
            <li>Throttle animations on scroll events</li>
          </ul>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Fetching Optimization</h2>
          
          <p>
            Use the useOptimizedDataFetching hook for efficient data loading:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { useOptimizedDataFetching } from '@/lib/hooks/useOptimizedDataFetching';

function DataComponent() {
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useOptimizedDataFetching('/api/data', {
    cacheKey: 'my-data',
    cacheTtl: 60000, // 1 minute cache
    showSkeletonOnInitialLoad: true,
    retryCount: 3
  });
  
  if (isLoading) return <OptimizedSkeletonLoader />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      <DataDisplay data={data} />
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}`}
            </pre>
          </div>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Infinite Scrolling</h3>
          <p>
            For lists with pagination or infinite scroll:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { useOptimizedInfiniteScroll } from '@/lib/hooks/useOptimizedDataFetching';

function InfiniteList() {
  const { 
    data, 
    isLoading, 
    loadMore, 
    hasNextPage 
  } = useOptimizedInfiniteScroll(
    page => \`/api/items?page=\${page}\`,
    { 
      initialPage: 1,
      prefetchNextPage: true 
    }
  );
  
  return (
    <div>
      {data.map(item => <ListItem key={item.id} item={item} />)}
      
      {isLoading && <OptimizedSkeletonLoader />}
      
      {hasNextPage && (
        <button onClick={loadMore} disabled={isLoading}>
          Load More
        </button>
      )}
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Progressive Loading Strategies</h2>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Prioritized Content Loading</h3>
          <p>
            Use OptimizedSkeletonLoader with priority levels:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { OptimizedSkeletonLoader } from '@/app/components/common/OptimizedSkeletonLoader';

function Dashboard() {
  // ... data fetching logic
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Critical content loads first */}
      {isLoading ? (
        <OptimizedSkeletonLoader priority="high" />
      ) : (
        <CriticalContent data={data.critical} />
      )}
      
      {/* Important but not critical content */}
      {isLoading ? (
        <OptimizedSkeletonLoader 
          priority="medium" 
          progressiveReveal={true}
          progressiveDelay={300}
        />
      ) : (
        <ImportantContent data={data.important} />
      )}
      
      {/* Secondary content loads last */}
      {isLoading ? (
        <OptimizedSkeletonLoader 
          priority="low" 
          progressiveReveal={true}
          progressiveDelay={600}
        />
      ) : (
        <SecondaryContent data={data.secondary} />
      )}
    </div>
  );
}`}
            </pre>
          </div>
          
          <h3 className="text-xl font-medium mt-6 mb-3">Lazy Loading Components</h3>
          <p>
            Use dynamic imports for code splitting and lazy loading:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(
  () => import('@/components/HeavyChart'),
  { 
    loading: () => <OptimizedSkeletonLoader variant="card" />,
    ssr: false // Disable server-side rendering if not needed
  }
);

function Dashboard() {
  return (
    <div>
      <SimpleContent />
      
      {/* HeavyChart will only be loaded when needed */}
      <HeavyChart data={chartData} />
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Accessibility Optimization</h2>
          
          <p>
            Use the useFocusManagement hook for improved keyboard navigation:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { useFocusManagement } from '@/lib/hooks/useFocusManagement';

function Modal({ isOpen, onClose }) {
  const { focusRef } = useFocusManagement({
    autoFocus: true,
    trapFocus: true,
    restoreOnUnmount: true
  });
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-backdrop">
      <div 
        ref={focusRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
      >
        <h2>Modal Title</h2>
        <button onClick={onClose}>Close</button>
        {/* Modal content */}
      </div>
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Measuring Improvements</h2>
          
          <p>
            Use the PerformanceVisualizer to demonstrate optimizations:
          </p>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mb-4">
            <pre className="text-sm">
              {`import { PerformanceVisualizer } from '@/app/components/common/PerformanceVisualizer';

// In your development or demo page
<PerformanceVisualizer
  title="List Component Optimization"
  description="Optimized rendering of large lists"
  metrics={[
    {
      name: "Render Time",
      before: 120,
      after: 45,
      unit: "ms",
      improvementGoal: 50,
      category: "render"
    },
    {
      name: "Memory Usage",
      before: 4.2,
      after: 2.8,
      unit: "MB",
      category: "memory"
    }
  ]}
  beforeComponent={<UnoptimizedList items={items} />}
  afterComponent={<OptimizedList items={items} />}
  techniques={[
    "React.memo for component memoization",
    "Virtualized list rendering",
    "Optimized event handlers with useCallback"
  ]}
/>`}
            </pre>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-3 text-blue-800 dark:text-blue-200">Key Optimization Principles</h2>
          <ul className="list-disc pl-5 space-y-2 text-blue-700 dark:text-blue-300">
            <li>Always measure before and after optimization to quantify improvements</li>
            <li>Focus on optimizing frequently rendered components first</li>
            <li>Consider both initial load performance and interaction responsiveness</li>
            <li>Balance performance with code readability and maintainability</li>
            <li>Prioritize user experience over technical optimizations</li>
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4">Next Steps</h2>
          <p className="mb-4">
            Now that you understand the component optimization principles, check out these related resources:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/documentation/UXUIStyleGuide" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">UX/UI Style Guide</h3>
              <p className="text-sm">Standards for animations and interactions</p>
            </Link>
            
            <Link href="/documentation/PerformanceChecklist" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">Performance Checklist</h3>
              <p className="text-sm">Pre-deployment verification for optimal performance</p>
            </Link>
            
            <Link href="/documentation/optimization-demo" className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
              <h3 className="text-lg font-medium mb-1">Optimization Demo</h3>
              <p className="text-sm">Interactive examples of optimization techniques</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 