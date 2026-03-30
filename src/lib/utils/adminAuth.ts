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
    // Use the server auth module to get the authenticated user
    const { getAuthenticatedUser } = await import('@/lib/auth/server-auth');
    const { user, error } = await getAuthenticatedUser(request);

    if (!user) {
      return { success: false, error: error || 'Not authenticated' };
    }

    // Check if user has admin role (chairman or sub_admin)
    if (user.role !== 'chairman' && user.role !== 'sub_admin') {
      return { success: false, error: 'User is not an admin' };
    }

    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Error verifying admin auth:', error);
    return {
      success: false,
      error: `Auth verification error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 