// import { NextRequest } from 'next/server';
// import { auth } from '@/lib/firebase/firebase'; // Firebase db is null, not used
// import { getAuth, Auth } from 'firebase/auth'; // Not used
// import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Not used
import { NextRequest } from 'next/server'; // Keep this one

/**
 * Result of admin authentication verification
 */
interface AdminAuthResult {
  success: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify if the request is from an admin user
 * @param request The NextRequest object
 * @returns AdminAuthResult with success flag and error message if applicable
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Check if we're in development mode with auth disabled
    const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true';
    const isDev = process.env.NODE_ENV === 'development';
    
    // In development mode, allow access if auth is disabled or testing
    if (isDev && (disableAuth || process.env.TESTING_MODE === 'true')) {
      console.log('Dev mode with auth disabled - allowing admin access');
      return { success: true, userId: 'dev-admin' };
    }
    
    // For now, since we don't have proper token verification in place,
    // we'll allow admin access in development mode
    if (isDev) {
      console.log('Dev mode - allowing admin access');
      return { success: true, userId: 'dev-admin' };
    }
    
    // When proper Firebase Admin is set up, uncomment the code below:
    /*
    // Get the token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.substring(7);
    
    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get admin email from environment
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    
    // If no admin email is set, fail
    if (!adminEmail) {
      return { success: false, error: 'Admin email not configured' };
    }
    
    // Check if the user is the admin
    if (decodedToken.email !== adminEmail) {
      return { success: false, error: 'User is not an admin' };
    }
    
    return { success: true, userId: decodedToken.uid };
    */
    
    // For production, we return failure
    if (!isDev) {
      return { success: false, error: 'Admin verification not implemented for production' };
    }
    
    return { success: true, userId: 'dev-admin' };
    
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return { 
      success: false, 
      error: `Auth verification error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
} 