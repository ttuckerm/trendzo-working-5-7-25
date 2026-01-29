import { AuthOptions } from 'next-auth';
import { verifyAdminAuth } from '@/lib/utils/adminAuth';
import { NextRequest } from 'next/server';

/**
 * Auth options specifically for admin routes
 * This configures next-auth for the admin interface
 */
export const adminAuthOptions: AuthOptions = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      // Add admin flag to session if user is admin
      if (session?.user) {
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // In a real implementation, this would check if the user is an admin
        // For now, we'll set isAdmin to true in development mode
        token.isAdmin = process.env.NODE_ENV === 'development';
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Helper function to check admin authorization in API routes
 * @param req NextRequest object
 * @returns An object with success status and optional error message
 */
export async function checkAdminAuth(req: NextRequest) {
  // In development mode, always allow access
  if (process.env.NODE_ENV === 'development') {
    return { success: true };
  }
  
  // Use the verifyAdminAuth function to check admin status
  return await verifyAdminAuth(req);
} 