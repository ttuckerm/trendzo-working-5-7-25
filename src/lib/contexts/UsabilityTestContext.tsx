import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for interaction events
export interface UserInteraction {
  type: 
    | 'click' 
    | 'hover' 
    | 'scroll' 
    | 'input' 
    | 'navigation' 
    | 'dwell' 
    | 'error'
    | 'success'
    | 'abandon'
    | 'complete'
    | 'drag'      // Added for drag operations
    | 'dragOver'  // Added for drag over operations
    | 'drop'      // Added for drop operations
    | 'dragEnd';  // Added for drag end operations
  target: string;
  targetType?: string;
  path?: string;
  timestamp: number;
  metadata?: Record<string, any>;
  duration?: number; // Duration in ms for time-based events
  position?: { x: number; y: number }; // For positional events
}

// Types for user feedback
export interface UserFeedback {
  type: 'emoji' | 'rating' | 'comment' | 'issue';
  value: string | number;
  context: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Types for A/B testing
export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  activeVariant: string;
  startDate: Date;
  endDate?: Date;
}

// Types for heatmap data
export interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  path: string;
  elementId?: string;
  timestamp: number;
}

// Test scenario for children or novice users
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  targetAudience: 'child' | 'novice' | 'expert' | 'all';
  completed: boolean;
}

interface TestStep {
  id: string;
  description: string;
  expectedInteraction: string;
  completed: boolean;
  hintText?: string;
  visualCue?: string;
}

// Usability context type
export interface UsabilityTestContextType {
  // Interaction tracking
  trackInteraction: (interaction: Omit<UserInteraction, 'timestamp'>) => void;
  interactions: UserInteraction[];
  
  // User feedback
  collectFeedback: (feedback: Omit<UserFeedback, 'timestamp'>) => void;
  feedback: UserFeedback[];
  
  // A/B testing
  activeTests: ABTest[];
  getActiveVariant: (testId: string) => string | null;
  
  // Heatmap data
  heatmapData: HeatmapPoint[];
  startHeatmapTracking: () => void;
  stopHeatmapTracking: () => void;
  isTrackingHeatmap: boolean;
  
  // Session information
  sessionId: string;
  sessionStartTime: number;
  
  // Accessibility
  accessibilityMode: boolean;
  setAccessibilityMode: (enabled: boolean) => void;
  accessibilityIssues: string[];
  
  // Child-friendly mode
  childFriendlyMode: boolean;
  setChildFriendlyMode: (enabled: boolean) => void;
  
  // Test scenarios
  testScenarios: TestScenario[];
  startTestScenario: (scenarioId: string) => void;
  completeTestStep: (scenarioId: string, stepId: string) => void;
  activeScenario: TestScenario | null;
}

// Create the context with default values
const UsabilityTestContext = createContext<UsabilityTestContextType>({
  trackInteraction: () => {},
  interactions: [],
  collectFeedback: () => {},
  feedback: [],
  activeTests: [],
  getActiveVariant: () => null,
  heatmapData: [],
  startHeatmapTracking: () => {},
  stopHeatmapTracking: () => {},
  isTrackingHeatmap: false,
  sessionId: '',
  sessionStartTime: 0,
  accessibilityMode: false,
  setAccessibilityMode: () => {},
  accessibilityIssues: [],
  childFriendlyMode: false,
  setChildFriendlyMode: () => {},
  testScenarios: [],
  startTestScenario: () => {},
  completeTestStep: () => {},
  activeScenario: null,
});

// Create custom hook for using the usability context
export const useUsabilityTest = () => useContext(UsabilityTestContext);

// Provider props
interface UsabilityTestProviderProps {
  children: ReactNode;
  initialAccessibilityMode?: boolean;
  initialChildFriendlyMode?: boolean;
  trackAutomatically?: boolean;
}

