import { useState, useCallback } from 'react';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { aiSuggestionService, SuggestionType } from '@/lib/services/aiSuggestionService';
import { TextElement } from '@/lib/types/templateEditor.types';

/**
 * Custom hook for managing AI suggestions
 * 
 * This hook encapsulates the logic for requesting and handling AI suggestions
 * while keeping it isolated from the main application flow to prevent disruption.
 */
export function useAISuggestions() {
  const { state, dispatch, selectedSection, selectedElement } = useTemplateEditor();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumUser, setIsPremiumUser] = useState(false); // Mock premium status
  
  /**
   * Toggle premium user status (for demo purposes)
   */
  const togglePremiumStatus = useCallback(() => {
    setIsPremiumUser(prev => !prev);
  }, []);
  
  /**
   * Request AI suggestions
   */
  const requestSuggestions = useCallback(async (type: SuggestionType) => {
    // Block non-premium users
    if (!isPremiumUser) {
      setError('Premium subscription required');
      return;
    }
    
    // Check if the section is selected
    if (!selectedSection) {
      setError('No section selected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      switch (type) {
        case 'text':
          // For text suggestions, we need a text element
          if (selectedElement?.type !== 'text') {
            setError('Please select a text element');
            setIsLoading(false);
            return;
          }
          
          result = await aiSuggestionService.getTextSuggestions(
            selectedSection,
            selectedElement as TextElement
          );
          break;
          
        case 'layout':
          result = await aiSuggestionService.getLayoutSuggestions(selectedSection);
          break;
          
        case 'performance':
          result = await aiSuggestionService.getPerformanceTips(state.template);
          break;
      }
      
      if (result.success && result.data) {
        // Here we would dispatch an action to update the state with the suggestions
        // For now, we'll just log them to avoid disrupting the application
        console.log(`AI Suggestions (${type}):`, result.data);
        
        // In a complete implementation, we would dispatch an action like:
        /*
        dispatch({
          type: 'SET_AI_SUGGESTIONS',
          payload: {
            [type]: type === 'text' 
              ? { [selectedElement.id]: result.data }
              : result.data
          }
        });
        */
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [isPremiumUser, selectedSection, selectedElement, state.template]);
  
  /**
   * Apply a suggestion to the template
   */
  const applySuggestion = useCallback((type: SuggestionType, suggestionId: string | number) => {
    // This would normally dispatch an action to apply the suggestion
    // For now, we just log it to avoid disrupting the application
    console.log(`Applying ${type} suggestion with ID:`, suggestionId);
    
    // In a complete implementation, we would dispatch an action like:
    /*
    dispatch({
      type: 'APPLY_AI_SUGGESTION',
      payload: { type, suggestionId }
    });
    */
  }, []);
  
  return {
    isLoading,
    error,
    isPremiumUser,
    togglePremiumStatus,
    requestSuggestions,
    applySuggestion
  };
} 