"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, ReactNode, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Template, 
  TemplateSection, 
  EditorState, 
  EditorAction, 
  EditorUIState,
  TemplateElement,
  Position,
  Size,
  TextElement,
  HistoryEntry
} from '@/lib/types/templateEditor.types';

/**
 * Template Editor Context
 *
 * Implements the Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually via state awareness
 * - Emotional Design: State changes trigger appropriate feedback
 * - Contextual Intelligence: Editor adapts to user behavior patterns
 * - Progressive Disclosure: Features revealed based on expertise level
 * - Sensory Harmony: State transitions coordinated for visual continuity
 */

// Default template with empty intro section
const createDefaultTemplate = (): Template => ({
  id: uuidv4(),
  name: 'Untitled Template',
  description: 'A new TikTok template',
  aspectRatio: '9:16',
  sections: [
    {
      id: uuidv4(),
      name: 'Intro',
      type: 'intro',
      startTime: 0,
      duration: 3,
      elements: [],
      background: {
        type: 'color',
        value: '#000000',
        opacity: 1
      },
      transition: {
        type: 'fade',
        duration: 0.5
      }
    }
  ],
  sound: undefined,
  theme: {
    primaryColor: '#FF3B5C', // TikTok-like red
    secondaryColor: '#69C9D0', // TikTok-like teal
    fontFamily: 'Inter'
  },
  totalDuration: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'current-user', // To be replaced with actual user ID
  isPublished: false
});

// Initial UI state with intelligent defaults
const createInitialUIState = (): EditorUIState => ({
  selectedSectionId: null,
  selectedElementId: null,
  currentTime: 0,
  isPlaying: false,
  playbackSpeed: 1,
  zoom: 1,
  mode: 'edit',
  device: 'mobile', // Default to mobile since TikTok is mobile-first
  showProperties: true,
  showTimeline: true,
  showElementLibrary: true,
  showBrandKit: false, // Hidden initially (progressive disclosure)
  isSaving: false,
  isExporting: false,
  activePanel: 'elements',
  activeTab: 'content',
  lastInteraction: null,
  frequentlyUsedTools: [],
  userExpertiseLevel: 'beginner', // Start users as beginners
  featureDiscovery: {
    textEditing: false,
    mediaUpload: false,
    timeline: false,
    preview: false,
    export: false
  }
});

// Create initial history entry
const createInitialHistoryEntry = (template: Template, uiState: EditorUIState): HistoryEntry => ({
  templateState: template,
  uiState: uiState,
  timestamp: Date.now(),
  actionType: 'INITIALIZE'
});

// Initial editor state combining template, UI, and history
const createInitialEditorState = (): EditorState => {
  const template = createDefaultTemplate();
  const uiState = createInitialUIState();
  const historyEntry = createInitialHistoryEntry(template, uiState);
  
  return {
    template,
    ui: uiState,
    history: {
      past: [],
      current: historyEntry,
      future: []
    }
  };
};

