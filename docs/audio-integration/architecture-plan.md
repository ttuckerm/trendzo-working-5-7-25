# Audio Integration: Architecture Plan

This document outlines the technical architecture for integrating audio functionality across the application. Building on the user journey mapping, this plan details the component hierarchy, state management approach, progressive disclosure patterns, and technical specifications for the refactored components.

## 1. Component Hierarchy

### Global Components

```
AudioProvider (Context Provider)
├── GlobalAudioPlayer
│   ├── MiniPlayer (Persistent)
│   └── FullPlayer (Expandable)
└── [Application Components]
    ├── Template Editor
    ├── Analytics Dashboard
    ├── Content Calendar
    └── ...
```

#### Core Audio Components

1. **AudioProvider**
   - Top-level context provider
   - Manages global audio state
   - Handles audio playback across the application
   - Controls the visibility of audio UI components

2. **GlobalAudioPlayer**
   - Singleton audio player component
   - Renders as MiniPlayer or FullPlayer based on state
   - Maintains audio playback when navigating between pages
   - Provides universal playback controls

3. **MiniPlayer**
   - Compact, persistent audio player
   - Always visible when audio is loaded
   - Minimal controls (play/pause, title, expand)
   - Fixed position (bottom of screen)

4. **FullPlayer**
   - Expanded audio player with complete controls
   - Waveform visualization
   - Advanced controls (loop, trim, volume)
   - Can be minimized back to MiniPlayer

### Journey-Specific Components

#### Content Creation Components

```
EditorAudioPanel
├── SoundSelector
│   ├── RecommendedSounds
│   ├── SoundCategories
│   └── SoundSearchBar
├── SoundCustomizer
│   ├── BasicControls (Always visible)
│   │   ├── VolumeControl
│   │   └── LoopToggle
│   └── AdvancedControls (Progressive disclosure)
│       ├── TrimControls
│       ├── FadeControls
│       └── SyncPointEditor
└── AudioTimeline
    ├── WaveformVisualizer
    └── SyncMarkers
```

#### Analytics Components

```
AudioAnalyticsPanel
├── SoundPerformanceMetrics
│   ├── EngagementScores
│   └── CompletionRates
├── SoundComparisonTools
│   ├── ABTestResults
│   └── BenchmarkComparison
└── ActionableInsights
    ├── InsightCards
    └── ApplyToTemplateButtons
```

#### Content Planning Components

```
SoundPlanningTools
├── TrendingSoundsBrowser
│   ├── TrendChart
│   └── CategoryFilters
├── SoundCalendarIntegration
│   ├── SoundIndicators
│   └── SoundWarnings
└── SoundLibraryManager
    ├── CategoryOrganizer
    ├── FavoritesCollection
    └── UsageTracker
```

## 2. State Management Strategy

### Global Audio State

We'll implement a centralized audio state management system using React Context and a reducer pattern:

```typescript
interface AudioState {
  // Current playback state
  currentSound: Sound | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  currentTime: number;
  duration: number;
  loop: boolean;
  
  // UI state
  playerMode: 'mini' | 'full' | 'hidden';
  
  // Trimming state (premium)
  trimEnabled: boolean;
  trimStart: number;
  trimEnd: number;
  
  // History
  recentSounds: Sound[];
  
  // Feature flags
  premiumFeaturesEnabled: boolean;
}

type AudioAction = 
  | { type: 'LOAD_SOUND', payload: Sound }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'SEEK', payload: number }
  | { type: 'SET_VOLUME', payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'TOGGLE_LOOP' }
  | { type: 'SET_PLAYER_MODE', payload: 'mini' | 'full' | 'hidden' }
  | { type: 'ENABLE_TRIM', payload: boolean }
  | { type: 'SET_TRIM_POINTS', payload: { start: number, end: number } }
  | { type: 'ADD_TO_RECENT' };
```

### Cross-Journey State Persistence

To maintain state across different journeys:

1. **Session Persistence**
   - Store current sound and playback state in browser sessionStorage
   - Restore state on page navigation or refresh

2. **User Preferences Persistence**
   - Store volume, recently played sounds, and favorites in localStorage
   - Sync with backend for cross-device persistence (for logged-in users)

3. **Template-Sound Associations**
   - Store sound selections with templates in the database
   - Cache associations in memory during editing sessions

### State Access Patterns

We'll provide hooks for convenient state access and manipulation:

