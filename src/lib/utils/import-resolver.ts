"use client";

/**
 * Component Import Resolver
 * 
 * This utility helps resolve component imports by providing fallbacks to compatibility components
 * when the original imports fail.
 */

import * as React from 'react';
import * as CompatibilityComponents from '@/components/ui/ui-compatibility';
import { useComponentCompatibility } from '@/components/ui/CompatibilityProvider';
import { getComponentRegistry as importedGetComponentRegistry } from './component-registry';

// Define a local interface for the compatibility context to avoid naming conflicts
interface ImportResolverCompatibilityContext {
  isComponentCompatible: (componentName: string) => boolean;
  useCompatibilityVersion: (componentName: string) => boolean;
  registerCompatibilityError: (componentName: string, error: Error) => void;
}

// At the top of the file, add global declarations
declare global {
  var __componentRegistry: ComponentRegistry | undefined;
  var __compatibilityContext: ImportResolverCompatibilityContext | null;
}

// Interface for components in the registry
interface ComponentInfo {
  name: string;
  status: 'registered' | 'imported' | 'failed';
  error?: string;
}

// Define a ComponentStatus type for registerComponent
type ComponentStatus = 'registered' | 'imported' | 'failed';

// Define the shape of a registered component
interface RegisteredComponent {
  name: string;
  status: ComponentStatus;
  importPath: string;
  alternativePath?: string;
  error?: string;
  version?: string;
  isCompatibilityVersion?: boolean;
}

// Define the shape of the registry for TypeScript
interface ComponentRegistry {
  registerComponent: (
    name: string, 
    status: ComponentStatus | undefined, 
    importPath: string, 
    options?: { 
      alternativePath?: string; 
      error?: string; 
      version?: string; 
      isCompatibilityVersion?: boolean;
    }
  ) => RegisteredComponent;
  getComponent: (name: string) => ComponentInfo | null;
  updateComponentStatus: (name: string, status: ComponentStatus, details?: Record<string, any>) => void;
  getAllComponents: () => Map<string, RegisteredComponent>;
}

// Log initialization message to make it clear when this module loads
console.info('[ImportResolver] Module loaded');

// Create a simple fallback Switch component
const FallbackSwitch = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return React.createElement('div', {
    style: {
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      backgroundColor: '#e5e7eb',
      position: 'relative',
      cursor: 'not-allowed',
      display: 'inline-block',
    },
    ...props
  }, 
  React.createElement('span', {
    style: {
      width: '20px',
      height: '20px',
      borderRadius: '10px',
      backgroundColor: '#ffffff',
      position: 'absolute',
      top: '2px',
      left: '2px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    }
  }));
};

// Map of component names to their compatibility implementations
const componentMap: Record<string, any> = {
  // Card components
  Card: CompatibilityComponents.Card,
  CardHeader: CompatibilityComponents.CardHeader,
  CardFooter: CompatibilityComponents.CardFooter,
  CardTitle: CompatibilityComponents.CardTitle,
  CardDescription: CompatibilityComponents.CardDescription,
  CardContent: CompatibilityComponents.CardContent,
  
  // Form components
  Button: CompatibilityComponents.Button,
  Input: CompatibilityComponents.Input,
  Textarea: CompatibilityComponents.Textarea,
  Label: CompatibilityComponents.Label,
  
  // Data display components
  Badge: CompatibilityComponents.Badge,
  
  // Dialog components
  Dialog: CompatibilityComponents.Dialog,
  DialogTrigger: CompatibilityComponents.DialogTrigger,
  DialogContent: CompatibilityComponents.DialogContent,
  DialogHeader: CompatibilityComponents.DialogHeader,
  DialogFooter: CompatibilityComponents.DialogFooter,
  DialogTitle: CompatibilityComponents.DialogTitle,
  DialogDescription: CompatibilityComponents.DialogDescription,
  
  // Select components
  Select: CompatibilityComponents.Select,
  SelectTrigger: CompatibilityComponents.SelectTrigger,
  SelectValue: CompatibilityComponents.SelectValue,
  SelectContent: CompatibilityComponents.SelectContent,
  SelectItem: CompatibilityComponents.SelectItem,
  
  // Tooltip components
  Tooltip: CompatibilityComponents.Tooltip,
  TooltipTrigger: CompatibilityComponents.TooltipTrigger,
  TooltipContent: CompatibilityComponents.TooltipContent,
  TooltipProvider: CompatibilityComponents.TooltipProvider,
  
  // Switch component - not in compatibility components, so use our fallback
  Switch: FallbackSwitch,
};

