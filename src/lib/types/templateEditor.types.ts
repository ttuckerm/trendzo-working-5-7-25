/**
 * Template Editor Type Definitions
 * 
 * These types form the foundation of the Template Editor component,
 * built from scratch following the Unicorn UX principles.
 */

// Section types in a TikTok template
export type SectionType = 'intro' | 'hook' | 'body' | 'callToAction';

// Position type for elements within a section
export type Position = {
  x: number; // Percentage value (0-100)
  y: number; // Percentage value (0-100)
  z: number; // For layering elements
};

// Size definition for elements
export type Size = {
  width: number; // Percentage value (0-100)
  height: number; // Percentage value (0-100)
};

// Animation types for elements
export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';

// Animation definition for elements
export interface Animation {
  type: AnimationType;
  delay: number;     // In seconds
  duration: number;  // In seconds
  easing: string;    // CSS easing function
  direction?: 'in' | 'out' | 'inOut';
  customParams?: Record<string, any>; // For custom animations
}

// Shadow style for text elements
export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

// Element style properties
export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'light';
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  borderRadius?: number;
  shadow?: Shadow;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
}

// Media source definition
export interface MediaSource {
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // For video, in seconds
  originalWidth?: number;
  originalHeight?: number;
  fileSize?: number;
}

// Base interface for template elements
export interface BaseElement {
  id: string;
  position: Position;
  size: Size;
  animation?: Animation;
  visibleFrom?: number; // Time in seconds when element appears
  visibleTo?: number; // Time in seconds when element disappears
}

// Text element in a template
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  style: ElementStyle;
  characterLimit?: number; // Optional character limit based on section type
}

// Media element in a template
export interface MediaElement extends BaseElement {
  type: 'media';
  mediaSource: MediaSource;
  fit: 'cover' | 'contain' | 'fill' | 'none';
  style?: ElementStyle; // Optional style overrides
}

// Sticker element in a template
export interface StickerElement extends BaseElement {
  type: 'sticker';
  stickerUrl: string;
  rotation?: number; // Degrees
  style?: ElementStyle; // Optional style overrides
}

// Effect element in a template
export interface EffectElement extends BaseElement {
  type: 'effect';
  effectType: 'filter' | 'transition' | 'overlay';
  effectName: string;
  parameters: Record<string, any>; // Effect-specific parameters
}

// Union type for all element types
export type TemplateElement = TextElement | MediaElement | StickerElement | EffectElement;

// Template section definition
export interface TemplateSection {
  id: string;
  name: string;
  type: SectionType;
  startTime: number; // In seconds
  duration: number; // In seconds
  elements: TemplateElement[];
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

// Sound definition for templates
export interface TemplateSound {
  id?: string;
  name: string;
  artist?: string;
  url: string;
  duration: number; // In seconds
  waveformData?: number[]; // For visualization
  peakMoments?: number[]; // Timestamps of peak moments for syncing, in seconds
}

// Brand settings for premium users
export interface BrandSettings {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  logoUrl?: string;
  voiceGuidelines?: string;
}

// Performance metrics for business tier
export interface PerformanceMetrics {
  engagementScore: number; // 0-100
  sectionScores: Record<string, number>; // Section ID to score mapping
  attentionHotspots: { time: number; score: number }[]; // Timestamps of high attention moments
  recommendations: string[];
}

// Complete template definition
export interface Template {
  id: string;
  name: string;
  description: string;
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5';
  sections: TemplateSection[];
  sound?: TemplateSound;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  totalDuration: number;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublished: boolean;
  analytics?: {
    views: number;
    usage: number;
    completionRate: number;
  };
  performanceMetrics?: PerformanceMetrics; // Business tier
  brandSettings?: BrandSettings; // Premium tier
}

// Editor UI state for controlling the editor interface
export interface EditorUIState {
  // Selection state
  selectedSectionId: string | null;
  selectedElementId: string | null;
  
  // Playback state
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  
  // View state
  zoom: number;
  mode: 'edit' | 'preview';
  device: 'mobile' | 'desktop';
  
