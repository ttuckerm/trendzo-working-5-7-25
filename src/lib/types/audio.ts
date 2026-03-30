/**
 * Audio Types
 * 
 * Core type definitions for the audio system, including sound data structure,
 * playback state, and context interfaces.
 */

/**
 * Sound interface representing an audio track
 */
export interface Sound {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  genre?: string;
}

/**
 * AudioCharacteristics interface for tracking audio properties
 */
export interface AudioCharacteristics {
  tempo?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  liveness?: number;
}

// Sound with additional metadata for UI presentation
export interface SoundWithMetadata extends Sound {
  isPlaying?: boolean;
  isFavorite?: boolean;
  lastPlayed?: Date;
  playCount?: number;
}

// Audio playback state
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  playbackRate: number;
}

// Audio UI state
export interface AudioUIState {
  playerMode: 'mini' | 'full' | 'hidden';
  isExpanded: boolean;
  showWaveform: boolean;
  showPlaylist: boolean;
}

// User preferences for audio
export interface AudioPreferences {
  defaultVolume: number;
  defaultPlaybackRate: number;
  autoplay: boolean;
  showTimeRemaining: boolean;
}

// Trimming state for premium features
export interface TrimmingState {
  enabled: boolean;
  startTime: number;
  endTime: number;
}

// Comprehensive audio state
export interface AudioState {
  // Current playback
  currentSound: Sound | null;
  playback: PlaybackState;
  
  // UI state
  ui: AudioUIState;
  
  // User collections
  recentSounds: SoundWithMetadata[];
  favoriteSounds: SoundWithMetadata[];
  
  // User preferences
  preferences: AudioPreferences;
  
  // Premium features
  trimming: TrimmingState;
  
  // Feature flags
  premiumFeaturesEnabled: boolean;
}

// Available sound sources
export type SoundSource = 'library' | 'upload' | 'recording' | 'url';

// Sound categories for organization
export enum SoundCategory {
  Music = 'music',
  SoundEffect = 'sound_effect',
  VoiceOver = 'voice_over',
  Ambience = 'ambience',
  Custom = 'custom'
}

// Action types for audio context
export type AudioActionType = 
  // Playback actions
  | { type: 'LOAD_SOUND'; payload: Sound }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SEEK'; payload: number }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_LOOP'; payload: boolean }
  | { type: 'SET_PLAYBACK_RATE'; payload: number }
  
  // UI actions
  | { type: 'SET_PLAYER_MODE'; payload: AudioUIState['playerMode'] }
  | { type: 'TOGGLE_WAVEFORM' }
  | { type: 'TOGGLE_PLAYLIST' }
  | { type: 'EXPAND_PLAYER' }
  | { type: 'COLLAPSE_PLAYER' }
  
  // Collection actions
  | { type: 'ADD_TO_RECENT'; payload: Sound }
  | { type: 'ADD_TO_FAVORITES'; payload: Sound }
  | { type: 'REMOVE_FROM_FAVORITES'; payload: string } // sound id
  | { type: 'CLEAR_RECENT' }
  
  // Preference actions
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AudioPreferences> }
  
  // Trimming actions (premium)
  | { type: 'ENABLE_TRIMMING'; payload: boolean }
  | { type: 'SET_TRIM_POINTS'; payload: { startTime: number; endTime: number } }
  
  // Feature flag actions
  | { type: 'SET_PREMIUM_FEATURES'; payload: boolean };

// Audio context value interface - what components will access
export interface AudioContextValue {
  // State
  state: AudioState;
  
  // Dispatch (for advanced use cases)
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