```typescript
// Global audio control
const { 
  currentSound,
  isPlaying,
  play,
  pause,
  seekTo,
  setVolume,
  toggleLoop
} = useAudio();

// Sound selection
const {
  selectSound,
  removeSound,
  recommendedSounds,
  recentSounds,
  favoriteSounds
} = useSoundSelection();

// Template-specific audio
const {
  templateSound,
  setTemplateSound,
  soundCompatibility
} = useTemplateSound(templateId);

// Audio analytics
const {
  soundPerformance,
  soundComparisons,
  abTestResults
} = useSoundAnalytics(soundId);
```

## 3. Progressive Disclosure Patterns

We'll implement a systematic approach to progressive disclosure of audio features:

### Level 1: Essential Features (Always Visible)
- Basic playback controls (play/pause)
- Current sound information
- Volume control
- Sound selection

### Level 2: Intermediate Features (One-Click Access)
- Sound recommendations
- Loop controls
- Sound search
- Basic waveform visualization

### Level 3: Advanced Features (Progressive Disclosure)
- Trimming controls (premium)
- Fade in/out (premium)
- Sync points (premium)
- A/B testing tools (premium)

### Implementation Strategy

1. **Nested Component Visibility**
   - Use a combination of UI state and user interaction patterns to progressively reveal features
   - Components will conditionally render based on user expertise level and context

2. **Feature Discovery Flow**
   ```
   Basic Controls → Subtle Indicators → User Interaction → Feature Reveal
   ```

3. **Context-Aware Disclosure**
   - Analyze the current template and user behavior
   - Reveal relevant advanced features based on the context
   - Example: Show trim controls when a longer sound is selected for a short template section

4. **Template-Type Adaptive Disclosure**
   - Different template types (e.g., product showcase vs. quick promo) will reveal different audio features
   - Advanced features relevant to the template type will be prioritized in the disclosure sequence

## 4. Technical Specifications for Components

### AudioProvider

