import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { auth } from '@/lib/auth';
import { soundLibraryService } from '@/lib/services/soundLibraryService';
import { CreateCategoryRequest, UpdateCategoryRequest } from '@/lib/types/sound';

// Define interface for categories response
interface CategoriesResponse {
  soundCategories: string[];
  genres: string[];
  moods: string[];
  tempos: string[];
  stats?: {
    totalSounds: number;
    categoryDistribution: Record<string, number>;
  };
}

// Mock categories for development
const MOCK_CATEGORIES: CategoriesResponse = {
  soundCategories: [
    'music',
    'voiceover',
    'soundEffect',
    'remix',
    'original',
    'ambient',
    'viral'
  ],
  genres: [
    'pop',
    'hip hop',
    'electronic',
    'rock',
    'ambient',
    'lofi',
    'cinematic',
    'instrumental'
  ],
  moods: [
    'happy',
    'sad',
    'energetic',
    'calm',
    'romantic',
    'dramatic',
    'inspirational',
    'focused',
    'relaxed',
    'uplifting'
  ],
  tempos: [
    'slow',
    'medium',
    'fast'
  ]
};

// Stats to add when requested
const MOCK_STATS = {
  totalSounds: 500,
  categoryDistribution: {
    music: 250,
    voiceover: 75,
    soundEffect: 100,
    remix: 50,
    original: 25
  }
};

/**
 * GET /api/sounds/categories
 * Returns available sound categories, genres, moods, and tempos
 * 
 * Query parameters:
 * @param includeStats - Whether to include usage statistics (default: false)
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
    const includeStats = searchParams.get('includeStats') === 'true';
    const isDemoMode = searchParams.get('demo') === 'true';
    
    // If in development mode or demo mode, return mock categories
    if (process.env.NODE_ENV === 'development' || isDemoMode || !db) {
      console.log('Using mock categories data');
      
      let categoriesResponse: CategoriesResponse = { ...MOCK_CATEGORIES };
      
      // Add mock stats if requested
      if (includeStats) {
        categoriesResponse.stats = MOCK_STATS;
      }
      
      return NextResponse.json({
        success: true,
        categories: categoriesResponse
      });
    }
    
    // If Firebase is available, implement the real data retrieval
    // ... (Firebase implementation would go here)
    
    // For now, just return mock data as a fallback
    console.log('Using mock categories as fallback');
    return NextResponse.json({
      success: true,
      categories: MOCK_CATEGORIES
    });
  } catch (error: any) {
    console.error('Error fetching sound categories:', error);
    
    // Return mock data on error in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        categories: MOCK_CATEGORIES
      });
    }
    
    return NextResponse.json(
      { error: error.message || 'An error occurred fetching sound categories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sounds/categories
 * Creates a new sound category
 * 
 * Request body:
 * @param name - Name of the category (required)
 * @param description - Optional description
 * @param color - Optional color (hex code)
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
    const { name, description, color } = body as CreateCategoryRequest;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    // Create the category
    const category = await soundLibraryService.createCategory(userId, {
      name,
      description,
      color
    });
    
    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error: any) {
    console.error('Error creating sound category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred creating the sound category' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sounds/categories
 * Updates an existing sound category
 * 
 * Request body:
 * @param categoryId - ID of the category to update (required)
 * @param name - New name for the category
 * @param description - New description
 * @param color - New color (hex code)
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
    const { categoryId, name, description, color } = body as UpdateCategoryRequest;
    
    // Validate required fields
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Update the category
    const updatedCategory = await soundLibraryService.updateCategory(userId, {
      categoryId,
      name,
      description,
      color
    });
    
    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error: any) {
    console.error('Error updating sound category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred updating the sound category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sounds/categories
 * Deletes a sound category
 * 
 * Query parameters:
 * @param id - ID of the category to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get the category ID
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    // Delete the category
    await soundLibraryService.deleteCategory(userId, categoryId);
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting sound category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred deleting the sound category' },
      { status: 500 }
    );
  }
} 