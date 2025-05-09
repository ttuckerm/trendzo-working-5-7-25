import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where, limit, orderBy, startAfter, doc, getDoc, Firestore } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { auth } from '@/lib/auth';

// Collection name
const SOUNDS_COLLECTION = 'sounds';

// Define interface for Sound object
interface Sound {
  id: string;
  title: string;
  filepath: string;
  waveformPath?: string;
  downloadUrl?: string | null;
  waveformUrl?: string | null;
  soundCategory?: string;
  authorName?: string;
  coverThumb?: string;
  playUrl?: string;
  duration?: number;
  usageCount?: number;
  matchScore?: number;
  classification?: {
    genre?: string[];
  };
  genres?: string[];
  genre?: string;
  mood?: string[] | undefined;
  moods?: string[];
  tempo?: string;
  [key: string]: any; // Allow for other properties
}

// Mock data for development when Firebase isn't accessible
const MOCK_SOUNDS: Sound[] = [
  {
    id: 'mock-1',
    title: 'Summer Beach Vibes',
    filepath: '/sounds/summer-beach.mp3',
    authorName: 'Coastal Dreams',
    soundCategory: 'music',
    duration: 45,
    usageCount: 1245,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/summer-beach.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'ambient',
    tempo: 'medium',
    mood: ['relaxed', 'happy'],
    stats: {
      usageChange7d: 42,
      trend: 'rising'
    }
  },
  {
    id: 'mock-2',
    title: 'Lo-Fi Study Beat',
    filepath: '/sounds/lofi-study.mp3',
    authorName: 'Chill Hop Master',
    soundCategory: 'music',
    duration: 120,
    usageCount: 897,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/lofi-study.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'lofi',
    tempo: 'medium',
    mood: ['focused', 'calm'],
    stats: {
      usageChange7d: 28,
      trend: 'rising'
    }
  },
  {
    id: 'mock-3',
    title: 'Electric Dance Pop',
    filepath: '/sounds/electric-dance.mp3',
    authorName: 'Beat Factory',
    soundCategory: 'music',
    duration: 65,
    usageCount: 425,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/electric-dance.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'dance',
    tempo: 'fast',
    mood: ['energetic', 'upbeat'],
    stats: {
      usageChange7d: -8,
      trend: 'falling'
    }
  }
];

// Helper function to get a safe Firestore instance
function getFirestore(): Firestore | null {
  if (!db) {
    console.warn('Firestore is not initialized. Using mock data in development mode.');
    return null;
  }
  return db as Firestore;
}

