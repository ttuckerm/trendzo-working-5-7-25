/**
 * ML Suggestions Types
 * 
 * This file contains all types related to the ML suggestions feature.
 */

import { Template, TemplateSection, TemplateElement } from "./templateEditor.types";

// Response type for AI service calls
export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types of ML suggestions available
export type SuggestionCategory = 'text' | 'layout' | 'performance';

// Text suggestion model
export interface TextSuggestion {
  id: string;
  text: string;
  confidence?: number;
}

// Layout suggestion model
export interface LayoutSuggestion {
  id: string;
  name: string;
  description: string;
  preview?: string; // URL to preview image
}

// Performance tip model
export interface PerformanceTip {
  id: string;
  tip: string;
  impact: 'low' | 'medium' | 'high';
  category: 'engagement' | 'retention' | 'conversion' | 'accessibility';
}

// Combined state for all ML suggestions
export interface MLSuggestionsState {
  textSuggestions: {
    loading: boolean;
    error: string | null;
    suggestions: string[];
    selectedSuggestion: string | null;
  };
  layoutSuggestions: {
    loading: boolean;
    error: string | null;
    suggestions: LayoutSuggestion[];
    selectedSuggestion: string | null;
  };
  performanceTips: {
    loading: boolean;
    error: string | null;
    tips: string[];
    selectedTip: string | null;
  };
}

// UI state for ML suggestions panel
export interface MLSuggestionsUIState {
  isPanelOpen: boolean;
  activeSuggestionCategory: SuggestionCategory;
  isPremiumEnabled: boolean;
}

// Combined state for the ML suggestions context
export interface MLSuggestionsContextState {
  suggestions: MLSuggestionsState;
  ui: MLSuggestionsUIState;
}

// Actions that can be performed on ML suggestions
export type MLSuggestionsAction =
  | { type: 'REQUEST_TEXT_SUGGESTIONS' }
  | { type: 'REQUEST_TEXT_SUGGESTIONS_SUCCESS'; payload: string[] }
  | { type: 'REQUEST_TEXT_SUGGESTIONS_ERROR'; payload: string }
  | { type: 'SELECT_TEXT_SUGGESTION'; payload: string }
  
  | { type: 'REQUEST_LAYOUT_SUGGESTIONS' }
  | { type: 'REQUEST_LAYOUT_SUGGESTIONS_SUCCESS'; payload: LayoutSuggestion[] }
  | { type: 'REQUEST_LAYOUT_SUGGESTIONS_ERROR'; payload: string }
  | { type: 'SELECT_LAYOUT_SUGGESTION'; payload: string }
  
  | { type: 'REQUEST_PERFORMANCE_TIPS' }
  | { type: 'REQUEST_PERFORMANCE_TIPS_SUCCESS'; payload: string[] }
  | { type: 'REQUEST_PERFORMANCE_TIPS_ERROR'; payload: string }
  | { type: 'SELECT_PERFORMANCE_TIP'; payload: string }
  
  | { type: 'CLEAR_ALL_SUGGESTIONS' };

// Actions that can be performed on the UI state
export type MLSuggestionsUIAction =
  | { type: 'TOGGLE_PANEL' }
  | { type: 'OPEN_PANEL' }
  | { type: 'CLOSE_PANEL' }
  | { type: 'SET_ACTIVE_CATEGORY'; payload: SuggestionCategory }
  | { type: 'TOGGLE_PREMIUM'; payload: boolean };

// Interface for the ML suggestions context
export interface MLSuggestionsContextValue {
  // State
  state: MLSuggestionsContextState;
  
  // Actions
  requestTextSuggestions: (section: TemplateSection, element: TemplateElement) => Promise<void>;
  requestLayoutSuggestions: (section: TemplateSection) => Promise<void>;
  requestPerformanceTips: (template: Template) => Promise<void>;
  
  selectTextSuggestion: (suggestion: string) => void;
  selectLayoutSuggestion: (suggestionId: string) => void;
  selectPerformanceTip: (tipId: string) => void;
  
  applySelectedTextSuggestion: () => void;
  applySelectedLayoutSuggestion: () => void;
  applySelectedPerformanceTip: () => void;
  
  clearAllSuggestions: () => void;
  
  // UI Actions
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveCategory: (category: SuggestionCategory) => void;
  togglePremium: (enabled: boolean) => void;
  
  // Computed
  hasTextSuggestions: boolean;
  hasLayoutSuggestions: boolean;
  hasPerformanceTips: boolean;
  hasAnySuggestions: boolean;
  isLoading: boolean;
  hasError: boolean;
} 