```typescript
// src/lib/contexts/AudioContext.tsx

import React, { createContext, useReducer, useContext, useEffect, useRef, useMemo } from 'react';
import { Sound } from '@/lib/types/sound';

// Audio State Structure - Reflecting the actual implementation
interface AudioState {
  // Playback state
  playback: {
    isPlaying: boolean;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
    loop: boolean;
    playbackRate: number;
  };
  
  // UI state
  ui: {
    playerMode: 'mini' | 'full' | 'hidden';
    showWaveform: boolean;
    showPlaylist: boolean;
    isExpanded: boolean;
  };
  
  // Collections
  recentSounds: Sound[];
  favoriteSounds: Sound[];
  
  // Current sound
  currentSound: Sound | null;
  
  // User preferences
  preferences: {
    defaultVolume: number;
    autoplay: boolean;
    defaultPlayerMode: 'mini' | 'full';
  };
  
  // Premium features
  premiumFeaturesEnabled: boolean;
  trimming: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
}

// Action types based on actual reducer implementation
type AudioActionType = 
  | { type: 'LOAD_SOUND', payload: Sound }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SEEK', payload: number }
  | { type: 'SET_VOLUME', payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_LOOP', payload: boolean }
  | { type: 'SET_PLAYBACK_RATE', payload: number }
  | { type: 'SET_PLAYER_MODE', payload: AudioUIState['playerMode'] }
  | { type: 'TOGGLE_WAVEFORM' }
  | { type: 'TOGGLE_PLAYLIST' }
  | { type: 'EXPAND_PLAYER' }
  | { type: 'COLLAPSE_PLAYER' }
  | { type: 'ADD_TO_RECENT', payload: Sound }
  | { type: 'ADD_TO_FAVORITES', payload: Sound }
  | { type: 'REMOVE_FROM_FAVORITES', payload: string }
  | { type: 'CLEAR_RECENT' }
  | { type: 'UPDATE_PREFERENCES', payload: Partial<AudioPreferences> }
  | { type: 'ENABLE_TRIMMING', payload: boolean }
  | { type: 'SET_TRIM_POINTS', payload: { startTime: number, endTime: number } }
  | { type: 'SET_PREMIUM_FEATURES', payload: boolean };

// Value provided by the context, with all convenience methods
interface AudioContextValue {
  // State
  state: AudioState;
  
  // Dispatch
  dispatch: React.Dispatch<AudioActionType>;
  
  // Convenience methods
  loadSound: (sound: Sound) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setLoop: (loop: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  
  // UI controls
  setPlayerMode: (mode: AudioUIState['playerMode']) => void;
  toggleWaveform: () => void;
  togglePlaylist: () => void;
  expandPlayer: () => void;
  collapsePlayer: () => void;
  
  // Collections
  addToFavorites: (sound: Sound) => void;
  removeFromFavorites: (soundId: string) => void;
  clearRecent: () => void;
  
  // Preferences
  updatePreferences: (prefs: Partial<AudioPreferences>) => void;
  
  // Premium features
  enableTrimming: (enabled: boolean) => void;
  setTrimPoints: (startTime: number, endTime: number) => void;
  setPremiumFeatures: (enabled: boolean) => void;
  
  // Computed properties
  isPlaying: boolean;
  currentSound: Sound | null;
  isFavorite: (soundId: string) => boolean;
  hasRecentSounds: boolean;
  hasFavoriteSounds: boolean;
}

export const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, dispatch] = useReducer(audioReducer, initialAudioState);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    // Set up event listeners
    const handleTimeUpdate = () => {
      dispatch({ 
        type: 'SEEK', 
        payload: audio.currentTime 
      });
    };
    
    const handleLoadedMetadata = () => {
      dispatch({
        type: 'SET_DURATION',
        payload: audio.duration
      });
    };
    
    const handleEnded = () => {
      dispatch({ type: 'PAUSE' });
      if (state.playback.loop) {
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    };
    
    const handleError = (error: ErrorEvent) => {
      console.error('Audio playback error:', error);
      dispatch({ type: 'PAUSE' });
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [state.playback.loop]);

  // Handle loading sounds from localStorage
  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('audioFavorites');
    if (savedFavorites) {
      try {
        const favorites = JSON.parse(savedFavorites);
        if (Array.isArray(favorites)) {
          favorites.forEach(sound => {
            dispatch({ type: 'ADD_TO_FAVORITES', payload: sound });
          });
        }
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
    
    // Load recent sounds from localStorage
    const savedRecent = localStorage.getItem('audioRecent');
    if (savedRecent) {
      try {
        const recent = JSON.parse(savedRecent);
        if (Array.isArray(recent)) {
          recent.forEach(sound => {
            dispatch({ type: 'ADD_TO_RECENT', payload: sound });
          });
        }
      } catch (error) {
        console.error('Error loading recent sounds from localStorage:', error);
      }
    }
    
    // Load preferences from localStorage
    const savedPreferences = localStorage.getItem('audioPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
      }
    }
  }, []);
  
  // Save collections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('audioFavorites', JSON.stringify(state.favoriteSounds));
  }, [state.favoriteSounds]);
  
  useEffect(() => {
    localStorage.setItem('audioRecent', JSON.stringify(state.recentSounds));
  }, [state.recentSounds]);
  
  useEffect(() => {
    localStorage.setItem('audioPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  // Handle current sound changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (state.currentSound) {
      audio.src = state.currentSound.url;
      audio.load();
      
      // Add to recent sounds
      if (state.currentSound.id) {
        dispatch({ type: 'ADD_TO_RECENT', payload: state.currentSound });
      }
      
      // Autoplay if set in preferences
      if (state.preferences.autoplay) {
        audio.play().catch(error => {
          console.error('Error autoplaying audio:', error);
        });
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [state.currentSound]);
  
  // Handle changes to playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Update audio element properties to match state
    if (state.playback.isPlaying) {
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        dispatch({ type: 'PAUSE' });
      });
    } else {
      audio.pause();
    }
    
    // Update other audio properties
    audio.volume = state.playback.volume;
    audio.muted = state.playback.muted;
    audio.loop = state.playback.loop;
    audio.playbackRate = state.playback.playbackRate;
  }, [
    state.playback.isPlaying,
    state.playback.volume,
    state.playback.muted,
    state.playback.loop,
    state.playback.playbackRate
  ]);
  
  // Handle seeking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Only update if the difference is significant to avoid infinite loops
    if (Math.abs(audio.currentTime - state.playback.currentTime) > 0.5) {
      audio.currentTime = state.playback.currentTime;
    }
  }, [state.playback.currentTime]);
  
  // Handle trimming (premium feature)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !state.premiumFeaturesEnabled || !state.trimming.enabled) return;
    
    // Set up event listener for time updates to enforce trim boundaries
    const handleTimeUpdate = () => {
      if (audio.currentTime < state.trimming.startTime) {
        audio.currentTime = state.trimming.startTime;
      } else if (audio.currentTime > state.trimming.endTime && state.trimming.endTime > 0) {
        if (state.playback.loop) {
          audio.currentTime = state.trimming.startTime;
        } else {
          audio.pause();
          dispatch({ type: 'PAUSE' });
        }
      }
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    state.premiumFeaturesEnabled,
    state.trimming.enabled,
    state.trimming.startTime,
    state.trimming.endTime,
    state.playback.loop
  ]);
  
  // Define convenience methods for the context value
  const loadSound = (sound: Sound) => {
    dispatch({ type: 'LOAD_SOUND', payload: sound });
  };
  
  const play = () => {
    dispatch({ type: 'PLAY' });
  };
  
  const pause = () => {
    dispatch({ type: 'PAUSE' });
  };
  
  const togglePlay = () => {
    dispatch({ type: 'TOGGLE_PLAY' });
  };
  
  const seek = (time: number) => {
    dispatch({ type: 'SEEK', payload: time });
  };
  
  const setVolume = (volume: number) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
  };
  
  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
  };
  
  const setLoop = (loop: boolean) => {
    dispatch({ type: 'SET_LOOP', payload: loop });
  };
  
  const setPlaybackRate = (rate: number) => {
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: rate });
  };
  
  const setPlayerMode = (mode: AudioUIState['playerMode']) => {
    dispatch({ type: 'SET_PLAYER_MODE', payload: mode });
  };
  
  const toggleWaveform = () => {
    dispatch({ type: 'TOGGLE_WAVEFORM' });
  };
  
  const togglePlaylist = () => {
    dispatch({ type: 'TOGGLE_PLAYLIST' });
  };
  
  const expandPlayer = () => {
    dispatch({ type: 'EXPAND_PLAYER' });
  };
  
  const collapsePlayer = () => {
    dispatch({ type: 'COLLAPSE_PLAYER' });
  };
  
  const addToFavorites = (sound: Sound) => {
    dispatch({ type: 'ADD_TO_FAVORITES', payload: sound });
  };
  
  const removeFromFavorites = (soundId: string) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: soundId });
  };
  
  const clearRecent = () => {
    dispatch({ type: 'CLEAR_RECENT' });
  };
  
  const updatePreferences = (prefs: Partial<AudioPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: prefs });
  };
  
  const enableTrimming = (enabled: boolean) => {
    dispatch({ type: 'ENABLE_TRIMMING', payload: enabled });
  };
  
  const setTrimPoints = (startTime: number, endTime: number) => {
    dispatch({ 
      type: 'SET_TRIM_POINTS', 
      payload: { startTime, endTime } 
    });
  };
  
  const setPremiumFeatures = (enabled: boolean) => {
    dispatch({ type: 'SET_PREMIUM_FEATURES', payload: enabled });
  };
  
  // Computed values
  const isFavorite = (soundId: string) => {
    return state.favoriteSounds.some(s => s.id === soundId);
  };
  
  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo<AudioContextValue>(() => ({
    // State
    state,
    
    // Dispatch
    dispatch,
    
    // Convenience methods
    loadSound,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setLoop,
    setPlaybackRate,
    
    // UI controls
    setPlayerMode,
    toggleWaveform,
    togglePlaylist,
    expandPlayer,
    collapsePlayer,
    
    // Collections
    addToFavorites,
    removeFromFavorites,
    clearRecent,
    
    // Preferences
    updatePreferences,
    
    // Premium features
    enableTrimming,
    setTrimPoints,
    setPremiumFeatures,
    
    // Computed properties
    isPlaying: state.playback.isPlaying,
    currentSound: state.currentSound,
    isFavorite,
    hasRecentSounds: state.recentSounds.length > 0,
    hasFavoriteSounds: state.favoriteSounds.length > 0,
  }), [state]);
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * Custom hook to use the audio context
 * Throws an error if used outside of AudioProvider
 */
export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext);
  
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  
  return context;
};
```

