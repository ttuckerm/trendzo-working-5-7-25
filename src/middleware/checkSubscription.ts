import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscriptionTier } from '@/lib/utils/subscriptionUtils';
import type { SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

export interface SubscriptionCheckOptions {
  requiredTier?: SubscriptionTier;
  allowDemoData?: boolean;
}

/**
 * Middleware function that checks if the user has the required subscription tier
 * @param request - Next.js request object
 * @param options - Configuration options for the subscription check
 * @returns NextResponse or undefined (allowing the request to proceed)
 */
export async function checkSubscriptionAccess(
  request: NextRequest,
  options: SubscriptionCheckOptions = {}
) {
  const {
    requiredTier = 'premium',
    allowDemoData = true
  } = options;

  try {
    // Get user subscription tier from the request
    const userTier = await getUserSubscriptionTier(request);
    
    // Check if user has access to the required tier
    const hasAccess = canAccessTier(userTier, requiredTier);
    
    if (hasAccess) {
      // User has access, allow the request to proceed
      return undefined;
    }
    
    // Check if demo data is allowed and if the demo param is present
    if (allowDemoData && request.nextUrl.searchParams.has('demo')) {
      // Mark the request as demo request by setting a header
      // This can be checked in the API route to return demo data
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-demo-data', 'true');
      
      // Forward the request with the demo header
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    
    // User doesn't have access and no demo data requested
    // Return a 403 Forbidden response with upgrade information
    return NextResponse.json(
      {
        error: `${capitalizeFirstLetter(requiredTier)} tier required`,
        currentTier: userTier,
        requiredTier,
        upgradeUrl: '/pricing',
        message: `This feature requires a ${requiredTier} subscription. Please upgrade to access it.`
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error checking subscription access:', error);
    
    // If there's an error determining subscription, fail open for demo data
    if (allowDemoData && request.nextUrl.searchParams.has('demo')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-demo-data', 'true');
      
      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    }
    
    // Otherwise, return an error
    return NextResponse.json(
      { 
        error: 'Error checking subscription status',
        message: 'We encountered an error while checking your subscription. Please try again later.'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if a user's subscription tier can access the required tier
 */
function canAccessTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  if (process.env.NODE_ENV === 'development') {
    // In development, always grant access
    return true;
  }
  
  switch (requiredTier) {
    case 'free':
      return true;
    case 'premium':
      return userTier === 'premium' || userTier === 'business';
    case 'business':
      return userTier === 'business';
    default:
      return false;
  }
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 