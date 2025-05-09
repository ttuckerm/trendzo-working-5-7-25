"use client";

import { logComponentResolution } from './import-resolver';

// Component registry types
export type ComponentStatus = 'registered' | 'imported' | 'failed' | 'deprecated';

export interface RegisteredComponent {
  name: string;
  status: ComponentStatus;
  importPath: string;
  alternativePath?: string;
  error?: string;
  lastUpdated: Date;
  version?: string;
  isCompatibilityVersion: boolean;
}

// Singleton registry to track all components
class ComponentRegistry {
  private static instance: ComponentRegistry;
  private components: Map<string, RegisteredComponent> = new Map();
  private listeners: Array<(components: Map<string, RegisteredComponent>) => void> = [];

  private constructor() {
    // Initialize with empty registry
    console.log('[ComponentRegistry] Initializing component registry');
  }

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  /**
   * Register a component in the registry
   */
  public registerComponent(
    name: string, 
    status: ComponentStatus = 'registered',
    importPath: string,
    options: {
      alternativePath?: string;
      error?: string;
      version?: string;
      isCompatibilityVersion?: boolean;
    } = {}
  ): RegisteredComponent {
    const component: RegisteredComponent = {
      name,
      status,
      importPath,
      alternativePath: options.alternativePath,
      error: options.error,
      lastUpdated: new Date(),
      version: options.version,
      isCompatibilityVersion: options.isCompatibilityVersion || false
    };

    this.components.set(name, component);
    this.notifyListeners();
    
    logComponentResolution(name, status !== 'failed');
    return component;
  }

  /**
   * Update a component's status
   */
  public updateComponentStatus(name: string, status: ComponentStatus, error?: string): void {
    const component = this.components.get(name);
    if (!component) {
      console.warn(`[ComponentRegistry] Cannot update status for unknown component: ${name}`);
      return;
    }

    component.status = status;
    component.error = error;
    component.lastUpdated = new Date();
    
    this.components.set(name, component);
    this.notifyListeners();
    
    if (status === 'failed') {
      console.error(`[ComponentRegistry] Component ${name} failed to load: ${error}`);
    } else if (status === 'imported') {
      console.log(`[ComponentRegistry] Component ${name} successfully imported`);
    }
  }

  /**
   * Get a component by name
   */
  public getComponent(name: string): RegisteredComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Get all registered components
   */
  public getAllComponents(): Map<string, RegisteredComponent> {
    return new Map(this.components);
  }

  /**
   * Check if a component should use compatibility version
   */
  public shouldUseCompatibilityVersion(name: string): boolean {
    const component = this.components.get(name);
    if (!component) return false;
    
    return component.status === 'failed' || component.isCompatibilityVersion;
  }

  /**
   * Subscribe to registry changes
   */
  public subscribe(callback: (components: Map<string, RegisteredComponent>) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of registry changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.components);
    }
  }

  /**
   * Generate a report of all components
   */
  public generateReport(): string {
    let report = "Component Registry Report\n";
    report += "=========================\n\n";
    
    const components = Array.from(this.components.values());
    
    // Count by status
    const statusCounts = components.reduce((acc, component) => {
      acc[component.status] = (acc[component.status] || 0) + 1;
      return acc;
    }, {} as Record<ComponentStatus, number>);
    
    report += "Status Summary:\n";
    for (const [status, count] of Object.entries(statusCounts)) {
      report += `- ${status}: ${count}\n`;
    }
    
    report += "\nComponent Details:\n";
    components.forEach(component => {
      report += `\n${component.name} (${component.status})\n`;
      report += `  Import Path: ${component.importPath}\n`;
      if (component.alternativePath) {
        report += `  Alternative Path: ${component.alternativePath}\n`;
      }
      if (component.error) {
        report += `  Error: ${component.error}\n`;
      }
      report += `  Last Updated: ${component.lastUpdated.toISOString()}\n`;
      report += `  Compatibility Version: ${component.isCompatibilityVersion ? 'Yes' : 'No'}\n`;
    });
    
    return report;
  }
}

// Export a function to get the registry instance
export function getComponentRegistry(): ComponentRegistry {
  return ComponentRegistry.getInstance();
}

// Hook to use the component registry
export function useComponentRegistry() {
  const registry = getComponentRegistry();
  
  return {
    registerComponent: registry.registerComponent.bind(registry),
    updateComponentStatus: registry.updateComponentStatus.bind(registry),
    getComponent: registry.getComponent.bind(registry),
    getAllComponents: registry.getAllComponents.bind(registry),
    shouldUseCompatibilityVersion: registry.shouldUseCompatibilityVersion.bind(registry),
    subscribe: registry.subscribe.bind(registry),
    generateReport: registry.generateReport.bind(registry)
  };
} 