import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
// import { db } from '@/lib/firebase/firebase';
// import { collection, doc, setDoc } from 'firebase/firestore';
import { CreateNewsletterLinkParams, NewsletterTemplateLink } from '@/lib/types/newsletter';

const ROUTE_DISABLED_MSG = "generate-template-link route: Firebase backend is removed. Link generation will be mocked and not persist.";

// Collection name in Firestore
const LINKS_COLLECTION = 'newsletterLinks';

// Base URL for newsletter links
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Generate a random short code for newsletter links
 */
function generateShortCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * API endpoint for generating newsletter template links
 * 
 * This endpoint creates unique, trackable links for newsletters
 * that direct users to the editor with a template pre-loaded.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json() as CreateNewsletterLinkParams;
    
    // Validate required fields
    if (!body.templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Generate a unique ID and short code
    const id = uuidv4();
    const token = uuidv4();
    const shortCode = generateShortCode();
    
    // Create the newsletter link object
    const newsletterLink: NewsletterTemplateLink = {
      id,
      templateId: body.templateId,
      title: body.title,
      description: body.description || '',
      createdAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
      createdBy: session?.user?.email || 'unknown',
      token,
      shortCode,
      fullUrl: `${BASE_URL}/nl/${shortCode}`,
      clicks: 0,
      conversions: 0,
      
      // UTM parameters
      utm_source: body.utm_source || 'newsletter',
      utm_medium: body.utm_medium || 'email',
      utm_campaign: body.utm_campaign,
      utm_term: body.utm_term,
      utm_content: body.utm_content,
      
      // Editor context
      editorContext: body.editorContext || {},
      
      // Newsletter usage
      usedInNewsletter: false,
      
      // Expert attribution
      expertCreated: body.expertCreated || false,
      expertId: body.expertId,
      expertNote: body.expertNote
    };
    
    // Save to Firestore
    // await setDoc(doc(db, LINKS_COLLECTION, id), newsletterLink);
    console.warn(ROUTE_DISABLED_MSG);
    
    return NextResponse.json({
      success: true,
      linkId: id,
      shortCode,
      fullUrl: newsletterLink.fullUrl,
      // For debugging, include the mock link data
      // In a real scenario, you might not want to return the full object if it's large
      mockLinkData: newsletterLink 
    });
    
  } catch (error) {
    console.error('Error generating newsletter link:', error);
    return NextResponse.json(
      { error: 'Failed to generate newsletter link' },
      { status: 500 }
    );
  }
} 