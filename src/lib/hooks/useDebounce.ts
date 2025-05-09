import { useState, useEffect } from 'react';

/**
 * A hook to debounce a value - useful for search inputs
 * to avoid excessive API calls or filter operations
 * 
 * @param value The value to debounce
 * @param delay The debounce delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes (or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 