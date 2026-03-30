# Animation System Documentation

This document provides an overview of the animation system implemented in the TikTok Template Tracker platform.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Usage Examples](#usage-examples)
4. [Animation Configuration](#animation-configuration)
5. [Integration Guide](#integration-guide)
6. [Accessibility](#accessibility)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting](#troubleshooting)

## Overview

The animation system provides consistent, performant, and accessible animations across the entire application. It's designed to enhance the user experience by providing visual feedback for interactions, smooth transitions between states, and appropriate loading states.

Key features:
- Global animation preferences (enabled/disabled, reduced motion support)
- Consistent transition effects and durations
- Reusable animation components for common patterns
- Performance optimizations to maintain smooth interactions
- Accessibility support with reduced motion preferences

## Core Components

### AnimationContext

The `AnimationContext` provides global animation preferences and utility functions:

```tsx
import { useAnimationContext } from '@/lib/contexts/AnimationContext';

function MyComponent() {
  const { 
    animationsEnabled,
    prefersReducedMotion,
    animationScale,
    getAnimationDuration,
    getTransitionEasing
  } = useAnimationContext();
  
  // ...
}
```

### useAnimation Hook

The primary hook for consuming animations in components:

```tsx
import { useAnimation } from '@/lib/hooks/useAnimation';

function MyComponent() {
  const { 
    getFramerMotionProps,
    getCssAnimationClass,
    getInteractionTransition,
    isEnabled
  } = useAnimation();
  
  // Get Framer Motion props for a specific animation
  const motionProps = getFramerMotionProps({
    variant: 'fadeIn',
    duration: 200,
    delay: 0
  });
  
  // ...
}
```

### Animation Components

Ready-to-use animation components:

- `<AnimatedContainer>` - For content that needs to animate in/out
- `<AnimatedList>` - For lists with staggered animations
- `<AnimatedTransition>` - For transitioning between different content
- `<PageTransition>` - For smooth page transitions
- `<InteractiveElement>` - For consistent interaction animations
- `<SkeletonLoader>` - For loading states

## Usage Examples

### Animated Container

```tsx
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <AnimatedContainer
      show={isVisible}
      variant="fadeIn"
      className="p-4 bg-white rounded"
    >
      Content that animates in and out
    </AnimatedContainer>
  );
}
```

### Interactive Elements

```tsx
import { InteractiveElement } from '@/components/ui/InteractiveElement';

function MyComponent() {
  return (
    <InteractiveElement
      variant="button"
      className="bg-primary-500 text-white px-4 py-2 rounded"
      onClick={handleClick}
    >
      Interactive Button
    </InteractiveElement>
  );
}
```

### Page Transitions

```tsx
import { PageTransition } from '@/components/ui/PageTransition';

export default function MyPage() {
  return (
    <PageTransition variant="fade">
      <main>
        Page content
      </main>
    </PageTransition>
  );
}
```

### Loading States

```tsx
import { SkeletonLoader, CardSkeleton } from '@/components/ui/SkeletonLoader';

function LoadingState() {
  return (
    <div className="space-y-4">
      <SkeletonLoader variant="text" width="100%" height={20} />
      <SkeletonLoader variant="text" width="80%" height={20} />
      <CardSkeleton />
    </div>
  );
}
```

## Animation Configuration

Animation constants are defined in `src/lib/design-tokens.ts` under the `animations` object. These include:

- **Transitions**: Duration and easing functions
- **Keyframes**: Animation keyframe definitions
- **Animation**: Named animation configurations
- **Loading**: Loading state animations
- **Interactive**: Interactive element animations
- **Page**: Page transition animations

## Integration Guide

### Adding Animations to Existing Components

#### 1. Basic Hover/Focus Effects for Interactive Elements

The simplest way to add animations to an existing component is to use the `InteractiveElement` wrapper:

```tsx
// Before
function MyButton({ children, onClick }) {
  return (
    <button 
      className="px-4 py-2 bg-primary-500 text-white rounded" 
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// After
import { InteractiveElement } from '@/components/ui/InteractiveElement';

function MyButton({ children, onClick }) {
  return (
    <InteractiveElement
      variant="button"
      onClick={onClick}
      className="px-4 py-2 bg-primary-500 text-white rounded"
    >
      {children}
    </InteractiveElement>
  );
}
```

#### 2. Adding Enter/Exit Animations to Modals or Dialogs

```tsx
// Before
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// After
import { AnimatedContainer } from '@/components/ui/AnimatedContainer';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatedContainer
      show={isOpen}
      variant="fadeIn"
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
    >
      <AnimatedContainer
        show={isOpen}
        variant="scale"
        className="bg-white p-6 rounded-lg"
      >
        {children}
        <button onClick={onClose}>Close</button>
      </AnimatedContainer>
    </AnimatedContainer>
  );
}
```

#### 3. Using Framer Motion Directly

For more complex animations, you can use Framer Motion directly with our animation hooks:

```tsx
import { motion } from 'framer-motion';
import { useAnimation } from '@/lib/hooks/useAnimation';

function AnimatedComponent() {
  const { getFramerMotionProps, isEnabled } = useAnimation();
  
  // Get animation properties
  const motionProps = getFramerMotionProps({
    variant: 'fadeIn',
    duration: 300,
    delay: 100
  });
  
  // If animations are disabled, render normally
  if (!isEnabled) {
    return <div>Content</div>;
  }
  
  // Otherwise, use Framer Motion
  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      exit={motionProps.exit}
      transition={motionProps.transition}
    >
      Content
    </motion.div>
  );
}
```

#### 4. Adding Loading States to Asynchronous Operations

```tsx
import { useState } from 'react';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

function DataComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(result => {
      setData(result);
      setLoading(false);
    });
  }, []);
  
  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="text" width="100%" height={24} />
        <SkeletonLoader variant="text" width="90%" height={20} />
        <SkeletonLoader variant="text" width="80%" height={20} />
      </div>
    );
  }
  
  return (
    <div>
      {/* Render actual content with data */}
    </div>
  );
}
```

#### 5. Using CSS Animation Classes Directly

```tsx
import { useAnimation } from '@/lib/hooks/useAnimation';
import { cn } from '@/lib/design-utils';

function MyComponent() {
  const { getCssAnimationClass } = useAnimation();
  
  // Get Tailwind animation class
  const animationClass = getCssAnimationClass({
    variant: 'fadeIn',
    duration: 300
  });
  
  return (
    <div className={cn('bg-white p-4 rounded', animationClass)}>
      Content with animations
    </div>
  );
}
```

## Accessibility

The animation system automatically detects and respects the user's motion preferences:

- If `prefers-reduced-motion` is set, animations are minimized or disabled
- All animations have appropriate durations (not too fast, not too slow)
- Animations don't interfere with screen readers
- Users can disable animations entirely

## Performance Considerations

To maintain high performance:

1. CSS animations are preferred over JavaScript animations when possible
2. Animations only trigger GPU-accelerated properties (transform, opacity)
3. Complex animations are conditionally rendered to prevent layout thrashing
4. Staggered animations help distribute rendering load

## Troubleshooting

### Common Issues

#### Animations Not Working
- Ensure `AnimationProvider` is included in your app's providers
- Check if the user has `prefers-reduced-motion` set
- Verify animations are enabled in the animation context

#### Flickering or Janky Animations
- Use `transform` and `opacity` for animations instead of properties that trigger layout
- Ensure you're not animating too many elements simultaneously
- Consider using staggered animations for lists
- Check browser DevTools for performance issues

#### Animation Not Accessible
- Ensure animations respect the user's motion preferences
- Keep animation durations reasonable (typically under 500ms)
- Avoid animations that could trigger vestibular disorders
- Provide a way for users to disable animations

### Debugging Animations

You can use the `AnimationShowcase` component to test and debug animations:

```tsx
import AnimationShowcase from '@/components/ui/AnimationShowcase';

// Add this to a route for testing
export default function TestAnimations() {
  return <AnimationShowcase />;
}
```

---

For questions or issues, please contact the development team. 