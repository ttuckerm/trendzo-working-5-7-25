"use client"

import AuthForm from "./AuthForm"
import Link from "next/link"

export default function AuthPage() {
  return (
    <>
      <AuthForm />
      
      {/* Development bypass link - remove in production */}
      <div className="fixed bottom-4 right-4">
        <Link 
          href="/auth/bypass-auth" 
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs hover:bg-gray-300 transition-colors"
        >
          Dev Access
        </Link>
      </div>
    </>
  );
} 