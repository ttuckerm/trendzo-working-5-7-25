import { Timestamp } from 'firebase/firestore';

// Basic sound metadata
export interface Sound {
  id: string;
  name: string;
  url: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  description?: string;
}

// Sound template related interfaces
export interface SoundTemplate {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  sounds: SoundTemplateItem[];
  isPublic?: boolean;
  description?: string;
}

export interface SoundTemplateItem {
  soundId: string;
  order: number;
  volume?: number;
  pan?: number;
  loop?: boolean;
  soundName?: string; // For display purposes
}

// Usage and performance tracking
export interface SoundPerformance {
  id?: string;
  soundId: string;
  userId: string;
  plays: number;
  downloads: number;
  shares: number;
  favorites: number;
  templateUses: number;
  lastUsed?: number;
  usageHistory?: UsageEvent[];
  // Additional properties used in the codebase
  playCount?: number;
  downloadCount?: number;
  templateUsageCount?: number;
  shareCount?: number;
  firstUsed?: number;
  usageByTemplate?: Record<string, { count: number; lastUsed?: number }>;
}

export interface ExtendedSoundPerformance extends SoundPerformance {
  soundName?: string;
  templateName?: string;
}

export interface UsageEvent {
  timestamp: number;
  eventType: 'play' | 'download' | 'share' | 'favorite' | 'template_use';
  templateId?: string;
}

// UI related types for the sound library
export interface SoundFilterOptions {
  category?: string;
  tags?: string[];
  searchTerm?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'plays' | 'downloads';
  sortDirection?: 'asc' | 'desc';
}

// User's Saved Sound interface
export interface SavedSound {
  id: string;
  soundId: string;
  userId: string;
  sound: Sound;
  isFavorite: boolean;
  customCategories: string[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sound Usage History
export interface SoundUsageHistory {
  id: string;
  soundId: string;
  userId: string;
  templateId?: string;
  templateName?: string;
  timestamp: Timestamp;
  usageDuration?: number;
  actionType: 'played' | 'downloaded' | 'used_in_template' | 'shared';
}

// Custom Sound Category 
export interface SoundCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  soundCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Request and Response Types
export interface SaveSoundRequest {
  soundId: string;
  isFavorite?: boolean;
  customCategories?: string[];
  notes?: string;
}

export interface UpdateSavedSoundRequest {
  savedSoundId: string;
  isFavorite?: boolean;
  customCategories?: string[];
  notes?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  categoryId: string;
  name?: string;
  description?: string;
  color?: string;
}

export interface TrackSoundUsageRequest {
  soundId: string;
  templateId?: string;
  templateName?: string;
  usageDuration?: number;
  actionType: 'played' | 'downloaded' | 'used_in_template' | 'shared';
}

// API Response Types
export interface SoundLibraryResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    lastVisible: string | null;
    hasMore: boolean;
  };
} 