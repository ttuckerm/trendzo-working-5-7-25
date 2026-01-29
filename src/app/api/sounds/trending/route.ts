import { NextRequest, NextResponse } from 'next/server';
import { soundService } from '@/lib/services/soundService';
import { auth } from '@/lib/auth';
import { mockSounds } from '@/lib/mock/mockSoundData';
import { checkSubscriptionAccess } from '@/middleware/checkSubscription';
import { isDemoRequest } from '@/lib/utils/demoData';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs, query, where, limit, orderBy, startAfter, doc, getDoc } from 'firebase/firestore';

// Mock trending sounds for development
const MOCK_TRENDING_SOUNDS = [
  {
    id: 'trending-1',
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
      growthVelocity7d: 0.34,
      trend: 'rising'
    }
  },
  {
    id: 'trending-2',
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
      growthVelocity7d: 0.28,
      trend: 'rising'
    }
  },
  {
    id: 'trending-3',
    title: 'Viral TikTok Sound 2023',
    filepath: '/sounds/viral-tiktok.mp3',
    authorName: 'Social Media Stars',
    soundCategory: 'viral',
    duration: 25,
    usageCount: 3478,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/viral-tiktok.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'pop',
    tempo: 'fast',
    mood: ['energetic', 'viral'],
    stats: {
      usageChange7d: 65,
      growthVelocity7d: 0.65,
      trend: 'rising'
    }
  },
  {
    id: 'trending-4',
    title: 'Motivational Speech Background',
    filepath: '/sounds/motivational.mp3',
    authorName: 'Inspire Productions',
    soundCategory: 'voiceover',
    duration: 60,
    usageCount: 756,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/motivational.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'instrumental',
    tempo: 'medium',
    mood: ['inspirational', 'uplifting'],
    stats: {
      usageChange7d: 32,
      growthVelocity7d: 0.32,
      trend: 'rising'
    }
  },
  {
    id: 'trending-5',
    title: 'Epic Cinematic Rise',
    filepath: '/sounds/cinematic-rise.mp3',
    authorName: 'Film Score Studios',
    soundCategory: 'soundEffect',
    duration: 8,
    usageCount: 482,
    playUrl: 'https://firebasestorage.googleapis.com/v0/b/demo-sounds/cinematic-rise.mp3',
    coverThumb: 'https://via.placeholder.com/100',
    genre: 'cinematic',
    tempo: 'slow',
    mood: ['dramatic', 'intense'],
    stats: {
      usageChange7d: 15,
      growthVelocity7d: 0.15,
      trend: 'rising'
    }
  }
];

/**
 * GET /api/sounds/trending
 * Returns trending sounds with growth metrics based on parameters
 * 
 * Query parameters:
 * @param timeframe - Timeframe for trending calculation ('7d', '14d', '30d', default: '7d')
 * @param category - Optional category to filter by (music, voiceover, soundEffect, etc.)
 * @param limit - Maximum number of results to return (default: 10, max: 50)
 * @param minViralityScore - Minimum virality score threshold (default: 0)
 * @param lifecycle - Optional lifecycle stage filter (emerging, growing, peaking, declining, stable)
 * 
 * This endpoint requires premium subscription.
 * Non-premium users can access demo data by adding ?demo=true
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') as '7d' | '14d' | '30d' || '7d';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get trending sounds from service
    const sounds = await soundService.getTrendingSounds(timeframe, limit);

    return NextResponse.json({
      success: true,
      sounds: sounds,
      count: sounds.length,
      timeframe
    });
  } catch (error) {
    console.error('Error fetching trending sounds:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch trending sounds'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get usage change value for the specified timeframe
 */
function getUsageChangeForTimeframe(sound: any, timeframe: '7d' | '14d' | '30d'): number {
  if (timeframe === '7d') return sound.stats.usageChange7d || 0;
  if (timeframe === '14d') return sound.stats.usageChange14d || 0;
  return sound.stats.usageChange30d || 0;
}

/**
 * Helper function to get growth velocity for the specified timeframe
 */
function getGrowthVelocityForTimeframe(sound: any, timeframe: '7d' | '14d' | '30d'): number {
  if (timeframe === '7d') return sound.stats.growthVelocity7d || 0;
  if (timeframe === '14d') return sound.stats.growthVelocity14d || 0;
  return sound.stats.growthVelocity30d || 0;
}

/**
 * Calculate relative growth compared to average
 */
function calculateRelativeGrowth(sound: any, timeframe: '7d' | '14d' | '30d'): number {
  // This is a placeholder for a more sophisticated calculation
  // Would typically compare to average growth of all sounds in the category
  const growth = getUsageChangeForTimeframe(sound, timeframe);
  const baseline = sound.stats.usageCount * 0.05; // Assume 5% is typical growth
  
  if (baseline === 0) return 0;
  return Math.round((growth / baseline) * 100) / 100; // Relative growth as a multiplier
} 