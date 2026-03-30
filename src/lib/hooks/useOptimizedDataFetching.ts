'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch } from '@/lib/utils/cacheUtils';
import { debounce, withPerformanceTracking } from '@/lib/utils/performanceOptimization';

interface FetchOptions {
  /**
   * Cache key for storing fetched data
   * If not provided, the URL will be used as the key
   */
  cacheKey?: string;
  
  /**
   * Time to live in milliseconds for cache
   * Default is 5 minutes
   */
  cacheTtl?: number;
  
  /**
   * Whether to refresh cache TTL on access
   */
  refreshCacheOnAccess?: boolean;
  
  /**
   * Dependencies array for triggering refetches
   */
  dependencies?: any[];
  
  /**
   * Whether to fetch data immediately
   * If false, data will only be fetched when manually triggered
   */
  fetchOnMount?: boolean;
  
  /**
   * Callback for handling errors
   */
  onError?: (error: any) => void;
  
  /**
   * Whether to keep stale data while refreshing
   */
  keepPreviousData?: boolean;
  
  /**
   * Maximum number of retries when fetch fails
   */
  retryCount?: number;
  
  /**
   * Delay between retries in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Whether to prefetch data before it's needed
   */
  prefetch?: boolean;
  
  /**
   * Delay in milliseconds before triggering fetch
   * Useful for debouncing frequent fetches
   */
  debounceDelay?: number;
  
  /**
   * Fetch request headers
   */
  headers?: HeadersInit;
  
  /**
   * Whether to show skeleton loader during initial fetch
   */
  showSkeletonOnInitialLoad?: boolean;
  
  /**
   * Timeout for fetch requests in milliseconds
   */
  timeout?: number;
  
  /**
   * Custom fetch implementation
   */
  fetchImplementation?: typeof fetch;
  
  /**
   * Custom transform function to run on fetched data
   */
  transformResponse?: (data: any) => any;
  
  /**
   * Whether to deduplicate identical requests in flight
   */
  deduplicateRequests?: boolean;
}

