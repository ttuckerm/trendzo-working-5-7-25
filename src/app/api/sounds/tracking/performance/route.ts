import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { soundLibraryService } from '@/lib/services/soundLibraryService';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { SoundPerformance } from '@/lib/types/sound';

/**
 * GET /api/sounds/tracking/performance
 * Retrieves performance metrics for user's sounds
 * 
 * Query parameters:
 * @param soundId - Optional sound ID to get metrics for a specific sound
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const db = getFirestore();
    
    // Query the sound-performance collection for this user
    const performanceQuery = query(
      collection(db, 'sound-performance'),
      where('userId', '==', userId)
    );
    
    const performanceSnapshot = await getDocs(performanceQuery);
    
    if (performanceSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        data: [] 
      });
    }
    
    // Extract performance data
    const performanceData: SoundPerformance[] = [];
    performanceSnapshot.forEach(doc => {
      const data = doc.data() as SoundPerformance;
      performanceData.push({
        ...data,
        id: doc.id
      });
    });
    
    return NextResponse.json({ 
      success: true, 
      data: performanceData 
    });
  } catch (error: any) {
    console.error('Error fetching sound performance data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
} 