// Helper for deep copying objects (important for immutable state updates)
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Reducer function to handle all editor actions
const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  // Create a timestamp for this action for history tracking
  const actionTimestamp = Date.now();
  
  // Handle the action based on type
  switch (action.type) {
    case 'LOAD_TEMPLATE': {
      const template = action.payload;
      const uiState = {
        ...createInitialUIState(),
        selectedSectionId: template.sections[0]?.id || null
      };
      const historyEntry = createInitialHistoryEntry(template, uiState);
      
      return {
        template,
        ui: uiState,
        history: {
          past: [],
          current: historyEntry,
          future: []
        }
      };
    }
    
    case 'UPDATE_TEMPLATE': {
      const updatedTemplate = {
        ...state.template,
        ...action.payload,
        updatedAt: new Date()
      };
      
      // Record history
      const newHistoryEntry: HistoryEntry = {
        templateState: updatedTemplate,
        uiState: state.ui,
        timestamp: actionTimestamp,
        actionType: action.type
      };
      
      return {
        ...state,
        template: updatedTemplate,
        history: {
          past: [...state.history.past, state.history.current!],
          current: newHistoryEntry,
          future: []
        }
      };
    }
    
    case 'SET_TEMPLATE_NAME': {
      const updatedTemplate = {
        ...state.template,
        name: action.payload,
        updatedAt: new Date()
      };
      
      const newHistoryEntry: HistoryEntry = {
        templateState: updatedTemplate,
        uiState: state.ui,
        timestamp: actionTimestamp,
        actionType: action.type
      };
      
      return {
        ...state,
        template: updatedTemplate,
        history: {
          past: [...state.history.past, state.history.current!],
          current: newHistoryEntry,
          future: []
        }
      };
    }
    
    case 'SET_TEMPLATE_DESCRIPTION': {
      const updatedTemplate = {
        ...state.template,
        description: action.payload,
        updatedAt: new Date()
      };
      
      const newHistoryEntry: HistoryEntry = {
        templateState: updatedTemplate,
        uiState: state.ui,
        timestamp: actionTimestamp,
        actionType: action.type
      };
      
      return {
        ...state,
        template: updatedTemplate,
        history: {
          past: [...state.history.past, state.history.current!],
          current: newHistoryEntry,
          future: []
        }
      };
    }
    
    case 'ADD_SECTION': {
      const newSectionId = uuidv4();
      const newSection: TemplateSection = {
        ...action.payload,
        id: newSectionId
      };
      
      // Calculate startTime based on existing sections
      const existingSections = [...state.template.sections];
      if (existingSections.length > 0) {
        const lastSection = existingSections[existingSections.length - 1];
        newSection.startTime = lastSection.startTime + lastSection.duration;
      } else {
        newSection.startTime = 0;
      }
      
      const updatedSections = [...existingSections, newSection];
      const updatedTemplate = {
        ...state.template,
        sections: updatedSections,
        totalDuration: updatedSections.reduce(
          (total, section) => total + section.duration, 
          0
        ),
        updatedAt: new Date()
      };
      
      // Update UI to select the newly added section
      const updatedUI = {
        ...state.ui,
        selectedSectionId: newSectionId,
        selectedElementId: null
      };
      
      const newHistoryEntry: HistoryEntry = {
        templateState: updatedTemplate,
        uiState: updatedUI,
        timestamp: actionTimestamp,
        actionType: action.type
      };
      
      return {
        ...state,
        template: updatedTemplate,
        ui: updatedUI,
        history: {
          past: [...state.history.past, state.history.current!],
          current: newHistoryEntry,
          future: []
        }
      };
    }
    
    case 'UPDATE_SECTION': {
      const { sectionId, updates } = action.payload;
      
      // Find the section to update
      const sectionIndex = state.template.sections.findIndex(s => s.id === sectionId);
      if (sectionIndex === -1) return state; // Section not found
      
      // Create updated section
      const updatedSection = {
        ...state.template.sections[sectionIndex],
        ...updates
      };
      
      // Update sections array
      const updatedSections = [...state.template.sections];
      updatedSections[sectionIndex] = updatedSection;
      
      // Update template with new sections
      const updatedTemplate = {
        ...state.template,
        sections: updatedSections,
        totalDuration: updatedSections.reduce(
          (total, section) => total + section.duration, 
          0
        ),
        updatedAt: new Date()
      };
      
      const newHistoryEntry: HistoryEntry = {
        templateState: updatedTemplate,
        uiState: state.ui,
        timestamp: actionTimestamp,
        actionType: action.type
      };
      
      return {
        ...state,
        template: updatedTemplate,
        history: {
          past: [...state.history.past, state.history.current!],
          current: newHistoryEntry,
          future: []
        }
      };
    }
    
    // Implement other cases here...
    // For brevity, I'm including key cases that demonstrate the patterns
    
    case 'SELECT_SECTION': {
      const updatedUI = {
        ...state.ui,
        selectedSectionId: action.payload,
        // Clear element selection when changing sections
        selectedElementId: null,
        // Update last interaction for contextual intelligence
        lastInteraction: {
          type: 'select',
          target: `section:${action.payload}`,
          timestamp: actionTimestamp
        }
      };
      
      return {
        ...state,
        ui: updatedUI
      };
    }
    
    case 'SELECT_ELEMENT': {
      let updatedUI: EditorUIState;
      
      if (action.payload === null) {
        // Deselecting
        updatedUI = {
          ...state.ui,
          selectedElementId: null,
          lastInteraction: {
            type: 'deselect',
            target: 'element',
            timestamp: actionTimestamp
          }
        };
      } else {
        // Selecting an element
        const { sectionId, elementId } = action.payload;
        
        updatedUI = {
          ...state.ui,
          selectedSectionId: sectionId,
          selectedElementId: elementId,
          showProperties: true, // Show properties panel when selecting an element
          lastInteraction: {
            type: 'select',
            target: `element:${elementId}`,
            timestamp: actionTimestamp
          }
        };
      }
      
      return {
        ...state,
        ui: updatedUI
      };
    }
    
    case 'TRACK_INTERACTION': {
      // Update interaction tracking for contextual intelligence
      const updatedUI = {
        ...state.ui,
        lastInteraction: {
          ...action.payload,
          timestamp: actionTimestamp
        }
      };
      
      // Update frequently used tools based on this interaction
      const toolName = action.payload.target.split(':')[0];
      if (toolName) {
        const frequentTools = [...state.ui.frequentlyUsedTools];
        
        // Simple frequency counting - more sophisticated algorithm would be used in production
        if (!frequentTools.includes(toolName)) {
          frequentTools.push(toolName);
        }
        
        updatedUI.frequentlyUsedTools = frequentTools.slice(-5); // Keep last 5 tools
      }
      
      return {
        ...state,
        ui: updatedUI
      };
    }
    
    case 'UNDO': {
      // If no past states, can't undo
      if (state.history.past.length === 0) return state;
      
      // Get the previous history entry
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);
      
      return {
        template: previous.templateState,
        ui: {
          ...state.ui,
          ...previous.uiState,
          lastInteraction: {
            type: 'undo',
            target: previous.actionType,
            timestamp: actionTimestamp
          }
        },
        history: {
          past: newPast,
          current: previous,
          future: [state.history.current!, ...state.history.future]
        }
      };
    }
    
    case 'REDO': {
      // If no future states, can't redo
      if (state.history.future.length === 0) return state;
      
      // Get the next history entry
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      
      return {
        template: next.templateState,
        ui: {
          ...state.ui,
          ...next.uiState,
          lastInteraction: {
            type: 'redo',
            target: next.actionType,
            timestamp: actionTimestamp
          }
        },
        history: {
          past: [...state.history.past, state.history.current!],
          current: next,
          future: newFuture
        }
      };
    }
    
    default:
      return state;
  }
};

