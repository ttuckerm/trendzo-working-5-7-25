import { NextRequest, NextResponse } from 'next/server';
import { soundService } from '@/lib/services/soundService';
import { auth } from '@/lib/auth';
import { mockSounds } from '@/lib/mock/mockSoundData';
import { checkSubscriptionAccess } from '@/middleware/checkSubscription';
import { isDemoRequest } from '@/lib/utils/demoData';

// Create a mock similarity matrix if it doesn't exist
const mockSimilarityMatrix: Record<string, Record<string, number>> = {};

// Generate random similarity scores between sounds
mockSounds.forEach(sound => {
  mockSimilarityMatrix[sound.id] = {};
  mockSounds.forEach(otherSound => {
    if (sound.id !== otherSound.id) {
      // Generate a random similarity score between 0.1 and 0.9
      mockSimilarityMatrix[sound.id][otherSound.id] = Math.random() * 0.8 + 0.1;
    }
  });
});

// Define types for our recommendation functions
interface RecommendationOptions {
  strategy: 'similar' | 'popular' | 'trending' | 'hybrid';
  category?: string | null;
  genres: string[];
  moods: string[];
  limit: number;
}

interface Sound {
  id: string;
  title: string;
  authorName: string;
  coverThumb?: string;
  playUrl?: string;
  duration?: number;
  usageCount?: number;
  matchScore?: number;
  soundCategory?: string;
  categories?: string[];
  genre?: string;
  genres?: string[];
  mood?: string[] | undefined;
  moods?: string[];
  stats?: {
    usageChange7d?: number;
    usageChange14d?: number;
    usageChange30d?: number;
    growthVelocity7d?: number;
  };
}

/**
 * GET /api/sounds/recommendations
 * Returns recommended sounds based on input parameters
 * 
 * Query parameters:
 * @param soundId - ID of the sound to base recommendations on (optional if userId provided)
 * @param userId - ID of the user to generate personalized recommendations for (optional if soundId provided)
 * @param category - Optional category filter
 * @param genres - Optional comma-separated list of genres
 * @param moods - Optional comma-separated list of moods
 * @param limit - Maximum number of recommendations to return (default: 10, max: 20)
 * @param strategy - Recommendation strategy: 'similar', 'popular', 'trending', 'hybrid' (default: 'hybrid')
 * 
 * This endpoint requires premium subscription.
 * Non-premium users can access demo data by adding ?demo=true
 */
