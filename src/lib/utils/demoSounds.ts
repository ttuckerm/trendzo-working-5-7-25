import { Sound } from '@/lib/types/audio';

/**
 * Example sounds with valid audio URLs for testing audio player functionality
 * These use public domain audio from SoundHelix for demo purposes
 */
export const demoSounds: Sound[] = [
  {
    id: 'sound-1',
    title: 'Upbeat Corporate Groove',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 230, // 3:50
    category: 'Music',
    tags: ['upbeat', 'corporate', 'positive'],
    coverImage: 'https://placehold.co/400x400/3b82f6/ffffff?text=Corporate'
  },
  {
    id: 'sound-2',
    title: 'Jazzy Electronica',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 192, // 3:12
    category: 'Music',
    tags: ['jazz', 'electronic', 'modern'],
    coverImage: 'https://placehold.co/400x400/10b981/ffffff?text=Jazzy'
  },
  {
    id: 'sound-3',
    title: 'Cinematic Epic',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 287, // 4:47
    category: 'Music',
    tags: ['cinematic', 'dramatic', 'trailer'],
    coverImage: 'https://placehold.co/400x400/f59e0b/ffffff?text=Epic'
  },
  {
    id: 'sound-4',
    title: 'Acoustic Ambience',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 160, // 2:40
    category: 'Music',
    tags: ['acoustic', 'ambient', 'calm'],
    coverImage: 'https://placehold.co/400x400/8b5cf6/ffffff?text=Ambient'
  },
  {
    id: 'sound-5',
    title: 'Techno Rhythm',
    artist: 'SoundHelix',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 208, // 3:28
    category: 'Music',
    tags: ['techno', 'rhythm', 'electronic'],
    coverImage: 'https://placehold.co/400x400/ec4899/ffffff?text=Techno'
  }
];

/**
 * Helper function to select a random demo sound
 * @returns A random sound from the demoSounds array
 */
export function getRandomDemoSound(): Sound {
  const randomIndex = Math.floor(Math.random() * demoSounds.length);
  return demoSounds[randomIndex];
}

/**
 * Helper function to get a demo sound by ID
 * @param id The ID of the sound to retrieve
 * @returns The sound with the matching ID or the first sound if not found
 */
export function getDemoSoundById(id: string): Sound {
  return demoSounds.find(sound => sound.id === id) || demoSounds[0];
} 