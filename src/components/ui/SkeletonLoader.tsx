import React from 'react';
import { cn } from '@/lib/design-utils';
import { animations } from '@/lib/design-tokens';
import { useAnimationContext } from '@/lib/contexts/AnimationContext';

export type SkeletonVariant = 'rectangular' | 'rounded' | 'circular' | 'text' | 'avatar' | 'card' | 'button';
export type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'custom';

interface SkeletonProps {
  /**
   * The shape variant of the skeleton
   */
  variant?: SkeletonVariant;
  
  /**
   * Predefined or custom width
   */
  width?: string | number;
  
  /**
   * Predefined or custom height
   */
  height?: string | number;
  
  /**
   * Predefined size
   */
  size?: SkeletonSize;
  
  /**
   * Disable the animation
   */
  disableAnimation?: boolean;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Number of items to render (for arrays)
   */
  count?: number;
  
  /**
   * Spacing between items when count > 1
   */
  spacing?: number | string;
}

/**
 * Skeleton loader component that shows a placeholder preview of content before data gets loaded
 */
export function SkeletonLoader({
  variant = 'rectangular',
  width,
  height,
  size = 'md',
  disableAnimation = false,
  className,
  count = 1,
  spacing = '0.5rem',
}: SkeletonProps) {
  const { animationsEnabled, prefersReducedMotion } = useAnimationContext();
  
  // Determine if animation should be shown
  const shouldAnimate = animationsEnabled && !disableAnimation && !prefersReducedMotion;
  
  // Get animation class
  const animationClass = shouldAnimate ? animations.loading.skeleton : '';
  
  // Define dimension maps for predefined sizes
  const sizeMap: Record<SkeletonSize, { width: string, height: string }> = {
    xs: { width: '1rem', height: '1rem' },
    sm: { width: '2rem', height: '2rem' },
    md: { width: '4rem', height: '4rem' },
    lg: { width: '8rem', height: '8rem' },
    xl: { width: '16rem', height: '16rem' },
    full: { width: '100%', height: '100%' },
    custom: { width: '100%', height: 'auto' }
  };
  
  // Get dimensions based on size or custom values
  const getWidth = () => {
    if (width) return typeof width === 'number' ? `${width}px` : width;
    if (variant === 'text') return '100%';
    return sizeMap[size].width;
  };
  
  const getHeight = () => {
    if (height) return typeof height === 'number' ? `${height}px` : height;
    if (variant === 'text') return '1rem';
    return sizeMap[size].height;
  };
  
  // Get border radius based on variant
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rounded':
        return 'rounded-md';
      case 'avatar':
        return 'rounded-full';
      case 'card':
        return 'rounded-lg';
      case 'button':
        return 'rounded-md';
      default:
        return 'rounded-none';
    }
  };
  
  // Adjust height for specific variants
  const getAdjustedHeight = () => {
    if (variant === 'card' && !height) return '12rem';
    if (variant === 'button' && !height) return '2.5rem';
    return getHeight();
  };
  
  // Construct the skeleton component
  const skeletonElement = (index: number) => (
    <div
      key={index}
      className={cn(
        'bg-neutral-200',
        getBorderRadius(),
        animationClass,
        className
      )}
      style={{
        width: getWidth(),
        height: getAdjustedHeight(),
        marginBottom: index < count - 1 ? spacing : undefined,
      }}
      aria-hidden="true"
    />
  );
  
  // For better performance with many skeletons
  if (count > 1) {
    return (
      <div className="flex flex-col">
        {Array.from({ length: count }, (_, index) => skeletonElement(index))}
      </div>
    );
  }
  
  return skeletonElement(0);
}

/**
 * Card Skeleton specifically for card layouts
 */
export function CardSkeleton(props: Omit<SkeletonProps, 'variant'>) {
  return (
    <div className="space-y-2">
      <SkeletonLoader
        variant="card"
        className="w-full"
        height={props.height || 200}
        disableAnimation={props.disableAnimation}
      />
      <div className="space-y-2">
        <SkeletonLoader variant="text" width="70%" height={20} disableAnimation={props.disableAnimation} />
        <SkeletonLoader variant="text" width="90%" height={16} disableAnimation={props.disableAnimation} />
        <SkeletonLoader variant="text" width="60%" height={16} disableAnimation={props.disableAnimation} />
      </div>
    </div>
  );
}

/**
 * Table Skeleton for table layouts
 */
export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  disableAnimation 
}: { 
  rows?: number; 
  columns?: number; 
  disableAnimation?: boolean;
}) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex mb-4 gap-4">
        {Array.from({ length: columns }, (_, i) => (
          <SkeletonLoader 
            key={`header-${i}`} 
            variant="text" 
            width={`${100 / columns}%`} 
            height={24} 
            disableAnimation={disableAnimation}
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex py-2 gap-4">
          {Array.from({ length: columns }, (_, colIndex) => (
            <SkeletonLoader
              key={`cell-${rowIndex}-${colIndex}`}
              variant="text"
              width={`${100 / columns}%`}
              height={20}
              disableAnimation={disableAnimation}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkeletonLoader; 