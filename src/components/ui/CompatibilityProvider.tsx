"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getComponentRegistry } from '@/lib/utils/component-registry';
import { initializeComponentResolution } from '@/lib/utils/import-resolver';

// Define the compatibility settings interface
interface ComponentCompatibilitySettings {
  enableCompatibilityMode: boolean;
  enableLogging: boolean;
  autoFallback: boolean;
  strictMode: boolean;
}

// Define the compatibility context
interface CompatibilityContextType {
  settings: ComponentCompatibilitySettings;
  updateSettings: (settings: Partial<ComponentCompatibilitySettings>) => void;
  componentStatus: Map<string, string>;
  isComponentCompatible: (componentName: string) => boolean;
  useCompatibilityVersion: (componentName: string) => boolean;
  toggleCompatibilityMode: () => void;
}

// Create the context with default values
const CompatibilityContext = createContext<CompatibilityContextType>({
  settings: {
    enableCompatibilityMode: false,
    enableLogging: process.env.NODE_ENV === 'development',
    autoFallback: true,
    strictMode: false,
  },
  updateSettings: () => {},
  componentStatus: new Map(),
  isComponentCompatible: () => true,
  useCompatibilityVersion: () => false,
  toggleCompatibilityMode: () => {},
});

// Create the provider component
export function CompatibilityProvider({ children }: { children: ReactNode }) {
  // Initialize settings from localStorage if available
  const [settings, setSettings] = useState<ComponentCompatibilitySettings>({
    enableCompatibilityMode: false,
    enableLogging: process.env.NODE_ENV === 'development',
    autoFallback: true,
    strictMode: false,
  });

  // Track component status from registry
  const [componentStatus, setComponentStatus] = useState<Map<string, string>>(new Map());

  // Initialize the component resolution system
  useEffect(() => {
    const cleanup = initializeComponentResolution();
    
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem('componentCompatibilitySettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load compatibility settings:', error);
    }
    
    // Subscribe to registry updates
    const registry = getComponentRegistry();
    const unsubscribe = registry.subscribe((components) => {
      const statusMap = new Map<string, string>();
      components.forEach((component) => {
        statusMap.set(component.name, component.status);
      });
      setComponentStatus(statusMap);
    });
    
    return () => {
      cleanup();
      unsubscribe();
    };
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('componentCompatibilitySettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save compatibility settings:', error);
    }
  }, [settings]);

  // Update settings
  const updateSettings = (newSettings: Partial<ComponentCompatibilitySettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  // Toggle compatibility mode
  const toggleCompatibilityMode = () => {
    updateSettings({ enableCompatibilityMode: !settings.enableCompatibilityMode });
  };

  // Check if a component is compatible
  const isComponentCompatible = (componentName: string): boolean => {
    const registry = getComponentRegistry();
    const component = registry.getComponent(componentName);
    return component?.status !== 'failed';
  };

  // Determine if compatibility version should be used
  const useCompatibilityVersion = (componentName: string): boolean => {
    if (settings.enableCompatibilityMode) {
      return true;
    }
    
    if (!settings.autoFallback) {
      return false;
    }
    
    const registry = getComponentRegistry();
    return registry.shouldUseCompatibilityVersion(componentName);
  };

  // Provide the context value
  const contextValue: CompatibilityContextType = {
    settings,
    updateSettings,
    componentStatus,
    isComponentCompatible,
    useCompatibilityVersion,
    toggleCompatibilityMode,
  };

  return (
    <CompatibilityContext.Provider value={contextValue}>
      {children}
    </CompatibilityContext.Provider>
  );
}

// Custom hook to use the compatibility context
export function useComponentCompatibility() {
  const context = useContext(CompatibilityContext);
  if (!context) {
    throw new Error('useComponentCompatibility must be used within a CompatibilityProvider');
  }
  return context;
}

// Component to display compatibility status
export function CompatibilityStatus() {
  const { settings, componentStatus, toggleCompatibilityMode } = useComponentCompatibility();
  
  const failedComponents = Array.from(componentStatus.entries())
    .filter(([_, status]) => status === 'failed')
    .map(([name]) => name);
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-50 text-sm">
      <h3 className="font-semibold mb-2">Component Compatibility</h3>
      
      <div className="mb-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enableCompatibilityMode}
            onChange={toggleCompatibilityMode}
            className="mr-2"
          />
          <span>Compatibility Mode {settings.enableCompatibilityMode ? 'On' : 'Off'}</span>
        </label>
      </div>
      
      {failedComponents.length > 0 && (
        <div className="text-red-500">
          <p>Failed Components ({failedComponents.length}):</p>
          <ul className="list-disc pl-4">
            {failedComponents.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        <p>Total Components: {componentStatus.size}</p>
      </div>
    </div>
  );
} 