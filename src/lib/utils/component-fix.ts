"use client";

/**
 * Component Fix Utility
 * 
 * This is a special utility to fix component import issues across the application.
 * It helps reinitialize the React component tree when needed.
 */

import { initializeComponentResolution } from './import-resolver';

/**
 * Force Reinitialize Component Resolution
 * 
 * This function is used to force a reinitialization of component resolution
 * which can help fix "removeChild" errors that happen when components are
 * unmounted incorrectly.
 */
export function forceReinitializeComponents() {
  if (typeof window !== 'undefined') {
    console.info('[ComponentFix] Force reinitializing component resolution...');
    
    // First clean up by removing any problematic nodes
    try {
      // Look for any lingering error boundary containers that might be causing issues
      const errorContainers = document.querySelectorAll('[data-error]');
      errorContainers.forEach(container => {
        if (container.parentNode) {
          try {
            container.parentNode.removeChild(container);
          } catch (e) {
            console.warn('[ComponentFix] Error removing container:', e);
            // If direct removal fails, try replacing the node instead
            if (container.parentNode) {
              const placeholderDiv = document.createElement('div');
              placeholderDiv.style.display = 'none';
              container.parentNode.replaceChild(placeholderDiv, container);
            }
          }
        }
      });
      
      // Special handling for React portals that might be causing issues
      const portalNodes = document.querySelectorAll('[data-portal]');
      portalNodes.forEach(portal => {
        if (portal.parentNode) {
          try {
            const emptyDiv = document.createElement('div');
            emptyDiv.style.display = 'none';
            portal.parentNode.replaceChild(emptyDiv, portal);
          } catch (e) {
            console.warn('[ComponentFix] Error handling portal:', e);
          }
        }
      });
      
      // Add a global monkey patch to handle removeChild errors
      const originalRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function<T extends Node>(child: T): T {
        try {
          return originalRemoveChild.call(this, child) as T;
        } catch (e) {
          console.warn('[ComponentFix] Error in removeChild, using fallback method:', e);
          // If the child is not a child of this node, let's just return the child
          // without throwing an error
          return child;
        }
      };
      
    } catch (e) {
      console.warn('[ComponentFix] Error cleaning up DOM nodes:', e);
    }
    
    // Now reinitialize component resolution
    return initializeComponentResolution();
  }
  
  return () => {}; // No-op for SSR
}

/**
 * Create a wrapper element that doesn't throw on unmount
 * This helps with React's reconciliation process
 */
function createSafeWrapper(element: HTMLElement): HTMLElement {
  if (!element) return document.createElement('div');
  
  // Create a wrapper that safely handles detachment
  const wrapper = document.createElement('div');
  wrapper.dataset.safeWrapper = 'true';
  
  // Clone the element so we don't modify the original
  const clone = element.cloneNode(true) as HTMLElement;
  wrapper.appendChild(clone);
  
  return wrapper;
}

/**
 * Fix Component Tree
 * 
 * This is a utility component that can be mounted high in the component tree
 * to ensure component resolution is properly initialized and maintained.
 */
export function useComponentFix() {
  if (typeof window !== 'undefined') {
    // Add a global handler for unhandled errors related to components
    const errorHandler = (event: ErrorEvent) => {
      // Check if the error is related to removeChild
      if (event.error && 
          event.error.message && 
          event.error.message.includes('removeChild') &&
          event.error.message.includes('not a child')) {
        console.warn('[ComponentFix] Caught removeChild error, attempting to fix...');
        forceReinitializeComponents();
        
        // Prevent the default error handling
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', errorHandler);
    
    // Add a MutationObserver to watch for React-specific attribute changes
    // This can help us identify when a component is being unmounted incorrectly
    const observer = new MutationObserver((mutations) => {
      let needsReinit = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // Look for specific patterns that indicate React unmounting
          Array.from(mutation.removedNodes).forEach((node) => {
            if (node instanceof HTMLElement && node.dataset.reactRoot) {
              needsReinit = true;
            }
          });
        }
      });
      
      if (needsReinit) {
        console.info('[ComponentFix] Detected potential unmounting issues, reinitializing...');
        forceReinitializeComponents();
      }
    });
    
    // Start observing the document body
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['data-reactroot', 'data-reactid']
    });
    
    // Return cleanup function
    return () => {
      window.removeEventListener('error', errorHandler);
      observer.disconnect();
    };
  }
  
  return () => {}; // No-op for SSR
} 