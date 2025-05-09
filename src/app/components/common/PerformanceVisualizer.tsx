'use client';

import React, { useState } from 'react';

interface MetricComparison {
  name: string;
  before: number;
  after: number;
  unit: string;
  improvementGoal?: number;
  category: 'render' | 'animation' | 'memory' | 'network' | 'other';
  description?: string;
}

interface PerformanceVisualizerProps {
  /**
   * Title for the performance comparison
   */
  title: string;
  
  /**
   * Description text explaining the optimization
   */
  description?: string;
  
  /**
   * Array of metrics to compare
   */
  metrics: MetricComparison[];
  
  /**
   * Whether to show detailed explanations
   */
  showDetails?: boolean;
  
  /**
   * Component to display in before state
   */
  beforeComponent?: React.ReactNode;
  
  /**
   * Component to display in after state
   */
  afterComponent?: React.ReactNode;
  
  /**
   * Whether this is a critical optimization
   */
  isCritical?: boolean;
  
  /**
   * Optimization techniques applied
   */
  techniques?: string[];
}

/**
 * PerformanceVisualizer Component
 * 
 * A component for visualizing before and after performance metrics
 * for developer documentation and educational purposes.
 */
export const PerformanceVisualizer: React.FC<PerformanceVisualizerProps> = ({
  title,
  description,
  metrics,
  showDetails = false,
  beforeComponent,
  afterComponent,
  isCritical = false,
  techniques = []
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'components' | 'code'>('metrics');
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  
  // Calculate improvement percentage
  const calculateImprovement = (before: number, after: number): number => {
    // For metrics where lower is better (most performance metrics)
    if (before > after) {
      return Math.round(((before - after) / before) * 100);
    } 
    // For metrics where higher is better (e.g. FPS)
    else {
      return Math.round(((after - before) / before) * 100);
    }
  };
  
  // Determine if the improvement meets or exceeds the goal
  const meetsGoal = (metric: MetricComparison): boolean => {
    if (!metric.improvementGoal) return true;
    
    const improvement = calculateImprovement(metric.before, metric.after);
    return improvement >= metric.improvementGoal;
  };
  
  // Determine color based on improvement
  const getImprovementColor = (before: number, after: number, category: string): string => {
    const improvement = calculateImprovement(before, after);
    
    // For metrics where higher is better (e.g. FPS)
    const isHigherBetter = category === 'animation' && before < after;
    
    if (isHigherBetter || (!isHigherBetter && improvement > 50)) {
      return 'text-green-600 dark:text-green-400';
    } else if (improvement > 20) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (improvement > 0) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-red-600 dark:text-red-400';
    }
  };
  
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h3>
          {isCritical && (
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              Critical Path
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'metrics'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
          {(beforeComponent || afterComponent) && (
            <button
              className={`px-3 py-1 text-sm rounded ${
                activeTab === 'components'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('components')}
            >
              Compare
            </button>
          )}
          <button
            className={`px-3 py-1 text-sm rounded ${
              activeTab === 'code'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            onClick={() => setActiveTab('code')}
          >
            Techniques
          </button>
        </div>
      </div>
      
      {description && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
          {description}
        </div>
      )}
      
      <div className="p-4">
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">
                      Metric
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Before
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      After
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">
                      Improvement
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Details</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {metrics.map((metric) => (
                    <React.Fragment key={metric.name}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-gray-200 sm:pl-6">
                          {metric.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {metric.before} {metric.unit}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {metric.after} {metric.unit}
                        </td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm font-medium ${getImprovementColor(metric.before, metric.after, metric.category)}`}>
                          {calculateImprovement(metric.before, metric.after)}%
                          {metric.improvementGoal && (
                            <span className="ml-2 text-xs">
                              {meetsGoal(metric) ? '✓' : '⚠️'} Goal: {metric.improvementGoal}%
                            </span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {metric.description && (
                            <button
                              onClick={() => setExpandedMetric(expandedMetric === metric.name ? null : metric.name)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {expandedMetric === metric.name ? 'Hide' : 'Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedMetric === metric.name && metric.description && (
                        <tr className="bg-gray-50 dark:bg-gray-800">
                          <td colSpan={5} className="p-4 text-sm text-gray-600 dark:text-gray-300">
                            {metric.description}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-100 dark:border-green-900">
                <div className="text-sm text-green-800 dark:text-green-300 font-medium">Average Improvement</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {Math.round(
                    metrics.reduce((sum, metric) => sum + calculateImprovement(metric.before, metric.after), 0) / 
                    metrics.length
                  )}%
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                <div className="text-sm text-blue-800 dark:text-blue-300 font-medium">Largest Improvement</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.max(
                    ...metrics.map(metric => calculateImprovement(metric.before, metric.after))
                  )}%
                </div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-900">
                <div className="text-sm text-purple-800 dark:text-purple-300 font-medium">Goals Met</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.filter(m => m.improvementGoal && meetsGoal(m)).length} / 
                  {metrics.filter(m => m.improvementGoal).length}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'components' && (
          <div className="grid grid-cols-2 gap-8">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 border-b">
                Before Optimization
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 overflow-auto max-h-96">
                {beforeComponent || (
                  <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-600">
                    No before component provided
                  </div>
                )}
              </div>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 border-b">
                After Optimization
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 overflow-auto max-h-96">
                {afterComponent || (
                  <div className="flex items-center justify-center h-40 text-gray-400 dark:text-gray-600">
                    No after component provided
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'code' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-800 dark:text-gray-200">Optimization Techniques Applied</h4>
            
            {techniques.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                {techniques.map((technique, index) => (
                  <li key={index}>{technique}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No specific techniques documented.</p>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200">Related Documentation</h4>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <a 
                  href="/documentation/ComponentOptimizationGuide.mdx" 
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">Component Optimization Guide</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Learn best practices for component optimization</div>
                  </div>
                </a>
                
                <a 
                  href="/documentation/UXUIStyleGuide.mdx" 
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">UX/UI Style Guide</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Review our UI design and animation guidelines</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Usage example component
export const PerformanceVisualizerExample: React.FC = () => {
  return (
    <PerformanceVisualizer
      title="Image Gallery Optimization"
      description="Optimized the image gallery component to improve loading times and interaction responsiveness."
      isCritical={true}
      metrics={[
        {
          name: "Initial Render Time",
          before: 320,
          after: 145,
          unit: "ms",
          improvementGoal: 50,
          category: "render",
          description: "Measured using the Performance API and React Profiler. The improvement was achieved by implementing memoization and lazy loading."
        },
        {
          name: "Memory Usage",
          before: 24.5,
          after: 18.2,
          unit: "MB",
          category: "memory",
          description: "Reduced by implementing proper cleanup of unused resources and optimizing image loading."
        },
        {
          name: "Interaction Delay",
          before: 120,
          after: 35,
          unit: "ms",
          improvementGoal: 75,
          category: "animation",
          description: "Time between user click and visible feedback. Improved by debouncing events and optimizing state updates."
        },
        {
          name: "FPS during Animation",
          before: 42,
          after: 58,
          unit: "fps",
          improvementGoal: 20,
          category: "animation",
          description: "Measured during gallery transitions. Improved by using Framer Motion with GPU acceleration."
        }
      ]}
      techniques={[
        "Applied component memoization using React.memo",
        "Implemented lazy loading for off-screen images",
        "Added progressive loading with skeleton states",
        "Optimized animations with GPU acceleration",
        "Added image prefetching for anticipated user actions",
        "Reduced unnecessary re-renders with useCallback and useMemo"
      ]}
    />
  );
};

export default PerformanceVisualizer; 