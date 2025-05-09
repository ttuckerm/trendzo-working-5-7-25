import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { soundLibraryService } from '@/lib/services/soundLibraryService';
import { SaveSoundRequest, UpdateSavedSoundRequest } from '@/lib/types/sound';

/**
 * GET /api/sounds/library
 * Retrieves user's saved sounds with optional filters
 * 
 * Query parameters:
 * @param limit - Number of sounds to return (default: 20)
 * @param lastVisible - Last sound ID for pagination
 * @param categoryId - Filter by category ID
 * @param favorite - Filter favorites only (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const lastVisible = searchParams.get('lastVisible');
    const categoryId = searchParams.get('categoryId');
    
    // Parse limit
    let pageSize = 20;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        pageSize = Math.min(parsedLimit, 100); // Cap at 100
      }
    }
    
    // Parse favorite filter
    let isFavorite: boolean | undefined = undefined;
    const favoriteParam = searchParams.get('favorite');
    if (favoriteParam !== null) {
      isFavorite = favoriteParam === 'true';
    }
    
    // Fetch saved sounds
    const result = await soundLibraryService.getSavedSounds(
      userId,
      pageSize,
      lastVisible || null,
      {
        categoryId: categoryId || undefined,
        isFavorite
      }
    );
    
    return NextResponse.json({
      success: true,
      data: result.savedSounds,
      pagination: {
        lastVisible: result.lastVisible,
        hasMore: result.hasMore
      }
    });
  } catch (error: any) {
    console.error('Error fetching saved sounds:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred fetching saved sounds' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sounds/library
 * Saves a sound to the user's library
 * 
 * Request body:
 * @param soundId - ID of the sound to save
 * @param isFavorite - Whether to mark as favorite
 * @param customCategories - Custom categories to assign
 * @param notes - Optional notes about the sound
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    const { soundId, isFavorite, customCategories, notes } = body as SaveSoundRequest;
    
    // Validate required fields
    if (!soundId) {
      return NextResponse.json(
        { success: false, error: 'Sound ID is required' },
        { status: 400 }
      );
    }
    
    // Save the sound
    const savedSound = await soundLibraryService.saveSound(userId, {
      soundId,
      isFavorite,
      customCategories,
      notes
    });
    
    return NextResponse.json({
      success: true,
      data: savedSound
    });
  } catch (error: any) {
    console.error('Error saving sound:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred saving the sound' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sounds/library
 * Updates a saved sound in the user's library
 * 
 * Request body:
 * @param savedSoundId - ID of the saved sound to update
 * @param isFavorite - Whether to mark as favorite
 * @param customCategories - Custom categories to assign
 * @param notes - Optional notes about the sound
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    const { savedSoundId, isFavorite, customCategories, notes } = body as UpdateSavedSoundRequest;
    
    // Validate required fields
    if (!savedSoundId) {
      return NextResponse.json(
        { success: false, error: 'Saved sound ID is required' },
        { status: 400 }
      );
    }
    
    // Update the saved sound
    const updatedSound = await soundLibraryService.updateSavedSound(userId, {
      savedSoundId,
      isFavorite,
      customCategories,
      notes
    });
    
    return NextResponse.json({
      success: true,
      data: updatedSound
    });
  } catch (error: any) {
    console.error('Error updating saved sound:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred updating the saved sound' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sounds/library
 * Removes a sound from the user's library
 * 
 * Query parameters:
 * @param id - ID of the saved sound to remove
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the saved sound ID
    const { searchParams } = new URL(request.url);
    const savedSoundId = searchParams.get('id');
    
    if (!savedSoundId) {
      return NextResponse.json(
        { success: false, error: 'Saved sound ID is required' },
        { status: 400 }
      );
    }
    
    // Remove the saved sound
    await soundLibraryService.removeSavedSound(userId, savedSoundId);
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error removing saved sound:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred removing the saved sound' },
      { status: 500 }
    );
  }
} 