export async function GET(request: NextRequest) {
  try {
    // Check subscription access with our middleware
    const subscriptionCheck = await checkSubscriptionAccess(request, {
      requiredTier: 'premium',
      allowDemoData: true
    });
    
    // If the subscription check returned a response, return it directly
    if (subscriptionCheck) {
      // If it's a demo request, return sample data
      if (isDemoRequest(request)) {
        // Generate mock recommendations with demo data
        const demoRecommendations = generateMockRecommendations(
          null,
          {
            strategy: 'hybrid',
            category: null,
            genres: [],
            moods: [],
            limit: 10
          }
        );
        
        const formattedDemoRecommendations = demoRecommendations.map(sound => ({
          id: sound.id,
          title: sound.title,
          authorName: sound.authorName,
          coverThumb: sound.coverThumb,
          playUrl: sound.playUrl,
          duration: sound.duration,
          usageCount: sound.usageCount,
          matchScore: sound.matchScore,
          soundCategory: sound.soundCategory,
          genres: sound.genres || (sound.genre ? [sound.genre] : []),
          moods: sound.mood || sound.moods || []
        }));
        
        return NextResponse.json({
          success: true,
          strategy: 'hybrid',
          basedOn: 'demo',
          isDemo: true,
          count: formattedDemoRecommendations.length,
          recommendations: formattedDemoRecommendations
        });
      }
      
      return subscriptionCheck;
    }
    
    // If we reach here, the user has the required subscription level
    // Continue with normal flow
    
    // Check authentication (optional)
    const session = await auth();
    
    // In development mode, allow access even without authentication
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const soundId = searchParams.get('soundId');
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');
    const genresParam = searchParams.get('genres');
    const moodsParam = searchParams.get('moods');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Cap at 20
    const strategy = searchParams.get('strategy') || 'hybrid';
    
    // Parse array parameters
    const genres = genresParam ? genresParam.split(',') : [];
    const moods = moodsParam ? moodsParam.split(',') : [];
    
    // Basic validation
    if (!soundId && !userId) {
      return NextResponse.json({ 
        error: 'Either soundId or userId must be provided' 
      }, { status: 400 });
    }
    
    if (!['similar', 'popular', 'trending', 'hybrid'].includes(strategy)) {
      return NextResponse.json({ 
        error: 'Invalid strategy. Must be similar, popular, trending, or hybrid' 
      }, { status: 400 });
    }
    
    let recommendations: Sound[] = [];
    
    try {
      // Try to get recommendations from Firebase
      if (soundId) {
        // In a real implementation, we would call:
        // recommendations = await soundService.getRecommendationsBySoundId(soundId, {...})
        // For now, we'll throw an error to use mock data in development
        throw new Error('Using mock data in development');
      } else if (userId) {
        // In a real implementation, we would call:
        // recommendations = await soundService.getRecommendationsForUser(userId, {...})
        // For now, we'll throw an error to use mock data in development
        throw new Error('Using mock data in development');
      }
    } catch (error) {
      console.warn('Error accessing Firebase, using mock data:', error);
      
      // If in development mode, use mock data
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock data for recommendations');
        
        // Generate mock recommendations based on the strategy
        recommendations = generateMockRecommendations(
          soundId,
          {
            strategy: strategy as 'similar' | 'popular' | 'trending' | 'hybrid',
            category,
            genres,
            moods,
            limit: limit * 2
          }
        );
      } else {
        // In production, rethrow the error
        throw error;
      }
    }
    
    // Apply additional filters if needed
    if (category && recommendations) {
      recommendations = recommendations.filter(sound => 
        sound.soundCategory === category || 
        (sound.categories && sound.categories.includes(category))
      );
    }
    
    if (genres.length > 0 && recommendations) {
      recommendations = recommendations.filter(sound => {
        // Check if any of the requested genres match
        return genres.some(genre => 
          sound.genre === genre || 
          (sound.genres && sound.genres.includes(genre))
        );
      });
    }
    
    if (moods.length > 0 && recommendations) {
      recommendations = recommendations.filter(sound => {
        // Check if any of the requested moods match
        return moods.some(mood => 
          (sound.mood && sound.mood.includes(mood)) || 
          (sound.moods && sound.moods.includes(mood))
        );
      });
    }
    
    // Apply final limit
    recommendations = recommendations ? recommendations.slice(0, limit) : [];
    
    // Format response
    const formattedRecommendations = recommendations.map(sound => ({
      id: sound.id,
      title: sound.title,
      authorName: sound.authorName,
      coverThumb: sound.coverThumb,
      playUrl: sound.playUrl,
      duration: sound.duration,
      usageCount: sound.usageCount,
      matchScore: sound.matchScore,
      soundCategory: sound.soundCategory,
      genres: sound.genres || (sound.genre ? [sound.genre] : []),
      moods: sound.mood || sound.moods || []
    }));
    
    return NextResponse.json({
      success: true,
      strategy,
      basedOn: soundId ? 'sound' : 'user',
      referenceId: soundId || userId,
      count: formattedRecommendations.length,
      recommendations: formattedRecommendations
    });
  } catch (error: any) {
    console.error('Error fetching sound recommendations:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Generate mock recommendations based on strategy
 */
function generateMockRecommendations(soundId: string | null, options: RecommendationOptions): Sound[] {
  if (!soundId) {
    // If no soundId, return most popular sounds
    return [...mockSounds]
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, options.limit)
      .map(sound => ({
        ...sound,
        matchScore: Math.random() * 0.3 + 0.7 // Random score between 0.7 and 1.0
      }));
  }
  
  // Find the base sound
  const baseSound = mockSounds.find(s => s.id === soundId);
  if (!baseSound) {
    return [];
  }
  
  let result: Sound[];
  
  switch (options.strategy) {
    case 'similar':
      // Use mockSimilarityMatrix to find similar sounds
      const similarities = mockSimilarityMatrix[soundId] || {};
      
      // Sort sounds by similarity score
      result = mockSounds
        .filter(s => s.id !== soundId) // Exclude the base sound
        .map(sound => ({
          ...sound,
          matchScore: similarities[sound.id] || Math.random() * 0.5 // Use matrix or random fallback
        }))
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      break;
      
    case 'popular':
      // Sort by usage count
      result = mockSounds
        .filter(s => s.id !== soundId)
        .map(sound => ({
          ...sound,
          matchScore: Math.min(1, (sound.usageCount || 0) / 1000000) // Normalized popularity score
        }))
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
      break;
      
    case 'trending':
      // Sort by growth metrics
      result = mockSounds
        .filter(s => s.id !== soundId)
        .map(sound => ({
          ...sound,
          matchScore: (sound.stats?.usageChange7d || 0) / 100000 // Normalized trend score
        }))
        .sort((a, b) => 
          ((b.stats?.usageChange7d || 0) - (a.stats?.usageChange7d || 0))
        );
      break;
      
    case 'hybrid':
    default:
      // Combine similarity, popularity and trending
      // Higher weight to similarity for more relevant recommendations
      result = mockSounds
        .filter(s => s.id !== soundId)
        .map(sound => {
          const similarityScore = (mockSimilarityMatrix[soundId]?.[sound.id] || 0) * 0.6;
          const popularityScore = Math.min(0.2, (sound.usageCount || 0) / 5000000);
          const trendingScore = Math.min(0.2, (sound.stats?.usageChange7d || 0) / 500000);
          
          return {
            ...sound,
            matchScore: similarityScore + popularityScore + trendingScore
          };
        })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }
  
  // Apply category filter if needed
  if (options.category && result) {
    result = result.filter(sound => 
      sound.soundCategory === options.category || 
      (sound.categories && sound.categories.includes(options.category as string))
    );
  }
  
  return result.slice(0, options.limit);
} 