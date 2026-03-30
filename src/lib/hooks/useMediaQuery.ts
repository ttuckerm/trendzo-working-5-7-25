'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for testing media queries in React
 * @param query The media query to test (e.g. '(max-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    // Check for window since we might be rendering on the server
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Set initial value
      setMatches(media.matches);
      
      // Define listener function to update state on change
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      media.addEventListener('change', listener);
      
      // Cleanup function to remove event listener
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    
    return undefined;
  }, [query]);
  
  return matches;
} 