// Generate a random session ID
const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Provider component
export const UsabilityTestProvider: React.FC<UsabilityTestProviderProps> = ({
  children,
  initialAccessibilityMode = false,
  initialChildFriendlyMode = false,
  trackAutomatically = true,
}) => {
  // State for interactions
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  
  // State for feedback
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  
  // State for A/B tests
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  
  // State for heatmap
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [isTrackingHeatmap, setIsTrackingHeatmap] = useState(false);
  
  // Session information
  const [sessionId] = useState(generateSessionId());
  const [sessionStartTime] = useState(Date.now());
  
  // Accessibility state
  const [accessibilityMode, setAccessibilityMode] = useState(initialAccessibilityMode);
  const [accessibilityIssues, setAccessibilityIssues] = useState<string[]>([]);
  
  // Child-friendly mode
  const [childFriendlyMode, setChildFriendlyMode] = useState(initialChildFriendlyMode);
  
  // Test scenarios
  const [testScenarios, setTestScenarios] = useState<TestScenario[]>([]);
  const [activeScenario, setActiveScenario] = useState<TestScenario | null>(null);
  
  // Automatic tracking setup
  useEffect(() => {
    if (!trackAutomatically) return;
    
    // Helper to extract a reasonable target name
    const getElementIdentifier = (element: HTMLElement): string => {
      // Try to get a reasonable identifier in priority order
      const id = element.id;
      const dataId = element.getAttribute('data-id');
      const ariaLabel = element.getAttribute('aria-label');
      const testId = element.getAttribute('data-testid');
      const role = element.getAttribute('role');
      const className = element.className;
      const tagName = element.tagName.toLowerCase();
      
      // Return the first available identifier
      return id 
        ? `#${id}`
        : dataId
        ? `[data-id="${dataId}"]`
        : ariaLabel
        ? `[aria-label="${ariaLabel}"]`
        : testId
        ? `[data-testid="${testId}"]`
        : role
        ? `${tagName}[role="${role}"]`
        : className && typeof className === 'string' && className.trim() !== ''
        ? `${tagName}.${className.split(' ')[0]}`
        : tagName;
    };
    
    // Click tracking
    const handleClick = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement) {
        const target = getElementIdentifier(e.target);
        const targetType = e.target.tagName.toLowerCase();
        const path = window.location.pathname;
        const position = { x: e.clientX, y: e.clientY };
        
        trackInteraction({
          type: 'click',
          target,
          targetType,
          path,
          position,
        });
      }
    };
    
    // Hover tracking (throttled)
    let lastHoverTime = 0;
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Only track hovers every second to avoid overwhelming the system
      if (now - lastHoverTime > 1000 && e.target instanceof HTMLElement) {
        lastHoverTime = now;
        const target = getElementIdentifier(e.target);
        const path = window.location.pathname;
        const position = { x: e.clientX, y: e.clientY };
        
        trackInteraction({
          type: 'hover',
          target,
          path,
          position,
        });
      }
    };
    
    // Scroll tracking (throttled)
    let lastScrollTime = 0;
    const handleScroll = () => {
      const now = Date.now();
      // Only track scrolls every second
      if (now - lastScrollTime > 1000) {
        lastScrollTime = now;
        const path = window.location.pathname;
        
        trackInteraction({
          type: 'scroll',
          target: 'window',
          path,
          metadata: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            maxScroll: document.body.scrollHeight - window.innerHeight,
          },
        });
      }
    };
    
    // Input tracking (throttled)
    let lastInputTime = 0;
    const handleInput = (e: Event) => {
      const now = Date.now();
      // Only track inputs every 500ms to respect privacy
      if (now - lastInputTime > 500 && e.target instanceof HTMLElement) {
        lastInputTime = now;
        const target = getElementIdentifier(e.target);
        const path = window.location.pathname;
        
        trackInteraction({
          type: 'input',
          target,
          path,
          metadata: {
            inputType: e.type,
          },
        });
      }
    };
    
    // Setup tracking listeners
    document.addEventListener('click', handleClick);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('input', handleInput);
    
    // Cleanup tracking listeners
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('scroll', handleScroll);
      document.removeEventListener('input', handleInput);
    };
  }, [trackAutomatically]);
  
  // Effect to send metrics to analytics (simulated)
  useEffect(() => {
    // In a real implementation, we'd periodically send data to a server
    const sendMetricsInterval = setInterval(() => {
      if (interactions.length > 0) {
        console.log('[UsabilityTest] Sending metrics', {
          sessionId,
          interactionsCount: interactions.length,
          feedbackCount: feedback.length,
        });
        
        // In a real app, this would be an API call:
        // sendToAnalyticsServer({
        //   sessionId,
        //   interactions,
        //   feedback,
        //   heatmapData,
        // });
      }
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(sendMetricsInterval);
  }, [interactions, feedback, heatmapData, sessionId]);
  
  // Setup automatic accessibility checking
  useEffect(() => {
    if (!accessibilityMode) return;
    
    // Basic accessibility checks
    const runAccessibilityChecks = () => {
      const issues: string[] = [];
      
      // Check for images without alt text
      document.querySelectorAll('img').forEach(img => {
        if (!img.alt) {
          issues.push(`Image without alt text: ${img.src}`);
        }
      });
      
      // Check for low contrast text (simplified)
      document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, button').forEach(element => {
        const style = window.getComputedStyle(element);
        const fontSize = parseInt(style.fontSize);
        if (fontSize < 12) {
          issues.push(`Text too small (${fontSize}px): ${element.textContent?.substring(0, 20)}...`);
        }
      });
      
      // Set the discovered issues
      if (issues.length > 0) {
        setAccessibilityIssues(issues);
      }
    };
    
    // Run checks on mount and when DOM changes
    runAccessibilityChecks();
    
    // Set up a MutationObserver to check when DOM changes
    const observer = new MutationObserver(runAccessibilityChecks);
    observer.observe(document.body, { 
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    
    return () => observer.disconnect();
  }, [accessibilityMode]);
  
  // Function to track interactions
  const trackInteraction = (interaction: Omit<UserInteraction, 'timestamp'>) => {
    const fullInteraction: UserInteraction = {
      ...interaction,
      timestamp: Date.now(),
    };
    
    setInteractions(prev => [...prev, fullInteraction]);
    
    // If heatmap tracking is active, add to heatmap data
    if (isTrackingHeatmap && interaction.position) {
      setHeatmapData(prev => [
        ...prev,
        {
          x: interaction.position!.x,
          y: interaction.position!.y,
          value: 1,
          path: interaction.path || window.location.pathname,
          elementId: interaction.target,
          timestamp: fullInteraction.timestamp,
        },
      ]);
    }
    
    // If there's an active test scenario, check if this interaction completes a step
    if (activeScenario) {
      const currentStep = activeScenario.steps.find(step => !step.completed);
      if (currentStep && currentStep.expectedInteraction === interaction.type) {
        completeTestStep(activeScenario.id, currentStep.id);
      }
    }
  };
  
  // Function to collect user feedback
  const collectFeedback = (feedbackItem: Omit<UserFeedback, 'timestamp'>) => {
    const fullFeedback: UserFeedback = {
      ...feedbackItem,
      timestamp: Date.now(),
    };
    
    setFeedback(prev => [...prev, fullFeedback]);
    
    // Log feedback for debugging
    console.log('[UsabilityTest] Feedback received:', fullFeedback);
  };
  
  // Function to get an active variant for A/B testing
  const getActiveVariant = (testId: string): string | null => {
    const test = activeTests.find(t => t.id === testId);
    return test ? test.activeVariant : null;
  };
  
  // Function to start heatmap tracking
  const startHeatmapTracking = () => {
    setIsTrackingHeatmap(true);
  };
  
  // Function to stop heatmap tracking
  const stopHeatmapTracking = () => {
    setIsTrackingHeatmap(false);
  };
  
  // Function to start a test scenario
  const startTestScenario = (scenarioId: string) => {
    const scenario = testScenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveScenario(scenario);
      
      // Reset completion state of all steps
      setTestScenarios(prev => 
        prev.map(s => 
          s.id === scenarioId 
            ? {
                ...s,
                steps: s.steps.map(step => ({ ...step, completed: false })),
                completed: false,
              }
            : s
        )
      );
      
      // Log the start of the scenario
      console.log(`[UsabilityTest] Started test scenario: ${scenario.name}`);
    }
  };
  
  // Function to complete a test step
  const completeTestStep = (scenarioId: string, stepId: string) => {
    setTestScenarios(prev => {
      const updatedScenarios = prev.map(scenario => {
        if (scenario.id === scenarioId) {
          // Mark the step as completed
          const updatedSteps = scenario.steps.map(step => 
            step.id === stepId ? { ...step, completed: true } : step
          );
          
          // Check if all steps are completed
          const allCompleted = updatedSteps.every(step => step.completed);
          
          return {
            ...scenario,
            steps: updatedSteps,
            completed: allCompleted,
          };
        }
        return scenario;
      });
      
      // Update the active scenario
      const updatedActiveScenario = updatedScenarios.find(s => s.id === scenarioId) || null;
      setActiveScenario(updatedActiveScenario);
      
      // If all steps are completed, log it
      if (updatedActiveScenario?.completed) {
        console.log(`[UsabilityTest] Completed test scenario: ${updatedActiveScenario.name}`);
      }
      
      return updatedScenarios;
    });
  };
  
  // Create the context value
  const contextValue: UsabilityTestContextType = {
    trackInteraction,
    interactions,
    collectFeedback,
    feedback,
    activeTests,
    getActiveVariant,
    heatmapData,
    startHeatmapTracking,
    stopHeatmapTracking,
    isTrackingHeatmap,
    sessionId,
    sessionStartTime,
    accessibilityMode,
    setAccessibilityMode,
    accessibilityIssues,
    childFriendlyMode,
    setChildFriendlyMode,
    testScenarios,
    startTestScenario,
    completeTestStep,
    activeScenario,
  };
  
  return (
    <UsabilityTestContext.Provider value={contextValue}>
      {children}
    </UsabilityTestContext.Provider>
  );
}; 