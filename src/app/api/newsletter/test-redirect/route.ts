/**
 * Test API route for newsletter link redirection
 * GET /api/newsletter/test-redirect
 * 
 * This API simulates the newsletter redirect functionality
 * without needing an actual link in the database.
 * 
 * The route respects the user's access level:
 * - Non-authenticated users: View template in template library
 * - Authenticated users with access: Go directly to editor with template preloaded
 * 
 * Example usage:
 * /api/newsletter/test-redirect?template=dance-challenge
 * /api/newsletter/test-redirect?template=dance-challenge&to_editor=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { trackNewsletterClick, trackTemplateView, trackNewsletterAnalytics } from '@/lib/analytics/newsletterAnalytics';

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template') || 'dance-challenge';
    const linkId = searchParams.get('linkId') || 'test123';
    const utmSource = searchParams.get('utm_source') || 'newsletter';
    const utmMedium = searchParams.get('utm_medium') || 'email';
    const utmCampaign = searchParams.get('utm_campaign') || 'weekly';
    
    console.log(`Processing newsletter link for template: ${templateId} with linkId: ${linkId}`);
    
    // Check if the user is logged in
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    // Get user data from cookie if available
    let userData = null;
    if (userCookie) {
      try {
        userData = JSON.parse(userCookie.value);
        console.log(`User authenticated: ${userData.uid}`);
      } catch (error) {
        console.error('Error parsing user cookie:', error);
      }
    }
    
    // Track analytics for the click
    await trackNewsletterClick(linkId, userData, utmSource, utmCampaign);
    console.log(`Newsletter link click recorded for linkId: ${linkId}, template: ${templateId}`);
    
    // Determine the redirect based on user status and access level
    // - Default path is to the template preview in the template library
    let redirectUrl = `/template-library/${templateId}?source=newsletter&linkId=${linkId}`;
    
    // Check if we should force editor mode (for premium journey testing)
    const forceEditorMode = searchParams.get('to_editor') === 'true' || 
                           process.env.NEXT_PUBLIC_FORCE_EDITOR === 'true';
    
    const hasSubscription = userData?.subscriptionTier && 
      ['starter', 'pro', 'business', 'premium'].includes(userData.subscriptionTier);
    
    // If user is authenticated and has appropriate access OR we're forcing editor mode for testing
    // Direct them to the editor with the template preloaded
    if ((userData?.uid && hasSubscription) || forceEditorMode) {
      redirectUrl = `/editor?id=${templateId}&source=newsletter&linkId=${linkId}`;
      console.log(`Premium user journey: Redirecting to editor: ${redirectUrl}`);
      
      // Track template view as an edit action
      await trackTemplateView(templateId, linkId, userData);
      await trackNewsletterAnalytics(templateId, 'edit', linkId);
    } else {
      console.log(`Standard user journey: Redirecting to template preview: ${redirectUrl}`);
      
      // Track template view as a view action
      await trackTemplateView(templateId, linkId, userData);
      await trackNewsletterAnalytics(templateId, 'view', linkId);
    }
    
    // Add analytics parameters to the redirect URL
    redirectUrl += `&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    
    // Optional delay for testing loading states
    const delay = searchParams.get('delay');
    if (delay) {
      const delayMs = parseInt(delay, 10);
      if (!isNaN(delayMs) && delayMs > 0 && delayMs < 10000) {
        console.log(`Delaying redirect by ${delayMs}ms for demo purposes`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`Final redirect URL: ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in newsletter redirect:', error);
    // If there's an error, redirect to the homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
} 