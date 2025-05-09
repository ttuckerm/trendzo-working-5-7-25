"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Eye, EyeOff, ChevronUp, ChevronDown, MousePointer, Smile, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface UsabilityTestingOverlayProps {
  enabled?: boolean;
  childMode?: boolean;
  showHeatmap?: boolean;
  accessibilityChecking?: boolean;
  onToggleHeatmap?: (enabled: boolean) => void;
  onToggleChildMode?: (enabled: boolean) => void;
  onToggleAccessibility?: (enabled: boolean) => void;
}

export default function UsabilityTestingOverlay({
  enabled = false,
  childMode = false,
  showHeatmap = false,
  accessibilityChecking = true,
  onToggleHeatmap,
  onToggleChildMode,
  onToggleAccessibility
}: UsabilityTestingOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [interactions, setInteractions] = useState<{x: number, y: number, count: number}[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(showHeatmap);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Update heatmap state when prop changes
  useEffect(() => {
    setHeatmapEnabled(showHeatmap);
  }, [showHeatmap]);
  
  // Effect to initialize the heatmap canvas
  useEffect(() => {
    if (enabled && heatmapEnabled && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw heatmap points (this is a simplified version)
        interactions.forEach(point => {
          const radius = Math.min(50, Math.max(20, point.count * 5));
          const gradient = ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, radius
          );
          gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
          gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          
          ctx.beginPath();
          ctx.fillStyle = gradient;
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }
  }, [enabled, heatmapEnabled, interactions]);
  
  // Track click events for the heatmap
  useEffect(() => {
    if (!enabled || !heatmapEnabled) return;
    
    const trackClick = (e: MouseEvent) => {
      setInteractions(prev => {
        // Check if a point already exists close to this one
        const existingPointIndex = prev.findIndex(p => 
          Math.abs(p.x - e.clientX) < 20 && Math.abs(p.y - e.clientY) < 20
        );
        
        if (existingPointIndex >= 0) {
          // Update existing point
          const newPoints = [...prev];
          newPoints[existingPointIndex] = {
            ...newPoints[existingPointIndex],
            count: newPoints[existingPointIndex].count + 1
          };
          return newPoints;
        } else {
          // Add new point
          return [...prev, { x: e.clientX, y: e.clientY, count: 1 }];
        }
      });
    };
    
    window.addEventListener('click', trackClick);
    return () => window.removeEventListener('click', trackClick);
  }, [enabled, heatmapEnabled]);
  
  // Effect to handle window resize
  useEffect(() => {
    if (!enabled || !heatmapEnabled || !canvasRef.current) return;
    
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, heatmapEnabled]);
  
  // Handle toggle heatmap
  const handleToggleHeatmap = () => {
    const newValue = !heatmapEnabled;
    setHeatmapEnabled(newValue);
    if (onToggleHeatmap) onToggleHeatmap(newValue);
  };
  
  // Handle toggle child mode
  const handleToggleChildMode = () => {
    if (onToggleChildMode) onToggleChildMode(!childMode);
  };
  
  // Handle toggle accessibility
  const handleToggleAccessibility = () => {
    if (onToggleAccessibility) onToggleAccessibility(!accessibilityChecking);
  };
  
  // Don't render anything if not enabled
  if (!enabled) return null;
  
  return (
    <>
      {/* Heatmap overlay canvas */}
      {heatmapEnabled && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-40"
          style={{ opacity: 0.6 }}
        />
      )}
      
      {/* Testing controls */}
      <div className="fixed bottom-4 right-4 z-50">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              className="bg-white rounded-lg shadow-lg p-4 mb-2 max-w-xs"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Usability Testing</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm">
                    <MousePointer size={16} className="mr-2" />
                    Heatmap Tracking
                  </label>
                  <button 
                    className={`${heatmapEnabled ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    onClick={handleToggleHeatmap}
                  >
                    <span
                      className={`${heatmapEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm">
                    <Smile size={16} className="mr-2" />
                    Child-Friendly Mode
                  </label>
                  <button 
                    className={`${childMode ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    onClick={handleToggleChildMode}
                  >
                    <span
                      className={`${childMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm">
                    <Eye size={16} className="mr-2" />
                    Accessibility Checking
                  </label>
                  <button 
                    className={`${accessibilityChecking ? 'bg-blue-500' : 'bg-gray-300'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                    onClick={handleToggleAccessibility}
                  >
                    <span
                      className={`${accessibilityChecking ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFeedback(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full shadow-lg"
          >
            <MessageCircle size={20} />
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-white hover:bg-gray-100 p-2 rounded-full shadow-lg"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
      
      {/* Feedback widget */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-72"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Share Your Feedback</h3>
              <button 
                onClick={() => setShowFeedback(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              How would you rate your experience with this feature?
            </p>
            
            <div className="flex justify-center space-x-4 mb-3">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ThumbsDown className="text-gray-600" size={24} />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <ThumbsUp className="text-green-600" size={24} />
              </button>
            </div>
            
            <textarea
              placeholder="Tell us more about your experience..."
              className="w-full h-20 p-2 border border-gray-300 rounded-md text-sm"
            />
            
            <button
              className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md text-sm"
              onClick={() => setShowFeedback(false)}
            >
              Submit Feedback
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 