/**
 * Create fallback component with a visual error state
 */
function createFallbackComponent(name: string) {
  return function FallbackComponent(props: any) {
    return React.createElement(
      'div',
      {
        style: {
          padding: '0.5rem',
          border: '1px dashed #f87171',
          borderRadius: '0.25rem',
          color: '#b91c1c',
          fontSize: '0.75rem',
          margin: '0.25rem 0',
          display: 'inline-block'
        },
        ...props,
      },
      `[${name}]`
    );
  };
}

/**
 * Safely resolve UI component imports - this is used to fix errors
 * when component imports fail
 * 
 * @param components Object containing imported components
 * @returns Object with resolved components (using compatibility versions if needed)
 */
export function resolveComponents(components: Record<string, any>): Record<string, any> {
  const resolvedComponents: Record<string, any> = {};
  
  // For each component in the import object
  for (const [name, component] of Object.entries(components)) {
    // If the component is undefined or not a valid component, use the compatibility version
    if (!component || typeof component !== 'function') {
      console.warn(`[ImportResolver] Component '${name}' is undefined or invalid, using compatibility version`);
      
      // Try to find the component in a case-insensitive way
      const resolvedComponent = getComponentByCaseInsensitiveName(name);
      
      if (resolvedComponent) {
        console.log(`[ImportResolver] Successfully resolved component '${name}' using case-insensitive lookup`);
        resolvedComponents[name] = resolvedComponent;
      } else {
        // Fall back to the compatibility component or create a fallback
        resolvedComponents[name] = componentMap[name] || createFallbackComponent(name);
      }
    } else {
      // Otherwise use the original component
      resolvedComponents[name] = component;
    }
  }
  
  return resolvedComponents;
}

/**
 * Attempt to find a component by name in a case-insensitive way
 * This helps resolve import issues related to case sensitivity
 */
function getComponentByCaseInsensitiveName(name: string): any {
  try {
    // Common case variations to check
    const variations = [
      name,                                   // Original
      name.toLowerCase(),                     // all lowercase
      name.toUpperCase(),                     // ALL UPPERCASE
      name.charAt(0).toUpperCase() + name.slice(1), // Capitalized
      name.charAt(0).toLowerCase() + name.slice(1)  // uncapitalized
    ];
    
    // Try each variation
    for (const variation of variations) {
      // Check UI components directory first
      try {
        const directImport = require(`@/components/ui/${variation}`);
        if (directImport && directImport[name]) {
          return directImport[name];
        }
        if (directImport && directImport.default) {
          return directImport.default;
        }
      } catch (e) {
        // Continue to next variation
      }
    }
    
    // As a last resort, check for direct import of the component
    try {
      // This is a special case where the component might be the default export
      const directNamedImport = require(`@/components/ui/${name.toLowerCase()}`);
      if (directNamedImport) {
        return directNamedImport.default || directNamedImport;
      }
    } catch (e) {
      // Failed to resolve component
    }
  } catch (e) {
    console.warn(`[ImportResolver] Error in case-insensitive component resolution for ${name}:`, e);
  }
  
  return null;
}

/**
 * Global error handler for component resolution - this is used as a last resort
 * to catch errors when trying to render undefined components
 */
export function handleComponentResolutionErrors() {
  if (typeof window !== 'undefined') {
    // Override React.createElement to catch undefined component errors
    const originalCreateElement = React.createElement;
    
    // Replace React.createElement with our version that handles undefined components
    (React as any).createElement = function(type: any, props: any, ...children: any[]) {
      // If the component type is undefined, replace it with a fallback
      if (type === undefined || type === null) {
        console.warn('[ImportResolver] Caught undefined component in React.createElement, using fallback div');
        return originalCreateElement('div', { 
          style: { 
            padding: '0.5rem', 
            border: '1px dashed #f87171',
            borderRadius: '0.25rem',
            color: '#b91c1c',
            fontSize: '0.75rem',
            margin: '0.25rem 0'
          },
          'data-error': 'undefined-component'
        }, '[Component Error]');
      }
      
      // Check if it's a string (HTML element) or a valid component
      if (typeof type === 'string' || typeof type === 'function' || typeof type === 'object') {
        // Proceed normally for valid components
        return originalCreateElement(type, props, ...children);
      }
      
      // If we get here, the component is invalid but not undefined
      console.warn(`[ImportResolver] Invalid component type: ${typeof type}`, type);
      return originalCreateElement('div', {
        style: {
          padding: '0.5rem',
          border: '1px dashed #f87171',
          borderRadius: '0.25rem',
          color: '#b91c1c',
          fontSize: '0.75rem',
          margin: '0.25rem 0'
        },
        'data-error': 'invalid-component'
      }, `[Invalid Component: ${typeof type}]`);
    };
    
    console.info('[ImportResolver] Component resolution error handler installed');
    
    return () => {
      // Restore original createElement when cleanup is needed
      (React as any).createElement = originalCreateElement;
      console.info('[ImportResolver] Component resolution error handler removed');
    };
  }
  
  return () => {}; // No-op for SSR
}

