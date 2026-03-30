/**
 * API route to create a newsletter template link
 * GET /api/newsletter/create-test-link
 * 
 * This API creates a newsletter link for a selected template that:
 * - Generates a unique tracking ID
 * - Creates a trackable, shareable link
 * - Properly integrates with the template library and editor
 * - Supports premium user access journeys
 * 
 * Example usage:
 * /api/newsletter/create-test-link?template=dance-challenge
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Mapping of template IDs to display names for more context in analytics
const TEMPLATE_NAMES = {
  'dance-challenge': 'Viral Dance Challenge',
  'product-review': 'ASMR Product Review',
  'cooking-hack': 'Cooking Hack Tutorial',
  'story-time': 'Engaging Story Time'
};

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get('template') || 'dance-challenge';
    const campaignId = searchParams.get('campaign') || 'weekly';
    
    // Generate a unique ID for analytics tracking
    const linkId = uuidv4().substring(0, 8);
    
    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    // Set up analytics parameters
    const utmSource = 'newsletter';
    const utmMedium = 'email';
    const utmCampaign = campaignId;
    
    // Create the redirect URL with proper tracking parameters
    const url = `${baseUrl}/api/newsletter/test-redirect?template=${templateId}&linkId=${linkId}&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}`;
    
    // Get template name for display and analytics
    const templateName = TEMPLATE_NAMES[templateId as keyof typeof TEMPLATE_NAMES] || templateId;
    
    // Log the link creation for troubleshooting
    console.log(`Creating newsletter link for template "${templateName}" (${templateId}) with ID ${linkId}`);
    console.log(`Generated URL: ${url}`);
    
    // Return comprehensive data for integration with admin dashboard
    return NextResponse.json({
      success: true,
      linkId,
      templateId,
      templateName,
      url,
      analytics: {
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign
      },
      created: new Date().toISOString(),
      message: 'Newsletter link created successfully'
    });
  } catch (error) {
    console.error('Error creating newsletter link:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create newsletter link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 