"use client";

import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComponentIntegration } from '@/lib/contexts/ComponentIntegrationContext';
import { useUsabilityTest } from '@/lib/contexts/UsabilityTestContext';
import { usePathname, useRouter } from 'next/navigation';
import { ElementTransition } from '@/components/ui/PageTransition';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsTemplateConnectorProps {
  children: React.ReactNode;
}

/**
 * A component that manages the integration between analytics displays
 * and template components, enabling seamless navigation and context preservation
 */
export default function AnalyticsTemplateConnector({
  children
}: AnalyticsTemplateConnectorProps) {
  const { 
    getComponentState, 
    setComponentState, 
    navigateBetweenComponents 
  } = useComponentIntegration();
  
  const { trackInteraction } = useUsabilityTest();
  const pathname = usePathname();
  const router = useRouter();
  
  // Connect related components on mount
  useEffect(() => {
    // Define the relationship for transitions
    connectComponentsIfNeeded();
  }, []);
  
  // Connect components if not already connected
  const connectComponentsIfNeeded = useCallback(() => {
    // Create connections between analytics and template components
    // This enables smooth transitions between these related views
  }, []);
  
  // Handle navigation from analytics to specific template detail
  const handleAnalyticsToTemplateNavigation = useCallback((templateId: string, contextData?: any) => {
    // Store selected template ID for the template browser to use
    setComponentState('templateLibrary', 'selectedTemplateId', templateId);
    
    // If we have context data (like metrics), store it
    if (contextData) {
      setComponentState('analytics', 'contextData', contextData);
    }
    
    // Track this interaction for analytics
    trackInteraction({
      type: 'navigation',
      target: 'template-detail',
      targetType: 'page',
      metadata: { 
        templateId,
        sourceContext: 'analytics',
        contextData
      }
    });
    
    // Navigate to the template detail page with a smooth transition
    navigateBetweenComponents(
      '/analytics',
      '/templates',
      {
        preserveState: true,
        data: { 
          templateId,
          fromAnalytics: true,
          contextData
        },
        transition: 'slide',
        direction: 'left'
      }
    );
  }, [setComponentState, trackInteraction, navigateBetweenComponents]);
  
  // Handle template comparison from analytics
  const handleComparisonNavigation = useCallback((templateIds: string[]) => {
    // Store the comparison IDs
    setComponentState('analytics', 'comparisonIds', templateIds);
    
    // Track this interaction
    trackInteraction({
      type: 'navigation',
      target: 'template-comparison',
      targetType: 'page',
      metadata: { templateIds }
    });
    
    // Navigate to the comparison view
    router.push(`/templates/compare?ids=${templateIds.join(',')}`);
  }, [setComponentState, trackInteraction, router]);
  
  // Handle navigation back to analytics from template detail
  const handleBackToAnalytics = useCallback(() => {
    // Track this interaction
    trackInteraction({
      type: 'navigation',
      target: 'analytics',
      targetType: 'page',
      metadata: { 
        returnedFrom: 'template-detail' 
      }
    });
    
    // Navigate back to analytics with the right transition
    navigateBetweenComponents(
      '/templates',
      '/analytics',
      {
        preserveState: true,
        transition: 'slide',
        direction: 'right'
      }
    );
  }, [trackInteraction, navigateBetweenComponents]);
  
  // Show "Back to Analytics" button when viewing a template from analytics
  const renderBackToAnalyticsButton = () => {
    const fromAnalytics = getComponentState<boolean>('templateLibrary', 'fromAnalytics');
    
    if (pathname?.includes('/templates') && fromAnalytics) {
      return (
        <ElementTransition type="fade" delay={0.2}>
          <div className="fixed top-20 left-4 z-30">
            <Button
              size="sm"
              variant="outline"
              className="shadow-sm bg-white/90 backdrop-blur-sm"
              onClick={handleBackToAnalytics}
            >
              <ArrowRight className="h-4 w-4 mr-1 rotate-180" />
              Back to Analytics
            </Button>
          </div>
        </ElementTransition>
      );
    }
    
    return null;
  };
  
  // Process children to inject navigation handlers
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
    const isAnalyticsComponent = 
      componentName === 'EnhancedAnalyticsDisplay' || 
      (componentName && componentName.includes('Analytics')) ||
      child.props.className?.includes('analytics');
    
    // For analytics components, add template navigation handlers
    if (isAnalyticsComponent) {
      return React.cloneElement(child, {
        onTemplateSelect: handleAnalyticsToTemplateNavigation,
        onCompareTemplates: handleComparisonNavigation
      } as any);
    }
    
    return child;
  });
  
  return (
    <>
      {enhancedChildren}
      {renderBackToAnalyticsButton()}
    </>
  );
} 