import { NextRequest, NextResponse } from 'next/server';

/**
 * Super simple test redirect API
 * This doesn't use Firestore or any other complex dependencies
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template') || 'dance-challenge';
    const toPremium = searchParams.get('to_editor') === 'true';
    
    console.log(`Simple test redirect for template: ${templateId}, premium mode: ${toPremium}`);
    
    // Determine the redirect based on the premium flag
    let redirectUrl = toPremium
      ? `/editor?id=${templateId}&source=test`
      : `/template-library/${templateId}?source=test`;
    
    // Add analytics parameters
    const utmSource = searchParams.get('utm_source') || 'test';
    const utmMedium = searchParams.get('utm_medium') || 'email';
    const utmCampaign = searchParams.get('utm_campaign') || 'test';
    redirectUrl += `&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    
    console.log(`Redirecting to: ${redirectUrl}`);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Error in simple test redirect:', error);
    // If there's an error, redirect to the homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
} 