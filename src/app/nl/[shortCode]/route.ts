import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
// import { db } from '@/lib/firebase/firebase';
// import { collection, query, where, getDocs, getDoc, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { NewsletterRedirectResult, NewsletterClickEvent } from '@/lib/types/newsletter';
import type { Session } from 'next-auth';

const ROUTE_DISABLED_MSG_PREFIX = "NewsletterRedirectRoute /nl/[shortCode]: Firebase backend is removed.";

// Collection names in Firestore
// const LINKS_COLLECTION = 'newsletterLinks';
// const CLICKS_COLLECTION = 'newsletterClicks';

/**
 * Handler for newsletter link redirects
 * 
 * This handles redirecting users who click on newsletter links
 * to the editor with the correct template loaded
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    // Get the short code from the URL
    const { shortCode } = params;
    
    if (!shortCode) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Get session information if available
    const session = await auth() as Session | null;
    const isAuthenticated = !!(session && session.user);
    
    console.warn(`${ROUTE_DISABLED_MSG_PREFIX} Firestore link lookup for shortCode '${shortCode}' skipped. Redirecting to a mock editor page or homepage.`);
    // // Look up the link in Firestore
    // const linksRef = collection(db, LINKS_COLLECTION);
    // const q = query(linksRef, where('shortCode', '==', shortCode));
    // const querySnapshot = await getDocs(q);
    
    // // Check if link exists
    // if (querySnapshot.empty) {
    //   console.log(`No link found for short code: ${shortCode}`);
    //   return NextResponse.redirect(new URL('/', request.url));
    // }
    
    // // Get the link data
    // const linkDoc = querySnapshot.docs[0];
    // const linkData = linkDoc.data();
    // const linkId = linkDoc.id;

    // Mock link data for redirection logic
    const mockLinkId = `mock-link-for-${shortCode}`;
    const mockLinkData = {
        templateId: 'mock-template-id',
        // Add any other fields from linkData that are used below for redirection, e.g., UTMs, editorContext
        utm_source: 'mock_source',
        editorContext: { mockKey: 'mockValue' },
        // expiresAt: null, // or a future date if expiry logic is tested
    };
    
    // // Check if link has expired
    // if (linkData.expiresAt && new Date(linkData.expiresAt) < new Date()) {
    //   console.log(`Link expired: ${linkId}`);
    //   return NextResponse.redirect(new URL('/link-expired', request.url));
    // }
    
    // Record the click
    await trackClick(mockLinkId, request, (session && session.user && session.user.email ? session.user.email : undefined), isAuthenticated);
    
    // // Update click count
    // await updateDoc(doc(db, LINKS_COLLECTION, linkId), {
    //   clicks: increment(1),
    //   lastClicked: new Date().toISOString()
    // });
    console.warn(`${ROUTE_DISABLED_MSG_PREFIX} Click count update skipped for linkId '${mockLinkId}'.`);
    
    // Determine redirect URL
    let redirectUrl = '/editor';
    
    // Add template ID to redirect URL
    redirectUrl += `?template=${mockLinkData.templateId}`;
    
    // Add UTM parameters if they exist
    if (mockLinkData.utm_source) redirectUrl += `&utm_source=${mockLinkData.utm_source}`;
    // if (mockLinkData.utm_medium) redirectUrl += `&utm_medium=${mockLinkData.utm_medium}`;
    // if (mockLinkData.utm_campaign) redirectUrl += `&utm_campaign=${mockLinkData.utm_campaign}`;
    // if (mockLinkData.utm_term) redirectUrl += `&utm_term=${mockLinkData.utm_term}`;
    // if (mockLinkData.utm_content) redirectUrl += `&utm_content=${mockLinkData.utm_content}`;
    
    // Add link ID for tracking
    redirectUrl += `&nl_link=${mockLinkId}`;
    
    // Add editor context encoded as a JSON string
    if (mockLinkData.editorContext) {
      const encodedContext = encodeURIComponent(JSON.stringify(mockLinkData.editorContext));
      redirectUrl += `&context=${encodedContext}`;
    }
    
    // Check if user needs to be authenticated
    if (!isAuthenticated) {
      // Save the intended URL to redirect after authentication
      redirectUrl = `/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`;
    }
    
    return NextResponse.redirect(new URL(redirectUrl, request.url));
    
  } catch (error) {
    console.error('Error processing newsletter link:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}

/**
 * Track a click on a newsletter link
 */
async function trackClick(
  linkId: string,
  request: NextRequest,
  userEmail?: string,
  isAuthenticated: boolean = false
): Promise<void> {
  console.warn(`${ROUTE_DISABLED_MSG_PREFIX} trackClick called for linkId '${linkId}'. Firestore operation skipped.`);
  // try {
  //   // Create click event for analytics
  //   const clickEvent: NewsletterClickEvent = {
  //     id: crypto.randomUUID(),
  //     linkId,
  //     userId: userEmail,
  //     timestamp: new Date().toISOString(),
  //     userAgent: request.headers.get('user-agent') || undefined,
  //     referrer: request.headers.get('referer') || undefined,
  //     converted: false
  //   };
    
  //   // Store the click event
  //   await addDoc(collection(db, CLICKS_COLLECTION), clickEvent);
    
  // } catch (error) {
  //   console.error('Error tracking newsletter link click:', error);
  //   // Don't throw, just log the error to avoid disrupting the redirect
  // }
  return Promise.resolve();
} 