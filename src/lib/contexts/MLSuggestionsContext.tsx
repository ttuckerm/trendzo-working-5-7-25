"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode, useMemo } from 'react';
import { useTemplateEditor } from './TemplateEditorContext';
import { TextElement } from '@/lib/types/templateEditor.types';
import { 
  AISuggestions, 
  AISuggestionsUIState, 
  AISuggestionsAction, 
  SuggestionCategory 
} from '@/lib/types/mlSuggestions';
import { aiSuggestionService } from '@/lib/services/aiSuggestionService';

/**
 * ML Suggestions Context
 * 
 * This context provider handles all ML suggestion state and operations.
 * It is completely isolated from the main TemplateEditorContext to prevent disruption.
 */

// Interface for the ML suggestions context
interface MLSuggestionsContextProps {
  // State
  suggestions: AISuggestions;
  uiState: AISuggestionsUIState;
  
  // Actions
  requestSuggestions: (category: SuggestionCategory, elementId?: string) => Promise<void>;
  applySuggestion: (category: SuggestionCategory, suggestionId: string) => void;
  clearSuggestions: () => void;
  setSelectedCategory: (category: SuggestionCategory) => void;
  togglePremiumEnabled: () => void;
  
  // Computed values
  hasSuggestions: boolean;
  canRequestSuggestions: boolean;
}

// Initial state for suggestions
const initialSuggestions: AISuggestions = {
  textSuggestions: {},
  layoutSuggestions: [],
  performanceTips: []
};

// Initial state for UI
const initialUIState: AISuggestionsUIState = {
  isLoading: false,
  error: undefined,
  selectedCategory: 'text',
  isPremiumEnabled: false
};

// Reducer for suggestions
const suggestionsReducer = (state: AISuggestions, action: AISuggestionsAction): AISuggestions => {
  switch (action.type) {
    case 'SET_SUGGESTIONS':
      return {
        ...state,
        ...action.payload,
        lastUpdated: new Date()
      };
    case 'CLEAR_SUGGESTIONS':
      return initialSuggestions;
    default:
      return state;
  }
};

// Reducer for UI state
const uiStateReducer = (state: AISuggestionsUIState, action: AISuggestionsAction): AISuggestionsUIState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? undefined : state.error // Clear error when loading starts
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case 'SET_SELECTED_CATEGORY':
      return {
        ...state,
        selectedCategory: action.payload
      };
    case 'SET_PREMIUM_ENABLED':
      return {
        ...state,
        isPremiumEnabled: action.payload
      };
    default:
      return state;
  }
};

// Create context
const MLSuggestionsContext = createContext<MLSuggestionsContextProps | undefined>(undefined);

