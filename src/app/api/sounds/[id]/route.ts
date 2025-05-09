import { NextRequest, NextResponse } from 'next/server';
import { soundService } from '@/lib/services/soundService';
import { handleApiError } from '@/lib/utils/apiHelpers';

/**
 * GET method to retrieve a specific sound by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const soundId = params.id;
    
    // Fetch the sound from Firestore
    const sound = await soundService.getSoundById(soundId);
    
    // If sound doesn't exist, return 404
    if (!sound) {
      return NextResponse.json(
        { error: 'Sound not found' },
        { status: 404 }
      );
    }
    
    // Return sound data
    return NextResponse.json({
      success: true,
      sound: {
        id: sound.id,
        title: sound.title,
        authorName: sound.authorName,
        duration: sound.duration,
        original: sound.original,
        isRemix: sound.isRemix,
        usageCount: sound.usageCount,
        coverLarge: sound.coverLarge,
        coverMedium: sound.coverMedium,
        coverThumb: sound.coverThumb,
        playUrl: sound.playUrl,
        album: sound.album,
        creationDate: sound.creationDate,
        genre: sound.genre,
        stats: sound.stats,
        relatedTemplates: sound.relatedTemplates || [],
        categories: sound.categories || []
      }
    });
    
  } catch (error) {
    return handleApiError(error, 'Error fetching sound details');
  }
} 