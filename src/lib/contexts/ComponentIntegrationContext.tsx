import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigation } from './NavigationContext';

// Define types for component state persistence
interface ComponentState {
  templateLibrary: {
    filters: any;
    searchQuery: string;
    selectedTemplateId: string | null;
    scrollPosition: number;
    viewMode: 'grid' | 'list';
  };
  templateEditor: {
    activeTab: string;
    selectedSection: string | null;
    selectedOverlay: string | null;
    editorMode: 'edit' | 'preview';
    zoomLevel: number;
    history: any[];
  };
  analytics: {
    timeRange: string;
    activeDashboard: string;
    expandedCards: string[];
    comparisonIds: string[];
  };
}

// Type for navigation options
interface NavigationOptions {
  preserveState?: boolean;
  data?: Record<string, any>;
  transition?: 'slide' | 'fade' | 'zoom' | 'flip';
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Type for the context
interface ComponentIntegrationContextType {
  // State persistence
  getComponentState: <T>(component: keyof ComponentState, key: string) => T | null;
  setComponentState: <T>(component: keyof ComponentState, key: string, value: T) => void;
  clearComponentState: (component: keyof ComponentState) => void;
  
  // Navigation integration
  navigateBetweenComponents: (
    fromComponent: string, 
    toComponent: string, 
    options?: NavigationOptions
  ) => void;
  
  // Visual connections
  connectComponents: (sourceId: string, targetId: string) => void;
  getConnectedComponents: (componentId: string) => string[];
  
  // Context awareness
  registerComponentActivation: (component: string) => void;
  getLastActiveComponent: () => string;
  getComponentActivationHistory: () => string[];
  
  // Transition control
  transitionInProgress: boolean;
  currentTransition: {
    from: string;
    to: string;
    type: string;
  } | null;
  
