"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import FeedbackWidget from '@/components/ui/FeedbackWidget';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface UserTestingFrameworkProps {
  children: React.ReactNode;
  enableHeatmap?: boolean;
  enableAccessibilityChecks?: boolean;
  enableChildMode?: boolean;
  showFeedbackWidget?: boolean;
  testScenarioId?: string;
}

/**
 * A comprehensive framework for user testing that includes:
 * - Heatmap tracking
 * - Interaction metrics
 * - Accessibility verification
 * - Child-friendly mode testing
 * - A/B testing support
 * - Feedback collection
 */
export default function UserTestingFramework({
  children,
  enableHeatmap = false,
  enableAccessibilityChecks = true,
  enableChildMode = false,
  showFeedbackWidget = true,
  testScenarioId,
}: UserTestingFrameworkProps) {
  const { 
    startHeatmapTracking, 
    stopHeatmapTracking, 
    setAccessibilityMode,
    setChildFriendlyMode,
    accessibilityIssues,
    startTestScenario,
    activeScenario,
    completeTestStep
  } = useUsabilityTest();
  
  const pathname = usePathname();
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);
  const [feedbackPosition, setFeedbackPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  
  // Enable/disable heatmap tracking
  useEffect(() => {
    if (enableHeatmap) {
      startHeatmapTracking();
    } else {
      stopHeatmapTracking();
    }
    
    return () => {
      stopHeatmapTracking();
    };
  }, [enableHeatmap, startHeatmapTracking, stopHeatmapTracking]);
  
  // Enable/disable accessibility and child modes
  useEffect(() => {
    setAccessibilityMode(enableAccessibilityChecks);
    setChildFriendlyMode(enableChildMode);
  }, [enableAccessibilityChecks, enableChildMode, setAccessibilityMode, setChildFriendlyMode]);
  
  // Start a test scenario if specified
  useEffect(() => {
    if (testScenarioId) {
      startTestScenario(testScenarioId);
    }
  }, [testScenarioId, startTestScenario]);
  
  // Update current issues and page-specific settings
  useEffect(() => {
    setCurrentIssues(accessibilityIssues);
    
    // Adjust feedback widget position based on the page
    if (pathname?.includes('/editor')) {
      setFeedbackPosition('bottom-left');
    } else {
      setFeedbackPosition('bottom-right');
    }
  }, [pathname, accessibilityIssues]);
  
  // Draw heatmap (simplified implementation)
  useEffect(() => {
    if (!enableHeatmap || !heatmapCanvasRef.current) return;
    
    const canvas = heatmapCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Example drawing function (in a real implementation, this would use actual heatmap data)
    const drawHeatmap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Demo data - would be replaced with real interaction points from usabilityTest.heatmapData
      const demoPoints = [
        { x: canvas.width * 0.2, y: canvas.height * 0.3, value: 5 },
        { x: canvas.width * 0.5, y: canvas.height * 0.2, value: 10 },
        { x: canvas.width * 0.8, y: canvas.height * 0.4, value: 7 },
        { x: canvas.width * 0.3, y: canvas.height * 0.8, value: 12 },
      ];
      
      demoPoints.forEach(point => {
        const radius = point.value * 5;
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
    };
    
    // Draw the demo heatmap
    drawHeatmap();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [enableHeatmap]);
  
  // Child-friendly enhancements
  const enhanceForChildren = (childNode: React.ReactNode): React.ReactNode => {
    if (!enableChildMode) return childNode;
    
    // In a real implementation, this would:
    // 1. Add simplified UI elements
    // 2. Make fonts larger
    // 3. Add more visual cues and less text
    // 4. Use more colorful elements
    
    // Here we'll just wrap it with a special class for demonstration
    return (
      <div className="child-friendly-mode">
        {childNode}
      </div>
    );
  };
  
  // Handle step completion in a test scenario
  const handleStepComplete = (stepId: string) => {
    if (activeScenario) {
      completeTestStep(activeScenario.id, stepId);
    }
  };
  
  return (
    <div className="user-testing-framework relative">
      {/* Heatmap overlay canvas */}
      {enableHeatmap && (
        <canvas
          ref={heatmapCanvasRef}
          className="fixed inset-0 pointer-events-none z-50 opacity-30"
        />
      )}
      
      {/* Accessibility issues notification */}
      <AnimatePresence>
        {enableAccessibilityChecks && currentIssues.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 z-50 bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-4 max-w-md"
          >
            <div className="flex items-start">
              <AlertCircle className="text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800">
                  {currentIssues.length} Accessibility {currentIssues.length === 1 ? 'Issue' : 'Issues'} Detected
                </h3>
                <div className="mt-1 text-amber-700">
                  {showIssues ? (
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {currentIssues.slice(0, 5).map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                      {currentIssues.length > 5 && (
                        <li>...and {currentIssues.length - 5} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm">Click to show details</p>
                  )}
                </div>
                <div className="mt-2 flex justify-between">
                  <button
                    onClick={() => setShowIssues(!showIssues)}
                    className="text-xs text-amber-800 hover:text-amber-900 font-medium"
                  >
                    {showIssues ? 'Hide Details' : 'Show Details'}
                  </button>
                  <button
                    onClick={() => setCurrentIssues([])}
                    className="text-xs text-amber-800 hover:text-amber-900 font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setCurrentIssues([])} 
                className="ml-2 text-amber-500 hover:text-amber-700"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Active test scenario guidance */}
      <AnimatePresence>
        {activeScenario && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 max-w-md"
          >
            <div className="flex items-start">
              <Info className="text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">{activeScenario.name}</h3>
                <p className="mt-1 text-sm text-blue-700">{activeScenario.description}</p>
                
                <div className="mt-3 space-y-2">
                  {activeScenario.steps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`flex items-center p-2 rounded ${
                        step.completed 
                          ? 'bg-green-100' 
                          : 'bg-blue-100'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle size={16} className="text-green-600 mr-2" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-blue-400 mr-2" />
                      )}
                      <span className={`text-sm ${step.completed ? 'text-green-800 line-through' : 'text-blue-800'}`}>
                        {step.description}
                      </span>
                      {!step.completed && step.hintText && (
                        <button className="ml-auto text-xs text-blue-700 hover:text-blue-900 font-medium">
                          Hint
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Feedback widget */}
      {showFeedbackWidget && (
        <FeedbackWidget 
          position={feedbackPosition}
          context={pathname || 'unknown'}
        />
      )}
      
      {/* Main content with child-friendly enhancements if enabled */}
      {enhanceForChildren(children)}
    </div>
  );
} 