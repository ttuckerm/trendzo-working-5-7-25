"use client";

import React, { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentIntegration } from '@/lib/contexts/ComponentIntegrationContext';
import { TemplateProps } from './TemplateCard';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';

interface TemplateLibraryEditorConnectorProps {
  children: React.ReactNode;
}

/**
 * A component that manages transitions and state persistence between
 * the Template Library and Template Editor components
 */
export default function TemplateLibraryEditorConnector({
  children
}: TemplateLibraryEditorConnectorProps) {
  const pathname = usePathname();
  const { 
    getComponentState, 
    setComponentState, 
    transitionInProgress,
    currentTransition,
    connectComponents
  } = useComponentIntegration();
  
  const { trackInteraction } = useUsabilityTest();
  
  // Connect the two main components on mount
  useEffect(() => {
    // Define the relationship between components for transitions
    connectComponents('/templates', '/editor');
    connectComponents('/analytics', '/templates');
  }, [connectComponents]);
  
  // Handle Template Library → Editor transition
  const handleTemplateSelect = useCallback((templateId: string) => {
    // Store this selection in state that can be accessed by the editor
    setComponentState('templateLibrary', 'selectedTemplateId', templateId);
    
    // Track this interaction for usability testing
    trackInteraction({
      type: 'navigation',
      target: 'template-editor',
      targetType: 'page',
      metadata: { templateId }
    });
    
    // Additional transition logic can be added here
  }, [setComponentState, trackInteraction]);
  
  // Handle Template Editor → Template Library transition
  const handleEditorExit = useCallback(() => {
    // Track this interaction for usability testing
    trackInteraction({
      type: 'navigation',
      target: 'template-library',
      targetType: 'page'
    });
    
    // Additional transition logic can be added here
  }, [trackInteraction]);
  
  // Restore scroll position when returning to Template Library
  useEffect(() => {
    if (pathname?.includes('/templates')) {
      const savedScrollPosition = getComponentState<number>('templateLibrary', 'scrollPosition');
      
      if (savedScrollPosition) {
        // Use a small timeout to ensure the component has rendered
        setTimeout(() => {
          window.scrollTo({
            top: savedScrollPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  }, [pathname, getComponentState]);
  
  // Animation variants for transitions
  const pageVariants = {
    initial: (direction: 'forwards' | 'backwards') => ({
      opacity: 0,
      x: direction === 'forwards' ? 20 : -20,
      scale: direction === 'forwards' ? 0.95 : 1.05,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        opacity: { duration: 0.3 },
        x: { type: 'spring', stiffness: 300, damping: 30 },
        scale: { duration: 0.2 }
      },
    },
    exit: (direction: 'forwards' | 'backwards') => ({
      opacity: 0,
      x: direction === 'forwards' ? -20 : 20,
      scale: direction === 'forwards' ? 1.05 : 0.95,
      transition: { duration: 0.2 }
    }),
  };
  
  // Determine animation direction based on current transition
  const getAnimationDirection = (): 'forwards' | 'backwards' => {
    if (!currentTransition) return 'forwards';
    
    if (
      (currentTransition.from === '/templates' && currentTransition.to === '/editor') ||
      (currentTransition.from === '/analytics' && currentTransition.to === '/templates')
    ) {
      return 'forwards';
    }
    
    return 'backwards';
  };
  
  // Enhance children with necessary props for seamless navigation
  const enhancedChildren = React.Children.map(children, child => {
    if (!React.isValidElement(child)) return child;
    
    // Get component display name safely
    const getComponentName = (component: any): string | undefined => {
      return component?.displayName || 
        (typeof component === 'function' && component.name) || 
        (typeof component === 'object' && component.constructor?.name) ||
        undefined;
    };
    
    const componentName = getComponentName(child.type);
    const isTemplateBrowser = componentName === 'EnhancedTemplateBrowser' || child.props.className?.includes('template-browser');
    const isTemplateEditor = componentName === 'EnhancedTemplateEditor' || child.props.className?.includes('template-editor');
    
    // Pass the appropriate props based on component type
    if (isTemplateBrowser) {
      return React.cloneElement(child, {
        onSelectTemplate: handleTemplateSelect,
      } as any);
    }
    
    if (isTemplateEditor) {
      // Get the selected template from state
      const selectedTemplateId = getComponentState<string>('templateLibrary', 'selectedTemplateId');
      
      return React.cloneElement(child, {
        selectedTemplateId: selectedTemplateId,
        onExitEditor: handleEditorExit,
      } as any);
    }
    
    return child;
  });
  
  // Apply animations to the children
  return (
    <AnimatePresence mode="wait" initial={false} custom={getAnimationDirection()}>
      <motion.div
        key={pathname}
        custom={getAnimationDirection()}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="w-full min-h-screen"
      >
        {enhancedChildren}
      </motion.div>
    </AnimatePresence>
  );
} 