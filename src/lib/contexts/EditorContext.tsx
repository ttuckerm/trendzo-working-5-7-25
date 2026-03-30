"use client"

import React, { createContext, useContext, useCallback, useState, ReactNode, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { 
  Element,
  Section,
  Template,
  EditorState,
  EditorUIState,
  TextElement,
  ImageElement,
  VideoElement,
  AudioElement,
  StickerElement,
  EffectElement,
  Animation
} from "@/lib/types/editor";

/**
 * Template Editor Context
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually when needed
 * - Emotional Design: Micro-feedback for all operations
 * - Contextual Intelligence: Adapts to user behavior
 * - Progressive Disclosure: Complexity revealed progressively
 * - Sensory Harmony: Coordinated visual feedback
 */

// Default template with one empty section (welcome experience)
const createDefaultTemplate = (): Template => ({
  id: uuidv4(),
  name: 'Untitled Template',
  sections: [
    {
      id: uuidv4(),
      name: 'Intro Section',
      type: 'intro',
      duration: 5,
      elements: [],
      background: {
        type: 'color',
        value: '#000000',
        opacity: 1
      },
      transition: {
        type: 'fade',
        duration: 0.5,
        direction: 'in',
        easing: 'ease-in-out'
      }
    },
  ],
  aspectRatio: '9:16',
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#EC4899',
    fontFamily: 'Inter'
  }
});

// Initial editor UI state with sensible defaults
const createInitialUIState = (templateId: string): EditorUIState => ({
  selectedSectionId: templateId,
  selectedElementId: null,
  currentTime: 0,
  playing: false,
  zoom: 1,
  editorMode: 'edit',
  showPropertyEditor: false,
  showAdvancedOptions: false,
  activeTab: "elements",
  suggestionsEnabled: true,
  lastAction: {
    type: 'init',
    timestamp: Date.now()
  }
});

// Initial editor state
const createInitialEditorState = (): EditorState => {
  const template = createDefaultTemplate();
  return {
    template,
    ui: createInitialUIState(template.sections[0].id),
    history: {
      past: [],
      future: [],
    },
    analytics: {
      engagementScore: 0,
      sectionScores: {},
      suggestions: []
    },
    aiAssistant: {
      enabled: true,
      suggestionsHistory: []
    }
  };
};

// Create the context
export interface EditorContextType {
  state: EditorState;
  
  // Template operations
  loadTemplate: (template: Template) => void;
  updateTemplate: (updates: Partial<Template>) => void;
  