// Provider component
export const MLSuggestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Access TemplateEditor context
  const { selectedSection, selectedElement, trackInteraction } = useTemplateEditor();
  
  // State for suggestions and UI
  const [suggestions, dispatchSuggestions] = useReducer(suggestionsReducer, initialSuggestions);
  const [uiState, dispatchUIState] = useReducer(uiStateReducer, initialUIState);
  
  // Computed values
  const hasSuggestions = useMemo(() => {
    const { textSuggestions, layoutSuggestions, performanceTips } = suggestions;
    
    if (uiState.selectedCategory === 'text') {
      return Object.values(textSuggestions).some(suggestions => suggestions.length > 0);
    } else if (uiState.selectedCategory === 'layout') {
      return layoutSuggestions.length > 0;
    } else {
      return performanceTips.length > 0;
    }
  }, [suggestions, uiState.selectedCategory]);
  
  const canRequestSuggestions = useMemo(() => {
    if (!uiState.isPremiumEnabled) return false;
    if (uiState.isLoading) return false;
    
    // Check if we have the necessary selection
    if (uiState.selectedCategory === 'text') {
      return selectedElement?.type === 'text' && !!selectedSection;
    } else if (uiState.selectedCategory === 'layout') {
      return !!selectedSection;
    } else {
      return true; // Performance tips can always be requested
    }
  }, [
    uiState.isPremiumEnabled, 
    uiState.isLoading, 
    uiState.selectedCategory, 
    selectedElement, 
    selectedSection
  ]);
  
  // Actions
  const requestSuggestions = useCallback(async (
    category: SuggestionCategory, 
    elementId?: string
  ) => {
    if (!uiState.isPremiumEnabled) {
      dispatchUIState({ type: 'SET_ERROR', payload: 'Premium subscription required' });
      return;
    }
    
    if (!selectedSection) {
      dispatchUIState({ type: 'SET_ERROR', payload: 'No section selected' });
      return;
    }
    
    // Special validation for text suggestions
    if (category === 'text' && (!selectedElement || selectedElement.type !== 'text')) {
      dispatchUIState({ type: 'SET_ERROR', payload: 'Please select a text element' });
      return;
    }
    
    dispatchUIState({ type: 'SET_LOADING', payload: true });
    trackInteraction('request', `ml-suggestion:${category}`);
    
    try {
      let result;
      
      // Get suggestions from service
      switch (category) {
        case 'text':
          result = await aiSuggestionService.getTextSuggestions(
            selectedSection,
            selectedElement as TextElement
          );
          
          if (result.success && result.data) {
            // Format the data
            const targetId = selectedElement?.id || 'general';
            dispatchSuggestions({
              type: 'SET_SUGGESTIONS',
              payload: {
                textSuggestions: {
                  [targetId]: result.data.map((text, i) => ({
                    id: `text-${i}`,
                    content: text,
                    elementId: targetId,
                    sectionId: selectedSection.id,
                    confidence: 0.7 + (Math.random() * 0.3) // Mock confidence
                  }))
                }
              }
            });
          } else if (result.error) {
            dispatchUIState({ type: 'SET_ERROR', payload: result.error });
          }
          break;
          
        case 'layout':
          result = await aiSuggestionService.getLayoutSuggestions(selectedSection);
          
          if (result.success && result.data) {
            // Format the data
            dispatchSuggestions({
              type: 'SET_SUGGESTIONS',
              payload: {
                layoutSuggestions: result.data.map((item, i) => ({
                  id: item.id || `layout-${i}`,
                  name: item.name,
                  description: item.description,
                  changes: []
                }))
              }
            });
          } else if (result.error) {
            dispatchUIState({ type: 'SET_ERROR', payload: result.error });
          }
          break;
          
        case 'performance':
          result = await aiSuggestionService.getPerformanceTips(
            useTemplateEditor().state.template
          );
          
          if (result.success && result.data) {
            // Format the data
            dispatchSuggestions({
              type: 'SET_SUGGESTIONS',
              payload: {
                performanceTips: result.data.map((tip, i) => ({
                  id: `perf-${i}`,
                  tip,
                  impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
                  category: ['timing', 'visual', 'content', 'structure'][Math.floor(Math.random() * 4)] as 'timing' | 'visual' | 'content' | 'structure'
                }))
              }
            });
          } else if (result.error) {
            dispatchUIState({ type: 'SET_ERROR', payload: result.error });
          }
          break;
      }
    } catch (err: any) {
      dispatchUIState({ type: 'SET_ERROR', payload: err.message || 'Failed to fetch suggestions' });
    } finally {
      dispatchUIState({ type: 'SET_LOADING', payload: false });
    }
  }, [uiState.isPremiumEnabled, selectedSection, selectedElement, trackInteraction]);
  
  const applySuggestion = useCallback((category: SuggestionCategory, suggestionId: string) => {
    if (!uiState.isPremiumEnabled) return;
    
    trackInteraction('apply', `ml-suggestion:${category}:${suggestionId}`);
    
    // In a full implementation, we would dispatch actions to the main editor context
    // For now, we just log it
    console.log(`Applying ${category} suggestion with ID: ${suggestionId}`);
  }, [uiState.isPremiumEnabled, trackInteraction]);
  
  const clearSuggestions = useCallback(() => {
    dispatchSuggestions({ type: 'CLEAR_SUGGESTIONS' });
  }, []);
  
  const setSelectedCategory = useCallback((category: SuggestionCategory) => {
    dispatchUIState({ type: 'SET_SELECTED_CATEGORY', payload: category });
  }, []);
  
  const togglePremiumEnabled = useCallback(() => {
    dispatchUIState({ 
      type: 'SET_PREMIUM_ENABLED', 
      payload: !uiState.isPremiumEnabled 
    });
    
    // Enable or disable the AI service based on premium status
    aiSuggestionService.enableService(!uiState.isPremiumEnabled);
  }, [uiState.isPremiumEnabled]);
  
  // Context value
  const contextValue: MLSuggestionsContextProps = {
    suggestions,
    uiState,
    requestSuggestions,
    applySuggestion,
    clearSuggestions,
    setSelectedCategory,
    togglePremiumEnabled,
    hasSuggestions,
    canRequestSuggestions
  };
  
  return (
    <MLSuggestionsContext.Provider value={contextValue}>
      {children}
    </MLSuggestionsContext.Provider>
  );
};

// Custom hook for using ML suggestions context
export const useMLSuggestions = (): MLSuggestionsContextProps => {
  const context = useContext(MLSuggestionsContext);
  
  if (context === undefined) {
    throw new Error('useMLSuggestions must be used within a MLSuggestionsProvider');
  }
  
  return context;
}; 