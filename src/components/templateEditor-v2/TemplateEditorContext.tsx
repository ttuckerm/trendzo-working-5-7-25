"use client";

import React, { createContext, useContext, useReducer, useMemo, useCallback, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { 
  Template,
  TemplateSection,
  Element,
  ElementType,
  EditorState,
  Action,
  ActionType,
  EditorUIState,
  EditorSettings
} from "./types";

// Create simple ID generator function in case uuid is not available
const generateId = () => {
  try {
    return uuidv4();
  } catch (error) {
    return `id-${Math.random().toString(36).substring(2, 11)}`;
  }
};

const defaultTextElementId = generateId(); // Generate ID for the default element

// Initial state for the editor
const initialTemplateSection: TemplateSection = {
  id: generateId(),
  name: "Section 1",
  order: 0,
  elements: [
    {
      id: defaultTextElementId,
      type: "text",
      content: "Hello World!",
      x: 50,
      y: 50,
      width: 200,
      height: 50,
      fontSize: 24,
      fontFamily: "Arial, sans-serif",
      color: "#333333",
      textAlign: "center",
      rotation: 0,
      opacity: 1,
      locked: false,
      hidden: false,
      zIndex: 1,
    }
  ],
  backgroundColor: "#ffffff",
};

const initialTemplate: Template = {
  id: uuidv4(),
  name: "Untitled Template",
  aspectRatio: "9:16",
  sections: [initialTemplateSection],
};

const initialUIState: EditorUIState = {
  selectedSectionId: initialTemplateSection.id,
  selectedElementId: defaultTextElementId, // Select the default text element
  activeTool: null,
  zoom: 1,
  showGrid: false,
  gridSize: 10,
  snapToGrid: true,
  panels: {
    elementsOpen: true,
    propertiesOpen: true,
    previewMode: false,
  },
  history: {
    past: [],
    future: [],
  },
  contextMenuPosition: null,
};

const initialSettings: EditorSettings = {
  autosaveEnabled: true,
  autosaveInterval: 30000, // 30 seconds
  defaultAspectRatio: "9:16",
  defaultFontFamily: "Inter, sans-serif",
  defaultTextColor: "#000000",
  defaultBackgroundColor: "#ffffff",
  showDimensionsOnResize: true,
  showPositionOnMove: true,
  useSmartGuides: true,
};

const initialState: EditorState = {
  template: initialTemplate,
  ui: initialUIState,
  settings: initialSettings,
  activeDevice: "desktop",
  cloudSyncStatus: "not-synced",
  lastSavedAt: null,
};

// Create the context
type TemplateEditorContextType = {
  state: EditorState;
  dispatch: React.Dispatch<Action>;
  
  // Helper functions
  selectSection: (sectionId: string | null) => void;
  selectElement: (elementId: string | null) => void;
  addSection: (name: string) => void;
  addElement: (sectionId: string, type: ElementType) => void;
  updateElement: (sectionId: string, elementId: string, updates: Partial<Element>) => void;
  moveElement: (sectionId: string, elementId: string, x: number, y: number) => void;
  resizeElement: (sectionId: string, elementId: string, width: number, height: number) => void;
  deleteElement: (sectionId: string, elementId: string) => void;
  duplicateElement: (sectionId: string, elementId: string) => void;
  updateSection: (sectionId: string, updates: Partial<TemplateSection>) => void;
  deleteSection: (sectionId: string) => void;
  setActiveTool: (tool: EditorUIState["activeTool"]) => void;
  toggleGrid: () => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
};

const TemplateEditorContext = createContext<TemplateEditorContextType | undefined>(undefined);

// Create a reducer function to handle state updates
function templateEditorReducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case ActionType.SET_TEMPLATE:
      return {
        ...state,
        template: action.payload,
      };
      
    case ActionType.UPDATE_TEMPLATE:
      return {
        ...state,
        template: {
          ...state.template,
          ...action.payload,
        },
      };
      
    case ActionType.ADD_SECTION: {
      const newSection: TemplateSection = {
        id: generateId(),
        name: action.payload.name,
        order: action.payload.order !== undefined 
          ? action.payload.order 
          : state.template.sections.length,
        elements: [],
        backgroundColor: state.settings.defaultBackgroundColor,
      };
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: [...state.template.sections, newSection],
        },
        ui: {
          ...state.ui,
          selectedSectionId: newSection.id,
          selectedElementId: null,
        },
      };
    }
    
    case ActionType.UPDATE_SECTION: {
      const { sectionId, updates } = action.payload;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) =>
            section.id === sectionId
              ? { ...section, ...updates }
              : section
          ),
        },
      };
    }
    
    case ActionType.DELETE_SECTION: {
      const { sectionId } = action.payload;
      const newSections = state.template.sections.filter(
        (section) => section.id !== sectionId
      );
      
      // If deleting the currently selected section, select the first section
      const newSelectedSectionId = 
        state.ui.selectedSectionId === sectionId && newSections.length > 0
          ? newSections[0].id
          : state.ui.selectedSectionId;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: newSections,
        },
        ui: {
          ...state.ui,
          selectedSectionId: newSelectedSectionId,
          selectedElementId: null,
        },
      };
    }
    
    case ActionType.ADD_ELEMENT: {
      const { sectionId, type } = action.payload;
      
      // Create default element properties based on type
      const baseElement = {
        id: generateId(),
        type,
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        hidden: false,
        zIndex: 1,
      };
      
      let newElement: Element;
      
      switch (type) {
        case "text":
          newElement = {
            ...baseElement,
            content: "Text Element",
            fontSize: 16,
            fontFamily: state.settings.defaultFontFamily,
            color: state.settings.defaultTextColor,
            textAlign: "left",
          };
          break;
        case "image":
          newElement = {
            ...baseElement,
            src: "",
          };
          break;
        case "video":
          newElement = {
            ...baseElement,
            src: "",
          };
          break;
        case "audio":
          newElement = {
            ...baseElement,
            src: "",
            height: 50, // Make audio elements shorter by default
          };
          break;
        case "shape":
          newElement = {
            ...baseElement,
            backgroundColor: "#4299e1", // Default blue color for shapes
          };
          break;
        default:
          newElement = baseElement;
      }
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: [...section.elements, newElement],
              };
            }
            return section;
          }),
        },
        ui: {
          ...state.ui,
          selectedElementId: newElement.id,
          activeTool: null, // Reset to selection tool after adding
        },
      };
    }
    
    case ActionType.UPDATE_ELEMENT: {
      const { sectionId, elementId, updates } = action.payload;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: section.elements.map((element) => {
                  if (element.id === elementId) {
                    return { ...element, ...updates };
                  }
                  return element;
                }),
              };
            }
            return section;
          }),
        },
      };
    }
    
    case ActionType.DELETE_ELEMENT: {
      const { sectionId, elementId } = action.payload;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: section.elements.filter(
                  (element) => element.id !== elementId
                ),
              };
            }
            return section;
          }),
        },
        ui: {
          ...state.ui,
          selectedElementId:
            state.ui.selectedElementId === elementId ? null : state.ui.selectedElementId,
        },
      };
    }
    
    case ActionType.MOVE_ELEMENT: {
      const { sectionId, elementId, x, y } = action.payload;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: section.elements.map((element) => {
                  if (element.id === elementId) {
                    return { ...element, x, y };
                  }
                  return element;
                }),
              };
            }
            return section;
          }),
        },
      };
    }
    
    case ActionType.RESIZE_ELEMENT: {
      const { sectionId, elementId, width, height } = action.payload;
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: section.elements.map((element) => {
                  if (element.id === elementId) {
                    return { ...element, width, height };
                  }
                  return element;
                }),
              };
            }
            return section;
          }),
        },
      };
    }
    
    case ActionType.DUPLICATE_ELEMENT: {
      const { sectionId, elementId } = action.payload;
      
      // Find the element to duplicate
      let elementToDuplicate: Element | undefined;
      
      state.template.sections.forEach((section) => {
        if (section.id === sectionId) {
          const found = section.elements.find((el) => el.id === elementId);
          if (found) {
            elementToDuplicate = found;
          }
        }
      });
      
      if (!elementToDuplicate) {
        return state;
      }
      
      // Create a new element with the same properties but new ID
      // and slightly offset position
      const newElement: Element = {
        ...elementToDuplicate,
        id: generateId(),
        x: elementToDuplicate.x + 20,
        y: elementToDuplicate.y + 20,
      };
      
      return {
        ...state,
        template: {
          ...state.template,
          sections: state.template.sections.map((section) => {
            if (section.id === sectionId) {
              return {
                ...section,
                elements: [...section.elements, newElement],
              };
            }
            return section;
          }),
        },
        ui: {
          ...state.ui,
          selectedElementId: newElement.id,
        },
      };
    }
    
    case ActionType.SELECT_SECTION:
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedSectionId: action.payload,
          selectedElementId: null,
        },
      };
      
    case ActionType.SELECT_ELEMENT:
      return {
        ...state,
        ui: {
          ...state.ui,
          selectedElementId: action.payload,
        },
      };
      
    case ActionType.SET_ACTIVE_TOOL:
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTool: action.payload,
        },
      };
      
    case ActionType.SET_ZOOM:
      return {
        ...state,
        ui: {
          ...state.ui,
          zoom: action.payload,
        },
      };
      
    case ActionType.TOGGLE_GRID:
      return {
        ...state,
        ui: {
          ...state.ui,
          showGrid: action.payload !== undefined ? action.payload : !state.ui.showGrid,
        },
      };
      
    case ActionType.TOGGLE_SNAP_TO_GRID:
      return {
        ...state,
        ui: {
          ...state.ui,
          snapToGrid:
            action.payload !== undefined ? action.payload : !state.ui.snapToGrid,
        },
      };
      
    case ActionType.TOGGLE_PANEL: {
      const { panel, isOpen } = action.payload;
      
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel]: isOpen !== undefined ? isOpen : !state.ui.panels[panel],
          },
        },
      };
    }
    
    case ActionType.UNDO: {
      const { past, future } = state.ui.history;
      
      if (past.length === 0) {
        return state;
      }
      
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      return {
        ...previous,
        ui: {
          ...previous.ui,
          history: {
            past: newPast,
            future: [state, ...future],
          },
        },
      };
    }
    
    case ActionType.REDO: {
      const { past, future } = state.ui.history;
      
      if (future.length === 0) {
        return state;
      }
      
      const next = future[0];
      const newFuture = future.slice(1);
      
      return {
        ...next,
        ui: {
          ...next.ui,
          history: {
            past: [...past, state],
            future: newFuture,
          },
        },
      };
    }
    
    case ActionType.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
      
    case ActionType.SET_ACTIVE_DEVICE:
      return {
        ...state,
        activeDevice: action.payload,
      };
      
    case ActionType.SET_SYNC_STATUS:
      return {
        ...state,
        cloudSyncStatus: action.payload,
      };
      
    default:
      return state;
  }
}

