import { NextRequest } from 'next/server';
// import { getAuth } from 'firebase/auth'; // Firebase client SDK
import { mockVerifyToken } from './firebaseAdmin'; // Assumed to be server-side or mock, to be checked later
// import { app } from './firebase'; // Firebase client app instance

const AUTH_HELPER_DISABLED_MSG = "Firebase client auth path disabled in auth-helpers.";

// Get current user from the request
export async function getCurrentUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.split('Bearer ')[1];
  
  if (!token) {
    // console.log("getCurrentUser: No token provided in headers."); // Optional logging
    return null;
  }
  
  // The original code attempted Firebase client auth here, which is now removed.
  // It then fell back to mockVerifyToken.
  // We will now directly use mockVerifyToken and its fallbacks.
  // console.log(`getCurrentUser: ${AUTH_HELPER_DISABLED_MSG}`); // Logging the removal of Firebase path

  try {
    // console.log("getCurrentUser: Attempting token verification via mockVerifyToken."); // Optional logging
    return await mockVerifyToken(token);
  } catch (mockError) {
    console.warn('getCurrentUser: mockVerifyToken failed. Falling back to default user.', mockError);
    
    // Default user for development convenience
    return {
      uid: 'default_user_123',
      email: 'default@example.com',
      name: 'Default User', // Added for more complete mock user
      email_verified: true
      // photoURL, etc., could be added if needed by consumers
    };
  }
} 