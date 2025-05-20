import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { collection, query, where, getDocs } from 'firebase/firestore'; // Firebase SDK
import type { SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

const UTILS_DISABLED_MSG = "subscriptionUtils: Firebase backend for subscription lookup is disabled. TODO: Reimplement with Supabase.";

/**
 * Get the current user's subscription tier from the request
 * This combines checking authentication and retrieving subscription information
 * 
 * @param request - The Next.js request object
 * @returns The user's subscription tier
 */
export async function getUserSubscriptionTier(request: NextRequest): Promise<SubscriptionTier> {
  // For development environment
  if (process.env.NODE_ENV === 'development') {
    // Check if there is a mock subscription header for testing
    const mockTier = request.headers.get('x-mock-subscription-tier');
    if (mockTier && ['free', 'premium', 'business'].includes(mockTier as string)) {
      return mockTier as SubscriptionTier;
    }
    
    // Default to business tier in development for easier testing
    return 'business';
  }
  
  // Get user ID from session
  const userId = await getUserIdFromRequest(request);
  
  // If no user ID, return free tier
  if (!userId) {
    return 'free';
  }
  
  // Get subscription tier from database
  return getUserSubscriptionFromDatabase(userId);
}

/**
 * Get the user ID from the request (session, cookie, or headers)
 * 
 * @param request - The Next.js request object
 * @returns The user ID or null if not authenticated
 */
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Check for user ID in headers (for API routes)
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) {
    return headerUserId;
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    try {
      // In a real app, verify the session token
      // For now, return a placeholder user ID if session exists
      return 'session-user-id';
    } catch (error) {
      console.error('Error verifying session:', error);
      return null;
    }
  }
  
  return null;
}

/**
 * Get the user's subscription tier from the database
 * 
 * @param userId - The user ID to look up
 * @returns The user's subscription tier
 */
async function getUserSubscriptionFromDatabase(userId: string): Promise<SubscriptionTier> {
  console.warn(`${UTILS_DISABLED_MSG} User ID: ${userId}. Returning 'business' as default during transition.`);
  // try {
  //   // Check if Firebase db is initialized
  //   if (!db) {
  //     console.error("Firebase Firestore not initialized");
  //     return 'free';
  //   }
    
  //   // Query the users collection for the user's subscription tier
  //   const userQuery = query(collection(db, 'users'), where('uid', '==', userId));
  //   const userSnapshot = await getDocs(userQuery);
    
  //   if (userSnapshot.empty) {
  //     // User not found in database, default to free
  //     return 'free';
  //   }
    
  //   // Get subscription tier from user document
  //   const userData = userSnapshot.docs[0].data();
  //   // Map subscriptionTier to SubscriptionTier enum
  //   // Note: adjust this mapping based on how tiers are stored in your database
  //   const tier = userData.subscriptionTier || 'free';
    
  //   // Convert tier to our SubscriptionTier type
  //   if (['free', 'premium', 'business'].includes(tier)) {
  //     return tier as SubscriptionTier;
  //   }
    
  //   // Handle legacy or custom tier names if needed
  //   if (tier === 'platinum') {
  //     return 'business';
  //   }
    
  //   return 'free';
  // } catch (error) {
  //   console.error('Error getting subscription from database:', error);
  //   return 'free';
  // }
  return 'business'; // Defaulting to 'business' as per dev logic for now
} 