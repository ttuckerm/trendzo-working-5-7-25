"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface RenderCounterProps {
  componentName: string;
  showDetails?: boolean;
  warningThreshold?: number;
  dangerThreshold?: number;
}

/**
 * RenderCounter - A debug component that counts and displays component renders
 * Use this to detect infinite loop rendering issues
 */
export const RenderCounter: React.FC<RenderCounterProps> = ({ 
  componentName, 
  showDetails = true,
  warningThreshold = 5,
  dangerThreshold = 20
}) => {
  // Use ref to store render count to avoid triggering more renders
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use state only for display updates, not for tracking renders
  const [displayState, setDisplayState] = useState({
    count: 0,
    rendersPerSecond: '0',
    secondsElapsed: 0,
    statusColor: 'bg-green-500'
  });
  
  // Increment the counter on each render
  renderCount.current += 1;
  
  // Update the display without causing additional renders
  const updateDisplay = useCallback(() => {
    const secondsElapsed = (Date.now() - startTime.current) / 1000;
    const rendersPerSecond = secondsElapsed > 0 
      ? (renderCount.current / secondsElapsed).toFixed(2) 
      : '0';
    
    // Determine status color based on render frequency
    let statusColor = 'bg-green-500'; // Good
    if (Number(rendersPerSecond) > warningThreshold) {
      statusColor = 'bg-amber-500'; // Warning
    }
    if (Number(rendersPerSecond) > dangerThreshold) {
      statusColor = 'bg-red-500'; // Danger - likely infinite loop
    }
    
    setDisplayState({
      count: renderCount.current,
      rendersPerSecond,
      secondsElapsed,
      statusColor
    });
  }, [warningThreshold, dangerThreshold]);
  
  // Set up the interval for display updates
  useEffect(() => {
    // Initial update
    updateDisplay();
    
    // Only set interval if we're showing details
    if (showDetails) {
      intervalIdRef.current = setInterval(updateDisplay, 1000);
    }
    
    // Clean up interval on unmount
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [showDetails, updateDisplay]);
  
  if (!showDetails) {
    // Simple indicator only
    return (
      <div className="fixed top-2 right-2 z-50 flex items-center gap-2">
        <div className={`w-4 h-4 rounded-full ${displayState.statusColor}`}></div>
      </div>
    );
  }

  return (
    <div className="fixed top-2 right-2 z-50 bg-gray-800 text-white p-3 rounded-md shadow-lg text-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${displayState.statusColor}`}></div>
        <span className="font-semibold">{componentName}</span>
      </div>
      <div className="space-y-1">
        <div>Renders: <span className="font-mono">{displayState.count}</span></div>
        <div>Per second: <span className="font-mono">{displayState.rendersPerSecond}</span></div>
        <div>Time: <span className="font-mono">{displayState.secondsElapsed.toFixed(1)}s</span></div>
      </div>
    </div>
  );
}; 