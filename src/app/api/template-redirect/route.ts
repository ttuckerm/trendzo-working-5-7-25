import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  setDoc,
  Firestore 
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

/**
 * Template redirect handler for newsletter links
 * Handles click tracking, authentication checks, and proper redirection
 */
export async function GET(request: NextRequest) {
  try {
    // Extract template ID and campaign parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('id');
    const source = searchParams.get('source');
    const campaign = searchParams.get('campaign');
    
    console.log('Template redirect request:', { templateId, source, campaign });
    
    // Validate required parameters
    if (!templateId) {
      console.error('Missing template ID in redirect request');
      return NextResponse.redirect(new URL('/templates', request.url));
    }
    
    // Verify template exists in database (optional but recommended)
    let templateExists = true;
    const firestore = db as Firestore | null;
    if (firestore) {
      try {
        const templateRef = doc(firestore, 'templates', templateId);
        const templateDoc = await getDoc(templateRef);
        
        if (!templateDoc.exists()) {
          console.error(`Template with ID ${templateId} not found`);
          templateExists = false;
        }
      } catch (error) {
        // Log error but continue with redirect (fail gracefully)
        console.error('Error verifying template existence:', error);
      }
    }
    
    // If template doesn't exist, redirect to templates page with error
    if (!templateExists) {
      return NextResponse.redirect(new URL('/templates?error=template-not-found', request.url));
    }
    
    // Track click analytics
    await trackClick({
      templateId,
      source: source || 'unknown',
      campaign: campaign || 'none',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referrer: request.headers.get('referer') || 'direct',
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    });
    
    // Store the referral information in cookies (max age 24 hours)
    cookies().set('newsletter_source', source || 'unknown', { maxAge: 86400 });
    if (campaign) {
      cookies().set('newsletter_campaign', campaign, { maxAge: 86400 });
    }
    
    // Store the template ID to restore after authentication
    cookies().set('pending_template_id', templateId, { maxAge: 86400 });
    
    // Extract the base URL from the current request to ensure we stay in the same app
    const baseUrl = new URL('/', request.url).toString();
    
    // Check if there's an auth token in cookies to determine if user is authenticated
    // This is a simple check - the actual auth state is managed by Firebase in the client
    const authCookie = cookies().get('auth_token');
    const isAuthenticated = !!authCookie?.value;
    
    // Redirect based on authentication status
    if (isAuthenticated) {
      // Redirect authenticated users to the editor with the template
      const editorUrl = new URL(`/editor`, request.url);
      editorUrl.searchParams.append('id', templateId);
      editorUrl.searchParams.append('source', source || 'newsletter');
      editorUrl.searchParams.append('campaign', campaign || 'none');
      
      console.log('Redirecting authenticated user to:', editorUrl.toString());
      return NextResponse.redirect(editorUrl);
    } else {
      // Redirect non-authenticated users to the template preview page
      const previewUrl = new URL(`/template-preview`, request.url);
      previewUrl.searchParams.append('id', templateId);
      previewUrl.searchParams.append('source', source || 'newsletter');
      previewUrl.searchParams.append('campaign', campaign || 'none');
      
      console.log('Redirecting non-authenticated user to:', previewUrl.toString());
      return NextResponse.redirect(previewUrl);
    }
  } catch (error) {
    // Handle any unexpected errors
    console.error('Error in template redirect:', error);
    return NextResponse.redirect(new URL('/?error=redirect-failed', request.url));
  }
}

/**
 * Tracks click events for analytics
 */
async function trackClick(data: {
  templateId: string;
  source: string;
  campaign: string;
  userAgent: string;
  referrer: string;
  ip: string;
}) {
  const firestore = db as Firestore | null;
  if (!firestore) return;
  
  try {
    // Create unique ID for this analytics entry
    const analyticsId = `${Date.now()}-${data.templateId}`;
    
    // Log click to template analytics
    const analyticsRef = doc(firestore, 'template_analytics', analyticsId);
    
    // Add analytics data using setDoc instead of updateDoc (which requires the doc to exist first)
    await setDoc(analyticsRef, {
      templateId: data.templateId,
      source: data.source,
      campaign: data.campaign,
      action: 'click',
      timestamp: serverTimestamp(),
      metadata: {
        userAgent: data.userAgent,
        referrer: data.referrer,
        ip: data.ip
      }
    });
    
    // Increment template click counter if this is a newsletter
    if (data.source === 'newsletter') {
      const templateRef = doc(firestore, 'templates', data.templateId);
      try {
        await updateDoc(templateRef, {
          newsletterClicks: increment(1),
          lastNewsletterClick: serverTimestamp()
        });
      } catch (error) {
        // If updating fails (e.g. field doesn't exist), try setting with initial values
        console.log('Error incrementing newsletter clicks, attempting to set initial value');
        await updateDoc(templateRef, {
          newsletterClicks: 1,
          lastNewsletterClick: serverTimestamp()
        });
      }
      
      // If there's a campaign, track campaign-specific analytics
      if (data.campaign && data.campaign !== 'none') {
        const campaignRef = doc(firestore, 'newsletter_campaigns', data.campaign);
        try {
          // Try to update first
          await updateDoc(campaignRef, {
            clicks: increment(1),
            lastClick: serverTimestamp()
          });
        } catch (error) {
          // If campaign doc doesn't exist yet, create it
          await setDoc(campaignRef, {
            name: data.campaign,
            clicks: 1,
            views: 0,
            edits: 0,
            saves: 0,
            lastClick: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }
      }
    }
    
    console.log('Successfully tracked click for template:', data.templateId);
  } catch (error) {
    // Log error but don't fail the redirect
    console.error('Error tracking click:', error);
  }
} 