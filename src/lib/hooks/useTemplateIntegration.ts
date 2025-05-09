"use client";

import { useEffect } from 'react';
import { useStateContext } from '@/lib/contexts/StateContext';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';
import { useRouter, usePathname } from 'next/navigation';

/**
 * Hook to handle template integration between editor and template library
 * Provides state persistence and transition tracking
 */
export function useTemplateIntegration() {
  const { getState, setState } = useStateContext();
  const { trackInteraction } = useUsabilityTest();
  const router = useRouter();
  const pathname = usePathname();
  
  // Track current path for navigation history
  useEffect(() => {
    if (pathname) {
      const prevPath = getState<string>('navigation.currentPath');
      if (prevPath && prevPath !== pathname) {
        setState('navigation.previousPath', prevPath);
      }
      setState('navigation.currentPath', pathname);
    }
  }, [pathname, setState, getState]);
  
  // Navigate to template editor with tracking
  const navigateToEditor = (templateId: string, source: string = 'template-library') => {
    // Save template ID for editor to access
    setState('templateLibrary.selectedTemplateId', templateId);
    
    // Save scroll position if in template library
    if (pathname?.includes('template-library')) {
      setState('templateLibrary.scrollPosition', window.scrollY);
    }
    
    // Track this navigation
    trackInteraction({
      type: 'navigation',
      target: 'editor',
      targetType: 'page',
      path: `/editor?id=${templateId}&source=${source}`,
      metadata: { templateId, source }
    });
    
    // Navigate to editor
    router.push(`/editor?id=${templateId}&source=${source}`);
  };
  
  // Navigate back to template library with tracking
  const navigateToTemplateLibrary = () => {
    // Track this navigation
    trackInteraction({
      type: 'navigation',
      target: 'template-library',
      targetType: 'page',
      path: '/dashboard-view/template-library/view',
    });
    
    // Navigate to template library
    router.push('/dashboard-view/template-library/view');
  };
  
  // Save template with tracking
  const saveTemplateWithTracking = async (
    saveFunction: () => Promise<any>, 
    templateId: string
  ) => {
    try {
      // Track save attempt
      trackInteraction({
        type: 'click',
        target: 'save-template',
        targetType: 'button',
        metadata: { templateId, action: 'save_template' }
      });
      
      // Execute the save
      const result = await saveFunction();
      
      // Track successful save
      trackInteraction({
        type: 'success',
        target: 'save-template',
        targetType: 'operation',
        metadata: { templateId, action: 'save_template_success' }
      });
      
      return result;
    } catch (error) {
      // Track failed save
      trackInteraction({
        type: 'error',
        target: 'save-template',
        targetType: 'operation',
        metadata: { 
          templateId, 
          action: 'save_template_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      throw error;
    }
  };
  
  // Get template data from state
  const getSelectedTemplate = () => {
    const templateId = getState<string>('templateLibrary.selectedTemplateId');
    const templateData = getState<any>('templateLibrary.selectedTemplateData');
    
    return {
      templateId,
      templateData
    };
  };
  
  return {
    navigateToEditor,
    navigateToTemplateLibrary,
    saveTemplateWithTracking,
    getSelectedTemplate
  };
} 