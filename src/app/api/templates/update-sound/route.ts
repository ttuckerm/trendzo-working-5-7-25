import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { doc, getDoc, updateDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { newsletterSoundService } from '@/lib/services/newsletterSoundService';

/**
 * POST /api/templates/update-sound
 * 
 * Updates a template with a selected sound
 * 
 * Request body:
 * {
 *   templateId: string;      // Required - The ID of the template to update
 *   soundId: string;         // Required - The ID of the sound to apply
 *   fromNewsletter?: boolean; // Optional - Whether the request is from a newsletter
 *   newsletterId?: string;   // Optional - The ID of the newsletter
 *   linkId?: string;         // Optional - The ID of the newsletter link
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const { templateId, soundId, fromNewsletter, newsletterId, linkId } = await request.json();
    
    // Validate required fields
    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId is required' }, 
        { status: 400 }
      );
    }
    
    if (!soundId) {
      return NextResponse.json(
        { error: 'soundId is required' }, 
        { status: 400 }
      );
    }
    
    // Get Firestore instance
    const firestore = getFirestore();
    if (!firestore) {
      return NextResponse.json(
        { error: 'Firestore not initialized' }, 
        { status: 500 }
      );
    }
    
    // Verify template exists and user has access to it
    const templateRef = doc(firestore, 'templates', templateId);
    const templateDoc = await getDoc(templateRef);
    
    if (!templateDoc.exists()) {
      return NextResponse.json(
        { error: `Template with ID ${templateId} not found` }, 
        { status: 404 }
      );
    }
    
    const template = templateDoc.data();
    
    // Check if user has access to this template
    const isOwnedByUser = template.userId === session?.user?.id;
    const isPublicTemplate = template.isPublic === true;
    
    if (!isOwnedByUser && !isPublicTemplate) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this template' }, 
        { status: 403 }
      );
    }
    
    // Verify sound exists
    const soundRef = doc(firestore, 'sounds', soundId);
    const soundDoc = await getDoc(soundRef);
    
    if (!soundDoc.exists()) {
      return NextResponse.json(
        { error: `Sound with ID ${soundId} not found` }, 
        { status: 404 }
      );
    }
    
    const sound = soundDoc.data();
    
    // Update the template with the sound
    await updateDoc(templateRef, {
      soundId,
      soundTitle: sound.title,
      soundAuthor: sound.authorName,
      soundCategory: sound.soundCategory,
      soundUrl: sound.playUrl || '',
      updatedAt: serverTimestamp(),
      lastModifiedBy: session?.user?.id,
      fromNewsletter: fromNewsletter || false,
      newsletterId: newsletterId || null
    });
    
    // Track the selection in analytics if from newsletter
    if (fromNewsletter && linkId) {
      await newsletterSoundService.trackSoundSelection(linkId, soundId, session?.user?.id);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Template updated with sound successfully',
      templateId,
      soundId,
      fromNewsletter: !!fromNewsletter
    });
  } catch (error: any) {
    console.error('Error updating template with sound:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred updating the template with the sound' },
      { status: 500 }
    );
  }
} 