// Provider component
interface TemplateEditorProviderProps {
  initialData?: Partial<EditorState>;
  children: ReactNode;
}

export const TemplateEditorProvider: React.FC<TemplateEditorProviderProps> = ({
  initialData,
  children,
}) => {
  // Merge initialData with default initial state
  const mergedInitialState = initialData
    ? {
        ...initialState,
        ...initialData,
        template: {
          ...initialState.template,
          ...(initialData.template || {}),
        },
        ui: {
          ...initialState.ui,
          ...(initialData.ui || {}),
        },
        settings: {
          ...initialState.settings,
          ...(initialData.settings || {}),
        },
      }
    : initialState;
  
  const [state, dispatch] = useReducer(templateEditorReducer, mergedInitialState);
  
  // Helper functions
  const selectSection = useCallback((sectionId: string | null) => {
    dispatch({ type: ActionType.SELECT_SECTION, payload: sectionId });
  }, []);
  
  const selectElement = useCallback((elementId: string | null) => {
    dispatch({ type: ActionType.SELECT_ELEMENT, payload: elementId });
  }, []);
  
  const addSection = useCallback((name: string) => {
    dispatch({ type: ActionType.ADD_SECTION, payload: { name } });
  }, []);
  
  const addElement = useCallback((sectionId: string, type: ElementType) => {
    dispatch({ type: ActionType.ADD_ELEMENT, payload: { sectionId, type } });
  }, []);
  
  const updateElement = useCallback(
    (sectionId: string, elementId: string, updates: Partial<Element>) => {
      dispatch({
        type: ActionType.UPDATE_ELEMENT,
        payload: { sectionId, elementId, updates },
      });
    },
    []
  );
  
  const moveElement = useCallback(
    (sectionId: string, elementId: string, x: number, y: number) => {
      dispatch({
        type: ActionType.MOVE_ELEMENT,
        payload: { sectionId, elementId, x, y },
      });
    },
    []
  );
  
  const resizeElement = useCallback(
    (sectionId: string, elementId: string, width: number, height: number) => {
      dispatch({
        type: ActionType.RESIZE_ELEMENT,
        payload: { sectionId, elementId, width, height },
      });
    },
    []
  );
  
  const deleteElement = useCallback((sectionId: string, elementId: string) => {
    dispatch({
      type: ActionType.DELETE_ELEMENT,
      payload: { sectionId, elementId },
    });
  }, []);
  
  const duplicateElement = useCallback((sectionId: string, elementId: string) => {
    dispatch({
      type: ActionType.DUPLICATE_ELEMENT,
      payload: { sectionId, elementId },
    });
  }, []);
  
  const updateSection = useCallback(
    (sectionId: string, updates: Partial<TemplateSection>) => {
      dispatch({
        type: ActionType.UPDATE_SECTION,
        payload: { sectionId, updates },
      });
    },
    []
  );
  
  const deleteSection = useCallback((sectionId: string) => {
    dispatch({
      type: ActionType.DELETE_SECTION,
      payload: { sectionId },
    });
  }, []);
  
  const setActiveTool = useCallback((tool: EditorUIState["activeTool"]) => {
    dispatch({ type: ActionType.SET_ACTIVE_TOOL, payload: tool });
  }, []);
  
  const toggleGrid = useCallback(() => {
    dispatch({ type: ActionType.TOGGLE_GRID });
  }, []);
  
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: ActionType.SET_ZOOM, payload: zoom });
  }, []);
  
  const undo = useCallback(() => {
    dispatch({ type: ActionType.UNDO });
  }, []);
  
  const redo = useCallback(() => {
    dispatch({ type: ActionType.REDO });
  }, []);
  
  // Create context value with memoization
  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      selectSection,
      selectElement,
      addSection,
      addElement,
      updateElement,
      moveElement,
      resizeElement,
      deleteElement,
      duplicateElement,
      updateSection,
      deleteSection,
      setActiveTool,
      toggleGrid,
      setZoom,
      undo,
      redo,
    }),
    [
      state,
      dispatch,
      selectSection,
      selectElement,
      addSection,
      addElement,
      updateElement,
      moveElement,
      resizeElement,
      deleteElement,
      duplicateElement,
      updateSection,
      deleteSection,
      setActiveTool,
      toggleGrid,
      setZoom,
      undo,
      redo,
    ]
  );
  
  return (
    <TemplateEditorContext.Provider value={contextValue}>
      {children}
    </TemplateEditorContext.Provider>
  );
};

// Custom hook to use the template editor context
export const useTemplateEditor = () => {
  const context = useContext(TemplateEditorContext);
  
  if (context === undefined) {
    throw new Error("useTemplateEditor must be used within a TemplateEditorProvider");
  }
  
  return context;
};

export default TemplateEditorContext; 