/**
 * Type definitions for Template Editor V2
 */

// Core element types
export type ElementType = 'text' | 'image' | 'video' | 'audio' | 'shape' | 'sticker' | 'gif' | 'embed' | 'effect' | 'animated';

// Audio-related types for Unicorn UX features
export interface AudioProperties {
  src?: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  startTime?: number;
  endTime?: number;
  beatSync?: boolean;
  beatPoints?: number[];
  visualResponsiveness?: 'none' | 'low' | 'medium' | 'high';
  frequencyResponse?: {
    bass?: boolean;
    mid?: boolean;
    treble?: boolean;
  };
}

// Animation-related types for enhanced UX
export interface AnimationProperties {
  type?: 'fade' | 'slide' | 'scale' | 'rotate' | 'zoom' | 'bounce' | 'wave' | 'flip' | 'custom';
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'onBeat';
  keyframes?: Record<string, any>[];
}

// Base element interface
export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
  zIndex?: number;
  
  // Type-specific properties
  content?: string; // For text elements
  fontSize?: number; // For text elements
  fontFamily?: string; // For text elements
  color?: string; // For text elements
  textAlign?: 'left' | 'center' | 'right' | 'justify'; // For text elements
  fontWeight?: "normal" | "bold" | "bolder" | "lighter" | number; // For text elements
  fontStyle?: "normal" | "italic" | "oblique"; // For text elements
  src?: string; // For image, video, audio elements
  backgroundColor?: string; // For shape elements
  borderRadius?: number; // For shape elements
  effectType?: string; // For effect elements
  effectSettings?: Record<string, any>; // For effect elements
  
  // Advanced properties for Unicorn UX
  animations?: AnimationProperties[];
  audio?: AudioProperties;
  
  // AI-related properties
  aiGenerated?: boolean;
  aiProperties?: Record<string, any>;
  
  // Responsiveness properties
  responsiveSettings?: {
    mobile?: Partial<Pick<Element, 'width' | 'height' | 'x' | 'y' | 'fontSize'>>;
    tablet?: Partial<Pick<Element, 'width' | 'height' | 'x' | 'y' | 'fontSize'>>;
  };
  
  // Video-specific properties
  startTime?: number;
  endTime?: number;
}

// Section interface
export interface TemplateSection {
  id: string;
  name?: string;
  order?: number;
  elements: Element[];
  duration?: number;
  transition?: 'fade' | 'slide' | 'none';
  transitionDuration?: number;
  backgroundColor?: string;
  backgroundImage?: string;
  audio?: AudioProperties;
}

// Template interface
export interface Template {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '4:3';
  sections: TemplateSection[];
  tags?: string[];
  category?: string;
  isPublic?: boolean;
  thumbnail?: string;
  
  // Metadata for platform integration
  tiktokSpecific?: {
    soundId?: string;
    trendCategory?: string;
    performance?: {
      views?: number;
      likes?: number;
      shares?: number;
      comments?: number;
    };
  };
  
  // AI integration
  aiAnalysis?: {
    suggestedImprovements?: string[];
    engagementScore?: number;
    audienceMatch?: string[];
    performancePrediction?: number;
  };
}

// UI state interface
export interface EditorUIState {
  selectedSectionId: string | null;
  selectedElementId: string | null;
  activeTool: 'select' | 'text' | 'image' | 'shape' | 'move' | 'zoom' | null;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  panels: {
    [key: string]: boolean;
    elementsOpen: boolean;
    propertiesOpen: boolean;
    previewMode: boolean;
  };
  history: {
    past: EditorState[];
    future: EditorState[];
  };
  contextMenuPosition: { x: number; y: number } | null;
}

// Editor settings
export interface EditorSettings {
  autosaveEnabled: boolean;
  autosaveInterval: number;
  defaultAspectRatio: string;
  defaultFontFamily: string;
  defaultTextColor: string;
  defaultBackgroundColor: string;
  showDimensionsOnResize: boolean;
  showPositionOnMove: boolean;
  useSmartGuides: boolean;
}

// Full editor state
export interface EditorState {
  template: Template;
  ui: EditorUIState;
  settings: EditorSettings;
  activeDevice: 'desktop' | 'mobile' | 'tablet';
  cloudSyncStatus: 'synced' | 'syncing' | 'error' | 'not-synced';
  lastSavedAt: string | null;
}

