import { NextRequest, NextResponse } from 'next/server';
import { soundService } from '@/lib/services/soundService';

export async function POST(request: NextRequest) {
  try {
    // Check authentication (middleware should handle this, but good to add)
    // Replace this with your actual auth check if different
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json({ 
    //     success: false, 
    //     error: 'Unauthorized' 
    //   }, { status: 401 });
    // }

    // Parse request body
    const body = await request.json();
    const { templateId, soundId } = body;

    // Validate request
    if (!templateId || !soundId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: templateId and soundId'
      }, { status: 400 });
    }

    // Unlink sound from template
    try {
      // For development without Firebase, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Unlinked sound ${soundId} from template ${templateId}`);
        
        // Add artificial delay to simulate network call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return NextResponse.json({ 
          success: true,
          message: 'Sound unlinked from template successfully (DEV mode)'
        });
      }
      
      // PRODUCTION PATH: Firebase code was here. Now disabled/to be refactored for Supabase.
      // Removed: const firestoreModule = await import('@/lib/firebase/firebaseUtils'); // This was unused
      // Removed: const { getFirestore, doc, getDoc, updateDoc } = await import('firebase/firestore');
      // Removed: Firebase direct SDK calls for unlinking sound.

      console.warn("unlink-sound API: Firebase interaction has been removed. Needs Supabase implementation if feature is required.");
      
      return NextResponse.json({
        success: false,
        error: 'Sound unlinking functionality is pending migration to Supabase.'
      }, { status: 501 }); // 501 Not Implemented

    } catch (error) {
      console.error('Error unlinking sound from template:', error);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to unlink sound from template'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
} 