  // Panel states
  showProperties: boolean;
  showTimeline: boolean;
  showElementLibrary: boolean;
  showBrandKit: boolean;
  isSaving: boolean;
  isExporting: boolean;
  
  // Active panel/tab
  activePanel: 'elements' | 'timeline' | 'styles' | 'export' | 'sound' | 'ai' | 'brand';
  activeTab: string;
  
  // User interaction tracking for contextual intelligence
  lastInteraction: {
    type: string;
    target: string;
    timestamp: number;
  } | null;
  
  // Contextual intelligence data
  frequentlyUsedTools: string[];
  userExpertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  featureDiscovery: Record<string, boolean>;
}

// History entry for undo/redo
export interface HistoryEntry {
  templateState: Template;
  uiState: Partial<EditorUIState>;
  timestamp: number;
  actionType: string;
}

// Complete editor state combining all state aspects
export interface EditorState {
  template: Template;
  ui: EditorUIState;
  history: {
    past: HistoryEntry[];
    current: HistoryEntry | null;
    future: HistoryEntry[];
  };
  // For premium and business tiers
  aiSuggestions?: {
    textSuggestions: Record<string, string[]>;
    layoutSuggestions: any[];
    performanceTips: string[];
  };
  // Collaborative editing (business tier)
  collaboration?: {
    activeUsers: { id: string; name: string; cursor: Position }[];
    comments: { id: string; user: string; text: string; position: Position; resolved: boolean }[];
  };
}

// Template editor action types
export type EditorAction = 
  // Template actions
  | { type: 'LOAD_TEMPLATE'; payload: Template }
  | { type: 'UPDATE_TEMPLATE'; payload: Partial<Template> }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'SET_TEMPLATE_DESCRIPTION'; payload: string }
  
  // Section actions
  | { type: 'ADD_SECTION'; payload: Omit<TemplateSection, 'id'> }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<TemplateSection> } }
  | { type: 'DELETE_SECTION'; payload: string }
  | { type: 'REORDER_SECTIONS'; payload: { sectionId: string; newIndex: number } }
  
  // Element actions
  | { type: 'ADD_ELEMENT'; payload: { sectionId: string; element: Omit<TemplateElement, 'id'> } }
  | { type: 'UPDATE_ELEMENT'; payload: { sectionId: string; elementId: string; updates: Partial<TemplateElement> } }
  | { type: 'DELETE_ELEMENT'; payload: { sectionId: string; elementId: string } }
  | { type: 'MOVE_ELEMENT'; payload: { sectionId: string; elementId: string; position: Position } }
  | { type: 'RESIZE_ELEMENT'; payload: { sectionId: string; elementId: string; size: Size } }
  
  // UI actions
  | { type: 'SELECT_SECTION'; payload: string | null }
  | { type: 'SELECT_ELEMENT'; payload: { sectionId: string; elementId: string } | null }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'TOGGLE_PLAYBACK' }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_EDITOR_MODE'; payload: 'edit' | 'preview' }
  | { type: 'SET_DEVICE_VIEW'; payload: 'mobile' | 'desktop' }
  | { type: 'SET_ACTIVE_PANEL'; payload: EditorUIState['activePanel'] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'TOGGLE_PANEL'; payload: keyof Pick<EditorUIState, 'showProperties' | 'showTimeline' | 'showElementLibrary' | 'showBrandKit'> }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'TRACK_INTERACTION'; payload: { type: string; target: string } }
  
  // History actions
  | { type: 'UNDO' }
  | { type: 'REDO' }
  
  // Premium/Business tier actions
  | { type: 'SET_BRAND_SETTINGS'; payload: BrandSettings }
  | { type: 'REQUEST_AI_SUGGESTIONS'; payload: { sectionId: string; elementId?: string; type: 'text' | 'layout' | 'performance' } }
  | { type: 'APPLY_AI_SUGGESTION'; payload: { suggestionType: string; suggestionId: string } }; 