// Action types for template editor reducer
export enum ActionType {
  // Template actions
  UPDATE_TEMPLATE = 'UPDATE_TEMPLATE',
  SET_TEMPLATE = 'SET_TEMPLATE',
  
  // Section actions
  ADD_SECTION = 'ADD_SECTION',
  UPDATE_SECTION = 'UPDATE_SECTION',
  DELETE_SECTION = 'DELETE_SECTION',
  REORDER_SECTIONS = 'REORDER_SECTIONS',
  
  // Element actions
  ADD_ELEMENT = 'ADD_ELEMENT',
  UPDATE_ELEMENT = 'UPDATE_ELEMENT',
  DELETE_ELEMENT = 'DELETE_ELEMENT',
  MOVE_ELEMENT = 'MOVE_ELEMENT',
  RESIZE_ELEMENT = 'RESIZE_ELEMENT',
  DUPLICATE_ELEMENT = 'DUPLICATE_ELEMENT',
  
  // UI actions
  SELECT_SECTION = 'SELECT_SECTION',
  SELECT_ELEMENT = 'SELECT_ELEMENT',
  SET_ACTIVE_TOOL = 'SET_ACTIVE_TOOL',
  SET_ZOOM = 'SET_ZOOM',
  TOGGLE_GRID = 'TOGGLE_GRID',
  TOGGLE_SNAP_TO_GRID = 'TOGGLE_SNAP_TO_GRID',
  TOGGLE_PANEL = 'TOGGLE_PANEL',
  
  // History actions
  UNDO = 'UNDO',
  REDO = 'REDO',
  
  // Settings actions
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  
  // Device actions
  SET_ACTIVE_DEVICE = 'SET_ACTIVE_DEVICE',
  
  // Sync actions
  SET_SYNC_STATUS = 'SET_SYNC_STATUS',
}

// Payload types for template editor actions
export type Action =
  | { type: ActionType.SET_TEMPLATE; payload: Template }
  | { type: ActionType.UPDATE_TEMPLATE; payload: Partial<Template> }
  | { type: ActionType.ADD_SECTION; payload: { name: string; order?: number } }
  | { type: ActionType.UPDATE_SECTION; payload: { sectionId: string; updates: Partial<TemplateSection> } }
  | { type: ActionType.DELETE_SECTION; payload: { sectionId: string } }
  | { type: ActionType.REORDER_SECTIONS; payload: { sectionIds: string[] } }
  | { type: ActionType.ADD_ELEMENT; payload: { sectionId: string; type: ElementType } }
  | { type: ActionType.UPDATE_ELEMENT; payload: { sectionId: string; elementId: string; updates: Partial<Element> } }
  | { type: ActionType.DELETE_ELEMENT; payload: { sectionId: string; elementId: string } }
  | { type: ActionType.MOVE_ELEMENT; payload: { sectionId: string; elementId: string; x: number; y: number } }
  | { type: ActionType.RESIZE_ELEMENT; payload: { sectionId: string; elementId: string; width: number; height: number } }
  | { type: ActionType.DUPLICATE_ELEMENT; payload: { sectionId: string; elementId: string } }
  | { type: ActionType.SELECT_SECTION; payload: string | null }
  | { type: ActionType.SELECT_ELEMENT; payload: string | null }
  | { type: ActionType.SET_ACTIVE_TOOL; payload: EditorUIState['activeTool'] }
  | { type: ActionType.SET_ZOOM; payload: number }
  | { type: ActionType.TOGGLE_GRID; payload?: boolean }
  | { type: ActionType.TOGGLE_SNAP_TO_GRID; payload?: boolean }
  | { type: ActionType.TOGGLE_PANEL; payload: { panel: keyof EditorUIState['panels']; isOpen?: boolean } }
  | { type: ActionType.UNDO }
  | { type: ActionType.REDO }
  | { type: ActionType.UPDATE_SETTINGS; payload: Partial<EditorSettings> }
  | { type: ActionType.SET_ACTIVE_DEVICE; payload: EditorState['activeDevice'] }
  | { type: ActionType.SET_SYNC_STATUS; payload: EditorState['cloudSyncStatus'] }; 