/**
 * GET /api/sounds
 * Returns a paginated list of sounds with optional filtering
 * 
 * Query parameters:
 * @param category - Filter by sound category
 * @param genre - Filter by genre
 * @param mood - Filter by mood
 * @param tempo - Filter by tempo
 * @param limit - Number of sounds to return (default: 20, max: 100)
 * @param lastId - Last sound ID for pagination
 * @param withUrls - Include downloadable URLs (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // In development mode, allow access even without authentication
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    const tempo = searchParams.get('tempo');
    const lastId = searchParams.get('lastId');
    const withUrls = searchParams.get('withUrls') !== 'false';
    const sortBy = searchParams.get('sortBy') || 'usageCount';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    
    // Handle limit parameter (default: 20, max: 100)
    let pageSize = 20;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        pageSize = Math.min(parsedLimit, 100);
      }
    }
    
    // If demo is requested or Firestore is not available, return mock data
    const isDemoMode = searchParams.get('demo') === 'true';
    const firestore = getFirestore();
    
    if (isDemoMode || !firestore) {
      console.log('Using mock sound data');
      
      // Filter mock data based on query parameters
      let filteredSounds = [...MOCK_SOUNDS];
      
      if (category) {
        filteredSounds = filteredSounds.filter(sound => sound.soundCategory === category);
      }
      
      if (genre) {
        filteredSounds = filteredSounds.filter(sound => 
          sound.genre === genre || 
          (sound.genres && sound.genres.includes(genre)) ||
          (sound.classification?.genre && sound.classification.genre.includes(genre))
        );
      }
      
      if (mood) {
        filteredSounds = filteredSounds.filter(sound => 
          (Array.isArray(sound.mood) && sound.mood.includes(mood)) ||
          (Array.isArray(sound.moods) && sound.moods.includes(mood))
        );
      }
      
      if (tempo) {
        filteredSounds = filteredSounds.filter(sound => sound.tempo === tempo);
      }
      
      // Sort the filtered data
      if (sortBy === 'creationDate') {
        // Sort by mock creation date (just reverse the array for 'recent')
        filteredSounds = sortDirection === 'desc' ? 
          [...filteredSounds].reverse() : 
          [...filteredSounds];
      } else {
        // Sort by usage count
        filteredSounds.sort((a, b) => {
          const countA = a.usageCount || 0;
          const countB = b.usageCount || 0;
          return sortDirection === 'desc' ? countB - countA : countA - countB;
        });
      }
      
      return NextResponse.json({
        success: true,
        data: filteredSounds,
        pagination: {
          lastVisible: filteredSounds.length > 0 ? filteredSounds[filteredSounds.length - 1].id : null,
          hasMore: false // No more data in mock mode
        }
      });
    }
    
    // Setup base query
    const soundsRef = collection(firestore, SOUNDS_COLLECTION);
    let queryConstraints: any[] = [];
    
    // Add filtering constraints if provided
    if (category) {
      queryConstraints.push(where('soundCategory', '==', category));
    }
    
    if (genre) {
      // Try to query both in the new classification.genre array and the legacy genre field
      // This is a simplified approach - in Firestore, array-contains can only be used once per query
      queryConstraints.push(where('classification.genre', 'array-contains', genre));
    }
    
    if (mood) {
      // Handle array or string mood field
      if (Array.isArray(mood)) {
        queryConstraints.push(where('mood', 'array-contains', mood));
      } else {
        queryConstraints.push(where('mood', '==', mood));
      }
    }
    
    if (tempo) {
      queryConstraints.push(where('tempo', '==', tempo));
    }
    
    // Add ordering and pagination
    queryConstraints.push(orderBy('title', 'asc'));
    
    // If lastId is provided, get the document and use it for pagination
    if (lastId) {
      const lastDoc = await getDoc(doc(firestore, SOUNDS_COLLECTION, lastId));
      if (lastDoc.exists()) {
        queryConstraints.push(startAfter(lastDoc));
      }
    }
    
    // Add limit
    queryConstraints.push(limit(pageSize));
    
    // Execute query
    const soundsQuery = query(soundsRef, ...queryConstraints);
    const soundsSnapshot = await getDocs(soundsQuery);
    
    // Process results
    const sounds: Sound[] = [];
    const storage = getStorage();
    
    for (const docSnapshot of soundsSnapshot.docs) {
      const soundData = docSnapshot.data();
      // Ensure sound object has required properties from the interface
      const sound: Sound = { 
        id: docSnapshot.id, 
        title: soundData.title || '', 
        filepath: soundData.filepath || '',
        ...soundData as Omit<Sound, 'id' | 'title' | 'filepath'>
      };
      
      // Add download URLs if requested
      if (withUrls && sound.filepath) {
        try {
          const fileRef = ref(storage, sound.filepath);
          const url = await getDownloadURL(fileRef);
          sound.downloadUrl = url;
        } catch (err) {
          console.error(`Failed to get URL for ${sound.filepath}:`, err);
          sound.downloadUrl = null;
        }
        
        // Add waveform image URL if available
        if (sound.waveformPath) {
          try {
            const waveformRef = ref(storage, sound.waveformPath);
            const waveformUrl = await getDownloadURL(waveformRef);
            sound.waveformUrl = waveformUrl;
          } catch (err) {
            console.error(`Failed to get waveform URL for ${sound.waveformPath}:`, err);
            sound.waveformUrl = null;
          }
        }
      }
      
      sounds.push(sound);
    }
    
    // Prepare pagination info
    const lastVisible = soundsSnapshot.docs.length > 0 
      ? soundsSnapshot.docs[soundsSnapshot.docs.length - 1].id 
      : null;
    
    const hasMore = soundsSnapshot.docs.length === pageSize;
    
    // Return formatted response
    return NextResponse.json({
      success: true,
      data: sounds,
      pagination: {
        lastVisible,
        hasMore
      }
    });
  } catch (error: any) {
    console.error('Error fetching sounds:', error);
    
    // In development mode, return mock data on error
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning mock data due to error');
      return NextResponse.json({
        success: true,
        data: MOCK_SOUNDS,
        pagination: {
          lastVisible: null,
          hasMore: false
        }
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching sounds' },
      { status: 500 }
    );
  }
} 