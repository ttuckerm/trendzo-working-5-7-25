/**
 * New Template Editor Types
 * 
 * This file contains all type definitions for the completely rebuilt template editor.
 * These types are designed to be clear, type-safe, and free from the issues in the previous implementation.
 */

// Basic position type for text elements
export type Position = 'top' | 'center' | 'bottom' | 'custom';

// Text styling options
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  shadowEnabled: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
}

// Default text style
export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  fontSize: 24,
  fontWeight: 'normal',
  color: '#FFFFFF',
  textAlign: 'center',
  opacity: 1,
  shadowEnabled: true,
  shadowColor: 'rgba(0,0,0,0.5)',
  shadowBlur: 4,
  shadowOffset: { x: 2, y: 2 }
};

// Text element that can be added to a template section
export interface TextElement {
  id: string;
  type: 'text';
  content: string;
  position: Position;
  style: TextStyle;
  // For custom positioning
  coordinates?: { x: number; y: number };
  // Animation properties
  animation?: Animation;
}

// Media element types (image or video)
export interface MediaElement {
  id: string;
  type: 'image' | 'video';
  url: string;
  position: Position;
  size: 'cover' | 'contain' | 'custom';
  opacity: number;
  // For custom sizing and positioning
  dimensions?: { width: number; height: number };
  coordinates?: { x: number; y: number };
  // Animation properties
  animation?: Animation;
}

// Animation type for elements
export interface Animation {
  type: 'fade' | 'slide' | 'zoom' | 'bounce' | 'none';
  duration: number;
  delay: number;
  direction?: 'in' | 'out' | 'inOut';
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Template section with timeline position
export interface TemplateSection {
  id: string;
  name: string;
  duration: number;
  startTime: number; // Time position in the overall template timeline
  elements: Array<TextElement | MediaElement>;
  background: {
    type: 'color' | 'image' | 'video';
    value: string; // Color hex or URL
    opacity: number;
  };
  transition: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number;
    direction?: 'left' | 'right' | 'up' | 'down';
  };
}

// Complete template definition
export interface Template {
  id: string;
  name: string;
  description: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  sections: TemplateSection[];
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  sound?: {
    id?: string;
    url?: string;
    name?: string;
    artist?: string;
    duration?: number;
  };
  totalDuration: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

// Editor UI state
export interface EditorUIState {
  selectedSectionId: string | null;
  selectedElementId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  mode: 'edit' | 'preview';
  device: 'mobile' | 'desktop';
  showProperties: boolean;
  isSaving: boolean;
  isExporting: boolean;
  activePanel: 'elements' | 'timeline' | 'styles' | 'export' | 'sounds';
}

// History state for undo/redo functionality
export interface HistoryState {
  past: Template[];
  future: Template[];
  lastAction: string;
}

// Combined editor state
export interface EditorState {
  template: Template;
  ui: EditorUIState;
  history: HistoryState;
}

// Action types for template editor operations
export type EditorActionType = 
  | { type: 'LOAD_TEMPLATE'; payload: Template }
  | { type: 'UPDATE_TEMPLATE'; payload: Partial<Template> }
  | { type: 'ADD_SECTION'; payload: Omit<TemplateSection, 'id' | 'startTime'> }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<TemplateSection> } }
  | { type: 'DELETE_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { startIndex: number; endIndex: number } }
  | { type: 'ADD_ELEMENT'; payload: { sectionId: string; element: Omit<TextElement | MediaElement, 'id'> } }
  | { type: 'UPDATE_ELEMENT'; payload: { sectionId: string; elementId: string; updates: Partial<TextElement | MediaElement> } }
  | { type: 'DELETE_ELEMENT'; payload: { sectionId: string; elementId: string } }
  | { type: 'SELECT_SECTION'; payload: string | null }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'TOGGLE_PLAYBACK' }
  | { type: 'SET_MODE'; payload: 'edit' | 'preview' }
  | { type: 'SET_DEVICE'; payload: 'mobile' | 'desktop' }
  | { type: 'SET_ACTIVE_PANEL'; payload: EditorUIState['activePanel'] }
  | { type: 'TOGGLE_PROPERTIES' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }; 