### GlobalAudioPlayer

```typescript
// src/components/audio/GlobalAudioPlayer.tsx

import React from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import MiniPlayer from './MiniPlayer';
import FullPlayer from './FullPlayer';

const GlobalAudioPlayer: React.FC = () => {
  const { state, setPlayerMode } = useAudio();
  const { currentSound, playerMode } = state;
  
  // Don't render anything if no sound is loaded
  if (!currentSound) return null;
  
  // Render appropriate player based on mode
  return (
    <div className="global-audio-player">
      {playerMode === 'mini' && (
        <MiniPlayer 
          onExpand={() => setPlayerMode('full')} 
        />
      )}
      
      {playerMode === 'full' && (
        <FullPlayer 
          onMinimize={() => setPlayerMode('mini')} 
        />
      )}
    </div>
  );
};

export default GlobalAudioPlayer;
```

### EditorAudioPanel

```typescript
// src/components/templateEditor/panels/EditorAudioPanel.tsx

import React, { useState } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { useTemplateEditor } from '@/lib/contexts/TemplateEditorContext';
import { useTemplateSound } from '@/lib/hooks/useTemplateSound';
import SoundSelector from '../sounds/SoundSelector';
import SoundCustomizer from '../sounds/SoundCustomizer';
import AudioTimeline from '../sounds/AudioTimeline';

/**
 * EditorAudioPanel - Integrated audio panel for the template editor
 * 
 * Implements Unicorn UX principles:
 * - Invisible Interface: Controls appear contextually within editor workflow
 * - Emotional Design: Immediate feedback on audio-visual pairing
 * - Contextual Intelligence: Recommends sounds based on template content
 * - Progressive Disclosure: Advanced features revealed as needed
 * - Sensory Harmony: Visual and audio elements synchronized
 */
const EditorAudioPanel: React.FC = () => {
  const { state: audioState } = useAudio();
  const { selectedTemplate, selectedSection } = useTemplateEditor();
  const { templateSound, setTemplateSound } = useTemplateSound(selectedTemplate?.id);
  
  const [expandedSection, setExpandedSection] = useState<'selector' | 'customizer' | 'timeline'>('selector');
  
  // Determine if we're showing panel for template or section
  const context = selectedSection ? 'section' : 'template';
  
  // Toggle section expansion with accordion behavior
  const toggleSection = (section: 'selector' | 'customizer' | 'timeline') => {
    setExpandedSection(current => current === section ? 'selector' : section);
  };
  
  return (
    <div className="editor-audio-panel p-4">
      <div className="panel-header flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {context === 'template' ? 'Template Sound' : 'Section Sound'}
        </h3>
        
        {/* Premium indicator if relevant */}
        {!audioState.premiumFeaturesEnabled && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
            Basic Mode
          </span>
        )}
      </div>
      
      {/* Sound selector section - always visible */}
      <div className="mb-4">
        <button 
          className="w-full text-left flex justify-between items-center" 
          onClick={() => toggleSection('selector')}
        >
          <span className="font-medium">Sound Selection</span>
          <span>{expandedSection === 'selector' ? '−' : '+'}</span>
        </button>
        
        {expandedSection === 'selector' && (
          <SoundSelector 
            context={context}
            templateType={selectedTemplate?.type}
            onSelectSound={(sound) => setTemplateSound(sound)}
            selectedSoundId={templateSound?.id}
          />
        )}
      </div>
      
      {/* Sound customizer - visible when sound is selected */}
      {templateSound && (
        <div className="mb-4">
          <button 
            className="w-full text-left flex justify-between items-center" 
            onClick={() => toggleSection('customizer')}
          >
            <span className="font-medium">Sound Customization</span>
            <span>{expandedSection === 'customizer' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'customizer' && (
            <SoundCustomizer 
              sound={templateSound}
              isPremium={audioState.premiumFeaturesEnabled}
            />
          )}
        </div>
      )}
      
      {/* Audio timeline - visible for premium users */}
      {templateSound && audioState.premiumFeaturesEnabled && (
        <div className="mb-4">
          <button 
            className="w-full text-left flex justify-between items-center" 
            onClick={() => toggleSection('timeline')}
          >
            <span className="font-medium">Audio Timeline</span>
            <span>{expandedSection === 'timeline' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'timeline' && (
            <AudioTimeline 
              sound={templateSound}
              templateDuration={selectedTemplate?.duration || 0}
              sectionTimings={selectedTemplate?.sections.map(s => ({
                id: s.id,
                startTime: s.startTime,
                duration: s.duration
              }))}
            />
          )}
        </div>
      )}
      
      {/* Upgrade prompt for non-premium users */}
      {templateSound && !audioState.premiumFeaturesEnabled && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800 mb-2">
            Unlock advanced audio features with Premium
          </p>
          <button className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1.5 rounded-md">
            Upgrade to Premium
          </button>
        </div>
      )}
    </div>
  );
};

export default EditorAudioPanel;
```

