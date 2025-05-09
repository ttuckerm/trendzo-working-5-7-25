import { cookies } from 'next/headers';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Firestore collection names
const USERS_COLLECTION = 'users';
const SESSIONS_COLLECTION = 'sessions';

/**
 * Simple authentication helper to check if user is logged in
 * This emulates the behavior of next-auth/auth but works with our Firebase Auth setup
 */
export async function auth() {
  try {
    // Try to get the session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      console.log('No session cookie found');
      return null;
    }
    
    // Look up session in Firestore
    const sessionsRef = collection(db, SESSIONS_COLLECTION);
    const q = query(sessionsRef, where('token', '==', sessionCookie));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No session found for token');
      return null;
    }
    
    // Get session data
    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();
    
    // Check if session is expired
    if (sessionData.expires && new Date(sessionData.expires) < new Date()) {
      console.log('Session expired');
      return null;
    }
    
    // Get user data
    const userRef = doc(db, USERS_COLLECTION, sessionData.userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('User not found');
      return null;
    }
    
    const userData = userDoc.data();
    
    // Return session object similar to next-auth
    return {
      user: {
        id: userDoc.id,
        name: userData.name || null,
        email: userData.email || null,
        image: userData.photoURL || null,
        role: userData.role || 'user',
        isPremium: userData.isPremium || false
      },
      expires: sessionData.expires
    };
    
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
} 