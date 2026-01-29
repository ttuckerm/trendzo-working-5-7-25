"use client";

/**
 * React DOM Patch
 * 
 * This utility directly patches React's DOM operations to prevent the infamous
 * "insertBefore" and "removeChild" errors during reconciliation.
 * 
 * It works by applying defensive programming techniques to the raw DOM APIs
 * before React tries to use them, preventing errors when React's internal state
 * doesn't match the actual DOM.
 */

// Skip applying patches on the server side
if (typeof window !== 'undefined') {
  console.info('[ReactDOMPatch] Initializing patches...');

  // Save the original methods
  const originalInsertBefore = Node.prototype.insertBefore;
  const originalRemoveChild = Node.prototype.removeChild;
  const originalAppendChild = Node.prototype.appendChild;
  const originalInsertAdjacentElement = Element.prototype.insertAdjacentElement;

  // Handle "The node before which the new node is to be inserted is not a child of this node"
  Node.prototype.insertBefore = function<T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      // Try the original method first
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch (error) {
      console.warn('[ReactDOMPatch] Error in insertBefore, using fallback:', error);
      
      // Check if the reference node is actually in the DOM
      if (referenceNode && !this.contains(referenceNode)) {
        console.info('[ReactDOMPatch] Reference node not found, appending instead');
        try {
          return this.appendChild(newNode) as T;
        } catch (appendError) {
          console.error('[ReactDOMPatch] Both insertBefore and appendChild failed', appendError);
        }
      } else {
        // If no reference node or contains check fails, try appending
        try {
          return this.appendChild(newNode) as T;
        } catch (appendError) {
          console.error('[ReactDOMPatch] Fallback appendChild failed', appendError);
        }
      }
      
      // Return the node unchanged if all else fails
      return newNode;
    }
  };

  // Handle "The node to be removed is not a child of this node"
  Node.prototype.removeChild = function<T extends Node>(child: T): T {
    try {
      // Try the original method first
      return originalRemoveChild.call(this, child) as T;
    } catch (error) {
      console.warn('[ReactDOMPatch] Error in removeChild, ignoring:', error);
      
      // If the child is still in the DOM but not a direct child of this node
      // try to find its parent and remove it properly
      if (child.parentNode && child.parentNode !== this) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch (removeError) {
          console.error('[ReactDOMPatch] Failed to remove from actual parent', removeError);
        }
      }
      
      // If all else fails, just return the node
      return child;
    }
  };

  // Patch appendChild to be more resilient too
  Node.prototype.appendChild = function<T extends Node>(child: T): T {
    try {
      // Try the original method first
      return originalAppendChild.call(this, child) as T;
    } catch (error) {
      console.warn('[ReactDOMPatch] Error in appendChild, using fallback:', error);
      
      // If the node is already in the DOM elsewhere, remove it first
      if (child.parentNode && child.parentNode !== this) {
        try {
          child.parentNode.removeChild(child);
          return originalAppendChild.call(this, child) as T;
        } catch (appendError) {
          console.error('[ReactDOMPatch] Failed to appendChild after removing from parent', appendError);
        }
      }
      
      // Return the node unchanged if all else fails
      return child;
    }
  };

  // Patch insertAdjacentElement for completeness
  Element.prototype.insertAdjacentElement = function(position: InsertPosition, element: Element): Element | null {
    try {
      // Try the original method first
      return originalInsertAdjacentElement.call(this, position, element);
    } catch (error) {
      console.warn('[ReactDOMPatch] Error in insertAdjacentElement, using fallback:', error);
      
      // Try to recover based on position
      try {
        if (position === 'beforebegin' && this.parentNode) {
          return this.parentNode.insertBefore(element, this) as Element;
        } else if (position === 'afterbegin') {
          return this.insertBefore(element, this.firstChild) as Element;
        } else if (position === 'beforeend') {
          return this.appendChild(element) as Element;
        } else if (position === 'afterend' && this.parentNode) {
          return this.parentNode.insertBefore(element, this.nextSibling) as Element;
        }
      } catch (fallbackError) {
        console.error('[ReactDOMPatch] Fallback for insertAdjacentElement failed', fallbackError);
      }
      
      return null;
    }
  };

  // Add global error handler for React DOM errors
  window.addEventListener('error', (event: ErrorEvent) => {
    if (event.error && event.error.message && 
        (event.error.message.toLowerCase().includes('insertbefore') || 
         event.error.message.toLowerCase().includes('removechild') ||
         event.error.message.toLowerCase().includes('not a child'))) {
      
      console.warn('[ReactDOMPatch] Caught DOM error in global handler:', event.error.message);
      
      // Prevent the error from crashing the application
      event.preventDefault();
      return true;
    }
    return false;
  });

  console.info('[ReactDOMPatch] Patches applied successfully');
}

export function applyReactDOMPatches(): () => void {
  // This function is primarily for explicit calls in components if needed
  // The patches are already applied when the module is imported
  
  // Return a no-op cleanup function
  return () => {
    console.info('[ReactDOMPatch] Cleanup called (no-op as patches are global)');
  };
} 