### SoundSelector Component

```typescript
// src/components/templateEditor/sounds/SoundSelector.tsx

import React, { useState, useEffect } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { useSoundSelection } from '@/lib/hooks/useSoundSelection';
import { Sound } from '@/lib/types/sound';

interface SoundSelectorProps {
  context: 'template' | 'section';
  templateType?: string;
  onSelectSound: (sound: Sound) => void;
  selectedSoundId?: string;
}

/**
 * SoundSelector - Component for selecting sounds with contextual recommendations
 * 
 * Implements Unicorn UX principles:
 * - Contextual Intelligence: Recommends sounds based on template type
 * - Progressive Disclosure: Search and filters appear as needed
 * - Invisible Interface: Immediate sound preview on hover
 */
const SoundSelector: React.FC<SoundSelectorProps> = ({
  context,
  templateType,
  onSelectSound,
  selectedSoundId
}) => {
  const { loadSound, play, pause } = useAudio();
  const { 
    recommendedSounds, 
    recentSounds,
    loadRecommendations
  } = useSoundSelection();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recommended' | 'recent' | 'search'>('recommended');
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);
  
  // Load recommendations when component mounts or template type changes
  useEffect(() => {
    loadRecommendations(templateType);
  }, [templateType, loadRecommendations]);
  
  // Handle sound preview on hover
  const handleSoundHover = (sound: Sound) => {
    // Only load and play if not already previewing this sound
    if (sound.id !== previewingSound) {
      setPreviewingSound(sound.id);
      loadSound(sound);
      play();
    }
  };
  
  // Stop preview when mouse leaves
  const handleMouseLeave = () => {
    setPreviewingSound(null);
    pause();
  };
  
  // Select a sound for the template/section
  const handleSelectSound = (sound: Sound) => {
    onSelectSound(sound);
  };
  
  return (
    <div className="sound-selector">
      {/* Search input */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search sounds..."
          className="w-full px-3 py-2 border rounded-md"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (e.target.value) {
              setActiveTab('search');
            }
          }}
        />
      </div>
      
      {/* Tabs */}
      <div className="flex border-b mb-3">
        <button
          className={`px-3 py-1.5 ${activeTab === 'recommended' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          Recommended
        </button>
        <button
          className={`px-3 py-1.5 ${activeTab === 'recent' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent
        </button>
      </div>
      
      {/* Sound list */}
      <div className="sound-list max-h-60 overflow-y-auto">
        {activeTab === 'recommended' && recommendedSounds.map(sound => (
          <div 
            key={sound.id}
            className={`p-2 border-b flex items-center ${selectedSoundId === sound.id ? 'bg-blue-50' : ''}`}
            onMouseEnter={() => handleSoundHover(sound)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelectSound(sound)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
              {previewingSound === sound.id ? '▶' : '♪'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{sound.title}</div>
              <div className="text-xs text-gray-500">{sound.authorName}</div>
            </div>
            <div className="text-xs text-gray-500">
              {sound.duration ? `${Math.floor(sound.duration / 60)}:${String(Math.floor(sound.duration % 60)).padStart(2, '0')}` : '--:--'}
            </div>
          </div>
        ))}
        
        {activeTab === 'recent' && recentSounds.map(sound => (
          <div 
            key={sound.id}
            className={`p-2 border-b flex items-center ${selectedSoundId === sound.id ? 'bg-blue-50' : ''}`}
            onMouseEnter={() => handleSoundHover(sound)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleSelectSound(sound)}
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
              {previewingSound === sound.id ? '▶' : '♪'}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{sound.title}</div>
              <div className="text-xs text-gray-500">{sound.authorName}</div>
            </div>
            <div className="text-xs text-gray-500">
              {sound.duration ? `${Math.floor(sound.duration / 60)}:${String(Math.floor(sound.duration % 60)).padStart(2, '0')}` : '--:--'}
            </div>
          </div>
        ))}
        
        {/* Show empty state if needed */}
        {activeTab === 'recommended' && recommendedSounds.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No recommended sounds available.
          </div>
        )}
        
        {activeTab === 'recent' && recentSounds.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No recently used sounds.
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundSelector;
```

## 5. Performance Considerations

To maintain high performance across the application:

1. **Lazy Loading**
   - Audio analysis and waveform visualization will be loaded only when needed
   - Advanced features will be code-split and loaded on demand

2. **Optimized Audio Playback**
   - Single global audio element to prevent multiple audio instances
   - Audio decoding will be done in a web worker when possible
   - Waveform data will be cached after first load

3. **Render Optimization**
   - Memoization of expensive components
   - Virtual scrolling for long sound lists
   - Throttled updates for timeline and waveform components

4. **Network Efficiency**
   - Progressive loading of audio files (for preview vs. full quality)
   - Caching of frequently used sounds
   - Preloading of likely-to-be-used sounds based on context

## 6. Accessibility Considerations

The audio integration will follow these accessibility principles:

1. **Keyboard Navigation**
   - All audio controls will be fully keyboard accessible
   - Focus management will ensure usability without a mouse

2. **Screen Reader Support**
   - Proper ARIA labels for all audio controls
   - Announcements for state changes
   - Audio descriptions for visual waveforms

3. **Reduced Motion**
   - Respect user preferences for reduced motion
   - Provide alternative non-animated UI for visualizations

4. **Color Contrast**
   - All audio UI will meet WCAG AA standards for contrast
   - Visual indicators will not rely solely on color

## 7. Implementation Roadmap

The implementation will follow this phased approach:

### Phase 1: Core Infrastructure
1. Implement AudioContext and global state management
2. Create basic GlobalAudioPlayer with MiniPlayer component
3. Implement persistence layer for audio state

### Phase 2: Editor Integration
1. Develop EditorAudioPanel with basic SoundSelector
2. Integrate with template editor
3. Implement basic sound-template association

### Phase 3: Enhanced Features
1. Add SoundCustomizer with basic controls
2. Implement AudioTimeline with visualization
3. Add premium feature gating

### Phase 4: Cross-Journey Integration
1. Integrate with Analytics Dashboard
2. Implement Content Planning integration
3. Add Sound Library Management

### Phase 5: Optimization & Polish
1. Performance optimizations
2. Accessibility improvements
3. Final UX refinements 

## 8. Integration with EditorContext

To seamlessly integrate audio functionality with the template editor, we'll establish connections between the `AudioContext` and `EditorContext`. This integration enables synchronization between visual elements and audio playback:

### Connection Points

1. **Template-Sound Association**
   ```typescript
   // src/lib/hooks/useTemplateSound.ts
   
   import { useCallback, useEffect, useState } from 'react';
   import { useAudio } from '@/lib/contexts/AudioContext';
   import { useEditor } from '@/lib/contexts/EditorContext';
   import { getSoundsByTemplateId, associateSoundWithTemplate } from '@/lib/services/soundService';
   
   export function useTemplateSound(templateId: string | undefined) {
     const { state: audioState, loadSound } = useAudio();
     const { state: editorState } = useEditor();
     const [templateSound, setTemplateSound] = useState<Sound | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     
     // Load template sound when template changes
     useEffect(() => {
       if (!templateId) return;
       
       setIsLoading(true);
       getSoundsByTemplateId(templateId)
         .then(sounds => {
           const primarySound = sounds.find(s => s.isPrimary);
           if (primarySound) {
             setTemplateSound(primarySound);
           }
           setIsLoading(false);
         })
         .catch(error => {
           console.error('Error loading template sound:', error);
           setIsLoading(false);
         });
     }, [templateId]);
     
     // Associate sound with template and save to database
     const updateTemplateSound = useCallback((sound: Sound | null) => {
       if (!templateId) return;
       
       setTemplateSound(sound);
       
       if (sound) {
         // Load the sound into the audio player
         loadSound(sound);
         
         // Save association to database
         associateSoundWithTemplate(templateId, sound.id, true)
           .catch(error => {
             console.error('Error saving template sound:', error);
           });
       }
     }, [templateId, loadSound]);
     
     return {
       templateSound,
       setTemplateSound: updateTemplateSound,
       isLoading
     };
   }
   ```

2. **Playback Synchronization with Timeline**
   ```typescript
   // src/components/templateEditor/timeline/TimelineController.tsx
   
   import React, { useEffect } from 'react';
   import { useEditor } from '@/lib/contexts/EditorContext';
   import { useAudio } from '@/lib/contexts/AudioContext';
   
   const TimelineController: React.FC = () => {
     const { state: editorState, playTimeline, pauseTimeline, seekTimeline } = useEditor();
     const { state: audioState, play, pause, seek } = useAudio();
     
     // Synchronize audio playback with timeline
     useEffect(() => {
       if (editorState.isPlaying && !audioState.playback.isPlaying && audioState.currentSound) {
         play();
       } else if (!editorState.isPlaying && audioState.playback.isPlaying) {
         pause();
       }
     }, [editorState.isPlaying, audioState.playback.isPlaying, audioState.currentSound, play, pause]);
     
     // Synchronize timeline position with audio position
     useEffect(() => {
       if (audioState.playback.isPlaying && audioState.currentSound) {
         seekTimeline(audioState.playback.currentTime);
       }
     }, [audioState.playback.currentTime, audioState.playback.isPlaying, audioState.currentSound, seekTimeline]);
     
     // Synchronize audio position with timeline position
     useEffect(() => {
       if (editorState.isPlaying && audioState.currentSound) {
         seek(editorState.currentTime);
       }
     }, [editorState.currentTime, editorState.isPlaying, audioState.currentSound, seek]);
     
     return null; // This is a controller component with no UI
   };
   
   export default TimelineController;
   ```

3. **Sound Recommendation Engine**
   ```typescript
   // src/lib/services/soundRecommendationService.ts
   
   import { Template } from '@/lib/types/template';
   import { Sound } from '@/lib/types/sound';
   import { fetchSounds } from '@/lib/services/soundService';
   
   interface RecommendationParams {
     templateType?: string;
     templateDuration?: number;
     templateMood?: string;
     templateTags?: string[];
     templateTitle?: string;
     userData?: {
       recentSounds: Sound[];
       favoriteSounds: Sound[];
       industry?: string;
       preferredGenres?: string[];
     };
   }
   
   export async function getRecommendedSounds(params: RecommendationParams): Promise<Sound[]> {
     // Build query parameters based on template context
     const queryParams = new URLSearchParams();
     
     if (params.templateType) {
       queryParams.append('templateType', params.templateType);
     }
     
     if (params.templateDuration) {
       queryParams.append('duration', params.templateDuration.toString());
       // Add a duration range (±5 seconds)
       queryParams.append('durationRange', '5');
     }
     
     if (params.templateMood) {
       queryParams.append('mood', params.templateMood);
     }
     
     if (params.templateTags && params.templateTags.length > 0) {
       queryParams.append('tags', params.templateTags.join(','));
     }
     
     // Add user context for personalized recommendations
     if (params.userData) {
       if (params.userData.preferredGenres && params.userData.preferredGenres.length > 0) {
         queryParams.append('genres', params.userData.preferredGenres.join(','));
       }
       
       if (params.userData.industry) {
         queryParams.append('industry', params.userData.industry);
       }
     }
     
     try {
       // Fetch recommended sounds
       const sounds = await fetchSounds(queryParams);
       
       // Further process and rank the results
       return rankSounds(sounds, params);
     } catch (error) {
       console.error('Error fetching recommended sounds:', error);
       return [];
     }
   }
   
   function rankSounds(sounds: Sound[], params: RecommendationParams): Sound[] {
     // Implementation of ranking algorithm based on:
     // 1. Match with template parameters
     // 2. User preferences
     // 3. Popularity and quality metrics
     // 4. Diversity of results
     
     // This would be a more complex implementation in practice
     return sounds.sort((a, b) => {
       // Calculate scores
       const scoreA = calculateSoundScore(a, params);
       const scoreB = calculateSoundScore(b, params);
       
       // Sort by score (descending)
       return scoreB - scoreA;
     });
   }
   
   function calculateSoundScore(sound: Sound, params: RecommendationParams): number {
     let score = 0;
     
     // Base score from sound quality and popularity
     score += sound.popularity * 0.5;
     score += sound.qualityScore * 0.3;
     
     // Match with template parameters
     if (params.templateDuration && sound.duration) {
       // Better score for sounds with duration close to template duration
       const durationDiff = Math.abs(params.templateDuration - sound.duration);
       const durationScore = Math.max(0, 10 - durationDiff);
       score += durationScore * 0.8;
     }
     
     if (params.templateMood && sound.mood) {
       if (params.templateMood === sound.mood) {
         score += 10;
       }
     }
     
     if (params.templateTags && params.templateTags.length > 0 && sound.tags) {
       // Count matching tags
       const matchingTags = params.templateTags.filter(tag => 
         sound.tags.includes(tag)
       );
       score += matchingTags.length * 2;
     }
     
     // User preference boost
     if (params.userData) {
       if (params.userData.favoriteSounds.some(fav => fav.id === sound.id)) {
         // User previously favorited this sound
         score += 5;
       }
       
       if (params.userData.preferredGenres && sound.genre) {
         if (params.userData.preferredGenres.includes(sound.genre)) {
           // Matches user's preferred genre
           score += 8;
         }
       }
     }
     
     return score;
   }
   ```

// ... existing code ... 