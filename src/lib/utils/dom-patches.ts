"use client";

/**
 * DOM Patches
 * 
 * This utility directly patches problematic DOM methods to prevent common React errors
 * from crashing the application. It focuses on the methods most commonly causing issues:
 * - insertBefore
 * - removeChild
 * 
 * These errors typically happen during React reconciliation when the DOM structure
 * doesn't match what React expects.
 */

export function applyDOMPatches() {
  if (typeof window === 'undefined') return () => {};
  
  console.info('[DOMPatches] Applying DOM method patches to prevent common React errors');
  
  // Save original methods
  const originalInsertBefore = Node.prototype.insertBefore;
  const originalRemoveChild = Node.prototype.removeChild;
  
  // Patch insertBefore
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      // Try original method first
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      console.warn('[DOMPatches] Error in insertBefore, using fallback:', error);
      
      // If the reference node is not a child, just append the new node
      if (referenceNode && !this.contains(referenceNode)) {
        console.info('[DOMPatches] Reference node not found, appending instead');
        this.appendChild(newNode);
        return newNode;
      }
      
      // If that also fails, at least don't crash the app
      try {
        this.appendChild(newNode);
      } catch (e) {
        console.error('[DOMPatches] Both insertBefore and append failed');
      }
      
      // Return the original node regardless of what happened
      return newNode;
    }
  };
  
  // Patch removeChild
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      // Try original method first
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      console.warn('[DOMPatches] Error in removeChild, ignoring:', error);
      // If the child is not a child of this node, just return it
      return child;
    }
  };
  
  // Return cleanup function
  return function cleanup() {
    Node.prototype.insertBefore = originalInsertBefore;
    Node.prototype.removeChild = originalRemoveChild;
    console.info('[DOMPatches] DOM patches removed');
  };
}

/**
 * Apply DOM patches and handle exceptions that may occur in React rendering
 */
export function useDOMPatches() {
  if (typeof window === 'undefined') return () => {};
  
  // Apply patches immediately
  const cleanup = applyDOMPatches();
  
  // Add a global error handler for related errors
  const errorHandler = (event: ErrorEvent) => {
    if (event.error && event.error.message) {
      const msg = event.error.message.toLowerCase();
      // Check for common React DOM errors
      if ((msg.includes('insertbefore') || msg.includes('removechild') || 
           msg.includes('not a child') || msg.includes('target container')) && 
          !event.defaultPrevented) {
        console.warn('[DOMPatches] Caught DOM mutation error, preventing crash:', event.error.message);
        event.preventDefault();
        return true;
      }
    }
    return false;
  };
  
  window.addEventListener('error', errorHandler);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('error', errorHandler);
    cleanup();
  };
} 