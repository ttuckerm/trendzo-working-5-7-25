import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface MLSuggestion {
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  reason: string;
}

interface MLSuggestionResponse {
  templateId: string;
  suggestions: MLSuggestion[];
  patternsApplied: string[];
  patternCount: number;
  generated: string;
  modelVersion: string;
}

interface UseMLSuggestionsOptions {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  category?: string;
}

/**
 * Hook for fetching and managing ML-generated suggestions for trend predictions
 * 
 * @param templateId ID of the template to get suggestions for
 * @param options Additional options for controlling suggestion behavior
 */
export function useMLSuggestions(
  templateId: string | undefined,
  options: UseMLSuggestionsOptions = {}
) {
  const {
    enabled = true,
    autoRefresh = false,
    refreshInterval = 60000, // 1 minute
    category
  } = options;
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MLSuggestion[]>([]);
  const [metadata, setMetadata] = useState<Omit<MLSuggestionResponse, 'suggestions'> | null>(null);
  
  /**
   * Fetch suggestions from the API
   */
  const fetchSuggestions = useCallback(async () => {
    if (!templateId || !enabled) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Build the API URL with query parameters
      let url = `/api/ml/suggestions?templateId=${encodeURIComponent(templateId)}`;
      if (category) {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Handle error responses
        if (response.status === 403) {
          setError('Enterprise tier required to access ML suggestions');
          return;
        }
        
        // Generic error handling
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch suggestions');
        return;
      }
      
      const data: MLSuggestionResponse = await response.json();
      
      // Extract suggestions and metadata
      setSuggestions(data.suggestions);
      setMetadata({
        templateId: data.templateId,
        patternsApplied: data.patternsApplied,
        patternCount: data.patternCount,
        generated: data.generated,
        modelVersion: data.modelVersion
      });
    } catch (error) {
      console.error('Error fetching ML suggestions:', error);
      setError('An unexpected error occurred while fetching suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [templateId, category, enabled]);
  
  /**
   * Apply a suggestion to the trend prediction
   */
  const applySuggestion = useCallback(async (suggestion: MLSuggestion): Promise<boolean> => {
    if (!templateId) return false;
    
    try {
      // Prepare the request data
      const requestData = {
        templateId,
        field: suggestion.field,
        previousValue: suggestion.currentValue,
        newValue: suggestion.suggestedValue,
        reason: `Applied ML suggestion: ${suggestion.reason}`,
        source: 'ml-suggestion',
        adjustmentCategory: getAdjustmentCategory(suggestion.field),
        model: metadata?.modelVersion || 'unknown',
        confidence: suggestion.confidence
      };
      
      // Call the API to apply the adjustment
      const response = await fetch('/api/templates/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply suggestion');
      }
      
      // Update the feedback loop
      await updateFeedbackLoop(suggestion, true);
      
      // Filter out the applied suggestion
      setSuggestions(prev => prev.filter(s => 
        s.field !== suggestion.field || 
        s.suggestedValue !== suggestion.suggestedValue
      ));
      
      return true;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to apply suggestion',
        variant: 'destructive'
      });
      return false;
    }
  }, [templateId, metadata, toast]);
  
  /**
   * Reject a suggestion
   */
  const rejectSuggestion = useCallback(async (suggestion: MLSuggestion): Promise<boolean> => {
    if (!templateId) return false;
    
    try {
      // Update the feedback loop
      await updateFeedbackLoop(suggestion, false);
      
      // Filter out the rejected suggestion
      setSuggestions(prev => prev.filter(s => 
        s.field !== suggestion.field || 
        s.suggestedValue !== suggestion.suggestedValue
      ));
      
      return true;
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      // We'll still return true to remove the suggestion from the UI
      return true;
    }
  }, [templateId]);
  
  /**
   * Update the feedback loop with the result of a suggestion
   */
  const updateFeedbackLoop = async (suggestion: MLSuggestion, wasApplied: boolean) => {
    try {
      // Call the ML feedback API
      await fetch('/api/ml/update-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalPrediction: {
            templateId,
            field: suggestion.field,
            value: suggestion.currentValue
          },
          expertFeedback: {
            wasApplied,
            suggestedValue: suggestion.suggestedValue,
            field: suggestion.field,
            confidence: suggestion.confidence,
            reason: suggestion.reason
          },
          adjustmentMetrics: {
            adjustmentFactor: wasApplied ? 1 : -0.5,
            confidenceImpact: suggestion.confidence > 0.8 ? 'high' : 'low'
          }
        })
      });
    } catch (error) {
      console.error('Error updating ML feedback loop:', error);
      // Non-critical error, so we won't throw
    }
  };
  
  /**
   * Determine the adjustment category based on the field
   */
  const getAdjustmentCategory = (field: string): string => {
    switch (field) {
      case 'confidenceScore':
        return 'confidence';
      case 'daysUntilPeak':
        return 'timing';
      case 'growthTrajectory':
        return 'growth';
      default:
        return 'other';
    }
  };
  
  /**
   * Refresh the suggestions
   */
  const refresh = useCallback(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);
  
  // Fetch suggestions on mount and when dependencies change
  useEffect(() => {
    if (enabled && templateId) {
      fetchSuggestions();
    }
  }, [enabled, templateId, fetchSuggestions]);
  
  // Set up auto-refresh interval if enabled
  useEffect(() => {
    if (!autoRefresh || !enabled || !templateId) return;
    
    const intervalId = setInterval(fetchSuggestions, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [autoRefresh, refreshInterval, enabled, templateId, fetchSuggestions]);
  
  return {
    isLoading,
    error,
    suggestions,
    metadata,
    applySuggestion,
    rejectSuggestion,
    refresh
  };
} 