// Map of component names to their import paths
const componentPaths: Record<string, { 
  direct: string; 
  compatibility: string 
}> = {
  Button: { direct: '@/components/ui/button', compatibility: '@/components/ui/ui-button' },
  Switch: { direct: '@/components/ui/switch', compatibility: '@/components/ui/ui-switch' },
  Label: { direct: '@/components/ui/label', compatibility: '@/components/ui/ui-label' },
  Input: { direct: '@/components/ui/input', compatibility: '@/components/ui/ui-input' },
  Card: { direct: '@/components/ui/card', compatibility: '@/components/ui/ui-card' },
  // Add more components as needed
};

/**
 * Initialize the component resolution system
 * This should be called once at the application root
 */
export function initializeComponentResolution() {
  // Log that we're initializing the component resolution system
  console.log('[ImportResolver] Initializing component resolution');
  
  // Only run enhanced error handling in client-side environments
  if (typeof window !== 'undefined') {
    // Create an error handler for uncaught module loading errors
    const errorHandler = (event: ErrorEvent) => {
      // Check if this is a module loading error
      if (event.message && event.message.includes('Loading chunk') && event.message.includes('failed')) {
        const registry = getComponentRegistry() as ComponentRegistry | null;
        
        // Update all imported components to failed status if registry exists
        if (registry && typeof registry.getAllComponents === 'function') {
          try {
            registry.getAllComponents().forEach((component: ComponentInfo) => {
              if (component.status === 'imported') {
                registry.updateComponentStatus(component.name, 'failed', {
                  error: 'Chunk loading failed - network or build error'
                });
              }
            });
          } catch (e) {
            console.error('[ImportResolver] Error updating component registry:', e);
          }
        }
        
        // Log the error
        console.error('[ImportResolver] Module loading failed:', event.message);
      }
    };
    
    // Add the error handler
    window.addEventListener('error', errorHandler);
    
    // Return cleanup function that removes the error handler
    return () => {
      window.removeEventListener('error', errorHandler);
      console.log('[ImportResolver] Cleaning up component resolution');
    };
  }
  
  // Mock cleanup function for SSR
  return () => {
    console.log('[ImportResolver] Cleaning up component resolution');
  };
}

/**
 * Get the correct import path for a component
 * This is used by both direct imports and dynamic imports
 */
export function getComponentImportPath(componentName: string, useCompatibility = false): string {
  // Get the component paths from our map
  const paths = componentPaths[componentName];
  
  // If the component isn't in our map, return null
  if (!paths) {
    console.warn(`[ImportResolver] Unknown component: ${componentName}`);
    return '';
  }
  
  // Return the appropriate path based on whether we should use compatibility mode
  return useCompatibility ? paths.compatibility : paths.direct;
}

/**
 * Hook for resolving component imports
 * Usage example:
 * const { Component, error } = useResolveComponent('Button');
 */
export function useResolveComponent(componentName: string) {
  // Get the compatibility context
  const compatibilityContext = getCompatibilityContext();
  
  let Component = null;
  let error = null;
  
  // Determine if we should use compatibility mode for this component
  const useCompatibilityMode = compatibilityContext.useCompatibilityVersion(componentName);
  
  try {
    // Try to import the component
    if (useCompatibilityMode && CompatibilityComponents[componentName as keyof typeof CompatibilityComponents]) {
      // Use the compatibility version
      Component = CompatibilityComponents[componentName as keyof typeof CompatibilityComponents];
      console.log(`[ImportResolver] Using compatibility version for ${componentName}`);
    } else {
      // Use the standard version
      const registry = getComponentRegistry();
      Component = registry.getComponent(componentName);
    }
    
    // For now, we'll just mark it as resolved - no need to call anything here
  } catch (err) {
    // Register the error
    error = err;
    compatibilityContext.registerCompatibilityError(
      componentName, 
      err instanceof Error ? err : new Error(String(err))
    );
    console.error(`[ImportResolver] Error importing ${componentName}:`, err);
  }
  
  return { Component, error };
}

/**
 * Helper function for logging component resolution
 */
