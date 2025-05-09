import { NextResponse } from 'next/server';

/**
 * Test API endpoint for audio button functionality
 * This endpoint returns a mock sound to test with the audio button
 */
export async function GET() {
  console.log('Test audio button API called');
  
  // Return a mock sound for testing
  return NextResponse.json({
    success: true,
    sound: {
      id: 'test-sound-1',
      title: 'Test Sound',
      authorName: 'Test Artist',
      playUrl: 'https://cdn.freesound.org/previews/459/459659_7677567-lq.mp3', // Sample audio from freesound.org
      duration: 20,
      coverMedium: 'https://placehold.co/400x400/673ab7/ffffff?text=Test+Sound',
      original: true,
      isRemix: false,
      usageCount: 100,
      creationDate: Date.now(),
      stats: {
        usageCount: 100,
        usageChange7d: 10,
        usageChange14d: 20,
        usageChange30d: 30,
        trend: 'rising',
      }
    }
  });
} 