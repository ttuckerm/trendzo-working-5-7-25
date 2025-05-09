/**
 * API route for newsletter link redirection
 * GET /api/newsletter/redirect/[linkId]
 * 
 * This API handles newsletter link clicks:
 * 1. Looks up the linkId in the database
 * 2. Increments the click count for analytics
 * 3. Redirects to the appropriate page based on user status:
 *    - Logged-in users with premium access: Go directly to editor
 *    - All others: Go to template preview page
 */

import { type NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { db as firebaseDb } from '@/lib/firebase/firebase';
import { cookies } from 'next/headers';
import { trackNewsletterClick, trackTemplateView } from '@/lib/analytics/newsletterAnalytics';

// Properly type the database import to avoid linter errors
const firestore = firebaseDb as Firestore | null;

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const { linkId } = params;
    console.log(`Processing newsletter link with ID: ${linkId}`);
    
    if (!linkId) {
      // If no linkId is provided, redirect to the homepage
      console.log('No linkId provided, redirecting to homepage');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    if (!firestore) {
      console.error('Firestore not initialized');
      // Fallback to test redirect for development
      return NextResponse.redirect(new URL(`/api/newsletter/test-redirect?template=dance-challenge`, request.url));
    }
    
    try {
      // Get the newsletter link document from Firestore
      const linkRef = doc(firestore, 'newsletterLinks', linkId);
      const linkDoc = await getDoc(linkRef);
      
      if (!linkDoc.exists()) {
        console.error(`Newsletter link with ID ${linkId} not found`);
        // Try our test redirect as a fallback for testing
        return NextResponse.redirect(new URL(`/api/newsletter/test-redirect?template=dance-challenge`, request.url));
      }
      
      const linkData = linkDoc.data();
      const templateId = linkData.templateId;
      const campaign = linkData.campaignId || 'weekly';
      
      if (!templateId) {
        console.error(`Template ID not found for link ${linkId}`);
        return NextResponse.redirect(new URL('/template-library', request.url));
      }
      
      console.log(`Template ID found: ${templateId}`);
      
      // Check if the user is logged in and has access
      const cookieStore = cookies();
      const userCookie = cookieStore.get('user');
      
      // Parse user data from cookie if available
      let userData = null;
      if (userCookie) {
        try {
          userData = JSON.parse(userCookie.value);
        } catch (error) {
          console.error('Error parsing user cookie:', error);
        }
      }
      
      // Track the click in analytics
      await trackNewsletterClick(linkId, userData);
      
      // Default to template preview page
      // This matches our existing route structure in template-library/[slug]
      let redirectUrl = `/template-library/${templateId}?source=newsletter&linkId=${linkId}`;
      
      // Force editor mode in development for testing
      const forceEditorMode = process.env.NEXT_PUBLIC_FORCE_EDITOR === 'true';
      
      const hasSubscription = userData?.subscriptionTier && 
        ['starter', 'pro', 'business', 'premium'].includes(userData.subscriptionTier);
      
      // If user is logged in and has appropriate access, send directly to editor
      if (userData?.uid && (hasSubscription || forceEditorMode || process.env.NODE_ENV === 'development')) {
        // User has access, redirect to editor
        redirectUrl = `/editor?id=${templateId}&source=newsletter&linkId=${linkId}`;
        console.log(`User has access, redirecting to editor: ${redirectUrl}`);
        
        // Track as an "edit" action
        await trackTemplateView(templateId, linkId, userData);
      } else {
        // For non-premium users, track as a "view" action
        await trackTemplateView(templateId, linkId, userData);
      }
      
      // Add UTM parameters if available in link data
      if (linkData.utmSource || linkData.utm_source) {
        const utmSource = linkData.utmSource || linkData.utm_source || 'newsletter';
        const utmMedium = linkData.utmMedium || linkData.utm_medium || 'email';
        const utmCampaign = linkData.utmCampaign || linkData.utm_campaign || campaign;
        
        // Add UTM parameters for tracking
        redirectUrl += `&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
      }
      
      console.log(`Final redirect URL: ${redirectUrl}`);
      return NextResponse.redirect(new URL(redirectUrl, request.url));
      
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // If there's an issue with Firestore, redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (error) {
    console.error('Error in newsletter redirect:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
} 