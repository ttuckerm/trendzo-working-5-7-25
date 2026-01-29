/**
 * Template Editor Types
 * 
 * Core types for the template editor feature.
 * Designed with Unicorn UX principles in mind:
 * - Invisible Interface: Types support contextual elements
 * - Emotional Design: Support for animation and feedback
 * - Contextual Intelligence: Support for adaptive behavior
 * - Progressive Disclosure: Types for layered complexity
 * - Sensory Harmony: Animation and visual coordination
 */

// Base element types
export type ElementType = "text" | "image" | "video" | "audio" | "sticker" | "effect";

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  opacity: number;
  rotation: number;
  zIndex: number;
  // Animation properties
  animationIn?: Animation;
  animationOut?: Animation;
  // Support for contextual behavior
  visibleFrom?: number;  // Timeline appearance (seconds)
  visibleTo?: number;    // Timeline disappearance (seconds)
  // Premium features
  engagementScore?: number; // Analytics prediction
  aiGenerated?: boolean;    // Generated content flag
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  backgroundColor?: string;
  textShadow?: {
    color: string;
    blur: number;
    x: number;
    y: number;
  };
  // Premium features
  autoResize?: boolean;
  textAnimation?: "fade" | "typewriter" | "bounce" | "wave";
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  alt?: string;
  filter?: string; // CSS filters
  borderRadius?: number;
  // Premium features
  smartCrop?: boolean;
  focalPoint?: { x: number; y: number };
}

export interface VideoElement extends BaseElement {
  type: "video";
  src: string;
  muted?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  controls?: boolean;
  startTime?: number; // Trim start
  endTime?: number;   // Trim end
  // Premium features
  overlay?: {
    type: "color" | "gradient";
    value: string;
    opacity: number;
  };
}

export interface AudioElement extends BaseElement {
  type: "audio";
  src: string;
  volume?: number;
  startTime?: number;
  endTime?: number;
  visualizer?: boolean;
  // Premium features
  fadeIn?: number;
  fadeOut?: number;
}

export interface StickerElement extends BaseElement {
  type: "sticker";
  src: string;
  category: string;
  // Premium features
  interactiveType?: "tap" | "shake" | "swipe";
  interactionResponse?: string;
}

export interface EffectElement extends BaseElement {
  type: "effect";
  effectType: "particle" | "filter" | "transition" | "ar";
  config: Record<string, any>;
  // Premium features
  triggerEvent?: "auto" | "tap" | "time";
  triggerDelay?: number;
}

export type Element = 
  | TextElement 
  | ImageElement 
  | VideoElement 
  | AudioElement
  | StickerElement
  | EffectElement;

export interface Animation {
  type: "fade" | "slide" | "zoom" | "rotate" | "bounce" | "flip" | "custom";
  duration: number;
  delay: number;
  easing: string;
  direction?: "in" | "out";
  // Premium features
  keyframes?: AnimationKeyframe[];
}

export interface AnimationKeyframe {
  time: number; // 0-1 representing progress
  properties: Record<string, any>;
}

export interface Section {
  id: string;
  name: string;
  type: "intro" | "hook" | "body" | "callToAction" | "outro" | "custom";
  duration: number; // in seconds
  elements: Element[];
  background?: {
    type: "color" | "image" | "video";
    value: string;
    opacity?: number;
  };
  transition?: {
    type: "cut" | "fade" | "slide" | "zoom" | "custom";
    duration: number;
    direction?: string;
    easing?: string;
  };
  // Premium features
  settings?: Record<string, any>;
  notes?: string;
  engagementPrediction?: number;
  aiSuggestions?: SectionSuggestion[];
}

// Premium features
export interface SectionSuggestion {
  id: string;
  type: "layout" | "duration" | "element" | "style";
  description: string;
  previewImage?: string;
  impactScore: number; // 0-100
  applied: boolean;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  sections: Section[];
  aspectRatio: "9:16" | "16:9" | "1:1" | "4:5";
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  // Premium features
  brandKit?: BrandKit;
  soundtrackId?: string;
  soundtrackUrl?: string;
  categoryTags?: string[];
  settings?: Record<string, any>;
  collaborators?: string[];
  version?: string;
  engagement?: TemplateEngagement;
}

// Premium features
export interface BrandKit {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  logo?: {
    url: string;
    width: number;
    height: number;
  };
}

// Premium features
export interface TemplateEngagement {
  score: number;
  insights: string[];
  historyData?: {
    dates: string[];
    values: number[];
  };
  comparativeScore?: number;
}

export interface EditorUIState {
  selectedSectionId: string | null;
  selectedElementId: string | null;
  currentTime: number; // in seconds
  playing: boolean;
  zoom: number;
  editorMode: 'edit' | 'preview';
  showPropertyEditor: boolean;
  // Progressive disclosure UI states
  showAdvancedOptions: boolean;
  activeTab: "elements" | "timeline" | "properties" | "assets";
  // Contextual intelligence
  suggestionsEnabled: boolean;
  lastAction?: {
    type: string;
    timestamp: number;
  };
}

export interface EditorState {
  template: Template;
  ui: EditorUIState;
  history: {
    past: Template[];
    future: Template[];
  };
  // Premium features
  analytics?: {
    engagementScore: number;
    sectionScores: Record<string, number>;
    suggestions: TemplateSuggestion[];
  };
  aiAssistant?: {
    enabled: boolean;
    lastSuggestion?: string;
    suggestionsHistory: string[];
  };
}

// Premium features
export interface TemplateSuggestion {
  id: string;
  type: "layout" | "content" | "timing" | "style";
  title: string;
  description: string;
  previewImage?: string;
  impactScore: number; // 0-100
  applied: boolean;
} 