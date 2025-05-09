'use client';

import React, { lazy, Suspense, ComponentType } from 'react';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  ssr?: boolean;
}

/**
 * Helper function to lazy load a component with standard fallback UI
 * @param importFn - Function that imports the component
 * @param options - Configuration options for lazy loading
 * @returns Lazy loaded component
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    fallback = <DefaultSuspenseFallback />,
    ssr = false
  } = options;
  
  // Create the lazy component
  const LazyComponent = lazy(importFn);
  
  // Return a wrapped component with suspense
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loader component used as fallback when lazy loading
 */
export function DefaultSuspenseFallback() {
  return (
    <div className="w-full h-full min-h-[100px] flex items-center justify-center p-4">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
      </div>
    </div>
  );
}

/**
 * Higher-order component for lazy loading at the page level
 * Best for large page components
 */
export function lazyPage<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  return lazyLoad(importFn, {
    fallback: <PageLoadingFallback />,
    ...options
  });
}

/**
 * Full-page loader component for lazy-loaded pages
 */
export function PageLoadingFallback() {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8">
      <div className="relative mb-4">
        <div className="h-12 w-12 rounded-full border-3 border-t-transparent border-blue-500 animate-spin"></div>
      </div>
      <p className="text-gray-500 animate-pulse">Loading...</p>
    </div>
  );
}

/**
 * Lazy load an image with optional blur-up preview
 * @param imageSrc - Source of the image to load
 * @param previewSrc - Source of a small placeholder image (optional)
 * @returns JSX for displaying the lazy-loaded image
 */
export function LazyImage({
  src,
  alt,
  previewSrc,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { previewSrc?: string }) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  return (
    <div className="relative overflow-hidden">
      {previewSrc && !isLoaded && (
        <img
          src={previewSrc}
          alt={alt}
          className="absolute inset-0 w-full h-full blur-sm transition-opacity duration-300"
          style={{ opacity: isLoaded ? 0 : 1 }}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={className}
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
        {...props}
      />
    </div>
  );
} 