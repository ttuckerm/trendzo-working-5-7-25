/**
 * Template Editor Types
 * 
 * This file contains all interfaces used by the Template Editor feature.
 * It follows the specifications in the PRD section 6.3 with additions
 * to support the Unicorn UX principles implementation.
 */

export interface TemplateSection {
  id: string;
  type: 'intro' | 'hook' | 'body' | 'callToAction';
  startTime: number;
  duration: number;
  elements: TemplateElement[];
  transitionType?: 'fade' | 'slide' | 'scale' | 'rotate' | 'none';
  transitionDuration?: number;
  engagementScore?: number;
  optimalDuration?: {
    min: number;
    max: number;
    recommended: number;
  };
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'media' | 'sticker' | 'effect';
  content: string | MediaSource;
  position: Position;
  size: Size;
  style: ElementStyle;
  animation?: Animation;
  visibleFrom?: number;
  visibleTo?: number;
  
  // For contextual intelligence
  engagementImpact?: number;
  aiGenerated?: boolean;
  
  // For business tier
  comments?: Comment[];
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
  borderRadius?: number;
  shadow?: Shadow;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface Shadow {
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
}

export interface Position {
  x: number;
  y: number;
  z: number; // For layering
  
  // For responsive positioning
  xUnit: 'px' | '%';
  yUnit: 'px' | '%';
}

export interface Size {
  width: number;
  height: number;
  
  // For responsive sizing
  widthUnit: 'px' | '%';
  heightUnit: 'px' | '%';
}

export interface Animation {
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'custom';
  delay: number;
  duration: number;
  easing: string;
  keyframes?: AnimationKeyframe[];
}

export interface AnimationKeyframe {
  time: number; // 0-1 representing animation progress
  properties: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    [key: string]: any;
  };
}

export interface MediaSource {
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // For video
  originalWidth?: number;
  originalHeight?: number;
  blurDataUrl?: string; // For progressive loading
  altText?: string; // For accessibility
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  text: string;
  timestamp: string;
  resolved?: boolean;
  replies?: Comment[];
}

// Brand Kit - Premium Tier
export interface BrandKit {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    [key: string]: string;
  };
  fonts: {
    heading: string;
    body: string;
    accent: string;
    [key: string]: string;
  };
  logos: {
    primary: MediaSource;
    secondary?: MediaSource;
    icon?: MediaSource;
    [key: string]: MediaSource | undefined;
  };
  voiceGuidelines?: string;
  lastUsed?: string;
}

// Template Editor State
export interface EditorState {
  template: {
    id: string;
    name: string;
    description?: string;
    sections: TemplateSection[];
    soundId?: string;
    soundUrl?: string;
    duration: number;
    thumbnailUrl?: string;
  };
  ui: {
    selectedSectionId: string | null;
    selectedElementId: string | null;
    editorMode: 'edit' | 'preview';
    zoom: number;
    isFullscreen: boolean;
    showGrid: boolean;
    showTimeline: boolean;
    activeTab: 'elements' | 'timeline' | 'style' | 'transitions' | 'ai';
    viewPort: 'mobile' | 'desktop' | 'tablet';
    showPropertyEditor: boolean;
    showKeyboardShortcuts: boolean;
    showAdvancedOptions: boolean;
  };
  history: {
    past: EditorHistoryItem[];
    future: EditorHistoryItem[];
    lastSaved?: EditorHistoryItem;
  };
  userPreferences: {
    recentColors: string[];
    recentFonts: string[];
    favoriteAnimations: Animation[];
    expertMode: boolean;
    autoSave: boolean;
    showTooltips: boolean;
  };
}

export interface EditorHistoryItem {
  timestamp: number;
  state: Partial<EditorState>;
  action: string;
  metadata?: any;
}

// Performance Prediction - Premium/Business Tier
export interface PerformancePrediction {
  overallScore: number;
  sectionScores: {
    [sectionId: string]: number;
  };
  elementScores: {
    [elementId: string]: number;
  };
  suggestions: PredictionSuggestion[];
  benchmarks: {
    industry: number;
    category: number;
    trending: number;
  };
}

export interface PredictionSuggestion {
  id: string;
  type: 'section' | 'element' | 'timing' | 'transition' | 'sound';
  targetId: string;
  text: string;
  impactScore: number;
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

// AI Integration - Business Tier
export interface AIScriptSuggestion {
  id: string;
  sectionId: string;
  originalText: string;
  suggestedText: string;
  rationale: string;
  expectedImpact: number;
  timestamp: string;
}

export interface TemplateRemixSuggestion {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  changes: {
    type: 'section' | 'element' | 'timing' | 'transition' | 'sound';
    targetId: string;
    before: any;
    after: any;
  }[];
  predictedEngagement: number;
}

// Sound Integration
export interface SoundRecommendation {
  id: string;
  title: string;
  author?: string;
  duration: number;
  url: string;
  waveformDataUrl: string;
  thumbnailUrl?: string;
  engagementScore: number;
  matchReason: string;
}

// Export Options
export interface ExportOptions {
  format: 'mp4' | 'gif' | 'images';
  resolution: '720p' | '1080p' | '4k';
  quality: 'low' | 'medium' | 'high';
  includeWatermark: boolean;
  optimizeForPlatform?: 'tiktok' | 'instagram' | 'youtube' | 'facebook';
  scheduledPublishDate?: string;
} 