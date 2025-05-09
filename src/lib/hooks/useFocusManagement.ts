'use client';

import { useRef, useEffect, useCallback } from 'react';

interface FocusManagerOptions {
  /**
   * Whether to auto-focus the container element when mounted
   */
  autoFocus?: boolean;
  
  /**
   * Whether to restore focus to the previously focused element when unmounted
   */
  restoreOnUnmount?: boolean;
  
  /**
   * Whether to trap focus within the container
   */
  trapFocus?: boolean;
  
  /**
   * Selectors for elements that should not receive focus when trap is active
   */
  excludeSelectors?: string[];
  
  /**
   * Callback when focus is trapped
   */
  onFocusTrapped?: () => void;
  
  /**
   * Callback when focus is restored
   */
  onFocusRestored?: () => void;
}

/**
 * Hook for managing focus in components like modals, dialogs, and drawers
 * 
 * @param options - Focus management options
 * @returns Object with focus management utilities
 * 
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { focusRef, restoreFocus } = useFocusManagement({
 *     autoFocus: true,
 *     trapFocus: true,
 *     restoreOnUnmount: true
 *   });
 *   
 *   useEffect(() => {
 *     if (!isOpen) {
 *       restoreFocus();
 *     }
 *   }, [isOpen, restoreFocus]);
 *   
 *   return isOpen ? (
 *     <div ref={focusRef} tabIndex={-1}>
 *       {/* Modal content */}
 *     </div>
 *   ) : null;
 * }
 * ```
 */
export function useFocusManagement(options: FocusManagerOptions = {}) {
  const {
    autoFocus = true,
    restoreOnUnmount = true,
    trapFocus = false,
    excludeSelectors = ['[aria-hidden="true"]', '[tabindex="-1"]'],
    onFocusTrapped,
    onFocusRestored,
  } = options;
  
  // Refs for tracking elements and state
  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const firstFocusableElement = useRef<HTMLElement | null>(null);
  const lastFocusableElement = useRef<HTMLElement | null>(null);
  const isFocusTrapped = useRef<boolean>(false);
  
  // Get all focusable elements within a container
  const getFocusableElements = useCallback((container: HTMLElement) => {
    // Standard focusable elements selector
    const selector = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable=true]:not([tabindex="-1"])',
    ].join(', ');
    
    // Get all potentially focusable elements
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
    
    // Filter out elements matching exclusion selectors
    return elements.filter((element) => {
      // Skip hidden elements
      if (element.offsetWidth === 0 && element.offsetHeight === 0) {
        return false;
      }
      
      // Check against exclusion selectors
      for (const excludeSelector of excludeSelectors) {
        if (element.matches(excludeSelector) || element.closest(excludeSelector)) {
          return false;
        }
      }
      
      return true;
    });
  }, [excludeSelectors]);
  
  // Trap focus within the container
  const trapFocusInContainer = useCallback(() => {
    if (!containerRef.current || !trapFocus) return;
    
    // Save previously focused element if not already stored
    if (!previouslyFocusedElement.current) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }
    
    // Get all focusable elements
    const focusableElements = getFocusableElements(containerRef.current);
    
    if (focusableElements.length === 0) {
      // If no focusable elements, make the container itself focusable
      containerRef.current.tabIndex = -1;
      containerRef.current.focus();
      firstFocusableElement.current = containerRef.current;
      lastFocusableElement.current = containerRef.current;
    } else {
      // Store first and last focusable elements
      firstFocusableElement.current = focusableElements[0];
      lastFocusableElement.current = focusableElements[focusableElements.length - 1];
      
      // Auto-focus the first focusable element or the container
      if (autoFocus) {
        if (focusableElements.length > 0) {
          const autoFocusElement = focusableElements.find(el => el.hasAttribute('autofocus'));
          
          if (autoFocusElement) {
            autoFocusElement.focus();
          } else {
            focusableElements[0].focus();
          }
        } else {
          containerRef.current.focus();
        }
      }
    }
    
    isFocusTrapped.current = true;
    
    if (onFocusTrapped) {
      onFocusTrapped();
    }
  }, [autoFocus, getFocusableElements, onFocusTrapped, trapFocus]);
  
  // Restore focus to the previously focused element
  const restoreFocus = useCallback(() => {
    if (previouslyFocusedElement.current && document.body.contains(previouslyFocusedElement.current)) {
      previouslyFocusedElement.current.focus();
      previouslyFocusedElement.current = null;
      isFocusTrapped.current = false;
      
      if (onFocusRestored) {
        onFocusRestored();
      }
    }
  }, [onFocusRestored]);
  
  // Handle keyboard events for trapping focus
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!trapFocus || !isFocusTrapped.current) return;
    
    // Only process Tab key events
    if (event.key !== 'Tab') return;
    
    // Handle focus wrapping
    if (!firstFocusableElement.current || !lastFocusableElement.current) return;
    
    // Check if Shift+Tab is pressed
    if (event.shiftKey) {
      // If focus is on the first element, move to the last element
      if (document.activeElement === firstFocusableElement.current) {
        event.preventDefault();
        lastFocusableElement.current.focus();
      }
    } else {
      // If focus is on the last element, move to the first element
      if (document.activeElement === lastFocusableElement.current) {
        event.preventDefault();
        firstFocusableElement.current.focus();
      }
    }
  }, [trapFocus]);
  
  // Set up focus trapping when the container ref is set
  const setFocusRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
    
    if (element && trapFocus) {
      // Delay focus trapping to next tick to ensure DOM is ready
      setTimeout(trapFocusInContainer, 0);
    }
  }, [trapFocus, trapFocusInContainer]);
  
  // Set up event listeners
  useEffect(() => {
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Trap focus immediately if container already exists
      if (containerRef.current) {
        trapFocusInContainer();
      }
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus when unmounting if requested
      if (restoreOnUnmount) {
        restoreFocus();
      }
    };
  }, [handleKeyDown, restoreOnUnmount, restoreFocus, trapFocus, trapFocusInContainer]);
  
  // Re-trap focus if trapFocus option changes
  useEffect(() => {
    if (trapFocus && containerRef.current) {
      trapFocusInContainer();
    }
  }, [trapFocus, trapFocusInContainer]);
  
  return {
    focusRef: setFocusRef,
    restoreFocus,
    trapFocus: trapFocusInContainer,
    isFocusTrapped: isFocusTrapped.current
  };
}

export default useFocusManagement; 