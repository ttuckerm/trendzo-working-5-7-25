'use client';

import React, { useState, useEffect, useRef } from 'react';

// Type definitions to avoid errors
interface Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

declare global {
  interface Window {
    __PERF_METRICS__?: Record<string, number[]>;
  }
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  type: 'render' | 'animation' | 'network' | 'memory' | 'other';
}

type MetricCollectionMode = 'auto' | 'manual';
type ViewMode = 'chart' | 'table';

interface PerformanceHistoryData {
  [key: string]: {
    values: number[];
    timestamps: number[];
    type: string;
    unit: string;
    min: number;
    max: number;
    avg: number;
  };
}

interface PerformanceMonitorProps {
  /**
   * Whether to show the performance monitor
   */
  visible?: boolean;
  
  /**
   * Position of the monitor
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  
  /**
   * Whether to start minimized
   */
  startMinimized?: boolean;
  
  /**
   * Whether to collect metrics automatically
   */
  autoCollect?: boolean;
  
  /**
   * Collection interval in milliseconds
   */
  collectionInterval?: number;
  
  /**
   * Maximum number of data points to store per metric
   */
  maxDataPoints?: number;
  
  /**
   * Whether to log metrics to console
   */
  logToConsole?: boolean;
  
  /**
   * Custom metrics to track in addition to standard ones
   */
  customMetrics?: string[];
}

/**
 * Metrics Monitor Component
 * 
 * A development tool for monitoring performance metrics in real-time.
 * Displays memory usage, render times, fps, and other performance data.
 * 
 * NOTE: This component should only be used in development builds.
 */
