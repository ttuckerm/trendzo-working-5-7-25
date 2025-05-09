import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { auth as firebaseAuth } from "@/lib/firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Extend the Session type to include the user id
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // In development mode, create a mock user to prevent authentication errors
        if (process.env.NODE_ENV === "development") {
          console.log("🧪 DEV MODE in NextAuth: Creating mock session");
          return {
            id: "dev-user-123",
            name: "Development User",
            email: "dev@example.com",
            image: null,
          };
        }

        if (!credentials?.email || !credentials?.password || !firebaseAuth) {
          return null;
        }

        try {
          // Use Firebase authentication
          const userCredential = await signInWithEmailAndPassword(
            firebaseAuth,
            credentials.email,
            credentials.password
          );
          
          const user = userCredential.user;
          
          return {
            id: user.uid,
            name: user.displayName,
            email: user.email,
            image: user.photoURL,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    // In development, don't redirect to the error page to prevent loops
    ...(process.env.NODE_ENV !== "development" && { error: "/auth/error" }),
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      
      // In development, ensure we always have a valid session with an ID
      if (process.env.NODE_ENV === "development" && session?.user && !session.user.id) {
        session.user.id = "dev-user-123";
      }
      
      return session;
    },
    async jwt({ token }) {
      // In development, ensure the token always has a subject (user ID)
      if (process.env.NODE_ENV === "development" && !token.sub) {
        token.sub = "dev-user-123";
      }
      return token;
    }
  },
  // Only enable debug in development when explicitly requested
  debug: process.env.NODE_ENV === "development" && process.env.NEXT_AUTH_DEBUG === "true",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 