  // Drag and drop between components
  registerDropZone: (id: string, acceptFrom: string[]) => void;
  unregisterDropZone: (id: string) => void;
  canAcceptDrop: (sourceId: string, targetId: string) => boolean;
}

// Create the context
const ComponentIntegrationContext = createContext<ComponentIntegrationContextType | undefined>(undefined);

// Custom hook to use the context
export const useComponentIntegration = () => {
  const context = useContext(ComponentIntegrationContext);
  if (!context) {
    throw new Error('useComponentIntegration must be used within a ComponentIntegrationProvider');
  }
  return context;
};

// Props for the provider component
interface ComponentIntegrationProviderProps {
  children: ReactNode;
  initialState?: Partial<ComponentState>;
}

// Provider component
export const ComponentIntegrationProvider: React.FC<ComponentIntegrationProviderProps> = ({
  children,
  initialState = {},
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { navigateTo } = useNavigation();
  
  // State
  const [componentState, setComponentState] = useState<ComponentState>({
    templateLibrary: {
      filters: {},
      searchQuery: '',
      selectedTemplateId: null,
      scrollPosition: 0,
      viewMode: 'grid',
    },
    templateEditor: {
      activeTab: 'content',
      selectedSection: null,
      selectedOverlay: null,
      editorMode: 'edit',
      zoomLevel: 1,
      history: [],
    },
    analytics: {
      timeRange: '30d',
      activeDashboard: 'overview',
      expandedCards: [],
      comparisonIds: [],
    },
    ...initialState,
  });
  
  // Track component activation
  const [activationHistory, setActivationHistory] = useState<string[]>([]);
  
  // Track transitions
  const [transitionInProgress, setTransitionInProgress] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<{
    from: string;
    to: string;
    type: string;
  } | null>(null);
  
  // Track drop zones
  const [dropZones, setDropZones] = useState<Record<string, string[]>>({});
  
  // Track connected components
  const [connectedComponents, setConnectedComponents] = useState<Record<string, string[]>>({});
  
  // Get component state value
  const getComponentState = <T,>(component: keyof ComponentState, key: string): T | null => {
    if (componentState[component]) {
      const componentData = componentState[component] as Record<string, any>;
      if (key in componentData) {
        return componentData[key] as T;
      }
    }
    return null;
  };
  
  // Set component state value
  const setComponentStateValue = <T,>(component: keyof ComponentState, key: string, value: T) => {
    setComponentState(prev => ({
      ...prev,
      [component]: {
        ...prev[component],
        [key]: value,
      },
    }));
  };
  
  // Clear component state
  const clearComponentState = (component: keyof ComponentState) => {
    setComponentState(prev => {
      const newState = { ...prev };
      
      // Reset to default values based on component type
      if (component === 'templateLibrary') {
        newState.templateLibrary = {
          filters: {},
          searchQuery: '',
          selectedTemplateId: null,
          scrollPosition: 0,
          viewMode: 'grid',
        };
      } else if (component === 'templateEditor') {
        newState.templateEditor = {
          activeTab: 'content',
          selectedSection: null,
          selectedOverlay: null,
          editorMode: 'edit',
          zoomLevel: 1,
          history: [],
        };
      } else if (component === 'analytics') {
        newState.analytics = {
          timeRange: '30d',
          activeDashboard: 'overview',
          expandedCards: [],
          comparisonIds: [],
        };
      }
      
      return newState;
    });
  };
  
  // Navigate between components with integration
  const navigateBetweenComponents = (
    fromComponent: string,
    toComponent: string,
    options: NavigationOptions = {}
  ) => {
    const {
      preserveState = true,
      data = {},
      transition = 'fade',
      direction = 'left',
    } = options;
    
    // Start transition
    setTransitionInProgress(true);
    setCurrentTransition({
      from: fromComponent,
      to: toComponent,
      type: transition,
    });
    
    // Handle preserving scroll position if needed
    if (preserveState && fromComponent === 'templateLibrary') {
      setComponentStateValue('templateLibrary', 'scrollPosition', window.scrollY);
    }
    
    // Pass data between components if specified
    if (data && Object.keys(data).length > 0) {
      // For template library to editor navigation with template selection
      if (fromComponent === 'templateLibrary' && toComponent === 'templateEditor' && data.templateId) {
        setComponentStateValue('templateLibrary', 'selectedTemplateId', data.templateId);
      }
      // For analytics to template detail navigation
      else if (fromComponent === 'analytics' && toComponent === 'templateLibrary' && data.templateId) {
        setComponentStateValue('templateLibrary', 'selectedTemplateId', data.templateId);
      }
    }
    
    // Register component activation
    registerComponentActivation(toComponent);
    
    // Use the navigation context for actual navigation
    navigateTo(toComponent, {
      type: transition as any,
      duration: 300,
      direction: direction as any
    });
    
    // Set transition to complete after navigation duration
    setTimeout(() => {
      setTransitionInProgress(false);
      setCurrentTransition(null);
    }, 450); // slightly longer than transition duration to ensure completion
  };
  
  // Register a component connection
  const connectComponents = (sourceId: string, targetId: string) => {
    setConnectedComponents(prev => {
      const newConnections = { ...prev };
      
      if (!newConnections[sourceId]) {
        newConnections[sourceId] = [];
      }
      
      if (!newConnections[sourceId].includes(targetId)) {
        newConnections[sourceId] = [...newConnections[sourceId], targetId];
      }
      
      // Also create the reverse connection for bidirectional awareness
      if (!newConnections[targetId]) {
        newConnections[targetId] = [];
      }
      
      if (!newConnections[targetId].includes(sourceId)) {
        newConnections[targetId] = [...newConnections[targetId], sourceId];
      }
      
      return newConnections;
    });
  };
  
  // Get connected components
  const getConnectedComponents = (componentId: string): string[] => {
    return connectedComponents[componentId] || [];
  };
  
  // Register component activation
  const registerComponentActivation = (component: string) => {
    setActivationHistory(prev => {
      // Remove this component if it exists already
      const filtered = prev.filter(c => c !== component);
      // Add it to the front of the array
      return [component, ...filtered];
    });
  };
  
  // Get the last active component
  const getLastActiveComponent = (): string => {
    return activationHistory[0] || '';
  };
  
  // Get component activation history
  const getComponentActivationHistory = (): string[] => {
    return [...activationHistory];
  };
  
  // Register a drop zone
  const registerDropZone = (id: string, acceptFrom: string[]) => {
    setDropZones(prev => ({
      ...prev,
      [id]: acceptFrom,
    }));
  };
  
  // Unregister a drop zone
  const unregisterDropZone = (id: string) => {
    setDropZones(prev => {
      const newDropZones = { ...prev };
      delete newDropZones[id];
      return newDropZones;
    });
  };
  
  // Check if a drop zone can accept a drop
  const canAcceptDrop = (sourceId: string, targetId: string): boolean => {
    if (!dropZones[targetId]) return false;
    return dropZones[targetId].includes(sourceId);
  };
  
  // Context value
  const contextValue: ComponentIntegrationContextType = {
    getComponentState,
    setComponentState: setComponentStateValue,
    clearComponentState,
    navigateBetweenComponents,
    connectComponents,
    getConnectedComponents,
    registerComponentActivation,
    getLastActiveComponent,
    getComponentActivationHistory,
    transitionInProgress,
    currentTransition,
    registerDropZone,
    unregisterDropZone,
    canAcceptDrop,
  };
  
  return (
    <ComponentIntegrationContext.Provider value={contextValue}>
      {children}
    </ComponentIntegrationContext.Provider>
  );
}; 