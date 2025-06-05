import { useState, useEffect, useCallback, useMemo } from 'react';
import { templateEngineIntegration, TemplateGenerationRequest, GeneratedTemplate } from '@/lib/services/templateEngineIntegration';
import { Niche, Platform } from '@/lib/types/database';

interface UseOptimizedTemplateEngineProps {
  niche: Niche;
  platform: Platform;
  userId?: string;
  preload?: boolean;
}

interface TemplateEngineState {
  template: GeneratedTemplate | null;
  isLoading: boolean;
  error: string | null;
  variations: GeneratedTemplate[];
  recommendations: string[];
  performance: {
    loadTime: number;
    cacheHit: boolean;
  };
}

// Template cache with TTL
const templateCache = new Map<string, { data: GeneratedTemplate; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useOptimizedTemplateEngine({
  niche,
  platform,
  userId,
  preload = false
}: UseOptimizedTemplateEngineProps) {
  const [state, setState] = useState<TemplateEngineState>({
    template: null,
    isLoading: false,
    error: null,
    variations: [],
    recommendations: [],
    performance: {
      loadTime: 0,
      cacheHit: false
    }
  });

  // Memoized cache key
  const cacheKey = useMemo(() => 
    `${niche}-${platform}-${userId || 'anon'}`, 
    [niche, platform, userId]
  );

  // Check cache for existing template
  const getCachedTemplate = useCallback((key: string): GeneratedTemplate | null => {
    const cached = templateCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    if (cached) {
      templateCache.delete(key); // Remove expired cache
    }
    return null;
  }, []);

  // Cache template
  const cacheTemplate = useCallback((key: string, template: GeneratedTemplate) => {
    templateCache.set(key, {
      data: template,
      timestamp: Date.now()
    });
  }, []);

  // Generate template with performance tracking
  const generateTemplate = useCallback(async (
    customization?: TemplateGenerationRequest['customization']
  ): Promise<GeneratedTemplate | null> => {
    const startTime = performance.now();
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      // Check cache first
      const cached = getCachedTemplate(cacheKey);
      if (cached) {
        const loadTime = performance.now() - startTime;
        setState(prev => ({
          ...prev,
          template: cached,
          isLoading: false,
          recommendations: cached.recommendations,
          performance: {
            loadTime,
            cacheHit: true
          }
        }));
        return cached;
      }

      // Generate new template
      const request: TemplateGenerationRequest = {
        niche,
        platform,
        userId,
        customization
      };

      const template = await templateEngineIntegration.generateTemplate(request);
      const loadTime = performance.now() - startTime;

      // Cache the result
      cacheTemplate(cacheKey, template);

      setState(prev => ({
        ...prev,
        template,
        isLoading: false,
        recommendations: template.recommendations,
        performance: {
          loadTime,
          cacheHit: false
        }
      }));

      return template;

    } catch (error) {
      const loadTime = performance.now() - startTime;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate template',
        performance: {
          loadTime,
          cacheHit: false
        }
      }));
      return null;
    }
  }, [niche, platform, userId, cacheKey, getCachedTemplate, cacheTemplate]);

  // Generate template variations
  const generateVariations = useCallback(async (templateId: string, count = 3) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const variations = await templateEngineIntegration.getTemplateVariations(templateId, count);
      
      setState(prev => ({
        ...prev,
        variations,
        isLoading: false
      }));

      return variations;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate variations'
      }));
      return [];
    }
  }, []);

  // Analyze template performance
  const analyzeTemplate = useCallback(async (templateId: string) => {
    try {
      const analysis = await templateEngineIntegration.analyzeTemplatePerformance(templateId);
      return analysis;
    } catch (error) {
      console.error('Template analysis failed:', error);
      return null;
    }
  }, []);

  // Preload template if requested
  useEffect(() => {
    if (preload && !state.template && !state.isLoading) {
      generateTemplate();
    }
  }, [preload, generateTemplate, state.template, state.isLoading]);

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Keep cache for other instances, just cleanup expired entries
      for (const [key, value] of templateCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_TTL) {
          templateCache.delete(key);
        }
      }
    };
  }, []);

  return {
    // State
    template: state.template,
    variations: state.variations,
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
    performance: state.performance,

    // Actions
    generateTemplate,
    generateVariations,
    analyzeTemplate,

    // Utilities
    clearCache: () => templateCache.clear(),
    getCacheInfo: () => ({
      size: templateCache.size,
      keys: Array.from(templateCache.keys())
    })
  };
}

// Preload templates for common niche/platform combinations
export function preloadCommonTemplates() {
  const commonCombinations: Array<{ niche: Niche; platform: Platform }> = [
    { niche: 'business', platform: 'linkedin' },
    { niche: 'creator', platform: 'instagram' },
    { niche: 'fitness', platform: 'instagram' },
    { niche: 'education', platform: 'linkedin' }
  ];

  commonCombinations.forEach(async ({ niche, platform }) => {
    try {
      const cacheKey = `${niche}-${platform}-anon`;
      const cached = templateCache.get(cacheKey);
      
      if (!cached || Date.now() - cached.timestamp > CACHE_TTL) {
        const template = await templateEngineIntegration.generateTemplate({
          niche,
          platform
        });
        
        templateCache.set(cacheKey, {
          data: template,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error(`Failed to preload template for ${niche}-${platform}:`, error);
    }
  });
}

// Export for global use
export { templateCache };