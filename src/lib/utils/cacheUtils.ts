/**
 * Simple in-memory cache with expiration support
 */
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Whether to refresh the TTL on cache hit */
  refreshOnAccess?: boolean;
}

// Default TTL is 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// In-memory cache store
const cacheStore: Record<string, CacheEntry<any>> = {};

/**
 * Set data in the cache with a specified expiration
 */
export function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): void {
  const { ttl = DEFAULT_TTL } = options;
  const expiry = Date.now() + ttl;
  
  cacheStore[key] = { data, expiry };
}

/**
 * Get data from the cache if it exists and hasn't expired
 */
export function getCache<T>(
  key: string,
  options: CacheOptions = {}
): T | undefined {
  const { refreshOnAccess = false, ttl = DEFAULT_TTL } = options;
  const entry = cacheStore[key];
  
  if (!entry) {
    return undefined;
  }
  
  // Check if entry has expired
  if (Date.now() > entry.expiry) {
    delete cacheStore[key];
    return undefined;
  }
  
  // Refresh TTL if specified
  if (refreshOnAccess) {
    entry.expiry = Date.now() + ttl;
  }
  
  return entry.data as T;
}

/**
 * Delete a specific entry from the cache
 */
export function deleteCache(key: string): void {
  delete cacheStore[key];
}

/**
 * Clear all entries from the cache
 */
export function clearCache(): void {
  Object.keys(cacheStore).forEach(key => {
    delete cacheStore[key];
  });
}

/**
 * Asynchronously fetch data with cache support
 * Will return cached data if available, otherwise fetch and cache
 */
export async function cachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cachedData = getCache<T>(key, options);
  
  if (cachedData !== undefined) {
    return cachedData;
  }
  
  // If not in cache, fetch the data
  const data = await fetchFn();
  
  // Cache the result
  setCache(key, data, options);
  
  return data;
}

/**
 * Clean up expired cache entries
 * Call this periodically to prevent memory leaks
 */
export function cleanupCache(): void {
  const now = Date.now();
  
  Object.entries(cacheStore).forEach(([key, entry]) => {
    if (now > entry.expiry) {
      delete cacheStore[key];
    }
  });
}

// Automatically clean up expired cache entries every minute
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 60000);
} 