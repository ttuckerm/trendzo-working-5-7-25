import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with Tailwind CSS classes
 * Combines clsx for conditional class names with tailwind-merge to properly
 * handle Tailwind CSS class conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with K/M/B suffixes
 * E.g. 1200 -> 1.2K, 1500000 -> 1.5M
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

/**
 * Generate a random ID with a given prefix
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sleep for a given number of milliseconds
 * Useful for artificial delays in development
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate a string to a given length
 * Adds an ellipsis if truncated
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Get a random item from an array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, or empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Get the value of a cookie by name
 */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find(c => c.startsWith(name + '='));
  return cookie ? cookie.split('=')[1] : undefined;
}

/**
 * Set a cookie with a given name, value, and options
 */
export function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
} 