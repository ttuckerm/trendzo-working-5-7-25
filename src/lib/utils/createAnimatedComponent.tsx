import React, { ComponentType } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useAnimation, AnimationVariant } from '@/lib/hooks/useAnimation';

type AnimationConfig = {
  variant?: AnimationVariant;
  duration?: number;
  delay?: number;
};

/**
 * Creates an animated version of any component by wrapping it with motion animations
 * 
 * @param Component The component to animate
 * @param defaultConfig Default animation configuration
 * @returns An animated version of the component with animation props
 * 
 * @example
 * // Create an animated div
 * const AnimatedDiv = createAnimatedComponent('div', { variant: 'fadeIn' });
 * 
 * // Usage
 * <AnimatedDiv 
 *   className="p-4 bg-white" 
 *   animationVariant="slideInFromLeft"
 *   animationDuration={300}
 * >
 *   Content
 * </AnimatedDiv>
 */
export function createAnimatedComponent<P extends object>(
  Component: string | ComponentType<P>,
  defaultConfig: AnimationConfig = { variant: 'fadeIn', duration: 200, delay: 0 }
) {
  // Define props for the animated component
  type AnimatedProps = P & {
    animationVariant?: AnimationVariant;
    animationDuration?: number;
    animationDelay?: number;
    disableAnimation?: boolean;
  };

  // Create the animated component
  const AnimatedComponent = React.forwardRef<HTMLElement, AnimatedProps>((props, ref) => {
    const {
      animationVariant = defaultConfig.variant,
      animationDuration = defaultConfig.duration,
      animationDelay = defaultConfig.delay,
      disableAnimation = false,
      ...restProps
    } = props;

    const { getFramerMotionProps, isEnabled } = useAnimation();

    // If animations are disabled globally or for this component, render the component normally
    if (!isEnabled || disableAnimation) {
      return React.createElement(Component as any, { ...restProps, ref });
    }

    // Get animation properties
    const motionProps = getFramerMotionProps({
      variant: animationVariant,
      duration: animationDuration,
      delay: animationDelay,
    });

    // Create the motion component
    const MotionComponent = motion(Component as any);

    // Return the animated component
    return React.createElement(
      MotionComponent,
      {
        ref,
        initial: motionProps.initial,
        animate: motionProps.animate,
        exit: motionProps.exit,
        transition: motionProps.transition,
        ...restProps,
      }
    );
  });

  // Set display name for better debugging
  const componentName = typeof Component === 'string'
    ? Component.charAt(0).toUpperCase() + Component.slice(1)
    : Component.displayName || Component.name || 'Component';
  
  AnimatedComponent.displayName = `Animated${componentName}`;

  return AnimatedComponent as React.ForwardRefExoticComponent<AnimatedProps & React.RefAttributes<HTMLElement>>;
}

// Pre-made animated components for common elements
export const AnimatedDiv = createAnimatedComponent('div', {});
export const AnimatedSpan = createAnimatedComponent('span', {});
export const AnimatedSection = createAnimatedComponent('section', {});
export const AnimatedArticle = createAnimatedComponent('article', {});
export const AnimatedHeader = createAnimatedComponent('header', {});
export const AnimatedFooter = createAnimatedComponent('footer', {});
export const AnimatedMain = createAnimatedComponent('main', {});
export const AnimatedButton = createAnimatedComponent('button', {});
export const AnimatedImg = createAnimatedComponent('img', { variant: 'fadeIn', duration: 300 });
export const AnimatedH1 = createAnimatedComponent('h1', { variant: 'slideInFromLeft', duration: 300 });
export const AnimatedH2 = createAnimatedComponent('h2', { variant: 'slideInFromLeft', duration: 250 });
export const AnimatedH3 = createAnimatedComponent('h3', { variant: 'slideInFromLeft', duration: 200 });
export const AnimatedP = createAnimatedComponent('p', { variant: 'fadeIn', duration: 200 });
export const AnimatedUl = createAnimatedComponent('ul', {});
export const AnimatedLi = createAnimatedComponent('li', {}); 