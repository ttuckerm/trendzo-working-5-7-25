'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { throttle } from '@/lib/utils/performanceOptimization';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  type: 'render' | 'animation' | 'network' | 'memory' | 'other';
}

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
 * PerformanceMonitor Component
 * 
 * A development-only component that displays real-time performance metrics.
 * This should NOT be included in production builds.
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  startMinimized = true,
  autoCollect = true,
  collectionInterval = 1000,
  maxDataPoints = 100,
  logToConsole = false,
  customMetrics = []
}) => {
  const [isMinimized, setIsMinimized] = useState(startMinimized);
  const [activeTab, setActiveTab] = useState<'metrics' | 'chart' | 'memory'>('metrics');
  const [isRecording, setIsRecording] = useState(autoCollect);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceHistoryData>({});
  const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetric[]>([]);
  const rafCallbackId = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const fpsUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Position styles based on the position prop
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
  
  // Collect current performance metrics
  const collectMetrics = useCallback(() => {
    if (!isRecording) return;
    
    const metrics: PerformanceMetric[] = [];
    const now = performance.now();
    
    // Collect FPS data
    if (lastFrameTime.current > 0) {
      const fps = Math.round(1000 / (now - lastFrameTime.current));
      metrics.push({
        name: 'FPS',
        value: fps > 60 ? 60 : fps,
        unit: 'fps',
        timestamp: now,
        type: 'animation'
      });
    }
    lastFrameTime.current = now;
    
    // Collect memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory) {
        metrics.push({
          name: 'Used JS Heap',
          value: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          unit: 'MB',
          timestamp: now,
          type: 'memory'
        });
        
        metrics.push({
          name: 'Total JS Heap',
          value: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
          unit: 'MB',
          timestamp: now,
          type: 'memory'
        });
      }
    }
    
    // Collect page performance metrics
    const perfEntries = performance.getEntriesByType('navigation');
    if (perfEntries.length > 0) {
      const navigation = perfEntries[0] as PerformanceNavigationTiming;
      
      metrics.push({
        name: 'Page Load',
        value: Math.round(navigation.loadEventEnd - navigation.startTime),
        unit: 'ms',
        timestamp: now,
        type: 'network'
      });
      
      metrics.push({
        name: 'DOM Interactive',
        value: Math.round(navigation.domInteractive - navigation.startTime),
        unit: 'ms',
        timestamp: now,
        type: 'render'
      });
    }
    
    // Collect custom metrics from window.__PERF_METRICS__ if available
    if (window.__PERF_METRICS__) {
      Object.entries(window.__PERF_METRICS__).forEach(([name, values]) => {
        if (values.length > 0) {
          const latestValue = values[values.length - 1];
          metrics.push({
            name,
            value: Math.round(latestValue * 100) / 100,
            unit: 'ms',
            timestamp: now,
            type: 'render'
          });
        }
      });
    }
    
    // Update current metrics
    setCurrentMetrics(metrics);
    
    // Update history for charting
    setPerformanceHistory(prevHistory => {
      const newHistory = { ...prevHistory };
      
      metrics.forEach(metric => {
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
        
        // Limit array size
        if (metricHistory.values.length > maxDataPoints) {
          metricHistory.values.shift();
          metricHistory.timestamps.shift();
        }
        
        // Update stats
        metricHistory.min = Math.min(...metricHistory.values);
        metricHistory.max = Math.max(...metricHistory.values);
        metricHistory.avg = metricHistory.values.reduce((sum, val) => sum + val, 0) / metricHistory.values.length;
      });
      
      return newHistory;
    });
    
    // Log to console if enabled
    if (logToConsole && frameCount.current % 60 === 0) {
      console.log('Performance Metrics:', metrics);
    }
    
    frameCount.current++;
    
    // Continue recording
    rafCallbackId.current = requestAnimationFrame(collectMetrics);
  }, [isRecording, maxDataPoints, logToConsole]);
  
  // Start collecting metrics
  const startRecording = useCallback(() => {
    if (isRecording) return;
    
    setIsRecording(true);
    lastFrameTime.current = performance.now();
    frameCount.current = 0;
    rafCallbackId.current = requestAnimationFrame(collectMetrics);
    
    // Set up FPS update interval (updates less frequently)
    fpsUpdateInterval.current = setInterval(() => {
      setCurrentMetrics(prevMetrics => {
        const nonFpsMetrics = prevMetrics.filter(m => m.name !== 'FPS');
        const fpsMetric = prevMetrics.find(m => m.name === 'FPS');
        
        return [
          ...(fpsMetric ? [fpsMetric] : []),
          ...nonFpsMetrics
        ];
      });
    }, 500);
  }, [isRecording, collectMetrics]);
  
  // Stop collecting metrics
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    
    if (rafCallbackId.current) {
      cancelAnimationFrame(rafCallbackId.current);
      rafCallbackId.current = null;
    }
    
    if (fpsUpdateInterval.current) {
      clearInterval(fpsUpdateInterval.current);
      fpsUpdateInterval.current = null;
    }
  }, []);
  
  // Reset all collected metrics
  const resetMetrics = useCallback(() => {
    setPerformanceHistory({});
    setCurrentMetrics([]);
    frameCount.current = 0;
  }, []);
  
  // Start/stop recording based on visibility
  useEffect(() => {
    if (visible && autoCollect) {
      startRecording();
    } else {
      stopRecording();
    }
    
    return () => {
      stopRecording();
    };
  }, [visible, autoCollect, startRecording, stopRecording]);
  
  // Collect non-frame metrics on an interval
  useEffect(() => {
    if (!isRecording) return;
    
    const throttledCollect = throttle(() => {
      // Collect memory and other non-frame-dependent metrics
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory) {
          setCurrentMetrics(prevMetrics => {
            const newMetrics = [...prevMetrics];
            const memoryMetricIndex = newMetrics.findIndex(m => m.name === 'Used JS Heap');
            
            if (memoryMetricIndex >= 0) {
              newMetrics[memoryMetricIndex] = {
                ...newMetrics[memoryMetricIndex],
                value: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
                timestamp: performance.now()
              };
            }
            
            return newMetrics;
          });
        }
      }
    }, 1000);
    
    const intervalId = setInterval(throttledCollect, collectionInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isRecording, collectionInterval]);
  
  // Don't render anything in production or if not visible
  if (process.env.NODE_ENV === 'production' || !visible) {
    return null;
  }
  
  // Helper to render a simple chart
  const renderMetricChart = (metricName: string) => {
    const metricData = performanceHistory[metricName];
    if (!metricData || metricData.values.length < 2) return null;
    
    const values = metricData.values;
    const min = metricData.min;
    const max = metricData.max;
    const range = max - min || 1;
    
    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{metricName}</span>
          <span>{values[values.length - 1].toFixed(1)}{metricData.unit}</span>
        </div>
        <div className="h-8 bg-gray-100 dark:bg-gray-800 relative overflow-hidden rounded">
          <div className="flex h-full items-end">
            {values.map((value, index) => {
              const height = ((value - min) / range) * 100;
              return (
                <div
                  key={index}
                  className={`w-1 rounded-t ${
                    metricData.type === 'memory' ? 'bg-purple-500' :
                    metricData.type === 'animation' ? 'bg-green-500' :
                    metricData.type === 'render' ? 'bg-blue-500' : 'bg-gray-500'
                  }`}
                  style={{
                    height: `${Math.max(5, height)}%`,
                    marginRight: '1px'
                  }}
                  title={`${value.toFixed(1)}${metricData.unit}`}
                />
              );
            })}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Min: {min.toFixed(1)}</span>
          <span>Avg: {metricData.avg.toFixed(1)}</span>
          <span>Max: {max.toFixed(1)}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className={`fixed ${getPositionStyles()} z-50 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        isMinimized ? 'w-auto h-auto p-2' : 'w-80 max-h-96 p-4'
      }`}
    >
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18 9l-6-6-6 6"></path>
            <path d="M6 12h12"></path>
          </svg>
          <span>Performance</span>
        </button>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance Monitor</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => isRecording ? stopRecording() : startRecording()}
                className={`text-xs px-2 py-1 rounded ${
                  isRecording 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                    : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
                }`}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? 'Stop' : 'Start'}
              </button>
              <button
                onClick={resetMetrics}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                title="Reset metrics"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Minimize"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3m-18 0h3a2 2 0 0 1 2 2v3"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'metrics'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Charts
              </button>
              <button
                onClick={() => setActiveTab('memory')}
                className={`py-2 text-xs font-medium border-b-2 ${
                  activeTab === 'memory'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Memory
              </button>
            </nav>
          </div>
          
          <div className="overflow-y-auto max-h-64">
            {activeTab === 'metrics' && (
              <div className="space-y-2">
                {currentMetrics.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No metrics collected yet.</p>
                ) : (
                  currentMetrics.map(metric => (
                    <div key={metric.name} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-xs text-gray-600 dark:text-gray-300">{metric.name}</span>
                      <span className={`text-xs font-medium ${
                        metric.type === 'memory' ? 'text-purple-600 dark:text-purple-400' :
                        metric.type === 'animation' ? 'text-green-600 dark:text-green-400' :
                        metric.type === 'render' ? 'text-blue-600 dark:text-blue-400' :
                        'text-gray-600 dark:text-gray-300'
                      }`}>
                        {metric.value} {metric.unit}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'chart' && (
              <div className="space-y-4">
                {Object.keys(performanceHistory).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No metrics collected yet.</p>
                ) : (
                  Object.keys(performanceHistory)
                    .filter(name => performanceHistory[name].type === 'animation' || performanceHistory[name].type === 'render')
                    .map(metricName => renderMetricChart(metricName))
                )}
              </div>
            )}
            
            {activeTab === 'memory' && (
              <div className="space-y-4">
                {Object.keys(performanceHistory)
                  .filter(name => performanceHistory[name].type === 'memory')
                  .map(metricName => renderMetricChart(metricName))}
                  
                {!Object.keys(performanceHistory).some(name => performanceHistory[name].type === 'memory') && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Memory metrics not available or not collected yet.</p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <p>Frame {frameCount.current} • {isRecording ? 'Recording' : 'Paused'}</p>
          </div>
        </>
      )}
    </div>
  );
};

// Add type definition for performance.memory
declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
  
  interface Window {
    __PERF_METRICS__?: Record<string, number[]>;
  }
}

export default PerformanceMonitor; 