// Map to track in-flight requests to enable deduplication
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Custom hook for optimized data fetching with advanced performance features
 * 
 * @param url - URL or function that returns URL to fetch data from
 * @param options - Options for controlling fetch behavior
 * @returns Object containing data, loading state, error, and control functions
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useOptimizedDataFetching('/api/data', {
 *   prefetch: true,
 *   cacheTtl: 60000,
 *   deduplicateRequests: true
 * });
 * ```
 */
export function useOptimizedDataFetching<T = any>(
  url: string | (() => string),
  options: FetchOptions = {}
) {
  const {
    cacheKey,
    cacheTtl,
    refreshCacheOnAccess = true,
    dependencies = [],
    fetchOnMount = true,
    onError,
    keepPreviousData = true,
    retryCount = 0,
    retryDelay = 1000,
    prefetch = false,
    debounceDelay = 0,
    headers,
    showSkeletonOnInitialLoad = true,
    timeout,
    fetchImplementation = fetch,
    transformResponse,
    deduplicateRequests = true
  } = options;
  
  // State for data fetching
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount && showSkeletonOnInitialLoad);
  const [error, setError] = useState<Error | null>(null);
  const [hasTriggeredPrefetch, setHasTriggeredPrefetch] = useState(false);
  
  // Refs to track component state and prevent stale closures
  const optionsRef = useRef(options);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  
  // Update options ref when options change
  optionsRef.current = options;
  
  // Get the actual URL if it's a function
  const resolveUrl = useCallback(() => {
    return typeof url === 'function' ? url() : url;
  }, [url]);
  
  // Generate a cache key based on URL and options
  const resolveCacheKey = useCallback(() => {
    const resolvedUrl = resolveUrl();
    return cacheKey || resolvedUrl;
  }, [cacheKey, resolveUrl]);
  
  // Create a controllable version of fetch with timeout and abort support
  const controlledFetch = useCallback(async (requestUrl: string, requestHeaders?: HeadersInit): Promise<Response> => {
    // Create a new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    
    if (timeout) {
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeout);
    }
    
    try {
      const response = await fetchImplementation(requestUrl, {
        headers: requestHeaders,
        signal: abortController.signal
      });
      
      // Clear timeout if fetch completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return response;
    } catch (err) {
      // Clear timeout if fetch failed
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Re-throw the error to be handled by the caller
      throw err;
    }
  }, [fetchImplementation, timeout]);
  
  // The main fetch function with built-in performance tracking
  const fetchData = useCallback(async (skipCache = false) => {
    const resolvedUrl = resolveUrl();
    const resolvedCacheKey = resolveCacheKey();
    
    // Track performance for this fetch
    return withPerformanceTracking(`fetch-${resolvedCacheKey}`, async () => {
      setIsLoading(true);
      
      // Keep previous data if option is enabled
      if (!keepPreviousData) {
        setData(null);
      }
      
      setError(null);
      
      try {
        // Deduplication - reuse in-flight requests for the same URL
        if (deduplicateRequests && inFlightRequests.has(resolvedUrl)) {
          const pendingRequest = inFlightRequests.get(resolvedUrl)!;
          return await pendingRequest;
        }
        
        // Define the actual fetch operation
        const fetchOperation = async () => {
          const response = await controlledFetch(resolvedUrl, headers);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const jsonData = await response.json();
          
          // Apply transform if provided
          return transformResponse ? transformResponse(jsonData) : jsonData;
        };
        
        // Create a promise for this request
        const fetchPromise = skipCache
          ? fetchOperation()
          : cachedFetch<T>(
              resolvedCacheKey,
              fetchOperation,
              {
                ttl: cacheTtl,
                refreshOnAccess: refreshCacheOnAccess
              }
            );
        
        // Store the promise for deduplication if enabled
        if (deduplicateRequests) {
          inFlightRequests.set(resolvedUrl, fetchPromise);
        }
        
        // Execute the fetch and process results
        const result = await fetchPromise;
        
        // Update state if the component is still mounted
        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setError(null);
          retryCountRef.current = 0;
        }
        
        // Remove this request from in-flight tracking
        if (deduplicateRequests) {
          inFlightRequests.delete(resolvedUrl);
        }
        
        return result;
      } catch (err) {
        // Handle errors and retries
        const error = err instanceof Error ? err : new Error(String(err));
        
        // Remove from in-flight requests on error
        if (deduplicateRequests) {
          inFlightRequests.delete(resolvedUrl);
        }
        
        // Check if we should retry the request
        if (retryCountRef.current < retryCount) {
          retryCountRef.current++;
          
          // Retry after delay
          setTimeout(() => {
            if (isMountedRef.current) {
              fetchData(skipCache);
            }
          }, retryDelay * retryCountRef.current); // Exponential backoff
        } else if (isMountedRef.current) {
          // No more retries, update state
          setError(error);
          setIsLoading(false);
          
          if (optionsRef.current.onError) {
            optionsRef.current.onError(error);
          }
        }
        
        throw error;
      }
    });
  }, [
    resolveUrl, 
    resolveCacheKey, 
    controlledFetch, 
    headers, 
    transformResponse, 
    keepPreviousData, 
    deduplicateRequests, 
    cacheTtl, 
    refreshCacheOnAccess, 
    retryCount, 
    retryDelay
  ]);
  
  // Create a debounced version of fetchData if needed
  const debouncedFetchData = useCallback(
    debounceDelay > 0
      ? debounce(fetchData, debounceDelay) 
      : fetchData,
    [fetchData, debounceDelay]
  );
  
  // Handle prefetching
  useEffect(() => {
    if (prefetch && !hasTriggeredPrefetch) {
      // Don't show loading state for prefetching
      const currentIsLoading = isLoading;
      setIsLoading(false);
      
      // Trigger a silent prefetch
      fetchData()
        .catch(() => {}) // Ignore errors during prefetch
        .finally(() => {
          // Restore loading state if needed
          setIsLoading(currentIsLoading);
          setHasTriggeredPrefetch(true);
        });
    }
  }, [prefetch, fetchData, hasTriggeredPrefetch, isLoading]);
  
  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (fetchOnMount || hasTriggeredPrefetch) {
      debouncedFetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFetchData, ...dependencies]);
  
  // Cleanup function
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Public API
  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(false),
    fetchFresh: () => fetchData(true),
    cancel: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setIsLoading(false);
      }
    }
  };
}

/**
 * Custom hook for infinite scrolling with optimized performance
 * Fetches paginated data and manages the state for infinite scrolling
 * 
 * @example
 * ```tsx
 * const { pages, isLoadingMore, hasNextPage, loadMore } = useOptimizedInfiniteScroll(
 *   (page) => `/api/data?page=${page}`,
 *   { initialPage: 1 }
 * );
 * ```
 */
export function useOptimizedInfiniteScroll<T = any>(
  getPageUrl: (pageParam: number) => string,
  options: FetchOptions & {
    initialPage?: number;
    getNextPageParam?: (lastPage: any) => number | null | undefined;
    prefetchNextPage?: boolean;
  } = {}
) {
  const {
    initialPage = 1,
    getNextPageParam = (lastPage) => lastPage.nextPage,
    prefetchNextPage: shouldPrefetchNextPage = false,
    dependencies = [],
    ...fetchOptions
  } = options;
  
  // State for infinite scrolling
  const [pages, setPages] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextPageParam, setNextPageParam] = useState<number | null | undefined>(null);
  
  // Track if we've already prefetched the next page
  const hasPrefetchedNextPage = useRef(false);
  
  // Fetch a specific page of data with performance tracking
  const fetchPage = useCallback(async (pageParam: number, skipCache = false) => {
    const url = getPageUrl(pageParam);
    const cacheKey = `${url}-page-${pageParam}`;
    
    return withPerformanceTracking(`fetch-page-${pageParam}`, async () => {
      setIsLoadingMore(true);
      setError(null);
      
      try {
        const fetchFn = async () => {
          const response = await fetch(url, fetchOptions.headers ? { headers: fetchOptions.headers } : undefined);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return await response.json();
        };
        
        const fetchOperation = skipCache 
          ? fetchFn() 
          : cachedFetch<T>(
              cacheKey,
              fetchFn,
              {
                ttl: fetchOptions.cacheTtl,
                refreshOnAccess: fetchOptions.refreshCacheOnAccess
              }
            );
        
        const result = await fetchOperation;
        const transformedResult = fetchOptions.transformResponse ? fetchOptions.transformResponse(result) : result;
        
        setPages(prev => [...prev, transformedResult]);
        
        // Determine if there's a next page and update state
        const nextParam = getNextPageParam(transformedResult);
        setNextPageParam(nextParam);
        setHasNextPage(nextParam != null);
        
        if (nextParam != null) {
          setCurrentPage(nextParam);
        }
        
        setIsLoadingMore(false);
        
        return transformedResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoadingMore(false);
        
        if (fetchOptions.onError) {
          fetchOptions.onError(error);
        }
        
        return null;
      }
    });
  }, [getPageUrl, getNextPageParam, fetchOptions]);
  
  // Prefetch the next page in the background
  const prefetchNextPage = useCallback(async () => {
    if (hasNextPage && nextPageParam && !hasPrefetchedNextPage.current && shouldPrefetchNextPage) {
      hasPrefetchedNextPage.current = true;
      
      try {
        await fetchPage(nextPageParam, false);
        hasPrefetchedNextPage.current = false;
      } catch (error) {
        // Silently handle errors during prefetch
        hasPrefetchedNextPage.current = false;
      }
    }
  }, [hasNextPage, nextPageParam, shouldPrefetchNextPage, fetchPage]);
  
  // Initialize with the first page
  useEffect(() => {
    setPages([]);
    setCurrentPage(initialPage);
    setHasNextPage(true);
    hasPrefetchedNextPage.current = false;
    
    fetchPage(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, initialPage, ...dependencies]);
  
  // Prefetch the next page when current page is loaded
  useEffect(() => {
    if (shouldPrefetchNextPage && hasNextPage && !isLoadingMore && nextPageParam) {
      prefetchNextPage();
    }
  }, [prefetchNextPage, hasNextPage, isLoadingMore, nextPageParam, shouldPrefetchNextPage]);
  
  // Load the next page of data
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) {
      return null;
    }
    
    return await fetchPage(currentPage);
  }, [hasNextPage, isLoadingMore, fetchPage, currentPage]);
  
  return {
    pages,
    isLoadingMore,
    hasNextPage,
    loadMore,
    error,
    currentPage,
    reset: () => {
      setPages([]);
      setCurrentPage(initialPage);
      setHasNextPage(true);
      hasPrefetchedNextPage.current = false;
      fetchPage(initialPage);
    }
  };
}

export default useOptimizedDataFetching; 