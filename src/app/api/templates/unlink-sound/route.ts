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
          message: 'Sound unlinked from template successfully'
        });
      }
      
      // For production, we need to implement this function in soundService
      // This function doesn't exist yet in the service, so we'd need to add it
      // await soundService.unlinkSoundFromTemplate(soundId, templateId);
      
      // As a workaround, let's use the existing firebase utils
      const firestore = await import('@/lib/firebase/firebaseUtils');
      const { getFirestore, doc, getDoc, updateDoc } = await import('firebase/firestore');
      
      const db = getFirestore();
      const soundRef = doc(db, 'sounds', soundId);
      const soundDoc = await getDoc(soundRef);
      
      if (soundDoc.exists()) {
        const soundData = soundDoc.data();
        const relatedTemplates = soundData.relatedTemplates || [];
        
        // Remove templateId from relatedTemplates array
        const updatedTemplates = relatedTemplates.filter(
          (id: string) => id !== templateId
        );
        
        await updateDoc(soundRef, {
          relatedTemplates: updatedTemplates,
          updatedAt: new Date()
        });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Sound unlinked from template successfully'
      });
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