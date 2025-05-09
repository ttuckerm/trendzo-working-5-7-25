"use client";

import React, { createContext, useContext, ReactNode } from 'react';

// Define session types
export interface SessionUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

export interface Session {
  user?: SessionUser;
  expires?: string;
}

export type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated';

export interface MockSessionContextValue {
  data: Session | null;
  status: SessionStatus;
  update: (data?: Session) => Promise<Session | null>;
}

// Mock session data
const MOCK_SESSION = {
  user: {
    name: "Dev User",
    email: "dev@example.com",
    image: "https://avatars.githubusercontent.com/u/00000?v=4",
    id: "mock-user-id-12345"
  },
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
  status: "authenticated"
};

// Create a context that mimics the NextAuth SessionContext
const MockSessionContext = createContext<{
  data: typeof MOCK_SESSION;
  status: "authenticated" | "loading" | "unauthenticated";
  update: () => Promise<void>;
}>({
  data: MOCK_SESSION,
  status: "authenticated",
  update: async () => {}
});

// Custom hook to use the mock session (mirrors useSession from next-auth/react)
export const useMockSession = () => useContext(MockSessionContext);

interface MockSessionProviderProps {
  children: ReactNode;
}

/**
 * Mock SessionProvider that simulates the NextAuth SessionProvider
 * This provider is used only in development mode to avoid authentication errors
 * when running the app locally without a real authentication service.
 */
export function MockSessionProvider({ children }: MockSessionProviderProps) {
  // In a real app, this would fetch session data from an API
  const mockSessionValue = {
    data: MOCK_SESSION,
    status: "authenticated" as const,
    update: async () => {
      console.log("Mock session update called");
    }
  };

  return (
    <MockSessionContext.Provider value={mockSessionValue}>
      {children}
    </MockSessionContext.Provider>
  );
}

// This function overrides useSession in development
export function useSession() {
  return useMockSession();
}

// Export a version that automatically logs
export function useSessionWithLogging() {
  const session = useSession();
  console.log('Using mock session:', session);
  return session;
} 