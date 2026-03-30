"use client";

import { useAdminUser } from "@/hooks/useAdminUser";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Protects /admin/* routes.
 * Uses the profiles.role permission system (System A).
 * Requires chairman or sub_admin role.
 */
export default function AdminProtectionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading, isAdmin, error } = useAdminUser();
  const router = useRouter();
  const authCheckComplete = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (authCheckComplete.current) return;
    authCheckComplete.current = true;

    if (!user) {
      router.push('/auth?next=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!isAdmin) {
      // Redirect non-admin users to their home
      const homes: Record<string, string> = {
        agency: '/agency',
        developer: '/dashboard',
        creator: '/dashboard',
        clipper: '/dashboard',
      };
      router.push(homes[role || ''] || '/dashboard');
    }
  }, [user, role, isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h1 className="text-xl font-bold mb-2">Authentication Error</h1>
        <p className="text-red-400">{error.message}</p>
        <button
          onClick={() => router.push('/auth')}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
} 