export const MetricsMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  startMinimized = true,
  autoCollect = true,
  collectionInterval = 1000,
  maxDataPoints = 100,
  logToConsole = false,
  customMetrics = []
}) => {
  // UI State
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const [activeTab, setActiveTab] = useState<'memory' | 'render' | 'network' | 'custom'>('memory');
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [isPaused, setIsPaused] = useState(false);
  const [collectionMode, setCollectionMode] = useState<MetricCollectionMode>(autoCollect ? 'auto' : 'manual');
  
  // Metrics data
  const [metricsHistory, setMetricsHistory] = useState<PerformanceHistoryData>({});
  const [lastSnapshot, setLastSnapshot] = useState<PerformanceMetric[]>([]);
  const collectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle positioning styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };
  
  // Start/stop collection based on isPaused state
  useEffect(() => {
    if (isPaused && collectionTimerRef.current) {
      clearInterval(collectionTimerRef.current);
      collectionTimerRef.current = null;
    } else if (!isPaused && !collectionTimerRef.current && collectionMode === 'auto') {
      startCollection();
    }
    
    return () => {
      if (collectionTimerRef.current) {
        clearInterval(collectionTimerRef.current);
      }
    };
  }, [isPaused, collectionMode]);
  
  // Initialize auto collection
  useEffect(() => {
    if (autoCollect && !isPaused && !collectionTimerRef.current) {
      startCollection();
    }
    
    return () => {
      if (collectionTimerRef.current) {
        clearInterval(collectionTimerRef.current);
      }
    };
  }, []);
  
  // Collect metrics function
  const collectMetrics = () => {
    const metrics: PerformanceMetric[] = [];
    const now = Date.now();
    
    // Memory metrics
    if ((window as any).performance?.memory) {
      const memory = (window as any).performance.memory;
      
      metrics.push({
        name: 'Used JS Heap',
        value: Math.round(memory.usedJSHeapSize / (1024 * 1024) * 100) / 100,
        unit: 'MB',
        timestamp: now,
        type: 'memory'
      });
      
      metrics.push({
        name: 'Total JS Heap',
        value: Math.round(memory.totalJSHeapSize / (1024 * 1024) * 100) / 100,
        unit: 'MB',
        timestamp: now,
        type: 'memory'
      });
      
      const heapPercentage = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 1000) / 10;
      metrics.push({
        name: 'Heap Usage',
        value: heapPercentage,
        unit: '%',
        timestamp: now,
        type: 'memory'
      });
    }
    
    // Render metrics
    if (window.__PERF_METRICS__) {
      for (const [name, values] of Object.entries(window.__PERF_METRICS__)) {
        if (values.length > 0) {
          // Only use the last 5 values to avoid outliers
          const recentValues = values.slice(-5);
          const avgValue = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
          
          metrics.push({
            name,
            value: Math.round(avgValue * 100) / 100,
            unit: 'ms',
            timestamp: now,
            type: 'render'
          });
        }
      }
    }
    
    // Network metrics
    if (window.performance) {
      const perfEntries = window.performance.getEntriesByType('resource');
      const recentEntries = perfEntries.filter(entry => 
        entry.startTime > performance.now() - 10000
      );
      
      if (recentEntries.length > 0) {
        const totalSize = recentEntries.reduce((sum, entry) => 
          sum + (entry as any).transferSize || 0, 0
        );
        
        const avgDuration = recentEntries.reduce((sum, entry) => 
          sum + entry.duration, 0
        ) / recentEntries.length;
        
        metrics.push({
          name: 'Network Requests',
          value: recentEntries.length,
          unit: 'req',
          timestamp: now,
          type: 'network'
        });
        
        metrics.push({
          name: 'Avg Request Duration',
          value: Math.round(avgDuration * 100) / 100,
          unit: 'ms',
          timestamp: now,
          type: 'network'
        });
        
        metrics.push({
          name: 'Total Transfer Size',
          value: Math.round(totalSize / 1024 * 100) / 100,
          unit: 'KB',
          timestamp: now,
          type: 'network'
        });
      }
    }
    
    // Custom metrics
    for (const metricName of customMetrics) {
      if (window.__PERF_METRICS__?.[metricName]) {
        const values = window.__PERF_METRICS__[metricName];
        if (values.length > 0) {
          const latestValue = values[values.length - 1];
          metrics.push({
            name: metricName,
            value: latestValue,
            unit: 'ms',
            timestamp: now,
            type: 'other'
          });
        }
      }
    }
    
    // Update last snapshot
    setLastSnapshot(metrics);
    
    // Update history
    setMetricsHistory(prevHistory => {
      const newHistory = { ...prevHistory };
      
      for (const metric of metrics) {
        if (!newHistory[metric.name]) {
          newHistory[metric.name] = {
            values: [],
            timestamps: [],
            type: metric.type,
            unit: metric.unit,
            min: metric.value,
            max: metric.value,
            avg: metric.value
          };
        }
        
        const metricHistory = newHistory[metric.name];
        
        // Add new value
        metricHistory.values.push(metric.value);
        metricHistory.timestamps.push(metric.timestamp);
        
        // Maintain max data points
        if (metricHistory.values.length > maxDataPoints) {
          metricHistory.values.shift();
          metricHistory.timestamps.shift();
        }
        
        // Update stats
        metricHistory.min = Math.min(metricHistory.min, metric.value);
        metricHistory.max = Math.max(metricHistory.max, metric.value);
        metricHistory.avg = metricHistory.values.reduce((sum, val) => sum + val, 0) / metricHistory.values.length;
      }
      
      return newHistory;
    });
    
    // Log to console if enabled
    if (logToConsole) {
      console.group('Performance Metrics');
      for (const metric of metrics) {
        console.log(`${metric.name}: ${metric.value}${metric.unit}`);
      }
      console.groupEnd();
    }
  };
  
  // Start collection timer
  const startCollection = () => {
    if (collectionTimerRef.current) {
      clearInterval(collectionTimerRef.current);
    }
    
    collectMetrics(); // Collect immediately
    
    // Then set up interval
    collectionTimerRef.current = setInterval(() => {
      if (!document.hidden) {
        collectMetrics();
      }
    }, collectionInterval);
  };
  
  // Manual collection trigger
  const manualCollect = () => {
    collectMetrics();
  };
  
  // Toggle collection mode
  const toggleCollectionMode = () => {
    const newMode = collectionMode === 'auto' ? 'manual' : 'auto';
    setCollectionMode(newMode);
    
    if (newMode === 'auto') {
      startCollection();
    } else if (collectionTimerRef.current) {
      clearInterval(collectionTimerRef.current);
      collectionTimerRef.current = null;
    }
  };
  
  // Clear collected data
  const clearData = () => {
    setMetricsHistory({});
    setLastSnapshot([]);
  };
  
  // Render mini chart for a metric
  const renderMetricChart = (metricName: string) => {
    const metric = metricsHistory[metricName];
    if (!metric || metric.values.length < 2) return null;
    
    const height = 40;
    const width = 120;
    const values = [...metric.values];
    const max = Math.max(...values) * 1.1; // Add 10% padding
    const min = Math.min(0, Math.min(...values));
    
    // Generate SVG path
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / (max - min)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    const lineColor = getMetricColor(metric.type);
    
    return (
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Baseline */}
          <line x1="0" y1={height} x2={width} y2={height} stroke="#ddd" strokeWidth="1" />
          
          {/* Data line */}
          <polyline
            points={points}
            fill="none"
            stroke={lineColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Gradient area under line */}
          <linearGradient id={`gradient-${metricName}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
          
          <polygon
            points={`0,${height} ${points} ${width},${height}`}
            fill={`url(#gradient-${metricName})`}
          />
        </svg>
        
        {/* Min/Max/Avg indicators */}
        <div className="absolute bottom-0 right-0 text-xs text-gray-400">
          {metric.values[metric.values.length - 1].toFixed(1)}{metric.unit}
        </div>
      </div>
    );
  };
  
  // Get appropriate color for a metric type
  const getMetricColor = (type: string) => {
    switch (type) {
      case 'memory':
        return '#8b5cf6'; // Purple
      case 'render':
        return '#3b82f6'; // Blue
      case 'network':
        return '#10b981'; // Green
      case 'animation':
        return '#f59e0b'; // Amber
      default:
        return '#6b7280'; // Gray
    }
  };
  
  // Filter metrics by active tab
  const filteredMetrics = Object.entries(metricsHistory).filter(([name, data]) => {
    if (activeTab === 'custom' && customMetrics.includes(name)) {
      return true;
    }
    return data.type === activeTab;
  });
  
  // Don't render if not visible or in production
  if (!visible || process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <div 
      className={`fixed z-50 ${getPositionStyles()} transition-all duration-200 ease-in-out ${
        isMinimized ? 'w-auto' : 'w-80 md:w-96'
      }`}
    >
      {/* Monitor header */}
      <div 
        className="bg-gray-800 text-white px-3 py-2 rounded-t flex justify-between items-center cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full mr-2 ${isPaused ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
          <span className="font-medium text-sm">Performance Monitor</span>
        </div>
        <div className="flex items-center space-x-1">
          {!isMinimized && (
            <>
              <button 
                className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600"
                onClick={(e) => {e.stopPropagation(); setIsPaused(!isPaused);}}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button 
                className="text-xs bg-gray-700 p-1 rounded hover:bg-gray-600"
                onClick={(e) => {e.stopPropagation(); clearData();}}
              >
                Clear
              </button>
            </>
          )}
          <span className="transform transition-transform duration-200">
            {isMinimized ? '▲' : '▼'}
          </span>
        </div>
      </div>
      
      {/* Monitor body */}
      {!isMinimized && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-b shadow-lg p-3">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
            <button 
              className={`mr-2 px-3 py-1 text-sm rounded-t -mb-px ${
                activeTab === 'memory' 
                  ? 'border-l border-t border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('memory')}
            >
              Memory
            </button>
            <button 
              className={`mr-2 px-3 py-1 text-sm rounded-t -mb-px ${
                activeTab === 'render' 
                  ? 'border-l border-t border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('render')}
            >
              Render
            </button>
            <button 
              className={`mr-2 px-3 py-1 text-sm rounded-t -mb-px ${
                activeTab === 'network' 
                  ? 'border-l border-t border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('network')}
            >
              Network
            </button>
            {customMetrics.length > 0 && (
              <button 
                className={`mr-2 px-3 py-1 text-sm rounded-t -mb-px ${
                  activeTab === 'custom' 
                    ? 'border-l border-t border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                Custom
              </button>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center">
              <button 
                className="text-xs bg-gray-100 dark:bg-gray-700 p-1 px-2 rounded mr-2 hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={toggleCollectionMode}
              >
                {collectionMode === 'auto' ? 'Auto' : 'Manual'}
              </button>
              
              {collectionMode === 'manual' && (
                <button 
                  className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 p-1 px-2 rounded mr-2 hover:bg-blue-200 dark:hover:bg-blue-800"
                  onClick={manualCollect}
                >
                  Collect Now
                </button>
              )}
            </div>
            
            <div className="flex items-center">
              <button 
                className={`text-xs p-1 px-2 rounded mr-1 ${
                  viewMode === 'chart'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setViewMode('chart')}
              >
                Chart
              </button>
              <button 
                className={`text-xs p-1 px-2 rounded ${
                  viewMode === 'table'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
            </div>
          </div>
          
          {/* Metrics display */}
          <div className="overflow-y-auto max-h-80">
            {viewMode === 'chart' ? (
              <div className="space-y-3">
                {filteredMetrics.length > 0 ? (
                  filteredMetrics.map(([name, data]) => (
                    <div key={name} className="border rounded p-2">
                      <div className="flex justify-between items-start mb-1">
                        <div className="text-sm font-medium">{name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{data.unit}</div>
                      </div>
                      
                      {renderMetricChart(name)}
                      
                      <div className="grid grid-cols-3 text-xs mt-1 text-gray-500 dark:text-gray-400">
                        <div>Min: {data.min.toFixed(1)}{data.unit}</div>
                        <div>Avg: {data.avg.toFixed(1)}{data.unit}</div>
                        <div>Max: {data.max.toFixed(1)}{data.unit}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    No {activeTab} metrics collected yet
                  </div>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">
                      Metric
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">
                      Last
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">
                      Min
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider py-2">
                      Max
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredMetrics.length > 0 ? (
                    filteredMetrics.map(([name, data]) => (
                      <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2 text-sm">{name}</td>
                        <td className="py-2 text-sm">
                          {data.values[data.values.length - 1].toFixed(1)}{data.unit}
                        </td>
                        <td className="py-2 text-sm">{data.min.toFixed(1)}{data.unit}</td>
                        <td className="py-2 text-sm">{data.max.toFixed(1)}{data.unit}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No {activeTab} metrics collected yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsMonitor; 