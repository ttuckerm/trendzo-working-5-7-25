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

    // Link sound to template using the soundService
    try {
      // For development without Firebase, simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Linked sound ${soundId} to template ${templateId}`);
        
        // Add artificial delay to simulate network call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        return NextResponse.json({ 
          success: true,
          message: 'Sound linked to template successfully'
        });
      }
      
      // For production, use the real service
      await soundService.linkSoundToTemplate(soundId, templateId);
      
      return NextResponse.json({ 
        success: true,
        message: 'Sound linked to template successfully'
      });
    } catch (error) {
      console.error('Error linking sound to template:', error);
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to link sound to template'
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