// Define context interface to provide type safety
interface TemplateEditorContextProps {
  state: EditorState;
  dispatch: React.Dispatch<EditorAction>;
  
  // Convenience methods for common operations
  loadTemplate: (template: Template) => void;
  updateTemplate: (updates: Partial<Template>) => void;
  selectSection: (sectionId: string | null) => void;
  selectElement: (sectionId: string, elementId: string) => void;
  addSection: (sectionType: TemplateSection['type']) => void;
  addTextElement: (sectionId: string, text: string, position: Partial<Position>) => void;
  updateCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  undo: () => void;
  redo: () => void;
  trackInteraction: (type: string, target: string) => void;
  
  // Computed properties
  selectedSection: TemplateSection | null;
  selectedElement: TemplateElement | null;
  isEditing: boolean; // Whether in edit mode vs. preview mode
  canUndo: boolean;
  canRedo: boolean;
}

// Create context with a default value
const TemplateEditorContext = createContext<TemplateEditorContextProps | undefined>(undefined);

// Provider component
export const TemplateEditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(editorReducer, createInitialEditorState());
  
  // Debounce timer ref for localStorage updates
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Template ID for local storage - avoids collisions with multiple templates
  const templateStorageKey = useMemo(() => 
    `template-editor-state-${state.template.id}`,
    [state.template.id]
  );
  
  // Implement convenience methods for common operations
  const loadTemplate = useCallback((template: Template) => {
    dispatch({ type: 'LOAD_TEMPLATE', payload: template });
  }, []);
  
  const updateTemplate = useCallback((updates: Partial<Template>) => {
    dispatch({ type: 'UPDATE_TEMPLATE', payload: updates });
  }, []);
  
  const selectSection = useCallback((sectionId: string | null) => {
    dispatch({ type: 'SELECT_SECTION', payload: sectionId });
  }, []);
  
  const selectElement = useCallback((sectionId: string, elementId: string) => {
    dispatch({ 
      type: 'SELECT_ELEMENT', 
      payload: { sectionId, elementId }
    });
  }, []);
  
  const addSection = useCallback((sectionType: TemplateSection['type']) => {
    const newSection: Omit<TemplateSection, 'id'> = {
      name: sectionType.charAt(0).toUpperCase() + sectionType.slice(1),
      type: sectionType,
      startTime: 0, // Will be calculated in reducer
      duration: sectionType === 'intro' ? 3 : sectionType === 'hook' ? 5 : sectionType === 'callToAction' ? 4 : 8,
      elements: [],
      background: {
        type: 'color',
        value: '#000000',
        opacity: 1
      },
      transition: {
        type: 'fade',
        duration: 0.5
      }
    };
    
    dispatch({ type: 'ADD_SECTION', payload: newSection });
  }, []);
  
  const addTextElement = useCallback((sectionId: string, text: string, position: Partial<Position>) => {
    const newTextElement: Omit<TextElement, 'id'> = {
      type: 'text',
      content: text,
      position: {
        x: position.x ?? 50, // Center by default
        y: position.y ?? 50, // Center by default
        z: position.z ?? 1,  // Top layer by default
      },
      size: {
        width: 80, // 80% of container width by default
        height: 20 // 20% of container height by default
      },
      style: {
        fontFamily: 'Inter',
        fontSize: 24,
        fontWeight: 'normal',
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 1,
        shadow: {
          color: 'rgba(0,0,0,0.5)',
          blur: 4,
          offsetX: 2,
          offsetY: 2
        }
      }
    };
    
    dispatch({
      type: 'ADD_ELEMENT',
      payload: {
        sectionId,
        element: newTextElement
      }
    });
  }, []);
  
  const updateCurrentTime = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
  }, []);
  
  const togglePlayback = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAYBACK' });
  }, []);
  
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);
  
  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);
  
  const trackInteraction = useCallback((type: string, target: string) => {
    dispatch({
      type: 'TRACK_INTERACTION',
      payload: { type, target }
    });
  }, []);
  
  // Computed values
  const selectedSection = useMemo(() => {
    if (!state.ui.selectedSectionId) return null;
    return state.template.sections.find(s => s.id === state.ui.selectedSectionId) || null;
  }, [state.template.sections, state.ui.selectedSectionId]);
  
  const selectedElement = useMemo(() => {
    if (!selectedSection || !state.ui.selectedElementId) return null;
    return selectedSection.elements.find(e => e.id === state.ui.selectedElementId) || null;
  }, [selectedSection, state.ui.selectedElementId]);
  
  const isEditing = useMemo(() => state.ui.mode === 'edit', [state.ui.mode]);
  
  const canUndo = useMemo(() => state.history.past.length > 0, [state.history.past.length]);
  
  const canRedo = useMemo(() => state.history.future.length > 0, [state.history.future.length]);
  
  // Extract essential state for serialization to prevent circular refs
  const getEssentialStateForStorage = useCallback(() => {
    try {
      // Only save essential UI state (not the entire object to avoid serialization issues)
      return {
        template: {
          id: state.template.id,
          name: state.template.name, 
          description: state.template.description,
          aspectRatio: state.template.aspectRatio,
          sections: state.template.sections,
          theme: state.template.theme,
          totalDuration: state.template.totalDuration
        },
        ui: {
          selectedSectionId: state.ui.selectedSectionId,
          selectedElementId: state.ui.selectedElementId,
          mode: state.ui.mode,
          device: state.ui.device,
          activePanel: state.ui.activePanel,
          activeTab: state.ui.activeTab,
          userExpertiseLevel: state.ui.userExpertiseLevel
        }
      };
    } catch (e) {
      console.error('Failed to extract essential state:', e);
      return null;
    }
  }, [state.template.id, state.template.name, state.template.description, 
      state.template.aspectRatio, state.template.sections, state.template.theme,
      state.template.totalDuration, state.ui.selectedSectionId, 
      state.ui.selectedElementId, state.ui.mode, state.ui.device,
      state.ui.activePanel, state.ui.activeTab, state.ui.userExpertiseLevel]);
  
  // Save state to localStorage with error handling and serialization check
  const saveStateToLocalStorage = useCallback(() => {
    try {
      const essentialState = getEssentialStateForStorage();
      
      if (essentialState) {
        const serialized = JSON.stringify(essentialState);
        localStorage.setItem(templateStorageKey, serialized);
      }
    } catch (e) {
      console.error('Failed to save editor state to localStorage:', e);
    }
  }, [getEssentialStateForStorage, templateStorageKey]);
  
  // Debounced auto-save to localStorage - improved to prevent infinite loops
  useEffect(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveStateToLocalStorage();
      saveTimerRef.current = null;
    }, 2000); // 2 second debounce, increased to reduce storage operations
    
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [saveStateToLocalStorage]);
  
  // Load saved state from local storage on initial render with error handling
  const loadInitialStateOnce = useRef(false);
  
  useEffect(() => {
    // Skip if we've already tried to load
    if (loadInitialStateOnce.current) return;
    loadInitialStateOnce.current = true;
    
    try {
      const savedState = localStorage.getItem(templateStorageKey);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed?.template?.id) {
            // Only load if we have a valid template
            loadTemplate(parsed.template);
            
            // Apply saved UI state (safely)
            if (parsed.ui) {
              if (parsed.ui.selectedSectionId) {
                dispatch({ type: 'SELECT_SECTION', payload: parsed.ui.selectedSectionId });
              }
              
              if (parsed.ui.mode) {
                dispatch({ type: 'SET_EDITOR_MODE', payload: parsed.ui.mode });
              }
              
              if (parsed.ui.device) {
                dispatch({ type: 'SET_DEVICE_VIEW', payload: parsed.ui.device });
              }
            }
          }
        } catch (parseError) {
          // If parsing fails, don't crash - just log and continue with default state
          console.error('Failed to parse saved editor state:', parseError);
        }
      }
    } catch (e) {
      console.error('Failed to load editor state from localStorage:', e);
    }
  }, [loadTemplate, templateStorageKey]); // Only include stable dependencies
  
  // Context value
  const contextValue: TemplateEditorContextProps = {
    state,
    dispatch,
    loadTemplate,
    updateTemplate,
    selectSection,
    selectElement,
    addSection,
    addTextElement,
    updateCurrentTime,
    togglePlayback,
    undo,
    redo,
    trackInteraction,
    selectedSection,
    selectedElement,
    isEditing,
    canUndo,
    canRedo
  };
  
  return (
    <TemplateEditorContext.Provider value={contextValue}>
      {children}
    </TemplateEditorContext.Provider>
  );
};

// Custom hook for accessing context
export const useTemplateEditor = (): TemplateEditorContextProps => {
  const context = useContext(TemplateEditorContext);
  if (context === undefined) {
    throw new Error('useTemplateEditor must be used within a TemplateEditorProvider');
  }
  return context;
}; 