  // Section operations
  addSection: (sectionType: Section['type']) => void;
  updateSection: (sectionId: string, updates: Partial<Section>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  
  // Element operations
  addElement: (sectionId: string, elementType: Element['type']) => void;
  updateElement: (sectionId: string, elementId: string, updates: Partial<Element>) => void;
  moveElement: (sectionId: string, elementId: string, x: number, y: number) => void;
  resizeElement: (sectionId: string, elementId: string, width: number, height: number, x?: number, y?: number) => void;
  deleteElement: (sectionId: string, elementId: string) => void;
  
  // Selection operations
  selectSection: (sectionId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  
  // Timeline operations
  setCurrentTime: (time: number) => void;
  togglePlayback: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  
  // Premium features
  toggleAdvancedOptions: () => void;
  toggleAIAssistant: () => void;
  applyAISuggestion: (suggestionId: string) => void;
}

// Create the context object
const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Helper function to create a deep copy
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

// EditorProvider component
export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EditorState>(createInitialEditorState());
  const [lastOperation, setLastOperation] = useState<{ type: string; timestamp: number }>({
    type: 'init',
    timestamp: Date.now()
  });

  // Track user actions for contextual intelligence
  useEffect(() => {
    if (lastOperation.type !== 'init') {
      // Update UI state with last action for contextual intelligence
      setState(prev => ({
        ...prev,
        ui: {
          ...prev.ui,
          lastAction: lastOperation
        }
      }));
      
      // Analytics tracking could be added here
      console.log(`Editor operation: ${lastOperation.type} at ${new Date(lastOperation.timestamp).toISOString()}`);
    }
  }, [lastOperation]);

  // Save state to history (with debounce for performance)
  const saveToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: {
        past: [...prev.history.past, deepCopy(prev.template)],
        future: [],
      },
    }));
  }, []);

  // Template operations
  const loadTemplate = useCallback((template: Template) => {
    setState(prev => ({
      ...prev,
      template,
      ui: {
        ...prev.ui,
        selectedSectionId: template.sections.length > 0 ? template.sections[0].id : null,
        selectedElementId: null,
        currentTime: 0,
        playing: false,
      },
      history: {
        past: [],
        future: [],
      }
    }));
    
    setLastOperation({ type: 'loadTemplate', timestamp: Date.now() });
  }, []);

  const updateTemplate = useCallback((updates: Partial<Template>) => {
    saveToHistory();
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        ...updates,
      }
    }));
    
    setLastOperation({ type: 'updateTemplate', timestamp: Date.now() });
  }, [saveToHistory]);

  // Section operations
  const addSection = useCallback((sectionType: Section['type']) => {
    saveToHistory();
    
    // Generate appropriate defaults based on section type (contextual intelligence)
    const getDurationForType = (type: Section['type']): number => {
      switch (type) {
        case 'intro': return 3;
        case 'hook': return 5;
        case 'body': return 10;
        case 'callToAction': return 4;
        case 'outro': return 3;
        default: return 5;
      }
    };
    
    const getNameForType = (type: Section['type']): string => {
      return type.charAt(0).toUpperCase() + type.slice(1) + ' Section';
    };
    
    const newSection: Section = {
      id: uuidv4(),
      name: getNameForType(sectionType),
      type: sectionType,
      duration: getDurationForType(sectionType),
      elements: [],
      background: {
        type: 'color',
        value: '#000000',
        opacity: 1
      },
      transition: {
        type: 'fade',
        duration: 0.5,
        direction: 'in',
        easing: 'ease-in-out'
      }
    };
    
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        sections: [...prev.template.sections, newSection],
      },
      ui: {
        ...prev.ui,
        selectedSectionId: newSection.id,
        selectedElementId: null,
      }
    }));
    
    setLastOperation({ type: 'addSection', timestamp: Date.now() });
  }, [saveToHistory]);

  const updateSection = useCallback((sectionId: string, updates: Partial<Section>) => {
    saveToHistory();
    
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        sections: prev.template.sections.map(section => 
          section.id === sectionId ? { ...section, ...updates } : section
        ),
      }
    }));
    
    setLastOperation({ type: 'updateSection', timestamp: Date.now() });
  }, [saveToHistory]);

  const deleteSection = useCallback((sectionId: string) => {
    saveToHistory();
    
    setState(prev => {
      // Don't delete if it's the only section
      if (prev.template.sections.length <= 1) {
        return prev;
      }
      
      // Update selected section if deleting the currently selected one
      let newSelectedSectionId = prev.ui.selectedSectionId;
      if (newSelectedSectionId === sectionId) {
        const index = prev.template.sections.findIndex(s => s.id === sectionId);
        const newIndex = index > 0 ? index - 1 : 1;
        newSelectedSectionId = prev.template.sections[newIndex > 0 ? newIndex : 0]?.id || null;
      }
      
      return {
        ...prev,
        template: {
          ...prev.template,
          sections: prev.template.sections.filter(section => section.id !== sectionId),
        },
        ui: {
          ...prev.ui,
          selectedSectionId: newSelectedSectionId,
          selectedElementId: null,
        }
      };
    });
    
    setLastOperation({ type: 'deleteSection', timestamp: Date.now() });
  }, [saveToHistory]);

  const reorderSections = useCallback((startIndex: number, endIndex: number) => {
    saveToHistory();
    
    setState(prev => {
      const sections = [...prev.template.sections];
      const [removed] = sections.splice(startIndex, 1);
      sections.splice(endIndex, 0, removed);
      
      return {
        ...prev,
        template: {
          ...prev.template,
          sections,
        }
      };
    });
    
    setLastOperation({ type: 'reorderSections', timestamp: Date.now() });
  }, [saveToHistory]);

  // Element operations with sensible defaults (progressive disclosure)
  const createDefaultElement = (type: Element['type'], sectionId: string): Omit<Element, 'id'> => {
    // Base properties all elements have
    const baseProps = {
      type,
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      locked: false,
      opacity: 1,
      rotation: 0,
      zIndex: 1,
    };
    
    // Get section for context
    const section = state.template.sections.find(s => s.id === sectionId);
    
    switch (type) {
      case 'text':
        return {
          ...baseProps,
          type: 'text',
          content: 'Add your text here',
          fontSize: 24,
          fontWeight: '500',
          fontFamily: state.template.theme?.fontFamily || 'Inter',
          color: '#FFFFFF',
          textAlign: 'center',
        } as Omit<TextElement, 'id'>;
        
      case 'image':
        return {
          ...baseProps,
          type: 'image',
          src: '', // User will need to select an image
          alt: 'Image description',
          borderRadius: 0,
        } as Omit<ImageElement, 'id'>;
        
      case 'video':
        return {
          ...baseProps,
          type: 'video',
          src: '', // User will need to select a video
          muted: true,
          loop: true,
          autoplay: section?.type === 'intro',
          controls: false,
        } as Omit<VideoElement, 'id'>;
      
      case 'audio':
        return {
          ...baseProps,
          type: 'audio',
          src: '', // User will need to select audio
          volume: 0.8,
          visualizer: true,
        } as Omit<AudioElement, 'id'>;
        
      case 'sticker':
        return {
          ...baseProps,
          type: 'sticker',
          src: '', // User will need to select a sticker
          category: 'general',
        } as Omit<StickerElement, 'id'>;
        
      case 'effect':
        return {
          ...baseProps,
          type: 'effect',
          effectType: 'particle',
          config: {
            particleType: 'confetti',
            intensity: 5,
            duration: 2,
          },
        } as Omit<EffectElement, 'id'>;
        
      default:
        return baseProps as any;
    }
  };

  const addElement = useCallback((sectionId: string, elementType: Element['type']) => {
    saveToHistory();
    
    const newElementBase = createDefaultElement(elementType, sectionId);
    const newElementId = uuidv4();
    const newElement = { ...newElementBase, id: newElementId } as Element;
    
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        sections: prev.template.sections.map(section => 
          section.id === sectionId 
            ? { ...section, elements: [...section.elements, newElement] } 
            : section
        ),
      },
      ui: {
        ...prev.ui,
        selectedElementId: newElementId,
        selectedSectionId: sectionId,
        showPropertyEditor: true,
      }
    }));
    
    setLastOperation({ type: `addElement:${elementType}`, timestamp: Date.now() });
  }, [saveToHistory]);

  const updateElement = useCallback((sectionId: string, elementId: string, updates: Partial<Element>) => {
    saveToHistory();
    
    setState(prev => {
      const updatedSections = prev.template.sections.map(section => {
        if (section.id !== sectionId) return section;
        
        const updatedElements = section.elements.map(element => {
          if (element.id !== elementId) return element;
          return { ...element, ...updates } as Element;
        });
        
        return { ...section, elements: updatedElements };
      });
      
      return {
        ...prev,
        template: {
          ...prev.template,
          sections: updatedSections,
        }
      };
    });
    
    setLastOperation({ type: 'updateElement', timestamp: Date.now() });
  }, [saveToHistory]);

  const moveElement = useCallback((sectionId: string, elementId: string, x: number, y: number) => {
    // Don't save to history on move to avoid excessive history entries
    // Only save on move end
    
    setState(prev => {
      const updatedSections = prev.template.sections.map(section => {
        if (section.id !== sectionId) return section;
        
        const updatedElements = section.elements.map(element => {
          if (element.id !== elementId) return element;
          return { ...element, x, y } as Element;
        });
        
        return { ...section, elements: updatedElements };
      });
      
      return {
        ...prev,
        template: {
          ...prev.template,
          sections: updatedSections,
        }
      };
    });
    
    // Just track the operation without saving to history
    setLastOperation({ type: 'moveElement', timestamp: Date.now() });
  }, []);

  const resizeElement = useCallback((sectionId: string, elementId: string, width: number, height: number, x?: number, y?: number) => {
    // Don't save to history on resize to avoid excessive history entries
    // Only save on resize end
    
    setState(prev => {
      const updatedSections = prev.template.sections.map(section => {
        if (section.id !== sectionId) return section;
        
        const updatedElements = section.elements.map(element => {
          if (element.id !== elementId) return element;
          return { 
            ...element, 
            width, 
            height,
            ...(x !== undefined && { x }),
            ...(y !== undefined && { y })
          } as Element;
        });
        
        return { ...section, elements: updatedElements };
      });
      
      return {
        ...prev,
        template: {
          ...prev.template,
          sections: updatedSections,
        }
      };
    });
    
    // Just track the operation without saving to history
    setLastOperation({ type: 'resizeElement', timestamp: Date.now() });
  }, []);

  const deleteElement = useCallback((sectionId: string, elementId: string) => {
    saveToHistory();
    
    setState(prev => ({
      ...prev,
      template: {
        ...prev.template,
        sections: prev.template.sections.map(section => 
          section.id === sectionId 
            ? { 
                ...section, 
                elements: section.elements.filter(element => element.id !== elementId)
              } 
            : section
        ),
      },
      ui: {
        ...prev.ui,
        selectedElementId: prev.ui.selectedElementId === elementId ? null : prev.ui.selectedElementId,
        showPropertyEditor: prev.ui.selectedElementId === elementId ? false : prev.ui.showPropertyEditor,
      }
    }));
    
    setLastOperation({ type: 'deleteElement', timestamp: Date.now() });
  }, [saveToHistory]);

  // Selection operations
  const selectSection = useCallback((sectionId: string | null) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        selectedSectionId: sectionId,
        selectedElementId: null,
        showPropertyEditor: false,
      }
    }));
    
    setLastOperation({ type: 'selectSection', timestamp: Date.now() });
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        selectedElementId: elementId,
        showPropertyEditor: elementId !== null,
      }
    }));
    
    setLastOperation({ type: 'selectElement', timestamp: Date.now() });
  }, []);

  // Timeline operations
  const setCurrentTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        currentTime: time,
      }
    }));
  }, []);

  const togglePlayback = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        playing: !prev.ui.playing,
      }
    }));
    
    setLastOperation({ type: 'togglePlayback', timestamp: Date.now() });
  }, []);

  // History operations
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.past.length === 0) return prev;
      
      const newPast = [...prev.history.past];
      const lastTemplate = newPast.pop()!;
      
      return {
        ...prev,
        template: lastTemplate,
        history: {
          past: newPast,
          future: [prev.template, ...prev.history.future],
        }
      };
    });
    
    setLastOperation({ type: 'undo', timestamp: Date.now() });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.history.future.length === 0) return prev;
      
      const [nextTemplate, ...newFuture] = prev.history.future;
      
      return {
        ...prev,
        template: nextTemplate,
        history: {
          past: [...prev.history.past, prev.template],
          future: newFuture,
        }
      };
    });
    
    setLastOperation({ type: 'redo', timestamp: Date.now() });
  }, []);

  // Premium features
  const toggleAdvancedOptions = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        showAdvancedOptions: !prev.ui.showAdvancedOptions
      }
    }));
    
    setLastOperation({ type: 'toggleAdvancedOptions', timestamp: Date.now() });
  }, []);

  const toggleAIAssistant = useCallback(() => {
    setState(prev => ({
      ...prev,
      aiAssistant: {
        ...prev.aiAssistant!,
        enabled: !prev.aiAssistant?.enabled
      }
    }));
    
    setLastOperation({ type: 'toggleAIAssistant', timestamp: Date.now() });
  }, []);

  const applyAISuggestion = useCallback((suggestionId: string) => {
    // This would implement the actual suggestion application logic
    // For now, we just log it
    console.log(`Applying AI suggestion: ${suggestionId}`);
    
    setLastOperation({ type: 'applyAISuggestion', timestamp: Date.now() });
  }, []);

  // Create the context value with all operations
  const contextValue: EditorContextType = {
    state,
    loadTemplate,
    updateTemplate,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addElement,
    updateElement,
    moveElement,
    resizeElement,
    deleteElement,
    selectSection,
    selectElement,
    setCurrentTime,
    togglePlayback,
    undo,
    redo,
    toggleAdvancedOptions,
    toggleAIAssistant,
    applyAISuggestion
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook to use the EditorContext
export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
}; 