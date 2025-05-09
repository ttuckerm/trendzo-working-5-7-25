import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  // Get the auth context
  const authContext = useContext(AuthContext);
  
  // In development mode, ensure we always have a mock user
  if (process.env.NODE_ENV === 'development' && !authContext.user) {
    // Return a development version of the context with a mock user
    return {
      ...authContext,
      loading: false,
      user: {
        uid: 'dev-user-123',
        email: 'dev@example.com',
        displayName: 'Dev User',
        emailVerified: true,
        isAnonymous: false,
        // Add other required properties with mock values
        getIdToken: async () => 'mock-token',
      } as any,
      isAdmin: true, // Make the dev user an admin for testing
    };
  }
  
  return authContext;
};