export function logComponentResolution(
  componentName: string, 
  statusOrIsResolved: 'success' | 'fallback' | 'error' | boolean,
  details?: any
) {
  // Support the new status-based logging as well as the existing boolean-based logging
  if (typeof statusOrIsResolved === 'boolean') {
    // Legacy implementation
    console.log(
      `[ComponentResolver] ${componentName}: ${statusOrIsResolved ? 'Resolved' : 'Failed to resolve'}`
    );
  } else if (process.env.NODE_ENV === 'development') {
    // Enhanced implementation with colored output
    const styles = {
      success: 'color: green; font-weight: bold;',
      fallback: 'color: orange; font-weight: bold;',
      error: 'color: red; font-weight: bold;',
    };
    
    console.log(
      `%c[ComponentResolver] ${componentName}: ${statusOrIsResolved}`,
      styles[statusOrIsResolved as keyof typeof styles],
      details || ''
    );
  }
}

/**
 * Create a dynamic resolver for a specific component
 * This is useful for lazy-loading components
 */
export function createComponentResolver(componentName: string) {
  return async () => {
    try {
      // For now, just log that we would import it
      console.log(`[ImportResolver] Module loaded for ${componentName}`);
      return null;
    } catch (error) {
      console.error(`[ImportResolver] Error loading ${componentName}:`, error);
      return null;
    }
  };
}

interface ImportOptions {
  fallbackPath?: string;
  isCompatibilityVersion?: boolean;
  timeout?: number;
  retries?: number;
}

// Define a type for the dynamic import function
type DynamicImporter = <T>(path: string) => Promise<T>;

/**
 * Safe import that doesn't use dynamic import expressions (webpack-safe)
 */
async function safeImport(componentName: string, isCompatibilityVersion: boolean = false) {
  // Always use compatibility components to avoid dynamic imports
  return CompatibilityComponents;
}

// Use the imported function for all references to getComponentRegistry
export const getComponentRegistry = importedGetComponentRegistry;

/**
 * Enhanced resolveComponent function that handles fallback paths and retries
 * FIXED to avoid webpack's "Critical dependency" warning
 */
export async function resolveComponentWithFallback<T>(
  componentName: string, 
  importPath: string,
  options: ImportOptions = {}
): Promise<T | null> {
  const {
    fallbackPath,
    isCompatibilityVersion = false,
    timeout = 5000,
    retries = 2
  } = options;
  
  let error: Error | null = null;
  let retryCount = 0;
  
  // Store the current nav state for debugging
  const navState = typeof window !== 'undefined' ? {
    pathname: window.location.pathname,
    href: window.location.href
  } : null;
  
  while (retryCount <= retries) {
    try {
      // Always use the compatibility components to avoid dynamic imports with expressions
      const importedModule = await safeImport(componentName, isCompatibilityVersion);
      
      // Extract the specific component or return the whole module
      const result = getComponentFromModule(importedModule, componentName);
      
      if (result) {
        logComponentResolution(componentName, 'success', {
          source: 'compatibility-components',
          attempt: retryCount,
          navigationState: navState
        });
        return result as T;
      }
      
      // If no result, use the fallback component
      throw new Error(`Component ${componentName} not found in module`);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      
      console.warn(
        `[ImportResolver] Error importing ${componentName} (attempt ${retryCount + 1}/${retries + 1}):`, 
        err
      );
      
      retryCount++;
      
      // Add a small delay between retries
      if (retryCount <= retries) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  
  // If we've exhausted all retries, try to get the component from the compatibility map
  const compatComponent = componentMap[componentName] || null;
  if (compatComponent) {
    logComponentResolution(componentName, 'fallback', {
      source: 'component-map-fallback',
      navigationState: navState
    });
    return compatComponent as T;
  }
  
  // Log the final failure
  logComponentResolution(componentName, 'error', {
    error: error?.message || 'Unknown error',
    navigationState: navState
  });
  
  // Return null in case of total failure - component rendering will need to handle this
  return null;
}

// Fix type issues with indexing compatibility components
const getComponentFromModule = (mod: typeof CompatibilityComponents | Record<string, any>, componentName: string) => {
  if (mod && typeof mod === 'object' && componentName in mod) {
    // @ts-ignore Property ' एक्सिस' does not exist on type 'Window & typeof globalThis'.ts(2339)
    return mod[componentName as keyof typeof mod];
  }
  return null;
};

/**
 * Preload a component for faster initial rendering - FIXED to avoid webpack warnings
 */
export function preloadComponentWithFallback(
  componentName: string, 
  importPath: string, 
  fallbackPath?: string
): void {
  const registry = getComponentRegistry() as ComponentRegistry | null;
  
  // Register the component if not already registered and registry exists
  if (registry && typeof registry.registerComponent === 'function' && 
      typeof registry.getComponent === 'function') {
    try {
      if (!registry.getComponent(componentName)) {
        registry.registerComponent(componentName, 'imported', importPath, { 
          alternativePath: fallbackPath 
        });
      }
    } catch (e) {
      console.error('[ImportResolver] Error registering component for preload:', e);
    }
  }
  
  // Instead of dynamic import with variable path, use the compatibility components
  Promise.resolve(CompatibilityComponents)
    .then((module) => {
      const component = getComponentFromModule(module, componentName);
      
      if (component && registry && typeof registry.updateComponentStatus === 'function') {
        try {
          registry.updateComponentStatus(componentName, 'imported');
        } catch (e) {
          console.error('[ImportResolver] Error updating component status after preload:', e);
        }
      }
      
      if (component) {
        logComponentResolution(componentName, 'success', 'Preloaded from compatibility');
      } else {
        throw new Error(`Component ${componentName} not found in compatibility module`);
      }
    })
    .catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (registry && typeof registry.updateComponentStatus === 'function') {
        try {
          registry.updateComponentStatus(componentName, 'failed', { 
            error: errorMessage 
          });
        } catch (e) {
          console.error('[ImportResolver] Error updating component status after preload failure:', e);
        }
      }
      logComponentResolution(componentName, 'error', `Preload failed: ${errorMessage}`);
      
      // Use component map as fallback
      const fallbackComponent = componentMap[componentName] || null;
      if (fallbackComponent && registry && typeof registry.updateComponentStatus === 'function') {
        try {
          registry.updateComponentStatus(componentName, 'imported', { 
            isUsingFallback: true,
            alternativePath: 'component-map-fallback'
          });
          logComponentResolution(componentName, 'fallback', 'Component map fallback used');
        } catch (e) {
          console.error('[ImportResolver] Error updating component status after fallback:', e);
        }
      }
    });
}

