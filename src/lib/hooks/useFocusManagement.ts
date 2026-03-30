import { useRef, useEffect, useCallback } from 'react';

interface UseFocusManagementOptions {
  autoFocus?: boolean;
  trapFocus?: boolean;
  restoreOnUnmount?: boolean;
}

interface UseFocusManagementReturn {
  focusRef: React.RefObject<HTMLElement>;
  setFocus: () => void;
  releaseFocus: () => void;
}

/**
 * Hook for managing focus states and keyboard navigation
 * Used in modals, overlays, and accessibility-critical components
 */
export function useFocusManagement(options: UseFocusManagementOptions = {}): UseFocusManagementReturn {
  const {
    autoFocus = false,
    trapFocus = false,
    restoreOnUnmount = false
  } = options;

  const focusRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const setFocus = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);

  const releaseFocus = useCallback(() => {
    if (restoreOnUnmount && previouslyFocusedElement.current) {
      previouslyFocusedElement.current.focus();
    }
  }, [restoreOnUnmount]);

  useEffect(() => {
    if (autoFocus) {
      // Store currently focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Set focus to our element
      const timeoutId = setTimeout(() => {
        setFocus();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [autoFocus, setFocus]);

  useEffect(() => {
    if (trapFocus && focusRef.current) {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab' && focusRef.current) {
          const focusableElements = focusRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          const firstFocusable = focusableElements[0] as HTMLElement;
          const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstFocusable) {
              event.preventDefault();
              lastFocusable?.focus();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              event.preventDefault();
              firstFocusable?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [trapFocus]);

  useEffect(() => {
    return () => {
      if (restoreOnUnmount) {
        releaseFocus();
      }
    };
  }, [releaseFocus, restoreOnUnmount]);

  return {
    focusRef,
    setFocus,
    releaseFocus
  };
}

export default useFocusManagement;