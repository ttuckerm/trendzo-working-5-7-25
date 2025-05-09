'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cachedFetch } from '@/lib/utils/cacheUtils';

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
}

/**
 * Custom hook for fetching data with caching support
 * @param url - URL to fetch data from
 * @param options - Options for controlling fetch behavior
 * @returns Object containing data, loading state, error, and refetch function
 */
export function useDataFetch<T = any>(
  url: string,
  options: FetchOptions = {}
) {
  const {
    cacheKey = url,
    cacheTtl,
    refreshCacheOnAccess = true,
    dependencies = [],
    fetchOnMount = true,
    onError,
    keepPreviousData = true,
  } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(fetchOnMount);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref to prevent issues with stale closures
  const optionsRef = useRef(options);
  optionsRef.current = options;
  
  // The fetch function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    if (!keepPreviousData) {
      setData(null);
    }
    
    setError(null);
    
    try {
      const fetchFn = async () => {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      };
      
      const result = await cachedFetch<T>(
        cacheKey,
        fetchFn,
        {
          ttl: cacheTtl,
          refreshOnAccess: refreshCacheOnAccess
        }
      );
      
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (optionsRef.current.onError) {
        optionsRef.current.onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, cacheKey, cacheTtl, refreshCacheOnAccess, keepPreviousData]);
  
  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (fetchOnMount) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...dependencies]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

/**
 * Custom hook for infinite scrolling with caching
 * Fetches paginated data and manages the state for infinite scrolling
 */
export function useInfiniteScroll<T = any>(
  getPageUrl: (pageParam: number) => string,
  options: FetchOptions & {
    initialPage?: number;
    getNextPageParam?: (lastPage: any) => number | null | undefined;
  } = {}
) {
  const {
    initialPage = 1,
    getNextPageParam = (lastPage) => lastPage.nextPage,
    dependencies = [],
    ...fetchOptions
  } = options;
  
  const [pages, setPages] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch a specific page of data
  const fetchPage = useCallback(async (pageParam: number) => {
    const url = getPageUrl(pageParam);
    const cacheKey = `${url}-page-${pageParam}`;
    
    setIsLoadingMore(true);
    setError(null);
    
    try {
      const fetchFn = async () => {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      };
      
      const result = await cachedFetch<T>(
        cacheKey,
        fetchFn,
        {
          ttl: fetchOptions.cacheTtl,
          refreshOnAccess: fetchOptions.refreshCacheOnAccess
        }
      );
      
      setPages(prev => [...prev, result]);
      
      // Determine if there's a next page
      const nextPageParam = getNextPageParam(result);
      setHasNextPage(nextPageParam != null);
      
      if (nextPageParam != null) {
        setCurrentPage(nextPageParam);
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (fetchOptions.onError) {
        fetchOptions.onError(error);
      }
      
      return null;
    } finally {
      setIsLoadingMore(false);
    }
  }, [getPageUrl, getNextPageParam, fetchOptions]);
  
  // Initialize with the first page
  useEffect(() => {
    setPages([]);
    setCurrentPage(initialPage);
    setHasNextPage(true);
    
    fetchPage(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage, initialPage, ...dependencies]);
  
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
    reset: () => {
      setPages([]);
      setCurrentPage(initialPage);
      setHasNextPage(true);
      fetchPage(initialPage);
    }
  };
} 