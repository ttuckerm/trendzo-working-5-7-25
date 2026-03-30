"use client";

import { useCallback, useMemo } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { Sound, SoundWithMetadata } from '@/lib/types/audio';

type CollectionType = 'recent' | 'favorites';

/**
 * Hook for accessing and managing sound collections
 * 
 * This hook provides convenient methods for working with sound collections
 * such as recent sounds and favorites.
 */
export function useSoundCollection(type: CollectionType = 'recent') {
  const { 
    state,
    loadSound, 
    play, 
    addToFavorites, 
    removeFromFavorites, 
    clearRecent,
    isFavorite
  } = useAudio();
  
  // Get the appropriate collection based on type
  const collection = useMemo(() => {
    return type === 'recent' ? state.recentSounds : state.favoriteSounds;
  }, [state.recentSounds, state.favoriteSounds, type]);
  
  // Play a sound from the collection
  const playSound = useCallback((sound: Sound) => {
    loadSound(sound);
    play();
  }, [loadSound, play]);
  
  // Toggle favorite status for a sound
  const toggleFavorite = useCallback((sound: Sound) => {
    if (isFavorite(sound.id)) {
      removeFromFavorites(sound.id);
    } else {
      addToFavorites(sound);
    }
  }, [addToFavorites, removeFromFavorites, isFavorite]);
  
  // Clear the collection (only works for recent sounds)
  const clearCollection = useCallback(() => {
    if (type === 'recent') {
      clearRecent();
    }
  }, [type, clearRecent]);
  
  // Filter the collection by category
  const filterByCategory = useCallback((category: string) => {
    return collection.filter(sound => sound.category === category);
  }, [collection]);
  
  // Search the collection
  const searchCollection = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return collection.filter(sound => 
      sound.title.toLowerCase().includes(lowerQuery) || 
      (sound.artist && sound.artist.toLowerCase().includes(lowerQuery)) ||
      (sound.tags && sound.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }, [collection]);
  
  // Get categories in the collection
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    collection.forEach(sound => {
      if (sound.category) {
        categorySet.add(sound.category);
      }
    });
    return Array.from(categorySet);
  }, [collection]);
  
  // Get most played sounds (only relevant for recent sounds)
  const mostPlayed = useMemo(() => {
    if (type !== 'recent') return [];
    
    return [...collection]
      .filter(sound => sound.playCount && sound.playCount > 1)
      .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
      .slice(0, 5);
  }, [collection, type]);
  
  return {
    // Collection data
    sounds: collection,
    isEmpty: collection.length === 0,
    categories,
    mostPlayed,
    
    // Actions
    playSound,
    toggleFavorite,
    clearCollection,
    filterByCategory,
    searchCollection,
    
    // Utility functions
    isFavorite,
  };
}

export default useSoundCollection; 