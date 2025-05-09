'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useOptimizedAnimation } from '@/lib/hooks/useOptimizedAnimation';
import { withPerformanceTracking } from '@/lib/utils/performanceOptimization';

// Type definitions
type SkeletonVariant = 'text' | 'circle' | 'rect' | 'card' | 'avatar' | 'button' | 'image' | 'table' | 'list';
type ShimmerDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';

interface SkeletonProps {
  // Appearance props
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  
  // Animation props
  animate?: boolean;
  shimmer?: boolean;
  shimmerColor?: string;
  shimmerDirection?: ShimmerDirection;
  shimmerDuration?: number;
  
  // Performance props
  priority?: 'high' | 'medium' | 'low';
  progressiveReveal?: boolean;
  progressiveDelay?: number;
  
  // Content props
  children?: React.ReactNode;
  
  // Accessibility props
  ariaLabel?: string;
}

/**
 * OptimizedSkeletonLoader Component
 * 
 * A performance-optimized skeleton loader component with GPU acceleration
 * and support for progressive loading patterns.
 */
export const OptimizedSkeletonLoader: React.FC<SkeletonProps> = ({ 
  variant = 'rect',
  width,
  height,
  borderRadius,
  className = '',
  animate = true,
  shimmer = true,
  shimmerColor = 'rgba(255, 255, 255, 0.1)',
  shimmerDirection = 'ltr',
  shimmerDuration = 1.5,
  priority = 'medium',
  progressiveReveal = false,
  progressiveDelay = 300,
  children,
  ariaLabel
}) => {
  // Performance optimization - track if component is mounted
  const isMounted = useRef(true);
  const [isVisible, setIsVisible] = useState(!progressiveReveal);
  
  // Get dimensions based on variant
  const getDimensions = () => {
    switch(variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || '1rem'
        };
      case 'circle':
        return {
          width: width || '3rem',
          height: height || '3rem',
          borderRadius: borderRadius || '50%'
        };
      case 'avatar':
        return {
          width: width || '2.5rem',
          height: height || '2.5rem',
          borderRadius: borderRadius || '50%'
        };
      case 'button':
        return {
          width: width || '8rem',
          height: height || '2.5rem',
          borderRadius: borderRadius || '0.375rem'
        };
      case 'image':
        return {
          width: width || '100%',
          height: height || '12rem',
          borderRadius: borderRadius || '0.5rem'
        };
      case 'card':
        return {
          width: width || '100%',
          height: height || '15rem',
          borderRadius: borderRadius || '0.5rem'
        };
      default:
        return {
          width: width || '100%',
          height: height || '5rem',
          borderRadius: borderRadius || '0.25rem'
        };
    }
  };
  
  // Optimize shimmer animation based on direction
  const getShimmerAnimation = () => {
    if (!shimmer) return {};
    
    // Determine gradient based on direction
    const getGradient = () => {
      const baseColor = 'rgba(0, 0, 0, 0.1)';
      
      switch (shimmerDirection) {
        case 'rtl':
          return `linear-gradient(to left, ${baseColor} 0%, ${shimmerColor} 50%, ${baseColor} 100%)`;
        case 'ttb':
          return `linear-gradient(to bottom, ${baseColor} 0%, ${shimmerColor} 50%, ${baseColor} 100%)`;
        case 'btt':
          return `linear-gradient(to top, ${baseColor} 0%, ${shimmerColor} 50%, ${baseColor} 100%)`;
        case 'ltr':
        default:
          return `linear-gradient(to right, ${baseColor} 0%, ${shimmerColor} 50%, ${baseColor} 100%)`;
      }
    };
    
    // Determine animation properties based on direction
    const isHorizontal = shimmerDirection === 'ltr' || shimmerDirection === 'rtl';
    const backgroundSize = isHorizontal ? '200% 100%' : '100% 200%';
    
    const initialPosition = (() => {
      switch (shimmerDirection) {
        case 'ltr': return { backgroundPosition: '-100% 0' };
        case 'rtl': return { backgroundPosition: '200% 0' };
        case 'ttb': return { backgroundPosition: '0 -100%' };
        case 'btt': return { backgroundPosition: '0 200%' };
        default: return { backgroundPosition: '-100% 0' };
      }
    })();
    
    const targetPosition = (() => {
      switch (shimmerDirection) {
        case 'ltr': return { backgroundPosition: '200% 0' };
        case 'rtl': return { backgroundPosition: '-100% 0' };
        case 'ttb': return { backgroundPosition: '0 200%' };
        case 'btt': return { backgroundPosition: '0 -100%' };
        default: return { backgroundPosition: '200% 0' };
      }
    })();
    
    return {
      background: getGradient(),
      backgroundSize,
      animate: animate ? targetPosition : initialPosition,
      initial: initialPosition,
      transition: { 
        duration: shimmerDuration,
        ease: "linear",
        repeat: Infinity
      }
    };
  };
  
  // Animation for progressive reveal
  const { motionProps, ref: animationRef } = useOptimizedAnimation({
    type: 'fade',
    duration: 300,
    delay: 0.1,
    useGPU: true
  });
  
  // Progressive reveal logic
  useEffect(() => {
    if (!progressiveReveal || isVisible) return;
    
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsVisible(true);
      }
    }, progressiveDelay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [progressiveReveal, progressiveDelay, isVisible]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // High-priority skeletons should render immediately
  if (priority === 'high' && !isVisible) {
    setIsVisible(true);
  }
  
  // Don't render if not visible yet (progressive loading)
  if (!isVisible) {
    return null;
  }
  
  // Combine all styles for the skeleton
  const dimensions = getDimensions();
  const shimmerAnimation = getShimmerAnimation();
  
  // Performance optimized render using Framer Motion
  const skeletonElement = withPerformanceTracking('skeleton-render', () => (
    <motion.div
      ref={animationRef as React.Ref<HTMLDivElement>}
      role="status"
      aria-label={ariaLabel || "Loading..."}
      aria-live="polite"
      {...motionProps}
      className={`overflow-hidden bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
      style={{
        ...dimensions,
        willChange: 'background-position, opacity',
        transform: 'translateZ(0)', // Force GPU acceleration
      }}
      {...shimmerAnimation}
    >
      {children}
    </motion.div>
  ));
  
  return skeletonElement;
};

/**
 * Card skeleton with multiple elements
 */
export const CardSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => {
  return (
    <div className="flex flex-col">
      <OptimizedSkeletonLoader 
        variant="image" 
        className="mb-3" 
        progressiveReveal={props.progressiveReveal}
        progressiveDelay={props.progressiveDelay}
        priority={props.priority}
      />
      <OptimizedSkeletonLoader 
        variant="text" 
        width="90%" 
        className="mb-2" 
        progressiveReveal={props.progressiveReveal}
        progressiveDelay={props.progressiveDelay ? props.progressiveDelay + 100 : 400}
        priority={props.priority}
      />
      <OptimizedSkeletonLoader 
        variant="text" 
        width="60%" 
        height="0.8rem" 
        className="mb-3" 
        progressiveReveal={props.progressiveReveal}
        progressiveDelay={props.progressiveDelay ? props.progressiveDelay + 150 : 450}
        priority={props.priority}
      />
      <OptimizedSkeletonLoader 
        variant="button" 
        width="50%" 
        progressiveReveal={props.progressiveReveal}
        progressiveDelay={props.progressiveDelay ? props.progressiveDelay + 200 : 500}
        priority={props.priority}
      />
    </div>
  );
};

/**
 * List skeleton with multiple items
 */
export const ListSkeleton: React.FC<{
  itemCount?: number;
  itemHeight?: string | number;
  progressiveReveal?: boolean;
  priority?: 'high' | 'medium' | 'low';
}> = ({ 
  itemCount = 5, 
  itemHeight = '3rem',
  progressiveReveal = false,
  priority = 'medium'
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: itemCount }).map((_, index) => (
        <OptimizedSkeletonLoader 
          key={index}
          variant="rect"
          height={itemHeight}
          progressiveReveal={progressiveReveal}
          progressiveDelay={progressiveReveal ? index * 100 : 0}
          priority={priority}
        />
      ))}
    </div>
  );
};

/**
 * Table skeleton with rows and columns
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  headerHeight?: string | number;
  rowHeight?: string | number;
  progressiveReveal?: boolean;
  priority?: 'high' | 'medium' | 'low';
}> = ({ 
  rows = 5, 
  columns = 4,
  headerHeight = '2.5rem',
  rowHeight = '2rem',
  progressiveReveal = false,
  priority = 'medium'
}) => {
  return (
    <div className="w-full">
      <div className="flex mb-2">
        {Array.from({ length: columns }).map((_, index) => (
          <OptimizedSkeletonLoader 
            key={`header-${index}`}
            variant="rect"
            height={headerHeight}
            width={`${100 / columns}%`}
            className="mr-2 last:mr-0"
            progressiveReveal={progressiveReveal}
            progressiveDelay={100}
            priority={priority}
          />
        ))}
      </div>
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex mb-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <OptimizedSkeletonLoader 
              key={`cell-${rowIndex}-${colIndex}`}
              variant="rect"
              height={rowHeight}
              width={`${100 / columns}%`}
              className="mr-2 last:mr-0"
              progressiveReveal={progressiveReveal}
              progressiveDelay={progressiveReveal ? 100 + (rowIndex * 50) : 0}
              priority={priority}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default OptimizedSkeletonLoader; 