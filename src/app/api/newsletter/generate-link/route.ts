import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase/firebase'
// import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'; // Keep type if needed
import { v4 as uuidv4 } from 'uuid'

const ROUTE_DISABLED_MSG = "generate-link route: Firebase backend is removed. Link generation will be mocked and not persist.";

/**
 * API Route to generate unique template links for newsletter emails
 * POST /api/newsletter/generate-link
 * 
 * Required body:
 * - templateId: string - The ID of the template to link to
 * - description: string - Description of the link's purpose
 * - campaignId: string - Optional ID of the newsletter campaign
 * 
 * Returns:
 * - linkId: string - The unique ID for the link
 * - url: string - The full URL that can be included in newsletters
 */

// Ensure db is properly typed
// const firestore: Firestore = db as Firestore;

export async function POST(request: Request) {
  try {
    console.warn(ROUTE_DISABLED_MSG);
    // Parse request body
    const body = await request.json()
    const { templateId, campaignId, description } = body
    
    // Validate required fields
    if (!templateId) {
      return NextResponse.json({
        error: 'Missing required field: templateId'
      }, { status: 400 })
    }
    
    // Make description mandatory
    if (!description) {
      return NextResponse.json({
        error: 'Missing required field: description'
      }, { status: 400 })
    }
    
    // Generate a unique ID for this link
    const linkId = uuidv4()
    
    // Store link in database (if Firebase is available) - THIS IS NOW DISABLED
    // try {
      // if (firestore) { // firestore (db) will be null
        // await addDoc(collection(firestore, 'newsletterLinks'), {
        //   linkId,
        //   templateId,
        //   campaignId: campaignId || null,
        //   description: description,
        //   clicks: 0,
        //   createdAt: serverTimestamp(), // serverTimestamp would also fail
        //   updatedAt: serverTimestamp()
        // })
      // }
    // } catch (error) {
    //   console.error('Failed to store newsletter link in database:', error)
    //   // Continue even if database storage fails
    // }
    
    // Generate the URL that will be included in the newsletter
    // This URL includes the linkId and will redirect to the editor with the correct template
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const url = `${baseUrl}/api/newsletter/redirect/${linkId}`
    
    return NextResponse.json({
      success: true,
      linkId,
      templateId,
      url
    })
  } catch (error) {
    console.error('Error generating newsletter link:', error)
    return NextResponse.json({
      error: 'Failed to generate newsletter link'
    }, { status: 500 })
  }
} 