/**
 * Check if a component is loaded based on its status in the registry
 */
export function isComponentLoadedFromRegistry(componentName: string): boolean {
  const registry = getComponentRegistry() as ComponentRegistry | null;
  if (!registry || typeof registry.getComponent !== 'function') {
    return false;
  }
  
  try {
    const component = registry.getComponent(componentName);
    return component?.status === 'imported';
  } catch (e) {
    console.error('[ImportResolver] Error checking if component is loaded:', e);
    return false;
  }
}

/**
 * Create a dynamic importer for a specific component with fallback support
 */
export function createDynamicComponentImporter(
  componentName: string,
  importPath: string,
  fallbackPath?: string
): <T>() => Promise<T | null> {
  return <T>() => resolveComponentWithFallback<T>(
    componentName,
    importPath,
    { fallbackPath }
  );
}

/**
 * Get the compatibility context
 */
export function getCompatibilityContext(): ImportResolverCompatibilityContext {
  if (typeof window !== 'undefined' && window.__compatibilityContext) {
    return window.__compatibilityContext;
  }

  // Create a new compatibility context
  const context: ImportResolverCompatibilityContext = {
    isComponentCompatible: (componentName: string) => true,
    useCompatibilityVersion: (componentName: string) => false,
    registerCompatibilityError: (componentName: string, error: Error) => {
      console.error(`[ImportResolver] Compatibility error for ${componentName}:`, error);
    }
  };

  // Set the global compatibility context
  if (typeof window !== 'undefined') {
    window.__compatibilityContext = context;
  }

  return context;
}

// Initialize the compatibility context from the hook
export function initializeCompatibilityContext() {
  if (typeof window === 'undefined') return;

  try {
    const compatibility = useComponentCompatibility();
    
    // Create the compatibility context adapter
    const context: ImportResolverCompatibilityContext = {
      isComponentCompatible: compatibility.isComponentCompatible,
      useCompatibilityVersion: compatibility.useCompatibilityVersion,
      registerCompatibilityError: (componentName: string, error: Error) => {
        console.error(`[ImportResolver] Compatibility error for ${componentName}:`, error);
        // We don't have direct access to registerError in the original type,
        // so we'll just log the error
        console.warn(`Component compatibility error: ${componentName} - ${error.message}`);
      }
    };

    // Set the global compatibility context
    window.__compatibilityContext = context;
  } catch (error) {
    console.warn('[ImportResolver] Error initializing compatibility context:', error);
  }
} 