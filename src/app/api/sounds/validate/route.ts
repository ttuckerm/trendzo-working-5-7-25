import { NextRequest, NextResponse } from 'next/server';
import { TikTokSound } from '@/lib/types/tiktok';
import { validateSoundData } from '@/lib/utils/soundValidation';
import { auth } from '@/lib/auth';

/**
 * POST /api/sounds/validate
 * Validates sound data before storing in the database
 * 
 * Request body:
 * @param sound - The sound data to validate
 * 
 * Returns:
 * @param valid - Whether the sound data is valid
 * @param issues - Array of validation issues if not valid
 * @param enhancedData - Enhanced sound data with missing fields filled in if possible
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    
    // In development mode, allow access even without authentication
    if (!session && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get sound data from request body
    const body = await request.json();
    const soundData = body.sound as TikTokSound;
    
    if (!soundData) {
      return NextResponse.json(
        { error: 'Sound data is required' },
        { status: 400 }
      );
    }
    
    // Validate sound data
    const validationResult = validateSoundData(soundData);
    
    // If data is valid, include enhanced data with automatic improvements
    let enhancedData = undefined;
    if (validationResult.valid && validationResult.suggestions) {
      enhancedData = {
        ...soundData,
        ...validationResult.suggestions
      };
    }
    
    return NextResponse.json({
      valid: validationResult.valid,
      issues: validationResult.issues || [],
      enhancedData: enhancedData
    });
  } catch (error: any) {
    console.error('Error validating sound data:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred validating sound data' },
      { status: 500 }
    );
  }
} 