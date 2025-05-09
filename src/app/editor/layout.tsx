"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, FileText, Settings, User } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [bypassDev, setBypassDev] = useState(false);

  // In development, allow access without auth checks
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setBypassDev(true);
    }
  }, []);

  // If loading auth state, show loading indicator
  if (loading && !bypassDev) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user and not in dev mode, show login prompt
  if (!user && !bypassDev) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-bold">Login Required</h1>
        <p className="mb-8 max-w-md text-gray-600">
          You need to be logged in to access the editor. Please sign in to continue.
        </p>
        <Link
          href="/auth/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-800 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600">
              <span className="font-bold text-white">T</span>
            </div>
            <span className="text-lg font-semibold">Trendzo</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/dashboard"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Home
                  size={18}
                  className={
                    pathname === "/dashboard" ? "text-blue-600" : "text-gray-500"
                  }
                />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/editor"
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  pathname === "/editor" || pathname.startsWith("/editor/")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FileText
                  size={18}
                  className={
                    pathname === "/editor" || pathname.startsWith("/editor/")
                      ? "text-blue-600"
                      : "text-gray-500"
                  }
                />
                <span>Editor</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              <Menu size={20} />
              <span className="sr-only">Open sidebar</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Template Editor</h1>
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <span className="text-sm font-medium text-white">
                  {user?.displayName?.[0] || bypassDev ? "D" : "U"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
} 